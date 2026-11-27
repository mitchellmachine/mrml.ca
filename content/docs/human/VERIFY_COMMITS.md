# Verify every MRML commit

MRML commits are expected to carry a valid OpenPGP signature from the project's
commit-signing key. The procedure below checks every commit reachable from every
local or fetched reference. It stops if a commit is unsigned, has a malformed or
cryptographically invalid signature, or was signed by another key.

The expected primary-key fingerprint is:

```text
6EE7 5495 B042 7A4F 3F97  BA1C 14D7 0434 990F 1CA9
```

Do not replace this fingerprint merely because another key claims the same name
or email address. Confirm it through an independent channel that you trust.

## Current history limitation

The repository contains historical commits that predate mandatory signing. The
strict procedure below therefore reports those commits as unsigned and exits
with failure. This is intentional: an unsigned commit cannot be authenticated
with the public key, and documentation must not describe it as verified.

Retrofitting signatures would rewrite commit objects and change their IDs. This
guide does not instruct readers to rewrite history. It instead provides an
exhaustive audit: success means 100% of reachable commits passed, while any
unsigned, invalid, or differently signed commit prevents that claim.

The procedure in sections 1 through 3 intentionally uses host Git and GnuPG as
an independent interoperability audit. Those programs are not runtime
dependencies of MRML's in-tree OpenPGP implementation.

## 1. Obtain a complete repository

Start with a normal clone and enter it:

```sh
git clone https://git.mrml.ca/mitchellrenouf/mrml.git
cd mrml
```

If an existing checkout is shallow, make its available history complete first:

```sh
if test "$(git rev-parse --is-shallow-repository)" = true; then
    git fetch --unshallow origin
fi
```

Fetch every reference advertised by the server into a separate local namespace.
This includes branches, tags, and other advertised reference families without
overwriting the checkout's own branches:

```sh
git fetch --prune origin '+refs/*:refs/verification/origin/*'
```

This can verify only objects and references the server provides. A server cannot
provide deleted history or references that it deliberately hides from clients.

## 2. Import only the documented key

Use a temporary GnuPG home so personal keys, trust settings, and key-server
configuration cannot affect the result:

```sh
VERIFY_GNUPGHOME="$(mktemp -d)"
chmod 700 "$VERIFY_GNUPGHOME"
export VERIFY_GNUPGHOME
trap 'rm -rf "$VERIFY_GNUPGHOME"' EXIT HUP INT TERM

gpg --homedir "$VERIFY_GNUPGHOME" --batch \
    --import docs/keys/mrml-commit-signing-key.asc

gpg --homedir "$VERIFY_GNUPGHOME" --batch --with-colons \
    --fingerprint 6EE75495B0427A4F3F97BA1C14D70434990F1CA9
```

Inspect the final command's `fpr` record and confirm that it contains exactly
`6EE75495B0427A4F3F97BA1C14D70434990F1CA9`.

## 3. Check repository integrity and every reachable commit

Run the following block from the repository root. It obtains the complete,
deduplicated commit set from all references, asks GnuPG to validate each
signature, and requires the signature's primary key to match the fingerprint
above. A signing subkey is accepted only when GnuPG binds it to that primary
key.

```sh
set -eu

expected=6EE75495B0427A4F3F97BA1C14D70434990F1CA9
commit_list="$(mktemp)"
status_file="$(mktemp)"
trap 'rm -f "$commit_list" "$status_file"; rm -rf "$VERIFY_GNUPGHOME"' \
    EXIT HUP INT TERM

git fsck --full --strict
git rev-list --all >"$commit_list"

test -s "$commit_list" || {
    echo "No reachable commits were found." >&2
    exit 1
}

while IFS= read -r commit; do
    if ! GNUPGHOME="$VERIFY_GNUPGHOME" git verify-commit --raw "$commit" \
        > /dev/null 2>"$status_file"; then
        echo "Invalid or missing signature on $commit" >&2
        cat "$status_file" >&2
        exit 1
    fi

    primary=$(
        awk '/^\[GNUPG:\] VALIDSIG / {
                 fingerprint = $3
                 primary = ($12 == "" ? fingerprint : $12)
             }
             END { print primary }' "$status_file"
    )

    if test "$primary" != "$expected"; then
        echo "Commit $commit was signed by unexpected key $primary" >&2
        exit 1
    fi
done <"$commit_list"

count="$(wc -l <"$commit_list" | tr -d ' ')"
echo "Verified all $count commits reachable from all local and fetched refs."
```

