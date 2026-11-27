# MRML storage tooling, disk images, and optical media

Status: **DESIGN GOAL / PLANNED** except where this document cites an existing
implementation and focused evidence. Existing capability-bound native storage,
virtual block queues, package-derived GPT/FAT boot media, and deployment
transactions are foundations; UDF, optical burning, ATAPI, USB optical, VirtIO
optical, and real-drive passthrough are not thereby implemented.

## Typed administration and authority

First-party tooling and the object shell share typed services for `Disk`,
`BlockDevice`, `PartitionTable`, `Partition`, `Volume`, `Filesystem`,
`DiskImage`, `OpticalDrive`, `OpticalMedia`, and `OpticalImage`. Every physical
or virtual device and inserted medium has stable object identity plus a
generation. `/dev/sda`, `Disk 1`, `D:`, paths, labels, and enumeration numbers
identify presentation only and never authorize.

Visibility is separate from destructive authority. Capabilities distinguish at
least disk read, health read, disk write/erase, partition read/modify,
filesystem format/check, disk-image create/write, and optical read/burn/erase/
eject. A destructive preview binds the exact device/media generation, operation,
ranges, image digest, and consequences before owner authorization. Reuse of an
enumeration number or media replacement invalidates old authority.

Platform/native block descriptors enter the isolated `BlockService` through an
atomic fixed-capacity registration set. The service preflights set-internal
duplicates, collisions with every live registered identity, and complete slot
capacity before publishing any descriptor. Registration records identity and
geometry only; an explicit principal-bound session grant is still required for
every read, write, flush, or superblock operation. Hardware discovery backends
must use this control-plane boundary rather than granting authority from PCI,
AHCI, VirtIO, firmware, path, or enumeration metadata.

Initial session publication for a registered set is atomic as well.
`BlockSessionGrant` records an explicit device, principal, and attenuated rights
decision; `grant_sessions_atomic` validates every device and rights mask plus
complete session capacity before publishing any handle. A late unknown device,
invalid right, or exhausted table therefore leaves no partial I/O authority.

The registration boundary now **PARTIALLY IMPLEMENTS** stable platform/media
provenance. `PlatformBlockDeviceIdentity` records an opaque nonzero stable
identifier, transport class, and exact nonzero controller and media generations
beside the service-local descriptor. `BlockDeviceId` remains a local registry
identity and never substitutes for that provenance or grants authority. A
replacement media generation cannot coexist under the same live stable
controller identity: removal first revokes every old session, after which the
new generation may be registered. Installed-recovery enumeration accepts only
sessions backed by this platform descriptor and rejects legacy registration
before block I/O. The current hosted source supplies synthetic provenance;
native UEFI/AHCI/USB/VirtIO identity derivation and physical media evidence
remain **PLANNED**.

The first UEFI source primitive is now **PARTIALLY IMPLEMENTED** in the shared
firmware library. ABI-checked `EFI_BLOCK_IO_PROTOCOL`/media layouts are copied
into a bounded snapshot only after canonical Boolean, media-presence, alignment,
block-count, and overflow validation. A maximum-4096-byte, single-instance UEFI
device path is structurally validated through its exact end node and hashed with
an MRML domain separator into the opaque boot-scoped stable identifier;
firmware `MediaId` maps injectively to a nonzero media generation. This creates
non-authorizing descriptor input only. The loaded-image source now opens the
exact device handle's Block I/O and Device Path protocols with UEFI
`GET_PROTOCOL`, copies all inputs into caller-owned bounded memory, and closes
both relationships before returning. Failure to open the second protocol cleans
up the first; both closes are attempted and any close failure rejects discovery.
Actual loader integration, reads, multi-device enumeration, persistence across
boots, and physical firmware evidence remain **PLANNED**.

An exact 4 KiB recovery-read bridge is now **PARTIALLY IMPLEMENTED** for
compatible 512/1024/2048/4096-byte UEFI media. It uses a 4096-aligned private
buffer, checked logical-to-firmware LBA multiplication and range bounds, and one
firmware request covering exactly the constituent blocks. The complete media
snapshot is revalidated before and after the read. Backend failure or post-read
media replacement erases all output; incompatible block size/alignment fails
before firmware access. This is host-mocked and cross-build evidence, not a
running loader, durable storage, OVMF, or physical-device result.

Bounded UEFI Block I/O handle enumeration is now **PARTIALLY IMPLEMENTED**.
`LocateHandleBuffer(ByProtocol)` output is treated as firmware-owned hostile
storage: count, fixed caller capacity, alignment, null handles, and duplicates
are checked before publication; the array is copied locally and `FreePool` is
required on every allocated result, including locate failure. Free uncertainty
rejects the operation. Handle values and firmware order remain ephemeral
presentation and never form stable identity or authority. Per-handle descriptor
opening, block-zero volume matching, and real-loader execution remain next.

One per-handle recovery-header transaction is now **PARTIALLY IMPLEMENTED**.
It opens Block I/O and Device Path together, snapshots media, converts compatible
firmware geometry into exact native 4 KiB geometry, reads block zero, decodes the
canonical `VolumeHeader`, exact-matches its size/count to the converted
descriptor, erases scratch, and closes both protocols before publishing a
candidate. Invalid headers and close uncertainty publish nothing. Windows and
Arch Linux each pass 33 UEFI-library tests and cross-build the target; this is
mocked protocol evidence, not a real installed-volume scan.

Complete-set expected-volume selection is now **PARTIALLY IMPLEMENTED** above
that probe. Every bounded handle is considered; unsupported/non-MRML media may
be skipped, while protocol, read, replacement, or close uncertainty aborts the
scan. Candidate handle/local-ID substitution, duplicate stable platform
identity, zero expected matches, and multiple expected matches fail distinctly.
Reversing firmware enumeration order selects the same stable identity. Windows
and Arch Linux each pass 34 UEFI-library tests and cross-build the target; real
loader invocation and root reads remain **PLANNED**.

Selected-device redundant-root reopening is now **PARTIALLY IMPLEMENTED**. The
ephemeral handle is reopened, its complete path/media/native geometry descriptor
is exact-matched, and block zero must reproduce the selected canonical header
before primary and secondary roots are read. Neither root buffer survives a
header/path/media mismatch, failure of the second read, or failure to close
either protocol after successful I/O. Windows and Arch Linux each pass 35 UEFI-
library tests and cross-build the target. Root graph validation and real-loader
ownership transfer remain **PLANNED**.

A read-only exact-generation `StorageBlockDevice` adapter is now **PARTIALLY
IMPLEMENTED** for the selected UEFI handle. It is lent only inside one reopened,
path/media/header-revalidated protocol lifetime, uses private aligned transfer
storage, and publishes a multi-block read only if every constituent 4 KiB block
succeeds. A late failure zeroes the complete caller destination. Write, flush,
and superblock replacement are always denied, and close uncertainty discards the
operation result. Windows and Arch Linux each pass 36 UEFI-library tests and
cross-build the target. The reachable-graph validator has not yet been composed
through this adapter.

Complete reachable-graph validation through that exact UEFI generation is now
**PARTIALLY IMPLEMENTED**. One operation keeps the selected Block I/O and device-
path protocols open while the shared `BlockVolume` reads both redundant roots
and the existing storage validator traverses allocation, object-ID, directory,
and file metadata. No UEFI-specific filesystem parser or recovery selector is
introduced. Scratch is erased on every outcome, and close uncertainty discards
an otherwise valid recovered graph. Windows and Arch Linux each pass 37 UEFI-
library tests and cross-build the target. Real-loader invocation and transfer of
the recovered installed owner into early boot remain **PLANNED**.

The real UEFI loader now **PARTIALLY IMPLEMENTS** installed-graph admission
before `ExitBootServices`. When the authenticated recovery journal names a
volume/root, the loader enumerates at most 32 Block I/O handles, selects exactly
one matching volume, validates its complete graph through the scoped adapter,
and exact-matches the recovered root generation with the journal. The boot
validator is explicitly bounded to 256 allocation records, 64 directories, 64
extents per file, 64 objects, and 64 KiB metadata scratch; exceeding a bound
fails boot rather than weakening validation. The UEFI target cross-builds on
Windows and Arch Linux. This is compile evidence, not firmware execution, physical-media
evidence, or transfer of device identity into the kernel.

The exact installed selection now converts into a canonical 104-byte,
non-authorizing boot identity and is retained through `ExitBootServices` to
handoff construction. It carries source class, opaque stable ID,
controller/media generations, 4 KiB-native geometry, volume, and selected root;
firmware handles, local device IDs, sessions, pointers, and capabilities are
absent. Windows kernel tests pass 561, UEFI tests pass 37, and the UEFI target
cross-builds. The canonical kernel handoff does not yet include the record, and
cross-transport native-device correlation remains **PLANNED**.

The canonical kernel handoff now includes the record under a distinct flag and
requires exact volume/root-generation equality with its authenticated recovery
metadata. The encoder shifts the existing SMP/MADT tail only after validating
capacity, and the decoder rejects malformed identity or inconsistent tail
length before publishing regions. The real loader uses this path. Windows
kernel tests pass 561, UEFI tests pass 37, and the UEFI target cross-builds.
Native AHCI/USB identity correlation and live `BlockService` reacquisition
remain **PLANNED**.

The service half of live reacquisition is now **PARTIALLY IMPLEMENTED**. One
bounded supervisor operation exact-matches the handed source, stable identifier,
controller/media generations, and geometry against a unique registered platform
descriptor before granting a principal-bound read-only session. Identity is
still data rather than authority; write remains denied and all block reads use
the ordinary session checks. Windows and Arch Linux storage suites pass 125
tests. Native transport enumeration, the proof that its derived identity
corresponds to the firmware source, configuration-service composition, and
physical-media execution remain **PLANNED**.

Configuration-service composition is now **PARTIALLY IMPLEMENTED** through the
same boundary. It reads and validates block zero via the reacquired session,
then exact-matches the handoff volume, geometry, and selected primary/secondary
root before creating the installed selection consumed by graph recovery. Any
failure revokes the new session before return. Configuration passes 49 tests on
Windows and Arch Linux; WHP/KVM runner parity remains 11/12. Native driver
correlation, complete graph/Total-owner composition, and physical media remain
**PLANNED**.

Complete graph/Total-owner composition is now **PARTIALLY IMPLEMENTED** in the
controlled hosted path. Recovery-only handoffs carry the installed identity;
the recovery source refuses absence, reacquires its exact read session, validates
the selected root and reachable graph, and retains the installed selection
through Total admission. Windows and Arch Linux pass 561 kernel and 49
configuration tests; WHP/KVM runner parity passes 11/12. Native transport
enumeration/correlation, durable storage, OVMF, and physical media remain
**PLANNED**.

The transport-neutral correlation control plane is now **PARTIALLY
IMPLEMENTED**. `NativeBlockCorrelationVerifier` is an unsafe trusted-driver
contract: success must prove that an independently discovered physical route
and medium are the exact firmware-selected device, and may not be implemented
by copying IDs or matching presentation paths/names/order. `BlockService`
preflights native transport, geometry, capacity, local/native identity, and
existing boot correlations, calls the verifier, then atomically stores the
native descriptor plus exact boot correlation without granting I/O. Storage
passes 126 tests on Windows and Arch Linux. AHCI, USB, and native VirtIO
verifiers and hardware execution remain **PLANNED**.

`ExactNativeBlockCorrelationVerifier` is now **PARTIALLY IMPLEMENTED** as the
safe default for a driver that independently reconstructs the firmware-stable
route. It exact-matches stable ID and controller/media generations and prevents
an already-native AHCI/USB/VirtIO source from changing transport. UEFI may map
only into those supported native transports. This check and capability issuance
form the control plane; subsequent reads use the shortest safe existing block
data path under the exact issued session. Storage passes 127 tests on Windows
and Arch Linux. No native route parser, controller enumerator, or physical
device has been implemented or exercised by this increment.

The boot/native stable-ID algorithm is now **PARTIALLY IMPLEMENTED** as one
shared storage contract rather than duplicated firmware knowledge.
`canonical_uefi_block_stable_id` bounds and structurally validates one canonical
single-instance UEFI device path before applying the existing domain-separated
SHA3-256 digest; the UEFI library calls it directly. Truncation, malformed node
lengths, multiple instances, missing termination, and trailing bytes fail closed.
This enables a future native driver to compare
an independently reconstructed route using exactly the boot algorithm, but it
does not reconstruct that route or grant device authority. Storage passes 128
tests and UEFI 37 tests on Windows and Arch Linux; UEFI cross-builds on both.

The supported SATA route now has a **PARTIALLY IMPLEMENTED** typed extraction
design-around. `parse_canonical_uefi_sata_block_route` accepts only ACPI root,
one to eight valid PCI nodes, SATA target, optional valid hard-drive media node,
and end-entire. It retains the exact full-path stable digest and compares native
root/PCI/SATA/partition fields directly; native code need not reconstruct UEFI
binary path bytes. The typed route is data, not registration or I/O authority.
Storage passes 129 tests on Windows and Arch Linux; UEFI remains 37 tests and
cross-builds on both. Canonical typed handoff is described below; native AHCI
enumeration remains **PLANNED**.

The typed-handoff prerequisite is now **PARTIALLY IMPLEMENTED** as a canonical
128-byte kernel record. It binds the route version, ACPI root, one through eight
PCI hops, SATA target, optional partition identity, and exact stable ID while
requiring all reserved and unused bytes to be zero. The UEFI boundary translates
its retained route only when the full stable ID still equals the recovered block
descriptor. This authority-free record avoids native reconstruction of firmware
bytes. Kernel passes 563 tests and UEFI 37 tests on Windows and Arch Linux, with
UEFI cross-builds on both. Handoff carriage is described below; independently
enumerated native correlation remains **PLANNED**.

Canonical carriage of the typed route through `BootHandoff` is now **PARTIALLY
IMPLEMENTED**. A distinct presence flag places the fixed 128-byte route after
the installed identity and before SMP/MADT bytes. The adjacent identity must be
UEFI-sourced and carry the same exact stable ID; route-only input, substitution,
malformed length, and noncanonical route bytes fail closed before publication.
The real loader retains and emits both records before leaving firmware. Kernel
passes 563 tests and UEFI 37 tests on Windows and Arch Linux, UEFI cross-builds
on both, and WHP/KVM runners pass 11/12. Native enumeration and correlation
remain **PLANNED**; no AHCI, USB, VirtIO, OVMF, or physical-device evidence is
claimed.

The native side of this equality boundary is now **PARTIALLY IMPLEMENTED** as
`NativeSataBlockRoute` and `SataNativeBlockCorrelationVerifier`. A trusted
driver supplies bounded ACPI/PCI/SATA/optional-partition fields with no copied
stable ID or authority. The verifier exact-matches every field against the
handed route and separately requires the boot stable ID, AHCI transport,
controller/media generations, and geometry before existing atomic registration.
The first native AHCI discovery boundary is also **PARTIALLY IMPLEMENTED**: an
immutable PCI-enumerator snapshot must carry the exact mass-storage/SATA/AHCI
class tuple, a live nonzero configuration generation, a type-zero function, and
a bounded non-prefetchable 32-bit ABAR with valid power-of-two size and
alignment. Its result is identity and geometry, never mapping or I/O authority.
Storage passes 135 tests on Windows. Native PCI enumeration, ABAR mapping, AHCI
register/DMA/interrupt mechanics, reacquisition, Arch Linux parity, and physical
evidence remain **PLANNED**.

The first ABAR authority boundary is now **PARTIALLY IMPLEMENTED** without
claiming controller access. Given a caller-correlated typed PCI descriptor,
`KernelAhciAbarPreactivationOwner` requires live mapping/control handles and
exact launch-bound ABAR generation/geometry, then accepts only the launch-bound
prepared task whose generation remains construction-pending in the borrowed
`TaskRuntime`, whose saved CR3 root matches the exclusively owned inactive
hierarchy, and whose service-domain target matches the backend. Its private
backend installs only the launch-bound `USER_MMIO_READ_WRITE` range; explicit
rollback returns the prepared task only after exact withdrawal, while
uncertainty retains the owner and poisons the hierarchy. Ordinary applications
and the public generic mapping traits cannot reach this concrete path. Wrong
ABAR generation/geometry, authority, runtime, root, or target fails before
publication. PCI location/vendor/device fields remain caller-bound data because
the launch record does not retain them. Storage passes 143 tests on Linux and
the kernel suite passes 709.

This owner covers only preactivation ABAR construction. The unsafe caller must
prove root uniqueness and descriptor-PCI-identity/device-object correlation,
keep PAT index 3 UC on every eligible CPU, and exclude cacheable aliases for the
full installed lifetime. It cannot create the existing mapped-task token. No
owner yet combines this concrete inactive ABAR hierarchy with the four concrete
CPU mappings; activation-time effective-leaf revalidation, permanent task
quarantine or activation exclusion on poison, an active-root owner, local or SMP
TLB withdrawal, and IOMMU binding also remain absent. No installed CPL3 entry,
live KVM/WHP run, register access, or physical behavior was exercised; those
remain **PLANNED**.

Patent review: **NOT_TRIGGERED**. Conventional x86-64 four-level permission
aggregation, 4 KiB PWT/PCD PAT-index selection, exact PAT MSR set/readback, and
ordinary user-copy exclusion add no new storage algorithm or interoperability
protocol. See [the patent review log](../patents/REVIEW_LOG.md).

The global-register initialization gate is now **PARTIALLY IMPLEMENTED** for
the bounded Canadian software-driver scope. `NativeAhciRegisterIo` admits only
aligned volatile 32-bit accesses inside one already-authorized exact-generation
ABAR mapping. `reset_ahci_controller` disables global interrupts, enables AHCI
mode, requests the standard HBA reset, waits for a fixed maximum poll count,
reasserts AHCI mode with interrupts still disabled, and publishes a controller
snapshot only after validating version, capability-derived port/command-slot
bounds, and the implemented-port bitmap. Timeout, access uncertainty, malformed
mapping state, unavailable AHCI mode, invalid version, no ports, or a port bit
outside the advertised bound publishes nothing. Storage passes 143 tests on
Windows and Arch Linux for this global-register boundary.

The next port/signature boundary is **PARTIALLY IMPLEMENTED IN SOURCE** as a
read-only atomic scan. `discover_ahci_ports` requires the exact retained object,
configuration generation, and mapping generation; stabilizes the controller's
capability/version/implemented-port state before and after discovery; reads no
unimplemented port; and compares two complete bounded observations before
publishing indexed snapshots. Per-port interrupts, command/FIS engines, SATA
active bits, and command-issue bits must all be inactive. Link detection, speed,
power state, and SATA/ATAPI/enclosure-management/port-multiplier signatures are
classified; a stable unknown signature remains descriptive and cannot qualify
for installed recovery. Thirteen static hostile-model tests cover stale
mapping/controller state, offset bounds, unimplemented ports, read uncertainty,
state substitution, controller substitution, active engines/commands, malformed
link state, and unavailable signatures. The focused Windows gnullvm storage
suite passes 156 tests, including the thirteen tests for this boundary. Linux
execution was not available in this workspace, so no Linux pass count is
claimed for the increment. No physical HBA, link, DMA, interrupt delivery,
ATA/ATAPI command, NCQ, media, OVMF, or installed-device reacquisition evidence
is claimed.

Port base programming is now **PARTIALLY IMPLEMENTED IN SOURCE** without engine
activation. Exact mapping generations and a quiescent port are required before
writing all four 32-bit halves of the command-list and received-FIS physical
bases, followed by exact read-back. Preflight uncertainty returns the untouched
DMA owner. Once any write occurs, later write/read/substitution uncertainty
produces a quarantined owner that cannot use ordinary DMA removal. Storage
passes 166 tests on Windows and Arch Linux.
No command header/table content, PRDT, engine start, interrupt, ATA/ATAPI, NCQ,
IOMMU hardware, OVMF, or physical device was exercised.

The extracted AHCI provider now **PARTIALLY IMPLEMENTS** construction of one
non-NCQ ATA `READ DMA EXT` or `WRITE DMA EXT` command without issuing it. One
idle advertised slot receives a checked 48-bit LBA, nonzero exact 512-byte sector
count, at most 1 MiB contiguous data extent, five-DWORD host-to-device FIS, and
one PRDT entry. Device-read requires data-buffer `WRITE`; device-write requires
`READ`, with separate `PIN | MAP`. Control DMA overlap, stale/wrong authority,
dirty headers/tables, active/issued slots, overflow, and partial mutation fail
closed. Every written header/FIS/PRDT DWORD is read-verified; post-write
uncertainty quarantines the active layout. The AHCI library passes 55 tests on
Windows and Arch Linux.

Bounded polling command execution is now **PARTIALLY IMPLEMENTED IN SOURCE**.
The executor accepts only a clean running non-NCQ port, publishes exactly one
prepared slot through `PxCI`, rejects appearance of any unrelated issued slot,
and bounds completion polling to 1,000,000 reads. Completion rechecks task-file,
SATA-error, and task-file-error interrupt state and requires the command
header's transferred-byte count to equal the authorized data extent. Any
uncertainty after the issue write quarantines both the retained port layout and
data extent; only exact success restores the active-port owner. The AHCI library
passes 58 tests on Windows and Arch Linux. This is simulated register/memory
evidence only. Interrupt delivery, data-content verification, NCQ, IOMMU
hardware, OVMF, installed recovery, and physical hardware remain **PLANNED**.

Canonical AHCI read/write adaptation is now **PARTIALLY IMPLEMENTED IN
SOURCE**. `AhciBlockIoAdapter` decodes the shared generation-1 interface,
exact-matches a generational device session, checks LBA arithmetic, capacity,
logical-block byte count, borrowed-memory length, and read-only state, and then
passes only the selected catalog record plus exact memory slice to a replaceable
AHCI mechanism backend. The record carries the exact media generation that the
backend must revalidate before command issue. Stale, malformed, overflowing,
out-of-range, and read-only requests never reach device mechanism. The AHCI
library passes 60 tests on Windows and Arch Linux. A production DMA-buffer
backend and read/write service-loop dispatch remain **PLANNED**; no hardware I/O
is claimed.

Completed AHCI command-slot recycling is now **PARTIALLY IMPLEMENTED IN
SOURCE**. It consumes only a verified completion, zeroes and verifies the exact
completed 256-byte command table, then restores and verifies that slot's
initialized 32-byte header with only its immutable table address retained.
Other slots are not touched. Any write or read-back uncertainty quarantines the
exact port layout and data extent; only full cleanup returns both for reuse. The
AHCI library passes 62 tests on Windows and Arch Linux. This is memory-model
evidence, not cache-coherence, DMA, IOMMU, or physical-device evidence.

