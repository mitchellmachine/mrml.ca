# Authorized Docker migration — execution record

The owner explicitly authorized the documented certd fixes and migration from
Docker Snap, including temporary downtime for the four Docker workloads.
This supersedes the earlier migration-authorization blocker. No public
activation, volume deletion, history rewrite or security-control relaxation
was authorized or performed.

## Verified preparation

Private inventory and backups remain root-owned on `mrml.ca` under
`/var/backups/mrml-docker-migration-20260905` (0700). Container configuration
and secret-bearing metadata were not copied into this repository or chat.
The inventory contains eight containers, four previously running, 90 local
named volumes, all image identities/tags and five network definitions.
All eight container roots are read-only and every mount is a named volume.
No Podman container mounts Docker's data root. Six Podman workloads are
inventoried separately for the post-migration comparison.

Docker's official signed Ubuntu Resolute repository was provisioned using the
[official installation instructions](https://docs.docker.com/engine/install/ubuntu/).
The package simulation selects exactly five new packages, no removals and no
unrelated upgrades:

| Package | Version |
| --- | --- |
| docker-ce | `5:29.8.0-1~ubuntu.26.04~resolute` |
| docker-ce-cli | `5:29.8.0-1~ubuntu.26.04~resolute` |
| containerd.io | `2.3.4-2~ubuntu.26.04~resolute` |
| docker-buildx-plugin | `0.37.0-1~ubuntu.26.04~resolute` |
| docker-compose-plugin | `5.5.1-1~ubuntu.26.04~resolute` |

The repository key primary fingerprint is
`9DC858229FC7DD38854AE2D88D81803C0EBFCD88`.
All images were exported on the host and checksum-verified before stopping
workloads. The four exact running-container IDs were compared immediately
before the stop. Gitd consumers stopped first, then authority writers.

## Cold backup and switch

At 04:44:11 UTC the cold backup began; at 04:44:34 UTC archive hashing,
complete fresh extraction and GNU tar comparisons against both the original
and restored contents passed for all 90 volumes. GNU tar preserved numeric
owners, modes, ACLs and xattrs. Transient Unix sockets are not archive data.
The original Snap volume tree remains intact.

`snap stop --disable docker.dockerd` stopped only the Docker daemon. Snap was
not uninstalled or purged. Its configuration was copied into the private
backup. The reviewed exact packages were installed with `--no-remove` and
`--no-install-recommends`. No application-specific systemd units were added.

Docker CE successfully started with:

```json
{"data-root":"/var/lib/mrml-docker-ce","features":{"containerd-snapshotter":true}}
```

Observed server 29.8.0, Compose 5.5.1, separate initially empty data root, and
`DriverStatus=[[driver-type io.containerd.snapshotter.v1]]`. Snap's original
`/var/snap/docker/common/var-lib-docker` is not shared with CE.

## Restoration and confinement results

All backed-up image IDs were inspected in CE and matched the inventory.
All 145 original tag and repository-digest references now resolve to their exact
original image IDs. A historical Debian digest alias required restoring the
OCI transport index's image-name annotation from a local engine export;
manifest, config and layer bytes were unchanged. No registry pull or image
rebuild was used. The root-private `image-reference-checks.tsv` records every
comparison.

All 90 named volumes were recreated through the Docker API, restored into the
new root, and compared successfully with the cold archive. Both custom networks
and all eight original container definitions were recreated from the private
inventory. The four original workloads are running again. The old Gitd binaries
required their historical certificate fixtures at startup; those two existing
fixtures were briefly started, then returned to their original stopped state.
This preserves the original four-running/two-fixture-stopped state, and is not
evidence for the new real-certd acceptance sequence. Six Podman container IDs
matched before/after without restart. Ports remain loopback 18443/18444.

The unchanged confined authority probe now executes the actual program and
returns its usage status 64, instead of the old pre-exec status 255. Inspection
retains read-only root, cap-drop ALL, no-new-privileges, network none and no
mounts/ports. This proves the host confinement blocker is resolved; it does not
prove an initialized authority or the full stack. Log
`/tmp/mrml-docker-ce-recovery-probe.log` SHA-256:
`66a4e8a3b101ee1f7afdccb16909c3c6abf8bda186888c28c75de12ae84d0b21`.

The unchanged trusted `mrml-git-release load` was run again against the signed
OCI validation payload using `/usr/bin/docker`; all five exact IDs, tags and
runtime profiles passed on CE. `/tmp/mrml-docker-ce-final-engine-check.log`
records this result, the four running workloads, 90 volumes, disabled Snap
daemon and unchanged Podman IDs.

Private host backup hashes:

| File | SHA-256 |
| --- | --- |
| `images.tar` | `8c5efb8726ab0d3faf90b8ef8aaaa0de6adff288cb6f6ecc8d26d94924e813d2` |
| `volumes.tar` | `a0e85ce2a888f633f545a6c9efa5e1849aa3144a931d15227bfa0bfa6540bf09` |

Root-private host logs contain the exact package transaction, image and volume
checksums, complete restore comparisons and Docker API reconstruction requests.
Rollback retains the original Snap data and private backups under the
[approved plan](DOCKER_HOST_REMEDIATION.md); do not discard either state or
permit conflicting writers on both engines.

## Certificate work in parallel

The new actual trust-root reader supports the public 64 KiB bound while keeping
the secret-reader limit at 16 KiB. Listener recovery holds a lifetime directory
lock and checks exact socket ownership/type/inode; peer directories are 2750
instead of 2770. Whole-frame I/O deadlines bound trickle clients. Refused peers
do not terminate workers; signal-driven shutdown and an unwind guard stop both
workers. `lifecycle-health` allows enrollment before an identity exists, while
the original `health` and Gitd identity/signing checks retain their requirements.

Canonical certificate release tests passed 144 library and five daemon tests
in `/tmp/mrml-certd-completion-green-final.log` before the small unwind guard;
the final guard build and real-daemon integration are being exercised. Actual
local hardened certd now starts and passes lifecycle health without a certificate.
Real enrollment uncovered an identifier-digest mismatch at CSR signing. The
explicit adapter now preserves persisted config/key bindings and generated a
valid CSR through the real service. A disposable CA signed it; real stage and
activation RPCs passed for generation 1. A separate identity-publication digest
defect was then found by the actual Gitd consumer and is being verified after
correction. Final Docker Compose acceptance remains pending, not fixture-derived
evidence. The later certificate suite passes 145 library and six daemon tests.

Patent review: **NOT_TRIGGERED** for the conventional migration and lifecycle
corrections; see [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
