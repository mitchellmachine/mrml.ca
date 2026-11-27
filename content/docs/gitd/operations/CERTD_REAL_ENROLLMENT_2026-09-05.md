# Real certd enrollment and recovery — 2026-09-05

This is controlled local Linux/rootless-Podman evidence, supplemental to the
required Docker Compose acceptance on `mrml.ca`. It runs the production
`mrml-certd` daemon and production `GitdCertdChannelClient`; the test probe is
only an authenticated client. OpenSSL 3.6.4 (25 Aug 2026) acts as a disposable
CA oracle. No public CA, host trust-store modification, production key, or
fixture replacement daemon is involved. It does not prove seamless service
through the interval between candidate staging and activation, real ACME
network issuance, or complete Gitd TLS refresh acceptance.

## Defects reproduced and corrected

- The actual trust-root loader rejected every input because its requested
  65,536-byte public-chain bound exceeded `HostedSecret`'s 16,384-byte limit.
  The retained public-file reader now enforces the public bound, exact owner,
  mode, regular-file/single-link identity and configured digest. Secret limits
  remain unchanged. Red: 143 library passes, two expected loader failures.
- Real RPC18 returned the TLS public key, but RPC19 failed: the sealed certd
  policy digest and CSR identifier digest used distinct domains. The explicit
  configured-DNS CSR adapter first checks the exact requested name set against
  the retained policy digest, then signs only that set's CSR-domain digest.
  Sealed/configuration bindings and generic signing checks remain unchanged.
  Red: 144 passes, one expected configured-CSR failure.
- Real RPC20/21 activated the issued identity, but Gitd rejected its snapshot
  with `Publication`: certd had emitted the certificate-chain digest instead
  of the complete versioned identity-publication digest. The producer now
  hashes the exact serialized name, generation, chain, SPKI, validity, and
  signature schemes in consumer protocol order. Durable chain digests remain
  unchanged. A separate SHA-256 golden and field-mutation regression cover it.

Canonical commands (run with local Unix/TCP sockets permitted):

```sh
target/debug/mrml test org.mrml.service.certificate --target linux --release
target/debug/mrml build org.mrml.service.certificate --target linux --release
target/debug/mrml build org.mrml.test.gitd-certd-fixture --target linux --release
podman build --network=none --pull=false -f deploy/compose/Dockerfile.certd -t localhost/mrml-completion/certd:c-publication-20260905 .
```

Final normal suite: **145 library + 6 hosted-binary tests passed**.
AddressSanitizer also passed **145 + 6**, using the same test command with
`--sanitizer address`; log `/tmp/mrml-certd-completion-asan.log`. Normal release
binaries were rebuilt afterward before further image use.
Local logs: `/tmp/mrml-certd-publication-green.log`,
`/tmp/mrml-certd-publication-build.log`, `/tmp/mrml-certd-publication-image.log`,
`/tmp/mrml-certd-completion-probe-final.log`.
Production executable SHA-256:
`ea6b741698d3053794341d26ffd51bface56d293a3d3fc606617817c579c429c`.
Final local image ID:
`dece490d59b7c5cdd8d05fcdaae6577c7976ae3d42aeb866c89a8dfc127e6e8c`.

## Disposable inputs and transferable Docker recipe

The exercised namespace was `/tmp/mrml-completion-c-real`, with containers
`mrml-completion-c-fixed-certd`, `mrml-completion-c-csr-certd`, and final
`mrml-completion-c-final-certd`. All are stopped; test state is retained.
Create a **new private namespace** for another run. Never overwrite live service
paths. For rootless Podman, provisioning ownership commands run through
`podman unshare`; for owner-authorized rootful Docker provisioning, use its
isolated volume helper/root context. Do not apply these UID/mode changes to
unrelated host directories.

| Namespace path | UID:GID | Mode | Container destination |
|---|---|---|---|
| `config` | 0:0 | 0755 | `/etc/mrml/certd` read-only |
| `config/config.json`, `config/acme-trust-roots.pem` | 0:0 | 0444 | public configuration |
| `secrets-certd` | 21003:21003 | 0700 | `/run/secrets` read-only |
| `secrets-certd/certd-unlock.key`, `certd-gitd.cap`, `certd-acmed.cap` | 21003:21003 | 0400 | 32-byte independent random secrets |
| `secrets-gitd/certd-gitd.cap` | 21001:21001 | 0400 | exact Gitd capability copy |
| `secrets-acmed/certd-acmed.cap` | 21004:21004 | 0400 | exact ACME capability copy |
| `runtime-gitd` | 21003:21902 | 2750 | `/run/mrml/certd-gitd` |
| `runtime-acmed` | 21003:21903 | 2750 | `/run/mrml/certd-acmed` |
| `state` | 21003:21003 | 0700 | `/var/lib/mrml/certd` |
| `publications` | 21003:21003 | 0700 | `/var/lib/mrml/publications` |
| `enrollment` | 21004:21004 | 0755 | client public CSR/chain exchange |

