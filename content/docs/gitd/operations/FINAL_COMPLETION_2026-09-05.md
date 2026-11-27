# MRML Git / Gitd completion — 2026-09-05

The protected SHA-256 Git stack is implemented and tested over TLS 1.3/H2 in
actual hardened Docker Compose on mrml.ca. The base release keeps H3 disabled.
This record does not approve public activation or claim production readiness.

| Checkpoint | Result | Evidence |
| --- | --- | --- |
| A — multi-repository authority | PASS | Actual shared-root production loader, second-writer exclusion, 22 library + 10 daemon tests; independent protected pushes and durable state for two real repositories. |
| B — bounded compression | PASS | Real loose/pack writers, independent zlib/Git decoding and repack identity checks; identical 8 × 32 MiB text/random fixtures measured before/after on the same VPS. Random performance regression is explicit. |
| C — certificate consumer | PASS | Real certd enrollment, unchanged-response pacing, exact identity/signer revalidation, outage/recovery and generation rotation; 149 library + 7 daemon tests and ASAN. |
| D — H2 and admission | PASS | 92 HTTP tests plus five explicit independent live H2 gates under normal/ASAN builds; real TCP source/admission failure tests, including two IPv4 sources. |
| E — offline trust | PASS | Independently provisioned release key; tamper/key-substitution/archive tests; authenticated inventory and exact seven-image Docker identities verified before use. |
| F — clean-source Compose | PASS | Same seven images throughout the fresh deployment, protected workflows, destructive encrypted restore, hybrid overlap/retirement and two-repository container recreation. |

The tested source is archive SHA-256
`183e65b330de65f785898087a4c29a887161638cdf8e3c9e1d42e321f4c49bbe`, exported
from exact Git index tree
`6ab2a37bfc65a87071a7867db25eedb52bdbcfa6e22dedf713f097b0f320ecad`.
Base HEAD is
`20ecf53e213d1211e2ea41865e1df31cdc59d9a731e29f46c046a3ad5e09d3f5`.
The tree is not a commit: the signed checkpoint timed out waiting for local GPG
unlock. No unsigned commit or invented commit identity was created. The tested
source archive has no .git, build outputs, nested archives, keys or runtime
state. The signed release manifest binds its digest to all images and evidence.

All seven programs were rebuilt locally from the fresh archive extraction with
upstream rustc 1.100.0-nightly, full commit
`17fd5b8a37b6667b6cc137f3cc35f09759768a3b`. The canonical stage-zero frontend SHA-256
is `471c208158d5c0fdf92333ee305aeb62865a0c76b9886c05492d3cd9e6f15b04`.

Changed implementation groups are the authority catalog/candidate/verifier,
Git compression and protected transport, Gitd identity/admission/restore,
certd channel/lifecycle/publication, H2/TLS parsing and offline release
verification. `changed-files.txt` lists the exact 190 source-checkpoint paths.
Public operator scripts and reports added afterward do not change the compiled
source identity.

## Verification

The focused final normal suites passed: authority 22 + 10; Gitd 58 + 8 + 2;
Git 291 + 18; certificate 149 + 7; native fixture 1 + 2 + 3. Ignored helper
children are invoked by parent tests, while real environment gates are recorded
with their explicit commands; they are not silently counted by default runs.
Affected authority, Git, Gitd/backup, HTTP and certificate AddressSanitizer runs
executed successfully. No affected coverage-guided HTTP/Git fuzz target is
declared; deterministic adversarial, mutation and independent oracle tests ran.

Exact normal commands:

```sh
target/release/mrml test org.mrml.service.git-authority --target linux --release
target/release/mrml test org.mrml.service.gitd --target linux --release
target/release/mrml test org.mrml.tool.git --target linux --release
target/release/mrml test org.mrml.service.certificate --target linux --release
target/release/mrml test org.mrml.test.gitd-certd-fixture --target linux --release
```

For each affected sanitizer suite, the recorded command appends
`--sanitizer address`; HTTP uses `org.mrml.library.http`. The native build was
restored after instrumentation, and final image builds use a separate clean
source extraction with fresh normal outputs.

Manifest and lock checks, four Compose policy suites, stage-zero Cargo fmt and
clippy, and diff checks pass. Unrelated failures are retained: four certificate
interface manifests need canonical formatting; the compiler TLS probe is
unadmitted by assurance; seven existing source files fail the scoped rustfmt
check. No allowance or suppression was added for these failures. Exact commands:

```sh
target/release/mrml manifest check
target/release/mrml manifest lock --check
target/release/mrml manifest fmt --check
target/release/mrml assurance check
sh deploy/compose/test-compose-git.sh
sh deploy/compose/test-compose-acme.sh
sh deploy/compose/test-compose-signer.sh
sh deploy/compose/test-compose-credential-agent.sh
(cd packages/tools/mrml && cargo fmt --all -- --check)
(cd packages/tools/mrml && cargo clippy --locked --all-targets -- -D warnings)
git diff --check
git diff --cached --check
```

