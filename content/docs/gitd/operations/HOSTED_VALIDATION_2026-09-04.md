# Git/Gitd hosted validation — 2026-09-04

This record is additive to earlier hosted evidence. It records controlled Linux
and container checks only. It is not physical-hardware evidence, a release
record, or proof that the public production service was started.

## Source state

- Branch: `main`.
- Image source commit: `e5b05c39` (`git cache: retain immutable pack directories`).
- Provisioner source commit: `0d4ac053` (`deploy git: seed channels inside managed volumes`).
- The worktree contained pre-existing formatting-only changes in Gitd and HTTP
  sources. The images below are therefore validation images, not releasable
  artifacts from a clean-tree release build.
- No repository push was performed.

## Repository and hosted tests

| Command | Result |
| --- | --- |
| `./target/debug/mrml manifest check` | PASS, 71 components and 214 dependencies |
| `./target/debug/mrml manifest lock --check` | PASS, 71 packages and 5 interfaces |
| `deploy/compose/test-git-images.sh` | PASS |
| `deploy/compose/test-compose-git.sh` | PASS |
| `deploy/compose/test-compose-signer.sh` | PASS |
| `./target/debug/mrml test org.mrml.tool.git --target linux` | PASS, 253 library, 4 CLI, and 7 signer tests |
| `./target/debug/mrml test org.mrml.service.gitd --target linux` | PASS, 38 library and 4 binary tests; loopback tests ran outside the filesystem/network sandbox |
| `git fsck --full --no-reflogs --no-dangling` | PASS |
| `./target/debug/mrml assurance check` | FAIL: pre-existing unadmitted compiler probe `docs/compiler/probes/pinned_std_thread_tls_execution.rs` |

Release builds of `org.mrml.service.git-authority`,
`org.mrml.service.gitd`, and `org.mrml.tool.git` passed through the MRML build
frontend for Linux.

## Offline image evidence

All image builds used the digest-pinned bases already present in the local
Podman store, with `--network=none --pull=false`. Syft 1.51.0 scanned the exact
exported Docker archives. Its online version check failed closed due unavailable
DNS, but local SPDX JSON generation completed for all three archives.

| Image | Local runtime ID | Archive SHA-256 | SPDX JSON SHA-256 |
| --- | --- | --- | --- |
| `mrml/git-authority:e5b05c39` | `fb00ff62daed82e0cc2244dba979b72d4aebbd36a108744ecfb7a4c15c1a8f93` | `aaae45f5c7ec04beddf83feeb5268d944350e792c3a8e3ccee7d89b88752999a` | `b55264583b9b58bae6bc1efb97c88bdbacda3567cd7e9489b050800c00337936` |
| `mrml/gitd:e5b05c39` | `15844d90dcd5e2713f0a5bd47e990197cc081cd5fecc861c8b5bb694b0c3378b` | `6cda5881d3290bb7ece1a653f5f5ebb282f3febebc76ca695ffa57c799741607` | `be97b718a5de16893693cb0b6a1949ec03549003f991e04d8c31fa37acf01ad1` |
| `mrml/git-protected-signer:e5b05c39` | `f66a998c69d24db9d1c6106322753ec2c2c7d56987c930f79cc1b2197a92cbf0` | `d28b70d8050f88f055403d8dd8e445eb30f6913cc73267e737c6f09b2b2a1ba3` | `27a546541fe7dd1d2b2816f3d420d5ef266364ea9413cb13212c2ddf820189bc` |

The archive hashes matched after SCP to the authorized `mrml.ca` VPS. Docker
29.6.1 and Compose 5.3.1 loaded the images from standard input because the Snap
package cannot open `/tmp` archives directly. No container was started.

## VPS named-volume state

`provision-git-host.sh` passed against `/mnt/mrml`. Persistent Gitd data,
configuration, secrets, policies, receipts, quarantine, cache, authority state,
and runtime sockets are Docker named volumes. The provisioner created the
previously absent `mrml-git-authority-transition` volume and verified ownership
and exact modes of all managed volumes.

The service remains intentionally stopped. The authority configuration volume
does not yet contain `repositories.v1`, `openpgp-public.asc`, or
`ml-dsa-public.bin`, and the policy volume has no owner-selected protected policy.
Those trust inputs cannot be invented by deployment automation. Starting Gitd or
the authority before they are installed would violate fail-closed production
configuration requirements.

## Residual review and evidence gaps

- Owner-selected production authority catalogs, public keys, and protected
  policy must be installed and transitioned before service startup.
- A clean-tree offline release bundle, signatures, and durable SBOM artifacts
  remain to be produced after all implementation changes are committed.
- The current large-clone record remains controlled hosted evidence and does not
  establish acceptable performance.
- External security review, independent cryptographic review, Canadian patent
  review for future novel mechanisms, and native Windows certification remain
  deferred as specified by the production mission.

Patent review: **NOT_TRIGGERED**. This checkpoint and the accompanying
provisioner correction use established filesystem and Docker named-volume
operations; no substantial new mechanism was introduced. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
