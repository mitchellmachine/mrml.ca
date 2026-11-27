# MRML operating-system security model

This document states security boundaries and non-claims. Implementation details
and dated evidence are in [MICROKERNEL.md](MICROKERNEL.md).

## MRML security principles

1. No ambient authority.
2. Identity is not authority: names identify; capabilities authorize.
3. Power should be explicit, limited, inspectable, and revocable.
4. Memory safety is the default for ordinary native applications.
5. Minimize the trusted computing base.
6. One compromise should remain one compromise; one crash should remain one
   crash.
7. Transient compromise must not imply persistence.
8. Secrets can be usable without being extractable.
9. Intelligence does not imply authority; AI is never root.
10. Accessibility cannot bypass security, and security cannot arbitrarily
    disable accessibility.
11. Security enforces the owner's policy.
12. Remote attestation is owner-controlled and privacy-scoped.
13. Publisher metadata does not create authority.
14. First-party software gets no hidden privilege.
15. Data collection, metadata exposure, and retention are minimized.
16. Compatibility does not receive ambient privilege.
17. Claims require evidence.
18. Hardware-dependent claims require real-hardware evidence.
19. Secure defaults must not dispossess the machine owner.
20. Security mechanisms must not become general-purpose DRM against the owner.

These principles apply to applications, services, administrators, VMs, devices,
first- and third-party software, accessibility software, and local or remote AI.

## Trust boundaries

CPU age, generation, or marketing identity does not establish vulnerability
status. Final mitigation policy derives from exact identity, capabilities, and
resulting microcode state after an approved vendor-specific update attempt;
unknown security-sensitive state fails conservatively. Power profiles cannot
silently disable required mitigations. See
[platform/CPU_PLATFORM.md](platform/CPU_PLATFORM.md).

Hosted WHP/KVM is for development, compatibility, and measurement. A compromised
host controls guest RAM, CPU state, clocks, devices, entropy, keys, and results;
therefore it is not a security boundary against that host.

The experimental Windows VBS design targets only the documented VTL0 adversary
and trusts Hyper-V, the secure kernel, VTL1, Microsoft platform verification,
and the stated hardware/firmware base. It is local protected execution, not
remote attestation. Raw reports are unverified bytes and never authenticated
evidence. Only the verifier-enclave path may authenticate the same report bytes.

The intended bare-metal boundary places authority and receipt-key custody in an
MRML VMX-root monitor. The current nested-KVM VMX/EPT execution is a controlled
probe, not physical bare-metal proof. Bare metal still trusts CPU/microcode,
chipset, memory controller, RAM, the selected hardware root, firmware that
establishes the machine, and authenticated loader/kernel/policy. Compromised
UEFI, SMM, platform processors, hardware, and physical attacks are outside the
present enforceable boundary.

Devices, device firmware, DMA, networks, models, tools, external data, binary
formats, service messages, and host inputs are untrusted.

## Admission, receipts, and secrets

Versioned component admission follows
[packages/COMPONENT_INTERFACES.md](packages/COMPONENT_INTERFACES.md): signatures
authenticate provider provenance but do not prove ABI conformance, memory safety,
semantic correctness, or authorization. Metadata grants no capability. Bindings
select exact immutable generations, incompatible major ABIs fail closed,
executable pages are never patched in place, and prohibited generations receive
no new bindings. In-process providers share caller fault impact; service
providers remain isolated and explicitly capable.

Raw and receipt-authenticated admissions remain distinct types. An authenticated
receipt binds the exact canonical request digest, independently expected policy,
backend/mode, claims, image measurement, security version, nonce, sequence, and
debug state. Authentication from one mode cannot satisfy another mode. Invalid,
stale, mismatched, cancelled, or replayed requests fail without incorrectly
advancing replay state.

Secret release requires all of the following: an authenticated receipt, exact
request and policy binding, the exact allowed backend, non-debug execution,
proper one-use sequence/replay handling, and the documented measured sealed-key
claim. A raw report, host-visible marker, broker success, or self-asserted claim
can never release a secret.

The VBS broker is untrusted transport and holds no receipt key. Production VBS
keys are intended to be generated and sealed within VTL1 to exact non-debug
code. The bare-metal monitor derives its receipt key internally once after
entry; callers cannot inject or retrieve it. Bare-metal domain workload keys
remain internal to VMX root. These mechanisms are launch-local and do not by
themselves provide persistent identity, TPM sealing, physical-execution proof,
or remote attestation.

## Capability and isolation invariants

The planned adaptive placement policy is specified in
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md). Placement metadata never grants
authority, mandatory floors fail closed, and microVM capabilities are separately
projected and revocable.

Memory allocation is quantitative authority distinct from mapping and content
access. The security/acceptance gate is canonical in
[memory/MEMORY_RESOURCE_MODEL.md](memory/MEMORY_RESOURCE_MODEL.md).

- Object identity is not authority; names and data are not authority.
- Identity and provenance may select policy but do not grant authority.
- Capability derivation cannot increase authority.
- Object and task identities are nonzero, bounded, and generational; stale
  identities cannot regain access after slot reuse.
- Capability slot generation zero is invalid. Revocation advances generations
  with checked arithmetic; a slot at the terminal generation is cleared and
  permanently retired, and allocation reports explicit exhaustion rather than
  wrapping to generation one. This kernel mechanism and focused adversarial
  tests are **IMPLEMENTED**; it does not establish production assurance.
- Revocation precedes reuse and covers all derived state in the operation's
  boundary. Uncertain device/DMA teardown quarantines or fails closed.
- Boundary copies validate complete ranges, overlap, wrapping, alignment,
  length, reserved fields, and exact encodings before mutation.
- Buffered IPC completion retains a typed exact-capacity witness through the
  final trap-frame or saved-context publication; loose result scalars cannot
  replace the checked pending receive bounds.
- Buffered send descriptors and receive-token outputs use distinct element
  widths and complete checked user ranges; validating only their starting
  address is insufficient.
- Buffered payload input and output likewise require complete non-wrapping user
  ranges at syscall decode, before page-table walking or copying.
- Buffered payload and capability regions must be disjoint; exact adjacency is
  valid, but overlap fails before parsing or output mutation.
- Hosted service-probe buffered IPC copies use task-bound, directional,
  single-use active-user-copy tickets; pending capacity validation does not
  substitute for exact-length validation at resumed output-copy time.
- Capability-buffer byte lengths are checked once and retained through overlap
  validation and hosted token encoding rather than recomputed unchecked.
- A pending buffered receive is bound to its admitted page-table root as well as
  its generational task; completion under a substituted root fails closed.
- Resumed buffered completion takes its pending record before consuming the
  message, so duplicate or re-entrant completion cannot replay the same slot.
- Pending-record lookup requires a unique generational-task match and fails
  closed on duplicate internal state.
- The hosted service runtime and pending-receive table share one named
  three-task capacity; task capability spaces use a separate named nine-slot
  capacity rather than duplicated numeric configuration.
- Service-image receive adapters reject kernel-returned payload or capability
  counts beyond their exact supplied slices before exposing the result.
- Service-image capability-transfer descriptors have explicit ABI alignment;
  malformed width, count, alignment, or payload bounds fail before the trap.
- Configuration and supervision service-image dispatch releases each received
  leaf before response visibility; cleanup failure suppresses the response.
- Capability-release syscall denial covers invalid task-local handles only;
  unexpected runtime or delegation-integrity failure is fail-stop.
- Restart-policy replacement denial covers unknown service or unauthorized
  capability only; generation exhaustion and impossible lifecycle errors halt.
- Service query maps only lookup/authorization failure to absence. Split-phase
  restart maps documented policy drift or capacity exhaustion to denial, while
  terminal identity, generation, policy, or runtime errors fail-stop.
- Capability authorization maps only task-local IPC/capability errors to
  denial; missing task state or unexpected runtime errors fail-stop.
- Malformed service syscall arguments return a generic error with scrubbed
  result registers. Invalid privilege/return-frame state remains fail-stop
  pending safe task-scoped retirement rather than an unsafe `iret`.
- Boot-recovery operation 13 preserves the same distinction through an explicit
  `InvalidReturn` decoder result instead of conflating it with bad arguments.
- Service sends return scrubbed failure only for a kernel-classified precommit
  denial or malformed descriptor; scheduler and integrity failures fail-stop.
- Buffered-send payload, descriptor, decoded-handle, and requested-rights
  staging is erased at bounded last-use points on success and denial.
- Shared-buffer syscalls expose only scrubbed failure for proven precommit
  range, mapping, authorization, binding, and resource denials; uncertain
  backend effects and internal runtime/copy invariants remain fail-stop.
- Capability release classifies an impossible source revocation failure after
  descendant mutation as integrity failure, not a recoverable caller denial.
- Buffered send rejects invalid payload/descriptor userspace mappings without a
  global halt, erases prior staging, and still fail-stops on copy invariants.
- Buffered receive rejects invalid initial output mappings before dequeue or
  block, then revalidates saved task/root ranges at completion and fails stop on
  drift pending scoped retirement.
