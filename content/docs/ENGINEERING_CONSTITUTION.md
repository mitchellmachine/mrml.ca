# MRML Engineering Constitution

This document is normative project policy. It governs substantial architectural
and engineering decisions; detailed architecture, status, security boundaries,
and evidence remain in their existing canonical documents. Routine edits do not
need ceremony, but major mechanisms must be tested against these rules.

## Authority and objects

> Resource consumption is authority.

> Resource authority may be delegated only by attenuation, never amplification.

Allocation quantity, object ownership, mapping, sharing, pinning, content access,
and DMA are separate authorities. Execution never implies unlimited RAM.

CPU execution is likewise quantitative authority. Power/performance policy may
adjust resource behavior within owner policy but never widens capabilities or
silently disables required security mitigations. CPU age is not vulnerability
evidence; exact hardware and post-microcode state controls mitigation. The
canonical platform rules are in
[platform/CPU_PLATFORM.md](platform/CPU_PLATFORM.md).

> Everything meaningful is an object, and authority to an object is represented
> by capabilities.

> Names identify. Capabilities authorize.

Object identity, paths, PIDs, URLs, service names, signatures, publishers,
users, AI identities, and reputation never confer authority by themselves.
Objects are appropriate where identity, lifetime, ownership, delegation,
observation, or authority matter; meaningless implementation details must not
become objects merely for uniformity.

There is no ambient authority. Processes, services, applications, VMs, drivers,
userspace components, users, and AI agents receive explicit capabilities.
First-party origin, signatures, user launch, system membership, administrator-
equivalent identity, AI status, or reputation does not imply unrestricted
authority.

> First-party status is identity, not authority.

Equivalent first- and third-party software uses the same documented interfaces,
capability checks, and admission rules unless a narrow TCB boundary is documented
and justified. Publisher signatures, manifests, licenses, remote policy, and
reputation may inform policy but never create authority.

## Owner sovereignty

Installation, update, offline servicing, recovery, imaging, and snapshots operate
on one immutable package and `SystemGeneration` model. Package identity,
publisher signatures, manifests, Store presentation, and transport request or
describe policy; they never grant capabilities. Destructive deployment authority
binds an exact previewed transaction. See [DEPLOYMENT.md](DEPLOYMENT.md).

> Security authenticates and enforces the owner's policy; it must not transfer
> ownership of the machine to a vendor, publisher, service provider, or remote
> verifier.

Secure Boot, measured boot, TPM state, executable and driver admission, updates,
recovery, attestation, and key rotation protect the owner-selected policy. The
default installation may recommend project keys, but the owner retains a
documented path to add or replace trust roots, authorize owner-built and
development generations, recover the machine, and revoke compromised keys.
Owner control and rollback resistance are independent requirements: neither may
be weakened to simulate the other.

> Secure by default must not mean impossible for the owner to change.

Dangerous changes may require explicit confirmation, recovery authentication,
secure attention, or physical presence. Prefer narrow development capabilities
with visible, revocable exceptions over a permanent insecure developer edition
or one global security-off switch.

> MRML security protects the owner and authorities the owner deliberately
> delegates. It is not a mechanism for creating permanent publisher authority
> against the owner.

MRML does not make cryptographic inaccessibility to the local machine owner a
core security property. Publisher requests such as `NO_COPY`, `NO_SCREENSHOT`,
`NO_DEBUG`, `NO_ACCESSIBILITY`, `NO_TRANSCRIPT`, or `NO_OWNER_INSPECTION` do not
become kernel authority. Services may refuse content, and compatibility may
include mechanisms such as HDCP, but those are not MRML guarantees against the
owner and cannot veto required accessibility semantics.

MRML uses one authority vocabulary across files, directories, windows,
processes, VMs, connections, devices, secrets, debuggers, AI agents,
configuration, graphics, audio, and services:

```text
object  capability  rights  derive  delegate  restrict  revoke  expire
```

Subsystems may define specialized rights, but not casual parallel authorization
architectures. Human GUI/CLI/SDK use, automation, local AI, and remote AI should
operate on the same underlying objects. AI is another principal, never a hidden
root automation channel.

## Accessibility

> A core MRML interface is incomplete if its essential operations are available
> only through one sensory or physical interaction mode when the architecture
> can reasonably expose equivalent semantic control.

