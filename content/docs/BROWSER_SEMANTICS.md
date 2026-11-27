# MRML accessible browser semantic architecture

**Status: PLANNED.** MRML does not currently implement an OS browser, JavaScript
engine, WebAssembly runtime, browser semantic tree, or browser accessibility/AI
bridge.

> Browser interaction must be representable as structured semantics independently
> of rasterized pixels.

> A blind human and a text-only AI should be able to perceive the same
> semantically relevant browser state, subject to the same authority and
> redaction policy.

The browser remains no-JIT with strict W^X. WebAssembly remains browser content;
web content receives no ambient OS authority; sensitive APIs are capability-
mediated; origins remain isolated; and fingerprint resistance remains a measured
design goal, not an anonymity claim.

## One canonical semantic truth

```text
HTML, script, layout, and browser state
  -> redaction and security filter
  -> canonical browser semantic tree
     +-> visual rendering
     +-> keyboard interaction
     +-> speech accessibility
     +-> Braille accessibility
     +-> text-only AI
     +-> multimodal AI with separate media authority
```

The tree is authoritative for supported semantic interaction; pixels are
authoritative only for genuinely visual content. Do not create a lossy human
accessibility tree plus a richer hidden AI tree, unrestricted AI DOM access, or
a privileged automation vocabulary. Speech, Braille, focus, semantic AI
inspection, and semantic actions retain traceable common object identity.

The public interface is a bounded versioned semantic model derived from browser
document, layout, and accessibility state—not the raw DOM, engine pointers, or
developer-tool internals. It must be sufficient for real blind use before being
optimized for LLM tokens.

## Nodes, identity, origins, and validation

Each authorized node may expose generational identity, role, accessible name,
description and provenance, state, permitted value/text, origin/frame/document,
focusability/focus, actions, parent/children/order, selection/expansion/checking,
heading/form/table/list structure, language, logical bounds, visual presence, and
media indication. Fields without interaction meaning are omitted.

Node identity binds document generation, node generation, and a local identity or
equivalent. Removed/reused storage cannot retarget stale handles. Actions resolve
the exact authorized origin, frame, document, and node generation. Navigation
distinguishes same-document mutation, history, new document/origin, redirect,
frame navigation, and tab replacement, invalidating prior generations as needed.

Cross-origin frames remain distinct semantic domains. Web-content nodes cannot
claim browser chrome, OS identity, permission UI, or secure attention. Browser
chrome participates in the overall model with trusted semantics for tabs,
address/navigation controls, downloads, permissions, identity, menus, and
prompts, but its trust domain is compositor/browser owned.

Before publication, validate generations, parents, cycles, depth/count bounds,
roles/actions, text lengths, exact origin association, and cross-origin
relationships. Malformed producer state fails closed. Bound nodes, depth, update
frequency, live events, query results, and text payloads; exhaustion has
deterministic truncation/error semantics and never corrupts authority state.

## Semantic actions and coordinates

Prefer exact actions such as `ACTIVATE`, `FOCUS`, `SET_VALUE`, `INCREMENT`,
`DECREMENT`, `SELECT`, `EXPAND`, `COLLAPSE`, `SCROLL_TO`, `SCROLL_BY`, `SUBMIT`,
`NAVIGATE`, `FOLLOW_LINK`, `OPEN_CONTEXT`, `MOVE_TEXT_CURSOR`, and `SELECT_TEXT`.
Normal blind or text-only operation does not require arbitrary coordinates.

Logical bounds remain available for spatial description, pointer workflows,
multimodal reasoning, debugging, and layout inspection. They use deterministic
logical units independent of physical DPI. Raw coordinate/HID input is a
separate exceptional capability, never the normal AI/accessibility API.

The tree covers headings, landmarks, links, buttons, fields, check/radio groups,
menus, tabs, dialogs, alerts/live regions, tables, lists/trees, progress, sliders,
editable text, forms/errors, shortcuts, focus order, selection, and status where
applicable. A meaningful visual interaction without semantics is reported as an
accessibility defect rather than guessed from pixels.

## Incremental synchronization and queries

