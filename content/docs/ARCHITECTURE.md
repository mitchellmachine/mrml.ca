# MRML operating-system architecture

This is the durable architectural overview. Detailed implementation history and
probe evidence remain in [GIGAKERNEL.md](GIGAKERNEL.md); security boundaries
are normative in [SECURITY.md](SECURITY.md); dependency order is in
[ROADMAP.md](ROADMAP.md); the application contract is in
[APPLICATION_PLATFORM.md](APPLICATION_PLATFORM.md); context-loss recovery is in
[RECOVERY.md](RECOVERY.md); compiler direction is in
[COMPILER.md](COMPILER.md). The normative cross-cutting engineering and
complexity rules are in
[ENGINEERING_CONSTITUTION.md](ENGINEERING_CONSTITUTION.md).
The native cross-vendor GPU object/security model, VirtualGPU priority, and
physical-driver strategy are canonical under [gpu/](gpu/GPU_ARCHITECTURE.md).
Quantitative RAM allocation, ownership, mapping, sharing, pinning, guest-memory,
and accounting rules are canonical in
[memory/MEMORY_RESOURCE_MODEL.md](memory/MEMORY_RESOURCE_MODEL.md).
The browser's canonical accessibility/AI semantic interface, no-JIT script/Wasm
rules, origin model, and media boundary are in
[BROWSER_SEMANTICS.md](BROWSER_SEMANTICS.md).
The reusable VMM queue, lifecycle, transport, capability-backend, host-share,
and accessibility-emulation rules are canonical in
[PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md).

## Status vocabulary

- **IMPLEMENTED**: repository code and focused tests exist. This does not imply
  production readiness, physical-hardware validation, or independent review.
- **PARTIALLY IMPLEMENTED**: useful pieces exist but the named end-to-end
  property or integration is incomplete.
- **EXPERIMENTAL**: executable research or controlled probe whose environment
  and evidence are narrower than a production claim.
- **PLANNED**: intended architecture with no complete implementation.
- **ASPIRATIONAL**: long-term direction whose feasibility or exact design is
  not yet established.

## Identity and direction

MRML is the **Mitchell Renouf Machine Learning Library**. It began as local
machine-learning and inference work and is evolving into a broader experimental
computing stack, including an operating system built from first principles.
The OS direction is experimental, security-oriented, capability-based,
and centered on strict Total MicroVM isolation. x86-64 is the primary
bring-up target. Windows and Linux host tools are separate from MRML OS
execution. macOS host support and ARM64 (AArch64) support are planned.
The project is Rust-first, local-first,
minimizes dependencies, and is designed for user sovereignty and first-class
local AI. MRML is not currently a production operating system.

## Current architecture

> Control planes establish authority; data planes should take the shortest safe
> path.

Policy, capability derivation, exact-generation resolution, admission, resource
accounting, queue creation, mapping, and revocation setup belong to control
planes. After that control plane has established an immutable bounded binding,
steady-state data should use the most direct safe transport for that binding.
Ordinary cross-domain traffic uses the admitted microVM transport, such as a
capability-bound shared queue. A
short data path never means ambient authority: data-plane bytes cannot mint
capabilities, select or substitute objects or providers, change placement or
policy, exceed admitted budgets, or bypass validation, accounting, lifecycle,
and revocation.

For example, VirtualGPU policy and the GPU broker establish the exact domain,
queues, mappings, budgets, and generations once. The App VM and GPU backend may
then exchange bounded authenticated commands and completions through the
established shared queues without routing every command back through policy.
The current kernel foundation represents that handoff as a one-use
`GpuDataPlaneBinding`: it rejects zero authority identities and mismatched queue
capacity, retains the exact domain, policy/device generations, and admitted
byte/dispatch budgets, and consumes itself to create disjoint command and
completion endpoints. This is **PARTIALLY IMPLEMENTED** queue-boundary evidence,
not a complete GPU broker, hardware data path, or physical isolation claim.

The same rule now has a bounded graphics-object foundation. Kernel admission
checks separate capabilities for one exact surface, output, and graphics buffer,
validates bounded logical/physical geometry and damage, and then consumes the
admitted atomic update into an immutable `SurfaceDataPlaneBinding`. Buffer bytes
therefore take a direct established path without becoming presentation,
display-configuration, cross-surface, or object-selection authority. The binding
retains the exact handles for a bounded object/revocation recheck before use;
the short path does not detach lifecycle enforcement. This is
**PARTIALLY IMPLEMENTED** type and unit-test evidence only; the trusted object
registry, compositor service, stable surface wire protocol, application and
microVM adapters, GOP presentation, and Semantic Scene Graph remain **PLANNED**.
The stable wire-protocol portion is now **PARTIALLY IMPLEMENTED** as
`org.mrml.interface.gui.surface@1`: a fingerprinted fixed commit/state/response
codec feeds the same admission through a trusted handle resolver. The resolver,
not interface bytes, supplies live capabilities and authoritative descriptors.
The compositor package now carries the same 312-byte call frame through either
capability-checked native task IPC or a bounded, generation-reset microVM queue.
Both paths resolve trusted registry state and call the same kernel admission
before returning a data-plane binding; neither transport can mint authority.
This is **PARTIALLY IMPLEMENTED** hosted transport and unit-test evidence. The
queue is not yet mapped into a guest, and WHP/KVM execution, presentation, and
a representative GUI application remain **PLANNED**.
The representative `org.mrml.app.gui-probe` package is now
**PARTIALLY IMPLEMENTED** on both sides of that remaining connection. Its
placement-independent client state machine uses the interface-owned fixed call
frame, and its separately authenticated PE image completed the same
generation-bound Total-mode CPL3 launch and teardown on WHP and nested KVM.
Those probes prove application identity, fail-closed microVM placement, and
backend lifecycle parity—not an in-guest surface call, compositor execution,
semantic GUI, rendering, or presentation.
The first compositor-side object registry is **PARTIALLY IMPLEMENTED** as a
fixed-capacity `no_std` service component. It retains already-created exact
capabilities and authoritative descriptors behind generational interface
handles, rejects duplicates and wrong kinds, and makes retired handles stale
before slot reuse. A supervisor-supplied service generation separates restarts
from per-slot reuse, and counter exhaustion never wraps. This is host-unit-tested
resolver state, not a running
compositor, capability mint, desktop object policy, presentation backend, or
Total-mode execution claim.

Canonical packages, coherent `SystemRelease` graphs, immutable local
`SystemGeneration` state, Store transport, system images, servicing, installation,
and typed administration are **PLANNED** in [DEPLOYMENT.md](DEPLOYMENT.md).
Existing signed-container, release-journal, boot, storage, and recovery work does
not by itself implement that deployment architecture.

Versioned independently serviced component interfaces are likewise **PLANNED**
in [packages/COMPONENT_INTERFACES.md](packages/COMPONENT_INTERFACES.md). Package,
interface, and Rust crate identity are separate. Bounded foundations now cover
schema/binding generation, exact in-generation provider resolution, immutable
load plans and binding records, shared-code accounting reservations, and a
hosted Zstd ABI-3 provider/ZIM consumer byte-call adapter, a bounded hosted
isolated-endpoint adapter, a hosted service-side composition through the real
bounded kernel inbox and one attenuated shared-buffer capability, a bounded
userspace receive/reply loop, and a hosted full `TaskRuntime` round trip with
authenticated sender, separate reply authority, and revocation-before-reply,
plus a no-delete retention/inspection decision model. The committed service
route now retains exact domain, interface, provider, policy, class, and placement
identity, and the Zstd adapter consumes that route only when it matches an exact
resolver/policy binding. This is a binding prerequisite, not an operating
resolver connection. The kernel now retains the prepared fail-closed isolation
route, exact consumer/provider artifact digests, interface identity/fingerprint,
and provider generation in one typed component-launch handoff; substitution
returns the still-uncommitted route for unavailable/cancel handling. Backend
adapters now verify both service kinds/digests from that handoff before mapping
either image, then consume the unpublished builder while attaching the exact
consumer and provider in separate address spaces. The adapters have not yet
executed these package artifacts. A standalone `org.mrml.zstd` MRML-target
service binary now
maps the service loop to the existing receive, shared-read/write, release, and
send traps. Its allocation-free target floor decodes raw/RLE frames in one
private 4 KiB scratch page and rejects entropy-coded blocks until their bounded
workspace migration exists. Windows and Arch Linux builds produce the same
declared x86-64 UEFI target form; the Windows output was inspected as PE32+ EFI
application subsystem 10 with a nonzero entrypoint. A separate
`org.mrml.zim` MRML-target consumer probe now builds with the exact provider
generation and attenuated shared-buffer route supplied only in launch state,
not in the interface request. This is build/format evidence, not execution. No
admitted native dynamic loader-to-call path,
independently serviced activation, launched service or guest,
resolver-to-launch dispatch, persistent root discovery, or actual reclamation
lifecycle is implemented.

The reusable OpenPGP detached-signing boundary is **IMPLEMENTED** only as the
generation-1 schema, generated fixed codec, and typed in-process host adapter.
Its opaque endpoint and expected primary fingerprint identify one exact key
generation; only a separately delivered endpoint capability authorizes signing.
Signing and public-key-description routes remain separate, and key use never
implies secret export. The adapter type's `Isolated` name does not establish an
isolation boundary. Capability-projected IPC provider deployment, supervised
runtime binding/revocation, boot and recovery use, protected key custody, and
physical evidence remain **PLANNED**; detailed status is canonical in
[packages/COMPONENT_INTERFACES.md](packages/COMPONENT_INTERFACES.md).

CPU support-floor, vendor microcode, vulnerability, heterogeneous scheduling,
quantitative CPU authority, power, telemetry, and thermal policy are canonical
in [platform/CPU_PLATFORM.md](platform/CPU_PLATFORM.md). Those mechanisms are
**PLANNED** unless the implementation/evidence ledger below says otherwise.

**IMPLEMENTED:** an experimental x86_64 PE32+ Gigakernel, original UEFI loader,
bounded firmware handoff and allocator, W^X page tables, GDT/IDT/TSS, guarded
privilege stacks, CPL3 domains, APIC timer preemption, SMP startup, IPIs,
scheduling and migration, fixed-capacity generational capabilities and tasks,
bounded IPC, fault retirement, service restart policy, guest-memory policy, and
native KVM and Windows WHP launch backends. Signed controlled probes exercise
subsets of these mechanisms. See the evidence ledger in GIGAKERNEL.md.

