> Historical record. Current results: [final completion](FINAL_COMPLETION_2026-09-05.md).

# HTTP/2 and TCP admission validation — 2026-09-04

Status: **TESTED HTTP/2 and actual TCP worker admission locally**.
This evidence uses the dirty live checkout based on
`20ecf53e213d1211e2ea41865e1df31cdc59d9a731e29f46c046a3ad5e09d3f5`.
It does not qualify real certd or the blocked Docker Compose release.

## Defects and changes

The production server already owned `Http2ConnectionState` and bounded
continuation assembly; TCP admission already existed. This pass preserved them.
Four focused regressions reproduced empty concurrency/HPACK SETTINGS,
rejection of repeated settings, rejection of unused flags/reserved stream bit,
and failure to decode padded HEADERS with priority fields. Baseline: **83 pass**;
red regression run: **83 pass, 4 fail**.

`packages/libraries/http/src/http2.rs` now advertises one stream and zero HPACK
table capacity, retains the initial bounded pre-acknowledgment dynamic table,
parses legal padding/priority, ignores unused flags, and processes duplicate
settings in order. It refuses excess streams while maintaining compression and
connection flow state, reuses connections after resets, debits full wire DATA
payloads, and bounds control/empty-fragment work. The native client also uses
the shared bounded decoder and assembles response continuations. The exact
supported limits and remaining unsupported trailers/general multiplexing are
in [HTTP2_COMPLETION_PROFILE.md](../edge/HTTP2_COMPLETION_PROFILE.md).

New test files:
`packages/libraries/http/src/http2/oracle_tests.rs` and
`packages/services/gitd/src/tcp_listener_tests.rs`. The latter has a small
`cfg(test)` empty/private service constructor in `composition.rs` and a test
module declaration in `lib.rs`; production catalog admission is not bypassed
or claimed by that test. The actual fixed IPv4 admission configuration is
recorded in [DDOS_AND_RESOURCE_PROFILE.md](../edge/DDOS_AND_RESOURCE_PROFILE.md).

## HTTP tests

```sh
target/release/mrml test org.mrml.library.http --target linux
target/release/mrml test org.mrml.library.http --target linux --release
target/release/mrml test org.mrml.library.http --target linux --release --sanitizer address
```

Normal interim result: **91 pass, 3 explicit live gates ignored**. Final
optimized normal and AddressSanitizer: **92 pass, 5 explicit live gates ignored**.
The final additional test checks intermediate duplicate-window-setting overflow.
All five live gates were separately executed successfully, including under
AddressSanitizer; no sanitizer finding. This is actual execution, not just
presence of instrumentation.

The independent oracle was installed only in a disposable environment:

```sh
python3 -m venv /tmp/mrml-completion-h2-oracle
/tmp/mrml-completion-h2-oracle/bin/pip install 'h2==4.3.0' 'hpack==4.1.0' 'hyperframe==6.1.0'
```

Observed versions: h2 4.3.0, hpack 4.1.0, hyperframe 6.1.0, OpenSSL 3.6.4
(25 August 2026). These are independent test codecs, not production dependencies.
Rust owns assertions and server behavior. Keys are disposable local fixtures;
none belong in the source/release archives.

```sh
MRML_H2_ORACLE_PYTHON=/tmp/mrml-completion-h2-oracle/bin/python \
MRML_HTTP2_HOSTILE_CERT=/tmp/mrml-completion-d-tls/http-rsa.pem \
MRML_HTTP2_HOSTILE_ISSUER=/tmp/mrml-completion-d-tls/ca.pem \
MRML_HTTP2_HOSTILE_KEY=/tmp/mrml-completion-d-tls/http-rsa.key \
MRML_CA_BUNDLE=/tmp/mrml-completion-d-tls/ca.pem \
target/mrml-native/linux/release/mrml_http_tests --ignored \
  http2::oracle_tests:: --nocapture --test-threads=1
```

**5/5 passed**, normal 0.57 s and instrumented 0.68 s:

- Initial pre-SETTINGS HPACK, padded/priority fragmented HEADERS with unused
  flags, three repeated requests, and a 120,000-byte padded POST with flow credit.
- Remote cancellation followed by a valid request on the same connection.
- Local reset with unconsumed buffered/padded body, then connection reuse.
- Streams 3 and 5 refused while 1 remains active; late DATA and RST on 3;
  successful completion of 1 and subsequent request 7.
