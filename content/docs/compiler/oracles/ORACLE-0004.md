# MRML Rust oracle generation 0004

## Identity

- rustup toolchain: `nightly-2026-11-26`
- rustc version: `rustc 1.102.0-nightly`
- full commit: `6c709eb428d472a3c3d93681c1ba37d44a1c27cf`
- source/build date: `2026-11-25`
- MRML verification date: `2026-11-26`
- LLVM version: `23.1.6`
- edition/default behavior: Rust 2024 remains the MRML edition floor. Existing mapped upstream tests keep their declared/default editions.

The dated distribution matches the previously installed Windows nightly exactly.
The previous oracle records remain unchanged. Historical linker and archive
probes that intentionally name the August toolchain remain pinned to that
observation point; this generation does not supersede their results.

## Differential compiler corpus at oracle adoption

The same MRML revision was checked against ORACLE-0003 and ORACLE-0004 on
native Windows (`x86_64-pc-windows-gnullvm`) and Arch Linux under WSL2
(`x86_64-unknown-linux-gnu`, Microsoft kernel `6.18.58.1`).

| Host | ORACLE-0003 baseline | ORACLE-0004 candidate |
| --- | --- | --- |
| Native Windows | 1,339 passed; driver blocked | 1,339 passed; same driver blocker |
| Arch WSL2 | 1,357 passed | 1,357 passed |

The tests exercise compiler core, component interfaces, conformance, nightly
replacement behavior, differential semantic execution, and the compiler
driver. No regression was observed in the completed corpus. On Windows, both
versions fail to build the driver dependency `org.mrml.library.runtime`:
Windows `NativeFile` lacks `lock_exclusive` and `set_owner_mode` (`E0599`).
No Windows driver tests ran during this baseline comparison. No compiler
semantics were changed as part of the upgrade.

For subsequent native Windows runtime and driver results, see the current
[compiler checkpoint](../CHECKPOINT.md#hosted-windows-file-operations).

From the repository root, with the matching dated host toolchain selected:

```sh
cargo build --locked
./target/debug/mrml test org.mrml.compiler.core --target linux --release
./target/debug/mrml test org.mrml.compiler.driver --target linux --release
```

```powershell
$env:RUSTUP_TOOLCHAIN = "nightly-2026-11-26-x86_64-pc-windows-gnullvm"
$env:Path = "$(rustc --print sysroot)\bin;$env:Path"
cargo build --locked
.\target\debug\mrml.exe test org.mrml.compiler.core --target windows --release
.\target\debug\mrml.exe test org.mrml.compiler.driver --target windows --release
```

Both hosts also compiled and ran a Rust 2024 `u128` rotation smoke test with
the candidate. These results do not establish new Polonius, trait-solver,
unstable-feature, ABI-completeness, WHP, Hyper-V, VBS, KVM, UEFI, bare-metal,
or physical-hardware claims. Patent review: `NOT_TRIGGERED`.
