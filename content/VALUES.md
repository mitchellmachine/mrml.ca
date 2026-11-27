# MRML values

These values guide architecture, implementation, security decisions, and
project claims. Normative engineering rules live in
[docs/ENGINEERING_CONSTITUTION.md](docs/ENGINEERING_CONSTITUTION.md).

## Authority serves people

> **Power should be explicit, limited, inspectable, and revocable.**

- **Explicit:** authority is deliberately granted.
- **Limited:** authority is narrowly scoped.
- **Inspectable:** authority and its provenance can be understood.
- **Revocable:** authority can be withdrawn when semantics permit.

Names identify; capabilities authorize. Human intent and individual dignity
come before institutional convenience, application reputation, or automated
preference. Security should protect people without requiring them to surrender
agency over their own computer.

> **Security authenticates and enforces the owner's policy; it must not transfer
> ownership of the machine to a vendor, publisher, service provider, or remote
> verifier.**

Secure defaults may require deliberate confirmation, physical presence, or
recovery authentication, but the owner retains a documented path to understand,
change, recover, and authorize their own system without silently weakening
rollback protection.

> **Intelligence does not imply authority.**

AI is a capability-constrained principal. Intelligence, autonomy, model size,
provider reputation, or convenience never creates authority. Secret use and
export remain separate, remote disclosure is explicit, and users retain visible
control and revocation.

> **Not every human problem is a computing problem.**

MRML should not turn judgment, relationships, dignity, care, or social choices
into software merely because computation is available. Technology should serve
human purposes and remain modest about what it can understand or resolve.

## Accessibility is a platform property

> **Access to the computer should not depend on one particular human sense, physical ability, or method of interaction.**

> **A machine-readable computer should also be a human-accessible computer.**

> **Accessibility is not a degraded compatibility mode.**

Accessibility is not optional polish, an application-specific feature, a
third-party add-on, or a post-release compatibility layer. Essential operations
should have equivalent meaningful semantic access through appropriate visual,
keyboard, pointer, touch, pen, Braille, speech, switch-device, automation, and
AI interfaces where technically practical. Disabled users are intended users,
not exceptional edge cases.

One shared semantic object system should support accessibility, automation, UI
testing, and AI while granting each consumer only its own inspection and
interaction capabilities. Accessibility does not imply unrestricted observation
or secret access. Core accessibility must retain a viable local/offline path.

If structured interface meaning is available to text-only AI, equivalent
task-relevant meaning should be available to supported human accessibility
interfaces where technically applicable. Presentation and authority may differ;
the underlying semantic truth and redaction policy must not privilege AI.

## Durable project commitments

> **MRML targets modern hardware deliberately rather than carrying unlimited historical CPU compatibility.**

> **The ability to execute does not imply an unlimited right to consume memory.**

> **RAM is an explicitly budgeted, accountable resource.**

> **Interoperability is compatible with least authority.**

People are not telemetry subjects, advertising profiles, security liabilities,
or sources of training data. Technology serves people and preserves dignity.

- **Privacy by architecture:** minimize disclosure; separately authorize
  microphone, media, semantic inspection, and remote transport; redact secrets
  consistently across visual, speech, Braille, automation, and AI.
- **Data minimization:** the safest unnecessary data is data never collected;
  observation does not by itself authorize retention, correlation, secondary
  use, training, redistribution, or disclosure.
- **User control and local capability:** useful core operation, including
  accessibility, must not depend on a particular cloud or AI provider.
- **Interoperability without lock-in:** documented interfaces and practical
  export paths should let owners choose third-party software and services under
  least authority; security is not an excuse for vendor lock-in.
- **No owner-hostile DRM:** publisher identity, signatures, licenses, or metadata
  describe policy requests but do not create kernel authority against the owner.
- **Freedom to understand:** preserve whole-system traceability, readable source,
  structured state, and inspectable authority.
- **Security without surrendering agency:** trusted prompts explain meaningful
  choices and support multiple appropriate interaction modes.
- **Compatibility without architectural surrender:** isolate legacy behavior
  rather than letting it define native semantics.
- **Evidence over marketing:** distinguish goals, implementation, tests,
  measurements, audits, and proofs.
- **Bounded failure:** contain crashes and compromises, revoke authority, and
  clean derived state.
- **No silent security downgrade:** failure of a stronger isolation mechanism
  must not silently weaken the requested security boundary.
- **Simplicity without lost protection:** reduce duplication through shared
  semantics, never by removing necessary isolation, validation, accessibility,
  or correctness.
