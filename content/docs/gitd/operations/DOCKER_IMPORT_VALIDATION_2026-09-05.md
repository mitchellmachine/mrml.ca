# Actual Docker import and Compose validation — 2026-09-05

**TESTED:** externally authenticated extraction, five exact image imports and
three Compose configuration parses on `mrml.ca`. **BLOCKED_ENVIRONMENT:** the
newly imported authority binary cannot execute with required confinement.
This is unqualified validation, not the continuous checkpoint F sequence.

The owner explicitly approved transfer of validation images, verifier tools,
public test key and nonsecret Compose files. No source archive or private key
was transferred. The prior automatic-review transfer block is resolved.

## Source, engine and trust

Source archive SHA-256:
`a366dc6b63daf035513d3b729fe6af5a774cf31b685612e07bd7cedfe3ac1ff9`.
Package-file inventory was rechecked after this run and remains
`3cbad1fff95c7bac2e329e4000b8a13a24ee8c0b1a13d51aa20f8befbb9de509`.
No package source or verifier binary changed during this export correction.
The original source archive and validation bundle remain available unchanged;
see [their index](COMPLETION_ARTIFACTS_2026-09-05.md).

Actual engine: `/snap/bin/docker` 29.6.1, Compose 5.3.1, context `default`,
`DriverStatus=[[driver-type io.containerd.snapshotter.v1]]`, data root
`/var/snap/docker/common/var-lib-docker`. Root-owned validation files reside
separately under `/var/snap/docker/common/mrml-completion-20260905`.
No engine was installed, migrated, reconfigured or restarted.

Independently provisioned bootstrap SHA-256:
`ffb938d743b3d99f671648c29b94cf3d283a71bd9a05d803ea5431e95478d8af`;
cosign SHA-256:
`ddc39e595d95f05a4bbddce66a59fc313bd6c56ee27dff1b0021f4f2094bbc73`.
The exact cosign checksum is also retained in the original artifact index;
the public disposable test-key SHA-256 is
`9c4abb45d88ce25539f9e72e72220d16d9ef36bf5b5b0783803b18d7689ea1e8`.

## Legacy archive mismatch and corrected export

