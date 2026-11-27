# MRML bootstrap build and packaging toolchain

Current machine-derived package, graph, source, unsafe-boundary, and CI facts
are in the generated [workspace status](../STATUS.md). This document defines
architecture and policy rather than maintaining duplicate package counts.

**Status: PARTIALLY IMPLEMENTED.** `packages/tools/mrml` parses versioned root
and package-local manifests, validates the declared graph, audits exact unusual
build inputs, invokes the pinned upstream compiler through native actions,
selects host VMM adapters, supports UEFI and CUDA build routing, and creates and
verifies the canonical signed package and fixed boot `SystemRelease` formats.
General Store publication, complete image/install workflows, sandboxed build
workers, and production deployment remain incomplete. See the historical
[MIGRATION_INVENTORY.md](MIGRATION_INVENTORY.md) for dated migration evidence.

> Until `mrml-rustc` satisfies the defined production-readiness gate, the MRML
> build tool MUST use upstream Rust tooling for production MRML artifacts.

> Cargo is used only to bootstrap the first-party `mrml` build tool. Once
> `mrml` exists, every normal repository component is built through `mrml`.

## Tool and stage boundaries

The planned first-party `mrml` frontend provides coherent build, test, package,
sign, release, image, install, EFI-export, media, publish, and verify operations.
Syntax is provisional. Cargo-like ergonomics means one manifest, simple commands,
explicit targets/profiles, lockfiles, reproducible inputs, workspaces, and
consistent metadata—not crates.io assumptions, unrestricted scripts, arbitrary
host execution, ambient filesystem/network access, or compatibility quirks.

Terminology is exact. A **Compiler** translates source; **Build Tool** orchestrates
inputs and tools; **Linker/Object Writer** emits formats; **Artifact** is a build
output; **Package** binds artifacts/resources/metadata; **Signature** authenticates
an exact digest; **SystemRelease** is a coherent exact package graph; and
**SystemImage** is its deployable container. Do not call every stage “build.”

Build, package, sign, release, and image remain separate. Packaging existing
artifacts is supported. Unsigned development packages stay visibly unsigned.
Ordinary build workers never require production signing keys: digest/manifests
cross an offline or isolated signing boundary. Manifests never contain raw private
key paths. Publisher, Store-metadata, release, and OS-root key roles remain
separate.

```text
source -> mrml build -> pinned upstream rustc -> linked artifact
  -> ABI/security/build metadata -> mrml package -> exact package digest
  -> isolated mrml sign -> PackageStore / mrml release
  -> mrml image -> SystemImage / installation media
```

Cargo is stage zero and is not a second public build frontend. The repository's
only `Cargo.toml` describes the bootstrap `mrml` binary. A clean checkout uses
pinned Cargo/rustc only for `cargo build --locked`, after which all
normal component build/test commands use `mrml`. The internal Cargo bridge has
been removed and missing native actions fail workspace loading. Removing rustc
or LLVM remains an evidence-driven migration, never an OS-progress prerequisite. Compiler,
object, package, release, and image responsibilities may later be libraries or
tools; avoid premature process/tool proliferation.

The Cargo bootstrap sets the internal `mrml_stage_zero` cfg on Linux and the
pinned Windows GNU/LLVM host. Service-backed administration commands are
excluded only from that dependency-free bootstrap; the Manifest V2 native
self-build resolves their declared package dependencies and includes them.
An explicit `RUSTFLAGS` override used for the Wine stack size must repeat the
stage-zero cfg because Cargo overrides target rustflags rather than merging
them.

Native artifacts are isolated under `target/mrml-native/`. This deliberately
does not use `target/mrml/`, because Cargo's Unix stage-zero executable occupies
the path `target/mrml`; sharing that name makes a clean Linux bootstrap unable
to create its native artifact directory.

Manifest V2 is the only active workspace representation. The bounded
`mrml manifest migrate LEGACY_WORKSPACE NEW_ROOT` command retains a one-way,
read-only V1 parser solely for migration; it writes create-new structured V2
manifests and rejects dependency information loss. `mrml manifest check` also
rejects package manifests that exist beneath the repository but are not admitted
by the root workspace.

The canonical `mrml.lock` format is V2. It records compile dependencies and
runtime interface bindings separately, including the exact interface generation,
fingerprint, provider identity, and target set. It also reports distinct
compile, build-tool, runtime-interface, package, and SystemRelease graph counts
and records the three fixed boot-release roles. The package graph independently
classifies non-test, non-interface-schema compile providers as `STATIC_RUNTIME`,
`BOOT_BOUND`, or `SYSTEM_RELEASE_BOUND`; this does not make a compile edge and a
runtime/package edge the same relationship.

## Compiler modes and readiness

Compiler selection is explicit: `UpstreamRustc`, `MrmlRustcExperimental`, or
`MrmlRustcProduction`. Initially production defaults to a pinned upstream
rustc/Cargo. Experimental `mrml-rustc` remains concurrent for differential,
oracle, conformance, probe, and explicit development builds. Production mode is
unavailable until the exact artifact-profile gate passes.

