# MRML documentation guide

MRML separates short, human-facing guidance from detailed architecture,
evidence, and machine-generated reference material. Start here instead of
reading every technical document in order.

## Human-facing guides

- [Overview](OVERVIEW.md): purpose, scope, values, and current limitations.
- [Getting started](GETTING_STARTED.md): clone, toolchain, build, and test steps.
- [Contributing](CONTRIBUTING.md): contribution, security, accessibility, and
  evidence rules.
- [Verify commits](VERIFY_COMMITS.md): verify repository history with the
  project SSH signing key (Ed25519).

## Essential project documents

- [MRML values](../../VALUES.md) explains the project's human commitments.
- [Engineering Constitution](../ENGINEERING_CONSTITUTION.md) is normative for
  major design and complexity decisions.
- [Architecture](../ARCHITECTURE.md) defines the durable system structure and
  status vocabulary.
- [Security](../SECURITY.md) defines trust boundaries and security claims.
- [Roadmap](../ROADMAP.md) gives the dependency order for implementation.
- [Project status](../PROJECT_STATUS.md) summarizes implemented work, checked
  workspace facts, evidence boundaries, and known gaps.
- [Recovery](../RECOVERY.md) explains how to reconstruct work from repository
  state when other context is unavailable.

## Find documentation by task

| If you are working on… | Read… |
| --- | --- |
| Applications, services, GUI, isolation, or AI access | [Application platform](../APPLICATION_PLATFORM.md) and [Isolation placement](../ISOLATION_PLACEMENT.md) |
| Accessibility, semantic interfaces, Braille, or monitor-off operation | [Accessibility](../ACCESSIBILITY.md), [Braille interface](../accessibility/BRAILLE_INTERFACE.md), and [Monitor-off acceptance](../accessibility/MONITOR_OFF_ACCEPTANCE.md) |
| Browser semantics or AI/browser control | [Browser semantics](../BROWSER_SEMANTICS.md) |
| Kernel implementation or boot evidence | [Gigakernel](../gigakernel.md) and [UEFI boot management](../platform/UEFI_BOOT_MANAGEMENT.md) |
| Windows/Linux host software or planned platforms | [Host software](../../README.md#software-for-windows-and-linux), [Project status](../PROJECT_STATUS.md#current-direction), and [Platform tests](../PLATFORM_TESTS.md) |
| Build tools, packages, releases, or installation | [Build system](../build/BUILD_SYSTEM.md), [Deployment](../DEPLOYMENT.md), and [Artifact extensions](../packages/ARTIFACT_EXTENSIONS.md) |
| Git client, Gitd, and protected Git deployments | [Current Git checkpoint](../gitd/operations/CURRENT_COMPLETION.md), [Linux deployment adapter](../gitd/edge/LINUX_DEPLOYMENT.md), and [Compose guide](../../deploy/compose/README.md) |
| Certificates and ACME | [ACME and certificate service](../ACME.md) and [Compose guide](../../deploy/compose/README.md) |
| Dynamic component interfaces | [Component interfaces](../packages/COMPONENT_INTERFACES.md) |
| Rust compiler or ABI work | [Compiler](../COMPILER.md), [Compiler checkpoint](../compiler/CHECKPOINT.md), and [MRML ABI](../compiler/MRML_ABI_V1.md) |
| VMM devices | [Paravirtual devices](../PARAVIRTUAL_DEVICES.md) |
| CPU, microcode, scheduling, power, or telemetry | [CPU platform](../platform/CPU_PLATFORM.md) |
| UEFI boot entries, Secure Boot, or recovery boot | [UEFI boot management](../platform/UEFI_BOOT_MANAGEMENT.md) |
| Memory allocation, mapping, sharing, or DMA | [Memory resource model](../memory/MEMORY_RESOURCE_MODEL.md) |
| GPU architecture or bring-up | [GPU architecture](../gpu/GPU_ARCHITECTURE.md), [Virtual GPU](../gpu/VIRTUAL_GPU.md), and [Driver bring-up](../gpu/DRIVER_BRINGUP.md) |
| Ethernet, Wi-Fi, or Bluetooth administration | [Network administration](../network/NETWORK_ADMINISTRATION.md) |
| Storage, optical media, or filesystems | [Storage and optical](../storage/STORAGE_AND_OPTICAL.md) |
| Patent-sensitive mechanisms | [Patent review](../patents/README.md) and [Review log](../patents/REVIEW_LOG.md) |

## Reading status and evidence

The status words **IMPLEMENTED**, **PARTIALLY IMPLEMENTED**, **EXPERIMENTAL**,
**PLANNED**, and **ASPIRATIONAL** have specific meanings defined by
[Architecture](../ARCHITECTURE.md). “Implemented” means code and focused tests
exist; it does not mean production readiness or physical verification.

Prefer evidence in this order:

1. Current source, focused tests, and executable results.
2. Recent relevant commits and their diffs.
3. Dated implementation evidence.
4. Roadmap status.
5. Overview prose.

When documents disagree, downgrade the claim and record the uncertainty rather
than guessing.

## Machine and generated material

Long technical reference material and machine-oriented documentation live under
[Machine documentation](../machine/README.md). The generated
[workspace status](../STATUS.md) and [unsafe inventory](../UNSAFE_INVENTORY.md)
are retained snapshots pending a successful assurance run. See
[Project status](../PROJECT_STATUS.md#workspace-checks-and-generated-inventories)
for the live commands and blocker. Do not hand-edit the generated files.

Technical documents outside `docs/human/` remain canonical when linked above.
Moving or summarizing them must not erase security invariants, evidence labels,
or implementation status.

## Documentation quality checklist

Before submitting documentation:

1. Confirm every technical claim against source or a canonical document.
2. Separate current behavior from plans and aspirations.
3. Put limitations beside the claim they qualify.
4. Prefer short sentences, descriptive headings, and task-oriented steps.
5. Define uncommon terms or link to their canonical definition.
6. Check Markdown structure, relative links, spelling, and grammar.
7. Avoid duplicated policy that can drift from its authoritative source.
