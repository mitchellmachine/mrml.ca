# Git/Gitd hosted validation — 2026-09-01

This record is exact hosted Linux evidence, not production-container,
public-network, physical-host, power-loss, real-VPS, or independent-review
evidence. Work began from repository commit
`938e53563698dd6ecd88b3bab7c787edef581210cd1eb2998f457029650d517a`.

The following commands passed on the local Linux x86-64 workspace:

| Command | Result |
| --- | --- |
| `./target/debug/mrml manifest lock --check` | PASS, 70 packages and 5 interfaces |
| `./target/debug/mrml manifest check` | PASS, 70 components and 209 dependencies |
| `./target/debug/mrml test org.mrml.tool.git --target linux` | PASS, 195 library and 3 binary tests |
| `./target/debug/mrml test org.mrml.library.http --target linux` | PASS, 72 tests |
| `./target/debug/mrml test org.mrml.library.ssh --target linux` | PASS, 27 tests |
| `./target/debug/mrml test org.mrml.library.tls --target linux` | PASS, 34 tests |
| `./target/debug/mrml test org.mrml.library.runtime --target linux` | PASS, 48 tests |
| `./target/debug/mrml test org.mrml.service.git-authority --target linux` | PASS, 4 tests |
| `./target/debug/mrml test org.mrml.service.gitd --target linux` | PASS, 27 tests |
| `./target/debug/mrml test org.mrml.service.certificate --target linux` | PASS, 133 tests |
| `deploy/compose/test-compose-git.sh` | PASS, static source invariants |
| POSIX `sh -n` over the Git deployment operators | PASS |

The Git tests include real child-process SIGKILL at eight durable boundaries:
prepared journal, installed arrival pack, installed-phase journal, ref
activation, activated-phase journal, receipt append, receipt-phase journal, and
journal completion. Each reopen exact-checks the recovery classification, live
ref generation, and whether the arrival pack is selected/visible. They also
include durable-boundary failure injection, authenticated recovery and idempotence,
same-repository conflict serialization, independent-repository concurrency,
complete introduced merge ancestry, SHA-1 boundary rejection, streaming pack
validation, and deterministic hostile parser corpora. Those tests do not prove
power-loss behavior outside those exact boundaries, coverage-guided fuzzing,
sanitizer execution, multiprocess distributed contention, or physical-storage
ordering.

Docker, Syft, Cosign, cargo-fuzz, and Valgrind were not installed on this host.
Consequently no image was built, inspected, saved, loaded, signed, or run here;
no SBOM or image ID was generated; the combined Compose stack and real certd
rotation were not exercised; no 256 MiB container transfer RSS/descriptor/disk
measurement was recorded; and no coverage-guided fuzz or sanitizer campaign is
claimed. The offline builder deliberately requires those tools and fails rather
than emitting partial release evidence.

`tools/containers/measure-git-streaming.sh` is the production measurement
harness for the missing large-transfer evidence. It refuses transfers below
256 MiB, runs an argument-vector command without recording it, samples the
client/Gitd/authority RSS and descriptor counts from `/proc`, records Docker
network/resource counters and repository/quarantine/cache disk use, calculates
peak and growth summaries plus throughput, and authenticates the evidence files
with `SHA256SUMS`. It discards command stdout/stderr so credentials and request
data cannot enter the evidence package. The offline release builder now refuses
to emit a release unless this exact-commit evidence verifies and is at least
256 MiB; the bundle verifier repeats those checks. The harness has passed shell
syntax and negative-boundary tests only on this Docker-less host.

Current classification remains **PARTIALLY IMPLEMENTED** until the remaining
administration surface is complete and all mandatory real-container,
large-transfer, crash-cycle, backup/restore, upgrade/rollback, and real-certd
integration evidence has run. The eventual pre-certd release classification may
be only **Git/Gitd production candidate ready for certd integration**.

Patent review: **NOT_TRIGGERED**. This file records test execution and evidence
limits; it introduces no mechanism. The implementation screens remain in
`docs/gitd/core/PATENT_SCREEN.md`, `docs/gitd/edge/PATENT_SCREEN.md`, and
`docs/patents/REVIEW_LOG.md`.
