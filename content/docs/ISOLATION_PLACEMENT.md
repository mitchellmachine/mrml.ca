# MRML Total MicroVM isolation

Strict Total MicroVM is MRML’s only operating mode. Ordinary applications
and services execute in admitted microVMs or remain unavailable. The loader,
Gigakernel, and minimal virtualization substrate are mechanisms, not an
alternate session mode. Recovery and hosted diagnostics remain separate
from an MRML session. Full-system Total operation is not yet implemented.

Status: **PARTIALLY IMPLEMENTED**. Manifest V2 parses a typed placement policy,
rejects unknown fields/tokens, contradictory bounds, duplicates, and cross-class
placements, and requires a reason for fixed platform policy. Current application
and service manifests explicitly record policy; the configuration service was the first service used to exercise the microVM
launch contract. The bounded
resolver applies package defaults, owner requests, and total-mode requests; an
unsupported total promotion is reported as an exception and launches nothing.
The workspace model retains each validated policy and `mrml.lock` records its
default, floor, ceiling, and supported set. The kernel now has a fixed-capacity
launch-admission mechanism that records an exact policy generation, Total-mode
eligibility class, requested placement, and matching backend-ready evidence. It
rejects eligible native placement and active unsupported blockers in Total mode,
and reports typed resource or transport unavailability without native fallback.
Unavailable attempts are retained in a bounded ordered kernel ledger with exact
policy generation, attempt sequence, class, requested placement, and reason;
an explicit retry removes the prior failure only after a new launch slot is
successfully reserved. The Total report counts unavailable eligible domains
separately from running domains and native fallback.
It does not select providers, create a VM, allocate resources, persist policy,
or implement boot/runtime transport. Those mechanisms remain **PLANNED**.
The existing signed configuration-service probes on both hosted VMM runners now
prepare that exact Total-mode record before guest construction, commit it only
after the backend has produced the requested microVM container, and emit a
structured zero-fallback report only after the complete service probe succeeds.
This is launch-admission integration, not proof that the required system
satisfies Total mode.

Every checked-in service package now declares a runtime classification. The
compositor and deployment service are required microVM-eligible services when
included in an active release; placement eligibility does not attest that
an executable has launched. The storage coordinator is explicitly a required
blocker until its installed guest and runtime transport exist. The separately signed
RAM-backed block-service probe exercises a supervised Total MicroVM guest. Its
client and service are separate CPL3 tasks within that one diagnostic guest;
the fixture does not establish production inter-VM transport or physical I/O.
The next transport slice carries a canonical 512-byte READ over the existing
peer-page call queue between distinct hosted guest mappings. In the focused
signed-payload test, the provider guest checks the request and produces the
sector, and the consumer guest checks every response byte. The host still
runs the typed queue endpoints and delivers notification checks separately;
this is not a guest interrupt handler or production service launch. The
provider retirement/rebind simulation rejects old notifications and sessions
before backend I/O. Wiring the installed service, guest interrupt consumers,
and real block providers remains open. The former direct FAT32 provider
launcher is available only for hosted regression and is not an OS launch path.
The standalone
service-image package is an optional diagnostic blocker, not a production
exception. The compositor’s fixed one-shot service probe builds as a PE service
payload and renders a private 128×32 frame. It uses the existing bounded
shared-buffer syscall for output, releases the write grant, then sends a
capability-free completion. Production launch and physical scanout are not
yet connected. A signed KVM
fixture now verifies the whole 16,384-byte raster (4,096 ordered BGRX words,
243 white glyph pixels and an exact fixture checksum), across the existing
user-copy boundary and only after the write grant is revoked and the exact
sender’s completion is received. Its supervisor-only bootstrap page has no
service alias. The same signed images with a read-only grant publish no frame.
The corresponding WHP fixture passed both cases on Windows with a separately
signed build of the same diagnostic kernel and service source. Both backends
used one admitted microVM and zero native fallback in each case. This is
hosted evidence for a single service, not physical display or full Total
operation. Use release builds for the `scanout_service_probe` kernel profile;
an initial debug kernel exhausted its fixed boot stack. The hosted runners
accept `scanout-service-probe` or `scanout-service-denied-probe` with the
signed compositor image and its explicit public root.
Total placement does not promote an explicitly non-eligible class
just because its supported placement list contains microVM. Existing admission
and readiness evidence gates still determine whether Total is satisfied.

The kernel binds the exact domain, interface and immutable generations to a
microVM service route. The freestanding build rejects any other service placement
at specification construction and compiles only the microVM dispatch entry.
MicroVM failure is retained as unavailable without fallback. Configuration
launch has been demonstrated in signed hosted probes; general resolver-to-guest
construction and runtime transport are not yet complete.

Applications have their own admission route. It binds the domain, application
object, immutable artifact digest, application generation, active
`SystemGeneration`, and applied policy generation to microVM execution.
Stale generations cannot reach the backend, and failed construction is recorded
as unavailable. The freestanding build has no direct process dispatch entry.
Hosted tests of the former direct lifecycle are regression evidence only.
The kernel artifact boundary recognizes a bounded executable
`ApplicationImage` kind and can authenticate it against an independently
selected application root. It is intentionally outside the fixed five-root
early-boot `SystemRelease`: asking that release to supply an application root
fails closed instead of indexing beyond its root set. This is typed admission
groundwork only. A separate kernel binding now accepts route-ready application
identity only when that verified artifact's kind, version, and SHA3-512 payload
digest exactly match the named package record in one canonical active
`SystemGeneration`; absence or substitution produces no route specification.
The first-party signing tool also exposes an explicit `application` kind rather
than requiring these bytes to masquerade as a service or boot artifact.
The kernel handoff model now likewise has a distinct typed `ApplicationLaunch`
descriptor. It reuses the reviewed bounded user-image layout checks internally
but cannot be passed as `ServiceLaunch` or thereby acquire a service identity.
The canonical handoff now encodes service and application under distinct flags
and fixed descriptors, requires all backing ranges to be reserved and mutually
disjoint, and rejects truncation, trailing bytes, or overlap before publication.
Boot consumption of the application descriptor remains **PLANNED**.
The x86-64 mapping layer now has a distinct `ApplicationAddressSpace` adapter:
it requires an authenticated `ApplicationImage` whose version and measurement
match the handoff, then reuses the same final W^X PE and guarded-stack mapping
mechanism. It cannot accept a `ServiceImage` as application identity. Live CR3
installation and task launch from this adapter remain **PLANNED**.
No application loader or runtime consumes the verified bytes yet. A
backend-neutral microVM owner now accepts one already constructed guest only
after rechecking the complete immutable application route, consumes that guest
once, exposes it solely through a generational endpoint, refuses native-process
dispatch, and retains guest plus endpoint when teardown is uncertain. Its
focused tests use mock guests; it is ownership groundwork, not a VM constructor
or backend execution result.

The kernel admission prerequisite now binds every prepared, running,
unavailable, and routed domain to both a nonzero active `SystemGeneration` and
the applied isolation-policy generation. A stale system generation is rejected
before backend construction, separately from a stale policy generation, and
the committed native IPC or microVM route retains both identities. The
configuration service derives service specifications from the admission
table's active system generation rather than package metadata. The focused
WHP/KVM component probe stages and commits one explicit local generation through
the bounded capability-authorized `DeploymentService` activation transaction,
then passes its immutable typed activation record into kernel admission. The
component runners now require a signed general `SystemRelease` and explicit
public root, derive the deployment candidate only from that artifact, and
cross-check its generation/catalog roots against the locally verified
consumer/provider before Total-mode admission. Each optimized runner independently
emitted byte-identical canonical records from freshly signed current artifacts,
then consumed the same freshly signed release. Nested KVM reported one eligible
microVM with zero native fallback; WHP completed the exact data path and cleanup.
This is hosted activation and kernel/runtime identity evidence. The service now also
publishes/reconstructs the same typed record through one receipt-bound stable
COW file-generation transaction in focused Windows/Linux simulation tests, and
the hosted WHP/KVM paths re-decode the canonical recovery checkpoint before
kernel admission. The deployment recovery contract now independently binds the
accepted monotonic epoch and exact volume/object/file generation to that
checkpoint and rejects replay of an older valid file in Windows/Linux unit
simulation. A concrete TPM/NVRAM/recovery-journal backend, physical durability,
and general runtime delivery remain **PLANNED**.

- Complexity impact: MEDIUM
- TCB impact: LOW
- New parser boundary: NO
- New authority model: NO
- New persistent state: NO
- External dependency: NO
- Failure isolated: YES
- Existing-object reuse: HIGH

This increment reuses the existing bounded release parser, deployment
transaction, explicit trust-root identity, active-generation record, and both
backend adapters. It removes a raw-record bypass from the focused VMM control
plane without adding authority: the caller-selected root and deployment
capability establish authority, then exact authenticated records take the
shortest safe path into kernel admission.
The build/kernel boundary now has a canonical fixed 344-byte, pointer-free
component-service launch handoff in the shared package-format library. The
build tool derives system generation, provider generation, interface
generation/fingerprint, placement, the SHA3-512 digest of the complete
canonical `SystemGeneration`, the SHA3-512 digest of the canonical `MRMLIC1`
interface catalog, and both artifact digests only from its
linear resolved launch; it accepts only capability-selected kernel object IDs
and the applied policy generation as later authority input. Kernel decoding
rejects bad magic/length, reserved bytes, unknown placement, zero identities,
zero or substituted artifacts, stale active generations, a reused generation
number with different generation or interface-catalog bytes, and any mismatch
with an already resource-reserved route before backend invocation. Both focused WHP/KVM
runners now use this codec instead of the raw binder and derive its active
generation input from the same `DeploymentService` transaction. Persisted
Complete Manifest V2 catalog delivery and hardware-backed generation selection
and recovery remain **PLANNED**.

