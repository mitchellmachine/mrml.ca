# Protected lifecycle and H2-only hosted validation — 2026-09-04

This record extends, and does not replace, the earlier dated Git/Gitd evidence.
The continuation checkpoint was signed commit `7bea0bf1`; the implementation
under test ended at signed commit `e1cc9e06` before this evidence-only commit.
The branch was local `main`. No repository push was performed. The shared
checkout retained unrelated unstaged HTTP/QUIC and Gitd work throughout; release
binaries and images were therefore built from the clean detached worktree
`/tmp/mrml-genquery-clean` at the exact recorded commit.

## Defects corrected in this increment

- Docker named-volume mounts that contain image-owned directories now use
  `volume.nocopy`, and provisioning detects copy-up metadata corruption.
- Gitd startup preserves bounded error categories rather than collapsing every
  dependency, identity, signing-route, TLS, admission, and recovery failure.
- The protected signer admits the smaller authenticated session-hello frame as
  well as bounded response frames. A real isolated signer then completed a sign
  operation.
- Gitd retains the repository quarantine root, not an already-opened `arrivals`
  child, when reopening the selected arrival store.
- Protected startup treats the immutable deployment catalog generation as a
  floor. It accepts forward progress only when the live repository tuple exactly
  equals the tuple returned by a new authenticated authority operation and the
  catalog trust and revocation generations remain exact. The check runs before
  and after recovery. Conventional repository admission remains exact.
- HTTP/2 now routes only the actual discovery/upload/receive endpoints through
  streaming Smart Git handling. An authenticated candidate-status GET reaches
  its dedicated bounded handler instead of being misclassified and returning
  503.
- Base production Compose selects `serve-h2`, publishes TCP 443 only, and does
  not start the QUIC listener/reactor or load the QUIC retry key. The existing
  `serve` path is retained for a separately gated future H3 overlay.

## Real protected lifecycle

The authorized host was reached only through
`ssh -i /home/m/.ssh/server_ed25519 -p 42069 ubuntu@mrml.ca`. The disposable
`mrml-e2e-protected2-*` namespace used Docker named volumes exclusively. Gitd
was published only as server loopback `127.0.0.1:18444 -> 8443/tcp`; no public
443 binding was made. Certd was the explicitly labeled test fixture, not a
production certificate service.

An already-activated generation-5 candidate
`f836edc72d3b4e34e808ac473a0942df` was preserved across the original restart
failure. After deploying matching authority/Gitd protocol images, Gitd restarted
from a catalog generation of 4 while authenticated live repository and authority
state were generation 5. The candidate-status GET returned its completed record
and authenticated receipt. Native `mrml-git` reconciled its durable pending
record and reported `Pushed d74235ff1746 to origin/main`; it did not blindly
repeat activation.

The same long-running isolated signer then completed:

| Transition | Commit | Result |
| --- | --- | --- |
| 5 -> 6 | `b82e2e93bb59` | confirmed protected push |
| 6 -> 7 | `4364775228f6` | confirmed protected push, no signer restart |
| signer restart, 7 -> 8 | `a1bdb799ebe9` | confirmed protected push |

No signer configuration was edited between pushes. The signer ran as
`21006:21006`, accepted client `21007:21007` only through supplemental socket
group `21906`, had no network or published ports, and retained key, state,
channel, and runtime data in separate named volumes. Gitd subsequently restarted
at generation 8 and reached `ready`, proving restart-independent forward
admission beyond the catalog floor.

## H2-only runtime evidence

Exact clean image `localhost/mrml/gitd:e1cc9e06-clean` has producer ID
`3546c6d38f70d0b6a25ceeda0483ce95cccd397177463e37627290eb57db2d8b`.
Runtime inspection reported command `serve-h2`, one published TCP mapping, and
only named-volume mounts with Docker `NoCopy=true`. Inside the container network
namespace Gitd listened on TCP `0.0.0.0:8443`. The only UDP socket was Docker's
internal `127.0.0.11` DNS stub; Gitd owned no UDP listener. Startup emitted, in
order, configuration valid, dependencies authenticated, identity authenticated,
recovery complete, listeners bound, and ready.

