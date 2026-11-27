# Git/Gitd completion checkpoint

The protected SHA-256 Git stack is **IMPLEMENTED** for the bounded hosted
TLS 1.3/HTTP/2 profile. The 2026-09-05 clean-source hardened Docker run passed
all thirteen recorded steps, including a real certd outage during established
work, destructive restore into fresh volumes, and recreation. The base Compose
profile leaves HTTP/3 disabled. See the [final dated record](FINAL_COMPLETION_2026-09-05.md)
for its source digest, exact commands, results, and limits, and the
[Linux deployment guide](../edge/LINUX_DEPLOYMENT.md) for the current profile.

MRML source now lives on GitHub with [Ed25519 SSH-signed history](../../human/VERIFY_COMMITS.md).
The historical GPG timeout below describes the dated test checkpoint. It is not
an outstanding GitHub signing step, and the GitHub signatures do not replace
Gitd's protected SHA-256 receipt/signing policy or the offline bundle trust root.
The historical source archive digest is not a Git commit ID. Public activation
is not established by these tests.

## Historical checkpoint log (2026-09-05)

## Source and preservation

- Live Git checkout: `20ecf53e213d1211e2ea41865e1df31cdc59d9a731e29f46c046a3ad5e09d3f5`.
- The checkout was dirty before this work: HTTP/QUIC, Gitd, and Git client
  changes plus untracked `Archive.tar.gz` and `Archive.zip`. They were preserved.
- Tests build the dirty live source, not an authenticated clean release of HEAD.
- Intended A changes: `packages/services/git-authority/src/{main,generation,candidate,lib}.rs`
  and `production_receive_test.rs`.
- Intended B changes: `packages/tools/git/src/{deflate,object,pack,repository_view,lib,compaction_file}.rs`,
  `deflate/incremental.rs`, `compression_oracle_tests.rs`, the Rust compression
  probe and [compression evidence](COMPRESSION_VALIDATION_2026-09-04.md).
- Intended C changes: `packages/services/gitd/src/{main,tls_identity,identity,lib}.rs`,
  `tls_refresh_tests.rs`, `packages/libraries/tls/src/x509.rs`, test-only enrollment
  probe files, consumer contract and [certificate evidence](CERTIFICATE_CONSUMER_VALIDATION_2026-09-04.md).
- D work in progress: HTTP/2 protocol and independent-oracle regressions, real
  TCP admission tests and a test-only empty/private composition helper. Existing
  overlapping dirty hunks remain preserved.
- A separate non-executed deployment remedy is in
  [DOCKER_HOST_REMEDIATION.md](DOCKER_HOST_REMEDIATION.md).
- Changes remain uncommitted while the checkpoint acceptance gates are pending.

## Checkpoint A — production two-repository startup

**Issue:** `load_production_authority_catalog` calls `load_authority` for each
entry using the same generation directory. Each
`LinuxAuthorityGenerationStore::open_capability` independently opens and retains
an exclusive nonblocking flock on `catalog.lock`. The second store conflicts.

**Original regression: TESTED — FAIL, now fixed.** The new
`production_catalog_loads_two_repositories_with_one_generation_root` test creates
real durable policies, proof storage, disposable OpenPGP/ML-DSA keys, and one
generation root. It first successfully loads each repository independently
through the production catalog loader, dropping each catalog. It then loads
both entries together through that same loader and fails at `generation_store`.
The individual controls rule out invalid bootstrap fixtures as the explanation.
The fixture does not overwrite or delete pre-existing test directories.

**Fix: TESTED — PASS (local authority integration).**
`LinuxAuthorityGenerationCatalog` acquires the existing `catalog.lock` once.
Each exact-repository store retains its own reference to that lifetime lock;
dropping the catalog builder cannot release exclusion while a store lives.
Duplicate repository handles are rejected, including after a previous handle
is dropped. Independent per-repository operation mutexes remain unchanged.
Generation APIs now reject a different repository before filesystem access.

Production candidate stores retain an exact repository identity. New artifact
names include the existing full repository digest; one checked journal selects
the namespace for all journal, proof, proof-set, and temporary operations.
Matching legacy records continue in place, preserving pending recovery without
migration. A valid sibling legacy record cannot collide with a new namespaced
record. Ambiguous dual records, malformed records, substituted repositories,
and unsafe files fail closed. A corrupt legacy record whose owner cannot be
determined can still block the same ID in another repository; that is an
explicit fail-closed compatibility limitation. No old state is pruned or hidden
behind an automatic migration.

**Changed files:** `main.rs` (shared production loader and signed lifecycle
regression), `generation.rs` (lock lifetime, exact binding, CAS/process tests),
`candidate.rs` (repository namespace, legacy selection, adversarial tests),
`lib.rs` (catalog export), and this record. All paths are under
`packages/services/git-authority/src/` except this document.

**Exact test command:**

```text
target/release/mrml test org.mrml.service.git-authority --target linux
```

**Results:**

- Initial sandboxed run: **BLOCKED_ENVIRONMENT** at the existing Unix socket
  test (`unix.rs:229`, `Bind`); 12 library tests passed, one failed, daemon tests
  did not run. This is not evidence of a production socket defect.
- Rerun with approved local socket access: 13/13 library tests passed; daemon
  suite had nine passes, one failure (new regression), and one ignored child
  fixture. The process-kill parent test passed. Exit status 1.
- After adding the independent single-repository controls, the same command
  again produced 13/13 library passes and nine daemon passes, one failure, one
  ignored child fixture. Both single-entry production loads succeeded; the
  combined production load failed. Daemon suite elapsed 1.23 seconds. Exit 1.
- `git diff --check`: passed after the test change.
- After the lock fix, 14/14 library tests passed and the extended loader test
  reproduced the next specific defect: creating the same candidate ID for B
  after A returned `Unauthorized`. Namespace isolation then corrected it.
- Final normal suite: **22 library tests passed**, one child fixture ignored;
  **10 daemon tests passed**, one child fixture ignored. Both child fixtures
  are executed by passing parent process tests. Exit 0.
- `target/release/mrml test org.mrml.service.git-authority --target linux --sanitizer address`:
  **22 library + 10 daemon tests passed**, same parent-invoked child fixtures;
  exit 0, no AddressSanitizer finding. This is actual sanitizer execution.
- The extended production loader test uses real repository-bound OpenPGP and
  ML-DSA signatures, candidate proof installation/sealing, activation, receipt
  signing/verification, repeated commit, stale authorization rejection, and
  reopening both completed records and advanced generations. It is daemon
  authority state-machine evidence, **not network push or filesystem ref
  activation evidence**.
- Separate process tests establish catalog-lock retention across builder and
  individual-store drops, second-writer rejection, and admission after the last
  owner drops. CAS, duplicate handles, bootstrap floors, exact-repository
  temporary cleanup, and cross-repository access rejection passed.
- Five new candidate tests cover independent same-ID proofs and lifecycles,
  legacy continuation, reopen, ambiguity/substitution, malformed/symlink state,
  and sibling survival after incomplete transitions or proof corruption.

**Review:** required full readings completed collectively by implementer,
reviewer, and adversary, recovering truncated reads in bounded chunks.
Reviewer and adversary passes found and verified repository binding, lock
lifetime, and consistent legacy selection requirements. This is agent review,
not independent human audit. Owner authority is narrowed, no publisher or
first-party privilege is introduced, and no new external dependency or wire
protocol is added. Existing generation and candidate record codecs are reused.

