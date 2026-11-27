# MRML Git key-provider boundary

`mrml-git` does not automatically interpret legacy `ssh.privateKey`,
`user.signingkey`, or `gpg.openpgp.privateSeedFile` values as private-key file
authority. Repository configuration may select a credential or signer provider
and a key identity, but ordinary production operation must route the exact SSH
authentication or Git-signing operation to that provider.

Native SSH authentication and SSH-format Git signing are **EXPERIMENTAL** and
excluded from the production client profile. Every operation that parses or
uses an SSH private key, and every network operation against an SSH remote,
fails closed unless the operator deliberately sets
`MRML_GIT_EXPERIMENTAL_SSH=1`. HTTPS remains the production transport. This
explicit switch does not assert that SSH is production-safe.

The current host-file bridge is development-only. It additionally remains
disabled unless the operator deliberately sets
`MRML_GIT_DEVELOPMENT_KEY_FILES=1`; configuration
must additionally select `development-key-file`. The loader opens the final
component without following a link, requires an already-open regular file owned
by the effective user with mode `0400` or `0600`, bounds the descriptor read,
and performs volatile erasure of the loaded byte buffer. RSA private-key values
are non-cloneable, expose no private fields, render only
`RsaPrivateKey(<redacted>)`, and erase the private exponent with volatile stores
on drop.

This bridge is not a production signer, credential daemon, HSM integration, or
claim that compiler-created copies, registers, caches, swap, or hardware traces
are erased. Production protected operation rejects it and uses the narrow
`unix-v1` protected signer described below.

Native HTTPS now has a non-cloneable scoped Bearer credential boundary. Each
use is bound to the exact host, port, repository path, and read/write action;
only canonical lowercase 256-bit token encodings are accepted. Diagnostics are
redacted and the sole authorization buffer is erased with volatile stores on
drop. H2 and H3-v2 add exactly one Authorization header only while borrowing a
matching scoped credential. Anonymous operations never synthesize one.

The CLI's `standard-input` provider is an explicit non-persistent bridge for
deployment secret injection. It reads at most 66 bytes through a dedicated
byte-buffer API, accepts one canonical token with an optional line ending,
stores neither token nor token path in repository configuration, and erases its
input and retained token buffers. Clone selects it with the non-secret
`MRML_GIT_CREDENTIAL_PROVIDER=standard-input`; an existing repository selects
it with `http.credentialProvider=standard-input`. Token plaintext is supplied
only on standard input.

Linux also implements the production-shaped `unix-v1` credential provider and
the separate `mrml-git-credential-agent` daemon. The client sends an exact
validated host, port, repository path, and read/write action over a bounded Unix
frame. A separately owned 256-bit channel capability authenticates a fresh
agent-generated five-second session challenge, the complete request, and the
response. The client verifies the daemon's exact UID/GID with Unix peer
credentials. The daemon independently verifies the client's exact UID/GID and
will return its single configured token only for its fixed scope, allowed
action, and exact nonzero credential generation. It has no operation to list a
credential database, return a different token, change policy, or accept a path
from the client.

Repository configuration selects `http.credentialProvider=unix-v1` and records
only the socket, the client-owned capability-file path, expected agent UID/GID,
and credential generation. Clone can receive those same non-secret routing
values through `MRML_GIT_CREDENTIAL_SOCKET`,
`MRML_GIT_CREDENTIAL_CAPABILITY_FILE`, `MRML_GIT_CREDENTIAL_UID`,
`MRML_GIT_CREDENTIAL_GID`, and `MRML_GIT_CREDENTIAL_GENERATION`; token plaintext
is never accepted in configuration, an environment variable, or an argument.
Rotating or revoking the server-side token requires a matching Gitd token-store
transition and a recreated agent at a higher generation; clients pinned to the
old generation fail closed. Returned token and frame buffers are erased after
their one immediate HTTP authorization use. This is hosted implementation
evidence; container confinement and complete deployment lifecycle evidence are
recorded separately.

## Protected hybrid signer

On Linux, `mrml-git-protected-signer` owns the reusable OpenPGP v6 seed and
ML-DSA-65 secret. `mrml-git` receives neither secret. Its Unix connection is
authenticated with the server's exact UID/GID and a distinct 256-bit channel
capability. Each bounded request is restricted to one SHA-256 Git commit and
binds the repository identity, commit ID, exact commit bytes, repository
generation, trust generation, and revocation generation. The daemon recomputes
the commit ID and exact hybrid transcript before signing. The client verifies
both returned signatures against its independently loaded active trust policy
before any upload.