The Ubuntu host's Docker Snap installation rejects execution when
`no-new-privileges:true` is present with `operation not permitted`. The
production Compose file still requires that flag. Controlled loopback fixtures
therefore omitted only that flag; this is not production confinement evidence
and blocks activation of the production Compose stack until the host Docker
installation is replaced or repaired.

## Verification commands and outcomes

```text
git fsck --full --no-reflogs --no-dangling                         PASS
target/debug/mrml manifest check                                  PASS (71 packages, 214 dependencies)
target/debug/mrml manifest lock --check                           PASS (71 packages, 5 interfaces)
cargo fmt --all -- --check                                        PASS
cargo clippy --all-targets -- -D warnings                         PASS
deploy/compose/test-compose-git.sh                                PASS
target/debug/mrml test org.mrml.tool.git --target linux           PASS (268 library, 4 CLI, 7 signer)
target/debug/mrml test org.mrml.service.git-authority --target linux PASS (13 library, 7 binary)
target/debug/mrml test org.mrml.service.gitd --target linux       PASS (47 library, 6 binary, 1 backup)
target/debug/mrml test org.mrml.library.ssh --target linux        PASS (29)
target/debug/mrml test org.mrml.library.http --target linux       PASS (79)
target/debug/mrml test org.mrml.library.tls --target linux        PASS (34)
target/debug/mrml test org.mrml.library.crypto --target linux     PASS (55)
target/debug/mrml test org.mrml.library.openpgp --target linux    PASS (16)
target/debug/mrml test org.mrml.library.runtime --target linux    PASS (50)
target/debug/mrml assurance check                                 FAIL (pre-existing unadmitted unsafe boundary: docs/compiler/probes/pinned_std_thread_tls_execution.rs)
```

Socket/listener tests were run outside the restricted workspace sandbox. Tests
were sequential except for one attempted parallel build that produced a zero-
length shared object artifact; all affected suites were then rerun sequentially
and passed.

## Offline validation artifacts

The artifacts under `target/release-artifacts/e1cc9e06/` were built from clean
commit `e1cc9e06`. They are validation artifacts, not the signed production
bundle: the release script correctly refuses to run without current clean
256 MiB streaming evidence and an offline Cosign key.

| Artifact | SHA-256 |
| --- | --- |
| `images/git-authority.tar` | `c66f3c133cd9fd07b2809f6cf206fa5e91e2f2d0c4145ef2372978a2ca4c7362` |
| `images/gitd.tar` | `c7ce10bed7aadf7d95ed093589fd7396e0bce027f9dfc75c5f27dd9d5db4a8ca` |
| `images/git-protected-signer.tar` | `a7487d1a0582ef1d7258bc0f79c1215db85e92742c28d64337904afeada86bcc` |
| `images/git-backup.tar` | `3739673947703a7969f09c9c459c41cd6a2532818dea36116ed85b6675e3cc9e` |
| source review archive | `b480c80a4c3d7a56c8211fbe57af6ed78924f560db63844dcfb17714cc3f4087` |
| validation deployment archive | `d03f1ddda22e3917289fc15e7855abd8e5194e79a8879e983dce7c78edf9008a` |

Syft 1.51.0 generated an SPDX JSON SBOM from each exact Docker archive.

## Remaining release blockers and claim limits

The prior exact 268,456,731-byte baseline was 8,133 seconds and 33,008 B/s at
146,104,320 bytes peak Gitd cgroup memory. The later named-volume run completed
in 826 seconds (325,008 B/s), but used an explicitly uncommitted image. It is
still far below the 10 MiB/s target. No clean-commit large clone/fetch/protected
push profile, maximum-boundary series, broad graph/delta scaling profile,
hostile-listener campaign, complete old-to-new trust transition, or destructive
encrypted backup/restore cycle was performed in this increment. Existing unit
and earlier hosted evidence must not be promoted to those claims.

Real certd issuance/renewal and OCSP-bound H3 remain unverified; H3 is therefore
disabled in the base release. Public production activation, production key
custody, external security/cryptographic review, Canadian patent counsel review,
and native Windows certification remain outside this hosted fixture.

Patent review: **NOT_TRIGGERED**. These changes add conservative authenticated
state comparison, correct route classification, and remove unproven transport
exposure; they introduce no new cryptographic or compression mechanism. See
`docs/patents/REVIEW_LOG.md`.
