# Trust-transition verifier retention — 2026-09-04

Status: **PARTIALLY IMPLEMENTED** and verified in focused Linux tests. These
increments close the authority restart gap between policy selection and public
verifier availability and add an authenticated signer trust-generation handoff.
They include a controlled Podman named-volume overlap, retirement, restart, and
old-key rejection exercise. This is hosted server evidence, not physical
hardware or complete production-readiness evidence.

## Implementation

Signed functional commit `d31ef509` changes the normal `transition-policy`
operation so it durably installs the next OpenPGP-v6 and ML-DSA-65 public pair
before selecting the next trust policy. Files are retained beneath the exact
repository policy capability as:

```text
verification-keys/trust-GENERATION.openpgp.asc
verification-keys/trust-GENERATION.ml-dsa.bin
```

Creation is exclusive. Existing files must match the exact expected owner,
group, mode `0444`, one-link identity, length, and content. Each new file and
the keyring directory are synchronized before policy transition. A crash before
policy selection can therefore leave only inactive public material; a selected
policy never depends on transition-upload files that the wrapper subsequently
removes.

Authority startup retains one descriptor-relative policy-directory capability.
The original implementation preferred the bootstrap pair while it remained
active. The 2026-09-05 real Docker overlap regression exposed that this shadows
the authenticated successor selected by signer advancement. Current startup
uses the bootstrap pair only at generation 1; every later generation requires
its exact retained verifier files beneath that capability, parses both keys,
binds their complete hybrid identity, and rechecks policy authorization. The
current authority has one selected proof verifier; this does not claim arbitrary
simultaneous proof-signer multiplexing during overlap. Missing, stale-generation,
substituted, malformed, wrongly owned, writable, linked, or inactive keys fail
closed.

The deployment input contract carries the exact previous public pair for every
transition. The networkless transition process does not substitute the
authority bootstrap files for that pair. This is required for normal
generation 2-to-3 retirement and every later rotation after the bootstrap pair
ceases to be active. Both supplied pairs remain public, immutable,
owner-checked transition inputs; neither grants authority without matching
policy status and hybrid signatures.

Named-volume operator tooling now separates canonical policy construction
(UID 21001), current and candidate signing (UID 21006), public transition
staging (UID 21002), and durable policy selection (UID 21001). The selected and
candidate signer key slots are explicit environment state. They may name the
two initially provisioned volumes or a lowercase, prefix-scoped, MRML-managed
additional slot, and must be distinct. Successful handoff swaps their logical
roles, consumes and synchronizes only the exact public workspace files; all
private-key volumes remain intact for
rollback analysis and deliberate later destruction under a separate operation.

Signer state format v2 additionally binds a SHA3-512 identity over the exact
OpenPGP-v6 and ML-DSA-65 public pair. Ordinary startup requires that identity
to match the supplied private material. The authenticated dual-signature trust
advance is the only v1-to-v2 migration path and persists the successor pair's
identity atomically with the generations.

Signed commits `91404cb9` and `9dd6ee54` preserve bounded authority startup
failure categories and correct authenticated health so the Gitd-owned split
capability is opened as UID 21001, not as the authority UID. Signed commits
`862f09da`, `dbbfdd22`, and `cba45d4f` add classified Gitd admission failures,
an atomic named-volume catalog updater, and the authenticated startup handoff.
The handoff admits a catalog that is behind only in trust or revocation
generation, queries the authority through its split capability, requires the
exact repository generation and catalog-selected trust tuple, and advances the
durable ref state monotonically before reopening it. Repository refs and pack
identity remain unchanged; a catalog or local state ahead of authenticated
authority state fails closed.

## Verification

```text
cargo fmt --all -- --check                                PASS
cargo clippy --all-targets -- -D warnings                 PASS
git diff --check                                          PASS
./target/debug/mrml test org.mrml.service.git-authority \
  --target linux                                          PASS
  authority library: 13 passed
  authority binary:   9 passed
./target/debug/mrml test org.mrml.tool.git --target linux PASS
  Git library:        276 passed
  Git CLI:            5 passed
  protected signer:   9 passed
  credential agent:   2 passed
./target/debug/mrml test org.mrml.service.gitd --target linux PASS
  Gitd library:       53 passed
  Gitd binary:        7 passed
  Gitd backup:        1 passed
```

