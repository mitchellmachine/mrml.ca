# Linux deployment adapter

Status: **PARTIALLY IMPLEMENTED**. The image-only Compose fragment, safe host
provisioner, separate minimal images, offline release recipe, cold backup and
restore, and immutable image upgrade/rollback operators exist. `mrml-gitd`
composes authenticated repository recovery, authority and certificate channels,
one TLS-generation store, bounded HTTP/2 workers, and the sole QUIC UDP reactor
before reporting application readiness. The host publishes only TCP and UDP 443
to Gitd's unprivileged internal port.

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
references. It passed under hosted Linux. No image build or runtime execution
was performed in this evidence because Docker is unavailable on the current
host. The daemon and Compose service exist, but source-level evidence is not
container, public-network, physical-host, or real-certificate evidence.

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
This path compiled and passed package tests, but a real-process signal test in
the production containers has not run on the current host. Gitd's native Compose health command
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
profile deliberately serves one explicitly selected protected repository per
authority process; the name selects state but grants no authority, and startup
fails if the selected policy, generation, keys, or catalog state disagree.

Before UDP admission, the endpoint receives a distinct generated retry key and
nonzero generation. Gitd configures a 30-second one-use retry-token manager,
bounded half-open/per-IPv4/memory admission, and the shared resource controller
from that secret. The secure loader accepts only one exact 16-byte, Gitd-owned,
nonsymlink regular file with private owner-only mode. Hosted tests prove the
valid file and reject group-readable mode. Retry state does not grant repository
or application authority.

`build-offline-git-bundle.sh` is the offline release recipe for those two
images. It requires a canonical version and new absolute output, exact local
Cosign key files, clean manifest checks, focused authority/Gitd tests, release
builds, network-disabled/no-pull image builds, image identity records, SPDX JSON
SBOMs, offline blob-signature bundles, and a deterministic tar containing the
provisioner and Gitd configuration template. The matching verifier checks every
recorded SHA-256 checksum, requires each identity/SBOM artifact, and verifies
both image archives with the bundled public key. Hosted shell evidence covers
syntax and early invalid-version/output refusal only; Docker, Syft, Cosign, and
the complete offline recipe have not yet run in this environment.

Release construction also requires `GIT_STREAMING_EVIDENCE` from the exact
source commit. The evidence must be produced by the bounded 256 MiB-or-larger
real-stack measurement harness, pass its inner SHA-256 manifest, and include
process samples and a peak/growth summary. Both the builder and offline verifier
enforce this gate, so an unmeasured image cannot be represented as the complete
Git release artifact.

`backup-git.sh` accepts only a stopped stack and captures authoritative Gitd,
authority, policy, receipt, journal, verifier, and secret state while excluding
the disposable cache. Restore accepts only a new empty deployment root, rejects
links and special files, checks the detached digest, preserves numeric
ownership, and reruns provisioning invariants without activating services. The
immutable version switcher requires both preloaded image tags, uses `--no-build
--pull never`, waits for Gitd and the authority to report healthy, and records
the activated version atomically. Rollback changes images only; it never
silently rolls repository data or security generations backward. Root/Docker
execution of these workflows remains unperformed in the current evidence.

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
