# MRML

MRML (the **Mitchell Renouf Machine Learning Library**) is a research project
building an agentic operating system, compiler, and machine-learning libraries
in original Rust without third-party code dependencies. It is AI-led and
human-directed, with an emphasis on owner control, accessibility, and a small
trusted code base.

MRML is a public-benefit project. We dedicate it to the public domain under
[CC0](LICENSE) to help people use computers securely and to build software
that treats disabled people with dignity as first-class users.

## Support MRML

Donations are welcome. They would help speed up development and fund our
goal of running daily defensive security scans with OpenAI Daybreak. We
estimate daily scanning would cost MRML **$300 USD per month**, separate
from the development subscription.

The maintainer currently pays **$200 USD per month** for ChatGPT Pro 200
(previously called Pro 20X) for development. With enough support, MRML could
upgrade to [Pro 500](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers),
which costs **$500 USD per month** and includes a larger Work and Codex
allowance.

If you'd like to donate, contact [mitchellrenouf@mrml.ca](mailto:mitchellrenouf@mrml.ca).
MRML remains dedicated to the public domain under CC0.

## The Gigakernel and Total MicroVM isolation

MRML's only operating mode for ordinary applications and services is
**strict Total MicroVM isolation**. A workload runs in a supervised microVM
only after the system admits it and verifies that the required resources and
transport are available. If they are not, the workload remains unavailable.
There is no native fallback.

The [MRML Gigakernel](docs/gigakernel.md), named after Gigachad, is the
privileged core that supplies launch, memory, and communication mechanisms.
Access across microVMs requires explicit, scoped, revocable capabilities.
A signature can establish provenance; it does not by itself authorize access
to another VM, device, or resource. The bootloader and virtualization substrate are
necessary mechanisms, not alternate operating modes for apps or services.

The design shares the small privileged core and capability principles of
microkernels and uses hardware virtualization, as the Hyperkernel research
project did. MRML's defining choice is to make placement in a supervised
microVM mandatory for ordinary workloads. Gigakernel is MRML’s name for
this design; whether it constitutes a distinct kernel class remains open.
The name makes no claim of
architectural priority or formal verification. See the
[architecture comparison](docs/gigakernel.md#how-the-gigakernel-compares)
and [placement rules](docs/ISOLATION_PLACEMENT.md).

### Architecture snapshot

![MRML Gigakernel architecture: signed desktop microVM scanout verified in QEMU, separate controller and input service routes, and pending Chromebook checks](docs/images/gigakernel-2026-11-28-desktop.svg)

**2026-11-28 UTC · source commit [ec1bd7c71f3b5f2d749ba0af17e4d404da5e7ca7](https://github.com/mitchellmachine/mrml/commit/ec1bd7c71f3b5f2d749ba0af17e4d404da5e7ca7).** QEMU verified a signed desktop microVM's terminal echo on emulated VGA, including a separate test with emulated keyboard events. The [Chromebook candidate](docs/platform/UEFI_BOOT_MANAGEMENT.md#dragonair-desktop-scanout-check) uses synthetic input and has not run on the Chromebook. The two xHCI admission routes, five input decoders, and emulated USB write are separate checks; none proves physical input or storage.

## Software for Windows and Linux

You can run parts of MRML directly on x86-64 Windows and Linux without
booting the MRML operating system. These are host programs and libraries.
The no-native-fallback rule applies to workloads inside MRML OS, not to
software built for Windows or Linux.

| Category | Examples |
| --- | --- |
| Build and compiler tools | The `mrml` build, test, and audit frontend; the experimental Rust compiler driver |
| Local machine learning | The `mrml-cli` inference CLI, `mrml-trainer`, and model, tokenizer, and tensor libraries |
| Media and compression | Experimental AV1 and Opus codecs and a bounded Zstandard implementation |
| Source control | The native MRML Git client; Gitd and its authority services are tracked separately as Linux components |
| Virtualization tools | The WHP backend and runner on Windows; the KVM backend and runner on Linux |

Support varies by component, feature, and host. See
[Getting started](docs/human/GETTING_STARTED.md) for build commands and
[platform test results](docs/PLATFORM_TESTS.md) for what has been verified.
A hosted library or tool does not establish native MRML OS support.

**Platform roadmap:** x86-64 remains the primary target for MRML OS and
hardware bring-up. macOS host support and ARM64 (AArch64) support are planned;
neither is currently a supported target.

## Contributing and security review

Effective work across MRML requires either advanced systems and security
expertise or access to specialized defensive cybersecurity models and tools
with the authorization their providers require. This is a practical
requirement for sustained implementation and review, especially across the
Gigakernel, virtualization backends, and device isolation. It is not a
restriction on who can read the source or reproduce an existing test.

In maintainer Mitchell Renouf's experience, repeated refusals from
general-purpose AI assistants blocked parts of the work until he had access
to OpenAI Daybreak for defensive code review. If you rely on AI for this work,
do not assume a general-purpose assistant can carry the project end to end.
Use specialized tooling only within its authorized scope. Tool access does
not override safeguards or replace engineering judgment: changes still need
review and test evidence, and automated findings still need verification.

Start with the [contribution guide](docs/human/CONTRIBUTING.md) and the
[security model](docs/SECURITY.md) before changing a trusted boundary.

## Status and evidence

Full-system Total MicroVM operation is **partially implemented**. Focused
hosted and emulated tests exercise specific parts of the design, but do not
establish production readiness, broad physical-hardware support, or
confidential computing. The compiler, codecs, and inference libraries are
also experimental; they are not complete replacements for established tools.

See [Project status](docs/PROJECT_STATUS.md) for what is implemented, what
was tested, and what remains open. Support claims should name the platform,
test, and exact scope of the result.

## Start here

| Document | Purpose |
| --- | --- |
| [Project overview](docs/human/OVERVIEW.md) | Goals, maturity, and current platform limits |
| [Getting started](docs/human/GETTING_STARTED.md) | Source and supported local toolchain |
| [UEFI USB bring-up](docs/platform/UEFI_BOOT_MANAGEMENT.md#bare-metal-usb-bring-up) | Firmware handoff and embedded FAT32 diagnostic on a spare USB stick |
| [Verify every commit](docs/human/VERIFY_COMMITS.md) | Verify GitHub commits with the project's Ed25519 SSH signing key |
| [Documentation map](docs/human/DOCUMENTATION.md) | Architecture, security, compiler, platform, and evidence records |
| [Machine documentation](docs/machine/README.md) | Detailed technical records for maintainers, tools, and auditors |

## Homepage, source, and contact

- Homepage: [mrml.ca](https://mrml.ca)
- Source: [github.com/mitchellmachine/mrml](https://github.com/mitchellmachine/mrml)
- Releases: [MRML releases](https://github.com/mitchellmachine/mrml/releases)
- Contact: [mitchellrenouf@mrml.ca](mailto:mitchellrenouf@mrml.ca)
