> Historical record. Current results: [final completion](FINAL_COMPLETION_2026-09-05.md).

# Gitd certificate-consumer validation — 2026-09-04

Status: **TESTED locally; BLOCKED_EXTERNAL_INPUT for real certd enrollment,
outage/recovery and rotation**. These results use the dirty checkout based on
`20ecf53e213d1211e2ea41865e1df31cdc59d9a731e29f46c046a3ad5e09d3f5`, not a clean
release. No public issuance, DNS configuration, Docker Compose acceptance or
external audit is claimed.

## Issue and changes

The real certd generation-wait response can immediately report no change.
Gitd previously looped without delay on that success and allowed blocked new
handshakes without rechecking the identity or signing channel. The regression
failed against that implementation (55 passes, one failure, one ignored child).

Changed production files are under `packages/services/gitd/src/`:

- `tls_identity.rs`: one-second monotonic minimum poll interval, minus time
  already spent waiting, with stop checks and sleeps of at most 100 ms;
  unchanged replies trigger a fresh validated snapshot and independent signing
  proof; installation and re-enablement bind exact generation/publication;
  current-time validity gates every new handshake snapshot.
- `identity.rs`: stores the intersection of the presented certificate-chain
  validity intervals and enforces the unstapled H2 TLS Feature profile.
- `main.rs`: applies successful-poll pacing and waits for independently checked
  identity readiness before binding the listener. Existing signal handling and
  bounded error backoff are retained.
- `lib.rs`: exports the shared pacing helper and includes regression tests.
- `packages/libraries/tls/src/x509.rs`: bounded TLS Feature inspection. Absent or
  empty requirements are permitted; status_request/status_request_v2 fail with
  missing OCSP, other nonempty requirements fail unsupported. Malformed DER
  fails closed. This is the Gitd unstapled-server profile, not a general client
  TLS Feature or CRL subsystem.

Test-only files: `tls_refresh_tests.rs`,
`packages/tests/gitd-certd-fixture/src/probe.rs` and `real_enrollment.rs`.
The enrollment probe uses the actual authenticated ACME-role CSR/candidate/
activation protocol and never exports certd's private TLS key.

## Exact tests and results

```sh
target/release/mrml test org.mrml.service.gitd --target linux
target/release/mrml test org.mrml.service.gitd --target linux --release
target/release/mrml test org.mrml.service.gitd --target linux --sanitizer address
target/release/mrml test org.mrml.library.tls --target linux
```

Each Gitd run passed **57 library + 8 daemon + 1 backup tests**, with two
explicitly ignored fixtures. The negative child is invoked by its passing
parent; the positive environment-dependent test is executed separately below.
TLS passed **35 tests**. AddressSanitizer actually executed; no finding.

```sh
target/mrml-native/linux/release/mrml_gitd_tests --ignored --exact \
  tls_refresh_tests::successful_unchanged_refresh_with_ephemeral_openssl_identity \
  --nocapture
```

This explicit optimized test passed: four immediate unchanged refreshes, 12
RPCs (wait, snapshot, signing proof per attempt), 3,396 ms elapsed, 160 CPU ticks
at 100 Hz for the whole client-plus-mock process, zero descriptor growth,
and joined server thread. The steady scheduling policy permits one attempt
per second; the four-endpoint sample is not a precise steady-state RPC-rate
measurement. The unoptimized equivalent passed in 21,321 ms with 2,129 CPU
ticks; debug cryptographic cost is not production daemon CPU evidence.

A fresh child process scopes the disposable public root and real MRML P-256
signing implementation. It is an authenticated mock certd channel, explicitly
**not real certd service completion**. Negative modes cover malformed snapshot,
invalid certificate, valid identity with failed signing, altered publication at
the same generation, and expired identity. Expiry fixture time changes also
invalidate its issuer signature; the test proves rejection, not an independently
valid expired-chain signature. Store tests exercise validity-bound admission.
Stop-before-delay and already-elapsed polling paths are tested; active RPC
shutdown latency and established-work behavior during real outage remain
**NOT_RUN**.

Logs: `/tmp/mrml-git-completion-c-current.log`, `-release.log`, `-asan.log`,
`-tls.log`, `-success.log`, and `-release-success.log` with the same prefix.

## Real service result and handoff

The freshly built real certd image exited before opening sockets. Its trust-root
loader passes a 65,536-byte maximum to a reader that rejects limits above 16,384
bytes before reading the file. A valid 652-byte disposable CA cannot avoid this
source defect. The image and binary identities, exact build commands, fixed
service paths/roles, and additional restart/readiness blockers are recorded in
[the certificate-owner handoff](../edge/CERTD_CONSUMER_HANDOFF_2026-09-04.md).
No certificate/ACME production code was overwritten. CSR import and rotation
remain visibly unexecuted until that owner supplies the fixes.

The implemented revocation profile and limitations are documented in
[CERTD_CHANNEL.md](../edge/CERTD_CHANNEL.md). No universal OCSP staple is imposed
on H2; no evidence required by configured policy may be invented. HTTP/3 remains
disabled in base Compose. Existing accepted connections retain their policy;
new handshakes are the scope of this consumer's admission gate.

Agent security review found no remaining blocking consumer issue; it is not
independent human audit. Patent review: **NOT_TRIGGERED** — bounded polling,
existing PKIX checks and existing channel proofs, not a new cryptographic
mechanism. See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
