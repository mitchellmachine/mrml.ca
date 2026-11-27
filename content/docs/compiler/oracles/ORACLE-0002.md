# MRML Rust oracle generation 0002

## Identity

- rustup toolchain: `nightly-2026-08-24`
- rustc version: `rustc 1.100.0-nightly`
- full commit: `fb6531d550e0075b9eb9a51464f404805eec87d9`
- source/build date: `2026-08-23`
- MRML verification date: `2026-08-25`
- verified host: `x86_64-pc-windows-gnullvm`
- LLVM version: `23.1.0`
- edition/default behavior: MRML probes use Rust 2024 syntax where applicable;
  individual mapped upstream tests retain their own declared/default edition.

This exact dated nightly is the repository's default upstream build toolchain
and current behavioral oracle. ORACLE-0001 remains an immutable prior generation.
Neither record promises compatibility with every behavior of its compiler.

## Relevant feature state

- Polonius: no complete Polonius compatibility claim is established; the MRML
  corpus covers only its independently implemented and documented borrowing
  subset.
- trait solver: no complete next-generation trait-solver compatibility claim is
  established.
- unstable features: only features exercised by independently authored MRML
  source and probes are adopted; the nightly as a whole is not an MRML contract.
- unsupported borrowing, trait, provenance, unsafe, ABI, assembly, const, or
  metadata behavior continues to fail closed as documented.

## Delta from ORACLE-0001

ORACLE-0001 used rustc commit
`f7d782a3be46d6bb4b9792fe69a61db389ba1769` from 2026-08-19. Generation 0002
advances the default to the nightly distributed on 2026-08-24. The existing
MRML compiler corpus passed unchanged on the verified Windows gnullvm host; no
corpus-visible semantic or diagnostic delta was observed. This is bounded
evidence, not a claim that the upstream compilers are globally equivalent.

## Conformance result

All 767 `mrml-rustc` and `mrml-rustc-driver` tests passed on Windows gnullvm.
Clippy with warnings denied also passed. A previous Arch Linux release build of
the same rustc commit crashed in LLVM `PromotePass`; Linux is therefore recorded
as a toolchain regression/blocker, not passing oracle evidence. The default pin
does not convert that failure into a cross-host support claim.

Generation 0002 is accepted as the current build/oracle for the documented
subset on the verified host. Future generations must preserve both prior
records, rerun the corpus, classify observed deltas, and retain independently
authored regression probes.

## Naked-assembly option follow-up

On 2026-08-26, an independently authored Rust 2024 probe against this exact
oracle compiled `naked_asm!("ud2")`, `options(raw)`, and
`options(att_syntax)` with `rustc --edition 2024 --emit metadata`. A separate
probe invocation rejected `noreturn`, `nomem`, `nostack`, `preserves_flags`,
and `pure` as options that cannot be used with `naked_asm!`. MRML admits `raw`
and implements a distinct bounded AT&T operand grammar when `att_syntax` is
selected; unsupported options fail closed. These are
black-box syntax/validation observations, not copied upstream source or tests,
and do not establish general inline-assembly compatibility.

## Component-interface follow-up

On 2026-08-25, the canonical native MRML action added and passed one independently
authored component-interface probe on Windows gnullvm and Arch Linux. Pinned
upstream rustc executed the explicit Zstd ABI-3 generation/operation/size
identity check, while `mrml-rustc` emitted nonempty COFF and ELF objects for the
same bounded scalar projection. The full core action passed 420 library, one
component-interface, 10 conformance, and 335 nightly-replacement tests on each
host. This does not revise the earlier Linux release-build regression, claim
full binding-source compatibility, compare object semantics byte-for-byte, or
make Rust/C ABI part of the stable MRML interface.

## Inline-assembly validation follow-up

On 2026-08-26, independently authored Rust 2024 metadata-only probes against
the exact `nightly-2026-08-24-x86_64-pc-windows-gnullvm` oracle compiled a
fixed `asm!("nop")` template with `nomem`, `nostack`, and `preserves_flags`; a
named `inout(reg)` operand referenced from the template; and explicit
`in("rax")` plus `lateout("rax")` operands. A separate probe invocation rejected
`pure` without `nomem` or `readonly` and without an output, rejected combined
`readonly` and `nomem`, and rejected `rsp` as an explicit operand register.
These are black-box syntax and validation observations from original probes,
not copied upstream source or tests. They establish neither general inline-
assembly compatibility nor permission to omit MRML's independent bounded
register, option, template, clobber, control-flow, and safety validation.

An additional independently authored metadata-only probe on the same date and
exact commit compiled output-bearing named `inout(reg)` forms with
`options(pure, nomem)`, `options(pure, readonly)`, and standalone
`options(readonly)`. Separate invocations rejected `pure` without `nomem` or
`readonly`, rejected `pure, nomem` on an input-only form because it had no
output, and rejected `pure, nomem, readonly` because `nomem` and `readonly` are
mutually exclusive. Temporary probe sources and metadata were removed after
recording the black-box outcomes.

A further independently authored metadata-only probe against the same exact
commit compiled a two-operand named template with one `inout(reg)` and one
`in(reg)` operand and compiled `asm!("nop", clobber_abi("C"))`. Separate
invocations rejected a duplicate named operand, an unknown `clobber_abi`, and a
generic register-class output combined with `clobber_abi("C")`, which requires
explicit output registers. Temporary probe sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe on 2026-08-26 against
the same `nightly-2026-08-24-x86_64-pc-windows-gnullvm` toolchain and exact
`fb6531d550e0075b9eb9a51464f404805eec87d9` commit compiled a named
`inout(reg)` operand whose place was the second `u64` field of a mutable tuple.
This establishes only the black-box acceptance of that projected operand shape;
it does not establish general place, register-allocation, or assembly semantics.
Temporary probe source and metadata were removed after recording the outcome.

A subsequent independently authored metadata-only probe against that same
toolchain and commit compiled a named `inout(reg)` whose `u64` input was distinct
from its output place, with the output written to the second `u64` field of a
mutable tuple. This records only exact black-box acceptance of split projected
output syntax and does not establish general projected-place or assembly
semantics. Temporary probe source and metadata were removed.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit compiled three explicit RAX forms whose output was
`values[1]` for a mutable `[u64; 2]`: `lateout`, same-place `inout`, and a
distinct-input `inout`. This is exact black-box acceptance evidence for those
constant array-element output shapes only, not for dynamic indexing, general
places, register allocation, or assembly semantics. Temporary source and
metadata were removed.

