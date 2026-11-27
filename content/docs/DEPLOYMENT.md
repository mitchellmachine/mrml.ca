# MRML packages, deployment, installation, and system administration

The **PLANNED** [unified system monitor](monitor/SYSTEM_MONITOR.md) projects
authorized package, component, executable, retained-root, rollback, and
`SystemGeneration` facts from this model. It neither changes a generation nor
grants deployment authority.

Source-to-artifact/package/sign/release/image orchestration is canonical in
[build/BUILD_SYSTEM.md](build/BUILD_SYSTEM.md). Deployment consumes verified
outputs and does not silently select compilers or hold ordinary build/signing keys.
Versioned independently serviced component interfaces, provider bindings, and
their exact-generation lifetime rules are canonical in
[packages/COMPONENT_INTERFACES.md](packages/COMPONENT_INTERFACES.md).

**Status: PLANNED.** Existing signed-container parsing, UEFI loading, measured-
boot plumbing, release/recovery journals, rollback policy, native storage
objects, and configuration generations retain the exact implementation statuses
and evidence recorded elsewhere. This document does not claim a package manager,
Store, `SystemImage`, installer, deployment service, shell, or physical-disk
workflow is implemented. A bounded in-memory `DeploymentService` activation
foundation is described below; this does not implement the complete deployment
service claimed by this document.

**PARTIALLY IMPLEMENTED foundation:** `packages/tools/mrml` now exposes an
immutable bounded `SystemGeneration` record containing a nonzero local
generation and canonically ordered exact package identity, version, and artifact
digest entries. Focused Windows and Linux tests reject zero values, malformed
identities, empty/oversized graphs, duplicates, and noncanonical order. It does
not yet admit, activate, retain, roll back, export, or garbage-collect a
generation. A canonical version-2 binary codec now round-trips this bounded
identity/version/SHA3-512 record, rejects nonzero reserved fields, invalid UTF-8
or identities, truncation, trailing bytes, and noncanonical package order, and
limits package IDs to 255 bytes. This is deterministic serialization only, not
authenticated or crash-safe persistence and not package admission.

The same foundation now also performs bounded exact package resolution: every
requirement contains one package identity, one version, and one artifact digest,
and resolution succeeds only for one identical candidate. It rejects missing,
ambiguous, duplicate/noncanonical, empty, and over-capacity inputs and never
chooses a range, nearest version, replacement package, or policy-ranked result.
The build-tool model also constructs a bounded transitive graph from canonical
exact roots and exact dependency records. It admits only the byte-identical
identity/version/digest candidate, produces canonical package order, terminates
exact cycles without duplicating packages, and rejects missing or ambiguous
candidates, conflicting exact requirements, self-dependencies, noncanonical
edges, and package/edge/candidate limit violations. This is deterministic graph
construction only: package signature/admission policy, capabilities, durable
generation state, activation, rollback, and runtime loading remain **PLANNED**.
As a bounded runtime prerequisite, kernel isolation admission now requires and
retains one explicit active system-generation number independently from the
isolation-policy generation. Stale generation requests fail before native or
microVM backend construction, and committed/unavailable records preserve the
original value. This does not authenticate, persist, select, activate, or
recover a canonical `SystemGeneration`; those `DeploymentService` mechanisms
remain **PLANNED**.

The first `DeploymentService` control-plane slice is now **PARTIALLY
IMPLEMENTED** in `packages/services/deployment`. Exact root `CONTROL` authority
is required to stage and prepare a bounded candidate; exact root `READ`
authority is required to inspect the active record. Candidate handles carry
slot generations, activation is two-phase and one-use, stale expected-active
state and replay fail closed, and ordinary forward activation refuses implicit
rollback. Commit publishes an immutable `ActivatedSystemGeneration` containing
the generation number, separate SHA3-512 digests of the complete canonical
generation and canonical interface catalog, activation sequence, and source
object/generation identity. Kernel isolation
admission consumes that typed record, and both focused WHP/KVM component paths
now construct admission only after this activation transaction. Windows and
Arch Linux deployment-service suites pass 4 tests; package-format suites pass
12, kernel suites pass 509, WHP passes 7, and KVM passes 8. The current hosted
probe stages an already verified transient local generation. The activation
checkpoint now has a canonical fixed 224-byte SHA3-256-bound version-2
encoding. Its
publication composes the prepared activation and a new stable-file generation
through one COW `StorageTransaction` receipt: the service remains inactive
before receipt publication, commit consumes the exact file participant and
activation token, and recovery reads only the caller-selected exact file
generation through storage authority and verified extents. Windows and Arch
Linux simulation tests cover clean publication/recovery and corruption rejection
at the authenticated extent boundary. A separate fixed 256-byte version-2
authenticated recovery-state contract now binds a monotonic epoch, activation
sequence, generation digest, interface-catalog digest, source identity, exact
volume/object/file generation, and checkpoint digest. Publication advances it
by exact compare-and-store only
after the COW receipt exists; recovery requires complete equality, so an older
valid stable file fails when authenticated state names a newer generation.
This is Windows/Linux unit simulation against an abstract authenticated store,
not TPM/NVRAM evidence. Concrete recovery-journal/TPM integration, physical
durability, rollback authorization, retained-root integration, and general
runtime delivery remain **PLANNED**.

