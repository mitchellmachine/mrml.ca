# Git pack storage

Status: **PARTIALLY IMPLEMENTED**. Existing bounded whole-buffer compatibility
parsing, a constant-memory file authentication scan, and the first-party
authenticated pack-index v2 module are implemented.

The pack encoder uses a deterministic first-party zlib profile. Objects through
1 MiB use one dynamic-Huffman DEFLATE block and bounded LZ77 matching; larger
objects use linear-time RFC 1951 stored blocks. The fixed public-length
threshold prevents adversarial or low-entropy hash-chain collisions from
monopolizing a worker and never inspects content-derived compressibility. The
dynamic profile retains a 32 KiB window, inspects no more than 4,096 candidates
at each input position, and emits matches no longer than 258 bytes. Empty,
incompressible, repetitive, window-boundary, and above-threshold inputs
round-trip through the first-party inflater on Linux. The large-object tradeoff
is explicitly greater wire/storage size for compressible inputs; object bytes,
object IDs, and decoding of earlier packs are unchanged. A controlled Python
zlib probe also decompressed a loose object emitted by the first-party encoder.
Upstream Git 2.55.0
`index-pack --stdin --strict -v` accepted a generated two-object pack containing
the dynamic streams and an OFS delta and resolved that delta. These are
controlled interoperability oracles, not runtime dependencies.

A hosted-Linux functional concurrency test opens the same SHA-256 repository in
six simultaneous process-local workers and requires every worker to generate a
byte-identical reachable fetch pack. This exercises deterministic concurrent
read/generation behavior only. It does not establish multi-process service
isolation, peak memory, foreground latency under compaction, or production
throughput.

The pack encoder now applies deterministic same-kind delta selection over the
exact preceding 250-object window. It constructs Git copy/insert programs with
fixed hash-chain bounds, ranks candidates by raw delta length then complete
object ID, caps aggregate comparison work, emits OFS deltas, and never exceeds
depth 50. Budget exhaustion deterministically falls back to a whole-object
representation. No lower-compression stream is reused. Cross-pack canonical
recomputation remains part of the compactor gate.

Receive must stream into an isolated quarantine under checked byte, object,
expanded-size, delta, memory, and work limits. Whole-repository repacking is not
part of push latency. Immutable arrival packs are activated first; a bounded
low-priority compactor later creates and verifies canonical cold packs against
one consistent repository generation.

The receive path now performs an initial sequential `scan_pack_file` pass over
the reopened regular quarantine file. It snapshots and bounds the length,
incrementally hashes at most 64 KiB at a time, validates `PACK`, v2/v3, the
nonzero bounded object count, and the exact SHA-1 or SHA-256 trailer, and charges
one work unit per admitted byte. The trailer is excluded from the pack hash and
mixed-width IDs fail closed. This detects truncation, replacement, count-limit,
and checksum failure before the compatibility parser allocates the pack. Entry
inflation and delta resolution are not yet streaming, so this pass alone does
not satisfy the production receive memory gate.

For direct commit/tree/blob/tag entries, the second pass is now file-backed as
well: it parses headers bytewise, decodes zlib through a one-byte reader boundary
with an exact configured output ceiling, retains at most one object, charges
compressed and expanded bytes as work, hashes the canonical loose-object form,
and emits exact CRC/offset/index metadata. Installed-directory verification uses
the same path instead of reloading the pack. The validator now defers OFS and
REF deltas as bounded metadata and resolves them through a dependency-indexed
ready queue rather than repeatedly scanning all unresolved deltas and resolved
objects. A static sorted offset table, bounded exact object-ID map, and sorted
reverse-dependency tables release a delta only when its exact base becomes
available. Each dependency is initially examined once and can be released once;
map lookup, dependency insertion, and release consume the pack work budget.
Duplicate resolved object IDs fail closed. OFS bases must name an earlier exact pack offset.
REF bases may appear later or come from a caller-supplied exact-generation view;
external bases are re-hashed by full object ID and copied into the transaction's
private scratch set so reopen verification does not depend on mutable ambient
state. Missing, forged, cyclic/no-progress, and depth-greater-than-50 chains
fail closed.

Delta programs, bases, and results are each capped by the individual-object
limit. Aggregate reconstructed bytes, instructions, and copied output consume
explicit limits. The whole pack is never allocated, although one base, one
delta program, and one result may be resident during a resolution step.

Each authenticated direct object is now written as a new, fsynced scratch object
under the transaction-derived quarantine directory using its recomputed full ID
as the filename and an internal type byte. Duplicate IDs cannot overwrite an
existing scratch object. The crate-private resolver reopens a regular file,
bounds its size, decodes the type, recomputes the canonical Git object ID, and
returns bytes only to the protected receive compositor. These scratch objects
remain outside normal repository reads and move only with the immutable arrival
transaction directory.