- Boot-recovery delivery exposes scrubbed precommit denials but fail-stops on
  output-copy uncertainty after consuming its one-use authority.
- The boot-recovery executor reports user-range validation and post-consumption
  copy failure as distinct typed phases; callers need not infer commit state
  from backend-specific errors.
- The shared-buffer executor also separates user validation from copy failure;
  only the typed validation phase is admitted as a caller denial.
- The task runtime represents invalid user return state as a typed protocol
  violation, revokes the complete task domain before peer notification, and
  never misreports it as a hardware exception. The service supervisor records
  exact `Faulted` state and a one-use cleanup ticket. Live syscall decoding now
  completes scoped cleanup and kernel-selected handoff; a dedicated QEMU probe
  remains pending.
- Return-frame privilege, instruction, stack, and flags validation uses a
  dedicated typed error distinct from ordinary syscall argument decoding; the
  compatibility request decoder maps that closed set exhaustively.
- Boot-recovery decoding preserves the exact typed return fault before request
  data is interpreted, while live service policy retires every member of that
  closed set identically.
- Generic live service decoding distinguishes typed return faults from request
  errors at the API boundary, preventing future request-error additions from
  silently changing retirement policy.
- The scoped protocol-violation and peer-death records preserve the exact typed
  return cause; the authorized observer can distinguish privilege, instruction,
  stack, and flags failures without receiving unrelated task state.
- Buffered receive mapping drift has a distinct scoped protocol-violation type,
  rather than being conflated with a forged return frame. Live completion
  revalidates before dequeue and restores the prior page table before scoped
  retirement, so unread message authority remains confined to the retiring
  domain. Runtime retirement is tested and profiles build; execution remains
  pending.
- Dedicated buffer-drift images exact-match and remove only the blocked
  receiver's writable, non-executable user leaf, then require typed scoped
  retirement and clean peer exit markers. KVM admission requires one verified
  signed service and exact ordered markers; actual backend execution remains
  pending.
- Immediate and blocked buffered receive use one atomic capacity/dequeue rule;
  insufficient capacity leaves content and capabilities queued. Resumed
  completion restores the prior page table before returning a scrubbed retry
  error.
- A capacity-denied receive does not consume or orphan derived authority; a
  focused test retrieves the exact attenuated handle only after sufficient
  capability capacity is supplied.
- IPC delivery verifies the receiver's exact scheduler identity before any
  capability transfer or enqueue, preventing a late wake failure from leaving
  an apparently failed message queued.
- Inbox indices, occupied count, head, and tail topology are validated before
  delivery or receive mutation, preventing corrupt ring state from causing
  partial capability transfer or endpoint sequencing.
- Control receive validates message-ring integrity before consuming a lifecycle
  event, so unrelated corruption cannot suppress or destroy peer-death evidence.
- Live control peers and pending death results are unique, disjoint, and bound
  by one aggregate capacity before any control-state mutation.
- Both IPC endpoints must retain exact scheduler identities before endpoint
  sequencing, capability transfer, enqueue, or wake can begin.
- Symmetric control-peer connection verifies both scheduler identities before
  authorizing or publishing either side of the relation.
- The non-queued direct transfer primitive enforces the same two-endpoint
  scheduler identity requirement, preventing wrapper bypass.
- New transfer and retirement validate every delegation edge's exact live
  endpoints and unique destination before mutation, so stale graph state cannot
  be extended or partially revoked.
- Direct IPC checks exact SIGNAL authority and sequence capacity before deriving
  receiver capabilities. Its one-use plan binds endpoint object and current
  sequence; denial and exhaustion create no authority, while a stale commit is
  an integrity failure.
- Cross-domain capability derivation validates the complete requested set and
  receiver capacity before publishing any child, eliminating partial-transfer
  rollback as an ordinary failure path.
- Message shape inspection and message/control dequeue require the receiver's
  exact scheduler generation before observing or consuming queued state.
- Task capability-space access and exact authorization require the same live
  scheduler generation, so an orphaned domain record cannot retain an authority
  path through runtime accessors.
- Immutable and mutable saved-context access requires the domain's exact live
  scheduler generation as well.
- Every task-domain lookup requires one unique generational identity; duplicate
  records fail before authority access, migration, dequeue, or retirement.
- The inbox ring requires an exact contiguous circular occupied segment from
  head to tail; exhaustive bounded-state coverage rejects every other topology.
- Delegation edges require matching live source/destination objects, DELEGATE on
  the source, and destination rights no broader than the source before graph use.
- Cross-domain attenuation rejects zero-right capability children before any
  receiver slot is published.
- Capability-space insertion rejects zero-right roots before consuming a slot.
- Zero-right authorization cannot disclose a live capability's object identity;
  internal revocation validation uses a private exact metadata path.
- Control receive and connection require every live peer to remain scheduled and
  exactly reciprocally linked before consuming or publishing control state.
- Stable peer-death evidence cannot name the observer or an identity that remains
  scheduled or owns a live task domain.
- Delegation ancestry is acyclic; bounded validation rejects any child that is
  already an ancestor of its source before graph use.
- Buffered-send capability descriptor parsing is transactional; late invalid
  tokens, rights, or reserved bytes cannot publish a partial decoded prefix.
- Service-visible send denial uses a closed precommit error set; malformed,
  replay, shape, buffer, or invalid-plan errors remain integrity-class failures.
- After scheduler confirmation, direct send requires exactly one sender and
  receiver domain; missing or duplicate records are integrity failures.
- Queued delivery requires exact endpoint SIGNAL authority before receiver inbox
  topology or capacity is observed, preventing unauthorized fullness probes.
- Direct send prepares endpoint authority before delegation graph integrity or
  table capacity is observed, preventing unauthorized kernel-state probes.
- Sender endpoint authentication precedes receiver scheduler/domain lookup;
  unauthorized callers cannot probe whether a receiver identity exists.
- Queued delivery carries one capability-generation-bound endpoint send plan
  from authentication through commit, avoiding a second authority snapshot.
- After authentication, same-task delivery is rejected before receiver lookup
  or inbox inspection, so inbox capacity cannot supersede the routing invariant.
- Authenticated message shape is bounded before receiver inbox or delegation
  state is inspected, preventing malformed sends from probing those capacities.
- Requested source delegations are validated as a complete non-mutating batch
  before receiver identity, inbox capacity, or internal delegation state is
  inspected.
- Receiver capability capacity is preflighted without mutation before queued
  inbox or delegation graph/table state is inspected.
- Delegation-table capacity denial precedes graph inspection once caller and
  receiver request preflights pass, and precedes queued inbox inspection,
  avoiding integrity-detail and inbox-capacity disclosure.
- Exact delegation tracking slots are reserved before receiver capability
  mutation, eliminating fallible slot discovery after authority publication.
- Endpoint sequence advances only after the exclusively enclosed capability and
  delegation publication succeeds; publication failure leaves it reusable.
- Queued delivery reserves exact inbox publication state before authority
  transfer, eliminating fallible tail discovery after transfer commits.
- Receiver wake generation is reserved before IPC mutation and consumed after
  inbox publication, eliminating fallible scheduler lookup after commit.
- Peer-death publication reserves every exact peer wake generation before any
  reciprocal relation or death-event mutation.
- Peer-death preparation also reserves each peer's exact domain, reciprocal
  relation, and empty death-event slots, so authority cleanup cannot be followed
  by a fallible publication lookup.
- Control-peer connection reserves both exact reciprocal slots before either
  relation is written, preventing a one-sided partial connection.
- Scheduler attach/migration creates a destination directly in its final state;
  detach/migration consume a prevalidated exact source generation, avoiding
  fallible post-publication state changes and best-effort rollback.
- Service exit, fault, and violation reserve exact supervisor identity and
  restart-deadline state before runtime retirement; cleanup/stopped publication
  has no fallible identity check after the task is irreversibly retired.
- Constructed device-service stop requests are data, not device-quiescence or
  teardown authority. The manager must retain the exact runtime-bound active
  owner and one-shot teardown lease, freeze the task before reacquisition,
  quarantine substituted acquired state, and destroy borrowed register,
  command-memory, and data-buffer views before retirement or unmapping.
  Failure retains the exact frozen owner for retry or fail-stop, and successor
  dispatch remains withheld through cleanup; generic exit, cleanup, and restart
  remain unavailable to constructed device services.