The candidate boundary now accepts complete canonical `MRMLSG2` generation and
`MRMLIC1` interface-catalog records through
`GenerationCandidate::from_canonical_records`. It decodes both records, requires
their numeric generations to match, and derives both activation digests itself;
callers on this path cannot pair detached digests with substituted bytes. The
focused WHP/KVM paths use this constructor before capability-authorized staging.
Windows and Linux tests include cross-generation catalog rejection. A separate
bounded general `SystemRelease` envelope now authenticates the exact `MRMLSG2`
and `MRMLIC1` byte pair with the existing SHA3-512/Lamport primitives. The
build-tool library emits it, and `DeploymentService` accepts it only when its
cryptographic signer identity exactly matches the identity selected by caller
policy; the signature identifies and authenticates bytes but grants no
capability or admission authority. The resulting candidate still passes through
the existing capability-authorized staging transaction. Corruption, generation
mismatch, and unexpected-signer tests fail before staging on Windows and Linux.
The public `mrml release system-create` command now consumes exact canonical
generation/catalog files plus a one-use key, deletes that key after successful
encoding, and creates a new `.mrs`; `system-verify` requires an explicit public
root. Both focused component runners now require the `.mrs` and public root,
stage only `GenerationCandidate::from_system_release`, and compare its admitted
digests with the locally verified consumer/provider artifacts before Total-mode
kernel admission. Windows and Arch Linux build-tool tests pass 92 cases; WHP
passes 7 and KVM passes 8 compile/unit cases. Each optimized runner now also has
a `component-release-inputs` mode which verifies the same current artifacts and
emits its canonical records; their 201-byte generation and 207-byte catalog were
byte-identical. One freshly created 99,064-byte `.mrs` then completed the current
component probe on WHP and nested KVM with zero KVM native fallback. Owner-root
policy integration, stronger signing-key isolation, Store, installer/recovery
persistence, rollback, and retained-root integration remain **PLANNED**.

A third canonical release-bound prerequisite is now **PARTIALLY IMPLEMENTED**:
the allocation-free `MRMLRI1` runtime-inventory catalog. It binds every package
identity/version/artifact digest in the exact `MRMLSG2` generation to its Total
class, must-run state, placement bounds, supported forms, and explicit exception
reason. Decode rejects malformed fields, unknown classes/placements, invalid
bounds, platform mixing, missing reasons, noncanonical order, and trailing data;
exact validation rejects any subset or substituted generation member. This
catalog is metadata and grants no capability. Manifest V2 derivation is now
**IMPLEMENTED** in the public build frontend: every generation member must have
an explicit complete runtime classification, and `mrml release
runtime-inventory-create` derives the catalog from the workspace manifest plus
the generation's exact version and digest. Missing classifications, unknown
generation members, malformed policy, subsets, and substitutions fail closed.
Windows and Arch Linux each pass 99 focused build-tool tests. Signed delivery is
now **IMPLEMENTED** as general SystemRelease format v2: it authenticates exact
generation, interface-catalog, and runtime-inventory records under one content
digest and signature, and parsing revalidates complete inventory membership
against the enclosed generation. Existing two-record v1 releases remain
readable but expose no runtime inventory and therefore cannot prove Total
readiness. Kernel inventory construction is now **IMPLEMENTED** through a
bounded adapter that requires the caller-policy-selected signer, v2 inventory,
and an exact one-for-one package-to-live-domain binding. It rejects missing,
duplicate-package, incompatible-co-location, class-substituted,
reason-substituted, or excess bindings before publishing an inventory.
Compatible colocated packages conservatively combine must-run state. The result
is a private-field `ReleaseTotalMicrovmInventory` retaining the authenticated
signer, system generation, canonical generation digest, interface-catalog
digest, and policy generation; safe code cannot construct it from ad hoc
domain records. Before it can reach recovered strict-Total policy, it must be
consumed into `ActivatedReleaseTotalMicrovmInventory` by exact equality with
the activated generation number and both retained digests. Numeric generation
equality cannot substitute either canonical record. End-to-end
runner consumption is now **PARTIALLY IMPLEMENTED** for the focused ZIM/Zstd
component release. WHP and KVM each derive the same 201-byte generation,
207-byte interface catalog, and 225-byte runtime inventory; all three records
are byte-identical across backends. One freshly signed 99,369-byte v2 release
then authenticated those records and bound both packages to the prepared exact
domain before CPU, RAM, or VMM guest construction. Both runners retained the
immutable inventory across construction and finalized `classified=1`,
`eligible=1`, `microvm=1`, and `native_fallback=0` only after exact microVM
admission and before guest execution on WHP and nested KVM. This is hosted
controlled-probe evidence for one focused release, not a complete installed-
system inventory, full boot recovery proof, or host-resistant isolation.

Exact release-content persistence is now **PARTIALLY IMPLEMENTED**. The bounded
424-byte `MRMLDA3` activation checkpoint retains the activated generation plus
the verified SystemRelease content digest, selected signer identity, and exact
runtime-inventory digest under its checkpoint checksum. `DeploymentService`
recovers that state as `ActivatedSystemRelease`; generation-only activation and
legacy 224-byte `MRMLDA2` checkpoints remain readable but recover without a
release identity and therefore cannot satisfy strict-Total inventory binding.
Stable COW publication writes v3, and the rollback-resistant recovery record's
checkpoint digest commits to those exact bytes. Identity metadata does not
grant deployment or launch authority. Full installed-system enumeration and
live early-boot orchestration remain **PLANNED**.

The kernel's newer assignment adapter keeps policy-selected domain identity
separate from authenticated package classification. Callers submit an exact
one-for-one package/domain set; the signed runtime inventory supplies class and
descriptive reason. Only the typed host-substrate enum reason remains explicit
architecture input, and it is rejected for every other release class. Neither
the assignment nor the release grants a capability. The focused WHP/KVM path
now constructs a fixed-capacity `RuntimeDomainAssignmentPlan` from the exact
activated signed release. The plan enumerates every authenticated runtime
member and can seal only after each has one policy-selected domain; unknown,
duplicate, omitted, or excess members fail closed. This is an authority-free
control-plane transaction: normal capability-authorized launch admission must
still establish each route before its shortest-safe-path data plane may run.
Its policy callback now receives each complete authenticated runtime record and
publishes assignments atomically only after every callback succeeds; identity
substitution or one rejected member publishes none. The WHP/KVM runners no
longer carry a detached ZIM/Zstd package list. General per-package owner-policy
lookup, distinct-domain construction, and complete installed-system
orchestration remain **PLANNED**.