## Build, verify and deployment

`commands/build-export.sh` contains the exact local seven-image build/export,
SBOM and offline-signing commands. Each native package was built in the fresh
`/tmp/mrml-completion-final-source` directory using:

```sh
/home/m/mrml/target/release/mrml build org.mrml.service.git-authority --target linux --release
/home/m/mrml/target/release/mrml build org.mrml.service.gitd --target linux --release
/home/m/mrml/target/release/mrml build org.mrml.tool.git --target linux --release
/home/m/mrml/target/release/mrml build org.mrml.service.certificate --target linux --release
/home/m/mrml/target/release/mrml build org.mrml.test.gitd-certd-fixture --target linux --release
```

The image command is `podman build --pull=never --network=none`, followed by
`podman save --format oci-archive`. This local image builder is supplemental;
the deployment was exercised with real Docker Engine, not Podman emulation.
`images.git.lock` records each authenticated OCI manifest identity, archive hash,
user and entrypoint; `binaries.sha256` binds the native programs. All payload
layers were inspected for source, compilers and private material before SSH
transfer. Only compiled images and public deployment inputs were transferred.

The externally selected disposable public-key file SHA-256 is
`9c4abb45d88ce25539f9e72e72220d16d9ef36bf5b5b0783803b18d7689ea1e8`.
It is a test release root, not the owner's production signing root. The exact
remote trust bootstrap directory is
`/var/snap/docker/common/mrml-completion-20260905/trusted`; the path name does
not identify the active engine. Verification uses its independently provisioned
`mrml-git-release-v6`, `test-release.pub` and `cosign`, never a key chosen by the
bundle. From that trusted directory, the tested command form is:

```sh
trusted=/var/snap/docker/common/mrml-completion-20260905/trusted
sudo "$trusted/mrml-git-release-v6" extract \
  /home/ubuntu/mrml-git-completion-20260905-config/completion-release.tar \
  /var/snap/docker/common/mrml-completion-20260905/payload-final-complete \
  "$trusted/test-release.pub" "$trusted/cosign"
sudo "$trusted/mrml-git-release-v6" load \
  /var/snap/docker/common/mrml-completion-20260905/payload-final-complete \
  "$trusted/test-release.pub" "$trusted/cosign" /usr/bin/docker
```

Actual absolute-path invocations are retained in `commands/verify-load-host.sh`
and the final verification record. The Compose commands use clean-source archive
files plus documented acceptance/restore overlays, `--no-build --pull never`,
separate non-root processes, read-only roots, dropped capabilities,
no-new-privileges and service-scoped sockets/secrets. Test exposure is loopback
TCP 32443; public port 443 and host networking were not used.

## Limits and owner inputs

The fixed listener profile is IPv4, one active H2 stream per connection, and the
published bounded admission profile. General H2 multiplexing, H3, public ACME
issuance and a new CRL subsystem are not claimed. No universal OCSP staple is
required; chain, hostname, time, key binding and configured TLS Feature
requirements remain enforced. An established 256 MiB native clone completed and verified while real certd
remained stopped; a new TLS handshake was denied. The real idle observation
recorded 42 certd connects / 15.038 seconds, 10.62 Gitd CPU seconds and
37→38 descriptors. This is substantial revalidation cost, not a low-idle-CPU
claim. Seven sequential clean stops completed in two seconds.

Text transfers use about 98.4% fewer wire bytes. Random transfers take 43–82%
longer in the paired comparison; full CPU, RSS, syscall and storage evidence is
retained without raising limits or pruning recovery-safe state. Server sampled
RSS and process-lifetime high-water RSS are labeled separately. Read/write
syscall counts are not presented as all syscall types.

Production keys, identities/DNS and owner approval for public activation remain
outside this disposable qualification. External human audit is deferred. Local
GPG unlock is the remaining input for a signed Git checkpoint; the release
artifacts themselves are signed and verified with the independently selected
disposable test root. Patent review: NOT_TRIGGERED for the corrections to
existing mechanisms; see `docs/patents/REVIEW_LOG.md` for the recorded reasons.

The native measurement probe emits a weak GLIBC_2.39 version warning on the
tested base image; every reported operation completed successfully on this host.

## Final fresh namespace acceptance

All thirteen requested steps passed in the final3 lineage on Docker Engine
29.8.0, Compose 5.5.1, default context, data root `/var/lib/mrml-docker-ce`.
Exact commands and outputs are in `evidence/continuous/`; `run-sequence.sh`
and `continue-sequence.sh` record orchestration. Early readiness denials were
resolved by bounded actual identity readiness checks, without changing images,
limits or durable generations manually. This is one source/image lineage, not
a claim that the first orchestration attempt had no intermediate denials.

