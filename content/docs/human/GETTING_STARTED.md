# Getting started with MRML

MRML is an experimental research repository. You can inspect and build it
without installing or booting an operating system image. These are native
Windows and Linux host tools. They do not provide a native execution mode
inside MRML OS. x86-64 is the primary OS bring-up target; macOS host support
and ARM64 support are planned.

## 1. Get the source

Clone the canonical repository and enter it:

```sh
git clone https://github.com/mitchellmachine/mrml.git
cd mrml
```

Before trusting a checkout, follow [Verify commits](VERIFY_COMMITS.md).

## 2. Read the project boundaries

Start with the [Overview](OVERVIEW.md). Before making changes, read the root
`AGENTS.md`, [MRML values](../../VALUES.md), and the documents required there
for the subsystem you plan to change. The
[Documentation guide](DOCUMENTATION.md) helps locate them.

Do not interpret a design document as proof of implementation. Use source,
tests, and dated evidence to determine what works.

## 3. Select the pinned Rust toolchain

The repository provides an idempotent setup script. On Linux, run:

```sh
source tools/toolchain/setup-oracle.sh
```

In PowerShell, run:

```powershell
. .\tools\toolchain\setup-oracle.ps1
$env:Path = "$(rustc --print sysroot)\bin;$env:Path"
```

These scripts check the existing setup before making changes. The repository's
toolchain lock is authoritative; do not silently substitute a newer compiler
for release or oracle work. On Windows, the script selects Rust's x86-64
GNU/LLVM target (`gnullvm`) and its `rust-mingw` component. Adding the sysroot's
`bin` directory lets test binaries find the toolchain's runtime DLLs. The
Windows checks below do not require MSVC or the Windows SDK.

## 4. Bootstrap the build tool

Cargo is used only to bootstrap the repository-owned `mrml` frontend:

```sh
cargo build --locked
```

The executable is `target/debug/mrml` on Unix-like hosts and
`target\debug\mrml.exe` on Windows. Normal repository operations should use
this frontend rather than treating Cargo as a second public build system.

To inspect the configured workspace, run:

```sh
./target/debug/mrml doctor
```

## 5. Run checks appropriate to your change

Begin with the repository assurance check:

```sh
./target/debug/mrml assurance check
```

A repository-wide assurance failure is separate from a focused test result.
See the [compiler checkpoint](../compiler/CHECKPOINT.md#hosted-windows-file-operations)
for the known unsafe-policy blocker. Use [Project status](../PROJECT_STATUS.md)
for checks and evidence across the rest of the workspace.

Then run the focused tests for the files you changed. Broader Linux validation
can be requested through the frontend:

```sh
./target/debug/mrml test --all --target linux --release
```

For the focused native Windows runtime and compiler checks, use PowerShell:

```powershell
.\target\debug\mrml.exe test org.mrml.library.runtime --target windows --release
.\target\debug\mrml.exe test org.mrml.compiler.driver --target windows --release
.\target\debug\mrml.exe test org.mrml.compiler.core --target windows --release
```

See the [compiler checkpoint](../compiler/CHECKPOINT.md) for the exact test
results and their limits.

Some checks require particular hardware, firmware, virtualization support, or
credentials. A skipped or unavailable environment is not a passing result.
Record the exact command and outcome, and claim only what was exercised.

For the full host-compatible Windows suite, run
`target\debug\mrml.exe test --all --target windows --release` in PowerShell
(use `./target/debug/mrml test --all --target linux --release` on Linux).
WHP, Hyper-V, and VBS probes require native Windows and their own host
prerequisites. Wine does not provide Windows VMM coverage. See the
[full platform test record](../PLATFORM_TESTS.md) for the latest package results
and how the fail-fast runs were continued.

## 6. Understand build outputs

Native MRML artifacts are placed under `target/mrml-native/`. Build, package,
sign, release, and image creation are distinct stages. An artifact filename or
extension does not establish its identity or trust.

For the complete build model, read
[Build system](../build/BUILD_SYSTEM.md). For package extensions, read
[Artifact extensions](../packages/ARTIFACT_EXTENSIONS.md).

## Next steps

- Read [Contributing](CONTRIBUTING.md) before changing the repository.
- Follow [Roadmap](../ROADMAP.md) for dependency-ordered OS work.
- Use [Recovery](../RECOVERY.md) when resuming work without reliable context.