The binary test uses two independent real OpenPGP/ML-DSA pairs and real hybrid
key-rotation signatures. It selects overlap policy generation 2, verifies the
generation-2 public files and their filesystem invariants, selects retirement
policy generation 3, proves the old pair is rejected, and proves restart
selection resolves the exact generation-3 next pair even though the configured
bootstrap pair remains old. A separate test preinstalls generation-2 material,
attempts a same-generation substitution, observes failure, and verifies the
retained bytes did not change.

Signed functional commit `61d39118` adds a pure normal-successor verifier and
the signer's cold `advance-trust` operation. The operation reads the actual
already selected policy from the policy volume, verifies exact ownership and
canonical encoding, verifies both real hybrid transition authorizations, binds
the current private signer material to the previous active pair, and atomically
updates only trust and revocation fields in the checksummed state. Its test uses
two independent real hybrid pairs, preserves repository generation 7, advances
trust 1 to 2, reopens the result, and rejects replay.

Signed deployment commits `bbe9d3d3` and `8bb2bf07` add the networkless,
read-only-root, capability-dropped signer admin profile and sequence it after
authority selection. All three daemons must be stopped. The transition input
set now contains the exact previous policy. Inputs are removed only after signer
state reopens; `--resume-signer` safely resumes an interruption after selection.
Both static Compose tests, shell syntax checks, and the combined
Git/ACME/signer admin Podman Compose render passed.

## Controlled hosted Podman exercise

The Ubuntu server at `mrml.ca` was exercised through rootful Podman. Every
signer key, state, split capability, construction, signature, transition,
policy, and runtime object used by the containers was held in a named volume;
no host bind directory held container state or keys. The operator scripts used
the `mrml-podman140f-fresh` volume scope.

The initial overlap selected generation 2, digest
`dc79cfacba14818d8e2c97397ed0456d2fc73a6cbc053ccfcdca3926ad8c716bde2aab6b9d48b02ee97b99f4af2e7dc25a5730b1fc48ce7d4da062371ff01828`.
Retirement at Unix time `1788543295` selected generation 3, digest
`6c04da45f70ef35a9e1fc394da475f3640e0d0e8a20ba104ed3478283c06278fb325eaa18d566121e8758c9d4ed65cbc95a3a3a33593d75a86bd7d274399049c`.
Both selections were reopened from the durable authority store before signer
advancement, and each successful operation consumed its public workspace.

The first explicit retired-key restart unexpectedly reached `ready`. This
exposed that signer state v1 bound generations but not key identity. Commit
`4078ec22` introduced the v2 binding; that first attempt is not counted as a
passing rejection test. To migrate without an operator-authorized key
substitution, a third key pair was generated inside the separately managed
named volume
`mrml-podman140f-fresh-git-signer-key-slot-generation-4`. A normal overlap,
authorized by the generation-3 and generation-4 pairs, selected generation 4
at validation time `1788544145`, digest
`ea4bad82847538d4effe8d736aeb0acb4ccea02e5c5a73da8170fd7e9ee52da53425de83abe9e6ccf839f994a571a419d2d9c5fbcfa212b849e7ba546f06f151`,
and atomically rewrote the 64-byte v1 state as the 128-byte v2 state.

Image `localhost/mrml/git-protected-signer:trust-4078ec22` had image ID
`3818ecc285bbebfe03249a8db6b79d0494570c134d22ffab44577aa511c04807`.
Its transferred OCI archive SHA-256 was
`0c6bc3d55a3592cae57017222b6abd66fec4f0c6b02d3aecd9b82f8afd2d8cdd`.
The selected generation-4 signer passed the authenticated split-channel socket
health exchange. Starting the previous generation-3 key against the same v2
state failed closed with exit 78. The valid generation-4 signer was then
restored and passed authenticated health again.

The first authority restart with trusted time after generation 4 failed closed
before creating its socket. Classified diagnostics identified
`proof_directory`; the imported test volume had a legacy extra `state/`
component. The source volume was preserved. Its contents were copied into the
current layout in the new named volume
`mrml-podman140f-fresh-authority-state-layout-v2`, and `check-catalog` passed.
Authority image `localhost/mrml/git-authority:trust-9dd6ee54` had image ID
`6654e1ba55b188174ae28965e2c22e54d4fbe63996303a1162eb57db6057af8e`;
its OCI archive SHA-256 was
`73bc324b327c5692d7bd08337c7c87f79485f6532ad0c0ac13853af735fa2276`.
It restarted, bound its listener, and passed an authenticated Gitd-side health
request. This corrects the earlier unresolved observation without erasing it.

