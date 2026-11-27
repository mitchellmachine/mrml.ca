# Same-host Docker H2 compression comparison — 2026-09-05

Status: **TESTED**. These are actual native MRML transfers over verified TLS
1.3/H2 in hardened Docker Compose on mrml.ca. This is a Docker bridge on one
VPS, not a WAN throughput measurement. No production readiness is claimed.

The after build is the clean source archive SHA-256
`183e65b330de65f785898087a4c29a887161638cdf8e3c9e1d42e321f4c49bbe`, exported
from Git tree `6ab2a37bfc65a87071a7867db25eedb52bdbcfa6e22dedf713f097b0f320ecad`.
The local signed checkpoint timed out awaiting GPG unlock; this tree is not
presented as a commit. All seven after images were rebuilt from this archive.

The before control restores only the three pre-compression writer files from
base HEAD `20ecf53e213d1211e2ea41865e1df31cdc59d9a731e29f46c046a3ad5e09d3f5`
in an isolated current Git/Gitd source copy. Its source archive SHA-256 is
`48b3b9a839afb7f0ef5ad9fa6593586bdbe6aafb92410bdee508fdee530549fb`.
Two API-only shims preserve the current 768 KiB compression resource charge and
unused output trait method. This is an old-writer counterfactual, not a claim
that the entire historical server was deployed. The successful before3 and
after runs use the same corrected real-certd image. Earlier before/before2
attempts using older certd or incomplete accounting are excluded and retained.

Both fixtures contain eight distinct 32 MiB files, totaling 268,435,456 bytes.
Hashes are identical between variants. Client and Gitd each retain two CPUs
and 2 GiB memory; maximum object size, verification and timeouts are unchanged.
Runs are sequential, with the other test Git stack stopped. Existing unrelated
host workloads remain running. The after repository also contains the small
acceptance commits from earlier steps, so history bytes are not identical;
the 256 MiB fixture and its exact file bytes are identical.

Native child `getrusage` records CPU and peak client RSS. The host checks the
retained child PID namespace and parent before atomically providing numeric
I/O counters; no ptrace or DAC capability is added to the client. Elapsed and
network measurements exclude this observer handoff. Server CPU uses stable
process start IDs and 100 ticks/second. Server RSS is sampled each second;
the JSON also records the process-lifetime VmHWM, which is not a per-operation
peak. Network bytes include TLS, H2, TCP/IP and link overhead. `syscr` and
`syscw` are read/write syscall counts, not all syscall types.

| Fixture / operation | Before seconds | After seconds | Before wire bytes | After wire bytes |
| --- | ---: | ---: | ---: | ---: |
| text push | 48.404 | 31.755 | 271,572,575 | 4,186,848 |
| text clone | 43.684 | 37.577 | 271,833,155 | 4,242,563 |
| text fetch | 27.955 | 24.245 | 271,811,973 | 4,238,452 |
| random push | 48.292 | 68.821 | 271,584,433 | 271,575,446 |
| random clone | 43.580 | 79.248 | 271,841,067 | 271,768,498 |
| random fetch | 29.869 | 50.593 | 271,856,257 | 271,767,218 |

Wire is client transmit for push and receive for clone/fetch. Text wire falls
about 98.4%; raw-fixture/wire ratios are approximately 63–64:1 after compression,
including protocol overhead. Random traffic is essentially unchanged. Random
elapsed time regresses by 43–82%; it is not hidden by different fixtures,
reduced verification, larger limits or longer timeouts.

| Fixture / operation | Client CPU before → after (s) | Gitd CPU before → after (s) | Client peak RSS before → after (KiB) | Gitd sampled peak before → after (KiB) |
| --- | ---: | ---: | ---: | ---: |
| text push | 18.120 → 17.073 | 65.51 → 35.12 | 150,680 → 102,360 | 72,268 → 83,896 |
| text clone | 29.176 → 25.905 | 46.41 → 37.18 | 379,988 → 331,480 | 57,404 → 116,672 |
| text fetch | 19.243 → 15.066 | 30.31 → 26.94 | 215,848 → 135,404 | 42,276 → 84,416 |
| random push | 17.826 → 38.602 | 66.10 → 79.96 | 150,476 → 118,544 | 73,460 → 116,224 |
| random clone | 29.287 → 57.146 | 46.97 → 79.45 | 379,864 → 363,672 | 68,564 → 99,932 |
| random fetch | 19.810 → 33.855 | 30.75 → 53.84 | 215,880 → 199,768 | 41,396 → 85,024 |

| Fixture / operation | Client read syscalls before → after | Client write syscalls before → after |
| --- | ---: | ---: |
| text push | 42,876 → 974 | 49,296 → 8,804 |
| text clone | 76,732 → 1,741 | 34,335 → 8,796 |
| text fetch | 76,674 → 1,638 | 34,294 → 8,572 |
| random push | 42,876 → 42,877 | 49,296 → 65,651 |
| random clone | 76,732 → 74,002 | 34,335 → 49,321 |
| random fetch | 76,674 → 73,944 | 34,294 → 49,280 |

The text client's `.git` directory falls from 268,459,328 to 4,134,196 bytes.
Random `.git` storage is essentially unchanged (268,459,398 → 268,479,878).
After both fixtures, retained server quarantine is 1,073,789,476 → 809,486,682
bytes; repository metadata alone is only 780 bytes in each case and must not
be described as total Git storage. Old recovery-safe state is retained; no
pruning was performed. All individual volume sizes, authority CPU, network
counters, sampled server RSS and exact file hashes are in
[the public counters](probes/compose-final-2026-09-05/) and
[the measurement rows](probes/compose-final-2026-09-05/measurements.json).

Exact public host orchestration is retained with the final acceptance record.
Every successful clone and fast-forward pull verifies all eight file hashes.
The retained earlier failed probes are not included in these successful rows.