An independently authored Rust 2024 metadata-only nested-branch-return probe
against this exact toolchain and commit accepted a mutable parameter reborrow
inside a nested-loop conditional action block before returning that reborrow.
This is black-box evidence for that exact parameter-backed return shape only;
it does not establish branch break/continue destination state, general region
inference, or local-backed return safety. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only nested-branch-control probe
against this exact toolchain and commit accepted a scoped mutable parameter
reborrow before both an inner `break` and an inner `continue`; each function
subsequently returns the parameter. This black-box evidence covers the exact
parameter-backed destination-state shapes only. It does not establish general
region inference, local-backed return safety, or state-changing inner-continue
prefixes. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only nested-branch-header probe
against this exact toolchain and commit accepted a loop-carried mutable
parameter alias reborrowed inside a conditional nested-loop branch immediately
before an inner `continue`, with the alias returned on the untaken path. This is
black-box evidence for that exact convergent parameter-backed shape only; it
does not establish general region inference or arbitrary loop-carried local
origins. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only nested-loop `if`/`else`
probe against this exact toolchain and commit accepted action prefixes followed
by `return` in the primary arm and inner `continue` in the explicit else arm.
This is black-box syntax and control-shape evidence only; it does not establish
general region semantics for the second successor. MRML's separately authored
probes now map both CFG successors and their scoped ownership locations,
evaluate true and false constant-return arms, and emit direct and helper-inlined
scalar else returns into ELF64 and COFF objects. The exact function-return
outlives classifier also admits a parameter-backed mutable-reference else return
and rejects a branch-local returned origin. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only nested-loop `else if` probe
against this exact toolchain and commit accepted a scoped local followed by a
return in both the primary and conditional alternative, plus false-path
fallthrough to an inner break. MRML now retains one such alternative condition
and evaluates its constant semantics. MRML also maps its distinct condition,
true action successor, and false fallthrough into CFG and ownership facts.
Separately authored MRML probes now emit that same bounded shape through direct
and helper-inlined x86-64 paths into ELF64 and COFF objects. This remains syntax
and control-shape oracle evidence only, not general branch-chain, region, or
native-code evidence from rustc. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only nested-loop chain against
this exact toolchain and commit accepted a primary arm, two ordered `else if`
arms with scoped locals, and a final `else`; four const calls selected each
outcome. MRML now retains up to four alternatives and evaluates that bounded
chain lazily. MRML also maps every arm to indexed CFG and ownership identities
and emits separately authored direct and helper-inlined probes into ELF64 and
COFF objects. This is syntax and const-control-shape evidence
only, not general branch-chain, region, or native-code evidence. Temporary
source and metadata were removed.

An independently authored mutable-reference variant against this exact
toolchain and commit accepted parameter-backed returns from the primary, two
conditional alternatives, and final else. Replacing the first conditional
alternative with a function-local mutable reference failed with E0515. MRML's
separate direct and helper-inlined probes emit the all-parameter chain into
ELF64 and COFF, while its focused outlives test rejects the local-backed arm.
This is evidence for those exact indexed exits, not general regions or alias
analysis. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only nested-break set against this
exact toolchain and commit accepted a local-initialized alias overwritten by the
parameter before an inner unconditional-loop break and returned afterward.
Replacing the break state with local storage failed with E0515; a condition-
headed inner loop whose zero-iteration path retained local storage also failed
with E0515. This is black-box evidence for those exact inner exits, not general
nested-loop or region inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only labeled-control set against
this exact toolchain and commit accepted parameter-backed state routed through
an inner loop's `break 'outer` and through a condition-headed outer loop's
`continue 'outer` backedge. Replacing either routed state with function-local
storage failed at the post-loop return with E0515. This is black-box evidence
for those exact labeled destinations and joins, not general nested-loop fixed
points or region inference. Temporary source and metadata were removed.

A follow-up independently authored Rust 2024 metadata-only set against this
exact toolchain and commit combined a conditional outer-target break or
continue with a separately reachable inner exit. Both all-parameter forms
compiled; making the conditional-break path or the inner-exit path local-backed
failed at the post-loop return with E0515. This is black-box evidence that those
exact mixed destinations participate in outlives checking, not general nested-
loop fixed points or region inference. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only nested-backedge pair against
this exact toolchain and commit accepted an initially local-backed alias when an
unconditional parameter overwrite preceded every conditional inner-loop exit.
Moving that conditional exit before the overwrite failed at the enclosing
return with E0515. This is black-box evidence for that exact normalized cycle
and early-exit distinction, not iterative fixed-point or general region
inference. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only conditional-continue pair
against this exact toolchain and commit accepted an initially local-backed alias
when a parameter overwrite preceded both the conditional inner continue and
conditional inner break. Moving both controls before the overwrite failed at
the enclosing return with E0515. This is black-box evidence for that exact
normalized continue/backedge ordering, not general fixed-point or region
inference. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only unconditional-continue pair
against this exact toolchain and commit accepted a parameter overwrite followed
by a conditional return and unconditional inner continue, and reported a later
local assignment as unreachable. Moving the conditional return before the
overwrite failed with E0515. This is black-box evidence for that exact prefix-
bounded normalization and terminating suffix, not general fixed-point or region
inference. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only multi-backedge pair against
this exact toolchain and commit accepted two conditional inner continues that
carried parameter-backed and local-backed alias states when every possible
inner-loop exit first restored the parameter. Moving the conditional break
before that restoration failed at the enclosing return with E0515. This is
black-box evidence for those exact joined backedges and exit ordering, not
general fixed-point or region inference. Temporary source and metadata were
removed.

A follow-up independently authored Rust 2024 metadata-only pair against this
exact toolchain and commit accepted the same differing conditional inner
backedges when a parameter overwrite preceded an unconditional inner break;
rustc also reported a later local assignment as unreachable. Adding an earlier
conditional break before normalization failed at the enclosing return with
E0515. This is black-box evidence for that exact terminal boundary, not general
fixed-point or region inference. Temporary source and metadata were removed.

Another independently authored Rust 2024 metadata-only pair against this exact
toolchain and commit accepted parameter-backed and local-backed conditional
inner continues joined with a final unconditional inner continue when a
parameter overwrite preceded the only return. Rustc reported the final
continue's suffix as unreachable; moving the return before normalization failed
with E0515. This is black-box evidence for those exact mixed backedges, not
general fixed-point or region inference. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only iterative-header pair against
this exact toolchain and commit used two mutable-reference aliases so a local
origin required multiple loop transfers to reach the first alias. Rustc accepted
the form that restored the parameter before every break and enclosing return;
moving the break before restoration failed with E0499 because the local borrow
could remain live across iterations. This is black-box evidence for that exact
multi-step cycle, not general region inference. Temporary source and metadata
were removed.

An independently authored Rust 2024 metadata-only composed-loop pair against
this exact toolchain and commit accepted an outer-loop same-origin mutable
reassignment followed by an inner-loop conditional return. Replacing that outer
alias with local storage failed at the nested return with E0515. This is black-
box evidence for that exact composed incoming state, not general nested-loop or
region inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only loop probe against this exact
toolchain and commit accepted a same-origin mutable reborrow assignment before a
direct conditional return. The matching probe that replaced the alias with
function-local storage failed at that return with E0515. This is black-box
evidence for that exact conditional exit after local-origin transfer, not a
general loop fixed point, region inference, or complete Polonius semantics.
Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only conditional-break pair
against this exact toolchain and commit accepted a parameter-backed break even
though the continuing path changed the alias to local storage. Reversing those
states failed at the post-loop tail with E0515. This is black-box evidence for
those exact separated break/backedge outcomes, not general loop or region
inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only break pair against this exact
toolchain and commit accepted a local-initialized mutable alias overwritten by a
parameter before breaking from an unconditional loop. The equivalent condition-
headed loop failed at its tail with E0515 because the zero-iteration path still
referenced local storage. This is black-box evidence for those exact break and
zero-iteration joins, not general loop or region inference. Temporary sources
and metadata were removed.

