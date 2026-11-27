# Git backup and destructive restore validation — 2026-09-04

Status: hosted Linux Podman disaster-recovery evidence using
generated/disposable test state. This is not production-key, public-network,
physical-hardware, power-loss, or production-certificate evidence.

The validation used Podman 6.1.1, Linux/amd64 images, Docker-managed named
volumes only, and no host bind directory. The current Gitd one-shot initializer
created `owner/project` at repository generation 4, trust generation 1, and
revocation generation 1 with initial SHA-256 tip
`eff5a40ef7f3b72a26c9ea5d203f87c71896c68cab1938f6bff65c7f90f43380`.
The authority-generation record was independently encoded for the same exact
repository and generation. Controlled public OpenPGP-v6 and ML-DSA-65 keys were
used to initialize a hybrid-required policy; no private key entered the backup
administrator.

The one-shot administrator created and reverified encrypted generation 9001.
All eleven disposable source volumes, including the deliberately excluded
cache, were then deleted. Generation 9001 restored into ten new authoritative
volumes. After initializing the fixture's authenticated token store and policy,
generation 9002 was created and reverified. That first restore namespace and
its rebuilt cache were deleted, and generation 9002 restored into a second new
namespace.

The final implementation also received an eleventh empty cache target. Restore
derived only `owner/project` from the authenticated inventory, created the
cache root and both descendants as `21001:21001` mode `0700`, and synced them.
No cache bytes were present in either archive. Gitd then reopened the restored
repository, authenticated token store and policy and reported:

```text
recovery-status-v1 receipt=0 complete=0 discard=0 reverify=0 uncertain=0
```

Archive evidence:

```text
generation 9001: 5,645 bytes, root:root, mode 0600, links 1
sha256 83b361c81f9e6b122b5dd716ec6e50aa3dab26826c5fd4d19772fbf45fb1607d
generation 9002: 9,664 bytes, root:root, mode 0600, links 1
sha256 4c05cd949422ec5fd48a148af1039d320ae70f2ad7f96167b42889b2b1bb1ca3
```

Runtime image evidence:

```text
mrml/gitd:backup-e2e
  id 0dbc6363964b4a5b5d10290a6c09451a66358c2a9e6653e94038ad1863356ab2
  linux/amd64, user 21001:21001, entrypoint /usr/bin/mrml-gitd
mrml/git-backup:dev
  id 9d8c19ef0f9b6fb1ce112d04e2788ea12fac49f7b35e7bb85e8f9b1859db00a9
  linux/amd64, user 0:0, entrypoint /usr/bin/mrml-git-backup
```

Read-only inspection of the final Gitd image rootfs proved private data roots
as `21001:21001` mode `0700`, the public policy root as `21001:21001` mode
`0755`, and the authority socket root as `21002:21901` mode `2770`. This found
and corrected a Dockerfile defect where separate directory `COPY` operations
created final targets with default mode `0755`.

The run also proved that valid rootless Podman volume directories report link
count 1. Directory type, retained capability, owner, group and mode checks are
preserved; the nonportable directory-link-count condition was removed. Exact
regular-file link-count checks remain and continue rejecting hard-linked keys,
configuration, state, manifests, archives and repository content.

Focused gates after these changes:

```text
target/release/mrml test org.mrml.tool.git --target linux
  PASS: 266 library, 4 CLI, 7 protected-signer tests
target/release/mrml test org.mrml.service.gitd --target linux
  PASS: 47 library, 6 daemon, 1 backup-administrator tests
deploy/compose/test-git-images.sh
  PASS
deploy/compose/test-compose-git.sh
  PASS
```

This first run validates archive creation, complete cryptographic verification,
destruction of disposable sources, restoration into fresh named volumes,
automatic excluded-cache reconstruction, and cold recovery. It did not exercise
the mission's clone/fetch/multiple-protected-push/receipt portion; the later
source-independent live sequence below exercises those paths.

