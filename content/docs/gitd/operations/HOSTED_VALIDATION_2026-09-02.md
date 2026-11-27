# Git/Gitd hosted validation — 2026-09-02

Status: **PARTIALLY IMPLEMENTED**. This record is hosted Linux evidence from
the repository at commit
`9b954520cad99bf66d622bbe4358574587cf58d0175bd5509ad1fa30408415d9`.
It is not public-network, physical-host, real-VPS, power-loss, or independent
security-review evidence.

## Tool and build evidence

The host used Podman 6.1.0 through its Docker-compatible CLI, podman-compose
1.6.0, Buildah 1.45.0, crun, Syft 1.51.0, Cosign 3.1.0, Valgrind 3.25.1, and
cargo-fuzz 0.13.2. The exact digest-pinned Debian verification and distroless
runtime images were pulled before the required network-disabled builds.

The following commands passed:

```text
./target/debug/mrml build org.mrml.service.git-authority --target linux --release
./target/debug/mrml build org.mrml.service.gitd --target linux --release
docker buildx build --platform linux/amd64 --network=none --pull=false --load -f deploy/compose/Dockerfile.git-authority -t mrml/git-authority:b4041d82 .
docker buildx build --platform linux/amd64 --network=none --pull=false --load -f deploy/compose/Dockerfile.gitd -t mrml/gitd:b4041d82 .
./target/debug/mrml build org.mrml.service.certificate --target linux --release
./target/debug/mrml build org.mrml.service.acme --target linux --release
docker buildx build --platform linux/amd64 --network=none --pull=false --load -f deploy/compose/Dockerfile.certd -t mrml/certd:9b954520 .
docker buildx build --platform linux/amd64 --network=none --pull=false --load -f deploy/compose/Dockerfile.acmed -t mrml/acmed:9b954520 .
```

The Git image build inputs and resulting image identities were:

```text
mrml-git-authority binary sha256:56e1d5e46ea549c6b2f53172240894deb165c213d9a04241f74c6fba8a972fcf
mrml-gitd binary sha256:2e63fda9e9edb68199f61a112c0eaaf3b92dbf2fb78f758c57452ee68830b1c8
mrml/git-authority:b4041d82 image id sha256:37eea4cbb47f9525b2ddc3a7ca4f368995ecb9432591b898356321058fe7b0b2
mrml/git-authority:b4041d82 manifest sha256:fc2e231baca762cbdfd44a5c04beb6c2a3457f2087d10956be4c8d9b1b3fbe23
mrml/gitd:b4041d82 image id sha256:10d4ca4f00a61f93f9d5f1fc369fc57ed676f2c0ae2b4c16166ed116e00e3452
mrml/gitd:b4041d82 manifest sha256:77a2cd03476464828f0bf645c8ed41155fc2d745a553ce4a788cab0610e83947
```

Inspection reported Linux/amd64, fixed users `21002:21002` and `21001:21001`,
and only the intended authority or Gitd entrypoint. The exported archives were
successfully scanned rather than relying on a daemon-specific image-store API.
Temporary hosted outputs had these digests:

```text
authority archive sha256:de23d6e3831c221b33d8355183b112c2f19c3b76d129d3423fe469425a5f1bfa
authority SPDX JSON sha256:f7fa414531a15c89c6c8540d9d73dcb0263a1505cb8e51fab417a9c91bf3bd8c
Gitd archive sha256:454f31af03b698ddfcb784083071c350d846a3b19d81d3cc0f222f08b9ce132e
Gitd SPDX JSON sha256:f3186adaa30e1edf4d0d783ef923abfdb004372679c5436d74b38f13a1929fea
```

These temporary artifacts are evidence inputs, not final release artifacts.
The offline builder now scans the exact exported archive. Cosign 3.1.0
successfully signed and key-verified a test archive using an explicit signing
configuration containing no Fulcio, OIDC, Rekor, or TSA service. The keypair
was temporary and test-only; it is not release authority.

## Tests and runtime configuration

AddressSanitizer passed all 215 Git library tests, 4 Git CLI tests, 74 HTTP
tests, and 29 Gitd tests. The Gitd run included its real Unix-socket and
loopback tests. Valgrind with full leak checking and a nonzero error exit passed
2 deterministic hostile Git parser tests, 3 token/profile authentication tests,
and 2 HTTP/2 streaming adapter tests. No repository cargo-fuzz target exists,
so no coverage-guided fuzz campaign is claimed.

The following static gates passed:

```text
deploy/compose/test-compose-git.sh deploy/compose/compose.git.yaml
deploy/compose/test-git-images.sh
sh -n deploy/compose/build-offline-git-bundle.sh deploy/compose/verify-offline-git-bundle.sh deploy/compose/test-compose-git.sh
```

Podman Compose successfully rendered the combined `compose.git.yaml` and
`compose.acme.yaml` model with exact release variables. The rendered model kept
Git authority and certd at `network_mode: none`, published only Gitd TCP/UDP
443, retained non-root users, dropped all capabilities, set read-only roots and
`no-new-privileges`, and retained the declared resource limits and bind mounts.

## Catalog and protected-policy bootstrap follow-up

Follow-up validation used a clean detached worktree at commit
`c54c1763630189cf6f65bff70b52e86be7c0f214` so unrelated edits in the shared
checkout could not enter the binaries or images. Network-disabled pinned image
builds produced:

