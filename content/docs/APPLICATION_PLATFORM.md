# MRML application-platform architecture

This document preserves the intended application-platform design. Unless a
section explicitly says otherwise, it is **PLANNED** or **ASPIRATIONAL**, not an
implementation claim. Status terms follow [ARCHITECTURE.md](ARCHITECTURE.md).
Security boundaries remain normative in [SECURITY.md](SECURITY.md), dependency
order in [ROADMAP.md](ROADMAP.md), and recovery procedure in
[RECOVERY.md](RECOVERY.md).

## Current status

**IMPLEMENTED:** the repository has capability, IPC, task/address-space,
executable-loading, WHP/KVM, and experimental Rust-subset compiler mechanisms
that can support later application work.

**PARTIALLY IMPLEMENTED:** signed PE loading and isolated CPL3 service probes
exercise low-level execution and service mechanisms. They are not a stable
application ABI, SDK, GUI, or complete application lifecycle.

**EXPERIMENTAL:** `mrml-rustc` compiles a documented Rust subset and itself
forbids unsafe code. It is not a complete Rust compiler, application admission
system, or proof that arbitrary top-level Rust applications and dependencies
are memory-safe. `mrml-tools` provides experimental public-HTTPS fetch and
search tools; it does not automate an installed browser and is not an MRML
browser engine or OS browser security boundary.

**PLANNED:** safe native application admission and SDK, stable service
protocols, application microVM projection, trusted compositor, semantic scene
graph, HiDPI desktop, browser, and capability-mediated AI control plane.

**ASPIRATIONAL:** a polished, broadly compatible, empirically fingerprint-
resistant application ecosystem with local and remote LLM control that retains
strict least authority.

There is currently no MRML OS GUI/compositor, semantic scene graph, native
application ABI, application microVM system, browser engine, JavaScript or
WebAssembly runtime, or CET/IBT application-admission enforcement.

## Foundational application model

Native application packages may use static dependencies, in-process dynamic
interfaces, or isolated service interfaces. The stable component contract is an
explicit MRML interface—not Rust's compiler ABI, a provider package name, or a
DLL/SO filename. Exact resolution, loading, lifetime, and update behavior are
specified in [packages/COMPONENT_INTERFACES.md](packages/COMPONENT_INTERFACES.md).
Loading an in-process provider grants no new authority; an isolated provider
receives separately projected capabilities.

Applications receive explicit quantitative memory pools according to
[memory/MEMORY_RESOURCE_MODEL.md](memory/MEMORY_RESOURCE_MODEL.md), not ambient
unlimited allocation. Usage introspection is separate from memory-content access.

The future platform combines memory safety, capability authority, process
isolation, optional stronger VM isolation, stable application-facing contracts,
a trusted compositor, machine-readable GUI state, first-class HiDPI, local and
remote LLM control, explicit security boundaries, and minimal ambient authority.
Historical POSIX/C security and ABI conventions and legacy compatibility do not
dictate the foundation.

```text
native MRML application
    -> approved memory-safe language/runtime
    -> safe MRML SDK
    -> versioned MRML service protocols
    -> capability IPC
```

Safe Rust is the primary intended native systems/application language. Ordinary
third-party native applications do not receive a general-purpose C/C++ ABI.
Rust's compiler-internal/native ABI is also not MRML's stable application ABI.
Stability belongs in explicit, bounded, versioned service protocols beneath
safe SDKs. The kernel ABI remains extremely small; filesystem, network, GUI,
configuration, AI, and media functionality normally comes from services.

Application microVM devices are projections of the application's exact
capabilities, following [PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md). A file,
directory, connection, or accessibility capability cannot widen into a host
disk, ambient host filesystem/network, global input, or secure attention.

### Unsafe-code policy

- Ordinary native applications: unsafe code prohibited by default.
- System services: unsafe strongly discouraged and permitted only when
  technically necessary.