The reusable single-port AHCI block backend is now **PARTIALLY IMPLEMENTED IN
SOURCE**. It requires separate exact `PIN | MAP | WRITE` and `PIN | MAP | READ`
data capabilities for device reads and writes, respectively, and revalidates
the generational provider session and media generation on every operation. One
bounded transaction composes buffer zero/copy and CPU/device synchronization,
command preparation, polling execution, slot recycling, result copy-back, and
data sanitization. Pre-issue rejection can restore the untouched port only if
sanitization succeeds; command, cleanup, synchronization, or sanitization
uncertainty makes the backend unavailable. The AHCI library passes 64 tests on
Windows and Arch Linux. Cache/IOMMU implementations, service IPC dispatch, and
physical-device execution remain **PLANNED**.

Isolated AHCI read/write service dispatch is now **PARTIALLY IMPLEMENTED IN
SOURCE**. The loop accepts exactly one full generation-1 read or write envelope
and one nonzero transferred shared-memory capability, reconstructs only a
bounded local borrowed view, copies write input inward or successful read output
outward in the correct direction, releases the received capability before
reply, and wipes request, token, scratch, and response buffers on all exits.
Protocol-level device errors return without copying read scratch to the caller.
The AHCI library passes 66 tests on Windows and Arch Linux. The raw syscall
adapter and control-operation dispatch remain **PLANNED**; no hardware evidence
is claimed.

AHCI control adaptation and isolated dispatch are now **PARTIALLY IMPLEMENTED
IN SOURCE**. Flush/reset exact-match the generational session and advertised
operation flag, reject zero backend receipts, and preserve reset cleanup failure
separately. Their service loop accepts exactly the fixed control envelope and
rejects every transferred capability or token, sends no reply for malformed
authority, and wipes request/token/response buffers. The AHCI library passes 69
tests on Windows and Arch Linux. Concrete ATA flush and device-reset mechanisms
plus raw syscall wiring remain **PLANNED**.

Concrete AHCI durability flush is now **PARTIALLY IMPLEMENTED IN SOURCE**. It
builds the conventional no-data, zero-PRDT ATA `FLUSH CACHE EXT` FIS in clean
slot zero, verifies every mutation, publishes only that `PxCI` bit, bounds
completion to 1,000,000 reads, rejects task-file/SATA/interrupt errors and any
nonzero transferred-byte count, then zeroes and verifies the command table and
restores the initialized header. Preflight failure preserves the owner; every
post-mutation uncertainty quarantines it. The reusable backend issues monotonic
nonzero durability serials only after full success. AHCI passes 71 tests on
Windows and Arch Linux. Device reset, raw syscall wiring, cache-coherence/IOMMU
implementations, and physical hardware remain **PLANNED**.

Fail-closed AHCI SATA-port reset is now **PARTIALLY IMPLEMENTED IN SOURCE**.
It exact-matches the retained ABAR generations, stops command processing before
FIS receive, holds COMRESET for at least 1,000 microseconds through an explicit
monotonic-delay contract, bounds link recovery, verifies SATA signature and
task/queue state, clears error registers, sanitizes received-FIS memory,
revalidates initialized command memory, and restarts FIS receive before command
processing. The reusable backend sanitizes its data extent first and publishes
only a checked successor media generation; old catalog state becomes stale.
AHCI passes 73 tests on Windows and Arch Linux. This is modeled register,
memory, and timing-contract evidence, not physical SATA reset evidence.

The AHCI raw userspace syscall adapter now carries the existing isolated
enumeration, read/write, flush, and reset loops through canonical buffered IPC
and shared-buffer operations. The launch binding fixes the reply endpoint/task;
request bytes cannot redirect it. Read/write accepts exactly one transferred
capability and releases it before reply, while flush/reset accepts none. The
adapter rejects returned lengths/counts beyond the supplied buffers before
publishing an envelope. Enumeration and data cleanup now retain a received leaf
only after the envelope declares exactly one capability and the token has a
nonzero generation. Missing, malformed, or undeclared token bytes cannot trigger
revocation; any later copy or protocol failure still releases the admitted leaf
before returning. The focused Linux suite passes 76 tests and its release build
passes. No installed service entry, supervisor launch, hardware I/O, or physical
evidence is claimed.

AHCI now has one allocation-free dispatch service for the launch-bound
generation-1 endpoint. One maximum-size receive is routed only to the existing
exact enumerate, read/write, or flush/reset loop, preserving their canonical
decoders, capability shapes, release-before-reply ordering, and erasure rules.
Data and control calls borrow one retained backend owner rather than creating
parallel device state. Unknown sizes and capability over-counts dispatch,
release, and reply zero times. The existing raw userspace adapter now implements
that unified receive surface with the maximum canonical request bound and reuses
the same launch-bound shared-memory, release, and reply syscall mappings. The
79-test focused Linux suite and release build pass; installed entry, supervisor
launch, and physical-device execution remain unverified.

Patent review: **NOT_TRIGGERED**. Exact bounded message-shape routing through
existing operation adapters is conventional service dispatch. See
[the patent review log](../patents/REVIEW_LOG.md).

The first command-memory prerequisite for that installed entry is now
**PARTIALLY IMPLEMENTED IN SOURCE**. One safe adapter exact-binds the retained
command-list, received-FIS, and command-table descriptors to three caller-owned
CPU mappings. Construction rejects malformed generations, geometry, mapping
lengths, object aliasing, and physical overlap. Each little-endian word access
then rejects descriptor substitution, misalignment, overflow, and out-of-range
bytes before touching memory. The production initializer composes through the
adapter and programs only the expected per-slot table bases. The focused Linux
suite passes 83 tests and the release build passes. Allocation, pinning, cache
synchronization, IOMMU installation, mapping construction/revocation, installed
entry, supervisor launch, and physical-device execution remain unverified.

Patent review: **NOT_TRIGGERED**. Exact descriptor-to-slice bounds checking for
already-mapped command memory is conventional memory-safety plumbing and adds
no new storage or device algorithm. See
[the patent review log](../patents/REVIEW_LOG.md).

The matching mapped data-DMA prerequisite is now **PARTIALLY IMPLEMENTED IN
SOURCE**. One safe adapter binds an exact, at-most-1-MiB DMA extent and accepts
only same-object, same-allocation, same-base bounded prefixes. Its state machine
keeps device-write reads separate from device-read writes, invokes distinct
platform prepare/complete visibility callbacks, and cannot return to reusable
state until it zeroes the exact active bytes and the platform confirms sanitized
visibility. Descriptor substitution, length mismatch, operation reordering, and
cache-synchronization uncertainty fail closed; uncertain state retains the exact
cleanup retry. The focused Linux suite passes 86 tests and the release build
passes. A concrete platform cache backend, IOMMU lifecycle, mapping construction,
installed entry, supervisor launch, and physical-device execution remain
unverified.

Patent review: **NOT_TRIGGERED**. Directional cache-visibility callbacks and a
bounded DMA-buffer state machine are conventional driver safety plumbing and
introduce no new storage algorithm. See
[the patent review log](../patents/REVIEW_LOG.md).

The kernel-side native device-service launch prerequisite is now **PARTIALLY
IMPLEMENTED IN SOURCE** as a provider-neutral fixed-capacity attachment. It
exact-authorizes one read-only launch record and one to six independently
delegable source handles, atomically projects only their requested non-delegable
rights into a pristine native-service task, and installs those fresh task-local
handles in the six remaining fixed entry registers. Wrong objects, overbroad or
duplicate source handles, target `DELEGATE`, occupied registers, projection
failure, and counts outside 1–6 publish no runnable entry. Entry failure revokes
every projected leaf, while later source-root revocation independently reaches
each descendant. The focused Linux kernel suite passes all 685 tests. This does
not yet define AHCI launch-data bytes or bind the six slots to exact device,
command-memory, and directional data-memory roles; mapping construction, the
service binary, supervised teardown, active execution, and physical-device
evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Bounded attenuation through the existing
atomic capability-projection graph and fixed native entry registers is
conventional least-authority service construction. See
[the patent review log](../patents/REVIEW_LOG.md).

AHCI now **PARTIALLY IMPLEMENTS IN SOURCE** the typed binding from that generic
attachment to six exact roles: device `CONTROL`; separate command-list,
received-FIS, and command-table `MAP|READ|WRITE`; data device-write
`PIN|MAP|WRITE`; and data device-read `PIN|MAP|READ`. The binding exact-matches
each object to one validated ABAR, active-port layout identity, bounded data
extent, and generation-bound 512-byte block catalog record. Wrong generations,
geometry, flags, role order/rights, memory-object aliasing, and any physical
overlap among MMIO, command memory, and data memory fail before publication. The
focused Linux AHCI suite passes 89 tests and the kernel suite passes 685. This is
a typed pre-encoding boundary: canonical hostile launch bytes, DMA CPU-mapping
records, active-port reconstruction, the service binary, supervised teardown,
active execution, and physical-device evidence remain unverified.

Patent review: **NOT_TRIGGERED**. Exact role/object/right matching and physical
range disjointness checks are conventional least-authority driver launch
validation. See [the patent review log](../patents/REVIEW_LOG.md).

The AHCI launch-data boundary is now **PARTIALLY IMPLEMENTED IN SOURCE** as a
canonical 384-byte little-endian record containing exact system, provider,
attachment, device, ABAR, port-layout, data-region, and four CPU-mapping
generations and ranges. It contains no capability tokens; the separately
projected handles remain the only authority. Decode rejects header, length,
reserved-field, handle-like-value, geometry, canonical-address, alignment, and
mapping-overlap corruption, and binding exact-matches all launch generations
before reusing the typed six-role validator. The focused Linux AHCI suite passes
all 92 tests. Installed launch-memory copying, CPU mapping construction,
active-port reconstruction, service binary entry, concrete cache/IOMMU
backends, supervised teardown, active execution, and physical-device evidence
remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: YES
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. A fixed-layout endian codec with bounded
generation, reserved-field, range, and overlap validation is conventional
hostile-input parsing and introduces no new storage algorithm. See
[the patent review log](../patents/REVIEW_LOG.md).

AHCI service-side launch consumption is now **PARTIALLY IMPLEMENTED IN SOURCE**.
The userspace adapter copies the bounded record only through the exact read-only
launch capability installed by the kernel. The installed-projection binder then
decodes it, exact-matches the provider-generation register, rejects invalid or
aliased capability tokens, and exposes the fixed six-role register order through
typed accessors; copied identity bytes still cannot manufacture authority. The
focused Linux AHCI suite passes all 95 tests. Native entry/register capture,
launch-buffer wiping at entry, capability-backed mapping construction,
active-port reconstruction, concrete cache/IOMMU backends, supervised teardown,
active execution, and physical-device evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Bounded read-only launch-data copying and
fixed-order installed capability-token validation are conventional service-entry
plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

The AHCI native bootstrap boundary is now **PARTIALLY IMPLEMENTED IN SOURCE** as
one fail-closed operation over the installed projection. It rejects an invalid
launch token, zero provider generation, or alias between launch data and an
authority before any syscall; otherwise it performs one exact copy, binds the
decoded record and six ordered capabilities, and erases the 384-byte scratch
buffer after success or any copy/decode/binding failure. The focused Linux AHCI
suite passes all 97 tests. Assembly register capture, a native binary artifact,
capability-backed CPU mapping construction, active-port reconstruction,
concrete cache/IOMMU backends, supervised teardown, active execution, and
physical-device evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. One bounded capability copy followed by
validation and unconditional scratch erasure is conventional fail-closed
service bootstrap plumbing. See
[the patent review log](../patents/REVIEW_LOG.md).

The complete twelve-register native AHCI entry ABI is now **PARTIALLY
IMPLEMENTED IN SOURCE** as a typed installed-register capture. It validates the
service endpoint, supervisor task, provider generation, exact 384-byte launch
length, service module, launch token, and six fixed-order authority tokens;
invalid tokens (including zero-generation endpoint or task tokens),
launch/authority aliasing, and duplicated authorities fail before copying launch
data. Equal numeric bits across those distinct namespaces remain valid. Only this
validated binding can enter bootstrap. The focused Linux AHCI suite passes all
99 tests. The assembly entry stub and native binary artifact remain
unimplemented, along with capability-backed CPU mapping construction,
active-port reconstruction, concrete cache/IOMMU backends, supervised teardown,
active execution, and physical-device evidence.

Patent review: **NOT_TRIGGERED**. Fixed register-to-field validation and
same-namespace non-aliasing checks are conventional native service ABI binding.
See [the patent review log](../patents/REVIEW_LOG.md).

Pre-launch AHCI CPU mapping construction is now **PARTIALLY IMPLEMENTED IN
SOURCE** as a backend-neutral transaction over four mappings. The launcher must
hold four exact, separate `MAP|READ|WRITE|INSPECT` capabilities for command-list,
received-FIS, command-table, and data memory; none becomes a projected runtime
role. All authority/object pairs are checked before a backend call. The
transaction installs page-rounded RW/NX mappings in canonical record order,
withdraws them in reverse order, rolls back clean partial installation, and
returns the exact retained set when withdrawal is uncertain for bounded retry.
The focused Linux AHCI suite passes all 102 tests. A concrete kernel memory-
resource/page-table adapter, target-address-space binding, ABAR lifecycle
coupling, native entry binary, supervision, active execution, and physical-
device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Capability-preflighted fixed-order mapping,
reverse rollback, and explicit retained cleanup state are conventional resource
transaction handling. See [the patent review log](../patents/REVIEW_LOG.md).

The transaction's concrete kernel memory-resource adapter is now **IMPLEMENTED
IN SOURCE**. It exact-matches each public object and allocation generation to a
typed `MemoryObjectId`, requires physical backing equal to the canonical page-
rounded record range, and independently exact-matches one `MAP|CONTROL` target
address-space capability. It installs and withdraws through `MemoryPoolTable`
and retains every generational `MemoryMappingId` until backend-confirmed removal.
A focused integration test drives four physically backed objects through full
installation and retirement and rejects allocation-generation substitution; the
Linux AHCI suite passes all 103 tests. This proves policy with a simulated
backend, not active x86 page tables, cache, IOMMU, bare metal, or physical
hardware. Inactive-page-table wiring, ABAR lifecycle coupling, the native binary,
and supervision remain unimplemented.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Adapting exact typed memory objects and target
capabilities to the existing memory-resource mapping lifecycle is conventional
kernel resource plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

ABAR MMIO mapping now has an owned teardown lifecycle **IMPLEMENTED IN SOURCE**.
Installation continues to require exact device `MAP|READ|WRITE` and yields an
`InstalledAhciAbarMapping`; withdrawal independently requires exact device
`CONTROL`, exact-matches the object before any backend call, and consumes the
owner only after confirmed unmap and translation-cache invalidation. Wrong-
object control never reaches the backend, and uncertain removal returns the
exact installed mapping for retry. The Linux AHCI suite passes all 105 tests.
Combined ABAR/CPU rollback, active-port quiescence ordering, concrete page-table
and IOMMU invalidation, supervisor task teardown, the native binary, and
physical-device evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Separately authorized exact MMIO installation
and retryable withdrawal are conventional device-mapping lifecycle controls. See
[the patent review log](../patents/REVIEW_LOG.md).

ABAR and CPU mappings now form one combined launch-owned lifecycle **IMPLEMENTED
IN SOURCE**. Construction exact-matches discovered ABAR generation/range to the
canonical record, installs ABAR before all four CPU mappings, and rolls ABAR back
after clean CPU-side failure. Uncertain CPU rollback retains its exact installed
set together with ABAR. Teardown withdraws CPU mappings in reverse order before
ABAR, and either uncertainty returns one resumable state without reporting early
completion. The Linux AHCI suite passes all 108 tests. Active-port quiescence
must still precede this teardown; concrete page-table/IOMMU invalidation, task-
termination integration, the native binary, active execution, and physical-
device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Dependency-ordered construction, reverse
rollback, and resumable combined cleanup are conventional resource transaction
controls. See [the patent review log](../patents/REVIEW_LOG.md).

Live AHCI device quiescence is now ordered before mapping withdrawal and bound
to the command backend's exact owned state **IMPLEMENTED IN SOURCE**. A healthy
backend yields one non-copyable owner containing its active port, ABAR mapping,
data-DMA region, register adapter, command-memory adapter, and data adapter.
Teardown stops and verifies the engine, clears and read-verifies command-list
and FIS bases, zeroes and verifies command memory, sanitizes the data range, and
revokes the exact DMA layout before issuing the typed state that permits CPU and
ABAR mapping removal. Data or DMA uncertainty retains the exact owner and all
adapters for retry. A backend that fail-stopped and lost active-port ownership
yields a distinct quarantine owner and cannot enter ordinary quiescence. The
focused Linux AHCI suite passes all 109 tests and its release build passes.
Concrete cache maintenance, page-table and IOMMU invalidation, supervisor task-
termination wiring, the native service binary, active execution, and physical-
device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Exact-owner typestate and dependency-ordered
device/DMA/mapping cleanup are conventional resource-lifecycle controls. See
[the patent review log](../patents/REVIEW_LOG.md).

AHCI quiescence and generic native-task retirement now form one exact
supervisor-owned transition **IMPLEMENTED IN SOURCE**. Binding requires the
task's launch attachment and provider generation, retained ABAR mapping, all
four still-installed CPU mappings, and data-DMA region to match one bound AHCI
launch generation. Mismatch returns the task, launch, adapters, and quiesced
mappings unchanged. Retirement consumes only that composite owner; wrong-
current failure preserves it for retry, while exact success retains the retired
context with the launch and quiesced resources. The lifecycle test rejects a
different attachment generation, retries after a wrong-current attempt,
retires the exact task, and only then withdraws CPU and ABAR mappings. The
focused Linux AHCI suite passes all 109 tests, the Linux kernel suite passes all
686 tests, and both release builds pass. Successor-dispatch consumption,
concrete page-table/IOMMU invalidation, the native service binary, active
execution, and physical-device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Exact generational binding of already-owned
cleanup state to conventional task retirement is ordinary lifecycle
composition. See [the patent review log](../patents/REVIEW_LOG.md).

Retired AHCI task cleanup now preserves the scheduler termination through
retryable mapping withdrawal and gates successor dispatch **IMPLEMENTED IN
SOURCE**. The composite retired owner removes all four CPU mappings in reverse
order and then ABAR; uncertainty reconstructs the exact retained mapping state,
launch binding, retired context, scheduler termination, and I/O adapters for
retry. No dispatch API accepts that state. Only confirmed complete mapping
withdrawal creates the distinct owner that can exact-match the pending
termination and mint the runtime's opaque successor dispatch. The lifecycle
test injects CPU-unmap failure, proves scheduling remains blocked by pending
retirement, retries cleanup, verifies every mapping absent, and then issues the
selected successor dispatch. The focused Linux AHCI suite remains at 109 tests
and its release build passes; the Linux kernel suite remains at 686 tests and
its release build passes. Concrete page-table/IOMMU invalidation, installation
and completion of the issued hardware dispatch, the native service binary,
active execution, and physical-device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Retaining a scheduler result across ordered
retryable unmapping and releasing dispatch only after completion is conventional
resource-lifecycle sequencing. See
[the patent review log](../patents/REVIEW_LOG.md).

The AHCI command path no longer borrows a kernel-owned `CapabilitySpace`
representation **IMPLEMENTED IN SOURCE**. Command construction and backend
admission instead require one narrow mutable exact-authorizer that receives
only a capability and complete directional rights, then returns its resolved
object or a capability error. The fixed-capacity capability space implements
the same interface for kernel/model use. A recording non-table authorizer test
proves both `PIN|MAP|WRITE` and `PIN|MAP|READ` are requested exactly and wrong-
object resolution still prevents backend construction. The focused Linux AHCI
suite passes all 110 tests and the release build passes. A raw userspace syscall
implementation of this authorizer, native mapped-memory construction, the
service binary, and installed execution remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Abstracting an existing exact capability check
behind a minimal interface is conventional dependency inversion. See
[the patent review log](../patents/REVIEW_LOG.md).

The installed AHCI launch now constructs a concrete userspace data-capability
authorizer **IMPLEMENTED IN SOURCE**. It binds the copied launch record's exact
data object to only the two separately installed directional capabilities,
rejects unknown tokens or wrong complete rights before kernel entry, and
encodes syscall 6 with the capability token, expected object, and exact
`PIN|MAP|WRITE` or `PIN|MAP|READ` bits. Only zero kernel status returns the
already bound object; denial cannot disclose or substitute another identity.
The focused test records both frames, proves pre-syscall rejection, and injects
kernel denial. The Linux AHCI suite passes all 111 tests and the release build
passes. Native raw `int 0x80` invocation, mapped-memory construction, the
service binary, installed dispatch, and physical-device evidence remain
unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Binding a conventional exact-authorization
syscall adapter to already validated launch roles is ordinary capability
plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

The AHCI userspace syscall boundary now has a zero-state x86-64 raw adapter
**IMPLEMENTED IN SOURCE**. Its sole unsafe operation transfers the canonical
`rax`, `rdi`, `rsi`, `rdx`, `r10`, `r8`, and `r9` frame through `int 0x80` and
writes every returned register back to the typed frame; it retains no ambient
task, capability, pointer, or service state. The Linux suite passes all 112
tests, including a layout-only zero-size check that deliberately does not invoke
the host interrupt ABI. Both Linux release and `MRML_NATIVE` release builds
pass. No installed MRML kernel syscall was executed, and native mapped-memory
construction, the service binary entry/loop, active execution, and physical
hardware evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. A direct architecture-ABI register bridge for
an existing syscall mechanism is conventional low-level plumbing. See
[the patent review log](../patents/REVIEW_LOG.md).

The AHCI native mapped-memory boundary is now **PARTIALLY IMPLEMENTED IN
SOURCE**. One documented unsafe constructor revalidates all four installed CPU
virtual mappings before creating any reference, proves their page-rounded
ranges do not overlap, and exposes only each object's exact byte length rather
than mapping padding. It then seals those views into the existing bounded
command-memory and synchronized data-buffer adapters. The focused in-process
test uses aligned host pages and proves the final command-list word and exact
data extent are reachable; it is not page-table, IOMMU, installed-kernel, or
hardware evidence. The Linux suite passes all 113 tests, and both Linux release
and `MRML_NATIVE` release builds pass. Concrete cache synchronization, native
binary entry and dispatch, installed execution, and physical-device evidence
remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Converting already validated, disjoint native
mappings into exact bounded slices is conventional memory-adapter plumbing. See
[the patent review log](../patents/REVIEW_LOG.md).