`DeploymentService` now **PARTIALLY IMPLEMENTS** the installed control-plane
join through `begin_runtime_assignment`. Exact `READ` authority over the
deployment service is checked before the currently activated
`ActivatedSystemRelease` selects its signer and identity for caller-supplied
canonical release bytes. The caller cannot supply a replacement active identity
or signer; corruption, legacy activation without release identity, and identity
substitution fail before enumeration. The returned fixed-capacity plan still
grants no capability and seals only after every authenticated runtime member is
assigned. Deployment passes 6 tests on Windows. Live recovery selection of the
installed release file, general owner-policy decisions, and launching every
resulting domain remain **PLANNED**.

The installed release-image read is now **PARTIALLY IMPLEMENTED**. The same
deployment owner checks exact `READ` authority before touching storage, requires
the authorized file's stable object and generation to equal the activated
generation's retained source, bounds the complete length to the canonical
SystemRelease maximum, and reads through an exact storage file capability.
Large valid releases are read in bounded chunks because their maximum size can
exceed one storage read. Short output, source substitution, missing authority,
verified-read failure, and release-identity mismatch fail before assignment;
partial bytes are erased after read failure. Deployment passes 6 tests on
Windows using a real `FileState`, storage authority, verified extent backend,
and signed runtime release. Invocation by the live service and general
owner-policy assignment remain **PLANNED**.

Authenticated checkpoint recovery and that source-file read are now joined by
`recover_and_read_runtime_assignment`. It returns one
`RecoveredRuntimeAssignment` retaining the recovered `DeploymentService`, the
authenticated recovery epoch and exact checkpoint file/digest evidence, and the
complete assignment plan built from its exact active release. No detached active
identity or recovery evidence is discarded between rollback-resistant checkpoint
validation and release enumeration. The focused test authenticates and retains
that recovery state, reads the checkpoint and release through separate exact file
capabilities, and seals the recovered plan. Deployment remains 6 passing tests
on Windows. Joining this owner to recovered configuration in the real service
boot path and general owner-policy assignment remain **PLANNED**.

Recovered configuration now **PARTIALLY IMPLEMENTS** complete owner-policy
assignment over that plan. Its committed revision must equal the plan's policy
generation, and each authenticated release package must exact-match one
component-scoped persisted isolation setting readable through its own live
capability. Count mismatch, omission, duplication, stale policy, revoked or
wrong authority, and package substitution leave the assignment plan empty.
Policy data identifies the intended runtime domain but neither metadata nor the
setting capability grants domain construction or launch authority. Windows
passes 566 kernel tests and 51 configuration tests. Production service wiring,
resource construction, route admission, and complete launch remain **PLANNED**.

The delivered installed-system path now **PARTIALLY IMPLEMENTS** the next
single-owner join. It consumes the retained one-use recovery envelope and an
exact active-release assignment plan directly: installed identity, recovered
effective policy, complete capability-checked package assignment, activated
release inventory, and the only admission table bind atomically. There is no
detached release-builder callback in this path, and any stale generation or
substitution produces no admission owner. The focused Windows configuration
suite remains 51 passing tests through microVM route commitment and strict
runtime authorization. Live service-loop invocation and complete multi-domain
launch remain **PLANNED**.

The cross-service owner is now **PARTIALLY IMPLEMENTED**. Deployment seals an
assigned release only into `RecoveredDeploymentRuntimeInventory`, retaining its
authenticated recovery owner until configuration consumes the exact inventory.
Configuration then returns one `RecoveredDeploymentTotalControlPlane` retaining
both delivered configuration recovery and deployment recovery beside the sole
installed admission table. Assignment, sealing, policy binding, or installed
identity failure returns no joined owner. Deployment passes 6 tests and
configuration 51 tests on Windows. The shared hosted recovery probe now builds
this owner from separate authenticated configuration and deployment checkpoints,
and WHP/KVM retain it through strict runtime authorization rather than accepting
a detached release callback. WHP passes 12 runner tests; KVM uses the same source
path but cannot cross-build on this Windows host without `cross_host_rust_target`.
Real service-loop construction, distinct-domain launch/cleanup, and end-to-end
system execution remain **PLANNED**.

Installed-root selection for that production join is now **PARTIALLY
IMPLEMENTED**. `SelectedStableTotalSystemRecovery` requires four distinct file
objects—configuration, authority checkpoint, deployment checkpoint, and the
activated SystemRelease—from one integrity-validated volume/root generation.
The retaining owner keeps the complete reachable graph alive; the selection is
data and grants none of the four required file capabilities. Missing files,
duplicate objects, or prior-root substitution fail before service recovery.
Configuration remains 51 passing Windows tests. Serviced block-volume recovery
is now **PARTIALLY IMPLEMENTED**: one installed session reads both redundant
roots, validates the complete graph, and retains the same exclusive data plane
beside the four-file owner. Live service-loop consumption remains **PLANNED**.

- Complexity impact: MEDIUM
- TCB impact: LOW
- New parser boundary: YES
- New authority model: NO
- New persistent state: NO
- External dependency: NO
- Failure isolated: YES
- Existing-object reuse: HIGH

This is a bounded, allocation-free composition of the existing canonical
generation/catalog records and existing cryptography. A distinct internal magic
avoids overloading the earlier boot-only release record. It creates no new
authority or persistent state: control-plane policy selects the expected signer
and authorizes staging, while the admitted exact bytes take the shortest safe
path into the existing candidate parser.

> Installation, updating, offline servicing, recovery, system imaging, and
> system snapshots are different operations over the same immutable package and
> SystemGeneration model, not independent mechanisms.

Terminology is strict: a `Package` is one signed classed artifact;
`SystemModule` is its privileged module class; `SystemRelease` is a coherent
exact package graph; `SystemGeneration` is its locally admitted configuration and
trust instantiation; `SystemSnapshot` records an exact deployable generation;
`SystemImage` transports releases/packages/snapshots for deployment and service;
`MachineBackup` additionally contains explicitly selected mutable personal state;
`InstallPlan` is non-authorizing declarative intent; `DeploymentTransaction` is
the exact validated, previewed, capability-authorized operation; and `BootTarget`
is explicit boot-placement state. “Image,” “release,” and “generation” are not
interchangeable.