- Direct CPL3 device MMIO is user-accessible only in the exact isolated driver
  address space, never ambient user memory. Its leaf must be read/write, NX, and
  use the dedicated device-PAT selector; the privileged mapper must separately
  prove that the selected PAT entry is UC, exclude cacheable aliases, and bind
  active-root and translation-cache withdrawal to the device/mapping
  generations. The current AHCI preactivation owner enforces the bounded
  inactive subset by requiring the live mapping/control capabilities and a
  structurally valid descriptor whose ABAR generation/geometry match the
  launch, then matching the construction-pending task generation, owning
  runtime, saved CR3 root, service-domain target, and launch-bound ABAR. Its
  private backend is not a generic mapped-task backend; explicit rollback
  returns the prepared task only after exact withdrawal, and uncertain rollback
  retains the owner while poisoning the hierarchy. A separate non-copy owner
  now combines this concrete inactive ABAR hierarchy with the four exact
  launch-named CPU mappings in one retained `MemoryPoolTable`/page-table
  adapter, verifies all five leaves and mapping records, and withdraws CPU
  mappings in reverse order before ABAR. Canonical AHCI launch record V2 binds
  PCI location/vendor/device identity beside the configuration generation,
  ABAR geometry, and capability-bound device object; both concrete owners
  reject descriptor substitution before mutation. The trusted launcher must
  establish that initial correlation because record data cannot authorize it.
  This is not an activation seal: full-lifetime root uniqueness, PAT3=UC, and
  alias exclusion remain unsafe caller obligations. A retained owner can now permanently quarantine its exact blocked
  construction generation in the owning runtime; runtime substitution preserves
  the unchanged owner, and quarantine never converts mapping state into an
  activation token. Native-service validation and scheduler activation
  preparation reject a second live runtime domain with the same saved CR3, and
  mapping-set verification inherits that bounded scan. It is only a
  runtime-local snapshot: full-lifetime active-root ownership, activation-time
  effective-leaf revalidation, SMP TLB withdrawal, and IOMMU teardown remain
  required.
  Generic syscall/user-buffer copies reject device-selector leaves so
  non-volatile byte-copy machinery cannot access registers.
- Restart commit publishes and returns the exact service/task generations as
  one typed result, so recovery and service dispatch do not rediscover task
  identity through a fallible lookup after creation.
- Service registration admits each exact task generation and live service
  object into at most one supervisor slot, rechecks both at commit, checks the
  object before atomic-launch task creation, and preserves full/stale-plan
  denial precedence so those denials do not disclose membership.
- Service state inspection requires exact `READ`, while restart preparation and
  policy replacement require exact `CONTROL`; combined overbroad handles cannot
  cross those separately authorized boundaries.
- Timer preemption binds the current unique domain before advancing scheduler
  state and performs no fallible domain lookup afterward.
- Fault, protocol-violation, and voluntary-exit retirement reserve the exact
  current scheduler generation before peer or domain mutation and consume it
  after peer-death publication without a fallible scheduler lookup.
- Transitive capability revocation reserves every exact descendant domain slot
  and capability generation before clearing any authority; its bounded commit
  performs no fallible domain or capability lookup.
- Buffered receive preflights and binds its exact empty pending-table slot before
  scheduler blocking, preventing late capacity discovery after state mutation.
- Pending buffered completion revalidates zero-capacity address canonicality and
  payload/capability output disjointness before dequeue or user writes.
- Pending buffered completion binds the exact table slot and complete record
  before context/mapping validation and consumes that record without a repeated
  task-key search before dequeue or scoped drift retirement.
- Pending-layout arithmetic overflow is a scoped invalid-layout result, not an
  assertion or global halt condition.
- Exit, fault, and protocol-violation peer-death publication preflight the
  complete reciprocal graph before domain or scheduler mutation. Corrupt or
  duplicate relations and unavailable result capacity fail without partial
  retirement. Every peer's exact scheduler identity is also required before
  publication, preventing late wake discovery after relationship mutation.
- Retirement validates one bounded union of descendants across every
  task-owned delegation root before revoking any derived capability, preventing
  a stale later root from causing partial cross-domain revocation.
- Warning-free invalid-return probe images use a real CPL3 zero-stack interrupt
  and exact typed-cleanup/peer-exit markers; these remain unexecuted until a
  backend runner admits the dedicated mode. KVM now admits it only with a
  verified service artifact and exact ordered markers; its validator rejects
  noncanonical expectations, reversed stages, and unrelated exits. Execution
  and WHP parity remain pending.
- The MRML-native ZIM consumer applies the same exact-capacity rule at its
  buffered-receive boundary and uses explicitly aligned exact-width storage for
  its outgoing capability descriptor.
- Writable and executable mappings are mutually exclusive.
- Authority, replay state, ownership, mappings, and lifecycle transitions are
  explicit and commit only after validation; partial failure rolls back or
  leaves a fail-closed state.
- One service fault must not confer authority on another service or require an
  unrelated kernel/system failure.
- Temporary capabilities must actually expire and revoke every derived path;
  disposable domains must not silently retain persistent authority.
- Secret `USE` does not imply `EXPORT`; remote AI receives no secret material or
  export right by default.
- Debug authority is exact-target and rights-scoped, never implicitly global.
- AI control is not user/root authority, and provenance labels never replace
  capability enforcement.
- Storage and optical inspection, health, content, write, erase, burn, eject,
  and delegation rights remain separate and exact-generation as defined in
  [storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md).

Compromise cleanup generalizes the Phase 1 lifecycle rules: revoke task/service
capabilities and descendants; remove native mappings; invalidate IPC, queues,
shared state, cached decisions, and exact generations; destroy stale credentials
and tokens; clean or quarantine device/DMA assignments; erase sensitive transient
state; and restart only from independently validated state. Half-complete cleanup
fails closed. Successful code execution in one component cannot create durable
authority unless the principal separately holds the narrow persistent-object
capability for startup, service replacement, configuration, executable trust,
credentials, boot state, or firmware.

Dynamic supervision-policy replacement treats cached configuration as data,
not authority. Application requires an explicitly supplied live READ
capability for the exact schema-bound setting and rechecks its value plus global
and setting revisions immediately before mutation. The supervisor separately
requires exact CONTROL for the service object. A bounded policy generation
invalidates restart plans prepared before a change; generation exhaustion is
non-mutating. Replacement preserves consumed restart count and an already-
computed eligibility deadline, so rewriting policy cannot manufacture retries
or shorten pending backoff.

The policy-replacement syscall is pointer-free and separately bounded. Its
service token identifies a live supervisor slot but supplies no object
authority. The kernel decodes a finite valid restart policy, rejects every
reserved or overflowing scalar, and then authorizes exact CONTROL in the
calling task's capability space against the supervisor's live service object.
Completion exposes one success bit and no object, generation, rights, policy,
budget, timing, or denial detail. It accepts no configuration-setting claim.
The userspace protocol keeps a trusted service-object mapping, revalidates the
canonical record through an IPC-derived exact setting READ capability, and
requires a second ordered IPC-derived exact service CONTROL capability before
invoking this mechanism. Missing, extra, reordered, stale, or payload-forged
authority fails closed.

Configuration checkpoint storage can now use the exact-block volume through a
principal-bound MRML block-service session. Configuration-root READ, stable-file
WRITE/RESIZE, block-session operation rights, exact object/generation/extents,
complete digests, publication generation, and one-use receipt remain distinct
checks. Device identity and checkpoint bytes authorize none of them. A derived
read-only block session fails before backend mutation, and revoking its parent
stales the complete session lineage. Fresh identical signed artifacts now run
this composition in isolated CPL3 tasks under hosted KVM and WHP. Operation-
specific local shared-buffer handles remain separate from transfer authority,
and received leaf capabilities are released after every request. The backend
is volatile kernel-owned memory, so this is controlled hosted evidence, not
reboot, durability, power-loss, host-resistance, or rollback-resistance
evidence.

Reboot-recovery composition now validates dependent configuration and its exact
service-bound restart policy while reconstructed storage authority remains
private to one consumed transaction. The authenticated monotonic store advances
only after that validation succeeds, and neither authority nor policy is
released if validation, storage I/O, conflict detection, or compare-and-store
is uncertain. The validator is an explicit unsafe side-effect-free boundary;
checkpoint bytes, reconstructed handles, object identities, digests, and policy
records remain non-authorizing data outside the exact capability checks.
Service registration is split around that boundary: immutable planning binds an
exact vacant supervisor slot/generation, service object, task, and validated
restart policy; consumed commit rechecks the slot only after authenticated state
has advanced. A distinct committed-authority type prevents safe code from
releasing a recovered service from pre-commit reconstruction. Epoch mismatch,
slot reuse, capacity loss, or registration failure drops the recovery result.

## Persistent state and boot

Firmware mutation and Secure Boot policy follow
[platform/UEFI_BOOT_MANAGEMENT.md](platform/UEFI_BOOT_MANAGEMENT.md): typed
generational transactions, re-read verification, owner-controlled keys,
SecretObject use/export separation, versioned Windows/Option-ROM compatibility,
monotonic revocations, dual-boot preservation, and physical evidence gates.

Package/update/deployment security follows [DEPLOYMENT.md](DEPLOYMENT.md): UEFI
authentication and MRML release authentication are separate; GitHub is transport,
not trust; individually valid packages do not form a release automatically;
catalog and generation rollback/freeze protection is mandatory; imaging cannot
export non-exportable secrets; and disk destruction requires authorization bound
to the exact revalidated transaction.

Signed images alone do not prevent rollback. TPM-backed or equivalent
authenticated, monotonic, power-loss-atomic storage; measured boot; exact
artifact-set admission; corruption handling; recovery; and key rotation remain
required. Development signing is not production Secure Boot.