A later activation audit found that the restore model originally named its
authority secret and configuration targets `NAMESPACE-authority-secrets` and
`NAMESPACE-authority-config`, while production and subsequent backups resolve
`NAMESPACE-git-authority-secrets` and
`NAMESPACE-git-authority-config`. The archive content and logical restore roots
were correct, but the namespace could not be activated or backed up again by
selecting it as `MRML_VOLUME_PREFIX`. The restore script and Compose external
volume names now use the canonical production suffixes. A profile-enabled
Podman Compose render with distinct source and target prefixes resolved all
eleven targets, including the corrected authority volumes. The full live
transaction sequence below used the corrected names.

The same activation audit found that the operator scripts invoked Docker
directly and used Docker Compose's `ps --status` syntax. That made the declared
Podman runtime unusable and, for manually created containers, could miss a live
volume consumer. Backup and restore now route both engine and Compose operations
through the exact `MRML_CONTAINER_RUNTIME` selection and determine cold state
from engine-level consumers of the prefix's Gitd-state and authority-state
named volumes. The check is independent of Compose project names and does not
depend on ACME Compose rendering. Every one-shot invocation explicitly enables
the `admin` profile, which is required by Podman Compose even when the service
is named directly.

The real Podman cold-backup continuation then exposed two further fail-closed
portability and coherence defects before any archive was accepted. Podman does
not accept redundant `uid=0,gid=0` options on the root-run administrator
tmpfs; backup and restore now rely on the root default while preserving
`rw,noexec,nosuid,nodev,size=8m,mode=0700`, and static tests forbid the rejected
form. After that correction, generation collection rejected protected forward
progress because it still applied conventional exact catalog admission. It now
matches the already implemented protected startup rule: the catalog repository
generation is a floor, trust and revocation generations remain exact, and the
repository generation must exact-match the authenticated authority record.
Focused tests accept only authority-confirmed forward progress, reject a stale
authority record, catalog rollback, and trust/revocation drift, and preserve
exact conventional admission. The live encrypted archive and destructive
restore sequence was then repeated successfully with this correction.

The subsequent destructive simulation retained only the encrypted backup and
backup-key volumes after deleting the label-guarded disposable source service,
authoritative, cache, and client volumes. Restore correctly refused before any
write because its preliminary verification still selected the backup Compose
service, whose mount set includes all destroyed source volumes even though the
`verify` operation reads only the archive and key. Preliminary verification now
uses the restore service against the already-created empty target namespace;
the restore service mounts the archive and key read-only and verification still
precedes any restore write. Static policy tests forbid the source-dependent
verification invocation. The retry with this fix succeeded as part of the
source-independent sequence below.

## Source-independent live protected restore

The real-server continuation used exact implementation bundle commit
`750f0c62` (bundle SHA-256
`a5ec3bebb8f348afe55eec53578f116caa48d7fdb8783eb9323990d0677ed704`).
The independently verified bundle was uploaded over SSH and loaded without a
registry, source checkout, compiler, or Rust toolchain on the server. All
durable container state used Docker-compatible named volumes. The only host
file was the mode-`0600` Compose environment interpolation file; it was not
mounted into a container and contained deployment metadata rather than daemon
state.

Cold backup generation 9100 was created and verified before the first restore:

```text
git-9100.mrb 537,011,613 bytes root:root mode 0600
sha256 a5d40e2ff5c609784f98d20ced1b5e4ff52acd102b6526c0440dfa22669dac36
```

Generation 9100 restored into eleven newly provisioned, labeled named volumes.
The restored authority and Gitd passed read-only configuration validation and
the ordered startup gates. A native client fetched the restored repository and
two consecutive protected pushes activated commits `0adb83cde53b` and
`20e770102b73`. Each receive produced an authenticated 360-byte receipt.

With those receives durable, cold backup generation 9200 was created and
verified in separate backup and backup-key named volumes:

```text
git-9200.mrb 537,042,182 bytes root:root mode 0600
sha256 e29ca4d855cfda2d9288aa297aecc8963d6f2ce33e7643fd9bad1a5474f047b8
```