- Drivers, VMM, kernel, compiler, and hardware boundaries: unsafe permitted only
  when necessary, with documented safety invariants and adversarial review.

Application build/admission should eventually enforce `#![forbid(unsafe_code)]`
or an equivalent transitive property. A safe top-level Rust crate is not enough:
native FFI or unsafe dependencies can defeat memory safety and must not enter the
ordinary application ecosystem silently.

Admission distinguishes three profiles: the ordinary Application profile uses
safe Rust, no unsafe native FFI, and no arbitrary native JIT; the System profile
permits only justified and audited unsafe/FFI boundaries; the Compiler/Kernel
profile supports the lowest-level work with the strongest review. “Written in
Rust” is not evidence by itself. Build metadata and review inventory unsafe,
FFI, assembly, naked functions, and mitigation exceptions, and admission never
accepts self-asserted compiler metadata as proof.

### Execution classes

Per-component placement preferences, mandatory floors, supported forms,
persistent owner policy, and the one-boot total-microVM request are canonical in
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md). Typed Manifest V2 policy
validation is **PARTIALLY IMPLEMENTED**; microVM placement, Settings, and strict
Total runtime/boot enforcement remain **PLANNED**. Total mode never converts a
failed eligible microVM launch into native execution. Balanced may select a
visible supported native placement where the package floor permits. These rules
refine the classes below without introducing another sandbox architecture.

1. A native safe application is a memory-safe, isolated CPL3 process controlled
   by capabilities.
2. A strongly isolated MRML application, or small related group, runs inside a
   microVM with MRML application interfaces projected across the VM boundary.
3. A compatibility application runs in an explicit legacy guest environment,
   potentially Linux or Windows where lawful and technically appropriate.

Unsafe and legacy ecosystems remain inside their VM trust boundary. MRML does
not weaken native policy to make legacy binaries appear native. WebAssembly is
not a fourth system application class.

Where practical, native and microVM applications use the same high-level SDK.
Native calls reach direct service IPC; microVM calls use a paravirtualized,
capability-preserving transport. The security boundary changes, not the
conceptual API. VM transport must not manufacture, widen, or confuse authority.

## WebAssembly and browser execution

The normative browser semantic tree, accessibility parity, JavaScript/Wasm
runtime constraints, and media-inspection model are in
[BROWSER_SEMANTICS.md](BROWSER_SEMANTICS.md).

WebAssembly is browser content, not an MRML native application format. There is
no system-wide WASI/WebAssembly runtime unless a future explicit architecture
and security decision changes this rule. Browser-hosted WebAssembly receives
only origin-specific authority mediated by the browser and cannot bypass native
admission or capability policy.

The planned browser operates without a JavaScript or WebAssembly JIT. Web
execution must not introduce writable-and-executable memory. Interpretation or
appropriately reviewed ahead-of-time-safe mechanisms preserve W^X. No-JIT is an
intentional security decision, not a temporary performance defect; changing it
requires explicit architecture and security review rather than benchmark
pressure.

### Fingerprint resistance

The browser should expose cohort-normalized properties for equivalent
configurations and avoid unnecessary machine uniqueness. Relevant surfaces
include user agent and version granularity, platform, fonts, locale/timezone,
screen/logical viewport/DPI, GPU and graphics capabilities, canvas, WebGL/WebGPU,
audio, timing precision, CPU/core and memory information, input devices, media
and codecs, installed features, and extensions/plugins. Avoid stable per-user
randomization that becomes its own fingerprint. Document privacy, performance,
and compatibility tradeoffs and test real fingerprinting suites before making
strong claims. Perfect anonymity is not promised.

### Hardware authority

Browser possession of a capability never automatically delegates it to a site.
Camera, microphone, location, USB, Bluetooth, HID, serial, filesystem,
clipboard, screen capture, and GPU APIs require separate origin-specific policy
and explicit authority.

## Trusted compositor and desktop