```text
mrml-git-authority binary sha256:02612a450350f0dd79584a7fa27a4d1ffad02f399ca4521c3bf6f50afc531b8c
mrml-gitd binary sha256:a76a95511c7c72f2020f2bf8cb9c84a3743e76d666d73539606183747b444177
mrml/git-authority:c54c1763 image id sha256:bb621b8b2031e42d4819abba9fc872452f2c235892415920ea14c73084ecb505
mrml/git-authority:c54c1763 manifest sha256:c28e9eb729f90987377abfcb94327fc617cdc61624ee88cba09461a8b79ce476
mrml/gitd:c54c1763 image id sha256:c4ae793b2082df1c40a38305d4e9d2d1a7e3c9f8818996d7c6ccde36f262138e
mrml/gitd:c54c1763 manifest sha256:6de5c3bf53aacee9c6f12217d8fdc0d39774276e7a80510255b6f0bc94c8cb13
```

A rootless Podman helper established production numeric ownership inside an
isolated `/tmp` deployment; no production `/mnt` state was used. The clean Gitd
image authenticated exact profile/repository catalogs, created the SHA-256
`owner/project` repository at deterministic tip
`eff5a40ef7f3b72a26c9ea5d203f87c71896c68cab1938f6bff65c7f90f43380`,
and established the hybrid-required protected policy at that same cutover with
trust/revocation generation 1. A second policy creation failed closed. The
inputs were repository test-only OpenPGP v6 and ML-DSA-65 public fixtures; no
private signing key entered either image. The authority image then opened and
validated the exact same Gitd-owned policy through the read-only shared mount.
An initial authority attempt against mode-`0700` policy directories failed
closed, directly exposing and motivating the owner-writable/public-readable
authenticated-policy directory correction in `c54c1763`.

## Protected receive proof-wire follow-up

The protected proof carriage and authority-install integration was validated
from the shared checkout based on `721d4bb6` with the reviewed proof-wire diff
still uncommitted. This is development evidence, not immutable release
evidence. The canonical Git test command passed 216 library and 4 CLI tests:

```text
./target/debug/mrml test org.mrml.tool.git --target linux
```

Network-disabled Podman builds from the locally available digest-pinned base
images also passed. The resulting development artifacts were:

```text
mrml-git-authority binary sha256:e9be7323a90d5bda9ce7e762eb9e97c8efade5f97ee32c0aecdf6cfe6fd81068
mrml-gitd binary sha256:9211a22b8f29539c63bb41efed6e364cdbb478871d79f83f861e2f6c1f306a5e
mrml/git-authority:proof-wire-test image id sha256:99ccdb49b6df7cc1abdc5d9221274f572f060ef4ac08d9803466b19e7fc6ce41
mrml/gitd:proof-wire-test image id sha256:f09eb51f20ec8782a10f4ddbd585f302328cd86f1e2a7c138c316c9181d4aa92
authority archive sha256:e6ad177a8420ea9730ad3710f553f8270ea409d246dff7291712a1a391a39ec5
Gitd archive sha256:6f4a1d26f804df04554fea20fcd48556171cf22331970c5b1e102a82d9b5d4cb
authority SPDX JSON sha256:155ee1ee5a0154ba7e015ea64edb3be03cc95a646e4feb19fc331e55697e808d
Gitd SPDX JSON sha256:d1a17731b1343f376011d67cd14d7c9cdb986349ed602836db64ab197cb87bd2
```

Image inspection reported users `21002:21002` and `21001:21001` with only
the intended exec-form entrypoints. Syft 1.51.0 scanned the exact exported
archives and emitted valid SPDX 2.3 JSON containing 12 package records per
image. Its optional update check failed because the sandbox had no DNS; archive
scanning itself completed and the outputs parsed successfully.

The authority lifecycle was subsequently exercised from another uncommitted
development build. Its network-disabled image ID was
`sha256:5f9a1dd387cfabb45ade05248af5d49426384761c244392261fd1391f7acbe6a`.
The first container run authenticated its native health request but exposed
that SIGTERM required a forced kill and left `authority.sock`, preventing a
secure restart. After adding synchronous SIGINT/SIGTERM handling and
identity-checked socket cleanup, the hardened container reported `ready`,
stopped within the five-second test bound without SIGKILL, left no socket, then
started, healthchecked, and stopped cleanly a second time. The test used
`network=none`, UID/GID `21002:21002`, a read-only root, empty capabilities,
`no-new-privileges`, and the isolated `/tmp` policy/state tree. This proves the
tested authority lifecycle only; Gitd drain and the combined stack remain
separate required evidence.

## Remaining evidence boundary

The session ran as UID 1000 and `sudo -n` required a password, so the root-only
host provisioners were not executed directly on the host. The isolated helper
evidence above is not a real VPS or host-provisioner run. The combined containers
were not started and no real
clone/fetch/pull/push, process-kill recovery, backup/restore, upgrade/rollback,
or 256 MiB streaming measurement was performed in this run. Those acceptance
items remain required. The real certd integration and rotation test also
remains required before any complete-stack production-readiness claim.

Patent review: **NOT_TRIGGERED**. This change records test evidence and uses
conventional container archive scanning and offline signature configuration;
it introduces no new protected mechanism. See `docs/patents/REVIEW_LOG.md`.

## Protected signer and clean image follow-up

The local-only signed commit `d2737102` was checked in the clean detached
worktree `/tmp/mrml-protected-743e2b11`. Manifest lock and manifest validation
passed. With host-local socket access enabled, all 7 Linux-library tests, 48
runtime tests, 223 Git-library tests, 4 Git CLI tests, 2 protected-signer daemon
tests, 4 authority-library tests, 1 authority-binary test, 29 Gitd-library
tests, and 1 Gitd-binary test passed. Initial sandboxed runs of the socket tests
failed at local bind, then passed unchanged with local socket access; this is an
execution-environment distinction rather than claimed network evidence.

