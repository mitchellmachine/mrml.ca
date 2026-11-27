# MRML Rust compiler direction

Production build-tool transition is governed by
[build/BUILD_SYSTEM.md](build/BUILD_SYSTEM.md). Until an exact artifact profile
satisfies its readiness gate, production artifacts use pinned upstream Rust.
Experimental `mrml-rustc` is explicit, never silently falls back, and does not
alter this document's compiler-core priorities.

This document records the durable architectural direction for `mrml-rustc`.
Implementation status remains grounded in current source, tests, and native
evidence; this roadmap does not promote planned work to implemented work.
The concise, commit-addressed recovery state is maintained in
[`compiler/CHECKPOINT.md`](compiler/CHECKPOINT.md); update it after every pushed
compiler milestone.

## Identity and compatibility objective

`mrml-rustc` is an original MRML Rust compiler implementation targeting
contemporary and forward-looking Rust semantics, with MRML-specific security
and systems integration. It is not a Rust-inspired replacement language and it
does not claim complete Rust compatibility.

Rust 2024 is the language floor and an historical architectural baseline, not
the destination. Prefer a modern or future successor semantic over obsolete
edition behavior, historical unsoundness, compiler quirks, or implementation
accidents unless current MRML source or a required conformance dependency needs
the legacy behavior. Do not deliberately diverge from modern Rust merely to be
different. Rust 2015, 2018, and 2021 compatibility, every historical nightly,
diagnostic wording, rustc query/MIR internals, LLVM accidents, ordinary Rust ABI,
and unstable symbol mangling are not standing compatibility obligations.

Observable language semantics are the compatibility target. Stable MRML/native
boundaries remain explicit and versioned. Supporting modern Rust syntax does not
make rustc's unstable native ABI the MRML application ABI.

“Forward-looking” describes the semantic and roadmap direction; it is not an
instruction to replace the workspace manifest with Cargo's experimental
`edition = "future"` value. Keep the workspace on edition 2024 until a newer
named edition is intentionally adopted with a pinned toolchain, complete
workspace migration, and recorded oracle delta. An experimental edition that
requires per-package Cargo feature opt-ins is not a usable clean-install
baseline.

## Reproducible future-Rust oracles

The bootstrap and upgrade chain is:

```text
exact dated rustc nightly
        -> black-box semantic observation
        -> independently authored MRML conformance probe
        -> MRML-owned implementation
        -> differential native verification
```

An installed current nightly is never an oracle merely because it is available.
Each oracle generation records the rustc version, full commit, date, edition and
default behavior, Polonius state, trait-solver state, relevant unstable feature
state, MRML-relevant semantic deltas, and conformance outcome under
`docs/compiler/oracles/`. Preserve the initial
[ORACLE-0001](compiler/oracles/ORACLE-0001.md); the current default build and
behavioral reference is [ORACLE-0004](compiler/oracles/ORACLE-0004.md).

An oracle is a reproducible observation point, not a permanent compatibility
ceiling. To advance it:

1. retain all previous records and pin the candidate nightly exactly;
2. run the existing MRML corpus against both the previous and candidate oracle;
3. classify every difference as intended Rust evolution, bug fix, new feature,
   diagnostic-only change, temporary nightly regression, or unknown;
4. change MRML semantics only deliberately and preserve regression probes for
   accepted changes; and
5. record exact Windows and Linux outcomes without copying upstream compiler
   source or test bodies.

## Feature classification

Every considered upstream or MRML extension has one classification:

- **STABLE** — a normal contemporary compatibility target.
- **NIGHTLY-LIKELY-FUTURE** — actively evaluate and implement when useful and
  semantically mature.
- **EXPERIMENTAL** — observe and probe; do not adopt by default.
- **LEGACY** — implement only for a concrete MRML or conformance dependency.
- **MRML-SPECIFIC** — an independently specified platform/compiler security or
  systems extension.

Experimental syntax is not promoted because it appears in one nightly. Observe,
write a black-box probe when valuable, document the semantics, wait for direction
and stability, and implement only with a recorded justification. Type Alias Impl
Trait and Return Type Notation are **NIGHTLY-LIKELY-FUTURE** research targets;
future implicit default bounds and unsettled implementation/mutability
restrictions remain **EXPERIMENTAL** until their direction is clear. Individual
trait/type-system soundness fixes become **STABLE** compatibility targets once
settled or **NIGHTLY-LIKELY-FUTURE** earlier when their security value and oracle
stability justify adoption. Features with unclear dependencies or no MRML use
are **DEFERRED** roadmap items even when they remain visible as upstream
research.

## Post-Rust-2024 gap analysis

The following classifications describe the current compiler, not the upstream
language as a whole.

| Area | MRML status | Current evidence and important gap |
| --- | --- | --- |
| Rust 2024 semantic changes | **PARTIAL** | The workspace uses edition 2024; the parser accepts required unsafe attributes such as `#[unsafe(no_mangle)]` and a bounded unsafe-function/raw-pointer subset. General edition migration rules, unsafe extern/item rules, temporary lifetime changes, and complete 2024 pattern ergonomics are not implemented. |
| Versioned MRML ABI | **PARTIAL** | The parser recognizes the exact shared-source `#[mrml_abi::export(version = 1)]` facade on an ordinary public function and records a distinct central `FunctionAbi::MrmlV1` identity with an unmangled export name. Unknown versions, duplicates, malformed fields, private/const/naked uses, and explicit-ABI mixing fail closed. A bounded classifier, x86-64 layout, and central System V/Windows call plan define the initial scalar and borrowed-view subset. Machine-code lowering executes one-word parameters/returns, two-word slice/string parameters and returns, and a bounded `u128`/`i128` subset through that plan, with exact dated-rustc differential evidence across register, stack, and direct `rax`/`rdx` return locations. Wide identity, narrowing, widening, same-width casts, closed literals, typed named constants, and bounded typed `const fn` calls with nested calls, checked arithmetic, bitwise operations, shifts with independently typed distances, lazy conditions and sequences, inline const blocks, same-width casts, and multiple typed parameters are covered alongside unary bitwise inversion, checked and strict negation, signed absolute/strict-absolute/unsigned-absolute values, matching-type bitwise binary expressions, checked matching-type addition/subtraction/multiplication, checked binary shifts plus wrapping/strict/unbounded shift methods, signed/unsigned division/remainder, wrapping addition/subtraction/multiplication/division/remainder/negation/absolute value, saturating addition/subtraction/negation/absolute value, rotations, next-power operations, byte-order conversion, bit reversal and isolation, bit-width and population/leading/trailing counts, power-of-two/multiple/sign predicates through explicit scalar casts, equality/inequality, signed/unsigned ordering, lazy conditional values, block sequences, discarded values, bounded inlined helper calls, and typed locals with whole-value, checked arithmetic, shifts, and bitwise assignment; other wide expressions remain fail-closed. Unsupported types, zero-word parameters, linker, dynamic-loader, cross-language, and physical-hardware evidence remain absent. See `docs/compiler/MRML_ABI_V1.md`. |
| Let chains | **NOT IMPLEMENTED** | Boolean short-circuit expressions exist, but `if let`/`while let` chains and their pattern scopes do not. |
| Async closures | **NOT IMPLEMENTED** | There is no async/await, generator, future, or async-closure lowering. |
| Modern borrowing / Polonius | **PARTIAL** | References, explicit and expected-type implicit reborrow ancestry, return coercion-site reborrows, mutable pointee operations, bounded ownership/place/effect facts, fixed-point definite-initialization, direct shared/mutable-loan conflicts, and bounded intermediate-ancestor invalidation across the supported statement/loop CFG exist. Conditional expressions retain bounded program points and canonical nested/sequential edges. General indirect loan identity, regions/outlives reasoning, and complete Polonius-compatible analysis remain unimplemented. |
| Next-generation trait solving | **PARTIAL** | Method-like built-ins remain recognized directly. Allocation-free goals distinguish concrete types, universe-aware inference variables, explicit bounded universal/existential binders, and rigid placeholders. Exact existential goals recover universe-aware substitutions from exact implementation selection. Flat generic and where-clause existential selection use a bounded symbolic unifier to retain concrete constraints and inference equality classes; one fixed root state recursively composes exact, generic, clause, and projection-equality premises. A 64-entry clause database and 16-frame solver separately prove concrete or skolemized implemented-trait premises. Exact and generic associated values normalize bounded projections after implementation proof; generic values may recursively project through a separate 16-frame visited stack. Bounded existential conjunctions compose implemented-trait and projection-equality predicates in one inference state, deferring and retrying ambiguous predicates after other predicates refine that state. Projection-aware existential and concrete proof evaluate projection premises on clauses and generic implementations, including nested projection proof, while legacy environment-free proof entry points fail closed. Rigid proof checks concrete and placeholder-bearing projection predicates, preserves placeholder identity through generic associated values and nested projections, and recursively proves the selected implementation's trait/projection premises under the existing proof and projection bounds. A 64-node acyclic term arena represents projection-bearing goals under both existential and universal top-level binders; universal instantiation creates a fresh placeholder universe before rigid normalization and proof. Universally bound projection-equality predicates and bounded mixed implemented/projection conjunctions use the same premise-aware rigid normalizer and exact placeholder comparison. Fixed nested universal prefixes advance one universe per binder level, retain level-local placeholder identities, and bound both levels and total parameters. A bounded branch forest assigns independent prefixes disjoint universe segments while globally capping branches, predicates, and binder levels. A fixed 64-trait classification enables opt-in coinductive success only when every goal in a repeated rigid cycle is classified coinductive; rigid projection premises remain mandatory before that cycle may succeed, including within nested universal branch forests. In existential proof, the current substitution is reapplied to every cycle goal and coinduction requires every variable to be resolved to a rigid term. An unresolved classified cycle can be deferred within the existing eight-predicate scheduler while a projection equality refines the state, but returns `Cycle` if no sibling makes progress. Ordinary, mixed, and projection-normalization cycles remain explicit. A coherent 64-entry generic-implementation table rejects flat-head overlap, selects one stable implementation for concrete or rigid queries, and recursively proves instantiated premises while preserving placeholder universes. Symmetric admission checks reject exact/generic overlap in either insertion order. The canonical parser accepts bounded traits with positional type parameters and trailing concrete nominal defaults, supertraits, associated types with flat `Self`/parameter/concrete or projection-valued defaults, and up to eight declaration requirements over flat implemented-trait or projection-equality predicates, including implemented-trait bounds and positional-or-mixed associated bindings desugared from declaration type parameters or explicit declaration `where` bounds; unconditional exact facts; concrete and generic conditional implementations with up to eight implemented-trait or projection-equality premises, including implemented-trait bounds and zero-positional-parameter associated bindings desugared from implementation type parameters; concrete projection obligations; flat generic heads whose parameters occur as complete self or argument positions; and projection-valued generic or exact associated types with flat self/argument positions. Declaration requirements substitute `Self`, complete declaration parameters, and concrete nominal types into every exact, generic, or conditional implementation clause; projection requirements resolve stable source-order-independent associated-type identity and substitute their expected type through the same bounded path. Conditional concrete heads, requirement-bearing exact heads, and exact projection-valued implementations lower as zero-parameter clauses and share exact/generic coherence, recursive projection-aware proof, and generic associated-value normalization. Direct supertraits with `Self`, complete child-parameter, concrete nominal arguments, or positional/mixed associated bindings lower as deduplicated inherited premises on generic and conditional implementations; exact child facts instantiate the same indexed arguments while validating generic or conditional parents through the projection-aware proof environment. Distinct instantiations of one parent trait remain separate required goals, while an exact duplicate requirement—including omitted versus explicitly written default arguments—is rejected. Arbitrary nested parameter constructors, inference in source signatures, parameter-dependent or compound defaults, lifetime/const parameters, compound supertrait arguments, compound associated defaults, associated bounds/generics, general projection types, methods, negative/unsafe/default implementations, inferred operation obligations, higher-ranked or `?Sized` supertraits, specialization, general answer composition, and candidate backtracking remain absent. |
| Trait-source delta | **PARTIAL** | The parser and bounded lowering additionally accept trailing `Self` or earlier-parameter defaults such as `trait Pair<T = Self, U = T>` and positional-or-mixed associated bindings on implementation bounds. Omitted defaults recursively materialize the same typed argument tuple used by explicit spelling. Forward/self-referential type-parameter, lifetime/const, and compound defaults remain absent; this row supersedes the narrower default/binding wording in the trait-solving row above. |
| Naked functions / `naked_asm!` | **PARTIAL** | Restricted unsafe zero-parameter C-ABI naked functions directly emit up to eight validated x86-64 instructions: fixed control/system instructions, 64-bit GPR `push`/`pop`, register-indirect `jmp`, register-to-register `mov`, checked signed `push` immediates whose architectural sign extension preserves the requested `i32` value, full-width signed-or-unsigned `mov r64, imm64`, and typed memory forms for 64-bit `mov` loads/stores, indirect `jmp`, `lgdt`, `lidt`, and `invlpg`. Memory addresses admit an optional base GPR, one optional index GPR at scale 1/2/4/8, and a checked signed `i32` displacement; base-less numeric and index-only forms use the conventional SIB no-base disp32 encoding. A bounded two-pass layout resolves numeric local labels `2:` through `9:` and direction-checked `jmp 2f`/`2b` references to checked rel32 displacements; duplicate, missing, and wrong-direction labels fail closed. Oracle-supported trailing `options(raw)` and `options(att_syntax)` markers may appear alone or together; the AT&T path independently parses `%` registers, `$` immediates, source-first moves, `disp(base,index,scale)` addresses including an omitted base, and indirect `*` jumps for the same bounded instruction set. Unsupported or misplaced options and cross-syntax operands fail closed. Up to eight direct external `jmp symbol` or RIP-relative symbolic memory operands (`[rip + symbol]` / `symbol(%rip)`) produce a source-ordered typed relocation collection; the ordinary `MachineCode` API rejects unresolved output, while the source-to-object pipeline emits one ELF64 `.rela.text` and undefined-symbol record per reference with `R_X86_64_PLT32` for branches or `R_X86_64_PC32` for memory, and corresponding COFF `IMAGE_REL_AMD64_REL32` records. A ninth reference and invalid symbol identifiers fail closed. A quote-aware bounded template scanner preserves operand commas, checked numeric parsing rejects malformed/overflowing values, and exact byte tests cover equivalent Intel/AT&T output, mixed and repeated-symbol external objects, signed limits, legacy/extended registers, canonical branches, disp8/disp32 selection, and required SIB/zero-displacement cases while proving no normal prologue or epilogue is inserted. Symbol addends, additional relocation families, additional architectures, and general inline assembly remain absent and fail closed. |
| Modern inline assembly | **PARTIAL** | Ordinary unsafe x86-64 functions may use fixed statement-position templates for `nop` and checked-`u64` explicit RAX `in`, `lateout`, and `inout` forms plus exact RCX `lateout`. One typed output-place representation covers a mutable `u64` local, an exact mutable `u64` tuple field, a constant or supported `usize` expression indexing a mutable `[u64; N]` local, mutable fixed-array reference, or mutable slice, or an exact dereference of a mutable `u64` reference/raw pointer. RAX and RCX `lateout` share the same typed destinations and accept `_` as a discarded explicit output without inventing a language place or ownership effect; RCX values enter the common writeback channel only after the declared instruction. Runtime indexing records expression reads and evaluates the expression once, checks the index against the fixed count or stored slice length, saves it across the fixed operation, and reuses bounded local-array or reference-address selection for load/writeback. Fixed-array-reference places retain ordered `Dereference` and `Index` ownership projections; slice places use their established direct `Index` projection. The place carries base identity, type, bounded projections, and an explicit direct-stack, dynamic-array, dynamic-reference-array, dynamic-slice, or indirect-pointer storage kind through common preanalysis and emission boundaries; shared/immutable or non-`u64` pointees fail closed. Named register-class support includes a single-operand increment and exact two-operand RAX/RCX add with non-aliasing preservation and typed ownership effects. The bounded effect validator supports the documented fixed combinations of `nomem`, `nostack`, `preserves_flags`, `readonly`, and `pure`. Exact `asm!("nop", clobber_abi("C"))` is represented as a typed C-clobber case; the stack-resident statement boundary leaves no register-resident language value live across it. Unknown ABIs and generic outputs combined with a clobber ABI fail closed. Safe functions, invalid destinations/types/operands/placeholders/classes/templates/options, and non-statement forms fail closed. Index expressions outside the existing bounded expression subset, deeper nested projections, three-or-more-operand allocation, other explicit registers/register classes, non-C clobber ABIs, other explicit clobber outputs, actual assembly memory effects beyond exact typed place access, labels, symbols, control flow, additional architectures, and general inline assembly remain absent. |
| Modern inline-assembly delta | **PARTIAL** | Exact statement-position `asm!("pause")`, optionally with the validated `nomem`, `nostack`, and `preserves_flags` set, emits the fixed x86-64 `F3 90` encoding. Operands, clobber ABIs, safe-function use, other architectures, and general inline assembly remain absent; this row supersedes the narrower fixed-template list in the row above. |
| Pointer/provenance APIs | **PARTIAL** | Raw-pointer casts, `addr`, `with_addr`, `expose_provenance`, integer-address reconstruction, offsets, comparisons, alignment, copying, writes, references, and metadata operations have bounded tests. The current scalar machine representation cannot establish a complete provenance/alias model and must not equate equal integer addresses with interchangeable provenance. |
| Modern const features | **PARTIAL** | Bounded deterministic scalar evaluation supports typed constants, const functions, conditionals, loops, locals, assignments, arrays, and many integer operations. General aggregate evaluation, ownership, traits, const safety, statics/layout queries, and contemporary const-trait behavior remain absent. |
| Modern integer APIs | **IMPLEMENTED** for a broad bounded subset | Checked, strict, wrapping, saturating, mixed-sign, endian, bit, logarithm, square-root, midpoint, next-multiple/power, and newer nightly bit-manipulation APIs have original tests and native evidence. This does not imply complete library compatibility. |
| Never-type improvements | **PARTIAL** | Structurally diverging inlined helpers and bounded never-to-supported-result coercion exist. General `!` inference, never parameters, public never ABI, and arbitrary divergence analysis do not. |
| Modern patterns and match | **PARTIAL** | Bounded scalar constant/range/wildcard patterns and limited matches exist. Destructuring, match ergonomics, guards and ownership-sensitive patterns are incomplete. |
| Modern unsafe rules | **PARTIAL** | Unsafe functions gate a bounded unchecked integer/raw-pointer subset and unsupported operations fail closed. General unsafe blocks, unsafe traits/impls, extern rules, assembly, provenance, and complete `unsafe_op_in_unsafe_fn` semantics are absent. |
| Modern unsafe-block delta | **PARTIAL** | A typed bounded `UnsafeBlock` expression now scopes the supported unchecked integer operations, unchecked casts/option extraction, and dangerous scalar raw-pointer dereference, reference conversion, read/write/fill/copy/swap/drop, non-wrapping offset, and pointer-difference operations. Nested blocks and bounded scalar locals are retained through constant, IR, semantic, type, and native-emission consumers. Lexically adjacent operations outside the block fail closed. Unsafe blocks around ordinary assembly statements, general statements, unsupported operations, unsafe traits/implementations, extern rules, complete provenance, and complete `unsafe_op_in_unsafe_fn` semantics remain absent; this row supersedes the general-unsafe-block wording above. |
| Unsafe inline-assembly statement delta | **PARTIAL** | A bounded `ExpressionStatement` now carries an explicit unsafe-context property when the parser recognizes one `unsafe { asm!(...); }` statement, with an optional semicolon after the block. Both read preanalysis and native emission require that property or an unsafe function. Adjacent assembly after an unrelated unsafe block remains unauthorized. Multiple statements in the same unsafe block, nested unsafe assembly blocks, general macro statements, other unsupported assembly, and general statement-block lowering remain absent; this row narrows the assembly limitation in the unsafe-block delta above. |
| Terminal noreturn assembly delta | **PARTIAL** | The parser marks only the final top-level expression statement as terminal. On x86-64, exact `asm!("int3", options(noreturn, nostack))` (with either option order) is admitted only in that position and an unsafe context, emits `CC`, suppresses the ordinary return sequence, and permits `!` function returns or never-to-value coercion. A following unreachable suffix, conditional placement, other templates/options, general never expressions, and broader unreachable-code lowering fail closed. |
| Syscall assembly delta | **PARTIAL** | Exact x86-64 `asm!("int 0x80", ...)` accepts seven ordered `u64` operands in RAX, RDI, RSI, RDX, R10, R8, and R9. The terminal form requires inputs plus exact `noreturn, nostack`; the returning form requires RAX `inlateout`, input or `inlateout` for the remaining registers, mutable named-local or discarded outputs, and exact `nostack`. Inputs are preanalyzed/evaluated left-to-right, all post-interrupt results are preserved before output stores, and unsupported scopes, orderings, types, places, or options fail closed. General output places and other syscall/assembly shapes remain unsupported. |
| Terminal halt-loop assembly delta | **PARTIAL** | Exact x86-64 `asm!("cli", "2:", "hlt", "jmp 2b", options(noreturn, nomem, nostack))` is recognized as one typed terminal form, accepts every option permutation, and emits fixed `FA F4 EB FD` without a return sequence. Unsafe scope and terminal placement are mandatory; altered templates, labels, options, or suffixes fail closed. This is native-object encoding evidence, not physical privileged-instruction execution. |
| Definite scalar initialization delta | **PARTIAL** | Explicit declarations of concrete primitive integers, `bool`, `char`, thin raw pointers, and thin scalar `&T`/`&mut T` references create typed locals and move paths without initialization events. Reads fail until a proven write. A direct ordinary `=` may perform the first write to a mutable or immutable local; the exact returning syscall output remains `u64`-only. Immutable locals reject later writes. Exhaustive bounded conditional-assignment arms may each perform the mutually exclusive first write, and the existing CFG intersection proves the join. Reference first writes retain assignment reborrow generations and participate in bounded return-outlives checking. Fat references, aggregates, loop-carried initialization, projected first writes, and general assembly output places remain unsupported. |
| Modern `no_std` systems features | **PARTIAL** | Dependency-free native code generation covers integers, control flow, arrays, bounded scalar tuples, references, slices, raw pointers, COFF/ELF64, UEFI checks, and NVPTX checks. Up to eight typed x86-64 PC-relative branch-or-data relocations are structurally emitted for both native object formats. General assembly, naked entry-point integration, atomics, SIMD, full ABI/layout, general relocation families, linking, and package compilation remain missing. |