The original Docker-archive bundle passed remote signature/extraction and
inventory verification. Loading stopped after the first image: its signed
Podman configuration ID was `d8b0df4baf0172cc13418e95da05905d1ff93bca757dba7d0de405330008c28a`,
but Docker reported manifest ID
`3d933a2c95bf978f3784e55be14b33d18ac7d78b0de6df23fa5dfc974eb2abe0`.
Configuration bytes and layer identities matched; the identity *kind* differed.
The loader rejected the mismatch and retained the imported image. Its check was
not weakened. This difference is consistent with Docker's
[containerd store documentation](https://docs.docker.com/engine/storage/containerd/)
and the [upstream import report](https://github.com/moby/moby/issues/51934).

A separate OCI archive generation was produced on the trusted development
machine from the same five configurations/layers, with new tags
`mrml/ROLE:completion-e-20260905-oci`. The signed v5 lock's `producer_id` and
identity files bind each archive's explicit single-platform OCI manifest blob
digest. These digests were obtained and signed **before remote import**, not
learned from Docker afterward. A signed evidence file records this target-store
profile. The unchanged loader compared both exact IDs and tags after import.
Classic configuration-ID stores are not qualified by this profile.

| Role | Signed OCI manifest SHA-256 / verified Docker ID | OCI archive SHA-256 |
| --- | --- | --- |
| git-authority | `320c7ff87901d31646b6e0cb2ef39eaab15e69d6c707f46445f5e228329649eb` | `bd1362aaacff0a791d598312f3d021d518a883b469080bf02512d822c871910f` |
| gitd | `ecdc4f14296cb2cd087d804b4ba90c6615caf1f9bb9bd16ac0bb6891e00ba7b3` | `73ffcac6d62ef8613b1f3c3cec7482c9ede11d10427c57ff2c878ca5be07f316` |
| git-protected-signer | `172c047ad866794e80b1d52f9943a325c2dbc6dae94eb5991989a0bf74476927` | `ab6271235f3c1f042e18ef1c7fc10e24c0e821512063716443c4c55a20a605f5` |
| git-credential-agent | `72888f9965d50c4f8d59ff00011875aefc243478e006c4a1f4acf74fea7d1320` | `011c1f670b588ad5f0cb62aafa1f4f8f4ee3bf8ad0f850835270622cb572d40a` |
| git-backup | `2ff5c29451a03398c7eee8935ea57fb4705e1f45956043fb489aa1e7f8094009` | `d8d9fedc31e2d59dda150b9a1d6473f86a42146c373d514f5983742c43d51f2a` |

All five fixed users/entrypoints and Linux/amd64 were also checked. The backup
tool's existing `0:0` profile is not a long-running daemon identity.

New local directory: `/tmp/mrml-git-completion-20260905-oci`.

| Artifact | SHA-256 |
| --- | --- |
| `mrml-image-validation-oci.tar` | `bced833b04a2bcfbde360db7d1e8526cc396d6af37c5637c78c6968c70afbef2` |
| `payload/release.manifest` | `09c30f0149e83425b3d4a48522a7b909ec62f56df40503070bff3337334a2a2c` |
| `payload/release.manifest.cosign.bundle` | `1beabe8f0815c682654a01db28c1910658ba010cb930718839b8a15ddd8c3b0b` |
| `remote-load.log` | `bf09bcd4417190a1c2adadf2088830bfa12747df0fb88e9eb9bf6bda1793bdb9` |
| `remote-hardening.log` | `072221ca54362c09b45737070fc5deca9a51854ec4f48aeb0b669093832f3981` |

Exact export operations for each role (existing canonical build commands are
in the original artifact index):

```sh
podman tag docker.io/mrml/ROLE:completion-e-20260905 docker.io/mrml/ROLE:completion-e-20260905-oci
podman save --format oci-archive -o /tmp/mrml-git-completion-20260905-oci/payload/images/ROLE.tar docker.io/mrml/ROLE:completion-e-20260905-oci
tar -xOf /tmp/mrml-git-completion-20260905-oci/payload/images/ROLE.tar index.json
SYFT_CHECK_FOR_APP_UPDATE=false syft oci-archive:/tmp/mrml-git-completion-20260905-oci/payload/images/ROLE.tar -o spdx-json=/tmp/mrml-git-completion-20260905-oci/payload/sbom/ROLE.spdx.json
```

The retained local `export-metadata.sh` contains the exact five-role metadata,
SBOM and disposable-key signing commands. Manifest generation/signing used the
same source archive hash and offline signing configuration as the first bundle.
The Rust verifier passed locally before packing and after fresh extraction.
Cosign signing printed a failed TUF-cache initialization warning in the local
sandbox; offline signature verification passed. No transparency lookup success
is claimed or required by this test profile.

## Exact remote verification and Compose commands

SSH uses the pre-existing authenticated host key, `ubuntu`, port 42069.
Transferred archive bytes passed `sha256sum -c` before root-owned installation.
The following commands passed (the first created a new destination):

```sh
sudo -n /var/snap/docker/common/mrml-completion-20260905/trusted/mrml-git-release extract /var/snap/docker/common/mrml-completion-20260905/incoming/mrml-image-validation-oci.tar /var/snap/docker/common/mrml-completion-20260905/payload-oci /var/snap/docker/common/mrml-completion-20260905/trusted/test-release.pub /var/snap/docker/common/mrml-completion-20260905/trusted/cosign
sudo -n /var/snap/docker/common/mrml-completion-20260905/trusted/mrml-git-release load /var/snap/docker/common/mrml-completion-20260905/payload-oci /var/snap/docker/common/mrml-completion-20260905/trusted/test-release.pub /var/snap/docker/common/mrml-completion-20260905/trusted/cosign /snap/bin/docker
```

From `/home/ubuntu/mrml-git-completion-20260905-config`, all three passed:

```sh
sudo -n docker compose --env-file acceptance.env -p mrml-completion-20260905-config -f compose.acme.yaml -f compose.git.yaml -f compose.git.acceptance.yaml config --quiet
sudo -n docker compose --env-file acceptance.env -p mrml-completion-20260905-signer -f compose.signer.yaml config --quiet
sudo -n docker compose --env-file acceptance.env -p mrml-completion-20260905-credential -f compose.credential-agent.yaml config --quiet
```

The merged JSON SHA-256 is
`ada596a583aecd60022986f7cd06bb3598dc85d358913065be9e3cd945586c45`
(`/tmp/mrml-git-completion-remote-compose.json`). It retains read-only roots,
fixed daemon identities, cap-drop ALL, no-new-privileges, isolated sockets,
loopback-only TCP 32443, disabled H3 and 22 prefixed volume names. The env file
contains parser-only dummy identities; it was not used to provision services.

## Current-image confinement result

Only the previous disposable probe's project name and image ID were changed.
No ports, mounts or networks were added. Exact command:

```sh
sudo -n docker compose -f /home/ubuntu/mrml-git-completion-20260905-config/compose.oci-hardening.yaml -p mrml-git-completion-20260905-oci-hardening up --no-build --pull never --abort-on-container-exit --exit-code-from authority-probe
```

Result: **exit 255**, `exec /usr/bin/mrml-git-authority: operation not permitted`.
Kernel audit at 2026-09-05 04:24:23 UTC independently recorded:

```text
apparmor="DENIED" operation="exec" info="no new privs"
profile="snap.docker.dockerd" name="/usr/bin/mrml-git-authority"
fsuid=21002 ouid=21002 target="docker-default"
```

Inspection confirms read-only root, `ALL` dropped, `no-new-privileges:true`,
network `none`, no mounts, 16 PIDs and 128 MiB. All four pre-existing running
Docker container IDs remain running; all 90 named volumes remain. No public
port was opened. The failed disposable probe and validation images are retained.

Next action: a conforming Docker host, or separately authorized host remediation
under [the reviewed non-destructive plan](DOCKER_HOST_REMEDIATION.md), plus the
[certificate owner's startup/lifecycle fixes](../edge/CERTD_CONSUMER_HANDOFF_2026-09-04.md).
Then run the real-certd continuous acceptance sequence and fresh H2 transfer
measurements before signing a qualified clean-source release. Nothing in this
record promotes the existing `NOT_RUN` acceptance evidence.

Patent review: **NOT_TRIGGERED**; conventional export-format correction and
execution evidence, with no new mechanism. See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
