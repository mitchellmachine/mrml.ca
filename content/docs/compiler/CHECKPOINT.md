# mrml-rustc durable checkpoint

This file is the short recovery record for the independent compiler lane. It
does not replace `docs/COMPILER.md`, the oracle records, or the detailed
evidence ledger in `packages/compiler/core/README.md`. If chat history or a local
worktree is lost, recover this checkpoint first and verify every claim against
the named commit and current source.

## Integrated literal conformance checkpoint

Signed commits `b107887c` and `0314dd24` on `main` align character
Unicode escape digits with Rust 2024 and reject uppercase integer base
prefixes at the prefix span. They preserve the earlier compiler checkpoint
and do not change the linker or production compiler selection. The source
commits record 14 public frontend probes against ORACLE-0004, including
successful Windows execution and Linux ELF emission. The source worktree's
compiler core and driver suites passed on both Windows gnullvm and Arch
WSL2. This records that run's evidence; it does not explain the earlier
Windows loader error 623.

Signed commit `47dd97cf` adds exact two-digit hexadecimal escapes with the
ASCII limit for `char` and the full `u8` range for byte literals. Its source
checkpoint passed 1,349 core and 19 driver tests on both hosts, and eight
public frontend probes matched ORACLE-0004. Accepted Windows outputs ran;
the Linux check covered ELF emission.

## Integrated frontend checkpoint

Commit `d2aeb100` on `main` includes four signed frontend changes:

- `6858447f`: locate malformed or unsupported struct and enum headers.
- `509af8ed`: accept a leading parameterless `#![no_std]` in the existing
  freestanding subset.
- `9917fe48`: restore the hosted Windows debug frontend's 32 MiB stack budget.
- `d2aeb100`: require canonical decimal tuple field indices in reads and
  assignments.

The commit messages retain the Windows, Arch WSL2, and ORACLE-0004 checks.
On the combined tree, the compiler core and driver suites passed on Arch
WSL2. On Windows, all 19 driver tests and the focused parser tests passed.
The Windows core run stopped after 853 tests passed and one failed:
`generated_pe_executes_on_the_controlled_windows_host` hit Windows loader
error 623. That test's PE linker and fixed machine-code input are unchanged
by these commits. The public experimental frontend emitted the scalar PE on
Windows, but that run did not verify execution. These changes neither
implement general aggregate support nor change the production compiler
selection.

## Recoverable baseline

- Branch: `main`
- Compiler checkpoint commit: `b03f61cb`
  (`compiler: compact large COFF section state`)
- Remote state when recorded: `origin/main` includes the bounded MRML-owned
  static-link core, exact MRML COFF and ELF64 ingestion, deterministic
  import-free PE32+/ELF64 executable serialization, explicit compiler-driver
  selection, identical-input gnullvm rust-lld comparison, and ordered linking
  of one through 256 object inputs. The original compiler core/driver relocation
  remains at `0350249c`.
- Preceding compiler commits: `9a950ae9` (`build: move compiler core`),
  `885ba7b7` (`compiler: validate nested loop
  returns`), `5c53eb9` (`compiler: track mutable tuple field
  moves`), `480a198` (`compiler: identify constant array
  elements`), `40a035c` (`compiler: analyze initializedness
  through expressions`), `daf9fb9` (`compiler: connect conditional
  expression flow`), `cbc6cc5` (`compiler: map conditional expression
  program points`), `7003640` (`compiler: identify conditional
  expression occurrences`), `8ddd42f` (`compiler: refine conditional event
  origins`), `df01b9b` (`compiler: retain ownership event
  origins`), `40d7544` (`compiler: reject linear use after
  move`), `1e0dc42` (`compiler: order ownership events`),
  `724f40b` (`compiler: classify call and return
  moves`), `3b8599e` (`compiler: distinguish borrow place
  effects`), `97b275d` (`compiler: classify exact Copy
  effects`), `147e15a` (`compiler: classify direct move and
  write effects`), `fbb7c27` (`compiler: project tuple move paths`), `1139f96`
  (`compiler: establish initialized move path roots`), `4879955` (`Preanalyze
  runtime assignment accesses`), `996ac72` (`Preanalyze runtime loop
  declarations`), `e393097`
  (`Preanalyze sequential runtime declarations`), `8b4a529`
  (`Preanalyze conditional branch local identities`),
  `acd1d64` (`Preanalyze bounded runtime body facts`), `486fc87`
  (`Discover bounded runtime read places`), `aac7798`
  (`Bound runtime place projection facts`), `308c781`
  (`Record stable runtime identifier reads`), and `099b11c` (`Retain bounded
  runtime place facts`).
- Current build/oracle: `docs/compiler/oracles/ORACLE-0004.md`, rustc
  `1.102.0-nightly`, full commit `6c709eb428d472a3c3d93681c1ba37d44a1c27cf`,
  dated 2026-11-25 and distributed as `nightly-2026-11-26`. Arch WSL2
  passed all 1,357 compiler tests. Native Windows passed 1,339 core tests.
  Both native Windows (`x86_64-pc-windows-gnullvm`, no MSVC or Windows SDK)
  and Arch WSL2 passed 50 runtime tests and 18 driver tests after the Windows
  retained-file operations were implemented. The earlier driver blocker
  remains recorded in ORACLE-0004 as baseline evidence. Prior oracle records
  remain unchanged; the TLS probe edits document safety without changing
  probe behavior.
- Language direction: Rust 2024 is the edition floor. Contemporary and future
  Rust semantics are the target; obsolete editions, historical unsoundness,
  rustc internals, diagnostic wording, and unstable Rust ABI details are not
  standing compatibility requirements.

Do not replace the exact oracle with the newest installed nightly. A future
oracle upgrade receives a new immutable record and differential classification
against all prior accepted probes. Keep Cargo on edition 2024 until a newer
named edition can be adopted through a pinned, workspace-wide migration.

## Hosted Windows file operations

- Locking waits on a whole-file Win32 byte-range lock, including future writes
  beyond the current end of the file. Ordinary I/O from competing handles fails
  while the lock is held. Memory-mapped access is outside that guarantee.
- Ownership changes use SID strings and a dedicated regular-file handle opened
  for Windows security-metadata access. They replace the DACL by handle and
  protect it from inheritance. Supported modes have nested owner, group and
  other grants; unrepresentable modes and Unix special bits fail instead of
  widening access. Open handles and Windows privilege or owner-rights rules
  are not revoked or redefined. Linux numeric UID/GID behavior is unchanged.
- Native Windows commands (both passed):
  `mrml test org.mrml.library.runtime --target windows --release` and
  `mrml test org.mrml.compiler.driver --target windows --release`.
  The native Windows core rerun passed 1,339 tests: 848 unit tests and 491
  across the four declared integration suites. The sandboxed frontend run
  built the core but stopped when Windows refused to launch a generated PE
  (loader error 623). The same freshly built unit executable passed outside
  the sandbox. The four integration suites were rebuilt using the frontend's
  declared flags and the fresh core library, then passed outside the sandbox.
  Arch WSL2 commands (both passed):
  `mrml test org.mrml.library.runtime --target linux --release` and
  `mrml test org.mrml.compiler.driver --target linux --release`.
- In a native Windows disposable-file probe, Windows denied a write-open
  after mode 0400, restored write access at 0644, and reported the requested
  primary group and protected ACL with three explicit grants. The normal
  read handle could not change the DACL. This is native hosted file-system
  evidence, not coverage for every Windows file system or account policy.