Equivalent meaningful access does not require literally identical interfaces.
Accessibility is a platform and security property, not optional polish.
Essential semantics and actions should support appropriate visual, keyboard,
Braille, speech, accessibility-device, automation, and AI projections while
preserving separate capabilities and secret redaction. Core accessibility must
retain a viable local path. Accessibility work cannot be rejected merely because
it adds implementation effort; control complexity through one shared semantic
object system rather than duplicated representations. The canonical design is
in [ACCESSIBILITY.md](ACCESSIBILITY.md).

If MRML exposes core-interface semantics to AI or automation, the interface is
incomplete unless supported accessibility interfaces receive equivalent
meaningful semantics or documentation records a concrete technical reason.
Presentation and authority may differ. Intrinsically visual content may require
descriptions, captions, transcripts, structure, metadata, or separately
authorized multimodal inspection rather than false textual equivalence.

## Memory safety and containment

Ordinary MRML applications run in admitted microVMs and are memory-safe by
admission policy, with safe Rust as the primary direction. The language's support for unsafe systems work
does not authorize ordinary applications to use unsafe code. Unsafe Rust is
reserved for system components where justified and audited. Memory-unsafe
legacy software belongs behind explicit compatibility/isolation boundaries,
normally VMs. WebAssembly remains browser content, not a general native
application format.

Compatibility adapts to the security model; the security model does not adapt by
granting legacy software ambient authority. Compatibility VMs, adapter services,
emulated devices, and third-party runtimes receive only projected capabilities,
never implicit host filesystem, credential, debug, device, microphone, camera,
HID, or network authority.

Keep the trusted computing base small. Security-related work does not belong in
the TCB merely because it is security-related. Every proposed TCB addition must
explain why its compromise must have broader consequences; without a strong
answer, redesign it as a narrowly capable isolated service.

> One compromise should remain one compromise.

> One crash should remain one crash.

> Failure of a stronger isolation mechanism must not silently weaken the
> requested security boundary.

Where practical, detect a failed service, revoke its authority, clean derived
state, destroy it, and restart a clean instance. Unsupported, malformed,
ambiguous, or security-sensitive states fail explicitly, especially in the
compiler, capability validation, IPC, virtual devices, VGPU, USB, storage,
networking, executable admission, boot verification, and AI tool execution.

Simplicity is a security and maintainability property, but it must never be
obtained by removing necessary isolation, validation, or correctness.

Prefer prevention in this order: remove unnecessary functionality; use memory-
safe implementation where practical; remove ambient authority; isolate; validate
every untrusted boundary; apply hardware/compiler mitigations; detect compromise;
then revoke and restart from independently validated state. Successful transient
code execution must not create startup, configuration, executable-trust,
credential, firmware, or other persistent authority without an independently
authorized persistent object.

Every significant component accounts for parsers, syscalls, IPC, shared memory,
device and guest buffers, packets, firmware tables, compiler and executable
metadata, filesystem metadata, semantic/accessibility input, browser content,
and AI input as applicable. Prefer bounded, strictly versioned, canonical,
fail-closed, independently fuzzable codecs.

## Rights and hostile-security review

Major platform mechanisms must pass both reviews before being called
architecturally mature. This is design scrutiny, not organizational endorsement.

`DIGITAL-RIGHTS REVIEW`: Does the mechanism collect unnecessary data; prevent
owner inspection, control, revocation, export, or migration; create lock-in,
publisher DRM, tracking identity, coercive consent, remote disclosure, an
accessibility exclusion, or a hidden first-party bypass?

`HOSTILE SECURITY REVIEW`: What inputs and parsers are untrusted; what authority
does compromise yield; can authority amplify, persist, or survive cleanup; can
stale identities, mappings, DMA, IPC, shared state, or secrets survive revocation;
can a guest forge trusted UI or AI cross a capability boundary; what happens
under exhaustion or partial cleanup; and which claims require real hardware?

Important security features receive separable `IMPLEMENTER`, `REVIEWER`, and
`ADVERSARY` passes. The adversary attempts to falsify non-amplification,
revocation, secret non-exportability, AI/VM containment, parser bounds, semantic
redaction, trusted identity, update rollback resistance, and DMA isolation.
Agent review supplements rather than replaces independent human audit.

## Whole-system understandability

> MRML should remain understandable as a complete computer.

A competent developer should be able to trace important behavior approximately:

```text
source
  -> mrml-rustc
  -> executable and security metadata
  -> loader
  -> capability assignment
  -> process or service
  -> IPC
  -> kernel mechanism
  -> driver, VMM, or backend
  -> hardware
```

