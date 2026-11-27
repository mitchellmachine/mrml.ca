# ACME certificate service

**Status: PARTIALLY IMPLEMENTED.** The bounded ACME library, hosted Linux
certificate daemon and ACME worker, and offline Compose deployment tooling
exist. Real certd enrollment with a disposable local CA and combined Gitd/certd
operation were exercised in controlled environments. Neither proves public-CA
issuance with owner production credentials or authorizes public activation.
See the [deployment guide](../deploy/compose/README.md), [local enrollment
record](gitd/operations/CERTD_REAL_ENROLLMENT_2026-09-05.md), and [combined Docker
record](gitd/operations/FINAL_COMPLETION_2026-09-05.md). Earlier measurements
below retain their original scope.

The initial `org.mrml.library.acme` package is one logical package with MRML,
Windows, and Linux targets. It currently provides allocation-free bounded types
for normalized ASCII DNS identifiers, explicitly authorized wildcards,
HTTPS ACME endpoint origins, directory-generation-bound one-use nonces,
directory-generation-bound profile identities, ARI renewal windows, and
fail-closed account/order transitions. It also implements strict unpadded
Base64url, P-256 public-point admission, canonical EC JWK thumbprints,
deterministic ACME protected headers with exactly one of `jwk` or `kid`, raw
ES256 scalar bounds, purpose-typed signing approval, and flattened JWS output.
It parses a bounded ACME directory, rejects duplicate or cross-origin endpoint
authority, records current profile advertisements by directory generation, and
supports non-exporting HS256 external-account binding. The account lifecycle
separates staging and production policy, binds Terms-of-Service approval and
EAB presence to creation, and uses generation-bound prepare/commit receipts for
creation, contact updates, key rollover, deactivation, and uncertain-result
reconciliation.
The same package now has a binary IPv4/IPv6 identifier type with bounded
RFC 5952-style canonical rendering. It rejects bracketed addresses, ports,
IPv6 zone IDs, and ambiguous IPv4 syntax. Typed IP identifiers are admitted to
order preparation, response parsing, authorization binding, HTTP-01
publication, PKCS#10 generation, and certificate verification only when the
owner policy explicitly enables them for the selected CA/profile generation.
DNS-only prepared operations cannot be replayed with that permission changed.
IP authorizations accept only HTTP-01; DNS-01 and TLS-ALPN-01 fail closed.
The in-service TLS activation descriptor also carries the exact typed set and
binds identifier kind and binary value into its generation receipt.
Failed candidate cleanup is receipt-bound to the exact identity generation,
key identity, and signing-route generation. A mismatched retirement receipt
leaves the candidate recorded, and activation-uncertain candidates cannot be
discarded until authoritative target resolution.
The bounded payload and PKCS#10 layers can
encode typed, canonically ordered DNS and IP identifiers without confusing
their ACME kinds; PKCS#10 encodes IP SAN values as exact 4- or 16-byte address
octets rather than textual DNS names.
Orders bind a sorted exact identifier set, account and directory generations,
profile generation, same-origin order/finalization/certificate URLs, bounded
poll retries and deadlines, and one authorization URL per identifier. Stale or
substituted authorization responses fail closed; wildcard authorization selects
DNS-01; finalization requires every exact authorization to be valid and uses a
one-use CSR-digest receipt.
Order responses now pass through a bounded strict parser before reaching that
state machine. The parser requires the exact ordered identifier set and selected
profile, an exact authorization count, unique same-origin authorization URLs,
same-origin finalization/certificate endpoints, known status values, singleton
fields, bounded JSON complexity, and no trailing data. Cross-order or
cross-origin substitution is rejected before lifecycle mutation.
Authorization responses likewise require the exact expected typed identifier,
a known terminal/nonterminal state, and a bounded nonempty set of unique
supported challenge kinds and URLs. DNS wildcards use the RFC representation
(`wildcard: true` with the base name), while IP identifiers can never be
wildcard. HTTP-01, TLS-ALPN-01, and DNS-01 tokens are strictly
validated and every URL remains in the admitted CA origin. Unknown challenge
kinds are ignored only after their bounded object has been safely parsed; they
cannot displace or impersonate a supported challenge.
Typed ACME problem documents and bounded subproblems are parsed with duplicate
singleton rejection, bounded body/token/depth/text limits, strict HTTP status
ranges, trailing-data rejection, and explicit `badNonce` classification.
Canonical mutation payload writers now cover account creation/lookup and
deactivation, exact sorted DNS order identifiers with discovered profile and
optional RFC 9773 replacement identity, PKCS#10 finalization, and certificate
revocation with the permitted RFC reason values. JSON order is deterministic,
strings use a deliberately narrow injection-safe subset, all collections and
bodies are bounded, and binary values use strict unpadded Base64url.
Challenge publication now has a shared capability-oriented contract binding the
exact order URL digest, authorization URL digest, identifier, challenge kind,
token, key-authorization digest, policy generation, activation window, and
publisher receipt. Publication and cleanup are prepare/commit operations;
uncertain cleanup remains represented until authoritative publisher re-read.
The bounded HTTP-01 request validator accepts only an exact `GET` challenge
path and exact DNS or IP Host authority (optionally port 80, with IPv6 brackets
required), rejects percent/query/path/authority ambiguity,
duplicate Host fields, oversized requests, and excess headers, and compares the
active token without data-dependent early exit.
The TLS-ALPN-01 encoder emits a bounded P-256 self-signed certificate with an
empty subject, one critical dNSName SAN, and the exact critical RFC 8737
`acmeIdentifier` OCTET STRING. Signing is purpose- and generation-bound. ALPN
selection rejects `acme-tls/1` unless the exact active SNI is present and never
falls back to an ordinary production identity.
The hosted certificate role serves HTTP-01 over a first-party TCP listener. It
accepts only the exact active authorization-bound token and Host within its
validity interval, uses two-second read/write timeouts and a 4096-byte request
ceiling, returns the exact pre-validated key authorization with `no-store`, and
returns 404 for every nonmatching request. Dropping the role clears its
volatile key-authorization buffer. Linux and Windows-target-under-Wine
loopbacks exercise the same implementation; binding production port 80 remains
a deployment/supervision responsibility.