Documentation status uses the repository vocabulary: `DESIGN GOAL` or
**PLANNED** describes this architecture; **IMPLEMENTED** requires code and focused
tests; `TESTED`, `MEASURED`, `AUDITED`, and `PROVEN` require their exact stated
evidence. Documentation alone establishes none of the latter five claims.

## Canonical package family

One signed MRML package-container family uses the preferred `.mrp` extension,
artifact classes, and admission
profiles for applications, libraries, drivers, system modules, kernel, VMM,
bootloader distribution, and recovery components. The extension is presentation;
internal magic/version and authenticated metadata remain authoritative. See
[packages/ARTIFACT_EXTENSIONS.md](packages/ARTIFACT_EXTENSIONS.md). Stable reverse-DNS identifiers include
`org.mrml.system.kernel`, `.bootloader`, `.vmm`, and `.recovery`;
`org.mrml.service.network`, `.wifi`, and `.bluetooth`;
`org.mrml.driver.nvme` and `.gpu.nvidia.blackwell`; and
`org.mrml.app.terminal` and `.store`. These illustrate identity, not ownership.

`package_id`, publisher key ID, version, architecture/profile, and content digest
remain separate. Publisher changes do not rename the logical package by default.
Names identify; capabilities authorize. A manifest requests authority and never
grants it.

Canonical metadata binds package ID/class/version, architecture slices, exact
digests, publisher identity/key, dependencies and required interfaces, requested
capabilities, hardware/features, minimum compatible ABI, admission/security
profile, and compiler/security metadata where applicable. Multi-architecture
packages may carry `META/`, shared `RESOURCES/`, and payloads for `x86_64`,
`aarch64`, and `riscv64`; this does not promote architectures beyond the current
roadmap. Large releases may use architecture-specific split artifacts under one
logical release.

Package identity is not interface identity. A package such as `org.mrml.zstd`
may provide `org.mrml.interface.compression.zstd@3`, while `org.mrml.zim`
requires that interface rather than a provider name or filename. Package
versions and interface generations are separate. A compatible independently
serviced provider change creates a candidate generation without rebuilding the
consumer; runtime edges are not Cargo dependencies or path-based DLL/SO lookup.

Zstandard is the preferred package/image compression family. Canonical bounded
profiles support deterministic hashing, signing, reproducibility, and content
addressing where practical. No final representation is claimed before a format
specification, independent parser review, and adversarial tests.

## Releases and generations

A signed `SystemRelease` is an exact mutually admitted and tested package graph.
Individually valid bootloader, kernel, VMM, service, driver, and application
packages do not automatically compose a valid release. Changing the VMM or any
other bound artifact produces a different release graph even if the kernel is
unchanged.

Candidate-generation validation must eventually re-evaluate isolation defaults,
floors, supported forms, interface transports, VMM/runtime compatibility, and
required Total-mode blockers. A package that loses a required microVM path is
not silently activated with native fallback. Any derived
`TOTAL_MICROVM_READY` profile is bound to exact generation, policy, runtime,
hardware, and evidence; it is not package self-asserted trust metadata.

A `SystemGeneration` is a locally admitted instantiation of the immutable release
graph plus an exact configuration generation, owner trust policy, and required
boot/security state. Useful lifecycle states include `Downloaded`, `Staged`,
`Candidate`, `Current`, `KnownGood`, `Failed`, and `Retired`; names are not frozen
ABI. Transitions are authenticated, monotonic, crash/power-loss safe, and
inspectable. Failed candidates never silently replace the last known-good path.

Kernel, VMM, bootloader, recovery, services, and drivers use the same package
family with class-specific admission. A filename such as `kernel.bin` is not
sufficient identity. Architecture-specific kernel/VMM images and metadata are
selected only after exact release, profile, digest, and feature validation.

## Conventional UEFI bootstrap

Typed NVRAM entry/order/next administration, installer entry creation, dual-boot
preservation, and owner Secure Boot compatibility policy are canonical in
[platform/UEFI_BOOT_MANAGEMENT.md](platform/UEFI_BOOT_MANAGEMENT.md).

> UEFI loads one conventional EFI application; that application is MRML's
> package-aware secure loader.

Ordinary conforming UEFI loads architecture-specific PE/COFF (`BOOTX64.EFI`,
`BOOTAA64.EFI`, or equivalent) from the EFI System Partition. It need not parse
MRML packages. The verified updater extracts the applicable EFI payload from the
bootloader package and stages it safely on the ESP. The loader then selects a
generation, validates bounded canonical manifests/signatures/digests, selects
architecture, decompresses boot-safe payloads, measures relevant artifacts,
constructs launch state, and loads the kernel, VMM, and required early objects.
It does not browse repositories, solve arbitrary dependencies, discover
publishers, run the Store, or perform general installation.

The initial boot-safe Zstd profile has a bounded maximum window and artifact
size, known output size, no external dictionary, and strict malformed-stream
rejection. Userspace may later support broader profiles without enlarging the
early parser.

The ESP converges on active and alternate/known-good EFI loaders, necessary
recovery material, and a small signed generation locator. The native system
volume owns the content-addressed store, release manifests, generation metadata,
and recovery generations. Bring-up may temporarily place more on FAT32; FAT32 is
not the permanent package database.

The separately serviced FAT32 compatibility provider is now **PARTIALLY
IMPLEMENTED** only through bounded read-only boot-sector geometry validation.
Its isolated package/interface binding permits compatible replacement without
making FAT metadata authoritative. ESP mount, lookup, file I/O, format/check,
installer composition, and live update remain unimplemented.

Bootloader update uses A/B, previous/current, or equivalent staging: verify and
write inactive state, flush and read-back verify, select a candidate, boot it,
and only then mark it known good. Every interruption retains a defined recovery
path and never destroys the final known-good loader first.