The legacy loader path extends a canonical selected-set record after separate
authenticated kernel and service payload events. Manifest-configured boot now
requires bounded kernel, VM, service, CUDA, and launch-policy bundles, admits
each through the exact same `VerifiedRelease`, and publishes no root transition
while any kind is absent or invalid. It separately extends every authenticated
payload and a canonical 512-byte version-3 set record containing a distinct
manifest identity plus all five ordered artifact identities. Zero identities
fail before measurement, and the measured-boot flag requires every extension.
The additional firmware buffers are zeroed and returned before memory-map
handoff. This is code and hosted-test evidence, not firmware/TPM execution,
owner trust-root persistence, remote attestation, or direct measurement and
independent verification of configuration and compiler/runtime artifacts;
Phase 6 remains partial.
The configured policy artifact is now required to decode as the canonical
release build receipt before a new journal transition can publish. Its kernel
and service identities must match the exact authenticated payload lengths and
SHA3-512 digests, and all six recorded digests must be nonzero. This binds the
remaining recorded source, lockfile, loader, configuration, and tool
declarations into signed generation evidence, but does not independently
verify those input bytes at boot or prove truthful compiler/runtime identity.
Receipt contents remain data, grant no authority, and cannot widen any
manifest capability or owner trust decision.
At the release-manifest boundary, callers can no longer extract a per-kind
minimum-version trust root and accidentally admit a later artifact into an
earlier verified release. `VerifiedRelease` now authenticates only the exact
manifest release and exact requested kind; executable payload parsing follows
that check. Tests reject both older-manifest/newer-artifact and newer-manifest/
older-artifact substitution plus kind substitution. This is unit-tested
admission machinery, not UEFI manifest integration or durable release commit.
Manifest admission also rejects every root-role collision: the next manifest
root and five artifact roots must be pairwise distinct, and none may equal the
current authenticated manifest-signing root. This prevents one Lamport key from
being authorized for a second statement or a different artifact role. The
check is local key-lifecycle enforcement, not proof that external backups were
destroyed or independently controlled.
Release-state compare-and-store now binds all 152 authenticated predecessor
bytes, closing same-floor current-root and installed-manifest substitution. A separate 200-byte
two-slot journal writes and verifies the inactive successor before advancing
its authenticated monotonic counter, then reloads the selected state. Corrupt
slots, stale predecessors, failed writes, pre-commit failures, uncertain
committed advances, read failure, and sequence exhaustion fail closed in
deterministic tests. Its unsafe backend still requires fixed owner-provisioned
objects and real power-loss-atomic behavior. The UEFI adapter now admits a
separate counter and two exact 200-byte full-write objects by complete public
area and recomputed Name, consumes fresh exact-operation policy sessions,
read-verifies writes, checks exact counter succession, and rejects index alias
with the recovery journal when both layouts are checked together. Deterministic
tests exercise these properties; no provisioning, reboot, physical power-loss,
or rollback-resistance evidence exists.
The authenticated state includes the exact installed-manifest digest, allowing
later boots to reconstruct the committed release authority without replaying
the consumed one-time transition. The firmware submission boundary is bounded
at 256 command bytes, large enough for the 235-byte release write without
permitting unbounded input.

When configured, the UEFI loader derives both kernel and service authority from
one authenticated release. An installed-manifest digest permits repeat boot
without reusing the consumed transition key; a different manifest must verify
as a new transition under the current root. Publication occurs only after both
signed containers and PE images pass exact-release admission, and before PCR 11
extension so the journal's read/write PCR policy remains coherent. Complete
release and recovery layouts must be index-disjoint. Required mode rejects an
absent or partial release configuration; optional development mode still uses
the legacy independent embedded roots.
The typed pending-release transaction makes incomplete publication fail closed:
neither manifest authentication alone nor one valid executable can advance the
journal. A state conflict retains the pending transition for a serialized retry;
repeat admission of the installed manifest performs no counter write. Exact
predecessor and successor bytes are erased when the transaction is consumed or
dropped.
The handoff represents manifest admission with its own canonical flag rather
than inferring it from version or PCR success. Production `BootPolicy` rejects
the legacy path even if Secure Boot, measurement, and a rollback counter are
present; development policy may opt into it. This loader evidence does not
manufacture authority for missing manifest artifacts and is not attestation.
An admitted monotonic release journal satisfies loader rollback evidence without
also requiring the legacy standalone counter. This avoids treating two counters
as one authority while retaining compatibility; physical resistance remains
unverified.

The UEFI TPM parser can now validate the exact public identity of a planned
owner-policy recovery layout: one monotonic counter and two full-write ordinary
slots under a shared nonzero policy digest, with every SHA-256 TPM Name
recomputed from its complete public area. This prevents numeric-index, type,
size, attribute, policy, and returned-Name substitution during admission. It
now feeds bounded TPM NV read/write/increment commands. Each operation consumes
a fresh one-use authorization from an unsafe owner-policy provider bound to the
exact Name, shared policy digest, and operation; safe code cannot construct that
session. Full slot writes are read-verified and counter advancement rechecks the
exact predecessor and successor. A concrete provider starts a fresh unsalted,
unbound SHA-256 policy session using explicit nonzero caller entropy, executes
one exact configured `PolicyPCR` recipe, and accepts only the requested next NV
operation. The concrete provider exists only after admission of the three exact
index/Name/policy tuples, and the next command must repeat the admitted index in
both handle fields along with the exact operation and session handle. Zero or
immediately reused caller nonces fail closed. Operation
mismatch, policy failure, and a malformed nonce following
a valid returned session handle trigger best-effort cleanup. The TPM still
enforces the admitted NV index's exact policy digest; the provider does not
derive authority from PCR data or expose remote attestation. The provider does
not provision the owner policy, authenticate an owner UI, establish transport
confidentiality, prove firmware integration, or establish physical durability,
so this remains protocol evidence rather than rollback-resistance evidence.
The safe journal constructor first admits all three exact NV public identities
on the raw transport, then constructs the provider from that sealed admission;
mismatched layout policy never yields a usable store.
The UEFI loader's optional development integration requires all six exact
configuration fields together, obtains every session nonce from a separate
firmware RNG call, and authenticates only the counter-selected slot before
`ExitBootServices`. Partial configuration and all TPM/RNG uncertainty fail
closed; temporary recovery bytes are erased. This admission is not owner
provisioning, authority reconstruction, artifact rollback evidence, remote
attestation, native UEFI execution evidence, or physical durability evidence.
The recovery-enabled loader now links as an optimized native
`x86_64-unknown-uefi` image. Its direct crypto dependency disables the unused
host-runtime default feature, and dependency inspection confirms filesystem,
network, process, and other `mrml-runtime` host facilities are absent from the
firmware graph. This reduces ambient code and capability surface but is linkage
evidence only, not physical TPM evidence. A fresh QEMU/OVMF nested-KVM boot of
pinned, independently signed kernel and service artifacts subsequently reached
the exact trace `a1 a2 a3 a4 a5 a6 a7 a8 b1 b2 b3 d0 d1 d2 d3 d4 df`. This
proves controlled loader and kernel execution, but recovery configuration was
absent because no software TPM was available. It is not recovery-journal,
Secure Boot, bare-metal, physical TPM, power-loss, or rollback-resistance
evidence.
Canonical recovery metadata crosses the loader/kernel boundary only in its own
optional fixed-size handoff record. Both encoder and decoder require nonzero
epoch and handle generation, zero reserved bytes, and an all-or-none nonzero
volume/root pair. Its flag is independent of rollback-protected boot evidence,
and the decoded value is explicitly data: it cannot authorize storage recovery
or manufacture a capability.
Storage recovery can now consume that data only by wrapping the independently
authenticated state store for one transaction. The authenticated load must
match all handed fields, and compare-and-store must reuse the exact loaded
record. Duplicate load, duplicate commit, handoff/store substitution, malformed
state, and backend uncertainty fail closed and erase exposed state bytes. This
binding does not bypass owner-approved checkpoint proof, exact capability-
authorized file selection, attenuation checks, dependent validation, or the
monotonic publication gate.
Kernel delivery is independently bound to one exact live task generation, one
object, and an exact non-delegable `READ` capability. The capability and tracked
descendants are revoked before the fixed metadata record is copied; successful
copy consumes the record. Wrong task/object, excess rights, stale generation,
replay, and service replacement return zero bytes. This is a narrow mechanism,
not an ambient recovery-state query or kernel-owned storage policy.
The isolated syscall adapter accepts only the opaque capability, one canonical
output address, and zero reserved registers. It validates the complete exact
current-task writable range before revocation, consumes one directional copy
ticket, erases kernel scratch on every return, and treats a copy failure after
revocation as terminal delivery uncertainty rather than retry permission. This
is unit-tested mechanism, not live boot-path or physical evidence.
The kernel-image service path now routes that operation before generic syscall
decoding, rechecks the complete user return state and active address-space root,
and constructs the metadata-only capability/delivery for one exact initial task
generation only when the handoff contains recovery metadata. This launch-policy
capability authorizes only the one-use metadata copy; the metadata itself still
cannot authorize storage recovery. The image and service compile for the UEFI
target. Fresh independently signed WHP and KVM controlled probes passed a fixed
recovery record through the handoff, initial-generation capability, launch ABI,
operation-13 dispatcher, active user-copy adapter, and service-side decoder
before exact lifecycle cleanup completed. The public test record grants no new
storage authority. Hosted WHP/KVM remain controlled by their hosts; this is not
native UEFI, TPM, persistence, reboot, rollback-resistance, Secure Boot, or
physical evidence.
The signed service now additionally binds the decoded handoff record through
`BootRecoveryAdmission` to a separately constructed controlled test record
before it becomes ready. It requires one successful exact load followed by a
rejected, zero-output replay, then erases all copies. The client receives the
metadata only as data and independently binds it before the existing dependent
authority-recovery transaction. Owner-approved checkpoint proof, temporary
attenuated capability reconstruction, configuration and policy validation, and
an exact epoch/generation/root successor all precede release. Mismatch,
malformed bytes, replay, stale expected state, or successor substitution halts
without releasing recovered authority or configuration. The controlled provider
is volatile test code, not authenticated hardware or durability evidence.