`org.mrml.service.certificate` is now one Manifest V2 service package targeting
MRML, Windows, and Linux. Its first confined runtime role is a bounded,
non-recursive authoritative DNS-01 challenge zone. The shared implementation
serves SOA, NS, TXT, and nameserver A responses over DNS UDP messages and TCP
framing, supports concurrent TXT values, binds mutations to policy and record
generations, expires records, rejects malformed/compression-loop input, refuses
out-of-zone recursion, and returns truncated UDP responses when necessary.
The DNS role implements the shared challenge-publisher contract: preparation
does not publish, activation inserts the exact TXT digest, cleanup removes the
exact record generation, and successful removal releases bounded publisher
capacity. Multiple authorization-bound records remain independently scoped.
The hosted DNS role binds UDP and TCP listeners to the same port, applies
two-second I/O timeouts, accepts one bounded datagram or one exact length-framed
TCP query per operation, and delegates all parsing and response policy to the
shared authoritative zone. Linux and Windows-target-under-Wine loopbacks verify
both transports against the same active TXT generation.
DNS-01 propagation is a separate bounded state machine. An authorization is not
reported ready until one owner-authorized authoritative route and one distinct
owner-authorized recursive-resolver route each return a receipt binding the
exact TXT digest, challenge generation, publisher generation, route generation,
observation class, and time. Attempts and deadline are bounded; mismatched or
substituted receipts fail closed. This is fixed owner policy, not route-selected
multi-vantage CA validation.
Linux and Windows hosted targets now implement that query contract with a
bounded first-party DNS-over-TCP adapter. Its configuration contains exactly
one authoritative endpoint and one recursive-resolver endpoint; each is bound
to the corresponding nonzero capability identity and route generation. The
adapter rejects every unconfigured or stale route before network access,
applies two-second I/O deadlines, emits one exact TXT question, and validates
the transaction, response flags, single question, answer bound, DNS name
compression, record lengths, and unpadded Base64url TXT digest before issuing
an observation receipt. It does not expose arbitrary names, record types, or
destinations and therefore is not a general DNS proxy. The Linux loopback suite
executes both independently configured routes against the first-party
authoritative role (`72 passed; 0 failed`).
Certificate-chain retrieval has a strict fixed-capacity PEM decoder and a
shared validation policy/receipt. The hosted first-party X.509 adapter verifies
the exact P-256 SPKI, exact sorted typed DNS/IP SAN set with no extra
GeneralNames, TLS server purpose, explicit validity bounds, supported critical
extensions, bounded path
length, signatures to explicitly supplied owner-approved roots, CA class,
profile, order digest, policy generation, and trust-store digest before issuing
a verified-chain receipt. The MRML target builds the same policy and verifier
interface without inheriting a host ambient trust store. Checked-in leaf/root
fixtures were independently generated with the OpenSSL CLI solely as a test
oracle; no fixture private key is retained or shipped. The mixed DNS, IPv4,
and IPv6 fixture proves type substitution, missing names, and disabled IP
policy fail closed.
Alternate responses are disabled unless their exact chain digests appear in an
owner policy. When multiple validated candidates are admitted, selection uses
that explicit preference order with a digest tie-break and never trusts CA
response order.
The identity manager exposes an identity-scoped consumer capability for
description, bounded chain reads, generation observation, and acquisition of a
use-only TLS signing route. The route binds identity generation, key identity,
route generation, and an opaque capability identifier; TLS 1.3
CertificateVerify approval binds the exact transcript digest and standard
server context. Deployment persists a prepared candidate before publication,
requires separate TLS 1.3 and HTTP/3-over-QUIC-v2 test evidence, activates only
the exact prepared generation, retains the previous generation, and represents
ambiguous activation until authoritative target re-read resolves it.
The first-party TLS server now accepts bounded DER certificate chains paired
with a use-only P-256 signer object. For each TLS 1.3 handshake it supplies only
the transcript digest; the certificate-service adapter constructs the fixed
server CertificateVerify approval, binds the exact identity/key/route
generations, obtains a raw ES256 signature, and strictly DER-encodes it. The TLS
server permits only `ecdsa_secp256r1_sha256` on this route and has no private-key
export path. The legacy RSA PEM constructor remains development-only and its
public-gitd gate still fails closed.
Each published hosted generation retains its complete public identity
descriptor beside the TLS configuration. The current HTTPS server snapshots
both together for every accepted connection and exposes an authenticated,
`no-store` local `GET /health/tls-identity` result containing the exact identity
and policy generations, typed names, leaf SPKI digest, chain digest, key
identity, validity, and profile/directory generation. A raw-development-PEM or
unavailable identity returns 503 rather than inventing health. The endpoint
never exposes a private key, signing route, or ACME management operation.
TLS ClientHello parsing now admits at most one bounded host-name SNI and a
server configuration can require one exact normalized name. Missing, malformed,
duplicate, or substituted SNI fails before certificate signing. This is a
single-identity admission check, not MultiTLS identity multiplexing; the latter
remains a recorded patent re-review trigger and is not silently introduced.
The durable-state substrate uses a canonical versioned bounded record, payload
digest, non-exporting authenticator, exact object and previous/new generations,
and prepare/commit store receipts. Decode rejects mutation, trailing bytes,
namespace confusion, and generation errors. Public lifecycle records, account
secret handles, certificate secret handles, and audit records occupy distinct
namespaces; only opaque provider handles, never key bytes, are admitted to the
secret-handle namespaces. An uncertain commit is resolved against the store's
authoritative generation and digest rather than guessed.
The certificate package now also defines a bounded, versioned, authenticated
backup container. Creation verifies every included durable record, rejects
duplicate namespace/object identities, authenticates a manifest of exact record
digests, and produces an overall digest. Verification is read-only; restoration
requires an empty target and a target-provided atomic begin/import/commit path
with abort on failure. The format carries opaque sealed-provider handles, never
raw private keys. A provider-specific separately protected sealed-key export and
backup catalog provider remain required before operational disaster recovery is
complete. The shared export core now gives that provider a bounded
`BACKUP_CREATE` path: it stages at most 269492 bytes, verifies the provider's
exact policy generation, record count, total length, and SHA-256 container
digest, then permits only generation-bound sequential reads of at most 8192
bytes. Replayed, stale, skipped, or concurrent exports fail closed, and the
entire staging buffer is cleared after completion, provider failure, or drop.
The canonical fixed-size begin/read/finish command rejects reserved bytes and
ambiguous metadata. The lifecycle handler enforces the reserved `BACKUP_CREATE`
operation and rechecks the exact policy generation on every read. Begin and
finish return a canonical 72-byte metadata receipt; reads return only the exact
next container bytes. The typed hosted client downloads through that operation,
checks every response generation, bounds every chunk to 8192 bytes, recomputes
the complete container digest before finish, and clears partial output on a
detected mismatch. `mrml cert backup create` writes only to a newly created
destination, never overwrites an existing file, flushes the exact verified
length, clears its staging memory on every outcome, and emits a canonical
receipt whose structured form hex-encodes the path rather than permitting
delimiter injection. A real catalog/sealed-key provider remains required for a
deployed daemon to authorize this operation.
Because a complete container may exceed the lifecycle ABI's 4 KiB request
window, restore input is assembled by a bounded sequential transfer state
machine rather than by raising that ABI bound. Each upload binds a nonzero
transfer generation, exact policy generation, total length, and expected
SHA-256 digest; accepts at most 4096 bytes at the exact next offset; and rejects
replay, reordering, truncation, overflow, and digest substitution. Verification
uses the existing durable authenticator over the completed container. Restore
is available only after successful verification, still requires an empty
transactional target, and clears the 269492-byte bounded assembly buffer after
a successful commit or explicit cancellation. A canonical 72-byte command
header now carries begin, append, verify, restore, and cancel through the
existing 4096-byte lifecycle request window, leaving 4024 bytes per chunk. Its
decoder rejects reserved bytes, trailing data, inconsistent metadata, zero
generations, and oversized chunks. Every command binds `VERIFY_ONLY` or
`RESTORE`; the session rejects cross-purpose append, verification, cancellation,
or restore, so verification authority cannot be escalated into state mutation.
A concrete lifecycle-side handler now maps `BACKUP_VERIFY`,
`RESTORE_VERIFY_ONLY`, and `RESTORE_COMMIT` onto those transitions. It rechecks
the exact policy generation on every call, returns an 80-byte canonical progress
or completion receipt, clears verify-only state immediately after reporting its
authenticated descriptor, and retains restore state only until exact commit or
cancel. Clean-target and durable authentication failures remain explicit and do
not fabricate completion. The hosted client now exposes one typed transfer call:
it constructs the canonical command and generated lifecycle frame, owns the
nonoverlapping 4096-byte request and 80-byte response views, distinguishes
remote backup errors, validates the returned transfer generation against the
canonical receipt, and clears its complete scratch buffer. Administrator CLI
wiring now exposes `mrml cert backup verify` and `mrml cert backup restore` over
the one-use hosted session. Both require explicit nonzero policy and transfer
generations and a regular bounded input file. Restore additionally requires
`--confirm-digest` to exactly match the complete container SHA-256 before the
session ticket is consumed or any remote state changes. The frontend streams
the full container, renders a stable receipt, and clears its input buffer after
success or failure. This is executed against the real lifecycle handler in
Linux and Windows-target-under-Wine tests. Backup creation/download and the
long-running durable hosted daemon remain separate and open.
RFC 9773 certificate identifiers are derived from the exact AKI keyIdentifier
and DER serial contents, including a required leading zero, and are carried in
the verified-chain receipt. RenewalInfo parsing bounds and validates the exact
RFC 3339 suggested window. The scheduler selects a randomized point inside ARI,
binds the queried certificate identity, randomizes bounded re-query timing, and
persists replacement relationships. Its fallback derives timing from the
certificate's actual lifetime, applies jittered exponential backoff and
Retry-After, and exposes healthy, warning, critical, and expired states without
assuming a 90-day profile.
The manager owns a bounded catalog of sixteen independently scoped identities
and now exposes a secret-free status iterator plus exact-identity lookup. Each
status contains only the identity and policy generation, current public
descriptor, renewal schedule, active lease, and staged replacement. This is the
shared source for lifecycle status responses, CLI listing, authenticated health,
and diagnostics; it cannot reveal signing capability IDs or mutate state.
Status uses one versioned canonical bounded binary payload rather than
frontend-specific reconstruction. It carries the exact typed DNS/IP identifier
set, advertised profile and directory generation, public chain/SPKI/key
identities, validity, ARI/fallback schedule, expiry health, active lease, and
staged replacement. The decoder rejects truncation, trailing bytes, unknown
flags, unsorted identifiers, malformed profile/certificate identities, and
cross-identity or cross-policy state. A concrete catalog lifecycle provider
serves this payload only for an exact 16-byte identity under the existing
per-call authorizer and delegates all mutating/account/backup operations to a
separate provider.
The hosted client exposes this as one typed `identity_status` operation: it
constructs the canonical generated request, owns the bounded borrowed-memory
layout, validates the remote status/error envelope, and decodes the shared
payload. Frontends therefore cannot substitute scopes, overlap buffers, accept
an oversized response, or maintain a second status parser.
`mrml cert status` can inspect that same canonical payload in human or stable
structured form. Offline `--snapshot FILE` accepts only a nonempty regular file
within the 4096-byte protocol bound; the path identifies inert input data,
grants no lifecycle authority, and cannot mutate certificate state. Hosted
`--endpoint 127.0.0.1:PORT --session-capability FILE --identity HEX` performs the
typed status call through a one-use 256-bit ticket delivered out of band by the
supervisor. The ticket file must contain exactly 32 bytes and is cleared from
the frontend's read buffers after use. The endpoint only locates the service:
it is fixed to literal loopback and does not authorize the request. Mixed or
partial offline/live routes fail closed. Neither form reports secret or
signing-route identifiers.
The unattended renewal coordinator acquires one identity-scoped lease, requires
a fresh use-only candidate key and exact RFC 9773 replacement binding, verifies
the returned chain receipt, stages the next schedule, publishes and exercises
TLS 1.3 plus HTTP/3/QUIC v2 candidate handshakes, and only then activates and
commits the new identity generation. Failed tests remove the exact candidate
deployment and retire only its candidate key; the prior active identity and
schedule remain unchanged. Activation uncertainty retains the lease and staged
schedule, re-reads the authoritative target, and either commits the observed
new generation or retries the already-tested candidate after proving the old
generation remained active. A new renewal cannot displace that unresolved
state. A bounded authenticated renewal-transaction journal now round-trips the
lease-acquired, replacement-staged, published, tested, activation-uncertain,
active, and aborted boundaries. It binds both exact canonical RFC 9773
certificate identifiers, complete schedules, the use-only signing route, the
prepared descriptor and chain digests, and the deployment target generation.
Mutated records, skipped stages, wrong objects, and contradictory replacement
generations fail closed; uncertain store commits advance the journal generation
only after authoritative re-read. The executor now requires a checkpoint sink:
it commits the lease before issuance, the replacement schedule before
publication, the publication receipt before testing, the successful handshake
receipt before activation, activation uncertainty before returning it, and the
active boundary before committing the manager schedule. Definitive failures
write an aborted terminal record before exact candidate cleanup. Injected store
failures before publication preserve the old identity and retire the candidate;
failures after activation are recovered by confirming the already-active
generation without reissuance or key retirement. The shared recovery path now
reconstructs the active identity, exact tested or activation-uncertain
candidate, renewal schedule, lease, and pending replacement one generation at
a time from independently authenticated certificate, deployment, and renewal
records; it then resolves an injected complete process restart without
reissuance or key retirement. The hosted Linux/Windows adapter stores
authenticated records as immutable generation-named files. Preparation writes
and synchronizes one exact bounded record, commit publishes it with one rename,
and startup selects the greatest structurally valid generation through a
bounded directory scan before the journal layer authenticates its complete
bytes. It refuses skipped generations, non-directory roots, symlink record
entries, contradictory prepared files, and oversized or malformed records.
Linux also synchronizes the containing directory. The Windows target
synchronizes record contents and exercises close, reopen, selection, and
authentication under Wine; that is not native Windows storage-durability or
power-loss evidence. The shared no-allocation capability adapter sends exact
authenticated record bytes to an attenuated storage capability and validates
prepare, commit, authoritative-reread, and record-read receipts before use. The
MRML-native certificate probe now prepares, commits, reloads, and authenticates
its deployment generation through this adapter before serving any interface
call. The deterministic backend proves the MRML service boundary and recovery
contract. A dedicated signed KVM lane now launches that exact service image in
CPL3 under strict Total MicroVM policy with separate exact `MAP|READ` and
`MAP|READ|WRITE` shared-buffer capabilities. A separately scheduled CPL3 peer
writes `probe.identity` through the write capability, sends the generated
generation-1 identity ABI request, receives the bounded response, and reads
`MRMLCERTPROBE1` through the read capability. The runner verifies both task
cleanup boundaries. The latest 2026-09-01 run from commit `2040869f` reported
`verify=19342us`, `prepare=4561us`, `execute=433us`, and `total=45394us`. This is controlled KVM
evidence for signed service launch, authenticated in-service durable-record
round-trip, capability-mediated shared buffers, and exact identity IPC; it is
not persistence through the native storage service across a reboot, bare-metal
evidence, WHP evidence, or native-Windows evidence.