The exact clean commit produced network-disabled, digest-pinned production
images with these identities:

```text
mrml-git-authority binary sha256:b0c30159d42772c2c1d344201caf299a7e1acf7e0de5983e8901a49a74537e16
mrml-gitd binary sha256:272d68092a37de52217d43de0cb221680dac42b62999a535cc65d6cfc5455a68
mrml/git-authority:d2737102 image id sha256:5f9a1dd387cfabb45ade05248af5d49426384761c244392261fd1391f7acbe6a
mrml/git-authority:d2737102 manifest sha256:233c4cfba68683dad4567298029239b5447448b600a1fda36b24a3ed64548e57
mrml/gitd:d2737102 image id sha256:638eb9b592b0447fa1d26143dc82b53b3a549ba023b752130d672423486001fb
mrml/gitd:d2737102 manifest sha256:6e79d91be8c2c093703a4cc3bdd161ccae3adce8aa65ab7dc9b7f3ba4e8dd203
authority archive sha256:2213d42c4dd9b015a313c7e2e4868a6b5a3c71ef8c6411ca30e9e8b0be1a73b0
authority SPDX JSON sha256:382e279fb635e9102c3c59ede2ab45ae313477bc3eb6e3cb9d95ed1058fe31df
Gitd archive sha256:35e8a9d9fc303839ff7157f379050b26506b173b37d6cb9fdad32992211b1e2c
Gitd SPDX JSON sha256:2d1a9784058b41fa817cf7f95bf9f0f146b2f7f9b53f63e9e9ea6843adc02af1
```

Image policy, Compose static invariants, and shell syntax checks passed. Podman
reported the exact fixed users and entrypoints. Syft 1.51.0 scanned each exact
exported archive into valid SPDX 2.3 JSON with 12 package records. The package
inventory contained the distroless runtime set and no Rust toolchain, Git,
OpenSSH, GnuPG, curl, wget, Python, Perl, or package manager.

This follow-up adds a separate purpose-limited protected signer and completes
the client proof-generation route, but it does not change the remaining real
VPS, full certd-backed stack, or 256 MiB transfer evidence boundary above.

## Gitd local capability ownership correction

The production provisioner creates distinct Gitd-side authority and certd
channel-capability copies as UID/GID `21001:21001`, and Compose mounts those
copies read-only into Gitd. A startup audit found that Gitd nevertheless asked
its secure file loader to require the remote service UID for each local copy.
Both dependency-health and serve paths now require the configured Gitd UID for
the local files. Unix peer credentials remain independently checked against the
authority and certd UIDs; this change does not weaken remote peer identity.

The hosted Gitd suite passed 29 library and 2 binary tests with local Unix,
TCP, and UDP socket access. An initial sandboxed run passed the 26 non-socket
tests and failed only the three denied bind operations; the unchanged suite
then passed with local socket access. The production Compose static-invariant
test also passed.

Patent review: **NOT_TRIGGERED**. This is an ownership-consistency correction
for an existing local secret-file check and introduces no new mechanism. See
`docs/patents/REVIEW_LOG.md`.

## Authority Compose health correction

The production Compose healthcheck previously opened the authenticated
authority protocol from inside the authority container as UID 21002, while the
listener correctly admits only Gitd UID 21001. That self-check could never
succeed. Compose now uses a non-signing `listener-health` command that requires
the exact Unix socket type, authority UID 21002, shared socket GID 21901, and
mode `0660`. Gitd still completes the HMAC-authenticated, peer-credential-bound
authority health operation before public listener startup.

The authority suite passed four library and two binary tests with local Unix
socket access. The production Compose invariant test passed.

Patent review: **NOT_TRIGGERED**. This is a conventional local Unix-socket
readiness check and introduces no new cryptographic or authorization mechanism.
See `docs/patents/REVIEW_LOG.md`.

## Authority signer-identity bootstrap

The authority binary now provides `describe-signer` with the same bounded,
owner-checked inputs as `check-config`. It loads and validates the complete
authority configuration, derives the receipt signer identity from the public
receipt-verification key, and emits only the 128-character lowercase hexadecimal
identity required by Gitd. It does not print or export the private seed.

The authority suite passed four library and three binary tests, including exact
lowercase identity encoding.

Patent review: **NOT_TRIGGERED**. This exposes an already derived public
identifier through a bounded administrative command and introduces no new
mechanism. See `docs/patents/REVIEW_LOG.md`.

## Category-only startup diagnostics

Gitd now emits non-sensitive operational categories after certificate identity
authentication and for composition failures in authentication, repository
admission, recovery, backend construction, or cache construction. The recovery
inspection command reports only its bounded error enum. Repository identities,
paths, tokens, keys, request bodies, and object content remain absent.

The hosted Gitd suite passed 29 library and 2 binary tests with local socket
access.

Patent review: **NOT_TRIGGERED**. This adds only bounded operational event
classification. See `docs/patents/REVIEW_LOG.md`.

## Durable pack-limit correction

Container recovery exposed that the 8 GiB HTTP request-body ceiling from the
production example was passed directly to the durable arrival-pack store,
whose deliberate maximum is 2 GiB. Store construction therefore failed before
recovery despite valid storage. Gitd now derives an effective receive-pack
limit as the smaller of the configured body ceiling and the durable store
maximum for live receive and both recovery paths. HTTP framing retains its
independent configured ceiling; repository object limits remain separately
enforced.

The hosted Gitd suite passed 30 library and 2 binary tests, including the 8 GiB
body/2 GiB pack-limit case.

Patent review: **NOT_TRIGGERED**. This is a conservative resource-limit
composition correction and introduces no new mechanism. See
`docs/patents/REVIEW_LOG.md`.

