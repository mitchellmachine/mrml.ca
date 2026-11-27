# MRML paravirtual-device architecture

**Status: PLANNED**, except where this document explicitly points to existing
MRML-native virtual-block mechanisms. This is architecture, not a claim that
VirtIO compatibility, host sharing, or accessibility devices are implemented.

> Virtualization preserves capability boundaries; it does not manufacture host
> authority.

This document defines one backend-neutral device architecture for KVM and WHP.
QEMU is a differential interoperability oracle where compatibility is intended;
it is not MRML's authority or security specification.

## Common device core

Guest RAM and shared transport pages derive from bounded host memory objects and
pools defined in [memory/MEMORY_RESOURCE_MODEL.md](memory/MEMORY_RESOURCE_MODEL.md).
Guest physical addresses and queue mappings never create host allocation authority.

```text
guest driver
  -> transport
  -> canonical queues and descriptors
  -> MRML virtual-device core
  -> capability-selected backend object
```

Device identity, transport, queue state, backend authority, interrupt authority,
and memory-mapping authority are distinct. A device or transport identifier is
data. Trusted host policy supplies exact capabilities for backend objects,
interrupts, and mappings; guest counters, addresses, paths, sector numbers,
feature bits, and descriptors never select host authority.

Device semantics remain transport-independent. MRML-specific scalar I/O remains
valid for development and security testing. PCI/MMIO and a VirtIO-compatible
transport may carry the same state machine where useful; compatibility does not
rewrite common authority or lifecycle rules.

Every queue is bounded and generational. The device owns its consumer position;
producer/consumer positions are monotonic; descriptors have exact ownership,
direction, bounded lengths, checked GPA arithmetic, and unique request IDs where
applicable. Guest mappings are non-executable unless a separate design requires
and authorizes execution. A completion follows an admitted request and binds its
generation and request identity. Stale descriptors fail, reset invalidates
in-flight descendants, and guest-controlled counters cannot create authority.
Uncertain backend mutation or completion publication poisons the device instead
of inviting blind replay.

## Lifecycle, hotplug, and restart

The common lifecycle is:

```text
Created -> Configured -> Active -> Suspended -> Resetting
                                      |             |
                                      +-> Failed <--+
Created/Configured/Active/Suspended/Failed -> Removed
```

Transitions are explicit and generational. Reset, removal, replacement, and
hotplug invalidate old queues, tickets, mappings, interrupts, transport windows,
and driver-resume records before backing reuse. Removal stops admission, applies
device-specific in-flight rules, revokes mappings and interrupts, quiesces or
fails the device, erases transient state, and makes old handles stale. A newly
attached device receives a fresh generation and capability set. Enumeration
reveals only intentionally attached devices and minimizes host model, serial,
username, path, and inventory metadata.

An orderly restart image is bounded canonical data, never authority. It contains
no bearer capability, host path, file descriptor, Windows handle, or opaque host
token. Restoration first retires old execution irreversibly, then re-establishes
authority from current capabilities. Each device specifies resumable and non-
resumable state, in-flight and replay semantics, the retirement point, and
whether backend state is retained or recreated. Never replay uncertain mutation.
Orderly replacement remains distinct from asynchronous crash recovery.

The existing MRML-native block work supplies the first reusable mechanisms:
generational identity, queue ownership, protected completions, device-owned
consumer positions, exact acknowledgement, suspension before capture, canonical
resume/restart images, old-VM destruction before replacement, poison on
uncertainty, bounded exit budgets, and common KVM/WHP runners. Generalization
must preserve those tested invariants rather than duplicate them.

The signed MRML-native PCI-MMIO probe now exercises the same consuming orderly
replacement boundary after its five operations are fully retired. The old VM is
destroyed before replacement preparation; the retained device, bridge, routed
attachment, BAR state, and volatile backend remain suspended; restoration
accepts only the exact canonical idle queue/resume image and transport identity.
This is hosted controlled replacement evidence, not hot-unplug, asynchronous
crash capture, backend-in-flight recovery, or durable-device evidence.

After replacement proof, both hosted runners now destroy the final native VM or
partition before invoking the common revoke-before-reset boundary. The
controlled revoker exact-matches attachment/function generation, BAR window,
queue, block generation, backend range, and vector; preflights exact backend and
interrupt capabilities; revokes both; resets the block device/attachment; and
only then permits PCI generation advance with BAR/decode clear. This proves
destroyed-execution cleanup. Controlled sole-vCPU guests now return from launch
with a bounded page-table path but no BAR leaf. The backend-aware configuration
mapper installs and verifies the exact non-global leaf and reloads/read-backs
the prepared non-PCID CR3 before decode publishes. Disable invokes the matching
coherent withdrawal before decode and attachment mapping state clear. Any
uncertain step keeps the quarantine permanent. The signed artifact exercises
install, traffic, replacement reconstruction, withdrawal, and an exact bounded
post-withdrawal proof on KVM and WHP. This is not SMP shootdown, asynchronous
unmapping, TLB-coherent hotplug, or production hotplug.