Installed AHCI active-port reconstruction is now **PARTIALLY IMPLEMENTED IN
SOURCE**. The service exact-matches the launch-bound ABAR and DMA generations,
proves the selected port registers fit the mapping, and obtains two complete
read-only observations of interrupt enable, command state, task-file state,
active commands, and issued commands. It publishes the typed active-port owner
only when both observations are identical, interrupts remain disabled, both
engines remain enabled, and no task-file busy/DRQ state or command is pending.
Register failure, torn state, and every non-idle state publish no owner. The
focused Linux suite passes all 115 tests and both Linux release and
`MRML_NATIVE` release builds pass. These are hostile register-model tests, not
installed execution or physical-device evidence; exclusive device control,
concrete cache synchronization, native binary dispatch, and physical validation
remain outstanding.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Stable double-sampling of conventional AHCI
status registers before reconstructing existing typestate is ordinary defensive
driver plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

The installed AHCI service-state assembly seam is now **PARTIALLY IMPLEMENTED
IN SOURCE**. A single constructor derives the published block catalog, session,
media generation, mapping, data extent, and directional data capabilities only
from the validated installed launch. It consumes the reconstructed active-port
owner and exact mapped-memory adapters, then reuses the command backend's two
exact capability authorizations before publishing service state. Authorization
denial publishes nothing; callers cannot independently substitute catalog or
backend identity fields at this seam. The focused Linux suite passes all 117
tests and both Linux release and `MRML_NATIVE` release builds pass. The cache
backend and raw ABAR view remain injected, so this is composition evidence—not
an installed entry loop, real syscall execution, cache/IOMMU, or physical AHCI
result.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Exact construction of existing service and
backend objects from one validated launch projection is conventional typed
composition. See [the patent review log](../patents/REVIEW_LOG.md).

The assembled native AHCI service now has a bounded one-envelope dispatch
transition **IMPLEMENTED IN SOURCE**. It lends—never moves or duplicates—the
unique command backend to the existing unified dispatcher together with the
single launch-derived catalog record. Each call retains the backend owner for
the next message. An adversarial oversized envelope reaches no shared-memory,
capability-release, response, or device operation, clears request, token, and
scratch storage, and leaves the backend available. The focused Linux suite
passes all 118 tests and both Linux release and `MRML_NATIVE` release builds
pass. This does not create an unbounded native loop or prove real syscalls,
cache/IOMMU synchronization, installed execution, supervision, or hardware.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Lending an existing unique backend through one
bounded validated dispatch call is conventional service-loop composition. See
[the patent review log](../patents/REVIEW_LOG.md).

Native AHCI installed-state preparation is now **PARTIALLY IMPLEMENTED IN
SOURCE** as one fail-closed transition. Under one explicit unsafe mapping
contract it constructs the four exact bounded mapped views, double-samples and
reconstructs the launch-bound idle active port, performs both exact directional
data-capability authorizations, and publishes the assembled service state only
after every stage succeeds. Typed errors identify mapped-memory, active-port,
or final backend-binding failure. The integrated adversarial test proves a
stable non-idle port reaches neither authorization and publishes no state. The
focused Linux suite passes all 119 tests, and both Linux release and
`MRML_NATIVE` release builds pass. The aligned in-process mappings and register
model do not prove installed page tables, real syscalls, cache/IOMMU behavior,
supervisor cleanup, an executable entry, or physical AHCI hardware.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Ordered fail-closed composition of existing
mapping, register-validation, capability, and backend constructors is
conventional service-startup plumbing. See
[the patent review log](../patents/REVIEW_LOG.md).

The authenticated AHCI entry bootstrap now composes directly with installed
state preparation **PARTIALLY IMPLEMENTED IN SOURCE**. One transition consumes
the already captured fixed entry registers, copies the canonical 384-byte
record only through its launch-data capability, validates and binds all six
separately installed authorities, erases the copy, and only then enters mapped
memory, live-port, authorization, and service-state preparation. Bootstrap
failure is a distinct typed preparation stage. The integrated test proves one
copy syscall, exact catalog publication, two data-authority checks, and zeroed
launch scratch before the state is returned. The focused Linux suite passes all
120 tests and both Linux release and `MRML_NATIVE` release builds pass. The raw
syscall and register backends are controlled models; assembly register capture,
an executable image/entry symbol, concrete cache/IOMMU operations, installed
supervision, and physical hardware remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Sequencing an existing authenticated bootstrap,
mandatory scratch erasure, and existing preparation transition is conventional
service-entry plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

The AHCI data path now has an x86-64 platform-coherent visibility adapter
**PARTIALLY IMPLEMENTED IN SOURCE**. Its unsafe constructor admits only one
valid exact data extent and requires the caller to prove that the pinned
physical mapping is hardware cache coherent for only the authorized AHCI
requester. Every transition rejects object, allocation-generation, physical-
base, zero-length, and oversized substitution before applying release ordering
for CPU publication or acquire ordering for device completion. The adapter
explicitly performs compiler ordering only: it does not flush cache lines,
install or revoke IOMMU state, authorize a device, or infer coherence from the
x86-64 target. The focused Linux suite passes all 122 tests and both Linux
release and `MRML_NATIVE` release builds pass. A kernel-issued coherence proof,
installed DMA/IOMMU integration, and physical-platform validation remain
unimplemented.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Exact descriptor validation and conventional
compiler acquire/release fences for an already proven coherent DMA mapping are
ordinary driver plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

The x86-64 coherent AHCI path now has one authenticated preparation boundary
**PARTIALLY IMPLEMENTED IN SOURCE**. The unsafe entry transition documents the
complete platform-coherence precondition once, authenticates and erases the
launch projection, derives the exact data extent from that projection, admits
the coherent visibility adapter, and runs the same mapped-memory, live-port,
capability, and backend preparation chain. Callers cannot inject a different
data descriptor or independently construct the synchronization adapter through
this path. The focused Linux suite passes all 123 tests and both Linux release
and `MRML_NATIVE` release builds pass. The test supplies aligned host memory and
a controlled register/syscall model; no kernel-issued coherence evidence,
IOMMU, installed service image, or physical device is exercised.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Centralizing an existing unsafe coherence
precondition while composing existing typed startup stages is conventional
boundary reduction. See [the patent review log](../patents/REVIEW_LOG.md).

Coherent AHCI entry preparation now constructs register access only after
authenticated launch decode **PARTIALLY IMPLEMENTED IN SOURCE**. Instead of
accepting a preconstructed ABAR adapter, the transition gives the exact decoded
mapping to a one-shot factory and publishes a distinct `RegisterMapping` error
if that factory rejects it. The failure path proves launch scratch is already
zeroed and neither directional capability authorization nor service-state
publication occurs. This removes the circular assumption that entry code knows
the ABAR virtual mapping before reading its authorized launch record. The
focused Linux suite passes all 123 tests and both Linux release and
`MRML_NATIVE` release builds pass. The injected factory remains controlled
model evidence; a native volatile adapter, installed page tables, and physical
hardware are not exercised.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Delayed construction of an exact decoded MMIO
view through a fail-closed one-shot factory is conventional initialization
ordering. See [the patent review log](../patents/REVIEW_LOG.md).

AHCI now has a composed platform-I/O owner **PARTIALLY IMPLEMENTED IN SOURCE**
that joins one launch-bound register adapter with one separately supplied
monotonic-delay backend. Register reads and writes delegate only to the retained
adapter; reset delay forwards the exact requested microseconds and propagates
uncertainty without manufacturing elapsed time. The native constructor creates
the volatile ABAR half only under the existing exclusive authenticated-mapping
safety contract, while timing remains an explicit independent platform
obligation. The focused Linux suite passes all 125 tests and both Linux release
and `MRML_NATIVE` release builds pass. Tests use injected registers and delay;
no monotonic clock implementation, installed MMIO, reset timing, or physical
hardware is verified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Composing existing MMIO and monotonic-delay
interfaces by exact delegation is conventional driver dependency plumbing. See
[the patent review log](../patents/REVIEW_LOG.md).

The authenticated coherent entry path now prepares concrete native platform I/O
**PARTIALLY IMPLEMENTED IN SOURCE**. After launch decode it constructs the
volatile `NativeAhciRegisterIo` exclusively from the decoded ABAR mapping,
combines it with an injected `AhciMonotonicDelay`, admits the exact coherent data
extent, and completes installed state preparation. Thus the returned backend
satisfies both ordinary command-register and reset-delay contracts without an
independently supplied register descriptor. The focused Linux suite passes all
126 tests and both Linux release and `MRML_NATIVE` release builds pass. The new
test performs volatile reads over an aligned host byte array and uses a fake
delay; it is controlled memory evidence, not installed MMIO, a real monotonic
clock, reset timing, IOMMU, or physical-device evidence.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Constructing an existing volatile MMIO adapter
from authenticated mapping data and pairing it with an existing timing contract
is conventional device-service initialization. See
[the patent review log](../patents/REVIEW_LOG.md).

The AHCI monotonic-delay contract now accepts the kernel's existing calibrated
invariant-TSC timing primitive **PARTIALLY IMPLEMENTED IN SOURCE**. The adapter
delegates the exact requested microseconds to `ApStartupTiming::wait_micros`,
which already rejects zero, over-one-second, uncalibrated, and overflowed
durations rather than guessing a frequency. This reuses the kernel's bounded
clock admission instead of adding a sleep syscall or service-local calibration.
The focused Linux suite passes all 127 tests and both Linux release and
`MRML_NATIVE` release builds pass. The new test exercises only invalid-duration
failure without waiting; installed CPL3 TSC availability, detected frequency,
elapsed-time accuracy, reset timing, and physical hardware remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Adapting an existing checked invariant-TSC
delay primitive to an existing driver timing trait is conventional clock
plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

Native coherent preparation now supports the actual launch-bound authorizer
sequence **PARTIALLY IMPLEMENTED IN SOURCE**. Entry code can first authenticate
and erase launch bytes, construct `AhciInstalledDataAuthorizer` from that exact
launch's two directional capabilities and data object, then borrow it while a
separate preparation transition creates native ABAR, coherent-data, active-port,
and backend state. This removes the circular requirement to construct the data
authorizer before the launch reveals its expected object, without caching or
weakening authorization. The integrated test records one launch copy and two
exact authorization syscalls. The focused Linux suite passes all 128 tests and
both Linux release and `MRML_NATIVE` release builds pass. Syscalls, MMIO, clock,
and DMA remain controlled host models rather than installed or physical
evidence.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Ordering authenticated launch decode before
construction of its exact capability authorizer is conventional least-authority
initialization. See [the patent review log](../patents/REVIEW_LOG.md).

The native AHCI service state now owns a persistent authenticated dispatch loop
**IMPLEMENTED IN SOURCE**. It repeatedly invokes the existing bounded
`serve_one` transition while retaining the unique backend owner and returns on
the first fail-closed dispatch error. The underlying transition erases the
request, transferred-capability, and scratch buffers on every attempt. A focused
test supplies an invalid first envelope, observes immediate termination with no
operation dispatched, verifies all three buffers are clean, and confirms the
backend remains available. The focused Linux suite passes all 129 tests and both
Linux release and `MRML_NATIVE` release builds pass. This is controlled syscall
and backend-model evidence; installed blocking receive behavior, executable
entry integration, supervisor termination, and physical AHCI hardware remain
unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Looping over the existing bounded authenticated
dispatcher until its first error is conventional service control flow. See
[the patent review log](../patents/REVIEW_LOG.md).

Native AHCI entry working storage is now **IMPLEMENTED IN SOURCE** as one fixed,
4 KiB-aligned, BSS-suitable owner. It centralizes the canonical maximum transfer
at 1 MiB, binds dispatch scratch to that same launch-admission and command bound,
keeps the large buffer off the guarded entry stack, and separately clears launch
scratch, request bytes, transferred-capability tokens, and data scratch before
each borrowed phase. Explicit erasure covers the complete owner. A static-storage
test verifies alignment, exact bounds, phase clearing, and full erasure. The
focused Linux suite passes all 130 tests and both Linux release and
`MRML_NATIVE` release builds pass. This is source, unit, and ABI-compilation
evidence; exclusive installed BSS ownership, the native entry symbol, supervisor
launch/termination, and physical AHCI hardware remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Fixed aligned service working buffers and
explicit zeroization are conventional bounded runtime storage. See
[the patent review log](../patents/REVIEW_LOG.md).

The aggregate service image now has a dedicated `ahci_service_entry` profile
**PARTIALLY IMPLEMENTED IN SOURCE**. Its assembly entry preserves all six
fixed-order authority registers before mapping the six service identity and
launch fields plus six stack arguments into one explicit SysV receiver. The
receiver validates that exact register projection, copies and erases the launch
record, constructs the launch-bound directional authorizer, admits only a
calibrated invariant-TSC delay, prepares native coherent ABAR/DMA state, and
runs the persistent dispatcher over the single static buffer owner. The first
dispatch error erases all working storage and issues the existing operation-3
stop request. The source-tested freeze-first manager handoff is separate; no
installed syscall path yet routes that request into it. The canonical workspace
lock and manifest checks pass;
both the default and AHCI-profile `MRML_NATIVE` service-image release builds
pass; focused AHCI Linux tests remain 130/130; and controlled PE disassembly
confirms the entry register saves, argument moves, and receiver call. No service
was installed or invoked, so blocking IPC, supervisor cleanup, MMIO/DMA, KVM,
WHP, IOMMU, and physical AHCI behavior remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. A fixed register-to-language entry shim and
composition of existing launch, authorization, timing, and dispatch mechanisms
are conventional service integration. See
[the patent review log](../patents/REVIEW_LOG.md).

Bound AHCI launches now compose directly with kernel native-device task
construction **IMPLEMENTED IN SOURCE**. One typed transition consumes the
already-validated launch, projects its exact read-only record and six attenuated
authority roles into a fresh native task through the kernel's existing atomic
construction path, and returns the task and unchanged bound launch as one owner
for later mapping, dispatch, and teardown. Any construction or rollback error
returns that same bound launch for explicit retry. Focused tests prove exact
task/source/attachment/provider pairing and an occupied-entry failure that
preserves the target context while returning the launch; the kernel's existing
construction test covers removal of every partially projected target handle.
The AHCI Linux suite passes all 132 tests, the kernel Linux suite passes all 686
tests, and both Linux and `MRML_NATIVE` AHCI release builds pass. This is unit
and simulated capability-runtime evidence, not installed task scheduling,
service-image invocation, IOMMU operation, or physical-device evidence.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Typed composition of an existing bound launch
with existing atomic task construction and rollback is conventional lifecycle
plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

Prepared AHCI tasks now compose with exact pre-launch mapping installation
**IMPLEMENTED IN SOURCE**. The transition reconstructs the canonical record only
from its retained bound launch, exact-matches the descriptor's launch-bound
configuration generation and ABAR geometry, then installs the ABAR and four
launch-named CPU mappings through the existing rollback-complete lifecycle.
Success retains the prepared task/launch owner and the complete mapping
teardown state together. Every failure returns the same prepared owner;
retained or uncertain mappings remain carried by the existing typed mapping
error for explicit cleanup. Tests prove exact successful mapping of the bound
set and descriptor substitution returning the task owner before any ABAR or CPU
backend mutation. The AHCI Linux suite passes all 134 tests and both Linux and
`MRML_NATIVE` release builds pass. This is controlled backend and
capability-runtime evidence, not active page-table, IOMMU, installed-task, or
physical AHCI execution evidence.

A concrete preactivation ABAR page-table owner is now **PARTIALLY IMPLEMENTED
IN SOURCE**. It checks the live mapping/control handles and exact launch-bound
ABAR generation/geometry, then matches the prepared task's owning runtime and
construction-pending generation, saved CR3 root, service-domain target, and
launch-bound range before using a private inactive-hierarchy backend. A separate
non-copy mapping-set owner now composes that backend with the kernel
`MemoryPoolTable` adapter and installs/verifies the ABAR plus all four
launch-named CPU mappings in the same exact inactive hierarchy. It retains
per-mapping progress and resource records and withdraws CPU mappings in reverse
order before ABAR. Tests cover authority, generation/geometry,
runtime/root/target and resource substitution, exact installation/
verification/rollback, poison retention after mutation-before-error rollback
uncertainty, exact-generation permanent construction quarantine, cross-runtime
quarantine denial, and PCI location/vendor/device substitution. Canonical AHCI
launch record V2 expands from 384 to 400 bytes and retains that exact PCI
identity beside configuration generation, ABAR geometry, and the device
object. Both concrete owners exact-match the supplied descriptor against the
bound launch before mutation. The mapping-set owner retains the
runtime-bound task identity without borrowing the runtime; a retained poisoned
owner can therefore consume mutable access to that exact runtime and
permanently exclude its blocked construction generation while retaining the
mapping resources. Neither owner can create the existing mapped-task token.
The Linux AHCI suite passes 147 tests and the Linux kernel suite passes 713.
Native-service validation and scheduler activation preparation now reject a
second live runtime domain with the same saved page-table root, and mapping-set
verification inherits that check. Its consuming activation transition
revalidates all five effective leaves and the four memory-resource records
immediately before transactional supervisor/scheduler publication. Failure
retains the unchanged concrete owner for retry or quarantine; success retains
the exact active service/task/root/target and mapping-set owner behind an API
that exposes no inactive mutation or rollback operation. Controlled tests prove
a full supervisor leaves construction pending and a later exact activation
makes only the bound task runnable. That concrete active owner can now consume
the exact-current-task freeze transition while retaining its service identity,
root/target, and all mapping resources; a non-current freeze failure returns the
unchanged active owner, and freezing performs no device, DMA, mapping, or
retirement operation. The one-use controller-manager teardown lease is now
exact-matched to that concrete owner's runtime-bound native task and retained
launch before the freeze; binding or lifecycle failure returns both owners, and
successful freeze does not invoke lease reacquisition. The trusted launcher must still establish
the initial descriptor/device-object correlation; the record binds data and
grants no authority. Full-lifetime PAT3=UC and cacheable-alias proof, active
freeze/quiescence and mapping withdrawal, SMP TLB withdrawal, IOMMU binding,
installed CPL3, KVM/WHP, and physical evidence remain absent.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: YES — canonical AHCI launch record V2
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Retaining task ownership while invoking the
existing exact mapping and rollback lifecycle, including conventional exact
x86-64 task/root/target page-table installation and one-way fail-closed
construction quarantine, bounded duplicate-root rejection, and canonical
binding of already-discovered PCI identity fields is standard resource
composition. See
[the patent review log](../patents/REVIEW_LOG.md).

Native device-service construction now has an explicit scheduler publication
gate **IMPLEMENTED IN SOURCE**. `TaskRuntime` can create a complete but blocked
construction domain; native device preparation rejects an ordinary runnable
target before projecting any capability, and construction-pending domains
cannot migrate. Only an explicit one-use activation clears that state and wakes
the exact generational task. AHCI consumes this mechanism through a typed
mapped-to-active transition, so its task cannot be selected before the bound
launch, attenuated entry capabilities, ABAR, and four CPU mappings all exist.
Tests prove a runnable target is rejected without projection, a mapped target is
absent from runnable load and repeated scheduling, activation raises the load by
exactly one, and only then can the target be selected. The kernel Linux suite
passes all 687 tests, AHCI passes all 135 tests, and Linux plus `MRML_NATIVE`
release builds pass for both kernel and AHCI. This is scheduler/unit and
controlled mapping-backend evidence; no installed task, real page-table switch,
IOMMU, KVM/WHP, or physical AHCI execution was exercised.

Complexity impact: MEDIUM
TCB impact: MEDIUM
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Blocked construction followed by explicit
scheduler activation is conventional task lifecycle synchronization. See
[the patent review log](../patents/REVIEW_LOG.md).

Native device-service IPC entry identities now obey “names identify;
capabilities authorize” **IMPLEMENTED IN SOURCE**. Construction exact-authorizes
and atomically projects a source `SIGNAL|DELEGATE` endpoint into the target as
non-delegable `SIGNAL`; `r13` receives that fresh capability token rather than
an object ID. `r14` receives the exact live generational supervisor `TaskId`
rather than a task-object name. The endpoint object remains validation metadata,
and the syscall decoder can now consume both entry values using their actual
types. Projection failure or later entry failure revokes endpoint, launch-data,
and all six role capabilities together. Tests verify exact endpoint authority,
supervisor identity, fixed register installation, and complete rollback. Kernel
Linux tests remain 687/687 and AHCI remains 135/135; Linux and `MRML_NATIVE`
release builds pass for kernel and AHCI, and the AHCI service-image profile also
passes its `MRML_NATIVE` release build. This is source, unit, and ABI compilation
evidence; installed IPC delivery and supervisor operation remain unverified.

Complexity impact: MEDIUM
TCB impact: MEDIUM
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Projecting an existing endpoint capability and
installing an existing generational task identity are conventional
least-authority IPC plumbing. See [the patent review log](../patents/REVIEW_LOG.md).

Native device-service reply authority now has a controlled `TaskRuntime`
exercise **IMPLEMENTED IN SOURCE**. After construction and activation, the
projected non-delegable endpoint leaf authorizes delivery into the
launch-selected supervisor inbox; the received event retains the exact service
task sender, endpoint sequence, and payload. A substituted endpoint object, a
different `SIGNAL` leaf naming another object, and transitive source-root
revocation all fail before inbox publication. The denied send on the live
endpoint does not consume its sequence. The supervisor `TaskId` remains
authenticated launch-selected routing identity, not authority embedded in the
endpoint; the unsafe userspace adapter must continue taking it only from the
installed entry rather than request bytes. The Linux kernel suite passes all
688 tests, AHCI passes all 135 tests, Linux and `MRML_NATIVE` release builds pass
for kernel and AHCI, and the AHCI service-image profile passes its `MRML_NATIVE`
release build. This is direct runtime API evidence using a locally constructed
endpoint, not scheduled userspace syscall/user-copy, installed supervisor, KVM/
WHP, or physical AHCI evidence.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Exercising existing capability-gated IPC,
inbox delivery, sequencing, and transitive revocation introduces no new
mechanism. See [the patent review log](../patents/REVIEW_LOG.md).

