# MRML operating-system roadmap

This roadmap is dependency ordered. It describes intended work, not completion
claims. Status is determined from source, tests, and the evidence ledger in
[MICROKERNEL.md](MICROKERNEL.md), using the vocabulary in
[ARCHITECTURE.md](ARCHITECTURE.md). The machine-generated current workspace
inventory is [STATUS.md](STATUS.md). Numbered component counts later in this
file are dated migration chronology, not current package totals.

## Work-in-progress limit

Maintain one foundational OS task plus, optionally, one independently scoped
compiler task. Never run two giant cross-cutting OS milestones simultaneously.
Each OS task advances one current dependency gate to a coherent tested endpoint
before the next OS subsystem begins. Compiler work may run alongside it only
when implementation, tests, review, commits, and performance/security evidence
remain independently attributable.

## Current priority

Storage modularization is now **PARTIALLY IMPLEMENTED** at its first dependency
gate. Canonical generation-1 `storage.block-provider` and generation-2
`storage.filesystem` schemas define bounded opaque-handle operations for isolated
library providers. Filesystem generation 1 remains checked in as immutable history.
The block interface passes one focused test; the filesystem interface's canonical
probe, mount/unmount, lookup, read/write, create, flush, check, and format codecs plus
exact-generation isolated transports pass thirteen focused tests on Linux. Mount
returns a nonzero lifecycle generation and a structurally valid root identity, or
a typed response with both fields zero; mount and lookup invocations preserve
the exact provider endpoint generation and reject memory beyond its admitted bound. Unmount binds
that exact nonzero generation and returns only a nonzero completion serial or
typed zero-serial failure. The read boundary binds exact volume, mount, file,
offset, and writable range, permits zero-byte EOF success, and rejects completion
beyond the caller's range.
The write boundary independently binds an immutable nonempty input and requires
nonzero bounded progress, preserving `ReadOnly`, permission, capacity, and I/O
failures as distinct results. Create binds the exact parent and bounded nonempty name, preserves the
provider-defined generation-1 kind value, and returns only a nonzero object
identity or typed zero-identity failure. Flush binds the exact mounted volume and
retained provider endpoint; successful durability evidence is a nonzero serial,
while typed failures carry zero. Check binds a writable report of at most 64 KiB;
zero-byte success is valid, over-counts fail closed, and typed failures carry no
report bytes. Format keeps bounded immutable options disjoint from its bounded writable report
and preserves missing destructive authority as a distinct typed failure; the
request bytes do not grant that authority. The storage service will bind exact admitted
generations and restart through complete cleanup rather than
load path-selected code or reboot. The fixed-capacity registry is now
**PARTIALLY IMPLEMENTED** with separate authorities, exact generation changes,
cleanup-before-launch, health-check-before-publication, quarantine, unavailable
state, and explicit retry. Storage passes 181 tests on Windows and Arch Linux.
AHCI package extraction is now **PARTIALLY IMPLEMENTED** without deleting its
mechanisms: all AHCI modules moved intact to
`org.mrml.library.storage.ahci`, which provides the generation-1 block interface;
the storage policy service has no static AHCI module. Windows and Arch Linux each
pass 50 provider tests and 136 storage tests. The AHCI service entry/IPC adapter
has since advanced through launch binding, task construction, mapping, entry
adaptation, atomic supervised activation, a source-tested freeze-first stop
handoff with one-shot runtime-bound teardown reacquisition, device/DMA
quiescence, supervisor-bound retirement, mapping withdrawal, exact cleanup, and
delayed dispatch as described below. A production controller-manager teardown
lease, installed operation-3 routing and entry execution remain unfinished, and
physical AHCI integration remains unverified.

The FAT32 provider's first gate is now **PARTIALLY IMPLEMENTED** in
`org.mrml.library.storage.fat32`. Its isolated generation-2 filesystem binding
and bounded read-only FAT32 geometry, FSInfo, mirrored/active FAT-chain traversal,
atomic directory-chain composition, bounded read-only LFN decoding, and atomic
file-range reads, conservative bounded directory lookup, canonical provider
probing, a fixed-capacity exact-generation mount/root lifecycle table, and the
isolated syscall-backed receive/reply loops pass 101
focused tests on Linux. The loop releases only an exactly declared, structurally
valid transferred leaf; absent or malformed token data cannot trigger revocation.
Its launch-binding constructor decodes the neutral filesystem/block dependency,
exact-matches the filesystem module and provider generation, and separately
requires the attenuated `SIGNAL` capability for the encoded block endpoint before
constructing the runtime-proven volume/session binding. Encoded identities grant
no authority. The MRML-native service entry now accepts only the fixed kernel
register ABI, copies the exact 144-byte record through the projected read-only
capability, validates the filesystem module and provider generation, retains the
separate block endpoint capability, erases the temporary record, and sends ready
only afterward. The kernel now has a reusable native task-construction
transaction that atomically derives and tracks the two exact target-space
capabilities and installs this ABI, rolling them back on entry failure. The
entry constructs the concrete syscall-backed block-read transport from that
retained binding, creates the mounted provider, and runs the unified
generation-3 probe/mount/unmount/lookup/open/read dispatcher. Its MRML-native
release image builds successfully. Installed supervisor launch and active
execution remain next; no hosted guest or physical filesystem evidence is
claimed.
Lookup validates UTF-16 input, matches ASCII
case-insensitively and non-ASCII exactly, accepts both a checked long name and
canonical 8.3 alias, excludes volume labels, and fails closed on ambiguity. The
filesystem interface generation 3 codec passes fifteen, including canonical
all-operation dispatch-header validation. The canonical filesystem/block launch
record is now a provider-neutral block-interface contract, with a filesystem-v3
policy wrapper in storage, so the FAT32 provider can consume it without a service
dependency cycle; that block interface passes thirteen tests. Storage passes
157, including a
hosted cleanup-gated generation replacement that rejects the stale endpoint and
does not change the modeled kernel epoch. Checking, formatting, writes,
installed supervisor launch, and hardware evidence
remain next in dependency order; this lookup returns metadata and grants no open
authority. The storage policy service now has a fixed-capacity filesystem open
broker. An unsafe runtime-authenticated lookup binding maps the exact provider/
mount/parent result to a stable storage object but grants nothing by itself.
Opening requires the exact parent handle with `OPEN_CHILD`, derives only requested
kind-valid rights, rejects substitution before allocation, and records the child
handle for mount-scoped transitive revocation. `LOOKUP` alone remains insufficient.
Storage authority creation is also two-phase: reservation occupies both bounded
broker and authority slots but cannot authorize access, exact activation
publishes the child handle, and cancellation or unmount invalidates the pending
state before either capacity can be reused.
The provider now reserves opens in a fixed-capacity table without issuing a
usable handle. Exact activation publishes a fresh opaque handle; cancellation,
close, and unmount advance its generation, reject replay, and permanently retire
a slot at generation exhaustion. Reads therefore cannot substitute the lookup's
non-authorizing object number for an active provider handle.
Bounded file-range reads now resolve that active handle back to its exact
mount/root entry, validate the complete FAT chain, preserve caller output when
the handle is stale, and erase staging plus cluster scratch after dispatch.
Provider open now has a canonical generation-3 request/response contract, and
FAT32 consumes that contract atomically: only a live exact lookup identity can
publish a revocable provider handle, capacity is typed, and stale lifecycle
substitution returns no handle. The isolated open loop requires the exact payload
and zero capabilities, rejects kernel over-counts, erases local buffers, and
replies only through its launch-bound adapter. Canonical read transport now
bounds the caller's borrowed output, uses only an active provider handle,
publishes that range atomically, and erases staging on success or failure. The
isolated read loop validates one structurally valid writable-buffer capability,
copies only on typed success, releases before reply, and erases local buffers.
Its register adapter bounds kernel counts and preserves receive/write/release/reply
ordering.
Generations 1 and 2 remain checked in unchanged.
The mount table accepts only already-validated geometry, issues fresh independent
mount and root generations, exact-matches both, invalidates them together on
unmount, and permanently fails after generation exhaustion. It grants no open
authority. Exact unmount issues one fresh nonzero completion serial only after
record removal; serial exhaustion preserves the live mount rather than reporting
an ambiguous completion. Mount and unmount are wired through separate bounded
provider receive/reply loops while probe retains its transferred-buffer path.
An unsafe exact-volume backend contract now reads the complete boot sector for the
specified live volume handle, validates it, erases scratch, and only then admits
the lifecycle record. Backend and parser failures publish nothing and consume no
generations. The provider-side concrete block-service client now requires an
unsafe runtime-proven exact volume/session binding, issues one canonical full-
logical-block read at LBA zero, requires exact completion, copies only the
512-byte FAT boot sector, and erases scratch on every path. The mounted provider
now consumes canonical generation-2 mount request bytes, accepts only the
currently defined empty options, and returns canonical lifecycle/root responses;
stale block sessions remain typed stale failures and publish no mount state.
The dedicated mount loop accepts exactly one canonical mount payload and zero
transferred capabilities while options remain empty, dispatches through the
already runtime-bound provider, and erases local request/response buffers after
reply. Its register-level adapter supplies zero capability-buffer capacity,
rejects any kernel-reported transfer, and sends the exact 24-byte response to
the launch-bound reply target.
Canonical unmount transport now exact-matches volume and mount generation,
returns the post-removal completion serial, and maps replay to typed stale while
the removed root remains invalid. Its isolated loop and register adapter require
the exact 88-byte request, accept zero capabilities, reject kernel over-counts,
erase local buffers, and emit the exact 16-byte response.
The bound block client now also composes arbitrary byte ranges from canonical
one-logical-block reads, requires exact completion for every block, erases a
partially assembled output if any later read fails, and derives checked FAT-entry
and data-cluster offsets from validated geometry. The provider now loads the
root directory only after exact volume/mount/root lifecycle matching, validates
the bounded mirrored FAT chain, parses clusters atomically until the end marker,
and erases cluster scratch on every path. Validated root lookup now interns one
stable nonzero object identity per exact mount/root/entry tuple in a fixed-capacity
table. Repeated long-name/8.3 aliases return the same identity, exhaustion never
wraps, volume labels are rejected, and unmount invalidates every associated
object. Canonical lookup transport now preserves the borrowed UTF-8 name buffer,
decodes it into bounded provider-local UTF-16, rejects malformed or oversized
names before block I/O, exact-loads the mounted root, and returns only a stable
nonzero object or typed zero-object error. The isolated lookup loop now validates
the exact payload and one structurally valid transferred name-buffer leaf,
rebases the copied name locally, releases only that validated leaf after every
later outcome, erases transient buffers, and replies canonically. Its register
adapter rejects kernel payload/capability over-counts.
The storage service now provides the first concrete half of that composition:
`FilesystemBootSectorReader` binds one non-authorizing filesystem volume identity
to one owner-authenticated block session, validates full-block scratch geometry,
rechecks `READ` on every block-zero access, copies only the 512-byte boot sector,
and erases scratch on every path. The provider half now consumes the
kernel-projected runtime binding at its native entry and routes block reads plus
filesystem operations through the unified isolated dispatcher. End-to-end
installed supervisor launch and active execution remain next.

Patent review: `NOT_TRIGGERED` — correcting dependency status from current
source, focused tests, and a service-image build introduces no mechanism. See
`docs/patents/REVIEW_LOG.md`.

The build frontend and filesystem contract now **PARTIALLY IMPLEMENT** the
mount/root bootstrap representation. Schema version 2 supports bounded named
multi-field responses, and filesystem generation 2 returns mount lifecycle
identity and root-object identity separately. Version-1 generation remains
byte-identical; neither response field transfers or grants a capability. Provider
mount state and capability-authorized open remain next.

The FAT32 and Zstd isolated-service syscall adapters now apply the same receive-
result bound as AHCI: kernel-reported payload and capability counts cannot
exceed the exact buffers supplied to the trap. Focused Linux suites pass 34
FAT32 and 27 Zstd tests, including hostile over-count rejection. This reuses the
existing service ABI and authority model; it does not expand either provider's
capabilities or maturity claim.

Zstd cleanup now records the transferred shared-buffer leaf only after exact
one-capability envelope admission and structural token validation. Missing,
malformed, or undeclared token bytes cannot invoke release; protocol, scratch,
and backend failures after admission still release the leaf. Its 27 focused
Linux tests and release build pass.

Patent review: `NOT_TRIGGERED` — binding cleanup to an already validated
capability envelope is conventional fail-closed resource handling. See
`docs/patents/REVIEW_LOG.md`.

The NVMe and optional IDE block-provider adapters now enforce that same bound.
Their focused Linux suites pass 68 and 28 tests respectively, including hostile
payload and capability over-counts. All five currently concrete isolated
storage/compression syscall adapters therefore reject a kernel receive result
that exceeds the buffers supplied to the trap.

NVMe enumeration cleanup now records the transferred leaf only after exact
one-capability envelope admission and structural token validation. Missing,
malformed, or undeclared token bytes cannot invoke release, while failures after
admission still release before returning. Its 68 focused Linux tests and release
build pass; this adds no hardware evidence.

The optional IDE enumeration loop applies the same admission-gated cleanup:
only an exact declared, structurally valid transferred leaf can reach release.
Its 28 focused Linux tests and release build pass, including zero-release
rejection of missing, malformed, and undeclared token bytes. This is modeled
source evidence, not legacy-controller or physical-device verification.

Patent review: `NOT_TRIGGERED` — binding cleanup to an already validated
capability envelope is conventional fail-closed resource handling. See
`docs/patents/REVIEW_LOG.md`.

Recovery discovery now has a capability-backed service source. The bounded
`enumerate_serviced_recovery_devices` scan accepts only explicit live block
sessions, repeats principal and `READ` authorization, reads and validates block
zero, and emits non-authorizing candidates for the existing exact unique-volume
join. The hosted WHP/KVM path consumes this scan rather than a fabricated
candidate. Configuration passes 48 tests on Windows and Arch Linux, WHP passes
11, and KVM passes 12. This is **PARTIALLY IMPLEMENTED** platform-neutral service
enumeration; native AHCI/VirtIO discovery and installed early boot remain the
next hardware/boot connection.

Platform descriptor registration is now atomic before that scan.
`BlockService::register_devices_atomic` preflights the entire bounded set for
capacity and both internal/existing identity collisions, publishing none on any
failure. It grants no session or operation right. The hosted positive path uses
registration, an explicit read-only principal grant, serviced enumeration, and
the unchanged Total recovery owner in order. Storage passes 122 tests on Windows
and Arch Linux; configuration remains 48, WHP 11, and KVM 12. Native driver
enumeration and firmware/installed transfer remain **PLANNED**.

The subsequent initial session grants are now atomic too.
`grant_sessions_atomic` validates the complete bounded set of explicit
device/principal/rights decisions and session capacity before publishing any
handle. Unknown devices, invalid rights, or late capacity failure leave no
partial authority. The hosted recovery source uses this operation before its
serviced scan. Storage passes 123 tests on Windows and Arch Linux;
configuration remains 48, WHP 11, and KVM 12.

The next installed-recovery identity gate is now **PARTIALLY IMPLEMENTED**.
Platform registration binds each service-local block descriptor to an opaque
stable identity, transport, and exact controller/media generations without
granting authority. Serviced recovery refuses legacy registration before block
I/O, retains the exact platform identity through selection and Total admission,
and rejects media-generation substitution. Old sessions are revoked before a
replacement generation can register. Storage passes 124 tests on Windows and
Arch Linux; configuration remains 48, WHP 11, and KVM 12. Native firmware/driver
identity derivation and installed early-boot transfer remain the next gate.

The first half of native firmware identity derivation is now **PARTIALLY
IMPLEMENTED**. The shared UEFI library defines ABI-checked Block I/O protocol
and media layouts, validates a bounded media snapshot and canonical
single-instance device path, and derives a domain-separated boot-scoped stable
identity with an injective nonzero generation for every firmware `MediaId`.
The loaded-image source now opens both protocols on the exact firmware device
handle, copies bounded state, closes both relationships, and rejects partial
open or uncertain close. Windows and Arch Linux each pass 30 focused tests and
cross-build the UEFI target. Calling this source from the real loader and
transferring installed early-boot ownership remain next; no OVMF or physical
firmware was exercised.

The compatible-geometry recovery reader is now **PARTIALLY IMPLEMENTED**. A
4096-aligned buffer and checked LBA mapping read one MRML 4 KiB block through
512/1024/2048/4096-byte UEFI media while exact pre/post media snapshots prevent
replacement. Failure erases the complete output. Windows and Arch Linux each
pass 31 focused tests and cross-build the UEFI target. Bounded handle
enumeration, expected-volume selection, real-loader composition, and installed
ownership transfer remain next.

Bounded Block I/O handle enumeration is now **PARTIALLY IMPLEMENTED**. The UEFI
library copies at most a caller-fixed capacity from firmware, rejects nulls and
duplicates, and requires release of every returned allocation on success or
failure. Firmware order and handle values never become device identity. Windows
and Arch Linux each pass 32 focused tests and cross-build the UEFI target.
Opening/scanning each handle and selecting exactly one expected installed volume
remain the next gate.

The per-handle recovery-header probe is now **PARTIALLY IMPLEMENTED**. One
transaction opens both exact protocols, derives stable path/media identity,
reads native block zero through converted firmware geometry, exact-matches the
canonical header, erases scratch, and closes both before returning. Windows and
Arch Linux each pass 33 focused tests and cross-build the UEFI target. Scanning
the complete enumerated set for exactly one expected volume is the next gate.

Set-wide expected-volume selection is now **PARTIALLY IMPLEMENTED** and
order-independent. Duplicate stable identity, candidate substitution, missing
or ambiguous expected volume, and any uncertain probe fail closed. Windows and
Arch Linux each pass 34 focused tests and cross-build the UEFI target. Exact
reopening for redundant-root recovery and real-loader ownership transfer are
the next gate.

The exact-generation read-only UEFI `StorageBlockDevice` adapter is now
**PARTIALLY IMPLEMENTED**. It reuses native storage interfaces, publishes no
partial multi-block read, denies mutation, and cannot outlive its reopened
protocol session. Windows and Arch Linux each pass 36 focused tests and
cross-build the UEFI target. Composing `BlockVolume` and reachable-graph
recovery inside that session is the next gate.

The shared reachable-graph validator now executes through the exact selected
UEFI storage session. The selected protocols stay open across redundant-root
reads and the complete bounded metadata traversal; all scratch is erased, and
close uncertainty discards success. Windows and Arch Linux each pass 37 focused
tests and cross-build the UEFI target. This is **PARTIALLY IMPLEMENTED** mocked-
firmware integration evidence. Invoking it from the real loader and transferring
the resulting exact installed-recovery owner into early boot are the next gate.

The real loader now invokes installed recovery before `ExitBootServices` when
the authenticated journal names a volume/root. It scans at most 32 handles,
requires one exact volume, traverses the graph under explicit boot bounds, and
exact-matches the recovered root generation to the journal. A missing,
ambiguous, changed, oversized, or invalid graph fails boot. The UEFI target
cross-builds on Windows and Arch Linux. This is **PARTIALLY IMPLEMENTED** compile evidence;
OVMF/physical execution and typed installed-device identity transfer for native
kernel reacquisition remain the next gate.

The loader/kernel boundary now has a canonical 104-byte non-authorizing
installed-recovery identity. It excludes ephemeral firmware handles and local
device/session/capability values while retaining exact source, stable identity,
controller/media generations, geometry, volume, and selected root. The loader
constructs and retains it across `ExitBootServices`; Windows kernel tests pass
561, UEFI tests pass 37, and the UEFI target cross-builds. `BootHandoff`
integration is still **PLANNED** because the shared handoff source has unrelated
concurrent edits; native driver correlation and reacquisition remain later gates.

The installed identity is now encoded and decoded inside canonical
`BootHandoff`. Its distinct flag and exact length place the 104-byte record
before SMP/MADT data, and decoding requires its volume/root generation to match
the authenticated recovery metadata in the same handoff. The loader uses this
path; Windows kernel tests pass 561, UEFI tests pass 37, and the UEFI target
cross-builds. This is **PARTIALLY IMPLEMENTED** codec/compile evidence. Exact
native-driver correlation, live-session reacquisition, and physical execution
remain the next storage-backed Total-admission gates.

The first service-side reacquisition gate is now **PARTIALLY IMPLEMENTED**.
`BlockService::grant_installed_recovery_read_session` treats the handoff record
as non-authorizing input, requires exactly one live registration matching its
source, stable identifier, controller/media generations, and geometry, and only
then creates a principal-bound read-only session. Focused substitution tests
fail before session publication; successful sessions cannot write. Storage
passes 125 tests on Windows and Arch Linux. Native AHCI/USB/VirtIO enumeration,
transport-specific correlation evidence, configuration recovery composition,
WHP/KVM integration, and physical execution remain next gates.

Configuration recovery now **PARTIALLY IMPLEMENTS** the next composition. It
consumes the newly reacquired read session, reads block zero only through that
session, validates the canonical volume header, and binds the handoff-selected
redundant root rather than silently choosing a default. Any header, volume,
geometry, or root mismatch revokes the fresh session before returning; a
focused test proves the single session slot can then be safely reacquired.
Configuration passes 49 tests on Windows and Arch Linux; WHP runner parity
passes 11 and KVM runner parity passes 12. WHP/KVM backend suites pass 24/25 and
21/22 respectively, with only their existing manual live-mapping performance
tests ignored. Native transport enumeration/correlation and complete recovered
graph-to-Total-owner integration remain next.

The controlled hosted graph-to-Total owner path now **PARTIALLY IMPLEMENTS**
that integration. Recovery-only handoffs can canonically carry the installed
identity without fabricating service/SMP payloads. Both runners include that
identity; the hosted source refuses its absence, reacquires the exact registered
device/session, validates block zero and the handed root, traverses the complete
reachable graph, and retains the resulting installed selection through
`RecoveredInstalledTotalAdmission`. Kernel passes 561 and configuration 49
tests on Windows and Arch Linux; WHP/KVM runner parity passes 11/12. This remains
synthetic hosted evidence. Native driver enumeration/correlation, durable
storage, installed kernel orchestration, and physical execution remain next.

The shared firmware-to-native correlation boundary is now **PARTIALLY
IMPLEMENTED**. A trusted native driver verifier must prove one exact relation
between the handed installed identity and an independently discovered AHCI,
USB, or VirtIO descriptor before atomic registration retains that correlation.
Hosted sources/transports, geometry mismatch, verifier failure, duplicate
identity, and capacity failure publish nothing. Correlation remains
non-authorizing; the later exact handoff reacquisition creates only a read
session. Storage's first AHCI discovery boundary now validates a generation-
bound exact PCI class tuple and conventional ABAR geometry without granting
mapping or I/O authority; its Windows suite passes 135 tests. Live PCI
enumeration, ABAR mapping, AHCI commands/DMA/interrupts, USB mass-storage,
native VirtIO, Arch Linux parity for this increment, and hardware evidence
remain **PLANNED**. WHP/KVM runner regression parity remains 11/12.

The next storage dependency gate is now **PARTIALLY IMPLEMENTED** as a typed
ABAR request plus a capability-checked preactivation-only page-table owner.
`KernelAhciAbarPreactivationOwner` requires the live mapping/control handles and
structurally valid descriptor whose configuration generation and ABAR geometry
match the retained launch, then matches the launch-bound task, generational
construction-pending state, borrowed `TaskRuntime`, saved CR3 root,
service-domain target, and ABAR before installing exact user RW/NX device
leaves through a private backend. Wrong authority, generation/geometry,
runtime, root, or target fails before publication; explicit rollback returns the
prepared task only after exact withdrawal, while uncertainty retains the owner
and poisons the hierarchy. PCI location/vendor/device fields remain caller-bound
data because the launch record does not retain them. The owner does not
implement the generic mapping traits or create the existing mapped-task token.
Storage passes 143 tests on Linux; the kernel suite passes 709. This remains
controlled in-memory evidence, not an activation-sealed or active-root mapper.
Root uniqueness, descriptor-identity/device-object correlation, full-lifetime
PAT3=UC, and cacheable-alias exclusion remain unsafe caller assumptions. A
later non-copy activation owner must combine this concrete inactive ABAR
hierarchy with the four concrete CPU mappings, consume and revalidate the exact
effective leaves, turn poison into permanent task quarantine, and retain
authority through quiescence, teardown, and SMP translation withdrawal. IOMMU
binding, installed CPL3 entry, live KVM/WHP, and hardware evidence remain
absent.

The following native-storage dependency gate is now **PARTIALLY IMPLEMENTED**
as bounded global AHCI register initialization. An unsafe native adapter is
constructible only for one exact aligned mapped ABAR and limits volatile 32-bit
access to that range. The controller transaction keeps interrupts disabled,
requests the standard HBA reset, applies a fixed poll limit, verifies AHCI mode,
and validates version, port count, command-slot count, implemented ports, and
the NCQ capability bit before publishing a generation-bound snapshot. Storage
passes 143 host-modeled tests on Windows and Arch Linux for this global-register
boundary.

The read-only port/signature gate is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`discover_ahci_ports` exact-matches the retained mapping and controller
generations, requires stable global controller observations before and after the
scan, reads only implemented ports, compares two complete fixed-capacity port
observations, and publishes nothing when register access, link state, interrupt
state, command/FIS engines, or outstanding commands are uncertain. SATA,
ATAPI, enclosure-management, and port-multiplier signatures are classified;
stable unknown signatures remain descriptive and are not installed-recovery
candidates. The focused Windows gnullvm storage suite passes 156 tests,
including thirteen hostile-model tests for this boundary. Linux execution was
not available in this workspace, so no Linux pass count is claimed for this
increment. Command-list/FIS/table allocation, DMA/IOMMU
composition, interrupts, ATA/ATAPI command execution, NCQ operation, native PCI
enumeration, and physical evidence remain **PLANNED**.

The next AHCI DMA ownership gate is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`prepare_ahci_port_dma` accepts only an exact quiescent discovered SATA port,
`CONTROL` over its controller object, and distinct `PIN | MAP | READ | WRITE`
capabilities for fixed-size command-list, received-FIS, and per-slot command-
table memory objects. Every allocation and DMA generation must be nonzero;
physical ranges must have exact sizes, alignment, checked ends, distinct object
identity, and no overlap. Only one complete layout reaches the atomic backend,
whose contract requires pinned zeroed memory and no partial mapping on failure.
Successful installation now returns a linear `InstalledAhciPortDma` owner.
Revocation consumes that owner only after the backend confirms exact layout
removal and all required device/IOMMU invalidation; uncertainty returns the
same owner for exact retry, and completed removal cannot be repeated. Storage
passes 163 tests on Windows and Arch Linux. This is host-modeled policy,
layout, and lifecycle evidence only. No IOMMU backend, register programming,
engine start, interrupt, ATA/ATAPI command, NCQ operation, native PCI
enumeration, or physical hardware was exercised.

The port-base programming gate is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`program_ahci_port_dma_bases` consumes the installed DMA owner only after exact
controller/mapping-generation equality and a quiescent port preflight. It writes
and re-reads the complete 64-bit command-list and received-FIS bases while
leaving interrupts and both engines disabled. A failure before the first write
returns the untouched owner; any write or read-back uncertainty instead creates
a quarantined typestate that cannot enter ordinary DMA removal. Storage passes
166 tests on Windows and Arch Linux.
Command headers/tables, engine start, interrupts, ATA/ATAPI, NCQ, IOMMU hardware,
and physical execution remain **PLANNED**.

Command-memory initialization is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`initialize_ahci_command_memory` consumes only the programmed-port typestate,
verifies every word of the exact command-list, received-FIS, and advertised
command-table extents is zero, then binds each advertised header slot to its
own fixed table address and read-verifies every 64-bit value. Dirty or unreadable
memory before mutation returns the untouched owner; write or read-back
uncertainty quarantines it. Storage passes 169 tests on Windows and Arch Linux.
Engine activation,
PRDT/data buffers, ATA/ATAPI commands, interrupts, NCQ, real IOMMU behavior, and
physical evidence remain **PLANNED**.

Bounded AHCI engine stop is now **PARTIALLY IMPLEMENTED IN SOURCE**. The active
typestate clears command processing, waits a fixed maximum for command-list
quiescence, clears FIS receive, then waits for receive quiescence. Every write is
read-verified; any mismatch, timeout, or access uncertainty quarantines the DMA
layout. Storage passes 174 tests on Windows and Arch Linux. Base clearing, memory sanitization,
reclamation, and command/data paths remain **PLANNED**.

Stopped-port DMA reclamation is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`reclaim_stopped_ahci_port_dma` rechecks exact ABAR generations and quiescence,
clears and read-verifies command-list and received-FIS base registers, then
zeroes and verifies every word of only the retained DMA extents. It restores the
revocable installed owner only after the complete transition; all uncertainty
remains quarantined. The extracted provider now builds and read-verifies one
capability-direction-checked non-NCQ DMA EXT command in an idle slot, including
bounded 48-bit LBA, exact byte count, FIS, header, and one contiguous PRDT entry,
without setting `CI`. The AHCI package passes 50 tests on Windows and Arch Linux.
The next bounded layer issues that prepared slot through `PxCI`, polls with a
fixed limit, rejects unrelated command activity and device error state, checks
the exact transferred-byte count, and restores the active owner only on verified
completion. The focused AHCI package passes 58 tests on Windows and Arch Linux.
Interrupt handling, data-content verification, and native hardware execution
remain planned.

The canonical read/write adapter is now **PARTIALLY IMPLEMENTED IN SOURCE**.
It exact-matches the generational provider session and media-bearing catalog
record, validates block geometry/capacity and exact borrowed-memory length, and
rejects read-only writes before invoking a replaceable AHCI mechanism backend.
AHCI passes 60 tests on Windows and Arch Linux. Production DMA-buffer binding
and service-loop dispatch remain planned.

Verified completed-slot recycling is now **PARTIALLY IMPLEMENTED IN SOURCE**.
The exact completed command table and mutable header fields are cleared and
read-verified before the active port and data extent can be reused; all cleanup
uncertainty quarantines both. AHCI passes 62 tests on Windows and Arch Linux.

The single-port command backend is now **PARTIALLY IMPLEMENTED IN SOURCE**. It
keeps read-target and write-source DMA authority separate, exact-matches session
and media generations, and composes synchronization, prepare, execute, recycle,
copy-back, and sanitization as one fail-closed reusable transaction. AHCI passes
64 tests on Windows and Arch Linux. Native cache/IOMMU implementations and
service dispatch remain planned.

Isolated read/write dispatch is now **PARTIALLY IMPLEMENTED IN SOURCE** with one
exact transferred shared-memory capability, direction-correct bounded copying,
release-before-reply, and unconditional local-buffer wiping. AHCI passes 66
tests on Windows and Arch Linux. Raw syscall adaptation and flush/reset control
dispatch remain planned.

AHCI flush/reset adaptation and zero-capability isolated dispatch are now
**PARTIALLY IMPLEMENTED IN SOURCE**. Exact session and operation flags gate the
backend; nonzero receipts are mandatory; every transferred capability causes
rejection without reply. AHCI passes 69 tests on Windows and Arch Linux.
Concrete ATA flush/reset mechanism and raw syscall wiring remain planned.

ATA `FLUSH CACHE EXT` durability is now **PARTIALLY IMPLEMENTED IN SOURCE** as
a verified no-data command with bounded polling, error checks, exact slot
restoration, fail-closed ownership, and monotonic nonzero durability serials.
AHCI passes 71 tests on Windows and Arch Linux. Device reset and raw syscall
wiring remain planned.

Fail-closed SATA COMRESET is now **PARTIALLY IMPLEMENTED IN SOURCE** with exact
mapping generations, ordered engine stop/restart, an explicit minimum-delay
contract, bounded link/signature recovery, error clearing, DMA-memory checks,
and a checked successor media generation that stales old catalog state. AHCI
passes 73 tests on Windows and Arch Linux; physical reset is unverified.

The isolated AHCI userspace adapter now **PARTIALLY IMPLEMENTS IN SOURCE** the
raw kernel ABI for enumeration, read/write, flush, and reset through the same
launch-bound reply endpoint. Data requests use only the exact transferred
shared-memory capability, preserve read/write direction, and release it before
reply; control requests accept no capability. The adapter also rejects kernel-
reported payload or capability counts beyond the exact supplied buffers before
returning a typed envelope. Cleanup records a received data capability only
after the envelope declares exactly one capability and its token carries a
nonzero generation; malformed or undeclared token bytes therefore cannot cause
a revocation attempt. Focused Linux tests cover all seven syscall mappings,
hostile returned counts, and rejected cleanup metadata, bringing AHCI to 76
passing tests. Installed service entry and supervisor launch remain planned.

The AHCI provider now has one allocation-free generation-1 dispatch service for
its launch-bound endpoint. It receives once into the maximum canonical request,
routes only exact enumerate, data, or control payload sizes, and reuses the
existing operation loops so capability shape, release-before-reply, buffer
erasure, and protocol decoding do not diverge. Read/write and flush/reset borrow
one retained backend owner per call; the router creates no second device owner.
Unknown sizes and capability over-counts reach no operation, release, or reply.
The raw userspace adapter now implements that unified receive surface directly,
using the maximum canonical buffer and the existing launch-bound shared-memory,
release, and reply mappings. All 79 focused Linux tests and the release build
pass. A concrete installed entry and supervisor launch remain next.

Patent review: `NOT_TRIGGERED` — routing existing canonical operations by exact
bounded message shape through their existing adapters is conventional service
dispatch. See `docs/patents/REVIEW_LOG.md`.

The first installed-entry command-memory prerequisite is now **PARTIALLY
IMPLEMENTED IN SOURCE**. A safe mapped-memory adapter binds the exact retained
command-list, received-FIS, and command-table descriptors to three caller-owned
CPU mappings. Construction rejects malformed generations, geometry, lengths,
object aliasing, and physical overlap; every little-endian word access separately
rejects descriptor substitution, misalignment, overflow, and out-of-range bytes.
The production command-memory initializer runs through this adapter and programs
only the exact per-slot table bases. All 83 focused Linux tests and the release
build pass. Allocation, pinning, cache synchronization, IOMMU installation,
mapping construction/revocation, the installed entry, and supervisor launch
remain separate unverified gates.

Patent review: `NOT_TRIGGERED` — exact descriptor-to-slice bounds checking for
already-mapped command memory is conventional memory-safety plumbing and adds no
new storage or device algorithm. See `docs/patents/REVIEW_LOG.md`.