There is no silent fallback. A requested `mrml-rustc` build fails explicitly on
unsupported semantics instead of rebuilding with rustc. Every artifact/package
records compiler identity/version/mode, target, profile, flags, relevant backend/
linker, and build-tool version. Compiler identity is provenance, not authority;
signature, admission, capability, release, and generation checks still apply.
Policy may temporarily admit honestly labeled mixed-compiler generations.

The public frontend now exposes the first bounded experimental linker route:
`mrml compiler mrml-rustc-experimental link-elf INPUT... --entry NAME -o
OUTPUT [--release]`. Companion `compile-elf`, `link-pe`, and `compile-pe`
operations route supported Rust source or explicit COFF inputs through the same
custom compiler and MRML-owned ELF64 or PE32+ serializer. All build the declared
compiler driver through the native dependency graph; Linux child execution
receives the driver's explicit bounded 32 MiB stack requirement. The mode name is mandatory,
`MrmlRustcProduction` fails as unavailable, and upstream rustc remains the
production compiler/linker for ordinary `mrml build` actions. This is explicit
development-tool integration, not satisfaction of the production profile gate
or permission to fall back.

```text
Complexity impact: LOW
TCB impact: NONE
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

An `mrml-rustc` profile becomes production-eligible only after sufficient Rust
coverage and explicit unsupported diagnostics; correct ownership/move/borrow,
trait/generic, typed CFG/body, target ABI, object/executable, and metadata behavior;
cross-platform differential testing against exact dated upstream oracles;
warnings-denied suites, substantial fuzzing, and no known silent miscompile in
scope; representative real-component/runtime evidence; repeatable builds; and
performance measurement. Full crates.io compatibility is not required.

Application, system-service, driver, kernel, VMM, UEFI, GPU-kernel, library, and
tool profiles promote independently. Promotion records the gate, runs corpus and
real workloads, compares ABI/behavior/performance, enables selected components,
retains upstream-built rollback, and monitors miscompilation. Prefer isolated
libraries/services/apps before drivers, VMM, bootloader, and kernel as evidence
allows. Self-hosting is evidence, not correctness proof. A compare-compilers mode
may compare acceptance, behavior, ABI/object/package metadata, boot result, and
intentional divergence without changing production output.

Production upstream tools are exactly pinned: rustc/Cargo version, target,
LLVM/backend, linker/object tools, and flags. Prefer stable when sufficient;
otherwise pin one exact dated nightly. Never auto-upgrade release toolchains.
Upstream rustc does not make its native/unsafe toolchain memory-safe.

## Manifest, lockfile, profiles, and isolation

Manifest V2's bounded `[isolation]` table records default, minimum, and
supported placements as specified in
[../ISOLATION_PLACEMENT.md](../ISOLATION_PLACEMENT.md). It is policy metadata,
not a compile edge or capability grant. Typed parsing and focused fail-closed
tests are **IMPLEMENTED**. Host-model owner/Total policy resolution and linear
generation-bound service launch preparation are **PARTIALLY IMPLEMENTED**;
runtime activation and capability-authorized placement remain **PLANNED**.

Artifact filenames follow
[../packages/ARTIFACT_EXTENSIONS.md](../packages/ARTIFACT_EXTENSIONS.md): `.mrp`
package, `.mrs` release, `.mrz` system image, `.mri` standalone interface, and
optional `.mrsig` detached signature. Extensions are non-authoritative.

The root `mrml.toml` enumerates bounded package members; each package-local
`mrml.toml` owns its version-3 component, target/profile, action, dependency, and
input-policy declarations. The loader rejects absent, duplicate, escaping, or
oversized members and manifests. The former `MRML.workspace` monolith and
per-package Cargo manifests are removed. During migration the `cargo-package`
field remains a stage-zero compiler identity label for exact upstream
dependency compilation; Cargo package identity is not MRML identity. Every
existing component is classified `MRML_NATIVE`, `HOST_WINDOWS_LINUX`, `COMPILER`,
`UEFI`, `GPU`, `TEST`, `SHARED`, or `BOOTSTRAP_ONLY`. The generic `crates/`
layout has been eliminated for tracked components after `mrml` graph/path parity
was verified. The first eighteen library components, `mrml-math`,
`mrml-percent-encoding`, `mrml-tokenizer`, `mrml-zstd`, `mrml-zim`, `mrml-json`,
`mrml-wikipedia`, `mrml-opus`, `mrml-windows`, `mrml-linux`, and
`mrml-runtime`, `mrml-crypto`, `mrml-tls`, `mrml-http`, `mrml-ssh`,
`mrml-error`, `mrml-terminal-style`, and `mrml-av1`, now live under
`packages/libraries/`; further semantic component homes belong under
`packages/`, with the
bootstrap tool under `packages/tools/mrml` and compiler tooling under a clear compiler
location. Do not create empty speculative directories.

The `MRML_NATIVE` build class now distinguishes a `system-application` package
profile from `system-service`; package kind is not inferred from the common
`x86_64-unknown-uefi` PE/COFF compiler target. The first
`org.mrml.app.isolation-probe` image contains only an ordinary MRML task-system-
call entry and declares both native-process and microVM support. Windows
GNU/LLVM and Arch Linux GNU builds produced the same 3,072-byte image with
SHA-256 `4798770920b2ffffa301242299c4525bff672c7d7f744d4bf62bac6eb36290f5`.
This is cross-build evidence only: neither output was loaded or executed, and
the PE target does not make it a UEFI loader or service.
The first-party signer now names `application` as a distinct
`ApplicationImage` input for both detached statements and canonical signed
bundles. It cannot alias the image as `service`, and executable application
bytes pass the same bounded PE/W^X admission used by the artifact layer.

The dependency-free `mrml-rustc` core lives at `packages/compiler/core`, and its
separate driver lives at `packages/compiler/driver`.
`mrml-git` now lives at `packages/tools/git`; its host-tool classification and Cargo
bridge remain unchanged.
`mrml-tools` now lives at `packages/tools/host`; its input-policy counts, feature
behavior, and Cargo bridge remain unchanged.

The first explicit `rust-action` nodes are the dependency-free `mrml-math`,
`mrml-windows`, and `mrml-linux` libraries; each binds its crate name, `lib`
type, and repository-relative source root. Native build emits a deterministic
rlib and native test compiles and executes the inline test harness directly
through the pinned rustc. Windows execution covers math and the Windows platform
leaf; Arch Linux WSL2 execution covers math and the Linux platform leaf. This is
hosted WSL2 evidence, not bare-metal Linux or KVM evidence. Action paths and crate
names are validated before invocation;
the frontend resolves the exact dated Windows GNU/LLVM or Linux GNU toolchain
through rustup rather than inheriting the caller's active default. There is no
Cargo fallback: all nodes now have exact actions, and workspace loading fails if
any action is missing.

`mrml-runtime` is the first dependent native node. Its action declares the
package identity, Rust crate name, and target family for each platform extern:
only `mrml_windows` is built/wired on Windows and only `mrml_linux` on Linux.
The native planner recursively compiles declared extern providers first, rejects
missing native actions and target mismatches, and passes exact deterministic rlib
paths through `--extern`. Windows passed 38 runtime tests and Arch Linux WSL2
passed 37; the one-test difference is the Windows-only argument parser.

The next featureless layer is also native: `mrml-percent-encoding`,
`mrml-tokenizer`, `mrml-zstd`, `mrml-zim`, `mrml-json`, `mrml-wikipedia`,
`mrml-error`, and `mrml-terminal-style`. Rustc receives the single bounded
target/profile artifact directory as its transitive dependency search path and
each direct extern remains bound to an exact rlib. Both Windows GNU/LLVM and
Arch Linux WSL2 passed all 31 inline tests across this layer.

Native actions can now declare integration-test targets, whether each target
requires the component's own rlib, and a bounded test-process stack. The loader
fails when declared `:test` outputs and native test actions differ. This migrated
the dependency-free `mrml-rustc` core without omitting either integration suite:
Windows and Arch Linux WSL2 each pass 420 inline tests, 10 conformance tests, and
335 nightly-replacement tests. Linux applies the declared stack with `setrlimit`
before exec so panic-abort child tests inherit it; Windows records the same stack
in linker metadata.

Native actions also declare example source/output pairs. Test mode compiles each
example as its real binary crate and fails if example declarations drift from
the component's `:example` outputs. `mrml-opus` uses this path for
`inspect_range`, `opus_range_diff`, and `rfc8251_audit`; both hosts pass 179
inline tests and link all three examples. Native-library requirements such as
the differential example's system `libopus` remain explicit host prerequisites,
not silently skipped outputs.

Each native Rust action with declared component features must bind an exact
feature set, including an explicitly empty set. Rustc receives selected feature
cfgs plus the complete allowed feature universe, and optional externs are active
only when both their target family and feature gate match. `mrml-av1` exercises
this with an empty default set: `mrml-runtime` is active, while the `nvidia`
Windows/Linux externs are not. Its library and declared example build on both
hosts; a 32 MiB executable-stack policy leaves the same two source failures as
the pinned Cargo baseline rather than sixteen additional stack failures.

An extern may also declare a bounded consumer-profile-to-provider-profile
mapping. Both names and every overlapping target are validated before planning;
an undeclared consumer profile retains the extern's explicit base provider
profile. The selected provider profile remains part of recursive build identity
and the exact artifact name, preventing feature-forwarded dependencies from
aliasing their default artifacts.

Generated PTX is evaluated at the native component where it is declared, even
when that component is reached recursively through a provider profile. The PTX
declaration includes a validated default GPU architecture; an explicit
`--gpu-arch` overrides it for the complete build graph. This removes hidden
ordering on an earlier top-level CUDA build while keeping `OUT_DIR`, feature,
source, output, target, and architecture inputs exact.

`mrml-crypto` exercises the enabled side of the same rule. Its action records
the resolved effective default set as `runtime`, which activates exactly the
optional runtime extern; both supported hosts pass all 27 inline tests directly.

`mrml-tls` is the next featureless consumer and binds exact crypto/runtime rlibs.
Both hosts pass its 11 inline tests directly; absent environment-selected live
peers and certificate fixtures remain absent evidence, not silently claimed
coverage.

An action may explicitly declare no primary library. Such a component must have
no `:lib` output, cannot satisfy another action's extern edge, and still requires
exact binary output/source/self-binding records. This migrates the bin-only
compiler driver: both hosts build `mrml-rustc` and pass its two inline tests.

Feature selection is per target, exhaustive, and non-overlapping. The loader
rejects an uncovered or multiply covered target. Native library compilation now
supports the pinned `x86_64-unknown-none` target; the crypto action demonstrates
an empty `MRML_NATIVE` feature set with no runtime extern while preserving the
host `runtime` profile.

Cross-target test execution is never implicit. An action may enumerate approved
Windows/Linux host-test families; test mode first builds the requested target,
then creates a fresh host dependency graph and runs only the host harness. The
kernel uses this path with a 64 MiB stack: both hosts cross-build the native rlib
and pass 474 host tests. This is not target execution evidence.

`mrml-http` is the next featureless consumer and binds exact runtime/TLS rlibs.
Both hosts pass its three inline tests directly; absent live URL/range inputs
remain absent network evidence.

`mrml-ssh` directly binds exact crypto/runtime rlibs. Both hosts pass its 23
inline tests, including loopback transport; live remotes and external signing
remain outside this evidence.

Native binary records bind the public output name separately from the Rust crate
name, source, and optional self-library extern. Build mode emits the real binary;
test mode also compiles and runs that binary source as a test harness. Explicit
compile-time environment records replace Cargo-provided ambient values.
`mrml-git` exercises the complete path: both hosts build its library and binary,
with dated focused outcomes recorded in
[MIGRATION_INVENTORY.md](MIGRATION_INVENTORY.md) rather than treating a volatile
test count as part of the build contract.

`mrml-tools` combines exact feature, compile-environment, universal-extern, and
target-extern records. Linux passes 32 direct tests; Windows reproduces the
existing installed-Edge DevTools failure after 31 passes. Neither result alone
establishes physical browser, desktop/audio-route, or accessibility-hardware
coverage.

Rust crate identity, MRML package identity, and stable MRML interface identity
are distinct. The runtime component model is specified in
[../packages/COMPONENT_INTERFACES.md](../packages/COMPONENT_INTERFACES.md).
`mrml` must resolve compile-time crate edges separately from `STATIC`,
`DYNAMIC_INTERFACE`, `SERVICE_INTERFACE`, and `BUILD_ONLY` package edges. Cargo's
graph never becomes the permanent runtime resolver.

`mrml doctor` now validates the native graph without invoking Cargo: component
and bridge-package identities are unique, targets and outputs are bounded,
every declared local dependency resolves, and self-dependencies and cycles fail
with structured diagnostics. `mrml audit` emits dependencies, features,
outputs, custom builds, proc macros, native links, compile-time
environment reads, included files, and external-command sites. The bounded
parser validates native dependency/feature/output declarations. The lexical scan
validates per-component input policies and fails closed on count drift. A policy
change still requires human review because equal counts do not establish equal
commands, paths, libraries, or environment semantics. See
[BRIDGE_INVENTORY.md](BRIDGE_INVENTORY.md).

A deterministic unit-level mutation corpus applies stepped truncations and 512
byte flips to a representative Manifest V2 document containing targets,
features, dependencies, interfaces, artifacts, tests, and policy. Every accepted
mutation must canonicalize and reparse identically. This exercises bounded parser
and formatter behavior; it is not an exhaustive semantic-validator fuzzing claim.

A canonical package-local `mrml.toml` binds package identity/version/class,
profile/compiler mode, target slices, capability requests, dependencies/interfaces,
and resources. It grants no authority. An exact lockfile binds dependency identity,
version, digest, source, and relevant compiler/tool inputs; system graphs are
especially strict.

For versioned components, manifests additionally distinguish provided and
required interface identities/major generations, dynamic binding, exact in-
process or isolated-service form, and update policy. Runtime locks retain the
exact provider package, interface generation, fingerprint, target set, and form
selected for each `InterfaceBinding`; consumer/provider form mismatch fails
closed. Bootloader and recovery manifests cannot require either ordinary dynamic
form. The first canonical schema generator is
implemented as `mrml interface generate-rust SCHEMA OUTPUT`. It bounds input at
64 KiB, exclusively creates output, computes a SHA3-256 fingerprint, and emits
deterministic pointer-free Rust types. Schema version 1 remains frozen to zero or
one result field. Schema version 2 adds only bounded, uniquely named multi-field
response records; version-2 borrowed views remain request-only, capability-transfer policy
is unchanged, and existing version-1 generation and fingerprint output remains
byte-identical. The Zstd ABI-3 schema and checked-in generated output are the first
golden fixture. The generation-1 GUI surface schema is now a second checked-in
fixture. Its fingerprinted fixed request/state/response codec is a separate
interface package and the kernel policy-model crate consumes it statically for
bounded admission tests. That compile edge is not a dynamic provider binding,
Rust ABI promise, compositor execution, or runtime capability grant. Native
call lowering, conformance execution, ABI diffs, and
`mrml-rustc` emission remain **PLANNED**. A bounded hosted ABI-3 byte-call
adapter exercises the generated request/response contract for Zstd and ZIM,
but is not native loader dispatch; neither Rust's native ABI nor a package name
is the stable interface.

Filesystem interface generation 2 now uses the bounded response record to return
mount lifecycle identity and root-object identity separately. It does not grant
a root capability or reinterpret generation-1 mount responses; generation 1
remains checked in as immutable history.

Filesystem interface generation 3 adds one fixed provider-open operation without
changing generation 1 or 2. `mrml interface generate-rust` deterministically
emits its pointer-free bindings and SHA3-256 fingerprint
`cdf4ff47c6f987d7cf392eb641973f81de2b90ee8aa053b955265887823ae2dc`.

- Complexity impact: **LOW**
- TCB impact: **NONE**
- New parser boundary: **NO** (bounded extension of the existing schema parser)
- New authority model: **NO**

Patent review: `NOT_TRIGGERED` — parsing bounded named result fields and emitting
a deterministic record type are conventional schema/code-generation mechanisms.
See `docs/patents/REVIEW_LOG.md`.

Profiles define compiler restrictions, ABI, unsafe/FFI policy, format, metadata,
signing, and admission:

- application: safe native Rust, stable MRML service ABI, capability requests;
- system service: broader interfaces but isolated and explicitly capable;
- driver: unsafe, assembly, MMIO, DMA, hardware ABI, and firmware inventory;
- kernel: strict unsafe, assembly, naked, architecture, privileged instruction, and boot-ABI metadata;
- VMM: virtualization operations, guest parsers/devices, unsafe and assembly;
- UEFI bootloader: bounded PE/COFF EFI output and boot metadata;
- GPU kernel, library, and tool: class-specific feature/admission rules.

Build profiles never grant runtime privilege. Long term, arbitrary Cargo
`build.rs` execution yields to declarative metadata, explicit generators, and
capability-constrained reproducible helpers. Bootstrap build-script authority is
documented host risk. Planned sandboxes receive neither the whole filesystem,
credentials, network, SSH keys, nor signing keys by default; this is not current
implementation.

Release dependencies remain small, audited, pinned, and recorded by source,
version, checksum, license, and relevant unsafe/FFI. Cargo dependencies are
acceptable during bootstrap under lockfiles; convenience never justifies large
early-boot/TCB graphs.

## UEFI and package construction

```text
source -> mrml build --profile uefi-bootloader --target x86_64-uefi
  -> pinned upstream rustc/linker -> PE/COFF BOOTX64.EFI
  -> mrml package -> org.mrml.system.bootloader package
  -> EFI/x86_64/BOOTX64.EFI + META manifest/digests/security metadata/signatures
