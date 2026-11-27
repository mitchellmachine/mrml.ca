# MRML UEFI boot and Secure Boot administration

**Status: PLANNED.** Existing bounded UEFI loading, signed-container checks,
measured-boot plumbing, release/recovery journals, and owner-policy abstractions
retain their recorded status. No current claim is made for firmware NVRAM writes,
boot-entry creation, owner-key enrollment, compatibility-trust preservation,
dbx update, dual boot, or physical-firmware behavior.

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

The planned menu offers `MRML`, `MRML — Total MicroVM Isolation`, `MRML
Recovery`, and independently discovered `Windows Boot Manager` where applicable.
The Total entry requests the same admitted `SystemGeneration` with a strict
nonpersistent overlay. `BOOTX64.EFI --isolation=total-microvm` from UEFI/EFI
Shell produces the same typed policy; it is not a second parser or loader. The
request is authenticated into the boot handoff, expires after one boot, and
cannot bypass Secure Boot, signatures, release admission, anti-rollback,
capabilities, or isolation floors. Selection does not prove runtime satisfaction.
If virtualization, resources, or a required microVM are unavailable, the loader
and runtime never silently continue as Balanced; retry, Balanced-once, or
Recovery requires explicit owner selection. See
[../ISOLATION_PLACEMENT.md](../ISOLATION_PLACEMENT.md).

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
