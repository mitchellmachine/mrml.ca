# Native Windows and Linux release test run

Source fixes verified through `66feb3df`, 2026-11-26. The pinned oracle was
Rust `nightly-2026-11-26`, commit `6c709eb428d472a3c3d93681c1ba37d44a1c27cf`.
Windows used native x86-64 gnullvm without MSVC or the Windows SDK. Linux
used Arch WSL2 on kernel `6.18.58.1-microsoft-standard-WSL2`.

| Host | Selected packages with successful final result | Test harness results | Ignored by the harness |
| --- | ---: | ---: | ---: |
| Native Windows | 61 | 4,352 passed | 16 |
| Arch WSL2 | 63 | 4,565 passed | 27 |

Counts combine each package's latest successful run, not the sum of all
attempts. Some test targets contain no test functions. Ignored tests include
explicit performance and external-oracle tests, and child fixtures invoked by
parent tests. A conditional test marked OK by the harness does not by itself
prove its hardware branch executed.

## Commands and reruns

Started with `cargo build --locked`, then the canonical release commands:

```powershell
. .\tools\toolchain\setup-oracle.ps1
$env:Path = "$(rustc --print sysroot)\bin;$env:Path"
.\target\debug\mrml.exe test --all --target windows --release
```

```sh
./target/debug/mrml test --all --target linux --release
```

The initial Windows command stopped at a cross-platform certificate build
error and the initial Linux command stopped at a flaky certificate test. The
remaining host-selected packages were exercised individually with
`mrml test PACKAGE --target windows --release` or
`mrml test PACKAGE --target linux --release`, continuing past failures.
Affected packages were rerun after their fixes. This is full coverage of the
selected host packages with individual reruns, not a single green
post-fix `--all` invocation.

## Findings and verified fixes

- **Windows certificate and server:** the certificate signer and Linux config
  parser now share the same exact identifier-set digest. Unix peer credentials
  remain Linux-only. A new digest golden and the exact-name CSR rejection tests
  passed; Windows had 126 certificate tests and four server tests passing.
- **Windows Git and runtime:** Windows directory flushing uses a real native
  non-reparse directory handle and reports a rejected flush as an error.
  Trusted client paths remain distinct from retained Linux authority handles.
  The Git suite passed 225 library and five CLI tests; the runtime suite passed
  51. The protected-push journal rejected replacement, reopened the original
  record and removed it. An unsigned disposable SHA-256 repository initialized,
  staged and committed with the native Windows executable and passed stock
  `git fsck --strict`. This is not a Windows Gitd/authority-server port or
  evidence of power-loss durability on every Windows filesystem.
- **Linux certificate:** the TLS-ALPN test now joins the thread that owns the
  temporary signing provider before asserting key retirement. The tamper
  fixture now flips a ciphertext bit rather than overwriting it with a
  constant that could already be present. All 150 library and seven daemon
  tests passed; each repaired test also passed 20 consecutive reruns.
- **Linux Git:** Git authority, Gitd and Git were rerun as an unprivileged
  user. The earlier root attempts correctly failed non-root ownership gates;
  the guards were not relaxed. The final Git, authority and Gitd package tests
  passed with the same retained-directory backend.
- **Virtualization:** native WHP reported `HypervisorPresent=1`; its package
  passed 27 tests and its runner passed 12. WSL2 KVM initially rejected
  `KVM_SET_SREGS` with `EINVAL` during five live guest preparations. Installing
  the existing one-vCPU CPUID profile before register configuration fixed the
  failures. The KVM package passed 24 tests, including the new live regression,
  and the runner passed 16. The manual mapping-performance test for each
  backend stayed ignored. This is hosted/nested evidence, not bare-metal
  certification.

The workspace manifest and lock checks passed. At the time of this full run,
repository-wide assurance stopped at AES-GCM unsafe-policy drift, independently
of the host test totals. A follow-up changed GHASH to pass its SIMD input lanes
by value, removing two raw loads. The strengthened differential test covers
both 64-bit lane boundaries, zero, and all-ones inputs; the crypto package
passed 56 release tests on native Windows and 56 on Arch WSL2. See
[Project status](PROJECT_STATUS.md#workspace-checks-and-generated-inventories)
for the remaining assurance blocker. Patent review: **NOT_TRIGGERED**; the fixes reuse
existing platform and project mechanisms. See the [review log](patents/REVIEW_LOG.md).
