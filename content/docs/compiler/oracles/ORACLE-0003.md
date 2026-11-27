# MRML Rust oracle generation 0003

## Identity

- rustup toolchain: `nightly-2026-08-29`
- rustc version: `rustc 1.100.0-nightly`
- full commit: `17fd5b8a37b6667b6cc137f3cc35f09759768a3b`
- source/build date: `2026-08-28`
- MRML verification date: `2026-08-29`
- verified native host: `x86_64-unknown-linux-gnu` on Arch Linux
- verified Wine-hosted toolchain: `x86_64-pc-windows-gnullvm` under Wine 11.16
- LLVM version: `23.1.0`
- edition/default behavior: MRML probes use Rust 2024 syntax where applicable;
  individual mapped upstream tests retain their own declared/default edition.

This exact dated nightly is the repository's default upstream build toolchain
and current behavioral oracle. ORACLE-0001 and ORACLE-0002 remain immutable
prior generations. The Wine result is Windows-target toolchain coverage, not
native Windows, Windows ABI, WHP, Hyper-V, VBS, or Windows hardware evidence.

## Relevant feature state

- Polonius: no complete Polonius compatibility claim is established; the MRML
  corpus covers only its independently implemented and documented borrowing
  subset.
- trait solver: no complete next-generation trait-solver compatibility claim is
  established.
- unstable features: only features exercised by independently authored MRML
  source and probes are adopted; the nightly as a whole is not an MRML contract.
- unsupported borrowing, traits, provenance, unsafe, ABI, assembly, const, or
  metadata behavior continues to fail closed as documented.

## Delta from ORACLE-0002

ORACLE-0002 used rustc commit
`fb6531d550e0075b9eb9a51464f404805eec87d9` from 2026-08-23. Generation 0003
advances the default to the nightly distributed on 2026-08-29. The existing
MRML compiler corpus passed unchanged after updating its exact expected-oracle
commit guard. No corpus-visible semantic or diagnostic delta was observed.
This is bounded evidence, not a claim that the upstream compilers are globally
equivalent.

## Conformance result

The canonical compiler suites passed on native Arch Linux and under Wine using
the Windows gnullvm toolchain. Each environment passed:

- 806 compiler-core unit tests;
- 2 component-interface tests;
- 10 conformance tests;
- 351 nightly-replacement tests;
- 118 semantic-execution tests; and
- 8 compiler-driver tests.

That is 1,295 passing tests per environment. The first Arch semantic-execution
attempt intentionally failed all 117 oracle-dependent cases because the harness
still required ORACLE-0002's exact commit; the one oracle-independent rejection
test passed. After changing the guard to ORACLE-0003's exact commit, all 118
passed. This was the expected fail-closed upgrade transition, not a semantic
regression.

The Windows-target frontend required the new gnullvm toolchain's `bin`
directory on Wine's `WINEPATH` so `libunwind.dll` could be loaded. This is an
environment requirement and does not alter MRML semantics.

Exact verification commands were:

```sh
cargo build --locked
./target/debug/mrml test org.mrml.compiler.core --target linux --release
./target/debug/mrml test org.mrml.compiler.driver --target linux --release
```

```sh
WINEDEBUG=-all RUSTFLAGS='-C link-arg=/stack:16777216' \
  wine 'C:\users\m\.cargo\bin\cargo.exe' \
  +nightly-2026-08-29-x86_64-pc-windows-gnullvm build --locked
WINEDEBUG=-all \
  WINEPATH='C:\users\m\.cargo\bin;C:\users\m\.rustup\toolchains\nightly-2026-08-29-x86_64-pc-windows-gnullvm\bin' \
  wine target/debug/mrml.exe test org.mrml.compiler.core --target windows --release
WINEDEBUG=-all \
  WINEPATH='C:\users\m\.cargo\bin;C:\users\m\.rustup\toolchains\nightly-2026-08-29-x86_64-pc-windows-gnullvm\bin' \
  wine target/debug/mrml.exe test org.mrml.compiler.driver --target windows --release
```

No native Windows, WHP, KVM, VTL1, UEFI execution, bare-metal, or physical-
hardware evidence is claimed by this oracle upgrade.

Patent review: `NOT_TRIGGERED` — this change selects and records an upstream
compiler observation point; it introduces no new MRML mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
