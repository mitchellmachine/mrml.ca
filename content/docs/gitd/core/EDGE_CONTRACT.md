# Gitd edge contract

Status: **PARTIALLY IMPLEMENTED** as a transport-neutral Rust API with a
hosted-filesystem repository-view component; no complete production backend is
claimed.

The public API is exported from `mrml_git` and centered on
`GitdCoreBackend`. It provides repository generation and summary queries, exact
ref resolution, paginated commit/tree/blob reads, generation-bound verification
summaries, and a bounded streaming Smart Git call.

Security-sensitive values use validated types:

- `RepositoryIdentity` is exactly `owner/name`, bounded to 257 ASCII bytes;
- `FullRefName` is a bounded full `refs/...` name and rejects Git-dangerous
  sequences, control bytes, backslashes, and `.lock` aliases;
- `RepositoryPath` is a bounded relative tree path and rejects absolute paths,
  empty components, `.`, `..`, NUL, non-ASCII, and backslashes;
- repository, trust, and revocation generations are distinct types; and
- verified ref types expose only getters and have private fields.

`build_verified_fast_forward_transaction` is the only public constructor for
the current protected fast-forward transaction profile. It accepts at most 32
distinct full refs and requires one exact `VerifiedCommitRange` for every
`expected_old -> proposed_new` pair. Zero IDs, mixed formats, missing ranges,
creates, deletes, and history replacements fail closed. Creation, deletion, and
replacement will require separate policy-specific typestate builders rather
than optional IDs being interpreted as ambient authority.

`BoundedRead` and `BoundedWrite` expose remaining capacity. `WorkBudget`
separately limits input, output, memory, and work units. Implementations must
enforce the smaller of transport and backend limits and use checked arithmetic.

`ReceivePackCore` is the concrete receive-side composition boundary for an
injected edge transport. Its exact request envelope binds repository
generation, quarantine/history limits, transaction identity, admitted ordinary
free space, and work budget. Verification-only `ProtectedCommitVerifier` and
audit-receipt authorities are injected separately. Its standard and
policy-classified operations parse the request, reserve before the body,
quarantine and authenticate objects, verify every introduced commit, durably
activate the opaque verified transaction, append the authenticated receipt,
and emit report-status-v2. It owns no signing key and exposes no raw protected-
ref mutation.

`FilesystemRepositoryView` binds one validated `RepositoryIdentity`, one
canonical first-party object store, one canonical `ActiveRefFile`, and an
optional read-only `VerificationSummaryStore`. Evidence enters that store only
by conversion from an opaque `VerifiedCommitProof` or generalized
`VerifiedGitObjectProof`; repository contents, object names, signatures, and
first-party status cannot manufacture a summary. Generalized evidence covers
exact verified commits, annotated tags, source manifests, source locks, and
build receipts under their distinct purposes and required Git object kinds. The
store is bounded to 5,000 strictly ordered exact records and carries repository
identity plus repository, trust, and revocation generations.

`verification_summary` exact-matches the requested repository and active
trust/revocation generations, validates that the requested object exists under
the active object format, then requires evidence for that exact object and
active repository generation. It re-reads repository generation before return.
Missing evidence returns signature failure, stale generations return a typed
stale result, and cross-repository requests remain unauthorized. The structured
hybrid result is a projection of previously verified evidence, not a verifier,
policy decision, signing path, or source of authority.

`read_verified_metadata` resolves a caller-selected path only inside an exact
Git tree and accepts only the `SourceManifest`, `SourceLock`, or `BuildReceipt`
purpose. It authenticates the target as a bounded blob, requires an exact
generation-bound hybrid summary for the same blob and purpose, and returns its
tree, path, object ID, size, and all authority generations. This avoids
inventing ambient host paths or canonical filenames where the package/release
format has not defined one; unsigned or purpose-substituted blobs remain data
and fail with a signature error.

The view otherwise
implements bounded repository summaries, full-ref resolution, first-parent
commit pages, tree-path pages, and exact blob reads. Every page is tagged with
the active repository generation, and the component re-reads that generation
after object access; concurrent activation returns `StaleGeneration` instead
of a mixed-generation result. Cross-repository identities and object-format
mismatches fail authorization. The hosted-Linux test exercises SHA-256 commit,
tree, and truncated blob reads without invoking an external Git executable.
Tree and blob reads also expose backward-compatible `*_at` methods whose
checked offsets resume an exact tree enumeration or blob byte range; returned
continuations remain bound to the rechecked repository generation. Invalid or
overflowing offsets fail closed. Commit pages have a companion exact-details
query carrying the authenticated tree, complete bounded parent list, author,
and message.

Annotated tags have a separate bounded page/details API. Each result carries
the active repository generation, full `refs/tags/...` name, exact tag object,
exact target object and object type, tagger, and message. Parsing requires the
canonical `object`, `type`, `tag`, and `tagger` header sequence with one value
each, exact object-format width, and an authenticated target whose actual kind
matches the declared type. Duplicate, reordered, malformed, foreign-width, or
type-substituted headers fail closed. Lightweight tag refs are skipped by the
annotated listing and rejected by annotated details; they are never relabeled
as signed or annotated objects. Checked offsets and entry/byte limits bound
pagination, and repository generation is re-read before either page or details
return.