## Protected wire, shutdown, and large-transfer completion follow-up

Local-only signed commits through `1aaf5c1d` were validated from the clean
detached worktree `/tmp/mrml-protected-743e2b11`; unrelated changes in the
shared checkout were excluded from binaries and images. The native client
completed authenticated H2 clone, fetch, pull, and protected push against the
rootless Podman stack. Two protected pushes advanced the repository from
generation 1 through generation 3; the second completed with `Pushed
7e1cf1c7f312 to origin/main`. A following authenticated fetch installed eight
objects and one branch ref, and native status reported zero ahead and zero
behind. Each activation produced a 329-byte authenticated receipt.

The sequence found and corrected hybrid-only policy admission (`694b72ce`),
one-generation receive response matching (`09b754cb`), selected arrival-pack
startup composition (`0e171cac`), and container-directed SIGTERM handling
(`388758b8`). The exact `388758b8` image stopped in less than one second with
exit code 0, emitted `shutdown_signal_received` and `shutdown_complete`, and
was not escalated to SIGKILL.

The 256 MiB gate used four independent 64 MiB incompressible blobs. It exposed
an H2 upload stall at the initial 65,535-byte window; `47eeadfd` retains a
non-final early response head while continuing window updates. A failed receive
also left pending proofs in the long-lived authority adapter; `55fac822` makes
each explicit serialized receive boundary replace only stale in-memory proof
state. Unit tests cover both repairs.

Gitd then received and validated a 268,456,731-byte pack, installed immutable
arrival `885e8e7c47bff6a3bbcb1befc7436401`, advanced generation 3 to 4, and wrote
a third 329-byte authenticated receipt. Podman's cgroup observation remained
below the 2 GiB limit (approximately 616 MB observed during validation), while
authority remained about 1.7 MB. The original `/proc` sampler crossed a
rootless PID namespace and is not authoritative RSS evidence. The client timed
out while waiting for CPU-bound validation after the full pack arrived;
`1aaf5c1d` retains the 30-second handshake timeout and applies a bounded
15-minute timeout only to established H2 application I/O. A subsequent large
clone still ended with a generic H2 transport failure, so no successful large
clone is claimed. The successful server-side receive, immutable arrival,
generation advance, authenticated receipt, and cgroup ceiling are the evidence
for this large-transfer gate.

Exact final test results:

```text
./target/debug/mrml test org.mrml.service.gitd --target linux
  PASS: 32 library, 4 binary tests
./target/debug/mrml test org.mrml.tool.git --target linux
  PASS: 224 library, 4 CLI, 3 protected-signer tests
./target/debug/mrml test org.mrml.library.http --target linux
  PASS: 75 tests
./target/debug/mrml test org.mrml.library.tls --target linux
  PASS: 34 tests
deploy/compose/test-git-images.sh
  PASS
deploy/compose/test-compose-git.sh deploy/compose/compose.git.yaml
  PASS
```

Final network-disabled images and exports at `1aaf5c1d`:

```text
mrml-gitd binary sha256:0952cdeb32612a1100deb9ca888af368adf3881f65beb96aced340dccb2bdf55
mrml-git-authority binary sha256:63426fb1d7e22fee0204387bfa3026678f3c82514b90198f2cd7414d18fae54e
mrml-git client binary sha256:d15efe88b04c434524d972a7f706a627a64938060025dc4ba35ff5c31e20c8e7
mrml/gitd:1aaf5c1d image id sha256:c49b05c893f4b2badf35a244f133fad31875daeaf358d41084dba07e95124b39
mrml/gitd:1aaf5c1d manifest sha256:c90b622ca16c8bfeb629abb18c5129fbb3430cdaf37a3dbb4b833167a9617644
mrml/git-authority:1aaf5c1d image id sha256:ad4bd633a1ab4c377fd139d84b932ca9d6ab46f1350d99b40d2d91cd2b7c6193
mrml/git-authority:1aaf5c1d manifest sha256:d1ed5e040116e739ce9b838ce41339c3f6b7b7c3701a82aa60a459b39e04dea6
Gitd archive sha256:3695ac16988c246713d82c1b3f98e9b046d1d761168d7ef63d98c5632852acb8
authority archive sha256:8fe5982e5889acb8d17ab9f0390c1277ea3ceac02aded2be94ad2df8a71677df
Gitd SPDX JSON sha256:1ad34fc068a1890b38e83d24873ca8fdc0edd7267b6f7c989f6f409861e103f4
authority SPDX JSON sha256:df90d4198790f58928031d311371234c1a88f121d432caa3c2e13a1e05ea6c36
```

Inspection reported Linux/amd64, users `21001:21001` and `21002:21002`, and
only the intended exec-form entrypoints. Syft 1.51.0 scanned each exact
Docker-format archive into valid SPDX 2.3 JSON with 12 package records. The
inventories contain the distroless runtime packages and no Rust toolchain,
Git, OpenSSH, GnuPG, curl, wget, Python, Perl, or package manager.

This remains hosted local-loopback rootless-Podman evidence. The certificate
service was the explicitly test-only fixture and was not included in either
production image or production Compose file. It is not evidence for a real
certd deployment, public network, VPS, physical host, power loss, H3 large
transfer, or independent security review.

## Large-fetch transport and initial-clone correction

Follow-up validation through signed local commit `dac14c19` isolated the
remaining large H2 failure. Gitd completed the response and then cleared the
completed stream before reading response-body `WINDOW_UPDATE` frames that had
legitimately raced behind its final DATA frame. The server rejected the old
stream update and closed TLS while the client was still acknowledging data.
`8d476041` retains the completed stream until the next request HEADERS arrives.
The HTTP suite passed all 75 tests, including a 256 KiB response spanning
multiple flow-control windows.