The planned trusted compositor owns the final display. Applications and VMs
submit surfaces; they never own the physical display or trusted decorations.
The compositor controls composition, placement, decorations, trusted identity
indicators, focus, keyboard/pointer/touch/pen routing, clipboard and drag/drop,
secure prompts, accessibility semantics, capture policy, display configuration,
and HiDPI mapping.

Applications cannot spoof compositor-owned security surfaces. Isolation-domain
indicators may show application identity, trust/VM domain, isolation class, and
security state using labels, symbols, trusted decoration, and optional accents;
they never rely on color alone. This borrows the value of visibly distinct
domains without copying Qubes UI.

The visual direction is a polished, modern, accessible desktop with original
MRML identity: clean geometry, rounded surfaces, restrained translucency,
coherent and reduced-motion-aware animation, configurable launch surfaces,
quick settings, notifications, settings, light/dark appearance, keyboard
navigation, and strong HiDPI. Familiarity is useful; copying trademarks,
proprietary assets, names, icons, or another OS's exact design is forbidden.

### Graphics object and backend model

**PARTIALLY IMPLEMENTED:** the kernel foundation now has bounded logical
rectangles and fractional scales, generational `Surface`, `GraphicsBuffer`, and
`DisplayOutput` identities, validated physical buffer layout, and a one-use
capability-admitted atomic surface binding. The admission boundary requires
separate surface-control, output-inspection, and buffer-read capabilities,
rejects substituted objects, stale/revoked handles, overflowing geometry,
undersized buffers, and out-of-bounds damage, and retains the exact identities,
scale, serial, and damage in the resulting immutable data-plane binding. The
binding retains the exact capability handles and performs a bounded
exact-object recheck before later mapping, copy, or presentation, so revocation
and slot reuse still stop the short path without replaying placement policy. The
trusted registry/compositor must supply the authoritative object generations;
the new generation-1 `org.mrml.interface.gui.surface` adapter resolves its
opaque generational handles through that trusted boundary before calling the
same admission path. Interface bytes and handles grant no capability. The new
`org.mrml.service.compositor` package now supplies a fixed-capacity volatile
registry for that resolver. It rejects duplicate object identity or capability,
wrong object kind, capacity exhaustion, stale generations, and reuse; retirement
advances the slot generation and returns retained authority for explicit cleanup.
Each service instance also requires a nonzero supervisor generation encoded
separately from the slot counter, so a restarted registry cannot accept an old
same-slot handle. Slot-counter exhaustion permanently retires that slot rather
than wrapping. It does not mint capabilities. A bounded transport slice is now
**PARTIALLY IMPLEMENTED**: native task IPC and a backend-neutral microVM queue
carry the identical fixed surface frame into the same registry and kernel
admission. Native calls reject unexpected senders and capability transfer;
microVM queue reset invalidates every old ticket. The compositor runtime,
object-creation policy, presentation, persistent desktop state, guest mapping,
and WHP/KVM GUI execution remain unimplemented.

The distinct `org.mrml.app.gui-probe` application is now a
**PARTIALLY IMPLEMENTED** representative client. Its Manifest V2 policy permits
native-process or microVM placement, while its `no_std` client state machine
constructs only the canonical interface-owned 312-byte frame and accepts only a
typed completion for the one outstanding serial. Native and microVM placement
therefore do not change application protocol bytes. A separately signed release
image completed the same exact-generation Total-mode CPL3 lifecycle on WHP and
nested KVM. The executable does not yet send a surface commit from inside the
guest; application IPC projection, compositor connection, Semantic Scene Graph,
rendering, and presentation remain **PLANNED**.

Constitution review for this bounded foundation:

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

It reuses the existing capability space and fixed-capacity, checked `no_std`
style. Presentation policy and mutable desktop state remain outside the kernel;
the fixed registry is in the compositor service package. The compositor runtime
and presentation path are separate review gates.