An independently authored Rust 2024 metadata-only unconditional-loop-return
pair against this exact toolchain and commit accepted a same-origin mutable
reborrow followed by an unreachable reassignment. The matching local-backed
return failed with E0515. This is black-box evidence for that exact terminating
iteration and disconnected suffix, not general loop or region inference.
Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee whose local
alias was directly reassigned through `&mut *alias`, plus a caller that reused the
owner after the returned child's last use. A separate invocation rejected a
competing mutable owner borrow while that child remained live with E0499. This is
black-box evidence for that exact straight-line reassigned-alias shape, not
general interprocedural dataflow or region inference. Temporary sources and
metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee whose local
alias was reassigned through `&mut *alias` in both exhaustive conditional
branches, plus a caller that reused the owner after the returned child's last
use. A separate invocation rejected a competing mutable owner borrow while that
child remained live with E0499. This is black-box evidence for that exact equal-
origin conditional reassignment shape, not general branch dataflow, alias
analysis, or region inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee whose local
alias was repeatedly reassigned through `&mut *alias` in a `while` body, plus a
caller that reused the owner after the returned child's last use. A separate
invocation rejected a competing mutable owner borrow while that child remained
live with E0499. This is black-box evidence for that exact stable-origin loop
shape, not general loop dataflow, alias analysis, or region inference. Temporary
sources and metadata were removed.

An independently authored Rust 2024 metadata-only inner-backedge pair against
this exact toolchain and commit accepted a parameter-backed alias that was
temporarily assigned to local storage and restored to the parameter before the
backedge. The otherwise identical probe without restoration failed at the
conditional return with E0515. This is black-box evidence for exact stable and
changed nested-backedge origins, not a general loop fixed point, path-sensitive
region inference, or complete Polonius semantics. Temporary sources and
metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee that created
an `&mut` alias inside each conditional branch and assigned that branch-local
alias into the returned outer local. The caller could reuse the owner after the
returned child's last use. A separate invocation rejected a competing mutable
owner borrow while that child remained live with E0499. This is black-box
evidence for that exact branch-local alias shape, not arbitrary branch dataflow,
nested projections, or region inference. Temporary sources and metadata were
removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee with a
branch-local alias returned early from one conditional arm and a parameter-
backed alias returned from the tail. The caller could reuse the owner after the
returned child's last use. A separate invocation rejected a competing mutable
owner borrow while that child remained live with E0499. This is black-box
evidence for that exact branch-local early-return shape, not general control-flow
or region inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee whose
`while` body created an iteration-local `&mut` alias and assigned it into the
returned outer local. The caller could reuse the owner after the returned
child's last use. A separate invocation rejected a competing mutable owner
borrow while that child remained live with E0499. This is black-box evidence for
that exact loop-local alias shape, not general loop fixed-point, path-sensitive,
or region analysis. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee whose loop
contained a conditional arm that created a local `&mut` alias and returned it,
an `else` return of the parameter, and a zero-iteration parameter tail. The
caller could reuse the owner after the returned child's last use. A separate
invocation rejected a competing mutable owner borrow while that child remained
live with E0499. This is black-box evidence for that exact loop-arm local-return
shape, not general loop dataflow or region inference. Temporary sources and
metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable-reference forwarding callee whose nested
loop declared a local `&mut` alias and conditionally returned it. The caller
could reuse the owner after the returned child's last use. A separate invocation
rejected a competing mutable owner borrow while that child remained live with
E0499. This is black-box evidence for that exact nested-loop local-return shape,
not a general nested-loop fixed point, path-sensitive analysis, or region
inference. Temporary sources and metadata were removed.

An independently authored conditional shared-call pair selected `&*first` or
`&*second` as the argument to `shared_identity`. This exact toolchain rejected
assignment to either possible owner before a later result use with E0506, then
compiled a companion that copied the result and mutated both owners afterward.
This is exact joined shared-loan evidence, not general path-sensitive regions.
Temporary sources and metadata were removed.

An independently authored conditional shared-call escape pair selected two
shared parameters or selected a parameter and function-local storage before
calling `shared_identity`. This exact toolchain compiled the all-parameter
return and rejected the mixed local return with E0515. This is exact joined
shared-origin escape evidence, not general region inference. Temporary sources
and metadata were removed.

An independently authored `while` pair created a shared identity-call result on
each iteration. This exact toolchain rejected owner mutation followed by a use
of that result with E0506. A companion copied the pointee first, mutated the
owner, and allowed the loop backedge. This is exact non-lexical evidence across
per-iteration reference generations, not a general loop-region fixed point.
Temporary sources and metadata were removed.

A mutable-reference identity-call `while` pair exercised the same generation
boundary. This exact toolchain rejected owner mutation before a later result use
with E0503 and compiled a companion that copied the pointee before mutation and
the loop backedge. This is exact exclusive-loan generation evidence, not a
general loop-region fixed point. Temporary sources and metadata were removed.

A conditional shared-reference identity-call `while` pair selected either of two
mutable owners each iteration. This exact toolchain rejected mutation of either
possible owner before a later result use with E0506 and compiled a companion
that copied the pointee before mutating both owners and taking the loop backedge.
This is exact joined-loan generation evidence, not a general loop-region fixed
point. Temporary sources and metadata were removed.

A nested-`while` companion placed the conditional shared-reference identity call
inside the inner loop. This exact toolchain rejected owner mutation before a
later same-iteration result use with E0506 and compiled the form that copied the
pointee before mutating both owners across the inner backedge. This is exact
nested joined-loan generation evidence, not a general loop-region fixed point.
Temporary sources and metadata were removed.

A mutable-reference return pair exercised nonterminal `if`/`else` assignments
inside a `while`. This exact toolchain compiled stable same-origin reborrows in
both arms and rejected a companion whose conditional fallthrough could replace
the returned alias with function-local storage, reporting E0515. This is exact
bounded loop-arm fallthrough evidence, not general loop dataflow or named-
lifetime inference. Temporary sources and metadata were removed.

A mixed loop-arm pair returned the current parameter-backed alias from one arm
and performed a stable reborrow on the other arm before the backedge. This exact
toolchain compiled that form. It rejected a companion whose fallthrough arm
stored a function-local reference, because a subsequent iteration could take the
returning arm, reporting E0515. This is exact exit-versus-backedge evidence, not
general loop fixed-point or named-lifetime inference. Temporary sources and
metadata were removed.

A terminal loop-arm assignment pair reassigned a mutable-reference local before
return. This exact toolchain compiled the same-origin reborrow and rejected the
companion replacement with function-local storage, reporting E0515 at the
return. This is exact terminal action-to-return evidence, not general loop
dataflow or named-lifetime inference. Temporary sources and metadata were
removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit accepted a mutable scalar reference returned from index
zero of a mutable two-element array-reference parameter. The caller could reuse
that indexed place after the returned child's last use. A separate invocation
rejected a competing mutable borrow of the same indexed place while the child
remained live with E0499. This is black-box evidence for that exact indexed
array-reference shape, not general aggregate or index-sensitive alias analysis.
Temporary sources and metadata were removed.

Projected local-alias probes against the same oracle accepted an array-element
alias, a slice-subslice alias, and owner access after the returned alias's last
use. A live competing array-element borrow was rejected with E0499. MRML's
standalone callee-origin proof additionally rejects an explicit alias annotation
that differs from the declared return type.

A follow-up reassignment probe accepted replacing one `&mut u16` alias with
another indexed `&mut u16` and rejected assigning `&mut u16` into an explicitly
typed `&mut [u16]` alias, then returning it as `&mut u16`, with two E0308
diagnostics. MRML retains the explicit compatibility bit so its standalone
origin proof rejects the same transfer without relying on later codegen.

