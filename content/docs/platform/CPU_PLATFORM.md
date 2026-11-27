# MRML CPU platform, scheduling, power, and thermal architecture

**Status: PLANNED**, except for the existing x86_64 discovery, SMP, APIC,
scheduler, VMX/EPT, measured-boot, bounded CPU-budget groundwork, and hosted-probe mechanisms recorded in
[`../GIGAKERNEL.md`](../GIGAKERNEL.md). This document defines future policy;
it does not claim microcode loading, complete vulnerability evaluation, physical
hardware support, power control, sensor service, or thermal protection exists.

## Support floor and reference systems

> MRML targets modern hardware deliberately rather than carrying unlimited
> historical CPU compatibility.

The initial modern x86-64 references are Intel Core i9-13900K (Raptor Lake) and
AMD Ryzen 9 7950X3D (Zen 4/Raphael/AM5). They pressure-test heterogeneous Intel
cores and AMD CCD/cache asymmetry; they are neither frozen product allowlists nor
security identities. Compatible newer Intel and AMD processors are admitted
through explicit feature, topology, microcode, and security discovery. MRML may
reject CPUs below the documented floor and does not retain active complexity
solely for older processors absent a future architecture decision.

> CPU age or generation is never itself proof that a vulnerability does or does
> not apply.

The floor reduces legacy burden; exact hardware and microcode state determines
affectedness. Early discovery records vendor, family, model, stepping, microcode
revision, architectural and extended features, core/SMT/cache/NUMA topology,
execution-capacity information, virtualization features, and security controls.
Marketing names are presentation metadata, not security identity.

## Vendor platform and microcode policy

A common `CpuPlatform` policy surface has `IntelCpuPlatform` and
`AmdCpuPlatform` backends. Intel and AMD are first-class; common policy does not
pretend their mechanisms or update formats are identical. Each backend identifies
and validates an applicable vendor-defined update, applies it at the correct boot
stage, rejects invalid or inapplicable data, queries and records the resulting
revision, and triggers security-state re-evaluation.

`MicrocodePolicy` conceptually carries minimum and preferred approved revisions,
an owner-pinned revision where safe and permitted, recovery policy, and update-
source policy. These are not frozen ABI fields. Update authority remains under
owner-controlled trust roots. CPU identity, update result, and resulting
microcode revision are inspectable runtime platform-security evidence; physical
CPU identity need not become part of reproducible software-artifact identity.

```text
early CPU discovery
  -> select and apply approved vendor microcode
  -> query resulting revision and features
  -> re-evaluate vulnerability state
  -> derive mitigation profile
  -> configure kernel, scheduler, and VMM
  -> publish capability-scoped security state
```

Measured boot binds the approved loader/kernel/policy and, where the platform can
authentically measure it, the selected microcode policy/update outcome. A raw
CPUID or revision report is not attestation. Recovery must retain an owner-
authorized known-good microcode path without silently weakening rollback rules.

## CPU vulnerability state

The structured model distinguishes `NOT_AFFECTED`, `VULNERABLE`,
`MITIGATED_BY_HARDWARE`, `MITIGATED_BY_MICROCODE`,
`SOFTWARE_MITIGATION_REQUIRED`, `MITIGATION_ACTIVE`,
`MITIGATION_UNAVAILABLE`, and `UNKNOWN` (names are not frozen). `UNKNOWN` is
never displayed as `NOT_AFFECTED`; security-sensitive operation fails
conservatively when the distinction matters.

> MRML enables a CPU mitigation only when the supported processor's exact
> hardware/microcode state requires that mitigation.

MRML neither enables every historical Intel/AMD mitigation everywhere nor
disables one merely because a CPU is recent. Vulnerability classes impossible
within the support floor may remain historical documentation without active
runtime paths; processors requiring them may be rejected. The framework remains
extensible for newly discovered flaws affecting a reference CPU, newer products,
selected steppings, or selected revisions.

Data-driven `VulnerabilityRule` records should centralize vendor,
family/model/stepping and microcode constraints, architectural capabilities,
affected-state evaluation, mitigation, and scheduler/VMM implications instead
of scattering model-number tests. Hardware facts prefer official Intel/AMD
security documents, architecture manuals, and microcode guidance, followed by
reviewed upstream implementations and independent research. Linux is valuable
implementation evidence, not the CPU specification or MRML architecture.

