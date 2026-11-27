# MRML ABI v1

Status: **PARTIALLY IMPLEMENTED**

MRML ABI v1 is the first versioned MRML-owned function interface. It is a
language-level interface whose native lowering is target-specific; it is not the
Rust ABI and is not inferred from `extern "C"`.

## Shared-source facade

Source selects this ABI with the exact attribute:

```rust
#[mrml_abi::export(version = 1)]
pub fn sum_bytes(input: &[u8]) -> u64 {
    input.iter().map(|byte| u64::from(*byte)).sum()
}
```

The source does not contain a literal `extern "mrml-v1"`, so the same function
body can be used by MRML and a pinned upstream-rustc differential harness. The
ABI identity, validation, layout, and lowering are built into `mrml-rustc`. An
upstream build instead provides the pinned, repository-controlled, modular
`mrml_abi` facade adapter; official rustc can therefore compile the shared
source without learning the custom ABI. Absence or identity mismatch is a
comparison failure, not permission to discard the attribute. The adapter does
not define or authorize MRML-v1 semantics.

The compiler oracle support contains that bounded facade as an identity
attribute macro. The semantic execution gate builds it with the exact dated
rustc, builds executables containing the same attributed functions fed to MRML,
executes both artifacts, and compares their returned observations. Windows uses
the pinned toolchain's own `rust-lld` and runtime library rather than an unpinned
system linker. Current evidence covers one-word scalar calls and two-word slice
parameters, including register/stack crossings and independent data-pointer,
length, and byte-content observations. It is not yet general differential or
cross-language ABI evidence.

The MRML parser accepts only `mrml_abi::export`, requires exactly
`version = 1`, and records the central `FunctionAbi::MrmlV1` identity. The
function must currently be an ordinary public Rust-syntax function. The facade
implies a stable unmangled export name. Duplicate attributes, unknown fields or
versions, private functions, const functions, naked functions, and combination
with an explicit native ABI fail closed.

Unknown future versions are never interpreted as version 1.

## Signature validation

The central, allocation-free v1 classifier currently admits these logical
source types:

- fixed-width `u8` through `u128` and `i8` through `i128` integers;
- `bool` and `char`;
- const and mutable raw pointers to those scalar types;
- shared and mutable references to those scalar types;
- shared and mutable slices of those scalar types; and
- shared and mutable `str` references.

An omitted return type is the v1 unit type. `usize` and `isize` fail with a
distinct platform-sized-integer reason. Undefined aggregates, floats, aliases,
user types, nested pointers, and every other unclassified spelling fail closed
as unsupported. Validation reports whether failure belongs to the function,
an exact parameter index, or the return type. This logical classification does
not itself define a machine representation.

## Initial x86-64 value representation

The central layout model defines the same in-memory v1 value representation for
the x86-64 System V and Windows targets. Fixed-width integers use their stated
width and natural alignment. `bool` is one byte and `char` is a four-byte
Unicode scalar value. Raw pointers and references are one eight-byte pointer.
Slices and strings are 16-byte, eight-byte-aligned records with an eight-byte
data pointer at offset zero and an unsigned 64-bit element or UTF-8 byte length
at offset eight. Unit has size zero and alignment one. Integer representation is
little-endian on these x86-64 targets.

Valid v1 `bool` values are zero and one; valid v1 `char` values are Unicode
scalar values. References are non-null and aligned for their pointee, while raw
pointers may be null. A zero-length slice or string may use a non-dereferenceable
aligned data pointer, but its pointer field is still present. These validity
requirements are contract rules; this checkpoint does not yet claim that every
call boundary dynamically validates them.

This representation is distinct from parameter and return classification under
either native calling convention. The later lowering must explicitly describe
registers, stack slots, indirect values, and caller/callee obligations for each
target rather than inheriting Rust or C aggregate rules.

## Initial x86-64 call classification

V1 decomposes each admitted parameter into zero, one, or two ordered eight-byte
words. A two-word value is the low-address word followed by the high-address
word; for slices and strings this is the data pointer followed by the unsigned
64-bit length. Words consume target argument locations in source order and may
straddle the final argument register and the first stack slot.

