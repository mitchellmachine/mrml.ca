# Real Docker H2 transfer measurements — 2026-09-05

Status: **TESTED diagnostic continuation**. These measurements are not the final
continuous clean-source release, and a fresh same-fixture baseline comparison
is still **NOT_RUN**. Images were built locally, externally authenticated,
loaded into Docker CE 29.8.0 on mrml.ca, and selected through Compose 5.5.1.
The daemon image generation remained `completion-f-20260905`; certd used the
locally tested lock-order fix, and the test client used diagnostic-f4.

Both fixtures contain eight distinct 32 MiB files (256 MiB total). Text and
deterministic incompressible data use separate SHA-256 repositories through one
real authority generation root and Gitd. Each has independently scoped signer
state and credential channels. Both retain verified TLS 1.3/H2 and the same
client/Gitd 2-CPU, 2-GiB container limits. H3 remains disabled.

| Fixture / operation | Elapsed s | Transfer bytes¹ | Client CPU s | Client peak KiB | Gitd CPU s | Gitd sampled peak KiB | Client read/write calls² | Gitd read/write calls² |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| text clone | 37.67 | 4,242,631 | 25.94 | 331,376 | 37.96 | 113,600 | 1,741 / 8,796 | 1,000 / 707 |
| text fetch | 25.17 | 4,247,671 | 15.37 | 135,148 | 26.51 | 81,028 | 1,649 / 8,632 | 764 / 704 |
| random push | 70.83 | 271,622,768 | 38.88 | 118,544 | 82.13 | 112,892 | 42,877 / 65,651 | 107,006 / 29,622 |
| random clone | 79.04 | 271,767,668 | 56.74 | 363,792 | 80.04 | 113,464 | 74,002 / 49,321 | 41,480 / 32,860 |
| random fetch | 50.70 | 271,767,966 | 33.77 | 199,640 | 53.71 | 114,224 | 73,944 / 49,280 | 33,131 / 32,851 |

¹ Client network-namespace non-loopback bytes include TLS, H2, TCP/IP, DNS and
link traffic, not only pack payload. Text clone received 1.581% of fixture bytes;
random clone received 101.241%. Random data is not expected to shrink.
² These are `/proc/PID/io` read/write syscall counters, not all syscall classes.

The wrapper uses `getrusage` for exactly one reaped native Git child. Docker
denied its final child-I/O read; the host observer captured that retained child
after verifying container parent and namespace PID. The bounded observer wait
is excluded from transfer elapsed/network values. The 100-ms child-state poll
can add up to one polling interval. Gitd CPU uses before/after kernel counters
with independently read `CLK_TCK=100`; RSS is sampled once per second, not an
exact kernel operation-specific peak. Kernel: `7.0.0-30-generic`. No ptrace or
extra capability was granted to a client or daemon.

Text clone and fetch preserved all eight hashes; fast-forward pull also matched.
Random push, fresh clone, fetch and fast-forward pull passed all eight hashes.
Authority CPU was 0.02 seconds for the random push and zero measured ticks for
these read operations. The text protected push succeeded but its initial child
accounting failed; **a fully measured text push remains NOT_RUN**.

The fresh client `.git` sizes were 4,133,512 bytes for text and 268,479,406 bytes
for random. Do not confuse these with the server’s total retained generation
storage. After both runs, the server quarantine/generation volume held
809,486,248 bytes; repo/state/receipt/authority volumes held 780 / 7,875 / 2,873 /
63,013 bytes respectively. Recovery-safe retained generations were not pruned.

The clone client peak of 331,376 KiB (text) and 363,792 KiB (random) is reported
without claiming constant memory or equivalence to older fixtures. The required
same-fixture baseline and analysis remain open.

Numeric evidence and hashes are in [text counters](probes/compose-2026-09-05/text-counters/clone-accounting)
and [random counters](probes/compose-2026-09-05/random-counters/push-accounting).
Source/diagnostic image identities and exact commands are recorded in
`CURRENT_COMPLETION.md` and the adjacent diagnostic scripts.

Patent review: **NOT_TRIGGERED** for conventional test accounting and fixture
orchestration. See `../../patents/REVIEW_LOG.md`.
