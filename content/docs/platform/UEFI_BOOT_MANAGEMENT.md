# MRML UEFI boot and Secure Boot administration

**Status: PLANNED.** Existing bounded UEFI loading, signed-container checks,
measured-boot plumbing, release/recovery journals, and owner-policy abstractions
retain their recorded status. No current claim is made for firmware NVRAM writes,
boot-entry creation, owner-key enrollment, compatibility-trust preservation,
dbx update, dual boot, or broad physical-firmware compatibility. The scoped
physical diagnostic result is recorded below.

## Bare-metal USB bring-up

The bring-up test uses a dedicated, expendable USB flash drive, not the
installer. First reproduce the signed FAT32 restart in QEMU/OVMF with
`mrml usb test OVMF_CODE OVMF_VARS QEMU`. Both paths
use MRML package and service signatures with one-use diagnostic keys, and
the same read-only fixture embedded in the kernel. The USB EFI executable
itself is not signed for firmware Secure Boot. Passing QEMU/OVMF does not
mean firmware enforcing Secure Boot will trust this image.

1. [Create and write the diagnostic USB image](#create-and-write-the-diagnostic-usb-image).
   Firmware loads its x86-64 entry at `\EFI\BOOT\BOOTX64.EFI`.
2. Use the machine's one-time UEFI boot menu. Do not install MRML, change
   permanent boot order, enroll test keys, or weaken Secure Boot to make the
   diagnostic run. If the firmware refuses the test loader under the
   machine's current policy, record the refusal and stop.
3. Record machine and firmware version, Secure Boot state, display mode and
   exact build commit. Success is `FAT32 RESTART: PASS - 28 BYTES` on screen
   after handoff. Record `FAIL`, `NOT PASSED`, or a blank screen as a
   non-pass. Remove the stick before booting back into the existing OS.

UEFI reads the boot files from USB before handoff. The kernel's test reads
`PROBE.TXT` from its embedded FAT32 image, retires and restarts the signed
service without rebooting, rejects stale handles, and compares all 28 bytes
again. This tests firmware handoff, framebuffer and the service on one machine,
not MRML USB drive access, installation, or a physical storage driver. The
internal system disk is not a target.

### Future Chromebook USB write check

The target is a separate expendable USB data stick with a preallocated
`PROBE.TXT`, on an owner-approved controller assignment. Two ports can share
one xHCI controller: a second stick does not by itself establish separate
controller ownership. Do not use the internal disk or a partition still owned
by the boot path. The isolated
storage stack must identify the exact media generation, update the test file,
flush it, and read it back. An independent read of the stick after shutdown
must see the new bytes. A firmware file write, an embedded FAT32 pass, or
matching data in guest memory alone is not a pass. The [QEMU write fixture](../storage/STORAGE_AND_OPTICAL.md#native-usb-mass-storage-bring-up)
exercises the file operation on an emulated device; the physical controller
handoff and executing service path are not yet verified. This is not a
hardware test procedure until those gates are in place.

### Recorded bare-metal result

On 2026-11-27 (UTC), an HP Chromebook x360 14c (Dragonair), with an Intel
Core i3-10110U and 8192 MB of RAM, displayed
`FAT32 RESTART: PASS - 28 BYTES` on the signed diagnostic USB build from
`2be893b71b33bc82c5869aee3f318da695fa2351`. Firmware setup showed
`MrChromebox-2606.1`, dated 2026-07-14. This was the EFI Shell retest;
direct launch from the one-time boot menu was not separately verified.
Secure Boot state and exact GOP mode were not recorded. The result verifies
firmware handoff and the embedded FAT32 service restart on this machine,
not native USB I/O, an installation, or Secure Boot trust for the image.

### Dragonair Gigakernel VMX test

Use the separate VMX image to test CPU virtualization on the Chromebook after
the embedded FAT32 boot smoke test. This image never installs MRML. It does not
take over the shared xHCI controller, enable DMA, use the internal disk, or run
an installed storage service. Before starting any secondary CPUs, the opt-in
kernel runs A → B → A → B in one VMX root session, with separate VMCSs,
EPT hierarchies, code pages and private backing. Each guest writes a marker
and yields; on resume it increments its retained marker and must fault on
the other guest's unmapped address. The monitor checks both backing bytes
after each exit, exits VMX, and restores the original control registers.

Build and preflight the same image on a Linux system with working nested Intel
VMX exposed through KVM:

```text
mrml usb image-vmx mrml-dragonair-vmx.img
mrml usb test-vmx mrml-dragonair-vmx.img OVMF_CODE OVMF_VARS QEMU
```

The host test uses a private copy for each boot, verifies an explicit non-pass
on TCG without VMX, and verifies the VMX lifecycle and framebuffer completion
under nested KVM. It does not change the supplied file. Only after both runs
pass, use `mrml usb burn mrml-dragonair-vmx.img` with a dedicated expendable
USB stick and the interactive erase confirmation, or use
`mrml usb autoburn --image mrml-dragonair-vmx.img` to erase and verify the
sole eligible USB stick without a selection or erase prompt. Without
`--image`, autoburn still creates the FAT32 probe.

The reference QEMU preflight reached `d0 e0 e6` without VMX (including the
non-pass label) and `d0 d1 d2 d3 d4 df d6` with nested KVM (including the
pass label) for the original single-guest image. Mitchell reported
`VMX PROBE PASS` on the Dragonair after the CR0.NE fix. The two-guest image
then reached `VMX 2 VM PASS` on the same Dragonair in a launch-only test.
The switch-and-resume image required
`d0 d1 d2 d3 d4 f2 f3 f4 d7 d8 d9 f7 f8 f9 df d6` under nested KVM; the
no-VMX trace remains unchanged. The operator also reported `VMX ABA PASS`
on Dragonair. Later versions of this fixture require that each resumed guest
compute its second memory marker from its own restored register value. The
earlier physical pass did not check software-owned general-purpose registers.
The updated `mrml usb test-vmx-kernel` image passed the two-guest switch,
long-mode, timer-exit, and signed kernel-runtime stages in nested KVM; the
same image retained the expected `d0 e0 e6` fail-closed trace under TCG.
All 760 kernel tests passed on Windows and Arch WSL. Further hardware checks
are deferred until the runtime is ready.

On the Dragonair, use its one-time boot menu or launch
`fsN:\EFI\BOOT\BOOTX64.EFI` from the EFI Shell as in the FAT32 test. Preserve
the machine's current Secure Boot policy. Record the exact image hash, firmware
version, and last visible label:

- `VMX 64 PASS`: after the cooperative switch test, a separate IA-32e guest
  ran at a high-half address through its own guest page tables, wrote a
  64-bit marker to an NX guest stack, then attempted a port write that
  the monitor verified trapped without forwarding it. Trace `c0 c1`
  identifies this stage. It is a bootstrap fixture, not yet a signed
  Gigakernel payload, scheduler, or installed service.
- `VMX PROBE NOT PASSED - XX`: record the two-digit code and the final screen.

  | Code | Failing check |
  | --- | --- |
  | `00` | CPUID does not expose VMX |
  | `01` | VMX/EPT capability requirements not met |
  | `02` | required VM execution controls unavailable |
  | `03` | diagnostic pages could not be validated |
  | `04` | EPT root pointer rejected |
  | `05` | firmware left IA32_FEATURE_CONTROL unlocked |
  | `06` | firmware disabled VMX outside SMX |
  | `07` | host CR0/CR4 fixed-bit validation failed |
  | `08` | unrestricted guest CR0/CR4 setup failed |
  | `09` | host task register descriptor rejected |
  | `0A` | minimal VMCS launch state rejected |
  | `0B` | VMXON failed |
  | `0C` | VMCLEAR failed |
  | `0D` | VMPTRLD or EPT binding failed |
  | `0E` | VMWRITE failed |
  | `0F` | VMLAUNCH failed |
  | `10` | expected read-only EPT violation not observed |
  | `11` | VMXOFF failed |
  | `12` | private backing bytes did not match after guest exit |
  | `13` | the exact guest yield was not observed or could not be parked |
  | `14` | the suspended VMCS/EPT pair could not be reloaded |
  | `15` | VMRESUME failed |
  | `16` | IA-32e launch state could not be prepared |
  | `17` | IA-32e guest did not exit with its expected 64-bit marker |
  | `18` | signed nested kernel admission or preparation failed |
  | `19` | expected signed kernel completion exit not observed |
  | `1A` | VMX timer exit, suspended-guest reload, or post-resume result did not match |
  | `1B` | Independent Zstd service admission, execution, or validated reply did not match |

  Dragonair reported `07` in the first run with stage codes. The updated
  probe reports four hex masks: `CR0 ADD`, `CR0 CLEAR`, `CR4 ADD`, and
  `CR4 CLEAR`. These are missing required and set forbidden bits, not
  instructions to change settings. Photograph the full screen. The probe
  reports the masks without changing either register on this failure path.
  A later Dragonair run measured only `CR0 ADD = 0x20` (CR0.NE); the
  opt-in diagnostic now sets that bit only if it is the sole mismatch and the
  resulting host controls pass validation. It uses the same CR0 value in the
  VMCS and restores the original value after VMXOFF, or if VMXON never
  succeeded. Other mismatches still fail closed. The probe does not change
  the firmware VMX policy.
- `VMX PROBE START` without a terminal label: record it as a non-pass; the probe
  did not return to its caller with a terminal result.

For the **emulator-only signed nested kernel** checkpoint, use:

```text
mrml usb image-vmx-kernel NESTED.img
mrml usb test-vmx-kernel NESTED.img OVMF_CODE OVMF_VARS QEMU
```

The image embeds a separately signed Gigakernel PE and a pinned guest root
inside the signed opt-in monitor. It tests wrong-root rejection before PE
materialization. The monitor sets final PE rights in both EPT and guest
tables, provides a read-only measured handoff and guard-separated stacks, and
enters the real kernel through the EFI ABI. It reports `VMX KERNEL PASS`
only after the guest's early handoff validation, two-task scheduler check,
and capability-checked, scheduler-driven IPC request/reply. The wrong
endpoint must fail before the authorized request gets sequence 1.
In the nested KVM trace `c0 c1 c2 c4 c6 c3 c5 df d6`, `c4` is the exact timer
expiry at the spinning fixture's comparison or branch; `c3` is the separate
signed Gigakernel's completion. The monitor changes only the stopped timer
fixture's readiness byte, reloads its own VMCS/EPT pair, re-arms the timer,
and resumes at the interrupted instruction. `c5` requires the resumed guest
to update its marker from its preserved RAX, report the exact x87 integer
conversion and XMM value, and reach the expected I/O exit. The monitor also
checks reset x87 control and XMM data on first launch and preservation of
its own x87 control word across the signed L2 run. The diagnostic freezes
guest CR4 to the validated legacy-state profile; it does not admit AVX or
other extended CPU-state features. Without VMX the artifact does not try to
enter a guest. At `c6`, the monitor has relayed a real request from the
parked signed Gigakernel to the independently signed Zstd provider MicroVM
and received the reply. The existing capability queue rejects a wrong
endpoint, a replay, and a new send after revocation. Then the monitor resumes
the caller, which checks the exact decoded result before `c3`. Guest
mailboxes are private; the monitor queues and copies only while the exact
vCPU is stopped. The test does not use an installed service scheduler. The L2
topology is synthetic and no device is forwarded. This test does not establish installed
services, preemptive runtime scheduling, extended CPU-state isolation, or
bare-metal support.

When recording a failure, also collect the reserved boot report described
below if present. This diagnostic is scoped to the tested VMX/EPT mechanism. A pass
does not qualify Total MicroVM, native USB I/O, persistent storage, or Secure
Boot trust.

### Read-only xHCI inventory before native bring-up

Build the standalone EFI application with
`mrml build org.mrml.library.uefi --target uefi-x86_64 --release --feature-profile xhci_inventory`.
It produces `target/mrml-native/uefi/release/mrml-xhci-inventory.efi`.
Reproduce the QEMU/OVMF test first with
`mrml usb test-xhci-inventory OVMF_CODE OVMF_VARS QEMU`.

This is not the normal MRML loader or a flash image. To inspect a machine,
copy the EFI file as `XHCIINV.EFI` to the root of an existing FAT USB volume.
Do not replace `BOOTX64.EFI`, raw-write the drive, enroll a test key, or change
boot order or Secure Boot policy. Launch the firmware's EFI Shell, run
`map -r` and identify the USB filesystem, then run
`fsN:\XHCIINV.EFI` for that mapping. If current firmware trust policy rejects
the executable, stop and record the refusal. An SSH-signed source commit does
not sign the EFI executable for Secure Boot.

Record the controller's PCI address, IDs, command state, BAR0, ownership,
MCFG coverage, DMAR route, and the `xhci DMA` line as shown on the console.
The DMA line reports the controller's scratchpad buffer count and supported
page-size bitmask (bit 0 is 4 KiB). An unavailable line is not a zero count.
These reads do not allocate scratchpads or qualify the controller for transfer.
The application
returns to the shell without leaving UEFI Boot Services. It does not write
a report to storage, read disk contents, change bus mastering, write
controller registers, or hand off DMA. A firmware-owned or contended
controller, an unavailable BAR, or a missing, ambiguous or reserved-memory
route is not clearance for a native test. A listed route is only firmware
inventory and is not authorization to start the native driver.

The boot-source line reports shared USB, separate USB, a recognized non-USB
source, or unresolved. It uses the loaded application's device handle and the
closest firmware PCI I/O ancestor of a bounded device path. An unresolved
path never establishes separation. The diagnostic does not change ownership
even if it recognizes a separate source.

The first Dragonair inventory (2026-11-27 UTC, build 503b3600) found one
Intel 8086:02ed xHCI controller at 0000:00:14.0, revision 00, with command
0006 and a 64 KiB BAR0 at 0xceef0000. MCFG covered the requester and DMAR
described a route to DRHD 0xfed91000. The controller reported firmware
ownership with bus mastering enabled. The application returned to EFI Shell.
This was a read-only firmware inventory, not native USB I/O or a test of
controller handoff. That build did not verify the boot-source relationship.
The subsequent topology-only EFI test (build 659ea7ed) reported
`shared-usb` on the same Chromebook: the boot stick uses that xHCI
controller. Another port or USB stick does not prove controller separation.
The 2026-11-27 read-only follow-up (`87b78e16`, `XHCI87B.EFI`) confirmed
34 scratchpads and page mask `0x0001` (4 KiB only), or 136 KiB of scratchpad
buffers before the pointer array and other DMA objects. The controller was
still firmware-owned and shared with the USB boot source. The diagnostic
reported zero incomplete controllers and returned to EFI Shell without handoff.

The signed QEMU/OVMF negative control boots the same sealed test release
from a read-only virtual disk attached directly to the sole xHCI candidate.
The host verifies the attachment and that firmware read the boot backend
with zero completed writes. With no sealed QEMU fixture marker the loader
rejects native activation; the host never releases the native probe. This
tests refusal, not a successful transition from firmware-owned USB.

The separate `mrml usb test-shared-preload OVMF_CODE OVMF_VARS QEMU`
regression uses a different sealed loader profile. Once UEFI has exited
Boot Services, that profile stops at a QEMU-only checkpoint. On the positive
path the host confirms the virtual boot disk was read without completed
writes, detaches only that disk (not the controller), confirms its absence,
then releases the guest. The kernel completes the signed embedded FAT32
service restart without the boot disk. Missing-marker and denied-release
controls halt. This demonstrates boot can continue from RAM; it does not
exercise native xHCI ownership transfer, reset, or storage I/O. The signed
preload regression also samples the same paused QEMU PCI function, BAR,
xHCI command and status, and VT-d translation/root/fault registers before
and after detachment. The host requires control and remapper state to
remain unchanged while allowing a port-status event. The report describes
firmware-inherited emulated state, not proof of physical ownership or DMA
isolation. In the QEMU reference run, xHCI was halted both times, but
PCI Bus Master Enable remained set and VT-d translation remained off.
Removing the boot stick is therefore not a substitute for an explicit,
verified DMA-safe controller shutdown. The extra allow/deny cases use only
the paused QEMU host to check this boundary: after exact USB detachment,
the allow case clears only Bus Master Enable with a 16-bit PCI command
write, restores the configuration selector, and independently verifies
the full command and status dword and unchanged xHCI and VT-d state. The
deny case leaves PCI state unchanged and the guest stops. This is a
host-side emulator calibration, not a guest-implemented shutdown,
firmware ownership transfer, or hardware qualification.

In a distinct marked guest case, the post-exit loader verifies the exact
emulated PCI function and baseline command, updates only Bus Master
Enable, restores the PCI configuration address, and pauses for independent
QEMU readback. The host detaches the virtual boot disk and supplies the
release through the test UART; it does not write PCI configuration in
the guest case. A denied release writes no command and stops. The allow
case continues from RAM only after the host verifies the exact change.
This diagnostic is not in the normal boot profile and does not claim
legacy semaphore transfer or enable DMA. An independent software model
checks the retained lease, blocked DMA, quiescent boot source, and exact
capability again at the OS-semaphore write boundary. If any changed since
observation, it records no write. This is not a real firmware handshake.

### Diagnose a return to firmware

Boot the UEFI Shell and run `map -r`, then use the USB filesystem mapping
to launch `fsN:\EFI\BOOT\BOOTX64.EFI` (replace `N` with the USB mapping).
The loader prints `MRML: UEFI loader started` using firmware text output,
then names each stage. If it returns before the boot-services exit attempt,
record the `MRML: FAILED at ...` line and hexadecimal EFI status.

The loader prefers the UEFI RNG protocol. Only when the protocol lookup returns
`EFI_NOT_FOUND` does x86-64 try the CPU's RDRAND instruction. It checks CPUID
before executing RDRAND and allows ten attempts for each of four 64-bit words.
The selected source supplies the 32-byte boot seed and fresh TPM journal nonces.
An advertised firmware RNG that fails is not bypassed. Missing CPU support,
exhausted retries, or an all-zero sample stops boot; the EFI console identifies
the source and stage without logging random bytes. This does not change Secure
Boot, package verification, or TPM policy.

If the shell prints no MRML line at all, record the shell's own status;
firmware may have rejected the executable before entering it, or provided
no working firmware text console. After the last memory-map message the
loader stops using the firmware console. Record the last label drawn directly
to the framebuffer:

- `MRML EFI END START`: the loader is about to get its final memory map and
  exit boot services. `MRML EFI END PASS` confirms firmware exit returned success.
- `MRML MAP PASS` and `MRML MADT PASS`: the loader normalized the memory map
  and copied the ACPI interrupt-controller table, respectively.
- `MRML KERNEL START`: the handoff is encoded and the loader is about to change
  address spaces. `MRML KERNEL ENTRY` is drawn by the diagnostic kernel after
  validating the handoff and building its early context.
- `MRML SMP START`: the diagnostic kernel is starting the secondary CPUs.
  `MRML SMP READY`: that stage is complete or unnecessary on a single core.

Only the terminal `FAT32 RESTART: PASS - 28 BYTES` label confirms the test.

A `MRML MAP … - SEND MEMMAP` label reports why the loader rejected the
final memory map after leaving firmware. Reboot into the UEFI Shell and run
`memmap >a FS0:\MRML-MAP.TXT`, replacing `FS0:` with the USB mapping, then
share the file and the exact label. The shell dump is an earlier snapshot,
not the rejected map itself. The loader sorts descriptors by physical start
before checking for overlaps and emits only a bounded canonical map.

### Collect the automatic boot report

The diagnostic USB has a reserved `MRMLBOOT.TXT` at its root. The loader
updates it on a reportable pre-exit failure or at the pre-exit checkpoint.
It records the stage, EFI error status if available, and up to 192 memory
descriptors (type, physical start, page count, and attributes). It does not
copy RAM contents, descriptor padding, credentials, or random bytes. It
never creates the file on other media and does not write without the reserved
slot. The normal non-diagnostic loader does not use this report.

For failures after `ExitBootServices`, send both the last screen label and
`MRMLBOOT.TXT`. That file is a snapshot, not a record of the final map or a
claim that the kernel started. Firmware file I/O has already ended, and the
loader takes a fresh map after closing the report so the write cannot
invalidate the key used for firmware exit. Copy the report before another
attempt or reflash. On read-only media or if the file write fails, use the
screen label and the manual shell dump. A report without the
`END MRML BOOT LOG` line may be incomplete.

### Create and write the diagnostic USB image

In a trusted checkout with the [MRML toolchain](../human/GETTING_STARTED.md)
prepared, run `cargo build --locked`. The examples use `mrml` from your
path; you can use `./target/debug/mrml` on Linux or
`.\target\debug\mrml.exe` on Windows instead.

```text
mrml usb image mrml-bringup.img
mrml usb list
mrml usb burn mrml-bringup.img
```

Image creation builds and signs the diagnostic with disposable keys and
creates a new 65 MiB MBR/FAT32 image without elevating or requiring external
formatters. It never overwrites an existing file. Keep the image on the host,
not the USB stick. `list` is read-only; Windows may require an Administrator
terminal for its drive queries. For a USB stick plugged into Windows, use the
Windows executable rather than WSL.

**Writing replaces the selected USB stick's partition layout and data.**
Connect only expendable media and unmount its volumes on Linux. The writer
requests Windows UAC or Linux `sudo` if needed. It offers only recognizable,
writable, removable USB disks with 512-byte logical sectors and excludes
system, busy or ambiguous targets. On Windows, unknown EFI, active or service
partitions are refused; the exact existing MRML diagnostic layout is allowed.
A single candidate is selected
automatically; otherwise choose a number. Check the exact drive shown and
type `ERASE <number>`. The writer rechecks and claims the device, writes
and flushes the image, then compares every written byte. Safely eject
afterward. This is imaging, not secure wiping of the rest of the disk.

For unattended use on a trusted host, run:

```text
mrml usb autoburn
mrml usb autoburn --image PATH_TO_TESTED_MRML_IMAGE.img
```

**This command erases the sole eligible USB storage drive without asking.**
Connect only the spare USB stick you intend to erase. The command does not
prompt for selection or confirmation. It refuses to build or
write if there is no USB storage drive, more than one (even if another is
ineligible), or if the only drive fails the normal safety checks. It builds
the FAT32 diagnostic by default or loads the exact supplied MRML image with
`--image`. An unreadable or invalid image stops the write without falling back
to the default. It rechecks the original drive and USB inventory
before claiming and writing, and verifies every written byte. If the
inventory cannot be determined or changes during the checks, it stops
instead of picking another drive. Use interactive `burn` when you need
to select a drive.

From a normal Windows session, autoburn prepares the image before requesting
native Windows UAC for the writer. The elevated process rechecks the
selected USB identity, image hash, and write policy, then returns the result.
An already elevated session does not show a second UAC prompt. If Windows
requires BitLocker for removable writes, MRML refuses to overwrite the raw
image; it does not weaken or override the policy.

On Linux, running autoburn as a normal user prepares the image without
privilege and asks the system polkit agent to authorize only the USB writer.
The installed helper receives the device fingerprint and exact image bytes
over a pipe, verifies both, and never builds or opens a caller-supplied file.
This uses the distribution's `/usr/bin/pkexec`; no MRML Rust dependency or
terminal authentication fallback is installed. If polkit, its session agent,
or the helper is unavailable, run from a trusted checkout as root. Do not
grant capabilities to the general-purpose builder. The writer requires both
device access and a privileged cache-flush operation for verified read-back.

To package the Linux helper, run `mrml build org.mrml.tool.build --target linux --release`
and install the resulting `mrml-usb-writer` as a regular root-owned executable
at `/usr/lib/mrml/mrml-usb-writer` (mode 0755, no setuid bit or capabilities).
Install only a reviewed binary; do not symlink to a user-writable build output.

To reuse a spare USB installer whose **MBR** contains an EFI or active
partition, first check the existing target in the Administrator terminal:

```text
mrml usb list --erase
mrml usb autoburn --erase
```

`-e` is shorthand for `--erase`. The first command is read-only. The second
will overwrite the stick without prompting. On Windows this flag allows
ordinary MBR boot layouts, not GPT EFI, service, malformed or overlapping
partitions. The writer still requires exactly one USB storage device,
protects the Windows installation and startup disks, and rechecks the
original MBR and device before writing. Linux already accepts eligible
unmounted boot media; the flag does not change its safety checks.

**Native MRML USB writing is planned.** Keep the same image and workflow,
but use the deployment service for typed removable-device enumeration,
explicit owner authorization bound to the exact device generation and image
digest, an exclusive write claim, and read-back. A shell or GUI must not
receive blanket device-write authority.

## Typed firmware objects and authority

Firmware administration exposes typed `UefiVariable`, `UefiBootEntry`,
`UefiBootOrder`, `UefiBootNext`, `SecureBootDatabase`, `UefiBootTransaction`, and
`SecureBootTransaction` objects rather than requiring efivar blob parsing. A boot
entry carries numeric identity, description, active/attribute state, device,
partition, device path, file path, optional data, and generation. Description is
presentation, never security identity. `BootTarget` remains deployment intent;
the UEFI entry is resulting firmware state.

The PowerShell-inspired shell may conceptually get/create/set/remove entries,
get/set order, get/set/clear next boot, and inspect variables. Exact verbs are not
ABI. Rights remain separate: `UEFI_VARIABLE_READ`, `UEFI_BOOT_CREATE`,
`UEFI_BOOT_MODIFY`, `UEFI_BOOT_DELETE`, `UEFI_BOOT_ORDER_MODIFY`,
`UEFI_BOOT_NEXT_MODIFY`, `SECURE_BOOT_DATABASE_READ`, and
`SECURE_BOOT_DATABASE_MODIFY`. Inspection grants no mutation. Arbitrary/raw
authenticated-variable writes require a separate expert/system capability.

Returned objects are generational. Before mutation, the platform service re-reads
and exact-matches firmware identity/content/generation. Stale entry/order/next or
variable state fails without blind modification. A transaction follows construct
-> validate -> preview -> trusted exact authorization -> apply -> re-read ->
verify. `NVRAM_FULL`, `WRITE_PROTECTED`, `AUTHENTICATION_REQUIRED`,
`FIRMWARE_REJECTED`, `WRITE_UNCERTAIN`, and `ENTRY_NOT_PERSISTED` remain distinct
typed outcomes; successful `SetVariable` alone is not proof.

Conceptual object-shell use remains structured:

```text
Get-UefiBootEntry | Where Description == "MRML"
Set-UefiBootNext $windowsEntry
New-UefiBootEntry -Description "MRML Recovery" -BootTarget $recovery
```

## Installer, paths, and dual boot

After selecting/creating the ESP, writing and flushing the exact MRML loader, and
verifying its bytes/signature, installation creates its own `MRML` firmware entry,
then re-reads and verifies the expected partition/path before claiming success.
The installed x86-64 path is `\EFI\MRML\BOOTX64.EFI`; future architectures select
their corresponding EFI executable through `BootTarget`, not x86 hard-coding.

Unrelated entries and EFI directories are preserved. In particular, a detected
Windows Boot Manager remains an independent firmware entry and Windows stays
directly bootable without the MRML loader. Structured detection reports its entry,
EFI path/ESP, Secure Boot state, trust configuration, and preservation
compatibility where safely knowable. Automatic layout preserves Windows
partitions; any deletion/resizing is explicit in the exact destructive preview.

Putting MRML first in `BootOrder` is owner policy. Preview shows current and
proposed complete order and permits retaining the existing default. `BootNext`
is separately controlled for one-time recovery, candidate, Windows, or test boot
and never implies permanent order change. A boot transaction can create MRML,
preserve Windows, propose order, and leave fallback state unchanged.

The planned menu offers `MRML`, `MRML Recovery`, and independently discovered
`Windows Boot Manager` where applicable. Every normal MRML boot uses strict
[Total MicroVM isolation](../ISOLATION_PLACEMENT.md). If a required workload
cannot start, fail closed; retry or enter the separate recovery environment.
Neither establishes an alternate MRML session.

The following compatibility evidence describes an explicit
`--isolation=total-microvm` load option and its typed handoff. It does not
select between operating modes or prove runtime satisfaction.

The shared UEFI library now provides the first **PARTIALLY IMPLEMENTED** parser
prerequisite. One allocation-free, 128-UTF-16-unit parser accepts either the
boot-entry option `--isolation=total-microvm` or that same option following an
exact `BOOTX64.EFI` shell program token and produces one authority-free
`TotalMicrovmOnce` selection. Empty options select the configured default;
non-ASCII input, embedded NULs, ambiguous whitespace, unknown programs,
additional tokens, and every other isolation spelling fail closed. Windows and
Linux each pass 27 focused UEFI-library tests and the UEFI target builds. The
real loader now obtains `LoadedImageProtocol.LoadOptions` before boot-services
exit, checks the byte bound, UTF-16 width, pointer nullness and alignment, and
feeds only that validated slice to the shared parser. It encodes
`TotalMicrovmOnce` as a distinct canonical flag in the same trusted-loader
handoff that binds the authenticated kernel and release evidence; the kernel
decoder retains it as an authority-free `BootIsolationOverride`. Empty options
produce no override, and malformed options stop the boot. Menu presentation,
OVMF/EFI-Shell execution evidence, policy composition, and runtime Total effect
remain **PLANNED**.

The library also now has a **PARTIALLY IMPLEMENTED** Block I/O descriptor
primitive for installed-recovery work. It models and layout-tests the x86-64
UEFI Block I/O ABI, validates a copied media snapshot and one bounded canonical
device path, and derives an authority-free boot-scoped stable identity and exact
media generation. A loaded-image acquisition now opens both protocols on its
exact device handle, copies the inputs into caller-owned bounded storage, closes
both relationships, and fails closed on partial-open cleanup or uncertain
closure. The real loader does not yet call it, enumerate other handles, read
media, persist identity across boots, or transfer a selected device into the
kernel handoff. No OVMF, EFI Shell, or physical firmware claim follows from host
tests and cross-builds.

The same boundary now **PARTIALLY IMPLEMENTS** an aligned 4 KiB recovery read
over compatible 512/1024/2048/4096-byte firmware media. Exact LBA/range checks
and pre/post media snapshots prevent crossing geometry or replacement, and any
failed or stale read erases its complete output. This has only run against a
host mock; the production loader still does not enumerate or read installed
media through it.

Block I/O handle discovery is now **PARTIALLY IMPLEMENTED** as a fixed-capacity
copy of `LocateHandleBuffer(ByProtocol)`. It rejects malformed, duplicate, or
excess entries and requires `FreePool` for every firmware allocation before
return. Handle values and enumeration order are explicitly non-authoritative
and are not persistent identity. The production loader has not yet opened and
scanned this set.

The first per-handle scan step is now **PARTIALLY IMPLEMENTED**. It opens both
protocols, binds path and media generation, reads and validates native block
zero, exact-matches the canonical volume geometry, erases temporary bytes, and
closes both relationships before returning a candidate. The real loader has not
yet applied it to the complete enumerated set.

Complete-set matching is now **PARTIALLY IMPLEMENTED** in the library. It probes
every bounded handle, rejects duplicated stable identity or substituted probe
results, and requires exactly one canonical header for the expected volume.
Reordering firmware handles does not alter stable selection. The production
loader still does not invoke this path or read redundant roots.

The selected handle can now be reopened and exact-revalidated before both
redundant roots are read. Its path, media generation, converted geometry, and
block-zero header must remain identical; root bytes are erased if either read or
protocol close fails. This remains library/mock evidence rather than production
loader execution.

An exact-generation read-only storage adapter can now be lent within one
selected-device protocol session. It revalidates the descriptor/header, exposes
only complete native 4 KiB reads, denies mutation, and cannot survive protocol
closure. The production loader has not yet used it for graph recovery.

The conventional fallback `\EFI\BOOT\BOOTX64.EFI` may be installed only under
policy that proves ownership/non-conflict and previews backup/recovery or exact
replacement. A shared ESP's existing fallback is never casually overwritten.
Normal MRML installation stays under `\EFI\MRML\`.

## Owner Secure Boot and compatibility policy

The typed shell/platform service may inspect state, keys/databases, create/import
owner keys, export recovery material, add/remove trust, test/apply policy, update
revocations, and sign/test EFI images. Private keys are `SecretObject`s: ordinary
operations receive `SIGN`/`USE`, not `EXPORT`, and raw key bytes do not enter the
shell or normal GUI. Explicit encrypted recovery export requires separate export
authority and never places plaintext private keys on the ESP.

User-facing policy modes are conceptually:

- **Recommended / MRML + Windows compatibility:** owner MRML trust, supported
  Windows boot, Microsoft UEFI/Option ROM compatibility, and accepted revocations;
- **MRML only:** owner MRML OS trust without required Windows boot trust, while
  retaining Option ROM and other detected platform compatibility trust;
- **Preserve existing:** retain firmware databases and safely add MRML trust;
- **Expert custom:** exact anchors with strong validation, warning, and recovery.

Microsoft Windows boot, general UEFI compatibility, Option ROM UEFI compatibility,
and revocation sets are separate, authenticated, versioned policy data with
source, generation, digest, and accepted state. Literal certificate names are not
architecture. Compatibility keys authorize applicable EFI images at firmware
only; they grant Microsoft no MRML package, capability, owner-root, or generation
authority. MRML normally boots through owner/project signing, not Microsoft.

> Normal MRML Secure Boot enrollment must preserve or install the current
> supported Microsoft Option ROM UEFI trust required for platform hardware
> compatibility.

Removing Windows boot trust is not removing hardware initialization trust.
Complete Option ROM trust removal is Expert Custom only: preview the exact anchor,
warn that GPU/storage/network/Thunderbolt/PCIe initialization may fail, report
detected dependencies without claiming completeness, require trusted owner
authorization/physical presence as policy demands, and preserve a recovery path.

A Secure Boot transaction previews current/proposed/removed PK, KEK, db, dbx,
owner/MRML and compatibility anchors, and revocation generations. It exact-binds
authorization, applies, then re-reads and verifies every database. Normal policy
keeps current accepted dbx revocations; dual boot never means trusting revoked
components. Authenticated Microsoft revocation updates arrive through platform-
security/system-update policy with rollback/freeze resistance. Rolling back a
`SystemGeneration` does not silently downgrade firmware trust/revocation state.

The eventual Boot & Platform Security GUI uses the same objects to show Secure
Boot/owner trust, key fingerprints/purpose/role/status, compatibility and Option
ROM status, dbx, entries, order/next, and loader slots. It never displays private
key bytes. Secure attention, owner authentication, and physical presence apply to
high-risk actions; application-rendered prompts are not trusted consent.

## Audit, recovery, and evidence

The [unified system monitor](../monitor/SYSTEM_MONITOR.md) may project these
typed boot, trust, rollback, and recovery facts with their exact evidence limits;
it receives no firmware-variable or trust-policy mutation authority. This is
**PLANNED**.

Bounded audits record entry create/delete, order/next change, trust add/remove,
dbx update, and owner-key change by identities/digests, never secrets. Recovery
can repair typed boot state and owner policy only with narrow capabilities.

OVMF tests cover create/read/delete, Windows preservation, order/next, stale
denial, full/rejected/uncertain NVRAM, duplicate descriptions, corrupt variables,
and interruption. Secure Boot tests cover owner enrollment, MRML signature,
Windows independence, compatibility/Option ROM presence, dbx update, invalid/
revoked denial, rollback, partial write, and key recovery. Fuzz bounded LoadOption,
device-path, variable, certificate-list, and transaction codecs.

OVMF/QEMU is not physical proof. Reliable support records exact motherboard and
firmware results. Hardware-safe enrollment additionally proves GPU display,
NVMe/storage, relevant network and other boot-critical Option ROM devices still
initialize. The installer acceptance gate verifies loader bytes, creates/re-reads
the entry, preserves synthetic Windows, and reboots via it in a VM; then a
separate physical gate proves Secure Boot, compatibility, revocation, Windows,
devices, and recovery.

Patent review: `TRIGGERED` — typed firmware transactions, A/B/deployment binding,
trust-set composition, rollback handling, and Secure Boot management require
mechanism-specific Canadian review before implementation. See
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