- The workspace manifest check passed. Both Windows TLS probes now have
  narrowly scoped unsafe-policy entries and returned 42 when built and run
  with the pinned Windows oracle. The repository-wide `mrml assurance check`
  stopped at AES-GCM unsafe-policy drift during this run. That issue was
  fixed later; see [Project status](../PROJECT_STATUS.md#workspace-checks-and-generated-inventories)
  for the current blocker. Assurance is separate from the focused Windows
  test results.
- Patent review: **NOT_TRIGGERED**; this uses existing operating-system
  locking and access-control primitives. See [review log](../patents/REVIEW_LOG.md).

## Earlier bounded language milestones

Individual platform skips below describe only the recorded increment. For the
current native Windows rerun see [Hosted Windows file operations](#hosted-windows-file-operations).

The MRML V1 two-word emitter now accepts modern same-width `cast_signed` and
`cast_unsigned` methods for `u128`/`i128`, together with their saturating and
strict policy variants. Stable casts preserve both words. Saturating conversion
maps an out-of-range unsigned value to `i128::MAX` or a negative signed value to
zero; strict conversion traps on the same high-word sign-bit boundary. Exact
source/target direction checks fail closed. The release Linux build and the
canonical compiler gate pass: 815 unit tests and every integration group,
including 351 replacement and 123 semantic-execution tests. Controlled Linux
execution matches exact ORACLE-0003 results across both words for stable,
saturating, and in-range strict paths at zero, signed boundaries, and all-ones
input where admitted. Isolated Linux children also confirm strict conversions
trap at both invalid boundary classes.
Windows gnullvm was not run.
Patent review: **NOT_TRIGGERED**; this extends ordinary integer conversion
lowering without introducing a new mechanism. See `docs/patents/REVIEW_LOG.md`.

Checked same-width `u128`/`i128` sign casts now reach the two-word emitter when
consumed directly by `unwrap_or`, `unwrap_or_default`, `unwrap`, or `expect`.
Valid values preserve both words, invalid values select the exact wide fallback
or zero default, and trapping consumers use the shared illegal-instruction
path. Zero-parameter lazy fallbacks are evaluated only on `None`; wide presence
predicates and compositional option consumers remain unsupported and fail
closed. Both x86-64 ABIs
compile the terminal forms. The canonical Linux gate
passes 823 unit tests, 351 replacement tests, and 128 semantic-execution tests;
defaulting and eager or lazy custom fallbacks in both directions match exact
ORACLE-0003 results across both words at zero, signed boundaries, and all-ones
input. Isolated Linux children confirm checked `unwrap` and `expect` trap at
both invalid unsigned boundaries, and reverse-direction checked `unwrap` and
`expect` trap for negative signed inputs. Valid checked trapping consumers in
both directions match both oracle words.
Scoped-unsafe `unwrap_unchecked` matches both oracle words for valid inputs in
both directions while safe use fails closed; invalid unchecked input is
Rust UB and was not executed. Windows gnullvm was not run. Patent review:
**NOT_TRIGGERED**; this reuses the existing bounded option
consumer and integer conversion mechanisms. See `docs/patents/REVIEW_LOG.md`.

Wide-to-narrow `as` casts now evaluate any admitted `u128` or `i128` operand
through the common two-word emitter before normalizing the low word to the
target width. This replaces the old direct-parameter-only loader and admits
wide locals and computed expressions without duplicating their lowering or
changing Rust truncation semantics. Focused native Linux tests pass for both
x86-64 ABIs, and the release compiler build passes. The canonical native Linux
compiler gate passes all 812 unit tests and every integration group. Its
semantic-execution group passes 121 tests. Unsigned computed wrapping sums
narrowed to `u64` match exact ORACLE-0003 at zero, the low-word carry boundary,
a high-word-only operand, and full-width wrapping overflow. Signed computed
wrapping sums narrowed through `i16` and then widened to `u64` also match at
zero, both `i16` boundaries, and both `i128` wrapping boundaries. Windows
gnullvm was not run.
Patent review: **NOT_TRIGGERED**; this is ordinary integer-cast lowering, not a
new mechanism. See `docs/patents/REVIEW_LOG.md`.

Wide two-word integer emission now unwraps an explicitly scoped `unsafe` block
before lowering its typed operand, matching the existing one-word emitter
without granting unsafe authority to the surrounding safe function. Focused
funnel-shift admission tests accept `u128` unchecked use only inside that scope
and reject safe unchecked calls, signed receivers, mismatched peer widths, and
non-`u32` distances on both x86-64 ABIs. The complete native Linux compiler
gate also executes five valid scoped-unsafe funnel distances against the exact
ORACLE-0003 rustc and compares both result words. It passes 808 unit tests and
all integration groups, for 1,297 tests. Windows gnullvm was not run for this
increment. Patent review: **NOT_TRIGGERED**; this
is a compiler safety-context propagation correction, not a new mechanism. See
`docs/patents/REVIEW_LOG.md`.

## Latest bounded linker milestone

Commit `b03f61cb` replaces fixed per-section COFF COMDAT metadata and boolean
arrays with an exact-object borrowed view and compact 4,096-bit classification
sets. Association chains remain bounded and cycle-checked. The exact pinned
`libcore` probe now advances to `expanded link fragment count exceeds 256` in
627 ms instead of failing at content-section tracking. Detached Windows runs
passed all 801 compiler-core unit tests, the package integration groups, and
eight driver tests. Linux and comparative performance were not rerun for this
owner-requested stop point; full `libcore` support is not claimed. Patent
review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commits `259ff44c` and `c9fac606` separate the 256 source-input ceiling from a
4,096 decoded-fragment ceiling. Exact-sized hosted vectors own per-fragment
relocation and definition arenas, while archive paths, source identities, and
ordinary input workspaces retain their prior bound. A focused unit test selects
257 fragments of one archive member atomically. The actual Linux driver release
build passes. A Linux-hosted MRML driver consuming the exact ORACLE-0003 gnullvm
consumer object and `libcore` archive advances to the next fail-closed boundary,
`COFF object 1 text fragment 0: unsupported COFF feature`; this is cross-format
parser evidence, not native Windows execution or full `libcore` support. The
complete compiler-core package attempt reached `rust-lld` but failed because
its generated input object files were absent, so no package-pass claim is made.
Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `922834fe` admits object-local symbols as bounded identities for
standalone read-only COFF COMDAT fragments while excluding section-definition
auxiliary records. Same-object text relocations use the existing typed local
target; cross-object name collisions still fail closed as duplicate symbols.
The Linux release driver build passes, and the exact ORACLE-0003 gnullvm
`libcore` probe advances from fragment 0 to the precise next boundary at
fragment 3, `unsupported discontiguous COFF read-only layout`. One compiler-core
run compiled and executed 809 unit tests, then reported four focused failures
that were corrected; the rerun could not execute because generated rustc input
objects were absent at final `rust-lld` invocation, so no complete package-pass
claim is made. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Commit `70da7783` introduces a bounded `CoffSectionIdentity` containing one
nonzero source-object identity and one nonzero section identity. Definitions
using it are deliberately non-global: names cannot trigger archive extraction,
collide across objects, or satisfy entry/global relocation lookup. A typed
relocation resolves only an exact identity and checked read-only offset.
Synthetic coverage uses two objects with the same `.rdata` label, resolves the
second identity exactly, rejects zero identities, and proves an internal-only
archive member remains unselected. The actual Linux release driver build
passes. The compiler-core package gate again reached final `rust-lld` and failed
because generated input objects were absent, so no package-pass claim is made.
Decoder/driver adoption remains the next gate. Patent review:
**NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

The production COFF decoder and driver now project every COMDAT read-only
section, including associative companions, through exact source-object/section
identities. This crosses the pinned ORACLE-0003 `libcore` discontiguous-layout
gate. Runtime-function decoding then admitted multiple names for one exact
zero-offset code location and raised its independent record ceiling from 256
to the existing 4,096 retained-fragment ceiling. The Linux release driver
build passes. The exact pinned probe advances to the next fail-closed boundary,
`could not decode selected writable COFF data`; this is a Linux-hosted parser
probe, not native Windows execution or full `libcore` support. The canonical
Linux compiler-core package gate passes all 812 unit tests and its integration
groups, including 351 replacement tests. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Writable relocations and absolute relocation fields inside projected read-only
COMDATs now carry the same exact source-object/section identity through PE
layout. Non-COMDAT spans retain the legacy checked owner/offset path. The exact
ORACLE-0003 probe crosses writable fragment decoding and missing read-only owner
names, then fails closed at the next boundary, `unsupported COFF relocation
target`, for a local target inside selected object 1. The Linux release driver
build passes. A canonical core run passed 811 of 812 unit tests; its sole
failure was the intentionally refined `UnsupportedCoffRelocation` classification
for an unknown relocation kind, and that expectation was corrected afterward.
Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `447af934` gives COFF archive fixed-point discovery a zero-copy,
fallible external-symbol inventory over validated symbol and string tables.
Structural metadata admits at most 4,096 sections, covering the pinned
sysroot's observed 3,834-section maximum, while content decoding remains
separately bounded at 256 tracked sections. The durable pinned `libcore` probe
crosses symbol discovery for its selected 1,934-section, 5,034-symbol member and
fails at the explicit next gate, `COFF content section tracking capacity
exceeded`; full `libcore` support is not claimed. Exact detached Windows
gnullvm and Arch Linux runs each passed the complete 786-test compiler-core
package gate and eight driver tests. The stateful archive probe returned 42
through both linkers, with 2,560 MRML bytes versus 3,584 rust-lld bytes, 1,028
zero-fill bytes, and two writable forwarder pointers. Fifty measured links
after five warmups recorded MRML at 7.319 ms median/7.458 ms mean versus pinned
rust-lld at 22.409 ms median/23.162 ms mean on this narrow Windows workload;
general superiority is not claimed. `mrml doctor` passed; audit retains the
unrelated fingerprint `fnv1a64:9c883880f091489a` at
`semantic_execution.rs:1710`. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Commit `319444a5` validates and discards conventionally named COFF `.debug`,
`.debug$...`, and `.debug_...` sections only when they are discardable,
initialized data and are neither writable nor executable. The bounded pass
checks relocation-table extent, symbol indices, known AMD64 relocation kinds,
and complete field widths before omission; retained or malformed debug sections
fail closed, and no debug-emission support is claimed. Synthetic coverage
accepts a bounded `SECREL` record and rejects a retained section, invalid symbol,
unknown kind, out-of-range field, and truncated field. Exact detached Windows
gnullvm and Arch Linux runs each passed 780 compiler-core unit tests, both
component probes, 10 conformance tests, 351 replacement tests, 85 semantic-
execution tests, and eight driver tests. The durable pinned gnullvm debug-rlib
probe produced identical-size 1,024-byte executables through MRML and rust-lld;
both returned 42. Fifty measured links after five warmups recorded MRML at
5.549 ms median/6.714 ms mean versus rust-lld at 22.794 ms median/24.226 ms mean
on this narrow Windows workload. This is not representative-library or general
superiority evidence. `mrml doctor` passed; audit retains unrelated fingerprint
`fnv1a64:9c883880f091489a` at `semantic_execution.rs:1710`. Patent review:
**NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `7eb2fdd3` admits the complete AMD64 COFF read-only PC-relative family,
`REL32` through `REL32_5`. A typed zero-through-five trailing-byte bias is
retained during the existing bounded decode pass; final PE serialization
computes the checked signed displacement only after exact text and read-only
RVAs are known. Synthetic coverage decodes all six object encodings, preserves
a negative addend, rejects relocation number 10, validates the four-byte field,
asserts the exact final negative displacement, rejects an impossible typed
bias, and checks overflow. Exact detached Windows and Arch Linux runs each
passed 771 compiler-core tests, all four integration groups, and eight driver
tests. The initial shared Windows compile encountered one non-reproduced
`0xC0000005` compiler-process failure before testing; the detached Windows run
then passed completely. The unchanged pinned gnullvm archive returned 42
through both linkers: MRML emitted 2,560 bytes versus rust-lld's 3,584, with
1,028 zero-fill bytes and two forwarding pointers. Fifty links after five
warmups measured 10.766 ms median/12.022 ms mean for MRML versus 30.251 ms
median/31.345 ms mean for rust-lld on this narrow Windows workload. Other
read-only relocation encodings and discontiguous non-COMDAT packing remain
incomplete. `mrml doctor` passed; audit retains unrelated fingerprint
`fnv1a64:9c883880f091489a` at `semantic_execution.rs:1583`. Patent review:
**NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `78ec9d7f` gives read-only COFF relocations an explicit encoding kind
and admits AMD64 `ADDR32NB` alongside `ADDR64`. The decoder validates the
four-byte field and preserves its signed in-place addend; the PE serializer
writes a checked image-relative RVA without adding the fixed image base.
Mixed-kind synthetic coverage proves decoding, exact final output, field-width
bounds, unsupported-kind rejection, negative addends, and overflow failure.
The exact isolated baseline passed 763 compiler-core tests, all four integration
groups, and eight driver tests on Windows and Arch Linux. A final shared Windows
run after the added overflow assertion passed all 765 unit tests; three newly
introduced concurrent wide-integer integration tests failed outside the linker
diff, so they are not attributed to this milestone. The unchanged pinned
gnullvm archive returned 42 through both linkers: MRML emitted 2,560 bytes
versus rust-lld's 3,584, with 1,028 zero-fill bytes and two forwarding pointers.
Fifty links after five warmups measured 9.984 ms median/9.967 ms mean for MRML
versus 27.864 ms median/27.818 ms mean for rust-lld on this narrow Windows
workload. Other read-only relocation encodings and discontiguous non-COMDAT
packing remain incomplete. `mrml doctor` passed; audit retains unrelated
fingerprint `fnv1a64:0fe5cf1836d3e0dc` at `semantic_execution.rs:1416`.
Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `896d3982` decodes bounded AMD64 `ADDR64` relocations originating in
associative read-only COFF companions and assigns them to the exact selected
text root. One inventory prepass records each validated text root's read-only
span start; checked section-relative offsets preserve signed in-place addends,
and non-text association roots remain unsupported. A synthetic two-root object
proves independent ownership and exact final PE pointer values. Isolated
Windows and Arch Linux runs each passed 761 compiler-core tests, all four
integration groups, and eight driver tests. The exact pinned gnullvm stateful
archive returned 42 through both linkers: MRML emitted 2,560 bytes versus
rust-lld's 3,584, with 1,028 zero-fill bytes and two forwarding pointers. Fifty
links after five warmups measured 10.054 ms median/10.233 ms mean for MRML
versus 28.660 ms median/29.022 ms mean for rust-lld on this narrow Windows
workload. Other read-only relocation kinds and discontiguous non-COMDAT packing
remain incomplete. `mrml doctor` passed; audit retains unrelated fingerprint
`fnv1a64:0fe5cf1836d3e0dc` at `semantic_execution.rs:1362`. Patent review:
**NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `89475836` removes the `.rdata$.refptr...` name and one-record
restriction from standalone read-only COFF COMDAT relocation decoding. One
inventory-bound pass per selected object discovers section owners and decodes
every bounded AMD64 `ADDR64` record; retention follows only the exact selected
winner and enforces the aggregate bound after loser filtering. A two-record
ordinary `.rdata$a` fixture covers distinct offsets and signed addends plus
inventory substitution, unsupported-kind, and field-bounds rejection. Isolated
Windows and Arch Linux runs each passed 758 compiler-core tests, all four
integration groups, and eight driver tests. The exact pinned gnullvm stateful
archive returned 42 through both linkers: MRML emitted 2,560 bytes versus
rust-lld's 3,584, with 1,028 zero-fill bytes and two forwarding pointers. Fifty
links after five warmups measured 9.993 ms median/10.110 ms mean for MRML versus
27.872 ms median/28.298 ms mean for rust-lld on this narrow Windows workload.
Other read-only relocation kinds, associative read-only relocation sources,
and discontiguous non-COMDAT packing remain incomplete. `mrml doctor` passed;
audit retains unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at
`semantic_execution.rs:1272`. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Commit `19115911` replaces the writable-only `.rdata$.refptr...` model with a
typed PE read-only absolute relocation. The decoder preserves the in-place
signed addend of each validated `IMAGE_REL_AMD64_ADDR64` record; after final
layout the serializer resolves named targets in selected text, read-only, or
writable data and rejects checked-address underflow or overflow. The path stays
allocation-free and bounded by `MAX_LINK_RELOCATIONS`. Windows and Arch Linux
each passed 757 compiler-core unit tests and eight driver tests; Arch Linux also
passed all four compiler integration groups. The Windows integration run had
one unrelated concurrent wide-const failure while all 757 units passed; the
same 59-test integration group passed on Linux. The exact pinned gnullvm
stateful archive returned 42 through both linkers: MRML emitted 2,560 bytes
versus rust-lld's 3,584, with 1,028 bytes of zero fill and two forwarding
pointers. Fifty links after five warmups measured 9.620 ms median/9.896 ms mean
for MRML versus 26.746 ms median/26.899 ms mean for rust-lld on this narrow
Windows workload. Arbitrary read-only relocation kinds and discontiguous
non-COMDAT packing remain incomplete. `mrml doctor` passed; audit retains the
unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at
`semantic_execution.rs:1270`. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Commit `7390417a` expands every non-associative read-only COFF COMDAT into an
independent named link input. Text relocations target its external definition,
so `ANY`, `SAME_SIZE`, `EXACT_MATCH`, and `LARGEST` winner selection compares
the read-only payload and rebinds references while replacing exact source,
archive, and member origin. Refptr relocation retention now follows only the
winning definition's source object and uses its section-local offset. Prepared
COMDAT inventories are bound to the exact admitted slice address and length.
Synthetic tests cover final text-to-read-only relocation layout, leftmost ANY,
size/content mismatch, larger-later replacement, origin propagation, and
inventory substitution. An isolated worktree preserved concurrent compiler
changes while Windows and Arch Linux each passed 756 core tests, all four
integration groups, eight driver tests, and the full dependent-package graph.
The exact stateful gnullvm probe returns 42 through both linkers: MRML emits
2,560 bytes versus rust-lld's 3,584, with 1,028 bytes of zero fill and two
forwarding pointers. Fifty links after five warmups measured 6.778 ms
median/6.927 ms mean for MRML versus 21.757 ms median/22.271 ms mean for
rust-lld on this narrow workload. General relocations originating inside
read-only COMDAT payloads and non-COMDAT discontiguous packing remain
incomplete. `mrml doctor` passed; audit retains the unrelated fingerprint
`fnv1a64:0fe5cf1836d3e0dc` at `semantic_execution.rs:1252`. Patent review:
**NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `57a82bd5` makes explicit associative read-only COFF COMDATs follow the
exact text fragment at their validated association root. Fragment decoding
reuses the prepared object inventory, ignores symbols in companions owned by
other roots, and fails closed rather than retaining an excluded section inside
the borrowed read-only span. A four-section adversarial fixture proves distinct
`A` and `B` payload ownership and detached-companion removal. Windows and Arch
Linux each passed 755 compiler-core tests, all four integration groups, seven
driver tests, and the full dependent-package graph. The unchanged stateful
gnullvm probe returns 42 through both linkers: MRML emits 2,560 bytes versus
rust-lld's 3,584, with 1,028 bytes of zero fill and two forwarding pointers.
Fifty links after five warmups measured 5.749 ms median/6.139 ms mean for MRML
versus 22.752 ms median/22.926 ms mean for rust-lld on this narrow workload.
Non-associative read-only COMDAT duplicate selection and arbitrary
discontiguous read-only packing remain incomplete. `mrml doctor` passed; audit
retains the unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at
`semantic_execution.rs:1248`. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Commit `a2b3f5c3` inventories bounded COFF COMDAT section definitions once per
object and validates that associative chains have in-range COMDAT parents,
terminate at a non-associative root, and contain no cycles. PE unwind decoding
binds explicit associative `.pdata$...` and `.xdata$...` companions to the text
section named by their relocations and supports the conventional gnullvm/MinGW
implicit `.pdata$X`/`.xdata$X` to `.text$X` relationship. Reusing the inventory
avoids a symbol-table rescan for every text fragment. Synthetic tests cover
valid roots, malformed metadata, bad parents, cycles, detached companions, and
the existing selection policies. Windows passed 754 compiler-core unit tests,
the four integration groups, and seven driver tests; Arch Linux passed the full
compiler-driver and dependent-package graph. The exact stateful gnullvm probe
returns 42 through both linkers: MRML emits 2,560 bytes versus rust-lld's 3,584,
with 1,028 bytes of zero fill and two forwarding pointers. Fifty measured links
after five warmups produced 9.569 ms median/11.661 ms mean for MRML versus
27.049 ms median/28.860 ms mean for rust-lld on this narrow workload. General
associative read-only payload selection remains incomplete. `mrml doctor`
passed; audit retains the unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at
`semantic_execution.rs:1246`. Patent review: **NOT_TRIGGERED**; see
`docs/patents/REVIEW_LOG.md`.

Commit `16665141` adds bounded COFF text `LARGEST` selection before layout.
The largest raw text definition wins with deterministic leftmost ties; replacing
an earlier winner also replaces its archive/member and exact source-object
identity, preventing discarded code or unwind records from surviving through
stale origin state. Mixed `ANY`/`LARGEST` follows current lld behavior and
resolves as `LARGEST`; the gnullvm lane's mixed `ANY`/`SAME_SIZE` resolves as
`SAME_SIZE` and retains its length check. Tests cover larger-later replacement,
larger-first retention, source-origin propagation, both mixed-policy orders,
and selection byte 6. Windows and Arch Linux each passed 753 core tests, all
four integration groups, seven driver tests, and downstream graph suites. The
exact stateful gnullvm probe still returns 42 through both linkers: MRML emits
2,560 bytes versus rust-lld's 3,584 bytes, with two forwarding pointers and
1,028 zero-fill bytes. Fifty measured links after five warmups produced 9.303
ms median/9.518 ms mean for MRML versus 26.879 ms median/27.059 ms mean for
rust-lld on this narrow workload. `mrml doctor` passed; audit retains unrelated
fingerprint `fnv1a64:0fe5cf1836d3e0dc` at line 1244. Patent review:
**NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `7888330b` adds bounded COFF text `SAME_SIZE` and `EXACT_MATCH`
selection. Admission now requires the COMDAT section characteristic and the
specified leading STATIC section-definition symbol with one auxiliary record.
`SAME_SIZE` compares raw text-section lengths; `EXACT_MATCH` compares raw text
contents, matching the PE/COFF rule and current link.exe/lld behavior without
coupling unrelated read-only sections or symbol metadata. Mixed selection
kinds, unequal sizes or contents, malformed metadata, associative, LARGEST,
and NEWEST remain fail-closed. Windows and Arch Linux each passed 753 core unit
tests, the 2-, 10-, 351-, and 59-test integration groups, seven driver tests,
and all downstream build-graph suites. The exact stateful gnullvm probe returns
42 through both linkers with two forwarding pointers and 1,028 zero-fill bytes;
MRML emits 2,560 bytes versus rust-lld's 3,584 bytes. Fifty measured links after
five warmups produced 9.175 ms median/9.847 ms mean for MRML and 26.384 ms
median/26.877 ms mean for rust-lld on this narrow host/workload. `mrml doctor`
passed; audit retains unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at line
1244. Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `a644bd14` decodes each nonempty COFF text section's section-definition
selection byte and removes duplicate text fragments before generic layout.
Only pairs of `SELECT_ANY` definitions coalesce; the deterministic leftmost
fragment retains its code, local read-only data, definitions, and relocations.
Plain/NODUPLICATES mixtures and unsupported selection kinds fail closed, and
PE runtime-function records are filtered by retained symbol and exact source
object. Synthetic coverage verifies selection-byte decoding, leftmost payload,
strict duplicate rejection, and unsupported-policy rejection. The exact pinned
gnullvm stateful archive remains unchanged: both linkers return 42, MRML emits
2,560 bytes with two valid forwarding pointers and 1,028 zero-fill bytes, and
rust-lld emits 3,584 bytes. Fifty direct-driver links after five warmups measured
MRML at 9.357 ms median/9.596 ms mean versus rust-lld at 27.078 ms median/27.167
ms mean on this narrow host/workload. Windows and Arch Linux each passed 753
core unit tests, the 2-, 10-, 351-, and 59-test integration groups, seven driver
tests, and the build graph's downstream suites. `mrml doctor` passed; audit
retains the unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at line 1244.
Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

Commit `5a477f78` decodes writable COFF section-definition selection metadata and
applies deterministic leftmost `SELECT_ANY` winner selection. Plain and
NODUPLICATES duplicates remain errors; associative and selection kinds 3-7
remain fail-closed. Synthetic adversarial coverage proves the first of two
distinct eight-byte ANY payloads is emitted and a mixed NODUPLICATES pair is
rejected. The exact stateful gnullvm archive continues to return 42 through both
linkers with two valid forwarding pointers and 1,028 zero-fill bytes; MRML emits
2,560 bytes and rust-lld 3,584 bytes. Fifty measured links after five warmups
produced 9.047 ms median/9.239 ms mean for MRML versus 27.601 ms median/27.599
ms mean for rust-lld. Windows passed 751 core unit tests, every integration
group including 59 semantic tests, and six driver tests. After concurrent
compiler commit `3457a638`, Linux passed 752 core unit tests, every integration
group, and six driver tests. `mrml doctor` passed; audit retains unrelated
fingerprint `fnv1a64:0fe5cf1836d3e0dc` at line 1244. Patent review:
**NOT_TRIGGERED**.

Commit `ba02c515` retains the exact gnullvm `.data$\u0001__imp_` writable
NODUPLICATES forwarding records and gives writable `ADDR64` relocations a typed
writable-symbol target alongside the existing readonly target. The strengthened
eight-CGU probe verifies two distinct absolute pointers into the final `.data`
virtual range, cross-object shared-state writes, exact 1,028-byte zero fill, and
exit code 42 from both MRML and pinned rust-lld. MRML emits 2,560 bytes versus
rust-lld at 3,584 bytes. Fifty measured links after five warmups produced 9.564
ms median/9.850 ms mean for MRML and 27.215 ms median/27.585 ms mean for
rust-lld. Windows passed 748 core unit tests, all integration groups including
58 semantic tests, and six driver tests; Linux passed 749 core unit tests, all
integration groups, and six driver tests after concurrent compiler commit
`b9549c4a`. The first Windows attempt collided with another native build that
removed shared temporary rustc objects; the isolated rerun passed. `mrml doctor`
passed; audit retains unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at line
1242. Arbitrary/associative COMDAT selection remains unsupported. Patent
review: **NOT_TRIGGERED**.

Commit `4ed419e5` extends the refptr probe to write both cross-object globals and
proves that the defining archive member observes the shared state. It removes
the driver's all-object refptr count pass and the decoder's redundant per-index
pre-count while retaining the fixed 4,096-record bound. Identical inputs still
produce exit code 42; MRML emits 2,560 bytes and pinned rust-lld emits 3,584
bytes. Fifty direct-driver iterations after five warmups measured MRML at 9.067
ms median/9.267 ms mean versus rust-lld at 26.240 ms median/26.410 ms mean. This
is a strong narrow stateful eight-CGU result, not broad linker superiority or a
controlled attribution to one optimization. The focused probe and driver build
passed; a later driver-suite rebuild stopped before linker tests on unrelated
uncommitted wide-shift work comparing `RuntimeWidth` with an integer. Patent
review: **NOT_TRIGGERED**.

Commit `1974315f` resolves cross-object Rust global reads through the exact
gnullvm `.rdata$.refptr.*` shape. The bounded decoder requires one zeroed
eight-byte record, one AMD64 `ADDR64` relocation, and one undefined external
target; the PE serializer patches the pointer after final writable layout. The
durable entry object reads exported initialized and zero-fill globals defined in
an eight-CGU `.rlib`. MRML emits 2,560 bytes and pinned rust-lld emits 3,584
bytes from identical inputs; both return 42, and MRML reports the exact 1,028
zero-fill bytes. The Windows core suite passed 746 unit tests and every focused
integration group, including 56 semantic execution tests; the Windows driver
suite passed six tests. After concurrent compiler commit `e150ea74`, Linux
passed 747 core unit tests, every integration group, and all six driver tests.
`mrml doctor` passed; audit retains unrelated fingerprint
`fnv1a64:0fe5cf1836d3e0dc` at line 1238. Patent review:
**NOT_TRIGGERED**.

Commit `0bd379cc` extends selected PE writable storage to exact external
storage-class-2 `.data$` and `.bss$` definitions. The eight-CGU probe now reads
one exported initialized global and one exported zero-fill global from their
defining codegen unit. MRML reports 1,028 zero-fill bytes and emits 2,560 bytes;
pinned rust-lld consumes identical inputs and emits 2,048 bytes, and both return
42. Exact unreferenced gnullvm `.data$\u0001__imp_` forwarding slots are
excluded; cross-object global references through those slots remain fail-closed.
All six Windows driver tests passed. Patent review: **NOT_TRIGGERED**.

Commit `a73a3af7` adds bounded stateful multi-CGU PE linking for exact
object-local gnullvm `.data$` and `.bss$` definitions and their AMD64 `REL32`
references. The durable eight-CGU `.rlib` probe contains eight initialized
statics and eight 128-byte zero-fill arrays. MRML reports 1,024 bytes of
uninitialized data and emits a `.data` virtual extent larger than its raw file
extent; MRML and pinned rust-lld consume identical inputs, emit 2,048-byte and
1,536-byte images respectively, and both return 42. All 745 Linux core unit
tests and all six Linux driver tests passed. The combined Linux suite then
stopped in unrelated concurrent wide-multiply semantic work with
`UnsupportedRuntimeOperator`; Windows `mrml doctor` passed, while `mrml audit`
retains the unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` at line 1236.
External writable definitions, writable COMDAT selection, TLS, and base
relocations remain fail-closed. Patent review: **NOT_TRIGGERED**.

Commit `a83c5fa1` adds durable public-route evidence for a genuine pinned
Windows gnullvm `.rlib`: 18,280 bytes with two metadata members and eight COFF
codegen-unit objects containing 32 non-inlined functions across eight modules.
An external entry and the archive link through explicit `link-pe` and pinned
rust-lld from identical inputs; both outputs return 42. MRML emits 2,048 bytes
and rust-lld 1,536 bytes. Fifty direct-driver iterations after five warmups
measured MRML at 5.269 ms median/5.562 ms mean versus rust-lld at 22.565 ms
median/22.645 ms mean. This is a strong narrow multi-member archive advantage,
not general `.rlib` or broad speed superiority. `mrml doctor` passed; audit
retains the unrelated fingerprint `fnv1a64:0fe5cf1836d3e0dc` (now at the
concurrently shifted line 1234). Patent review: **NOT_TRIGGERED**.

Commit `d4c9e64a` adds symmetric explicit `link-pe` and `compile-pe` operations
to the experimental compiler frontend. They route COFF inputs or one supported
custom-compiler source function through the existing MRML-owned PE32+
serializer without rust-lld or fallback. A durable Windows probe emitted a
1,024-byte import-free PE and returned exit code 42. Windows and Linux each
passed all 119 build-frontend tests and warnings-denied Clippy; Windows
`mrml doctor` passed. `mrml audit` retains the unrelated external-command
fingerprint failure named below. Ordinary production builds still use pinned
upstream rustc/rust-lld until their profile gate passes. Patent review:
**NOT_TRIGGERED**.

Commit `6ee7106f` adds the canonical explicit experimental source-to-linker
operation: `mrml compiler mrml-rustc-experimental compile-elf INPUT --function
NAME -o OUTPUT [--release]`. It builds the declared driver, invokes custom
MRML source compilation plus the MRML-owned ELF serializer, supplies the
driver's bounded 32 MiB Linux child stack, and never invokes or falls back to
rust-lld. Production mode remains unavailable. A durable terminal-assembly
probe emitted a 4,097-byte ELF and reached the expected hosted Linux `SIGTRAP`
status 133. Windows and Linux each passed 119 build-frontend tests and
warnings-denied Clippy; Windows `mrml doctor` passed. `mrml audit` still stops
at the unrelated semantic-execution external-command fingerprint
`fnv1a64:0fe5cf1836d3e0dc`; no audit success is claimed. This proves one
supported source function reaches the owned linker through the public frontend,
not production compiler readiness or general crate compilation. Patent review:
**NOT_TRIGGERED**.

Commit `08e05e53` uses a GNU thin archive's untrusted symbol index to open only
candidate external objects when preceding inputs have an exact bounded symbol
inventory. Every selected candidate is independently inventoried, transitive
references reach a stable fixed point, and empty metadata placeholders preserve
original member identities without reading unused files. Missing indexes and a
preceding ordinary archive conservatively retain eager materialization. The
durable three-member probe deletes an indexed but unreferenced external object;
MRML still selects the helper and its transitive leaf and exits 42. The probe
restores the unused file for exact pinned gnullvm rust-lld, which also exits 42.
MRML emitted 4,134 bytes and rust-lld emitted 1,416 bytes. Windows passed 744
core tests, integrations of 2/10/351/52, and six driver tests. Concurrent
compiler work advanced the Linux run to 745 core tests and integrations of
2/10/351/53; all passed with six driver tests. Formatting and `mrml doctor`
passed. `mrml audit` still stops at the unrelated concurrently modified
semantic-execution command fingerprint `fnv1a64:0fe5cf1836d3e0dc`; no audit
success is claimed. General `.rlib` compatibility, production linker selection,
and broad performance superiority remain unproven. Patent review:
**NOT_TRIGGERED**.

Follow-up `4bcd7f6c` retains each selected external mapping through ordered
materialization instead of opening the file again, and copies inventoried names
directly into the owned bounded queues without intermediate borrowed vectors.
The Linux driver suite and differential exit-42 probe passed. A durable
50-iteration/five-warmup process benchmark measured MRML at 5.055 ms median and
5.109 ms mean versus pinned rust-lld at 4.592 ms median and 4.614 ms mean on the
tiny three-member archive. This records a negative speed result: reduced I/O
did not overcome remaining startup and parsing overhead, and no superiority is
claimed. Patent review: **NOT_TRIGGERED**.

Follow-up `156c5b10` makes the benchmark scale deterministically to the bounded
member limit. With 1,000 unreferenced external objects, 50 iterations after
five warmups measured MRML at 4.844 ms median and 4.902 ms mean versus pinned
rust-lld at 7.490 ms median and 7.509 ms mean. This is a narrow, reproducible
metadata-heavy thin-archive advantage, not representative Rust-build or general
linker superiority.

Commit `21f59d59` admits exact allocated `.tdata.*` and `.tbss.*` sections,
retains typed `STT_TLS` definitions, applies checked local-exec
`R_X86_64_TPOFF32` offsets from the end of the contiguous TLS block, and emits
an aligned read-only `PT_TLS` header with distinct file and memory extents.
General-dynamic and initial-exec relocation families remain fail-closed. The
independently authored Rust 2024 probe explicitly installed a two-word test
thread block through hosted Linux `arch_prctl`, observed initialized TLS value
7 and zero TLS value 0, wrote 20 and 22, and exited 42 through MRML and exact
pinned gnullvm rust-lld. Both program headers reported an eight-byte file
template, 16-byte memory template, and eight-byte alignment; MRML emitted 8,216
bytes and rust-lld emitted 1,960 bytes. This does not claim production runtime
thread-pointer or TLS lifecycle integration. Windows and native Arch Linux
each passed 742 core tests, integrations of 2/10/351/51, and five driver tests.
Formatting and `mrml doctor` passed. `mrml audit` still stops at the unrelated
concurrently modified semantic-execution command fingerprint
`fnv1a64:0fe5cf1836d3e0dc`; no audit success is claimed. Patent review:
**NOT_TRIGGERED**.

Commit `858d4606` implements bounded conventional ELF `SHN_COMMON` resolution
through object inventory, reachability, selected definitions, layout, and
relocation. Regular global definitions override COMMON, COMMON overrides
regular weak definitions, and repeated tentative declarations coalesce to one
zero-filled RW allocation using their maximum size and power-of-two alignment.
Size/alignment arithmetic is checked, alignment is capped at one page, function
symbols and malformed declarations fail closed, and COMMON extends memory but
not file payload. Independently authored Rust 2024 objects declared 8-byte/
alignment-8 and 24-byte/alignment-32 forms; MRML and exact pinned gnullvm
rust-lld both observed zero initialization, a subsequent writable value, and
exit 42. With an initialized regular definition present, both selected its
value and exited 42. MRML emitted 8,192-byte and 8,200-byte executables versus
rust-lld's 1,480-byte and 1,456-byte outputs. Windows and native Arch Linux each
passed 742 core tests, integrations of 2/10/351/51, and five driver tests.
`mrml doctor` passed. `mrml audit` advanced past the two existing linker test
subprocess sites registered by this milestone, then stopped at fingerprint
`fnv1a64:0fe5cf1836d3e0dc` in the concurrently modified
`semantic_execution.rs`; no audit success is claimed. TLS, dynamic symbols,
thin archives, production linker selection, and broad performance superiority
remain unproven. Patent review: **NOT_TRIGGERED**.

Commit `a848495d` extends retained ELF constructors to canonical unsuffixed
preinitializers plus priority-suffixed and unsuffixed initializers/finalizers.
Numeric priorities are bounded to `u16` and stable-sorted ascending, with
unsuffixed entries last; runtime code traverses finalizers backward. The layout
resolves all six conventional `__preinit_array_*`, `__init_array_*`, and
`__fini_array_*` boundaries, while an explicit input definition wins. The
independently authored Rust 2024 probe invoked one preinitializer, two ordered
initializers, and two reverse-traversed finalizers through those boundaries;
MRML and pinned gnullvm rust-lld both reached the exact state and exited 42.
Their executables measured 8,232 and 3,072 bytes. Windows and native Arch Linux
each passed 740 core tests, integrations of 2/10/351/50, and five driver tests.
Current 50-iteration/five-warmup samples measured MRML/rust-lld at 5.983/5.247
ms for the tiny trait object, 5.433/5.341 ms for the transitive 16-CGU archive,
and 6.139/6.669 ms for reachable pinned libcore. Only the larger sample was
faster in that run; no general superiority claim follows. Automatic production
startup-runtime invocation remains unproven. Patent review: **NOT_TRIGGERED**.

Commit `e2ab220a` automatically retains the conventional unsuffixed
`.init_array`/`SHT_INIT_ARRAY` section, inventories it in the same one-time
cross-object metadata pass as COMDAT groups, gives it a typed writable layout
class, and applies checked static relocations to its entries. Admission requires
`SHF_ALLOC|SHF_WRITE`, permits only the pinned rustc's optional
`SHF_GNU_RETAIN`, requires eight-byte alignment and size, and accepts only
`sh_entsize` zero or eight. The independently authored Rust 2024 probe leaves
the initializer uncalled by `start`; MRML and pinned gnullvm rust-lld both
retained its exact `mov eax, 7; ret` body and produced exit-42 executables of
8,200 and 1,536 bytes. Windows and native Arch Linux each passed 739 core tests,
integrations of 1/10/351/49, and five driver tests. Current 50-iteration/five-
warmup samples measured MRML/rust-lld at 5.726/5.359 ms for the tiny trait
object, 5.680/5.317 ms for the transitive 16-CGU archive, and 6.342/6.847 ms for
reachable pinned libcore. Only the larger sample was faster in that run; no
general superiority claim follows. Runtime constructor iteration, boundary
symbols, priority suffixes, preinitializers, and finalizers remain unsupported.
Patent review: **NOT_TRIGGERED**.

Commit `7488e00b` retains every validated ordered COMDAT group as a bounded
borrowed winner/loser view and partitions that inventory to the exact object
before each section-closure pass. Cross-object selection therefore no longer
rediscovers `SHT_GROUP` sections for every newly resolved symbol; the public
one-object API retains its local validation path. The durable first/second,
second/first, and discarded-unresolved probes continued to match the exact
pinned gnullvm rust-lld with exits 42, 7, and 42. Windows and native Arch Linux
each passed 735 core tests plus integrations of 1/10/351/46 tests. Final-code
50-iteration/five-warmup samples measured MRML/rust-lld at 5.111/5.109 ms for
the tiny trait-object link, 5.076/5.422 ms for the transitive 16-CGU archive,
and 5.700/7.097 ms for reachable pinned libcore. This is parity on the tiny
sample and a measured advantage on those two archive samples, not a general
superiority claim. Patent review: **NOT_TRIGGERED**.

Commit `63997977` inventories up to 4,096 validated COMDAT groups before
cross-object symbol resolution. Exact input order selects the first signature;
sparse borrowed loser-group views hide later definitions and relocation edges
without a 512 KiB common-path bitmap. Independently compiled strong `helper`
groups return 42 and 7: MRML and pinned rust-lld both returned 42 in
first/second order and 7 in second/first order. A losing group with an absent
dependency was discarded before unresolved-symbol closure by both linkers and
the output still exited 42. Focused COMDAT tests passed on Windows and native
Arch Linux. Full runs passed 733 of 734 core tests on both hosts before the
same unrelated concurrently modified wide-return diagnostic assertion failed
(`OutputTooSmall` versus expected `RuntimeExpressionUnsupported`); 119 frontend
tests, clippy, and five Windows driver tests passed. Current benchmarks measured
MRML/rust-lld at 5.206/4.640 ms for the tiny trait-object link and 5.617/6.076
ms for reachable pinned libcore. Repository audit remained blocked first by
unrelated fingerprint `fnv1a64:041772d31cad5bfc`.

Commit `cb5a52bb` validates `SHT_GROUP`/`GRP_COMDAT` records against the exact
symbol table and retains every allocatable member when any member is reachable.
It rejects invalid entry widths, unnamed/non-global signatures, unsupported
flags, missing `SHF_GROUP`, and out-of-range members. A synthetic group proves
two-member atomic closure and malformed flags/indices; the exact pinned
libcore object's `DW.ref.rust_eh_personality` COMDAT passes through the release
driver. Its reachable-core output remained 8,674 bytes and exited 42; the
50-iteration/five-warmup run measured MRML at 6.072 ms median versus pinned
rust-lld at 7.323 ms. Windows and Linux each passed 734 core tests and
integrations of 2/10/351/44 tests. Duplicate COMDAT winner selection across
objects remains unsupported and is not claimed.

Commit `56d073ae` carries each fully validated ELF section-table, symbol-table,
and string-table view through the cross-object reachability queue. This removes
the prior per-symbol ELF header validation, section scan for `.symtab`, and
repeat slicing while keeping the public one-object path and fail-closed checks.
A focused assertion proves even an unused malformed input is rejected. Current
50-iteration/five-warmup Linux samples measured MRML versus pinned rust-lld at
5.330/4.847 ms (trait object), 5.220/4.806 ms (one archive), 5.258/5.138 ms
(transitive 16-CGU archive), and 5.742/6.234 ms (reachable pinned libcore).
Linux passed 733 core tests and integrations of 2/10/351/43 plus five driver
tests. Windows passed the same 733 core tests and five driver tests; its new
43-test semantic-execution suite had one unrelated concurrent wide-division
failure (`RuntimeExpressionUnsupported`). The repository audit still stopped
first at unrelated fingerprint `fnv1a64:041772d31cad5bfc`.

Commit `08dcb3d4` admits the AMD64 psABI `R_X86_64_32S` relocation as a
separate typed case, computes `S + A`, and rejects results outside the exact
signed 32-bit range. A focused test covers decode, patching, and overflow. The
durable pinned-rustc probe plus `readelf` confirmed relocation type 11; MRML and
the exact pinned gnullvm rust-lld outputs both exited 42 under Arch Linux WSL.
MRML emitted 8,193 bytes and rust-lld 1,504 bytes, which is compatibility rather
than equivalent size/performance evidence. Windows passed 732 core tests and
integrations of 2/10/351/40 tests before a concurrent compiler milestone
advanced the graph; current Linux passed 733 core tests and integrations of
2/10/351/42 tests. Repository audit remained blocked first by the unrelated
undeclared compiler-core command site with fingerprint
`fnv1a64:041772d31cad5bfc`.

Commit `949b50d3` exposes the MRML-owned static ELF path through the explicit
public command `mrml compiler mrml-rustc-experimental link-elf`. The frontend
builds the declared driver through the native dependency graph, forwards the
bounded ordered inputs, entry, and output, and declares the new process boundary
by exact input-audit fingerprint. `mrml-rustc-production` remains unavailable
and fails before output; ordinary builds still use the pinned upstream
production toolchain. A three-object Windows-host invocation produced a
4,134-byte ELF that exited 42 under native Arch Linux WSL. Exact Windows gates
were `cargo +nightly-2026-08-24-x86_64-pc-windows-gnullvm fmt --check`, 119
frontend tests, and clippy with `-D warnings`, all passing. The repository-wide
`mrml audit` stopped first at an unrelated concurrently modified compiler-core
external-command site (`packages/compiler/core/src/linker.rs:7262`, fingerprint
`fnv1a64:041772d31cad5bfc`); this milestone did not modify or stage that work.

Commit `e454dfa9` adds a borrowed detailed selection error that preserves the
exact unresolved ELF symbol while the compatibility wrapper retains the prior
typed `LinkerError`. The public driver now reports names such as `memset`
without allocating or weakening fail-closed resolution. The durable
`docs/compiler/probes/core_breadth_consumer.rs` probe retains five distinct
pinned-libcore exports; with the explicitly test-only memory/panic providers in
`docs/compiler/probes/controlled_runtime_symbols.rs`, the public driver emitted
a 20,528-byte selected ELF that exited 42 under Arch Linux WSL. Without those
providers it identified `memset`, then `memcpy`, and finally the pinned panic
endpoint exactly. This separates final-artifact runtime inputs from linker
semantics and is not production compiler-runtime evidence. Windows passed 730
core tests, integrations of 2/10/351/38 tests, and five driver tests. After one
transient concurrent-CGU artifact race, Linux reran cleanly with 730 core tests,
integrations of 2/10/351/40 tests, and five driver tests; the count advanced
while an independent compiler task completed.

Commit `6d35c386` admits conventional x86-64 `R_X86_64_32` records in the
selected-section path and applies checked unsigned `S + A` arithmetic, failing
closed when the result does not fit four bytes. The exact pinned libcore archive
contains 8,403 such relocations. An independently authored pinned-rustc object
with an `R_X86_64_32` reference linked through the public driver and exited 42
under Arch Linux WSL. Windows gnullvm and native Arch Linux WSL each passed 729
core unit tests, the 2/10/351/36-test integration suites, and five driver tests.
This is exact relocation and controlled hosted execution evidence, not general
libcore conformance.

Commit `c227bd73` caches each input's validated ELF symbol/string table view
during cross-object reachability, reuses the already decoded selected-section
view for definition and relocation decoding, and bypasses the two 4,096-symbol
archive queues when every input is an explicit object. Windows gnullvm and
native Arch Linux WSL each passed 727 core unit tests, the 2/10/351/35-test
integration suites, and five driver tests. In 50-iteration/five-warmup Linux
release measurements, MRML versus exact pinned rust-lld measured 5.384 versus
4.982 ms median for the trait-object probe, 5.387 versus 4.972 ms for writable
pointers, 5.011 versus 4.953 ms for one archive, and 5.670 versus 6.974 ms for
the reachable pinned-libcore probe; every executable returned 42. Thus MRML
remains faster on the recorded core workload but not on the tiny explicit-
object probes. These are narrow hosted regression measurements, not a general
speed claim.

Commit `608f811a` replaces the final legacy whole-object dependency in ELF GNU
archive selection with a bounded symbol inventory over validated symbol,
string, and RELA tables. It records at most 4,096 global/weak definitions and
actual relocation-referenced undefined names without classifying unrelated
content sections; the archive index remains only an independently checked
lookup hint. The exact pinned 3,150,398-byte `libcore` archive now passes
inventory, selects its 3,104,472-byte/1,702-section object, and reaches selected
linking. A strengthened entry-retained pointer to
`_RNvNtCs5erv4YX8a5g_4core3fmt17pointer_fmt_inner` caused that core function
and its transitive sections to be linked into an 8,674-byte ELF, which executed
on controlled Arch Linux/WSL with exit code 42. Windows and Linux each passed
726 core unit tests and every integration suite; both driver suites passed five
tests. A 50-iteration/five-warmup release-driver measurement of this reachable
core workload recorded MRML at 5.692 ms median and 5.775 ms mean versus exact
pinned rust-lld with equivalent section GC at 6.591 ms median and 6.604 ms
mean; both outputs exited 42. This is narrow hosted regression evidence, not a
general speed claim. Broader rustc object-family conformance and optimization
remain active gates.

Commit `f74e0489` adds a bounded cross-object ELF reachability fixed point and
cuts the Linux compiler-driver link path over to selected sections. Starting at
the exact entry, local RELA edges are expanded within objects and undefined
names select conventional strong-over-weak definitions in other objects;
duplicate strong definitions and unresolved names fail closed. The driver now
builds typed selected content/definition/relocation views and emits them through
the new executable serializer, removing its obsolete whole-object ELF unwind
and writable assembly path. A Windows-built driver linked three Linux objects
to 4,142 bytes, and the result executed on controlled Arch Linux/WSL with exit
code 42. Windows passed 725 core unit tests and five driver tests; Linux passed
725 core unit tests, every integration suite, and five driver tests. GNU archive
index scanning still uses the legacy whole-object ELF inventory path, so actual
pinned-core archive extraction remains the next integration gate.

Commit `f811de1a` serializes the selected and relocated payload into a
fixed-address import-free ELF64 executable. It emits only present RX, R, and RW
`PT_LOAD` regions, keeps headers read-only, carries zero-fill through distinct
file and memory sizes, and binds the executable entry to the resolved selected
function. Structural probes verify the entry, program-header count, and
page-separated read-only payload. The selected-section executable was written,
made executable, and run on the controlled Arch Linux/WSL host with exit code
42. Windows and Linux each passed 725 core unit tests and every integration
suite. Driver/archive integration, broader pinned-rustc object coverage,
pinned-core symbol execution, and comparative performance optimization remain
unimplemented gates.

Commit `8c16729a` copies selected section content into the frozen layout,
resolves exact external names with conventional strong-over-weak selection,
rejects duplicate strong definitions, computes an exact selected function entry
offset, and applies x86-64 absolute-64, PC-relative-32, PLT-relative-32, and
instruction-shape-validated GOTPCREL relocations. Local targets retain input and
section identity through relocation; zero-fill remains memory-only. A focused
three-object probe verifies the external call displacement, local read-only
reference, copied payload, entry, and file/memory extents. Windows and Linux
each passed 724 core unit tests and every integration suite. ELF executable
serialization from this payload, driver/archive integration, broader rustc
object coverage, and pinned-core symbol execution remain unimplemented gates.

Commit `8e8bbcdc` adds the first shared layout pass over selected ELF objects.
It groups reachable sections deterministically into executable, read-only plus
unwind, initialized writable, and zero-fill regions; honors each validated
power-of-two alignment; introduces page boundaries only for permission regions
that exist; and reports distinct file and memory extents. The result retains
input and section identities for subsequent symbol and relocation resolution,
with 256 total laid-out sections as the current explicit bound. A focused
three-object probe verifies aligned text placement, the RX-to-R page boundary,
read-only extent, and absence of a spurious RW page. Windows and Linux each
passed 724 core unit tests and every integration suite. Cross-object symbol
resolution, relocation application, selected-section executable serialization,
and pinned-core symbol execution remain unimplemented gates.

Commit `6f8f03b2` decodes externally resolvable definitions only from selected
sections. The bounded typed records retain exact names, global versus weak
binding, default versus hidden visibility, function/object/unspecified kind,
section identity, value, and size; local symbols remain section-relative RELA
targets instead of entering the cross-object namespace. Symbol extents and the
256-definition result bound fail closed. Focused probes cover selected function
definitions in text-plus-external-call and text-plus-read-only objects. Windows
and Linux each passed 724 core unit tests and every integration suite. The
selected content, definition, and relocation views now provide the inputs for
the next cross-object resolution and layout pass; section-GC executable
emission and pinned-core symbol execution remain unimplemented gates.

Commit `ac80c7a9` decodes only `RELA` records whose destination sections were
admitted by the exact-object reachability selection. The allocation-free typed
result distinguishes x86-64 absolute-64, PC-relative-32, PLT-relative-32, and
GOT-PC-relative-32 records, preserves raw addends, retains selected local
section identity and offsets, and leaves exact external names unresolved for
the later cross-object pass. Destination widths, symbol records, linked symbol
tables, section targets, and the 256-relocation result bound fail closed.
Focused probes cover an external PLT call and a local text-to-read-only PC
relative reference. Windows and Linux each passed 724 core unit tests and every
integration suite. Selected definition decoding, cross-object layout and
relocation application, section-GC executable emission, and pinned-core symbol
execution remain unimplemented gates.

Commit `190c1448` adds an allocation-free typed view over the sections admitted
by the ELF reachability graph. Each selection is bound to its exact object
slice, and the decoder validates ordered indices, the section-name table,
content bounds, sizes, power-of-two alignments, section types, and allocation,
write, and execute flags before classifying text, read-only, writable,
zero-fill, and unwind sections. A selection from another object fails closed.
Focused probes decode root text alone and root text plus locally referenced
`.rodata` without admitting unrelated sections. Windows and Linux each passed
723 core unit tests and every integration suite. Selected relocation decoding,
layout consumption, section GC in emitted executables, and pinned-core symbol
execution remain unimplemented gates.

Commit `323bef47` adds a typed allocation-free ELF section graph pass. Exact
defined roots traverse same-object RELA symbol edges to an ordered fixed point
under the 2,048-section inventory and 256-result bounds. The pass validates the
symbol/string-table relationship, 24-byte symbol and relocation entries,
relocation target/link fields, and every symbol and section index. Undefined
and absolute symbols add no same-object edge; missing roots and malformed or
oversized graphs fail closed.

Focused probes show an external call retains only root text, while a local
read-only relocation retains exactly root text and its `.rodata`; missing roots
are rejected. Windows and Linux each passed 723 core unit tests and every
integration suite. The current decoder/layout does not consume this selection
yet, so section GC, smaller outputs, and pinned-core symbol execution remain
unimplemented gates.

Commit `9af463ed` separates section inventory bounds: COFF remains at 256,
while the primary, unwind, and writable ELF64 passes admit at most 2,048
headers. Exact member-decoder errors are now preserved through the driver. A
consumer retaining a pointer to exported pinned-core symbol
`_RNvNtCs5erv4YX8a5g_4core3fmt17pointer_fmt_inner` selects the 3,104,472-byte
core object and passes its archive, size, index, and 1,702-section inventory
gates before failing closed on the next unsupported ELF feature. Its relocated
read-only section families require section-level dependency/GC and read-only
relocation modeling rather than whole-object admission. Windows and Linux each
passed 722 core unit tests, every integration suite, and five driver tests.
Actual core-symbol extraction remains incomplete.

Commit `951ae996` gives the hosted linker bounded owning read-only mappings
instead of copying complete inputs. Length is validated against 64 MiB before
mapping, empty files need no OS mapping, consumers receive only immutable
slices, the native file stays alive, and the mapping is released exactly once
before the file closes. Windows and Linux each passed 45 runtime tests and five
driver tests.

On identical current 50-iteration/five-warmup samples, the exact 3,150,398-byte
pinned `libcore` archive measured MRML at 4.835 ms median versus rust-lld at
5.251 ms; the transitive 16-codegen-unit `.rlib` measured 4.869 versus 5.205
ms; and the controlled 301-object archive measured 4.921 versus 5.372 ms. All
outputs retained their expected exit-42 behavior. These are three hosted
positive regression samples, not proof of general speed superiority.

Commit `de661af6` raises the hosted per-input bound to an explicit 64 MiB,
preallocates bounded file reads from validated metadata, and admits LLVM's
single GNU-index alignment NUL only after an odd-length fully consumed name
area. Arbitrary trailing bytes, oversized files, invalid offsets, and malformed
names still fail closed.

The exact ORACLE-0002 `libcore` archive is 3,150,398 bytes with 551 indexed
symbols, two metadata members, and one 3,104,472-byte rustc object. Appended to
an independent entry needing no core symbol, MRML skipped the object, emitted
8,264 bytes, and exited 42; rust-lld emitted 1,664 bytes. A 50-iteration/five-
warmup sample recorded MRML at 6.769 ms median versus pinned rust-lld at 5.634
ms, making faster large-file ingestion an explicit remaining gate. Windows
passed 721 core unit tests and all integrations; Linux passed the same 721 core
unit tests but one concurrent wide-integer integration probe outside linker
files failed with `RuntimeExpressionUnsupported`. Both platforms passed 44
runtime tests and five driver tests. This proves unused pinned-core archive
admission, not general core symbol extraction or speed superiority.

Commit `24ae8794` replaces repeated full archive-index/reference rescans with a
bounded cursor over unresolved symbols. A selected object's named relocations
append new work to the same queue, preserving exact validated lookups,
left-to-right archive ordering, independent object-definition confirmation,
and transitive fixed-point extraction.

In the genuine 16-codegen-unit pinned-rustc `.rlib`, the consumer referenced
only `diverse_31`; that member's relocation then required `diverse_11` from a
different member. MRML selected both transitively, emitted 8,344 bytes, and
exited 42 like rust-lld's 1,880-byte result. A 50-iteration/five-warmup sample
recorded MRML at 4.577 ms median versus pinned rust-lld at 4.700 ms. The
301-object controlled archive measured MRML at 4.902 ms versus rust-lld at
4.886 ms in the same run, an effective tie rather than superiority evidence.
Windows and Linux retained five driver passes; the unchanged core retained its
previous exact 720-test passes on both platforms. These are narrow hosted
regression results, not general `.rlib` compatibility or speed claims.

Commit `42bc337b` separates indexed archive inventory from admitted linker
work. The decoder can inventory at most 1,024 independently framed ordinary
members while the existing final bound remains 256 selected objects/fragments
and 4,096 index symbols. A 301-member focused archive containing one valid
indexed entry object and 300 unreferenced invalid payloads selected only the
entry on both pinned platforms, proving that the larger inventory does not
eagerly decode its irrelevant tail. Windows and Linux each retained 720
compiler-core passes and five driver passes. A controlled 319,802-byte archive
of one real provider and 300 copies of a real unused ELF object linked to a
12,304-byte exit-42 executable. A 50-iteration/five-warmup measurement recorded
MRML at 5.063 ms median versus pinned rust-lld with `--eh-frame-hdr` at 5.302
ms; rust-lld emitted 2,080 bytes. This is bounded synthetic scaling evidence,
not representative `.rlib` diversity or a general speed claim; large real-
library benchmarks and the remaining format/relocation gates are still
required.

The same implementation also linked a genuine 85,332-byte pinned-rustc
`.rlib` containing metadata plus 16 distinct codegen-unit object members. An
independent consumer referenced functions from two members; MRML emitted 8,432
bytes and exited 42, matching rust-lld's behavior. A 50-iteration/five-warmup
measurement recorded MRML at 4.306 ms median versus pinned rust-lld with
`--eh-frame-hdr` at 4.981 ms; rust-lld emitted 2,120 bytes. This is diverse
small no-std archive evidence, not general `.rlib` coverage or a broad speed
claim.

Commit `34b6c6ef` uses a validated GNU archive index to compute a bounded,
left-to-right unresolved-symbol closure before admitting members to the full
decode/layout pipeline. Selected mappings are confirmed against independently
decoded object definitions, admitted members retain archive order, and an
unindexed archive disables later pruning so missing metadata cannot be treated
as completeness evidence. Commands without indexed archives retain the prior
eager path and do not pay the new preliminary symbol scan.

A focused driver test places an invalid unindexed member beside an indexed
entry object and proves that the irrelevant member is never decoded. The exact
ORACLE-0002 indexed data-provider `.rlib` linked to a 12,304-byte ELF and exited
42 under Arch Linux WSL. Windows and Linux each passed 720 compiler-core tests
and five driver tests. A 50-iteration/five-warmup identical-input measurement
recorded MRML at 4.680 ms median versus pinned rust-lld with `--eh-frame-hdr` at
4.887 ms; rust-lld emitted 2,080 bytes. This one-member archive is narrow
correctness/regression evidence, not representative scaling evidence or a
general speed claim. The 256-member archive bound and large representative
`.rlib` benchmarks remain open gates.

Commit `1f427bea` decodes the GNU 32-bit `/` and 64-bit `/SYM64/` archive
symbol indexes as bounded, untrusted acceleration hints. It caps an archive at
4,096 indexed symbols, validates every big-endian member offset against an
independently parsed ordinary member header, validates nonempty NUL-terminated
UTF-8 symbol names, rejects duplicate index members and trailing index data,
and exposes exact symbol-to-member lookup without letting index contents
authorize or substitute for object decoding.

Under exact ORACLE-0002 Arch WSL, an actual rustc-produced indexed `.rlib`
containing rustc metadata, a metadata-link object, and a data-only provider
object linked to a 12,304-byte ELF that exited 42. The pinned Windows suite
passed 718 compiler-core tests and four driver tests; the pinned Linux suite
passed 720 compiler-core tests and four driver tests. A 50-iteration/five-warmup
identical-input measurement recorded MRML at 4.745 ms median versus pinned
rust-lld with `--eh-frame-hdr` at 5.659 ms; rust-lld emitted 2,080 bytes. The
driver still scans archive members eagerly and retains the 256-member cap, so
this is parser and regression evidence rather than a claim that the index has
accelerated extraction or that MRML is generally faster than rust-lld.

Commit `8ac039f3` retains allocated zero-sized `.rodata.*` sections as typed
local identities. A zero-valued relocation target maps to the owning input's
read-only base only for conventional PROGBITS/A identity and power-of-two
alignment at most 16; nonzero values and unrepresented stronger alignment fail
closed. No payload bytes are invented.

Under exact ORACLE-0002 Arch WSL, an independently authored optimized trait
object emitted a zero-byte concrete static, a 32-byte `.data.rel.ro.*` vtable,
an initialized fat pointer, three absolute relocations, two writable text
references, and two FDEs. MRML's 12,344-byte ELF preserved separated loads and
virtual dispatch exited 42. Windows and Linux each passed 717 compiler-core
tests and four driver tests. A 50-iteration/five-warmup identical-input
measurement recorded MRML at 5.092 ms median versus pinned rust-lld with
`--eh-frame-hdr` at 5.241 ms; rust-lld emitted 2,128 bytes. This is narrow
hosted regression evidence, not general trait/vtable, speed, or ABI coverage.

Commit `c7ee96a5` makes global definitions explicitly typed as text or
read-only-data locations. ELF decoding can therefore admit an object with empty
text and a primary global `.rodata.*` definition, validate all definition
offsets against the correct extent, select a data-only archive member through
the existing non-text dependency path, and resolve named PC-relative or
absolute references through the frozen text/read-only layout.

Under exact ORACLE-0002 Arch WSL, an independently authored consumer stored a
pointer to external `VALUE`; its later archive provider contained empty `.text`
and one 8-byte global `.rodata.VALUE`. MRML selected it, emitted a 12,304-byte
ELF with separate RX/R-NX/RW-NX storage, and exited 42. Windows and Linux each
passed 716 compiler-core tests and four driver tests. A
50-iteration/five-warmup identical-input measurement recorded MRML at 4.681 ms
median versus pinned rust-lld with `--eh-frame-hdr` at 4.841 ms; rust-lld
emitted 2,080 bytes. This is narrow hosted evidence, not a general speed or
compatibility claim. Global writable/TLS definitions and weak/versioned or
dynamic symbol semantics remain unsupported.

Commit `3bfb0d8e` admits initialized-data `R_X86_64_64` targets that name a
text definition in another object. The primary decoder represents undefined
absolute targets as non-text dependencies for left-to-right archive selection
and missing-symbol validation without inventing a patchable text field. The
writable decoder retains the symbol identity, validates exact symtab/string
links and global undefined binding, and resolves the final fixed address through
the frozen global text layout. Dependency and patch records remain bounded.

Under exact ORACLE-0002 Arch WSL, an independently authored consumer stored an
external function in initialized data while its provider was placed in a later
ordinary archive. The dependency selected the provider member and the
12,304-byte ELF exited 42. Windows and Linux each passed 715 compiler-core
tests and four driver tests before final symbol-table hardening. After that
hardening, both platform driver checks and the exact Linux release-driver probe
passed again; a later Windows full-core rerun was blocked by concurrent
unrelated `codegen/tests.rs` work missing `format!`. A 50-iteration/five-warmup
identical-input measurement recorded MRML at 4.690 ms median versus pinned
rust-lld with `--eh-frame-hdr` at 5.019 ms; rust-lld emitted 2,008 bytes. This
is narrow hosted evidence, not general speed or Rust-library compatibility.

Commit `018f11ee` extends bounded initialized-data `R_X86_64_64` relocation
targets to initialized and zero-fill storage in the same selected input. The
decoder preserves distinct typed identities and checked section-relative
offsets; the serializer resolves them through exact per-input RW layouts and
revalidates each target extent before writing an address.

Under exact ORACLE-0002 Arch WSL, an independently authored optimized object
held one pointer to initialized storage and one pointer to BSS. Both absolute
records and both text references linked into a 12,312-byte ELF that exited 42.
Windows and Linux each passed 714 compiler-core tests and four driver tests. A
50-iteration/five-warmup identical-input measurement recorded MRML at 4.859 ms
median versus pinned rust-lld with `--eh-frame-hdr` at 4.869 ms; rust-lld
emitted 2,200 bytes. The 0.010 ms difference is treated as process-startup
noise and narrow regression evidence, not a speed claim.

Commit `a1745b2c` admits bounded `R_X86_64_64` relocations from selected
initialized `.data.*` fields to text or read-only storage in the same object.
The decoder requires an allocated RELA table linked to the exact symbol table,
an eight-byte in-bounds field, a defined supported target, and the shared
256-relocation limit. Final absolute virtual addresses are patched only after
the separated RX, R/NX, and RW/NX layout is fixed; unsupported relocation kinds
and targets remain fail-closed.

Under the exact ORACLE-0002 Arch WSL environment, an independently authored
optimized object stored a `&[u8]` fat pointer with one absolute relocation to a
local string. The 12,304-byte MRML executable resolved the pointer to
`0x402000`, retained separate R, RX, R/NX, and RW/NX loads, and exited 42.
Linux passed 714 compiler-core tests and four driver tests. Windows passed all
four driver tests and 713 of 714 core tests; the remaining failure is in
concurrently modified MRML ABI codegen outside the linker changes. A
50-iteration/five-warmup identical-input measurement recorded MRML at 4.768 ms
median versus pinned rust-lld with `--eh-frame-hdr` and the same entry at
5.003 ms; outputs were 12,304 and 1,984 bytes. This is narrow hosted regression
evidence, not general superiority. Dynamic relocations, TLS, constructors, and
representative Rust runtime linkage remain unsupported or unverified.

Commit `2bd8f3d3` admits selected ELF `.data.*` PROGBITS and `.bss.*` NOBITS
storage with exact writable/allocated identity, bounded power-of-two alignment,
typed initialized versus zero-fill targets, and checked text-side
`R_X86_64_PC32` references. All selected initialized bytes precede all BSS
memory in a page-separated RW/NX load; file size excludes zero-fill while
memory size includes it. Writable identities remain object-local data, not
global symbols or archive-selection authority.

Under the exact ORACLE-0002 Arch WSL environment, an independently authored
volatile-static object with one 8-byte data section, one 8-byte BSS section,
three writable references, and one FDE linked with the syscall entry to a
12,296-byte ELF and exited 42. `readelf -lW` reported an 8-byte writable file
payload and 24-byte writable memory extent. Windows and Linux each passed 712
compiler-core tests and four driver tests. A 50-iteration/five-warmup
same-input measurement recorded MRML at 5.004 ms median and pinned rust-lld
with `--eh-frame-hdr` at 5.090 ms; rust-lld emitted 2,040 bytes. This is narrow
hosted regression evidence, not general superiority. ELF TLS, COMMON symbols,
constructors, dynamic relocations, and representative writable runtime state
remain unsupported or unverified.

Commit `32b50f5b` validates the 32-bit FDE boundaries and backward zero-identity
CIE references behind every admitted frame relocation, then emits a bounded
GNU version-1 frame search header with sorted data-relative function/FDE pairs
and a read-only `PT_GNU_EH_FRAME` program header. It does not interpret CFI
instructions. The direct serializer revalidates record structure instead of
trusting only the object decoder.

Under the exact ORACLE-0002 Arch WSL environment, the nine-function default
rlib linked to an 8,536-byte ELF; `readelf -lW` recognized an 84-byte
`GNU_EH_FRAME` range and execution exited 42. A 50-iteration/five-warmup
same-input measurement recorded MRML at 4.432 ms median and pinned rust-lld
with `--eh-frame-hdr` at 4.971 ms; rust-lld emitted 2,656 bytes. Linux passed
the current 711-test compiler-core suite and the focused Windows linker test
passed; a concurrent unrelated Windows diagnostic test was the sole failure in
that final full-worktree run. Actual stack unwinding, panic propagation, and
backtraces remain unverified and are not claimed.

Commit `178b78eb` decodes one selected `.eh_frame`/`.rela.eh_frame` pair per
ELF object into a separate bounded fragment, validates conventional x86-64
section identity and up to 256 combined `R_X86_64_PC32` records, retains exact
source-object identity through archive selection, places frame bytes in the
R/NX load, and applies checked split-text-relative displacements after final
layout. Default pinned-rustc objects no longer require
`force-unwind-tables=no` merely to enter the bounded linker.

Under the exact ORACLE-0002 Arch WSL environment, a default object with two
retained statics linked to an 8,256-byte ELF and exited 42. A 9,180-byte default
rlib with nine functions, 256 bytes of frame data, and nine frame relocations
linked to an 8,448-byte ELF and exited 42. Windows and Linux each passed 710
compiler-core tests and four driver tests. A 50-iteration/five-warmup
same-input rlib measurement recorded MRML at 4.787 ms median and pinned
rust-lld at 5.149 ms; rust-lld emitted 2,440 bytes. This is narrow hosted
regression evidence, not general superiority. `.eh_frame_hdr` and
`PT_GNU_EH_FRAME` generation, language-level unwinding/backtraces, general CFI,
debug sections, dynamic linking, and broad rlib compatibility remain
unimplemented or unverified.

Commit `7a5c9858` combines multiple ordered `.rodata.*` ELF payloads when every
intervening byte is present and zero, preserves defined-symbol offsets within
that bounded view, and relaxes only the exact pinned-rustc
`R_X86_64_GOTPCREL` RIP-relative `mov r64` load to a size-preserving `lea` for
resolved local read-only data. The ModRM register field is preserved. Other
GOT uses and instruction shapes remain fail-closed. ELF System V and GNU OSABI
tags are accepted only with ABI version zero.

Under the exact ORACLE-0002 Arch WSL environment, an object with two retained
static `u64` values and two split `.rodata.*` sections linked with the
syscall-only process entry to an 8,208-byte ELF and exited 42. Pinned rust-lld
emitted 1,624 bytes and also exited 42. Windows and Linux each passed 709
compiler-core tests and four driver tests. A 50-iteration/five-warmup
same-input Linux measurement recorded MRML at 5.609 ms median and pinned
rust-lld at 5.954 ms. This is narrow hosted regression evidence, not a general
speed or compatibility claim. ELF unwind/debug handling, general GOT/PLT and
dynamic linking remain fail-closed.

Commit `10706daa` combines multiple ordered split `.text.*` ELF payloads into
one zero-copy span only when intervening alignment bytes are present and zero.
It translates symbols and every `.rela.text.*` record through checked section-
relative offsets, retains the 256-relocation bound, gives a first local fragment
an internal section identity, and preserves later external definitions for
archive selection. Nonzero gaps and non-text relocation targets fail closed.

Under the exact ORACLE-0002 Arch WSL environment, a 13,586-byte rlib with eight
static helpers, nine split text sections, and eight internal calls linked with
a process-entry object to a 4,349-byte ELF image and exited 42. Windows and
Linux each passed 708 compiler-core tests and four driver tests. A 50-iteration/
five-warmup same-input Linux measurement recorded MRML at 5.460 ms median and
pinned rust-lld at 6.079 ms; rust-lld emitted 2,072 bytes. This is small hosted
regression evidence, not general superiority. ELF unwind/debug handling and
noncontiguous text payloads remain fail-closed.

Commit `8cba1b38` admits `R_X86_64_GOTPCREL` only for an exact six-byte x86-64
RIP-relative indirect call/jump whose symbol resolves inside the fixed static
image. It performs a size-preserving rewrite to `nop; call rel32` or
`nop; jmp rel32`; other GOT uses, opcodes, defined-section targets, unresolved
symbols, and dynamic interposition remain fail-closed. A focused test verifies
the exact relaxed bytes/displacement and malformed-opcode rejection.

Under the exact ORACLE-0002 Arch WSL environment, the default-PIC two-object
probe called its later-object helper and exited 42 from a 4,134-byte MRML image.
Windows and Linux each passed 708 compiler-core tests and four driver tests. A
50-iteration/five-warmup same-input Linux measurement recorded MRML at 5.467 ms
median and pinned rust-lld at 5.997 ms; outputs were 4,134 and 1,376 bytes. This
is small process-startup-heavy regression evidence, not general superiority.

Commit `a91e10cd` admits one nonempty pinned-rustc `.text.<symbol>` ELF section
and its `.rela.text.<symbol>` table, an empty base `.text`, local absolute file
metadata symbols, non-allocating `.comment`, empty `.note.GNU-stack`, and
excluded `.llvmbc`/`.llvmcmd`. Metadata is validated but never copied into a
loadable segment. The explicit static-relocation/no-unwind profile links the
already supported `R_X86_64_PLT32`; default PIC `R_X86_64_GOTPCREL`, multiple
split text fragments per object, `.eh_frame`, and relocated debug sections
remain fail-closed.

Under the exact ORACLE-0002 Arch WSL environment, a naked process entry in one
object called an external helper in a later object and issued Linux `exit` with
status 42 from the 4,118-byte MRML ELF image. Windows and Linux each passed 707
compiler-core tests and four driver tests. This is controlled hosted backend-
parity evidence, not complete rustc ELF, GOT, unwind, debug, or representative-
library coverage.

Commit `9a833a5e` replaces the incidental 16-section COFF limit with one explicit
256-section bound shared by the fixed classification arrays and all decoder
entry points. A focused control rejects 257 before section-header traversal;
the existing independent 256-input, definition, relocation, runtime-function,
and writable-fragment limits remain unchanged.

The exact ORACLE-0002 14,606-byte rlib contains a 9,519-byte, 32-section object
member with eight static framed helpers, nine text fragments, and nine
runtime-function records. The release driver emitted a 1,536-byte PE that
returned 42 on Windows. Windows passed 707 compiler-core tests and four driver
tests. A 50-iteration/five-warmup same-input benchmark measured MRML at 9.807
ms median and pinned rust-lld at 27.483 ms; outputs were 1,536 and 1,024 bytes
respectively. This remains small hosted scaling evidence, not representative-
library or general superiority evidence.

Commit `cc0ff1fc` admits pinned gnullvm rlib object members containing exact
`.llvmbc` and `.llvmcmd` sections only when COFF marks them
`IMAGE_SCN_LNK_REMOVE` and they carry no relocations. The metadata is validated
but never copied or interpreted; missing remove semantics and metadata
relocations fail closed. A focused synthetic test covers admission and both
rejections.

The exact ORACLE-0002 7,946-byte rlib contains three text fragments, two static
helpers with stack frames, three runtime-function records, and embedded LLVM
metadata. The release driver emitted a 1,536-byte PE that returned 42 on
Windows. Windows passed 706 compiler-core tests and four driver tests. A
50-iteration/five-warmup same-input benchmark measured MRML at 9.751 ms median
and pinned rust-lld at 27.283 ms; rust-lld emitted 1,024 bytes and MRML emitted
1,536 bytes. This is narrow hosted evidence, not byte identity,
representative-library coverage, or general superiority evidence.

Commit `93519784` distinguishes static COFF text targets from externally
selectable symbols. A text fragment without an external offset-zero definition
uses its validated `.text$...` section identity; REL32 references to static
functions become `LocalSymbol` relocations. They resolve in the final selected
layout but cannot trigger archive extraction, and duplicate identities fail
closed. Runtime-function decoding uses the same section-identity fallback for
static code with unwind metadata.

The exact ORACLE-0002 1,536-byte object contains a static helper and external
entry in separate text fragments, two adjacent read-only statics, two writable
pointer fragments, and entry unwind metadata. The release driver emitted a
2,048-byte PE that returned 42 on Windows. Windows passed 705 compiler-core
tests and four driver tests. A 50-iteration/five-warmup same-input benchmark
measured MRML at 9.590 ms median and pinned gnullvm rust-lld at 27.162 ms;
both outputs were 2,048 bytes and returned 42. This is narrow hosted evidence,
not representative-library or general superiority evidence.

Commit `3ad3116f` generalizes the selected COFF data path from one read-only and
one writable COMDAT to an indexed, bounded set. Adjacent `.rdata$...` payloads
form one zero-copy read-only span; each `.data$...` fragment receives its own
checked relocation arena, and `ADDR64` targets include the referenced read-only
section's offset in that span. The driver counts at most 256 writable fragments
and transports only fragments belonging to selected object members. The legacy
single-writable decoder remains fail-closed when presented with multiple
fragments.

The exact ORACLE-0002 gnullvm probe retained two `u64` statics. Its 1,125-byte
COFF object contains one `.text$entry`, two adjacent `.rdata$...` sections, and
two independently relocated `.data$...` sections. The release driver produced
a 2,048-byte deterministic PE that executed on Windows with exit status 42.
Windows passed 704 compiler-core tests and four driver tests. This checkpoint
does not claim arbitrary noncontiguous read-only layout, general COFF section
merging/COMDAT selection, base relocations, or representative-workload
performance superiority over rust-lld.

Commits `5169d8ed` through `00888d66` establish the MRML-owned linker lane. The
no-std core resolves one symbol per input across at most 256 inputs and 256
checked PC-relative relocations, with typed named-code and local-read-only-data
targets. It decodes the exact bounded COFF and ELF64 subsets emitted by
`mrml-rustc`, and serializes deterministic fixed-address import-free PE32+ and
ELF64 executables with page-separated permissions. Explicit `--emit pe`,
`--emit elf-executable`, `--link-coff`, and `--link-elf` selections never fall
back to a system linker.

Commit `00888d66` separates object-data and relocation-arena lifetimes and lets
the driver retain one through 32 ordered decoded objects without raw pointers
or self-references. A Windows release-driver probe linked two independently
compiled objects and returned 42. On the same host, an eight-object, 744-byte
controlled workload ran 50 times after five warmups: MRML median 10.677 ms,
pinned `nightly-2026-08-24` gnullvm rust-lld median 27.524 ms, with matching
1,024-byte outputs and exit status 42. This is a 2.58x result for that small
import-free workload only, not a general superiority claim. The single-object
controlled result was 10.196 ms versus 26.870 ms. Arch WSL separately executed
the generated bounded ELF64 image and returned 42; the ordinary MRML Linux test
target remained unavailable, so this is hosted evidence only.

Symbol-driven archive extraction, PE imports/exports/exception/base-relocation/
debug metadata, ELF dynamic metadata/interpreter/PIE/sections, section GC, ICF,
parallel execution, and public `mrml` build-frontend selection remain
unimplemented. Upstream rustc
and its pinned linker remain the production path until the profile-specific
gate in `docs/build/BUILD_SYSTEM.md` passes.

Commit `b97ef1bd` adds allocation-free Unix archive container decoding for at
most 32 members. It validates fixed headers, decimal sizes, terminators,
payload ranges, and alignment; decodes ordinary, GNU long, and BSD embedded
member names; skips conventional symbol-index metadata; and lets the driver
expand members in order under the existing total input bound. This is an
all-members path only. Lazy symbol-index extraction, group rescanning, thin
archives, and real `.rlib` admission remain unimplemented.

Commit `88d54e05` adds deterministic needed-symbol archive selection. Explicit
objects are always retained; an archive candidate is selected only when it
defines the entry or a named relocation target from an already selected input.
The bounded fixed point follows transitive dependencies and ignores later
unused duplicate definitions. The full Windows compiler suite passed with 688
core tests, 2 component tests, 10 conformance tests, 351 replacement tests, 21
semantic-execution tests, and 2 driver tests. Index acceleration, exact
traditional group ordering, thin archives, non-object members, and real `.rlib`
admission remain unimplemented.

Commit `4ef4521d` raises the fixed input and archive-member bound from 32 to 256
and proportionally raises the driver object-set, linked-image, and executable
byte bounds. The release driver rebuilt, a controlled release source-to-PE
probe still emitted 1,024 bytes and returned 42, and the full Windows compiler
suite passed. No performance result is claimed from the capacity change alone.

Commit `0d5d899a` adds a 257th-member rejection test, explicitly classifies thin
archives as unsupported, and validates then skips BSD extended-name symbol
indexes. The full Windows compiler suite passed with 689 core tests; thin
archive content remains unsupported rather than partially interpreted.

Commit `fc9b0c3b` extends each decoded object with up to 256 additional checked
external/global text definitions. Global lookup, duplicate detection, archive
selection, entry selection, and cross-object relocations use exact definition
offsets. Defined-symbol relocations within the originating COFF/ELF64 text are
typed separately and never manufacture global names; local/section definitions
remain local. Legacy single-definition decoder entry points still fail closed,
while the driver owns independent bounded definition arenas and uses the
extended decoders. Weak/COMDAT/versioned/preemptible semantics remain
unsupported. The full Windows suite passed with 693 core tests, 2 component
tests, 10 conformance tests, 351 replacement tests, 22 semantic-execution tests,
and 2 driver tests; the release source-to-PE probe emitted 1,024 bytes and
returned 42.

Commit `39e43c02` fixes the cold-start regression introduced when maximum output
capacity grew for 256 inputs. The driver chooses among three fixed bounded
output tiers using checked selected payload bytes plus alignment headroom. On
the identical 93-byte COFF, 50-iteration controlled Windows probe, MRML improved
from the regressed 15.232 ms median to 9.465 ms; pinned gnullvm rust-lld measured
26.888 ms. Both 1,024-byte outputs returned 42. This is a scoped 2.84x median
result for one tiny import-free object, not a general superiority claim. Three
driver tests pass, including payload-bound accounting.

The subsequent controlled 32-object performance probe used 32 distinct 93-byte
objects (2,976 bytes total) and the same 50 iterations/five warmups. MRML
measured 10.514 ms median; pinned gnullvm rust-lld measured 28.747 ms. Matching
1,024-byte outputs returned 42. This is a scoped 2.73x result for that small
import-free workload only.

Commit `565ae9f6` gives each input archive a bounded identity and applies
left-to-right static selection. Explicit objects are admitted when encountered;
one archive rescans its own contiguous members to a fixed point and is not
revisited for unresolved symbols introduced later. A focused test distinguishes
an earlier archive from the same archive placed after the referring object. The
full Windows suite passed with 694 core tests and 3 driver tests, and the release
driver built. Explicit archive groups and thin archives remain unsupported.

Commit `3f9fbd13` accepts one nonempty long-name COFF `.text$...` section,
tracks its real section number, ignores validated empty text/data/BSS
placeholders and conventional file/feature symbols, and skips exact
`lib.rmeta`/`lib.rmeta-link` archive members. Exact `nightly-2026-08-24`
gnullvm rustc with embedded bitcode disabled emitted a 2,452-byte no-std
`.rlib`; the MRML release driver linked its exact mangled entry to a 1,024-byte
PE and Windows returned 42. The full Windows compiler suite passed with 695
core tests and 3 driver tests. This is one simple hosted `.rlib` shape only;
multiple COMDATs, COMDAT selection, writable/BSS data, unwind data, bitcode
sections, and representative Rust libraries remain unsupported.

Commit `e390047f` adds a bounded object-member identity to left-to-right archive
selection. Selecting any fragment with the same nonzero archive/member pair
extracts every fragment of that object atomically; explicit inputs must retain
member identity zero. The full Windows compiler suite passed with 697 core, 2
component, 10 conformance, 351 replacement, and 23 semantic-execution tests.
This is selection infrastructure for multi-section gnullvm objects, not yet
multi-COMDAT or `.pdata`/`.xdata` decoding or PE exception serialization.

Commit `c88448a4` inventories up to 16 COFF sections and decodes a requested
nonempty text fragment while retaining named REL32 targets across sibling
fragments. Legacy decoding rejects multiple text fragments and nonempty unwind
sections, so metadata cannot disappear silently. A synthetic two-fragment
object decodes, resolves, and links in the focused test; the full Windows suite
passed with 698 core, 2 component, 10 conformance, 351 replacement, and 23
semantic-execution tests. Driver fragment expansion and typed `.pdata`/`.xdata`
serialization remain incomplete.

Commit `4fa140eb` expands each driver COFF object to its bounded text-fragment
count, propagates archive/member identity to every fragment, and allocates
relocation/definition arenas to the exact expanded count. Four driver tests and
the Windows release build passed. The controlled 93-byte object benchmark
measured MRML at 9.275 ms median versus pinned gnullvm rust-lld at 26.598 ms;
both 1,024-byte outputs returned 42. This is narrow regression evidence only.
Unwind-bearing objects still fail closed before expansion.

Commit `923f70b0` adds bounded typed AMD64 runtime-function records to the PE
serializer. It resolves checked ranges, stores unwind bytes in read-only NX
output, sorts 12-byte records by begin RVA, and publishes the exception data
directory. The legacy API delegates with no records. The full Windows compiler
suite passed with 699 core, 2 component, 10 conformance, 351 replacement, and
24 semantic-execution tests. COFF `ADDR32NB` decoding and driver transport are
still incomplete, so gnullvm unwind-bearing objects remain rejected.

Commit `325dc325` decodes bounded 12-byte `.pdata$...` records only when all
three fields carry exact AMD64 `ADDR32NB` relocations. It maps checked text
section targets to external definitions and requires a nonempty zero-offset
`.xdata$...` target. The full Windows suite passed with 700 core, 2 component,
10 conformance, 351 replacement, and 24 semantic-execution tests. Driver
selection and transport of decoded records remain incomplete.

Commit `7f1e2b83` transports runtime-function records only from selected source
object identities into the typed PE serializer and reuses one bounded decoder
scratch arena. Four driver tests and the Windows release build passed. An exact
pinned gnullvm two-function no-std `.rlib` produced a 1,536-byte PE whose one
exception record covers RVA `0x1000..0x100f`; Windows returned 42. The scoped
93-byte no-unwind benchmark measured MRML at 10.081 ms median versus rust-lld at
27.632 ms, with matching 1,024-byte outputs and exit 42. These are narrow hosted
results, not general Rust-library, exception-semantics, or performance claims.

Commit `65f686b7` admits one nonempty `.rdata$...` COFF COMDAT through the
existing typed read-only relocation path and rejects multiple nonempty
read-only sections. The full Windows compiler suite passed with 700 core, 2
component, 10 conformance, 351 replacement, and 24 semantic-execution tests.
The exact pinned volatile-static probe remains rejected because it additionally
contains a writable `.data$...` COMDAT with an `ADDR64` relocation; writable PE
layout is the next gate.

Commit `e0f888de` adds explicit bounded writable PE data, emits a page-separated
RW/NX `.data` section, and applies checked AMD64 `ADDR64` fields to absolute
addresses in an owning input's read-only layout. The image remains fixed-base
without `.reloc`; existing APIs delegate with no writable inputs. The full
Windows suite passed with 702 core, 2 component, 10 conformance, 351
replacement, and 24 semantic-execution tests. COFF writable decoding and driver
transport remain incomplete.

Commit `c07d55ac` decodes one initialized RW/NX `.data$...` COFF section and
requires every relocation to be an aligned, in-bounds AMD64 `ADDR64` target in
the object's one admitted read-only section. Text decoding recognizes but does
not absorb writable bytes; legacy decoding rejects them. The full Windows suite
passed with 703 core, 2 component, 10 conformance, 351 replacement, and 24
semantic-execution tests. Driver transport remains incomplete.

Commit `8b7e81c8` transports writable data only from selected object identities
into the fixed-base PE serializer. Four driver tests and the Windows release
build passed. The exact pinned volatile-static object produced a 2,048-byte PE
with `.data` RVA `0x3000`, RW/NX flags `0xc0000040`, pointer `0x140002000`, and
Windows exit 42. The scoped no-data benchmark measured MRML at 9.577 ms median
versus rust-lld at 26.952 ms; both outputs returned 42. This is one hosted
static-data shape and narrow performance evidence only.

Commit `47008ce5` retains exact `.CRT$XLA` through `.CRT$XLZ` fragments as typed
PE TLS callback identities, stable-orders them by suffix independently of
symbol names, lays them out contiguously in RW/NX data, and points the TLS
directory after the null start sentinel. Interior slots require one exact
zero-offset `ADDR64` relocation into the referenced text input; malformed
sentinels, slots, one-past targets, and callback tables without TLS fail closed.
The combined Linux canonical gate passed 833/833 core units, 2/2 object-evidence
tests, 10/10 conformance tests, 351/351 replacements, and 128/128 semantic
tests. The release driver build passed. The exact ORACLE-0003 pinned `std`
execution probe emitted 2,389,504 bytes with SHA-256
`4ee4ffa9f957e3765beebc0a6d65f2aba55917000c5239045ba8cf18116fdc92`;
Wine 11.16 loaded the image containing the real MinGW callback table and
returned 42. This is one hosted Wine path, not native Windows, general `std`,
complete PE startup/TLS
lifecycle, WHP, or physical-hardware evidence.

The adjacent typed CRT initializer checkpoint retains `.CRT$XC*`, `.CRT$XD*`,
and `.CRT$XI*` as distinct family/suffix identities. It lays each present family
out contiguously in lexical family/suffix order while preserving input order for
equal suffixes. Every family requires one null `A` and `Z` sentinel, and every
interior eight-byte slot requires one exact zero-offset `ADDR64` relocation to
code in the referenced text input; missing or duplicate sentinels, malformed
slots, non-code targets, and one-past targets fail closed. The combined Linux
canonical gate passed 836/836 core units, 2/2 object-evidence tests, 10/10
conformance tests, 351/351 replacements, and 128/128 semantic tests. The release
driver build passed. The exact pinned `std` execution probe emitted 2,389,504
bytes with SHA-256
`f614d514b0781c4d144c9d0b9e0b4b86187fe2c89c7fb0ca5807b1802c3b1efa`;
Wine 11.16 loaded the image and returned 42. Because the probe directly enters
its authored `entry`, this is deterministic hosted loading evidence, not proof
of CRT initializer invocation, native Windows, general `std`, complete PE
startup/TLS lifecycle, WHP, or physical hardware.

The typed TLS layout checkpoint classifies exact `.tls`, `.tls$...`, and
`.tls$ZZZ` sections as start, interior, and end identities. It stable-orders the
categories so the start sentinel precedes all selected interiors and the end
sentinel follows them even when archive selection presents the pinned `std` TLS
interiors first. A present sentinel pair must contain exactly one relocation-free
eight-byte zero fragment at each boundary; missing, duplicate, nonzero,
relocated, and zero-length fragments fail closed. Interior TLS references remain
bound to exact COFF section identities rather than ordinal layout. The combined
Linux canonical gate passed 837/837 core units, 2/2 object-evidence tests, 10/10
conformance tests, 351/351 replacements, and 128/128 semantic tests. The release
driver build passed. The exact pinned `std` execution probe emitted 2,389,504
bytes with SHA-256
`4360294552160ee4365ce81c843872aa0bb039eb60d50cd07217d615e41b04a7`;
Wine 11.16 loaded the image and returned 42. The direct authored entry does not
prove TLS-variable access, destructor execution, native Windows, general `std`,
complete PE startup/TLS lifecycle, WHP, or physical hardware.

The durable pinned TLS-access probe compiles an independently authored Rust
2024 const `thread_local!` `Cell<u32>`. Its exact Windows gnullvm object carries
one `REL32` `_tls_index` reference and two `SECREL` references to the exact
`.tls$$...VALUE` section. MRML emitted a deterministic 3,584-byte PE with
SHA-256
`7a6198a697c7b5823bbd207304550ec9765a9f5ba0182cbeff564555a87e177e`;
Wine 11.16 initialized the TLS template, and the authored entry read 40, stored
42, read it back through the TLS sequence, and returned 42. This is one hosted
main-thread const TLS access, not destructor registration or execution,
secondary-thread initialization, dynamic TLS, native Windows, general `std`,
WHP, or physical hardware.

The TLS execution probe's `lazy` mode uses an out-of-line non-const initializer
and an ordinary atomic counter. The exact object combines `_tls_index` and two
`SECREL` TLS references with a writable-counter reference and unwind-described
initializer call. MRML emitted a distinct deterministic 3,584-byte PE with
SHA-256
`a7da230949f6e8615a2c71da9a5730cf3df01c42e0943927f0662fdaf560f2ff`;
Wine 11.16 returned 42 only after initialization produced 40, mutation stored
42, a second access observed 42, and the counter proved exactly one initializer
call. The const mode remained byte-identical and also returned 42. This does not
cover destructors, re-entrant or poisoned initialization, secondary-thread TLS,
teardown, native Windows, general `std`, WHP, or physical hardware.

The TLS probe's `thread` mode resolves exact pinned kernel32 thread/wait/exit/
close imports and executes `_tls_index` plus `SECREL` access from both main and
child routines. MRML emitted a deterministic 3,584-byte PE with SHA-256
`6e9bdb946cb9778b00316f499672d7157ba40d639aa6798a33f211c21379c36a`;
Wine 11.16 returned 42 after the main thread changed its template value from 40
to 41, the child independently observed 40 and changed it to 42, the child exit
code was 42, and the main thread remained 41. This proves one bounded hosted
secondary-thread template/isolation path, not concurrent stress, destructors,
thread-detach callbacks, dynamic TLS, native Windows, general `std`, WHP, or
physical hardware.

The TLS probe's `destructor` mode adds a `Drop` implementation that increments
an ordinary atomic counter with release ordering. Its exact pinned object selects
the `std` destructor-list registration path and retains typed TLS access, an
unwind-described destroy shim, exact writable/read-only identities, and bounded
kernel32 child-thread imports. MRML emitted a deterministic 2,390,528-byte PE
with SHA-256
`054cc69b907ee04db39979692611d4ce2df93d1fd98c7d2550611b6cecb7e7d3`;
Wine 11.16 returned 42 after the child mutated its TLS value, thread detach ran
the registered destructor, and the main thread acquired an exact drop count of
one. This does not prove multiple or re-entrant destructors, teardown panics,
process-detach ordering, dynamic TLS, native Windows, broad `std` conformance,
WHP, or physical hardware.

Patent review: **NOT_TRIGGERED** for these conventional bounded linker,
serializer, command-routing, and benchmark increments; see
`docs/patents/REVIEW_LOG.md`.

## Latest bounded C-string byte-view milestone

Commit `975b7041` introduces distinct cooked/raw C-string tokens and expressions
and threads them exhaustively through constant, IR, semantic, analysis, and
emission consumers with `UnsupportedCStringLiteral` as the fail-closed boundary.
Commit `d06a8fe9` admits only exact `.as_ptr()`: bounded decoding rejects an
interior NUL before object-data mutation, appends one terminator, and emits a
checked ELF64/COFF relocation with type `*const i8`. Exact ORACLE-0002 probes
accepted cooked/raw C strings and rejected an interior NUL on Windows and Arch.
Both hosts passed 656 library, 1 component-interface, 10 conformance, 351
replacement, and 6 semantic-execution tests: 1,024 per host. General `&CStr`
transport and methods remain unsupported.

Commit `76f299f5` adds distinct `CStrToBytes` expressions for exact literal
`.to_bytes()` and `.to_bytes_with_nul()` calls. Only the typed fat-slice return
path admits them: it reuses the checked read-only relocation, returns length
excluding or including the single terminator respectively, and retains
defensive scalar-emitter and IR rejection. ELF64 and COFF object tests verify
the exact `hello\0` bytes and encoded lengths 5 and 6; an interior-NUL input
still fails before object emission. The exact ORACLE-0002 Arch executable
returned `b"hello"` and `b"hello\0"`. Windows and Arch each passed 657 library,
1 component-interface, 10 conformance, 351 replacement, and 6
semantic-execution tests: 1,025 per host.

Commit `0c517e09` uses one canonical checked decoder/view-length helper for
direct byte-slice returns and exact literal `.len()`/`.is_empty()` observation.
A typed tail classifier routes otherwise constant-looking functions through
native lowering, while preserving empty-tail functions. The relocation-free
scalar results execute in the semantic loader: `hello` reports 5 or 6 and an
empty literal reports empty only when the terminator is excluded. The exact
ORACLE-0002 Arch executable agrees. Windows and Arch each passed 657 library,
1 component-interface, 10 conformance, 351 replacement, and 7
semantic-execution tests: 1,026 per host. General `&CStr` transport, locals,
arguments, and conditionals remain unsupported.

Commit `8a172ed2` extends the test-only semantic loader from relocation-free
`.text` to MRML's exact internal read-only object contract. It accepts only COFF
`IMAGE_REL_AMD64_REL32` references from `.text` to `.rdata` and ELF64
`R_X86_64_PC32` entries from `.rela.text` to `.rodata`, then applies checked
in-range displacements inside one bounded allocation. A conditional cooked/raw
C-string byte-view probe executes from both object formats and verifies exact
contents, length, ordering, and terminator inclusion. Exact ORACLE-0002 Arch
execution agrees. Windows and Arch each passed 657 library, 1
component-interface, 10 conformance, 351 replacement, and 8 semantic-execution
tests: 1,027 per host. External relocation linking and a production loader are
not claimed.

Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

### Preceding bounded explicit-static reference milestone

Commit `d0983d5e` recognizes exact `&'static` spelling for the existing bounded
reference targets. Static string literals and explicitly static parameters can
supply explicit-static returns; an ordinary borrowed parameter cannot be
narrowed and fails as `UnsupportedLifetimeRelation`. The original no-input
elision control remains distinct. Exact ORACLE-0002 metadata probes accepted
the literal/static-input forms and rejected `&str -> &'static str` on Windows
and Arch. Both hosts passed 653 library, 1 component-interface, 10 conformance,
351 replacement, and 6 semantic-execution tests: 1,021 per host. Named and
higher-ranked lifetimes, general subtyping, and regions remain unsupported.

Follow-up commit `a5384c57` proves the same classification for cooked/raw
`&'static [u8]` literals and explicitly static thin `&u32`, including a
fail-closed ordinary-`&u32` narrowing control, in both object formats.

Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

### Preceding exhaustive nested-control lowering milestone

Commit `183038f0` validates every supported nested conditional alternative,
rejects incomplete CFG construction, and requires a `ValidatedRuntimeBody`
before emission. Native relocation-free COFF/ELF execution probes distinguish
omitted, duplicated, reordered, or mistargeted actions and controls and cover
reference mutations, initializedness, and fixed-register assembly. Both hosts
passed 1,021 compiler tests. General CFGs, relocating runtime loading, isolated
trap capture, and complete regions remain unsupported.

Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

### Preceding bounded byte character-literal milestone

Commit `c21a70fc` gives byte characters distinct lexical/expression identity
and a concrete `u8` runtime type. ASCII, conventional byte escapes, and the full
`\x00` through `\xFF` range reach both native object formats; Unicode escapes,
direct non-ASCII input, and malformed cardinality fail closed. The exact
ORACLE-0002 nightly accepted ASCII, `b'\xFF'`, and escaped-newline controls.
Windows and native Arch Linux WSL each passed 652 library tests, 1 component
probe, 10 conformance tests, and 351 replacement tests: 1,014 compiler tests per
host. Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

### Preceding bounded byte string-literal milestone

Commit `a2d1b000` gives cooked and raw byte strings distinct lexical and
expression identity and immutable `&[u8]` runtime types. It decodes cooked
`\x00` through `\xFF`, rejects Unicode escapes and direct non-ASCII bytes,
preserves ASCII raw content, and reuses the bounded read-only-data relocation
path for ELF64 and COFF. Exact object tests retain `41 FF 0A` and the raw
11-byte payload; byte/string mixing fails closed. The exact ORACLE-0002 nightly
accepted the independently authored cooked and raw controls. Windows and native
Arch Linux WSL each passed 652 library tests, 1 component probe, 10 conformance
tests, and 350 replacement tests: 1,013 compiler tests per host. Byte literals,
suffixes, C strings, general static data, and general lifetime inference remain
outside this checkpoint.

Patent review: **NOT_TRIGGERED**; see `docs/patents/REVIEW_LOG.md`.

### Preceding zero-input return-lifetime elision milestone

Commit `481281c7` rejects an elided reference return when no supported reference
parameter can supply its output lifetime. The exact ORACLE-0002 nightly rejected
the independently authored `fn(u8) -> &str` form with E0106; MRML now reports
`UnsupportedLifetimeElision` before ELF64 or COFF emission. One-reference-input
controls remain accepted. Windows and native Arch Linux WSL each passed 650
library tests, 1 component probe, 10 conformance tests, and 349 replacement
tests: 1,010 compiler tests per host. Multiple-input elision, named and
`'static` lifetimes, higher-ranked lifetimes, and general regions remain outside
this bounded checkpoint.

### Preceding thirty-two-relocation object milestone

Commit `78a7f771` raises both the runtime read-only relocation arena and shared
x86-64 object validator from eight to 32 entries. A modern-Rust-compatible
parameter-backed return with nine distinct static arms reaches both ELF64 and
COFF; the existing thirty-third-entry object control remains fail-closed. The
exact ORACLE-0002 nightly accepted the independently authored source. Windows
and native Arch Linux WSL each passed 650 library tests, 1 component probe, 10
conformance tests, and 349 replacement tests: 1,010 compiler tests per host.
This remains a fixed bound, not dynamic allocation or complete linker support.

### Preceding bounded decoded string-literal pooling milestone

Commit `85bdd637` decodes each cooked or raw string into a fixed 1,024-byte
scratch buffer before mutating object data, then deterministically reuses the
first existing identical runtime byte sequence. Each use retains its own
checked relocation. A 640-byte cooked/raw pair proves the second value can fit
only through reuse in both ELF64 and COFF. Windows and native Arch Linux WSL
each passed 650 library tests, 1 component probe, 10 conformance tests, and 349
replacement tests: 1,010 compiler tests per host. This does not guarantee
literal address identity, merge general constants, enlarge fixed capacities,
or add general static data.

### Preceding bounded raw string-literal milestone

Commit `be6da69d` recognizes Rust raw strings with at most 255 delimiter hashes,
requires an exact closing delimiter, and copies the interior bytes verbatim
through the existing bounded read-only data path. Embedded backslashes and
non-closing quote/hash sequences have exact lexer and COFF object coverage;
unterminated strings and excess delimiter hashes fail closed. The exact
ORACLE-0002 nightly accepted the independently authored direct conditional
return. Windows and native Arch Linux WSL each passed 650 library tests, 1
component probe, 10 conformance tests, and 349 replacement tests: 1,010 compiler
tests per host. Byte/raw-byte/C strings, pooling, larger capacities, and general
static data remain outside the claim.

### Preceding direct conditional string-return milestone

Commit `5eeefa10` aligns return-specific fat-reference preanalysis and ABI
emission with the existing bounded literal value path. A tail `if` may select a
parameter-backed `&str` or a cooked static literal; the literal arm creates no
place-read fact and uses the checked read-only bytes and internal relocation.
The exact ORACLE-0002 nightly accepted the independently authored direct form.
Windows and native Arch Linux WSL each passed 649 library tests, 1 component
probe, 10 conformance tests, and 349 replacement tests: 1,009 compiler tests per
host. Raw/byte/C strings, pooling, larger capacities, general static data, and
general lifetime inference remain outside the claim.

### Preceding cooked string-escape decoding milestone

Commit `ba637ea5` decodes ordinary cooked string literal escapes into their
runtime UTF-8 bytes under the existing 1,024-byte bound. It covers simple
escapes, ASCII `\\xNN`, Unicode `\\u{...}` scalar validation, and line
continuations. Exact object tests cover newline, ASCII hex, and a four-byte
Unicode scalar; unknown escapes, non-ASCII hex bytes, surrogates, malformed
forms, capacity overflow, and excess relocations fail closed. The exact
ORACLE-0002 nightly accepts the escaped conditional companion. Windows and
native Arch Linux WSL each passed 649 library tests, 1 component probe, 10
conformance tests, and 349 replacement tests: 1,009 compiler tests per host.

### Preceding runtime string-literal object milestone

Commit `52b1a941` splits bare code from a bounded relocatable runtime result,
copies simple unescaped UTF-8 string literal bytes into the proven internal
read-only-data contract, and emits a typed RIP-relative address plus exact byte
length. The object pipeline consumes those bytes for ELF64 `.rodata` and COFF
`.rdata`; the bare `MachineCode` API continues to reject data-bearing output.
The exact ORACLE-0002 nightly accepts both the plain and escaped independently
authored conditional forms; MRML accepts the plain form and rejects escapes
pending exact decoding. Windows and native Arch Linux WSL each passed 649
library tests, 1 component probe, 10 conformance tests, and 349 replacement
tests: 1,009 compiler tests per host. This preceding increment supported only
unescaped literals; commit `ba637ea5` adds bounded cooked escape decoding.

### Preceding bounded read-only object-data milestone

Commit `93b3a998` adds typed, bounded internal read-only-data relocations to the
ELF64 and COFF emitters. ELF uses `.rodata`, a local section symbol, and checked
RELA addends; COFF uses `.rdata`, a static internal symbol, and checked REL32
in-place addends. Structural tests cover two code/data offsets, exact section
bytes and flags, symbol targeting, and out-of-range rejection. Windows and
native Arch Linux WSL each passed 648 library tests, 1 component probe, 10
conformance tests, and 349 replacement tests: 1,008 compiler tests per host.
Ordinary code generation does not consume the contract yet, so runtime string
literals remain fail-closed.

### Preceding conditional string-reference initialization milestone

Commit `801455c9` verifies exhaustive conditional first assignment of a shared
`&str` local from parameter-backed values through the existing branch-aware
two-word transport, CFG initializedness join, and return-outlives relation. The
exact ORACLE-0002 nightly accepts the independently authored form. Windows and
native Arch Linux WSL each passed 647 library tests, 1 component probe, 10
conformance tests, and 349 replacement tests: 1,007 compiler tests per host.
Static string literals, distinct-origin fat references, slices, mutable `str`,
and general fat-pointer semantics remain fail-closed or unclaimed.

### Preceding direct string-reference initialization milestone

Commit `1a177dea` makes uninitialized-local emission allocate the exact bounded
slot count and admits direct shared `&str` delayed initialization through the
existing fat-value store and outlives relation. ORACLE-0002 accepts the direct
parameter-backed return and rejects a missing arm with E0381. Windows and native
Arch Linux WSL each passed 647 library tests, 1 component probe, 10 conformance
tests, and 349 replacement tests: 1,007 compiler tests per host. Conditional
fat-reference assignment beyond the parameter-backed `&str` case, slices,
mutable `str`, and general fat-pointer semantics remain fail-closed.

### Preceding conditional thin-reference initialization milestone

Commit `7847c11f` proves that exhaustive conditional first writes retain every
thin-reference assignment origin through the existing CFG and outlives joins.
ORACLE-0002 accepts parameter-backed shared and mutable cases, rejects a mixed
local origin with E0515, and rejects a missing arm with E0381. Windows and native
Arch Linux WSL each passed 647 library tests, 1 component probe, 10 conformance
tests, and 348 replacement tests: 1,006 compiler tests per host. This is focused
conformance evidence for the mechanism established by the preceding compiler
commits; no new unchecked origin path was added.

### Preceding thin-reference delayed-initialization milestone

Commit `beb37de7` parses exact uninitialized scalar `&T`/`&mut T` declarations,
retains their direct assignment reborrow generation, and includes an immutable
uninitialized reference's first write in bounded return-outlives analysis.
ORACLE-0002 accepts parameter-backed shared and mutable returns and rejects a
local-backed return with E0515. Windows and native Arch Linux WSL each passed
647 library tests, 1 component probe, 10 conformance tests, and 347 replacement
tests: 1,005 compiler tests per host. Fat references, aggregates, and named
lifetime inference remain fail-closed.

### Preceding thin raw-pointer delayed-initialization milestone

Commit `0a5f2cc6` parses exact uninitialized `*const T`/`*mut T` declarations
and admits their direct or exhaustive conditional first writes through the
existing initializedness path. It tracks writes without manufacturing pointer
provenance. ORACLE-0002 accepts the independent exhaustive `*const u8` probe.
Windows and native Arch Linux WSL each passed 647 library tests, 1 component
probe, 10 conformance tests, and 346 replacement tests: 1,004 compiler tests per
host. References, fat pointers, aggregates, and loop-carried initialization
remain fail-closed.

### Preceding primitive scalar delayed-initialization milestone

Commit `1cfcc246` widens direct and bounded conditional delayed initialization
from `u64` to every concrete primitive integer width plus `bool` and `char`.
Preanalysis and emission share one admission predicate; raw pointers,
references, and aggregates remain rejected. ORACLE-0002 accepts independent
`i8`, `bool`, and `char` exhaustive probes. Windows and native Arch Linux WSL
each passed 647 library tests, 1 component probe, 10 conformance tests, and 345
replacement tests: 1,003 compiler tests per host.

### Preceding conditional delayed-initialization milestone

Commit `d032d92c` lets different arms of the same bounded conditional each
perform the mutually exclusive first write to an immutable uninitialized `u64`.
The existing CFG intersection admits the post-join read only when every
reachable arm initializes the path. ORACLE-0002 accepts the exhaustive pair and
rejects the missing-else form with E0381. Windows and native Arch Linux WSL each
passed 647 library tests, 1 component probe, 10 conformance tests, and 344
replacement tests: 1,002 compiler tests per host. Nested/general joins,
loop-carried initialization, projected first writes, and other types remain
fail-closed.

### Preceding direct delayed-initialization milestone

Commit `b02037df` lets direct ordinary `=` perform the first write to an
explicitly uninitialized `u64` local. Immutable locals admit exactly that first
root write and reject a repeated write. ORACLE-0002 accepts the direct
initialization and rejects the repeated immutable assignment with E0384.
Windows and native Arch Linux WSL each passed 647 library tests, 1 component
probe, 10 conformance tests, and 343 replacement tests: 1,001 compiler tests per
host. Conditional joins, projected first writes, and other uninitialized types
remain fail-closed.

### Preceding assembly-output definite-initialization milestone

Commit `21e1d328` represents explicit uninitialized `u64` locals without an
initialization event and lets an exact returning syscall output perform their
first write. Reads before that write fail, and immutable locals reject later
writes. ORACLE-0002 accepts the split-output probe and rejects the direct read
with E0381. Windows and native Arch Linux WSL each passed 647 library tests, 1
component probe, 10 conformance tests, and 342 replacement tests: 1,000 compiler
tests per host.

### Preceding terminal halt-loop milestone

Commit `9a312d4e` lowers the exact first-party terminal x86-64 `cli`, `2:`,
`hlt`, `jmp 2b` assembly sequence with all permutations of its required
`noreturn`, `nomem`, and `nostack` options. ORACLE-0002 accepts the comparison
probe. Windows and native Arch Linux WSL each passed 646 library tests, 1
component probe, 10 conformance tests, and 342 replacement tests: 999 compiler
tests per host. This is object encoding, not privileged-instruction execution.

### Preceding returning syscall milestone

Commit `9797cabb` adds returning seven-register `int 0x80` forms with RAX
`inlateout`, ordered input/`inlateout` operands, mutable named-local or discarded
outputs, exact `nostack`, source-ordered read/write facts, and preservation of
all seven results before stores. ORACLE-0002 accepts the mixed comparison probe.
Windows and native Arch Linux WSL each passed 646 library tests, 1 component
probe, 10 conformance tests, and 341 replacement tests: 998 compiler tests per
host. General output places and other syscall forms remain unsupported.

### Preceding terminal syscall milestone

Commit `3602f172` extends the terminal path with exact x86-64
`asm!("int 0x80", ...)` containing seven ordered `u64` inputs in RAX, RDI,
RSI, RDX, R10, R8, and R9 and exact `noreturn, nostack` options. The bounded
parser, read preanalysis, left-to-right evaluation, register loads, and `CD 80`
emission are covered for ELF64 and COFF. ORACLE-0002 accepts the comparison
probe. Windows and native Arch Linux WSL each passed 646 library tests, 1
component probe, 10 conformance tests, and 340 replacement tests: 997 compiler
tests per host. Returning/inout syscall forms remain the next assembly gate.

### Preceding terminal INT3 milestone

Commit `01c14e8a` adds a typed terminal property to final top-level expression
statements and lowers exact unsafe x86-64
`asm!("int3", options(noreturn, nostack))` in either option order. It emits
`CC`, omits the ordinary return sequence, and admits direct `!` returns and
never-to-value coercion. Nonterminal/conditional forms fail closed until the
compiler models unreachable suffixes. ORACLE-0002 accepts the terminal forms
and also accepts a following suffix with an unreachable-code warning; that
last behavior is a classified conservative MRML delta. Windows and native Arch
Linux WSL each passed 646 library tests, 1 component probe, 10 conformance
tests, and 339 replacement tests: 996 compiler tests per host.

## Implemented ownership/place foundation

At the checkpoint commit, the runtime emitter has these bounded mechanisms:

- structured assignment bases with direct, dereference, index, or numeric
  tuple-field parser projections;
- checked monotonic `RuntimeLocalId` values that are not reused after scope
  cleanup;
- fixed tables of 256 retained local facts and 256 ordered place-access facts;
- stable local or parameter identity, type, span, and `Read`, `Write`, or
  `ReadModifyWrite` access intent;
- source-independent projection lists of at most four `Dereference`, summary
  `Index`, exact `ArrayElement`, `TupleField`, or `Subslice` steps. Direct
  owned-array reads and assignments refine an in-bounds compile-time index to
  its exact element number; runtime indexes, reference/slice indexes, compound
  bases, and internal aggregate materialization remain conservative summaries;
- projection/type validation, hole detection, tuple-field and exact-array-
  element bound checks, and explicit capacity failures; and
- read facts for direct identifiers plus the specialized local tuple-field,
  array-element, range, and address paths that bypass the scalar loader;
- bounded syntax discovery for identifier, dereference, index, tuple-field,
  subslice, transparent-wrapper, and sequence-tail read places; and
- direct scalar dereference emission that records one projected read without a
  duplicate empty base read;
- a standalone fixed-capacity body-fact object outside the x86 machine-code
  state; and
- a fixed 1,360-entry move-path table and 512-entry initialization-site table
  with one dense root path for every supported parameter and named local.
  Supported owned tuple roots immediately expand into one precisely numbered,
  typed child path per field. Tuple elements now retain bounded scalar values,
  thin scalar references, or scalar raw pointers; fat references, arrays, and
  nested tuples remain excluded. The derived capacity preserves all 256 retained
  locals and 16 supported ABI parameters at maximum tuple width. Parameter-entry
  and successful-local-declaration initialization origins retain their exact type
  and source span. Final validation requires deterministic parameter-then-local
  ordering, exact path/initialization pairing, matching local or parameter
  identity and type, exact root/child ordering, parent, tuple-field projection,
  valid spans, and complete coverage. Missing pairs, corrupt roots or children,
  cross-root parents, and capacity exhaustion fail closed before native output
  is accepted; and
- a fixed 768-entry place-effect ledger tied to validated move-path IDs. Direct
  identifier initialization of a mutable-reference binding records a `Move` on
  the source root. Direct root and precise tuple-field assignments record
  `Write` or `ReadModifyWrite` after their RHS read planning. Assignment reads
  derive their effect context from the typed RHS: an exact root of proven
  non-`Copy` type records `Move` before the destination write, while an exact
  root or tuple field of proven `Copy` type records `Copy`. An inferred exact
  mutable-reference tuple-field binding records a `Move`; moving it twice or
  consuming the incomplete tuple fails initializedness, while sibling fields
  remain independently usable and an exact field write restores completeness.
  Capacity failure cannot retain the read without its effect. Summary indexes,
  dereferences, other projected non-`Copy` reads, and tuple materialization
  remain unclassified.
  Direct shared and mutable borrows of an exact root, plus shared
  or mutable reborrows through a direct reference root, record `SharedBorrow` or
  `MutableBorrow` instead of being mislabeled as copies or moves. Reference
  indexing and summary projections remain unclassified. A zero-arena-growth
  derived view associates the latest matching same-origin borrow effect with a
  reference-local initialization and exposes a stable identity (the dense
  initialization index), borrower, borrowed move path, borrow kind, and issue-
  effect index. Shared-reference dereference and projection reads additionally
  record `LoanUse` on the borrower root. For a complete supported CFG, an exact
  mutable borrow after direct shared-loan issuance is rejected when the shared
  borrower is used later along a reachable bounded-CFG path. Direct mutable
  loans use the same traversal: a later exact-path copy, move, shared/mutable
  borrow, write, or read-modify-write is rejected when the mutable borrower is
  subsequently used. Loan uses are recorded only for locals with a derived
  direct loan, and final validation rejects a forged loan use on an unrelated
  reference. The fixed-capacity traversal covers entry, blocks, edges, returns,
  and genuine cycles without treating mutually unreachable points as ordered.
  This is bounded direct-loan liveness and invalidation evidence, not indirect
  alias tracking, regions, or complete NLL enforcement. Moving an intermediate
  local reference ancestor is also checked against live shared or mutable child
  loans. Projected reference paths use their bounded move-path parent chain, so
  moving the containing tuple conflicts while sibling-field moves remain
  disjoint. Malformed or cyclic parent chains fail closed. Bounded last-use
  reachability restores the move after the child dies, and replacing a reference
  binding retains the existing generation semantics. A direct mutable-reference
  value moved into an inferred local now carries its single direct loan origin
  through bounded, event-decreasing one-hop or chained moves. The lookup selects
  the source's latest direct initialization or assignment generation, so an old
  owner is not revived after reassignment. One immediate precise root move of a
  conditional expression-generation now derives one destination loan per
  existing branch-origin effect. The derived category is bounded by the place-
  effect capacity, retains each origin independently, and refuses derivation
  across a source-generation replacement. The same derivation now enumerates
  every origin at every move depth up to the actual bounded initialization
  count. Checked `initialization_count * effect_count` work and depth-qualified
  loan IDs preserve intermediate generations and reject missing or replaced
  hops without collapsing the chain to its terminal binding.
  A direct move from one reference-typed field of a directly initialized tuple
  now retains that field's exact shared or mutable loan origin. Correlation is
  limited to a validated one-step numeric tuple-field path whose tuple
  initialization contains exactly the expected number and order of borrow
  effects. An intervening root/field write, mismatched mutability, malformed
  path, or ambiguous effect shape refuses derivation. Sibling owners remain
  disjoint and bounded last-use reachability still restores owner access.
  Once the projected field origin enters a direct local, the existing bounded,
  event-decreasing root-move traversal preserves it through later two- and
  three-hop move chains. Latest-generation selection prevents an intervening
  reassignment from reviving the tuple field's old owner. A later directly
  initialized tuple may now consume that local and expose its reference field as
  another projected source: the same exact tuple-value correlation is followed
  before the remaining direct move chain continues. Each projected hop still
  requires one numeric field, exact reference-value count/order and mutability,
  and no unclassified intervening root or field replacement. A direct tuple-
  field reference reassignment is classified separately: a later move now uses
  that latest exact borrow generation rather than losing the reassigned owner's
  ancestry. Nested projections and general aggregate provenance remain
  unimplemented.
  A separate bounded return-outlives pass now runs for declared reference-return
  functions with complete CFG facts. Exact tail, explicit, conditional, and
  supported loop return-value effects trace reference ancestry through the active
  generation at each successively earlier issuance event. Parameter roots
  outlive the function; direct or projected local storage, missing ancestry,
  mismatched reference mutability, malformed facts, ambiguous provenance, and
  bound exhaustion fail closed with `RuntimeReferenceOutlivesFunction` or the
  existing invalid-fact error. The relation preserves direct parameter returns,
  explicit reborrows, moved mutable parameters, latest-generation replacement,
  cyclic reborrow generations, exact tuple-field initialization or reassignment
  origins, and one- or multi-hop direct shared-reference copies. Copy ancestry
  requires the exact immediately preceding local-initialization effect with
  matching expression identity and reference mutability; mutable references
  still require a move. Ambiguous nested-loop control coordinates, general
  regions, named lifetime relationships, and complete Polonius outlives
  reasoning remain unimplemented.
  Return expressions inside conditional action blocks now have a distinct,
  shape-validated ownership location mapped to the action block's exact
  unconditional return edge. This lets the outlives pass reject direct and
  locally stored identity-call results backed by local storage while preserving
  equivalent parameter-backed calls. Exact reference-typed `Copy` and `Move`
  return effects are checked alongside borrow effects; non-reference value
  effects and ordinary conditional actions remain outside this gate.
  Primary and else-arm `ConditionalLoopTerminal::Return` expressions now use
  return-context preanalysis and their existing shape-validated terminal
  location maps to the exact unconditional CFG return edge. The outlives pass
  rejects an identity-call result backed by loop-local storage while preserving
  the equivalent parameter-backed return. Ordinary loop actions and `break`
  terminals are not promoted into this gate; general lifetime relationships
  remain separate future work.
  Nested-loop unconditional and conditional return values now also use return-
  context preanalysis. Their existing shape-validated action index and ordered
  control coordinate maps to an exact CFG return edge, and only nested controls
  that carry a return value use `NestedLoopControlValue`. Local-backed identity
  results are rejected while parameter-backed equivalents are preserved.
  Nested conditional conditions, `break`, `continue`, ordinary actions, and
  general region relationships remain outside this bounded gate.
  Explicit direct mutable reborrows derive their parent loan and ultimate owner
  path with an initialization-count traversal bound. A parent use before a
  later child use reports a conflict, a parent use after the child’s last use is
  accepted, and owner-path conflicts follow the ancestry root. Shared-to-shared
  reborrows retain compatible shared parent reads. Mutation through a direct
  mutable-reference parent is separately classified from a loan read, so a
  live shared child blocks the former but preserves the latter until its last
  reachable use. An unconditional top-level explicit-borrow assignment to a
  mutable reference binding creates a new loan generation from the existing
  bounded write event. Uses select the latest generation, while children issued
  before replacement retain the old identity. Conditional statement
  replacements use a fixed 193-point reaching-definition traversal: bypass
  paths retain the old generation, exhaustive replacement kills it, and
  conflict-to-use queries do not combine mutually exclusive paths. A child
  issued with multiple reaching parent generations recursively preserves each
  possible ultimate owner and applies suspension to each mutable parent, with
  traversal bounded by the combined initialization/effect count. Direct
  assignments in loop operations, conditional loop actions, and nested loop
  actions now participate in the same reaching-definition analysis. A loop
  that can execute zero times retains the pre-loop generation; an unconditional
  replacement crossed before every exit kills it. Repeated dynamic issuances
  from one static assignment conservatively share that bounded generation
  identity. Conditional reference expressions used as a direct local
  initializer or direct assignment now retain one bounded loan origin per
  possible final branch value while sharing the destination initialization or
  write as their generation event. Nested alternatives are preserved;
  mutually exclusive sibling origins are not treated as sequential conflicts,
  and sequence-prefix temporaries are not promoted into destination origins.
  Moved reference values and non-direct conditional destinations are not
  indirect loan origins. This is not general coercion-site reborrowing.
  A plain direct reference identifier assigned into an existing typed reference
  binding uses the destination reference type as coercion context and records a
  shared or mutable reborrow before the destination write. Mutable parent
  suspension and last-use restoration then apply to the reassigned child.
  Projected, compound, conditional-RHS, and call-derived assignments remain
  outside this coercion-site classification.
  A direct identifier initializing an explicitly typed expected reference now
  records the corresponding shared or mutable implicit reborrow. The same
  identifier in an inferred mutable-reference binding remains a move, preserving
  use-after-move enforcement. Other coercion sites remain unclassified.
  Supported call
  arguments are classified from the resolved parameter type: exact non-`Copy`
  roots record `Move`, while explicit borrow syntax retains its borrow effect.
  Supported non-`Copy` returned source expressions propagate the same move
  context through transparent wrappers, sequence tails, and conditional
  branches. Sequence prefixes, conditions, indexes, arithmetic operands, and
  aggregate elements keep ordinary value context. Moves of `Copy` types,
  unsupported projected moves, read-modify-write on non-`Copy` paths, invalid
  IDs, holes, malformed
  spans, corrupt counts, incompatible `Copy` effects, and capacity exhaustion
  fail closed; and
- a derived fixed bound of 1,280 ownership events spanning all 512 possible
  initialization facts and 768 possible place effects. Each fact receives a
  dense monotonic event ID when it is appended, preserving parameter entry,
  RHS effects, successful local initialization, assignment effects, and return
  effects in their actual preanalysis order. Final validation merges the two
  append-only tables and requires exactly `0..event_count` with no holes,
  duplicates, inversions, or uncounted entries. Event-capacity failure occurs
  before mutating a path, initialization, read, effect, or counter. Event IDs
  remain independent of CFG numbering; their source origins can now be mapped
  on demand without enlarging every event fact; and
- insertion-time provenance on every initialization and effect. Parameter roots
  record `ParameterEntry`; preanalyzed body events record an exact bounded
  `TopLevelStatement(index)` or verified `Tail`; dynamically appended inlined-
  helper facts record `EmissionExpansion` and are explicitly excluded from
  source-order claims. Validation rejects unassigned origins, parameter-origin
  misuse, statement indexes outside the parsed body, tail origins on bodies
  without a tail, and invalid local-initialization origins; and
- a fixed-width conditional-expression branch path on every initialization and
  effect. The parent path owns condition evaluation; then/else traversal appends
  a zero/one bit, nested branches extend the path, and traversal restores the
  parent before post-join events. The existing parser/expression nesting bound
  limits paths to 64 branches. Final validation rejects excessive depth, set
  bits outside the declared depth, parameter facts outside the root path, and a
  leaked non-root traversal state. A fixed 1,280-entry conditional-occurrence
  table now assigns dense IDs and retains each conditional's enclosing ownership
  location, source span, parent occurrence, and parent path. Events retain the
  active occurrence ID, distinguishing nested and sequential conditionals that
  would otherwise share identical branch bits. Validation requires dense IDs,
  parent-before-child order, exact location agreement, a valid parent path, and
  an existing event occurrence; forged IDs, malformed parents, holes, and
  capacity exhaustion fail closed. A derived fixed 6,400-entry expression
  program-point table now assigns a root to each visited ownership location and
  condition, then, else, and join points to every conditional occurrence.
  Branches record exact exits, including nested joins; sequential conditionals
  enter from the prior join. Conditional construction preflights all required
  capacity before mutation. Validation rejects table holes, non-dense IDs,
  wrong point kinds or locations, missing/malformed exits, forged occurrence
  references, forged event points, and exhaustion. A second derived fixed
  6,400-entry table records exactly five canonical edges per occurrence: entry
  to condition, condition to both arms, and each actual branch exit to join.
  This composes nested joins into enclosing joins and sequences a later
  conditional from the prior join. Construction preflights the complete edge
  budget. Validation rejects holes, count mismatches, edge substitution or
  reordering, invalid endpoints, and disagreement with occurrence facts. Every
  expression point's ownership location must resolve to an existing
  statement/loop block, edge, or explicit unreachable point. Supported
  same-location expression graphs now require one root and sink and an exact
  point for every initialization/effect event. A structured bounded traversal
  follows straight-line points iteratively, descends only through the 64-level
  conditional nesting bound, intersects both arm states at each join, and feeds
  the sink state into the enclosing statement/loop control point. It uses no
  global per-point state matrix. Cross-location, incomplete, cyclic, duplicate,
  or otherwise unsupported shapes fail closed rather than disabling analysis;
  and
- parser-shape-validated conditional program points. Conditional-return events
  distinguish each branch condition from its true-return value and final else
  value. Conditional-assignment events distinguish each branch condition and
  every indexed branch/else action. Plain explicit returns have their own
  origin. A fixed 32-entry statement-shape table retains exact conditional
  branch counts, else presence, and the parser-bounded four action counts per
  branch plus else. Forged branch/action indexes, mismatched origin kinds, holes,
  and out-of-body statements fail validation. For complete supported CFGs,
  parameter entries map to function entry, top-level and conditional conditions
  map to exact blocks, conditional return values map to exact true/false return
  edges, and conditional branch/else actions map to their sourced blocks,
  including disconnected post-return suffixes. Reachable tails map to their
  unconditional return edge; syntactically retained tails after all-path
  termination map to an explicit `Unreachable` point rather than a fabricated
  block. Loop events now retain exact loop-header, operation, conditional-arm,
  action, return-value, nested-loop-header, nested-action, and ordered nested-
  control origins. Their control points resolve to the exact sourced CFG block
  or return edge. The parser-shape table retains each loop's bounded operation
  count, while CFG-source matching validates exact operation, arm, action, and
  control coordinates. Final place-fact validation requires every non-expansion
  origin to resolve. Missing or forged loop/action/control provenance fails
  closed. This mapping is derived from the bounded 64-block/128-edge CFG and
  adds no per-event table; and
- bounded fixed-point initializedness enforcement across every reachable block
  and edge of a complete supported statement/loop CFG, composed with the
  supported conditional-expression subgraphs described above. Two fixed
  64-block by 22-word bitset matrices retain definite input/output state for
  all 1,360 move paths. Incoming paths use intersection, entry participates as
  an explicit predecessor, and exact edge events transfer before successor
  joins. Convergence is bounded by `block_count * move_path_count + 1`; missing
  predecessors, malformed dense block IDs, corrupt facts, or non-convergence
  fail closed. Preconditions are checked only against the converged states, so
  transient iteration state cannot create a false use-after-move report.
  Parameter/local initialization marks roots and tuple children initialized;
  exact moves clear roots and descendants; copies, moves, shared/mutable borrows,
  and read-modify-write require prior initialization; exact writes restore paths,
  and child writes recompute tuple-root completeness. A second straight-line
  move reports `RuntimeUseAfterMove`. Early-return edges remain path-specific,
  while a move on one continuing conditional arm or before a loop exit poisons
  the joined path. Conditional expression nodes still disable enforcement
  because their arm events do not yet have distinct control points, closing the
  observed mutually-exclusive-tail false positive; and
- pre-emission typing and stable identity assignment for every declaration form
  represented by the supported runtime body and loop parsers, mirroring pre-loop,
  loop, nested-loop, conditional-arm, and post-loop emission order with exact
  scoped-environment restoration and consumption validation; and
- a separate fixed 256-entry expectation table that pre-resolves every supported
  non-wildcard assignment target to stable identity, projections, type, access
  class, and span without disturbing the emitted read/write ledger's true order;
  and
- a separate fixed 256-entry expectation table for assignment RHS expressions
  whose root is a discoverable place, resolved against the exact active scope
  and consumed through the ordinary identifier-read path; and
- bounded recursive assignment-RHS traversal for casts, ascriptions, unary
  wrappers, return/break values, sequences, binary operands, and conditional
  condition/arms in exact emission order, with one fact per discovered place;
  and
- typed index dispatch that distinguishes reference-base reads, one constant
  local-array element read, and every runtime local-array materialization read
  before its runtime index; and
- scalar local-initializer read planning before binding activation, preserving
  previous-binding identity across sequential and scoped shadowing, including
  source-ordered scalar operands of direct array literals, single-evaluation
  array repeats, and tuple literals, plus exact per-element projections for
  direct identifier-backed array and tuple copies and single-condition planning
  for conditional tuple initializers with direct literal branches, plus exact
  repeated-condition per-element planning for direct conditional array literals;
  plus exact prefix-once tuple and prefix-per-element array planning for direct
  sequence-wrapped literals; plus direct, direct-identifier conditional, and
  sequence-prefix/direct-identifier-tail fat-reference initializer reads; plus
  runtime range-endpoint reads followed by exact slice/string base reads, with
  a `Subslice` projection for local-array bases; recursive 64-level-bounded
  conditional, transparent return/break/inline-const, and sequence composition
  of those non-call fat-reference forms; plus direct, range-derived, and
  recursively conditional fat-reference explicit-return and final-tail reads;
  plus sequence-prefix and left-to-right argument reads for call-derived fat-
  reference initializers whose arguments are one-slot scalars, supported fat
  references, direct identifier-backed arrays and tuples, array literals or
  single-evaluation repeats, direct conditional arrays with literal branches,
  arrays accepted by a 64-level-bounded recursive per-element planner, including
  identifiers, contextual defaults, literals, repeats, integer-to-byte arrays,
  direct and wrapped array-producing calls, conditionals, transparent return/
  break/inline-const wrappers, and nested sequences, plus tuple-producing calls
  and bounded tuple value/field planners that mirror whole-value condition,
  sequence, inline-const, literal, identifier, and call lowering as well as
  per-field return, loop-break, ascription, and nested-sequence lowering,
  with one `Index` read per identifier-array element and numbered `TupleField`
  reads for identifier tuples, and with a sequence-array prefix repeated before
  every materialized element and nested branch prefix, exact `Index` reads
  retained for identifier tails, no invented element-place reads for contextual
  defaults, direct root repeats kept on their single-evaluation path, and scalar
  integer bases repeated once per emitted byte, direct array calls planned once,
  wrapped array calls planned once per materialized element, direct or
  whole-value-wrapped tuple calls planned once per tuple, and tuple calls below
  a per-field wrapper planned once per materialized field;
  and
- scalar expression-statement read planning across top-level bodies,
  conditional arms, direct loop actions, nested loop actions, and post-loop
  statements in the emitter's exact scoped order; and
- scalar read planning for top-level branch conditions and returns, while-loop
  heads, direct conditional loop controls, conditional loop blocks/arms and
  branch-local returns, explicit scalar returns, final scalar tails, and
  interleaved nested-loop controls in exact action-boundary/control order.
  Direct aggregate-producing calls used as supported explicit return operands
  or final tails now reserve their recursively validated arguments in call
  order. Complete direct fixed-array literals reserve their elements once in
  source order, and exact-count direct array repeats reserve their operand once;
  direct array identifiers reserve one indexed read per materialized element.
  Fixed-array materialization now preserves Rust single-evaluation semantics
  across returns, locals, discarded values, assignments, and call arguments.
  Sequence prefixes and conditions execute once per aggregate, selected
  branches and wrapped array-producing calls materialize once, and integer
  byte-conversion bases are saved once before byte extraction. Complete literal
  elements remain evaluated once in source order, identifiers retain indexed
  read evidence, and direct repeats retain their single operand evaluation.
  Aggregate admission is syntax-based, so unsupported packed aggregates cannot
  fall through the scalar planner. Supported tuple-value explicit returns and
  final tails now use the bounded whole-value tuple planner: sequence prefixes
  and conditions are reserved once, literal fields remain in source order,
  identifier copies retain numbered `TupleField` projections, and tuple-producing
  call arguments remain left-to-right. Public tuple transport remains
  unsupported; this evidence work does not invent an unstable Rust tuple ABI.
  Supported compound fixed-array index bases now reuse the same bounded whole-
  array planner before the index read, covering literal, conditional, wrapped,
  identifier, repeat, integer-byte, and array-producing-call materializers
  without guessing unsupported shapes.
  Non-call fat-reference returns now accept the emitter's bounded return/break/
  inline-const wrappers, sequence prefixes, and both conditional forms. Their
  read preanalysis mirrors the same recursion and source order. Direct and
  wrapped call-derived fat returns now validate their bounded call arguments,
  preserve left-to-right evidence, retain the System V register pair, and use
  checked hidden-pointer transport for the Windows return buffer.
  Other aggregate return/tail shapes remain outside preanalysis.
- initial fixed-capacity basic-block and control-flow-edge facts for supported
  top-level straight-line statements, simple and chained conditional returns,
  conditional action blocks, explicit returns, and final-tail return flow.
  Blocks carry stable IDs, exact top-level statement ranges, reachability, and
  explicit top-level, condition, branch-action, or else-action provenance;
  edges target another block or function return and distinguish true, false,
  and unconditional flow. Exhaustive `else if` return chains end in a false
  return edge, while non-exhaustive chains route the final false edge through an
  explicit top-level continuation block. Conditional action branches similarly
  route through explicit action and join blocks, and all-path final returns mark
  later top-level blocks unreachable. The tables are capped at 64 blocks and
  128 edges with explicit capacity errors.
  Initial top-level loop facts additionally represent `while` true/false
  headers, unconditional-loop entries, exact contiguous operation ranges,
  backedges, and ordered simple or conditional break/continue/return targets.
  Conditional loop blocks now add separately sourced condition and action
  blocks for primary, `else if`, and final `else` arms, with explicit joins and
  break/continue/return targets. Exhaustive all-terminal chains are detected
  structurally; malformed arm ranges/order and later unreachable operations
  fail closed. Nested loop blocks now use dedicated headers plus ordered action
  and control blocks; parser-resolved inner and outer break/continue targets,
  conditional returns, nested entry-condition exits, and divergent backedges
  are represented without replaying preceding outer operations. Duplicate,
  missing, or out-of-range control-order metadata fails closed. The parser's
  dedicated immediately-breaking `NestedUnitLoop` form remains inside the
  enclosing contiguous operation range, matching its existing no-op emitter
  semantics. Direct, conditional-block, and nested-loop operations after an
  unconditional terminal now begin disconnected unreachable blocks. Syntactic
  exits in those blocks do not make an enclosing continuation reachable.
  Conditional-assignment actions after a return now receive the same explicit
  treatment: bounded, separately sourced suffix blocks are disconnected and
  unreachable, have no incoming edge, and preserve their own return or join
  edge without making an enclosing continuation reachable. This closes the
  known CFG-suffix gap for runtime forms admitted by the supported parser.

The compiler core remains `no_std`, forbids unsafe code, uses no global
allocator, emits COFF and ELF64 for the documented subset, and fails closed on
unsupported semantics.

The direct callee-local reassignment milestone carries one compatible reference-
parameter origin through straight-line plain assignment to a mutable reference
local. The fixed local state is newest-first and generation-ordered; immutable,
projected, compound, local-backed, conditional, or unclassified assignments
make the proof conservative. The exact dated oracle accepted the reassigned
alias and post-last-use control and rejected a live competing mutable borrow with
E0499. Windows gnullvm and native Arch Linux WSL each pass 639 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 985
compiler tests per host. General interprocedural dataflow and regions remain
unsupported.

Direct unconditional returns now resolve from the current loop local/projected
state and terminate that modeled iteration. Disconnected suffix operations no
longer manufacture a backedge; for a condition-headed loop only the incoming
zero-iteration state can continue after the loop. ORACLE-0002 accepts a stable
same-origin return with an unreachable suffix and rejects local-backed storage
with E0515. Windows and Arch each pass 643 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 989 compiler tests per
host. Mixed break/continue exit-state joining remains unsupported.

Direct break exits now retain the current outer local/projected origin state.
Condition-headed loops intersect that exit with the incoming zero-iteration
path; unconditional loops use the exact break state, and loop-scoped locals are
discarded. ORACLE-0002 accepts the unconditional parameter overwrite and rejects
the corresponding `while` with E0515 because zero iterations retain local
storage. Windows and Arch each pass 643 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 989 compiler tests per
host. Conditional break/continue joins remain unsupported.

Conditional break paths now accumulate separately from the continuing/backedge
state. Multiple breaks intersect; condition-headed loops also join their
natural and zero-iteration exit, while unconditional loops expose only break
outcomes. ORACLE-0002 accepts a parameter-backed break with a local-backed
non-break path and rejects the reversed local-backed break with E0515. Windows
and Arch each pass 643 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 989 compiler tests per host.
Conditional continue and branch-block break transfer remain unsupported.

Direct continue now ends the current syntactic operation suffix and preserves
the current origin state as the sole backedge outcome. ORACLE-0002 accepts the
stable parameter-backed conditional return before that continue and reports a
later local assignment as unreachable. Windows and Arch each pass 643 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 989 compiler tests per host. Conditional continue remains unsupported.

Conditional continue paths now accumulate independently from their false-path
suffix, then intersect with direct-continue and normal-fallthrough backedges.
The joined state feeds the existing condition-headed natural exit. ORACLE-0002
accepts stable parameter-backed outcomes and rejects a local-backed fallthrough
backedge reaching a `while` tail with E0515. Windows and Arch each pass 643
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 989 compiler tests per host. Conditional-block terminal
continue remains unsupported.

Conditional action-block terminal break and continue arms now feed the bounded
loop-exit and backedge accumulators respectively. Terminal arms do not join the
state that reaches later operations; nonterminal arms and an implicit missing
else remain fallthrough outcomes. ORACLE-0002 accepts parameter-backed terminal
break/continue arms and rejects a local-backed break arm with E0515. Windows and
Arch each pass 643 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 989 compiler tests per host. Nested-loop state
transfer and general fixed points remain incomplete.

Nested-loop return/stability analysis now accepts an explicit incoming local,
projected, type, mutability, and compatibility state. The same implementation is
used both at function-level loop state and after outer-loop declarations,
assignments, and branch joins. Proven-stable nested edges preserve that outer
state. ORACLE-0002 accepts an outer same-origin reassignment before a nested
conditional return and rejects a local-backed reassignment with E0515. Windows
and Arch each pass 643 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 989 compiler tests per host.
General nested-loop exit-state transfer and fixed points remain incomplete.

Nested inner-break paths now accumulate exact outer-visible local/projected
origins and return the joined exit state to subsequent outer-loop operations.
Condition-headed inner loops include their zero-iteration state. Inner continue
and normal backedges remain stability-checked. ORACLE-0002 accepts a parameter
overwrite before an inner break and rejects local-backed and zero-iteration/
local outcomes with E0515. Windows and Arch each pass 643 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 989
compiler tests per host. General nested fixed points remain incomplete.

Labeled nested controls now export separate outer-break and outer-continue
origin states. The enclosing loop routes those outcomes into its existing exit
and backedge accumulators, while only an inner-loop exit permits subsequent
outer operations to execute. Earlier unconditional controls suppress later
ordered outcomes. ORACLE-0002 accepts the parameter-backed labeled break and
condition-headed labeled continue probes and rejects the equivalent local-
backed escapes with E0515. Windows and Arch each pass 643 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 989
compiler tests per host. General nested-loop fixed points remain incomplete.

Conditional labeled-control coverage now combines an outer-target break or
continue with a separately reachable inner exit. Focused cases prove that the
outer destination and inner fallthrough states remain independently joined;
local-backed alternatives fail closed. ORACLE-0002 accepts both parameter-
backed mixed paths and rejects both local-backed variants with E0515. Windows
and Arch each pass 643 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 989 compiler tests per host.
General nested-loop fixed points remain incomplete.

Nested normal-backedge analysis now admits one bounded normalization step. The
candidate produced by the complete action sequence must be idempotent on an
exact second replay, and every recorded return/break/continue prefix must retain
identical outer-visible origins from the initial and candidate headers. The
pinned oracle accepts a parameter overwrite before every conditional exit and
rejects the same exit placed before normalization with E0515. Windows and Arch
each pass 643 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 989 compiler tests per host. Multi-step,
branching, and general nested-loop fixed points remain incomplete.

Conditional inner-continue backedges now reuse the same bounded normalization
proof instead of requiring equality with the original header. The complete
transfer remains exactly idempotent, and every stored control prefix must agree
between initial and normalized headers. ORACLE-0002 accepts a parameter
overwrite before both continue and break controls and rejects controls that can
observe the earlier local-backed state with E0515. Windows and Arch each pass
643 library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 989 compiler tests per host. Unconditional normalized
continues and general fixed points remain incomplete.

Unconditional inner continues now normalize only their exact reachable action
prefix. The prefix candidate must be idempotent on replay, and every stored
control at or before that action index must retain identical origins; operations
after the unconditional continue are excluded. ORACLE-0002 accepts a parameter
overwrite before a conditional return and continue, reports the retained suffix
as unreachable, and rejects a return before normalization with E0515. Windows
and Arch each pass 643 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 989 compiler tests per host.
Multi-backedge fixed-point iteration remains incomplete.

Conditional inner backedges now use a bounded joined header. The initial state,
every conditional inner-continue prefix, and normal fallthrough are intersected;
one replay from that header must reproduce the same local/projected origins.
Break, return, and outer-continue prefixes must remain equal between the initial
and converged headers. ORACLE-0002 accepts parameter and local-backed continue
edges when every exit first restores the parameter, and rejects an early local-
backed break with E0515. Windows and Arch each pass 643 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 989
compiler tests per host. Unconditional mixed-backedge and broader iterative
fixed points remain incomplete.

The bounded joined-header proof now recognizes the earliest unconditional
nested-loop terminal. Conditional inner continues before that source-order
boundary feed the header; normal fallthrough is excluded, the terminal prefix
must agree between initial and converged headers, and later operations remain
unreachable. ORACLE-0002 accepts differing conditional backedges followed by a
parameter-normalized unconditional break and rejects an earlier local-backed
break with E0515. Windows and Arch each pass 643 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 989 compiler
tests per host. Nested branching transfers and broader iterative fixed points
remain incomplete.

An unconditional inner-continue terminal now contributes its exact prefix as
another backedge rather than an exit. It joins initial entry and every earlier
conditional inner continue, must reproduce the same header on replay, and keeps
its suffix unreachable; only returns and other exits require header-invariant
prefixes. ORACLE-0002 accepts mixed parameter/local backedges after a parameter-
backed return prefix and rejects the same return before normalization with
E0515. Windows and Arch each pass 643 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 989 compiler tests per
host. Nested branching transfers and broader iterative fixed points remain
incomplete.

The modeled nested-loop origin header now iterates its monotone meet to a fixed
point. Direct origins and retained projected facts may only disappear, so the
loop is bounded by `local_count + projected_origin_count + 1`; exceeding that
bound fails closed. Exit prefixes are checked only after convergence. A focused
two-alias chain requires multiple transfers before a local origin reaches the
header, then restores the parameter before every exit. ORACLE-0002 accepts that
case and rejects the early-exit ordering with E0499. Windows and Arch each pass
643 library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 989 compiler tests per host. This completes iterative header
convergence for the currently modeled flat nested-loop actions and controls;
nested branch-action representation and general region inference remain
incomplete.

The nested branch-action representation now has a bounded parser-level record.
It preserves a branch condition, up to four scoped local/assignment/expression
actions, a target-aware terminal, and exact ordering relative to surrounding
nested-loop actions and controls. One explicit `else` arm can now retain the
same bounded actions and terminal. The CFG models that successor with a distinct
else-action block, false edge, and independent terminal target; ownership
locations distinguish else actions and return values. Native and constant
execution were initially rejected. Constant evaluation now selects exactly one
arm, executes its scoped actions, and routes its terminal under the existing
bounded loop evaluator. Direct and helper-inlined x86-64 emission now lowers
scalar else arms. Exact parameter-backed reference returns are also admitted;
branch-local returned origins fail closed. The
single-arm CFG assigns separate condition and
scoped-action blocks, routes false fallthrough and target-aware true terminals,
and maps condition/action/return ownership locations back to those control
points. Branch-return origin transfer applies the exact scoped action prefix:
parameter-backed reborrows are admitted and local-backed returns fail closed.
Branch breaks transfer the exact scoped state to inner/outer exits, as do outer
continues. Inner continues feed their scoped state into the existing monotone
bounded header convergence, and subsequent exits must match the converged
header. Constant semantics are implemented: taken actions use a
scoped resolver checkpoint and target-aware break, continue, and return reuse
the existing bounded loop evaluator. Direct and inline native x86-64 lowering
mirrors those actions, scoped cleanup, and terminals for scalar-only primary and
else arms. Primary and else native reference-return branches are admitted only
after the exact function-return outlives proof; a branch-local else return is
rejected. Reference break/continue branches use the bounded destination/backedge
transfer above. ELF64 and COFF probes cover separate return, continue, and break
prefixes, direct and helper-inlined scalar else returns, and a parameter-backed
mutable-reference else return. Windows and
Arch each pass 645 library
tests, one component-interface probe, 10 conformance tests, and 336 replacement
tests: 992 compiler tests per host.

The nested branch alternative record now distinguishes an unconditional
`else` from one explicit `else if` by retaining an optional condition and exact
span. Parsing remains bounded to one alternative arm and four scoped actions.
Constant evaluation lazily tests the alternative only after a false primary,
executes only the selected scoped actions, and preserves fallthrough when both
conditions are false. CFG construction now gives the alternative condition a
distinct sourced block, routes primary false into it, routes alternative true
into scoped actions, and retains alternative false as fallthrough. Ownership
preanalysis records and maps the alternative-condition reads separately from
its actions and terminal. Direct and helper-inlined x86-64 emission now lazily
tests the alternative condition after primary false, routes true through the
existing scoped actions and terminal, and preserves false fallthrough. ELF64
and COFF probes cover both native paths. The parser now retains up to four
ordered alternatives, including an optional final `else`, and constant
evaluation lazily selects only the first matching arm. CFG and ownership now
give every alternative condition, action block, and return value an exact arm
index and route false edges through the ordered chain; an unconditional final
arm is exhaustive. Direct and helper-inlined x86-64 emission now lowers all
bounded alternatives in source order, with ELF64 and COFF probes for both
paths. Direct and helper-inlined mutable-reference chain probes retain the
parameter origin across every indexed arm, and a later local-backed arm fails
the exact return-outlives proof. The exact dated oracle
accepts an independently authored Rust 2024 four-outcome chain. Windows and Arch each continue
to pass 645 library tests, one component-interface probe, 10 conformance tests,
and 336 replacement tests: 992 compiler tests per host.

The conditional callee-local reassignment milestone evaluates supported direct
assignments from a copy of the incoming fixed local-origin state for every
conditional outcome, then joins each local independently. A missing `else`
contributes the unchanged fallthrough state. Equal parameter origins remain
exact; differing origins make only the affected local unknown. Unsupported
branch actions and assignment shapes remain conservative. ORACLE-0002 accepted
equal-origin branches and post-last-use owner reuse and rejected a live
competing mutable owner borrow with E0499. The Windows gnullvm canonical suite
passes 639 library tests, one component-interface probe, 10 conformance tests,
and 335 replacement tests: 985 compiler tests. The Arch Linux WSL rerun did not
reach compiler execution because concurrent `org.mrml.library.uefi` isolation
metadata failed build-graph validation; that run is recorded as blocked, not
passing evidence. General interprocedural CFG, alias, and region analysis remain
unsupported.

The branch-local callee-origin milestone copies the fixed name/origin/mutability
state for each conditional action block. Supported local reference declarations
may feed later direct assignments in that branch; newest-first shadowing remains
scoped, and branch-local entries are discarded before joining the pre-existing
locals. Local-backed aliases make the affected result unknown, while returns,
expressions, projected or compound writes, and unsupported actions fail closed.
ORACLE-0002 accepted same-origin branch-local aliases and post-last-use owner
reuse and rejected a live competing mutable owner borrow with E0499. Windows
gnullvm and native Arch Linux WSL each pass 639 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 985 compiler
tests per host. Arbitrary branch dataflow, nested projections, and general
regions remain unsupported.

The branch-local return-origin milestone resolves a terminal explicit return
using aliases accumulated earlier in that conditional action block. Its exact
parameter origin joins the other callee exits, and the terminal path is excluded
from the conditional fallthrough-state join. Local-backed, nonterminal,
malformed, and unsupported returns fail conservative. ORACLE-0002 accepted the
branch-local early return, its parameter-backed tail, and post-last-use owner
reuse, and rejected a live competing mutable owner borrow with E0499. Windows
gnullvm and native Arch Linux WSL each pass 639 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 985 compiler
tests per host. General control-flow and region inference remain unsupported.

The loop callee-local reassignment milestone applies one bounded transfer when a
`while` body contains only supported direct assignments, then joins it with the
incoming zero-iteration state. Same-origin reborrows remain exact; a changed
origin becomes unknown. Mixed control, return, local, expression, nested-loop,
or unsupported assignment operations remain conservative. ORACLE-0002 accepted
the same-origin loop and post-last-use owner reuse and rejected a live competing
mutable owner borrow with E0499. Windows gnullvm and native Arch Linux WSL each
pass 639 library tests, one component-interface probe, 10 conformance tests, and
335 replacement tests: 985 compiler tests per host. General loop fixed-point,
path-sensitive, alias, and region analysis remain unsupported.

The loop-local callee-origin milestone permits bounded local reference
declarations in that assignment-only transfer. Per-iteration name/origin/
mutability entries are discarded before joining only the pre-loop locals with
the zero-iteration state. Same-parameter origins remain exact; local-backed or
changed origins become unknown, and mixed controls remain conservative.
ORACLE-0002 accepted the loop-local alias and post-last-use owner reuse and
rejected a live competing mutable owner borrow with E0499. Windows gnullvm and
native Arch Linux WSL each pass 639 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 985 compiler tests per
host. One concurrent Arch invocation exited during replacement execution
without a stable failing summary; the immediate full rerun passed 985. General
loop fixed-point, path-sensitive, and region analysis remain unsupported.

The conditional-loop arm-local return milestone gives each supported loop
`if`/`else if`/`else` arm an independent fixed-capacity local alias state before
a terminal return. Its exact parameter origin joins other function exits;
local-backed returns fail closed. Assignments and expressions inside these arms
remain conservative because loop-carried fallthrough effects are not modeled.
ORACLE-0002 accepted the loop-arm local alias and post-last-use owner reuse and
rejected a live competing mutable owner borrow with E0499. Windows gnullvm and
native Arch Linux WSL each pass 639 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 985 compiler tests per
host. General loop dataflow, nested projections, and regions remain unsupported.

The nested-loop local return milestone applies one fixed local-only alias state
to the supported unconditional and conditional returns of a parsed nested loop
block. Exact parameter origins merge with other function exits; local-backed
returns, assignments, and expressions fail conservative. ORACLE-0002 accepted
the nested-loop local alias and post-last-use owner reuse and rejected a live
competing mutable owner borrow with E0499. Windows gnullvm and native Arch Linux
WSL each pass 639 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 985 compiler tests per host. General nested-
loop fixed-point, path-sensitive, and region analysis remain unsupported.

The indexed aggregate call-origin milestone accepts a scalar-reference return
from an exact indexed place rooted at a compatible array-reference or slice-
reference parameter. Element type and mutability must match, and the projection
is exactly `Index` with at most one preceding explicit `Dereference`. The caller
retains the whole parameter origin. Identity, mismatched, shared-to-mutable,
deeper, and unrelated projections fail closed. ORACLE-0002 accepted the indexed
array-element return and post-last-use reuse and rejected a live competitor with
E0499. Windows gnullvm and native Arch Linux WSL each pass 640 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
986 compiler tests per host. General aggregate and index-sensitive alias
analysis remain unsupported.

The slice-reference half now has direct evidence through a distinct mutable-
slice target and caller rather than inference from the array case. ORACLE-0002
accepted post-last-use indexed slice reuse and rejected a live indexed competitor
with E0499 and E0503. Both canonical hosts retain 640 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 986
compiler tests per host. Subslice and disjoint-index alias analysis remain
unsupported.

The subslice call-origin milestone retains a compatible array/slice-reference
parameter origin through exact `Subslice` into a slice-reference result. Element
type and mutability must match and at most one explicit dereference may precede
the subslice. Caller preanalysis now classifies an unprojected unclassified read
of a loan-backed fat-reference local as `LoanUse`, preserving liveness when the
returned subslice is indexed. ORACLE-0002 accepted array and slice post-last-use
restoration, rejected both live competitors with E0499, and additionally emitted
E0503 for the slice. Windows gnullvm and native Arch Linux WSL each pass 640
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 986 compiler tests per host. General subslice disjointness,
deeper projections, and regions remain unsupported.

The projected-alias hardening milestone carries exact array-element and slice-
subslice parameter origins through one direct local alias. Explicit alias types
must equal the call target's return type before origin retention; inferred
aliases reuse the already compatible initializer result. Live competing caller
borrows fail, post-last-use owner access succeeds, and mismatched explicit alias
types fail the standalone interprocedural proof closed. Both canonical hosts
pass 986 compiler tests.

Alias return compatibility is now retained alongside every modeled local's
name, origin, and mutability. Plain reassignment consults that state, preventing
an explicitly incompatible mutable local from acquiring a return origin after
initialization. Straight-line and both-arm conditional controls fail closed;
the exact oracle accepts a compatible scalar-reference reassignment and rejects
the slice/scalar mismatch with E0308. Both canonical hosts pass 986 compiler
tests.

The bounded callee-local type-state milestone adds one fixed type slot per
modeled local and derives reference types through the canonical projection
walker. It supports address-of, exact index/subslice, identifiers, transparent
wrappers, sequence tails, and equal conditional results. A local-backed inferred
scalar alias may now be replaced on every modeled path by a compatible indexed
parameter reference and retain that parameter origin. Mismatched annotations or
ascriptions fail closed. ORACLE-0002 accepted direct and conditional local-
backed replacement and rejected a slice initializer annotated as scalar with
E0308. Both canonical hosts pass 986 compiler tests.

The mutable-to-shared projected-return milestone applies the canonical
directional reference compatibility relation to callee-local annotations and
return state. Direct loan derivation accepts a mutable borrow effect for a
shared destination but records the resulting loan as shared. A live caller
mutation conflicts, post-last-use mutation succeeds, and ORACLE-0002 rejects
the live indexed-array case with E0503. Both hosts pass 986 tests.

Shared fat-slice evidence covers a mutable slice subslice flowing through a
mutable local and then a shared local before return. Caller indexing retains
loan liveness: a live mutation conflicts and post-last-use mutation succeeds.
ORACLE-0002 rejects the live case with two E0503 diagnostics. Both hosts pass
986 compiler tests.

Alias assignment transfer now checks the inferred RHS reference type against
the retained local type before changing its origin. Mutable-to-shared remains
accepted; shared-to-mutable fails the standalone callee proof closed rather
than exploiting a compatible shared function return. ORACLE-0002 accepts the
former and rejects the latter with E0308. Both hosts pass 986 tests.

The projected-callee-origin foundation adds a fixed-capacity table keyed by
stable local index plus a validated nonempty projection. Entries retain final
projected type, parameter origin, and checked monotonic generation. Exact
replacement updates one key; branch intersection keeps only identical typed
origins and preserves the maximum generation. Invalid/empty projections and
capacity overflow fail closed. The first transfer integration now accepts one
exact straight-line numeric tuple-field assignment on a mutable local. The RHS
must match the projected field type; assignment replaces or clears the field
generation, and return inference consults the exact projected state. Existing
dereference/subslice local-origin behavior is unchanged.
ORACLE-0002 accepts a field initialized from one mutable-reference parameter and
replaced by a second, accepts owner reuse after the returned child's last use,
and rejects a live competing borrow of the second owner with E0499. It rejects
local-backed field initialization followed by parameter replacement with E0515,
and MRML likewise does not claim that shape. Windows and Arch each pass 641
library, 1 component, 10 conformance, and 335 replacement tests: 987 per host.

The conditional projected-origin integration forks the fixed projected state
for each arm and intersects fallthrough outcomes. Equal typed tuple-field
origins survive; unequal origins and a non-exhaustive path retaining the incoming
generation become unknown. Return-only arms remain exit evidence rather than
post-conditional state. ORACLE-0002 accepts exhaustive replacement from a first
mutable-reference parameter to a second, accepts second-owner reuse after the
returned child's last use, and rejects a live competitor with E0499. Windows
and Arch remain at 987 tests per host. Projected loop writes require the
separately bounded stable-loop rule below.

The stable projected-loop slice starts only from field evidence established
before the loop. It admits an identity reborrow of that same tuple field in one
modeled iteration, normalizes only the trailing identity dereference for origin
lookup, and intersects iteration state with the zero-iteration incoming state.
Changed or unavailable origins disappear. ORACLE-0002 accepts the exact pre-loop
replacement and loop self-reborrow, accepts second-owner reuse after last use,
and rejects a live competitor with E0499. Windows and Arch remain at 987 tests
per host; this is not general loop fixed-point or region inference.

Exact typed tuple-literal locals now seed projected origins at declaration.
Reference elements must match both their declared field type and the callee
return type, and only parameter-backed elements record evidence. Scalar and
local-backed fields remain non-origin state; invalid shapes and capacity
exhaustion fail closed. Top-level, conditional-action, conditional-loop, and
loop-body local paths share this transfer. ORACLE-0002 accepts direct initialized
field return and a loop identity-reborrow from that field, accepts owner reuse
after last use, and rejects a live competing borrow with E0499. Windows and Arch
remain at 987 tests per host.

Root-alias conditional and stable-loop joins now accept an exact typed projected
tuple-field RHS. Equal-origin exhaustive branches retain the field owner; a
missing branch with a different incoming alias becomes unknown. The loop joins a
projected self-reborrow with the zero-iteration projected incoming alias and
rejects a differing incoming origin. ORACLE-0002 accepts both equal-origin forms,
accepts restoration after last use, and rejects a live projected-owner competitor
with E0499. Windows and Arch remain at 987 tests per host.

Branch-local tuple initialization now feeds exact field origins into an outer
root alias in conditional action blocks. Before fallthrough joins, projected
state retains only entries whose local index predates the branch; scoped entries
cannot survive and collide with later slot reuse. ORACLE-0002 accepts equal-
origin branch-local assignment, rejects a live competitor with E0499, and rejects
return of a later local-backed tuple with E0515. A focused state test proves
prefix retention, and Windows/Arch remain at 987 tests per host.

The loop-local projected-origin slice creates an iteration-local tuple from an
outer alias identity reborrow, assigns its field back into the alias, and joins
that one-iteration origin with the zero-iteration incoming state. A local-backed
iteration clears the result; loop-local projected entries cannot survive the
incoming-state intersection. ORACLE-0002 accepts the stable form, rejects a live
competitor with E0499, and rejects local-backed escape with E0515. Windows and
Arch remain at 987 tests per host.

The projected loop-branch return slice permits a conditional loop arm to create
an exact typed tuple from a mutable-reference alias reborrow, assign that field
back into the alias, and immediately return it. The bounded action walker admits
only tuple-field assignment RHS places; other loop-arm assignments and
expressions remain conservative. ORACLE-0002 accepted the parameter-backed form
and post-last-use owner reuse, rejected a live competing owner borrow with
E0499, and rejected a local-backed field return with E0515. Windows and Arch
each pass 987 compiler tests. General loop dataflow and regions remain
unsupported.

Nested-loop projected-return evidence now applies the same bounded tuple-field
assignment action before a conditional return. ORACLE-0002 accepted the
parameter-backed reborrow and post-last-use restoration and rejected live
competition with E0499 and local-backed escape with E0515. Windows and Arch each
pass 987 compiler tests. This adds evidence, not nested fixed-point analysis.

Conditional projected-loan ancestry now follows an exact tuple field through
its recorded initializer and reassignment generations instead of stopping at
the projected path. A conditional assignment selecting either of two mutable-
reference fields therefore retains both possible owners: live mutation of each
owner fails, while both are restored after the child's last use. ORACLE-0002
accepted both restoration controls and rejected both competitors with E0499.
Windows and Arch each pass 987 compiler tests. Unknown projections and general
path-sensitive regions remain unsupported.

Projected ancestry across an overwritten tuple field retains every exact field
generation rather than selecting only the latest. ORACLE-0002 rejected use of
the initializer owner with E0503 and the replacement owner with E0499 while a
moved child remained live, then accepted both owners after last use. Windows and
Arch each pass 987 compiler tests. The traversal is fixed-capacity and does not
infer unknown aggregate generations.

Projected grandchild coverage proves that a mutable reborrow through a child
moved from an exact tuple field recursively reaches the field's parameter owner.
ORACLE-0002 rejected a live owner competitor with E0499 and accepted owner reuse
after the grandchild's last use. Windows and Arch each pass 987 compiler tests.
General indirect regions remain unsupported.

Projected call-assignment coverage proves that an exact identity-call result
assigned into an existing mutable-reference local retains ancestry when its
returned argument is a tuple field. ORACLE-0002 rejected a live ultimate-owner
competitor with E0499 and accepted restoration after the assigned child's last
use. Windows and Arch each pass 987 compiler tests. This does not generalize
unknown call summaries or projected arguments.

Conditional projected call-result coverage carries both exact tuple-field
owners through an identity call and assignment into an existing local.
ORACLE-0002 rejected live use of either owner with E0503 and accepted restoration
of each after the assigned child's last use. Windows and Arch each pass 987
compiler tests. General call summaries and path-sensitive regions remain
unsupported.

Projected shared-call invalidation now covers a shared call through an exact
tuple-field parent while a mutable child of that field is live. ORACLE-0002
rejected the overlap with E0502 and accepted the call after the child's last
use. Windows and Arch each pass 987 compiler tests. Unknown call summaries and
general regions remain unsupported.

Projected mutable-call invalidation covers a mutable call through an exact
tuple-field parent while a shared child of that field remains live. ORACLE-0002
rejected the overlap with E0502 and accepted the call after the child's last
use. Windows and Arch each pass 987 compiler tests. This complements the shared-
call case without claiming general projected call summaries or regions.

Mutable-to-shared projected assignment coverage now includes one exact tuple
field and a conditional choice between two fields. Each explicit shared-
reference destination retains all possible owners; focused MRML tests reject
live competing mutable reborrows and accept restoration after last use.
ORACLE-0002 rejected direct live-owner use with E0503 and accepted the same
restoration controls. Windows and Arch each pass 987 compiler tests.

Direct dereference writes through mutable-reference parameters now produce
loan-mutation effects as well as equivalent writes through proven local
reference loans. Focused coverage rejects mutation after direct shared
assignment, exact tuple-field assignment, and either arm of a conditional
tuple-field assignment while the child remains live; last-use controls remain
accepted. ORACLE-0002 rejected the direct form with E0506 and the conditional
projected form with E0503, and accepted the direct last-use control. Windows and
Arch each pass 987 compiler tests.

Nested parameter-owner invalidation now has focused coverage through a mutable
parent, mutable child, and shared grandchild. A direct incoming-owner write is
rejected while the grandchild remains live and accepted after its last use.
ORACLE-0002 reports E0503 for the live case and accepts the control. Windows and
Arch each pass 987 compiler tests; general indirect regions remain unsupported.

A shared child created after an optional mutable-parent reassignment now has
direct mutation coverage for both reaching owner generations. Each live-owner
write is rejected and both owners are writable after the child's last use.
ORACLE-0002 reports E0503 for both conflicts and accepts the combined control.
Windows and Arch each pass 987 compiler tests; this remains a bounded CFG join.

A single-exit loop-carried mutable-parent generation now has direct mutation
coverage for both its pre-loop and assigned-before-break owners. Both conflicts
fail while the post-loop shared child remains live, and both owners are restored
after its last use. ORACLE-0002 reports E0503 for each conflict and accepts the
combined control. Windows and Arch each pass 987 compiler tests.

Call-derived mutable references now have focused shared-child invalidation
coverage for the exact identity and conditional same-parameter summaries. A
direct owner write fails while the child is live and succeeds after its last
use. ORACLE-0002 reports E0503 for both call shapes and accepts both controls.
Windows and Arch each pass 987 compiler tests; general call summaries remain
unsupported.

Shared children of exact identity and conditional same-parameter mutable call
results now have return-outlives coverage. Parameter-backed children return;
equivalent local-backed children fail with the bounded outlives diagnostic.
ORACLE-0002 accepts both parameter cases and rejects both local escapes with
E0515. Windows and Arch each pass 642 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 988 tests per host.

Explicit and conditional return sites now preserve the same call-derived shared-
child outlives result as the tail. Parameter-backed identity and conditional
same-parameter children return successfully; equivalent local-backed sites fail
closed. ORACLE-0002 accepts both parameter cases and rejects both local escapes
with E0515. Windows and Arch remain at 988 compiler tests per host.

Loop-contained direct and conditional returns now preserve call-derived shared-
child origins. Both parameter-backed forms pass, while matching loop-local
escapes fail closed. ORACLE-0002 accepts the parameter cases and rejects the
local cases with E0515. Windows and Arch remain at 988 compiler tests per host;
general loop fixed points remain unsupported.

Shared children of projected callee returns now preserve a proven second-
parameter origin through straight-line and exhaustive conditional tuple-field
replacement summaries. Parameter-backed calls pass; substituting a caller-local
second argument fails closed. ORACLE-0002 accepts the two parameter cases and
rejects both local escapes with E0515. Windows and Arch each pass 642 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 988 compiler tests per host. General interprocedural lifetime inference
remains unsupported.

Explicit and conditional return sites now retain the projected callee summary's
shared-child origin. Parameter-backed cases pass and matching local-backed cases
fail closed; ORACLE-0002 reports E0515 at both local return sites. Windows and
Arch remain at 988 compiler tests per host. General interprocedural lifetime
inference remains unsupported.

Loop CFG loan reachability now blocks the current borrower generation point and
does not attribute an earlier static use reached after event-order wrap to the
prior dynamic generation. A shared-call result used after owner mutation still
fails with `RuntimeBorrowConflict`/E0506; copying the pointee first permits owner
mutation and the next iteration. Windows and Arch remain at 989 compiler tests.
This is a bounded generation rule, not a general loop-region fixed point.

Mutable-reference identity calls now exercise the same loop-generation boundary.
A later same-iteration result use rejects owner mutation with
`RuntimeBorrowConflict`, matching ORACLE-0002 E0503; copy-before-mutation permits
the backedge. Windows and Arch remain at 989 compiler tests per host.

Conditional shared-reference call origins now exercise both possible owners at
the same loop-generation boundary. Mutation of either candidate before the
result's later same-iteration use fails with `RuntimeBorrowConflict`, matching
ORACLE-0002 E0506; copy-before-mutation permits both owner writes and the
backedge. Windows and Arch remain at 989 compiler tests per host.

Nested `while` control flow now exercises the conditional shared-reference
generation boundary at the inner backedge. Same-iteration owner mutation before
the later result use fails with `RuntimeBorrowConflict`, matching ORACLE-0002
E0506; copying first permits both owner writes across the nested loop structure.
Windows and Arch remain at 989 compiler tests per host. This is nested bounded
CFG evidence, not a general loop-region fixed point.

The callee-origin engine now applies one bounded transfer to each nonterminal
conditional arm inside a supported `while`, joins only its fallthrough states
(including the implicit unchanged path when no final `else` exists), and then
intersects that result with the zero-iteration input. Existing reference aliases
may receive direct assignments on fallthrough or terminal-return arms, and a
terminal return resolves the post-assignment state. Break/continue arms, nested-
loop transfers, expressions, and unstable origins remain conservative. ORACLE-
0002 accepts the stable same-origin reborrow and rejects a local-backed arm with
E0515. Windows and Arch remain at 989 compiler tests per host.

Nested-loop return-origin transfer now uses each return control's validated
action index and source order. Each reachable return replays only its preceding
bounded action prefix from the incoming state; an earlier unconditional nested
control makes later returns unreachable. Direct alias assignments in that exact
prefix are supported, while local-backed or inconsistent reachable exits remain
fail-closed. ORACLE-0002 accepts the ordered parameter-backed case and rejects
an earlier local-backed conditional return with E0515. Windows and Arch each
pass 643 library tests, one component-interface probe, 10 conformance tests, and
335 replacement tests: 989 compiler tests per host. General nested-loop fixed
points, path-sensitive regions, and complete Polonius reasoning remain
unsupported.

Nested-loop callee summaries now require every modeled inner backedge and
break/continue state edge to preserve the incoming outer local and projected
origins. Prefix transfer uses the same exact action indices as return transfer;
local declarations are discarded, and origin generations do not create false
instability. ORACLE-0002 accepts a temporary local alias restored to the
parameter before the backedge and rejects the unrestored local-backed cycle
with E0515. Windows and Arch each pass 643 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 989 compiler
tests per host. This is bounded stable-backedge proof, not general nested-loop
fixed-point or region inference.

Direct conditional returns now participate in the loop local-origin transfer
after supported declarations and assignments. Their taken edge merges the
current exact parameter origin into the function result, while their untaken
edge continues with the unchanged current state toward later operations and the
backedge/zero-iteration intersection. ORACLE-0002 accepts the stable same-origin
reborrow and rejects a local-backed replacement with E0515. Windows and Arch
each pass 643 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 989 compiler tests per host. Unconditional
return, mixed break/continue transfer, and general fixed points remain
unsupported.

Mixed conditional loop arms now partition exit and backedge evidence: supported
terminal returns merge directly into the function result, while only nonterminal
arms join the one-iteration state before its zero-iteration intersection. Direct
alias assignment in a terminal arm is applied before resolving that return;
local-backed replacements fail closed. Break, continue, expressions, and nested-
loop transfer remain conservative. ORACLE-0002 accepts a parameter-backed
return/stable-fallthrough pair and terminal same-origin reassignment, and rejects
immediate or loop-carried local-backed returns with E0515. Windows and Arch
remain at 989 compiler tests per host.

Direct and conditional return sites inside supported `loop` blocks now retain
the projected callee summary's shared-child origin. Parameter-backed second
arguments pass and matching loop-local second arguments fail closed. ORACLE-0002
accepts both parameter cases and rejects both local escapes with E0515. Windows
and Arch each pass 642 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 988 compiler tests per host.
General loop and region fixed points remain unsupported.

Nested supported `loop` returns now retain projected callee-summary shared-child
origins. Every direct place passed to a reference-typed parameter receives its
implicit reborrow effect. Every reference argument loan remains live with a
reference result, while only the proven origin supplies its pointer ancestry.
The formerly conservative nonterminal inner backedge now matches ORACLE-0002
and passes after the result dies; a competing borrow of a non-origin argument
while the result is live fails with `RuntimeBorrowConflict`, matching E0499. An
inner-loop-local origin still fails with E0515. Windows and Arch each pass 642
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 988 tests per host. General loop fixed points are unsupported.

A focused non-origin-local case proves that returned-pointer ancestry and call-
argument loan lifetime remain distinct: the result origin resolves to the
parameter-backed second argument, but a local first-argument loan still prevents
escape. MRML fails with `RuntimeReferenceOutlivesFunction`, matching ORACLE-0002
E0515. Both hosts remain at 988 compiler tests.

The complementary last-use case copies through the result, then mutates the
non-origin local successfully after its tied loan dies. ORACLE-0002 accepts the
same non-lexical release. Windows and Arch remain at 988 compiler tests.

Conditional same-place call arguments now have focused joined-reborrow evidence.
Both arms borrow under the expected mutable-reference parameter type; a live
result rejects a competing owner borrow with `RuntimeBorrowConflict`/E0499, and
post-last-use mutation succeeds. Both hosts remain at 988 compiler tests.

Distinct-owner conditional arguments retain both possible loans at the join.
A live result blocks competing access to either owner with
`RuntimeBorrowConflict`, matching ORACLE-0002 E0503; after the result's last use,
both owners can be mutated. Windows and Arch remain at 988 compiler tests.

Conditional call-result escape joins now have direct evidence: two parameter-
backed arms may return a shared child, while a parameter/local pair fails with
`RuntimeReferenceOutlivesFunction`, matching ORACLE-0002 E0515. Both hosts
remain at 988 compiler tests; general region inference remains unsupported.

A bounded scalar `shared_identity(&u16) -> &u16` call target now covers shared-
reference parameter/result liveness. A live result rejects owner mutation with
`RuntimeBorrowConflict`, matching ORACLE-0002 E0502; after copying the pointee,
owner mutation succeeds. Windows and Arch remain at 988 compiler tests.

Scalar shared-call escape analysis now has a focused unit: a parameter-backed
`shared_identity` result returns successfully, while a local-backed result fails
with `RuntimeReferenceOutlivesFunction`, matching ORACLE-0002 E0515. Windows and
Arch each pass 643 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 989 compiler tests per host.

Conditional shared-reference call arguments now retain both possible owner loans
at their join. A live result rejects mutation of either owner with
`RuntimeBorrowConflict`, matching ORACLE-0002 E0506; after last use, both owners
are mutable. Windows and Arch remain at 989 compiler tests per host.

Conditional shared-call escape joins accept two parameter-backed arms and reject
a parameter/local origin set with `RuntimeReferenceOutlivesFunction`, matching
ORACLE-0002 E0515. Both hosts remain at 989 compiler tests; general shared-region
inference remains unsupported.

Multi-field tuple literals retain a separate projected origin per field. A
conditional reference element seeds its field only when both arms prove the
same parameter; unequal first/second origins fail closed. Focused caller tests
retain the second owner's loan, reject a live competitor, and accept restoration
after last use. ORACLE-0002 accepts the exact equal-origin conditional element
and rejects the competitor with E0499. Both hosts remain at 987 tests.

One consuming move from an initialized tuple field into an explicitly typed
reference local now retains the field's parameter origin through return. The
same transfer covers an equal-origin conditional field. Non-tuple or unavailable
local types make the projected-initializer hook a no-op rather than aborting an
already valid alias proof; malformed tuple initialization remains conservative.
ORACLE-0002 accepts both moved-alias forms, accepts owner restoration after last
use, and rejects a live competitor with E0499. Windows and Arch remain at 987
tests per host.

The projected-origin move-chain evidence now covers two successive consuming
reference locals plus one post-join move after exhaustive equal-origin field
assignment and stable loop field reborrow. The retained parameter origin crosses
each local generation without replacing the preceding projected or control-flow
proof. ORACLE-0002 accepts the chain, conditional, and loop forms, accepts owner
restoration after last use, and rejects the live chain competitor with E0499.
Windows and Arch remain at 987 tests per host.

Numeric tuple fields now participate in bounded reference RHS type inference.
Assignment from a compatible field into an existing root reference alias carries
the field's parameter origin; a local-backed field clears it. The established
inferred local-backed alias replacement remains accepted because type eligibility
is not incorrectly equated with initializer origin. ORACLE-0002 accepts the
projected and inferred replacement forms, accepts restoration after last use,
and rejects the live projected-owner competitor with E0499. Windows and Arch
remain at 987 tests per host.

Inferred locals now become reassignment-origin eligible only when their
initializer already proved a compatible parameter origin. This preserves valid
indexed scalar alias replacement while preventing an inferred slice alias from
acquiring a scalar return origin through direct or both-arm conditional
assignment. ORACLE-0002 accepts the compatible replacement and rejects the
inferred mismatch with two E0308 diagnostics. Both hosts pass 986 tests.

This is an initial typed body-fact slice, not a complete typed body IR and not a
borrow checker. Unsupported aggregate-leaf call arguments, other aggregate-
argument and call-derived fat-reference initializers, unsupported compound array
bases, method/call families, unsupported tuple-value shapes, and other body reads
remain emission-time facts.
Names are still
resolved during
emission, expanded inlined-helper declarations append dynamically, and read-
place discovery is not yet body-wide. Parser locals do not yet carry these IDs.
Array-element move paths and remaining indirect move/borrow classification,
unsupported expression/control-flow forms, complete loans, indirect alias
invalidation, unsupported coercion sites, regions,
Polonius-style analysis, and a general trait solver are unimplemented. The root
initialization sites do not claim that unreachable or divergent declarations
execute.

## Next compiler work

Continue the dependency chain instead of filling arbitrary historical Rust
compatibility gaps:

1. supported owned arrays currently contain only `Copy` scalar elements, and
   modern Rust rejects indexed moves from non-`Copy` arrays. Do not add array
   move paths until a supported legal operation such as bounded destructuring
   requires them, and never turn summary runtime indexes into exact paths;
2. extend indirect alias invalidation and full reborrow semantics beyond the
   direct shared-loan conflict set, bounded multi-level mutable-ancestor
   suspension, and bounded repeated direct tuple-field sources, then stage
   flow-sensitive outlives reasoning with independent accepted/rejected probes.

Return coercion sites now apply the declared shared or mutable reference context
to direct, projected, and conditional reference places in explicit returns,
conditional returns, supported loop returns, conditional action returns, and the
tail. Explicitly typed reference locals therefore reborrow at the function
boundary; inferred non-`Copy` bindings remain consuming moves. Unsupported
indirect shapes retain conservative move classification.

Modern trait solving, naked functions/`naked_asm!`, inline assembly, security
profiles, and compiler-derived executable metadata remain important later
milestones. Do not attempt the complete borrow checker or trait solver in one
patch, and do not discard the existing compiler implementation.

## Clean-install toolchains

Windows uses GNU/LLVM (`x86_64-pc-windows-gnullvm`), not MSVC. With rustup
already installed, install the pinned nightly and target components required by
the repository before testing. The exact dated oracle toolchain must remain
available for black-box oracle work; the workspace `rust-toolchain.toml` also
requires `rustfmt`, `clippy`, `rust-src`, `nvptx64-nvidia-cuda`, and
`x86_64-unknown-none` and `x86_64-unknown-uefi`.

On Arch Linux, install the native build prerequisites required by the linker and
use rustup's `nightly-2026-08-29-x86_64-unknown-linux-gnu` toolchain with the same
declared components and targets. Do not infer successful cross-host verification
from a Windows-only run.

## Current oracle verification

The conditional projected-reassignment milestone preserves bounded ancestry for
both owners of a supported conditional reference RHS and for the tuple field's
replaced initialization owner. ORACLE-0002 rejects live-child mutation of each
possible owner with E0503, accepts unrelated mutation, and accepts both branch-
owner mutations after the child's last use. The MRML native frontend passed 420
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests on Windows gnullvm and native Arch Linux WSL: 766 compiler
tests per host. The unchanged driver and warnings-denied Clippy were not
re-executed for this milestone.
The same exact oracle and cross-host suites also verify two successive field
reassignments: all three owners remain protected while the moved descendant is
live, unrelated mutation is accepted, and all owners are released after its
last use.

The projected conditional-return outlives milestone checks every retained
origin of the latest exact tuple-field assignment. ORACLE-0002 rejects a return
whose conditional generation may reference local storage with E0515 and accepts
direct projected parameter storage plus a conditional generation whose branches
both trace to that parameter. The Windows gnullvm and native Arch Linux WSL
frontend suites each pass the same 766 compiler tests. Formatting and the
`no_std`/no-allocation/unsafe hygiene scan pass. The current Manifest V2
workspace has no Cargo package named `mrml-rustc`, so the obsolete direct Cargo
Clippy command was rejected before compilation; warnings-denied Clippy is not
claimed for this milestone.

The conditional tuple-initialization return milestone applies the same proof to
origins created while the tuple root is initialized. ORACLE-0002 rejects a
returned field whose branch may borrow local storage and accepts both parameter-
backed branches. Two-reference-field controls prove that a local-backed sibling
does not affect the selected returned field in either field position. Windows
gnullvm and native Arch Linux WSL each pass the same 766 compiler tests.

Nested conditional tuple-field origins now normalize each leaf's bounded
conditional-parent chain to its outer generation. ORACLE-0002 rejects a
three-leaf generation with one local-backed leaf and accepts the equivalent
all-parameter generation. Both host suites remain green at 766 compiler tests.

The branch-reaching projected-return milestone checks the original tuple-field
generation plus every assignment generation that can reach the return. The
oracle rejects a local-backed write in either branch, an old local-backed
initialization even after replacement, and a final sequential local-backed
write; it accepts branch and sequential controls whose generations are all
parameter-backed. Both host suites remain green at 766 compiler tests.

The loop-carried projected-return milestone retains reachable local-backed field
writes across a zero-or-more-iteration loop, including a local generation later
replaced in the same iteration. It accepts the parameter-backed equivalent and
an unreachable write after unconditional `break`. The latter requires both
entry-to-generation and generation-to-return CFG reachability, not event order
alone. Both host suites remain green at 766 compiler tests.

Moved projected-return evidence now covers direct and conditional tuple-field
initializations plus mutually exclusive field assignments before the field is
moved into a local and returned. Local-backed reachable origins fail with the
bounded outlives diagnostic, all-parameter origins pass, and a disconnected
post-`break` local write remains excluded. Both hosts pass 766 compiler tests.

Projected identity-call return evidence covers a conditional mutable-reference
tuple field returned directly through the call and through one stored call
result. ORACLE-0002 and MRML reject the mixed local/parameter origin set and
accept the all-parameter set. Both hosts pass 766 compiler tests.

The first trait-goal foundation adds fixed-capacity implemented goals and
first-occurrence canonicalization without source syntax or selection. Concrete
types, inference variables, placeholders, and canonical bound variables are
distinct; alpha-equivalent goals canonicalize equally; argument and variable
overflow fail explicitly. Windows gnullvm and native Arch Linux WSL each pass
425 library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 771 compiler tests per host. The unchanged driver was not
re-executed.

The exact trait-impl selection milestone adds a fixed 64-header database.
Duplicate implementation IDs and overlapping exact heads fail; rigid concrete
queries return one exact implementation or no solution; inference-bearing
matches remain ambiguous without manufacturing substitutions; repeated
canonical variables must bind to equal concrete types. Windows gnullvm and
native Arch Linux WSL each pass 431 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 777 compiler tests per
host. Generic impls, where-clauses, projections, cycles, and source integration
remain unsupported.

The bounded trait-answer milestone represents the exact per-candidate bindings
instead of discarding them. One matching concrete header now returns its stable
implementation identity and an eight-slot canonical-variable substitution;
multiple matching inference answers remain ambiguous, mismatches return no
solution, and repeated variables still require equal concrete types. Windows
gnullvm and native Arch Linux WSL each pass 432 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 778 compiler
tests per host. Generic impls, where-clauses, projections, recursive goals,
answer composition, and source integration remain unsupported.

The bounded response-substitution milestone retains the original inference-
variable identities alongside the canonical goal and maps a unique answer back
to those identities in first-occurrence order. Missing bindings or mismatched
response arity fail closed, and lookup remains fixed-capacity and allocation-
free. Windows gnullvm and native Arch Linux WSL each pass 433 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 779
compiler tests per host. This does not add generic unification, nested answer
composition, where-clauses, projections, recursive goals, or source integration.

The bounded predicate-conjunction milestone stores up to eight implemented-
trait predicates and canonicalizes the entire conjunction in one shared eight-
variable universe. Reused inference identities remain equal across predicate
boundaries; predicate-count and cross-predicate variable overflow fail
explicitly. Windows gnullvm and native Arch Linux WSL each pass 436 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 782 compiler tests per host. This is representation and canonicalization,
not where-clause elaboration, binders, generic impls, recursive solving, or
answer composition. `mrml build mrml-rustc`, formatting, the core hygiene scan,
manifest validation, `doctor`, and `audit` pass. The documented Cargo Clippy
selector was rejected before compilation because `mrml-rustc` is no longer a
Cargo package, so this checkpoint claims no new Clippy evidence.

The bounded where-clause binder milestone represents one consequence and up to
eight premises over eight indexed generic parameters. Construction rejects
unbound parameters and excess parameter capacity; concrete instantiation
requires exact arity and substitutes repeated parameters consistently through
the entire clause. Windows gnullvm and native Arch Linux WSL each pass 438
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 784 compiler tests per host. This does not elaborate clauses,
select generic impls, introduce source syntax, normalize projections, or recurse.

The single-clause elaboration milestone matches a fully concrete query against
one bound consequence, infers its fixed generic arguments, and instantiates the
premises only when every parameter is constrained. Repeated parameters require
equal concrete types; mismatch is no solution, unconstrained parameters are
ambiguous, and nonconcrete queries fail closed. Windows gnullvm and native Arch
Linux WSL each pass 439 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 785 compiler tests per host. No
clause database, multi-candidate combination, recursion, or cycle handling exists.

The identified clause-database milestone stores up to 64 bounded where clauses.
Duplicate stable IDs and structurally identical clauses fail; distinct
potentially overlapping clauses are retained, while queries with multiple
matching candidates or an unconstrained candidate return ambiguity. One unique
candidate returns its stable clause ID and instantiated premises. Windows
gnullvm and native Arch Linux WSL each pass 443 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 789 compiler
tests per host. Premises are not recursively solved and cycles are not entered.

The bounded recursive-proof milestone composes exact concrete implementation
facts with the premises of one unique clause through a fixed 16-goal stack. It
returns distinct proven, no-solution, ambiguous, cycle, and overflow outcomes;
cycle detection precedes the boundary overflow classification. Windows gnullvm
and native Arch Linux WSL each pass 447 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 793 compiler tests per
host. Inference-bearing recursion, caching, coinduction, projections, and source
integration remain unsupported.

The exact associated-type normalization milestone adds a fixed 64-value table
keyed by stable implementation and associated-type IDs. Insertion rejects stale
implementation references, duplicate keys, and overflow. Normalization reuses
canonical implementation selection and preserves unique, ambiguous, and no-
solution outcomes. Windows gnullvm and native Arch Linux WSL each pass 450
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 796 compiler tests per host. Generic associated values,
nested projections, source syntax, and recursive normalization remain absent.

The rigid-placeholder universe milestone distinguishes a placeholder's stable ID
from its explicit 16-bit universe. Bound clauses instantiate each parameter as a
distinct rigid placeholder in a caller-selected universe; canonicalization
preserves universe identity, separate universes remain unequal, and advancing
past the universe ceiling fails explicitly. Windows gnullvm and native Arch
Linux WSL each pass 452 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 798 compiler tests per host. Leak
checking, higher-ranked matching, universe relations, and `for<...>` syntax are
not implemented.

The inference-universe leak-check milestone includes creation universe in every
inference-variable identity while retaining `new(id)` for root variables.
Canonicalization distinguishes equal numeric IDs created in different
universes. Checked assignments reject newer-universe placeholders and inference
variables while accepting concrete and same-or-older-universe values. Windows
gnullvm and native Arch Linux WSL each pass 454 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 800 compiler
tests per host. This is not higher-ranked candidate matching, general
unification, or source `for<...>` support.

The rigid clause-matching milestone elaborates bound consequences against goals
containing concrete types and skolem placeholders. Repeated parameters require
exact placeholder identity, instantiated premises retain the matched universe,
and the fixed clause database preserves unique, ambiguous, and no-solution
outcomes. Inference-bearing rigid queries fail explicitly. Windows gnullvm and
native Arch Linux WSL each pass 456 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 802 compiler tests per
host. Recursive rigid proof, general unification, and source `for<...>` remain
unsupported.

The flat generic-head coherence milestone adds a fixed 64-entry identified
implementation table. A fixed 16-node equality unifier decides exact overlap for
the current concrete/parameter head language across both binders, including
repeated-parameter constraints and conflicting concrete assignments. Duplicate
IDs, satisfiable overlap, and overflow fail. Windows gnullvm and native Arch
Linux WSL each pass 461 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 807 compiler tests per host.
Premise satisfiability, cross-family coherence, specialization, and source impl
syntax remain unsupported.

The coherent generic-selection milestone matches concrete queries against the
admitted generic implementation table. One fully constrained head returns its
stable implementation ID and instantiated premises; no head returns no solution,
and a parameter absent from the head remains ambiguous. Inference-bearing
queries fail explicitly. Windows gnullvm and native Arch Linux WSL each pass 463
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 809 compiler tests per host. Recursive generic-implementation
proof, specialization, and source impl syntax remain unsupported.

The recursive generic-proof milestone composes concrete generic selection with
the existing 16-frame proof stack. Instantiated premises may resolve through
exact facts, further generic implementations, or bounded where clauses; missing
premises, ambiguity, cycles, and overflow remain distinct. A simultaneous exact
and generic match fails closed as ambiguity until cross-family admission is
coherent. Windows gnullvm and native Arch Linux WSL each pass 466 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
812 compiler tests per host. Inference-bearing generic proof, specialization,
cross-family coherence, and source impl syntax remain unsupported.

The cross-family coherence milestone adds symmetric bounded admission paths for
exact and generic implementations. Either insertion order rejects a concrete
header that instantiates a generic head, including repeated-parameter equality;
disjoint heads remain admissible. Runtime selection retains defensive ambiguity
for databases constructed through older unchecked paths. Windows gnullvm and
native Arch Linux WSL each pass 468 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 814 compiler tests per
host. Premise-aware coherence, specialization, and source impl syntax remain
unsupported.

The generic associated-type normalization milestone adds a separate fixed
64-value table keyed by stable generic-implementation and associated-type IDs.
A value may be concrete or refer to one bound implementation parameter. The
normalizer retains the selected implementation substitution and requires its
recursive premises to prove before producing a value. Missing premises and
values return no solution; unchecked collisions, proof cycles, and proof
overflow remain ambiguous. Stale IDs, duplicate keys, and unbound parameters
fail explicitly. Windows gnullvm and native Arch Linux WSL each pass 471 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 817 compiler tests per host. Nested projection terms, premise projection
goals, specialization, and source associated-type syntax remain unsupported.

The unified concrete-projection milestone selects coherently across the exact
and generic implementation families before consulting their separate bounded
value tables. Exact facts return exact values; generic values retain recursive
premise proof and parameter substitution. Absent implementations or values
return no solution, while unchecked family collisions fail closed as ambiguity.
Windows gnullvm and native Arch Linux WSL each pass 473 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 819
compiler tests per host. Nested projections, projection answer composition,
specialization, and source associated-type syntax remain unsupported.

The bounded nested-projection milestone lets a generic associated value contain
a projection template over its implementation binder. Selection substitutes the
template and recursively normalizes through either implementation family. A
separate 16-frame visited stack reports exact projection cycles and acyclic
overflow distinctly; invalid template parameters fail at admission. Windows
gnullvm and native Arch Linux WSL each pass 476 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 822 compiler
tests per host. Projection-bearing type arguments and premises, inference
projections, coinduction, specialization, and source syntax remain unsupported.

The rigid generic-selection and proof milestone generalizes retained generic
substitutions to concrete-or-placeholder terms. Rigid selection preserves exact
placeholder identities and universes, rejects repeated-parameter mismatches, and
recursively proves instantiated generic or rigid-clause premises through the
existing 16-frame stack. Missing premises, ambiguity, cycles, and overflow remain
distinct; inference-bearing inputs fail explicitly. Windows gnullvm and native
Arch Linux WSL each pass 480 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 826 compiler tests per host. Mixed
inference/skolem unification, binder introduction, coinduction, specialization,
and source higher-ranked syntax remain unsupported.

The universal trait-goal milestone adds an explicit binder over at most eight
implemented-trait parameters. It advances a caller-relative universe, creates a
distinct rigid placeholder for each parameter, and proves the instantiated goal
through rigid generic solving. Invalid indices and universe exhaustion fail;
unconstrained implementation parameters remain ambiguous. Windows gnullvm and
native Arch Linux WSL each pass 483 library tests, one component-interface probe,
10 conformance tests, and 335 replacement tests: 829 compiler tests per host.
Nested binders, leak-aware answer inversion, mixed generic inference, and
`for<...>` source syntax remain unsupported.

The exact existential trait-goal milestone binds at most eight parameters as
inference variables in a caller-selected universe. Canonical exact selection
restores unique answers as substitutions keyed to those original identities;
repeated parameters enforce equality, and ambiguity/no solution remain explicit.
Invalid binder indices fail at construction. Windows gnullvm and native Arch
Linux WSL each pass 486 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 832 compiler tests per host.
Generic inference candidates, inferred premise proof, projection composition,
universal answer inversion, and source existential syntax remain unsupported.

The symbolic generic-existential milestone matches canonical inference-bearing
queries against coherent flat generic heads with a fixed 16-node constraint
graph. Concrete constraints produce concrete bindings; unresolved equality
classes map to their oldest universe-safe query representative, and selected
premises retain those symbolic terms. Head-unconstrained implementation
parameters remain ambiguous; rigid inputs fail explicitly. Windows gnullvm and
native Arch Linux WSL each pass 489 library tests, one component-interface probe,
10 conformance tests, and 335 replacement tests: 835 compiler tests per host.
Recursive inferred-premise proof, nested/projection unification, cross-family
answer composition, and source existential syntax remain unsupported.

The recursive inferred-proof milestone keeps one fixed union/concrete state for
the root existential variables. Each exact or generic implementation answer
refines that state before generic premises recurse through the existing 16-frame
stack. Exact premises can resolve symbolic variables, generic chains propagate
the result, contradictory premises return no solution, and cross-family
ambiguity, cycles, and overflow remain distinct. Unrelated premise variables
fail explicitly. Windows gnullvm and native Arch Linux WSL each pass 493 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 839 compiler tests per host. Inference-aware where clauses, projection
constraints, backtracking, caching, coinduction, and source syntax remain
unsupported.

The inferred where-clause milestone applies the existing flat symbolic matcher
to the bounded clause database and returns stable clause identity, instantiated
premises, and a universe-checked substitution. The recursive solver consults a
clause only after exact and generic candidates return no solution and composes
clause/generic/exact chains in the same root constraint state. Multiple clauses,
cycles, and acyclic overflow remain distinct. Windows gnullvm and native Arch
Linux WSL each pass 498 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 844 compiler tests per host.
Environment layering, implied bounds, negative reasoning, projection predicates,
backtracking, caching, coinduction, and source syntax remain unsupported.

The bounded rigid-proof milestone recursively composes concrete and skolemized
placeholder premises through the existing 16-goal stack. Exact concrete facts
can terminate branches; otherwise one unique rigid clause is elaborated.
Ambiguity, no solution, cycles, and overflow remain distinct, and inference-
bearing entry goals fail explicitly. Windows gnullvm and native Arch Linux WSL
each pass 458 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 804 compiler tests per host. Mixed
inference/skolem unification, coinduction, and source higher-ranked syntax remain
unsupported.

At compiler path checkpoint `9a950ae9`, the Windows gnullvm core suite passed
765 tests: 420 library tests, 10 conformance tests, and 335 replacement tests.
Core formatting, warnings-denied Clippy, the no-`std`/no-`alloc`/unsafe hygiene
scan, `mrml doctor`, `mrml audit`, and `mrml build mrml-rustc` passed.
The driver was not re-executed by this path-only checkpoint, and no new Linux
evidence is claimed.

At driver path checkpoint `0350249c`, the Windows gnullvm driver suite passed
2 tests; driver formatting, warnings-denied Clippy, and the combined core/driver
hygiene scan passed. `mrml doctor` and `mrml audit` passed. Direct
`mrml build mrml-rustc-driver` selected MSVC and failed because `link.exe`
was unavailable. No new Linux evidence is claimed.

On 2026-08-25, ORACLE-0002 passed 767 tests on Windows gnullvm: 420 library
tests, 10 conformance tests, 335 replacement tests, and 2 driver tests.
Warnings-denied Clippy also passed. The current commands are:

```powershell
$env:RUSTFLAGS='-C link-arg=/stack:16777216'
cargo +nightly-2026-08-24-x86_64-pc-windows-gnullvm test -p mrml-rustc -p mrml-rustc-driver
cargo +nightly-2026-08-24-x86_64-pc-windows-gnullvm clippy -p mrml-rustc -p mrml-rustc-driver --all-targets --no-deps -- -D warnings
```

```sh
cd /mnt/c/Users/Mitch/Documents/mrml
cargo +nightly-2026-08-24-x86_64-unknown-linux-gnu test -p mrml-rustc -p mrml-rustc-driver --release --offline
cargo +nightly-2026-08-24-x86_64-unknown-linux-gnu clippy -p mrml-rustc -p mrml-rustc-driver --all-targets --release --offline --no-deps -- -D warnings
```

The Arch Linux toolchain at the same commit crashed in LLVM `PromotePass` while
building the release test binary. That compiler-host failure is recorded as an
ORACLE-0002 regression/blocker, not passing evidence. The previous ORACLE-0001
generation retains the last complete Windows/Linux evidence.

The hygiene scan must remain empty:

```sh
rg -n "(^|[^A-Za-z])(std|alloc)::|unsafe\s*\{" packages/compiler/core/src packages/compiler/driver/src
```

Format only the compiler packages, preserve unrelated worktree changes, stage
overlapping documentation hunks interactively, fetch before pushing, never
force-push, and update this checkpoint after every pushed compiler milestone.

The inferred projection-equality milestone binds a bounded projection and
expected term in one root inference universe. It proves exact, generic, and
where-clause premises before instantiating the selected associated value, then
merges concrete or symbolic results into the existing fixed constraint state.
Nested generic projection templates reuse the 16-frame cycle/overflow guard.
Windows gnullvm and native Arch Linux WSL each pass 503 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 849
compiler tests per host. Projection-bearing type terms and premises, predicate
conjunction composition, backtracking, caching, coinduction, and source syntax
remain unsupported.

The mixed inferred-predicate milestone admits up to eight implemented-trait or
projection-equality predicates under one existential binder and one fixed root
constraint state. Ambiguous predicates roll back tentative refinement and are
retried after another predicate proves; a no-progress pass remains ambiguous.
Cross-predicate contradictions, projection cycles, empty conjunctions, and
capacity limits have focused tests. Windows gnullvm and native Arch Linux WSL
each pass 507 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 853 compiler tests per host. Projection
equalities in where-clause premises, general projection-bearing type terms,
backtracking, caching, coinduction, and source syntax remain unsupported.

The projection-premise representation milestone extends bounded where clauses
and generic implementations with projection equality under the existing shared
eight-predicate capacity. Concrete, rigid, and existential instantiation retain
the projection goal, associated-type identity, and expected term. Proof entry
points without associated-value environments reject such premises as no
solution. Windows gnullvm and native Arch Linux WSL each pass 509 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
855 compiler tests per host. Projection-aware recursive premise proof, general
projection-bearing type terms, backtracking, caching, coinduction, and source
syntax remain unsupported.

The projection-aware inferred-proof milestone evaluates instantiated projection
premises on bounded clauses and generic implementations in the same root state
as implemented-trait premises. Ambiguous attempts roll back and retry after
other premise refinement; nested projection normalization recursively uses the
same aware environment. A separate 16-transition nesting budget bounds
projection-to-proof recursion. Windows gnullvm and native Arch Linux WSL each
pass 513 library tests, one component-interface probe, 10 conformance tests,
and 335 replacement tests: 859 compiler tests per host. Concrete/rigid
projection-premise proof, general projection-bearing type terms, backtracking,
caching, coinduction, and source syntax remain unsupported.

The projection-bearing term milestone interns up to 64 leaf or projection nodes
in an acyclic backward-referenced arena. Projection trait self/argument positions
may reference earlier terms, and 16-frame normalization uses the projection-
aware environment while retaining root inference substitutions. Windows gnullvm
and native Arch Linux WSL each pass 518 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 864 compiler tests per
host. Whole term-bearing goal selection, projection terms in binders,
concrete/rigid projection-premise proof, backtracking, caching, coinduction, and
source syntax remain unsupported.

The projection-bearing goal milestone normalizes every self and argument term
through one shared inference state, then sends the resulting flat goal through
exact/generic/clause selection and projection-aware premise proof. Windows
gnullvm and native Arch Linux WSL each pass 519 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 865 compiler
tests per host. Projection terms in binders, clause heads, and premise type
positions, concrete/rigid projection-premise proof, backtracking, caching,
coinduction, and source syntax remain unsupported.

The typed COFF local-section checkpoint projects both code and read-only COMDAT
definitions through exact nonzero source-object and section identities. It
adds independently bounded object-wide read-only and aggregate code relocation
tables, exact missing-target diagnostics, and a narrow removable `.drectve`
validator. A 512 KiB payload tier removes the pinned probe's dependence on an
externally enlarged Linux stack. The exact ORACLE-0003 `libcore` probe linked
464,896 deterministic PE bytes with temporary platform/runtime shims and
465,920 bytes with pinned `compiler_builtins` plus only platform memory/panic
shims. The normal- and enlarged-stack 464,896-byte outputs were byte-identical:
SHA-256 `4625f6fc3e8c98ec8dd9648761f54826f65399bd64bcb38027bad32e543769af`.

`./target/debug/mrml build org.mrml.compiler.driver --target linux --release`
passed. `./target/debug/mrml test org.mrml.compiler.driver --target linux
--release` passed eight tests. `./target/debug/mrml test
org.mrml.compiler.core --target linux --release` passed 813 unit tests, 351
replacement tests, 121 semantic-execution tests, and all other reported
integration groups. The Wine run is hosted loader evidence only; the probe is
not a process-entry semantic test, and native Windows, physical hardware,
general `.rlib` closure, and production linker readiness are not claimed.

The typed COFF runtime-target checkpoint preserves exact source-object/section
identities through PE runtime-function begin/end resolution and performs a
post-selection, uniqueness-checked projection of unresolved ordinary symbols
to writable definitions. Global text definitions retain precedence. The exact
ORACLE-0003 `alloc` and `core` archives plus pinned `compiler_builtins` and
independently assembled temporary platform shims linked to 519,168 deterministic
PE bytes on the normal 8 MiB Linux stack. A separate enlarged-stack result was
byte-identical. The corrected durable structural probe models the pinned
allocator marker as callable text and has SHA-256
`54c3457ccc6a56e150a445d041ed00b1d003af4f0d0a9ae0ae2928e4bcb69b33`.
The image retained distinct RX `.text`, R/NX `.rdata`, and RW/NX `.data`
sections. An isolated `./target/debug/mrml test org.mrml.compiler.core --target
linux --release` equivalent passed 815 unit tests and 122 semantic-execution
tests with zero failures. Temporary shims remain non-production diagnostic
inputs; allocator execution, native Windows, general `.rlib` closure, and
production readiness are not claimed.

An independently authored Rust 2024 execution consumer uses a bounded
4,096-byte arena allocator, pushes 0 through 63 into `Vec<u32>` across repeated
capacity growth, and returns 42 only after verifying their sum is 2,016. The
pinned `alloc`, `core`, and `compiler_builtins` archives plus narrow
diagnostic runtime stubs linked to 520,704 deterministic PE bytes, SHA-256
`52d2c50df2cf4dd0b58a70f60d49fc765e461dafc7dea5433b5ea4671460aa5e`.
Wine 11.16 returned 42. This is one hosted allocator-backed execution path, not
native Windows, general `alloc` compatibility, a production allocator, or
physical-hardware evidence.
The isolated canonical compiler-core package gate at this exact checkpoint
passed 815 unit tests and 123 semantic-execution tests with zero failures.

The concrete projection-premise entry point validates a fully concrete goal and
reuses the same fixed projection-aware constraint state, proof stack, associated-
value environment, and mixed predicate scheduler as existential proof. Matching
associated values prove while mismatches remain no solution; legacy environment-
free concrete proof continues to fail closed. Windows gnullvm and native Arch
Linux WSL each pass 531 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 877 compiler tests per host. Rigid
projection-premise proof remains unsupported.

The rigid concrete-projection milestone threads an optional associated-value
environment through the existing rigid generic/clause recursion. A skolemized
outer goal can prove fully concrete projection predicates under the same fixed
16-frame proof and projection limits; mismatches preserve no solution, and the
environment-free entry point remains fail closed. Projection goals or expected
values containing placeholders are rejected rather than treated as concrete.
Windows gnullvm and native Arch Linux WSL each pass 532 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 878
compiler tests per host. General rigid projection normalization remains
unsupported.

The symbolic rigid-projection milestone selects premise-free generic associated
values with rigid heads, substitutes exact placeholder identities into parameter
results, and recursively normalizes nested projections through the existing
16-frame visited stack. Focused tests prove placeholder identity and report a
self-projection cycle distinctly. Implementations whose associated values depend
on trait or projection premises still fail closed in this rigid normalization
path. Windows gnullvm and native Arch Linux WSL each pass 534 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 880
compiler tests per host.

The universal projection-term binder milestone mirrors the bounded existential
term arena but instantiates every bound parameter as a fresh placeholder in the
successor universe. Rigid term normalization preserves those identities through
nested associated projections before the existing rigid solver proves the flat
goal. Focused evidence covers a parameter-valued associated projection and
universe-index overflow. Windows gnullvm and native Arch Linux WSL each pass 538
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 884 compiler tests per host. Nested and mixed higher-ranked
term binders remain unsupported.

The universal projection-equality milestone binds a projection and expected term
to fresh placeholders in the successor universe, runs premise-aware rigid
normalization, and requires exact symbolic identity. It preserves ambiguity, no
solution, cycle, overflow, and universe-index overflow as distinct outcomes.
Windows gnullvm and native Arch Linux WSL each pass 539 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 885
compiler tests per host. Nested/mixed higher-ranked predicates and source syntax
remain unsupported.

The mixed universal-predicate milestone admits up to eight implemented-trait or
projection-equality predicates under one top-level universal binder. Every
predicate shares the same fresh placeholder universe and is proven through the
premise-aware rigid environment without inference refinement. Focused tests
cover mixed success, exact symbolic contradiction, an empty conjunction,
capacity rejection, recursive cycles, and universe overflow. Windows gnullvm and
native Arch Linux WSL each pass 540 library tests, one component-interface probe,
10 conformance tests, and 335 replacement tests: 886 compiler tests per host.
Nested higher-ranked binders and source syntax remain unsupported.

The nested universal-prefix milestone admits a fixed sequence of binder levels
before a terminal mixed predicate conjunction. Each level advances the universe
and restarts level-local placeholder identities, while globally indexed bound
parameters preserve exact scope across levels. Binder levels and total parameters
are bounded by the existing generic capacity; adding a binder after predicates
fails closed. Focused tests cover same-local-ID/different-universe identity,
cross-universe mismatch, valid nested proof, total-scope and universe overflow,
closed-prefix admission, and recursive cycles. Windows gnullvm and native Arch
Linux WSL each pass 541 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 887 compiler tests per host.
Branching scopes and binders nested inside predicate terms remain unsupported.

The universal branch-forest milestone combines up to eight independent nested
prefixes. Branches receive consecutive non-overlapping universe segments, while
the forest globally caps eight predicates and 16 binder levels so branching
cannot amplify the solver beyond existing fixed work. Focused tests cover mixed
branch success, a missing later branch, later-segment universe overflow,
predicate, binder, and branch capacity, and recursive cycles. Windows gnullvm
and native Arch Linux WSL each pass 542 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 888 compiler tests per
host.
Binders nested inside predicate terms and source syntax remain unsupported.

The rigid coinduction milestone adds an explicit fixed classification of at most
64 coinductive trait identities. A repeated rigid proof path succeeds only when
every goal from the cycle entry onward is classified; unclassified and mixed
inductive/coinductive cycles retain the existing `Cycle` result. Duplicate and
capacity admission fail explicitly. Windows gnullvm and native Arch Linux WSL
each pass 543 library tests, one component-interface probe, 10 conformance tests,
and 335 replacement tests: 889 compiler tests per host. Projection-premise,
inference, and source-level coinduction remain unsupported at this milestone.

The coinductive projection-premise milestone threads the same explicit trait
classification through rigid proof with an associated-value environment. Every
projection equality is still normalized and compared before a classified trait
cycle can succeed. Missing values remain `NoSolution`, unclassified paths remain
`Cycle`, and projection-normalization cycles are not treated as coinductive.
Windows gnullvm and native Arch Linux WSL each pass 544 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 890
compiler tests per host. Inference and source-level coinduction remain
unsupported.

The universal coinduction-composition milestone applies the explicit
classification to implemented-trait predicates inside nested universal branch
forests. Each branch still receives its disjoint universe segment, projection
equalities still normalize rigidly, and only the repeated classified trait cycle
changes from `Cycle` to `Proven`. The existing mixed branch test covers an
ordinary implemented predicate, a rigid projection equality, and a later
coinductive cycle. Windows gnullvm and native Arch Linux WSL each pass 544
library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 890 compiler tests per host. Inference and source integration
remain unsupported.

The resolved-inference coinduction milestone reapplies the current substitution
to every stored goal before classifying a repeated existential proof path. A
cycle succeeds only when all cycle goals are inference-free and all trait
identities are explicitly coinductive. A preceding exact sibling obligation can
therefore resolve a variable and preserve that concrete answer, while an
otherwise identical unresolved self-cycle remains `Cycle`. Windows gnullvm and
native Arch Linux WSL each pass 545 library tests, one component-interface probe,
10 conformance tests, and 335 replacement tests: 891 compiler tests per host.
Backtracking over unresolved coinductive answers and source integration remain
unsupported.

The projection-resolved coinduction milestone threads classification through the
existential associated-value environment. An unresolved implemented-trait cycle
is deferred only while another bounded predicate may refine the state; a rigid
projection equality can then bind the query variable and the retried classified
cycle preserves that answer. Missing associated values remain `NoSolution`, and
a pass with no refinement remains `Cycle`. Windows gnullvm and native Arch Linux
WSL each pass 546 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 892 compiler tests per host. General candidate
backtracking and source integration remain unsupported.

The source marker-trait milestone integrates the first trait syntax with the
canonical allocation-free module parser. It accepts bounded empty marker
declarations, preserves visibility and source spans, and lowers declarations in
source order into a separate fixed 64-entry table of stable solver `TraitId`
identities. Duplicate trait names, cross-kind duplicate definitions, and table
overflow fail explicitly. Unsupported generic parameters, supertraits,
associated items, methods, implementations, and trait-bearing types remain
closed. Windows gnullvm and native Arch Linux WSL each pass 551 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
897 compiler tests per host.

The exact source-implementation milestone accepts empty `impl Trait for Type {}`
items in the canonical parser and lowers them into the existing exact solver
database. Declared traits resolve to their stable IDs; supported nominal paths
intern in a separate 64-entry source-order type table. Existing solver admission
rejects overlapping heads. Unknown traits, unsupported self types, nonempty
bodies, malformed forms, and capacity overflow fail with focused diagnostics.
Generic, negative, unsafe, and default implementations, trait arguments,
associated items, and source-level obligations remain unsupported. Windows
gnullvm and native Arch Linux WSL each pass 555 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 901 compiler
tests per host.

The concrete source-obligation milestone parses up to eight function-level
`where Type: Trait` predicates and proves every predicate in the module before
code generation. Predicate type paths share the source identity table with
implementation self types; declared trait names resolve to stable IDs and the
existing exact solver selects the implementation. Missing implementations,
unknown traits, duplicate predicates, unsupported bound/type forms, and
capacity exhaustion fail with focused source spans. Generic binders, inferred
operation obligations, trait arguments, associated items, and dispatch remain
unsupported. Windows gnullvm and native Arch Linux WSL each pass 560 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 906 compiler tests per host.

The bounded source-supertrait milestone parses up to eight marker supertraits,
resolves forward declaration names in a second pass, and validates the fixed
64-node graph as acyclic. Unknown and duplicate edges fail explicitly. After
all exact source implementation headers are admitted, each implementation must
prove every direct and transitive supertrait for the same stable type identity;
item order cannot bypass the check and missing ancestors fail before code
generation. Generic supertraits, associated items, `?Sized`, higher-ranked
bounds, and generic implementations remain unsupported. Windows gnullvm and
native Arch Linux WSL each pass 564 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 910 compiler tests per
host.

The exact source-associated-type milestone parses up to eight `type Name;`
declarations per trait and requires exactly one `type Name = Type;` value in
each exact source implementation. Stable source-order identities feed the
existing bounded associated-value database and exact projection normalizer.
Missing, unknown, duplicate, and capacity-exhausted declarations or values fail
closed. Defaults, bounds, generics, methods, and source projection syntax remain
unsupported. Windows gnullvm and native Arch Linux WSL each pass 569 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 915 compiler tests per host.

The concrete source-projection milestone parses bounded function predicates of
the form `where <Type as Trait>::Item = Expected`, resolves all four stable
source identities, and queries the existing exact projection normalizer before
code generation. Unknown identities, absent or ambiguous implementations,
mismatched values, duplicate predicates, and capacity exhaustion fail closed.
Generic projections, projection types outside where-equalities, and associated
constraints on generic binders remain unsupported. Windows gnullvm and native
Arch Linux WSL each pass 572 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 918 compiler tests per host.

The concrete source-trait-argument milestone parses up to eight positional type
parameters per trait and concrete arguments on exact implementations,
implemented-trait predicates, and projection equalities. Argument-bearing exact
headers select independently and retain their own associated values. Duplicate
parameter names, wrong arity, unsupported argument types, overlap, unknown
types, and capacity exhaustion fail closed. Generic implementations, inference,
defaults, bounds, lifetimes, and const parameters remain unsupported. Windows
gnullvm and native Arch Linux WSL each pass 575 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 921 compiler
tests per host.

The flat generic source-implementation milestone admits up to eight implementation
type parameters constrained by complete self or trait-argument head positions.
Concrete obligations reuse the exact-plus-generic proof path, while parameter
and concrete associated values reuse generic projection normalization.
Exact/generic and generic/generic overlap, duplicate or unconstrained
parameters, wrong arity, missing values, generic supertraits, and compound
parameter positions fail closed. Generic where-premises, nested constructors,
bounds, source inference, specialization, and methods remain unsupported.
Windows gnullvm and native Arch Linux WSL each pass 578 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 924
compiler tests per host.

The generic source-premise milestone parses up to eight implemented-trait
predicates after each flat generic implementation head. Premises use complete
parameter or concrete nominal self/argument positions, resolve stable trait
identity and arity, reject duplicates, and lower onto the existing bounded
generic clause. Concrete proof and generic associated-value normalization
recursively discharge them through the existing 16-frame solver. Missing
premises fail before code generation. Projection-equality premises, exact-
implementation premises, nested parameter constructors, and bounds remain
unsupported. Windows gnullvm and native Arch Linux WSL each pass 581 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 927 compiler tests per host.

The generic source projection-premise milestone parses equalities such as
`where <T as Parent<T>>::Output = u8` after flat generic implementation heads.
It resolves projected trait arguments, associated identity, and expected bound
type, stores the equality on the existing generic clause, and proves selected
implementations through the existing projection-aware environment before code
generation. Unknown, duplicate, mismatched, cyclic, and over-depth premises fail
closed. Nested projections and compound generic constructors remain
unsupported. Windows gnullvm and native Arch Linux WSL each pass 583 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 929 compiler tests per host.

The premise-bearing exact source-implementation milestone represents a concrete
implementation with `where` predicates as a zero-parameter bounded clause, not
an unconditional exact fact. This reuses generic clause coherence, recursive
implemented/projection premise proof, and generic associated-value normalization
while retaining a fully concrete head. Missing premises make the implementation
unavailable; an unconditional fact with the same head is rejected as overlap.
Conditional implementations of traits with source supertraits remain
unsupported. Windows gnullvm and native Arch Linux WSL each pass 586 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 932 compiler tests per host.

The projection-valued generic associated-type milestone parses values such as
`type Output = <T as Parent<T>>::Output`, resolves the projected trait,
arguments, and associated identity, and lowers them into the existing bounded
generic projection representation. Concrete obligations recursively prove the
projected implementation through the existing 16-frame normalizer. Missing
implementations fail closed; malformed projections, unknown identities, wrong
arity, and unsupported compound positions are rejected. Windows gnullvm and
native Arch Linux WSL
each pass 589 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 935 compiler tests per host.

The exact projection-valued associated-type milestone represents an
unconditional concrete implementation containing a projection value as a
zero-parameter bounded clause. Existing exact/generic coherence is preserved,
and recursive implementation proof plus projection normalization are shared
with the generic source form. A missing projected implementation remains
unavailable before code generation. Windows gnullvm and native Arch Linux WSL
each pass 590 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 936 compiler tests per host.

The inherited source-supertrait milestone lowers every direct marker
supertrait of a generic, conditional concrete, or projection-valued
implementation as a deduplicated bounded premise over the same self type. A
selected child implementation is unavailable unless each declared parent can
be proved, while an equivalent explicit premise is retained only once.
Parameterized supertrait paths remain unsupported and fail on arity. Windows
gnullvm and native Arch Linux WSL each pass 592 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 938 compiler
tests per host.

The exact-child generic-parent milestone validates supertraits of unconditional
exact child facts through the same projection-aware exact-plus-generic proof
environment used by source obligations. Generic and conditional parent
implementations are accepted only when every instantiated premise proves;
unavailable parents still fail closed before child admission. Windows gnullvm
and native Arch Linux WSL each pass 593 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 939 compiler tests per
host.

The parameterized source-supertrait milestone admits paths such as
`trait Child<T>: Parent<T>` when every parent argument is a complete child
declaration parameter. Stable parent identity and arity resolve during
declaration admission; parameter indexes instantiate from exact, generic, or
conditional implementation heads and propagate through transitive parents.
Concrete and compound parent argument positions remain fail-closed. Windows
gnullvm and native Arch Linux WSL each pass 596 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 942 compiler
tests per host.

The concrete source-supertrait argument milestone represents each parent
argument as either a child declaration parameter index or a complete concrete
nominal type. Concrete identities intern in the bounded source type table and
instantiate through generic, exact, and transitive proof; mismatched parent
facts remain unavailable. Adjacent nested/enclosing `>>` closes now reach
semantic admission, where compound terms continue to fail closed. Windows
gnullvm and native Arch Linux WSL each pass 597 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 943 compiler
tests per host.

The source-supertrait `Self` milestone represents `Self` as an explicit parent-
argument identity rather than a nominal source type. Bound implementations
substitute their self term into inherited premises, while exact and transitive
validation substitute the concrete implementation self identity. Missing
matching parents remain unavailable before code generation. Windows gnullvm
and native Arch Linux WSL each pass 598 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 944 compiler tests per
host.

The distinct source-supertrait instantiation milestone compares duplicate
requirements by parent identity and semantic bounded arguments. Distinct
requirements such as `Parent<u8> + Parent<u16>` remain separate through exact
validation and inherited-premise proof, and every instantiation must resolve;
an exact repeated requirement still fails admission. Windows gnullvm and native
Arch Linux WSL each pass 599 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 945 compiler tests per host.

The trait-declaration requirement milestone parses and admits up to eight flat
implemented-trait predicates after a declaration `where` keyword. `Self`, a
complete declaration parameter, and concrete nominal types substitute through
generic, conditional, and exact implementation clauses; prerequisites must
prove before the declared trait is available. Unknown traits, wrong arity,
duplicates, and compound terms fail closed during declaration admission.
Projection-equality declaration requirements resolve stable associated-type
identity during admission, substitute flat self/argument/expected terms through
each implementation head, and reuse the projection-aware premise solver;
unknown associated types fail closed. Windows gnullvm and native Arch Linux WSL
each pass 604 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 950 compiler tests per host.

The trait-parameter-bound milestone parses `+`-separated implemented-trait
bounds on declaration type parameters and desugars them into the same bounded
requirement array used by an explicit declaration `where` clause. Both forms
share capacity, duplicate admission, substitution, and proof. Defaults,
lifetime/const parameters, `?Sized`, associated constraints, and compound type
terms remain fail-closed. Windows gnullvm and native Arch Linux WSL each pass
607 library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 953 compiler tests per host.

The implementation-parameter-bound milestone parses `+`-separated implemented-
trait bounds on implementation type parameters and desugars them into the same
bounded premises as the explicit implementation `where` clause. Capacity,
duplicate rejection, substitution, recursive proof, and projection-aware
normalization are shared. Defaults, lifetime/const parameters, `?Sized`,
associated constraints, and compound type terms remain fail-closed. Windows
gnullvm and native Arch Linux WSL each pass 610 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 956 compiler
tests per host.

The associated-type-default milestone parses flat declaration defaults and
substitutes `Self`, a complete declaration parameter, or a concrete nominal
type through each exact or generic implementation head when no explicit value
is present. Explicit values override defaults. Projection-valued defaults with
flat `Self`/parameter/concrete projection positions resolve after the forward
identity phase and reuse bounded generic normalization; missing projected
implementations remain unavailable, while compound defaults remain fail-
closed. Windows gnullvm and native Arch Linux WSL each pass 617 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
963 compiler tests per host.

The forward associated-identity milestone registers every bounded associated
identity after trait identities but before supertrait and declaration-
requirement validation. Projection requirements can consequently reference a
later trait declaration without source-order dependence, while missing
identities remain explicit errors. Windows gnullvm and native Arch Linux WSL
each pass 615 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 961 compiler tests per host.

The inline associated-binding milestone parses bounds such as
`T: Iterator<Item = T>` or `T: Convert<u8, Output = T>` on declaration or implementation type parameters and
desugars them into the existing implemented-trait plus projection-equality
predicates. Both predicates share capacity, identity admission, duplicate
rejection, substitution, and projection-aware proof with explicit `where`
clauses. Positional arguments are preserved on both generated predicates so a
mixed list retains one semantic trait instantiation. Equivalent explicit
declaration and implementation `where` predicates use the same parser and
desugaring. Supertrait bindings retain positional arguments on the parent edge
and lower associated equalities into `Self` declaration requirements. Windows
gnullvm and native Arch Linux WSL each pass 627 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 973 compiler
tests per host.

The trailing trait-default milestone parses defaults such as
`trait Convert<Input = u8, Output = Input>` and materializes omitted arguments in exact and
generic implementation heads, supertraits, declaration/implementation
premises, projection values/defaults, and function obligations. Defaults must
form a trailing run of complete concrete nominal types, `Self`, or references
to an earlier trait type parameter. Forward/self-referential type-parameter,
lifetime/const, and compound defaults fail closed. `Self` and earlier-parameter
defaults copy already materialized typed terms without introducing inference. Windows gnullvm and
native Arch Linux WSL each pass 630 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 976 compiler tests per
host.

Default-equivalent predicate admission compares recursively materialized
argument tuples: an omitted default chain and the same explicitly written types are one semantic
requirement and duplicate declaration/implementation premises are rejected.

The restricted naked-function milestone parses repeated unsafe attributes and
admits `#[unsafe(naked)]` only on unsafe, zero-parameter C-ABI functions with no
where predicates and a unit or never return. Its bounded `naked_asm!` body
accepts at most eight x86-64 instructions from `nop`, `ret`, `int3`, `ud2`,
`cli`, `sti`, `hlt`, `swapgs`, and `iretq`, validated 64-bit GPR `push`/`pop`
and register-indirect `jmp`, and register-to-register `mov`. A quote-aware
bounded scanner preserves operand commas without accepting escapes. A checked
decimal/hexadecimal parser admits signed `push` immediates only when their
sign-extended x86-64 encoding preserves the requested `i32` value, and admits
full-width signed-or-unsigned `mov r64, imm64`; malformed, overflowing, and
noncanonical separators fail.
Base-register memory operands admit 64-bit `mov` loads/stores,
memory-indirect `jmp`, and `lgdt`, `lidt`, and `invlpg`, including the required
SIB or zero displacement for `rsp`/`r12` and `rbp`/`r13`. The typed address
admits an optional base GPR, one optional index GPR at scale 1/2/4/8, and a
checked signed `i32` displacement. Base-less numeric and index-only addresses
emit the conventional SIB no-base disp32 form; the encoder otherwise selects
canonical no-displacement, disp8, or disp32 forms and rejects `rsp` as an index. It requires an
explicit terminating instruction and emits those exact bytes without ordinary function lowering.
The bounded two-pass layout recognizes numeric local definitions `2:` through
`9:` and direction-checked `jmp 2f`/`2b` references, rejects duplicate, missing,
or wrong-direction labels, and emits a checked rel32 displacement without an
object relocation.
The exact dated oracle accepts `raw` and `att_syntax` for `naked_asm!` while
rejecting inline-only options. The restricted MRML encoder admits either marker
alone or together. Its distinct AT&T grammar parses `%` registers, `$`
immediates, source-first moves, `disp(base,index,scale)` addresses including an
omitted base, and indirect `*` jumps for the supported instruction set;
cross-syntax inputs fail closed.
The object layer now has a typed fixed-capacity relocation collection. It checks
each four-byte patch range and undefined symbol, distinguishes branch from data,
and emits up to eight source-ordered ELF64 `.rela.text` records with
`R_X86_64_PLT32` or `R_X86_64_PC32` and addend `-4`, or corresponding COFF
`IMAGE_REL_AMD64_REL32` records. Repeated symbols retain exact source order and
relocation-free objects remain unchanged. The naked compiler returns validated
direct `jmp symbol` and RIP-relative symbolic memory operands as code plus typed
external-relocation records. Intel `[rip + symbol]` and AT&T `symbol(%rip)` work
across the supported loads, stores, indirect jumps, and system-memory forms.
Ordinary `MachineCode` compilation rejects unresolved output; only the
source-to-object pipeline consumes them immediately. A ninth unresolved
reference and invalid symbol identifiers fail closed in both syntax modes.
Focused tests compare the complete machine-code slice to prove that no prologue
or epilogue is inserted and reject unsupported safety, ABI, signature,
instruction, register, immediate, label, relocation, and fallthrough cases.
Symbol addends, additional relocation families, additional architectures, and
general inline assembly remain fail-closed.
Windows gnullvm and native Arch Linux WSL each pass 638 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
984 compiler tests per host.

The first validated inline-assembly milestone operates inside ordinary x86-64
function lowering rather than the naked-function path. An unsafe function may
use a statement-position fixed `asm!("nop")` template with no operands and may
spell the exact-oracle-observed `nomem`, `nostack`, and `preserves_flags`
options once each. Exact byte comparison proves that one `nop` is inserted
while the existing prologue, return lowering, and epilogue remain unchanged.
Safe functions, operands, unknown templates, and duplicate, empty, or
unsupported options fail closed. Register allocation, register operands,
clobbers, memory effects beyond this fixed no-op, symbols, labels, control flow,
additional instructions/architectures, and general inline assembly remain
unimplemented. Windows gnullvm and native Arch Linux WSL each pass 639 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 985 compiler tests per host.

The next bounded inline-assembly increment adds one explicit typed input form:
`asm!("cmp rax, rax", in("rax") value)` accepts only a checked `u64`
expression, evaluates it through ordinary lowering into RAX, records its reads
in the ownership preanalysis, and emits the published 64-bit register compare.
Unique `nomem` and `nostack` options remain available, while
`preserves_flags` fails closed because this instruction modifies flags. Safe
functions, missing inputs, wrong types, other registers/templates, and invalid
options remain rejected. Windows gnullvm and native Arch Linux WSL each pass
639 library tests, one component-interface probe, 10 conformance tests, and
335 replacement tests: 985 compiler tests per host. Output/inout operands,
register classes, allocation, clobbers, arbitrary effects, and general inline
assembly remain unimplemented.

The explicit-output increment admits the single oracle-compatible form
`asm!("mov rax, 7", lateout("rax") value)` for a mutable `u64` local. The
bounded validator resolves the destination as an exact local identity, records
a write in ownership preanalysis and emission, emits the published immediate
move, and stores RAX into the destination's checked stack slot. `nomem`,
`nostack`, and `preserves_flags` are accepted uniquely because this fixed move
preserves flags. Immutable locals, parameters, unknown names, wrong types,
other registers/templates, and malformed operands fail closed. Windows gnullvm
and native Arch Linux WSL each pass 639 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 985 compiler tests per
host. Inout operands, register classes/allocation, output projections,
clobbers, arbitrary effects, and general inline assembly remain unimplemented.

The explicit-inout increment admits
`asm!("inc rax", inout("rax") value)` for a mutable `u64` local. It records one
typed read-modify-write ownership effect, loads the exact checked stack slot,
emits the published 64-bit increment, and writes RAX back to that same slot.
Unique `nomem` and `nostack` options are accepted; `preserves_flags` is rejected
because the fixed increment modifies flags. Immutable locals, parameters, wrong
types, other registers/templates, and malformed operands fail closed. Windows
gnullvm and native Arch Linux WSL each pass 639 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 985 compiler
tests per host. Register classes/allocation, separate input/output expressions,
output projections, clobbers, arbitrary effects, and general inline assembly
remain unimplemented.

The distinct-inout increment additionally accepts
`asm!("inc rax", inout("rax") input => output)` where `input` is any supported
typed `u64` expression and `output` is a mutable `u64` local. Ownership
preanalysis records expression reads before a separate destination write rather
than conflating the two places into read-modify-write. Emission evaluates the
input once into RAX, applies the fixed increment, and stores only to the checked
output slot. Empty or repeated arrows, wrong input/output types, immutable or
parameter outputs, unsupported registers, and invalid options fail closed.
Windows gnullvm and native Arch Linux WSL each pass 639 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 985
compiler tests per host. Register classes/allocation, projections, clobbers,
arbitrary effects, and general inline assembly remain unimplemented.

The first register-class increment implements the exact ORACLE-0002 shape
`asm!("inc {value}", value = inout(reg) ...)`. A bounded named-template parser
requires one identifier placeholder and the same declaration name, accepts the
existing same-place or distinct-place `u64` inout operands, and deterministically
allocates the sole class operand to RAX. It then uses the already verified
ownership and increment/writeback paths. Positional, missing, mismatched, or
repeated placeholders; other classes; additional operands; and invalid options
fail closed. Windows gnullvm and native Arch Linux WSL each pass 639 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 985 compiler tests per host. Multi-operand allocation, other classes,
projections, clobbers, arbitrary effects, and general inline assembly remain
unimplemented.

Exact ORACLE-0002 follow-up probes establish and the bounded option validator
implements output-bearing `pure+nomem`, `pure+readonly`, and standalone
`readonly`. `pure` requires an output and one of the two memory declarations;
`nomem` and `readonly` are mutually exclusive. Existing duplicate-option,
template-specific `preserves_flags`, and unsupported-option rejection remains
in force. Windows gnullvm and native Arch Linux WSL each pass 639 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
985 compiler tests per host. This is declarative validation for fixed templates,
not evidence of actual assembly memory accesses, optimizer integration, general
clobbers/effects, or general inline assembly.

The two-register-class increment implements the exact oracle-proven named
`add {left}, {right}` template with a mutable `u64 inout(reg)` left local and a
typed `u64 in(reg)` right expression. Allocation is deterministic and non-
aliasing: the left value is preserved on the evaluation stack, the right lowers
once and moves to RCX, the left restores to RAX, and `add rax, rcx` writes back
only to the left slot. Ownership facts record right-expression reads and a left
read-modify-write effect. Invalid names, types, mutability, surplus operands,
classes, templates, and effects fail closed. Both canonical hosts pass 985
compiler tests. Three-or-more operands and general allocation remain absent.

The typed clobber increment admits the exact oracle-proven
`asm!("nop", clobber_abi("C"))` case. Ordinary statement lowering retains all
language values in checked stack storage across this boundary, so the fixed
no-op has no hidden register-resident value to preserve. Unknown ABI names,
generic outputs combined with a clobber ABI, additional declarations, and
non-no-op clobber templates fail closed. Both canonical hosts pass 985 compiler
tests. Other ABI clobber sets, explicit clobber outputs, and general clobber
integration remain absent.

Explicit RAX `lateout`, same-place `inout`, and a distinct `inout` output now
accept one exact numeric field of a mutable tuple local when that field is
`u64`. The compiler retains the tuple local as the public place identity,
records the selected `TupleField` projection in the typed write or read-modify-
write fact, validates bounds and element type before emission, and uses checked
stack-slot arithmetic for load and writeback. The distinct input remains an
ordinary typed expression and is evaluated exactly once before increment and
projected writeback. Immutable tuples, out-of-range fields, and non-`u64` fields
fail closed. Windows gnullvm and native Arch Linux WSL each pass 639 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 985 compiler tests per host. Nested, indexed, and dereferenced places
remain absent.

The constant indexed-output increment extends those three explicit RAX forms to
one compile-time numeric element of a mutable `[u64; N]`. Admission checks exact
array type, `u64` element type, mutability, and bounds before recording an
`ArrayElement` ownership projection; emission selects the checked stack slot for
load or writeback. The exact dated oracle accepted independently authored
`lateout`, same-place `inout`, and split `inout` probes with `values[1]` output
places. Windows gnullvm and native Arch Linux WSL each continue to pass 985
compiler tests. Dynamic indexes, nested aggregates, dereference outputs, and
general place lowering remain absent.

The static inline-output place consolidation replaces the separate scalar,
tuple, and array preanalysis/emission paths with one typed record carrying the
resolved local, bounded projection sequence, and checked stack offset. A common
preanalysis boundary records the write or read-modify-write fact and any exact
move-path effect; a common emission boundary verifies fact order and resolves
the destination slot. This removed 561 duplicated lines while preserving the
same fail-closed syntax and behavior. Both canonical hosts pass the same 985
compiler tests. This is a structural dependency for dynamic-index and
dereference places, not a claim that either is implemented.

The indirect inline-output milestone adds an explicit pointer-backed storage
kind to that typed place. Exact `*name` output syntax resolves either a local or
parameter whose base type is `&mut u64` or `*mut u64`, records the base identity
plus `Dereference` projection, and emits an indirect load/writeback for RAX
`lateout`, same-place `inout`, and distinct `inout`. Shared/immutable references,
const raw pointers, other pointee types, malformed names, and unknown bases fail
closed before emission. The exact dated oracle accepted all three independently
authored mutable-reference shapes. Windows gnullvm and native Arch Linux WSL
each pass 985 compiler tests. Dynamic indexes, nested projections, general
memory operands/effects, and general assembly remain absent.

The dynamic indexed-output milestone accepts `values[index]` when `values` is a
mutable `[u64; N]` local and `index` is an exact local or parameter of type
`usize`. Preanalysis records the index read and an `Index` output projection.
Emission evaluates the identifier once, traps when it is not less than `N`,
saves the checked value across the fixed RAX operation, and reuses the existing
bounded array-element load/store selector. Explicit `lateout`, same-place
`inout`, and distinct `inout` are covered. The exact dated oracle accepted all
three original forms. Windows gnullvm and native Arch Linux WSL each pass 985
compiler tests. General index expressions, nested projections, reference-array
index outputs, and general assembly remain absent.

The expression-indexed output milestone generalizes that dynamic place to any
`usize` expression supported by the bounded runtime expression engine. The
normal type checker and read preanalysis now validate the parsed index, and the
normal emitter evaluates it exactly once before the existing bounds check and
saved-index load/writeback path. Focused coverage includes remainder and grouped
addition expressions plus fail-closed non-`usize` indexes. The exact dated
oracle accepted original Rust 2024 `lateout`, same-place `inout`, and distinct-
input `inout` probes using those expression places. Windows gnullvm and native
Arch Linux WSL each pass 639 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 985 compiler tests per host.
Expressions outside the existing bounded subset, nested projections, reference-
array index outputs, and general assembly remain absent.

The indexed reference-output milestone extends that expression-indexed place to
mutable `[u64; N]` references held in parameters or locals. The typed place
records ordered `Dereference` and `Index` projections, resolves the pointer slot
before emission, and reuses the existing checked reference-array address/load/
store helpers after evaluating the index once. Parameter slots include all live
local stack slots; this also corrects explicit scalar dereference outputs when a
parameter pointee is written while locals are live. Focused tests cover RAX
`lateout`, same-place `inout`, distinct-input `inout`, local-reference storage,
and fail-closed shared/non-`u64` references. The exact dated oracle accepted all
three parameter-reference forms. Windows gnullvm and native Arch Linux WSL each
pass 639 library tests, one component-interface probe, 10 conformance tests, and
335 replacement tests: 985 compiler tests per host. Deeper nested projections,
slice outputs, general memory effects, and general assembly remain absent.

The indexed slice-output milestone extends the same typed destination to mutable
`[u64]` slice references in parameters or locals. Resolved storage keeps the fat
reference's pointer and runtime-length slots separate. Emission evaluates the
index once, preserves it on the evaluation stack, compares it unsigned against
the stored length, and then reuses the scaled reference load/store path. Slice
ownership follows the existing direct `Index` projection rather than inventing
an invalid dereferenced-unsized move path. Focused tests cover RAX `lateout`,
same-place `inout`, distinct-input `inout`, local slice storage, and fail-closed
shared/non-`u64` slices. The exact dated oracle accepted all three parameter-
slice forms. Windows gnullvm and native Arch Linux WSL each pass 639 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 985 compiler tests per host. Deeper nested places, other element types,
general memory effects, and general assembly remain absent.

The discarded explicit-output milestone accepts exact `lateout("rax") _` on the
fixed `mov rax, 7` template. It preserves the register-write declaration and
machine instruction while deliberately creating no destination place, write
fact, or writeback. The exact dated oracle accepted the independently authored
Rust 2024 form. Windows gnullvm and native Arch Linux WSL each pass 639 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 985 compiler tests per host. Other explicit clobbers, additional registers,
general effects, and general assembly remain absent.

The explicit RCX-output milestone generalizes the fixed output representation
to carry RAX or RCX identity. Exact `mov rcx, 7` plus `lateout("rcx")` reuses the
existing typed destination, ownership, bounds, and writeback path; a non-
discarded RCX value is transferred to the common writeback register only after
the declared instruction, while `_` produces no place effect or transfer. The
exact dated oracle accepted both independently authored Rust 2024 forms. Windows
gnullvm and native Arch Linux WSL each pass 639 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 985 compiler
tests per host. Other explicit registers, generic allocation, and general
assembly remain absent.

The explicit RCX-inout milestone generalizes the fixed inout representation to
carry the same RAX-or-RCX identity as fixed outputs. Exact `inc rcx` with
`inout("rcx")` accepts same-place and distinct-input `u64` destinations through
the existing typed place, ownership, bounds, and writeback machinery. The input
enters RCX before the declared instruction and returns to the common writeback
register afterward. Mismatched template and explicit-register pairs fail
closed. The exact dated oracle accepted both independently authored Rust 2024
forms. Windows gnullvm and native Arch Linux WSL each pass 639 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
985 compiler tests per host. Other explicit registers, generic allocation, and
general assembly remain absent.

The explicit RCX-input milestone generalizes the fixed compare input to carry
RAX-or-RCX identity. Exact `cmp rcx, rcx` with `in("rcx")` uses the existing
checked `u64` expression and read-effect path, transfers the value to RCX, and
rejects mismatched template/register pairs. The exact dated oracle accepted the
independently authored Rust 2024 form. Windows gnullvm and native Arch Linux WSL
each pass 639 library tests, one component-interface probe, 10 conformance tests,
and 335 replacement tests: 985 compiler tests per host. Other explicit registers
and general assembly remain absent.

The fixed explicit-RDX milestone extends the shared typed register identity
across exact `cmp rdx, rdx` input, `mov rdx, 7` stored/discarded output, and
`inc rdx` same-place/distinct-input inout. It reuses the existing checked `u64`
expression, typed destination, ownership, bounds, and writeback machinery;
mismatched template/register pairs fail closed. The exact dated oracle accepted
all five independently authored Rust 2024 forms. Windows gnullvm and native Arch
Linux WSL each pass 639 library tests, one component-interface probe, 10
conformance tests, and 335 replacement tests: 985 compiler tests per host. Other
explicit registers, generic allocation, and general assembly remain absent.

The fixed explicit-GPR milestone replaces the three-register enum and manual
template branches with one bounded register code shared by parsing and checked
REX/ModRM encoding. Exact `cmp reg, reg` input, `mov reg, 7` stored/discarded
output, and `inc reg` same-place/distinct-input inout admit RAX, RCX, RDX, RSI,
RDI, and R8 through R15. Exact oracle probes accepted low and extended forms and
all R15 output/inout shapes; independent rejection probes rejected RBX, RSP, and
RBP, which MRML also rejects. Windows gnullvm and native Arch Linux WSL each pass
639 library tests, one component-interface probe, 10 conformance tests, and 335
replacement tests: 985 compiler tests per host. Arbitrary templates, register
classes/general allocation, and general assembly remain absent.

The premise-bearing rigid-normalization milestone proves the selected generic
implementation's instantiated trait and projection predicates before exposing
its associated value. It shares the caller's 16-frame rigid proof stack and
retains the separate 16-frame projection visited stack, so recursive premise
cycles and deep proof chains report `Cycle` and `Overflow` rather than escaping
the bounds. Focused tests cover satisfied and missing prerequisites, recursive
cycles, and proof-depth overflow. Windows gnullvm and native Arch Linux WSL each
pass 537 library tests, one component-interface probe, 10 conformance tests, and
335 replacement tests: 883 compiler tests per host.

The projection-bearing logical clause-head milestone stores up to 64 identified
bound heads separately from flat clauses. Every parameter must be constrained
by a direct leaf position before the instantiated head is normalized through
the shared projection environment and unified with the existential query;
parameters found only below projections fail closed as ambiguous. Windows
gnullvm and native Arch Linux WSL each pass 522 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 868 compiler
tests per host. Each clause may retain up to eight flat implemented-trait
premises, instantiated from the selected head substitution and discharged by
the existing depth- and cycle-bounded projection-aware proof. The recursive
integration milestone adds an opt-in existential entry point that threads the
database, copied candidate constraint states, and shared proof stack through
nested premises. Windows gnullvm and native Arch Linux WSL each pass 525 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 871 compiler tests per host. Nested success, ambiguity, cycle, and depth
overflow have focused tests. The projection-bearing generic-implementation
admission milestone adds a separate 64-entry table. It proves disjointness only
from trait/arity mismatch or an unequal direct concrete leaf and rejects every
projection or parameter relationship it cannot decide, including collisions
with exact and flat-generic heads. Windows gnullvm and native Arch Linux WSL
each pass 526 library tests, one component-interface probe, 10 conformance
tests, and 335 replacement tests: 872 compiler tests per host. Existential
selection now normalizes one admitted head in a copied root state, proves its
flat premises, and returns the stable implementation identity and inferred
substitution. Windows gnullvm and native Arch Linux WSL each pass 527 library
tests, one component-interface probe, 10 conformance tests, and 335 replacement
tests: 873 compiler tests per host. The recursive integration entry point
threads the admitted implementation table through nested premises before
logical-clause fallback, using the same copied root state and 16-frame proof
stack. Windows gnullvm and native Arch Linux WSL each pass 528 library tests,
one component-interface probe, 10 conformance tests, and 335 replacement tests:
874 compiler tests per host. Nested proof, cycles, and depth overflow have
focused tests. Projection-bearing implemented-trait premises now reuse each
head's validated term arena, instantiate in the selected substitution, and
normalize in the shared root state before flat recursive proof. Both hosts pass
the same 874 compiler tests, including a projected premise and its missing flat
dependency. The dependency-ordered premise milestone proves flat predicates
first and then normalizes term-bearing predicates in the refined root state.
Windows gnullvm and native Arch Linux WSL each pass 529 library tests, one
component-interface probe, 10 conformance tests, and 335 replacement tests: 875
compiler tests per host. A two-candidate projection becomes unique only after a
flat premise constrains its parameter. The mixed projected-premise scheduler
now retries both flat and term-bearing predicates after any sibling proves,
with per-attempt state rollback and explicit no-progress ambiguity. Windows
gnullvm and native Arch Linux WSL each pass 530 library tests, one component-
interface probe, 10 conformance tests, and 335 replacement tests: 876 compiler
tests per host. Focused tests cover refinement in both directions. The direct-leaf coherence refinement
feeds every non-projection head position into the fixed equality unifier, so
repeated parameters can prove a projection-bearing head disjoint from peer,
exact, and flat-generic heads with conflicting concrete tuples. Both hosts pass
the same 875 compiler tests; projection nodes remain opaque and never prove
disjointness. Complete projection-equation coherence,
higher-ranked term binders, backtracking, caching, coinduction, and source
syntax remain unsupported.

The existential projection-term binder milestone mirrors the 64-node runtime
arena with bound concrete/parameter leaves, validates parameter scope, remaps
deduplicated identities during instantiation, and creates universe-aware root
inference variables before projection-bearing goal proof. Windows gnullvm and
native Arch Linux WSL each pass 520 library tests, one component-interface
probe, 10 conformance tests, and 335 replacement tests: 866 compiler tests per
host. Higher-ranked term binders, projection terms in clause heads and premise
type positions, concrete/rigid projection-premise proof, backtracking, caching,
coinduction, and source syntax remain unsupported.

## Typed PE data and constant short imports

The linker now distinguishes direct-name version-zero AMD64 COFF code, data,
and constant short imports. Data and constant members require an exact archive
index association between the payload symbol and its `__imp_` alias, define
only the loader-populated IAT slot, and retain a metadata-only typed
`(library, symbol)` record for PE import-table emission. They do not synthesize
callable text or expose the payload name as an IAT definition. Missing or
mismatched aliases, ordinal forms, name transformations, malformed payloads,
and trailing bytes fail closed. The Linux release compiler-core gate passes
839 unit tests, 2 object-evidence tests, 10 conformance tests, 351 replacement
tests, and 128 semantic-execution tests; the Linux release driver build also
passes. This is independently constructed unit and driver structural evidence;
the current pinned ORACLE-0003 probes select no data/constant short-import
member, and no new Windows runtime or physical-hardware claim is made.

## Typed PE named-import hints

The linker now retains the complete 16-bit hint from direct-name AMD64 COFF
short imports across code thunks, data/constant metadata, driver IAT
contextualization, deduplication, and PE hint/name serialization. Duplicate
library/symbol identities with conflicting hints fail closed. A nonzero fixture
is asserted in both the decoded typed relocation and final PE bytes. The Linux
release compiler-core gate passes 839 unit tests, 2 object-evidence tests, 10
conformance tests, 351 replacement tests, and 128 semantic-execution tests; the
Linux release driver build also passes. Ordinal imports and name
transformations are covered by the immediately subsequent signed checkpoints;
no new runtime or hardware evidence is claimed by the hint checkpoint.

Signed checkpoints `1bbe1248`, `0a82e699`, and `5347c138` retain typed ordinal
imports, bounded `NOPREFIX`/`UNDECORATE` loader names with distinct decorated
archive aliases, and the complete `REL32` through `REL32_5` trailing-byte bias.
Their Linux release canonical gates pass respectively 840, 840, and 841 unit
tests plus all existing object, conformance, replacement, and semantic groups;
the release compiler-driver build passes at each checkpoint.

## Selected-text PE address relocation checkpoint

The selected COFF text decoder and PE serializer now retain typed
`IMAGE_REL_AMD64_ADDR32NB` and `IMAGE_REL_AMD64_ADDR64` targets through final
layout. Image-relative fields receive checked `u32` RVAs; absolute fields
receive checked image-base VAs and enter the bounded `DIR64` base-relocation
inventory. Both forms preserve exact object/section, read-only, writable, TLS,
and import target classes rather than collapsing them to layout ranks or
guessed names. Eight-byte field bounds, signed addends, final PE bytes, base
relocation bytes, driver contextualization, unsupported-kind rejection, and
overflow failure have focused coverage.

At signed checkpoints `2beccac3` and `64e822c4`, the Linux release canonical
gates passed first 842 and then 843 unit tests, plus 2 object-evidence tests, 10
conformance tests, 351 replacement tests, and 128 semantic-execution tests with
zero failures. The release compiler-driver build passed at both checkpoints.
A read-only census of the exact ORACLE-0003 gnullvm `core`, `alloc`, and `std`
archives found only `ADDR32NB` (4,597), `ADDR64` (78,281), `REL32` (13,145), and
`SECREL` (43,306). Counts cover all archive members and debug metadata, not only
the selected runtime closure. Patent review: NOT_TRIGGERED; this implements
conventional PE/COFF relocation encodings and bounded validation without a new
mechanism.

All five durable pinned std/TLS Wine probes then reproduced their exact recorded
PE sizes and SHA-256 hashes and returned 42: std, const TLS, lazy TLS,
child-thread TLS, and child-thread destructor TLS. The exact commands were
`RUSTUP_HOME=/home/m/.wine/drive_c/users/m/.rustup
docs/compiler/probes/check_pinned_std_execution.sh` and the four
`check_pinned_std_tls_execution.sh` modes (`const`, `lazy`, `thread`, and
`destructor`). This is hosted Wine regression evidence, not native Windows,
WHP, or physical-hardware verification.

The durable std script now accepts explicit `parallelism` and `time` modes. The
new independently authored `SystemTime::now` consumer links to 2,393,088 bytes
with SHA-256
`8dd3b4e85476af2be38b6ced952980f4e8d29f103d25d0efa0f9cda90b973d10`
and returns 42 under Wine 11.16. The original mode retains its exact
`66492a766c27125d824fd63dbcdc47c0804a37da1b79979b812a06a692a9abc6`
hash and exit 42 after the script refactor. This is hosted wall-clock path
evidence only; no native Windows or physical clock claim is made.

The additional `random` mode forces `RandomState::new` and therefore the pinned
`bcryptprimitives.dll!ProcessPrng` short import. It links to 2,393,088 bytes with
SHA-256
`c3716a3dbddcb453b1bcd02f93940d1ccd2ae3093c532d34b6c3ead9dc0c65be`
and returns 42 under Wine 11.16. This is one hosted import/link/load path, not a
randomness-quality or physical entropy claim.

The `sleep` mode calls `std::thread::sleep` for one millisecond and links the
exact pinned Windows delay path. It produces 2,393,088 bytes with SHA-256
`f044c1c51e5a85a169d1bb39bd88307943fe8be28bec2269f430c93e809644cf`
and returns 42 under Wine 11.16. This is bounded hosted linkage and execution
evidence, not timing-precision, native Windows, WHP, or physical-timer evidence.

Same-object writable `ADDR64` targets in identified COFF fragments now retain
their exact object, section, and checked offset through final writable PE
layout. A target value plus field addend beyond the initialized/zero-filled
section extent fails closed, while the identity-free compatibility decoder
keeps its previous zero-offset named form. Focused coverage verifies typed
decoding, the final image-base virtual address, and out-of-range rejection.
The Linux release gate passes 843/843 units, 2/2 object-evidence tests, 10/10
conformance tests, 351/351 replacements, and 128/128 semantic tests. The
release driver and all eight pinned std/TLS Wine modes pass with exact recorded
hashes and exit 42. Patent review: NOT_TRIGGERED.

Ordered archive selection now pins the exact `__mingw_TLScallback` dependency
shape observed at the ORACLE-0003 MinGW TLS boundary: a selected member's named
reference pulls a unique typed text-section additional definition at a nonzero
offset and atomically retains that defining member's sibling fragments.
Conflicting same-named typed identities fail closed instead of selecting an
arbitrary member. The regression fixture is independently authored; pinned
archive inspection found three `REL32` references in `tlssup.o` and the global
definition in `tlsthrd.o`. The Linux release gate passes 844/844 units, 2/2
object-evidence tests, 10/10 conformance tests, 351/351 replacements, and
128/128 semantic tests; the release compiler-driver gate passes 16/16. Patent
review: NOT_TRIGGERED.

PE archive retention now follows named code-pointer dependencies that occur
only in selected writable, CRT, or TLS callback fragments. It retains the whole
defining archive member for a conventional global or unique typed text-section
definition, refuses conflicting typed identities, and repeats to a bounded
fixed point for dependencies introduced by newly selected members. The release
compiler-driver gate passes 17/17. The pinned parallelism, time, random, sleep,
const TLS, lazy TLS, child-thread TLS, and destructor TLS Wine probes all
reproduce their exact recorded PE sizes and SHA-256 hashes and return 42.
Patent review: NOT_TRIGGERED.

Typed CRT initializer and TLS callback slots now retain a zero-addend
section-zero undefined global `ADDR64` target as a code-only named dependency.
The decoder continues to reject the same external shape in ordinary writable
data and rejects nonzero field addends rather than inferring an untyped address
class. The Linux release gate passes 844/844 units, 2/2 object-evidence tests,
10/10 conformance tests, 351/351 replacements, and 128/128 semantic tests; the
release compiler-driver gate passes 17/17. All eight pinned std/TLS Wine modes
reproduce their exact recorded sizes and SHA-256 hashes and return 42. Patent
review: NOT_TRIGGERED.

Writable-only named code pointers now complete final PE resolution through a
unique typed text-section definition rather than being retained by the driver
and then rejected by the serializer's global-only lookup. Conventional global
text still wins, while conflicting typed identities and non-code or one-past
targets fail closed under the typed table's error class. The Linux release gate
passes 844/844 units, 2/2 object evidence, 10/10 conformance, 351/351
replacements, and 128/128 semantic tests; the release compiler-driver gate
passes 17/17. All eight pinned std/TLS Wine modes reproduce their exact recorded
sizes and SHA-256 hashes and return 42. Patent review: NOT_TRIGGERED.

PE contextualization now projects a named relocation to exact COFF section
identity only when every matching typed definition agrees. Conflicting typed
object/section/offset targets remain unresolved even when a writable symbol has
the same name, and a conventional global definition retains precedence. The
adjacent Linux release core gate passes 844/844 units, 2/2 object evidence,
10/10 conformance, 351/351 replacements, and 128/128 semantic tests; the changed
release driver passes 17/17. All eight pinned std/TLS Wine modes reproduce their
exact recorded sizes and SHA-256 hashes and return 42. Patent review:
NOT_TRIGGERED.

AMD64 COFF text relocation decoding now resolves the exact bounded
`IMAGE_SYM_CLASS_WEAK_EXTERNAL`/`SEARCH_ALIAS` form observed twice in the pinned
profiler runtime to its same-object strong fallback definition. Other search
policies, auxiliary-record targets, chained aliases, and non-strong fallbacks
remain rejected. Exact inspection found no weak externals in the pinned core,
alloc, or std archives. The Linux release gate passes 845/845 units, 2/2 object
evidence, 10/10 conformance, 351/351 replacements, and 128/128 semantic tests;
the release compiler-driver gate passes 17/17. All eight pinned std/TLS Wine
modes reproduce exact recorded sizes and SHA-256 hashes and return 42. Patent
review: NOT_TRIGGERED.

Read-only COMDAT relocation decoding now retains exact projected target-section
identity for section-defined global symbols as well as static symbols. True
section-zero externals remain name-based for archive resolution. Focused
coverage asserts both projected global identities and the external boundary.
The Linux release gate passes 843/843 units, 2/2 object-evidence tests, 10/10
conformance tests, 351/351 replacements, and 128/128 semantic tests. The
release driver and all eight pinned std/TLS Wine modes pass with their exact
recorded hashes and exit 42. Patent review: NOT_TRIGGERED.