UEFI Secure Boot authenticates an owner-authorized EFI loader; MRML separately
authenticates the exact `SystemRelease` and package digests. Owner-controlled
trust roots, development authorization, rollback resistance, and accessible
recovery coexist. A project/vendor key is not permanent machine ownership.
Separate offline root delegations cover system releases, Store metadata/key
sets, system-module policy, and publisher trust. One online Store compromise
must not become Secure Boot or release-signing authority.

## Store and transport

The initial catalog may use GitHub Pages and package artifacts may use GitHub
Releases, but GitHub is transport, not the root of trust. Signed catalog records
bind identity, version, size, digest, architecture, publisher/signature, and one
or more neutral sources such as mirrors, local media, local/enterprise stores,
or GitHub. Artifact identity survives transport changes.

Catalog epochs/generations, accepted-state persistence, appropriate expiry or
freshness, exact digests, key rotation, and revocation resist rollback and
freeze. Old valid signatures do not make vulnerable metadata current.
Applications, system components, drivers, developer tools, accessibility,
language/localization, models, and updates are presentation categories, never
authority.

The Store may authenticate and download kernel, VMM, bootloader, services,
drivers, modules, or applications, but only a generation builder performs
admission and constructs a candidate. Download does not grant kernel, MMIO, DMA,
filesystem, network, device, or other capability.

For component updates the Store also resolves typed `PROVIDES`/`REQUIRES`, major
interface generation, dependency form, and update policy before activation. It
never overwrites mapped code. Existing consumers retain exact old provider
generations; new consumers may bind a compatible newly admitted generation; ABI-
incompatible substitution fails. Previews expose affected dependents and whether
the consumer itself changed.

## System images, export, and servicing

A signed, content-addressed, Zstd-compressed, multi-architecture `SystemImage`
is streamable where practical and independently verifiable for installation,
recovery, offline servicing, and archival export. Its provisional structure has
`META/` image/signature/profile metadata, `RELEASES/` exact manifests,
`PACKAGES/` content-addressed objects, `BOOT/` required boot/recovery material,
and `OPTIONAL/` drivers, applications, languages, and profiles. Identical content
is not duplicated. Builders measure whether to retain independently compressed
packages or repack canonical payload groups; they do not blindly nest Zstd while
preserving package/content verification.

Exporting a generation preserves exact package identities/digests and relevant
configuration/trust metadata. A system image is a deployable OS, not a personal
backup: it excludes arbitrary documents, browser history, personal data,
credentials, and non-exportable secrets by default. `USE` remains distinct from
`EXPORT`. Transferable secret backup requires explicit export authority,
trusted consent/policy, encryption, and destination semantics; hardware-bound
secrets may require reprovisioning.

A first-party deployment/servicing service modifies the running machine only by
building a candidate generation and modifies offline images/staged generations
through the same immutable operations. It never patches arbitrary live system
files in place. Recovery selects verified known-good generations or performs
the same offline service operations under recovery-specific authority.

## Typed administration and terminal

The native shell takes object pipelines, discoverable commands, structured
errors, inspectable properties, and explicit destructive operations from
PowerShell 7 without promising syntax compatibility, Windows object models,
ambient administrator authority, or stringly compatibility. Commands return
typed `DiskObject`, `PartitionObject`, `VolumeObject`, `SystemImageObject`,
`SystemGenerationObject`, `PackageObject`, `CapabilityObject`, `ServiceObject`,
`GpuObject`, `CpuObject`, `TemperatureSensorObject`, and `PowerProfileObject`
where appropriate. Text is presentation, not universal administration IPC.

Provisional verbs include `Get/Test/Mount/Dismount/Install/Export-SystemImage`,
`Get/Set-Next-SystemGeneration`, `Get/Add/Remove/Update-SystemPackage`,
`Update-System`, and disk/partition/volume commands. Pipelines carry semantic
objects with identity and generation, while every action independently checks
exact capabilities.

The first-party terminal accelerates glyph rasterization/cache, scrolling,
selection, composition, HiDPI, and suitable animation through the GPU when
available, with software/GOP fallback. Canonical terminal state is semantic
text, not pixels. Braille, speech, AI, search, selection, and copy use the same
redacted semantic state. The terminal is neither root nor ambient authority and
its scrollback and rendering resources are bounded.

## Disk, partition, and boot administration

The canonical disk-image, checking, filesystem, UDF, optical/MMC, burning, and
virtual-optical design is [storage/STORAGE_AND_OPTICAL.md](storage/STORAGE_AND_OPTICAL.md).
Those new mechanisms remain **PLANNED** unless exact code and evidence are cited.

Native administration enumerates disks, inspects tables, initializes GPT,
creates/deletes partitions, identifies ESPs, creates MRML system/data/recovery
partitions, formats supported filesystems, inspects volumes, stages boot state,
and verifies layout. MBR/legacy BIOS is not a native priority. NVMe controller,
namespace, queue, health, and content authorities remain separate from layout
administration.

Conceptual rights `READ_LAYOUT`, `MODIFY_PARTITION_TABLE`, `FORMAT`, `ERASE`,
`INSTALL_BOOT`, and `MOUNT/ATTACH` are independently attenuated and revocable.
Metadata observation does not authorize destruction or content. Bounded DMA,
IOMMU, reset/recovery, and native-storage invariants remain unchanged.

Before destructive work, a canonical preview identifies the exact disk by
stable hardware evidence, expected prior layout/generation, every delete/create/
format/boot/deploy operation, and an explicit data-loss result. Trusted
authorization binds this exact transaction and expires; generic “allow
installer” authority is insufficient. Revalidation before commit rejects device
replacement, changed layout, stale plan, ambiguity, or partial cleanup.

## InstallPlan and installers

Optional installer Ethernet/Wi-Fi configuration reuses the services in
[network/NETWORK_ADMINISTRATION.md](network/NETWORK_ADMINISTRATION.md); offline
installation remains complete.