The repository catalog was then atomically advanced from trust generation 1 to
4 with digest
`cf545335a68aeebb57621fd2314d85f9daef5350693964c7ce821dfc4077fab2`.
Gitd image `localhost/mrml/gitd:trust-cba45d4f` had image ID
`4f85e070666a3b25e9a0445054c308a07512391435e2b291c06bcb2379fbed30`;
its OCI archive SHA-256 was
`400a2ee44a9cbd518f499f42bbc90e23c9a2b87b857b3ebbc05123d7eabcc5a0`.
The exact archive checksum matched after SSH transfer. Gitd authenticated both
dependencies, advanced the durable trust tuple, completed recovery, bound only
server loopback `127.0.0.1:28443`, and reached `ready`.

A validation-only client was built from the same clean signed commit. Image
`localhost/mrml/git-client:trust-cba45d4f` had image ID
`109f3694273ebc901737adf82ee9ea6db442c0e857f22ac7c85f61b01a68810f`;
its OCI archive SHA-256 was
`76b906f78fb4c081155288a8a3dbfce80b54b00faea3a66a4f79a3408aabae96`.
It is test apparatus, not a production client image. The retained client first
failed closed because it still held generation-1 public trust inputs. After the
selected generation-4 policy and generation-4 public verification pair were
copied exactly between named volumes, the client completed protected push
`d8532f795f18` to `a0317a551b96`. Gitd active-ref and signer-state hashes both
changed. Gitd then shut down cleanly, restarted on the same named volumes, and
again passed all six startup gates. A fresh authenticated fetch advertised the
pushed objects and left local `main` and `origin/main` at zero ahead and zero
behind.

Syft 1.51.0 generated SPDX 2.3 JSON SBOMs directly from all three OCI
archives. Each document contained 12 packages. Their SHA-256 values were
`80d21aebbb56da702ae14045afa2f2abbfd575bd7e83d2227f47d983abe9b761`
for authority,
`fcb3bab7a3f5e4e017129514755487d0f61e06e74b5c35a9492739e208a2da1f`
for Gitd, and
`b2a7cea0d694e06c6421875cf4e156b8ed9a7254ec7339236bff361c083bad7c`
for the validation client. Syft's optional online update check failed under
restricted DNS; local archive enumeration and JSON validation completed.
`git fsck --full --no-reflogs --no-dangling`, `mrml manifest check` (71
packages and 214 dependencies), and `mrml manifest lock --check` (71 packages
and 5 interfaces) passed after the exercise.

The subsequent crash-resume hardening makes an exact already-completed signer
trust advance idempotent only after revalidating both canonical policies, both
hybrid authorizations, the retiring private pair, the selected public pair, and
the exact advanced key-bound state. A mismatched advanced key identity remains
rejected. The operator persists a synchronized invocation-bound completion
marker only after the signer state is reopened. An exact rerun before that
marker safely revalidates the signer operation; an exact rerun after it resumes
idempotent public-input cleanup without repeating authority selection. Marker
symlinks, link-count or metadata changes, truncated content, and a marker bound
to different arguments fail closed. Focused Git tests passed 276 library, 5
CLI, 9 signer, and 2 credential-agent tests; both Compose static suites, shell
syntax, formatting, strict Clippy, and diff checks passed. A hosted shell matrix
delivered real `SIGKILL` (1) after authority selection returned, (2) after
signer advancement returned but before marker persistence, and (3) after marker
synchronization but before the first public-input removal. Exact resume after
authority selection ran only selected-policy verification and signer advance;
resume after signer advancement replayed only those same two authenticated
operations; resume after the completion marker ran no authority or signer
operation. All three paths completed public-input cleanup, and the final path
also proved marker retention and tamper rejection. Container operations were
deterministic fakes, so this is process-kill evidence for the operator recovery
layer only, not daemon, container-runtime, filesystem power-loss, or
physical-storage evidence.

Retirement signing now has an explicit operator mode. `overlap` continues to
require the distinct selected and candidate key volumes. `retirement` requires
both creation-time arguments to match and routes both generation-bound
authorizations through the current surviving key volume without changing the
saved key-slot selection. An executable shell test captures the actual Compose
environment for both signing jobs, proves current/candidate routing for overlap,
current/current routing for retirement, and proves a mismatched retirement time
starts no container. This closes an implementation/documentation mismatch found
before attempting the next hosted retirement; it is not itself retirement-push
evidence.

