# Git backup stream

Status: **PARTIALLY IMPLEMENTED**. The bounded authenticated-encryption framing,
canonical inventory/generation records, and hostile parser tests are
implemented. The stopped one-shot backup/restore service, named-volume Compose
wiring, and a destructive disposable-namespace restore test remain acceptance
gates.

## Security boundary

A Git backup key is a distinct 32-byte nonzero secret capability. It is not a
receipt key, token pepper, authority channel key, protected signer key, image
signing key, environment variable, or image content. The one-shot service will
receive it through a read-only secret volume and erase derived key material.
Possession authorizes backup sealing/opening only; it does not authorize Git
refs, policy transitions, candidate completion, or deployment activation.

The stream starts with a fixed 44-byte `MRGBKP01` header containing:

- format version 1;
- nonzero backup generation;
- a bounded nonzero plaintext chunk size, at most 1 MiB;
- a random 128-bit salt; and
- a random nonzero 32-bit nonce prefix.

Reserved header bytes must be zero. A per-archive AES-128-GCM key is derived by
HMAC-SHA-256 from the backup key, a purpose-separated domain, and the complete
header. Each frame carries an exact monotonically expected 64-bit sequence,
plaintext length, final flag, and zero reserved bytes. The 96-bit GCM nonce is
the archive nonce prefix followed by that sequence. The complete stream header
and frame header are additional authenticated data.

Nonterminal frames contain 1 through the declared chunk-size bytes. The sole
terminal frame contains zero plaintext and has the final flag set. It is still
authenticated. Readers reject the wrong key, header substitution, duplicate or
reordered sequences, unknown flags, nonzero reserved fields, oversized frames,
noncanonical final frames, tag changes, and truncation. Authentication failure
clears the affected plaintext output.

Decrypted plaintext begins with the fixed `MRGBPL01` payload magic, a big-endian
32-bit canonical-inventory length, and four zero reserved bytes. The inventory
immediately follows. After it, the exact contents of every regular file appear
in inventory order; directory entries contribute no bytes. File boundaries are
therefore derived only from authenticated inventory sizes and cannot be moved
by unauthenticated archive data.

The canonical inventory declares the complete fixed mask of ten authoritative
logical volumes; cache is deliberately absent. It binds a nonzero backup
generation, ordered unique repository identities, repository/pack/trust/
revocation generations, the matching authority generation when protected, and
up to 1,000,000 ordered unique filesystem entries. Each entry binds its logical
volume, bounded safe UTF-8 relative path, directory-or-regular-file type, mode,
UID, GID, size, and SHA-256 content digest. Directories have zero size and
digest. The inventory is limited to 64 MiB and ends in a digest that detects
internal corruption independently of the enclosing encrypted frames.

Every one of the ten volumes begins with exactly one directory entry whose
canonical path is `.`. This reserved entry binds the named-volume root's mode,
UID, and GID and has zero size and digest. It cannot represent a regular file,
cannot be duplicated, and is required for the fixed volume mask. Descendant
paths continue to forbid `.` components, so the root marker is unambiguous.

Protected authority generations are read with the same bounded `MRAGEN01`
codec used by the live authority store. The checksum domain, repository
identity, and nonzero generation therefore cannot drift between online writes
and offline inventory collection; a record for another repository is rejected.

Restore must still authenticate the complete stream before publishing any
target namespace and reject a runtime source/target that does not exact-match
the manifest. The service layer remains responsible for proving every declared
volume was mounted, generating the inventory from a cold consistent snapshot,
streaming file bytes, and ensuring no missing or extra entry exists.

The implemented Linux volume collector retains each mounted volume root and
opens every descendant beneath directory capabilities. Enumeration is bounded
before retaining names and limited to 64 levels and 1,000,000 entries. It emits
canonical byte-ordered paths and rejects symlinks, special files, hard-linked
regular files, invalid directory metadata, overlong paths, short reads, growth
during hashing, and descriptor-relative replacement races.

