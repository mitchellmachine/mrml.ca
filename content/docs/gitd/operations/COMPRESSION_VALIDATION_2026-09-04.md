# Incremental Git compression — local evidence, 2026-09-04

## Scope and implementation

**TESTED, completion in progress.** This is local Linux x86-64 writer and
interoperability evidence. It is not a 256 MiB network clone/fetch/push result,
an exact hardened Compose result, or a clean signed release.

`deflate/incremental.rs` reuses the existing original DEFLATE Huffman/length/
distance primitives. Loose headers and contents enter the same incremental
stream without constructing a second complete plain object. Streaming pack
output now uses that encoder through the authenticated pack writer. Each object
has one zlib header, one Adler-32 trailer and one DEFLATE stream. A non-final
compressed block uses an empty stored block for byte alignment; that is not a
second zlib member. Pack and object hashes retain their original definitions.

Input blocks and dictionaries span at most 32 KiB. Match chains stop after 32
candidates and a block-wide ceiling of four search steps per byte. Work is
reserved before input processing or dictionary initialization/reset. The Gitd
sideband adapter charges the existing protocol work budget; a denied reservation
or output write makes that encoder terminal. Cancellation remains synchronous
at block/sink boundaries; whole-object hashing precedes compression and is not
an asynchronous cancellation boundary.

Tiny blocks use stored encoding without match tables. Larger blocks choose
stored output when the completed compressed candidate is larger. This bounds
search effort but does not avoid all compression cost on random input. Total
scratch is **not** 32 KiB: on a 64-bit host the two tables occupy 512 KiB, plus
input and compressed output vectors with bounded allocator capacity.

## Regression and compatibility commands

```text
target/release/mrml test org.mrml.tool.git --target linux
target/release/mrml test org.mrml.tool.git --target linux --sanitizer address
MRML_COMPRESSION_GIT_ORACLE=1 target/mrml-native/linux/debug/mrml_git_tests --ignored --exact compression_oracle_tests::compression_external_zlib_and_git_oracle_matrix --nocapture
```

The original writer regression run had 276 library passes and three failures:
large loose objects, the full-buffer zlib wrapper, and actual streaming pack
objects all failed the compressible-size assertion. After the implementation,
282 library, five CLI, nine signer, and two credential tests passed normally
and under AddressSanitizer. The explicit independent zlib/Git matrix also passed
with Python zlib 1.3.2 and Git strict SHA-256 pack decoding. It covered empty
input, 32 KiB and 32 MiB boundaries, mixed stored/compressed blocks, split input
slices, random and already-compressed bytes, related objects, exact object and
pack hashes, and single-stream EOF. Later added external-pack/depth tests are
now included: the normal package run passed 283 library tests plus the same
5/9/2 binary suites. The revised Rust-assertion oracle matrix passed in 27.74 s,
including 128 objects in a Git-generated related pack. The production bounded
file decoder accepted an exact 50-link delta chain and rejected an otherwise
equivalent 51-link chain. The full-buffer parser has a different existing
admission profile; the 50-link claim belongs to the production file path.

The compaction success regression now uses the actual planner on the original
SHA-256 object set, compares exact refs/default branch/security generations,
reopens the activated storage, and checks old pack/manifest retention. Final
sanitizer execution passed: 283 library plus 5/9/2 binary tests. A first version
of the retained-pack assertion correctly failed with `StaleGeneration`; the
corrected test expects that rejection and independently authenticates the
retained old pack instead of rolling a selected reader backward. The final
serving path also reserves 768 KiB of its memory budget for compression scratch
and sideband copying before admitting object content. Authority 22+10 and Gitd
55+7+1 package tests passed against that library. This internal compactor
is not service-scheduled and trusts its supplied reachable set; this is evidence
of preserving a correct supplied set, not admission of arbitrary malicious
compaction results or a physical crash test. No existing loose objects were
deleted to demonstrate compression.

## Same-machine writer comparison

Host: local i9-13900KF, Linux x86-64, 32 logical CPUs. These runs used the same
Rust probe, same deterministic corpus, eight objects of exactly 32 MiB each,
and the same filesystem/sandbox. Runs in the table were sequential after other
tests and builds finished. Earlier overlapping exploratory runs are excluded.
Each fixture is disposable; no user's repository or history was modified.

The probe links canonical MRML release libraries. It writes 256 MiB logical
content either as loose objects or a streaming pack, retaining one source
object. It is available at [probes/compression.rs](probes/compression.rs).
Every before/after `ids.txt` comparison passed exactly. Elapsed time excludes
fixture generation; CPU and peak RSS cover the whole process. File writes are
not an fsync/durability benchmark.