**PARTIALLY IMPLEMENTED:** blocking receive and scheduler wakeup, bounded
backpressure, attenuated capability transfer with bounded transitive IPC-handle
revocation, multi-party shared-memory bindings, mapping revocation, peer fault
cleanup with cleanup-gated fresh-generation restart, multi-core balancing,
protected-execution admission, VMX-root
monitoring, VT-d table/control machinery, mediated GPU, boot admission,
measured-boot plumbing, and monotonic release-state abstractions. IPC-handle
descendants are covered in `TaskRuntime`; the broader derived-state revocation
requirement still includes mappings, shared memory, DMA, devices, cached
decisions, and service-specific state. These pieces do not yet form a complete
production service substrate or hardware-validated security boundary.
Quantitative memory-resource policy now has fixed-capacity generational pools
and objects, attenuated child page/mapping/count reservations, content-free
usage inspection, exact capability checks, and recursive pool revocation. This
accounts commitments only; frame allocation, mapping, sharing, pinning, DMA,
cache charging, VMM projection, and userspace policy integration remain
incomplete. The policy table now also represents fixed-capacity generational
mapping reservations. Reservation requires exact source-object MAP plus access
rights and independently derives the target address-space identity from a MAP
capability; W^X, object bounds, target-range overlap, and pool/child mapping
budgets are checked before publication. These are accounting records, not page-
table or backend mappings. Object and pool retirement fail closed while a
reservation is live; unsafe reservation release requires prior real teardown
and invalidation. A backend-neutral transaction can now publish a reservation
only after a privileged mapper confirms exact installation, and retires it only
after confirmed removal and invalidation; either backend error leaves policy
state unpublished or retryably live. Only a deterministic protocol backend has
been exercised, not x86 page tables, KVM/WHP, or hardware. Exact physical runs
can now be bound to committed objects only under object `CONTROL|PIN` after a
privileged backend confirms exclusive zeroed ownership. Overlap is rejected;
live backing blocks object/pool reclamation; release remains recorded until the
backend confirms mapping/DMA revocation, invalidation, complete scrub, and safe
reuse. This is protocol-backend evidence rather than a reusable frame allocator
or hardware result. The mapping transaction can now require such backing and
derive the exact physical subrange from the object offset before invoking its
backend. Removal reuses the identical physical request, and backing release
remains blocked until mapping teardown succeeds. Accounting-only mappings still
exist for simulations. An inactive x86-64 page-table backend now composes that exact request with a
privately owned `PageTableBuilder`. It accepts only read, read/write, or
read/execute user leaves because x86 cannot enforce write-only or execute-only
access; preflights the complete range; removes every attempted leaf after a
late installation error; restores exact leaves after retryable removal error;
and poisons the hierarchy when cleanup is uncertain. Its safety contract keeps
the root unreachable from every CPU and resumable context, so this is concrete
page-table construction evidence but not active invalidation, SMP, boot,
KVM/WHP, hosted, or hardware evidence.
An opt-in accounted configuration-service wrapper now commits its
complete fixed settings and audit state for fresh, empty, and checkpoint-
recovered construction; live service-image composition has not adopted it. An
opt-in accounted supervisor separately commits all fixed service/task bindings,
restart budgets, policy generations, and cleanup-ticket slots; releasing it
requires external proof that no lifecycle authority remains. An opt-in
aggregate policy-service substrate can instead own the task runtime, supervisor,
and configuration service under one exact atomic commitment after validating
scheduler and schema inputs. Exact-limit admission succeeds and a one-page
shortage leaves usage unchanged; live image composition has not adopted it. An opt-in
accounted preallocated page-table store commits its
complete arena capacity before publication, but live boot construction has not
adopted it. An opt-in accounted task-runtime wrapper now commits its
complete fixed scheduler, task/capability metadata, delegation-table, and
inline IPC-inbox footprint to one exact pool object before publication. The
legacy unaccounted constructor remains for simulation and existing boot paths.
The UEFI measured-boot path now extends the individually authenticated kernel
and service payloads and then a canonical 192-byte selected-set record binding
their fixed order, kinds, nonzero versions, and verified SHA3-512 digests. The
measured-boot handoff bit requires all three extensions. This binds the pair the
current loader actually selects; it is not same-release admission for the
planned VM, CUDA, launch-policy, configuration, or compiler/runtime artifacts.
The legacy record now correctly labels the service as artifact kind 3 rather
than VM kind 2. When release-manifest admission is active, the loader instead
extends a canonical 512-byte version-3 record containing a distinct manifest
identity (kind `0x100`) followed by kernel, VM, service, CUDA, and launch-policy
identities (kinds 1 through 5), all at the same authenticated release and with
the exact verified manifest and payload digests.
The existing authenticated `VerifiedRelease` boundary now admits an artifact
only when its kind-specific root matches and its signed version equals—not
merely meets—the manifest release. Executable admission performs this exact
release check before PE parsing. The per-kind minimum-version roots are no
longer exposed from `VerifiedRelease`, closing the cross-release splice at this
foundation.
When a complete release-journal configuration is compiled in, the UEFI loader
now loads the exact 408-byte manifest. It either reconstructs an already
committed release from the authenticated installed-manifest digest or verifies
a new one-time manifest transition. Kernel and service signatures and PE
formats plus the bounded VM, CUDA, and launch-policy bundles are then admitted
through that one `VerifiedRelease`; a new transition is published only after
all five exact artifacts pass admission but before PCR 11 is extended, so the
release journal's fixed PCR policy is coherent
for both its read and publication operations. Later boot preparation failure is
retryable through the installed-manifest receipt. A required-mode
flag fails closed when the complete release configuration is absent. The legacy
independent-root path remains available only when required mode is disabled.
The loader now uses a kernel-owned `PendingBootRelease` transaction rather than
manually sequencing these steps. It records successful exact admission of all
five artifact kinds and refuses journal publication while any kind is absent;
state bytes are erased after success or drop. An already installed release
still requires the complete set but performs no second monotonic publication.
The policy artifact must now contain one strictly canonical build receipt for
the UEFI release target/profile. Before publication, the loader requires its
kernel and service length/digest identities to equal the already authenticated
payloads exactly and rejects zero digests in every recorded identity. The
source archive, dependency lockfile, loader, configuration, and declared tool
metadata are therefore authenticated as system-generation evidence, but boot
does not yet independently reconstruct those inputs or prove that the tool
declarations describe the binaries that ran.
The canonical handoff carries a distinct coherent-release evidence bit only
when this manifest path was used. Kernel production policy requires that bit in
addition to Secure Boot, measured boot, and rollback protection; development
policy may explicitly accept the legacy path. The bit is evidence from the
authenticated loader, not a capability or remote-attestation statement.
Successful admission through the authenticated monotonic release journal also
satisfies the handoff rollback-protection bit; the older standalone version
counter remains only an optional compatibility source. This is a software
contract and does not promote simulation into physical rollback evidence.
Release-manifest construction additionally requires the next manifest root and
all five kind-specific artifact roots to be pairwise distinct. Authenticated
transition rejects reuse of the current manifest-signing root in any next or
artifact role. This preserves the one-statement lifetime of every Lamport key
before a release can expose per-kind admission.
The 152-byte release `BootstrapState` now has a semantically distinct two-slot
journal foundation rather than reusing storage-authority recovery state. Each
200-byte slot binds a dedicated magic, monotonic journal sequence, complete
bootstrap state, and SHA3-256 digest. Compare-and-store now matches the complete
authenticated predecessor, including its current root, instead of only the
release floor; the inactive slot is written before one exact counter advance.
The state also binds the SHA3-512 digest of the installed manifest. A committed
release can therefore reconstruct exact artifact authority on later boots
without replaying its one-time root transition; genesis has no such receipt.
The host release tool can now construct that canonical genesis state from any
explicitly selected Lamport public key and nonzero minimum release, without an
embedded project or vendor root. A separate inspector reports the public root
digest, rollback floor, and optional installed-manifest digest while explicitly
reporting that file authentication was not verified. The safe genesis
constructor rejects a zero root or release floor. This is provisioning input
tooling only: it does not authenticate owner consent, enroll TPM objects,
replace a live root, authorize development mode, or provide accessible recovery.
The UEFI TPM command layer now has a distinct release-state layout and adapter:
one exact counter and two exact 200-byte full-write slots, with recomputed TPM
Names, shared owner-policy admission, fresh operation-bound sessions, verified
writes, exact counter succession, and an explicit cross-journal index-alias
check. This is unit/simulation evidence for the adapter, not provisioning,
reboot, physical power-loss, or rollback-resistance evidence.
The firmware TPM wrapper accepts a bounded 256-byte command, which covers the
235-byte full release-slot write; its former 128-byte ceiling could not carry
either journal's full-write command.

**EXPERIMENTAL:** signed QEMU/UEFI, nested KVM, and WHP runs; Windows VBS enclave
authority/verifier work; nested-KVM VMX-root/EPT probes; CUDA mediation and VMM
benchmarks. Backend-specific evidence is not evidence for another backend.

**PLANNED:** practical storage, network, firewall, configuration, authority-
broker, trusted-consent, security-monitor, audit-event, tool, inference, driver,
and GPU services; a safe native application SDK and versioned protocols;
application microVM projection; trusted compositor and semantic GUI; a no-JIT
browser; production shared-memory queues; TPM-backed rollback state; complete
physical VT-d/device-reset validation; recovery and release key rotation.

Total MicroVM is MRML’s only operating mode. Its semantics are canonical in
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md). Total is a claim about effective
runtime placement, not merely configuration: every running eligible userspace
domain is in an admitted microVM, failures never trigger automatic native
fallback, and every required host/boot/recovery exception is classified and
justified. Capabilities remain authoritative at every placement.

Isolation visibility is now **PARTIALLY IMPLEMENTED** at the kernel boundary.
One exact live `INSPECT` capability authorizes an aggregate snapshot derived
from `IsolationAdmissionTable`; the result binds system/policy generations,
requested mode, effective Total state, class/substrate/unavailability counts,
and native fallback while omitting domain identities and all remediation
authority. The monitor service, per-domain views, subscriptions, GUI/shell, and
accessible semantic projection remain **PLANNED**.

MicroVM resource/device admission is also **PARTIALLY IMPLEMENTED**. One linear
pre-construction plan exact-matches the domain and route system/policy
generations, quantitative guest RAM and vCPU reservations, and the complete
required set of capability-authorized generational projections. Failure maps to
typed isolation unavailability, returns unpublished quantitative authority for
cleanup/retry, and cannot select a native fallback. Live WHP/KVM consumption of
this plan and device-specific lifecycle evidence remain **PLANNED**.

**ASPIRATIONAL:** a production-secure sovereign local-AI OS, broad device
support, machine-checked noninterference, independently audited security, and
additional architectures.

## Rust compiler architecture

The planned `mrml` frontend in [build/BUILD_SYSTEM.md](build/BUILD_SYSTEM.md)
uses pinned upstream Rust for production until profile-specific `mrml-rustc`
gates pass. Build profile and compiler provenance never authorize.

`mrml-rustc` is an original MRML Rust compiler targeting contemporary and
forward-looking Rust semantics. Rust 2024 is its floor, not its final target.
Compatibility means deliberately reproduced observable language semantics, not
every historical edition or nightly, old unsoundness, rustc/LLVM internals,
diagnostic text, unstable Rust ABI, or symbol accidents. It remains recognizably
Rust and must not diverge merely to create an MRML-specific language.

**IMPLEMENTED:** a fixed-capacity, dependency-free, `no_std`, no-global-`alloc`
compiler core; bounded parsing, semantic and const-evaluation subsets;
deterministic x86-64 COFF/ELF64 emission; substantial modern integer and raw-
pointer operations; and original Windows/Arch differential probes against an
exact stage-zero nightly.

**PARTIALLY IMPLEMENTED:** typed places and mutations, references/reborrowing,
modern pointer/provenance-facing APIs, patterns/matches, never coercion, unsafe
operations, aggregates, control flow, and modern const behavior. These bounded
features are not an ownership checker, provenance model, general type system,
stable Rust ABI, or application security proof.

**PLANNED:** an explicit typed ownership/place/CFG representation; staged
Polonius-direction flow-sensitive loan/outlives checking; an independent modern
trait-goal solver; naked functions and validated assembly; application/system/
compiler profiles; compiler-derived security metadata; loader validation; and
progressive exact future-Rust oracle generations.

Unsupported semantics fail closed. Language support for unsafe systems work is
separate from the stricter admission profile planned for ordinary native
applications. The detailed feature matrix, prerequisites, priority policy, and
oracle procedure are normative in [COMPILER.md](COMPILER.md).

## The Gigakernel boundary

The MRML Gigakernel is the privileged core of Total MicroVM isolation.

The Gigakernel contains only mechanisms that fundamentally require privileged
execution: address-space isolation, scheduling, IPC primitives, capability
enforcement and transfer/revocation primitives, interrupt routing, fundamental
memory ownership, minimal hardware isolation, and mechanisms needed to prevent
userspace policy bypass. Ordinary policy must not migrate into the kernel merely
because it is security-sensitive.

Storage, networking, firewall/network policy, system configuration, authority
brokering, trusted consent UI, security monitoring, service supervision policy,
ordinary drivers where feasible, and AI policy belong in isolated userspace
services. A service failure should revoke its authority and resources, notify
affected peers, permit bounded restart, and leave unrelated services and the
kernel running.

