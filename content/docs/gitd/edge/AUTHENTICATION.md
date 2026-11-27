# Gitd authentication and repository profiles

The transport-neutral Gitd edge implements keyed Bearer-token verification
before repository generation lookup or receive-body consumption. Tokens contain
256 random bits and are displayed once. The server retains only a purpose-bound
HMAC verifier plus an authenticated metadata record; token plaintext is not part
of `TokenRecord`, its `Debug` output, or error output.

Each authenticated record binds the exact repository, read/write/administration
scope bits, activation time, expiry, revocation generation, bounded
authority-neutral label, and token verifier. A separate record MAC detects scope,
repository, time, generation, label, or verifier substitution. Verification
compares tags without data-dependent early exit. Duplicate Authorization headers,
unknown schemes, malformed/noncanonical tokens, duplicate matching records,
wrong-repository tokens, missing scope, expiry, and stale revocation generations
all fail with the same denial.

Repository profiles are deployment-owned:

- `PublicRead` permits anonymous reads but still requires an authorized token for
  writes and administration.
- `Private` requires authorization for every action.
- `Protected` requires authorization for every action and does not itself bypass
  protected-history or receive-authority checks.

The Smart Git path maps discovery/upload-pack to read and receive-pack to write.
It authenticates before invoking `repository_generation` or the streaming
backend, so an unauthorized receive consumes no body and creates no quarantine
state. Missing authentication configuration fails closed.

The HTTP library now provides a bounded canonical token-record envelope. It
sorts records by repository and verifier, rejects duplicates, retains only HMAC
verifiers and metadata, revalidates every record MAC on decode, and authenticates
the exact complete file with a distinct pepper-bound HMAC. Truncation, trailing
bytes, mutation, wrong peppers, malformed metadata, and noncanonical order fail
closed. Gitd now securely loads the 32-byte pepper and bounded token store with
`O_NOFOLLOW`, exact owner/private-mode checks, and no zero-key fallback, then
constructs the HTTP edge's repository policies from the authenticated deployment
catalog. Both native configuration and dependency checks execute this gate.
Atomic one-shot administration updates remain a separate responsibility.

Focused hosted Linux evidence:

- `./target/debug/mrml test org.mrml.library.http --target linux`: 64 tests
  passed, including record-store canonicalization, authorization after reopen,
  mutation/truncation/wrong-pepper rejection, and the existing edge ordering
  that authenticates before receive-body consumption.
- `./target/debug/mrml test org.mrml.service.gitd --target linux`: 10 tests
  passed, including private-mode token/pepper loading, symlink refusal, catalog
  parsing, authenticated catalog files, and real authority/certd channels.

Patent review: **NOT_TRIGGERED**. This is conventional random bearer-token,
keyed-verifier, authenticated-record, scope, expiry, and revocation handling; no
new cryptographic primitive or protocol mechanism is introduced. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
