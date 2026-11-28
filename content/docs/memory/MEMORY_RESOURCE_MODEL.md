# MRML capability-bound memory resources

**Status: PLANNED**, except for existing generational address-space mappings,
shared-page bindings, lifecycle cleanup, and revocation mechanisms documented in
the implementation ledger. This document does not claim quantitative pool
accounting is implemented.

> The ability to execute does not imply an unlimited right to consume memory.

> RAM is an explicitly budgeted, accountable resource.

> Resource consumption is authority.

> Resource authority may be delegated only by attenuation, never amplification.

## Separate objects and authority

```text
SystemMemory
  -> MemoryPool                 quantitative allocation authority
     -> MemoryObject            owned generational pages/granules
        +-> Mapping             projection into an address space
        +-> SharedView/Binding  deliberate peer delegation
        +-> DMA mapping         separate device + IOMMU authority
```

Exact names are not frozen ABI. Budget, ownership, virtual reservation, mapping,
sharing, pinning, content access, and DMA are distinct. A virtual address, object
name, task identity, or mapping address is not authority.

`MemoryPool` carries a maximum commitment, current usage, mapping bound, child-
delegation allowance, placement policy, lifetime/generation, and separately
attenuable allocation, derivation, sharing, mapping, pinning, and usage-
inspection rights. A task receives an explicit pool/derived allocator,
preallocated objects, or no additional allocation authority—never a hidden
unlimited global allocator.

The amount is part of authority. Child-pool commitments/delegations follow a
defined accounting model whose total cannot exceed the parent. Derivation may
narrow bytes/pages, placement, mapping, pinning, sharing, and lifetime. Parent
revocation invalidates/reclaims descendants according to explicit lifetime
semantics. Lowering a limit below commitment requires explicit pressure/reclaim/
termination behavior and never silent corruption.

`MemoryObject` binds exact size/extent, backing kind, generation, lifetime,
sharing state, ancestry/charge, and optional placement. Identity is independent
of VA. A mapping separately binds target address space, range, generation, and
attenuated read/write/execute/delegate/fixed-address rights while preserving W^X.

Address-range reservation is virtual structure; commitment charges pool RAM;
mapping associates an object with a reservation. Lazy backing reserves maximum
authorized commitment before it can affect peers. Native semantics do not assume
hidden overcommit. Any future explicit overcommit documents failures and cannot
promise backing that disappears unpredictably.

## Sharing, COW, lifecycle, and erasure

Shared memory deliberately maps the same object or derived view with per-peer
rights. Revoking one peer removes only that view while other valid authority
survives unless the object itself is revoked. This preserves existing exact-
generation shared-page revocation.

COW initially shares backing, but a private write charges the writer's pool; if
budget is unavailable it fails under defined semantics rather than charging an
unrelated domain. Pools, objects, mappings, views, guest mappings, and derived
bindings are generational so reuse cannot revive stale handles.

Task/domain/VM death accounts for owned objects, mappings, views, child pools,
pinned pages, DMA/IOMMU mappings, and guest mappings. Cleanup completes or
retains an explicit fail-closed/quarantined state before protected reuse.
Sensitive memory may require separately specified zeroization; reclamation is
not itself proof of secure erasure, especially on unverified hardware paths.

## Exhaustion and system accounting

Pool exhaustion is local: one application hitting 512 MiB receives deterministic
denial without consuming another domain's authority. Trusted policy may reserve
RAM for kernel, memory manager, supervisor, storage/network cleanup, compositor
fallback, and accessible recovery UI; that reserve is not ambient application
authority. Pressure events (`LOW`, `HIGH`, `LIMIT_REACHED` conceptually) grant no
additional RAM and allow voluntary release.

Filesystem/executable caches, network/GPU staging, service caches, IPC buffers/
queues, capability/task/mapping metadata, page tables, and VM metadata all consume
accounted bounded memory. Reclaimable cache is still inspectable resource use.
Sparse VA or cheap requests cannot force unbounded privileged page-table/kernel
growth. Charge policy avoids denial-of-service amplification.

Future in-process components may share one immutable executable `MemoryObject`
physically across consumers, as specified in
[../packages/COMPONENT_INTERFACES.md](../packages/COMPONENT_INTERFACES.md).
Accounting charges physical backing once under explicit system/cache policy and
charges every consumer for bounded mapping metadata and private component state.
Mapping fanout is bounded. Sharing never hides RAM, creates allocation authority,
permits writable executable code, or lets a stale mapping select newer code.

**PARTIALLY IMPLEMENTED foundation:** `account_component_executable` charges one
shared `MemoryObject` to an already authorized pool and issues an object
capability without `WRITE`. `reserve_component_executable_mapping` records one
complete RX projection under a separate target-address-space capability; the
existing mapping limit bounds fanout and live reservations block reclamation.
The current helper records accounting/policy only. Physical backing,
population/sealing, native installation, per-consumer private-state accounting,
and runtime generation binding remain **PLANNED**.