**Additional local receive acceptance: TESTED — PASS.** The same production
catalog fixture now invokes `production_receive_test.rs`. Two actual SHA-256
repositories ingest separately signed fast-forward commits through
`execute_protected_receive_with_receipts`, using the same candidate ID. Their
real pack storage, active refs, authority generations, and completed receipt
records advance independently. Reopening storage and fetching through
upload-pack preserves exact commit bytes and object IDs. A final production
catalog reload verifies both advanced generations and completed candidates.
The test initially rejected its incomplete hybrid policy fixture with
`Signature`; binding the actual initialization commit as the required hybrid
cutover corrected the fixture. The normal package command above then passed
22 library and 10 daemon tests. The direct catalog RPC adapter is test-only;
this does not establish network transport or signer process isolation.

The added receive path also passed the exact AddressSanitizer package command
above: 22 library and 10 daemon tests. The reviewer found no blocking issue;
the test verifies persisted signed receipts during receive but does not reload
those receipt files after the catalog restart. It is not receipt crash-recovery
evidence.

**Next action:** B is now active after the local sanitizer/review gate.
Carry exact hardened deployment and process-isolated end-to-end acceptance
forward as a visible F environment blocker; do not weaken the deployment
controls to obtain a pass.

## Current common checks

| Exact command | Result |
| --- | --- |
| `target/release/mrml manifest check` | PASS; 71 components, 214 dependencies |
| `target/release/mrml manifest lock --check` | PASS; 71 packages, 5 interfaces |
| `target/release/mrml assurance check` | FAIL; pre-existing `UnsafeBoundaryUnadmitted { path: docs/compiler/probes/pinned_std_thread_tls_execution.rs }`; unchanged by this work |
| `cargo fmt --all -- --check` | PASS; stage-zero frontend scope |
| `cargo clippy --all-targets -- -D warnings` | PASS; stage-zero frontend scope |
| `rustfmt --edition 2024 --config skip_children=true --check packages/services/git-authority/src/generation.rs packages/services/git-authority/src/candidate.rs packages/services/git-authority/src/lib.rs packages/services/git-authority/src/main.rs` | PASS; affected source files |
| `git diff --check` | PASS |
| `deploy/compose/test-git-images.sh` | PASS |
| `deploy/compose/test-compose-git.sh` | PASS; static invariants, not runtime Compose |
| `deploy/compose/test-compose-signer.sh` | PASS, including expected process-kill recovery matrices |
| `deploy/compose/test-compose-credential-agent.sh` | PASS |
| `target/release/mrml test org.mrml.service.gitd --target linux` | PASS; 55 library, 7 daemon, 1 backup-administrator tests, local sockets enabled |
| `target/release/mrml test org.mrml.tool.git --target linux` | PASS; 277 library, 5 CLI, 9 protected-signer, 2 credential-agent tests, local sockets enabled |
| `target/release/mrml build org.mrml.service.git-authority --target linux --release` | PASS; native production binary built from the dirty live checkout, not a clean signed release |

No affected Git authority coverage-guided fuzz target is declared. The existing
`org.mrml.test.security-fuzz` package covers other components; it was not
misrepresented as authority fuzz coverage.
The Git package run did execute its existing deterministic hostile name/binary
parser corpus tests; that is not coverage-guided fuzzing.

The local release-mode authority binary SHA-256 is
`eabb687f73f634cfe151c1e78d5ff1fd9f5336eddf1314ac149b68fb4a79a0df`.
At that build, `git diff --binary -- packages | sha256sum` was
`1f9d9eca3873adf20378ca9934930ec6834797593844648b3727a061056129f3`;
the base HEAD is recorded above and the manifest/lock/toolchain files were
unchanged. This explicitly includes pre-existing source edits, not only this
patch. It is a local dirty-checkout build record, not an authenticated offline
release manifest or approval to deploy.

## Designated Docker host — BLOCKED_ENVIRONMENT

The owner selected `mrml.ca`. Read-only discovery established Docker Snap
client/server **29.6.1** (snap revision 3579), Compose **5.3.1**, context
`default`, and engine data root `/var/snap/docker/common/var-lib-docker`.
Commands use `sudo -n docker` through authenticated SSH. Existing Docker and
Podman volumes/containers were preserved.

A disposable probe used the already-loaded Linux/amd64 authority image
`sha256:e3c983e1a908c415504ce4ccbc667b6660b65a7fd6f2143f05ff0c3418d613f3`.
That image is **not** a new build of this patch. The probe only establishes host
execution compatibility and cannot count as release or corrected-code testing.
It had UID/GID `21002:21002`, read-only root, all capabilities dropped,
`no-new-privileges:true`, no networking, no mounts or ports, 16 PIDs and
128 MiB memory. Exact remote command:

```sh
sudo -n docker compose \
  -f /home/ubuntu/mrml-git-completion-20260904-hardening/compose.yaml \
  -p mrml-git-completion-20260904-hardening \
  up --no-build --pull never --abort-on-container-exit \
  --exit-code-from authority-probe
```

Result: exit **255**, `exec /usr/bin/mrml-git-authority: operation not permitted`,
before application entry. Exact targeted kernel audit:

```text
apparmor="DENIED" operation="exec" info="no new privs" error=-1
profile="snap.docker.dockerd" name="/usr/bin/mrml-git-authority"
comm="runc:[2:INIT]" fsuid=21002 ouid=21002 target="docker-default"
```

