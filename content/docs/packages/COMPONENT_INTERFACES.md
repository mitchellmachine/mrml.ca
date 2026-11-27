# MRML versioned component interfaces

**Status: PLANNED.** This document defines package metadata, resolution,
loading, lifetime, and evidence requirements. Bounded identity, schema,
load-plan, and memory-accounting prerequisites are partially implemented as
recorded below; runtime resolution, dynamic loading, independently serviced
providers, and ZIM integration are not implemented.

**PARTIALLY IMPLEMENTED prerequisite:** `packages/tools/mrml` now defines
compiler-independent canonical interface identity/generation validation, bounded
borrowed views, opaque generational handles, and one fixed little-endian call
header codec. The first bounded schema/generator increment now parses the exact
version-1 `mrml-call-v1` format, rejects noncanonical or unbounded definitions,
computes a SHA3-256 ABI fingerprint, and deterministically emits pointer-free
safe Rust request/error types. The canonical Zstd ABI-3 schema and generated
binding live under `packages/interfaces/org.mrml.interface.compression.zstd/`.
The same generator now owns the canonical generation-1
`org.mrml.interface.gui.surface` identity and fingerprint. Its fixed commit
envelope carries three opaque generational handles and one bounded borrowed
state view; the checked-in adapter validates a canonical fixed state and
response. Those handles identify candidates only: the kernel-side integration
requires a trusted resolver to return exact live surface/output/buffer
capabilities and authoritative descriptors before using the existing graphics
admission path. The interface declares no capability transfer, and its metadata
or bytes grant no authority.
This does not implement native call lowering, executable mapping, a provider,
consumer migration, or runtime interface resolution.

**IMPLEMENTED as a bounded schema, generated codec, and typed in-process host
adapter:** `org.mrml.interface.security.detached-signing@1` defines one exact
reusable OpenPGP-v4 Ed25519Legacy binary-document signature profile, separate
Git commit and annotated-tag purposes, SHA-256/SHA-384/SHA-512 selection, a
20-byte expected primary-key fingerprint, canonical detached-signature and
minimal public-key armor formats, and fixed borrowed-memory limits. Its safe
provider-side dispatcher exposes immutable fingerprint/input slices and only
the declared mutable output slice. Focused tests cover canonical framing,
malformed responses, exact fingerprint/purpose/digest route attenuation, and
read/write-region separation; the codec also cross-compiles as `no_std` for the
projected UEFI target.

The opaque endpoint and fingerprint remain identities, not authority. A runtime-
delivered endpoint capability authorizes use only for its exact live endpoint,
key generation, purpose, digest allowlist, and lifetime. Signing and public-key
description use separate routes and independently revocable rights; signing use
does not imply public-key description, and neither implies secret-key export.
The source type named `IsolatedDetachedSigningTransport` only checks and forwards
an already-authorized route through a supplied endpoint trait. Its name and
successful host tests do not create or prove process, microVM, hardware, or key-
custody isolation.

An actual capability-projected IPC service/provider deployment, supervised
runtime binding and revocation, owner-authorized key provisioning/lifecycle,
boot or recovery consumption, and physical-hardware evidence are **PLANNED**.
The interface is use-only and deliberately does not create, import, export,
rotate, revoke, or destroy private keys.

```text
Complexity impact: MEDIUM
TCB impact: NONE
New parser boundary: YES
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: PARTIAL
Existing-object reuse: HIGH
```

The TCB score describes the implemented host/library increment; no boot or
runtime provider has been admitted. Isolation is partial because the current
adapter runs inside the host Git process, while the separate service placement
remains planned.

`DIGITAL-RIGHTS REVIEW: PASS FOR IMPLEMENTED SCOPE.` The pinned fingerprint is
identity, the owner-delivered route is authority, owner revocation remains
authoritative, and the protocol creates no publisher veto, remote dependency,
DRM, secret-export right, or first-party bypass.

`HOSTILE SECURITY REVIEW: PARTIAL.` Fixed codecs, bounded memory, immutable
input views, exact output views, caller self-verification, strict OpenPGP/Git
parsing, and stale-route failure are exercised by focused host tests. Runtime
capability revocation, crash cleanup, service compromise containment, fuzzing,
protected custody, and boot/recovery behavior remain unproved and therefore do
not satisfy the mature-mechanism gate.

**IMPLEMENTED as a bounded schema and generated codec:**
`org.mrml.interface.security.ml-dsa-signing@1` adds an exact ML-DSA-65
signing-use route with 32-byte expected public-key digest, canonical Git commit
or annotated-tag purpose, 16 MiB input bound, 3,309-byte raw-signature output,
and a separately routable 1,952-byte public-key description. The provider owns
per-signature randomness. The interface transfers no capability, key material,
or passphrase; the digest identifies the exact routed key but grants no
authority. The generated codec passes Linux host testing and an MRML-native
`no_std` build. A deployed provider, runtime route delivery, boot consumer, and
hardware custody remain **PLANNED**.

**PARTIALLY IMPLEMENTED loader prerequisite:** the build tool now admits an
immutable exact-package load plan made only of bounded, page-aligned,
nonoverlapping sections. It rejects writable-executable mappings, nonexecutable
entry points, overflow, overlap, and image escape. This is validation evidence,
not a runtime loader: it performs no parsing, relocation, symbol lookup,
executable mapping, interface binding, or in-place patching.

**PARTIALLY IMPLEMENTED memory-accounting prerequisite:** the kernel now wraps
the existing `MemoryPoolTable` rather than defining component-local resource
authority. One shared immutable-code `MemoryObject` is charged once, carries no
write authority, and can have multiple separately target-authorized RX mapping
reservations. Live mappings prevent object reclamation. This is policy and
accounting evidence only: no physical backing, code population/sealing, native
page-table installation, provider binding, private-state charge, or runtime
loader is implemented.

