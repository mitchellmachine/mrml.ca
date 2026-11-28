# MRML accessibility architecture

**Status: PLANNED.** This is durable architecture, not a claim that MRML
currently implements a desktop, screen reader, speech recognizer, or Braille
device stack.

> Accessibility belongs in the architecture, not on top of it.

> **If MRML can expose meaningful structured interface state to a text-only AI,
> it must be able to expose equivalent meaningful state to human accessibility
> interfaces where technically applicable.**

This requires shared underlying semantic truth, not identical formatting,
interaction, or authority. Visual, Braille, speech, keyboard, and AI consumers
have different presentation needs and explicit capabilities. Equivalent meaning
where appropriate does not grant authority parity, and the AI interface must
never become a richer semantic backdoor.

```text
Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: YES
New authority model: NO
New persistent state: YES
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

The parser and persistent-state answers cover planned bounded semantic/device
transports and session/focus state, not current implementation. Reusing the
object, capability, Semantic Scene Graph, audio, and trusted-input architecture
avoids a parallel accessibility stack.

## One semantic system, many interfaces

```text
                  MRML objects
                       |
              Semantic Scene Graph
                       |
       +---------------+----------------+
       |               |                |
       v               v                v
    Visual           Braille          Speech
      GUI            interface        interface
       |
       +-------- Keyboard / HID
       +-------- Accessibility tools
       +-------- Text-only AI
       +-------- Multimodal AI
```

Visual GUI, Braille, speech, keyboard, accessibility devices, automation,
testing, and AI project the same object identity, role, state, actions, focus,
and authority where practical. They must not become routinely divergent
semantic systems. Consumers do not receive identical authority: semantic
inspection, interaction, raw input, media, speech capture, device routing, and
remote disclosure remain separately capability-controlled.

Logical objects and coordinates are independent of framebuffer resolution and
HiDPI scale. Rendering failure or GOP/VGPU transition must not destroy semantic
identity. Where relevant services remain operational, Braille, speech, keyboard,
and semantic interaction should continue without GPU acceleration or framebuffer
inspection.

## Semantic actions and input

Ordinary controls expose `focus`, `activate`, `select`, `expand`, `collapse`,
`increment`, `decrement`, `set_value`, and `scroll` independently of pointer
coordinates. Keyboard-first operation and deterministic focus order are
platform requirements where practical.

Adaptive keyboards, switch controls, alternative pointing devices, eye
tracking, sip-and-puff devices, Braille keyboards, and other accessibility HID
devices translate through trusted services into semantic input/actions. They do
not each need a special kernel authority model.

## Braille output and input

Browser-specific semantic identity, Braille/speech projection, blind-human and
text-only-AI parity, media description, and ABI evidence gates are specified in
[BROWSER_SEMANTICS.md](BROWSER_SEMANTICS.md).

The planned VMM accessibility bus and deterministic Braille/input emulators are
specified in [PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md). They permit CI and
development across 14/20/32/40/64/80-cell configurations without claiming
physical-device compatibility. Emulated output has deterministic text state;
test-only event injection is not guest or production-application authority.

Refreshable Braille is a first-class system interface, not framebuffer scraping:

```text
Semantic Scene Graph -> accessibility service -> Braille presentation
                     -> refreshable Braille device
```

The representation should carry focus, text, selection, cursor, headings,
links, buttons, forms, lists, tables, status, notifications, and trusted prompts.
Routing keys invoke authorized semantic actions, not pixels.

Braille input enters the trusted input architecture and targets the focused
semantic object under normal isolation and capability rules. A focused app or
VM never receives global Braille input. Prefer interoperable protocols and a
narrow device/interface capability over raw USB authority.

The initial usability target is a common approximately 40-cell device with
routing/navigation keys and Braille input, without binding the semantic model to
one size, vendor, or transport. Compact lines, structured navigation, routing,
text editing, trusted prompts, tables, browser/media semantics, capabilities,
and evidence rules are specified in
[accessibility/BRAILLE_INTERFACE.md](accessibility/BRAILLE_INTERFACE.md).

## Speech output, input, and privacy

```text
Semantic Scene Graph -> accessibility speech service -> speech synthesis
                     -> MRML audio service -> audio output