The exact commands were:

```text
mrml build org.mrml.service.certificate --target native --release
mrml build org.mrml.system.bootloader --target uefi-x86_64 --release --feature-profile certificate_service_probe
mrml build org.mrml.tool.vmm-kvm-run --target linux --release
mrml-sign keygen kernel.private kernel.public
mrml-sign keygen service.private service.public
mrml-sign keygen package.private package.public
mrml-sign sign-bundle kernel 1 mrml-kernel-pe.efi kernel.private kernel.signed
mrml-sign sign-bundle service 1 mrml-certd-native-probe.efi service.private service.signed
mrml package create org.mrml.system.kernel kernel 1 x86_64 kernel kernel.signed kernel.mrp --private-key package.private
mrml-kvm-run kernel.mrp package.public kernel.public 1 certificate-service-probe service.signed service.public 1
```
Revocation is a separate generation-bound lifecycle. It binds the exact
identity generation, ARI certificate identifier, chain digest, permitted RFC
reason, owner preview or narrowly authorized automatic cause, and the exact
current account-key or certificate-key credential. Automatic revocation is
limited to confirmed key compromise or an explicitly bound replacement policy.
Submission uncertainty remains resolvable through authoritative CA state and
does not retire, delete, or misreport the only active identity.
Four canonical generation-1 `mrml-call-v1` interfaces are checked in with
deterministically generated pointer-free codecs for certificate signing, TLS
identity publication, challenge publication, and lifecycle administration.
`mrml-certd` declares the four exact fingerprints as isolated dynamic services
from the same MRML/Windows/Linux package. The current ABI does not transfer
capabilities in these calls: the supervisor binds the service route, and wire
identity, generation, key, digest, and opaque-route fields only prevent
substitution. They never manufacture authority.
Wine exercises the Windows target; Wine is not a separate platform
implementation or native-Windows evidence.