The corrected real-container H2 transfer fetched and installed all objects for
a 268,456,731-byte protected repository. Four independent 64 MiB incompressible
files were restored from the fetched objects and matched their sources exactly:

```text
74a2500349e10eb91073623d93d6b0d960073d407acf18434ad1f8b97d81c54b
db6bd32d084e1b5fdf37c1af286370aea8d6b80a2882e7c5cba0ed381f85a57b
eb60a02c65f43d67197d08aad6eaf368060b6728de9f04a59a254d8a07691b94
c10c3224d17e4f39d5d20605bc614777c363ae886fbd5356979dd69dfe177f4f
```

The controlled local run took 8,127 seconds, or 33,032 source bytes per second.
Podman cgroup samples reported a Gitd peak of 144,814,080 bytes and 35
processes/threads under the configured 2 GiB memory and 192 PID limits; the
authority peak was 1,654,784 bytes and two processes/threads. These are hosted
rootless-Podman observations, not physical-host or VPS measurements. The very
low deterministic level-9 throughput on incompressible data remains an explicit
performance risk; no production throughput SLA is claimed.

The transfer then exposed a separate initial-checkout ordering error. The clone
path created the branch ref before invoking ordinary branch switching, so the
newly non-empty HEAD made the still-empty initial index appear dirty.
`dac14c19` materializes and writes the authenticated target index before branch
ref and HEAD activation. The Git suite passed 225 library, four CLI, and three
protected-signer tests, including a fresh-initial-checkout regression. The
already fetched large repository was reset/restored with the corrected binary
and reported a clean index and worktree. Because the original large clone
process exited at the post-fetch checkout error, this evidence proves the large
transfer, object installation, payload integrity, and corrected checkout logic
separately; it does not relabel that original process exit as success.

Final network-disabled local images and exact exports at `dac14c19`:

```text
mrml-gitd binary sha256:3ee621e0bdcb5cd554d859ca254da97fcd0542dabcdea23c366c9ff04df2114d
mrml-git-authority binary sha256:63426fb1d7e22fee0204387bfa3026678f3c82514b90198f2cd7414d18fae54e
mrml-git client binary sha256:432235bbdaba8fb16fa15a009bc1bdd383514a124d0920812062bfd2fc02bf04
mrml/gitd:dac14c19 image id sha256:d9e22bda065fec0e79a58582b4a081ca39248fbbf7b61cb90afa073b0a39e8fe
mrml/gitd:dac14c19 manifest sha256:77733e55297bdb90ef4365c36f994b0e5128ddcc65ede80e170d87505c973c8f
mrml/git-authority:dac14c19 image id sha256:ad4bd633a1ab4c377fd139d84b932ca9d6ab46f1350d99b40d2d91cd2b7c6193
mrml/git-authority:dac14c19 manifest sha256:d1ed5e040116e739ce9b838ce41339c3f6b7b7c3701a82aa60a459b39e04dea6
Gitd archive sha256:f174e74b6c2f8f06022027d1c78833ae7e12a6fd2068d400cd823d13e21ad1c3
authority archive sha256:93c067e0383874eb207d00b7e3ac3d77a63a5ff681f36f75ceff3846ca7271e9
Gitd SPDX JSON sha256:6fac2b4d6c7d5f387616a63231665982a38e35a87cfb193fca6a939e1f0daac2
authority SPDX JSON sha256:6be316c841f62ded8f44cf7fa68cf3032509cd12d6f248baebe5a5b0ec52c7d7
```

Syft 1.51.0 produced valid SPDX 2.3 JSON with 12 runtime package records per
exact Docker-format archive. No Rust toolchain, source tree, Git, OpenSSH,
GnuPG, curl, wget, Python, Perl, or package manager was present.

Patent review: **NOT_TRIGGERED**. The corrections use conventional bounded
protocol state, generation matching, startup composition, POSIX termination,
per-operation timeouts, and in-memory transaction cleanup. They introduce no
new cryptographic primitive, compression selection, similarity mechanism,
cache policy, or storage-selection mechanism. See
`docs/patents/REVIEW_LOG.md`.

## Managed-volume VPS provisioning follow-up

Production Compose now gives every service data set, runtime socket directory,
secret, and configuration file its own explicitly named Docker volume. No
production service uses a host bind mount. The Git and ACME provisioners create
the complete 22-volume set, inspect the exact engine-reported mountpoint shape,
initialize owner and mode only for a newly created volume, and fail closed when
an existing volume does not match the declared owner or mode. A separate
stopped-service installer places each secret or configuration input into its
purpose-specific volume, refuses a running consumer, and refuses overwrite.

The owner-authorized Ubuntu VPS at `mrml.ca` ran Docker Engine 29.6.1 and
Compose 5.3.1. Both provisioners completed twice against the same 22 volumes,
demonstrating creation and idempotent validation. The combined Git and ACME
Compose model rendered successfully using only those volumes. Installing the
checked-in Gitd example configuration into a stopped service volume produced
root ownership and mode `0444`; a second installation was rejected. This was
an installer-path test, not production configuration, and no service was
started.

The Git backup command then archived the separately scoped Gitd and authority
data, secret, and configuration volumes. Its checksum sidecar verified, and
the corrected archive contained the expected logical paths for repositories,
state, quarantine, receipts, policies, service secrets, and service
configuration. Restore preflight verified the checksum and rejected the
already-existing repository volume before mutation. A destructive full restore
was not performed because the existing test volumes were retained pending
explicit owner approval; full restore therefore remains unproven.

