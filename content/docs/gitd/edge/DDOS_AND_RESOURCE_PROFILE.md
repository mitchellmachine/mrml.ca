# DDoS and resource profile

Implemented bounds cover packet history, ACK ranges, sparse stream gaps and
chunks, connection/stream receive credit, HTTP/3 active and completed streams,
Retry token size and replay storage, half-open count, per-IPv4 source count,
handshake memory, and handshake lifetime. Under configured pressure,
unauthenticated clients receive Retry; exhausted state rejects without growth.

`GitdResourceController` now provides a fixed-capacity source table, integer
token buckets, IPv4 identity and IPv6 `/64` aggregation, independent concurrent
work-class ceilings, the 40 GiB disk reserve, and hysteretic NORMAL, PRESSURE,
SIEGE, and RECOVERY transitions. Table or permit exhaustion rejects without
growth. PRESSURE/RECOVERY reject large diffs; SIEGE admits only cached pages and
Git reads. Reactor wiring must supply trusted resource snapshots and call
completion for every admitted permit.

Endpoint wiring now consumes and releases exact handshake and open-connection
permits, including rollback and timeout reconciliation. Deterministic tests fill
and reject the next slot at 8,000 open connections, 1,000 lightweight requests,
128 handshakes, 64 cached streams, 64 Git reads, 16 pushes, 8 renders, and 4
Zstandard jobs. Endpoint counters cover received packets/bytes, drops, new
Initials, handshakes, established routes, and candidate paths.

The TCP/TLS path has a separate fail-closed admission controller ahead of its
bounded HTTP/2 worker queue. The kernel-reported IPv4 peer selects a bounded,
sorted source bucket with an integer token rate, at most 32 concurrent
connections per source, and a global connection ceiling equal to the HTTP/2
worker-plus-queue envelope. TLS handshakes have an independent ceiling equal to
the worker count. A queued connection expires at the configured drain deadline
before it can consume handshake work. RAII permits cover every success and
failure path; internal metrics retain admissions, each rejection class, current
connection/handshake counts, queue wait total/maximum, expiry, and inconsistent
permit-release events. The type also defines IPv6 `/64` aggregation for the
future dual-stack listener, but the current TCP listener and runtime address ABI
remain IPv4-only.

Distributed-source tests, sustained soak, TCP slow-client process tests, the
socket-independent encrypted reactor, and production CPU/RSS/latency measurements remain open gates. These
deterministic unit tests establish exact bounds, not DDoS resistance or host
capacity.

## Fixed HTTP/2 deployment profile

For base `serve-h2`, let `N = max_connections` from validated Gitd configuration.
The production constructor derives `W = max(1, min(16, N / 2))` workers and
`N - W` queue slots (a nonempty queue is required). Source buckets are bounded
by `min(N, 65_536)`, global connections by N, and one IPv4 source by
`min(N, 32)`. Concurrent TLS handshakes are bounded by W. Each source has a
fixed burst of 64 admission tokens and refills at 8 per second; inactive buckets
may be retained for 300 seconds. `drain_seconds` controls both queued admission
expiry and the TLS handshake timeout. These are the actual fixed derivations,
not separately exposed administrator controls. `max_uploads` and `max_receives`
remain the independently configured application operation ceilings.

The runtime listener binds IPv4 `0.0.0.0`, and `SocketAddress` exposes four IP
bytes. `TcpSourceIdentity::Ipv6Prefix64` is a pure-controller representation;
no live IPv6 admission is claimed or accepted through this listener. A proxy
would become the observed source; untrusted forwarded headers do not replace
kernel peer identity.

`GitdHttp2WorkerPool::submit` currently blocks on its bounded channel when full.
This applies backpressure to the accept worker until a slot opens; it does not
promise immediate queue-full rejection. Queued entries are checked for expiry
before beginning TLS, and their admission permits remain held while queued.
The per-I/O established HTTP/2 server timeout is five minutes, distinct from
the configured handshake/drain interval. No uniform process shutdown latency
for active established traffic is established by those bounds alone.
