use std::sync::{Arc, Condvar, Mutex};

struct Flight<T> {
    result: Mutex<Option<Result<Arc<T>, String>>>,
    ready: Condvar,
}

impl<T> Default for Flight<T> {
    fn default() -> Self {
        Self {
            result: Mutex::new(None),
            ready: Condvar::new(),
        }
    }
}

pub struct SingleFlight<T> {
    active: Mutex<Option<Arc<Flight<T>>>>,
}

impl<T> Default for SingleFlight<T> {
    fn default() -> Self {
        Self {
            active: Mutex::new(None),
        }
    }
}

impl<T> SingleFlight<T> {
    pub fn run<F>(&self, collect: F) -> Result<Arc<T>, String>
    where
        F: FnOnce() -> Result<T, String>,
    {
        let (flight, leader) = {
            let mut active = self.active.lock().map_err(|_| "COLLECTION_STATE_ERROR")?;
            match active.as_ref() {
                Some(flight) => (Arc::clone(flight), false),
                None => {
                    let flight = Arc::new(Flight::default());
                    *active = Some(Arc::clone(&flight));
                    (flight, true)
                }
            }
        };

        if leader {
            let result = collect().map(Arc::new);
            {
                let mut stored = flight.result.lock().map_err(|_| "COLLECTION_STATE_ERROR")?;
                *stored = Some(result.clone());
                flight.ready.notify_all();
            }
            let mut active = self.active.lock().map_err(|_| "COLLECTION_STATE_ERROR")?;
            if active.as_ref().is_some_and(|current| Arc::ptr_eq(current, &flight)) {
                *active = None;
            }
            result
        } else {
            let mut stored = flight.result.lock().map_err(|_| "COLLECTION_STATE_ERROR")?;
            while stored.is_none() {
                stored = flight.ready.wait(stored).map_err(|_| "COLLECTION_STATE_ERROR")?;
            }
            stored.clone().expect("single-flight result")
        }
    }
}