Inventory assembly authenticates the configured Gitd catalog, then reads every
repository's `active.refs` beneath retained repository/state roots. Conventional
catalog and live repository, trust, and revocation generations must exact-match.
For a protected repository, the immutable catalog repository generation is a
floor, while trust and revocation remain exact; forward repository progress is
accepted only when the exact mode-0600, single-link authority record beneath the
retained generation root authenticates the same live repository generation.
The live pack generation is recorded. Conventional entries record authority
generation zero. Operator- or environment-supplied generation values are not
accepted.

The implemented emitter writes the stream header and then bounded frames while
holding retained capabilities for all ten source roots. It reopens every
declared descendant beneath its corresponding root, exact-matches type, mode,
UID, GID, regular-file link count, and size, hashes bytes as they stream, rejects short reads
or growth, and requires the second-pass digest to equal the inventory. Repository
contents are never accumulated in memory. Archive-file atomic creation and the
restore path remain service-layer acceptance gates.

The implemented streaming verifier authenticates the header and every exact
sequence, bounds the inventory length before allocation, parses its canonical
digest, requires its generation to match the encrypted-stream header, and then
hashes each size-delimited regular-file segment. Success additionally requires
the authenticated empty terminal frame and physical end of input. Wrong keys,
frame or payload tampering, reordered sequences, truncation, unexpected payload
bytes, and bytes after authenticated EOF fail closed before any restore write.

The Linux/runtime retained-file mechanism now supports descriptor-scoped owner
and mode application for restore. It invokes `fchown` and then `fchmod` only on
an already-open retained regular file or directory, validates the permission
width, and never converts the object back into an ambient path. The restore
service must retain the narrow container capabilities required for these calls;
ordinary Gitd and authority services remain capability-dropped.

The implemented restore engine requires a seekable archive and ten distinct,
empty retained target roots. It completes the read-only verifier before opening
any target, rewinds, and authenticates the archive a second time while creating
each descendant beneath its target capability. Regular files are created
exclusively, streamed, hashed, synced, assigned exact owner/mode metadata, and
synced again. Directories are finalized child-first, including the authenticated
volume-root records. Parent directories are synced after namespace changes. A
final canonical rescan must exactly equal the authenticated inventory. Any
error leaves a disposable target set that is not authorized for activation.
An eleventh empty cache volume is required. After archive authentication, the
administrator derives only its owner/repository directory skeleton from the
authenticated inventory, applies the Gitd owner and private mode, and syncs it;
cache bytes remain excluded from backup and restore.

The `mrml-git-backup` hosted administrator binary implements `create`, `verify`,
and `restore` for a canonical nonzero decimal generation. It uses fixed
container mount points only. The 32-byte nonzero backup key must be a
single-link, root-owned regular file with no group/world permission beneath a
non-writable root-owned key volume. Archives are exclusive mode-0600 files in a
root-owned mode-0700 backup volume; create writes and syncs a `.new` file,
renames and syncs the volume, then reopens and verifies the published archive.
Per-archive salt and nonce prefix come from the operating-system random source.
The binary never accepts source, target, key, or archive paths from arguments.

`Dockerfile.git-backup` packages only that administrator in the same pinned
two-stage Debian/distroless family as the production Git images. It runs as
root solely so restore can apply authenticated ownership, has a fixed
`/usr/bin/mrml-git-backup` entrypoint, and contains no shell, SSH, GnuPG, curl,
or Gitd/authority daemon. Compose must still drop all capabilities for create
and verify and add only the metadata capabilities required by restore.

The backup and restore Compose definitions use named volumes exclusively. The
backup service receives the ten authoritative source volumes read-only, plus a
read-write archive volume and private key volume; it has no network and only
`DAC_READ_SEARCH` for cold inspection. The restore service receives archives
and key read-only and ten newly created disposable namespace volumes read-write;
it has no network and only `CHOWN`, `FOWNER`, and `DAC_OVERRIDE` for faithfully
reconstructing authenticated metadata. It receives no source volume and neither
service receives a container-engine socket. The operator refuses running Gitd
or authority, existing target names, noncanonical generations, and unsafe
namespace names. Backup-key generation occurs inside the key volume and never
through a host bind directory.

Patent review: **NOT_TRIGGERED**. This increment composes standardized
AES-GCM, HMAC-SHA-256 key derivation, explicit sequence numbers, bounded chunks,
and authenticated EOF in a conventional encrypted-record stream. It introduces
no substantial new mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