**PARTIALLY IMPLEMENTED resolution prerequisite:** the build tool now represents
typed exact `REQUIRES` and `PROVIDES` edges and resolves them only within one
immutable `SystemGeneration`. A match requires identical interface name, major
generation, and 256-bit schema fingerprint; the result retains exact consumer
and provider package versions and artifact digests plus the in-process/service
form. Missing, ambiguous, out-of-generation, reordered, ABI-generation, and
fingerprint substitution fail closed. This produces dependency data only, not a
live `InterfaceBinding`, load authority, capability, or provider selection
preference.

The containing `SystemGeneration` prerequisite also has a canonical bounded
version-2 binary codec for its exact package identity, version, and SHA3-512
artifact-digest records. Decode reconstructs the same canonical ordered object
and rejects truncation, trailing bytes, reserved fields, invalid identities, and
over-capacity input. The codec is not a signature, admission decision, durable
root, activation transaction, or authority.

The same package-format layer now has a distinct canonical `MRMLRI1` runtime-
inventory catalog rather than overloading interface declarations or package
names with Total-mode meaning. Each entry exact-binds its generation member and
records runtime class, must-run state, placement bounds/forms, and a mandatory
reason for non-eligible exceptions. The decoder exact-matches the complete
`MRMLSG2` membership before the catalog may describe that generation. Neither
interface metadata nor runtime-inventory metadata grants capabilities. Build-
tool derivation, signed release delivery, and kernel consumption remain
**PLANNED**.

**PARTIALLY IMPLEMENTED binding-identity prerequisite:** a fixed-capacity
`InterfaceBindingTable` publishes generational binding IDs only after exact
resolution and provider-form checks. Each entry owns immutable copies of the
consumer/provider package version and digest, interface generation and
fingerprint, and an exact generational executable or service endpoint. There is
no retarget operation: an update creates a new binding while a running consumer
continues to resolve its old entry. Release advances the slot generation before
reuse, so stale IDs cannot reach a replacement. This remains host policy-model
evidence, not capability-authorized runtime loading or execution.

**PARTIALLY IMPLEMENTED placement-composition prerequisite:** the build tool can
now prepare one exact immutable `SystemGeneration`, resolved isolated-service
provider, native-service or microVM placement, and both admitted load plans
before any endpoint exists. Consuming publication accepts only a backend-
returned opaque endpoint and then creates the first generational
`InterfaceBinding`; package/form/artifact mismatch, Total-MicroVM exceptions,
and table exhaustion publish no new endpoint reference. Existing entries remain
unchanged, and publication failure returns the complete prepared launch and
endpoint for backend teardown. Windows and Arch Linux build-tool suites pass 76
tests. Names and
metadata remain identity data; only the published endpoint is the runtime
reference. This is a host policy object only: it does not grant a capability,
invoke a backend, construct a VM, or transport an interface invocation.

The canonical deployment and generation model remains
[DEPLOYMENT.md](../DEPLOYMENT.md); build orchestration remains
[BUILD_SYSTEM.md](../build/BUILD_SYSTEM.md). This document adds only the
dynamic-component/interface delta to those architectures.

