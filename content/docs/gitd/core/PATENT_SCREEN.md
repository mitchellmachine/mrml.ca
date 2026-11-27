# Gitd core branch patent screen

This is technical screening, not legal advice, patent clearance, or an
infringement conclusion.

The implemented change is limited to conventional bounded identifier
validation, typed generations, streaming traits, classified errors, and opaque
verified-transaction types. Patent review: NOT_TRIGGERED for that boundary.

The bounded dynamic-Huffman level-9 LZ77/DEFLATE encoder triggers the repository
process. Patent review: TRIGGERED. The implementation follows only RFC 1951's
general hash-chain compressor shape: a 32 KiB window, a fixed 4,096-candidate
search ceiling, deterministic canonical dynamic codes, and standard
length/distance symbols. It
does not copy an implementation or add specialized parsing, hardware, media,
dictionary, or protocol-specific compression mechanisms.

The technical screen checked the IETF disclosure search for RFC 1951 on
2026-09-01; it reported no disclosures submitted directly against RFC 1951 or
its predecessor draft. RFC 1951 itself warns that LZ77 variations may be
patented and describes its general algorithm as known not to be patented per
se. Those statements are discovery context, not authoritative Canadian status
and not a royalty-free grant. No CIPO number was identified by this bounded
mechanism search, and no patent-clearance, non-infringement, validity, or legal
conclusion is made. Search confidence is LOW, technical-overlap confidence is
MEDIUM for the exact general RFC mechanism, and legal-status confidence is LOW.

## 2026-09-01 preliminary Canadian review

Classification: `PATENT_REVIEW_PRELIMINARY_CLEAR_WITH_GUARDRAILS`.

A user-supplied Canadian landscape and preliminary independent-claim review
covered standards-conforming DEFLATE/zlib level-9 compression, deterministic
bounded-window Git delta selection, immutable exact-key pack representation
caching, and reachability-based repack/compaction. It reported no in-force
Canadian claim facially covering the constrained implementation. This permits
implementation within the guardrails below; it is not a formal freedom-to-
operate opinion, patent-clearance claim, or substitute for production review by
qualified Canadian patent counsel.

CA 2,843,922 was specifically screened. Its independent claims were reported to
require a distributed deduplication cluster using block fingerprints, stream
sketches, routing sketches to physical nodes, storage-address responses, and
distributed sketch/address updates. MRML gitd must not implement those
mechanisms. Related Canadian applications CA 2,799,976, CA 2,501,548, and
CA 2,947,158 were reported abandoned. CIPO's public database was experiencing a
documented service disruption when this record was refreshed, so this branch
records the supplied review without representing that Codex independently
reperformed counsel-grade status verification.

The implementation guardrails are normative:

- use fixed standards-conforming codecs and parameters;
- do not adaptively select codecs or workload profiles;
- do not use sketches, MinHash, locality signatures, or similarity caches for
  candidate search;
- do not rank candidates by cache/storage location or compression state;
- do not map sketches to distributed nodes or storage addresses; and
- do not implement file-recipe/chunk-index delta-store garbage collection.

Within those restrictions, dynamic-Huffman construction, bounded direct-window
delta selection, immutable exact-key pack caching, and reachability-based
compaction are `TRIGGERED` and authorized for implementation under this
preliminary screen. The shared review log must be updated during integration;
Agent A's file boundary does not authorize editing it here. Follow
`docs/patents/README.md`.

The OFS/REF validation path decodes Git's standard copy/insert form,
follows exact offsets or full object IDs, and enforces work and depth limits. It
does not perform candidate discovery. The encoder's selector directly examines
only same-kind objects in the preceding fixed 250-object window, constructs
standard Git deltas with fixed hash-chain bounds, caps aggregate search work,
and ranks candidates only by raw delta length then complete object ID. It emits
OFS deltas with a maximum chain depth of 50. It has no similarity cache, sketch,
location/compression-state ranking, distributed mapping, or recipe/chunk-index
GC. Patent review: `TRIGGERED`, implemented within the preliminary guardrails
above. Cross-pack recomputation must preserve the same restrictions.

The exact-key cache retains only caller-requested canonical representations and
looks them up by the full format/wants/haves/generation/profile/encoder tuple.
The compaction planner selects an authenticated reachability set at one exact
generation and sorts by complete object ID. Neither mechanism discovers
similarity, ranks by cache or storage location, maps work to distributed nodes,
or manages file recipes/chunk indexes. Patent review: `TRIGGERED`, implemented
within the preliminary guardrails. Hosted-Linux immutable cache persistence and
generation-bound compaction activation use only conventional exact-key files,
fsync, rename, and retained-old-generation recovery.