UEFI selects the boot display mode and passes validated scanout geometry.
Normal kernel boot does not paint the framebuffer. Post-boot drawing belongs
to the compositor, using a scoped output grant and a bounded scanout view
rather than a physical address. For microVM placement, the guest renders
into its own frame; the trusted output projection copies only visible pixels
and never lends the hardware mapping to the guest. The projection checks the
exact committed microVM launch against the admission table again before it
requests the guest’s frame. A retired route cannot regain access when its slot
is reused. This is tested control-plane wiring, not live guest execution. Explicit firmware recovery and bring-up diagnostics do not
constitute a parallel production display implementation.

Native USB has no privileged runtime fallback. The kernel may retain device
quiescence, requester isolation, and capability binding and revocation. USB
controller operation and mass-storage commands belong to one isolated block
provider; FAT32 remains a separate service using the block protocol. Firmware
reads of boot artifacts and read-only bring-up inspection do not constitute
native driver ownership. Until the isolated USB provider can be provisioned,
native USB I/O is unavailable rather than routed through privileged code.

Storage's modular provider boundary is **PARTIALLY IMPLEMENTED** at the stable
interface-schema layer. Block transports and filesystems are immutable library
packages dynamically bound as isolated supervised services to `mrml-storage`;
they are not ambient in-process plugins. Generation-1 block-provider and
filesystem interfaces define bounded generational operations and pass focused
Windows/Arch Linux tests; the filesystem interface now includes a canonical
probe codec and exact-generation isolated endpoint transport. A fixed-capacity
registry now models authority-bound
binding and cleanup/launch/health-check replacement; failure quarantines or
leaves the provider unavailable rather than falling back. Storage passes 181
tests on both hosts before extraction. The complete existing AHCI mechanism now
lives in `org.mrml.library.storage.ahci`, advertises the block-provider interface,
and passes 50 tests per host, including bounded capability-authorized command
construction without issue; the AHCI-free policy service passes 136 after adding
a test-only FAT32 restart route. This is a package/interface extraction, not yet
a live AHCI provider endpoint. Source-tested supervised construction,
activation, and the typed freeze-first teardown boundary now exist, but a
production controller-manager teardown lease, installed stop-request routing
and entry execution, and live provider publication remain incomplete.
This reuses canonical package resolution and cleanup-gated
service restart, so compatible replacement needs no kernel reboot and cannot
silently retain stale authority.

`org.mrml.library.storage.fat32` is now a second **PARTIALLY IMPLEMENTED**
isolated provider. It supplies the filesystem-interface graph edge and a bounded
read-only FAT32 geometry, FSInfo, bounded FAT-chain parser, atomic 8.3 directory-
chain composition, checked read-only LFN labels, atomic bounded file reads, and
canonical provider probing plus a concrete isolated receive/reply service loop
with thirty-three passing tests on Windows and Arch Linux. Its MRML-native service
binary builds as a PE32+ EFI application. It
grants no authority from a FAT signature and does not mount or mutate media.
Storage requires block and filesystem providers as independently replaceable
generations.

## Authority model

Values must resolve into mechanisms and tests, not remain slogans:

```text
Power is revocable
  -> derived authority must be removable
  -> generational capability graph plus mapping/IPC/device cleanup
  -> revoke a parent and prove descendant handles and mappings fail

Intelligence does not imply authority
  -> AI is an ordinary capability principal
  -> scoped AI-session capabilities and SemanticView
  -> injected content requests SecretObject.EXPORT and receives DENIED

Owner controls the machine
  -> owner-selected trust roots without rollback bypass
  -> boot, update, recovery, and scoped-attestation key policy
  -> an explicitly authorized owner-built generation boots and reports that policy
```

MRML avoids ambient authority. A path, PID, port, service name, object ID,
device name, signature, publisher, hash, or user identity does not itself grant
access. Authentication answers who an entity is; a capability answers what it
may do. Human-facing names may guide policy, but enforcement should resolve
them to capabilities for stable objects.

Capabilities are narrow, explicitly transferred, and generational. Derivation
may preserve or reduce rights but cannot increase them. Launch by a privileged
user does not imply universal authority. Revocation is not complete until all
relevant descendants and derived state—handles, mappings, shared memory, IPC,
DMA, devices, network/firewall state, cached decisions, and temporary grants—
are unusable or quarantined.

The durable object-model rule is: **everything meaningful is an object, and
authority to an object is represented by capabilities**. An object is a
resource with identity and lifetime; a capability grants specific operations on
it; a name or path discovers it but does not authorize it. This applies to
files, directories, processes, threads, services, windows, surfaces, VMs,
devices, connections, audio streams, configuration, credentials, AI sessions,
debugging, media, snapshots, and security state. **Names identify. Capabilities
authorize.** This does not require turning meaningless private implementation
details into public objects.

### Capability namespace and provenance

**PLANNED:** a launcher/policy assembles each application's initial capability
namespace. Entries such as GUI, app-data, playback, network-connect, or AI
inference refer to already authorized objects; globally discoverable service
names never confer privilege. Optional services may be discovered without
granting access.

Capabilities will carry bounded, access-controlled provenance sufficient to
explain their parent/delegator, rights attenuation, target object, lifetime,
expiration, transfer, and revocation. Introspection answers “why does this have
access?” using the real delegation graph—for example, user selection through a
trusted picker produced a file READ capability—not a cosmetic ACL explanation.
It must not reveal object contents, secret values, unrelated principals, or an
unbounded history.

Where practical, authority has a common lifecycle: delegate, derive, restrict,
revoke, expire, and inspect provenance. Subsystems retain specific rights.
Lifetime policies may bind to one operation, process/window/VM lifetime, device
removal, logout, an explicit deadline, or revocation. The common mechanism—not
subsystem-specific timers—must invalidate derived state.

### Secrets, debugging, and diagnostics

**PLANNED:** `SecretObject` represents passwords, API/OAuth tokens, keys,
sessions, and recovery material. A secret capability normally permits bounded
`USE`, `AUTHENTICATE`, or `SIGN` without plaintext disclosure. `ROTATE`,
`DELETE`, and especially `EXPORT` are separate rights; export generally needs
stronger policy or trusted consent. Protocols that require plaintext exposure
must document the limitation. Remote AI receives no export authority by
default.

Debugging is object-scoped authority, not universal ptrace/root. Independent
rights may read registers/memory, break, single-step, write state, inject a
signal, or terminate one exact process. Diagnostics likewise expose structured
fault objects and events—subsystem, target, operation, error, severity, and
recoverability—through observation capabilities that do not imply kernel memory
or mutation access.

### Disposable domains and restart

**PLANNED:** “Open Isolated” launches unknown downloads, documents, media,
browsers, or suspicious applications in a temporary process/VM domain with
minimal capability namespace and trusted compositor identity. Closing it
revokes authority, destroys the domain, discards temporary storage, and erases
sensitive memory where practical. Persistent storage or networking is absent
unless explicitly delegated.

Userspace services should be crash/restart oriented where suitable: detect
failure, revoke all service authority, destroy transient state, launch a clean
generation, and restore only explicit persistent configuration. Services whose
domain requires richer recovery need not be forced into this model.

### Object and data provenance

**PLANNED:** bounded, privacy-conscious, access-controlled object history may
record creator/modifier/downloader, network origin, URL, source application or
domain, signature/admission state, timestamps when trustworthy, and relevant
capability transfers. Integrity-protected system provenance remains distinct
from application-supplied metadata.

Lightweight data labels such as trusted user instruction, system policy, local
trusted content, untrusted file/web/email/remote content, and AI-generated
content survive important serialization and AI-context boundaries. **Data
cannot grant authority.** Imperative text from an untrusted source remains data;
tool execution is still capability constrained. Provenance informs decisions
and prompt-injection defense but never replaces authorization.

## Native storage direction