VMX and SVM remain vendor-specific virtualization backends under shared VMM
policy. Guest CPUID/topology/microcode presentation is explicit and cannot make
the host mitigation profile less strict. The VMM consumes post-update
`CpuSecurityProfile` virtualization implications, accounts transition actions,
and refuses protected operation when a required control or mitigation is absent
or unknown. Intel VMX support is not evidence of AMD SVM support, or conversely.

## Scheduler model and CPU authority

`CpuSecurityProfile` turns required sibling isolation, predictor-transition
actions, cache-domain restrictions, and virtualization constraints into inputs
consumed by the scheduler and VMM. Security rules are not scattered placement
exceptions. Power/performance policy changes performance behavior, not security
authority. Any owner-authorized benchmark exception requires narrow revocable
authority, persistent warning/state, scope, and an honest not-fully-mitigated
status.

> Power/performance policy changes performance behavior, not security authority.

Generic `CpuExecutionClass` descriptors express compute capacity, efficiency,
latency, SMT properties, vector/features, frequency domain, and cache topology.
They support more than two future classes. On the i9-13900K, P-cores with SMT and
E-cores without SMT are reference facts, not permanent scheduler types. On the
7950X3D, same-generation cores can still differ by CCD, cache domain, locality,
frequency, power, and thermal behavior; Intel hybrid rules do not apply.

Placement accounts for core and SMT sibling, cache hierarchy/CCD/shared LLC,
NUMA, task locality, sustained load, hardware guidance, task intent, power and
thermal state, resource authority, security constraints, and cache/TLB and
power-transition migration costs. Hardware hints are observations, not
authority. Hysteresis prevents migration on momentary utilization. Prefer an
unused physical core to an SMT sibling for suitable single-thread work; allow
SMT for throughput unless security forbids cross-domain siblings.

Conceptual intent includes latency-critical, interactive, throughput,
background, efficiency-preferred, and realtime work. Self-declaration does not
grant privileged placement; powerful classes require policy/capability.
Interactive work may prefer capacity, background work efficiency, and throughput
both, without permanent hard-coded placement.

`CpuBudget` is quantitative execution authority: maximum parallelism, time or
utilization budget, priority ceiling, allowed scheduling classes, and affinity/
topology constraints. Execution authority does not imply unlimited CPU
consumption. Delegation attenuates and revocation removes derived scheduling
state, aligned with RAM, VRAM, and GPU-time resource capabilities.

The kernel now has **PARTIALLY IMPLEMENTED** fixed-capacity `CpuBudgetTable`
groundwork. A generational root binds maximum parallelism, runtime/period,
priority ceiling, and a nonempty affinity mask to an exact capability object in
a CPU-specific namespace. Exact domain-bound vCPU reservations cannot exceed
parallelism, duplicate a live domain, or survive a stale generation; allocation,
control, and inspection require their respective rights, and a budget cannot be
retired while reservations remain. Runtime groundwork now starts one explicit
fixed period and precharges every authorized maximum slice before vCPU entry.
All parallel reservations consume the same allowance; exhaustion, time
regression, period crossing, zero slices, stale reservations, and arithmetic
failure reject before execution authority is issued. Each authorization now
also binds the exact reserved domain, an in-range vCPU index, one logical CPU
allowed by the affinity mask, and a priority no stronger than the ceiling.
Rejected vCPU, affinity, or priority choices consume no runtime. Each issued
slice is now linear and blocks reservation release and period rollover until
exactly reconciled. Reconciliation uses the observed backend-entry wall elapsed
time, refunds only a verified underrun, rejects replay or substitution, and
retains the full precharge on overrun. Each reservation now has fixed per-vCPU
in-flight state through the existing 64-vCPU ceiling. Multiple sibling slices
may be live concurrently, but they
precharge the same budget allowance and retain exact vCPU, logical-CPU,
priority, start, and charge decisions for independent reconciliation. No sibling
can refund another's authority, and any unresolved slot blocks release and
period rollover. This remains allocation-free kernel simulation groundwork;
the focused signed hosted component profile remains one vCPU. A shared
`DeadlineVmBackend` contract now requires cancellation to be armed before entry
and the cancellation worker to retire before native VM state may be released.
WHP cancels the exact VP through
the platform API. KVM sets `kvm_run.immediate_exit` before sending a reserved
no-op signal to interrupt the exact runner thread, covering the pre-entry signal
race. Focused infinite-loop guests expire on both live hosted backends. The
next backend-neutral contract now consumes the exact logical CPU already
authorized by `CpuRuntimeSlice`, binds the WHP or KVM runner thread before
entry, and restores its complete prior affinity after run and deadline-worker
retirement. Indices outside the current 64-CPU budget model, bind failure, and
restoration uncertainty fail closed. This does not prove a trusted CPU-time
source, exact cancellation latency, native APIC enforcement, priority-class
expansion, child budgets, or physical topology behavior. Those integrations
remain **PLANNED**. One common priority class is now enforced for the focused
profile: budget ceiling and slice priority 0 mean host-normal only. WHP applies
and verifies `THREAD_PRIORITY_NORMAL`; KVM applies and verifies `SCHED_OTHER`
with scheduler priority 0. Both retain the complete prior native state and
restore and verify it after affinity, vCPU, and deadline-worker retirement.
Nonzero priority fails before entry. MRML does not equate Windows dynamic
priority levels with Linux real-time scheduling policies.

