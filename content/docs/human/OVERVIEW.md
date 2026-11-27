# MRML overview

MRML—the Mitchell Renouf Machine Learning Library—is an experimental,
public-domain computing stack. It is built from first principles in Rust and
explores local AI, operating-system services, virtualization, compilers,
networking, media, storage, and security.

MRML is research software. It is not a production-ready operating system, a
complete Rust compiler, or a replacement for mature inference and codec
projects. Statements about planned architecture are goals, not claims that the
feature works today.

## What the project values

MRML aims to keep control of the computer with its owner. Authority should be
explicit, limited, inspectable, and revocable. Security must enforce the
owner's choices rather than give permanent superior authority to a vendor,
publisher, service, or verifier.

Accessibility is a platform requirement, not an optional add-on. The same
structured interface meaning should serve people using visual, keyboard,
Braille, speech, switch-device, automation, and AI interfaces, with appropriate
capability limits and secret redaction.

The full commitments are in [MRML values](../../VALUES.md). Major design work
must also follow the [Engineering Constitution](../ENGINEERING_CONSTITUTION.md).

## What exists today

The repository contains working but experimental components for local
inference, a microkernel, KVM and WHP virtualization backends, a Rust compiler
subset, networking and cryptography, media codecs, storage, and first-party
build tools. Maturity varies substantially between components.

For current, machine-derived workspace facts, read
[Workspace status](../STATUS.md). For implementation evidence and remaining
kernel milestones, read [Microkernel](../MICROKERNEL.md). The
[Roadmap](../ROADMAP.md) gives the dependency order for future work.

## Security and testing limits

Hosted KVM and WHP environments are useful for development and measurement,
but they do not protect a guest from a compromised host. MRML does not claim
production security, formal verification, or physical-hardware support without
specific evidence.

Native Windows and local Windows VMM testing are currently suspended. Wine may
be used for Windows-target toolchain coverage, but a Wine result is not native
Windows, WHP, Hyper-V, VBS, or physical-hardware evidence. The exact trust model
and claim limits are in [Security](../SECURITY.md).

## Where to go next

- [Getting started](GETTING_STARTED.md) explains how to inspect and build the
  project.
- [Contributing](CONTRIBUTING.md) summarizes the acceptance rules.
- [Documentation guide](DOCUMENTATION.md) maps topics to their canonical docs.
- [Architecture](../ARCHITECTURE.md) describes the system's durable structure.
- [Application platform](../APPLICATION_PLATFORM.md) describes applications,
  services, accessibility, and isolation.

The homepage is [mrml.ca](https://mrml.ca), and the source repository is
[git.mrml.ca/mitchellrenouf/mrml](https://git.mrml.ca/mitchellrenouf/mrml).
Questions and comments are welcome at
[mitchellrenouf@mrml.ca](mailto:mitchellrenouf@mrml.ca).