**PARTIALLY IMPLEMENTED:** MRML is building a capability-aware native
filesystem. The `mrml-storage` userspace-service foundation defines nonzero
volume/object identities, principal-bound generational handles with attenuated
derivation and transitive descendant revocation, and canonical checksummed
volume, superblock, directory, directory-entry, and file metadata records.
Prepared file and directory primary-metadata COW images hash the fixed canonical
record followed by zeros through the exact block-aligned pointer extent; hidden
tail bytes and an extent shorter than the record therefore cannot share the
published digest. Unsafe staging backends must write and verify that complete
canonical padded range.
It also validates fixed extent records into exact logical coverage containing
data or explicit holes, rejects intra-file physical overlap and reserved volume
blocks, and provides bounded logical-to-physical lookup. A COW publication plan
requires exact next-generation nonoverlapping metadata ranges outside the
protected active generation, verifies staged-image digests, flushes them before
atomically replacing only the inactive superblock, and treats any failure at or
after replacement as fail-stop. A bounded block-volume adapter now implements
metadata staging, complete-image readback verification, durable-flush calls,
inactive-superblock replacement, and immutable recovery reads over an unsafe
exact-block device boundary. It permanently poisons a session after uncertain
replacement durability. Exact-block file reads now hash each complete physical
extent before copying a requested subrange. A bounded one-use file-write session
binds one exact predecessor, reconstructs successor blocks from verified old
data, holes, and the caller patch, rejects active/reserved/overlapping ranges,
verifies each complete staged extent by readback and the complete logical-file
digest, then flushes data before metadata publication. A fixed-capacity in-process block-service core now
registers non-authorizing device identities and issues principal-bound
generational sessions with independently attenuable `READ`, `WRITE`, `FLUSH`,
and `REPLACE_SUPERBLOCK` rights. Every operation reauthorizes before validating
or disclosing ranges; revocation is transitive, device removal retires every
session, and a scoped client connects the service to the exact-block adapter.
The canonical v1 control protocol now uses fixed 320-byte requests and 32-byte
responses, carries no principal or raw address, requires exactly one separately
transferred buffer capability for reads/writes, and inlines only the bounded
superblock record for atomic replacement. A bounded dispatcher authenticates
the IPC-derived principal, binds the exact buffer length, rejects noncanonical
records and replayed per-generation request IDs, and fail-stops a session after
an uncertain mutating backend result. Block requests now expose their exact
service-side buffer access shape. The kernel IPC receiver can require zero
transferred capabilities or exactly one live capability with an exact nonzero
rights set; it rejects missing, multiple, attenuated-too-far, over-privileged,
stale, or revoked transfers before returning object identity. Existing shared-
memory resolution is now composed into the same receiver gate: the exact
binding, object, VM/task, mapping generation, access mode, host range,
writability, and non-executable state must agree before only the opaque host
resource handle is returned. Generic bounded buffer reads and writes now repeat
that complete authorization at every use, reject empty or overflowing ranges,
deny writes through read-only bindings, and preserve backend uncertainty while
passing no raw address across the interface. Service-side selection now derives
the unique binding from the exact transferred capability plus kernel-known
VM/task identity; absent, ambiguous, or stale candidates fail before I/O, and
request bytes cannot nominate a binding. The focused signed KVM/WHP controlled
probe now instantiates the isolated block-specific syscall/receive loop against
a volatile in-image page. There is not yet a physical device implementation,
persistent allocation/free engine, complete COW tree, or concrete native block
I/O. The syscall decoder admits bounded capability-
selected shared-buffer copy operations without binding IDs or shared addresses.
A generic executor binds those requests to the current task capability space,
kernel-known VM/task identity, exact live binding, direction-validated user-copy
backend, opaque resource backend, and erased bounded scratch. The kernel-image
service path composes that executor with active user copy and opaque resource
state. A fixed-capacity kernel-
owned opaque-resource table now issues monotonically increasing nonzero handles,
rejects live aliases, independently bounds transfers, retires stale handles
through the existing cleanup hook, and preserves backend uncertainty. Its
supervisor-memory adapter keeps raw addresses behind an unsafe boundary. The x86-64
active-page user-copy adapter is implemented: it binds validation to expected
CR3 and task plus exact address, length, and direction in a one-use ticket;
executor failure cancels an unconsumed ticket. Shared cleanup now depends only
on a narrow native-mapping revoker rather than full VMM authority. An active
x86-64 service adapter exact-matches CR3, virtual and physical extent, and old
permissions before removing all leaves and invalidating their local TLB entries.
KVM and WHP can now observe that kernel-side retirement only by verifying the
complete expected leaf range is absent before changing their live/re-arm
bookkeeping; they do not attempt a second unmap. This is the revocation
kernel-image resource composition. Each backend now also carries a
separate per-service resource slot: attachment targets exactly one service root,
rejects virtual or physical overlap with the common page or sibling resources,
and has independent revoke, observed-revoke, and restore state. Restore erases
the complete backing page before reinstalling the leaf. These APIs are compile-
tested. Both hosted runners prepare a distinct receiver-only page. The kernel-
image service path now gives only that receiver separate exact non-delegable
read and read/write resource capabilities, resolves bounded shared-buffer
syscalls through kernel-owned VM,
binding, and opaque-resource state, and composes receiver cleanup with exact
active-leaf removal, binding retirement, and final handle retirement. The host
accepts cleanup only by observing the absent leaf before zeroed restore; sender
cleanup remains resource-free. Fresh one-time signed KVM and WHP probes check
zero-before-use and bounded write/read behavior in both generations, kernel-
side leaf/binding/handle retirement, host absent-leaf observation, zeroed re-
arm, and final retirement. This is hosted controlled-probe evidence, not host-
resistant or physical-hardware evidence. Bounded
in-memory directory state now requires exact
per-operation directory authority for lookup, enumeration, creation, rename,
cross-directory file moves, and removal. Creation returns a capability bound to
a service-allocated stable object identity; namespace removal does not revoke
existing object capabilities, and rename preserves identity. Cross-directory
directory moves now require a bounded proof that walks canonical directory
metadata from the exact destination generation to the selected root, rejecting
the moved object, repeated ancestors, stale destination state, broken parent
links, backend uncertainty, and capacity exhaustion. The proof now also loads
the moved directory's exact generation and requires its current parent to be the
source directory. The opaque proof retains both bounded source-to-root and
destination-to-root object/generation paths. A fixed-capacity planner merges
those paths with the moved directory, removes shared ancestors, rejects a
shared object with inconsistent generation or depth, and orders the affected
closure child-before-parent with the root last. An immutable-state backend now
loads every exact predecessor in that closure and constructs bounded canonical
successors: the moved directory changes parent, source removal is compacted,
destination insertion points at the moved successor, each affected directory
advances once, and exact child-generation links propagate through deduplicated
shared ancestors to the root. This is non-authorizing construction only;
the complete plan now preflights distinct bounded metadata/entry layouts before
any write, stages every unreachable canonical successor child-before-parent,
and can build one directory-only transaction containing every participant and
image. The publication helper now additionally requires one allocation
successor to own every exact directory metadata/entry range with the matching
object, successor generation, and allocation kind; it binds that allocation
participant and image plus every directory participant and image into one
transaction and one COW-root plan. Successful publication returns a one-use
receipt whose directory participants are consumed atomically before their
successors are exposed. Concrete block integration, power-loss evidence, and
crash-safe creation remain pending. A canonical volume-scoped object-ID
allocator image now binds its nonzero generation, exact next stable ID or
exhausted state, COW pointer, full-image checksum, and zero padding. Reservation
stages an unreachable successor without changing the active allocator, admits
one distinct allocator transaction resource, and exposes the allocated ID and
successor only after its one-use receipt. Its successor must now be present in
the prepared allocation successor under a distinct allocator-metadata purpose,
bound to the exact root lifetime anchor, allocator generation, and pointer
range; this accounting anchor grants no authority. Reachable recovery now
requires exactly one such root-anchored record, decodes the exact canonical
allocator image at the candidate generation, and rejects a concrete next ID
that could reuse any reachable object ID. Missing, duplicate, corrupt, stale,
wrong-purpose, wrong-owner, and wrong-range state invalidates the candidate;
canonical exhaustion remains valid and strictly non-allocating. Authenticated
anti-rollback and physical durability evidence remain pending. The storage
authority table now supports opaque inactive insertion reservations: reserved
slots consume capacity but cannot authorize, guessed handles are rejected,
activation succeeds once, and cancellation retires the slot generation before
reuse. The prepared-create coordinator now validates that exact reservation
before consuming any receipt and activates it only after the complete receipt
set is consumed; prepublication cancellation retires it.
Canonical empty-file and empty-directory initialization is now staged without
making either child reachable. Both bind generation 1, exact stable identity,
disjoint metadata ranges, canonical zero-padded empty subordinate images, and
complete-image digests; the directory additionally binds its parent. Each is an
explicit typed `0 -> 1` creation participant rather than an ordinary update.
Parent-directory, allocation, ID-allocator, child, and authority-reservation
are now assembled by one bounded prepared-create coordinator. A general one-directory mutation proof now walks
the exact target generation to the selected root through the immutable backend.
For create it reloads every predecessor, inserts the generation-1 child only in
the target successor, advances every affected directory once, and rewrites each
parent entry bottom-up through the root. Staging and publication of this create
closure now reuse the same whole-plan layout preflight as directory moves:
every metadata/entry range is valid, exactly sized, and pairwise disjoint before
the first write; all successors stage child-before-parent and enter one bounded
directory transaction. The coordinator requires exact ownership for every
directory, child, and allocator image; admits the closure, typed child,
object-ID allocator, and allocation successor to one transaction; builds one
COW-root publication; and atomically consumes all participants before exposing
successor states or activating authority. Focused empty-file and empty-directory
creates exercise both admitted child kinds. Directory preparation retains its
exact parent, the coordinator requires that parent to be the unique directory
successor containing the generation-1 child entry, and the committed child state
preserves it. A deterministic durability simulation now materializes the exact
six staged create images, verifies their complete digests, crashes at every COW
publication event, and runs the full reachable validator. It selects only the
complete old or complete new graph. Authority remains inactive unless a
successful publication returns the exact receipt. After a fail-stop whose
superblock became durable, the in-memory model cancels the stale inactive
reservation and permits a fresh child handle only through the exact surviving
parent-directory handle carrying the distinct `OPEN_CHILD` right. The name
identifies the recovered child but does not authorize it; requested rights must
be valid for the recovered kind, and the fresh handle retains parent lineage so
revocation is transitive. `LOOKUP` alone cannot manufacture authority. Reboot-
time capability checkpoint/reconstruction, block service/device integration, and
physical power-loss evidence remain pending.
A bounded storage durable-grant checkpoint foundation now addresses the first
part without treating a saved token as authority. Its canonical v1 header binds
one nonzero monotonic recovery epoch, volume identity, selected root generation,
nonzero handle-generation high-water mark, record count, and complete SHA3-256
digest. Each fixed grant names a stable object, kind, principal, rights, and
either an externally authenticated root or
an earlier parent grant. Parent order makes cycles unrepresentable; derived
grants must preserve object/kind, remain within parent rights, and require
`DELEGATE`. Reconstruction consumes an unsafe proof that trusted recovery bound
to the exact digest and builds a separate fresh authority table before advancing
the replay and handle-generation guards. Reconstructed slots start at the
authenticated high-water mark and the table computes the next value strictly
above every issued slot, so a stale pre-reboot token cannot collide after
recovery. Live handles are never serialized, and
transient live capabilities are not automatically made durable. This remains a
foundation. The canonical bytes can now become the complete content of a
capability-authorized stable-file successor: exact file WRITE/RESIZE is checked
before encoding, successor metadata binds the file object/generation/length/
digest/extents, and an exact one-use COW transaction receipt activates it.
Recovery accepts only the caller-supplied file generation already selected by
authenticated reachable recovery, uses separate bootstrap file READ authority,
does not search older generations, preserves I/O uncertainty, and erases the
policy buffer after parsing. Safe code can no longer initialize the replay guard
from arbitrary counters or construct a recovery proof directly. Unsafe boundary
tokens carry authenticated rollback state and exact owner-approved checkpoint
admission; a one-use issuer redecodes canonical bytes, matches every bound field,
and alone constructs the consumed proof. Stable recovery invokes it only after
authorized file I/O, permitting retry before acceptance but rejecting duplicate
issue. A canonical 64-byte accepted-state record binds the authority epoch,
handle-generation high-water mark, exact volume, and accepted root generation.
The backend-neutral authenticated monotonic store compares the entire prior
record before replacing it. Genesis state has no volume/root binding; after the
first accepted recovery, normal transitions reject cross-volume substitution
and root-generation regression. Integrated recovery releases no reconstructed
capabilities until that exact transition commits, and corrupt, conflicting, or
uncertain state fails closed. A backend-neutral two-slot journal can now
implement the authenticated store contract: each fixed slot binds a journal sequence,
the complete 64-byte state, and a complete-record SHA3-256 digest. Recovery
reads only the parity slot selected by the authenticated monotonic counter and
requires its exact sequence. Publication durably writes and verifies the
inactive slot before one serialized exact counter advance; that advance is the
only publication point. Failed pre-advance writes leave the old slot selected,
while a committed-but-uncertain advance is observed as new state and conflicts
with an old retry. The unsafe backend must still provide fixed owner-provisioned
slot identities, authenticated exact I/O, durable verification, and a
power-loss-atomic counter. No linked firmware integration or physical power-cut
evidence exists yet. The UEFI TPM parser now admits a recovery layout
only when three distinct owner-configured NV indices expose canonical public
areas: one SHA-256-named 8-byte counter and two SHA-256-named 112-byte ordinary
slots, all bound to the exact same nonzero 32-byte policy digest. Only the exact
policy-read/policy-write/no-DA attributes are accepted; slots additionally
require full-object writes, and dynamic `WRITTEN` is the sole tolerated extra
bit. Returned TPM Names are recomputed from the complete public areas. This
validates provisioning identity before use. A TPM journal adapter now composes
those verified identities with the backend-neutral journal. Every exact read,
full-slot write, or counter increment consumes a fresh one-use policy session
issued by an unsafe owner-policy provider for the exact TPM Name, shared policy
digest, and operation. A concrete provider now starts a fresh unsalted,
unbound SHA-256 policy session from caller entropy, executes one exact
owner-configured `PolicyPCR` recipe, and permits only the requested next NV
operation. The concrete provider is constructed only from the admitted three-
object layout; authorization requires the exact admitted NV index/Name/policy
tuple, and the following command must repeat that index in both TPM handle
fields together with the exact operation and session handle. Mismatch and
policy failure trigger best-effort session cleanup.
An ambiguous NV transport failure also best-effort flushes the already-satisfied
session while preserving the original error; the wrapper clears its pending
authorization and never treats the uncertain TPM handle as reusable.
Immediate nonce reuse fails closed. A safe composition constructor exposes the
authenticated journal only after the complete three-index layout is admitted
through that provider; layout-policy substitution fails construction.
The UEFI loader now has an optional all-or-none development configuration for
those exact indices, policy digest, PCR digest, and PCR selection. When present,
it uses TCG2 plus a fresh firmware-RNG call per session to construct the stack
and authenticate the currently selected journal slot before
`ExitBootServices`; partial configuration or any uncertainty aborts boot, and
the temporary state bytes are erased. The loader does not yet consume that
state into kernel authority or reinterpret it as artifact rollback evidence.
It now decodes the canonical epoch, handle generation, optional volume, and
root generation into a separately flagged 40-byte handoff record. Early-kernel
handoff decoding reconstructs typed metadata only after exact length, reserved-
byte, nonzero-generation, and all-or-none volume/root checks. Presence is
independent of the artifact rollback flag, and no capability or authenticated
recovery token is created.
The storage-service recovery boundary now consumes that metadata into a one-use
wrapper around the independently authenticated state store. Its sole load must
decode to the exact handed-off epoch, handle generation, volume, and root; its
sole compare-and-store must use the exact bytes returned by that load. Replay,
substitution, malformed state, store error, or reentrant use erases caller
output and releases nothing. Handoff data still does not authenticate itself:
the existing owner-approved checkpoint proof, capability-authorized exact file
selection, dependent validation, and monotonic commit remain mandatory.
The kernel mechanism layer now also has a one-use delivery object bound to one
exact service task generation, one exact object, and an exact non-delegable
`READ` capability. Delivery revokes that capability before copying the fixed
record and then consumes the metadata. Wrong task, wrong object, overbroad or
stale capability, replay, and replacement-task attempts receive zero output.
An isolated operation-13 syscall adapter now decodes only that capability and
one canonical output address, requires four zero reserved registers, validates
one exact current-task writable range through a directional one-use ticket,
then performs delivery and erases its fixed kernel scratch. Validation failure
preserves the delivery; copy uncertainty after revocation is terminal and
cannot be retried. The kernel-image service dispatcher now recognizes this
operation before generic syscall decoding, revalidates the complete return
frame and active CR3, and creates the exact metadata-only capability and
delivery only for the initial service generation when recovery metadata is
present. The capability token is supplied in launch state; metadata presence
does not grant storage or recovery authority. The signed block-service probe
now passes that token as a seventh SysV launch argument, invokes operation 13
from CPL3, decodes the exact fixed record, and erases its copy. Fresh WHP and
KVM controlled probes reached the existing complete service-cleanup gate. This
is hosted invocation evidence only; native UEFI execution, authenticated TPM
state, persistence, reboot, rollback resistance, and physical evidence remain
pending.
Before the signed block service announces readiness, it now passes the decoded
record through the existing `BootRecoveryAdmission` wrapper against an
independently constructed controlled test record. Exact equality is required;
a deliberate second load must fail and zero its output, and all copies are
erased. The record is then forwarded as data to the configuration client. That
client independently rebinds it, verifies an owner-approved authority
checkpoint, reconstructs one attenuated file capability privately, validates
the exact configuration and restart policy, and accepts only the fixed
epoch/generation/root successor before releasing the recovered result. This
composes live delivery with the complete dependent transaction under hosted
execution, but the controlled record is not a TPM, nonvolatile store, or
physical monotonic-write provider and creates no recovery authority by itself.
The full deterministic configuration recovery path exercises delivery,
canonical service-side decoding, authenticated-store binding, owner proof,
capability-selected I/O, monotonic commit, and service registration in order.
No ambient kernel inspection API or storage policy is added.
Commands use bounded TPM session framing; responses must
have exact parameters, bounded nonce, zero session attributes, and no trailing
authorization bytes. Slot writes are read-verified, and counter increment
rechecks both predecessor and exact successor. The existing rollback helper's
incorrect `NV_Write` command code was corrected to `NV_Increment`. The loader
now links as an optimized native `x86_64-unknown-uefi` image with the recovery
path and without `mrml-runtime` in its firmware dependency graph. A fresh
QEMU/OVMF nested-KVM boot of pinned, independently signed kernel and service
artifacts produced the exact trace `a1 a2 a3 a4 a5 a6 a7 a8 b1 b2 b3 d0 d1
d2 d3 d4 df`, proving loader execution through kernel entry and the existing
VMX-root lifecycle. Recovery configuration was absent because no software TPM
was available. Owner-policy provisioning/recovery, recovery-enabled native UEFI
execution, and physical evidence remain pending. A consumed dependent-
validation transaction now
keeps the fresh authority table private while an unsafe side-effect-free
validator recovers an
exact selected configuration-file generation and binds its service restart
policy. Validation failure leaves authenticated monotonic state unchanged;
compare-and-store failure drops both reconstructed authority and the validated
configuration/policy result. Scratch containing checkpoint bytes is erased on
every dependent-validation return. Kernel service registration now has a
non-mutating exact-slot plan and a consumed commit that rechecks vacancy and
generation. The configuration recovery validator can include that plan before
monotonic commit; only the committed-authority wrapper can consume it into a
released configuration, authority table, and running service. Epoch mismatch or
stale supervisor state releases no recovered system. This is typed in-memory
boot orchestration, not a real reboot path. The TPM NV protocol backend has not
been linked into firmware, provisioned, or physically tested. The platform owner-policy authenticator/UI
and complete boot orchestration are not implemented.
Capability-authorized file reads split an arbitrary bounded range across exact
extent records, synthesize sparse holes as zeroes, and require a backend to
verify the complete physical extent digest before copying any data subrange.
The buffer is erased if later verification fails. Bounded writes require exact
`WRITE` and, when length changes, `RESIZE`; accept only a complete successor extent map
and canonical file metadata for the next generation; reject reuse of active
data or protected metadata blocks; stage and durably flush the complete new
extent images; then return an unpublished state that can commit only through a
matching COW metadata plan containing internally derived digests for both the
canonical file record plus its complete zero tail and the zero-padded
extent-list image. The backend also
verifies the complete logical-file digest before flush. The backend and
allocation persistence remain simulated. A canonical fixed-capacity allocation
index binds each data or metadata range to one exact object generation, requires
physical ordering, and rejects overlap across all owners plus volume-header and
superblock use. Explicit fixed-capacity transactions admit
multiple prepared file successors, bind their independently advancing object
generations to one later volume-publication generation, require every derived
metadata image in one COW plan, and issue one-use participant receipts only
after root publication succeeds. Redundant-root recovery decodes both exact
superblock images, requires complete reachable-metadata validation through a
fail-closed backend contract, selects only identical or adjacent valid
generations, and permits fallback only when the other candidate is proven
invalid. The allocation index provides the ownership proof needed by that
validator and exact-block adapter but is not yet loaded from or published to a
real block service/device.
The allocation index now has a canonical block-aligned image whose header binds
the volume, publication generation, record width/count, complete-image digest,
and zero padding; decoding reconstructs and revalidates the index rather than
trusting serialized ownership. It is still not connected to a block backend.
Allocation-image ownership is a distinct kind bound to the selected root and
publication generation rather than being confused with ordinary object
metadata. Extent lists likewise have a canonical block-aligned image binding
file identity, object generation, logical length, fixed record geometry,
complete-image digest, and zero padding; decoding rebuilds exact coverage and
physical-range invariants.
Directory-entry lists now have the same canonical image treatment and rebuild
duplicate-name/object invariants. A fixed-capacity reachable-tree validator
loads the selected allocation image through one immutable-generation backend,
requires exact self-ownership, walks root and child directory/file metadata,
checks parent and generation links, decodes entry and extent images, binds every
data range to exact allocation ownership, and rejects every orphan allocation.
Repeated object references and capacity overflow fail closed. The root selector
and reachable validator are exposed as one bounded recovery entry
point. A typed variant retains each candidate's exact validated file states
separately through redundant-root selection and exposes only the object,
generation, length, and extent map belonging to the chosen graph. These states
are integrity evidence, not capabilities, owner approval, or authenticated
anti-rollback evidence. Selected stable-authority recovery entry points now
require this typed file selection and match its volume/root generation to the
owner-approved admission before reading or consuming the one-use proof. Fresh
reconstructed authority also retains that authenticated root provenance. A
selected configuration-recovery constructor likewise derives the exact file
generation from its reachable selection and rejects a volume/root mismatch
against the temporary authenticated authority before reading configuration.
Lower-level mechanism constructors retain their documented trusted-caller
contracts; boot recovery must use the selected variants for typed end-to-end
root/file binding.
Simulation rejects a checksum-valid newer superblock whose referenced
allocation generation was not published and explicitly falls back to the fully
validated adjacent root; an indeterminate read of the newer candidate aborts
instead of becoming rollback. Publication is also exercised with separate
volatile and durable simulated
state at every COW persistence boundary. Pre-replacement crashes retain the old
root; the uncertain replacement/final-flush window admits either old or fully
metadata-durable new state; completed flush selects the new root. No partial
metadata generation is selectable. This remains a deterministic model, not
physical power-loss evidence. Allocation updates now build a complete
next-generation image rather than mutating live ownership. Frees affect only
that successor, additions are sorted
into its canonical index, its own metadata allocation rotates to the exact next
publication generation, and neither a retained nor same-successor-freed active
range may be reused before root publication. Allocation updates can now stage
that complete encoded allocation image
through a narrow unsafe durability contract. The service derives SHA3-256 over
the exact staged bytes and admits a distinct volume-allocation resource to the
multi-object transaction; it cannot collide with the root directory object's
participant identity. The successor becomes visible only after its exact image
is present in the COW plan and its one-use receipt is consumed. Directory
successors now stage exact canonical directory and entry images, bind both
images to a directory transaction participant, and expose the new immutable
state only after its one-use publication receipt is consumed. The exact-block
metadata and file-data adapters plus the bounded block-service core are
implemented. A bounded no-allocation service loop now composes exact IPC receive,
capability-shape validation, replay admission, capability-selected shared-buffer
syscalls, device dispatch, response send, and unconditional transport-buffer
erasure. Its syscall adapter is an unsafe authority boundary: principal,
capability transfer, mapping selection, endpoint, and reply task must come only
from authenticated kernel/launch state. The UEFI image compiles the concrete
x86-64 operations 4/5/7/8 adapter. A focused signed KVM/WHP probe now
instantiates the loop in an isolated CPL3 service: a separate client can
transfer only an attenuated shared-buffer capability, while the service retains
the launch-bound principal, session, and one-page simulated block backend. The
probe publishes a canonical configuration checkpoint through 18 exact
MRML-native block requests, consumes the one-use COW receipt, recovers only
file generation 2, and reloads the exact service-bound restart policy. Local
shared-buffer use and IPC transfer authority remain separate handles; received
leaf capabilities are explicitly released through transitive runtime
revocation. It then retires the client, consumes the exact typed peer-death event,
retires the service, completes both cleanup tickets, removes the service shared
mapping/resource, and emits success only after both supervised slots have no
task or pending cleanup. Both launchers require the exact ordered cleanup
markers. This is hosted controlled-probe evidence only; the in-image backend is
volatile, and this does not prove reboot restoration, a hosted device backend, physical device,
snapshots, physical power-loss testing, and persistent anti-rollback state
remain unimplemented. The EFI
System Partition and UEFI Simple File System remain appropriate FAT32 interoperability
for boot. ext4, NTFS, and other formats may later be compatibility/import
services, but FAT32, legacy formats, POSIX permissions, and a universal global
namespace do not define native MRML storage or security semantics.

