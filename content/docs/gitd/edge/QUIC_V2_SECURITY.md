# QUIC v2 security state

QUIC v2 constants, packet types, Initial secrets, authenticated version
information, bounded packet history, receive flow control, sparse reassembly,
anti-amplification, and path validation are **IMPLEMENTED** with focused hosted
tests. Gitd must select v2 explicitly; no silent v1 downgrade is allowed.

Client and server handshake paths now maintain distinct bounded authenticated
packet histories for Initial and Handshake, while established connections keep
their independent Application history. Truncated packet numbers reconstruct
from the matching space. A packet enters a history only after header protection
and AEAD succeed; duplicate or too-old packets are discarded before CRYPTO
assembly or TLS effects. ACKs are generated from authenticated ranges rather
than scalar last-seen counters, preserving legitimate reordering.

Retry tokens bind the exact IPv4 address and port, original destination ID,
issuance time, purpose, and rotating key generation. Tokens are AEAD protected,
single-use within bounded replay storage, and limited to 256 bytes. Half-open
admission is bounded globally, per IPv4 address, by memory, and by lifetime.
The persistent endpoint authenticates a presented Retry token before requesting
a half-open permit. Under configured pressure an unvalidated Initial receives a
fresh encrypted token; wrong-peer, expired, replayed, malformed, or oversized
tokens reject without allocating handshake state.

Application traffic closes before conservative packet or byte limits and on an
unsupported key-phase change. `QuicServerEndpoint` persistently owns UDP and
bounds handshake, established, and retired DCID routing state. It ignores
malformed, unknown, and retired IDs before connection decryption and preserves
the authenticated peer while labeling a different source a candidate path.
Full reactor-owned protocol state, key update, reordered old-phase handling, and
IPv6 `/64` admission are **PLANNED**. The runtime address ABI is IPv4-only.

`QuicServerEndpoint` now owns a separately bounded connection table, up to four
issued connection IDs per connection, the validated peer and lifecycle phase,
and independent bounded authenticated Initial, Handshake, and Application packet
histories. Focused Linux and Wine/Windows tests cover quota refusal, packet-space
isolation, validated-peer updates, and removal of every issued CID. This is an
endpoint state-machine foundation; it is not public-network, soak, native
Windows, or production-reactor evidence.

Authenticated ACK ranges are revalidated with checked arithmetic immediately
before recovery lookup, even though frame decoding performs the same semantic
validation. Oversized gap arithmetic, first-range underflow, gap underflow, and
range underflow return typed connection-local errors before sent-packet or
recovery state changes.
