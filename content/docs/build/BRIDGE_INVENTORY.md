# Cargo bridge inventory

> **Historical migration ledger.** Counts and host results below describe the
> dated migration steps recorded at the time. They are intentionally frozen and
> are not current workspace totals. See the generated
> [workspace status](../STATUS.md) for current machine-readable facts.

**Recorded status on 2026-08-25: IMPLEMENTED NATIVE GRAPH / CLEAN-SOURCE
BOOTSTRAP ONLY.** The
dependency-free `mrml` frontend resolves version-3 declarations from root and
package-local `mrml.toml` manifests
without invoking Cargo metadata. It rejects duplicate MRML/path/Cargo-stage
identities while loading, then rejects missing dependencies, self-dependencies,
cycles, unknown targets, and empty output sets with bounded structured errors.
Its deterministic dependency-first order is repository-owned. Input policies
are compared with the bounded source scan. All components have native actions;
Cargo is used only for locked clean-source bootstrap of `mrml`. Cargo identity
is not MRML package identity or runtime authority.

Run the human or stable structured inventory with the pinned toolchain:

```text
mrml audit
mrml audit --output structured
```

The 2026-08-25 Windows gnullvm result is:

```text
45 components
127 deduplicated local dependency records
72 feature names
68 declared outputs
0 custom build targets
0 procedural-macro targets
12 native-link source sites
31 compile-time environment source sites
1 included-file source site
48 external-command source sites
```

The structured output emits every native component, dependency list, feature
list, output declaration, and source-input location before its final summary. Source
scanning is bounded to declared component roots, rejects symlinks, caps paths and
file sizes, and reports exact repository-relative file and line locations.

## Exact exceptional mechanisms

- `mrml-tensor` invokes the pinned rustc CUDA target through its native action
  and materializes the PTX consumed through `include_bytes!`. The obsolete Cargo
  custom-build target has been deleted.
- There are no procedural-macro targets.
- Native link attributes occur only in the Windows/Linux platform layers, KVM,
  WHP, `mrml-math`, the hosted kernel benchmark, and the Opus differential
  example. They are host/compatibility inputs, not MRML-native application ABI.
- Compile-time environment and external-command sites are exact per-node native
  declarations and remain explicit review inputs.

This inventory is lexical risk discovery, not proof that arbitrary macro output
cannot create another input. The native resolver covers declared graph facts;
the source scan identifies known direct sites. Both must pass before a direct-
rustc or build-input change.

The internal Cargo bridge is removed. All 45 components, including `mrml`
itself, have exact native actions and workspace loading fails on any missing
action. Fresh `cargo build --locked` is the sole stage-zero use; both
exact hosts then pass doctor/audit, native self-build, and all 12 native
self-tests with no `cargo-transition` result. This completes graph migration,
not the still-planned package/release/image work.

## Next gate

All 45 tracked components now live in semantic `apps/`, `compiler/`, `packages/`,
`services/`, `system/`, `tests/`, or `tools/` homes; no tracked component remains
under generic `crates/`. The next gate makes source roots, crate types, editions,
target cfgs, feature activation, extern names/artifacts, build actions, compiler
flags, and lock/digest inputs exact enough for direct rustc. The dependency-free
`mrml-math`, `mrml-windows`, and `mrml-linux` leaves are the first exact native
build/test actions and do not invoke Cargo. Windows execution covers math and
the Windows leaf; Arch Linux WSL2 execution covers math and the Linux leaf.
This does not establish bare-metal Linux or KVM parity. Cargo is now confined to
clean-source stage-zero bootstrap after Windows/Linux equivalence was
demonstrated. Treat input-policy changes as explicit review items, never
automatically accepted count updates.

`mrml-runtime` is the first dependent native action. Its two declared package/
crate extern bindings are target-scoped, dependency-first, and wired by exact
native artifact path. Windows passed 38 direct runtime tests; Arch Linux WSL2
passed 37 direct runtime tests. No inactive platform rlib is supplied to rustc.