The focused signed ZIM/Zstd microVM probe additionally constructs the complete
fixed-capacity `TaskRuntime` and `ServiceSupervisor` through their existing
accounted wrappers. One exact pool is limited to the sum of those two required
page commitments and two objects. Startup verifies the complete charge; after
both tasks exit and supervised address-space/resource cleanup completes, the
probe consumes both wrappers, returns the exact page counts, and requires zero
remaining object pages and mappings before success. WHP and nested KVM execute
that path. The hosted component profile now additionally derives exact image
charges from each verified PE load plan: R and RX regions are distinct shared
objects, RW regions are private anonymous objects, and allocation gaps are
private nonmapped commitments. Separate target capabilities model consumer and
provider address spaces. Reservations precede construction and reclamation
follows backend teardown without granting authority to package metadata or
weakening W^X. Complete component/microVM resource accounting remains
**PLANNED**.

Kernel groundwork now also provides a distinct pre-allocation guest-RAM
reservation. It creates one exact generational `MemoryObject` with `Guest`
backing under an existing `MemoryPool` capability. The resulting authority is
read/write/map/pin/inspect/control only: it grants no execute, sharing,
delegation, DMA, device, or placement authority. Its unsafe release contract
requires the VMM adapter to prove that all native backing and mappings are gone
first. Focused Windows and Linux tests prove exact charging, exhaustion,
metadata-without-capability rejection, rights separation, and full return.
The reservation now converts into a non-cloneable staged construction authority:
each backend allocation phase must consume a positive exact page count, an
overrun fails, and publication is impossible while any pages remain. Abort and
active retirement return the underlying reservation only under an unsafe
caller proof that all native allocations or mappings from completed phases are
gone. This permits one pre-reserved total to cover base-kernel and later
consumer/provider phases without post-hoc accounting.

The focused signed component profile now consumes that authority on both hosted
backends. Before the first native allocation, each runner reserves the exact
sum of its base-kernel mappings, the rounded consumer/provider image pages,
and their stacks and page tables. KVM includes its
one-page framebuffer phase while WHP's component layout does not. Each phase is
consumed before its corresponding backend call, the reservation must be exactly
complete before isolation admission, and the full object returns only after
the guest owner confirms teardown. Fresh controlled probes passed on WHP and
nested KVM on 2026-08-25. This accounts mapped guest RAM for this one profile;
device-specific resources and opaque host-hypervisor allocations remain
**PLANNED**.

The same focused profile now also reserves a separate anonymous
`MemoryObject` for the exact page-rounded size of its MRML-owned prepared VMM
guest structure before construction. KVM accounts `PreparedKvmGuest<16>` and
WHP accounts `PreparedWhpGuest`; this control-memory capability permits only
read, write, inspection, and lifecycle control, with no mapping, execution,
pinning, sharing, DMA, device, or placement authority. The object remains live
through guest ownership, is reclaimed only after backend teardown, and must
leave the common pool at zero. This intentionally does not estimate or claim
opaque KVM/WHP host-kernel, hypervisor, allocator, or device-model memory.

The focused ZIM/Zstd transport pages are now separate from that aggregate guest
RAM object. Before guest construction, the common kernel helper allocates one
exact shared `MemoryObject` for the data page and one for the resource page,
then reserves one read/write mapping slot for each exact guest virtual page
under an independent target-address-space capability. Projection kind and guest
address are data, not authority. A third projection fails at the two-slot limit
and its provisional object charge is rolled back. After native guest teardown,
both mapping reservations retire before either page object; only then may the
control object and pool reach zero. Windows and Linux kernel tests plus signed
WHP/nested-KVM probes exercise this lifecycle. This does not implement a general
VirtIO, VirtualGPU, device, DMA, or host-share projection budget.

The cross-domain component prerequisite now has a **PARTIALLY IMPLEMENTED**
two-peer reservation. One shared `MemoryObject` carries explicit `SHARE` but no
`EXECUTE` authority and receives exactly two read/write, non-executable mapping
reservations under distinct target objects. Each target capability must contain
exactly `MAP|INSPECT|CONTROL`; insufficient or excessive rights, one target used
twice, stale capability generations, and second-mapping exhaustion reject. A
late reservation failure releases the first mapping and provisional object, so
the pool reports zero object pages and mappings. Windows and Arch Linux kernel
suites pass 574 tests. Native one-page backing and exact GPA map/unmap are now
**PARTIALLY IMPLEMENTED** for WHP and KVM. The owner retains the backing until
both mappings are removed and leaks rather than frees it if unmapping is
uncertain. Nested KVM exercised two distinct live VMs and observed the same
bytes. This nested WHP host rejects a second simultaneous partition with a typed
VID collision when registering the second partition's first GPA range. The
separate-process WHP storage diagnostic now verifies two signed guests with
one pagefile-backed section, exact removal of both mappings, and a 512-byte
RAM-backed result. The parent and worker open separate views of the same
section; no payload is written to a scratch file. Both workers use the same
local alias owner, which checks the exact peer projection before mapping,
withdraws its virtual leaf before unregistering GPA backing, and keeps the
backing alive if retirement cannot be confirmed. Naming and opening the test
section is not part of that owner. WHP same-process shared backing and a
production worker transport remain unverified on this host.
Guest page-table projection, peer queues, and execution remain **PLANNED**.