Paths locate objects; capabilities authorize them. Namespace traversal resolves
a stable `DirectoryObject`, `FileObject`, `SnapshotObject`, `VolumeObject`, or
`NamespaceObject`, then access requires explicit rights. Renaming an object does
not change its identity, and knowing or guessing its ID grants nothing. Open
handles remain bound to objects rather than mutable paths. Processes receive
specific roots and objects—such as app-private data, a selected project, or an
update target—rather than seeing a universal namespace filtered by deny rules.
Compatibility layers may emulate conventional paths.

Conceptual directory rights include `LOOKUP`, `ENUMERATE`, `CREATE_FILE`,
`CREATE_DIRECTORY`, `RENAME_CHILD`, and `REMOVE_CHILD`; file rights include
`READ`, `WRITE`, `RESIZE`, `MAP`, `READ_METADATA`, and `WRITE_METADATA`. These
are not frozen ABI names. There is no universal `ADMIN` right, and derivation
never increases authority.

The intentionally small native filesystem v1 targets stable object IDs,
directories/files, extent allocation, checksummed copy-on-write metadata,
atomic transactions, snapshots, crash consistency/recovery, and capability
enforcement. User data is checksummed by default if measurements make it
practical. Compression, encryption, deduplication, replication, remote storage,
complex quotas, and advanced caching are optional later work, not v1 blockers.

