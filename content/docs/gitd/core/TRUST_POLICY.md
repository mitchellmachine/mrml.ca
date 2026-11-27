# Gitd trust policy

Status: **PARTIALLY IMPLEMENTED**.

The versioned policy must bind repository identity, monotonic generation,
previous-policy digest, protected refs, allowed object formats, required
signature profile, legacy checkpoint, hybrid cutover, complete active/retired/
revoked key identities, exact OpenPGP/ML-DSA pair bindings, validity intervals,
revocation generation, and emergency recovery policy.

`TrustPolicyState` now provides a bounded, canonical in-memory policy core. It
binds repository identity, monotonic generation, previous-policy SHA3-512
digest, protected full refs, allowed object formats, hybrid-required state,
exact active key pairs, complete revoked OpenPGP fingerprints, complete revoked
ML-DSA public-key digests, and a revocation generation. Lists are bounded and
must be strictly ordered, so duplicate or alternate-order encodings cannot
produce competing canonical policy digests.

The first-party persisted `MRMLGTP3` encoding/parser is implemented and capped
at 512 KiB. It uses fixed-width big-endian generations and counts, two-byte
length-prefixed validated repository/ref identifiers, explicit format and
hybrid flags, complete 32-byte OpenPGP v6 fingerprints, 64-byte MRML OpenPGP
key digests, and 64-byte ML-DSA key digests. The parser checks every addition
and slice boundary before access or allocation, caps all collection counts,
reuses typed identifier validation, rejects unknown flag bits and non-Boolean
values, requires strict collection order, rejects trailing bytes, and
byte-for-byte re-encodes the result before acceptance. Every truncation of the
golden policy fixture fails closed.

`MRMLGTP3` adds a bounded, strictly full-fingerprint-ordered legacy OpenPGP v4
ledger. Each `LegacyV4KeyStatus` records the complete 20-byte fingerprint, an
inclusive `valid_from`, exclusive `valid_until`, and optional retirement time;
no short key ID is encoded or compared. A separate strictly ordered complete
v4 revocation list is bound into both the canonical bytes and V3 policy digest.
Legacy statuses must be nonempty exactly when a legacy checkpoint exists, and
legacy revocations cannot exist without that checkpoint. Lookup at a caller-
supplied trusted time rejects absent, expired, retired, or revoked identities.

Normal transitions cannot remove a legacy status, move its start, widen its
end, reverse or delay retirement, remove a revocation, or reactivate a revoked
identity. Adding a legacy revocation requires a strictly newer revocation
generation. Focused tests cover V3 byte-for-byte re-encoding, every truncation,
alternate ordering, full-fingerprint suffix collisions, expiry, retirement,
revocation, and transition narrowing. This is only the canonical schema
prerequisite: it does not classify commit ancestry or activate a v4-signed
protected history. Such activation remains fail closed pending an authenticated
graph proof for the exact legacy checkpoint and hybrid cutover.

Each exact OpenPGP/ML-DSA pair also has one canonical `PolicyPairStatus` with
an inclusive `valid_from`, exclusive `valid_until`, and optional `retired_at`.
Statuses are strictly ordered by the complete pair identity. The active-pair
list must exactly equal the ordered non-retired status subset; retired records
remain present for bounded historical verification. `pair_authorized_at`
accepts only times in the half-open validity interval and, after retirement,
only times strictly before the retirement instant.
`active_verification_policy_at` is the fail-closed bridge from that canonical
ledger to cryptographic verification: it requires the complete pair to be in
the active subset, unrevoked, and authorized at the trusted validation time,
then binds the exact trust/revocation generations and effective exclusive end
to the `HybridTrustPolicy`. Merely retaining a retired identity for historical
description cannot mint current signing authority.

Normal transitions cannot remove an existing status, move its start, widen its
end, undo retirement, or delay a recorded retirement. They may narrow the end
or retire an active pair earlier. This makes expiry and retirement monotonic
restrictions on authority rather than mutable descriptive metadata.