Eight featureless runtime consumers now use the same native path:
`mrml-percent-encoding`, `mrml-tokenizer`, `mrml-zstd`, `mrml-zim`, `mrml-json`,
`mrml-wikipedia`, `mrml-error`, and `mrml-terminal-style`. Each host passed 31
direct tests across the layer. Twelve of 42 components now have explicit native
actions; 30 remain `cargo-transition`.

The dependency-free `mrml-rustc` core is the first exact multi-output native
action. Its two integration-test sources and self-extern requirement are explicit
and checked against the declared `:test` outputs. A bounded 32 MiB test-stack
policy is linked on Windows and applied to the Linux child process limit before
exec. Both hosts pass 420 inline, 10 conformance, and 335 nightly-replacement
tests. Thirteen components are native; 29 remain transitional.

Native example outputs are now explicit and checked against every declared
`:example` output. `mrml-opus` directly builds its library, runs 179 inline
tests, and links all three examples on Windows and Arch Linux WSL2. The Linux
C-reference differential example requires the distribution's `opus` package;
the first run failed closed when `-lopus` was absent and passed after the explicit
test dependency was installed. Fourteen components are native; 28 remain
transitional.

Featureful native actions now partition every declared target across exact,
non-overlapping feature sets. `mrml-crypto` selects `runtime` on Windows/Linux
and the empty set on `MRML_NATIVE`; both host toolchains cross-build the latter
for `x86_64-unknown-none` without activating `mrml-runtime`.

Cross-target actions may declare an exact set of approved host-test families.
Without that declaration, test mode refuses to execute a non-host artifact.
Named provider profiles are explicit on extern edges, have independently
validated target/feature coverage, and produce profile-qualified artifacts and
build-cache identities. `mrml-kernel` binds crypto's empty `core` profile for
both target and host graphs; it cannot reuse crypto's host-default `runtime`
artifact. The kernel cross-builds for `x86_64-unknown-none` on both hosts, then
uses a fresh host dependency graph and 64 MiB harness for 474 passing tests.
Twenty-three components are native; 19 remain transitional.

Target-only native providers may now declare exact Windows/Linux host-build
projections. They remain unavailable as public host targets, but approved
dependents can compile the same source graph for a hosted harness. Storage uses
the kernel projection and crypto's `core` provider profile, cross-builds for
`x86_64-unknown-none`, and passes all 121 tests on Windows and Arch Linux WSL2.
Twenty-four components are native; 18 remain transitional.

`mrml-config` directly binds crypto's `core` profile plus the native kernel and
storage artifacts. Its `x86_64-unknown-none` cross-build and all 31 projected
host tests pass on Windows and Arch Linux WSL2. Twenty-five components are
native; 17 remain transitional.

An allowlisted compiler-target variant now propagates through one complete
native dependency graph and receives an isolated artifact directory. This keeps
the service image's semantic family `MRML_NATIVE` while compiling it and its
dependencies for `x86_64-unknown-uefi`. Windows and Arch Linux WSL2 produce a
PE32+ EFI application in debug and release profiles. Same-host repeated hashes
are stable; cross-host hashes differ and are not claimed reproducible. Twenty-
six components are native; 16 remain transitional.

`mrml-kernel-bench` directly compiles against kernel and runtime on both hosts.
The harness registers 14 tests on Windows and 13 on Linux, all deliberately
ignored manual performance gates. No performance or physical-core claim follows.
Twenty-seven components are native; 15 remain transitional.

Providers may now explicitly project to a non-host family without advertising
that family as a public component target. Compile inputs also distinguish a
fixed value from required absence and remove inherited variables before rustc.
Kernel-image uses UEFI projections of kernel and crypto-core, selects only
`kernel-image`, and emits a PE32+ EFI application on both hosts. Poisoned values
for its four absent `MRML_*` inputs leave same-host hashes unchanged. Twenty-
eight components are native; 14 remain transitional.

