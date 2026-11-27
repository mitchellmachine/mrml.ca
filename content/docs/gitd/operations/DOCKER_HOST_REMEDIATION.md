# Docker host remediation proposal — mrml.ca

Status: **AUTHORIZED AND EXECUTED WITH RECOVERY VERIFICATION** on 2026-09-05;
see [exact packages, backups and outcomes](DOCKER_MIGRATION_2026-09-05.md).
The proposal below remains the original plan and rollback rationale.
Read-only inventory and one disposable hardened
Compose probe were performed on 2026-09-05 UTC (2026-09-04 Newfoundland time).
At that earlier checkpoint no engine change had been performed. The owner
subsequently supplied explicit migration authorization. Production volumes
remain preserved; no removal permission was inferred.

## Verified blocker

Reproduced with the current signed and verified OCI authority image on
2026-09-05 at 04:24:23 UTC: the new disposable Compose probe exited 255 and
the kernel recorded the same AppArmor `no new privs` transition denial.
All five OCI image imports and merged Compose parsing passed first. See
[exact commands, current image ID and evidence](DOCKER_IMPORT_VALIDATION_2026-09-05.md).
The original probe and inventory below remain historical evidence; no host
remediation was executed during the new probe either.

Docker Snap 29.6.1, revision 3579, and Compose 5.3.1 created the isolated
`mrml-git-completion-20260904-hardening-authority-probe-1` container but could
not execute its authority binary. Exit status was 255, not the application's
configuration-rejection status. The exact kernel audit records:

```text
apparmor="DENIED" operation="exec" info="no new privs" error=-1
profile="snap.docker.dockerd" name="/usr/bin/mrml-git-authority"
comm="runc:[2:INIT]" fsuid=21002 ouid=21002 target="docker-default"
```

