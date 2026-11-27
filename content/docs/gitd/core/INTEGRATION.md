# Gitd core integration delta

Base: `cf1f75755e6961737d6c1972959aac9a8dcea061ec26b7f7e43b20ab261868c2`.

## Baseline reproduction

The prompt's inspected-state claims were reproduced against that exact base
before relying on them:

- `CONFIRMED`: `packages/tools/git` was a `#![no_std]` first-party library and
  CLI with SHA-1/SHA-256 object code, index/worktree operations, pack parsing,
  SSH client fetch/push, and commit/tag signing. The baseline `lib.rs`,
  `remote.rs`, `repository.rs`, and their package tests supplied the evidence.
- `CONFIRMED`: baseline `pack.rs::encode_pack_with_format` called its local
  `deflate_stored` writer for every object. The current branch replaces that
  upload-pack encoder path with deterministic bounded LZ77 and canonical
  dynamic-Huffman level-9 DEFLATE. A separate fixed-Huffman entry point uses
  the same bounded search profile for byte-exact interoperability coverage;
  workload characteristics never select a codec or profile.
- `CONFIRMED`: baseline `repository.rs` nested an `mrml-mldsa65` payload under
  the OpenPGP commit signature, but it had no complete protected-history trust
  policy or privately constructed activation transaction. The bounded hybrid
  verifier/policy/range typestates now address those core boundaries. The
  production receive entry point accepts one capability-bearing authority for
  exact policy authorization, durable proof verification, and receipt signing;
  the installed CLI still fails closed unless its deployment supplies the
  protected-policy service profile.
- `CONFIRMED`: baseline `mrml_openpgp::Fingerprint` was exactly 20 bytes and
  its own module documentation described a current v4 key. The first-party v6
  SHA-256 fingerprint and salted verification paths are now separately tested;
  v4 remains explicit legacy compatibility.
- `CONFIRMED`: baseline remote operations imported the SSH client and exposed
  `fetch_ssh`/`push_ssh`; there was no first-party server receive/quarantine/ref
  engine. The transport-neutral protocol and durable receive core now exist,
  while the public listener remains Agent B's boundary.
- `CONFIRMED`: baseline `repository.rs` was 4,430 lines. Focused object, pack,
  delta, index, quarantine, transaction, trust, verification, protocol, and
  view modules now own the new security-critical mechanisms. The legacy file
  remains large (currently more than 4,600 lines), so further extraction is a
  maintainability task and no cosmetic rewrite is claimed.

None of these findings is `NOT_REPRODUCIBLE_ON_CURRENT_HEAD`; each was checked
at the recorded base rather than inferred from an older chat summary.

The edge branch can import the public `mrml_git::GitdCoreBackend` contract
without a dependency on HTTP, TLS, or Zstandard packages. The concrete
`FilesystemRepositoryView` implements generation-stable structured reads and
the bounded upload-pack subset. `ReceivePackCore` composes the bounded receive
parser, reservation, quarantine, complete-history verifier, durable store,
atomic activation, authenticated receipt, and report-status writer. The edge
must inject exact policy/proof and receipt authorities; absent those
capabilities, its receive route remains fail closed.

No package or workspace manifests were changed. No dependency is requested by
this change.

The installed CLI now accepts the standard spellings `git add`, `git reset`
(index reset only), `git checkout` (existing local branches), `git remote add`,
`git remote set-url`, `git commit -m`, `git commit -S -m`, `git verify-commit`,
`git verify-tag`, `git rev-parse`, `git ls-tree`, and `git show-ref` through
first-party repository operations. Native `git rm` and `git mv` validate
bounded repository-relative paths, require tracked regular-file sources, and
stage the resulting deletion/addition. Native `git fsck` authenticates every
object reachable from local branch, tag, and HEAD tips with bounded graph and
object parsing. These paths never fall back to an external Git executable.
Destructive reset modes, detached checkout, pathspec-rich forms, unreachable
object enumeration, and the remaining explicitly listed command gaps stay fail
closed until their native semantics are implemented and tested.

The public hybrid commit constructor no longer accepts signing callbacks alone:
it requires independent OpenPGP and ML-DSA verification callbacks and runs both
against the exact nested payloads before writing or moving the local branch.
The conventional signed-commit and signed-annotated-tag constructors likewise
require an independent verification callback over the exact canonical payload
and returned armor before writing the object or changing a branch/tag ref. The
SSH wrappers supply first-party SSHSIG verification, and the OpenPGP CLI path
supplies the configured complete-fingerprint policy verifier. Focused rejection
tests prove that verifier failure preserves the prior branch head and leaves the
tag ref absent.
The installed `git commit -S` path still selects the configured conventional
SSH or OpenPGP profile. Automatically selecting the mandatory hybrid path for a
protected repository requires the out-of-scope canonical policy/key-service
integration; absent that state, no protected-policy claim is made.

Standard branch semantics are now exact for the bounded forms: `git branch
NAME` creates without switching, `git branch -d NAME` deletes under the native
branch checks, and `git switch -c NAME` / `git checkout -b NAME` create and
switch. `git tag -s NAME -m MESSAGE` and `git tag -s -m MESSAGE NAME` route to
the first-party signed annotated-tag path. On hosted Linux, option-free `git gc`
and `git repack` now write and reopen a deterministic content-addressed pack and
v2 index containing the complete closure of local branches, tags, and `HEAD`.
They retain loose objects and prior packs, so this is non-destructive repacking,
not unreachable-object collection. Windows remains fail closed until directory
durability exists, and unsupported arguments are rejected. Neither command
invokes host Git.

