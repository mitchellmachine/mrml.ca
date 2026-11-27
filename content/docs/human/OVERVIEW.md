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

## How MRML runs

Strict [Total MicroVM isolation](../ISOLATION_PLACEMENT.md) is the only MRML
OS mode. Ordinary applications and services run in admitted microVMs or remain
unavailable, with no native fallback. This is the design, not a claim of full
implementation. The [Gigakernel](../gigakernel.md) is the privileged core.

x86-64 is the primary OS bring-up target. Build tools, compiler, local ML,
media libraries, and Git software can run as native Windows/Linux host
software without booting MRML OS. macOS host support and ARM64 support are
planned. The [platform test record](../PLATFORM_TESTS.md) separates verified
host behavior from guest and physical hardware results.

## What exists today

The repository contains experimental local inference, a capability-oriented
Gigakernel, KVM and WHP backends, a Rust compiler subset, media codecs, storage
providers, and native build tools. It also contains a separate protected SHA-256
Git stack and certificate/ACME services with hosted Linux and Docker evidence.
The GitHub repository uses SSH-signed source history; Gitd is a separate project
component, not the host for that source.

Read [Project status](../PROJECT_STATUS.md) for implementation and test coverage
across these areas. For implementation evidence and remaining
kernel milestones, read [Gigakernel](../gigakernel.md). The
[Roadmap](../ROADMAP.md) gives the dependency order for future work.

## Security and testing limits

Hosted KVM and WHP environments are useful for development and measurement,
but they do not protect a guest from a compromised host. MRML does not claim
production security, formal verification, or physical-hardware support without
specific evidence.

Native Windows tests use gnullvm. Local VMM testing can also run on a native
Windows host with the required features; the results are recorded separately
from compiler and runtime tests. See [Windows testing](../PROJECT_STATUS.md#windows-testing)
for the current testing scope and [Security](../SECURITY.md) for claim limits.

## Where to go next

- [Getting started](GETTING_STARTED.md) explains how to inspect and build the
  project.
- [Contributing](CONTRIBUTING.md) summarizes the acceptance rules.
- [Documentation guide](DOCUMENTATION.md) maps topics to their canonical docs.
- [Architecture](../ARCHITECTURE.md) describes the system's durable structure.
- [Application platform](../APPLICATION_PLATFORM.md) describes applications,
  services, accessibility, and isolation.

The homepage is [mrml.ca](https://mrml.ca), and the source repository is
[github.com/mitchellmachine/mrml](https://github.com/mitchellmachine/mrml).
Questions and comments are welcome at
[mitchellrenouf@mrml.ca](mailto:mitchellrenouf@mrml.ca).
