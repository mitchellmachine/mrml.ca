# Git/Gitd retained-storage validation — 2026-09-04

This additive record covers native Linux tests, exact-commit offline image
construction, and stopped image loading on the owner-authorized `mrml.ca` VPS.
It is not a production-start record, public-service test, physical-hardware
result, signed release bundle, or independent security review.

## Source and commits

- Branch: `main`.
- Exact image source commit: `6a52865e` (`gitd storage: admit repositories
  through retained capabilities`).
- Preceding storage commit: `0273e587` (`git storage: retain repository objects
  and initial refs`).
- The ordinary worktree contained pre-existing unrelated Gitd and HTTP edits.
  Release binaries and images were therefore rebuilt under
  `/tmp/mrml-release-6a52865e`, populated from `git archive 6a52865e`; none of
  those unrelated edits entered the images.
- Both source commits were signed locally. No repository push was performed.

## Retained-storage behavior

Git repository initialization now creates the `.git` hierarchy, initial loose
objects, immutable initial pack-set manifest, and initial active-ref state
through retained Linux directory capabilities. Base loose-object and pack reads
and loose-object publication remain bound to the retained `.git` directory.
Gitd repository admission constructs the live repository view from retained
object, ref, and arrival-pack capabilities rather than reopening their ambient
paths.

Regression tests rename the ambient object and ref/state directories after the
capabilities are retained, replace the old paths with empty directories, and
prove that reads continue against the displaced original directories. The
replacement paths remain unused.

| Command | Result |
| --- | --- |
| `./target/debug/mrml test org.mrml.tool.git --target linux` | PASS: 257 library, 4 CLI, 7 signer tests |
| `./target/debug/mrml test org.mrml.service.gitd --target linux` | PASS: 42 library, 6 binary tests; loopback tests ran outside the filesystem/network sandbox |
| `./target/debug/mrml test org.mrml.library.runtime --target linux` | PASS: 50 tests; loopback tests ran outside the filesystem/network sandbox |
| `deploy/compose/test-git-images.sh` | PASS |
| `deploy/compose/test-compose-git.sh` | PASS |
| `deploy/compose/test-compose-signer.sh` | PASS |

Release builds of `org.mrml.service.git-authority`,
`org.mrml.service.gitd`, and `org.mrml.tool.git` passed in the exact-commit
snapshot.

## Offline images and SBOMs

All image builds used `--platform linux/amd64 --network=none --pull=never` and
the repository's digest-pinned base images. Syft 1.51.0 generated SPDX JSON for
each exact Docker archive. Its optional online version lookup failed because DNS
was unavailable; local archive scanning completed successfully.

| Image | Local Podman ID | Archive SHA-256 | SPDX JSON SHA-256 |
| --- | --- | --- | --- |
| `mrml/git-authority:6a52865e` | `2a9d3b482f5508774a23f22c423d853cd7f9d06890795b26f0f9e27da5551ae3` | `12f19b0b71fdb5d46915579f65b70767a3c140530c3f84612f5ee7da5ceb2b79` | `7b776e1c4fdc86f1f30da87fb8cf38df4f87741773312500c530587a933c6fc4` |
| `mrml/gitd:6a52865e` | `88ea2525b3c5d187eb2fca396d3529a314dc443f71bf9a79d74ca1356277b56a` | `5d3938a04aac2f3c3737e9a89db471b4411c702dc9f0b932155ccef72b6f4635` | `a084bc0644526066f374fcb7ac344b58142e922f75806c48394c8617e316cce9` |
| `mrml/git-protected-signer:6a52865e` | `09a49e69348766af4dd5f55a9d5bf1ff12513c891e2537f04230c9449c302748` | `fdee2250778a3516cf21ca491b15daffbe0d7e83b84811c89869bfed5c090d37` | `7af75f04755862ee7d2754005b93cbbec7050092b9838c14911ef05626220ee2` |

The archives were streamed over SSH directly to `sudo docker load`; no source
checkout, compiler, Rust toolchain, or image registry was used on the VPS.
Docker 29.6.1 loaded the three `localhost/mrml/...:6a52865e` tags. Docker's
runtime image identities were, respectively,
`d04d15f1b692f07b611ac812749cbb8fc82c4f3dd9832c85c948d7a4c6771315`,
`df54edf35ae492b0b05a6de6196d5fda083b9c8782f839e88c6880c76e9fbd15`,
and `e980b251f947657f93da25ac734ade7b04b6510b2a1ad3941078f73dd5d9eb87`.
Their configured runtime users are `21002:21002`, `21001:21001`, and
`21006:21006`, with only their narrow daemon entrypoints.

The host still had no running container and no Compose project after loading.
Persistent service state remains in Docker named volumes. Production startup
remains fail closed because the owner-selected repository catalog, OpenPGP
public key, ML-DSA public key, protected trust policy, production certificate
identity, and production Cosign release key were not supplied. Test or invented
trust material was not substituted.

## Residual gates

- Complete owner-key trust transition and public TLS startup remain untested.
- A production Cosign-signed offline bundle remains blocked on the owner release
  key; these archives are controlled validation artifacts only.
- The broader mission's performance, crash-reconciliation, and external-review
  gates remain governed by their existing evidence records and are not promoted
  by this storage result.

Patent review: **NOT_TRIGGERED**. This increment uses conventional retained
directory descriptors, immutable file publication, Docker named volumes, image
archives, and SBOM generation; it introduces no substantial new mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
