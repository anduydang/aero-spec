#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;
    use std::time::Duration;

    use super::{
        assign_local_ids, join_nvidia_gpus, validate_candidate_evidence, CandidateEvidence,
        GenerationState, NvidiaIdentity, TrustResult, NVIDIA_QUERY_ARGUMENTS,
    };
    use crate::telemetry::model::{DisplayAdapter, NvidiaGpu};
    use crate::telemetry::process::ProcessLimits;

    fn adapter(
        private_key: &str,
        name: &str,
        pci_bus_id: Option<&str>,
        device_id: Option<&str>,
        subsystem_id: Option<&str>,
        pnp_location: Option<&str>,
    ) -> DisplayAdapter {
        DisplayAdapter {
            private_key: private_key.to_string(),
            pnp_instance_id: pnp_location.map(str::to_string),
            name: name.to_string(),
            vendor_id: Some("10DE".to_string()),
            device_id: device_id.map(str::to_string),
            subsystem_id: subsystem_id.map(str::to_string),
            pci_bus_id: pci_bus_id.map(str::to_string),
            driver_version: None,
        }
    }

    fn nvidia(
        name: &str,
        pci_bus_id: Option<&str>,
        device_id: Option<&str>,
        subsystem_id: Option<&str>,
        pnp_location: Option<&str>,
    ) -> NvidiaIdentity {
        NvidiaIdentity {
            gpu: NvidiaGpu {
                uuid: Some("GPU-REDACTED".to_string()),
                pci_bus_id: pci_bus_id.map(str::to_string),
                name: name.to_string(),
                memory_total_mib: Some(8192),
                temperature_c: Some(49.0),
                utilization_percent: Some(6.0),
                power_draw_w: Some(31.63),
                power_limit_w: Some(184.0),
                graphics_clock_mhz: Some(885),
                fan_speed_percent: None,
                driver_version: Some("596.49".to_string()),
            },
            vendor_id: Some("10de".to_string()),
            device_id: device_id.map(str::to_string),
            subsystem_id: subsystem_id.map(str::to_string),
            pnp_location: pnp_location.map(str::to_string),
        }
    }

    #[test]
    fn exact_pci_bus_join_wins() {
        let windows = vec![adapter("windows-gpu-a", "Windows identity", Some("00000000:01:00.0"), None, None, None)];
        let outcome = join_nvidia_gpus(&windows, vec![nvidia("NVIDIA GeForce RTX 2060 SUPER", Some("0000:01:00.0"), None, None, None)]);
        assert_eq!(outcome.matches.len(), 1);
        assert_eq!(outcome.matches[0].adapter_private_key, "windows-gpu-a");
        assert!(outcome.diagnostics.is_empty());
    }

    #[test]
    fn tuple_and_pnp_location_are_a_safe_fallback() {
        let windows = vec![adapter("windows-gpu-b", "Display Adapter", None, Some("1F06"), Some("3FC11458"), Some("PCI bus 1, device 0, function 0"))];
        let outcome = join_nvidia_gpus(&windows, vec![nvidia("NVIDIA GeForce RTX 2060 SUPER", None, Some("1f06"), Some("3fc11458"), Some("pci bus 1, device 0, function 0"))]);
        assert_eq!(outcome.matches[0].adapter_private_key, "windows-gpu-b");
    }

    #[test]
    fn name_fallback_requires_exactly_one_device_on_each_side() {
        let one = join_nvidia_gpus(&[adapter("only", "NVIDIA GeForce RTX 2060 SUPER", None, None, None, None)], vec![nvidia("NVIDIA GeForce RTX 2060 SUPER", None, None, None, None)]);
        assert_eq!(one.matches.len(), 1);

        let ambiguous = join_nvidia_gpus(
            &[
                adapter("a", "NVIDIA GeForce RTX 2060 SUPER", None, None, None, None),
                adapter("b", "NVIDIA GeForce RTX 2060 SUPER", None, None, None, None),
            ],
            vec![
                nvidia("NVIDIA GeForce RTX 2060 SUPER", None, None, None, None),
                nvidia("NVIDIA GeForce RTX 2060 SUPER", None, None, None, None),
            ],
        );
        assert!(ambiguous.matches.is_empty());
        assert!(ambiguous.diagnostics.contains(&"GPU_JOIN_AMBIGUOUS".to_string()));
    }

    #[test]
    fn local_ids_follow_private_key_then_name_and_report_collisions() {
        let assigned = assign_local_ids("gpu", &[
            ("key-b".to_string(), "Zulu".to_string()),
            ("key-a".to_string(), "Beta".to_string()),
            ("key-a".to_string(), "Alpha".to_string()),
        ]);
        assert_eq!(assigned.local_ids, vec!["gpu:2", "gpu:1", "gpu:0"]);
        assert_eq!(assigned.lookup.get("key-a"), Some(&"gpu:0".to_string()));
        assert_eq!(assigned.diagnostics, vec!["LOCAL_ID_COLLISION"]);
    }

    #[test]
    fn generations_replace_identity_maps_atomically_and_reject_old_work() {
        let mut state = GenerationState::default();
        let map_2 = BTreeMap::from([("gpu-key".to_string(), "gpu:0".to_string())]);
        let map_3 = BTreeMap::from([("gpu-new".to_string(), "gpu:0".to_string())]);
        assert!(state.accept_static(2, map_2.clone()));
        let token = state.begin_dynamic(2).expect("accepted generation");
        assert!(state.accept_static(3, map_3.clone()));
        assert!(!state.finish_dynamic(&token));
        assert!(!state.accept_static(1, map_2));
        assert_eq!(state.generation(), Some(3));
        assert_eq!(state.identity_map(), &map_3);
    }

    #[test]
    fn absent_nvidia_is_supported_neutral() {
        let outcome = join_nvidia_gpus(&[], vec![]);
        assert!(outcome.matches.is_empty());
        assert!(outcome.diagnostics.is_empty());
    }

    #[test]
    fn query_order_and_dynamic_limits_are_fixed() {
        assert_eq!(NVIDIA_QUERY_ARGUMENTS, [
            "--query-gpu=uuid,pci.bus_id,name,memory.total,temperature.gpu,utilization.gpu,power.draw,power.limit,clocks.current.graphics,fan.speed,driver_version",
            "--format=csv,noheader,nounits",
        ]);
        let limits = ProcessLimits::dynamic(Duration::from_secs(2));
        assert_eq!(limits.timeout, Duration::from_secs(2));
        assert_eq!(limits.stdout_bytes, 256 * 1024);
        assert_eq!(limits.stderr_bytes, 64 * 1024);
    }

    #[test]
    fn candidate_policy_fails_closed_for_path_signer_and_trust_failures() {
        let valid = CandidateEvidence {
            every_segment_is_regular: true,
            canonical_path_is_beneath_base: true,
            trust: TrustResult::Success,
            signer_organization: Some("NVIDIA Corporation".to_string()),
        };
        assert!(validate_candidate_evidence(&valid).is_ok());
        for evidence in [
            CandidateEvidence { every_segment_is_regular: false, ..valid.clone() },
            CandidateEvidence { canonical_path_is_beneath_base: false, ..valid.clone() },
            CandidateEvidence { signer_organization: Some("Microsoft Corporation".to_string()), ..valid.clone() },
            CandidateEvidence { signer_organization: Some("NVIDIA Corporation LLC".to_string()), ..valid.clone() },
            CandidateEvidence { trust: TrustResult::Failed, ..valid.clone() },
            CandidateEvidence { trust: TrustResult::Unknown, ..valid },
        ] {
            assert!(validate_candidate_evidence(&evidence).is_err());
        }
    }
}