microphone -> trusted capture -> speech recognition/interpretation
           -> semantic command -> MRML object operation
```

Speech output should describe controls, text, focus/window changes, menus,
notifications, trusted prompts, security state, errors, configuration, and
recovery. A blind user must not need the framebuffer to understand a trusted
prompt. Trusted speech output is distinct from application playback, VM audio,
and notifications, and applications cannot capture it by default.

Prefer semantic voice actions over simulated coordinates. Speech recognition,
deterministic command interpretation, and AI reasoning are separate layers.
Basic voice control must work locally without an LLM or Internet connection.
Remote services are optional and require an explicit trusted boundary; privacy
claims require evidence.

Trusted accessibility capture, application microphone capture, VM capture, and
AI microphone access are distinct authorities. Voice control never exposes raw
audio to apps or remote AI automatically.

## Capabilities, secrets, and trusted prompts

Potential future objects include `AccessibilitySession`, `SemanticView`,
`BrailleDisplay`, `SpeechInputSession`, `SpeechOutputSession`, and `InputRoute`;
names are not yet ABI. Rights remain separable:

```text
semantic.inspect   semantic.interact
speech.capture     speech.control
braille.output     braille.input
```

There is no `ACCESSIBILITY_ROOT`. Broad screen-reader visibility is explicit,
inspectable, and auditable. Redaction applies identically to visual, Braille,
speech, automation, and AI. A password field may expose role and `populated`
state while its value remains `REDACTED`.

Third-party assistive software may use documented semantic, Braille, speech, and
input interfaces under the same admission and capability model as MRML-shipped
software. Trusted mediation may remain inside the TCB where necessary, but must
expose the smallest safe stable interface above it. A publisher cannot disable
screen-reader semantics, Braille, available required captions/transcripts, or
owner-chosen accessibility tools by labeling content protected. Ordinary privacy
redaction still applies uniformly; accessibility is neither a publisher veto nor
a universal privilege bypass.

Capability elevation, credential use/export, device assignment, microphone or
camera permission, AI/debug authority, security exceptions, login, recovery,
and update approval must eventually have equivalent meaningful visual, Braille,
speech, keyboard, and appropriate-device semantics. No trusted decision may
require only color, sound, icon, animation, position, or pixels. Host-owned
domain identity accompanies untrusted content in every interface.

## VMs, browser, media, boot, and recovery

Boot/security settings and network/device configuration use the semantic typed
objects in [platform/UEFI_BOOT_MANAGEMENT.md](platform/UEFI_BOOT_MANAGEMENT.md)
and [network/NETWORK_ADMINISTRATION.md](network/NETWORK_ADMINISTRATION.md).
Essential entry/order/trust, Ethernet, Wi-Fi, Bluetooth, pairing, and secret-
input workflows cannot depend on visual-only UI.

Installation and offline servicing follow [DEPLOYMENT.md](DEPLOYMENT.md). The
text installer is the first complete path; a later GUI is a semantic projection
over the same `InstallPlan`, exact destructive preview, trusted authorization,
and verification state. Neither path may make sight, pointer use, cloud AI, or a
working accelerated GPU a prerequisite for essential install/recovery choices.
Disk/image, optical media, burn progress, and destructive previews use the same
semantic objects described in
[storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md). The pre-OS
boot menu's documented text/keyboard baseline applies to selecting `MRML` or
`MRML Recovery`. `MRML` always means strict Total MicroVM; there is no isolation
mode picker. In the admitted runtime, isolation status and required-component
failures must have equivalent meaning across visual, keyboard, Braille, speech,
and trusted nonvisual interfaces. A failed accessibility bridge or projected
input/speech route is a high-priority component failure, not permission to
launch an eligible application natively. See
[ISOLATION_PLACEMENT.md](ISOLATION_PLACEMENT.md).

Application VMs project authenticated, bounded guest GUI semantics into the
host graph. Guest semantics are untrusted content and cannot forge compositor-
owned domain/security identity. Compatibility VMs may bridge guest accessibility
APIs under the same validation rule.

The browser's sanitized interactive document tree is the common accessibility,
keyboard, automation, and AI representation. Web content remains untrusted.
Media objects may expose captions, transcripts, audio descriptions, chapters,
semantic descriptions, language, and timing; multimodal inspection remains lazy
and authorized.

Architecture must permit accessibility before the full desktop where hardware
and service prerequisites allow. Long-term targets include boot errors, rollback
selection, security warnings, login, recovery, and repair. This is not a claim
of current early-boot support.

Essential system information must never be communicated solely through sound.
Alerts, errors, security events, communications, timers, and device
notifications need semantic/visual equivalents; media uses captions/transcripts
where available. Future design also covers reduced motion, predictable focus,
clear language, consistent navigation, adjustable density, reduced clutter,
time-limit accommodation where security permits, keyboard/switch/voice/adaptive
HID operation, large text, high contrast, zoom, reduced transparency, clear
focus, and scalable cursors without changing semantic identity.

## Maturity, service recovery, and ABI evidence

Accessibility claims use these cumulative levels:

```text
DESIGNED         architecture exists
SEMANTIC         required objects/actions exist
SIMULATED        automated backend passes
HARDWARE-TESTED  real assistive hardware tested
USER-TESTED      disabled users completed workflows
CORE-ACCESSIBLE  monitor-off core acceptance passes
```

`SEMANTIC` is not production readiness. Before ABI stabilization, seek practical
feedback across Braille, screen-reader, keyboard-only, low-vision, motor, and
Deaf/hard-of-hearing use; no one user represents all needs. Study relevant
standards and interoperable Braille/accessibility device protocols before
inventing transport, while keeping MRML semantics transport-neutral.

Accessibility services may observe broad semantic state and are security-
sensitive. Separate observation, interaction, microphone, Braille HID, audio,
and trusted-prompt rights. On presentation-service failure, restart, reconnect
incremental state, and restore focus/context where practical without reboot or
authority expansion.

Track focus-to-Braille, focus-to-speech, Braille-input-to-action, speech-command-
to-action, and semantic-delta latency. Braille and speech consume incremental
`FOCUS_CHANGED`, `TEXT_CHANGED`, `VALUE_CHANGED`, `STATE_CHANGED`,
`OBJECT_ADDED`, and `OBJECT_REMOVED` updates shared with authorized AI/automation.

## Testing

The unified system monitor's task, integrity, security, resource, and recovery
views use this same semantic system. Keyboard, speech, and Braille must convey
equivalent status, evidence limits, event gaps, severity, relationships, and
authorized actions without relying on color or charts; see
[monitor/SYSTEM_MONITOR.md](monitor/SYSTEM_MONITOR.md). This remains **PLANNED**.

Future tests cover semantic completeness, focus order, keyboard-only workflows,
Braille/speech representations, redaction, trusted prompts, VM/browser
projection, render-backend and HiDPI independence, and capability enforcement.
Dogfood workflows without a pointer or framebuffer inspection, through the
semantic tree, speech, and Braille representation. Claim physical Braille
support only after physical-device tests; label simulation honestly.

The explicit monitor-disconnected goal, AI/accessibility parity regression,
recovery scenarios, evidence recording, and progressively supported workflow are
defined in
[accessibility/MONITOR_OFF_ACCEPTANCE.md](accessibility/MONITOR_OFF_ACCEPTANCE.md).