Key revocation is a separate purpose-bound transition, not policy rotation or
emergency recovery. The canonical `MRGREV01` statement is capped at 64 KiB and
binds repository identity, exact previous and strictly greater next revocation
generations, nonzero effective time, a bounded printable reason, and strictly
ordered complete OpenPGP v6 fingerprints and ML-DSA public-key digests. Empty
identity sets, duplicates, alternate ordering, malformed text, truncation, and
trailing bytes fail closed. Its SHA3-512 digest covers the complete canonical
encoding.

Application requires a `VerifiedHybridSignature` over those exact bytes with
the `KeyRevocation` purpose and object type, current trust and revocation
generations, the exact repository, and a currently time-authorized active pair.
It only unions new revocations. Affected pair-status identities remain recorded
and are retired no later than the statement's effective time; earlier expiry or
retirement is preserved. Revocations cannot disappear, reactivate a pair, or
be replayed as a generation transition. Revoking every active pair fails closed;
emergency recovery remains a distinct future authority path.

The canonical state now also carries optional exact-format Git object IDs for
the final legacy checkpoint and hybrid-required cutover, plus an optional
64-byte digest naming a separately authenticated emergency-recovery policy.
Hybrid-required state is invalid without a cutover. Checkpoint and cutover IDs
must be nonzero and use an allowed repository object format. Once established,
normal rotation cannot move either checkpoint/cutover or replace the emergency
policy digest; those changes require a distinct future emergency-transition
typestate rather than piggybacking on daily-key rotation.

Repository policy may narrow an externally pinned owner trust root but cannot
broaden it: an update cannot add an object format or remove an already
protected ref. Normal rotation requires `KeyRotation` verification typestates
from both a currently active hybrid pair at the old generation and a proposed
active pair at the new generation. A transition cannot lower a generation,
break the previous-policy digest chain, remove a revocation, reactivate a
revoked key, or downgrade hybrid-required policy.

Authenticated emergency recovery uses the canonical bounded `MRGERA01`
authority descriptor and `MRGERT01` transition. The descriptor binds the exact
repository, authority generation, validity interval, threshold, ordered hybrid
pair identities, and revoked component identities. Distinct verified hybrid
approvals over the exact purpose-separated transition mint a private
`EmergencyRecoveryAuthorization`; duplicate pairs cannot satisfy the threshold.
The transition binds the prior policy digest and trust/revocation generations,
the exact next policy digest and generations, the next authority digest, and
effective time.

`LinuxDurableTrustPolicyStore` rereads the expected current generation and
digest under a create-new lock, consumes that authorization, enforces retained
revocations/protected refs, non-broadening formats, and hybrid non-downgrade,
then fsyncs and atomically selects the canonical next policy. It reopens and
byte-validates the selected state before releasing the lock. Uncertain outcomes
retain the lock; replay against the persisted next state fails the exact prior
generation/digest check. Hosted-Linux tests cover canonical parsing, threshold
failure, substitution, truncation, tampering, stale locks, exact reopen, and
durable replay rejection. Key custody and approval production remain in the
injected owner-controlled verifier service rather than this storage module.

`verify_introduced_history` now deterministically walks every commit introduced
by `old..new`, including all merge-side parents, in parent-before-child order.
It excludes only the authenticated old history, requires the exact old commit
to be reached for fast-forward acceptance, bounds both existing and introduced
walks (5,000 introduced commits by default), bounds parents per commit, rejects
mixed object formats, missing objects, cycles, and verifier failure, and returns
a private-field `VerifiedCommitRange`. Tests prove that an invalid merge-side
intermediate cannot hide beneath an otherwise accepted tip. Deterministic
functional tests execute exact linear introduced ranges of 1, 100, 1,000, and
5,000 commits and reject 5,001 at the default limit on Linux and the pinned
Wine-hosted Windows target. These cases establish bounded behavior at the
configured boundary; they are not production throughput, peak-memory, or
native-Windows evidence.