Critical metadata is not mutated in place: modified tree nodes/extents form a
new generation followed by an atomic root/superblock transition. Redundant or
rotating roots should be evaluated for recovery. Extent records may reserve
future `HOLE`, `COMPRESSED`, `ENCRYPTED`, or `SHARED` semantics without
implementing them prematurely. Explicit transactions make grouped writes,
renames, and metadata changes externally all-or-nothing.

Snapshots are capability-controlled objects with a generation, filesystem
root, optional parent, and metadata. They support authenticated system-
generation recovery, but checksums are not executable signatures and snapshots
are not malicious-downgrade protection. That claim still requires authenticated
persistent anti-rollback state.

## IPC and shared data

The control path is kernel-mediated, bounded IPC for small messages,
synchronization, request/reply, and capability transfer. Its target semantics
include blocking send/receive, scheduler sleep/wakeup, backpressure, multiple
clients, peer-death notification, cancellation/timeouts where justified, and
predictable cleanup. Some receive/wakeup, bounded inbox, sequencing, and
capability-transfer behavior is implemented; a complete multi-client service
protocol is not.

The bulk path uses revocable shared pages or rings for storage, network, GPU,
and inference data. Large payloads should not be copied through the kernel.
Avoid allocation, global locks, policy engines, scanning, and unnecessary copies
on hot paths. Measure syscall, IPC, wakeup, lookup, transfer, revocation,
mapping, interrupt-to-userspace, and later service throughput.

## VMM backends

```text
backend-independent MRML VM policy and exit handling
    +-- native WHP/WHPX backend (Windows)
    +-- native KVM backend (Linux)
```

Both backends are implemented development and compatibility environments and
must be preserved. Backend-specific lifecycle, memory mapping, registers, and
exit decoding remain behind their adapters. Shared semantics belong in common
kernel/VMM policy. Hosted WHP and KVM do not protect a guest from their host.

### VMM device model

All present and future devices follow the common architecture in
[PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md): device identity, transport,
queue state, backend authority, interrupt authority, and mapping authority remain
distinct. VirtIO is a compatibility transport where adopted, never authority.

