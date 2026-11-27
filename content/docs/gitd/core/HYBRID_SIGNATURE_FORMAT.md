# MRML-GIT-HYBRID-V1

Status: **PARTIALLY IMPLEMENTED**. The canonical transcript and exact-pair AND
verifier are implemented in `trust_policy.rs`; the existing nested commit
format is not this profile and does not satisfy it. The OpenPGP library parses
the exact RFC 9580 v6 Ed25519
primary-key packet shape and computes the full 32-byte SHA-256 fingerprint,
with the RFC Appendix A certificate as a byte-exact vector. V6 detached
signing and verification now use algorithm-sized salts before all other hash
input, four-byte subpacket lengths, complete v6 issuer fingerprints, and native
64-byte Ed25519 signatures. Focused regressions distinguish correct,
omitted/wrong-sized, and payload-before-salt hashing. Independent detached-v6
interoperability evidence and SHA3-512 interface support remain open.

Protected history will require an AND decision over an authorized OpenPGP v6
Ed25519 signature, an authorized ML-DSA-65 signature, and an authorized binding
between those exact full public-key identities. Conventional-only signatures
must not satisfy hybrid-required policy.

Both signatures cover this byte-exact canonical transcript. Integers are
unsigned big-endian and text is exact ASCII already validated by its typed
constructor:

```text
"MRML-GIT-HYBRID-V1" 00
purpose:u8
repository_length:u16 repository:bytes
object_format:u8 object_type:u8
trust_generation:u64
openpgp_v6_fingerprint:32
sha3_512(canonical_openpgp_primary_key_body):64
sha3_512(ml_dsa_65_public_key):64
payload_length:u64 payload:bytes
```

Purpose codes 1 through 7 respectively identify `GitCommit`,
`GitAnnotatedTag`, `SourceManifest`, `SourceLock`, `BuildReceipt`,
`KeyRotation`, and `KeyRevocation`. Object-type codes use the same ordering.
Object-format 1 is SHA-1 compatibility and 2 is SHA-256. A purpose/object-type
mismatch is rejected before cryptographic verification. The canonical OpenPGP
primary-key body is version 6, creation time, algorithm 27, four-byte key
material length 32, and the exact Ed25519 public bytes. Its SHA3-512 value is an
MRML public-key digest, never an OpenPGP fingerprint.

Successful verification may be converted into an opaque
`VerifiedGitObjectProof` only after the exact canonical Git object framing and
hash also match. `GitCommit` accepts only a commit object,
`GitAnnotatedTag` only a tag object, and `SourceManifest`, `SourceLock`, and
`BuildReceipt` only blob objects. The proof additionally carries the exact
repository identity and repository/trust/revocation generations. Tampered
payloads, zero or foreign-format IDs, mismatched purpose/object type or Git
kind, another repository, and zero repository generation fail closed. The
existing `VerifiedCommitProof` remains the narrower protected-history wrapper.

The transcript therefore binds:

- profile version and one of `GitCommit`, `GitAnnotatedTag`, `SourceManifest`,
  `SourceLock`, `BuildReceipt`, `KeyRotation`, or `KeyRevocation`;
- canonical repository identity, Git object format and object type;
- trust-policy generation;
- complete RFC 9580 OpenPGP fingerprint;
- MRML digest of the canonical OpenPGP public key;
- MRML digest of the canonical ML-DSA public key; and
- canonical payload length and exact payload bytes.

Unknown critical fields, duplicates, reordering, alternate line endings,
invalid continuation/base64 data, trailing data, algorithm or digest
substitution, and all context mismatches must fail closed.

The zero-identity golden transcript for `owner/repository`, SHA-256 commit,
generation 4, and payload `payload` is 223 bytes and has SHA3-512 digest
`99acd226d5b49f391265c3143c2c9f7df4a113a4dde77e234dd5d96932826d71017e02e8fd170ff18aee338b2939d1b6d30eb8c2dce80c6ab339bff4ef7a1b48`.

The verifier independently recomputes both public-key digests, requires the
exact authorized pair, checks exact trust and revocation generations, verifies
the salted OpenPGP v6 signature, then verifies ML-DSA-65. Its success typestate
has private fields. Canonical generational policy parsing, normal two-pair
rotation constraints, and complete introduced-history range verification are
implemented. Canonical revocation/emergency execution and independent
cryptographic review remain open, so the status cannot be promoted.

ML-DSA-65 signing reconstructs the public key from decoded secret polynomials,
checks the stored public-key transcript hash, and verifies every generated
signature before returning it. The caller's signature buffer is
volatile-zeroed before work and on every error path; decoded long-lived secret
arrays are volatile-zeroed before return. This is source-level output-hygiene
evidence only. Matrix, eta, and challenge rejection sampling uses finite
buffers and now fails with a classified `SamplingLimit` error if those buffers
cannot produce the required coefficients; no release-build debug assertion or
unchecked challenge cursor is a correctness dependency. Key generation clears
caller outputs before work and volatile-zeroes its expanded seed and temporary
polynomial state on success and classified sampler failure. Tests cover the
255-byte context boundary, fail-closed 256-byte rejection with cleared output,
and noncanonical hint ordering. Constant-time timing evidence and independent
cryptographic review remain open. Signing now
volatile-zeroes every rejected and accepted attempt's sampled `y`, transformed
vectors, products, low bits, challenge, encoded high bits, and hint working
state before retry or return. The gamma sampler's temporary serialization is
also wiped. This is source inspection of explicit stores; it does not prove
compiler-created copies, registers, caches, swap, hardware traces, or
constant-time execution are erased or absent.