**PARTIALLY IMPLEMENTED transport prerequisite:** the canonical Zstd ABI-3
provider and ZIM requirement now declare `isolated-service`; the provider
manifest requires microVM placement. A service-side adapter composes the unchanged 104-byte ABI request with
the kernel's existing authenticated inline IPC and exactly one attenuated
read/write shared-buffer capability. It copies only the declared input into
private scratch, writes only the exact successful output, and erases scratch on
every path. Windows and Arch Linux hosted tests exercise delivery through the
real bounded `TaskRuntime` inbox, capability transfer, distinct VM/task
projections, revocation, wrong-task rejection, malformed input, and resource
exhaustion. A separate bounded userspace loop receives the same request and one
capability through a narrow unsafe runtime trait, reads/writes only the declared
ranges, sends the exact response to a launch-bound reply peer, releases the
received leaf, and erases every caller-owned buffer. This is hosted kernel-
policy evidence. A hosted `TaskRuntime` adapter now additionally rejects any
sender except the launch-bound caller, resolves the transferred leaf against
the exact provider VM/task, revokes it before making the response visible, and
sends the response over a separate launch-bound endpoint. Revocation failure
suppresses the response. The adapter can now be constructed only by consuming a
committed isolation route whose exact interface object, ABI generation,
provider generation, and policy generation match the expected resolver/policy
binding; the route also retains immutable domain, Total-mode class, and
placement evidence. The hosted native adapter does not yet consume the general
resolver result.
The same committed-route type now also feeds a hosted supervised native Zstd
backend. It creates a distinct-address-space kernel task/service endpoint,
opens the ABI data plane by issuing only the exact reply capability, completes the unchanged
request through the existing `TaskRuntime` adapter, and retires the endpoint
only after address-space erasure. Cleanup uncertainty retains the exact service
and ticket for retry; Total mode denies native placement before task creation.
Windows and Arch Linux tests cover this native-service lifecycle, but do not
execute the standalone EFI image or establish physical isolation.
The kernel handoff now makes the architecture rule explicit: **control planes
establish authority; data planes should take the shortest safe path.** One
linear `PreparedComponentServiceLaunch` binds the exact interface fingerprint,
interface/provider generations, policy-selected placement, and authenticated
consumer/provider image digests before either backend runs. Only its committed
route may be projected into the native IPC data plane; steady-state ABI calls
do not repeat provider resolution or placement policy. Artifact mismatch calls
neither backend and returns the complete uncommitted transaction for bounded
cleanup. This is focused hosted transaction evidence, not active
`SystemGeneration` integration or a general runtime resolver.
The generation-1 GUI surface interface now owns its complete canonical
312-byte call frame rather than leaving native IPC or microVM adapters to
assemble parallel representations. `org.mrml.app.gui-probe` and the compositor
therefore compile against one exact codec while retaining separate package and
placement identities. The app can construct protocol bytes and validate typed
serial completions, but only a control-plane-created capability/handle binding
can make those bytes actionable. Its current WHP/KVM lifecycle probe does not
yet carry the frame across guest memory.
The route and native adapter now additionally retain the active system
generation. `ZstdResolvedServiceBinding` rejects a route from any other system
generation even when interface, provider, and policy generations match, and
the kernel returns a typed stale-system failure before either placement backend
runs. Existing running routes keep their original system generation; no update
retargeting or executable patching is introduced. The focused runners now stage
and commit their transient local generation through the bounded
capability-authorized `DeploymentService` activation transaction before kernel
admission. The shared package-format runtime now decodes complete canonical
`MRMLSG2` generation bytes and bounded `MRMLIC1` interface-catalog bytes without
allocation. It verifies both SHA3-512 digests and both numeric generations
against the recovered `ActivatedSystemGeneration`, then selects one provider
only when the consumer and provider are exact generation members and exactly
one catalog requirement/provider pair matches interface identity, ABI
generation, fingerprint, and selected service form. The caller still supplies
the capability-selected interface object; catalog metadata grants no authority.
Missing, ambiguous, out-of-generation, wrong-ABI, wrong-fingerprint,
unsupported-placement, noncanonical, and either digest-substituted input fails
closed.
It then emits the existing immutable component launch handoff; names and
metadata still grant no capability. Both focused WHP/KVM component paths use
this resolver instead of assembling the ZIM/Zstd tuple directly. The build
frontend now has a focused canonical builder for deriving these
records from Manifest V2 declarations, with malformed-field and manifest-order
tests on Windows and Linux. Both focused VMM runners embed the real ZIM and Zstd
manifests as declared, audited build inputs and extract the exact dynamic
requirement/provider and supported service forms without allocation. The old
parallel ABI-generation, fingerprint, and provider-form constants are removed.
General release catalog artifact delivery and persistent authenticated
generation/catalog storage
and resolver-driven native-service dispatch remain **PLANNED**.
The canonical build-tool-to-kernel representation is now **PARTIALLY
IMPLEMENTED** as `ComponentServiceLaunchHandoff`: a fixed 344-byte little-
endian record shared by the package-format library, `mrml`, kernel, WHP, and
KVM. It contains no pointers, paths, filenames, capabilities, or endpoint. The
build side derives all package/interface fields from
`PreparedGenerationBoundServiceLaunch`; the kernel side revalidates the record
against active system/policy admission and the exact resource-reserved route.
The record also binds separate SHA3-512 digests of the complete canonical
`SystemGeneration` and its canonical interface catalog; matching numeric
generations with different package or declaration bytes fail before backend
invocation. Windows and Arch Linux package-format suites pass 13 tests,
DeploymentService suites pass 4, build-tool suites pass 89,
kernel suites pass 509, WHP passes 7, and KVM passes 8. The activation record
also round-trips a canonical digest-bound checkpoint; focused deployment tests
publish and recover it through one exact stable COW file-generation receipt,
and both hosted VMM paths re-decode it before admission. A separate abstract
authenticated-store record now pins the accepted monotonic epoch and exact
stable-file/object/checkpoint identity, rejecting an older valid file in
Windows/Linux unit simulation. Concrete TPM/NVRAM/recovery-journal integration
and general manifest-driven declaration delivery remain **PLANNED**.
Both focused VMM paths now pass the complete canonical generation/catalog byte
pair into `DeploymentService`, which derives both activation roots and rejects
cross-generation pairing before staging. The shared package-format library now
also provides a bounded signed general `SystemRelease` envelope for that exact
pair, and deployment rejects corruption or any signer identity other than the
one selected by caller policy before staging. This preserves the control/data
split: policy fixes signer and authority once; exact authenticated canonical
records then enter the existing parser without a second declaration path.
The public build frontend now creates/verifies this envelope with a consumed
one-use key and explicit public root. Both focused VMM component runners require
that artifact and root, derive the deployment candidate only from the envelope,
and reject any digest mismatch against the separately verified consumer and
provider before Total-mode kernel admission. The optimized runners independently
verified freshly signed current artifacts and emitted byte-identical canonical
records, then consumed one identical freshly signed 99,064-byte release. WHP
completed the exact-generation data path and cleanup; nested KVM reported one
eligible microVM and zero native fallback before the expected halt. Workspace/
Store delivery remains **PLANNED**.
The canonical provider now builds its own `mrml-zstd-service.efi` artifact—never
an alias of the generic configuration service—with an x86-64 architecture trap,
one private 4 KiB scratch page, and exact launch-register endpoint/caller/
provider-generation inputs. Its allocation-free target floor supports raw/RLE
blocks and rejects entropy-coded blocks until bounded tables replace host
allocation. Windows and Arch Linux target builds pass, and Windows format
inspection confirms a PE32+ EFI application with a nonzero entrypoint. The
exact signed provider and its separately signed ZIM consumer now complete one
hosted microVM service call and supervised cleanup on both WHP and nested KVM.
The component profile charges the fixed task-runtime and supervisor footprints
to an explicit `MemoryPool` and returns both commitments before reporting
success. This does not prove a general resolver-to-launch service,
native-service placement parity, update retention, physical isolation, or
complete Total mode.

> Functionality historically embedded in a Rust binary may instead be supplied
> by an independently signed and serviced MRML component through an explicit,
> versioned interface.

## Identity and terminology

Package identity and interface identity are distinct:

```text
package:    org.mrml.zstd
interface:  org.mrml.interface.compression.zstd@3
```

A package may provide several interfaces and require several interfaces. A
package name is never itself the stable ABI. Package version, package
generation, interface generation, and exact content digest remain separate.
Names identify; capabilities authorize.

The layers are also distinct:

- a **Rust crate** is a source/compiler dependency unit;
- an **MRML package** is a signed deployable component unit;
- an **MRML interface** is a stable semantic and binary contract;
- a **provider** implements an interface; a **consumer** requires one;
- an **InterfaceBinding** binds one consumer to one exact admitted provider
  generation for a defined lifetime.

One package may contain several implementation-private crates, one crate may
implement several interfaces, and several owner-authorized packages may
implement one interface. First-party preference is policy, not hidden authority.