The installed AHCI reply values now cross the canonical buffered-syscall path
in a controlled host test **IMPLEMENTED IN SOURCE**. The target's
`TaskRuntime`-installed `UserContext` is reconstructed through the same
`AhciServiceEntryRegisters` validator used by the service image; its endpoint
and supervisor tokens feed the real `AhciUserspaceSyscalls` operation-4 frame,
the kernel's canonical `SyscallRequest` decoder, a test-only raw-syscall shim
honoring the decoded bounded pointer, and the real `TaskRuntime` inbox. A
different projected role token and a same-task route substitution return the
canonical precommit error; the exact launch values then deliver sequence one
with the harness-selected service task recorded as sender, and source-root
revocation rejects a later reply. The entry validator now requires nonzero
generations for both typed tokens and permits equal numeric bit patterns across
the separate capability and task namespaces instead of misclassifying them as
authority aliasing. AHCI passes all 136 Linux tests and its Linux
and `MRML_NATIVE` release builds; the AHCI service-image profile also passes its
`MRML_NATIVE` release build. The kernel's previously exercised 688-test Linux
suite remains unchanged. This does not execute `INT 0x80`, `UserCallFrame`
privilege validation, active page-table usercopy, kernel current-task selection,
the bootloader handler, an installed supervisor, KVM/WHP, or physical AHCI
hardware.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Composing the existing launch-bound adapter,
canonical syscall decoder, and capability-gated runtime delivery in a controlled
test introduces no new mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

The AHCI reply binding now preserves its two namespaces as types
**IMPLEMENTED IN SOURCE**. Raw entry registers are shape-checked once, then
retained as `Capability` and `TaskId`. In production code, the validated entry
alone can produce an opaque `AhciReplyBinding`; `AhciUserspaceSyscalls` accepts
that binding and emits raw tokens only at the operation-4 frame boundary, so
safe callers cannot substitute even another value from the correct namespace.
The kernel now publicly reconstructs `TaskId` from a wire token with an explicit
non-authorizing contract: the name proves neither liveness nor control, and all
runtime operations still exact-match the generation and any separately required
capability. A focused scheduler test proves a guessed generation cannot control
the live slot. The Linux kernel suite passes all 689 tests and AHCI passes all
136 tests; Linux and `MRML_NATIVE` release builds pass for both, and the AHCI
service-image profile passes its `MRML_NATIVE` release build. This is typed API,
unit, and compilation evidence, not live trap, installed supervisor, hosted VMM,
or physical AHCI evidence.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Preserving existing endpoint and task token
namespaces in Rust types, carrying their validated provenance in an opaque
binding, and documenting non-authorizing identity reconstruction are
conventional type-safety hardening. See
[the patent review log](../patents/REVIEW_LOG.md).

Freeze-first AHCI stop handling is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`begin_active_ahci_service_exit` consumes the non-copy active-service owner only
with a one-shot teardown lease bound to the exact native task, including its
opaque runtime identity, and exact launch. Those bindings are checked before
the supervisor freezes the current task. An operation number, status value,
service ID, or lease identity accessor grants no teardown authority; binding or
lifecycle denial returns the active owner and untouched lease without invoking
reacquisition.

Only after the exact task is frozen may the consuming lease transfer the sole
register, active-port, command-memory, and data-buffer teardown owners.
Reacquisition failure returns the same lease and frozen lifecycle for retry.
Mapping, port, or data-region substitution after acquisition creates one typed
quarantine retaining the frozen task, acquired backend, and mapping owners, so
substituted state cannot become quiescence authority. Successful quiescence
stops or fails closed outstanding work, sanitizes data, withdraws DMA, and
destroys every borrowed register, command-memory, and data-buffer view while
the frozen address space and mappings remain live. Only then may retirement and
CPU/ABAR mapping withdrawal proceed; successor dispatch remains withheld
through exact cleanup.

The same freeze-first transfer now consumes the concrete kernel mapping-set
owner without reconstructing or copying a generic mapping owner. The retained
inactive page-table hierarchy, ABAR leaf, four CPU/DMA leaves, and their memory
resource records remain one typed owner while the lease is retried, every
returned mapping/port/data identity is independently exact-matched, the device
is stopped, data is sanitized, DMA is withdrawn, and all borrowed views are
destroyed. Retryable acquisition, sanitization, and DMA failures keep that
exact frozen root; substitution produces a quarantine which also retains it.
After successful quiescence, the exact supervisor freeze and concrete root now
advance together into retirement. The retained backend removes all four
CPU/DMA leaves in reverse order and then the ABAR, with backend success carrying
the required translation-withdrawal contract; failure retains the retirement
and incomplete concrete owner. Success keeps the empty page-table/resource
owner paired with the retirement while successor dispatch remains withheld.
Exact supervisor cleanup now erases the retired address space while that empty
concrete owner remains live, releases its page-table and memory-resource borrows
only after the same cleanup ticket succeeds, and then permits the retained
termination owner to dispatch the already selected successor. Cleanup denial
retains the entire empty root/retirement pair for exact retry.

The focused Linux AHCI suite passes all 147 tests. Coverage includes equal task
tokens from different runtimes, pre-freeze current-task and supervisor denial
without reacquisition, retry after lease-reacquisition failure, substituted
state quarantine, concrete-root retention across acquisition and sanitization
retry, exact concrete retirement and five-leaf withdrawal, frozen mutation
denial, quiescence retry, exact address-space cleanup, concrete-owner release,
and delayed successor dispatch. This is typed API, controlled backend, and
unit-test evidence only. The repository has no installed controller-manager
minting or trap routing, and no installed
CPL3/`INT 0x80`, active page-table/TLB or IOMMU invalidation, KVM/WHP, or
physical AHCI execution was exercised.

The canonical decoded operation-3 `SyscallRequest::Exit` now admits one typed
AHCI exit-request token and routes it into the concrete freeze-first handoff.
Any other decoded request is returned unchanged before lease access, freezing,
MMIO, DMA, or mapping mutation. The token is descriptive only: it cannot name
or obtain a service, and the non-copy active owner plus exact one-shot manager
lease remain mandatory authority inputs. This connects the shared syscall
decoder to the manager API in source, but installed manager minting and trap
dispatch remain unimplemented.

The installed AHCI service entry now consumes its complete dispatcher state
into a non-copy stop owner at the first fail-closed dispatch result. It erases
the separate launch, request, capability-token, and transfer buffers, then
consumes the stop owner before the non-returning operation-3 syscall. That
transition destroys the service-side register, active-port, command-memory,
data-buffer, and authorizer views without MMIO, unmapping, DMA revocation, task
mutation, or assignment release. Only an authority-free device/disposition
receipt remains across the syscall, so the frozen manager no longer
reconstructs mutable Rust views while the service image retains competing
borrows. The focused test covers the active-owner release path, and the
`ahci_service_entry` `MRML_NATIVE` release build proves the installed receiver
uses the transition. This is source, unit-test, and build evidence only; it does
not provide manager storage, installed trap routing, or hardware execution.

Patent review: **NOT_TRIGGERED**. Consuming local borrowed views before a
non-returning exit and retaining only an authority-free receipt is conventional
ownership cleanup. It adds no controller command, DMA behavior, parser format,
or authority model. See [the patent review log](../patents/REVIEW_LOG.md).

The kernel-side controller-manager handoff now has a bounded one-service slot
that is installed before dispatch with the concrete active mapping-set owner
and the exact one-use teardown lease. Installation rejects a colliding runtime
identity or substituted launch while returning both owners unchanged. A decoded
exit consumes no user pointer, name, or token as authority: it can only consume
the pair already held by the manager slot. Empty-slot requests fail closed, and
binding or lifecycle failure restores the same pair for exact retry; successful
freeze leaves the slot empty and transfers both owners into the existing frozen
handoff. This closes the typed manager-storage gap in source, but installed
manager minting and the trap dispatcher remain unfinished.

The slot now also accepts the canonical decoded syscall request at a dedicated
trap-boundary adapter. Non-exit requests and exits from any task other than the
slot's exact opaque runtime-bound task are returned unchanged for ordinary
dispatch without consuming the slot. Absence of a current task fails closed;
only the exact current AHCI task reaches freeze-first routing. Controlled tests
cover non-exit pass-through, no-current-task denial, a different task's ordinary
exit, retained ownership after each denial, exact-task freeze, and empty-slot
replay denial. The bootloader's installed dispatcher is not yet connected to
this adapter, so this remains source-tested integration API evidence rather
than installed trap execution.

The controller-manager lease now has a concrete non-copy implementation which
stores the opaque runtime-bound native task and exact bound launch separately
from a consuming platform reacquisition backend. Its only constructor is an
unsafe manager minting boundary; the backend contract forbids live service-view
aliases, hardware or mapping effects on drop, and partial mutation on failure.
Successful acquisition consumes the lease exactly once. Failure reconstructs
the same lease from the unchanged returned backend, preserving exact retry and
preventing backend state from substituting the task or launch seen by the
freeze layer. The kernel mapping lifecycle test now exercises binding denial,
freeze retry, backend acquisition retry, and successful quiescence through this
concrete lease. A physical-platform backend and installed manager instance are
still unimplemented, so this is not physical AHCI or installed dispatcher
evidence.

Manager reacquisition no longer depends on userspace-installed capability
tokens. The exact bound launch can now derive the same four CPU-mapping
requests, reconstruct bounded command/data views after freeze, and reconstruct
the stable idle active-port owner from the launch-bound ABAR. A public teardown
owner constructor accepts only that bound launch plus the reconstructed linear
port and views, and rejects any port-layout substitution. The installed-service
path delegates to the same internal mapping-view constructor, so its existing
geometry, overlap, length, and adapter tests cover the shared unsafe boundary.
These are prerequisites for an active-root platform backend; they do not by
themselves verify that the current CR3 leaves match the bound physical ranges.

Frozen manager reacquisition now revalidates the retained ABAR leaf, all four
CPU/DMA leaves, and their memory-resource records immediately before consuming
the manager lease. Verification failure never calls the platform backend and
returns the exact frozen mapping owner and lease for retry. The controlled Linux
test injects a page-table read failure after freeze, observes zero backend
acquisition calls, restores observation, and completes the existing retry path.
This is retained-model source and unit-test evidence only: it does not verify a
hardware current CR3, SMP TLB invalidation, IOMMU state, an installed trap, or
physical AHCI execution.

The x86 kernel now supplies a read-only exact-active-mapping verifier which
checks the selected CR3 root plus every effective 4 KiB leaf's physical frame,
user/write/execute permissions, and device-PAT selector. The AHCI adapter
composes that mechanism over the launch-bound ABAR and all four CPU/DMA ranges,
and provides an unsafe current-CR3 entry which requires interrupts and
concurrent hierarchy mutation to remain excluded. Kernel simulation tests
exact-match two-page device mappings and reject root, physical-frame, and cache
selector substitution. The wrapper is now available to the controller-manager
reacquisition backend; installed manager minting and the trap connection remain
incomplete. These Linux unit tests do not execute CR3 access or prove
PAT contents, TLB state, IOMMU state, physical AHCI, or SMP exclusion.

A concrete x86 controller-manager reacquisition backend now performs that
current-root check before creating any raw view, then reconstructs the bounded
volatile ABAR accessor, coherent command/data mapping views, stable idle active
port, and one typed teardown owner. Mapping-verifier, view-construction,
register-window, port-observation, and final-assembly failures publish no
teardown owner; the verifier and monotonic-delay mechanisms are returned for
exact retry, while temporary derived views are destroyed without hardware or
mapping effects. The final assembler also returns every linear input on layout
mismatch instead of discarding them. The controlled lifecycle test injects
active-root rejection and proves the verifier call and exact delay-owner
retention before any raw view is formed. Success remains source-composed rather
than installed: no booted controller-manager instance or trap path uses this
backend yet, and Linux tests do not exercise CR3, MMIO, DMA, IOMMU, PAT, or
hardware.

The x86 manager minting API now derives the opaque native-task identity and
bound launch exclusively from the non-copy active mapping owner, creates the
concrete backend and one-use lease, and installs that exact pair into the
bounded exit slot in one unsafe transition. It accepts no caller-supplied task,
launch, service name, or object identifier. An unrouted slot can now be consumed
to recover both owners exactly, so cancelled startup does not rely on Drop or
lose mapping authority. The controlled lifecycle test installs the concrete
generic backend, checks the exact task binding, recovers the active owner,
lease, verifier, and delay unchanged, and then continues the existing full
teardown model. This is source/unit evidence, not installed trap execution.

Activation and manager installation now have one consuming x86 API boundary.
It revalidates and publishes the exact mapped service, then installs the active
mapping owner and derived one-use teardown lease before returning to a
dispatcher. The unsafe caller must exclude interrupts and scheduling across
that synchronous transition. Activation denial returns the complete
preactivation owner, mapping hierarchy, verifier, and delay unchanged; success
returns only the occupied manager slot rather than an unretained runnable AHCI
owner. The controlled test exercises both denial/retry and success. Bootloader
launch construction, static manager retention, and installed trap execution
remain incomplete, so this is source and Linux unit-test evidence only.

The manager slot can now be allocated empty before PCI discovery and populated
later through a consuming transition. Population rejects replacement before
examining incoming identity and returns the incoming active owner and lease
unchanged on either occupancy or binding denial. The x86 activation boundary
can populate this preallocated storage directly, so success exposes no loose
active owner and the same slot remains available after a consumed exit for an
explicit future restart. The controlled lifecycle test proves empty routing
fails closed, activation populates the fixed slot, and cancellation recovers
the exact retained owners. No bootloader static or booted trap route uses this
storage yet.

The trap boundary now has a persistent manager state above that slot. A valid
exact-task operation-3 frame atomically moves the active slot owners into a
manager-retained frozen owner and returns only a descriptive task/service
receipt. Malformed frames leave the active state unchanged. Once frozen, replay
and attempted replacement fail closed while the same task, service, mapping
root, and teardown lease remain retained. The frozen owner and the now-empty
slot can only be transferred together to the next controller teardown stage.
The controlled lifecycle test covers malformed-frame denial, exact routing,
receipt identity, pending-state replay denial, and retained-owner transfer.
This does not yet retain reacquisition/quiescence retries or connect the booted
dispatcher, so installed trap execution remains incomplete.

The next manager state now retains every mapping-verification and platform
reacquisition outcome. Verification denial and backend acquisition denial put
the exact frozen owner and one-use lease back into retry state; success stores
the acquired register, command-memory, data-buffer, mapping-root, and frozen
task owners internally and returns only a descriptive receipt. Identity
substitution stores the complete quarantine and its exact diagnostic. Repeated
acquisition after success or quarantine is rejected without owner movement.
The controlled lifecycle test injects verification and backend failures,
observes retained retry state and exact call counts, then advances once into
the retained reacquired state and rejects replay. Quiescence and later teardown
states are not yet retained by this manager, and no booted dispatcher was run.

Manager ownership now continues through device quiescence. The first attempt
consumes the retained reacquired owner internally; engine-stop, cleanup,
sanitization, and DMA-withdrawal failures are stored with every frozen task,
mapping, device, DMA, register, command-memory, and data-buffer owner. Retry
operates directly on that retained state. Success destroys the borrowed device
views, stores only the quiesced frozen mapping/task owner, and returns a
descriptive receipt. Repeated quiescence after success and attempts from a
quarantined or unacquired state fail closed. The controlled test injects a
sanitization failure, observes no DMA removal, retries to one exact removal,
checks task/service/root receipt identity, and rejects replay. Retirement and
mapping withdrawal are still transferred to the existing typed path rather
than retained by this manager; no booted dispatcher or hardware ran.

Supervisor retirement is now retained by the same manager. It consumes only
the internally held quiesced owner. A wrong-supervisor or lifecycle denial
reconstructs that exact quiesced owner for retry; success stores the retirement
token together with the concrete mapping/resource root and returns only a
task/service/root receipt. Repeated retirement after success is rejected. The
controlled lifecycle test first presents an empty supervisor, verifies denial
and retained quiesced state, then retries against the exact supervisor and
continues the existing mapping-withdrawal path. Mapping removal, address-space
cleanup, and successor dispatch are not yet manager-retained, and this remains
Linux unit-test rather than installed or hardware evidence.

Reverse-order mapping withdrawal is now manager-owned. It consumes only the
retained retired owner, keeps the supervisor retirement token paired with the
concrete hierarchy throughout four CPU/DMA leaf removals and final ABAR
removal, and stores the empty root on success. Any removal error reconstructs
the exact incomplete retired owner and preserves its diagnostic; success
returns only a task/service/root receipt and rejects replay. The controlled
lifecycle test advances through this manager transition, verifies the empty
mapping owner and continued cleanup withholding, then transfers the paired
state to the existing cleanup path. Failure-owner behavior remains covered by
the underlying mapping-set rollback tests; installed SMP invalidation, IOMMU,
booted dispatch, and hardware were not exercised.

Address-space cleanup is now manager-owned. It consumes only the retained empty
root/retirement pair, calls the exact supervisor cleanup gate, and releases the
concrete page-table and memory-resource owner only after the eraser succeeds.
Wrong-supervisor or eraser failure restores the complete removed-mappings owner
for retry and returns the diagnostic separately. Success retains the final
retirement/launch dispatch owner, returns only the service receipt, and rejects
cleanup replay. The controlled lifecycle test denies cleanup through an empty
supervisor without invoking the eraser, retries through the exact supervisor,
checks resource-ledger release, and transfers the retained final owner to the
existing delayed-dispatch path. Dispatch itself is the remaining manager-state
transition; no installed trap, SMP hardware, IOMMU, or physical AHCI ran.

Delayed successor dispatch is now manager-owned. It consumes only the retained
cleanup-complete owner through the exact task runtime. Runtime denial restores
that complete owner for retry; success retains the opaque issued dispatch and
returns only the service and selected next-task description, while replay is
rejected. The controlled lifecycle test denies dispatch through a different
runtime, retries through the exact runtime, and observes the source task as the
selected successor. This completes source-level manager retention across the
operation-3 lifecycle. Bootloader static retention and installed trap routing
remain incomplete, and no hardware execution was exercised.

The teardown manager is now preallocatable before discovery and retains one
unchanged Rust type across activation, operation-3 frame routing, every retry,
cleanup, and delayed dispatch. Its embedded activation slot is borrowable only
before any teardown state exists. A successful exact-task frame route stores
the frozen owner directly in that same manager; once teardown starts, attempts
to reacquire the activation slot or route another exit fail closed. The
controlled lifecycle test activates through the preallocated manager, rejects
a hostile frame without owner movement, routes the exact frame, completes the
full teardown, and confirms that even final dispatch does not reopen activation
storage. This removes the type transition that prevented static controller-
manager retention. No installed trap or hardware execution was exercised.

Patent review: **NOT_TRIGGERED**. Retaining existing active and teardown owners
inside one preallocated bounded state value is conventional fail-closed state-
machine composition. It adds no parser, controller command, DMA behavior,
persistent storage, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

The bootloader now has a dedicated UEFI feature profile that instantiates the
exact bounded AHCI manager in static kernel storage. Its operation-3 handler
gives the manager first refusal only when that storage is active and names the
runtime's exact current task; every unrelated service exit continues through
the existing generic supervisor path. A successful route retains the frozen
owner in the static manager and stops at a probe fail-stop rather than skipping
device quiescence or cleanup. The AHCI library and its versioned block-provider
interface declare UEFI as a compile target so this static boot dependency is
checked by the normal build graph. The `ahci_service_manager_probe` UEFI release
build passes. Boot launch code does not yet construct and populate the active
mapping owner, so the route is source- and compile-verified but was not reached
in a booted guest; post-freeze device, DMA, mapping, cleanup, and dispatch
execution also remain uninstalled.

Patent review: **NOT_TRIGGERED**. Statically retaining the existing bounded
manager and selecting it by its retained exact task before the existing generic
exit path is conventional fail-closed dispatch composition. It adds no parser,
controller command, DMA behavior, persistent storage format, or authority
model. See [the patent review log](../patents/REVIEW_LOG.md).

AHCI discovery now has a bounded, authority-free BAR5 size-probe observation
decoder. It accepts only the original BAR value, the all-ones probe mask, and a
re-read restored value; exact restoration, conventional non-prefetchable 32-bit
memory encoding, a contiguous power-of-two mask, the minimum AHCI register
extent, a nonzero base, and base/extent alignment must all hold before an exact
byte length is published. The focused tests reject restoration drift,
noncontiguous masks, undersized extents, misalignment, I/O BARs, 64-bit BARs,
prefetchable BARs, and a missing base. This supplies the arithmetic/verification
boundary needed by a future exclusive native PCI enumerator, but performs no
configuration-space writes and grants no assignment, mapping, MMIO, DMA, or
launch authority. No PCI device or physical AHCI hardware was exercised.

Patent review: **NOT_TRIGGERED**. Decoding the conventional PCI BAR sizing mask
and requiring exact restoration before publishing geometry is standard bounded
validation. It adds no controller command, DMA behavior, persistent format, or
authority model. See [the patent review log](../patents/REVIEW_LOG.md).

BAR5 sizing now has a linear exclusive-function transaction owner. Unsafe
admission requires a quiescent, exclusively assigned exact PCI function and an
exact-width backend; a read-only snapshot with already-asserted size is
rejected. The transaction first re-reads BAR5 for drift, disables memory-space
and bus-master decode, verifies the disabled command, performs the all-ones
probe, restores BAR5 and command, and re-reads both before invoking the bounded
geometry decoder. Success retains the exclusive backend beside the descriptor.
A geometry or other clean failure returns a retry owner only after exact
restoration; write uncertainty, restoration error, or restoration drift seals
the owner in a non-retryable failure. Controlled tests cover exact success,
restored malformed-mask retry, and restoration-drift quarantine. This is typed
API and Linux unit-test evidence using a deterministic backend; no native PCI
configuration adapter, boot-time assignment, guest execution, or physical AHCI
hardware was exercised.

Patent review: **NOT_TRIGGERED**. The conventional PCI BAR-sizing sequence,
decode-disable discipline, exact restoration checks, and linear failure
retention are standard fail-closed lifecycle composition. This adds no AHCI
controller command, DMA behavior, persistent format, or new authority model.
See [the patent review log](../patents/REVIEW_LOG.md).