- 65-fragment sequence rejected at the bounded continuation limit, including
  empty fragments that do not exhaust the byte limit.

Using the same `MRML_HTTP2_HOSTILE_*` and `MRML_CA_BUNDLE` variables:

```sh
target/mrml-native/linux/release/mrml_http_tests --exact \
  http2::tests::hostile_sequences_reach_the_real_tls_listener_when_configured --nocapture
```

**Passed**, 2.94 s. Existing malformed sequencing/window/reset/truncation corpus
actually traversed verified native TLS and the real HTTP/2 listener.

The native client/server gate also passed in the full optimized 92-test run:

```sh
MRML_HTTP2_LOOPBACK_CERT=/tmp/mrml-completion-d-tls/http-rsa.pem \
MRML_HTTP2_LOOPBACK_ISSUER=/tmp/mrml-completion-d-tls/ca.pem \
MRML_HTTP2_LOOPBACK_KEY=/tmp/mrml-completion-d-tls/http-rsa.key \
MRML_CA_BUNDLE=/tmp/mrml-completion-d-tls/ca.pem \
target/release/mrml test org.mrml.library.http --target linux --release
```

The fixture does not require OCSP. If `MRML_HTTP2_LOOPBACK_OCSP` is supplied,
the test retains staple verification. No fabricated staple or insecure TLS
option was introduced.

## Actual worker admission

The optimized Gitd suite passed **58 library + 8 daemon + 1 backup tests**,
with three explicitly gated fixtures. Its new always-on slow-listener test
uses a real runtime TCP listener and actual worker pool: one stalled TLS
handshake, bounded queue backpressure, two expired queued entries, source-limit
rejection and all connection/handshake permits returned. It uses an empty
private backend, not two real protected repositories.

The first explicit credential stress run failed because the test omitted
`git-protocol: version=2` and assumed denial connection reuse. The production
Gitd profile returns a privacy-preserving 404 for denied private repositories
and closes that connection. The corrected test supplies Git v2 and creates a
fresh verified TLS/H2 connection for every denial. The corrected gate passed
on the instrumented optimized build in **3.07 seconds**: 24 privacy-preserving
404 responses, 12 connections from each kernel-observed source (127.0.0.1 and
127.0.0.2), zero TLS/protocol failures, all connection/handshake permits returned,
upload/receive current usage and leak assertions zero, and no descriptor growth.
This does not prove allocation counts or repository operation success.

```sh
target/release/mrml test org.mrml.service.gitd --target linux --release --sanitizer address
MRML_H2_ORACLE_PYTHON=/tmp/mrml-completion-h2-oracle/bin/python \
MRML_HTTP2_HOSTILE_CERT=/tmp/mrml-completion-d-tls/leaf.pem \
MRML_HTTP2_HOSTILE_ISSUER=/tmp/mrml-completion-d-tls/ca.pem \
MRML_HTTP2_HOSTILE_KEY=/tmp/mrml-completion-d-tls/leaf.key \
MRML_CA_BUNDLE=/tmp/mrml-completion-d-tls/ca.pem \
target/mrml-native/linux/release/mrml_gitd_tests --ignored --exact \
  tcp_listener_tests::real_listener_two_ipv4_sources_repeated_invalid_credentials --nocapture
```

The final instrumented Gitd suite passed **58 + 8 + 1 tests**. The P-256
worker fixture and RSA HTTP fixture use the same disposable public CA; they
are distinct test signing setups. Neither substitutes for production certd
custody or the final two-repository Compose sequence.

Existing operation-permit cancellation/backend-failure regressions passed in
the HTTP suite. No new coverage-guided fuzzer target is declared for these
packages; deterministic adversarial tests and live hostile traffic were run.
Do not relabel them as coverage-guided fuzzing or sustained DDoS resistance.

Logs use `/tmp/mrml-git-completion-d-` with suffixes `baseline.log`, `red.log`,
`green2.log`, `release.log`, `native.log`, `oracle.log`, `hostile.log`,
`http-asan.log`, `oracle-asan.log`, `gitd-release.log`, `gitd-asan.log`,
`admission.log` (initial test failure) and `admission-corrected.log` (pass).

Required agent security review found no blocking issue after the bounded
refusal/reset/flow fixes; it is not independent human audit. Patent review:
**NOT_TRIGGERED** — correction of existing standard protocol mechanisms.
See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