The canonical `org.mrml.zstd`/`org.mrml.zim` manifests now select the
`isolated-service` interface form, with Zstd restricted to microVM placement. Its first bounded data-plane adapter
uses the unchanged ABI-3 request over authenticated kernel IPC plus exactly one
attenuated read/write shared-buffer capability. Hosted Windows and Arch Linux
tests deliver the request through `TaskRuntime`, revalidate the exact VM/task
binding, copy only bounded input/output through private erased scratch, and
reject revocation, wrong-task substitution, malformed input, and insufficient
scratch before output mutation. This is **PARTIALLY IMPLEMENTED** transport
composition. A bounded userspace loop now receives that request/capability,
performs the same private-copy operation, sends the exact response through a
launch-bound runtime trait, releases the received leaf, and erases its buffers.
A hosted `TaskRuntime` adapter now completes the full authenticated request and
reply path: it rejects a non-bound sender, uses a separate reply capability,
revokes the received leaf before response visibility, and suppresses the reply
if revocation fails. Construction now consumes one committed service route and
requires exact agreement with the expected interface object, ABI generation,
immutable provider generation, and policy generation. The retained domain,
Total-mode class, and placement cannot be replaced by data-plane messages. It is
now composed with a hosted supervised native-service backend: the backend
creates a distinct-address-space `TaskRuntime` task through
`ServiceSupervisor`, retains the exact service/task and
interface/provider/policy identities, and issues reply
authority only when the committed route is consumed into the stable ABI data
plane. Windows and Arch Linux tests execute the exact ABI-3 request through
that launched task's inbox and shared-buffer projection, then require task
retirement and address-space erasure. Erasure uncertainty retains the endpoint
and cleanup ticket for exact retry. Total mode rejects this native route before
the supervisor creates a task. This is controlled hosted kernel-lifecycle
evidence, not execution of the standalone native image or a complete resolver-
to-launch runtime; those remain **PLANNED**. The standalone
`org.mrml.zstd` target binary now supplies the x86-64 `int 0x80` trap for exact
operations 5, 7/8, 12, and 4 and accepts endpoint, caller, and provider
generation only from immutable launch registers. Cross-host target builds pass,
but the image has not executed. Its current one-page allocation-free floor
supports raw/RLE frames and fails closed on entropy-coded blocks.

The native configuration form now has its first real supervised launcher. It
preflights one vacant supervisor slot before creating a task, publishes the task
and `ServiceId` as one kernel-owned transition, and returns a binding-preserving
endpoint only after the dedicated runtime starts it. Revocation retires the task
and consumes its exact cleanup ticket only after address-space erasure. Erasure
uncertainty retains the endpoint and ticket for exact retry. The microVM launcher
now has a backend-neutral owner around one actual prepared guest: successful
construction publishes only an opaque generational endpoint bound to the exact
domain, interface, provider, and policy generations; confirmed destruction
retires it; uncertain destruction retains the guest and endpoint for exact
retry. Forged or stale endpoint tokens never reach backend teardown. Concrete
KVM and WHP hosted configuration probes now transfer their transaction-
committed prepared guest into this owner, use the retained guest through its
exact endpoint, and explicitly retire the lifecycle on the successful terminal
path. Unrelated launch modes cannot consume a configuration-owned guest. Both
runner builds and focused unit suites pass with this identical ownership shape.
The direct configuration launcher is compiled only on hosted targets for
regression coverage and is not an OS execution path. The WHP/KVM component probe resolves its exact
microVM provider from canonical bytes matching the recovered active generation.
General resolver-to-guest construction and transport remain planned.
An admitted-guest transfer factory now accepts one backend-constructed guest
only when the complete `IsolationServiceSpec` matches, consumes it once, and
permits trusted mutable guest access only through the matching generational
endpoint. This is the explicit bridge the existing KVM/WHP construction
transactions use; it grants no new guest authority.

The kernel routing API now also exposes a one-use prepared service transaction
for VMM launchers whose construction spans multiple backend operations. The
transaction reserves admission before construction and retains the exact
domain, interface, interface generation, provider generation, policy generation,
class, and placement until matching endpoint commit. Construction failure can
consume it into the typed unavailable ledger; commit failure returns both the
transaction and endpoint so native teardown precedes admission cancellation.
Both KVM and WHP configuration-service probes now use this transaction around
their real guest and projected-service construction. The prepared transaction
exists before either backend creates the guest and binds provider generation to
the verified service artifact version; only the fully attached guest is
committed as the endpoint, after which execution receives it back unchanged.
The signed component-service probes now apply the same rule at each unpublished
construction boundary. Kernel-guest construction, exact component binding, or
atomic consumer/provider attachment failure consumes the prepared route into
the kernel's typed unavailable ledger as `VMM_RESOURCE` and returns the error;
none of those paths can attempt native execution. A focused kernel test proves
the unavailable count advances while the native-fallback count remains zero,
and both hosted runner suites compile and pass with the same failure shape.
The committed guest now remains inside the common configuration lifecycle until
explicit terminal retirement. Both runners build and their focused host tests
pass. Newly built one-time-signed kernel and service artifacts completed the
full hosted service probe on both backends on 2026-08-25. WHP and nested KVM
each reported one eligible domain, one domain in a microVM, and zero native
fallback after explicit lifecycle retirement. WHP reported `verify=18258us`,
`prepare=6937us`, `execute=3530us`, `total=53537us`; KVM reported
`verify=22013us`, `prepare=2758us`, `execute=1578us`, `total=109945us`.
The identical package, signed kernel, signed service, and public keys were used
for both. This is hosted controlled-probe evidence—not host-resistant isolation,
bare metal, physical hardware, broad application compatibility, or required-
system Total readiness.

Both hosted runners now replace their former hard-coded Total
`IsolationServiceSpec` with the same typed configuration path. Each constructs
component `MICROVM` and system `TOTAL_MICROVM` records through exact
capabilities, commits revision 1, loads and reapplies the revision-bound plan,
checks the configuration service's native/microVM package bounds, binds the
verified service artifact generation and interface generation, and reserves the
kernel route before guest construction. The existing retained guest lifecycle
then consumes that exact prepared specification. A fresh run with the same
signed artifacts on 2026-08-25 again reported one eligible domain, one microVM
domain, and zero native fallback on both backends. WHP reported
`verify=24643us`, `prepare=4337us`, `execute=3497us`, `total=64082us`; KVM
reported `verify=21416us`, `prepare=2747us`, `execute=1527us`,
`total=116185us`. This proves hosted policy-to-construction parity only; the
probe's policy store is transient and does not prove stable-policy recovery,
boot selection, host resistance, bare metal, or required-system Total readiness.

The exact frontend/build and execution commands were:

```text
mrml build org.mrml.system.bootloader --target uefi-x86_64 --release --feature-profile service_probe
mrml build org.mrml.system.service-image --target native --release
mrml build org.mrml.tool.sign --target windows --release
mrml-sign keygen target/total-microvm-current/kernel.private target/total-microvm-current/kernel.public
mrml-sign keygen target/total-microvm-current/service.private target/total-microvm-current/service.public
mrml-sign keygen target/total-microvm-current/package.private target/total-microvm-current/package.public
mrml-sign sign-bundle kernel 1 target/total-microvm-current/kernel.efi target/total-microvm-current/kernel.private target/total-microvm-current/kernel.signed
mrml-sign sign-bundle service 1 target/total-microvm-current/service.efi target/total-microvm-current/service.private target/total-microvm-current/service.signed
mrml package create org.mrml.system.kernel kernel 1 x86_64 kernel target/total-microvm-current/kernel.signed target/total-microvm-current/kernel.mrp --private-key target/total-microvm-current/package.private
mrml-whp-run.exe target/total-microvm-current/kernel.mrp target/total-microvm-current/package.public target/total-microvm-current/kernel.public 1 service-probe target/total-microvm-current/service.signed target/total-microvm-current/service.public 1
wsl.exe -d archlinux -- ./target/mrml-native/linux/release/mrml-kvm-run target/total-microvm-current/kernel.mrp target/total-microvm-current/package.public target/total-microvm-current/kernel.public 1 service-probe target/total-microvm-current/service.signed target/total-microvm-current/service.public 1
```

The build tool now has a bounded composition prerequisite between exact package
resolution and kernel launch routing. A linear
`PreparedGenerationBoundServiceLaunch` first retains the exact resolved
consumer/provider records, immutable `SystemGeneration`, native-service or
microVM placement, and both admitted load plans without an endpoint. Only after
the selected backend returns an opaque endpoint can consuming publication create
the generational `InterfaceBinding`. Package/form/artifact mismatch, Total-mode
exceptions, and binding-table exhaustion publish no new endpoint reference;
publication failure returns the complete prepared launch and opaque endpoint
for backend teardown, while existing entries remain unchanged. This is host
control-plane ordering, not a kernel runtime handoff: it does not grant
capabilities, invoke a backend, create
a guest, or carry interface traffic. General microVM service runtime delivery
remains **PLANNED**.

> Control planes establish authority; data planes should take the shortest safe
> path.

The configuration service, resolver, capability policy, and VMM admission form
the control plane. They authorize the exact provider generation, guest,
projected capabilities, queues, resource budgets, and revocation path. Once
admitted, ordinary interface traffic uses the bounded microVM transport without
repeating policy lookup for each message. Data-plane bytes cannot grant
capabilities, substitute providers, or widen the admitted binding.

```text
CONTROL PLANE
App -> request interface capability -> policy/resolver -> service or VMM broker
    -> bind exact provider generation + placement + queues -> done

DATA PLANE
App domain == admitted IPC/shared queue ==> bound provider -> backend/hardware
```

The first signed two-artifact hosted probe now applies this split end to end.
The control plane verifies and atomically attaches the exact immutable
`org.mrml.zim` consumer and `org.mrml.zstd` provider generations, commits one
Total-mode microVM route, and supplies separate use and delegation
capabilities. The data plane then carries the fixed ABI-3 request, bounded
payload, and response through the already-bound IPC endpoint and shared
`MemoryObject`; it performs no provider lookup or policy round trip. A shared
buffer read accepts exactly either `MAP|READ` or `MAP|READ|WRITE`, never an
arbitrary rights superset, so the one admitted read/write data capability can
serve the bounded request/response buffer without weakening exact-rights
authorization.

Fresh one-time-signed artifacts completed this controlled hosted probe on
2026-08-25. KVM reported `eligible=1`, `microvm=1`, and
`native_fallback=0`, then reached the expected bounded halt. WHP completed the
same exact-generation ZIM/Zstd exchange and lifecycle cleanup. This is hosted
controlled-probe evidence only; it does not prove host-resistant isolation,
physical hardware, persistent owner settings, boot-menu Total mode, or
required-system Total readiness. The complete adaptive-placement architecture
and Total MicroVM Isolation therefore remain **PLANNED**.