Protected-history admission now exposes only
`verify_protected_introduced_history`. Its verifier must return a private
`VerifiedCommitProof` for every newly introduced commit in deterministic
parent-before-child order, including every merge-side parent. The proof is
minted only by hashing the exact authenticated commit payload as a Git commit
object, requiring that hash to equal the requested commit ID, and binding the
successful hybrid verification to the exact repository identity, repository
generation, trust generation, revocation generation, `GitCommit` purpose, and
object format. A callback that
merely returns success cannot construct the proof.

The policy-aware entry point `verify_policy_classified_history` additionally
proves that the immutable hybrid cutover descends from the legacy checkpoint.
It computes the bounded checkpoint ancestry and accepts an opaque conventional
v4 proof only for the checkpoint or one of its ancestors; every other
introduced commit, including merge-side history, requires the hybrid proof.
An independently verified v4 signature is bound to exact Git commit bytes,
complete fingerprint, trusted signing time, repository, and generations before
it can become that opaque proof. `prepare_policy_classified_receive` composes
this decision into receive. The existing policy-free entry point remains
hybrid-only and fail closed.

`DetachedCommitProofStore` is the concrete bounded source for this path. It
accepts at most 5,000 strictly object-ID-ordered records, rejects duplicates,
bounds OpenPGP armor, and requires the exact ML-DSA-65 signature width. Stored
records remain untrusted data: `DetachedHybridCommitVerifier` authenticates
both signatures over the supplied exact commit contents and full context before
the Git object hash is bound and an opaque proof is returned. Missing,
substituted, malformed, oversized, or context-mismatched records fail closed.

`DurableDetachedCommitProofDirectory` now persists those untrusted records as
bounded canonical immutable files. Each lookup key and stored record bind the
exact repository identity, repository/trust/revocation generations,
`GitCommit` purpose, object format, and commit ID. A digest-derived filename is
only an accelerator: reopening rechecks the complete key, signature widths,
record framing, and terminal SHA-256 digest. Installation uses create-new or
accepts only byte-equivalent existing content, syncs the file and containing
directory, then reopens and compares the complete record before reporting
success. Linux tests cover persistence, exact-existing idempotence, conflicting
duplicates, tampering, truncation, wrong generation, and wrong object format.
Platforms without a supported directory-sync primitive, including the current
Windows runtime, fail closed rather than claim crash durability. These stored
bytes still grant no authority before hybrid verification.

The resulting private `VerifiedCommitRange` carries that same context into the
atomic `VerifiedRefTransaction` constructor. A range from another repository,
generation, purpose, format, or object ID is rejected. The unbound graph walker
is crate-private and retained only for internal/test graph fixtures; it is not a
public protected-ref authorization boundary. This proof path currently consumes
detached signatures over the exact commit contents. The installed-as-`git`
conventional commit/tag path now independently verifies the exact returned SSH
or OpenPGP signature before its local ref update, but it does not yet encode the
complete `MRML-GIT-HYBRID-V1` result. Protected receive can
now consume a caller-provisioned bounded proof store through its verifier
boundary. Durable Linux proof-record storage exists, but population
authorization and canonical policy/key-service retrieval remain integration
gates; records gain no authority merely by being stored. Native-Windows
directory durability also remains open.

The repository's hybrid commit constructor now requires both verification
callbacks alongside the two signing callbacks. It verifies the outer OpenPGP
signature over the payload containing the exact ML-DSA armor and verifies the
ML-DSA signature over the base commit payload before writing the object or
moving the branch ref. A verifier failure leaves the prior branch head exact;
the object writer then independently reopens and rehashes successful bytes.
The installed CLI still needs protected-policy/key-service composition before
it can select this constructor automatically.