Public deployment also remains blocked by real configuration rather than
container storage. `mrml.ca` resolves to the VPS, but `git.mrml.ca` has no A
record and the zone uses OVH nameservers, while the implemented DNS-01 adapter
is Cloudflare-specific. No supported provider token or zone identifier was
supplied. Owner-selected production OpenPGP and ML-DSA trust keys were also not
supplied. Test fixtures are not substituted for owner trust roots. Images may
be loaded and retained stopped, but this evidence does not authorize or claim a
public TLS deployment.

Patent review: **NOT_TRIGGERED**. Named container volumes, exact ownership and
mode checks, stopped-consumer input installation, conventional archive backup,
checksum verification, and no-overwrite restore preflight introduce no new
protected mechanism. See `docs/patents/REVIEW_LOG.md`.

## Bounded-compression clone completion

Signed local commit `6a373415` applies a fixed public-length policy to native
Git object compression: objects at or below 1 MiB retain the deterministic
dynamic-Huffman/LZ77 encoder, while larger objects use RFC 1951 stored blocks.
This bounds encoder work on large incompressible inputs and deliberately trades
archive size and bandwidth for predictable compression time. The Git suite
passed 228 library, four CLI, and three protected-signer tests, including a
large-input stored-block regression.

An exact `6a373415` Gitd image and exact release client then completed a fresh
H2 clone of the protected repository containing four independent 64 MiB
incompressible blobs. The command exited zero, installed branch `main` at
`a8df7b942d71dc14b86122c37884a77a0c9cb2b9d47427aa00d9cd7481f9f20f`,
reported zero ahead and zero behind, and reported a clean index and worktree.
Every restored payload matched its source SHA-256 digest:

```text
74a2500349e10eb91073623d93d6b0d960073d407acf18434ad1f8b97d81c54b
db6bd32d084e1b5fdf37c1af286370aea8d6b80a2882e7c5cba0ed381f85a57b
eb60a02c65f43d67197d08aad6eaf368060b6728de9f04a59a254d8a07691b94
c10c3224d17e4f39d5d20605bc614777c363ae886fbd5356979dd69dfe177f4f
```

The uninterrupted controlled local run transferred 268,456,731 source bytes
in 8,133 seconds, or 33,008 source bytes per second. Podman cgroup samples
reported a Gitd peak of 146,104,320 bytes, 35 processes/threads, and 98.13% of
one CPU; authority peaked at 1,654,784 bytes and two processes/threads. The
evidence SHA-256 manifest verified. This proves correctness and bounded memory
for the tested hosted H2 clone, but the throughput remains a material
performance risk and no production throughput SLA is claimed. It is not H3,
public-network, VPS, power-loss, or physical-hardware transfer evidence.

Patent review: **NOT_TRIGGERED**. The fixed threshold selects conventional RFC
1951 stored blocks by public object length and introduces no new compression,
similarity, or storage-selection mechanism. See `docs/patents/REVIEW_LOG.md`.

## Final offline image load on the VPS

The clean detached release worktree at signed local commit `e87b9931` passed
manifest lock and manifest validation. Unchanged final suites passed 4+3
authority tests, 32+4 Gitd tests, 228+4+3 Git tests, 75 HTTP tests, 34 TLS
tests, 137 certificate tests, and 14 ACME-worker tests. The first sandboxed
authority run passed its three non-socket cases and was denied a local Unix
bind; the unchanged suite passed with local socket access.

Network-disabled builds produced the following release binaries and local
Podman image IDs:

```text
mrml-git-authority binary sha256:63426fb1d7e22fee0204387bfa3026678f3c82514b90198f2cd7414d18fae54e
mrml-gitd binary sha256:2b5acce6a0b543729c0baa7b2036eb58166a05a7ff094624448b9d6b288aae83
mrml-certd binary sha256:562f397220ac08ad6cbf29bb42346c85a31b69fb8845c27108b4278334e670c6
mrml-acmed binary sha256:2c116780a0d09d1f3889038165d5d1317f84919469bb6171f9072b205e7d191e
mrml/git-authority:e87b9931 image id sha256:5e552bfde4aa315cde6682739d502ef383ecea23211ae0f256c6a4ab13e88e3e
mrml/gitd:e87b9931 image id sha256:8cfa09d8c01152e98242b7afd013ef2c4ff505b3e5c6b332744c1a561c49d36e
mrml/certd:e87b9931 image id sha256:97cbd28b123cfbb7600c2d1671ce658e1e472d01cf1a423c544d3b1a171a6928
mrml/acmed:e87b9931 image id sha256:3bda639da1c29304dc64c00a63c595400530556df2ac40203e91ed29c700b089
```

Syft 1.51.0 scanned each exact Docker-format archive into SPDX JSON. The
104 MiB staging set included those archives, image inspection JSON, SBOMs,
both Compose files, both volume provisioners, the stopped-service volume input
installer, and Git backup/restore scripts. Its inner SHA-256 manifest verified
locally and again after SCP to the VPS. Exact archive digests were:

```text
git-authority.tar sha256:a0d3ea40bcf01802069dcad9e18546e738c3110b7034ba581fac613367f3924e
gitd.tar sha256:2a6ccb358de31e795e1a0612e47c67513a214b79a5ddacc1e2c64ba0805c5e2a
certd.tar sha256:5f8293aa5925a4b142aff608cf4284a77b88944658ed8f16bcb7899409e8056c
acmed.tar sha256:013bd831325e6c401eb492055ee4652d67fe6230d264ef81241ee4a82ee87539
```