**PLANNED:** owner policy selects boot trust roots and authorizes each measured
system generation. Recommended project keys are defaults, not a hidden vendor
veto. Owner key enrollment/replacement, owner-built and narrowly scoped
development authorization, compromised-key revocation, accessible recovery,
authenticated rollback-resistant updates, and explicit security-state reporting
must coexist. Update infrastructure may not silently replace trust policy,
delete owner-authorized software, or disable owner builds.

Remote attestation is a capability delegated by the owner to a specific verifier
for specific claims and lifetime. Prefer selective claims and per-verifier or
ephemeral pseudonyms over a stable device identity or complete software
fingerprint. Websites and applications receive no universal exact-machine
attestation by default. Attestation cannot silently become DRM or tracking.

Release infrastructure inventories exact compiler/tool versions, dependencies,
unsafe/FFI/assembly boundaries, and signed artifacts; supports reproducible builds
and independent source-to-artifact verification where practical; and documents
key rotation and compromise recovery. A valid signature establishes identity and
integrity under a trust policy, not software safety.

**PARTIALLY IMPLEMENTED:** release-signer outputs use native exclusive creation
and do not replace existing paths. Signing consumes the one-time private key
before output publication, preferring a safely aborted release over publishing
while reusable key material remains. This is a local tooling invariant, not
evidence of independent custody, durable deletion, reproducibility, rotation,
recovery, Secure Boot enrollment, or production security.

**IMPLEMENTED as owner-selectable provisioning input:** `mrml-sign
bootstrap-state` derives the initial manifest-root digest from an exact
caller-selected public key, requires a nonzero rollback floor, validates the
canonical state, and exclusively creates the output. No project/vendor key is
implicit. `inspect-bootstrap-state` performs structural parsing only and emits
`authentication=not-verified`; it cannot turn a file into authenticated state.
These commands handle no private key and grant no boot authority. They do not
prove owner consent, provision TPM NV, replace or revoke a live root, authorize
development mode, or provide accessible recovery.

**IMPLEMENTED as bounded comparison infrastructure:** canonical build receipts
omit ambient host identity and paths while binding declared tool versions,
target/profile, a canonical source archive, dependency lockfile, unsigned boot
artifacts, and selected configuration by length and SHA3-512. Strict parsing
and byte-exact comparison detect changed recorded inputs or outputs. The receipt
is untrusted evidence until independently produced and reviewed; it grants no
authority and cannot prove that a builder was clean or its declarations honest.
The UEFI linker policy fixes the non-authoritative PE timestamp and omits the
nondeterministic embedded debug identity from signed boot artifacts. Separate
debug evidence remains possible. A same-host, separate-root controlled build of
exact commit `6976f8f`, using committed configuration and an empty selected test
configuration, matched the unsigned kernel/service/loader receipts. No
independent-builder, cross-host, or complete configured-release result has been
recorded.
The same strict parser is shared by the signer and kernel/loader boundary. It
rejects overlong input, alternate field order, noncanonical numbers or hex,
carriage returns, missing final newline, extensions, wrong target/profile,
zero identities, and authenticated kernel/service substitution before release
publication.

Do not claim verified boot, rollback resistance, DMA isolation, device reset,
confidential computing, side-channel resistance, formal noninterference,
physical hardware validation, or production security until the corresponding
implementation, adversarial testing, physical evidence where relevant,
reproducibility, and independent review exist.

## Security events and monitoring

The canonical **PLANNED** state, event, integrity, privacy, resynchronization,
and response boundaries are in
[monitor/SYSTEM_MONITOR.md](monitor/SYSTEM_MONITOR.md). It extends this observer;
it does not introduce a parallel security or integrity authority.

Planned privileged audit events use stable typed classes, monotonic sequences,
actor/target/object identities, decisions, and reason codes. Time is included
only when trustworthy. Events must avoid secrets and cannot be forgeable or
erasable by ordinary services. Monitoring and remediation remain separate,
narrow capabilities; high-impact remediation requires policy authorization or
trusted consent.

Security-sensitive delegation will use structured events such as capability
grant/derive/transfer/revoke/expire/deny, secret use/export request, debug grant,
device assignment, and AI session start/revoke. Records identify only necessary
principals and objects and never secret contents. Introspection and “why access?”
queries are themselves authorized and privacy bounded.

Audit is not surveillance. Each event class must define purpose, retention bound,
read/erase authority, redaction, and any justified prohibition on erasure.
Metadata is preferred to content; MRML does not create a permanent record of
every file read, page visited, keystroke, or AI prompt without a separate narrow
purpose. Logs are structured, bounded, capability-controlled, and secret-free.
Crash reports default to local structured diagnostics; remote submission follows
inspectable owner policy and strips unnecessary memory, names, credentials,
semantic content, and identifiers.

Structured diagnostics separate observation from mutation: permission to inspect
a fault object does not grant kernel memory, debug, or repair authority. Security
UI consumes trusted capability/lifecycle state, not application-provided claims.

For AI prompt-injection defense, content provenance survives browser/document/
email/media/source/remote-service ingestion into model context. Untrusted text
cannot become a trusted instruction merely by wording itself imperatively, and
model output cannot exceed the tool capabilities held by the AI session.

The safest unnecessary data is data never collected. Authority to observe does
not imply authority to retain, correlate, repurpose, train on, redistribute, or
disclose. `OBSERVE`, `RETAIN`, `EXPORT`, `CORRELATE`, and
`TRAIN/SECONDARY_USE` are distinct policy concepts where relevant. The kernel can
enforce local capabilities and disclosure boundaries; provider behavior after
remote disclosure is a separately stated provider/policy expectation, never an
unverifiable kernel privacy claim.

Consent surfaces show requester, object, rights, purpose where available,
duration, off-device disclosure, delegation, and revocability, with deny,
one-shot, session, and narrow persistent choices where appropriate. Safe
defaults, attenuation, grouping, and contextual delegation limit prompt volume;
prompt frequency and denial behavior are tested because habituation is a
security failure.

Core operation requires no telemetry. Any future telemetry has a separately
defined purpose, exact inspectable fields, minimal identifiers, bounded retention,
and genuinely optional owner policy where feasible; diagnostics is not blanket
collection authority.

## Exploit mitigation and evidence

NX/W^X, page-table write/execute separation, CET, IBT, shadow stacks, IOMMU/DMA
isolation, and architecture-appropriate memory tagging are defense in depth, not
substitutes for least authority and isolation. Claim them only at the cumulative
scope actually reached: `IMPLEMENTED`, `TESTED`, `MEASURED` where applicable,
and exercised on real hardware where hardware behavior is material. Virtualized
or nested evidence cannot establish physical IOMMU, DMA, VT-d, VMX, device-reset,
Secure Boot, TPM monotonic-state, CET, or IBT behavior.

Continuously fuzz IPC and capability transfer, shared-memory protocols,
executable/filesystem metadata, packets, VirtIO and USB descriptors, audio
control, VGPU input, browser parsers, semantic updates, and accessibility bridges.
Include stale, malformed, truncated, oversized, cyclic, duplicate, and generation-
confused inputs; normal tests alone do not harden a parser.

## Application and GUI boundary

Browser semantic state is capability-bound, origin/generation validated, and
redacted before accessibility/AI fan-out according to
[BROWSER_SEMANTICS.md](BROWSER_SEMANTICS.md). No AI-only DOM/control path exists;
media inspection, semantic inspection/interaction, and raw input remain separate.

The native application model is memory-safe by default. A safe-language label
alone is insufficient: ordinary application admission must eventually exclude
unsafe code, native FFI, and memory-unsafe dependencies unless the application
is moved behind an explicitly stronger compatibility boundary. The experimental
MRML compiler does not yet establish this admission property. Rust's unstable
native ABI and a public C/C++ ABI are not stable application authority surfaces.