| Steps | Result and exact log |
| --- | --- |
| 1–2 | PASS: prepare, initialize-repositories, lifecycle-ready, activate, start-stack |
| 3–4 | PASS: first-clones, three-pushes, fast-forward |
| 5–6 | PASS: malformed, malformed-server-evidence, response-loss |
| 7–9 | PASS: revoke-replace, restart, rotate-ready |
| 10 | PASS: text-benchmark, random-benchmark; eight hashes per fixture |
| 11 | PASS: cold-backup, destructive-restore, activate-restore |
| 12 | PASS: overlap, hybrid-push, retirement, retirement-push |
| 13 | PASS: recreate-durable, final-metadata |

The final restored first-repository head is
`e084f579d909be228b57ae9e4ee2b6012bd4f8f1d95da154990a86f5b48c8be9`.
The final encrypted backup is 809620139 bytes, SHA-256
`94400e175158aac5c1261d8510d4aff11db62ca2e43090038464fe8be1f74a7a`.
Private backup/key material remains on the test host; reports contain only
public hashes and numeric evidence. Both sets of eleven deleted disposable
source volumes remain absent. Recreated first and second clients verified
durable generations and all restored random fixture hashes.

The paired comparison is explicitly before3 versus final2; final3 is an
additional repeat with the real established-work outage measurement.
`evidence/reports/DOCKER_H2_COMPARISON_2026-09-05.md` records full metrics,
including regressions, counter meanings and source differences.

## Authenticated image identities

```text
format=mrml-images-git-v6
version=completion-final-20260905
platform=linux/amd64
image=mrml/git-authority:completion-final-20260905 archive_sha256=6c05e1953568fd86373dec382b535f56481fb3e4a653e632aa65d57129163eac producer_id=sha256:ffe696649bc50014186ce2f5a68b20c07875c7e3ceaeeb24875819a30a426683 user=21002:21002 entrypoint=/usr/bin/mrml-git-authority
image=mrml/gitd:completion-final-20260905 archive_sha256=5027db51eac85ed477848de4f0e58dec73152e864df30e0490d4b7b479896c6c producer_id=sha256:7af704be34bf83066dd907cc33c07650526d4ce9e703ec7a00f3d2eda9acb213 user=21001:21001 entrypoint=/usr/bin/mrml-gitd
image=mrml/git-protected-signer:completion-final-20260905 archive_sha256=c2133489dfcdbe7b5b118eb6e32b074c16eed9b73252343ed2d2334f4a098c16 producer_id=sha256:172c047ad866794e80b1d52f9943a325c2dbc6dae94eb5991989a0bf74476927 user=21006:21006 entrypoint=/usr/bin/mrml-git-protected-signer
image=mrml/git-credential-agent:completion-final-20260905 archive_sha256=933a7cc51f3c11c0dcdafbd798756887fdbd4f379c4b1701a38afe0a1cd46980 producer_id=sha256:72888f9965d50c4f8d59ff00011875aefc243478e006c4a1f4acf74fea7d1320 user=21009:21009 entrypoint=/usr/bin/mrml-git-credential-agent
image=mrml/git-backup:completion-final-20260905 archive_sha256=d949bc222736b6a5c46ef4bb6fe0bbccd4a531425660d6384632a86a27992e94 producer_id=sha256:60cef92c750a0b95301c6e03c2079e0bcca7277d6d59f45f82cb513b7140bebf user=0:0 entrypoint=/usr/bin/mrml-git-backup
image=mrml/certd:completion-final-20260905 archive_sha256=f02b45f0e18836808de47d359349777737c82270375d403244e038adb2d5c784 producer_id=sha256:61021622d106824db233a61e9643b88d502c03e6a024b0e937a9cc5205dd53b9 user=21003:21003 entrypoint=/usr/bin/mrml-certd
image=mrml/git:completion-final-20260905 archive_sha256=40a6305961d4e3ac9e0dfe7a1f86f7d211d1ba2d379db91834a77abec6dde9a0 producer_id=sha256:743fd8d94cfe5734bfdcb25f0e77e2f511df298e059085f25d471df0a3119059 user=21005:21005 entrypoint=/usr/bin/mrml-git
```

Artifact hashes are supplied in the detached `SHA256SUMS`; the release manifest
binds every deployed payload file. The standalone source archive is separate.

Final external-key verification on mrml.ca: **PASS**. Fresh bounded extraction
and Docker load verified all seven exact image IDs, tags, platform, users and
entrypoints. `verify-final-host.sh` and `verify-final-host.log` retain the exact
command and result. Bundle SHA-256:
`3c99e5bf022dd8bb93bda9faadab089d9ae822a5f882699718bff7327ed9e5fa`.