The bounded PKCS#10 encoder now emits an empty subject, exact P-256 SPKI, and an
extension-request containing only the sorted owner-approved SAN identifiers.
The first-party P-256 signing path implements rejection-sampled private keys,
a fixed four-candidate deterministic HMAC-SHA-256 nonce schedule, low-S output,
strict DER, self-verification before release, and volatile clearing of private
scalars, nonces, signatures, and HMAC state. Field multiplication executes all
256 add-and-double steps and uses word masks to select each result. Secret
scalar multiplication likewise computes both fixed-schedule branches and uses
masked Jacobian selection; exceptional point cases are computed and selected
without secret-dependent early returns. Account-JWS, PKCS#10, and TLS 1.3
providers own non-cloneable keys, enforce their exact purpose generations, and
expose only public SEC1/JWK data and signatures. Tests prove independently
generated account and certificate keys differ and exercise real ES256 JWS,
CSR, and TLS CertificateVerify signatures with self-verification.

This is an implementation argument, not a claim of independently verified
constant-time behavior. Compiler output, microarchitectural leakage, fault
resistance, and the arithmetic construction still require independent human
cryptographic review before **PRODUCTION_APPROVED** classification. The code is
now in ordinary MRML/Windows/Linux profiles so integration can use and test the
actual use-only provider; there is no fallback to the former experimental
feature or to RSA private operations.