The exclusive BAR transaction now has a native x86 PCI configuration
mechanism-one backend. Its unsafe constructor accepts only segment zero and
requires the caller to retain the exact quiescent function, disable local
interrupts, and exclude every other CPU from `0xCF8/0xCFC` access. The backend
retains one requester identity, rejects any substituted bus/device/function
before I/O, and exposes only exact 16-bit command-register and 32-bit BAR5
accesses; it is not a general ambient PCI interface. Host tests verify selector
encoding and segment/function denial without executing port instructions. The
154-test Linux AHCI suite passes, as do the AHCI native release build and the
AHCI-manager UEFI bootloader release build. This proves source composition and
cross-target compilation only: no port I/O, booted guest, PCI function,
interrupt/SMP exclusion, or physical AHCI hardware was exercised.

Patent review: **NOT_TRIGGERED**. Conventional PCI mechanism-one selector and
exact-width port access, narrowed to an existing linear BAR-sizing owner, is
standard platform plumbing. It adds no AHCI command, DMA behavior, persistent
format, or new authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

The same retained native backend now performs the read-only identity phase
before BAR sizing. It reads vendor/device, class/subclass/programming interface,
header type, and BAR5 only for its exact requester, decodes those fixed-width
registers into an authority-free snapshot with no asserted extent, and consumes
itself directly into the exclusive sizing owner. Invalid generation, absent or
non-AHCI identity, unsupported header/BAR encoding, or caller-substituted
pre-sized geometry returns the native backend in a typed admission failure;
snapshot bytes never substitute for the retained exclusive owner. A host test
checks exact register-field decoding without port I/O, and all 155 Linux AHCI
tests pass. Native and UEFI compilation are the only platform evidence: no
configuration port, guest, or physical device was exercised.