`git cat-file -t`, `-s`, and `-p` are native. Type and size work for every
authenticated object kind. Pretty mode emits parsed tree entries or exact UTF-8
commit, tag, and blob contents; binary pretty-printing fails explicitly because
the current runtime output interface is text-only. It never performs lossy
conversion or invokes an external Git process.

`git pull --ff-only [remote] [branch]` is accepted exactly; unknown pull
options remain rejected. The SSH fetch client parses and authenticates the
bounded pack, then traverses every advertised commit, tree, and blob against
the isolated parsed candidate plus the existing object database before any
candidate object is installed or any remote ref is updated. A malformed,
wrong-kind, incomplete, or over-budget candidate therefore leaves both the
object database and refs unchanged. This is controlled client-path evidence;
it does not claim the stronger production file-backed quarantine durability of
the server receive path.

The detached-signing service interface currently enumerates SHA-256, SHA-384,
and SHA-512 only. Adding policy-controlled OpenPGP SHA3-512 requires a separate
interface-generation change outside this branch's allowed files before the Git
CLI/service route can expose it. The first-party v6 implementation therefore
fails closed instead of advertising SHA3-512 prematurely.

Authenticated emergency recovery now has an in-core authority boundary without
adding a manifest dependency:

1. `MRGERA01` defines the canonical owner-controlled emergency-policy artifact,
   binding the repository, complete recovery public identities, exact threshold,
   validity, revocation, and monotonic authority generation;
2. `EmergencyRecovery` is a purpose-separated verifier request over the pinned
   artifact, canonical recovery transition, and exact hybrid signatures;
3. threshold verification returns an opaque authenticated authorization bound
   to repository identity, pinned emergency-policy digest/generation, statement
   digest, exact current and proposed trust/revocation policy digests and
   generations, and effective time;
4. `LinuxDurableTrustPolicyStore` stores policy generations and revoked recovery
   keys rollback-resistently; and
5. only that authorization reaches the private transition, which enforces no
   revocation removal, generation lowering, object-format/ref
   broadening, checkpoint/cutover movement, or hybrid disablement.

Focused tests cover wrong policy/statement digests, replay, threshold failure,
authority validity checks, downgrade/broadening, truncation/tampering, and
authorization substitution. A boolean verifier or caller-minted digest was
rejected because it would let untrusted data manufacture recovery authority.

Shared generated assurance inventories may need regeneration after integration
because three focused package tests were added. This branch is forbidden from
editing those inventories; run the repository-supported assurance regeneration
and inspect the exact diff rather than copying generated output by hand.

The source object database initially failed the mandatory pre-work `git fsck
--full --no-reflogs` because six loose objects were zero-length. After external
repair, both the primary checkout and this worktree passed `git fsck --full
--no-reflogs --no-dangling` on 2026-09-01. Full fsck reports only unreachable
objects. This branch did not delete or repair Git objects.

`docs/gitd/core/READY` records the focused green gates and deliberately
classifies the result `CORE_BLOCKED`: native-Windows durability, process-kill
fault injection, scale/concurrency
benchmarks, sanitizer/fuzz campaigns, and independent review remain open. The
focused Windows Git package completed under Wine using the pinned
`nightly-2026-08-29-x86_64-pc-windows-gnullvm` toolchain at rustc commit
`17fd5b8a37b6667b6cc137f3cc35f09759768a3b`; this is Wine toolchain/runtime
evidence, not native Windows evidence.

The ML-DSA-65 key-generation, signature-generation, and signature-verification
tests now consume checked-in bytes from NIST ACVP-Server commit
`975de31eb83d87039ec88934fdc47d8c312b892d`. A separate checked-in signature
generated and self-verified by OpenSSL 3.6.4's default provider is always
verified by the first-party implementation. These tests no longer silently
pass when fixture environment variables are absent; OpenSSL remains a test
oracle and is not a runtime dependency.

Every native loose-object write now immediately reopens, parses, rehashes, and
byte-compares the stored object before returning its identity. Consequently a
pre-existing corrupt object at the computed path, a malformed write, or an
identity/content mismatch fails before commit/tag code can mutate its ref.

Focused deterministic mutation campaigns now feed bounded hostile corpora into
the Git pack, pack-index, loose-object, pkt-line/advertisement, trust-policy,
journal, active-ref, full-ref-name, and repository-path parsers; the OpenPGP
packet/armor parsers and verifier; and ML-DSA key/signature verification. They
run identically on Linux and the pinned Wine-hosted Windows target. This is
structured-random regression evidence, not a claim of sanitizer-backed or
coverage-guided fuzz completion.

The repository-view contract now exposes a generation-bound immutable-pack
descriptor for an exact commit. Construction authenticates and traverses the
complete commit closure, rejects non-commit or mixed-format identities, and
rechecks the active generation before returning profile/encoder version 1.
It is a stable cache-generation request descriptor, not evidence that a cached
or canonical compacted pack exists. Patent review: NOT_TRIGGERED for this typed
identity descriptor; it performs no compression or delta-selection mechanism.

The view also exposes a bounded coalesced event cursor over repository, trust,
revocation, and pack generations. It reports exact previous/current snapshots,
rejects cursors ahead of authoritative state, and never fabricates a historical
transition log. Edge consumers can invalidate derived views without direct
filesystem access; authenticated receipts remain the durable audit authority.

Protocol-v2 fetch now accepts multiple exact advertised wants and bounded
haves. The first-party graph walk authenticates each have closure, subtracts it
from the wanted closures, and emits only the deterministic remainder. Mixed
formats, missing objects, malformed graphs, and the one-million-object ceiling
fail closed. This is single-request wants/haves subtraction; multi-round ACK
negotiation and thin-pack generation remain unadvertised.