The shared ACME transport contract now admits only exact current-directory
same-origin endpoints, requires authenticated adapters to report the effective
URL, forbids redirects, bounds response bodies and Retry-After metadata,
captures validated replay nonces into the exact directory generation, consumes
each nonce once, remembers up to 64 accepted values for that generation, rejects
any value the authority repeats after consumption, and fails closed when that
bounded replay memory is exhausted. Refreshing the authenticated directory
generation resets both the available and consumed-nonce sets. Platform HTTPS
socket/TLS adapters remain separate from this semantic state.
The signed POST transaction composes that contract with JOSE. It acquires or
consumes one nonce, constructs and signs the exact URL/account/directory-bound
flattened JWS, performs one authenticated POST, captures the response nonce,
parses typed error bodies, and rebuilds and re-signs the entire request only for
`badNonce`. The retry ceiling is two; request scratch is erased after every
attempt and no consumed nonce is reused.
Linux and Windows now share a hosted adapter over the first-party `mrml-http`
and `mrml-tls` stack. It emits exact GET, HEAD, or JOSE POST requests, refuses
duplicate ACME singleton headers, copies response bodies only within the caller
budget, and never invokes the HTTP redirect-following API. The MRML target does
not inherit hosted sockets and continues to use the same transport contract
through capability-bound services. Its concrete adapter accepts only a nonzero
HTTPS capability identity, route generation, directory generation, and
owner-approved HTTPS origin. Every exchange passes that exact binding to the
backend capability and requires the receipt to return it unchanged with the
exact effective URL and bounded response metadata. Origin, capability, route,
or directory substitution; invalid lengths or status; duplicate alternate
links; non-ASCII metadata; and populated trailing link slots fail closed. The
adapter contains no socket, resolver, host trust store, filesystem, or syscall
dependency, so MRML can supply authenticated HTTPS as a capability without
forking the ACME state machine.