**PARTIALLY IMPLEMENTED:** the canonical generation-1 surface interface has a
SHA3-256-fingerprinted `mrml-call-v1` schema, fixed 112-byte commit envelope,
fixed 200-byte canonical state, at most eight explicit damage rectangles, and a
16-byte response. It bounds and canonicalizes handles, borrowed-memory extent,
logical/physical geometry, rational scale, buffer layout, format, serial, damage,
reserved bytes, status, and response serial. Native IPC and microVM transports
will carry these identical bytes; neither transport exists for this interface
yet, and Rust's ABI is not the contract.

**PLANNED:** applications and application VMs submit those protocol objects to
the trusted compositor. They never render directly to GOP, the VGPU, a native
physical GPU, or scanout during normal desktop operation. The trusted compositor
owns final presentation through a backend-neutral render/display interface with
GOP initially, VGPU acceleration later, and native GPU backends after that.
Application GUI semantics never depend on the selected backend.

Surface, graphics buffer, render device, and display device are distinct. A
surface contains logical size/scale, state, input/opaque regions, damage,
semantic linkage, and an attached buffer. A buffer contains physical dimensions,
format, stride/layout, backing, and ownership. A render device produces or
operates on resources; a display device presents completed output. A GPU may
render without driving scanout, so rendering and presentation cannot collapse
into one abstraction.

Graphics resources are stable capability-bound objects such as `Surface`,
`GraphicsBuffer`, `RenderDevice`, `DisplayOutput`, `Fence`, and `CommandQueue`.
Conceptual attenuated rights include `MAP_CPU`, `RENDER`, `SAMPLE`, `PRESENT`,
`SHARE`, and `CONFIGURE`; these are not frozen ABI definitions. Buffer write
authority does not imply presentation, scanout, another process's buffer, or
display-configuration authority.

Surface updates are atomic commits: buffer attachment, title, semantic state,
and damage become visible as one coherent transition. Damage tracking is a
first-class optimization, especially for software GOP composition, but
incorrect or missing application damage cannot violate correctness; the
compositor retains a safe full-redraw fallback. Capability-bound fences or
equivalent monotonic synchronization permit asynchronous rendering and safe
buffer reuse without blocking the whole compositor on one client.

The initial/recovery backend is a compositor-owned software backbuffer copied by
damaged region into the validated UEFI GOP framebuffer. Applications never map
the physical GOP framebuffer. GOP remains available for early boot, bring-up,
recovery, diagnostics, and accelerated-driver failure.

Accelerated rendering is optional for retaining trusted UI. GOP-to-VGPU/native
takeover preserves existing surface identities while changing only compositor
backend state. Conversely, accelerated failure revokes or fails affected
resources, recreates required software buffers, and returns to GOP without
weakening trusted decoration, semantic state, or capability validation—and,
where safely possible, without rebooting or restarting applications.

The VGPU provides low-level buffers, textures, copies, render commands, fences,
and presentation resources; it does not know buttons, text fields, window
titles, or accessibility nodes. Prefer bounded asynchronous shared command and
completion rings so tiny operations do not each require a VM exit. Guests use
validated generational resource IDs, never arbitrary host pointers. KVM/WHP
details remain below the common VMM/VGPU boundary and never enter the compositor
or application protocol.

### HiDPI and coordinates

Logical coordinates, not framebuffer pixels, are canonical. Each output exposes
validated physical resolution/dimensions, logical dimensions, scale, refresh,
orientation, color-space, and HDR capability where available. Scaling is
fractional and per-monitor; it is not restricted to a hard-coded list.
Applications operate in logical space and the compositor performs physical
mapping.

Automation uses the same logical space and identifies every spatial reference
with the appropriate display, window, surface, and object identities. Changing
DPI must not invalidate semantic automation.

## MRML Semantic Scene Graph

The GUI is never only pixels. Every native GUI maintains synchronized visual
and semantic representations. The semantic representation serves accessibility,
testing, automation, local/remote LLMs, and debugging. Pixels remain a fallback
and an explicitly requested multimodal resource.

