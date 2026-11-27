# Clean-commit Gitd streaming performance — 2026-09-04

This record extends, and does not replace, the earlier dated Git/Gitd evidence.
The branch was local `main`; no repository push was performed. Unrelated
unstaged HTTP/QUIC and Gitd work and the untracked `Archive.zip` were preserved
and excluded. Release binaries and images were built from the clean detached
worktree `/tmp/mrml-pack-buffer-clean` at each exact signed commit.

## Fixture and claim boundary

The controlled hosted fixture used Podman 5.4.2 through its Docker-compatible
CLI on Linux. All persistent and runtime container data used named volumes. The
only published service endpoint was host loopback TCP; no public port was bound.
Gitd, the client, the authority, and the explicitly labeled certd test fixture
were containers. This is hosted controlled-probe evidence, not physical-server,
production-certificate, Windows, bare-metal, TPM, Secure Boot, IOMMU, or H3
evidence.

The repository's selected immutable pack was exactly 268,456,731 bytes and
contained four incompressible 64 MiB files. The clean baseline and final runs
used the same repository, policy, authority, certificate, CA, and storage bytes.
A fresh named client volume was used for every run. Client credentials were
issued by a one-shot unprivileged Gitd container and piped directly to the
client's `standard-input` provider; token plaintext was neither printed nor
stored.

## Defects and bounded corrections

The exact `e1cc9e06` baseline exposed three independent costs:

1. authenticated pack validation performed one `read(2)` call per compressed
   byte;
2. HTTP/2 returned flow-control credit in tiny increments, producing tiny TLS
   control records and a credit lockstep;
3. TLS left Nagle aggregation enabled while HTTP/2 control traffic encountered
   delayed acknowledgements.

Signed commit `5222997f` adds a fixed 64 KiB pack-file read-ahead buffer while
retaining per-byte CRC, work accounting, bounds, and authentication. Offline
validation of the same repository fell to 4.51 seconds. Signed commit
`32925a39` includes runtime-gated PCLMULQDQ GHASH with its software fallback and
coalesces HTTP/2 WINDOW_UPDATE credit at a fixed 32 KiB threshold. Signed commit
`37100b95` coalesces adjacent backend response fragments into a fixed 16 KiB
buffer before the existing DATA-frame path. Signed commit `bdb056a7` enables
TCP_NODELAY on both accepted and connected TLS TCP streams on Linux and Windows.

Before TCP_NODELAY, `ss -tin` reported approximately 13 ms smoothed RTT and a
40 ms delayed-ack timer on loopback despite a 0.003 ms minimum RTT. During the
final run the client-side smoothed RTT was approximately 0.014 ms, both socket
queues were empty, and 134,763,291 response bytes had already arrived at the
first live sample.

## Exact final artifacts

| Artifact | Identity |
| --- | --- |
| signed source commit | `bdb056a7` |
| `mrml-gitd` binary SHA-256 | `a209a668b1c195d8e7831addf03c5b3277a597df11db3d8cb4820765f9739461` |
| `mrml-git` binary SHA-256 | `bf0fbb0f6959a2d320dd981b75488c472118bcb49bce47cc134eaeae4d51a458` |
| Gitd image ID | `0f38aed6dfe0a1c50e03d9b014aaa388df04b9d2d10723c6a25f4c21fe739691` |
| Gitd image digest | `34e7caeeeea9ad6bf4b8a8a5579de7d08c9ed3543f1f5529b54b22d5de147579` |
| client image ID | `be0db8f54d480b42042ca14418b1cd09563eb15e6245957b687a3a1cba83c3e9` |
| client image digest | `0dba306ca7314a84a15d6f7ede366e26774977ba30115317da0b3a4e6ca491aa` |

The Gitd container ran as `21001:21001`, with supplemental socket groups 21901
and 21902, a read-only root, all capabilities dropped, no-new-privileges, a
2 GiB memory limit, two-CPU limit, 192-PID limit, and loopback mapping
`127.0.0.1:24443 -> 8443/tcp`. The client ran as `21007:21007` with a read-only
root, all capabilities dropped, no-new-privileges, a 1 GiB memory limit,
two-CPU limit, and 96-PID limit. Gitd reached all six ordered startup gates
through `ready` before the client ran.

## Results

| Run | Exact image state | Result | Elapsed | Effective pack rate |
| --- | --- | --- | ---: | ---: |
| baseline | `e1cc9e06` server and client | PASS | 1,615.63 s | 0.158 MiB/s |
| final | `bdb056a7` server and client | PASS | 23.18 s | 11.045 MiB/s |
| independent repeat | `bdb056a7` server and client | PASS | 23.61 s | 10.844 MiB/s |
| VmHWM sampling repeat | `bdb056a7` server and client | PASS | 22.57 s | 11.343 MiB/s |
| current-tree regression | `66806028` server and client | PASS | 24.861 s | 10.297 MiB/s |

