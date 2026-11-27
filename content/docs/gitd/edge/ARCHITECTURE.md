# Gitd public edge architecture

Status: **PARTIALLY IMPLEMENTED**. The edge owns transport, HTTP routing,
rendering, representation caching, and admission. It consumes `GitdBackend` and
never opens repository storage. Names identify repositories; the backend must
independently authorize every operation.

Implemented: bounded replay ranges and sparse streams, persistent HTTP/3 stream
state, enforced receive credit, a generic server-rendered router, an in-memory
precompressed representation cache, Retry-token and admission primitives, and
fail-closed application-key limits. `QuicServerEndpoint` persistently owns its
socket, performs bounded pre-decryption DCID routing, isolates unrelated traffic,
accounts handshake/open-connection permits, reconciles timeouts, and exposes
bounded traffic/drop/path counters. Candidate-path input cannot affect stream or
ACK/recovery state before path validation. The current `QuicServerListener` and
`QuicConnection` encrypted protocol engines still consume sockets; moving their
TLS/QUIC state behind the endpoint dispatcher is the remaining reactor blocker.