The matching data-DMA prerequisite is now **PARTIALLY IMPLEMENTED IN SOURCE**.
One safe adapter binds an exact, at-most-1-MiB mapped DMA extent and admits only
same-object, same-allocation, same-base bounded prefixes. Its explicit state
machine separates device-write reads from device-read writes, requires distinct
platform prepare/complete visibility callbacks, and will not become reusable
until the exact active bytes are zeroed and their sanitized visibility is
confirmed. Descriptor substitution, length mismatch, operation reordering, and
cache-synchronization uncertainty fail closed; uncertain state remains
unavailable but retains an exact cleanup retry. All 86 focused Linux tests and
the release build pass. A concrete platform cache backend, IOMMU lifecycle,
mapping construction, installed entry, and supervisor launch remain unverified.

Patent review: `NOT_TRIGGERED` — directional cache-visibility callbacks and a
bounded DMA-buffer state machine are conventional driver safety plumbing and
introduce no new storage algorithm. See `docs/patents/REVIEW_LOG.md`.

The kernel-side native device-service launch prerequisite is now **PARTIALLY
IMPLEMENTED IN SOURCE** without creating an AHCI-specific authority model. A
fixed-capacity attachment exact-authorizes one read-only launch record plus one
to six separately delegable source handles, atomically projects only their
requested non-delegable rights into a pristine native-service task, and installs
those fresh local handles in the six remaining fixed entry registers. Wrong
objects, overbroad source handles, duplicate handles, target `DELEGATE`, occupied
registers, projection failure, and capacity outside 1–6 fail closed; entry
failure revokes every projected leaf, and later source-root revocation reaches
each descendant independently. The Linux kernel suite passes all 685 tests.
AHCI-specific launch-data encoding, exact six-authority role binding, mapping
construction, service binary entry, supervised teardown, and active execution
remain separate gates.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — bounded attenuation through the existing atomic
capability-projection graph and fixed native entry registers is conventional
least-authority service construction. See `docs/patents/REVIEW_LOG.md`.

The generic native device-service task now has a typed voluntary-retirement
operation **IMPLEMENTED IN SOURCE** for use after device-specific quiescence.
The task retains its construction-time page-table root; retirement requires it
to be the exact current generational task and revalidates that root before the
runtime removes the complete task-local revocation domain. Wrong-current and
root-substitution attempts leave the task runnable and unchanged. Exact success
returns the scheduler termination plus the retired context for subsequent
dispatch and resource cleanup. The Linux kernel suite passes all 686 tests and
the release build passes. Binding an AHCI quiescence result to this generic
retirement, dispatching the selected successor, concrete mapping invalidation,
and installed native execution remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — exact current-task/root validation followed by
ordinary task-domain retirement is conventional lifecycle enforcement. See
`docs/patents/REVIEW_LOG.md`.

AHCI now **PARTIALLY IMPLEMENTS IN SOURCE** the typed role binding above that
provider-neutral attachment. Exactly six roles are required in fixed order:
device `CONTROL`; independent command-list, received-FIS, and command-table
`MAP|READ|WRITE`; data device-write `PIN|MAP|WRITE`; and data device-read
`PIN|MAP|READ`. The binder exact-matches those objects to one validated ABAR,
port layout, data extent, and generation-bound 512-byte block catalog record. It
rejects generation/geometry mismatch, unknown device flags, swapped or widened
roles, memory-object aliasing, and every command/data/MMIO physical overlap.
The Linux AHCI suite passes all 89 tests and the kernel suite all 685. This is a
typed pre-encoding boundary only: canonical hostile launch bytes, CPU virtual
mapping records for DMA memory, active-port reconstruction, the service binary,
supervised teardown, and execution remain unimplemented.

Patent review: `NOT_TRIGGERED` — exact role/object/right matching and physical
range disjointness checks are conventional least-authority driver launch
validation. See `docs/patents/REVIEW_LOG.md`.

The AHCI launch-data boundary is now **PARTIALLY IMPLEMENTED IN SOURCE** as one
canonical 384-byte little-endian record. It carries exact system, provider,
attachment, device, ABAR, port-layout, data-region, and four CPU-mapping
generations and ranges, but no capability tokens; authority remains in the six
separately projected handles above. Decode rejects bad magic, version, length,
reserved bytes, embedded handle-like values, malformed geometry, noncanonical
or unaligned virtual ranges, overlap with the ABAR mapping, and overlap among
the four CPU mappings. Binding then exact-matches the three launch generations
and reuses the typed six-role validation. The focused Linux AHCI suite passes
all 92 tests. Copying the record from installed launch memory, constructing the
CPU mappings, active-port reconstruction, service binary entry, cache and IOMMU
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

Patent review: `NOT_TRIGGERED` — a fixed-layout endian codec plus bounded range,
generation, reserved-field, and overlap validation is conventional hostile-input
parsing and introduces no new storage algorithm. See
`docs/patents/REVIEW_LOG.md`.

AHCI service-side launch consumption is now **PARTIALLY IMPLEMENTED IN SOURCE**.
The userspace syscall adapter copies exactly the bounded launch record through
the kernel-installed read-only capability, and the installed-projection binder
decodes it, exact-matches the provider generation register, rejects invalid or
aliased capability tokens, and preserves the kernel's fixed six-role register
order through typed accessors. The copied bytes still cannot create or select
authority. The focused Linux AHCI suite passes all 95 tests. The native entry
stub, register capture, launch-buffer wiping at entry, capability-backed mapping
construction, active-port reconstruction, cache/IOMMU backends, supervised
teardown, active execution, and physical-device evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — copying a bounded read-only launch record and
validating fixed-order installed capability tokens is conventional service-entry
plumbing. See `docs/patents/REVIEW_LOG.md`.

The AHCI native bootstrap boundary is now **PARTIALLY IMPLEMENTED IN SOURCE** as
a single fail-closed operation over the installed projection. It rejects an
invalid launch token, zero provider generation, or alias between launch data and
any authority before a syscall; otherwise it performs exactly one canonical
copy, binds the decoded record and six ordered capabilities, and zeroes the
384-byte scratch buffer on success and every copy/decode/binding failure. The
focused Linux AHCI suite passes all 97 tests. Assembly register capture, a native
binary artifact, capability-backed CPU mapping construction, active-port
reconstruction, cache/IOMMU backends, supervised teardown, active execution,
and physical-device evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — one bounded capability copy followed by
validation and unconditional scratch erasure is conventional fail-closed
service bootstrap plumbing. See `docs/patents/REVIEW_LOG.md`.

The complete twelve-register native AHCI entry ABI is now **PARTIALLY
IMPLEMENTED IN SOURCE** as one typed installed-register capture. It exact-checks
the service endpoint, supervisor task, provider generation, 384-byte launch
length, service module, launch token, and six fixed-order authority tokens;
invalid tokens (including zero-generation endpoint or task tokens),
launch/authority aliasing, and authority duplication fail before launch-data
copying. Equal numeric bits across those distinct namespaces remain valid. Only
that validated binding can enter the bootstrap operation. The focused Linux
AHCI suite passes all 99 tests. The assembly entry stub and binary artifact
remain unimplemented, as do capability-backed CPU mapping construction,
active-port reconstruction, cache/IOMMU backends, supervised teardown, active
execution, and physical-device evidence.

Patent review: `NOT_TRIGGERED` — fixed register-to-field validation and
same-namespace non-aliasing checks are conventional native service ABI binding.
See `docs/patents/REVIEW_LOG.md`.

Pre-launch AHCI CPU mapping construction is now **PARTIALLY IMPLEMENTED IN
SOURCE** as a backend-neutral four-mapping transaction. The launcher must hold
four exact, separate `MAP|READ|WRITE|INSPECT` capabilities for command-list,
received-FIS, command-table, and data memory; these mapping authorities are not
projected as runtime roles. Every authority/object pair is preflighted before a
backend call. The transaction installs page-rounded RW/NX mappings in canonical
record order, removes them in reverse order, cleanly rolls back partial install,
and returns the exact retained mapping set when withdrawal is uncertain so
cleanup can resume without guessing. The focused Linux AHCI suite passes all
102 tests. A concrete kernel memory-resource/page-table adapter, target address-
space binding, ABAR lifecycle coupling, native entry binary, supervision, active
execution, and physical-device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — capability-preflighted fixed-order mapping with
reverse rollback and explicit retained cleanup state is conventional resource
transaction handling. See `docs/patents/REVIEW_LOG.md`.

That transaction now has a concrete kernel memory-resource adapter
**IMPLEMENTED IN SOURCE**. Construction exact-matches every public memory object
and allocation generation to a typed `MemoryObjectId`, requires exact physical
backing equal to the record's page-rounded range, and separately exact-matches
one `MAP|CONTROL` target address-space capability. Installation and withdrawal
then use `MemoryPoolTable` and retain each returned generational
`MemoryMappingId` until the existing backend confirms removal. A focused
integration test exercises four physically backed objects through complete
installation and retirement and rejects allocation-generation substitution; the
Linux AHCI suite passes all 103 tests. This is policy/simulated-backend evidence,
not active x86 page-table, cache, IOMMU, bare-metal, or physical-device evidence.
The concrete inactive-page-table wiring, ABAR lifecycle coupling, native binary,
and supervision remain unimplemented.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — adapting exact typed memory objects and target
capabilities to the existing memory-resource mapping lifecycle is conventional
kernel resource plumbing. See `docs/patents/REVIEW_LOG.md`.

ABAR MMIO mapping now has an owned teardown lifecycle **IMPLEMENTED IN SOURCE**.
Installation still requires the exact device `MAP|READ|WRITE` capability and
produces an `InstalledAhciAbarMapping`; withdrawal independently requires exact
device `CONTROL`, exact-matches the object before the backend, and consumes the
owner only after backend-confirmed unmap and translation-cache invalidation.
Wrong-object control reaches no backend, while uncertain unmap returns the exact
installed mapping for bounded retry. The Linux AHCI suite passes all 105 tests.
Combined ABAR/CPU-mapping rollback, active-port quiescence ordering, concrete
page-table/IOMMU invalidation, supervisor task teardown, the native binary, and
physical-device evidence remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — separately authorized exact MMIO installation
and retryable withdrawal are conventional device-mapping lifecycle controls. See
`docs/patents/REVIEW_LOG.md`.

ABAR and CPU mappings now form one combined launch-owned lifecycle **IMPLEMENTED
IN SOURCE**. Construction exact-matches the discovered ABAR generation and range
to the canonical launch record, installs ABAR before the four CPU mappings, and
rolls ABAR back after any clean CPU-side failure. If CPU rollback is uncertain,
both the exact retained CPU set and ABAR owner remain together. Teardown always
withdraws CPU mappings in reverse order before ABAR; CPU or ABAR uncertainty
returns one resumable combined state and never reports completion early. The
Linux AHCI suite passes all 108 tests. Active-port quiescence must still precede
this mapping teardown; concrete page-table/IOMMU invalidation, task termination
integration, the native binary, active execution, and physical-device evidence
remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — dependency-ordered construction, reverse
rollback, and resumable combined cleanup are conventional resource transaction
controls. See `docs/patents/REVIEW_LOG.md`.

Live AHCI device quiescence is now ordered before mapping withdrawal and bound
to the command backend's exact owned state **IMPLEMENTED IN SOURCE**. A healthy
backend can yield only one non-copyable teardown owner containing its active
port, ABAR mapping, data-DMA region, register adapter, command-memory adapter,
and data adapter. Teardown stops and verifies the port engine, clears and
read-verifies the command-list/FIS bases, zeroes and verifies command memory,
sanitizes the data range, and revokes the exact DMA layout before producing the
typed state that permits CPU/ABAR mapping removal. Data or DMA uncertainty
retains the exact owner and all adapters for retry. A fail-stopped backend that
has already lost active-port ownership yields a distinct quarantine owner and
cannot enter ordinary quiescence. The focused Linux AHCI suite passes all 109
tests and its release build passes. Concrete cache maintenance, page-table and
IOMMU invalidation, wiring this owner into supervisor task termination, the
native service binary, active execution, and physical-device evidence remain
unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — exact-owner typestate and dependency-ordered
device/DMA/mapping cleanup are conventional resource-lifecycle controls. See
`docs/patents/REVIEW_LOG.md`.

AHCI quiescence and generic native-task retirement now form one exact
supervisor-owned transition **IMPLEMENTED IN SOURCE**. Binding requires the
task's launch attachment and provider generation, the retained ABAR mapping,
all four still-installed CPU mappings, and the data-DMA region to match one
bound AHCI launch generation. Mismatch returns the task, launch, adapters, and
quiesced mappings unchanged. Retirement then consumes only that composite
owner; a wrong-current failure returns it intact for retry, while exact success
retains the retired context together with the launch and quiesced resources.
The lifecycle test rejects a different attachment generation, retries after a
wrong-current attempt, retires the exact task, and only then withdraws CPU/ABAR
mappings. The focused Linux AHCI suite passes all 109 tests, the Linux kernel
suite passes all 686 tests, and both release builds pass. Successor-dispatch
consumption, concrete page-table/IOMMU invalidation, the native service binary,
active execution, and physical-device evidence remain unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — exact generational binding of already-owned
cleanup state to conventional task retirement is ordinary lifecycle
composition. See `docs/patents/REVIEW_LOG.md`.

Retired AHCI task cleanup now preserves the scheduler termination through
retryable mapping withdrawal and gates successor dispatch **IMPLEMENTED IN
SOURCE**. The composite retired owner removes all four CPU mappings in reverse
order and then ABAR; uncertainty reconstructs the exact retained mapping state,
launch binding, retired context, scheduler termination, and I/O adapters for
retry. No dispatch API accepts that state. Only confirmed complete mapping
withdrawal produces the distinct owner that can exact-match the pending
termination and mint the runtime's opaque successor dispatch. The lifecycle
test injects a CPU-unmap failure, proves scheduling remains blocked by the
pending retirement, retries cleanup, verifies every mapping absent, and then
issues the selected successor dispatch. The focused Linux AHCI suite remains at
109 passing tests and its release build passes; the Linux kernel suite remains
at 686 passing tests and its release build passes. Concrete page-table/IOMMU
invalidation, installing and completing the issued hardware dispatch, the
native service binary, active execution, and physical-device evidence remain
unverified.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — retaining a scheduler result across ordered
retryable unmapping and releasing dispatch only after completion is conventional
resource-lifecycle sequencing. See `docs/patents/REVIEW_LOG.md`.

The AHCI command path no longer depends on borrowing a kernel-owned
`CapabilitySpace` representation **IMPLEMENTED IN SOURCE**. Command construction
and backend admission instead require one narrow mutable exact-authorizer that
accepts only a capability plus the complete directional rights and returns its
resolved object or a capability error. The existing fixed-capacity capability
space implements the same interface for kernel/model use, while a recording
non-table authorizer test proves both `PIN|MAP|WRITE` and `PIN|MAP|READ` are
requested exactly and wrong-object resolution still prevents construction. The
focused Linux AHCI suite passes all 110 tests and the release build passes. A
raw userspace syscall implementation of this authorizer, native mapped-memory
construction, the service binary, and installed execution remain unverified.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — abstracting an existing exact capability check
behind a minimal interface is conventional dependency inversion. See
`docs/patents/REVIEW_LOG.md`.

The installed AHCI launch now constructs a concrete userspace data-capability
authorizer **IMPLEMENTED IN SOURCE**. It binds the copied launch record's exact
data object to only the two separately installed directional capabilities,
rejects an unknown token or wrong complete rights before kernel entry, and
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

Patent review: `NOT_TRIGGERED` — binding a conventional exact-authorization
syscall adapter to already validated launch roles is ordinary capability
plumbing. See `docs/patents/REVIEW_LOG.md`.

The AHCI userspace syscall boundary now has a zero-state x86-64 raw adapter
**IMPLEMENTED IN SOURCE**. Its sole unsafe operation transfers the canonical
`rax`, `rdi`, `rsi`, `rdx`, `r10`, `r8`, and `r9` frame through `int 0x80` and
writes every returned register back to the typed frame; it stores no ambient
task, capability, pointer, or service state. The Linux suite passes all 112
tests, including a layout-only zero-size check that deliberately does not invoke
the host's interrupt ABI. Both Linux release and `MRML_NATIVE` release builds
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

Patent review: `NOT_TRIGGERED` — a direct architecture-ABI register bridge for
an existing syscall mechanism is conventional low-level plumbing. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — converting already validated, disjoint native
mappings into exact bounded slices is conventional memory-adapter plumbing. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — stable double-sampling of conventional AHCI
status registers before reconstructing existing typestate is ordinary defensive
driver plumbing. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — exact construction of existing service and
backend objects from one validated launch projection is conventional typed
composition. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — lending an existing unique backend through one
bounded validated dispatch call is conventional service-loop composition. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — ordered fail-closed composition of existing
mapping, register-validation, capability, and backend constructors is
conventional service-startup plumbing. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — sequencing an existing authenticated bootstrap,
mandatory scratch erasure, and existing preparation transition is conventional
service-entry plumbing. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — exact descriptor validation and conventional
compiler acquire/release fences for an already proven coherent DMA mapping are
ordinary driver plumbing. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — centralizing an existing unsafe coherence
precondition while composing existing typed startup stages is conventional
boundary reduction. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — delayed construction of an exact decoded MMIO
view through a fail-closed one-shot factory is conventional initialization
ordering. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — composing existing MMIO and monotonic-delay
interfaces by exact delegation is conventional driver dependency plumbing. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — constructing an existing volatile MMIO adapter
from authenticated mapping data and pairing it with an existing timing contract
is conventional device-service initialization. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — adapting an existing checked invariant-TSC
delay primitive to an existing driver timing trait is conventional clock
plumbing. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — ordering authenticated launch decode before
construction of its exact capability authorizer is conventional least-authority
initialization. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — looping over the existing bounded authenticated
dispatcher until its first error is conventional service control flow. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — fixed aligned service working buffers and
explicit zeroization are conventional bounded runtime storage. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — a fixed register-to-language entry shim and
composition of existing launch, authorization, timing, and dispatch mechanisms
are conventional service integration. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — typed composition of an existing bound launch
with existing atomic task construction and rollback is conventional lifecycle
plumbing. See `docs/patents/REVIEW_LOG.md`.

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