A declarative `InstallPlan` contains target disk, layout, architecture, profile,
exact `SystemRelease`, package selections, boot configuration, owner trust
policy, network bootstrap policy, accessibility defaults, and recovery
configuration. It is intent/data and grants no destructive authority.

```text
InstallPlan -> Validate -> Preview -> trusted exact authorization
            -> Execute -> Verify -> Candidate -> KnownGood after boot proof
```

Downloaded plans cannot trigger installation. Unattended/declarative deployment
uses the same validation and exact pre-provisioned authority; noninteractive does
not mean ambient. Secrets and credentials arrive through separate scoped
provisioning, not embedded casually in plans or images.

The first complete installer is text based, keyboard operable, minimal,
recovery-friendly, and understandable, with strong automatic defaults and
optional advanced choices. Its short path is welcome -> language/accessibility
-> disk -> automatic/custom layout -> profile -> owner/trust setup -> exact
destructive review -> install -> verify -> reboot. It does not wait for the GUI.
A later GUI installer is a Semantic Scene Graph projection over the same
`InstallPlan`, preview, authorization, execution, and verification service—not a
second installer architecture. Essential text and GUI flows support trusted
visual, keyboard, Braille, and speech operation as capability and evidence mature.

### Automatic and custom partitioning

The safe automatic UEFI template creates GPT with an ESP, MRML System partition,
and optional Recovery and User/Data partitions. Exact sizing is policy. It exact-
matches and revalidates the selected disk, protects installation media and every
unrelated disk, aligns partitions, creates a conforming ESP and native system
layout, retains recovery, and presents the complete transaction before authority.
Ambiguous automatic selection stops without writes.

Custom layout is available through typed shell, text installer, and later GUI
objects. It may reuse an ESP, create/remove partitions, choose object-store
targets, split system/data and recovery, select encryption, or compose multiple
disks. Normal use specifies sizes, types, stable identities, alignment policy,
volumes, and `BootTarget`, not raw LBAs. Low-level diagnostics may expose sectors.
The validator proves that the resulting layout is bootable before destructive
execution. Reusable `DesktopSingleDisk`, `MinimalSingleDisk`,
`EncryptedDesktop`, `Developer`, and `Removable` templates produce plan fragments
and never bypass validation or authorization.

Stable disk binding includes available controller/device path, serial, namespace
identity, size, model, and device/session generation. An unstable label such as
“Disk 1” is presentation only. Installation source overwrite requires a supported
explicit self-replacement workflow. Native storage becomes the install target
only after its durability/security gate; temporary bootstrap layouts remain
documented as transitional. Full-disk encryption later composes owner-controlled
keys, optional TPM/hardware-assisted unlock, passphrase, and local recovery;
cloud identity is never mandatory. Image signing and optional image encryption
remain authenticity and confidentiality properties respectively.

### One engine and system profiles

`DeploymentService` is the sole installation engine for shell, text, GUI,
unattended, recovery, automation, and capability-scoped AI frontends. Frontends
construct the same objects, consume the same typed progress/errors, and invoke
the same validation, preview, exact authorization, execution, and verification
state machine. GUI flow adds source, package/customization, review, verification,
and reboot screens through the trusted semantic GUI; acceleration failure falls
back to software/GOP, then to the text installer if necessary. The text path
requires only the minimum console/frontend—not full shell, GPU, mouse, network,
Store, or AI.

Signed/validated `Desktop`, `Minimal`, `Development`, and `Recovery` profile
manifests select package sets and defaults, not editions or alternate security
universes. Development can add compiler, debugger, SDK, and profiling packages
without globally granting `DEBUG`, `RAW_GPU`, or `DISK_ADMIN`. Desktop can select
compositor, terminal, shell, Store, connectivity, audio, HID, accessibility, and
drivers. Profile data requests components and policy; admission still grants
each capability explicitly.

## Activation, recovery, and rollback

Online servicing resolves a requested change into a staged candidate generation;
active immutable packages are never patched in place. Offline servicing exposes
a capability-scoped package/configuration object view of an image and commits or
exports a new authenticated image/generation, leaving the source unchanged.
“Mount” does not require pretending packages are a writable filesystem tree.

Explicitly restartable isolated services may activate by verifying and staging a
new service generation, revoking/stopping the old service, cleaning all authority
and resources, launching and health-checking the replacement, then committing.
Foundational kernel, VMM, bootloader, early-security, or incompatible ABI changes
require a whole-system candidate and reboot. Not every component is hot-swappable.

Candidate success requires early boot, critical services, and a defined health
gate—not merely reaching kernel entry. Until then the previous policy-allowed
known-good generation remains available. Bounded failure state supports owner-
policy automatic or selected rollback. Operational rollback returns to a working
generation; security rollback attempts a release barred by committed anti-
rollback policy and may require explicit recovery policy or remain denied.

The first-party recovery environment is an exact package/release graph using the
same capability model. It can inspect/select generations; verify packages and
storage; repair boot selection and package-store metadata; reinstall an
authenticated bootloader package; import/install/export an image or authorized
user data; inspect failures; and rotate owner keys where policy allows. Boot
repair, layout modification, store repair, generation selection, trust-root
change, data export, and credential recovery are separate authorities and may
require physical presence or secure attention. Recovery is not unrestricted root.

## Snapshots, package lifecycle, and provenance

A `SystemSnapshot` binds an exact generation, package identities/digests,
selected configuration, restore trust-policy identifiers, and compatibility
metadata, but not transient runtime state absent an explicit checkpoint. It can
export an independently verifiable `SystemImage`, and a readable known-good
installation can export from recovery without bypassing secret rules. Import
parses, verifies signatures/digests, checks architecture/profile and release
consistency, then stores content; it never activates automatically.