Already implemented post-2024 or forward-looking work should be preserved rather
than reimplemented: unsafe attributes, broad modern integer APIs, modern raw
pointer address/provenance-facing APIs, bounded never coercion, and fixed-capacity
`no_std` compilation. Their documented limits remain binding.

The modern inline-assembly row additionally includes exact explicit RCX
same-place and split `inout` for the fixed `inc rcx` template. These forms reuse
the documented typed output-place and ownership machinery; other explicit
registers, generic allocation, and general assembly remain absent.

It also includes exact explicit RCX `in` for the fixed `cmp rcx, rcx` template.
The input is lowered through the same checked `u64` expression path and moved to
the declared register before the comparison; template/register mismatches fail
closed.

The same typed fixed-register representation now includes RDX across exact
`cmp rdx, rdx` input, `mov rdx, 7` output, and `inc rdx` same-place or split
inout templates. Stored and discarded outputs share the existing destination
rules. This remains bounded template support, not general register allocation.

Fixed explicit-GPR admission now uses one bounded register-code representation
for RAX, RCX, RDX, RSI, RDI, and R8 through R15 across those same `cmp`,
immediate-`mov`, and `inc` template families. Conventional checked REX/ModRM
encoding replaces per-register branches. RBX, RSP, and RBP fail closed, matching
the exact dated oracle; this still does not implement arbitrary templates or
general allocation.

## Ownership and Polonius-direction roadmap

The current borrowed-source AST and fixed-capacity expression arenas are useful
front ends, but the compiler is not yet architecturally ready for sound
Polonius-style checking. References currently lower directly to scalar/fat
runtime representations without an explicit ownership/place/loan IR. Build the
analysis incrementally:

1. define explicit place identities and projections independent of parser text;
2. add initialization and move-path analysis;
3. track shared loans;
4. track mutable loans and invalidation;
5. represent lexical and control-flow loan facts in a bounded CFG;
6. implement reborrow semantics;
7. add flow-sensitive region/outlives reasoning;
8. add independently authored Polonius-compatible accepted/rejected probes;
9. improve bounded diagnostics and source explanations; and
10. optimize fixed-capacity analysis memory and time only after semantics hold.

Study flow-sensitive loan reasoning, region/outlives relationships, borrow
invalidation, reborrowing, mutable aliasing, and control-flow-sensitive lifetime
behavior. Do not copy rustc internals or freeze temporary Polonius Alpha
implementation accidents as MRML language semantics.

The prerequisite refactor is a bounded typed body representation with stable
local/place IDs, projection lists, explicit reads/writes/moves/borrows, and basic
blocks/edges. Assignment targets now retain a source-independent base binding
plus one explicit direct, dereference, index, or numeric tuple-field projection;
index source and spans are captured once, and ambiguous non-numeric tuple
assignment projections fail closed. Runtime typing/emission still rediscovers
type information recursively. Runtime locals now receive checked monotonic IDs
that are not recycled after scope cleanup. Their name, type, mutability, and ID
remain in a fixed 256-entry fact table after the active stack slot is released.
Assignment writes resolve once to a typed local-ID/parameter base plus the
parsed projection before emission and append an ordered fact to a separate
fixed 256-entry table. Runtime identifier loads append `Read` facts to that
same table, including specialized tuple, array, range, and address paths that
bypass the scalar loader; constants do not acquire local/parameter identities.
Facts store up to four source-independent `Dereference`, `Index`, `TupleField`,
or `Subslice` projections. Assignment projections are translated once rather
than retained as parser objects; specialized local tuple-field, element-index,
and local-array range reads retain their actual projection. Validation walks
the list against the type produced by each preceding projection and rejects
holes, invalid type transitions, out-of-range fields, and capacity overflow.
The resolved place also classifies access intent as `Write` or
`ReadModifyWrite`; every supported direct, tuple-field, fixed-array,
reference-array, slice, and dereference assignment family uses that fact to
decide whether the previous value is read. Final emission validates contiguous
local identities, referenced local/parameter types, projection/type shape,
binding mutability, and the absence of holes in the ordered access facts.
Capacity exhaustion and inconsistent internal facts fail explicitly.

Local and access facts now live in a standalone fixed-capacity
`RuntimeBodyFacts` object borrowed by the x86 emitter rather than in its machine-
code state. Before the prologue is emitted, a bounded analysis pass types the
supported leading straight-line local-declaration prefix and assigns each named
binding its stable ID, mutability, type, and translated declaration span. The
pass mirrors the emitter's complete supported declaration order: pre-loop top-
level statements, each parsed loop, then post-loop top-level statements. Within
a loop it retains direct loop locals, copies the active loop environment for
nested-loop and conditional-arm actions, and restores the outer environment for
the next loop. The fact-ID sequence remains monotonic across every discarded
scope, so same-named locals retain distinct identities and later declarations
cannot inherit a scoped ID.
The same traversal now resolves every non-wildcard assignment target represented
by those body forms into a separate fixed 256-entry expectation table containing
stable base identity, projection list, base type, access class, and source span.
Emission consumes each matching expectation at the assignment site while still
appending reads and writes to the existing true emission-order access ledger.
This separation prevents precomputed writes from being reordered ahead of RHS
reads. Missing, reordered, malformed, immutable, or identity-drifted expectations
fail as `InvalidRuntimePlaceFacts`.
The body facts now also contain a fixed 1,360-entry move-path table and 512-entry
initialization-site table. Every supported parameter and named local receives
one dense root path; supported owned tuples immediately add one precisely typed
child path per numbered field. The derived path capacity covers all 256 retained
locals and 16 supported ABI parameters at maximum tuple width. Parameter entry
and successful local-declaration completion are recorded as distinct
initialization origins
with matching type and source span. Final validation requires exact root and
initialization counts, dense IDs, complete local/parameter coverage, empty root
projections, and exact child ordering, parent, base, field projection, and type.
Corruption, missing paired facts, or capacity exhaustion fails closed. These
root sites are structural
prerequisites: arrays remain root-only because the current summary `Index`
projection does not identify a disjoint element. A separate fixed 768-entry
effect ledger now records only contextually proven effects: direct identifier
initialization of a mutable-reference binding is a `Move` on the source root,
and direct root or precise tuple-field assignments become `Write` or
`ReadModifyWrite` after RHS planning. Assignment reads resolving to an exact
root or tuple-field path of a proven `Copy` type transactionally add a `Copy`
effect; an exhausted effect table cannot leave a read without its paired effect.
Validation rejects incompatible types, projected moves in this direct-only
slice, invalid paths, holes, corrupt counts, malformed spans, and capacity
overflow. Exact non-`Copy` roots passed to resolved non-`Copy` parameters or
returned from supported source expressions now record `Move`; transparent
wrappers, sequence tails, and conditional branches preserve that context while
prefixes and conditions retain ordinary value evaluation. Unsupported or
implicit-coercion call/return shapes, dereferences, summary indexes, other
non-`Copy` reads, and indirect borrow shapes remain unclassified rather than
guessed. Direct shared
and mutable borrows of exact roots, including reborrows through a direct
reference root, now record distinct `SharedBorrow` or `MutableBorrow` effects;
an allocation-free derived view can associate the latest matching same-origin
borrow effect with the initialized reference local, giving it a stable loan ID
equal to that initialization's dense index plus the borrower, borrowed path,
kind, and issuance-effect index. This direct issuance identity adds no fact
arena and does not yet claim completeness, loan lifetime, liveness, conflict
enforcement, invalidation, or NLL semantics. The facts do not claim that
unreachable or divergent declarations execute.
A derived fixed 1,280-event ownership order now spans the maximum 512
initializations and 768 effects. Event IDs are assigned at insertion time, so
RHS effects precede the successful initialization of their destination local.
Validation requires the initialization and effect tables to merge into one
dense monotonic sequence without holes, duplicates, inversions, or corrupt
counts. For functions with a complete supported control-flow graph, a fixed
1,360-path state map now consumes this
order and rejects a copy, move, borrow, or read-modify-write of an uninitialized
exact path as `RuntimeUseAfterMove`. Moves clear roots and tuple descendants;
exact writes restore state and child writes recompute tuple-root completeness.
Each event now also retains insertion-time origin: parameter
entry, an exact bounded top-level statement index, a verified final tail, or an
explicit emission-expansion marker for dynamically appended inline-helper
facts. Validation rejects unassigned, out-of-body, or otherwise incompatible
origins. Conditional returns now distinguish indexed condition evaluation,
true-return values, and the final else value. Conditional assignments distinguish
indexed conditions and every indexed branch/else action. A fixed parser-shaped
statement table validates exact branch counts, else presence, and action counts;
forged or mismatched program points fail closed. Complete supported CFGs now
derive a control point for every non-expansion origin without adding a per-event
table: parameter entry, exact top-level or conditional blocks, true/false return
edges for conditional return values, sourced conditional action blocks including
disconnected post-return suffixes, reachable tail-return edges, or an explicit
`Unreachable` point for syntactically retained tails after all-path termination.
Final validation rejects origins whose required block or edge cannot be found.
Loop events retain exact header, operation, conditional-arm/action/terminal,
direct-return, nested-loop-header/action, and ordered nested-control origins.
These map to exact sourced blocks or return edges. Bounded parser operation
counts and exact CFG-source matching reject forged operation, arm, action, and
control coordinates instead of assigning an enclosing block.
Conditional-loop terminal returns in both the primary and else arm now use
return-context preanalysis and the existing exact terminal return edge. This
rejects a loop-local identity-call result while preserving a parameter-backed
result. It does not classify ordinary terminal actions or `break` as returns,
and it does not claim general lifetime solving. Nested-loop unconditional and
conditional return values likewise use return-context preanalysis and their
existing shape-validated ordered control location. Only return controls carry a
`NestedLoopControlValue`; conditions, `break`, `continue`, and ordinary actions
remain outside the exact return-value classification. Local-backed identity-call
results are rejected and parameter-backed controls are preserved.
For complete supported statement/loop CFGs, definite initializedness now uses
a bounded fixed point over exact block and edge events. Two fixed 64-block by
22-word bitset matrices cover all 1,360 move paths; predecessor states meet by
intersection, edge transfers precede joins, and convergence is limited to
`block_count * move_path_count + 1`. Reads are validated only after convergence.
This accepts mutually exclusive early-return moves while rejecting a use after
a move on any continuing join path or loop-exit path. Each expression event now
also retains a fixed-width nested branch path: conditions remain on the parent,
then/else arms append zero/one, and nested arms extend the path up to the parser's
64-level bound. Validation rejects malformed encodings and path state leaking
between expressions. A fixed 1,280-entry table gives every visited conditional
a dense occurrence ID plus its enclosing ownership location, span, parent ID,
and parent path. Events retain the active ID, so sequential conditionals with
the same branch bits and nested conditionals are not conflated. A derived fixed
6,400-entry program-point table now gives each visited expression location a
root and each conditional occurrence explicit condition, then, else, and join
points. Branch traversal records its actual exit: a direct arm exits from its
arm point, while a nested arm exits from the nested join. A sequential
conditional enters from the preceding join. Capacity is preflighted before any
conditional fact mutates, and validation rejects holes, non-dense IDs, wrong
kinds or locations, malformed occurrence references, missing exits, forged
event points, and capacity exhaustion. A second derived fixed 6,400-entry table
records exactly five edges per occurrence: entry to condition, condition to
both arms, and both actual branch exits to the join. Nested joins therefore feed
their enclosing join, while sequential conditionals enter from the preceding
join. Construction preflights the complete edge budget, and validation rejects
holes, count mismatches, substitution, reordering, invalid endpoints, or edges
that disagree with the occurrence facts. Every point's ownership location must
also resolve to an existing statement/loop block, edge, or explicit unreachable
point. The initializedness fixed point does not consume this expression
subgraph as linear control flow. Instead, supported same-location expression
graphs require one root and sink and an exact program point for every event.
A bounded structured traversal processes straight-line edges iteratively,
recurses only through the parser's 64-level conditional nesting bound, meets
then/else states by intersection at each join, and composes the sink state with
the enclosing statement or loop control point. The global 6,400-point capacity
does not allocate a per-point state matrix. Unsupported cross-location or
incomplete expression graphs fail closed as `RuntimeExpressionUnsupported`.
Original accepted/rejected probes preserve initializedness when neither arm
moves a reference and reject its later use when exactly one arm moves it.
Assignment RHS expressions whose root is a discoverable identifier, dereference,
index, tuple field, subslice, transparent wrapper, or sequence tail also reserve
a separate fixed 256-entry read-expectation table. The pass resolves the root
base against the exact active scope and retains its projection list and span.
Emission consumes each expectation through the ordinary identifier-read recorder,
so projected specialized paths and direct identifiers share the identity check.
The typed assignment RHS selects value or move context before traversal. An
exact non-`Copy` root therefore records `Move` before the destination `Write`,
while exact proven-`Copy` paths retain `Copy`; explicit address-taking still
records its borrow effect. Projected non-`Copy` reads, dereferences, summary
indexes, and tuple materialization remain unclassified rather than being
guessed as moves.
For scalar assignment RHS expressions, the pass now recursively visits casts,
type ascriptions, unary wrappers, returns/break values, sequences, binary
operands, and conditional condition/arms in the emitter's exact source order.
A discovered projected place reserves one read without separately reserving its
identifier base. Address-taking follows its specialized lowering rather than
inventing a pointee read. Typed index dispatch now mirrors the distinct lowering
shapes: reference indexes reserve the base and runtime index; constant local-
array indexes reserve one projected element read; runtime local-array indexes
reserve every materialized element read before the runtime index. Method/call
and aggregate families remain outside this slice.
The same bounded visitor now runs for scalar local initializers before the new
binding enters the active environment. Sequential and scoped shadowing therefore
records reads against the previous binding identity; the replacement binding
receives its monotonic ID only after initializer emission. Aggregate initializers
retain their specialized emission-time materialization, except that direct array
literals, single-evaluation array repeats, and tuple
literals now preanalyze their scalar operands in the same order as stack
materialization. Direct identifier-backed array and tuple copies also reserve
the emitter's exact per-element `Index` or numbered `TupleField` projections.
Conditional tuple initializers with direct tuple-literal branches reserve the
condition once followed by both branches' source-ordered scalar operands.
Conditional array initializers with direct array-literal branches instead mirror
the emitter's per-element traversal: condition, then element, else element for
each materialized index.
Sequence-wrapped direct tuple literals plan the prefix once before all tuple
operands, while sequence-wrapped direct array literals plan the prefix before
each element, matching their distinct materializers.
Fat-reference initializers now recursively reserve supported non-call forms:
identifiers, conditional branches, transparent return/break/inline-const
wrappers, sequence prefixes and tails, and range-derived slice/string values.
Range-derived slice and string
initializers reserve their runtime start and end reads before the base read;
local-array bases retain the exact `Subslice` projection. The recursion is
bounded to 64 levels. Call-derived fat-reference initializers also use the same
visitor when every argument is a one-slot scalar, another supported fat
reference, a direct identifier-backed array or tuple, an array literal or
single-evaluation repeat, a direct conditional array with literal branches, a
an array accepted by the bounded recursive element planner, or a supported
literal/conditional/wrapped tuple. The array planner covers identifiers,
contextual defaults, literals, repeats, integer-to-byte arrays, direct and
wrapped array-producing calls, conditionals, transparent return/break/inline-
const wrappers, and nested sequences in the emitter's per-index order. Tuple-
producing calls and their supported whole-value wrappers are planned once.
Prefix expressions and call arguments are reserved left-to-right before
inlined-helper emission; identifier-backed arrays reserve one `Index` read per
element and tuples reserve numbered `TupleField` reads. Direct conditional
arrays repeat condition/then-element/else-element for every index. Supported
sequence-wrapped arrays additionally repeat the prefix before every materialized
element; identifier tails then retain one exact `Index` read per element, while
default tails correctly add no element-place read. Conditions and nested branch
prefixes are likewise repeated for each index. Direct root repeats preserve
their distinct single-evaluation rule. Direct array-producing calls are planned
once, while calls reached through per-element wrappers are planned once per
materialized index. Unsupported aggregate-leaf call arguments remain
emission-time work because their specialized materializers need separate
traversal facts.
Supported direct identifier, range-derived, and recursively conditional fat-
reference explicit returns and final tails now use the same bounded read
preanalysis. Their conditions, runtime endpoints, and bases retain exact source
and emission order on both native ABIs.
The visitor also runs for every supported scalar expression statement at the
top level, in conditional arms, in direct and nested loop actions, and after
loops. Each statement is parsed once and its reads are reserved against the
exact scoped environment in the same order used by emission.
Supported scalar control reads now include top-level conditional-return and
conditional-assignment conditions, conditional and explicit return values,
while-loop heads, direct conditional break/continue/return controls,
conditional loop block/arm conditions and branch-local return values, and the
final scalar tail. Nested-loop blocks mirror the emitter's entry-condition,
action-boundary, and control-order traversal exactly, including interleaved
unconditional returns, conditional breaks, conditional returns, and conditional
continues before each following action. Aggregate/fat values retain specialized
emission-time materialization instead of being misclassified as one scalar read.
Emission must consume every preassigned declaration exactly once. Inlined helper
parameters and later scoped locals append to a checked dynamic tail and cannot
steal a preassigned source identity; mismatches fail as
`InvalidRuntimePlaceFacts`.

