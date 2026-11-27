# Verify every MRML commit

The published `main` branch of [mitchellmachine/mrml](https://github.com/mitchellmachine/mrml)
uses SHA-1 Git object IDs and Ed25519 SSH commit signatures. These are separate
properties: SHA-1 identifies the Git objects; the SSH key authenticates the
signed commit payload.

The expected **commit-signing** fingerprint is:

```text
SHA256:mFsQ01MZkR4L6R7ptdY6g+GL688TqAzcfHCXQxRCkyc
```

This is not the SSH key used to authenticate pushes to GitHub. Confirm the
fingerprint through an independent channel you trust before relying on it. A key
checked into the same repository is convenient, but is not independent proof of
who controls it.

## Verify the published history

Use Git 2.34 or newer and OpenSSH with SSH signature verification support. Run
these commands in a POSIX shell, such as Git Bash on Windows. Start with a full
clone so the audit covers the complete parent history:

```sh
git clone --single-branch --branch main https://github.com/mitchellmachine/mrml.git
cd mrml
```

Run the following from that checkout. It checks the latest fetched GitHub
`main` and every commit reachable from it, including merged history. It does not
check unrelated local branches, tags, or unpublished references.

```sh
(
    set -eu
    expected='SHA256:mFsQ01MZkR4L6R7ptdY6g+GL688TqAzcfHCXQxRCkyc'
    signers="$(mktemp)"
    results="$(mktemp)"
    trap 'rm -f "$signers" "$results"' EXIT

    git fetch origin refs/heads/main
    tip="$(git rev-parse --verify 'FETCH_HEAD^{commit}')"
    test "$(git rev-parse --is-shallow-repository)" = false
    git fsck --full --strict

    git show "$tip:docs/keys/mrml-ssh-allowed-signers" >"$signers"
    test "$(wc -l <"$signers" | tr -d '[:space:]')" = 1
    actual="$(ssh-keygen -E sha256 -lf "$signers" | awk '{print $2}')"
    if test "$actual" != "$expected"; then
        printf 'Unexpected signing-key fingerprint: %s\n' "$actual" >&2
        exit 1
    fi

    git -c gpg.format=ssh -c log.showSignature=false \
        -c gpg.ssh.allowedSignersFile="$signers" \
        log --format='%H %G? %GF' "$tip" >"$results"

    count="$(git rev-list --count "$tip")"
    awk -v expected="$expected" -v count="$count" '
        $2 != "G" || $3 != expected {
            print "Missing, invalid, or unexpected signature on " $1 > "/dev/stderr"
            failed = 1
        }
        END {
            if (NR == 0 || NR != count || failed) exit 1
            print "Verified all " NR " commits."
        }
    ' "$results"
)
```

The audit is read-only with respect to commits. It needs no private key,
passphrase, SSH agent, or GnuPG keyring. Success means each audited commit has
a valid signature from the pinned key. It does not establish that the code is
safe, that every change was authorized, or that GitHub exposed all history.

## Older history and MRML's in-tree verifier

The GitHub migration rewrote and re-signed the published history, changing
commit IDs. Older checkouts may contain different commit IDs and OpenPGP
signatures. The checked-in OpenPGP key and MRML's in-tree OpenPGP verifier are
separate from this SSH audit; they do not verify the new GitHub history.