Patent review: **NOT_TRIGGERED**. Fixed-width decoding of conventional PCI type-
zero identity registers and directly retaining the existing exclusive backend
through admission is standard enumeration plumbing. It adds no AHCI command,
DMA behavior, persistent format, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Retaining the existing exact-runtime dispatch
success and error owners in a bounded manager state is conventional fail-closed
lifecycle composition. It adds no parser, controller command, DMA behavior,
persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Retaining existing cleanup success/error
owners until exact erasure and supervisor acceptance is conventional
fail-closed lifecycle composition. It adds no parser, controller command, DMA
behavior, persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Retaining the existing reverse-order mapping
withdrawal success/error owners with their supervisor token is conventional
fail-closed lifecycle composition. It adds no parser, controller command, DMA
algorithm, persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Retaining existing supervisor-retirement
success and retry owners inside the bounded manager state is conventional
fail-closed lifecycle composition. It adds no parser, controller command, DMA
behavior, persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Retaining existing device-quiescence retry and
success owners inside the bounded manager state is conventional fail-closed
lifecycle composition. It adds no parser, controller command, DMA algorithm,
persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Retaining existing success, retry, and
quarantine owners in a bounded state machine is conventional fail-closed
lifecycle handling. It adds no parser, controller command, DMA behavior,
persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Moving existing linear owners between bounded
active and frozen manager states and returning a non-authorizing receipt is
conventional lifecycle state management. It adds no parser, controller command,
DMA behavior, persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Preallocating an empty optional owner slot and
rejecting replacement before consuming linear inputs is conventional bounded
state management. It adds no parser, controller command, DMA behavior,
persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Synchronously composing existing activation
and manager-slot installation while returning all linear owners on failure is
conventional lifecycle wiring. It adds no parser, controller command, DMA
behavior, persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Deriving identity from an existing linear
owner and atomically composing existing backend, lease, and bounded-slot types
is conventional ownership wiring. It adds no parser, controller command, DMA
behavior, persistent state, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Sequentially composing existing exact mapping
verification and typed teardown-view constructors, with linear owner return on
failure, is conventional lifecycle integration. It adds no controller command,
DMA behavior, parser format, or authority model. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Exact comparison of existing page-table leaf
attributes against an already authorized mapping is conventional validation.
It adds no controller command, DMA behavior, parser format, or authority model.
See [the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Repeating exact validation of existing mapping
descriptors before reconstructing unsafe bounded views is conventional
fail-closed lifecycle validation. It adds no controller command, DMA behavior,
parser format, or authority mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Reusing an already authenticated launch to
derive the same bounded mapping descriptors and assembling existing typed
owners is conventional lifecycle refactoring. It adds no controller command,
DMA behavior, parser format, or authority mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Separating immutable identity binding from a
consuming platform backend and reconstructing an unchanged linear lease after
failure are conventional ownership patterns; no parser, controller command,
DMA, mapping, or authority mechanism is added. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Exact-current-task classification over an
existing decoded enum and retained linear owner is conventional dispatcher
composition and adds no parser, device, DMA, or authority mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. A fixed-capacity option slot that retains and
atomically consumes existing linear Rust owners is conventional lifecycle
composition and adds no parser, device, DMA, or authority mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Linear ownership retention and destructor
suppression across an existing non-returning stop syscall are conventional
lifecycle mechanisms and add no parser, device, DMA, or authority mechanism.
See [the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Admitting an existing decoded enum variant
into a non-authorizing typed routing token is conventional fail-closed API
composition and adds no parser, device, DMA, or authority mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Binding an existing manager owner to the
existing supervisor/runtime freeze and typed AHCI teardown, retrying failed
owner transfer, quarantining substitution, and destroying borrowed views before
existing retirement and mapping withdrawal are conventional fail-closed
lifecycle composition. This adds no AHCI command, DMA, interrupt, parser,
authority-model, or hardware-execution mechanism; the existing triggered review
for actual native AHCI controller/DMA behavior is unchanged. See
[the patent review log](../patents/REVIEW_LOG.md).

Mapped AHCI activation through delayed dispatch now forms one consuming
supervisor/runtime-bound lifecycle **IMPLEMENTED IN SOURCE**. Activation derives
the lifecycle object from the non-copy mapped launch owner, validates the exact
runtime and native task, publishes `Running`, and only then wakes the constructed
task. Equal `TaskId` tokens from distinct runtimes remain separate bindings;
ordinary registration cannot publish a construction-pending task.

Retirement freezes the exact current task before AHCI quiescence, leaving no
current or selected successor while retaining the complete task domain. Runtime
mutation fails closed until the retained owner either advances or remains
fail-stopped. The AHCI path then stops the engine, completes or fails closed
outstanding work, sanitizes the data buffer, and withdraws DMA. Only the exact
supervisor/runtime/native-task binding can retire the freeze to `Exited`.
Successor dispatch remains withheld while non-copy CPU and ABAR mapping owners
are removed and exact supervisor cleanup erases the retired address space.
Device, mapping, and erasure backend success is covered by explicit unsafe
truthfulness contracts. Constructed services reject generic exit, cleanup, and
restart, and the delayed termination cannot be consumed by another runtime.

The Linux kernel suite passes all 705 tests, AHCI passes all 137 tests, and the
configuration service passes all 55 tests. Linux and `MRML_NATIVE` release
builds pass for the kernel and AHCI library; the AHCI service-image profile
passes its `MRML_NATIVE` release build, and the bootloader passes its UEFI
release build. Focused tests cover quiescence and mapping retry, frozen mutation
denial, mismatched binding/native tasks, equal task-token and supervisor-ticket
collisions, generic restart denial, and cross-runtime dispatch with owner
recovery. This is supervisor/scheduler unit, controlled backend, and compile
evidence only; it does not prove installed CPL3 entry or `INT 0x80`, active
page-table switching, TLB or IOMMU invalidation, KVM/WHP execution, or physical
AHCI behavior.

Complexity impact: MEDIUM
TCB impact: MEDIUM
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: PARTIAL
Existing-object reuse: HIGH

Patent review: **NOT_TRIGGERED**. Composing existing task freeze, device
quiescence, supervisor retirement, mapping withdrawal, cleanup, and delayed
dispatch through linear typed owners is conventional fail-closed lifecycle
synchronization. See [the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. This increment only maps existing bounded
service operations to the existing kernel syscall ABI; it introduces no new
storage, AHCI, scheduling, or device mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Binding cleanup eligibility to the already
validated capability envelope is conventional fail-closed resource handling.
See [the patent review log](../patents/REVIEW_LOG.md).

The command-memory gate is now **PARTIALLY IMPLEMENTED IN SOURCE**. The driver
checks every word in the exact command-list, received-FIS, and per-slot command-
table extents is zero before writing anything. It then gives every advertised
header its exact distinct 64-bit table base and read-verifies all values. A
dirty/unreadable preflight returns the untouched programmed owner; uncertainty
after a write quarantines the layout. Storage passes 169 tests on Windows and
Arch Linux. No PRDT,
data buffer, command issue, engine start, interrupt, ATA/ATAPI, NCQ, IOMMU
hardware, OVMF, or physical device was exercised.

The port-engine activation gate is now **PARTIALLY IMPLEMENTED IN SOURCE**.
Only the initialized command-memory typestate may enter it. The transition
exact-matches controller generations, requires an idle task file and no active
or issued command, keeps interrupts disabled, enables FIS receive before command
processing, and read-verifies each write. Failure before mutation returns the
owner; later uncertainty quarantines the layout. Storage passes 172 tests on
Windows and Arch Linux. No command is built or issued, and no PRDT, data transfer, interrupt,
engine stop/removal, ATA/ATAPI, NCQ, IOMMU hardware, OVMF, or physical device was
exercised.

The inverse engine-stop lifecycle is **PARTIALLY IMPLEMENTED IN SOURCE**. It
clears command processing before FIS receive and bounds both hardware-quiescence
waits to 1024 reads. Exact read-back is required, and all uncertainty retains a
quarantined DMA layout. Storage passes 174 tests on Windows and Arch Linux. Register-base clearing,
DMA sanitization/reclamation, command issue, and data transfer remain unimplemented.

The stopped-port reclamation gate is now **PARTIALLY IMPLEMENTED IN SOURCE**.
It exact-matches generations and quiescence, clears and verifies all DMA base
registers, then zeroes and verifies exactly the retained command-list,
received-FIS, and command-table extents. Only complete success recreates the
installed owner accepted by exact backend revocation; every failure quarantines
the layout. Storage passes 177 tests on Windows and Arch Linux. No command, transfer, interrupt,
IOMMU hardware, OVMF, or physical device was exercised.

The following DMA-memory ownership boundary is **PARTIALLY IMPLEMENTED IN
SOURCE**. One safe transaction binds a quiescent discovered SATA port and exact
controller generations to explicit controller `CONTROL` plus separate
`PIN | MAP | READ | WRITE` capabilities for command-list, received-FIS, and
command-table memory objects. It derives the table extent from the validated
controller slot count and rejects zero generations, wrong objects, missing
rights, malformed size/alignment, wrapping ranges, physical overlap, memory-
object aliasing, or backend refusal before publishing a layout. The backend
must atomically pin, verify zeroed state, and install exactly the complete
layout, leaving no device mapping on failure. The installed layout is retained
by a non-copyable owner. Exact teardown consumes it only after the backend
confirms removal and all required device/IOMMU invalidation; uncertainty returns
the same owner for retry, while completed removal cannot be replayed. Storage
passes 163 tests on Windows and Arch Linux. No port register is written and no
IOMMU, engine, interrupt, ATA/ATAPI, NCQ, block-I/O, OVMF, or physical evidence
is claimed.

The configuration service now **PARTIALLY IMPLEMENTS** an atomic
correlate/register/reacquire operation for this route. It admits the descriptor
only through the typed verifier, creates the existing principal-bound read-only
session, validates block zero and the selected root, and returns the installed
owner. Route mismatch leaves no registration or session and causes no block I/O;
later validation failure revokes the session and removes the new device before
return. Configuration passes 50 tests on Windows and Arch Linux; WHP/KVM
regression runners pass 11/12 without native SATA evidence. Real driver
discovery and installed-kernel consumption remain **PLANNED**.

Configuration now **PARTIALLY IMPLEMENTS** decoded-handoff-only recovery for
the pair. A recovery-only canonical encoder retains the adjacent identity and
typed route without unrelated service/SMP payloads. The consumer extracts both
from one validated `BootHandoff`; missing identity or route fails before
registration, session issuance, or block I/O, and detached replacement boot data
is not accepted. Kernel passes 563 tests and configuration 51 tests on Windows
and Arch Linux. Native descriptor discovery and installed Total consumption
remain **PLANNED**.

The recovered-system Total boundary now **PARTIALLY IMPLEMENTS** consumption of
that installed owner. Before release construction it rechecks the selection's
stable platform identity, controller/media generations, geometry, volume, and
root against the decoded handoff; a UEFI source also requires the adjacent SATA
route. Missing or substituted state cannot run the release builder. Successful
admission retains the exact live selection beside the sole release-derived
Total table through final proof. Configuration passes 51 tests on Windows and
Arch Linux; WHP/KVM 11/12 remain regression rather than native-storage evidence.

The `mrml` frontend may expose structured `disk`, `filesystem`, `optical`, and
`media` operations. The PowerShell-inspired shell projects the same backend as
typed `Get-*`, `Test-*`, `Initialize-*`, `New-*`, `Format-*`, `Write-*`, and
`Mount-*` operations; it never scrapes CLI text. GUI `Disks & Media`, installer,
recovery, accessibility, automation, and AI consume the same capability-scoped
objects, progress, diagnostics, and redaction.

The NVMe provider is **PARTIALLY IMPLEMENTED** at its first authority-free
discovery gate. It validates the PCI-SIG mass-storage/NVM/NVMe class tuple,
type-zero function identity, nonzero configuration generation, and a bounded,
aligned, non-prefetchable 64-bit controller BAR from an immutable platform-
enumerator snapshot. A separately authorized exact controller capability now
prepares a generation-bound, supervisor-only read/write NX mapping through a
backend that may reject without publication; missing, excess, stale, or
substituted authority and invalid ranges fail before the backend. A bounded
controller gate validates `CAP`/`VS`, checked queue, page, doorbell-stride, and
timeout limits, requires the NVM command set, clears `CC.EN`, and waits for
`CSTS.RDY` to clear with a fixed-delay bounded poll. Fatal state, timeout, and
register uncertainty publish no snapshot. The initial admin-queue ownership gate
then requires exact controller-control and separate pin/map/read/write memory
capabilities, a supported 4 KiB controller page, at least two queue entries, two
distinct aligned zero-verified pages, and one nonzero DMA generation. Installation
is atomic; revocation retains exclusive ownership until device and IOMMU removal
is confirmed. The queue-programming gate consumes that exclusive owner only
while `CC.EN` and `CSTS.RDY` are clear, writes and verifies bounded `AQA`, `ASQ`,
and `ACQ`, enables the baseline 64-byte submission/16-byte completion entry
sizes, and publishes active queues only after bounded ready polling. Any write,
readback, fatal-state, or timeout uncertainty quarantines the DMA layout. The
first admin-command path admits only Identify Controller: it exact-authorizes a
distinct zeroed 4 KiB DMA result page, writes and verifies all 16 command
dwords before the submission doorbell, bounds phase-tagged completion polling,
validates command ID, queue ID/head and status, and acknowledges the completion
head. Pre-mutation failures return the active queue owner; uncertainty after
mutation quarantines it; an explicit controller error advances and returns the
reusable queue with decoded status. Hostile Identify Controller data is now
parsed into fixed-capacity printable serial/model/firmware labels, exact
controller generations, bounded namespace count, checked/capped maximum
transfer size, and optional-command/cache feature facts. Labels and feature
bits remain non-authorizing data. Native PCI enumeration, concrete MMIO
installation, DMA/IOMMU revocation, interrupts, reset, service IPC,
runtime provider publication, and physical-device evidence remain
**PLANNED**. The same semantic command engine now admits one nonzero Identify
Namespace request without exposing raw admin authority. Its hostile result is
generation-bound to the controller identity and validates namespace ID/count,
size/capacity/utilization ordering, at most 16 baseline LBA formats, active
format, absence of unsupported metadata, 512-byte through 64-KiB logical blocks,
checked total size, transfer-block bounds, GUID/EUI labels, and thin-provisioning
facts before producing a non-authorizing namespace identity. The shared bounded
admin executor now also negotiates one through 64 I/O submission/completion
queues with the standard Number of Queues feature, exact controller-control
authority, verified command publication, and hostile result bounds; it rejects
zero, excess requests, excess grants, and authority substitution without
inventing queue availability. One negotiated queue-pair DMA gate now retains
the live admin queue owner while exact controller-control and separate
pin/map/read/write capabilities authorize two distinct zero-verified 4 KiB
pages. Queue ID must be nonzero and within both grants, depth is bounded to two
through 64 entries, admin/I/O regions may not overlap, and backend rejection
returns the complete grant for retry. Queue creation now consumes that owner,
creates and verifies the completion queue before its associated submission
queue, and publishes active cursors only after both commands complete. A
rejected completion queue removes the DMA layout; a rejected submission queue
first deletes the already-created completion queue and then removes DMA. Any
uncertain command, cleanup, or device/IOMMU removal quarantines both admin and
I/O layouts. Capability-bound PRP preparation now covers the block interface's
complete 512-byte through 1 MiB range: each data mapping is page-rounded and
exactly authorized for device-read versus device-write direction, device-write
buffers are zero-verified, one/two-page requests use direct PRPs, and larger
requests build and verify at most 255 entries in a distinct zeroed 4 KiB list.
Missing/excess lists, overlaps, stale or excessive rights, and malformed extents
fail before mutation; partial list mutation quarantines the request. The active
I/O queue now accepts only generation-bound namespace read, write, and flush
requests through exact namespace capabilities. Read/write ranges and transfer
geometry are checked against the parsed namespace identity and the 1 MiB
interface bound; PRPs must match the device transfer direction and may not
overlap queue memory. The provider writes and verifies every command dword,
rings queue-specific submission/completion doorbells, validates phase, command
ID, queue ID/head, and advances bounded cursors. Explicit device rejection
returns live cleanup ownership, while malformed or uncertain completion state
quarantines admin, I/O, and data ownership. Provider teardown now deletes the
submission queue
before its dependent completion queue, then releases the exact IOMMU/DMA layout
only after both device deletions complete. Any command rejection, uncertainty,
or DMA-removal failure retains both layouts as quarantined ownership. Active
admin-queue teardown now clears `CC.EN`, bounds readiness-clear polling, and
reconstructs the exclusive admin-DMA owner only after `CSTS.RDY` is zero.
Register uncertainty, fatal status, or timeout retains the exact layout for
quarantine. The exact supervisor-only BAR mapping can now be removed only after
the backend confirms mapping and TLB invalidation; failure returns the complete
generation-bound mapping for quarantine/retry. Full provider shutdown binds all
three generations before mutation, deletes the I/O submission and completion
queues, removes their DMA layout, disables the controller, removes the admin
DMA layout, and finally unmaps the BAR. An initial identity mismatch returns all
live owners untouched; any later failure reports the exact completed phase and
retains the remaining layouts as quarantined ownership. The NVMe library now
publishes caller-supplied namespace sessions and media generations through the
same canonical block-provider catalog as AHCI, without exposing admin-command
authority. Its isolated enumeration loop uses one transferred shared-memory
leaf, bounded local scratch, validated copy-back, release on every post-receive
path, reply-after-release ordering, and complete transient-buffer wiping. Its
concrete userspace adapter validates immutable reply bindings and emits exact
receive, shared-write, release, and send register frames. Sixty-seven focused
tests pass on Windows and Arch Linux. The class tuple
is cross-checked against the
[PCI-SIG DEVICE_INTERFACE_REPORT ECN](https://pcisig.com/PCIExpress/ECN/Base/AddClasstoDEVICE_INTERFACE_REPORT);
later register and queue work will use the current
[NVM Express specifications](https://nvmexpress.org/specifications/) as its
interoperability reference.

The NVMe userspace adapter now also bounds kernel-reported receive payload and
capability counts by the exact supplied buffers before publishing an envelope.
Its focused Linux suite passes 68 tests; no new device authority or hardware
evidence is claimed.

The opt-in classic IDE disk provider is **PARTIALLY IMPLEMENTED** at the same
authority-free discovery level. It validates an exact PCI mass-storage/IDE
function and configuration generation, rejects reserved programming-interface
bits, distinguishes compatibility and native primary/secondary channels, uses
the architectural fixed compatibility ports without trusting ignored BARs, and
validates native command/control and optional bus-master I/O BARs within the
x86 port space. An exact read/write port capability can now install one
generation-bound channel grant containing only its eight command ports, one
control port, and optional channel-specific eight-byte bus-master window.
Excess rights, substituted objects, invalid generations/ranges, overlaps, and
backend rejection fail before publication. Media generations, interrupts,
service IPC, runtime publication, and
physical-device evidence remain
**PLANNED**. The IDENTIFY gate now selects master/slave devices, performs four
alternate-status settling reads, clears the task-file address registers, issues
ATA IDENTIFY, and bounds busy polling to one second. It reads exactly 256 words
only after DRQ and parses printable fixed-capacity labels, LBA28/LBA48 capacity,
512-byte through 64-KiB power-of-two logical blocks, transfer bounds, DMA, and
flush facts into a generation-bound identity. Absent devices remain retryable;
timeouts, device faults, missing DRQ, and partial data transfers quarantine the
port grant. Eleven focused tests pass on Windows and Arch Linux.
The semantic PIO path now exact-authorizes device read, write, and flush
separately and exact-authorizes transfer buffers for only the CPU access
direction required. It validates identity generations, block ranges, LBA28/LBA48
addressability, exact buffer size, and the 1 MiB interface bound before port
mutation. It programs the conventional task file, bounds every per-block DRQ
transition and final completion, transfers exact logical-block word counts, and
quarantines port and buffer ownership after any partial or uncertain command.
Fourteen focused tests pass on Windows and Arch Linux.
Restart teardown now masks channel interrupts, asserts/deasserts ATA software
reset, performs four settling reads, and bounds the return to idle before the
exact port projection may be removed. Reset or removal uncertainty retains the
grant for quarantine/retry rather than making replacement authority available.
Seventeen focused tests pass on Windows and Arch Linux.
Bus-master DMA ownership now exact-authorizes separately pinned data and PRD
memory with direction-specific data rights and a nonzero DMA generation. It
supports the complete 1 MiB interface bound below the classic 32-bit DMA ceiling,
splits transfers at every 64-KiB boundary into at most 32 conventional PRDs,
zero-verifies the 4-KiB table, writes and verifies every entry and terminal bit,
and rejects overlap or substitution. Backend rejection is untouched; partial
PRD mutation and uncertain IOMMU removal retain quarantined ownership. Twenty
focused tests pass on Windows and Arch Linux.
Bus-master execution now exact-authorizes the selected device operation, binds
the identity and DMA generations to the same channel, verifies transfer size
and direction, stops the engine before programming, clears stale status, writes
and reads back the PRDT address, programs LBA28/LBA48 task files, and starts the
engine with the exact device-to-memory direction bit. Completion polling is
bounded, requires the interrupt indication, checks bus-master and ATA errors,
then stops and verifies the engine before returning live DMA cleanup ownership.
Any post-mutation error, missing interrupt, or timeout quarantines the channel
and DMA layout. The IDE library now publishes caller-supplied device sessions
and media generations through the canonical block-provider catalog without
granting raw port or DMA authority to the storage service. Its isolated
enumeration loop uses a transferred shared-memory leaf, bounded scratch,
validated copy-back, mandatory release, reply-after-release ordering, and
transient-buffer wiping. Its concrete userspace adapter validates immutable
reply bindings and exact receive/shared-write/release/send register frames.
Twenty-seven focused
tests pass on Windows and Arch Linux.

The IDE userspace adapter applies the same receive-result bound and its focused
Linux suite passes 28 tests. Patent review: **NOT_TRIGGERED** for these adapter
checks; they reuse the existing buffered-IPC ABI and add no storage or device
mechanism. See [the patent review log](../patents/REVIEW_LOG.md).

## Disk checking and images

## Dynamically serviced storage modules

Storage transport and filesystem implementations are dynamically resolved
library packages behind stable MRML interfaces rather than statically fused
policy code or path-searched DLL/SO plugins. `mrml-storage` remains the authority,
object, transaction, and policy service. An AHCI library provides
`org.mrml.interface.storage.block-provider`; a FAT32 library provides
`org.mrml.interface.storage.filesystem`. Both initially use the
`isolated-service` form so MMIO/DMA faults and hostile-filesystem parser faults
do not share the storage service address space. “Load into the service” means
bind an exact admitted provider endpoint into its module registry, not map
mutable code with ambient service authority.

NVMe and legacy IDE are additional isolated block-provider implementations,
not new storage authority models. They reuse the same block-provider interface,
module registry, package admission, generation replacement, and supervisor
boundary. The storage service explicitly declares `multiplicity = "many"` for
that dynamic interface; the workspace lock therefore records AHCI, NVMe, and
IDE as three distinct exact provider edges in canonical package order. NVMe and
IDE now publish the same generation-1 fingerprint and isolated-service form as
AHCI. Requirements without this explicit multiplicity remain exactly-one and
fail on ambiguity. PCI enumeration order never selects release membership or
grants device authority.

The generation-1 block-provider interface now **PARTIALLY IMPLEMENTS** its
canonical isolated-service transport at the enumeration gate. The call frame
binds the ABI magic and schema, exact interface fingerprint and generation,
operation number, and fixed request/response sizes. The transport routes through
one opaque endpoint generation and validates the borrowed catalog range before
IPC; response decoding rejects reserved bytes, unknown status values, and byte
counts beyond both the caller's output and the 64-KiB interface limit. The
canonical catalog header and fixed-size records carry only opaque session
generations, checked block geometry, explicit feature facts, and media
generations. Encoding validates every record and zeroes the exact output extent
before publication. The hostile decoder exact-matches header version, record
size, count-derived total length, generational handles, known flags, bounded
power-of-two block sizes, nonzero capacities, and media generations before
exposing any record to storage-service admission. The AHCI library implements
enumeration over that catalog
without receiving storage-service authority. Four focused interface tests and
55 AHCI-library tests pass on Windows and Arch Linux. AHCI, NVMe, and IDE now
each implement this same enumeration contract independently. Provider-side
isolated IPC is now **PARTIALLY IMPLEMENTED** for AHCI, NVMe, and IDE enumeration.
Each service loop accepts one exact transferred shared-memory leaf, rebuilds the catalog in
bounded local scratch, copies back only the validated response extent, releases
the leaf on success or failure, replies only after release, and wipes request,
token, scratch, and response buffers. All three concrete userspace adapters validate
immutable reply bindings and emits the exact receive, shared-write, release, and
send register frames. Malformed envelopes fail before copy-back.
The NVMe loop now records cleanup eligibility only after exact one-capability
envelope admission and structural token validation. It never attempts to revoke
missing, malformed, or undeclared token bytes, while later failures still
release the admitted leaf. Its 68 focused Linux tests and release build pass.
The optional IDE loop applies that same admission-gated cleanup rule. Its 28
focused Linux tests and release build pass; missing, malformed, and undeclared
token bytes perform no release. Neither result is physical-device evidence.
The central storage block loop now also records cleanup eligibility only after
the decoded operation and exact zero-or-one capability envelope agree. Hostile
token bytes on a capability-free operation, malformed tokens, and count mismatch
cannot invoke release; later denial or copy failure still releases an admitted
leaf. Its 163 focused Linux tests and release build pass.
The FAT32 adapter now also rejects kernel-reported receive lengths or capability
counts beyond the exact supplied buffers before publishing a typed envelope;
its focused Linux suite passes 34 tests. The sibling Zstd service adapter applies
the same bound and passes 27 focused Linux tests. Zstd cleanup now retains a
received leaf only after exact one-capability envelope admission and structural
token validation. Missing, malformed, or undeclared token bytes perform no
release, while later failures still release the admitted leaf; its Linux release
build passes.

Patent review: **NOT_TRIGGERED**. This increment reuses the existing kernel
buffered-IPC ABI and adds only boundary-result validation; it introduces no new
filesystem, compression, storage, or device mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: **NOT_TRIGGERED**. Restricting cleanup to a capability admitted
by the same canonical envelope is conventional fail-closed resource handling.
See [the patent review log](../patents/REVIEW_LOG.md).
The read
transport is now canonical: it binds exact endpoint and session generations,
LBA and nonzero sector count, one caller-bounded writable view, fixed framing,
reserved bytes, and operation-specific status. Responses must report a nonzero
byte count within both that view and the 1-MiB interface limit. Six focused
interface tests pass on Windows and Arch Linux. AHCI provider-side read
adaptation and isolated dispatch are implemented in the bounded source model;
NVMe and IDE remain **PLANNED**. Write framing independently binds the same identities and
geometry to an immutable borrowed input view, preserves `ReadOnly` as distinct
from permission/media/I/O failures, and bounds nonzero completion bytes to the
view and 1-MiB limit. Eight focused interface tests pass on both hosts;
AHCI provider-side write adaptation and isolated dispatch are implemented;
NVMe and IDE remain **PLANNED**. Flush and reset now use separate
buffer-free calls through the exact endpoint: flush accepts only a nonzero
durability serial, while reset accepts only a nonzero successor generation and
preserves cleanup-incomplete failure separately. Cross-operation frames fail
closed. Eleven focused interface tests pass on Windows and Arch Linux. AHCI
control adaptation and isolated dispatch are implemented, while its concrete
ATA flush/reset mechanisms and the NVMe/IDE adapters remain **PLANNED**.

The NVMe/legacy-IDE expansion has the following architectural score. Work stays
sequential by provider and each parser/register/queue gate is independently
bounded and tested.

- Complexity impact: **HIGH**
- TCB impact: **NONE**
- New parser boundary: **YES**
- New authority model: **NO**
- New persistent state: **NO**
- External dependency: **NO**
- Failure isolated: **YES**
- Existing-object reuse: **HIGH**

The owner may select or replace an admitted compatible provider without vendor
preference or rebooting the kernel. PCI class, manifest identity, signatures,
and device names only identify candidates. Exact capabilities separately
authorize configuration access, MMIO or I/O ports, DMA, interrupts, controller,
namespace/media objects, and reset. Hostile configuration/register/queue data,
integer overflow, stale generations, DMA after revocation, and uncertain reset
all fail closed; uncertainty quarantines the provider and its device state.

Generation resolution validates the complete candidate graph before activation.
Updating a provider stages immutable package/interface bytes, drains new calls,
revokes the old provider's sessions, DMA, mappings, IPC, and derived handles,
destroys and erases its domain, launches and health-checks a fresh generation,
then atomically publishes a new binding. Existing handles become stale. Failure
leaves the module unavailable and never falls back to an incompatible provider.
The kernel and unrelated services continue running, so a compatible module or
storage-service update requires no reboot. Boot-bound recovery components may
remain static until the userspace resolver is available.

The generation-1 block-provider interface bounds enumeration records and 1 MiB
reads/writes and keeps read, write, flush, and reset distinct. The generation-1
filesystem interface separates probe, mount/unmount, lookup, read/write/create,
flush, check, and format. Opaque handles identify exact generations;
capabilities transferred by the runtime authorize access. Names, signatures,
PCI classes, and manifests do not authorize.

- Complexity impact: **MEDIUM**
- TCB impact: **NONE**
- New parser boundary: **YES**
- New authority model: **NO**
- New persistent state: **NO**
- External dependency: **NO**
- Failure isolated: **YES**
- Existing-object reuse: **HIGH**

The generation-1 block and generation-2 filesystem schemas and generated safe
types are **PARTIALLY IMPLEMENTED**. Filesystem generation 1 remains immutable
history. The block
interface passes eleven focused tests and the filesystem interface's canonical
probe, mount/unmount, lookup, read/write, create, flush, check, and format codecs plus
exact-generation isolated transports pass thirteen focused Linux-host tests. Mount
binds the volume and bounded options range and returns a nonzero mount generation
plus structurally valid root identity, or a typed failure with both fields zero.
Unmount consumes the exact nonzero mount generation through the same endpoint
and returns a nonzero completion serial or typed zero-serial failure.
Lookup frames bind exact volume, mount, and directory
generations and a bounded borrowed name; responses expose only a nonzero object
identity or a typed error, never authority. The isolated lookup transport retains
the exact provider endpoint generation and rejects memory beyond its admitted
bound before invocation. Filesystem read binds the exact volume, mount, file,
offset, and nonempty writable
range; zero-byte EOF success remains valid, while completion over-counts and
error/data mixtures fail closed.
Filesystem write separately binds immutable input, checked offset arithmetic,
and nonzero bounded completion while retaining `ReadOnly`, permission, capacity,
and I/O failure as distinct statuses. Create binds exact volume, mount,
parent-directory, bounded nonempty name, and
provider-defined kind data. Reserved alignment bytes and status/object mixtures
fail closed; a returned object identity is non-authorizing. Flush binds the exact
mounted volume and retained provider endpoint. Success carries a nonzero durability
serial; typed stale-object, permission, and I/O failures carry zero. Check binds
the same exact state to a writable report of at most 64 KiB; zero-byte success is
valid, over-counts fail closed, and typed failures carry zero. Format separates
bounded immutable options from its bounded writable report,
rejects overlap, and preserves `DestructiveAuthorityRequired` as a distinct typed
failure. Request data never substitutes for exact preview-bound authority. The fixed-capacity module registry is
also **PARTIALLY IMPLEMENTED**. It
binds stable module-slot control, interface inspection, provider control, and
endpoint signal authorities separately; exact-matches all generations; permits
three independently replaceable AHCI, NVMe, and IDE block-provider slots to
coexist; cleanup-gates
replacement; and publishes only after fresh launch and health-check. Cleanup
uncertainty quarantines only the affected slot, while failed launch leaves that
slot unavailable until explicit retry and never falls back. Quarantine retains
the exact old and candidate generations; an exact module-`CONTROL` retry repeats
only old-generation cleanup and, on success, advances to unavailable without
launching. Candidate launch then remains gated by its separate full authority set.
Retry exact-matches
the retained candidate generation and requires the same separate module control,
interface inspection, provider control, and endpoint signal capabilities as
launch; a guessed module object never authorizes backend execution. Public state
inspection likewise requires exact module `INSPECT`, and raw class enumeration
remains internal to the registry. Initial binding and cross-slot replacement reject
every module/provider/endpoint cross-role object collision while permitting the
one deliberate shared interface object and same-slot generation succession. Storage passes
181 tests on Windows and Arch Linux before extraction. The AHCI mechanism is now
preserved in the separate `org.mrml.library.storage.ahci` package, which declares
the exact generation-1 block-provider interface and isolated-service placement;
the policy/storage crate no longer compiles AHCI modules. Windows and Arch Linux
each pass 55 AHCI-library tests. The storage service now passes 142 tests with a
hosted cleanup-gated FAT32 generation replacement that invalidates the old
endpoint, health-checks the candidate through canonical probe bytes, and leaves
the modeled kernel epoch unchanged. A production block-provider health-check now
constructs the exact endpoint handle from the candidate endpoint object and
provider generation, invokes bounded enumeration, validates the complete hostile
catalog before admission, and wipes scratch on success or failure. Wrong class,
interface generation, unrepresentable identities, provider rejection, and
malformed catalogs fail before registry publication. The AHCI library now has a
canonical catalog
enumeration endpoint, capability-cleanup-gated service loop, and raw userspace
syscall adapter; installed supervisor execution remains **PLANNED**.

Patent review: **NOT_TRIGGERED**. Exact capability revalidation before retry or
inspection and fixed identity-collision rejection are conventional authorization
and cleanup-recovery plumbing for the existing registry. See
`docs/patents/REVIEW_LOG.md`.

The service-image block adapter now rejects kernel-returned payload or
capability counts beyond its exact fixed receive arrays before constructing a
`ReceivedBlockEnvelope`; the MRML-native block profile cross-builds and the
Linux storage-service suite passes 144 tests. This is compile and unit-test
evidence, not a live installed-service or physical-device result.

The FAT32 provider package is now **PARTIALLY IMPLEMENTED** as
`org.mrml.library.storage.fat32`. It advertises the exact generation-2 filesystem
interface as an isolated service, and `mrml-storage` requires that dynamic
binding separately from the block provider. Its initial read-only boot-sector
parser validates FAT32 geometry, checked extents/FAT capacity, root-cluster and
reserved-sector bounds, and volume identity. The provider also exact-binds the
declared FSInfo sector, validates all three signatures, accepts unknown free/
next hints, and bounds known hints to the parsed cluster domain; hints remain
data and never allocation authority. FAT-chain traversal validates active versus
mirrored selection, requires exact masked mirror agreement, bounds output to
caller-fixed capacity, and rejects cycles, free, reserved, bad, or out-of-domain
clusters. A fixed-capacity short-directory parser now validates 8.3 entries,
deleted records, attributes, output bounds, file sizes, and first-cluster domains
while failing closed on malformed records. Atomic fixed-capacity composition now
joins validated cluster extents and rejects any extent after an end marker. The
read-only LFN path bounds and validates ordinals, reserved fields, short-name
checksums, termination, UTF-16 structure, and cross-cluster sequences; decoded
names remain non-authorizing labels. Bounded read-only file ranges require an
exact validated chain, stage all requested bytes before publication, preserve
caller output on failure, and wipe temporary buffers. The FAT32 provider now
consumes the canonical probe bytes and distinguishes malformed calls from
unsupported media. Its authenticated receive/read/release/reply loop and concrete
register-level syscall adapter erase transient buffers on every path. Cleanup
records a received leaf only after the envelope declares exactly one capability
and its token is structurally valid, so absent or malformed token bytes cannot
revoke an untransferred object; later failures still release the validated leaf. The
provider now also has a fixed-capacity mount/root lifecycle table. It accepts
only parsed `Fat32Geometry`, allocates fresh independent mount and root
generations, exact-matches volume/mount/root on access, and atomically invalidates
the pair on unmount. Duplicate, capacity, stale, and permanent generation-
exhaustion failures preserve state. The table grants no capability and is not yet
wired to the syscall loop. Exact unmount returns a fresh nonzero completion serial
only after removal; replay is stale, and serial exhaustion preserves the live
record. A narrow unsafe backend must read the complete boot sector from the exact
volume handle before admission. The provider validates those bytes, erases the
sector scratch on every path, and publishes no state or generation advance after
backend or parse failure. The provider-side block client accepts only an unsafe
runtime-proven exact volume/session association, sends one canonical LBA-zero
read for the complete logical block, requires exact completion, publishes only
its 512-byte FAT prefix, and erases its scratch after every outcome. A matching
numeric handle or label is explicitly insufficient. Its canonical generation-2
mount transport accepts only empty options, publishes the exact lifecycle/root
response after validation, and maps stale backing sessions without creating
state. A dedicated mount receive/reply loop requires the exact canonical payload
size and zero transferred capabilities while options remain undefined, then
dispatches through the already bound provider and erases local buffers. Its
register adapter uses a null/zero capability receive pair, rejects any reported
capability transfer, and emits the exact mount response. Canonical unmount transport now removes the exact
volume/generation record, returns its nonzero completion serial, and makes replay
typed stale. Its dedicated loop and register adapter require the exact request
size and zero capability transfer, reject kernel over-counts without reply, erase
local buffers, and send the exact completion response. The same exact
volume/session client now assembles bounded unaligned byte ranges
from canonical single-block reads. Every block must complete exactly; a later
failure erases already assembled output and full-block scratch. Concrete adapters
derive FAT-entry and data-cluster offsets with checked arithmetic and validated
geometry. Mounted root loading now exact-matches volume/mount/root identity,
validates the bounded mirrored FAT chain, parses directory clusters until the
end marker, and erases cluster scratch after success or failure. Stale roots fail
before block I/O. Validated root lookup now allocates stable monotonic nonzero
object identities in a fixed-capacity table bound to the exact mount/root/entry.
Aliases reuse identity, volume labels are rejected, exhaustion never wraps, and
unmount invalidates the associated objects. Sixty-seven focused Linux-host tests
pass. Canonical lookup transport preserves the borrowed UTF-8 name, performs
bounded local UTF-16 conversion, rejects malformed/oversized names before block
I/O, exact-loads the mounted root, and emits only a stable nonzero object or
typed zero-object error. The isolated lookup loop exact-validates one transferred
name-buffer leaf, locally rebases the copied range, releases the validated leaf
after later failure, and erases transient buffers. Its register adapter rejects
kernel over-counts. The provider also separates open reservation from activation
in a fixed-capacity table. Reservations authorize no reads; activation alone
publishes an opaque handle, while cancellation, close, and unmount advance
generations and invalidate stale state. Generation exhaustion retires the slot
permanently. Canonical generation-3 open transport now atomically validates the
exact volume/mount/directory/object tuple and publishes only its revocable opaque
handle; capacity and stale failures carry no handle. Active handles drive
bounded file-range reads through the exact
mount/root entry and a fully validated FAT chain; stale handles perform no block
I/O or output mutation, and staging plus cluster scratch are erased. Canonical
read transport bounds the borrowed output view, rejects insufficient staging,
publishes only that view, and maps stale handles without block I/O. The isolated
read loop accepts exactly one structurally valid writable-buffer capability,
copies only successful bytes, releases before reply, and erases local buffers.
Its register adapter rejects kernel over-counts. The complete provider now
passes 101 focused Linux-host tests.
Filesystem interface generation 3 now adds one
canonical provider-open operation that binds the exact volume, mount generation,
directory handle, and non-authorizing lookup object and returns a distinct opaque
handle. Its isolated open receive/reply loop accepts the exact request and zero
capabilities, erases local buffers, and uses a launch-bound register adapter that
rejects kernel over-counts. Generations 1 and 2 remain immutable history; read
service entry integration is next. The storage service
now has an interface-level boot-sector reader that binds an opaque filesystem
volume to one owner-authenticated block session. It validates exact full-block
scratch geometry, rechecks `READ` for every block-zero operation, copies only the
512-byte FAT boot sector, and erases scratch after success, denial, mismatch, or
backend failure. It grants no new right and makes no device call for a mismatched
volume. The native provider entry now consumes the proven association and
separately projected block endpoint, constructs the syscall-backed block-read
transport, and runs the unified generation-3 filesystem dispatcher. Installed
supervisor launch and active execution remain **PLANNED**. The storage policy
service now also has a bounded filesystem open broker. It consumes an unsafe
runtime-authenticated provider/mount/parent/object mapping as identity evidence only, requires the
exact parent's `OPEN_CHILD` authority, derives only requested kind-valid rights,
and tracks opened handles for mount-scoped transitive revocation. Broker and
authority slots are reserved together without publishing authority, then exact
activation makes the child handle usable. Cancellation and unmount invalidate
pending state and release both bounded resources. Lookup-only
authority, parent substitution, and cross-volume mapping fail before creation.
The storage module registry now exact-matches active generation-3 filesystem and
block-provider bindings under separate `CONTROL` capabilities before producing
an unsafe runtime-proven volume/session association. It rejects stale bindings,
authority substitution, cross-SystemRelease pairing, invalid block geometry,
and zero association generations. The resulting non-authorizing launch handoff
has one canonical zero-reserved encoding that binds both module, provider,
interface, endpoint, volume, session, SystemRelease, and association generations;
malformed or substituted records fail closed. The provider-neutral encoding now
lives in the block-provider interface contract, where any exact consumer can
decode the dependency without linking the storage policy service; the storage
wrapper additionally requires filesystem interface generation 3. The shared
interface passes 13 focused Linux-host tests. A filesystem-provider launch
coordinator separately authorizes the exact block endpoint, requires the
placement backend to project the handoff read-only and attenuate that endpoint,
erases its temporary encoding, and returns a generation-bound receipt only on
successful construction. The receipt now retains the backend's exact live
instance or cleanup owner, so successful placement cannot discard the only path
to later teardown. Teardown passes that retained instance back to its placement
backend by mutable reference; a failure returns the complete generation-bound
receipt with any exact backend progress preserved for retry, while only
confirmed success consumes it. This is a service-lifecycle contract; a concrete
native launch specification now also exact-matches the selected native-service
placement, filesystem interface/provider/SystemRelease generations, launch
policy, association generation, canonical handoff length, and block endpoint
before construction. Native launch is now one borrow-safe transaction over the
source task runtime: it validates endpoint and transfer authority, consumes the
exact attachment through the kernel's copy-mediated constructor, and retains
the resulting task as the receipt instance. Every preconstruction failure
atomically revokes both consumed source roots; construction failure uses the
kernel's rollback-complete result. The separate teardown backend changes that
receipt from active-task to exact kernel retry state on failure, then resumes
ordered revocation, removal of the sole read-only consumer mapping, scrub, and
object release after supervised task retirement. Its public backend no longer
accepts or stores a provider mapping backend. A focused lifecycle simulation
completes launch, observes the live-task teardown refusal, retires the target,
retries, and proves the one mapping, backing, and page charge are gone.
Installed invocation and active page-table backends remain **PLANNED**. Storage
passes 162 focused Linux-host release tests. The lifecycle test now invokes the
kernel's concrete inactive x86-64 page-table backend for the sole read-only
mapping, exact-matches that backend root against the target task context before
construction at both the storage and kernel boundaries, retains that root in
the kernel task record, rejects a substituted root while revoking both consumed
transfer
trees, and verifies the exact leaf is absent after teardown. The hierarchy is
never activated on a CPU, so this is controlled Linux-host page-table evidence,
not active-address-space, TLB-shootdown, installed-system, or physical-device
evidence. The block transport now has a
direction-specific entry point
for provider reads that return bytes through the kernel's non-mapped write-copy
projection. It re-decodes the untrusted request, accepts only service-write
direction, exact-matches `MAP | WRITE` authority and the live task/VM/source
binding, dispatches the admitted block read, and copies successful output into
the opaque resource. Direction substitution reaches neither device nor buffer
backend. Storage passes 162 focused Linux-host release tests; this is an
in-memory service and recording-backend test, not installed syscall dispatch or
physical block-device evidence. The
`mrml-fat32-service.efi` entry first copies and validates the exact 144-byte
filesystem/block launch attachment through the kernel-projected read-only
capability, retains the separately projected block endpoint capability, erases
the temporary bytes, sends a generation-bound ready message, and then serves
calls until fail-stop or supervised replacement. The kernel's reusable native
task-construction transaction now derives and tracks the exact two target-space
capabilities and installs the ABI atomically. The entry constructs its concrete
block-read transport from the retained binding and routes probe, mount, unmount,
lookup, open, and read through one unified dispatcher. The 101-test focused
Linux suite and MRML-native release build pass. No active installed launch,
hosted guest execution, or physical filesystem evidence is claimed. The
validated backend now makes the block-provider health check mandatory during
replacement:
it cleans and erases the old generation, launches the candidate, publishes only
after a valid catalog, and explicitly cleans a failed candidate before the slot
becomes unavailable. Retry therefore launches fresh state. Storage passes 144
tests on both hosts. This does not implement syscall-dispatched mount, lookup/open policy,
check/repair, format, writes, installed-kernel launch, or physical interoperability
evidence.

Patent review: `NOT_TRIGGERED` — correcting dependency status from current
source, focused tests, and a service-image build introduces no mechanism. See
[the patent review log](../patents/REVIEW_LOG.md).

Patent review: `NOT_TRIGGERED` — two-phase open publication, bounded handle
tables, generation invalidation, and lifecycle cleanup are conventional
capability and resource-lifecycle mechanisms. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — composing an existing block-read dispatcher
with exact capability validation and bounded opaque-resource copy is
conventional service transport plumbing. See `docs/patents/REVIEW_LOG.md`.

Checking has distinct result types for block-device health, partition-table
validation, filesystem validation, and media readability. Inspection never
silently repairs. GPT checking covers protective MBR, primary and backup
headers/tables, CRCs, range/alignment, overlap, identifiers, and primary/backup
agreement. Repair requires a separately previewed transaction and a valid source
of reconstruction.

Formatting and checking use shared `FilesystemFormatter` and
`FilesystemChecker` contracts. Initial implementations match real filesystem
support: FAT32 must cover ESP/install/recovery use; native filesystem support is
integrated only as it becomes implemented; detection never implies repair.

Raw images are exact byte-addressable block images with bounded logical size,
sector assumptions, and block count. Host sparse creation is preferred where
supported and records logical size, allocated size, sector size, and format.
Creation rejects zero/overflowing/misaligned sizes, output collisions, unsupported
block counts, and known insufficient capacity. Partitioned image creation reuses
the deployment transaction: create GPT, ESP and MRML partitions, format, deploy
an authenticated `.mrz`/`SystemRelease` package graph, flush, reread, and verify.
Writing an image to a physical disk is never modeled as an authorized blind copy.

## Native USB mass-storage bring-up

**PARTIALLY IMPLEMENTED.** The USB storage library identifies an unambiguous
SCSI transparent Bulk-Only Transport interface and validates command tags,
transfer lengths, status and capacity. Its current contract is one 512-byte
sector on LUN 0. A write succeeds only after WRITE(10), SYNCHRONIZE CACHE(10),
and matching READ(10). Transport errors, short transfers, invalid status and
readback mismatches fault the session; no uncertain write is retried. This
is a protocol implementation tested against scripted bulk transfers, not
a storage provider exposed to applications.

FAT32 has a separate fixed-size data update primitive for an existing file
occupying one 512-byte sector. It checks the expected previous bytes and
preserves sector slack; it cannot create, resize, allocate or modify FAT or
directory metadata. Its caller must prove exclusive partition access and
validate the file extent, including absence of aliases. It is not exposed by
the read-only FAT32 service.

The polled xHCI controller engine validates MMIO and DMA ranges, initializes
command/event rings, and addresses one direct USB 2 High-Speed or USB 3
SuperSpeed device. It reads descriptors on endpoint zero, binds one
configuration with a single Bulk-Only Transport interface, and makes exact,
bounded bulk transfers. The two bulk endpoint rings recycle with Link TRBs
and independent cycle bits, only after exact, successful transfer completion
and connection revalidation. The Linux host QEMU qtest links the public USB
and FAT32 libraries without adding a dependency between them. In both emulated
USB modes, the fixture reads the partition table, FAT32 boot sector, directory,
and mirrored FAT entries through the xHCI disk. It rejects a stale expected
payload and performs repeated fixed-file overwrites across bulk and event ring
wraps. The host compares the entire persisted image against its expected bytes:
only the three payload bytes in `PROBE.TXT` differ. Sector slack, partition
and FAT32 metadata, and the rest of the disk stay unchanged. After confirmed
emulated unplug, the old session rejects a write at the port check and latches
the fault for later operations. This covers removal between requests, not
mid-transfer removal, recovery, hardware speed, power-loss durability, or
certification.

Run the opt-in fixture on Linux with QEMU installed from the repository root:

```bash
./target/debug/mrml test org.mrml.test.usb-fat32-qtest --target linux
./target/mrml-native/linux/debug/mrml_usb_fat32_qtest_tests --ignored
```

The partition bounds and exclusivity in this test are supplied by its private
synthetic image, not by a native storage authority. The probe now compares the
complete provisioned FAT32 metadata (the reserved area, both FAT copies and
the one-sector root) before authorizing the bounded file update locally. It
checks the expected provisioned volume serial and rejects altered metadata,
including a second root entry or an unexpected FAT link, without issuing a
write. The serial is not permission to write: this operation still requires
an exclusive, generation-bound partition view. An uncertain result closes
the view rather than retrying. This path does not create a file on an
arbitrary FAT32 volume or expose a general sector-write RPC.

The USB provider now has a separate diagnostic partition endpoint. It accepts
only a supervisor-supplied partition capability with read/write rights, a
matching live session and media generation, and the exact in-range partition
from a single inactive FAT32 MBR entry. It allows relative reads inside that
partition and a canonical 512-byte write on its own partition session (not
on the disk's read session), only to the supervisor-selected file
sector. The FAT32 test layer still verifies the full fixture and constrains
the update to the three marker bytes. Revocation or replacement of the
partition capability prevents further I/O; an uncertain write withdraws the
USB session and is not retried. The USB 2/3 QEMU fixture exercises this
endpoint and checks the entire persisted image. It also tests a wrong media
generation, a substituted or read-only capability, a different extent, a
stale session and an attempt to write metadata. In the USB 3 case it tests
unplug before the write and verifies that the old session is retired. The
test capability is modeled in the running host fixture, not transferred to
an executing USB service MicroVM. Normal enumeration remains read-only.
A separate write adapter now carries one canonical request and its copied
512-byte input on the existing generation-bound MicroVM queue. The provider
owns the diagnostic partition and enforces the exact write sector after queue
validation. It rejects a replayed notification and closes the endpoint if
an accepted operation cannot publish its reply; missing completion is not
permission to retry. The QEMU test sends the marker updates through this
queue and checks the persisted disk. It rejects an earlier completion and
refuses further writes through that consumer. The peers in this test are synthetic:
it does not launch the USB provider in a MicroVM or map hardware DMA.

A separate KVM diagnostic now maps a shared page into two independently
signed guests. One changes the three marker bytes in the submitted USB write
request and the other observes the exact successful completion through its
own mapping. The real USB queue and BOT disk code run in the hosted test
harness with a synthetic backing sector; the fixture requires a cache flush
before readback and checks the untouched sector bytes. Run
`mrml test org.mrml.system.vmm-kvm --target linux` and then
`target/mrml-native/linux/debug/mrml_kvm_tests --ignored --nocapture live_kvm_guest_supplies_usb_write_payload`
on a Linux host with KVM. The live guest test and the QEMU/xHCI FAT32 test
are distinct: the KVM test does not put the USB driver inside a guest or
access physical flash media.

The separate `usb-guest-probe` fixture builds a freestanding Rust image that
executes the FAT32 update and USB BOT/SCSI code inside a signed KVM guest.
The guest verifies the preallocated `PROBE.TXT`, updates `old` to `new`,
requires cache flush before readback, and verifies the untouched sector bytes.
Only the result byte crosses the checked, non-executable peer page, which the
launcher retires after the test. To reproduce this guest-only test, run
`mrml build org.mrml.test.usb-guest-probe --target native --release`, then
`mrml test org.mrml.system.vmm-kvm --target linux`. Set `MRML_USB_GUEST_PROBE`
to the resulting `mrml-usb-guest-probe.efi` under
`target/mrml-native/mrml_native-x86_64-unknown-uefi/release/` and invoke the
same test binary with `--ignored --nocapture live_kvm_guest_executes_usb_write_probe`.
That mode uses a synthetic medium in guest memory.

For external persistence, use the same image and run
`--ignored --nocapture live_kvm_guest_writes_qemu_usb_disk` instead. A second
mode of the signed MicroVM runs the same BOT/SCSI and FAT32 code over a
one-page test mailbox. The host forwards bounded, phase-checked bulk transfers
to QEMU's xHCI USB 2 and USB 3 endpoints. Only the declared fixture sector and
the exact three-byte update are admitted. The test observes successful cache
flush and readback, removes the disk, revokes the emulated controller, and
compares the entire raw image against the expected bytes. The xHCI register
and DMA transport still resides in the hosted QEMU fixture, not inside the
MicroVM. Neither mode verifies an installed VMX/VT-d device assignment or a
physical Chromebook write.

The signed guest also has a distinct read-only controller preflight mode:
`--ignored --nocapture live_kvm_guest_preflights_qemu_xhci`. It reads the
emulated capability header and walks the legacy ownership chain using the
guest-side xHCI platform adapter. The fixture permits only the discovered
capability dwords and one four-byte scratch marker in projected DMA RAM. The
host verifies readback and unchanged adjacent bytes, scrubs the marker, checks
that PCI bus mastering stayed off, and compares the unmodified disk image.
The scratch transaction tests guest access to emulated DMA backing, not a
device-initiated DMA transfer. This mode cannot reset or start a controller
and does not authorize writes to physical storage.

Run `--ignored --nocapture live_kvm_guest_commands_and_retires_qemu_xhci`
to exercise the next stage. The signed MicroVM runs the existing xHCI driver
to initialize fixed queues, submit one No-op Command, consume the exact
controller-written completion, and stop. A test-only host broker retains
the PCI assignment; it checks activation, admits only the required register
values and queue operations, and verifies halt before disabling bus mastering.
It independently verifies the completion before scrubbing the queues, denies
further guest access, and checks that the disposable image was unchanged.
The QEMU controller performs the DMA in its emulated RAM; this is not
physical DMA isolation or an installed VMX/VT-d lease. The command diagnostic
does not address the USB device or issue storage commands.

Run `--ignored --nocapture live_kvm_guest_enumerates_qemu_usb_device` to
extend that diagnostic to one directly connected emulated device. The guest
selects the connected port, enables and addresses one slot, and reads the
18-byte device descriptor over endpoint zero. The test broker accepts only
the assigned port, exact context pointers, and the single standard
GET_DESCRIPTOR transfer. After halt and revocation, the host checks the
address and transfer completions and the descriptor independently, scrubs the
queues and contexts, and compares the untouched image. This is enumeration,
not a guest-controlled bulk storage read or write.

`--ignored --nocapture live_kvm_guest_configures_qemu_usb_bulk_endpoints`
runs the next stage. The guest reads the configuration header and the full
descriptor, configures the descriptor-selected bulk endpoints, and issues
SET_CONFIGURATION. Before permitting endpoint configuration the broker compares
the full input context against the exact discovered device and assigned ring
addresses. After retirement the host checks the descriptor, command and
control-transfer completions, confirms both bulk rings stayed empty, and
verifies an unchanged image. This mode issues no bulk transfer or SCSI command.

The next diagnostic, `--ignored --nocapture live_kvm_guest_reads_qemu_usb_sector`,
uses the signed guest's own xHCI bulk rings to run BOT/SCSI READ CAPACITY and
READ(10) for the one provisioned fixture sector. The broker accepts only the
exact read-only sequence, including one REQUEST SENSE and retry if QEMU
reports reset-related unit attention. It checks the returned capacity, the
sector bytes, and matching status tags. After verified halt, withdrawal,
and scrubbing, the complete external disk image must still match. Unlike the
earlier hosted xHCI write relay, this exercises bulk transfer and storage
protocols together inside the guest. It does not exercise an in-guest write
or qualify physical hardware.

`--ignored --nocapture live_kvm_guest_writes_through_qemu_xhci` uses those
same guest-driven endpoints to test a single update to the provisioned
`PROBE.TXT` data sector. Before authorizing a single WRITE(10), the test
broker verifies the original 512 bytes and exact target. It admits only the
three-byte marker change, requires successful SYNCHRONIZE CACHE and full
sector readback, and retires the controller and scrubs its queues. After
QEMU confirms removal, the host independently compares the entire image:
only the three expected file bytes may differ. This is a fixed-sector QEMU
diagnostic, not a general FAT32 writer or a verified Chromebook write.

Patent review: NOT_TRIGGERED; this is exact fixture comparison and scoped
dispatch using the existing FAT32, capability and USB mechanisms. See
[review log](../patents/REVIEW_LOG.md).

The xHCI lifecycle now retains the original assignment on untouched startup
failure, and a shutdown-only owner after partially programmed startup or
uncertain halt. Confirming a halt consumes the live controller and exposes
only revocation, not another I/O session. Revocation failure retains the same
owner for retry. Its backend contract requires disabling bus mastering,
revoking and invalidating DMA, scrubbing reusable memory, and withdrawing the
exact MMIO mapping; abandoned live or uncertain assignments must quarantine.
The QEMU fixture verifies the halt and PCI command-bit readback for the
emulated function only. Tests with a synthetic backend cover an uncertain
start write, halt timeout, and failed revocation. This does not prove physical
DMA isolation or implement the native assignment backend.

The xHCI PCI admission check compares a fresh snapshot with an expected
controller descriptor: segment/bus/device/function, configuration generation,
vendor/device and class/revision, header, and BAR0 base, type, and size.
It admits aligned, non-prefetchable 32- or 64-bit memory BARs and rejects an
already enabled bus master. The QEMU fixture sizes, restores and reads back
its own synthetic BAR, exercises a stale-generation rejection while bus
mastering is off, and passes the validated size to the controller. These
checks do not grant rights or establish an exclusive assignment. Native
activation must hold the same assignment lock from revalidation through
mapping and bus-master enable, with IOMMU isolation installed first.

The PCI startup path now verifies the exact backend-reported DMA mapping
generation and bounds before touching the controller. It retains those bounds
for the initial queues, device contexts, control transfers, and bulk buffers.
The controller resets with bus mastering off, publishes isolated queue memory,
revalidates the assignment, and requires exact PCI command readback before
programming DMA pointers or starting the controller. Failure after programming
begins returns the existing shutdown-only owner. Scripted tests reject a
mapping change during startup or an unchanged PCI command after enabling.
QEMU checks the halted/reset state at bus-master enable, rejects out-of-range
DMA, and runs the existing FAT32 test using its synthetic guest aperture.
This is ordering and bounds evidence, not physical IOMMU enforcement.

For Intel VT-d, the kernel now resolves PCI sub-hierarchy entries in the
firmware DMAR table to the named bridge and its downstream bus window, rather
than falling back to the segment default for a downstream xHCI requester.
It checks nested bridge windows against their parents, excludes interrupt-only
entries from PCI DMA routing, and rejects ambiguous matches and unsupported
ACPI namespace scopes rather than guessing. This is read-only routing evidence
and does not establish device isolation, requester-alias safety, or DMA
authority.

The DMAR parser also retains firmware Reserved Memory Region Reporting
(RMRR) extents and their PCI scopes. The bounded assignment route refuses
requesters covered by such an extent instead of silently omitting required
firmware memory mappings or granting them implicitly. An unrelated
requester can still be routed. This does not establish which RMRRs, if any,
the running Dragonair firmware reports.

The verified VT-d unit can now check a contiguous DMA aperture against its
active legacy root, exact requester and expected hardware domain. It checks
every 4 KiB page in the bounded aperture against the expected physical backing,
including non-identity mappings, and intersects read/write permissions along
the walk. A stale root, wrong unit, missing page, unexpected backing, or
read-only ancestor cannot pass. This is a read-only check over existing
mappings; it does not install or lock them, invalidate caches, or prove
requester-alias isolation. The supervisor-facing xHCI VT-d startup entry
point matches the route to the exact PCI location and invokes this verifier
before programming, immediately before bus-master enable, and after PCI
readback before queue-register writes or RUN. Tests inject failure at each
gate. The trusted backend must still construct and retain the live
assignment, pin and synchronize the tables, and implement withdrawal.
The QEMU FAT32 fixture still uses synthetic guest DMA, not this physical
VT-d path.

The kernel now provides a bounded withdrawal operation for an existing
legacy VT-d aperture. It verifies the entire window before editing, clears
only the matched leaves' DMA permission bits, and requires context-cache
and IOTLB invalidation with DMA reads and writes drained. The current
profile requires coherent table walks and register-based invalidation.
The context-cache and IOTLB registers use their distinct global request
encodings, and both must report global completion.
A late failure leaves the original pages quarantined; the exact aperture
can be retried because denied entries retain their backing addresses.
The operation does not stop the device, disable ATS, establish ownership,
scrub memory, or release pins. The native backend must supply those steps
and wire installation and withdrawal to the xHCI assignment lifecycle.

The kernel can also populate a bounded, existing legacy VT-d hierarchy while
PCI bus mastering is off. Installation validates all destinations up front
and accepts only zero entries; denied entries that retain prior backing are
not free slots. Success requires a confirmed draining invalidation. A failed
publication clears only the prefix it wrote and requires a second successful
invalidation before it reports rollback. If that cannot be confirmed, the
backing must remain quarantined. This does not issue native PCI assignments,
reclaim revoked slots, or arm a controller. A separate builder can prepare a
six-page inactive legacy root for one exact requester and a window within
one 2 MiB span. Its DMA leaves and all other requester contexts start absent.
The boot owner still has to allocate/pin these table pages separately from
device memory, quiesce all requesters using the remapping unit, and establish
that installing the root is safe before activating it.

The supervisor-side xHCI adapter now composes installation, activation
verification and withdrawal for a preallocated Intel VT-d assignment. It
matches PCI location and DMA extent, installs only with xHCI halted and bus
mastering disabled, and confines register and DMA access to the assigned
ranges. Shutdown confirms halt and bus-master disable before withdrawing
the exact aperture, then asks the owner to scrub and release. If release
fails after draining, retry does not reprogram the device or IOMMU.
Tests inject an unchanged PCI command, uncertain withdrawal, and failed
final release. A concrete native owner must still issue PCI assignments,
allocate/pin resources, and implement quarantine and final release; the
adapter is not called from native boot.

The native PCI owner adapter now accepts only an exact device control
capability and separate DMA memory rights. The trusted lease must match
the PCI, BAR, allocation and DMA generations and the complete VT-d
aperture, including physical backing and hardware domain. It samples
configuration space through the lease and changes only the bus-master
bit using a command-width write after checking the live identity. The
adapter does not implement the allocator or pin/unpin itself. The kernel
ECAM adapter now provides the 16-bit bus-master toggle with exact command
readback for a supervisor holding the writable function's exclusive lease.
Its memory-backed test covers stale command rejection, range checking and
preservation of adjacent PCI Status. The native xHCI lease composes this
writer with a pinned backing provider, confines ECAM reads and Command
changes to the one bound requester, and rejects further access after
release. Memory-backed tests verify that another populated PCI function
is untouched. The native kernel still has to issue and retain that pinned
backing and ECAM mapping through boot, shutdown and hot removal. No
physical ECAM was accessed by the tests.

The early kernel allocator can reserve up to 256 physically contiguous DMA
pages from validated free RAM, excluding physical page zero and honoring the
verified host address width supplied by the caller. The allocator is
monotonic: dropping the reservation does not put pages back into circulation.
This is a boot-lifetime reservation, not a runtime pin or a device mapping.
The inactive page-table builder can install an exact supervisor RW/NX
mapping and retain the reservation in a root-bound handle. It preflights the
entire virtual range and removes newly installed leaves on a recoverable
failure; an uncertain rollback requires discarding that inactive hierarchy.
After activation, the initializer consumes the handle, rechecks the root and
every 4 KiB leaf, then clears the exact reservation. These checks do not
establish alias exclusion, cache type or DMA coherency. The live boot path
cannot yet activate native xHCI. The opt-in `boot_dma_probe` UEFI loader
profile requests 16 contiguous LoaderData pages below 4 GiB, maps them
supervisor RW/NX at a dedicated virtual address, and validates the exact
allocation in the raw final firmware map. It then tags that range after
framebuffer overlay; neighboring ranges keep their original classification.
The kernel handoff accepts one bounded DMA tag, and the allocator does not
treat that range as free. Normal loader profiles do not emit the tag.
On the paired diagnostic kernel, before AP startup, verify every active
4 KiB mapping, clear the loader's nonzero pattern, and read back the
complete range before reporting success. To run the signed, disposable-image
regression, use `mrml usb test-dma OVMF_CODE OVMF_VARS QEMU`. Its trace
requires a dedicated DMA handoff success byte before the embedded FAT32
restart trace. This exercises the CPU mapping, not controller DMA. It
does not issue device capabilities, write PCI configuration or touch
physical media.

The opt-in loader also copies the unique DMAR and MCFG ACPI tables when
both exist. The kernel validates the bounded snapshots and their topology
before reporting success; an absent pair carries no DMA authority.
`mrml usb test-dma-acpi OVMF_CODE OVMF_VARS QEMU` checks the ACPI handoff
with QEMU's Intel IOMMU. After parsing the tables, the probe reports whether
the normalized handoff map covers every DRHD bootstrap page and full ECAM
window as MMIO. On the tested q35/OVMF image it reports missing coverage
(`d7` after `d5`), so ACPI discovery alone does not justify mapping the
registers. The `test-dma` companion omits the IOMMU and expects neither
marker. Neither boot installs device mappings, accesses PCI or DRHD
registers, or activates DMA for the MRML xHCI driver.

The UEFI library has a boot-only, read-only
[DXE resource query](https://uefi.org/specs/PI/1.8/V2_Services_DXE_Services.html#getmemoryspacedescriptor)
for the next discovery step. It checks the declared table signature, size,
revision, CRC and query slot, then requires explicit MMIO with uncacheable
capability across the whole requested range. It rejects holes, overlaps,
non-MMIO descriptors and excessive fragmentation. The opt-in loader checks
the DXE table and function address against a fresh bounded boot memory map,
then queries each DRHD bootstrap page and each complete ECAM window. The
QEMU q35/OVMF fixture returned no positive uncacheable MMIO classification
for either window (one DRHD, one ECAM; trace `e1f1`). This is observational
only: it does not change the firmware resource map, issue mapping authority,
prove CPU cache attributes, confer ownership or read device registers.

In the separate host-side QEMU fixture, `test-dma-acpi` pauses that same
emulated machine after the signed trace. The Rust runner verifies in QEMU's
CPU-visible flat resource map that PCI ECAM is the exact 256 MiB I/O window
and the Intel remapper registers occupy only their expected byte extent.
It also rejects any other visible resource in the rest of the remapper's
4 KiB page. Unrecognized monitor output fails closed. This evidence is for
the q35/TCG test fixture only: it is not guest firmware evidence and supplies
no authority to a physical build.

Before secondary CPUs start, the DMA probe also reads the live CPU
protection controls. The requirement is four-level paging, supervisor
write protection, NX enabled, and architectural UC at PAT index 3
(not UC-minus). The loader clears PGE and PCIDE before loading the new root
to retire firmware translations, and the BSP verifies those bits are off.
A separate tested page-table verifier checks exact read-only
supervisor NX device leaves and rejects another mapping of the same physical
frame anywhere in the four-level hierarchy. It rejects table frames in the
aperture, unsupported large leaves and excessive walks; it does not examine
other roots or stale TLB entries. CPU policy and leaf checks do not establish
that a claimed device resource exists. The ordinary DMA diagnostic images
observe CPU policy but do not install device leaves or access registers.

`mrml usb test-dma-map OVMF_CODE OVMF_VARS QEMU` uses separate signed
test-only profiles and creates disposable media. The same profile must first
halt before mapping if the private QEMU ACPI marker is absent. With the
marker, the loader admits only the exact q35 topology, rejects conflicts
with the firmware memory map or framebuffer, and rechecks the complete
marker, DMAR, and MCFG snapshots against the final map after firmware exit.
In the control case, the protected root maps only the remapper's first
page and the ECAM page of fixture function `00:1b.0`; the BSP independently checks the exclusive
read-only, non-executable device leaves. The BSP waits at a bounded
rendezvous before AP startup. The host runner pauses the same instance
and checks the exact live q35 memory map and dedicated emulated UART. For
a valid release it also locates the assigned, aligned 16 KiB BAR0 of the
separate fixture controller via the PCI monitor and confirms the exact
capability and operational register subranges belong to that controller
in the CPU FlatView. This is not proof for the remaining BAR bytes.
Before sending the valid release, the paused host reads only the proved
CAPLENGTH/HCIVERSION dword (requiring the operational base at offset 0x40),
USBCMD and USBSTS. This records Run/Stop and HCHalted independently of the
later PCI bus-master sample. In the signed q35 run, USBCMD was zero and
USBSTS reported HCHalted even though PCI bus mastering was still enabled.
These reads are observations; they neither halt
the controller nor prove that it is safe to touch the full BAR or clear BME.
Only then does it set the UART scratch byte over private QMP pipes and
resume. The same signed image rejects the wrong release byte without
touching either mapped device. With the right byte, it samples only
fixed VT-d version, capability, extended capability and global status
registers, and the exact xHCI function's PCI identity, command, class,
header type and assigned BAR0 pair. The guest BAR base must match the
paused host's observation. Neither side writes a BAR sizing probe, and the
control guest does not map or read through the BAR. The guest checks the
capability-derived VT-d arrays against the proven byte extent without reading them. The report
includes the observed bus-master bit, not an ownership or shutdown proof.
The read-only cases do not write device registers or initiate USB DMA. The marker
is an opt-in for the isolated model, not authenticated hardware provenance.
The same command additionally exercises a separate q35 topology. The boot
USB and firmware devices stay on the bypassed default bus; test xHCI
`41:00.0` is the only descendant of root port `40:00.0` on the separate
remapped host bridge. The signed boot checks that DMAR describes precisely
that sub-hierarchy plus the IOAPIC with interrupt remapping disabled, with
no include-all unit or reserved ranges. It independently verifies the
four read-only pages and reads the exact root port identity, bus numbers
and inherited command bits after the valid release. Only the isolated
case maps the first BAR page. Before release the host checks all ten
rendered ranges on that page (capabilities, operational registers and
eight port ranges) and rejects overlap in the unmapped tail. After release
the guest requires the exact live PCI BAR assignment before reading
CAPLENGTH, USBCMD and USBSTS, and the host rejects any disagreement with
its paused sample. There are no port, runtime or doorbell register reads
or writes by the guest. The paused host also checks the live QEMU bypass settings and exact PCI inventory of the
remapped branch before accepting the signed report. The wrong-release
case stops before touching PCI or VT-d registers in the guest. This shows
the intended remapping scope and identifies the inherited firmware state;
it does not disable either bus master, install translation or transfer
USB data. Do not flash this profile or use it in a real hardware test.

A separate shutdown case within this test-only image requires the exact
version-2 fixture marker and a different release byte. Only the two ECAM
function pages are writable; the BAR and remapper remain read-only.
An already halted controller and inactive remapper are mandatory. The
guest clears BME via a 16-bit PCI COMMAND write at the endpoint, verifies
readback, then clears and checks the isolated root port. The paused QEMU
monitor independently confirms both changes, no change to the boot USB
command or status, and no change to xHCI status or remapper GSTS. The wrong-byte
case still stops before device access. This is shutdown only: no reset,
new translation, bus-master re-enable, or USB transfer.

The bounded VT-d aperture path now supports a non-snooping table walker
only when its trusted table backend explicitly provides ordered writeback.
The x86 helper requires CPUID CLFSH, validates cache-line geometry, and
flushes only lines intersecting the supplied pinned write-back table
slice (at most six pages). Publication, rollback and revocation flush
each changed leaf before context/IOTLB invalidation. An uncertain
writeback is never reported as completed invalidation or released DMA
memory. The normal direct-table constructor does not opt in implicitly.
The cold-activation API prepares and writes back the exact six table
frames before publishing their root pointer. It is limited to an
exclusively owned, pristine 48-bit legacy unit with drain support. It
waits for root-pointer acknowledgment, globally invalidates the context
cache and IOTLB while translation is off, then enables and reads back
translation. Failing after the first register write retains every page
and keeps all requesters quiesced. Hosted register-model tests cover
ordering and timeouts. The separately sealed QEMU profile (marker revision 3)
also tests that startup on the live emulated remapper. Its first host release
allows only the existing PCI shutdown sequence and preparation of six pinned
write-back frames. With the same VM paused, the monitor independently checks
both PCI commands, controller halt, zero RTADDR/GSTS/FSTS, the entire
allocation's CPU-visible RAM backing, and every word of the six frames.
The tables cover exactly requester 41:00.0, with no present DMA leaves.
Only the second release permits access through the exact 0x230-byte register
adapter. The success case requires RTADDR to match the checked root, GSTS to
acknowledge it with translation on, no faults and no change to BME or the
controller. A wrong first release skips guest register access entirely; a
wrong second release leaves RTADDR/GSTS/FSTS zero with BME off. No controller
reset, bus-master re-enable, DMA transfer or physical-hardware test occurs.

Before the isolated shutdown case reaches its host rendezvous, the signed
guest now verifies the entire boot-DMA allocation against the active root,
rejects any second mapping or page-table frame overlap, and reads the BSP's
cache controls. It requires PAT index 0 to select write-back and proves
write-back coverage for each page above 1 MiB and below 4 GiB through either
the default MTRR type or the union of matching write-back variable ranges.
A conflicting type, malformed mask, disabled cache or uncovered page stops
the probe. This read-only check validates a prerequisite of table writeback;
it does not activate translation or authorize DMA.

The live cold-profile test then installs one read/write DMA leaf through a
bounded view of the six high-mapped frames, with no identity-map fallback.
The same paused monitor checks the leaf points to the exact first payload
page and that all other leaves are absent. A third release authorizes
withdrawal only. The guest flushes the cleared permissions and waits for
draining invalidation; the host confirms the leaf is non-present, the root
is unchanged, and bus mastering is still off. The boot allocation remains
pinned; no hardware or data transfer is implied.

A fourth sealed profile adds a read-only preflight for the runtime and
doorbell access needed by the native xHCI driver. The signed loader checks
firmware-memory conflicts on every mapped page before and after exit from
boot services. Only the first three BAR pages are mapped, with no aliases.
The paused QEMU monitor attributes the exact capabilities, operational,
port, runtime and doorbell ranges to the intended controller and rejects
extra overlaps in the three mapped pages, including their padding. The fourth
BAR page contains MSI-X resources and remains unmapped. Both sides verify DBOFF,
RTSOFF, halted controller state, IMAN reserved bits, and doorbell readback.
A distinct release is required. This preflight adds no xHCI or PCI writes,
does not program queues, and does not start a transfer.

The former profiles 5–7 ran xHCI command completion and USB mass-storage
read/write tests at CPL0. They were QEMU-only milestones, not a production
storage path. Their kernel-side driver wrapper and writable controller BAR
mappings have been removed. The signed loader now rejects all three marker
values before mapping. The no-remapper control separately rejects a missing
DMAR before guest register access. The other profiles remain tests of the
kernel’s mapping, quiescence, and DMA isolation mechanisms, with no native
USB transfers.

The driver and the read-only ownership sampler share one bounded xHCI
extended-capability walker. It reports absent, unclaimed, firmware-owned,
OS-owned, or contended semaphores and rejects malformed, duplicate, or
out-of-range legacy capabilities. It never reads the adjacent legacy SMI
control dword or writes ownership state. The sealed QEMU preflight
independently expects no legacy interface. A semaphore observation alone
is not authority for reset, DMA, or firmware handoff. Before the first
controller programming operation the driver reads the bounded capability
again and requires the same HCCPARAMS1 and exact legacy capability header
at the same register offset. Firmware-owned or contended states, a mutated
sample, or malformed readback fail before controller writes, PCI activation
or DMA writes. This detects observed drift, not a handoff or a replacement
for exclusive assignment and remapping.

A test-only register model exercises the
[xHCI legacy ownership handshake (§7.1)](https://www.intel.com/content/dam/www/public/us/en/documents/technical-specifications/extensible-host-controler-interface-usb-xhci.pdf).
It requires firmware exit, completion of boot-source access, the same controller
lease, and blocked DMA before it models one OS-semaphore byte write. Success
requires consecutive OS-owned, firmware-clear samples from the same capability.
Timeout, a lost request, reclaim, and capability drift fail without a retry or
forced clear. The model never writes an actual register and does not authorize
controller reset, bus mastering, or DMA. Stock QEMU's absent legacy capability
does not substitute for testing a real firmware response.
The standalone [UEFI xHCI inventory](../platform/UEFI_BOOT_MANAGEMENT.md#read-only-xhci-inventory-before-native-bring-up)
uses the same sampler through the firmware PCI I/O protocol. It also
reports validated MCFG coverage and the DMAR route for that exact
requester, then returns to firmware without touching storage. Its QEMU
test covers a controller with and without a remapper and an absent controller.

The single xHCI transport implementation remains in `storage-usb`. Its
runtime caller must be an isolated block-provider service implementing the
existing generation-1 block-provider protocol; FAT32 stays in its separate
filesystem service. A read-only adapter now implements canonical enumeration
and one-sector reads over the existing BOT/SCSI driver. Hosted tests check
stale-session denial, invalid range and buffer rejection, and no publication
after a transport failure. In QEMU, the capability-checked MicroVM block-read
queue now drives this adapter over the emulated USB 2 and USB 3 xHCI ports.
The consumer reads back the FAT32 file sector, then sees an I/O failure on
unplug and a stale session on retry, with no partial sector copied. The
provider stops advertising the removed disk, and the fixture halts the
controller and revokes bus mastering. These are hosted queue and emulated
device results, not an executing service MicroVM. The xHCI retirement owner
now keeps the exact controller while halt or revocation is pending, never
reopening its I/O path on retry. The service MicroVM supervisor separately
retains one host device lease for the exact launch generation and refuses
guest access or replacement until withdrawal and destruction finish. Live
KVM rollback exercises that ordering with a modeled device lease; the QEMU
USB fixture exercises actual emulated controller halt and bus-master revocation.
The scoped xHCI adapter now admits only the three broker-selected BAR pages
and nonempty, in-range transfers in the exact DMA aperture. QEMU exercises
USB 2 and USB 3 through this adapter, rejects the unprojected MSI-X page and
out-of-range DMA, and still retires the same controller. These checks do not
install hardware mappings. The supervisor now matches the lease's PCI
requester, BAR pages and generation, and DMA object, range, mapping and allocation generations
against a broker-provided projection. The controller-control and pinned
DMA capabilities must authorize the two distinct objects at attachment.
The xHCI adapter checks the same descriptor against the discovered
controller and DMA assignment. The native lease owner independently checks
it against the retained backing, including the exact BAR pages and pin generation. Live KVM exercises attachment with a
modeled lease; QEMU exercises the controller and descriptor checks.
The projected native installer now takes that retained lease, applies the
BAR/DMA bounds before activation, and installs only the VT-d aperture taken
from the same lease. The native-owner regression covers the scoped adapter
and its cleanup. No test yet establishes a DMA mapping from xHCI to an
executing service MicroVM. A device-dependent MicroVM can now be staged
without allowing the supervisor to enter it before a matching lease is
attached. The live KVM rollback test observes its first boot marker only
after attaching a modeled lease. The supervisor now revalidates both retained
capability generations and the exact lease projection on each device-bound
guest access. Revocation or replacement of the DMA handle blocks later guest
access without discarding the lease needed for teardown. Once a change is
observed, the same endpoint stays fenced even if a subsequent sample appears
unchanged. Only withdrawal and a fresh launch can make a new endpoint
available. This is a supervisor admission fence, not hardware DMA teardown.
The managed VT-d backend now also exposes a supervisor-only retirement step
for a stopped, fenced guest. It revalidates the retained controller, clears
only Run/Stop, and waits within a bounded budget for halt before disabling
bus mastering and draining VT-d. Timeout leaves that lease closed to driver
access and available for an exact cleanup retry. The controller model tests
this path; it has not been installed in the Chromebook runtime.
The adapter is not an installed provider and does not authenticate
IPC or retire DMA leases by itself. The kernel grants and
revokes scoped device, interrupt, and DMA resources; it does not run USB
commands or implement a fallback transport. Until a service can receive and
retire such a lease, native USB storage is unavailable. A CPU-only scratchpad planner can stage a zeroed pointer table and 34 aligned
4 KiB buffers in one generation-bound aperture without touching its other
DMA objects. The planner does not install a mapping, publish DCBAA slot
zero, or make the controller available. The opt-in managed startup path
checks a live count, page geometry, and an exact isolated assignment. Its
software-model test publishes the pointer table before enabling bus
mastering and checks cleanup retry after halt. The default startup path
still refuses scratchpads, and native boot policy does not select the new
path. The live driver has one slot,
nonwrapping command and control queues, and no hub support. Dragonair boot
exercises firmware USB access and embedded FAT32, not native USB I/O.

The forward compatibility target is [USB4 v2.0](https://usb.org/documents).
This storage path does not implement a USB4 connection manager, router or
tunneling policy. Those require separate topology, DMA authorization and
revocation, and physical validation. USB Type-C and Power Delivery are
separate from xHCI storage. After native USB 2 and USB 3 storage work, qualify
hardware link modes and loss/recovery (including 20 Gbps where the controller,
device, and cable support it), then qualify USB4 routing separately. Do not
infer a link rate from an emulated device or claim support across USB classes
from a bulk-storage test.

## Optical object and common MMC layer

Optical media is not an ordinary random-write disk. `OpticalDrive` reports
transport, vendor/model/firmware, discovered profiles and speeds, tray/current
media state, and actual read/write/rewrite capabilities. `OpticalMedia` records
its own generation, profile (CD/DVD/BD ROM/R/RW/RE as supported), capacity,
writability, finalization/session state, and detected filesystem.

One common bounded optical/MMC service owns profile discovery, readiness,
capacity, reads, eject/load, write/erase, synchronization, finalization, sense
mapping, timeout policy, and progress. Initial native transports are only
AHCI/SATA ATAPI and applicable USB Mass Storage SCSI/MMC. AHCI and USB provide
transport; neither duplicates Blu-ray policy. The optional isolated IDE/PATA
disk provider described above does not add IDE/ATAPI to the optical stack;
IDE/ATAPI optical, FireWire, general SCSI HBA, and other transports remain out
of scope.

Errors are semantic—no media, media changed/read-only/not blank/full, drive not
ready, unsupported media/command, sense error, device removed, write/power-
calibration/finalization/verification failure—while bounded lower-level sense
diagnostics remain available to authorized inspection. Long burns use operation-
specific timeouts and shared semantic progress: preparing, writing sectors/
percent, finalizing, verifying, and complete.

## UDF and optical images

MRML will independently implement a deterministic bounded UDF writer, reader,
and checker for the highest revision actually demonstrated interoperable across
the supported Windows 11 environment, supported Linux environment, and MRML.
UDF 2.60 is a candidate, not a selected or implemented claim. The evidence must
cover Unicode, empty/deep trees, normalized timestamps, malformed extents, and a
file larger than 4 GiB. External implementations are behavioral oracles, not
source to copy.

`.iso` denotes an interoperable logical optical image and may contain ISO 9660,
UDF, or a hybrid profile. ISO 9660 and optional Joliet remain separate from UDF.
UEFI optical media includes the required El Torito/catalog boot structures,
`BOOTX64.EFI`, authenticated `SystemRelease`, `.mrp` packages, and optionally a
complete `.mrz` image. Firmware does not merely scan an arbitrary optical tree
as if it were an ESP. Image validation covers descriptors/extents, boot catalog,
release/package graph, digest, capacity, and media profile before burn.

## Burning and physical semantics

An `OpticalImageBuilder` produces a deterministic sector stream consumed by one
`OpticalWriter`; direct `.mrz` burn reuses that path. Initial implementation may
materialize the `.iso`, while the API permits future bounded streaming once
layout and digest are known.

`BurnTransaction` binds exact drive and media generations, image identity,
speed, finalization, and verification policies. It inspects, previews, requires
`OPTICAL_BURN`, writes, synchronizes drive cache, finalizes as requested, and
rereads sectors/content digests. Drive success without readback is not verified.
`OPTICAL_ERASE` is separate. Write-once CD-R/DVD-R/BD-R consumption is explicit
and irreversible; rewritable media uses profile-specific erase/format. Cancel
may leave an incomplete or consumed medium and is never represented as rollback.

Data BD-ROM, BD-R, and BD-RE are the target. Audio-CD mastering, complex mixed
mode/multitrack work, movie-region management, AACS/BD+ circumvention, and
commercial DRM bypass are non-goals. Drive firmware is inspection metadata;
flashing is out of scope.

## Virtual optical device and host backends

The VMM presents a narrow MRML-specific experimental VirtIO optical protocol
unless an exact standard device proves sufficient. It supports bounded semantic
read, media/profile query, eject/load, write/burn, synchronization, events, and
structured errors—not arbitrary host SCSI passthrough. Any expert raw path has a
separate capability and restricted opcode policy and is never default.

The guest driver joins the same MMC service used by AHCI/ATAPI and USB. Windows
and Linux host backends may exclusively delegate one exact drive generation to
WHP or KVM. Delegation grants no sibling SATA/USB device, HBA control, host
filesystem, or host path. Revocation yields device removal; inserted/replaced
media increments generation. Host and guest cannot burn concurrently.

For firmware boot, the smallest maintainable bootstrap is preferred: expose a
standard firmware-visible ATAPI/SCSI optical device until MRML boots, then move
runtime operation to VirtIO. A custom OVMF fork is not assumed. No boot claim is
made until actual guest firmware reads the physical or synthetic optical path.

## Monitoring, recovery, and evidence

Resource accounting attributes image construction, read/burn buffers, I/O, CPU,
and service/domain ownership without exposing file content. Low-power policy may
defer background verification or spin down idle drives but cannot interrupt an
active burn. Monitoring reports supported drive/media state, activity, burn
progress/errors, delegation, and temperature only when measured. Security events
cover media insert/remove, burn start/completion/failure, erase, VM delegation,
and revocation.

Installer and offline recovery may read verified `.mrz` and `.mrp` content from
USB, optical, or virtual optical media through the same package architecture.
Recovery media creation/burn remains subject to exact capabilities and evidence.

Implementation order is: typed disk/image APIs; raw/sparse images; GPT/FAT32;
UDF writer; UDF reader/checker; ISO/El Torito; host optical read; MMC; AHCI/ATAPI;
USB optical; physical writer; synthetic VirtIO device and guest driver; Windows
and Linux real-drive backends; real-drive passthrough; GUI projection.

Synthetic tests do not prove physical hardware. UDF is not mature before bounds,
fuzzing, >4 GiB, Unicode, Windows/Linux/MRML interoperability, and physical media
evidence. Physical read/burn, BD-R/BD-RE, AHCI, USB, real-drive WHP/KVM, and boot
claims require exact recorded hardware, firmware, media, host, speed, and result.
Destructive fuzzing against user drives is forbidden.

Patent review: **TRIGGERED** for UDF/optical layout, MMC/burning, virtual optical
protocols, and deployment mechanisms. Standards and implementations require
targeted worldwide family/status and royalty-free-grant review before code is
introduced. See [the patent review log](../patents/REVIEW_LOG.md); no clearance
or infringement conclusion is stated.
