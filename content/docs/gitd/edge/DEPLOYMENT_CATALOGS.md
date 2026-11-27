# Gitd deployment catalogs

Status: **PARTIALLY IMPLEMENTED**. Canonical authenticated catalog loading is
implemented and is a native startup gate. Repository backend construction and
generation admission are implemented; selected arrival-pack composition,
recovery, and listeners remain to be completed.

Gitd accepts two distinct bounded version-1 catalogs. The profile catalog maps
a canonical deployment-owned profile name to `public-read`, `private`, or
`protected` and an exact per-object byte ceiling. The repository catalog maps a
canonical `owner/repository` identity to one profile plus nonzero repository,
trust, and revocation generations. Records must be strictly sorted and unique;
unknown profiles, aliases, leading-zero numbers, empty records, unknown fields,
oversized catalogs, and malformed identities fail startup.

The paths are constrained by typed configuration and opened with `O_NOFOLLOW`.
Each must be one bounded regular file owned by root or Gitd and not writable by
group or world. SHA-256 is recomputed over the exact bytes and must equal the
canonical digest in trusted configuration before parsing. Repository names and
profile labels identify authenticated records; neither grants authority by
itself. Git object-format enforcement remains an independent authenticated
repository-state check and is never inferred from a `.git` suffix or other
name.

The filesystem repository backend exposes the exact active
repository/trust/revocation generation tuple only after reopening authenticated
active state, and refuses this startup view unless its object format is
SHA-256. Gitd uses this narrow projection to compare catalog generations; it
admits the repository only when all three generations exactly match the
authenticated catalog entry, and does not infer security state from storage
paths or repository labels.

For each authenticated identity, Gitd derives the same exact owner and
repository components beneath the independently configured object, state,
quarantine, cache, and receipt roots. Every resulting leaf and parent component
must be a nonsymlink directory with the exact Gitd owner/group and restrictive
mode before the SHA-256 repository view is opened. The admitted object contains
only these derived paths and the generation-matched view; the catalog never
supplies an ambient filesystem path.

The sorted admitted views are consumed by one catalog-backed repository set.
Exact typed identities select the corresponding SHA-256 adapter by bounded
binary search; missing identities fail as absent and there is no filesystem or
default-repository fallback.

Focused hosted Linux evidence:

- `./target/debug/mrml test org.mrml.service.gitd --target linux`: 15 tests pass,
  covering canonical resolution, generation binding, ordering, duplicate and
  unknown-profile rejection, malformed identities, digest substitution,
  symlink refusal, insecure mode refusal, exact reopened repository-state
  admission, five-root path derivation/validation, stale-revocation refusal, and
  exact present/absent multi-repository selection, and real authority/certd Unix
  exchanges.
- `./target/debug/mrml test org.mrml.tool.git --target linux`: 194 library and 3
  CLI tests passed, including exact SHA-256 authority-generation projection from
  a reopened filesystem repository view.

Patent review: **NOT_TRIGGERED**. Canonical bounded text parsing, SHA-256 byte
binding, file metadata validation, and deployment-owned ACL/profile lookup are
conventional defensive mechanisms. See `docs/patents/REVIEW_LOG.md`.