Production sealed-key platform selection, remaining account and identity
mutation commands, concrete gitd process wiring, supervisor-issued daemon
sessions, and full native-storage/reboot recovery remain **PLANNED**. Hosted
backup verification and digest-confirmed clean-target restoration are available
through both `mrml cert backup verify` and the canonical
`mrml cert restore [--verify-only]` command forms. The
shared state machine must
remain independent of `std::fs`, `std::net`, Win32 handles, and syscall numbers.

Hosted lifecycle administration has a bounded transport adapter for either a
preconnected stream supplied by the host supervisor or one loopback stream
admitted with a one-use supervisor ticket. The ticket is nonzero, compared
without secret-dependent early exit, consumed even when admission fails, and
erased by both peers; reconnecting requires newly delegated authority. The
adapter deliberately treats no address, port, pathname, object name, or request
field as authority. It carries the canonical generated lifecycle frame plus at
most 16 KiB of borrowed memory, applies two-second read/write deadlines, rejects
noncanonical lengths and reserved fields, retains the exact per-operation
authorizer, and clears server scratch after each call. The client and generic
one-session admission primitive are implemented and exercised on Linux and the
Windows target under Wine. The hosted daemon core now accepts only separately
supervisor-authorized sessions, reconstructs a fresh authorizer and provider
before every session, serves one bounded lifecycle call, and caps a run at one
million sessions. Supervisor shutdown is explicit, while budget exhaustion or
provider reconstruction failure is an alertable error rather than a fallback.
The Linux/Windows platform entry point and real durable catalog/sealed-key
reconstructor remain required before operational administration can be claimed.
The hosted lifecycle client now also carries bounded account and identity
operations through the canonical ABI. Each call binds its nonzero operation,
policy generation, and (for identities) exact identity; keeps request and output
in disjoint borrowed regions; checks the returned generation; and clears all
scratch plus caller output on failure. This is transport plumbing for typed
administration operations, not evidence that the still-planned command family
or production provider wiring exists.
The Cargo-only bootstrap frontend deliberately compiles with
`mrml_stage_zero`, so it does not create a package-local dependency bridge to
`mrml-certd`. The bootstrap retains repository/build commands and the CAA
helper; its native self-build, produced through the Manifest V2 graph, includes
the service-backed status and backup administration commands. The same explicit
stage-zero cfg is used when bootstrapping the Windows frontend under Wine.
The catalog half now has a shared bounded reconstructor. An already-authorized
manifest may name at most 64 canonically ordered namespace/object bindings with
their exact generation and payload digest. Reconstruction re-reads every record
through the durable-storage capability and checks the storage receipt, decoded
record identity, generation, digest, and authentication tag before passing it
to a provider builder. Missing, duplicated, reordered, stale, or substituted
records fail closed. The manifest identifies expected state and does not grant
storage or lifecycle authority. Platform wiring and the owner-selected sealed
key implementation remain open. The shared sealed-key adapter now projects the
existing backup contract through an attenuated platform capability with no key
export operation. Seal receipts must echo the exact opaque key identity,
provider generation, recovery-policy digest, written length, and sealed-blob
digest; restore receipts bind the same inputs and return only a new nonzero
use-only provider handle. Substitution, malformed lengths, unavailable routes,
or digest mismatches fail closed, and failed seal output is cleared. Linux,
Windows, and MRML can supply different protected implementations behind this
one semantic contract without splitting the package. Selecting and wiring an
actual production platform provider remains an owner/deployment decision.