On x86-64 System V, the first six words use `rdi`, `rsi`, `rdx`, `rcx`, `r8`,
and `r9`; later words start at callee-entry `[rsp + 8]`. On x86-64 Windows, the
first four words use `rcx`, `rdx`, `r8`, and `r9`; later words start after the
return address and required 32-byte home area at callee-entry `[rsp + 40]`.
Each later word advances by eight bytes. Callers preserve each platform's
ordinary stack-alignment and Windows home-area obligations.

Zero-word unit returns use no register. One-word returns use `rax`. Two-word
returns use `rax` for the low or first word and `rdx` for the high or second
word. Sub-eight-byte unsigned integers, `bool`, `char`, pointers, and references
are zero-extended in their word; signed integers are sign-extended. Unused bits
are therefore deterministic. This is an MRML v1 convention, not a claim that
native C or Rust aggregate classification uses these rules.

## Current implementation boundary

The central identity, bounded facade parser, initial signature classifier,
x86-64 in-memory value layout, and abstract call-location planner are
implemented. Machine-code emission now admits one-word parameters and returns
after validating the signature and target plan: fixed-width integers through 64
bits, `bool`, `char`, scalar raw pointers, scalar references, and unit returns.
It also admits two-word shared or mutable slice and string parameters and
returns. The emitter uses the planned target register or stack order for every
parameter word, returns borrowed views directly in `rax` and `rdx` on both
targets, and does not relabel the function as C ABI.

