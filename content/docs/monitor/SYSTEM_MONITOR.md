# MRML unified system monitor

Status: **PLANNED**. This is architecture, not runtime implementation, testing,
measurement, audit, or physical-hardware evidence.

The existing MRML system monitor is the one canonical observer for tasks,
services, VMs, resources, security, integrity, devices, platform, and recovery.
MRML does not add parallel `SecurityMonitor`, `IntegrityMonitor`,
`AntiCheatMonitor`, or `TaskManagerDaemon` authorities. One typed semantic state
model supplies capability-scoped task, resource, security, GPU, thermal, power,
network, shell, accessibility, automation, testing, and AI views.

## Boundary and decomposition

The monitor correlates facts from authoritative kernel mechanisms and isolated
services. It is not a debugger, supervisor, policy authority, malware oracle,
or root process. Observation, deterministic policy, and remediation are three
separate authorities. Policy may propose a typed response; the existing
supervisor, capability, deployment, device, or trusted-consent service performs
an authorized transition and reports the result.

The monitor is a restartable least-authority userspace service outside the TCB.
Its compromise grants no process-memory or secret access, capability creation,
task termination, package installation, device reset, DMA mapping, firmware
mutation, policy replacement, or attestation signing. Enforcement, minimum
thermal safety, early boot, and recovery-critical verification remain safe when
it is absent, stale, overloaded, or compromised.

```text
Complexity impact: MEDIUM
TCB impact: NONE
New parser boundary: NO (typed versioned protocols only)
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

## Typed state and views

Every fact names an exact typed object and generation. Names, paths, PIDs,
labels, publishers, signatures, manifests, and package/interface metadata only
identify or describe; they never authorize. A displayed row is not a bearer
capability. Authorized projections may include:

- process, application, service, driver, VM, AI-session, and disposable-domain
  lifecycle, isolation, health, restart generation, and dependencies;
- capability ownership, attenuation, delegation, transfer, expiration,
  revocation, provenance, temporary elevation, and active exceptions;
- CPU time/budget/topology, memory commitment/pools/objects/mappings/shared-page
  accounting, storage/network I/O, and per-domain quantitative limits;
- GPU engines, contexts, queues, surfaces, buffers, VRAM, `VirtualGPU` budgets,
  fences, faults, resets, temperature, and power—without command streams or
  unrelated pixels by default;
- storage objects, projections, queue activity, health, encryption, and
  integrity without content authority;
- adapters, links, connections, projected network capabilities, throughput,
  Wi-Fi signal, Bluetooth devices/profiles/battery, and power without packets,
  credentials, or nearby-network history;
- package, component, interface, provider, executable, and `SystemGeneration`
  identities, admission state, live bindings, retained and rollback roots;
- admitted immutable executable mappings, expected measurement, W^X state, and
  declared security profile without universal memory scanning;
- device assignment, driver generation, reset/hotplug, DMA domain, IOMMU
  attachment/fault, and passthrough exceptions;
- UEFI entry/order/next selection, owner-selected Secure Boot policy, available
  measured evidence, selected generation, rollback, recovery, sensor validity,
  power profile, thermal state/actions, and mitigations.

Summary, advanced, security, GUI, shell, accessibility, automation, and AI are
projections, not divergent models. Aggregation must not leak other domains.
“Why can this principal do this?” traces only the authorized bounded delegation
graph. Equivalent third-party tools use the same documented interfaces.

## Expected and observed integrity

Integrity compares a typed expected fact with independently obtained observed
state under an identified policy. It has three distinct layers:

1. artifact integrity: immutable package/component/executable identities,
   authenticated manifests, digests, admission, and retained generation;
2. runtime integrity: mappings correspond to admitted immutable objects, W^X is
   preserved, bindings select exact provider generations, and device/DMA state
   matches active authority;
3. platform integrity: boot selection, owner trust policy, measured evidence,
   firmware/IOMMU facts, rollback, and recovery—limited to the actual source and
   threat model.

Findings carry status, severity, evidence/confidence, affected object, expected
and observed facts, source/generation, and recommended next step. Statuses
include `MATCH`, `EXPECTED_CHANGE`, `UNKNOWN`, `UNAVAILABLE`, `STALE`,
`INCOMPLETE`, `EVENT_GAP`, `POLICY_EXCEPTION`, `MISMATCH`, and
`REQUIRES_REVIEW`. Unknown, unsupported, absent, and unauthenticated are not
collapsed. Hashes and signatures do not prove safety; mismatches do not prove
malware, compromise, or intent.

The monitor never scans arbitrary private pages, injects code, or bypasses
isolation. Separately authorized incident/debug workflows may obtain bounded
snapshots with purpose, consent/policy, retention, redaction, and export rules.

Dynamic components obey
[COMPONENT_INTERFACES.md](../packages/COMPONENT_INTERFACES.md). Crate, package,
interface, executable, and provider identities stay distinct. Bindings name
exact immutable generations; compatible updates do not mutate running
consumers, incompatible interfaces are never substituted, and old providers
remain until live references and all retention/rollback/snapshot/export/GC roots
permit reclamation. Executable pages are not patched in place. Rust's native ABI
is not the component ABI. Metadata grants no capability.

## State, events, audit, and restart

State snapshots, transient events, and durable audit are separate. Events are
bounded typed records carrying source identity and generation, monotonic source
sequence, object generation, reason/transition, and authentication/trust class;
time appears only when trustworthy. Applications cannot launder self-reported
data into trusted state.

Planned classes cover lifecycle and supervision; capability changes; budgets
and thresholds; mapping/admission/W^X; packages, components, bindings,
generations, rollback and recovery; device/reset/hotplug; DMA/IOMMU;
GPU/VirtualGPU; storage/network/Bluetooth; boot/trust; debug, secret use/export,
AI sessions, consent and exceptions; sensors, thermal, and power.

Queues are bounded and cannot indefinitely block critical producers. Explicitly
coalescible telemetry may coalesce; security transitions may not silently
disappear. Overflow, sequence discontinuity, authentication failure, restart,
or source replacement creates an explicit gap and makes affected state
`INCOMPLETE` or `STALE`.

Resynchronization obtains an authorized authoritative snapshot, binds its source
generation and sequence boundary, then resumes events. Consumers reject
regression/replay and deduplicate by source generation and sequence. After
restart, the monitor rebuilds from authoritative services and the authorized
audit window; caches are disposable. Completeness is per source/event class,
never one misleading global green light.

Every audit class defines purpose, fields, retention, redaction, read/erase/
export authority, and any justified non-erasure. Telemetry is aggregated and
ephemeral by default. There is no permanent history of every file read, page,
keystroke, prompt, packet, nearby network, document, screen, audio, or private
page. `OBSERVE`, `RETAIN`, `CORRELATE`, and `EXPORT` are separate rights.

## Policy and response

Deterministic policy consumes facts bound to exact policy/state generations and
emits a finding or proposal; it cannot act. AI may summarize authorized facts
but is outside the TCB and cannot self-authorize queries, subscriptions,
retention, export, remediation, policy, severity, or attestation.

```text
inform -> refresh/revalidate -> attenuate/revoke a narrow right
       -> suspend/quarantine -> supervisor restart
       -> validated rollback/recovery generation -> emergency shutdown
