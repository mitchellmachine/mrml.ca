# Contributing to MRML

MRML welcomes careful, original contributions. The project is dedicated to the
public domain under CC0 and treats security, owner control, accessibility, and
honest evidence as acceptance requirements.

This page is a readable introduction. The root `AGENTS.md`,
[Engineering Constitution](../ENGINEERING_CONSTITUTION.md), and canonical
subsystem documents contain the complete rules.

## Before you edit

1. Inspect `git status`, recent history, the affected source, and its tests.
2. Preserve unrelated staged, unstaged, and untracked work.
3. Read [MRML values](../../VALUES.md), [Architecture](../ARCHITECTURE.md),
   [Security](../SECURITY.md), and the relevant subsystem documentation.
4. Check [Roadmap](../ROADMAP.md) before starting foundational OS work.
5. Distinguish implemented behavior from partial, experimental, planned, and
   aspirational work.

For major architecture, apply the lightweight complexity review in the
Engineering Constitution. If a proposal conflicts with it, propose an explicit
amendment instead of bypassing the rule.

## Source and dependency rules

- Submit only original work that you have the right to dedicate under CC0.
- Do not copy or closely adapt third-party implementation code or test bodies.
- Implementation code, build logic, tests, examples, benchmarks, and utilities
  must be Rust.
- Repository code may depend only on `core` and original workspace crates. Do
  not add `std`, `alloc`, crates.io packages, Git dependencies, or other sysroot
  crates.
- Keep boundaries narrow and auditable. Treat parsers, arithmetic, external
  data, device input, manifests, artifacts, and host responses as hostile.

## Security and authority

Names and provenance identify objects; capabilities authorize operations.
Derived authority may preserve or reduce permissions, never amplify them.
Publisher identity, first-party status, signatures, licenses, and remote
statements do not grant hidden authority over the owner.

Keep secret use separate from secret export. Keep observation, debugging,
monitoring, raw-device access, and interaction independently authorized. Do not
weaken owner-controlled trust, recovery, rollback, or accessibility to simplify
an implementation.

Security-significant mechanisms require hostile-security and digital-rights
review. Substantial patent-sensitive work also requires the technical screening
described in [Patent review](../patents/README.md). This screening is not legal
advice or a claim of patent clearance.

## Accessibility

Accessibility is part of the platform architecture. Do not create a private
semantic interface for AI or automation that withholds equivalent task-relevant
meaning from supported human accessibility interfaces without a documented
technical or security reason.

Preserve shared semantics, consistent secret redaction, local operation, and
separate capabilities for inspection, interaction, audio, input, and raw
devices. Do not claim Braille, early-boot, or physical-device support without
the exact evidence. Read [Accessibility](../ACCESSIBILITY.md) before changing
interfaces, input, audio, browser semantics, trusted prompts, boot, or recovery.

## Testing and evidence

Build and test every change on Linux. Run focused tests and adversarial cases
appropriate to the boundary you changed. Use the repository's assurance and
formatting checks, and record exact commands and outcomes.

Windows-target toolchain checks may run under Wine. Label them as Wine
toolchain coverage, never as native Windows or Windows VMM evidence. Local
Windows VMM testing is suspended; do not attempt WHP, WHPX, Hyper-V, or VBS
tests through Wine.

Do not claim physical hardware, firmware, Secure Boot, TPM, IOMMU, KVM, WHP, or
platform support unless that exact environment was exercised. Simulation,
hosted probes, nested virtualization, and physical testing are distinct forms
of evidence.

If formatting changes unrelated Rust files, place those mechanical changes in
a separate formatting-only commit. Keep functional commits cohesive and stage
only the files they intend to change.

## Documentation changes

Write for the intended reader. Put concise explanations and procedures in this
human documentation area. Keep detailed state, machine-generated inventories,
and long technical evidence in their canonical technical or machine-readable
documents.

Use links instead of copying rules into multiple documents. State limitations
next to claims, use status terms consistently, and check headings, lists, code
blocks, links, spelling, and grammar before committing.

## Submitting work

Explain what changed, why it is safe, and what you verified. Include exact test
commands and results, identify untested environments, and note any remaining
risk. Never describe an unavailable check as passing.

Questions can be sent to
[mitchellrenouf@mrml.ca](mailto:mitchellrenouf@mrml.ca).
