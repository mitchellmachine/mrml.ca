# Getting started with MRML

MRML is an experimental research repository. You can inspect and build it
without installing or booting an operating system image.

## 1. Get the source

Clone the canonical repository and enter it:

```sh
git clone https://git.mrml.ca/mitchellrenouf/mrml.git
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
```

These scripts check the existing setup before making changes. The repository's
toolchain lock is authoritative; do not silently substitute a newer compiler
for release or oracle work.

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

Then run the focused tests for the files you changed. Broader Linux validation
can be requested through the frontend:

```sh
./target/debug/mrml test --all --target linux --release
```

Some checks require particular hardware, firmware, virtualization support, or
credentials. A skipped or unavailable environment is not a passing result.
Record the exact command and outcome, and claim only what was exercised.

Do not attempt local WHP, WHPX, Hyper-V, or VBS testing from Wine. Windows
toolchain execution under Wine provides toolchain coverage only.

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
