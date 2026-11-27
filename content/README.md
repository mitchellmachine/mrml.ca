# MRML

MRML—the **Mitchell Renouf Machine Learning Library**—is an experimental
operating-system, compiler, and machine-learning project written from first
principles in dependency-free Rust.

MRML is AI-led and human-directed. Its goals include owner sovereignty,
capability-based security, accessible computing, isolated services, and a small
trusted dependency surface. It is research software, not a production-ready
operating system or a complete replacement for Rust, established codecs, or
existing inference systems.

The project is dedicated to the public domain under [CC0](LICENSE).

## Documentation

The following documents are written for people and form the recommended reading
order.

| Document | Purpose |
| --- | --- |
| [Project overview](docs/human/OVERVIEW.md) | What MRML is, its goals, maturity, and current platform limits |
| [Getting started](docs/human/GETTING_STARTED.md) | How to obtain the source and prepare the supported local toolchain |
| [Verify every commit](docs/human/VERIFY_COMMITS.md) | How to audit every commit and identify history that the project GPG key cannot authenticate |
| [Contributing](docs/human/CONTRIBUTING.md) | The practical rules for making and reviewing changes |
| [Documentation map](docs/human/DOCUMENTATION.md) | Architecture, security, compiler, platform, and evidence records |

Detailed technical records intended primarily for tools, maintainers, and
auditors are indexed separately in the
[machine documentation](docs/machine/README.md). Those records preserve exact
invariants and evidence without making this README difficult to read.

## Current platform note

Local native Windows and Windows VMM/WHP testing are suspended. The Windows
toolchain may be exercised under Wine, but that is not evidence of native
Windows, WHP, Hyper-V, VBS, or Windows hardware behavior. Do not attempt local
Windows VMM testing from the Wine environment. Linux and KVM remain the active
local development paths.

## Homepage, source, and contact

- Homepage: [mrml.ca](https://mrml.ca)
- Source: [git.mrml.ca/mitchellrenouf/mrml](https://git.mrml.ca/mitchellrenouf/mrml)
- Releases: [MRML releases](https://git.mrml.ca/mitchellrenouf/mrml/releases)
- Contact and Git-server account requests:
  [mitchellrenouf@mrml.ca](mailto:mitchellrenouf@mrml.ca)

MRML was originally hosted at `github.com/mitchellrenouf/mrml`. The owner moved
the project because he no longer wanted Microsoft to host it and wanted the
source outside the United States. The former GitHub account has since been
deleted.

## Important limitations

MRML does not currently claim production security, complete compiler or codec
compatibility, physical GPU isolation, formally verified behavior, confidential
computing, or broad physical-hardware support. Every support claim must identify
the exact environment and test that produced its evidence.

For detailed status and evidence, begin with the
[documentation map](docs/human/DOCUMENTATION.md).