Package manifests and dependency graphs distinguish at least `STATIC` (linked
into an artifact), `DYNAMIC_INTERFACE` (in-process versioned binding),
`SERVICE_INTERFACE` (typed IPC to an isolated provider), and `BUILD_ONLY`.
Package, interface, service, build, and hardware requirements are typed edges,
not interchangeable strings. Exact encoding and names are provisional.

## Canonical independent-servicing example

```text
org.mrml.zim version 8
  requires org.mrml.interface.compression.zstd@3

org.mrml.zstd version 14
  provides org.mrml.interface.compression.zstd@3
```

The generation resolver may bind ZIM 8 to Zstd 14 without embedding Zstd in
ZIM. If Store servicing admits Zstd 15 with the same interface generation, it
may construct:

```text
SystemGeneration 104: ZIM 8 -> Zstd 14 (compression.zstd@3)
SystemGeneration 105: ZIM 8 -> Zstd 15 (compression.zstd@3)
```

ZIM is not rebuilt. User-facing update and support views state that its provider
changed while ZIM did not. If Zstd 16 supplies only interface generation 4,
the resolver must not bind it to ZIM 8's generation-3 requirement. It may retain
an admitted ABI-3 provider, update ZIM, admit both major generations, or reject
the candidate. It never guesses compatibility.

Multiple major interface generations and multiple provider packages may coexist
when resources and owner policy permit. Selection uses interface identity,
interface generation, package provenance, architecture/profile, admission
evidence, update policy, and the applicable `SystemGeneration` or
`ApplicationGeneration`; it never searches arbitrary paths for the first
matching DLL, SO, filename, or global symbol.

## Interface specification and evolution

Canonical interface definitions live in one shared, versioned schema location.
The schema language version is separate from the interface generation. An
interface definition describes identity and major generation; calling
convention; operation identities; types and external layouts; bounded optional
features; memory ownership and borrowed-view lifetime; opaque generational
handles; typed errors; concurrency and failure behavior; initialization and
finalization; and capability transfer, attenuation, and object lifetime.

The resolver primarily requires machine-checkable ABI compatibility. API/source
compatibility is related but distinct. Incompatible change creates a new major
interface generation; an existing generation is never silently redefined.
Simple explicit major generations are preferred to semantic-version inference
or unbounded per-operation negotiation.

The interface ABI is MRML-defined, bounded, and language-neutral enough for
future safe-language bindings; this does not mean adopting the C ABI. Rust's
native compiler ABI, layouts, symbol quirks, unwinding, allocator conventions,
or generics are not component contracts. Upstream-rustc and mrml-rustc artifacts
may interoperate only when both conform to the same exact MRML ABI. Compiler
provenance is evidence metadata, not a new interface identity.

Canonical schemas should generate checked provider/consumer bindings and ABI
fingerprints. Safe Rust types are exposed where semantics permit; unavoidable
unsafe mechanics remain in a tiny generated/runtime boundary. Cross-component
pointers are bounded borrowed views with call-scoped or explicit lifetimes, or
opaque generational objects with explicit ownership operations. Raw allocator
ownership, Rust references, trait objects, unwinding, and thread-local layout do
not cross an interface accidentally. Component-local symbols remain private;
there is no global interposition namespace.

Interfaces have conformance/golden fixtures and ABI-diff reports. Fuzzing covers
schemas, descriptors, lengths, enum values, layouts, stale handles, generation
confusion, and negotiation. Parser-heavy providers are fuzzed independently.
Cross-compiler and cross-architecture tests use canonical values and malformed
inputs without treating equal source APIs as ABI proof.

The implemented schema version 1 deliberately accepts only one explicit policy
profile: `mrml-call-v1`, parallel calls, fail-closed behavior, no implicit
initialization/finalization, and no capability transfer. Operations and typed
errors have nonzero, canonically ordered numeric identities. Arguments are
fixed-width scalars, direction-distinct bounded borrowed views, or opaque
generational handles. Any future ownership, capability-transfer, async,
streaming, callback, allocator, or exception policy requires a new reviewed
schema-language version rather than an ignored extension.

## Component forms and isolation decision

The general placement policy selecting among admitted in-process, native
process/service, microVM, and fixed platform forms is
[../ISOLATION_PLACEMENT.md](../ISOLATION_PLACEMENT.md). Interface identity and
exact provider generation remain independent of placement; metadata grants no
capability.

Two primary forms are planned:

- **in-process component:** immutable executable pages mapped into an admitted
  caller for sufficiently trusted, memory-safe, performance-sensitive code;
- **service component:** typed IPC to an isolated, supervised provider with its
own projected capabilities and resource pool.

Manifest V2 now records this distinction explicitly as `form = "in-process"`
or `form = "isolated-service"` on both `PROVIDES` and `REQUIRES`. The native
validator accepts no path/DLL/SO-shaped form, requires the consumer and provider
forms to match exactly, and retains the form in `mrml.lock`. This is structural
graph evidence plus one bounded hosted signed ZIM/Zstd service execution on WHP
and nested KVM. The general isolated-service runtime remains **PLANNED**.

Where it stays simple, a semantic interface may support either location. This is
not mandatory. Placement preserves semantic interface compatibility where
admitted, not identical transport, latency, startup, timeout, shared-memory,
debugging, accounting, or failure behavior. Direct calls, native IPC, and
microVM VirtIO/shared-IPC may therefore differ observably without changing the
contract or granting authority. For each candidate, review performance benefit,
fault impact, memory-safety evidence, parser attack surface, IPC cost, and update
frequency.
An in-process fault can terminate or corrupt the caller; a service fault follows
service revocation/restart policy. Speed alone does not justify sharing an
address space.

Good candidates tend to have many consumers, meaningful size, frequent security
updates, a stable narrow boundary, shared-memory benefit, and mature fuzzing.
Tiny helpers, unstable compiler internals, monomorphized/generic abstractions,
and boundaries without stable semantics remain static. Dynamic servicing can
reduce inlining and whole-program optimization, so critical conversions measure
call/load overhead, throughput, startup, RAM/storage sharing, code-cache effects,
and update benefit. An admitted in-process binding targets ordinary function-
call-level overhead: resolution happens at bind time, not through a kernel or
global capability lookup on every call.

