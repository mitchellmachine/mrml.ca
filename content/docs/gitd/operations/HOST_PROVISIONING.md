# Git host provisioning

Status: **PARTIALLY IMPLEMENTED**. Git-owned Docker-managed data, socket,
secret, and configuration volumes have an idempotent host provisioner.
Image-only Compose validation,
offline image bundling, cold backup/restore, and immutable image
upgrade/rollback are separate implemented operators. Native one-shot repository
and initial protected-policy creation, token administration, and bounded recovery
operations exist. Authenticated normal trust-transition administration is
implemented; emergency trust-transition administration remains incomplete.

Run `deploy/compose/provision-git-host.sh` as root with Docker available. On a
fresh combined Git/ACME host, run Git provisioning before
`provision-acme-host.sh`: Git creates the shared socket volume with its required
copy-up sentinel, and ACME preserves that existing volume. Wait for certd
lifecycle readiness before enrollment; Compose process start alone is not
readiness. The
deployment root defaults to `/mnt/mrml` and now contains only operator inputs,
deployment metadata, and backup outputs; it is not mounted into a production
container. Durable data, secrets, configuration, and Unix-socket directories
are separately scoped explicit `mrml-*` Docker volumes. Fixed
production identities and socket groups default to the values in the Gitd
deployment contract and can be overridden with the named numeric environment
variables in the script.

The provisioner creates only the declared Gitd, Git authority, secret,
configuration, and shared socket volumes plus operator backup/input paths.
New volumes receive their exact numeric owner and mode through the Docker volume
mountpoint; an existing volume is only inspected and is never silently re-owned
or re-moded. Unsafe volume names/mountpoints, paths, types, symlinks, owners, or
modes fail closed. A final probe requires file and directory sync, hard links,
and same-filesystem atomic rename before the host is accepted. The probe contains
no secret or repository data and is removed.

On a new host the scripts create paired Gitd/authority and Gitd/certd channel
capabilities in separate service-scoped secret volumes, plus a receipt key,
token pepper, and QUIC Retry key exactly once, then
revalidate type, owner, mode, link count, and exact length on every run.
`install-volume-inputs.sh` is the no-overwrite installer for reviewed
Gitd/certd/acmed configuration, the ordered authority repository bootstrap
catalog, authority public keys, trust roots, and the DNS-provider token; it
rejects running consumers and unsafe inputs. The authority catalog uses exact
`RepositoryIdentity` values and nonzero bootstrap generations; after first open,
the authenticated per-repository generation stores are authoritative and the
catalog cannot roll them back. It
never creates certificates, repositories, access tokens, trust policies,
detached proofs, or publisher keys. Those require explicit authority-bearing
administration so provisioning cannot replace selected policy or repository
state.

For a normal trust transition, construct the canonical next policy and obtain
detached OpenPGP-v6 and ML-DSA-65 signatures over its exact
`MRML-GIT-HYBRID-V1` key-rotation transcript from both one currently active
pair and one pair active in the next generation. Install the exact previous
policy, next policy, previous public pair, next public pair, and four detached
signatures with
`install-volume-inputs.sh authority-transition ...`. This no-overwrite command
places only public material in `mrml-git-authority-transition`; private signing
keys never enter the VPS or a production container. Stop Gitd and the authority,
then run
`transition-git-trust.sh OWNER/REPOSITORY VALIDATION_TIME CURRENT_GENERATION CURRENT_POLICY_DIGEST`.
The final two arguments are the exact currently selected generation/digest CAS
tuple, not the successor tuple. Both hybrid authorizations independently bind
the successor policy bytes and successor generation.