Binary declarations may now require an exact target family and selected feature.
The UEFI package's library remains host-buildable, while `mrml-loader` exists
only for UEFI with `uefi-image`; explicit UEFI selectors are preserved. Windows
and Arch Linux WSL2 emit PE32+ EFI loaders and pass all 24 host-projected tests.
A Windows probe poisoning all 21 declared absent inputs leaves the loader hash
unchanged. Twenty-nine components are native; 13 remain transitional. No TPM or
firmware hardware was exercised.

Profile-qualified artifacts now also receive stable distinct rustc metadata.
That closes the mixed-profile identity gap exposed when `mrml-sign` linked
host-default crypto directly and crypto-core transitively through kernel. The
signing binary builds and passes all eight temporary-file tests on Windows and
Arch Linux WSL2. Thirty components are native; 12 remain transitional. No real
key or signing deployment was touched.

Extern declarations can now mark a direct edge test-only. `mrml-kvm` uses that
scope for its crypto-core dev dependency; production still receives crypto-core
transitively through kernel. The library builds on Arch Linux WSL2 and passes 18
tests with one manual mapping-performance gate ignored. `/dev/kvm` was usable,
so conditional API and signed-guest probes exercised nested KVM. Thirty-one
components are native; 11 remain transitional. No bare-metal or physical KVM
hardware was verified.

The same scoped-extern mechanism now describes `mrml-whp`: kernel and runtime
are production dependencies, while crypto-core is a direct dev dependency only.
The pinned Windows gnullvm native and Cargo harnesses each pass 22 tests with one
manual mapping-performance gate ignored. Running the ignored gate separately
completed 10,000 live WHP map/revoke iterations. The pinned Linux frontend also
passes its tests, Clippy, doctor, and audit, but correctly skips the Windows-only
WHP action. Thirty-two components are native; 10 remain transitional. This is
hosted WHP API/mapping evidence, not VTL1, TPM, IOMMU, bare-metal, or physical-
hardware verification.

`mrml-tensor` now has a structured PTX sub-action instead of depending on Cargo
to execute its custom build target. The action binds the source, generated
filename, `OUT_DIR`, `cuda` feature, required GPU architecture, nvptx target,
optimization, and ABI-mismatch flag. CUDA host artifacts include the host ABI
triple, preventing Windows/Linux cache aliasing. Native and Cargo CUDA suites
both pass 43 tests on Windows gnullvm and Arch Linux WSL2; focused prefill probes
execute on both CUDA device paths, and the two `sm_120` PTX hashes match.
Thirty-three components are native; nine remain transitional. This is not
physical-topology, passthrough-isolation, or native-MRML-GPU evidence.

`mrml-model` selects its exact default `runtime` set and binds native JSON,
runtime, and tensor artifacts. Windows gnullvm and Arch Linux WSL2 each build it
and match Cargo's seven passing tests. Thirty-four components are native; eight
remain transitional. No model inference, remote provider, or CUDA profile ran.

Compile-environment declarations now separate one exact value from its bounded
number of audited source reads. `mrml-agent` binds
`CARGO_PKG_VERSION=0.0.1` once with use count two and selects its exact default
`runtime` dependency set. Windows gnullvm and Arch Linux WSL2 each match Cargo's
20 passing tests. Thirty-five components are native; seven remain transitional.
No configured live remote/model path or CUDA agent profile was exercised.

`mrml-trainer` is now an exact bin-only native action over math, runtime,
tensor, tokenizer, and Wikipedia. Windows gnullvm and Arch Linux WSL2 each
match Cargo at four passing tests. Thirty-six components are native; six remain
transitional. The bounded generated-data tests establish neither production
training nor CUDA or physical-hardware behavior.