## Capability projection into application microVMs

MicroVM selection follows [ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md);
selecting placement does not itself delegate any device.

The kernel's **PARTIALLY IMPLEMENTED** generic pre-construction projection plan
now requires the exact declared set of capability-authorized, generational
interface/device projections before a microVM backend may begin allocation.
Missing or stale projections return typed isolation-unavailability reasons and
the unpublished RAM/vCPU reservations; no native fallback is selected. This is
common admission groundwork, not a VirtIO transport, device-specific queue,
live WHP/KVM attachment, hotplug, reset, DMA, or physical-device claim.

A microVM receives devices derived from exactly the application's capabilities:

```text
FileObject A READ       -> read-only file/share device A
DirectoryObject B CREATE -> bounded writable share B
NetworkConnection C     -> virtual network device C
BrailleOutput D          -> accessibility output device D
```

Projection cannot widen these into a host disk, ambient host filesystem, raw
networking, global input, backend handle, interrupt authority, or mapping
authority.

The planned MRML-specific VirtIO optical family and its common MMC/AHCI/USB
layer are defined in
[storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md). It exposes
bounded semantic operations rather than arbitrary host SCSI; no implementation
or physical-drive claim is made here.

## Virtual accessibility family

First-party VMM-emulated accessibility devices are intentional development and
CI infrastructure. They do not replace physical-device or disabled-user testing.
A canonical virtual accessibility bus may expose refreshable Braille output,
Braille keyboard/chords, routing and navigation keys, switch access, alternative
keyboard/HID, pointer/dwell input, speech output, deterministic speech input,
haptic alerts, and semantic-event/caption sinks.

Braille output, Braille input, semantic navigation, ordinary keyboard input,
pointer input, microphone capture, speech input, speech output, haptic output,
and secure attention remain separate capabilities. Accessibility input is not a
universal HID endpoint and never implies secure-attention authority.

### Virtual Braille device

The transport-neutral emulator supports at least 14, 20, 32, 40, 64, and 80
cells; 40 cells remains a usability baseline, not a protocol restriction. Its
canonical description binds protocol version, device generation, cell and status-
cell counts, 6-dot/8-dot support, routing/navigation support, input-key bitmap or
chord format, and negotiated feature bits.

Guest operations include capability query, complete-line update, bounded range
update, cursor/routing-focus update, and status-cell update. Events include
routing press, Braille chord, navigation, attach, detach, reset, and failure.
Malformed counts, indexes, feature combinations, dot patterns, or oversized
updates fail before mutation.

The host emulator provides both a visual developer view and deterministic text:

```text
BrailleDevice {
  generation: 12,
  cells: 40,
  cursor: 17,
  line: [exact dot patterns],
  pressed_keys: [],
  last_routing_cell: 17
}
```

Screenshots are never required for CI, Codex, or text-only inspection. A test-
only host controller deterministically injects routing keys, Braille chords,
device attach/detach/reset, switch presses, and speech input. It is neither guest
authority nor a production application API.

Evidence labels remain distinct: `SIMULATED`, `VMM-TESTED`, `PROTOCOL-TESTED`,
`PHYSICAL-DEVICE-TESTED`, and `USER-TESTED`. Emulation never establishes
physical compatibility, and disabled-user testing remains required before ABI
stabilization.

## Block device

Common block semantics retain the existing MRML-native transport and may add a
VirtIO-blk-compatible transport:

```text
common READ / WRITE / FLUSH semantics
  +-> MRML-native block transport
  +-> VirtIO-blk-compatible transport (planned)
```

Do not call the current device VirtIO-blk. Feature negotiation is canonical and
advertises only implemented operations. `DISCARD`, `WRITE_ZEROES`, `GET_ID`, and
secure erase remain absent until separately required and specified.

Trusted policy grants an exact block capability, never a raw host path or disk
handle:

```text
BlockCapability {
  object: exact volume, snapshot, image, or storage object,
  rights: READ / WRITE / FLUSH,
  range: optional bounded region
}
```