The inferred form produced the same result: replacing an inferred indexed
`&mut u16` alias with another indexed scalar reference was accepted, while an
inferred `&mut [u16]` alias assigned an indexed `&mut u16` and returned as that
scalar reference was rejected with two E0308 diagnostics.

Bounded local-type-state probes accepted returning an inferred alias that began
at local `u16` storage and was then replaced by an indexed parameter reference,
both directly and after both arms of an `if` replaced it. A separate probe
rejected initializing an explicitly scalar mutable-reference alias from a
mutable subslice with E0308.

A projected mutable-to-shared return probe accepted a callee local declared as
`&mut u16` and returned as `&u16`, plus caller mutation after the result's last
use. The corresponding live caller mutation was rejected with E0503.

The fat-reference variant accepted a mutable subslice passed through mutable
and shared slice locals and returned as `&[u16]`, followed by mutation after its
last indexed use. Mutating the same owner before that indexed use was rejected
with two E0503 diagnostics.

Assignment-direction probes accepted replacing a shared alias with an indexed
mutable reference and rejected assigning a shared reference into a mutable
alias with E0308. MRML performs that check inside callee-origin transfer.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit separately accepted a mutable scalar reference returned
from index zero of a mutable slice-reference parameter, followed by owner reuse
after the child's last use. A separate invocation rejected a live mutable borrow
of the same indexed slice place with E0499 and E0503. This is direct black-box
slice evidence rather than an inference from the fixed-array probe; it does not
establish subslice or disjoint-index alias analysis. Temporary sources and
metadata were removed.

Independent Rust 2024 metadata-only probes against this exact toolchain and
commit accepted mutable slice references returned from `[1..]` of both a mutable
two-element array-reference parameter and a mutable slice-reference parameter,
followed by owner access after the returned subslice's last use. Separate
invocations rejected a live mutable borrow of element one with E0499 in both
cases and E0503 additionally for the slice. This is black-box evidence for those
exact subslice shapes, not general range-disjointness or region inference.
Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against the same exact
toolchain and commit compiled three explicit RAX forms whose output place was
`*target` for `target: &mut u64`: `lateout`, same-place `inout`, and a distinct-
input `inout`. This records black-box acceptance of those exact mutable-
reference dereference shapes only; it does not establish general pointer,
memory-effect, place, register-allocation, or assembly semantics. Temporary
source and metadata were removed.

An independently authored Rust 2024 metadata-only probe against the same exact
toolchain and commit compiled `values[index]` output places for a mutable
`[u64; 2]` and runtime `usize` parameter in explicit RAX `lateout`, same-place
`inout`, and distinct-input `inout` forms. This establishes black-box acceptance
of those exact dynamic-index shapes only, not evaluation order for effectful
index expressions, general place semantics, register allocation, memory effects,
or general assembly. Temporary source and metadata were removed.

A follow-up independently authored Rust 2024 metadata-only probe against that
same exact toolchain and commit compiled explicit RAX `lateout`, same-place
`inout`, and distinct-input `inout` outputs indexed respectively by `index % 2`,
`(index + 1) % 2`, and `index`. This records black-box acceptance of those exact
expression-indexed output shapes only; it does not establish general expression,
evaluation-order, place, register-allocation, memory-effect, or assembly
semantics. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only nested-loop probe against
this exact toolchain and commit accepted a conditional parameter-backed return
followed by a path that temporarily assigned a local reference, restored the
parameter, and returned it. The corresponding probe whose earlier conditional
return was still local-backed failed with E0515 even though the later path
reassigned the alias to the parameter. This is black-box evidence for those
exact source-ordered return prefixes, not a nested-loop fixed point, general
path-sensitive region inference, or complete Polonius semantics. Temporary
sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe on 2026-08-26 against
this exact toolchain and commit rejected mutation through a mutable-reference
parameter after a shared-reference local was assigned from that parameter and
used later, reporting E0506. A conditional shared reference selecting either of
two exact mutable tuple fields rejected direct mutation of the first owner with
E0503. Moving the shared child's last use before the direct parameter mutation
compiled successfully. These are black-box observations for those exact
straight-line and conditional shapes, not evidence of general region behavior.
Temporary probe sources and metadata were removed.

Another independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit formed two successive mutable local reborrows from an
incoming mutable-reference parameter and then a shared grandchild. Directly
mutating the incoming owner while that grandchild was used later failed with
E0503; moving the grandchild's last use before the mutation compiled. This is
black-box evidence for that exact three-level chain, not general region
inference. Temporary probe sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit initialized a mutable parent from one parameter, optionally
reassigned it from a second parameter, and then formed a shared child. Separate
invocations rejected direct mutation of the initializer owner and replacement
owner with E0503 while the child was used later. A control that used the child
before mutating both owners compiled. This is exact black-box evidence for the
bounded conditional join, not general path-sensitive regions. Temporary probe
sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit initialized a mutable parent before a `while`, optionally
reassigned it from a second parameter immediately before `break`, and formed a
shared child after the loop. Separate invocations rejected direct mutation of
the pre-loop and loop-assigned owners with E0503 while the child was used later.
A control used the child before mutating both owners and compiled. This is exact
black-box evidence for the bounded single-exit loop shape, not a general loop
fixed point. Temporary probe sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit passed a mutable-reference parameter through a direct
identity function and through a conditional function whose two returns were the
same parameter. Each returned mutable reference was reborrowed into a shared
child. Direct mutation of the original parameter while the child was used later
failed with E0503 in both cases; moving the child's last use before mutation
compiled. This is exact black-box evidence for those two call shapes, not
general interprocedural regions. Temporary probe sources and metadata were
removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit returned a shared child of a mutable reference obtained
from both a direct identity function and a conditional same-parameter function.
Both parameter-backed caller returns compiled. Equivalent callers that passed a
local into each function and returned its shared child failed with E0515. This
is exact black-box outlives evidence for those call shapes, not general
interprocedural lifetime inference. Temporary probe sources and metadata were
removed.

A follow-up independently authored Rust 2024 metadata-only probe against this
exact toolchain and commit returned the shared child of an exhaustive projected
callee result through an explicit return and a conditional early-return plus
tail-return join. Parameter-backed forms compiled. Matching local-backed forms
failed with E0515 at the explicit and conditional return sites. The oracle-only
callee retained the explicit `'a: 'b` relationship required by tuple-field
replacement. This is evidence for those exact sites, not general
interprocedural lifetime inference. Temporary sources and metadata were removed.

Another independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit returned that projected callee result's shared child from
direct and conditional sites inside `loop` blocks. Both parameter-backed forms
compiled. Matching loop-local forms failed with E0515 at their return sites.
The oracle-only callee retained the explicit `'a: 'b` relationship required by
tuple-field replacement. This is evidence for those exact loop-return shapes,
not a general loop or region fixed point. Temporary sources and metadata were
removed.

A nested-loop follow-up against this exact toolchain and commit compiled an
exhaustive inner return of the projected callee result's shared child when the
second argument was parameter-backed. The matching inner-loop-local argument
failed with E0515 at the conditional return. The oracle-only callee retained
the explicit `'a: 'b` relationship required by tuple-field replacement. This
is evidence for that exact nested terminal shape, not a general loop or region
fixed point. Temporary sources and metadata were removed.