Exact guest translation is now **PARTIALLY IMPLEMENTED** by the same retained
peer-page owner. Each policy virtual page becomes one supervisor-only,
read/write, non-executable leaf to its exact guest-physical backing; both leaves
are verified and each stopped vCPU reloads its exact page-table root before the
owner is usable. Teardown verifies both leaves absent before native GPA removal.
A deliberate first-guest leaf conflict proves late rollback removes both native
GPA mappings and permits an immediate exact retry on live nested KVM. WHP has
the same source/API path, subject to the recorded second-partition host limit.
No new intermediate page-table allocation is permitted during this leaf-only
operation; the launch layout must already contain the required hierarchy.

The shared page now has a **PARTIALLY IMPLEMENTED** bounded interface-queue wire.
One fixed slot uses the already-accounted page and exact projection authority;
queue metadata does not grant authority. Every state transition revalidates the
projection and both target capability generations. The payload is bounded by
the remaining page bytes, sequence exhaustion rejects before publication, and
invalid or stale state cannot reset the queue. Nested KVM proves one complete
request/response byte exchange across two live VM mappings. Atomic guest-side
publication/notification and component execution remain **PLANNED**.

Two-peer policy retirement is now **PARTIALLY IMPLEMENTED** as one atomic
ledger operation. After a backend proves both native mappings and translations
absent, the kernel preflights the exact shared object, both mapping generations,
both target capabilities, absence of physical backing, exactly-two mapping
membership, generation advancement, and pool decrements before mutation. It
then revokes the object capability and retires both mappings plus the object in
one commit. Wrong target authority or an unexpected third mapping returns the
complete projection for retry without changing usage. Windows and Arch Linux
kernel suites pass 574 tests. Backend retirement now removes both exact native
GPA mappings first; uncertainty poisons the backend and retains or deliberately
leaks the backing to prevent use-after-free. Guest translation/page-table
teardown and the queue lifecycle remain **PLANNED**.

Pinning is separate scarce authority because it limits reclamation and may enable
device visibility. Object ownership never implies DMA. DMA requires the exact
object plus device/DMA authority and a valid IOMMU mapping; invalidation completes
before reuse.

Future swap/compression preserves per-domain accounting, confidentiality,
authenticated/encrypted untrusted persistence where required, and bounded
latency/failure semantics. Swap does not promise unlimited RAM. Cross-domain
deduplication is disabled by default pending side-channel analysis.

## Placement and performance

Strict Total MicroVM placement is specified in
[../ISOLATION_PLACEMENT.md](../ISOLATION_PLACEMENT.md). Requested and effective
placement carry explicit process/service/VM, page-table, queue, and shared-code
charges. In strict Total mode, RAM, vCPU, VirtualGPU, VirtIO, projection, or VMM
resource exhaustion makes the affected eligible component unavailable and
reports the exact shortage; it never causes native fallback. Resource pressure
may reduce availability, throttle, or stop work, but cannot weaken placement.

The isolation-admission path now has a **PARTIALLY IMPLEMENTED** linear
`MicrovmProjectionPlan`. Before backend allocation begins it revalidates the
exact guest-RAM object capability and backing kind, exact RAM page count, and a
live same-domain vCPU reservation inspected through its parent budget
capability. A new recoverable RAM-preparation form returns the exact unpublished
reservation on validation failure rather than losing quantitative authority.
The plan also retains the exact required capability projections. Windows and
Arch Linux unit tests cover successful consumption, RAM/vCPU mismatch, missing
`VirtualGPU`, stale interface authority, and recoverable RAM failure. Native
WHP/KVM application construction now consumes this plan: the exact aggregate
guest-page charge is reserved before construction, sealed only after native
construction and application attachment, retained for the active guest, and
returned only after guest destruction. The same signed application completed
this lifecycle on WHP and nested KVM. Device-specific memory/reset accounting,
general service integration, opaque host-hypervisor allocations, and physical
backing evidence remain **PLANNED**.

Default policy selects NUMA placement, migration, tiering, and huge pages while
preserving object identity. Advanced authority may request node/device locality,
interleave, latency class, or large-page preference, subject to policy. Physical
page identity is not ordinary ABI.