```

Each step uses a distinct capability held by the owning service. High-impact or
destructive actions bind an exact preview and owner policy or trusted consent.
The monitor cannot patch executable pages, erase evidence, conceal a gap, or
grant itself recommended authority.

## Privacy, scoped anti-cheat, and remote claims

A game or application may request owner-visible integrity over its own admitted
artifacts, process, explicitly participating services, input route, or session.
It receives no vendor kernel driver, universal scanner/debugger, global device
inventory, unrelated-process state, persistent tracking identity, or power over
owner recovery, accessibility, inspection, or owner-built authorization.

Remote statements are optional, minimized, purpose-bound, owner-authorized, and
bind verifier, policy, request, freshness, expiry, and replay protection. They
never exceed their measured boundary or create publisher/verifier authority.
Refusal may make a remote service decline participation; it does not justify
general DRM. Documented assistive technology is not classified as cheating.

Diagnostic/audit export is explicit, previewable, redacted, bounded, and owner-
controlled. Observation does not imply retention, correlation, secondary use,
training, redistribution, or disclosure.

## Resources, devices, and evidence

Accounting uses native objects. Shared executable pages remain explicitly
charged through `MemoryPool` and `MemoryObject`. Samples expose interval,
aggregation, attribution limits, and unavailable data; a package sensor never
becomes a false per-process temperature. Estimates are labeled.

GPU views preserve surface/buffer/render/display/fence distinctions. Network
observation is not capture/injection. Storage health is not content access.
Sensor inspection is not fan/voltage/frequency/power/thermal control. DMA/IOMMU
views grant no physical addresses or mappings. Firmware, TPM, VBS, hosted VMM,
nested VM, and bare-metal claims retain exact evidence and threat-model labels.
The kernel now has a **PARTIALLY IMPLEMENTED** aggregate adaptive-isolation
projection. `inspect_isolation_status` requires a live `INSPECT` capability for
one exact monitor object and derives an immutable snapshot directly from the
authoritative `IsolationAdmissionTable`. It reports the active system and policy
generations, requested mode, Total satisfaction state, running-class totals,
every explicit host-substrate reason, unavailable-reason totals, and native
fallback count. It intentionally contains no domain identities, content, or
mutation authority; a different object, attenuated right, or revoked generation
fails before disclosure. This is a kernel API with Windows/Linux unit evidence,
not yet the monitor service, event stream, GUI, shell, or Semantic Scene Graph
projection.

Planned per-domain adaptive-isolation views distinguish requested/effective
placement, policy source and generation, mandatory floor, eligibility classification,
host-substrate reason, active/required unsupported blockers, resource cost,
unavailable domains, and native-fallback count. The monitor reports actual
placement rather than inferring it from Settings. Successful Total mode requires
every running `MICROVM_ELIGIBLE` domain in a microVM and native fallback zero.
`MICROVM_REQUIRED_BUT_UNAVAILABLE` and `TOTAL_MICROVM_DOWNGRADE_ATTEMPT` are
structured findings; they never authorize native launch. Requested Total with
an active required blocker or eligible native execution is reported not
satisfied, even when the request came from boot or an intentional override.
Planned optical views distinguish drive/media generations, actual profiles,
semantic burn progress/errors, and delegation without inventing telemetry. See
[../ISOLATION_PLACEMENT.md](../ISOLATION_PLACEMENT.md) and
[../storage/STORAGE_AND_OPTICAL.md](../storage/STORAGE_AND_OPTICAL.md).

## Interfaces, accessibility, and servicing

Queries/subscriptions are typed, bounded, cancellable, generation-aware, and
capability-scoped. Filters run before disclosure. Responses distinguish absent,
unauthorized, unsupported, unavailable, stale, incomplete, and redacted.
Versioning and feature negotiation are explicit; unknown required fields fail
closed.

GUI and shell expose the same objects; the shell receives records, not scraped
text. The Semantic Scene Graph represents headings, tables, relationships,
changes, trends, severity, evidence, gaps, and actions. Keyboard, speech,
Braille, assistive devices, automation, testing, and authorized AI receive
equivalent meaning. Color, charts, animation, spatial layout, pointer precision,
or audio alone never carries essential state. The 40-cell Braille target supports
concise summaries and drill-down. Trusted prompts and redaction stay consistent.

The isolated monitor may be independently serviced through the explicit MRML
interface ABI. Its package, interface, executable, and running generation remain
distinct and visible. Updating it mutates neither consumers nor authoritative
event sources. Bootloader, early kernel, minimum thermal safety, and recovery-
critical codecs remain independent of the userspace resolver.

## Verification and milestones

All gates remain **PLANNED**:

1. Bounded state/event/query codecs and capability/redaction tests.
2. Task/service/VM/capability/CPU/memory snapshots and accounting tests.
3. Sequenced subscriptions, overflow/gap, replay, restart/resync, stale-source,
   deduplication, and backpressure tests.
4. Package/SystemGeneration/component/executable/W^X/rollback comparisons.
5. GPU, storage, network/Bluetooth, device, DMA/IOMMU, power, thermal views.
6. UEFI/Secure Boot/measured/recovery evidence with exact environment labels.
7. Deterministic proposals and independently authorized response, including
   races, stale generations, denial, and partial cleanup.
8. GUI/shell/keyboard/screen-reader/speech/Braille and disabled-user testing.
9. Scoped application integrity/remote claims only after rights, security,
   privacy, and targeted patent review.
10. Codec/state-machine fuzzing and measurement of throughput, queue/memory
    bounds, snapshots, resync, UI latency, and observer overhead.

Evidence distinguishes unit, simulation, hosted WHP/KVM, nested virtualization,
and exact physical hardware. No gate becomes **IMPLEMENTED**, **TESTED**,
**MEASURED**, **AUDITED**, or **PROVEN** without focused evidence.

Digital-rights review: preserves owner control, accessibility, local operation,
data minimization, third-party parity, and refusal without DRM; forbids universal
scanning, hidden disclosure, publisher supremacy, and AI-only control.

Hostile-security review: the non-TCB monitor uses read-limited capabilities,
treats every producer/codec as hostile, exposes gaps/staleness, cannot remediate,
and cannot amplify authority. Implementation must test replay, generation reuse,
confused deputies, source compromise, inference, correlation, exhaustion, and
partial cleanup.

Patent review: **TRIGGERED** for future implementation. Continuous runtime
comparison, event correlation, scoped participating-application integrity, and
remote claims need mechanism-specific worldwide family and authoritative-
register review before code selection. This document claims neither clearance
nor infringement; see [REVIEW_LOG.md](../patents/REVIEW_LOG.md).