Legacy and memory-unsafe applications belong in compatibility VMs. Application
microVM projection must preserve exact capability identity, rights,
generations, revocation, and protocol validation across the transport. Hosted
WHP/KVM still does not protect such a VM from its host.

Strict Total MicroVM semantics are canonical in
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md). Failure to satisfy a stronger
requested boundary must not silently weaken it: an eligible component whose
microVM or required resource/device projection cannot be created is unavailable,
not launched natively. Every host-substrate exception is explicitly classified
and justified. A microVM limits compromise propagation but grants no file,
network, GPU, device, secret, IPC, or resource authority; capabilities remain
authoritative. Total mode changes the TCB's shape and does not eliminate trust in
the microkernel, VMM, device isolation, narrow brokers, or bootstrap path.

The planned compositor owns trusted identity indicators, secure prompts, focus,
input routing, capture policy, and final composition. Application pixels cannot
draw or obscure the trusted portion of those surfaces. Semantic inspection,
semantic interaction, media inspection, clipboard/capture, and global HID
injection are distinct authorities.

Trusted prompts and recovery/login decisions must eventually expose equivalent
meaningful visual, keyboard, Braille, speech, and appropriate accessibility-
device semantics. Security identity cannot depend on color, sound, icon,
animation, position, or pixels alone. One redaction policy protects secrets
across visual rendering, speech, Braille, automation, and AI; accessibility
software receives no implicit secret or universal observation authority.

WebAssembly remains inside the browser sandbox and cannot bypass application
admission. The browser is no-JIT and W^X by design. Browser-level access to a
device is not delegated to an origin without separate authorization. The
sanitized semantic document tree, not arbitrary browser internals or JavaScript
execution, is the normal AI boundary. Remote AI receives no UI, media, secret,
or browsing state without explicit disclosure authority.

## Filesystem and graphics invariants

Filesystem names and object IDs never authorize. Rename preserves stable object
identity, and open capabilities remain bound to the object rather than its
current path. Derivation only decreases rights; snapshot access requires its own
authority. Recovery fails safely on inconsistent metadata, and checksummed
metadata corruption must be detected wherever coverage applies. Filesystem
checksums establish committed-data integrity, not publisher trust, executable
admission, or rollback protection.

An application that owns a surface does not own the physical display. A surface
does not imply scanout authority, and one graphics buffer does not imply access
to another. VGPU guests never receive host pointers. Trusted decorations and
security indicators remain compositor-owned through GOP and accelerated modes.
Backend takeover or fallback repeats capability validation and cannot weaken the
GUI trust boundary. Semantic AI/accessibility state remains distinct from
untrusted pixels. Fence identities, values, ownership, overflow, and reuse are
bounded and generational.

## Virtual-device invariants

GPU authority, memory/DMA, profiling, media, presentation, peer/RDMA, reset, and
driver-TCB rules are canonical in
[gpu/GPU_ARCHITECTURE.md](gpu/GPU_ARCHITECTURE.md). A GPU is not an exception to
capability attenuation, generational revocation, or physical-evidence rules.

The complete reusable queue, lifecycle, restart, block, host-share, accessibility,
hotplug, parity, fuzzing, and evidence rules are in
[PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md). They preserve the existing
MRML-native block device; no current mechanism is called VirtIO-compatible until
that transport exists and passes its scoped differential tests.

Virtual NIC or device presence never grants host network, raw device, USB,
audio, microphone, HID, bridge, passthrough, or DMA authority. Host firewall and
network policy remain outside guest control. Capture and playback are separate;
microphone capture is explicit, revocable, audited, and indicated by trusted
compositor UI. Composite USB interfaces are authorized independently. Exclusive
passthrough revokes conflicting host ownership before assignment and requires
completed reset, DMA isolation, cleanup, and reattachment transitions.
Trusted accessibility speech capture, application capture, VM capture, and AI
capture are separate authorities. Trusted accessibility speech output is not an
application-capturable playback stream by default. Braille and accessibility
HID services receive narrow interface/input-route capabilities, not raw global
USB or HID authority.

All queue descriptors, feature bits, lengths, addresses, chains, indirect
tables, indices, and device states are adversarial. Validation precedes host
access; reset/removal invalidates stale generations; guests never receive host
pointers. Unknown or uncertain lifecycle, interrupt, DMA, or cleanup state fails
closed. A virtual-device parser flaw should be contained by narrow component
capabilities rather than imply authority over the entire host. Secure attention
and global input remain outside every ordinary guest.

The MRML-native block runner now reauthorizes one live exact-object capability
with the operation-specific `READ`, `WRITE`, or `FLUSH` right before backend
access. Block numbers, lengths, queue records, transport identity, and the
separate interrupt capability cannot select that object. Wrong-object,
attenuated, stale, or revoked authority performs no backend I/O. A nonempty,
nonoverflowing backend start/count now binds guest-relative block translation;
cross-boundary and malformed transfers fail before backend access, and exposed
count must match advertised device geometry before vCPU entry. No production or
physical block backend is claimed.

PCI identity and configuration data never authorize mappings, interrupts, DMA,
or device use. Configuration offsets, widths, command bits, BAR probes, BAR
sizes, and BAR addresses are hostile. Unsupported or partial state transitions
fail without mutation. Bus mastering remains unavailable until an exact device
has separately authorized, revocable DMA/IOMMU state with complete reset and
cleanup. A BAR assignment alone never maps host memory. Memory decode requires
an assigned BAR, and configuration reset invalidates exact generational routing
views. For an attached device, native mapping and interrupt cleanup must complete
before configuration reset commits; uncertainty quarantines or fails closed
rather than treating cleared configuration bytes as completed revocation.
The router exposes reset and detach only through an unsafe revoker contract
whose success covers the exact attachment and function generation plus every
derived mapping, interrupt, DMA binding, queue, cached decision, device state,
and handle. Configuration and generation preflight occurs before cleanup;
cleanup failure preserves configuration and cannot report lifecycle success.
An assigned generational BAR window remains part of cleanup identity even after
memory decode is disabled; clearing the command bit cannot hide residual native
state from reset or detach cleanup.
Memory-decode enable requires confirmed native mapping of the exact attachment,
function generation, assigned address, and size before the command bit changes.
Disable requires confirmed unmapping before the bit clears. A rejected operation
means no native mutation; uncertain includes partial or unprovable state. Both
preserve configuration, and uncertainty requires quarantine/fail-stop. Default
configuration routing denies decode transitions unless an explicitly authorized
unsafe mapper is supplied. BAR assignment alone still creates no mapping.
Configuration routing additionally requires one exact bounded BDF match.
Attachment requires reset, unassigned, non-probing state. Duplicate
registrations, absent functions, table exhaustion, stale attachment generations,
and removal while memory decode is enabled fail before mutation.
A BDF or attachment ID identifies state but is never a capability; only the
trusted VMM policy boundary may attach, reset, route writes, or detach functions.
Legacy PCI configuration transport admits only the exact allowlisted address and
data-port width/direction tuples. Selector reserved bits, data-port alignment,
dword crossing, BDF, and register arithmetic are validated before router access.
Disabled or absent selections disclose only a width-sized all-ones value and
cannot mutate a function. Transport selection remains routing data, not device
or backend authority.
PCI scalar-input completion must match the exact still-pending vCPU, port, and
width before another entry. A backend may not report success after partial
register or native run-state mutation. Completion failure, transport rejection,
or an unexpected exit fails the VM rather than resuming ambiguous state.
For KVM, completion revalidates the complete `KVM_EXIT_IO` input record and
kernel-provided data offset before mutating only the exact selected bytes. The
vCPU retains one pending tuple and refuses another `KVM_RUN` until exact
completion succeeds; mismatch or duplicate completion fails closed.
For WHP, each vCPU retains one pending port, width, and decoded instruction
length. Completion requires the exact tuple, preserves the unaffected RAX bits
for byte and word inputs, applies x86 zero-extension for a dword input, checks
the next RIP for overflow and canonicality, and submits RAX and RIP together.
The tuple remains pending after any register-read, validation, or register-set
failure, so re-entry and stale or duplicate completion fail closed.
The native configuration probe originally selected only a deliberately
unattached BDF and required the architectural all-ones result. It now uses the
same bounded path to read two dwords from one deliberately test-only attached
block-class function, assigns its one BAR, enables memory decode through an
exact mapper, and completes a bounded two-write/two-read/one-flush queue cycle.
The flush feature must match in the guest-visible configuration and host device,
the request carries no payload or host selector, and backend execution
independently requires the exact object's `FLUSH` right. The fixed
identity, BDF, BAR, and request data remain non-authorizing; the backend object,
operation rights, mapping, and legacy interrupt delivery remain separately
capability checked. This assigns no production identity, MSI/MSI-X, DMA, or
durable backend authority.
Legacy completion injection additionally requires the exact current routed
function generation and BAR window with memory decode enabled. PCI interrupt-
disable retains the pending completion latch and performs no injection; a later
exact unmask permits the ordinary separately capability-authorized delivery.
The common block/PCI attachment now exact-matches PCI and block generations,
queue layout, interrupt vector, backend object/range, and confirmed BAR-mapping
state. Its unsafe cleanup contract covers every mapping, interrupt, DMA binding,
queue, backend-capability descendant, cached decision, device state, and handle
before block and PCI reset/removal commit. Clean rejection preserves state;
uncertain native mutation requires VM quarantine. The cleanup contract remains
unit/simulation tested. The KVM/WHP probes exercise only a narrow preinstalled
trap-window mapper and bounded volatile block I/O; they do not prove production
mapping revocation, native PCI interrupt routing, durability, or physical-device
cleanup.