The table still covers current runtime emission, including expanded inlined
helper bodies; it is ephemeral compiler state rather than serialized IR.
Expression identifiers still resolve by name before their stable fact is
recorded. A bounded source-independent discovery pass can now peel identifier,
dereference, index, tuple-field, subslice, transparent wrapper, and sequence-tail
syntax into an ordered read-place projection chain. A fifth projection and a
64-level discovery nesting overflow fail explicitly. Direct scalar dereference
emission consumes that discovery and records one projected read instead of an
empty base read. Specialized direct aggregate paths reuse the same recorder.
The discovery is not yet universally consumed by nested emission paths. The
prepass now enumerates every declaration and assignment-target form represented
by the supported runtime body and loop parsers, plus root-place and supported
nested scalar reads of assignment RHS expressions, scalar initializer reads,
supported scalar expression-statement reads, and the supported scalar
condition/control/return/tail paths above.
Supported compound fixed-array index bases now reuse the bounded whole-array
planner before the index read. Non-call fat-reference returns now share bounded
return/break/inline-const, sequence, and conditional recursion between emission
and read preanalysis. Direct and wrapped call-derived fat-reference returns now
validate and preanalyze supported call arguments, then transport the inline
pointer/length result through the explicit System V or Windows return path. It
does not yet preanalyze unsupported compound
array-base materialization, other wrapped or non-literal conditional aggregate
values, wrapped/non-literal conditional-array
and otherwise unsupported aggregate-argument call-derived fat-reference
initializers, method/call families beyond the bounded initializer slice,
unsupported
aggregate returns/tails, or other body reads, or replace name lookup
across the whole body. Expanded
inlined-helper locals still append dynamically. There is not
yet a complete typed body table, array-element paths, complete effect coverage,
move-state enforcement, borrow, or loan model. An initial
fixed-capacity CFG fact table records stable basic-block IDs, exact top-level
statement ranges, reachability, and true/false/unconditional edges to blocks or
function return for straight-line, conditional-return, explicit-return, and tail
flow. Chained conditional returns carry explicit synthetic-branch provenance:
exhaustive chains terminate on the final false edge, while
non-exhaustive chains route it to a top-level continuation block. Conditional
action blocks now carry distinct condition, branch-action, else-action, and join
blocks, including final-return termination and unreachable top-level successors.
Top-level `while` and unconditional loops now add explicit header, operation-
range, exit, return, and backedge facts for ordered simple and conditional
break/continue/return controls. Conditional loop blocks additionally represent
primary, `else if`, and final `else` condition/action provenance, joins, and
arm-specific terminals, including structurally proven exhaustive termination.
Nested loop blocks now carry dedicated entry headers and ordered action/control
provenance, including parser-resolved inner and outer break/continue targets,
conditional returns, entry-condition exits, and divergent backedges without
replaying preceding outer-body operations. The parser's immediately-breaking
nested unit-loop form stays within the enclosing operation range, matching its
existing no-op emitter semantics. Operations after unconditional direct,
conditional-block, or nested-loop terminals now begin disconnected unreachable
blocks; syntactic exits in those suffixes do not make the enclosing continuation
reachable. Conditional-assignment actions after a return likewise occupy
bounded, separately sourced, disconnected unreachable blocks with no incoming
edge; their return or join edge cannot make the enclosing continuation
reachable. This closes the known CFG-suffix gap for runtime forms admitted by
the supported parser. This runtime place/CFG
foundation is therefore an incremental prerequisite, not a claim of ownership
checking.

Complexity assessment for the bounded runtime fact tables:

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

## Modern trait-solver roadmap

The current architecture is not yet suitable for a general modern trait solver.
Built-in operations are matched directly and there is no persistent type/trait
environment or obligation representation. Before adding broad generic syntax,
introduce bounded interned type identities, substitutions, binders, predicates,
and source-independent item identities. Then build an MRML-owned solver around:

1. explicit goals and responses;
2. canonicalization and inference variables;
3. where-clause elaboration;
4. associated-type normalization and projection;
5. higher-ranked reasoning where required;
6. coherence and overlap checks;
7. ambiguity as a first-class outcome;
8. bounded recursive goals; and
9. explicit cycle handling and diagnostics.

Do not design around limitations of rustc's legacy solver or mimic rustc query
internals. The target is intended modern Rust semantics through an independent,
bounded implementation.

## Systems-language and security priorities

Post-2024 systems work should investigate, in dependency order, naked functions
and `naked_asm!`, modern inline assembly, Polonius-direction borrowing, modern
trait solving, new safe integer and const capabilities, strict provenance APIs,
`no_std` improvements, and new ABI/system-programming facilities. Do not repeat
features already supported correctly.

Naked functions are a high-priority **STABLE** target for context switches,
interrupt/trap entry, boot transitions, VMM entry/exit glue, and architecture
stubs. Their implementation requires explicit architecture parsing, operand and
register validation, exact body restrictions, direct instruction/object
emission, and tests proving that no normal prologue/epilogue is inserted. It
must not rely on unspecified backend behavior.

Language capability and application admission are separate. These planned
security profiles are profiles of one Rust language, not different languages:

- **MRML Application Profile:** safe Rust only; unsafe and native unsafe FFI
  prohibited; JIT prohibited; stable MRML service/application ABI; compiler-
  derived security metadata required.
- **MRML System Profile:** audited unsafe, raw pointers, assembly, hardware
  intrinsics, and stable system boundaries allowed where required; security
  metadata required.
- **MRML Compiler/Kernel Profile:** maximum required architecture functionality,
  explicit unsafe boundaries, and the strongest audit requirements.

Preserve the existing unsafe/raw-pointer implementation. Profiles eventually
classify and validate compilation units; they do not delete systems Rust from
the compiler to enforce ordinary application policy.

Compiler-emitted metadata is a long-term **MRML-SPECIFIC** milestone. Candidate
derived fields include `memory_safe_profile`, `unsafe_used`,
`unsafe_region_count`, `native_ffi_used`, `inline_assembly_used`,
`naked_functions_used`, `JIT_required`, `CET_compatible`, `IBT_compatible`,
`shadow_stack_compatible`, target ABI, compiler version, and language profile.
Source files cannot self-assert these properties. The compiler/toolchain derives
or validates them, the loader verifies them, and hardware claims remain absent
until code generation, metadata, loader enforcement, and hardware enforcement
all exist.

Retain the MRML-specific convergence direction:

```text
MRML service source
    -> mrml-rustc under a memory-safe profile
    -> MRML object/executable plus compiler-derived metadata
    -> loader validation
    -> capability namespace assignment
    -> service execution
```

CET, IBT, and shadow-stack work may advance independently of upstream rustc when
technically sound, but compatibility never substitutes for verified executable
properties and hardware enforcement.

## Const and pointer direction

Const evaluation remains bounded and deterministic. Prioritize layouts, kernel
configuration, security metadata, static tables, protocol/device descriptions,
and capability declarations. If an existing capacity is insufficient, redesign
and document the bound; do not silently add unrestricted compile-time execution
or global allocation.

Pointer work tracks modern provenance semantics around addresses, provenance
exposure/reconstruction, casts, offsets, reference creation, reborrowing, and
aliasing. The eventual place/loan model must connect provenance-bearing values
to allocation and capability identities where appropriate. Address equality
alone never proves provenance interchangeability.

The current bounded ownership foundation derives direct loan identities from
existing borrow and initialization facts. It records dereference and projection
uses only for reference locals with a derived direct loan. Across reachable
paths in the validated bounded CFG, live shared loans reject later exact-owner
moves, mutable borrows, writes, or read-modify-writes, while live mutable loans
reject later copies, moves, borrows, writes, or read-modify-writes of the exact
borrowed path. Mutation-through-reference, shared or mutable call reborrows, and
moves of a local reference ancestor additionally inspect bounded intermediate
ancestry. Projected reference paths walk the validated move-path parent chain,
so a containing tuple move overlaps its borrowed field without conflating a
sibling field or a generation-replacing destination write. This is bounded loan
liveness and invalidation, not unrestricted alias tracking, regions, reborrow
completion, or a complete borrow checker.

Inferred direct mutable-reference moves now propagate a single direct loan
origin into the destination local instead of discarding it. Event-decreasing,
fixed-capacity lookup supports chained moves and selects the source binding's
latest direct initialization or assignment generation. The consumed source
still participates in initializedness, while conflicts and last-use restoration
follow the moved destination. For one immediate precise root move, conditional
expression-origin loans now derive one destination fact per existing branch
borrow effect. The facts retain distinct borrowed paths and share only the
destination generation, so a later conflict with either possible owner is
preserved without inventing a conflict with unrelated owners. A source-
generation replacement blocks derivation. The same bounded relation now retains
one fact per origin and move depth through direct root-move chains. Its checked
`initialization_count * effect_count` enumeration and depth-qualified loan IDs
preserve intermediate generations instead of collapsing to the terminal
binding; every hop rechecks precise move/init shape and intervening replacement.
One direct move from a reference-typed field of a directly initialized tuple now
retains the field's exact loan origin. The bounded correlation requires one
validated numeric tuple-field projection, the exact expected borrow-effect count
and order, compatible mutability, and no intervening root or field write. It
refuses ambiguous or malformed shapes rather than guessing. After that field
origin enters a direct local, the existing bounded event-decreasing move lookup
preserves it through later direct root-move chains and selects the latest
assignment generation rather than reviving the field's old owner. The same
correlation may now cross another directly initialized tuple-field source later
in the chain before continuing through direct root moves. Every projected hop
retains the one-step numeric-field, exact effect count/order, matching
mutability, and no-unclassified-replacement requirements. A later move from a
directly reassigned tuple reference field now selects the exact assignment borrow
generation before considering its initialization origin, preserving the new
owner's ancestry without reviving it from older storage. Nested projections,
general aggregate provenance, and general alias/region propagation remain
unimplemented.

Explicit direct mutable reborrows additionally derive their parent loan and
bounded ultimate owner path. A mutable parent is suspended when it is used
before a later child use, restored after the child’s last reachable use, and
owner-path conflicts are checked through the ancestry chain. Shared-to-shared
reborrows preserve compatible shared parent reads. An explicitly typed expected
reference binding from a direct reference identifier creates the corresponding
implicit reborrow, while an inferred mutable-reference binding remains a move.
This does not yet classify every shared-child mutation or general coercion site.
Assignments through a direct mutable-reference borrower now distinguish loan
mutation from compatible loan reads. While a shared child is live, mutation
through its mutable parent is rejected but reads through that parent remain
compatible; mutation after the child's last reachable use is accepted. For an
unconditional top-level explicit-borrow assignment to a mutable
reference binding, the destination write is a new bounded loan generation.
Uses resolve to the latest generation, while a child created before replacement
remains tied to the old generation. Conditional statement reference
replacements now use bounded reaching definitions: a generation remains active
when a bypass path reaches the use and is killed when every reaching path
crosses a replacement. Conflict-to-use queries preserve the same path
correlation instead of combining mutually exclusive events. A child reborrow
issued where multiple parent generations reach recursively preserves every
possible ultimate owner path and applies parent suspension to each active
mutable generation. Direct reference assignments in loop operations,
conditional loop actions, and nested loop actions now use the same bounded
reaching-definition analysis. A possible zero-iteration path retains the
pre-loop generation, while replacement crossed before every exit kills it;
repeated dynamic issuances at one static assignment are represented
conservatively by that assignment's bounded generation identity. A conditional
reference expression used as a direct local initializer or direct assignment
now retains each final branch borrow as an alternative origin sharing the
destination generation event. Nested alternatives remain distinct, sibling
origins do not conflict merely because their fact IDs are ordered, and
sequence-prefix temporaries are excluded from the destination origins.
When that direct destination has an explicit reference type, final conditional
identifier values use the expected shared or mutable reference context and
therefore become reborrows rather than consuming moves. Conditions and sequence
prefixes remain ordinary value evaluation and do not become destination origins.
Direct projected reference places, including numeric tuple fields, now receive
the same expected-reference treatment at explicit typed local initialization and
direct assignment sites. Inferred projected reference bindings remain consuming
moves, preserving partial-move initializedness.
Direct and conditional place arguments passed to a shared or mutable reference
parameter now use that expected reference context when the call result cannot
carry a reference. This models a call-scoped reborrow, rejects conflicts with a
live child, and restores the parent after the call. Calls returning references
remain conservatively move-classified until their result loan can be linked to
the originating argument without shortening its lifetime.
Statement-free reference-returning callees whose direct, transparent-wrapper,
sequence-tail, or conditional result paths all resolve to the same compatible
reference parameter now supply that argument as the destination reference's
bounded loan origin. The relation works for direct local initialization and
direct assignment generations, suspends the argument while the returned child
is live, and restores it afterward. Callees with statements, ambiguous result
parameters, unsupported result expressions, or locally derived references remain
conservative rather than receiving a guessed origin.
The same proof now merges top-level explicit returns, conditional returns,
bounded else-if return chains, exhaustive else values, and a continuing tail.
Every retained result must resolve to the same compatible parameter. Any local,
assignment, expression statement, loop, missing value, parse failure, or differing
origin makes the call result conservative.
Non-direct conditional destinations and indirect reference-value moves remain
unclassified loan origins.
A plain assignment of a direct reference identifier into an existing typed
reference binding now uses the destination type as coercion context and records
a shared or mutable implicit reborrow before the destination write. For mutable
references this preserves parent suspension until the reassigned child’s last
use and restores the parent afterward. Projected, compound, conditional-RHS,
and call-derived assignments retain their existing classifications.

## Roadmap selection

Future GPU compiler work follows [gpu/GPU_ARCHITECTURE.md](gpu/GPU_ARCHITECTURE.md)
only after the current CPU typed-place/CFG/ownership dependency gates. It adds a
safe typed kernel subset, explicit address spaces, High/Machine IR, and metadata
admission without displacing the Polonius-direction critical path.
GPU High IR is evolving compiler/library state, not an early frozen public ABI;
Machine IR remains low-level semantic SSA/address-space/subgroup/matrix/barrier
state, not ordinary-source vendor packets. Stable object ABI, evolving
algorithms, and final vendor emission remain distinct.

Score candidate work by MRML usefulness, modern Rust relevance, security
relevance, dependency unlocks, implementation complexity, oracle stability, and
testability. Prefer high-value dependency unlocks rather than a superficial
upstream test-pass percentage. The major sequence is:

1. preserve and stabilize supported semantics;
2. establish the explicit typed ownership/place/CFG representation;
3. build toward Polonius-style borrowing;
4. build modern trait-solver foundations;
5. fill post-2024 systems-language gaps;
6. add naked functions and architecture-level functionality when prerequisites
   are ready;
7. expand modern const, type, and pattern support required by MRML;
8. enforce application/system/compiler security profiles;
9. emit compiler-derived executable security metadata; and
10. progressively advance the exact future-Rust oracle.

Return coercion-site reborrowing and bounded direct/intermediate reborrow
invalidation are implemented for the documented subset. The first explicit
outlives slice now rejects a supported returned reference unless its active,
event-decreasing ancestry reaches parameter-backed storage. It covers exact
tail, explicit, conditional, and supported loop return-value locations; preserves
latest-generation replacement, cyclic reborrow ancestry, moved parameters, and
exact tuple-field initialization/reassignment origins. Direct shared-reference
copies now retain the same bounded ancestry through successive local bindings;
mutable references remain move-only. Local storage, mismatched mutability, and
unclassified ancestry fail closed. Conditional action-block returns now retain
an exact terminal ownership location and CFG return edge, including direct or
locally stored identity-call results. Reference-typed return `Copy`/`Move`
effects are validated without classifying ordinary value effects as reference
returns. This is not named-lifetime inference, general regions, or complete
Polonius outlives reasoning. The highest-value next major
implementation task is extending this relation across the remaining exact return
and indirect-alias forms, including nested projections and non-tuple aggregate
provenance, without collapsing generation or CFG path distinctions.
Existing loop-result origin proofs do not imply branch-local or loop-local
mutation dataflow or general regions.
Conditional reference reassignment into an exact tuple field now records every
supported branch owner together with the field's replaced initialization owner.
When that field is moved and reborrowed, bounded loan ancestry rejects mutation
of any still-live possible owner and releases the branch owners after the
descendant's last use. The same bounded ancestry retains both replaced owners
across two successive exact field writes. This is exact one-field conditional
and repeated-generation provenance, not path-
sensitive branch selection, nested projections, general aggregate provenance,
or complete Polonius semantics.
Exact returned tuple fields now require every retained origin of their latest
conditional reference-assignment generation to outlive the function. A mixed
parameter/local generation therefore fails closed even when another branch is
parameter-backed, while a generation whose branches all trace to the input is
accepted. This remains one-step tuple-field provenance, not general aggregate
escape analysis or named lifetime inference.
Conditional reference origins created inside an initial tuple value receive the
same all-origins return proof. The bounded grouping follows the exact reference-
field ordinal, distinguishes reference copies/moves from fresh shared or mutable
borrows, and does not let a local-backed sibling field poison a parameter-backed
returned field. Nested conditional groups and nested tuple types remain outside
this implemented slice.
Nested conditional leaves within that field are normalized through their bounded
parent chain to the outer conditional generation. This preserves separation from
later tuple fields while requiring every nested leaf origin to pass the same
outlives proof. Arbitrary expression-origin partitioning remains unimplemented.
At a returned exact tuple field, every CFG-reaching assignment generation and
the original field generation must outlive the function. Mutually exclusive
branch writes are both retained, as are sequential historical owners, matching
modern Rust's projected-field return behavior. Reference-value copy/move RHS
origins and fresh borrow RHS origins are classified separately and boundedly.
Loop-carried projected generations apply the same rule, but only when the write
is reachable from function entry and can reach the exact returned field. This
retains local-backed generations from zero-or-more-iteration loops while
excluding disconnected post-`break` suffix writes.
The same exact-origin set survives a projected field move into a reference local
before return. Direct initialization, conditional initialization, branch-local
assignments, and disconnected loop suffixes therefore retain the same outlives
result through the additional local generation.
Projected mutable tuple-field origins also survive an identity call at the
return boundary and through one stored call result. A local-backed conditional
origin fails outlives validation while all parameter-backed origins remain
accepted, reusing the same call-argument and projected-origin facts.

