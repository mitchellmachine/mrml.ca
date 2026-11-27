# Historical patent-review source-path migration

Patent-review entries preserve the source paths that were current when each
review occurred. They are historical evidence and must not be rewritten merely
because the repository moved files. Use this map when following an older entry
to the current source tree.

| Historical path | Current path |
| --- | --- |
| `crates/mrml-kernel/` | `packages/system/kernel/` |
| `crates/mrml-kernel-image/` | `packages/system/bootloader/` |
| `crates/mrml-service-image/` | `packages/system/service-image/` |
| `crates/mrml-kvm/` | `packages/system/vmm/kvm/` |
| `crates/mrml-whp/` | `packages/system/vmm/whp/` |
| `crates/mrml-kvm-run/` | `packages/tools/vmm/kvm-run/` |
| `crates/mrml-whp-run/` | `packages/tools/vmm/whp-run/` |
| `crates/mrml-config/` | `packages/services/config/` |
| `crates/mrml-storage/` | `packages/services/storage/` |
| `crates/mrml-uefi/` | `packages/libraries/uefi/` |
| `crates/mrml-kernel-bench/` | `packages/tests/kernel-bench/` |
| `crates/mrml-sign/` | `packages/tools/sign/` |
| `crates/mrml-tensor/` | `packages/gpu/tensor/` |
| `crates/mrml-rustc/` | `packages/compiler/core/` |
| `crates/mrml-rustc-driver/` | `packages/compiler/driver/` |
| `crates/mrml-model/` | `packages/libraries/model/` |
| `crates/mrml-agent/` | `packages/libraries/agent/` |
| `crates/mrml-cli/` | `packages/apps/cli/` |
| `crates/mrml-machine/` | `packages/apps/machine/` |
| `crates/mrml-server/` | `packages/apps/server/` |
| `crates/mrml-trainer/` | `packages/tools/trainer/` |

Brace-expanded historical forms map component by component. For example,
`crates/mrml-{kvm,whp}/src/native/launch.rs` maps to
`packages/system/vmm/{kvm,whp}/src/native/launch.rs`, and
`crates/mrml-{kvm,whp}-run/src/main.rs` maps to
`packages/tools/vmm/{kvm,whp}-run/src/main.rs`. The historical wording, review
date, mechanism, result, and evidence limits remain authoritative; this file
changes only source-path lookup.