[Canonical documents this Docker Snap constraint](https://github.com/canonical/docker-snap#usage).
Both Docker support interfaces were connected; no verified in-place correction
preserving the controls was established. Initial use of remote `/tmp` failed
because Docker Snap cannot see that host path; moving only the Compose file to
the user's home exposed the substantive execution failure.

Retained remote evidence: the Compose file and `up.log` in
`/home/ubuntu/mrml-git-completion-20260904-hardening/`, and exited container
`mrml-git-completion-20260904-hardening-authority-probe-1`. No production service,
volume, engine, host policy or public listener was changed.

**Non-destructive remediation:** use a separately provisioned conforming Docker
Engine host; alternatively obtain separate authorization for a reviewed
backup/rollback and maintenance plan before migrating this host. The original
request prohibits automatic engine migration. Do not omit no-new-privileges or
AppArmor. Rerun the identical probe before attempting the full disposable stack.

## Remaining checkpoints

| Checkpoint | Status | Result / next action |
| --- | --- | --- |
| B — compression | TESTED locally; network acceptance blocked | Final ASAN: 283 library + 5 CLI + 9 signer + 2 credential passes; authority 22+10 and Gitd 55+7+1 passes. Independent zlib/Git and Git-generated packs passed. Same-hardware writer metrics and random-data regression are in COMPRESSION_VALIDATION_2026-09-04.md. 256 MiB H2 transfers remain part of blocked F. |
| C — certd consumer | TESTED locally; BLOCKED_EXTERNAL_INPUT integration | Fixed monotonic successful-poll delay, full unchanged identity/signer revalidation, validity admission and startup identity wait. Final normal tests 57+8+1 passes; optimized sustained test 4 polls / 12 RPCs / 3.396 s / 160 CPU ticks at 100 Hz / zero descriptor growth. Real certd startup failed before sockets due to its 64 KiB/16 KiB reader-limit mismatch; see the certificate-owner handoff. Real outage/recovery/rotation remains blocked. |
| D — H2 interoperability/admission | TESTED locally | HTTP 92 tests plus five explicit independent H2 gates passed normally and under ASAN; native/hostile TLS gates passed. Gitd 58+8+1 tests and actual two-source/24-denial gate passed under ASAN. See HTTP2_VALIDATION_2026-09-04.md. Git 283+5+9+2 release tests passed; full Compose remains F. |
| E — offline trust root | TESTED locally and on actual Docker | Normal/ASAN: 291+5+9+2+2 passes; real-cosign hostile gates pass. Signed OCI exports now pass external-key extraction and all five exact ID/tag/runtime checks on Docker 29.6.1. See OFFLINE_TRUST_VALIDATION_2026-09-05.md and DOCKER_IMPORT_VALIDATION_2026-09-05.md. Final release qualification is not implied. |
| F — exact Compose/release | BLOCKED_ENVIRONMENT | All three actual Compose configuration parses pass. A current-image confined probe again exits 255 with a kernel AppArmor/no-new-privileges denial before daemon execution. Preserve controls and resolve the documented host blocker and separate certd defects. |

No successful hardened Docker Compose, real-certd enrollment, current-build H2
transfer-performance, coverage-guided fuzz, qualified release or public activation
is claimed. A source-only review archive and an explicitly unqualified image
validation bundle were packaged and verified locally; their exact hashes and
identities are in [the artifact index](COMPLETION_ARTIFACTS_2026-09-05.md).
They cannot satisfy the clean-source,
fresh-performance or continuous-Compose release gates. One supplemental local
certd image was built and failed startup as recorded in
[the handoff](../edge/CERTD_CONSUMER_HANDOFF_2026-09-04.md). The earlier native
binary hash and pre-existing host probe image are separate from the final local
builds. Earlier dated validation records are historical evidence only.
No production keys or DNS values were requested or invented. The owner
authorized disposable Docker testing on `mrml.ca`; production activation and
engine migration remain separately gated. Existing environment-gated tests
remain enabled.

Checkpoint E commands/evidence so far:

- Legacy red: `rustc --edition=2024 --test /tmp/mrml-release-legacy-red.rs -o /tmp/mrml-release-legacy-red`, then `MRML_LEGACY_BUNDLE_VERIFIER=/home/m/mrml/deploy/compose/verify-offline-git-bundle.sh /tmp/mrml-release-legacy-red --nocapture`. The regression failed as intended: the old wrapper returned success for the substituted key and executed three bundled helpers. `/tmp/mrml-release-legacy-red.log` SHA-256 `ec3da002c916056bf03cd75e46f7ed33bbb9c0f51036b5cc200b82b54164db2c`. The fixture used disposable keys; no production private key was requested.
- `target/release/mrml manifest check` and `target/release/mrml manifest lock --check`: PASS, 71 components, 214 dependencies, 71 packages and 5 interfaces. No lock rewrite was needed for the added Git release binary.
- `target/release/mrml manifest fmt --check`: pre-existing failure for four certificate interface manifests (challenge, identity, lifecycle, signing). A read-only probe using the canonical stage-zero formatter identified those paths; the Git manifest is already canonical. The four unrelated files were preserved.
- `target/release/mrml assurance check`: still the pre-existing `UnsafeBoundaryUnadmitted { path: docs/compiler/probes/pinned_std_thread_tls_execution.rs }` failure; not suppressed.
- `cargo fmt --all -- --check` and `cargo clippy --locked --all-targets -- -D warnings`: PASS for stage zero. These do not replace package tests or scoped Rust formatting.
- `sh -n` on the three offline scripts, plus `deploy/compose/test-compose-git.sh`, `test-git-images.sh`, `test-compose-signer.sh`, `test-compose-credential-agent.sh`, and `test-compose-acme.sh`: PASS. Existing signer tests intentionally kill disposable helper processes to exercise recovery; the reported kills are expected test actions.

Final E: both normal and ASAN package suites passed **309 ordinary tests**
(291+5+9+2+2). The explicitly enabled real-cosign test passed with normal and
ASAN executables; see [the exact commands, corrected setup failures and hashes](OFFLINE_TRUST_VALIDATION_2026-09-05.md).
Stage-zero `cargo test --locked` passed 124 tests. No coverage-guided fuzz target
was declared for these packages; deterministic hostile cases are not relabeled
as fuzzing.

Remote transfer was explicitly approved by the owner and completed. The source
archive and private signing key stayed local. External-key extraction and
verification passed on mrml.ca. The first legacy Docker-archive import stopped
on a configuration-ID versus containerd manifest-ID mismatch. No check was
relaxed: a separate locally produced OCI export signs each exact archive
manifest digest before transfer. All five images then loaded and passed the
unchanged verifier's exact ID/tag/runtime checks on Docker 29.6.1.
Actual merged Git/ACME and separate signer/credential Compose configuration
parsing passed. The acceptance overlay preserves confinement, uses loopback
32443 and prefixes ACME volumes; parsing does not resolve the certd readiness
cycle or prove daemon execution. See
[remote commands, identities and evidence](DOCKER_IMPORT_VALIDATION_2026-09-05.md).

E changed paths: `packages/tools/git/mrml.toml`, `src/lib.rs`, new
`src/offline_release.rs`, `src/offline_release/{archive,tests}.rs`,
`src/release_main.rs`, `src/release_cli_tests.rs`, the three existing offline
bundle scripts, `deploy/compose/test-compose-git.sh`, and the trust-root/patent
documentation. The obsolete shell-source assertions were replaced by behavioral
Rust coverage rather than retained as evidence of the old insecure path.

Final broad Rust formatting check reported only seven preserved pre-existing
files: HTTP `gitd_edge.rs`, Gitd `auth_store.rs`, `catalog.rs`, `config.rs`,
`http2_workers.rs`, `http3_workers.rs`, and Git `remote.rs`. Those files were
not mechanically reformatted. The scoped check excluding exactly those seven
files passed for the remaining changed/new Rust sources. Manifest/lock and
final Git Compose/image policy checks passed; assurance and the four unrelated
certificate-manifest formatting failures remain as recorded above. No checks
were suppressed or represented as globally passing.

## Remote continuation — 2026-09-05

**Issue:** a legacy Docker archive imported into Docker 29/containerd has a
manifest ID instead of the Podman configuration ID signed by the first export.
**Status:** TESTED, corrected export passes. The strict verifier was retained;
new OCI archives bind explicit locally produced manifest digests before import.
**Changed files:** this record, COMPLETION_ARTIFACTS_2026-09-05.md,
OFFLINE_TRUST_ROOT.md, DOCKER_HOST_REMEDIATION.md and new
DOCKER_IMPORT_VALIDATION_2026-09-05.md. No package source changed; the original
source archive and package inventory binding remain exact.
**Exact commands/results:** the linked remote record contains successful
`mrml-git-release extract/load`, three `docker compose ... config --quiet`
commands and the failing confined `up --no-build --pull never` command, with
artifact and log hashes. Git diff whitespace checks pass.
**Next action:** retain confinement and obtain a conforming Docker environment
or separately authorized host remedy; incorporate certificate-owner fixes,
then run F's entire continuous sequence and fresh transfer benchmarks. No
engine migration, production-volume deletion or public activation is authorized
by the approval to transfer validation artifacts.

Patent review: **NOT_TRIGGERED**. This checkpoint corrects conventional
lifetime locking and repository-bound file naming using existing codecs and
hash identities; it introduces no new cryptographic or compression mechanism.
See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).

## 2026-09-05 Compose continuation

- **TESTED:** Docker CE 29.8.0 / Compose 5.5.1, default context, all 145 original
  image tag/digest references preserved. Original workloads restored, Snap data
  retained, required confinement executes. See migration execution record.