README resolution checks only `README.md`, `README.txt`,
`README.rst`, then `README`, in that order, inside the exact Git tree and
returns a generation-tagged blob descriptor. An immutable-pack descriptor
validates the complete exact commit closure before returning the repository
generation, object format, exact commit ID, pack profile version, and encoder
version. Those fields form the cache/production request identity. An optional
durable cache now precomputes, populates, and serves exact ordered
wants/haves/generation/profile/encoder representations, while later generations
miss by construction. This component does not yet implement release
descriptors, durable verification-evidence loading, or the complete upload-pack
profile, so it is not yet a complete production `GitdCoreBackend`.

`repository_events_after` provides bounded cache-invalidation events across
the repository, trust, revocation, and pack generations. A cursor ahead of any
authoritative generation fails stale; an unchanged cursor returns no event; a
changed cursor returns one exact previous-to-current snapshot and a new cursor.
The method rechecks repository generation before return. This is deliberately
a coalesced state-change event, not an invented historical audit log; durable
per-transition audit history remains owned by the authenticated receipt store.

The shared pkt-line codec accepts lowercase hexadecimal canonical framing,
streams fragmented reads and writes, supports flush/delimiter/response-end
control packets, and caps total packet length at 65,520 bytes. Input, output,
and work budgets are charged for the four-byte header and payload before the
operation can continue. Invalid lengths, noncanonical hexadecimal, truncation,
and exhausted limits fail without invoking repository mutation.

The protocol-v2 core emits an exact capability advertisement for `ls-refs`,
the currently implemented `fetch=ofs-delta` subset, and the selected SHA-1 or SHA-256
object format. Its bounded request parser accepts `ls-refs` options and exact-
width fetch wants/haves for that format. Duplicate flags, malformed client
capabilities, unknown commands, and unsupported shallow, deepen, filter,
want-ref, packfile-URI, and future arguments fail closed. Parser coverage is
separate from the bounded clone backend described below.

`FilesystemRepositoryView` now implements a bounded protocol-v2 fetch subset.
When configured with the arrival store, it reads only packs named by the exact
active `MRPKSET1` manifest; installed but unselected arrivals are invisible.
Object queries and fetch traversal share this selected view, and the complete
active state is re-read before success so ref, trust, revocation, repository,
pack, default-branch, or manifest changes make the operation stale.
`ls-refs` reads only the exact active ref generation, applies bounded byte
prefixes, emits the default `HEAD` symref or an explicitly requested unborn
default, performs bounded annotated-tag peeling when requested, and rechecks the
generation before its terminal flush. Fetch accepts one or more advertised
active tips, requires `done`, and subtracts the complete authenticated object
closure of each bounded `have`. Unknown or malformed have objects fail closed.
It rejects thin packs and `sideband-all`, generates the remaining SHA-1 or
SHA-256 closure using first-party code, rechecks the generation before output, and
preflights the complete framed response before emitting the standard `packfile`
section with mandatory band-1 framing. The golden
hosted-Linux test reparses that emitted pack and finds the requested commit.
Arbitrary non-tip reachable wants, ACK negotiation rounds, thin-pack
generation, and streaming generation without a whole-pack memory allocation
remain open, so the omitted features are not advertised. Receive activation is
provided separately by `ReceivePackCore` with injected verification and receipt
authorities.

The receive-pack command boundary parses at most 32 exact-width SHA-1 or
SHA-256 old/new IDs and validated full ref names, requires `report-status-v2`
and `atomic`, rejects duplicate refs and unadvertised capabilities, and stops at
the command flush without consuming the pack body. SHA-256 commands must bind
`object-format=sha256`. A zero new ID is represented only as a deletion
candidate and is rejected unless the backend explicitly enabled deletion
candidates when it advertised `delete-refs`; the client cannot grant that
authority by echoing the server-only capability. Authorization still belongs
to a separate policy-specific verified transaction builder. The
parser cannot activate refs by itself. `prepare_protected_receive` composes it
with bounded quarantine ingestion, authenticated pack/index and thin-base
validation, exact introduced-history proof verification, and the private
verified-ref transaction. `finish_prepared_protected_receive` consumes that
opaque preparation, activates only through the authenticated-receipt store,
and emits the negotiated ordered result.

The bounded report-status-v2 writer emits the standard `unpack`, ordered `ok`
or `ng`, and flush packets. Since MRML does not use `proc-receive` rewriting,
it emits no option lines. Status names must exactly match every requested ref
in order; an atomic transaction can report all success or all failure, never a
mixed result. Error text is limited to 512 printable ASCII bytes and cannot
inject framing. When `side-band-64k` was selected, the complete inner report is
carried on band 1 in bounded outer packets followed by an outer flush. Golden
tests round-trip both plain and side-band output through the existing
first-party client parser. The hosted-Linux protected receive test covers
command/body preparation through authenticated-receipt activation and success
framing. If framing fails after activation, the compositor returns
`UncertainCommit` instead of suggesting retry safety. Production construction
must still supply the exact repository capability, detached-proof verifier,
receipt authority, storage limits, and free-space observation; none are
accepted from untrusted edge input.

Errors distinguish malformed input/identifiers/refs/paths, authorization,
object validation, ancestry, signature, policy, resources, storage, stale
generation, unsupported behavior, and uncertain durable outcomes. No private
key material is accepted by this API.

Golden validation examples:

```text
RepositoryIdentity  mitchellrenouf/mrml  -> accept
RepositoryIdentity  ../mrml              -> malformed identifier
FullRefName          refs/heads/main      -> accept
FullRefName          refs/heads/../main   -> malformed ref
RepositoryPath       src/lib.rs           -> accept
RepositoryPath       src/../secret        -> malformed path
```

The edge must never open repository files. It resolves application routes to a
repository capability and invokes this interface. Protocol capabilities must
be advertised only by a backend that completely implements them.