Unsupported zero-word parameters fail with a distinct typed codegen reason at
the exact type span. Two-word `u128` and `i128` parameters are admitted for
direct Rust `as` narrowing to supported one-word integer types and for returning
that same parameter unchanged in `rax` and `rdx`. Direct `as` widening from any
fixed-width one-word integer to `u128` or `i128` normalizes the low word at the
source width, then zero-extends unsigned sources or sign-extends signed sources.
Direct casts between `u128` and `i128` preserve both parameter words unchanged.
Typed named `u128` and `i128` constants produce their exact resolved words.
Bounded typed `const fn` calls returning `u128` or `i128` use the same exact-word
constant resolver, including nested calls whose result feeds a matching wide
parameter. Wide literal, negative literal, matching typed named-constant,
nested-call, bitwise-inverted, and checked signed-negated arguments are evaluated
under the callee parameter's declared type. Matching-type `&`, `|`, and `^`
arguments compose through that same bounded recursive resolver. Matching-type
`+` and `-` arguments use signed- or unsigned-checked arithmetic and fail closed
on overflow. Matching-type multiplication uses the corresponding checked wide
operation and the same overflow failure.
Matching-type division and remainder reject a zero divisor and signed minimum
divided by or remaindered by negative one instead of evaluating with wrapping or
host-dependent behavior.
Wide const-call shift arguments use an independently evaluated one-word count,
reject counts of 128 or greater, and sign-fill only typed `i128` right shifts.
Constant `if` arguments evaluate only the selected compatible wide branch before
passing its exact words to the callee.
Bounded block-sequence arguments evaluate and discard one ordinary const prefix
before resolving a compatible wide tail.
Same-width `u128`/`i128` casts inside const-call arguments preserve all bits while
requiring the cast target to match the callee parameter type.
Inline `const { ... }` arguments delegate their typed wide operand to the same
bounded resolver and preserve its checked arithmetic behavior.
Constant `if` conditions may compare compatible wide values for equality or
signedness-aware ordering before selecting one wide branch.
Boolean negation and short-circuit `&&`/`||` compose those bounded const
conditions without evaluating an unselected right operand.
Const calls may independently type and evaluate multiple wide parameters in
source order alongside ordinary one-word parameters. Wide const-function bodies
retain the declared integer type of a shift distance instead of forcing it to
the shifted value's type in named constants and const functions, including for
compound shift assignments and boolean comparisons of shifted values.
The same typed comparison rule applies inside bounded boolean const functions.
Direct unary bitwise inversion of a two-word integer inverts both words.
Direct `i128` negation uses carry-aware two-word lowering and traps on `i128::MIN`
when ordinary overflow checks are enabled.
Typed `&`, `|`, and `^` expressions evaluate left-to-right and combine both words
independently for matching wide integer types. Binary and wide-local compound
forms share the same two-word lowering.
All matching-type wide binary arithmetic, bitwise, division, and remainder
expressions use one typed left-to-right two-word operand-staging path.
Matching-type `u128` and `i128` addition evaluates left-to-right, propagates the
low-word carry into the high word, and uses unsigned-carry or signed-overflow
branches respectively when ordinary overflow checks are enabled.
Matching-type subtraction likewise propagates low-word borrow into the high word
and selects unsigned-borrow or signed-overflow trapping by declared type. Binary
addition/subtraction and their wide-local compound assignments share these
carry-aware lowerings.
Matching-type `wrapping_add`, `wrapping_sub`, and `wrapping_mul` preserve the
corresponding two-word carry, borrow, or low-product result while intentionally
discarding overflow without entering the checked trap path.
`wrapping_neg` applies carry-aware two-word negation without trapping on either
unsigned nonzero inputs or the signed minimum value.
`wrapping_abs` applies that same negation only to negative signed inputs and
leaves `i128::MIN` unchanged.
`saturating_neg` and `saturating_abs` instead map `i128::MIN` to `i128::MAX`;
other inputs use the corresponding exact two-word negation or absolute value.
`saturating_add` selects the unsigned maximum on carry, or the signed minimum or
maximum according to the direction of signed overflow.
`saturating_sub` selects unsigned zero on borrow and uses the same signed-bound
selection for signed subtraction overflow.
Wide rotations mask the distance to 127, exchange the low/high words for the
upper half of that range, and use paired cross-word shifts in either direction.
Wide `swap_bytes` and little-endian-target `to_be` byte-swap both words and
exchange them; `to_le` preserves the two-word value unchanged.
Wide `reverse_bits` reverses each word and exchanges their positions.
Wide bit isolation selects the highest nonzero word for `isolate_highest_one`
and the lowest nonzero word for `isolate_lowest_one`, preserving zero.
Wide population and leading/trailing bit counts consume both words and return
the Rust-defined `u32`, including the full-width result for zero or all ones.
Unsigned wide `bit_width` returns zero for zero and otherwise offsets a set bit
in the high word by 64.
Unsigned wide next-power operations distinguish the low/high-word crossover;
overflow traps for checked `next_power_of_two` and wraps to zero for the
wrapping form.
Wide signed `signum` returns the canonical two-word representations of negative
one, zero, or positive one.
Wide signed absolute values conditionally negate both words and trap on
`i128::MIN` under checked or strict semantics; `unsigned_abs` preserves that
minimum magnitude in the corresponding `u128` result.
Wide `strict_neg` always rejects nonzero unsigned inputs and rejects
`i128::MIN`, independent of the ordinary overflow-check setting.
Wide shift methods reuse the two-word shift layout while keeping policy
separate: wrapping masks to 127, strict traps at 128, and unbounded shifts
produce zero or signed fill beyond the width.
Wide unsigned `is_power_of_two` accepts exactly one set bit across either word
and returns a normalized scalar boolean.
Wide unsigned `is_multiple_of` uses the two-word remainder path for nonzero
divisors and preserves Rust's special zero-divisor predicate result.
Wide unsigned midpoint uses the overflow-free bitwise average across both
words, including the carry between them.
Wide signed midpoint uses an arithmetic cross-word half and adjusts negative
odd sums so division rounds toward zero.
Wide `min` and `max` compare signed or unsigned high words first, break ties
with unsigned low words, and return one complete already-evaluated operand.
Wide `abs_diff` orders operands with the receiver's signedness, subtracts the
smaller from the larger, and returns the full unsigned magnitude.
Wide signed sign predicates read negativity from the high word and require a
nonzero two-word value for positivity, again returning a normalized scalar.
`wrapping_div` and `wrapping_rem` preserve the mandatory zero-divisor trap but
return `i128::MIN` and zero respectively for the signed minimum divided by or
remaindered by negative one.
Equality and inequality compare both words after left-to-right evaluation and
normalize the combined word differences to a boolean that may enter the supported
one-word integer cast/return path.
Ordering compares high words first (signed for `i128`, unsigned for `u128`) and
uses an unsigned low-word comparison only when the high words are equal. All four
ordering operators normalize to the same supported boolean path.
Checked `u128` multiplication forms the low product and both cross-products,
rejecting every nonzero discarded high product and every carry beyond the high
result word. Checked `i128` multiplication converts both operands to bounded
magnitudes, applies the same product, validates the signed result range, and
restores the result sign. Binary multiplication and wide-local multiply
assignment share this lowering and its overflow traps.
Wide shifts accept a one-word integer count, explicitly distinguish counts below
and above the 64-bit word boundary, and trap checked counts of 128 or greater.
Right shift sign-fills only the declared `i128` high word. Binary shifts and
wide-local shift assignments share this single bounded lowering so their traps
and word-boundary behavior cannot diverge.
General `u128` division and remainder use a fixed 128-step restoring divider,
retain the divisor in bounded temporary stack storage, and trap a zero divisor.
`i128` division and remainder store bounded sign state, divide operand magnitudes,
restore quotient/remainder signs, and unconditionally trap the `MIN / -1` case.
Binary division/remainder and their wide-local compound assignments share this
fixed-step lowering and its zero-divisor and signed-overflow traps.
Wide `div_floor` and `div_ceil` preserve one evaluation of each operand, retain
both quotient and remainder from the bounded divider, and adjust a non-exact
quotient according to the divisor and remainder signs. Unsigned ceiling adds
one only for a nonzero remainder; unsigned floor is the ordinary quotient.
Wide `next_multiple_of` likewise evaluates each operand once and uses the
bounded remainder. It advances by `divisor - remainder` for matching signs and
by `-remainder` for opposite signs, retains the exact dividend for zero
remainders and signed division by negative one, and applies checked wide
addition to the adjustment. Zero divisors and out-of-range results trap.
Wide Euclidean division retains quotient, remainder, and divisor sign from the
same bounded machinery. A negative signed remainder adjusts the quotient away
from truncation according to the divisor sign; Euclidean remainder adds the
divisor magnitude and is therefore nonnegative. Ordinary and strict forms trap
on zero and signed minimum divided by negative one, while wrapping forms retain
Rust's minimum quotient or zero remainder for that overflow pair.
Wide ordinary, strict, and wrapping powers use exponentiation by squaring with
a `u32` exponent and fixed stack-resident result, factor, and exponent state.
Every selected result multiply and required factor square uses the existing
two-word multiplier under the method's overflow policy; exponent zero returns
one without multiplying. Saturating wide powers remain fail-closed.
Wide integer square root uses fixed two-word operand, result, and power-of-four
state. It first reduces `2^126` to the greatest candidate no larger than the
operand, then performs the bounded restoring recurrence with explicit
cross-word shifts, comparisons, additions, and subtractions. Unsigned inputs
cover the full `u128` range; negative signed inputs trap before iteration.
Wide unsigned `carryless_mul` performs exactly 128 XOR/shift rounds in registers.
It shifts the complete multiplicand left and multiplier right across their word
boundaries, accumulates selected polynomial terms without carries, and returns
the low 128 product bits. Signed wide operands remain rejected.
Wide unsigned `extract_bits` scans exactly 128 source positions from most to
least significant. Each selected mask position shifts the compressed two-word
result and appends the corresponding source bit, preserving source order without
an unbounded or data-dependent allocation. Signed wide operands remain rejected.
Wide unsigned `deposit_bits` first counts the selected mask positions, aligns
the corresponding low source bits, and then scans exactly 128 destination
positions from most to least significant. It scatters only the selected source
bits with bounded register and private-stack state. Signed wide operands remain
rejected. The pinned oracle covers empty, full, low-word, and cross-word masks.
Wide unsigned `saturating_pow` uses the same bounded exponentiation-by-squaring
control flow as checked and wrapping powers, but each two-word multiplication
detects discarded high product bits and saturates to `u128::MAX` instead of
trapping. Zero exponents, exact boundary results, and overflow during either
result multiplication or base squaring are checked against the pinned oracle.
Signed wide saturation tracks the mathematical product sign independently of
the magnitude multiplication. Overflow selects `i128::MIN` for a negative
result and `i128::MAX` for a positive result, while the exact `-2^127` boundary
remains representable. Odd and even overflowing powers and both signed endpoints
are checked independently against the pinned oracle.
Direct wide `saturating_mul` reuses the same unsigned discarded-product checks
and signed sign/magnitude endpoint selection as saturating powers. Oracle cases
cover exact products, unsigned overflow, both signed overflow endpoints, and
the asymmetric `i128::MIN * -1` boundary.
Wide `strict_add`, `strict_sub`, and `strict_mul` force overflow checking even
when the surrounding compilation mode disables ordinary debug overflow checks.
Their successful two-word results match the pinned strict-overflow oracle; an
overflow reaches the same fail-closed trap used by checked MRML-v1 arithmetic.
Wide `strict_div` and `strict_rem` reuse the bounded 128-round divider and never
inherit wrapping behavior. Zero divisors and the signed `i128::MIN / -1`
overflow fail closed; successful unsigned division and signed remainder results
are checked against the pinned strict-overflow oracle.
Wide mixed-signedness wrapping addition and subtraction require an exact
opposite-signed 128-bit argument. The operand loader preserves each declared
type, then the lowering performs modulo-2^128 two-word arithmetic; signed and
unsigned extrema and cross-word negative operands match the pinned oracle.
Wide strict mixed-signedness add/sub methods use exact two-word bounds rather
than reinterpreting the argument. Unsigned receivers branch on the signed
argument and apply its magnitude in the correct direction; signed receivers
compare the unsigned argument with the exact distance to `i128::MIN` or
`i128::MAX`. All four method forms match the pinned strict-overflow oracle.
Wide saturating mixed-signedness methods reuse those exact bounds but select an
endpoint instead of trapping: signed receivers clamp to `i128::MIN` or
`i128::MAX`, while unsigned receivers clamp to zero or `u128::MAX` according to
the operation and signed argument direction. Exact boundaries remain unchanged.
Unsafe wide `unchecked_add`, `unchecked_sub`, and `unchecked_mul` lower to the
same two-word machine arithmetic used by wrapping operations, but remain
admitted only in an unsafe function or block. Oracle execution uses exclusively
valid non-overflowing inputs; violating an unchecked method precondition remains
Rust undefined behavior and is never presented as a safe MRML-v1 contract.
Unsafe wide signed `unchecked_neg` performs a two-word two's-complement negate
without an overflow branch. Oracle execution excludes `i128::MIN`, whose use
violates the Rust precondition; semantic admission still requires unsafe scope.
Unsafe wide `unchecked_shl` and `unchecked_shr` reuse the two-word logical or
signed-arithmetic shift lowering without a distance trap. Oracle execution uses
only distances below 128, including 63/64/127 word boundaries; larger distances
violate Rust's unchecked-shift precondition and are outside the safe contract.
Pinned-nightly wide `unchecked_shl_exact` and `unchecked_shr_exact` share that
lowering but additionally require every shifted-out bit to be redundant for the
operation. Oracle vectors satisfy both the distance and exactness preconditions
at the 63/64/127 boundaries; the compiler does not turn invalid calls into a
defined or safe operation.
Unsafe wide `unchecked_div_exact` reuses signed or unsigned two-word quotient
lowering. Pinned-nightly oracle vectors cover exact positive, negative, and
cross-word quotients. Zero divisors, signed minimum divided by negative one, and
nonzero remainders violate the method's preconditions and remain outside the
defined contract.
Unsafe unsigned wide `unchecked_disjoint_bitor` combines both word pairs with
bitwise OR. Pinned-nightly oracle vectors cover low/high-word separation and
alternating disjoint masks. Overlapping set bits violate the method's
precondition and remain outside the defined contract.
Unsafe unsigned wide `unchecked_funnel_shl` and `unchecked_funnel_shr` combine
two adjacent two-word values without reducing either operand to a host scalar.
Pinned-nightly oracle vectors cover zero and the 1/63/64/127 boundaries. Shift
distances at or above 128 violate the unchecked methods' precondition and remain
outside the defined contract. An explicitly scoped `unsafe` block inside a safe
function carries the required language context through two-word emission; it
does not make sibling expressions unsafe or admit a signed or mismatched-width
funnel operation. Native Linux execution matches the exact dated oracle at
distances 0, 1, 63, 64, and 127 across both result words.
Safe unsigned wide `funnel_shl` and `funnel_shr` reuse the same two-word
composition and trap before emission when the distance is at least 128. Their
valid boundary results are compared against the pinned nightly independently of
the unchecked entry points.
Lazy `if` expressions may select compatible two-word integer values without
evaluating the unselected branch; both branches retain the declared wide type.
Block sequences may evaluate supported one-word prefix expressions before a
compatible two-word integer tail expression.
Immutable `u128` and `i128` locals preserve both words in bounded stack slots;
their initializer and later reads retain the declared wide type.
Mutable wide locals support whole-value assignment through the same typed place
and ownership checks. Checked `+=`/`-=`/`*=` and `/=`/`%=`, plus bitwise
`&=`/`|=`/`^=` and checked `<<=`/`>>=`, preserve both words.
Discarded wide expression statements and block prefixes execute normally,
including checked traps, without materializing an unused stack value.
Bounded calls to earlier ordinary Rust helpers may pass and return supported
two-word integers; the helper is inlined and does not acquire an external ABI.
Closed positive and negative two-word integer literals are range-checked against
the declared return type and materialized directly into the two return words.
Ordinary narrowing `as` casts may consume a parameter, local, or computed wide
expression through the common two-word emitter; the low word is then normalized
to the exact target width and the high word carries no result authority.
Same-width `cast_signed` and `cast_unsigned` methods preserve both words.
Their saturating variants clamp values excluded by the target signedness, while
strict variants trap at that same high-word sign-bit boundary.
Other wide casts, expressions, locals, operations, calls, and returns remain
unavailable and fail closed.
Ownership and borrowing rules beyond ordinary language checking, other
multiword machine-code lowering, link compatibility, and external execution
evidence remain required.
The typed runtime stack model reserves two ordered words for `u128` and `i128`
values, and its logical integer-layout metadata preserves their exact signed or
unsigned 128-bit bounds. The existing one-word instruction emitter rejects that
logical layout instead of narrowing it. These internal representations do not
by themselves admit the types at the public call boundary.
Range-endpoint analysis also uses the logical layout, so positive and negative
128-bit literal magnitudes are checked exactly even while machine emission
remains unavailable.
Saved-parameter and relative parameter-offset accounting use the same complete
runtime type classifier, so a two-word integer reserves both stack words and
cannot overlap a following parameter. Direct narrowing reads the low word after
recording the ordinary parameter-place access; both words still enter through
the target call plan in source order.