Orderly PCI-MMIO VM replacement retains the exact routed attachment and backend
authority; neither is reconstructed from guest data. The device and bridge must
be suspended with all five operations fully retired before capture. The old VM
is destroyed before a linear lost-execution witness can restore only the exact
transport-bound canonical queue/resume image into fresh queue pages. Stale,
noncanonical, or scalar-transport substitution fails before restoration, and
resume occurs only after complete validation.

Final controlled cleanup succeeds only after the replacement native VM or
partition is destroyed, so no runnable translation, trapped BAR leaf, pending
native exit, or interrupt injection context survives. The revoker exact-matches
the cleanup record and preflights both exact capabilities before revoking block
and interrupt authority. Common block reset and attachment invalidation precede
PCI generation advance and BAR/decode clearing. This does not claim live TLB-
safe dynamic unmapping; that path remains fail-closed and unavailable.

Reset-with-pending simulation now composes a published unacknowledged
completion, latched notification, and separate in-flight request. Reset
invalidates the old attachment and ticket and advances both device identities;
reactivation creates a fresh bridge and attachment. The old BAR acknowledgement
is rejected by attachment validation before it can touch successor device or
queue state, and stale ticket/request generations are independently rejected.
This proves bounded common-state isolation only, not native TLB invalidation,
hosted pending-I/O reset, durable recovery, or device cleanup.

A VirtIO-GPU-compatible presentation device does not replace or implicitly
authorize MRML's CUDA compute channel. Display, presentation, and CUDA compute
are distinct capabilities. The MRML-specific compute path retains exact signed
kernel admission, authenticated request/completion binding, bounds, quotas,
reset/watchdog behavior, and fallback requirements.

Configuration authorization is exact at both supported service placements.
The hosted capability adapter and the service-image authorization syscall reject
rights supersets as well as missing rights, preventing a combined capability
from crossing a read-, write-, or control-only gate. Recovery and policy code
therefore retain separate operation-scoped handles and revalidate the exact live
handle at each use; object identity still does not authorize the operation.

DeploymentService likewise requires exact operation-scoped authority. Control
cannot double as inspection authority, inspection cannot mutate generations,
and a combined control/read handle satisfies neither narrow boundary. These
checks precede candidate mutation and active-release storage reads.

Prepared deployment activation is state, not authority. Commit revalidates a
currently live exact control capability, and stable commit variants do so
before storage or authenticated recovery-state mutation. Revocation therefore
invalidates the cached prepare decision without discarding the prepared
candidate state.

A prepared stable configuration checkpoint is likewise data, not authority.
Commit revalidates its retained exact root/read binding before receipt
consumption, so revocation after staging prevents publication without relying
on checkpoint contents or storage identity as authorization.

Prepared recovered-service state does not cache restart-policy authority.
Publication reloads the policy through the retained exact read handle and
requires the freshly computed registration plan to equal the validated plan
before mutating the supervisor.

Service restart plans retain identity and reprovisioning inputs but not cached
authority. Commit rechecks the retained exact control handle in the live
management domain—or the requester's live task capability space—before task
creation. Revocation therefore covers prepared restart decisions.

Recovered service registration treats `TaskId` as generational identity, not
authority or proof of liveness. Its delayed commit checks that exact task in the
retained runtime immediately before supervisor mutation. A retired or reused
slot generation cannot be published from a prepared recovery decision.

The direct persisted-policy registration helper also requires the exact task
generation to be live in its supplied runtime. Configuration authority governs
policy access; it does not convert a stale task name into lifecycle authority.

Recovered deployment assignment retains the exact `READ` handle that selected
the active release and reauthorizes it at seal. Its intermediate owner cannot be
split into a raw assignment plan, so revocation covers the derived inventory
until it becomes a sealed, identity-bound release input to admission.

In-memory and storage-backed deployment assignment use the same prepared owner.
Seal requires both live exact inspection authority and equality with the
deployment service's current `ActivatedSystemRelease`; an old but correctly
signed release cannot survive a later activation through a prepared plan.

Configured isolation preparation does not detach a kernel reservation from its
configuration authority. Its linear owner reapplies exact policy reads and
revision checks and exact-matches the launch specification before backend
construction; denial cancels the reservation without fallback or launch.

The complete Total-service owner cannot be decomposed wholesale into raw
prepared routes. Cleanup consumes it and cancels every retained admission
reservation, while complete construction and commit continue to reject any
single route not restored to its exact expected domain slot.

Single-route artifact transformation cannot exploit a shared domain name to
replace the reservation. Restore exact-compares the full original service spec,
including interface/provider identities and every generation, class, and
placement field, before returning it to the complete set.

Prepared file data and metadata are not authority. The authorized file-write
commit retains and rechecks the exact storage handle, principal, object kind,
and write/resize rights before consuming its transaction receipt. Revocation
returns the prepared state and does not advance the receipt.

Stable configuration checkpoint commit uses the authorized file-write boundary
after its independent exact root/read check. Thus neither checkpoint bytes nor
successful staging preserve storage authority: revoking the retained file
handle before commit prevents publication and leaves the one-use receipt
unconsumed.

Stable deployment activation applies the same rule to both publication forms.
After exact control and activation-state revalidation, the retained file handle,
principal, kind, and write/resize rights must still authorize the successor.
Denial occurs before receipt consumption, authenticated recovery-state update,
or live activation.

Durable authority checkpoint bytes likewise cannot preserve the authority used
to stage their stable file. Commit revalidates the retained generational file
binding before consuming the receipt, so revocation prevents publication of the
grant checkpoint even though its bytes and metadata were already prepared.

Neither external services nor storage-internal composition can select the
legacy receipt-only file commit after preparation. It has been removed; the
prepared-file publication boundary always requires the retained live storage
authority table.

An unverified component-service launch cannot be decomposed into a committable
isolation route. Exact authenticated consumer/provider service-image identities
must produce the typed verified owner first; mismatch retains the original
reservation so it can be cancelled without backend launch or fallback.

Stable configuration reauthorization failure returns the complete prepared
checkpoint owner together with the error. Denial therefore cannot turn a linear
staged successor into hidden ambient state or force receipt consumption; its
subsequent disposition remains explicit.

Durable authority-checkpoint commit also returns its complete prepared owner on
denial. The checkpoint epoch and root-generation binding remain available to
explicit recovery policy, and the failed commit consumes no receipt authority.

Activation-sequence exhaustion is rejected before deployment candidate
preparation and stable-publication receipt consumption. A terminal counter
cannot leave a newly prepared candidate or convert a receipt into an orphaned
activation attempt.

Authenticated deployment publication preflights the complete replacement
recovery-state record, including checked epoch advance and prepared file
identity, before consuming the file receipt. Encoding failure leaves recovery
state, activation, and receipt unchanged.

Deployment does not repeat a fallible candidate lookup or capability check after
durable publication. A private validated-activation owner captures the exact
slot, activation/release identities, and checked successor sequence before the
receipt boundary; final service mutation only consumes that owner.

Ordinary stable activation denial retains the complete prepared deployment
owner alongside its typed error. No failed control, stale-state, storage, or
receipt check silently discards the staged successor or changes live activation.

Authenticated activation never conflates recovery-store uncertainty with a
retryable prepared file. Before receipt consumption, failures return the full
prepared owner. After file publication, compare-and-store failure returns a
`CheckpointPublished` owner containing the exact file generation and pending
activation identity; live activation remains unchanged for explicit recovery.

Resolving a published authenticated activation requires a fresh authenticated
state load and exact equality with its retained epoch, stable-file identity,
activation, and root/release-derived checkpoint digest. Stale or ambiguous
state returns the same owner and cannot activate the candidate.

Authority recovery does not release reconstructed capabilities when monotonic
state persistence reports uncertainty. The pending owner exposes no handles and
can resolve only when a new authenticated load exactly equals its retained
replacement record; stale or different state keeps all authority private.

Storage-authority validation cannot escape the rollback-publication boundary.
When authenticated compare-and-store reports uncertainty, one opaque owner
retains both reconstructed capabilities and the validator's non-authorizing
output. A fresh load must exactly equal the intended replacement before either
result is released; mismatch preserves the owner and grants nothing.

FAT32 directory names remain identifiers rather than authority. Provider-local
lookup returns only validated entry metadata, excludes volume labels, rejects
ambiguous aliases, and never manufactures a file handle or I/O permission.
Non-ASCII comparison is deliberately exact until a complete admitted upcase
policy exists, avoiding an incomplete Unicode fold that could select the wrong
entry.