Docker Engine 29.6.1 on the owner-authorized VPS loaded all four archives.
Because the Podman-produced Docker archives carried `localhost/mrml/...` tags,
the VPS added equivalent `mrml/...:e87b9931` local aliases without pulling or
rebuilding. Docker reported Linux/amd64, the intended entrypoints, and fixed
users `21001`, `21002`, `21003`, and `21004`. The combined Git and ACME
all-volume model rendered successfully against those tags. No MRML container
was started.

This completes build, test, export, checksum, metadata/SBOM, SCP, remote
checksum verification, and `docker load` evidence. Production start remains
intentionally blocked on the real DNS/provider configuration and owner-selected
trust roots described above; substituting fixtures would violate the deployment
and owner-sovereignty requirements.

Patent review: **NOT_TRIGGERED**. This records conventional offline image
export, checksums, SBOM generation, SSH transfer, Docker load, and Compose
render evidence. See `docs/patents/REVIEW_LOG.md`.

## Normal trust-transition and image refresh follow-up

Signed local commit `386883af` added exact-candidate payload binding to normal
trust transitions, the crash-durable ordinary transition store path, and a
networkless Compose admin profile fed only by Docker-managed volumes. A clean
detached worktree at that exact commit passed 228 Git library tests, 4 Git CLI
tests, 3 protected-signer tests, 4 authority library tests, 3 authority binary
tests, and the Git Compose static-invariant test. Podman Compose also rendered
the combined Git and ACME configuration and selected the separate
`git-trust-transition` service only with the `admin` profile.

Clean release builds produced:

```text
mrml-git-authority binary sha256:d1b6fbc038e05cc0c18b3a56e810956f5333c538e33eca844ee3fdf8d2e41ddc
mrml-gitd binary sha256:2b5acce6a0b543729c0baa7b2036eb58166a05a7ff094624448b9d6b288aae83
git-authority.tar sha256:e80ad3fe1f686dd7eeac8fb385d0ca1389afb78831053ee52d438f0388722dcf
gitd.tar sha256:614c5666414f4d829d504bab53721526ee96817c0dada1f5c3e938f73d51d1ac
git-authority SPDX JSON sha256:6422906b3ae8cfed633a13bc34024df2a02240f63cf37f91325da82ccffda18c
gitd SPDX JSON sha256:a94212278a801783b2f0f480901290a4312138bf1caad81b4f91a491c59b3e5b
```

All four artifact checksums passed locally and after SCP to the authorized VPS.
Docker loaded both archives offline; after the documented local tag
normalization, the VPS reported:

```text
mrml/git-authority:386883af sha256:f40e11355a506df06b0a0e2331650df73114e9d245481b2d90535ed0f9fe750f user=21002:21002 entrypoint=/usr/bin/mrml-git-authority
mrml/gitd:386883af sha256:dfe15215ef7e3a9ad9144feca01f7dded3ee57ab48ad44e9a90f4f1f89eee252 user=21001:21001 entrypoint=/usr/bin/mrml-gitd
```

No MRML container was running after the load. The source-only review archive
`mrml-git-review-386883af.tar.gz` verified locally and remotely at
SHA-256 `ce2af07b01f952127da016240919e181eae61006562fae7b8a2ec5352169553d`.
An actual normal trust transition was not exercised because no owner-selected
production key pair, next policy, or four matching detached authorizations were
available; fixtures were not substituted. Production startup remains blocked
on those owner inputs and the DNS/provider inputs recorded above.

Patent review: **NOT_TRIGGERED**. This follow-up records conventional build,
test, SBOM, archive transfer, checksum, Docker load, and configuration-render
evidence; the transition implementation review is recorded separately in
`docs/patents/REVIEW_LOG.md`.

## Bounded SSH rekey and exact image refresh

Signed local commit `aba80e24` completed native SSH packet, byte, and key-age
accounting, encrypted Curve25519 rekey, sequence preservation, current-plus-next
host-key revalidation, and phase/idle/total deadlines. The exact detached
worktree passed manifest lock and manifest validation; 29 SSH, 228 Git library,
4 Git CLI, 4 protected-signer, 75 HTTP, 34 TLS, 4 authority library, 4 authority
binary, 32 Gitd library, and 4 Gitd binary tests passed. The first sandboxed
SSH run passed 28 cases and was denied its loopback bind; the unchanged suite
passed with local socket access.

Network-disabled builds produced these binaries and exact Docker-format
archives:

```text
mrml-git-authority binary sha256:662512725653aa0a9a42331a6ab6b100f182183156a345927dec1baa751ddc4b
mrml-gitd binary sha256:6e83af3044cfdb5c55e2538a3b376de841767b5b42b6e874a8b17aa797890ea9
git-authority.tar sha256:4c07f617c437a4f38ae9486a88712e935ec8a31bf5f31e1c06a98c5feccf73f8
gitd.tar sha256:9b42d8c2a70d577e2f5caa9fde6e47448bc92f59e0a85427ad26db24dea2bcf3
git-authority SPDX JSON sha256:efea8af38e6c613c803befae3281ba49bfca5d04265c1f99e26f4c77feb1da74
gitd SPDX JSON sha256:e1a5f503e749fa96ba6ade8a9dab045380f168fdb08e87f66a9201a14c69d12f
```

Syft 1.51.0 scanned the two exact archives. Their strict SHA-256 manifest
verified locally and again after SCP to the authorized VPS. Docker Snap could
not open an archive below `/tmp` by pathname, so the already-verified bytes
were streamed to `docker load` on standard input; no removable-media permission
or bind mount was added. Podman archive tags were normalized locally on the VPS.
Docker then reported Linux/amd64, users `21002:21002` and `21001:21001`, and
entrypoints `/usr/bin/mrml-git-authority` and `/usr/bin/mrml-gitd`. The image IDs
in Docker's store were respectively `sha256:bf6cbf70e6857c3acd4bad7c813f01e86e6dcc8549fe1d85f0f4a6df4ec49b3e`
and `sha256:3c26fcf95628a635660c163f631725d83afa23900692fa3bdca59165c942861e`.
No container was running after the load.

