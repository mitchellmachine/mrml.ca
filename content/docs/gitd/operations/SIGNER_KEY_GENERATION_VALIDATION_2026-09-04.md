# Protected signer volume-native key generation — 2026-09-04

Status: implemented and verified with controlled non-production keys on local
Linux/rootless Podman and the authorized `mrml.ca` Linux/rootful Podman host.
This is not production-key, public-service, current protected-push, key-rotation,
physical-hardware, or independent-review evidence. No repository push was
performed.

## Implementation

Signed functional commit `4cdf8150` adds the signer binary's one-shot
`generate-key-material` operation and packages
`generate-git-signer-keys.sh` in the offline Git bundle. It draws independent
runtime entropy for the OpenPGP v6 seed and ML-DSA-65 keypair, derives the
OpenPGP public key inside the signer process, and writes only four fixed names
to one exact owner-controlled absolute directory. Outputs use exclusive create,
single-link regular-file checks, exact UID `21006`, exact `0400` private and
`0444` public modes, file synchronization, and directory synchronization.
Failure removes only outputs created in the initially empty trusted directory;
an existing output makes the operation fail closed without replacement.
Secret buffers and the OpenPGP signing-key object are erased on drop.

Signed commits `0c26f6cb` and `6970d8d9` make the wrapper use Docker's
`volume-nocopy` spelling or Podman's `:nocopy` spelling and require an explicit
`MRML_CONTAINER_RUNTIME=docker|podman` selection when the default Docker store
is not the intended store. There is no registry, bind mount, source checkout,
compiler, private-key upload, or general-purpose shell in the runtime image.

## Focused verification

```text
cargo fmt --all -- --check                                      PASS
cargo clippy --all-targets -- -D warnings                       PASS
git diff --check                                                PASS
sh -n deploy/compose/generate-git-signer-keys.sh                 PASS
deploy/compose/test-compose-signer.sh                           PASS
./target/debug/mrml test org.mrml.tool.git --target linux       PASS
  Git library: 273 passed
  Git CLI: 5 passed
  protected signer: 8 passed
  credential agent: 2 passed
```

The added signer test independently parses the generated OpenPGP public key,
re-derives it from the protected seed, signs and verifies with the generated
ML-DSA pair, verifies every exact size/owner/mode/link invariant, and proves a
second generation attempt neither succeeds nor replaces the seed.

## Exact container probes

The release signer binary was built from a clean detached worktree at
`4cdf8150`. The network-disabled image build produced:

```text
image: localhost/mrml/git-protected-signer:4cdf8150
ID:    542831ea16c66b61cd7a6d282070eddf0508be5fcf52d84136a56337c7ee940e
user:  21006:21006
entry: /usr/bin/mrml-git-protected-signer
```

A local isolated invocation used a fresh named volume, `network=none`, a
read-only root, all capabilities dropped, `no-new-privileges`, 16 PIDs,
256 MiB, half a CPU, and only the named key volume as writable storage. It
created a 32-byte mode-`0400` OpenPGP seed, 140-byte mode-`0444` OpenPGP public
key, 1,952-byte mode-`0444` ML-DSA public key, and 4,032-byte mode-`0400`
ML-DSA secret, all owned by `21006:21006` with one link. A second invocation
returned exit 78 and the generic fail-closed diagnostic.

The same exact image was streamed over authenticated SSH directly into the VPS
Podman store. The image ID, configured user, and entrypoint matched locally.
Two fresh rootful Podman namespaces then exercised both the direct command and
the packaged wrapper. The retained controlled key volume is
`mrml-podman0c26-git-signer-keys`; the wrapper-specific disposable volume is
`mrml-podmanscript-git-signer-keys`. Both are Podman named volumes, not host
bind directories. The first volume reproduced the exact metadata above and its
overwrite attempt returned exit 78. The wrapper succeeded only after explicitly
selecting `MRML_CONTAINER_RUNTIME=podman`, proving it addressed the host's
separate Docker Snap and rootful Podman stores without guessing.

No private key or secret file content crossed SSH, appeared in arguments or
environment variables, or was printed.

## Authenticated health and restart continuation

The first exact-image health probe returned `ready` to the cross-UID client but
left `request_failed category=read` in the signer log because the client closed
after authenticating the server hello. Source inspection also showed that every
successful generation advance was logged as `category=sign`. Signed commit
`140f9c95` adds a distinct authenticated health request/response operation and
exact `health`, `sign`, and `advance` completion categories. The health frame is
bound to the channel capability, random session, absolute expiry, single-use
sequence, and request ID; wrong capability, session, or request ID fails closed.