- **TESTED:** Actual certd enrollment, complete Gitd consumer signing proof,
  generation-2 renewal, stale-socket crash recovery and bounded signal shutdown
  under supplemental local Podman. Certificate suite normal/ASAN: 145+6 passes.
  See `CERTD_REAL_ENROLLMENT_2026-09-05.md` for commands and limitations.
- **TESTED:** V6 fixed seven-image release profile normal/ASAN Git suites:
  291 library + 18 binary tests; explicit real-cosign signed V5/V6 oracle passes.
  Logs `/tmp/mrml-release-v6-{normal-host,asan,signed-oracle}.log`.
- **TESTED:** `docker compose -f compose.acme.yaml -f compose.git.yaml
  -f compose.git.acceptance.yaml -p mrml-completion-f-20260905 config --quiet`
  on the actual remote CE host. Public inputs set explicit disposable versions,
  prefix and placeholder signer identity for configuration validation only.
- **SOURCE_VERIFIED / deployment testing ongoing:** ACME volume names now honor
  `MRML_VOLUME_PREFIX` throughout provisioning, installation and Compose. Public
  CA input bound is 65,536 bytes; JSON remains 16,384. Fresh channel seed parent
  is created. Acceptance uses both unique prefix and unique
  `MRML_DEPLOY_ROOT=/mnt/mrml-completion-f-20260905`; reusing a deployment root
  across prefixes would share its backup-authentication key.
- **TESTED:** actual-host `install` is uutils 0.8.0 and rejects absent numeric
  account names in `-o`; signer/credential provisioning now performs `install`
  followed by numeric `chown`, retaining exact owner/mode verification.
- Acceptance overlay retains real daemons and all confinement; native client and
  enrollment probe are explicit one-shots. Public CA mounts are separate from
  secrets. New `provision-git-acceptance-host.sh` initializes only its two scratch
  volumes, with UID21005/UID21004 and nocopy mounts.
- **TESTED:** `target/release/mrml build org.mrml.test.gitd-certd-fixture --target
  linux --release`; Rust `fixture-create` generated each text/random 256 MiB
  dataset as eight distinct 32 MiB files. Independent `sha256sum -c` passed all
  sixteen files. Actual network measurements remain **NOT_RUN**.
- **TESTED:** `sh deploy/compose/test-compose-acme.sh`, `test-compose-git.sh`,
  `test-git-images.sh`, `test-compose-signer.sh`, `test-compose-credential-agent.sh`
  pass, including their process-kill recovery regressions. An initial invocation
  of `tools/containers/test-git-images.sh` failed because that path does not exist;
  the correct checked script is under `deploy/compose`.
- Seven normal images were built locally; signed diagnostic inputs are being
  prepared at `/tmp/mrml-completion-f-release`. They are explicitly not the final
  qualified release. Source-review archive SHA-256
  `588fdcbaa3ad9d731a1ba9dd895c5f9e50b319c15e562b2df45c34fa5b27bdd3`
  contains 1,104 source files and excludes Git/build/nested archives/runtime keys.
  No source archive or private CA/release key is transferred to the VPS.

**Next action:** finish signed diagnostic verification/load, enroll real certd
in Compose, initialize two repositories and client policies, then run the full
13-step acceptance sequence. Final clean-source rebuild, fresh measurements,
coherent signed deployment bundle and final A–F report remain required.

Diagnostic bundle verification found missing required evidence files first;
explicit `NOT_RUN` files were then included without claiming qualification.
The resulting V2 archive authenticated and extracted remotely. Its first image
loaded under `localhost/mrml/...`, while the signed profile required
`docker.io/mrml/...`; the verifier rejected the tag mismatch and stopped. The
loaded authority image's exact manifest ID remained correct. Corrective export
uses an explicit local `docker.io/mrml/...` tag and regenerates archive hashes,
SBOMs and signatures; no expected identity or runtime check is relaxed. The
rejected bundle remains retained as evidence, and is not used for startup.

**TESTED:** corrected V3 diagnostic bundle SHA-256
`6544dc3ac810c7bdd310ff3676eeefd2adae31b7c3984837078cf7509436cb98`
was authenticated, extracted and loaded on actual CE. All **seven** exact image
IDs, canonical tags, architecture, users and entrypoints passed. Log:
`/tmp/mrml-completion-f-release-v3/remote-verify-load.log`. The separately
SSH-provisioned V6 bootstrap SHA-256 is
`18fd5a939a0596fd837561b779012f987bf25836e2f22ebb1a03e2d38d0bf799`;
it uses the already independently selected disposable release public key.
The first rejected export remains preserved; corrected export changes transport
references, not expected image identities. This diagnostic bundle still labels
streaming/continuous acceptance `NOT_RUN` and is not the final release.

**TESTED:** real Compose certd lifecycle health, authenticated key/CSR creation,
public-CSR self-signature check, disposable CA signing/hostname verification,
real stage/activation RPCs and identity health now pass at generation1. Logs
`/tmp/mrml-completion-f-release-v3/enroll-csr-retry.log` and `activate-host.log`.
The first actual Compose attempt exposed empty-volume copy-up clearing the ACME
socket parent's setgid bit: directory755/socketGID21003 instead of2750/GID21903.
Canonical `compose.acme.yaml` now applies `nocopy` to both ACME socket mounts.
After clean stop, prescribed disposable-parent ownership restoration and
recreation, enrollment passed. No permission check was weakened.

Actual Docker Compose5.5.1 also preserved a service mount's `ro` flag despite
`run -v SAME_VOLUME:SAME_TARGET:rw`. Retained failed-container inspection proves
this in `/tmp/mrml-completion-f-release-v3/keygen-inspect.log`. Key generation now
uses a distinct explicitly writable target. The production protected-policy
initializer used the same ineffective override; its scoped operation now uses
`compose.git-policy-init.yaml` to declare the writable policy mount explicitly.
The ordinary Gitd policy mount stays read-only. Static Git Compose checks pass.
Fresh authority provisioning now creates its required private `proofs` root.
Two-repository initialization is being retried; no protected push is claimed yet.

**TESTED:** both `owner/first` and `owner/second` initialized through real Compose
with independent protected policy state (initial canonical commit bytes happen
to match). The authority loaded their shared generation root, and all five real
long-running daemons started in their separate confined containers. Native
`mrml-gitd listener-health` and credential-agent-mediated verified-H2 clone of
`owner/first` passed. Logs: `initialize-repositories-retry.log`, `start-stack.log`,
`first-clone.log` under `/tmp/mrml-completion-f-release-v3/`.
Three uninterrupted protected pushes are now being exercised; full F acceptance
and coherent final packaging remain pending.

**TESTED:** three consecutive protected pushes completed through the actual
Compose stack without restarting/reconfiguring signer policy:
`dc508b3b0313...`, `1969c65e0602...`, `7740e191af1a...`. Native fetch and a fresh
clone of the post-push tip passed. Exact commands and output are in
`/tmp/mrml-completion-f-release-v3/{three-pushes-host.sh,three-pushes.log}`.
The complete 13-step sequence, large transfers, failure-path injections,
restore/hybrid reruns and final clean-source packaging remain open.

**TESTED:** authority restart + native fetch; signer restart + valid protected
push `12601245edaa...` + fast-forward pull; credential-agent restart + fetch.
Real certd stop caused new verified TLS/H2 listener health to fail (exit1), while
Gitd remained the same container
`63db4d46c4f6c157fcafce7ecb7f59ef46aed7efbfc419c95a41f735400238eb`,
PID997418, start time `2026-09-05T05:50:01.319354312Z`. Restarting certd in the
same volumes recovered health and native fetch without recreating Gitd.

