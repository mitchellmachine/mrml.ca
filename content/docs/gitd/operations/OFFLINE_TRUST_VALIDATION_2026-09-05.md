# Offline Git trust-root validation — 2026-09-05

Status: **TESTED locally**. This proves the bounded bootstrap and its hostile
input cases on Linux, not the final hardened Compose deployment. The normal
release builder's clean-source and fresh transfer-evidence requirements remain
in force. See [OFFLINE_TRUST_ROOT.md](OFFLINE_TRUST_ROOT.md) for format,
provisioning, limits and the separate owner-selected trust root.

Base HEAD: `20ecf53e213d1211e2ea41865e1df31cdc59d9a731e29f46c046a3ad5e09d3f5`.
This is a dirty-checkout test including preserved pre-existing changes.
The final package-file inventory digest (tracked **and untracked** sources) is
`3cbad1fff95c7bac2e329e4000b8a13a24ee8c0b1a13d51aa20f8befbb9de509`, produced by:

```sh
git ls-files -z --cached --others --exclude-standard -- packages |
  sort -z | xargs -0 sha256sum | sha256sum
```

Rust oracle: `rustc 1.100.0-nightly (17fd5b8a3 2026-08-28)`, full commit
`17fd5b8a37b6667b6cc137f3cc35f09759768a3b`, LLVM 23.1.0. The installed executable
is `/usr/bin/rustc`; the initial explicit CLI test used a nonexistent
`/home/m/.cargo/bin/rustc` and failed setup, then was corrected.

## Defect and fixes

The actual old shell verifier accepted five cosign signatures made by a
substituted bundle key even when an independent owner key was supplied as its
second argument. It also executed three bundle policy helpers. The red
regression used compiled Rust helper stand-ins, not production services or
private owner keys. Log `/tmp/mrml-release-legacy-red.log`, SHA-256
`ec3da002c916056bf03cd75e46f7ed33bbb9c0f51036b5cc200b82b54164db2c`.

The replacement authenticates a complete file manifest using an explicit
external key. It never executes bundle helpers during verification, extracts
only bounded file-only USTAR, hashes the bytes copied into private staging,
checks source and image-lock metadata against those exact signed hashes, and
rejects conflicting existing Docker tags before loading. It checks expected
immutable IDs and tags again afterward. Tool paths and private-directory
ancestors are checked independently of bundle ownership; original executable
aliases in shared writable directories are denied.

## Commands and results

```sh
target/release/mrml test org.mrml.tool.git --target linux --release
target/release/mrml test org.mrml.tool.git --target linux --release --sanitizer address
```

Both final suites passed: **291 library + 5 Git CLI + 9 signer + 2 credential
agent + 2 release CLI tests**. The library's independent compression oracle and
two release CLI environment gates remain explicitly ignored by default; the
current release oracle was separately enabled below. The compression oracle
was run in checkpoint B. The legacy red gate records the old wrapper defect;
running a missing installed launcher after the fix would not replace that red
evidence.

Eight core archive tests cover deterministic complete inventories, file/mode
tampering, missing/extra entries, unsafe links/modes, malformed manifests,
roundtrip/copy, same-inode mutation, retained-descriptor pathname replacement,
signature metadata mutation, checksum/footer/duplicate/link/PAX/traversal
rejection, and hostile destination parents. Two ordinary CLI tests cover
bounded image-version grammar and exact path containment.

Cosign: `v3.1.0+dirty`, commit
`d253adffe00042d99e7bd7cdcd1d6d2abc3d750d`, Go 1.26.4, Linux/amd64.
The installed `/usr/bin/cosign` is owned by UID 65534 on this development host,
so the explicitly selected tool was copied into an owner-private trusted
directory for this test. Both copies have SHA-256
`ddc39e595d95f05a4bbddce66a59fc313bd6c56ee27dff1b0021f4f2094bbc73`.

```sh
MRML_RELEASE_TEST_BINARY=/home/m/mrml/target/mrml-native/linux/release/mrml-git-release \
MRML_RELEASE_TEST_RUSTC=/usr/bin/rustc \
MRML_RELEASE_TEST_COSIGN=/tmp/mrml-completion-e-trusted/cosign \
target/mrml-native/linux/release/mrml-git-release_bin_tests --ignored --exact \
  release_cli_tests::external_release_key_and_every_signed_file_gate_docker_load --nocapture
```

**PASS**, 10.34 seconds, normal canonical release build. Log
`/tmp/mrml-git-completion-e-oracle-normal.log`, SHA-256
`0636989f52d828f686fb16c92bc861f10b4f359268cd5f9e0844e6f6399a4da9`.
The normal bootstrap SHA-256 is
`ffb938d743b3d99f671648c29b94cf3d283a71bd9a05d803ea5431e95478d8af`.

The same gate also **passed under ASAN**, 11.03 seconds. A test-only Rust
stand-in initially had an extra reference in a match expression; the corrected
test module was compiled as a focused harness against the canonical ASAN
libraries and run against the ASAN CLI. Exact focused harness build:

```sh
rustc --edition=2024 --test -Zpanic-abort-tests -Cpanic=abort \
  -Zsanitizer=address -Copt-level=3 \
  -L dependency=target/mrml-native/linux/release \
  --extern mrml_crypto=target/mrml-native/linux/release/libmrml_crypto.rlib \
  /tmp/mrml-release-cli-oracle-harness.rs -o /tmp/mrml-release-cli-oracle-harness
```

The harness contains only a path module declaration for the repository's
`release_cli_tests.rs`; the same environment and exact test filter above were
used with `/tmp/mrml-release-cli-oracle-harness`. Log
`/tmp/mrml-git-completion-e-oracle-corrected.log`, SHA-256
`a334996a60e2f71619f44fb6e2cd043889b90da21d7a75581c3782f2f29d1ea3`.

The real-signature gate covers a substituted key with internally valid
replacement signatures; modified Compose/helpers/images/evidence; missing,
extra and duplicate entries; signed wrong-source and malformed image-lock
metadata; signature/payload archive tampering and successful extraction;
bundle-provided key/tool and shared-directory tool substitution; conflicting
existing image tags; failed/malformed/multiple Docker lookup results; absent
tag success; and expected ID/tag checks after loading. Docker is an original
Rust stand-in in this test, so this is **not actual Docker image-import evidence**.
All signing keys are disposable test inputs. No bundle code is executed.

## Review and remaining limits

Agent implementer/reviewer/adversary roles were separate; review found and
corrected directory-owner bootstrapping, original executable alias races,
metadata reread binding, and ambiguous Docker lookup handling. This is not an
independent external audit. There is no declared Git/HTTP fuzz target; bounded
deterministic hostile tests and ASAN were executed, not coverage-guided fuzzing.

An initial cross-mount ancestor walk failed three core tests because `/tmp` is
a separate tmpfs on this host. Explicit owner-checked host mount prefixes now
work while nested payload traversal retains the capability boundary. Earlier
compile failures (error conversion, error formatting, nested test imports) are
retained in the numbered E logs; they are not passing evidence.

Actual remote transfer was rejected twice by automatic approval review despite
the documented deployment scope. No alternate route was used. The requested
transfer consisted only of five public Compose definitions and generated
nonsecret disposable settings; no source checkout or private inputs. Further
remote transfer awaits explicit approval. The existing Docker hardening and
real-certd startup blockers remain independent of this approval issue.

Patent review: **NOT_TRIGGERED**; see
[REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
