# Git production-hardening evidence — 2026-09-03

This record is additive; it does not replace the 2026-09-02 evidence.

## Continuation baseline

- Commit: `f7d8d12cc0b586f58d9ad2d16aac2d1b676ceba34a6f2f42911bd8b8c66668e2`
- Branch: `main`
- Checkout: dirty with pre-existing HTTP and Gitd service edits plus untracked
  `Archive.zip`; those files were not staged or overwritten by this increment.
- VPS: Docker Engine 29.6.1/Compose 5.3.1 had no running or stopped containers.
  The stopped host retained 22 global named volumes and the `aba80e24` authority
  and Gitd images. Production configuration, keys, DNS, and certificates were
  incomplete, so no public service was started.
- Readiness remains **PARTIALLY IMPLEMENTED**, except for the narrow components
  explicitly classified **IMPLEMENTED** in their own documents. This baseline
  is not a production-readiness claim.

Baseline gates passed `git fsck --full --no-reflogs --no-dangling`, manifest
validation (71 components/214 dependencies), lock validation (71 packages/5
interfaces), `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D
warnings`, and `git diff --check`. Sequential native tests passed 492 tests: Git
228 library + 4 CLI + 4 signer, SSH 29, HTTP 75, TLS 34, crypto 54, OpenPGP 16,
and runtime 48. `mrml assurance check` retained the pre-existing failure for the
unadmitted unsafe boundary
`docs/compiler/probes/pinned_std_thread_tls_execution.rs`.

## Selected arrival-pack read correction

The baseline reproduced complete installed-pack validation and index parsing
inside every selected object read, preceded by a linear scan of manifest
entries. The corrected repository view installs an authenticated immutable
selected-generation snapshot and an ordered exact object locator. Full pack and
index authentication occurs on snapshot activation; unchanged-generation reads
perform indexed lookup plus an independent canonical Git object hash only.

The focused regression performs repeated selected-object reads and requires one
complete validation, one index parse, at least ten lookups, a hash for every
successful read, and nonzero byte accounting. It also modifies an extracted
selected object after snapshot activation and requires fail-closed object
validation. The Git test suite and production Gitd build passed:

```text
./target/debug/mrml test org.mrml.tool.git --target linux
  PASS: 229 library, 4 CLI, 4 protected-signer tests
./target/debug/mrml build org.mrml.service.gitd --target linux
  PASS
```

The exact 268,456,731-byte loopback container clone and before/after profile are
still pending for this increment. The prior measured baseline remains 8,133 s,
33,008 source bytes/s, Gitd peak cgroup memory 146,104,320 bytes, and one full
CPU. No improved throughput claim is made until the same fixture is rerun.

## Production full-buffer cache exclusion

The legacy cache remains available only to `cfg(test)` compatibility tests.
Production compilation removes its field, constructor, precomputation methods,
complete-object collection, complete-pack encoding, cache lookup/insertion, and
response-vector branch. The production request path unconditionally selects the
fixed-chunk `PackStreamEncoder` path. A regression asserts the exported
production capability constant is false, and the non-test Gitd build passes.

Patent review: **NOT_TRIGGERED**. The change uses a conventional authenticated
immutable-generation snapshot and ordered exact-key locator, while retaining
full content authentication. It introduces no cryptographic primitive,
compression/delta-selection method, similarity mechanism, or adaptive cache
policy. See `docs/patents/REVIEW_LOG.md`.

## Graph membership correction

Complete-history verification and upload-pack want/have traversal no longer use
repeated linear `Vector::contains` membership checks. A bounded, growable exact
object-ID set now deduplicates existing, visiting, verified, excluded, and
scheduled nodes with amortized constant-time lookup; deterministic result order
remains in separate vectors. Removal closes probe clusters, maximum cardinality
fails closed, and every key comparison still uses the complete SHA-1/SHA-256 ID.
The focused suite passes 233 library, 4 CLI, and 4 signer tests, including set
growth, duplicate insertion, deletion across displaced entries, and exact
linear parent-read/proof-check counts. Separate debug test-process timings on
this hosted Linux machine were 0.04 s for 1,000 nodes, 0.07 s for 2,000, and
0.14 s for 4,000. That is consistent with linear growth for the tested deep
history. Wide/criss-cross million-scale timing and independent peak-memory
measurements remain to be recorded; this increment therefore does not yet claim
completion of the full graph scaling acceptance gate.

## Delta dependency resolution