Both Docker support interfaces are connected. The probe retained non-root
`21002:21002`, a read-only root, dropped `ALL` capabilities,
`no-new-privileges:true`, no network, 16 PIDs, 128 MiB memory, and no mounts or
ports. Its image was already loaded:
`sha256:e3c983e1a908c415504ce4ccbc667b6660b65a7fd6f2143f05ff0c3418d613f3`.
Canonical documents this AppArmor/no-new-privileges limitation in the
[Docker Snap usage notes](https://github.com/canonical/docker-snap#usage).
The linked Launchpad issue could not be retrieved; no available fix is claimed.

The exited probe, configuration, and log are retained on the host:

```text
/home/ubuntu/mrml-git-completion-20260904-hardening/compose.yaml
/home/ubuntu/mrml-git-completion-20260904-hardening/up.log
```

An initial configuration under host `/tmp` was invisible to Docker Snap. Moving
only the configuration to the host user's home allowed the actual execution
probe. Do not weaken AppArmor or no-new-privileges to bypass this result.

## Read-only inventory

| Item | Observed state |
| --- | --- |
| Host | `mrml.ca`, hostname `vps-57f2f471` |
| OS | Ubuntu 26.04.1 LTS, Resolute, amd64; kernel `7.0.0-30-generic` |
| SSH | `ubuntu`, port 42069; noninteractive sudo available |
| Docker | `/snap/bin/docker`, client/server 29.6.1, context `default` |
| Snap daemon | snapd 2.76.2, revision 27710; both snaps latest/stable |
| Docker data root | `/var/snap/docker/common/var-lib-docker`, overlayfs |
| Resources | 8 CPUs; 23,458 MiB RAM, 20,702 MiB available; no swap; 183 GiB disk free |
| Docker containers | 7 total including this probe; 4 running |
| Docker images | `system df`: 44 entries, 270.9 MB; image listing: 39 unique IDs |
| Docker volumes | 90 total, 32 referenced, 58 dangling; about 1.1 GiB on disk |
| Docker root size | About 1.3 GiB on disk; no build cache reported |
| Native package state | No installed Docker CE/CLI, docker.io, containerd/containerd.io, runc, or Compose plugin shown by targeted package inventory |
| APT availability | docker-ce and docker-ce-cli have no candidate in currently configured metadata; docker.io candidate 29.1.3-0ubuntu4.1; official repository has not been added |

The two image counts use different engine views and are not interchangeable.
Docker's `reclaimable`/`dangling` labels are not deletion permission: preserve all
90 named volumes until their owners explicitly select otherwise.

Running Docker workloads are `mrml-e2e-gitd`, `mrml-e2e-authority`,
`mrml-e2e-protected2-gitd`, and `mrml-e2e-protected2-authority`. Stopping the
Snap engine interrupts all four; their two certd fixture containers were already
stopped. Existing namespaces also include `mrml`, `mrml-e2e-namespace`,
`mrml-git-restore-e2e9100`, and `mrml-phase21-60e32e32`.

Six rootful Podman workloads are separately running: authority, Gitd, credential
agent, signer, and restored authority/Gitd instances under `mrml-podman1796`,
`mrml-podman668`, `mrml-release7306`, and `mrml-git-restore-br-target` names.
Their volumes and engine are separate. Do not stop or migrate them. Docker
package changes may affect host networking or runtime dependencies, so their
health must be checked before and after an approved change.

Loopback ports 18443, 18444, 18445, and 30443 are occupied. SSH listens on 42069.
No public 443 listener was observed. Recheck before selecting a new loopback
port; this snapshot reserves nothing.

## Preferred remedy: a separate Docker host

Provision an owner-approved disposable host with standard Docker Engine and
Compose. Leave every existing mrml.ca workload, volume, and security policy in
place. Upload only authenticated offline image archives and deployment inputs;
preload images, then rerun the exact hardened probe. Continue the two-repository
acceptance sequence only after it executes with all controls intact. This is
the lowest-impact remedy and does not require moving historical runtime state.

## Optional same-host migration, only after separate authorization

The following is a proposed sequence, not a shell script or an execution record.
It changes a shared host and requires a maintenance window covering workload
quiescence, cold backup, installation, restoration, acceptance, and rollback.
Duration cannot be promised until backup/restore throughput and the final
package set are known. Retain SSH access and an independent owner console.

1. Obtain explicit approval for affected Docker workloads, the maintenance
   window, target Engine/package versions, and rollback cutoff. Complete an
   owner-held inventory of container definitions, exact image IDs, restart
   settings, mounts, networks, volume drivers/options, numeric ownership, and
   application dependencies. Keep secret environment/configuration information
   on the host or in the owner's encrypted backup, never in chat or this repo.
   Inventory every volume, including unused historical/recovery state.
2. Prepare the official Ubuntu APT repository using Docker's signed repository
   procedure, select exact available Engine/CLI/containerd/Buildx/Compose
   versions, and review the package transaction before installation. Current
   documentation lists Resolute 26.04 as supported. The package set is
   `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-buildx-plugin`, and
   `docker-compose-plugin`. No exact CE version is selected here because the
   host currently has no candidate. Do not blindly remove container runtimes or
   alter Podman dependencies. The official procedure is
   [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/).
3. Before stopping anything, export required immutable images through Docker's
   image-save interface or retain independently verified development-machine
   archives. Hash and bind archives to exact image IDs. Image archives are not
   backups of named volumes or writable container state. Preserve any meaningful
   writable-layer data with an independently reviewed application export.
4. During the approved window, stop exactly the inventoried Docker application
   writers in dependency order and confirm none still uses each backup volume.
   Back up named volumes cold with numeric ownership, modes, ACLs/xattrs and
   links preserved, plus a per-volume inventory and integrity hashes. Prefer
   MRML's authenticated encrypted application backup for supported namespaces;
   account separately for every excluded secret/configuration/runtime root.
   Socket files are transient: recreate exact runtime directory ownership rather
   than replaying stale sockets. Keep secrets on the host or in owner-controlled
   encrypted backup. Restore a sample into new isolated volumes and verify it
   before relying on that backup. Docker documents generic volume backup and
   restore mechanics in [Volumes](https://docs.docker.com/engine/storage/volumes/);
   those mechanics alone do not prove MRML application consistency.
5. Stop/disable the Snap daemon only after cold backups and the rollback inventory
   are verified. Preserve its complete original data root, Snap revision and
   configuration. Do not uninstall/purge the Snap, delete volumes, rename its
   data root, or run Snap and CE against the same daemon socket or data directory.
   Install the reviewed official packages with a separate clean CE data root.
   Package installation may start its daemon; control that transition within
   the approved window. This plan does not claim direct copying of Snap graph
   storage into CE is supported.
6. Load verified image archives and compare exact IDs, create fresh destination
   named volumes, and restore only their approved cold application contents.
   Verify numeric owners/modes and application digests. Recreate Compose
   services from reviewed configurations, retaining every hardening control and
   explicit loopback-only bindings. Run the unchanged no-mount probe first,
   then authenticated recovery and two-repository clone/push/restart tests.
   Verify unrelated Podman workloads and SSH remain healthy. Do not enable
   public ports, discard old state, or claim release acceptance from the probe.
7. Keep the preserved Snap state and encrypted backups through an owner-selected
   rollback period. Do not allow production writes on the migrated application
   until the acceptance decision; otherwise rollback requires reconciling newer
   durable generations through supported authenticated application recovery.

## Rollback boundaries

Before new application writes, stop CE application consumers and its daemon,
confirm the socket/ports are free, then re-enable the retained Snap revision and
original data root under owner approval. Start only the previously inventoried
workloads and verify their exact generations. Do not point Snap at CE storage.
Returning to Snap restores the prior workload environment; it does not repair
the hardened-Compose blocker.

After new writes, never blindly select the old volume snapshot. Keep both states
and stop conflicting writers; use MRML's authenticated generation/receipt and
backup recovery path to preserve acknowledged updates without bypassing
anti-rollback policy. Failure to reconcile is an explicit service outage, not
permission to edit generation files. No destructive cleanup belongs in rollback.

## Exact read-only/probe commands

SSH prefix used for the observations (no credential contents are read):

```sh
ssh -F /dev/null -o BatchMode=yes -o ConnectTimeout=10 \
  -o StrictHostKeyChecking=yes \
  -i /home/m/.ssh/server_ed25519 -p 42069 ubuntu@mrml.ca
```

Read-only commands to repeat on the host:

```sh
sudo -n docker version
sudo -n docker compose version
sudo -n docker context show
sudo -n docker system df
sudo -n docker ps -a --format '{{.Names}} {{.Status}} {{.Ports}}'
sudo -n docker volume ls --format '{{.Name}}'
sudo -n docker image ls --no-trunc --format '{{.ID}}'
snap list docker snapd
snap connections docker
apt-cache policy docker-ce docker-ce-cli docker.io containerd.io docker-compose-plugin
ss -ltn
```

Previously executed probe command; rerunning starts only this disposable probe:

```sh
sudo -n docker compose \
  -f /home/ubuntu/mrml-git-completion-20260904-hardening/compose.yaml \
  -p mrml-git-completion-20260904-hardening \
  up --no-build --pull never --abort-on-container-exit \
  --exit-code-from authority-probe
```

## Alternate disposable daemon feasibility — read-only review

A follow-up host inspection found `slirp4netns`, `newuidmap`, `newgidmap`,
`unshare`, and `nsenter`, cgroup v2, a user systemd manager, and Ubuntu's
subordinate UID/GID range `100000:65536`. It did not find `rootlesskit` or
`dockerd-rootless.sh`. Restricted unprivileged user namespaces are enabled.
The rootlesskit AppArmor profile exists, but its executable is absent.

Rootless Docker is not equivalent evidence for the requested confinement:
Docker documents lack of AppArmor support and requirements for cgroup resource
limits. See the official [rootless limitations](https://docs.docker.com/engine/security/rootless/troubleshoot/)
and [resource-limit requirements](https://docs.docker.com/engine/security/rootless/tips/).

The Snap contains direct Docker/containerd/runc binaries. Launching them outside
the Snap launcher changes daemon confinement and does not repair or qualify the
existing engine. A separate rootful daemon would need its own socket, PID,
configuration, data and execution roots, containerd, network namespace, and
cgroup ceiling. It must preserve enforcing container AppArmor without replacing
shared profiles, avoid host firewall/forwarding changes, and prove the existing
engines remain unaffected. Docker calls [multiple-daemon operation](https://docs.docker.com/reference/cli/dockerd/#run-multiple-daemons)
experimental. No alternate daemon was started, tool installed, profile changed,
or engine migrated. This feasibility review does not establish an accepted
deployment workaround.

Patent review: **NOT_TRIGGERED**. This is operational diagnosis and a proposed
conventional backup/restore and engine-provisioning workflow, not a new
mechanism. See [REVIEW_LOG.md](../../patents/REVIEW_LOG.md).
