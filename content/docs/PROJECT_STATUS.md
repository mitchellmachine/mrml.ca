# MRML project status

This page separates the current design direction from dated test evidence.
Unless noted otherwise, the earlier evidence in the table was recorded on
2026-11-26 at `f33cf6a9`. This page is not a release, deployment record, or
production-readiness claim. For project rules and definitions, read [Architecture](ARCHITECTURE.md)
and the [Engineering Constitution](ENGINEERING_CONSTITUTION.md).

## Current direction

- **MRML OS:** strict [Total MicroVM isolation](ISOLATION_PLACEMENT.md) is the
  only operating mode. Ordinary applications and services run in admitted
  microVMs or remain unavailable. Full-system operation is incomplete.
- **Platforms:** x86-64 is the primary OS bring-up target. Build tooling, the
  experimental compiler, local ML, media libraries, and the Git client have
  native Windows/Linux host targets. WHP is Windows-specific and KVM is
  Linux-specific. macOS host support and ARM64 support are **PLANNED**.
  macOS is not currently covered by CI.
- **USB:** signed KVM diagnostics at `40554703` wrote, flushed, and reread
  the exact `PROBE.TXT` marker through emulated xHCI on USB 2 and USB 3.
  Independent whole-image checks found only the expected three bytes changed.
  Native controller handoff and physical writes are not verified. See
  [storage evidence](storage/STORAGE_AND_OPTICAL.md) and the
  [hardware inventory](platform/UEFI_BOOT_MANAGEMENT.md#read-only-xhci-inventory-before-native-bring-up).

| Area | What's in the project | Evidence and limits |
| --- | --- | --- |
| Build and packaging | Manifest V2, a locked package graph, direct native build/test actions, canonical package creation and verification, and fixed boot SystemRelease tooling. Cargo bootstraps the frontend; upstream Rust remains the production backend. | `mrml manifest check`: 71 components and 215 dependencies. `mrml manifest lock --check`: 71 packages and five interface lock records. General Store publication and complete installation workflows remain unfinished. [Build system](build/BUILD_SYSTEM.md) |
| Compiler | Experimental Rust 2024 subset, separate driver, and bounded MRML linker for x86-64 ELF and PE/COFF. Production does not silently switch to it. | ORACLE-0004 pins `nightly-2026-11-26` at rustc `6c709eb4`. Native Windows passed 1,339 compiler-core, 18 driver and 50 runtime tests on gnullvm without MSVC or the Windows SDK. The runtime and driver also passed on Arch WSL2. The checkpoint distinguishes sandboxed runs from native execution. [Compiler](COMPILER.md), [checkpoint](compiler/CHECKPOINT.md) |
| Kernel, services and storage | Capability-based Gigakernel, hosted KVM and WHP adapters, supervised service mechanisms, SATA AHCI and FAT32 providers, and versioned storage interfaces. | Storage-provider and service work is incremental. Read the [roadmap](ROADMAP.md#current-priority) and [Gigakernel guide](gigakernel.md) for current evidence and remaining gates. A hosted guest, model, or driver build does not establish physical-device support, production storage durability, or isolation from the host. |
| GUI, accessibility and browser | Compositor, GUI surface interface and probe source exist. Accessibility and browser documents specify the shared semantic interface, authority boundaries and acceptance goals. | Do not infer a complete desktop/browser, physical Braille support or passing monitor-off acceptance from interface or probe code. [Application platform](APPLICATION_PLATFORM.md), [monitor-off acceptance](accessibility/MONITOR_OFF_ACCEPTANCE.md), [browser semantics](BROWSER_SEMANTICS.md) |
| Local ML, GPU and codecs | Hosted model, tokenizer, tensor and trainer packages; experimental media implementations. Zstandard has bounded compressed-block support. AV1 and Opus have their own conformance and verification ledgers. | The focused Windows gnullvm Zstandard release suite passed 49 tests. A package listing, host build, or CUDA compile-only check does not establish hardware execution or full codec conformance. [GPU architecture](gpu/GPU_ARCHITECTURE.md), [Zstandard profile](gitd/edge/CACHE_AND_ZSTD.md), [AV1 conformance](../packages/libraries/av1/CONFORMANCE.md), [Opus](../packages/libraries/opus/README.md) |
| Git and Gitd | Hosted protected SHA-256 Git, Gitd, a separate authority, and offline releases and recovery tooling. Base Compose publishes TCP 443 to Gitd; its accepted transport is TLS 1.3 with HTTP/2. | Dated hardened Docker tests cover protected pushes, verified offline images, backup and clean restore, and recreation. HTTP/3 is not enabled in that baseline. This project’s GitHub source history is SHA-1 and separately SSH-signed; it is not served by Gitd. [Git checkpoint](gitd/operations/CURRENT_COMPLETION.md), [source verification](human/VERIFY_COMMITS.md) |
| Certificate service and ACME | Bounded ACME library, Linux certificate and ACME worker binaries, Compose artifacts, CA enrollment and identity handoff paths. | Controlled local-CA enrollment and hosted Gitd/certd integration are recorded. Those results do not prove public-CA issuance with owner production credentials or authorize public activation. [ACME](ACME.md), [Compose guide](../deploy/compose/README.md) |

## Windows testing

Use **native Windows** with the pinned `x86_64-pc-windows-gnullvm` toolchain
for Windows host tests. Native Windows and local VMM testing are active. Use a
native host with the required features for WHP, Hyper-V, and VBS checks. The
[full platform test record](PLATFORM_TESTS.md) reports the native WHP and WSL2
KVM results separately. Wine runs provide Windows-target toolchain coverage
only.

[Setup and test commands](human/GETTING_STARTED.md) ·
[Compiler test evidence](compiler/CHECKPOINT.md) ·
[Kernel and VMM evidence](gigakernel.md)

## Workspace checks and generated inventories

Use `mrml list`, `mrml manifest check`, and `mrml manifest lock --check` for
live package/graph facts. The [CI coverage plan](build/CI.md) describes the tracked GitHub workflow,
including Windows/Linux builds and tests and separate MRML build and guest
coverage. Configuration is not evidence of a passing run.

[Generated workspace status](STATUS.md) and the
[generated unsafe inventory](UNSAFE_INVENTORY.md) are checked snapshots, not
live counts. Passing the inventory gate means the checkout stays within the
recorded limits; it does not attest that the unsafe boundaries are sound.
Exact owner-authorized carry-forward caps and the remaining focused review
backlog are recorded in the [audit remediation record](AUDIT_REMEDIATION.md).

For the rest of the project, use the [documentation guide](human/DOCUMENTATION.md)
or the [technical index](machine/README.md). Dated oracle and operational
records describe their own source identities and environments, even when
a newer checkpoint changes the current status.