The primary final run is 69.70 times faster than the clean baseline and exceeds
the 10 MiB/s gate. Gitd's kernel-maintained `VmHWM` was 135,704 KiB. A client
live `VmHWM` sample reached 398,372 KiB; the exact client cgroup lifetime peak,
which conservatively includes charged page cache and other cgroup memory rather
than RSS alone, was 673,320,960 bytes. Both remained below their configured
limits. The exact client RSS maximum was not sampled at process exit and is not
claimed.

The current-tree regression used exact clean-worktree images at commit
`66806028`: Gitd image ID
`26f2f1c02bf104c3e86bc2c9eae6a78bbe02c931f8d4f42040515f8895f0ac61`
and client image ID
`6ee3c3267c2f029866e9ee22ff0c02152fecd77a6224eea97af5fac2bd567de8`.
Gitd passed all six ordered startup gates. The scoped token was piped directly
from a one-shot issuer into the client and was not printed or stored. The
listener remained loopback-only at `127.0.0.1:20443`; every persistent and
runtime path remained a named volume. The completed clone reproduced all four
hashes below. Shell timing measured the complete issuer-and-client pipeline;
an exact process RSS maximum was not measured and is not claimed.

The completed clone contained these source-matching SHA-256 values:

```text
74a2500349e10eb91073623d93d6b0d960073d407acf18434ad1f8b97d81c54b  stream-01.bin
db6bd32d084e1b5fdf37c1af286370aea8d6b80a2882e7c5cba0ed381f85a57b  stream-02.bin
eb60a02c65f43d67197d08aad6eaf368060b6728de9f04a59a254d8a07691b94  stream-03.bin
c10c3224d17e4f39d5d20605bc614777c363ae886fbd5356979dd69dfe177f4f  stream-04.bin
```

## Verification performed in this increment

```text
git fsck --full --no-reflogs --no-dangling                    PASS
target/debug/mrml manifest check                              PASS (71 packages, 214 dependencies)
target/debug/mrml manifest lock --check                       PASS (71 packages, 5 interfaces)
deploy/compose/test-compose-git.sh                            PASS
target/debug/mrml test org.mrml.tool.git --target linux          PASS (271 library, 4 CLI, 7 signer after scaling continuation)
target/debug/mrml test org.mrml.library.crypto --target linux    PASS (56)
target/debug/mrml test org.mrml.library.tls --target linux       PASS (34)
target/debug/mrml test org.mrml.library.http --target linux      PASS (79; socket tests outside restricted sandbox)
target/debug/mrml test org.mrml.service.gitd --target linux      PASS (48 library, 6 binary, 1 backup; socket tests outside restricted sandbox)
target/debug/mrml test org.mrml.library.runtime --target linux   PASS (50; socket tests outside restricted sandbox)
cargo fmt --all -- --check                                      PASS
cargo clippy --all-targets -- -D warnings                       PASS
git diff --check                                                 PASS
target/debug/mrml assurance check                               FAIL (pre-existing unadmitted unsafe boundary: docs/compiler/probes/pinned_std_thread_tls_execution.rs)
target/debug/mrml build org.mrml.library.tls --target windows    NOT RUN: cross_host_rust_target unavailable
```

The interrupted comparison clones were deliberately stopped after collecting
diagnostic evidence and are not counted as successful runs. Their named volumes
were retained. The final and repeat clones exited zero and printed their normal
completion line.

## Incremental and no-change fetch regression

The destructive-restore exercise later exposed a separate client negotiation
defect. A fresh clone followed by `fetch origin` sent no `have` lines, so the
server streamed all 29 reachable objects and the four 64 MiB blobs again. The
native client remained near 59 MiB RSS but consumed about 85% of one CPU for
approximately 14 minutes. This did not invalidate the 10 MiB/s fresh-clone
result above; it showed that incremental fetch was incorrectly behaving like a
full clone.

Signed commit `0049cfbb` now derives at most the protocol's fixed 16 `have`
entries from the prior remote's atomic authenticated ref manifest. A tip is
advertised as a `have` only when its exact local object reopens successfully;
missing or unreadable local state therefore takes the network repair path. The
server's existing exact-set graph subtraction remains authoritative. A focused
test proves deduplication, remote isolation, and use of the durable manifest.

The exact clean-worktree release binary at `0049cfbb` had SHA-256
`b927c1b7c1512b9c69600adf63f41680fc4c7af35afbac230e18408adca2f59f`.
Its controlled test image was `62b51d12cd301b2f91d04709eadf24736fc853a4fd132c410c84ddb8b6bef2a9`;
the uploaded offline image archive had SHA-256
`227f0de68668cd1b2830074b74312f915ae672b38be4ce0a500d7e2930893347`.
Against the still-running generation-9200 restored target, it fetched only the
three objects introduced after the client's prior tip:

