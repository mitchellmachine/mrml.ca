# Cache and Zstandard profile

The L1 cache stores ready-to-send identity and Zstandard representations with
separate ETags. Hits do not recompress. Negotiation honors `zstd;q=0`, varies on
`Accept-Encoding`, and supports representation-specific `If-None-Match`.

`PersistentRepresentationCache` defines the L2 authority boundary over an
injected `CacheStore`. Domain-separated SHA-256 storage keys, exact record
lengths, independent body digests, Zstandard decode validation, atomic-write
delegation, and corruption removal are implemented. L2 loads reuse the stored
ready-to-send compressed bytes rather than recompressing.
`RepresentationSingleFlight` is integrated into the HTTP server. It bounds
active generations, elects one generator per exact cache key, suppresses
duplicate work, and rejects stale or repeated completion permits.

Representation lookup keys are length-delimited, versioned, then reduced to a
domain-labeled SHA-256 digest. They independently bind repository identity,
object format, repository generation, page kind, complete route/path and
revision context, exact object ID, Markdown/renderer/template/theme/sanitizer/
highlighter/encoding versions, trust generation, revocation generation,
verifier version, and hybrid-profile version. Trust and revocation are never
combined arithmetically; the regression covers the former XOR-collision pair
`(1,2)` and `(2,1)`. Static pages use the same versioned renderer/template/theme/
encoding namespace.

On Linux, `LinuxFilesystemCacheStore` provides the concrete L2 adapter. It uses
content-addressed names, refuses final-component symlinks when reading, bounds
records before allocation, writes through exclusive temporary files, syncs the
file, atomically renames it, syncs the containing directory, and prunes regular
cache records to configured entry and byte quotas. Cache files remain
disposable; deletion is a miss and a later write recreates the root without
changing authoritative results. Construction removes bounded regular `.tmp-`
records left by interrupted writes while refusing directory and symlink targets.
Focused tests exercise round trips, quota eviction, interrupted-write cleanup,
root deletion/recreation, and absence of leftover temporary files. Filesystem
crash injection and production-disk exhaustion have not been exercised.

HTTP selects the versioned deterministic `BoundedRfc8878V2` software profile,
not a level-22-equivalence profile. It constructs bounded forward and RFC
reverse bitstreams, serializes RFC normalized counts, inverts FSE decode tables
into deterministic compression paths, encodes three interleaved predefined FSE
sequence states, and uses a fixed-memory match finder. Each block chooses raw,
RLE, or a supported compressed candidate by encoded payload size. Predefined
FSE sequence tables are one candidate, not the only compressed encoding.
The persistent-record magic and compressed-representation ETag domain are
versioned with that selection. Linux and Windows/Wine focused suites exercise
determinism, compressed selection, decode round trips, cache hits, and all HTTP
routes.

RLE, FSE-compressed, and repeat sequence-table selection are implemented with
deterministic encoded-bit-cost comparison. Canonical Huffman construction is
bounded to the RFC 11-bit maximum; direct weights and Huffman literal streams
participate in encoded-size selection, and every compressed candidate is decoded
and byte-compared before publication. FSE-compressed Huffman weights,
four-stream literals, and every RFC literal-header width are implemented. The
exact configured Zstandard 1.5.7 CLI oracle decodes ordinary and independently
assembled four-stream MRML frames. Deterministic compressible and incompressible
corpus ceilings are tested. Broad level-22 comparison with CPU and peak-memory
measurements remains an open evidence gate; this bounded greedy profile is not
claimed equivalent to level 22. Git pack bodies remain identity encoded at HTTP
representation level unless an explicit measured policy says otherwise.

Patent review: **TRIGGERED**, **REVIEW_COMPLETED**, **CONDITIONAL_PROCEED**, and
**IMPLEMENTATION_GATE_SATISFIED** for the bounded software-only RFC 8878 profile.
This is technical screening, not patent clearance or a freedom-to-operate
conclusion. The independent external security-review gate remains open. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