The bounded deterministic security-fuzz harness covers ACME directory,
problem, account, order, authorization, ARI, URL, and Base64url parsing; X.509
DER and PEM chains; HTTP-01 requests; DNS packets and compression pointers;
authenticated durable records; and authenticated backup containers. It applies
truncation, bit flips, poison bytes, duplication, deterministic insert/delete
mutations, and cross-seed concatenation without allowing parser panics. This is
repeatable adversarial corpus testing, not coverage-guided fuzzing or proof of
parser correctness.

Certificate retrieval captures at most eight bounded standard
`rel="alternate"` links from the authenticated primary response, rejects
malformed, duplicate, overflow, primary-self, or cross-origin targets, fetches
each candidate with the current account and one-use nonce machinery, validates
every candidate chain, and selects only the lowest-index exact chain digest in
owner policy. Response order never selects trust compatibility.
Future platform adapters belong inside these logical packages and must not fork
their public semantics.

At the time of the focused evidence below, repository CI configured manifest,
lock, audit, assurance, Clippy, native Linux and Windows release suites,
Windows-GNU/LLVM-under-Wine certificate tests, interface regeneration, CUDA
compile-only checks, and Linux AddressSanitizer. Focused ACME, certificate,
and security-fuzz packages ran in separate hosted lanes so an unrelated failure
did not hide their results. No such workflow is tracked in the current checkout;
see [Project status](PROJECT_STATUS.md). Cite a runner result only for the
revision and environment it exercised. Wine is not native Windows evidence.