The bundled construction path does not require a host bind mount. First install
only the candidate public pair with `install-volume-inputs.sh
trust-construction OPENPGP_PUBLIC ML_DSA_PUBLIC`. With Gitd, authority, and the
signer stopped, run `construct-git-trust-policy.sh overlap OWNER/REPOSITORY
VALID_FROM VALID_UNTIL`, or use its `retirement OWNER/REPOSITORY RETIRED_AT`
form. A networkless authority-image process reads the durably selected policy
from the read-only policy volume and writes canonical `previous-policy.bin` and
`next-policy.bin` files to the separately scoped
`mrml-git-trust-construction` named volume. Inputs and outputs are immutable and
the command is exact-idempotent; a different operation cannot overwrite stale
workspace artifacts. The policy constructor never mounts signer private-key
volumes. The operator must independently review the decoded generation,
validity, active/retired pairs, previous digest, and printed next digest before
asking either signer pair to authorize the bytes.

The protected signer image authorizes the reviewed `next-policy.bin` twice via
`sign-git-trust-policy.sh overlap`: once through the currently selected key
volume at the current trust generation and once through the separately selected
inactive key volume at the successor generation. Retirement instead uses
`sign-git-trust-policy.sh retirement` and the current surviving key for both
generation-bound authorizations; both creation-time arguments must therefore be
the current key's exact creation time. `MRML_GIT_SIGNER_KEYS_VOLUME` and
`MRML_GIT_SIGNER_CANDIDATE_KEYS_VOLUME` must name the two distinct provisioned
slots. Additional slots use the prefix-scoped
`mrml-git-signer-key-slot-NAME` form and must carry the MRML-managed volume
label. Selection swaps the configured roles without overwriting any volume. Both one-shot
services are read-only, networkless, and mount only their own private-key
volume, the public construction volume, and the signer-owned public signature
output volume. The policy input may be owned by UID 21001 while keys and
outputs remain owned by UID 21006; those ownership domains are checked
independently. `stage-git-trust-transition.sh overlap` then copies the exact
canonical policies, both distinct public pairs, and four signatures between
managed named volumes using the no-overwrite installer. Retirement uses
`stage-git-trust-transition.sh retirement`, which sources the successor
ML-DSA public key from the current surviving slot to match the successor
OpenPGP public key emitted by retirement signing. No private key is copied or
mounted into the authority transition service.

After selecting and exercising the overlap generation, stop all three daemons
and run `select-git-signer-key-slot.sh next OPENPGP_CREATED_AT
TRUST_GENERATION REVOCATION_GENERATION`. It atomically updates the mode-0600
environment file so the ordinary signer and the “current” rotation job resolve
the logical signer-key volume to the candidate named volume and the retired slot
becomes the next inactive candidate. Selection is
limited to the two provisioned managed slots and is refused while a consumer is
running. The requested trust generation must advance monotonically and the
revocation generation cannot decrease. Repeating the exact selected
creation-time/trust-generation/revocation-generation tuple is an idempotent
success and does not swap the slots again; this makes recovery safe when the
environment-file rename completed but its result was not observed. Restart and
validate a protected push with the candidate signer before
constructing retirement. For retirement, stage the old public pair as the
construction input, construct the monotonic retirement successor, authorize it
with the now-current key for both required generations, stage it, and execute
the same transition command. On complete signer advancement, the transition,
construction, and signature volumes are synchronized after their exact public
one-operation artifacts are consumed, allowing the next rotation without
deleting either private-key volume.
The signer advance is exact-idempotent after it has reverified both policies,
both hybrid authorizations, the retiring private pair, and the selected public
pair. The operator writes and synchronizes an invocation-bound completion
marker in the transition named volume only after that advance reopens exact
state. If the operator is interrupted before the marker, rerun with
`--resume-signer`; an already-advanced exact state is accepted without another
replacement. If interruption occurs during public-input cleanup, the marker
allows the same invocation to resume cleanup without rerunning either authority
selection or signer advancement. A marker for any other repository, validation
time, generation, or expected digest does not authorize cleanup. Completed
markers are retained as non-secret recovery evidence and never contain policy,
signature, key, or repository bytes.
The signer generation state is format-versioned and binds the exact active
OpenPGP/ML-DSA public pair. A dual-authorized trust transition upgrades legacy
generation-only state to the key-bound format; ordinary startup never performs
that migration and rejects a key pair different from the persisted binding.
Before restarting Gitd, run `update-git-trust-generation.sh OWNER/REPOSITORY
TRUST_GENERATION REVOCATION_GENERATION`. It exact-matches the protected catalog
entry, atomically advances its trust fields, reopens and hashes the catalog,
then atomically updates the config's bound catalog digest. A crash between the
two replacements leaves Gitd fail-closed on digest mismatch; the operation is
safe to resume while all three daemons remain stopped.
The networkless admin-profile container receives only the read-only current-key
and transition-input volumes plus a writable policy volume. It reopens the exact
expected generation, independently verifies both hybrid authorizations against
the canonical next bytes, installs the next pair as immutable generation-named
public verifier files beneath the capability-confined policy directory, syncs
those files and their directory, applies the monotonic policy rules, durably
selects the next generation, reopens it, and only then removes the consumed
public upload inputs. Extra verifier files left by a crash before selection are
inactive policy data; activation cannot precede durable verifier installation.
On authority restart, the configured bootstrap pair is used only while the
current policy authorizes it. Otherwise the authority loads only the exact
current trust generation's retained pair and revalidates that pair against the
current policy. Each later transition likewise reads its explicitly supplied
previous pair from the transition volume; it does not silently reuse the
bootstrap verifier after that pair has been retired. Stale, substituted,
malformed, unauthorized, or uncertain
transitions fail closed; a retained lock or temporary file requires operator
inspection.
With Gitd, authority, and the protected signer stopped, the same script next
runs the networkless signer admin profile. It verifies the already selected
policy against the reviewed previous policy and both hybrid authorizations,
requires the current signer keys to match the previous active pair, preserves
repository generation, and durably advances signer trust and revocation state.
Only after reopening that exact state does the script remove public transition
uploads. If interruption occurs after policy selection, rerun with
`--resume-signer`; this skips selection, repeats the full signer verification,
and retains inputs again on any failure.
The candidate should retain the configured previous pair during a planned
overlap so the authority remains startable while operators validate the new
generation. Emergency transition is deliberately a separate residual operation
and is not inferred from normal signatures.