Potential later providers include Zstd, Unicode data, font shaping, image
codecs, math/runtime functions, TLS, HTTP, and cryptography. Each receives its
own review. Crypto/TLS may require release binding, stronger key/rollback policy,
and audit rather than inheriting compression's servicing policy. Fundamental
language/code-generation primitives do not become one giant Store component.

## Admission, loading, and capability rules

The generation resolver, not an application filesystem search, selects an exact
provider:

Storage now has a **PARTIALLY IMPLEMENTED** generation-1 block-provider schema
and generation-2 filesystem schema. Filesystem generation 1 remains checked in
as immutable history. They select isolated service providers
because transports own device/DMA state and filesystems parse hostile media.
AHCI and FAT32 packages may be libraries, but runtime composition is a supervised
exact-generation endpoint rather than DLL/SO path search. Compatible updates use
cleanup-gated restart without reboot; names and manifests grant no authority.
The schema tool now accepts version 2 solely to express bounded, uniquely named
multi-field response records while preserving version-1 output byte-for-byte.
Filesystem generation 2 uses that record to return mount lifecycle and root-object
identities separately. Neither response field is a capability; runtime-delivered
capabilities authorize, and cross-service mount/open dispatch remains unimplemented.
The storage service now consumes the generation-2 handle type in a concrete
boot-sector bridge. One explicit volume identity is bound to one authenticated
block session; ordinary `READ` authority is rechecked per operation, only the
512-byte prefix is exposed, and full-block scratch is erased. This is local
service composition, not cross-service FAT32 mount dispatch.
The storage-side fixed registry exercises cleanup before candidate launch,
health-check before publication, quarantine on cleanup uncertainty, and an
unavailable state after launch failure. This is **PARTIALLY IMPLEMENTED** hosted
model evidence; the FAT32-specific route now exercises compatible replacement,
while installed supervisor/provider restart remains unproved.
The filesystem interface now has a canonical generation-2 probe byte codec and
an isolated transport that retains the exact endpoint generation; three focused
tests pass on both hosts. Its lookup operation now also has canonical request and
response codecs binding volume, mount, and directory generations plus one
bounded borrowed name range. Success returns a nonzero object identity; typed
failure carries no object, and reserved or cross-operation bytes fail closed.
The isolated lookup transport retains the exact endpoint generation and rejects
memory beyond its admitted bound before invocation. Canonical mount framing now
also binds the volume handle and bounded
options range, rejects status/generation mixtures, and routes through the exact
endpoint with the same memory bound. The complete focused interface suite passes
six Linux-host tests. Canonical unmount framing now binds the exact nonzero mount
generation and endpoint; success carries one nonzero completion serial and typed
failure carries zero. The complete suite passes seven Linux-host tests.
Canonical read framing now binds exact volume, mount, and file generations,
checked file-offset arithmetic, and one bounded writable range. The isolated
transport preserves the endpoint and memory bound; response decoding permits
zero-byte EOF but rejects over-counts and error/data mixtures. The complete suite
passes eight Linux-host tests. Canonical write framing independently binds the
same exact object identities and
checked file offset to a nonempty immutable range. Successful progress is nonzero
and caller-bounded; `ReadOnly`, permission, capacity, and I/O failures remain
distinct. Canonical create framing binds the exact parent and bounded name,
preserves the provider-defined generation-1 kind value, rejects nonzero alignment
padding, and returns only a nonzero object identity or typed zero-identity error.
Canonical flush framing binds the exact volume and mount generation through the
retained provider endpoint. Success carries one nonzero durability serial, while
typed stale-object, permission, and I/O errors carry zero. Canonical check framing
binds the same exact state and a writable report of at most 64 KiB. Zero-byte
success is valid; over-counts and error/data mixtures fail closed. Canonical
format framing separates bounded immutable options from its bounded
writable report and rejects overlap. Missing destructive authority remains a
distinct typed failure; no request field grants it. The complete suite passes
thirteen Linux-host tests. The FAT32 provider now consumes
the probe boundary through
an authenticated receive/read/release/reply loop and concrete syscall adapter.
`org.mrml.library.storage.ahci` is now the first concrete provider package. The
existing AHCI code was moved intact out of `mrml-storage`, the package advertises
the exact block-provider fingerprint as `isolated-service`, and its 50 tests pass
on both hosts while the lean service passes 136. No AHCI service entry or live IPC
route exists yet, so this proves package separation and interface-graph shape,
not dynamic execution.

`org.mrml.library.storage.fat32` now provides the matching isolated filesystem
interface generation. Its bounded read-only geometry, FSInfo, FAT-chain, atomic
directory-chain, checksum-bound LFN, atomic file-range readers, and canonical
probe adapter plus authenticated receive/release/reply service loop pass
thirty-three tests on both hosts, and storage requires this binding separately
from AHCI. The MRML-native `mrml-fat32-service.efi` binary builds successfully;
hosted storage tests replace one exact provider generation, reject its stale
endpoint, health-check the candidate, and retain the modeled kernel epoch.
Names remain non-authorizing labels. This is executable service-boundary and
hosted restart evidence, not installed-kernel execution, a mount, or physical
hardware evidence.

Filesystem interface generation 3 preserves all generation-2 operation numbers
and layouts and adds operation 11 for provider open. It exact-binds volume,
mount generation, directory handle, and a nonzero non-authorizing lookup object,
then returns a distinct opaque generational handle or a typed zero-payload error.
Generations 1 and 2 remain checked-in immutable history. The focused generation-3
codec suite passes fourteen Linux-host tests.

- Complexity impact: **LOW**
- TCB impact: **NONE**
- New parser boundary: **NO**
- New authority model: **NO** (lookup identity remains data; capabilities still authorize)