| Writer/corpus | Version | Stored bytes | Ratio | Elapsed s | CPU user/system s | Peak RSS KiB | Read/write calls |
| --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| pack/text | baseline | 268456108 | 1.000077 | 1.931401 | 1.94 / 0.03 | 35920 | 18 / 16463 |
| pack/text | incremental | 3760228 | 0.014008 | 1.879731 | 1.91 / 0.00 | 35908 | 18 / 8239 |
| pack/random | baseline | 268456108 | 1.000077 | 1.953193 | 1.94 / 0.04 | 36708 | 18 / 16463 |
| pack/random | incremental | 268476548 | 1.000153 | 4.858142 | 4.86 / 0.04 | 36520 | 18 / 32815 |
| loose/text | baseline | 268456136 | 1.000077 | 1.644850 | 1.59 / 0.09 | 117392 | 18 / 27 |
| loose/text | incremental | 3760448 | 0.014009 | 1.825905 | 1.86 / 0.00 | 36608 | 18 / 27 |
| loose/random | baseline | 268456136 | 1.000077 | 1.662494 | 1.59 / 0.11 | 117804 | 18 / 27 |
| loose/random | incremental | 268476616 | 1.000153 | 4.439071 | 4.37 / 0.10 | 85824 | 18 / 27 |

**Limitation:** random writer CPU/elapsed regressed, and pack write calls doubled
because stored blocks are now 32 KiB instead of approximately 64 KiB. This is
reported, not hidden by changing data, verification, or timeouts. Logical wire
sizes are the pack sizes above; actual network wire bytes and separate client/
server RSS remain **NOT_RUN**. `/proc/self/io` supplies read/write syscall counts,
not all syscalls. `strace`, `perf`, and `/usr/bin/time` were unavailable locally.
CPU uses `/proc/self/stat` and the observed `getconf CLK_TCK` value 100.

## Reproduction and local identities

Baseline was built before production compression edits:

```text
target/release/mrml build org.mrml.tool.git --target linux --release
```

The saved baseline CLI SHA-256 is
`a6ac21d2c0f5353f8d58450008408bc0fb2788bafa2073d40636c4cec17db67d`.
The initial incremental CLI SHA-256 is
`3c049242d7e8154dba0b20122cea620bb1e7a936fcb6f1ac684be7c667f86ef5`.
Base Git HEAD is recorded in [CURRENT_COMPLETION.md](CURRENT_COMPLETION.md);
both builds include preserved pre-existing dirty source and are not releases.

Compile the host measurement probe against each build before replacing its
libraries, selecting a distinct output name:

The observed compiler is `rustc 1.100.0-nightly`, dated 2026-08-28, full commit
`17fd5b8a37b6667b6cc137f3cc35f09759768a3b`, LLVM 23.1.0; the independent Git
oracle is version 2.55.0. This records probe/build provenance, not an MRML
compiler conformance-oracle upgrade.

```sh
rustc --edition 2024 -C opt-level=3 -C panic=abort \
  docs/gitd/operations/probes/compression.rs \
  --extern mrml_git=target/mrml-native/linux/release/libmrml_git.rlib \
  --extern mrml_runtime=target/mrml-native/linux/release/libmrml_runtime.rlib \
  -L dependency=target/mrml-native/linux/release \
  -o /tmp/compression-probe
/tmp/compression-probe pack text /tmp/fresh-compression-pack-text
/tmp/compression-probe pack random /tmp/fresh-compression-pack-random
/tmp/compression-probe loose text /tmp/fresh-compression-loose-text
/tmp/compression-probe loose random /tmp/fresh-compression-loose-random
```

The output directories must not exist; creation fails instead of overwriting.
Measured binaries/logs/fixtures are retained under
`/tmp/mrml-git-completion-baseline-20260904/`, using `isolated-` log prefixes.
Probe binary SHA-256 values:

- baseline: `22d2caeb722509e19d2284938e9af2b2038fc048aaa1a3c7ff38897b101089fe`
- incremental: `b08b320f81d1b712b44bd197c54bba113a3e87cca9755440d1f3ad27e577f8e1`

Patent review: **NOT_TRIGGERED**. This is bounded streaming and resource
accounting around the existing original conventional DEFLATE implementation;
no new codec or cryptographic construction is introduced. See
[REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