The component profile now also creates its complete fixed-capacity task runtime
and service supervisor through the existing quantitative `MemoryPool` wrappers.
It verifies the exact two-object page charge before launch and, only after both
services and cleanup tickets retire, returns both commitments and verifies zero
remaining object pages and mappings. The same signed kernel passed this gate on
WHP and nested KVM. Executable/private pages and device projections remain
outside this focused pool and are still **PLANNED**. The focused hosted profile
now pre-reserves exact mapped guest RAM, one domain-bound vCPU, and a distinct
page-rounded anonymous `MemoryObject` for its MRML-owned prepared KVM/WHP guest
structure before construction. The control-structure object is non-executable,
non-mappable, non-shareable, and retained until guest teardown; failure to
reserve any of these resources makes the Total-mode component unavailable
without native fallback. Opaque host-hypervisor internals and device-model
allocations are not counted or claimed. The focused signed
component path now does consume it: backend-specific base pages, both service
images/stacks/page tables are charged before
their native construction phases; exact completion precedes admission; and
guest teardown precedes full release. WHP and nested-KVM controlled probes pass
with zero native fallback. The shared data and resource pages now consume two
separate one-page shared objects and two exact guest mapping slots established
by the control plane before construction. Teardown retires both native
projections, then their mapping reservations and object charges; projection
exhaustion fails before publication and never selects native placement. The
same control-plane gate now derives an exact plan from each verified PE image:
read-only and executable regions receive distinct shared objects and R/RX
mappings, writable regions and allocation gaps are private anonymous charges,
and separate target capabilities represent consumer and provider address
spaces. Teardown retires native execution before these mappings and objects.
Fresh WHP and nested-KVM probes pass with zero native fallback. Other microVM
profiles, scheduler enforcement, native physical backing, and general device
projections remain **PLANNED**.
Kernel CPU-budget groundwork now provides the separate generational authority
for the vCPU gate, including exact domain reservations and bounded parallelism.
The signed component runners reserve exactly one vCPU before guest construction,
retain it through the active guest, and reclaim and retire it only after guest
teardown. A shared kernel bridge consumes reservation failure into typed
`VCPU_BUDGET` unavailability with zero native fallback. Focused tests and fresh
WHP/nested-KVM controlled probes pass. Broader scheduler enforcement, multiple
profiles/vCPUs, and physical-topology evidence remain **PLANNED**.

The CPU gate now also precharges an exact bounded runtime slice before every
focused component vCPU entry. One period allowance is shared across all
reservations under the budget, so parallel vCPUs cannot amplify time authority;
the dispatch also binds the reservation domain, in-range vCPU index, allowed
logical CPU, and priority ceiling. Each issued slice is linear: another slice
for that vCPU, reservation release, and period rollover are denied until exact
reconciliation.
The kernel now retains a separate fixed slice slot for every vCPU in one
reservation, bounded by the existing 64-vCPU affinity model. Simultaneous
sibling slices remain charged to the same allowance, reconcile independently,
and cannot be substituted by changing vCPU, logical CPU, priority, start, or
charge. Any unresolved sibling continues to block release and rollover. The
signed two-vCPU kernel probe exercises the backend gate: WHP and KVM
consume two simultaneous 100-millisecond slices, bind separate runner threads
to authorized logical CPUs 0 and 1 at host-normal priority, arm independent
deadlines, restore both native scheduling states, and return exact per-runner
host-wall measurements for independent reconciliation. This proves the shared
mechanism under signed hosted SMP execution.

The focused exact-generation component route now has a distinct two-vCPU
profile. The existing Total-mode transaction resolves and verifies the signed
`org.mrml.zim` consumer and `org.mrml.zstd` provider, reserves exactly two vCPUs
from one shared 200-millisecond budget, prepares one two-vCPU microVM, and
precharges both 100-millisecond slices before either native runner starts. The
BSP and AP emit the signed SMP proof under independent deadlines; the AP then
halts and the BSP continues through the already-bound ABI-3 component data path.
Service/control-plane construction is isolated behind a no-inline boundary so
early SMP startup retains the fixed guarded stack contract. Guest teardown
precedes two-vCPU reservation release and root retirement. A failed reservation,
guest construction, deadline, SMP proof, or component stage never invokes the
native-service route.

Fresh one-use-signed profiles completed on 2026-08-26. WHP measured
`bootstrap=6089us`, `application=3984us`, and total reconciled component runtime
`10815us`; nested KVM measured `bootstrap=4415us`, `application=4086us`, total
component runtime `9261us`; both reported `eligible=1`, `microvm=1`, and
`native_fallback=0`. This proves one controlled hosted multi-vCPU component
profile with WHP/KVM parity. It does not prove host-resistant isolation, trusted
CPU time, physical topology, persistent boot selection, broad application
compatibility, or required-system Total readiness; those broader milestones
remain **PLANNED**.
The runner measures host-wall elapsed time around backend entry, refunds only a
verified underrun, and retains the complete precharge on overrun. Replay,
substitution, exhaustion, invalid time, affinity, priority, or vCPU selection
fails closed. The backend-neutral deadline contract now arms cancellation before
entry and withholds return and teardown until its worker retires. Focused live
infinite-loop guests expire through WHP cancellation and KVM
`immediate_exit` plus a runner-thread signal. The slice's authorized logical CPU
now passes directly to a backend-neutral affinity contract; each backend binds
the runner before entry, retires the run and deadline worker, and restores the
complete prior affinity before return. Invalid CPU indices and uncertain bind
or restoration fail closed. Fresh signed WHP and nested-KVM component probes
completed on logical CPU 0 and reconciled 1,466 and 1,385 microseconds
respectively; KVM retained zero native fallback. These hosted mechanisms do not
prove trusted CPU time, exact deadline latency, native APIC enforcement,
physical topology, or a boundary against the host. Priority-class and general
scheduler expansion remain **PLANNED**, except for one now-enforced common
host-normal class. The focused budget has priority ceiling 0 and passes the
slice's exact priority directly to a shared scheduling contract. WHP applies
and verifies `THREAD_PRIORITY_NORMAL`; KVM applies and verifies `SCHED_OTHER`
with scheduler priority 0. Both restore and verify the complete prior native
state after the bounded run. Nonzero classes and uncertain transitions fail
before successful return; no numeric equivalence with stronger host policies is
inferred.

## One operating mode and its execution boundaries

MRML extends its existing process, service, capability, package-generation, and
VMM architecture; it does not add a second sandbox system. `IsolationPlacement`
conceptually contains:

- `IN_PROCESS`: admitted code in an explicitly compatible consumer domain;
- `NATIVE_PROCESS`: a distinct native userspace process/domain;
- `NATIVE_SERVICE`: a supervised native service domain;
- `MICROVM`: a supervised VMM guest using projected capabilities and typed MRML
  interfaces;
- `PLATFORM`: fixed kernel, loader, or pre-VMM execution outside selectable
  userspace placement.

Kernel and UEFI-loader placement is fixed. Ordinary applications, services,
and independently serviced providers have a microVM placement or are
unavailable. Statically linked libraries execute inside their consumer’s VM,
not as separately admitted runtime domains. Hosted development binaries and
regression probes are not MRML operating modes.

## Preference, floor, supported forms, and policy

Package metadata separately records default/preferred placement, minimum
required isolation, supported placements, and, where needed, a maximum. Owner
policy may strengthen placement and may select a weaker preference only within
the admitted supported set and never below the mandatory floor. A package whose
minimum is `MICROVM` cannot be weakened by ordinary Settings. Publisher identity
or metadata describes policy input but neither grants authority nor lets a
malicious package demand ambient in-process authority.

Canonical Manifest V2 uses one bounded table:

```toml
[isolation]
default = "microvm"
minimum = "microvm"
supported = ["microvm"]
```

A fixed pre-VMM component uses `platform`, a singleton supported set, and a
bounded reason. Admission rejects unknown placements, contradictory bounds,
duplicates, unsupported defaults, and impossible requirements. Placement and
authority are orthogonal: metadata never grants capabilities.

Assess untrusted inputs, device access, authority, failure impact and resource
cost when defining each guest and its projections. Neither publisher identity
nor memory safety changes the requirement to run ordinary domains in a microVM.

The only system policy selection is `total-microvm`. A component must be
admitted to a microVM; an incompatible package is unavailable. Retired policy
values are rejected rather than reinterpreted. Firmware and kernel mechanisms
never turn an incompatible package into an alternate mode.

## Semantic interface compatibility across placements

Consumers bind a stable typed MRML interface and exact immutable provider
generation, not a DLL/SO name, path, PID, VM ID, or placement. The resolver
selects an admitted form compatible with interface, package, generation,
hardware, and effective policy. Where multiple forms exist, in-process calls,
native-service IPC, and microVM VirtIO/shared-IPC are transport adapters behind
the same semantic contract.

Placement may legitimately change latency, startup time, failure boundaries,
resource accounting, shared-memory behavior, timeouts, and debugging. This is
semantic compatibility where supported, not identical transport or performance.
Interfaces define observable failure, cancellation, and bounded backpressure as
needed. Shared memory is explicit, range/right/lifetime bounded, revocable, and
generation-safe; executable sharing is immutable and preserves W^X.

Moving a provider preserves exact generation binding, protocol semantics,
capability attenuation, revocation, accounting, and supported accessibility
meaning. It is a supervised replacement, never in-place executable patching.
Existing consumers retain their generation until orderly rebind/restart. Rust's
native ABI is not the stable cross-placement ABI.

## Strict Total MicroVM semantics

`TOTAL_MICROVM` is the only supported operating mode. Every running
`MICROVM_ELIGIBLE` userspace execution domain MUST execute within an admitted
microVM boundary. If its microVM, resources, projection, or required transport
cannot be created, that component is unavailable. It MUST NOT automatically run
as `IN_PROCESS`, `NATIVE_PROCESS`, or `NATIVE_SERVICE`.

```text
TOTAL_MICROVM + MICROVM_ELIGIBLE
  -> microVM starts       -> run in MICROVM
  -> microVM cannot start -> component unavailable

NEVER: failed microVM -> native or in-process fallback
```

Total mode may sacrifice availability to preserve the requested boundary.
Failure of an optional launch need not shut down the machine; a boot- or
session-critical failure may block the session or enter explicitly labeled
diagnostic or recovery handling, never an alternate session.

Every component has one explainable Total-mode eligibility class:

- `MICROVM_ELIGIBLE`: the execution domain supports the standard microVM runtime
  and MUST use it whenever running an ordinary MRML OS workload;
