# Exact Git offline release validation — `48d672ab`

Status: complete exact-commit streaming measurement, local offline-bundle
verification, source-review-archive construction, server upload, checksum
verification, image loading, and runtime identity inspection. The signatures
use a generated non-production offline Cosign key. The running service remains
loopback-only with the explicit certd test fixture; this is not production-key,
public-network, real-certd, or independent-review evidence. No repository push
was performed.

## Exact streaming gate

The native client was built from clean detached worktree commit `48d672ab` and
uploaded as a controlled test image. On the authorized Linux server, a fresh
named client volume cloned the restored protected repository through native
HTTP/2. The selected history contained four 64 MiB incompressible files and
268,456,731 source bytes. The scoped token existed only in the remote shell and
was piped to the client on standard input. All runtime and persistent container
state used named volumes.

```text
exit_status=0
elapsed_seconds=41
throughput_bytes_per_second=6547725
samples=33
client_peak_rss_kib=383052
client_peak_fds=5
gitd_peak_rss_kib=142676
gitd_peak_fds=25
authority_peak_rss_kib=6976
authority_peak_fds=9
client_volume_peak_bytes=805366056
```

The evidence directory's strict `SHA256SUMS` passed both before download and
after download. The client reported:

```text
Cloned https://git.example.invalid:30443/owner/keygen.git into /work/repository on branch main
```

This server run is slower than the 10.297 MiB/s exact local regression recorded
at `66806028`, but it is not the former approximately 33 KiB/s failure. Memory
did not grow one-for-one with the 256 MiB pack. Incremental and no-change fetch
evidence for the final client is recorded separately in
`HOSTED_VALIDATION_2026-09-04_STREAMING_PERFORMANCE.md`.

## Complete offline bundle

The checked-in builder ran its manifest and lock gates, image and Compose
policies, trust-transition process-kill matrices, and authority, Gitd, Git,
protected-signer, and credential-agent tests. It rebuilt the release binaries,
built five distroless/root-administrator images, exported them without a
registry, generated Syft SPDX JSON SBOMs, and created an offline Cosign bundle
for every image.

The archive was independently extracted into a new directory and passed
`verify-offline-git-bundle.sh`: all internal checksums, exact streaming
evidence, image locks, five SBOMs, five signatures, and embedded policy-source
tests passed. Transparency-log verification was deliberately absent from this
offline test-key profile and is not claimed.

```text
offline archive: /tmp/mrml-git-48d672ab.tar.gz
size:            47 MiB
SHA-256:         9ec206f1c05d3a883c5b4761af16895a987b538fb217233de45917f92dcea2a2
format:          mrml-images-git-v5
platform:        linux/amd64
```

Exact locked images:

| Image | Archive SHA-256 | Producer image ID | User |
| --- | --- | --- | --- |
| `mrml/git-authority:48d672ab` | `b4b98fec8d237222d7136413a00ddc90d64ef84850ee3a408058651f01b68d6d` | `ba58fac80f1088ac75551ac372e1d5014585bbcd834754ddd6558ddf8b5bb144` | `21002:21002` |
| `mrml/gitd:48d672ab` | `d3f67d6e4843cc059b0d120d7239c031b70a9155984892d646a7a70701af3a93` | `4f85e070666a3b25e9a0445054c308a07512391435e2b291c06bcb2379fbed30` | `21001:21001` |
| `mrml/git-protected-signer:48d672ab` | `833dafc3d86d9c4a33a46ba52a5ff0d8aaf86b6f31ac61c77a424b4588234714` | `3c1a4b5767cb653b899f79465ad035d203e6369d4f3a8836cc272aa1c93046f2` | `21006:21006` |
| `mrml/git-credential-agent:48d672ab` | `2ea5208d225b813218188bf9ae1f21776a23371a1ba91cbaf1b5837549eb4de5` | `8411480206404686d2a60d0d65f1eb304f2a60c624d8a5633e829a8a794b3b83` | `21009:21009` |
| `mrml/git-backup:48d672ab` | `efde251952870334989bae68b7baf861afe77c4fca6b13522824979def6a88db` | `95b6e1392836fad40bd7cec33c09ede6c01356baa47f5da112af1a2722fbb6c2` | `0:0` one-shot administrator |

The authorized server independently verified the outer archive digest and
strict internal `SHA256SUMS`, then loaded all five archives with rootful Podman
without a registry or build. Runtime inspection exact-matched every UID/GID and
exec-form entrypoint. The restored authority and Gitd were already running the
same producer image IDs now locked as `48d672ab`; Gitd remained bound only to
`127.0.0.1:30443`. Its repository and authority state volumes retained
`org.mrml.managed=true` and `org.mrml.restore-disposable=true` labels.

A subsequent production-engine audit found that the unprefixed production
named volumes are owned by Docker Snap, while the destructive-restore target
above intentionally used rootful Podman. The same five already verified image
archives were therefore also streamed into Docker Snap with `docker load`, and
their imported `localhost/mrml/...` tags were locally aliased to the exact
`mrml/...:48d672ab` names consumed by Compose. No registry, pull, or server-side
build was used. Docker runtime inspection reported:

```text
mrml/git-authority:48d672ab       sha256:e3c983e1a908 21002:21002 /usr/bin/mrml-git-authority
mrml/gitd:48d672ab                sha256:f4ac80a5ca28 21001:21001 /usr/bin/mrml-gitd
mrml/git-protected-signer:48d672ab sha256:89d70cf13ba7 21006:21006 /usr/bin/mrml-git-protected-signer
mrml/git-credential-agent:48d672ab sha256:cd0042804681 21009:21009 /usr/bin/mrml-git-credential-agent
mrml/git-backup:48d672ab          sha256:67a4bd22161b 0:0         /usr/bin/mrml-git-backup
```

The Docker production namespace already contained MRML-managed Git, authority,
signer-runtime, certd-runtime, backup, certd, and acmed named volumes. Metadata-
only inspection found generated ACME state/channel/backup keys, but no
`cloudflare-api-token`; the production certd and acmed configuration volumes and
the Git authority configuration volume were empty. Consequently no production
container was started and public port 443 remained untouched. Populating those
owner/ACME-agent inputs is a real prerequisite, not a value that Git deployment
automation may invent.

## Source-only review archive

The deterministic review builder screened the exact commit's tracked paths for
secret, runtime, backup, quarantine, production-environment, and private-key
names before archiving. Its sidecar checksum and gzip stream reverified.

```text
/tmp/mrml-48d672ab-source-review.tar.gz
SHA-256 1e01fcd7d7ad1a65de8e747dbb1a032c09210d4d4219bad7edb311b24944d6d7
size 5.0 MiB
```

The archives, downloaded measurement directory, controlled client image, and
test Cosign key are validation artifacts in `/tmp`; they are not repository
content, production credentials, or owner production inputs.

Patent review: **NOT_TRIGGERED**. This increment measures and packages already
implemented mechanisms using conventional process accounting, archives,
checksums, SBOMs, and offline signatures. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