The test-only independent oracle is OpenSSL 3.6.4, built 2026-08-25, default
provider `ML-DSA-65`. The pinned differential case uses key-generation seed
`000102...1f`, per-signature test entropy `202122...3f`, context
`mrml-oracle`, and message `MRML ML-DSA oracle message`. OpenSSL verifies its
signature, while the environment-gated MRML test requires byte-exact agreement
for the 1952-byte public key, 4032-byte private key, and 3309-byte signature and
then verifies the OpenSSL signature independently. Fixture SHA-256 digests are:

- public key: `d666806e11cee19a7c989f7445f90dd419cf4d2d51db8c0fdb4c0f0a542238c9`;
- private key: `9f1e24f47795fe50040384e3d6183988047170fa2d866406b70fe0a3f8216063`;
- signature: `74e9f990ff6705244aec107745630ea37b308d0f8172329bb34382e6efc6d710`;
- message: `446d923689f069cdc13682c7414e211b85bda1cba245a3c363adace52d4316c7`.

This is a pinned hosted-Linux differential probe, not an official NIST ACVP
vector, validation certificate, constant-time result, or independent audit.

Official key-generation coverage includes ML-DSA-65 case 26 from NIST's
`ML-DSA-keyGen-FIPS204` sample at ACVP-Server commit
`975de31eb83d87039ec88934fdc47d8c312b892d`. The prompt and expected-results
JSON files have SHA-256 digests
`43e81ad820e495dbcad086fe27c1008393a8c32100bbbff77c558c3f06dcefef`
and `361f47ca19d592adcc66ff2cb591686ad785fea157b295648738bed6921a68df`.
The byte-exact source seed and SHA3-256 digests of the expected 1952-byte public
and 4032-byte private outputs are checked in the unit test.

The environment-gated official signing case is external-interface,
deterministic ML-DSA-65 sigGen group 3, case 41 from the same pinned commit. It
has an 11-byte context and one-byte message and requires byte-exact agreement
with the 3309-byte NIST result. The source sigGen prompt and results JSON
SHA-256 digests are `447749d72817b211160d243311ce32302f3023e59c355b0f70be2bd3e9e7830d`
and `228d011bbe274aeb93e22eea1e0d57b78f43795cf6a64fb5ef1e626485a0bedb`.
The extracted private key, context, message, and signature fixture digests are
respectively `1777657b3fd18f02b5e781690f61680f1914c8b9f49698a3b65fb0a7b833d050`,
`d7770ef2edf94daf1aa5be608d785a716d64f5c611e7bea2fb55d39457f18c74`,
`8a331fdde7032f33a71e1b2e257d80166e348e00fcb17914f48bdb57a1c63007`,
and `f85739f53adb1cf03dacd390cddb586c3c8ba80067113ac4a4f055c58222239e`.
Official external-interface sigVer coverage uses accepted group-3 case 33 and
rejected group-3 case 31 from the same pinned commit. The sigVer prompt and
results JSON SHA-256 digests are
`e2cba4589389756fa0bea1a7e6837138bf0a81f9d14234c9ee8f6d33caa1654e`
and `e1d84ef1b2f35196278ab0b0ed6a46ec62cc03d2dfa92c564199e1999bfb8ea6`.
For accepted case 33 the public-key, context, message, and signature fixture
digests are `d190a6a6d0d8438b195f4d32e6ed1d236d10709ed6fbca47306efb5ada1468e1`,
`a9ce73821e80cdf934513ee95d4002924d5c06173ef1766b5e9672acf72330ba`,
`6923837e5fe3d3d73e22d92f0b244c1ff836abf21a2e9fc95610ece693f72664`,
and `57d8384ce083b170a117b13172b9b712cbd944ba349a1598ac5e69526786f9e8`.
For rejected case 31 they are
`abb1fcf6f209eba69f6a2ce2d5510a6487584a36ca543783df5f338bd386c725`,
`6d3691bf6aed51fd7966cad29768eac16ac51734b2cd11da4f3c8b98238abd7e`,
`0a5e13852a9376b1c83297e502c09664c35a4d1a13c7fd0f0feef90ae98834ed`,
and `532646784cd450f22ad9c7a0f89f4651ac95eaaa9348b2812e6d6ba076d27df5`.
Fixtures stay test-only and are loaded only when
`MRML_ACVP_MLDSA65_SIGVER` is configured. Local regressions supplement the
ACVP suite by proving that equal cumulative hint counts (including all-zero
hint rows) are accepted by canonical hint decoding and that a coefficient
exactly at the strict `gamma1 - beta` bound is rejected.

## FIPS 204 potential-updates audit

NIST's official FIPS 204 publication page linked the 2026-07-31
`fips-204-potential-updates.xlsx` planning note. NIST labels these items as
potential corrections, not official changes, and states that they introduce no
new technical requirements. The implementation-relevant items map as follows:

- the corrected challenge transcript is `mu || w1`; signing and verification
  independently hash those values in that order;
- Montgomery reduction treats the low word as signed through the `i32` cast,
  sign-extends it to `i64`, and its callers stay inside the algorithm's
  exclusive input bound;
- malformed signature encoding produces `InvalidSignature`, the public API's
  fail-closed verification result;
- for ML-DSA-65, corrected Algorithm 40 has upper range
  `(q - 1) / (2 * gamma2) - 1 = 15`; `use_hint` wraps with `& 15`, and a focused
  regression pins that relationship; and
- the fixed internal signing bound is 4,096 attempts, exceeding the corrected
  minimum allowable limit of 821, with a regression preventing accidental
  reduction below that minimum.

The remaining workbook items correct specification prose, notation, links, or
the reference pseudocode's unused definitions and do not change this
implementation. Evidence is source mapping plus the mandatory NIST ACVP and
pinned OpenSSL fixtures described above; it is not a NIST validation
certificate or independent cryptographic review.