- `HOST_SUBSTRATE_REQUIRED`: it must remain outside guests to instantiate,
  supervise, broker, or secure microVM execution, with a specific reason;
- `BOOT_ONLY`: it executes before the normal microVM substrate exists;
- `RECOVERY_ONLY`: it belongs to the independently repairable recovery
  environment and follows recovery policy;
- `UNSUPPORTED_BLOCKER`: ordinary userspace should be eligible, but the current
  implementation lacks an admitted microVM path.

Unsupported does not mean unsafe or untrusted. An unfinished Settings app or
service is an `UNSUPPORTED_BLOCKER`, not host substrate. Performance alone is
not a substrate reason. Every `HOST_SUBSTRATE_REQUIRED` classification is
reviewed as the architecture evolves. The substrate SHOULD be minimized,
memory-safe where practical, capability-limited, fuzzed, and inspectable.

Total mode stops at the minimal host substrate; it does not recursively place
the VMM inside another VMM. Its TCB still includes the relevant Gigakernel,
virtualization core, IOMMU/device isolation, minimum capability/resource/device
brokers, and microVM bootstrap path. Shared brokers are explicit common-mode
dependencies and expose narrow typed interfaces rather than ambient proxies.
A microVM boundary limits compromise propagation; it does not define or grant
authority.

In-process libraries admitted inside a guest remain inside that guest boundary.
Total does not mean one VM per crate, library, function, process, or thread. A
browser microVM may contain its exact in-process Zstd and Unicode providers; a
shared service may run in its own microVM. Approved multi-component guest groups
are explicit and inspectable. Each guest graph is exact and generational, with
private writable state and bounded RAM, vCPU, GPU, IPC, and device projections.

Package updates that change defaults, floors, supported forms, or microVM
transport are re-evaluated before generation activation. A required unsupported
component blocks Total readiness; an installed but unused optional blocker need
not prevent a current session, but it cannot launch natively under the Total
label. Provider substitution still requires exact interface compatibility,
admission, security policy, and generation binding.

## Settings, boot, recovery, and accessibility

The configuration service now implements the first bounded typed persistent
records for the single system Total MicroVM selection and a component's
inherited or explicit microVM request. Exact
setting READ/WRITE plus configuration-root CONTROL capabilities remain required;
records survive the authenticated checkpoint path, reject scope confusion and
noncanonical bytes, and grant no runtime authority. A revision-bound application
plan now repeats both exact setting READ checks immediately before translating
the records into the kernel `IsolationMode`, component placement request, and
admission-table policy generation. Capability revocation or any intervening
configuration commit invalidates the plan. A service-specific admission step
then checks the authenticated package bounds and class before constructing an
exact generational microVM specification. A stale policy, mismatched admission
table, unsupported class, or unavailable VMM prevents launch without falling
back. This is **PARTIALLY IMPLEMENTED** control-plane application, not a general
package resolver or proof of full-session readiness.

Settings and the object shell now have a shared **PARTIALLY IMPLEMENTED**
frontend contract rather than separate policy paths. One canonical 32-byte
`IsolationPolicyEdit` binds the exact setting ID, policy object, component/system
scope, native class, owner selection, and expected configuration revision. The
record carries no capability. Committing it still requires live configuration-
root `CONTROL` and exact setting-object `WRITE`; wrong-object authority, stale
revision, scope substitution, hidden bytes, and malformed native class fail
before mutation. The resulting revision is the policy generation consumed by
the existing application plan. Actual Settings widgets, object-shell text
parsing/rendering, and restart/reboot UI remain **PLANNED**. A shared read-only
`IsolationPolicySemanticView` is now **PARTIALLY IMPLEMENTED** for Settings,
shell, accessibility, automation, and authorized AI. It combines configured
system/component selections, authenticated package bounds and supported forms,
resolved placement/source or an explicit blocked state, and the kernel's
privacy-bounded aggregate status. Policy-generation or requested-mode drift
rejects the composition; the view contains no domain identity, capability, or
mutation/launch authority.

The first semantic frontend adapters are also **PARTIALLY IMPLEMENTED** in the
same service contract. `IsolationSettingsAction` maps an owner selection and
expected revision to the canonical edit without widget identity or privilege.
`IsolationShellCommand` accepts only `isolation show` or
`isolation set <selection> <expected-revision>` and cannot parse object IDs,
capabilities, providers, paths, or fallback instructions from text. Component/
system scope validation remains in the common edit constructor. A rendered
Settings application, a complete object-shell process and output formatter,
trusted semantic surfaces, and restart/reboot presentation remain **PLANNED**.

The planned Settings application and object shell project that one typed policy
service. They distinguish configured default, requested boot mode, effective
state, and policy generation; show floors, supported forms, blockers, overhead,
and restart/reboot requirements; and expose only Total MicroVM policy. Changes are
transactional, auditable, recoverable, capability-controlled, and semantically
available through keyboard, Braille, speech, automation, and authorized AI.
Configuration expresses desired policy; it does not prove current placement.

Focused Windows and Arch Linux runs each pass all 41 configuration-service
tests, including typed persistence, exact capability enforcement, canonical
decoding, scope separation, authenticated checkpoint recovery, reauthorization,
stale-plan rejection, native-class substitution denial, package-bound floor and
supported-form checks, no-fallback Total rejection, policy-generation handoff,
stale route rejection, shared Settings/shell edit round-trip, wrong-object and
stale-edit rejection, semantic-view generation/mode binding and blocked-state
projection, and proof that control-plane mismatches call no backend.
These are unit tests on hosted build targets, not boot, VMM, or physical-
hardware evidence.

The planned boot menu is `MRML`, `MRML Recovery`, and an independently
discovered `Windows Boot Manager` where applicable. `MRML` denotes Total
MicroVM; there is no mode picker. The signed loader still recognizes the
explicit Total token for compatibility with existing boot entries and shell
invocations. It cannot select weaker placement.

The one-boot request expires after that boot and cannot bypass Secure Boot,
package signatures, `SystemRelease` admission, anti-rollback, capabilities, or
mandatory floors. Selection proves only requested mode; runtime evidence proves
satisfaction. Virtualization or resource failure MUST NOT silently convert the
boot to any other operating mode. The owner may explicitly retry or enter
Recovery. Recovery remains a separate small audited environment and can repair
policy or VMM/runtime generations without depending on successful Total mode.

The common UEFI library now has a **PARTIALLY IMPLEMENTED** bounded parser for
this selector. It accepts only empty LoadOptions, the exact Total option, or an
exact `BOOTX64.EFI` shell program token followed by that option, and maps both
menu optional data and shell input to the same authority-free typed selection.
It rejects non-ASCII, oversized, embedded-NUL, ambiguous-whitespace, unknown,
and extra-token inputs. The real loader now bounds and validates the firmware
buffer before parsing, then places `TotalMicrovmOnce` in one new canonical
trusted-loader handoff flag. The kernel decoder exposes the typed request
separately from policy authority or effective-state proof; empty options carry
no override. One-boot base-policy composition is now **PARTIALLY IMPLEMENTED**
in the configuration control plane: an immutable applied persistent policy can
be combined with the typed `TotalMicrovmOnce` overlay to produce an explicit
effective policy for that boot without changing the stored selection or
policy generation. Incomplete or incompatible bounds fail before VMM
construction. WHP and nested KVM use a typed request and verify eligibility
and zero native fallback in their focused service fixtures.
The focused configuration suites pass 43 tests on Windows and Arch Linux; the
WHP runner passes 9 tests and the KVM runner passes 10.
A focused recovery path now **PARTIALLY IMPLEMENTS** the next connection. Only a
fully committed recovered system state may revalidate the exact system and
component settings, require the canonical decoded `BootHandoff` recovery epoch
to be the predecessor of the committed authority epoch, and compose its typed
overlay. The result retains the authority epoch, configuration revision, and
configuration-service generation as non-authorizing provenance. Its
`RecoveredTotalAdmission` now owns the activated release inventory and the only
admission table allowed to prepare its routes. Service preparation first proves
that the exact domain and class occur in that release, reapplies the recovered
effective policy and authenticated bounds, then reserves the same owned table;
an unclassified domain changes no launch state. A stale handoff epoch or
release/policy-generation mismatch fails. This passes within the 43-test
configuration suites on both hosts. Real early-boot orchestration still does not
deliver the live loader handoff and recovered state into complete installed-
generation admission. Menu presentation, live OVMF/EFI-Shell selection, that
runtime connection, and complete strict proof remain **PLANNED**; a decoded
request, focused recovery simulation, or hosted injection is not a successful
Total-mode boot or satisfaction claim.

Recovered preparation now also exposes a **PARTIALLY IMPLEMENTED** bounded
complete-set transaction. It requires exactly one binding per unique release
domain, so compatible packages may intentionally share one domain but callers
cannot omit a domain, add an unclassified domain, duplicate a domain, or change
its release class. Membership/class failures prepare nothing; a later route
failure cancels every earlier preparation in reverse before returning no set.
WHP and KVM recovered component paths consume this transaction. Windows
configuration tests pass 51/51 and WHP runner tests pass 12/12. A release-mode
WHP controlled probe reached recovered-policy acceptance but its retained
consumer/provider executable identities then failed closed as
`ArtifactSubstitution`; this is not complete component execution, KVM parity,
live boot, or Total satisfaction evidence.

The complete-set rollback path now has focused two-domain evidence. With an
authenticated two-package release, a policy-inadmissible second domain cancels
the already prepared first domain; the same sole admission owner can then
prepare both domains, and exact extraction/cancellation returns the set to a
live count of zero. Windows configuration tests pass 52/52. This constructs no
backend endpoint and does not promote service-loop or multi-domain execution
from **PLANNED**.

The service-image prerequisite now **PARTIALLY IMPLEMENTS** live selection of
the complete four-file stable root. The signed CPL3 block probe preserves its
configuration/authority recovery, then publishes and validates distinct
configuration, authority, deployment, and release objects through the same
capability-mediated block session. WHP completed 51 monotonic requests and
ordered cleanup with no native fallback claim. Placeholder deployment/release
contents are not authenticated or converted into runtime assignments, so this
does not yet connect the service loop to `BootTotalAdmission`, construct any
domain, or satisfy Total mode.