`pack_index.rs` constructs and parses Git pack index v2 for both SHA-1
compatibility and SHA-256 repositories. It validates monotonic fanout tables,
strictly sorted full object IDs, duplicates, CRC fields, 32-bit and canonical
large-offset indirection, exact pack-checksum binding, the trailing index
checksum, object-count limits, truncation, and trailing data. Construction uses
deterministic allocation-free heapsort after one bounded entry copy and emits
the exact repository hash width. Immutable arrival-pack installation now writes
and reopens this index together with its authenticated pack. The index is not
yet connected to the normal active pack-set read path or canonical compaction
generation.

The pack validation pass now retains each object's exact packed start/end
span, computes the Git index CRC-32 over those original packed bytes, and
returns `PackIndexEntry` values alongside fully authenticated objects. The
same pass therefore supplies object IDs, offsets, CRCs, and the authenticated
pack trailer needed by the first-party v2 index builder without a second
untrusted parse. A SHA-256 two-object test builds and reparses the index and
resolves both IDs. Independent `git index-pack` byte comparison remains open.

Hosted Linux now has an isolated `ArrivalPackStore`. It exact-matches the
transaction's reserved incoming byte/object counts, authenticates and expands
the pack, derives and reparses its v2 index, writes both as new regular files,
fsyncs each file and the staging directory, and then installs the pair with one
transaction-directory rename followed by fsync of both arrival and quarantine
parents. Post-stage and post-install verification reopens regular files without
following final symlinks, revalidates pack checksum/object IDs and every index
ID/CRC/offset/trailer binding, and rejects re-use of a transaction ID. The
arrival directory is outside normal active reads until ref generation
activation. Windows remains fail-closed pending directory flush support.

Protected receive now supplies thin REF bases only through the repository view
whose object format and exact active ref/repository generation were checked
before the request. The active ref state is re-read after the body and must
still byte-match before any base lookup; each returned base is independently
size-bounded and re-hashed before it enters transaction-private scratch. The
later durable activation still performs its immediate generation/ref re-read.
A hosted-Linux test now starts two complete receive compositions from the same
authenticated active generation and synchronizes them only after both have
entered their pack bodies. Each body contains one SHA-256 REF delta whose base
commit is absent from the baseline repository and available only through the
selected arrival manifest. Both validate against that exact base, but exactly
one activates generation 8; the other fails closed as stale, storage-failed, or
uncertain according to how far it progressed, and its candidate remains
unselected. This is process-local body-overlap and durable-activation
contention evidence, not multiprocess, power-loss, or production-load evidence.
Thin-pack capability advertisement remains disabled pending production edge
integration and broader multiprocess/fault evidence.

The immutable cache core uses a canonical full key containing object format,
exact ordered wants and haves, repository generation, pack-profile version, and
encoder version. Its SHA-256 digest is only a rejection accelerator: a hit also
requires full-key equality, and cached representation bytes are rehashed on
every lookup. Inserts cannot overwrite or reinsert a key. This in-memory core
is paired on Linux with a canonical digest-named immutable file store. Each
record contains and rechecks the full key, representation length and digest,
and a terminal whole-record digest; insertion uses a create-new per-key writer
claim and create-new representation, fsyncs the file and directory, then
reopens and verifies before success. Concurrent same-key writers never consume
a partial record: one immutable writer wins and the other canonical producers
retain their independently generated bytes. A crash-stale writer claim causes
a safe miss and requires later administrative recovery rather than guessing.
Regular-file opens reject final symlinks. Other targets fail closed until
directory synchronization is available.

The repository view's complete-vector durable cache is retained only in
`cfg(test)` builds for compatibility tests. Production construction does not
contain the cache field, cache setter, precomputation entry points, whole-object
collection, or complete-pack encoding/response branch; its public capability
constant is false and the Gitd production build exercises that compile-time
configuration. Production protocol-v2 fetch therefore always uses
`PackStreamEncoder` with fixed-size writes. A future production cache must be a
bounded file-backed streaming design rather than re-enabling these test-only
vectors.

The test-only repository view optionally populates and consumes this durable cache
for protocol-v2 fetch and exposes the same path for bounded precomputation.
Every lookup binds the object format, exact ordered wants and haves, active
repository generation, fixed pack-profile version, and encoder version. Wants
must still be advertised refs. A miss is generated only from the exact selected
repository view, the complete active state is re-read before insertion and
again before response, and a later repository generation necessarily misses.
Focused hosted-Linux tests cover durable reopen, full-key and stale-generation
misses, immutable insertion, tampering, and six simultaneous same-key writers.
Bounded precomputation selects the exact active default-branch tip when born,
every exact `refs/tags/` tip (annotated or lightweight), and caller-supplied
popular full ref names. Caller names must resolve in the active state; names
identify candidates but do not authorize objects. The combined input is capped
at 4,096 refs, sorted canonically, and deduplicated first by name and then by
complete object ID before one single-want canonical pack is populated per tip.
Selection never uses storage location, compression state, workload profiles,
sketches, similarity search, or adaptive ranking. The active state is re-read
through the existing exact-generation cache path before every insertion and on
completion.
Production hit-rate, eviction/retention operations, crash-stale-claim recovery,
and native-Windows durability evidence remain open.