The first hosted generation-5 selection attempt exposed the corresponding
staging defect before policy mutation: retirement signing emitted the surviving
OpenPGP key, but staging still sourced the successor ML-DSA public key from the
inactive candidate slot, producing a hybrid-inconsistent pair. Authority
selection rejected it with exit 78 and retained generation 4. Staging now also
requires explicit `overlap|retirement`; retirement sources the successor
ML-DSA public key from the current surviving slot. The rejected mixed public
inputs are discarded and regenerated; they are not transition evidence.

All client, Gitd, authority, signer, certificate, policy, key, state, and
runtime container mounts in this exercise were named volumes. Older Podman
rejected its `subpath=socket` option, so the signer runtime named volume was
mounted at its root and the non-secret socket path included the `socket/`
component. No bind-directory fallback was used. Several repository-scoped
one-hour test tokens were issued while diagnosing a missing Podman stdin flag
and the stale client policy. Their plaintext was never printed or stored, they
cannot be individually recovered for revocation, and they expire at Unix time
`1788550023`; this fixture limitation is not production token-lifecycle
evidence.

Older Podman copy-up changed the runtime volume root group on first mount. The
test restored the provisioned `21006:21906` owner/group and mode `2770` before
the authenticated client probe; the socket subdirectory and socket were
`21006:21906` modes `2770` and `0660`. This Podman-host workaround is evidence
of the behavior before the current copy-up sentinel was exercised; it is not
counted as evidence for the corrected provisioning path.

Fresh disposable authority and signer runtime volumes then exercised the
checked provisioning mechanism on the same older Podman provider. Each volume
was populated only with the owner/group/mode-checked zero-byte `.mrml-volume`
sentinel before its first container mount. Authority first mount preserved root
`21002:21901` mode `2770` and created `authority.sock` as `21002:21901` mode
`0660`. Signer first mount preserved root `21006:21906` mode `2770` and created
`signer.sock` as `21006:21906` mode `0660`. The signer socket completed an
authenticated client-owned split-capability health exchange. No post-mount
metadata repair, bind directory, privileged container, or added capability was
used. The disposable containers and four named volumes were then removed while
the healthy generation-4 stack remained running. This proves the sentinel
startup path on the exercised Podman version; it is not a general claim about
all Podman or Docker versions.

## Hosted stale-authority restart rejection

The retained pre-push authority snapshot recorded repository generation 1 and
selected trust generation 4. It was copied, without modifying the source, into
a disposable current-layout named volume. A separate no-network authority used
that state and a separate named socket volume while the healthy authority
continued serving repository generation 2. A no-port Gitd restart probe mounted
the live generation-2 repository state but used only the stale authority socket.

The first probe failed at socket connection because older Podman had again
removed the runtime-volume setgid mode; it is not counted as rollback evidence.
After the disposable runtime metadata was restored and the stale authority
restarted, the second Gitd probe passed authenticated dependency and identity
checks, then emitted `startup_repository_admission_failed category=Generation`
and exited 1 before recovery or listener binding. The live `active.refs`
SHA-256 remained
`c0c2a5afbd3937e8c071d88911bcc7367b6683c14bcd6db9504ab4ab0bbb115c`
before and after the probe. Only the disposable containers and their two named
volumes were removed; the healthy generation-4 authority, signer, and Gitd
remained running. This is hosted stale-authority rollback rejection across a
Gitd restart, not malicious-storage, power-loss, distributed rollback, or
physical-hardware evidence.

## Generation-5 retirement and protected push

The hosted stack then selected generation 5 as an actual retirement policy.
Generation 4's selected digest was
`ea4bad82847538d4effe8d736aeb0acb4ccea02e5c5a73da8170fd7e9ee52da53425de83abe9e6ccf839f994a571a419d2d9c5fbcfa212b849e7ba546f06f151`;
the canonical generation-5 retirement digest was
`710077e3047222340305215bbfe699086b860f6f25289058d3fb67e7b0aea9c8c1aae914297873c2a75754963196a4aa1830003a8c57bc56ffff64d136f715ae`.
The retired generation-3 pair was removed and the surviving generation-4 pair
remained byte-for-byte the generation-5 public pair.