The common boot/recovery owner is now **PARTIALLY IMPLEMENTED** in both live
runners. `BootTotalAdmission` binds an effective Total policy directly to the
activated release, constructs an activated admission table retaining the exact
generation and catalog digests, prepares the classified route through that
same owner, retains it across vCPU/RAM/VMM construction, commits the microVM,
and finalizes the release proof without a parallel table. Recovery wraps this
same owner with committed recovery provenance. A shared hosted-only source now
exercises the normal exact-generation configuration-file read, owner-approved
authority checkpoint, boot-bound monotonic state comparison, dependent policy
validation, recovered service publication, and atomic release binding. Both the
authority-checkpoint file and configuration file must now come from the same
integrity-validated redundant-root graph. The handoff, authenticated monotonic
store, owner approval, reachable selections, and dependent validator exact-match
volume `51...51` and root generation 14. The resulting recovered policy retains
that exact volume/root provenance, and the runtime data plane opens only after
the generic recovery join rechecks it. Its
authenticated fixture state is independent of the handoff: accepted epoch 8
advances to authority epoch 9, while a decoded epoch-7 handoff fails before
authority reconstruction; root-generation substitution likewise fails. Fresh
WHP and nested-KVM signed probes consume the
resulting `RecoveredTotalAdmission`, each report one eligible microVM and zero
native fallback, and complete the same exact-generation component path. WHP
passes 11 runner tests, KVM passes 12, and configuration passes 45 on both
hosts. The in-memory source is controlled hosted evidence, not durable media,
owner-presence, TPM, firmware, physical rollback, or installed early-boot
orchestration; live recovered boot remains **PLANNED**.

That hosted transition now returns a `RecoveredInstalledTotalAdmission` rather
than discarding the installed-device selection after policy reconstruction. The
owner retains the exact serviced session/device descriptor, volume header,
active redundant-root slot, recovered volume/root generation, release, and
single admission table through route preparation and final proof. Construction
rechecks that the installed header, recovered graph, and committed policy name
the same volume and root generation. WHP and KVM retain this owner for the full
admission lifetime. This is **PARTIALLY IMPLEMENTED** controlled ownership
evidence; platform enumeration, durable hardware-backed recovery state, and
installed early-boot orchestration remain **PLANNED**.

The retained installed owner now also carries the exact opaque platform
identity, transport, controller generation, and media generation established at
block-service registration. Recovery enumeration requires that provenance and
fails before reading legacy registrations; final selection rechecks it against
the still-live capability-authorized session, so local device-number reuse or
media replacement cannot cross into Total admission. Removal revokes the old
session before a replacement generation can register. This is **PARTIALLY
IMPLEMENTED** hosted identity/lifetime evidence only; native platform discovery
and installed early boot remain **PLANNED**.

Stable-system selection is now a reusable **PARTIALLY IMPLEMENTED** boundary.
`SelectedStableSystemRecovery` accepts the configuration checkpoint and
authority checkpoint only when both are distinct objects selected from the
same integrity-validated volume/root generation. It carries no authority and
does not replace owner approval, rollback state, exact file capabilities, or
dependent validation. Focused tests reject a duplicate object and a checkpoint
from an older root before the recovery transaction. The hosted source now uses
this boundary; real block-device selection and installed boot remain
**PLANNED**.

The selection owner now **PARTIALLY IMPLEMENTS** the production-shaped metadata
connection. `recover_stable_system_selection` accepts the existing hostile
`RecoveryMetadataBackend` (including `BlockVolume`), selects one complete
redundant-root graph, verifies both required object identities, and returns a
`RecoveredStableSystemSelection` that owns the graph. Borrowed file selections
cannot outlive that owner. The hosted adapter uses this same entry point. No
real block device or installed boot was exercised, so those claims remain
**PLANNED**.

The controlled adapter now exercises the next **PARTIALLY IMPLEMENTED** device
boundary rather than preloading superblock slices. One exclusive `BlockVolume`
reads both full redundant-root blocks through `StorageBlockDevice`, validates
the selected graph through that same device generation, and remains owned beside
the selection. Failure to read either root returns no selection and opens no
Total admission. Storage passes 121 tests and configuration 45 on Windows and
Arch Linux; WHP passes 11 and KVM 12. The device remains an in-memory controlled
backend, so installed media and physical-device evidence remain **PLANNED**.

Capability-bound device admission is now **PARTIALLY IMPLEMENTED** as
`recover_serviced_stable_system_selection`. It validates the exact generational
`BlockService` session and principal before constructing `ServicedBlockDevice`
or issuing either root read. Wrong-principal and revoked-session tests observe
zero backend reads. Configuration passes 46 tests on Windows and Arch Linux;
WHP remains 11/11 and KVM 12/12. The shared hosted source now adopts this entry
point: it registers the controlled device, grants the exact recovery principal
a read-only session, and retains service, session, backend, volume, and selected
graph through authority recovery. Fresh signed WHP and nested-KVM probes each
reported recovery root 14, one eligible microVM, and zero native fallback.
The next installed-device control-plane gate is also **PARTIALLY IMPLEMENTED**.
`InstalledRecoveryDeviceSelection` authenticates that live session, then binds
its registered device identity and geometry to the expected volume identity,
volume geometry, and one exact redundant-root slot before recovery can issue a
data-plane read. Wrong owner, stale session, device/volume/geometry substitution,
and an invalid active root all fail with zero backend reads. The hosted recovery
source consumes this typed selection. This remains controlled in-memory evidence;
platform enumeration, physical media, and installed early-boot orchestration
remain **PLANNED**.

A bounded discovery join is now **PARTIALLY IMPLEMENTED** above that typed
selection. `InstalledRecoveryDeviceDiscovery` yields validated, non-authorizing
device/header candidates; the recovery control plane examines at most its
declared capacity, requires exactly one candidate for the expected volume, and
then joins that candidate to the independently live block session. Zero
capacity, inventory overflow, missing volume, duplicate matching volumes, and
session/device substitution fail closed. The shared hosted source exercises a
single controlled candidate. Configuration passes 47 tests on Windows and Arch
Linux, with WHP 11 and KVM 12; real platform enumeration remains **PLANNED**.

The controlled recovery source no longer constructs that candidate directly.
A fixed-capacity serviced inventory scans only caller-supplied live block
sessions, reauthenticates the principal and `READ` right, reads the canonical
volume header from block zero, and then feeds the unchanged unique-volume join.
Candidate bytes still grant no session or placement authority. Invalid headers
are ignored, while session, scratch, capacity, and transport uncertainty fail
the complete scan closed. Configuration passes 48 tests on Windows and Arch
Linux; WHP remains 11 and KVM 12. Hardware enumeration and installed boot remain
**PLANNED**.

The hosted path also enters its platform descriptor through the normal atomic
`BlockService` registration set. Duplicate identities, collision with a live
device, or insufficient registry capacity changes no slot. Registration remains
non-authorizing; only the later explicit principal-bound `READ` session permits
the header scan. Storage passes 122 tests on Windows and Arch Linux. This is
**PARTIALLY IMPLEMENTED** registration/control-plane evidence, not a native
AHCI/VirtIO driver or installed firmware handoff.

The explicit recovery grants after registration are also one atomic bounded
control-plane operation. Every device, principal, rights mask, and session slot
is preflighted before any handle becomes live, so a late failure cannot leave a
partially authorized discovery set. The hosted source uses a single read-only
`BlockSessionGrant`; registration metadata still cannot authorize discovery or
placement. Storage passes 123 tests on both development hosts.

The discovery-to-recovery lifetime is now one **PARTIALLY IMPLEMENTED** owning
operation. `discover_and_recover_serviced_stable_system_selection` selects and
authenticates the bounded candidate, performs both redundant-root and reachable-
graph reads through that exact serviced device, and returns a
`RecoveredInstalledStableSystemSelection` that retains the installed binding
beside the recovered `BlockVolume`. Callers cannot detach the selected graph
from a different reported candidate. The hosted test verifies the retained
device, volume, and root; native enumeration and early-boot transfer remain
**PLANNED**.

Fresh clean-tree hosted evidence now covers that owner through the existing
component lifecycle. A detached build of commit `70e2e74d` generated a new
component-service kernel, ZIM consumer, Zstd provider, canonical 201-byte
generation, 207-byte interface catalog, 225-byte runtime inventory, and one
99,369-byte v2 SystemRelease using one-use Lamport roots. The identical artifacts
reported recovered root 14, one eligible microVM, zero native fallback, and
Total satisfied before completing the expected component data path and cleanup
on both WHP and nested KVM. The kernel package SHA-256 was
`60221162f6fe17540a4ade07a2e5ae02db1446a790a2fa52d5ab7f9f9abc49fa`; the
SystemRelease SHA-256 was
`9d74c677ba083276fc337c65adf90d664ec1466164089487030b8f5e00398394`.
This is hosted controlled evidence, not native enumeration, installed boot,
host-resistant isolation, or physical-hardware evidence.

The runner-side boot overlay is no longer injected as an independent enum
literal. Both hosted backends encode neutral accepted recovery state and the
one-boot request into the same canonical handoff installed for the guest, decode
that object, and compose policy only from `BootHandoff::isolation_override()`.
Absent recovery metadata or an absent decoded Total request rejects the focused
Total path before admission. Focused WHP/KVM tests cover the accepted and
missing-override cases. Retained older signed artifacts did not complete guest
execution and were not counted as evidence. Fresh one-use-signed current-source
kernel packages then completed the identical decoded-policy, zero-fallback, and
guest lifecycle/data path on WHP and nested KVM. Stable recovered-state binding
is still required before claiming live recovered Total mode.

At real kernel entry, `EarlyKernelContext` now retains that decoded isolation
request together with the exact recovery epoch/root and installed identity/typed
SATA route. A UEFI installed identity without the adjacent route fails before
profile work. The fields are non-authorizing and cannot replace native discovery
or authenticated recovery. Windows passes 565 kernel tests and the standard
UEFI image cross-builds; live installed Total orchestration remains **PLANNED**.
Recovered configuration now consumes this first-entry owner directly for one
focused installed Total path: it validates the retained installed identity,
revalidates committed policy from the retained recovery epoch/override, builds
the authenticated release inventory, commits the microVM route, and seals the
runtime without accepting a replacement `BootHandoff`. Configuration passes 51
tests and the WHP runner cross-builds on Windows. Real early-boot service wiring
and complete domain enumeration remain **PLANNED**.