Patent review: `NOT_TRIGGERED` — fixed request framing, opaque generational
handles, typed zero-payload errors, and major interface versioning are
conventional service-ABI mechanisms. See `docs/patents/REVIEW_LOG.md`.

```text
download -> authenticate -> validate ABI/evidence/policy
  -> resolve typed requirements -> construct candidate generation
  -> admit/activate under component update policy
```

Candidate resolution is deterministic and fail closed. It checks the complete
relevant graph before activation and records exact bindings in the generation
lock. Package signing authenticates provenance; it does not prove ABI
conformance, memory safety, semantic correctness, performance, or audit. Track
those evidence dimensions separately.

An `InterfaceBinding` contains the consumer, interface and major generation,
exact provider package generation/digest, compatible target/profile, entry table
or service endpoint, and binding generation/lifetime. It is produced only after
admission. Stale bindings never resolve through reused slots to newer code.
Eager binding is preferred initially; bounded lazy binding may exist only if it
preserves deterministic admission and failure semantics.

The loader validates the admitted binding and exact immutable executable object,
performs checked relocations into private writable construction state, seals
code/constant pages executable/read-only, applies ASLR where compatible, and
publishes no partially initialized binding. It rejects unknown relocation forms,
overflow, out-of-range targets, writable executable pages, unexpected exports,
ABI mismatch, wrong architecture/profile, and stale generations. Arbitrary
load-time constructors are forbidden; bounded initialization receives only
explicit interface state. Position independence, control-flow integrity, and
direct/fixed-stub optimization must preserve exact-generation semantics.
Provider-specific optimization assumptions must appear as explicit metadata;
secret devirtualization cannot erase provider compatibility.

Loading grants no ambient authority. Package/interface metadata requests or
describes and never grants capabilities. An in-process provider operates inside
the caller's already established domain and ABI safety model. An isolated service
receives its own explicitly projected capabilities. Ordinary compression should
need bounded input/output memory, CPU, and RAM—not filesystem, network,
credentials, GPU, or disk-administration authority. Binding, interface
inspection, provider administration, package install, and capability transfer
are separate rights.

## Immutability, lifetime, and accounting

The [unified system monitor](../monitor/SYSTEM_MONITOR.md) may report exact
provider bindings, live/retained generations, accounting, and collection
eligibility. Observation grants neither rebinding nor reclamation authority and
remains **PLANNED**.

Dynamic does not mean mutable. Once admitted, code and read-only data are exact
immutable generational objects. Updates never patch executable pages beneath a
running process and preserve W^X.

Existing consumers may retain Zstd generation 14 while new consumers bind
generation 15. Long-lived contexts remain bound to their creation provider and
cannot migrate unless the interface defines an explicit, authenticated state
export/import operation. A prohibited vulnerable generation receives no new
bindings; policy reports affected processes and may request or force bounded
restart. Retained prohibited content can remain quarantined for forensic use
without becoming normally executable.

An old provider generation is reclaimable only when it has no live process,
service, or binding references; no retained `SystemGeneration`,
`ApplicationGeneration`, rollback root, export, or snapshot pin; and package
store GC policy permits reclamation. Revoked signing keys stop new admission and
trigger policy reevaluation, not blind deletion of owner state.

Immutable executable pages may share one physical `MemoryObject` across domains,
while each mapping has exact rights/generation and each process has private
state. Accounting distinguishes physical backing, per-domain mappings, private
state, relocation/metadata, and service pools. The physical charge is assigned
once under explicit system/cache policy; mapping/table and private charges stay
with each consumer; fanout and mappings are bounded so sharing cannot amplify
resource authority. Shared backing does not exempt any page from `MemoryPool`
accounting, pinning limits, revocation, cleanup, or W^X. Cross-domain writable
executable sharing is forbidden.

## Store, generations, snapshots, and policy

Component update policy metadata conceptually supports:

- `INDEPENDENT`: compatible provider versions may be serviced independently;
- `SYSTEM_RELEASE_BOUND`: a coherent `SystemRelease` selects the exact provider;
- `BOOT_BOUND`: early-boot admission selects the exact implementation;
- `SECURITY_PINNED`: stronger security/rollback/review policy applies.

Names are provisional and a component may be more constrained by profile.
Ordinary userspace `org.mrml.zstd` is the first planned `INDEPENDENT` example.
Bootloader/recovery Zstd can remain statically embedded or `BOOT_BOUND`. Coupled
providers form an explicit update group rather than pretending independence.

The Store understands `PROVIDES`, `REQUIRES`, interface generation, dependency
form, and update policy. Its preview shows affected dependents, compatibility,
provider substitutions, restarts/reboots, retention, rollback, security impact,
and download/storage cost. A Store update constructs a candidate graph; it does
not overwrite a shared library. Official-provider preference and alternative
providers are visible owner policy.

`SystemRelease` signing validates every release-bound requirement. A
`SystemGeneration` records system-bound exact bindings; an
`ApplicationGeneration` records independently selected application bindings;
service instances also retain exact service generations. System and application
activation is atomic at the relevant graph boundary. Support reports, crash
dumps, task views, profiling, snapshots, and exact exports preserve provider
package generation/digest, interface generation, and binding generation—not just
the main application version. Debug symbols remain separately authorized.

Exact restore reproduces the recorded graph subject to current security policy;
`COMPATIBLE_CURRENT` may resolve admitted compatible providers. Prohibited old
code requires an explicitly isolated forensic mode rather than normal execution.
Offline image servicing reruns dependency resolution. A self-contained install/
recovery image includes the provider closure needed offline; a later thin image
declares external repositories without making base recovery network-dependent.
Dependency graphs and versions are locally inspectable but not transmitted as
telemetry without separate authority.

Future typed administration may expose `Get-PackageDependency`,
`Get-InterfaceProvider`, `Get-InterfaceConsumer`, dependency impact previews,
and interface migration/ABI-diff tests. Inspection never grants load, install,
provider-control, debug, or content-read authority.

## Boot, kernel, VMM, and recovery constraints