`Test-SystemImage` returns structured manifest, signature-chain, digest, missing-
object, architecture, release/dependency, freshness/rollback, boot-profile, and
corruption diagnostics—not a bare Boolean. Parsing is bounded, canonical,
versioned, independently fuzzable, overflow-safe, overlap/duplicate-conflict
rejecting, and strict about unknown required fields. Authenticated metadata needed
for destructive decisions arrives before writes. Streaming supports bounded RAM
without accepting partial objects. Optional later deltas are transport only; the
reconstructed object must equal the canonical signed digest. Exact deduplication
must not create unreviewed cross-boundary side channels.

The content-addressed `PackageStore` retains everything reachable from current,
known-good recovery, staged candidate, pinned snapshot, or explicit retention
roots. GC never removes the sole known-good path. Caches remain untrusted until
verified. Ordinary app install is transactional from download through verified
published application generation; failures leave no half-installed authority.
Uninstall removes generation references and revokes app authority while making
retained user/shared data inspectable rather than silently erasing it. Updates
create rollback-capable app generations and make data migrations explicit.
Package-store garbage collection is therefore a reachability operation, never a
space-pressure excuse to erase rollback or pinned retention roots.

Dependencies are typed package, interface/ABI, hardware-feature, or service-
capability-class requirements; resolution chooses artifacts and grants no runtime
authority. The bootloader receives an already resolved exact graph and contains
no dependency solver. Release records preserve package/digest, toolchain, and
needed build identities. Generation provenance reports release, packages,
configuration, admitting trust roots, official/owner/mixed composition, and
content sources without converting provenance into authority.

Repository source configuration binds endpoint, key-set/trust identity, allowed
namespaces, priority, and mirror policy. Third-party repositories and local files
use the same parsing, signature-policy, digest, dependency, architecture, and
capability-request checks. Cryptographic validity is separate from policy trust.
Owner-built and mixed releases remain possible under owner policy and are labeled
honestly rather than reusing official provenance. Keys rotate/revoke through prior
trusted policy or owner action. Stable/testing/development/pinned channels and
package pins select candidates without changing trust semantics; blocked security
progress is reported.

Signed advisories can identify affected/fixed versions and severity but grant no
authority. Application and system-module updates show requested-capability diffs;
a valid update signature cannot silently widen authority. UX distinguishes app,
service/module, driver, kernel/VMM, and bootloader activation requirements and
shows a complete generation graph diff across visual, text, accessibility, and
authorized automation/AI interfaces.

The eventual Store GUI uses these same Package/Deployment APIs for discovery,
provenance, compatibility, requested rights, history, install/uninstall/update,
drivers/system components, and supported rollback. Its semantic state supports
keyboard, speech, Braille, and capability-scoped AI; visual cards/screenshots are
never the only software-installation interface. Terminal, shell, and text/GUI
installer components are ordinary versioned, reproducible packages bound exactly
into installation media and receive no first-party hidden authority.

## Administration safety and deployment state

The shell is never “run as root.” A session can inspect objects while lacking
their modify rights; a specific, expiring `FORMAT` capability for one exact disk
does not imply partition, boot, package, or other authority. The shell constructs
a transaction, while the trusted authority broker/UI supplies high-risk consent;
a terminal-rendered `[Y/N]` is not automatically trusted.

Structured objects remain structured through pipelines, for example:

```text
Get-Disk | Where BusType == NVMe
Get-SystemGeneration | Where State == KnownGood
Get-SystemPackage | Where UpdateAvailable
Get-Temperature | Sort Value Descending
```

Tools do not scrape human output when a typed API exists. Cross-boundary shell
serialization is typed, versioned, bounded, canonical, and incapable of hiding
bearer authority; serializing an object description transfers no capability
without the explicit capability-transfer mechanism. Any future remote shell
separates authenticated identity from authorization, scopes every capability,
keeps destructive transactions inspectable, and applies audit/retention policy.
It does not recreate unrestricted SSH-root semantics.

`DeploymentProgress` carries phase, current operation, completed/total units,
warnings, and recoverability state. Typed errors include `SignatureInvalid`,
`DigestMismatch`, `UnsupportedArchitecture`, `InsufficientDiskSpace`,
`TargetInUse`, `PartitionPlanConflict`, `RollbackDenied`,
`BootloaderWriteUncertain`, `PackageDependencyConflict`, and `CapabilityDenied`.
Durability uncertainty stays uncertainty. Text, GUI, Braille, speech, and AI
consume the same semantic progress, error, audit, and preview objects.

Cancellation is ordinary before destructive commit. Afterwards it must complete
a coherent rollback/recovery action or state the exact recoverable intermediate
condition; no unsafe Cancel control is offered. Before reboot, storage and store
transactions, boot selection, and required logs/audit are durably resolved unless
recovery explicitly covers the uncertain state. Deployment authority is
transaction-scoped (for example one disk layout, volume format, store write,
boot-target install, and generation create) and revoked after completion.

Privacy-aware structured logs record target identity, planned partition actions,
package verification, generation creation, boot staging, failures, trust changes,
candidate selection, activation, rollback denial, and authority-request widening,
but not passphrases, credentials, secrets, payloads, or user content. Power and
thermal policy may adjust concurrency or recompression, never verification or
durability. Parallel work preserves deterministic results and durability order.
Measure verification, decompression, import, provisioning, generation build,
staging, and candidate validation before optimizing; Zstd acceleration remains
vendor-neutral with software fallback.

## Installation media and hardware realization

`BootTarget` binds ESP, architecture, firmware type, active/fallback loader slots,
and generation locator. Its install authority is narrower than arbitrary ESP
filesystem write where practical. Multiple explicit system roots/stores per disk
remain possible. `New-InstallationMedia` creates and verifies an outer bootable
EFI layout containing an installer/recovery generation, selected inner
`SystemImage`, and required drivers; the media layout and image container are
not interchangeable.

The same image and installer serve supported VMs and physical machines. Before
destruction, they verify image/release signatures, package digests, architecture,
hardware requirements, loader compatibility, and integrity. A structured
hardware readiness report marks CPU, IOMMU, NVMe, GPU, Wi-Fi, Bluetooth, USB,
TPM, and
UEFI/Secure Boot as Supported, Supported with limitations, Missing optional
driver, Unsupported, or Unknown. Enumeration alone is not support evidence.