The real service-delivery boundary now **PARTIALLY IMPLEMENTS** the next step.
One versioned 280-byte canonical envelope carries the retained recovery state,
optional installed identity, required UEFI SATA route, and one-boot Total request
through the existing exact-task, exact-object, `READ`-only, one-use syscall.
Unknown flags, hidden absent-section bytes, root/volume mismatch, route/source or
stable-ID substitution, replay, wrong task, and copy uncertainty fail closed.
The service image decodes the same envelope and uses its recovery subsection for
the existing storage path. Receiver-to-configuration-sender IPC now carries and
redecodes the complete envelope rather than reducing it to recovery scalars;
the sender derives monotonic recovery input only after that decode. Kernel
passes 566 tests; configuration passes 51;
service image, component-profile UEFI image, and WHP runner cross-build on
Windows. Service-side consumption of the installed/Total subsections and KVM execution for this
increment remain **PLANNED**.

The configuration service API now **PARTIALLY IMPLEMENTS** that consumption
boundary. A delivered `BootRecoveryEnvelope` can enter the same private
recovered-policy and installed-selection transaction used by the first-entry
owner; it revalidates capabilities and monotonic recovery, exact installed
identity/route, authenticated release inventory, route commitment, and final
runtime authorization. `DeliveredRecoveredSystemState` now consumes committed
recovery and retains the exact one-use envelope beside it; stale recovery is
rejected before settings or release construction, and later admission no longer
accepts a detached replacement envelope. The stable-recovery test delivers the
full installed/Total record through the capability-scoped byte path and retains
that same decoded record through the controlled join. Configuration passes 51
tests, kernel passes 566, service image builds, and the
WHP runner passes 12 focused tests on Windows. Invocation by the real service
executable with installed media, complete domain enumeration, and KVM parity for
this increment remain **PLANNED**.

Committed recovery now exposes one atomic release-binding operation rather than
requiring callers to retain an intermediate effective policy.
`bind_total_boot_admission` revalidates both capabilities and settings, checks
the decoded handoff epoch against the committed authority epoch, and returns the
same `RecoveredTotalAdmission` owner used for route preparation and final proof.
Its builder form keeps the recovered effective policy private and supplies only
the recovered policy generation to the authenticated release-inventory builder;
builder failure publishes neither an admission table nor a detached policy.
The stable recovery test commits one eligible microVM route and finalizes its
signed release inventory through that owner on Windows and Arch Linux. The
hosted WHP/KVM component path now constructs that recovered owner through the
shared controlled source and retains it through preparation, microVM commit,
and final proof. Component mode now retains only non-authorizing package bounds
and identity before that join; it no longer constructs a parallel transient
configuration or effective policy. Production stable-storage selection and
installed early-boot construction remain **PLANNED**.

## Resources, devices, security, and monitoring

RAM, vCPU, `VirtualGPU`, VirtIO, device-projection, or VMM exhaustion in Total
mode makes the affected component unavailable and reports the exact shortage.
Power/thermal policy MAY throttle or stop workloads but MUST NOT weaken their
placement. Network, file-portal, GPU, accessibility-bridge, or other projection
failure never justifies native fallback.

Every microVM receives only explicitly projected files, network, GPU, input,
audio, devices, secrets, IPC, and resources. VirtualGPU/brokered devices are the
normal path, not broad raw-device fallback. Capabilities remain separately
attenuated and revocable. Hosted WHP/KVM cannot protect a guest from its host;
QEMU, hosted WHP/KVM, nested virtualization, and physical Intel/AMD evidence are
distinct. MicroVM isolation does not eliminate shared-hardware side channels or
common-mode VMM, broker, scheduler, GPU, or device failures.

The kernel now has a **PARTIALLY IMPLEMENTED** pre-construction projection
gate. A linear `MicrovmProjectionPlan` binds one nonzero domain plus exact route
system/policy generations to an exact committed guest-RAM reservation, a live
same-domain vCPU reservation with the required parallelism, and the exact set of
required interface, `VirtualGPU`, network, file-portal, input, audio, device,
secret-operation, and IPC projections. Every descriptor retains a nonzero
generation and must reauthorize its exact object and rights. Missing, duplicate,
unexpected, stale, attenuated, wrong-object, RAM-size, vCPU-domain, and vCPU-count
cases fail before any backend allocation phase and map to `MEMORY_BUDGET`,
`VCPU_BUDGET`, `VIRTUAL_GPU`, `DEVICE_PROJECTION`, or `INTERFACE_TRANSPORT`.
Validation failure returns the exact unpublished RAM and vCPU reservations for
explicit cleanup or retry; it never selects native placement. Application
requirements can be derived only from a `MICROVM` route and retain that route's
domain and system/policy generations. The WHP and KVM application factories now
consume this boundary: they create the route and reserve exact guest RAM, one
same-domain vCPU, and interface-transport authority before native guest
construction. After construction and resource attachment, the one-use
`activate_data_plane` transition seals the immutable projection; after native
guest destruction, retirement revokes the projected capability and releases
the exact RAM and vCPU reservations. No per-message policy lookup or native
fallback is added to the data plane. General service integration,
device-specific lifecycle proofs, and physical isolation remain **PLANNED**.