**IMPLEMENTED for exact object and operation rights:** the common MRML-native
block runners now require a live generational capability for one trusted-policy-
selected backend object and reauthorize `READ`, `WRITE`, or `FLUSH` before each
corresponding backend operation. Wrong-object, attenuated, stale, and revoked
authority reaches no backend. KVM and WHP use the same wrapper. A checked policy
descriptor now binds a nonempty backend start/count to the capability: guest
block zero translates to that start, cross-boundary or malformed transfers reach
no backend, and the exposed count must equal advertised device geometry before
vCPU entry. Nonzero translation and denial are simulation-tested; hosted probes
currently exercise an exact full-backend region. A production backend and the
complete `BLOCK` acceptance scenario remain pending.

**IMPLEMENTED for host-side PCI/block lifecycle composition:** one exact routed
PCI function generation can be bound to one active MRML-native block generation,
queue layout, interrupt vector, and capability-selected backend region. The
common adapter tracks confirmed BAR mapping separately from BAR assignment and
requires exact resource cleanup before block reset/removal and PCI reset/detach.
Stale generations, class or geometry substitution, poisoned queue state, mapping
failure, and cleanup failure preserve state or fail closed. The MRML-native
transport also has two fixed write-only PCI-MMIO notification registers in one
exact generational BAR window. A signed test-only guest discovers the attached
identity, assigns and enables the BAR through Configuration Mechanism #1, then
uses the canonical guest driver to publish two writes, retire their protected
completions, reuse both slots for reads, retire those completions, publish one
explicitly negotiated flush, retire its zero-length completion, and verify both
complete payload pages. KVM and WHP run the same common transaction path
and block re-entry until each exact accepted write is retired. This is hosted
controlled evidence for PCI configuration, trapped MMIO routing, five bounded
block operations, capability-selected volatile backend access, existing
capability-authorized legacy interrupt injection, and protected MMIO
acknowledgement. It is not production block I/O or evidence for durability,
native PCI interrupt routing, MSI/MSI-X, DMA, VirtIO, QEMU comparison,
production PCI identity, physical devices, or host-resistant isolation.

**PARTIALLY IMPLEMENTED for reset-with-pending acceptance:** host-side
simulation and controlled signed KVM/WHP execution hold one published,
unacknowledged completion plus one in-flight request across the reset boundary.
Reset clears the old notification and
invalidates the request, attachment, mapping identity, and device generation.
Only a fresh bridge and attachment bind the successor generations; replay of
the old BAR acknowledgement, ticket, or request reaches no successor state,
while a fresh successor request is accepted. Resumable native unmapping/hotplug,
durable backend recovery, QEMU differential testing,
and physical-device evidence remain pending. The hosted evidence destroys the
native execution container before exact capability revocation and reset; it
does not exercise live unmapping or retain an old runnable guest.

Legacy completion delivery also re-reads the exact live routed function state.
Conventional PCI interrupt-disable masks injection without clearing the pending
device notification; delivery resumes only after that same attachment
generation is unmasked. The signed KVM/WHP guest exercises this sequence. PCI
command state remains data, while the separate `SIGNAL` capability authorizes
delivery.

Sector, offset, and length are checked request data. They cannot select another
object. Bounded-region capabilities may expose a whole disk, partition, image,
snapshot, ephemeral volume, or capability-native object.

Restart state distinguishes never admitted, admitted-not-issued, issued-known-
complete, completion-published-not-acknowledged, and backend-mutation-uncertain.
Those states cannot collapse. Uncertain writes poison or enter an explicit later
recovery protocol; they are never replayed.

After a compatibility transport exists, run the same advertised workload against
QEMU VirtIO-blk, MRML/KVM, and MRML/WHP. Compare read, write, flush, negotiation,
reset, stale completion, and error semantics. Differences are fixed or documented;
matching QEMU is interoperability evidence, not a security proof.

## Capability-native host sharing

The native model is an exact delegated object subtree, not ambient host paths:

```text
GuestFileShareCapability
  -> exact directory subtree or file object
  -> attenuated operations
  -> common virtual-filesystem core
     +-> MRML-native share protocol
     +-> VirtIO-fs-compatible transport (optional, planned)
```

Rights are independently attenuable where meaningful: `LOOKUP`, `READ`,
`CREATE`, `WRITE`, `RESIZE`, `RENAME`, `REMOVE`, `ENUMERATE`, `METADATA_READ`,
and `METADATA_WRITE`. Shares may be read-only or expose one exact file.

Guest names are relative data inside the delegated share. Reject `..`, absolute
paths, alternate syntax, device names, case ambiguity, and escape through
symlinks, reparse points, junctions, bind mounts, aliases, or mount traversal.
Authorization resolves from a capability/object root, never string concatenation
or prefix checks. Indirection is denied by default; an explicit policy may allow
it only when the final opened object is proven inside the capability domain.