The repository selects this route using only non-secret configuration:

```ini
[gpg "protected"]
    signerProvider = unix-v1
    signerSocket = /run/user/1000/mrml-git-signer.sock
    signerCapabilityFile = /run/user/1000/mrml-git-signer.cap
    signerUid = 21006
    signerGid = 21006
    trustPolicyDirectory = /absolute/trusted/policy/owner/project
    openpgpPublicKeyFile = /absolute/trusted/keys/openpgp-v6.asc
    mlDsaPublicKeyFile = /absolute/trusted/keys/ml-dsa-65.pub
```

The capability file and both daemon secret files must be regular, single-link,
signer-owned files opened without following the final symlink. Capability and
secret files require mode `0400` or `0600`; public material must not be
group/world writable. The production signer runs as `21006:21006`; its socket
directory is `21006:21906` mode `2770`, and the socket is `21006:21906` mode
`0660`. The ordinary Git client receives only membership in group `21906` for
socket traversal and a separately owned copy of the channel capability. It
cannot read signer keys or durable signer state.

Fresh deployments generate the hybrid keypair directly inside the already
provisioned signer-key named volume. The one-shot signer image has no network,
read-only root, no capabilities, `no-new-privileges`, bounded resources, and no
writable mount other than that volume:

```text
sudo MRML_CONTAINER_RUNTIME=docker MRML_VOLUME_PREFIX=mrml \
  ./generate-git-signer-keys.sh VERSION OPENPGP_CREATED_AT
```

Select `podman` explicitly when the deployment uses a Podman image and volume
store. The operation exclusively creates `openpgp.seed`,
`openpgp-public.asc`, `ml-dsa-public.bin`, and `ml-dsa-secret.bin`, applies
exact signer ownership and `0400`/`0444` modes, synchronizes the volume, and
fails closed rather than replacing any existing output. It never prints or
exports either private key. Copy only the two public files into the separately
owned authority and client policy inputs.

Start the daemon as the key-owning non-root user:

```text
mrml-git-protected-signer serve SOCKET CAPABILITY CLIENT_UID CLIENT_GID OWNER_UID SOCKET_GID REPOSITORY REPOSITORY_GENERATION TRUST_GENERATION REVOCATION_GENERATION STATE_FILE AUTHORITY_RECEIPT_PUBLIC OPENPGP_SEED OPENPGP_CREATED_AT ML_DSA_PUBLIC ML_DSA_SECRET
```

The socket path and key paths identify resources but grant no signing authority.
The channel capability and exact daemon policy do. The daemon accepts no generic
message-signing, key-export, lifecycle, or repository-write operation. SIGINT or
SIGTERM wakes the listener, erases loaded secret buffers, and removes only the
exact socket inode created by that process.

Protocol v2 begins each connection with a signer-generated 256-bit random
session identifier, a five-second absolute expiry, and an authenticated maximum
sequence of one. The client authenticates that hello with its separately owned
channel-capability copy before sending commit material. The request and response
bind the session identifier, expiry, sequence, peer credentials, repository,
all generations, Git-commit purpose, object ID, and exact commit bytes. A frame
captured from one connection therefore fails under the next connection's random
session. The deliberately single-request session also bounds concurrency and
eliminates an in-session replay window rather than treating an echoed request ID
as replay prevention.

After a protected receive durably activates, the client relays the returned
authority-signed receipt over a distinct authenticated operation. The signer
verifies the authority Ed25519 signature, signer identity, repository, and exact
current/trust/revocation generations before atomically replacing and
directory-syncing its checksummed generation state. It sends success only after
reopening the new state. A replay or skipped generation is rejected, including
after daemon restart; bootstrap generation arguments cannot roll an existing
state volume backward.

An external readiness probe authenticates the Unix peer and v2 hello, then
sends a capability-, session-, expiry-, sequence-, and request-ID-bound health
request and requires the matching authenticated empty response:

```text
mrml-git-protected-signer socket-health SOCKET CAPABILITY CAPABILITY_OWNER_UID SIGNER_UID SIGNER_GID
```

