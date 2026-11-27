# Exact Git offline release validation — `594d242f`

Status: complete local offline-bundle and source-review-archive validation for
functional commit `594d242f`. The signatures use a generated non-production
offline Cosign key. This is not production-key, public-network, real-certd, or
independent-review evidence. No repository push was performed.

## Clean source and streaming gate

All binaries and images were built from clean detached worktree
`/tmp/mrml-release-594d242f`. A controlled Linux/Podman HTTP/2 clone used exact
Gitd and client images built at that commit, a loopback-only listener, and named
volumes for every persistent and runtime path. The incompressible selected pack
was 268,456,731 bytes. The scoped token passed directly from the one-shot issuer
to standard input and was neither printed nor stored.

```text
elapsed_seconds=23
throughput_bytes_per_second=11672031
samples=18
client_peak_rss_kib=381712
gitd_peak_rss_kib=71096
authority_peak_rss_kib=18640
quarantine_peak_bytes=536900468
```

All evidence files passed their strict `SHA256SUMS`; every `process.tsv` row had
the required ten fields. The completed clone reproduced the four fixture
SHA-256 digests recorded in the earlier streaming-performance evidence.

## Complete offline bundle

The checked-in `build-offline-git-bundle.sh` ran its manifest, lock, image,
Compose, authority, Gitd, and Git client gates; rebuilt all release binaries;
built all five images with networking disabled; exported their exact archives;
generated Syft SPDX JSON SBOMs from those archives; and created offline Cosign
bundles for every image. The resulting archive was independently extracted and
passed `verify-offline-git-bundle.sh`, including every checksum, signature,
image lock, embedded streaming record, and retained policy-source gate.

```text
offline archive: /tmp/mrml-git-594d242f.tar.gz
size:            47 MiB
SHA-256:         7e9ba09da542b56814169989613774abcad682035e307a73e967d2e476d82ce4
format:          mrml-images-git-v5
platform:        linux/amd64
```

Exact locked images:

| Image | Archive SHA-256 | Producer image ID | User |
| --- | --- | --- | --- |
| `mrml/git-authority:594d242f` | `aa09597fda35c986343251e41103a4872315d081dadeb9c2a70f5721e7a67c9b` | `57b17819b295d97c6e9b79f12726cb3b10d5a40801bff025125ca52e05e1987a` | `21002:21002` |
| `mrml/gitd:594d242f` | `8edd6ba2359949d63a5202a413d9b9b536ecddc42214ca931f1147c0a267251d` | `26f2f1c02bf104c3e86bc2c9eae6a78bbe02c931f8d4f42040515f8895f0ac61` | `21001:21001` |
| `mrml/git-protected-signer:594d242f` | `ab4f906b3931d9103f129c73ec7d290454b06ed93bd68f7552694d883b6d5921` | `0316bcf7c33c88e7eb3c6a4dda162efa9deeb6d1596ce96b6533be6f99d998e9` | `21006:21006` |
| `mrml/git-credential-agent:594d242f` | `46ed1f2f698795ae78608c97e281bc36518fbdf9aa610d363626cb977d7c4af6` | `8411480206404686d2a60d0d65f1eb304f2a60c624d8a5633e829a8a794b3b83` | `21009:21009` |
| `mrml/git-backup:594d242f` | `0b2325f2eb34312acc8e273d0c90b0d2099d89cfce5e06406b41621a367245c7` | `e3b17d9f1dd9d3fdcb696d9bf20e5b94940964129b374997b42c04427c076f7b` | `0:0` one-shot administrator |

Entrypoints were exact `/usr/bin/mrml-git-authority`, `/usr/bin/mrml-gitd`,
`/usr/bin/mrml-git-protected-signer`,
`/usr/bin/mrml-git-credential-agent`, and `/usr/bin/mrml-git-backup`
respectively. The test suites passed 20 authority tests, 61 Gitd/backup tests,
and 287 Git/client/protected-signer/credential-agent tests.

## Source-only review archive

`tools/review/build-git-review-archive.sh` produced a deterministic archive from
the same exact functional commit. Its preflight screened for tracked secret,
runtime, backup, quarantine, production-environment, and private-key paths and
found none before archiving. Its sidecar checksum and gzip stream both
reverified.

```text
/tmp/mrml-594d242f-source-review.tar.gz
SHA-256 b27bac52b15c787086117836727805384c2d8eec3cb1b614ffb50c1e51b43caa
size 4.9 MiB
```

The two `/tmp` archives and test Cosign key are validation artifacts, not
committed repository content or owner production inputs.

Patent review: **NOT_TRIGGERED**. This increment packages and verifies already
implemented mechanisms using conventional archives, checksums, SBOMs, and
offline signatures. See [`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