A concrete preactivation ABAR owner is now **PARTIALLY IMPLEMENTED IN SOURCE**.
It checks both exact device handles and the descriptor's launch-bound ABAR
generation/geometry, then binds the prepared task's runtime generation, saved
CR3 root, service-domain target, and launch mapping to an exclusively owned
inactive x86 hierarchy. A separate non-copy mapping-set owner now composes that
backend with a kernel `MemoryPoolTable` adapter and installs/verifies the ABAR
plus all four launch-named CPU mappings in the same exact hierarchy. It retains
all mapping progress, verifies every leaf and resource record, and withdraws
CPU mappings in reverse order before ABAR. Tests cover authority,
ABAR generation/geometry, runtime/root/target and resource substitution,
exact install/verify/rollback, poison retention after mutation-before-error
rollback, exact-generation permanent construction quarantine, cross-runtime
quarantine denial, and PCI location/vendor/device substitution. Canonical AHCI
launch record V2 expands from 384 to 400 bytes and binds the exact PCI identity
alongside the existing configuration generation, ABAR geometry, and device
object. Both concrete owners now exact-match the supplied descriptor against
that retained launch evidence before mutation. The mapping-set owner retains the
runtime-bound task identity without borrowing the runtime, so a poisoned owner
can consume mutable access to that same runtime and permanently exclude its
exact blocked construction generation from activation while retaining every
mapping resource. It cannot produce the existing mapped-task token. The Linux
AHCI suite passes 147 tests and the Linux kernel suite passes 713. Native task
validation and the scheduler activation preparation now also reject a second
live task domain with the same saved page-table root; the mapping-set verifier
therefore fails before activation when another same-runtime generation collides
with its CR3. The mapping-set owner now has one consuming activation transition
that revalidates the ABAR and all four CPU leaves plus their retained resource
records immediately before transactional supervisor/scheduler publication.
Failure returns the unchanged concrete owner; success returns a non-copy active
owner retaining the exact service binding, task/root/target, inactive-builder
storage, and all five mapping records while exposing no inactive mutation or
rollback operation. A zero-capacity-supervisor test proves failure leaves the
task construction-pending and retryable before successful exact activation.
The concrete active owner can now consume an exact-current-task freeze while
retaining its service, root/target, and all mapping resources. A non-current
failure returns the unchanged active owner; success removes the task from
runnable load without performing MMIO, DMA, unmapping, or retirement. The
trusted launcher must still establish the initial PCI-identity/device-object
correlation; record bytes describe and bind that decision but do not authorize
it. Full-lifetime PAT3=UC and cacheable-alias proof, active freeze/quiescence and
mapping withdrawal, SMP TLB, IOMMU, installed CPL3, KVM/WHP, and physical
evidence remain absent.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: YES — canonical AHCI launch record V2
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — retaining task ownership while invoking the
existing exact mapping and rollback lifecycle, including conventional exact
x86-64 task/root/target page-table installation, is standard resource
composition. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — blocked construction followed by explicit
scheduler activation is conventional task lifecycle synchronization. See
`docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — projecting an existing endpoint capability and
installing an existing generational task identity are conventional
least-authority IPC plumbing. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — exercising existing capability-gated IPC,
inbox delivery, sequencing, and transitive revocation introduces no new
mechanism. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — composing the existing launch-bound adapter,
canonical syscall decoder, and capability-gated runtime delivery in a controlled
test introduces no new mechanism. See `docs/patents/REVIEW_LOG.md`.

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

Patent review: `NOT_TRIGGERED` — preserving existing endpoint and task token
namespaces in Rust types, carrying their validated provenance in an opaque
binding, and documenting non-authorizing identity reconstruction are
conventional type-safety hardening. See `docs/patents/REVIEW_LOG.md`.

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

The focused Linux AHCI suite passes all 138 tests. Coverage includes equal task
tokens from different runtimes, pre-freeze current-task and supervisor denial
without reacquisition, retry after lease-reacquisition failure, substituted
state quarantine, frozen mutation denial, quiescence retry, and the existing
retirement/unmap/cleanup/dispatch chain. This is typed API, controlled backend,
and unit-test evidence only. The repository has no production
controller-manager lease implementation or installed operation-3 routing, and
no installed CPL3/`INT 0x80`, active page-table/TLB/IOMMU, KVM/WHP, or physical
AHCI execution was exercised.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — binding an existing manager owner to the
existing supervisor/runtime freeze and typed AHCI teardown, retrying failed
owner transfer, quarantining substitution, and destroying borrowed views before
existing retirement and mapping withdrawal are conventional fail-closed
lifecycle composition. This adds no AHCI command, DMA, interrupt, parser,
authority-model, or hardware-execution mechanism; the existing triggered review
for actual native AHCI controller/DMA behavior is unchanged. See
`docs/patents/REVIEW_LOG.md`.

Mapped AHCI activation through delayed dispatch now forms one consuming
supervisor/runtime-bound lifecycle **IMPLEMENTED IN SOURCE**.
`activate_mapped_ahci_service_task` derives the lifecycle object from its
non-copy mapped launch owner, validates the retained native task against the
exact runtime, and publishes `Running` as one preflight/commit transition before
waking the constructed task. Runtime-backed ordinary registration rejects
construction-pending tasks; the supervisor distinguishes equal `TaskId` tokens
from distinct runtimes while rejecting duplicates within one runtime.

Retirement first freezes the exact current constructed task without selecting a
successor. Scheduler and mutable-domain entries fail closed while the task
domain and capabilities remain retained. The AHCI owner then stops the engine,
completes or fails closed outstanding work, sanitizes data, and withdraws DMA.
Only the exact supervisor, runtime, binding, and native task can consume that
freeze into `Exited` plus a pending cleanup ticket. Successor dispatch remains
withheld across retryable CPU/ABAR mapping removal and exact address-space
erasure. Mapping, erasure, and device-backend success claims are explicit unsafe
contracts. Generic exit, cleanup, and restart reject constructed services, and
the final termination owner cannot dispatch in a different runtime even when
task tokens and pending outcomes collide.

The Linux kernel suite passes all 705 tests, AHCI passes all 137 tests, and the
configuration service passes all 55 tests. Linux and `MRML_NATIVE` release
builds pass for the kernel and AHCI library; the AHCI service-image profile
passes its `MRML_NATIVE` release build, and the bootloader passes its UEFI
release build. Focused cases cover activation failure atomicity, cross-runtime
task tokens, mismatched binding/native pairs, quiescence retry, frozen mutation
denial, collision-equivalent supervisor cleanup, mapping retry, generic restart
denial, and cross-runtime dispatch owner recovery. This is unit, controlled
backend, and compile evidence only. It does not execute an installed CPL3 entry
or `INT 0x80`, switch an active service page table, invalidate a TLB or IOMMU,
run under KVM/WHP, or exercise physical AHCI hardware.

Complexity impact: MEDIUM
TCB impact: MEDIUM
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: PARTIAL
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — composing existing task freeze, device
quiescence, supervisor retirement, mapping withdrawal, cleanup, and delayed
dispatch through linear typed owners is conventional fail-closed lifecycle
synchronization. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — admitting cleanup only from the same validated
capability envelope is conventional fail-closed resource handling. See
`docs/patents/REVIEW_LOG.md`.

Bounded AHCI port-engine activation is now **PARTIALLY IMPLEMENTED IN SOURCE**.
`start_ahci_port_engine` consumes only initialized command memory, exact-matches
the ABAR and DMA generations, requires disabled interrupts and an idle task file
with no active or issued commands, then enables FIS receive before command
processing and read-verifies both transitions. Pre-write failure preserves the
owner; post-write uncertainty quarantines the layout. Storage passes 172 tests
on Windows and Arch Linux. Command construction/issue, PRDT/data buffers,
interrupts, stop/removal,
ATA/ATAPI, NCQ, IOMMU hardware, and physical evidence remain **PLANNED**.

Selected-device reopening and redundant-root reads are now **PARTIALLY
IMPLEMENTED**. Exact path/media/geometry and block-zero header revalidation
precedes both root reads; any mismatch, second-read failure, or protocol-close
uncertainty erases both roots. Windows and Arch Linux each pass 35 focused tests
and cross-build the UEFI target. Connecting these roots to the existing
reachable-graph recovery is now implemented through the scoped adapter;
transferring that owner from the real loader is the next gate.

Installed recovery ownership now crosses the Total-admission boundary in the
controlled backend-parity path. `RecoveredInstalledTotalAdmission` retains the
exact serviced device selection and recovered volume/root identity beside the
activated release and its single admission table; WHP and KVM keep that owner
through route commit and final proof. Construction rejects a mismatch among the
installed header, recovered stable graph, and committed policy. Configuration
passes 47 tests on Windows and Arch Linux, WHP passes 11, and KVM passes 12.
This is **PARTIALLY IMPLEMENTED** ownership evidence; native device enumeration,
durable hardware-backed recovery state, and installed early boot remain the next
dependency gate.

The VirtualGPU queue foundation now makes the control/data-plane rule concrete:
one consumed control-plane binding retains the exact domain, policy/device
generations, byte/dispatch budgets, authenticated queue identity, and disjoint
layout before creating direct steady-state command/completion endpoints. Focused
tests reject zero authority and capacity mismatch. This is **PARTIALLY
IMPLEMENTED** queue-boundary evidence only; broker integration, hardware
execution, and physical isolation remain **PLANNED** and do not displace the
current adaptive-isolation dependency gate.

Three new persistent deltas are documented before implementation:

- [packages/ARTIFACT_EXTENSIONS.md](packages/ARTIFACT_EXTENSIONS.md) defines
  `.mrp`, `.mrs`, `.mrz`, `.mri`, and `.mrsig` as non-authoritative filename
  conventions. Package/release default output, the first `.mri`, and package
  filename-independence tests are now **IMPLEMENTED**. The bounded exact
  three-package boot release is available as `mrml release create|verify`;
  general Store release composition, `.mrz`, and `.mrsig` tooling remain
  **PLANNED**.
- [ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md) defines adaptive placement,
  mandatory floors, semantic interface compatibility across admitted forms,
  persistent owner policy, and a strict one-boot total-microVM request. Typed
  Manifest V2 validation and explicit current application/service native
  policies are **IMPLEMENTED**. The
  resolver handles defaults, owner selection, total-mode promotion, and visible
  unsupported exceptions, and the workspace/lock retains each validated policy;
  the kernel additionally records bounded generational launch admission and
  retains typed unavailable attempts while rejecting Total-mode native
  downgrades or active blockers. A bounded routing prerequisite now dispatches
  a caller-selected service placement to distinct native-service or microVM
  backend entries while preserving exact interface and provider generations.
  A separate application route now binds the application object, immutable
  application generation and artifact digest, active system generation, and
  policy generation to either native-process or microVM execution. It invokes
  only the selected backend, rejects stale identities before launch, and makes
  a failed Total-mode microVM unavailable with zero native fallback. A concrete
  native-process lifecycle adapter now creates one ordinary task in a dedicated
  caller-owned runtime, creates no service identity or authority from metadata,
  and retires the complete task domain before retryable address-space erasure.
  Focused tests use an unaccounted runtime, so production quantitative
  allocation remains a caller obligation. This is kernel control/lifecycle
  groundwork. A bounded executable `ApplicationImage` artifact kind now admits
  independently authenticated application bytes and fails closed when code
  incorrectly asks the fixed five-root early-boot release for an application
  root. Route-ready application identity is now derived only when the verified
  artifact kind, version, and SHA3-512 payload digest exactly match the named
  package in one canonical `SystemGeneration`; mismatches publish no route
  specification. A distinct typed `ApplicationLaunch` handoff descriptor now
  reuses the bounded user-image layout validation without becoming a
  `ServiceLaunch`. Its canonical distinct-flag wire encoding, exact decode, and
  mutually disjoint reserved backing validation and signed-kernel boot
  consumption are **IMPLEMENTED** for the focused application profile. A distinct x86-64
  `ApplicationAddressSpace` now requires matching authenticated
  `ApplicationImage` identity and derives the same reviewed W^X PE, guarded
  stack, and private page-table plan without accepting service identity. The
  focused signed profile now installs that private CR3, enters the application
  at CPL3, authenticates its pointer-free exit syscall, retires the task, and
  tears down the admitted guest on WHP and KVM.
  The distinct syscall-only `org.mrml.app.isolation-probe` is
  now a real Manifest V2 `system-application` supporting native-process and microVM forms;
  Windows and Arch Linux cross-build identical PE output. Fresh separately
  signed application/kernel/package artifacts executed through the same exact
  generation-bound Total-mode route on WHP and nested KVM. The representative
  GUI application, compositor/Semantic Scene Graph integration, general
  application loading, and broad compatibility remain **PLANNED**. A
  backend-neutral microVM owner now rechecks and
  consumes one already constructed application guest, retains it behind an
  exact generational endpoint, refuses native dispatch, and preserves uncertain
  teardown for retry. The focused application profile now transfers a real
  prepared WHP/KVM guest into that owner, proves six ordered signed-kernel
  stages plus the authenticated CPL3 exit, and completes teardown. Substituting
  the application trust root is rejected identically before VM execution. This
  is **PARTIALLY IMPLEMENTED** hosted controlled-probe evidence, not a GUI app,
  general resolver/resource projection, required-system Total readiness,
  host-resistant isolation, bare metal, or physical evidence.
  The configuration package now admits both forms and supplies a concrete
  configuration-specific adapter with focused fail-closed tests. The native
  form now uses a real accounted `TaskRuntime`/`ServiceSupervisor` launch and
  exact retryable address-space cleanup. The VMM form now has a backend-neutral
  owner that retains one prepared guest behind an exact generational endpoint
  until confirmed teardown, including retry after teardown uncertainty. Both
  KVM and WHP hosted probes now place their transaction-committed guest in
  that owner, gate execution access on the exact endpoint, and explicitly retire
  it on the successful terminal path. Their builds and focused tests pass. Fresh
  one-time-signed identical artifacts completed the full hosted service probe on
  both backends with one eligible domain, one microVM domain, and zero native
  fallback. Component guest construction, exact binding, and atomic pair
  attachment failures now consume the prepared route as typed `VMM_RESOURCE`
  unavailability on both runners instead of attempting native execution; a
  focused kernel test proves zero fallback. This is hosted controlled-probe evidence, not required-system Total
  readiness. The canonical Zstd provider/ZIM consumer now use the isolated-
  service form, and a bounded hosted adapter carries the exact ABI-3 request
  through `TaskRuntime` plus one attenuated shared-buffer capability under
  distinct VM/task bindings on Windows and Arch Linux. This is not a launched
  service or VMM invocation. A complete representative dual-placement service,
  Settings/shell projection of owner policy, VM construction, resource
  projection, resolver-to-launch binding, concrete service syscalls, and WHP/KVM
  runtime transport remain **PLANNED**. A bounded userspace receive/reply loop
  and hosted `TaskRuntime` adapter now prove the full authenticated round trip,
  including sender binding, separate reply authority, and revocation-before-
  reply ordering.
  The MRML-native ZIM consumer's receive wrapper now rejects payload or
  capability counts beyond its supplied slices before returning them. Its
  outgoing descriptor uses explicit 8-byte-aligned, exact 16-byte storage and
  its send wrapper rejects invalid payload lengths. Its native artifact builds
  and the Linux ZIM suite passes six tests.
  The configuration service now provides a bounded typed persistence
  prerequisite for component placement preference and system isolation-mode
  selection, using exact setting/root capabilities and its authenticated
  checkpoint recovery path. A revision-bound application plan reauthorizes the
  system and component reads after loading, rejects intervening configuration
  commits, and produces the typed kernel mode, component request, and admission
  policy generation. The representative service path now also checks an exact
  runtime projection of authenticated package preference, floor, ceiling, and
  supported forms before producing a generational `IsolationServiceSpec`;
  unsupported Total or below-floor requests fail without fallback. It does not
  yet provide the general package resolver or grant placement. One composed
  configuration-service route now repeats live policy authorization, checks the
  kernel admission mode/generation and exact interface/provider identity, and
  invokes only the admitted backend. Stale policy or admission mismatch reaches
  neither launcher. Broad cross-placement interface transport remains planned.
  The WHP and KVM hosted service probes now create and capability-authorize the
  same typed component/system policy records, apply exact service package bounds
  and verified provider generation, and reserve that prepared route before
  constructing the guest. Fresh same-artifact runs on both backends again report
  one eligible microVM domain and zero native fallback. Their in-memory policy
  setup is controlled-probe evidence, not stable recovery or boot policy.
  The existing hosted KVM/WHP configuration-service probes are wired to this
  admission record, but do not yet constitute native-versus-microVM resolution.
  A one-use typed service transaction now preserves exact binding identity from
  pre-construction admission through endpoint commit and teardown-safe rollback.
  Both hosted configuration probes use it around real guest construction and
  pass build/unit gates and the fresh signed lifecycle probe completed on both
  hosted backends. The build tool now also
  composes one exact `SystemGeneration`, isolated-service `InterfaceBinding`,
  and already resolved placement into a generation-bound handoff while rejecting
  stale IDs, package substitution, in-process targets, and Total-mode exceptions.
  This remains host policy evidence and does not yet launch or transport the
  representative service.
- [storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md) defines the
  disk/image, GPT/FAT, UDF/ISO, MMC, AHCI/USB optical, burning, and virtual-
  optical dependency order. New optical mechanisms are **PLANNED**.

With the small package-extension/tooling gate complete, keep adaptive isolation
and storage/optical as separate sequential foundational OS tasks under
the work-in-progress limit; do not combine them into one functional commit.

Adaptive-isolation milestones remain separate: policy/object schema; one
dual-placement service; one dual-placement GUI app; monitor visibility
(**PARTIALLY IMPLEMENTED** as a capability-scoped aggregate kernel snapshot);
resource/device projection; Settings/shell policy; strict Total runtime;
bootloader selector; EFI Shell selector; required-system Total readiness;
broad application compatibility; and physical/performance evidence. A menu
entry, policy type, UI, or one guest cannot promote Total mode. Successful
tested Total requires every running `MICROVM_ELIGIBLE` domain in a microVM, no
active required `UNSUPPORTED_BLOCKER`, zero native fallback, and every host/
boot/recovery exception explicitly enumerated and justified.

The current monitor increment derives one immutable aggregate directly from the
authoritative admission table after exact-object `INSPECT` authorization. It
distinguishes Total not-requested/satisfied/unsatisfied state and counts every
host-substrate and unavailability reason without revealing domain identities.
The focused kernel suite passes 539 tests on Windows and Arch Linux. This is not
a running monitor service, event stream, per-domain disclosure, GUI/shell, or
WHP/KVM placement execution claim.

Resource/device projection is now **PARTIALLY IMPLEMENTED** at the next kernel
control-plane boundary. A linear plan validates exact route generations, guest
RAM pages and object authority, same-domain live vCPU identity/count, and an
exact no-duplicate set of interface/device capability projections before any
backend allocation phase. The application factories now prepare that plan
before WHP/KVM construction, seal it into an immutable active data-plane state
only after native construction and application-resource attachment succeed,
and retire the native guest before revoking projected capabilities and
releasing exact RAM/vCPU reservations. The first signed WHP probe exposed and
rejected an invalid CPU-resource namespace before VM construction; both runners
now use an admissible explicit namespace and carry a focused regression test.
Fresh identical signed artifacts then completed the Total-mode CPL3 application
path and teardown on WHP and nested KVM. Windows and Arch Linux each pass 545
kernel tests; WHP passes 9 runner tests and KVM passes 10. Device-specific
projection, reset/revocation, broader application/service integration, and
physical evidence remain **PLANNED**. Persistent Settings and shell policy is
now **PARTIALLY IMPLEMENTED** at its shared service boundary: a canonical
authority-free edit binds exact scope/object/setting/native-class/selection and
expected revision, while commit separately requires root `CONTROL` and setting
`WRITE`. Windows and Arch Linux each pass 41 configuration tests. Actual GUI,
shell parsing/rendering, semantic accessibility, and restart/reboot presentation
remain **PLANNED**. The common privacy-bounded semantic projection is now
**PARTIALLY IMPLEMENTED**: it exposes the configured selections, package bounds
and supported forms, resolved placement/source or blocked state, and exact
aggregate kernel snapshot only when policy generation and requested mode match.
Rendered Settings and running shell adapters are the remaining frontend gate
before strict Total runtime enforcement. Their first semantic adapters are now
**PARTIALLY IMPLEMENTED**: Settings actions and a bounded object-shell parser
produce the same canonical edit, and shell text cannot select authority,
objects, providers, paths, or fallback. Rendered/interactive processes and
trusted accessibility presentation remain **PLANNED**.

Strict Total runtime enforcement is now **PARTIALLY IMPLEMENTED** at its kernel
finalization boundary. A generation-bound fixed inventory must classify every
running/unavailable domain and mark each must-run component. The finalizer
rejects missing or unavailable required domains, unknown active domains, class
substitution, eligible execution outside a microVM, unsupported blockers, and
native fallback before producing a bounded runtime proof. Windows and Arch
Linux each pass 557 kernel tests. WHP and KVM now authenticate and construct the
release-derived inventory before CPU, RAM, or guest construction, retain it
across construction, and finalize it after exact Total admission but before
focused component execution. Their suites pass 9 and 10 tests respectively,
and fresh signed probes on 2026-08-26 each emitted `classified=1`, `eligible=1`,
`microvm=1`, and `native_fallback=0` for the exact system/policy generation.
That inventory is now a private-field authenticated-release wrapper rather
than a publicly constructible mutable value. Before recovered Total policy can
accept it, the wrapper must be consumed by exact equality with the activated
system generation, canonical generation digest, and interface-catalog digest.
The resulting strict-runtime proof is now private-field too; external launchers
may inspect generation-bound counts but cannot safely construct a substitute
proof. It is non-copyable, and installed-runtime diagnostics borrow it without
detaching it from the retained recovery and admission owner. Windows passes 564
kernel tests and 51 configuration tests, and the WHP
runner cross-builds with this boundary. Linux/KVM execution for this increment
was unavailable on the current Windows host and is not claimed.
Raw inventory construction and finalization are now kernel-private. The hosted
GUI probe reports scoped application placement rather than constructing an ad
hoc strict-system inventory; externally obtainable strict proof must flow from
the authenticated release wrapper.
Both runners perform that join before CPU, RAM, or VMM construction; matching
only the numeric generation fails the typed boundary. Windows/Linux config
suites pass 42 tests, WHP passes 9, and KVM passes 10. Complete installed-system
enumeration and live boot consumption remain the next gates; this one-component
proof does not establish required-system Total readiness.

The exact release-persistence sub-gate is now **PARTIALLY IMPLEMENTED**. A
versioned 424-byte deployment checkpoint retains the authenticated
SystemRelease content digest, signer identity, and runtime-inventory digest with
the activated generation. Stable publication and its rollback-resistant state
commit to those bytes. Recovery recreates `ActivatedSystemRelease`, and kernel
Total binding rejects substitutions of generation, generation digest, catalog
digest, signer, release-content digest, or runtime-inventory digest. Legacy
224-byte generation-only checkpoints remain readable but cannot satisfy Total.
Windows and Linux package-format suites pass 16 tests, deployment passes 6,
kernel passes 557, config passes 42, WHP passes 9, and KVM passes 10. Fresh
signed WHP and nested-KVM probes each report one eligible microVM and zero
native fallback after v3 recovery.

The next narrowing is **PARTIALLY IMPLEMENTED**: launchers supply a complete
bounded set of policy-selected package/domain assignments rather than restating
release classifications. The authenticated runtime inventory supplies eligible,
boot-only, recovery-only, and unsupported-blocker classes plus descriptive
reasons. Host-substrate enum reasons remain explicit architecture input and are
accepted only for release records in that class. Omission, substitution,
duplicates, and class/reason-shape mismatch fail before backend construction.
The focused WHP/KVM release path now uses a fixed-capacity plan that enumerates
the exact activated release membership and seals only after every member has
one assignment; unknown, duplicate, omitted, and excess packages fail. The plan
is non-authorizing control-plane data, so normal capability/resource admission
still precedes the shortest-safe-path interface data plane. General policy
enumeration is now **PARTIALLY IMPLEMENTED**: an atomic callback receives every
full authenticated runtime record and publishes nothing if any decision rejects
or substitutes its identity. WHP and KVM use that enumeration rather than a
detached ZIM/Zstd list. Windows and Linux kernel suites pass 559 tests, WHP
passes 9, KVM passes 10, and fresh signed probes retain one eligible microVM
with zero native fallback. Per-package owner-policy lookup, distinct-domain
construction, complete installed-generation orchestration, and live boot
recovery remain **PLANNED**.

Deployment now **PARTIALLY IMPLEMENTS** the next complete-generation join. A
capability-authorized `begin_runtime_assignment` query selects the exact active
SystemRelease and signer retained by `DeploymentService`, then verifies supplied
canonical release bytes before returning the existing fixed-capacity complete
assignment plan. Missing release identity, corrupt/substituted bytes, or wrong
inspection authority fail before enumeration; the plan remains non-authorizing.
Deployment passes 6 tests on Windows. Live recovered-file selection, general
owner-policy assignment, and launch of the complete resulting domain set remain
**PLANNED**.

The capability-selected release-byte read is now **PARTIALLY IMPLEMENTED**.
`read_active_runtime_assignment` authorizes deployment inspection before I/O,
exact-matches the storage file object/generation to the activated source, bounds
the complete image, performs verified capability-selected reads in bounded
chunks, and feeds only the resulting exact bytes into active-release assignment.
Short buffers and source, authority, read, or release substitution fail before
enumeration; partial output is erased on read failure. Deployment passes 6 tests
on Windows. Real service invocation, general policy assignment, and full domain
construction remain **PLANNED**.

Recovery and source selection are now **PARTIALLY IMPLEMENTED** as one typed
operation. `recover_and_read_runtime_assignment` authenticates the deployment
recovery state and checkpoint, retains the recovered deployment service, reads
that service's exact active release source through separate storage authority,
and returns both beside one complete assignment plan and the authenticated
recovery epoch/checkpoint file/digest evidence. The focused Windows test retains
and exact-checks that evidence, then seals the plan only after both file reads
and active-release equality succeed. Joining this deployment owner to the
recovered configuration owner, general policy, and construction of every
enumerated domain remain **PLANNED**.

Recovered configuration now **PARTIALLY IMPLEMENTS** general per-package
runtime assignment over that authenticated activated release. The assignment
generation must equal the committed configuration revision, and every
enumerated package requires one exact component-scoped persisted policy read
through its own live capability. Missing, duplicate, stale, revoked,
wrong-authority, or substituted bindings fail atomically with zero published
assignments. The persisted setting object supplies a non-authorizing domain
identity only; normal resource and route admission remain mandatory. Windows
passes 566 kernel tests and 51 configuration tests. Real service invocation,
construction and admission of every assigned domain, and complete WHP/KVM
system placement remain the next dependency gates; Total mode remains
**PLANNED** end to end.

The retained delivered-recovery owner now **PARTIALLY IMPLEMENTS** the next
atomic composition: it validates installed identity, composes effective Total
policy, capability-assigns every authenticated active-release package, seals
that exact inventory, and creates its only admission table without accepting a
detached release builder. A stale assignment generation or any failed join
returns no admission owner. The focused Windows configuration suite remains 51
passing tests and exercises the resulting microVM route commitment and strict
runtime authorization. Production service-loop invocation and complete
multi-domain WHP/KVM launch are the next dependency gates.

The authenticated cross-service owner is now **PARTIALLY IMPLEMENTED**.
Deployment seals its exact assigned release while retaining the recovery epoch,
selected checkpoint evidence, and recovered deployment service. Configuration
consumes that retained inventory into one owner that also retains the delivered
configuration recovery and sole installed admission table. No detached sealed
release survives a failed policy, assignment, installed-identity, or admission
join. Deployment passes 6 tests and configuration 51 tests on Windows. The next
gate is real service-loop construction followed by distinct-domain backend
construction and cleanup; end-to-end Total mode remains **PLANNED**.

Backend probe wiring now **PARTIALLY IMPLEMENTS** recovered cross-service
ownership on both WHP and KVM sources. The shared probe authenticates separate
configuration and deployment recovery state, reads the exact activated
SystemRelease through bounded immutable extents, capability-assigns every
package, and returns one owner retaining both recoveries beside installed Total
admission. Runners retain it through route commitment and strict runtime
authorization; they no longer receive a detached release-builder callback.
Release substitution and stale recovery roots fail before a joined owner is
returned. Configuration passes 51 tests and WHP 12 runner tests on Windows. The
KVM build remains unavailable here because the configured Linux cross-host Rust
target is absent, so parity is source-level for this increment. Production
service-loop and distinct-domain orchestration remain **PLANNED**.

The production installed-root prerequisite is now **PARTIALLY IMPLEMENTED** as
`SelectedStableTotalSystemRecovery`. It exact-binds four distinct reachable
files—configuration, authority checkpoint, deployment checkpoint, and activated
SystemRelease—to one integrity-validated volume/root generation while retaining
the graph that established them. The selection grants no file capability.
Focused controlled tests reject duplicate-object and prior-root substitution;
configuration remains 51 passing Windows tests. Serviced-volume construction
is now **PARTIALLY IMPLEMENTED** through one exclusive installed session and
retained block data plane. Deployment recovery now consumes the selected
deployment-checkpoint and SystemRelease `FileState`s directly: the controlled
owner retains checkpoint object 11/generation 2 while its activated generation
identifies release object 12/generation 2 from that same root. Separate file
capabilities remain mandatory, and a substituted release still publishes no
owner. Configuration passes 51 tests, deployment 6, and WHP 12 on Windows;
the Linux KVM cross-build is unavailable on this host because
`cross_host_rust_target` is absent. Production service-loop invocation is the
next dependency gate.

The kernel now **PARTIALLY IMPLEMENTS** focused complete multi-domain
finalization evidence. An authenticated two-package release assigns two
required packages to distinct domains; strict finalization rejects the state
after only one microVM route commits and succeeds only after both commit. The
result reports two classified eligible domains, two running microVMs, and zero
native fallback. Windows passes 567 kernel tests. Backend construction,
all-domain cleanup, and production service-loop orchestration remain
**PLANNED**.

The first half of that gate is now **PARTIALLY IMPLEMENTED**: `MRMLRI1` is a
bounded canonical runtime-inventory catalog whose records exact-bind every
`MRMLSG2` package identity, version, and artifact digest to Total class,
must-run state, placement bounds/forms, and explicit exception reason. Complete
membership equality is mandatory; subsets, substitutions, unknown values,
invalid bounds, and noncanonical bytes fail. Package-format suites pass 16 tests
on Windows and Linux. Manifest V2 classification and public `MRMLRI1`
derivation are now **IMPLEMENTED**: the builder rejects every unclassified or
unknown generation member and retains the generation's exact versions and
digests. Build-tool suites pass 99 tests on Windows and Arch Linux. Signed
release delivery is now **IMPLEMENTED** through backward-compatible general
SystemRelease v2, which authenticates the exact three-record set and rejects
inventory/generation mismatch; v1 continues to parse without an inventory.
Kernel construction is now **IMPLEMENTED**: a bounded adapter requires the
selected signer plus an exact package binding for every authenticated
classification, rejects count, identity, class, reason, or incompatible-
co-location substitution, conservatively combines colocated must-run state, and
returns a private-field release-authenticated wrapper. Recovered Total policy
can bind only that wrapper to its exact system/policy generation before launch.
Focused runner consumption is now **PARTIALLY IMPLEMENTED**. WHP and nested KVM
produced byte-identical 201/207/225-byte generation, interface, and runtime
records; the same freshly signed 99,369-byte v2 release finalized one colocated
ZIM/Zstd domain as `classified=1`, `eligible=1`, `microvm=1`, and
`native_fallback=0` before execution. Windows and Linux pass 553 kernel tests,
WHP passes 9 runner tests, KVM passes 10, and the build frontend passes 99 on
each host. Complete installed-system enumeration, recovery reconstruction, and
boot-selected end-to-end runtime proof remain next.

Boot-selector groundwork is now **PARTIALLY IMPLEMENTED** without skipping that
runtime gate. The common UEFI library has one bounded allocation-free UTF-16
LoadOptions parser for both boot-entry optional data and the EFI Shell form. It
accepts only the configured-default form or the exact one-boot Total option and
rejects ambiguity and additional tokens. The real loader now validates the
firmware buffer and carries that request through a canonical trusted-loader
handoff flag; the kernel retains the typed authority-free override separately
from effective runtime state. Windows/Linux pass 553 kernel and 27 UEFI tests,
and the UEFI target builds. Base-policy composition is now **PARTIALLY
IMPLEMENTED** as an explicit configuration control-plane value: the one-boot
overlay strengthens a validated immutable Balanced/native policy to Total while
preserving its stored selections and generation, and native-only bounds fail
closed. WHP and nested KVM inject that typed overlay and route the same
release-derived eligible component to a microVM with zero native fallback.
Configuration passes 42 tests on each host; WHP passes 9 runner tests and KVM
passes 10.
Focused decoded-handoff delivery into recovered configuration is now
**PARTIALLY IMPLEMENTED**: only a committed recovered system state can
capability-revalidate the exact settings and compose the canonical handoff, and
a stale recovery epoch fails. The resulting `RecoveredTotalAdmission` now owns
the activated release and its sole policy-derived admission table. Route
preparation exact-matches domain/class against that release before reserving the
same table; unclassified-domain and policy-generation substitutions leave no
launch state. Configuration suites pass 45 tests on Windows and Arch Linux.
Live WHP and nested KVM now consume that recovered owner from a shared
hosted-only exact-file and authenticated-authority recovery source through
route commit and final proof. Both checkpoint files are now selected from one
integrity-validated redundant-root graph whose exact volume/root is also bound
by handoff state, monotonic state, and owner approval. The source independently
fixes accepted epoch 8 and successor authority epoch 9, and rejects stale epoch
7 or a substituted root generation. The committed volume/root provenance now
remains in recovered policy through
the control-plane join and is reported before the runtime data plane opens.
Production stable-media recovery, early-boot orchestration, menu presentation,
OVMF/EFI-Shell execution, complete installed-system inventory, and end-to-end
runtime enforcement remain **PLANNED**.

The recovered owner now **PARTIALLY IMPLEMENTS** complete unique-domain route
preparation. One bounded transaction requires exactly one caller binding for
every unique domain in the authenticated release, preserves intentional
compatible package co-location, rejects empty, duplicate, missing, additional,
or class-mismatched bindings before returning a set, and cancels earlier
preparations in reverse if a later preparation fails. WHP and KVM recovered
component modes consume this set instead of independently preparing one route.
The hosted recovery fixture's package-policy domain now exactly matches the
runner domain. Configuration passes 51 tests and WHP passes 12 on Windows. A
release-mode WHP controlled probe reached authenticated recovered-policy output
after moving bounded release scratch to runner-owned storage, then failed closed
at the later component handoff because the retained consumer/provider fixture
had substitutable executable identity. KVM execution was not rerun, and
production service-loop invocation, complete distinct-domain construction, and
end-to-end Total satisfaction remain **PLANNED**.

Focused distinct-domain rollback evidence now covers an authenticated
two-package release. Domain A prepares, domain B then fails its Total-mode
placement bounds, and the same admission owner immediately prepares both
domains successfully afterward, proving the earlier route was canceled rather
than stranded. Extracting routes also decrements the prepared set's live count;
canceling both exact routes leaves it empty. Configuration passes 52 tests on
Windows. No backend endpoint was constructed, so service-loop invocation and
multi-domain backend construction/cleanup remain **PLANNED**.

The hosted recovered-control-plane prerequisite now exact-binds a two-package
authenticated release to two independently capability-readable component
policies and two distinct domain identities. It refuses to return the joined
owner for shared or unexpected assignments, and runtime authorization remains
unavailable while both routes are absent. Configuration passes 53 tests on
Windows and Arch Linux; unchanged runner suites pass 12 on WHP and 13 on KVM.
Backend endpoint construction, atomic route commit, execution, and cleanup of
both distinct domains remain **PLANNED**; the live single-domain path is
deliberately unchanged and is not complete-system Total evidence.

The complete-set control plane now has a **PARTIALLY IMPLEMENTED** atomic
publication transaction. It exact-matches one already-constructed endpoint to
every prepared microVM domain before mutating admission, commits the complete
set, and returns a routed owner only after all commits succeed. Invalid endpoint
membership cancels every prepared route; a later commit failure retires earlier
running domains in reverse and returns every endpoint for teardown. The focused
two-domain test proves successful Total finalization and duplicate-binding
rollback on Windows and Arch Linux. Live WHP/KVM endpoint construction and use
of this transaction remain **PLANNED**.

The co-located ZIM/Zstd runner path now **PARTIALLY IMPLEMENTS** live atomic
endpoint publication and complete component execution on both WHP and KVM. A
route temporarily consumed by artifact/backend construction can be restored
only to its original complete-set membership; after guest construction the
complete transaction exact-matches and commits the endpoint, authorizes runtime,
and transfers that same endpoint into the launcher. Register evidence localized
the former first-exit double fault to a 296-byte underflow below the mapped
16-page early stack. The shared loader/kernel/VMM contract now maps a 32-page
early stack in a 64-page guarded privilege arena. The independently signed Zstd
provider starts at its exact verified PE entry rather than the old combined-
fixture `+0x200` convention. One identical fresh signed artifact set completed
the exact-generation ZIM/Zstd data path, Total proof, peer lifecycle, cleanup,
and halt on WHP and KVM with `eligible=1`, `microvm=1`, and
`native_fallback=0`. Constructing and retiring both distinct recovered domains
remains the next gate; whole-system Total mode remains **PLANNED**.

The complete-set control plane now also **PARTIALLY IMPLEMENTS** transactional
backend construction. Endpoints are constructed in exact retained-domain order
before any route is published. Failure while constructing the second domain
returns the first opaque endpoint for explicit backend teardown, cancels every
route still owned by the set in reverse, leaves zero running domains, and allows
the same owner to retry immediately. The focused two-domain configuration test
then constructs both endpoints, atomically commits them, finalizes with two
eligible microVM domains and zero native fallback, returns both endpoints, and
retires both domains. Configuration passes 53 tests on Windows and Arch Linux.
Live construction/execution of two distinct WHP/KVM guests remains the next
gate; whole-system Total mode remains **PLANNED**.

WHP and KVM now route the live single-domain provisional guest through that same
transactional constructor instead of assembling an endpoint array directly.
The constructor exact-matches the retained service specification, permits one
ownership transfer, and precedes atomic publication on both backends. The WHP
runner passes 12 tests on Windows and the KVM runner passes 13 on Arch Linux.
This is backend/API integration evidence; two distinct live guests remain the
next gate.

The first cross-domain data-plane prerequisite is now **PARTIALLY IMPLEMENTED**
in the kernel memory-resource model. A single shared `MemoryObject` can reserve
exact read/write, non-executable mappings into two distinct target objects while
retaining both exact target capability generations. Target rights must be
exactly `MAP|INSPECT|CONTROL`; same-target aliasing, insufficient or excessive
rights, stale generations, and second-mapping exhaustion fail closed. Late
failure rolls back the first reservation and page charge. Kernel suites pass
574 tests on Windows and Arch Linux. Native one-page backing and exact GPA
map/unmap are now **PARTIALLY IMPLEMENTED** on WHP and KVM. Nested KVM proved one
shared backing across two distinct live VMs and exact removal. This nested WHP
host rejects its second partition with the typed VID collision, so strict Total
records unavailability rather than using one VM twice. Guest page-table
projection, the bounded queue, and component execution remain the next gates.

Exact guest leaf projection is now **PARTIALLY IMPLEMENTED**. WHP and KVM use
the existing leaf-only page-table mutator to install verified supervisor RW/NX
translations, reload exact stopped-vCPU roots, and remove both leaves before GPA
retirement. Nested KVM proves conflict rollback, immediate retry, shared-byte
visibility, and complete translation/GPA removal across two live VMs. The
bounded interface queue is now the next dependency gate.

The bounded interface queue wire is now **PARTIALLY IMPLEMENTED**. Kernel tests
cover exact projection/capability binding, identity tampering, replay, wrong
response sequence, bounded output, stale authority, and terminal sequence
exhaustion without mutation. Nested KVM carries a complete generation-bound
request/response across two distinct live VMs before exact teardown. WHP retains
source/API parity but this host still cannot supply two-partition evidence.
Guest-side notification and signed ZIM/Zstd execution are the next gates.

The paired retirement ledger is now **PARTIALLY IMPLEMENTED**. A backend may
release the shared page only after proving both native mappings and translations
absent. Kernel preflight exact-matches the object, two mapping generations,
target capability generations, RW/NX shape, physical-backing absence, and an
exactly-two mapping count before one atomic retirement commit. Wrong authority
and an injected third alias retain all accounting unchanged for retry. Kernel
suites pass 574 tests on Windows and Arch Linux. WHP/KVM native mapping
retirement now precedes this ledger release and retains backing on uncertainty.
Guest page-table invalidation and bounded queue activation remain the active gate.

The existing userspace block recovery loop is now reproducibly selectable
through the canonical build frontend. The service image's
`block_service_loop` profile and bootloader/kernel image's
`block_service_probe` profile both pass release builds through `mrml`; manifest
validation passes and `mrml.lock` records the current 51-package graph. This is
build/ABI evidence for the already implemented configuration/authority loop.
It does not add the deployment checkpoint or SystemRelease to that service
image, so four-file Total-owner consumption remains the next gate.

Live service-image four-file selection is now **PARTIALLY IMPLEMENTED**. After
the existing configuration/authority COW publication and recovery, the CPL3
client publishes a canonical 48-block reachable graph with distinct
configuration, authority-checkpoint, deployment-checkpoint, and SystemRelease
files. It then invokes `recover_block_stable_total_system_selection` through the
same capability-mediated remote block session, exact-checks volume `51...51`,
root generation 14, and objects 9 through 12, and erases its static recovery
scratch. The service processes exactly 51 monotonic block requests and cannot
retire before the client completes the redundant-root reads. Fresh one-use
signed artifacts completed the full lifecycle under WHP in 48,442 microseconds;
WHP runner tests pass 12/12. The Linux cross-host target is unavailable here,
so KVM execution was not rerun. The deployment bytes and release bytes in this
controlled graph are not yet parsed or authenticated; deployment recovery,
runtime assignment, and Total admission from this service-image owner remain
the next gates.

The selected deployment and release files now carry real authenticated probe
content instead of marker bytes. The service image builds a canonical signed
one-domain release, publishes its multi-block extent, recovers both selected
files through one shared volume with independent file capabilities, verifies
and assigns the runtime inventory, and erases transient signing/output storage.
An explicit canonical completion record replaces the obsolete predicted request
count: only the client that consumed every response can report its final count,
and the server exact-matches that count against its bounded served total before
retirement. Fresh independently signed artifacts completed authenticated
release recovery plus sender, peer-death, receiver, and idle cleanup under WHP
and nested KVM. Storage passes 139 tests on both hosts, WHP-run 12, and KVM-run
13. Complete installed-generation enumeration and end-to-end required-system
Total proof remain **PLANNED**.

The production-shaped stable-selection API is now **PARTIALLY IMPLEMENTED**.
`SelectedStableSystemRecovery` admits only distinct configuration and authority
checkpoint files selected from the same integrity-validated volume/root
generation. It is non-authorizing and remains subordinate to owner approval,
authenticated monotonic state, exact file capabilities, and dependent
validation. Duplicate-object and prior-root substitution tests fail before the
transaction. Windows and Arch Linux configuration suites pass 45 tests, WHP
passes 11, and KVM passes 12. The hosted adapter is its only caller so far;
real block-device selection, installed early-boot construction, and complete
system enumeration remain the next gates.

Redundant-root device reading is now **PARTIALLY IMPLEMENTED**. The shared
controlled path creates one exclusive `BlockVolume`, reads both full root blocks
through `StorageBlockDevice`, validates all reachable metadata through that same
device generation, and retains the volume with the selection. Failure of either
root read returns no selected state and cannot reach Total admission. Windows
and Arch Linux each pass 121 storage and 45 configuration tests; WHP passes 11
and KVM 12. The exercised device is an in-memory controlled backend. Installed
media, early-boot device discovery, and complete system enumeration remain next.

Capability-bound stable-device admission is now **PARTIALLY IMPLEMENTED**.
`recover_serviced_stable_system_selection` validates an exact generational
`BlockService` session and principal before constructing the serviced device or
issuing root reads. Wrong-principal and revoked-session tests cause zero backend
I/O. Windows and Arch Linux each pass 46 configuration tests; WHP passes 11 and
KVM 12. The hosted positive path now registers its controlled device, grants an
exact read-only recovery session, and retains the service/session/backend/volume
chain through committed recovery. Fresh signed probes on both backends reported
root generation 14, one eligible microVM, and zero native fallback. Installed
discovery and early-boot orchestration remain next.

Installed recovery-device binding is now **PARTIALLY IMPLEMENTED** at the
service boundary. One typed `InstalledRecoveryDeviceSelection` authenticates
the exact session/principal and binds its registered device descriptor to the
expected device, volume, geometry, and active redundant-root slot before any
backend read. All six substitution classes fail before I/O, while the steady
data plane continues through the existing independently authorized block
session. Windows and Arch Linux pass 121 storage and 46 configuration tests;
WHP passes 11 and KVM 12. The next dependency gate is platform enumeration that
constructs this selection from an actually installed device, followed by
early-boot ownership and lifecycle integration.

The bounded enumeration join is now **PARTIALLY IMPLEMENTED** without claiming
a platform backend. `InstalledRecoveryDeviceDiscovery` supplies validated
candidate descriptors and volume headers under an exact maximum; selection
requires one and only one expected volume and then cross-checks the candidate
against the independently authorized session. Missing, ambiguous, overflowing,
and zero-capacity inventories fail closed. Configuration passes 47 tests on both
development hosts, WHP 11, and KVM 12. Implementing PCI/AHCI and VirtIO discovery
sources and transferring the selected owner into installed early boot remain the
next dependency gates.

The selected-device lifetime now remains coherent through recovery as a
**PARTIALLY IMPLEMENTED** owner. A single bounded API discovers and
authenticates the candidate, reads its redundant roots and reachable graph, and
returns the installed binding beside the exact live `BlockVolume`; callers do
not reconstruct those pieces independently. Configuration remains 47/47 on
Windows and Arch Linux, WHP 11/11, and KVM 12/12. Native device sources and
transfer of this owner into the actual boot recovery orchestrator remain next.

Fresh clean-tree parity now verifies the current owner on both hosted backends.
Commit `70e2e74d` produced one new one-use-signed kernel, ZIM, Zstd, canonical
generation/catalog/runtime inventory, and v2 SystemRelease set. WHP and nested
KVM each reported recovery root 14, `classified=1`, `eligible=1`, `microvm=1`,
`native_fallback=0`, Total satisfied, and successful terminal component
execution/cleanup. The next gates remain native device enumeration and transfer
into installed early boot; this evidence does not promote Total mode generally.

The next storage connection is now **PARTIALLY IMPLEMENTED** without claiming
media evidence. `recover_stable_system_selection` accepts the existing hostile
metadata backend implemented by `BlockVolume`, selects one complete redundant-
root graph, verifies both required objects, and returns an owning
`RecoveredStableSystemSelection`; borrowed selections cannot detach from that
graph. The hosted adapter uses this same API. Reading real redundant
superblocks from an installed device, early-boot construction, and complete
system enumeration remain the next gates.

The shared live Total owner is now **PARTIALLY IMPLEMENTED**. WHP and nested
KVM bind the effective boot policy and activated signed release into one
`BootTotalAdmission`, preserve exact generation/catalog digests, prepare and
commit the classified route through its owned table, and finalize from that
same owner after vCPU/RAM/VMM construction. `RecoveredTotalAdmission` wraps the
same object rather than creating a parallel table. Configuration passes 45
tests on both hosts, WHP passes 11, KVM passes 12, and fresh signed probes report
one eligible microVM with zero fallback. The component-service runners now
replace their release-owned transient admission with `RecoveredTotalAdmission`
produced by the shared hosted recovery source. Production stable-storage
selection is the next gate; component mode now creates no transient
configuration/effective-policy fixture, and live recovered boot remains
**PLANNED**.

The hosted service runners now take the one-boot Total overlay from the exact
canonical `BootHandoff` bytes installed for the guest rather than constructing
`TotalMicrovmOnce` independently. Their handoff carries neutral recovery
metadata with accepted epoch 8 and no pending recovery action; missing recovery
metadata or a decoded handoff without the Total flag fails before admission.
WHP passes 11 runner tests and KVM passes 12, while Windows and Arch Linux each
pass 559 kernel tests. Retained older signed guest artifacts correctly failed to
produce new execution evidence. A freshly built component-service kernel was
then signed with one-use kernel/package keys and packaged as SHA-256
`6edd697109255f628dbd877bfd0a7df1d703a161d288369b3a5023038c0ebe91`.
Both WHP and nested KVM consumed it, reported `handoff=decoded`, accepted epoch
8, one eligible microVM, and zero fallback, then completed the expected guest
lifecycle/data path. This is **PARTIALLY IMPLEMENTED** live hosted handoff
parity, not recovered boot or complete Total satisfaction. The shared hosted
recovery source now consumes the committed owner as described below; production
stable-media recovery remains the next gate.

The committed-recovery API now **PARTIALLY IMPLEMENTS** that join as one atomic
operation. `RecoveredSystemState::bind_total_boot_admission` capability-
revalidates the persistent system/component settings, checks that the decoded
handoff's accepted epoch is the predecessor of the committed authority epoch,
composes the one-boot overlay, and binds the authenticated activated release
without returning a detached effective policy. Its builder variant supplies
only the recovered policy generation to release authentication/enumeration and
publishes no admission when that builder fails. The full stable-storage test now
continues through classified microVM route commit and
`TotalMicrovmRuntimeProof`; Windows and Arch Linux each pass all 44
configuration tests. The WHP/KVM component runners now construct and consume
this committed owner through the controlled hosted source. Fresh signed probes
report authority epoch 9, boot accepted epoch 8, configuration revision 1, one
eligible microVM, and zero native fallback on both backends. Production
stable-storage selection and installed early-boot orchestration remain
**PLANNED**, so this is not yet live recovered boot.

The deployment lane is defined in [DEPLOYMENT.md](DEPLOYMENT.md) and must not
displace the current foundational gate. Later work proceeds as separate bounded
milestones: package/boot-safe formats; release/generation state; Store/catalog;
A/B loader; images and servicing; typed read-only administration; destructive
storage transactions; text installer; unattended deployment; GUI projection.
Its first end-to-end acceptance target is the same signed image and text installer
creating and independently booting generation 1 on supported KVM and WHP. Physical
UEFI/NVMe/power-cut work is a later, separately evidenced gate.

**PARTIALLY IMPLEMENTED boot-image prerequisite:** one canonical signed package-
derived GPT/FAT image completed its exact authenticated 20-byte trace through
QEMU/EDK2 with TCG and WHPX on Windows and QEMU/KVM under Arch Linux/WSL2 on
2026-08-25. The bounded gate accepts only explicit `tcg`, `whpx`, or `kvm`
accelerators and reports the selected backend. Native MRML WHP/KVM runners now
execute bounded controlled firmware stubs from the architectural reset vector
and produced matching decoded I/O proof on both backends. WHP enforces RX
firmware and RW/NX low RAM at its GPA boundary; KVM's memory-slot API enforces
guest-read-only firmware but cannot encode NX. They still launch verified package payloads directly
rather than executing OVMF, but their
release-bound boot form now authenticates the identical `SYSTEM.RELEASE` and
exact kernel-package version/digest carried by that image. Fresh WHP and nested-
KVM runs reached the authenticated marker from that shared pair. Both runners
now delegate the package trust-root, identity, version, release-binding, payload-
selection, and payload-bound decision to one `no_std` package-format admission
function. Their focused verification mode decoded the same 2,232,432-byte
kernel payload before optimized live runs reached the expected halt. Native-runner
OVMF/device/boot-media integration and physical UEFI evidence remain **PLANNED**.

The independently serviced component lane is **PLANNED** in
[packages/COMPONENT_INTERFACES.md](packages/COMPONENT_INTERFACES.md) and follows,
without blocking earlier foundations: canonical package identity;
`SystemGeneration`; package resolver; loader and stable MRML ABI primitives; and
quantitative memory accounting. Then add the interface schema, typed
provides/requires metadata, exact resolver, immutable in-process loader,
generation-safe binding, Zstd ABI-3 provider, ZIM migration, Store servicing,
retention/GC and inspection, optional service form, and cross-compiler evidence.
Do not convert kernel dependencies or every Rust crate, and do not claim any of
these steps implemented before code and focused tests exist.

**PARTIALLY IMPLEMENTED prerequisite:** the native build tool validates
canonical MRML package identities separately from Cargo package and Rust crate
identity and constructs a bounded immutable `SystemGeneration` record with exact
package versions and artifact digests. Windows and Arch Linux tests cover exact
lookup and fail-closed malformed, zero, duplicate, noncanonical, empty, and
over-capacity inputs. Runtime provider resolution, admission, activation,
persistence, rollback, and the end-to-end component-interface lane remain
**PLANNED**; bounded prerequisite increments are recorded below.

The prerequisite now includes bounded exact package resolution from canonical
identity/version/digest requirements to identical immutable candidates and
bounded transitive closure from canonical exact roots. Closure preserves exact
cycles, emits canonical package order, and rejects conflicting, missing,
ambiguous, noncanonical, self-dependent, or over-limit graphs. It has no version
ranges, optimization, backtracking, network/catalog lookup, provider
substitution or admission policy. The resulting exact package records now have
a canonical bounded version-2 codec that rejects truncation, trailing bytes,
reserved fields, malformed identities, and noncanonical order. Activation,
authenticated crash-safe persistence, and broader package/component lifecycle
remain **PLANNED**.

Stable ABI groundwork now includes canonical interface identity/generation,
bounded borrowed-view validation, opaque generational handles, and a fixed
little-endian call-header codec. The bounded schema/generator prerequisite is
also **PARTIALLY IMPLEMENTED**: version-1 schemas have deterministic SHA3-256
fingerprints and pointer-free Rust bindings, with the canonical Zstd ABI-3
fixture reproducing byte-for-byte on Windows and Arch Linux. Native call
lowering, compiler-emitted conformance metadata, ABI diffs, runtime loading, and
standalone native provider execution remain **PLANNED**. The hosted Zstd ABI-3
byte-call adapter now exercises exact generated descriptors on Windows and Arch
Linux, including one supervised native task/service lifecycle.
Separate package-owned `org.mrml.zstd` provider and `org.mrml.zim` consumer
artifacts also build for the MRML-native target. Separately signed artifacts
now complete one exact-generation hosted microVM call and supervised cleanup on
WHP and nested KVM; this remains controlled hosted evidence rather than native-
service, host-resistant, physical, or general resolver evidence.
A complementary hosted native-service path creates the Zstd provider as a
distinct-address-space supervised `TaskRuntime` task, opens the unchanged ABI
data plane only after exact route commit, completes the same bounded request,
and retires the task only after address-space erasure. Cleanup uncertainty
retains the exact
endpoint for retry, and strict Total admission rejects native placement before
supervisor launch. This is native-service lifecycle/model evidence on Windows
and Arch Linux, not standalone MRML-image execution or physical isolation.
The native path now consumes the same `PreparedComponentServiceLaunch` used by
the focused microVM path: its control plane checks the exact interface
fingerprint and both authenticated image digests before invoking one selected
backend, then projects the committed route into direct IPC without per-message
resolution or policy lookup. Artifact mismatch invokes neither backend and
returns the complete uncommitted transaction. This implements the bounded
control-plane/shortest-safe-data-plane split for this hosted path only. The
shared no-allocation runtime resolver now validates canonical `MRMLSG2` bytes
against the recovered active generation and derives the WHP/KVM component
handoff from one exact in-generation consumer/provider and interface ABI,
fingerprint, and placement form. The focused runners no longer assemble their
artifact tuple directly. Manifest-driven runtime declaration delivery and the
same resolver-to-native-service dispatch remain **PLANNED**.
The kernel-side dependency gate now records a nonzero active system generation
alongside the policy generation in every isolation request and lifecycle
record. Configuration-derived service specifications use that active value;
the native Zstd binding and WHP/KVM commit paths reject or detect any stale
value before opening the data plane. Windows and Arch Linux kernel, Zstd, and
configuration suites plus WHP/KVM runner suites pass. The runners now stage and
commit their transient local generation and canonical interface-catalog digest
through a bounded capability-authorized, two-phase, one-use `DeploymentService`
activation transaction and construct kernel admission from its typed immutable
result. A canonical 224-byte version-2
activation checkpoint and one receipt-bound stable COW file transaction now
publish/recover the same record in focused Windows/Linux simulation; WHP/KVM
re-decode that checkpoint before admission. A separate fixed 256-byte version-2
authenticated recovery-state contract now compare-and-stores a monotonic epoch and pins the
exact volume/object/file generation plus activation/checkpoint identities;
focused Windows/Linux tests reject replay of an older valid file. A concrete
TPM/NVRAM/recovery-journal backend, physical durability, and general manifest-
driven launch remain **PLANNED**. The canonical build-tool-to-
kernel format itself is now **PARTIALLY IMPLEMENTED**: a shared fixed 344-byte
record carries the resolved system/provider/interface generations,
fingerprint, placement, applied policy generation, capability-selected object
IDs, separate SHA3-512 digests of the complete canonical `SystemGeneration` and
bounded canonical `MRMLIC1` interface catalog, and exact consumer/provider
digests. The shared no-allocation resolver derives the handoff from the two
active records without accepting requirement/provider declarations after
activation. Kernel decoding and both focused VMM runners reject substitutions—
including reused generation numbers with different generation or catalog
bytes—before backend invocation. A canonical build-tool builder now derives
requirements and provider forms from Manifest V2 declarations and passes two
focused malformed/order tests on Windows and Linux. Both VMM runners now embed
the real ZIM/Zstd manifests as declared build inputs, extract those fields with
the shared allocation-free codec, and remove their parallel declaration
constants. General workspace/release catalog artifact delivery remains
**PLANNED**. Windows/Arch Linux package-format 13, DeploymentService 4,
build-tool 89, and kernel 509 test
suites pass; WHP passes
7 and KVM passes 8.
Deployment candidates in both runners are now derived from the complete
canonical generation/catalog byte pair rather than caller-supplied digests;
cross-generation pairing fails before staging. A bounded general signed
`SystemRelease` codec and build/deployment path now authenticate that exact pair
and require the signer identity selected by caller policy before staging. The
public CLI consumes a one-use key to create the general `.mrs` and verifies it
against an explicit public root. WHP and KVM component probes now require that
artifact/root, stage only its exact candidate, and cross-check its roots against
the separately verified artifacts before Total-mode admission. Windows/Arch
Linux build tests pass 92 cases, WHP 7 and KVM 8. Fresh optimized runners
independently emitted byte-identical canonical records from freshly signed
current artifacts and then consumed the same 99,064-byte `.mrs`: WHP completed
the data path/cleanup and nested KVM reported `eligible=1`, `microvm=1`,
`native_fallback=0` before the expected halt. Store/recovery delivery and
owner-root policy integration remain **PLANNED**.
A backend-neutral linear control-plane admission now binds those two immutable
load plans to the exact generation/interface placement before an endpoint
exists. Only a subsequently returned backend endpoint can be published into the
generational binding table. Package/form/artifact mismatch, Total exceptions,
or table exhaustion publish no new endpoint reference and preserve existing
bindings; publication failure returns the complete launch and endpoint for
teardown. Windows and Arch Linux build-tool suites pass 78 tests. Canonical
kernel handoff is now exercised by the focused WHP/KVM component path; general
resolver-driven runtime invocation remains **PLANNED**.
The kernel-side prepared launch handoff now carries the same two digests plus
the exact interface fingerprint/generation and provider generation while
retaining the uncommitted fail-closed isolation route. Backend verification of
those digests and two-image builder attachment are **PARTIALLY IMPLEMENTED** in
both WHP and KVM adapters: mismatch precedes mapping and a second-image failure
cannot publish the consumed builder. Package-artifact execution is **PARTIALLY
IMPLEMENTED** for that one signed ZIM/Zstd hosted probe.

Loader groundwork now validates exact immutable package image geometry and W^X
section plans, including an executable entry point, without parsing, relocating,
mapping, patching, resolving symbols, or binding a provider. Runtime loading and
all binding/lifetime behavior remain **PLANNED**.

Kernel memory-accounting groundwork now charges one immutable component code
object once to an existing `MemoryPool` and permits separately authorized,
bounded read/execute mapping reservations for multiple consumers. The object
capability contains no write right, live mappings block reclamation, and package
metadata cannot substitute for pool or target capabilities. Physical backing,
population/sealing, native mapping, private-state charges, and runtime provider
binding remain **PLANNED**. The focused hosted component profile now also
charges its fixed-capacity task runtime and supervisor to one exact memory pool
and proves both commitments return after supervised cleanup; executable/private
pages and device projections remain unaccounted in that path. A separate kernel
guest-RAM reservation prerequisite now charges an
exact non-executable `Guest` `MemoryObject` under a pool capability, rejects
overcommit or metadata-only allocation, and requires proven native teardown
before release. The signed component profile now consumes exact backend-
specific base, consumer/provider, and shared/resource phases before WHP/KVM
native allocation, requires complete consumption before admission, and returns
the object after confirmed guest teardown. Fresh WHP and nested-KVM probes pass.
The vCPU prerequisite is now **PARTIALLY IMPLEMENTED** in the kernel: a
fixed-capacity generational CPU budget binds parallelism, runtime/period,
priority ceiling, and affinity to capability authority and issues exact
domain-bound reservations without amplification. The signed component path now
reserves one vCPU before WHP/KVM construction, retains it through guest lifetime,
and reclaims it after teardown. Exhaustion consumes the Total route into typed
unavailability with zero fallback. Each runner also pre-reserves a separate
page-rounded anonymous object for its exact MRML-owned prepared guest structure,
retains that charge through teardown, and requires the pool to return to zero.
The focused shared data and resource pages are no longer hidden in aggregate
guest RAM: each has a distinct one-page shared object and exact guest mapping
reservation, with a two-slot ceiling and native-teardown-first reclamation on
WHP and KVM. This deliberately excludes opaque host-hypervisor allocations.
The focused profile now also accounts both verified PE images before
construction: exact R/RX shared regions, private RW regions, and private
allocation gaps use distinct consumer/provider address-space capabilities and
are reclaimed only after guest teardown. Windows/Linux kernel suites,
WHP/KVM runner suites, and fresh signed hosted probes pass; KVM reports zero
native fallback. Scheduler enforcement, native physical backing, other
profiles, and broader device-specific projection accounting are the current
gates.

The vCPU budget now has **PARTIALLY IMPLEMENTED** runtime enforcement: one
explicit fixed period, a shared allowance across parallel reservations, and
exact maximum-slice precharging before each focused component vCPU entry.
Every slice is linear and must be reconciled exactly once after the backend
returns. A verified underrun refunds only unused precharge; mismatch, replay,
release while in flight, time regression, exhaustion, and period crossing fail
closed. An overrun retains the full charge and reports failure. Successful
authorization retains the exact domain, vCPU, logical CPU, and priority
decision for the runner. A reservation now retains one distinct bounded linear
slice slot per vCPU, up to the existing 64-vCPU/affinity ceiling, while every
simultaneous slice still precharges the one shared period allowance. Sibling
reconciliation cannot retire or refund another vCPU's charge; any unresolved
slot blocks release and period rollover. This is kernel simulation groundwork;
the signed hosted component profile still executes one vCPU.
Windows and Arch Linux kernel suites pass 512 tests, the WHP runner passes 7,
and the KVM runner passes 8. A backend-neutral deadline contract now arms
cancellation before entry and waits for the cancellation worker to retire before
return or teardown. WHP uses `WHvCancelRunVirtualProcessor`; KVM sets
`immediate_exit` and sends a reserved no-op signal to interrupt `KVM_RUN`.
Focused live infinite-loop guests expire on both backends. The authorized
logical-CPU decision now crosses a separate backend-neutral affinity contract:
WHP and KVM bind the runner before entry and restore its complete prior affinity
only after the deadline worker and vCPU run have retired. Unsupported CPU
indices, bind failure, or restoration uncertainty fail closed. Fresh signed
hosted component probes completed normally on logical CPU 0 and reconciled
1,466 microseconds on WHP and 1,385 microseconds on KVM; KVM reported one
eligible microVM and zero native fallback. These are host-scheduled cancellation
and affinity mechanisms plus conservative host-wall measurements, not trusted
CPU-time, exact latency, APIC enforcement, physical-topology evidence, or a
boundary against a compromised host. Native APIC deadlines, priority-class
expansion beyond the newly enforced host-normal class, multiple profiles/vCPUs,
and general scheduler integration remain current gates. The focused profile's
priority ceiling and every issued slice are now exactly 0. A separate shared
contract applies Windows `THREAD_PRIORITY_NORMAL` or Linux `SCHED_OTHER` with
scheduler priority 0 before entry, verifies the applied state, and restores and
verifies the complete prior native state after affinity, vCPU, and deadline-
worker retirement. Any nonzero class or uncertain transition fails before
successful return.

The signed two-vCPU kernel probes now cross a separate backend-neutral
`ScheduledSmpVmBackend` contract. Before either runner starts, one bounded CPU
budget reserves two vCPUs and simultaneously precharges two 100-millisecond
slices from one shared 200-millisecond allowance. WHP and KVM apply the exact
logical-CPU 0/1 and host-normal decisions inside the two native runner threads,
arm a per-runner deadline across every intermediate exit, restore native
scheduling state after each runner and cancellation worker retire, report each
runner's host-wall elapsed time, and reconcile the two slices independently
before releasing the reservation. Fresh release probes measured bootstrap/AP
times of 6,519/3,593 microseconds on WHP and 4,601/4,229 microseconds on nested
KVM.

The next dependency gate is now implemented for one focused component profile.
The exact signed ZIM/Zstd Total-mode route reserves two vCPUs and one shared
200-millisecond allowance before construction, prepares the same two-vCPU guest
on WHP and KVM, requires the BSP/AP SMP proofs under separate deadlines, then
continues the BSP through the already-bound ABI-3 component data plane. The AP
halts after its proof. Service/control-plane construction is kept behind a
no-inline boundary so early SMP startup retains its fixed guarded stack. Fresh
one-use-signed probes measured 6,089/3,984 microseconds on WHP and 4,415/4,086
microseconds on nested KVM; both reported one eligible microVM and zero native
fallback. This is hosted signed multi-vCPU component evidence, not trusted CPU
time, physical-topology evidence, broad Total-mode readiness, or a host-security
boundary.

Typed provider-resolution groundwork now matches canonical `REQUIRES` and
`PROVIDES` edges only inside an immutable `SystemGeneration`. Interface name,
major generation, and schema fingerprint must all be byte-identical; resolved
records retain exact consumer/provider package versions and artifact digests.
Manifest V2 and `mrml.lock` also retain the exact in-process versus isolated-
service form; consumer/provider form mismatch fails closed. Bootloader and
recovery packages reject ordinary dynamic interface requirements regardless of
form.
ABI-4 cannot satisfy ABI-3, ambiguity fails instead of choosing a preferred
provider, and no path or filename participates. Live generation-safe binding,
policy preference, activation, and loading remain **PLANNED**.

Generation-safe binding identity is now **PARTIALLY IMPLEMENTED** in the build
tool model. Fixed-capacity generational slots retain exact resolved
consumer/provider package records and a generation-tagged in-process executable
or isolated-service endpoint. Existing entries cannot be retargeted during an
update, and released slot identities cannot address replacements. Runtime
capability authorization, executable admission/mapping, call dispatch,
reference accounting, and process integration remain **PLANNED**.

The canonical `org.mrml.zstd` provider and `org.mrml.zim` consumer migration are
**PARTIALLY IMPLEMENTED** as hosted code and focused tests. ZIM depends on the
separate ABI-3 binding package, declares the isolated-service form, and no
longer names a provider crate or path. Zstd declares native-service or microVM
placement and supplies a bounded service-side kernel IPC/shared-buffer adapter.
The existing Wikipedia composition root still directly supplies the provider
in its host build. A standalone `org.mrml.zstd` x86-64 UEFI service artifact now
builds through `mrml` on Windows and Arch Linux with exact launch-register and
syscall-frame bindings. Its allocation-free one-page target floor handles
raw/RLE frames and rejects entropy-coded blocks. This proves target build and
format plus one separately signed hosted execution with the ZIM consumer on WHP
and nested KVM. It does not prove general resolver-to-launch dispatch,
update-without-consumer-rebuild, standalone native-image execution, or physical
isolation. The separate hosted supervised path does prove native-service
placement through the kernel task/service model, but does not execute this EFI
artifact or connect the generation resolver to launch.

Servicing retention and inspection are **PARTIALLY IMPLEMENTED** as a bounded
build-tool model. Exact live bindings and retained system generations, rollback
roots, snapshots, exports, and disabled package-GC policy independently block
reclamation. Prohibited providers are denied for new bindings without erasing
retained content. No package deletion, persistent root discovery, update
transaction, or running-system integration is implemented.

The isolated-service form is **PARTIALLY IMPLEMENTED** as both the existing
hosted endpoint adapter and one service-side kernel composition around the
identical ABI-3 byte descriptors. The latter exercises a real `TaskRuntime`
inbox and one attenuated read/write shared-buffer capability, with exact
VM/task projection, private erased scratch, and bounded output. Windows and
Arch Linux host suites pass. A bounded userspace loop also receives one exact
request/capability, sends one exact response through a launch-bound runtime
trait, releases the leaf, and erases all buffers. A hosted `TaskRuntime` adapter
exercises a complete request/reply round trip,
rejects an unexpected sender, uses separate reply authority, and withholds the
reply unless received-leaf revocation succeeds. Its construction now consumes a
committed route retaining domain, interface/provider/policy generations,
Total-mode class, and placement, and rejects disagreement with the expected
resolver/policy binding. A canonical MRML-target provider binary and concrete
x86-64 trap now run with the separately signed ZIM consumer in the focused WHP
and nested-KVM microVM probe. Its fixed task runtime and supervisor are RAM-pool
accounted and reclaimed after cleanup. General resolver dispatch,
standalone native-image execution, guest RAM/vCPU/device accounting, and
physical isolation remain unproved. Hosted native-service parity now covers one
supervised exact-generation task, request/reply, revocation, and retryable
cleanup path on Windows and Arch Linux. The host-tested register adapter maps
the loop to exact
operations 5, 7/8, 12, and 4 and proves capability release precedes response
visibility.

Cross-compiler evidence is **PARTIALLY IMPLEMENTED** for one narrow descriptor
identity projection. On both Windows gnullvm and Arch Linux, the canonical MRML
test action passed the 420 compiler-core tests, one component-interface test,
10 general conformance tests, and 335 nightly-replacement tests. The new test
executes the upstream-rustc reference and requires `mrml-rustc` to emit both
COFF and ELF objects. It does not establish full generated-binding support,
native MRML call lowering, object equivalence, or stable Rust/C component ABI.

Within existing boot/deployment phases, add typed UEFI objects, verified installer
entry creation, shell boot administration, owner/compatibility/dbx policy, then
physical firmware tests per
[UEFI_BOOT_MANAGEMENT.md](platform/UEFI_BOOT_MANAGEMENT.md). Within existing
service/device phases, add typed Ethernet, Wi-Fi, Bluetooth, persistent secret-
referencing profiles, shell operations, semantic Network & Devices, installer/
recovery reuse, and power integration per
[NETWORK_ADMINISTRATION.md](network/NETWORK_ADMINISTRATION.md). These are not new
mega-phases and do not displace the current gate.

The modern x86-64 platform lane is defined in
[platform/CPU_PLATFORM.md](platform/CPU_PLATFORM.md). Do not begin its broad
implementation ahead of the current foundational dependency gate. When reached,
split it into discovery/support-floor, vendor microcode and post-update security
state, scheduler constraints/CPU budgets, power/telemetry/thermal safety, system
monitor, and physical-device milestones rather than one cross-cutting patch.

**PARTIALLY IMPLEMENTED:** the kernel has bounded IPC, blocking receive/wakeup,
two-message inbox backpressure, attenuated capability transfer with rollback,
generational revocation, bounded exact-generation IPC delegation tracking,
transitive descendant revocation, shared-memory bindings, mapping revocation,
fault retirement, service cleanup/restart policy, and signed two-service probes.
Kernel-owned receive envelopes now retain exact sender and endpoint sequence,
and bounded explicitly linked peers receive typed fault/exit results with
scheduler wakeup. Cross-CPU peer migration remains fail-closed until ownership
transfer for those relations is implemented.
The host-resource table now supports capability-authorized multi-party sharing
of one exact host extent across distinct VM mappings. Each added endpoint
independently proves mapping authority and liveness, cannot amplify the source
access, and must remain NX. Per-endpoint revocation reports when the final
reference is gone without exposing the opaque host handle to a guest.
Backend-neutral revocation now removes the exact KVM memory slot or every WHP
GPA submapping before retiring the common mapping identity. Any uncertain
native teardown poisons subsequent vCPU execution. Live Linux KVM and Windows
WHP probes now also exercise stopped-task leaf revocation for a common service
page while the peer mapping and backing remain live.
Service retirement now preflights restart timing and publishes an exact one-use
cleanup ticket. Restart remains blocked until the corresponding KVM/WHP eraser
proves the retired task and page-table root and completes exact-artifact
reprovisioning; failed erasure is retryable and ticket replay is rejected.
Shared endpoints may now bind an exact task generation in addition to their VM
and mapping identities. Cleanup invalidates each failed task's native mapping
before retiring its common mapping and binding, preserves peer endpoints, and
requires successful final host-resource retirement before restart. Completed
obligations survive retry across host-resource or address-space erasure failure.
The supervisor now exposes one bounded recovery operation that retires the
faulted task, publishes typed peer death, completes the caller-supplied
task-resource/address-space eraser, and creates a fresh service/task generation
from an independently validated context before returning the surviving peer's
scheduling outcome. Cleanup failure retains the exact ticket for retry; restart
rejection leaves a clean stopped service that can be authorized and retried
separately. Freshly signed WHP and KVM runs now exercise cleanup-ticket-gated
per-slot address-space reprovisioning across clean exit, fault, restart, and
restart-budget exhaustion. The general task-owned shared-binding/opaque
host-resource composition remains simulation-tested; the signed service path
now exercises its concrete one-page hosted realization on both backends.
Those signed paths now also establish an exact-generation control-peer relation
in each generation. Clean sender exit publishes a typed `Exited` result; the
kernel verifies its retired task identity and the queued message envelope's
sender and endpoint sequence before receiver continuation.

The next coherent milestone is an end-to-end service substrate: two isolated
CPL3 services communicate through a multi-client blocking control channel and a
revocable shared-page bulk channel; one service is deliberately crashed; the
kernel revokes its capabilities, mappings, IPC and shared state; peers receive a
typed death result; the supervisor performs one bounded clean restart; and the
unrelated service continues. Exercise equivalent signed paths under WHP and KVM
and add adversarial unit tests. This milestone must not claim host-resistant
confidentiality.

The signed two-service path now covers the blocking control channel, exact
sender/sequence envelopes, typed clean peer death, a revocable task-owned
shared page, cleanup-gated fault retirement, and bounded restart on both hosted
backends. The replacement generation now leaves its sender blocked and live
while the receiver faults; retirement publishes and validates the exact typed
fault result before returning any peer continuation. This closes the signed
two-service Phase 1 substrate gate. The next dependency-ordered OS milestone is
the Phase 2 policy/configuration service and its supervision protocol.

## Concurrent compiler lane

The separate build-tool lane follows [build/BUILD_SYSTEM.md](build/BUILD_SYSTEM.md):
manifest, pinned upstream orchestration, profiles, EFI export, packaging/signing,
release/image/publication, provenance, experimental `mrml-rustc`, then per-profile
promotion. It cannot redirect this compiler lane or the foundational OS gate.

**PARTIALLY IMPLEMENTED:** stage-zero `packages/tools/mrml`, root and package-local
`mrml.toml` manifests, structured native build/test dispatch, native dependency resolution, current-host VMM
selection, UEFI routing, and CUDA target validation now exist. All tracked
components have semantic homes outside generic `crates/`. Follow
[build/MIGRATION_INVENTORY.md](build/MIGRATION_INVENTORY.md): make compiler inputs
and actions exact, replace compilation with direct rustc, prove Windows/Linux
parity, then confine Cargo to clean-source bootstrap. Package/release/image/
publication remain planned.

The native-resolver audit increment is now implemented: `mrml doctor` validates
all 45 components and their declared edges without invoking Cargo metadata, and
`mrml audit` emits dependencies, features, outputs, build scripts, proc macros,
and bounded source-input sites. Missing dependencies, invalid targets, empty
outputs, self-dependencies, and cycles fail closed. Dependency, feature, output,
and per-component input-policy facts are native version-3 declarations that fail
on graph or lexical-audit drift. The first
semantic leaf move is complete: dependency-free `mrml-math` now resides under
`packages/libraries/math`; its explicit build/test action now invokes pinned
rustc directly with no Cargo fallback. The dependency-free Windows and Linux
platform leaves now have the same exact action; Windows GNU/LLVM and Arch Linux
WSL2 build/test evidence exists, without implying KVM, bare-metal, or physical-
hardware verification. The next leaf,
`mrml-percent-encoding`, now resides under `packages/libraries/percent-encoding`
with its runtime edge and Cargo bridge retained. Continue one dependency-light
leaf at a time before group moves; `mrml-tokenizer` is now the third migrated
leaf with its trainer edge retained. See
[build/BRIDGE_INVENTORY.md](build/BRIDGE_INVENTORY.md).

`mrml-runtime` is now the first dependent direct-rustc node: the native planner
builds and wires only the target-active platform extern. Windows passed 38 tests
and Arch Linux WSL2 passed 37 without Cargo compilation for those nodes.

The next eight featureless runtime consumers are now direct-rustc nodes as well;
Windows and Arch Linux WSL2 each passed 31 tests across that layer. Twelve of 42
components now have native actions, with the other 30 explicitly transitional.

The compiler core is the first multi-output native node: its inline harness and
both integration targets run directly with an explicit bounded test stack.
Windows and Arch Linux WSL2 each pass 765 compiler-core tests. Thirteen of 42
components are native; 29 remain transitional.

Native example outputs are now exact. `mrml-opus` passes 179 tests and links all
three declared examples on both hosts, bringing the native count to 14 of 42.

Native feature sets and optional extern gates are now exact for `mrml-av1`.
The empty default set omits its `nvidia` platform extern while retaining the
runtime edge; both Windows and Arch Linux WSL2 build the library and declared
example directly. With its declared 32 MiB test stack, each host reproduces the
Cargo baseline at 273 passing and two existing source-test failures. Fifteen of
42 components are native; 27 remain transitional.

`mrml-crypto` is the first nonempty native feature-set consumer. Its resolved
default set selects `runtime`, activating the already-native runtime extern;
Windows and Arch Linux WSL2 each pass all 27 direct tests. Sixteen of 42
components are native; 26 remain transitional.

`mrml-tls` now consumes the exact native crypto/runtime artifacts. Windows and
Arch Linux WSL2 each pass all 11 direct tests; environment-selected live-peer
and external-fixture paths were not exercised. Seventeen of 42 components are
native; 25 remain transitional.

`mrml-http` now consumes exact native runtime/TLS artifacts. Windows and Arch
Linux WSL2 each pass all three direct tests; environment-selected live URL and
range probes were not exercised. Eighteen of 42 components are native; 24
remain transitional.

`mrml-ssh` now consumes exact native crypto/runtime artifacts. Windows and Arch
Linux WSL2 each pass all 23 direct tests, including loopback transport; no live
remote or external signing operation was exercised. Nineteen of 42 components
are native; 23 remain transitional.

Exact native binary outputs and compile-time environment records are now
implemented. `mrml-git` builds its library and executable on both hosts, then
passes 51 library tests plus one binary test. No live remote operation was
exercised. Twenty of 42 components are native; 22 remain transitional.

`mrml-tools` now has an exact resolved `runtime` feature set, stable manifest
path input, six universal externs, and one target-selected platform extern.
Arch Linux WSL2 passes 32 direct tests; Windows matches its Cargo baseline at
31 passed and one installed-Edge DevTools failure. Twenty-one of 42 components
are native; 21 remain transitional.

Bin-only native actions now declare the absence of a primary library, require
exact binary outputs, and cannot satisfy an extern edge. The compiler driver
builds `mrml-rustc` and passes both tests on Windows and Arch Linux WSL2.
Twenty-two of 42 components are native; 20 remain transitional.

Native feature profiles now cover every component target exactly once.
`mrml-crypto` keeps `runtime` for Windows/Linux and selects the empty set for
`MRML_NATIVE`; both hosts cross-build the latter as an `x86_64-unknown-none`
rlib without a runtime extern. This is cross-build evidence, not execution.

Named provider profiles now resolve, cache, and name nondefault dependency
artifacts independently. The kernel binds crypto's empty `core` profile on
`MRML_NATIVE` and in its host harness, so host verification cannot silently
activate crypto's default `runtime` feature. Both hosts cross-build its
`x86_64-unknown-none` rlib, then independently compile and run the explicitly
declared 64 MiB host harness with 474 passing tests. Twenty-three of 42
components are native; 19 remain transitional. This does not establish target,
bare-metal, virtualization, or physical-hardware execution.

The kernel now declares Windows/Linux as exact host-build projections without
adding them to its public `MRML_NATIVE` target set. Storage uses that projection
to bind native kernel mechanics plus crypto's empty `core` profile. Both hosts
cross-build `mrml-storage` for `x86_64-unknown-none` and pass its declared 64 MiB
host harness with 121 tests. Twenty-four of 42 components are native; 18 remain
transitional. No physical storage, target execution, or durability evidence is
claimed by this build migration.

Configuration now has an exact native action over crypto's empty `core` profile,
kernel, and storage. Both hosts cross-build it for `x86_64-unknown-none` and run
all 31 tests through the declared host projection. Twenty-five of 42 components
are native; 17 remain transitional. This does not establish signed-service,
target-runtime, or physical-hardware execution.

Compiler-target variants are now explicit, allowlisted, dependency-transitive,
and artifact-separated from the semantic target's default triple. The service
image remains in `MRML_NATIVE` policy while its complete graph compiles for
`x86_64-unknown-uefi`; both hosts emit a PE32+ EFI application in debug and
release modes. Repeated same-host hashes are stable, but Windows/Linux hashes
differ, so cross-host reproducibility is not established. Twenty-six of 42
components are native; 16 remain transitional. No UEFI or service runtime ran.

The kernel benchmark harness now has a native action over the host-projected
kernel and runtime. Windows discovers 14 tests and Linux 13; all are explicitly
ignored manual performance gates, and none ran. This is compile/registration
evidence only, not benchmark or physical-core evidence. Twenty-seven of 42
components are native; 15 remain transitional.

Non-host projected builds now require an explicit provider declaration, and
compile-environment inputs distinguish fixed values from enforced absence.
Kernel-image selects exactly `kernel-image`, projects kernel/crypto-core to UEFI,
and emits a PE32+ EFI application on both hosts. Deliberately inherited values
for all four optional `MRML_*` inputs are removed and do not change the resulting
same-host hash. Twenty-eight of 42 components are native; 14 remain transitional.
No UEFI firmware, Secure Boot, TPM, bare-metal, or hardware execution occurred.

Native binary actions now bind exact target and feature gates, and an explicit
UEFI selector is preserved instead of being replaced by the default kernel
image. `mrml-uefi` builds its library on hosts, emits the loader only for UEFI
with `uefi-image`, and passes 24 projected tests on each host. Both hosts emit a
PE32+ EFI application; a Windows poisoned-environment probe leaves the hash
unchanged across all 21 absent inputs. Twenty-nine of 42 components are native;
13 remain transitional. Tests use simulated TPM transports, not TPM hardware.

Native profile identity now includes a stable rustc metadata discriminator, not
only the artifact filename and build key. This permits the signing tool's direct
host-default crypto dependency to coexist with kernel's crypto-core dependency.
`mrml-sign` builds and passes eight temporary-file tests on both hosts. Thirty of
42 components are native; 12 remain transitional. No live key, enrollment,
firmware, or hardware signing operation occurred.

Native extern scope now distinguishes production from test-only direct edges.
KVM's direct crypto-core dev edge is active only in its harness, while kernel's
transitive production crypto-core edge remains. On Arch Linux WSL2, `/dev/kvm`
was usable and 18 tests passed, including conditional API and signed-guest
probes; one manual live-mapping performance gate remained ignored. Thirty-one of
42 components are native; 11 remain transitional. This is nested KVM evidence,
not bare-metal, IOMMU, TPM, or physical-hardware evidence.

WHP now has the corresponding native Windows action with production kernel and
runtime externs and a test-only crypto-core dev edge. Native and Cargo baselines
each pass 22 tests with one manual performance gate ignored. A separate run of
that gate completed 10,000 WHP map/revoke iterations, directly establishing WHP
API and hosted-hypervisor mapping execution on this Windows host. The exact Linux
toolchain passes the declaration frontend tests, Clippy, doctor, and audit but
does not build or run this Windows-only component. Thirty-two of 42 components
are native; 10 remain transitional. This is not VTL1, TPM, IOMMU, bare-metal, or
physical-hardware evidence.

Tensor now replaces its Cargo-only custom build execution with a declared PTX
sub-action. It validates the required GPU architecture, invokes the pinned
nvptx rustc with fixed arguments, supplies the exact generated `OUT_DIR`, keeps
CUDA host artifacts separate by ABI triple, and accounts for every test,
example, and benchmark output. Windows gnullvm and Arch Linux WSL2 each match
Cargo's 43-test CUDA baseline, run the focused CUDA prefill probe, and emit the
same `sm_120` PTX hash. Thirty-three of 42 components are native; nine remain
transitional. This is controlled CUDA driver/device evidence, not proof of
physical GPU topology, passthrough isolation, or native MRML GPU execution.

The model library's default `runtime` profile now directly consumes native JSON,
runtime, and tensor artifacts. Both exact host toolchains build it and match the
Cargo baseline at seven passing tests. Thirty-four of 42 components are native;
eight remain transitional. No production model, remote service, CUDA profile,
or inference workload was exercised.

Compile-time environment declarations now include a bounded source-use count.
Agent binds one exact `CARGO_PKG_VERSION=0.0.1` value to its two audited reads,
then its default `runtime` profile directly consumes the eight native providers.
Both exact hosts build it and match Cargo at 20 passing tests. Thirty-five of 42
components are native; seven remain transitional. No configured live Hugging
Face query, remote inference, model workload, or CUDA agent profile ran.

The trainer is now a native bin-only action with exact math, runtime, tensor,
tokenizer, and Wikipedia providers. Both exact hosts build it and match Cargo
at four passing tests. Thirty-six of 42 components are native; six remain
transitional. Only bounded generated test data ran; this is not production
corpus, sustained training, CUDA, or physical-hardware evidence.

The WHP runner now has an exact Windows bin-only action matching the bridge's
deliberate `--no-default-features` build. Native and Cargo suites both pass its
seven tests. Thirty-seven of 42 components are native; five remain
transitional. The declared CUDA edge remains inactive, and no VM, VBS/VTL1,
IOMMU, or physical-hardware execution occurred.

CLI and machine now preserve their default `auto` chain through named agent,
model, and tensor profiles. Recursive native compilation generates the declared
`sm_120` PTX input at tensor instead of depending on Cargo or a prior build.
Windows and Linux match Cargo at zero CLI tests and four machine tests, with an
identical PTX hash. Thirty-nine of 42 components are native; three remain
transitional. No CUDA device, inference, live provider, or production workload
ran.

Server now compiles its library and self-linked binary natively while binding
one `auto` model artifact on both its direct edge and the edge through agent.
Windows and Linux match Cargo at four library tests and a zero-test binary
harness. Forty of 42 components are native; two remain transitional. No live
listener, TLS endpoint, remote model, CUDA device, or production traffic ran.

The KVM runner now compiles natively on Linux with its exact core-crypto,
kernel/KVM, runtime, and tensor `cuda` providers. Arch Linux WSL2 matches Cargo
at eight tests. Forty-one of 42 components are native; only the `mrml`
clean-source bootstrap remains transitional. No VM, bare-metal, IOMMU, GPU, or
physical-hardware execution occurred.

The native build graph is complete: `mrml` now self-builds/tests through its own
bin-only action, workspace loading rejects any missing native action, and the
internal Cargo transition branch is removed. Locked clean-source bootstrap plus
doctor/audit, native self-build, and 12 self-tests passes on both exact hosts.
All 42 components are native. Cargo remains only stage zero; package, release,
image, install, and publication milestones remain independently incomplete.

`mrml-zstd` is the fourth migrated leaf; its Wikipedia edge and patent-review
source path now resolve to `packages/libraries/zstd` without changing codec
behavior.

`mrml-zim` is the fifth migrated leaf; its Wikipedia edge now resolves to
`packages/libraries/zim` without changing archive semantics.

`mrml-json` is the sixth migrated leaf; its six consumer edges now resolve to
`packages/libraries/json` without changing parser/writer semantics.

`mrml-wikipedia` is the seventh migrated library component; its ZIM/Zstandard
edges are now sibling semantic-package references and its trainer edge remains.

`mrml-opus` is the eighth migrated library component; its math edge is now a
sibling semantic-package reference without changing codec behavior.

`mrml-windows` is the ninth migrated library component; its six consumers now
resolve to the semantic package without changing Windows primitive behavior.

`mrml-linux` is the tenth migrated library component; its five consumers now
resolve to the semantic package without changing Linux/Unix primitive behavior.
This Windows-host move does not establish Linux execution evidence.

`mrml-runtime` is the eleventh migrated library component; its Windows/Linux
edges are now sibling semantic-package references and all thirty-one inbound
Cargo paths across thirty manifests resolve to the semantic runtime home without
changing runtime behavior.

`mrml-crypto` is the twelfth migrated library component; its runtime edge is a
sibling semantic-package reference and all fourteen inbound Cargo paths resolve
to the semantic cryptography home without changing algorithms or policy.

`mrml-tls` is the thirteenth migrated library component; its crypto/runtime
edges are sibling semantic-package references and both consumers resolve to its
semantic home without changing protocol behavior.

`mrml-http` is the fourteenth migrated library component; its TLS/runtime
edges are sibling semantic-package references and both consumers resolve to its
semantic home without changing HTTP/HTTPS behavior.

`mrml-ssh` is the fifteenth migrated library component; its crypto/runtime
edges are sibling semantic-package references and its Git consumer resolves to
the semantic SSH home without changing protocol or signing behavior.

`mrml-error` is the sixteenth migrated library component; its JSON/runtime
edges are sibling semantic-package references and all eleven consumers resolve
to its semantic home without changing error behavior.

`mrml-terminal-style` is the seventeenth migrated library component; its
platform/runtime edges are sibling semantic-package references and all five
consumers resolve to its semantic home without changing terminal behavior.

`mrml-av1` is the eighteenth migrated library component; its platform/runtime
edges are sibling semantic-package references without changing codec,
conformance, or feature behavior.

The compiler lane has moved dependency-free `mrml-rustc` to
`packages/compiler/core`; its driver edge and durable recovery/oracle/review references
now resolve there without changing compiler semantics.

The compiler driver now resides at `packages/compiler/driver`; its core/error/runtime
edges resolve to semantic homes without changing command behavior.

`mrml-git` now resides at `packages/tools/git`; all declared dependency edges
resolve to semantic packages without changing Git or SSH behavior.

`mrml-tools` now resides at `packages/tools/host`; all eight dependency edges resolve
to semantic packages and all four consumers resolve to the host-tool home
without changing input policy or tool behavior.

The independently scoped compiler lane follows
[COMPILER.md](COMPILER.md), not an arbitrary historical-rustc coverage target.
Rust 2024 is the floor. Preserve and stabilize the existing bounded semantics,
then prioritize:

1. an explicit typed ownership/place/control-flow representation;
2. move, shared-loan, mutable-loan, reborrow, and flow-sensitive outlives
   analysis toward modern Polonius semantics;
3. bounded modern trait-goal, canonicalization, where-clause, normalization,
   coherence, ambiguity, recursion, and cycle foundations;
4. post-2024 systems gaps, especially naked functions/`naked_asm!`, validated
   inline assembly, strict provenance, modern const behavior, and `no_std`/ABI
   facilities needed by MRML;
5. Application, System, and Compiler/Kernel admission profiles;
6. compiler-derived executable security metadata and loader validation; and
7. reproducible advancement through exact recorded future-Rust oracles.

The highest-value next major compiler milestone is the bounded typed
ownership/place/CFG representation needed by both sound borrow checking and
future dataflow analyses. Smaller aggregate, pattern, control-flow, and
diagnostic prerequisites remain appropriate when they directly unlock that
model. Old-edition parsing, historical unsoundness, rustc diagnostic wording,
unstable symbol/ABI quirks, and legacy cases with no current MRML dependency are
deprioritized.

Compiler candidates are ranked by MRML usefulness, modern Rust relevance,
security relevance, dependency unlocks, implementation complexity, oracle
stability, and testability—not superficial upstream test counts. The compiler
and OS lanes progress concurrently and converge when real MRML services compile
under validated profiles; neither waits for the other to become complete.

## Phase 1 — Kernel and service foundation

1. Complete multi-client blocking send/receive and scheduler sleep/wakeup.
2. Define bounded queues, backpressure, cancellation/timeout policy, and typed
   peer-death behavior.
3. Complete atomic capability transfer/derivation with non-amplification tests.
4. Complete transitive revocation accounting for IPC and descendants.
   **IMPLEMENTED:** successful transfers commit bounded exact-generation
   delegation edges; explicit source or intermediate revocation and task death
   revoke the complete descendant set before another task can run. Capacity is
   preflighted, denied transfers roll back both handles and edges, and domains
   with live delegation relations cannot migrate.
5. Add shared-page/ring setup with explicit ownership and access attenuation.
   **IMPLEMENTED** for the bounded one-page service substrate: KVM and WHP map
   one common frame through independent exact user read/write leaves, revoke
   only the retired task's leaf while preserving its peer, and re-arm leaves
   only after fresh task generations exist. General multi-page ring protocol,
   backpressure, and application-facing setup remain later work.
6. Pair mapping revocation with native KVM/WHP invalidation before vCPU resume.
   **IMPLEMENTED** in code, focused tests, and signed hosted probes. The vCPU is
   stopped for exact-leaf removal; the next service transition reloads CR3
   before peer continuation, and stale retired roots are never resumed.
7. Integrate fault cleanup, peer notification, erasure, and bounded restart.
   **IMPLEMENTED** in kernel mechanism and focused simulation tests: typed peer
   notification, task-domain revocation, native-first task-owned shared-resource
   cleanup, final host-handle retirement, exact erasure gating, and bounded
   restart are coupled through one supervised recovery operation. Cleanup and
   restart failures retain retryable fail-closed state. Signed KVM and WHP runs
   exercise exact per-slot address-space cleanup before restart plus
   exact-generation control-peer reconstruction, typed clean-death delivery,
   per-task shared-leaf revocation, surviving-peer access, and fresh-generation
   re-arm. The broader opaque host-resource composition remains outstanding
   live evidence rather than a missing kernel mechanism.
8. Benchmark one-way, round-trip, cross-core, wakeup, transfer, revocation, and
   shared-memory setup costs.
   **IMPLEMENTED:** release microbenchmarks cover backend-neutral
   one-way and round-trip IPC policy, blocked wakeup, capability transfer and
   revocation, shared-binding setup, and cross-runtime domain handoff. Windows
   evidence now includes a topology-validated affinity-pinned distinct-core
   mailbox round trip and live WHP map/revoke lifecycle; an Arch Linux/WSL2
   `/dev/kvm` run covers the matching KVM allocation/map/revoke lifecycle.

Security gate: no stale identity, capability, mapping, queue entry, or shared
page remains usable after death/revocation; partial operations cannot duplicate
authority; unrelated domains continue.

## Phase 2 — Minimal userspace system

Add quantitative `MemoryPool`/`MemoryObject` accounting and bounded delegation,
then IPC/cache charge foundations, as specified in
[memory/MEMORY_RESOURCE_MODEL.md](memory/MEMORY_RESOURCE_MODEL.md). Preserve the
current storage/service critical path; VMM guest-pool accounting follows its
memory dependencies, while resize, NUMA, huge pages, swap/compression, and QoS
remain later work. This does not displace VirtualGPU or compiler ownership/CFG.

**PARTIALLY IMPLEMENTED memory-resource prerequisite:** the kernel policy core
now represents fixed-capacity generational `MemoryPool` and `MemoryObject`
identities. Root creation and child delegation bound page commitments, mapping
reservations, child counts, and rights; exact allocation limits fail locally;
content-free usage inspection is independent from control; release and
recursive pool revocation stale object and descendant-pool identities. This is
accounting rather than frame allocation. Fixed-capacity mapping reservations
now consume the pool's quantitative mapping budget under separate source-object
and target-address-space capabilities, enforce W^X/bounds/non-overlap, and block
object or pool retirement until real mapping teardown and invalidation are
proven. A backend-neutral transaction publishes a reservation only after exact
installation succeeds and retains it across removal failure until exact teardown
and invalidation succeed. Deterministic protocol tests cover both boundaries;
no x86 page-table or KVM/WHP adapter is integrated yet. Physical mapping,
sharing, DMA, resize/COW, cache charging, VMM guest projection,
userspace policy, and hardware evidence remain pending before this prerequisite
is complete. The first physical-backing lifecycle is **PARTIALLY IMPLEMENTED**:
an exact object-sized run may be published only after a privileged backend
confirms exclusive zeroed ownership, and remains live until confirmed mapping/
DMA revocation, invalidation, full scrub, and safe release. Exact `CONTROL|PIN`,
physical overlap rejection, separate `INSPECT`, and fail-closed object/pool
retirement are enforced. Only a deterministic protocol backend is tested; no
reusable frame allocator or physical machine is claimed. Backed mapping
composition now rejects unbacked objects before backend invocation, derives the exact
physical subrange from the validated object-page range, binds that range into
both install and retryable removal, and prevents backing release until mapping
retirement. Accounting-only mappings remain available for simulation; an x86
active-page-table or KVM/WHP adapter is still pending. An exclusively owned inactive
x86-64 hierarchy can now serve as the concrete backed-mapping adapter: it binds
one exact target, rejects access that x86 leaves would broaden, maps exact
physical leaves transactionally, restores a mapping after retryable removal
failure, and permanently quarantines uncertain cleanup. Active hierarchy
publication, TLB/SMP invalidation, boot adoption, and KVM/WHP adapters remain
pending. The first page-table charge
foundation is **PARTIALLY IMPLEMENTED**: an opt-in wrapper commits
the complete validated preallocated arena capacity before exposing a usable
store, and unsafe release requires the caller to prove every table unreachable
and required invalidation complete. Existing boot construction is not migrated.
The first IPC/task-metadata charge foundation is now **PARTIALLY IMPLEMENTED**:
an accounted runtime reserves its complete fixed scheduler, task/capability,
delegation-table, and two-slot-per-task inline-inbox footprint from one exact
pool before publication. Exhaustion leaves the pool unchanged, and consuming
release returns the commitment; failed release returns the still-accounted
runtime. Existing boot/runtime construction is not yet migrated to this path.
The first userspace-policy charge foundation is **PARTIALLY IMPLEMENTED**:
fresh, empty, and checkpoint-recovered `ConfigurationService` construction may
commit the complete concrete settings/audit footprint to one exact pool before
publication. Validation or exhaustion leaves usage unchanged; consuming release
returns the commitment. The signed service image and reboot path do not use it.
The separate fixed lifecycle owner is now **PARTIALLY IMPLEMENTED** with an
opt-in accounted `ServiceSupervisor`: its complete service/task, restart-policy,
budget, generation, and cleanup-ticket capacity is committed before
registration. Release is unsafe until no task, cleanup, prepared plan, peer,
recovery path, or external policy depends on it. An opt-in aggregate substrate
now commits the task runtime, supervisor, and configuration service atomically;
live composition remains pending.

1. Implement the policy/configuration service and service supervision protocol.
   **PARTIALLY IMPLEMENTED:** `mrml-config` provides a no-allocation typed
   schema, exact-object capability checks for reads and every transaction
   update, optimistic revision binding, atomic bounded commits, monotonic audit
   sequencing with explicit overwrite gaps, and strict version-1
   configuration/supervision request and response codecs. The opt-in
   `AccountedConfigurationService` charges its complete fixed settings and audit
   capacity before fresh or checkpoint-recovered publication; live image and
   reboot integration remain pending. `AccountedServiceSupervisor` separately
   charges the complete fixed lifecycle/restart/cleanup table before use.
   `AccountedPolicyServiceSubstrate` instead supports one exact aggregate charge
   after scheduler and schema validation; exact-limit admission succeeds and a
   one-page shortage leaves usage unchanged. Live image construction remains
   unaccounted. Kernel service-state
   introspection now requires exact READ authority rather than a service token.
   Syscall operation 9 now exposes only that authorized state query to CPL3: it
   accepts an opaque generational service token plus an exact task-local READ
   capability, rejects nonzero reserved registers, and returns only a detail-
   free Running/Exited/Faulted code. Canonical 48-byte query requests now cross
   the real buffered IPC path with one sender-derived READ capability, and the
   userspace service invokes operation 9 before returning a canonical 48-byte
   detail-free response. Fresh signed KVM and WHP probes repeat that exchange in
   both generations.
   Buffered receive completion now carries a typed proof that returned payload
   and capability counts fit both the exact pending buffers and global kernel
   maxima. Immediate and scheduler-wakeup completion paths cannot publish loose
   scalar counts. The focused Linux kernel suite passes 595 tests and the UEFI
   `service_probe` profile cross-builds.
   Send and receive capability buffers now have separate full-range validators:
   16-byte attenuation descriptors for send and 8-byte returned tokens for
   receive. Canonical-address crossing and multiplication/range failure reject
   the syscall before publication.
   Buffered send payloads and receive outputs now also validate their complete
   declared ranges during decode, so a valid start with a canonical-boundary
   crossing cannot become a request.
   Payload and capability regions must be disjoint for both buffered operations;
   overlap fails decode while exact adjacency remains valid.
   The UEFI service-probe dispatcher now copies buffered IPC data only through
   task-bound, directional, single-use active-user-copy tickets. Pending receive
   capacity is checked before blocking and exact returned lengths are rechecked
   against the resumed task and page-table root before output mutation.
   Checked capability-buffer byte lengths now flow from syscall range validation
   into overlap checks and hosted token output without unchecked recomputation.
   Pending buffered receives retain their admitted page-table root and reject
   completion after context-root substitution, alongside generational task and
   exact-range validation.
   Wakeup completion takes and clears the exact pending record before inbox
   consumption or output, making the hosted pending-receive slot one-use.
   Pending lookup requires one unambiguous generational-task match; duplicate
   internal records halt rather than silently selecting the first slot.
   Named capacities now bind the service probe's three-task runtime and pending
   table plus its nine-capability task spaces. This corrects older
   two-slot/seven-capability evidence text and prevents const-generic drift.
   The MRML-native service-image generic and block-service receive adapters now
   reject returned payload or capability counts beyond their supplied slices
   before slicing or envelope construction. Both service-image profiles
   cross-build and the Linux storage-service suite passes 142 tests.
   Service-image send descriptors now use explicit 8-byte-aligned storage, and
   the common wrapper rejects noncanonical descriptor widths/counts/alignment
   and invalid payload lengths before trapping. Both profiles build; Linux
   configuration and storage suites pass 53 and 142 tests.
   Successful configuration and supervision dispatch now release every
   request-transferred leaf before response visibility; release failure
   suppresses the response. Both service-image profiles build and the Linux
   configuration suite passes 53 tests.
   Operation 12 returns ordinary denial only for an invalid task-local
   capability; unexpected runtime or delegation-integrity failure is fail-stop.
   Ordinary and accounted service profiles build and 595 kernel tests pass.
   Operation 11 returns ordinary denial only for an unknown service or
   unauthorized capability; policy-generation exhaustion and other impossible
   lifecycle failures are fail-stop under the same passing gates.
   Operation 9 now exhaustively permits only lookup/authorization denial.
   Operation 10 permits documented prepare/revalidation denial or runtime
   capacity exhaustion, while terminal identity, generation, policy, and
   unexpected runtime failures halt. A new canonical
   `service_restart_request_probe` profile builds the enabled branch; it, the
   ordinary service profile, and 595 Linux kernel tests pass.
   Operation 6 now maps only IPC/capability errors to authorization denial;
   missing current-task state and unexpected runtime failures halt. Ordinary
   and accounted service profiles build and 595 kernel tests pass.
   Malformed service syscall arguments now return one scrubbed generic failure
   instead of halting the hosted image. Forged return-frame state remains
   fail-stop pending scoped service retirement. Ordinary and restart-request
   profiles build and 595 Linux kernel tests pass.
   Operation 13 now distinguishes invalid return state from malformed request
   arguments. Only malformed capability/address/reserved fields receive the
   scrubbed generic error; unsafe return state remains fail-stop. Ordinary and
   block-service profiles build under the 595-test kernel gate.
   Inline and buffered sends return scrubbed failure for the kernel-tested
   precommit denial set, including malformed transfer descriptors, while
   scheduler/integrity failures halt. Ordinary and accounted profiles build and
   595 Linux kernel tests pass.
   Buffered-send payload/descriptor scratch is zeroed before reuse and after
   descriptor failure or delivery; decoded and requested capability temporaries
   are cleared at their last use. The same build/test gates pass.
   Shared-buffer read/write syscalls return scrubbed failure for bounded
   precommit range, user-mapping, authority, binding, and resource-handle
   denials. Backend uncertainty and internal runtime/copy invariants still halt;
   ordinary/accounted service builds and 595 Linux kernel tests pass.
   Capability release reports stale/unauthorized handles as precommit denial,
   but an impossible source-revoke failure after descendant mutation is now an
   integrity failure and remains fail-stop.
   Buffered send returns scrubbed failure for invalid payload or descriptor
   userspace mappings, erasing any prior staging first; ticket/copy invariants
   still halt. Ordinary/accounted builds and 595 Linux kernel tests pass.
   Buffered receive returns scrubbed failure for invalid initial output
   mappings before dequeue/block, while completion revalidates the saved exact
   task/root ranges and still fails stop on later drift.
   Boot-recovery delivery returns scrubbed failure only for validation and
   other proven precommit denials; copy uncertainty after one-use consumption
   and internal delivery/runtime inconsistency remain fail-stop.
   Its kernel executor now types user validation and post-delivery copy failure
   separately, with a focused test proving the former preserves one-use
   authority and the latter follows consumption.
   The shared-buffer executor likewise types initial user validation separately
   from user copy failure, so the boot boundary admits only the former as a
   scrubbed precommit denial.
   The task runtime now retires `InvalidUserReturn` as a typed protocol
   violation distinct from exit or hardware fault, revoking the complete domain
   before peer notification and scheduler handoff. A focused test raises the
   Linux kernel total to 596. The supervisor now converts the retirement into
   exact `Faulted` state, cleanup ticket, and restart deadline; its focused test
   raises the total to 597. Live generic and boot-recovery syscall decoding now
   invokes scoped retirement, exact cleanup, and kernel-selected handoff; three
   service profiles cross-build. A dedicated QEMU probe remains pending.
   Peer-death retirement now validates the complete reciprocal control graph
   before revoking authority or removing the current domain. Missing or
   duplicate relations and exhausted result capacity leave domain, scheduler,
   and peer results unchanged; the adversarial test raises the kernel total to
   598 and covers the shared exit/fault/violation preflight.
   The same preflight now requires each peer's exact scheduler identity before
   publication, preventing a late wake failure after relation mutation; a
   focused divergence test raises the kernel total to 599.
   Retirement now unions descendants across every outgoing delegation root and
   validates the complete exact-generation set before revoking any of them. A
   stale later root cannot partially revoke an earlier root; the adversarial
   test raises the kernel total to 600.
   Return-frame validation now has a dedicated `UserReturnError`; all four
   control-state failures remain exhaustively mapped at the legacy syscall
   request boundary. The 600-test kernel suite and both invalid-return images
   pass.
   Boot-recovery decoding now preserves the exact typed return cause and tests
   all four causes before request-data interpretation; live policy continues to
   retire the closed set identically.
   Generic service decoding now consumes a typed return-versus-request envelope
   directly. The compatibility `request()` API remains exhaustive, while live
   retirement no longer reconstructs control-state faults from request errors.
   Protocol-violation retirement, supervisor result, and the authorized
   peer-death record now preserve the exact return cause. The probe requires
   `InvalidStack`; 600 kernel tests and both probe images pass.
   A distinct `BufferedReceiveMappingDrift` protocol violation now provides the
   scoped retirement prerequisite for saved output mappings that fail
   revalidation. Its focused runtime test raises the kernel total to 601; live
   split-phase completion now revalidates before dequeue, restores the prior
   page table on drift, consumes the pending record, and performs scoped service
   retirement. Ordinary, block-service, and invalid-return profiles build; an
   execution probe remains pending.
   Warning-free `buffer_drift_probe` kernel/service profiles now remove the
   exact blocked output leaf before delivery and require typed cleanup marker
   `0x28`, peer exit, and terminal marker `0x29`. The KVM runner admits the mode
   with one verified signed service and exact two-root preparation; all 15
   runner unit tests pass. Actual KVM execution and WHP parity remain pending.
   One runtime operation now validates bounded message counts and consumes only
   on fit; immediate and resumed buffered receives share it. Undersized outputs
   retain queued message/capabilities, and resumed completion restores the prior
   page table before a scrubbed retry error. The 601-test kernel suite plus
   ordinary and buffer-drift profiles pass.
   A capability-bearing retry test proves the insufficient attempt retains the
   queued authority and the sufficient retry yields the exact derived READ
   handle, raising the kernel total to 602.
   Delivery now preflights the receiver's exact scheduler identity before
   transfer, sequence, enqueue, or wake. A divergence test proves no message is
   enqueued on rejection and raises the kernel total to 603.
   Complete inbox ring topology is now checked before transfer or sequence
   mutation and before receive mutation. A corrupt count/slot test preserves
   the prior message and next endpoint sequence, raising the total to 604.
   Control receive now validates the inbox before consuming peer death; its
   corruption test preserves the event and raises the kernel total to 605.
   Live peers and pending deaths now share one validated topology before
   connection, publication, or receive. Duplicate/overlapping identities and
   aggregate over-capacity fail unchanged; the kernel total rises to 606.
   Delivery now preflights exact scheduler identity for both endpoints before
   authority transfer. A stale-sender test leaves the receiver empty and raises
   the kernel total to 607.
   Control-peer connection now requires both scheduler identities before either
   reciprocal relation changes; a stale-peer test raises the total to 608.
   Direct IPC transfer now enforces the same endpoint scheduler preflight even
   without enqueue; its stale-endpoint test raises the total to 609.
   Send and retirement now preflight every delegation edge's scheduled tasks,
   exact source/destination handles, and unique destination node. A stale-edge
   test preserves endpoint sequence and raises the kernel total to 610.
   Direct send now prepares a one-use endpoint/object/sequence plan before
   deriving receiver capabilities. Authorization denial, exhausted sequence,
   and stale-plan tests prove ordinary rejection is mutation-free and raise the
   kernel total to 611.
   IPC capability derivation now preflights the complete source set and receiver
   slot capacity before publishing any child. Late invalid-source and capacity
   failures leave the destination completely reusable; the total remains 611.
   Shape inspection and message/control dequeue now require the domain's exact
   scheduler identity, as do mutable/immutable capability-space access and exact
   capability authorization and saved-context access. An unscheduled-domain
   test preserves the queued message; the kernel total remains 612.
   Task-domain lookup now rejects duplicate generational identities before
   resource access, detach, rebalance, or retirement. A focused corruption test
   preserves both scheduler identities and raises the kernel total to 613.
   Inbox validation now exact-matches the complete circular segment rather than
   relying on aggregate count and endpoint implications. Exhaustive bounded
   topology coverage raises the kernel total to 614.
   Delegation validation now binds every edge to matching source/destination
   objects, a DELEGATE-bearing parent, and attenuated child rights. A live-handle
   substitution test preserves endpoint sequence and raises the total to 615.
   Capability attenuation now rejects zero-right children before destination
   mutation. A focused reuse test raises the kernel total to 616.
   Root capability insertion now rejects zero rights before slot selection; a
   focused non-consumption test raises the kernel total to 617.
   Ordinary authorization now rejects zero requested rights before lookup;
   revocation liveness checks use private exact metadata. A focused
   non-disclosure test raises the kernel total to 618.
   Control receive and connection now preflight every live peer's scheduler
   identity and exact reciprocal relation. An unscheduled-peer preservation test
   raises the kernel total to 619.
   Stable peer-death records now reject self-death and identities that remain
   scheduled or domain-live. A forged-live-death preservation test raises the
   kernel total to 620.
   Delegation graph validation now rejects bounded ancestry cycles before send
   or retirement mutation. A live two-hop cycle test preserves endpoint sequence
   and raises the kernel total to 621.
   The cycle gate now precomputes unique parent indices, reducing its bounded
   worst case from cubic to quadratic while retaining the same evidence.
   Capability-transfer descriptor decoding now publishes output only after the
   complete bounded array validates. A late-error atomicity test raises the
   kernel total to 622.
   Service send-denial classification now uses an explicit closed precommit IPC
   error set; postcommit/integrity-shaped variants cannot be silently added by
   enum growth. The kernel total remains 622.
   Direct send now uses unique domain resolution after scheduler confirmation;
   missing/duplicate domain state is integrity failure. Existing corruption
   coverage is extended; the total remains 622.
   Queued delivery now authorizes the endpoint before observing receiver inbox
   state. A full-inbox non-disclosure test preserves sequence and raises the
   kernel total to 623.
   Direct send now prepares endpoint authority before delegation graph/capacity
   inspection. Existing substituted-edge coverage proves non-disclosure; the
   total remains 623.
   Queued/direct send now authenticate before receiver identity lookup. A
   missing-receiver non-disclosure test raises the kernel total to 624.
   Queued delivery now reuses one exact capability/object/sequence send plan
   through transfer commit instead of re-authorizing after receiver preflight.
   Capability substitution at commit fails without sequence consumption; the
   kernel total remains 624.
   Queued delivery now rejects an authenticated same-task route before receiver
   lookup or inbox inspection. A full-inbox ordering test raises the kernel
   total to 625 while preserving authorization non-disclosure.
   Authenticated sends now validate payload/capability-count bounds before
   receiver inbox or delegation-table inspection. Full-inbox coverage proves
   oversized input receives its shape denial first; the total remains 625.
   Complete requested source delegations now validate before receiver identity,
   delegation graph, or table capacity. A stale-source non-disclosure test
   raises the kernel total to 626 without consuming endpoint sequence.
   Queued delivery applies that source gate before inbox inspection as well;
   full-inbox stale-source coverage passes without changing the total.
   Receiver capability capacity now preflights before delegation graph/table or
   queued inbox inspection and is reused by batch derivation. Full-inbox/full-
   capability-space coverage passes; the total remains 626.
   Delegation-table capacity now precedes graph inspection after all caller and
   receiver preflights. A full-table/corrupt-graph ordering test raises the
   kernel total to 627 without consuming sequence.
   Queued delivery applies the shared table-capacity gate before inbox
   inspection; the same test covers simultaneous full inbox/table state and
   preserves the 627-test total.
   Delegation publication now reserves exact empty tracking slots before
   receiver mutation and performs no fallible post-transfer search. Fragmented-
   table coverage raises the kernel total to 628.
   Endpoint sequence commit now encloses publication and advances only after it
   succeeds. Injected publication failure coverage raises the total to 629.
   Queued delivery now reserves exact inbox slot/tail/count state before
   transfer and publishes without a fallible post-transfer search. Wrapped FIFO
   coverage passes; the total remains 629.
   Receiver wake now uses a consuming exact-generation plan prepared before IPC
   mutation, eliminating fallible scheduler lookup after inbox publication. The
   total remains 629.
   Peer-death publication reserves the complete peer wake set before control-
   state mutation and consumes plans after event publication. Existing coverage
   passes; the total remains 629.
   Peer publication plans now also bind each exact domain, reciprocal relation,
   and death-event slot before authority cleanup, eliminating commit-time table
   searches. Existing coverage passes; the current total remains 630.
   Control-peer connection reserves both reciprocal relation slots before
   either table is mutated. Existing topology coverage passes; the total
   remains 630.
   Scheduler attach/migration now constructs the destination in its final
   runnable or blocked state, while detach/migration consume an exact prepared
   source-removal generation without rollback-only late lookups. Existing
   lifecycle coverage passes; the total remains 630.
   Service exit/fault/violation paths now reserve exact supervisor identity and
   restart-deadline state before runtime retirement, then publish cleanup and
   stopped state without a fallible late mismatch check. Existing lifecycle
   coverage passes; the total remains 630.
   Restart commit now returns the exact new service/task generations together;
   recovery and the restart-request probe consume the task without a fallible
   post-creation lookup. Existing reprovision-boundary coverage checks the exact
   binding; the total remains 630.
   Service registration now enforces one unique supervisor binding per exact
   task generation and live service object at plan/commit; atomic launch checks
   object uniqueness before task creation while preserving capacity/stale-plan
   denial precedence. Duplicate-target coverage raises the total to 631.
   Service state, restart, and policy replacement now require exact `READ` or
   exact `CONTROL`; overbroad combined handles are rejected in focused coverage.
   The total remains 631.
   Timer preemption now binds the exact live domain slot before scheduler tick
   mutation and publishes context without a second fallible lookup. Existing
   coverage passes; the total remains 629.
   Current-task fault, protocol-violation, and voluntary-exit retirement now
   reserves the exact scheduler generation before peer/domain mutation and
   consumes it after peer-death publication without a fallible late lookup.
   Existing coverage passes; the total remains 629.
   Explicit and task-death transitive capability revocation now reserves every
   exact descendant domain slot and capability generation before mutation, then
   consumes the bounded plan without late lookup. Duplicate-target preflight
   coverage raises the Linux kernel total to 630.
   Buffered service receive now preflights an exact pending-table slot before
   blocking and binds post-switch publication to that slot. Service profiles
   cross-build; live backend execution remains pending.
   Completion-time pending-record validation now rechecks optional-address
   canonicality and exact output-range disjointness. Both service profiles
   cross-build; live execution remains pending.
   Pending completion now carries an exact slot-and-record plan through context
   and mapping validation, consuming only that record before dequeue or scoped
   drift retirement. Both service profiles cross-build; execution remains
   pending.
   Pending-layout arithmetic overflow now feeds existing invalid-layout policy
   instead of global halt. Both service profiles cross-build.
   Warning-free `invalid_return_probe` kernel/service profiles now encode the
   real CPL3 invalid-stack interrupt, typed peer-death cleanup marker, peer
   execution, clean exit, and terminal state marker. Runner execution remains
   pending.
   The KVM runner admits the dedicated mode with one verified signed service,
   exact two-root preparation, and strict `0x26` then `0x27` acceptance. Its
   validator rejects noncanonical expectations, reversed stages, and unrelated
   exits; all 14 runner unit tests pass. Actual KVM execution and WHP parity
   remain pending.
   Exact feature gating now confines `GuestMappingRevoker` to block/component
   cleanup builds; ordinary, restart-request, component, and block service UEFI
   profiles cross-build without the former unused import.
   The restart wire record can no longer carry a clock value; bytes 40--47 are
   canonical zero and dispatch receives time only from trusted kernel state.
   Syscall operation 10 decodes only an exact generational capability and
   service token, rejects every other register, and returns only a replacement
   generation or detail-free denial. The live image always denies it until an
   exact trusted reprovision plan exists. Split-phase restart planning now
   authorizes CONTROL and snapshots trusted priority/context/time without
   mutation, then revalidates generation, object, cleanup, backoff, budget, and
   one-use state after the reprovisioning boundary before task creation.
   Both hosted backends admit a third independently rooted verified service
   image for a management client. Its image, stack, and page tables use
   disjoint checked physical ranges, while the common shared page and per-service
   resource remain deliberately confined to slots 0 and 1. Signed KVM and WHP
   regression runs verify construction. The focused restart-request image now
   creates that task without shared or resource mappings. After the old sender
   is retired and cleaned, the manager transfers exactly CONTROL in a canonical
   restart envelope. Trusted kernel code supplies the fixed launch context,
   stages host shared-leaf re-arm, commits only after revalidation, provisions a
   fresh generation, and returns a detail-free response that the manager checks.
   Fresh signed KVM and WHP probes exercise this path. They stop before the new
   task executes; the separate ordinary service probe remains the evidence for
   replacement re-entry. The separate recovered-policy foundation described
   below is not exercised by these probes; live persistent-policy restoration
   and physical-hardware execution remain pending.
   Message dispatch now takes authority only from kernel-derived receiver-space
   capabilities, rejects missing/extra/payload-forged authority, and composes
   authorized restart with existing cleanup, backoff, limit, and trusted fresh-
   context gates. Buffered syscall operations canonically bind payload and
   capability-descriptor addresses/counts, and
   mapping policy validates every complete user leaf and access direction before
   invoking a copy backend. Signed WHP and KVM probes now execute real
   `mrml-config` schema admission and commit dispatch in CPL3. Each signed
   generation begins with the trusted configuration-root identity and no
   settings. The client sends a canonical bounded schema record and delegates
   only attenuated root CONTROL; exact kernel authorization precedes admission,
   and schemas freeze after the first commit. A separate one-update request has
   zero payload authority and independently delegates fresh root CONTROL and
   setting WRITE before atomically committing revision 1. The supervised
   replacement repeats admission and commit from fresh volatile state. The same
   proof retains bounded lifecycle cleanup and covers two simultaneously blocked
   buffered receivers. A canonical bounded checkpoint codec now preserves all
   admitted schemas, values, per-setting/global revisions, and the retained
   chronological audit window. Export requires root READ; recovery requires
   root CONTROL and a caller-supplied expected SHA3-256 digest, and rejects
   corruption, hidden data, stale digests, capacity mismatch, and inconsistent
   revision/audit state. The digest is not self-authentication. The codec is now
   bound to one exact capability-native stable file successor: export requires
   configuration-root READ, staging requires file WRITE and RESIZE, and the
   object, successor generation, length, content digest, extent metadata, and
   publication participant must all agree. Staged data becomes active only
   after the existing COW transaction publishes and an exact one-use receipt is
   consumed. Recovery requires file READ plus configuration-root CONTROL and an
   exact authenticated-recovery-selected file generation; corruption and I/O
   uncertainty fail rather than searching an older generation. This is focused
   in-memory simulation evidence. A signed CPL3 KVM/WHP probe now composes the
   checkpoint with the isolated MRML-native block service, publishes by exact
   COW receipt, recovers file generation 2, and reloads the service-bound
   policy. A nonvolatile device, reboot restoration, physical power-loss
   evidence, live stable-storage policy restoration, and
   reboot-time capability reconstruction remain pending, so this item is not
   complete. A
   canonical persistent restart-policy record now binds one service object to a
   finite restart budget and bounded exponential backoff. Loading it from fresh
   or recovered configuration rechecks the exact setting READ capability,
   rejects unset, malformed, noncanonical, or wrong-service data, and retains
   both configuration and setting revisions. Application rechecks the exact
   live capability, record, service binding, and both revisions immediately
   before supervisor mutation, so revocation or configuration drift invalidates
   the cached value. Only trusted code holding mutable supervisor state can
   apply the result; the record carries no authority and
   every restart still requires exact service CONTROL. Focused tests prove
   checkpoint restoration, stale-capability denial, service substitution
   rejection, backoff, and budget enforcement. Dynamic policy replacement is
   now implemented in host-side unit/simulation code. Application explicitly
   rechecks setting READ and exact value/global/setting revisions, while the
   supervisor independently requires exact service CONTROL. Each successful
   replacement advances a bounded policy generation and stales prepared restart
   plans without resetting consumed budget or shortening an existing deadline;
   generation exhaustion changes nothing. The versioned CPL3 protocol now
   requires exactly two ordered IPC-derived capabilities: setting READ followed
   by service CONTROL. The service re-reads the canonical service-bound record,
   uses a trusted service-object mapping, and invokes operation 11 separately.
   Fresh identical signed artifacts completed this path and the subsequent
   authorized restart on KVM and WHP. A reusable exact-block composition now
   stages the checkpoint through `BlockFileSession` over `BlockVolume`, including
   when its device is selected by a principal-bound MRML block-service session.
   Deterministic integration publishes by one-use COW receipt, recovers the
   exact selected file generation, reloads the service-bound policy, rejects a
   derived read-only block session before writes, and proves parent revocation
   stales its descendants. Identical signed KVM/WHP artifacts now exercise that
   exact composition through 18 bounded CPL3 block requests and complete both
   task/resource lifecycles. The backend remains volatile; reboot-time
   restoration and capability reconstruction remain pending, so
   this item remains partial.
   The next protocol dependency is now implemented at the kernel ABI boundary:
   operation 11 accepts only an opaque service generation, one task-local
   capability, bounded restart count/backoff scalars, and a zero reserved
   register. Decode constructs a valid `RestartPolicy` before dispatch; the
   service path independently requires exact CONTROL for the live supervisor
   object and returns a detail-free result. It accepts no setting identity,
   service-object claim, pointer, context, priority, executable, time, or
   persistence claim. The versioned userspace supervision request, trusted
   service-object mapping, and signed CPL3 KVM/WHP execution are now implemented
   as described above.
2. Define native filesystem object identities and attenuated directory/file
   rights, then the volume/superblock and directory/file metadata formats.
   **IMPLEMENTED:** `mrml-storage` supplies stable nonzero volume/object IDs,
   kind-specific rights without a universal administrator right,
   principal-bound generational handles, attenuated cross-principal derivation,
   and transitive descendant revocation. Version-1 fixed records cover volume
   geometry, an exact predecessor-linked superblock generation, directory and
   file metadata, and canonical bounded UTF-8 directory entries. SHA3-256
   self-checks detect covered corruption only; they provide neither authority,
   authenticity, atomic persistence, nor rollback resistance. Windows and
   Linux unit tests exercise malformed records, wrong volumes, stable identity
   across rename, rights confusion, stale handles, and descendant revocation.
   Prepared file and directory primary-metadata COW digests cover the fixed
   record followed by canonical zeros through the exact block-aligned pointer
   extent; undersized ranges and hidden nonzero tails fail closed.
3. Implement extent mapping, checksummed COW metadata, directory operations,
   file reads/writes, explicit transactions, and crash recovery in that order.
   **PARTIALLY IMPLEMENTED:** canonical extent records bind an exact file and
   metadata generation to a bounded logical range, either a physical data range
   with a content digest or an explicit hole. A fixed-capacity map requires
   ordered gap-free coverage of the rounded file length, bounds data ranges to
   the volume, excludes the volume header and both superblocks, rejects
   intra-file physical overlap, and returns bounded logical lookup results.
   Reserved future kinds are rejected rather than treated as compression,
   encryption, or sharing. The COW publication planner then requires an exact
   successor generation, inactive superblock target, nonoverlapping new ranges,
   active-range preservation, staged-image digest verification, metadata flush,
   atomic superblock replacement, and final flush in that order. Prepublication
   failure is clean rejection; replacement or later failure is fail-stop.
   Concrete block-backend integration, allocation ownership across files, a
   complete COW tree, and every later operation in this item remain pending.
   Directory lookup/enumeration/create/rename/remove and atomic cross-directory
   file moves are now implemented over fixed-capacity state. Every operation
   requires the exact directory object and operation-specific right; create
   allocates a service-owned stable ID and returns object-bound authority, while
   rename/move preserve identity and open capabilities. All failure-prone checks
   precede mutation. Cross-directory directory moves now require a bounded
   ancestry proof loaded through one immutable selected-generation backend. The
   proof binds the exact destination generation, reaches the selected root, and
   rejects the moved directory anywhere in that chain, repeated ancestors,
   broken links, stale state, backend failure, and capacity exhaustion. It also
   requires the moved directory's exact generation and current source-parent
   link. The proof retains the exact bounded source and destination paths to the
   root, including their independently checked starting generations.
   A fixed-capacity closure planner now merges both paths with the moved object,
   deduplicates shared ancestors, rejects insufficient output capacity, and
   orders children before parents with the root last. A duplicate ancestor at
   inconsistent depths or generations fails closed. Every closure entry binds
   the exact canonical generation loaded by the proof, preventing stale
   ancestor substitution. A bounded immutable-state backend now loads every
   exact predecessor and constructs the complete successor closure. It changes
   the moved directory's parent, compacts source removal, inserts the moved
   successor generation at the destination, advances every affected directory
   exactly once, and rewrites exact child-generation links through shared
   ancestors to the root. Complete-plan staging now preflights all metadata and
   entry ranges for volume bounds, exact entry-image size, and pairwise
   disjointness before writing; it stages every successor child-before-parent
   and can admit every prepared directory and image to one new transaction. A
   focused publication helper now requires the allocation successor to own each
   exact new directory range with the correct object, generation, and kind,
   includes all directory and allocation participants/images in one COW plan,
   and atomically consumes the directory receipt set before exposing successors.
   This remains in-memory simulation: concrete block integration, power-loss
   evidence, and full recovery validation are pending. A canonical COW
   object-ID allocator image now persists its volume, generation, exact next ID
   or exhaustion, pointer, digest, and zero padding. Reservation leaves active
   state unchanged, stages and flushes one successor, participates as a distinct
   volume transaction resource, and activates once from an exact receipt.
   The prepared allocator successor now requires an exact allocation record
   with a distinct allocator-metadata purpose, root lifetime anchor, allocator
   generation, and pointer range. This record is accounting, not authority.
   Reachable recovery now requires exactly one canonical root-anchored allocator
   image at the selected generation and rejects missing, duplicate, stale,
   corrupt, substituted, or reachable-ID-reusing state. Authenticated rollback
   resistance and physical durability remain pending, so directory operations
   are not yet proven crash-safe. An inactive
   authority-slot reservation now closes the create activation race: it consumes
   bounded capacity without authorizing access, rejects guessed handles,
   activates once, and advances its generation when canceled. Prepared-create
   orchestration is implemented as described below. Canonical initial child staging now supports
   both admitted kinds: an empty file has generation-1 file metadata plus an
   empty extent image, while an empty directory has generation-1 directory
   metadata plus an empty entry image and exact parent. Disjoint layouts are
   checked before I/O and each child participates as an explicit typed
   `0 -> 1` creation. A general bounded mutation proof now binds the exact
   target-to-root path. Create successor construction reloads all predecessors,
   inserts the child at the target, advances every directory once, and
   propagates exact child generations to the root. The complete directory
   closure now passes the same preflight/staging path as moves and is admitted
   child-before-parent to one bounded directory transaction. Receipt handling
   can now atomically preflight and consume the variable directory closure with
   fixed create participants, rejecting missing or cross-group duplicates
   without partial consumption. The bounded prepared-create coordinator now
   binds the exact allocated ID, child kind, inactive authority reservation,
   directory closure, initial child images, allocator successor, and allocation
   successor. It admits all four resource classes to one transaction, requires
   exact purpose-specific allocation ownership, builds one COW-root plan, and
   exposes successors plus the new handle only after atomic receipt consumption
   and authority activation. Empty-file and empty-directory creates are covered
   end to end in the in-memory model. Directory child metadata retains its exact
   parent; the coordinator requires it to equal the unique inserting directory
   successor and preserves it in committed state. A deterministic create
   durability simulation materializes and verifies all staged bytes, fails at
   every publication event, and runs complete reachable recovery. Only the old
   graph or fully valid new graph is selected, and authority activates only from
   a successful exact receipt. When fail-stop recovery selects the durable new
   graph, the in-memory model cancels the stale reservation and can reopen the
   child only from an exact surviving parent handle with the separate
   `OPEN_CHILD` right. The name remains non-authorizing, requested rights must
   match the child kind, and the new handle is a revocable descendant. Reboot-
   time capability reconstruction, a block service/device implementation, and
   physical power-loss evidence remain pending. A bounded exact-block metadata
   adapter now supplies canonical padded staging, complete digest readback,
   ordered flushes, inactive-superblock-only atomic replacement, fail-stop
   session poisoning, and exact immutable recovery reads. This is a tested
   service-boundary adapter, not physical-device durability evidence. Exact-
   block file reads now verify a complete extent before copying any requested
   subrange. A bounded write session reconstructs every successor data block
   from the exact verified predecessor plus holes and patch bytes, independently
   rejects reserved, active, and overlapping physical ranges, verifies complete
   staged extents and the complete logical-file digest, and flushes once before
   metadata publication. A fixed-capacity block-service core now registers
   non-authorizing device identities and grants principal-bound generational
   sessions with separately attenuable read, write, flush, and atomic-
   replacement rights. Derived sessions preserve device identity and can only
   reduce rights; parent revocation is transitive; device removal retires all
   sessions; and malformed, unauthorized, stale, or wrong-owner requests fail
   before the backend. A scoped client runs the exact-block volume adapter
   through this service. A canonical v1 control codec now provides fixed bounded
   requests/responses with no wire principal or raw address. Read/write requires
   one separately transferred buffer capability; atomic replacement alone
   carries its fixed record inline. Dispatch binds the authenticated sender,
   exact buffer shape, and strictly increasing request ID to the current session
   generation; replay fails before the backend, while uncertain mutation
   failures poison that generation. Each decoded operation now declares whether
   the service reads, writes, or uses no bulk buffer. Kernel IPC can validate
   zero capabilities or exactly one live receiver capability with the exact
   required nonzero rights; over-privileged, insufficient, missing, multiple,
   stale, and revoked transfers fail before object identity is returned. The
   same gate now resolves one exact shared binding and revalidates object,
   VM/task, mapping generation, access mode, host range, writability, and
   non-executable state before returning only an opaque host resource handle.
   Generic bounded reads and writes repeat those checks at every use, reject
   empty/overflowing ranges and read-only writes before backend access, expose
   no address, and preserve backend errors. The storage-service transport now
   composes decoded kernel messages, exact selected bindings, bounded erased
   scratch, replay/poison admission, and the block dispatcher outside the
   privileged kernel. It admits before touching bulk bytes, so denied, replayed,
   poisoned, revoked, malformed, or wrongly shaped requests reach no block I/O.
   A bounded service-side loop now receives one exact 320-byte request and zero
   or one transferred capability, performs replay/session admission before any
   shared-buffer or device I/O, invokes only capability-selected shared-buffer
   operations, dispatches the device request, sends one canonical response, and
   erases request, capability, scratch, and response storage on every return.
   Copy uncertainty consumes the admitted request ID, so retry cannot duplicate
   a mutation. Its unsafe syscall contract forbids manufacturing sender identity,
   capability tokens, mappings, or reply peers. The UEFI service image compiles
   a concrete adapter for receive/send operations 5/4 and shared-buffer
   operations 7/8 with launch-bound endpoint and reply task. A focused signed
   KVM/WHP probe now instantiates the loop as a separately provisioned hosted
   service task against a volatile one-page in-image backend. A hosted or
   physical device backend plus physical durability evidence remain pending.
   Capability cleanup is now gated by that same exact envelope admission. A
   zero-capability request with hostile token bytes, a malformed token, or a
   mismatched count cannot trigger revocation; later denial or copy failure
   still releases an admitted leaf. The 163-test focused Linux storage suite
   and release build pass. This is deterministic service evidence only.

   Patent review: `NOT_TRIGGERED` — tying cleanup eligibility to the canonical
   capability envelope is conventional fail-closed resource handling. See
   `docs/patents/REVIEW_LOG.md`.
   The syscall decoder now admits capability-selected shared-buffer reads and
   writes with implicit exact access modes, nonempty transfers capped at 1 MiB,
   checked shared offsets, complete canonical user ranges, and zero reserved
   registers. A generic executor now composes the current task capability space,
   exact selected binding, direction-validated user copy, opaque resource I/O,
   and fully erased caller scratch. It revalidates immediately before resource
   use and preserves user/resource backend errors. The kernel-image composition
   returns no handle or address. The x86-64 active-page copy adapter now walks
   every live user leaf under the expected current CR3, issues one exact task/
   range/direction ticket, consumes it once, and cancels it on later executor
   failure. A fixed-capacity opaque-resource table now owns monotonically issued
   handles, rejects live aliases and stale handles, bounds I/O before backend
   access, and integrates with final-reference retirement. Its direct-memory
   adapter is confined to an unsafe supervisor boundary. Cleanup now accepts a
   minimal native-mapping revoker instead of requiring full VMM authority. The
   active x86-64 service adapter removes only an exact expected CR3/mapping and
   invalidates local translations, enabling task retirement to precede reuse.
   KVM and WHP now accept kernel-side removal only after a complete read-only
   absent-leaf verification, then mark precisely that service slot eligible for
   re-arm; live leaves, invalid slots, and repeated observation fail closed.
   Backend-neutral policy is preserved: KVM and WHP now expose matching
   per-service resource-page lifecycles distinct from the common two-party
   diagnostic page. Admission rejects common-page or sibling virtual/physical
   aliases, maps only one service root, and zeroes backing before generation
   re-arm. KVM/WHP runners attach the distinct receiver page and couple host
   observation, zeroed restore, and final revocation to the existing service
   lifecycle. The kernel image now provisions separate exact receiver-only read
   and read/write capabilities plus binding/resource state, executes bounded
   shared-buffer syscalls through validated
   active user copy, and retires the exact active leaf, binding, and final opaque
   handle before host re-arm. Fresh one-time signed KVM and WHP probes check
   zero-before-use and write/read behavior in both generations plus absent-leaf
   observation and zeroed re-arm. These are hosted controlled probes, not host-
   resistant isolation or physical-hardware evidence.
   Service-side binding selection is implemented: the exact transferred
   capability and kernel-known VM/task identity must select exactly one live
   binding of the required access, while missing, ambiguous, and stale
   candidates fail before backend use and request bytes supply no binding ID.
   Bounded file reads are now implemented. Exact file `READ` authority is
   checked before range details, immutable file state must match its extent-map
   object/generation/length, sparse holes return zeroes, and every physical data
   extent is completely SHA3-256-verified by the backend before its requested
   subrange is copied. Reads are capped at 1 MiB and erase partial output after
   any backend verification failure. Bounded file writes are now implemented as
   COW preparation plus publication. Exact `WRITE` and conditional `RESIZE`
   authority precede all state disclosure; the patch is capped at 1 MiB; the
   complete successor map and canonical `FileMetadata` must bind the same object,
   exact next generation, length, and extent count; and new data ranges cannot
   overlap active data or protected metadata. The backend stages and flushes
   complete digest-verified new extents before returning an unpublished state.
   That state commits only through a COW plan containing the internally derived
   exact full-range zero-padded file-metadata and canonical zero-padded
   extent-list digests, while the
   backend verifies the complete logical-file content digest before flush.
   Explicit fixed-capacity multi-file transactions are now implemented. Each
   admitted prepared write retains its exact object predecessor/successor while
   its derived metadata images are bound to one independent volume-publication
   generation. Duplicate objects or metadata ranges, capacity overflow, missing
   plan writes, empty transactions, and wrong publication generations fail
   before backend I/O. One COW root transition produces a receipt whose exact
   participants can each activate once. Directory/allocator participation,
   concrete block/allocation integration, and crash recovery remain pending.
   The bounded redundant-root recovery selector is now implemented: both exact
   superblock records are decoded and passed to a complete-graph validation
   contract; two usable candidates must be identical at one generation or
   adjacent generations, and only the newer is selected. A single usable
   candidate is explicitly reported as fallback. Proven-invalid candidates may
   be bypassed, but indeterminate backend failures abort instead of silently
   rolling back. The exact-block adapter exists, but a concrete block
   service/device, power-loss harness, repair, and
   authenticated anti-rollback state remain pending, so
   crash recovery is still only partially implemented.
   Canonical checksummed allocation records and their fixed-capacity global
   ownership index are now implemented as the next validator prerequisite.
   Records bind one exact object generation, range, and data/metadata kind; the
   index requires physical ordering, volume bounds, reserved-block exclusion,
   and cross-object nonoverlap. Exact extent and metadata ownership queries do
   not accept containment, wrong generations, or kind substitution. A canonical
   block-aligned allocation image now binds its exact volume and publication
   generation, fixed record width/count, complete-image SHA3-256 digest, and
   zero-filled unused capacity. Decoding rebuilds all ownership invariants.
   Concrete block persistence and allocation/free mutation remain pending.
   Allocation-image ranges now use a distinct ownership kind and can be checked
   against the selected root and publication generation. Canonical block-aligned
   extent-list images now bind file identity, object generation, logical length,
   record geometry, complete-image SHA3-256, and zero padding; decoding rebuilds
   the exact-coverage extent map. These remove serialized-list ambiguity for the
   bounded reachable-tree traversal below.
   Bounded reachable-tree traversal is now implemented over an immutable-
   generation metadata-read contract. Canonical directory-entry images bind the
   owning directory/generation and rebuild duplicate namespace checks. Recovery
   walks the root and every directory/file child, validates exact parent and
   generation links, checks purpose-specific metadata ownership, reconstructs
   extent maps, requires exact ownership for every data extent, rejects repeated
   object references and capacity overflow, and finally rejects any allocation
   record not claimed by the reachable graph. The volume-scoped object-ID
   allocator is now part of that mandatory graph: exactly one root-owned,
   candidate-generation, purpose-specific record must decode canonically, and
   a concrete next ID must exceed every reachable local object ID; exhausted
   state remains valid and non-allocating. The backend remains an emulated
   immutable image; physical block integration, interrupted-write/power-loss
   evidence, repair, and authenticated anti-rollback remain pending.
   The selector and traversal now compose into one recovery entry point. A
   typed variant preserves each candidate's validated file states separately
   until root selection and exposes only the selected graph's exact file
   objects, generations, lengths, and extent maps. Focused simulation verifies
   selected-file lookup and absence without treating this integrity result as
   authority or anti-rollback authentication. New stable-authority recovery
   entry points require the selected file and reject a selected volume/root
   generation that differs from the unsafe owner-approved admission before any
   read or proof consumption. Reconstructed authority retains that authenticated
   root provenance. The selected configuration validator derives its file
   generation from a second reachable selection and compares that selection's
   volume/root against the temporary authenticated authority before any file
   read. Lower-level mechanism APIs retain explicit trusted-caller contracts;
   the typed selected path closes the in-memory root/file substitution gate. A
   controlled
   interrupted-publication simulation presents a checksum-valid
   newer superblock whose allocation image remains bound to the prior generation:
   complete validation proves the newer candidate invalid and explicitly falls
   back to the adjacent valid root. A separate injected read failure during the
   newer validation aborts recovery rather than being treated as corruption or
   permission to roll back. This is deterministic in-memory fault injection,
   not physical power-loss or device durability evidence.
   A separate deterministic durability model now splits volatile and durable
   metadata/superblock state and crashes after every publication operation.
   Verification or metadata-flush failures recover the old generation. Atomic
   replacement and final-flush failures exercise both permitted device outcomes:
   either the old root or the new root whose metadata was already durable.
   Successful final flush always recovers the new root, and no partial metadata
   generation is selectable. Physical-device cache, torn-write, and power-cut
   testing remain pending.
   Bounded allocation/free successor planning is now implemented. It verifies
   the active allocation image's exact self-ownership, advances exactly one
   publication generation, automatically retires the prior allocation-image
   claim, rotates to a disjoint new image, applies exact frees and additions,
   sorts the complete successor index, and rebuilds every invariant. An added
   range cannot overlap any active allocation even when that allocation is freed
   in the same unpublished successor, preventing pre-commit reuse. The canonical
   successor image is now encoded into caller-bounded storage,
   hashed over its complete bytes, staged and durably flushed through a narrow
   unsafe backend contract, and returned only as a prepared update. Transactions
   model volume-allocation state as a resource distinct from directory/file
   objects, require the exact derived image in the publication plan, and return
   the successor only after its one-use receipt is consumed. Directory
   successors now encode and stage the exact canonical directory metadata and
   entry-list images, flush both through one narrow durability contract, bind
   both ranges to a directory transaction participant, and expose the immutable
   next object generation only after its one-use publication receipt is
   consumed. Persistent object-ID allocation, inactive authority reservation,
   complete in-memory prepared-create coupling, and deterministic interrupted-
   create publication recovery and surviving-parent post-fail-stop child
   reconciliation are implemented in memory. A canonical bounded durable-grant
   checkpoint foundation now reconstructs fresh storage handles only from an
   exact externally authenticated volume, selected root generation, monotonic
   epoch, nonzero handle-generation high-water mark, and complete checkpoint
   digest. It serializes no bearer handle,
   rejects hidden bytes, capacity mismatch, forward/cyclic lineage, object/kind
   substitution, and rights amplification, and atomically advances its volatile
   replay/generation guards only after the complete fresh table is built. The
   table exposes the next generation strictly above every slot for the
   following authenticated checkpoint, preventing stale pre-reboot token
   collision. The grant policy is explicit rather than an automatic snapshot
   of transient capabilities.
   The checkpoint is now staged as the complete content of an exact capability-
   authorized stable-file successor. File WRITE/RESIZE precedes encoding,
   metadata binds object, next generation, length, content digest, and extents,
   and activation requires the matching COW transaction's one-use receipt.
   Recovery reads only the exact file generation selected by authenticated
   reachable recovery through separate bootstrap READ authority, preserves I/O
   uncertainty, and erases policy bytes after parsing. A one-use proof issuer
   now accepts only canonical bytes matching an exact unsafe owner-approved
   admission across digest, volume, selected root, epoch, and handle generation;
   no other safe API can construct the proof. The recovery guard likewise
   requires an unsafe authenticated rollback-state token instead of caller-
   chosen counters. Stable recovery issues only after successful authorized
   I/O, so pre-acceptance I/O failure remains retryable, while duplicate issue
   fails closed. A canonical 64-byte accepted-state record and backend-neutral
   authenticated monotonic-store contract now bind the accepted epoch,
   handle-generation pair, exact volume, and selected root generation. Genesis
   is explicitly unbound; after first acceptance, cross-volume substitution and
   root regression fail closed. Integrated stable recovery releases no rebuilt
   authority table unless compare-and-store matches the entire prior canonical
   record before replacement; corrupt state, stale conflicts, and backend
   uncertainty fail closed.
   A backend-neutral two-slot authenticated journal now implements that store
   contract over an unsafe exact backend. Each 112-byte slot binds its journal
   sequence and complete 64-byte state with SHA3-256. The authenticated
   monotonic counter selects one parity slot and is the sole publication point:
   the inactive successor must be durably written and verified before one exact
   serialized counter advance. Tests inject every protocol boundary, including
   a committed-but-uncertain increment, and never search or silently select an
   older slot. Firmware integration, owner provisioning/recovery, and physical
   power-cut validation remain pending, so Phase 6 item 1 is not
   complete.
   Its UEFI provisioning-admission prerequisite is now implemented: one bounded
   parser recomputes SHA-256 TPM Names over complete NV public areas and admits
   only three distinct owner-configured indices with a shared exact nonzero
   policy digest, an exact 8-byte counter, two exact 112-byte ordinary slots,
   policy-only read/write/no-DA attributes, and full-slot writes. Hostile tests
   reject aliases, shortened or substituted policy, extra authority, wrong type
   or size, and forged Names. The verified layout now feeds a concrete
   `RecoveryJournalBackend`: bounded policy-session `NV_Read`, full-slot
   `NV_Write`, and `NV_Increment` commands consume fresh one-use authorization
   from an unsafe provider bound to exact Name, policy digest, and operation.
   Exact response framing is enforced, writes are read-verified, and increments
   recheck predecessor and successor. The pre-existing rollback helper's command
   code was corrected from `NV_Write` to the actual `NV_Increment`. A concrete
   provider now starts a fresh unsalted, unbound SHA-256 policy session from
   explicit nonzero caller entropy, executes one exact owner-configured
   `PolicyPCR` recipe, and permits only the requested next NV operation. The
   safe composition path admits the complete layout before constructing this
   provider; authorization must match one exact admitted index/Name/policy
   tuple, and both command handle fields must repeat that index. Hostile tests
   reject Name, index, authorization-handle, and NV-index substitution before
   the target NV command reaches the backend. Immediate nonce reuse fails
   closed, and mismatch or policy
   failure triggers
   best-effort cleanup. Ambiguous NV transport failure now also clears the
   pending authorization and best-effort flushes the satisfied TPM session
   while returning the original error. A safe constructor now composes this
   provider, the
   admitted layout, the TPM backend, and the authenticated journal; an end-to-
   end hosted test loads and atomically replaces journal state while rejecting
   layout-policy substitution. The loader now accepts an optional exact all-or-
   none development configuration for the three indices and PolicyPCR recipe,
   composes the real TCG2 transport with one firmware-RNG call per session, and
   authenticates the selected journal record before `ExitBootServices`.
   Partial configuration, malformed state, or firmware uncertainty aborts;
   temporary state is erased. Canonical epoch, handle generation, optional
   volume, and root generation now cross a separately flagged 40-byte handoff
   record and are revalidated by early-kernel decoding before any memory region
   is emitted. Tests prove this metadata can exist while artifact rollback
   evidence remains false. It creates no recovery token, capability, or
   authority table. Actual owner-policy provisioning/recovery, native UEFI-
   target linkage/execution, signed booted storage-service invocation, and
   physical testing remain pending. An isolated operation-13 adapter now decodes one exact
   capability and canonical output address, validates the current task's fixed
   writable range through a one-use directional ticket before revocation,
   erases kernel scratch, and makes post-revocation copy uncertainty terminal.
   The kernel-image service dispatcher now routes that operation before generic
   decoding, binds the active CR3 and current task, and creates the exact
   metadata-only capability/delivery only for the initial service generation
   when metadata is present. UEFI-target compile/lint and focused unit evidence
   exist; no signed invocation or native boot evidence exists. A storage-side
   one-use wrapper now binds the handed metadata to the
   independently authenticated state store: one exact load and one exact
   compare-and-store are permitted, with replay, field substitution, malformed
   state, or store uncertainty releasing nothing and erasing output. The full
   configuration recovery simulation uses this binding before owner-approved
   checkpoint proof, capability-authorized I/O, dependent validation, monotonic
   commit, and service registration release results. A kernel delivery object
   now additionally requires one exact task generation, object, and exact non-
   delegable `READ` capability, revokes before copy, and consumes metadata after
   success. Wrong-service, wrong-object, overbroad/stale capability, replay, and
   replacement-task tests expose no data. The full configuration simulation
   traverses this delivery object before authenticated-store binding.
   The signed block-service launch ABI now supplies the exact token as its
   seventh SysV argument; CPL3 operation 13 returns one canonical fixed record,
   which the service verifies and erases. Windows gnullvm passed 451 kernel, 5
   KVM-runner, and 7 WHP-runner release tests; scoped strict Clippy and both
   focused UEFI image checks passed. Fresh independently signed controlled WHP
   and KVM probes reached exact service cleanup after this invocation. These
   are unit, ABI-compilation, and hosted controlled-probe evidence, not native
   UEFI, TPM, persistence, reboot, rollback-resistance, or physical evidence.
   The signed service now applies `BootRecoveryAdmission` to the delivered
   record and a separately constructed controlled test record before
   readiness. It requires exact equality, proves replay rejection with zero
   output, and erases both copies. Fresh signed WHP/KVM probes passed this path;
   both platforms also passed all 116 storage tests. The controlled provider
   now also participates in the full dependent transaction in the configuration
   client: exact owner-approved checkpoint proof reconstructs one private
   attenuated file capability, configuration and restart policy are validated,
   and only the fixed epoch 8→9, handle generation 2→3, root generation 1→2
   successor releases results. Fresh signed WHP/KVM probes and 27 configuration
   tests on Windows and Linux passed. This proves hosted orchestration and exact
   volatile compare-and-store behavior only; a conforming authenticated,
   power-loss-atomic backend and physical evidence remain pending.
   Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux/WSL2
   each pass all 447 kernel tests, all 20 `mrml-uefi` library tests, all 116
   storage tests, and all 27 configuration tests. Strict
   Windows Clippy and a hosted gnullvm loader check pass with `uefi-image`
   enabled; strict Linux crate-local Clippy also passes. The direct UEFI crypto
   dependency now disables its unused host-runtime default feature, so the
   optimized `x86_64-unknown-uefi` loader links successfully and strict target
   Clippy passes. Dependency inspection confirms `mrml-runtime` is absent from
   the firmware graph. A fresh QEMU/OVMF nested-KVM boot with pinned,
   independently signed artifacts produced `a1 a2 a3 a4 a5 a6 a7 a8 b1 b2 b3
   d0 d1 d2 d3 d4 df`, covering loader execution through kernel entry and the
   existing VMX-root probe. Building that ordinary signed service also exposed
   and fixed its feature-specific shared-buffer parameter names and confined
   recovery-only imports to the block-service feature. Recovery configuration
   was absent because no software TPM was available. This is controlled native
   UEFI execution, not provisioned TPM, recovery-journal execution, reboot,
   Secure Boot, bare-metal, or physical evidence.
   A generic consumed validation transaction now keeps that rebuilt table
   private while a dependent recovery validator uses one exact reconstructed
   file handle. The configuration adapter recovers only the selected file
   generation, rechecks configuration-root CONTROL and setting READ, binds the
   exact expected service policy, erases scratch, and releases neither result
   until compare-and-store succeeds. Validation failure does not consume the
   accepted monotonic state. This is unit/simulation composition rather than a
   live reboot path.
   Service registration now has an exact non-mutating slot/generation plan and
   consumed commit. Dependent validation can prepare that plan while authority
   remains private; after monotonic compare-and-store, a committed-authority
   wrapper and matching epoch are required to publish configuration, authority,
   and the running supervised service together. Stale-slot commit fails without
   mutation. A deterministic exact-block/block-service test covers this typed
   in-memory boot sequence, but no real reboot or persistent backend is claimed.
   A conforming TPM NV or equivalent power-loss-atomic backend remains pending.
   The platform owner-policy authenticator/UI and boot orchestration remain pending, so
   reboot-time capability reconstruction is still partial. A hosted/physical
   device backend and physical
   power-loss evidence remain pending. A focused signed KVM/WHP controlled
   probe now instantiates the bounded block-service loop in an isolated CPL3
   process against a volatile one-page in-image backend. A separate client has
   only delegable shared-buffer authority and verifies both responses, while
   the service verifies the written and returned bytes;
   the client and service then retire through the supervised cleanup path. The
   launchers require ordered client erasure, exact peer-death delivery, service
   mapping/resource erasure, and terminal proof that both slots have no task or
   pending cleanup. This does not establish device durability or physical
   isolation. The bounded block-service core and exact-block
   metadata publication/recovery and file-data adapters are implemented as
   described above.
4. Add snapshot objects and capability enforcement, then system-generation and
   authenticated update integration.
5. Add compatibility filesystem readers and optional advanced storage features
   only after measured need; they do not define native semantics.
6. Implement a network service returning bounded connection capabilities.
7. Add firewall/network-policy as defense in depth outside the kernel.
8. Add tool and local-inference services over control and bulk IPC.
9. Establish bounded structured audit foundations with explicit event purpose,
   retention, access, erasure/redaction, and content-minimization rules.

Security gate: services start with explicit least authority; paths, ports,
names, identity, and signatures do not grant ambient access; raw packet/device
access is separately privileged; service failure is contained. Filesystem names
and IDs never authorize, rename preserves object identity, transactions are
all-or-nothing, covered corruption is detected, inconsistent recovery fails
safely, and snapshots require authority without implying anti-rollback.

### Phase 2 virtual-device and service progression

The canonical cross-device plan and acceptance scenarios are in
[PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md). Dependency order is: common
lifecycle/transport; complete the MRML-native block transport; PCI attachment;
VirtIO-blk compatibility and QEMU differential testing; capability-native share
protocol; deterministic hostfs; VMM hostfs; optional VirtIO-fs compatibility;
virtual accessibility bus; Braille, switch/alternative-input, and deterministic
speech/audio emulators; networking; broader input/graphics/audio; then physical
USB accessibility adapters. Phase 2 may build accessibility virtual hardware and
test harnesses, but connection to semantic accessibility waits for the Phase 3
Semantic Scene Graph and capability prerequisites.

The existing serial/console bring-up path remains available. Establish common
queue, lifecycle/reset, interrupt, PCI-transport separation, and differential
harnesses before broad device coverage. Compatibility emulation appears only
where required, and every applicable device behaves consistently under KVM and
WHP.

**PARTIALLY IMPLEMENTED:** the first MRML-specific virtual-block device core
defines canonical fixed requests/completions, disjoint bounded shared rings,
read/write plus negotiated flush, monotonic request IDs, bounded GPA/length
validation, generational in-flight tickets, explicit lifecycle transitions,
and reset/removal invalidation. The backend-neutral VMM copy bridge returns no
request until it publishes consumption and permanently poisons on uncertain
guest-memory I/O. A backend-neutral executor copies reads and writes through
erased bounded private scratch, issues flush only after admission, returns a
detail-free device error for a backend-guaranteed clean rejection, and fails the
device plus bridge after uncertain mutation. A complete one-request transaction
now preflights admission and completion-ring
capacity before consumption, distinguishes idle and backpressure, rejects a
consumed malformed request before backend access, executes once, and publishes
the bound completion. If completion publication becomes uncertain after possible
mutation, the device and bridge fail rather than retry. A production block
backend, QEMU comparison, and fuzzing remain pending. The bounded signed
PCI-MMIO write/read/flush/acknowledgement probe described below is complete.
This is not VirtIO-compatible. Completion publication now latches one coalesced
notification. Delivery uses the device-configured vector through the existing
allowlisted, exact-`SIGNAL`-capability VM interrupt boundary and acknowledges
the latch only after confirmed backend injection. Denial and uncertain
injection retain it; reset, removal, and failure invalidate it. This composition
is simulation-tested shared policy, not a concrete KVM/WHP device attachment.
An optimized 10,000-iteration in-process regression baseline measures the full
mock transaction-through-acknowledgement policy composition on Windows gnullvm
and Arch Linux/WSL2; it is not storage, hypervisor, or hardware-interrupt
latency evidence.
The MRML-specific block doorbell is now an exact 32-bit write-only scalar tuple
over the common deny-by-default I/O dispatcher. It rechecks port, width,
direction, and value before queue access and processes at most one request per
accepted disposition. The port and value carry no backend or interrupt
authority. A backend-neutral one-exit runner now composes backend execution,
exit accounting, common I/O dispatch, exact doorbell handling, one queue
transaction, and capability-authorized notification delivery. It delivers an
already pending notification before another vCPU entry and fails the VM on any
runner-stage error. Both prepared native guest types satisfy its memory
contract. Controlled signed KVM and WHP images now execute eight bounded write/
read cycles over a two-slot queue. Every cycle fills both slots before
retirement, drains both protected completions in order, reuses both slots for
reads, and compares two complete pages with distinct per-cycle patterns. Signed
read-only descriptor data supports exact interrupt entry and return. This is
live-verified on both hosted backends. The guest still lacks a general interrupt
framework and unbounded progress.
The same common runners now require a separately provisioned live block
capability for one exact backend object and reauthorize `READ`, `WRITE`, or
`FLUSH` for each matching operation. Focused tests prove attenuation,
wrong-object selection, and revocation fail before backend I/O, while backend
rejection-versus-uncertainty semantics remain unchanged. Fresh signed KVM and
WHP controlled probes exercised the common capability-selected path. A checked
backend start/count now translates guest-relative blocks, rejects empty,
overflowing, malformed, or cross-boundary regions before I/O, and must equal
the device's advertised block count before vCPU entry. Nonzero translation is
simulation-tested; hosted probes exercise a full two-block region. A production
backend and physical-device evidence remain pending, so the complete MRML-native
block gate remains partial.
Prepared KVM and WHP guests now implement the common virtual-block memory
contract and transactionally attach the validated request/completion ranges.
Native request memory is guest-writable, while completion memory rejects the
ordinary guest-write path and remains writable by the isolated device path.
Dedicated kernel-block launch builders now install the same directionality in
the initial guest page tables: request ranges are identity-mapped RW/NX and
completion ranges R/NX. Controlled live tests cover both backends, including
overlap rejection and KVM native-slot undercapacity. The signed probe now
exercises these mappings as the bounded write/read producer-consumer pair
through the common runners.

The backend-neutral completion bridge now owns its monotonic consumer position
instead of trusting a guest write into the read-only completion page. An exact
32-bit write/value acknowledgement at port `0x4d43` retires one published
completion only after confirmed interrupt delivery and updates the protected
header through the device path. Every scalar is rechecked before state or
memory access; empty, premature, wrong-queue, terminal, or uncertain accepted
acknowledgements fail closed. Signed KVM/WHP images now contain the matching
consumer and exercise 32 protected acknowledgements across repeated two-slot
reuse, with live controlled evidence on both backends.

The next reusable-driver prerequisite is now a canonical 128-byte active-device
configuration record. It is explicitly MRML-specific and binds generation,
geometry, supported/negotiated features, exact queue layout, vector, ports,
transfer bound, and wire sizes with zero reserved bytes. Only a fully active
device can produce it. A decoded copy must reconstruct the queue exactly and
match the current live device; reset makes the old generation stale. The record
carries no authority. A typed page binding now additionally requires one
page-aligned, queue-disjoint GPA and the exact configuration/queue pair. The KVM
and WHP block launch builders publish the fully zeroed page through their
host/device-only paths and identity-map it read-only/NX. Signed guests on both
KVM and WHP now discover this record in live controlled probes. PCI or another
transport remains pending.

The first reusable guest-driver state is now implemented as allocation-free
backend-neutral policy. Fresh discovery requires the canonical configuration
plus four exact zero queue counters. Nonzero reconstruction now requires a
canonical 192-byte live resume record containing the complete configuration,
four queue watermarks, and separate last-admitted and last-published request-ID
anchors. The active device and unpoisoned bridge capture it only from a stable
queue; uncertain reads poison the bridge. Reconstruction accepts exactly the
configured physical request slots, revalidates every outstanding canonical
request and geometry, requires strict ID order and both history anchors, and
rebuilds pending ownership without republishing or retrying work. The record is
data, not authority. Request preparation
is non-mutating, exact publication tickets fill at most the configured queue
capacity, and completion acceptance binds the next published counter and slot,
generation, request ID, status, and expected byte count before returning an
acknowledgement. Completion preparation changes no state, allowing the exact
protected acknowledgement to be published before a fresh ticket commits
retirement. Stale ticket replay cannot free capacity. Slots cannot be reused
before exact in-order retirement, and reset/removal invalidates every
outstanding descendant. Geometry, buffer
arithmetic, flush features, replay, stale tickets, terminal reset/removal, and
exhaustion fail closed. Reset rediscovery now records the exact terminal cause,
accepts only a canonical exact-successor generation with four zero queue
counters, and leaves all state unchanged on rejection. Removal and request-ID
exhaustion cannot be rediscovered. One-time-signed compiled KVM and WHP images
now discover and execute this common driver across eight bounded cycles. Each
cycle publishes two disjoint writes before either completion retires, drains
both in order, and reuses both slots for corresponding reads against a volatile
two-page backend. The exact probe budget covers 32 requests and their 32
protected acknowledgements; counters advance beyond queue capacity while the
two physical slots repeatedly wrap. Live presentation of the resume record is
now implemented with KVM/WHP parity: one typed page must bind the exact
configuration page and queue, remain disjoint from every launch range, is
initialized and republished as a complete zero-padded canonical image through
the device path, and is guest-read-only/NX. The host now selects the recovery
cut immediately after common processing has consumed requests 13 and 14 and
published their protected completions but before another guest entry. The
guest contains no checkpoint port, and the launchers contain no checkpoint I/O
permission or exit. The host requires producer/consumed/published watermarks 14
and consumer watermark 12, then publishes nonzero state while execution remains
stopped. The replacement guest reconstructs two pending ownership records from
the complete page plus both request slots, retires the already-published completions in order,
and continues through operation 32. Canonical capture/publication now requires
an explicit device `Suspended` state in addition to the stopped vCPU. Suspension
admits no device in-flight slot or pending interrupt, and the device resumes
only after publication and all state checks succeed. Fresh signed KVM execution
covers this checkpoint. WHP source parity is present, but this increment has no
new WHP build or execution evidence because the available Windows shell lacked
its linker. KVM now has controlled native VM-replacement evidence: the runner
never resumes the stopped VM, prepares a new VM from the same verified
executable and canonical handoff, copies canonical request, completion, and
resume pages while the device remains suspended, requires fresh zeroed payload
memory, then resumes the retained device only after complete restoration. Each
queue page contains only its two required counters and two live slots; all
other bytes are zero. The fresh kernel
entry accepts only all-zero launch state or the exact `14/14/14/12` checkpoint
and matching ID anchors before reconstructing. The device, bridge, volatile
backend, and common policy VM identity are retained, so this is orderly
execution replacement, not crash recovery. The WHP runner now has the same
consuming partition replacement and canonical three-page restoration source path;
native Windows `check --tests` and strict Clippy pass with CUDA excluded. A
linked/live WHP replacement run remains pending because the available shell
lacks `link.exe`. Both runners now consume ownership of the old VM and destroy
it immediately after the bounded snapshot, before replacement preparation.
Failure therefore cannot fall back to old execution and leaves the retained
device suspended. Fresh signed KVM execution covers this stronger ordering;
WHP remains compile/lint-only. Both runners now delegate canonical capture and
restoration to one allocation-free common-kernel restart image. It validates
the published page against the suspended device/bridge state, copies only live
request/history and unretired completion slots, rejects mismatched completion
identity/status/length, and preflights zero queue extents plus the exact fresh
configuration-bound resume page before any restoration write. Directional
slot/counter publication and poison-on-uncertainty are common rather than
launcher policy. Restoration consumes the non-clonable image once and
volatile-erases its encoded queue/resume storage on every return; the exact
capture type cannot call restoration. Both hosted runners first consume and
destroy the old native VM, then cross one documented unsafe boundary that
converts the image into a distinct linear lost-execution witness. Only that
type is accepted by restoration; it is not authenticated evidence or resume
authority. The exact
policy budget is reduced to 64 common block exits. This is deterministic
host-forced execution loss, not asynchronous/unplanned crash capture.
Asynchronous crash orchestration, backend-in-flight recovery, and unbounded
progress remain pending. The MRML-native PCI-MMIO probe now consumes and
destroys its old VM after five fully retired operations, restores the canonical
idle queue/resume image into a fresh MMIO-trap guest while the retained device
and attachment remain suspended, and resumes only after exact reconstruction.
Transport substitution is rejected before restoration. This is orderly
replacement, not asynchronous crash recovery.

Both scalar transport directions now cross one common backend-neutral
transaction runner. Each invocation delivers any pending completion interrupt
before entry, accounts exactly one native exit, accepts only the canonical
doorbell or protected acknowledgement tuple, performs its exact queue
transition, and delivers a newly latched interrupt before returning. Every
other exit or stage failure fails the VM. KVM and WHP launchers no longer
choose separate doorbell and acknowledgement runner functions. The caller
still supplies an exact finite exit budget and invokes one transaction at a
time; a general scheduler-integrated loop remains pending.

The transport-separation prerequisite is explicit: each virtual-block device
owns one transport identity, and the canonical configuration, guest queue
publisher, protected acknowledgement path, device handlers, and common host
runner all derive their mechanics from that same binding. Implemented
identities are deliberately named `MrmlSpecificScalarIo` and
`MrmlSpecificPciMmio`; their record encodings remain canonical and carry no
authority. The PCI-MMIO slice covers one test-only function, exact BAR
assignment/memory enable, and a bounded two-write/two-read/one-flush queue cycle
with protected acknowledgement. It does not implement production native
interrupt routing, MSI/MSI-X, DMA, VirtIO compatibility, or a QEMU differential harness.
Those gates remain before broader virtual-device coverage.
The KVM and WHP launchers now also derive their complete two-rule VM I/O
allowlist transactionally from that exact transport binding and construct the
device with the same value. Admission no longer repeats independent global
port constants. Exact scalar writes are admitted; reads, wrong widths, and
unrelated ports remain denied. This closes scalar admission-policy separation,
not the pending PCI or QEMU gates.

The first unattached PCI configuration-state core is now implemented. It
models one exact 64-byte Type-0 header with caller-supplied identity data and
one bounded 32-bit non-prefetchable memory BAR. It implements aligned 1/2/4-
byte reads, exact all-ones BAR size probing, masked BAR assignment, and
transactional writes to only the command register or BAR. Bus mastering and
all unsupported command bits are rejected without mutation; BAR assignment is
data and does not map host memory. Memory decode now requires an assigned BAR,
relocation is rejected while decode is active, and reset advances an exact
generation before clearing command, BAR, and probe state. Old MMIO-window views
then fail as stale; generation exhaustion preserves the live state. This is
local unattached reset coupling only, not native mapping or interrupt cleanup.
This is not yet a PCI-presented block device or a compatibility claim. Assigned
MRML vendor/device IDs, capabilities, MSI/MSI-X, additional BARs, VMM
configuration-space routing, attached revoke-before-reset composition, guest-
driver discovery, and QEMU differential testing remain dependency gates.
A backend-neutral fixed-capacity router now covers the policy half of
configuration-space routing. It validates exact segment/BDF locations, rejects
non-reset attachment state, duplicates, and absent functions, routes bounded
reads/writes to one function, uses generational host-side attachment IDs for
reset/removal, forbids detach while memory decode is active, and preserves live
state on capacity or generation exhaustion. This does not decode KVM/WHP exits,
define an ECAM or legacy
configuration transport, assign MRML identity, attach block, map a BAR, or
authorize interrupts/DMA. Those integrations remain the next gates.
The canonical shared Configuration Mechanism #1 transport contract is now also
implemented. It owns the `0xCF8` selector, derives the complete eight-rule
`0xCF8`/`0xCFC` scalar-I/O policy, validates reserved bits and exact byte/word/
dword data-port geometry, decodes segment-zero BDF/register state, and composes
present accesses with the router. Disabled or absent reads return only the
appropriate all-ones width and writes are ignored. KVM/WHP runner integration,
guest register completion, one test-only attached block function, and bounded
trapped BAR block notifications are now implemented. Production identity,
native PCI interrupt routing, MSI/MSI-X, DMA, and QEMU comparison remain
pending.
A common one-transaction PCI runner now composes the existing VM exit budget and
deny-by-default dispatcher with Mechanism #1 and the router. Read outcomes cross
a narrow backend completion contract carrying exact vCPU, port, width, and
bounded value; writes never invoke it. Transport failure, completion uncertainty,
or any other exit fails the VM before another entry. Mock-backend tests cover
present and absent reads plus failure. Both native implementations now satisfy
that contract. KVM completely re-decodes the mapped run page, requires exact
vCPU/port/width/count/data-offset identity, and writes only the selected bytes.
WHP retains the exact per-vCPU port/width/instruction-length tuple and installs
the architectural-width RAX result with a checked next RIP in one register-set
operation. Both deny duplicate or mismatched completion and block vCPU re-entry
while a read remains pending. A freshly signed controlled kernel first composed
the common runner with both native backends for an absent BDF and exact all-ones
completion. It now discovers one exact test-only block attachment at BDF
`00:04.0`, reading fixed vendor/device and mass-storage-class dwords before proof
continuation on KVM and WHP. The same signed probe now assigns and enables one
exact BAR, publishes two writes, retires their protected completions, reuses
both slots for reads, retires those completions, submits one explicitly
negotiated flush, retires its zero-length completion, and verifies both payload
pages on both backends. Production native PCI interrupt routing, MSI/MSI-X, DMA,
production identity, durable block I/O, and QEMU comparison remain pending.
Attached reset/removal ordering is now enforced at the router boundary.
`VirtualPciFunctionRevoker` is an unsafe exact-generation contract whose success
must retire every native mapping, interrupt, DMA binding, queue, cached decision,
device state, and derived handle. Router reset and detach preflight identity,
generation capacity, decode state, and assigned MMIO-window state before
invoking it, including residual window identity after decode is disabled;
revocation failure preserves configuration, while success precedes reset or
removal mutation. Focused tests cover exact cleanup identity, stale-window
invalidation, quarantine-preserving reset/detach failures, independent success,
and no cleanup call after preflight failure. Controlled KVM/WHP destroyed-VM
revokers now retire the exact native execution container, preflight the complete
cleanup record and both capabilities, revoke backend and interrupt authority,
reset the block attachment, and then allow PCI generation advance with BAR/
decode clear. The controlled KVM/WHP path exact-matches, removes, and verifies
absence of its non-global first-level BAR trap leaf while the sole vCPU is
stopped. It publishes a no-reentry quarantine before mutation,
rejects pending emulation, a changed root, PCID, or a multi-vCPU backend,
rewrites the exact CR3 through KVM/WHP, and reads it back before permitting
later entry. Failure leaves the quarantine permanent. Controlled signed probes
cover successful withdrawal on both backends. A fresh one-use-signed artifact
emits a second exact port/width/value proof after that withdrawal; KVM and WHP
both resume the same guest and return the marker before cleanup.
SMP/asynchronous shootdown, hotplug, and production native revokers remain
pending.
Memory-decode command writes are now transactionally coupled to native BAR
state. `VirtualPciMemoryMapper` is an unsafe exact-generation boundary: enable
must map the complete assigned window before the command bit publishes, while
disable must make that exact mapping unusable before the bit clears. Rejected or
uncertain native results preserve configuration; uncertainty requires VM
quarantine/failure. Default router/transport/common-runner entry points use a
deny mapper, and the explicit mapper-aware runner is required for a present
function. Tests cover exact mapping/unmapping identity, deny-by-default enable,
failure preservation, independent successful transitions, mapper-free BAR
assignment, and common-runner VM failure on mapping rejection. A backend-aware
variant now passes the same stopped backend that produced the configuration
exit into the exact mapper without aliasing. The controlled KVM/WHP adapters
begin with the BAR leaf absent, install and verify it plus reload/read back CR3
before decode publishes, reconstruct it for replacement, and coherently
withdraw it before decode clears. Wrong-leaf and replay attempts fail, and the
signed guest proves traffic plus post-withdrawal continuation on both backends.
This completes the sole-vCPU install/withdraw mapper prerequisite;
SMP/asynchronous shootdown and production reset/remove revokers remain pending.
The first authorized concrete-function policy slice now binds one routed PCI
generation to an active MRML-native block generation, exact queue/vector, and
capability-selected backend region. A block-specific mapper records only a
confirmed exact BAR window; reset/removal composes external resource cleanup
before both block and PCI lifecycle mutation. Focused hostile tests cover stale
generations, class/geometry substitution, poisoned queues, mapping rejection and
uncertainty, cleanup failure, reset, and detach. This is host-side unit/
simulation policy. Signed guest-visible identity/class discovery, guest BAR
assignment, memory-decode enable, five trapped MMIO block notifications,
protected MMIO acknowledgements, exact native write retirement, and complete
payload comparison now pass on KVM and WHP. The fifth request is an explicitly
negotiated, independently `FLUSH`-authorized backend flush. Production native
PCI interrupt routing, MSI/MSI-X, DMA, durable block I/O, QEMU comparison, and a production
PCI identity remain pending, so the broader PCI attachment/transport gate is
still partial.
The `BLOCK` reset acceptance slice now has host-side simulation and controlled
KVM/WHP execution for a reset
with one published-but-unacknowledged completion and one request still in
flight. Reactivation requires a fresh queue bridge and attachment at block and
PCI generation 2; across the combined simulation and hosted evidence, the old
MMIO acknowledgement, BAR window, attachment, completion ticket, and
generation-1 request all fail before successor mutation,
and a fresh generation-2 request remains admissible. The controlled hosted
probe stages the two pending ownership classes in native guest memory after the
signed workload, destroys that VM/partition, revokes the old block and interrupt
capabilities, performs the exact common reset, rejects both stale identities,
and issues fresh successor capabilities before admission. Resumable dynamic
native unmapping/hotplug, durable backend recovery, and QEMU differential evidence
remain pending, so this does not complete `BLOCK` acceptance.
Legacy completion notification now also revalidates the exact live router
generation, BAR, memory-decode, and interrupt-disable state. The first signed
completion is retained while masked, the guest explicitly unmasks the same
function, and the next common entry performs the existing independently
capability-authorized injection. This remains test-only legacy delivery, not a
production native interrupt adapter.

The common driver now has an unsafe backend-neutral guest queue-transport
boundary. It derives every header and slot address from the canonical
configuration, publishes a complete request before its producer, and rings only
the exact configured doorbell after publication. It acquires the completion
watermark before copying the exact next consumer slot and uses the exact
protected acknowledgement tuple to publish only that one consumer before
committing retirement. A watermark ahead of the consumer does not skip entries.
A reported transport failure guarantees no counter or notification became
visible and leaves driver state unchanged; stale tickets fail before transport
access. The unsafe contract requires exact non-redirected access,
release/acquire ordering, exact port/value tuples, and unchanged counters on
error. A concrete x86_64 identity-mapped implementation now uses exact volatile
copies, aligned volatile counters, release/acquire fences, exact 32-bit port
output, and fail-stop acknowledgement observation. Its controlled port model is
unit/simulation evidence. Live signed compiled KVM and WHP probes now execute the
privileged native `OUT` path, shared host runner, exact capability-authorized
interrupt, protected acknowledgement, and complete two-page write/read comparison.
This does not verify native boot, durability, PCI, or physical hardware.

Networking proceeds from capability-bound network objects and a basic native
service to packet buffers/rings, a basic backend path, firewall integration,
then a VirtIO-net-compatible device and QEMU comparison. Multiqueue, offloads,
and tuning follow baseline correctness and measurement.

Audio proceeds from capability-bound device/playback/capture/session objects and
an explicit timing/format model to userspace mixing, basic output, capture,
trusted capture indication, trusted accessibility speech output, local trusted
speech capture/control, then VirtIO-sound or an MRML virtual-audio device
connected to the host service. Application playback/capture, accessibility
speech, VM audio, and notifications retain separate capabilities and privacy
boundaries. Latency/jitter measurement precedes advanced routing and
multi-device work.

USB proceeds from device/interface/endpoint capabilities and a host-controller
abstraction through enumeration and bounded descriptor parsing, then HID and
storage classes, refreshable Braille and accessibility HID protocols, other
classes as needed, per-interface delegation, VM
passthrough lifecycle, and physical IOMMU/DMA validation. Legacy controller
emulation comes only with a demonstrated compatibility need.

Security gate: device creation grants no implicit backend authority; descriptors
and guest memory are bounded and directional; stale queue state dies on reset;
host policy cannot be bypassed by a guest; capture and playback, composite USB
interfaces, ordinary input and secure attention, and paravirtualization versus
passthrough remain distinct authorities.

## Phase 3 — Safe applications and trusted GUI foundation

The GPU dependency lane is canonical in
[gpu/GPU_ARCHITECTURE.md](gpu/GPU_ARCHITECTURE.md): native semantic/object and
capability specification; safe command/IR and GPU-0 reference transfer;
VirtualGPU control, accounting, timelines, compute, rendering/presentation,
reset, fuzzing, and conformance; Linux oracle tooling; then physical Blackwell
transfer/compute/matrix/desktop/VirtualGPU host and later advanced features, AMD,
Intel, optimized libraries, and compatibility expansion. VirtualGPU is GPU
priority 1 and Blackwell is priority 2; compositor/application prerequisites
remain in their existing order. API simplicity precedes feature growth: stable
objects stay separate from evolving AI/compiler IR; Safe, Advanced, and Raw
profiles remain distinct; VirtualGPU compactness/fuzzability tests portable
additions; Blackwell-driven expansion requires portable justification and
performance evidence.

Before trusted consent UI, establish the application-facing foundation:

1. Specify bounded versioned service protocols and a safe SDK without freezing
   Rust's internal ABI or creating a general public C/C++ ABI.
2. Define transitive memory-safe application admission and dependency/FFI rules.
3. Project the same capability-preserving API into application microVMs.
4. Define logical display coordinates and output identities for fractional
   per-monitor HiDPI.
5. Define capability-bound graphics objects, keeping surfaces, buffers, render
   devices, display outputs, command queues, and fences distinct.
6. Implement the trusted compositor boundary, non-spoofable domain identity,
   surface commit protocol, and backend-neutral compositor/display interface.
7. Implement software composition, GOP presentation, and damage tracking in
   that order.
8. Add bounded asynchronous fence semantics.
9. Define the VGPU resource protocol and shared command/completion transport,
   then implement accelerated VGPU rendering.
10. Support live GOP-to-accelerated takeover and accelerated-failure-to-GOP
   recovery; native physical GPU backends come later.
11. Implement a bounded, generational semantic scene graph with authorized
   incremental subscriptions and resynchronization.
12. Add deterministic focus order and keyboard semantic actions, then a bounded
    accessibility semantic API with uniform secret redaction.
    Keep that documented API available to third-party assistive tools under the
    same capability and admission rules.
13. Add basic trusted local speech output and a Braille representation/backend;
    simulated evidence does not establish physical-device compatibility.
14. Add Braille input/routing and local deterministic speech input/control over
    semantic actions, preserving distinct microphone and device authorities.
15. Benchmark scene updates, input-to-action latency, composition, damage,
    synchronization, scaling, takeover, and recovery.

**PARTIALLY IMPLEMENTED (steps 4-5 foundation):** the kernel now validates
bounded signed logical rectangles, rational scale values, physical extents,
buffer format/stride/length, and damage confined to one surface. Exact
generational `Surface`, `GraphicsBuffer`, and `DisplayOutput` identities remain
distinct. One atomic admission checks separate control/inspect/read capabilities
and consumes itself into an immutable data-plane binding, so buffer traffic
cannot select a different surface, output, generation, or authority. The
binding retains exact handles and fails revalidation after revocation or slot
reuse without replaying placement policy. This is a
host unit-tested kernel contract, not a complete application wire path,
trusted registry/compositor, dual-placement GUI application, GOP presentation,
fence path, Semantic Scene Graph, WHP/KVM GUI parity, or physical display
evidence. Those steps remain in the listed dependency order.

**PARTIALLY IMPLEMENTED (step 1 surface slice):**
`org.mrml.interface.gui.surface@1` now fixes a SHA3-256-fingerprinted
`mrml-call-v1` commit envelope, canonical bounded surface-state record, explicit
eight-rectangle damage ceiling, and typed response. A kernel adapter revalidates
the source-level state, resolves opaque handles through a trusted object resolver,
compares wire buffer metadata with the authoritative descriptor, and invokes the
same capability admission. Windows and Arch Linux/WSL pass three interface tests
and 535 kernel tests. Native IPC and a backend-neutral microVM queue are now
**PARTIALLY IMPLEMENTED** with the identical fixed surface frame and common
registry/kernel admission; eight focused compositor tests pass on Windows and
Arch Linux/WSL. The queue is not guest-mapped or exercised through WHP/KVM;
registry lifecycle in a running compositor and the representative dual-placement
GUI application's live surface connection remain next. The new
`org.mrml.app.gui-probe` already supplies a placement-independent client state
machine over the interface-owned canonical frame and an independently signed
application PE. The identical release artifact set completed the ordered
six-stage signed-kernel CPL3 lifecycle and teardown in Total mode on WHP and
nested KVM. This is **PARTIALLY IMPLEMENTED** identity/lifecycle parity; the
executable does not yet issue a surface call from inside either placement.

**PARTIALLY IMPLEMENTED (step 6 registry prerequisite):** the new
`org.mrml.service.compositor` package owns a bounded volatile generational table
for surfaces, display outputs, and graphics buffers. It retains exact existing
capabilities/descriptors, rejects duplicate identity/authority, wrong-kind and
stale lookups, returns authority on retirement, and permanently stops reusing a
slot if its generation exhausts. A nonzero supervisor-supplied service generation
occupies separate handle bits, so restart does not reset the per-slot namespace.
Five Windows and five Arch Linux/WSL tests
include a canonical interface-decode -> registry-resolve -> kernel-admit ->
revocation-aware binding path. The package manifest declares both native-service
and microVM support, but metadata is not runtime evidence: neither placement,
IPC/queue transport, composition, nor presentation has run.

The graphics device may add VirtIO-GPU compatibility for guest display and 3D
interoperability, with QEMU differential tests. It must preserve the existing
MRML-specific CUDA compute protocol as a separate capability surface carrying
signed kernel admission, authenticated queues, quotas, watchdog/reset, and CPU
fallback. Display compatibility must not regress CUDA capability or performance.

Security gate: ordinary native apps cannot introduce unsafe native code or
ambient authority; VM transport cannot widen capabilities; applications cannot
spoof trusted surfaces; stale semantic identities/deltas cannot target reused
objects; surface/buffer ownership cannot become scanout or cross-process access;
backend changes preserve validation; semantic inspection and raw input remain
separate authority; trusted prompts have nonvisual semantics; accessibility
cannot bypass secret redaction or grant universal observation/input authority.

## Phase 4 — Browser and AI application control

The canonical dependency order and acceptance gates are in
[BROWSER_SEMANTICS.md](BROWSER_SEMANTICS.md): Semantic Scene Graph; browser tree;
focus/keyboard; Braille/speech; trusted chrome; bounded text-only AI; no-JIT
JavaScript and dynamic semantics; browser-only no-JIT WebAssembly and semantic
bridge; scoped media/multimodal inspection; monitor-off and blind-user testing;
then semantic ABI stabilization. Earlier script execution never establishes
accessibility completeness.

1. Build the browser as isolated services with no JIT and strict W^X.
2. Keep WebAssembly inside the browser boundary and mediate every sensitive API
   per origin and capability.
3. Expose a sanitized semantic document tree with deliberate bounded actions.
4. Project that same tree to browser accessibility and keyboard operation.
5. Represent visual web/media content as lazy capability-controlled objects
   carrying captions, transcripts, audio descriptions, chapters, language, and
   timing where available.
6. Add authenticated application-VM semantic projection, then bounded bridges
   from compatibility-guest accessibility APIs; guest content cannot assert
   trusted host identity.
7. Add cohort-normalized fingerprint surfaces and regression testing against
   independent fingerprinting suites.
8. Add local/remote AI disclosure controls, incremental graph transport, and
   explicit visual-inspection requests.
9. Restrict remote AI to capability-scoped semantic views and preserve useful
   operation with no AI, local AI, or interchangeable remote providers.
10. Add browser anti-tracking tests and an owner-controlled, selective-
    attestation policy that avoids stable ordinary-service device identifiers.

Security gate: web content cannot reach native admission, arbitrary JavaScript
control, browser memory/debug authority, raw devices, or W+X execution; AI does
not receive secrets, screenshots, media, HID injection, or global GUI control
without the exact capability. Fingerprint claims require empirical evidence.

Accessibility verification proceeds alongside Phases 3 and 4 rather than after
the GUI is complete. Add semantic completeness, focus ordering, keyboard-only,
Braille/speech representation, redaction, trusted-prompt, VM/browser projection,
HiDPI/backend-independence, and capability tests. Dogfood core workflows without
pointer or framebuffer inspection. Add physical Braille and alternative-device
tests when hardware is available and label simulation separately. Extend
accessible semantics into boot errors, rollback, login, recovery, and repair as
early as service/hardware prerequisites permit without claiming unfinished
early-boot support.

### Accessibility dependency lane

Within and across Phases 3 and 4, preserve this dependency order:

1. prove Semantic Scene Graph correctness and incremental synchronization;
2. add deterministic focus and keyboard semantic actions;
3. define a bounded accessibility semantic API with shared redaction;
4. add automated semantic completeness, action, and parity tests;
5. add trusted local speech output;
6. add the transport-neutral 40-cell-baseline Braille line presentation;
7. add bounded interoperable physical Braille transport;
8. add Braille routing and input through semantic actions;
9. operate trusted prompts through Braille and speech;
10. integrate browser structured accessibility;
11. pass a basic monitor-off desktop workflow;
12. add authenticated VM and compatibility accessibility bridges;
13. add deterministic local speech control before optional AI interpretation;
14. add Deaf/hard-of-hearing semantic system-event parity;
15. refine cognitive, motor, and low-vision behavior;
16. conduct practical usability testing with disabled users across multiple
    interaction modes;
17. pass the full supported monitor-off core suite;
18. only then consider accessibility ABI stabilization.

User testing cannot be deferred until after ABI freeze. CI grows to cover
semantic completeness, focus, keyboard-only operation, shared redaction,
trusted prompts, AI/accessibility parity, Braille lines/routing, speech,
VM/browser projection, HiDPI, and rendering-backend independence. Track focus-
to-Braille/speech, Braille/speech-input-to-action, and delta-propagation latency.
Physical hardware and disabled-user evidence remain distinct from simulation.

## Phase 5 — Authority, consent, and observation

The unified system-monitor lane is **PLANNED** and follows
[monitor/SYSTEM_MONITOR.md](monitor/SYSTEM_MONITOR.md). It depends on the
relevant lifecycle, capability, accounting, package/component, and event sources.
Progress through bounded gates: core snapshots; sequenced events and restart/
resync; generation/executable integrity; GPU/network/storage/device/DMA/power/
thermal views; platform/recovery evidence; separately authorized response;
accessible GUI and structured shell; then scoped participating-application
integrity after privacy, hostile-security, digital-rights, and patent review.
Do not combine these gates into one cross-cutting implementation patch.

After the core capability/service substrate and trusted compositor exist:

1. Add bounded capability provenance tracking and delegation audit events.
2. Add an access-controlled capability introspection/explanation API.
3. Implement trusted file-picker capability delegation.
4. Add the structured system-monitor authority and security-exception view.
5. Add common time/lifecycle-bounded capability expiration.
6. Define `SecretObject` and independent use/export rights.
7. Add non-extractable credential operations and trusted export consent.
8. Make local/remote AI sessions visible, expiring security principals.
9. Add structured diagnostic objects with observation-only capabilities.
10. Add exact-target, independently attenuated debugging rights.
11. Add disposable application/VM domains and trusted identity indicators.
12. Add bounded object provenance/history.
13. Preserve data-origin/taint labels through service and AI boundaries.
14. Integrate provenance with prompt-injection-resistant AI context/tool policy.
15. Add device ownership/delegation visualization and transition audit.
16. Add deterministic system-generation metadata.
17. Integrate crash/restart policy with persistent-state restoration.
18. Add retention-aware disclosure policy separating observation, retention,
    export, correlation, and training/secondary use.
19. Add anti-dark-pattern consent behavior and realistic prompt-frequency tests.
20. Add owner-visible AI-session disclosure and audit-privacy controls.

In parallel, implement the capability-native authority broker with narrow scope,
duration, and one-shot grants; the trusted userspace consent agent with anti-
spoof transaction binding; protected audit storage; and a non-omnipotent
security monitor with separate observation/remediation capabilities. Do not
attempt the entire list as one change.

Security gate: identity is not authority; temporary grants expire/revoke on all
specified paths; applications cannot forge consent or privileged events; the
monitor cannot exceed its explicit capabilities. Names, object IDs, and data do
not create authority; introspection leaks no secrets; `USE` never implies secret
`EXPORT`; debug stays target-scoped; AI remains non-root; disposable domains
retain no undeclared persistent authority.

Trusted consent depends on the Phase 3 compositor boundary. The authority broker
and non-UI policy core may be developed earlier, but no application-rendered UI
can count as trusted consent.

## Phase 6 — Persistent security state and boot

1. Implement a TPM NV or equivalent authenticated, monotonic, power-loss-atomic
   release-state backend.
   **PARTIALLY IMPLEMENTED:** release `BootstrapState` compare-and-store now
   requires the complete authenticated 152-byte predecessor rather than only its
   minimum-release scalar. A dedicated backend-neutral two-slot journal uses
   200-byte records containing an independent magic, exact sequence, complete
   state, and SHA3-256 digest. It writes the inactive successor before one exact
   monotonic counter advance and reloads the selected result. Deterministic
   tests cover same-floor root substitution, write and pre-commit failure,
   committed-but-uncertain advance, corruption, read failure, and exhaustion.
   Windows gnullvm passes all 5 focused journal tests and strict kernel/storage
   Clippy; Arch Linux/WSL2 passes all 452 kernel and 121 storage tests; the
   optimized native UEFI loader links. The Windows full storage run passes 118
   tests while three known large tests overflow the Windows test-process stack.
   The state now also authenticates the installed manifest digest, so repeat
   boots can recover the exact committed artifact authority without replaying a
   one-time root transition. A distinct UEFI TPM layout/transport adapter now
   admits one exact counter and two exact 200-byte full-write slots by complete
   public area and recomputed Name. It reuses the one-use exact-operation
   owner-policy session mechanism,
   read-verifies writes, checks exact counter succession, and provides an
   explicit cross-journal index-alias rejection gate. Arch Linux/WSL2 passes all
   24 UEFI library tests, including hostile exact-size/alias admission and a
   composed 200-byte publication simulation. This is not TPM provisioning,
   reboot, physical power-loss, or rollback-resistance evidence.
   The native UEFI submission wrapper is now bounded at 256 bytes rather than
   the previous 128-byte limit, so it can represent the 147-byte recovery and
   235-byte release full-slot write commands.
2. Bind measured boot to the exact coherent signed artifact set.
   **PARTIALLY IMPLEMENTED:** after independently extending the authenticated
   kernel and service payloads into PCR 11, the UEFI loader now extends one
   canonical 192-byte selected-boot-set record. It binds a fixed kernel-then-
   service order, explicit kinds, nonzero signed versions, verified SHA3-512
   digests, exact length, and zero reserved bytes. The measured-boot handoff bit
   is set only when all three extensions succeed; focused tests reject missing
   identity and verify every canonical field. The legacy record now correctly
   labels service kind 3 rather than VM kind 2. With a complete compiled
   release-journal configuration, the loader instead extends a canonical
   512-byte version-3 record binding a distinct manifest identity plus kernel,
   VM, service, CUDA, and launch-policy identities at one authenticated release.
   Configured boot requires all five bounded signed bundles, admits every kind
   through one exact `VerifiedRelease`, independently extends every payload,
   and refuses journal publication while any kind is missing or invalid.
   Temporary VM/CUDA/policy firmware pages are zeroed and freed after
   measurement. The policy payload must now be a strict canonical build receipt
   whose kernel and service identities exactly match the already authenticated
   payloads before publication. The signed receipt authenticates declared
   source, lockfile, loader, configuration, and tool identities as generation
   evidence, but boot does not independently reconstruct those inputs or prove
   which compiler/runtime binaries executed. No TPM-backed execution or
   remote-attestation evidence is claimed. The implemented `VerifiedRelease`
   foundation now also
   withholds its per-kind minimum-version roots and exposes exact-release
   artifact/executable admission instead: requested kind and signed artifact
   version must equal the authenticated manifest release before signature or PE
   interpretation can succeed. Focused tests reject substitution from both an
   older and a newer release. The UEFI loader now distinguishes an already
   installed manifest receipt from a new signed transition, admits both
   executables through the resulting `VerifiedRelease`, and publishes a new
   transition after both signatures and PE formats pass but before PCR 11
   extension, keeping the journal read/write PCR recipe coherent. Later boot
   preparation failure can retry through the installed receipt. Required mode
   rejects absent configuration; optional mode retains the legacy independent-
   root path. A distinct canonical handoff flag records which path was used;
   kernel production policy now requires coherent-release evidence alongside
   Secure Boot, measured boot, and rollback protection, while development
   policy may accept legacy admission. The admitted authenticated monotonic
   release journal now supplies rollback
   evidence directly; the standalone version counter remains an optional
   compatibility source rather than a second mandatory authority.
   A typed pending-release transaction now records all five exact admissions
   and refuses publication when any kind is missing. A deterministic composed
   test covers progressive omission, publication conflict and retry, successful
   transition, installed-manifest reconstruction, and repeat boot without a
   second counter write. Coherent-set boot admission remains partial because
   independent configuration/compiler/runtime verification and physical
   reboot/power-loss behavior are not yet integrated. Verification on
   2026-08-24 passed all
   5 artifact tests, all 5 release-journal tests, all 24 UEFI library tests,
   strict kernel/storage/UEFI
   library Clippy on Windows and Arch Linux/WSL2, strict native UEFI-target
   loader Clippy on Windows, all 456 kernel and 121 storage tests on Arch
   Linux/WSL2, and an optimized native UEFI loader build. A preceding 451-test
   Windows full run
   passed 450 tests; the known deep delegation-capacity test again overflowed
   the Windows test-process stack independently of this artifact code. As the
   next manifest-admission
   prerequisite, construction now requires the next manifest root and all five
   artifact roots to be pairwise distinct; authenticated transition also
   rejects any reuse of the current manifest-signing root in those six roles.
   Adversarial tests cover next/artifact, artifact/artifact, and current/
   artifact collisions. This enforces in-repository Lamport key separation but
   cannot prove external one-time-key backup destruction or human key custody.
3. Add rollback, stale-update, corruption, interrupted-write, and recovery tests.
   **PARTIALLY IMPLEMENTED:** deterministic kernel/storage/TPM simulations cover
   manifest replay and adjacent-release substitution, same-floor root conflict,
   corrupt and stale slots, failed inactive writes, pre-commit failure,
   committed-but-uncertain counter advance, read failure, sequence exhaustion,
   incomplete boot-artifact admission, publication conflict and retry, installed-
   manifest reconstruction, and repeat boot without republishing. These are unit
   and simulation results; provisioned-TPM reboot, torn-write, power-cut, and
   accessible owner-recovery exercises remain pending.
4. Establish reproducible builds, independently controlled release keys,
   Secure Boot integration, recovery, and key rotation.
   **PARTIALLY IMPLEMENTED:** signer outputs now use native exclusive creation,
   never overwrite an existing path, and best-effort remove a partial new file
   after a write error. A one-time private key is removed before its signature
   or bundle is published, and key generation writes the public half before the
   private half. Native runtime tests cover nonreplacement. This fail-closed
   host-filesystem ordering does not establish reproducible builds, independent
   custody, durable key erasure, atomic multi-file publication, Secure Boot
   enrollment, recovery, rotation, or physical evidence.
   A canonical build-receipt command now binds a declared compiler/Cargo
   version, target/profile, canonical source archive, dependency lockfile,
   unsigned kernel/service/loader, and selected configuration by exact length
   and SHA3-512 digest; a second command requires strict canonical parsing and
   byte equality. Tests cover deterministic path-independent encoding,
   noncanonical rejection, and changed-artifact disagreement. No independently
   controlled second build has yet been performed, so this remains comparison
   infrastructure rather than independent reproducible-build evidence.
   The UEFI target now fixes the PE timestamp at zero and omits the otherwise
   nondeterministic embedded PE debug identity. A controlled same-host build of
   exact commit `6976f8f` in two separate source and target roots, using only
   committed build configuration, produced matching canonical receipts for the
   unsigned kernel, service, and loader with an empty selected test
   configuration. This is repeat-build evidence for one exact toolchain and
   host, not independent-builder, cross-host, or complete configured-release
   reproducibility evidence.
5. Bind inspectable system-generation metadata to the exact kernel, compositor,
   services, configuration root, and compiler/runtime artifacts.
   **PARTIALLY IMPLEMENTED:** the signed policy artifact is now a canonical
   build receipt, and configured boot checks its exact kernel and service
   identities against authenticated payloads before monotonic publication. It
   also authenticates source archive, lockfile, loader, selected configuration,
   and declared compiler/Cargo identities for inspection. There is no
   compositor yet, and boot does not independently verify the recorded source,
   lockfile, loader, configuration bytes, or actual compiler/runtime binaries.
   Verification on 2026-08-24 passed all 456 kernel tests, all 6 signer tests,
   all 24 UEFI library tests, strict scoped Clippy, and an optimized native UEFI
   loader build. These are hosted code/test results, not firmware or physical
   TPM evidence.
6. Implement owner-selectable trust-root enrollment, replacement, owner-build and
   development authorization, compromised-key revocation, and accessible recovery.
   **PARTIALLY IMPLEMENTED as provisioning input only:** the release tool can
   exclusively create a canonical genesis bootstrap state from any explicitly
   supplied owner public key and nonzero minimum release. It embeds no vendor
   fallback. Structural inspection exposes only the public root digest,
   rollback floor, and optional installed-manifest digest and explicitly labels
   authentication as unverified. Safe construction rejects zero root/floor;
   focused tests cover exact key/floor binding, substitution, wrong key length,
   and zero floor. This does not authenticate owner consent, provision TPM NV,
   replace or revoke a live root, authorize development mode, or deliver
   accessible recovery. Verification on 2026-08-24 passed all 456 kernel, 121
   storage, 8 signer, and 24 UEFI library tests plus strict scoped Clippy and an
   optimized native UEFI loader build.
7. Add scoped remote-attestation capabilities with verifier/claim/lifetime
   binding and privacy-limited identities.
8. Verify authenticated update and recovery cannot silently replace owner trust
   policy while preserving rollback resistance.

Security gate: older signed vulnerable releases cannot be admitted after a
committed advance; loss/corruption fails safely and has a documented recovery
path. No rollback-resistance claim precedes physical testing.
Generation identity is not called deterministic until both artifacts and
configuration are reproducible.

## Phase 7 — Bare-metal hardware isolation

1. Run VMX-root entry, non-root launch, EPT ownership, exits, and teardown on a
   supported physical machine.
2. Activate VT-d/IOMMU from validated firmware topology and test every remapping
   unit relevant to assigned devices.
3. Test DMA grant/revoke, invalidation completion, device reset, quarantine,
   fault handling, and ownership transitions using real hardware.
4. Integrate internal monitor receipt/workload-key custody with live domains.

Security gate: monitor authority fails closed and retains its keys; CPU and DMA
translations agree before grant/resume; uncertain invalidation/reset never
returns a device or granule to use. Nested KVM and QEMU do not satisfy this gate.

## Phase 8 — Hardening and expansion

Continuously fuzz parsers, IPC, shared-memory metadata, capability abuse, and
corruption paths. Stress SMP races, mapping/revocation races, interrupts,
crashes, exhaustion, network adversaries, and power loss. Perform unsafe/FFI
review, application dependency/admission tests, browser fingerprint regressions,
semantic-graph desynchronization and spoofing tests, side-channel analysis,
formal specification of critical capability and noninterference properties,
reproducible release review, and external audit. Investigate CET/IBT only as
defense in depth for relevant trusted native boundaries; do not claim or depend
on enforcement until implemented and exercised. Only then consider broad
drivers, production claims, AArch64, and RISC-V64.

Before architectural maturity, perform independent hostile-security and digital-
rights reviews, accessibility user testing, and adversarial AI testing. Include
acceptance scenarios for prompt-injected credential export, compromised-service
non-amplification and anti-persistence, malicious publisher requests to disable
accessibility/inspection, overbroad remote attestation, equivalent first-party
and third-party authorization, and deliberately authorized owner-built boot.
Expected results are denial outside delegated authority, complete cleanup,
continued peer operation, ordinary redaction without publisher veto, scoped
privacy-preserving claims only under owner policy, no first-party bypass, and no
hidden vendor veto. Agent adversaries supplement rather than replace external
human audit.

Guest-device fuzzing prioritizes VirtIO descriptors and indirect/cyclic chains,
virtual-network packets, audio control, USB descriptors, PCI configuration,
VGPU/CUDA commands, block requests, interrupt delivery, and lifecycle/reset
transitions using malformed, truncated, oversized, repeated, and stale inputs.
Differential tests run the same guest workload against QEMU and MRML and explain
every guest-visible difference; matching QEMU is not itself a security proof.

Every milestone requires proportional Windows gnullvm and Linux testing,
backend-specific signed probes where applicable, exact commands/results, and
before/after performance measurements. Unsupported environments must be listed,
not implied.
Drivers that can independently reconstruct the firmware-stable route now have
a conservative **PARTIALLY IMPLEMENTED** default verifier. It requires exact
stable-ID, controller-generation, and media-generation equality; boot identities
already attributed to AHCI/USB/VirtIO must also retain that transport, while a
UEFI source may transition to any supported native transport. This follows the
cross-cutting rule that control planes establish authority while data planes
take the shortest safe path: correlation occurs once during registration, and
later reads use the existing capability-bound block session. Focused tests
reject route/generation and transport substitution. Storage passes 127 tests on
Windows and Arch Linux. Deriving those inputs from actual native enumeration is
still **PLANNED** and is not implied by this verifier.

The boot/native identity algorithm is now shared rather than UEFI-local.
`canonical_uefi_block_stable_id` now structurally walks a bounded canonical
single-instance device path, rejects malformed nodes, missing/extra end nodes,
and multiple instances, then applies the one existing domain-separated digest
used by firmware discovery. UEFI consumes that storage-interface function. A future native
driver can therefore reconstruct the same route without inventing a second
identity scheme. Storage passes 128 tests and UEFI 37 tests on Windows and Arch
Linux, with UEFI cross-builds on both. Native path reconstruction, protocol
enumeration, driver attachment, OVMF, and physical evidence remain **PLANNED**.

The first typed firmware/native route bridge is now **PARTIALLY IMPLEMENTED**
for the strict SATA shape. A bounded parser accepts only ACPI root, one through
eight valid PCI hops, one SATA target, an optional internally consistent
hard-drive media node, and canonical end-entire. It retains the full stable-ID
digest while exposing exact typed fields for equality against independently
enumerated native state. Native comparison does not recreate UEFI binary path
bytes and grants no authority. Storage passes 129 tests on Windows and Arch
Linux; UEFI remains 37 tests and cross-builds on both. Canonical handoff carriage
is described below; a reviewed native enumerator remains the next gate.

The handoff prerequisite is now **PARTIALLY IMPLEMENTED** as a kernel-owned
canonical 128-byte SATA route record. It binds the record version, ACPI root,
one through eight PCI hops, SATA target, optional partition identity, and exact
stable ID; decoding rejects nonzero reserved or unused bytes and malformed
field combinations. UEFI translates its retained route only when that stable ID
still equals the recovered descriptor identity. This record contains no handle
or authority. Kernel passes 563 tests and UEFI 37 tests on Windows and Arch
Linux, with UEFI cross-builds on both. Handoff integration is described below;
consuming independently enumerated native state remains **PLANNED**.

The typed SATA route now crosses the real loader/kernel boundary as
**PARTIALLY IMPLEMENTED** canonical handoff data. A distinct presence flag and
fixed 128-byte record place it after the installed identity and before SMP/MADT
bytes. Encoding and decoding require the adjacent source to be UEFI and the
full stable ID to match; route-without-identity, identity substitution, malformed
length, and reserved-state changes fail closed. The loader retains both records
before `ExitBootServices` and emits them together. Kernel passes 563 tests and
UEFI 37 tests on Windows and Arch Linux, UEFI cross-builds on both, and the
WHP/KVM runners pass 11/12. Native enumeration and exact correlation remain the
next gate; no hardware execution is claimed.

The transport-neutral native-correlation boundary is now **PARTIALLY
IMPLEMENTED** for that handed SATA route. `NativeSataBlockRoute` accepts one
bounded independently supplied ACPI/PCI/SATA/optional-partition topology but no
stable ID, handle, registration, or authority. The trusted
`SataNativeBlockCorrelationVerifier` exact-matches every route/media field, the
adjacent boot stable ID, AHCI transport class, controller generation, media
generation, and geometry before the existing atomic registration path may run.
Storage passes 130 tests on Windows and Arch Linux. A real native driver that
derives this descriptor from controller state, plus subsequent installed
reacquisition and hardware evidence, remain **PLANNED**.

Configuration now **PARTIALLY IMPLEMENTS** the next atomic composition.
`correlate_and_reacquire_handoff_installed_sata_device` performs typed-route
verification, non-authorizing registration, read-session reacquisition,
block-zero validation, and installed selection through one bounded call. Route
failure publishes neither device nor session and performs zero block reads; a
later header/root failure revokes the session and removes the newly registered
device before returning. Configuration passes 50 tests on Windows and Arch
Linux; WHP/KVM regression runners pass 11/12 without claiming SATA execution.
Supplying the native descriptor from a real driver and connecting this owner to
installed kernel Total admission remain **PLANNED**.

Installed orchestration now **PARTIALLY IMPLEMENTS** a decoded-handoff-only
entry point. A recovery-only canonical encoder carries the same adjacent
identity/route pair without fabricating service or SMP state, and configuration
extracts both exclusively from one validated `BootHandoff` before correlation.
Missing identity or route fails before registration, session issuance, or block
I/O; callers cannot supply detached replacement boot data. Kernel passes 563
tests and configuration 51 tests on Windows and Arch Linux. Real native
descriptor discovery and binding the returned owner into installed Total boot
remain **PLANNED**.

The recovered-system admission boundary now **PARTIALLY IMPLEMENTS** that owner
join. `build_installed_total_boot_admission` revalidates the live selected
device's stable identity, controller/media generations, geometry, volume, and
root against the same decoded handoff before constructing the authenticated
release inventory and its only Total admission table. A UEFI-installed source
also requires the adjacent typed SATA route. Missing or substituted installed
state fails before the release builder runs, and successful strict admission
retains the exact selection in `RecoveredInstalledTotalAdmission` through final
runtime proof. Configuration passes 51 tests on Windows and Arch Linux;
WHP/KVM regression runners pass 11/12 without claiming native SATA execution.
Real native descriptor discovery and installed kernel wiring remain **PLANNED**.

The installed Total owner now has a **PARTIALLY IMPLEMENTED** consuming runtime
transition. `authorize_runtime` succeeds only after the authenticated release
inventory finalizes against the owner-held admission table, then seals the
installed selection, recovered policy, release inventory, admission state, and
runtime proof into one read-only `RecoveredInstalledTotalRuntime`. An incomplete
required domain returns `RequiredDomainMissing` and produces no runtime owner.
WHP and KVM component launch paths now retain this sealed owner for the guest
execution lifetime instead of separating a proof from mutable admission state.
Configuration passes 51 tests on Windows and Arch Linux; WHP/KVM runner suites
pass 12/13 and their backend suites pass 24/21 with one manual test ignored in
each. Their SMP handoffs retain the exact installed source identity, recovered
policy, and one-boot Total override, and their control planes reserve the
64-page SMP page-table arena without duplicating already established RW/NX
mappings. Fresh one-use-signed distinct ZIM/Zstd artifacts completed the sealed
two-vCPU component path on WHP and nested KVM with `eligible=1`, `microvm=1`,
and `native_fallback=0`. This is hosted controlled evidence; production
installed configuration/release wiring and native/physical evidence remain
**PLANNED**. The first kernel-entry portion is now **PARTIALLY IMPLEMENTED**:
all profiles construct `EarlyKernelContext` only from the decoded canonical
handoff before profile work. It retains the recovery epoch/root, installed
identity, optional typed SATA route, and non-authorizing one-boot override
without reconstructing them from scalar input. A UEFI installed identity
without its required adjacent route fails at this first entry boundary. The
Windows kernel suite passes 565 tests, and the standard UEFI image cross-builds
on Windows; earlier Arch and component-profile evidence is not extended by this
increment. This retained data remains non-authorizing and does not establish
effective placement or replace the later recovery and admission control planes.
The configuration control plane now consumes this exact first-entry owner in
one focused installed Total path. It joins the live installed selection,
committed recovery, capability-revalidated policy, authenticated release
inventory, microVM route commit, and immutable runtime authorization without a
replacement `BootHandoff`. Configuration passes 51 tests and the WHP runner
cross-builds on Windows. Real early-boot invocation and complete activated-
release domain enumeration remain **PLANNED**.

Live delivery is now **PARTIALLY IMPLEMENTED** through a canonical fixed
280-byte boot-recovery envelope. The existing one-use exact-task capability
syscall transfers recovery state, optional installed identity, required UEFI
route, and one-boot Total request atomically; hostile flags, padding, presence,
source, stable-ID, volume, root, task, capability, replay, and user-copy cases
fail closed. The service image decodes that record and continues its existing
recovery from the contained recovery state. The receiver-to-sender service IPC
now carries and redecodes the entire envelope rather than a detached 40-byte
subset. Windows passes 566 kernel and 51
configuration tests; service image, component UEFI profile, and WHP runner
cross-build. KVM and full service-side installed Total construction are not yet
claimed.

The configuration service now has a production-shaped delivered-envelope entry
to the existing installed Total transaction. Controlled stable recovery proves
that the delivered record alone grants nothing: live installed selection,
capability-authorized settings, committed recovery, authenticated release
inventory, microVM route commitment, and strict finalization all remain required.
The committed recovered-system owner now consumes and retains the exact one-use
envelope, rejects stale recovery before consulting settings or release state,
and supplies that retained record to installed Total admission. The focused
test no longer reconstructs a replacement envelope after delivery. Windows
passes 566 kernel tests, 51 configuration tests, and 12 WHP runner tests; the
service image builds. Real service invocation, full activated-release enumeration, and KVM
parity for this increment remain **PLANNED**.

Distinct signed service-image construction is now **PARTIALLY IMPLEMENTED** at
the native VMM boundary. Nested KVM constructs two guests from independently
verified `ServiceImage` artifacts, retains each exact artifact digest, and
rejects cross-reprovisioning. WHP carries the same checked path, but this host's
backend reports the second simultaneous partition as the typed
`PartitionAlreadyExists` limitation. Recovered two-domain admission, attachment
of the generation-bound peer queue to these guests, and guest-executed
consumer/provider traffic remain **PLANNED**.

The cross-microVM queue notification prerequisite is now **PARTIALLY
IMPLEMENTED**. Request and response publication return distinct typed
notifications bound to the exact interface/provider/system/policy/binding
identity, operation, and monotonic sequence. Neither endpoint consumes payload
without its matching notification; cross-binding, stale, and wrong-operation
notifications fail closed. Windows and Linux kernel suites pass 576 tests, WHP
passes 27 with one manual test ignored, and nested KVM passes 23 with one manual
test ignored. The queue now also performs release-before-state and
acquire-after-state fences for request, response, and idle handback. Native
interrupt/event delivery, a race-tested atomic shared-state representation,
recovered two-domain runner ownership, and guest-executed signed ZIM/Zstd calls
remain **PLANNED**.

The backend-neutral interface notification route is now **PARTIALLY
IMPLEMENTED** on the existing capability-authorized VM interrupt boundary.
Separate request/response latches exact-bind queue identity, next sequence, VM,
vCPU, vector, and interrupt object; confirmed injection alone clears a token,
while denial retains it and uncertain backend delivery both retains it and
fails the VM. Adversarial kernel tests cover replay, cross-binding, duplicate
pending publication, wrong object, denied vector, and uncertain injection.
Windows passes 578 kernel tests. Live two-guest WHP/KVM delivery and guest
execution were still pending at that checkpoint.

The retained peer owner now **PARTIALLY IMPLEMENTS** live directional delivery.
After exact queue publication, it injects the request token only into the
provider guest and the response token only into the consumer guest through the
existing capability-authorized VM interrupt route. Nested KVM exercises both
directions across two live guests; WHP carries the same source and API path.
Kernel passes 578 tests on Windows and Arch Linux, WHP passes 27 tests with one
manual performance test ignored, and nested KVM passes 23 tests with one manual
performance test ignored. Guest interrupt handlers, recovered two-domain runner
ownership, and guest-executed signed ZIM/Zstd calls remain **PLANNED**.

The configuration authorization dependency gate now **IMPLEMENTS** exact-rights
parity between hosted execution and the service-image syscall path. Recovery,
checkpoint, restart-policy, and isolation-policy tests use separate read,
write, and control capabilities, and explicitly reject a combined-right handle
at an exact-read boundary. Installed service execution and hosted VMM execution
are not claimed by this increment.

Deployment control and inspection now **IMPLEMENT** the same exact-rights gate:
staging and activation require only `CONTROL`, while active-generation and
runtime-assignment reads require only `READ`. A combined authority is rejected
before state or storage access. Hosted VMM and installed-media execution remain
outside this evidence.

Two-phase deployment activation now revalidates exact live control at commit,
including before stable storage receipt consumption or recovery-state update.
A revoked prepare-time handle cannot authorize later publication; a fresh exact
control handle is required.

Stable configuration checkpoint publication now revalidates the exact live
root `READ` capability at commit before consuming its one-use storage receipt.
Prepared bytes and file state no longer preserve revoked inspection authority.

Recovered service registration now revalidates its exact restart-policy read
authority and recomputes the registration plan at commit. A prepared recovery
result cannot preserve a revoked or changed policy decision into the live
supervisor.

Prepared service restart now revalidates exact live `CONTROL` at commit for
both external management spaces and task-local syscall requesters. Revocation
between prepare and commit creates no replacement task and leaves the service
stopped for an explicitly reauthorized retry.

Recovered service publication now also revalidates the planned generational
task identity against the live runtime at commit. Retirement between recovery
validation and publication leaves the supervisor slot vacant; recovery must
replan against a newly created live task generation.

Direct persisted restart-policy registration now uses that same live-runtime
commit boundary. Valid policy authority and revisions cannot publish a retired
caller-supplied task generation as a running service.

Recovered deployment runtime assignment now revalidates its retained exact
inspection handle when sealing the authenticated assigned release. Revocation
after release recovery cannot produce a detached sealed inventory for Total
admission, and the intermediate owner no longer exposes the raw plan.

All deployment runtime-assignment entry points now return the same linear
prepared owner. Sealing requires the retained exact `READ` capability and the
same still-active release identity, so revocation and intervening activation
both fail before producing an admission-ready inventory.

Prepared configured-isolation routes now retain the policy application inputs
and revalidate them before backend construction. Revision drift, exact-read
revocation, or specification substitution cancels the kernel reservation and
starts neither placement backend.

Complete Total-service preparation no longer supports bulk extraction of its
kernel routes. Consuming cleanup cancels all retained reservations in reverse
order; the remaining single-route transformation path must restore exact
expected membership before complete endpoint construction or commit succeeds.

That restoration gate now binds the full prepared service specification rather
than domain membership alone. Same-domain substitution of interface, provider,
generation, class, policy, or placement is rejected before complete commit.

The shared prepared-file-write primitive now retains its exact handle,
principal, and requested write/resize rights and offers commit-time authority
revalidation before receipt consumption. Revocation leaves both the prepared
successor and receipt unconsumed; service-specific migrations follow this gate.

Stable configuration is the first service-specific migration to that primitive.
Checkpoint commit now requires both the retained exact configuration `READ`
capability and the retained exact storage write/resize authority; revocation of
the storage handle after staging leaves the publication receipt unconsumed.

Deployment stable activation is also migrated. Ordinary and authenticated
publication now require the retained exact storage authority in addition to
live deployment control and unchanged activation state; storage revocation
leaves the receipt, recovery state, and deployment service unchanged.

Durable storage-authority checkpoint publication now uses the same authorized
commit, completing the planned stable configuration, deployment, and authority
checkpoint migrations. A revoked staged-file handle cannot publish a durable
grant generation or consume its transaction receipt.

The old receipt-only prepared-file commit is removed. All service publication
and storage-internal composition paths are forced through commit-time
storage-authority revalidation.

Prepared component-service launch ownership now advances through an explicit
verified-artifact state. The unverified owner cannot release its raw isolation
route; KVM/WHP integration and the common launch helper must consume exact
service-image kinds and digests before route restoration or commit.

Stable configuration commit now returns its complete prepared owner with any
commit-time configuration or storage denial. Failed reauthorization neither
consumes the receipt nor silently discards the staged successor; retry, cleanup,
or abandonment remains an explicit caller decision.

Durable storage-authority checkpoint commit now follows the same linear error
contract. Its exact checkpoint owner is returned with authorization or receipt
failure, leaving both staged state and receipt disposition explicit.

Deployment activation sequence exhaustion is now a preparation/preview gate.
Terminal arithmetic fails before candidate-state mutation and before either
stable publication path can consume its storage receipt.

Authenticated deployment recovery-state replacement is now fully encoded before
stable-file receipt consumption. Recovery-epoch exhaustion and invalid successor
bindings fail without publishing the prepared file or changing live activation.

Deployment activation validation is now one private typed transition shared by
direct and both stable commits. All fallible capability, candidate, release, and
arithmetic checks precede storage mutation; final in-memory publication is an
infallible consumption of that validated state.

Ordinary stable deployment commit now returns its complete prepared activation
with every pre-publication failure. Storage revocation leaves the receipt and
live deployment state unchanged while preserving the exact successor for an
explicit caller decision.

Authenticated stable deployment failure now distinguishes `Prepared` from
`CheckpointPublished`. Pre-receipt errors retain the complete prepared owner;
post-receipt recovery-store uncertainty retains the exact durable file and
pending activation identities while leaving the live service inactive.

Published authenticated activation uncertainty now has an exact resolution
path. Only authenticated state matching the retained successor epoch, file,
activation, and checkpoint digest can complete live activation; mismatch keeps
the published owner intact for later recovery.

Non-validating storage-authority recovery now retains a non-authorizing pending
owner on rollback-store uncertainty. Reconstructed handles remain private until
a fresh authenticated load exactly equals the intended replacement; mismatch
keeps them unavailable rather than forcing a lossy reboot-only outcome.

Validated authority recovery now also retains its temporary authority and
non-authorizing validation output across rollback-store uncertainty. Exact
authenticated replacement equality is required before either becomes available;
the Linux-host storage suite passes all 142 focused tests.

Configuration recovery now covers the committed-but-uncertain integration path:
after consuming the one-use boot-bound adapter, the retained authority and
prepared service resolve only through exact equality in the underlying
authenticated store. All 53 Linux-host configuration tests and the release
`MRML_NATIVE` service-image build pass.