Bounded ordered changes include node add/remove/update, text/value/focus/
selection change, live region, navigation, and frame attach/remove. Clients key
state by generation. Lost, reordered, truncated, or uncertain synchronization
invalidates the view and requires a fresh snapshot.

Prioritize focus, alerts, errors, dialogs, and requested-operation completion;
then value/state, controls, and navigation; decorative/reflow-only change is low.
Priority is presentation metadata, not authority.

Large-page clients use bounded `GET_FOCUSED_SUBTREE`, `GET_INTERACTIVE_NODES`,
`GET_DOCUMENT_OUTLINE`, `GET_NODE`, `GET_CHILDREN`, `SEARCH_SEMANTICS`, and
`GET_CHANGES` operations. Results return exact node identities rather than
natural-language references such as “the second blue button.”

Deterministic text serialization derives from the same tree:

```text
Document #42 generation=7 origin=https://example.test
[1@7] heading level=1 name="Account"
[2@7] textbox name="Email" value="m***@example.test" focused=true
      actions=[SET_VALUE]
[3@7] button name="Sign in" actions=[ACTIVATE]
```

## Blind-human, Braille, speech, and keyboard operation

Braille and speech are presentations, not separate browser models. Contracted or
uncontracted Braille, logical focus, routing positions, status cells, navigation
context, and verbosity are user presentation choices. Routing keys resolve an
exact node/action. A spoken “Sign in, button” and AI `role=button name="Sign in"`
refer to the same identity.

Normal browser controls, dialogs, forms, file choice, and media controls have a
keyboard or explicit semantic path. Broken custom controls remain identifiable
defects. CI uses the VMM Braille emulator in
[PARAVIRTUAL_DEVICES.md](PARAVIRTUAL_DEVICES.md); emulator evidence is not
physical-device or user evidence.

## Capability scopes and privacy

Tree access is capability-bound and separable:

```text
BrowserSemanticInspect(tab)
BrowserSemanticInteract(tab)
BrowserMediaInspect(media-object)
BrowserRawInput(tab)
```

Inspect does not imply interact; semantic interaction does not imply raw input;
media inspection does not reveal unrelated semantics. Views may cover one
control, document, frame, tab, explicitly delegated tabs, or the browser
application. Remote AI defaults narrow. One-tab authority does not reveal other
tabs, history, cookies/storage, tokens, hidden DOM/script state, password-manager
state, autofill secrets, developer internals, or undelegated cross-origin frames.

Do not expose assistive-technology model/presence, blindness, speech state,
connected accessibility devices, or controlling AI/provider to web content.
Normalize observable JavaScript/WebAssembly behavior where practical, including
timers, concurrency, devices, fonts, GPU/screen/audio properties, features,
locale, and timezone. Accessibility must not create a global fingerprint; claims
require empirical testing.

Remote serialization contains only the requested bounded view. Local provenance
records provider, scope, generation, authorizing capability, and expiration/
revocation without logging full content unnecessarily. Local models receive no
root, redaction bypass, or broader scope merely for being local.

## Secrets, files, downloads, and trusted prompts

Redaction occurs once before fan-out to GUI, Braille, speech, automation, and AI.
Secret controls expose role/name/populated state and `value=REDACTED`, never raw
values. Credential filling should use a non-extractable operation such as
`FILL_AUTHORIZED_CREDENTIAL`, preserving `SecretObject USE != EXPORT`.

File upload uses the trusted capability-mediated picker and gives web content
only the selected object, not a host namespace. Downloads require delegated
storage authority and semantically expose proposed name, origin, known size,
target delegated location, and relevant risk/status before trusted authorization.

Web semantics may report a pending microphone, camera, file, credential, or
notification request, but compositor/authority UI owns the grant. Blind users
receive the trusted prompt through Braille/speech. AI may interact with it only
under separate trusted-authority capability.

## JavaScript and WebAssembly

JavaScript may use interpretation, bytecode interpretation, or a separately
specified pre-execution AOT/admission mechanism that preserves strict W^X. It
cannot generate runtime code, writable code caches, patchable executable stubs,
dynamic native trampolines, or other hidden JIT equivalents. Interpreter-data
specialization and validated non-executable IR caches are permitted; performance
never overrides no-JIT/W^X.