File-backed pack validation no longer makes repeated full passes over pending
deltas or linearly scans all resolved objects for each base. It uses the pack's
static ordered offsets, a bounded exact object-ID map, sorted reverse dependency
tables, and a ready queue. Dependency-edge insertion, lookup attempts, and
dependency releases are charged to the existing work budget. Missing or
unreleasable bases fail closed after the queue drains; OFS bases still require
an exact prior offset, REF bases are independently rehashed, maximum depth 50 is
unchanged, and duplicate resolved IDs are rejected.

Reverse-ordered REF chains at depths 10, 25, and 50 pass and assert exactly one
base load per delta. The complete focused result is 236 Git library, 4 CLI, and
4 signer tests. These small debug runs each rounded to 0.01 s in the shell timer;
larger wide-fanout scaling and peak-memory measurements remain pending.

## Protected signer process boundary

The production signer allocation is now distinct from the ordinary Git client:
UID/GID `21006:21006`, shared socket group `21906`, a `21006:21906` mode-`2770`
socket directory, and a mode-`0660` socket. Startup verifies the exact directory
owner, group, setgid bit, and mode and verifies the created socket's type,
owner, group, and mode. The signer continues to require exact client peer
credentials and a separately provisioned channel capability.

`Dockerfile.git-protected-signer` contains only the signer executable over the
digest-pinned distroless runtime. `compose.signer.yaml` gives it no network or
ports, a read-only root, no capabilities, no-new-privileges, bounded process,
memory, CPU, descriptor and log resources, and only named state, key, channel,
and socket volumes. The offline Git bundle now includes, inventories, SBOMs,
signs, verifies, and loads the third image.

The isolated suite passed 236 library, 4 CLI, and 5 signer tests. A rootless
Podman runtime probe used four fresh named volumes and distinct identities. UID
`21007:21007` with supplemental GID `21906` connected and authenticated the
signer's peer identity; it could not read either private key or write signer
state. UID `21008:21008` without the socket group and UID `21007:21007` with the
wrong supplemental group could not connect. The running signer reported no
network, a read-only root, no-new-privileges, all capabilities dropped, a
32-process limit, 512 MiB memory limit, one CPU, and only the four named mounts.
The probe also found that empty-volume image copy-up can replace provisioned
root metadata. Provisioning now installs an inert signer-owned `.mrml-volume`
sentinel before Compose can mount each volume.

## Runtime-gated AES instruction diagnostic

AES-128 now expands its key once per record and uses runtime-gated x86-64 AES
instructions when CPUID reports support, retaining the constant-time software
fallback. All 55 crypto tests pass, including equality between the hardware and
fallback paths and the FIPS-197 block vector; strict clippy passes.

The same 268,456,731-byte H2 clone completed over the named-volume-only stack in
826 seconds (325,008 source bytes/s), then produced a clean tracked checkout and
the expected four payload hashes. All diagnostic evidence checksums verify. The
run used an explicitly labeled uncommitted working-tree image, so it establishes
the performance cause and correctness direction but is not final release or VPS
acceptance evidence. A clean-commit rerun remains required.

## Protected signer session replay boundary

Signer protocol v2 replaces unauthenticated connection setup plus echoed request
IDs with a signer-generated 256-bit random session, an authenticated five-second
expiry, and an exact one-request sequence ceiling. Both directions bind the
session, expiry, sequence, peer, channel capability, repository generations,
purpose, commit ID, and exact bytes. The focused result is 237 Git library, 4
CLI, and 6 signer tests, including wrong capability, tampered hello, wrong
session, sequence replay, and expiry rejection. Strict clippy, formatting, and
diff checks pass. A rebuilt hardened container completed a live v2 hello as UID
`21007:21007` using its separately owned capability named volume; a different
capability failed closed while the signer remained ready. Generation advancement
is a separate incomplete gate and is not claimed by this result.

## Publicly verifiable authority receipts

The receipt authority now treats its existing 32-byte secret as an Ed25519 seed
and emits a fixed 64-byte, purpose-separated signature instead of an HMAC. Its
stable signer identity derives from the public verification key, and the new
`describe-receipt-verifier` operation exports only that 32-byte public key. The
authenticated receipt parser and canonical transcript constructor are exported
for the signer lifecycle path. This removes the need to give the protected
signer symmetric receipt-forging authority. Eight authority tests, 247 Git
tests, strict clippy, formatting, diff checks, and the production authority
release build pass. Delivery of the receipt to the client and durable signer
generation consumption remain incomplete and are not claimed here.
