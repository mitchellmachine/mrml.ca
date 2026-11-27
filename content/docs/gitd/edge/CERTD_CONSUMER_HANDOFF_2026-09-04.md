# Gitd / certd completion contract — 2026-09-04

Status: **SOURCE_VERIFIED requirements; implementation/test work in progress**.
This is the written handoff to the separately owned certificate/ACME work.
The owner subsequently authorized this task to fix the listed certd defects.
The public reader, listener recovery, bounded I/O, shutdown and lifecycle-health
fixes are now implemented and locally tested; channel V1 is preserved. Follow
[the current continuation](../operations/DOCKER_MIGRATION_2026-09-05.md) for
real enrollment and additional production-path findings. Findings below retain
their original evidence and are not all current blockers.

## Readiness and lifecycle

- **Lifecycle-ready**: certd has opened/authenticated its key store and its ACME
  RPC channel can accept enrollment, even without any certificate.
- **Identity-ready**: a currently valid, exact hostname-bound certificate chain
  and the matching constrained signing capability are available.
- acmed waits for lifecycle readiness, never for the certificate it must obtain.
- Gitd independently waits for identity readiness and verifies chain, hostname,
  current validity, publication/key binding, and a real constrained signer proof.
  Compose ordering alone is not identity authority.

The current real daemon's ACME-role Health RPC accepts the enrollment-ready
state. Its CLI `health` additionally requires PID 1 and a valid active identity.
Compose readiness must not create an ACME/certificate circular dependency.
An agreed dedicated lifecycle health command or authenticated ACME-role health
probe must preserve that distinction.

## Existing generation-notification contract

The unchanged version-1 response is an authenticated observation, not proof
that a requested wait duration elapsed, the certificate remains valid, or the
signer is available. Gitd must enforce a monotonic, interruptible minimum poll
interval, subtracting time already spent in the RPC. A future genuine bounded
certd wait remains compatible; Gitd must not sleep a second full interval.

Before resuming handshakes after an unchanged response, Gitd re-fetches and
fully validates identity, checks its exact installed generation/publication
binding, and proves the actual signing channel. Refresh/wait and handshake
signing retain independent locks/connections. Generation rollback, invalid or
expired identity, failed signing, or altered same-generation publication remain
fail closed. Existing accepted connections follow the documented drain policy.

## Source-verified certd-owner blockers

These are findings, not authorization to overwrite that owner's code:

1. `certd_channel_unix.rs`: listener bind rejects an existing socket pathname.
   The listener has no shutdown cleanup, and `certd_hosted_main.rs` has no
   signal-driven graceful listener teardown. Restart in the same named runtime
   volume leaves stale socket paths. The owner must implement an exact-owner,
   exact-type/inode checked recovery and teardown protocol; never blindly unlink
   a path or replace an unrelated listener. Gitd must reconnect to the same
   namespace without container recreation or replacing the socket volume.
2. `certd_hosted_main.rs::serve_channel` exits on any `listener.accept()` error,
   including rejected peer credentials. One unauthorized peer must not terminate
   an otherwise healthy service channel. Preserve refusal and continue bounded
   service, distinguishing terminal listener errors.
3. Fresh-install CLI health currently conflates lifecycle and identity readiness
   as described above. Expose the distinction in the merged Compose health cycle.

4. **TESTED startup blocker:** `load_trust_roots` passes
   `MAX_CERTIFICATE_CHAIN_BYTES = 65_536` to `HostedSecret::open`, whose
   `MAX_HOSTED_SECRET_BYTES = 16_384` rejects that limit before opening any file.
   A valid 652-byte root-owned mode-0444 disposable CA therefore cannot start
   the daemon. Coordinate a bounded public-certificate reader or a compatible
   admitted limit with the certificate owner; do not weaken ownership checks.