The same binary provides a cold, offline owner operation for policy rotation:

```text
mrml-git-protected-signer sign-key-rotation SIGNER_OWNER_UID POLICY_OWNER_UID REPOSITORY TRUST_GENERATION OPENPGP_SEED OPENPGP_CREATED_AT ML_DSA_PUBLIC ML_DSA_SECRET NEXT_POLICY OPENPGP_PUBLIC_OUTPUT OPENPGP_SIGNATURE_OUTPUT ML_DSA_SIGNATURE_OUTPUT
```

It parses the complete canonical next policy, requires its repository to match,
constructs only the `KeyRotation`/SHA-256 hybrid transcript at the explicit trust
generation, verifies that the ML-DSA public and secret inputs agree, and writes a
bare OpenPGP-v6 public key plus both detached signatures. Outputs are absolute,
owner-controlled, mode-`0600`, no-overwrite files followed by file and directory
sync. The operation has no socket, network, repository-write, generic-signing,
or private-key-export path. Run it once with the currently authorized signer and
once with the candidate signer; the two OpenPGP public outputs identify which
signature came from which generation. The candidate policy remains data until
the separately stopped, volume-fed authority transition independently verifies
both hybrid authorizations and durably selects it.

After selection, the same networkless admin workflow advances the current
signer's durable trust state with:

```text
mrml-git-protected-signer advance-trust SIGNER_OWNER_UID SELECTED_POLICY_OWNER_UID TRANSITION_OWNER_UID REPOSITORY STATE_FILE PREVIOUS_POLICY SELECTED_POLICY CURRENT_OPENPGP_SEED CURRENT_OPENPGP_CREATED_AT CURRENT_ML_DSA_PUBLIC CURRENT_ML_DSA_SECRET PREVIOUS_OPENPGP_SIGNATURE PREVIOUS_ML_DSA_SIGNATURE NEXT_OPENPGP_PUBLIC NEXT_ML_DSA_PUBLIC NEXT_OPENPGP_SIGNATURE NEXT_ML_DSA_SIGNATURE
```

This operation requires the policy volume's already selected canonical state,
the exact previous canonical policy, both public transition authorizations, the
current use-only signer keys, and the candidate public pair. It applies the same
normal monotonic-transition rules as the authority, requires the current signer
pair to be active in the previous policy and the next pair to be active in the
selected policy, preserves repository generation, and atomically advances trust
and revocation generations. Replays and attempts made before policy selection
fail closed. If execution is interrupted after policy selection, rerun
`transition-git-trust.sh --resume-signer ...`; public inputs are retained until
the signer has reopened its exact new state.

The experimental native SSH proposal advertises `rsa-sha2-256` only; the SHA-1 `ssh-rsa`
signature algorithm is not negotiable. Duplicate algorithm-list entries fail
closed. Independent inbound and outbound encrypted states force a complete
Curve25519 key exchange after either 1,048,576 packets, 1 GiB of wire bytes, or
one hour under a key. A fixed eight-packet control reserve permits only the key
exchange to finish; application packets fail closed while rekey is required,
and a 32-bit sequence cannot wrap under one key. Rekey preserves the original
session identifier, verifies the new exchange signature, and revalidates the
server key against an exact bounded current-plus-next pin set associated with
the requested host and port. Failure aborts the owning SSH operation.

Socket reads and writes have a 15-second inactivity timeout. Identification and
key exchange, authentication, and channel setup additionally have 60-second
phase deadlines; an SSH operation has a four-hour absolute deadline checked at
every packet boundary. These bounds are implementation evidence, not a claim
that the custom cryptographic code has received independent constant-time
validation. The current RSA parser also admits keys below the intended
production minimum and the custom RSA private operation has not established
blinding or an equivalent reviewed side-channel defense. Those are production
blockers, which is why the production client profile rejects SSH rather than
treating the environment switch as an approval or capability.

Patent review: **NOT_TRIGGERED**. These changes use conventional local
secret-file confinement, a purpose-limited authenticated Unix channel, provider
selection, diagnostic redaction, and memory erasure around already-reviewed
OpenPGP v6 and ML-DSA-65 primitives. They introduce no new cryptographic
primitive or patent-sensitive selection mechanism. See
[`docs/patents/REVIEW_LOG.md`](../../patents/REVIEW_LOG.md).
