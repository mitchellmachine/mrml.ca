# MRML artifact extensions and content identity

Status: **PARTIALLY IMPLEMENTED**. The package, boot `SystemRelease`, and general
generation/catalog `SystemRelease` formats have distinct internal magic,
explicit format versions, bounded authenticated metadata, and content digests.
The general format has library encode/verify/admission coverage and the public
`mrml release system-create`/`system-verify` commands. `mrml package create` now defaults to
`<package-id>-<version>.mrp`, `release-create` defaults to
`mrml-system-<version>.mrs`, and the standalone Zstd ABI-3 schema is `3.mri`.
Complete `SystemImage` and detached-signature output tooling remains **PLANNED**.

## Canonical extension family

MRML uses these preferred user-facing extensions:

| Extension | Artifact | Status |
| --- | --- | --- |
| `.mrp` | signed deployable MRML Package (MRP) | format/default naming/filename-independence tested |
| `.mri` | standalone MRML interface definition (MRI) | Zstd ABI-3 schema migrated |
| `.mrs` | distinct serialized `SystemRelease` (MRS) | boot format/default naming and general create/verify implemented |
| `.mrz` | complete deployable MRML `SystemImage` (MRZ) | convention defined; complete image tooling planned |
| `.mrsig` | detached MRML signature (MRSIG) | convention defined; optional tooling planned |

An interoperable ISO/UDF optical-disc image continues to use `.iso`. A raw disk
image may use `.raw`. Neither is an MRML package or `SystemImage`.

`.mrp` is a user-facing file extension only. Package identity, class,
architecture, version, content identity, compression, and trust come from the
authenticated package format and manifest. Internal magic and format version
are authoritative. Renaming a valid `.mrp` to `foo.bin` cannot change its parsed
identity or trust decision, and invalid bytes named `trusted-kernel.mrp` remain
invalid.

Package class is authenticated metadata. Applications, libraries, drivers,
services, kernels, VMMs, bootloaders, recovery components, and other system
components all use `.mrp`; MRML does not create class-specific extensions such
as `.mrkernel`, `.mrvmm`, or `.mrapp`. Compression is also authenticated internal
metadata, so names such as `.mrpzstd`, `.mrzst`, or `.mrzstd` are forbidden.

`.mrml`, generic `.pkg`, and `.mpk` are not canonical MRML deployable
extensions. Active examples and new output defaults must not prefer `.mrpkg`,
`.mrmlpkg`, or `.mrmlimg`. A legacy extension may remain only in an explicitly
labeled compatibility fixture with a demonstrated need.

## Tool and presentation defaults

When the caller omits an output filename, package tooling should produce
`<package-id>-<version>.mrp`; for example, `org.mrml.zstd-15.mrp`. A distinct
release writer should use a name such as `mrml-system-105.mrs`, and a complete
image writer should use a name such as `mrml-desktop-x86_64-0.1.0.mrz`.
Standalone interface-definition output uses `.mri`; optional detached signature
output uses `.mrsig`.

Explicit caller-selected paths remain supported. Filename parsing must never
populate authoritative package ID, version, architecture, publisher, class, or
trust state. Extensions may guide file pickers, MIME presentation, or host file
associations only after content parsing. Planned content-type names are
`application/vnd.mrml.package`, `application/vnd.mrml.system-release`,
`application/vnd.mrml.system-image`, and `application/vnd.mrml.interface`;
formal registration is not an acceptance dependency.

## Boot, Store, installer, and recovery

The Store indexes authenticated package ID, version, architecture slices,
content digest, signature/provenance, and source. A GitHub asset or transport
filename is presentation data, not a trust input.

Boot resolves exact packages from the selected generation or `SystemRelease`,
then verifies internal package magic/version, authenticated metadata, exact
digest, and applicable signature. FAT filenames and suffixes do not authorize a
package. Installer and recovery use the same content-first rule; extensions are
only optional discovery or file-picker filters. Complete `.mrz` images bind
their release/package graph internally and are not ordinary `.mrp` packages.

## Acceptance

Focused implementation tests must prove that a valid package authenticates
after rename to `foo.bin`, malformed bytes are rejected despite a trusted-looking
`.mrp` name, and default builders choose the extension family above. Equivalent
magic-based tests are required before `.mrs`, `.mrz`, `.mri`, or `.mrsig` tooling
is reported **IMPLEMENTED**. Repository review must distinguish conventions from
working commands and retain internal magic independently of filenames.

The 2026-08-25 Windows host-tool suite passed 64 tests, including a filesystem
rename of a valid `org.mrml.zstd-15.mrp` to `foo.bin` with unchanged parsed
identity and rejection of malformed `trusted-kernel.mrp`. A live CLI probe also
created and verified the default `org.mrml.zstd-15.mrp`. These tests establish
package filename independence only; `.mrz` and `.mrsig` tooling remains planned.

Patent review: **NOT_TRIGGERED** for the naming convention. It introduces no
runtime, storage, compression, cryptographic, or authority mechanism. Related
format mechanisms retain their entries in [the patent review log](../patents/REVIEW_LOG.md).
