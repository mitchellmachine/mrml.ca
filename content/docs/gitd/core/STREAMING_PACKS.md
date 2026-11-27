# Streaming pack production

Status: **PARTIALLY IMPLEMENTED**.

The Git library can write a no-delta pack directly to a caller-owned output
sink. Pack headers, stored-DEFLATE blocks, Adler-32 values, and the Git pack
trailer are produced incrementally. Each content write is at most 65,535 bytes,
and the SHA-1 or SHA-256 trailer authenticates the exact bytes accepted by the
sink. Object identifiers are recomputed before any object is emitted, so a
mixed-format or mislabeled object fails closed.

The uncached protocol-v2 upload path now retains only bounded reachable object
identities, reloads one authenticated object at a time, and writes each encoder
fragment as a sideband packet through the caller's `BoundedWrite`. The protocol
output and work budgets therefore apply at every network write, and an object
larger than the per-request memory budget is rejected. Memory remains linear in
the number of reachable object identifiers plus the largest individual object;
it is not independent of object count.

The immutable representation-cache path still uses the existing in-memory
delta encoder because cache insertion authenticates one canonical complete
representation. Delta selection is deliberately absent from the uncached
bounded profile. No constant-memory claim applies to cached pack production.

Focused evidence on hosted Linux:

- `./target/debug/mrml test org.mrml.tool.git --target linux`: 194 library and
  3 CLI tests passed, including a 200,000-byte SHA-256 object streamed in fixed
  writes, declared-count failure cases, and an uncached protocol-v2 fetch whose
  sideband pack reparses to the expected commit, tree, and blob graph.

Patent review: **NOT_TRIGGERED**. This increment composes the conventional Git
pack version 2 format, stored DEFLATE blocks, Adler-32, and existing SHA-1/SHA-256
trailer rules without adding a new compression, transport, or scheduling
mechanism. See [`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