The first staged input mixed the surviving OpenPGP key with the inactive
candidate ML-DSA key. Authority rejected it with exit 78 and did not change the
selected generation. After the retirement staging fix, two operator attempts
incorrectly supplied the successor tuple as the compare-and-swap input. The
bounded diagnostic category was `durable_selection`, and generation 4 remained
selected. Supplying the exact current tuple selected generation 5 and consumed
the transition inputs. Gitd's catalog then selected trust generation 5 and
revocation generation 1.

The exact signer/admin image was
`3c1a4b5767cb653b899f79465ad035d203e6369d4f3a8836cc272aa1c93046f2`;
its OCI archive SHA-256 was
`c34f095372a0f33e530503225431486ca7090990edde5e10515b84a48ac697f5`.
The diagnostic authority image was
`f05885edb79558bb602dea86989cc122e2c3a5f5abded0de5d62caa5a1040c38`;
its OCI archive SHA-256 was
`77a4ea4ce1fd230dadffb73efd56fd0d07286956bae8c6211c1ca0d3f986dba0`.
Syft 1.51.0 generated SPDX-JSON SBOMs directly from those OCI archives. The
signer SBOM SHA-256 was
`20ddf5f1120a30201f37a11cc804022ca290f1f22de49b8383257667809a9b35`;
the authority SBOM SHA-256 was
`1643490585ea6ece3214243108b3f3e92d24817647c0cc98073fe2cfcaf4d945`.
Syft's optional latest-version lookup failed because restricted DNS was
unavailable, but both local archive scans completed successfully.

A protected client push after retirement selected commit
`d9c75029e0608c983b766a7b3c0fdef946b60e33284b462d25dcbfc4fe709671`.
The Gitd active-reference state SHA-256 became
`527f78024224646d66cbb6a182cd5ac361e8a3357e3c6ac2326b2fc14f8e6683`,
and signer state SHA-256 became
`39c4ea0f68803b8a629482ebbdb19ac0c56dc5843ee0774b651d4e30d623da2c`.
After an ordered stop and restart of Gitd, authority, and signer, Gitd passed
all startup gates. A fresh authenticated fetch obtained 17 objects and one
branch, resolved the exact pushed commit, reported zero ahead and zero behind,
and left the client clean.

All persistent and runtime container state used named volumes. The only host
file was the mode-0600 Compose interpolation environment; it was not mounted as
container state. Generation 4 therefore has an overlap protected push and
generation 5 has a post-retirement protected push.

An executable construction crash test kills the operator process after the
constructor has synced `previous-policy.bin` and its parent directory but before
`next-policy.bin` exists. Re-running the same construction exact-verifies the
retained first output and durably completes the pair. Replacing that partial
output with conflicting bytes makes the restart fail before it creates a next
policy. Together with the transition process-kill matrix, this covers candidate
policy write, authority selection invocation, signer advance, and post-advance
cleanup recovery at the operator boundary. A separate signer-slot test kills
the operator immediately after the atomic environment replacement. The exact
retry recognizes the already-selected generation instead of swapping back to
the retired slot; stale trust generations and revocation rollback both fail
without changing the environment. It does not simulate storage media
lying about synchronization or termination inside individual cryptographic
verification instructions.

The authority daemon test suite now also runs the full generated-key transition
fixture in child processes and kills it at two exact internal boundaries: after
both old/new hybrid authorizations verify, and after the immutable successor
verification-key snapshot is synchronized but before policy selection. In both
cases the reopened durable policy remains at generation 1. The first boundary
has no generation-2 key snapshot; the second has both exact generation-2 public
key files but does not expose them through a selected policy. Re-running against
the same durable directory completes overlap generation 2, verifies exact
selection and rollback rejection, completes old-key retirement generation 3,
and selects only the surviving pair. The focused command was:

```text
target/release/mrml test org.mrml.service.git-authority --target linux
```

It passed 13 authority-library tests and 9 daemon tests. The complete transition
fixture is intentionally ignored as a standalone top-level test and is executed
twice by the passing process-kill matrix, avoiding nested test-output capture.
This completes the Phase 24 process-kill boundary matrix. Broader release gates
listed in earlier records remain.
This controlled hosted-Linux
exercise used test keys, a loopback listener, and a certificate fixture; it is
not public-service, real-certificate-renewal, production-key, malicious-storage,
power-loss, or physical-hardware evidence.

Patent review: **NOT_TRIGGERED**. This uses conventional immutable public-key
files, exact metadata/content validation, directory capabilities, and ordered
filesystem synchronization; it introduces no cryptographic algorithm or novel
key-rotation construction. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
