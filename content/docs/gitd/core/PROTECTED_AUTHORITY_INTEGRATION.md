# Protected receive authority integration

Status: **IMPLEMENTED** as a bounded core composition; production service
deployment remains an integration responsibility.

`ReceivePackCore::execute_with_authority` is the protected production entry
point. The caller injects one `ProtectedReceiveAuthority`, which combines only
four constrained operations:

1. authorize the exact repository generation, trust generation, revocation
   generation, and canonical policy digest;
2. authorize the exact parsed candidate ref transaction;
3. verify each introduced commit and return the existing opaque
   `VerifiedCommitProof`; and
4. sign and independently verify the purpose-separated durable audit receipt.

The state-and-policy authorization check runs before any request byte is
consumed. The exact ref transaction and the same canonical policy digest are
authorized immediately after the bounded receive-command prefix is parsed and
before disk reservation, quarantine creation, or any pack byte is read. The core independently requires the request,
active ref state, object format, and parsed trust policy to identify the same
exact state. A repository name, key identity, stored signature, or successful
transport authentication cannot authorize the operation. The injected service
may retain signing keys and its policy database in another protection domain;
no private key is returned through this interface.

`DurableDetachedHybridCommitVerifier` is the concrete Linux proof-retrieval
adapter. It looks up an immutable detached proof with the complete
`ProtectedHistoryContext`, then authenticates both signatures and binds the
opaque result to the exact commit bytes. A digest-derived filename remains only
a lookup accelerator. Missing, corrupt, substituted, wrong-generation, or
wrong-context records fail as signature verification failures and cannot reach
ref activation.

The older separately injected `execute` and `execute_policy_classified` methods
remain useful test and lower-level composition surfaces. An edge selecting the
production protected profile should use `execute_with_authority`, because it
places exact policy authorization, proof verification, and authenticated
receipt creation behind one explicit capability-bearing service boundary.

`RemoteProtectedReceiveAuthority` is the Git-core client adapter for that
boundary. Its transport must authenticate operation, request identifier, peer,
request, and response. Only an authenticated empty success response can mint
the crate-private exact commit proof. Receipt verification is mutable because
the remote channel consumes a strictly advancing request identifier; the
durable receipt path always calls remote verification after signing and again
when reopening a stored receipt.

Protected HTTPS receives use the explicit `mrml-proof-v1` and
`mrml-receipt-v1` capabilities. The
receive discovery additionally returns one canonical
`mrml-receive-context=<repository>:<trust>:<revocation>` line sourced from the
authenticated active repository state. The client rejects missing, duplicate,
zero, non-canonical, or extra generation fields and re-runs discovery before
upload so a signer result cannot be silently replayed after rotation.
After durable activation, the server returns the complete authority-signed
receipt as one bounded binary packet-line inside the negotiated report-status
response. It never emits a receipt for a failed update. The protected client
requires exactly one structurally authenticated container before accepting the
response; cryptographic verification and monotonic signer-state advancement
remain a separate signer-bound operation so the Git client never receives
receipt-signing authority.

`ProtectedCommitProofSigner` is limited to exact commit proof creation. Its
production composition, `CapabilityVerifiedProofSigner`, treats isolated
provider output as untrusted and independently verifies OpenPGP v6 and
ML-DSA-65 over the canonical repository-, purpose-, generation-, and
payload-bound transcript. `sign_protected_introduced_history` uses the same
bounded graph verifier as the server, including merge-side ancestry, and emits
one strictly sorted record per introduced commit. The server consumes every
record exactly once while reading authenticated quarantine objects, installs
it through the authority's narrow operation, and refuses activation if any
proof is missing or unused.

This change introduces no new codec, similarity search, compression selection,
or garbage-collection mechanism. Patent review: **NOT_TRIGGERED**; the work is
conventional capability injection and exact-context signature/receipt
verification. See `docs/patents/REVIEW_LOG.md`.
