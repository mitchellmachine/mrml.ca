# MRML Braille interface design

**Status: DESIGNED.** This is a usability and architecture reference, not a
frozen ABI, key map, or hardware-compatibility claim.

> Refreshable Braille is a first-class semantic interface, not a pixel-to-text
> conversion layer.

## Semantic source and baseline device

Braille consumes authorized, redacted objects and incremental deltas from the
Semantic Scene Graph. It uses object identity, role, label, value, state,
semantic hierarchy, available actions, focus, selection, caret, and trust
context—not screen rows, pixel coordinates, or guessed visual layout.

The first interaction design targets a common device with approximately 40
Braille cells, routing keys above the cells, navigation keys, Braille keyboard
input, and optional status cells. Forty cells is a usability baseline, not a
protocol, ABI, minimum, maximum, or vendor restriction. Exact hardware varies;
MRML-specific semantics remain above interoperable device transports.

## Line presentation

A focused object has a concise, localized line-oriented representation. For
example:

```text
Network Settings  heading  1/8
Wi-Fi  switch  on  2/8
Home Network  button  3/8
Password  edit  protected  populated  4/8
Allow once  button  1/2
```

These strings are illustrative, not frozen wording. Presentation selects the
task-relevant name, role, value, state, position, shortcut, validation error,
and security/trust context that fit the device. Panning must preserve semantic
context rather than turning the interface into an unexplained text strip.

## Navigation and modes

Conceptual semantic operations include:

```text
next_object       previous_object
next_heading      previous_heading
next_control      previous_control
next_link         previous_link
next_field        previous_field
next_window       previous_window
parent            first_child
next_sibling      previous_sibling
activate          focus
set_value         toggle
expand            collapse
```

Structured navigation is required for large interfaces; traversal is not only
linear. The initial model distinguishes navigation, text-edit, and structured-
navigation modes while minimizing mode count and ambiguity. Users never need to
memorize visual positions.

## Routing and text editing

Each rendered cell can retain a semantic mapping to its object or text position.
A routing key may move the caret, focus or activate an object, or select a text
position according to role and mode. The trusted accessibility service converts
device-local input into authorized semantic actions. Applications and VMs never
receive raw global routing keys.

Editable text exposes caret, selection, editable/protected state, validation
errors, and line/field context. Braille input writes through the semantic text-
editing API. Protected fields expose only redacted state such as `protected,
populated`, never secret contents.

## Trusted prompts, domains, and notifications

Trusted prompts are fully operable through the real semantic actions. A compact
presentation might communicate:

```text
SECURITY
Browser requests microphone
Until tab closes
1/2 Deny
2/2 Allow once
```

Color, position, or icon shape never supplies required meaning. Compositor-owned
identity is textual and semantic, for example application `Browser`, domain
`Personal`, isolation `VM`. Untrusted content cannot forge that identity.

Notifications expose source, summary, urgency, time, security importance, and
authorized `open`, `dismiss`, action, or `silence` operations.

## Browser, tables, and media

The browser's sanitized semantic document tree supports headings, links, form
fields, landmarks, lists, tables, buttons, and media objects without exposing
arbitrary DOM internals. Web content remains untrusted.

Table navigation exposes table name, row/column position, associated headers,
and cell value with conceptual `next_row`, `previous_row`, `next_column`,
`previous_column`, `row_header`, and `column_header` actions.

Media presents inexpensive semantics first: title, description, dimensions,
duration, captions/transcript availability, and whether authorized visual
description is available. Arbitrary images are not converted into meaningless
Braille pixels by default; tactile graphics are separate future work.

## Authority, transport, latency, and evidence

Braille output, input, semantic inspection, interaction, security-prompt
interaction, and raw USB/HID remain separable capabilities. Redaction is shared
with speech, automation, and AI. Device transports use bounded parsing and
narrow interface authority; one device never implies universal compatibility.

Track focus-to-Braille-update and input-to-semantic-action latency. Consume
incremental events such as `FOCUS_CHANGED`, `TEXT_CHANGED`, `VALUE_CHANGED`,
`STATE_CHANGED`, `OBJECT_ADDED`, and `OBJECT_REMOVED` rather than retransmitting
the desktop for each navigation event.

Before a production-support claim, test real refreshable Braille hardware and
record device, transport, controls, input, routing, and limitations. Prefer
multiple protocol/device implementations where feasible. Simulation does not
establish hardware compatibility, and key mappings remain unfrozen until
practical hardware and disabled-user feedback support them.
