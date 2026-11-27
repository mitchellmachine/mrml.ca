# HTTP/2 bounded Git profile — completion pass

Status: **SOURCE_VERIFIED and TESTED locally**. This describes the native
HTTP/2 implementation, not a claim of complete RFC conformance or a qualified
production deployment. Base Compose continues to select `serve-h2` and TCP;
HTTP/3 is disabled.

The server advertises `SETTINGS_MAX_CONCURRENT_STREAMS=1` and
`SETTINGS_HEADER_TABLE_SIZE=0`. It retains bounded initial HPACK state (4,096
bytes) for requests sent before acknowledgment of that setting. Thereafter the
peer must reduce its table to zero. Compressed fields are processed in wire
order, including refused streams, so their connection-wide compression state
cannot corrupt later admitted requests. The native literal-only encoder emits
a zero table-size update; the native client retains bounded pre-acknowledgment
response decoding state and assembles continuations before queueing responses.

Excess streams receive `REFUSED_STREAM` while the admitted request remains
selected. Late DATA/RST/WINDOW frames on closed lower stream IDs are handled
without retaining an unbounded per-stream table. In-flight DATA still consumes
connection flow credit. Stream IDs and continuation sequencing remain checked.
Remote and local resets discard the selected pending body and return its
unconsumed credit at connection scope without manufacturing application bytes.

Legal DATA and HEADERS padding, HEADERS priority fields, and unused flag bits
are accepted; padding and priority bytes are removed before header/body use.
The whole DATA payload counts toward flow control, while content length counts
only application bytes. Settings are applied in wire order, including repeated
identifiers and intermediate flow-window overflow checks. Priority scheduling
is not implemented; those obsolete fields are parsed and ignored.

Fixed bounds are 16 KiB per frame, 64 KiB per compressed header block, 64 KiB
for decoded field accounting (including per-field overhead), 256 fields and
64 header fragments. The server permits at most 1,024 consecutive frames
without application progress. Receiving nonempty active DATA or sending actual
response data resets that budget, preserving long legitimate transfers. These
are defensive admission limits, not general multiplexing. Request trailers
remain unsupported. Native client receive-window accounting was not redesigned
as part of the server accounting fix.

The live TCP listener is IPv4-only. Its exact fixed admission derivations,
queue backpressure and distinction between TLS handshake and established-I/O
timeouts are in [DDOS_AND_RESOURCE_PROFILE.md](DDOS_AND_RESOURCE_PROFILE.md).

The protocol reference is [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html).
Focused regression and independent-client evidence is in
[HTTP2_VALIDATION_2026-09-04.md](../operations/HTTP2_VALIDATION_2026-09-04.md); real certd and exact Compose
integration remain separately gated. Patent review: **NOT_TRIGGERED** —
corrections to existing standard framing, bounded HPACK and flow-control
mechanisms. See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