**FAIL / implementation diagnosis ongoing:** generation2 rotation while real
Gitd continuously polls caused StageCertificateCandidate's reply to time out;
subsequent Gitd channel refresh also remained unavailable. Independent offline
certd health still reports active generation1. The source has a suspected ABBA
order: Stage holds `certificate_keys` while persisting durable state;
`load_active_candidate` retains durable guards then locks `certificate_keys`.
The certificate owner is adding a concurrency regression and correcting the
smallest lock scope. Do not retry/replay stage or claim generation2 activation
until state is resolved. Logs `rotate-generation2.log`, `tls-generation2-oracle.log`.

A new test-only `malformed_push.rs` uses native authenticated H2 and a real
negotiated pack for a tiny unpushed commit, but intentionally invalid proof
signatures; it requires protocol rejection and unchanged exact refs/generation.
Its canonical probe build passes; actual execution remains NOT_RUN. The test
package adds one explicit Git library dependency; `mrml manifest lock` changes
only its graph counts and dependency entry. Certificate owner currently holds
the shared canonical build slot; no concurrent builds are permitted.

Independent review confirmed the certd lock inversion. The agent is running a
bounded red concurrency regression before the production lock-scope fix. The
remote diagnostic certd remains wedged; its original generation1 is still
reported by a separate offline health process. Do not infer readiness from that
standalone process while live RPCs are unavailable.

Root prepared an additional test-only `measure-native` wrapper (not yet built or
executed): it runs only `/usr/bin/mrml-git`, records child CPU and peak RSS using
Linux x86-64 getrusage, final child `/proc` I/O counters before reaping, and
network-namespace byte deltas. This avoids measuring the Docker CLI as the
client. The wrapper has a30-minute ceiling, a reaping guard and no plaintext
credential output. Host/server accounting, fresh transfer execution and all
measurement results remain NOT_RUN.

**TESTED / remote retry pending:** certd lock regression failed as expected in
`/tmp/mrml-certd-lock-order-red2.log`, then normal and ASAN passed **145+7** in
`/tmp/mrml-certd-lock-order-green.log` and the corresponding ASAN log. Final
independent source review found no issue. The fixed normal daemon binary SHA-256
is `f7bef6165e31d53faada6f2442c967588f0c132676916561cb69f2fca140f429`.
The shared build slot is free. Root is rebuilding the native test probe with
malformed-push and accounting helpers and a new diagnostic certd image.

The offline builder now has explicit `MRML_IMAGE_BUILDER=docker|podman` and
`MRML_GIT_RELEASE_PROFILE=v5|v6` selections. It exports OCI, chooses expected
manifest IDs from the archive before transfer, uses canonical docker.io tags,
and includes certd/native-client inputs for V6. Syntax/diff checks pass; full
clean-source builder execution remains NOT_RUN, pending fresh measurements.

### Continuation: diagnostic client fault and accounting probes

- SOURCE_VERIFIED: `compose.git-response-loss.yaml` adds a bounded ciphertext
  relay on an internal client network; it holds no secrets, does not terminate
  TLS, and leaves every production daemon and its confinement unchanged.
  End-to-end response-loss reconciliation through this overlay is NOT_RUN.
- TESTED: `target/release/mrml build org.mrml.test.gitd-certd-fixture --target linux --release`
  passed with the malformed-proof, deterministic 256 MiB fixture, native child
  accounting, and response-loss commands. Log:
  `/tmp/mrml-completion-f2-probe-final-build.log`.
- TESTED: the pinned Debian build-stage image executed `measure-native
  /work/accounting /usr/bin/mrml-git --version`: exit 0, 900 microseconds user
  CPU, 2184 KiB peak RSS, 10 read and 2 write calls. This is a functional
  accounting smoke test, not a transfer benchmark. The 100 ms sampling interval
  can add up to one interval to elapsed time; `/proc` counters count I/O calls,
  not all syscalls. Final child I/O must be readable before reaping.
- Rust's optional weak `pidfd_spawnp` / `pidfd_getpid` GLIBC_2.39 symbols emit a
  diagnostic on the pinned older libc, while the standard fallback executes
  successfully. The test-client Dockerfile now requires actual native spawning
  and accounting to succeed, and still rejects unresolved shared libraries.
- TESTED: ACME and Git static Compose checks and manifest lock check passed.
  The Git check was updated to assert OCI archive scanning and exact OCI image
  manifest selection used by the offline builder.
- Diagnostic bundle `diagnostic-f2.tar` SHA-256:
  `a5df3510c5203779745d7a9cd6736c8bab7488455fa5f901bb8e52fc7ce3cef4`.
  External-key verification passed locally. It deliberately mixes five unchanged
  diagnostic images with rebuilt certd/client images and is NOT the final
  coherent clean-source release. All 118 outer entries and seven image layer
  inventories were inspected before SSH transfer: no private/source/runtime
  files. The separately retained local source archive digest is
  `aa286033a9e4d082327fbdbf1cfd4799339559288204ec8ba97e6d71b7a8c476`;
  subsequent documentation/static-test edits are not represented by that snapshot.
- Next: trusted remote verify/load; recover the deadlocked old certd using the
  tested lock-order fix, prove Gitd remains the same process, retry concurrent
  certificate rotation, then complete remaining F acceptance operations.

### Real Docker continuation: recovery, rotation, denial and reconciliation

The external-key bootstrap on mrml.ca verified diagnostic-f2's complete inventory
and all seven loaded image IDs, tags, platform, users and entrypoints. Exact
commands are retained in `/tmp/mrml-completion-f2-release/*-host.sh`; public test
logs are beside them. This remains a diagnostic continuation, not F's final
continuous clean-source release.

- TESTED: fixed real certd restarted from retained generation 1; Gitd retained
  container `63db4d46c4f6c157fcafce7ecb7f59ef46aed7efbfc419c95a41f735400238eb`,
  PID 997418, start `2026-09-05T05:50:01.319354312Z`. The old deadlocked certd
  required SIGKILL after its grace period (exit 137, 06:27:47 UTC), explicitly
  NOT a successful graceful-stop test. The bounded recovery backoff reached
  30 seconds during the prior prolonged outage; an immediate fetch failed
  before recovery. Logs: `recover-certd.log`, `recovery-daemon-logs.txt`.
- TESTED: ACME-role `enroll-activate ... 1 2 ... /enrollment/chain2.pem`
  staged and activated real certificate generation 2 concurrently with live
  Gitd polling; certd health reported 2. Native fetch subsequently passed;
  OpenSSL verified the disposable CA and `git.example` identity, serial
  `03EA` (1002). Logs: `rotate-certd.log`, `check-recovery-retry.log`.
- TESTED, with harness limitation: malformed detached proof reached production
  verification (`authority_proof_verify_denied`, `receive_core_signature`).
  The strict probe returned failure because it expected an HTTP/protocol error
  while the backend closed TLS after denial. Independent native fetch/status
  proved the commit remained one ahead of the remote, then valid isolated-signer
  push of `25de7a06c6d957a90a25318cb0d42b8dc29ba5af709c47c889dfda1a9023968f`
  succeeded. Logs: `malformed.log`, `malformed-daemon.log`,
  `valid-after-malformed.log`. Do not report the strict helper itself as PASS.