Exact focused final-tree evidence at commit `2040869f` is:

- `mrml test org.mrml.service.certificate --target linux` — **LINUX_NATIVE
  PASS**, 100/100 tests;
- the same certificate command through the pinned
  `nightly-2026-08-29-x86_64-pc-windows-gnullvm` frontend and executable under
  Wine — **WINDOWS_GNULLVM_UNDER_WINE PASS**, 99/99 tests;
- `mrml test org.mrml.library.acme --target linux --sanitizer address` —
  **LINUX_NATIVE AddressSanitizer PASS**, 79/79 tests;
- `mrml test org.mrml.service.certificate --target linux --sanitizer address`
  — **LINUX_NATIVE AddressSanitizer PASS**, 100/100 tests;
- `mrml test org.mrml.test.security-fuzz --target linux --sanitizer address` —
  **LINUX_NATIVE AddressSanitizer PASS**, 9/9 deterministic hostile-input
  tests; and
- the signed `certificate-service-probe` sequence above — **KVM_HOSTED PASS**
  with exact identity IPC and authenticated in-service durable-record recovery.

`cargo build --locked`, warnings-denied Cargo clippy, manifest check, and lock
check passed in that evidence. Repository assurance was blocked before its
workflow check by the then-unadmitted compiler thread-local-storage probe
`docs/compiler/probes/pinned_std_thread_tls_execution.rs`; “TLS” in that probe
means compiler thread-local storage, not this certificate/TLS feature, so this
task does not admit it. The attempted full Linux release gate likewise did not
reach certificate execution: the first default application build stopped after
pre-existing CUDA PTX warnings. No success is claimed for that incomplete run.
`git fsck --full --no-reflogs` exits zero for reachable objects and reports
existing dangling objects, which are preserved.

The owner supplied a Canada-first claim screen and applicable IETF-disclosure
review dated 2026-09-01 with engineering classification
`REVIEWED_NOT_BLOCKING`; the exact disposition and re-review triggers are in
`docs/patents/REVIEW_LOG.md`. Formal legal freedom-to-operate review was not
performed. Cryptographic implementation still requires its independent
security-review plan and exact constant-time/zeroization evidence. Failure of
those gates is fail closed: there is no fallback to Certbot, a third-party ACME
client, RSA certificate keys, raw production key files, or a self-signed
production identity.

Let’s Encrypt issues public TLS certificates. It does not sign MRML Git commits,
tags, packages, applications, or source locks. ACME account keys, certificate
keys, Git signing keys, and audit-receipt keys are separate roles and must never
share key material.