After installing the production environment and policy/catalog files, run
`deploy/compose/initialize-git.sh` exactly once. It starts the preloaded Gitd
image as a network-unpublished one-shot process with `--no-deps`, reads the
mounted pepper through the same strict loader as the daemon, and creates an
authenticated empty generation-1 `tokens.v2`. Creation uses a private same-directory
temporary file, file sync, a no-overwrite hard-link activation, temporary
unlink, and directory sync. It refuses an existing destination and creates no
access token.

With Gitd and the authority stopped, `initialize-git-repository.sh` creates one
exact authenticated-catalog repository and prints its deterministic initial
SHA-256 tip and generations. For a catalog entry classified `protected`, install
the owner-selected OpenPGP v6 and ML-DSA-65 public keys as authority-owned
mode-`0444` regular files, then run
`initialize-git-protected-policy.sh OWNER/REPOSITORY VALID_FROM VALID_UNTIL`.
The second one-shot command requires the repository to equal
`MRML_PROTECTED_REPOSITORY`, reopens and admits its exact catalog generations,
binds `refs/heads/main` and the admitted initial tip as the hybrid cutover, and
creates the policy beneath a Gitd-owned mode-`0755` path. Policy state contains
public verification material and is non-writable to other identities so the
networkless authority can read the same authenticated bytes; repositories,
proofs, tokens, receipts, and secrets remain private. It permits SHA-256 and
requires the exact hybrid pair; it neither reads nor creates private signing
keys. Existing policy state is never overwritten. An ambiguous storage failure
is retained for inspection instead of being represented as safely retryable.

`token-git.sh issue` and `token-git.sh revoke` are transactional one-shot
operations that may run while Gitd is serving. An exclusive private
administration lock serializes concurrent issue/revoke operations, every
successful mutation advances the authenticated store generation, and Gitd
validates and atomically publishes the new immutable snapshot within one second.
Invalid, partial, same-generation-substituted, or rolled-back stores retain the
last authenticated snapshot and degrade readiness until a valid newer or exact
current generation is visible. Issuance accepts an exact repository identity, the bounded
`read`, `write`, or `admin` scope profile, validity interval, revocation
generation, and non-authoritative label. It displays the 256-bit token exactly
once and stores only a keyed verifier plus authenticated metadata. Revocation
accepts the token only on standard input, never an argument or environment
variable, uses an indexed verifier lookup with constant-time candidate
comparison, and atomically replaces the authenticated store with file and
directory sync. No Gitd restart is required.