- TESTED: encrypted response-loss relay dropped 454 response bytes on native
  push connection 5. The client's automatic connection-6 reconciliation
  completed push `727eb4288139e5f8335461e30180b27d0973db2c127a1ac2d6877fe5b5597045`;
  fresh fetch/status showed zero ahead/behind. No manual receipt or repository
  state edits. Logs: `response-loss.log`, `response-loss-proxy.log`.
- TESTED: live native token revocation rejected the old token while Gitd kept
  the same process. Replacement issuance and stopped-agent token installation
  advanced the agent to generation 2. Existing clones correctly stayed pinned
  to generation 1 despite environment changes and were denied; explicit
  non-secret `[http] credentialGeneration` updates to 2 completed fetch.
  Logs: `revoke-replace.log`, `check-credential.log`,
  `update-client-credential.log`. Document this persisted-config step in the
  final replacement-credential runbook; environment inputs initialize clones.
- Next: compressible and incompressible 256 MiB network measurements, fresh
  encrypted restore, hybrid-key overlap/retirement, and final coherent build.

### Large-transfer measurement checkpoint

- TESTED: native Git staged the eight explicit `text256/object-NN.bin` paths,
  committed `4e6e0c751a56...`, and protected push succeeded on real Compose.
  The 256 MiB fixture's eight SHA-256 hashes were independently checked before
  staging. The CLI currently requires explicit file paths for `add`; directory
  staging returned its unsupported special-file/path error, without state loss.
- NOT_RUN as a complete measurement: the native accounting wrapper subsequently
  failed, leaving an empty accounting file. No CPU/RSS/byte result is claimed
  for that push. The same wrapper fails after `--version` in actual Docker
  Compose but passes under confined non-root local Podman. Recent filtered
  kernel denial logs contained no matching ptrace/proc AppArmor denial.
- SOURCE_VERIFIED: added precise child-status, final-I/O and getrusage error
  categories in the test-only wrapper. Fixed the disposable host sampler's
  shell variable collision (`snapshot` overwrote the operation name), which
  labeled initial push logs as `authority.*`; those incomplete files remain
  retained rather than relabeled as successful measurements.
- Next: transfer the locally built diagnostic client with detailed errors,
  resolve the measured runtime discrepancy without relaxing confinement, then
  rerun clone/fetch/push measurement and incompressible fixtures. Remaining
  restore, hybrid transition and coherent-release acceptance are still open.

### Measurement host-observer correction

- TESTED: diagnostic-f3 isolated the real Docker failure as `accounting final
  child I/O: Permission denied (os error 13)`, including a version-only command.
  This is not Git transfer failure and is not resolved by relaxing confinement.
- SOURCE_VERIFIED: the revised probe retains its exited child for at most five
  seconds when the explicit test-only host-observer mode is selected. The host
  sampler verifies the child belongs to the exact measurement container and
  matches its namespace PID, then writes only numeric I/O accounting. Transfer
  elapsed time/network counters are captured before this handoff; CPU and peak
  RSS still come from `getrusage` for the one reaped native child. The client
  receives no additional Linux capabilities. Real Docker validation pending.
- TESTED: `target/release/mrml test org.mrml.test.gitd-certd-fixture --target linux --release`
  and the corresponding `--sanitizer address` command passed. The first sanitizer
  invocation in the tool sandbox failed LeakSanitizer thread inspection; the
  unchanged command outside that sandbox passed with leak detection enabled
  (`/tmp/mrml-completion-f4-fixture-asan-host.log`). No host ptrace policy change.
- Two exact unsafe-boundary policy entries now cover the existing reviewed
  certd lifecycle signal installation and the test-only x86-64 `getrusage`
  call. `assurance check` still fails on the unchanged compiler probe
  `docs/compiler/probes/pinned_std_thread_tls_execution.rs`; it is not suppressed.
- Diagnostic-f4 signed bundle SHA-256:
  `bc05a16057eb17cb5f1944ca09026212832285047040753a22ced81203f1ff5f`.
  Local source snapshot digest (subsequent comments/policy/docs not included):
  `48d779a72e5d2db3b519f2e2c9dd7810f7ea7f12a8804b74af8a16803738fcf3`.
  Six daemon images are unchanged and only the diagnostic client is rebuilt;
  this remains explicitly NOT the final coherent release.

### Real Docker large transfers and source-independent restore

- TESTED: both actual protected repositories have independent successful pushes
  through the shared production authority/generation root. The second uses
  separate signer state, credential generation and channel volumes under
  `mrml-completion-s-20260905`; its selected test signing keys are shared read-only.
- TESTED: eight distinct 32 MiB text files clone/fetch/pull with matching hashes;
  eight distinct 32 MiB deterministic incompressible files protected-push/clone/
  fetch/pull with matching hashes. Full numeric evidence and limitations are in
  `DOCKER_H2_MEASUREMENTS_2026-09-05.md` and `probes/compose-2026-09-05/`.
  Text clone/fetch: 37.67/25.17 s; random push/clone/fetch: 70.83/79.04/50.70 s.
  A fully measured text push and same-fixture before/after baseline remain open.
- TESTED: shared Gitd/authority, real fixed certd, and both isolated signer and
  credential agents stopped with exit 0 in two seconds total, within configured
  grace periods. Certd restarted and reported identity generation 2. The shared
  authority and all Git clients remained cold for backup.
- TESTED: native encrypted backup generation `2026090501` created and verified,
  809,619,705 bytes, root:root mode 0600, one link, SHA-256
  `a91fd03a092df6fca9aea60a13476d56d20258650c7b3317fa94fc6bafee69e8`.
  The archive and independent backup-key volumes remain on the host.
- TESTED: after an additional native verification, removed exactly the eleven
  unused MRML-managed server source volumes under `mrml-completion-f-20260905`
  and its two exited Gitd/authority containers. Other projects and independent
  certd/client custody were retained. Native verification and restoration then
  succeeded into absent `mrml-git-restore-f-20260905` targets with every original
  server source volume absent. Logs: `cold-backup.log`, `destructive-restore.log`
  in `/tmp/mrml-completion-f4-release/`.
- Activation exposed a real cache/provisioning mismatch: derived cache rebuild
  omitted `.mrml-volume`, so `provision-git-host.sh` refused activation. The
  valid restored namespace remains **disabled**; no manual sentinel/state edit
  was applied. Original server source volumes remain absent.
- TESTED red regression: canonical Gitd package tests passed 58 library and 8
  daemon tests, then the new backup test failed specifically on the absent
  managed-volume sentinel (1 old backup test passed). Log:
  `/tmp/mrml-restore-cache-red-host2.log`. Earlier restricted-sandbox attempts
  could not run socket tests; an unrestricted run also identified two stale
  consumer-test cleanup expectations after certd gained owned-socket unlinking.
  Those tests now assert cleanup and passed in the red run.
- SOURCE_VERIFIED fix: native `initialize_restore_cache_root` creates and syncs
  a zero-length, single-link mode-0400 sentinel owned by the authenticated
  repository-root UID/GID, while requiring an empty destination. The regression
  checks both derived repository directories, all metadata, and rejection of
  reuse. Green/sanitizer tests pending; then restore the same authenticated
  archive into another absent namespace with the rebuilt backup image.
- Next: finish restore activation/clone/push, hybrid overlap/retirement, complete
  measured baseline, and the final continuous coherent-source release. No
  production-ready, public activation, or 100% completion claim is made.

### Cache reconstruction fix gates

