# Gitd pre-activation recovery validation — 2026-09-04

This additive record covers retained pre-activation cleanup, exact-commit image
construction, SBOM generation, and stopped image loading on the owner-authorized
`mrml.ca` VPS. It is not a production-start record, a public-service test, a
Cosign-signed release, physical-hardware evidence, or independent review.

## Source and recovery result

- Branch: `main`.
- Exact image source commit: `0b7cfb66` (`gitd recovery: discard unactivated
  installed candidates`).
- The ordinary worktree contained pre-existing unrelated Gitd and HTTP edits.
  Release binaries and images were built from `/tmp/mrml-release-0b7cfb66`,
  populated by `git archive 0b7cfb66`; those unrelated edits were excluded.
- The source commit was signed locally. No repository push was performed.

Gitd can now reconcile `DiscardBeforeActivation` journals at both durable crash
positions: while the transaction directory remains in `quarantine`, and after
it has moved to `arrivals` but before refs activate. Cleanup re-reads the exact
journal and live ref state, proves an installed arrival is absent from the
authenticated selected pack set, enumerates through retained directory
capabilities with explicit bounds, validates the complete expected layout before
mutation, rejects symlinks and unknown entries, fsyncs the affected parent, and
then removes the exact journal. Protected recovery exact-matches the authority
candidate generations and aborts only pre-activation authority states; activated
or completed authority state is contradictory and fails closed.

The follow-up recovery gate treats `ReverifyBeforeActivation` as an explicit
abort-and-clean-retry outcome. The durable journal lacks the complete proof and
reservation transcript needed to reconstruct receive typestate, so recovery
does not reinterpret installed objects as newly verified authorization or
activate them. It exact-matches and aborts the protected candidate, proves the
arrival is unselected, removes its retained state, and permits a fresh receive.

## Native verification

| Command | Result |
| --- | --- |
| `./target/debug/mrml test org.mrml.tool.git --target linux` | PASS: 258 library, 4 CLI, 7 signer tests |
| `./target/debug/mrml test org.mrml.service.gitd --target linux` | PASS: 43 library, 6 binary tests; loopback tests ran outside the filesystem/network sandbox |
| `./target/debug/mrml test org.mrml.library.runtime --target linux` | PASS: 50 tests; loopback tests ran outside the filesystem/network sandbox |
| `target/release/mrml manifest lock --check` in the exact snapshot | PASS: 71 packages, 5 interfaces |
| `target/release/mrml manifest check` in the exact snapshot | PASS: 71 components, 214 dependencies |
| Release builds for authority, Gitd, and Git/signer in the exact snapshot | PASS |

## Offline images and server state

Images were built with Podman for `linux/amd64` using `--network=none` and
`--pull=never` from digest-pinned base images. Syft 1.51.0 scanned each exported
Docker archive to SPDX JSON.

| Image | Local Podman ID | Archive SHA-256 | SPDX JSON SHA-256 |
| --- | --- | --- | --- |
| `mrml/git-authority:0b7cfb66` | `cc414ce7577052dbfb4f75b5b31a52066489788cc7c070f7bdd2454dd77319aa` | `612dc2489c779caec69464b16f8550c6ce575c0b6c91d34cce1950ef4ec21907` | `9395b0228780a7c551abf02080b2126557f33ea24cde719b479c88a6e811f301` |
| `mrml/gitd:0b7cfb66` | `5c5fe8c5f1e1a9b37c6f6304cb6c72cada3c508263ca09a0cff4163e48e47136` | `01ba15afb2ef35b28d2af59bbcffd38d42a418f0e1c18f8608be2461133ec9f0` | `3aadfc085b140b59bb4af4929f5c8c3caf1896ee847292d5b1e12bb36844443d` |
| `mrml/git-protected-signer:0b7cfb66` | `09a49e69348766af4dd5f55a9d5bf1ff12513c891e2537f04230c9449c302748` | `181c1cfb7d19949c14978d837e280d62822bdc2dbeaca9e2c773e58496352f2f` | `f4f4e53e4a064b87d91f64db0478062cb5f886cbed5312dc11cbfaaf0bcc55df` |

The archives were streamed directly over the approved SSH connection into
Docker 29.6.1 with `docker load`; no source checkout, build toolchain, registry,
or bind-mounted host data was used on the VPS. Docker's loaded runtime image IDs
are `92fab5e8e2c06458f09e9edbb5178ebec18f7608b2015a4a86ba95c03165cc9b`,
`87d5850d164dafed5fddda5832a76cbe957d64fc541df3c83234a81aa96a83cc`,
and `e980b251f947657f93da25ac734ade7b04b6510b2a1ad3941078f73dd5d9eb87`.
Their configured identities are respectively `21002:21002`, `21001:21001`,
and `21006:21006`, with their narrow daemon entrypoints.

No container or Compose project exists after loading. The host retains the
expected `mrml-*` Docker named volumes, including repository, state, quarantine,
cache, receipt, policy, authority, secret, configuration, and runtime-channel
volumes. Production startup remains fail closed until the owner supplies the
repository catalog, OpenPGP and ML-DSA public keys and policy, certificate
identity, and production Cosign key. No test or invented trust material was
substituted.

Patent review: **NOT_TRIGGERED**. This increment uses conventional
descriptor-relative enumeration, exact state-machine reconciliation, immutable
pack-set selection, Docker named volumes, image archives, and SBOM generation;
it introduces no substantial new mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