The updated focused suite passed 274 Git library, five CLI, eight signer, and
two credential-agent tests, strict clippy, formatting, and diff checks. A clean
worktree release build produced exact signer image
`094823000fd4e43f0a05d513ca1e4539c1ce52398d8d827938372fb406abd6f9`.
That image was streamed directly into the VPS Podman store and replaced the
controlled signer while retaining the older stopped container. It reused the
same five named volumes, reached `ready`, and completed the cross-UID health
operation with exactly:

```text
component=mrml-git-protected-signer event=request_complete category=health
```

The container remained `network=none`, read-only, UID/GID `21006:21006`, with
all capabilities dropped, `no-new-privileges`, 32 PIDs, 512 MiB, one CPU, no
ports, and only named volumes. It stopped within the whole-second timer's zero
second bucket, restarted without changing bootstrap arguments, reopened the
same `21006:21006` mode-`0600` 64-byte generation state, and completed a second
authenticated health operation. No `request_failed` event was emitted by either
successful probe.

## Fresh protected receive and restart continuation

The current image was then connected to a fresh controlled protected repository,
`owner/keygen`, on the same authorized VPS. The authority, Gitd, signer, client,
repository, quarantine, cache, receipt, policy, secret, state, and runtime socket
storage all used Podman named volumes. Gitd listened only on VPS loopback port
`18446`; this was not a public-service probe. The run reused the previously
documented test certd fixture and test CA, so it is not ACME, public-PKI, HTTP/3,
or production-certificate evidence.

The protected policy used the public keys generated inside
`mrml-podman0c26-git-signer-keys`. The fresh authority had an independent receipt
key. Its public 32-byte receipt verifier was derived inside an isolated authority
container and installed in the signer key volume without exposing the receipt
secret. A second derivation, performed while the live authority was stopped to
avoid its exclusive generation-store lock, produced the same SHA-256 digest as
the signer-mounted verifier:

```text
83b4d7587962dd69bcef1d0618bac259ab6800f90565dc8f54066d496c2e40b1
```

The first receive persisted and activated candidate
`c45048f33ad0fe5977794f873ba3ea75`, but the initial client result was uncertain
because the signer still had the preceding authority verifier. The authenticated
receipt remained durable while the signer stayed at repository generation 1.
After installing the exact fresh public verifier, the client exercised the
pending-candidate status path rather than retransmitting the pack. During probe
reconstruction, omitting Podman's supplemental socket-access group prevented the
client from reaching the signer: the client peer remains `21007:21007`, the
signer peer is `21006:21006`, and group `21906` grants access only to the
mode-`0660` socket. Restoring the exact 175-byte non-secret pending journal and
running with supplemental group `21906` completed the authenticated advance and
reported:

```text
Pushed abea63c8bdb4 to origin/main
component=mrml-git-protected-signer event=request_complete category=advance
```

Two further protected pushes used newly issued one-hour, repository-scoped write
tokens passed directly from Gitd to client standard input. They advanced the tip
to `c1c4fa74ebe8`, then the signer was restarted, completed an authenticated
cross-UID health operation, reopened durable generation 3, and advanced the tip
to `d8532f795f18`. Final exact state was repository generation 4 in both the
signer and authority, trust generation 1, revocation generation 1, three retained
authenticated receipts, and no pending client journal. The signer logged exact
`sign` and `advance` completion categories for both later pushes.

Finally, a separately initialized named client volume received only the public
trust policy, OpenPGP public key, ML-DSA public key, and non-secret protected
routing configuration. With a newly issued read-only token it fetched 11 objects
and one branch and independently recorded exact remote tip:

```text
d8532f795f1836281ecb58badf344c1639177ad497c6103fa1b6f72b6ff0f373 main
```

The signer, fresh authority, and fresh Gitd remained running after the probe.
Inspection showed only `volume:` mounts for all three; no host bind directory was
introduced. This establishes controlled Linux/rootful-Podman protected receive,
uncertain-result reconciliation, consecutive generation advances, signer restart
continuation, and independent protected fetch. It does not establish production
key custody, public reachability, real ACME/certd operation, HTTP/3, destructive
restore, key rotation, large-push limits, physical hardware, or independent
security audit.

Patent review: **NOT_TRIGGERED**. This increment adds conventional local key
generation, exclusive filesystem creation, and container-volume orchestration;
it introduces no new signature algorithm or cryptographic construction. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