A two-vCPU hosted path is now **PARTIALLY IMPLEMENTED** for the signed kernel
SMP probe. `ScheduledSmpVmBackend` accepts two already-authorized scheduling
decisions and returns a separate outcome and conservative host-wall duration
for each runner. One two-vCPU reservation precharges two 100-millisecond slices
against a single 200-millisecond allowance. WHP and KVM enforce logical CPUs 0
and 1, host-normal priority, and a deadline inside the respective concurrent
runner threads; every intermediate guest exit consumes the remaining original
deadline rather than resetting it. Both runners and cancellation workers retire
and restore native state before the slices reconcile independently and the
reservation is released. Fresh release probes measured 6,519/3,593 microseconds
on WHP and 4,601/4,229 microseconds on nested KVM. This remains hosted evidence,
not trusted CPU time, physical topology, general scheduling, or multi-vCPU
adaptive component admission.

The focused signed ZIM/Zstd component profile now consumes one exact
domain-bound vCPU reservation before either hosted backend constructs its
guest. The uncommitted isolation route and budget reservation are composed in
one fail-closed kernel operation: exhaustion records `VCPU_BUDGET`
unavailability and zero native fallback. Successful WHP and nested-KVM runs
retain the reservation until confirmed guest teardown, then verify zero
reserved parallelism and retire the root. Every focused component vCPU entry is
now preceded by precharging the remaining bounded 100-millisecond controlled-
probe allowance. The runner measures host-wall elapsed time across the backend
entry, reconciles exactly once, and teardown verifies the resulting cumulative
runtime before retiring authority. Fresh signed probes reported 1,466
microseconds under WHP and 1,385 microseconds under nested KVM. The charge is
authorized for vCPU 0 on allowed logical CPU 0 at the exact budget ceiling on
both runners. Both probes now report that logical CPU 0 and host-normal priority
were enforced for each bounded entry. This is hosted controlled elapsed-
accounting, cancellation, affinity, and normal-priority evidence, not trusted
guest CPU time or exact deadline latency,
native APIC enforcement, stronger priority-class enforcement, physical-topology
proof, or a host-security boundary. General scheduler and multi-vCPU
enforcement remain **PLANNED**.

Engineering Constitution complexity score: complexity impact `MEDIUM`, TCB
impact `MEDIUM`, new parser `NO`, new authority model `NO`, new persistent state
`NO`, external dependency `NO`, failure isolated `YES`, and existing-object
reuse `YES` through `CpuBudgetTable`, exact reservations, and the shared
KVM/WHP runner boundary. The KVM implementation additionally reserves one
process-wide no-op signal only when the existing disposition is default or
already MRML's handler; a conflicting disposition fails before vCPU entry.

## System power policy

First-class profiles are `LOW_POWER`, `BALANCED`, `PERFORMANCE`, and `CUSTOM`;
names are not frozen ABI. Where supported, one coordinated policy may influence
CPU frequency/boost/package power/core preference/idle depth, GPU clocks/power/
compute/memory policy, NVMe states, Wi-Fi scanning and saving, Bluetooth,
display refresh/brightness, cooling/acoustics, and scheduler latency/efficiency.
Unsupported controls remain explicit rather than simulated.

> Power mode changes resource/performance policy, not security authority.

