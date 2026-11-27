# MRML Rust oracle generation 0001

## Identity

- rustc version: `rustc 1.100.0-nightly`
- full commit: `f7d782a3be46d6bb4b9792fe69a61db389ba1769`
- source/build date: `2026-08-19`
- MRML verification began: `2026-08-21`
- edition/default behavior: MRML probes use Rust 2024 syntax where applicable;
  individual mapped upstream tests retain their own declared/default edition.

This is the stage-zero behavioral reference, not a promise to preserve every
behavior of this compiler generation.

## Relevant feature state

- Polonius: no MRML Polonius compatibility claim was established for this
  generation; the existing corpus does not constitute a Polonius test suite.
- trait solver: no MRML next-generation-solver compatibility claim was
  established for this generation.
- important unstable features: selected nightly integer and pointer APIs are
  recorded by their independently authored tests in `mrml-rustc`; no blanket
  nightly feature set is adopted.
- naked functions, async closures, general inline assembly, general traits, and
  ownership/borrow checking are not part of the implemented MRML subset.

## MRML-relevant observations

The exact official `rust-lang/rust` commit supplied the referenced UI/codegen
test identities because rustup `rust-src` does not include those compiler test
suites. Upstream files were executed as black-box observations; their bodies
were not copied into MRML. Original MRML conformance and replacement probes
cover the documented bounded arithmetic, control-flow, integer, pointer,
reference, array, tuple, and native ABI/object slices.

Detailed per-slice mappings and Windows/Arch native evidence remain in
`packages/compiler/core/README.md` and the test sources. This record intentionally
does not duplicate the upstream changelog or the complete evidence ledger.

## Conformance result

The generation was accepted as the initial oracle for the documented subset.
It is not evidence of complete rustc, stable-Rust, old-edition, nightly, library,
or ABI compatibility. Later oracle records must preserve this metadata, rerun
the existing corpus, classify every semantic delta, and retain regression tests
for deliberately accepted changes.