The reachability compaction core accepts an exact repository/pack-generation
snapshot and caller-authenticated reachable objects, sorts only by complete
object ID, applies the fixed level-9/window-250/depth-50 encoder, reparses the
result, and requires exact object equality. It pauses for active pushes or core
pressure, rejects estimates over the 4 GiB memory budget, preserves 40 GiB free
space after the estimated output, and advances exactly one pack generation.
Its journal admits only planned, staged, stage-synced, activated, and retired
transitions and classifies crashes without treating an unactivated stage as
authoritative.

The Linux compaction compositor reparses the generated pack, rebuilds and
reopens its v2 index, writes exact scratch objects/pack/index into a new
transaction directory, fsyncs files and directories, installs by directory
rename, and derives a canonical one-pack `MRPKSET1`. Under the same activation
lock used by pushes, it re-reads the selected generations, persists the
manifest, fsyncs and renames `MRREFS02`, and reopens both exact state and
manifest. Ref, trust, and revocation authority is preserved byte-for-byte while
repository and pack generations advance once. Old arrivals and the old manifest
remain retained after activation; a preactivation or stale-generation failure
leaves the old state selected. This is hosted Linux filesystem evidence, not
process-kill, power-loss, native-Windows, or physical-storage evidence.

Dynamic-Huffman level-9 encoding, direct-window OFS delta selection, exact-key
cache semantics, and generation-safe durable Linux compaction activation are implemented.
No outer Zstandard layer belongs in Git pack storage.

Active arrival-pack reads are authorized only by the exact `MRPKSET1` digest in
`MRREFS02`; directory entries and transaction-derived names never grant
membership. On startup or an exact selected-generation transition, the
repository view authenticates the selected manifest, fully validates each
immutable pack/index pair once, checks its declared sizes, checksums, counts,
work, IDs, format, and generation, and builds a bounded ordered object-ID to
transaction locator. Publication is monotonic and atomic at the snapshot
boundary; a changed digest at the same generation and generation rollback fail
closed. Reads from an unchanged snapshot perform one indexed lookup, open only
the exact scratch object, and independently recompute its canonical Git object
ID. A missing selected object, changed content, or stale generation is not
allowed to fall back to the baseline database. Unselected installed arrivals
remain invisible, and operations recheck the complete active-ref state before
return. Counters expose complete validations, index parses, object lookups,
object reads, bytes read, and object hash checks; focused tests require the
first two to remain constant while reads grow.

`MRPKSET1` now implements the non-authoritative manifest prerequisite. Its
private validated construction consumes authenticated index summaries and binds
repository identity, repository and pack generations, object format, strictly
ordered unique transaction IDs, nonzero exact counts, pack/index checksums,
pack/index/work quantities, and each index's strictly ordered object IDs.
Aggregate pack, object, byte, index-byte, work, and encoded-size limits are
checked. Cross-pack duplicate object IDs are rejected as ambiguous. The parser
checks its terminal SHA-256 integrity digest, exact widths, truncation, trailing
data, canonical order, and byte-exact re-encoding.

`MRREFS02` carries the exact SHA-256 digest of its selected `MRPKSET1`, and the
checked pack-set transition advances the repository generation and pack
generation together only when repository identity, object format, and both
next generations match. `ActiveRefFile::activate_with_pack_set` writes and
fsyncs the immutable content-addressed manifest before replacing the active
record; an interrupted pre-selection write is inert. Selected-manifest reads
open only that digest-derived regular file and recheck the digest, repository,
format, and generations. A manifest not selected by the active record grants
no read authority.

The hosted-Linux durable receive compositor now reopens the installed pack and
index, derives an authenticated summary, extends the previously selected
manifest without duplicate objects, and calls this transition. An exact empty
manifest represents a repository with no arrival packs and gives bootstrap a
real digest instead of a sentinel. The end-to-end receive test reopens the
selected next generation and its exact transaction/object membership.

The receive store can now resolve an exact object from the selected arrival set:
it uses the authenticated generation snapshot's exact locator, opens only the
transaction's bounded scratch object, and rehashes its Git identity. Thin-pack validation consults this selected view
before the separately authenticated baseline repository, so sequential receives
can use prior active arrivals without directory scanning. Protected-history
traversal uses the same selected view, and the end-to-end receive test prepares
a second commit whose parent exists only in the first selected arrival. The
general repository view and upload-pack composition use the same authority and
have focused selected-versus-unselected coverage. This membership authority
remains independent of the guarded delta selector and compaction policy.