The shared VMM will expose a small explicit device family, preferring
paravirtualization over broad legacy emulation. **IMPLEMENTED:** backend-neutral
VM lifecycle, bounded guest memory, exit decoding, interrupt injection policy,
allowlisted scalar I/O, and MRML hypercalls. **PARTIALLY IMPLEMENTED:** the
MRML-specific mediated GPU has authenticated bounded command/completion and
resource queues plus reset/watchdog behavior, but is not a VirtIO GPU or general
display device. An MRML-specific virtual-block foundation now has canonical
fixed read/write/flush requests and completions, disjoint bounded request and
completion rings, exact feature negotiation, monotonic request admission,
generational in-flight tickets, and explicit create/negotiate/activate/operate/
suspend/resume/fail/reset/remove/destroy state. Reset and removal invalidate all
in-flight work and advance the device generation; VMM memory uncertainty poisons
the queue bridge. A backend-neutral executor now requires an exact separately
provisioned block backend. The common runner selects that backend through one
live exact-object capability and independently checks `READ`, `WRITE`, or
`FLUSH` before the corresponding operation; wrong-object, attenuated, stale,
and revoked authority reaches no backend. The same policy descriptor binds a
checked nonempty backend start/count, translates guest-relative blocks, rejects
cross-boundary requests before I/O, and must match advertised device geometry
before vCPU entry. The executor copies reads and writes through erased
caller-owned bounded scratch and distinguishes clean mutation rejection from uncertainty;
uncertainty fails the device and poisons its bridge. A one-request processor now
preflights both admission and completion capacity before consuming a queue entry,
executes an admitted request once, and publishes its exact completion. Malformed
entries reach no backend; post-mutation publication uncertainty fails the device
instead of retrying. Published completions set a coalesced device notification
latch. A backend-neutral bridge derives the configured vector from that latch,
requires the existing exact VM-interrupt `SIGNAL` capability and vector
allowlist, and clears the latch only after confirmed injection; denial or
backend uncertainty leaves it pending, while terminal device transitions clear
it. An MRML-specific scalar doorbell now takes the common I/O disposition,
accepts only the exact 32-bit write/value tuple, and processes at most one
request; every mismatch fails before queue or backend access. The port is
routing data and does not grant block or interrupt authority. A backend-neutral
one-exit runner now composes native backend execution, exit-budget accounting,
the common deny-by-default I/O dispatcher, exact doorbell validation, one queue
transaction, and capability-authorized completion interruption. A notification
already pending is delivered before another vCPU entry, and any runner-stage
error fails the VM. It has no production hosted or physical block backend.
Controlled signed KVM and WHP probes now emit exact native scalar and PCI-MMIO
notifications into the common runners. The scalar bounded probe repeats eight cycles over a two-
slot queue. Each cycle publishes two disjoint writes before retiring either,
drains both protected completions in order, reuses both slots for reads, and
verifies both complete payload pages before continuing. Distinct per-cycle
patterns expose stale payload reuse. Each request receives separately
capability-authorized notification and acknowledgement handling through signed
read-only GDT/IDT data and `iretq`. The probe VM admits exactly the 64 runner
exits required by 32 requests; other launch modes retain their existing budgets.
Both KVM and WHP paths have live controlled evidence. This is bounded multi-
window progress, not a general interrupt framework or unbounded flow.
The common runner now dispatches both the exact doorbell and protected
completion acknowledgement as one backend-neutral transport transaction. It
delivers an already-pending notification before vCPU entry, notifies a newly
published completion before return, accounts exactly one native exit, and
fails the VM on every other disposition or stage error. The KVM and WHP block
launchers use this common dispatch instead of selecting separate host-side
runner entry points. Progress remains explicitly caller-bounded; this is not a
general scheduler loop or unbounded execution.
Virtual-block transport identity is now an explicit part of the device and its
canonical configuration rather than a set of independently repeated port
constants. The configuration encoder/decoder, device processing, and common
host runners distinguish `MrmlSpecificScalarIo` from
`MrmlSpecificPciMmio`. The MMIO variant grants no scalar ports and defines only
fixed 32-bit write-only doorbell/acknowledgement offsets; the exact active PCI/
block attachment and confirmed generational BAR window are revalidated before
queue access. These bindings are data, not port, mapping, device, interrupt, or
backend authority. This remains MRML-native and is not VirtIO compatibility.
The same binding now transactionally constructs the complete two-rule
deny-by-default VM I/O policy, and both hosted launchers use that policy with a
device constructed from the identical transport value. Reads, wrong widths,
and unrelated ports remain denied before device dispatch; transport data still
does not authorize either admitted write.
A separate backend-neutral PCI Type-0 configuration-state foundation now
encodes one exact 64-byte conventional header, an externally supplied identity,
one 32-bit non-prefetchable memory BAR, exact size-probe masking, bounded
aligned 1/2/4-byte reads, and transactional command/BAR writes. The command
model admits only memory-space enable and interrupt disable; bus mastering is
rejected because no DMA transport exists. BAR addresses remain routing data and
cannot create mappings. Memory decode requires an assigned nonzero BAR, and BAR
relocation is rejected while decode is active. An exact generational MMIO-window
view becomes stale when reset transactionally advances the function generation
and clears command, BAR, and probe state. Generation exhaustion preserves the
complete live configuration. Router reset and detach now require an unsafe
native revoker to confirm retirement of every mapping, interrupt, DMA binding,
queue, cached decision, device state, and derived handle for the exact
attachment/function generation before configuration mutation. Preflight or
revocation failure preserves configuration; uncertainty must quarantine or fail
the VM. A controlled KVM/WHP adapter now succeeds only after the exact native
VM/partition is destroyed: it exact-matches the complete cleanup record, revokes
the backend and interrupt capabilities, resets the block attachment, and only
then permits PCI generation advance with BAR/decode clear. Production reset/
remove revokers remain absent. The controlled sole-vCPU mapper now supports
in-place install and withdrawal, but SMP/asynchronous transitions remain
unavailable. MRML still has no assigned production PCI identity,
PCI capability list, MSI/MSI-X, multiple BARs, DMA, QEMU comparison, or
PCI/VirtIO compatibility claim. A fixed-capacity backend-neutral configuration
router now attaches at most eight of these generic functions to exact validated
segment/bus/device/function locations. Attachment requires reset, unassigned,
non-probing configuration state. Duplicate or absent locations, malformed
accesses, capacity exhaustion, active-decode detachment, stale attachment IDs,
and attachment-generation exhaustion fail without ambiguous routing or partial
removal. Reset and detach expose no cleanup-free router API. BDF and attachment
identity remain data; mutable access to trusted VMM
policy, not knowledge of either value, supplies authority.
Host-side simulation and the controlled signed KVM/WHP runners now compose
reset with both classes of unretired block
state: one completion already published but unacknowledged and one request still
in flight. The focused simulation additionally latches its notification. Reset
invalidates the old attachment and in-flight
ticket before a fresh bridge and attachment bind block and PCI generation 2.
The old BAR acknowledgement, ticket, request generation, attachment, and bridge
cannot mutate or poison that successor, while a fresh generation-2 request is
admitted. The live runners stage the completion and request ownership in native
guest memory after the signed workload, destroy the execution container, revoke
the old exact backend/interrupt capabilities, and then perform the common reset;
the separately latched-notification case remains focused simulation evidence.
The controlled native path now prepares a bounded intermediate-table path while
the guest is non-runnable and returns with the exact BAR leaf absent. A
backend-aware mapper receives the same stopped guest that produced the command
exit. Enable exact-matches the attachment cleanup record, installs and verifies
the non-global leaf, reloads and reads back the exact non-PCID CR3, and only
then publishes decode. Disable performs the exact coherent withdrawal before
clearing decode and attachment mapping state. Wrong-leaf and replay attempts
fail. Any page-table or register uncertainty leaves the guest permanently
quarantined. The signed probe exercises install, block traffic, replacement
mapping reconstruction, withdrawal, and post-withdrawal continuation on KVM
and WHP.
This is not asynchronous or SMP shootdown, hotplug, durable recovery, QEMU
comparison, or physical-device evidence.
Memory-decode command transitions now require a separate unsafe native mapper.
Enable maps the exact attachment/function generation and assigned BAR window
before publishing the command bit; disable proves that same native window
unusable before clearing it. Rejected or uncertain native state preserves the
command. The default router, transport, and common-runner paths use a deny
mapper, so a present function cannot silently enable decode; an explicitly
authorized mapper-aware runner is required. BAR assignment remains routing data
and invokes no mapper by itself.
The first concrete host-side composition now binds one exact routed PCI function
generation to one active MRML-native block generation, its queue, interrupt
vector, and capability-selected backend region. Its block-specific mapper tracks
only confirmed mapping of the exact assigned window, and its reset/removal
adapter performs external resource cleanup before changing either lifecycle.
The signed test-only guest now discovers that exact attached function's vendor/
device and block-class configuration dwords, assigns BAR0, enables memory
decode through the exact attachment mapper, and uses the canonical driver for
two writes, two protected acknowledgements, two reads, two more
acknowledgements, one negotiated flush with a zero-length protected completion,
and complete payload verification through native KVM and WHP.
Initial page-table builders install a first-level MMIO leaf without second-level
RAM backing, and native completion blocks re-entry until each exact accepted
write is retired. This is hosted controlled evidence for configuration, trapped
routing, five bounded block operations against a volatile capability-selected
backend, existing legacy interrupt injection, and protected MMIO retirement. It
is not a production live-unmap/native PCI interrupt adapter, durable block backend,
MSI/MSI-X, DMA, VirtIO, production identity, physical device, or host-resistant
isolation.
The legacy completion path now binds delivery to the exact live routed PCI
generation and command state. Interrupt-disable masks injection while retaining
the pending latch; explicit unmask of the same generation permits the separately
capability-authorized vector delivery. The signed KVM/WHP probe exercises this
sequence within an exact nineteen-exit budget. The flush is admitted only when
the guest-visible configuration and host device both negotiate the existing
feature, and backend access independently reauthorizes `FLUSH`.
A separate conventional Configuration Mechanism #1 state machine now decodes
canonical `0xCF8` selector and `0xCFC` data-port accesses into that router. It
derives an exact eight-rule deny-by-default scalar-I/O policy, rejects selector
reserved bits and crossing/misaligned data accesses, and returns width-bounded
all-ones reads or ignored writes for disabled/absent selections. It does not yet
advertise a concrete PCI function. A backend-neutral one-transaction runner now
composes native execution, exit accounting, the exact transport allowlist,
selector/data dispatch, and scalar-input completion. Its narrow completion
contract binds a result to the exact still-pending vCPU, port, and width;
completion uncertainty or any non-PCI exit fails the VM. Native KVM revalidates
and writes the exact pending run-page input; native WHP binds the pending tuple
to one vCPU and installs the width-correct RAX result plus checked next RIP in
one register operation. Both refuse vCPU re-entry while completion remains
pending. The signed controlled KVM/WHP probe first established absent-BDF
selector, all-ones scalar-input completion, and proof continuation. It now
attaches the exact test-only block binding above at BDF `00:04.0`; the guest
reads its fixed test vendor/device and mass-storage/other class dwords through
the same common runner on both native backends. BAR assignment/mapping and
bounded MMIO requests are now exercised as described above. Native PCI interrupt
routing, MSI/MSI-X, DMA, production identity, durable block I/O, and QEMU
comparison remain unimplemented.
Prepared KVM and WHP guests can now transactionally attach the same validated
request/completion layout as disjoint native ranges: requests are guest-
writable, completions are guest-read-only, and the dedicated virtual-block path
retains completion-write access. This is queue-memory attachment, not a complete
device. Dedicated initial-launch builders now also identity-map both ranges into
the guest page tables with request RW/NX and completion R/NX permissions. Range
overlap and KVM native-slot undercapacity fail before a guest is returned.
Because the guest cannot write the protected completion header, an exact
MRML-specific acknowledgement tuple at port `0x4d43` advances exactly one
already-published completion. The bridge owns the authoritative consumer
position and updates the protected header through the device-only memory path.
Acknowledgement is accepted only for the active bound queue after completion
notification was confirmed delivered; empty, premature, mismatched-state, or
uncertain acknowledgements fail the device and poison the bridge. Scalar data
grants no authority. The reusable guest completion consumer now has bounded
multi-window hosted evidence; an unbounded/general runner loop remains pending.
A canonical 128-byte MRML-specific active-device configuration record now binds
the live generation, block geometry, supported and negotiated features, exact
queue ranges and page count, slot count, interrupt vector, fixed scalar ports,
maximum transfer, and request/completion wire sizes. It is pointer-free,
reserved-zero, and data only. Construction requires a fully active device;
decode reconstructs and rechecks the queue arithmetic, and use requires exact
revalidation against the live device. Reset makes an old record stale.
Dedicated KVM and WHP block launch builders now require a typed page binding,
reject queue substitution and all configuration-page overlap, publish the
complete zero-padded page through the host/device path, and identity-map it
read-only/NX to the guest. Signed guests on both KVM and WHP now discover the
mapped record in live controlled probes. PCI presentation and any other
transport remain pending.
A backend-neutral allocation-free initial guest-driver state now strictly
decodes that record only against a completely fresh idle queue snapshot. It
derives slots and request geometry from the configuration, prepares requests
without mutation, commits only the exact fresh publication ticket, permits one
configured-capacity window of in-flight requests, and accepts completions only
in protected consumer order when counter, slot, generation, request ID, status,
and transferred length match. Completion preparation is non-mutating; the
caller can publish the exact protected acknowledgement before committing the
fresh completion ticket. Stale ticket replay cannot retire another slot.
Capacity exhaustion rejects before mutation and slot reuse follows exact
retirement. Reset/removal completions and
request-ID exhaustion record an explicit terminal cause. Only reset may recover:
rediscovery requires a canonical configuration at the exact successor
generation and four zero queue counters, and failure preserves the old terminal
state. Removal and exhaustion remain permanently terminal. A canonical 192-byte
resume-state record now embeds the complete active configuration plus producer,
request-consumer, completion-producer, completion-consumer, last-admitted-ID,
and last-published-ID state. Only a live, unpoisoned bridge paired with the exact
active device can capture it; uncertain guest-memory reads poison the bridge.
The record carries no authority. Guest reconstruction requires its exact slot-
count request snapshot, stable counter ordering, bounded outstanding distance,
canonical generation/geometry, strictly increasing IDs, exact admitted and
published history anchors, and correct physical slot positions. Nonzero idle
history advances from the last published ID instead of reusing it. Live resume
presentation is now implemented as a distinct queue- and configuration-
disjoint page. KVM and WHP initialize it from the canonical fresh state, map it
read-only/NX to the guest, and retain device-path writes; the common bridge can
recapture and publish the complete zero-padded page and poisons on uncertain
publication. The host now cuts old-guest execution immediately after its common
doorbell runners have consumed requests 13 and 14 and published their protected
completions, but before another vCPU entry can retire either completion. No
guest checkpoint port, exit, or allowlist rule participates. The host requires
producer, consumed, and published watermarks 14, consumer watermark 12, and
both history anchors 14. The replacement guest reconstructs two pending
ownership records from the complete page and physical request slots, retires
both already-published completions in order, and continues through operation 32
without ID or counter reuse. Resume capture now additionally requires the
device's explicit `Suspended` lifecycle state; stopping the vCPU alone is not
sufficient. Suspension succeeds only with no device in-flight slot or pending
interrupt, and the runners resume the device only after exact publication and
state validation succeed. Fresh signed KVM execution covers this pending-
ownership host cut; the WHP path has matching source and current compile/lint
evidence but no linked or live replacement evidence. The KVM controlled probe
now also destroys the stopped native VM,
prepares a fresh VM from the same verified executable and canonical handoff,
restores canonical request, completion, and resume pages while the device
remains suspended, requires the replacement payload pages to be freshly zeroed,
and resumes through the fresh kernel entry. The queue pages retain only their
two live counters and two slots; every other byte is zero. That
entry accepts only canonical all-zero launch or exact `14/14/14/12` recovery
watermarks and matching history anchors. The device, bridge, volatile backend,
and common VM policy identity remain live across replacement. The WHP runner
now implements the same consuming partition replacement and canonical three-page
restoration through ordinary versus device-write boundaries; native Windows
`check --tests` and strict Clippy pass with CUDA excluded. No linked or live WHP
replacement evidence exists because `link.exe` remains unavailable.
Both runners now take ownership of the old native VM, snapshot the three pages,
and destroy the old VM before replacement preparation begins. There is no old-
execution fallback if preparation or restoration fails; the retained device
stays suspended. Fresh signed KVM execution covers this no-fallback ordering.
Canonical capture and restoration now use one allocation-free kernel mechanism
instead of duplicated launcher byte selection. It binds the published resume
page to the suspended device and bridge, retains only request slots needed for
pending ownership or the latest history anchor, retains only unretired
completion slots, and validates every request/completion pair. Restoration
preflights completely zero queue extents and the exact configuration-bound fresh
resume page before publishing slots and counters through their directional
boundaries. Memory uncertainty poisons the bridge and cannot authorize resume.
Restoration consumes the non-clonable image exactly once and volatile-erases
its encoded request, completion, and resume storage on every return path. The
captured image is not directly restorable. An explicit unsafe boundary consumes
it into a distinct linear lost-execution witness only after the concrete runner
has consumed and destroyed the old native VM; restoration accepts only that
witness. The witness is type state, not authenticated evidence or authority.
KVM and WHP place confirmation immediately after `drop(guest)` and before any
replacement preparation. The
VM policy budget is exactly 64 common block exits; the former guest checkpoint
exit and third I/O permission no longer exist. Asynchronous/unplanned crash
capture, backend-in-flight recovery, and unbounded progress remain pending.
PCI-MMIO now uses the same canonical lost-execution witness at an idle five-
operation cut: the old VM is destroyed, the retained device/bridge/attachment
stay suspended, a fresh MMIO-trap guest receives only the canonical queue/resume
image, and exact nonzero driver reconstruction precedes proof. Transport
substitution fails before restoration. One freshly
one-time-signed compiled image now discovers this common state from the mapped
configuration page on KVM and WHP. Across eight bounded cycles, its two-slot
queue publishes writes to two disjoint blocks and payload pages before draining
either completion in order, then reuses both retired slots for the corresponding
reads against a volatile two-page backend. Producer and consumer watermarks
reach 32 while physical slots wrap 16 times.
A backend-neutral unsafe guest queue-transport contract now composes those
transactions with canonical queue addresses and exact configured I/O tuples.
Request publication copies the exact slot, release-publishes its producer, and
only then rings the canonical doorbell; completion acquisition reads the
published watermark before the exact next consumer slot; protected
acknowledgement uses the canonical tuple to release-publish only that one
consumer before local commit. A watermark may be ahead without authorizing
skipped retirement. A reported transport error guarantees that no counter or
notification may have become visible and leaves driver state unchanged; stale
tickets fail before transport access. Implementations must guarantee exact,
non-redirected, non-shortened access and may not substitute a scalar port, MMIO
offset, or value. The x86_64 direct transport now performs exact volatile byte
copies, aligned volatile counter access, release/acquire fencing, typed scalar-
or-MMIO notification, and fail-stop verification that protected acknowledgement
is visible before local retirement. Its unsafe constructors require live
identity mappings and either the exact scalar privilege or exact one-page PCI
BAR for the same configured device. Controlled scalar/MMIO models are unit/
simulation evidence; the native `OUT` and fixed 32-bit MMIO paths are live-
executed by freshly one-time-signed compiled KVM and WHP images through shared
fail-closed dispatch and exact `SIGNAL`-capability interrupt. This is hosted
controlled-probe evidence only; native boot, durability, production PCI
interrupt routing, and physical hardware remain unverified.
**PLANNED:** guest
console, complete block integration, network, input, graphics, and sound
devices; production PCI transport completion; and any required compatibility emulation. No
VirtIO-compatible MRML device currently exists.

Each device is explicitly classified as **VirtIO-compatible**,
**VirtIO-inspired**, **MRML-specific**, or **legacy-emulated**, with supported
features, queue formats, reset semantics, backend coverage, QEMU comparison,
known differences, and fuzzing status recorded before compatibility claims.
Actual VirtIO specifications govern devices advertised as compatible. Stronger
capability semantics use an MRML-specific protocol instead of distorting
VirtIO. Guest-visible behavior stays common across KVM and WHP/WHPX; transport,
PCI configuration, device core logic, and backend interrupt injection remain
separate layers.

QEMU is the primary interoperability and differential-test oracle for applicable
devices, not the security specification. Equivalent guest workloads should
compare feature negotiation, descriptor and queue behavior, completion,
interrupts, reset/removal, errors, and boundary cases. Agreement with QEMU alone
does not prove specification compliance or security.

Selected UART, simple HID/PS2, PCI configuration, timer, framebuffer, or storage
emulation may support firmware, bring-up, testing, and legacy compatibility.
Normal MRML guests use paravirtualized devices. Large legacy-hardware emulation
does not become a foundational dependency without a concrete requirement.

Every device has explicit `create -> negotiate -> activate -> operate -> reset
-> suspend/resume (when supported) -> remove -> destroy` transitions. Reset
invalidates every descriptor and queue generation. Shared rings are preferred
for block, network, audio, graphics, storage, and high-rate input, avoiding a VM
exit per small operation while validating all guest metadata. Descriptor chains
are bounded for length, cycles, indirect entries, arithmetic, GPA range,
direction, alignment, queue size, and live device generation. Guests never
supply trusted host pointers.