JavaScript-created controls participate only when their role, name, state, value,
focus, and actions are meaningful in the tree. JavaScript cannot obtain native
filesystem/device capabilities, credential export, microphone/camera, raw HID,
or native sockets except through browser-mediated authorized projection, and it
cannot forge trusted chrome or OS semantics.

WebAssembly remains browser-only and no-JIT. Interpretation or separately
admitted pre-execution translation must preserve the same sandbox and W^X. A
Wasm-backed GUI needs the same sanitized, origin-bound semantic bridge. Canvas-
only output without a companion is honestly reported inaccessible; execution is
not falsely called accessible.

> JavaScript and WebAssembly are supported only insofar as their browser-visible
> applications can participate in MRML's semantic accessibility architecture.

This does not reject every inaccessible script. It prevents MRML from defining a
web application model fundamentally unavailable to blind users. Preserve normal
language semantics and map HTML/ARIA-like roles, names, states, focus, and live
regions where useful; standards terminology is not the security model.

## Canvas and media

Canvas, future WebGL-like surfaces, charts, maps, images, and video expose a
`RenderSurface`/media node plus an optional author semantic subtree. Do not infer
or hallucinate all controls from pixels. Author alternative text is distinguished
from browser-generated and `AI_GENERATED_DESCRIPTION` data.

The fast semantic channel is default. Media bytes/frames use a separately
authorized, potentially expensive inspection channel. A blind user can select
one media object and delegate that exact generation to a local or remote
description provider without disclosing the page or desktop. Generated output is
advisory, provenance-labeled, and never mutates author semantics. Text-only AI
uses semantics unless a separate visual tool exists; multimodal AI receives only
explicit media-object authority.

## Isolation and prompt injection

Document/script, semantic tree, renderer, compositor, accessibility service, and
AI bridge communicate through bounded interfaces. Renderer compromise cannot
forge trusted semantics, grant capabilities, expose another origin, read secret
controls, or synthesize secure attention. A semantic-tree defect cannot silently
grant renderer authority, and renderer failure need not destroy authority state.

All web-origin content is labeled untrusted data. Hidden page text is not
automatically injected into AI context. If malicious text asks an AI to export
passwords or inspect every tab, the model may attempt it, but scope, credential
non-exportability, trusted prompts, and filesystem/device capability checks remain
outside the model and deny the operation.

## Testing and ABI gate

JavaScript tests cover dynamic control creation/removal/replacement, names,
states, values, focus, dialogs, live regions, SPA navigation, and cross-origin
frames across Braille, speech, and text-only AI clients. Wasm tests include a
semantic application completed without pixels and a canvas-only application
honestly reported deficient. Hostile tests cover generations, origin forgery,
cycles, oversized trees, floods, exhaustion, prompt injection, and renderer
compromise assumptions.

Representative blind-human and semantic-only text-model workflows cover article
navigation, forms, tabs, dialogs, upload/download, browser chrome, trusted
permissions, JavaScript-heavy sites, and supported semantic Wasm sites. Text-only
parity gives no screenshots or raw HID. Selected multimodal tests use semantics
for controls and sparse on-demand media inspection. Monitor-off tests use
keyboard, Braille, speech, and text-only semantic AI.

Do not stabilize the ABI before real blind-user, physical Braille, speech, text-
only AI, JavaScript-heavy, supported Wasm, hostile-page, cross-origin, and large-
page/exhaustion testing. Do not claim all sites accessible, universal AI
understanding, no fingerprinting, or that JavaScript/WebAssembly is safe.

## Dependency order

Roadmap order is: Semantic Scene Graph foundations; browser semantic mapping;
keyboard/focus; speech/Braille; trusted chrome; text-only serialization/actions;
no-JIT JavaScript; dynamic synchronization; browser-only no-JIT WebAssembly;
Wasm semantic bridge; media-object inspection; on-demand multimodal inspection;
monitor-off parity; blind-user testing; then ABI stabilization.

Patent review: `TRIGGERED` — planned browser semantic protocols, JavaScript and
WebAssembly execution/admission, media-description flow, and related interfaces
require targeted mechanism and Canadian-right review before implementation.
This document makes no clearance or infringement claim; record review in
[`patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).
