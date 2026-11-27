# Gitd Podman VPS validation — 2026-09-04

This additive record covers an owner-authorized, loopback-only deployment on
`mrml.ca`. It is controlled test evidence, not public production activation,
production-key evidence, real ACME/certd evidence, or independent review.

## Source and release inputs

- Branch: `main`.
- Listener-test commit: `cd5adc7f` (`http2: test hostile sequences on a TLS
  listener`). No repository push was performed.
- Runtime image source: signed offline bundle version `1796bfe2`.
- `SHA256SUMS` reverified every retained bundle artifact before loading.
- Podman loaded the four archives directly into its image store. The producer
  image identifiers were `57b17819b295` (authority), `5db461d2d671` (Gitd),
  `0316bcf7c33c` (protected signer), and `e3b17d9f1dd9` (backup).
- The test-only certd fixture was `f629c07db740`. It is not present in the
  production Compose model.

The exact release-snapshot `mrml-git` binary was placed in a disposable client
image tagged `mrml/git-client:1796bfe2`; that client image is test apparatus and
is not part of the signed daemon bundle.

## Runtime selection and volume handling

Docker Snap 29.6.1 remained installed and its four pre-existing controlled
containers remained running. Its AppArmor policy had previously rejected the
production `no-new-privileges` setting before process entry. Podman 5.7.0 and
podman-compose 1.5.0 were therefore installed alongside Docker Snap; Docker was
not removed, restarted, or reconfigured.

All Gitd, authority, fixture, public-CA, runtime-socket, and client-checkout data
used newly created `mrml-podman1796-*` named volumes. Controlled fixture data was
streamed directly from source Docker named volumes to distinct Podman named
volumes with numeric ownership preserved. No container data used a host bind
mount. Authority and certd runtime-socket volumes were newly initialized rather
than copying stale sockets.

The checked-in Git and signer Compose static gates passed. The combined Git and
ACME Compose model also rendered successfully under workstation Podman using
non-secret placeholders. Podman's direct `run` CLI rejected Compose's Docker
style `uid=` tmpfs option, so this VPS probe omitted `/tmp` tmpfs mounts rather
than weakening the read-only root or substituting a host directory. It is not a
claim that podman-compose exactly implements every production Compose option.

## Confinement and startup

The three server-side containers reached running state with fixed identities:

- authority `21002:21002`, `network=none`;
- test certd `21003:21003`, `network=none`;
- Gitd `21001:21001`, bridge network, with only
  `127.0.0.1:18445 -> 8443/tcp` published.

All three reported read-only roots, `no-new-privileges`, and every default
capability in Podman's drop set. Limits were 64/32/192 processes and
512 MiB/256 MiB/2 GiB respectively. Gitd logged, in order, valid startup
configuration, authenticated dependencies, authenticated identity, completed
recovery, bound listeners, and readiness. `listener-health` returned `ready`.

An independent OpenSSL probe verified TLS 1.3, `TLS_AES_128_GCM_SHA256`, the
`git.example.invalid` certificate, the fixture root, and X25519MLKEM768 key
agreement. The real listener HTTP library suite also passed 83 tests, including
the environment-gated hostile sequence campaign, in 70.11 seconds.

## Authenticated HTTP/2 clone

A one-hour, read-only `owner/project` token was issued by the isolated Gitd
administrator path and passed only over the client's standard input. It did not
appear in arguments, environment variables, or captured output. Native
`mrml-git` cloned through TLS 1.3/HTTP/2 into a fresh named volume and reported:

```text
Cloned https://git.example.invalid:18445/owner/project.git into checkout on branch main
head a1bdb799ebe94e9f6fabb16123ff212ca62ed432adaf376d832e6b4ab136a895
track origin/main  0 ahead  0 behind
clean — index matches working tree
```

The four checked-out payload hashes were:

```text
e5f33295c59bad4a81151b18b1a1d855c8743030e217d7f7195f674146181711  e2e.txt
e920fd08bf05fa56582314ae3348bb7e4365ebef014190aa0866013b5c803e10  e2e-generation-6.txt
a3692fee14be1e9a2e3c26b89df1dc8f04611808829a15681e9ba024fe4180d8  e2e-generation-7.txt
9c44ceb0c8adf0ac769598754ca095fe040a49186153d41dfc668a7dd41bfd09  e2e-generation-8.txt
```

Restarting only the authority preserved its named state and both dependency
health probes returned `dependencies-ready` without restarting Gitd. A forced
test-certd stop made dependency health fail closed while Gitd stayed running;
Gitd emitted bounded, jittered channel-retry delays up to the configured
30-second cap. Podman had to SIGKILL the fixture after its five-second stop
deadline, and that deliberately minimal fixture then failed its accept loop on
live reconnect. Recreating certd and Gitd with a fresh ephemeral
`runtime-certd-gitd-recovered` named volume restored `dependencies-ready` while
preserving every authoritative volume. This is exact authority-restart and
fail-closed outage evidence, but it is not a successful no-Gitd-restart certd
recovery claim; the native controlled outage test remains the evidence for that
behavior.

