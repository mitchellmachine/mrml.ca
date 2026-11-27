# Gitd certificate-service channel

Status: **PARTIALLY IMPLEMENTED**.

Gitd now has a concrete client for the shared certd version-1 Unix channel. It
connects with the exported bounded transport, authenticates the observed certd
peer and the claimed peer with the purpose-limited channel capability, enforces
the Gitd role's operation allowlist, binds every response to the exact operation
and monotonically increasing request identifier, and rejects sequence
exhaustion. Health succeeds only for the exact authenticated `ready` payload.

The Gitd client now also constructs a canonical hostname-bound identity request
and strictly decodes the bounded `MRGIDS01` snapshot payload. The response must
contain the exact requested lowercase DNS name, a nonzero identity generation,
one to eight bounded DER chain entries, a nonzero leaf-SPKI SHA-256 digest, an
ordered validity interval, one to eight strictly ordered nonzero signature
schemes, a nonzero publication digest, and the exact ready state, with no
trailing bytes. Gitd then independently verifies the system-trusted chain,
server-auth purpose, exact hostname, current certificate validity, snapshot
validity interval, leaf SPKI digest, exact P-256/SHA-256 scheme policy, and
canonical publication digest. A previous published generation must be strictly
lower for a changed publication. An unchanged refresh must exactly match the
already installed generation and publication digest after full validation.
The presented chain's intersected validity interval is retained with the TLS
configuration and checked whenever a new handshake acquires a snapshot.

The CertificateVerify client operation is purpose-limited to the active
identity generation, TLS `ecdsa_secp256r1_sha256`, one exact 32-byte transcript
hash, and a nonzero logical request identifier in addition to the authenticated
channel sequence. Its response must repeat the generation, scheme, and logical
request and contain one bounded canonical ECDSA DER signature. Long-form,
negative, redundantly padded, oversized, truncated, substituted, or trailing
signature encodings fail closed. The client offers no generic signing method.

Before dependency readiness, Gitd derives a domain-separated test transcript
from the snapshot generation, publication digest, and hostname, requests the
purpose-limited CertificateVerify operation, and verifies the returned
canonical DER signature with the leaf certificate under the TLS library's fixed
TLS 1.3 server context. The TLS verifier itself constructs that context; neither
side gains a generic-message signing or verification shortcut.

After validation, `build_certd_tls_server_config` consumes the validated
snapshot and the authenticated certd client. It constructs an exact-SNI TLS
configuration from the DER chain and installs a `TlsServerSigningKey` that owns
no private key: each handshake forwards only the 32-byte transcript digest,
active identity generation, fixed ECDSA scheme, and a process-monotonic logical
request ID through a mutex-serialized certd channel. Sequence exhaustion,
poisoning, channel failure, wrong generation/scheme/request, or oversized output
fails the handshake. Existing TLS configuration has no PEM or local-key
fallback.

Generation notification is a bounded request containing the exact current
nonzero generation and a 1–30,000 ms wait. The authenticated response either
reports an unchanged generation as a timeout or a strictly greater generation
as a change. Zero, rollback, inconsistent state, and trailing bytes fail closed;
the notification itself does not publish identity material.

The production rotation worker no longer terminates Gitd after one transient
certd failure. Any channel or identity-refresh failure independently degrades
the certificate dependency, blocks acquisition of new TLS configuration
snapshots, and leaves already validated connections available to drain. The
worker retries channel failures with interruptible jittered exponential backoff
starting at 250 ms and hard identity/generation/TLS failures starting at five
seconds; both cap at 30 seconds. An unchanged authenticated generation wait
does not itself re-enable handshakes: Gitd fetches and validates the current
identity, checks its exact installed binding, and proves the actual signing
channel before resuming. A strictly newer validated identity is installed
atomically with its publication and validity interval. Authentication and
certificate degradation use separate readiness bits, so recovery of one cannot
hide continued failure of the other. Diagnostics expose only the failure class,
bounded consecutive count, and delay. Refresh metrics count attempts, genuine
wait timeouts, activations, channel failures, and validation failures without
containing identity or key material. Successful unchanged metrics now mean a
validated unchanged refresh, not proof that certd actually waited. The rotation
worker enforces a one-second monotonic minimum attempt interval and checks stop
within 100 ms sleep slices; a real wait consumes that interval. Initial startup
also waits with bounded interruptible backoff for identity readiness rather than
depending on Compose ordering. It opens no Git listener before validation and
signing proof succeed.

## H2 revocation policy and limits

The base release keeps H3 disabled. H2 does **not** universally require an OCSP
staple. Let's Encrypt ended its OCSP service on August 6, 2025 and provides
CRLs instead; an invented staple is not an acceptable substitute. See the
[CA's announcement](https://letsencrypt.org/2025/08/06/ocsp-service-has-reached-end-of-life).

Gitd verifies chain trust, exact hostname, certificate and snapshot validity,
SPKI/publication binding, and constrained signing. Its current signing route
does not carry certificate status responses. Certificates with a nonempty
TLS Feature requirement are therefore rejected, including status_request /
status_request_v2 (Must-Staple), instead of silently ignoring their requirements.
This is a conservative profile limit, not full support for every TLS Feature.
See [RFC 7633](https://www.rfc-editor.org/rfc/rfc7633.html).

The native H2 TLS client validates a received OCSP staple through its existing
verifier. This pass does not add online CRL retrieval, a general revocation
subsystem, or a configurable CA-policy engine; those are not claimed. An owner
policy requiring unavailable revocation evidence needs that evidence path
before deployment, not an insecure-TLS escape hatch. H3's separate existing
OCSP requirement is not qualification of H3 or changed by this H2 work.

The written readiness, real-custody test and certificate-owner lifecycle handoff
is [CERTD_CONSUMER_HANDOFF_2026-09-04.md](CERTD_CONSUMER_HANDOFF_2026-09-04.md).

There is no PEM, embedded-key, self-signed, plaintext, or development-identity
fallback. Production-process outage/recovery testing with the deployed certd
remains required; focused tests establish the state, readiness independence,
handshake blocking, metric initialization, and deterministic backoff bounds.

The daemon's native dependency check composes certd health with authority
health only after configuration and storage validation. Authority and certd use
separate monotonic request counters and separately owned capability files; one
service's success cannot substitute for the other's failure.

Focused hosted Linux evidence:

- `./target/debug/mrml test org.mrml.service.gitd --target linux`: 16 tests
  passed, including real authenticated authority and certd Unix socket
  exchanges with kernel-observed peer credentials, plus exact snapshot parsing,
  hostname substitution, rollback-generation, trailing-byte, and canonical-name
  refusal, and generation/scheme/request/canonical-DER CertificateVerify
  response binding, plus distinct bounded timeout/change and rollback refusal
  for identity-generation waits.
- `./target/debug/mrml test org.mrml.library.tls --target linux`: 33 tests
  passed after adding the fixed-context leaf verification boundary. Optional
  externally configured certificate tests remain environment-dependent and are
  not claimed as exercised here.
- `./target/debug/mrml manifest lock --check`: 70 packages, 5 interfaces, 205
  compile edges, and 185 package edges passed after adding the explicit certd
  dependency.

Patent review: **NOT_TRIGGERED**. This increment composes the existing bounded
Unix-domain transport, peer credentials, HMAC authentication, role allowlist,
and monotonic request binding. See `docs/patents/REVIEW_LOG.md`.