```text
Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

The Engineering Constitution reviews are satisfied for this bounded gate:
owner-selected policy remains bounded only by mandatory floors, no publisher or
provider authority is added, and hostile stale/wrong/attenuated capabilities,
generation/resource mismatch, duplication, omission, and unexpected projection
all fail before backend mutation. Independent human review remains required.

The kernel's **PARTIALLY IMPLEMENTED** aggregate monitor projection reads the
authoritative admission table rather than configuration files. A caller must
hold `INSPECT` for one exact monitor object. The immutable snapshot exposes the
system/policy generations, requested mode, effective Total satisfaction,
running class counts, each explicit host-substrate reason, unavailable-reason
counts, and native-fallback count without domain identities or mutation
authority. Wrong-object, attenuated, and stale capabilities disclose nothing.
Windows and Arch Linux each pass the same focused kernel tests. Per-domain
requested/effective placement, event delivery, resource cost, GUI, shell, and
semantic accessibility projection remain **PLANNED**.

The complete monitor reports requested mode, effective status, eligibility,
placement and policy generation, substrate reasons, active/required blockers,
unavailable domains, resource costs, and native-fallback count. Findings include
`MICROVM_REQUIRED_BUT_UNAVAILABLE` and `TOTAL_MICROVM_DOWNGRADE_ATTEMPT`; neither
triggers a native launch. Conceptual successful evidence is:

```text
requested_mode = TOTAL_MICROVM
effective_status = SATISFIED
running_microvm_eligible = N
running_in_microvm = N
unsupported_blocker_required = 0
native_fallback = 0
```

Installed-but-idle applications do not count as running domains. Every running
`HOST_SUBSTRATE_REQUIRED`, `BOOT_ONLY`, and `RECOVERY_ONLY` exception is
enumerated and justified. A request with an eligible native execution or active
required blocker is `TOTAL_MICROVM_NOT_SATISFIED`, even if selected by the boot
menu, Settings, EFI Shell, or an intentional developer override. Monitor and
shell expose typed structured state without revealing unrelated content or
secrets.

## Implementation order and acceptance

Documentation is not implementation evidence. Implement bounded milestones:

1. policy/object schema, validation, workspace retention, lock output, and
   bounded kernel launch admission/reporting (**PARTIALLY IMPLEMENTED**);
2. one representative microVM service (**PARTIALLY IMPLEMENTED** for signed
   hosted WHP/KVM probes; general runtime delivery remains open);
3. one representative microVM GUI application (**PARTIALLY IMPLEMENTED** for
   signed WHP/KVM CPL3 lifecycle and one-service compositor capture; end-to-end
   surface transport, Semantic Scene Graph integration, and presentation remain
   **PLANNED**);
4. monitor placement visibility (**PARTIALLY IMPLEMENTED** for the
   capability-scoped aggregate kernel snapshot; per-domain/service/UI projections
   remain **PLANNED**);
5. resource and device projections (**PARTIALLY IMPLEMENTED** for the linear
   kernel plan and its live WHP/KVM application consumption/retirement;
   device-specific and broader service/application integration remain
   **PLANNED**);
6. persistent Settings and shell policy;
7. strict Total runtime enforcement;
8. bootloader and EFI Shell selectors;
9. required-system Total readiness and broader application compatibility;
10. recovery, adversarial, performance, and physical-hardware evidence.

The representative GUI lifecycle evidence used fresh one-time Lamport keys and
one identical release artifact set on 2026-08-26. Windows and Arch Linux built
the same application PE with SHA-256
`711fd41e67b1dbb5fad07ae573de35f328b33bec9e016819b24623245475da5f`.
The exact build and execution shape was:

```text
mrml build org.mrml.app.gui-probe --target native --release
mrml build org.mrml.system.bootloader --target uefi-x86_64 --release --feature-profile application_probe --compile-env MRML_APPLICATION_MIN_VERSION=1 --compile-env MRML_APPLICATION_ROOT_DIGEST_HEX=<fresh-application-public-key-digest>
mrml-sign sign-bundle application 1 mrml-gui-probe.efi application.private application.signed
mrml-sign sign-bundle kernel 1 mrml-kernel-pe.efi kernel.private kernel.signed
mrml package create org.mrml.system.kernel kernel 1 x86_64 kernel kernel.signed kernel.mrp --private-key package.private
mrml-whp-run.exe kernel.mrp package.public kernel.public 1 gui-application-probe application.signed application.public 1
mrml-kvm-run kernel.mrp package.public kernel.public 1 gui-application-probe application.signed application.public 1
```

WHP reported `verify=17783us`, `prepare=3858us`, `execute=3843us`,
`total=47794us`; nested KVM reported `verify=21682us`, `prepare=2797us`,
`execute=1268us`, `total=104755us`. Both observed the six ordered signed-kernel
stages, authenticated CPL3 exit, Total-mode satisfaction with no native
fallback, and confirmed teardown. These are hosted controlled probes, not
host-resistant isolation, an in-guest GUI call, bare metal, or physical evidence.

Acceptance includes contradictory-manifest rejection, floor enforcement,
authorized Total policy, exact-generation interface
behavior across supported forms, revocation/restart, resource exhaustion,
stale-policy rejection, boot-token parsing, recovery, and backend parity. Total
MicroVM remains **PLANNED** until a tested configuration proves every running
eligible domain is in a microVM, zero active required blockers, zero native
fallback, and an enumerated justified host/boot/recovery substrate.

## Total MicroVM invariants

Strict runtime finalization is now **PARTIALLY IMPLEMENTED** in the kernel. A
fixed-capacity `TotalMicrovmInventory` is bound to one exact system and policy
generation. Every running or retained-unavailable domain must have one exact
domain/class entry; duplicate, unknown, or class-substituted entries fail.
Entries explicitly state whether the domain must be running. Finalization
produces a `TotalMicrovmRuntimeProof` only when every required domain is live,
every live eligible domain is in a microVM, every active substrate/boot/recovery
exception is classified, no unsupported blocker runs, and native fallback is
zero. A required unavailable component is failure, not permission to omit or
launch it natively. Windows and Arch Linux each pass 555 kernel tests. The WHP
and KVM component runners now authenticate and construct one release-derived
colocated ZIM/Zstd inventory before CPU, RAM, or VMM guest construction. They
retain that immutable inventory across construction, then finalize it only
after exact Total microVM admission and before guest execution. Fresh signed
probes on 2026-08-26 emitted the same generation-bound proof with
`classified=1`, `eligible=1`, `microvm=1`, and `native_fallback=0`. The kernel
returns that result as `ReleaseTotalMicrovmInventory`, a private-field wrapper
that safe code cannot construct from ad hoc domain records. It retains the
authenticated signer, system generation, canonical generation digest,
interface-catalog digest, and policy generation. The wrapper must be consumed
into `ActivatedReleaseTotalMicrovmInventory` by matching all three activated
generation fields; a matching numeric generation with either substituted
digest fails. Recovered policy accepts only this activated wrapper when it
creates the admission table, and non-Total or policy-generation mismatch also
fails. Both focused runners perform this join before CPU, RAM, or VMM guest
construction. The recovered v3 deployment checkpoint now also retains the
authenticated SystemRelease content digest, selected signer identity, and
runtime-inventory digest. Kernel binding compares all three with the freshly
parsed release; a legacy generation-only checkpoint, v1 release without runtime
inventory, or substitution of any release/generation/catalog identity fails
before construction. Complete installed-system enumeration and live boot
consumption remain **PLANNED**, so this focused component evidence does not
promote Total mode itself.

Fresh controlled runtime evidence on 2026-08-26 now completes the co-located
component path on both WHP and KVM using one identical signed kernel,
consumer/provider pair, and SystemRelease. Register diagnostics proved the
former first-exit double fault was a 296-byte early-stack underflow. The shared
loader/kernel/backend layout now supplies 32 early pages within a 64-page
guarded privilege arena, while retaining the independent entry and double-fault
stacks. The Zstd provider enters at its own exact verified PE entry; no filename,
path search, or combined-image offset selects it. Both backends reported one
eligible domain in one microVM, zero native fallback, exact-generation ZIM/Zstd
completion, lifecycle cleanup, and terminal halt. This is hosted controlled
single-domain evidence, not complete required-system enumeration or physical
host-resistant isolation.

The focused runners now provide only complete policy-selected package-to-domain
assignments. The authenticated release supplies each package's runtime class
and descriptive exception reason; omission, identity substitution, duplicate
assignment, and attaching a typed host-substrate reason to a non-substrate
record fail before construction. Host-substrate enum selection remains explicit
architectural policy because descriptive release text cannot select a kernel
value. Their fixed-capacity assignment plan enumerates the exact activated
release membership, rejects unknown, duplicate, omitted, and excess members,
and yields an activated inventory only when complete. Assignments and metadata
remain non-authorizing: the normal control plane establishes each domain's
capabilities and resources before its established data plane can take the
shortest safe path. The policy callback now receives each full authenticated
runtime record and commits no assignments unless every decision succeeds with
the same package identity. Both focused runners therefore enumerate the signed
release instead of naming ZIM/Zstd themselves. General per-package owner-policy
lookup, distinct-domain construction, and boot orchestration remain
**PLANNED**.

The deployment control plane now starts that enumeration from its own
capability-authorized active release. `begin_runtime_assignment` requires exact
deployment `READ` authority, derives signer and activated identity from the
service's retained `ActivatedSystemRelease`, and accepts only canonical release
bytes matching that identity. A caller cannot pair arbitrary bytes with a
detached active identity. The resulting plan remains non-authorizing and still
requires complete policy assignment and later route admission. Deployment
passes 6 tests on Windows; live recovered-file selection, complete policy
lookup, and live boot launch remain **PLANNED**.

Installed-storage retrieval is now **PARTIALLY IMPLEMENTED** at the typed
deployment/storage boundary. Deployment inspection is authorized before I/O;
the file object and immutable generation must exactly match the active
SystemRelease source, and verified file reads fill a bounded caller-owned image
in chunks before the existing assignment plan parses it. Source, authority,
length, read, signer, content, generation, catalog, or runtime-inventory
substitution fails before policy enumeration. This grants no storage or launch
authority beyond the supplied capabilities. The real service must still invoke
this path, and general policy must still assign and launch every domain.

The authenticated deployment checkpoint and active release-file read now form
one retained `RecoveredRuntimeAssignment`. Rollback-resistant recovery produces
the exact active deployment owner, and that owner immediately selects and reads
its source before returning the assignment plan. The retained owner also carries
the authenticated recovery epoch, selected generation, checkpoint file
object/generation, and checkpoint digest, so callers cannot interpose a detached
active identity or silently discard the evidence needed for the later
configuration/deployment join. Controlled Windows evidence covers both
authorized files and the signed release. Real service invocation, owner-policy
lookup, and complete domain launch remain **PLANNED**.

General recovered owner-policy assignment is now **PARTIALLY IMPLEMENTED**.
`RecoveredSystemState::assign_runtime_domains` requires the recovered
configuration revision to equal the assignment plan's policy generation and
requires exactly one component-scoped, capability-readable persisted isolation
setting for every package enumerated from the authenticated active release.
Missing, duplicate, stale, revoked, wrongly scoped, or package-substituted
bindings publish no partial assignment. The setting object's identity becomes
the non-authorizing runtime-domain identity; it grants no capability, resource,
route, or launch authority. The kernel's fixed-capacity policy transaction also
leaves the plan empty when an external policy read fails after earlier
decisions. Windows passes 566 kernel tests and 51 configuration tests. Real
service invocation, distinct-domain construction, complete route admission,
and whole-system WHP/KVM execution remain **PLANNED**.

The production-shaped delivered path now composes those steps in one
**PARTIALLY IMPLEMENTED** transaction.
`build_assigned_installed_total_boot_admission` validates the installed recovery
identity from the retained one-use envelope, composes the capability-revalidated
effective Total policy, requires the assignment plan to carry that exact policy
generation, assigns every authenticated release package, seals the activated
inventory, and constructs its sole admission table. It accepts no detached
release-builder callback. Any installed, policy, assignment, signer, release,
or inventory failure returns no admission owner. The focused Windows
configuration suite remains 51 passing tests and continues through exact
microVM route commitment and strict runtime authorization. Real service-loop
invocation and multi-domain WHP/KVM execution remain **PLANNED**.

Configuration and deployment now share a **PARTIALLY IMPLEMENTED** retained
control-plane owner. The recovered assignment can seal only into an activated
inventory that still owns its authenticated deployment recovery evidence;
configuration consumes that inventory and retains the deployment owner beside
its delivered configuration owner and the only installed Total admission table.
This join does not grant capabilities or prove execution. Deployment passes 6
tests and configuration 51 tests on Windows. Service-loop invocation, distinct
domain construction/cleanup, and complete WHP/KVM execution remain **PLANNED**.

The shared hosted recovery probe and both backend runners now
**PARTIALLY IMPLEMENT** the retained cross-service owner rather than minting a
release inventory in a runner callback. The probe independently authenticates
the configuration checkpoint and a separate deployment recovery state, reads
the exact activated SystemRelease through its immutable file generation,
capability-assigns every package, and returns the joined configuration,
deployment, installed-recovery, and admission owner. WHP/KVM retain that owner
through route commitment and strict runtime authorization. Substituted release
bytes and stale recovery roots fail before publication. WHP passes 12 runner
tests on Windows. KVM source uses the identical path, but its Linux build is
unavailable here because `cross_host_rust_target` is absent. The probe remains
controlled hosted evidence, not production service-loop or full-system proof.

The hosted recovery prerequisite now also has a separate fail-closed
distinct-domain path for an exact two-member authenticated release. Recovery
persists two independently capability-readable component policies, assigns the
configuration and deployment packages to different non-authorizing domain
identities, and rejects shared or unexpected domain membership before returning
the joined control-plane owner. With neither route committed, runtime
authorization returns `RequiredDomainMissing`. Configuration passes 53 tests on
Windows and Arch Linux; the unchanged live runners pass 12 WHP and 13 KVM tests.
Neither runner invokes this distinct path yet: constructing endpoints for,
atomically committing, executing, and retiring both domain routes through their
admitted backend boundaries remains **PLANNED**, so prior single-domain evidence
does not prove complete-system Total isolation.

Complete unique-domain publication now has a **PARTIALLY IMPLEMENTED** generic
control-plane transaction. Only after every backend endpoint exists does it
exact-match the endpoint set to every prepared microVM domain, reject missing,
additional, or duplicate bindings before publication, and commit the routes.
If a later commit fails, earlier running domains retire in reverse and every
endpoint is returned for backend teardown; validation failure cancels all
prepared routes. Focused two-domain configuration evidence proves successful
strict finalization and duplicate-binding rollback on Windows and Arch Linux.
WHP/KVM endpoint construction and live use of this transaction remain
**PLANNED**.

The existing single-domain component runner now **PARTIALLY IMPLEMENTS** that
live transaction on both backends. After artifact verification and guest
construction, the transformed prepared route is restored only into its retained
complete membership slot; the runner atomically exact-matches and publishes the
constructed endpoint, authorizes runtime only after commit, and then recovers
the same endpoint into the configuration launcher. Provider execution uses the
exact PE entry of the provider's own verified image rather than an offset from
the consumer image, so distinct executable layouts are not conflated. Focused
configuration tests pass 53 on Windows and Arch Linux, WHP passes 12 tests and
KVM 13, and both runner release builds pass. A freshly signed WHP probe reached
authenticated recovery and emitted `classified=1`, `eligible=1`, `microvm=1`,
`native_fallback=0` only after atomic endpoint publication. Register evidence
localized the former first-exit double fault to an early-stack underflow; the
shared contract now maps 32 early-stack pages inside a 64-page guarded privilege
arena. One identical fresh signed artifact set completed exact-generation
component execution, cleanup, and terminal halt on both WHP and KVM. The
separate two-domain complete-system path remains **PLANNED**, so this evidence
does not establish whole-system Total satisfaction.

Complete-set backend construction now has a **PARTIALLY IMPLEMENTED**
failure-safe control-plane boundary. It constructs endpoints in exact retained
domain order before publication. A late constructor failure returns every
earlier endpoint to the backend owner for explicit teardown, cancels all routes
still owned by the prepared set in reverse, publishes no running domain, and
permits an immediate exact-owner retry. Focused configuration evidence exercises
failure on the second of two domains followed by successful construction,
atomic commit, strict Total finalization with two microVMs, endpoint return, and
retirement. Actual construction and execution of two distinct WHP/KVM guests
remain **PLANNED**.

Both live single-domain runners now transfer their already-created provisional
guest through this same constructor transaction before atomic publication. The
constructor rechecks the exact prepared service specification and is one-use;
identity drift or a second construction request cancels the retained route and
publishes nothing. This closes backend/control-plane API parity but is not
evidence that two distinct guests were constructed.

The next data-plane prerequisite now has a **PARTIALLY IMPLEMENTED** kernel
reservation. One accounted shared page is bound to two distinct target objects
and exact target capability generations before either backend maps it. Both
views are read/write and non-executable; target rights are exact and the shared
object grants no placement, interface, or execution authority. Failure while
reserving the second mapping rolls back the first reservation and object charge.
WHP/KVM native one-page backing and exact GPA map/unmap are now **PARTIALLY
IMPLEMENTED**. Nested KVM proved byte visibility through one backing page mapped
into two distinct live VMs and exact native retirement. The current nested WHP
host returns typed `PartitionAlreadyExists` for the second partition; strict
Total treats placement as unavailable and never reuses one partition for both
domains. WHP source/API parity is not two-partition evidence. Guest page-table
projection, queue protocol, and component execution remain **PLANNED**.

A one-page generation-bound request/response wire is now **PARTIALLY
IMPLEMENTED** over the exact peer projection. It binds interface/provider/system/
policy/binding generations, exact projection authority, operation, length, and
monotonic sequence while transferring no capabilities. Nested KVM proves a
bounded request and response across two live VM mappings. Each published request
now returns a typed notification bound to the same complete identity, operation,
and sequence; the provider must consume that exact notification before reading,
and its response produces the corresponding typed notification required by the
consumer. Cross-binding, stale-sequence, and wrong-operation notifications fail
before payload consumption. Release fences precede request, response, and idle
state publication; matching acquire fences follow observation before metadata or
payload consumption. Native interrupt/event delivery, a race-tested atomic
shared-state representation, and signed component execution remain **PLANNED**.

The backend-neutral queue notification route is now **PARTIALLY IMPLEMENTED**
through the existing VM interrupt authority. Request and response directions
retain separate one-token pending latches bound to the exact queue identity, VM,
vCPU, allowlisted vector, and interrupt object. Publication requires the next
sequence, replay and cross-binding fail closed, and only confirmed
capability-authorized injection clears the token. Policy denial retains it;
backend uncertainty retains it and fails the VM. Live delivery into the two
component guests and guest interrupt handling remain **PLANNED**.

The exact guest page-table leaf is now **PARTIALLY IMPLEMENTED** on both
backends. The retained owner installs one supervisor RW/NX leaf in each stopped
guest, verifies the exact physical translation, and reloads each exact root.
Retirement removes and verifies both leaves before either GPA mapping. A late
leaf conflict rolls back both provisional native mappings and supports immediate
retry. This does not yet provide the bounded queue or component execution.

The matching policy-ledger teardown is now **PARTIALLY IMPLEMENTED**. It accepts
the retained two-peer projection only after native teardown, revalidates both
exact target capability generations and mapping shapes, refuses unexpected
additional aliases, and atomically retires both mapping generations, the shared
object, its capability, and pool charges. Validation failure returns the whole
retained projection for exact retry and makes no partial accounting mutation.
Both backends now exact-match and remove borrowed GPA mappings before permitting
policy-ledger retirement. A failed native unmap poisons the backend and retains
the owner for retry; destructor uncertainty leaks rather than freeing a possibly
mapped page. Guest translation teardown and end-to-end queue retirement remain.

The installed production prerequisite now has a **PARTIALLY IMPLEMENTED**
four-file stable-root selection. Configuration, authority checkpoint,
deployment checkpoint, and activated SystemRelease must be distinct reachable
files from one exact integrity-validated volume/root generation. Their names
identify; the retained graph and selections grant no read or placement
authority. Focused tests accept the exact set and reject a duplicate object or
prior-root member. Configuration remains 51 passing tests on Windows. The real
serviced-volume adapter now reads both redundant roots through one exact
installed session and retains that data plane beside the four-file owner.
`recover_selected_runtime_assignment` now lends only the deployment checkpoint
and SystemRelease from that owner into deployment recovery while independently
requiring both file capabilities. The hosted evidence retains checkpoint object
11/generation 2 and an activated source at object 12/generation 2 from the same
root; the former detached objects 40/41 no longer exist in this path. Windows
passes 51 configuration, 6 deployment, and 12 WHP runner tests. KVM uses the
same source, but its Linux cross-build remains unavailable here because
`cross_host_rust_target` is absent. Service-loop control-plane construction
remains **PLANNED**.

Complete distinct-domain finalization now has focused **PARTIALLY IMPLEMENTED**
kernel evidence. A signed two-package fixture assigns both must-run packages to
different domains and binds the exact activated generation to one Total
admission table. Finalization returns `RequiredDomainMissing` after only the
first microVM route commits and succeeds only after the second route commits,
with two classified eligible domains, two running microVMs, and zero native
fallback. The Windows kernel suite passes 567 tests. This is an in-memory
control-plane test, not WHP/KVM guest construction, cleanup, service-loop, or
physical evidence.

Its canonical package-to-runtime classification prerequisite is now
**PARTIALLY IMPLEMENTED** as the allocation-free `MRMLRI1` runtime-inventory
catalog. Every strictly ordered record binds package identity, version, artifact
digest, Total class, must-run state, preferred/minimum/maximum placement,
supported forms, and the explicit reason required for every non-eligible
exception. A catalog is accepted only when its generation, count, and every
identity/version/digest exactly match the complete canonical `MRMLSG2` object;
subsets and detached substitutions fail. Windows and Linux package-format
suites each pass 16 tests. Manifest V2 now accepts explicit `runtime_class` and
`must_run` fields, requires a reason for every non-eligible class, forbids a
reason for eligible work, and requires eligible work to support `MICROVM`.
The public frontend derives `MRMLRI1` only from those manifests and the exact
canonical generation; unclassified members fail closed. Windows and Arch Linux
each pass 99 build-tool tests. General SystemRelease v2 now signs and verifies
that exact inventory beside `MRMLSG2` and `MRMLIC1`; v1 remains parseable for
compatibility but carries no inventory. A v1 release must never be treated as
Total-ready merely because it is otherwise valid. The kernel now constructs its
fixed-capacity `TotalMicrovmInventory` only from an authenticated v2 release and
an exact package-to-live-domain binding supplied by the normal launch control
plane. Signer, count, package, domain, class, and exception-reason substitution
fail closed; metadata grants no domain authority. The authenticated result is a
non-forgeable typed wrapper rather than a public mutable inventory. The strict
runtime finalizer's resulting proof is now also opaque outside its kernel
module: callers inspect generation-bound counts through accessors and cannot
construct a substitute proof with public fields. It is non-copyable and remains
owned by the immutable installed runtime beside the recovered device, policy,
release, and admission table; diagnostics receive only a shared borrow. Kernel
raw inventory construction/finalization is now kernel-private, so external
hosted launchers cannot mint strict-system proofs from ad hoc domain records.
The standalone GUI probe reports only `scope=single-application`; only an exact
authenticated release inventory can enter strict-system finalization. Kernel
passes 564 tests and
configuration passes 51 tests on Windows; the WHP runner cross-builds with the
opaque proof API. Complete admitted-system runtime proof remains **PLANNED**
because live installed orchestration and complete domain enumeration are not
yet connected.

```text
Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