The UEFI loader, early kernel, and recovery-critical path remain bootable without
the normal userspace component resolver. The bootloader understands only its
bounded boot-safe package profile and never solves the desktop graph. It may
embed a minimal Zstd decoder even while userspace independently services Zstd.
Recovery may understand a deliberately larger bounded subset, but its essential
package/image codecs remain pinned or static and self-contained so a broken or
malicious provider update cannot make recovery unreadable.

This model does not automatically turn kernel dependencies into ordinary
dynamic libraries. Kernel componentization needs a separate TCB/security review.
The VMM may consume a serviced interface only when host/native target rules,
explicit ABI compatibility, release/update policy, and TCB review permit it; a
low-trust update cannot silently change the VMM TCB.

## Build and compiler integration

The public `mrml` build/package frontend resolves Rust compile-time crates and
MRML runtime interfaces as separate graphs. Cargo remains a transitional private
bridge and its dependency model never becomes the runtime package model.
Canonical package manifests carry typed provides/requires, interface generation,
dependency form, update class, target/profile, and evidence metadata; lockfiles
record exact selected provider generations and digests.

The semantic `packages/` hierarchy organizes deployable packages. Private crates
may live below a package, for example `packages/libraries/zstd/crates/`, without
recreating a repository-wide generic crate dumping ground. Static embedding is
allowed for boot/recovery, security-pinned builds, or measured specialization.
Rust generic code is not mechanically converted into a dynamic component.

Eventually `mrml` generates bindings, validates schemas/fingerprints, resolves
providers, produces ABI diffs, and emits exact runtime locks. `mrml-rustc`
eventually validates MRML ABI metadata directly, rejects unsupported layouts or
unsafe transfers, and emits the same contract as pinned upstream rustc. Neither
compiler silently falls back or changes interface identity.

## Initial milestones and acceptance

After package identity, generation construction, package resolution, loader
foundations, stable ABI primitives, and quantitative memory accounting, proceed:

1. versioned canonical interface schema and generated safe bindings
   (**PARTIALLY IMPLEMENTED** for frozen schema version 1, bounded multi-result
   schema version 2, and the Zstd ABI-3 fixture);
2. typed provides/requires metadata and exact candidate resolution
   (**PARTIALLY IMPLEMENTED** as bounded in-generation exact resolution);
3. immutable in-process loader and generation-safe `InterfaceBinding`
   (**PARTIALLY IMPLEMENTED** for immutable binding identity/lifetime and a
   backend-neutral launch admission that accepts only the exact consumer and
   provider load plans selected by the generation-bound service placement);
4. `org.mrml.zstd` providing `compression.zstd@3`
   (**PARTIALLY IMPLEMENTED** for the canonical byte-call provider and bounded
   hosted kernel-IPC/shared-buffer adapter, a supervised hosted native-service
   lifecycle, plus a standalone signed MRML-target provider launched with exact-
   generation identity on WHP and nested KVM);
5. `org.mrml.zim` consuming that interface without provider path knowledge
   (**PARTIALLY IMPLEMENTED** for an isolated-service manifest requirement,
   bounded borrowed views, typed responses, and a separately signed MRML-target
   consumer probe launched with the provider on WHP and nested KVM);
6. Store update N to N+1 while old/new ZIM processes retain exact bindings
   (**PARTIALLY IMPLEMENTED** as a bounded non-retargeting binding model);
7. lifetime/rollback/snapshot-aware GC and dependency inspection
   (**PARTIALLY IMPLEMENTED** as a no-delete eligibility/inspection model);
8. ABI-4 coexistence/rejection and vulnerable-provider quarantine/retirement
   (**PARTIALLY IMPLEMENTED** for incompatible-generation rejection and denial
   of new prohibited-provider bindings only);
9. cross-compiler, performance, fuzzing, and optional service-provider evidence
   (**PARTIALLY IMPLEMENTED** for bounded hosted kernel IPC/shared-buffer
   dispatch, a supervised native-service endpoint, an isolated-endpoint adapter,
   and one explicit descriptor scalar
   projection compiled by `mrml-rustc` to COFF/ELF while pinned upstream rustc
   executes the reference; full binding, performance, fuzzing, launched-service,
   and real isolation evidence remain);
10. selective migration of further high-value components.

The cross-microVM call wire is now **PARTIALLY IMPLEMENTED** as one fixed 4 KiB
request/response slot bound to the exact two-peer memory projection. Its retained
kernel endpoints revalidate both capability generations and exact object,
mapping, target, and virtual-page identities on every transition. The wire binds
the interface fingerprint, ABI generation, provider generation,
SystemGeneration, policy generation, binding generation, operation, payload
length, and monotonic request sequence. It carries no capabilities, pointers, or
path names. Invalid state, identity substitution, stale authority, replay,
oversized payload, undersized output, and sequence exhaustion fail before
publication. Request and response publication now each produce a non-forgeable
typed notification carrying the exact binding identity, operation, and sequence;
the opposite endpoint must present it before consuming payload bytes. The hosted peer-page test now transports an exact canonical block-provider READ
and its 512-byte result across two live VM mappings. The shared wire holds only
the existing request, canonical status, and exact-length data on success. The
adapter rejects stale sessions before backend dispatch and requires exact
response length before publishing bytes to the caller. The retirement simulation
checks that stale request and completion notifications do not reach the
replacement provider or change the caller's buffer. The focused signed guest
payloads now generate and check the sector through their own page tables.
Nested KVM reached both guest payloads and verified native mapping retirement.
On the local WHP host, the second partition object and setup succeeded but
its first `WHvMapGpaRange` returned `0xC0370008` (`ERROR_VID_PARTITION_ALREADY_EXISTS`).
The diagnostic now runs the provider in a separate test process while the
consumer partition remains live. Both map one pagefile-backed Windows section
at independent GPAs. The parent observes the worker guest's sector writes
through its existing mapping without a file-copy handoff. The signed consumer
checks all 512 bytes, and both processes verify that their exact virtual and
GPA mappings are absent after retirement. This verifies the diagnostic, not a
production worker transport or a same-process fix. The host coordinates the canonical queue
and its interrupt routing separately; the guest payloads do not consume
injected interrupts. This reuses the
existing slot and adds no mapping or service authority. Release fences precede request, response, and idle publication;
matching acquire fences follow state observation before consuming metadata or
payload. Backend interrupt/event delivery, a race-tested atomic shared-state
representation, signed component execution, and recovery integration remain
**PLANNED**.

