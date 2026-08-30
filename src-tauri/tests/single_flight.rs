use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Barrier};
use std::thread;
use std::time::Duration;

use app_lib::telemetry::commands::SingleFlight;

#[test]
fn overlapping_requests_share_one_immutable_collection() {
    let flight = Arc::new(SingleFlight::default());
    let barrier = Arc::new(Barrier::new(2));
    let calls = Arc::new(AtomicUsize::new(0));

    let handles = (0..2)
        .map(|_| {
            let flight = Arc::clone(&flight);
            let barrier = Arc::clone(&barrier);
            let calls = Arc::clone(&calls);
            thread::spawn(move || {
                barrier.wait();
                flight.run(|| {
                    calls.fetch_add(1, Ordering::SeqCst);
                    thread::sleep(Duration::from_millis(50));
                    Ok::<_, String>("snapshot".to_string())
                })
            })
        })
        .collect::<Vec<_>>();

    for handle in handles {
        assert_eq!(handle.join().unwrap().unwrap().as_str(), "snapshot");
    }
    assert_eq!(calls.load(Ordering::SeqCst), 1);
}