`recovery-git.sh status` is a cold, read-only scan of every authenticated
repository journal. It reports only bounded aggregate counts for receipt
recovery, completion cleanup, pre-activation discard/reverification, and manual
uncertainty; it exposes no repository, ref, object, proof, or filesystem
identity. `recovery-git.sh complete-safe` requires Gitd stopped and the
authenticated authority/certd dependencies available, then performs only the
existing provably safe receipt recovery and completion cleanup. Reverification
and manual-uncertain states remain unavailable rather than being guessed.

`backup-git.sh` requires root so it can read the Docker-managed volume
mountpoints after confirming their exact names, bounded mountpoint shape, and
absence of symlinks. It writes the same deterministic, numeric-owner archive
namespace as before, combining the separately scoped data, secret, and
configuration volumes. Both backup and restore use the explicitly selected
Docker or Podman runtime and refuse operation while any container consumes the
prefix's Gitd-state or authority-state volume; this remains effective for
containers not created by the current Compose project. `restore-git.sh` refuses
any pre-existing target data
volume, validates the archive before extraction, provisions fresh volumes, and
extracts each subtree into only its exact volume before a final structural
revalidation. The scripts explicitly enable the isolated `admin` profile for
every one-shot Compose run on both engines. Runtime socket volumes and the
rebuildable cache are not restored.
The disposable restore namespace uses the same persistent volume suffixes as a
normal deployment, including `git-authority-secrets` and
`git-authority-config`. After recovery and validation, the operator can select
that exact namespace as `MRML_VOLUME_PREFIX`; no directory copying, volume
renaming, or alternate Compose model is required. Runtime socket and signer
volumes remain separately provisioned because they are not backup content.

Image upgrade and rollback resolve the engine-reported mountpoint of the
`mrml-gitd-state` volume, require its configured numeric Gitd owner and private
mode, and atomically record the activated immutable image version there only
after both services become healthy. They do not depend on the retired host-bind
state directory and do not roll repository or security generations backward.

The offline Git image lock binds each exact signed Docker archive by SHA-256 and
records its producer-engine image ID as provenance. The loader accepts only the
locked archive, verifies Linux/amd64, the fixed numeric user, and the exact
entrypoint after load, and may add only the equivalent `mrml/...` local tag when
a Podman-produced archive is imported by Docker as `localhost/mrml/...`. It
never pulls, rebuilds, or treats engine-specific image IDs as portable.

Normal receive completion now re-reads the exact final journal, removes it, and
syncs the journal directory after the durable receipt and final journal phase.
If cleanup alone fails, the receive remains definitely activated and successful;
the authenticated journal stays present for the same completion operation at
startup. Recovery likewise removes only an exact re-read recognized journal
after its receipt has been recovered and verified.

On 2026-09-02 the provisioners ran twice, unchanged, through rootful Docker
29.6.1 on the authorized `mrml.ca` Ubuntu x86_64 VPS. Both passes succeeded and
the second pass proved idempotence across all 22 declared managed volumes. The
combined all-volume Compose model also rendered successfully under Docker
Compose 5.3.1 without connecting the Docker Snap `removable-media` interface.
The cold Git archive was created from those volumes, its sidecar checksum
verified, and its logical volume roots inspected. The restore preflight verified
that archive and rejected an existing target volume before mutation. This is
real VPS provisioning/filesystem/backup evidence; a destructive restore
roundtrip, successful image start, public TLS exchange, and application
transaction remain unproven on that VPS.

Patent review: **NOT_TRIGGERED**. Docker volume provisioning, ownership/mode
checks, hard-link and rename probes, and filesystem sync are conventional
deployment mechanisms. See `docs/patents/REVIEW_LOG.md`.