A follow-up invocation compiled the same projected call inside a nonterminal
nested-loop path. On the path that did not return, both mutable-reference
arguments were available for the next iteration through Rust's implicit call-
argument reborrows. This is exact evidence for direct reference places passed to
those reference-typed parameters, not general call coercion or region inference.
Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only unsafe-block set against this
exact toolchain and commit compiled scoped `unchecked_add`, raw-pointer
dereference, write, `add`, `offset_from`, `as_ref_unchecked`, and
`drop_in_place` operations in otherwise safe functions. A control that wrapped
only the pointer value in `unsafe` and dereferenced it afterward failed with
E0133. This records black-box acceptance and lexical containment for those exact
forms only; it does not establish general unsafe statements, traits,
implementations, assembly, provenance, const safety, lint behavior, or other
operations. Temporary sources and metadata were removed.

A separate invocation kept the projected result live and attempted a competing
mutable borrow of the non-origin first argument. This exact toolchain rejected
the second borrow with E0499 because the first argument's call reborrow remained
live through the later result use. Together these probes distinguish returned-
pointer origin from the lifetime of every reference argument loan. Temporary
source and metadata were removed.

Another independently authored invocation passed function-local storage as the
non-origin first argument and a parameter as the returned-origin second
argument, then attempted to return a shared child of the result. This exact
toolchain rejected the return with E0515 because the first argument's loan still
referenced local storage. This is exact evidence that result pointer ancestry
does not erase non-origin argument lifetime constraints. Temporary source and
metadata were removed.

The complementary invocation copied the result pointee, ended the result's last
use, and then mutated the non-origin local. This exact toolchain compiled the
case, confirming non-lexical release rather than permanent consumption of the
local argument. Temporary source and metadata were removed.

An independently authored conditional-argument pair passed the same mutable
parameter from both `if` arms to an identity callee. This exact toolchain
accepted mutation after copying the result pointee and rejected a competing
mutable borrow before the result's later use with E0499. This is exact evidence
for expected-reference reborrows across that conditional join, not general call
coercion or region inference. Temporary sources and metadata were removed.

A distinct-owner follow-up selected the first or second mutable parameter in
the two conditional argument arms. This exact toolchain rejected direct access
to either possible owner before a later result use with E0503, then compiled a
separate case that copied the result and mutated both owners afterward. This is
exact evidence for the joined loan set and its last-use release, not general
path-sensitive regions. Temporary sources and metadata were removed.

An independently authored escape pair returned a shared child of an identity
call whose argument conditionally selected two parameters or selected a
parameter and function-local storage. This exact toolchain compiled the all-
parameter case and rejected the mixed local case with E0515. This is exact
evidence for the bounded conditional call-result origin join, not general
interprocedural region inference. Temporary sources and metadata were removed.

An independently authored scalar `shared_identity(&u16) -> &u16` probe kept the
returned shared reference live across a competing mutable owner borrow. This
exact toolchain rejected the borrow with E0502. A companion copied the pointee
before mutating the owner and compiled successfully. This is exact shared-call
loan-liveness evidence, not general call or region inference. Temporary sources
and metadata were removed.

A shared-call escape pair against this exact toolchain and commit returned a
`shared_identity` result backed by a parameter or by function-local storage.
The parameter case compiled and the local case failed with E0515. This is exact
scalar shared-reference return-outlives evidence, not general lifetime
inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit returned call-derived shared children through an explicit
return and through a conditional early-return plus tail-return path. Both
parameter-backed forms compiled. Equivalent local-backed forms failed with
E0515 at the explicit and conditional return sites. This is exact black-box
evidence for those return shapes, not general region inference. Temporary probe
sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit returned call-derived shared children from direct and
conditional sites inside `loop` blocks. Both parameter-backed forms compiled.
Equivalent loop-local forms failed with E0515. This is exact black-box evidence
for those loop-return shapes, not a general loop or region fixed point.
Temporary probe sources and metadata were removed.

An independently authored Rust 2024 metadata-only probe against this exact
toolchain and commit defined straight-line and exhaustive conditional callees
that initialized a one-element mutable-reference tuple from a first parameter,
replaced its field with a second parameter, and returned that field. Shared
children of both call results compiled when the second argument was parameter-
backed. Equivalent calls supplied with function-local storage failed with E0515
at the shared-child return. The explicit `'a: 'b` relationship needed by the
tuple replacement was part of the oracle-only function signatures. This is
black-box evidence for these exact projected call-return shapes, not general
interprocedural lifetime inference. Temporary probe sources and metadata were
removed.

## Straight-line tuple-field callee-origin follow-up

On 2026-08-26, an independently authored Rust 2024 metadata-only probe against
this exact toolchain and commit accepted a mutable-reference callee that
initialized a one-element tuple field from one parameter, replaced that field
with a second parameter, returned the field, and allowed the second owner to be
reborrowed after the returned child's last use. A separate invocation rejected
a competing mutable borrow of the second owner while that child remained live
with E0499. The oracle rejected with E0515 a superficially similar callee whose
field was initialized from local storage before parameter replacement. MRML
therefore admits only the exact parameter-backed straight-line replacement and
continues to reject the local-backed divergence. Temporary probe sources and
metadata were removed. This is black-box evidence for that bounded shape, not
general aggregate dataflow, conditional joins, loops, or region inference.

An additional independently authored Rust 2024 metadata-only probe against the
same exact toolchain and commit accepted exhaustive conditional arms that each
replaced a one-element mutable-reference tuple field from a first parameter to
the same second parameter. The caller could reborrow the second owner after the
returned child's last use. A separate invocation rejected a competing mutable
borrow of that owner while the child remained live with E0499. Temporary probe
sources and metadata were removed. This records only the exact equal-origin
conditional replacement, not general aggregate dataflow or region inference.

A further independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted a tuple field replaced from a first mutable-
reference parameter to a second before a `while`, then identity-reborrowed from
that field in the loop body. The caller could reborrow the second owner after
the returned child's last use. A separate invocation rejected a competing
mutable borrow while that child remained live with E0499. Temporary probe
sources and metadata were removed. This records only that stable zero/one-
iteration origin shape, not a general loop fixed point or region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted direct return of a one-element tuple field
initialized from a mutable-reference parameter. It also accepted initializing
that field from the parameter before a `while`, identity-reborrowing the field
in the loop, and reborrowing the owner after the returned child's last use. A
separate invocation rejected a competing mutable owner borrow while the direct
returned child remained live with E0499. Temporary sources and metadata were
removed. This records only exact tuple-literal parameter origins, not general
aggregate initialization, loop fixed points, or region inference.

A subsequent independently authored Rust 2024 metadata-only probe against the
same exact toolchain and commit accepted a two-field mutable-reference tuple
whose second element selected the same second parameter in both conditional
arms, then returned that second field. The caller could reuse the second owner
after the returned child's last use. A separate invocation rejected a competing
mutable borrow while the child remained live with E0499. Temporary sources and
metadata were removed. This is exact equal-origin conditional initializer
evidence, not arbitrary aggregate or path-sensitive origin inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted consuming a parameter-initialized tuple
field into an explicitly typed mutable-reference local before return. It also
accepted the corresponding moved alias from an equal-origin conditional second
field and allowed owner reuse after the returned child's last use. A separate
invocation rejected a live competing mutable owner borrow with E0499. Temporary
sources and metadata were removed. This is exact one-move projected-origin
evidence, not general aggregate moves, aliases, or region inference.

