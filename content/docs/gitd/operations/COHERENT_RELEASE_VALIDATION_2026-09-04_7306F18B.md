# Coherent Git release validation — 2026-09-04 — `7306f18b`

## Scope and claim boundary

Signed commit `7306f18b` was checked out in a clean detached worktree. The
authority, Gitd, protected signer, credential agent, and backup administrator
were compiled for Linux x86-64 and built as five network-disabled Podman images.
The exact OCI archives were transferred over SSH to the authorized hosted-Linux
test server, rehashed there, loaded without a registry, and used to replace the
generation-5 test stack while preserving its named volumes.

This is a coherent-image build, offline transfer/load, hardened-container
restart, and authenticated HTTP/2 fetch result. It uses generated test keys, a
fixture certificate and CA, an explicit test hostname-to-loopback mapping, and
server loopback port `127.0.0.1:28443`. It is not public port 443, real ACME,
production-key custody, hostile-host, power-loss, or physical-hardware evidence.

## Build and artifacts

The clean worktree ran:

```text
/home/m/mrml/target/release/mrml build org.mrml.service.git-authority --target linux --release
/home/m/mrml/target/release/mrml build org.mrml.service.gitd --target linux --release
/home/m/mrml/target/release/mrml build org.mrml.tool.git --target linux --release
podman build --network=none --pull=never ...
podman save --format oci-archive ...
syft oci-archive:... -o spdx-json=...
```

| Image | Image ID | OCI archive SHA-256 | SPDX-JSON SHA-256 |
| --- | --- | --- | --- |
| `localhost/mrml/git-authority:7306f18b` | `89d85bd04844f431bdca0968ef753ea9a255f7edec47b7c136c4985579dd859a` | `1c1c21aa5d41111f6280055fd83b2efd03a220772f4d92ab27fd1de5ebacfde0` | `d548593b8c64d8e7bef896033e047a97cff0dcee89dea2174a10c15ee680844e` |
| `localhost/mrml/gitd:7306f18b` | `4f85e070666a3b25e9a0445054c308a07512391435e2b291c06bcb2379fbed30` | `66d9886d838f101e6e41917d180299583cefa57243f6d298bb62be9c5130af7a` | `21cad28802947eb18ef401b656a52b82c6d2a74310685e59be47f1366dd04e33` |
| `localhost/mrml/git-protected-signer:7306f18b` | `3c1a4b5767cb653b899f79465ad035d203e6369d4f3a8836cc272aa1c93046f2` | `7b53a962f1798b9257960af28b748c257eaad5198d6deebc0858dddf98ddd444` | `8c16f7a3672c062d5d97565ae27c5051af5735ddf2c047a0bdffc6f505fc1719` |
| `localhost/mrml/git-credential-agent:7306f18b` | `8411480206404686d2a60d0d65f1eb304f2a60c624d8a5633e829a8a794b3b83` | `0a62c7c7203e2269b97aaa6d168dd4e5321ce8277026c757a134e4666b010ffa` | `55dc71f8d45fe07f0a03818b2b1bfaaeae6881d78d36d1747af10ff6cb900ab3` |
| `localhost/mrml/git-backup:7306f18b` | `039a3a12cbb6cdb104fb86bedb00ca7004f6207a225bcbaa4c7fc08098d79e98` | `1f316f0261f61233871a6d8063b413666b0354be25eba13da9ee5ac491643993` | `801dc1f943681d07978740ab15fa85f60a8a7ea692ca05bee0dcd897285955a1` |

The five server-side archive hashes exactly matched this table before
`sudo podman load`. Syft 1.51.0 completed all local scans; only its optional
online version lookup failed under restricted DNS.

## Hardened named-volume rollout

The first image-only clones exposed that the earlier manually created test
containers had writable root filesystems and lacked production resource and
capability settings. Those clones were stopped and removed. They are not counted
as hardened runtime evidence. Replacement containers retained the same named
volumes and exact daemon arguments but explicitly applied:

- fixed users `21001:21001`, `21002:21002`, and `21006:21006`;
- read-only root filesystems;
- all default Linux capabilities dropped and `no-new-privileges`;
- bounded memory, CPU, PID, and descriptor limits;
- bounded no-exec, no-suid, no-device tmpfs where required;
- bounded local log files;
- `network=none` for authority and signer;
- only Gitd TCP `8443` published as host loopback `127.0.0.1:28443`;
- only named-volume mounts, with policy, secrets, keys, CA, and runtime consumer
  views read-only where applicable.

Podman 5.7 rejected Compose-style `uid=` on a tmpfs option before creating the
authority container. The corrected containers use bounded mode-1777 tmpfs
mounts, which permit their fixed non-root users to write without exposing host
storage. Gitd's first corrected start failed closed with
`Certificate(UntrustedIssuer)` because the manual command omitted the prior
test-only `MRML_CA_BUNDLE=/run/test-ca/root.pem` binding. Recreating only Gitd
with that explicit read-only named-volume CA binding passed configuration,
authenticated dependencies, identity authentication, recovery, listener bind,
and `ready`. These failed attempts did not mutate policy, refs, or signer keys.