The fresh canonical release binary SHA-256 was
`f6628791e9190e3c931feb1c46e2fdf323bfc51bcb5228ae8555340dfda906c1`.
`target/release/mrml build org.mrml.service.certificate --target linux --release`
passed. `podman build --pull=never --network=none -f
deploy/compose/Dockerfile.certd -t localhost/mrml-completion/certd:c-20260904 .`
passed using cached pinned bases. Image ID:
`72a972f2cc57453538b719ecf3a4d53c3f4fbe906ede78f91fe664f4a6704728`.
The disposable local container `mrml-completion-c-real-certd` used UID/GID
21003, supplementary socket groups, no network, read-only root, cap-drop ALL,
no-new-privileges, 64 PIDs, 256 MiB and one CPU. It exited **1** with
`mrml-certd: unsafe certd trust roots`, before either socket existed.
This was supplemental Podman execution, not Docker Compose acceptance.
Test-only enrollment commands in `packages/tests/gitd-certd-fixture/src/real_enrollment.rs`
built successfully but their CSR/import/rotation calls remain **NOT_RUN**
because the real service did not start. No fixture server was substituted.

These block a claim of complete real-daemon outage/recovery until the owner's
fixes and exact integration results are available. No restart success is inferred
from unit tests or from the test-only certd fixture.

## Real-custody test sequence

Use isolated fixed paths and service identities (certd 21003, Gitd 21001,
ACME/test enrollment client 21004), distinct channel capabilities, and empty
disposable state. Never populate workstation-wide `/etc/mrml` service paths.

1. Start the actual `mrml-certd serve` with `directory_class="local-test"`.
2. Request public key / CSR through authenticated ACME-role operations 18/19.
   Certd generates and retains its TLS private key in the encrypted store.
3. Sign the returned CSR with a disposable test CA. No fixture TLS private key
   or embedded development signer substitutes for certd custody.
4. Send StageCertificateCandidate (20), then ActivateCertificateGeneration (21),
   with exact candidate, chain, request, identifier, policy and generation
   bindings. Existing protocol encoders remain the shared contract.
5. Gitd verifies the real channel, identity, signing proof, and verified H2.
6. Exercise outage and recovery in the same socket namespace, then activate a
   new certificate generation with a different serial and verify new connections.

Certd's public CA file is `/etc/mrml/certd/acme-trust-roots.pem`, root-owned
mode 0444, with its exact SHA-256 bound by `trust_store_sha256`. Gitd and the
test client can use process-local `MRML_CA_BUNDLE` pointing at that public root;
this supplements existing system trust and does not modify host trust. No
private release key, production identity or DNS credential is requested.

Patent review: **NOT_TRIGGERED**. This handoff specifies existing channel,
identity validation and lifecycle boundaries. See
[REVIEW_LOG.md](../../patents/REVIEW_LOG.md).

### 2026-09-05 authenticated request reordering contract correction

Gitd clones allocate request IDs atomically before opening their independent
Unix sessions. Allocation order is not arrival order. The certd V1 frame format,
capability, observed peer, operation policy and MAC checks remain unchanged.
After these checks, certd admits each nonzero ID once within a fixed 64-position
sequence window. IDs at least 64 behind the highest authenticated ID and exact
replays fail closed. Invalid authentication cannot move the window. This bound
is sequence distance, not a promise to tolerate arbitrarily delayed calls.
Authenticated IDs remain consumed even when a later semantic operation fails.
Signing does not acquire a wait connection lock.

The replay scope is the running certd role channel, retained across reconnects;
Gitd retains durable request-ID leases across its own restarts. A fresh test
Gitd state root must not reuse an already-active channel replay scope below its
high-water mark. The before-writer benchmark did so: its persisted lease end
was 4294967297 versus the restored client's 25769803777. Restarting the retained
disposable certd process restored readiness without editing durable state.
This fixture correction is separate from the demonstrated arrival-order bug.
Historical TLS failures are not attributed to that bug without exact evidence.

Focused normal and AddressSanitizer suites pass 149 library and 7 daemon tests.
The original strict implementation failed both new reordered-frame and window
boundary regressions (145 pass, 2 fail). Further tests cover all 64 positions,
small and large advances, exhaustion, duplicates, and invalid high-ID MAC,
peer and role inputs. Independent agent adversarial review checked the bounded
arithmetic and authentication ordering; this is not an external human audit.