Bounded callee return-origin inference now also carries a compatible parameter
origin through straight-line plain reassignment of an already-declared mutable
reference local. Each RHS is resolved against the immediately preceding local
origin state, so shadowing and reassignment remain generation-ordered. Immutable,
projected, compound, local-backed, conditional, or otherwise unclassified
assignments keep the callee proof conservative rather than manufacturing an
argument origin.

The same bounded callee proof now evaluates direct mutable-reference local
assignments independently for each `if`/`else if`/`else` outcome and joins the
resulting fixed local-origin states per local. A missing `else` contributes the
unchanged incoming state. Outcomes that retain the same parameter origin keep
that exact origin; differing origins make only the affected local unknown.
Returns, expressions, projected or compound writes, and other unsupported
branch actions fail the proof closed. This is an exact
conditional-assignment join, not general interprocedural CFG or region analysis.

Supported conditional action blocks may now add fixed-capacity branch-local
reference aliases and use those aliases in later direct assignments. Each branch
has its own name/origin/mutability state, shadowing is newest-first within that
branch, and branch-local entries are discarded before only the pre-existing
locals are joined. A local-backed alias makes the affected result unknown rather
than fabricating a parameter origin. This is scoped indirect-alias provenance,
not arbitrary branch expressions, nested projections, or general regions.

A terminal explicit return in such an action block now resolves against that
branch's scoped alias state and contributes its exact parameter origin to the
callee's return merge. Terminal paths are excluded from the subsequent
fallthrough-state join. A local-backed, nonterminal, malformed, or otherwise
unclassified return fails the complete callee proof closed. This covers one
bounded branch-local early-return form, not general control-flow regions.

For a `while` body consisting only of supported direct assignments, callee
return-origin inference now performs one bounded transfer and joins it with the
incoming zero-iteration state. Same-origin reborrows therefore retain their
parameter origin, while any changed origin becomes unknown. Loops mixing these
assignments with control, returns, locals, expressions, nested loops, or other
unsupported operations fail conservative. This exact stable-origin slice is not
general loop fixed-point, path-sensitive, alias, or region analysis.

That stable loop transfer now also permits fixed-capacity loop-local reference
aliases before later direct assignments. Names, origins, and mutability are
scoped to one modeled iteration and discarded before only the pre-loop locals
are joined with the zero-iteration state. Same-parameter origins remain exact;
local-backed or changed origins become unknown. Mixed controls and unsupported
operations still fail conservative. This is scoped loop-local provenance, not a
general loop fixed point or region solver.

Conditional blocks and `else if`/`else` arms inside a supported loop may now
declare fixed-capacity local reference aliases before a terminal return. Each
arm resolves its return against an independent scoped name/origin/mutability
state and merges only the resulting parameter origin with other function exits.
Arm assignments and expressions remain conservative because their loop-carried
fallthrough effects are not modeled. Local-backed returns fail closed. This is
an exact loop-arm early-return form, not general loop dataflow or regions.

Nested loop blocks may likewise carry local-only alias actions into their
supported unconditional or conditional returns. One fixed scoped state is
resolved for the nested block, return origins merge with all other function
exits, and local-backed storage fails closed. Assignments and expressions remain
unsupported because their repeated control-flow effects are not represented.
This is bounded nested-loop return provenance, not a general loop fixed point.

For a scalar-reference return, callee-origin inference now also accepts an exact
indexed place rooted at a compatible array-reference or slice-reference
parameter. The scalar element type must match, a mutable result requires a
mutable parameter, and the place must contain exactly `Index` with at most one
preceding explicit `Dereference`. The result retains the parameter origin for
caller liveness. Identity, mismatched, shared-to-mutable, deeper, and unrelated
projection shapes fail closed. This is the first non-tuple aggregate provenance
slice, not general aggregate or index-sensitive alias analysis.
Both the fixed-array-reference and slice-reference paths now have direct caller
conflict, post-last-use, and exact dated-oracle evidence; slice evidence is not
inferred from the array implementation.

An array-reference or slice-reference parameter may now also retain its origin
through an exact `Subslice` place into a compatible slice-reference result. The
element type and mutability must match and at most one explicit `Dereference`
may precede `Subslice`. Caller preanalysis classifies an unprojected,
unclassified read of a loan-backed fat-reference local as `LoanUse`, so later
indexing keeps the call-result loan live. Scalar `Index` and `Subslice` remain
distinct; mismatched, deeper, and unsupported shapes fail closed.

The exact composed `Subslice` then `Index` place now retains the same parameter
origin when returning a compatible scalar reference. One typed projection
classifier is shared by identity, index, subslice, and composed-subslice-index
callee-origin decisions; at most one leading explicit dereference is accepted.
Native lowering materializes the bounded slice pointer and length once, checks
the range and subsequent index independently, and derives the final element
address without collapsing the two ownership projections. A helper-call
semantic probe mutates three distinct selected elements and verifies every
unselected element remains unchanged. Direct nested-place local initialization
now records one canonical combined borrow fact after its ordered range-bound
reads and before its final index read; emission consumes that same fact once.
Direct and helper-inlined semantic probes produce identical mutations. The
direct probe independently covers both fixed-array and runtime-slice roots,
including Windows' indirect two-word slice-parameter ABI and System V's direct
two-word ABI. Exact `start..end` forms now have the same independent array and
slice execution coverage as `start..`; three nonzero and zero-start selections
verify the chosen element changes while every unselected element is preserved.
Inclusive `start..=end` forms have the same four-path structural coverage and
array/slice execution evidence; selecting the inclusive last element confirms
the checked end increment feeds the subsequent index bound. Repeated subslice
chains and other deeper shapes remain unsupported. This is one exact nested
non-tuple projection, not general place typing, index-sensitive aliasing, or
region inference. The later 1,033-test Windows and Arch suites below execute
the runtime-slice, explicit-end, and inclusive-end extensions on both ABIs.

The semantic harness now isolates both failure edges of that composed place.
One probe supplies a range start beyond the four-element owner; another creates
a valid three-element subslice and indexes exactly at its length. Windows
observes `STATUS_ILLEGAL_INSTRUCTION` in noninteractive child processes and
Linux observes raw `SIGILL` from forked children. Either check returning normally
fails the test. This proves hosted execution of the two existing checked trap
edges only; it is not panic-unwind, source-level panic diagnostic, kernel/VMM,
or physical-machine evidence. Windows and Arch each passed 658 unit, 1
component-interface, 10 conformance, 351 replacement, and 11 semantic-execution
tests (1,031 total).

The inclusive composed-place harness now isolates four additional failure
edges: `end == usize::MAX` before inclusive-end increment, a reversed range, an
inclusive end beyond the four-element owner, and an index exactly equal to the
three-element materialized subslice length. Windows child processes report
`STATUS_ILLEGAL_INSTRUCTION` and Arch forked children report raw `SIGILL` for
every case; normal return or another failure status is rejected. This is hosted
execution of existing checked traps, not panic-unwind, kernel/VMM, or physical-
machine evidence.

The same four inclusive failure edges now execute independently with a
runtime-slice owner. Windows supplies the compiler's indirect pointer/length
descriptor and every child again terminates with `STATUS_ILLEGAL_INSTRUCTION`;
Arch supplies direct System V pointer/length words and every forked child
terminates with raw `SIGILL`. This includes the end-beyond-owner case that reads
the fat reference's runtime length. It is direct evidence for the slice lowering
rather than inference from the fixed-array path. Windows gnullvm and Arch Linux
WSL each passed 658 unit, 1 component-interface, 10 conformance, 351 replacement,
and 13 semantic-execution tests (1,033 total).

One exact repeated-subslice form is now implemented for a direct
`input[first..][second..][index]` reference initializer. The analyzer walks at
most 64 range nodes without allocation, visits inner then outer bounds in source
evaluation order, records one canonical `Subslice`/`Subslice`/`Index` mutable-
borrow place, and visits the final index last. Native emission materializes the
inner pointer and length once, checks the outer range against that saved length,
consumes the temporary fat slice, and then checks and selects the final element.
Three runtime-slice probes mutate only the element selected by both starts on
Windows' indirect slice ABI and System V's direct pointer/length ABI. At that
checkpoint, repeated subslice values without a final scalar index remained fail
closed and produced no object. Windows gnullvm and Arch Linux WSL each passed
659 unit, 1 component-
interface, 10 conformance, 351
replacement, and 13 semantic-execution tests (1,034 total). This does not add
general repeated range values, callee-origin inference for repeated projections,
arbitrary projection depth, or index-sensitive alias reasoning.

The exact repeated-subslice scalar origin now crosses one direct helper return
for both fixed-array and runtime-slice roots. The closed classifier accepts only
`Subslice`/`Subslice`/`Index`, with an optional leading dereference, when the
mutable aggregate and scalar-reference types are compatible. Caller analysis
therefore keeps a competing mutable borrow rejected while the returned reference
remains live and restores access after its last use. Direct and helper-return
fixed-array probes and their runtime-slice counterparts produce the same
single-element mutations on Windows gnullvm and Arch Linux WSL. The initial
helper-return proof was limited to this exact two-subslice shape; it did not add
general projection inference or index-sensitive alias reasoning. Both hosts
passed the same 659
unit, 1 component-interface, 10 conformance, 351 replacement, and 14 semantic-
execution tests (1,035 total).

That repeated-subslice origin also survives one typed mutable-reference local in
the callee before return. The bounded local-origin table maps the alias back to
the aggregate parameter, so the caller preserves the same live-conflict and
last-use behavior. Fixed-array and runtime-slice native probes execute the alias
form on Windows gnullvm and Arch Linux WSL with the same selected-element result.
This is one direct acyclic alias, not arbitrary local dataflow, branching alias
joins, or index-sensitive disjointness. Both hosts again passed the same 1,035-
test compiler gate.

Direct scalar selection now recursively materializes a third bounded subslice
using the same checked pointer/length pair as the two-subslice path. Each layer
consumes its own temporary bounds state before returning one two-word slice to
the next layer; the final index still records and consumes one canonical nested
place. Fixed-array and runtime-slice probes exercise three different accumulated
start combinations and mutate only the expected element on Windows gnullvm and
Arch Linux WSL. At that checkpoint, the corresponding repeated-subslice value
remained unsupported. This was direct recursive lowering evidence at depth
three, not unbounded-depth evidence or general slice-value support. Both hosts
passed the same 1,035-test gate.

Callee-return scalar-origin classification now recognizes the bounded structural
form of an optional leading dereference, one or more contiguous `Subslice`
projections, and exactly one final `Index`. It no longer encodes separate one-
and two-subslice enum cases. Element type and mutability compatibility remain
mandatory, and any intervening index, tuple field, dereference, or other order
stays unclassified. A depth-three helper retains the aggregate parameter origin,
keeps a competing caller borrow rejected while its result is live, and restores
access after last use. Fixed-array and runtime-slice helper probes execute two
dynamic starts, one fixed third start, and a dynamic final index on Windows
gnullvm and Arch Linux WSL; the fixed start keeps the call within the compiler's
existing four-argument subset. This is bounded by the fixed-capacity place
representation, not arbitrary projection inference or index-sensitive alias
reasoning. Both hosts passed the same 1,035-test gate.

A repeated-subslice value can now be materialized directly into a typed local.
Only the repeated-range path receives new analysis: it evaluates every bound
inner-to-outer, records one canonical place containing the complete subslice
chain, and leaves established single-range root-loan facts unchanged. Emission
recursively composes the checked pointer/length pair and records that same place
without appending a scalar `Index`. Fixed-array and runtime-slice probes create
the fat-reference local, index it afterward, and mutate only the expected one of
five elements for three start/index combinations on Windows gnullvm and Arch
Linux WSL. At that checkpoint, returning a repeated-subslice value through a
helper remained unclassified. This was direct/local depth-two slice-value
evidence, not general fat-reference dataflow or arbitrary-depth execution
evidence. Both hosts passed the same 1,035-test gate.

The slice-result branch of the callee classifier now accepts the same optional
leading dereference followed by one or more contiguous `Subslice` projections,
without a final scalar index. Compatible fixed-array and runtime-slice
parameters therefore retain their origin through a repeated-subslice helper
return. Caller analysis rejects a competing mutable borrow while the returned
fat reference remains live and restores access after its last indexed use.
Direct and helper probes produce the same pointer/length-selected mutations for
three cases on Windows gnullvm and Arch Linux WSL. Mixed projection orders,
element mismatches, and shared-to-mutable transfers remain unclassified. This is
bounded aggregate-origin transfer, not index-sensitive disjointness or general
fat-reference dataflow. Both hosts passed the same 1,035-test gate.

That repeated-subslice slice origin also survives one direct typed mutable-slice
local in the callee before return. The bounded local-origin table maps the alias
back to the aggregate parameter, so caller conflict and last-use restoration are
identical to the direct helper form. A runtime-slice native probe executes direct
and aliased helpers for the same three start/index combinations on Windows
gnullvm and Arch Linux WSL with identical selected-element mutations. This is
one acyclic typed alias, not conditional alias joins, reassignment chains,
arbitrary fat-reference dataflow, or general regions. Both hosts passed the same
1,035-test compiler gate.

The same repeated-subslice origin now survives two consecutive typed mutable-
slice locals before return. Each bounded local generation resolves from its
immediately preceding initializer, and caller conflict plus last-use restoration
remain identical to the direct and one-alias forms. The runtime-slice native
probe executes all three forms over the same start/index matrix on Windows
gnullvm and Arch Linux WSL. This is a two-step straight-line transfer, not
arbitrary alias graphs, reassignment, or general fat-reference dataflow.

A shared repeated-subslice may now be returned directly with its shared slice-
parameter origin. Caller analysis rejects a competing mutable borrow while the
shared result is live and restores mutable access after its last read. A native
runtime-slice probe checks three distinct start/index selections without
modifying the input on Windows gnullvm and Arch Linux WSL. This is exact shared
repeated-subslice transfer, not mutable-to-shared local coercion or general
shared-region inference.

Call-origin transfer now attenuates the persistent caller loan to the returned
reference mutability when a helper accepts a mutable slice but returns a shared
slice rooted in that parameter. The callee's inlined body retains its own
bounded mutation checks; only the post-call derived loan becomes shared. A
mutable repeated-subslice local can therefore be reborrowed into a shared local
and returned without producing inconsistent place facts. Caller conflict and
last-read restoration tests cover the result, a shared-to-mutable return remains
rejected, and native probes read three selections without modifying the input on
Windows gnullvm and Arch Linux WSL. This is one exact mutability-attenuating call
boundary, not general variance, lifetime, or interprocedural region inference.

Mutability attenuation now also survives two consecutive typed mutable-slice
locals before the final shared local and return. The bounded local-origin table
retains the same mutable parameter through both acyclic generations, while the
call boundary exposes only the shared result loan. Caller conflict and last-read
restoration tests cover that chain, and a native probe reads three dynamic
repeated-subslice selections without modifying the input on Windows gnullvm and
Arch Linux WSL. This is a fixed straight-line chain, not arbitrary alias graphs,
reassignment, or general region inference.

A mutable slice local may now be reassigned between two repeated subslices of
the same mutable parameter before attenuation to a shared return. The bounded
generation update changes the selected projection while retaining that one
parameter origin; caller conflict and last-read restoration remain enforced. A
straight-line cross-parameter replacement transfers the exact final origin,
while a conditional replacement that can retain either parameter is explicitly
unclassified. Native probes cover three dynamic initial/replacement/index
combinations without modifying the input on Windows gnullvm and Arch Linux WSL.
This is bounded straight-line replacement, not arbitrary alias dataflow,
path-sensitive projection identity, or general region inference.

That mutability attenuation composes with the existing exact two-arm same-origin
conditional merge. A helper may return either of two shared repeated subslices
of one mutable slice parameter; caller analysis retains one shared root loan,
rejects a competing mutation while the result is live, and restores mutable
access after its last read. Native probes cover both branches and boundary
indexes without modifying the input on Windows gnullvm and Arch Linux WSL. This
is bounded composition of two existing analyses, not path-sensitive borrowing,
general coercion, or interprocedural region inference.

An exact two-arm conditional helper may now return different repeated-subslice
values rooted in the same compatible parameter while retaining that one origin.
The existing bounded callee merge requires both arms to resolve to the same
parameter; differing or unknown origins still make the result conservative.
Caller analysis preserves the root loan through either returned fat reference
and restores it after last use. Native probes select distinct branch offsets and
exercise indexes zero and two, mutating four expected targets on Windows gnullvm
and Arch Linux WSL. This is same-origin conditional exit merging, not path-
sensitive ownership, arbitrary branch dataflow, or general interprocedural CFG
regions. Both hosts passed the same 1,035-test compiler gate.

Explicit early returns now preserve that repeated-subslice origin when the
continuing tail returns a distinct fat slice derived from the same mutable
parameter. Caller analysis rejects a competing borrow while either returned
slice remains live and restores the root loan after last use. Native probes
exercise both the early-return and tail paths at two indexes on Windows gnullvm
and Arch Linux WSL. This covers one same-origin early-return join; it is not
general path-sensitive ownership or arbitrary interprocedural CFG analysis.

The same exact early-return join now composes with mutability attenuation when
both exits return shared repeated subslices of one mutable slice parameter. The
caller retains one shared root loan across either result, rejects mutation while
that result is live, and restores mutable access after its last read. Native
probes exercise both the explicit-return and continuing-tail paths at boundary
indexes without modifying the input on Windows gnullvm and Arch Linux WSL. This
does not add general return coercion, path-sensitive borrowing, or lifetime
inference.

The repeated-subslice semantic harness now isolates all four checked failure
layers at depth three. An inner start beyond the runtime owner length, second-
and third-layer starts beyond their independently saved input lengths, and a
final index exactly equal to the three-times-reduced length each terminate
Windows child processes with
`STATUS_ILLEGAL_INSTRUCTION` and Arch forked children with raw `SIGILL`.
Normal return and other failure statuses are rejected. Windows gnullvm and Arch
Linux WSL each passed 659 unit, 1 component-interface, 10 conformance, 351
replacement, and 14 semantic-execution tests (1,035 total). This is hosted trap
evidence for the runtime-slice path, not panic-unwind, kernel/VMM, or physical-
machine evidence.

