# Protected signer generation-state validation — 2026-09-03

Status: hosted Linux container evidence, not physical-hardware or production-key
evidence.

The test used commit `4b50fd4c` and the release-mode
`mrml-git-protected-signer` binary. The image was built as
`localhost/mrml/git-protected-signer:generation-state-test`; Podman reported
image ID
`bb842b489a84631845ac43038949f71bc3b7d229de7458b4e6bcc28f6368d87b`.
The authority public receipt verifier was obtained through
`describe-receipt-verifier`; no receipt private key was exported.

The signer ran as `21006:21006`, with supplemental socket group `21906`,
`network=none`, a read-only root filesystem, all capabilities dropped, a
32-process limit, 512 MiB memory limit, and only the four existing disposable
named volumes for keys, state, channel material, and its socket. No host
directory was mounted.

An independently launched client probe ran as `21007:21007` with only group
`21906` and its separately owned channel-capability volume. The authenticated
v2 health exchange returned `ready`. A separate permissions probe established
that UID 21007 could neither read nor write `generation.state` and could not
write its parent state directory. Metadata inspected from a root-owned helper
showed the state file as `21006:21006`, mode `0600`, and exactly 64 bytes.

Restarting only the signer container preserved the named state volume. The
daemon reopened the state and the cross-UID authenticated health probe again
returned `ready` without changing bootstrap arguments. Runtime inspection
reported:

```text
running network=none readonly=true user=21006:21006 pids=32 memory=536870912
```

Focused source evidence was also run sequentially:

```text
cargo fmt --all -- --check                                      PASS
cargo run --quiet -- test org.mrml.tool.git --target linux      PASS
  library: 239 passed
  CLI: 4 passed
  protected signer: 7 passed
sh deploy/compose/test-compose-signer.sh                         PASS
cargo run --quiet -- build org.mrml.tool.git --target linux --release  PASS
```

The signer tests cover authenticated operation framing, capability and session
binding, exact authority/repository/generation verification, durable atomic
replacement and reopen, restart persistence, and old-receipt rejection. This
record does not claim that the required three-push live sequence has passed;
that remains part of the complete named-volume stack acceptance run.

Patent review: **NOT_TRIGGERED**. See `docs/patents/REVIEW_LOG.md`.