The filesystem lookup wire boundary preserves that separation. Its canonical
request binds exact volume, mount, and directory generations and one bounded
borrowed name range. A successful response carries only a nonzero object
identity; it cannot encode a capability, and every typed failure requires the
identity field to remain zero.

Filesystem mount framing likewise carries state identity, not authority. A
canonical request binds one exact volume handle and bounded options view; a
successful generation-2 response carries a nonzero mount generation and one
structurally valid root identity, while typed errors must carry zero for both.
The root identity cannot encode a capability. Exact endpoint routing and the
runtime's separately delivered capabilities remain the authorization boundary.

The FAT32 mount table likewise stores identity and validated geometry only. It
requires exact volume, mount generation, and root handle equality; unmount removes
the record so both identities become stale. Slot reuse advances independent
generations, and exhaustion fails permanently rather than wrapping. The table
does not create an open capability or authorize block access. Unmount publishes a
fresh nonzero completion serial only after exact removal. Replay is stale, while
serial exhaustion leaves the mount live so uncertainty cannot masquerade as
successful revocation.

Mount admission reads sector zero only through an unsafe backend contract whose
success must correspond to the exact supplied live volume handle and fill the
complete sector. The provider validates the sector before lifecycle publication
and erases scratch on every path. Backend failure or malformed media consumes no
mount/root generation and publishes no record.

The storage-side filesystem boot-sector reader binds a non-authorizing opaque
volume identity to an already owner-authenticated block session. It rechecks the
session's independent `READ` right on every block-zero operation, validates exact
full-block scratch geometry, exposes only the first 512 bytes, and erases the
complete scratch after success or failure. Volume substitution, denial, and
backend failure publish zero output bytes.

The FAT32 provider's canonical block client preserves the same boundary on the
other side of the interface. Its unsafe binding requires the runtime to prove
the exact live volume/session association; matching identifiers, names, or media
labels are not proof and grant nothing. It reads exactly one full logical block
at LBA zero, rejects typed errors and short completion, exposes only the first
512 bytes to the parser, and clears both parser output and full-block scratch on
failure.

Canonical FAT32 mount transport accepts no provider-specific option bytes until
their semantics and authority effects are defined. It decodes the complete
generation-2 request before block I/O, maps a stale backing session to the typed
stale result, and emits lifecycle/root identity only after the boot sector has
validated and the mount record exists.

The isolated mount loop receives no capability while mount options are empty;
any claimed transfer or wrong payload length fails before provider dispatch and
produces no reply. Its block authority was installed separately through the
runtime-proven binding, so request data cannot select or manufacture a block
session. Local request and response buffers are erased after every outcome.
The concrete register adapter expresses that rule with zero capability-buffer
capacity and treats any nonzero kernel-reported count as a range failure before
the provider sees the request.

Canonical unmount transport exposes the provider's failure-atomic removal rule:
only the exact volume and mount generation can produce a nonzero completion
serial. Replay maps to typed stale and the removed root identity remains invalid.
The isolated unmount loop accepts exactly the canonical payload size and zero
capabilities; malformed envelopes fail without reply. Its register adapter
advertises zero capability capacity and rejects any kernel-reported transfer
before lifecycle state can change. Request and response buffers are erased after
each attempt.

Bound FAT metadata/data reads never turn offsets into authority. The provider
derives them from already validated geometry and the runtime-proven volume/session
binding, issues canonical one-block requests, and requires exact completion for
each. Unaligned cross-block assembly is failure-atomic: if any later read fails,
all previously copied caller output and the full scratch block are erased.

Root-directory loading is gated by exact volume, mount generation, and root
identity before the block backend is reachable. It validates the bounded FAT
chain and parses each cluster into provider-local metadata, stopping only at a
valid directory end marker or chain end. Read, parse, and capacity failures
publish no directory batch and erase cluster scratch.

Lookup object identity remains data, not authority. The provider allocates it
only after exact lifecycle validation and unambiguous validated directory lookup,
stably interns aliases for the same entry, bounds table capacity, and permanently
fails after identity exhaustion rather than wrapping. Unmount deletes every
record tied to that mount; stale identities cannot resolve after slot reuse.

The FAT32 lookup transport treats wire names as bounded UTF-8 data and preserves
the caller's borrowed range. Strict decoding and the 255-unit FAT limit are
checked before block access; conversion uses provider-local UTF-16 that is erased
after dispatch. Stale roots and missing names return typed responses whose object
field is canonically zero.

The isolated lookup receive loop records cleanup ownership only after the
envelope declares exactly one capability and the token is structurally valid.
Malformed or absent transfers cannot trigger revocation; every later copy,
protocol, provider, or reply failure releases the validated leaf. The register
adapter bounds kernel-reported payload and capability counts to the supplied
arrays before constructing the envelope.

Provider lookup identity cannot be used as a file handle. The storage open broker
accepts only an unsafe runtime-authenticated mapping from the exact provider,
mount, parent, and provider object to a stable storage object; this evidence
still grants no right. A child handle is derived only from the same principal's
exact directory handle carrying `OPEN_CHILD`, with kind-valid requested rights.
Mount cleanup revokes each opened handle transitively, including descendants.
Before provider activation, the broker reserves the matching child authority in
an unusable state and occupies its own bounded lifecycle slot. Exact activation
publishes it; cancellation or mount cleanup invalidates the reservation and
releases both capacities. No partial open can leave a usable storage capability.
The provider independently reserves an exact mount/root/object tuple before
publishing any read-usable state. Only activation returns an opaque handle;
cancellation, close, and unmount advance its generation, and exhaustion retires
the slot. A lookup object number or unactivated reservation is never accepted as
provider read authority.
Provider file reads resolve only an active opaque handle, revalidate its exact
mount lifecycle, and validate the complete FAT chain before publishing bytes.
Stale handles leave output unchanged, while transient staging and cluster data
are erased after every attempted read.
The generation-3 open wire contract carries identity data only: exact volume,
mount generation, directory handle, and nonzero lookup object. Its successful
response is a structurally distinct generational provider handle; typed failures
must carry an all-zero handle payload. Interface generations 1 and 2 are not
redefined.
The FAT32 transport implements that open contract as one provider-local atomic
transition. It validates the exact live tuple before reserving, activates the
reservation before returning success, and maps stale or exhausted state to typed
zero-handle failures.
The isolated open receive path supplies no capability-token buffer. Both its
semantic envelope check and register adapter require zero transferred
capabilities; payload or kernel-count mismatch produces no reply. Request and
response buffers are erased after every later outcome.
Canonical FAT32 read transport validates the complete borrowed output range and
local staging capacity before provider dispatch. It writes only that range after
an active-handle read succeeds; stale handles leave all caller memory unchanged,
and both staging areas are erased after every outcome.
The isolated read path records cleanup ownership only after one structurally
valid transferred writable-buffer token exists. Provider error causes no shared
write; success copies only the bounded result, then release completes before
reply. Malformed envelopes and kernel over-counts cannot trigger copy, release,
or response through an unvalidated token.

Filesystem unmount is bound to the exact nonzero mount generation and provider
endpoint. Its completion serial is lifecycle evidence rather than authority;
typed errors cannot smuggle a serial, and a successful response cannot encode
zero.

Filesystem reads bind the exact volume, mount, file, provider endpoint, file
offset, and writable memory range before invocation. Checked arithmetic prevents
offset wrapping; successful byte counts cannot exceed caller authority, and
typed failures carry no byte count. A zero-byte success represents EOF rather
than an I/O grant.

Filesystem writes are a distinct authority path from reads. Canonical requests
bind exact volume, mount, file, provider endpoint, checked file offset, and one
nonempty immutable range; successful byte counts cannot be zero or exceed that
range. `ReadOnly`, permission, capacity, and I/O failures remain distinguishable
and carry no progress count.

Filesystem create requests bind the exact volume, mount, parent directory,
provider endpoint, and nonempty bounded name. The generation-1 `kind` remains
provider-validated data rather than authority. Success returns only a nonzero
object identity; typed failure carries zero, and reserved alignment bytes cannot
hide alternate semantics.

Filesystem flush requests bind the exact volume and nonzero mount generation to
the retained provider endpoint. A successful response carries a nonzero
durability serial as evidence rather than authority; stale-object, permission,
and I/O failures carry zero, and status/serial mixtures fail closed.

Filesystem check requests bind that exact mounted volume and retained endpoint
to one writable report of at most 64 KiB. Successful byte counts cannot exceed
the caller's report range; zero-byte success is valid, while every typed failure
carries zero and cannot smuggle report progress.

Filesystem format framing keeps bounded immutable options disjoint from its
bounded writable report and rejects completion beyond the report. A distinct
`DestructiveAuthorityRequired` failure makes explicit that request data cannot
authorize formatting; the runtime must separately deliver the exact
preview-bound capability selected by the owner.

The isolated FAT32 receive loop enters capability cleanup only after an envelope
declares exactly one transferred capability and the token has a nonzero
generation. Nonzero bytes paired with an absent or malformed transfer cannot
trigger revocation; once validated, the received leaf is released even when a
later shared read or provider operation fails.