Backend-neutral notification routing is now **PARTIALLY IMPLEMENTED** by
binding each directional token to one exact VM/vCPU, allowlisted external
vector, and `SIGNAL`-authorized interrupt object. The latch accepts only the
next notification for its queue identity and clears only after confirmed
injection; policy denial or backend uncertainty cannot manufacture an
acknowledgement. The retained two-peer WHP/KVM owner now selects the exact
provider guest for request delivery and the exact consumer guest for response
delivery, and injects each published token through that existing boundary.
Nested KVM exercises both directions across two live guests; WHP carries the
same checked adapter and test path. Guest interrupt handlers, recovered
two-domain ownership, and signed consumer/provider execution remain
**PLANNED**.

The end-to-end Zstd gate proves equal corpus decoding by old and new providers,
no ZIM rebuild, old-generation retention while referenced, later safe GC, ABI-4
non-substitution, and prohibited-generation denial for new bindings. Performance
compares static and dynamic compression/decompression throughput, load/startup,
call overhead, physical/mapped RAM, code-cache behavior, and update size. The
dynamic form targets negligible steady-state overhead; results, not ideology,
decide static/dynamic placement.

Before maturity, prove no path/filename binding or symbol interposition,
generation-safe references, incompatible-ABI rejection, W^X and immutable
updates, complete accounting, no metadata authority grant, safe retention/GC,
policy-controlled substitution, recovery independence, and fail-closed stale
contexts/handles. Test unit/simulation, hosted, nested-virtualization, and
physical evidence as distinct categories; documentation is none of them.

## Non-goals

MRML dynamic components are not ELF `LD_LIBRARY_PATH`, Windows DLL search,
arbitrary global symbols, unrestricted plugins, live code patching, every Rust
crate converted to a DLL, or a replacement for service isolation. They are
typed interface bindings to exact immutable admitted provider generations,
independently serviceable where evidence and policy justify it, capability-aware,
package/provenance-aware, and compatible with shared immutable code pages.

Engineering Constitution complexity score for the future subsystem: complexity
impact `HIGH`, TCB impact `HIGH` for the in-process loader and `LOWER/ISOLATED`
for service providers, new parser `YES`, new authority model `NO`, new persistent
state `YES`, external dependency `NO`, failure isolated `PARTLY`, and existing-
object reuse `YES` through packages, generations, capabilities, `MemoryPool`,
`MemoryObject`, services, and deployment transactions. The design passes the
digital-rights review only if owner-authorized providers remain viable,
first-party preference is policy, metadata never grants authority, local graphs
do not create telemetry, recovery remains owner-controlled, and no DRM authority
is introduced. Hostile-security review treats every schema, manifest, provider,
binding, relocation, handle, generation, length, capability transfer, update,
retention root, and cleanup result as adversarial.

Patent review: `TRIGGERED` — package/interface resolution, executable loading,
generated ABI bindings, update/retention composition, and shared-page accounting
require mechanism-specific Canadian review before implementation. Record that
review in [patents/REVIEW_LOG.md](../patents/REVIEW_LOG.md); this design does not
establish patent clearance and agent review does not replace human dual review.

The checked-in ABI-3 binding package and direct in-process provider adapter are
bounded hosted evidence. Separate `org.mrml.zstd` provider and `org.mrml.zim`
consumer artifacts now build for the MRML-native target; the consumer launch
registers bind an exact endpoint, provider task, shared-buffer capability, and
provider generation while the interface request remains free of routing
identity. A common launch admission now rejects either artifact when its exact
package generation/digest differs from the immutable interface placement, so
WHP and KVM do not independently select package bytes. A kernel-owned prepared
launch handoff also retains both exact digests, interface fingerprint and
generation, provider generation, and the still-uncommitted Total-mode route;
any substitution returns that route for fail-closed unavailable/cancel
handling. Both WHP and KVM now consume that same handoff, reject wrong service
kinds or either digest before mapping, and attach the consumer/provider through
an unpublished builder so a second-image failure cannot return a partially
prepared guest. Failure while constructing the guest, binding that handoff, or
attaching either exact image consumes the route into typed `VMM_RESOURCE`
unavailability, with no native fallback. Both exact signed artifacts have now
completed the hosted controlled probe on WHP and nested KVM. That focused path
now also charges the shared data and resource pages as distinct one-page shared
objects with exact read/write guest mapping reservations before construction;
their kind and guest address grant no authority, mapping exhaustion fails before
publication, and teardown retires mappings before object reclamation. This is
bounded accounting for the existing transport, not a new interface ABI or a
general device-projection mechanism. The same pre-construction control plane
now classifies both verified PE images into exact shared R/RX and private RW
objects, charges allocation gaps privately, and uses distinct consumer/provider
target capabilities even when their virtual layouts match. Runtime ABI-3
traffic remains on the already-bound IPC/shared-memory data path and performs
no provider lookup or policy round trip. The package resolver still must
connect the recorded generational `InterfaceBinding` to native call dispatch;
the current Wikipedia composition root constructs the provider for hosted
tests. This does not establish dynamic loading, service isolation,
update-without-rebuild, retention/GC, performance, fuzzing, WHP/KVM execution,
or physical-system evidence beyond that bounded hosted path.

The cross-compiler probe is deliberately narrower than binding compatibility.
Pinned upstream `nightly-2026-08-29` executes the exact generation, operation,
request-size, and response-size identity check; `mrml-rustc` emits bounded COFF
and ELF objects for the independently authored scalar projection. It does not
show that `mrml-rustc` can compile the generated binding crate, that either
compiler lowers native component calls, or that C/Rust ABI layout is stable.