Native authority and Gitd listener-health commands returned `ready`. Runtime
inspection reported `ReadonlyRootfs=true`, `Privileged=false`, the expected
capability drops and security option, exact resource limits, no authority or
signer network, and no authority or signer published ports.

## Authenticated restart fetch

A one-use test workflow issued a short-lived, repository-scoped read token from
the hardened `7306f18b` Gitd image. The remote shell retained the token only in a
shell variable and piped it directly to the client's standard input; it was not
placed in an argument, environment variable, file, or diagnostic output. The
first client attempt lacked the fixture hostname-to-loopback mapping and failed
before a server handshake. With the explicit test mapping, the fresh hardened
validation container reported:

```text
Fetched 17 object(s) and 1 branch ref(s) from origin
head d9c75029e0608c983b766a7b3c0fdef946b60e33284b462d25dcbfc4fe709671
track origin/main  0 ahead  0 behind
clean — index matches working tree
```

No development-repository remote push occurred.

## Incompressible 256 MiB transfer evidence

Four independently generated 64 MiB incompressible files were committed as
`a2255baa978e161e7b4f2ee12909862eb29fa5ef3eec4a55d422bece9a56e3d7`.
Their SHA-256 digests were `63fc549d...9f8`, `229778c8...749d`,
`6da2a5b2...096d`, and `a484bf1c...226e`. A protected push completed in 54
seconds at 4,971,026 bytes/s. Peak RSS was 245,880 KiB for the client, 104,444
KiB for Gitd, and 19,480 KiB for the authority. A fresh authenticated clone into
the disposable named volume `mrml-release7306-large-clone` completed in 47
seconds at 5,711,392 bytes/s and reproduced all four hashes. Peak RSS was
389,064 KiB for the client, 146,616 KiB for Gitd, and 19,520 KiB for the
authority. The clone evidence contains 42 samples; peak descriptor counts were
5, 26, and 9 respectively.

The first measured push failed closed because the client container lacked the
protected-signer supplemental group `21906`; the server ref did not advance.
The first clone-volume initializer lacked `CAP_CHOWN`; only the explicitly
disposable empty volume was removed, then initialized by a helper granted only
that capability. Runtime data, server state, and persistent inputs used named
volumes throughout.

## Signed aggregate offline bundle

The first aggregate archive exposed a release-packaging defect: its nested
streaming `SHA256SUMS` named `client.out`, `client.err`, and `content.sha256`,
but the builder's evidence allowlist omitted them. Full verification failed.
Commit `d0a0be7e` adds those three required files. The only non-documentation
change from the measured `7306f18b` source is that allowlist correction. A clean
rebuild produced the same five runtime image IDs listed above, so the measured
runtime artifacts are byte-identical. The evidence source binding was advanced
to the exact packaging commit.

The corrected archive is `/tmp/mrml-git-d0a0be7e.tar.gz`, SHA-256
`c1573273c8b5b779d80d366c7f6bc4da0975f07b62420fccbdc5649b9a2e18b2`.
Its Docker-archive hashes are:

| Image | Archive SHA-256 | SPDX-JSON SHA-256 |
| --- | --- | --- |
| `git-authority` | `b45c7ddffd5603a4ed8759f80569dac4fe37c9996ea50ceceec883964a472208` | `bc95d557b74b2a3aec759e6a1041acb62960ebdaee49ce6564e1d58631cabbc0` |
| `gitd` | `c70e3a985ca469a30d23b5f04fce15e8a543cdf09c90498e2134b93e16d39629` | `6e7911479427059c82f660001cad1e194d6c9389264f35071a1d5667b63f33ce` |
| `git-protected-signer` | `d344f0e777bf19830aab8c9a3651acdd20c416e7c1086ae6cdb270b1e5194a62` | `e5807268969258f2a4066513aa82675cb723d0de5b65377df2ef94dab8d0b694` |
| `git-credential-agent` | `d807aa700f19997a2a295393af90f61201f7af7027221110eee5bbd522b2d308` | `ced5183a7b8c4c7574a71894ac7432fa36e19da1397166eaee8419c8f6375dd5` |
| `git-backup` | `db03256920b6ce7d37dd762e727e9c4b818ebe41d7724e9964031d565942789b` | `fcbf8cb4c4831339d467a57ce7bcb156392a10088af61fba173202435ad2d38b` |

`verify-offline-git-bundle.sh` passed strict top-level and nested checksums,
complete streaming evidence, source binding, all five offline Cosign blob
signatures, SBOM presence, Compose policy checks, and trust-transition and
trust-policy construction process-kill recovery suites. Cosign transparency-log
verification is intentionally unavailable for this offline key profile; the
bundle contains the exact public key and signature bundles. This is hosted Linux
and fixture-key evidence, not external key-custody or transparency-service
evidence.

Patent review: **NOT_TRIGGERED**. This exercise uses conventional offline image
archives, hashes, SBOM enumeration, container hardening, and authenticated test
fetches; it introduces no new mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