Capability parent directories are 0700 and owned by their respective clients.
Generate three independent 32-byte values locally with a cryptographic random
source; copy only the matching channel value between its server/client files.
Never print them or export them to chat. Keep the disposable CA key owner-private
outside daemon/client mounts. A fresh CA can be generated with:

```sh
umask 077
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 365 \
  -subj '/CN=MRML disposable test CA' \
  -addext 'basicConstraints=critical,CA:TRUE' \
  -addext 'keyUsage=critical,keyCertSign,cRLSign' \
  -addext 'subjectKeyIdentifier=hash' \
  -keyout "$TEST_ROOT/ca/key.pem" -out "$TEST_ROOT/config/acme-trust-roots.pem"
```

Use this public configuration, substituting the SHA-256 of the **exact PEM
file bytes** and consistently selecting the intended test server DNS name:

```json
{"directory_url":"https://ca.git.example/directory","directory_generation":1,"directory_class":"local-test","production_enabled":false,"account_identity":"11111111111111111111111111111111","account_generation":1,"identity":"22222222222222222222222222222222","key_generation":1,"policy_generation":1,"identifiers":["git.example"],"wildcard_enabled":false,"key_algorithm":"P-256","trust_store_sha256":"REPLACE_WITH_EXACT_ROOT_PEM_SHA256","maximum_validity_seconds":7776000,"minimum_remaining_lifetime_seconds":604800,"maximum_chain_length":4,"certificate_profile":"classic"}
```

The exercised name was `git.example`; `certdfixture.mrmltest` can be selected
for the separate Docker test if configuration, leaf SAN, Gitd server name and
client request agree. Do not claim a name change was exercised here.
The directory URL is identity context only; these commands make no CA network
requests. Test-CA private material never enters certd: certd creates and retains
its own account and TLS keys in sealed storage.

Start the production image with `serve`, UID:GID `21003:21003`, supplemental
GIDs `21902,21903`, read-only root, all capabilities dropped,
`no-new-privileges`, network `none`, PID limit 64 and memory limit 256 MiB.
Mount only the six daemon destinations in the table, with configuration and
secrets read-only. No ports. Named volumes may replace these disposable bind
mounts in the Docker Compose acceptance namespace. Both socket parents must be
2750, **not 2770**; clients need search access, never directory mutation rights.

Before enrollment:

```sh
podman exec mrml-completion-c-final-certd /usr/bin/mrml-certd lifecycle-health
```

Expected: `mrml-certd lifecycle ready`. Identity `health` intentionally requires
an activated certificate; it is distinct from startup/lifecycle health.

Run `/usr/bin/probe` by mounting the built
`target/mrml-native/linux/release/mrml-gitd-certd-test-probe` read-only into a
one-shot container using the same image. ACME client UID:GID is `21004:21004`,
supplemental GID21903. Mount `runtime-acmed` at `/run/mrml/certd-acmed` read-only,
`secrets-acmed` at `/run/secrets` read-only, config at `/config` read-only, and
public exchange at `/enrollment` writable only for CSR export. Keep network
none, read-only root, dropped capabilities and no-new-privileges.

```sh
/usr/bin/probe enroll-csr /run/mrml/certd-acmed/certd.sock /run/secrets/certd-acmed.cap 21004 /config/config.json 1 /enrollment/csr.der
```

Expected: CSR exported, next request ID3. RPC18 and19 are actual authenticated
production calls. Sign this public CSR on the owner-controlled local CA side:

```sh
openssl x509 -req -inform DER -in "$TEST_ROOT/enrollment/csr.der" \
  -CA "$TEST_ROOT/config/acme-trust-roots.pem" -CAkey "$TEST_ROOT/ca/key.pem" \
  -set_serial 1001 -days 30 -sha256 -extfile "$TEST_ROOT/enrollment/leaf.ext" \
  -out "$TEST_ROOT/enrollment/leaf.pem"
cat "$TEST_ROOT/enrollment/leaf.pem" "$TEST_ROOT/config/acme-trust-roots.pem" > "$TEST_ROOT/enrollment/chain.pem"
```

`leaf.ext` contains:

```ini
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectAltName=DNS:git.example
```

The chain must be root- or ACME-client-owned, regular, single-link, non-writable
by group/other, and readable by the client (the exercise used0444).
Import/activate from the same ACME client context:

```sh
/usr/bin/probe enroll-activate /run/mrml/certd-acmed/certd.sock /run/secrets/certd-acmed.cap 21004 /config/config.json 3 1 3333333333333333333333333333333333333333333333333333333333333333 /enrollment/chain.pem
```

Expected: `real-certd activated identity_generation=1 next_request_id=5`.
The explicit nonzero order digest is disposable test context. Request IDs must
advance for every authenticated request in the role's running daemon session.

## Real Gitd consumer, renewal and recovery results

Run the same probe as UID:GID21001:21001, supplemental GID21902, Gitd socket and
Gitd capability mounts, and explicit environment
`MRML_CA_BUNDLE=/config/acme-trust-roots.pem`. No host trust changes:

```sh
/usr/bin/probe /run/mrml/certd-gitd/certd.sock /run/secrets/certd-gitd.cap 21001 21001 21003 21003 21001 git.example
```

This exercised authenticated health, identity snapshot, real chain/name/time/
publication validation, constrained TLS1.3 CertificateVerify signing proof,
and unchanged-generation wait: **PASS generation1**. A second run in the same
session sets `MRML_TEST_CERTD_FIRST_REQUEST_ID=5` (four calls were consumed).
This environment variable affects the test client only. Never run this probe
against the Gitd role while an actual Gitd service owns that role: its independent
request counter would conflict. The final Compose run uses the actual Gitd client
for its Gitd channel and this enrollment probe only for the separate ACME role.

Renewal reused the same certd-held key/CSR, issued serial1002 into `leaf2.pem`,
assembled `chain2.pem`, and used `enroll-activate ... FIRST_ID 2
4444444444444444444444444444444444444444444444444444444444444444
/enrollment/chain2.pem`. Here FIRST_ID was1 because the final-image daemon had
restarted after the previous image's enrollment; without that restart use the
next unused ACME request ID. **Activation and identity health PASS generation2**.
This proves certificate renewal with the same key, not TLS key rotation.

`podman kill --signal KILL mrml-completion-c-final-certd` produced exit137 and
left both exact owned socket names. `podman start` reclaimed those stale sockets
under the retained directory lock. Lifecycle health and identity health passed;
the real Gitd client and signing proof passed generation2, then passed again
with first request ID5. `podman stop --time 5` subsequently exited0 and removed
both socket names. A final actual-process partial-frame test ran the probe's
`hold-partial-frame /run/mrml/certd-acmed/certd.sock` command as UID21004/GID21004
with supplemental GID21903. It verified the server peer, wrote one length-prefix
byte, reported readiness, and held the connection for ten seconds without a
capability/HMAC. Immediately after readiness, `podman stop --time 5` completed
in **2.566 seconds including engine overhead, exit0**, proving bounded shutdown
while a frame read was pending. No unrelated container or volume was removed.

Independent agent review completed for the trust reader and signer/publication
adaptations with no concrete bypass found; this is not an external audit. Patent review: NOT_TRIGGERED for
these bounded correctness repairs to existing digest binding, public-file
reading and existing TLS/CSR protocols; see [review log](../../patents/REVIEW_LOG.md).

## Follow-up: concurrent staging and identity-read lock order

The subsequent parent-run real Docker Compose rotation identified a cross-role
lock inversion that the sequential Podman enrollment above did not exercise.
Staging retained `certificate_keys` while waiting for durable state, and the
Gitd identity reader retained durable state/authentication guards while waiting
for `certificate_keys`. A separate health process has different mutexes and
therefore cannot rule out this in-process deadlock.

The bounded two-thread regression in `certd_lock_order_tests.rs` exercises the
actual production publication boundary: the reader holds a durable mutex while
requesting the key mutex, and staging reaches publication with its key guard.
The reader's bounded `try_lock` deadline makes the old behavior fail rather than
hang the test runner. Red: 145 library passes, six binary passes, one expected
lock-order failure (`/tmp/mrml-certd-lock-order-red2.log`).

The correction drops the key guard after complete certificate verification and
signing proof, before publication. The identity reader drops durable/authentication
guards only after the owned state and publication bytes pass all digest/binding
checks, before checking startup-fixed key membership. Candidate-stage/activation
serialization remains the existing single ACME-role worker; this patch does not
introduce concurrent ACME mutation or change candidate transitions.

Normal canonical tests passed **145 library + 7 binary tests**, including the
new bounded concurrency regression (`/tmp/mrml-certd-lock-order-green.log`).
AddressSanitizer also passed **145 + 7**, log
`/tmp/mrml-certd-lock-order-asan.log`.
The earlier executable/image digests identify the sequential enrollment run;
they do not identify the later lock-order fix. Actual concurrent Docker rotation
acceptance must use a rebuilt image and be recorded separately by that run.
