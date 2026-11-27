# Git authority channel

Status: **PARTIALLY IMPLEMENTED**. The authenticated Unix transport, native
health exchange, exact policy/ref authorization, detached hybrid proof
verification, verified immutable proof installation, and purpose-separated
receipt authentication are implemented. The deployed authority process selects
one exact protected repository; multi-repository authority sharding remains an
operational scaling task.

`mrml-git-authority` owns a version-1, length-prefixed Unix-domain channel. Each
frame is bounded to 1 MiB plus 8 KiB of proof/context overhead, contains an
exact operation and monotonically nonzero request identifier, authenticates the
complete SHA-256 payload digest,
and carries an HMAC-SHA-256 tag under a purpose-limited 256-bit channel
capability. Unknown versions, operations, frame kinds, malformed lengths,
payload changes, zero capabilities, peer substitutions, and replay within a
session fail closed.

The listener validates Linux peer credentials before reading a frame. Socket
paths must be absolute, may not contain `.` or `..`, and every existing parent
is rechecked as a real directory rather than a symlink. An existing socket path
is never replaced. Reads and writes have two-second deadlines.

The hosted executable provides both the long-running `serve` operation and a
native `healthcheck`; it does not need a shell or HTTP client. The capability
file is opened with `O_NOFOLLOW`, must be a single-link regular file of exactly
32 bytes, and must have mode `0400`, `0440`, or `0600`. Capability bytes are
erased after transfer into the redacted, non-cloneable channel type and again
when that type is dropped.

The daemon rereads the canonical policy for each operation. It binds receive
and ref approval to the repository and exact repository, trust, revocation, and
policy generations; only explicitly protected, non-delete ref updates are
accepted. Commit verification loads the exact-context detached record and
checks both OpenPGP v6 and ML-DSA evidence under the active, time-bounded pair.
The separate `InstallProof` operation accepts the exact commit bytes and both
bounded signatures, rechecks repository and all three generations, verifies the
hybrid transcript and Git object ID before durable insertion, and never replaces
an existing conflicting record. A differently randomized but valid signature is
accepted only when the already-stored proof independently verifies for the same
exact commit context. Thus untrusted network data cannot occupy an immutable
proof slot before cryptographic verification. `VerifyProof` performs the same
policy, transcript, signature, and object-ID checks without inserting into the
global proof directory. The live receive graph uses this non-mutating operation
while its exact candidate context is still being constructed. When candidate
journaling is configured, the legacy global `InstallProof` operation is rejected;
new proof persistence must use an active candidate.

Candidate operations carry one canonical context binding the candidate ID,
repository, current/next repository generations, trust/revocation generations,
policy, refs, introduced commits, arrival pack, proof set, and activation
digests. The daemon persists and re-reads ordered candidate transitions. Only a
matching activation commit advances the repository generation. Receipt signing
then requires that exact activated candidate and activation transcript digest,
and advances the journal before returning a purpose-separated Ed25519
signature. Exact commit and receipt retries are idempotent; cross-context reuse,
skips, rollback, and abort after activation fail closed.

Candidate proofs use a distinct authenticated operation that binds both the
complete candidate context and the existing exact proof-verification request.
While the candidate is `receiving`, verified records are written only beneath
its owner-only candidate directory and an ordered checksummed proof ledger is
durably replaced. Sealing reopens every immutable proof, rejects unexpected
directory entries, and recomputes the canonical proof-set digest before the
journal may advance. Aborted candidate proofs never enter the generally visible
proof directory.

Legacy proof verification remains unavailable. Startup refuses unavailable
policy, inactive keys, zero generations, malformed public keys, or insecure
secret files. The Gitd adapter and deployment configuration are composed, and
the receive pipeline now invokes the candidate lifecycle around proof retention,
durable activation, and receipt persistence. Automated restart reconciliation
of every incomplete candidate state remains incomplete.

Patent review: **NOT_TRIGGERED**. This change uses conventional bounded Unix
socket framing, peer credentials, SHA-256, and HMAC authentication rather than
a new substantial mechanism. See `docs/patents/REVIEW_LOG.md`.