Open files/directories use generational handles bound to exact objects. Rename
preserves open-object identity; deletion or replacement cannot retarget a stale
handle. Prefer handle-relative operations and authorization of the exact opened
identity instead of check-then-reopen pathname flows. Document unavoidable host
platform weaknesses.

Linux, Windows, MRML-native, and deterministic in-memory adapters are narrow
unsafe/platform boundaries. The common protocol depends on neither Unix inode
nor Windows HANDLE semantics. Restart reconstructs a virtual handle only if the
current share capability still authorizes the same backend identity. Raw OS
handles are never serialized. Revocation or share replacement makes old handles
fail.

Before real host adapters, a cross-platform deterministic backend supplies stable
IDs, generations, directories/files, rename, deletion, concurrent handles,
revocation, injected I/O failure, restart reconstruction, and exhaustion.

VirtIO-fs, if adopted, is a compatibility transport over this policy. Unsupported
semantics are rejected or documented rather than widening authority. DAX/direct
host mappings remain excluded until exact identity, mapping rights, writeback,
invalidation, reset cleanup, backend lifetime, stale prevention, and complete
revocation are established. Any later mapping is derived, bounded, non-executable
by default, and revoked before reuse.

A future differential workload covers create/open/read/write/rename/unlink,
enumeration, read-only denial, traversal denial, stale handles, reset, and host-
side removal against QEMU/virtiofsd where available, MRML/KVM, and MRML/WHP.
Compatibility success does not prove host containment.

## Testing and fuzzing

VirtualGPU uses these lifecycle/queue rules while projecting the native GPU
objects defined in [gpu/VIRTUAL_GPU.md](gpu/VIRTUAL_GPU.md). VirtIO-GPU may be a
display compatibility transport; it is not MRML's native GPU authority model.

Evidence is recorded by layer: `UNIT` for common queue/lifecycle state;
`SIMULATION` for deterministic backends; `VMM` for real KVM/WHP guests;
`QEMU-DIFFERENTIAL` for advertised compatibility; `PHYSICAL` for real hardware
or backends; and `USER` for accessibility usability. Evidence from one layer or
backend is never silently promoted to another.

Accessibility fuzzing covers cell counts, routing indexes, oversized and HID-like
reports, stale generations, and event floods. Block fuzzing covers descriptor
chains, zero/overflow lengths, overlap, stale IDs, reset races, completion replay,
and uncertain writes. Host-share fuzzing covers malformed/maximal/Unicode names,
case collisions, indirection escape, stale handles, rename/remove races,
oversized results, malformed messages, failure injection, and exhaustion.

KVM and WHP share all security semantics. Backend adapters may map memory,
execute exits, inject interrupts, and manage native VM lifecycle, but cannot own
separate policy. Any semantic difference fails parity tests or is explicitly
documented.

## Acceptance scenarios

`BRAILLE`: boot with 20 cells, render an exact trusted semantic prompt, inject a
routing event, verify the semantic action, detach, reject stale-generation input,
attach a fresh 40-cell generation, and resynchronize.

`BLOCK`: attach a range- and rights-limited object, write/read/flush, reset with
pending requests, prove stale completion cannot affect the new generation, then
run the supported workload against QEMU VirtIO-blk once compatibility exists.

`HOSTFS`: delegate one exact directory read-only; allow an authorized read;
reject `..`, absolute, symlink/reparse escape, and write before unauthorized host
access; preserve exact open identity across rename; revoke and reject all old
handles.

`VM REPLACEMENT`: suspend at a defined checkpoint, destroy the old native VM,
create the replacement, restore only canonical state, re-establish current
capabilities, and continue without replaying uncertain mutation.

## Dependency order

Phase 2 proceeds: common lifecycle/transport; complete MRML block transport; PCI
attachment; VirtIO-blk compatibility and differential tests; canonical share
objects/protocol; deterministic hostfs; VMM hostfs; optional VirtIO-fs; virtual
accessibility bus; Braille display/input; switch/alternative input; deterministic
speech/audio endpoints; networking; broader input/graphics/audio; then physical
USB accessibility adapters. If Phase 3 semantics are unavailable, Phase 2 builds
only virtual hardware protocols and deterministic harnesses; semantic integration
waits for its existing accessibility dependency gate.

Patent review: `TRIGGERED` — the planned VirtIO compatibility, host-sharing, and
accessibility-device mechanisms require targeted mechanism and worldwide-family
review before implementation. This architecture document makes no clearance or
infringement claim; record that future review in
[`patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).