A further independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted two successive consuming mutable-reference
locals after a parameter-initialized tuple field. It also accepted one consuming
local after exhaustive equal-origin field assignment and after a stable loop
field self-reborrow, and permitted owner reuse after the returned child's last
use. A separate invocation rejected a competing owner borrow while the two-move
chain result remained live with E0499. Temporary sources and metadata were
removed. This is bounded move-chain evidence, not general alias or region
inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted creating a one-field mutable-reference tuple
inside each exhaustive conditional arm and assigning that field into an outer
alias before return. A separate invocation rejected a live competing borrow of
the shared parameter owner with E0499. A third probe rejected with E0515 a later
local-backed tuple return after those branch-local slots ended. Temporary sources
and metadata were removed. This is exact scoped-origin evidence, not general
lexical-region or alias inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted creating an iteration-local one-field tuple
from an identity reborrow of an outer mutable-reference alias and assigning that
field back into the alias in a `while`. The caller could reuse the owner after
the returned child's last use. Separate invocations rejected a live competing
owner borrow with E0499 and a loop-local tuple borrowing function-local storage
with E0515. Temporary sources and metadata were removed. This is one stable
zero/one-iteration origin join, not general loop or region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted creating a one-field mutable-reference tuple
from a branch-local alias reborrow inside a `while` conditional block, assigning
the field back into that alias, and immediately returning it. The caller could
reuse the owner after the returned child's last use. Separate invocations
rejected a live competing owner borrow with E0499 and a branch tuple borrowing
function-local storage with E0515. Temporary sources and metadata were removed.
This is exact projected assignment before a loop-branch return, not general loop
dataflow, alias, or region inference.

A further independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted the same alias-reborrow tuple-field transfer
inside a nested loop before a conditional return, and accepted owner reuse after
the returned child's last use. Separate invocations rejected a live competing
owner borrow with E0499 and a function-local backing store with E0515. Temporary
sources and metadata were removed. This is nested projected-return evidence, not
nested fixed-point, alias, or region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit assigned one of two explicit mutable-reference tuple
field reborrows into an existing mutable-reference local. Separate invocations
rejected mutation of the first and second possible owners while the selected
child remained live with E0499. A passing invocation for each owner accepted
reuse after the child's last use. Temporary sources and metadata were removed.
This is conditional exact projected-loan evidence, not general path-sensitive
alias or region inference.

A follow-up independently authored Rust 2024 metadata-only probe against the
same exact toolchain and commit overwrote a mutable-reference tuple field before
moving a child from it. The oracle rejected use of the original field owner with
E0503 and a live competing borrow of the replacement owner with E0499. Separate
passing functions used the child first and then reused each owner. Temporary
sources and metadata were removed. This is exact multi-generation tuple-field
evidence, not general aggregate history or region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit created a mutable grandchild reborrow through a child
moved from an exact tuple field. The oracle rejected a competing mutable borrow
of the ultimate parameter owner with E0499 while the grandchild remained live,
and accepted owner reuse after the grandchild's last use. Temporary sources and
metadata were removed. This is bounded projected ancestry evidence, not general
region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit passed an exact tuple-field mutable reborrow through
an identity function and assigned the result into an existing mutable-reference
local. The oracle rejected a competing mutable borrow of the ultimate owner with
E0499 while the assigned child remained live, and accepted owner reuse after its
last use. Temporary sources and metadata were removed. This is exact projected
call-result ancestry evidence, not general call-summary or region inference.

A follow-up independently authored Rust 2024 metadata-only probe against the
same exact toolchain and commit passed a conditional choice between two mutable-
reference tuple fields through the identity call before assigning its result.
The oracle rejected live use of the first and second possible owners with E0503
and accepted reuse of each after the assigned child's last use. Temporary
sources and metadata were removed. This is bounded conditional projected-call
evidence, not general path-sensitive interprocedural region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit passed an exact mutable-reference tuple field to a
shared `read` function while a mutable child reborrowed from that field remained
live. The oracle rejected the overlapping call with E0502 and accepted the call
after the child's last use. Temporary sources and metadata were removed. This is
projected call-scoped invalidation evidence, not general interprocedural regions.

A complementary independently authored Rust 2024 metadata-only probe against
the same exact toolchain and commit passed an exact mutable-reference tuple field
to a mutable `touch` function while a shared child of that field remained live.
The oracle rejected the overlapping call with E0502 and accepted it after the
shared child's last use. Temporary sources and metadata were removed. This is
exact projected mutable-call invalidation evidence, not general regions.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit assigned mutable-reference tuple fields into explicit
shared-reference locals, both directly and through a conditional field choice.
The oracle rejected direct use of the exact owner and each conditional owner
with E0503 while the shared child remained live, and accepted owner reuse after
the child's last use. Temporary sources and metadata were removed. This is exact
mutable-to-shared projected-coercion evidence, not general region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted assigning a parameter-backed tuple field
into an existing mutable-reference local and returning that local. The same
probe accepted an inferred alias initially moved from a local-backed tuple field,
then replaced by a parameter reference before return. The caller could reuse the
projected owner after the returned child's last use. A separate invocation
rejected a live competing owner borrow with E0499. Temporary sources and metadata
were removed. This is exact typed projected-assignment evidence, not general
assignment, alias, or region inference.

Another independently authored Rust 2024 metadata-only probe against the same
exact toolchain and commit accepted assigning the same parameter-backed tuple
field into a root mutable-reference alias in both exhaustive conditional arms.
It also accepted initializing that alias from an identity reborrow of the field
and repeating the same assignment in a `while`, then permitted owner reuse after
the returned child's last use. A separate invocation rejected a live competing
projected-owner borrow with E0499. Temporary sources and metadata were removed.
This is exact equal-origin control-flow evidence, not general alias or region
inference.

An independently authored Rust 2024 metadata-only probe against that same exact
toolchain and commit compiled `asm!("cmp rcx, rcx", in("rcx") value,
options(nomem, nostack))`. This records black-box acceptance of that exact
explicit-RCX input form only; it does not establish other registers, allocation,
effects, or general assembly semantics. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only probe against that same exact
toolchain and commit compiled fixed RDX `in("rdx")`, stored and discarded
`lateout("rdx")`, same-place `inout("rdx")`, and distinct-input
`inout("rdx")` forms. This records black-box acceptance of those five exact
fixed-template forms only; it does not establish other registers, general
allocation, effects, or general assembly semantics. Temporary source and
metadata were removed.

A later independently authored Rust 2024 metadata-only probe against that same
exact toolchain and commit compiled explicit input forms for RSI, RDI, and R8
through R15. A focused follow-up compiled low-register and R15 inputs plus
stored/discarded R15 outputs and same-place/distinct-input R15 inout. A separate
probe invocation rejected RBX because LLVM reserves it, RSP because it is the
stack pointer, and RBP because it is the frame pointer. This is black-box
admission evidence for those exact registers and forms only, not general
register allocation or assembly semantics. Temporary sources and metadata were
removed.