Virtual devices are security boundaries. Long term, device implementations
should be isolated components/services with only the capabilities required for
their backend rather than one omnipotent VMM process. Device notifications use
a common abstraction over legacy injection where required, MSI/MSI-X-style
virtual interrupts, and event notifications.

The future display/3D device may implement applicable VirtIO-GPU interfaces,
but it must coexist with the existing MRML-specific CUDA compute path. VirtIO-
GPU does not silently become the CUDA ABI. Signed kernel-bundle admission,
authenticated queues, buffer capabilities, quotas, watchdog/reset, and CPU
fallback remain available through a separate MRML compute protocol wherever
VirtIO cannot express them. A VM may receive display and CUDA-compute devices
under distinct capabilities and lifecycle state.

### Network, audio, USB, and input services

Typed Ethernet, Wi-Fi, Bluetooth, persistence, shell/GUI parity, accessibility,
secrets, power, and restart policy are canonical in
[network/NETWORK_ADMINISTRATION.md](network/NETWORK_ADMINISTRATION.md). All are
**PLANNED** unless exact code/tests below establish otherwise.

**PLANNED:** networking remains a userspace service for applications in admitted microVMs,
which request bounded connection objects instead of raw packets. A VM receives
a VirtIO-net-compatible or MRML virtual NIC only with explicit authority such as
none, isolated, outbound-only, specifically routed, bridged, or raw access.
Guest NIC programming cannot bypass host firewall/policy. Baseline bounded
TX/RX, deliberate feature/ring selection, validation, interrupts, and reset
precede multiqueue and offloads.

Audio is a userspace service exposing capability-bound `AudioDevice`,
`PlaybackStream`, `CaptureStream`, `AudioRoute`, and `AudioSession` objects.
Playback and microphone capture are independent; capture is explicitly granted,
revocable, audited, policy-scoped, and shown through compositor-owned trusted
UI. VMs use a VirtIO-sound-compatible or MRML device connected to the service,
not physical hardware unless separately granted passthrough authority.
Application playback/capture, VM audio, system notifications, trusted
accessibility speech output, and trusted accessibility speech input are distinct
routes and authorities. Applications cannot capture trusted screen-reader audio
by default. Local recognition and deterministic semantic commands remain
possible without remote AI; remote speech processing is separately disclosed.

USB is managed by userspace controller/class services where practical.
Applications receive narrow class or interface objects rather than raw USB
transactions. Composite-device interfaces are independently grantable—for
example, webcam video without its microphone. VM passthrough revokes conflicting
host access first and makes reset, cleanup, DMA isolation, and reattachment
explicit. Dedicated paravirtualized input, storage, network, and audio devices
are preferred over emulating a USB controller merely to expose those functions.

Refreshable Braille displays, adaptive keyboards, switch controls, alternative
pointing devices, and other accessibility HID interfaces are explicit device
use cases. Prefer interoperable protocols and narrow interface delegation to
trusted accessibility/input services rather than raw USB.

Trusted input services route keyboard, pointer, touch, pen, and gamepad events
only to authorized native surfaces or selected VMs, optionally through
VirtIO-input or an MRML device. A focused VM receives ordinary routed events,
not global HID. Secure-attention sequences terminate in the trusted host and
cannot be intercepted by applications or guests.
Braille input and accessibility-device events use the same focus, isolation,
secure-attention, and capability rules. A focused application or VM never gains
global accessibility input. See [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Planned system services

Adaptive application/service placement is one policy over the existing process,
service, capability, interface, and VMM mechanisms. Its canonical model is
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md); it is **PLANNED** and must not
become a second sandbox architecture. First-party disk/image and optical services
follow [storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md).

The existing semantic system monitor is the single **PLANNED** observer for
authorized task, resource, integrity, device, platform-security, and recovery
state. Its canonical model is in
[monitor/SYSTEM_MONITOR.md](monitor/SYSTEM_MONITOR.md); monitoring does not join
the Gigakernel or replace supervision, policy, or owning services.

The capability-native authority broker will evaluate narrow requests and may
deny, allow, request trusted user consent, grant once, grant until process exit,
or grant for a duration. Consent UI remains outside the kernel and must be
difficult for untrusted applications to spoof. Temporary grants are revoked on
exit, expiry, policy change, or explicit action.

**PARTIALLY IMPLEMENTED:** the configuration-service foundation is typed,
schema-validated, transactional, capability-controlled, versioned, and
bounded-auditable. Kernel-message dispatch resolves authority only from exact
receiver-space capabilities derived by IPC; payload authority fields are
canonical zero placeholders, and extra, missing, or payload-forged authority
fails closed. The supervision adapter composes query and restart with existing
exact-object, cleanup, backoff, restart-limit, and trusted-context gates. Names,
numeric setting IDs, and service handles never authorize. A bounded CPL3
service-state syscall now exposes only the adapter's query mechanism: an exact
task-local READ capability authorizes one opaque generational service token,
reserved registers must be zero, and the result is limited to Running, Exited,
or Faulted. The canonical query envelope now crosses buffered IPC with exactly
one sender-derived READ capability; the userspace service rejects missing,
extra, or payload-forged authority, invokes the syscall, and returns only a
fixed detail-free response. Restart request bytes contain no time, launch
address, stack, or priority. Operation 10 admits only capability plus service
identity and remains detail-free denied unless trusted code stages a matching
reprovision plan. Planning and commit are split around that boundary: commit
rechecks the exact service generation, object, completed cleanup, policy budget,
backoff, and plan freshness before creating a task. KVM and WHP can now construct
a third independently rooted verified service image for the eventual management
client. Its image, stack, and page tables are disjoint, and it receives neither
the two-service shared page nor the receiver-only resource mapping. In the
focused restart-request image, an independent task enters that root, blocks,
then sends one canonical restart request after old-generation cleanup. It
transfers exact CONTROL; the receiver cannot supply launch context or time.
Trusted kernel code stages the host shared-leaf re-arm, commits the one-use plan,
provisions the fresh task and least required capabilities, and returns a fixed
response verified by the manager. Signed KVM and WHP probes cover that exchange
but stop before replacement execution; ordinary service-probe runs separately
cover fresh-generation re-entry. This remains hosted controlled-probe evidence,
not persistent policy, host-resistant isolation, or physical-hardware evidence.
The bounded CPL3 request-
buffer ABI decodes fixed payload/capability-
buffer descriptors and validates every active user leaf before a directional
copy. The signed service
probe now executes real `mrml-config` schema admission and atomic commit
dispatch under both WHP and KVM. Each generation begins with a trusted root
identity and no settings. A canonical admission request identifies a bounded
typed schema but delegates only root CONTROL; object IDs remain names. Schema
mutation freezes after commit. A separate commit keeps payload authority zero,
independently attenuates fresh configuration-root CONTROL and setting WRITE,
and applies revision 1 only after both derived opaque handles pass exact kernel
validation. The canonical 112-byte responses return over the same bounded IPC
path. The supervised replacement repeats admission and commit from fresh
volatile service state, without claiming persistence across cleanup. Two
simultaneous blocked buffered receives retain independent bounded state. Service page-table
frames and a host-published signed-image entry page are supervisor-only mapped
so active-root validation and recovery remain available without granting CPL3
access. A canonical bounded checkpoint now preserves schemas, values, global
and per-setting revisions, and the retained chronological audit window. Export
requires exact root READ; recovery into fresh state requires exact root CONTROL,
canonical invariants, and a caller-supplied expected SHA3-256 digest matching
the embedded digest. The checkpoint is now staged as the complete content of an
exact stable-file successor under independently checked configuration-root READ
and file WRITE/RESIZE authority. Object identity, generation, length, content
digest, extents, and metadata are bound before staging; activation requires the
existing atomic COW publication and exact one-use transaction receipt. Recovery
accepts only an exact authenticated-recovery-selected file generation under
file READ plus configuration-root CONTROL and never treats I/O uncertainty as
permission to fall back. This remains simulated service-library integration,
not live block-device persistence, physical power-loss evidence, or reboot-time
capability reconstruction. It is not a clone of the Windows Registry, and
secrets remain separate.

A canonical persistent restart-policy value now connects recovered
configuration to trusted service registration without turning data into
authority. The fixed record binds one service object, a nonzero finite restart
budget, and bounded base/maximum backoff; version, length, and all reserved bytes
are canonical. Loading rechecks exact READ authority for the schema-bound
setting, requires the record's service to match the trusted expected object, and
retains configuration and setting revisions. Applying it revalidates the live
capability, exact value, service binding, and both revisions immediately before
requiring mutable trusted supervisor access; revocation or configuration drift
invalidates the bound value. Later restart remains independently gated by
exact service CONTROL, cleanup, trusted time/context, backoff, and budget.
Revoking configuration READ prevents future loads and use of an unapplied bound
value but does not pretend to erase policy already installed into a live trusted
supervisor. Dynamic replacement now explicitly supplies that live setting READ
capability and a separate exact service CONTROL capability. Replacement
advances a bounded policy generation, invalidating every restart plan prepared
under the prior policy, while preserving consumed restart count and any already-
computed eligibility deadline. Policy-generation exhaustion preserves the old
policy and prepared plan. The versioned CPL3 protocol now requires exactly two
ordered IPC-derived capabilities: setting READ and separate service CONTROL.
Userspace re-reads the canonical record, checks a trusted service-object
mapping, and only then invokes the kernel mechanism. Identical signed artifacts
completed replacement and the subsequent authorized restart under hosted KVM
and WHP. Live persistent restoration and reboot-time capability/policy
orchestration remain pending. The storage-neutral checkpoint now has a reusable
exact-block composition over `BlockVolume` and its bounded `BlockFileSession`.
A deterministic test supplies that volume through a principal-bound,
capability-selected MRML block-service session, publishes with an exact one-use
COW receipt, recovers only the selected file generation, and reloads the bound
policy. Read-only attenuation and transitive session revocation fail before
backend writes. This remains simulation evidence, not live service, reboot,
power-loss, or physical-device evidence.
The kernel ABI now has a pointer-free policy-replacement operation carrying only
an opaque generational service token, one task-local capability, and bounded
restart-count/base/maximum scalars. Decode rejects malformed capabilities,
service tokens, policy bounds, overflow, and nonzero reserved registers before
dispatch. Service-probe dispatch independently authorizes exact service CONTROL
through the caller's capability space and returns only success or rejection.
This operation does not identify a configuration setting, infer a service
object from the token, or make policy bytes authoritative; those bindings stay
in userspace and its separately authorized configuration read.

Networking is planned around explicit authority and bounded connection objects,
not ambient sockets. Raw packet and device access require separate capabilities.
Firewall policy remains a service and provides defense in depth; a firewall
allow rule never creates network authority.

Connection authority should expose the application, destination/scope, protocol,
and lifetime as meaningful objects without treating DNS names as authority.
Specific connection capability is preferred to raw networking, and network-
service compromise must not imply kernel compromise. User-owned state should
have documented export or migration paths where practical; secrets require an
independent export capability and trusted consent.

The planned security monitor consumes structured, non-secret events and holds
only explicit observation/remediation capabilities. It is not an omnipotent
antivirus process. Stable event classes should cover authority decisions,
capability revocation, process/service lifecycle, artifact admission, networking,
and policy changes with monotonic sequencing and trustworthy time only when
available.

Local AI is eventually exposed as a capability such as
`ai.inference:<model/resource>`. AI agents receive the same least-authority
discipline as all software: **AI-native does not mean AI-privileged**.

The application platform does not inherit POSIX/C as its foundational ABI.
Ordinary MRML applications are intended to run as memory-safe code in admitted
microVMs, using a safe SDK over stable service protocols. Unsafe/legacy applications live
behind explicit VM compatibility boundaries. The trusted compositor, semantic
scene graph, HiDPI coordinate model, browser rules, and AI interaction boundary
are specified in [APPLICATION_PLATFORM.md](APPLICATION_PLATFORM.md). None is
currently implemented as an MRML OS application platform.