1. Every running `MICROVM_ELIGIBLE` domain MUST execute within an admitted
   microVM boundary.
2. Failure to create that boundary MUST leave the workload unavailable; neither
   automatic nor owner-selected native fallback is an MRML OS mode.
3. Required non-microVM components MUST have explicit classification and
   architectural justification; unsupported userspace cannot masquerade as host
   substrate.
4. Resource pressure MAY reduce availability but MUST NOT silently weaken
   placement.
5. Capabilities remain the authority mechanism regardless of placement.
6. Requested Total mode is satisfied only when effective runtime state meets
   these invariants.

Patent review: **TRIGGERED**. Adaptive placement selection, interface transport,
whole-system isolation policy, and boot-time policy composition require targeted
Canadian claim review before implementation. See
[the patent review log](patents/REVIEW_LOG.md); this is technical screening, not
legal advice or a clearance conclusion.

Installed recovery now has a **PARTIALLY IMPLEMENTED** fail-closed join into the
same Total admission owner. Before release construction, recovered configuration
exact-matches the live installed selection's stable identity, controller/media
generations, geometry, volume, and root to the decoded boot handoff; UEFI sources
must also carry the adjacent typed SATA route. Missing or substituted state
cannot invoke the release builder, and successful admission retains that exact
selection beside the only release-derived admission table through final runtime
proof. This is controlled Windows/Arch unit evidence plus WHP/KVM regression,
not installed native execution or physical isolation evidence.

The completed installed admission is now consumed into a **PARTIALLY
IMPLEMENTED** read-only runtime authorization before component guest execution.
The seal retains the exact installed selection, recovered policy, authenticated
release inventory, completed admission table, and runtime proof as one object;
it exposes inspection but no further route preparation or admission mutation.
Required-domain absence produces no runtime owner. WHP and KVM component paths
retain the seal across execution, so a detached scalar proof cannot replace the
control-plane owner. Current evidence is Windows/Arch configuration unit tests
plus fresh signed hosted execution on WHP and nested KVM. The SMP handoff retains
the exact installed source identity, policy, and one-boot override, while the
VMM control plane establishes one supervisor-only RW/NX page-table arena before
the running data path and does not remap its pages. Both backends reported
`eligible=1`, `microvm=1`, and `native_fallback=0`. This does not establish
native installed-media, host-resistant, or physical execution, so Total mode
remains **PLANNED** end to end.
