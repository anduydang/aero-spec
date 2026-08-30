use std::collections::{BTreeMap, HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::time::Duration;

use super::model::{DisplayAdapter, NvidiaGpu};
use super::parse::parse_nvidia_csv;
use super::process::{run_bounded, ProcessError, ProcessLimits};

pub const NVIDIA_QUERY_ARGUMENTS: [&str; 2] = [
    "--query-gpu=uuid,pci.bus_id,name,memory.total,temperature.gpu,utilization.gpu,power.draw,power.limit,clocks.current.graphics,fan.speed,driver_version",
    "--format=csv,noheader,nounits",
];

#[derive(Debug, Clone, PartialEq)]
pub struct NvidiaIdentity {
    pub gpu: NvidiaGpu,
    pub vendor_id: Option<String>,
    pub device_id: Option<String>,
    pub subsystem_id: Option<String>,
    pub pnp_location: Option<String>,
}

impl From<NvidiaGpu> for NvidiaIdentity {
    fn from(gpu: NvidiaGpu) -> Self {
        Self { gpu, vendor_id: Some("10DE".to_string()), device_id: None, subsystem_id: None, pnp_location: None }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct JoinedNvidiaGpu {
    pub adapter_private_key: String,
    pub gpu: NvidiaGpu,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct NvidiaJoinOutcome {
    pub matches: Vec<JoinedNvidiaGpu>,
    pub diagnostics: Vec<String>,
}

pub fn join_nvidia_gpus(windows: &[DisplayAdapter], nvidia: Vec<NvidiaIdentity>) -> NvidiaJoinOutcome {
    if nvidia.is_empty() { return NvidiaJoinOutcome::default(); }
    let mut outcome = NvidiaJoinOutcome::default();
    let mut used_windows = HashSet::new();
    let mut used_nvidia = HashSet::new();

    join_unique_matches(windows, &nvidia, &mut used_windows, &mut used_nvidia,
        |adapter, gpu| equal_optional(adapter.pci_bus_id.as_deref().map(normalize_pci_bus), gpu.gpu.pci_bus_id.as_deref().map(normalize_pci_bus)), &mut outcome);
    join_unique_matches(windows, &nvidia, &mut used_windows, &mut used_nvidia,
        |adapter, gpu| equal_text(adapter.vendor_id.as_deref(), gpu.vendor_id.as_deref())
            && equal_text(adapter.device_id.as_deref(), gpu.device_id.as_deref())
            && equal_text(adapter.subsystem_id.as_deref(), gpu.subsystem_id.as_deref())
            && equal_text(adapter.pnp_instance_id.as_deref(), gpu.pnp_location.as_deref()), &mut outcome);

    let remaining_windows = windows.iter().enumerate().filter(|(index, adapter)| !used_windows.contains(index) && is_nvidia_name(&adapter.name)).collect::<Vec<_>>();
    let remaining_nvidia = nvidia.iter().enumerate().filter(|(index, _)| !used_nvidia.contains(index)).collect::<Vec<_>>();
    if remaining_windows.len() == 1 && remaining_nvidia.len() == 1 {
        let (window_index, adapter) = remaining_windows[0];
        let (nvidia_index, gpu) = remaining_nvidia[0];
        if normalize(&adapter.name) == normalize(&gpu.gpu.name) {
            used_windows.insert(window_index);
            used_nvidia.insert(nvidia_index);
            outcome.matches.push(JoinedNvidiaGpu { adapter_private_key: adapter.private_key.clone(), gpu: gpu.gpu.clone() });
        }
    }
    if used_nvidia.len() != nvidia.len() && (!windows.is_empty() || nvidia.len() > 1) {
        outcome.diagnostics.push("GPU_JOIN_AMBIGUOUS".to_string());
    }
    outcome.matches.sort_by(|left, right| normalize(&left.adapter_private_key).cmp(&normalize(&right.adapter_private_key)));
    outcome.diagnostics.sort();
    outcome.diagnostics.dedup();
    outcome
}

fn join_unique_matches<F>(windows: &[DisplayAdapter], nvidia: &[NvidiaIdentity], used_windows: &mut HashSet<usize>, used_nvidia: &mut HashSet<usize>, predicate: F, outcome: &mut NvidiaJoinOutcome)
where F: Fn(&DisplayAdapter, &NvidiaIdentity) -> bool {
    for (nvidia_index, gpu) in nvidia.iter().enumerate() {
        if used_nvidia.contains(&nvidia_index) { continue; }
        let candidates = windows.iter().enumerate().filter(|(windows_index, adapter)| !used_windows.contains(windows_index) && predicate(adapter, gpu)).collect::<Vec<_>>();
        if candidates.len() == 1 {
            let (windows_index, adapter) = candidates[0];
            used_windows.insert(windows_index);
            used_nvidia.insert(nvidia_index);
            outcome.matches.push(JoinedNvidiaGpu { adapter_private_key: adapter.private_key.clone(), gpu: gpu.gpu.clone() });
        } else if candidates.len() > 1 {
            outcome.diagnostics.push("GPU_JOIN_AMBIGUOUS".to_string());
        }
    }
}

fn equal_optional(left: Option<String>, right: Option<String>) -> bool { matches!((left, right), (Some(left), Some(right)) if left == right) }
fn equal_text(left: Option<&str>, right: Option<&str>) -> bool { matches!((left, right), (Some(left), Some(right)) if normalize(left) == normalize(right)) }
fn normalize(value: &str) -> String { value.split_whitespace().collect::<Vec<_>>().join(" ").to_ascii_lowercase() }
fn normalize_pci_bus(value: &str) -> String { let mut parts = value.trim().split(':').collect::<Vec<_>>(); if parts.len() == 3 { parts.remove(0); } parts.join(":").to_ascii_lowercase() }
fn is_nvidia_name(name: &str) -> bool { let value = normalize(name); value.contains("nvidia") || value.contains("geforce") }

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct LocalIdAssignments {
    pub local_ids: Vec<String>,
    pub lookup: BTreeMap<String, String>,
    pub diagnostics: Vec<String>,
}

pub fn assign_local_ids(category: &str, identities: &[(String, String)]) -> LocalIdAssignments {
    let mut order = (0..identities.len()).collect::<Vec<_>>();
    order.sort_by(|left, right| normalize(&identities[*left].0).cmp(&normalize(&identities[*right].0)).then_with(|| normalize(&identities[*left].1).cmp(&normalize(&identities[*right].1))).then_with(|| left.cmp(right)));
    let mut result = LocalIdAssignments { local_ids: vec![String::new(); identities.len()], ..LocalIdAssignments::default() };
    let mut counts = HashMap::new();
    for (ordinal, index) in order.into_iter().enumerate() {
        let key = identities[index].0.clone();
        let local_id = format!("{category}:{ordinal}");
        result.local_ids[index] = local_id.clone();
        result.lookup.entry(key.clone()).or_insert(local_id);
        *counts.entry(normalize(&key)).or_insert(0_usize) += 1;
    }
    if counts.values().any(|count| *count > 1) { result.diagnostics.push("LOCAL_ID_COLLISION".to_string()); }
    result
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DynamicGenerationToken { generation: u64, revision: u64 }

#[derive(Debug, Clone, Default)]
pub struct GenerationState { generation: Option<u64>, revision: u64, identity_map: BTreeMap<String, String> }

impl GenerationState {
    pub fn accept_static(&mut self, generation: u64, identity_map: BTreeMap<String, String>) -> bool {
        if self.generation.is_some_and(|accepted| generation < accepted) { return false; }
        self.generation = Some(generation);
        self.revision = self.revision.wrapping_add(1);
        self.identity_map = identity_map;
        true
    }
    pub fn begin_dynamic(&self, inventory_generation: u64) -> Option<DynamicGenerationToken> {
        (self.generation == Some(inventory_generation)).then_some(DynamicGenerationToken { generation: inventory_generation, revision: self.revision })
    }
    pub fn finish_dynamic(&self, token: &DynamicGenerationToken) -> bool { self.generation == Some(token.generation) && self.revision == token.revision }
    pub fn generation(&self) -> Option<u64> { self.generation }
    pub fn identity_map(&self) -> &BTreeMap<String, String> { &self.identity_map }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrustResult { Success, Failed, Unknown }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CandidateEvidence {
    pub every_segment_is_regular: bool,
    pub canonical_path_is_beneath_base: bool,
    pub trust: TrustResult,
    pub signer_organization: Option<String>,
}

pub fn validate_candidate_evidence(evidence: &CandidateEvidence) -> Result<(), &'static str> {
    if !evidence.every_segment_is_regular || !evidence.canonical_path_is_beneath_base { return Err("NVIDIA_PATH_REJECTED"); }
    if evidence.trust != TrustResult::Success { return Err("NVIDIA_SIGNATURE_REJECTED"); }
    if evidence.signer_organization.as_deref() != Some("NVIDIA Corporation") { return Err("NVIDIA_SIGNER_REJECTED"); }
    Ok(())
}

#[derive(Debug)]
pub enum NvidiaProviderError { Process(ProcessError), InvalidOutput }
impl From<ProcessError> for NvidiaProviderError { fn from(error: ProcessError) -> Self { Self::Process(error) } }

pub fn collect_nvidia() -> Result<Option<Vec<NvidiaGpu>>, NvidiaProviderError> {
    let Some(executable) = discover_nvidia_smi() else { return Ok(None); };
    let output = run_bounded(&executable, &NVIDIA_QUERY_ARGUMENTS, ProcessLimits::dynamic(Duration::from_secs(2)))?;
    parse_nvidia_csv(&output.stdout).map(Some).map_err(|_| NvidiaProviderError::InvalidOutput)
}

#[cfg(windows)]
fn discover_nvidia_smi() -> Option<PathBuf> {
    trusted_candidates().into_iter().find(|(base, candidate)| validate_candidate(base, candidate)).map(|(_, candidate)| candidate)
}
#[cfg(not(windows))]
fn discover_nvidia_smi() -> Option<PathBuf> { None }

#[cfg(windows)]
fn validate_candidate(base: &Path, candidate: &Path) -> bool {
    let (trust, signer_organization) = authenticode_evidence(candidate);
    validate_candidate_evidence(&CandidateEvidence {
        every_segment_is_regular: has_no_reparse_segments(base, candidate),
        canonical_path_is_beneath_base: canonical_path_is_beneath(base, candidate),
        trust,
        signer_organization,
    }).is_ok()
}

#[cfg(windows)]
fn trusted_candidates() -> Vec<(PathBuf, PathBuf)> {
    let mut candidates = Vec::new();
    if let Some(base) = system_directory() { candidates.push((base.clone(), base.join("nvidia-smi.exe"))); }
    if let Some(program_files) = program_files_directory() {
        let base = program_files.join("NVIDIA Corporation").join("NVSMI");
        candidates.push((base.clone(), base.join("nvidia-smi.exe")));
    }
    candidates
}

#[cfg(windows)]
fn system_directory() -> Option<PathBuf> {
    use windows_sys::Win32::System::SystemInformation::GetSystemDirectoryW;
    let mut buffer = vec![0_u16; 32_768];
    let length = unsafe { GetSystemDirectoryW(buffer.as_mut_ptr(), buffer.len() as u32) } as usize;
    (length > 0 && length < buffer.len()).then(|| String::from_utf16(&buffer[..length]).ok()).flatten().map(PathBuf::from)
}

#[cfg(windows)]
fn program_files_directory() -> Option<PathBuf> {
    use std::ptr::null_mut;
    use windows_sys::Win32::System::Com::CoTaskMemFree;
    use windows_sys::Win32::UI::Shell::{SHGetKnownFolderPath, FOLDERID_ProgramFiles};
    let mut raw = null_mut();
    let result = unsafe { SHGetKnownFolderPath(&FOLDERID_ProgramFiles, 0, null_mut(), &mut raw) };
    if result < 0 || raw.is_null() { return None; }
    let length = unsafe { let mut length = 0_usize; while *raw.add(length) != 0 { length += 1; } length };
    let value = String::from_utf16(unsafe { std::slice::from_raw_parts(raw, length) }).ok();
    unsafe { CoTaskMemFree(raw.cast()) };
    value.map(PathBuf::from)
}

#[cfg(windows)]
fn has_no_reparse_segments(base: &Path, candidate: &Path) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;
    if !candidate.starts_with(base) { return false; }
    let mut current = base.to_path_buf();
    let mut paths = vec![current.clone()];
    let Ok(relative) = candidate.strip_prefix(base) else { return false; };
    for component in relative.components() { current.push(component.as_os_str()); paths.push(current.clone()); }
    paths.into_iter().all(|path| std::fs::symlink_metadata(path).map(|metadata| metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT == 0).unwrap_or(false))
}

#[cfg(windows)]
fn canonical_path_is_beneath(base: &Path, candidate: &Path) -> bool {
    let (Ok(base), Ok(candidate)) = (base.canonicalize(), candidate.canonicalize()) else { return false; };
    let base = base.to_string_lossy().to_ascii_lowercase();
    let candidate = candidate.to_string_lossy().to_ascii_lowercase();
    candidate == base || candidate.starts_with(&(base + "\\"))
}

#[cfg(windows)]
fn authenticode_evidence(path: &Path) -> (TrustResult, Option<String>) {
    use std::ffi::c_void;
    use std::mem::size_of;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::{null_mut};
    use windows_sys::Win32::Security::Cryptography::{CertGetNameStringW, CERT_NAME_ATTR_TYPE};
    use windows_sys::Win32::Security::WinTrust::{WinVerifyTrust, WTHelperGetProvCertFromChain, WTHelperGetProvSignerFromChain, WTHelperProvDataFromStateData, WINTRUST_ACTION_GENERIC_VERIFY_V2, WINTRUST_DATA, WINTRUST_FILE_INFO, WTD_CHOICE_FILE, WTD_REVOKE_WHOLECHAIN, WTD_STATEACTION_CLOSE, WTD_STATEACTION_VERIFY, WTD_UI_NONE};

    let wide = path.as_os_str().encode_wide().chain(Some(0)).collect::<Vec<_>>();
    let mut file = WINTRUST_FILE_INFO { cbStruct: size_of::<WINTRUST_FILE_INFO>() as u32, pcwszFilePath: wide.as_ptr(), hFile: null_mut(), pgKnownSubject: null_mut() };
    let mut data = WINTRUST_DATA { cbStruct: size_of::<WINTRUST_DATA>() as u32, dwUIChoice: WTD_UI_NONE, fdwRevocationChecks: WTD_REVOKE_WHOLECHAIN, dwUnionChoice: WTD_CHOICE_FILE, dwStateAction: WTD_STATEACTION_VERIFY, ..WINTRUST_DATA::default() };
    data.Anonymous.pFile = &mut file;
    let mut action = WINTRUST_ACTION_GENERIC_VERIFY_V2;
    let status = unsafe { WinVerifyTrust(null_mut(), &mut action, (&mut data as *mut WINTRUST_DATA).cast::<c_void>()) };
    if status != 0 { return (TrustResult::Failed, None); }

    let organization = unsafe {
        let provider = WTHelperProvDataFromStateData(data.hWVTStateData);
        let signer = if provider.is_null() { null_mut() } else { WTHelperGetProvSignerFromChain(provider, 0, 0, 0) };
        let certificate = if signer.is_null() { null_mut() } else { WTHelperGetProvCertFromChain(signer, 0) };
        if certificate.is_null() || (*certificate).pCert.is_null() { None } else {
            const ORGANIZATION_OID: &[u8] = b"2.5.4.10\0";
            let parameter = ORGANIZATION_OID.as_ptr().cast::<c_void>();
            let required = CertGetNameStringW((*certificate).pCert, CERT_NAME_ATTR_TYPE, 0, parameter, null_mut(), 0);
            if required <= 1 { None } else {
                let mut buffer = vec![0_u16; required as usize];
                let written = CertGetNameStringW((*certificate).pCert, CERT_NAME_ATTR_TYPE, 0, parameter, buffer.as_mut_ptr(), required);
                (written > 1).then(|| String::from_utf16(&buffer[..written as usize - 1]).ok()).flatten()
            }
        }
    };
    data.dwStateAction = WTD_STATEACTION_CLOSE;
    unsafe { WinVerifyTrust(null_mut(), &mut action, (&mut data as *mut WINTRUST_DATA).cast::<c_void>()); }
    (TrustResult::Success, organization)
}

include!("nvidia.rs");