Each semantic object should expose only appropriate information such as stable
object identity, role, parent/children, window, application and trust domain,
logical bounds, visible region, z-order, text/value/state, available actions,
focus, enabled state, selection, and description. Stable object actions such as
`activate`, `set_value`, `move`, and `launch` are preferred over pointer
coordinates and keystrokes.

Inspection and interaction are separate capabilities, conceptually
`gui.inspect` and `gui.interact`. Global raw HID injection, such as
`input.pointer.inject` or `input.keyboard.inject`, is a substantially stronger,
separately privileged fallback and is not automatically granted to AI agents.

The graph is incremental. Typed deltas include object add/remove, bounds, text,
value, state and focus changes, and window open/close. Consumers maintain a
synchronized bounded view instead of repeatedly receiving the whole desktop.
This reduces latency, tokens, remote API cost, and local context use. Object
identities, generations, visibility, actions, ordering, delta loss/recovery,
and subscription authorization require adversarial validation.

Semantic state and the surface tree remain synchronized but independent. A
rendering backend failure may replace buffers or presentation state; it must not
destroy the semantic desktop used by accessibility, text-only AI, automation,
or recovery.

The graph is the canonical accessibility substrate. Visual GUI, keyboard,
refreshable Braille, trusted speech input/output, switch and adaptive devices,
automation, UI testing, and AI consume appropriate projections of the same
roles, state, focus, actions, and host-owned security identity. Accessibility
inspection and interaction remain explicit capabilities, secrets are redacted
consistently, and essential trusted prompts cannot depend on vision, color,
sound, or pointer coordinates alone. The planned contract is in
[ACCESSIBILITY.md](ACCESSIBILITY.md).

If text-only AI can inspect task-essential structured meaning, supported human
accessibility interfaces receive equivalent meaning unless a documented
technical or security reason prevents it. This is semantic parity, not format or
authority parity: an AI may lack interaction rights, a Braille session may have
them, and an application sees only its own objects. The AI path cannot become a
privileged semantic backdoor.

## AI and multimodal access

Applications, compositor, media, and AI acceleration use capability-derived GPU
domains from [gpu/GPU_ARCHITECTURE.md](gpu/GPU_ARCHITECTURE.md). Rendering,
presentation, surface readback, media inspection, compute, and encode remain
separate authority.

Semantic/text state is the default AI path. Screenshots, image bytes, or video
frames are requested lazily only when semantics are insufficient and the agent
has the relevant capability. Images, video, and audio are capability-controlled
semantic objects that can expose inexpensive metadata, descriptions, captions,
transcripts, chapters, duration, and current time before bytes or sampled
frames. Text-only models need not receive media bytes.

AI control never implies broad machine authority. Semantic inspection,
interaction, media access, network use, filesystem access, and raw input remain
separate capabilities. Remote LLM transport additionally requires explicit
disclosure policy so secrets and private UI state are not exported implicitly.

Remote AI receives a capability-scoped `SemanticView`, normally one authorized
window or subtree, rather than the desktop. It does not automatically learn
installed applications, other windows or titles, file names/layout, notification
or clipboard history, contacts, browsing/network history, device inventory,
credential metadata, or activity history. Incremental updates preserve the same
scope and redaction. Core operation supports no AI, local AI, OpenAI-backed
remote AI, and other future providers under equivalent capability rules; no
provider is an ordinary-operation root of trust.

Security assumes models can hallucinate, misunderstand, follow injected content,
and propose unsafe actions. The enforced property is that a bad decision cannot
exceed the session's delegated authority, not that the model always decides
safely.

Native applications obtain networking, audio, USB classes, and input through
capability-bound userspace services, not VMM devices or raw hardware. Network
connection objects are distinct from raw packet authority. Audio playback is
distinct from microphone capture. USB composite interfaces are independently
grantable. Input is routed by trusted host services and compositor focus; raw
global HID and secure-attention handling are never ordinary application or VM
capabilities.

## Authority and security UX