Any nonzero exit means verification did not complete successfully. Do not treat
a partial count as success. Re-fetch and repeat the entire procedure whenever
the remote references change.

## In-tree signing and verification architecture

The in-tree path separates Git object handling, OpenPGP verification, and
private-key authority:

- The Git library constructs the exact unsigned commit or annotated-tag payload
  and accepts a bounded detached-signature callback. Verification reconstructs
  that same payload and passes it to a verifier callback. This keeps key custody
  out of repository serialization code.
- A standalone MRML OpenPGP library parses the checked-in version-4
  Ed25519Legacy public key and binary-document detached signatures and performs
  cryptographic verification. It pins the exact primary fingerprint
  `6EE75495B0427A4F3F97BA1C14D70434990F1CA9`; a matching user ID, email, short
  key ID, or signing-subkey ID is insufficient. This narrow parser extracts the
  pinned primary key; it does not authenticate OpenPGP self-certifications,
  subkeys, certificate revocations, or user IDs.
- The host loopback provider exercises the bounded detached-signing interface
  codec in process. Generation 1 is exact: version-4 Ed25519Legacy
  binary-document ASCII armor, a Git commit or annotated-tag purpose, one of
  SHA-256/SHA-384/SHA-512, and the expected 20-byte primary fingerprint. The
  provider chooses signature time from its trusted time source and validates the
  selected Git payload grammar. In a deployed runtime service, a separately
  delivered generational endpoint capability—not a key name or request field—
  must carry authority attenuated to the exact fingerprint, purposes, and
  digests.
- Public-key description uses a separate route and right. The use-only
  interface cannot provision, import, rotate, revoke, destroy, or export a
  secret key, and it is explicitly unsuitable for one-time Lamport keys.

The normal in-tree path does not execute GnuPG, use a GnuPG home or agent, read
an ambient keyring, contact a keyserver, or depend on host Git. The
runtime-facing detached-signing interface is designed for an authorized service
route and does not expose a seed. The host provider and a future isolated MRML
provider share this wire boundary; this work does not claim that the isolated
provider is deployed.

The host tool has a separate, explicit bootstrap for development and repository
maintenance. Its full syntax is:

```sh
./target/mrml-native/linux/debug/mrml-git signing configure-openpgp \
    SEED [PUBLIC_KEY [FINGERPRINT [sha256|sha384|sha512]]]
```

`SEED` names a file containing exactly 32 raw Ed25519 seed bytes, not hex,
Base64, or OpenPGP armor. The tool stores the path as
`gpg.openpgp.privateSeedFile`, not the seed bytes. If omitted, `PUBLIC_KEY`,
`FINGERPRINT`, and the digest default to the checked-in project key, the exact
fingerprint above, and SHA-512. Configuration parses the public key, requires
the selected fingerprint, derives the public key from the seed, and rejects a
mismatch. Each signature crosses the in-process implementation of the same
bounded service interface and is independently verified before use. The current
project key has an owner-policy signing cutoff of Unix time `1851111680`.
`gpg.openpgp.revoked = true` is an explicit blanket owner-policy revocation;
certificate packets do not silently override this local generational policy.

Owned seed buffers and the signing-key copy receive best-effort volatile erasure
with a compiler fence on their controlled paths. That is not a formal guarantee
that compilers or hardware retain no copies.

The configured seed file remains owner-managed secret material; volatile buffer
erasure is not evidence of secure deletion, register/cache clearing, swap
exclusion, crash-dump exclusion, or hardware-protected custody. Do not use this
host bootstrap as evidence for the stronger isolated-service signing design.

The repository object format and OpenPGP digest are independent choices:

