# Offline Git release trust root

Status: implementation in progress; execution evidence is recorded separately
in CURRENT_COMPLETION.md. Historical bundles using their own
`signatures/cosign.pub` are not authenticated owner releases by that fact alone.

The owner provisions three trusted components separately from the bundle:
`mrml-git-release`, the cosign executable, and the selected release public key.
An authenticated administrative channel or an already trusted installation can
deliver these. A checksum printed inside the same downloaded bundle cannot
establish their trust. No private signing key belongs on the deployment host.
The owner can replace the selected key; this mechanism gives no publisher a
permanent authority over the owner.

The Linux bootstrap is built through the existing Git package:

```sh
target/release/mrml build org.mrml.tool.git --target linux --release
```

Provision that build independently as `/usr/local/bin/mrml-git-release`, cosign
as `/usr/bin/cosign`, and the public key at an owner-controlled location outside
the payload, for example `/etc/mrml/release.pub`. Protect the programs, key and
their parent directories from unrelated writers. Executable paths require
non-shared parents even when a shared directory has the sticky bit; a tool
symlink directly under `/tmp` is rejected. A private owner-controlled directory
under `/tmp` is supported. The calling user, host kernel,
selected tools and their process environment are trusted for this host-tool
operation. This is separate from production Git transport, which does not
delegate Git operations to these tools.

The new release transport is an **uncompressed, file-only USTAR `.tar`**. It is
not the older `.tar.gz` containing a top-level bundle directory. Before invoking
any downloaded script, use the independently installed executable directly:

```sh
/usr/local/bin/mrml-git-release extract \
  /home/ubuntu/incoming/git-release.tar /home/ubuntu/releases/git-release \
  /etc/mrml/release.pub /usr/bin/cosign
/usr/local/bin/mrml-git-release verify \
  /home/ubuntu/releases/git-release /etc/mrml/release.pub /usr/bin/cosign
/usr/local/bin/mrml-git-release load \
  /home/ubuntu/releases/git-release /etc/mrml/release.pub \
  /usr/bin/cosign /snap/bin/docker
```

These are provisioning examples, not a claim they passed on mrml.ca. Select
the actual independently trusted Docker path; `/usr/bin/docker` may be Podman
emulation on a development host. Engine access must already be authorized for
the invoking account. Docker Snap also requires archives under a visible home
directory rather than host `/tmp`. Its separate no-new-privileges execution
blocker is documented in [DOCKER_HOST_REMEDIATION.md](DOCKER_HOST_REMEDIATION.md).

`extract` requires a new destination. The signed manifest is authenticated
before payload extraction, and every file is hashed before executable modes
are installed. `verify` authenticates the exact copied manifest bytes with the
external key, then compares the entire directory inventory. `load` revalidates
and copies authenticated files to private staging, reads only that snapshot,
and rejects conflicting existing tags before any load, then compares both exact
image IDs and locked tags after loading. A failed or
partially successful Docker load is not rolled back by deleting images: that
could destroy pre-existing owner state. It reports failure and does not start
containers. The five expected identities are checked; the loader does not parse
the nested Docker archive to prove it contains no additional image or tag.
The trusted builder exports one selected image per archive, and the complete
archive bytes are authenticated. Successful loading is not authorization to
activate a service.

Image identity must be selected for the exact export/store profile before
signing. Docker's classic store and Podman's `.Id` can identify the image
configuration, while Docker 29's containerd store can identify the manifest.
A legacy Docker archive import can therefore change the reported ID. The
verifier deliberately rejects this mismatch; never replace a signed ID with
an unverified post-import observation or fall back to tag/runtime checks.
The tested cross-engine validation profile exports one OCI image per archive
and signs the exact manifest blob digest named in that archive's index.
The original configuration and layer digests remain transitively bound by
that manifest. This profile was loaded and checked with the unchanged verifier
on Docker 29.6.1/containerd; it does not qualify classic-store imports.
See [the remote validation record](DOCKER_IMPORT_VALIDATION_2026-09-05.md).
The production builder still requires a clean source and fresh evidence;
its build/export engine and destination store must preserve the signed ID.

`release.manifest` binds source identity, Linux/amd64 platform, paths, canonical
sizes, allowed modes and SHA-256 hashes for every payload file. This includes
`images.git.lock` (exact producer image IDs, archive hashes and runtime
identities), Compose definitions, helpers, configuration examples, SBOMs and
test evidence. Only the manifest itself and its detached cosign bundle are
excluded from its file list. A bundled public key, if retained for reference,
is ordinary authenticated data and is never selected as the verification root.
The signature uses the existing cosign blob format and intentionally permits
offline verification without a transparency-service lookup.

Bounds: 20,000 files, 32 GiB aggregate payload, 4 MiB manifest, 255-byte paths,
16 path components, 64 KiB copy buffers and USTAR's individual size limit of
8 GiB minus one byte. Files may be 0444, 0555, 0644 or 0755; no set-ID modes,
hard links, symlinks, traversal, special files, duplicate paths, PAX/GNU
extensions, unlisted files or extra directories are accepted. Ownership and
timestamps are not restored. Failed extraction leaves a private partial
destination; no pre-existing destination is overwritten. These deliberate
limits avoid invoking a generic extractor on untrusted content.

Private-directory ancestry checks every explicit prefix without symlinks, with
root/current-owner checks and sticky protection for shared writable parents.
Explicit host mount points such as `/tmp` and `/home` are supported; traversal
inside a payload still uses descriptor-relative no-cross-mount capabilities.
CLI extraction validates the payload and
semantic metadata in private staging before copying into the new destination;
allow staging space as well as destination space. The transport format follows
[USTAR field semantics](https://www.gnu.org/software/tar/manual/html_section/Standard.html),
with the narrower profile above.

Trusted build-side recipe:

```sh
COSIGN_KEY=/owner/offline/release.key \
COSIGN_PUBLIC_KEY=/owner/offline/release.pub \
GIT_STREAMING_EVIDENCE=/owner/evidence/current-clean-build \
deploy/compose/build-offline-git-bundle.sh VERSION /owner/exports/git-release.tar
```

It requires a clean source tree and same-source 256 MiB streaming evidence,
builds on the trusted development host, exports images/SBOMs, signs the complete
manifest, verifies using the separately supplied key, and emits bounded USTAR.
Signing is not a substitute for passing tests: signed evidence authenticates
the evidence bytes, not their truth. Final release creation remains blocked
while the exact Compose acceptance sequence has not passed.

Complexity impact: MEDIUM. TCB impact: MEDIUM. New parser boundary: YES (bounded
manifest and file-only USTAR). New authority model: NO. New persistent state:
YES (signed inventory format). External dependency: existing cosign and Docker
host tools only; no Rust dependency added. Failure isolated: YES, host-tool
process. Existing-object reuse: HIGH (runtime file capabilities, bounded process
execution, SHA-256 and existing cosign signature format). Removing automatic
bundle-script execution is necessary to establish verification before execution.
Independent agent review is useful implementation evidence, not external audit.

Patent review: **NOT_TRIGGERED**. Conventional signed inventories, SHA-256,
USTAR transport and retained file capabilities add no novel cryptographic or
archive algorithm. See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