```

Future AArch64 emits `BOOTAA64.EFI`. `.efi` is the firmware-consumable artifact;
the signed package is distribution. UEFI understands neither packages nor Cargo.
EFI export/inspection remains straightforward and separate from signing.

One logical package may combine common resources with requested x86_64, AArch64,
and RISC-V64 slices. Developers build one local architecture; releases build all
supported slices. Identity stays stable. Wrong, missing, stale, or unauthorized
slices fail. `mrml package --artifact BOOTX64.EFI` supports upstream-built input.

Package output is a typed object containing ID, version/class, slices, digest,
capability requests, compiler provenance, path, and signature state. Package,
release, and image verification return structured format/digest/signature/slice/
compiler/dependency/capability/graph results before boot. Store, installer,
recovery, and tools share canonical parsers where possible. The reduced boot-safe
parser is differential-tested against userspace semantics.

Kernel/VMM tests exact-match slice digests, reject wrong architecture/stale
generation, prove exact combination binding, and admit only authorized slices.
UEFI testing builds, packages/extracts, and boots `BOOTX64.EFI` under QEMU with an
expected signed probe before any exact physical-hardware claim.
The canonical `kvm_smp_probe` and `whp_smp_probe` feature profiles now make the
two hosted SMP kernel variants reproducible through `mrml build`; both select
the common SMP proof, explicit emulated AP timing, and startup trace, while the
WHP profile additionally selects its handshake transport. The exact
`MRML_EMULATED_TSC_HZ` compile input remains explicit and receipt-bound rather
than an ambient build variable.
The canonical `kvm_component_service_smp_probe` and
`whp_component_service_smp_probe` profiles compose that SMP contract with the
existing signed component-service feature set. The WHP profile alone adds the
WHP AP handshake. Both keep emulated timing and startup tracing explicit and
receipt-bound; neither permits compiler fallback or changes package/interface
identity.

The production-shaped recovery-loop images now also have explicit canonical
profiles. `block_service_loop` selects only `block-service-loop` for
`org.mrml.system.service-image` on `MRML_NATIVE`, while
`block_service_probe` selects `service-probe` plus `block-service-probe` for
`org.mrml.system.bootloader` on UEFI. The default images remain unchanged.
`mrml manifest check`, the profile-specific release builds, and regenerated
`mrml.lock` must agree before these images are used as evidence; an undeclared
raw Rust feature invocation is not a reproducible MRML build profile.

The authenticated package-derived positive path has executed under QEMU/EDK2
with the raw trace `c8 b0 b2 b0 b2 c9 b0 b2 b2 a1 a2 a3 a4 a5 a6 a7 a8 b1
b2 b3`: the release, bootloader/configuration packages, exact kernel package,
inner signed kernel, and established kernel path all completed. Shared parser
tests reject modified package bytes, wrong release digest, bad signature,
malformed length, truncation, wrong architecture/class, and incompatible release
version. A deterministic bounded mutation corpus now exercises 512 byte flips
across a signed two-payload package plus stepped truncations, requiring signed
parse and compressed/uncompressed decode paths to remain within their declared
bounds. Every accepted mutation must produce identical host and boot-profile
identity, payload count, selection, decode acceptance, and decoded bytes. This is
unit-level differential mutation evidence, not an exhaustive fuzzer campaign.
`mrml package boot-media-create` now constructs the bounded GPT/FAT32
ESP from the extracted loader, three exact boot packages, authenticated
`SystemRelease`, and early service object; `mrml package qemu-boot` launches an explicitly selected
QEMU/OVMF pair and exact-matches the boot trace. A fresh media construction
reproduced the complete trace above. A separate image with one modified kernel-
package payload byte produced two identical fail-closed attempts ending after
`c8 b0 b2 b0 b2 c9`, before kernel-package admission. Eight additional images
used distinct one-time package and release keys to bind a wrong release digest,
bad package signature, unsupported architecture, malformed payload offset,
truncated compressed payload, wrong package class, missing required package,
and incompatible package generation. Each reported
`QEMU_UEFI_BOOT_REJECT_PASS`; the decompression case reached the additional
package-selection marker `b0`, while the other cases stopped before it. These
are QEMU/OVMF firmware results, not physical-firmware evidence.

The QEMU gate now accepts only the explicit accelerators `tcg`, `whpx`, or
`kvm`, defaults to `tcg`, and includes the selected accelerator in its
structured result. On 2026-08-25, the byte-identical package-derived image and
EDK2 firmware completed the same 20-byte trace on Windows through both TCG and
WHPX and under Arch Linux/WSL2 through QEMU/KVM. These are QEMU/EDK2
firmware-media results using the named accelerators; they are not evidence that
the native MRML WHP or KVM runner executes firmware, and they are not physical-
firmware results.

The gate decodes only ordered canonical trace prefixes and reports the furthest
bounded stage in both success and failure results: `firmware-launched`,
`efi-loader-entered`, `generation-manifest-loaded`, `early-packages-verified`,
`kernel-package-verified`, `kernel-image-verified`, or
`kernel-entry-reached`. Unknown or reordered bytes cannot promote a stage. The
fresh WHPX positive run reported `stage=kernel-entry-reached`; these host-side
labels diagnose the test path and are not authenticated evidence or remote
attestation.

The WHP and KVM runners both consume the byte-identical canonical signed kernel
package through one `no_std` package-format admission function. That shared
decision authenticates the exact package trust root and identity, enforces the
nonzero version floor and payload bound, selects/decompresses its x86-64 kernel
payload, and rejects malformed input before either backend constructs native
guest launch state. Their release-bound `boot` form additionally parses the same
signed `SYSTEM.RELEASE` carried by the QEMU image, authenticates its explicitly
selected release key, and requires the kernel record's version and SHA3-512
package digest to match the exact package before payload selection. A missing,
substituted, malformed, wrongly signed, or wrong-key release fails before native
guest preparation. The focused `--verify-boot-artifacts` mode exercises that
same decision without launching a guest; on 2026-08-25 both optimized runners
accepted the exact release/package pair and decoded 2,232,432 kernel bytes. The
earlier five-argument direct-package form remains as a
temporary differential path. The shared package's SHA-256 transport checksum in the refreshed
probe was `30ded12b7c772d88ec442b62a0afb2dd0347f100f2e09bbe037f1acae483f1e4`.
Structured `mrml package verify` output now reports an exact size breakdown and
single-sample parse/signature/decode timings. A 2026-08-25 optimized Windows
measurement of that package reported 2,336,389 total bytes: 2,237,552 raw
payload bytes, 2,237,615 stored boot-profile Zstd bytes, 470 format-metadata
bytes, and 98,304 Lamport public-key/signature bytes. The constrained raw-block
Zstd representation expanded this already-built PE by 63 bytes. The same run
measured 9,048 microseconds for parse/signature verification and 9,504
microseconds for payload decoding, 18,553 microseconds total. These are one
controlled host sample and exact artifact accounting, not portable performance
or compression-ratio claims.
The same release-bound package set reached the authenticated framebuffer marker
and terminal halt under optimized nested-KVM and WHP runners on 2026-08-25.
WHP's ordinary `boot`
preparation deliberately omits emulated xAPIC
state so the terminal HLT remains observable; specialized timer/SMP/device
probes retain their existing APIC policy. The native runners do not currently
execute OVMF or consume the GPT/FAT boot image. They now have a bounded
firmware-entry primitive which maps 64 MiB of low RAM and one exact page-aligned
firmware image immediately below 4 GiB, programs `F000:FFF0`, and
returns the first strictly decoded backend exit. Live controlled 4 KiB firmware
stubs produced the same port-I/O proof on WHP and nested KVM on 2026-08-25.
This proves native reset-vector execution, not UEFI services or package boot.
WHP applies second-level RW/NX low-RAM and RX firmware permissions; KVM makes the
firmware slot guest-read-only, but its memory-slot API cannot express NX, so this
probe does not claim equivalent second-level execute permission enforcement.
Therefore shared package admission, native execution, and QEMU/EDK2 over WHPX
are implemented and live-tested. QEMU/EDK2 over KVM has independently completed
the same package-image trace. Native-runner OVMF/device/boot-media integration
remains **PLANNED**. Do not call either the reset-vector probe or native direct-
launch probe a firmware boot.

## Releases, images, install, and publication

`mrml release create` now consumes the exact signed bootloader, kernel, and
configuration `.mrp` packages plus a one-use signing key and emits the bounded
signed boot `SystemRelease` `.mrs`; `mrml release verify` checks its signature
against an explicit public root. Separately, the build library can encode a
bounded general `SystemRelease` containing the exact canonical `MRMLSG2`
generation and `MRMLIC1` interface catalog, and deployment verifies its bytes,
signature, and caller-policy-selected signer identity before staging.
`mrml release system-create` now writes this general `.mrs` from explicit
canonical record files and consumes its one-use private key; `system-verify`
requires an explicit public root. This is a public bounded composer for already
resolved records, not Store graph resolution or signing-key custody.
`mrml release runtime-inventory-create` now decodes one canonical `MRMLSG2`,
requires every exact member to resolve to a Manifest V2 package with explicit
runtime classification, and emits a self-verified `MRMLRI1`. Manifest metadata
does not grant authority, and the command cannot omit a generation member or
substitute its version or digest. `mrml release system-create` accepts that
inventory as an optional third canonical record and emits signed general
SystemRelease v2; omitting it intentionally emits the backward-compatible v1.
Both versions remain parseable, but only v2 exposes an authenticated runtime
inventory for later Total-mode admission.
The optimized WHP/KVM runners also expose `component-release-inputs`: after
verifying the exact kernel, ZIM consumer, Zstd provider, and public roots, each
writes its canonical generation/catalog bytes for signing. The two backends
produced byte-identical 201/207-byte records from current artifacts; the public
frontend consumed a one-use key to sign them and both runners consumed the same
resulting `.mrs`.
General Store release composition remains **PLANNED**. `mrml image` will combine
a release with content-addressed packages, boot/recovery, profile, and optional
content into the canonical Zstd image
without needless duplication. Media tooling follows
[DEPLOYMENT.md](../DEPLOYMENT.md).

Local development remains build -> package -> visible owner/developer admission
-> supervised exact component replacement where allowed, never untracked system-
directory copying. Dev/release profiles distinguish iteration from locked,
deterministic, warnings/security-clean output without local substitutions.

`mrml publish` verifies completeness, uploads to configured neutral transport,
checks the remote digest, and publishes signed metadata only after artifact
availability. GitHub Pages/Releases may transport initial catalog/artifacts but
are not trust. Publishing does not hold OS-root keys. Native shell and future GUI
call the same service libraries and receive typed objects rather than scraping CLI
text.

## Reproducibility and supply chain

Release inputs record source revision, lockfile, compiler, target, profile,
environment inputs, linker, and tool version. Package ID/version, build ID, and
content digest remain distinct. Claim reproducibility only after independent clean
rebuilds match canonical digests; Windows/Linux byte identity is a separate
measured claim, while first-milestone semantic metadata must agree.

Collect only supported compiler/build security metadata. Initially source/build
analysis inventories unsafe Rust, FFI, assembly, naked functions, privileged
intrinsics, MMIO/DMA, and firmware. Do not invent guarantees upstream rustc does
not provide. Mature `mrml-rustc` may later reduce the TCB and emit stronger MRML
metadata; those benefits are future claims.

Production packages plan a machine-readable SBOM with component/dependency
versions, digests, source provenance, and licenses, plus authenticated provenance
binding source, builder/tool, compiler, lock, and artifact digest. Patent/license
markers are reports, not automated legal conclusions. Do not claim supply-chain
provenance before implementation.

Build semantics are equivalent on Windows and Linux despite host-specific tools
beneath `mrml`. Cross-compilation is normal. Manifests never encode shell-specific
PowerShell-versus-Bash behavior as package meaning.

## Results, tests, and roadmap

Supported hosts are Windows and Linux. Explicit target families are MRML native,
Windows, Linux, UEFI, and CUDA; future native GPU, AArch64, and RISC-V64 do not
become current support claims. Host and target are distinct. Target definitions
select ABI, object format, linker/runtime assumptions, profiles, and adapters;
Windows excludes KVM and selects WHP, Linux excludes WHP and selects KVM. CUDA
is lazy compatibility/oracle tooling, never the native MRML GPU architecture or
runtime authority.

`mrml build` returns typed `BuildResult` package ID, profile, target, compiler,
artifacts, warnings, and test status. `mrml test` orchestrates unit, integration,
backend, VM, architecture, and profile tests without assuming native host
execution. Human text is a view. Shell concepts such as `Build-Package`,
`Get-BuildResult`, `New-SystemRelease`, and `Export-SystemImage` share APIs.

Bootstrap order is implemented tool and inventory; locked Cargo/rustc bridge;
semantic source moves and path updates; profiles/targets; EFI/VMM/compiler graph;
CUDA scaffold; package command; then
export; package construction/verification; isolated signing; release/image;
publication and typed shell results; sandbox/SBOM/provenance/cross-host evidence;
experimental `mrml-rustc`; per-profile promotion; then reduction of external
tools where justified.

The first Windows/Linux milestone parses one manifest, builds one `no_std` test
artifact and `BOOTX64.EFI` with pinned upstream tools, packages/verifies both with
exact metadata/digests, constructs a simple release, and preserves identical
semantic metadata. It does not require `mrml-rustc`. Later milestones boot the
extracted EFI package under QEMU, compare compilers without promotion, rebuild
twice cleanly, and identify nondeterministic inputs.

This lane must not derail the OS foundation or redirect `mrml-rustc` from typed
place/CFG/ownership/borrowing compiler priorities.

Stage zero is pinned Cargo/rustc -> `mrml`. Normal build is `mrml` -> upstream
rustc initially -> selected MRML/Windows/Linux/UEFI/CUDA graph. Future build is
`mrml` -> profile-approved `mrml-rustc` -> native MRML/GPU targets. Official
releases use `mrml` even while its private bridge invokes Cargo. Do not maintain
meaningfully divergent Cargo and `mrml` release instructions.

Digital-rights review: owner builds/keys remain viable; no official Store or
compiler is mandatory; metadata does not authorize; first-party tools have no
hidden privilege. Hostile-security review: treat manifests, locks, dependencies,
scripts, compilers, artifacts, packages, provenance, parsers, and transports as
hostile; remove ambient credentials/keys/network, differential-test parsers, and
make fallback or authority amplification impossible to hide.

**PARTIALLY IMPLEMENTED runtime handoff prerequisite:** the build tool's linear
`PreparedGenerationBoundServiceLaunch` now emits the canonical fixed 344-byte
component-service record defined by the shared package-format library. Package,
interface, placement, fingerprint, generation, and artifact fields are derived
from the already resolved immutable graph. The build tool streams the complete
canonical `MRMLSG2` package set into the same SHA3-512 generation digest used
by hosted WHP/KVM admission. A focused canonical builder now derives bounded
`MRMLIC1` requirements/providers directly from Manifest V2 `[[requires]]`,
`[[provides]]`, and `[isolation].supported` records, rejects unknown bindings,
forms, placements, generations, and fingerprints, and produces identical bytes
for reordered manifest inputs. The existing resolved launch also emits a
single-binding catalog and binds its independent SHA3-512 digest into activation
and the handoff. The focused WHP/KVM runners now embed the repository's real ZIM
and Zstd manifests as declared build inputs and use a shared allocation-free
extractor for those already canonicalized fields; they no longer duplicate ABI,
fingerprint, or placement-form constants. General workspace/release catalog
artifact construction and delivery remain **PLANNED**. Caller-supplied kernel object IDs
and policy generation remain identity inputs and grant no capability. The
kernel and focused WHP/KVM runners decode the same record. This does not make
the build tool a runtime authority or implement persistent `DeploymentService`
activation.

Dynamic requirements remain exactly-one by default. A consumer may explicitly
declare `multiplicity = "many"`; the workspace resolver then records every exact
generation/fingerprint/binding/form provider as a separate canonical lock edge,
ordered by provider package identity. Missing providers still fail, an omitted
or `one` multiplicity still rejects ambiguity, and neither workspace discovery
order nor runtime device discovery chooses release membership. The storage
service uses this bounded form to compose AHCI, NVMe, and classic IDE providers.

Patent review: `TRIGGERED` — package/release/image construction, content identity,
provenance, parser reuse/differential validation, and publication compositions
require mechanism-specific Canadian review before implementation. See
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