Signed drivers may come from the image, trusted local media, or authenticated
Store sources and are always verified. Offline base installation remains complete;
network and remote accounts are optional. Local owner/trust setup establishes
machine ownership without cloud identity. Secure Boot enrollment deliberately
shows exact keys, explanation, backup/recovery guidance, and a rollback path and
never silently replaces owner keys.

Custom image construction resolves selected signed packages, base release, and
profile directly into a reproducible image without first mutating a running
machine. Image provenance distinguishes official, owner-composed, and third-party-
composed graphs; altered graphs cannot borrow official branding. Owners can build
offline installation/recovery media from a selected known-good generation.

Hardware-compatible restore selects architecture slice and deterministic,
inspectable signed driver set, preserving package identity while creating new
machine-specific configuration as needed. It does not promise an in-place CPU-
architecture switch. Driver package installation only records requested PCI,
MMIO, interrupt, IOMMU, reset, and firmware authority; admission grants it.

Intel and AMD microcode payloads may be authenticated system-package content or
equivalent vendor-update objects recording vendor, applicability, revision,
digest, and available authentication. MRML does not author vendor microcode. A
release may bind approved payloads, while runtime evidence separately records the
revision the physical CPU actually accepted. Deployment follows the exact support
floor and post-update mitigation flow in
[`platform/CPU_PLATFORM.md`](platform/CPU_PLATFORM.md). The existing Ryzen 9 7950X3D
reference remains canonical; this deployment continuation does not replace
it with the separately suggested 7950X.

Default LowPower, Balanced, Performance, and Custom power policies may ship as
signed configuration or system-module content. They remain policy inputs and
never expand capabilities or weaken verification/durability.

## Conceptual end-to-end flows

```text
GitHub Pages signed catalog -> GitHub Release or mirror artifact
  -> verify publisher policy and digest -> PackageStore
  -> exact SystemRelease candidate -> admitted SystemGeneration -> boot/update

SystemGeneration -> Export-SystemImage -> compressed SystemImage
  -> installer / recovery / offline servicing

Get-Disk -> build InstallPlan -> exact preview -> trusted authorization
  -> DeploymentService -> verified Candidate -> boot proof -> KnownGood
```

## Verification, recovery, and review

Dependency order is: specify/fuzz canonical package and boot-safe compression;
release graph and generation state machine; content store and catalog rollback;
bootloader A/B; image/export/offline servicing; typed read-only shell objects;
exact destructive transaction service; text installer; unattended deployment;
then GUI projection. Do not skip storage durability, owner-trust, accessibility,
or rollback gates for Store presentation.

Integrated milestone order is: canonical container; verifier/store; release and
generation graph; package-aware loader reader; safe A/B staging; online/offline
service; image; shell object API; partition primitives; text installer; snapshot/
export/import; recovery; Store application install; module/driver updates; GUI;
unattended/AI; then measured delta/image optimization. Stable object semantics
precede frozen shell spelling.

The first installer proof boots UEFI media under supported KVM and WHP, uses the
text frontend on a blank virtual disk, creates GPT/ESP/system storage, verifies a
signed image, imports packages, creates generation 1, installs the EFI loader,
verifies, reboots, and boots independently. It is hosted VM evidence only. A
later physical NVMe proof requires real UEFI/NVMe, exact disk identity, enabled
Secure Boot where claimed, known-good recovery, reboot and power-cut tests.

Snapshot proof exports a booted known-good generation, installs it in a fresh VM,
and verifies the exact graph and excluded secrets. Store proof authenticates a
transport-neutral update, builds/activates a candidate as appropriate, and
retains rollback. Offline proof changes exactly one permitted package in a new
image, installs it, and verifies no other graph change.

Tests cover canonical encoding/digests, architecture selection, decompression
bounds, invalid graphs, publisher/admission separation, catalog replay/freeze,
generation power loss, A/B interruption, image streaming/deduplication, secret
non-exportability, online/offline equivalence, typed pipeline identity, capability
attenuation, stale disk/layout substitution, transaction preview binding,
installer recovery, accessibility, and known-good boot proof. Label simulation,
hosted VMM, UEFI, provisioned Secure Boot/TPM, physical disk, NVMe, reboot, and
power-cut evidence exactly.

Conformance covers blank/existing GPT, multiple/source-plus-target disks,
insufficient space, corrupt/bad-signature images, interrupted copy/publication/
loader staging, failed first boot, rollback, reinstall, and custom layout on KVM
and WHP where applicable. Fuzz GPT, image, manifest, dependency, plan, locator,
catalog, and servicing parsers only against virtual/simulated devices. Test text
mode without GPU/mouse/network/Store/AI; GUI HiDPI, keyboard, Braille/speech,
resize, GPU fallback, localization and bound prompts; stale disk generations and
READ-only format denial; app authority requests; Store substitution/replay/key
revocation; package-ID spoofing; and operational versus prohibited rollback.

Power-loss fault points include partition-table update, filesystem creation,
store write/verification, generation publication, loader staging, boot selection,
and known-good marking. Every point has a defined recoverability state; durable
claims require physical power-cut evidence.

Digital-rights review: owner trust roots and export/migration remain practical;
the Store cannot create publisher DRM; imaging excludes personal data and secrets
by default; unattended install cannot erase without exact authority; installer
and recovery semantics remain accessible. Hostile-security review: treat package,
catalog, compression, manifest, image, plan, filesystem, firmware, partition,
device identity, and recovery inputs as hostile; prevent dependency/capability
amplification, rollback, parser exhaustion, stale-device substitution, partial
commit, and last-known-good destruction.

Patent review: `TRIGGERED` — package/image containers, content-addressed
deployment, snapshot/export, offline servicing, Store update, A/B boot,
transactional install, and object-shell compositions require mechanism-specific
Canadian review before implementation. See
[`patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).