The source authority and Gitd containers were stopped and removed. All eleven
label-guarded source authoritative, policy, receipt, quarantine, configuration,
secret, runtime, and cache volumes, plus the disposable source client volume,
were deleted. Only the encrypted generation-9200 archive and its independent
backup-key named volume remained. The retained pre-existing
`mrml-podman140f-fresh-*` volumes were not modified or deleted.

Generation 9200 was then cryptographically verified and restored without any
source volume into a second eleven-volume target namespace. Read-only
configuration validation passed. The target authority and Gitd completed
configuration, authenticated-dependency, identity, recovery, listener, and
ready gates using the exact `750f0c62` images. TLS used the explicit certd test
fixture and a loopback listener at `127.0.0.1:30443`; this is controlled hosted
evidence and not a production-certificate or public-network claim.

A fresh native clone into an empty disposable client named volume succeeded.
An explicit subsequent fetch reported 29 objects and one branch ref. The fetch
was CPU-bound for about 14 minutes while remaining near 59 MiB RSS, confirming
the known unacceptable pack-performance limitation rather than whole-pack
resident-memory growth. Finally, the restored target accepted a new protected
commit and advanced `origin/main`:

```text
[634b09f0c0d1] validate post-disaster restored push
Pushed 634b09f0c0d1 to origin/main
```

The target receipt volume contains nine owner-only authenticated receipts and
the restored authority retains its authenticated candidate, proof-set,
per-commit proof, and generation records. Token plaintext was captured only in
the remote shell, checked for exact canonical lower-hex length, piped to the
native client on standard input, and unset; it was never printed, placed in an
argument or environment variable, or written to a file. The target authority
and Gitd remain running on loopback for inspection. This completes the hosted
destructive-restore acceptance item, but it does not resolve the separately
recorded pack-performance defect or establish production ACME/certd, public
network, power-loss, or physical-hardware evidence.

Patent review: **NOT_TRIGGERED**. The changes use conventional container image
layout, filesystem metadata validation, encrypted streaming backup, and cache
directory reconstruction. See `docs/patents/REVIEW_LOG.md`.

## Real Docker cache/provisioning regression — 2026-09-05

A real Docker CE/Compose diagnostic backup contained both independently advanced
protected repositories. Native encrypted generation 2026090501 was created and
verified; all eleven disposable source server volumes were then removed, and
native verification/restore succeeded into a fresh namespace. The independently
retained real certd and client signer/credential custody were not part of that
server-data destruction. The archive was 809,619,705 bytes, SHA-256
`a91fd03a092df6fca9aea60a13476d56d20258650c7b3317fa94fc6bafee69e8`.

Subsequent first-party provisioning correctly refused the derived cache because
its reconstruction lacked the `.mrml-volume` copy-up sentinel. The native
restore path now recreates and syncs that zero-length mode-0400 file using the
UID/GID of the authenticated repository-root inventory entry. It still requires
an empty cache destination. The focused regression checks two derived repository
paths, root/directory/marker ownership and modes, one link, zero bytes, and
rejection of destination reuse. It first failed on the missing marker, then the
canonical Gitd suite passed 58 library, 8 daemon and 2 backup tests after the fix.
Sanitizer and rebuilt-image restore activation remain pending at this checkpoint.
Exact logs and continuation state are in `CURRENT_COMPLETION.md`.

### Corrected Docker restore activation — 2026-09-05

Native F5 restore of generation 2026090501 into the second fresh namespace
`mrml-git-restore-g-20260905` passed and created the required cache sentinel.
Configuration validation, authenticated recovery, real authority/Gitd startup,
and independently retained real certd/client custody all passed. The fresh
`restored-first-attempt3` clone matched eight 32 MiB text-file hashes and a
protected push selected `f9449afa6fcb`. All eleven original server volumes
remained absent after that push. Exact signer-state bytes were retained; no
manual generation edit was used. The first two clone attempts failed during TLS
socket transport and remain recorded; an independent CA/SNI-valid TLS 1.3/H2
oracle and the subsequent native clone passed. This diagnostic sequence is not
yet the required final uninterrupted coherent-source release run.
