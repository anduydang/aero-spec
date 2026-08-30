use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProcessErrorCode {
    MissingExecutable,
    SpawnFailed,
    JobAssignmentFailed,
    Timeout,
    OutputTooLarge,
    InvalidUtf8,
    InvalidJson,
    NonZeroExit,
    WaitFailed,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProcessError {
    pub code: ProcessErrorCode,
    pub message: String,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Copy)]
pub struct ProcessLimits {
    pub timeout: Duration,
    pub stdout_bytes: usize,
    pub stderr_bytes: usize,
}

impl ProcessLimits {
    pub fn static_inventory() -> Self {
        Self {
            timeout: Duration::from_secs(12),
            stdout_bytes: 2 * 1024 * 1024,
            stderr_bytes: 256 * 1024,
        }
    }

    pub fn dynamic(timeout: Duration) -> Self {
        Self {
            timeout,
            stdout_bytes: 256 * 1024,
            stderr_bytes: 64 * 1024,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProcessOutput {
    pub stdout: String,
    pub stderr: String,
}

pub fn run_bounded(
    executable: &Path,
    arguments: &[&str],
    limits: ProcessLimits,
) -> Result<ProcessOutput, ProcessError> {
    if !executable.is_file() {
        return Err(process_error(
            ProcessErrorCode::MissingExecutable,
            "Required system executable is unavailable.",
            None,
        ));
    }

    let mut command = Command::new(executable);
    command
        .args(arguments)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

        command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = command.spawn().map_err(|_| {
        process_error(
            ProcessErrorCode::SpawnFailed,
            "System provider could not be started.",
            None,
        )
    })?;

    let job = JobHandle::assign(child.id()).map_err(|_| {
        let _ = child.kill();
        let _ = child.wait();
        process_error(
            ProcessErrorCode::JobAssignmentFailed,
            "System provider could not be isolated.",
            None,
        )
    })?;

    let stdout = child.stdout.take().expect("piped stdout");
    let stderr = child.stderr.take().expect("piped stderr");
    let stdout_reader = thread::spawn(move || read_bounded(stdout, limits.stdout_bytes));
    let stderr_reader = thread::spawn(move || read_bounded(stderr, limits.stderr_bytes));

    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if started.elapsed() < limits.timeout => {
                thread::sleep(Duration::from_millis(10));
            }
            Ok(None) => {
                job.terminate();
                let _ = child.wait();
                let _ = stdout_reader.join();
                let _ = stderr_reader.join();
                return Err(process_error(
                    ProcessErrorCode::Timeout,
                    "System provider timed out.",
                    None,
                ));
            }
            Err(_) => {
                job.terminate();
                let _ = child.wait();
                let _ = stdout_reader.join();
                let _ = stderr_reader.join();
                return Err(process_error(
                    ProcessErrorCode::WaitFailed,
                    "System provider did not complete correctly.",
                    None,
                ));
            }
        }
    };

    let (stdout, stdout_overflow) = stdout_reader.join().map_err(|_| {
        process_error(
            ProcessErrorCode::WaitFailed,
            "System provider output could not be read.",
            None,
        )
    })?;
    let (stderr, stderr_overflow) = stderr_reader.join().map_err(|_| {
        process_error(
            ProcessErrorCode::WaitFailed,
            "System provider output could not be read.",
            None,
        )
    })?;

    if stdout_overflow || stderr_overflow {
        return Err(process_error(
            ProcessErrorCode::OutputTooLarge,
            "System provider returned too much data.",
            status.code(),
        ));
    }
    if !status.success() {
        return Err(process_error(
            ProcessErrorCode::NonZeroExit,
            "System provider reported an error.",
            status.code(),
        ));
    }

    Ok(ProcessOutput {
        stdout: decode_utf8(stdout)?,
        stderr: decode_utf8(stderr)?,
    })
}

pub fn decode_utf8(bytes: Vec<u8>) -> Result<String, ProcessError> {
    String::from_utf8(bytes).map_err(|_| {
        process_error(
            ProcessErrorCode::InvalidUtf8,
            "System provider returned invalid text.",
            None,
        )
    })
}

fn process_error(code: ProcessErrorCode, message: &str, exit_code: Option<i32>) -> ProcessError {
    ProcessError {
        code,
        message: message.to_string(),
        exit_code,
    }
}

fn read_bounded<R: Read>(mut reader: R, limit: usize) -> (Vec<u8>, bool) {
    let mut kept = Vec::with_capacity(limit.min(8192));
    let mut buffer = [0_u8; 8192];
    let mut overflow = false;
    loop {
        match reader.read(&mut buffer) {
            Ok(0) => break,
            Ok(read) => {
                let remaining = limit.saturating_sub(kept.len());
                let take = remaining.min(read);
                kept.extend_from_slice(&buffer[..take]);
                overflow |= take < read;
            }
            Err(_) => break,
        }
    }
    (kept, overflow)
}

#[cfg(windows)]
struct JobHandle(windows_sys::Win32::Foundation::HANDLE);

#[cfg(windows)]
impl JobHandle {
    fn assign(process_id: u32) -> Result<Self, ()> {
        use std::mem::{size_of, zeroed};
        use std::ptr::null;
        use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
        use windows_sys::Win32::System::JobObjects::{
            AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
            SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
            JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
        };
        use windows_sys::Win32::System::Threading::{
            OpenProcess, PROCESS_SET_QUOTA, PROCESS_TERMINATE,
        };

        unsafe {
            let job = CreateJobObjectW(null(), null());
            if job.is_null() || job == INVALID_HANDLE_VALUE {
                return Err(());
            }

            let mut information: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = zeroed();
            information.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            if SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &information as *const _ as *const _,
                size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            ) == 0
            {
                CloseHandle(job);
                return Err(());
            }

            let process = OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, 0, process_id);
            if process.is_null() || process == INVALID_HANDLE_VALUE {
                CloseHandle(job);
                return Err(());
            }
            let assigned = AssignProcessToJobObject(job, process) != 0;
            CloseHandle(process);
            if !assigned {
                CloseHandle(job);
                return Err(());
            }
            Ok(Self(job))
        }
    }

    fn terminate(&self) {
        unsafe {
            windows_sys::Win32::System::JobObjects::TerminateJobObject(self.0, 1);
        }
    }
}

#[cfg(windows)]
impl Drop for JobHandle {
    fn drop(&mut self) {
        unsafe {
            windows_sys::Win32::Foundation::CloseHandle(self.0);
        }
    }
}

#[cfg(not(windows))]
struct JobHandle;

#[cfg(not(windows))]
impl JobHandle {
    fn assign(_process_id: u32) -> Result<Self, ()> {
        Ok(Self)
    }

    fn terminate(&self) {}
}