Another independently authored Rust 2024 metadata-only probe against that same
exact toolchain and commit compiled explicit RAX `lateout`, same-place `inout`,
and distinct-input output forms whose destinations indexed a `&mut [u64; 2]`
parameter with a runtime `usize` expression. This records black-box acceptance
of those exact mutable fixed-array-reference output shapes only; it does not
establish general nested-place, borrowing, evaluation-order, register-allocation,
memory-effect, or assembly semantics. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only probe against that same exact
toolchain and commit compiled `asm!("mov rax, 7", lateout("rax") _)`. This
records black-box acceptance of that exact discarded explicit-output form only;
it does not establish other clobbers, register allocation, effects, or general
assembly semantics. Temporary source and metadata were removed.

Another independently authored Rust 2024 metadata-only probe against that same
exact toolchain and commit compiled `asm!("mov rcx, 7", lateout("rcx") value)`
and the corresponding discarded `_` output. This records black-box acceptance
of those exact RCX output forms only; it does not establish other registers,
register allocation, effects, or general assembly semantics. Temporary source
and metadata were removed.

A subsequent independently authored Rust 2024 metadata-only probe against that
same exact toolchain and commit compiled explicit RAX `lateout`, same-place
`inout`, and distinct-input output forms whose destinations indexed a mutable
`[u64]` slice parameter with `index % 2` or `index`. This records black-box
acceptance of those exact mutable-slice output shapes only; it does not establish
general unsized-place, borrowing, evaluation-order, register-allocation, memory-
effect, or assembly semantics. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only probe against that same exact
toolchain and commit compiled `asm!("inc rcx", inout("rcx") value)` and
`asm!("inc rcx", inout("rcx") input => output)`. This records black-box
acceptance of those exact same-place and split explicit-RCX inout forms only; it
does not establish other registers, allocation, effects, or general assembly
semantics. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only direct-continue probe against
this exact toolchain and commit accepted a stable parameter-backed conditional
return before `continue` and reported the following local-backed assignment as
unreachable. This is black-box evidence for that exact terminating suffix and
backedge, not general loop or region inference. Temporary source and metadata
were removed.

An independently authored Rust 2024 metadata-only conditional action-block set
against this exact toolchain and commit accepted exhaustive parameter-backed
terminal break arms and a parameter-backed terminal continue paired with a
fallthrough return. Replacing one break-arm result with local storage failed at
the post-loop tail with E0515. This is black-box evidence for those exact arm
destinations, not general loop or region inference. Temporary sources and
metadata were removed.

An independently authored Rust 2024 metadata-only conditional-continue pair
against this exact toolchain and commit accepted continue and normal-fallthrough
backedges that both restored the same parameter origin. A condition-headed
variant whose fallthrough backedge remained local-backed failed at the tail with
E0515. This is black-box evidence for those exact backedge joins, not general
loop or region inference. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only inline-assembly probe against
this exact toolchain and commit compiled
`asm!("pause", options(nomem, nostack, preserves_flags))` in an unsafe
function. This records black-box acceptance of that exact fixed x86-64 template
and option set only; it does not establish other templates, operands, effects,
register allocation, architectures, or general inline-assembly semantics.
Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only ordinary-assembly pair
against this exact toolchain and commit compiled a safe function containing
`unsafe { asm!("pause", options(nomem, nostack, preserves_flags)); }`. A
control placed the same assembly after a separate unrelated unsafe block and
failed with E0133. This records black-box acceptance and lexical containment for
that exact statement form only; it does not establish multiple-statement unsafe
blocks, nested blocks, arbitrary macros, other templates, general effects, or
general inline-assembly semantics. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only terminal-assembly set against
this exact toolchain and commit compiled safe scoped and unsafe-function forms
of `asm!("int3", options(noreturn, nostack))`, accepted the reversed option
order, and accepted both direct `!` return and never-to-`u64` coercion. A
comparison with a following `42` suffix also compiled while warning that the
suffix was unreachable. MRML deliberately rejects that nonterminal form until
its bounded control-flow representation can model unreachable statement tails;
this is a conservative classified delta, not claimed oracle equivalence.
Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only terminal syscall probe against
this exact toolchain and commit compiled `asm!("int 0x80", ...)` with ordered
RAX, RDI, RSI, RDX, R10, R8, and R9 `u64` inputs and
`options(noreturn, nostack)` in a safe function's unsafe block returning `!`.
This records black-box admission of that exact source form only; it does not
establish runtime interrupt behavior, other operands or options, returning
syscalls, general assembly, or physical kernel evidence. Temporary source and
metadata were removed.

An independently authored Rust 2024 metadata-only returning syscall probe
against this exact toolchain and commit compiled `asm!("int 0x80", ...)` with
RAX same-place `inlateout`, RDI/RSI inputs, RDX split `inlateout` to a named
local, R10/R8/R9 discarded outputs, and `options(nostack)`. This records
black-box admission of that exact ordered operand/output form only; it does not
establish runtime interrupt behavior, arbitrary output places, other options or
register sets, general assembly, or physical kernel evidence. Temporary source
and metadata were removed.

An independently authored Rust 2024 metadata-only terminal halt probe against
this exact toolchain and commit compiled `asm!("cli", "2:", "hlt", "jmp 2b",
options(noreturn, nomem, nostack))` in a safe function's unsafe block returning
`!`. This records black-box admission of that exact template, label, backedge,
and option set only; it does not establish privileged instruction execution,
general labels, multi-template assembly, or physical CPU evidence. Temporary
source and metadata were removed.

An independently authored Rust 2024 metadata-only definite-initialization pair
against this exact toolchain and commit accepted an immutable `let state: u64;`
initialized by a split RDX `inlateout` assembly output and then read after the
assembly. A direct read of an uninitialized `u64` failed with E0381. This is
black-box evidence for those exact declaration, output, and read positions only;
it does not establish general delayed initialization or control-flow joins.
Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only ordinary delayed-
initialization pair against this exact toolchain and commit accepted an
immutable `let value: u64;` followed by direct `value = 42` initialization and
a read. Repeating the direct immutable assignment failed with E0384. This is
black-box evidence for those exact straight-line scalar forms only; it does not
establish conditional joins, loop-carried initialization, projected writes, or
general definite-assignment semantics. Temporary sources and metadata were
removed.

An independently authored Rust 2024 metadata-only conditional delayed-
initialization pair against this exact toolchain and commit accepted an
immutable `u64` initialized in both arms of an `if`/`else` before a post-join
read. Removing the `else` arm failed with E0381 because the binding was possibly
uninitialized. This is black-box evidence for those exact scalar branch and join
positions only; it does not establish nested/general joins, loop-carried
initialization, or complete definite-assignment semantics. Temporary sources
and metadata were removed.

An independently authored Rust 2024 metadata-only primitive delayed-
initialization set against this exact toolchain and commit accepted exhaustive
two-arm initialization followed by a read for `i8`, `bool`, and `char`. This is
black-box evidence for those exact primitive forms only; it does not establish
raw-pointer provenance, reference lifetimes, aggregate initialization, or
loop-carried joins. Temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only raw-pointer delayed-
initialization probe against this exact toolchain and commit accepted an
exhaustive `*const u8` branch initialization followed by `is_null`. This is
black-box evidence for that exact thin-pointer form only; it does not establish
general pointer provenance inference, delayed references, fat pointers,
aggregates, or loop-carried initialization. Temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only delayed-reference set against
this exact toolchain and commit accepted direct first assignment and return of
parameter-backed `&u8` and `&mut u32` locals. The equivalent shared reference
assigned from function-local storage failed with E0515. This is black-box
evidence for those exact thin direct-assignment and return positions only; it
does not establish named lifetime inference, fat references, conditional origin
joins, aggregates, or complete Polonius semantics. Temporary sources and
metadata were removed.