- SHA-1 Git repositories store commit armor in `gpgsig`.
- SHA-256 Git repositories store commit armor in `gpgsig-sha256`.
- Annotated tags append the detached armor to the unsigned tag payload, as Git
  specifies, rather than using either commit header.
- The OpenPGP layer accepts SHA-256, SHA-384, and SHA-512 signature digests. It
  does not infer the signature digest from the Git object format.

The SHA-1 operation used to calculate this version-4 OpenPGP key's fingerprint
is likewise part of that key format and is not the Git repository object hash
or the signature digest. Supporting a SHA-256 Git repository therefore neither
changes the pinned fingerprint nor requires an SHA-256 OpenPGP signature.
Version-4 Ed25519Legacy exists here for compatibility with the selected current
key; it is not MRML's format for provisioning new long-lived trust roots.

## Focused verification with the in-tree Git tool

Build the tool and verify one selected commit from the repository root:

```sh
./target/debug/mrml build mrml-git --target linux
./target/mrml-native/linux/debug/mrml-git signing verify HEAD
```

Verification needs only the checked-in public key and exact fingerprint; it
does not read the private seed. This command checks the selected local object.
It does not fetch hidden references or replace the exhaustive all-reference
procedure above.

## Evidence and present limits

The focused source tests cover SHA-1 and SHA-256 commit framing, the respective
`gpgsig` and `gpgsig-sha256` headers, annotated-tag framing, bounded generic
signer/verifier callbacks, SHA-256/SHA-384/SHA-512 digest primitives, Ed25519
verification edge cases, the RFC 9580 Ed25519Legacy OpenPGP vector, and
sign/verify round trips for every supported digest. A disposable GnuPG 2.4.9
oracle also accepted standalone signatures for all three digests; GnuPG remains
test-only and is not an MRML dependency.

## Nested ML-DSA-65 plus OpenPGP commits

The in-tree library can construct a hybrid commit by signing the canonical
unsigned payload with original MRML ML-DSA-65 code, storing that signature in a
bounded `mrml-mldsa65` continuation header, and then signing the resulting
payload with original MRML OpenPGP code. The outer signature remains in Git's
standard `gpgsig` or `gpgsig-sha256` header, so unmodified Git/GnuPG verifies
the OpenPGP coverage including the ML-DSA header. MRML hybrid verification
requires the outer signature first and then reconstructs and verifies the
inner canonical payload; accepting only the outer signature is not hybrid
verification.

`org.mrml.interface.security.ml-dsa-signing@1` provides the bounded ML-DSA
signing-use and public-description boundary for a future isolated service. Key
unlocking remains outside both signing protocols. Host tools may retain an
already-unlocked, workspace-scoped signing key for a 15-minute idle timeout and
one-hour absolute timeout through `UnlockedSigningKeyCache`; the cache never
stores or returns a passphrase, fails closed on clock rollback, and supports
explicit lock.

This is library and host-test evidence. It does not demonstrate a production
signing-provider deployment, hardware-protected secret custody, physical
hardware behavior, or successful verification of every historical commit. The
OpenPGP library's whole-message bound is intentionally sized for Git metadata,
not kernels, packages, or system images. Its projected UEFI/no-`std` build is
compile evidence only; it is not an early-boot or recovery integration result.
The repository's unsigned historical commits still prevent the exhaustive
procedure above from succeeding, and a focused object test cannot detect
references that a server withheld. The in-tree remote fetch path currently
installs advertised branch references only: it validates peeled annotated-tag
advertisements but does not install tag references. Synthetic tag framing tests
are not evidence that any current release tag is signed. Do not describe those
unevidenced properties as implemented or verified.

## What this verification proves

A successful result proves that the fetched Git objects are internally
consistent and that every reachable commit has a cryptographically valid
signature chaining to the documented public key. It also detects commits signed
by any other key, including a key with a matching user ID.

It does not prove that the signer was authorized for every change, that the
signer's computer or private key was never compromised, that the code is safe or
correct, or that the server disclosed every historical reference. OpenPGP also
does not establish the real-world identity behind a key by itself. Establishing
that identity requires independently authenticating the fingerprint, and
assessing the software still requires review, reproducible builds, and relevant
testing.