This does not require trivial components. It requires every layer and piece of
complexity to have a reason. Avoid opaque indirection and wrapper-to-wrapper-to-
adapter-to-manager stacks when a direct object or protocol is clearer.

An abstraction normally exists because it enforces a security invariant,
isolates failure, hides genuine backend differences, stabilizes an ABI or
protocol, removes meaningful duplication, enables testing, or reduces greater
complexity elsewhere. If it does none of these, question it.

When the system already knows structured information, expose it as structured
objects—such as diagnostics, processes, windows, capability graphs, compiler
diagnostics, and security events—rather than forcing software or AI to parse
free-form logs. Human-readable rendering is a view over that state.

## Complexity is a budget

> Native GPU API growth requires architectural justification.

Prefer compiler/backend inference and orthogonal semantic objects over hardware
knobs or convenience commands. Account for parser, VirtualGPU, driver,
compatibility, review, and permanent ABI cost; Advanced/Raw controls require
measured need.

Complexity is a resource like CPU, memory, latency, and attack surface. Every
subsystem, abstraction, dependency, compatibility layer, service, parser,
protocol, and persistent state machine consumes a permanent budget.

Before a substantial mechanism, answer:

- What problem does it solve, and can an existing object/service solve it?
- Does it introduce another authority model or global mutable state?
- Does it enlarge the TCB or add an untrusted-input parser?
- Could bounded storage replace dynamic allocation?
- Does it duplicate a concept or admit a smaller design?
- Is compatibility value worth permanent maintenance?
- Can failure be isolated and the mechanism fuzzed/tested independently?
- Can a future developer understand why it exists?

Major subsystem proposals record:

```text
Complexity impact: LOW | MEDIUM | HIGH
TCB impact: NONE | LOW | MEDIUM | HIGH
New parser boundary: YES | NO
New authority model: YES | NO
New persistent state: YES | NO
External dependency: YES | NO
Failure isolated: YES | PARTIAL | NO
Existing-object reuse: HIGH | MEDIUM | LOW
```

This is a design aid, not paperwork for routine implementation.

## Dependencies, compatibility, and readability

Artifact suffixes are presentation rather than authority; the canonical MRML
extension family is recorded in
[packages/ARTIFACT_EXTENSIONS.md](packages/ARTIFACT_EXTENSIONS.md). Runtime
placement remains one capability/interface architecture as specified in
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md), not a parallel sandbox stack.
Storage and optical mechanisms follow the bounded dependency order and evidence
gates in [storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md).

MRML remains aggressively dependency-minimized. For core components prefer
MRML-owned implementation, `no_std`, bounded memory, fixed-capacity structures,
explicit failure, deterministic behavior, small interfaces, and auditable unsafe
boundaries where practical.

Dependency minimization is not dependency elimination at any cost. Do not
recreate an enormous mature security-sensitive component when that would
materially reduce correctness or security. A significant core dependency must
justify its purpose, security and TCB impact, transitive dependencies, unsafe
exposure, update policy, and replacement feasibility.

Compatibility must pay rent. POSIX, Windows, legacy ABIs/hardware, C/C++
expectations, and historical filesystem semantics do not dictate the native
architecture. Put justified compatibility behind explicit VMs, adapters,
services, import/export paths, or emulated devices, and account for its lasting
maintenance cost.

Security-sensitive source favors explicit state machines, small modules,
bounded structures, clear invariants, deterministic control flow, and documented
unsafe boundaries over cleverness, metaprogramming, or generic abstraction that
obscures behavior.

## Development speed and evidence

Preserve a rapid secure loop:

```text
edit -> compile -> load or restart -> test -> inspect
```

Measure development latency. Services should restart independently when
isolation permits; compiler and loader speed must not bypass admission or
security checks.

Do not justify complexity by asserting it will be faster, safer, or smaller.
Measure relevant latency, throughput, memory, binary size, compiler time, IPC
cost, VM startup, GUI latency, and attack-surface proxies. Security claims stay
tied to exact evidence and retain their category:

```text
DESIGN GOAL  IMPLEMENTED  TESTED  MEASURED  AUDITED  PROVEN
```

No claim—memory safety, complete revocation, CET/IBT, DMA isolation,
fingerprint resistance, rollback protection, or prompt-injection containment—
is promoted without corresponding evidence.

## Precedence

Future contributors and agents must consult this constitution before major
architecture. If a proposal conflicts with it, identify the conflict, explain
why the rule is insufficient, propose an explicit amendment, and do not bypass
the rule silently. The constitution may evolve only deliberately.