```text
Fetched 3 object(s) and 1 branch ref(s) from origin
real 31.177 s
```

That run exposed a second edge case: when `want == have`, the server's valid
empty pack reached an import path that required the wanted commit to be newly
present and failed authentication. Signed commit `003e1e3c` adds a narrower
no-change fast path before requesting a pack. It applies only when the complete
authenticated advertised branch set exactly equals the durable prior remote
manifest and every referenced object reopens locally. Any ref difference or
unreadable object continues through normal authenticated negotiation and pack
validation.

The exact clean-worktree release binary at `003e1e3c` had SHA-256
`8010cc96a613f28013ed80e89dd4470ca0b6c950117f933b343ddf7ac853a65f`.
The controlled test image was
`4999e166cd0b19e2608f5a37ecee9c40fe68c2b23a71ca6f4aa379f9be2d8e39`;
its uploaded offline archive had SHA-256
`9b76dccb3fd87f26517110e1c3b5b357f545e864467452b48ea163989dfbef04`.
The same restored target and named client volume then reported:

```text
Fetched 0 object(s) and 1 branch ref(s) from origin
real 2.542 s
user 0.078 s
sys 0.054 s
```

Both tokens were generated in one-shot unprivileged Gitd containers, checked
for canonical lower-hex length, piped only on standard input, and unset without
being printed or persisted. The target remained loopback-only and used the
explicit certd test fixture. These runs are controlled hosted incremental-fetch
evidence, not production-certificate or public-network evidence. The test
images reuse the already inspected client base with only the exact clean-built
native executable replaced; they are not substitutes for the final coherent
signed offline deployment bundle.

## Delta and graph scaling continuation

Signed commit `638514a4` removes the remaining repeated deferred-list scan and
linear REF-base search from the bounded full-buffer pack parser used by local
import, compaction, and compatibility paths. It now builds an exact object-ID
map, a sorted offset table, reverse-dependency ranges, and a ready queue. Each
entry is attempted initially and thereafter only when its exact base resolves;
resolved objects are sorted into pack order once at the end. The production
file validator already used the corresponding indexed dependency architecture
from `d8a51397`. Missing or cyclic dependencies leave pending entries and fail
closed, duplicate resolved object IDs are rejected, and delta expansion remains
subject to the existing object/count limits. Production full-pack response
caching remains compile-time disabled and its regression test passes.

History verification and upload-pack reachability already use bounded
`ObjectIdSet` instances for old-reachable, visiting, verified, excluded, and
seen membership. Deterministic result order remains a separate vector. Nodes
are scheduled once after exact-set membership checks, every parent edge is
bounded, and merge-side ancestry uses the same traversal.

The following measurements used the final debug test executable directly on
the same Linux host. Wall samples include process and test-harness startup, so
they are conservative for the smallest case. Each timing row is the median of
20 or 30 successful single-threaded process runs; VmHWM rows are ten or twenty
separately monitored successful runs.

| Workload | Count | Median wall | Maximum wall | Median VmHWM |
| --- | ---: | ---: | ---: | ---: |
| introduced linear graph | 1,000 | 55.683 ms | 59.464 ms | 4,248 KiB |
| introduced linear graph | 2,000 | 112.856 ms | 123.521 ms | 4,192 KiB |
| introduced linear graph | 4,000 | 224.250 ms | 246.529 ms | 4,192 KiB |
| production file REF-delta chain | 10 | 1.755 ms | 1.962 ms | 4,248 KiB |
| production file REF-delta chain | 25 | 2.085 ms | 2.219 ms | 4,198 KiB |
| production file REF-delta chain | 50 | 2.733 ms | 2.823 ms | 4,194 KiB |
| full-buffer reverse REF-delta chain | 50 | 2.526 ms | 3.851 ms | 4,208 KiB |
| full-buffer reverse REF-delta chain | 100 | 3.806 ms | 4.413 ms | 4,198 KiB |
| full-buffer reverse REF-delta chain | 200 | 7.166 ms | 7.681 ms | 4,210 KiB |

Graph median time ratios are 2.03 for 1,000 to 2,000 nodes and 1.99 for 2,000
to 4,000 nodes. The full-buffer reverse-chain ratios are 1.51 for 50 to 100 and
1.88 for 100 to 200 despite fixed process startup. These observations are
consistent with the inspected O((objects + dependencies) log objects) offset
operations and amortized constant-time exact-ID membership, not repeated
all-pending or all-visited scans. They do not constitute a million-object
physical-host claim.

Patent review: **NOT_TRIGGERED** for each increment. These are bounded
read-ahead, standardized GHASH instruction acceleration, conventional HTTP/2
credit/coalescing, and a conventional TCP socket option; they add no new wire
protocol, compression method, cryptographic construction, congestion algorithm,
or adaptive selection policy. See `docs/patents/REVIEW_LOG.md`.
