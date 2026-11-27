# Gitd production configuration

Status: **PARTIALLY IMPLEMENTED**. The strict version-1 parser, secure hosted
loader, storage-layout validation, and authority health client are implemented.
Authenticated authority/certd dependency health, catalog loading, repository
path derivation, and exact generation admission are also implemented as
libraries. Listener and recovery stages remain to be composed into the
executable.

Gitd accepts a bounded ASCII `key=value` configuration with an explicit
`version=1`. Every security-sensitive field is required exactly once. Unknown
fields, duplicates, whitespace aliases, noncanonical numbers, zero identities,
relative or dot-component paths, invalid DNS names, out-of-range resource
limits, and overlapping authoritative/cache roots fail startup.

The configuration identifies separate repository, state, quarantine, cache,
receipt, and policy roots; an exact repository catalog and protection-profile
catalog directly under the policy root; authenticated token records directly
under the state root; a token-verifier pepper and distinct QUIC retry key
restricted to `/run/secrets`; a nonzero retry generation; authority and certd
sockets and capability files; the Gitd, authority, and certd
numeric identities; nonzero persisted next authority and certd request
identifiers; connection/upload/receive/body limits; an explicit retained
ordinary free-space floor of at least 1 GiB; one unprivileged shared TCP/UDP
port; and a bounded drain interval. The production example retains 40 GiB;
smaller constrained deployments must deliberately select and monitor their
reduced emergency reserve. Paths identify deployment objects
but do not grant authority. Startup must subsequently open and validate each as
the appropriate capability before admitting traffic.

Both catalogs are bound to mandatory canonical lowercase SHA-256 digests in the
trusted configuration. Zero, uppercase, truncated, and extended digest forms
fail parsing. The conspicuous repeated example digests are placeholders and
must be replaced with the exact deployed catalog digests; a matching digest
authenticates bytes selected by trusted configuration but does not itself grant
repository authority.

The hosted loader opens an absolute config path with `O_NOFOLLOW`, requires one
bounded regular file owned by root or the configured Gitd UID, and rejects
group/world-writable modes. The native `mrml-gitd validate-config CONFIG`
command also validates every authoritative storage path and both exact catalog
digests before reporting success: each path component must be a directory rather than a symlink, unsafe
writable parents are rejected, leaf ownership must exactly match the configured
Gitd UID/GID, and writable roots must have owner write authority without
group/world write. The policy root may be owner-read-only. This command does not
report service readiness. It also securely loads authentication state and
admits every catalog repository only after deriving and validating all five
storage paths, reopening SHA-256 state, and exact-matching repository, trust,
and revocation generations. Authority and certd authentication remain later
startup gates.

`deploy/compose/gitd.example.conf` is a non-secret template. Production
provisioning must install a completed copy as a root- or Gitd-owned,
non-group/world-writable regular file; the template itself is never a runtime
credential or an authorization record.

`mrml-gitd dependencies-health CONFIG SIGNER_IDENTITY_HEX` composes these
startup gates without binding a listener. It validates configuration and
storage, authentication state, and every admitted catalog repository; securely
loads the two separately owned 32-byte capability files; erases transient key
copies; and authenticates exact health responses from both authority and certd
using independent configured request sequences. Failure of any local or remote
gate yields no partial-ready result. Only after both peers authenticate, it
requests the exact configured hostname's certd snapshot, independently verifies
its chain/hostname/current validity/SPKI/algorithm/publication binding, and
requires a test CertificateVerify signature to verify under the leaf key. Only
then does it enumerate each admitted repository's durable receive journals. Exact-new
protected transactions recover their immutable receipt through the remote
purpose-separated signing/verifying authority; exact-new nonprotected
transactions recover the checksum-protected receipt; completed journals are
accepted. Pre-activation re-verification and divergent/uncertain state still
fail this gate closed rather than being guessed or silently discarded.

The QUIC retry secret is exactly 16 nonzero bytes in a nonsymlink regular file
owned by Gitd with mode `0400` or `0600`. Its configured path must differ from
the token pepper and both channel capabilities. It initializes only the
address-validation token manager; it is never an authentication token,
repository capability, certd capability, or authority key.

The default production identities remain Gitd `21001:21001`, authority
`21002:21002`, and certd `21003:21003`. The parser permits explicit deployment
values so host provisioning can allocate equivalents, while zero/root identity
is always rejected.

Patent review: **NOT_TRIGGERED**. Strict configuration parsing and bounded
numeric/path validation are conventional defensive mechanisms. See
`docs/patents/REVIEW_LOG.md`.
