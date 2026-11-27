# Build and test coverage in CI

The GitHub Actions workflows in `.github/workflows/` use the oracle in
`rust-toolchain.toml` and check the recorded compiler commit. A workflow in the
tree is configuration, not evidence that GitHub ran it or that it passed.
Jobs use `ubuntu-latest` and `windows-latest`. The Set up job log records
the actual image and runner software versions.

- **Windows, native gnullvm:** build and test all Windows-admitted components.
  The stage-zero frontend uses GNU/LLVM without requiring MSVC or the Windows
  SDK. The Windows checkout also checks that tracked shell scripts are LF.
- **Linux, x86-64 GNU:** build and test all Linux-admitted components and run a
  separate AddressSanitizer sweep. No Windows toolchain or Wine substitutes for
  native Windows tests. Expanded CUDA checks build the host CUDA feature profile
  on both hosts and PTX for SM100 and SM120; these are compile-only.
- **MRML target:** build all MRML-target packages and all UEFI-target packages.
  `mrml test --all --target native` builds the relevant native component and
  runs its declared host test harness on the runner. Components without such
  a harness emit `NO_HOST_HARNESS`; they are not called passing native tests.
  A separate QEMU/OVMF TCG step builds a disposable boot fixture, creates and
  verifies its one-use signed release and requires the exact trace through native
  kernel entry. No owner keys or production deployment are used.

`--keep-going` attempts the rest of the selected packages when one fails and
still exits nonzero for the aggregate. Tests compile the selected declared
test/example/benchmark outputs; sample timings, ignored tests, conditional
external oracles and hardware-specific features are not automatically exercised.
macOS host support remains planned and is not covered by CI.
The matrix does not build every experimental feature combination and does not
prove hardware support, native guest userspace test coverage or release readiness.

## Optional hosted supervisor probe

After setting up the pinned oracle and running `cargo build --locked`, use
`bash tools/ci/test-native-supervisor-kvm.sh` on a Linux host with an accessible
`/dev/kvm`, or `pwsh -File tools/ci/test-native-supervisor-whp.ps1` on native
Windows with WHP. On Windows, keep the gnullvm oracle and its linker on the path
in the shell that starts the script. Each script builds a fresh probe, uses
three separate disposable signing keys, and requires the backend's exact
authorized restart proof within 60 seconds of guest execution. These scripts
are opt-in and leave ordinary hardware-independent CI unchanged. They verify
an authorized fresh service generation, not live FAT32 I/O after recovery.

For the FAT32 guest milestone, run
`python3 tools/ci/make-fat32-probe-image.py PATH` to create a new disposable raw
volume. It contains mirrored FATs and one file, `PROBE.TXT`, with the exact
bytes `MRML FAT32 recovery fixture\n`. The generator refuses an existing
output. This is a filesystem image, not boot media; attach it only to the
guest storage fixture with read-only block rights.

Before claiming all gates are green, check the run for the exact commit and
inspect any unavailable or ignored cases. In particular,
`mrml assurance check` remains a blocking check while the unsafe-policy backlog
is reviewed. `mrml assurance inspect` reports the full file-level backlog and
recognized unsafe attributes separately without passing or updating the gate.