Measure allocation/free/reclaim/map latency, pool-accounting overhead, sharing,
revocation, and VM provisioning. Optimize from evidence rather than weakening
accounting.

## VMM and guest memory

A VM receives a bounded host-derived guest-memory pool and mapping limit. Guest
physical addresses are data, not host authority, and the guest cannot inflate
host commitment beyond projection. Shared host/guest pages derive from exact host
objects, rights, lifetime, and revocation.

Ballooning/hot-resize explicitly changes delegated quantity. Increase requires
new host authority; decrease requires cooperation or defined forced reclamation,
mapping invalidation, and cleanup before reuse. It is not bookkeeping-only.

## GPU/system alignment

System `MemoryPool -> MemoryObject -> Mapping` and GPU `GpuDomain/MemoryPool ->
Buffer/Image/Tensor -> GPU VA Mapping` use analogous bounded allocation,
derivation, generation, mapping, accounting, and revocation principles without
requiring identical implementations. Unified physical memory retains separate
CPU mapping, GPU-domain mapping, pool charge, and residency/migration authority.
See [GPU_ARCHITECTURE.md](../gpu/GPU_ARCHITECTURE.md).

## Introspection and broader resources

The [unified system monitor](../monitor/SYSTEM_MONITOR.md) projects these
accounted objects and shared-page costs without acquiring mapping, content,
debug, or budget authority. This integration remains **PLANNED**.

Authorized monitors may inspect pool limit, committed/shared/pinned quantities,
descendant pools, and pressure without reading memory contents. Observation,
content read, limit increase, modification, and termination are separate
capabilities. AI may see “browser uses 3.8/4 GiB” without browser memory.

RAM is one resource-specific capability family alongside CPU, VRAM/GPU time,
storage quota, network capacity, device sessions, and IPC capacity. Common
attenuation/accounting/revocation principles do not require one omnipotent
`ResourceCapability` or administrator.

The first separate CPU-family prerequisite is now implemented as a bounded
generational `CpuBudgetTable`: it reserves exact domain-bound parallelism under
an explicit budget capability, rejects amplification and stale or duplicate
reservations, and blocks root retirement while vCPU reservations remain. It is
not a `MemoryObject`, and RAM authority cannot substitute for it. The focused
signed component profile now retains one exact reservation across WHP/KVM guest
lifetime and releases it after teardown; budget failure makes the Total-mode
domain unavailable rather than native. One shared fixed-period allowance now
precharges every focused component vCPU entry and cannot be amplified by
parallel reservations. Authorization binds the reservation's exact domain,
vCPU index, affinity-selected logical CPU, and priority ceiling; failed choices
consume no runtime. This is deterministic dispatch-admission accounting,
not elapsed-time or deadline evidence. Host/APIC timer enforcement,
elapsed-time reconciliation, priority/affinity, and broader VMM profiles remain
planned.

Illustrative browser-VM envelope: four bounded vCPUs; 4 GiB RAM pool; graphics +
decode with 512 MiB VRAM and bounded GPU time; 10 GiB storage quota; and exact
network-connection capabilities. This is not frozen policy.

## Security and acceptance gate

- allocation cannot exceed explicit pool authority;
- child pools cannot amplify quantity;
- VA reservations do not hide physical commitment;
- mappings cannot outlive object/address-space generations;
- stale pools, objects, mappings, and shared bindings fail closed;
- revoking one shared peer preserves unrelated valid peers;
- pinning and DMA require separate rights;
- guest RAM cannot exceed host projection;
- uncertain cleanup blocks protected reuse;
- exhaustion remains local where reserves/policy permit;
- usage inspection reveals no content.

Tests cover exact limit and one-page-over denial, child attenuation/amplification,
parent revocation, stale handles, COW exhaustion, sparse-page-table and IPC
exhaustion, pinning, guest inflation, death cleanup, peer survival, cleanup-before-
reuse, and introspection accuracy. Adversarial tests stress tiny/huge allocation,
churn, sparse mappings, COW, sharing fanout, VM cycles, pinned/DMA state, and
cleanup failure while verifying exact accounting.

## Dependency placement

Phase 1 retains exact ownership, generations, mappings, shared memory, cleanup,
and revocation. Phase 2 adds pools, objects, quantitative delegation, and IPC/
cache accounting without preempting current storage/service gates. VMM work adds
bounded guest pools; dynamic resize follows. GPU work aligns VRAM concepts.
NUMA, huge pages, swap/compression, QoS, and side-channel review are later. This
does not preempt VirtualGPU or the compiler ownership/CFG/Polonius lane.

Patent review: `NOT_TRIGGERED` — this documentation specifies conventional
quantitative resource accounting, allocation/mapping separation, and capability
attenuation without implementing a new mechanism. See
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
