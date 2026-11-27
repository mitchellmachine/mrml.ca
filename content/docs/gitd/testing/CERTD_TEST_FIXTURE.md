# Gitd certd test fixture

Status: **IMPLEMENTED** for hosted Linux testing only.

`org.mrml.test.gitd-certd-fixture` is a bounded real-process fixture for the
Gitd-to-certd version-1 Unix channel. Its package kind, executable names, and
diagnostics all contain `test-fixture` or `test-probe`. Neither production
Dockerfile nor `deploy/compose/compose.git.yaml` references this package.
Production deployments must use `mrml-certd`.

The fixture exists only to test Gitd independently while certificate issuance
and lifecycle work remains separately owned. It implements exactly the four
operations allowed to the Gitd role: health, identity snapshot,
TLS 1.3 CertificateVerify, and bounded generation wait. It does not implement
ACME, renewal, revocation, key export, arbitrary signing, or certificate
activation.

The `serve` process requires an absolute Unix-socket path, a single-link
32-byte capability file, exact nonzero peer and socket-group identities, a lowercase DNS name,
a nonzero identity generation, a bounded request count, a DER leaf and issuer,
and a single-link 32-byte P-256 scalar file. Secret inputs must be owned by the
configured fixture owner and mode `0400` or `0600`. Before binding, the fixture
parses the leaf, checks its hostname, and proves that its P-256 public key is
the one in the certificate. The socket parent must be either owner-private
mode `0700` or the exact production-style setgid group directory mode `2770`.
The socket is mode `0660`; socket removal exact-matches the bound device and
inode.

The companion `mrml-gitd-certd-test-probe` uses the production Gitd certd
client. It checks health, obtains and independently validates the system-trusted
chain and publication digest, verifies a purpose-limited TLS 1.3 signing proof,
and checks the unchanged-generation wait response. A local test CA must be
provided through `MRML_CA_BUNDLE`; this is test process configuration and is
not a Gitd production identity fallback.

Evidence on 2026-09-02 used an ephemeral OpenSSL-generated P-256 CA and
`git.example` leaf under a mode-`0700` directory in `/tmp`. The fixture and
probe ran as UID/GID 1000 over a real Unix socket. The probe reported:

```text
mrml-gitd-certd-test-probe PASS generation=1
```

The fixture served exactly four authenticated exchanges and exited normally,
removing its socket. This proves the isolated hosted protocol path only. It is
not ACME, renewal/rotation, production-container, VPS, or public-network
evidence.

Focused command:

```text
./target/debug/mrml test org.mrml.test.gitd-certd-fixture --target linux
```

Result: one library test, two server-binary tests, and one probe-binary test
passed.

For container acceptance, the repository also contains the explicitly
test-only files `tools/containers/Dockerfile.gitd-certd-test-fixture` and
`tools/containers/compose.gitd-certd-test-fixture.yaml`. The overlay must be
combined with the production Git fragment only on a trusted test host. It runs
as `21003:21003`, joins only socket group `21902`, has no network namespace,
drops every capability, uses a read-only root, and mounts only the certd-Gitd
channel, runtime socket directory, and ephemeral certificate inputs. Production
image and Compose policy tests reject the fixture name.

The overlay adds the ephemeral root PEM to Gitd's process-local trust bundle
through `MRML_CA_BUNDLE`. This is explicit test trust for the generated leaf;
it is absent from the production Compose fragment and production images.

Podman Compose 1.6.0 successfully rendered the test overlay with
`deploy/compose/compose.git.yaml`. The merged model retained the production
Gitd and authority confinement and required fixture health before Gitd startup.
This is configuration-render evidence; no container runtime result is implied.

Patent review: **NOT_TRIGGERED**. The fixture composes already documented Unix
peer credentials, bounded HMAC-authenticated framing, X.509 parsing, SHA-256,
and TLS 1.3 ECDSA proof verification solely for testing. See
`docs/patents/REVIEW_LOG.md`.