Podman's bridge DNS stalled and a disconnect/reconnect attempt left bridge data
delivery unreliable. The successful disposable client therefore used host
networking solely to reach Gitd's host-loopback publication, with an
`/etc/hosts` entry mapping the unchanged certificate name to `127.0.0.1`.
Certificate and hostname verification remained enabled. This limits the result:
it proves the confined server containers, named-volume persistence, real TLS/H2
listener, authentication, pack transfer, and native checkout, but does not prove
Podman inter-container DNS or a byte-for-byte podman-compose production start.

## Exact `66806028` upgrade and credential-agent lifecycle

A subsequent controlled increment built the five-image `mrml-images-git-v5`
offline bundle at exact functional commit `66806028` from a clean detached
worktree. Its archive SHA-256 was
`e80d58cad1952a1a1bea3c7e105344104b9cda669576bb6c716e4d448f925633`.
The complete builder reran the authority, Gitd, and Git client suites, generated
five Syft SPDX JSON SBOMs, and signed all five image archives with a newly
generated non-production offline Cosign key. Independent extraction verified
every bundle checksum, image lock, SBOM presence check, signature, and retained
Compose policy. This is test-key evidence, not production release signing.

The already verified image archives were streamed over authenticated SSH
directly into the VPS Podman image store. No bundle staging directory or
container bind mount was used. Their exact image IDs were:

```text
57b17819b295d97c6e9b79f12726cb3b10d5a40801bff025125ca52e05e1987a  git-authority
26f2f1c02bf104c3e86bc2c9eae6a78bbe02c931f8d4f42040515f8895f0ac61  gitd
0316bcf7c33c88e7eb3c6a4dda162efa9deeb6d1596ce96b6533be6f99d998e9  git-protected-signer
1c5850c755d7b166990a8b8ae99da92d761976a3dae74a87f1eeefe6fffd3b49  git-credential-agent
e3b17d9f1dd9d3fdcb696d9bf20e5b94940964129b374997b42c04427c076f7b  git-backup
```

The retained Gitd container was stopped but preserved for rollback. An initial
Podman clone preserved its named volumes and loopback port, but final inspection
found that it had also inherited `readonly=false`, an empty capability-drop
set, and no no-new-privileges option. That candidate was rejected and stopped.
A separately created exact `66806028` replacement used the same named volumes
while enforcing a read-only root, all capabilities dropped,
no-new-privileges, a 2 GiB memory limit, two CPUs, 192 PIDs, and a bounded
in-memory `/tmp`. It passed all six ordered startup gates and an authenticated
HTTP/2 clone into a fresh named volume. The only published endpoint remained
`127.0.0.1:18445`.

The credential-agent token, split channel-capability copies, Unix socket, and
all client checkouts used new `mrml-podman668-*` named volumes. The read-only
token was issued directly from Gitd into its owner-only volume; the random
channel was generated in the agent volume and copied into a separately owned
client volume. Neither secret was printed, placed in an environment variable,
argument, host directory, or repository. The daemon ran as `21009:21009`, with
socket group `21909`, `network=none`, a read-only root, all capabilities
dropped, no-new-privileges, 64 MiB memory, half a CPU, 16 PIDs, and no ports.

Podman direct CLI adjusted the root metadata of a previously helper-mounted
runtime volume despite the `nocopy` option. The controlled probe therefore
mounted an owner/group/mode-verified `socket` subdirectory of that same named
volume with Podman's volume `subpath` facility. The daemon then reported ready.
This is direct-Podman evidence and does not replace the checked-in Compose
static gate.

An exact `66806028` client cloned successfully using `unix-v1` without token
stdin. Gitd then revoked the held bearer token while both services stayed up;
a fresh clone failed closed. Rotation stopped the agent, replaced the token in
its named volume, and advanced the independent credential-agent generation to
2. The Gitd policy revocation generation correctly remained 1. After restart,
a fresh generation-2 agent-backed clone succeeded. Podman required SIGKILL
after the daemon did not exit within its ten-second stop deadline; graceful
daemon shutdown is therefore not claimed. A final generation-2 agent-backed
clone also succeeded against the corrected read-only, capability-dropped Gitd
container.

Commit `594d242f` subsequently added bounded signal-driven shutdown. Its exact
credential-agent image ID was
`8411480206404686d2a60d0d65f1eb304f2a60c624d8a5633e829a8a794b3b83`.
The replacement agent reached ready, emitted `shutdown_complete`, stopped in
one whole-second timing interval under the ten-second deadline, restarted on
the same named volumes, and completed another agent-backed clone into a fresh
named volume. The earlier SIGKILL observation is retained above as superseded
evidence rather than silently removed.

Public port 443 remains unbound. Production owner keys, production certificate
identity, a current production Cosign key, public DNS, real certd renewal, and
external security/cryptographic review remain required before activation.

Patent review: **NOT_TRIGGERED**. This increment uses conventional container
runtime isolation, named volumes, loopback publication, TLS, and HTTP/2 testing;
it introduces no substantial new mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