- TESTED green: `target/release/mrml test org.mrml.service.gitd --target linux --release`
  passed 58 library, 8 daemon, 2 backup tests, including the sentinel regression.
  The matching `--sanitizer address` command passed with leak checks enabled.
  Logs: `/tmp/mrml-restore-cache-green.log`, `/tmp/mrml-restore-cache-asan.log`.
- TESTED: explicitly ran the instrumented ignored
  `tcp_listener_tests::real_listener_two_ipv4_sources_repeated_invalid_credentials`
  using the existing `MRML_H2_ORACLE_PYTHON`, `MRML_HTTP2_HOSTILE_CERT`,
  `MRML_HTTP2_HOSTILE_ISSUER`, `MRML_HTTP2_HOSTILE_KEY`, and `MRML_CA_BUNDLE`
  fixtures documented in `HTTP2_VALIDATION_2026-09-04.md`. It passed in 3.12 s:
  two actual IPv4 sources, 24 private credential denials, and all connection/
  handshake permits returned. Log: `/tmp/mrml-restore-cache-h2-asan.log`.
- Next: normal backup image rebuild and authenticated delivery; restore encrypted
  generation 2026090501 into **another absent namespace**, preserving disabled
  `mrml-git-restore-f-20260905` for evidence, then activate/clone/push.

### 2026-09-05 corrected destructive restore and cross-project cold guards

- TESTED: F5 native restore of authenticated backup generation 2026090501 into
  absent `mrml-git-restore-g-20260905` rebuilt the cache sentinel, passed config
  validation and recovery, and started real authority/Gitd with independently
  retained real certd and client custody. Fresh native H2 clone
  `/work/restored-first-attempt3` matched all eight 32 MiB text hashes. Protected
  push `f9449afa6fcb` succeeded while all eleven original server volumes remained
  absent. No authority or signer generation record was manually edited.
- Exact orchestration: local `/tmp/mrml-completion-f5-release/restore-g-host.sh`,
  `activate-restore-g-host.sh`, `resume-restore-g-host.sh`, and
  `finish-restore-g-host.sh`, delivered as `ssh ... ubuntu@mrml.ca 'sudo -n sh -s'`;
  corresponding `.log` files retain outcomes. First two clones failed with TLS
  socket transport errors; an independent OpenSSL oracle verified CA/SNI,
  TLS 1.3 and H2, and the third clone passed. These transient failures remain
  unresolved and must be checked in the final continuous run, not erased.
- SOURCE_VERIFIED: four hybrid trust operators queried Docker Compose's default
  project, missing running signer containers in the separately documented client
  project. Added a Rust executable regression with bounded engine doubles;
  the original Docker guards reached mutation despite running volume consumers
  (24 failing Docker cases). Both runtimes now query actual engine-wide consumers
  of the three exact selected state/policy volumes; query errors fail closed.
- TESTED: `rustc --edition 2024 deploy/compose/tests/trust_cold_guard.rs -o
  /tmp/mrml-trust-cold-guard && /tmp/mrml-trust-cold-guard` passes 48 cases covering
  four operators, both engines, three running-consumer volumes, and query errors.
  Red/green logs: `/tmp/mrml-trust-cold-{red,green}.log`. This is operator-double
  evidence; the actual Docker hybrid transition remains NOT_RUN on this build.
- Next: finish actual overlap/retirement, same-fixture compression baseline and
  measured text push, then clean-source continuous acceptance and release bundle.
- TESTED follow-up: existing `sh deploy/compose/test-compose-signer.sh` passes
  all transition/construction/slot-selection process-kill resume matrices;
  `sh deploy/compose/test-compose-git.sh`, `sh deploy/compose/test-compose-acme.sh`
  and `git diff --check` pass. The static signer assertion now requires the
  shared engine-volume query and rejects project-local Docker status queries.
- TESTED actual Docker overlap selection: both native hybrid authorizations,
  immutable public staging, generation-2 policy selection, authenticated signer
  advancement, key-slot swap and atomic Gitd catalog update passed. Selected
  digest: `12d9ec648f786f6851dfa02f306a89fd084a7414a36643a2e87169af1f8e1562e1e68e56869479d60b55faeb00ba7c7b88d93a87ce88cea780bb7b792430f65f`.
  A historical validation timestamp first rejected the new signatures without
  policy mutation; retry used the current host time and unchanged signed inputs.
  Post-overlap native push and retirement remain pending.

### Actual Docker overlap exposed bootstrap verifier shadowing

- TESTED failure: generation-2 native fetch passed, but protected push
  `90497b2d66d8` was rejected with `authority_proof_verify_denied` and
  `receive_core_signature`. No success is claimed for that push.
- SOURCE_VERIFIED cause: `select_authority_verifier` returned an active
  bootstrap pair before consulting the selected generation's immutable successor
  snapshot. During overlap, that selected the old pair despite authenticated
  signer advancement selecting the successor. This stack has one selected
  proof verifier; policy overlap also supports transition authorizations and is
  not a claim of arbitrary simultaneous signer multiplexing.
- Regression: the real normal-transition fixture now calls the production
  selector immediately after generation-2 overlap, while the bootstrap pair is
  still active, and requires the successor. Red focused command
  `target/release/mrml test org.mrml.service.git-authority --target linux --release`
  failed its process-kill fixture's resumed overlap assertion (9 daemon tests
  passed, 1 failed, 1 fixture intentionally ignored/executed by the parent).
- SOURCE_VERIFIED fix: generation 1 validates the bootstrap pair; subsequent
  generations require their exact retained verifier, which must remain active
  under the selected policy. Missing selected-generation material fails closed
  rather than reverting to a still-active old pair. Added that regression too.
- Green and sanitizer runs pending; the rejected Docker candidate/client state
  is retained for native reconciliation after corrected image delivery.
- TESTED green and ASAN: the authority command above and its
  `--sanitizer address` variant each pass 22 library and 10 daemon tests. The two
  deliberately ignored child fixtures are invoked by their passing production
  receive/process-kill parents. Logs `/tmp/mrml-overlap-verifier-green.log` and
  `/tmp/mrml-overlap-verifier-asan.log`. Normal release rebuild precedes F6 image
  export; F6 remains explicitly diagnostic, with six unchanged F5 images.

### Corrected real Docker overlap, retirement and recreation

- TESTED F6 externally verified/load-checked diagnostic bundle: SHA-256
  `e4ded8029a870666dc4f33a7e084108a4c83a38c314a3787280910d2f6247179`;
  separate source-review archive
  `1cefc2f98ab3aed7e7de25e03027994bda76ae747c3d50c06a159ccf8daad864`.
  Only authority was rebuilt; this remains a mixed diagnostic bundle.
- The earlier rejected client's uncertain journal remains intact. Its lookup
  fails closed; no journal, candidate or generation was manually cleared.
  A fresh clone and candidate then proved the corrected selected verifier:
  protected push `fb883a163ad8c9415d6a03bff882497b062dce5472892454967000fccba47986`
  passed, followed by matching fetch and zero ahead/behind.
- TESTED retirement generation 3 selected digest
  `996bfc4779ed334bf19260a79832013ffdbfbaed5dea4049fa6c94bbc195deba90988e368f5e42970c0012f9571c64081ff52f29bd2c5824de2a0ad691c3243a`.
  Both authorizations used the surviving pair; native signer advancement and
  catalog update passed. The exact retired pair with its original key creation
  time exited 78 and left the advanced signer-state hash unchanged. The first
  rejection probe used the successor creation time and is not the exact-key
  rejection evidence; the corrected explicit-time probe is.