The planned Network & Devices settings frontend uses the exact typed services in
[network/NETWORK_ADMINISTRATION.md](network/NETWORK_ADMINISTRATION.md). GUI,
shell, accessibility, automation, and AI differ in presentation/capability scope,
not configuration semantics; none receives secrets or raw network authority by
identity.

The native terminal, object-oriented administration shell, Store, deployment
service, and text/GUI installer follow [DEPLOYMENT.md](DEPLOYMENT.md). Semantic
objects—not rendered text or pixels—cross administration interfaces. The GUI is
a projection over the same `InstallPlan` and exact destructive authorization as
the text installer, and neither terminal nor first-party origin grants authority.

The planned semantic system monitor follows the canonical
[unified system-monitor architecture](monitor/SYSTEM_MONITOR.md) and
[CPU_PLATFORM.md](platform/CPU_PLATFORM.md): CPU, resource, power, sensor, and
thermal observation is capability-scoped and does not imply budget changes,
process-memory access, task termination, or hardware control. The native
terminal remains an ordinary bounded application, not an authority shortcut.

**PLANNED:** trusted file pickers delegate object capabilities, not path strings.
An open request yields only the selected file and requested rights, not its
containing directory. Save delegates only the create/replace authority required
for the selected destination. Picker UI and the delegation transaction are
trusted-system surfaces that applications cannot spoof.

The one system monitor combines CPU, memory, GPU, and I/O usage with each process,
application, VM, and AI principal's isolation class, filesystem/network/device/
audio/debug/AI authority, temporary elevation, and active security exceptions.
Where semantically safe, live revoke invokes the actual capability mechanism,
not a cosmetic policy toggle. Human views express intent (“can authenticate to
GitHub; cannot read the password”) while advanced authorized views expose the
bounded delegation graph.

The authority explanation answers “why can this application do this?” by tracing
principal, capability, delegation source, rights, scope, and expiration without
revealing unrelated state, and offers real revocation where semantics permit.
Administrative work composes specific maintenance capabilities rather than
recreating an omnipotent Unix-root or Windows-SYSTEM principal.

Documented platform, accessibility, automation, monitoring, backup, password-
manager, debugger, browser, shell, file-manager, and AI-client interfaces are
available to equivalent third-party software under the same admission and
capability rules. Trusted mediation may expose a narrower stable interface, but
first-party status does not bypass authorization.

AI sessions are visible principals with provider/model, local or remote status,
session identity, current/temporary capabilities, network reach, accessible
objects, and expiration. Users have a trusted “revoke all authority” operation.
AI may receive scoped browser or development debugging and non-extractable
credential use without camera, microphone, policy, unrelated-process, secret-
export, or root-equivalent authority.

Trusted UI clearly marks disposable domains and active security reductions such
as debug rights, raw device access, credential export, global input injection,
camera/microphone capture, VM passthrough, CET/IBT exceptions, or a future JIT
exception. Indicators use system state rather than application claims and remain
revocable where temporary.

### Browser semantic interface

This section is summarized by and must remain consistent with the canonical
contract in [BROWSER_SEMANTICS.md](BROWSER_SEMANTICS.md).

The browser exposes a sanitized interactive document tree combining document
structure, accessibility semantics, actual layout, visibility, hit testing, and
interactive state. This is the primary LLM browsing interface. Normal AI web
control uses deliberate navigation, inspection, find, activation, value-setting,
scrolling, and authorized media-inspection operations—not arbitrary DOM code,
JavaScript execution, browser memory, debugger/root interfaces, or continuous
screenshots.

Photographs, maps, canvas, WebGL, charts, games, and video appear as semantic
media objects when ordinary semantics cannot represent them. Visual inspection
is explicit, scoped, lazy, and capability checked.

This sanitized tree is also the browser accessibility and keyboard foundation;
avoid unrelated DOM, screen-reader, automation, and AI semantics where one
validated projection suffices. Media semantics preserve available captions,
transcripts, audio descriptions, chapters, language, and timing.
