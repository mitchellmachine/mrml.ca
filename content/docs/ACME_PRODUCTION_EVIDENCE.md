# ACME and TLS identity production evidence

Evidence date: 2026-09-02
Target: Linux x86_64, Docker Compose
Component classification: **production candidate pending external runtime gates**

This file records executed evidence, unavailable environments, and remaining
implementation work. An unavailable gate is not a pass. Unit, deterministic
local-authority, hosted-process, container, public-CA, combined-stack, and
physical evidence are distinct.

## Executed gates

| Gate | Command | Result |
| --- | --- | --- |
| Manifest lock | `./target/debug/mrml manifest lock --check` | PASS: 70 packages, 5 interfaces |
| Manifest graph | `./target/debug/mrml manifest check` | PASS: 70 components, 209 dependencies |
| Certificate release build | `./target/debug/mrml build org.mrml.service.certificate --target linux --release` | PASS |
| Certificate focused tests | `./target/debug/mrml test org.mrml.service.certificate --target linux --release` | PASS: 137, fail: 0 |
| ACME service release build | `./target/debug/mrml build org.mrml.service.acme --target linux --release` | PASS |
| ACME service focused tests | `./target/debug/mrml test org.mrml.service.acme --target linux --release` | PASS: 14, fail: 0 |
| ACME library release build | `./target/debug/mrml build org.mrml.library.acme --target linux --release` | PASS |
| ACME library focused tests | `./target/debug/mrml test org.mrml.library.acme --target linux --release` | PASS: 81, fail: 0 |
| Security fuzz release build | `./target/debug/mrml build org.mrml.test.security-fuzz --target linux --release` | PASS with unrelated GPU warnings |
| Security fuzz tests | `./target/debug/mrml test org.mrml.test.security-fuzz --target linux --release` | PASS: 9, fail: 0 |
| Compose static policy | `deploy/compose/test-compose-acme.sh` | PASS |

The ACME library tests include a deterministic first-party local authority and
cover complete issuance, fresh-nonce rebuilding after `badNonce`, lost-response
recovery, account lookup/update/rollover, EAB, revocation replay, DNS-01 binding,
and strict origin/redirect handling. This is local in-process protocol evidence,
not a real-container or public-CA result.

Certificate tests cover keyed durable records, encrypted use-only P-256 keys,
candidate validation and activation, constrained TLS signing, Unix peer and
channel authentication, renewal/ARI/backoff, crash-boundary recovery, backup
container creation/verification/clean-target restoration, and generation hot
reload. Hosted Unix-socket tests ran with explicit sandbox elevation. They do
not prove the Docker namespace or mount configuration.

## Unavailable external gates

| Required gate | Classification | Exact reason |
| --- | --- | --- |
| Image build and inspection | NOT RUN — ENVIRONMENT UNAVAILABLE | `docker` is not installed on this host. No image ID or runtime inspection evidence exists. |
| SBOM production | NOT RUN — TOOL UNAVAILABLE | `syft` is not installed. |
| Offline image signing | NOT RUN — TOOL/CREDENTIAL UNAVAILABLE | `cosign` and an offline signing key are unavailable. |
| ShellCheck | NOT RUN — TOOL UNAVAILABLE | `shellcheck` is not installed; POSIX `sh -n` and focused behavior checks were run instead. |
| Root host provisioning | NOT RUN — AUTHORITY UNAVAILABLE | `sudo` requires an interactive password. The explicit disposable `/tmp` attempt created no files. |
| Public-CA staging issuance | NOT RUN — CONFIGURATION/CREDENTIAL UNAVAILABLE | No explicitly approved staging account, domain, authoritative DNS zone, or scoped provider credential was supplied. |
| Combined Gitd/certd Compose gate | NOT RUN — ENVIRONMENT UNAVAILABLE | Docker and the real combined running stack are unavailable. Static interface tests do not substitute for TLS handshakes, clone/fetch/push, hot rotation, or restart evidence. |
| Image upgrade/rollback runtime exercise | NOT RUN — ENVIRONMENT UNAVAILABLE | Immutable images cannot be loaded or started without Docker. |
| Native Windows production certification | DEFERRED | Outside this Linux production target and explicitly deferred by the task. |
| Physical hardware | NOT RUN / NOT APPLICABLE | No physical-hardware claim is made for this hosted Linux service. |

## Backup and restore implementation

The shared certificate library implements authenticated backup containers,
bounded transfer, verification, and clean-target restore with focused tests.
The hosted Linux layer now additionally implements bounded AES-GCM component
archives derived from the distinct backup capability. It authenticates exact
role, generation, sorted paths, modes, per-file digests, file count, and the
complete plaintext digest; source and input scans reject symlinks, hard links,
unsafe modes, traversal, duplicates, oversized files/scans, wrong roles, wrong
keys, and ciphertext substitution. Secret-bearing scratch is cleared.
Stopped-service `backup-create` and `backup-verify` commands are wired into both
production binaries. A combined HMAC manifest re-verifies and binds both exact
ciphertexts, roles, generations, file counts, and plaintext digests.
`backup-acme.sh` stops both daemons, creates the two same-generation components
under their respective UIDs, creates and verifies the combined manifest, and
restarts the services on success or failure.

`restore-acme.sh` requires an empty root-owned mode-`0700` target under `/mnt`,
authenticates the combined manifest before writing, and restores each component
under its distinct service UID. The restore implementation creates only
canonical archive paths with no-follow/exclusive semantics, reopens and hashes
every restored regular file, applies the authenticated mode, syncs files and
directories, and returns a generation/content-bound HMAC receipt. Partial
failure leaves a nonempty target that cannot be silently reused. The operator
compares the two certd-acmed channel-capability copies and runs offline service
validators. Certd re-authenticates its use-only key descriptors, active durable
certificate state, current validity, and publication digest. Acmed
re-authenticates its active account and renewal schedule against the reviewed
configuration. The helper never starts services or selects the target.

The Gitd-side peer capability and reviewed non-secret deployment configuration
belong to the combined system recovery set and must be installed before target
selection. This environment could not execute the Docker restore workflow, so
its runtime result remains covered by the unavailable combined-stack/container
gates above rather than being claimed as passed.

`backup-auth.key` is separately provisioned as equal mode-`0400` copies for the
certd, acmed, and administration identities. The service copies are mounted
only into stopped-service one-shot backup and restore operations, never either
long-running daemon. A root `tar` wrapper is not used because it would bypass
the use-only provider boundary and would not prove record/key/generation
consistency before activation.

Until the external gates are exercised, the accurate classification is
**ACME/certd production candidate pending external runtime and Gitd integration
evidence**, not complete-stack production-ready.

## Security and IPR residuals

No independent security audit or independent cryptographic review has been
performed. Avoidable secret copies are erased and production keys are use-only,
but no independent constant-time claim is made. Compose cannot enforce
destination-aware egress; deployment requires host or upstream policy for the
approved ACME and DNS-provider origins.

Patent review: **NOT_TRIGGERED** for continued scoped engineering, including
the hosted component archive and clean-target restore. They compose the repository's existing
AES-GCM, HMAC-SHA-256, bounded canonical encoding, and durable file-safety
mechanisms without introducing a new cryptographic or network-validation
mechanism. See
[`patents/ACME_CERTIFICATE_REVIEW_2026-09-01.md`](patents/ACME_CERTIFICATE_REVIEW_2026-09-01.md)
and [`patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md). Formal legal FTO was not
performed.