`mrml-whp-run` now binds core crypto, error, kernel, runtime, and WHP directly
under the same empty Windows feature set previously selected by the transition
bridge. Native and Cargo `--no-default-features` suites pass seven tests.
Thirty-seven components are native; five remain transitional. Its CUDA/tensor
edge remains declared but inactive; no VM or physical hardware ran.

`mrml-cli` and `mrml-machine` now bind the exact default `auto` chain through
agent/model profiles to tensor's host `cuda` profile. Tensor's declared
`sm_120` PTX action executes recursively, so neither node depends on a prior
Cargo artifact. Windows gnullvm and Arch Linux WSL2 match Cargo at zero CLI and
four machine tests, and their PTX hashes match. Thirty-nine components are
native; three remain transitional. No CUDA device or inference path ran.

`mrml-server` now emits its native library and self-linked binary with direct
agent and model edges selecting the same `auto` model artifact. Both exact
hosts match Cargo at four library tests and a zero-test binary harness. Forty
components are native; two remain transitional. No live listener, TLS endpoint,
remote model, CUDA device, or production traffic ran.

`mrml-kvm-run` now binds core crypto, kernel/KVM, runtime, and tensor's host
`cuda` profile through native rustc on Linux. Arch Linux WSL2 matches Cargo at
eight passing tests. Forty-one components are native; only the `mrml`
clean-source bootstrap remains transitional. No VM or physical hardware ran.

Native actions now bind one exact feature set and may gate an extern by both
target family and selected feature. `mrml-av1` declares the empty default set,
so its `nvidia` platform extern is inactive while `mrml-runtime` remains active.
The library and `decode_ivf` example build directly on Windows and Arch Linux
WSL2. A 32 MiB executable-stack policy eliminates sixteen Windows harness
overflows; both native hosts match the pinned Cargo baseline's two remaining
source failures (273 passed, 2 failed). Fifteen components are native; 27 remain
transitional.

`mrml-crypto` records its resolved default set as `runtime`; that selected gate
activates the exact `mrml_runtime` extern on both supported hosts. Windows and
Arch Linux WSL2 each pass all 27 direct cryptography tests. Sixteen components
are native; 26 remain transitional.

`mrml-tls` directly consumes the native crypto and runtime rlibs. Windows and
Arch Linux WSL2 each pass all 11 inline tests; configured live-peer and external
certificate-fixture paths were not supplied. Seventeen components are native;
25 remain transitional.

`mrml-http` directly binds the native runtime and TLS rlibs. Windows and Arch
Linux WSL2 each pass all three inline tests; the environment-selected live URL
and range probes were not supplied. Eighteen components are native; 24 remain
transitional.

`mrml-ssh` directly binds the native crypto and runtime rlibs. Windows and Arch
Linux WSL2 each pass all 23 inline tests, including loopback transport; no live
remote or external signing operation was supplied. Nineteen components are
native; 23 remain transitional.

Native actions now declare exact binary output names, crate names, source roots,
self-library bindings, binary test harnesses, and compile-time environment
values. `mrml-git` builds its library and executable on Windows and Arch Linux
WSL2 and passes 51 library tests plus one binary test on each. No live remote
operation was exercised. Twenty components are native; 22 remain transitional.

`mrml-tools` resolves `default` to the explicit `runtime` set, records the
repository-relative `CARGO_MANIFEST_DIR` value, activates six universal externs,
and selects only the host platform extern. Arch Linux WSL2 passes 32 tests;
Windows reproduces the Cargo baseline at 31 passed and one installed-Edge
DevTools failure. Twenty-one components are native; 21 remain transitional.

Bin-only actions use an explicit `none` primary-library kind, still bind every
binary output/source/test harness, and are rejected as extern providers. The
compiler driver builds its real `mrml-rustc` executable and passes both tests on
Windows and Arch Linux WSL2. Twenty-two components are native; 20 remain
transitional.

Patent review: `TRIGGERED`. This increment implements the first native dependency
resolver, within the package/cache/resolver review already recorded in
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
