# MRML Gigakernel design

The Gigakernel is the privileged core of MRML OS. It is designed to launch
ordinary applications and services only in admitted, supervised microVMs.
If isolation or a required resource is unavailable, the workload does not
start. There is no native fallback inside MRML OS. The Windows and Linux
host tools are separate programs, not an alternate execution mode.

## How the Gigakernel compares

Gigakernel, named after Gigachad, is MRML's name for its experimental
virtualization-based kernel design. It shares the small privileged core and
capability principles of conventional small-core systems. The
[Hyperkernel research project](https://syslab.cs.washington.edu/papers/nelson-hyperkernel.pdf)
also used hardware virtualization, but focused on formal verification of a
bounded kernel interface. MRML's defining choice is mandatory microVM
placement for ordinary workloads. Whether this warrants a distinct kernel
classification remains open. The name makes no claim of priority, formal
verification, or production readiness.

## Isolation boundary

- The privileged core supplies launch, memory, communication, and resource
  enforcement. Policy, filesystems, and ordinary drivers belong in isolated
  services where the required mechanisms exist.
- Cross-VM links require explicit, scoped, revocable capabilities. An
  executable signature establishes provenance; it does not grant access to
  another guest, memory, or devices.
- Stop new work before retiring a guest or device lease. Verify that mappings
  and device access are withdrawn before reusing pages. Quarantine uncertain
  resources rather than returning them to the allocator.
- Firmware, the loader, the virtualization substrate, and the fixed recovery
  mechanisms are part of boot or recovery, not a second workload mode.

See [Architecture](ARCHITECTURE.md), [Security](SECURITY.md),
[Isolation placement](ISOLATION_PLACEMENT.md), and
[Application platform](APPLICATION_PLATFORM.md) for the normative design.

## What has been verified

| Area | Evidence | Limit |
| --- | --- | --- |
| Boot and VMX | Authenticated QEMU/OVMF boot reaches the kernel. Chromebook diagnostics exercised VMX guest entry and the kernel PE entry probe. | Diagnostic guest entry is not a normal installed-system boot. |
| Hosted microVMs | Signed hosted fixtures exercise supervised launch, communication, and retirement. The storage read fixture uses a scoped shared page and checks withdrawal. | Check the [platform results](PLATFORM_TESTS.md) for exact backend and fixture coverage. |
| USB write in a guest | A signed guest updates the three expected bytes in a preallocated `PROBE.TXT` through emulated xHCI on USB 2 and USB 3. It flushes, reads back, and retires; the host checks the entire disk image. | This is an exact fixture, not a general FAT32 writer or a physical USB write. |
| Chromebook USB | A read-only EFI diagnostic measured 34 scratchpad pages at 4 KiB each and confirmed that firmware still owns the controller shared with the boot stick. Software-model tests exercise buffered startup, cleanup retry, and refusal when the handoff prerequisites change. | No firmware ownership transfer, physical DMA activation, or physical write was tested. |

The recorded x86-64 release baseline at `a9ca7377` had 35,133 virtual
bytes in the kernel PE's executable section, excluding the loader and
virtualization backends. This is a dated build measurement, not the size of
the trusted computing base. Remeasure when normal boot starts admitted
service microVMs.

## Current work

1. Complete normal boot into admitted services and connect authenticated
   recovery, launch, and service retirement end to end.
2. Qualify USB controller handoff with firmware I/O closed and DMA blocked
   across the transition. Verify scratchpad retirement and controller
   isolation before running a physical read or a single authorized write
   to a separate expendable test device.
3. Keep x86-64 the first bring-up target. ARM64 and macOS host support are
   planned; do not infer readiness from portable code or an emulator result.

See [UEFI and Chromebook evidence](platform/UEFI_BOOT_MANAGEMENT.md#read-only-xhci-inventory-before-native-bring-up),
[Storage and USB](storage/STORAGE_AND_OPTICAL.md), [Recovery](RECOVERY.md),
and the [roadmap](ROADMAP.md#current-priority) for implementation detail and
current gates.

## Historical evidence

The [full dated engineering ledger](https://github.com/mitchellmachine/mrml/blob/0d898ca0cb8efe215c23413d6928ed85232e6531/docs/GIGAKERNEL.md)
is preserved at the last revision before this rewrite. Use it for prior
probe commands, exact traces, and earlier measurements. A dated result is
evidence for its test configuration, not a claim about today's build.
