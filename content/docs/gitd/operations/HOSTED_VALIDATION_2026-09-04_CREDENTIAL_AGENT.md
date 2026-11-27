# Hosted Git credential-agent evidence — 2026-09-04

Status: **IMPLEMENTED** scoped credential IPC and daemon; hosted Linux and
local Podman build evidence only. This is not a production-token, public-network,
VPS activation, or independent-review claim.

Source commits:

- `84f05aa6` — authenticated scope-bound client/daemon implementation.
- `3da7a4f4` — isolated image, named-volume Compose model, and offline bundle
  integration.
- `66806028` — distinct daemon identity and exact clean-worktree image evidence.
- `594d242f` — bounded SIGINT/SIGTERM shutdown and identity-checked socket
  removal.

## Implemented boundary

`mrml-git-credential-agent` owns one exact Gitd-issued bearer token. Its command
line contains paths and non-secret policy only; the token is read from an
owner-only regular single-link file opened with `O_NOFOLLOW`. The client and
agent receive separately owned copies of a random 256-bit channel capability.

For each use, the agent creates a fresh random five-second session. HMAC-SHA-256
authenticates the session, request, and response. The request binds the exact
host, port, `.git` repository path, read/write action, credential generation,
request ID, and session. The client authenticates agent UID/GID and the agent
authenticates client UID/GID using kernel Unix peer credentials. One connection
serves one request. Wrong capabilities, peers, sessions, scope, action,
generation, expiry, and frame bounds fail closed. Secret-bearing input, token,
response, and authorization buffers receive volatile erasure.

The daemon is fixed at UID/GID `21009:21009`; socket group `21909` is distinct
from the existing controlled Git client identity `21007:21007`.
Its production Compose fragment has `network_mode: none`, no ports, read-only
root, all capabilities dropped, no-new-privileges, and explicit memory, CPU,
PID, descriptor, and log bounds. Token, channel, client channel-copy, and Unix
socket storage use namespace-prefixed named volumes. No host data directory is
mounted.

Server-side Gitd token revocation remains authoritative and live: a revoked
token returned by an agent is rejected by Gitd. Credential rotation provisions
a replacement token and higher generation with the agent stopped, then
recreates the container; clients pinned to the old generation fail closed.

## Exact checks

```text
MRML_CREDENTIAL_AGENT_SOCKET_TEST=1 target/release/mrml test org.mrml.tool.git --target linux
  PASS: 273 library + 5 CLI + 7 signer + 2 credential-agent = 287 tests

target/release/mrml manifest check
  PASS: 71 components, 214 dependencies
target/release/mrml manifest lock --check
  PASS: 71 packages, 5 interfaces
deploy/compose/test-compose-git.sh
  PASS
deploy/compose/test-compose-signer.sh
  PASS
deploy/compose/test-compose-credential-agent.sh
  PASS
deploy/compose/test-git-images.sh
  PASS
cargo fmt --all -- --check
  PASS
cargo clippy --all-targets -- -D warnings
  PASS
git diff --check
  PASS
```

The socket test required execution outside the filesystem sandbox because that
sandbox denies Unix socket creation. It exercised a real `UnixListener` and
`UnixStream`, fresh entropy, peer credentials in both directions, authenticated
framing, exact scope policy, and returned-token construction.

## Image and Compose evidence

The image was built locally at exact commit `66806028` from the clean detached
worktree `/tmp/mrml-release-66806028`, with networking disabled and the two
digest-pinned bases:

```text
podman build --network none --pull=never \
  -f deploy/compose/Dockerfile.git-credential-agent \
  -t mrml/git-credential-agent:66806028 .
```

- Image ID:
  `1c5850c755d7b166990a8b8ae99da92d761976a3dae74a87f1eeefe6fffd3b49`.
- User: `21009:21009`.
- Entrypoint: `/usr/bin/mrml-git-credential-agent`.
- Exported test archive SHA-256:
  `d293d1e338ba1557866469fdeaca25cf94610abd9af51701ca2e5b98ed3203ef`.
- Syft SPDX JSON SHA-256:
  `657e45b58264ad0099019ae7100947cb81fc80519845cd6cc4aa55060e552bb8`.

Podman Compose 1.5.0 accepted the complete model with non-secret test values.
A disposable, non-running runtime container inspection reported:

```text
user=21009:21009 network=none readonly_root=true pids=16 memory=67108864
cap_drop=all security_opt=no-new-privileges
```

The exact inspection container was removed afterward. The archive and generated
SBOM are disposable `/tmp` evidence, not signed release artifacts. The offline
builder includes this fifth image in `mrml-images-git-v5`, generates its Syft
SBOM, signs its exported archive through the existing offline Cosign path, and
locks its expected user and entrypoint. A fresh complete test-signed bundle was
subsequently built and independently verified at functional commit `594d242f`;
see
[`OFFLINE_RELEASE_VALIDATION_2026-09-04_594D242F.md`](OFFLINE_RELEASE_VALIDATION_2026-09-04_594D242F.md).

## Graceful shutdown continuation

The VPS lifecycle exposed that the initial daemon did not exit within its
ten-second container stop deadline. Commit `594d242f` blocks SIGINT and SIGTERM
before creating worker state, waits for either signal on a dedicated thread,
wakes the blocking Unix accept loop, and removes the socket only if its type,
owner, group, mode, device, and inode still match the socket it created.

The exact clean-worktree image ID was
`8411480206404686d2a60d0d65f1eb304f2a60c624d8a5633e829a8a794b3b83`.
On the VPS it reached ready, stopped in one whole-second timing interval under
a ten-second deadline, emitted `shutdown_complete`, restarted on the same named
volumes, and served another successful agent-backed clone into a fresh named
volume. The previous container was retained stopped for rollback. This was a
hosted Linux/Podman controlled probe, not public-network or production-key
evidence.

Patent review: **NOT_TRIGGERED**. This is conventional scope attenuation,
authenticated local IPC, peer-credential enforcement, bearer-token custody, and
container confinement and conventional signal-driven daemon shutdown using
existing primitives. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).

## Real Docker replacement follow-up — 2026-09-05

The real Compose diagnostic run confirmed that `native_clone` persists the
credential provider's generation in the clone's `[http] credentialGeneration`
configuration. Environment variables configure a new clone; they do not
silently override an existing clone's pinned generation. After stopping the
agent, installing the replacement token with the documented owner/mode, and
recreating it with a higher generation, explicitly advance each authorized
client's non-secret `credentialGeneration` configuration. Stale clients must
continue to fail. Do not edit authority generations, receipts, or repository
refs as part of this credential update.

Generation-1 clients were rejected by the real generation-2 agent, then native
fetch passed after this explicit configuration update. The serving Gitd kept
its original process throughout revocation and replacement. Exact diagnostic
logs are recorded in `CURRENT_COMPLETION.md`; this is not a production-token
or final coherent-release claim.