The VPS retains the complete named-volume set. Metadata-only inspection showed
the expected fixed-owner Gitd, authority, certd, and ACME channel secrets, but
the authority configuration volume still has no owner OpenPGP/ML-DSA public
keys and the certd/ACME configuration volumes remain empty. `git.mrml.ca` now
resolves with `mrml.ca` to the VPS IPv6 address, superseding the earlier missing
DNS evidence, but a real owner-selected signing policy and production
certificate-service configuration are still absent. Starting Internet-facing
services would therefore violate fail-closed startup requirements, so the
images remain loaded and stopped. The production Cosign owner key required to
create the signed distribution bundle was also not supplied; test keys were not
substituted.

Patent review: **NOT_TRIGGERED**. This follow-up records conventional SSH rekey
bounds, exact release builds, SBOM generation, checksum transfer, standard-input
Docker loading, and metadata-only volume inspection. See
`docs/patents/REVIEW_LOG.md`.

## Exact Gitd recovery, streaming, bundle, and fresh-volume follow-up

The clean `1796bfe2` candidate completed an authenticated loopback clone of
268,456,731 source bytes in 24 seconds, or 11,185,697 bytes/second. Seventeen
samples recorded Gitd peak RSS of 70,992 KiB, RSS growth of 65,888 KiB, and 26
peak descriptors. The client peaked at 331,156 KiB and 5 descriptors; authority
peaked at 12,368 KiB and 9 descriptors. The four 64 MiB incompressible fixture
files independently matched their expected SHA-256 digests after checkout.

A live test stopped the certificate fixture during an in-flight bounded wait.
Gitd remained running, classified the severed request as `Read`, classified
subsequent absence as `Connect`, blocked new TLS handshakes, applied jittered
exponential delays, and emitted `certificate_refresh_recovered` after the
fixture returned. A fresh authenticated 256 MiB clone then completed with the
same four file digests. Existing validated connections were not killed by the
refresh worker. The fixture and loopback endpoint are test evidence, not a
production certificate-service claim.

The exact offline bundle `mrml-git-1796bfe2.tar.gz` has SHA-256
`cbec1999e5cec7f01a8ec9328d0f89bc6a97357f1e5a0178784fc37e4d1b9480`.
Its four Docker archives, SPDX JSON SBOMs, test-only offline Cosign bundles,
binary digests, streaming evidence, and complete SHA-256 manifest verified
locally. The first self-verification exposed that the archive omitted source
files required by its own Compose policy checks. Signed commit `1796bfe2`
corrected this by embedding only exact Git-tracked policy inputs with
`git archive`; the corrected archive passed both policy suites from that sealed
subset. Ignored and untracked production inputs cannot enter that subset.

The outer digest and every inner SHA-256 entry verified again on the authorized
VPS. Docker Engine 29.6.1 loaded the archives from standard input because Docker
Snap could not resolve their `/tmp` path. Docker reported these runtime
identities after canonical local tagging:

```text
mrml/git-authority:1796bfe2 sha256:958fd49ba7ace0f2d161facaa6b1f33cc0ae8df1b8d40237f4a6dcb3d30b765e user=21002:21002 entrypoint=/usr/bin/mrml-git-authority
mrml/gitd:1796bfe2 sha256:69f29be9469c80294424db0e61c2868432d487e6c8d47a7911ef545194f9905f user=21001:21001 entrypoint=/usr/bin/mrml-gitd
mrml/git-protected-signer:1796bfe2 sha256:64b87e3c10783cf4909b9f99cfe818825d39872674ca46d2329786d9368782a8 user=21006:21006 entrypoint=/usr/bin/mrml-git-protected-signer
mrml/git-backup:1796bfe2 sha256:0f64dbbb830d224f07df001628bf2f6f51fa3b9c08aaebafc554ca35339a002c user=0:0 entrypoint=/usr/bin/mrml-git-backup
```

The first truly empty-host provision attempt found that numeric `install -o`
was not portable to a host without matching passwd entries. Signed commits
`6ebcf4e5` and `60e32e32` changed secret temporaries to exclusive `mktemp`
files inside isolated volumes, changed sentinel ownership to numeric `chown`,
and added exact managed-label, owner, mode, size, and link-count checks. From an
absent `/mnt/mrml-phase21-60e32e32` root and zero matching volumes, the corrected
provisioner succeeded twice and retained exactly 16 named volumes.

The resulting loopback-only fixture stack did not pass the container-start
gate. Kernel audit records show Docker Snap's `snap.docker.dockerd` AppArmor
profile denied entrypoint execution with `info="no new privs"` for both fixed
numeric service users. Removing `no-new-privileges:true` would weaken a required
production isolation invariant, so the failed test containers and network were
removed while all named volumes were retained. This server therefore proves
offline load and fresh named-volume provisioning, but not a production daemon
start. A non-Snap engine whose LSM profile permits execution under
`no-new-privileges`, or a narrowly reviewed corrected Snap/AppArmor policy, is
required before the start gate can be rerun. Real certd configuration and
owner-selected production trust inputs also remain required.

Patent review: **NOT_TRIGGERED**. This follow-up records conventional bounded
retry, resource sampling, tracked-file archival, checksum/signature
verification, exclusive temporary-file creation, named-volume provisioning,
standard-input image loading, and LSM diagnostics. See
`docs/patents/REVIEW_LOG.md`.