Performance mode grants no filesystem, GPU-engine, network, device, secret, or
other authority. It may adjust quantitative budgets only within owner/system
policy and never silently disables required mitigations.

## Sensors and thermal safety

A capability-bound telemetry service may expose supported CPU package/core, GPU
and hotspot, NVMe, board/chipset, and battery temperatures; fan speeds; power
draw and limits; and throttle state. Observation, retention/export, control, and
content access are distinct. Vendor backends interpret hardware-specific safe
limits (including differing Tjmax); common policy consumes normalized states.

```text
NORMAL -> WARNING -> THROTTLE -> RESOURCE_REDUCTION
       -> WORKLOAD_TERMINATION -> EMERGENCY_SHUTDOWN
```

Where hardware safety permits, policy first reduces boost and CPU/GPU budgets,
uses efficient resources, raises cooling, and reduces nonessential work; then it
suspends or terminates selected high-contribution workloads; finally it shuts
down. Hardware emergency protection remains independent. The minimum trusted
thermal path cannot depend on compositor, shell, AI, or ordinary applications.
Attribution reports resource use or estimated thermal contribution, never false
per-process temperature causation.

## System monitor and physical-device milestones

The cross-subsystem model and observation/remediation boundary are canonical in
[the unified system-monitor design](../monitor/SYSTEM_MONITOR.md). This section
remains authoritative for CPU, power, thermal, and physical-device facts.

The semantic system monitor may show authorized CPU topology/class utilization,
frequency, package power and temperature; RAM commitment/limits; GPU engines,
VRAM, temperature and power; storage I/O and NVMe temperature; network activity;
per-domain CPU/RAM/VRAM/GPU budgets and capabilities; active power profile; and
thermal state/actions. `INSPECT_CPU_USAGE` grants neither `CHANGE_CPU_BUDGET`,
`CHANGE_POWER_PROFILE`, `READ_PROCESS_MEMORY`, nor `KILL_TASK`. Sensor inspection
does not grant thermal control.

Early physical bring-up includes USB keyboard, mouse and basic pointing devices,
then advanced/trackpad and accessibility/Braille HID. Trusted input/compositor
routing prevents ambient global raw HID. Desktop text follows shaping/layout ->
glyph cache -> GPU acceleration where available -> software/GOP fallback;
semantic text and accessibility survive GPU failure.

A first-party native terminal milestone covers Unicode, HiDPI, accelerated text
with software fallback, semantic accessibility and Braille/speech, capability-
aware clipboard, and bounded scrollback/resources. The terminal is not root and
opening it grants no ambient authority.

NVMe is an early storage backend with separate controller, namespace, and queue
objects, bounded DMA/IOMMU, reset/recovery, telemetry, and power integration;
health inspection does not authorize storage contents. Wi-Fi belongs in a
userspace capability service separating radio/interface, scan, connect,
configuration, and raw-frame rights, with privacy-aware address policy. The
source request's final firmware requirement was truncated and remains an open
documentation input rather than an inferred policy.

## Verification, dependency order, and reviews

Implement in bounded gates: discovery/reference-floor rejection; vendor
microcode loaders and post-update state; rule evaluator; scheduler security and
topology descriptors; quantitative CPU budgets; power service; telemetry and
trusted thermal path; monitor; then physical-device milestones. Tests cover
identity/feature parsing, invalid/inapplicable/replayed updates, post-update
re-evaluation, unknown/fail-closed states, rule boundaries, topology/SMT/cache
placement, hysteresis, budget attenuation/revocation, mitigation persistence
across profiles, capability separation, sensor faults, graded thermal action,
and UI-independent shutdown. Label simulation, hosted VMM, nested virtualization,
and exact physical Intel/AMD evidence separately.

Digital-rights review: monitoring reveals only authorized state; power and
thermal policy do not create vendor authority, hidden observation, or an
accessibility-only failure path. Hostile-security review: treat CPUID, firmware
tables, microcode data/results, sensor values, topology, hardware hints, guest
state, and control transitions as adversarial; unknown and partial state fails
closed, budgets cannot amplify, and stale scheduling/control state is revoked.

Patent review: `NOT_TRIGGERED` — this delta documents conventional platform
discovery, vendor-defined microcode loading, rule-based mitigation selection,
resource scheduling, telemetry, and safety policy without selecting a novel
implementation mechanism. Reassess each concrete mechanism under
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