- TESTED post-retirement protected push
  `15d4a15b74756260bc9583e342d0d3244eb62f4a7febea1b8b2bf343c7c6236c`, followed by
  matching native fetch and zero ahead/behind. All five real services stopped
  with exit 0, were recreated through their Compose projects, and native fetch
  and status preserved that commit. Original deleted Git source volumes remained
  absent. Exact commands/logs are under `/tmp/mrml-completion-f6-release/`:
  `fresh-overlap-host.sh`, `retirement-host.sh`, `retirement-push-host.sh`,
  `recreate-durable-host.sh` and corresponding `.log` files.
- Next: same-fixture before/after measurements including measured text push,
  followed by all-seven-image clean-source continuous acceptance and final
  source-only/release artifacts. Those final gates remain NOT_RUN.

### Certd bounded authenticated reordering and benchmark replay scope

- Issue: concurrent Gitd calls allocate before connecting; certd's strict
  increasing-only request IDs rejected valid authenticated arrival reordering.
- Status: TESTED. Changed `packages/services/certificate/src/certd_channel.rs`.
  A fixed 64-position bitmap rejects duplicates, zero and stale IDs after the
  existing authentication checks, without serializing signer/wait connections.
- Exact tests: `target/release/mrml test org.mrml.service.certificate --target
  linux --release` and the same command with `--sanitizer address`: 149 library
  and 7 daemon PASS. Red tests previously gave 145 PASS / 2 FAIL. Logs:
  `/tmp/mrml-certd-reordering-{red,green,asan}.log`.
- TESTED separate benchmark setup correction: a new client lease below the
  retained channel high-water mark prevented identity readiness. Restarting only
  disposable certd and baseline Gitd restored readiness; no persisted sequence
  or generation was edited. Contract and exact counters are in
  `docs/gitd/edge/CERTD_CONSUMER_HANDOFF_2026-09-04.md`.
- Next: same-fixture measurements, clean-source image build and continuous final
  Compose acceptance. Those remaining gates are not yet complete.

### Clean-source preparation gate — 2026-09-05

- TESTED `mrml manifest check` (71 components / 215 dependencies),
  `mrml manifest lock --check` (71 packages / 5 interfaces), all four Git,
  signer, credential-agent and ACME Compose policy suites; stage-zero
  `cargo fmt --all -- --check` and `cargo clippy --locked --all-targets -- -D
  warnings` pass. Exact logs: `/tmp/mrml-final-{manifest,lock,compose-git,
  compose-signer,compose-credential,compose-acme,cargo-fmt,clippy}.log`.
- Existing unrelated `manifest fmt --check` still reports four certificate
  interface manifests, and `assurance check` reports
  `docs/compiler/probes/pinned_std_thread_tls_execution.rs` as unadmitted.
  Neither was suppressed or presented as passing.
- The offline builder now includes the committed acceptance/restore/response
  overlays but omits source-policy trees and local test code from deployment.
  These remain in the separate source archive. Static Git Compose checks pass.
- Benchmark text push succeeded, but the observer's `/tmp` was device 33 while
  the Docker work volume was device 2049. Its intentional atomic-publication
  guard rejected incomplete accounting. A fresh before2 namespace repeats the
  full push using root-private temporary files under its own admin directory
  on device 2049. Failed evidence is retained and not counted as a measurement.

### Clean-source Docker deployment lineage — 2026-09-05

- TESTED source archive SHA-256
  `183e65b330de65f785898087a4c29a887161638cdf8e3c9e1d42e321f4c49bbe`, exact Git
  index tree `6ab2a37bfc65a87071a7867db25eedb52bdbcfa6e22dedf713f097b0f320ecad`.
  All seven images were rebuilt from its clean extraction. The signed Git
  checkpoint timed out awaiting local GPG unlock; no unsigned commit or invented
  commit identity was created. The source archive excludes .git, target output,
  nested archives, private keys and runtime state.
- TESTED all seven externally authenticated OCI identities on Docker Engine
  29.8.0 / Compose 5.5.1 / default context, data root `/var/lib/mrml-docker-ce`.
  Candidate bundle SHA-256
  `50c6c642f24351bd16a1bfdccb36d0cb29544d275e5a82b053553844559c4d99`.
  It is labeled a candidate until final evidence is sealed; no public activation
  or independent audit is claimed.
- TESTED final2 lineage: two real protected repositories, three successive
  pushes, native clone/fetch/fast-forward pull, fresh malformed-proof server
  denial with unchanged state followed by valid push, encrypted-response loss
  reconciliation, live token replacement and individual daemon restarts without
  Gitd recreation. Certd generation 2 presented serial `07D2` over verified
  TLS 1.3/H2.
- TESTED full before3/after-final2 paired measurements: identical eight 32 MiB
  text and random files, unchanged verification/object/resource/time limits.
  Text wire falls about 98.4%; random elapsed time regresses 43–82%. Complete
  CPU/RSS/read-write-call/wire/storage counters and method limits are in
  `DOCKER_H2_COMPARISON_2026-09-05.md`. All file hashes match. No pruning or
  constant-memory claim is made.
- TESTED verified encrypted backup followed by deletion of exactly eleven
  disposable final2 server volumes and native restore into
  `mrml-git-restore-final-20260905`. Clone hashes and protected push passed while
  all source volumes remained absent. Backup SHA-256
  `cf09a6b7c60273cdc9eb0a8b38f9587e22bc9de112a672f65cd12ae9db32403b`,
  809620139 bytes, mode 0600, single link; custody remains on the test host.
- TESTED dual-authorized overlap and retirement. Selected trust generation 3
  digest `da4072ce801cb3b429ccc7574be35462a3e33d78fc46ea7d9e38347ae1f2a61ca01c4ab893244bc9eebea9165044fa190261ffec26f671fedf1d3d95b2e584e2`.
  The exact retired pair/original creation time exited 78 with signer state
  unchanged; surviving push selected
  `4aa74803b5385f2ea4e121ee977a3629e6869d7cad007f14685b46af0f665dc9`.
  Seven services stopped with exit 0 in one second, were recreated, and both
  repositories remained available with all random-file hashes matching.
- Orchestration corrections are explicit: Git provisioning precedes ACME for
  the shared sentinel; lifecycle/identity readiness must be polled rather than
  inferred from process start or two seconds; restore names must use the
  `mrml-git-restore-*` prefix; a stale diagnostic client pathname was corrected
  before its commit was created. No runtime generation/state bytes were edited.
- Next: finish the fresh final3 repeat, including a 256 MiB established clone
  during real-certd loss and bounded idle connection/CPU/descriptor observation;
  seal and independently reverify the final evidence-bearing offline bundle.
  Those remaining final-record operations are not yet claimed complete.

## Final evidence-bearing bundle verification — TESTED

- Issue: seal final evidence and prove offline trust after SSH transfer.
- Status: TESTED, A–F functional acceptance PASS.
- Changed files: final report, comparison/outage reports and public probe records.
- Exact command: `sudo -n sh -s < verify-final-host.sh` through the recorded
  pinned-host SSH invocation; native `extract` then `load` with external public key.
- Result: new private extraction; all seven image identities verified by actual
  Docker Engine 29.8.0. Bundle SHA-256
  `3c99e5bf022dd8bb93bda9faadab089d9ae822a5f882699718bff7327ed9e5fa`.
- Next action: owner local GPG unlock for signed checkpoint; production keys/DNS
  and public activation require owner configuration/approval.