An independently authored Rust 2024 metadata-only conditional delayed-reference
set against this exact toolchain and commit accepted exhaustive parameter-backed
shared and mutable reference assignments before return. A shared case with one
function-local origin failed with E0515, and removing the `else` arm failed with
E0381. This is black-box evidence for those exact structured thin-reference
origins and joins only; it does not establish named lifetimes, arbitrary nested
joins, fat references, or complete Polonius semantics. Temporary sources and
metadata were removed.

An independently authored Rust 2024 metadata-only string-reference delayed-
initialization pair against this exact toolchain and commit accepted direct
assignment of a parameter-backed `&str` local followed by return. A conditional
form without an `else` arm failed with E0381. This is black-box evidence for the
exact direct two-word reference and missing-arm positions only; it does not
establish conditional fat-reference value joins, slices, mutable `str`, or
general fat-pointer semantics. Temporary sources and metadata were removed.

An independently authored Rust 2024 metadata-only conditional string-reference
probe against this exact toolchain and commit accepted exhaustive assignment of
the same parameter-backed `&str` in both arms before return. This is black-box
evidence for that exact conditional two-word reference and origin only; it does
not establish static string-literal emission, distinct-origin fat-reference
joins, slices, mutable `str`, or general fat-pointer semantics. The temporary
source and metadata were removed.

An independently authored Rust 2024 metadata-only string-literal pair against
this exact toolchain and commit accepted conditional `&str` values whose static
arm was either plain `"fallback"` or escaped `"line\nbreak"`, with the other arm
parameter-backed. This is black-box evidence for those exact literal coercion,
static lifetime, and conditional return forms only; it does not establish an
implementation strategy, object format, literal pooling, or MRML escape
decoding. The temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only raw string-literal probe
against this exact toolchain and commit accepted a direct conditional `&str`
return whose static arm was `r##"raw\n"#text"##`. This is black-box evidence
that the backslash and embedded non-closing quote/hash sequence are literal
content under that exact delimiter; it does not establish an implementation
strategy, object format, pooling, byte strings, C strings, or MRML decoding.
The temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only conditional string probe
against this exact toolchain and commit accepted a parameter-backed `&str`
return with nine distinct static string arms and a final parameter arm. This is
black-box evidence for that exact modern lifetime-elided source shape only; it
does not establish an object relocation count, implementation strategy, linker
behavior, or unbounded literal support. The temporary source and metadata were
removed.

An independently authored Rust 2024 metadata-only control against this exact
toolchain and commit rejected a function with only a `u8` input and an elided
`&str` return with E0106, even though every returned value was a static string
literal. Adding one `&str` input made the corresponding conditional forms
eligible for lifetime elision. This is black-box evidence for those exact
signature shapes only; it does not establish named, `'static`, higher-ranked,
or general inferred lifetime semantics. Temporary sources and metadata were
removed.

An independently authored Rust 2024 metadata-only byte-string pair against this
exact toolchain and commit accepted parameter-backed conditional `&[u8]`
returns whose static arm was cooked `b"A\xFF\n"` or raw
`br##"raw\n"#text"##`. This is black-box evidence for those exact literal,
coercion, static-lifetime, and conditional-return forms only; it does not
establish an implementation strategy, object format, pooling, C strings,
general byte expressions, or general lifetime inference. The temporary source
and metadata were removed.

An independently authored Rust 2024 metadata-only byte-character set against
this exact toolchain and commit accepted functions returning `b'A'`,
`b'\xFF'`, and `b'\n'` as `u8`. This is black-box evidence for those exact
literal and return forms only; it does not establish an implementation
strategy, object format, C literals, suffixes, or general constant-expression
semantics. The temporary source and metadata were removed.

An independently authored Rust 2024 metadata-only explicit-static lifetime set
against this exact toolchain and commit accepted a scalar-parameter function
returning either a cooked or raw `&'static str` literal and accepted identity of
an explicitly `&'static str` parameter. A follow-up accepted cooked/raw
`&'static [u8]` literals and identity of an explicitly `&'static u32` input.
Returning an ordinary `&str` or `&u32` parameter with the corresponding static
return failed because the input lifetime does not outlive `'static`. Windows
gnullvm and native Arch Linux produced the same accept/reject results.
This is black-box evidence for those exact signature and return forms only; it
does not establish named lifetime inference, general lifetime subtyping,
higher-ranked lifetimes, or an implementation strategy. Temporary source and
metadata files were removed.

An independently authored Rust 2024 metadata-only C-string set against this
exact toolchain and commit accepted cooked `c"hello\n"` and raw
`cr##"raw\n"#text"##` values returned as `&'static core::ffi::CStr`. A cooked
literal containing `\0` failed because C string literals do not support interior
null characters. Windows gnullvm and native Arch Linux produced the same
accept/reject results. This is black-box evidence for those exact literal and
terminator rules only; it does not establish `CStr` ABI/layout, an implementation
strategy, pointer emission, other methods, or foreign-platform `c_char`
semantics. Temporary source and metadata files were removed.

An independently authored Rust 2024 executable C-string byte-view probe against
this exact Arch toolchain and commit asserted that `c"hello".to_bytes()` equals
`b"hello"` and `c"hello".to_bytes_with_nul()` equals `b"hello\0"`; it compiled
and exited successfully. The same source passed front-end compilation with the
exact Windows gnullvm toolchain, but that host lacked its configured external
linker, so no Windows execution is claimed. This is black-box evidence for
those two exact literal methods and results only; it does not establish general
`CStr` ABI/layout, locals, arguments, conditionals, or implementation strategy.
The temporary source and executable were removed.

A follow-up independently authored Rust 2024 executable against the exact Arch
toolchain asserted lengths 5 and 6 for those views and asserted that the empty
C-string view is empty only when its terminator is excluded. Compilation and
execution succeeded. This extends the black-box evidence only to exact literal
`.len()` and `.is_empty()` observation; it does not establish general `CStr`
transport or implementation strategy. The temporary source and executable were
removed.

An independently authored Rust 2024 executable against the exact Arch
toolchain selected between cooked `c"hello\n".to_bytes()` and raw
`cr##"raw\n"#text"##.to_bytes_with_nul()`. It observed `b"hello\n"` in the
first arm and the raw content plus exactly one trailing NUL in the second arm.
Compilation and execution succeeded. This is black-box evidence for that exact
conditional literal/view behavior only; it does not establish MRML object
relocations, `CStr` ABI transport, or an implementation strategy. The temporary
source and executable were removed.

An independently authored Rust 2024 nested-projection probe against this exact
toolchain and commit returned `&mut values[start..][index]`, mutated the selected
element, observed the exact result, and reused the owner after the returned
reference's last use. It passed Windows gnullvm metadata compilation; that host
lacked its configured external linker, so no Windows oracle execution is
claimed. The exact Arch build executed successfully. A separate live competing-
mutation probe failed with E0503 on both hosts. This is black-box evidence for
that exact `Subslice`-then-`Index` return and liveness shape only; it does not
establish general nested projections, index-sensitive disjointness, or an
implementation strategy. Temporary sources, metadata, and executables were
removed.
