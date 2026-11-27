# Gitd core architecture

Status: **PARTIALLY IMPLEMENTED**.

The first-party Git edge is a transport adapter, not a repository authority.
It passes validated identifiers and bounded streams to `GitdCoreBackend`; it
does not open repository paths, manufacture verified ref updates, or receive
private keys. Repository names identify an owner-selected repository. An
independent capability held by the eventual service authorizes access.

The intended dependency direction is:

```text
HTTP/3 or local transport edge
  -> gitd_core (validation, generations, budgets, typed results)
  -> smart protocol / repository view
  -> quarantine and verification
  -> durable object installation
  -> atomic ref activation
  -> audit receipt and recovery state
```

Object parsing, signature/policy verification, and ref activation remain
separate. No data obtained from Git, a manifest, a signature, or a repository
name grants authority. Reads report an exact repository generation and exact
object IDs. Protected mutation will require a privately constructed
`VerifiedRefTransaction`.

The transport-neutral boundary, trust-policy verification, pack indexing,
quarantine admission/lifecycle, ordered durable-receive coordinator, and a
generation-stable filesystem repository view are implemented. The coordinator
accepts only a private `VerifiedRefTransaction` and delegates concrete
fsync/atomic primitives through a narrow storage trait. Linux file-backed
arrival packs, journals, ref activation, signed receipt storage, and exact-state
recovery classification have focused tests. Protocol-v2 `ls-refs`, bounded
wants/haves fetch construction, receive command parsing, and report framing are
first-party core operations. Production receive-edge composition, active
pack-set reads, native-Windows directory durability, and canonical compaction
remain open and fail closed.

The canonical bounded `MRPKSET1` record represents that exact ordered
membership and rejects duplicate object identities. `MRREFS02` binds its exact
digest while advancing repository and pack generations together; parsing or
possessing any other manifest grants no read authority. The active-ref store
durably writes and reopens the immutable selected manifest around that atomic
transition. The hosted-Linux receive store now constructs the cumulative next
manifest from reauthenticated installed indexes and performs that transition.
The receive store resolves selected arrival objects only after reauthenticating
the exact manifest entry and Git object identity, and uses that view for later
thin receives. General repository-view/upload-pack composition remains an
explicit incomplete gate.

Protected receive also has a policy-classified path for legacy transition
history. It proves checkpoint-to-cutover ancestry, admits opaque complete-v4-
fingerprint evidence only on the checkpoint ancestry, and requires hybrid
evidence everywhere else. Callers without exact canonical policy state stay on
the hybrid-only fail-closed path.

Repository state now also has a canonical single-record active-ref model with
distinct repository, trust, revocation, and pack generations. The pure update
boundary consumes only verified ref typestate and produces one next generation.
The Linux filesystem activation path reopens the exact old state under an
exclusive lock, writes and fsyncs a complete replacement, renames it, fsyncs
the directory, and reopens the new state. Process-local concurrency is tested;
process-kill, power-loss, physical-storage, and native-Windows evidence remain
open.

Complexity score for the eventual subsystem: high security sensitivity, high
failure-recovery cost, and multiple independently useful components. The split
above is therefore required; it is not permission to place these mechanisms in
the kernel or grant first-party code hidden authority.

Patent review: NOT_TRIGGERED for the implemented identifier validation and
trait boundary. Compression and delta-selection work is separately triggered
and remains paused as described in [PATENT_SCREEN.md](PATENT_SCREEN.md).