The admitted subset has controlled native execution evidence on the Windows and
Linux test hosts: the public pipeline emits the host object, the test harness
independently extracts its executable image, applies any bounded read-only
relocations, changes the mapping from writable to executable, and calls facade
scalar and slice functions through the host's matching word convention. Exact
dated-rustc observations cover the same attributed sources, including a slice
whose pointer and length straddle the register/stack boundary on each target
and a returned slice captured directly from `rax` and `rdx`. Wide-parameter
evidence passes independent `u128` and `i128` low/high words through four target
argument registers and compares nested narrowing with the pinned rustc facade.
It also captures `rax` and `rdx` independently for a nontrivial `u128` identity
round trip and for unsigned, signed, narrow, and cross-signed widening at zero,
extrema, and all-ones. Same-width `u128`/`i128` casts are compared at both words.
Unsigned and signed unary bitwise inversion is likewise compared at both words.
Non-overflowing signed negation results are compared at both words, while exact
machine-code checks cover the shared overflow trap.
Wide bitwise operations are compared at both words across zero, extrema,
all-ones, and mixed-bit inputs.
Non-overflowing unsigned and signed addition is compared across both words;
machine-code tests require the shared overflow trap.
Non-overflowing unsigned and signed subtraction is compared across both words,
including low-word borrow cases.
Unsigned equality and signed inequality are compared with the pinned oracle at
equal values and values differing in either word.
Unsigned less-than and signed greater-than-or-equal are compared below, at, and
above their boundaries, including values whose high words select the result.
Unsigned multiplication by `2^64 + 1` is compared across both result words through
the exact non-overflowing `u64::MAX` boundary; a product with nonzero high-by-high
contribution is required to terminate through the isolated overflow trap.
Signed multiplication by `-17` is compared for both operand signs and near both
signed boundaries, while `i128::MIN * -1` must take the isolated overflow trap.
Unsigned left/right shifts and signed right shifts are compared at counts 0, 1,
63, 64, 65, and 127; count 128 must take the isolated overflow trap.
Unsigned quotient and remainder by `2^64 + 1` are compared below, at, and above
the divisor through `u128::MAX`; a zero divisor must take the isolated trap.
Signed quotient and remainder by `-17` are compared for both operand signs and
the exact `i128::MIN`/`i128::MAX` boundaries; both `MIN / -1` and `MIN % -1`
must take isolated traps.
Unsigned and signed wide floor/ceiling division are compared across exact and
non-exact quotients, opposite-sign pairs, the 64-bit word boundary, and the
signed and unsigned extrema supported without overflow.
Unsigned and signed wide next-multiple results are compared across exact and
non-exact values, both divisor signs, the 64-bit word boundary, and the signed
minimum divided by negative one. Zero-divisor and signed/unsigned overflow
paths must take isolated traps.
Signed wide Euclidean quotient/remainder pairs are compared for every operand
sign combination and both signed extrema. Wrapping minimum-by-negative-one is
compared word-for-word, while ordinary zero-divisor and signed-overflow cases
must take isolated traps for both operators.
Unsigned and signed wide powers are compared at zero and odd/even exponents,
across the 64-bit word boundary, and through a non-overflowing cross-word
square. Wrapping overflow is compared word-for-word; ordinary and strict
overflow must take isolated traps.
Wide integer square roots are compared below and above perfect squares, across
the 64-bit word boundary and power-of-four reduction boundary, and at
`u128::MAX` and `i128::MAX`. A negative signed input must take an isolated trap.
Wide carryless products are compared word-for-word for zero, identity, small
polynomials, cross-word terms, and all-one operands through the pinned nightly's
explicit `uint_carryless_mul` oracle feature.
Wide bit extraction is compared word-for-word for empty/full masks, compact low
patterns, and masks selecting both 64-bit words through the pinned nightly's
explicit `uint_gather_scatter_bits` oracle feature.
Both branches of a nontrivial wide conditional return are compared word-for-word.
Wide values returned through a block sequence are also compared word-for-word.
Immutable wide-local round trips are compared word-for-word.
Whole-value mutable wide-local assignments are compared word-for-word.
Supported wide compound assignments are compared word-for-word as one sequence.
Unsigned and signed wide multiply assignments have separate oracle cases.
Unsigned and signed wide divide/remainder assignments have separate oracle cases.
Unsigned and signed wide shift assignments have separate oracle cases.
Discarded wide-expression prefixes are compared against the retained tail value.
Wide helper arguments and returns are compared word-for-word after inlining.
Both paths through an inlined helper's conditional wide early return are also
compared, including cleanup of a mixed two-word and one-word argument frame.
Exact `u128::MAX`, `i128::MAX`, and `i128::MIN` literal
words and typed unsigned/signed named constants are also compared with the same
oracle. Typed unsigned and signed wide `const fn` results are compared likewise.
This is not linker, dynamic-loader,
cross-language, or physical-hardware evidence.

Arrays, tuples, user aggregates, and indirect returns are not admitted. This
checkpoint also does not establish that existing
`extern "C"` tests with Rust-specific types are C-compatible; those boundaries
require a separate fail-closed validation and test migration.
