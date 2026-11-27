# Linux deployment adapter

Status: **PARTIALLY IMPLEMENTED** as a deployment platform. The image-only base
[Git Compose profile](../../../deploy/compose/compose.git.yaml) publishes TCP
443 to Gitd's internal port 8443. Bounded TLS 1.3/HTTP/2, offline image loading,
protected Git operations, cold backup and fresh-target restore were exercised
by the [dated hardened Docker run](../operations/FINAL_COMPLETION_2026-09-05.md).
HTTP/3/UDP is not published in that base profile; QUIC source and separate
hosted listener probes do not change that. Public activation is unverified.
See the [current checkpoint](../operations/CURRENT_COMPLETION.md) for status.

## Adapter mechanisms and development evidence

The earlier package and host tests below retain their recorded evidence scope.

A bounded filesystem-backed persistent cache adapter is implemented with
file-and-directory durability barriers and quota pruning. Its root is supplied
by deployment policy; the adapter does not select a host path or grant access to
one. No systemd unit, namespace/seccomp profile, privileged-port handoff, cache
directory provisioning/confinement policy, log retention policy, or public-host
deployment has been verified. Hosted Linux package tests do not establish
production deployment.

`Dockerfile.gitd` and `Dockerfile.git-authority` use digest-pinned verification
and distroless runtime stages, copy only their respective prebuilt executable,
and run as fixed unprivileged `21001:21001` and `21002:21002` identities. They
do not embed configuration, repository data, trust/proof state, receipt keys,
certd material, ACME credentials, or build tools. The static
`deploy/compose/test-git-images.sh` gate verifies pinned stages, intended users
and entrypoints, and rejects representative cross-service secret/binary
references. It passed under hosted Linux. That static gate did not exercise containers. For actual image loading and
runtime evidence, consult the [dated hardened Docker run](../operations/FINAL_COMPLETION_2026-09-05.md).
Public-network and physical-host support are not inferred from it.

`GitdBoundListeners` now provides atomic process ownership of TCP and UDP on one
exact configured IPv4 port. It validates the QUIC endpoint's 65,536-connection
ceiling, binds TCP, resolves the actual port (supporting isolated ephemeral test
binds), and binds the QUIC endpoint to that same port; any port/UDP/QUIC failure
drops the partial TCP listener and returns no bundle. A hosted loopback test
proved simultaneous TCP/UDP ownership and over-limit refusal. HTTP/2 and HTTP/3
now dispatch to the same authenticated backend. QUIC admission uses an
authenticated Retry before substantial connection state. Fatal dependency or
listener failure marks readiness false and enters worker drain. The Linux
daemon blocks SIGINT/SIGTERM before worker creation, consumes them in one
synchronous waiter, wakes both listeners, stops admission, marks readiness
draining, stops certificate rotation, and joins the HTTP/2 and HTTP/3 worker
pools. Connection I/O deadlines use the configured bounded drain interval.
These listener and drain mechanisms passed package tests. The separate dated
Docker record also reports container stops and recreation. Gitd's native Compose health command
performs a fresh loopback TLS 1.3 handshake, authenticates the configured
server name through the project trust policy, and requires negotiated HTTP/2;
it loads no private key and does not use curl or a shell. The authority health
command now performs a bounded authenticated request over its production Unix
socket using the authority-side channel capability. The listener admits that
exact authority UID only for `Health`; Gitd remains the sole peer admitted for
receive, ref, proof, and receipt operations.

The base production Compose file publishes TCP 443 only and starts Gitd without
the HTTP/3 flag. Both startup and every later certd identity refresh install
only `h2` ALPN in that mode. The explicit HTTP/3 mode installs `h2` plus `h3`
and owns the paired UDP listener, but it is not enabled by the base production
candidate. Thus certificate rotation cannot silently turn an H2-only process
into an H3-advertising process.

The authority's selected protected policy is not a second deployment copy.
Compose mounts Gitd's policy root read-only into the networkless authority and
passes the exact `MRML_PROTECTED_REPOSITORY` separately. The authority validates
that canonical identity and derives its path beneath the fixed root; Gitd opens
the same policy through its catalog-derived path. Authority-owned detached proofs
remain under the matching repository identity in authority state. This release
profile binds selected repository identities to exact state; a name selects state
but grants no authority. Startup fails on policy, generation, key or catalog
mismatch. The later catalog and Docker acceptance include two protected
repositories under a shared authority generation store.

Before UDP admission, the endpoint receives a distinct generated retry key and
nonzero generation. Gitd configures a 30-second one-use retry-token manager,
bounded half-open/per-IPv4/memory admission, and the shared resource controller
from that secret. The secure loader accepts only one exact 16-byte, Gitd-owned,
nonsymlink regular file with private owner-only mode. Hosted tests prove the
valid file and reject group-readable mode. Retry state does not grant repository
or application authority.

[The offline bundle builder](../../../deploy/compose/build-offline-git-bundle.sh)
accepts profile `v5` (five Git-related images) or `v6` (adds certd and the Git
client). It requires exact local Cosign key files, a clean source tree, focused
checks, SBOMs, exact image identities and offline signatures. The separately
provisioned verifier must anchor trust in an independently selected public key,
not in a key trusted simply because it arrived in the bundle. The dated `v6`
acceptance verified and loaded seven exact images. See
[offline trust provisioning](../operations/OFFLINE_TRUST_ROOT.md).

Release construction also requires `GIT_STREAMING_EVIDENCE` from the exact
source commit. The evidence must be produced by the bounded 256 MiB-or-larger
real-stack measurement harness, pass its inner SHA-256 manifest, and include
process samples and a peak/growth summary. Both the builder and offline verifier
enforce this gate, so an unmeasured image cannot be represented as the complete
Git release artifact.

[Cold backup](../../../deploy/compose/backup-git.sh) requires stopped Gitd and
authority volumes and creates and verifies an authenticated encrypted backup
generation. [Restore](../../../deploy/compose/restore-git.sh) requires an unused
`mrml-git-restore-*` namespace, checks the backup generation, and restores into
new named volumes without enabling services. A failed restore leaves the new
namespace invalid; complete recovery and validation before explicit activation.
The dated Docker run exercised restore without the source volumes. The image
switcher uses preloaded image tags and records the version only after health
checks. Image rollback does not rewind repository data or security generations.

Repository creation is an explicit stopped-service administration operation.
`initialize-git-repository.sh owner/repository` runs a one-shot Gitd container,
requires the exact identity to already exist in the authenticated deployment
catalog, derives all five storage paths from that identity, and creates a
SHA-256 repository with a deterministic empty root commit and authenticated
generation-1 pack-set/ref state. It refuses existing repository leaves and
removes leaves created by the failed invocation when initialization or final
admission verification fails. The initial commit carries no authority;
protected-branch policy and authority state remain separate deployment gates.
Hosted package tests exercise initialization, reopen/admission, exact generation
matching, and repeat-initialization refusal. They are not crash-recovery or
physical-storage evidence.

Patent review: **NOT_TRIGGERED**. Digest-pinned multistage containers,
unprivileged users, minimal copied artifacts, and static image-policy checks are
conventional deployment hardening. See `docs/patents/REVIEW_LOG.md`.