Patent review: `NOT_TRIGGERED`; these increments add execution coverage and a
bounded provenance classifier for an already implemented bounded place, range,
and ABI contract plus fixed-capacity
read ordering and stack materialization for one exact compiler lowering, rather
than a novel mechanism.
See [`patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Projected array-element and slice-subslice origins now survive one direct local
alias in the callee. An explicit alias annotation must independently equal the
declared return type before the alias receives an origin; inferred aliases keep
the already compatible initializer result. This applies to every currently
modeled local scope. Mismatched annotations fail conservative.

That explicit compatibility is retained as bounded local state, so a later
plain assignment cannot revive an origin for a local whose declared type is
incompatible with the call return. Straight-line, conditional-action, loop-
local, and conditional-loop scopes carry the same bit alongside origin and
mutability state. This is type-gated provenance transfer, not general local
type inference.

For an inferred local, the compatibility bit is set only when its initializer
already produced a compatible parameter origin. An originless inferred local
therefore cannot later acquire an origin through assignment; this deliberately
fails conservative until callee-origin inference carries a complete bounded
local type environment.

The callee proof now carries a fixed local type array alongside names, origins,
mutability, and return compatibility. Exact annotations and bounded inferred
reference expressions share the canonical projection/type walker; address-of,
index, subslice, identifier, transparent wrapper, sequence tail, and equal-type
conditional forms are supported. This permits a local-backed inferred alias to
be replaced by a compatible parameter-backed reference in straight-line or
complete conditional flow. Reference annotations and ascriptions must match
their initializer evidence. Unsupported inference remains unknown.

Callee-local compatibility now uses the canonical directional reference
relation, permitting mutable-to-shared coercion while still rejecting shared-
to-mutable transfer. A shared destination loan may derive from the callee call's
mutable argument borrow, but its retained loan kind is attenuated to shared.
Live caller mutation conflicts with that shared result; mutation after its last
use succeeds.

The same attenuation is now independently exercised for two-word slice
references through a mutable subslice local and a second shared local alias.
Indexing the returned shared slice keeps its originating loan live; this is
direct fat-reference evidence rather than an inference from thin elements.

Plain callee-local assignment now also derives the RHS reference type and
checks it against the retained local type before updating origin state. The
directional rule permits mutable-to-shared assignment and rejects shared-to-
mutable assignment even when the function's return itself is shared.

A bounded projected-callee-origin state now provides the dependency for
projected local assignment transfer. Each entry keys a stable local index and
validated nonempty projection, retains the canonical final type, parameter
origin, and monotonic generation, and consumes fixed capacity. Branch
intersection retains only identical typed origins and the maximum observed
generation. Assignment, conditional, stable-loop, and exact tuple-literal
initializer transfers are connected only through the bounded rules below.

The first transfer integration admits one exact straight-line numeric tuple-
field assignment on a mutable local. It validates the assignment RHS against
the field type, records or replaces the field's parameter origin, clears a
previous field origin when the RHS is local-backed, and consults that exact
field state on return. Non-tuple projections retain their established root-
origin behavior. ORACLE-0002 accepts replacing a
field initialized from one mutable-reference parameter with a second parameter,
accepts owner reuse after the returned child's last use, and rejects a competing
borrow of the second parameter while the child remains live with E0499. It
rejects the superficially similar local-backed initialization-and-replacement
shape with E0515, so MRML does not admit that divergence.

Exhaustive conditional assignment now forks that projected state per arm and
intersects only fallthrough outcomes. An identical typed field origin survives;
a differing origin or a missing `else` that preserves the incoming generation
clears the joined evidence. Return-only arms do not contaminate post-conditional
state. ORACLE-0002 accepts the exact both-arm replacement from a first mutable-
reference parameter to a second, accepts reuse after last use, and rejects a
live competing borrow of the second owner with E0499. Projected loop writes are
handled only by the separately bounded stable-loop rule below.

Stable projected loop transfer is now bounded to an incoming field origin that
already exists before the loop. One modeled iteration may reborrow that same
field through an identity dereference; the post-loop state is the intersection
of the zero-iteration incoming state and the iteration state. A changed or
unclassified iteration origin therefore fails closed. ORACLE-0002 accepts the
exact pre-loop replacement plus loop-carried self-reborrow, accepts owner reuse
after last use, and rejects a live competing borrow with E0499. This is not
general loop fixed-point or region inference.

Exact typed tuple-literal initialization now seeds projected origin state before
the local becomes visible. Each reference field is checked against its declared
tuple element type and the function return type, and only a parameter-backed
initializer records an origin. Scalar fields and local-backed references do not
manufacture evidence; mismatched or over-capacity state fails closed. The same
rule is used for top-level, conditional-action, conditional-loop, and loop-body
locals. ORACLE-0002 accepts direct field return and a loop-carried identity
reborrow from an initialized parameter field, accepts owner reuse after last
use, and rejects a live competing owner borrow with E0499.

The same initializer transfer covers multiple tuple fields independently and
joins a conditional element only when both expression arms resolve to the same
parameter origin. A differing-origin element remains unknown rather than
borrowing authority from a sibling field. ORACLE-0002 accepts the equal-second-
parameter conditional element, permits reuse after last use, and rejects a live
competing borrow of that second owner with E0499.

An initialized tuple-field origin now survives one consuming move into an
explicitly typed reference local before return. This includes the equal-origin
conditional multi-field initializer. The projected-initializer hook is neutral
for non-tuple or unavailable local types, so it cannot invalidate an otherwise
proved direct alias; malformed tuple initialization still fails closed.
ORACLE-0002 accepts the direct and conditional moved-alias forms, permits owner
reuse after last use, and rejects a live competing borrow with E0499.

Projected origins now have exact evidence through two successive consuming
reference-local moves and through one move after either an exhaustive equal-
origin conditional field assignment or a stable loop field reborrow. Each local
generation carries the same parameter origin without collapsing the preceding
projected/control-flow proof. ORACLE-0002 accepts all three forms, permits owner
reuse after last use, and rejects the live move-chain competitor with E0499.

The bounded reference-type walker now derives the exact type of a numeric tuple-
field RHS. A compatible projected field can therefore replace an existing root
reference alias while carrying its field origin; a local-backed projected RHS
clears the alias origin. Inferred local-backed aliases remain eligible for a
later compatible parameter replacement, matching ORACLE-0002 rather than using
initializer origin as a false type gate. The oracle accepts both replacement
forms, permits owner reuse after last use, and rejects a live competing borrow
of the projected owner with E0499.

Projected tuple-field RHS typing now composes with root-alias control-flow joins.
Exhaustive conditional arms that assign the same field origin retain it, while a
missing arm joins against the prior alias and becomes unknown when origins differ.
A stable loop reborrows the same projected field into the alias and intersects
that iteration with the zero-iteration incoming origin; a differing incoming
alias fails closed. ORACLE-0002 accepts the equal-origin conditional and loop
forms, permits owner reuse after last use, and rejects a live competing projected-
owner borrow with E0499.

Conditional action blocks may now create a branch-local typed tuple and assign
its exact field into an outer root alias. Projected state is trimmed back to the
pre-branch local-index prefix before fallthrough outcomes join, preventing a
later local from inheriting stale provenance when it reuses a bounded slot.
ORACLE-0002 accepts equal-origin branch-local transfers, rejects a live competing
owner borrow with E0499, and rejects a later local-backed tuple return with E0515.

A supported loop body may now create an iteration-local typed tuple from an
outer alias reborrow and assign its field back into that alias. The one-iteration
origin joins exactly with the zero-iteration incoming owner, while a local-backed
iteration becomes unknown. Loop-local projected entries disappear through the
existing incoming-state intersection. ORACLE-0002 accepts the stable form,
rejects a live competing owner borrow with E0499, and rejects the local-backed
iteration with E0515.

Conditional blocks inside a supported loop may now transfer an exact typed
tuple field into a branch-local mutable-reference alias before an immediate
return. Only a discovered tuple-field RHS enters this bounded action path;
ordinary assignments and expression statements remain conservative. The return
origin must still agree with every other reachable return and the loop tail.
ORACLE-0002 accepts the parameter-backed reborrow and post-last-use owner reuse,
rejects a live competing owner borrow with E0499, and rejects a local-backed
field return with E0515. This is not general loop dataflow or region inference.

The same exact tuple-field assignment rule is now covered in a nested loop block
before a conditional return. The nested return retains the parameter origin,
post-last-use owner access succeeds, a live competitor fails with E0499, and a
local-backed field fails with E0515. Nested fixed-point and region inference
remain unsupported.

Conditional assignment from two exact mutable-reference tuple fields now keeps
each branch field's recorded owner in the bounded loan-ancestry walk. A later
mutation of either possible owner conflicts while the assigned child remains
live, and either owner is available after the child's last use. The ancestry
step follows only exact tuple-field initializer and reassignment generations;
unknown projections remain conservative. ORACLE-0002 accepts both restoration
controls and rejects both live competitors with E0499. This is not general
path-sensitive alias or region inference.

When an exact tuple reference field is overwritten before a child is moved from
it, that child now retains the initializer owner and every recorded intermediate
and latest field owner. This matches the dated oracle: the original owner fails
with E0503 and the replacement owner fails with E0499 while the child remains
live, while both owners are available after its last use. The traversal remains
bounded by the existing effect and initialization capacities.

A mutable grandchild reborrow through an exact tuple-field child now has focused
evidence that the ancestry walk reaches the field's ultimate parameter owner.
The owner conflicts while the grandchild remains live and is restored after its
last use. ORACLE-0002 accepts the restoration control and rejects the live
competitor with E0499. This is bounded projected ancestry, not general regions.

A call-derived mutable reference assigned into an existing local now has focused
ancestry evidence when the call's exact returned parameter argument is a tuple
field. The call-scoped reborrow, destination generation, field origin, and
ultimate owner remain connected: a live owner competitor fails with E0499 and
owner reuse after the returned child's last use succeeds. Unsupported callees
and unclassified projected arguments remain conservative.

The same exact call-result assignment now preserves both possible owners when
the identity call receives a conditional choice between two tuple fields. A live
use of either owner conflicts, and each owner is restored after the assigned
child's last use. ORACLE-0002 reports E0503 for both live-owner controls and
accepts both restoration controls. This remains a bounded call summary and
conditional-expression relation, not general interprocedural regions.

A shared call through an exact tuple-field parent now has focused invalidation
evidence against a live mutable child reborrowed from that field. ORACLE-0002
rejects the overlapping call with E0502 and accepts the same call after the
child’s last use. The existing call parameter type supplies the shared-reborrow
context; unknown calls remain conservative.

The complementary mutable call through an exact tuple-field parent now has
focused invalidation evidence against a live shared child. ORACLE-0002 rejects
the overlap with E0502 and accepts the mutable call after the shared child's last
use. Together these slices cover exact shared/mutable call conflicts through a
tuple field, not arbitrary projected call arguments or regions.

Mutable-to-shared assignment coercion now has exact and conditional tuple-field
ancestry evidence. An explicit shared-reference destination borrows rather than
moves each mutable field source, protects every possible owner against a live
competing mutable reborrow, and releases those owners after the shared child's
last use. ORACLE-0002 rejects the corresponding direct owner uses with E0503 and
accepts the post-last-use controls. General coercion sites remain partial.

Dereference mutation through an incoming mutable-reference parameter now emits
the same bounded loan-mutation fact already used for a proven local reference
loan. A shared reference assigned directly from that parameter, from its exact
tuple field, or from a conditional choice of two exact tuple fields therefore
blocks direct mutation of every possible live owner until the shared child's
last use. ORACLE-0002 rejects the direct parameter case with E0506, rejects the
conditional projected case with E0503, and accepts the post-last-use control.
This is parameter-root invalidation for the existing bounded place model, not
general region inference.

The same parameter-root invalidation is now proven through two successive
mutable local reborrows followed by a shared grandchild. Direct owner mutation
while the grandchild remains live fails, and the owner is restored after the
grandchild's last use. ORACLE-0002 rejects the live case with E0503 and accepts
the restoration control. This adds exact multi-level evidence to the existing
bounded ancestry walk; it does not make the walk an unbounded region solver.

Conditional reference-generation joins now have direct owner-mutation evidence
for a shared child borrowed after an optional mutable-parent reassignment. Both
the initial owner and the branch replacement owner remain protected until the
child's last use, then both are restored. ORACLE-0002 rejects each live-owner
mutation with E0503 and accepts the combined restoration control. This is a
bounded reaching-definition join, not path-sensitive region selection.

The equivalent single-exit loop-carried join now has direct mutation evidence
for both the pre-loop owner and the owner assigned before `break`. Both remain
protected while a shared child formed after the loop is live and are restored
after its last use. ORACLE-0002 rejects both overlaps with E0503 and accepts the
combined restoration control. General loop fixed points remain unsupported.

Bounded call-result origins now have direct owner-mutation evidence through an
additional shared child. Both the exact identity summary and the conditional
same-parameter return summary protect the original parameter until the child's
last use. ORACLE-0002 rejects both overlaps with E0503 and accepts both controls.
Unknown call results remain conservative; this is not general interprocedural
region inference.

Return-outlives validation now has focused evidence for a shared child derived
from those same mutable call results. Identity and conditional same-parameter
results preserve their parameter origin through mutable-to-shared reborrow and
return, while identical local-backed results fail closed. ORACLE-0002 accepts
both parameter-backed returns and rejects both local escapes with E0515. General
interprocedural lifetime inference remains unsupported.

The same call-derived shared-child outlives proof now covers explicit returns
and a conditional early-return plus tail-return join. Parameter-backed children
remain accepted at every site, while the matching local-backed sites fail
closed. ORACLE-0002 accepts both parameter forms and reports E0515 for both
local escapes. This is bounded return-site coverage, not general regions.

Loop-contained direct and conditional returns now retain the same call-derived
shared-child origin. Parameter-backed identity and same-parameter conditional
results return successfully, while the equivalent loop-local children fail
closed. ORACLE-0002 accepts both parameter forms and reports E0515 for both
local escapes. This remains bounded loop-return evidence, not a fixed point.

Projected callee summaries now carry their proven second-parameter origin
through a shared child of the returned mutable reference. Straight-line tuple-
field replacement and exhaustive conditional tuple-field replacement accept a
parameter-backed second argument; substituting function-local storage for that
argument fails the caller's return-outlives check. ORACLE-0002 accepts both
parameter cases and rejects both local escapes with E0515. This composes the
existing bounded callee-origin and shared-child analyses; general
interprocedural lifetime inference remains unsupported.

The same projected-summary proof now covers explicit returns and a conditional
early-return plus tail-return join. Parameter-backed children remain accepted;
matching local-backed children fail closed. ORACLE-0002 reports E0515 at both
local return sites. This is bounded return-site composition, not general
interprocedural lifetime inference.

Projected callee-summary shared children now also retain that proven origin at
direct and conditional return sites inside supported `loop` blocks. Parameter-
backed second arguments remain valid, while equivalent loop-local second
arguments fail closed. ORACLE-0002 accepts both parameter forms and reports
E0515 for both local escapes. This is bounded loop-return composition, not a
general loop or region fixed point.

Nested supported `loop` returns now preserve the same projected-summary shared-
child origin. Direct reference places passed to reference-typed parameters use
implicit reborrow effects. For a reference-returning call, every reference
argument loan remains live with the result, while the independently proven
origin parameter alone supplies the returned pointer ancestry. This permits the
oracle-accepted backedge after the result dies and rejects a competing borrow of
a non-origin argument while the result remains live. Matching inner-loop-local
origins still fail closed with E0515. A local-backed non-origin argument also
prevents returning the otherwise parameter-origin result, matching the pinned
oracle's E0515 and keeping loan lifetime distinct from pointer ancestry.
After the result's last use, the same non-origin local loan ends and local
mutation is accepted, matching the pinned oracle's non-lexical lifetime.
Conditional reference arguments now inherit the call parameter's expected
reborrow context in both arms: a live result blocks a competing owner borrow,
and last use releases the joined loan. ORACLE-0002 matches with E0499 and an
accepted post-use mutation respectively.
Distinct-owner branches preserve both possible loans at the join: live-result
access to either owner fails, while both owners become available after last use.
ORACLE-0002 matches with E0503 for each live access and accepts both post-use
mutations.
Returning a shared child through the same conditional call join accepts an all-
parameter origin set and fails closed when either arm is local-backed.
ORACLE-0002 accepts the former and rejects the latter with E0515.
Scalar shared-reference call parameters and results now exercise the same
bounded loan model. A live shared result blocks owner mutation, while last use
releases the loan; ORACLE-0002 matches with E0502 and acceptance respectively.
Shared-call escape analysis accepts a parameter-backed identity result and
rejects a local-backed result with the bounded outlives diagnostic, matching
ORACLE-0002 E0515. The new focused unit brings each host to 989 compiler tests.
Conditional shared-call arguments retain both possible immutable owner loans at
the join. Mutation of either owner fails while the result is live and succeeds
after last use; ORACLE-0002 matches with E0506 and acceptance respectively.
The same shared conditional join now participates in function-return outlives:
all-parameter arms pass, while a parameter/local pair fails closed. ORACLE-0002
accepts the former and rejects the latter with E0515.
Loop-carried loan reachability now treats a borrower reinitialization as a new
dynamic generation. A later static use reached only after wrapping past that
generation cannot keep the prior iteration's loan alive. Shared-call mutation
before a same-iteration use still fails; copying first releases the loan before
mutation and the backedge. ORACLE-0002 matches with E0506 and acceptance.
The same per-iteration generation rule now has mutable-reference call evidence:
mutation before a later result use fails, while copying first releases the
exclusive loan before mutation and the backedge. ORACLE-0002 matches with E0503
and acceptance.
Conditional shared-call origins now retain the same loop-generation boundary for
both possible owners. Mutating either candidate before a later result use fails,
while copying first permits mutation of both owners and the backedge. ORACLE-0002
matches with E0506 and acceptance.
Nested `while` control flow now retains that conditional shared-call generation
boundary at the inner backedge. A live same-iteration result still protects the
selected owner, while copying first permits both owner mutations across the
inner and outer loop structure. ORACLE-0002 matches with E0506 and acceptance.
The bounded callee-origin transfer now joins nonterminal conditional arms inside
a supported `while` iteration, includes an implicit fallthrough path when there
is no final `else`, and then intersects the joined iteration with the zero-
iteration state. Direct assignments to existing reference aliases are admitted
on modeled fallthrough and terminal-return arms; break, continue, expressions,
and nested-loop paths retain their prior fail-closed restrictions. ORACLE-0002
accepts stable reborrows and rejects a local-backed arm with E0515.
That transfer now also separates mixed terminal and fallthrough arms. A supported
`return` contributes only function-exit origin evidence, while nonterminal arms
alone join into the iteration/backedge state; the zero-iteration path remains
mandatory. A terminal arm now resolves direct alias assignments before its
return origin; local-backed replacements fail closed. ORACLE-0002 accepts the
stable parameter-backed combination and rejects both immediate and loop-carried
local-backed returns with E0515.

Nested-loop return summaries now replay only the bounded action prefix recorded
at each ordered return control instead of applying the block's final alias state
to every exit. Returns after an earlier unconditional nested control are
unreachable and contribute no origin. Exact direct reassignments in a reachable
prefix are supported; differing or local-backed reachable exits still fail
closed. ORACLE-0002 accepts the parameter-backed ordered pair and rejects the
earlier local-backed conditional return with E0515. This is source-ordered
bounded transfer, not a nested-loop fixed point or general region inference.
Nested return summaries additionally validate every inner backedge and every
conditional or unconditional break/continue edge that can carry alias state.
The bounded prefix at such an edge must preserve the incoming outer origin
facts; generation-only changes are ignored, but a changed or local-backed
origin fails closed. ORACLE-0002 accepts a temporary local assignment restored
to the parameter before the backedge and rejects an unrestored local origin
with E0515. This is an exact stability criterion, not a general fixed point.
The same one-iteration transfer now resolves direct conditional-return
operations after supported local declarations and assignments. The taken edge
contributes its exact current origin to the function-exit merge; the untaken
edge retains the current state for later operations and the backedge join.
ORACLE-0002 accepts a same-origin reborrow before that return and rejects a
local-backed replacement with E0515. Unconditional return and mixed loop-control
transfer remain separate incomplete steps.
Direct unconditional returns now use that same current state, terminate the
modeled iteration, and exclude disconnected suffix operations from the
backedge. A condition-headed loop retains only its zero-iteration input as a
possible continuation. ORACLE-0002 accepts a stable reborrow with an unreachable
suffix and rejects a local-backed return with E0515. Mixed break/continue exit
state remains incomplete.
Direct `break` now exports the current outer-local and projected origin state.
A condition-headed loop intersects that exit with its zero-iteration input; an
unconditional `loop` uses only the break state. Loop-scoped locals are discarded
at the exit. ORACLE-0002 accepts a local-initialized alias overwritten by the
parameter before an unconditional break and rejects the equivalent `while`
because its zero-iteration path remains local-backed with E0515. Conditional
break and continue joins remain incomplete.
Conditional `break` now contributes the current state to a bounded loop-exit
accumulator while its false path continues independently toward later operations
and the backedge. Multiple break outcomes intersect. A `while` additionally
joins its natural/zero-iteration exit; an unconditional loop exposes only break
outcomes. ORACLE-0002 accepts a parameter-backed break despite a local-backed
non-break path and rejects the reversed local-backed break with E0515.
Direct `continue` now terminates the current operation suffix and sends its
current origin state to the backedge. Disconnected later assignments cannot
alter return or iteration evidence. ORACLE-0002 accepts the exact stable return/
continue shape and reports the retained suffix as unreachable. Conditional
continue still requires a separate multi-backedge join.
Conditional `continue` now contributes its current state to a bounded backedge
accumulator while the false path continues through later operations. Normal
fallthrough and direct continue add further outcomes; the joined backedge feeds
the existing condition-headed natural-exit calculation. ORACLE-0002 accepts
stable parameter-backed backedges and rejects a local-backed fallthrough
backedge reaching a `while` tail with E0515.
Conditional action-block terminal `break` and `continue` arms now route their
post-action state directly to the loop-exit and backedge accumulators. They are
excluded from the later-operation fallthrough join; only nonterminal arms and an
implicit missing `else` continue. ORACLE-0002 accepts parameter-backed break and
continue arms and rejects a local-backed break arm with E0515.
Nested-loop ordered-return and stable-edge analysis is now state-parameterized
and reused after outer-loop declarations, assignments, and branch transfers.
The nested block observes the exact active outer state while its proven stable
edges leave that state unchanged for later outer operations. ORACLE-0002 accepts
an outer same-origin reassignment followed by a nested conditional return and
rejects the corresponding local-backed reassignment with E0515.
Nested inner-break outcomes now accumulate their exact outer-visible origin
state and feed later outer-loop operations. Condition-headed inner loops also
join the zero-iteration input; inner continue and normal backedges retain the
stability requirement. ORACLE-0002 accepts a parameter overwrite before an
inner break and rejects both local-backed and zero-iteration/local exits with
E0515.
Labeled nested `break` and `continue` outcomes now retain distinct bounded
outer-visible states. Outer breaks feed the enclosing exit join, outer continues
feed its backedge join, and only inner exits reach later enclosing-loop
operations. Source-order filtering excludes controls after an earlier
unconditional edge. ORACLE-0002 accepts parameter-backed labeled break and
continue paths and rejects their local-backed counterparts with E0515.
Mixed conditional labeled-control probes now cover an outer-target edge and an
inner exit in the same nested block. The two destinations retain independent
states: a conditional outer break does not replace the inner exit used by later
outer operations, and a conditional outer continue does not replace the inner
exit routed to an enclosing break. ORACLE-0002 accepts the parameter-backed
forms and rejects the local-backed alternatives with E0515.
Nested normal backedges may now use one bounded normalized state when applying
the complete action transfer a second time is idempotent. Every stored return,
break, and continue prefix must expose the same retained origins from both the
incoming and normalized headers; otherwise analysis fails closed. ORACLE-0002
accepts an overwrite that precedes every exit and rejects an exit that can run
before that overwrite with E0515. This is not iterative fixed-point solving.
Conditional inner continues may use that same normalized-state proof. A
continue after the normalizing overwrite is admitted only when the complete
transfer is idempotent and every other stored control prefix agrees; a continue
or break before normalization remains fail-closed. ORACLE-0002 accepts the
former and rejects the latter with E0515.
Unconditional inner continues use a prefix-bounded variant: the candidate and
second replay stop at the continue's exact action index, so unreachable suffix
assignments cannot affect the proof. Earlier stored controls must still expose
the same origins from both headers. ORACLE-0002 accepts a parameter overwrite
before a return/continue and rejects a return before normalization with E0515.
Multiple conditional inner backedges now form a bounded header meet with the
initial entry and normal fallthrough. Replaying all backedges from that joined
header must converge exactly, while every break, return, and outer-target
continue prefix must expose the same origins from the initial and joined
headers. ORACLE-0002 accepts differing backedge origins normalized before every
exit and rejects an exit that precedes normalization with E0515.
The joined-header proof now also stops at the first reachable unconditional
nested-loop exit. Only conditional inner continues ordered before that terminal
feed the header; the terminal prefix is checked as an exit, and its suffix is
unreachable. ORACLE-0002 accepts differing backedges followed by a normalized
unconditional break and rejects an earlier local-backed break with E0515.
When the unconditional terminal is an inner continue, its exact prefix joins
the earlier conditional backedges instead of being checked as an exit. The same
bounded convergence and exit-prefix invariance rules apply, while the
continue suffix remains unreachable. ORACLE-0002 accepts mixed parameter/local
backedges normalized before a return and rejects a return before normalization
with E0515.
Modeled nested-loop headers now iterate to a bounded fixed point instead of
allowing only one convergence replay. The meet lattice can only drop one fact
per local origin or retained projected origin, so the hard iteration limit is
the initial fact count plus one; failure to converge remains fail-closed. A
multi-step alias chain now converges before an exact parameter-restoring exit.
ORACLE-0002 accepts that form and rejects the early-exit form with E0499.

Nested-loop parsing now retains a bounded typed representation for conditional
branches that contain actions before a terminal `break`, `continue`, or
`return`. Each record preserves the condition, up to four scoped actions, the
target-aware terminal, and its position among surrounding flat actions and
controls. Parser tests cover local and expression actions followed by a return.
The same bounded record can now retain one explicit `else` arm with its own
four-action limit and target-aware terminal. Direct and inline x86-64 emission
lower the arms with scoped stack cleanup and independent target-aware terminals.
Reference returns are admitted only when exact ownership preanalysis proves
that the returned origin outlives the function.
The alternative record may instead retain one explicit `else if` condition and
its exact source span. The bounded constant evaluator tests that condition only
after the primary condition is false and preserves fallthrough when both are
false. CFG and ownership now use a distinct condition block and ownership
location: primary false enters the alternative condition, alternative true
enters its scoped actions, and alternative false preserves fallthrough. Native
emission now mirrors that two-stage decision for direct and helper-inlined
x86-64 functions: the alternative is evaluated exactly once only after primary
false, and its false edge preserves fallthrough. ELF64 and COFF probes cover
both emission paths. The representation now retains up to four ordered
alternative arms, including an optional final `else`, and the constant
evaluator lazily selects the first matching arm. CFG and ownership identities
now carry an exact alternative index for every condition, scoped action block,
and return value. Primary false and each conditional-alternative false edge
advance in source order; an unconditional final arm closes fallthrough. Direct
and helper-inlined x86-64 emission now walks the same bounded chain, and ELF64
and COFF probes cover both paths. Indexed reference-return arms share the exact
function-return outlives proof: all parameter-backed arms emit, while a local-
backed origin in any later arm fails closed.
The bounded constant evaluator selects
exactly one arm, executes its actions under a lexical resolver checkpoint, and
routes its target-aware terminal under the existing iteration limit. CFG
construction assigns a
separate else-action block, routes the condition's false edge into it, and
routes each arm's terminal independently. Ownership preanalysis gives else
actions and return values distinct mapped locations. No consumer silently
treats the explicit arm as false fallthrough.
CFG construction now gives the condition and scoped action body distinct basic
blocks and routes true, false, and target-aware terminal edges. Ownership
preanalysis assigns distinct condition, action, and return-value locations and
keeps branch locals scoped. Reference-carrying branch-return paths now apply
their exact scoped action prefix before resolving the returned origin; direct
parameter reborrows are admitted while local-backed returns fail closed.
Reference-carrying branch breaks now transfer that scoped state into their
inner/outer destination, as do outer continues. Inner continues now join their
scoped action state into the existing monotone bounded header convergence;
post-backedge exits must remain invariant against the converged header. The
bounded constant evaluator executes taken
branch actions with lexical-scope truncation and routes inner/outer break,
continue, and return terminals under the existing iteration limit. Focused
constants cover all three terminals and untaken fallthrough. Direct and inline
x86-64 emitters now lower the same terminal routing and scoped stack cleanup
for scalar-only primary and explicit else arms. Primary and else reference
returns now both enter the exact function-return outlives classifier:
parameter-backed origins are admitted and branch-local origins fail closed.
Reference break/continue forms use the bounded destination and backedge transfer
described above. ELF64 and COFF object probes cover separate return, continue,
and break prefixes, direct and helper-inlined scalar else and conditional-
alternative returns, and an exact parameter-backed mutable-reference else
return. Windows and
native Arch Linux WSL each pass 645 library tests, one component-interface
probe, 10 conformance tests, and 336 replacement tests: 992 compiler tests per
host.

Mapping nested branch actions into ownership facts also closes an earlier
omission in direct reference-assignment origin reconstruction. Primary and else
branch assignment locations now reuse the same bounded generation rule as flat
nested actions; a loop-carried self-reborrow resolves through its preceding
parameter-backed generation instead of failing outlives validation.

The first modern trait-solver foundation is an explicit bounded implemented-
goal representation. Stable trait/type/inference/placeholder identities remain
distinct; canonicalization replaces inference identities with first-occurrence
bound variables, makes alpha-equivalent goals equal, preserves placeholders,
and fails on argument or variable capacity overflow. The next slices add only
exact concrete impl headers and bounded answers: duplicate identities and
overlapping heads fail, one matching header returns its exact implementation
and fixed canonical-variable substitution, multiple matching inference answers
remain ambiguous, and no matching header returns no solution. Per-candidate
fixed bindings preserve equality when a canonical variable occurs more than
once. Canonicalization can also retain the first-occurrence inference identities
so a unique response maps its fixed bindings back to the caller without
allocation; incomplete or mismatched responses fail closed. This is not generic
unification or a complete solver and cannot authorize trait syntax.

The predicate-conjunction foundation groups up to eight implemented-trait goals
and canonicalizes them in one shared first-occurrence variable universe. A
variable reused by separate predicates therefore receives one bound-variable
identity, while predicate and aggregate variable overflow fail explicitly. It
does not elaborate or solve where clauses, introduce binders, or compose
answers.

The first binder slice represents a where clause as one bound consequence and
up to eight bound premises over eight explicitly indexed generic parameters.
Construction rejects out-of-scope parameters and excess capacity; concrete
instantiation requires exact arity and consistently replaces each parameter in
the consequence and premises. Generic parameters remain distinct from inference
variables and rigid placeholders. This is not elaboration, selection, or source
syntax.

Single-clause elaboration structurally matches a fully concrete implemented-
trait consequence against the bound consequence, infers fixed generic arguments,
and instantiates the clause when every parameter is constrained. Repeated
parameters require equal concrete types; mismatches return no solution,
unconstrained parameters remain ambiguous, and inference-bearing or placeholder
queries fail closed. There is no clause database, candidate combination,
recursion, or cycle handling.

The first clause database stores 64 stable identified clauses. Duplicate IDs and
structurally identical clauses fail at insertion. Distinct clauses that may
overlap remain representable, but a concrete query with multiple unique matches
or any unconstrained matching candidate is ambiguous; exactly one match returns
its clause identity and instantiated premises. This deliberately does not solve
those premises or recurse.

Concrete proof composition first accepts an exact implementation fact, then
recursively proves every premise of one unique clause. A fixed 16-goal stack
bounds work and detects repeated goals, including a cycle that closes at the
depth boundary. Missing premises, ambiguous candidates, cycles, and acyclic
depth overflow remain distinct results. This does not recurse over inference-
bearing goals, cache answers, normalize projections, or implement coinduction.

The first projection-normalization slice registers up to 64 exact associated-
type values under stable `(implementation, associated type)` identities. Values
must reference an implementation already present in the exact header database;
stale references, duplicate keys, and overflow fail. Normalization selects the
implementation through the existing canonical query and returns the exact value
or preserves ambiguity/no solution. Values cannot yet mention generic parameters
or other projections.

Generic projection normalization adds a separate fixed 64-value table keyed by
stable generic-implementation and associated-type identities. Values may be a
concrete type or one bound implementation parameter. Selection retains the
implementation's fixed substitution, recursively proves its instantiated
premises, and only then substitutes the associated value. Stale implementation
IDs, duplicate keys, unbound parameters, and overflow fail explicitly; missing
premises produce no solution, while cycles, overflow, and unchecked selection
collisions remain ambiguous at the projection boundary. Nested projections,
projection goals inside premises, and source associated-type syntax remain
unsupported.

A unified concrete projection entry point now selects across exact and generic
implementation families before reading either value table. Exact facts return
their registered values directly; generic candidates must pass recursive premise
proof before substitution. An absent implementation or value returns no
solution, and any unchecked cross-family collision remains ambiguous. The entry
point is the common boundary used by the bounded nested normalization below; it
does not provide general answer composition.

Bounded nested projection templates allow a generic associated value to name a
second concrete projection over the same implementation binder. The selected
substitution instantiates the nested goal, which may cross into either exact or
generic implementations. A separate 16-frame stack tracks exact `(goal,
associated type)` identities; repeated projections return cycle and acyclic
depth exhaustion returns overflow. Invalid bound parameters fail during value
admission. This supports recursive value normalization, not projection-bearing
type arguments, projection premises, inference projections, or coinduction.

The higher-ranked prerequisite gives every rigid placeholder an explicit 16-bit
universe plus a stable placeholder identity. A bound clause can instantiate its
parameters as distinct rigid placeholders in a caller-selected fresh universe;
canonicalization preserves those identities, different universes do not alias,
and universe advancement overflow fails. No general universe relation,
higher-ranked search, or `for<...>` source syntax exists yet.

Inference-variable identity now includes its creation universe while preserving
the root-universe `new(id)` constructor. Canonicalization treats identical
numeric IDs from different universes as distinct. A checked assignment permits
concrete values and same-or-older-universe inference variables/placeholders, but
rejects any value from a newer universe with an explicit leak error. This is a
bounded leak-check primitive, not higher-ranked candidate matching or complete
unification.

Rigid proof composition applies the same 16-frame visited-goal discipline to
concrete/placeholder goals. Exact concrete facts may terminate a branch;
otherwise one unique rigid clause is elaborated and every rigid premise is
proved recursively. Ambiguity, missing premises, cycles, and overflow remain
distinct, and inference-bearing entry goals fail. This is not mixed
inference/skolem unification, coinduction, or complete higher-ranked Rust
reasoning.

The first generic coherence slice admits 64 identified bound implementations.
An exact fixed 16-node equality unifier tests whether two flat heads have any
common instantiation across their separate binders. It propagates concrete
constraints through parameter unions, so repeated-parameter heads are disjoint
from unequal concrete tuples but overlap equal ones. Duplicate IDs, satisfiable
head overlap, and capacity overflow fail. Premises do not waive a head conflict,
and specialization is not implemented.

Concrete generic selection elaborates each admitted implementation head against
the query. Coherence guarantees at most one fully constrained candidate; a
unique result carries its stable implementation identity and instantiated
premises. No matching head returns no solution, while a parameter used only in
premises remains ambiguous. Inference-bearing queries fail at this concrete
boundary.

Concrete generic proof composes that selection with the existing 16-frame
visited-goal solver. Every instantiated premise must recursively resolve through
an exact implementation, another generic implementation, or a bounded where
clause. Missing premises, ambiguity, cycles, and overflow remain distinct.
Symmetric bounded admission checks reject overlap between exact headers and
generic heads in either insertion order, including repeated-parameter equality
constraints. The solver still treats a pre-existing unchecked collision as
ambiguous for defense in depth. This is not inference-bearing generic proof,
premise-aware coherence, specialization, or source-level trait solving.

Rigid generic selection applies the same coherent implementation table to goals
containing concrete types and rigid placeholders. Selected answers retain each
placeholder's exact identity and universe, repeated parameters require exact
term equality, and instantiated generic premises recurse through the existing
16-frame proof stack. Missing premises, ambiguity, cycles, and overflow remain
distinct, while inference-bearing entry goals fail. This is bounded skolemized
generic proof, not mixed inference/skolem unification, binder introduction,
coinduction, or complete higher-ranked reasoning.

Universal implemented-trait goals introduce an explicit binder over up to eight
parameters. Solving advances from a caller-supplied parent universe, instantiates
distinct rigid placeholders in that checked fresh universe, and sends the
skolemized goal through rigid generic proof. Invalid bound indices and universe
exhaustion fail explicitly; unconstrained implementation parameters preserve
ambiguity. This is one bounded universal-goal introduction rule, not nested
binders, leak-aware answer inversion, or `for<...>` source integration.

Standalone existential implemented-trait goals bind up to eight parameters as
universe-aware inference variables. Exact implementation selection canonicalizes
their first occurrences and restores a unique answer as substitutions keyed to
the original variable identities. Repeated parameters enforce equality; zero,
one, and multiple matching exact headers remain no-solution, unique, and
ambiguous. This does not yet search generic implementations, prove inferred
premises, compose projections, or invert answers across a universal binder.

Flat generic existential selection unifies a canonical inference-bearing query
with one coherent generic implementation head using a fixed 16-node constraint
graph. Concrete constraints become concrete answers; unbound equality classes
map every related query variable to their oldest universe-safe representative.
The same symbolic terms instantiate the selected implementation premises.
Parameters absent from the head remain ambiguous, rigid placeholders are
rejected, and no candidate returns no solution. Instantiated inferred premises
are not yet recursively proved, and this is not nested type unification,
projection unification, or a general answer-composition engine.

Recursive inferred proof retains one fixed constraint state for the root
existential variables. Before each obligation it applies current equality and
concrete constraints, selects across exact and generic implementations, merges
the resulting answer, and proves generic premises in order through a 16-frame
visited stack. Exact premises can refine symbolic roots to concrete types;
generic chains propagate those refinements. Contradictory premises return no
solution, while ambiguity, cycles, and overflow remain distinct. Premises may
not introduce unrelated variables. Inference-aware where-clause elaboration,
projection constraints, backtracking, caching, and coinduction remain absent.

Inference-aware where-clause elaboration applies the same symbolic matcher to
the bounded clause database. It returns a stable clause identity, instantiated
premises, and a universe-checked substitution; multiple matches or a
head-unconstrained parameter remain ambiguous. Recursive inferred proof consults
clauses only after exact and generic implementations return no solution, merges
their constraints into the same root state, and composes clause, generic, and
exact premise chains under the same visited stack. Clause cycles and acyclic
overflow remain distinct. This does not add environment layering, implied
bounds, negative reasoning, projection predicates, or backtracking.

Standalone existential projection equality binds one projection goal and one
expected type term over the existing eight-parameter universe. It proves the
projection's trait obligation in the root inference state, reselects the exact
or generic implementation, instantiates its associated value, and unifies that
concrete or symbolic value with the expected term. Generic associated values
may recursively project through the existing fixed 16-frame projection stack;
cycles and acyclic depth exhaustion remain distinct. Exact input/output
refinement, generic parameter equality, premise-constrained selection,
mismatch, ambiguity, cycle, and overflow have focused tests. This is not a
general projection-bearing type grammar, a projection premise language,
predicate conjunction composition, backtracking, or source associated-type
syntax.

Bounded existential predicate conjunctions contain up to eight implemented-
trait or projection-equality predicates over one shared root inference state.
An ambiguous predicate rolls back its tentative constraints and is retried
after other predicates refine the state; a complete pass without a proven
predicate returns ambiguity. Contradictions, cycles, and overflow retain their
distinct fail-closed results, while an empty conjunction preserves each bound
variable as its own symbolic representative. This is bounded goal scheduling,
not backtracking: predicates are not branched, projection equalities are not yet
admitted as where-clause premises, and general projection-bearing type terms,
source syntax, caching, and coinduction remain absent.

Where clauses and generic implementations now admit projection-equality
premises alongside implemented-trait premises under one combined eight-entry
capacity. Construction validates every bound projection goal and expected term;
concrete, rigid, and existential instantiation preserve the exact associated-
type identity and substituted terms. Existing proof APIs lacking associated-
value environments return no solution rather than treating one as proven.
Projection-aware existential proof evaluates these premises through the exact
and generic associated-value environment described below; concrete and rigid
proof remain fail-closed.

Projection-aware existential proof schedules instantiated implemented-trait and
projection-equality premises in one shared root constraint state. Ambiguous
attempts roll back and retry after another premise refines the state;
contradictions remain no solution. Projection normalization recursively invokes
the same aware proof for projection-bearing generic implementations, with a
separate 16-transition premise/normalization nesting bound in addition to the
existing proof and projection stacks. Direct refinement, deferred mixed
premises, generic projection premises, nested proof, and adversarial recursive
overflow have focused tests. This is not backtracking, concrete or rigid
projection-premise proof, general projection-bearing type terms, or source
syntax.

Projection-bearing trait type terms use a fixed 64-node arena. Leaf nodes retain
concrete, inference, or placeholder terms; projection nodes retain an associated-
type identity and a trait goal whose self and arguments reference earlier arena
nodes. Backward-only references make the graph acyclic at admission, identical
nodes intern to one stable identity, invalid references and capacity overflow
fail explicitly, and recursive normalization is independently limited to 16
term frames. Normalization evaluates projections in self or argument position
through the projection-aware environment and returns both the final flat term
and recovered inference substitution. Nested argument projections, inference
refinement, invalid forward references, arena overflow, and normalization depth
overflow have focused tests. Whole projection-bearing goals normalize every
self/argument term in one shared state before exact, generic, and clause
selection plus projection-aware premise proof. A parallel bound-term arena
retains indexed generic parameters and instantiates them as distinct inference
variables in a caller-selected universe before using the same normalization and
proof path. Binder admission validates every parameter index and remaps interned
identities after instantiation. This does not add higher-ranked term binders,
projection terms to clause heads or premise type positions, or source
associated-type syntax.

Projection-bearing logical clause heads use a separate fixed 64-entry
identified database. Direct concrete or parameter leaf positions first bind
every clause parameter in the root inference state; the complete head is then
instantiated and normalized through the existing projection-aware environment
before it is unified with the query. Stable clause identities are retained,
duplicate identities and clauses fail explicitly, multiple matching clauses
remain ambiguous, and a parameter that occurs only beneath a projection fails
closed as ambiguous instead of being guessed. Focused tests cover projection
normalization that determines an existential substitution, a normalized
mismatch, and the unconstrained-parameter boundary. Each head may also retain
up to eight flat implemented-trait premises; the selected substitution
instantiates them and the existing projection-aware recursive proof must
discharge them before the candidate succeeds. Missing premises and premise
capacity have focused tests. An opt-in existential solver threads the same
projection-clause database, inference state, and 16-frame proof stack through
nested implemented-trait premises. Unique nested selection commits one copied
candidate state; multiple candidates remain ambiguous, cycles and depth
overflow remain explicit, and callers that do not supply the database retain
their previous closed behavior. This is bounded logical head elaboration with
flat premises only. A separate 64-entry projection-bearing generic-
implementation admission table establishes the first coherence gate. Different
trait/arity or an unequal concrete leaf proves heads disjoint; parameters,
projections, and every other unresolved relationship conservatively mean
potential overlap. Admission rejects duplicate identities, peer overlap, and
potential collisions with exact or flat-generic heads, while permitting heads
separated by an explicit concrete leaf. Premises never waive overlap.
Direct leaf positions across the complete head now feed the existing fixed
equality unifier, so repeated parameters, parameter unions, and concrete
constraints can prove disjointness even when other positions contain opaque
projections. The same repeated-parameter constraints apply against exact and
flat-generic heads. Projection nodes themselves never prove disjointness.
Existential selection copies the root constraint state per admitted candidate,
normalizes the complete head through the associated-value environment, proves
flat premises, and returns the stable generic implementation identity plus the
recovered substitution. Missing premises reject the candidate; ambiguity,
cycles, and overflow remain explicit. An opt-in general solver threads this
table through nested implemented-trait premises alongside projection-bearing
logical clauses. Admitted implementations are tried before logical clauses,
one successful copied state is committed, and the shared 16-frame stack reports
cycles and depth overflow. Legacy entry points remain closed. Projection-
bearing clauses and implementations may also retain bounded implemented-trait
premises whose self and argument positions reference the same validated term
arena as the head. Selection instantiates and normalizes those premises in the
shared root state before proof. One bounded mixed scheduler attempts flat and
term-bearing predicates in the same pass, rolls back ambiguous attempts, and
retries pending predicates after any sibling refines the state. Refinement works
in either direction, while a pass with no proof progress returns ambiguity.
This is fixed-capacity conjunction scheduling, not candidate backtracking.
Complete projection-
equation coherence, higher-ranked term binders,
backtracking, caching,
coinduction, and source associated-type syntax remain unsupported.

Rigid clause elaboration accepts goals containing only concrete types and rigid
placeholders. Bound parameters may match either term, repeated parameters require
exact equality, and instantiated premises retain the same placeholder universe
and identity. The 64-clause database preserves its unique/ambiguous/no-solution
classification for rigid queries; inference-bearing inputs fail explicitly.
This is bounded skolem matching, not recursive higher-ranked proof or general
unification.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```
Smaller parser, type, aggregate, control-flow, and diagnostic prerequisites may
continue when they directly prepare that analysis. Arbitrary old-edition
parsing, obsolete compiler quirks, historical diagnostic compatibility,
unstable symbol compatibility, and obscure legacy cases with no MRML dependency
are deprioritized.

The OS/platform and compiler remain two concurrent lanes. Neither waits for the
other to become complete; they converge progressively as real MRML components
become compilable under verified profiles.

### Fixed ordinary `pause` inline assembly checkpoint

Ordinary unsafe x86-64 statement-position assembly now accepts exact
`asm!("pause")` and its validated no-memory, no-stack, flags-preserving option
form. Lowering emits the architectural `F3 90` byte pair through the existing
bounded emitter. Operands, clobber ABIs, safe-function use, malformed options,
other templates, and other architectures fail closed. Independently authored
ELF64 and COFF object probes exercise the same source form. The exact
ORACLE-0002 Rust 2024 toolchain accepted the metadata-only comparison probe.
Windows and Arch each passed 645 unit, 1 component, 10 conformance, and 337
replacement tests (993 total). This remains one fixed template, not general
inline-assembly support or physical CPU execution evidence.

### Typed bounded unsafe-block checkpoint

The expression graph now preserves `unsafe { ... }` as a typed `UnsafeBlock`
node with a checked source span rather than erasing the boundary. Constant,
semantic, IR, type, and native-emission consumers transparently retain the
operand while unsafe admission checks require either an unsafe function or
lexical containment by that node. The bounded scope covers the existing
unchecked integer operations, unchecked integer casts and option extraction,
and dangerous scalar raw-pointer dereference, reference conversion,
read/write/fill/copy/swap/drop, non-wrapping offsets, and pointer differences.
Safe raw-pointer inspection, casts, address manipulation, alignment queries,
and wrapping offsets remain safe. A control with an unsafe block around only
the pointer value does not authorize a dereference outside the block.

Independently authored ELF64 and COFF probes cover nested blocks, block-local
bindings, integer operations, and raw-pointer operations. ORACLE-0002 accepts
the scoped forms and rejects the escaped dereference with E0133. Windows and
Arch each passed 645 unit, 1 component, 10 conformance, and 338 replacement
tests (994 total). General statement blocks, assembly inside unsafe blocks
beyond the exact later checkpoint, unsafe traits/implementations, full raw-
pointer provenance, complete const unsafe rules, and `unsafe_op_in_unsafe_fn`
lint semantics remain unsupported.

### Scoped unsafe ordinary-assembly statement checkpoint

The bounded function-body parser now preserves one
`unsafe { asm!(...); }` block as an `ExpressionStatement` with explicit unsafe
context. The ordinary inline-assembly read-preanalysis and native-emission paths
accept that property in an otherwise safe function; they do not infer authority
from neighboring blocks or values. An optional semicolon after the unsafe block
is consumed without extending its scope. The existing fixed templates, operand
types, option validation, effects, output-place checks, and x86-64-only boundary
remain unchanged.

The exact ORACLE-0002 Rust 2024 toolchain accepted the scoped `pause` probe and
reported E0133 when `asm!("pause")` followed a separate unrelated unsafe block.
Independently authored ELF64 and COFF probes cover the accepted form and the
leakage control. Windows and Arch each passed 646 unit, 1 component, 10
conformance, and 338 replacement tests (995 total). Multiple statements inside
one unsafe block, nested unsafe assembly blocks, arbitrary macros, general
assembly, and general statement-block lowering remain unsupported.

### Terminal noreturn `int3` checkpoint

The bounded function-body representation now marks only a final top-level
expression statement as terminal. Exact x86-64
`asm!("int3", options(noreturn, nostack))`, with either option order, requires
an unsafe function or the scoped unsafe-statement form, emits the architectural
`CC` byte, and terminates native emission without a fabricated return. This
supports direct `!` function returns and never-to-value coercion for that exact
terminal form. Nonterminal and conditional uses fail closed because unreachable
statement suffixes are not yet represented precisely.

The exact ORACLE-0002 Rust 2024 toolchain accepted both option orders, the safe
scoped form, and never-to-value coercion. It also accepted a following suffix
with an unreachable-code warning; MRML deliberately rejects that form until its
control-flow representation can prove and lower unreachable suffixes without
guessing. Independently authored ELF64 and COFF probes cover the accepted forms
and the conservative rejection. Windows and Arch each passed 646 unit, 1
component, 10 conformance, and 339 replacement tests (996 total). General never
expressions, multiple-statement unsafe blocks, arbitrary noreturn assembly,
unreachable suffixes, and physical instruction-execution evidence remain
unsupported.

### Terminal seven-register `int 0x80` checkpoint

The x86-64 inline-assembly representation now retains exactly seven ordered
`u64` input expressions for the first-party terminal syscall shape: RAX, RDI,
RSI, RDX, R10, R8, and R9. A fixed-capacity delimiter scanner rejects missing,
extra, reordered, or unbalanced fields. Read preanalysis and native lowering
evaluate operands left-to-right, load the declared registers, emit `CD 80`, and
omit a fabricated return. The form requires terminal placement, an unsafe
context, and exact `noreturn, nostack` options in either order.

The exact ORACLE-0002 Rust 2024 toolchain accepted the independently authored
metadata-only comparison probe. ELF64 and COFF replacements exercise the same
source, while focused controls reject safe unscoped, reordered-register, and
nonterminal forms. Windows and Arch each passed 646 unit, 1 component, 10
conformance, and 340 replacement tests (997 total). This is native-object
encoding evidence only: the interrupt was not executed, and returning/inout
syscalls, other register sets, general assembly, and physical kernel behavior
remain unsupported.

### Returning seven-register `int 0x80` checkpoint

The same fixed-field syscall representation now distinguishes input and
`inlateout` operands. Returning forms require RAX `inlateout`, permit input or
`inlateout` on the other six ordered registers, restrict outputs to mutable
named `u64` locals or `_`, and require exact `options(nostack)`. Read and write
preanalysis follows source order. Native lowering evaluates all inputs before
the interrupt, saves all seven post-interrupt registers, stores named results in
declaration order, discards `_` results, and restores the temporary stack before
ordinary continuation. Preserving every result first prevents one output store
from corrupting a later register result.

The exact ORACLE-0002 Rust 2024 toolchain accepted a mixed RAX same-place, RDX
split-output, and R10/R8/R9 discarded-output probe. Independently authored
ELF64 and COFF replacements cover that form and reject an input-only RAX control.
Windows and Arch each passed 646 unit, 1 component, 10 conformance, and 341
replacement tests (998 total). The interrupt was not executed; output
parameters/fields/indexes, other operand orders/types/options, general assembly,
and physical kernel behavior remain unsupported.

### Terminal `cli`/`hlt` loop checkpoint

The exact first-party halt shape containing `cli`, local label `2:`, `hlt`, and
`jmp 2b` is now a typed divergent x86-64 assembly form. All permutations of the
required `noreturn`, `nomem`, and `nostack` options are accepted; missing or
altered fields fail closed. Terminal native lowering emits `FA F4 EB FD` and no
return sequence. The exact ORACLE-0002 Rust 2024 toolchain accepted the
independently authored metadata probe. ELF64 and COFF replacements plus unsafe,
template, and nonterminal controls pass on both hosts. Windows and Arch each
passed 646 unit, 1 component, 10 conformance, and 342 replacement tests (999
total). The instructions were not executed, so this is not privileged-mode or
physical CPU evidence; general labels and multi-template assembly remain
unsupported.

### Assembly-output definite-initialization checkpoint

Explicit `let name: u64;` now creates a local fact and move-path root without a
declaration initialization event. Its stack slot is storage only: the existing
initializedness dataflow rejects reads until an exact write. Returning `int
0x80` output preanalysis may perform the first write to either a mutable or
immutable named local; an immutable local rejects subsequent writes. Emission
allocates bounded storage while semantic initialization remains represented only
by the write fact.

The exact ORACLE-0002 Rust 2024 toolchain accepted the first-party-shaped split
assembly output and rejected a direct uninitialized read with E0381. Independent
ELF64 and COFF probes cover the accepted form, and a focused control rejects the
read-before-write. Windows and Arch each passed 647 unit, 1 component, 10
conformance, and 342 replacement tests (1,000 total). Only direct scalar `u64`
declarations and exact syscall outputs are supported at that checkpoint; CFG
joins remain fail-closed.

### Direct delayed-initialization checkpoint

A direct ordinary `=` may now perform the first write to an explicitly
uninitialized `u64` local. The assignment reuses the bounded move-path write
event and initializedness analysis rather than mutating declaration state.
Immutable bindings permit exactly that first direct root write and reject a
second write; compound assignment and projected first writes remain rejected.

The exact ORACLE-0002 Rust 2024 toolchain accepted the independently authored
direct initialization and rejected the repeated immutable assignment with
E0384. Independent ELF64 and COFF replacements cover the accepted form and a
focused control covers rejection. Windows and Arch each passed 647 unit, 1
component, 10 conformance, and 343 replacement tests (1,001 total). This is
straight-line scalar initialization only, not general types, conditional joins,
loop-carried initialization, or complete Rust definite-assignment semantics.

### Conditional delayed-initialization checkpoint

Different arms of the same bounded conditional assignment may now each perform
the first direct write to one immutable uninitialized `u64`. The immutable-write
check treats only those exact arm locations as mutually exclusive. Writes in the
same arm, before the conditional, or after its join remain conflicting. The
existing CFG initializedness intersection admits a post-join read only when
every reachable branch, including `else`, writes the move path.

The exact ORACLE-0002 Rust 2024 toolchain accepted the exhaustive two-arm probe
and rejected a missing-else probe with E0381. Independent ELF64 and COFF
replacements cover the accepted form. Windows and Arch each passed 647 unit, 1
component, 10 conformance, and 344 replacement tests (1,002 total). This is one
bounded scalar conditional statement, not nested/general control-flow joins,
loop-carried initialization, other types, or complete Rust definite-assignment
semantics.

### Primitive scalar delayed-initialization checkpoint

The same direct and bounded conditional delayed-initialization path now admits
every concrete primitive integer width plus `bool` and `char`. Each remains one
bounded stack slot and uses its existing typed assignment, normalization, and
return lowering. A single admission predicate is shared by preanalysis and
emission so unsupported uninitialized types cannot diverge between those
stages. Raw pointers, references, and aggregates remain rejected.

The exact ORACLE-0002 Rust 2024 toolchain accepted independently authored `i8`,
`bool`, and `char` exhaustive branch-initialization probes. ELF64 and COFF
replacement coverage additionally includes `u32`; a raw-pointer control fails
closed. Windows and Arch each passed 647 unit, 1 component, 10 conformance, and
345 replacement tests (1,003 total). This does not claim pointer provenance,
reference lifetime analysis, aggregate initialization, or loop-carried joins.

### Thin raw-pointer delayed-initialization checkpoint

Exact uninitialized `*const T` and `*mut T` declarations now pass through a
bounded three-token type parser and the same direct/conditional first-write
analysis. The selected pointer value is produced by the existing cast and raw-
pointer paths; initializedness records only whether the local was written and
does not create, strengthen, or infer provenance. Reference declarations remain
rejected because their region and reborrow obligations differ.

The exact ORACLE-0002 Rust 2024 toolchain accepted an independently authored
exhaustive `*const u8` branch initialization followed by `is_null`. ELF64 and
COFF replacements cover conditional const-pointer initialization and direct
mutable-pointer initialization/address extraction; a delayed reference control
fails closed. Windows and Arch each passed 647 unit, 1 component, 10
conformance, and 346 replacement tests (1,004 total). This does not claim general
pointer provenance inference, references, fat pointers, aggregates, or loop-
carried initialization.

### Thin-reference delayed-initialization checkpoint

Exact uninitialized `&T` and `&mut T` scalar declarations now use the existing
assignment reborrow effects and write generations. An immutable uninitialized
reference is permitted to contribute its one first assignment generation to the
bounded loan relation; already initialized immutable references remain
nonassignable. Return-outlives follows that generation to its borrowed path,
accepting parameter storage and rejecting function-local storage.

The exact ORACLE-0002 Rust 2024 toolchain accepted independently authored
parameter-backed shared and mutable delayed-reference returns and rejected the
local-backed form with E0515. ELF64 and COFF replacements cover both accepted
forms and the local-backed control. Windows and Arch each passed 647 unit, 1
component, 10 conformance, and 347 replacement tests (1,005 total). This does
not claim named lifetime inference, fat references, aggregates, or complete
Polonius semantics.

### Direct string-reference delayed-initialization checkpoint

Uninitialized shared `&str` locals now allocate their exact two bounded stack
slots rather than using the former scalar-only placeholder. Preanalysis and
emission agree on the same type-derived slot count, and direct assignment uses
the existing fat-reference value store and assigned-loan/outlives relation.

The exact ORACLE-0002 Rust 2024 toolchain accepted an independently authored
direct parameter-backed `&str` assignment and return and rejected a missing-arm
read with E0381. ELF64 and COFF replacements cover the accepted form and a
focused control covers rejection. Windows and Arch each passed 647 unit, 1
component, 10 conformance, and 349 replacement tests (1,007 total). Conditional
fat-reference assignment remains fail-closed pending its distinct branch value-
materialization/origin path; slices, mutable `str`, aggregates, and general fat-
pointer semantics are not claimed.

### Cooked string-literal escape checkpoint

Ordinary cooked string literals now decode simple escapes (`\\n`, `\\r`,
`\\t`, `\\\\`, `\\0`, escaped quotes), ASCII `\\xNN`, Unicode `\\u{...}`
with underscore-tolerant one-to-six-digit scalar validation, and LF/CRLF line
continuations. Direct UTF-8 source bytes remain unchanged. Decoded bytes enter
the existing bounded read-only-data buffer, so expansion cannot exceed 1,024
bytes and every emitted literal still consumes one of eight typed relocations.

Exact ELF64/COFF probes cover a newline, `\\x42`, and `\\u{1F642}` producing
the expected one-, two-, and four-byte results. Controls reject an unknown
escape, non-ASCII `\\xFF`, and surrogate `\\u{D800}`. The exact ORACLE-0002
nightly accepts the escaped conditional form. Windows and Arch each passed 649
unit, 1 component, 10 conformance, and 349 replacement tests (1,009 total).
Raw strings, byte strings, C strings, literal pooling, and general static data
remain outside this checkpoint.

### Runtime string-literal object checkpoint

Ordinary x86-64 code generation now has a distinct bounded relocatable result
that carries machine code, at most 1,024 read-only bytes, and at most eight typed
internal relocations. A simple unescaped UTF-8 string literal copies its exact
interior bytes, emits a RIP-relative address and exact byte length, and flows
through conditional `&str` assignment into the existing initializedness and
return-outlives paths. The object pipeline maps it to the proven ELF64 `.rodata`
or COFF `.rdata` contract. Callers requesting bare `MachineCode` still reject
data-bearing output rather than discarding relocation state.

The exact ORACLE-0002 Rust 2024 toolchain accepted independently authored plain
and escaped string-literal arms paired with a parameter-backed `&str`. MRML's
ELF64 and COFF objects contain the exact `fallback` bytes and correct section
names; the replacement covers both formats. Escapes remain fail-closed until a
bounded decoder implements their runtime byte semantics exactly. Windows and
Arch each passed 649 unit, 1 component, 10 conformance, and 349 replacement
tests (1,009 total). Raw/byte strings, escape decoding, literal deduplication,
more than eight literals, more than 1,024 literal bytes, and general static data
remain outside this checkpoint.

### Bounded C-string byte-view checkpoint

Cooked `c"..."` and raw `cr#"..."#` literals now have distinct token and
expression identity and cannot enter scalar const evaluation or masquerade as
`str`/byte slices. Bare C-string values fail as `UnsupportedCStringLiteral`.
The exact `.as_ptr()` form decodes through the bounded read-only-data path,
rejects an interior NUL before interning, appends exactly one terminator, and
returns a typed `*const i8` through a checked ELF64/COFF relocation. The exact
ORACLE-0002 toolchain accepted independently authored cooked/raw `&CStr` forms
and rejected an interior NUL on both hosts. Windows and Arch each passed 656
unit, 1 component, 10 conformance, 351 replacement, and 6 semantic-execution
tests (1,024 total). General `&CStr` ABI transport, other methods, locals,
arguments, conditionals, and platform-varying `c_char` targets remain outside
this checkpoint.

Exact literal `.to_bytes()` and `.to_bytes_with_nul()` now lower to immutable
`&'static [u8]` returns without admitting general `&CStr` ABI transport. A
distinct expression node preserves the method choice through validation and
emission. Both forms share the checked C-string decoder and relocation; the
first reports the content length and the second includes the one appended NUL.
ELF64 and COFF tests inspect the exact `hello\0` data and encoded lengths 5 and
6. The exact ORACLE-0002 Arch executable observed `b"hello"` and `b"hello\0"`.
Exact literal `.len()` and `.is_empty()` observations now reuse one canonical
decoder/view-length helper rather than interpreting the C-string node again.
The typed tail classifier prevents the constant IR path from seeing a runtime
C-string view, while preserving explicitly empty tails. Relocation-free scalar
code executes on both hosts and agrees with the exact ORACLE-0002 Arch
executable for lengths 5/6 and empty-view truth with/without the terminator.
Windows and Arch each passed 657 unit, 1 component, 10 conformance, 351
replacement, and 7 semantic-execution tests (1,026 total). General `CStr`
values remain fail-closed.

The semantic-execution harness now loads the exact MRML internal read-only
relocation contract rather than limiting data-bearing probes to structural
inspection. It recognizes only COFF `.text`/`.rdata`
`IMAGE_REL_AMD64_REL32` and ELF64 `.rela.text`/`.rodata` `R_X86_64_PC32`,
checks section, symbol, type, addend, and patch bounds, and rejects other shapes.
A conditional cooked/raw byte-view return executes from both formats and
observes exact bytes and terminator policy; exact ORACLE-0002 Arch execution
agrees. Both hosts passed 1,027 compiler tests, including 8 semantic-execution
tests. This is a bounded test loader, not external-symbol linking or a production
runtime loader.

### Bounded explicit-static reference checkpoint

Exact `&'static` reference spelling is now recognized for the existing bounded
reference targets. An explicit-static return may be supplied by compiler-owned
string literals without inventing an elided input lifetime, and an explicitly
static parameter may be returned through the existing origin/outlives path. A
non-static reference parameter in an explicit-static-return signature fails
closed as `UnsupportedLifetimeRelation`; the existing missing-input elision
case remains `UnsupportedLifetimeElision`. ELF64 and COFF probes cover cooked
and raw string/byte-string literal arms plus static fat and thin parameters.
The exact ORACLE-0002 toolchain accepted those independently authored forms and
rejected both `&str -> &'static str` and `&u32 -> &'static u32`.
Windows and Arch each passed 653 unit, 1 component, 10 conformance, 351
replacement, and 6 semantic-execution tests (1,021 total). Named lifetimes,
higher-ranked lifetimes, general subtyping, and general regions remain outside
this checkpoint.

### Exhaustive nested-control lowering checkpoint

Every alternative of the supported nested-loop conditional representation is
now validated and considered by inner/outer exit classification. Incomplete
control-flow preanalysis reports `UnsupportedRuntimeControlFlow` instead of
returning apparent success, and emission requires a `ValidatedRuntimeBody`
marker produced by an exhaustive statement traversal over complete CFG facts.
A bounded test loader executes relocation-free COFF or ELF64 `.text` and checks
observable nested actions, `break`, `continue`, returns, initializedness,
reference mutations/origins, and supported inline assembly after verifying the
exact ORACLE-0002 rustc commit. Windows and Arch each passed 653 unit, 1
component, 10 conformance, 351 replacement, and 6 semantic-execution tests
(1,021 total). General CFG lowering, relocating runtime loading, trap isolation,
external relocation linking, trap isolation, and complete region inference
remain outside this checkpoint. Internal read-only relocations are now executed
by the later bounded semantic-loader checkpoint.

### Isolated checked-trap semantic checkpoint

The semantic-execution harness now observes the existing checked unsigned-
overflow trap without terminating its parent test suite. Windows executes the
generated COFF function in an exact child-test process and verifies the
`STATUS_ILLEGAL_INSTRUCTION` result retained by libtest. Linux executes the
generated ELF64 function in a forked child and verifies the raw `SIGILL` wait
status. A normal return is an explicit failure on both hosts. This is hosted
process-isolation evidence for the existing `ud2` overflow path, not kernel,
VMM, physical-machine, general signal/exception, terminal-assembly, or panic-
unwind evidence. Windows and Arch each passed 657 unit, 1 component-interface,
10 conformance, 351 replacement, and 9 semantic-execution tests (1,028 total).

### Bounded byte character-literal checkpoint

Byte character literals now have distinct lexical and expression identity and
the concrete `u8` runtime type. Direct ASCII, conventional single-byte escapes,
and `b'\x00'` through `b'\xFF'` lower through bounded scalar emission. Unicode
escapes, direct non-ASCII characters, empty values, and multi-byte values fail
closed. The exact ORACLE-0002 toolchain accepted independently authored ASCII,
`b'\xFF'`, and escaped-newline controls. MRML accepts each for ELF64 and COFF.
Windows and Arch each passed 652 unit, 1 component, 10 conformance, and 351
replacement tests (1,014 total). C literals and general suffix semantics remain
outside this checkpoint.

### Bounded byte string-literal checkpoint

Cooked `b"..."` and raw `br#"..."#` literals now have a distinct token and
expression kind and type as immutable `&[u8]`, never `&str`. They reuse the
bounded decoded read-only-data and checked relocation path. Cooked byte strings
admit the full `\x00` through `\xFF` range, reject Unicode escapes and direct
non-ASCII source characters, and raw byte strings preserve ASCII content
verbatim while rejecting non-ASCII content. Conditional returns can select a
parameter-backed byte slice or either literal form; mixing byte and UTF-8 string
literals fails the existing runtime type check.

The exact ORACLE-0002 Rust 2024 toolchain accepted independently authored
cooked and raw parameter-backed conditional returns. MRML's ELF64 and COFF
objects contain the exact cooked `41 FF 0A` and raw 11-byte payloads. Windows
and Arch each passed 652 unit, 1 component, 10 conformance, and 350 replacement
tests (1,013 total). Byte literals, byte-string suffixes, C strings, general
static data, and general lifetime inference remain outside this checkpoint.

### Zero-input return-lifetime elision checkpoint

An elided reference return now requires at least one supported reference input
from which Rust's lifetime-elision rules could derive the output lifetime. A
function with only scalar inputs and `-> &str` fails closed as
`UnsupportedLifetimeElision` before object emission, even when every returned
value is a static string literal. Existing one-reference-input return forms
remain supported by the bounded origin and outlives analysis.

The exact ORACLE-0002 Rust 2024 toolchain rejected the independently authored
zero-reference-input form with E0106 and accepted the parameter-backed controls.
MRML rejects the invalid form for both ELF64 and COFF. Windows and Arch each
passed 650 unit, 1 component, 10 conformance, and 349 replacement tests (1,010
total). Multiple-reference-input elision, explicit named lifetimes, explicit
`'static`, higher-ranked lifetimes, and general region solving remain outside
this checkpoint and must fail closed where unsupported.

### Thirty-two-relocation object checkpoint

The shared x86-64 object and runtime read-only-data contracts now admit at most
32 checked relocations instead of eight. All existing offset, symbol, data,
integer-conversion, serialization, and output-capacity validation remains in
force, and the thirty-third relocation fails closed through the existing object
capacity test.

The exact ORACLE-0002 Rust 2024 toolchain accepted an independently authored
parameter-backed conditional return containing nine distinct static string
arms. MRML emits all nine literal relocations in both ELF64 and COFF. Windows
and Arch each passed 650 unit, 1 component, 10 conformance, and 349 replacement
tests (1,010 total). This is a fixed capacity increase, not unbounded object
growth, dynamic allocation, general static data, or complete linker semantics.

### Bounded decoded string-literal pooling checkpoint

Cooked and raw string literals now decode into a fixed 1,024-byte scratch
buffer before the read-only arena changes. The emitter deterministically reuses
the first existing byte sequence with identical runtime contents, including
equivalent cooked and raw source spellings, while retaining a separate checked
relocation for each use. New bytes still require checked capacity and
unsupported decoding still fails before object state changes.

An end-to-end capacity control selects between two differently spelled 640-byte
literals. ELF64 and COFF both compile within the 1,024-byte arena only because
the second decoded value reuses the first. Windows and Arch each passed 650
unit, 1 component, 10 conformance, and 349 replacement tests (1,010 total).
This is deterministic bounded byte-sequence reuse, not an address-identity
guarantee, general constant merging, larger data or relocation capacities, or
general static data.

### Bounded raw string-literal checkpoint

Rust raw string literals with zero through 255 delimiter hashes now tokenize as
string values, close only on an exact quote-plus-hash delimiter, and copy their
interior UTF-8 bytes verbatim into the existing bounded read-only object-data
path. Backslashes, quotes, and would-be cooked escapes inside the content are
not interpreted. Unterminated input and delimiters beyond 255 hashes fail
closed; checked arithmetic protects delimiter and content bounds.

The exact ORACLE-0002 Rust 2024 toolchain accepted an independently authored raw
literal containing a backslash and an embedded non-closing quote/hash sequence.
MRML's COFF object contains those exact 11 bytes, and ELF64/COFF replacement
coverage accepts the same direct conditional return. Windows and Arch each
passed 650 unit, 1 component, 10 conformance, and 349 replacement tests (1,010
total). Byte/raw-byte/C strings, literal pooling, larger data or relocation
capacities, and general static data remain outside this checkpoint.

### Direct conditional string-literal return checkpoint

Direct tail `if` expressions may now return either a parameter-backed `&str`
or a cooked static string literal. Bounded fat-reference preanalysis treats the
literal arm as a value with no runtime-place read, while the return emitter uses
the existing checked read-only data and relocation path before applying the
target ABI's two-word return transport. The existing 64-level expression bound,
1,024-byte data capacity, and eight-relocation capacity remain unchanged.

The exact ORACLE-0002 Rust 2024 toolchain accepted the independently authored
direct conditional probe. MRML emits the exact `fallback` bytes through ELF64
and accepts the same source for COFF replacement output. Windows and Arch each
passed 649 unit, 1 component, 10 conformance, and 349 replacement tests (1,009
total). This checkpoint does not add raw/byte/C strings, pooling, larger
capacities, general static data, or general lifetime inference.

### Bounded internal read-only object-data checkpoint

The ELF64 and COFF object emitters now accept typed internal relocations that
pair a checked code patch offset with a checked offset into caller-supplied
read-only bytes. ELF emits an allocatable, non-writable `.rodata` section, a
local section symbol, `R_X86_64_PC32`, and an explicit checked addend. COFF emits
`.rdata`, a static internal symbol, `IMAGE_REL_AMD64_REL32`, and the corresponding
checked in-place addend. The relocation count, every arithmetic operation and
integer conversion, data bounds, and output capacity remain explicit and
bounded.

Structural tests exercise two independent code/data offsets, exact data bytes,
section flags, relocation symbol indices, both addend forms, and rejection of a
data offset beyond the supplied bytes. Windows and Arch each passed 648 unit, 1
component, 10 conformance, and 349 replacement tests (1,008 total). This is an
object representation foundation only: ordinary code generation does not yet
produce internal data relocations, so runtime string literals remain
fail-closed.

### Conditional string-reference delayed-initialization checkpoint

Exhaustive conditional first writes to an uninitialized shared `&str` local now
have replacement coverage for the existing branch-aware two-machine-word value
transport. The initializedness intersection requires both arms, and the
assigned-loan/outlives path retains the parameter-backed origin through the
join; no new origin or provenance rule is inferred.

The exact ORACLE-0002 Rust 2024 toolchain accepted an independently authored
conditional form whose two arms assign the same parameter-backed `&str` before
return. ELF64 and COFF replacements cover that accepted form, while the existing
missing-arm control remains rejected. Windows and Arch each passed 647 unit, 1
component, 10 conformance, and 349 replacement tests (1,007 total). Static
string literals still lack runtime object emission, and distinct-origin fat
references, slices, mutable `str`, and general fat-pointer semantics are not
claimed.

### Conditional thin-reference first-write checkpoint

Exhaustive conditional first writes to one uninitialized thin-reference local
retain each branch's assignment reborrow generation. The existing CFG
initializedness intersection requires every reachable arm, while return-
outlives independently validates every origin that can reach the join. A local-
storage origin therefore rejects the whole returned value even when another arm
is parameter-backed.

The exact ORACLE-0002 Rust 2024 toolchain accepted exhaustive parameter-backed
shared and mutable probes, rejected a mixed parameter/local-origin return with
E0515, and rejected a missing-else form with E0381. ELF64 and COFF replacements
cover the accepted forms and focused controls cover both rejections. Windows and
Arch each passed 647 unit, 1 component, 10 conformance, and 348 replacement
tests (1,006 total). This is bounded structured-arm origin preservation, not
named lifetimes, arbitrary nested joins, fat references, or complete Polonius.

## Non-negotiable implementation rules

- Preserve `no_std`, no global `alloc`, dependency-free core compilation,
  caller-selected fixed capacities, bounded recursion/diagnostics, checked
  offsets, explicit target layouts, deterministic memory use, and capacity
  failures.
- Unsupported borrowing, provenance, traits, ABI, const, control-flow, unsafe,
  assembly, and metadata behavior fails explicitly. Never emit guessed
  semantics.
- Preserve existing working functionality, original conformance probes,
  COFF/ELF64 code generation, Windows GNU/LLVM and Arch verification, UEFI and
  NVPTX checks, and pinned-nightly evidence unless a concrete correctness issue
  requires a deliberate change.
- Every new semantic feature follows black-box observation, independently
  authored MRML probe, MRML-owned implementation, and differential verification.
- Never copy upstream compiler implementation source or upstream test bodies to
  inflate coverage.
