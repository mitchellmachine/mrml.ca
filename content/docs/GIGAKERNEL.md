# MRML Gigakernel design

The MRML Gigakernel is named after Gigachad. It provides the privileged
mechanisms for Total MicroVM isolation; ordinary apps and services belong in
admitted microVMs. The name does not imply that full-system operation is ready.

This file is the detailed implementation and dated evidence ledger. Stable
project direction is in [ARCHITECTURE.md](ARCHITECTURE.md), normative boundaries
in [SECURITY.md](SECURITY.md), application direction in
[APPLICATION_PLATFORM.md](APPLICATION_PLATFORM.md), dependency order in
[ROADMAP.md](ROADMAP.md), and context-loss procedure in
[RECOVERY.md](RECOVERY.md). Planned architecture in those documents must not be
reported as implemented evidence here. Platform skips and unavailable hosts in
individual entries describe those runs. For current Windows testing scope see
[Project status](PROJECT_STATUS.md#windows-testing).

This document records design intent, not a claim of production readiness. The
kernel is new, original Rust intended for CC0 dedication. Research informs
requirements and trade-offs; no third-party implementation is copied or
adapted.

## How the Gigakernel compares

These names describe different design choices: what belongs in the privileged
core, how workloads are isolated, and how kernel correctness is established.
They are not mutually exclusive categories.

- **A conventional microkernel** keeps a small privileged core for mechanisms
  such as scheduling, address spaces, and interprocess communication. Higher
  level services run outside the kernel, usually in isolated user-space
  processes. Microkernels can also support virtual machines. For example,
  [seL4's white paper](https://sel4.systems/About/whitepaper.html) describes
  capability-controlled systems that mix native components and virtual
  machines. MRML shares the small-core and capability principles, but it
  does not offer native user-space execution as an alternative for ordinary
  apps or services.
- **Hyperkernel** here means the specific
  [2017 SOSP research kernel](https://syslab.cs.washington.edu/papers/nelson-hyperkernel.pdf),
  not a generic name for a kernel that uses virtualization. Hyperkernel used
  hardware virtualization to separate kernel and user address spaces and
  hypercalls to enter the kernel. Its defining goal was automated formal
  verification of a bounded, xv6-derived trap interface using Z3. It also
  ran a filesystem and a network stack as separate user-space servers
  ([§4.3](https://syslab.cs.washington.edu/papers/nelson-hyperkernel.pdf#page=11)),
  so neither hardware virtualization nor moving those services out of the
  kernel is unique to MRML.
- **The MRML Gigakernel** enforces an operating-system placement rule:
  [Total MicroVM isolation](ISOLATION_PLACEMENT.md) is the only ordinary
  operating mode. Apps and services use admitted, supervised microVMs or remain
  unavailable. The privileged core supplies launch, memory, and communication
  mechanisms. Cross-VM access requires explicit, scoped, revocable capabilities;
  merely running a guest or knowing another guest's identity grants no access.
  The loader and virtualization substrate are required mechanisms, not another
  way to run ordinary workloads.

For example, the hosted storage probe exercises a read across two signed guests
using one authorized page and verifies its retirement. It does not establish
that an installed storage service or full-system Total MicroVM operation is
ready. "Gigakernel" is MRML's name for this combination of design choices,
not a claim of architectural priority or of formal verification equivalent to
Hyperkernel's or seL4's.

## Privileged footprint baseline

Baseline: `a9ca7377`, x86-64, default release kernel image, dated
`nightly-2026-11-26` on Arch WSL. Build with
`mrml build org.mrml.system.bootloader --target uefi-x86_64 --release`
without a diagnostic feature profile. In the resulting `mrml-kernel-pe.efi`,
the only executable PE section was `.text`: **35,133 virtual bytes**
(35,328 file bytes with alignment). The whole PE was 2,144,256 bytes;
it was mostly data, not executable text. This excludes the separate EFI
loader, and is not an estimate of source lines or a complete trusted base.

The default image's privileged entry sets up descriptor and exception
handling, decodes the boot handoff, and validates early kernel state.
Malformed input and the terminal bootstrap path halt. The normal image
does not yet start installed service MicroVMs, so there is no live guest
service dispatch surface to count for this build. The DPL-3 user-call
gate and guest-facing service paths in the diagnostic profiles are not
part of the default boot baseline. The separate VMX monitor, hosted KVM
and WHP, firmware, and the loader's package and memory-map handling are
different trust boundaries and not included in the number above.

For the first normal image that starts installed services, remeasure the
executable sections and enumerate every guest-reachable entry: hypercall
and trapped instruction dispatch, interrupts, route/queue validation, and
page and device teardown wherever enabled. Keep only enforcement mechanics
privileged; prefer movement of policy and parsing to admitted services
where the working lifecycle can sustain it. Do not compare PE bytes
directly with Hyperkernel's reported source-line count.

Installed recovery now joins the configuration, authority checkpoint,
deployment checkpoint, and signed-release file selections only when all
were borrowed from the same validated recovery graph. Equal on-disk volume
and generation numbers do not establish that relationship. This is a local
provenance check; separate file capabilities and signature verification
remain required. The hosted recovery regression rejects a checkpoint and a
release selected from a separately validated copy with identical generation
metadata.

The installed recovery reader now selects exact service file generations
from that retained graph and refuses to reuse control-plane files, repeat
an object, or accept a missing or stale selection. Reading still requires
an independently held file READ capability and uses the same retained
recovery volume with extent verification. A hosted block fixture recovered
and read a separate file through this path; the release file's READ handle
could not be substituted. This validates the installed storage mechanism
in a hosted fixture, not an installed boot or executable signature. The
next integration step is to pass authenticated recovered service bytes to
the complete executable preflight before creating guests.

Recovery now also reads the full selected service file into a bounded
caller buffer, using the length from the recovered metadata. It verifies
the container signature and version under a separately supplied service
trust root before parsing the PE. The read handle, file generation, trust
root, and release assignment remain separate checks. A controlled block
fixture recovered an independently signed multi-block executable and checked
its payload digest; wrong file authority, insufficient output, wrong key,
and an artifact below the pinned version floor were rejected. The returned
executable can enter release preflight, but this reader test does not launch it.

The hosted two-domain KVM startup test now reads both signed diagnostic
executables, the deployment checkpoint, and the signed SystemRelease through
the same selected block volume. It independently verifies both service
signers, requires the complete executable set to match the admitted release,
and uses the recovered executable buffers to start the two KVM MicroVMs.
The test rejects a wrong signer and incomplete or substituted executable
sets, observes both guests execute, verifies separate guest memory, and checks
that the second guest still runs after the first is retired. The fixture is
now serialized and synced to a raw volume image. The KVM test reopens that
image read-only for both launch attempts. Recovery reads the configuration,
authority and deployment checkpoints, release, and service files through the
same volume; file errors never fall back to the memory used to build it.
The portable storage regression rejects a changed service extent and a
truncated image. This remains hosted integration evidence: the disk layout
and owner approval are generated for the test. It does not verify firmware
boot from installed media or production services under the normal Gigakernel
boot path.

## Implementation evidence

The current UEFI filesystem calls load boot artifacts and the current GOP
renderer supplies bounded bring-up diagnostics. They are not the planned native
filesystem, compositor, surface/buffer protocol, or desktop graphics stack. The
mediated VGPU work below supplies experimental resource/compute mechanisms; it
does not define GUI semantics or prove accelerated presentation.

The kernel's adaptive-isolation foundation now includes a fixed-capacity launch
admission table. It binds each prepared domain to an exact policy generation,
eligibility class, and placement; commit requires matching native, microVM, or
platform backend-ready evidence. In Total mode it rejects eligible native
placement and active unsupported blockers, and a typed resource or transport
failure cancels preparation without creating a native fallback. Six focused
tests are included in the Windows and Arch Linux hosted kernel suites.
This mechanism does not create VMs, select providers, allocate resources, or
run a full system, so full-session Total MicroVM remains **PLANNED**.

Unavailable isolation attempts now remain in a same-capacity ordered ledger
instead of disappearing when their prepared slot is released. Each record binds
the exact domain, policy generation, monotonic attempt sequence, eligibility
class, requested placement, and typed resource/transport reason. An admitted
retry clears the older record only after capacity, policy, placement, and next
generation all preflight successfully; bounded retention evicts only the oldest
failure. The Total report exposes the number of unavailable eligible domains but
does not miscount them as running native fallback. Focused tests cover this in
both hosted suites.

The freestanding service router accepts only microVM launch specifications and
exposes only microVM backend dispatch; direct application dispatch is likewise
excluded. A failed guest launch records typed unavailability without fallback.
The configuration launcher owns its admitted guest through exact endpoint
retirement, demonstrated in signed hosted WHP and KVM probes. Existing hosted
direct-lifecycle tests do not define an OS mode or an installation option.

The first component data-plane prerequisite now composes the canonical Zstd
ABI-3 request with the existing kernel IPC/shared-memory mechanisms outside the
privileged kernel. The provider accepts one request delivered through the
bounded `TaskRuntime` inbox and exactly one attenuated read/write shared-buffer
capability, revalidates its VM/task binding, copies only the declared compressed
input into private scratch, invokes the existing provider, writes only the exact
successful output range, and erases scratch on every return path. The Zstd and
ZIM manifests select `isolated-service`; Zstd is restricted to microVM
placement. Twenty-two focused Zstd tests pass
on Windows and Arch Linux, including actual inbox delivery, revocation, wrong-
task rejection, distinct VM/task projections, invalid-frame no-write, and
scratch exhaustion. The provider now also has a bounded userspace receive/reply
loop behind a narrow unsafe runtime trait; its tests prove exact envelope shape,
range-limited buffer use, response ordering, received-leaf release, and erasure
on success and failure. The concrete Zstd and FAT32 syscall adapters now reject
a successful kernel receive result when its reported payload length or
capability count exceeds the exact buffers supplied to the trap, before a typed
service envelope is returned. Focused Linux suites pass 27 Zstd and 34 FAT32
tests. This is service-boundary hardening, not new provider authority or
installed-service evidence. The MRML-native ZIM consumer probe now applies the
same exact-capacity rule before exposing receive results; its native artifact
builds and its Linux suite passes six tests. Its single outgoing capability
descriptor now also uses explicit 8-byte-aligned, exact 16-byte storage, and
its send wrapper rejects an invalid payload length before trapping. Patent
review: **NOT_TRIGGERED**; these are ordinary bounds and ABI-alignment checks in
an existing syscall adapter. See [the patent review log](patents/REVIEW_LOG.md).
A hosted `TaskRuntime` adapter also completes the full
authenticated request/
reply path: only the launch-bound sender is accepted, reply authority is
separate, the transferred leaf is revoked before reply visibility, and
revocation failure suppresses the response. The kernel's committed route now
retains the domain, policy generation, Total-mode class, and placement as well
as interface/provider identity. The adapter consumes that route only when it
matches the expected interface object, ABI generation, provider generation, and
policy generation; the data plane cannot substitute them. This is hosted
unit/simulation evidence. A register-level userspace adapter emits the exact
existing receive-buffer (5), shared-buffer read/write (7/8), capability-release
(12), and send-buffer (4) frames; a full mock-trap test proves the bounded call
and release-before-response order. A successful buffered receive preserves the
exact kernel-recorded sender task token in R8, for both immediate and blocked
completion. The token identifies the sender; it does not grant authority.
The FAT32 block client requires that token to match its launch-bound provider
before copying shared bytes. The other buffered result fields are unchanged. The canonical provider now also builds a
standalone x86-64 UEFI service binary containing that `int 0x80` implementation,
one private 4 KiB scratch page, and immutable launch-register endpoint/caller/
provider-generation inputs. Windows and Arch Linux target builds pass; Windows
format inspection found machine `0x8664`, PE32+ magic `0x020b`, EFI application
subsystem 10, and nonzero entry RVA `0x0000ae90`. The allocation-free target
floor supports raw/RLE blocks and rejects entropy-coded blocks pending bounded
table migration. No service process or guest executed, the actual generation
resolver is not connected to launch, and supervision/resource-pool and WHP/KVM
parity were absent at this checkpoint. Later signed microVM probes are
recorded below.

The native half is now wired to actual kernel supervision. `ServiceSupervisor`
preflights object and slot capacity before task creation, then publishes the new
task and service identity without exposing an intervening reservation. The
configuration launcher requires an otherwise empty owned runtime, starts the
exact task, and returns an endpoint carrying its service/task and immutable
interface/provider generations. Revocation uses `exit_current`, checks the exact
cleanup task, and calls `complete_cleanup`; injected eraser failure retains the
stopped endpoint and cleanup ticket until an exact retry succeeds. Windows and
Arch Linux pass 36 configuration tests and the 489-test kernel suite remains
green. This native lifecycle result is hosted unit/simulation evidence, not
physical evidence.

A one-use `PreparedIsolationServiceRoute` now carries the complete typed service
binding across a multi-step backend construction window. Preparation reserves
admission before backend mutation. Success commits only readiness matching the
bound placement and returns the endpoint with the same immutable interface and
provider generations. Failure can enter the unavailable ledger, while commit
failure returns the endpoint and transaction so backend revocation completes
before the admission slot is cancelled. One focused test is included in the
489-test Windows and Arch Linux kernel suites. The KVM and WHP service probes now
prepare this exact transaction before constructing their native guest, commit
the verified service artifact version as its provider generation, commit the
fully attached guest as its endpoint, and recover the unchanged endpoint for
execution. A one-use admitted-guest factory rechecks the complete service
specification, after which only the matching generational endpoint exposes the
retained guest. Successful terminal execution explicitly retires that lifecycle
before success is reported. Release builds and focused runner tests pass on both
hosts (KVM 8, WHP 7). Newly built one-time-signed identical kernel-package and
service artifacts then completed the full probe under both backends on
2026-08-25: each reported one eligible domain, one microVM domain, and zero
native fallback. KVM reported `verify=22013us`, `prepare=2758us`,
`execute=1578us`, `total=109945us`; WHP reported `verify=18258us`,
`prepare=6937us`, `execute=3530us`, `total=53537us`. This is fresh hosted
controlled-probe transaction/lifecycle parity, not host-resistant or physical
evidence.

The hosted KVM and WHP `service-probe` launchers now prepare the exact
configuration-service domain as `MICROVM_ELIGIBLE` under policy generation 1
before constructing the guest. They commit only `MicrovmReady` after the signed
guest and service mappings exist, reject any unsatisfied report, and emit the
requested/effective counts only after the full existing probe succeeds. Both
native launchers compile through the canonical `mrml` frontend. After the
service setup capability was separated from its least-authority data capability
and retired backing was erased, fresh one-time-signed KVM and WHP executions on
2026-08-25 completed the service exchange, cleanup, reprovision, restart, and
zero-fallback report. These remain hosted controlled probes of the existing
microVM form, not a native-versus-microVM resolver, cross-placement transport,
host-resistant isolation, or Total-system satisfaction.

Likewise, QEMU `virtio-rng-pci` and debug-console devices in recorded boot
commands belong to the external QEMU test machine. MRML does not currently
implement or advertise a VirtIO device. The common VMM exit/interrupt mechanisms
and MRML-specific mediated GPU queues are foundations, not a complete virtual
device model. A future VirtIO-GPU-compatible presentation path must coexist with
rather than replace the authenticated signed-kernel CUDA compute path.

The existing generational capability, IPC attenuation/rollback, task retirement,
service restart, typed error, artifact-state, and protected secret-use mechanisms
are foundations only. MRML does not yet implement a general authority provenance
graph, introspection/explanation API, expiration service, secure file picker,
disposable domain launcher, `SecretObject` service, credential broker, AI
principal UI, structured diagnostic-object service, or scoped debugger.

## Security boundary

MRML assumes a conventional Windows or Linux host and its VMM process may be
fully compromised. Consequently, hosted KVM/WHP execution is a development,
compatibility, and benchmark mode only: such a host controls guest memory,
page tables, scheduling, device emulation, launch evidence, and the current
host CUDA service. Cryptographic framing cannot protect a key that the host can
read from guest RAM or derive from a handoff it created. No hosted-mode result
establishes confidentiality, integrity, verified boot, or correct GPU execution
against that host.

The production architecture is therefore a bare-metal type-1
Gigakernel launched by measured UEFI. The kernel contains only
mechanisms: address spaces, scheduling, interrupt/IOMMU control, capabilities,
IPC, and VM entry/exit. A small, networkless management service owns policy and
domain lifecycle but receives no direct memory authority over ordinary service
VMs. Networking, storage, display composition, tools, model loading, and GPU
mediation run in mutually isolated least-authority service VMs. The GPU service
must run as an MRML-controlled domain, not as a process owned by an untrusted
Windows/Linux host.

The compartment model is also retained inside hosted MRML for defense in depth:
it can contain a compromised tool or model service from peer domains when the
host remains honest. It does not create a nested security boundary against a
malicious outer host. MRML targets common home-computer virtualization
facilities and does not depend on server confidential-computing extensions.

### Layered protected execution

Protection is an explicit, downgrade-resistant launch property rather than an
inference from the VMM name. Each launch authority emits a canonical report
containing the backend, an exact claim set, security version, code measurement,
fresh nonce, monotonic sequence, and debug state. Policy independently requires
claims and measurements; unknown bits, backend overclaims, replay, debug mode,
and security-version rollback fail closed. The report format and policy checker
are implemented, but a report is not attestation until a hardware-backed launch
authority authenticates it. Secrets must not be released on a self-asserted or
ordinary hosted report.

Policy names one exact backend in addition to its required claims. This is
necessary because claim sets intentionally overlap: for example, both VBS and
bare-metal reports may honestly claim only `MEASURED`. A correctly authenticated
report from the wrong mode returns `BackendMismatch` before sequence state is
advanced, so a subsequent correct same-sequence report remains admissible. The
authority-receipt API provides one `verify_and_admit` operation that verifies
the request-bound MAC first and immediately applies backend, claims, version,
measurement, nonce, replay, and debug policy. The VBS host probe uses this
combined operation rather than treating MAC verification alone as launch
admission.

The launch request's separate policy measurement is not trusted merely because
it is included in the authenticated request digest. `ProtectionPolicy` has one
fixed 88-byte encoding covering the exact backend, claim set, debug permission,
minimum security version, and image measurement; its identity is SHA3-512 over
that canonical encoding. The VBS authority recomputes the commitment from its
independently compiled policy before issuing a receipt. Final
`verify_and_admit` requires the request, verifier-owned expected commitment, and
the actual `ProtectionPolicy` being enforced to agree after authenticating the
exact request. A mismatch has its own fail-closed error and does not advance
replay state. Tests alter both an identity and a security field while retaining
an otherwise valid request and receipt, then prove a correct same-sequence
request remains admissible.

Policy success and evidence authenticity are separate types of facts. Direct
`ProtectionSession::admit` calls return only a raw `ProtectionAdmission` marked
`SelfAssertedReport`. The request-bound verification path instead returns an
`AuthenticatedProtectionAdmission` carrying the exact request digest and the
independently approved policy measurement. Only that authenticated type exposes
secret-release eligibility, which additionally requires non-debug execution and
`SEALED_KEYS | MEASURED`. This makes an unauthenticated local report incapable of
becoming release-capable through a future claim expansion. The authenticated
type says only that the configured receipt key approved the decision; it is not
hardware attestation. A fixed key exists only in pure tests; the production VBS
image now generates and shares its receipt key exclusively through exact-code
Windows sealing.

Explicit mode reporting follows the same type boundary. Only an
`AuthenticatedProtectionAdmission` can produce an `AuthenticatedProtectionMode`
(`VbsVtl1`, `BareMetalVmxRoot`, or `Unprotected`). A raw self-asserted admission
has no verified-mode conversion. The VTL1 receipt verifier additionally requires
the authenticated mode to be exactly `VbsVtl1` and requires secret-release
eligibility before it records the receipt half of the one-use release gate.

The intended x86_64 layers are:

- ordinary WHP or KVM remains explicitly unprotected against its host;
- a Windows VBS enclave may isolate a small launch authority and keys from a
  compromised VTL0 host, while still trusting Hyper-V, the secure kernel,
  firmware, and hardware;
- bare-metal MRML places domain ownership, page-state transitions, interrupt
  routing, and IOMMU policy in a minimal VMX-root monitor;

None of these layers implies trusted GPU output. A claim set cannot include
private memory, hostile-VMM isolation, attestation, or trusted I/O merely
because the host advertises Hyper-V or because a guest boots successfully.
Backend-specific evidence verification and a protected accelerator channel are
separate requirements.

The Windows GNU/LLVM path dynamically resolves the documented
`IsEnclaveTypeSupported` query and the complete create/load/initialize/call/
delete enclave lifecycle from `kernel32.dll`. This avoids an MSVC SDK or import
crate dependency and distinguishes missing ABI from unsupported VBS. Discovery
does not create an enclave and does not upgrade a WHP launch's protection
claims; capability discovery alone is not evidence verification.

The feasibility backend now performs a real reservation test on supported
Windows systems: it creates a non-debug, explicitly owned 256 MiB VBS enclave and
deletes it through an owning RAII handle. ABI layout is asserted as the
documented 36-byte create-information structure. Lifecycle symbols resolve
from the enclave API-set DLL with a Kernel32 fallback, which is required on
systems where forwarded exports are not directly visible. Reservation alone
still proves no code execution; the separate signed-image probe is described
below.

The owning Windows handle now models `Reserved -> ImageLoaded -> Initialized`
as an explicit one-way state machine. It dynamically resolves
`LoadEnclaveImageW` (the signed PE image path required by current Windows) and
`InitializeEnclave`, rejects unterminated or embedded-NUL UTF-16 paths, rejects
initialization before an accepted image, requires a nonzero thread count, and
preserves the VBS initialization structure as mutable because Windows returns
the actual created thread count through it. These transitions are implemented,
malformed-state tested, and exercised by the signed-image probe below.

`packages/experiments/mrml-vbs-enclave` is the first standalone enclave image source. It
is original `no_std` Rust using only MRML crates and `core`, builds as a PE DLL
with the Windows GNU/LLVM toolchain, and embeds an 80-byte x86_64 enclave
configuration. The configuration is non-debug, uses strict containing-process
memory isolation, declares one thread, a 256 MiB private range, explicit
family/image identities, security version one, and primary-image status. A
custom Rust target omits MinGW CRT startup and ordinary Windows imports; the
release PE imports only Microsoft's enclave-supported platform DLLs,
`vertdll.dll` and `bcrypt.dll`. Boundary-copy, identity, attestation, and safe-key
queries come from Vertdll, while verifier challenges use BCrypt's enclave-safe
system RNG. Its Windows and Linux source tests pass and the resulting DLL passes
MRML's Authenticode PE parser.

The bundled LLVM GNU linker does not implement Microsoft's `/ENCLAVE` linker
switch (while LLVM's MSVC-flavor linker is incompatible with the installed GNU
target). MRML therefore emits the equivalent load configuration and finalizes
the integrity characteristics itself. The DLL is still not loadable until its
finalized bytes carry a Windows-accepted enclave signature.

The GNU/LLVM image now supplies the reserved `_load_config_used` symbol as an
exact 256-byte x86_64 load configuration. Its relocated enclave pointer resolves
to the 80-byte strict configuration in the built DLL. An image-relative CFG
table contains the sorted RVAs of `DllMain`, the boundary probe, and the
authority entry point. The load configuration binds its VA, exact count,
valid-target-table flag, and unused-security-cookie declaration. LLVM now
instruments indirect calls and the image supplies a nonzero x64 CFG dispatch
pointer to an executable dispatch thunk. The finalizer resolves and validates
that pointer and rejects metadata that claims more than the image implements.

`mrml-sign finalize-vbs-enclave` is the original post-link validation gate. It
accepts only unsigned PE32+ x86_64 images with one canonical 256-byte load
configuration, zero reserved fields, a strict non-debug primary enclave,
2-MiB-multiple private size, nonzero thread count, and a bounded sorted CFG
table whose targets reside in executable sections. Only after those checks does
it set `IMAGE_DLLCHARACTERISTICS_FORCE_INTEGRITY` and
`IMAGE_DLLCHARACTERISTICS_GUARD_CF` and recompute the PE checksum. The produced
image passes the independent MRML Authenticode digest parser. A Windows-accepted
certificate signature is still required before the real load test.

`packages/experiments/mrml-vbs-host` is an original `no_std` lifecycle probe using only
MRML crates and `core`. It reports capability/ABI discovery, creates the
non-debug enclave, passes a bounded canonical UTF-16 image path, loads the
image, initializes one enclave thread, and then invokes the authority with
`CallEnclave`. Before reservation it reads at most 16 MiB and resolves the exact
`mrml_launch_authority` export using MRML's allocation-free PE parser. That
parser caps section/export counts, checks every RVA translation, rejects
forwarders and unterminated names, and accepts only an RVA inside an executable
section. The opaque token also retains and rechecks the exact bounded export
name. After initialization the lifecycle resolves that name with
`GetProcAddress` on the enclave handle, rejects a null result or an address
outside the checked reservation, and does not assume the primary DLL was loaded
at the reservation base. It keeps the call context mutably borrowed for the
synchronous wait-for-thread call, and returns either the enclave status or the
exact Windows failure. The probe generates a fresh OS-cryptographic nonce,
submits the canonical request, requires zero authority status, and verifies the
returned receipt before reporting its claims. On the current Windows host, the
finalized DLL was Authenticode-signed with a newly generated RSA-3072/SHA-256
development certificate carrying Code Signing, VBS Enclave, and Author EKUs.
The probe reached `LoadEnclaveImageW` and returned Windows error 577
(`ERROR_INVALID_IMAGE_HASH`) because that self-signed root is deliberately not
trusted and Windows test-signing was not enabled. This is evidence that create
and load dispatch execute. The current probe also proves its real built-image
export is structurally accepted before reaching that loader gate, but error 577
prevents initialization and therefore prevents a real `CallEnclave` execution.
It is not evidence that Windows has accepted or run the image.
On 2026-08-23 the same source was rebuilt with the custom target, passed
`mrml-sign finalize-vbs-enclave`, and was signed by Microsoft SignTool with
`/ph /fd SHA256` using a disposable RSA-3072 development certificate carrying
the documented Code Signing, VBS Enclave, and Author EKUs. The host again
reported VBS support and reserved the non-debug 2 MiB enclave, but
`LoadEnclaveImageW` returned error 193 (`ERROR_BAD_EXE_FORMAT`). This reaches a
later PE/load-configuration gate than the earlier error 577; it still does not
prove Windows initialization, VTL1 entry, receipt verification, attestation
verification, or secret consumption. The temporary certificate and private key
were removed after the test.
Later on 2026-08-23, Windows 11 build 26200.9168 in test-signing mode accepted a
fresh page-hash-signed, CFG-instrumented image and initialized separate
non-debug authority and verifier enclaves with one thread each. A 2 MiB
reservation initialized with error 8; matching the image and reservation at
the bounded 256 MiB size succeeded. An initial call using reservation-base plus
export RVA failed with error 127. Resolving the independently validated exact
export through `GetProcAddress`, as required by Microsoft's host sample, showed
that Windows had placed the primary module near the end of the reservation.
With the returned address bounded to that reservation, the import-free probe
entered VTL1 and returned its exact context-bound value. The next protected
operation failed closed with enclave status 6 because
`EnclaveUsesAttestedKeys` reported false on this test-mode system. This is
controlled evidence of signed non-debug image load, initialization, and VTL1
execution. It is not evidence of safe TPM-provisioned attested keys,
authenticated receipts, verified local attestation, secret release, remote
attestation, or resistance to VTL1/Hyper-V compromise.
Enabling global test-signing or trusting a development code-signing root weakens
the host policy and is never performed automatically by the build.

The untrusted broker protocol uses fixed-size canonical launch requests and
authority receipts. A request binds a fresh nonce and sequence to the exact
SHA3-512 image and policy measurements. The authority receipt binds that full
request digest to the protection report with a domain-separated HMAC-SHA-256;
reserved bytes, altered fields, wrong requests, and malformed reports fail
closed. The symmetric receipt key belongs only in the VBS authority and a
trusted verifier. Copying it into an ordinary WHP guest would let a compromised
host forge receipts. A receipt authenticates the authority's decision, not the
subsequent execution or GPU result, and policy admission still independently
rejects replay, debug mode, rollback, and insufficient claims.

The Windows lifecycle probe exercises that actual broker boundary. It submits
the canonical request under a generation-tagged ticket, gives the authority only
the broker-owned request bytes, publishes the returned opaque receipt, and
atomically takes that exact request/receipt pair for delivery to the independent
verifier enclave. Taking or cancelling an exchange wipes both fixed-size slot
buffers before reuse, and stale generations cannot address a recycled slot.
This prevents accidental cross-wiring in honest VTL0 code; it does not make the
broker trusted. The broker contains no MAC or sealing key and performs no
authentication. A compromised host can observe, mutate, suppress, reorder, or
replay its memory, while VTL1's exact binding, receipt, policy, sequence, and
attestation checks remain the fail-closed security boundary. Volatile slot
wiping is residual-state hygiene only, not confidentiality from VTL0.

The control plane also defines an exact 64-byte VBS attestation statement: the
verifier contributes a fresh 32-byte nonce and VTL1 appends a domain-separated
SHA3-256 commitment to the canonical approved policy and the complete canonical
launch request. The commitment therefore covers the sequence, nonce, image,
and policy measurement. `IssueAttestationReport` asks Windows to embed that
statement in a VBS-signed local report, writes it into a fixed 64 KiB bounded
envelope, and returns an explicit length. The host transports but does not
validate this evidence. Microsoft's verifier works only inside another VBS
enclave on the same machine, so this is a foundation for an enclave-to-enclave
authority channel, not remote attestation and not protection from compromised
Hyper-V or the secure kernel.

The kernel protocol now has a strict allocation-free parser for the documented
VBS report package. It validates package arithmetic, versions, reserved fields,
signature presence, the exact 224-byte single-primary-module signed statement,
the 64-byte nonce/request/policy binding, and the complete 152-byte primary
identity.
Verifier-owned policy can then require exact owner, code, author, family, and
image identifiers plus minimum enclave, secure-kernel, and platform security
versions; every debug flag is rejected. The result type is deliberately named
`UnverifiedVbsAttestationReport`: these comparisons become meaningful only after
another VBS enclave successfully calls `EnclaveVerifyAttestationReport` over the
same original bytes.

The host probe now loads two independent VBS reservations from the same signed
image. The verifier instance checks the compiled image/policy request, generates
a nonzero 256-bit challenge with enclave-safe `BCryptGenRandom`, constructs and
retains the complete expected binding inside VTL1, and rejects a second challenge
while one is pending. VTL0 relays that nonce to the
authority instance and returns the resulting bounded report. Verification first
copies the entire envelope into VTL1, consumes and erases that binding, calls
`EnclaveVerifyAttestationReport`, parses the exact verified bytes, and requires
the signed owner, unique-code, author, family, and image identities to equal the
verifier instance's own `EnclaveGetEnclaveInformation` identity. Enclave,
secure-kernel, and platform security versions may not be lower than the
verifier's current values. The returned binding is diagnostic only: compromised
VTL0 can suppress or forge presentation of success, so secrets must be released
inside VTL1 or over a separately authenticated enclave channel. The installed
development certificate still blocks real execution at Windows error 577 on the
current machine, so this two-enclave call sequence is build- and source-tested,
not yet hardware-run evidence.

The enclave now implements that authority entry rather than only a boundary
probe. It copies the fixed-size call context and request into strict enclave
memory with `EnclaveCopyIntoEnclave`, never directly dereferences a host
pointer, requires the compiled workload measurement and recomputes the canonical
compiled-policy commitment, constructs a non-debug VBS report, seals the
canonical receipt, and copies it out with
`EnclaveCopyOutOfEnclave`. Pure tests cover a correctly bound receipt, malformed
requests, unapproved measurements, and unsafe key-platform rejection. Before
issuing any receipt, the entry calls `EnclaveUsesAttestedKeys` and fails closed
unless Windows reports that boot, kernel, and hypervisor debugging have never
been enabled and that the TPM safely provisioned master and encryption keys.
That query requires Windows 11 24H2 or newer and establishes only platform-key
safety, not remote attestation. Production builds contain no constant MAC key;
the fixed key exists only in pure tests. Receipt and workload keys are generated,
sealed, unsealed, and consumed inside VTL1 as described below, so VBS may claim
the narrowly implemented `SEALED_KEYS` capability. Real-machine evidence remains
blocked only on Windows accepting the signed image; `ATTESTATION` is still not
claimed because the Windows report is local rather than remote evidence.

Boundary-copy APIs alone are not treated as pointer provenance. On every entry,
VTL1 calls `EnclaveGetEnclaveInformation`, validates the returned VBS type,
reserved field, base, size, and non-overflowing end, then proves the context and
its complete input/output ranges lie wholly outside that enclave interval before
any copy. Zero-length, overlapping, boundary-straddling, and wrapping ranges fail
closed with a distinct status. This follows Microsoft's hostile-VTL0 guidance
and remains enforced even though the image also requests strict-memory policy.

The host and enclave no longer duplicate a native pointer structure. The
kernel protocol crate owns one 48-byte, pointer-free x86_64 descriptor with an
eight-byte magic, version, explicit operation, zero-reserved bytes, and four
little-endian 64-bit address/length fields. Construction rejects null or empty
buffers, decoding rejects unknown operations and noncanonical reserved bytes,
the Windows call wrapper accepts only that exact buffer size, and the enclave
converts addresses to its native width only after canonical decoding. Receipt
Every operation requires its exact fixed input and output sizes. Key generation
accepts an approved launch request and returns only a canonical 4 KiB-bounded
opaque envelope; loading accepts exactly that envelope; receipt verification
accepts one canonical request concatenated with one exact receipt.

Windows exposes `EnclaveSealData`, `EnclaveUnsealData`, and
`EnclaveUsesAttestedKeys` in Vertdll, so protected persistence is feasible on
supported Windows 11 systems. The safe-attested-key query gates every protected
operation. The authority generates a nonzero 256-bit key with
`BCryptGenRandom`, seals it with `SEAL_EXACT_CODE` and runtime policy zero, and
installs it only after the complete canonical blob reaches VTL0. The verifier
copies that opaque blob into VTL1, rejects malformed padding, unseals exactly 32
bytes, rejects stale-key flags, and installs the key once. It then authenticates
and policy-admits the exact request/receipt pair inside VTL1. Plaintext key bytes
are never copied to VTL0; host-visible confirmation markers are diagnostic only.
The current probe creates a fresh session key rather than persistent storage,
and a fixed key remains only under `cfg(test)`. This protects the local receipt
key from VTL0 but is not remote attestation and does not protect against
compromised Hyper-V or the secure kernel. `ATTESTATION` remains absent because
local VBS reports are not remote evidence.

The workload-secret path now completes that local lifecycle. The authority
generates a second random 256-bit secret and returns only its exact-code sealed
envelope. The verifier records receipt authentication and Windows-verified code
attestation as separate one-use gates, each bound to the exact canonical launch
request. `ConsumeWorkloadSecret` copies a fixed request/envelope/challenge tuple
into VTL1, rejects a zero challenge, unseals exactly 32 non-stale bytes, requires
both gates to match, consumes them atomically, and computes a domain-separated
HMAC entirely in enclave memory. It then volatile-erases the plaintext and
copies only the 32-byte result to VTL0. Missing, duplicate, mismatched, or replayed
gates fail closed. Consequently the VBS backend may now claim `SEALED_KEYS` for
this implemented consumer. This is a narrowly scoped capability claim: it does
not imply that arbitrary WHP guest memory is sealed or confidential.

WHP now provides a fixed-capacity untrusted launch broker for that protocol.
Generational tickets prevent a canceled or completed request from acquiring a
reused slot; request and receipt transitions are one-way; messages must have
the exact canonical lengths; and capacity exhaustion fails closed without
allocation. The broker stores only opaque bytes and never receives the receipt
MAC key. Consequently these checks provide memory safety and deterministic
transport behavior, while authenticity still comes exclusively from endpoint
verification of the authority receipt.

The bare-metal x86_64 path now has an allocation-free VMX-root contract and an
emulated instruction backend. Consumer hardware is rejected unless VMX regions
fit one write-back 4 KiB page and EPT, unrestricted guests, and single-context
INVEPT are all available. VMX capability masks force architecturally required
control bits and clear forbidden bits. Four-level EPT pointers are constructed
canonically from aligned physical roots. The controller enforces
`Disabled -> Root -> VMCS-clear -> VMCS-loaded -> Guest-running`, performs
INVEPT before first entry, distinguishes launch from resume, records exits
before inspecting guest state, and never advances state after a failed
instruction. This ordering layer is tested with an emulated backend.

Protection reports can now be issued directly from the monitor's live domain
table rather than assembled from caller-selected claims. Issuance is allowed
only while the exact generational domain is measured or runnable, binds the
sealed measurement, non-debug state, configured nonzero monitor security
version, fresh caller nonce, and a monitor-global checked monotonic sequence.
A domain with at least one private granule and no shared granules receives
`DOMAIN_ISOLATION | MEASURED`; a domain with shared ownership is explicitly
downgraded to `MEASURED`. Building, stopped, destroyed, and stale-generation
domains cannot issue evidence, and a malformed nonce does not consume the
sequence. This report is still local evidence until independently
authenticated; the ownership state machine alone is not remote attestation.

The monitor can now authenticate that live decision through the same canonical
receipt protocol used by the VBS control plane. A nonzero 256-bit authority key
is derived internally exactly once before any domain or granule exists. The
bootstrap accepts only an opaque `ValidatedBoot` produced by full signed-chain
validation; claim-only boot validation is rejected. It domain-separates
SHA3-256 over loader entropy, the verified kernel measurement and version, and
fresh post-kernel-entry CPU `RDSEED` output. RDSEED support is checked with
CPUID and each 64-bit word receives 32 bounded retries; absence, exhaustion, or
an all-zero result fails closed. No production API accepts or returns the key,
and late or repeated bootstrap is rejected. `issue_authenticated_receipt` requires
the request's sequence to equal the next monitor-owned sequence and its image
and policy commitments to equal the live sealed domain and verifier-selected
policy. It builds the report without mutating state, applies the complete policy
admission, seals the exact request/report pair, and commits the global sequence
only after all steps succeed. Stale domains, policy substitution, request drift,
and insufficient live claims therefore cannot produce receipts or desynchronize
a subsequent valid request. A verified receipt yields the opaque authenticated
`BareMetalVmxRoot` mode. The key is launch-local and is neither TPM sealing,
persistent identity, nor remote attestation; a persistent verifier channel
would require a separate protected provisioning design.

The allowable claim sets now match implemented mechanisms. VBS may claim
`SEALED_KEYS` because its exact-code sealed, dual-gated consumer is implemented.
The bare-metal monitor may claim `SEALED_KEYS` only after a measured domain owns
private granules, owns no shared granules, and has generated a launch-local
workload key internally. Fresh `RDSEED` entropy is domain-separated with the
verified-boot-bound authority key, complete generational domain identity, and
sealed measurement. The key is never returned. Its only consumer authenticates
and policy-admits the exact request/receipt pair, requires non-debug measured
sealed-key admission in `BareMetalVmxRoot` mode, revalidates the current live
claim set, consumes each receipt sequence once, and returns only a
request-, policy-, and challenge-bound HMAC. Sharing a granule after receipt
issuance therefore prevents release without consuming replay state. Key bytes
are volatile-erased when the domain is destroyed. This is launch-local VMX-root
custody, not TPM sealing, persistent identity, remote attestation, or physical
hardware verification. Bare-metal also
does not claim `PRIVATE_MEMORY`, `HOST_VMM_ISOLATION`, `TRUSTED_IO`, or
`ATTESTED` merely because VMX or a domain record exists. These claims require
hardware page-transition/IOMMU enforcement and an authenticated evidence path,
not a configuration flag.

Granule ownership no longer changes through a one-step policy call. Every
delegate, private assignment, share, make-private, reclaim, and scrub-complete
operation first creates a generational single-use transition ticket containing
the exact granule, physical address, operation, and sequence. The EPT/IOMMU
adapter performs the corresponding hardware change and then completes that
ticket with `Applied`, `Rejected`, or `FailStop`. A clean rejection leaves
policy state unchanged; rejected tickets are consumed and retries receive a
fresh sequence. `FailStop` is required when a page-table update occurred but a
CPU or IOMMU invalidation failed, or whenever stale permissive translations or
partially granted access may remain. It permanently quarantines the granule as
`HardwareUncertain` instead of falsely claiming rollback.
The quarantine is conservatively associated with the transition's target
domain (or its source when no target exists), so a partially completed grant
cannot leave the target domain operational.
Forged, replayed, mismatched, or already completed tickets cannot mutate state.
Production callers cannot submit a bare success Boolean: completion is routed
through an explicitly unsafe `GranuleHardware` implementation whose contract
requires revoke-before-grant ordering, completed CPU/IOMMU translation
invalidation, complete overwrite before scrub completion, and rollback or a
more restrictive state on failure. Tickets include exact source and target
domain ownership as well as the physical address. The monitor validates the
entire opaque ticket before dispatch, so forged or stale work never reaches the
adapter, and revalidates it before policy commit.
Only one transition may be pending per granule, and a pending transition that
mentions a domain blocks that domain's seal/start/stop/destroy and evidence
operations. This prevents domain lifecycle progress or protection reports
while hardware and policy ownership may disagree. An uncertain granule likewise
blocks its owner's lifecycle and evidence operations and cannot be reclaimed,
reassigned, or reused by normal transitions; recovery requires a platform reset
or a future independently verified hardware-recovery path. The ticket protocol
does not prove that an adapter truthfully reported success. The x86_64 monitor
now has a live-leaf EPT transition adapter that denies and invalidates DMA first,
revokes old EPT access before granting new access, invalidates every affected
EPT context, and scrubs a complete 4 KiB granule before restoring host access.
An invalidation failure after a leaf write returns `FailStop`. Its platform
IOMMU implementation remains inside the trusted bare-metal monitor boundary.
The supplied scrubber binds a unique pinned physical-page mapping and performs
volatile byte zeroization across the entire page before an ordering fence. The
consumer Intel path now includes a register-based VT-d primitive for a bound
4 KiB second-level leaf. It verifies the leaf identity, checks that context and
IOTLB command registers are idle before mutation, clears DMA read/write access,
then performs bounded global context-cache and IOTLB invalidations with read and
write draining requested. Invalid completion or timeout after the leaf write is
`FailStop`; a pre-write busy condition is a clean rejection. The native MMIO
constructor requires a unique uncached mapping, and the binding contract
requires coverage of every remapping unit capable of reaching the granule.
Firmware discovery now copies the unique DMAR through the same independently
checksummed RSDP/XSDT walk used for MADT, with a bounded destination and a
second checksum after copying. A no-allocation parser validates the declared
host address width, every structure boundary, aligned nonzero DRHD register
base, segment, include-all uniqueness, device-scope type and reserved bytes,
and every PCI bridge-path device/function pair. Duplicate register blocks,
duplicate PCI routes, multiple include-all units for one segment, missing DRHD
units, excessive path depth, and capacity exhaustion are rejected. Unknown
non-DRHD structures remain skipped only after their length is validated.
The runtime topology layer also has a narrow PCI configuration-space interface
and a native, bounds-checked ECAM segment reader. Scope resolution verifies
that every intermediate function exists, is a type-one PCI bridge, reports the
expected primary bus, and has a nonzero ordered secondary/subordinate range
before following the next path element. A requester selects an exact explicit
scope first and may use only the unique include-all DRHD for its segment as a
fallback. Missing devices, configuration read failures, malformed bridges,
uncovered requesters, and multiple matches fail closed. Because PCI topology
can change through hot-plug, launch-time resolution must be serialized and
revalidated when ownership changes. MCFG is now copied through the same unique,
checksummed ACPI root walk and parsed into a fixed-capacity allocation table.
The parser rejects reserved bits, malformed bus ranges, duplicate or overlapping
segment coverage, overlapping physical windows, unaligned/overflowing physical
ranges, missing allocations, and capacity exhaustion. ECAM arithmetic treats
the firmware base as bus-zero-relative, validates the full end-bus physical
extent, and maps only the declared start-through-end range. A fixed-capacity
dispatcher rejects overlapping windows and routes each configuration read to
exactly one segment window. ACPI `_CBA` hot-plug discovery, multi-unit VT-d MMIO
assembly, and real-hardware validation remain required before stronger claims
are enabled.

VT-d invalidation setup now derives the primary fault-record offset and count
from each unit's capability register rather than assuming chipset addresses.
Before any DMA leaf write, the adapter requires a clear fault status as well as
idle invalidation commands. After context-cache and IOTLB completion it checks
fault status again; a fault appearing after the leaf write becomes `FailStop`,
while a pre-existing fault is rejected before mutation. Fault snapshots read
the hardware-selected record only within the reported count, require the
hardware validity bit, read details before re-reading the high word for
stability, and expose requester ID, reason, direction, and page address.
Acknowledgement is explicit, rejects a changed record, clears the record's
write-one-to-clear validity bit first, and then acknowledges only status bits
present in the captured snapshot. Fault evidence must be logged by monitor
policy before acknowledgement; merely clearing it does not authorize resume.

One granule can be reachable through more than one remapping unit, so the DMA
adapter now provides a fixed-capacity all-unit transaction. Construction is an
unsafe topology boundary requiring distinct units and complete checked DMAR/PCI
coverage. Execution first preflights the physical identity, health, and idle
commands of every unit without changing a leaf. Only after every preflight
succeeds does it revoke DMA permissions in every leaf. It then attempts the
context-cache and IOTLB flush on every unit even if an earlier unit fails, and
aggregates any failure into `FailStop`. Thus a clean preflight rejection leaves
all leaves untouched, while partial post-revocation completion never masquerades
as rollback. Tests cover both cases and verify that later-unit flushes are still
attempted after an earlier timeout. The coherent single-unit builder binds the
routed requester, verified MMIO identity, active hardware root, exact page-table
leaf, and invalidator into one adapter. A fixed-size all-at-once builder now
assembles those adapters into the transaction, rejects an empty set or duplicate
DRHD base before binding, and identifies the exact unit whose binding failed.
It consumes one authorized route, coupled verified unit, and exclusive table
view per unit. If any binding fails, construction returns no usable set and no
leaf has been mutated. Tests prove both-unit revocation and rejection of empty,
duplicate, and wrong-domain bundles without partial leaf mutation.
Checked topology can now issue the route component as an opaque complete-route
proof. Issuance requires exactly as many requesters as parsed DRHD units, verifies
that every requester currently exists in PCI configuration space, resolves each
through checked DMAR and live bridge state, rejects duplicate unit coverage, and
proves every discovered DRHD appears exactly once. The all-unit builder accepts
this proof instead of an unchecked route array. This does not prove topology
cannot change afterward; hot-plug and ownership changes invalidate the proof and
require serialized reconstruction. Hardware-domain collection no longer relies
on a parallel raw-ID array. A fixed-capacity authority registers each `(monitor
domain generation, DRHD base)` against its nonzero hardware-domain ID.
Registration rejects duplicate owner/unit bindings and reuse of one hardware ID
by different monitor domains in the same unit. Authorization revalidates the
live `DomainId`, consumes the complete-route proof, and emits an opaque ordered
bundle containing every route and its registered hardware-domain ID. Missing
unit bindings and stale domain generations fail closed. Registry removal and
dynamic hardware-domain reuse are not implemented; the current authority is
boot/static and exhausts capacity rather than recycling an ID whose hardware
invalidation is unproven. A no-allocation preparation step now consumes the
ordered authorization by reference and asks each one-shot unit to sample its
active root into an exclusive direct table view. It builds the fixed-size array
with explicitly tracked initialization; if any unit fails, every prepared view
is destroyed and no partial array is returned. Unit substitution, inactive
roots, and zero-capacity arrays fail closed. This makes the boot API usable
without callers manually copying hidden RTADDR values. Supplying the underlying
identity-mapped, pinned, exclusive table ownership remains an unsafe platform
integration responsibility, not an inferred protection claim.

Boot binding now starts from a fixed-capacity platform-MMIO manifest derived
only from the validated DMAR and MCFG copies. It requests one bootstrap page
for each unique DRHD and the exact start-through-end physical span of every
ECAM allocation. Cross-purpose physical overlap, arithmetic overflow, capacity
exhaustion, or any range not wholly contained in a normalized firmware
`Mmio` region aborts construction. Before native code receives a mapped pointer,
the active page tables are checked page by page against the manifest: physical
identity must be exact, and R/W, U/S, and NX are accumulated across all four
levels so the effective mapping must be supervisor-only, writable, and
non-executable under the dedicated MMIO permission class. That permission also
sets PWT and PCD on every 4 KiB leaf; active verification rejects an absent or
partial device selector. Generic permission protection cannot cross either the
user/supervisor or normal/device class. A returned mapping token therefore
proves the current page-table identity, effective access, and PAT-index-3
selector, not merely an intended address-space policy record. Verified tokens
are deliberately non-copyable. A native VT-d constructor consumes one token
into a coupled unit containing the sole volatile register adapter and its
capability-derived invalidator, so later
binding cannot substitute an independently constructed invalidator or authorize
two adapters from the same proof. Construction rejects a capability-reported
register extent larger than the verified mapping before returning the unit. The
remaining unsafe boundary must establish that active IA32_PAT index 3 is UC and
that the mapping is uniquely owned and stable; PTE selector verification does
not prove the PAT-MSR value or the absence of aliases. The initial DRHD page is
deliberately described as bootstrap-only. CAP and ECAP are decoded into one
shared `VtdRegisterLayout` used by both mapping and invalidation code, covering
the fixed status registers, the reported IOTLB register, and the complete
reported primary fault array.
Zero/invalid offsets and arithmetic failures are rejected; the architectural
field maxima produce a bounded five-page extent. Extending a bootstrap
requirement preserves its exact DRHD base and identity, requires the complete
derived span to remain inside firmware MMIO, and returns an unverified mapping
requirement rather than reusing the bootstrap token. The extended mapping must
pass the same page-by-page active-PTE verification before any out-of-page
register is accessed. Tests cover hostile maximum fields and a fault array that
crosses the bootstrap-page boundary.

Live VT-d leaf binding no longer accepts an arbitrary leaf pointer. Checked
DMAR plus live PCI resolution produces a requester route containing the exact
BDF and DRHD register base. After boot code reads legacy-mode RTADDR from that
verified unit, an exclusive table walker validates the 128-bit root entry for
the requester's bus and the 128-bit context entry for its device/function.
Reserved fields, missing entries, disabled fault reporting, pass-through or
Device-TLB translation, unsupported address widths, zero or unexpected domain
IDs, and invalid table pointers are rejected. MRML currently requires AW
`010b`, a four-level second-stage walk. Every intermediate entry is bounded and
validated; large-page termination is rejected so a 4 KiB ownership transition
cannot silently affect neighboring memory. The final leaf must map the exact
physical granule rather than an alias before the walker returns a lifetime-bound
unique reference. A direct-map implementation exists behind an unsafe contract
requiring pinned, supervisor-only, exclusively owned tables and serialized
writers. Its constructor now binds the view immutably to one DRHD base and one
root sampled after that unit reported the pointer active. Before walking, the
coherent binder requires the view's DRHD to equal the topology-issued route and
its root to equal the current RTADDR read through the one-shot verified MMIO
unit. Reordered table views and stale-root views therefore fail before any table
read or leaf mutation. Tests reject both substitutions in addition to forged
domains, pass-through contexts, aliases, and huge pages, and prove mutation
reaches only the resolved leaf. The provenance remains an unsafe assertion by
the direct-map constructor; physical boot integration must establish exclusive
ownership and serialize root changes.
Preparation does not freeze hardware RTADDR. Binding therefore samples the
active root again and compares it with the prepared view immediately before the
walk. A root change between phases is rejected as table substitution before any
physical table read. Tests cover ordered two-unit preparation, reordered MMIO
units, partial preparation failure, and this prepare/bind root race.
The coherent builder rejects a verified MMIO token whose physical DRHD base or
segment differs from the checked requester route, and rejects a mapping shorter
than the capability-derived register extent. It reads GSTS and proceeds only
when translation is enabled and hardware reports completion of the active root
pointer, then accepts only a nonzero, aligned legacy-mode RTADDR. That root is
walked for the routed requester and coupled to the invalidator that controls the
same unit. Tests exercise successful revoke-and-flush, MMIO-unit substitution,
and an inactive root pointer. The unsafe boundary still requires boot code to
preserve unique mapping and table ownership. Execution on physical hardware
remains unverified.
Register fields and ordering follow the Intel VT-d Architecture Specification
rather than third-party implementation code.

The EPT transition boundary also requires its DMA adapter to identify the same
generation-checked monitor domain as the transition and EPT binding before any
DMA mutation. The authorized VT-d builder returns a domain-bound wrapper that
carries this identity across the IOMMU/EPT seam. A host-only or mismatched DMA
adapter is rejected before its revoke method is called for a domain transition.
Tests prove a mismatch causes no additional DMA operation.

The x86_64 kernel also contains the direct instruction adapter for `VMXON`,
`VMXOFF`, `VMCLEAR`, `VMPTRLD`, `VMLAUNCH`, `VMRESUME`, and single-context
`INVEPT`. It can only be constructed through an unsafe CPL0 boundary whose
contract requires locked feature-control policy, `CR4.VMXE`, valid revision
headers, and complete VMCS host state. VMfail flags become explicit errors and
physical-address operands remain live memory operands for the instructions.
The adapter now also provides typed `VMREAD` and `VMWRITE` operations and checks
VMfail after `VMXOFF`. A bounded first-exit decoder accepts only a non-entry-
failure EPT violation with a hardware-valid guest-physical address inside the
exact expected 4 KiB monitor-private page. VMREAD failure, malformed access
qualification, another exit reason, or an adjacent-page access leaves the
controller outside `GuestRunning` and cannot resume uncertain state.
Minimal launch programming is now one fixed 84-field VMCS specification. It
preflights field widths, exact EPT identity, all five hardware control masks,
long-mode entry/exit state, segment selectors and access rights, canonical
entry/stack pointers, and the invalid guest-link sentinel before the first
write. Callers cannot append optional fields or omit a required field. A
partial `VMWRITE` poisons the controller; guest launch and resume remain denied
while fail-closed `VMXOFF` teardown is still available.
Native launch and resume no longer assume that a successful VM-entry
instruction returns normally. Dedicated SysV assembly saves every callee-saved
register, writes the live host RSP and a private return label into the VMCS,
and distinguishes a VMfail return from hardware control transfer back through
the configured host RIP. Rust receives an explicit running-versus-exit outcome;
only the latter creates the one-use `VmExitPending` state accepted by the exit
decoder. The canonical guest state is now a fully specified unrestricted
real-mode context, including all segment selectors, limits, bases, access
rights, and descriptor-table state, so the isolation probe needs no guest page
tables before touching the denied GPA. Guest debug, PAT, performance,
interruptibility, activity, and SYSENTER state and host PAT,
performance, FS/GS bases, and SYSENTER state are also written explicitly;
launch no longer relies on unspecified post-`VMCLEAR` contents. Host-loaded
addresses must be canonical, host CS/TR must be nonzero ring-zero selectors,
and every PAT entry is validated before the first `VMWRITE`. SMM-only SMBASE is
deliberately omitted because it is not an ordinary guest-state component and
may not exist in a non-SMM VMCS.
The opt-in `vmx-root-probe` kernel image now provides eight statically owned,
page-aligned pages and resolves their exact supervisor-writable physical
backing through the active CR3. It rejects aliases and misalignment, builds a
four-level EPT with one read/execute guest-code page, and deliberately leaves
guest GPA `0x2000` absent while retaining a separate monitor-only backing page.
After deriving capabilities and controls from the architectural MSRs, it
validates the locked feature-control and fixed-bit requirements before setting
`CR4.VMXE`. The four-byte real-mode guest reads `0x2000`; the probe accepts only
the exact read-only EPT violation, requires successful `VMXOFF`, restores the
original CR4, and emits a bounded debug-port stage trace. Any uncertain teardown
state enters an interrupt-disabled halt loop instead of restoring or resuming.

On 2026-08-23 the signed Windows WHP runner admitted the exact version-2 probe
image and observed entry byte `d0`, followed by failure byte `e0`: WHP cleared
CPUID.1 ECX VMX for this guest, so the kernel rejected the platform before any
VMX MSR read or privileged VMX operation. QEMU 11.1 TCG also explicitly reported
`TCG doesn't support requested feature: CPUID[eax=01h].ECX.vmx [bit 5]` for
`-machine q35,accel=tcg -cpu max,+vmx`. A paused QEMU WHPX configuration still
accepts the requested CPU option, but that does not override the WHP guest's
missing VMX capability. These are controlled negative probes, not evidence of
`VMXON`, guest launch, bare-metal execution, physical hardware, or remote
attestation. The image and state machine are now wired for a platform that
actually exposes nested VMX or for a physical boot. The Windows paths did not
provide a successful VMX execution.
The final signed version-12 image repeated the same Windows result: the runner
expected `d1` after `d0` and instead received `e0`, exiting nonzero.

The same version-2 kernel and an independently signed version-1 service were
then booted through the repository-owned UEFI loader under QEMU 11.1 TCG with
EDK2, `virtio-rng-pci`, a FAT boot directory, and the debug console at port
`0xe9`. The exact trace was
`a1 a2 a3 a4 a5 a6 a7 a8 b1 b2 b3 d0 e0`: the loader authenticated and
materialized both artifacts, constructed the bounded handoff and protected page
tables, crossed `ExitBootServices`, transferred through the kernel trampoline,
and reached the VMX probe before the same CPUID rejection. The command used
`-machine q35,accel=tcg -m 512M -cpu max`, read-only
`edk2-x86_64-code.fd`, a disposable writable vars image, the FAT directory as a
raw drive, `virtio-rng-pci`, and `isa-debugcon.iobase=0xe9`. A repeat with
`-machine q35,accel=whpx -cpu max,+vmx` produced only QEMU's
`Ignoring request for interrupt vector 0` warning and no loader trace before it
was terminated after 30 seconds. Neither controlled result is positive VMX or
physical-hardware evidence.

On the same date, Arch Linux under WSL2 kernel
`6.18.33.2-microsoft-standard-WSL2` exposed `vmx`, writable `/dev/kvm`, loaded
`kvm_intel`, and reported `nested=Y`, `ept=Y`, and
`unrestricted_guest=Y`. QEMU 11.1 and `edk2-ovmf` were installed from the Arch
repositories. The repository then built and Lamport-signed exact kernel
version 12 and service version 1 artifacts, embedded their public-key digests
and minimum versions in a freshly built loader, and booted them with:

```text
qemu-system-x86_64 -machine q35,accel=kvm -m 512M -cpu host \
  -drive if=pflash,format=raw,readonly=on,file=OVMF_CODE.4m.fd \
  -drive if=pflash,format=raw,file=DISPOSABLE_OVMF_VARS.4m.fd \
  -drive format=raw,file=fat:rw:SIGNED_BOOT_DIRECTORY \
  -device virtio-rng-pci -debugcon file:TRACE \
  -global isa-debugcon.iobase=0xe9 -display none -serial none \
  -monitor none -no-reboot
```

Two independent boots of the exact version-12 files produced
`a1 a2 a3 a4 a5 a6 a7 a8 b1 b2 b3 d0 d1 d2 d3 d4 df`. The loader prefix
proves signed kernel/service admission, materialization, handoff construction,
`ExitBootServices`, protected page-table installation, and kernel transfer.
For the VMX suffix, `d0` is probe entry, `d1` follows successful `VMXON`, `d2`
follows `VMCLEAR`, `VMPTRLD`, `INVEPT`, and all 84 `VMWRITE`s, `d3` is reached
only through the VM-exit host RIP after `VMLAUNCH`, `d4` follows strict typed
validation, and `df` follows successful `VMXOFF` and restoration of the original
CR4. An instrumented preceding build recorded raw exit reason `0x30`, low
qualification `0x81` (read plus hardware-valid GPA), and GPA page `0x2000`
before the same typed validator accepted it.

Live execution exposed and corrected four defects that emulated instruction
tests could not prove: VMX control MSR low halves are required-one masks rather
than allowed-zero masks; LLVM's Intel-syntax `VMWRITE`/`VMREAD` operand order
had been reversed, including the host-return trampoline; SMM-only SMBASE is not
a portable ordinary VMCS component; and unrestricted guest mode relaxes only
CR0.PE/PG, so remaining guest CR0/CR4 fixed-one bits must still be derived from
the hardware MSRs. The controller now also retains only a bounded failed
`VMWRITE` index while poisoned and clears it after successful teardown. A raw
one-use exit snapshot is explicitly diagnostic input, not authenticated
protection evidence.

This is controlled nested-KVM execution under a Windows/Hyper-V-owned WSL2
host. It proves that the native MRML instruction/state path executes through
the requested VMX/EPT lifecycle in that environment. It is not a security
boundary against the host, physical bare-metal validation, TPM/IOMMU evidence,
remote attestation, or a production-readiness claim.

VMX capability decisions are derived from raw `IA32_VMX_BASIC`, secondary
processor-control, and EPT/VPID capability MSRs rather than host-supplied
booleans. Entry prerequisites require a locked `IA32_FEATURE_CONTROL` that
permits VMX outside SMX, `CR4.VMXE`, and exact compliance with both CR0 and CR4
fixed-bit MSRs. Missing lock state, write-back VMX memory, EPT, unrestricted
guest mode, or the required INVEPT form fails closed before `VMXON`.

The privileged kernel will contain only scheduling, address-space and interrupt
mechanisms, capability enforcement, IPC, and the minimum early console/timer
code needed to recover. Filesystems, networking, storage, GPU, CUDA mediation,
model loading, and tools remain isolated services. Each tool runs in a separate
VM by default. Messages carry attenuated, generational capabilities; names,
paths, process IDs, and VM IDs never confer authority.

Host directories are denied by default. A launch manifest explicitly lists
canonical directories as read-only or read-write. The Hyper-V or KVM host VMM
opens each directory without following a final symlink and lends an opaque
handle to a storage service. Guests never receive a host pathname API. Writable
grants are separate capabilities and cannot be derived from read-only grants.

Device assignment is also denied by default. CUDA passthrough is an optional
device-VM capability using the host's IOMMU and hypervisor assignment facility.
The device VM owns the GPU while assigned; CUDA command parsing does not enter
the kernel. Reset, DMA isolation, firmware trust, and peer-to-peer DMA must be
validated for each GPU/platform combination. Systems lacking trustworthy IOMMU
isolation use the CPU backend.

Passthrough grants are minted from a host-enumerated IOMMU topology rather than
from caller assertions. Every function in the target group must be assigned to
the same VM and have a verified reset path. System launch policy rejects reuse
of either a device or its IOMMU group across VMs. Hyper-V and KVM backends must
populate this topology from their native isolation APIs and fail closed when
the topology is incomplete.

### MRML virtual GPU

For compatibility systems where the host retains the GPU, MRML uses an original
paravirtual interface rather than forwarding CUDA or NVIDIA driver APIs. An
isolated GPU service owns the CUDA context. In hosted KVM/WHP mode that service
is controlled by the untrusted host and provides no host-resistance; in the
production design it is a capability-confined MRML service domain. A guest receives opaque,
generational buffer IDs under a fixed byte quota and may dispatch only the 28
MRML kernels embedded in the same measured build. Requests contain checked
buffer ranges and bounded grid, block, and shared-memory values. They contain no
host pointers, arbitrary PTX, CUDA ioctls, firmware operations, or device MMIO.

The resource/session validator, authenticated queue wire format, and bounded
kernel-owned FIFO are implemented. The FIFO accepts only exact-size messages,
never overwrites unread work, erases consumed slots, and safely wraps its
indices. Copying into owned storage closes the mutation-after-admission window;
the later shared-page transport must preserve that property. Monotonic
producer/consumer ownership state now models reserve-before-write,
commit-after-write, acquire-before-read, and release-after-read. It rejects
forged counters, producer lapping, double reservation, out-of-order release,
premature slot reuse, and counter exhaustion; positions never wrap within a
session. A 128-byte, 64-byte-aligned shared index structure now places producer
and consumer counters on separate cache lines and uses release compare-exchange
for publication/consumption with acquire loads at the opposite endpoint. The
remaining platform mapping layer must prove natural alignment and coherent
shared-memory semantics before exposing it. The common layout validator sizes
each ring from the 128-byte index block plus its bounded slots, rounds only with
checked arithmetic, requires page-aligned nonzero physical bases, and rejects
overlapping command/completion ranges. Each fixed-size command is bound to a nonzero session and strict
sequence and carries an HMAC tag under a per-session key; tampering, replay,
cross-session substitution, noncanonical encoding, and zero keys are rejected
before resource state changes. HMAC-SHA-256 is conservatively treated as a
128-bit generic quantum-search target and is used only for ephemeral queue
authentication, not
artifact signing. Dispatches also have one fixed-size canonical encoding: they
contain an embedded kernel ID, bounded launch geometry, and up to 16 opaque
generational buffer ranges with explicit access modes. Unused slots must be
zero and there is no representation for PTX, pointers, driver calls, or
variable argument blobs. In-flight work uses a fixed-capacity watchdog table
with unique request IDs, kernel-minted generational dispatch IDs, explicit
cancellation, and deadline expiry. Expiry invalidates an ID before requesting
host recovery, so a late completion cannot affect a reused slot. The
completion direction has its own HMAC domain, fixed status encoding, session
and sequence state, and binds the original request ID to the exact generational
dispatch ID. It rejects tampering, replay, cross-direction substitution,
reserved bytes, unknown status, and stale handles before watchdog completion.
The executor-facing batch policy holds at most 32 ordered dispatches in fixed
storage and validates every buffer generation and range before admission. It
rejects empty/oversized batches, duplicate or zero request IDs, stale buffers,
and capacity overflow. This is the coarse submission unit intended for one
doorbell and one CUDA graph/stream sequence. Batch descriptors use a separate
generational `ControlBufferId`, never device `BufferId`. Admission caps shared
control bytes at 64 KiB and records their length and SHA3-512 digest; every use
rehashes before parsing, release erases the privileged digest, and stale IDs do
not revalidate. The authenticated resource queue has a canonical `SubmitBatch`
variant carrying only this typed ID. Canonical batch serialization is
implemented as
an exact-length `MRGB` header followed by one to 32 existing canonical dispatch
records. It contains no pointers or offsets, preserves order and independent
request IDs, rejects trailing/truncated/reserved encodings, and revalidates all
session resources while decoding. The `SubmitBatch` control path revalidates
the seal, decodes against current generations, admits watchdog identities,
validates signed schemas, executes, and publishes authenticated completions in
one fail-closed call. The resource service dequeues and erases one owned slot,
authenticates it, executes allocation/free through a narrow transactional
backend, or yields a typed `SubmitBatch` outcome. Invalid messages cannot wedge
the ring head. Successful allocation/free results use a distinct authenticated
`MRGR` response domain and monotonic sequence. The service reserves response
ring and sequence capacity before consuming the command, preventing an
unreportable resource mutation. Transactional backend failures produce a
domain-separated authenticated rejection containing only the request identity;
host error details are not exposed to the guest.
Dispatch and batch wire version 2 now add a fixed tail of at most 16 typed
32-bit scalar slots. Each slot identifies `u32`, `i32`, or raw IEEE-754 f32
bits, has zero-only reserved bytes, and unused slots must be entirely zero.
Oversized scalar lists, unknown kinds, nonzero padding, old-version records,
and alternate lengths fail closed. The original constructor still produces an
empty-scalar dispatch, so existing pointer-free operations remain explicit.
Before executor handoff, the dispatch watchdog now admits the entire batch
transactionally. Each request receives a generational `DispatchId`; capacity,
deadline, or duplicate failures cancel every ID minted by that attempt. A
service rejection can likewise cancel all still-live prepared entries, while
already completed identities remain invalid and are never revived.
The executor handoff is explicitly three-way. Accepted graphs retain watchdog
state; a definite rejection before GPU-visible action cancels the prepared
batch; an uncertain service error retains every identity for deadline expiry
and reset. Treating uncertainty as rejection would permit late GPU completions
to collide with reused state and is prohibited by the interface.
Raw prepared batches are no longer executor-visible. The executor accepts only
`ValidatedGpuBatch`, which owns the same watchdog identities plus a validated
launch proof for every entry. Only `VerifiedGpuKernelBundle::validate_batch`
can construct it, and one untrusted bundle, unsupported kernel schema, or ABI
mismatch rejects the whole conversion without GPU-visible effects.
The KVM adapter now consumes the common layout and registers two dedicated
memory slots transactionally from the caller's perspective: command memory is
guest-writable and completion memory uses KVM's read-only flag while remaining
host-service writable. A nested-KVM regression attaches both rings to the
signed high-half kernel guest, verifies directional writes, and still reaches
the authenticated framebuffer marker. The WHP adapter applies the same common
layout through independent GPA mappings; a live Windows Hyper-V regression
verifies command writes, completion write denial, and continued execution of a
verified PE guest. The kernel-owned completion ring reserves capacity for a
whole validated batch before execution, receives authenticated results only
after synchronized completion, and erases slots as the VMM consumes them.
The platform-neutral VMM bridge now performs the missing bounded copy between
those mapped slots and the kernel-owned command/completion queues through the
common `VmBackend` interface. Monotonic tickets prevent reuse before
consumption, and any uncertain backend read or write permanently poisons the
bridge until VM teardown.
KVM can now create these mappings as part of the initial signed-kernel address
space rather than attaching unreachable GPAs after CR3 setup. Command pages are
writable/NX, completion pages are read-only/NX, and both resolve to their
dedicated identity GPAs. Host completion publication uses a separate
service-memory capability that does not weaken the guest-facing write check.
WHP applies the identical initial page-table policy and exposes a bounded
four-level diagnostic walk for verification. The live Windows test checks both
leaf translations and permission bits, guest write denial, service-only
completion publication, and continued execution of the signed PE.
The guest and isolated service derive their queue session and key from the
authenticated 256-bit boot entropy with a versioned SHA3-512 domain. This makes
the identity unique to each launch without placing a reusable symmetric key in
the signed benchmark image; zero entropy is rejected.
The signed guest workload can use a typed producer that fills one fixed slot
before release-publishing its monotonic position. Counter forgery poisons that
producer. Its VMM notification contract uses port `0x4d52`, and the diagnostic
`BenchmarkAdd` command admits only bounded element/iteration counts. It cannot
name memory, kernels, symbols, modules, or launch geometry.
Platform cache-coherence validation, CUDA graph capture, IOMMU plumbing, the
platform-specific physical
device-reset callback, and end-to-end inference benchmarks remain pending.
Until those pieces exist and are audited, this is not a working
shared-CUDA Hyper-V device. It is intentionally MRML-specific instead of a
general `virtio-cuda` compatibility layer.

The KVM diagnostic path now completes the narrower one-shot benchmark loop.
The signed `gpu-benchmark` kernel derives its queue identity from authenticated
boot entropy, publishes a bounded `BenchmarkAdd`, exits through the fixed
doorbell, and refuses to report success until it authenticates a nonzero timing
completion. The Linux launcher copies and authenticates the command, runs the
original Rust-PTX add kernel through the native CUDA driver interface, checks
the full output, publishes the authenticated completion through its
service-only mapping, resumes the same vCPU, and verifies the kernel's green
framebuffer marker. The 2026-08-21 live nested-KVM run on an RTX 5070 Ti measured
26.500 us per 4,194,304-element launch over 1,000 iterations (1,899.34 GB/s
effective traffic). This establishes an actual booted-guest/VMM/GPU round trip,
but hosted-mode integrity remains outside the threat model.

The Windows WHP launcher now completes the corresponding signed-kernel path.
It installs the normal high-half PE mappings, authenticated handoff, framebuffer,
and split GPU rings before vCPU entry. Scalar `OUT` exits are decoded strictly
and advanced using WHP's reported instruction length, avoiding repeated
doorbells. The service accepts only request doorbell value 1, executes and
checks the Rust-PTX add, and publishes through service-writable backing that is
still read-only under the guest-memory contract and guest page tables. After
authenticating the response and painting its marker, the WHP-specific benchmark
image emits fixed success value 2 rather than relying on implementation-specific
`HLT` wakeup behavior. A 2026-08-21 Windows release run on the RTX 5070 Ti
measured 28.429 us per 4,194,304-element launch over 1,000 iterations (1,770.41
GB/s effective traffic). This is mediated CUDA from a genuinely running guest,
not GPU assignment: the compromised host remains able to forge the measurement.

The live KVM and WHP launchers now enforce the signed-kernel-bundle boundary
rather than merely relying on the embedded PTX. Each runner can export its exact
compiled PTX with `--export-cuda-bundle`; release tooling signs those bytes as a
separate `CudaKernelBundle` using a one-use key. GPU benchmark mode requires the
signed bundle, its public key, and a nonzero minimum version. Before VM creation
or CUDA initialization, the launcher validates the artifact kind, Lamport
signature, rollback floor, and constant-time digest equality against the PTX
compiled into that runner. A live Windows mismatch test signed the kernel PE as
a valid CUDA-kind artifact and was rejected before WHP entry because its bytes
did not match. The successfully admitted Windows run measured 21.444 us and the
corresponding nested-KVM run measured 35.506 us per 4,194,304-element launch;
these single samples are functional gates, not updated performance baselines.

The CUDA service must verify the exact embedded PTX bundle as a
`CudaKernelBundle` artifact before module loading. Kernel IDs are enabled only
after this verification token exists; a digest mismatch or missing signature
leaves the virtual GPU unavailable and inference falls back to CPU.
`VerifiedGpuKernelBundle` now enforces this boundary: it accepts only the
unforgeable result of typed artifact verification and constant-time compares
that signed digest with the exact embedded bytes. A different artifact kind,
empty bundle, or changed PTX cannot mint the token even when a numeric
`KernelId` is otherwise valid.
The existing native CUDA runtime now provides the service boundary with a
read-only view of its build-embedded PTX and a bounded ID-to-symbol lookup for
all 28 compiled kernels. A non-hardware regression proves every accepted ID is
unique, nonempty, NUL-free, and identical to the runtime's fast lookup table,
while ID 28 and arbitrary names are rejected. This closes registry drift; it
does not by itself implement the service-side argument schemas or graph launcher.
The first typed executor schema is implemented for kernel ID 7 (`add_f32`). It
derives the scalar element count from three equal nonempty f32 buffer ranges,
requires read/read/write permissions and four-byte alignment, fixes the block
to 256 threads, verifies the corresponding grid, and forbids shared memory.
Kernel ID 0 (`gemm_q4_0_f32`) is also typed: positive signed rows, columns, and
batch dimensions must produce the exact Q4_0 weight length (18 bytes per 32
values), f32 input/output lengths, required alignments, access modes, and tiled
grid. Checked multiplication rejects dimension overflow before handoff.
Kernel IDs 3 and 4 reuse one checked GEMV policy while retaining distinct Q4_0
and Q8_0 storage sizes, block widths, and grid tiling. Substituting Q4 storage
for a Q8 dispatch or changing rows, columns, permissions, or output length is
rejected before the executor sees it.
Kernel IDs 9 and 10 share the proven three-buffer f32 elementwise policy with
ID 7. Kernel ID 8 validates a nonnegative signed token against the actual f32
embedding-table row count and binds the dimension, output bytes, alignment,
permissions, block width, and derived grid. A token at the row count is already
out of bounds and fails before launch.
Kernel ID 12 supports weighted and unweighted RMS normalization without a raw
nullable pointer: two accesses mean input/output and three mean
input/weight/output. Dimension and batch must exactly determine tensor and
weight bytes, while epsilon must be a typed, finite, positive f32. Grid,
alignment, permissions, and absence of dynamic shared memory are also fixed.
Kernel ID 11 validates in-place f32 RoPE. Position is a nonnegative signed
integer; head dimension is positive and even; head count is positive; frequency
base and scale are finite positive f32 values. Their product determines the
exact read/write buffer length, while head count and half-head width determine
the only accepted grid and block geometry.
Kernel ID 27 validates Q8_0 embedding rows using the kernel's exact 34-byte
storage per 32 values. Dimension must be divisible by 32, token must be inside
the row count derived from the table range, output must be one exact f32 row,
and output scale must be finite and positive. Alignment, permissions, grid,
block size, and shared-memory policy are fixed.
Kernel ID 13 binds positive model dimension, expert count, and batch to exact
f32 router-weight, input, and logits matrices and to its two-dimensional grid.
Kernel ID 14 requires at least eight experts, exact input logits, writable i32
top-8 IDs, writable f32 probabilities, and one single-thread block per token.
Checked dimension products and alignment checks precede every length test.
Kernel IDs 1 and 2 validate fused Q4_0 QKV GEMM and GEMV. Q, K, and V weight
ranges are independently sized from Q rows, KV rows, and the shared 32-value
column blocks. Input and packed output lengths are derived with checked batch
products. GEMM and GEMV retain their distinct block widths and row/token tiles.
Kernel IDs 5 and 6 validate fused Q4_0 GeGLU GEMM and GEMV. Gate and up weights
must each exactly match the same positive row/column dimensions, while checked
batch products determine the f32 input and output ranges. Their prefill and
decode variants retain distinct row tiles, token tiles, and block widths.
Kernel IDs 17 and 18 validate vocabulary top-k. Exact logits, validity mask,
recent i32 history, writable f32 scores, and writable i32 IDs are bound to
vocabulary, recent count, generated count, k, and partition count. Empty
partitions and k beyond a partition are rejected. The 256-thread specialized
kernel is accepted only when the maximum partition is at most 2048; larger
partitions must use the single-thread generic kernel.
Kernel ID 19 validates in-place QKV normalization, RoPE, and cache conversion.
It binds positive head counts and even head width to the exact packed QKV and
normalization ranges, requires grouped-query head divisibility, and rejects
position arithmetic that could overflow the kernel's signed indices. K and V
caches independently select only F16, Q8_0, or Q4_0 storage; quantized formats
require 32-value head blocks and every cache length is derived exactly from
capacity, KV heads, width, and format. Grid and block geometry are fixed from
the same dimensions.
Kernel ID 20 validates the bounded shared-memory F16 attention variant. Query
stride and dimensions determine the least readable query span, while capacity,
KV heads, and width determine both full cache ranges. Capacity must be a power
of two, head grouping must divide exactly, signed cache positions cannot
overflow, and output geometry is exact. The effective sliding-window key count
must be at most 8192 and determines the only accepted dynamic shared-memory
size; quantized cache formats cannot select this variant.
Kernel ID 21 reuses the checked attention dimensions for the zero-shared-memory
streaming variant and admits F16, Q8_0, or Q4_0 K and V cache layouts
independently. Quantized widths must use complete 32-value blocks. Variant
selection is exclusive, so a dispatch eligible for ID 20 cannot be relabeled
as ID 21. The mediated subset conservatively retains power-of-two cache
capacity and even head width.
Kernel ID 15 binds FFN preparation's two full f32 input tensors, four
dimension-sized normalization vectors, and four distinct writable tensors to
one checked dimension/batch product and one block per token. Kernel ID 16 binds
the residual and dense inputs, read/write MoE accumulator, three normalization
vectors, and final output to the same geometry; its layer scale must be a typed
finite f32. Both require fixed 512-thread blocks and no dynamic shared memory.
`ValidatedExpertSelection` supplies the missing data-dependent-index boundary
for MoE kernels. It validates exact little-endian i32 ID and f32 weight ranges,
rejects negative, out-of-range, duplicate, non-finite, or zero-mass selections,
and caps active experts at 32. A domain-separated SHA3-512 digest binds both
buffers and their expert/active/batch dimensions; the GPU service must verify
the bytes again immediately before launch to close mutation after validation.
Kernel IDs 22 through 26 are implemented behind this proof-bearing API rather
than the ordinary shape-only validator. Generic gate/up and batched down,
single-token combined down, and fixed Gemma 4 26B variants bind exact Q4_0
matrices, selection buffers, scales, tensors, and geometry. Variant selection
is exclusive, and `ValidatedMoeKernelLaunch` retains the proof for immediate
service-side reverification.
`validate_batch_with_expert_selections` integrates these launches into mixed
batches atomically. It searches only supplied sealed proofs, rejects any MoE
entry without an exact buffer/dimension match, and stores the matched proof at
the same batch index. The ordinary batch admission path continues to reject
MoE IDs, so contextual provenance cannot be omitted accidentally.
`MediatedGpuExecutor` implements the host orchestration boundary in two passes.
The first asks the trusted isolated-memory backend to re-read and verify every
retained expert selection; any mismatch rejects before a launch. Only after the
entire preflight succeeds does the second pass lower validated entries in order.
Backend errors during that pass retain uncertain-acceptance watchdog semantics.
`MediatedCudaBackend` is the concrete CUDA adapter. Its fixed-capacity table
maps generational IDs to service-owned device allocations, checks every range,
rereads bounded MoE proof bytes, and constructs driver arguments only from
resolved addresses and typed scalar bits. The validated kernel ID selects the
build-embedded symbol and all geometry comes from the validated dispatch. Raw
binding is unsafe with explicit lifetime and non-aliasing obligations.
`MediatedCudaService` couples this table to `VirtualGpuSession` quotas. Allocate
first reserves a generational handle and rolls it back if CUDA allocation or
binding fails. Free releases only the matching service-owned CUDA allocation
before returning quota; raw external bindings cannot enter that path. Dropping
the backend best-effort releases all remaining owned allocations.
After lowering the ordered batch, the backend synchronizes its CUDA stream
before the executor reports acceptance. Barrier failure is an uncertain result,
not a clean rejection, so the watchdog retains every in-flight identity until
completion or reset recovery resolves device state.
The lifecycle submitter validates every watchdog identity and reserves enough
completion sequence space before calling the backend. Once synchronization
succeeds, it retires the identities and produces ordered authenticated success
frames. Clean rejection cancels all identities; uncertain errors leave all
identities live for deadline or reset handling.
Deadline expiry emits authenticated `TimedOut` frames in stable slot order;
device recovery emits authenticated `DeviceReset` frames for every remaining
entry. Both paths reserve completion sequence space before invalidating any
generational identity, preventing partial retirement on sequence exhaustion.
All other IDs return `UnsupportedKernelSchema`, so adding an ID to the signed
registry alone cannot make it executable. All embedded kernel schemas,
including the proof-bearing MoE variants, are integrated with the concrete CUDA
launch adapter.

## Portability and boot

The first target is x86_64 UEFI. Firmware-specific boot code hands a normalized
memory map, framebuffer/serial description, ACPI root, entropy, and signed boot
measurement to an architecture-neutral kernel entry point, then exits boot
services. Architecture modules contain page-table, interrupt, timer, context
switch, and virtualization primitives. AArch64 and RISC-V64 are represented in
public platform types now so x86 assumptions cannot leak into policy APIs.

Production boot policy requires firmware secure-boot evidence, a measured image
digest, a monotonically enforced minimum image version, and a distinct
coherent-release handoff flag proving that manifest admission—not the legacy
independent-root path—was used. The UEFI loader must
source its 256-bit boot seed from the firmware RNG protocol or a documented
architecture entropy source; the portable kernel rejects absent evidence but
cannot independently prove firmware entropy quality. Development policy may
relax firmware requirements but must not be accepted by production launchers.

The normalized UEFI-to-kernel handoff now has a fixed, versioned, little-endian
encoding and a bounded streaming parser. It carries boot flags, release,
entropy, kernel measurement, ACPI root, a required GOP framebuffer, and at most 128 normalized memory
regions. The parser does not allocate or dereference firmware pointers and
rejects unknown flags or region kinds, nonzero reserved bytes, noncanonical
lengths, unaligned or overflowing regions, and overlap before emitting data to
caller-owned early-boot storage. The loader now emits that same canonical form
into bounded static storage and passes its address and exact length to a
separately built kernel PE entry point.

`mrml-loader.efi` is now a repository-owned PE/COFF UEFI application with raw
ABI definitions rather than a firmware crate dependency. It locates the required
GOP protocol and obtains boot randomness from the firmware RNG or the documented
x86-64 fallback. It rejects unsupported modes and zero entropy, obtains a
bounded memory map, retries the map-key-sensitive `ExitBootServices` transition,
and retains only copied framebuffer values afterward. The framebuffer changes
from blue before the transition to green after successful exit, providing a
visible bring-up signal without serial hardware. Build it with:

```text
mrml build org.mrml.library.uefi --target uefi-x86_64 --release
```

This remains a bring-up loader rather than a production boot chain. It loads,
authenticates, relocates, and transfers to a separate kernel image under fresh
loader-owned page tables. Persistent rollback state, measurement into a
hardware trust anchor, and recovery policy remain required. The admitted kernel
now installs and owns its interrupt tables independently of firmware.

ACPI RSDP discovery is now implemented before firmware exit. The loader prefers
the ACPI 2.0 configuration-table GUID, accepts ACPI 1.0 only as a fallback,
bounds the extended RSDP length, and validates both the legacy and extended
checksums. It does not assume configuration-table pointers retain legacy BIOS
alignment.

QEMU 11.1.0 interoperability was exercised on Windows with its bundled EDK2
firmware strictly as an external test oracle. With `virtio-rng-pci` and the EFI
image at `EFI/BOOT/BOOTX64.EFI`, a 1280x800 GOP capture after boot contained the
uniform post-exit marker `RGB(22,97,58)`. This demonstrates that QEMU loaded the
PE image and that GOP discovery, RNG, ACPI validation, memory-map retrieval,
and `ExitBootServices` completed. EDK2 is not linked, copied into repository
artifacts, or part of the planned MRML VMM firmware.

The loader now normalizes the variable-stride UEFI memory map after firmware
exit into at most 128 sorted, nonoverlapping MRML regions. Only conventional
memory is immediately free; loader and boot-service pages remain conservatively
reserved. Runtime firmware, ACPI, and MMIO receive distinct kinds, adjacent
equal regions are merged, and all page arithmetic is checked. Because GOP BARs
need not appear in the UEFI map, the firmware-authorized framebuffer is overlaid
as MMIO: it is inserted into an address gap or splits one containing region,
while cross-region conflicts fail closed. QEMU still reached the green marker
after this normalization was enabled.

The post-firmware path now enters the independent `mrml-kernel-pe.efi` image.
The successful `ExitBootServices` call is treated as an irreversible state
transition. All subsequent memory-map, handoff, and launch failures enter the
loader's fail-stop loop rather than returning a status through invalidated UEFI
state.
Its entry parses the canonical handoff again and revalidates nonzero entropy,
the ACPI pointer, the sorted memory map, and complete framebuffer MMIO
containment before drawing. It retains every emitted region in fixed bounded
storage and constructs the same architecture-neutral `EarlyKernelContext` used
by later initialization, so the standalone image does not bypass the common
early-boot admission boundary. On Windows QEMU 11.1, a freshly generated one-use
key signed the exact standalone image, the loader pinned that key digest, and a
GOP capture showed its gold `RGB(255,200,87)` 96x12 marker over
`RGB(11,59,90)`. The preceding loader stage was `RGB(32,64,128)`, so successful
PE materialization and entry transfer are independently observable.

The loader now resolves its own boot device through the raw UEFI Loaded Image
and Simple File System protocols and requires
`\EFI\MRML\KERNEL.SIGNED`. It opens the file read-only, accepts bounded file
metadata, allocates loader pages, handles short reads, and rejects empty,
oversized, truncated, or concurrently grown inputs. QEMU 11.1 with its bundled
EDK2 used only as an interoperability oracle successfully read the required
file and still reached the post-ExitBootServices marker: pixel `(0,0)` was
`RGB(242,242,242)` and pixel `(0,8)` was `RGB(22,97,58)`. This checkpoint proves
filesystem interoperability; the test file was a placeholder and was not
admitted as a signed kernel.

The loader now fails closed unless its own build embeds an exact SHA3-512
kernel public-key digest and nonzero minimum version through
`MRML_KERNEL_ROOT_DIGEST_HEX` and `MRML_KERNEL_MIN_VERSION`. These values become
part of the loader binary that conventional UEFI Secure Boot will eventually
authenticate; no private key enters the build. After reading, the loader
authenticates the complete typed Lamport container before interpreting any PE
offset. A disposable QEMU key accepted its matching version-1 fixture and
reached the kernel marker. A second independently valid version-1 fixture from
an unpinned key stopped at the blue verification-failure stage
`RGB(0,0,128)`. The one-time private files were consumed by the signer.

The admitted PE is copied into fully erased UEFI LoaderCode pages, including
the padding after `SizeOfImage` in its final mapped page, and only bounded DIR64
relocations are applied. Each nonzero relocation must originally point
inside the preferred image and is converted to the corresponding checked RVA
at the actual 4 KiB-aligned load address. The entry must be inside a validated
executable, non-writable section, and the loader-owned CR3 enforces those final
section permissions in hardware.

The x86-64 transition now allocates a new zeroed four-level page-table tree and
a fully erased 128 KiB kernel stack arena before leaving firmware. The fixed
arena contains a six-page early stack, an omitted guard page, a sixteen-page
ring-transition stack, a second omitted guard page, and an eight-page
double-fault IST stack. One additional lower allocation page is omitted as an
early-stack underflow guard. The loader passes both protected stack tops through
the PE entry ABI; the kernel rejects invalid tops before installing its TSS and
retains no static fallback privilege stack inside the image. It identity-maps only
the authenticated PE regions with their final read-only, writable/NX, or
read-only/executable permissions; the three stack regions and GOP aperture writable/NX; the
canonical handoff read-only; and one page-aligned read-only/executable assembly
trampoline. The trampoline enables EFER.NXE and CR0.WP, replaces CR3, changes
to the dedicated stack, and jumps without returning. No writable alias of an
executable image page is retained. The handoff has a dedicated, statically
size-checked 4 KiB page whose complete contents are erased immediately before
the canonical prefix is encoded. The transition rejects a trampoline whose linker
symbols do not prove that it fits entirely within its dedicated page. Thus
neither restricted mapping silently grants access to adjacent loader data or
code. QEMU 11.1 reached the independent kernel
marker with `CR0=0x80010033`, `EFER=0xd00`, and the loader-created CR3 root.
The same signed cross-root timer-preemption images ran under KVM and WHP with
the launcher-provisioned supervisor stacks; isolated service roots omit both
internal guard pages.
Before the loader's first GOP write, the shared framebuffer validator now
rejects misaligned bases, unsupported geometry or stride, undersized or
overflowing apertures, and lengths above Rust's `isize::MAX` raw-slice bound.
The kernel applies the same validation again when decoding the authenticated
handoff.

The standalone kernel immediately installs an image-owned GDT preserving the
transition selectors and a complete image-owned IDT. Architectural exceptions
enter vector-specific stubs; unassigned external vectors retain a non-returning
interrupt-disabled fallback. A signed
`fault-probe` build executed `UD2` under QEMU and stopped with `HLT=1` at the
kernel handler while retaining the loader-created CR3 and kernel GDT/IDT bases.
Descriptor construction now lives in the reusable x86_64 architecture module
rather than being duplicated in the PE image. It validates canonical handler
addresses and table ranges, a ring-zero GDT selector that names an existing
entry, the exact 256-gate IDT size, 16-bit descriptor limits, IST indices, and
gate privilege before writing memory or executing `LGDT` or `LIDT`.
The architecture module also defines the exact 176-byte trap-frame contract
used by the assembly entry stubs. Its fail-closed dispatcher validates
the exception vector, privilege transition, canonical RIP and user RSP, fixed
RFLAGS bits, and whether that vector architecturally carries an error code.
Validated ordinary user exceptions terminate only the current task; NMI,
double fault, machine check, every kernel exception, and every malformed frame
halt the kernel. Page faults additionally require a canonical captured CR2.
The image installs 32 distinct original assembly stubs. They normalize vectors with
and without CPU error codes, preserve every general register, clear DF, and
enter the Rust dispatcher through an explicit SysV64 boundary. IDT construction
validates every handler before modifying the live table, exposes only breakpoint
and overflow gates to ring three, and retains the fail-stop fallback for vectors
32--255. A signed nested-KVM `fault-probe` build executed `UD2`, emitted the
dispatcher's exact vector-6 proof through diagnostic port `0x4d53`, resumed,
and halted cleanly in 156 microseconds. Later signed CPL3 probes prove the same
path revokes a faulted task domain and restores a replacement through
`CR3`/`iretq` rather than merely failing the kernel.

The image-owned GDT now also contains ring-three code and data descriptors and
an exact 104-byte x86-64 task-state segment. Initialization validates canonical,
nonzero, 16-byte-aligned `RSP0` and IST1 stack tops, writes the two-slot available
TSS descriptor before loading the GDT, loads `TR`, and disables the TSS I/O
bitmap by placing its base immediately beyond the segment limit. Vector 8 alone
uses IST1, so a double fault does not depend on the interrupted stack. Windows
and Linux unit tests verify the packed offsets and descriptor encoding. A fresh
signed nested-KVM `fault-probe` reached its expected vector-6 halt after `LTR`
in 157 microseconds (`verify=694us`, `prepare=1156us`, `total=4830us`). The
entry and double-fault stacks now come from the fixed launcher-owned 128 KiB
arena. They are separate sixteen- and eight-page supervisor mappings with an
absent guard below each; the kernel image contains no static fallback privilege
stack. The first guarded two-syscall service run faulted at
`CR2=...60006d88`, proving the former 16 KiB transition stack overflowed into
its newly absent guard. Enlarging only the mapped stack regions retained both
guards and made the same signed path complete on KVM and WHP.

External vector installation is now a separate validated operation restricted
to vectors 32--254 and performed only while interrupts are disabled. The
`timer-probe` image constructs one runnable scheduler task, enables the local
APIC software bit, lowers task priority, masks the LVT while programming a
periodic vector/count/divisor, and observes a real counter wrap while IF is
clear. It then emits a second marker and enables interrupts. Its assembly entry
preserves all general registers before calling the Rust handler. The handler
advances `KernelScheduler` exactly one tick, acknowledges EOI, emits a distinct
proof, and fails closed. KVM creates its in-kernel interrupt controller before
the vCPU, installs the bounded supported CPUID set, and maps the xAPIC page
supervisor-only when x2APIC is unavailable. No host interrupt injection is used.
This APIC setup is restricted to timer guests so it cannot change halt behavior
for other launch modes. A freshly signed nested-KVM run completed guest
execution in 1,856 microseconds (`verify=744us`, `prepare=10296us`,
`total=15834us`). The corresponding WHP proof uses Hyper-V's xAPIC emulation
and the same supervisor-only page-table policy;
the freshly signed identical kernel reached its tick in 8,232 microseconds
(`verify=758us`, `prepare=2971us`, `total=13998us`). A live timer-driven switch
now also runs in the signed `preemption-probe`: vector 32 arrives from task A
with `CS=0x23`; the kernel reconstructs A's complete context, rejects any CR3
that differs from A's bound address space, commits the quantum switch, selects
B, acknowledges EOI, and restores B through the common `iretq` transition. B
raises a checked CPL3 breakpoint rather than using forbidden port I/O. The
final artifact completed in 2,073 microseconds on nested KVM and 8,315
microseconds on WHP. The signed `service-preemption-probe` repeats the path
across independently materialized service roots: A is interrupted under
`CR3=0xc00000`, its frame remains bound to that domain, and B is restored under
`CR3=0xd00000`. Each root maps the supervisor kernel and only its own user
image/stack; timer-enabled roots add the APIC page supervisor-only. Final
execution measured 2,063 microseconds on nested KVM and 8,413 microseconds on
WHP. After the UEFI RF-sanitization work, freshly signed version-20/21
regressions repeated the complete cross-root path in 2,125 microseconds on
nested KVM (`verify=20445us`, `prepare=7190us`, `total=51691us`) and 8,428
microseconds on WHP (`verify=17530us`, `prepare=4536us`, `total=34120us`).

The `user-probe` diagnostic now gives the context and TSS work a live privilege-
transition proof. Its signed PE is relocated into a bounded lower-half layout;
the kernel loads the ring-three data segments and an exact `SS:RSP`, RFLAGS,
`CS:RIP` frame, then executes `IRETQ`. The embedded CPL3 instruction deliberately
raises invalid opcode. Hardware switches to TSS `RSP0`, the vector-specific
entry captures the user RSP/SS tail, and checked policy admits exactly
`TerminateUser { vector: 6, address: None }` before emitting proof. A freshly
signed nested-KVM run completed in 178 microseconds (`verify=758us`,
`prepare=946us`, `total=4669us`). This diagnostic intentionally marks all PE
sections and its stack user-accessible and halts at the first fault; it is not a
security boundary and cannot ship as a service configuration. The production
path still requires separately authenticated service pages, a private guarded
user stack, a kernel-only higher-half mapping, CR3/PCID switching, and revocation
before another context can run.

User entry is no longer encoded in the diagnostic image. The reusable x86-64
transition consumes the fixed 152-byte `UserContext` contract, writes its
page-aligned physical root to CR3, builds the exact five-word privilege frame,
sets DS/ES/FS/GS to the ring-three data selector, restores all fifteen general
registers, and executes `IRETQ`. Compile-time Rust layout plus unit tests bind
every assembly offset to the context representation. Its safety contract
requires the new root to retain the transition page until the CR3 write, map
the target RIP user-executable and RSP user-writable, and retain a kernel-only
TSS `RSP0`. Windows and Linux now pass 129 kernel tests. A fresh signed KVM
probe exercised this reusable CR3/register path and the checked return path in
210 microseconds (`verify=729us`, `prepare=1231us`, `total=5403us`). The probe
used the same root before and after CR3 as an earlier transition proof; the
two-root service probe below now proves address-space switching as well.

`TaskRuntime` now binds each scheduler identity to exactly one saved
`UserContext` and one fixed-capacity `CapabilitySpace`. Recoverable fault
handling first takes the complete domain—making its context and all task-local
handles unreachable—then calls `terminate_current` and exposes only the
resulting replacement outcome. Missing domains are integrity failures, kernel
fault dispositions cannot enter this path, and generation changes prevent the
retired task identity from addressing a reused slot. Windows and Linux pass 115
kernel tests, including fail-closed retirement ordering. The signed CPL3 probe
now creates a real runtime task and emits success only after vector 6 has removed
its domain. The probe now contains a second runtime task with a distinct entry
and stack. After the first task raises `#UD`, the exception handler revokes it,
selects the second identity, and calls the same full CR3/register/`IRETQ`
transition directly from the exception stack. The replacement executes `INT3`;
only its checked vector-3 retirement reaching `Idle` emits success. A freshly
signed nested-KVM run completed both CPL3 entries and recoveries in 179
microseconds (`verify=821us`, `prepare=1032us`, `total=6465us`). Both tasks still
share the deliberately permissive diagnostic PE mapping, so this proves live
replacement mechanics but not cross-address-space service isolation.

The runtime now owns cross-task IPC routing as well. `send_ipc` requires two
distinct live generational task identities, derives only explicitly requested
rights from the sender domain into the receiver domain. The sender's exact
SIGNAL capability and available endpoint sequence are first captured in a
one-use endpoint-bound plan; capability derivation begins only after that
preflight succeeds. Committing a stale or substituted plan after transfer is an
integrity failure rather than an ordinary authorization denial. Same-task
routing is rejected so callers cannot use this interface to bypass a domain
boundary. Focused tests cover attenuation, mutation-free authorization denial,
sequence exhaustion, and stale plan rejection. Live syscall entry and blocking
endpoint queues are now exercised by the two-root service proof below.

IPC derivation now also commits one bounded exact-generation delegation edge
for each destination handle. The 256-edge table is capacity-checked before any
capability mutation, and denied endpoint authorization creates neither a
receiver handle nor an edge. `TaskRuntime::revoke_capability` discovers the
complete descendant set, validates every exact handle before mutation, revokes
children before their source, and removes the consumed graph relations.
Revoking an intermediate handle leaves its parent live while invalidating all
of its children. Fault and voluntary-exit retirement perform the same
transitive cleanup before scheduler replacement selection; domains involved in
a live delegation cannot migrate and orphan the relation. Windows gnullvm
passes 294 kernel tests, including three-domain derivation chains, intermediate
and task-death revocation, unrelated-authority survival, rollback cleanup, and
full-table saturation/reuse. This is allocation-free kernel-policy evidence,
not a live signed-backend or physical-hardware revocation result.

The initial x86 user-call ABI is deliberately pointer-free. Exactly IDT vector
`0x80` receives a DPL3 interrupt gate; external interrupt gates remain DPL0 and
all other fallback vectors remain inaccessible to `INT`. Operation zero is
yield and accepts no nonzero reserved argument. Operation one carries an
endpoint capability token, a generational receiver task token, a length no
larger than 24, and three payload words in registers r10/r8/r9. Decoding zeros
the unused payload tail and rejects unknown operations, generation-zero tokens,
and oversized lengths without reading guest memory. Operation two receives or
blocks, and operation three voluntarily exits with no arguments. Exit removes
the complete context/capability domain before replacement selection, so an
exited identity cannot retain authority or resume. Windows and Linux pass 134
kernel tests, including exact gate privilege/vector placement and canonical ABI
decoding. The live entry now preserves all fifteen registers in an exact
160-byte `UserCallFrame`, validates the ring-three CS/SS, lower-half RIP/RSP,
and a complete RFLAGS whitelist that excludes IOPL, NT, VM, and reserved bits.
It dispatches inline send through `TaskRuntime::send_ipc`, returns status in RAX
and sequence in RDX, restores the frame, and executes `IRETQ`. The signed KVM
probe sends `ping` from task A to task B with sequence one, emits proof only
after endpoint authorization and message construction, returns to CPL3, then
continues through the existing `#UD` revocation and task-B breakpoint recovery.
A fresh run completed the combined path in 192 microseconds (`verify=783us`,
`prepare=1125us`, `total=6426us`). Blocking receive, wakeup, and production
service-image entry were subsequently completed by the two-root service proof.

`ServiceAddressSpace` now defines the production mapping boundary independently
of the permissive probe layout. Its public constructor accepts only a
`VerifiedExecutable` whose authenticated kind is `ServiceImage`. Each instance
copies only explicitly supplied higher-half supervisor mappings, maps the
validated PE allocation plan as lower-half user pages with final per-section
W^X permissions, maps a user-writable/NX stack, proves the immediately lower
page is absent, and can materialize the plan only through a fresh
`PageTableBuilder` root. Low supervisor mappings, user-marked kernel mappings,
physical aliases, overlap with the guard, overflow, and a non-service artifact
fail closed. Windows now passes 122 kernel tests. Live loading of separately
signed service bytes and switching between independently materialized roots is
now implemented in the KVM integration path. `PreparedKvmGuest` maps service
image, stack, and table arenas into separate KVM slots, maps the kernel PE
supervisor-only into a fresh root, maps the authenticated service PE user-only
at its signed preferred base, leaves the lower stack guard absent, and exposes
the root and entry only after all mappings succeed. The diagnostic kernel uses
root `0xc00000`, service entry `0x140001000`, and a two-page stack ending at
`0x702000`.

The first isolated run exposed an important CR3 transition invariant: both the
saved context and the stack used to build the `IRETQ` frame must remain mapped
after CR3 changes. Mapping the old boot stack would have broadened every service
root, so the architecture now provides `enter_user_context_on_stack`, which
moves first to the kernel-only per-CPU transition stack shared by both roots and
then performs the existing CR3/register transition. With the context stored in
kernel-only image data, a freshly signed kernel and independently signed 2 KiB
service PE entered CPL3 and returned through vector 3 under nested KVM in 208
microseconds (`verify=11987us`, `prepare=1149us`, `total=18464us`). The extra
verification time includes two independent Lamport/SHA3 artifact checks. WHP
now has parity: `PreparedWhpGuest::attach_isolated_service` creates separate
WHP GPA mappings, seals the service PE after relocation/materialization, and
builds the same supervisor-kernel/user-service root. The service partition does
not enable WHP's test-only breakpoint exit bitmap, so vector 3 reaches the guest
IDT instead of stopping in the host. A signed Windows run completed in 216
microseconds (`verify=1579us`, `prepare=2805us`, `total=6521us`). The runner
stops at the explicit kernel proof because re-entering an interrupt-disabled
HLT is not a portable WHP completion mechanism. Service syscalls and persistent
service scheduling were then advanced by making the independently signed PE
issue operation-zero through `INT 0x80` with every reserved register cleared.
The kernel validates the complete call frame, returns zero status, restores all
registers, and executes `IRETQ`; the service reaches its subsequent breakpoint
only if that return succeeds. Fresh signed runs completed the call, return, and
breakpoint chain in 260 microseconds on KVM (`verify=5908us`, `prepare=1325us`,
`total=11398us`) and 190 microseconds on WHP (`verify=1565us`, `prepare=3535us`,
`total=7117us`). A yield with one runnable service legitimately continues that
service. The next increment materializes the verified service PE twice with
distinct physical images, guarded stacks, and roots (`0xc00000` and
`0xd00000`). Receiver A executes operation two, and the kernel validates and
captures its exact post-interrupt continuation before blocking it. Sender B
runs under the second CR3, uses its exact SIGNAL capability and A's generational
task token to deliver `ping`, wakes A, and exits. The kernel revokes B before it
dequeues into A's
saved registers and restores A under its own root; A validates RAX, RDX, and
R10 before raising its completion breakpoint. Clean independently signed runs
completed the clean-exit chain in 326 microseconds on WHP and 491 microseconds
on nested KVM. One authenticated service
artifact supplies both instances; task identities, address spaces, physical
copies, stacks, and table arenas remain separate.

The real UEFI path now also requires `\EFI\MRML\SERVICE.SIGNED`. The loader
checks a service-specific embedded root and version floor, extends both kernel
and service payloads into PCR 11 when TCG2 is available, then extends a
canonical selected-set record binding their fixed kinds, order, signed versions,
and verified SHA3-512 digests. The measured-boot bit requires all three events.
This is the selected kernel/service pair, not the complete planned same-release
artifact set. The loader materializes the
service at its signed preferred base, and reserves disjoint image, stack, and
page-table arenas. Its canonical handoff carries both the immutable signed
container and materialized pages. After `ExitBootServices`, the kernel repeats
the service signature, kind, version, digest, and PE checks itself; reconstructs
the section-level W^X plan; privately clones the live supervisor mappings into
the bounded service table arena; adds only the service's user leaves; and enters
CPL3 through the per-CPU transition stack. This private clone is necessary
while the UEFI kernel still uses low identity mappings: sharing the hierarchy
would let user-leaf insertion mutate the kernel CR3, while copying only the
upper half would unmap the transition code. A disposable version-22 QEMU TCG
run traversed loader stages `a1..b3`, repeated kernel verification stages
`c0..c7`, entered the signed spinning service in CPL3, and received a real
local-APIC timer interrupt there (`90`). QEMU's hardware frame contained
RFLAGS `0x10202`: the CPU-managed Resume Flag was set. The external-interrupt
conversion now requires the exact admitted vector and clears RF rather than
carrying one-instruction debug suppression into a later time slice; ordinary
trap conversion remains strict and rejects RF. Terminal trace
`90 95 96 02 02 01 00 92 93 94 91 90 95 96 02 02 01 00 92 9a` proves
sanitized context capture, timer-driven task switch, return through `IRETQ`
into the second CPL3 entry, checked retirement and capability revocation after
its breakpoint, resumption of the surviving CPL3 task, and a subsequent timer
interrupt there before the intentional proof halt. The established signed KVM
and WHP service-preemption probes cover the same switch and recovery chain
through their native backends.

`ServiceSupervisor` now binds each service object to exactly one live
generational task identity. The signed exit syscall must resolve the current
task through this table before `TaskRuntime` removes its context and capability
space. Clean exit records `Exited`; checked user-fault retirement records
`Faulted`. Restart accepts neither state without exact `CONTROL` authority for
the recorded object, completed cleanup of the exact retired task/address-space
ticket, and a newly supplied validated `UserContext`. Retirement preflights the
restart deadline before revoking the task, then publishes a one-use cleanup
ticket containing the old service generation, task generation, and validated
context. Cleanup failure retains the ticket and blocks restart; replay or
substitution is rejected. It creates a
new task first, then advances the service generation and publishes the
replacement, so allocation failure leaves the stopped record unchanged and a
stale service ID never regains control. Windows and Linux tests cover wrong
object authority, clean and fault retirement, cleanup failure/retry/replay,
successful restart, and stale-ID rejection. The current signed probe exercises
supervised clean exit.

WHP and KVM now provide a platform reset primitive for the two isolated service
slots. The launcher privately records the admitted `ServiceImage` digest, image
size, physical/virtual placement, stack range, and page-table root. Reprovision
is permitted only after the caller observes kernel retirement with the vCPU
stopped, and only for the exact same verified digest and size. It withdraws the
entry and root before mutation, zeroes the entire image and stack backing,
rematerializes the verified PE (including initialized data and zeroed BSS), and
republishes only after every step succeeds. The unchanged page tables remain
safe for this operation because the exact image identity and mapping contract
cannot change. `KvmServiceEraser` and `WhpServiceEraser` bind the cleanup
ticket's exact task and page-table root to the selected service slot before
invoking this reprovisioning path. Both signed live runners reject substitution with the valid
kernel executable before publication changes, contaminate the second service
stack, reset it, and verify its bytes, entry, and root. The 2026-08-21 release
runs now connect reset to kernel-supervised restart. The receiver fault is
retired through `ServiceSupervisor`, the host rebuilds both stopped instances,
and exact kernel-held `CONTROL` capabilities authorize fresh service and task
generations. New task-local endpoint authority is issued to the replacement
sender, stale receiver/task tokens are not reused, and scheduler creation order
preserves the receiver-first blocking invariant despite its retained
round-robin cursor. Checked stages prove both fresh generations exist and the
replacement receiver is selected. The rebuilt pair then repeats the complete
block, send, clean sender exit, receiver wakeup, CPL3 breakpoint, and fault
retirement chain. The final bounded-policy artifact completed both generations
in 390 microseconds on WHP (`verify=1910us`, `prepare=3428us`, `total=7630us`)
and 570 microseconds on nested KVM (`verify=4018us`, `prepare=1358us`,
`total=9797us`) after the CPU-private descriptor refactor.

The 2026-08-23 cleanup-gated revision replaces that out-of-band pair reset with
four synchronous per-slot handshakes across two generations. At each clean exit
or fault, the signed service image emits only the retired page-table root's slot
request while the vCPU is stopped. The runner rejects substitution with the
valid kernel executable, contaminates that slot's stack, reprovisions only the
requested authenticated service image, and verifies zeroed bytes plus the
expected entry and root before resuming. Only then does the guest complete the
one-use cleanup ticket. Fault recovery uses the retired context solely for
erasure binding and requires a separately constructed initial entry/stack/root
context for the fresh generation; the first live KVM attempt caught and drove
the correction of a fault-context reuse bug. If the retained scheduler cursor
selects the replacement sender first, the kernel explicitly yields to the
replacement receiver so empty-receive blocking remains the first service
action. The rebuilt pair repeats block, send, cleanup-gated clean sender exit,
receiver wakeup, CPL3 breakpoint, cleanup-gated fault retirement, and permanent
restart-budget rejection. Fresh signed artifacts completed this path under Arch
Linux/WSL2 `/dev/kvm` (`verify=21616us`, `prepare=3030us`, `execute=1056us`,
`total=49464us`) and Windows WHP (`verify=18846us`, `prepare=3888us`,
`execute=567us`, `total=26846us`). These are controlled hosted-probe results;
the host remains trusted.

The next signed revision makes the lifecycle control channel real in this same
path. Both services receive fresh `SIGNAL` capabilities for the exact endpoint
object, and `TaskRuntime::connect_control_peers` commits the relation only after
both live generational domains authorize it. When the sender exits, retirement
publishes `PeerDeathReason::Exited`; before returning to CPL3, the kernel checks
that event's exact retired `TaskId`, then dequeues the ordinary message envelope
and checks its exact sender plus a nonzero endpoint sequence. A distinct
host-visible `0x22` stage proves this ordering. Restart issues new capabilities
to both new task generations and rebuilds the relation rather than reusing old
tokens; the second clean exit repeats the same proof. Fresh 2026-08-23 signed
artifacts completed both generations under Arch Linux/WSL2 `/dev/kvm`
(`verify=21224us`, `prepare=2833us`, `execute=1075us`, `total=48573us`) and
Windows WHP (`verify=18294us`, `prepare=3764us`, `execute=663us`,
`total=26432us`). This proves typed clean peer-death and envelope attribution in
the hosted control path.

The following signed revision adds the task-owned bulk page without treating
the hosted VMM as a confidentiality boundary. KVM and WHP allocate one common
4 KiB guest frame and install independent exact `USER_READ_WRITE` leaves in the
two isolated service roots. Generation 1 and generation 2 carry distinct
kernel-supplied values in `r12`: the sender writes that value through its leaf,
and the receiver rejects both the generation's value before blocking and any
different value after wakeup. Thus the restarted path cannot pass by observing
stale generation-1 contents. Each cleanup handshake removes only the retired
root's exact leaf while the vCPU is stopped; the sibling leaf and common backing
remain live, and service transition reloads CR3 before continuation. After both
old tasks are retired, the host clears the backing and re-arms each leaf only
after the kernel has created both replacement generations. Exact-match removal,
duplicate removal/re-arm rejection, signed service checks, and terminal CPL3
breakpoint stages fail closed. Fresh 2026-08-23 artifacts completed both
generations under Arch Linux/WSL2 `/dev/kvm` (`verify=21162us`,
`prepare=2604us`, `execute=934us`, `total=46438us`) and Windows WHP
(`verify=17639us`, `prepare=3951us`, `execute=636us`, `total=25948us`). At that
revision, surviving-peer typed fault death remained a separate evidence gate.

Patent review: `NOT_TRIGGERED` — this is conventional shared-memory mapping,
exact-match page-table removal, lifecycle ordering, and controlled-probe
verification.

The final signed service-substrate revision keeps the generation-2 sender live
and blocked after delivery, then deliberately faults the receiver. The live
probe exposed that `TaskRuntime` previously selected a replacement before
publishing peer death, so a peer woken only by that event could be omitted from
the returned scheduling outcome. Fault and clean-exit retirement now publish
and wake exact-generation peers before terminating the current scheduler slot.
A focused two-task regression requires the awakened observer to be the returned
continuation. The signed kernel then validates the retired receiver identity,
`PeerDeathReason::Faulted { vector: 3, address: None }`, and the surviving
sender context after cleanup but before emitting stage `0x23`; restart-budget
exhaustion remains terminal. Fresh 2026-08-23 artifacts completed under Arch
Linux/WSL2 `/dev/kvm` (`verify=20578us`, `prepare=2391us`, `execute=976us`,
`total=46782us`) and Windows WHP (`verify=17568us`, `prepare=3969us`,
`execute=645us`, `total=25976us`). This completes the hosted signed
two-service Phase 1 control, bulk-page, cleanup, peer-survival, and bounded
restart evidence; it is not attestation or host-resistant isolation.

Patent review: `NOT_TRIGGERED` — conventional wake-before-selection scheduler
ordering, typed lifecycle notification, and controlled-probe verification.

Every registration now binds a validated restart policy containing a nonzero
maximum restart count, base delay, and maximum delay. Retirement computes the
next eligible scheduler tick with checked arithmetic; delay doubles after each
completed restart and saturates at the configured maximum. Exact `CONTROL`
authorization precedes budget/timing disclosure, an early attempt neither
allocates a task nor advances a generation, and exhausting the count is
permanent for that service record. Time overflow is rejected before the
retiring domain is revoked, preserving the live task and cleanup handoff.
Windows and Linux tests cover invalid policies, unauthorized probes, early
retry, saturation, exhaustion, and time overflow. The signed two-service policy
permits one immediate restart and its
terminal marker is emitted only after the kernel proves a second restart is
rejected. A general policy/configuration service remains future work.
As elsewhere, these host-visible markers are test evidence, not attestation
against a compromised host; protecting guest memory from that host requires the
confidential-computing boundary described in the threat model.

Task-owned shared endpoints now carry the exact generational `TaskId` alongside
their VM and mapping identities. `ServiceResourceEraser` composes cleanup-ticket
completion with native-first mapping invalidation, common mapping retirement,
shared-binding retirement, final opaque host-handle destruction, and then
address-space reprovisioning. Other tasks' endpoints remain live. Native
failure preserves the current mapping and binding; host-handle or address-space
failure retains completed obligations for retry and continues to block restart.
`ServiceSupervisor::recover_current_fault` now supplies the single bounded
orchestration boundary: it retires the exact current service, allowing
`TaskRuntime` to publish typed peer death and revoke task authority, completes
the supplied composite eraser, then creates a fresh service/task generation
from an independently validated context before returning the peer scheduling
outcome. Cleanup failure keeps the exact
ticket queryable for retry; a restart authorization or policy failure occurs
only after cleanup and leaves a clean stopped service that can be restarted
separately. Windows gnullvm passes 298 kernel tests. Focused cases cover
surviving peers, typed fault identity, stale service generations, wrong-task
substitution, final-reference reporting, native failure, host-resource failure,
eraser failure, exact-ticket retry, rejected-restart retry, and a composite
native mapping/binding/host-resource/address-space cleanup followed by fresh
generation creation. The signed backend probes now exercise cleanup-gated
address-space reprovisioning and the concrete task-owned shared-page lifecycle.
The general opaque shared-binding/host-resource adapter remains
simulation-tested rather than live-probe evidence.

Each `TaskRuntime` domain now owns a fixed two-message inbox in addition to its
context and capability space. `receive_or_block_current` dequeues immediately
or marks only the empty receiver blocked and selects a replacement.
`deliver_ipc` checks capacity before authorization, sequence advancement, or
capability derivation; after transactional `send_ipc` succeeds it publishes at
the tail and wakes the receiver. FIFO head/tail/count invariants make overwrite
impossible, and a full inbox returns without consuming endpoint sequence or
creating receiver capabilities. Windows and Linux pass 129 kernel tests,
including block, wake, FIFO, overflow behavior, syscall continuation capture,
and voluntary switching. The two-root signed probe exercises live delivery,
wakeup, and syscall-visible receive results on WHP and KVM.
Kernel-owned inbox entries now also retain the exact generational sender and
endpoint sequence, allowing a receiver to distinguish multiple clients without
trusting payload identity fields. A separate bounded control receive path can
link at most eight exact-generation peers per task only after both domains
prove `SIGNAL` authority for the exact endpoint object. Fault or clean-exit
retirement removes the symmetric relation, publishes a typed peer-death result
containing the fault vector and address when applicable, and wakes a blocked
peer. Pending lifecycle results do not consume ordinary inbox capacity.
Migration of a domain with a live relation or unconsumed death result fails
closed rather than orphaning cross-CPU notification state. Windows gnullvm unit
tests cover two independent senders, exact sequence attribution, fault wakeup,
unrelated-domain survival, and the migration gate. This is kernel-policy test
evidence only; the signed two-service probes and native WHP/KVM bulk-page
revocation path have not yet been extended to this control event.

Unit tests check the exact 16-byte gate encoding and prove malformed pointers,
sizes, handlers, and selectors fail before privileged instructions. The kernel
image treats any installation error as a fail-stop.
Nested KVM initially reported a triple fault after `UD2`. A bounded post-exit
snapshot and four-level hardware page walk proved that CR2 named the valid,
present GDT code descriptor and that the vector-6 gate was exact. The descriptor
used type `0x9a`, leaving its architectural accessed bit clear; exception entry
therefore tried to set that bit on a deliberately read-only GDT page under
CR0.WP. The code descriptor is now encoded pre-accessed as type `0x9b`, and
installation rejects descriptors that are absent, non-code, non-ring-zero,
non-long-mode, default-operand-size, or not pre-accessed. A freshly signed,
high-half-relocated version-7 probe entered the kernel-owned invalid-opcode gate
and reached `HLT` under nested KVM without changing the framebuffer.

Before materialization, the loader can now use the packed, raw
`EFI_TCG2_PROTOCOL` ABI to hash the already authenticated kernel PE into PCR 11
and append an `EV_IPL` event named `MRML authenticated kernel PE`. The canonical
handoff sets its measured-boot flag only after `HashLogExtendEvent` succeeds.
Set `MRML_REQUIRE_TPM=1` when building the loader to make a missing TCG2
protocol or failed extend boot-fatal; QEMU without a virtual TPM stopped at the
blue `RGB(0,0,128)` stage under that policy, while the optional development
policy still reached the kernel marker. PCR extension supplies attestation and
an event log, but is not a monotonic counter. TPM NV provisioning,
authorization, atomic version advancement, and recovery remain separate work
and no rollback-resistance claim is made yet.

An allocation-free TPM 2.0 NV backend emits bounded `NV_ReadPublic`, `NV_Read`,
and `NV_Increment` commands through TCG2 `SubmitCommand`. It rejects handles
outside the platform NV range, non-counter index types, sizes other than eight
bytes, mismatched public handles, malformed names, rollback below the stored
counter, oversized per-boot advancement, malformed response lengths, and
nonempty password-session responses. Set `MRML_TPM_NV_INDEX_HEX` to the exact
eight-hex-digit handle of a separately provisioned empty-auth counter. The
loader advances it only after signature verification, PE materialization,
page-table construction, and ACPI validation. `MRML_REQUIRE_ROLLBACK=1` makes a
missing configuration boot-fatal. Empty authorization permits unauthorized
increments (denial of service) but never decrement or rollback; a production
deployment should provision a policy-authorized index once policy sessions are
implemented.

Successful NV validation and advancement is now represented by a dedicated bit
in the canonical UEFI-to-kernel handoff rather than inferred from the image
version. The decoder rejects unknown bits, `BootEvidence` retains the result,
and production `BootPolicy` independently requires Secure Boot, measured boot,
rollback protection, and coherent-release admission. A version meeting the
compiled floor is therefore not enough when monotonic enforcement was skipped.
A freshly signed version-5
kernel using the expanded evidence contract still reached the QEMU GOP marker.

The standalone image also has a `production-policy` feature. Such builds embed
`MRML_KERNEL_MIN_VERSION` independently of the loader and validate the decoded
handoff with `BootPolicy::production` before touching the framebuffer or
starting subsystems. Missing or malformed compile-time policy fails closed.
The build rejects combinations of `production-policy` with diagnostic kernel
features. Probe images remain standalone test fixtures, not OS boot modes. A
properly hash-signed version-6 production image transferred under loader-owned
CR3/GDT/IDT but refused the deliberately unmeasured, non-Secure-Boot QEMU
handoff, leaving the loader's `RGB(20,33,53)` stage unchanged. All terminal
kernel paths now use interrupt-disabled `HLT` rather than consuming a CPU in a
spin loop.

Successful authenticated release-journal admission sets rollback-protection
evidence directly. `MRML_TPM_NV_INDEX_HEX` remains a compatibility path for the
older standalone counter and is not additionally required when the release
journal is active. Neither path is physical rollback-resistance evidence until
tested on provisioned hardware across reboot and power loss.

The loader also reads the standard global `SecureBoot` and `SetupMode`
variables through its original raw runtime-services ABI. It reports secure boot
only when `SecureBoot` is exactly one and `SetupMode` is exactly zero; absent,
malformed, or contradictory values never become positive evidence. Set
`MRML_REQUIRE_SECURE_BOOT=1` to reject any other state. This verifies firmware
enforcement state but does not itself create an Authenticode signature. The
platform-compatible RSA/CMS signing path remains an optional build-tool task;
the inner hash-based MRML signature remains mandatory regardless of firmware
mode.

`mrml-sign authenticode-digest IMAGE.efi` now computes the SHA-256 PE image
digest used by conventional Authenticode. Its parser accepts only x86-64
PE32+, bounds the optional and section tables, sorts raw sections, rejects
overlap and overflow, requires a terminal eight-byte-aligned certificate table,
and excludes exactly the checksum field, security-directory entry, and
certificate bytes. This is hashing groundwork, not a signature generator:
RSA/PKCS#1 and CMS `SignedData` emission plus verification against an
independent platform tool remain necessary before claiming firmware-compatible
signing.

`mrml-sign attach-authenticode IMAGE.efi SIGNATURE.p7b OUTPUT.efi` now performs
the remaining PE container work for an externally generated CMS object. It
requires an unsigned eight-byte-aligned canonical image, appends exactly one
revision-2 `WIN_CERTIFICATE` of type PKCS signed data, zero-pads only the
certificate entry, updates the security directory, calculates the final PE
checksum while excluding its field, refuses overwrite or double attachment,
and recomputes the Authenticode digest before returning. On the real standalone
kernel PE, the digest remained
`5269d33d3834f99bcb5ea31acf908749b7eff2456b91015ddca0092b85eae59b`
before and after attachment on Windows. Certificate bytes are treated as an
opaque CMS input and are not claimed valid until the CMS generator and an
independent verifier accept them.

The original fixed-storage RSA implementation now also emits deterministic
PKCS#1 v1.5 SHA-256 signatures using the same constant-work exponent traversal
as RSA-PSS. It constructs the complete DigestInfo and requires at least eight
padding octets, rejects inconsistent modulus/signature sizes, and has a
disposable independently generated RSA-1024 private-key round-trip vector.
This primitive is required by Authenticode but is not itself CMS or a signed PE.

### OS executable format

PE32+ is the sole executable binary format for MRML on x86-64. The kernel, VM
boot images, service images, and tool executables must be x86-64 PE32+ payloads
inside their typed signed-artifact containers. Launch policies and CUDA bundles
are data and must never be admitted as executable images. Future ARM64 and
RISC-V ports retain PE32+ with their architecture-specific machine identifier,
keeping one bounded loader and signing representation across UEFI, Hyper-V,
KVM, and bare metal.

The original allocation-free parser accepts at most 32 sections and requires
an executable COFF image, the PE32+ optional header, NX compatibility,
power-of-two file and section alignment, exact in-file raw ranges, bounded
image ranges, nonoverlapping virtual and raw sections, and an entry point
contained in an executable section. Any writable-and-executable section is
rejected. The release signer validates these rules before consuming a one-time
key, and runtime admission repeats validation only after the outer artifact
signature succeeds. The loader core can now materialize a validated image into
an exact-size caller-owned buffer: it clears the entire image first, copies the
bounded headers and section bytes to their RVAs, leaves virtual tails and gaps
zeroed, and returns the checked preferred-base entry address. A separate load
plan describes read-only NX headers and the final W^X permission of every
section. Platform code must populate pages while NX is active and install the
final permissions only after copying completes. Mapped image size is capped by
artifact type: 64 MiB for the Gigakernel, 128 MiB for a service, and 512 MiB
for a VM boot image. Both the signer and verified runtime admission enforce the
same quota before allocation. Optional PE base relocation tables are fully
validated before loading, capped at 65,536 entries, and accept only padding and
x86-64 `DIR64` relocations; malformed blocks, unsupported relocation types,
out-of-image targets, arithmetic overflow, and rebasing a fixed image fail
closed. PE imports are rejected because they are not part of the standalone
MRML ABI. The UEFI loader materializes the separately built kernel into
LoaderCode pages, builds final W^X page tables, exits boot services, switches
CR3 and stack in a page-aligned trampoline, and transfers to the validated
entry without return.

The early frame allocator now reserves aligned physically contiguous runs
without crossing normalized firmware regions. PE admission can consume that
allocator to produce a fixed-capacity physical load plan containing one run for
the read-only NX headers and one run per section. Alignment padding and partial
allocations are never recycled during boot, preventing stale-frame aliasing;
failure is therefore fatal rather than rolled back. This generic physical-plan
path remains available for non-UEFI loaders; the active UEFI loader uses its
firmware page allocator directly.

The x86-64 address-space layer now converts that physical plan into final user
or kernel mappings with permissions derived from the validated PE sections.
Headers remain read-only/NX, executable mappings are never writable, virtual
and physical alias checks are repeated, and all mapping identifiers are
generation-tagged. Installation is transactional: a conflict in any later
section removes every mapping installed earlier in the same attempt, leaving
no half-mapped executable. Hardware page-table construction and CR3 transfer
are separated behind this policy layer.

An original four-level x86-64 page-table builder now converts approved
mappings into hardware-format 4 KiB leaves through a minimal physical-table
storage trait. It allocates only zeroed table frames, validates every existing
intermediate entry, propagates user accessibility through all parent levels,
rejects huge-page collisions and duplicate leaves, and reuses the same NX/W^X
leaf constructor tested by the address-space policy. The builder returns its
root physical frame without performing privileged state changes. The UEFI
adapter supplies a real firmware page store, maps the PE, stack, handoff, GOP
aperture, and transition trampoline, then the assembly transition enables NX
and write protection, writes CR3, installs the erased stack, and jumps to the
authenticated entry.

Host timing/output code moved to the `mrml-kernel-bench` crate. The UEFI target
dependency graph is now only `mrml-uefi -> mrml-kernel -> mrml-crypto`.
`mrml-crypto` exposes a fixed-storage boot feature path while its runtime-backed
TLS, RSA, and ML-KEM helpers remain enabled by default for applications.

GOP is the primary early console because contemporary physical machines cannot
be assumed to expose a usable serial port. Only the standard 32-bit RGB-reserved
and BGR-reserved pixel layouts are accepted. Geometry, stride, byte length,
address overflow, and containment inside a normalized MMIO region are checked
before the framebuffer is admitted. The safe renderer clips nothing silently:
out-of-range pixels and rectangles are rejected and row padding is never used
as visible storage. Serial remains an optional developer diagnostic path.

The native artifact chain uses an original SHA3-512 Lamport signature verifier.
Production policy requires separately typed signatures for the Gigakernel, VM
images, service images, launch policy, and embedded CUDA-kernel bundle. Each
trust root pins the SHA3-512 digest of its public key and minimum artifact
version. Signed statements bind artifact type, version, byte length, and content
digest, preventing a CUDA signature from authorizing a VM image or an older
image from satisfying rollback policy.

Lamport keys are one-time keys: reuse for two different artifacts can reveal
enough private material to permit forgery. MRML therefore requires an
independent pinned key for every signed artifact/version. The current primitive
is hash-based and designed to resist quantum preimage attacks, but it is not a
NIST-standard ML-DSA implementation and has not received independent review.
The large 64 KiB public keys and 32 KiB signatures are accepted for the small
verified-boot set, not general network signing. Production-security claims
remain prohibited until the signing workflow, key lifecycle, loaders, recovery
path, and verifier receive external cryptographic and platform audits.

### Reproducible signing and bootstrap

`mrml-sign` is the original, dependency-free release signer. It runs after
compilation, never from a compiler build hook, so the build graph and repository
contents do not need access to private keys:

```text
mrml build org.mrml.tool.sign --target windows --release
mrml-sign keygen release.private release.public
mrml-sign sign-bundle kernel 1 mrml-kernel.exe release.private mrml-kernel.signed
mrml-sign key-digest release.public
```

Use `--target linux` for the equivalent Linux host tool build.

`sign-bundle` emits the sole boot-artifact representation: a fixed 112-byte
header, the 64 KiB public key, the 32 KiB signature, and the exact payload.
The header binds kind, nonzero version, payload length, and SHA3-512 digest.
The allocation-free decoder rejects unknown kinds, nonzero reserved bytes,
integer overflow, empty payloads, truncation, trailing bytes, digest mismatch,
wrong-type admission, rollback, unpinned keys, and invalid signatures. The
signer self-verifies before publication. All signer-created paths use the host
OS's exclusive create-if-absent operation rather than a racy existence check
followed by truncating creation. Signing removes the one-time private key before
publishing the signature or completed bundle: an output failure can abort that
release, but cannot leave a published signature with reusable key material. Key
generation publishes the non-secret public half before the private half, so
failure cannot strand a private key without its corresponding public key.
Failed exclusive writes make a best-effort removal of their partial output.
This is host-filesystem tooling behavior, not proof of independent key custody,
durable erasure, atomic multi-file publication, or reproducible builds.

Before provisioning the release journal, an owner-selected public key and
nonzero rollback floor can be encoded as the exact canonical genesis state:

```text
mrml-sign bootstrap-state 1 BOOTSTRAP.STATE owner.public
mrml-sign inspect-bootstrap-state BOOTSTRAP.STATE
```

Creation uses exclusive output publication and rejects wrong public-key length,
zero floor, zero derived root, or noncanonical state. Inspection reports the
minimum release, public root digest, optional installed-manifest digest, and the
literal status `authentication=not-verified`. This separation matters: an
ordinary file is provisioning data and gains authority only through a future
owner-authorized authenticated provisioning operation. The commands neither
enroll TPM objects nor establish trusted consent, live root replacement,
compromise revocation, development authorization, or accessible recovery.

Before signing, two independent builders can emit and compare a canonical,
path-independent build inventory:

```text
mrml-sign build-receipt first.receipt source.tar "rustc 1.x (...)" \
  x86_64-unknown-uefi release mrml.toml mrml.lock rust-toolchain.toml \
  kernel.efi service.efi loader.efi configuration.bin
mrml-sign compare-build-receipts first.receipt second.receipt
```

The source archive must itself be created canonically by the release process;
the receipt does not canonicalize a source tree. The receipt records no time,
username, hostname, build path, or general environment. It contains the exact
declared upstream-rustc version and target/profile plus byte lengths and SHA3-
512 digests for the source archive, MRML workspace manifest, MRML workspace
lock, toolchain lock, unsigned kernel, service, loader, and selected
configuration. Cargo is not a mandatory field; stage-zero Cargo provenance may
be recorded separately when relevant. Comparison accepts only the canonical
field order, lowercase fixed-width digests, canonical decimal lengths, bounded
printable metadata, a final newline, and byte-for-byte equality. A receipt can
be signed as a policy artifact after independent comparison. Matching receipts
prove equality only for these recorded declarations and bytes; they do not
prove clean builders, truthful version strings, complete source correspondence,
independent control, or reproducibility until independent builds actually match.
For configured release boot, sign that exact compared receipt as the policy
bundle for the same release:

```text
mrml-sign sign-bundle policy 1 first.receipt policy.private POLICY.SIGNED
```

The signer and loader share one bounded canonical parser. Before publishing a
new release transition, the loader requires the policy payload to name the
`x86_64-unknown-uefi` release target/profile, contain six nonzero digests, and
match the exact authenticated kernel and service payload lengths and SHA3-512
digests. The other identities are authenticated declarations: the loader does
not reconstruct the source archive, lockfile, loader, selected configuration,
or compiler/Cargo executables at boot. Receipt data grants no authority.

The repository's `x86_64-unknown-uefi` linker policy fixes the PE timestamp at
zero and disables the embedded PE debug directory. The latter otherwise carries
a nondeterministic linker-produced debug identity even when the source, target,
toolchain, and `SOURCE_DATE_EPOCH` match. Debug information may be retained as a
separate review artifact, but it is not embedded in the signed boot image. A
controlled same-host probe of commit `6976f8f` built the exact source archive in
two distinct source and Cargo target roots with rustc
`1.100.0-nightly (fb6531d55 2026-08-23)` and Cargo
`1.100.0-nightly (e8cb624d5 2026-08-22)`, using only the committed linker
configuration. A preceding diagnostic build without these controls found each
equal-length kernel, service, and loader image differed in exactly ten PE
metadata bytes. With the committed policy, the canonical receipts for all three
unsigned images matched byte-for-byte. The probe used an empty selected test
configuration. This is a controlled repeated build on one host, not
independent-builder, cross-platform, or complete configured-release evidence.

After generating distinct artifact keys and a next-release root, create and
sign the canonical 408-byte release manifest:

```text
mrml-sign manifest 1 release.manifest NEXT_ROOT KERNEL VM SERVICE CUDA POLICY
mrml-sign sign policy 1 release.manifest genesis.private release.manifest.sig
```

After a manifest is authenticated, `VerifiedRelease` no longer exposes the
underlying per-kind version-floor roots. Its artifact and executable admission
methods require the signed artifact version to equal the manifest release and
the requested kind to match before PE parsing. This prevents a valid artifact
from an adjacent release being spliced through a minimum-version check. The
With a complete compiled release-journal configuration, the UEFI loader now
loads the exact manifest and distinguishes repeat admission of its authenticated
installed digest from a new signed root transition. Kernel and service
executables plus bounded VM, CUDA, and launch-policy bundles are admitted
through the resulting single `VerifiedRelease`; a new transition is committed
only after all five exact kinds pass but before PCR 11 extension, keeping the
journal's read and publication policy coherent.
Later boot preparation failure retries through the installed receipt.
`PendingBootRelease` owns this sequencing: it records only successful exact
kernel, VM, service, CUDA, and policy admissions; rejects publication until all
five are present; retains state across a compare-and-store conflict for retry;
skips counter publication for an already installed manifest; and erases
predecessor/successor bytes after success or drop.
Required mode fails closed without the configuration, while optional mode keeps
the legacy independent-root path for development.
The loader expects `\EFI\MRML\RELEASE.MANIFEST`, `KERNEL.SIGNED`,
`VM.SIGNED`, `SERVICE.SIGNED`, `CUDA.SIGNED`, and `POLICY.SIGNED`; a new
transition additionally requires `RELEASE.PUBLIC` and `RELEASE.SIG`. VM and
CUDA payloads are bounded at 512 MiB and 64 MiB respectively; the policy
payload is a canonical build receipt within the 16 MiB signed-artifact input
bound. All three temporary firmware buffers are zeroed and freed after
measurement. Its six
all-or-none build fields
are `MRML_RELEASE_COUNTER_NV_INDEX_HEX`, `MRML_RELEASE_SLOT0_NV_INDEX_HEX`,
`MRML_RELEASE_SLOT1_NV_INDEX_HEX`, `MRML_RELEASE_POLICY_DIGEST_HEX`,
`MRML_RELEASE_PCR_DIGEST_HEX`, and `MRML_RELEASE_PCR_SELECT_HEX`.
`MRML_REQUIRE_RELEASE_MANIFEST=1` forbids fallback. If recovery journal fields
are also present, every release and recovery NV index must be disjoint.
Measured boot records configured release admission in a canonical 512-byte
version-3 selected set: distinct manifest kind `0x100` followed by artifact
kinds 1 through 5 share the exact release number and retain their verified
SHA3-512 digests. Each authenticated payload is also extended independently.
The legacy
192-byte development record now also labels the service correctly as kind 3,
not VM kind 2. These PCR records are evidence data and confer no authority.
The manifest codec now rejects duplicate key roles before encoding: its next
manifest root and five kind-specific roots are pairwise distinct. After the
current manifest signature is authenticated, transition independently rejects
that current root appearing in any next role. These checks prevent repository
code from authorizing a one-time Lamport key for multiple statements; they do
not attest external key deletion or independent human custody.

The canonical 152-byte release bootstrap state now has its own backend-neutral
authenticated journal. It is deliberately distinct from the 64-byte storage-
authority recovery state. Each 200-byte slot contains a release-state-specific
magic, exact journal sequence, complete state, and SHA3-256 digest. Publication
writes the inactive slot before advancing one monotonic counter and verifies
the newly selected state afterward. The store's CAS now compares the complete
predecessor, so a different current root or installed-manifest digest at the
same minimum release conflicts. The installed-manifest digest reconstructs the
exact committed release on repeat boots without replaying the one-time root
transition; genesis intentionally carries no installed receipt.
The UEFI command layer now separately admits one release counter and two exact
200-byte full-write NV objects by complete public area and recomputed Name. The
adapter uses fresh exact-operation owner-policy sessions, verifies full writes,
checks exact counter succession, and exposes a gate rejecting index alias with
the 112-byte recovery journal. Deterministic unit/simulation tests cover the
layout and composed publication path; TPM provisioning, reboot, and physical
power-loss validation remain pending.

Each digest argument is the 128-character SHA3-512 public-key digest printed by
`key-digest`. The kernel now decodes this exact representation, verifies it
against the current root, exposes typed artifact trust roots, advances the next
root, and raises the minimum acceptable release. Replaying the old manifest is
rejected after state advancement.

The signer refuses to overwrite keys or signatures, self-verifies before
writing a signature, and then consumes and removes the private-key file. Any
external backup of that one-time key must also be destroyed and must never sign
a second statement.

The bootstrap loader contains only a genesis public-key SHA3-512 digest and a
minimum release version, never a private key. That genesis key signs the first
canonical launch-policy artifact. The policy contains distinct one-time public
key digests for every kernel, VM, service, CUDA bundle, and the next policy
root. After successful verification, the next root digest and release counter
are sealed into TPM-backed monotonic state. Each release therefore authenticates
its successor without rebuilding trust from an unsigned file. Recovery uses a
separate offline root and must not lower the monotonic version. Until TPM/NVRAM
persistence and the canonical policy parser are implemented, this describes
the required bootstrap flow rather than an end-to-end completed secure boot.

The production design must replace the fixed project-centric bootstrap policy
with an owner-selected trust policy. Recommended MRML keys may ship as defaults,
but documented secure-attention/recovery flows must allow the owner to enroll or
replace roots, authorize an owner-built or narrowly scoped development
generation, and revoke compromised keys. Those actions change authenticated
policy; they do not lower the committed monotonic release state. This is
**PLANNED**, not evidence that current development signing implements owner-
controlled Secure Boot, measured boot, TPM persistence, or physical recovery.

Hyper-V and KVM are host backends, not code in the guest kernel. Both implement
the same VMM contract for vCPU lifecycle, guest memory, interrupts, virtio-like
queues, directory-handle grants, measured images, and optional IOMMU device
assignment. Bare metal uses native architecture modules and the CPU inference
backend until a separately isolated GPU service is available.

### Hosted kernel and nested VMX evidence

A freshly signed `pci_configuration_probe` Gigakernel package
(SHA-256 `5053c9cf6fe76ab26c5debca898c854377ee550158f50fd7981b9d5b746d1a6a`)
booted as a KVM guest in Arch WSL. The runner first rejected a substituted
package root, then verified virtual block PCI-MMIO write/read/flush, BAR
withdrawal and continued guest execution, guest replacement, and pending-I/O
reset isolation. This is a real Gigakernel image under the hosted KVM backend,
not execution as a guest of MRML's own native monitor. The default hosted
`boot` marker check did not pass and the separate SMP probe hit its runtime
deadline. Neither result qualifies a production or multicore guest boot.

The [UEFI VMX diagnostic](platform/UEFI_BOOT_MANAGEMENT.md#dragonair-gigakernel-vmx-test)
separately reaches a paged 64-bit guest under MRML's native VMX monitor inside
QEMU with nested KVM. That guest uses a tiny bootstrap workload. A native
Gigakernel-guest pass requires independent admission of the signed kernel and
package, PE relocation followed by supervisor-only section permissions,
guest-owned page tables and guarded stacks, a read-only canonical boot
handoff carrying the verified measurement, and entry through the actual
kernel ABI. The monitor must see a bounded, kernel-generated terminal result;
merely reaching VM entry does not qualify. The opt-in signed nested image
now reaches real kernel entry, validates its early boot handoff, and runs a
two-task scheduler smoke inside L2. The guest task runtime blocks an empty
receiver, denies a wrong endpoint capability, and completes an authorized
request/reply with the expected sender and sequence. Only then does the
monitor observe the designated completion exit. This verifies in-kernel
runtime APIs inside L2, not user-space task execution or installed services.
A separate non-yielding fixture returns control through the VMX preemption
timer, stays parked while the signed Gigakernel runs, then resumes its
interrupted VMCS and uses its own retained integer state to complete. That
does not yet establish preemptive runtime scheduling. The native
entry trampoline starts each freshly launched guest with zeroed general-purpose
registers (RSP is VMCS-owned). The cooperative switch test now requires each
of two guests to resume with its own register value, not merely with its
memory intact. The opt-in signed nested diagnostic now checks initial x87/XMM
state and preserves a timer-preempted guest's x87 data and XMM value across a
separate signed guest. The monitor checks that its own x87 rounding mode
returns unchanged. The legacy-state profile does not admit additional CR4 state
features such as OSXSAVE. This does not qualify extended vector state or
general untrusted-guest CPU-state isolation. In the same diagnostic a
separately signed Zstd service image now runs in a physically disjoint
MicroVM and processes a canonical ABI-3 decompress request through the real
native provider. The monitor supplies an NX read-only request and an NX
writable reply, validates the exact trapped completion and decoded reply,
and does not forward I/O. The measured Gigakernel now initiates that
request itself. The monitor parks it at an exact trapped instruction and
relays its request and the service's reply through the existing
capability-checked interface queue, rejecting a foreign endpoint, a replayed
reply, and a request after revocation. The resumed Gigakernel checks the reply
itself. The queue is monitor-owned, with bounded stopped-guest copies, not
a mapped peer queue or an installed service scheduler.

The recovered-deployment startup transaction now keeps provisional service
endpoints private until the complete admitted set and runtime proof both
succeed. On construction, admission, or proof failure it withdraws logical
routes and invokes backend teardown in reverse start order. A failed teardown
retains the exact endpoint for retry. Hosted KVM and WHP component runners
create the configuration launcher endpoint inside the transaction, before
they publish their runtime result. The signed two-required-domain unit test
injects a late startup failure and a failed first teardown, verifies no
running admission and no runtime proof, then retries the same endpoint and
checks that its token no longer opens the guest. It also verifies cleanup
order on a commit failure. A fresh signed v2 release completed the hosted
KVM component probe through this path with one classified domain in a
MicroVM, zero native fallback, and the expected halt. The configuration
suites pass 55 tests on each host; the KVM and WHP runners pass 16 and 12.
That single-domain probe did not exercise a live two-domain rollback.

The hosted KVM test now recovers a signed two-domain fixture and runs the
same recovered-owner publication transaction used by the component runners.
The first real KVM guest executes a marker before an injected second-service
startup refusal. An injected first stop refusal leaves that exact guest
owned by the failed transaction for retry, without publishing a route set
or runtime proof. A successful retry revokes its endpoint and releases the
guest. Recovering the same release again admits two fresh guests with zero
native fallback. The KVM and WHP component runners now reject a missing
complete preparation instead of allowing the generic single-route branch. Configuration launch generations are
unique across launcher objects in the same runtime; an endpoint retained
from the failed attempt cannot open or revoke a same-spec replacement. Both
new guests execute independent markers, including the second after retirement
of the first. Endpoint tokens are neither persistent nor cross-runtime
authority.

Verification: `mrml test org.mrml.service.config --target windows` and
`mrml test org.mrml.service.config --target linux` each passed 56 tests.
`mrml test org.mrml.tool.vmm-whp-run --target windows` passed 12, and
`mrml test org.mrml.tool.vmm-kvm-run --target linux` passed 16 with one
explicitly opt-in test. On Arch WSL with a usable KVM device, the opt-in test
passed when run as:

```text
target/mrml-native/linux/debug/mrml-kvm-run_bin_tests --ignored --exact tests::live_kvm_total_startup_rollback_and_same_spec_restart
```

This is hosted KVM evidence using small guest fixtures, not a two-service
installed-media boot, an independent kernel-resource audit, device/DMA
teardown evidence, or bare-metal validation. Startup and initial stop refusal
are injected at the host adapter; no backend-native stop failure was forced.
The release-mode component probes still use one domain for the existing ZIM
and Zstd pair. This change does not alter the Chromebook boot path.

Controlled shutdown of a recovered component probe now consumes the complete
runtime authorization and withdraws every running admission before stopping
the guest owner. KVM and WHP report readiness during startup and a distinct
`isolation-shutdown` event after the hosted cleanup path succeeds, rather
than reporting the stopped guest as running. Withdrawal produces only a
count of retired logical admissions, never a backend destruction proof or a
restart authority. The explicit live KVM test withdraws both admissions,
then retires the exact endpoints. This does not add crash supervision,
installed-media service restarts, or physical device/DMA teardown.

The same freshly signed `component-service-probe` fixture completed on KVM
and WHP and reported `runtime=withdrawn|retired_domains=1`. The Windows
release runner initially exited with `0xc00000fd` after authenticated recovery
with its default 1 MiB PE stack. The runner now reserves 8 MiB with the same
4 KiB initial commitment; the rebuilt executable completed the same signed
probe. This is a bounded hosted-runner setting, not a guest stack change.

Recovered activation now retains a bounded mapping from each authenticated
package ID to its assigned domain, version, class, and payload digest. The
hosted KVM and WHP component probes check the independently authenticated
Zstd executable against that exact assignment before constructing the guest.
This check does not grant routing or memory authority.

The opt-in KVM recovery test now builds two distinct PE service fixtures,
signs them under separate test roots, includes their actual payload digests
in one signed release, and rejects wrong-root or cross-domain substitutions.
The recovered owner starts the two executable images in separate KVM VMs.
They produce distinct markers; a write to the same guest-physical address
in the first does not appear in the second; and the second resumes after the
first is retired. The same test exercises failed startup, retries teardown
on the original guest, and rejects its retired endpoint after restart.
Windows and Arch Linux kernel suites passed (763 each). KVM runner tests
passed (16 plus the explicit live test); WHP runner tests passed (12). Fresh
signed grouped ZIM/Zstd component probes still pass on both KVM and WHP.
The separately signed two-VM test runs small diagnostic executables on hosted
KVM; it does not boot the installed service set, exercise peer IPC, or qualify
physical hardware. The grouped runner still launches ZIM and Zstd together.

The recovered hosted startup now preflights the complete eligible service
executable set before constructing its guest. The check consumes no routes
and rejects missing, duplicate, or mismatched package assignments. Every
member must carry its own authenticated package version and payload digest,
even when two packages share one domain. The provider still separately
matches the route's provider generation. KVM and WHP use this check for both
signed artifacts in the grouped ZIM/Zstd probe. The opt-in separate-VM KVM
test accepts either order and rejects incomplete, duplicate, and substituted
sets before creating the guest objects. A freshly signed release containing
ZIM version 1 and Zstd version 2 completed on both KVM and WHP with zero
fallback and retired its grouped domain. This service-only gate does not
implement installed-media discovery or peer IPC.

The implemented backend-neutral VM boundary uses a fixed 64-byte `MRMLHC01`
hypercall descriptor and a caller-owned copy buffer. Reserved bytes and
operation-specific unused fields must be zero, sequences are exact and advance
only after successful authorization, and tool, GPU, and shutdown operations
require distinct capability objects. Guest mappings are fixed-capacity,
page-aligned, non-overlapping in both guest and host address spaces, and never
writable and executable. A request buffer must fit wholly within one readable
mapping. Backend-owned pointers never enter the policy core. The common
`VmBackend` contract covers vCPU exits, bounded guest copies, and interrupt
injection. Its `RevocableVmBackend` extension removes an exact native mapping
before `revoke_mapping_before_resume` retires the common identity. KVM uses a
stable memory-slot identity and a zero-sized `KVM_SET_USER_MEMORY_REGION`
update; WHP unmaps every installed GPA subrange. A failed native teardown
poisons all later vCPU execution because the second-level mapping state can no
longer be proven. KVM has a prepared launch path and WHP has a native
long-mode lifecycle, memory, and register path. Both run signed one- and
two-vCPU kernel images, isolated CPL3 services, timer/preemption probes, and
authenticated mediated-GPU queues. General-purpose device models and bulk
shared-memory service queues remain separate production work; the hosted VM is
executable rather than a lifecycle-only prototype.

Guest mappings receive opaque monotonic identifiers and can be revoked or have
their permissions changed without exposing array slots. Revocation compacts the
bounded table but never reissues an old identifier. Permission changes retain
the W^X invariant, and translations fail immediately after revocation. Focused
simulation tests prove native-first ordering and preservation of the policy
identity on backend failure. The adapters compile on Windows gnullvm; live KVM
and WHP revocation execution has not yet been exercised for this path.

VM instances are tracked in a fixed-capacity lifecycle table with generational
identities. Only created images may become loaded, only loaded or cleanly
stopped VMs may run, and destroyed identifiers cannot control a replacement in
the same slot. Every run receives an explicit exit budget. Exceeding it moves
the VM to a failed state, bounding denial-of-service through pathological exit
storms and requiring an explicit destroy/recreate recovery path.

The common single-exit run path now translates one backend exit, charges the
VM's budget, and dispatches it through common policy. Port I/O is denied by
default and may be enabled only by an exact port, transfer-width, and direction
rule in a table capped at 32 entries. Unsupported exits and guest-memory faults
fail the VM instead of being reflected or silently resumed. A backend execution
error also fails the instance because its register and device state cannot be
assumed resumable. Concrete adapters remain responsible for translating native
exit structures into this deliberately small representation.

The first KVM adapter layer is implemented in the separate core-only
`mrml-kvm` crate. It decodes the kernel-owned `kvm_run` mapping as bytes instead
of creating references to its C union. I/O exits require one scalar transfer,
validated direction and width, and an in-bounds data offset. MMIO accepts only
1, 2, 4, or 8 byte accesses. MRML hypercalls use a dedicated number and require
all unused KVM arguments to be zero. Memory-slot encodings are page-aligned,
overflow checked, optionally read-only, and capped at 32 slots. Native file
descriptor ownership, KVM API-version validation, VM and vCPU creation,
memory-slot registration, bounded `kvm_run` mapping, and exit execution are
also implemented with RAII cleanup. System admission queries the stable KVM
extension interface and rejects hosts without `KVM_CAP_USER_MEMORY` or at least
five memory slots before VM creation; API version alone is not treated as proof
of optional capability support. The adapter now owns fixed-capacity
anonymous guest RAM, rejects overlapping GPA regions and cross-region copies,
enforces read-only host writes, registers slots transactionally, validates its
single vCPU identity, implements the common `VmBackend` copy/run methods, and
injects validated vectors through `KVM_INTERRUPT`. Register setup and
interrupt-chip creation are now implemented: vCPU entry and stack addresses
must be canonical, CR3 must be page-aligned, general registers begin cleared,
RFLAGS bit 1 is set, and long mode enables paging, protected mode, PAE, NX, and
supervisor write protection with explicit 64-bit code and data segments. The
bootstrap adapter deliberately omits KVM's in-kernel IRQ chip until interrupt
delivery is configured. Guest page-table construction and
the backing store for it are now shared with the Gigakernel's page-table
builder. A fixed guest-RAM arena returns only freshly zeroed frames and rejects
reads or writes to unallocated tables, out-of-range entries, read-only RAM, and
arena exhaustion. KVM therefore inherits the same hardware W^X, NX, user-bit,
and duplicate-mapping checks as bare metal. PE materialization and final
section mapping are implemented, but their public entry points accept only a
`VerifiedExecutable` produced by signature verification. The exact image size
is zero-filled and relocated in owned RAM, every mapping is prevalidated before
hardware tables change, and final permissions come only from the validated PE
load plan. A late page-table storage failure discards the unpublished VM.
Canonical boot-handoff placement is also implemented. The complete handoff is
decoded and validated before guest memory changes, must occupy isolated
page-aligned storage, and has its unused page tail zeroed before being mapped
read-only and NX. This prevents a malformed record from partially replacing the
previous launch state. Host attestation remains part of the VMM trust boundary;
the handoff cannot make an untrusted host truthful. A fail-closed launch
transaction now composes these stages and publishes only `PreparedKvmGuest`:
it validates physical and virtual ranges, creates the VM and vCPU, registers up
to five disjoint memory slots, installs the signed image, immutable
handoff, guarded stack, and page tables, then writes CR3 and entry registers
last. The Microsoft x64 entry frame places the handoff pointer and length in
RCX/RDX and reserves a zero return slot with the required stack alignment.
Low-level construction and mutable backend extraction are not public. The Arch
WSL2 environment now exposes nested KVM through Hyper-V enlightened VMCS; API
version 12 and the 12,288-byte vCPU mapping query both succeed. A live regression
constructs and verifies a complete Lamport-signed VM artifact, materializes its
PE at a canonical supervisor high-half address, creates the VM and vCPU,
five memory slots, and hardware page tables, enters at the signed entry point,
writes a known pixel into the handoff-authenticated framebuffer, executes
`HLT`, and observes both `VmExit::Halted` and the pixel through a bounded guest
copy. Kernel launch derives the identity-mapped, supervisor-only, writable, NX
framebuffer solely from the validated handoff and rejects overlap with every
private launch region.
This proves the complete signed artifact-to-native-KVM execution and framebuffer
boundary. The core-only `mrml-kvm-run` host utility now verifies a release public
root and signed kernel bundle, prepares that same bounded launch environment,
and executes the real four-section, 8,704-byte standalone kernel PE at a
canonical supervisor high-half address. Nested KVM reaches the kernel-owned
framebuffer marker and reports its final halted state. Bootstrap launch omits an
in-kernel IRQ chip so the current interrupt-disabled `HLT` is observable; adding
an interrupt controller belongs with the timer and scheduler rather than this
one-shot boot proof.

The runner obtains 256 bits of fresh boot entropy from the host operating
system's cryptographic generator and places the verified artifact's actual
SHA3-512 digest in the handoff measurement field. It accepts an explicit nonzero
minimum release version and rejects older signed bundles before creating a VM.
It claims secure loading because signature and PE policy verification occurred,
but deliberately leaves measured-boot and rollback-protected evidence clear:
software hashing is not a hardware trust-anchor measurement, and a command-line
version floor is not persistent monotonic rollback state.

Successful launches report monotonic microsecond timings separately for
signature and PE verification, VM preparation, first kernel execution, and
total runner latency. These measurements are observational and never affect an
admission decision; they provide stable phase boundaries for performance
regression tracking without weakening fail-closed behavior.
On the current Arch WSL2 nested-KVM host, five consecutive release launches
measured 725--2,095 microseconds for verification, 1,065--1,986 microseconds for
VM preparation, 130--228 microseconds from `KVM_RUN` through the kernel marker
and halt, and 2,025--4,522 microseconds total. These are a recorded development
baseline, not a portable performance guarantee.

The reproducible integration sequence is:

```text
mrml build org.mrml.system.bootloader --target uefi-x86_64 --release
mrml build org.mrml.tool.sign --target linux --release
mrml build org.mrml.tool.vmm-kvm-run --target linux --release
mrml-sign keygen release.private release.public
mrml-sign sign-bundle kernel 1 mrml-kernel-pe.efi release.private kernel.signed
mrml-kvm-run kernel.signed release.public 1 boot
```

Use the explicit `fault-probe` mode only with a signed kernel built with the
matching feature. It requires a halted VM and an untouched framebuffer; normal
boot requires the authenticated color marker. Unknown modes fail before file or
VM access. Unexpected exits capture only bounded architectural state and walk
the faulting address through guest-owned page tables for precise diagnostics.

The allocation-free `kvm_run` decoder validates the fixed x86 header before it
reads the kernel-owned union: padding is zero, readiness and IF fields are
boolean, only the defined SMM flag is accepted, and CR8 is bounded. Port I/O is
limited to one scalar transfer and its data offset cannot alias exit metadata.
MMIO requires zero padding and an exact supported width. MRML hypercalls require
the private number, one descriptor argument, zero unused arguments and return
state, zero padding, and a long-mode origin. Exception vectors above 31 fail
closed. These checks keep malformed kernel ABI state from becoming a broader
backend-neutral operation.

The separate core-only `mrml-whp` crate now provides the first Windows
Hypervisor Platform boundary without SDK bindings, import libraries, `std`, or
third-party crates. It dynamically resolves the documented C entry points from
`WinHvPlatform.dll`, validates the hypervisor-present capability and its exact
result size before allocating a partition, creates a one-vCPU partition in the required property,
setup, and vCPU order, and unwinds partial construction with owned guards.
Guest ranges must be page-aligned, nonempty, overflow-free, nonoverlapping, and
W^X. Fixed-capacity, zero-initialized host allocations are filled before being
mapped, are never exposed as mutable pointers, and are unmapped before the vCPU
and partition are deleted. Exit decoding reads the documented byte layout
instead of borrowing the C union: halt and cancellation translate directly,
I/O widths and reserved bits are checked, and memory exits preserve the exact
read/write/execute fault type rather than inventing an MMIO width. Unknown or
unfaithfully representable exits fail closed. The public native object is
`PreparedWhpPartition`; raw partitions and partially initialized vCPUs cannot
escape construction, and its lifetime is tied to the loaded DLL so resolved
function pointers cannot outlive their code. Both native VMM crates now also
expose a bounded firmware-entry probe: 64 MiB of low RAM and one exact page-
aligned firmware image of at most 16 MiB are mapped below 4 GiB, and the
bootstrap processor starts at architectural
`F000:FFF0`. Controlled 4 KiB stubs executed that reset vector and returned the
same decoded port-I/O proof under live WHP and nested KVM on 2026-08-25. This is
reset-vector execution evidence only; OVMF, UEFI services, boot media, and
package-derived firmware boot remain unimplemented in the native runners.
WHP uses RW/NX low RAM and RX firmware at its GPA boundary. KVM makes firmware
guest-read-only, but its memory-slot API cannot encode NX; no equivalent KVM
second-level execute-permission claim is made.
Hardened x64 register setup now
validates canonical entry/stack/handoff addresses, aligned CR3, Microsoft ABI
stack alignment, and bounded handoff length. It installs explicit long-mode,
PAE, supervisor write-protect, NX, RFLAGS, code/data segments, and RCX/RDX
handoff state through one register transaction. The launch transaction now
accepts only a `VerifiedExecutable`, validates the complete boot handoff before
native allocation, creates four disjoint table/image/handoff/stack mappings,
materializes and relocates the PE image, builds section-specific W^X page
tables, maps the handoff read-only and NX, writes a guarded ABI stack, and
programs CR3 and entry state last. Only `PreparedWhpGuest` is published after
all stages succeed. A live Windows test now creates and deletes an actual WHP
partition, vCPU, and guest mapping when the host reports Hyper-V present.
The partition enables WHP's xAPIC emulation before setup, and prepared guests
can request fixed, edge-triggered, physical-destination interrupts through the
documented 16-byte control record. Architectural vectors 0--31 and vector 255
are rejected before the host call. `PreparedWhpGuest` now implements the same
`VmBackend` run, bounded-copy, and interrupt contract as KVM and rejects every
vCPU identity except its single configured vCPU. Long-mode state also sets the
architectural MP, ET, and NE control bits and a 32/64-bit data-segment stack
width instead of relying on reset-state defaults. Launch now reserves a fifth
isolated page for a canonical two-entry GDT, maps that descriptor page read-only
and NX, supplies GDTR and the reset PAT value, and reads back all fifteen
critical general, segment, table, control, and MSR values after WHP accepts the
state. The readback tolerates only WHP's documented derivation of EFER.LMA;
every requested bit and all other values must match exactly. The initial probe's
real-mode exception-13 vector access at `0x34` was traced to a cached CS limit
of `0x000f_ffff`: the entry RIP at `0x20_0000` exceeded that limit before the
processor activated long mode. The cached segment limit is now
`0xffff_ffff`. A live regression guest builds hardware page tables, enters
x86-64 mode, executes an `INT3`, and returns the expected breakpoint vector
through WHP. Breakpoint exits are explicitly enabled in partition policy and
decoded with reserved-bit validation. The native launch path now records the
temporary writable image allocation, materializes the verified PE, removes the
temporary GPA view, and installs one second-level mapping per validated PE load
region. Headers become read-only, code becomes read/execute, data may become
read/write, and writable/executable sections are rejected. If any replacement
mapping fails, the already-installed fragments are removed and the original
non-executable writable mapping is restored so cleanup remains deterministic.
A live Windows regression constructs a complete Lamport-signed VM artifact,
verifies its trust root and statement, loads its PE32+ image, proves its code
page is immutable after sealing, enters long mode at the signed entry point,
executes `INT3`, and observes the expected breakpoint vector. This demonstrates
the complete verified-artifact-to-native-execution boundary on Hyper-V;
the separate repository UEFI-to-kernel integration gate is exercised by the
QEMU loader runs above, including the signed two-vCPU periodic scheduler proof.
The WHP exit decoder validates the common x86 VP prefix before consuming any
exit union, including execution-state and reserved fields. Memory and port-I/O
exits bound the captured instruction length and require all ABI-reserved bytes
to remain zero. A claimed valid GVA must be canonical. Port-I/O forwarding is
limited to scalar 1-, 2-, or 4-byte operations; string and REP forms fail closed
because the backend-neutral exit type does not carry their RCX/RSI/RDI state,
and scalar RAX data is masked to the declared width before policy sees it.
Exception exits accept only architectural vectors 0--31, validate their
captured instruction and reserved fields, and reject an error code unless WHP
marks it valid. Host-cancellation exits accept only the defined user-cancel
reason, while interrupt-window exits accept only interrupt, NMI, or exception
delivery types. Undefined control reasons never become a generic interruption.

Interrupt injection is a separate capability-authorized path. The caller must
hold `SIGNAL` authority for the VM's dedicated interrupt object and the vector
must be present in a 256-bit allowlist. Architectural exception vectors 0--31
and vector 255 cannot be enabled. Injection is accepted only while the VM is
running; a backend injection failure moves it to the failed state because
delivery may have partially changed backend state.

## Performance policy

Fast IPC alone is insufficient. MRML will measure call frequency, duplicate
state, cache misses, VM exits, TLB invalidation, context switches, model-token
latency, and throughput. Shared read-only rings carry bulk tensors and tool
payloads while capability-checked IPC remains the control plane. No shared
mutable kernel metadata is exposed to untrusted services. Isolation relaxation
requires a shared trust domain, benchmark evidence, and a documented threat
model.

This follows the useful lessons reported for Huawei's production HongMeng
microkernel: keep a minimal core and least-privileged services, reduce IPC
frequency and duplicate bookkeeping, separate control and data planes, and keep
paging mechanisms in the kernel while policy remains outside. MRML does not
adopt HongMeng's Linux ABI goal or its security/performance compromises without
independent justification. The paper reports that those compromises can add
attack surface, so they are not defaults here.

Primary references: [HongMeng production microkernel, OSDI
2024](https://www.usenix.org/conference/osdi24/presentation/chen-haibo) and
[functional verification of OpenHarmony LiteOS-M, FM
2026](https://doi.org/10.1007/978-3-032-26220-2_32). These are research inputs
only and contribute no source code to MRML.

## Verification gates

Verified release state has a canonical 152-byte encoding containing the current
root digest, minimum accepted release, and exact installed-manifest digest. The kernel advances it only through
an authenticated monotonic-store compare-and-store operation, so concurrent or
stale updates fail instead of overwriting newer trust state. A conforming
platform backend must use TPM NV or an equivalent authenticated, power-loss
atomic facility; a normal host file is not a conforming backend. The encoding,
rotation, corruption, conflict, and replay paths have unit tests. The concrete
TPM NV path now links into an optimized native `x86_64-unknown-uefi` loader;
the direct crypto dependency excludes its unused host runtime, and
`mrml-runtime` is absent from the firmware graph. Owner provisioning, native
recovery-enabled firmware execution, physical power-cut testing, and any
rollback-resistance claim remain pending. A fresh QEMU/OVMF nested-KVM boot of
pinned, independently signed kernel and service artifacts produced `a1 a2 a3
a4 a5 a6 a7 a8 b1 b2 b3 d0 d1 d2 d3 d4 df`, proving the native loader through
kernel entry and the existing VMX-root lifecycle. Recovery variables were not
embedded because no software TPM was available, so the journal path did not
execute. The ordinary signed service build used by this probe also corrected
its shared-buffer parameter binding and excludes recovery-only imports unless
the block-service feature is selected.

Boot admission also requires a coherent signed artifact set: exactly one
kernel, VM image, service image, CUDA kernel bundle, and launch policy from the
same release as the firmware evidence. The verified kernel content digest must
equal the measured-boot kernel digest. Individually valid artifacts from
different releases therefore cannot be spliced into an accepted boot chain.

Each milestone requires Windows gnullvm and Arch Linux builds/tests, parser and
capability fuzz-style adversarial vectors, unsafe/FFI review, boot tests under
both hypervisors where applicable, and before/after latency and throughput
measurements. Production-security claims additionally require an external
audit, reproducible signed builds, verified boot, rollback protection, IOMMU
tests, side-channel analysis, and machine-checked capability/noninterference
properties. Until those exist, the kernel remains experimental.

Run the current release microbenchmarks with:

```text
cargo test --release -p mrml-kernel-bench -- --ignored --nocapture
```

They report authorization, scheduling, IPC, wakeup, transfer, revocation,
shared-binding, domain-handoff, and virtual-block transaction/notification
policy costs.
The generous automated ceiling detects catastrophic regressions; comparative
optimization decisions require repeated samples on pinned hardware and a
recorded baseline.

The 2026-08-23 Windows gnullvm Phase 1 observation used 100,000 iterations per
sample (10,000 for the larger domain handoff):

| Operation | Mean |
| --- | ---: |
| one-way IPC authorization/copy policy | 88.576 ns |
| two-direction IPC round-trip policy | 150.025 ns |
| blocked receiver delivery/wakeup/dequeue/reblock | 174.810 ns |
| attenuated capability transfer plus receiver revoke | 2.969 ns |
| capability revoke plus reissue | 5.311 ns |
| shared binding setup plus authorized revoke | 2.348 ns |
| two-way cross-runtime domain detach/attach | 330.240 ns |
| affinity-pinned distinct-core ownership-mailbox round trip | 136.201 ns |

These are throughput-derived optimized policy averages. The affinity benchmark
parsed Windows processor-core topology, selected group 0 logical CPUs 0 and 2
from distinct core records, pinned and verified both threads, and transferred
each non-copyable token through the kernel `OwnershipMailbox` in both
directions. The cross-runtime case itself does not prove physical placement,
and the shared-binding case does not include native page-table changes. None is a syscall, context
switch, hypervisor, or end-to-end service latency measurement. Hardware-backed
comparisons require pinned repeated samples and exact environment evidence.

A separate live WHP release observation mapped and revoked one writable 4 KiB
GPA 10,000 times in one prepared partition. The complete lifecycle—including
host `VirtualAlloc`/`VirtualFree`, `WHvMapGpaRange`, and `WHvUnmapGpaRange`—took
240,192,000 ns total, or 24,019 ns per iteration. This is Windows WHP evidence
only. A matching Arch Linux/WSL2 `/dev/kvm` release run completed 10,000
allocation, `KVM_SET_USER_MEMORY_REGION` registration, zero-sized slot removal,
and `munmap` lifecycles in 692,148,811 ns total, or 69,214 ns per iteration.
Both measurements include host allocation overhead and are backend-specific;
neither is bare-metal or physical-hardware evidence.

Baseline recorded 2026-08-20 and rechecked on Arch Linux 2026-08-21 on the current development host, one million
iterations per sample:

| Environment | Capability authorization | Scheduler selection | VM exit accounting |
| --- | ---: | ---: | ---: |
| Windows `x86_64-pc-windows-gnullvm` | 548,200 ns total (548 ps/op) | 1,859,500 ns total (1,859 ps/op) | 729,600 ns total (729 ps/op) |
| Arch Linux under WSL2 | 547,390 ns total (547 ps/op) | 1,862,494 ns total (1,862 ps/op) | 728,894 ns total (728 ps/op) |

These measure optimized in-process policy operations, not VM exits, page-table
changes, context switches, or end-to-end IPC. Sub-nanosecond averages can result
from pipelining across independent iterations and must not be presented as
single-operation latency.

The kernel scheduler now has a bounded timer-driven owner above the existing
weighted round-robin policy. Timer frequency is restricted to 10--100,000 Hz,
the quantum must be nonzero and no longer than one second, tick overflow fails
closed, and preemption occurs only at an exact quantum boundary. Blocking and
termination clear the current identity before selecting a replacement; removal
advances its generation so a faulted task can never be woken or resumed through
a stale handle. Windows and Linux tests cover preemption, idle wakeup, task
termination, stale identities, and invalid timer policies. A separate release
microbenchmark now measures tick accounting. Validated x2APIC/xAPIC timer
programming and acknowledgement primitives now execute in the signed KVM guest;
the same primitives also execute in the signed WHP guest. Timer-driven context
capture and restoration now execute across distinct service CR3 roots on both.

The x86_64 architecture layer now defines a fixed user-context record and a
generational task-to-context table. New contexts require a nonzero page-aligned
CR3, canonical lower-half entry point, nonzero 16-byte-aligned initial stack,
fixed ring-three code/data selectors, and a minimal initial RFLAGS value.
Contexts captured from traps must carry those exact selectors and may contain
only explicitly enumerated user-modifiable status flags; IOPL, NT, VM, RF,
reserved high bits, kernel addresses, and zero roots fail closed. Binding,
replacement, lookup, and revocation use the complete generational `TaskId`, so
a context belonging to a terminated task cannot attach to a reused scheduler
slot. Windows and Linux tests exercise selector, flag, address, CR3, duplicate,
revocation, and stale-generation rejection. GDT user descriptors, TSS/RSP0,
assembly restore, CR3 switching, live ring-three entry, cross-root timer
preemption, and guarded privilege stacks are exercised by signed KVM and WHP
probes. Privilege-stack planning is now CPU-indexed for 1--256 CPUs. Its checked
stride reserves disjoint physical and virtual 192 KiB arenas, including a
measured 64 KiB early stack and both internal guard pages, and rejects invalid
counts, undersized strides, range
wrap, addresses beyond the 52-bit physical limit, noncanonical virtual
coverage, and invalid indices before page-table
construction. CPU 0 now uses that allocator in UEFI, KVM, and WHP launches.
Its GDT, complete IDT, TSS, RSP0/IST1 ownership, CPU identity, and transition
stack are held in one 4 KiB-aligned non-copyable `CpuDescriptorState`; table
installation refuses an out-of-range owner and repeat initialization. The
signed service lifecycle still completes under WHP and nested KVM after this
privileged-path refactor. A QEMU 11.1 TCG/UEFI boot of the plain kernel produced
1,022,848 background pixels at `RGB(11,59,90)` plus the exact 1,152-pixel gold
kernel marker at `RGB(255,200,87)`. Application-processor discovery and
sequential startup now execute in the PE kernel. The same path now completes in
a signed two-vCPU nested-KVM guest. Its VMM normalizes CPUID topology and APIC
identities, creates the in-kernel interrupt controller before either vCPU,
starts CPU 1 in KVM's architectural uninitialized MP state, and waits for that
state to become runnable before entering `KVM_RUN`. The authenticated handoff
binds the synthetic two-CPU MADT, low trampoline, and identity-mapped privilege
stack arena. CPU 1 proves descriptor installation and generation-one
acknowledgement independently of CPU 0's proof that topology discovery,
startup, and trampoline revocation completed. A 2026-08-21 Arch Linux/WSL2
run measured `verify=914us`, `prepare=11061us`, and `execute=4181us`.
Windows WHP now completes the same signed two-vCPU proof. WHP requires each VP
to enter its run state before emulated INIT delivery completes, and its
second-level GPA permissions independently enforce execute access. The VMM
therefore pauses CPU 0 immediately after the signed kernel seals the fully
installed trampoline, changes that GPA from RW/NX to RX, starts CPU 1, and
resumes CPU 0 for INIT/SIPI. CPU 1 installs its private descriptors and emits a
pre-acknowledgement proof; while that intercepted instruction keeps CPU 1
stopped, the VMM restores RW/NX and resumes it to acknowledge. CPU 0 then zeroes
and revokes the page. The trampoline's GDT descriptors are constructed with
their accessed bits already set, preventing the processor from attempting a
write to sealed RX storage during segment loads. The 2026-08-22 signed run
measured `verify=16945us`, `prepare=4261us`, `execute=39653us`, and
`total=64164us`. The signed `smp-scheduler-probe` then advances beyond boot-only
AP acknowledgement on both native hypervisors. CPU 1 initializes a scheduler
instance in its exclusively owned slot, binds that slot to the observed local
APIC identity before publication, programs its own periodic local-APIC timer,
and enables interrupts. Vector 32 enters CPU 1's private IDT, TSS entry stack,
and dispatcher; the dispatcher resolves exactly one published APIC owner,
advances exactly one local scheduler tick, acknowledges EOI, and emits a
CPU-indexed terminal proof. CPU 0 independently proves completed startup and
trampoline revocation. The 2026-08-22 signed runs measured `total=52565us` on
nested KVM and `total=63092us` on WHP. The signed `smp-ipi-probe` now implements
and verifies directed rescheduling with cross-CPU ownership transfer. CPU 1
release-publishes an APIC-bound scheduler containing one running task, then
enables interrupt acceptance without programming an unrelated timer. CPU 0
waits with a bounded calibrated deadline, creates a task in its own scheduler,
retires the source identity into a non-copyable policy ticket,
release-publishes that ticket through a bounded atomic mailbox, publishes
exactly one reschedule request, and sends fixed-delivery vector 33 to the
MADT-selected APIC destination. CPU 1 requires an exact ring-zero vector,
resolves exactly one APIC owner, consumes the request and ticket once, admits a
fresh local identity, switches to it, acknowledges EOI, and emits a
CPU/task-bound proof. Full mailboxes and destinations return the still-linear
ticket rather than duplicating or losing ownership, and tests prove stale
source identities cannot be revived. The 2026-08-22 freshly signed runs
measured `total=82233us` on nested KVM and `total=28172us` on WHP. The same
signed path now publishes CPU 1's validated occupied/runnable load snapshot.
CPU 0 applies one-task hysteresis to its three-runnable-task scheduler, retains
the current task, deterministically detaches one non-running responsive task,
and transfers it to CPU 1. CPU 1 verifies the preserved priority and its new
two-task load before switching. Fresh policy-selected runs measured
`total=64381us` on nested KVM and `total=62785us` on WHP. The allocation-free
`PeriodicBalancer` now supplies its bounded policy foundation. It rejects
invalid topology/local identity, zero cadence, clock regression, and deadline
overflow; advances its next deadline from the observed tick to avoid catch-up
storms; skips full or insufficiently underloaded peers; and rotates equal-load
candidates. Windows and Linux tests cover cadence, delayed ticks, tie rotation,
capacity, and fail-closed time/topology handling. Repeated live timer/IPI
orchestration is exercised by the signed periodic proof below. The release-mode
256-CPU scan measured 348 ns
per poll on Windows and 341 ns on Linux. The signed two-vCPU CPL3 migration
path now uses this policy to select its published destination load before
detaching the complete domain; fresh KVM and WHP runs both reached the terminal
CPU/task proof. The signed `smp-periodic-balance-probe` now exercises repeated
timer-driven invocation. CPU 1's local APIC supplies two real timer events;
CPU 0 accounts both scheduler ticks and publishes two complete responsive
domains; directed vector-33 IPIs make CPU 1 consume and admit both tickets.
The proof checks each intermediate load and terminates only at source load
three and destination load three. Fresh release runs measured
`total=130536us` on nested KVM and `total=224797us` on WHP. Initialization is
split from the non-returning run phase so its large bounded frame is unwound
before interrupt entry. A fresh two-CPU QEMU TCG run then admitted the same
signed kernel through `mrml-loader.efi`, crossed `ExitBootServices`, completed
INIT/SIPI startup, handled both AP-local timer events and both migration IPIs,
and produced terminal debug trace `70 71 81 83 85 76 76 87 82 72 84 86 76 77
88`. This closes the UEFI-to-live-SMP-scheduler integration gate without host
interrupt injection. The
`PeriodicDomainBalancer` couples this cadence to the complete-domain ticket and
typed ownership mailboxes. A full destination mailbox retains the unpublished
ticket inside the controller; every later call retries it before considering a
new tick. Windows and Linux tests force that pressure path, drain the competing
ticket, and prove the exact saved context and capability reach the destination
without duplication, loss, or reordering. The
timer-facing entry accounts the scheduler tick first and requires the caller's
published local load to equal the runtime snapshot before cadence or detachment.
Windows and Linux tests prove a pre-deadline tick remains local, the exact
deadline publishes one domain, and a stale snapshot fails without advancing
time or ownership. The
task runtime now extends migration from scheduler metadata to a complete linear
user-domain ticket containing the saved CPL3 context and page-table root,
capability space, and bounded IPC inbox. Admission consumes the ticket only
after both runtime and scheduler capacity checks; failure leaves it in
caller-owned storage for retry without allocation or a large result value.
Windows and Linux tests prove context, authority, and queued-message
preservation, full-destination recovery, fresh destination identity, and exact
restoration when detaching the current domain is rejected. The signed SMP IPI path
transfers the complete domain through the typed mailbox, admits it into a
CPU1-owned `TaskRuntime`, validates the preserved responsive priority and saved
instruction pointer, verifies the resulting two-domain load, and schedules the
fresh CPU1 identity. The `smp-service-migration-probe` validates the migrated
service CR3 and entry, changes to CPU 1's supervisor-only TSS stack, restores
the complete context with `IRETQ`, executes the separately signed PE service at
CPL3, receives its `INT 0x80`, and emits a CPU/task-bound terminal proof. Fresh
2026-08-22 runs measured `total=56057us` on nested KVM and `total=63323us` on
WHP. The increased runtime
mapping made the old 32-page page-table pool fail closed during launch, so KVM
and WHP now provision 64 checked table pages for this mode. Each isolated
service root maps every provisioned CPU's entry and double-fault stacks with
checked address arithmetic and supervisor-only permissions. The
bounded discovery foundation
uses a parser that accepts only a complete loader-copied ACPI MADT with a
valid signature, exact encoded length, checksum, entry geometry, reserved
fields, unique APIC/firmware identities, at least one enabled CPU, and at most
256 CPUs. It supports legacy local-APIC entries, x2APIC entries, and one aligned
52-bit local-APIC address override. An AP lifecycle requires ordered INIT and
SIPI publication and an acknowledgement from the exact expected APIC;
generational attempt tokens prevent late acknowledgements from reviving failed
or retried slots. The architecture layer can now traverse an RSDP through a
checksummed XSDT or RSDT using bounded physical reads, reject malformed roots
and missing or duplicate MADTs, and independently revalidate the caller-owned
MADT copy. The handoff ABI now optionally appends this snapshot under an
explicit presence flag and 8 KiB bound. Its encoder and decoder independently
enforce the APIC signature, internal and enclosing lengths, and checksum, while
the original handoff remains valid when no snapshot is present. The UEFI loader
now snapshots through ranges admitted as ACPI by the final memory map after
`ExitBootServices`, uses the extended encoder, and maps every handoff page
read-only. Kernel entry performs full bounded topology parsing before normal
initialization. Directed xAPIC/x2APIC INIT and SIPI encodings and their CPL0
publication path are implemented with destination/vector checks and bounded
delivery-status polling. An invariant-TSC-only timing source implements the
architectural 10 ms INIT and 200 microsecond SIPI waits without a guessed
frequency. A generated, page-sized trampoline installs its own GDT, enables
PAE, EFER.LME, and EFER.NXE before paging and long mode using an identity-mapped
32-bit CR3, selects a CPU-private
aligned stack, passes the bounded CPU index, and jumps to a canonical kernel
entry. Its low-memory page is bound to the lifecycle's SIPI vector. A common
installer enforces read/write+NX to read/execute+non-writable, verifies the
final permissions, and revokes and zeroes every failed installation; only its
opaque installed result may publish SIPI. The WHP implementation allocates a
dedicated low guest-physical page, stages it RW/NX, replaces the GPA mapping
with RX, and verifies the copied bytes and denied guest write against the live
Windows hypervisor. UEFI, KVM, and WHP live AP execution and hosted SMP
scheduling are now verified. The common page-table builder
now supports an
exact-match protection transition: it preflights every 4 KiB leaf, physical
frame, and old permission before changing any logical mapping. This supplies a
supervisor-only low-page RW/NX-to-RX path for a BSP-built relocated trampoline
without accepting missing, huge, aliased, or concurrently changed entries.
The canonical SMP handoff carries the exact selected low page together with a
page-aligned physical base for the complete bounded AP privilege-stack arena;
the pair cannot be encoded independently. UEFI obtains the trampoline with
`AllocateMaxAddress`, zeroes and maps it RW/NX, allocates disjoint early, entry,
and double-fault stacks for all 256 bounded CPU indices, leaves both guards in
every slot absent, and iteratively
identity-maps only the page-table frames its builder actually allocated, so new
frames created during that operation are included without mapping unrelated
loader storage. Every table frame is allocated below 4 GiB because the AP's
real-mode transition must load CR3 through a 32-bit register; allocation fails
instead of producing an unbootable trampoline. A no-allocation active-CR3 view
applies exact-match changes,
accepts and preserves only hardware Accessed/Dirty leaf changes, and issues
`invlpg` for every transitioned address. The active adapter requires the
exact identity-mapped supervisor RW/NX leaf before copying, seals through the
checked RX transition, and on a later failure changes RX back to NX, zeroes the
page, removes only the expected leaf, invalidates it, and verifies absence.
Because the image embeds one AP's CPU index and stack, startup is sequential:
after that AP acknowledges leaving the trampoline, its opaque installed token
can return only the exact RX leaf to a zeroed RW/NX staging state for the next
AP. The WHP backend exercises this full transition against the live hypervisor.
The image also carries the opaque startup generation in RSI. A bounded atomic
rendezvous publishes that generation before SIPI and accepts the AP's online
acknowledgement only from the matching CPU slot and generation; stale or
duplicate arrivals fail closed, and failed slots require an explicit rearm.
The PE kernel's explicit SysV AP entry validates those three arguments,
constructs its CPU-private descriptor state in a disjoint static slot, installs
its GDT/IDT/TSS using the guarded entry and double-fault stacks, and only then
publishes online. The BSP performs sequential INIT/SIPI startup, retries once,
rejects a missing acknowledgement, rearms the shared page only after the AP has
left it, then zeroes and unmaps it after the final AP. QEMU TCG uses an explicit
compile-time TSC frequency and longer host-thread scheduling allowance without
changing production's invariant-TSC-only hardware timing. A freshly generated
one-use Lamport key signed the exact two-vCPU test kernel; its byte trace reached
AP acknowledgement, trampoline rearm, final revocation, and normal BSP return.
A fresh 2026-08-22 build of the current loader and kernel repeated this result
with terminal trace bytes `28 29 2b 26 27 30 05` under QEMU 11.1 TCG/UEFI.
QEMU register inspection showed both CPUs halted in kernel code with a shared
CR3 and distinct GDT, IDT, and TSS addresses.
Platform-backed service page
erasure/reprovisioning and one bounded restart are complete for the hosted
WHP/KVM proof.

The first Phase 2 system-service foundation now lives outside the privileged
kernel in `mrml-config`. It stores a fixed schema and fixed-capacity values,
rejects zero/duplicate setting identities and duplicate authority objects, and
supports Boolean, bounded unsigned, and bounded byte values. A commit requires
exact CONTROL authority for the configuration root plus exact WRITE authority
for every schema-bound setting object. It preflights the complete transaction,
including duplicate settings, current revision, value constraints, capability
generations, revision overflow, and audit-sequence overflow before the first
write. Reads independently require exact READ authority. Bounded audit storage
uses monotonic sequence numbers and reports the precise oldest retained event
rather than silently hiding overwrite gaps. Secrets are not a configuration
value class.

The version-1 configuration protocol has strict fixed headers and at most four
inline updates. It binds nonzero request identity, expected revision, setting
identity, canonical value kind/length/tail bytes, and exact encoded length;
unknown versions, operations, nonzero reserved bytes, truncation, and hidden
tail data fail closed. For kernel-message dispatch, authority fields are
canonical zero placeholders. The dispatcher accepts authority only from the
message's exact receiver-space capability sequence, which the kernel derives
and attenuates during IPC; missing, extra, or nonzero payload authority is
rejected before service state changes. A `TaskRuntime::send_ipc` test proves
that receiver generations replace different sender handles before an atomic
two-setting commit. An authorized read can canonically return an unset value.

Adaptive-isolation configuration now has one typed, bounded control-plane path.
A canonical 16-byte record distinguishes component preferences from system
the Total MicroVM policy; each target remains bound to
its own setting object, and a component descriptor fixes its native placement
class. A revision-bound application plan first loads both values through exact
READ capabilities, then repeats both reads and compares the complete records and
global configuration revision immediately before producing `IsolationMode`, an
optional component placement request, and an `IsolationAdmissionTable` carrying
that exact revision as its policy generation. Revoked reads, wrong objects,
scope confusion, noncanonical bytes, and intervening commits fail before launch
admission. The values grant no capability and the plan does not bypass package
floors or select a provider. Windows and Arch Linux each pass all 38 focused
configuration tests. This is hosted unit/simulation evidence, not a Settings or
shell frontend, effective-placement proof, boot evidence, or Total readiness.

The representative service path now accepts one already authenticated runtime
projection of package preferred/minimum/maximum placement and its supported
native-service and microVM forms. After revision-bound policy application it
checks the exact package bounds and emits a caller-consumable
`IsolationServiceSpec` carrying the same nonzero policy generation. Strict Total
requests require microVM support; explicit native requests below a microVM floor
and malformed bounds are rejected. No alternate form is selected after failure.
This bounded check neither classifies workloads nor selects providers, VM
templates, or resources. A composed route now repeats the policy reads, package
checks, kernel mode/generation match, and exact interface/provider binding in
one call before dispatching to the microVM launcher. Revision drift and
admission mismatch prevent launch; backend failure has no fallback. Windows and Arch Linux each pass
all 40 focused configuration tests. This remains unit/simulation evidence and
not the complete general package resolver or broad cross-placement runtime.

The next persistent-policy frontend boundary now uses one canonical 32-byte
`IsolationPolicyEdit` for both planned Settings and object-shell projections.
It binds the exact setting ID, policy object, component/system scope, native
class, owner selection, and expected configuration revision, with zero embedded
authority. Commit independently requires configuration-root `CONTROL` and exact
setting-object `WRITE`, then returns the committed policy generation. Wrong
object, stale revision, scope/native-class substitution, malformed length, and
nonzero reserved bytes fail before mutation. Windows and Arch Linux each pass
41 focused configuration tests. This is typed service/unit evidence only, not a
GUI, shell parser, semantic accessibility projection, boot selector, or Total
runtime completion.

The matching read path now composes one `IsolationPolicySemanticView` from the
already reauthorized persisted policy, authenticated package placement bounds,
and the kernel's separately capability-scoped aggregate monitor snapshot. It
retains configured system/component selections, preferred/minimum/maximum and
supported forms, resolved placement/source or an explicit component-blocked
state, and the full privacy-bounded aggregate status. A stale policy generation
or requested-mode mismatch rejects the composition. No domain identity,
capability, unrelated setting, launch, or remediation operation enters the
view. The same 41-test Windows and Arch Linux suites cover satisfied, blocked,
stale-generation, and wrong-mode cases. This is shared semantic-service evidence,
not a rendered GUI, shell parser, trusted accessibility surface, or Total-mode
completion.

The first frontend adapters preserve that common contract. A Settings action
contains only the selected enum and expected revision. The bounded object-shell
parser accepts `isolation show` and
`isolation set <selection> <expected-revision>`; it has no grammar for object
IDs, capabilities, provider names, paths, placement bypass, or fallback. Both
produce the identical canonical edit and reach the same scope, revision, and
capability checks. The 41-test suites on Windows and Arch Linux cover component
and system selections, extra-token rejection, revision overflow, scope
confusion, and byte equality. This is parser/semantic-adapter evidence, not a
rendered Settings app, running object shell, or trusted accessibility surface.

Patent review: `NOT_TRIGGERED` for this conventional fixed-record
encode/decode, bounded literal command parser, and optimistic revision-bound
transaction composition. The
broader adaptive placement and automated VMM/resource selection reviews remain
`TRIGGERED` in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md).

The first strict system-level Total finalizer now sits above the per-launch
admission table. `TotalMicrovmInventory` binds an exact system/policy generation
to unique domain/class entries plus an explicit must-run bit. It refuses unknown
running or unavailable domains, duplicate identity, class substitution, missing
or unavailable must-run components, eligible execution outside a microVM,
running unsupported blockers, and any native fallback. Only an exact complete
state yields `TotalMicrovmRuntimeProof` with bounded counts and generations;
the proof carries no capability or launch authority. Windows and Arch Linux each
pass 549 kernel tests. The real WHP and KVM application runners now consume the
finalizer after exact Total admission and before guest execution. Their focused
suites pass 9 and 10 tests respectively, and fresh signed probes on 2026-08-26
each emitted `classified=1`, `eligible=1`, `microvm=1`, and
`native_fallback=0` for system/policy generation 1. Required-system inventory
derivation is now **IMPLEMENTED** at the kernel boundary: a bounded adapter
accepts only a valid general SystemRelease v2 signed by the exact
caller-policy-selected key, requires its `MRMLRI1` to exact-match the enclosed
`MRMLSG2`, and requires one unique live-domain binding for every package record.
It rejects v1, missing/excess bindings, duplicate package identity, incompatible
co-location, class substitution, and exception-reason substitution. Compatible
packages may share one live domain and conservatively combine must-run state.
Package names identify the binding; neither release nor manifest metadata grants
domain authority. Windows and Arch Linux each pass 555 kernel tests. WHP/KVM
runner consumption is now **PARTIALLY IMPLEMENTED** for the focused ZIM/Zstd
component generation. Both runners produce byte-identical 201-byte `MRMLSG2`,
207-byte `MRMLIC1`, and 225-byte `MRMLRI1` records. The same freshly signed
99,369-byte SystemRelease v2 authenticated all three and joined both packages
to one exact prepared domain before CPU, RAM, or VMM guest construction. Each
runner retained that immutable inventory across construction and finalized
`classified=1`, `eligible=1`, `microvm=1`, and `native_fallback=0` only after
exact microVM admission and before guest execution on WHP and nested KVM. The
stable component ABI data plane then ran without per-request package or policy
resolution. Kernel construction returns a private-field
`ReleaseTotalMicrovmInventory` retaining the authenticated signer, system
generation, canonical generation digest, interface-catalog digest, and policy
generation. It can enter recovered admission only after consumption into an
`ActivatedReleaseTotalMicrovmInventory` whose activated generation and both
canonical digests match exactly; numeric equality, a substituted generation
record, or a substituted catalog record fails. The focused WHP/KVM runners
perform that join before CPU, RAM, or guest construction. The recovered
configuration path accepts only the activated type and rejects non-Total or
policy-generation mismatch. Deployment checkpoint v3 now persists and recovers
the exact SystemRelease content digest, selected signer identity, and runtime-
inventory digest, and the kernel compares all three before it constructs the
activated Total inventory. A legacy generation-only checkpoint or v1 release
has no qualifying identity. This is hosted controlled
evidence for one colocated consumer/provider domain, not complete installed-
system Total readiness, live boot recovery, host-resistant isolation, or
physical-hardware evidence.

The focused runners no longer restate `MICROVM_ELIGIBLE` or the empty eligible
reason in their launch input. They provide only the exact ZIM/Zstd-to-domain
assignments; the authenticated release derives both classes and reasons before
construction. Complete membership, distinct package identity, and the typed
host-substrate/non-substrate reason shape are checked allocation-free. A
descriptive release reason cannot choose `HostSubstrateReason`, and neither
metadata nor assignment authorizes the domain. The runners now build those
assignments through a fixed-capacity `RuntimeDomainAssignmentPlan` that retains
the exact activated signed release, enumerates its runtime members, and refuses
to seal on an unknown, duplicate, omitted, or excess package. This is a
control-plane completeness boundary, not a capability: ordinary launch
admission must establish authority before the resulting stable interface data
plane takes its shortest safe path. The plan now invokes one policy callback
with each authenticated class, placement bound, supported-form mask, and
must-run value, then publishes the assignments atomically only if every result
retains the exact package identity. The WHP/KVM runners no longer name the
ZIM/Zstd members independently. General per-package owner-policy lookup and
distinct-domain launch construction remain **PLANNED**.

Recovered Total preparation now has a single-owner boundary in the
configuration service. `RecoveredTotalAdmission` retains both the activated
release inventory and its policy-derived admission table; preparing a service
through it first exact-matches the domain and class against the release,
reapplies the recovered effective placement policy and bounds, and reserves
that same table. An unclassified domain publishes no pending, running, or
unavailable state, and a release/policy-generation mismatch cannot construct
the wrapper. Windows and Arch Linux configuration suites pass 43 tests. This is
hosted typed-state evidence; WHP/KVM live runner consumption of the committed
stable-recovery object and real early-boot orchestration remain **PLANNED**.

The common inner owner is now live on both hosted VMM backends.
`BootTotalAdmission` binds the effective Total policy to the activated release,
retains its exact generation/catalog digests in the admission table, prepares
the classified component route, carries the same table through quantitative
vCPU/RAM and VMM construction, commits the microVM, and finalizes the signed
release inventory. `RecoveredTotalAdmission` delegates to this same owner while
retaining recovery provenance. Fresh WHP and nested-KVM probes each report
`eligible=1`, `microvm=1`, and `native_fallback=0`. The runners still use a
focused transient configuration fixture, not the committed stable-recovery
object; real recovered boot remains **PLANNED**.

The WHP/KVM runners now consume the one-boot Total request from the same
canonical `BootHandoff` installed for the guest. Two allocation-free kernel
encoders cover ordinary and SMP handoffs with neutral recovery metadata plus the
typed isolation flag. Each runner decodes those bytes, requires recovery state,
and passes only `BootHandoff::isolation_override()` into effective-policy
composition; a missing flag fails before admission instead of falling back to
native execution. WHP passes 11 focused runner tests, KVM passes 12, and the
kernel passes 559 tests on Windows and Arch Linux. Retained older artifacts
reached the control proof but did not complete and were not counted as live
evidence. A freshly built component-service kernel was signed with separate
one-use kernel/package keys; both private keys were consumed, and the resulting
`.mrp` has SHA-256
`6edd697109255f628dbd877bfd0a7df1d703a161d288369b3a5023038c0ebe91`.
WHP completed the exact-generation ZIM/Zstd data path and cleanup with
`cpu_runtime=1077us`, `verify=18447us`, `prepare=6305us`, `execute=2184us`, and
`total=49861us`. Nested KVM reached the expected halt with
`component_runtime=1331us`, `verify=26084us`, `prepare=7451us`,
`execute=1337us`, and `total=120800us`. Both reported `handoff=decoded`, accepted
epoch 8, `eligible=1`, `microvm=1`, and `native_fallback=0`. This is hosted live
handoff parity, not the committed `RecoveredSystemState` join, host resistance,
bare metal, or complete Total readiness.

The committed recovery path now atomically joins those same inputs through
`RecoveredSystemState::bind_total_boot_admission`. It performs the existing
capability/settings revalidation and exact predecessor-epoch check, then binds
the activated signed release without exposing a detached effective policy. The
full hosted stable-storage test advances authority epoch 8 to 9, commits the
recovered configuration service, consumes a decoded Total handoff, prepares and
commits one classified microVM route, and finalizes the generation-bound Total
proof through the single recovered owner. Configuration passes 45 tests on both
Windows and Arch Linux. A shared hosted-only recovery source now uses the
existing exact-file and authenticated-authority recovery transaction to produce
that same committed owner. The authority-checkpoint and configuration files now
come from one integrity-validated redundant-root graph; handoff state, monotonic
state, owner approval, both file selections, and the dependent validator bind
the same exact volume and root generation. Its authenticated accepted epoch 8
is independent of the decoded handoff and advances to authority epoch 9; a
stale epoch-7 handoff or substituted root generation fails before release.
The recovered policy retains the committed volume/root identity so admission
cannot discard the control plane's exact recovery binding before opening the
runtime data plane.

The next recovery control-plane join is **PARTIALLY IMPLEMENTED** in the storage
service. The non-authorizing installed boot identity must uniquely match a live
registered source, stable identifier, controller/media generation, and geometry
before a principal receives a fresh read-only block session. The binding retains
both records and the session; identity bytes cannot perform I/O, and ordinary
per-operation session checks remain on the shortest-safe-path block data plane.
Focused Windows and Arch Linux storage suites pass 125 tests. Native driver
enumeration/correlation and hardware-backed execution remain **PLANNED**.

Configuration recovery now consumes that service join without widening it. A
fresh read session reads block zero, canonical header validation exact-matches
the handoff volume and geometry, and the handed root block must name one of the
header's two redundant roots. Every failure revokes the session before return;
the successful `InstalledRecoveryDeviceSelection` retains the ordinary
principal/session checks for later graph reads. Configuration passes 49 tests
on Windows and Arch Linux, with WHP/KVM runner parity at 11/12. Full native
driver and recovered-graph integration remains **PLANNED**.

The hosted backend-parity path now carries the same installed owner through the
complete reachable-graph and Total-admission composition. Its recovery-only
handoff includes the canonical identity, absence fails closed, service
reacquisition creates the fresh read authority, and the resulting graph/device
selection remains owned by `RecoveredInstalledTotalAdmission`. Windows and Arch
Linux pass 561 kernel and 49 configuration tests; WHP/KVM runners pass 11/12.
Status remains **PARTIALLY IMPLEMENTED** because the device and storage are
controlled hosted fixtures rather than native or physical evidence.

The post-firmware device boundary now has a **PARTIALLY IMPLEMENTED** verifier-
backed registration contract. The trusted native driver must prove the exact
firmware-to-native relation before `BlockService` atomically stores a boot
correlation beside an AHCI/USB/VirtIO descriptor. The correlation is data, not
authority; no session exists until the established installed-recovery grant
path runs. Focused tests reject unsupported classes, geometry changes, verifier
failure, and unpublished-device use. Storage passes 126 tests on Windows and
Arch Linux; real driver verifiers and physical evidence remain **PLANNED**.
The controlled path now retains the installed side of that binding as well.
`RecoveredInstalledTotalAdmission` owns the exact serviced device selection,
volume header, active root, recovered volume/root generation, activated release,
and the one Total admission table through route commit and final proof. Its
constructor rejects header/graph/policy substitution. The WHP and KVM runners
hold this owner rather than dropping installed provenance and retaining only
detached policy scalars. Configuration passes 47 tests on Windows and Arch
Linux; WHP passes 11 and KVM passes 12. This is hosted ownership and parity
evidence, not native enumeration, durable hardware-backed rollback state,
physical-media evidence, or installed early boot.
Fresh live WHP and nested-KVM probes retain the
recovered owner through route commit and final proof. WHP reported
`cpu_runtime=1019us`, `verify=18399us`, `prepare=6871us`, `execute=2070us`, and
`total=49892us`; KVM reported `component_runtime=1455us`, `verify=24924us`,
`prepare=8085us`, `execute=1461us`, and `total=122412us`. Both reported
authority epoch 9, configuration revision 1, one eligible microVM, and zero
native fallback. This is controlled hosted recovery evidence, not durable-media,
owner-presence, TPM, firmware, physical rollback, installed early-boot, or
host-resistant evidence.

The recovery control plane now has a reusable **PARTIALLY IMPLEMENTED** exact
stable-selection pair. `SelectedStableSystemRecovery` binds distinct
configuration and authority-checkpoint objects to one already validated
volume/root generation; cross-root and duplicate-object construction fail.
This data grants no capability and opens no runtime path. The hosted adapter
consumes it before authority recovery, while real media selection and installed
boot orchestration remain **PLANNED**. Configuration passes 45 tests on both
Windows and Arch Linux; WHP remains 11/11 and KVM 12/12.

The owning selector now **PARTIALLY IMPLEMENTS** the next storage connection.
`recover_stable_system_selection` consumes any conforming hostile metadata
backend, including the existing `BlockVolume`, retains the chosen complete
graph in `RecoveredStableSystemSelection`, and exposes paired file selections
only while that owner lives. The controlled hosted adapter uses the same path;
durable-device and installed-boot evidence remain **PLANNED**.

The controlled path now **PARTIALLY IMPLEMENTS** redundant-root device reads.
`recover_block_stable_system_selection` uses one exclusive `BlockVolume` to
read both full root blocks and all reachable metadata from the same device
generation, then retains that volume beside the selected system state. Either
root-read failure yields no selection or admission. Storage passes 121 tests
and configuration 45 on both development hosts; WHP passes 11 and KVM 12. The
backend is still in-memory, so installed-media claims remain **PLANNED**.

The next control-plane gate is **PARTIALLY IMPLEMENTED** through
`recover_serviced_stable_system_selection`. Exact `BlockService` session
generation and principal validation precede `ServicedBlockDevice` construction
and all root I/O; wrong-owner and revoked-session cases perform zero backend
reads. Configuration passes 46 tests on both development hosts, WHP passes 11,
and KVM 12. The shared hosted source now retains that exact serviced-device
authority chain through recovery. Fresh signed WHP and nested-KVM probes each
reported root 14, one eligible microVM, and zero native fallback. Installed-
device discovery remains **PLANNED**.

The installed-device handoff now has a typed **PARTIALLY IMPLEMENTED**
control-plane boundary. `InstalledRecoveryDeviceSelection` authenticates the
generational session owner and fixes its descriptor, expected device and volume,
block geometry, and active redundant-root slot before the shortest-safe-path
block data plane opens. The retained descriptor grants no authority; each read
still reauthorizes the same session, principal, and `READ` right. Focused tests
reject wrong owners, stale handles, device/volume/geometry substitution, and
invalid roots before any backend read. The hosted source consumes this binding,
but platform enumeration, real media, and installed early boot remain
**PLANNED**.

The next bounded discovery join is **PARTIALLY IMPLEMENTED**.
`InstalledRecoveryDeviceDiscovery` exposes already validated candidate metadata
under a compile-time maximum and cannot grant an I/O session. Recovery requires
exactly one candidate for the expected volume, rejects missing, ambiguous,
overflowing, and zero-capacity inventories, and then authenticates the selected
descriptor against the live session. The hosted source uses one controlled
in-memory candidate. Windows and Arch Linux configuration suites pass 47 tests,
WHP 11, and KVM 12. Native platform enumeration and installed early-boot
ownership remain **PLANNED**.

The controlled source now obtains those candidates from a
**PARTIALLY IMPLEMENTED** capability-backed service scan.
`enumerate_serviced_recovery_devices` bounds the supplied live-session list,
authenticates each session owner, performs the block-zero read through its exact
`READ` authority, validates canonical volume-header geometry, and emits only
non-authorizing candidate metadata. Invalid/non-MRML headers are skipped;
session, scratch, capacity, and backend uncertainty fail closed. Both hosted
runners exercise this scan before the same recovery and Total admission path.
Configuration passes 48 tests on Windows and Arch Linux, WHP passes 11, and KVM
passes 12. This does not prove AHCI, VirtIO, firmware, physical-media, or
installed early-boot enumeration.

The block-service registry now has a **PARTIALLY IMPLEMENTED** atomic platform
set boundary. `register_devices_atomic` checks complete free capacity,
set-internal duplicate identities, and collision with existing registrations
before changing the first slot. Device identity and geometry remain data, not
authority; the hosted path separately grants the recovery principal `READ` and
then performs the serviced block-zero scan. Storage passes 122 tests on Windows
and Arch Linux, configuration 48, WHP 11, and KVM 12. No native AHCI/VirtIO,
firmware handoff, physical device, or installed boot was exercised.

Initial recovery-session publication now has the same all-or-nothing boundary.
A fixed `BlockSessionGrant` set binds explicit device, principal, and rights
decisions; `grant_sessions_atomic` validates all registered identities, rights,
and available generational slots before making one handle live. The hosted path
then passes those exact read-only handles to serviced enumeration. Storage
passes 123 tests on Windows and Arch Linux; configuration passes 48, WHP 11,
and KVM 12. This is not native-driver, firmware, physical-media, or installed
early-boot evidence.

Installed recovery now retains an exact opaque platform identity, transport,
controller generation, and media generation through serviced enumeration and
selection. Legacy registration fails before backend access, changed media
cannot substitute for the discovered generation, and removal revokes every old
session before replacement registration. Windows and Arch Linux storage suites
pass 124 tests, configuration passes 48, WHP 11, and KVM 12. The hosted source
uses synthetic identity only; native platform enumeration and physical identity
remain unverified.

The shared UEFI library now supplies the first bounded native identity source
primitive. Exact x86-64 UEFI Block I/O ABI layouts are compile-time represented
and host-tested; media fields are copied only after canonicality, presence,
alignment, geometry, and overflow checks. One device path is bounded to 4096
bytes, structurally walked to its exact end node, and domain-separated SHA3-256
hashed into a boot-scoped identifier; the complete `u32` firmware `MediaId`
space maps to nonzero `u64` generations. The loaded-image acquisition opens both
protocols on the exact device handle, copies the bounded inputs, closes both,
and fails on partial-open cleanup or uncertain closure. Windows and Arch Linux
each pass 30 library tests and cross-build the UEFI artifact. Real-loader use,
firmware reads, installed handoff, OVMF, and physical hardware remain untested.

The UEFI boundary now groups compatible 512/1024/2048/4096-byte firmware blocks
into one exact aligned 4 KiB recovery read. Checked multiplication and end bounds
precede the call, while complete media snapshots bracket it. A failed read or
changed media generation zeroes the whole output. Windows and Arch Linux each
pass 31 library tests and cross-build the UEFI artifact. This remains mocked
protocol evidence; enumeration, installed selection, and firmware execution are
not implemented.

The UEFI library now copies bounded `LocateHandleBuffer(ByProtocol)` results
into a fixed local set and releases firmware storage before return. Capacity,
pointer alignment, null entries, and duplicate handles fail closed; release
failure overrides otherwise valid discovery. Neither handle bits nor order are
stable identity. Windows and Arch Linux each pass 32 library tests and
cross-build the UEFI artifact. Per-handle volume inspection and loader execution
remain absent.

One enumerated UEFI handle can now be probed through a single bounded
open/read/decode/close transaction. Firmware geometry is converted to exact
native 4 KiB units, the canonical volume header must match it, scratch is
erased, and no candidate escapes before both protocol closes succeed. Windows
and Arch Linux each pass 33 library tests and cross-build the UEFI artifact.
Complete-set uniqueness and real firmware remain untested.

The complete bounded handle set now selects exactly one expected `VolumeId`
without relying on handle order. Every candidate rebinds its current handle and
ephemeral local ID; duplicate stable identity, substitution, missing/ambiguous
matches, or uncertain probes fail closed. Reversed-order tests retain the same
stable identity. Windows and Arch Linux each pass 34 library tests and
cross-build the UEFI artifact. Root reads and loader execution remain absent.

The selected handle can now be reopened for both redundant roots only after its
stable path/media/native geometry and canonical block-zero header exact-match
the prior selection. Both output blocks are erased on mismatch, a failed second
read, or close uncertainty. Windows and Arch Linux each pass 35 library tests
and cross-build the UEFI artifact. Reachable graph recovery and real loader
execution remain absent.

The UEFI library now lends a read-only `StorageBlockDevice` only inside an exact
selected-device reopen. It rechecks block zero, uses aligned private transfers,
zeroes complete multi-block output after any late failure, rejects all mutation,
and drops the operation result if protocol close is uncertain. Windows and Arch
Linux each pass 36 library tests and cross-build the UEFI artifact. The shared
reachable-graph validator is not yet invoked through it.

The shared reachable-graph validator is now invoked through that exact selected
UEFI session. `BlockVolume` reads both redundant roots and services the complete
allocation/object-ID/directory/file metadata traversal without a second UEFI
recovery implementation. All scratch is erased after the synchronous operation,
and an uncertain protocol close suppresses an otherwise valid result. Windows
and Arch Linux each pass 37 library tests and cross-build the UEFI artifact.
This is mocked firmware evidence; real-loader invocation and early-boot owner
transfer remain **PLANNED**.

The real loader now conditionally invokes this installed recovery path before
`ExitBootServices`. An authenticated journal volume/root requires complete
bounded enumeration, unique selection, reachable-graph validation, and exact
root-generation equality. The loader admits at most 32 handles, 256 allocation
records, 64 directories, 64 extents per file, 64 objects, and 64 KiB metadata
scratch; exceeding those bounds fails boot. The UEFI target cross-builds on
Windows and Arch Linux. No firmware protocol authority crosses the handoff, and the current
authority-free recovery metadata does not yet carry installed device identity
for native-kernel reacquisition.

The kernel now defines a canonical 104-byte `InstalledRecoveryBootIdentity` for
that boundary. The record contains only non-authorizing source/provenance,
geometry, volume, and root identity and rejects malformed reserved bytes,
unknown source values, absent generations, invalid geometry, and out-of-range
roots. The UEFI adapter converts its validated selection to this type, and the
real loader retains it across `ExitBootServices` to the handoff-construction
call. Windows kernel tests pass 561, UEFI tests pass 37, and the UEFI target
cross-builds. The record is not yet encoded into `BootHandoff`, and no native
AHCI/USB correlation or physical reacquisition is claimed.

Canonical `BootHandoff` now carries that identity under a separate bounded flag.
The record is inserted before the SMP/MADT tail, and the decoder exact-matches
its volume and root generation against authenticated recovery metadata before
emitting any memory region. The real UEFI loader selects this encoder; malformed,
truncated, journal-mismatched, or tail-shifting inputs fail closed. Windows
kernel tests pass 561, UEFI tests pass 37, and the UEFI target cross-builds.
This remains codec and compile evidence, not OVMF, physical firmware, native
driver correlation, or capability-bearing storage reacquisition.

The bounded discovery result now remains owned through the complete serviced
recovery read. `RecoveredInstalledStableSystemSelection` retains the exact
installed selection beside the `BlockVolume` and reachable graph produced from
it, while one combined operation prevents callers from substituting a candidate
between discovery and root I/O. Hosted tests verify the retained device, volume,
and active root. Configuration passes 47 tests on both development hosts, WHP
11, and KVM 12; native enumeration and early-boot transfer remain **PLANNED**.

Fresh clean-tree execution now carries that owner through the focused live
component path. From detached commit `70e2e74d`, the public build frontend and
both optimized runners produced and consumed one newly built, one-use-signed
kernel/ZIM/Zstd/v2-SystemRelease set. KVM reported recovery root 14, one eligible
microVM, zero fallback, Total satisfied, and reached the expected halt
(`verify=24786us`, `prepare=9233us`, `execute=1505us`, `total=144281us`). WHP
reported the same recovery/inventory/Total result and completed the exact-
generation data path and lifecycle cleanup (`verify=19529us`, `prepare=6252us`,
`execute=2566us`, `total=52633us`). Consumer and provider signed-artifact
SHA-256 values were respectively
`55e3a5167a25bdd36ff87247960dc05d6ad39805033e9c397b22545f0f27fe97` and
`e8459afec07ce98b769e55c2ecdb5bf7622202e57b5ecaae670cf8a0ecdd4f7b`.
This is hosted controlled evidence only.

Patent review: `TRIGGERED` under the existing signed-release, adaptive
isolation, Total-MicroVM, automated VMM placement, and device-projection reviews
now that authenticated package classifications are joined to live domain
identities. See
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md).

The UEFI boot path now carries the first typed one-boot isolation request across
the trusted-loader boundary. The loader validates bounded firmware LoadOptions,
uses the common exact-token parser, and sets one canonical handoff flag only for
`TotalMicrovmOnce`. `BootHandoff` retains that authority-free override while an
ordinary/default boot retains `None`; unknown flags and malformed options fail
closed. The configuration control plane now **PARTIALLY IMPLEMENTS** explicit
composition: it retains the immutable applied persistent policy, records the
typed overlay separately, strengthens the effective mode to Total for that boot,
and preserves the exact configuration policy generation. Native-only bounds
fail before backend invocation. WHP and nested KVM both inject this same typed
request in the boot handoff before their release-derived
eligible component route; neither adds native fallback. A focused recovered-
state path now accepts the real canonical `BootHandoff` type only after
authenticated authority recovery, monotonic epoch advancement, and
configuration-service publication commit. It revalidates both isolation
settings through their exact READ capabilities, requires the handoff's accepted
recovery epoch to immediately precede the committed authority epoch, composes
the typed override, and retains recovery/configuration provenance without
granting authority. A stale handoff fails. Windows and Arch Linux configuration
suites pass 42 tests. Live early-boot orchestration does not yet invoke this path
with the loader's actual handoff, and complete required-system runtime proof is
absent. This is hosted recovery/composition and handoff-integrity evidence—not
a successful Total boot, OVMF/EFI-Shell execution, or physical firmware
evidence.

The hosted WHP and nested-KVM service runners exercise the configured
preparation path before real guest construction. Both build component and system
policy records under separate setting capabilities, atomically commit a
stored policy revision, reauthorize the plan, compose the explicit one-boot
Total overlay, apply the same native-service/microVM package bounds, bind the
verified provider generation, and reserve the kernel transaction before the VMM
constructs the guest. The previously implemented retained lifecycle consumes
the resulting exact specification. Fresh same-release runs on 2026-08-26
reported the configured selection, component placement,
`override=total-microvm-once`, `effective=total-microvm`, `eligible=1`,
`microvm=1`, and `native_fallback=0` on both. WHP timings were
`19755/5559/2254/52085us` and KVM timings were
`25493/7131/1207/124163us` for verify/prepare/execute/total. Configuration
suites pass 42 tests on Windows and Arch Linux, the WHP runner passes 9, and the
KVM runner passes 10. This is hosted controlled-probe parity with transient
policy state, not disk recovery, actual boot selection, host-resistant
isolation, or physical-hardware evidence.

The fixed supervision protocol binds request identity, opaque generational
`ServiceId`, operation, and restart time while likewise resolving authority
only from the kernel message. `ServiceSupervisor::state_authorized` requires
exact READ authority. The adapter supplies priority and fresh launch context
from trusted state rather than request bytes, and successful restart still
passes exact CONTROL, completed cleanup, backoff, restart-limit, and fresh-task
gates. Windows gnullvm tests cover fifteen configuration/protocol/dispatch cases
and the kernel suite covers authorized introspection. This is **PARTIALLY
IMPLEMENTED** Phase 2 foundation: schema admission and atomic commit dispatch
now run through the signed CPL3 service image, while native-storage persistence,
export, and recovery remain incomplete.

The storage-neutral configuration checkpoint prerequisite is now implemented.
Its 96-byte canonical header binds version, exact total length, setting/audit
counts, nonzero root object, global revision, next audit sequence, reserved
zeros, and a SHA3-256 digest. Fixed 112-byte setting records preserve identity,
object, typed constraint, optional canonical value, and per-setting revision;
fixed 24-byte audit records are exported in chronological retained order.
Export requires exact root READ. Recovery into a fresh fixed-capacity service
requires exact root CONTROL and a caller-supplied expected digest that must match
both the embedded digest and recomputation. It revalidates schema uniqueness,
root non-aliasing, value constraints, capacity, revision relationships,
contiguous audit sequence, known settings, and every reserved byte before
publishing recovered state. The embedded digest is only corruption detection;
without a separately authenticated expected digest it is not evidence of
authenticity or rollback resistance.

The checkpoint codec is now integrated with capability-native stable files and
the existing storage transaction protocol. Preparing a successor independently
requires configuration-root READ and exact file WRITE/RESIZE, binds the same
object, successor generation, checkpoint length and complete-content digest,
and stages fresh COW extents without changing the active file. The prepared
write must be admitted to the publication transaction and can become active
only by consuming its exact one-use receipt. Recovery requires exact file READ,
configuration-root CONTROL, and the caller's exact nonzero file generation
selected by authenticated reachable-storage recovery. A stale generation is
rejected before I/O; a backend error remains an error, and returned bytes still
pass the canonical checkpoint digest and invariant checks. Focused tests cover
dual-authority denial, metadata substitution, stale-generation rejection,
corruption, I/O uncertainty, receipt consumption, and successful recovery. This
is in-memory simulation evidence only; live isolated block I/O, physical
power-loss, authenticated hardware anti-rollback state, and reboot-time
capability reconstruction remain unimplemented.

Recorded verification on 2026-08-24: Windows gnullvm
`cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-config -p mrml-storage --release --no-default-features --target x86_64-pc-windows-gnullvm`
passed 21 configuration and 99 storage tests; the corresponding scoped
`clippy --no-deps -- -D warnings` passed. Linux
`cargo test -p mrml-config -p mrml-storage --release --no-default-features`
passed the same 21 and 99 tests, and its corresponding scoped strict Clippy
command passed. `cargo fmt --all -- --check`, the release UEFI
`mrml-service-image` build, and its scoped strict Clippy command passed. An
additional Windows `--all-targets` Clippy attempt was not an acceptance pass:
it stopped on the pre-existing `clippy::result-unit-err` diagnostic in
`mrml-crypto::aes128_ctr_xor`; no claim is based on that failed command.

Persistent supervision policy now has a narrow configuration-to-lifecycle
binding. A canonical 48-byte record fixes magic, version, length, one nonzero
service object, a nonzero finite restart budget, base and maximum backoff, and
zero reserved fields. Exact setting READ authority is revalidated when loading
the value from fresh or checkpoint-recovered configuration; unset state,
service substitution, invalid policy bounds, hidden bytes, stale capability,
and wrong record geometry fail closed. The bound result records both global and
setting revisions. Registration revalidates the exact live capability, record,
service binding, and both revisions immediately before trusted mutable
`ServiceSupervisor` access; revocation or configuration drift invalidates the
bound value. It can register only its exact service object, carries no authority, and cannot choose
priority, launch context, time, capabilities, or cleanup state. Existing exact
CONTROL, cleanup, backoff, budget, and fresh-context gates still govern every
restart. Focused tests recover the record through the checkpoint codec, enforce
capability revocation and service binding, then exercise its backoff and restart
limit. This is service-library simulation, not live stable-device restoration,
dynamic policy replacement, reboot-time capability reconstruction, or physical
hardware evidence.

Dynamic supervision-policy replacement now closes the configuration-to-
lifecycle update boundary. `BoundRestartPolicy` carries policy data and source
revisions but no capability; registration and replacement take the live setting
READ capability explicitly and re-read the exact setting immediately before
trusted mutation. Replacement separately requires exact service CONTROL.
`ServiceSupervisor` advances a checked nonzero policy generation on each
successful replacement, and `ServiceRestartPlan` snapshots it so a plan created
before host reprovisioning cannot commit after policy drift. Replacement keeps
the completed-restart counter and any deadline computed at retirement, so a
policy rewrite cannot replenish budget or shorten pending backoff. Wrong-object
CONTROL, revoked READ, configuration or setting drift, stale plans, and policy-
generation exhaustion all preserve lifecycle state or fail before task
creation.

Recorded verification on 2026-08-24: Windows nightly gnullvm and Arch Linux
under WSL2 each passed all 440 release kernel tests; the 13 focused
`service_lifecycle` tests; all 24 `mrml-config` tests; and scoped strict Clippy
for `mrml-kernel` plus `mrml-config`. The commands were `cargo
+nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release
--no-default-features`, the same kernel command with the `service_lifecycle`
filter, `cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-config
--release`, and `cargo +nightly-x86_64-pc-windows-gnullvm clippy -p
mrml-kernel -p mrml-config --release --no-default-features --lib --no-deps --
-D warnings -A clippy::result_unit_err`; Arch used the equivalent default-
toolchain commands with `CARGO_TARGET_DIR=target/dynamic-supervision-policy`.
This is unit/simulation evidence only, not signed CPL3 execution, live stable-
storage restoration, reboot-time capability reconstruction, native boot,
bare-metal, physical-hardware, or user evidence.

The dynamic-policy `DIGITAL-RIGHTS REVIEW` found no identity collection,
retention, disclosure, attestation mandate, DRM, publisher control, first-party
bypass, accessibility restriction, AI authority, persistence, or owner-state
dispossession. Owner-delegated setting READ and service CONTROL remain separate
and independently revocable; cached data carries no capability. The `HOSTILE
SECURITY REVIEW` treats every capability, service ID, record field, revision,
policy generation, budget, deadline, and prepared plan as hostile. Complete
reauthorization and revision checks precede mutation; replacement cannot reset
history or shorten a deadline; stale plans fail before task creation; and epoch
exhaustion is transactional. Existing rollback-resistance, accessibility,
evidence, owner-sovereignty, data-minimization, anti-DRM, owner-controlled-
attestation, third-party-accessibility, AI-containment, anti-persistence, and
dual-review gates remain unchanged. Patent review is `NOT_TRIGGERED` because
this is conventional bounded configuration/lifecycle revalidation, not a new
compatibility, accessibility, browser, AI, media, or device mechanism. This
agent review does not replace required independent human review.

The next dynamic-policy dependency adds pointer-free syscall operation 11.
Registers carry the calling task's opaque capability, generational service
token, a `u32`-bounded nonzero restart count, base and maximum backoff, and one
mandatory zero reserved scalar. Decode constructs `RestartPolicy` before
dispatch and rejects invalid handles, tokens, count overflow, zero budget,
inverted backoff, and reserved data. In the service-probe kernel path,
`ServiceSupervisor::replace_restart_policy` independently reauthorizes exact
CONTROL against the live service object. Completion is detail-free: success or
rejection plus four zero result registers. The ABI accepts no pointer, setting
ID, service-object claim, executable, context, priority, clock, or persistence
input.

Recorded verification on 2026-08-24: Windows nightly gnullvm and Arch Linux/
WSL each passed all 442 release kernel tests. Scoped strict kernel Clippy and
UEFI `mrml-kernel-image` Clippy with `service-probe` passed on both. Commands
were `cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release
--no-default-features`, the corresponding strict kernel Clippy command, and
`cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel-image --target
x86_64-unknown-uefi --features service-probe --no-deps -- -D warnings`; Arch
used the equivalent default-toolchain commands with
`CARGO_TARGET_DIR=target/policy-replacement-syscall`. This is unit and compile-
time evidence only. No CPL3 policy request, signed KVM/WHP execution, persistent
restoration, native boot, bare metal, physical hardware, accessibility device,
or user evidence is claimed.

The syscall `DIGITAL-RIGHTS REVIEW` found no identity collection, retention,
disclosure, attestation mandate, DRM, vendor control, accessibility restriction,
AI authority, persistence, or owner-state dispossession. Exact owner-delegated
service CONTROL remains necessary and independently revocable; data and tokens
do not manufacture it. The `HOSTILE SECURITY REVIEW` treats every register,
handle, generation, scalar, policy bound, and reserved bit as hostile. Complete
decode precedes supervisor access, exact live-object authorization precedes
mutation, and rejection is detail-free. Existing rollback-resistance,
accessibility, evidence, owner-sovereignty, data-minimization, anti-DRM, owner-
controlled-attestation, third-party-accessibility, AI-containment, anti-
persistence, and dual-review gates remain unchanged. Patent review is
`NOT_TRIGGERED`: this is a conventional bounded capability-authorized syscall,
not a new compatibility, browser, accessibility, AI, media, host-share, or
device mechanism. This agent review does not replace human dual review.

Recorded verification for this gate on 2026-08-24: Windows gnullvm
`cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-config --release --no-default-features --target x86_64-pc-windows-gnullvm`
passed 23 tests, and the corresponding scoped `clippy --no-deps -- -D warnings`
passed. Linux `cargo test -p mrml-config --release --no-default-features`
passed the same 23 tests, and its corresponding scoped strict Clippy command
passed. The release UEFI `mrml-service-image` build and scoped strict Clippy
command also passed. These are unit/simulation and compile-time results only.

The first native-storage dependency gate now lives in the separate `no_std`
`mrml-storage` userspace-service crate, not in the privileged kernel. A stable
object identity combines a nonzero 128-bit volume identity with a nonzero local
identity; names and IDs are data and never authorize. A fixed-capacity global
authority table binds opaque generational handles to one principal, object
kind, and nonempty kind-valid rights set. Delegation requires explicit
`DELEGATE`, can only reduce rights, records its source lineage, and may cross
principals. Revoking any handle retires it and all derived descendants across
principals; stale generations, wrong principals, kind confusion, table
exhaustion, and overbroad derivation fail closed.

Canonical version-1 fixed records now cover volume geometry and redundant
superblock locations, exact predecessor-linked superblock generations, stable
directory/file metadata, and bounded UTF-8 directory entries. Directory names
reject empty, dot, dot-dot, NUL, slash, invalid UTF-8, and hidden tail bytes;
rename changes parent metadata without changing object identity. Every parser
checks exact length, version, reserved bytes, arithmetic, volume binding,
nonzero identity/generation, metadata ranges, and a SHA3-256 self-check. That
digest detects covered corruption only: it is not authority, authenticated
storage, atomic publication, replay defense, or rollback protection. Ten
focused unit tests and strict crate-local clippy pass on Windows gnullvm and
Arch Linux under WSL2.

Prepared directory and file primary metadata now has a full-range COW digest:
the fixed canonical record is hashed with zeros through the exact block-aligned
pointer extent. An undersized range fails construction, and any hidden nonzero
tail changes the digest. Unsafe staging backends must materialize and verify
that complete padded image.

The next dependency adds one canonical 144-byte extent record. It binds the
exact file object and metadata generation to a nonempty bounded logical range,
then represents either a physical data range with a 32-byte content digest or
an explicit hole whose physical address and digest must be zero. A
fixed-capacity `ExtentMap` requires records in exact logical order with gap-free
coverage of the file length rounded to the volume block size. It bounds file
length and physical ranges to checked volume capacity, excludes block zero and
both superblocks, rejects intra-file physical overlap, and returns only the
physical block or hole plus the bounded run remaining. Unknown future kinds,
hidden bytes, wrong volumes/files/generations, overcoverage, arithmetic
overflow, and capacity exhaustion fail closed. This map does not allocate
blocks or prove cross-file ownership; those require the later allocation and
COW metadata layers.

The COW publication prerequisite now models the root transition itself. A
fixed-capacity plan accepts only the exact successor generation and alternates
from the identified active superblock to the other configured superblock. Every
new metadata range must be volume-bounded, nonoverlapping, outside block zero
and both superblocks, and disjoint from the active root, allocation record, and
all caller-supplied protected active-tree ranges. The new root and allocation
ranges must both be present. The unsafe persistence backend contract verifies
each already-staged unreachable image against its exact SHA3-256 digest, flushes
all new metadata, atomically replaces the complete inactive superblock, and
flushes it. A verification or first-flush failure is a clean rejection because
the old root remains selected. A replacement or final-flush failure is
`FailStop` because publication may be visible or durable and rollback cannot be
claimed. This is an ordering and failure-state mechanism with an emulated
backend; it is not a physical-disk atomic-write result or crash-recovery proof.

The first directory-operation layer is also bounded and userspace-owned. A
directory state binds one stable directory object, nonzero generation, and at
most its compile-time entry capacity. Construction rejects wrong-volume,
duplicate-name, and duplicate-object entries. Lookup and enumeration require
exact `LOOKUP` and `ENUMERATE` authority for that directory. File or directory
creation separately requires `CREATE_FILE` or `CREATE_DIRECTORY`, obtains the
next identity from a service-owned nonzero monotonic allocator, preflights name,
capacity, generation, child-right validity, and authority-table capacity, then
returns both the canonical entry and an object-bound child handle. No caller-
chosen name or ID grants access.

Same-directory rename requires `RENAME_CHILD` and preserves child identity,
kind, metadata generation, and every existing open capability. A cross-
directory file move requires exact `RENAME_CHILD` on both directories and
preflights both generations, source identity, destination name/object collision,
and destination capacity before changing either directory. Removal requires
`REMOVE_CHILD`; it unlinks the namespace entry without silently revoking open
object capabilities, leaving lifetime reclamation to a later object-lifecycle
layer. Cross-directory directory movement now accepts only an opaque bounded
ancestry proof. An unsafe backend contract supplies the unique canonical
directory metadata from one immutable completely validated selected generation.
Proof construction starts at the destination's exact generation, follows parent
links to the selected root, and rejects the moved directory anywhere in the
chain, repeated objects, wrong or broken links, stale destination state, backend
failure, and capacity exhaustion. It separately loads the moved directory's
canonical metadata, binds its exact generation, and requires its current parent
to equal the source directory. Reusing a proof after either bound generation
advances fails. The proof retains fixed-capacity source-to-root and destination-
to-root object/generation paths, and exposes only bounded indexed access to
their identities and generations. Every retained node binds the exact canonical
generation loaded by the proof. This makes only the
bounded in-memory namespace transition cycle-safe. A separate fixed-capacity
closure planner inserts the moved directory first, merges both ancestor paths,
deduplicates their shared suffix, orders deeper objects before shallower
parents, leaves the root last, and rejects insufficient output capacity or a
shared ancestor presented at inconsistent depths or generations. It produces
generation-bound identities and order. A second unsafe backend contract loads
the unique canonical state for every exact object/generation pair from that
same immutable selected generation. Construction retains each predecessor and
builds every successor before returning a plan: all generations advance once,
the moved directory's parent becomes the destination, source removal remains
canonical and compact, destination insertion names the moved successor
generation, and parent entries are rewritten through each deduplicated shared
ancestor to the root. Wrong objects or generations, missing or stale parent
entries, name/object collisions, insufficient capacity, generation exhaustion,
backend uncertainty, and inconsistent shared paths fail closed without exposing
a partial plan. Complete-plan staging preflights every metadata/entry pointer,
requires each entry buffer to match its exact pointer extent, rejects every
intra-plan overlap before the first write, and then stages and flushes all
unreachable canonical successors child-before-parent. A prepared plan retains
every typed directory update and can create a fresh transaction that admits all
directory participants and their two images; transaction-capacity failure
returns no partial transaction. Publication additionally requires the prepared
allocation successor to contain exact ownership records for every directory
metadata and entry image, including object, successor generation, pointer, and
allocation kind. A helper binds all directory writes plus the allocation write
to the next volume generation and constructs the COW plan with the successor
root-directory and allocation pointers. The focused simulation admits all five
participants, verifies and publishes all nine images once, atomically consumes
the four directory receipt entries, exposes the complete successor state set,
and then consumes the allocation receipt. Missing ownership, omitted writes,
receipt mismatch, duplicate batch entries, and replay fail closed without
partial receipt consumption; publishing only source, destination, and child
would be rejected by reachable-tree validation.
The object-ID allocator now has a canonical volume-scoped COW image. Its exact
volume, nonzero generation, next local ID or exhausted state, metadata pointer,
embedded checksum, full-image COW digest, and zero padding are all bound.
Reservation advances a disjoint unreachable successor without mutating active
state, admits a distinct allocator resource to the transaction, and returns the
reserved stable ID and successor only after consuming its exact one-use receipt.
Zero cannot alias exhaustion, the maximum ID is reservable exactly once, and
generation/identity exhaustion fail before staging. Its prepared allocation
successor must now contain the exact allocator image under a distinct purpose,
root lifetime anchor, allocator generation, and pointer range; the anchor grants
no authority. Reachable recovery now requires exactly one allocator record,
decodes its canonical candidate-generation image, and rejects missing,
duplicate, stale, corrupt, substituted, or reachable-ID-reusing state. A
canonical exhausted allocator remains valid and cannot allocate. Authenticated
anti-rollback and block-device durability remain pending, so create is not yet
proven crash-safe on a block device. The authority table now supplies the corresponding
inactive slot reservation. A reservation binds exact object, kind, rights,
owner, slot, generation, and exact parent handle, consumes capacity without
becoming authorizing,
rejects guessed handles, activates exactly once, and advances the slot
generation when canceled. This prevents intervening insertions from stealing
capacity reserved for a later durable create. The prepared-create coordinator
validates the exact reservation and revalidates the parent owner, directory
kind, generation, and matching create right before receipt consumption; it
activates it only
after every participant is consumed, and can retire it on prepublication
cancellation.
The child side of creation now has canonical initialization for both native
kinds. An empty file stages generation-1 `FileMetadata` with the SHA3-256 empty
content digest and a canonical empty extent image. An empty directory stages
generation-1 directory metadata with its exact parent and a canonical empty
entry image. Both require disjoint valid ranges before backend I/O, flush both
unreachable images, and enter transactions through an explicit typed `0 -> 1`
creation participant. A bounded coordinator now assembles the complete
parent/child/allocation/allocator/authority publication; neither initializer
alone makes an object reachable. The
general mutation proof now retains one exact target-to-root path from the same
immutable selected generation. Create construction reloads every bound
predecessor, inserts the new generation-1 entry only at the target, advances
each affected directory exactly once, and rewrites parent entry generations
bottom-up to the root. Wrong or stale states, broken links, collisions,
generation exhaustion, and bounded-capacity failure expose no successor plan.
The resulting closure reuses the move path's whole-plan preflight: exact entry
buffer extent, volume bounds, reserved-block exclusion, and pairwise range
disjointness are established before the first backend call. All directory
successors then stage child-before-parent and are admitted to one bounded
transaction. The complete coordinator binds the child, directory closure,
allocator, allocation image, and inactive authority in one publication. For a
directory child it additionally retains the canonical parent, requires it to
equal the unique successor containing the generation-1 namespace entry, and
preserves it in committed state. Focused scenarios exercise both empty-file and
empty-directory creation.

The first file-I/O dependency is a bounded verified read path. Immutable
`FileState` construction requires its stable object, metadata generation, and
length to exactly match the validated extent map. Each read first requires exact
file `READ` authority and rejects a handle for any other object before exposing
range state. Requests are capped at 1 MiB, use checked offset/length arithmetic,
and may cross any number of data and explicit-hole extents within that bound.
Holes remain zero. For data, the unsafe backend contract must read the exact
complete physical extent from the same immutable device generation, verify its
SHA3-256 digest, and only then copy the requested subrange. Short, stale,
redirected, or mismatched data fails. If a later extent fails after earlier
segments succeeded, the entire caller output is erased before failure returns.
This is an in-memory state and emulated-block read proof, not a native block
driver or physical-device result.

The matching write path never mutates live file state in place. It first
requires exact file `WRITE` authority and additionally `RESIZE` whenever the
length changes. Nonempty patches are capped at 1 MiB and checked against the
proposed length. The caller must supply a complete `ExtentMap` and canonical
`FileMetadata` for the exact successor generation; object, generation, length,
block size, and extent count must agree. Every new physical data range must be
disjoint from every active data extent and every bounded protected metadata
range. The unsafe data backend contract reconstructs each complete successor
extent from digest-verified old content, holes, and exactly the patch, writes it
only to its new physical range, verifies its SHA3-256 digest, and durably flushes
all new data. Any staging/flush failure returns no prepared state and leaves the
old generation selected.

The service derives both the canonical full-range zero-padded file-metadata
SHA3-256 digest and the digest of the complete canonical extent-record sequence plus zero padding to its
metadata allocation; callers cannot substitute either digest. The data backend
also verifies SHA3-256 over the exact logical file length against the content
digest in `FileMetadata` before durable flush. The returned `PreparedFileWrite`
is still unpublished and commits only through a COW publication plan with the
same generation and both exact metadata writes. A plan that omits or changes
either record is rejected before metadata I/O. Successful
COW publication returns the new immutable `FileState`; publication uncertainty
retains the existing COW `FailStop` result. Tests use emulated data and metadata
backends. This is not a physical block, allocator, power-loss, or crash-recovery
result.

The first explicit transaction layer groups a bounded number of prepared file
writes without conflating per-object metadata generations with the global
volume-publication generation. Admission preflights participant and metadata
capacity, rejects the same object twice, rejects duplicate metadata ranges, and
binds each service-derived metadata image to the transaction's exact publication
generation. Publication accepts no empty transaction, requires a matching COW
plan containing every admitted write, and performs the existing single root
transition. Only success returns a non-copyable receipt containing the exact
object/kind/predecessor/successor participants; each participant must consume its
entry once before exposing its new immutable state. A rejected plan reaches no
backend, and consuming the same receipt entry twice fails closed. Directory and
allocator participants and persistent recovery remain later gates.

The redundant-root recovery prerequisite accepts the two exact superblock
images from the block-service boundary and decodes each canonical checksum
independently. An unsafe validator contract must establish the complete
reachable root and allocation graph from the same immutable device generation,
including digests, identities, generations, bounds, ownership, and
cross-references. A proven-invalid image is unusable; an indeterminate backend
failure aborts recovery and can never be reclassified as corruption to permit
rollback. Two usable candidates must be identical at one generation or exactly
adjacent, and the newer adjacent generation wins. A lone usable candidate is
returned with an explicit fallback marker. Gaps and same-generation disagreement
fail closed. This is bounded state selection over emulated images, not a
complete metadata-tree validator, physical-device, power-loss, repair,
durability, or anti-rollback result.

The recovery validator's allocation prerequisite is now a canonical 112-byte
checksummed record binding one exact object generation to a physical range and
either file-data or object-metadata use. A fixed-capacity global index requires
records in physical order, bounds every range to the volume, excludes the volume
header and both superblocks, and rejects overlap across every owner. Exact
ownership queries connect a data extent or metadata pointer only when object,
generation, start, length, and kind all agree. This closes the earlier
intra-file-only overlap gap in the in-memory model. The canonical block-aligned
allocation image header binds the exact volume, publication generation, record
width/count, and a SHA3-256 digest over its header, records, and zero-filled
unused capacity. Decode requires the exact metadata allocation length, rejects
nonzero padding even under a recomputed digest, parses every record, and rebuilds
the index invariants. Allocation/free mutation and full reachable-tree traversal
are implemented in the bounded model. A new block-volume adapter binds their
canonical metadata images to exact block writes, complete digest readback,
ordered device flushes, inactive-superblock-only atomic replacement, and exact
recovery reads. It owns one exclusive session and permanently rejects further
operations after uncertain superblock durability. The unsafe device contract
must still provide exact transfer, atomic replacement, and durable flush; no
block service or physical device implementation exists yet.

The same boundary now covers file data without adding an ambient namespace or
object lookup. Exact-block reads make a complete first pass over the physical
extent and compare its digest before a second pass copies only the requested
subrange. A bounded `BlockFileSession` retains the exact predecessor file state
and one independent block-sized work buffer. For each next-generation data
extent it reconstructs every logical block twice from digest-verified old data,
explicit holes, zero extension/truncation, and the exact patch: the first pass
must match the proposed extent digest before any write, and the second writes
only the proposed disjoint COW range. Complete readback must match again before
the extent enters the session. The session independently rejects wrong file,
volume, block geometry, generation, length, ordering, capacity, reserved blocks,
active-range reuse, successor physical overlap, digest substitution, and replay.
Before its one allowed flush it reads the complete staged logical successor,
synthesizes holes as zeroes, verifies the exact file-length digest, and only then
requests device durability. This remains an adapter tested with simulated
storage, not a real block service, device driver, or physical durability result.

The next service boundary is now implemented as a fixed-capacity in-process
core. `BlockDeviceId` identifies a registered device but authorizes nothing.
Supervisor-issued generational sessions bind one principal, device, and explicit
combination of read, write, flush, and atomic-superblock-replacement rights.
Derivation revalidates the exact parent owner and can only preserve or reduce
rights; each operation revalidates the handle generation, principal, device
liveness, and exact independent right before checking ranges or invoking the
unsafe backend. Parent revocation retires the complete descendant tree, device
removal retires every associated session, and saturated generations are never
reused. The service checks nonempty block-aligned lengths and checked volume
bounds, while backend failures remain failures rather than corruption or
rollback permission. A scoped `ServicedBlockDevice` connects these checks to
`BlockVolume`.

The control plane now has a canonical version-1 codec rather than a host-native
structure. Every request is exactly 320 bytes and every response 32 bytes, with
fixed magic, version, header size, opcode, capability count, request ID, session
slot/generation, range, payload length, and canonical zero padding. Reads and
writes carry no bytes or addresses inline: each declares one bounded byte length
and requires exactly one separately transferred shared-memory capability.
Flush carries neither, while atomic replacement inlines exactly the 256-byte
superblock record. The principal is supplied only by authenticated IPC context.
The bounded dispatcher checks canonicality and buffer shape before dispatch,
authenticates the current session owner, requires strictly increasing request
IDs per live handle generation, and consumes an admitted ID before touching the
backend. Replays therefore fail before I/O. An uncertain write, flush, or atomic
replacement backend result permanently poisons that generation; read failures
remain retryable. Backend failure is reported distinctly and never becomes
corruption or rollback permission. The service-side receive/syscall composition
described below is now implemented, but live isolated-task execution, a device
driver, and physical-device evidence remain pending.

The first kernel transport gate is now connected without teaching the kernel
the block protocol. Every decoded block operation reports `ServiceReads`,
`ServiceWrites`, or `None` and therefore an exact zero-or-one capability shape.
Generic kernel `Message` reception can require no capabilities or exactly one
already-transferred receiver capability with an exact nonzero rights set. The
check re-resolves the opaque generational token in the receiver capability
space; only then does it return the capability and object identity needed by the
existing exact shared-memory binding resolver. That resolver is now composed
into `Message::resolve_single_shared_buffer`: required rights must equal the
endpoint's access mode, then the binding must match the exact object, VM/task,
mapping generation, access, host physical range, and page count while remaining
live, writable when requested, and non-executable. Success returns only the
already-authorized capability/object, binding identity, and opaque host resource
handle—not a guest or host address. A service-read buffer is intended
to retain exactly `MAP|READ`; a service-write buffer exactly
`MAP|READ|WRITE`, matching current non-executable shared-binding semantics.
Missing, multiple, insufficient, excessive, stale, and revoked capabilities all
fail before object identity or mapping resolution; wrong object, VM/task,
mapping, access, resource range, or executable state fails before the handle is
returned. The service-side loop and syscall adapter now consume this contract.
Focused signed KVM/WHP probes instantiate them in a hosted isolated task as
described below; that evidence remains limited to the probe's volatile in-image
backend.

The same generic gate now supports actual bounded buffer use without returning
an address or a persistent mapping view. Each read or write repeats exact
receiver-capability authorization and complete live-binding resolution
immediately before passing only the opaque host-resource handle, byte offset,
and caller-owned byte slice to a backend. Checked arithmetic rejects empty,
overflowing, and out-of-range requests; writes additionally require the live
binding to be read-write. Backend failures remain distinct, including uncertain
outcomes. Safe callers cannot revoke the capability or mapping concurrently
through the immutably borrowed authority state, and no authorization snapshot
survives for later buffer use.

Service-side binding selection is now implemented as a generic kernel
mechanism. After exact single-capability authorization, the kernel matches the
capability object, kernel-supplied VM and task identities, and exact access mode
against its bounded binding table. Exactly one candidate must exist; absence or
ambiguity fails before mapping resolution or backend use. The selected mapping
then undergoes the same generation, physical-range, page-count, permission, and
liveness validation immediately before each operation. Neither block request
bytes nor other untrusted payload can nominate a binding ID, mapping ID, host
handle, or address.

`mrml-storage` now supplies the block-specific transport composition without
moving storage policy into the privileged kernel. It decodes an already-
received kernel `Message`, validates its exact zero-or-one capability shape and
selected live binding, and then performs replay/poison admission before any
bulk copy or block backend call. An opaque admission is consumed exactly once
by execution. Service-read requests copy only the declared bytes into bounded
caller-owned scratch; service-write requests dispatch into that scratch and
copy back only after a successful block read. Scratch is erased on every return
path. Session denial, replay, poison, malformed protocol, revoked authority,
binding failure, and buffer-shape failure reach neither bulk-buffer nor device
I/O. Backend uncertainty retains the existing rule: uncertain mutating block
operations poison the session generation, while transport copy failure is
reported distinctly and cannot become corruption or rollback permission. This
now has a matching service-side loop. It receives exactly one canonical request,
requires the operation's exact zero-or-one transferred-capability shape, admits
session owner/generation and monotonic request ID before any bulk or device I/O,
then invokes capability-selected shared-buffer read/write, dispatches the device
operation, and sends one canonical response. Request bytes, returned capability
tokens, scratch, and response storage are erased on every return. A shared-copy
failure after admission leaves the ID consumed, so retry is rejected before it
could duplicate a mutation. The syscall trait is unsafe because implementations
must preserve authenticated capability transfer, mapping selection, principal,
and launch-bound reply identity. The UEFI service image compiles a concrete
x86-64 adapter for operations 5, 7/8, and 4. Focused signed hosted probes invoke
that loop, but a real hosted device backend, device driver, persistence, and
physical-device evidence remain pending.

Recorded verification on 2026-08-24: Windows gnullvm
`cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-storage --release --no-default-features --target x86_64-pc-windows-gnullvm`
passed 107 tests, and the corresponding scoped `clippy --no-deps -- -D warnings`
passed. Linux `cargo test -p mrml-storage --release --no-default-features`
passed the same 107 tests, and its corresponding scoped strict Clippy command
passed. The release UEFI `mrml-service-image` build and scoped strict Clippy with
`--features block-service-loop` passed. This proves unit/simulation behavior and
ABI compilation only, not hosted invocation or device durability.

A focused `block-service-probe` now supplies the hosted invocation evidence.
The kernel creates two disjoint signed CPL3 tasks. The client receives separate
exact local read and read-write shared-buffer handles plus a distinct transfer
handle, but no block device, session-management, or service-control authority.
The service has its own exact read and read-write endpoints. The tasks share one
kernel-owned page through separate generational mapping identities, and every
IPC-derived leaf is explicitly released through runtime transitive revocation.
The service alone owns the launch-bound principal, generated session, and
volatile 16-block backend. The client issues 18 strictly increasing canonical
requests to stage metadata, write and verify checkpoint data, flush, validate
four COW metadata images, replace and flush the inactive superblock, and recover
the exact selected file generation. It consumes the one-use publication receipt
and reloads the service-bound restart policy. The client then
exits through `ServiceSupervisor`, its address space is erased, and the service
must consume the exact typed peer-death event before exiting itself. The service
cleanup removes its shared mapping and host-resource binding. Only after both
service slots are `Exited` with no task or pending cleanup can the kernel emit
the terminal `0x30` marker. Each runner accepts at most 256 host exits and
requires the exact ordered cleanup markers `0x21`, `0x31`, `0x20`, `0x30`, while
allowing only service-call stages 1 through 3 between them.

The extended profile retains that transaction and now performs a second
production-selector phase. It publishes a canonical 48-block graph with four
distinct configuration, authority-checkpoint, deployment-checkpoint, and
SystemRelease files, reads both redundant roots, rejects the older candidate,
and validates every reachable metadata object through the same live session.
The resulting exact volume/root/file selections are checked before cleanup.
This increases the monotonic block protocol from 18 to 51 requests. A fresh
one-use-signed WHP run completed the established cleanup sequence; KVM was not
rerun because the configured Linux cross-host Rust target was unavailable.
The deployment/release placeholder contents in that historical run were not
authenticated, and that run did not exercise Total admission.

The current `block-service-probe` uses the same strict Total service admission
as the signed compositor fixture. Both hosted runners reserve the exact test
service route before constructing the guest, with separately verified kernel
and service images. The block-service receiver compares the kernel-reported
sender token to its launch-bound peer before processing block requests or the
completion message. The client receives separate exact configuration read,
write, and control grants rather than reusing broad handles across operations.
On success the runner verifies the complete ordered
cleanup and retires the guest before reporting one microVM and zero fallback.
This remains a RAM-backed diagnostic: the client and service share one hardware
microVM but have separate address spaces, and the installed coordinator and
cross-VM block-provider transport are not yet wired. The same signed artifact
set passed under nested KVM and WHP on 2026-11-27.

Fresh independently signed version-1 artifacts passed on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features --target x86_64-pc-windows-gnullvm
# 445 passed
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-storage --release --no-default-features
# 107 passed
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-whp --release --no-default-features
# 19 passed, 1 ignored manual performance gate
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-whp-run --release --no-default-features
# 6 passed
wsl env CARGO_TARGET_DIR=/mnt/c/Users/Mitch/Documents/mrml/.codex-kvm-target cargo test -p mrml-kvm-run --release --no-default-features
# 7 passed
mrml-whp-run ... block-service-probe ...
# verified independently signed CPL3 block-service stable-policy publication/recovery and lifecycle cleanup under WHP
mrml-kvm-run ... block-service-probe ...
# verified independently signed CPL3 block-service stable-policy publication/recovery and lifecycle cleanup under KVM
```

Scoped strict Clippy passed for `mrml-kernel`, `mrml-storage`, `mrml-config`,
both focused UEFI images, `mrml-whp-run`, and `mrml-kvm-run`. These are unit
tests, simulation, and hosted controlled probes.
WHP/KVM do not protect a guest from its host. The backend is volatile kernel-owned memory,
not a host block device; no reboot, durability, power-loss, bare-metal, TPM,
IOMMU, Secure Boot, or physical hardware result is claimed.

The `DIGITAL-RIGHTS REVIEW` found no new data collection, retention,
correlation, attestation, DRM, vendor veto, or durable authority. Cleanup only
reduces live authority and erases transient state. The `HOSTILE SECURITY
REVIEW` treats exit identity, peer-death reason, service generation, cleanup
tickets, mappings, resources, and host-visible stage order as hostile; any
mismatch halts or fails the runner before success. This agent review does not
replace the required independent human dual review.

The next backend-neutral storage-device layer is now an explicitly
**MRML-specific** virtual-block foundation, not a VirtIO-compatible device.
Canonical 64-byte requests bind version, operation, live device generation,
strictly increasing request ID, block range, and a bounded aligned guest buffer;
canonical 32-byte completions bind the same generation and request ID to an
exact status and transfer length. Reserved bytes, unknown operations/features,
zero or overflowing ranges, inconsistent lengths, stale generations, replay,
queue saturation, and forged completion tickets fail before authority state is
advanced. Read and write transfers are capped at 1 MiB; flush is available only
after exact feature negotiation.

The device core implements create, negotiate, activate, operate, suspend,
resume, fail, reset, remove, and destroy states. In-flight slots have independent
generations. Reset and removal preflight exhaustion, invalidate every live slot,
advance the device generation, discard queue/interrupt configuration, and make
old requests and tickets permanently stale. The VMM bridge uses disjoint,
page-aligned fixed-capacity request and completion rings. It copies a request to
private memory but returns it only after publishing the consumed position; any
guest-memory read or device-only completion write uncertainty erases or
withholds output and permanently poisons that bridge.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 345 `mrml-kernel` release tests and scoped strict Clippy. Focused
tests cover canonical parsing, hidden fields, feature/range/buffer rejection,
monotonic admission, capacity, forged tickets, lifecycle order, reset/removal,
transactional generation exhaustion, disjoint queue layout, hostile indices,
copy-before-consume ordering, and permanent poison after VMM memory uncertainty.
This is unit/simulation evidence only. A concrete backend, doorbells, interrupt
delivery, PCI transport, KVM/WHP attachment, a guest driver, QEMU differential
testing, and physical-device behavior remain unimplemented.

The `DIGITAL-RIGHTS REVIEW` found no collection, retention, tracking,
attestation, DRM, vendor veto, or persistent owner-state change; the device
exists only when separately provisioned and its protocol data carries no host
authority. The `HOSTILE SECURITY REVIEW` treats every feature, state, counter,
request, completion, GPA, length, slot, generation, and VMM memory result as
hostile. Validation precedes admission, reset invalidates stale work, and
uncertainty poisons rather than retries ambiguously. This agent review does not
replace the required independent human dual review.

The backend-neutral execution boundary now accepts only an already admitted
request, the exact active queue layout, one separately provisioned unsafe exact-
block backend, and caller-owned bounded scratch. Reads complete privately before
any guest write. Writes complete the guest copy before any backend call. Flush
has no payload and remains available only through the negotiated request path.
The complete scratch allocation is erased at entry and after use. A backend may
report a guaranteed no-mutation rejection, which becomes a detail-free device-
error completion while the device remains live. Any uncertain write or flush,
or any guest-memory uncertainty, poisons the bridge, fails the device, and
invalidates its in-flight tickets. Queue consumption and completion publication
remain separate from execution so later transports cannot conflate device logic,
interrupt policy, and PCI presentation.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 350 `mrml-kernel` release tests and scoped strict Clippy. The 13
focused virtual-block tests additionally cover exact queue/executor binding,
private read/write transfer, pre-I/O admitted-ticket replay rejection, flush,
complete scratch erasure, undersized scratch, clean backend rejection, uncertain
partial mutation, terminal failure on invalidation-generation exhaustion, and
guest-memory failure before backend mutation. This remains unit/simulation
evidence: no KVM/WHP
device attachment, concrete hosted or physical backend, interrupt, guest driver,
durability, or hardware behavior was exercised.

The follow-up `DIGITAL-RIGHTS REVIEW` again found no collection, retention,
tracking, DRM, attestation, remote disclosure, vendor veto, accessibility veto,
or persistent owner-state change. The `HOSTILE SECURITY REVIEW` additionally
treats scratch capacity, exact queue binding, backend classification, partial
mutation, and payload-memory results as hostile. Data never creates authority;
uncertain mutation cannot be retried through a live bridge. This agent review
does not replace the required independent human dual review.

The queue processor now composes one complete backend-neutral request
transaction without absorbing interrupt policy. It verifies that a nonexhausted
in-flight slot and completion-ring capacity both exist before consuming a guest
entry. An empty queue returns idle; a full completion ring or full in-flight
table returns backpressure without advancing the request-consumed counter.
Admission skips empty slots whose generations are exhausted. A malformed or
stale consumed entry returns an exact rejection and reaches neither guest payload
nor block backend. A valid entry is admitted, executed once, and its bound
completion is published before success is returned. Insufficient scratch after
admission, guest-memory uncertainty, uncertain mutation, or completion
publication uncertainty poisons the bridge and fails the device; a possible
mutation is never retried to manufacture a completion.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 356 `mrml-kernel` release tests and scoped strict Clippy. The 19
focused virtual-block tests cover complete write transaction and idle behavior,
pre-consumption completion backpressure, malformed-request consumption without
backend access, exhausted-slot selection, insufficient-scratch fail-stop, and
one backend mutation followed by uncertain completion publication in addition
to the earlier codec, lifecycle, execution, replay, and poison cases. This is
unit/simulation evidence only. No doorbell, capability-authorized interrupt
injection from this device, KVM/WHP attachment, concrete hosted/physical backend,
guest driver, durability behavior, or hardware behavior was exercised.

The transaction `DIGITAL-RIGHTS REVIEW` found no collection, retention,
tracking, DRM, attestation, remote disclosure, first-party bypass, accessibility
restriction, or persistent owner-state change. The `HOSTILE SECURITY REVIEW`
treats request and completion counters, capacity, malformed consumed records,
generation exhaustion, scratch, backend effects, and completion publication as
hostile. Backpressure precedes consumption and post-mutation uncertainty is
terminal. This agent review does not replace the required independent human dual
review.

Completion publication now sets one coalesced notification latch in the active
virtual-block device. A backend-neutral delivery helper reads only the device's
configured external vector and crosses the existing VM interrupt boundary,
which independently requires an allowlisted vector, a running VM, and exact
`SIGNAL` authority for the interrupt object. No pending latch returns without
backend access. Wrong-object or otherwise denied authority leaves the latch
pending. Confirmed backend injection clears it exactly once; backend injection
failure fails the VM and retains the latch so uncertainty cannot be mistaken
for acknowledgement. A device cannot suspend with pending notification, and
fail/reset/removal clear the latch with the rest of the generation's transient
state. Multiple published completions before delivery coalesce without an
unbounded counter.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 359 `mrml-kernel` release tests and scoped strict Clippy. The 22
focused virtual-block/interrupt tests include post-publication latching,
wrong-vector acknowledgement rejection, coalescing, suspend denial, terminal
lifecycle clearing, exact-object capability denial without acknowledgement,
successful one-use delivery, idle delivery without backend access, and backend
injection failure retaining notification while failing the VM. This is shared
unit/simulation evidence only. No virtual-block doorbell, KVM/WHP device
attachment, guest driver, concrete hosted/physical block backend, PCI transport,
durability, or hardware interrupt behavior was exercised.

The new release microbenchmark establishes a first optimized in-process policy
baseline over 10,000 complete simulated write transactions, including request
decode/admission, one 4 KiB scratch-backed mock write, completion publication,
notification latching, exact capability/vector authorization, mock injection,
and acknowledgement. Windows gnullvm measured 963,800 ns total (96.380 ns per
transaction); Arch Linux under WSL2 measured 1,067,570 ns total (106.757 ns per
transaction). These throughput-derived single samples are regression baselines,
not before/after optimization evidence. The mock backend and injection are
ordinary in-process memory operations; the figures are not storage latency,
hypervisor interrupt latency, interrupt-to-userspace latency, or hardware
throughput.

The notification `DIGITAL-RIGHTS REVIEW` found no collection, tracking,
retention, identity expansion, DRM, attestation, remote disclosure, vendor
preference, accessibility restriction, or persistent owner-state change. A
completion is data and cannot create interrupt authority. The `HOSTILE SECURITY
REVIEW` treats lifecycle, vector configuration, authorization, retry, backend
injection, reset, and removal as hostile; only confirmed authorized delivery
acknowledges pending state, and uncertainty fails closed. This agent review does
not replace the required independent human dual review.

The MRML-specific virtual-block doorbell is fixed at port `0x4d42` and accepts
only a 32-bit scalar write of value one. Its handler accepts the common
`ExitDisposition::Io` intended to come from the deny-by-default VM exit
dispatcher, treats even that host-side value as hostile, and independently
rechecks port, width, direction, and value before touching scratch, ring
counters, payload memory, or the block backend. The caller remains responsible
for crossing the common dispatcher first; the doorbell tuple itself is not an
authority proof. One accepted disposition invokes the existing processor once
and therefore consumes at most one request. Idle and backpressure retain their
existing behavior. Interrupt delivery remains the separate exact-`SIGNAL`
operation described above; neither the port nor its value carries authority.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 361 `mrml-kernel` release tests and scoped strict Clippy. The 24
focused virtual-block/interrupt tests now also cover wrong port, width,
direction, value, and non-I/O disposition without queue, scratch, backend, or
notification mutation, plus exact one-request-per-invocation behavior over two
queued requests. This is shared unit/simulation evidence only. The doorbell is
not wired into a KVM/WHP runner, PCI transport, guest driver, concrete block
backend, or physical device.

The 10,000-iteration optimized in-process benchmark now includes exact doorbell
validation before the previously measured transaction-through-interrupt path.
Windows measured 942,500 ns total (94.250 ns per iteration), versus the prior
963,800 ns/96.380 ns sample without the doorbell wrapper. Arch Linux under WSL2
measured 1,087,960 ns total (108.796 ns per iteration), versus the prior
1,067,570 ns/106.757 ns sample. These single-sample differences are measurement
noise, not an improvement or regression claim; the same mock-backend and
non-hypervisor exclusions apply.

The doorbell `DIGITAL-RIGHTS REVIEW` found no collection, tracking, retention,
identity expansion, DRM, attestation, remote disclosure, vendor preference,
accessibility restriction, or persistent owner-state change. The `HOSTILE
SECURITY REVIEW` treats every scalar field, dispatcher result, ring state,
backend result, and retry as hostile; mismatches precede all mutation and one
doorbell cannot drain an unbounded queue. Data remains non-authorizing, and all
existing uncertainty paths remain fail-stop. This agent review does not replace
the required independent human dual review.

A backend-neutral one-exit virtual-block runner now composes `VmBackend::run`,
the VM exit budget and lifecycle accounting, the common deny-by-default I/O
dispatcher, the independently revalidated MRML-specific doorbell, one bounded
queue transaction, and the exact capability-authorized interrupt delivery
boundary. If a completion notification is already pending, delivery is
attempted before entering the vCPU again. Every exit, doorbell, transaction, or
interrupt error fails the VM; failed interruption retains the device latch, so
the guest is never resumed after uncertain delivery. Both prepared KVM and WHP
guests implement the runner's memory contract. At that milestone, controlled
signed probes produced one fixed request and payload before executing this
doorbell path; no reusable block driver or completion consumer existed.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 365 `mrml-kernel` release tests and scoped strict Clippy. The 28
focused virtual-block tests include exact runner completion, bad-doorbell
failure before queue access, retained notification after injection failure, and
pending-notification delivery before vCPU entry. This is unit/simulation
evidence only, not native KVM/WHP doorbell execution or physical-device
evidence.

The optimized 10,000-iteration in-process runner benchmark measured 979,700 ns
total (97.970 ns per iteration) on Windows and 1,197,723 ns total (119.772 ns
per iteration) on Arch Linux under WSL2. Unlike the prior 94.250 ns and 108.796
ns samples, this includes mock backend entry, exit accounting, and common I/O
dispatch in addition to doorbell, transaction, and interrupt policy. These are
single noisy regression samples, not an improvement/regression claim, storage
latency, hypervisor latency, or hardware throughput.

The runner `DIGITAL-RIGHTS REVIEW` found no collection, tracking, retention,
identity expansion, DRM, attestation, remote disclosure, vendor preference,
accessibility restriction, or persistent owner-state change. Doorbell and exit
data create no authority. The `HOSTILE SECURITY REVIEW` treats native exits,
budgets, dispatcher results, notification state, capability state, queue
counters, backend effects, completion publication, and injection as hostile;
pending delivery precedes entry and uncertainty prevents resume. Existing
revocation, rollback-resistance, accessibility, and evidence gates are
unchanged. This agent review does not replace the required independent human
dual review.

`PreparedKvmGuest` and `PreparedWhpGuest` now implement the common
`VirtualBlockVmmMemory` contract and expose consuming transactional attachment
for one validated `VirtualBlockQueueLayout`. Each backend creates two disjoint
native ranges of the layout's exact rounded size. The request range is guest-
writable. The completion range is guest-read-only through ordinary VM memory
access but remains host-writable through the dedicated virtual-block device path.
If either native mapping fails, the consumed partially attached guest is not
returned to the caller. This mirrors guest-visible directionality across KVM
and WHP without moving queue policy into either backend.

Recorded verification on 2026-08-24: the Windows gnullvm `mrml-whp` release
suite passes 19 active tests (one manual benchmark ignored), including a live
WHP signed-guest test that attaches the block ranges, accepts a request write,
rejects an ordinary completion write, publishes a completion through
`VirtualBlockVmmMemory`, reads it back exactly, and reaches the signed guest's
expected endpoint. The Arch Linux/WSL2 `mrml-kvm` release suite passes 16 active
tests (one manual benchmark ignored) with the equivalent live `/dev/kvm` path.
Strict Clippy passes for each native package; the opposite-platform ABI suites
also pass (six KVM tests on Windows and ten WHP tests on Linux). These are
controlled hosted queue-memory tests. They do not execute a block doorbell in a
guest, attach a concrete block backend, prove host-resistant isolation, or
establish durability or physical-device behavior.

The existing 10,000-iteration live native map/revoke regression gates also
pass: WHP measured 241,167,600 ns total (24,116 ns per lifecycle), versus the
prior 240,192,000 ns/24,019 ns sample; KVM measured 668,296,254 ns total (66,829
ns per lifecycle), versus 692,148,811 ns/69,214 ns previously. These are noisy
single samples of allocation plus native mapping/removal, not virtual-block
throughput or an optimization claim.

The native-attachment `DIGITAL-RIGHTS REVIEW` found no collection, tracking,
retention, identity expansion, DRM, attestation, remote disclosure, vendor
preference, accessibility restriction, or durable owner-state change. The
`HOSTILE SECURITY REVIEW` treats layout arithmetic, range overlap, mapping-slot
capacity, native mapping results, directionality, ordinary guest writes, and
partial attachment as hostile; validation and consuming construction prevent a
partially attached guest from being resumed through this API. This agent review
does not replace the required independent human dual review.

The completion ring's consumer counter is now bridge-owned rather than read
from guest memory. The exact MRML-specific acknowledgement is a 32-bit write of
value one to port `0x4d43`; it advances one and only one already-published
completion and writes the resulting monotonic counter through
`VirtualBlockVmmMemory`, preserving the guest R/NX mapping. The handler accepts
acknowledgement only while the device is active, the bridge has the exact bound
queue, and no completion notification remains pending. Wrong port, width,
direction, or value returns before state or memory access. Empty, premature,
wrong-state, mismatched-queue, overflow, or device-path uncertainty poisons the
bridge and fails the device. The tuple is routing data and grants neither block
nor interrupt authority.

Recorded verification on 2026-08-24: Arch Linux under WSL2 passes all 369
`mrml-kernel` release tests, the 32 focused virtual-block tests, and scoped
strict Clippy. Four focused acknowledgement tests cover one-at-a-time protected
counter advancement and restored capacity, every scalar mismatch before
mutation, acknowledgement before confirmed notification delivery, uncertain
protected writes, and empty acknowledgements. The optimized 10,000-iteration
in-process runner-plus-acknowledgement regression sample measured 1,197,183 ns
total (119.718 ns per iteration) on Arch Linux/WSL2. Windows code and benchmark
tests type-check, but this shell had no MSVC linker, so no new Windows execution
evidence was recorded. These are unit/simulation and noisy benchmark evidence,
That evidence did not include native guest acknowledgement,
storage/hypervisor latency, durability, or physical-hardware evidence.

The acknowledgement `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, identity expansion, DRM, attestation, remote disclosure, vendor or
accessibility restriction, or durable owner-state change. Retiring a completion
only reduces transient queue state. The `HOSTILE SECURITY REVIEW` treats the
entire scalar tuple, lifecycle, queue binding, pending-notification state,
published/consumed positions, arithmetic, and protected memory result as
hostile; exact validation precedes mutation and accepted uncertainty is
terminal. Existing capability, revocation, rollback-resistance, accessibility,
and evidence gates are unchanged. This agent review does not replace the
required independent human dual review.

The signed native block probe now supplies a bounded two-request hosted path.
Its verified image fills one 4 KiB payload, publishes canonical write ID one,
and executes the exact doorbell. After the common runner mutates a volatile
backend, publishes completion one, and injects the separately authorized
vector, the guest returns through its signed one-vector handler, validates every
completion field, and acknowledges it. Only then does it overwrite the same
single request slot with read ID two and publish producer value two. A second
doorbell, completion, interrupt, validation, and acknowledgement returns the
backend page to guest memory; the host compares the complete 4 KiB result.
Minimal GDT, IDT, and descriptor records are signed read-only image data rather
than request-ring state. Each native exit is independently accounted and deny-
by-default dispatched, and any exit or acknowledgement error fails the VM. This
is bounded slot-reuse evidence, not a reusable guest driver, general interrupt
framework, unbounded request flow, concrete hosted storage service, or PCI
transport.

The dedicated `prepare_kernel_block_guest` launch path now makes those queues
guest-addressable without post-launch page-table mutation. KVM and WHP perform
complete physical/virtual overlap preflight, create disjoint native request and
completion mappings, and install identity mappings in the initial page tables.
Request pages are shared RW/NX; completion pages are shared R/NX to the guest
and remain writable only through `VirtualBlockVmmMemory`. KVM additionally
preflights the two native mapping slots. Any overlap, slot undercapacity, native
mapping failure, or page-table failure prevents a prepared guest from being
returned. The older consuming native-only attachment remains available for
host-side queue-memory tests; it does not imply guest page-table visibility.

Recorded verification on 2026-08-24: Arch Linux under WSL2 passes all 372
`mrml-kernel` release tests and 17 active `mrml-kvm` release tests with one
manual benchmark ignored. The live `/dev/kvm` test covers two notification
entries, exact protected completion validation, two native acknowledgement
exits, single-slot reuse, a write/read backend pair, complete page read-back,
and all producer/consumer positions reaching two while the VM remains running.
Scoped strict Clippy passes for the kernel, KVM, and WHP packages, and the ten
WHP ABI tests pass on Linux. The updated WHP native probe type-checks on Windows,
but this shell has no MSVC linker, so earlier WHP execution evidence does not
verify this new acknowledgement path. This is controlled hosted-hypervisor
evidence only.
It does not prove protection from the host, durability, power-loss behavior,
PCI behavior, a guest driver, bare metal, or physical-device operation.

The native suites also verify the initial block mappings by native page walk,
including exact GPA identity, writable/NX request leaves, read-only/NX
completion leaves, overlap rejection, and KVM slot undercapacity. This remains
hosted controlled-probe evidence; the guest image handles exactly one bounded
write/read pair.

The native test reads back and decodes both guest-produced requests, requires
the intermediate counters to reach one and the final counters to reach two,
verifies the volatile backend's complete 4 KiB write, decodes both successful
completions, and compares the complete read result. Each notification latch is
cleared only after injection and each completion slot is reused only after its
guest-issued acknowledgement advances the protected consumer counter. No host
queue or payload write occurs before initial vCPU entry. This closes bounded
single-slot write/read progress while leaving reusable driver state, negotiated
discovery, a general interrupt framework, WHP execution of the new flow, and
unbounded progress pending.

The slot-reuse `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, identity expansion, DRM, attestation, disclosure, vendor or
accessibility restriction, or durable owner-state change. The fixed payload is
local transient test data and grants no authority. The `HOSTILE SECURITY
REVIEW` treats both request IDs and records, the reused slot, every counter,
notification and interrupt return, both protected completions, payload copy,
backend effect, and native exit as hostile. Request two is unpublished until
completion one is validated and acknowledged; every exit crosses the common
dispatcher separately, and uncertainty fails closed. Existing capability,
revocation, rollback-resistance, accessibility, and evidence gates are
unchanged. This agent review does not replace the required independent human
dual review.

The next reusable-driver prerequisite is a canonical 128-byte active-device
configuration. It is explicitly MRML-specific and pointer-free. The record
binds version/classification, live generation, block size/count, supported and
negotiated features, request/completion bases and derived page count, slot
count, interrupt vector, exact doorbell and acknowledgement ports, the 1 MiB
transfer ceiling, and both wire-record sizes. Encoding clears every reserved
byte. Decode requires the exact length and constants, bounds geometry and
features, reconstructs the queue to recheck alignment/overlap/arithmetic, and
rejects any page-count mismatch. Only an active device with complete queue and
vector binding can construct a record.

A parsed configuration remains data, not authority. Before use it must compare
exactly with a fresh configuration from the live device. A generation mismatch
is stale; reset advances the generation and invalidates the old snapshot, while
suspend or another non-active state rejects validation. The record does not
create block-backend, mapping, interrupt, PCI, or capability authority.

The first common reusable guest-driver state is now allocation-free and
backend-neutral. `discover` runs the canonical configuration decoder and accepts
only four zero queue counters: a nonzero idle snapshot is intentionally rejected
because queue counts alone cannot reconstruct the last monotonic request ID.
Read/write preparation bounds block arithmetic, exact configured byte length,
the 1 MiB limit, and guest buffer wrap; flush additionally requires the
negotiated feature. Preparation is non-mutating and returns the canonical
request, derived slot, and next producer counter. Commit accepts only that exact
fresh ticket and fills at most the configured slot count. Completion acceptance
retires only the next protected consumer slot and preserves pending state on
every malformed, stale, misordered, wrong-generation,
wrong-request, or wrong-length record, then advances its local acknowledgement
position only after exact validation. It is now explicitly two-phase:
preparation returns a copied completion ticket without mutation, the caller may
publish the protected acknowledgement, and only the matching fresh ticket can
commit retirement. Ticket replay cannot free a later slot. Reset/removal and
request-ID exhaustion record an explicit terminal cause. Only reset is recoverable: rediscovery
requires the canonical exact-successor generation and four zero queue counters.
Every corrupt record, stale or skipped generation, nonzero counter, removal,
and exhausted sequence rejects without changing the terminal state. Reset or
removal invalidates every still-outstanding request; normal retirement frees
only its exact slot. Request-ID exhaustion blocks preparation without wrapping
while the last bounded window drains.

The common state now also has an unsafe backend-neutral guest queue-transport
contract. Request publication derives the exact configured slot, copies its
canonical bytes, release-publishes the producer, and only then uses the exact
configured doorbell tuple. Completion acquisition first observes the published
watermark and then copies the exact next consumer slot; an ahead watermark never
permits skipping. Acknowledgement uses the exact configured protected tuple to
release-publish only that consumer before local ticket commit. Exact address and
length access, release/acquire ordering, exact port/value use, and unchanged
producer/consumer counters without notification on error are mandatory unsafe-
implementation obligations. Every transport error preserves driver state, and
stale tickets fail before transport access. The current implementation is
exercised by a mock common transport and a concrete x86_64 direct transport
against a controlled port model; the existing guest-read-only completion
mapping is unchanged. The direct transport has an unsafe constructor requiring
live exact identity mappings and the same configured device. It uses volatile
wire-byte copies, aligned volatile 64-bit counters, release/acquire compiler
fences over x86 ordering, and exact `OUT DX, EAX`. After protected
acknowledgement resumes the guest it reads the supplied consumer counter and
fails stop rather than retire locally if the exact value is not visible.

Windows gnullvm and Arch Linux/WSL2 each passed all 382 release kernel tests and
scoped strict Clippy. Six focused tests cover strict fresh-queue discovery,
corrupt configuration and counter disagreement, non-mutating preparation,
canonical request encoding, stale/replayed publication tickets, forged and
misordered completions without state loss, exact capacity denial, multi-slot
fill and ordered retirement, post-retirement slot reuse, descendant
invalidation only on completion-ticket commit, completion-ticket replay, the
maximum 64-slot boundary, exact transport addresses, doorbell and
acknowledgement tuples, canonical request bytes, ahead completion watermarks,
transport-failure nonmutation, no-transport stale-ticket rejection, slot
progression, geometry/buffer
arithmetic, feature denial, exact reset rediscovery, unchanged-state rejection,
and permanently terminal removal/exhaustion. This is
unit/simulation evidence for the broad adversarial matrix. A freshly generated
one-time Lamport key additionally signed the exact compiled
`block-guest-driver-probe` image. The current probe uses a two-slot queue, two
disjoint 4 KiB payload mappings, and a volatile two-block launcher backend. It
repeats eight cycles. Every cycle publishes both writes before preparing either
completion, validates and acknowledges both in protected consumer order, clears
both payload pages, publishes both reads before retirement, drains them in
order, and compares both complete pages against distinct cycle-specific
patterns. Producer and completion watermarks therefore reach 32 while the two
physical slots wrap 16 times. This is bounded multi-window progress, not an
unbounded-progress claim.

One freshly generated one-time Lamport key signed the exact compiled image used
on both hosted backends. Arch Linux/WSL2 KVM reported
`verify=17143us prepare=3332us execute=677us total=50472us`; Windows WHP reported
`verify=16768us prepare=3793us execute=442us total=24575us`. Each image decoded
the read-only configuration, discovered four zero counters, executed native
`OUT`, crossed the shared fail-closed doorbell and acknowledgement runners, and
received vector 48 only through the exact `SIGNAL` capability and allowlist.
Timings are single controlled runs, not performance claims. Hosted KVM/WHP
remain subject to their hosts. Nonzero resume, unbounded progress,
persistence/durability, PCI, native boot, and physical hardware remain
unverified.

This live probe also exposed a descriptor-transition defect before the first
returning interrupt: loading the private GDT replaced the launcher's selectors
with the TSS while leaving cached CS/SS unchanged. Table installation now
validates both the pre-accessed ring-zero long-code descriptor and its adjacent
pre-accessed writable ring-zero data descriptor, then reloads CS, DS, ES, and SS
after `LGDT`/`LIDT`. Invalid selector state is rejected before privileged table
mutation. The clean signed probe completed only after that general fix; the
interrupt handler contains no probe-specific selector substitution.

The integration `DIGITAL-RIGHTS REVIEW` found no owner-identity binding,
collection, retention, correlation, disclosure, attestation mandate, DRM,
vendor preference, accessibility restriction, persistence, or third-party
authority. The fixed payload and volatile backend are discarded with the
launcher. The `HOSTILE SECURITY REVIEW` treats the signed image and handoff,
configuration bytes, mappings, queue counters and records, payload addresses
and lengths, I/O exits, backend result, interrupt vector and capability,
acknowledgements, and descriptor state as hostile. Admission remains signed and
rollback-checked; data never grants authority; every scalar tuple and protected
counter is revalidated; malformed exits or uncertain mutation fail the VM; and
the driver retires no request before exact protected acknowledgement. Existing
capability, revocation, rollback-resistance, accessibility, and evidence gates
are unchanged. This agent review does not replace the required independent
human dual review. The WHP parity integration adds no new data collection,
identity, persistence, attestation, accessibility surface, authority model, or
parser; it uses the same hostile-input set and fail-closed common policy as the
KVM path. The two-slot extension additionally treats framebuffer extent, both
block indices, payload ranges and patterns, capacity, producer/completion
watermarks, slot reuse and wrap, cycle index, and acknowledgement order as
hostile. The probe VM policy admits exactly 64 runner exits—one doorbell and one
protected acknowledgement for each of 32 requests—while ordinary launch budgets
remain unchanged. The launch
handoff admits exactly one or two framebuffer pages and rejects every other
count; no payload aliases queue memory, and the volatile backend independently
checks block multiplication, range addition, exact length, and slice bounds.

The next nonzero-history prerequisite is now implemented as a canonical 192-
byte virtual-block resume record and allocation-free reconstruction policy. The
record embeds the entire 128-byte active configuration and binds the request
producer, device-owned request consumer, completion producer, protected
completion consumer, last device-admitted request ID, and last guest-published
request ID. Capture succeeds only for an active device whose queue exactly
matches an unpoisoned bridge. It reads the producer and latest physical request
slot through the VMM memory boundary; uncertainty poisons the bridge. Stable
capture requires completion publication to equal request consumption and all
outstanding distances to fit configured capacity.

Reconstruction accepts exactly the configured number of physical request slots.
It decodes every retained outstanding request, derives the physical slot from
its monotonic position, rechecks generation, operation, negotiated flush,
geometry, transfer bound, address arithmetic, strict request-ID order, and both
history anchors, then rebuilds pending ownership without republishing or
retrying any request. An idle nonzero queue validates its retained latest slot
and chooses the exact successor ID. Exhaustion remains terminal. Wrong lengths,
counter substitution, stale generations, replayed or reordered IDs, mismatched
admitted/published anchors, malformed requests, hidden bytes, and backend read
failure all reject without a usable reconstructed driver.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux/WSL2 each
pass all 386 `mrml-kernel` release tests and scoped strict Clippy. Four new
focused tests cover pending and idle nonzero reconstruction, counter/slot/
history substitution, canonical encoding, exact successor IDs, live device-
bridge capture, and poison on uncertain reads. This is unit/simulation evidence
only. At that milestone no mapped resume page, quiescence/crash protocol,
hosted restart run, durability, PCI transport, native boot, or physical hardware
was exercised.

The reconstruction `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, attestation mandate, DRM, disclosure, vendor control,
accessibility restriction, persistence, or third-party authority. The bounded
record contains only queue mechanics required to avoid replay and grants no
authority. The `HOSTILE SECURITY REVIEW` treats the configuration, every
counter, ID anchor, request slot, generation, operation, geometry, address,
length, ordering relationship, backend read, and reconstructed descendant as
hostile. Exact live device/bridge binding precedes capture; uncertainty poisons;
all validation precedes reconstruction; and no request is retried or published
by reconstruction. Existing capability, revocation, rollback-resistance,
accessibility, evidence, and owner-sovereignty gates remain unchanged. This
agent review does not replace the required independent human dual review.

The canonical resume state now has a distinct backend-neutral page binding.
Construction requires a nonzero aligned GPA, checked page-end arithmetic, the
exact configuration-page/configuration pair, and disjointness from that page
and both queue extents. Encoding clears the complete 4 KiB page before writing
the 192-byte record. The common bridge recaptures the live state immediately
before publication and uses only the virtual-block device-write boundary;
uncertain capture or publication poisons the bridge. KVM and WHP launch
construction include the page in complete physical/virtual overlap validation,
initialize it from canonical fresh state, map it identity read-only/NX to the
guest, and retain device-path writes. Construction remains consuming and
transactional, so a partial native mapping, page-table installation, or initial
publication cannot return a runnable guest.

Recorded verification on 2026-08-24: Windows gnullvm passed 387 kernel tests,
20 of 21 WHP tests, and all 5 WHP-run tests; Arch Linux/WSL2 passed the same 387
kernel tests, 17 of 18 KVM tests, and all 6 KVM-run tests. The ignored native
case on each backend is the existing manual mapping-performance gate. Scoped
strict `--no-deps` Clippy passed for the kernel and corresponding backend and
runner stacks. Focused tests cover exact binding, alignment/overflow and overlap
rejection, zero tail, live recapture, publication uncertainty poisoning,
read-only/NX page walks, guest-write denial, and device-path writes. These are
unit/simulation and hosted controlled-launch tests. No signed guest consumed a
nonzero resume page; no crash, restart, persistence, durability, PCI, native
boot, bare-metal, or physical-hardware behavior was exercised.

The resume-page `DIGITAL-RIGHTS REVIEW` found no identity, content collection,
retention, correlation, disclosure, attestation requirement, DRM, publisher or
vendor control, first-party bypass, accessibility restriction, AI authority,
or persistent owner-state change. The page carries only bounded volatile queue
mechanics and grants no authority. The `HOSTILE SECURITY REVIEW` treats the
page and configuration GPAs, arithmetic, every overlap, canonical bytes and
zero tail, live configuration/generation, queue snapshot, native range capacity,
page-table permissions, guest and device writes, backend results, and partial
construction as hostile. Exact validation precedes mapping or publication;
guest writes are denied; uncertain state poisons; and no recovery authority or
request retry is inferred from page data. Existing capability, revocation,
rollback-resistance, accessibility, evidence, owner-sovereignty, and anti-
persistence gates are unchanged. This agent review does not replace the
required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional canonical state-page publication,
read-only/NX guest mapping, exact overlap validation, and fail-stop backend
handling; see [`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Guest reconstruction now consumes the complete canonical page rather than only
its 192-byte prefix. Exact 4 KiB length and an all-zero tail are required before
state decoding, after which the existing request-slot and replay checks remain
unchanged. The signed block workload adds one probe-specific scalar stop at the
midpoint, after operation 16 is fully acknowledged and before operation 17 is
published. That exit is admitted by an exact third I/O rule and charged to the
VM's 65-exit budget. While the vCPU is stopped, each runner verifies the exact
port, width, direction, and value; recaptures the live idle nonzero state;
requires all four counters and both ID anchors to equal 16; and publishes the
complete page through the device-only path. After the `OUT` resumes, the guest
copies the complete page and both exact physical request slots, replaces its
local driver with `reconstruct_from_page`, and continues request IDs 17 through
32. Final payload and counter checks remain unchanged.

Fresh one-time Lamport-signed version-1 execution on 2026-08-24 completed this
path under both hosted backends. Windows WHP reported `verify=16957us
prepare=3756us execute=514us total=25291us`; Arch Linux/WSL2 KVM reported
`verify=16909us prepare=2917us execute=709us total=45070us`. Windows gnullvm
also passed 387 kernel tests, 20 of 21 WHP tests, and all 5 WHP-run tests; Linux
passed 387 kernel tests, 17 of 18 KVM tests, and all 6 KVM-run tests. Each
ignored native case is the existing manual mapping-performance gate. Scoped
strict Clippy passed for both kernel/backend/runner stacks and for the UEFI
kernel image with `block-guest-driver-probe`. This is unit/simulation and
hosted controlled-probe evidence for bounded idle-state reinitialization. The
same VM and device continue running; no crash, VM rebuild, pending-work live
reconstruction, persistence, durability, PCI, native boot, bare metal, or
physical hardware was exercised.

The live-reconstruction `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, disclosure, attestation, DRM, vendor/publisher control,
first-party bypass, accessibility restriction, AI authority, or persistent
owner-state change. The stop and state page are local volatile test mechanics
and create no authority. The `HOSTILE SECURITY REVIEW` treats artifact
admission, the stop tuple and exit budget, stopped-vCPU ordering, every page
byte and tail byte, configuration/generation, counters, ID anchors, request
slots, reconstruction result, subsequent doorbells/acknowledgements, payloads,
and backend outcome as hostile. The stop occurs only after exact retirement;
all host state is checked before publication; all guest bytes are checked before
replacement; and mismatch or uncertainty fails the VM or guest without retry.
Existing capability, revocation, rollback-resistance, accessibility, evidence,
owner-sovereignty, and anti-persistence gates are unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional stopped-vCPU checkpointing,
canonical page decoding, bounded ring reconstruction, and monotonic continuation;
see [`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The live checkpoint now occurs after requests 13 and 14 have been consumed and
their protected completions published, but before the guest retires either one.
The stopped host requires request producer/consumed and completion-published
watermarks 14, completion-consumer watermark 12, and both history anchors 14
before publishing the page. The guest then reconstructs two pending ownership
records from the complete canonical page and exact physical request slots,
accepts and acknowledges both already-published completions in order, and
continues through request 32. This deliberately does not claim backend-in-flight
recovery: both backend mutations are complete at the checkpoint.

Fresh one-time Lamport-signed version-1 KVM execution on 2026-08-24 completed
the path and reported `verify=17084us prepare=2724us execute=748us
total=42076us`. Arch Linux/WSL2 passed all 387 kernel tests and all 6 KVM-run
tests. Package-focused strict `--no-deps` Clippy passed for the kernel, KVM
runner, and UEFI block probe. A broader dependency Clippy invocation stopped on
pre-existing unrelated warnings in `mrml-linux` and `mrml-crypto`. The WHP
runner has the matching checkpoint state transition, but this increment has no
new Windows build, unit, or live evidence because the available Windows shell
lacked `link.exe`; earlier idle-checkpoint WHP evidence is not promoted into
evidence for this change. No crash, VM rebuild, backend-in-flight recovery,
persistence, durability, PCI, native boot, bare metal, or physical hardware was
exercised.

The pending-ownership `DIGITAL-RIGHTS REVIEW` found no identity, content
collection, retention, correlation, disclosure, attestation mandate, DRM,
vendor/publisher veto, first-party bypass, accessibility restriction, AI
authority, or persistent owner-state change. The page and checkpoint remain
bounded volatile local mechanics and grant no authority. The `HOSTILE SECURITY
REVIEW` treats signed-artifact admission, the exact stop scalar and exit budget,
stopped-vCPU ordering, every page and zero-tail byte, configuration/generation,
all counters and ID anchors, physical slots, pending ownership, protected
completion order, acknowledgements, payloads, and backend results as hostile.
The published/consumer divergence must be exactly two, reconstruction retries
nothing, and any mismatch or uncertainty fails closed. Existing capability,
revocation, rollback-resistance, accessibility, evidence, owner-sovereignty,
data-minimization, anti-DRM, owner-controlled-attestation, AI-containment, and
anti-persistence gates remain unchanged. This agent review does not replace the
required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional reconstruction of two bounded
completed-but-unretired ring entries and ordered completion retirement; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Resume capture now enforces the lifecycle condition previously stated only in
documentation. `VirtualBlockQueueBridge::resume_state` accepts configuration
only from an explicitly `Suspended` device. Active-state capture fails before
reading queue memory. Device suspension itself already rejects every live
in-flight slot and pending completion interrupt, so a stopped vCPU cannot be
mistaken for complete device quiescence. KVM and WHP runners suspend after the
exact checkpoint tuple, publish and validate while suspended, and resume only
after every state check succeeds; any failure drops the run without returning
the device to active use. The canonical page remains data and carries no
lifecycle authority.

Fresh one-time Lamport-signed version-1 KVM execution on 2026-08-24 completed
the `Active -> Suspended -> capture/publish -> Active` path and reported
`verify=17067us prepare=2505us execute=729us total=40773us`. Arch Linux/WSL2
passed all 387 release kernel tests and all 6 release KVM-run tests. Package-
focused strict `--no-deps` Clippy passed for the kernel, KVM runner, and UEFI
block probe. WHP source parity is present, but no new Windows build or execution
evidence is claimed because the available shell still lacked `link.exe`. This
is hosted controlled-probe evidence, not VM-destruction/rebuild, crash,
backend-in-flight, persistence, durability, bare-metal, or physical-hardware
evidence.

The quiescence `DIGITAL-RIGHTS REVIEW` found no new identity, collection,
retention, correlation, disclosure, attestation mandate, DRM, vendor/publisher
control, first-party bypass, accessibility restriction, AI authority, or
persistent owner-state change. Suspension is local volatile lifecycle
mechanism and grants no authority. The `HOSTILE SECURITY REVIEW` treats the
signed artifact, exact checkpoint tuple and budget, vCPU stop, device state,
in-flight slots, interrupt latch, configuration, queue bytes and counters,
publication, validation, and resume result as hostile. Active capture is
rejected before memory access, suspension rejects residual device work, and no
failure path resumes uncertain state. Existing capability, revocation,
rollback-resistance, accessibility, evidence, owner-sovereignty, data-
minimization, anti-DRM, owner-controlled-attestation, AI-containment, and anti-
persistence gates remain unchanged. This agent review does not replace the
required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional explicit device suspension before
bounded canonical state capture and resume after successful publication; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The signed KVM block probe now crosses a real native VM replacement instead of
resuming the stopped vCPU after checkpoint publication. While the retained
capability-bound device remains suspended, the runner reads canonical request,
completion, and resume pages. Each queue image contains only its two required
counters and two live slots; all gaps, unused slots, and page tails remain zero.
It destroys the old native VM, then prepares a fresh native VM from the
same already verified executable,
canonical boot handoff, launch layout, configuration, and read-only/NX resume
binding; restores request memory through the ordinary host boundary and
completion/resume memory only through the device-write boundary; verifies the
replacement's two payload pages are freshly zeroed rather than restoring
completed-I/O data; and only then returns the device to `Active`. No
unrelated old guest RAM or resumable old execution context is retained.

The compiled kernel entry now decodes the complete resume page before creating
driver state and binds all four live queue counters to it. It accepts exactly
two probe states: canonical all-zero discovery, or producer/consumed/completion-
published watermarks 14, completion-consumer watermark 12, and both ID anchors
14. Any other nonzero or mismatched state halts. Recovery entry reconstructs
the two completed-but-unretired writes, skips their publication and the old
checkpoint, retires their protected completions, and continues with reads 15
and 16 through final request 32. The common VM policy identity, exit budget,
device, bridge, and volatile backend remain live; this is not reboot-time host
device reconstruction.

Fresh one-time Lamport-signed version-1 Arch Linux/WSL2 KVM execution on
2026-08-24 completed both kernel entries and reported `verify=17289us
prepare=2552us execute=46477us total=88649us`. Isolated release verification
passed all 387 kernel tests and all 6 KVM-run tests. Package-focused strict
`--no-deps` Clippy passed for the kernel, KVM runner, and UEFI block probe. No
new WHP build or execution evidence is claimed because the Windows linker was
unavailable. This proves orderly hosted KVM VM replacement only, not an
unplanned crash, WHP replacement, backend-in-flight recovery, persistent or
durable state, host resistance, native boot, bare metal, or physical hardware.

The VM-replacement `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, disclosure, attestation mandate, DRM, vendor/publisher
veto, first-party bypass, accessibility restriction, AI authority, or durable
owner-state change. Copying only three canonical device-required pages minimizes
retention and grants no authority. The `HOSTILE SECURITY REVIEW` treats the
verified artifact and handoff binding, checkpoint tuple and budget, old VM stop,
device suspension, every copied page and byte, queue/page directionality,
replacement mappings, live counters, history anchors, fresh-entry choice,
driver reconstruction, completion order, device resume, and backend result as
hostile. The old VM is never resumed; arbitrary old RAM is not copied; protected
pages use only the device-write path; focused tests reject configuration
substitution and each live-counter mismatch; mismatch or uncertainty returns no
active replacement. Existing capability, revocation, rollback-resistance,
accessibility, evidence, owner-sovereignty, data-minimization, anti-DRM, owner-
controlled-attestation, AI-containment, and anti-persistence gates remain
unchanged. This agent review does not replace the required independent human
dual review.

Patent review: `NOT_TRIGGERED` — conventional bounded device-page transfer into
a freshly prepared VM and exact fresh-versus-resume state selection; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The WHP block runner now mirrors the controlled replacement ordering. Its
stopped partition is read only for canonical request, completion, and resume
pages while the retained device stays suspended. A fresh partition
is prepared from the same verified executable, canonical handoff, launch
layout, configuration, and page protections. Request state uses the ordinary
host boundary; completion and resume state use only the virtual-block
device-write boundary. The runner destroys the old partition immediately after
snapshot and before replacement preparation. The device returns to `Active`
only after complete restoration, and every preparation or restoration error
returns without any old execution context to resume.

Native Windows verification passed:

```text
cargo check -p mrml-kernel -p mrml-whp -p mrml-whp-run --tests --no-default-features
cargo clippy -p mrml-kernel -p mrml-whp -p mrml-whp-run --all-targets --no-default-features --no-deps -- -D warnings
```

CUDA was excluded because it is unrelated to the block-only path. These gates
prove compilation, test-target compilation, lifetime ownership, and strict
scoped lint only. The environment still lacks `link.exe`, so no new Windows
test binary, runner executable, or live WHP replacement was produced. Earlier
WHP idle-checkpoint execution is not promoted into replacement evidence.

The WHP-parity `DIGITAL-RIGHTS REVIEW` found no new identity, collection,
retention, correlation, disclosure, attestation mandate, DRM, vendor/publisher
control, first-party bypass, accessibility restriction, AI authority, or
durable owner-state change. The same three-page minimum-retention boundary is
used and carries no authority. The `HOSTILE SECURITY REVIEW` treats the old
partition stop, retained-system lifetime, device suspension, all copied bytes,
mapping directionality, replacement preparation, consuming assignment, and
resume result as hostile. Protected pages cannot use ordinary writes, the old
partition is never resumed, and any error leaves the device suspended. Existing
capability, revocation, rollback-resistance, accessibility, evidence, owner-
sovereignty, data-minimization, anti-DRM, owner-controlled-attestation, AI-
containment, and anti-persistence gates remain unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — direct backend-parity implementation of the
same conventional stopped-partition replacement and bounded page restoration;
see [`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Both hosted runners now transfer ownership of the prepared guest into the block
probe. After the exact suspended checkpoint snapshot succeeds, `drop` destroys
the old KVM VM or WHP partition before the replacement builder is invoked. The
three bounded arrays and the retained suspended device/bridge/backend are the
only recovery inputs. If replacement preparation or any direction-checked page
write fails, the function returns with no old execution fallback and without
resuming the device. This closes an accidental rollback path to stale guest RAM
and proves that successful continuation enters a separately prepared execution
context.

Fresh one-time Lamport-signed version-1 KVM execution on 2026-08-24 completed
the no-fallback path and reported `verify=17894us prepare=2502us
execute=57260us total=98235us`. Arch Linux/WSL2 passed all 387 release kernel
tests and all 6 release KVM-run tests; strict package-focused Clippy passed for
the kernel and KVM runner. Native Windows test-target `check` and strict scoped
Clippy passed for the kernel, WHP adapter, and WHP runner with CUDA excluded.
No linked or live WHP evidence is claimed. This remains planned volatile
checkpoint recovery, not unplanned crash, persistence, backend-in-flight,
host-resistant, bare-metal, or physical-hardware evidence.

The no-fallback `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, disclosure, attestation mandate, DRM, vendor/publisher
control, first-party bypass, accessibility restriction, AI authority, or
durable owner-state change. Destroying unrelated old RAM earlier reduces
retention and creates no authority. The `HOSTILE SECURITY REVIEW` treats guest
ownership, snapshot completion, destruction ordering, all three arrays,
retained device/bridge/backend state, replacement construction, page-write
direction, restoration completion, and device resume as hostile. Destruction
occurs only after the full bounded snapshot, but before any replacement work;
later failure cannot resume stale execution and leaves the device suspended.
Existing capability, revocation, rollback-resistance, accessibility, evidence,
owner-sovereignty, data-minimization, anti-DRM, owner-controlled-attestation,
AI-containment, and anti-persistence gates remain unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional ownership consumption and old-VM
destruction before bounded checkpoint restoration; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The restart image is now canonical and data-minimized on both hosted backends.
The request page retains only producer/consumed counters and the two request
slots; the completion page retains only published/consumer counters and the two
completion slots; the validated resume page is retained in full. Zero-initialized
arrays canonicalize every omitted byte. Completed write payload pages are not
captured or restored, and the runner rejects a replacement unless those pages
read back as fresh zero memory before device resume. The old VM is still dropped
only after all three retained pages have been captured and before replacement
preparation, so snapshot failure preserves the stopped old VM while every later
failure remains fail-stop with the device suspended.

Fresh one-time Lamport-signed version-1 Arch Linux/WSL2 KVM execution on
2026-08-24 completed the canonical three-page path and reported
`verify=17421us prepare=2820us execute=49091us total=96198us`. Isolated release
verification passed all 387 kernel tests and all 6 KVM-run tests. Strict
package-focused `--no-deps` Clippy passed for the kernel and KVM runner. Native
Windows test-target `check` and strict scoped Clippy passed for the kernel, WHP
adapter, and WHP runner with CUDA excluded. No linked or live WHP evidence is
claimed. The consumed one-time signing material and signed test artifact were
deleted after the run.

The canonical-image `DIGITAL-RIGHTS REVIEW` found that omitting completed payload
data and unused queue bytes reduces collection, retention, and persistence. It
adds no identity, correlation, disclosure, attestation mandate, DRM,
vendor/publisher control, first-party bypass, accessibility restriction, AI
authority, or durable owner-state change. The `HOSTILE SECURITY REVIEW` treats
all offsets, lengths, counters, slots, padding, page directionality, replacement
memory initialization, and device-resume ordering as adversarial. Fixed bounds
select exactly two slots per queue; omitted bytes remain zero; protected pages
are restored only through the device-write boundary; nonzero fresh payload
memory fails closed; and no error after old-VM destruction can resume stale
execution. Existing capability, revocation, rollback-resistance, accessibility,
evidence, owner-sovereignty, anti-DRM, owner-controlled-attestation,
AI-containment, and anti-persistence gates remain unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional minimization and canonicalization
of a bounded restart image; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The canonical restart image is now an allocation-free common-kernel mechanism,
and both hosted runners have dropped their duplicated offset and copy policy.
Capture requires the exact suspended device/bridge pair and re-reads the
complete published resume page. It requires that page to decode canonically and
equal a newly captured live state, retains only request slots needed for pending
ownership or the latest nonzero history anchor, and retains only completion
slots not yet retired. Common validation reconstructs the guest driver from the
captured request slots and rejects every completion whose canonical generation,
request ID, terminal status, or successful byte count disagrees with its
request. All other fixed slot storage remains zero.

Restoration first reads every configured queue page and requires complete zero
extents. The replacement resume page must equal the exact canonical fresh page,
including the same configuration and configuration-page binding with zero live
counters; arbitrary zero or nonzero content is rejected. Only after all
freshness checks pass does restoration write required request slots through the
ordinary host boundary, then consumed/producer counters, followed by required
completion slots and consumer/published counters through the device boundary,
and finally the validated resume page. Any backend read or write uncertainty
poisons the retained bridge; partial replacement state never authorizes device
resume.

An initial one-time-signed KVM run failed closed because the first common
freshness predicate incorrectly expected an all-zero resume page. A prepared
guest correctly contains its canonical configuration record even when all live
counters are zero. The predicate was corrected to require that exact fresh
record. Fresh one-time Lamport-signed version-1 Arch Linux/WSL2 KVM execution on
2026-08-24 then completed and reported `verify=17191us prepare=2475us
execute=82677us total=123527us`. The focused common-image release test and all
388 release kernel tests passed; all 6 KVM-run release tests passed; and strict
package-focused `--no-deps` Clippy passed for the kernel and KVM runner. Native
Windows test-target `check` and strict scoped Clippy passed for the kernel, WHP
adapter, and WHP runner with CUDA excluded. The Windows unit binary did not link
because `link.exe` remains unavailable, so no live WHP evidence is claimed.
Consumed one-time signing material and signed test artifacts were deleted.

The common-image `DIGITAL-RIGHTS REVIEW` found that one bounded mechanism reduces
backend-specific overcollection risk and retains no unused slot history. It adds
no identity, correlation, disclosure, attestation mandate, DRM,
vendor/publisher control, first-party bypass, accessibility restriction, AI
authority, persistence, or durable owner-state change. The `HOSTILE SECURITY
REVIEW` treats device/bridge lifecycle, page and configuration binding, every
counter, offset, slot position, request/completion byte, freshness read,
publication order, direction boundary, and backend outcome as adversarial.
Capture accepts only state that independently reconstructs and whose unretired
completions exactly bind their requests. Restoration preflights all fresh
memory before mutation, publishes records before counters, poisons on uncertain
access, and leaves the device suspended on every failure. Existing capability,
revocation, rollback-resistance, accessibility, evidence, owner-sovereignty,
data-minimization, anti-DRM, owner-controlled-attestation, AI-containment, and
anti-persistence gates remain unchanged. This agent review does not replace the
required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional consolidation of bounded snapshot
validation and ordered restoration behind one backend-neutral mechanism; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The controlled replacement boundary is now host-forced instead of
guest-requested. After common doorbell processing has consumed requests 13 and
14 and published both protected completions, the runner does not enter the old
vCPU again. It independently suspends the device, captures and validates exact
`14/14/14/12` state, destroys the old native VM, and restores a fresh execution.
The block guest no longer contains the checkpoint `OUT`; KVM and WHP no longer
allow or dispatch its former port; and the exact VM-policy budget is 64 common
doorbell/acknowledgement exits rather than 65. The replacement kernel still
starts from its signed entry and reconstructs the two completed-but-unretired
requests without republishing or retrying them.

`VirtualBlockRestartImage` is now a linear recovery input. It is neither
`Clone` nor debug-formattable, and `restore_restart_image` consumes it by value,
so one capture cannot seed multiple replacement attempts. Its destructor uses
volatile writes to erase all encoded request slots, completion slots, and the
resume page on success and every error return. Configuration and scalar state
remain data only and never authorize device resume. Restoration failure still
leaves the retained device suspended and, after old-VM destruction, provides no
execution fallback.

Fresh one-time Lamport-signed version-1 Arch Linux/WSL2 KVM execution on
2026-08-24 completed this host-forced one-use path and reported
`verify=17163us prepare=2349us execute=76482us total=116649us`. All 388 release
kernel tests and all 6 release KVM-run tests passed. Strict package-focused
`--no-deps` Clippy passed for the kernel and KVM runner, and strict nightly UEFI
Clippy passed for the block-probe image. Native Windows test-target `check` and
strict scoped Clippy passed for the kernel, WHP adapter, and WHP runner with
CUDA excluded. No Windows test binary or live WHP execution is claimed because
`link.exe` remains unavailable. Consumed signing material and signed test
artifacts were deleted.

This is deterministic host-forced execution loss at an already quiescent,
fully completed backend boundary. It is not evidence of asynchronous or
unplanned vCPU failure, capture after native VM destruction, backend-in-flight
or uncertain-mutation recovery, persistence, durability, host resistance,
native boot, bare metal, or physical hardware.

The host-forced recovery `DIGITAL-RIGHTS REVIEW` found that eliminating the
guest checkpoint channel and making snapshot bytes one-use and erased reduces
retention and covert control surface. It adds no identity, collection beyond
the already required local queue state, correlation, disclosure, attestation
mandate, DRM, vendor/publisher control, first-party bypass, accessibility
restriction, AI authority, persistence, or durable owner-state change. The
`HOSTILE SECURITY REVIEW` treats the host-selected cut, exact 64-exit budget,
absence of checkpoint permission, device suspension, live counters and history
anchors, old-VM destruction, image linearity, destructor erasure, fresh-memory
preflight, directional publication, replacement entry, and resume result as
adversarial. The old guest receives no post-cut execution; the image cannot be
cloned or restored twice; every restoration outcome erases encoded snapshot
bytes; uncertainty poisons; and no mismatch resumes the device. Existing
capability, revocation, rollback-resistance, accessibility, evidence,
owner-sovereignty, data-minimization, anti-DRM, owner-controlled-attestation,
AI-containment, and anti-persistence gates remain unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional host-selected quiescent cut,
linear snapshot consumption, and volatile cleanup; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The old-native-execution loss boundary is now explicit type state rather than a
launcher comment. `capture_restart_image` returns data that cannot be passed to
restoration. Only unsafe `confirm_execution_loss` can consume it into
`VirtualBlockLostExecution`, and `restore_restart_image` accepts and consumes
only that distinct type. The unsafe contract requires the caller to have
consumed and irreversibly destroyed the exact native VM that supplied the
captured memory, forbids resuming that context or using retained memory to seed
another replacement, and requires the exact device and bridge to remain
suspended and unchanged. The witness is not authenticated evidence, a
capability, or device-resume authority.

Both KVM and WHP runners own the prepared guest by value. They capture while it
is stopped and the device is suspended, call `drop(guest)`, and only then cross
the unsafe confirmation boundary. Replacement preparation follows confirmation,
so no preparation/restoration failure can return to old execution. Dropping
either the unconfirmed image or confirmed witness still reaches the same
volatile encoded-byte erasure.

Fresh one-time Lamport-signed version-1 Arch Linux/WSL2 KVM execution on
2026-08-24 completed the typed loss transition and reported
`verify=17093us prepare=2423us execute=102391us total=143285us`. All 388 release
kernel tests and all 6 release KVM-run tests passed. Strict package-focused
`--no-deps` Clippy passed for the kernel and KVM runner, and strict nightly UEFI
Clippy passed for the block-probe image. Native Windows test-target `check` and
strict scoped Clippy passed for the kernel, WHP adapter, and WHP runner with
CUDA excluded. No linked/live WHP claim is made. Consumed signing material and
signed test artifacts were deleted.

The execution-loss type-state `DIGITAL-RIGHTS REVIEW` found no new collection,
identity, correlation, disclosure, attestation mandate, DRM, vendor/publisher
control, first-party bypass, accessibility restriction, AI authority,
persistence, or durable owner-state change. Separating captured data from
restorable post-loss state narrows accidental replay and creates no authority.
The `HOSTILE SECURITY REVIEW` treats guest ownership, the caller's unsafe loss
assertion, destruction ordering, retained aliases, device/bridge identity and
lifecycle, type transitions, replacement preparation, image erasure,
restoration result, and resume decision as adversarial. Capture alone cannot
type-check as restoration input; the concrete runners confirm only after
consuming the old guest; the witness is linear and erased; and every later
failure remains suspended with no old execution fallback. This does not prove
an asynchronous crash detector or authenticate a host claim. Existing
capability, revocation, rollback-resistance, accessibility, evidence,
owner-sovereignty, data-minimization, anti-DRM, owner-controlled-attestation,
AI-containment, and anti-persistence gates remain unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional linear type-state around an
unsafe native-resource destruction boundary; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The hosted virtual-block control path now has one backend-neutral transaction
runner for both scalar transport directions. One invocation first delivers an
already-pending completion notification, enters the vCPU exactly once through
the common VM dispatcher and exit-budget accounting, and accepts only the
canonical MRML-specific doorbell or protected acknowledgement tuple. A
doorbell processes at most one request and delivers any newly latched
notification before return; an acknowledgement advances exactly one protected
consumer position. Any other disposition or any exit, queue, backend, or
interrupt-stage error fails the VM. KVM and WHP block launchers use this common
entry point for both directions instead of selecting separate runner
functions. The existing one-direction functions remain narrow primitives.

Recorded verification on 2026-08-24: Arch Linux under WSL2 passed all 390
release `mrml-kernel` tests, all 6 release `mrml-kvm-run` tests, strict scoped
`--no-deps` Clippy for the kernel and KVM runner, and strict nightly UEFI
Clippy for the `block-guest-driver-probe` image. Native Windows test-target
`check` and strict scoped Clippy passed for the kernel, WHP adapter, and WHP
runner with default/CUDA features excluded; `link.exe` remained unavailable,
so no linked or live WHP claim is made. A fresh one-time Lamport-signed
version-1 KVM probe completed the common transaction dispatch and existing
replacement sequence with `verify=16861us prepare=2257us execute=81077us
total=101410us`. The temporary signing key and signed artifacts were removed.
This is bounded unit/simulation and hosted controlled KVM evidence. It is not a
general scheduler loop, asynchronous crash detection, backend-in-flight
recovery, persistence, durability, host resistance, native boot, bare metal,
or physical-hardware evidence.

The transaction-runner `DIGITAL-RIGHTS REVIEW` found no new identity,
collection, retention, correlation, disclosure, attestation mandate, DRM,
vendor/publisher control, first-party bypass, accessibility restriction, AI
authority, persistence, or durable owner-state change. Consolidating existing
local transport mechanics creates no authority and exposes no additional
state. The `HOSTILE SECURITY REVIEW` treats the native exit, translated
disposition, port, width, direction, value, exit budget, pending interrupt,
capability/object pair, queue counters, device/bridge identity and lifecycle,
backend result, scratch contents, and acknowledgement position as hostile.
Only the two exact tuples dispatch; pending notification precedes entry; a
completion is notified before return; every mismatch or uncertain stage fails
the VM; and existing device/bridge fail-stop behavior remains intact. The
runner neither infers execution loss nor weakens recovery suspension. Existing
capability, revocation, rollback-resistance, accessibility, evidence,
owner-sovereignty, data-minimization, anti-DRM, owner-controlled-attestation,
third-party-accessibility, AI-containment, and anti-persistence gates remain
unchanged. This agent review does not replace the required independent human
dual review.

Patent review: `NOT_TRIGGERED` — conventional consolidation of bounded exit
dispatch, fixed scalar I/O tuples, queue processing, and interrupt delivery;
see [`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Virtual-block transport mechanics now have one typed identity binding. The
device owns `VirtualBlockTransport::MrmlSpecificScalarIo`; its canonical
configuration exposes the same binding, and configuration encoding derives the
two fixed ports from it. Guest request publication and protected completion
acknowledgement, host doorbell and acknowledgement revalidation, and the common
transaction runner likewise derive their exact port/value tuples from the
bound transport. `VirtualBlockDevice::new_with_transport` makes transport
selection explicit while the existing constructor selects the sole implemented
MRML-specific variant. Transport identity remains data and grants no I/O,
queue, backend, mapping, or interrupt authority. No unimplemented PCI or VirtIO
variant is exposed.

Recorded verification on 2026-08-24: Arch Linux under WSL2 passed all 390
release `mrml-kernel` tests, all 6 release `mrml-kvm-run` tests, strict scoped
`--no-deps` Clippy for the kernel and KVM runner, and strict nightly UEFI
Clippy for the `block-guest-driver-probe` image. Native Windows test-target
`check` and strict scoped Clippy passed for the kernel, WHP adapter, and WHP
runner with default/CUDA features excluded. A fresh one-time Lamport-signed
version-1 KVM probe completed with `verify=17070us prepare=1936us
execute=105801us total=126078us`. All temporary signing artifacts were verified
absent afterward. No linked/live WHP claim is made because `link.exe` remains
unavailable. This is unit/simulation and hosted controlled KVM evidence for the
existing scalar transport only—not PCI, PCI configuration space, BARs,
MSI/MSI-X, MMIO, VirtIO compatibility, QEMU differential behavior, native
boot, bare metal, or physical hardware.

The transport-binding `DIGITAL-RIGHTS REVIEW` found no new identity,
collection, retention, correlation, disclosure, attestation mandate, DRM,
vendor/publisher control, first-party bypass, accessibility restriction, AI
authority, persistence, or durable owner-state change. Naming the existing
mechanics creates no authority or tracking surface. The `HOSTILE SECURITY
REVIEW` treats transport identity, canonical configuration bytes, generation,
port/value tuples, guest transport calls, translated exits, device/bridge
identity and lifecycle, queue counters, interrupt authority, reset, and
substitution attempts as hostile. All layers derive the same exact binding;
configuration corruption remains noncanonical; reset makes old configuration
stale; scalar data never authorizes I/O; and every existing fail-stop path is
preserved. The implementation exposes no nominal PCI/VirtIO path that could be
mistaken for compatibility. Existing capability, revocation, rollback-
resistance, accessibility, evidence, owner-sovereignty, data-minimization,
anti-DRM, owner-controlled-attestation, third-party-accessibility, AI-
containment, and anti-persistence gates remain unchanged. This agent review
does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional typed selection of fixed virtual-
device transport mechanics; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The transport binding now supplies admission policy as well as runtime
mechanics. `VirtualBlockTransport::io_policy` transactionally creates a fresh
deny-by-default `IoPortPolicy<2>` containing only the exact 32-bit write rules
for its doorbell and protected acknowledgement. No partially installed policy
escapes on construction failure. Both KVM and WHP block launchers obtain this
policy from the same transport value passed to `new_with_transport`; neither
launcher repeats the global port constants. Tests admit both exact writes and
deny reads, wrong widths, and a distinct unrelated port. The adjacent port is
deliberately the protected acknowledgement and is therefore independently
admitted, not treated as an arbitrary neighbor.

Recorded verification on 2026-08-24: after correcting that adversarial test's
initial mistaken assumption that the adjacent acknowledgement port should be
denied, Arch Linux under WSL2 passed all 390 release kernel tests and all 6
release KVM-run tests. Strict scoped Linux Clippy, strict nightly UEFI
block-probe Clippy, native Windows test-target `check`, and strict scoped
Windows Clippy passed for the same kernel/KVM or kernel/WHP scopes described
above. A fresh one-time Lamport-signed version-1 KVM probe completed with
`verify=16828us prepare=2304us execute=70778us total=91208us`; all exact
temporary and accidental signing-artifact paths were verified absent. No live
WHP, PCI, VirtIO, QEMU, native-boot, bare-metal, or physical-hardware evidence
is claimed.

The transport-policy `DIGITAL-RIGHTS REVIEW` found no new collection, identity,
correlation, disclosure, attestation mandate, DRM, vendor/publisher control,
accessibility restriction, AI authority, persistence, or durable owner-state
change. A local deny-by-default allowlist creates no authority or observation
surface. The `HOSTILE SECURITY REVIEW` treats transport selection, policy
construction, partial failure, rule aliasing, port, width, direction, value,
launcher/device substitution, and translated exits as hostile. Policy
construction returns no partial object, both launchers pass one exact binding
to policy and device, only the two exact writes cross common dispatch, and
capability-authorized notification remains separate. Existing capability,
revocation, rollback-resistance, accessibility, evidence, owner-sovereignty,
data-minimization, anti-DRM, owner-controlled-attestation, third-party-
accessibility, AI-containment, and anti-persistence gates remain unchanged.
This agent review does not replace the required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional transactional construction of a
fixed deny-by-default I/O allowlist from typed transport mechanics; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The next PCI prerequisite is an unattached backend-neutral Type-0
configuration-state core in `virtual_pci`. `VirtualPciIdentity` retains
externally supplied vendor, device, revision, programming-interface, class,
subclass, subsystem-vendor, and subsystem fields without treating them as
registration evidence or authority. `VirtualPciType0Function` synthesizes one
exact zero-filled 64-byte conventional header with header type zero and one
`VirtualPciMemoryBar`. The BAR is 32-bit, non-prefetchable, power-of-two sized,
at least 16 bytes, and initially unassigned. An all-ones dword write enters
probe state and reads back the exact size mask without changing the retained
address; the next ordinary write masks the address to both BAR geometry and
the memory-BAR address bits.

Configuration reads accept only aligned 1/2/4-byte accesses contained in the
64-byte header. Writes accept only an exact 16-bit command access or exact
32-bit BAR0 access; malformed, crossing, partial, or read-only writes return an
error without mutation. The command register supports only memory-space enable
and interrupt-disable. Bus mastering is explicitly rejected because this core
has no DMA transport, IOMMU binding, or revocation path. A BAR value is routing
data only and cannot create a host or guest mapping. The core exposes no PCI
capability list, MSI/MSI-X, expansion ROM, legacy pin, additional BAR, assigned
MRML identity, block binding, VMM configuration-space exit path, or guest
driver. It is therefore a defensive configuration-state foundation, not a
complete PCI/PCIe-compatible device.

The unattached function now has a checked nonzero lifetime generation. Memory
decode cannot be enabled before a nonzero BAR assignment, and BAR probing or
relocation is rejected while decode is active. `mmio_window` returns the exact
address, size, and generation only while decode is valid; every later use can
revalidate that complete value against the live function. `reset` first checks
that the generation can advance, then clears command, BAR assignment, and probe
state and publishes the successor generation. An old window therefore fails as
stale. Generation exhaustion changes nothing. This core owns no native mapping
or interrupt state, so this is not complete attached-device revocation. A future
attachment boundary must revoke or quarantine those resources before invoking
configuration reset; clearing bytes first would violate the lifecycle contract.

Recorded verification on 2026-08-24: Arch Linux under WSL2 passed all 398
release kernel tests, including 8 focused PCI-state tests. Strict scoped Linux
Clippy passed for the kernel and KVM runner, and strict nightly UEFI Clippy
passed for the block-probe image. Native Windows gnullvm passed the same 398
release kernel tests, test-target `check`, and strict scoped Clippy for the
kernel, WHP adapter, and WHP runner with default/CUDA features excluded. The
exact successful commands were `cargo +nightly-x86_64-pc-windows-gnullvm test
-p mrml-kernel --release --no-default-features`, `cargo
+nightly-x86_64-pc-windows-gnullvm check -p mrml-kernel -p mrml-whp -p
mrml-whp-run --tests --no-default-features`, `cargo
+nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel -p mrml-whp -p
mrml-whp-run --all-targets --no-default-features --no-deps -- -D warnings`,
`cargo test -q -p mrml-kernel --release --no-default-features`, `cargo clippy
-q -p mrml-kernel -p mrml-kvm-run --all-targets --no-default-features --no-deps
-- -D warnings`, and `cargo +nightly clippy -q -p mrml-kernel-image --release
--target x86_64-unknown-uefi --features block-guest-driver-probe --no-deps -- -D
warnings`; the final three ran in Arch Linux with isolated
`CARGO_TARGET_DIR=target/virtual-pci-reset`. An initial unqualified Windows
`cargo test` selected the repository's MSVC nightly override and failed before
linking because `link.exe` is unavailable; it is not test evidence. The PCI core
is unattached, so no signed runtime, PCI
enumeration, KVM/WHP configuration exit, QEMU differential, nested-
virtualization, native-boot, bare-metal, or physical-hardware evidence is
claimed.

The PCI-state `DIGITAL-RIGHTS REVIEW` found no identity collection,
registration claim, retention, correlation, disclosure, attestation mandate,
DRM, vendor/publisher control, first-party bypass, accessibility restriction,
AI authority, persistence, or durable owner-state change. Caller-supplied PCI
identity data is local configuration data and grants no authority. The
`HOSTILE SECURITY REVIEW` treats every identity field, offset, width, range,
command bit, BAR size, probe write, address write, arithmetic result, and
read-only field as hostile. Reset ordering, stale windows, and generation
exhaustion are hostile as well. Accesses are aligned and contained before copying;
unsupported writes preserve complete state; probe state cannot become an
address; address masking is bounded; bus mastering is unavailable; and BAR
data cannot map memory. Decode requires assignment, active decode prevents BAR
mutation, stale windows fail after reset, and exhaustion preserves live state.
The review explicitly found that local reset cannot stand in for native mapping
or interrupt revocation after attachment. Existing capability, revocation, rollback-resistance,
accessibility, evidence, owner-sovereignty, data-minimization, anti-DRM, owner-
controlled-attestation, third-party-accessibility, AI-containment, and anti-
persistence gates remain unchanged. This agent review does not replace the
required independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional bounded PCI Type-0 header state,
BAR probing/masking, generational reset invalidation, and transactional
configuration writes; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The next block/PCI lifecycle composition test exercises reset while generation
1 contains both a completion already published into guest memory with its
notification latched and a separate in-flight request. Exact cleanup resets the
old attachment and invalidates one request before PCI generation advance. A
fresh bridge and attachment then bind block and PCI generation 2. The old BAR
acknowledgement fails attachment validation before successor mutation; the old
ticket fails as stale; the old encoded request fails its generation check; and
a fresh generation-2 request remains admissible. The focused test and all 71
`virtual_block` plus 28 `virtual_pci` tests passed in Windows nightly gnullvm
release mode and Arch Linux/WSL release mode. Strict scoped kernel Clippy also
passed on both. The exact commands were `cargo
+nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release
--no-default-features pci_block_reset_with_pending_state`, the same command
with `virtual_block` and `virtual_pci` filters, `cargo
+nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel --release
--no-default-features --lib --no-deps -- -D warnings -A
clippy::result_unit_err`, and the equivalent Arch commands with
`CARGO_TARGET_DIR=target/pci-reset-pending-kvm` and the default Arch toolchain.
At that milestone this was unit/simulation evidence only; no hosted pending-I/O reset, live native
unmapping/hotplug, durable backend, QEMU, nested-virtualization, bare-metal,
physical-device, accessibility-device, or user evidence is claimed.

The pending-reset `DIGITAL-RIGHTS REVIEW` found no identity collection,
retention, disclosure, attestation mandate, DRM, publisher control,
accessibility restriction, AI authority, persistence, or durable owner-state
change. Backend access remains an exact independently revocable capability;
reset creates no ambient authority. The `HOSTILE SECURITY REVIEW` treats the
old attachment, BAR address, MMIO acknowledgement, completion, notification,
ticket, encoded request, bridge, and every generation as hostile. Attachment
validation precedes acknowledgement mutation; reset invalidates transient
state; a successor requires fresh generational bindings; and stale ticket and
request checks are independent. Existing rollback-resistance, accessibility,
evidence, owner-sovereignty, data-minimization, anti-DRM, owner-controlled-
attestation, third-party-accessibility, AI-containment, anti-persistence, and
dual-review gates remain unchanged. Patent review is `NOT_TRIGGERED`: this is
conventional testing of the existing MRML-native generational reset contract,
not a new compatibility or device mechanism. Planned patent-triggered work
remains gated by independent human dual review.

The next shared-policy increment adds `VirtualPciConfigurationRouter`, a fixed
eight-slot table above the unattached Type-0 core. `VirtualPciLocation` validates
the architectural 5-bit device and 3-bit function bounds while retaining exact
segment and bus identity. Attach preflights duplicate BDF and capacity before
insertion. Reads and writes route to exactly one present location and retain the
function's existing access validation and transactional mutation. An absent BDF
is an explicit policy error; a future concrete PCI transport, not this shared
router, must define any guest-visible absent-function read encoding. Attachment
also requires command zero, an unassigned BAR, and no active size probe, so a
previously configured function must pass explicit reset before reuse.

Each host attachment has a slot generation distinct from the function's reset
generation. Reset and detach require the exact live attachment ID. Detach first
requires memory decode to be disabled and preflights successor generation, then
removes the complete function and advances the slot lifetime. Reuse therefore
rejects an old host ID, while attachment-generation exhaustion leaves the
function present. The ID is not a capability: callers require mutable access to
the trusted router. No KVM/WHP exit decoder, PCI configuration transport, BAR
mapping, interrupt, DMA, assigned identity, or block attachment uses this table.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each passed all 404 release kernel tests, including 14 focused PCI tests. The
Windows kernel/WHP/WHP-run test-target check and strict scoped Clippy passed.
Strict scoped Linux Clippy passed for the kernel and KVM runner, and strict
nightly UEFI Clippy passed for the block-probe image. The successful commands
were the same scoped commands recorded above, with Linux using isolated
`CARGO_TARGET_DIR=target/virtual-pci-router`. This is unit and compile/lint
evidence only. No signed runtime, native configuration exit, ECAM/legacy
transport, PCI enumeration, QEMU differential, nested-virtualization,
native-boot, bare-metal, or physical-hardware evidence is claimed.

The router `DIGITAL-RIGHTS REVIEW` found no collection, retention, correlation,
remote disclosure, attestation, DRM, publisher/vendor preference, first-party
bypass, accessibility restriction, AI authority, owner-state persistence, or
interoperability lock-in. Segment/BDF and attachment IDs are local routing and
lifetime data and grant no authority. The `HOSTILE SECURITY REVIEW` treats every
location component, non-reset attachment, duplicate, absent lookup, slot,
capacity boundary, offset, width, value, attachment ID, generation, active-
decode removal, reset, reuse, and exhaustion path as hostile. Reset-state
admission, bounds, and uniqueness precede insertion; exact
lookup precedes access; function rejection remains transactional; detach checks
decode and successor generation before removal; and stale IDs cannot reset or
detach a reused slot. Native mapping, interrupt, DMA, and device cleanup remain
outside this unattached core and therefore remain explicit future gates.
Existing capability, revocation, rollback-resistance, accessibility, evidence,
owner-sovereignty, data-minimization, anti-DRM, owner-controlled-attestation,
third-party-accessibility, AI-containment, and anti-persistence requirements are
unchanged. This agent review does not replace independent human implementer,
reviewer, adversary, accessibility, or hardware review.

Patent review: `NOT_TRIGGERED` — conventional fixed-capacity exact-key routing
and generational slot invalidation over the existing PCI state; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

`VirtualPciConfigurationMechanismOne` now supplies the canonical conventional
scalar-I/O transport above that router. Its address register accepts only an
exact 32-bit access at `0xCF8`; selector bits 30--24 and 1--0 must be zero. An
enabled selector decodes segment zero plus the exact bus, device, function, and
dword-aligned register. Data accesses are restricted to the seven valid aligned
byte/word/dword tuples within `0xCFC..=0xCFF`; no access can cross the selected
dword. The transport constructs all eight address/data rules transactionally in
an otherwise deny-all `IoPortPolicy`.

Reads and writes to a present selection use the router and therefore retain the
function's bounded header and transactional write checks. When selection is
disabled or the exact BDF is absent, reads return only `0xff`, `0xffff`, or
`0xffff_ffff` according to width and writes have no effect. The address register
is readable. Invalid selectors or port geometry preserve both selector and
function state. Registers beyond the implemented 64-byte Type-0 header still
fail explicitly rather than creating an undocumented extended configuration
space. No native exit dispatcher, guest-register read completion, block
function, assigned identity, BAR mapping, interrupt, DMA, or PCI advertisement
uses this contract yet.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: YES
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each passed all 409 release kernel tests, including 19 focused PCI tests. The
Windows kernel/WHP/WHP-run test-target check and strict scoped Clippy passed.
Strict scoped Linux Clippy passed for the kernel and KVM runner, and strict
nightly UEFI Clippy passed for the block-probe image. The successful commands
were the same scoped commands recorded above, with Linux using isolated
`CARGO_TARGET_DIR=target/virtual-pci-cf8`. This is unit and compile/lint evidence
only. No native I/O-exit integration, signed runtime, PCI enumeration, QEMU
differential, nested-virtualization, native-boot, bare-metal, or physical-
hardware evidence is claimed.

The transport `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, attestation, DRM, vendor/publisher preference, first-
party bypass, accessibility restriction, AI authority, persistent owner state,
or lock-in. Conventional port and selector compatibility grants no host/device
authority. The `HOSTILE SECURITY REVIEW` treats port, width, direction, value,
enable and reserved bits, BDF fields, register and port-offset arithmetic,
disabled/absent functions, read width, router errors, repeated selectors, and
partial writes as hostile. Exact allowlist construction is transactional;
selector validation precedes mutation; data geometry is aligned and contained;
absent state returns bounded public constants; and present mutations retain the
router/function transaction boundary. Native exit decoding and guest-register
writeback remain unimplemented and therefore unclaimed. Existing capability,
revocation, rollback-resistance, accessibility, evidence, owner-sovereignty,
data-minimization, anti-DRM, owner-controlled-attestation, third-party-
accessibility, AI-containment, and anti-persistence requirements remain
unchanged. This agent review does not replace independent human implementer,
reviewer, adversary, accessibility, or hardware review.

Patent review: `NOT_TRIGGERED` — conventional PCI Configuration Mechanism #1
field decoding and bounded scalar-I/O dispatch; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The next backend-neutral increment adds `IoReadCompleter` and
`run_pci_configuration_once`. The completion contract exists separately from
ordinary guest-memory writes: an implementation must verify that the exact
vCPU's scalar-input exit is still pending with the same port and width, publish
only the width-bounded value, and report success only if no partial native state
can remain uncertain. The common runner creates the exact eight-rule transport
policy, enters one vCPU through the existing exit-accounting dispatcher, accepts
only its resulting PCI I/O disposition, processes it through Mechanism #1 and
the router, and completes reads before returning. Writes never invoke input
completion. A rejected transport, failed completion, or non-PCI disposition
fails the VM before another entry.

Focused mock-backend tests bind present and absent 16-bit reads to the exact
vCPU/port/width/value tuple, prove selector writes do not call completion, and
inject completion failure and an unrelated interrupt exit. The latter paths
leave the VM permanently failed. KVM's run-page data write and WHP's RAX/RIP
update are not implemented by this increment; neither native backend implements
`IoReadCompleter` yet, so there is no live guest-input evidence.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each passed all 412 release kernel tests, including 22 focused PCI tests. The
Windows kernel/WHP/WHP-run test-target check and strict scoped Clippy passed.
Strict scoped Linux Clippy passed for the kernel and KVM runner, and strict
nightly UEFI Clippy passed for the block-probe image. The successful commands
were the same scoped commands recorded above, with Linux using isolated
`CARGO_TARGET_DIR=target/virtual-pci-runner`. This is unit and compile/lint
evidence only. No native read completion, native PCI runner, signed runtime,
enumeration, QEMU differential, nested-virtualization, native-boot, bare-metal,
or physical-hardware evidence is claimed.

The common-runner `DIGITAL-RIGHTS REVIEW` found no data collection, retention,
correlation, disclosure, attestation, DRM, publisher/vendor preference, hidden
first-party path, accessibility restriction, AI authority, persistence, or
lock-in. Read completion conveys only guest-requested public configuration data
already bounded by the router. The `HOSTILE SECURITY REVIEW` treats native exit,
vCPU, port, width, direction, value, policy construction, selector/router state,
read outcome class, completion binding, backend failure, repeated entry, and
unexpected disposition as hostile. Existing exit accounting and exact policy
precede transport mutation; only read outcomes can reach completion; every
failure fails the VM; and the unsafe native completion details remain outside
this unimplemented shared boundary. Existing capability, revocation, rollback-
resistance, accessibility, evidence, owner-sovereignty, data-minimization, anti-
DRM, owner-controlled-attestation, third-party-accessibility, AI-containment,
and anti-persistence requirements remain unchanged. This agent review does not
replace independent human implementer, reviewer, adversary, accessibility, or
hardware review.

Patent review: `NOT_TRIGGERED` — conventional one-exit dispatch and exact scalar
input completion contract; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Native KVM now implements that completion boundary. `KvmVcpu::run` refuses entry
while an earlier scalar input remains pending. After `KVM_RUN`, it decodes the
complete run page and records the exact port/width only for a one-element input
exit. Completion requires the same pending tuple, revalidates the run-page
header, exit reason, input direction, port, width, count, kernel-provided data
offset, checked end, and complete mapped range before mutation, then copies only
the low selected 1/2/4 native-endian bytes. The pending state clears only after
the infallible bounded copy completes. A mismatch, output exit, malformed page,
truncated range, duplicate completion, wrong vCPU, or re-entry-before-completion
fails closed. `PreparedKvmGuest` delegates the same exact trait implementation.

The allocation-free ABI test fills adjacent data bytes with a sentinel, proves
a 16-bit completion changes exactly two bytes, and verifies wrong port, smaller
or larger width, and output direction preserve the complete run page. Native
Linux compilation covers the pending-state integration, but no guest executes a
PCI input instruction through the common runner in this increment. WHP parity
is recorded separately below.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm passed all 412 release
kernel tests and 7 portable KVM ABI tests. Arch Linux under WSL2 passed the same
412 kernel tests plus 18 native KVM tests; one unrelated manual live mapping
performance gate remained ignored. Strict scoped Windows Clippy/check passed for
kernel, portable KVM, WHP, and WHP-run targets. Strict scoped Linux Clippy passed
for kernel, KVM, and KVM-run, and strict nightly UEFI Clippy passed for the
block-probe image. Linux used isolated
`CARGO_TARGET_DIR=target/kvm-pci-input`. This is unit and native compile/lint
evidence, not live PCI input, signed runtime, enumeration, QEMU differential,
nested-virtualization, native-boot, bare-metal, or physical-hardware evidence.

The KVM-completion `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, attestation, DRM, vendor/publisher preference, first-
party bypass, accessibility restriction, AI authority, persistence, or lock-in.
Only guest-requested public configuration data can be returned through the
separately authorized VMM path. The `HOSTILE SECURITY REVIEW` treats the shared
run page, header, exit reason, direction, port, width, count, offset, range,
value, pending tuple, vCPU identity, duplicate call, and subsequent entry as
hostile. Complete validation precedes the exact-width copy; pending state blocks
resume and clears only on success; mismatches preserve bytes and state; and
common policy fails the VM on adapter error. This does not authenticate a hosted
KVM host or establish host-resistant integrity. Existing capability, revocation,
rollback-resistance, accessibility, evidence, owner-sovereignty, data-
minimization, anti-DRM, owner-controlled-attestation, third-party-accessibility,
AI-containment, and anti-persistence requirements remain unchanged. This agent
review does not replace independent human implementer, reviewer, adversary,
accessibility, or hardware review.

Patent review: `NOT_TRIGGERED` — conventional KVM run-page scalar-input
completion with exact pending-state validation; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Native WHP now implements the same narrow completion boundary. Each prepared
partition retains at most one pending scalar-input tuple per created vCPU:
port, width, and the strictly decoded instruction length. A second run on that
vCPU is rejected until completion succeeds. Completion requires the exact vCPU,
port, and width, reads only RAX and RIP, preserves the unaffected RAX bits for
8- and 16-bit inputs, applies architectural zero-extension for a 32-bit input,
and checks RIP addition for overflow and x86-64 canonicality. It submits RAX and
RIP together through one WHP register-set call and clears pending state only
after that call reports success. Any lookup, register-read, validation, or
register-set failure retains the pending tuple and therefore prevents ambiguous
resume; mismatch and duplicate completion fail closed. `PreparedWhpGuest`
delegates the common `IoReadCompleter` contract to that partition state.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm passed 21 WHP release
tests with one unrelated manual performance test ignored. The new allocation-
free test covers byte/word preservation, dword zero-extension, checked next-RIP
calculation, invalid width, and noncanonical next RIP. Strict scoped Clippy for
kernel, WHP, and WHP-run passed with dependency linting excluded. This is
unit, compile, and lint evidence only: no guest executed a PCI input through the
common runner, and no live WHP, signed runtime, PCI discovery, QEMU differential,
nested-virtualization, native-boot, bare-metal, or physical-hardware claim is
made.

The WHP-completion `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, attestation, DRM, vendor or publisher preference,
first-party bypass, accessibility restriction, AI authority, persistence, or
lock-in. Only a capability-authorized VMM path can supply public configuration
data; names and data do not grant authority. The `HOSTILE SECURITY REVIEW`
treats vCPU identity, decoded exit, port, width, instruction length, RAX, RIP,
value, arithmetic, register API result, pending tuple, duplicate completion,
and subsequent entry as hostile. Exact tuple validation precedes mutation,
width semantics are explicit, RIP must remain canonical, RAX/RIP are submitted
together, and pending state clears only on reported success. An uncertain WHP
register failure cannot resume through this adapter. Hosted WHP remains outside
the security boundary against its host. Existing capability, revocation,
rollback-resistance, accessibility, evidence, owner-sovereignty, data-
minimization, anti-DRM, owner-controlled-attestation, third-party-accessibility,
AI-containment, and anti-persistence gates remain unchanged. This agent review
does not replace independent human implementer, reviewer, adversary,
accessibility, or hardware review.

Patent review: `NOT_TRIGGERED` — conventional exact WHP scalar-input register
completion with fail-closed pending-state validation; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The next controlled integration composes `run_pci_configuration_once` with both
native launchers and a dedicated signed `pci-configuration-probe` kernel image.
The guest writes selector `0x80ff_f800`, naming segment 0, bus 255, device 31,
function 0, register 0, then performs one 32-bit read from `0xcfc`. The trusted
router remains empty by construction, so the only accepted result is the PCI
absent-function value `0xffff_ffff`. After native scalar-input completion the
guest compares that exact value and emits it on dedicated proof port `0x4d66`.
Each launcher creates a two-exit VM budget, executes the selector and read
through the common policy/transport/router, checks both typed outcomes, then
requires the exact proof exit. No PCI identity is assigned, no function is
attached, and no BAR, interrupt, DMA, block-device, or compatibility authority
is created.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm passed 412 kernel, 7
portable KVM, 4 KVM-run, 21 WHP, and 5 WHP-run release tests; one unrelated WHP
manual performance test was ignored. Arch Linux under WSL2 passed 412 kernel,
18 native KVM, and 6 KVM-run tests; one unrelated native mapping performance
test was ignored. Strict scoped Clippy passed on both hosts, both launchers
compiled without default/CUDA features, and strict nightly UEFI Clippy passed
for `pci-configuration-probe`. A fresh one-time Lamport key signed the exact
image. Arch Linux under WSL2/KVM completed the signed probe with
`verify=17471us prepare=2283us execute=58131us total=99172us`.
Native Windows WHP completed the same signed bundle with `verify=17636us
prepare=3333us execute=2453us total=27148us`. These are hosted controlled probes
of absent-function transport and continuation, not evidence of an attached
function, enumeration, BAR mapping, interrupt delivery, DMA, block-device
attachment, QEMU differential behavior, native boot, bare metal, or physical
hardware. Hosted KVM/WHP remain outside the security boundary against their
hosts.

The native-runner `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, attestation, DRM, vendor or publisher preference,
first-party bypass, accessibility restriction, AI authority, persistence, or
lock-in. The probe publishes only conventional absence and creates no device or
owner-visible persistent state. The `HOSTILE SECURITY REVIEW` treats signed
image admission, selector, BDF, port, direction, width, exit count, typed
outcome, completion value, pending backend state, proof port/value, and every
error as hostile. The exact two-exit budget and deny-by-default transport bind
both transactions; the empty router cannot confer device authority; all-ones is
width checked; any mismatch fails before proof acceptance. Existing capability,
revocation, rollback-resistance, accessibility, evidence, owner-sovereignty,
data-minimization, anti-DRM, owner-controlled-attestation, third-party-
accessibility, AI-containment, and anti-persistence gates remain unchanged. This
agent review does not replace independent human implementer, reviewer,
adversary, accessibility, or hardware review.

Patent review: `NOT_TRIGGERED` — conventional signed absent-function PCI
configuration probing through existing native VMM exits; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The attached-lifecycle prerequisite now removes the router's cleanup-free reset
and detach operations. `VirtualPciAttachedResources` identifies the exact
attachment ID, BDF, function generation, and assigned generational MMIO window,
if one exists, even when memory decode is currently disabled. It remains data,
not authority. The unsafe
`VirtualPciFunctionRevoker` contract may report success only after every native
mapping, interrupt, DMA binding, queue, cached decision, device state, and
derived handle for that identity is unusable. `reset_with_revoker` preflights
attachment identity, function-generation capacity, decode state, and the exact
MMIO window before cleanup; revocation failure preserves all configuration.
Confirmed cleanup then clears command/BAR/probe state and publishes the already
preflighted successor generation. `detach_with_revoker` additionally requires
memory decode disabled and preflights attachment-generation capacity before
cleanup; only confirmed cleanup removes the slot and advances its attachment
generation. Stale identities and every preflight failure call no revoker.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm passed all 415 release
kernel tests and strict scoped Clippy. Three new focused tests prove exact active
MMIO cleanup identity, configuration preservation for a quarantined reset
failure, stale-window invalidation on an independent successful reset, no
cleanup after generation preflight failure, attachment preservation for a
quarantined detach failure, and attachment-generation advance only after an
independent confirmed removal. Arch Linux under WSL2 passed the same 415
kernel tests and strict scoped kernel/KVM/KVM-run Clippy using isolated
`CARGO_TARGET_DIR=target/pci-lifecycle`. This is unit and compile/lint evidence
for a backend-neutral contract, not a native KVM/WHP cleanup adapter, attached
function, PCI identity,
BAR mapping, interrupt, DMA, device, signed runtime, bare-metal, or physical-
hardware claim.

The attached-lifecycle `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, attestation, DRM, vendor or publisher preference,
first-party bypass, accessibility restriction, AI authority, persistence, or
lock-in. Cleanup identity is bounded local routing data and grants no authority.
The `HOSTILE SECURITY REVIEW` treats attachment ID/generation, BDF, function
generation, command, BAR, MMIO window, every native derived resource, revoker
result, retry, reset, detach, and exhaustion as hostile. All configuration
preflight precedes cleanup; preflight failure performs no cleanup; uncertain or
partial cleanup returns failure without configuration mutation; only confirmed
cleanup permits reset/removal mutation. Callers must quarantine or fail a VM
after cleanup uncertainty. Existing capability, revocation, rollback-
resistance, accessibility, evidence, owner-sovereignty, data-minimization, anti-
DRM, owner-controlled-attestation, third-party-accessibility, AI-containment,
and anti-persistence gates remain unchanged. This agent review does not replace
independent human implementer, reviewer, adversary, accessibility, or hardware
review.

Patent review: `NOT_TRIGGERED` — conventional revoke-before-reset/removal
composition with exact generational resource identity; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The next attached-lifecycle increment couples the PCI memory-decode command bit
to native BAR mapping state. The unsafe `VirtualPciMemoryMapper` receives the
same exact attachment ID, BDF, function generation, and assigned generational
MMIO window used by reset/removal cleanup. `map_window` may succeed only after
the complete intended mapping exists; `unmap_window` may succeed only after the
exact mapping is unusable. `Rejected` promises no native mutation, while
`Uncertain` covers partial or unprovable state and requires quarantine/fail-stop.

`write_with_mapper` fully preflights the command width, supported bits, BAR
assignment, old/new decode state, and cleanup identity. A disabled-to-enabled
transition maps before publishing the command; enabled-to-disabled unmaps before
clearing it. Native failure preserves the command and BAR. BAR probing or
assignment while decode is off remains configuration data and calls no mapper.
Interrupt-disable-only changes do not remap. The ordinary router and Mechanism
#1 paths now use a built-in deny mapper, so they cannot enable decode for a
present function. `access_with_mapper` and
`run_pci_configuration_once_with_mapper` are the explicit authorized
composition paths. A mapping rejection crossing the common runner fails the VM.

```text
Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

Recorded verification on 2026-08-24: Windows gnullvm passed all 418 release
kernel tests and strict scoped kernel/WHP/WHP-run Clippy. Three focused additions
prove deny-by-default enable, exact generational mapping identity, rejected and
uncertain enable preservation, independent successful enable, exact unmapping
identity, uncertain disable preservation, independent successful disable, BAR
retention after decode clear, and common-runner VM failure on mapping rejection.
Arch Linux under WSL2 passed the same 418 kernel tests and strict scoped
kernel/KVM/KVM-run Clippy with isolated
`CARGO_TARGET_DIR=target/pci-bar-lifecycle`. This is unit and compile/lint
evidence for a backend-neutral contract. The previously one-time-signed absent-
function probe also reran successfully through the new default-deny common
runner: KVM reported `verify=17374us prepare=2295us execute=55718us
total=97419us`, and WHP reported `verify=17983us prepare=3976us execute=2502us
total=28454us`. Those hosted controlled regressions exercise absence/read
transport only, not a native KVM/WHP BAR
adapter, attached function, assigned identity, live mapping, signed runtime,
bare-metal, or physical-hardware claim.

The BAR-lifecycle `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, attestation, DRM, vendor or publisher preference,
first-party bypass, accessibility restriction, AI authority, persistence, or
lock-in. BAR and generation values are bounded local routing data and never
authority. The `HOSTILE SECURITY REVIEW` treats attachment identity, BDF,
function generation, BAR address/size, command width/bits, old/new decode state,
mapper result, partial mapping, stale mapping, retry, and common-runner failure
as hostile. Complete preflight precedes native action; mapping precedes enable;
confirmed unmapping precedes disable; failure preserves configuration; default
routing denies transitions; uncertainty quarantines the VM. Existing
capability, revocation, rollback-resistance, accessibility, evidence, owner-
sovereignty, data-minimization, anti-DRM, owner-controlled-attestation, third-
party-accessibility, AI-containment, and anti-persistence gates remain
unchanged. This agent review does not replace independent human implementer,
reviewer, adversary, accessibility, or hardware review.

Patent review: `NOT_TRIGGERED` — conventional map-before-enable and unmap-before-
disable composition for a generational PCI BAR; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

The guest-state `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, attestation, DRM, disclosure, vendor preference,
accessibility restriction, or persistent owner-state change. The `HOSTILE
SECURITY REVIEW` treats configuration bytes, every queue counter, geometry,
feature, buffer range, arithmetic result, request ID, slot, copied ticket,
completion record, replay, terminal status, and exhaustion as hostile. Data
does not grant device or backend authority, preparation cannot silently commit,
invalid completion data cannot release pending ownership, and only an exact
reset successor can clear reset-terminal state. Capacity and request-ID
exhaustion cannot wrap, and terminal lifecycle invalidates outstanding derived
state only after the exact acknowledgement ticket commits. Guest-memory
addresses, mapping lifetime, alignment, ordering, shortening, redirection,
counter tearing, port/value substitution, acknowledgement visibility, error
atomicity, and watermarks are also hostile; the unsafe contract and fail-stop
native acknowledgement check make those guarantees explicit. Existing
capability, revocation, rollback-resistance, accessibility, and evidence gates
are unchanged. This agent review does not replace the required independent
human dual review.

The canonical record now has one backend-neutral guest-page binding. Its
constructor requires a nonzero page-aligned GPA, checked page-end arithmetic,
and complete disjointness from both exact queue extents. The KVM and WHP block
launch builders require the binding to contain the same queue they attach,
include the page in their complete physical/virtual overlap validation, reserve
the extra native range, publish a fully zeroed 4 KiB page through the
host/device-only write path, and identity-map it read-only/NX. Native guest
writes are rejected. Consuming launch construction remains transactional, so a
partial mapping or publication failure cannot return a runnable guest.

Arch Linux/WSL2 verification passed all 376 release kernel tests and 17 of 18
KVM tests; the one ignored KVM case is the existing manual mapping-performance
gate. The signed KVM block probe executed live and decoded the exact mapped
record, checked its read-only/NX leaf, rejected a guest write, and completed the
existing bounded write/read flow. Scoped strict Clippy passed for both crates.
Windows gnullvm passed all 376 release kernel tests and 20 of 21 WHP tests; the
one ignored WHP case is the existing manual mapping-performance gate. The
signed WHP block probe likewise executed live, decoded the mapped record,
checked the read-only/NX leaf, rejected a guest write, and completed the bounded
write/read flow. Scoped strict Clippy passed for both Windows crates. This is
hosted controlled-probe and unit/simulation evidence, not reusable guest-driver,
PCI, native-boot, or physical-hardware evidence.

The page-binding `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, attestation, DRM, disclosure, vendor preference,
accessibility restriction, or persistent owner-state change. The `HOSTILE
SECURITY REVIEW` treats the GPA, extent arithmetic, queue binding, native range
capacity, page bytes, permissions, publication, rollback, and stale generation
as hostile. Configuration remains data rather than authority and still requires
live-device revalidation before use. Existing capability, revocation,
rollback-resistance, accessibility, and evidence gates are unchanged. This
agent review does not replace the required independent human dual review.

Verification on Arch Linux under WSL2 ran all 375 release kernel unit tests and
scoped strict Clippy successfully; the three focused configuration tests cover
canonical round-trip and zero padding, 21 corrupt boundary classes including
queue aliasing, exact live binding, non-active rejection, and reset staleness.
Windows release `cargo check`, scoped strict Clippy, and the formatting check
also passed. Windows tests were not executed because the required MSVC linker is
not installed. At that milestone this was unit/simulation evidence only and did
not include guest mapping, PCI, native boot, nested virtualization, or physical
hardware.

The configuration `DIGITAL-RIGHTS REVIEW` found no identity, collection,
retention, correlation, attestation, DRM, disclosure, vendor preference,
accessibility restriction, or persistent owner-state change. The `HOSTILE
SECURITY REVIEW` treats every byte, reserved field, constant, feature,
generation, geometry value, GPA, page/slot count, vector, port, and stale copy as
hostile. Exact decode precedes use and live revalidation prevents data from
becoming authority. Existing capability, revocation, rollback-resistance,
accessibility, and evidence gates are unchanged. This agent review does not
replace the required independent human dual review.

The native-doorbell `DIGITAL-RIGHTS REVIEW` found no collection, tracking,
retention, identity expansion, DRM, attestation, remote disclosure, vendor
preference, accessibility restriction, or persistent owner-state change. The
signed image proves only exact test-image admission and is not owner-external
attestation. The `HOSTILE SECURITY REVIEW` treats artifact admission, native
exit decoding, every scalar field, queue counters and records, payload ranges,
backend effects, completion publication, capability/object binding, vector
policy, and injection as hostile; the common runner fails the VM on every
uncertain stage. Existing capability, revocation, rollback-resistance,
accessibility, and evidence gates remain unchanged. This agent review does not
replace the required independent human dual review.

The guest-producer `DIGITAL-RIGHTS REVIEW` found no collection, tracking,
retention, identity expansion, DRM, attestation, remote disclosure, vendor
preference, accessibility restriction, or persistent owner-state change. The
fixed payload is local test data and creates no authority. The `HOSTILE SECURITY
REVIEW` treats signed code bytes, every guest store, publication order, ring
header and record, payload range, native exit, backend copy, completion
publication, and interrupt injection as hostile. Canonical decoding and the
separate capability boundary revalidate all guest data; uncertainty fails the
VM. Existing capability, revocation, rollback-resistance, accessibility, and
evidence gates remain unchanged. This agent review does not replace the required
independent human dual review.

The guest-mapping `DIGITAL-RIGHTS REVIEW` found no collection, tracking,
retention, identity expansion, DRM, attestation, remote disclosure, vendor
preference, accessibility restriction, or persistent owner-state change. The
`HOSTILE SECURITY REVIEW` treats queue arithmetic, every physical and virtual
range, aliasing, native slot and page-table capacity, mapping results, leaf
permissions, and partial construction as hostile; full preflight and
transactional preparation prevent a partially mapped guest from being returned.
Completion authority remains outside the guest and all mappings remain NX.
Existing revocation, rollback-resistance, accessibility, and evidence gates are
unchanged. This agent review does not replace the required independent human
dual review.

Operations 7 and 8 are decoded, have a generic executor, and are wired into the
service-probe kernel image. They describe service reads from and writes to one
capability-selected shared buffer.
They carry the opaque generational capability, checked byte offset, userspace
copy address, and nonzero length capped at 1 MiB. The decoder rejects invalid
tokens, reserved registers, offset overflow, null or noncanonical user ranges,
ranges crossing the 47-bit userspace boundary, and oversized transfers. Access
is implicit in the operation so request data cannot choose an arbitrary rights
set: reads require the later executor to enforce exact `MAP|READ`, while writes
require exact `MAP|READ|WRITE`. No binding ID, mapping ID, host handle, or shared
address enters the ABI.

`SharedBufferSyscallExecutor` binds an accepted request to the current
`TaskRuntime` capability space and kernel-supplied VM/task identities. Before
bulk access it validates the complete userspace range in the correct direction,
constructs an exact single-capability authorization, and resolves the unique
live shared binding. Service reads revalidate and copy from the opaque resource
before copying to validated userspace; service writes copy from validated
userspace before revalidating and copying to the opaque resource. The entire
caller-provided scratch region is erased on every success or failure, and user
or resource backend uncertainty remains distinct. Tests cover both directions,
undersized scratch, rejected userspace, revoked authority, and backend failure,
including proof that rejected userspace and revoked authority touch no bulk
backend. The service-probe kernel-image dispatcher now executes both operations
through the active user-copy and opaque-resource composition. The userspace
block-service adapter compiles against that path and the focused signed KVM/WHP
probe invokes it as described above.

The concrete x86-64 userspace side is now available as
`ActiveTaskUserCopy`. It invokes the existing active page-table walker with the
exact expected CR3 and 1 MiB syscall ceiling, requiring every touched leaf to be
live, user-accessible, and writable when the kernel will copy to userspace.
Successful validation creates one private ticket bound to task, virtual address,
length, and direction. The corresponding direct active-address-space copy must
match every field and consumes the ticket even on mismatch; reuse and direction
changes fail. The generic executor explicitly cancels any ticket left after a
later capability, binding, or backend failure. The direct copy implementation
does not translate a request-supplied address into authority: it is usable only
behind the active-root validation ticket while page-table mutation is excluded.
Unit tests cover exact transfer, task/range/direction mismatch, consumption on
mismatch, and reuse; existing active-walker tests cover canonical range, leaf
permissions, and mapping bounds. The service-probe kernel-image handler/resource
wiring is implemented as described below.

The kernel now has a concrete fixed-capacity `HostResourceTable`. Registration
is an explicit unsafe supervisor operation because an address-backed resource
must remain live for its declared extent. The table assigns fresh monotonic
nonzero handles, rejects duplicate live resources, and never returns its
internal resource token through buffer I/O. Every transfer independently
rejects empty, overflowing, stale, or out-of-range requests before backend
access. Removal makes a handle stale; registering the same resource later
produces a different handle. The table implements the existing final-reference
retirement hook. Its direct supervisor-memory adapter checks address arithmetic,
performs exact copies behind an unsafe boundary, and erases the complete
registered range before retirement can succeed; backend uncertainty is
preserved. Unit tests cover exact transfer and retirement erasure.

Kernel-service cleanup no longer needs to impersonate a complete VMM backend.
`GuestMappingRevoker` is the minimal native teardown contract consumed before a
`GuestMemory` identity is removed; WHP/KVM revocable backends implement it
through the existing blanket composition. `ActiveServiceMappingRevoker` supplies
the x86-64 service path. Its unsafe constructor binds one active CR3 and one
exact mapping. Retirement rejects a different root, virtual base, or byte
extent, while the existing page-table preflight verifies every physical leaf
and permission before the first write; successful removal invalidates every
local translation and is one-use.

Hosted KVM and WHP service state now has a distinct observation transition for
kernel-side shared-leaf retirement. The host opens only the selected service's
existing authenticated page-table arena and performs a read-only check that
every leaf in the exact recorded mapping is absent. Only after full-range
success does it mark that slot non-live and eligible for the existing exact
restore path. A still-present leaf, missing mapping/root/instance, invalid slot,
or repeated observation changes no bookkeeping. This prevents a double-unmap
while retaining fail-closed host/guest agreement; it is compiled and unit-
policy-tested, not yet exercised by a newly signed hosted service probe.

KVM and WHP now also distinguish the existing common two-service diagnostic
page from capability-resource pages. A resource attachment selects exactly one
service slot and one user read/write page. It rejects a missing service,
duplicate slot, invalid shape, or any virtual/physical collision with the common
page or another resource before native allocation or page-table mutation. The
sibling root receives no leaf or supervisor alias. Resource revoke, verified
kernel-side revoke observation, and restore have state independent from the
common page. Restore zeroes the entire backing while the resource remains non-
live, then installs the exact leaf; reset failure cannot publish stale content.
KVM/WHP unit and strict compile gates cover the changed backends. The KVM and
WHP runners attach an independently backed page only to receiver slot zero. The
kernel image gives only that receiver separate exact non-delegable `MAP|READ`
and `MAP|READ|WRITE` capabilities. A distinct setup-only controller authorizes
binding projection and is revoked before userspace starts; it is never reused as
a data-plane write capability. The kernel retains the corresponding VM identity,
mapping, binding, and opaque resource internally. Binding selection permits the
read capability to attenuate a read/write endpoint but still requires the exact
per-operation capability shape; write cannot amplify read-only authority.
Shared-buffer syscalls validate the
current CR3, select the binding from current task authority and kernel-known VM
identity, validate the user range before copying, bound scratch to one page, and
return no handle or address. Receiver cleanup removes the exact active leaf,
then the mapping record and binding, retires the final opaque handle, and only
then emits the host cleanup transition. The runners therefore observe the
already absent resource leaf rather than unmapping it twice, restore only after
zeroing, and revoke again at final retirement. Sender cleanup never operates on
that resource slot. Service source reads zero state before writing and reading a
generation value. Fresh one-time signed runs on 2026-08-25 completed this path
on KVM and WHP, including generation-1 shared-buffer I/O, receiver cleanup,
complete backing erasure, resource reprovision, and generation-2 service
re-entry. KVM reported
`verify=22291us prepare=3336us execute=1608us total=70759us`; WHP reported
`verify=19026us prepare=5344us execute=971us total=49010us`. Both runners retain
bounded register/CR3/CR2 diagnostics on a stage mismatch. These are hosted
controlled probes, not host-resistant isolation, bare-metal, or physical-
hardware evidence.

Allocation metadata now distinguishes its own image allocation from ordinary
object metadata and requires exact root, publication generation, and range for
self-ownership. Extent lists now use a separate canonical block-aligned image
whose header binds file identity, object metadata generation, logical file
length, fixed record width/count, and the complete image including zero padding.
Decode rejects wrong identity/generation/length, noncanonical padding even under
a recomputed digest, malformed records, incomplete logical coverage, reserved
physical ranges, and intra-file overlap while reconstructing the `ExtentMap`.

Canonical directory-entry images now bind the owning directory and generation,
fixed entry width/count, full-image digest, and zero padding, then reconstruct
duplicate-name/object and self-reference checks. The fixed-capacity reachable
validator uses caller-supplied scratch storage and an unsafe backend contract
that must read every range from one immutable device generation. It validates
allocation-image self-ownership, resolves each child only through its unique
primary metadata allocation, checks directory parents and entry generations,
checks purpose-specific entry/extent metadata allocations, rebuilds every extent
map, and requires exact allocation ownership for every data extent. Duplicate
object references, object-capacity exhaustion, ambiguous metadata, missing data
ownership, and any allocation left unclaimed by the reachable graph fail closed.
Tests exercise an emulated root-directory/file graph; file contents are not read
during mount, and there is still no concrete block driver, physical atomicity,
power-loss, repair, durability, or anti-rollback evidence.

The public bounded recovery entry point composes redundant-root selection with
the reachable validator. An interrupted-publication simulation supplies a
checksum-valid generation-6 superblock while its referenced allocation image is
still canonically bound to generation 5. The newer graph is therefore proven
invalid and recovery returns the fully validated adjacent generation-5 root with
its fallback marker. Injecting an I/O failure at the same newer validation point
returns `Backend` and never falls back. These are deterministic in-memory image
and fault-injection tests, not storage-device or physical power-loss evidence.

A second crash model keeps volatile and durable metadata and superblock state
separate, injects failure after each publication operation, and discards all
volatile state on crash. Failures through the metadata flush recover only the
old root. Because replacement and final-flush failure are explicitly uncertain,
both modeled persistence outcomes recover either the old root or the new root
whose metadata is already durable. A completed final flush always recovers the
new root. The validator never selects a superblock without its durable metadata.
This models ordering and allowed outcomes only; it does not model a particular
drive cache, atomic-write unit, torn sector, controller, or physical power cut.

Allocation mutation now produces an immutable complete successor image. The
planner requires active self-ownership, advances exactly one publication
generation, removes the old allocation-image record, adds the disjoint new
allocation-image record, applies exact free/allocate changes, physically sorts
the result, and reconstructs all bounds/overlap invariants. The active image is
unchanged. Every addition is compared against every active range before frees
are considered, so a range freed by the same successor cannot be prematurely
reused. Missing and duplicate frees, overlap among additions, capacity failure,
generation exhaustion, and a non-disjoint new allocation image fail without
producing a successor. The complete canonical bytes are now staged and durably
flushed through an unsafe backend contract before a `PreparedAllocationUpdate`
exists, and the service derives its COW digest over those exact bytes. The
transaction resource model distinguishes volume allocation state from ordinary
object/kind participants, so allocation and the root directory may coexist in
one future transaction. Admission requires the exact allocation image in the COW
plan; only a one-use successful publication receipt exposes the successor.

Directory mutation now has the matching publication boundary. Preparation
requires the exact next object generation, valid disjoint unreachable metadata
and entry-list ranges, canonical encodings, and complete-image SHA3-256 digests.
The unsafe backend must stage both exact images and durably flush them before a
prepared update exists. Transaction admission binds the directory object and
both images to one volume publication generation, and only the participant's
one-use receipt exposes the immutable successor. A focused simulation publishes
the root directory metadata, entry image, and allocation image in one COW plan.
The earlier allocation image in that focused test was a plan write rather than
a prepared allocator participant. A separate canonical object-ID allocator now
has staging and transaction participation. Its prepared successor now requires
an exact allocation record with a distinct allocator-metadata purpose, root
lifetime anchor, allocator generation, and pointer range. The root anchor is
only lifetime accounting and grants no authority. This proof is not yet coupled
to complete directory creation.

The `DIGITAL-RIGHTS REVIEW` found no new collection, retention, correlation,
remote disclosure, tracking identity, publisher control, DRM, accessibility
exclusion, cloud dependency, or first-party bypass. Stable object identity and
namespace names remain non-authorizing; no owner, publisher, or first-party
bypass was added. Recovered-child opening requires a separately delegable
`OPEN_CHILD` capability, returns only kind-valid requested rights, records
derivation lineage, and remains subject to transitive parent revocation. The
`HOSTILE SECURITY REVIEW` treats pointers, lengths, handles, owners, kinds,
rights, generations, canonical bytes, transaction membership, backend outcomes,
and recovery images as hostile; exact binding, checked ranges, disjoint COW storage,
complete-image digests, capacity preflight, and one-use receipts fail closed on
stale, missing, duplicate, or substituted state. Allocator review additionally
requires distinct exhausted encoding, checked monotonic advance, disjoint COW
state, and complete-byte publication binding. The block-adapter review
additionally requires exact full-buffer transfers,
checked block arithmetic, canonical zero padding, digest verification after
write, an inactive superblock target, flush ordering, exclusive session access,
and permanent fail-stop poisoning after uncertain replacement durability. It
does not treat a device error as proof of corruption or permission to roll back.
File-data review additionally requires complete extent verification before
copying, exact predecessor identity/generation/length, verified old-source reads,
checked patch intersections, zeroed holes and tails, disjoint unreachable output,
complete readback, whole-file digest verification, output erasure by the file
API on backend failure, and one-use flush state. No name or stable object ID
authorizes either path.
Block-service review additionally requires that identity never grant I/O,
derivation authenticate the parent owner, rights only attenuate, every request
reauthorize before range disclosure, stale generations never revive, revocation
cover descendants, removal retire all device sessions, transfer arithmetic stay
bounded, operation rights remain independent, and backend errors remain
indeterminate failures. Ordinary session APIs do not expose device geometry.
Protocol review additionally requires exact fixed lengths, supported version and
opcode, canonical padding, bounded declared transfers, exact capability count,
no wire principal or pointer, buffer-shape equality, authenticated sender
binding, per-generation monotonic request IDs, replay rejection before I/O, and
fail-stop poisoning after uncertain mutation. Dispatcher restart without
session invalidation is outside the contract and remains forbidden.
Kernel-transfer review additionally requires exact capability cardinality and
exact nonzero receiver rights, generational reauthorization on every use, no
object-identity return before authorization, and subsequent exact shared-binding
resolution. Capability attenuation cannot become amplification, while excess
rights are rejected rather than silently accepted.
Shared-buffer review additionally requires the declared access to equal the
endpoint access, exact object and endpoint identity, live mapping generation,
unchanged host range/page count, non-executable state, and no raw-address return.
This agent review does not
replace independent human implementer, reviewer, adversary, or physical-device
review.

Ninety-nine focused storage tests and 331 focused kernel tests plus strict
crate-local clippy pass on Windows gnullvm and Arch Linux under WSL2. An isolated
block-service process and concrete receive/syscall integration, a
concrete hosted/physical device backend,
complete directory hierarchy/lifetime handling, reboot-time capability
checkpoint/reconstruction, complete crash recovery, snapshots, and
configuration-checkpoint persistence remain unimplemented.

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-storage --release --no-default-features
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-storage --release --no-default-features --no-deps -- -D warnings
cargo +nightly test -q -p mrml-storage --release --no-default-features
cargo +nightly clippy -q -p mrml-storage --release --no-default-features --no-deps -- -D warnings
```

Both storage unit-test runs pass 99 tests, both kernel runs pass 331 tests, and
all four strict crate-local clippy invocations pass.
These are unit tests and simulation of metadata/authority, exact-block adapter,
kernel capability-transfer state, opaque-handle bounded buffer I/O, generic
shared-buffer syscall execution, monotonic opaque-resource retirement, active
service mapping-revocation validation, host-side absent-leaf observation policy,
and
in-process block transport composition,
not
block-device, power-loss, hosted VMM, bare-metal, or physical-disk evidence.

Patent review: `NOT_TRIGGERED` — conventional one-use validation tickets and a
bounded monotonic resource-handle table; see
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

For this increment, the `DIGITAL-RIGHTS REVIEW` found no collection, retention,
remote disclosure, DRM/publisher veto, owner-attestation restriction,
accessibility exclusion, AI authority, or persistence. Handles are local
non-authorizing indirection and expose neither identity nor content. The
`HOSTILE SECURITY REVIEW` treats handles, offsets, lengths, resource lifetime,
and backend results as hostile: only table-issued live handles resolve; checked
arithmetic and declared extents precede backend access; live aliases, stale
handles, empty transfers, exhaustion, and uncertain backend outcomes fail
closed. Active service cleanup additionally exact-matches CR3, virtual extent,
physical leaves, permissions, and one-use state before mutation; mismatch leaves
policy identity live. Host observation additionally requires the complete
recorded leaf range to remain absent before changing one slot's re-arm state;
live or partially removed ranges and repeated observations fail closed.
Per-service resource admission additionally rejects common/sibling address
aliases, and generation re-arm cannot expose retained bytes because reset
precedes leaf installation. Kernel-image dispatch rechecks the active root and
requires separate exact task-bound read or read/write authority for the selected
operation; read may attenuate a read/write endpoint, while write cannot amplify
read-only authority. It admits at most one page through erased scratch and lets
no user input select a binding, VM, host handle, or supervisor address. Cleanup
must exact-match the receiver root and mapping before it removes any leaf;
missing state, repeated retirement, host disagreement, or restore failure halts
before replacement execution. The `DIGITAL-RIGHTS REVIEW` finds no new
collection, retention, correlation, remote disclosure, DRM or publisher veto,
owner-attestation restriction, accessibility exclusion, AI authority, or
persistence: the page is local, receiver-confined, erased across generations,
and carries no identity beyond non-authorizing internal state. Registration and
active page-table ownership remain explicit unsafe boundaries, and final-
reference cleanup uses the existing revocation path. This agent review
does not replace the constitution's independent human dual review.

The ancestry, successor-construction, and object-ID allocator increments also passed the two
repository reviews. The
`DIGITAL-RIGHTS REVIEW` found no new data collection, retention, disclosure,
publisher veto, DRM, owner-control or owner-attestation restriction,
accessibility exclusion, first-party bypass, AI authority, or persistence;
the local monotonic allocator adds no tracking or remote identity, and object IDs
remain non-authorizing. The `HOSTILE SECURITY REVIEW` treats every loaded
metadata record and parent link as hostile and requires exact immutable-
generation binding for every closure entry, exact predecessor-state reload,
bounded source/destination traversal, duplicate/cycle rejection, checked
generation advance, exact parent-entry replacement, whole-plan layout preflight,
pairwise range disjointness, exact allocation ownership, complete COW-plan
membership, atomic batch receipt consumption, replay rejection, and fail-closed
backend uncertainty. Primary file/directory metadata digests cover the exact
record and complete canonical zero tail; undersized extents and hidden nonzero
tail substitution fail before publication. Allocator images additionally require canonical exhaustion,
checked identity/generation advance, zero padding, distinct embedded and
complete-image digests, and one-use activation. Allocator metadata ownership
additionally requires a distinct allocation purpose and exact root anchor,
allocator generation, and pointer range; kind, owner, generation, and range
substitution fail closed, and the anchor conveys no authority. Authority reservations remain
inactive until exact activation, reject guessed/stale tokens, and retire their
generation on cancellation. Initial children bind exact type, identity, parent
where applicable, generation 1, canonical empty subordinate images, and an
unambiguous creation participant. Directory create assembly additionally
requires that retained parent to equal the unique inserting successor; a
different canonical parent or duplicate/missing namespace insertion fails
before transaction exposure. General mutation closure construction binds
the exact target-to-root predecessor chain and fails closed on stale parent
entries or incomplete propagation; shared staging rejects every cross-successor
range overlap before I/O. Grouped receipt consumption preflights the variable
directory set and fixed create participants as one exact set, rejecting missing
or cross-group duplicate membership without partial consumption. The complete
coordinator additionally binds the allocated ID and child type to the inactive
authority reservation, requires purpose-specific allocation ownership for every
new image, admits all participants to one publication generation, and exposes
no successor or handle until exact receipt consumption. An unrelated authority
table, guessed inactive handle, insufficient transaction/COW capacity, stale
generation, missing image, or substituted allocation purpose fails closed.
Recovery additionally treats the allocator as a mandatory reachable volume
resource: exact record cardinality, owner, generation, purpose, range,
canonical bytes, and forward next-ID relation are checked; exhaustion is
accepted as the more restrictive state, and backend uncertainty never becomes
permission to roll back. The create cut-point model uses the exact staged bytes
and complete allocation graph, injects every verification/flush/replacement
failure, and accepts only complete generation 5 or 6 recovery. No error path
activates the reserved handle. For a durable-new fail-stop, the model cancels
the stale inactive reservation and reopens the recovered named child only from
the exact surviving parent handle with `OPEN_CHILD`; `LOOKUP` alone fails. The
fresh handle carries kind-valid requested rights and parent lineage, so revoking
the parent invalidates it transitively. This is in-memory fail-stop evidence,
not reboot-time persistent capability reconstruction.

The first reboot-time storage-authority reconstruction foundation is now
implemented without serializing live capability tokens. A canonical v1
durable-grant checkpoint binds a nonzero monotonic recovery epoch, exact volume,
authenticated reachable-root generation, nonzero handle-generation high-water
mark, record count, and a complete SHA3-256 digest. Fixed records contain only
stable object identity, object kind, principal identity, requested rights, and an optional earlier parent-record
index. Root grants require an externally authenticated proof for the complete
checkpoint. Derived grants must retain the parent's object and kind, require
the parent to carry `DELEGATE`, and preserve or reduce rights. Earlier-only
parent indices exclude cycles and make reconstruction order canonical.

`AuthorityRecoveryGuard` first decodes and validates the complete checkpoint,
matches a consumed non-clonable proof across epoch, volume, selected root
generation, handle-generation high-water mark, and digest, and rejects either
monotonic value when it is not newer than authenticated starting state. It
builds a separate fresh fixed-capacity authority table whose slots start at the
authenticated handle generation. The table exposes a next recovery generation
strictly above every slot it has issued, so a stale token retained outside the
checkpoint cannot collide after reboot. The caller receives nothing and the
guards do not advance if any record fails. Parent revocation remains transitive
after reconstruction.
Safe code no longer constructs the proof or initializes rollback counters
directly. `OwnerApprovedAuthorityCheckpoint` and
`AuthenticatedAuthorityRecoveryState` are explicit unsafe recovery boundaries:
a raw file, digest, object ID, principal number, signature, or caller-chosen
counter cannot authorize a grant or weaken rollback state. A one-use issuer
redecodes the complete canonical bytes and matches digest, volume, selected
root, epoch, and handle generation before it alone creates the consumed proof.
Duplicate issue fails closed. The codec intentionally does not export the current live table,
because doing so would silently convert transient or time-bounded authority into
persistent authority.

The durable-grant bytes are now bound to the existing capability-native stable-
file and COW transaction path. Preparation checks exact file WRITE and
conditional RESIZE before producing checkpoint bytes, derives the handle-
generation high-water mark from the live table, and requires successor file
metadata to match the exact object, next generation, length, content digest,
extent map, and publication participant. Staged bytes do not become active
until the matching one-use transaction receipt is consumed. Recovery uses a
separate bootstrap file READ capability and only the exact nonzero file
generation already selected by authenticated reachable recovery. It performs
no older-generation search, preserves backend uncertainty, and erases the
caller policy buffer after every parsed success or rejection. Wrong file
generation fails before I/O; denied preparation produces no checkpoint bytes or
backend writes. Proof issuance occurs only after that authorized read succeeds,
so an I/O failure leaves the admission available for a serialized retry and
cannot advance the recovery guard.

Accepted rollback state now has a canonical 32-byte record containing the exact
nonzero epoch and handle-generation pair plus strict zero reserved bytes. A
backend-neutral store contract requires authenticated reads and power-loss-
atomic compare-and-store. Integrated stable recovery keeps the reconstructed
table local until the store advances from the exact state it loaded; conflict
or backend uncertainty returns no capabilities. An ordinary file is explicitly
not a conforming store. No TPM NV or equivalent backend or physical durability
evidence exists yet.

Dependent recovery now shares that release boundary. A consumed generic
transaction reconstructs the fresh table privately, invokes an explicitly
unsafe validator that must retain no storage authority or external side effect,
then performs the exact authenticated compare-and-store before returning either
result. The configuration validator uses one indexed reconstructed handle to
read only the selected stable-file generation, rechecks configuration-root
CONTROL and setting READ through the ordinary configuration gates, binds the
expected service object, and erases its scratch on success or rejection. A
dependent validation failure leaves accepted state unchanged; a store conflict
or uncertain write drops both the table and recovered configuration/policy.
The kernel supervisor now supports an immutable one-use registration plan bound
to one exact vacant slot generation, object, task, and restart policy. Commit
rechecks that slot before mutation. The configuration layer can prepare this
plan during dependent validation; storage commit returns a distinct
`CommittedRecoveredStorageAuthorities` wrapper, and only that wrapper with the
matching epoch can consume the plan into a released configuration, authority
table, and running service. A stale slot or mismatched epoch returns no recovered
system.

Recorded verification on 2026-08-24: Windows gnullvm and Arch Linux under WSL2
each pass all 107 `mrml-storage` tests and scoped strict Clippy. Focused tests
cover fresh attenuated lineage, descendant revocation, and cross-recovery stale-
token rejection; corruption and root-generation substitution; replay without
guard advancement; rights
amplification, forward lineage, hidden reserved data even with a recomputed
digest, capacity mismatch, dependent-validation rejection without state advance,
and configuration/policy validation through temporary reconstructed authority.
All 445 `mrml-kernel`, 107 `mrml-storage`, and 26 `mrml-config` tests pass on
Windows gnullvm and Linux/WSL; scoped strict Clippy passes for all three. The
configuration suite includes a deterministic exact-block/block-service path
through authority recovery, dependent policy validation, authenticated
compare-and-store, planned registration, and final service publication. This is unit/simulation
evidence only. Stable-
platform authentication of owner-approved policy, an owner-facing durable-grant
UI, boot orchestration, and a conforming physical monotonic-store backend remain
unimplemented, so complete reboot reconstruction and rollback resistance are not
claimed.
The signed hosted block service now crosses the narrower live binding gate. It
receives the one-use operation-13 record, binds it with `BootRecoveryAdmission`
to an independently constructed controlled test record before
readiness, requires the second load to fail with zero output, and erases all
copies. Fresh signed WHP and KVM probes passed this ordering; Windows gnullvm
and Linux/WSL2 each passed all 116 storage tests, and focused UEFI service
Clippy passed. The configuration client now independently rebinds the typed
data and executes the complete dependent transaction: owner-approved authority
checkpoint proof, temporary attenuated file authority, configuration/policy
validation, and the exact epoch 8→9, handle generation 2→3, root generation
1→2 compare-and-store precede result release. Windows and Linux also passed all
27 configuration tests. This is hosted controlled-oracle evidence only and
proves neither hardware authentication, durability, reboot recovery, physical
power-loss atomicity, nor rollback resistance.
The `DIGITAL-RIGHTS REVIEW` found no new collection, disclosure, stable remote
identity, vendor veto, DRM, deletion, or persistence authority: the record holds
only the two local anti-replay counters, and owner-approved grant policy remains
a separate explicit boundary. The `HOSTILE SECURITY REVIEW` treats checkpoint
bytes, state bytes, counters, reserved fields, storage reads, and concurrent
updates as hostile; malformed state, stale values, compare-and-store conflict,
and backend uncertainty release no reconstructed capability. This agent review
does not replace the required independent human dual review.

The next boundary layer now decodes buffered send and receive operations without
dereferencing their addresses. Payloads remain capped by the kernel's 4096-byte
IPC maximum and capability arrays by eight canonical 16-byte descriptors. Each
descriptor requires a live-looking generational token, nonempty known rights,
and zero reserved bytes; derivation still performs the authoritative generation,
DELEGATE, attenuation, capacity, and rollback checks. Zero, noncanonical,
misaligned, oversized, inconsistent optional buffers and nonzero reserved
arguments fail during register decoding.

`AddressSpace::resolve_user_buffer` proves a nonempty bounded range lies wholly
inside one user mapping and has the requested read/write direction before
returning its checked translation. Its copy helpers hold the immutable mapping
borrow across validation and the memory-backend call, and tests prove invalid
ranges never invoke that backend. `ActivePageTables::resolve_user_buffer`
additionally binds the current CR3 to the exact task root and validates every
touched live user leaf, including cross-page ranges. These mechanisms are
**IMPLEMENTED** and Windows/Linux unit-tested. The service-probe dispatcher now
copies a live CPL3 send buffer only after exact active-root and user-leaf
validation, decodes its canonical capability-transfer records, and delivers it
through `TaskRuntime`. Receive validates writable output ranges before blocking.
When delivery wakes that receiver, the kernel consumes its message, switches to
the exact receiver CR3, revalidates and copies payload and derived capability
tokens, restores the previous root, and completes the saved context. The hosted
launchers self-map every allocated service page-table frame supervisor-only so
this active walk remains available without exposing the frames to CPL3.

The real service now separates capability authorization from service state.
`CapabilityAuthorizer` lets the configuration core consume opaque receiver
handles without owning or enumerating the kernel capability space. Syscall
operation 6 binds one handle to an exact nonzero object and nonempty requested
rights; `TaskRuntime::authorize_capability` repeats task identity, slot,
generation, rights, and object checks and returns only success or rejection.
Every unused register and every result register is canonicalized so rejection
does not disclose which check failed.

Each signed service generation now initializes only a trusted nonzero root
identity. The sender first encodes a canonical 80-byte operation-3 schema
request. It binds setting identity, nonzero object identity, Boolean/unsigned/
bytes constraint kind, canonical constraint parameters, fixed length, reserved
zeros, and request identity; payload authority is zero. Only one independently
attenuated root CONTROL descriptor accompanies it. The receiver admits the
schema only after exact root authorization. Duplicate setting/object identities,
root aliasing, capacity exhaustion, malformed constraints, missing/extra
authority, and any admission after revision advancement fail closed.

The sender then encodes the canonical one-update commit request and transfers
fresh configuration-root CONTROL and setting WRITE as two independently
attenuated descriptors. The receiver obtains only derived opaque tokens,
invokes the real envelope decoder and commit dispatcher, and validates both
exact objects through separate kernel operations before state changes. It
checks the admission response and atomic revision-1 commit response, each a
canonical 112-byte record, and the sender independently decodes both before
exiting or entering the generation-2 lifecycle proof. The service-probe runtime
allows nine bounded capabilities per task so the receiver's signal, exact read
and read/write resource authorities, schema root, commit root, and setting
authority plus peer-state READ remain separate; derivation remains atomic and
fail-closed. Pending buffered receives are a three-slot task-keyed table rather
than one global value, matching the runtime's three-task capacity so every live
service task can have at most one pending record without overwriting another.
Sender exit still transitively revokes its derived authority. Named task and
capability capacity constants now drive the runtime, supervisor, and pending
table const generics instead of repeating numeric literals.

Buffered completion now retains its receive-bound proof as a typed
`BufferCompletion` rather than dropping back to two unconstrained `usize`
values after copy. Construction requires payload and capability counts to fit
both the exact pending capacities and the kernel global maxima. The immediate
trap-frame path and scheduler-wakeup `UserContext` path accept only that witness.
The focused Linux kernel suite passes 595 tests and the UEFI `service_probe`
profile cross-builds. This is kernel/service mechanism evidence, not a new IPC
authority or physical execution claim.

Buffered syscall admission now also validates the complete capability-buffer
range with its directional element width: send uses canonical 16-byte transfer
descriptors, while receive writes 8-byte opaque capability tokens. Checked
range-end and user-address bounds reject canonical-space crossings before a
request exists; a shared start-address-only check no longer conflates the two
layouts.
Buffered payload input and output now use the same complete checked-range rule:
send length and receive capacity must fit below the canonical user boundary,
not merely begin at a valid address. Cross-boundary payloads fail during decode
before active page-table validation or copying.
Payload and capability regions must also be disjoint. Overlap is rejected
during decode before send parsing or receive copying, while exact adjacency is
accepted so callers do not need an artificial gap between bounded regions.
The UEFI service-probe dispatcher now performs buffered send reads and receive
writes through the same task-bound, directional, single-use active-user-copy
ticket used by shared-buffer syscalls. The ticket binds the active page-table
root, task, address, exact copied length, and direction, and is consumed before
the direct memory operation; receive capacities are still checked before a task
blocks, then the exact returned lengths are revalidated when copied.
Capability-buffer byte lengths are computed once with checked multiplication
and the validated result is reused for disjointness and token-output slicing;
later stages do not reconstruct the length with unchecked arithmetic.
Each pending buffered receive also retains the exact page-table root under
which its output regions were admitted. Immediate and resumed completion fail
closed unless the active completion root matches that retained root, in
addition to the generational task and exact-range ticket checks.
Resumed completion atomically removes the exact pending record before consuming
its inbox message or mutating output. A duplicate or re-entrant completion
therefore cannot observe and replay the same pending receive.
Pending lookup scans the bounded table for exactly one matching generational
task. Duplicate internal records fail closed instead of selecting an arbitrary
first slot, and lookup no longer copies the table's live records.
The MRML-native service-image buffered-receive helper now converts and checks
kernel-returned payload and capability counts against the exact caller-provided
slices before returning them. Its concrete block-service adapter applies the
same check and returns an error before constructing a received envelope. Both
the default and `block_service_loop` MRML-native profiles cross-build, and the
focused Linux storage-service suite passes 142 tests.
Service-image send descriptors now reside in an explicit 8-byte-aligned wire
type matching the kernel ABI. The shared send helper rejects empty or oversized
payloads, descriptor lengths that are not exact 16-byte multiples, excess
descriptor counts, and unaligned nonempty descriptor storage before trapping.
Both native profiles build; the Linux configuration and storage suites pass 53
and 142 tests respectively.
After successful configuration or supervision dispatch, the service image now
invokes capability-release operation 12 for every leaf transferred with that
exact request before making the response visible. Any release failure halts
without sending the response; ordinary request handling no longer relies on
sender exit to reclaim delegated receiver authority. Both native profiles build
and the Linux configuration suite passes 53 tests. This is compile/unit evidence,
not a newly executed hosted or physical service loop.
The kernel-image operation-12 dispatcher now distinguishes an ordinary invalid
or stale task-local capability from runtime integrity failures. Only the former
returns a detail-free denial; missing runtime state, delegation-graph
inconsistency, or any other unexpected failure halts instead of continuing with
uncertain revocation. Both ordinary and accounted component-service profiles
cross-build and the Linux kernel suite passes 595 tests.
Operation 11 now follows the same distinction for restart-policy replacement:
an unknown service or unauthorized capability returns a detail-free denial,
while policy-generation exhaustion or any other impossible lifecycle error is
fail-stop rather than being flattened into denial. The same two profiles and
595-test Linux kernel suite pass.
Operation 9 now explicitly maps only unknown-service and authorization errors
to its detail-free absent result; any future or impossible lifecycle error is
fail-stop. The enabled operation-10 split path likewise returns denial only for
documented prepare/revalidation policy states or runtime-capacity unavailability.
Generation exhaustion, object/policy inconsistency, and unexpected runtime
errors halt. A canonical `service_restart_request_probe` feature profile now
builds this branch with `service-probe`; that profile, the ordinary service
profile, and the 595-test Linux kernel suite pass.
Operation 6 now returns detail-free authorization failure only for an IPC/
capability error. Missing current-task state or any other unexpected runtime
failure halts rather than being mistaken for ordinary denial. Ordinary and
accounted component-service profiles cross-build and 595 Linux kernel tests
pass.
Malformed service syscall arguments now complete with one generic nonzero
status and zeroed result registers rather than halting the whole hosted image.
Return-frame privilege, instruction, stack, or flags failures remain fail-stop
because returning through the forged frame is unsafe; scoped service fault
retirement for that case remains pending. A focused test covers the scrubbed
completion, the Linux kernel suite passes 595 tests, and ordinary plus
restart-request UEFI service profiles cross-build.
The custom boot-recovery operation-13 decoder now preserves that distinction:
`InvalidReturn` is separate from malformed operation arguments. Invalid return
state remains fail-stop, while a malformed capability, output range, or reserved
field returns the same scrubbed generic error. The Linux kernel suite remains
595 tests; ordinary and block-service UEFI profiles cross-build.
Inline and buffered service sends now return that scrubbed error for the exact
precommit denial set: missing receiver, same-task send, IPC/capability denial,
full inbox, or full delegation table. Malformed transfer descriptors are also
denied before delivery. Scheduler and integrity failures remain fail-stop. The
classification lives on `TaskRuntimeError` and a focused test proves unrelated
or integrity errors are excluded; 595 Linux kernel tests and ordinary/accounted
service UEFI profiles pass.
Buffered-send staging now wipes the complete fixed payload and descriptor
scratch arrays before reuse and after descriptor failure or delivery. Decoded
descriptor options are cleared before the runtime call, and the requested
capability/right tuple array is cleared immediately after it. This bounds
retention across both success and precommit denial. The same 595-test kernel
suite and ordinary/accounted service profiles pass.
Shared-buffer read/write syscalls now return the same detail-free failure for
bounded precommit denials: malformed lengths or user ranges, rejected or stale
authority/bindings, checked resource-range rejection, and checked direct-host
address overflow. Backend uncertainty, task/runtime inconsistency, and
validation-ticket corruption remain fail-stop. Ordinary and accounted service
UEFI profiles build, and all 595 Linux kernel tests pass.
Explicit capability release now treats an impossible source revocation failure
after descendant revocation as runtime integrity failure, never as an ordinary
userspace denial. Initial stale/unauthorized handle rejection remains a
detail-free false result before mutation.
Buffered service sends now return a scrubbed error when either payload or
capability-descriptor userspace input fails complete range validation. Any
already-copied payload and the complete fixed staging arrays are erased before
return; impossible validation-ticket or copy failures remain fail-stop. Both
ordinary and accounted service UEFI profiles build, and 595 Linux kernel tests
pass.
Buffered receive now returns a scrubbed error when its initial payload or
capability output mapping fails complete validation, before dequeue or block.
The saved task/root binding and complete ranges are revalidated at completion;
later drift remains fail-stop pending scoped task retirement. The same service
builds and 595-test kernel suite pass.
Boot-recovery delivery now returns scrubbed failure for invalid initial output
mapping, wrong-task/already-consumed delivery, or precommit capability denial.
Output-copy uncertainty after one-use authority consumption and all internal
delivery/runtime inconsistency remain fail-stop. The same UEFI profiles and 595
Linux kernel tests pass.
The kernel boot-recovery executor now exposes validation and copy failure as
distinct typed phases instead of a shared user-copy error. Its focused test
proves validation preserves the one-use capability while copy uncertainty
follows consumption; the bootloader no longer infers that distinction from a
backend-specific nested error.
The shared-buffer syscall executor now makes the same validation-versus-copy
phase distinction. Initial user-range rejection remains a scrubbed precommit
denial, while ticket or copy uncertainty cannot be accidentally admitted by
matching a generic user error. Its focused tests and both service UEFI profiles
pass under the 595-test kernel gate.
The task runtime now has a typed `InvalidUserReturn` protocol-violation
retirement distinct from voluntary exit and hardware fault. It revokes the
complete current domain and delegated authority before publishing a typed peer
death and selecting the next task. A focused Linux test proves exact saved
context return, peer wakeup/reason, task removal, and scheduler handoff; 596
kernel tests pass. Supervisor cleanup and live syscall dispatch integration
remain pending, so forged return state still fails stop in the service image.
The service supervisor now consumes that typed retirement, marks the exact
service generation `Faulted`, retains its saved context in a one-use cleanup
ticket, and computes the trusted restart deadline. A focused test proves the
exact violation/context, idle outcome, state transition, pending cleanup, and
cleanup completion; 597 Linux kernel tests and both service UEFI profiles pass.
Peer-death retirement now preflights the complete bounded control graph before
revoking delegations or removing the current domain. Missing or duplicate
reciprocal relations and exhausted death-result capacity fail without changing
the domain, scheduler current task, or a peer result slot; an adversarial test
raises the Linux kernel total to 598. This preflight applies equally to clean
exit, hardware-fault retirement, and typed protocol-violation retirement.
The preflight also requires every peer to retain its exact scheduler identity
before publication can begin, so a later wake cannot discover an already
missing peer after relation mutation. A focused scheduler/domain divergence
test raises the Linux kernel total to 599 without claiming such corruption is a
normal public transition.
Task retirement now computes one bounded union of every capability descendant
reachable from all retiring-domain delegation roots, validates the complete
exact-generation set, and only then begins revocation. A stale descendant under
a later root therefore cannot leave an earlier root partially revoked; the
focused adversarial test raises the Linux kernel total to 600.
The live service syscall decoder now routes forged generic or boot-recovery
return state through that retirement, rejects an impossible pending-buffer
alias, completes the exact resource/address-space cleanup, and enters only the
kernel-selected successor. Ordinary, accounted, and block-service UEFI profiles
cross-build and 597 Linux kernel tests pass. A dedicated QEMU execution probe
remains pending, so this integration is **PARTIALLY IMPLEMENTED** rather than
hosted-runtime verified.
Return-frame validation now produces the dedicated typed `UserReturnError`
instead of borrowing ordinary request-decoding errors. Privilege, instruction,
stack, and flags failures remain separately identifiable; the compatibility
`request()` boundary maps them exhaustively to its existing `SyscallError`
variants. All 600 Linux kernel tests pass and both invalid-return images build.
Boot-recovery frame decoding preserves the exact `UserReturnError` inside its
typed invalid-return result instead of collapsing the four causes. Its focused
test covers every cause before request fields are interpreted; the live boundary
still retires all four under the same scoped protocol-violation policy.
Generic frame decoding now exposes `UserCallDecodeError::Return` separately
from `UserCallDecodeError::Request`. The live service boundary consumes that
typed split directly, so adding an ordinary request error cannot accidentally
change return-fault retirement; the legacy `request()` adapter remains an
exhaustive compatibility mapping.
`TaskProtocolViolation::InvalidUserReturn` now carries that exact typed cause
through the supervisor retirement result and capability-scoped peer-death event. The
invalid-return probe therefore checks `InvalidStack`, not merely an undifferenced
return failure, before emitting its cleanup marker. All 600 kernel tests and
both probe images pass.
The same scoped retirement model now has a distinct
`BufferedReceiveMappingDrift` violation for a blocked receive whose saved output
mapping no longer revalidates. A focused task-runtime test proves exact context
revocation and idle retirement, raising the Linux kernel total to 601. Live
split-phase completion now revalidates before dequeue, restores the prior active
page table on drift, consumes the pending receive record, and invokes scoped
service retirement. Ordinary, block-service, and invalid-return UEFI profiles
build. A dedicated execution probe remains pending, so the live integration is
**PARTIALLY IMPLEMENTED** rather than hosted-runtime evidence.
Dedicated warning-free `buffer_drift_probe` kernel and service-image profiles
now encode that acceptance path. The receiver blocks on an aligned output
page; trusted probe code verifies and removes that exact writable,
non-executable user leaf before delivery. Retirement must publish the typed
drift reason and cleanup marker `0x28`; the peer then exits cleanly and terminal
state emits `0x29`. The KVM runner now admits the mode only with one verified
signed service artifact, prepares the exact two isolated roots, and requires
those ordered markers. Its 15 Linux unit tests pass, including exact fail-closed
stage validation. Actual KVM execution and WHP parity remain pending.
The task runtime now combines bounded message-shape validation and dequeue in
one operation that consumes only when both capacities fit. Immediate and resumed
buffered receives use that same rule. Undersized outputs leave the message and
derived capabilities queued; resumed completion also restores the prior page
table and writes a scrubbed retry error into saved context. The shape API exposes
neither content nor handles; 601 kernel tests plus ordinary and buffer-drift
UEFI profiles pass.
A focused capability-bearing test proves a zero-capability receive attempt
leaves the exact message queued and that a later sufficient attempt yields the
same derived READ handle. This raises the Linux kernel total to 602.
IPC delivery now requires the receiver's exact scheduler identity before
capability transfer, endpoint sequencing, enqueue, or wake. An adversarial
scheduler/domain divergence test proves rejection leaves the receiver inbox
empty, raising the Linux kernel total to 603.
Delivery and receive now validate the complete bounded inbox ring topology:
indices, occupied count, head presence, and writable tail. This happens before
capability transfer or endpoint sequencing. An adversarial count/slot mismatch
test proves rejection preserves the prior message and next sequence, raising
the Linux kernel total to 604.
Control receive now applies the same inbox preflight before taking a peer-death
event. A focused corruption test proves an unrelated malformed message ring
cannot hide behind or consume that event, raising the Linux kernel total to 605.
Live peers and pending peer-death results now undergo one combined bounded
topology check before connection, publication, or control receive. Duplicate
identities, live/dead overlap, and aggregate capacity amplification fail before
mutation. A duplicate-death test preserves both events and raises the Linux
kernel total to 606.
IPC delivery now requires exact scheduler identities for both sender and
receiver before endpoint authorization or capability transfer. A stale-sender
test proves no message reaches the receiver and raises the Linux kernel total to
607.
Symmetric control-peer connection now applies the same exact scheduler check to
both tasks before endpoint authorization or either reciprocal slot changes. A
stale-peer test proves neither relation is published and raises the Linux kernel
total to 608.
The lower-level direct IPC transfer primitive now owns the same two-endpoint
scheduler preflight, so callers that do not enqueue cannot bypass it. A focused
stale-endpoint test raises the Linux kernel total to 609.
Direct transfer and task retirement now validate the complete bounded
delegation graph first: both task identities must be scheduled, every source and
destination handle must retain its exact generation, and destination nodes must
be unique. A stale-derived-handle send test proves endpoint sequence remains
unchanged, raising the Linux kernel total to 610.
Direct IPC now prepares exact SIGNAL authorization and the next sequence before
capability transfer. The resulting one-use plan is bound to the endpoint object
and current sequence; stale-plan commit is an integrity failure. Authorization
denial and sequence exhaustion leave receiver capabilities, delegation edges,
and endpoint sequence unchanged. Focused Linux tests raise the kernel total to
611.
Capability transfer now uses one bounded two-pass batch derivation. Every source
handle/right attenuation and every usable receiver slot is validated before the
first destination entry is published; the commit pass contains no fallible
allocation or revocation rollback. The focused transfer test covers both a late
invalid source and insufficient destination capacity while proving the receiver
space remains completely reusable. The Linux kernel total remains 611.
Message shape inspection, direct dequeue, bounded dequeue, and control receive
now require the domain's exact scheduler identity before observing or consuming
inbox state. A focused unscheduled-domain test proves all receive projections
and mutable, immutable, or exact capability authorization access fail closed
as do immutable and mutable saved-context access, while the queued message
remains present. The Linux kernel total is 612.
All task-domain slot resolution now requires exactly one matching generational
identity. Detach, rebalance admission checks, fault/protocol/voluntary
retirement, context, capability, and receive paths reject duplicate domain
records before mutation. A focused corruption test preserves both scheduler
identities and raises the Linux kernel total to 613.
Inbox validation now defines the complete circular-ring invariant directly:
tail equals head plus count modulo capacity, and each offset is occupied exactly
when it falls below count. An exhaustive bounded-state test covers every count,
head, tail, and occupancy-mask combination, raising the Linux kernel total to
614.
Delegation graph validation now exact-matches each live edge's capability
semantics: the source must retain DELEGATE, source and destination objects must
match, and destination rights must be a subset of source rights. A focused
live-handle substitution test fails before endpoint sequence mutation and raises
the Linux kernel total to 615.
Single and batched attenuation now reject zero requested rights before
destination mutation. A focused IPC test proves the destination slot remains
fully reusable and raises the Linux kernel total to 616.
Capability-space insertion now applies the same nonzero known-rights rule before
slot selection. A focused test proves invalid insertion consumes no slot and
raises the Linux kernel total to 617.
Ordinary authorization now rejects zero requested rights before capability
lookup, so liveness cannot be used to disclose an object's identity without a
real right. Kernel revocation preflight uses the private exact metadata path
instead. A focused test raises the Linux kernel total to 618.
Control receive and peer connection now validate every live peer's exact
scheduler identity and unique reciprocal relation before mutation. A focused
unscheduled-peer test preserves both relations and raises the Linux kernel total
to 619.
Stable peer-death records now reject the observing task itself and any identity
that remains scheduled or still owns a domain record. A focused forged-live-
death test preserves the record and live task, raising the Linux kernel total to
620.
Delegation validation now walks each bounded unique-parent ancestry and rejects
any edge whose destination is already an ancestor of its source. A focused
two-hop live semantic-cycle test preserves endpoint sequence and raises the
Linux kernel total to 621.
The acyclicity gate precomputes each edge's unique parent once, then performs
bounded index walks. Worst-case validation is quadratic in the fixed 256-edge
table rather than repeatedly searching ancestry at every step; the same 621
tests pass.
Buffered-send capability descriptor decoding now parses into bounded scratch and
publishes the caller output only after every token, right, and reserved byte is
valid. A late-invalid-descriptor test proves prior output remains unchanged and
raises the Linux kernel total to 622.
The service-visible precommit send-denial classifier now names only missing
task, same-task routing, payload/count bounds, authorization, sequence
exhaustion, inbox capacity, and delegation capacity. Malformed/replay/shape,
buffer, and invalid-plan IPC failures remain integrity-class outcomes. The
Linux kernel total remains 622.
Direct `send_ipc` now resolves both already-scheduled domains through the same
unique-domain gate as resource access and retirement. Missing or duplicate
domain state after scheduler confirmation is an integrity failure; the existing
duplicate-domain test now covers send without changing the 622-test total.
Queued delivery now verifies the sender's exact endpoint SIGNAL authority before
inspecting receiver inbox topology or capacity. An unauthorized full-inbox probe
returns only authorization denial, consumes no sequence, and raises the Linux
kernel total to 623.
Direct `send_ipc` now prepares its non-mutating endpoint authorization/sequence
plan before delegation graph or table-capacity inspection. The live substituted-
edge test now proves an unauthorized caller receives only authorization denial,
while an authorized caller still detects integrity failure. The total remains
623.
Queued and direct send now authenticate the sender endpoint before receiver
scheduler or domain lookup. An unauthorized missing-receiver probe returns only
authorization denial, while the same request with valid endpoint authority
returns `MissingTask`; the Linux kernel total rises to 624.
Queued delivery now carries that single preflight authorization into the
transfer commit instead of resolving the sender capability a second time. The
one-use endpoint plan is bound to the exact capability generation as well as
the endpoint object and sequence; substituting another live capability at
commit fails without consuming the sequence. The existing 624 Linux kernel
tests pass.
Patent review: `NOT_TRIGGERED` — this is conventional bounded validation and
transaction commit binding for the existing IPC mechanism; it introduces no
new externally visible mechanism.
Queued delivery now rejects an authorized same-task route immediately after
endpoint authentication and before receiver lookup or inbox inspection. An
unauthorized self-route still returns only authorization denial; a focused
full-inbox test proves the authorized route returns `SameTaskIpc` without
consuming a sequence or message, raising the Linux kernel total to 625.
Patent review: `NOT_TRIGGERED` — this only tightens validation order in the
existing bounded IPC path.
After endpoint authentication and same-task rejection, queued and direct sends
validate the bounded payload and capability-count shape before receiver inbox
or delegation-table inspection. `Message::new` and capability transfer reuse
the same validator. The full-inbox test now proves an authorized oversized
message returns `PayloadTooLarge` without consuming sequence or inbox state;
the Linux kernel total remains 625.
Patent review: `NOT_TRIGGERED` — this consolidates conventional bounds checks
and moves them earlier in the existing IPC validation sequence.
The sender capability space now preflights the complete requested delegation
set before receiver identity, delegation graph, or delegation-table capacity
inspection. Batch derivation reuses that non-mutating validator before its
destination-capacity and commit passes. A stale-source/missing-receiver test
returns only authorization denial and proves the endpoint sequence remains one
for the next valid transfer, raising the Linux kernel total to 626.
Queued delivery performs the same source preflight before inbox topology or
capacity. The full-inbox adversarial test now includes a stale delegated handle
and proves it receives only authorization denial without sequence consumption;
the total remains 626.
Receiver capability capacity now has one shared non-mutating preflight reused by
batch derivation. Direct send checks it before delegation graph/table state, and
queued delivery checks it before inbox state. The full-inbox test fills the
receiver capability space and proves a capability-bearing send returns only the
ordinary authorization denial without consuming endpoint or inbox state; the
total remains 626.
Patent review: `NOT_TRIGGERED` — this factors and reorders conventional
capability validation and capacity checks in the existing bounded transfer
path.
Delegation-table capacity is now checked after request and receiver-capability
preflight but before delegation-graph inspection. An adversarial test fills the
table with duplicate live edges and proves the ordinary `DelegationTableFull`
denial takes precedence without consuming endpoint sequence; restoring the one
valid edge permits sequence two. The Linux kernel total rises to 627.
Queued delivery uses the same shared capacity gate before inbox inspection.
The adversarial test additionally fills the receiver inbox and corrupts/fills
the delegation table, observes only `DelegationTableFull`, restores valid state,
and completes the next delivery at sequence five. The total remains 627.
Patent review: `NOT_TRIGGERED` — this only reorders a conventional fixed-table
capacity check in the existing IPC transaction.
Delegation publication now prepares the exact bounded empty-slot indices before
receiver capability mutation. After transfer, each derived edge is written to
its reserved slot without a fallible search. A focused fragmented-table test
proves the plan selects indices `0, 2, 4` and rejects an impossible over-bound
internal request, raising the Linux kernel total to 628.
Endpoint commit now holds exclusive endpoint ownership while running the
already-preflighted capability/delegation publication closure and advances the
sequence only after that closure succeeds. A focused injected-publication-error
test proves sequence one remains available for the next valid send, raising the
Linux kernel total to 629.
Queued delivery now prepares the exact inbox slot, next tail, and next count
before invoking the transfer transaction. After transfer it publishes directly
through that plan with no fallible tail search. The multi-client test now
dequeues one full-ring entry, wraps a third delivery into the freed slot, and
proves sender/sequence/FIFO order through sequence three; the total remains 629.
Queued delivery now also prepares the receiver's exact scheduler generation
before authority, sequence, or inbox mutation. The consuming wake commit occurs
after inbox publication without a fallible lookup; exclusive runtime ownership
prevents scheduler mutation between preparation and commit. Existing blocked-
wake and delivery coverage passes; the total remains 629.
Peer-death publication now prepares exact-generation wake plans for the complete
bounded peer set before removing any reciprocal relation or recording any death.
Each plan is consumed only after its peer's control event is published, removing
the former fallible post-mutation wake lookup. Existing protocol-violation and
multi-peer retirement coverage passes; the total remains 629.
The same publication plan now also binds every peer's exact domain slot,
reciprocal-relation slot, and empty death-event slot. Authority cleanup may run
between preparation and commit, but commit performs no repeated domain or table
search. Existing fault, violation, exit, and multi-peer coverage passes; the
current total remains 630.
Control-peer connection now resolves both exact empty reciprocal-table slots
after authorization and capacity validation but before writing either relation.
The two writes therefore have no fallible search between them. Existing
connection and topology coverage passes; the total remains 630.
Scheduler migration and attach now create the destination directly in its exact
runnable or blocked state instead of performing a second fallible state lookup.
Detach and migration prepare the exact source generation before destination
mutation and consume that removal plan without a repeated lookup, eliminating
the former best-effort rollback branches. Existing scheduler migration,
capacity, blocked-state, and stale-identity coverage passes; the total remains
630.
Service exit, fault, and protocol-violation retirement now prepare the exact
supervisor slot, service/task identities, and restart deadline before asking the
runtime to retire the current task. The supervisor then commits stopped state
and the cleanup ticket without a fallible post-retirement identity check, so it
cannot report a still-running service after irreversible runtime retirement.
Existing service lifecycle coverage passes; the total remains 630.
Restart commit now returns the exact newly published service and task
generations as one typed result. Fault recovery and the restart-request service
probe consume that task directly instead of performing a fallible supervisor
lookup after task creation. The reprovision-boundary test checks the returned
task's fresh context and exact supervisor binding; the total remains 630.
Service registration now rejects an already-supervised exact task generation or
live service object both when planning and again after prepared-slot validation
at commit. Atomic launch performs the object check before task creation, so
ambiguous management authority cannot orphan a new task. Vacant capacity and
stale-plan denials retain precedence, avoiding membership disclosure through
full or invalid plans. Retirement also requires a unique running-task match. A
focused duplicate-target test preserves the vacant slot, and launch coverage
proves duplicate object denial leaves runtime occupancy unchanged; the Linux
kernel total remains 631.
Service state inspection, restart preparation, and restart-policy replacement
now use exact-rights authorization rather than subset authorization. A handle
carrying combined `READ|CONTROL` is rejected at each boundary, preserving the
separation between introspection and lifecycle control. Existing focused tests
cover all three overbroad denials; the total remains 631.
Timer preemption now resolves and binds the current task's unique live domain
slot before advancing scheduler time. The interrupted context is installed
directly into that preserved slot after the tick, eliminating a fallible second
domain lookup after scheduler mutation. Existing preemption coverage passes;
the total remains 629.
Fault, protocol-violation, and voluntary-exit retirement now prepare the exact
current scheduler generation before delegation, peer, or domain mutation. After
peer-death publication, the consuming termination commit retires that prepared
identity and selects its replacement without a fallible scheduler lookup.
Existing retirement coverage passes; the total remains 629.
Transitive capability revocation now prepares every exact domain slot and
capability generation in the bounded descendant set before revoking any entry.
The consuming commit clears those prepared entries without repeating fallible
domain or capability lookup; this applies to explicit revocation and task-death
cleanup. Existing stale-descendant and transitive-revocation coverage passes;
duplicate-target preflight coverage raises the Linux kernel total to 630.
Patent review: `NOT_TRIGGERED` — this is conventional fixed-array reservation
and transactional commit for the existing IPC, scheduler, and service
bookkeeping mechanisms.
The service buffered-receive path now resolves one exact empty pending-table
slot before blocking the current task, then publishes only into that still-empty
slot after the scheduler switch. Duplicate task identity, full table, slot
substitution, or intervening occupancy fail closed. This path is service-image
cross-build evidence, not a newly executed backend probe.
Pending buffered-receive completion now rechecks that zero capability capacity
has a zero address and that nonempty payload/capability output ranges remain
disjoint, in addition to exact root and writable mapping validation. Both
service profiles cross-build; backend execution remains pending.
Pending completion now also prepares the exact pending-table slot and complete
record before context or active-page-table validation. It consumes only that
same record immediately before inbox dequeue, or before scoped mapping-drift
retirement, eliminating the repeated task-key lookup after validation. Both
service profiles cross-build; backend execution remains pending.
Pending-layout multiplication, conversion, and end-address overflow now return
invalid layout rather than invoking the global halt path. Immediate calls receive
a scrubbed error; resumed drift follows the existing scoped protocol-retirement
path. Both service profiles cross-build.

Patent review: `NOT_TRIGGERED` — this is conventional split-phase validation
and commit for the existing bounded IPC endpoint and capability table; it
also applies the existing generational scheduler check to receive. It introduces
no new external protocol, algorithm, or device mechanism; exact-unique bounded
domain lookup is part of the same conventional validation. See
`docs/patents/REVIEW_LOG.md`.

The deployment service now applies the same exact-rights rule to generation
staging, activation preparation, active-generation inspection, and runtime
assignment. Control and read remain distinct operation-scoped capabilities; a
combined `CONTROL|READ` handle is rejected by both paths before deployment
state or release storage is touched. Deployment passes its focused hosted
suite. This adds no UEFI, KVM, WHP, installed-media, or physical evidence.

Prepared activation no longer acts as cached authority. Direct activation and
both stable-publication commits revalidate a live exact `CONTROL` capability;
stable commits perform that check before consuming a storage receipt or
updating authenticated recovery state. Revocation between prepare and commit
therefore leaves the candidate prepared and publishes no active generation.

Prepared stable configuration publication now follows the same rule. It
retains the exact root object and read handle used to stage the checkpoint, then
revalidates exact live `READ` authority before consuming the storage receipt.
The focused test observes distinct prepare-time and commit-time authorization
checks; checkpoint bytes and a prepared file write are not cached authority.

Recovered service publication now also revalidates the persisted restart-policy
setting at commit. The prepared owner retains the exact policy-read handle and
cached registration plan; commit reloads the live policy, recomputes the plan,
and requires exact equality before supervisor mutation. The focused recovery
test observes this additional commit-time authorization.

Prepared service restart plans now retain the exact `CONTROL` handle and cannot
cache its authority across reprovisioning. External management-space commits
reauthorize the handle immediately before task creation; the syscall path uses
the requester's live task-local capability space through a dedicated runtime
commit entry. Revoked handles leave the stopped service and scheduler unchanged.
Kernel passes 632 focused tests, including external and task-local revocation.

Patent review: `NOT_TRIGGERED` — this is conventional commit-time capability
revalidation and bounded lifecycle sequencing. See
`docs/patents/REVIEW_LOG.md`.

Delayed service registration now has a runtime-validated commit entry. Recovery
uses it to recheck the exact generational `TaskId` immediately before supervisor
publication; a task retired after policy validation leaves the reserved service
slot vacant, and only a newly planned live task generation can be registered.
The trusted immediate kernel registration API remains available for transitions
whose caller already owns task creation and publication as one operation. Kernel
passes 633 focused tests and configuration passes 53.

Patent review: `NOT_TRIGGERED` — this applies conventional generational liveness
validation at an existing lifecycle commit boundary. See
`docs/patents/REVIEW_LOG.md`.

Configuration's direct persisted-policy registration helper uses the same
runtime-validated publication boundary. A caller-supplied retired `TaskId`
cannot be turned into a running service identity even when the setting read and
policy revisions remain valid; the supervisor stays vacant until the policy is
applied to a live task generation. Configuration remains 53 focused tests.

Patent review: `NOT_TRIGGERED` — this extends the existing generational
liveness check to the remaining policy-bound registration entry. See
`docs/patents/REVIEW_LOG.md`.

Recovered deployment runtime assignment now retains the exact deployment
inspection handle that selected the activated release and reauthorizes exact
`READ` immediately before sealing the assigned inventory. The intermediate
owner no longer exposes its raw assignment plan through an `into_parts` escape;
revocation after recovery leaves no sealed release or Total admission input.
Deployment passes 6 focused tests, configuration passes 53, and the native
service image builds in release mode.

Patent review: `NOT_TRIGGERED` — this extends conventional commit-time exact
capability revalidation to an existing deployment publication boundary. See
`docs/patents/REVIEW_LOG.md`.

The lower deployment assignment entry points now return that same linear
prepared owner instead of a raw kernel assignment plan. Seal exact-reauthorizes
the retained inspection handle and exact-matches the currently active
`ActivatedSystemRelease`; either revocation or intervening activation prevents
inventory publication. This closes the bypass around recovered composition
without making release identity or package metadata authoritative. Deployment
remains 6 focused tests and configuration 53.

Patent review: `NOT_TRIGGERED` — this is conventional capability and generation
revalidation at the existing assignment seal transition. See
`docs/patents/REVIEW_LOG.md`.

Configured isolation preparation now returns a configuration-bound linear owner
rather than exposing the raw kernel admission reservation. Immediately before
backend construction it reapplies the exact policy reads and revisions,
recomputes and exact-compares the service specification, and then commits the
same reservation. Revision drift or capability revocation cancels the
reservation and invokes neither native nor microVM backend. Configuration
passes 53 focused tests.

Patent review: `NOT_TRIGGERED` — this is conventional policy/capability
revalidation and rollback at an existing prepared-launch boundary. See
`docs/patents/REVIEW_LOG.md`.

Complete Total-service preparation no longer exposes a bulk `into_routes`
decomposition into independently committable kernel reservations. Explicit
cleanup consumes the set and attempts reverse-order cancellation of every
retained route, while the bounded single-route take/restore transformation used
for artifact binding remains tracked by expected complete membership.
Configuration remains 53 focused tests and the native service image builds.

Patent review: `NOT_TRIGGERED` — this removes an ownership escape and uses the
existing conventional admission cancellation mechanism. See
`docs/patents/REVIEW_LOG.md`.

The remaining bounded take/restore transformation now records and exact-matches
the complete expected `IsolationServiceSpec`, not only its domain. A separately
admitted route for the same domain cannot substitute interface identity,
interface/provider generation, system/policy generation, class, or placement
before complete construction. Configuration remains 53 focused tests and the
native service image builds.

Patent review: `NOT_TRIGGERED` — this applies conventional exact structural
identity comparison to an existing linear restoration gate. See
`docs/patents/REVIEW_LOG.md`.

Prepared native file writes now retain the exact generational storage handle,
principal, and write/resize rights used before data staging. A new authorized
transaction commit rechecks that binding immediately before receipt
consumption, returns the still-prepared successor on denial, and leaves the
receipt untouched after revocation. This is the shared dependency gate for
migrating stable configuration, deployment, and authority checkpoints in
separate service commits. Storage passes 142 focused tests.

Patent review: `NOT_TRIGGERED` — this is conventional generational handle
reauthorization at an existing storage transaction boundary. See
`docs/patents/REVIEW_LOG.md`.

Stable configuration publication now uses that authorized file-write commit.
After revalidating the exact configuration-root `READ` capability, commit also
rechecks the retained storage handle, principal, file kind, and write/resize
rights before consuming the transaction receipt. Revocation after checkpoint
staging leaves the receipt untouched and publishes no stable generation.
Configuration passes 53 focused tests and storage remains 142 focused tests.

Patent review: `NOT_TRIGGERED` — this composes conventional exact capability
and generational storage-handle reauthorization at an existing transaction
commit boundary. See `docs/patents/REVIEW_LOG.md`.

Deployment stable activation now uses the same authorized file-write commit in
both ordinary and authenticated recovery-state publication. Exact live
deployment `CONTROL` and unchanged candidate/release state are checked first;
the retained storage binding is then reauthorized before receipt consumption.
Revocation publishes neither a file generation, recovery state, nor activation.
Deployment passes 6 focused tests and storage remains 142 focused tests.

Patent review: `NOT_TRIGGERED` — this applies the existing conventional
generational storage-handle check at the deployment transaction boundary. See
`docs/patents/REVIEW_LOG.md`.

Durable storage-authority checkpoint publication now completes the migration of
the three stable-file consumers. Commit revalidates the exact retained file
handle, principal, kind, and write/resize rights before consuming its receipt;
revocation leaves the receipt unconsumed and publishes no authority generation.
Storage passes 142 focused tests and the native service image builds.

Patent review: `NOT_TRIGGERED` — this reuses conventional generational handle
reauthorization at the existing authority-checkpoint commit boundary. See
`docs/patents/REVIEW_LOG.md`.

The legacy receipt-only `PreparedFileWrite` commit has been removed. Consumers
can publish a prepared successor only through the exact authority-revalidating
commit. This prevents future services or storage-internal composition from
bypassing the completed configuration, deployment, and durable
authority-checkpoint rule.

Patent review: `NOT_TRIGGERED` — this narrows an existing API surface and adds
no mechanism. See `docs/patents/REVIEW_LOG.md`.

Prepared component-service launches no longer expose their raw isolation route.
Exact consumer/provider `ServiceImage` kinds and authenticated digests must be
consumed into a distinct verified-launch owner before the route can enter KVM,
WHP, standalone, or complete-set publication. Artifact mismatch retains the
full uncommitted launch for explicit cancellation. Kernel passes 633 focused
Linux tests and the Linux KVM runner builds; no WHP execution is claimed.

Patent review: `NOT_TRIGGERED` — this is a conventional typestate restriction
over the existing digest comparison and isolation reservation. See
`docs/patents/REVIEW_LOG.md`.

Component-service launch now has an additive attached construction path for one
read-only launch-data object and one separately attenuated dependency endpoint.
Attachment creation requires narrow `READ|DELEGATE` and `SIGNAL|DELEGATE`
source capabilities,
binds the admitted domain, SystemRelease, policy, association, object, and
dependency generations, and rejects overbroad or substituted authority before
either placement backend runs. The selected backend must construct both
projections atomically before the route commits; backend failure records the
domain unavailable and never tries another placement. Native placement now has
a distinct entry-preparation step that revalidates the freshly projected
target-space `READ` and `SIGNAL` capabilities, never exposes the source-space
tokens, and installs the service endpoint, supervisor, provider generation,
consumer module, attachment length, and projected tokens only into an otherwise
empty user-context register ABI. A kernel-owned construction projection now
requires an otherwise pristine target task, atomically derives exact `READ` and
exact `SIGNAL` handles, records both ancestry edges for transitive revocation,
and composes them with entry installation. Entry failure revokes both projected
handles before returning and preserves the original context. Kernel passes 641
focused Linux-host tests. A concrete placement backend must still invoke this
task-construction transaction before the FAT32 installed entry can consume the
attachment.

Patent review: `NOT_TRIGGERED` — this adds conventional capability attenuation
and atomic launch sequencing to the existing isolation transaction. See
`docs/patents/REVIEW_LOG.md`.

Stable configuration commit now preserves the complete linear prepared owner on
both configuration-capability and storage-authority denial. The caller receives
the same checkpoint identity, revision, retained root binding, and prepared file
alongside the typed error, while the transaction receipt remains untouched.
Configuration passes 53 focused Linux tests and the native service image builds.

Patent review: `NOT_TRIGGERED` — this preserves ownership across an existing
error boundary and introduces no new mechanism. See
`docs/patents/REVIEW_LOG.md`.

Durable storage-authority checkpoint commit now preserves its complete prepared
owner on storage-authority or receipt denial as well. The retained checkpoint
continues to expose its exact epoch and root generation for explicit recovery
policy, while no receipt participant is consumed. Storage passes 142 focused
Linux tests.

Patent review: `NOT_TRIGGERED` — this is the same conventional linear error
ownership rule at the existing authority-checkpoint boundary. See
`docs/patents/REVIEW_LOG.md`.

Deployment activation now rejects terminal activation-sequence exhaustion in
both preparation and preview. The check occurs before a candidate changes from
staged to prepared and before stable activation can consume a file receipt;
`u64::MAX` is never published and the staged candidate remains available for
explicit recovery policy. Deployment passes 7 focused Linux tests.

Patent review: `NOT_TRIGGERED` — this moves conventional checked integer
arithmetic earlier in the existing activation state machine. See
`docs/patents/REVIEW_LOG.md`.

Authenticated deployment publication now constructs and validates the complete
successor recovery-state record before consuming the prepared file receipt.
Recovery epoch exhaustion or invalid replacement binding therefore leaves the
receipt and live deployment state unchanged. The prepared file exposes only its
immutable object and generation for this preflight. Deployment remains 7
focused Linux tests.

Patent review: `NOT_TRIGGERED` — this reorders existing checked encoding ahead
of an existing commit point. See `docs/patents/REVIEW_LOG.md`.

Deployment now represents the fully checked candidate transition as a private
`ValidatedActivation`. Direct, stable, and authenticated commits perform exact
control authorization, candidate/generation/release validation, and checked
sequence advance before durable mutation. After receipt consumption—and after
authenticated recovery-state compare-and-store—the final service publication
has no remaining fallible validation branch. Deployment remains 7 focused Linux
tests and the native service image builds.

Patent review: `NOT_TRIGGERED` — this is conventional validation/commit
factoring within the existing bounded activation state machine. See
`docs/patents/REVIEW_LOG.md`.

Ordinary stable deployment activation now returns the complete prepared owner
with every control, candidate, release, storage-authority, or receipt error.
Because the validated activation makes post-receipt publication infallible,
denial can retain the exact staged file and activation identity without an
ambiguous partial state. Deployment remains 7 focused Linux tests.

Patent review: `NOT_TRIGGERED` — this preserves linear ownership across the
existing pre-publication error boundary. See `docs/patents/REVIEW_LOG.md`.

Authenticated stable activation now exposes an explicit two-phase failure
owner. Any validation, recovery-state load/decode, encoding, storage authority,
or receipt failure returns the complete prepared activation. Once the file
receipt is consumed, compare-and-store uncertainty instead returns the exact
published file generation, pending activation token, expected activation and
release identities, and store error; it never mislabels that state as prepared.
Deployment passes 8 focused Linux tests.

Patent review: `NOT_TRIGGERED` — this is conventional typed uncertainty and
linear ownership at an existing authenticated commit boundary. See
`docs/patents/REVIEW_LOG.md`.

`PublishedAuthenticatedActivation` now resolves that uncertainty only by
reloading authenticated recovery state and exact-matching the intended epoch,
file volume/object/generation, activation identity, and root/release-bound
checkpoint digest. A mismatch returns the same published owner; a match first
revalidates live control and candidate state, then completes the already
validated activation. The adversarial test covers both retained mismatch and
confirmed completion. Deployment remains 8 focused Linux tests.

Patent review: `NOT_TRIGGERED` — this composes existing authenticated-state,
digest, capability, and generation checks into a bounded recovery transition.
See `docs/patents/REVIEW_LOG.md`.

Storage-authority recovery now preserves compare-and-store uncertainty without
releasing reconstructed handles. `PendingRecoveredStorageAuthorities` retains
the private table and exact authenticated replacement bytes; a fresh state load
must equal that replacement byte-for-byte before it can become
`CommittedRecoveredStorageAuthorities`. Mismatch retains the non-authorizing
pending owner. Storage passes 142 focused Linux tests.

Patent review: `NOT_TRIGGERED` — this applies conventional typed uncertainty and
exact authenticated-state comparison to the existing recovery transaction. See
`docs/patents/REVIEW_LOG.md`.

Validated storage-authority recovery applies the same uncertainty boundary to
both temporary results. A compare-and-store error retains the reconstructed
authority and the validator's non-authorizing output in one pending owner; only
an exact fresh authenticated-state match releases either result. The focused
storage suite passes 142 tests on Linux. No KVM, WHP, or physical storage device
was exercised.

Patent review: `NOT_TRIGGERED` — retaining typestate-owned temporary results and
resolving an uncertain compare-and-store by exact authenticated-state equality
is conventional fail-closed recovery logic. See `docs/patents/REVIEW_LOG.md`.

The configuration recovery integration now exercises a store that commits the
replacement but reports uncertainty. The one-use boot-bound adapter is consumed
and dropped before the retained owner resolves against the underlying
authenticated store; exact replacement equality releases the recovered
authority and prepared service together. Configuration passes 53 Linux-host
tests, and the release `MRML_NATIVE` service-image build passes. This is hosted
and cross-build evidence, not KVM, WHP, or physical recovery evidence.

The isolated FAT32 provider now **PARTIALLY IMPLEMENTS IN SOURCE** bounded
directory lookup over its already validated batch. Lookup accepts checked
UTF-16, applies ASCII-only case folding while requiring exact non-ASCII units,
matches checked long names or canonical 8.3 aliases, excludes volume labels,
and rejects duplicate matches. The result is parsed metadata, never an open
capability. FAT32 passes 35 focused Linux-host tests; provider IPC lookup,
capability-authorized open, installed launch, and physical media remain
unverified.

Patent review: `NOT_TRIGGERED` — bounded name validation, conservative equality,
linear lookup, and duplicate rejection are conventional directory mechanisms.
See `docs/patents/REVIEW_LOG.md`.

The generation-1 filesystem interface now canonically frames lookup without
granting open authority. Requests bind exact volume, mount, and directory
generations plus one bounded borrowed name range; responses contain either one
nonzero object identity or a typed zero-identity failure. Cross-operation
headers, stale ranges, reserved bytes, zero success identities, and status/data
mixtures fail closed. The isolated lookup transport retains the exact endpoint
generation and rejects memory beyond its admitted bound before invocation. Five
focused Linux-host interface tests pass.

Canonical filesystem generation-2 mount framing now establishes both the
lifecycle generation consumed by lookup and an explicit root identity without
conflating either with authority. The request binds the exact volume handle and
bounded options range; success carries one nonzero generation and structurally
valid root handle, while every typed failure carries zero for both. The isolated
transport retains the exact provider endpoint and rejects oversized memory before
invocation. Generation 1 remains immutable history. The focused Linux-host
interface suite passes thirteen tests, including missing-root and mixed-status
rejection.

Patent review: `NOT_TRIGGERED` — a bounded named mount response containing
separate lifecycle and root identities is a conventional IPC/filesystem contract
mechanism. See `docs/patents/REVIEW_LOG.md`.

The FAT32 provider now has a fixed-capacity mount/root lifecycle table above its
validated geometry parser. Admission issues fresh independent lifecycle and root
generations, exact-matches volume/mount/root on every geometry lookup, and removes
the complete record on unmount. Duplicate, capacity, stale, and generation-
exhaustion paths preserve state; maximum generations are issued once and never
wrap. This is provider-local identity state, not an open capability or live
syscall dispatch. Exact unmount allocates one fresh nonzero completion serial only
after removing the record; replay is stale, and serial exhaustion preserves the
live record.

A narrow unsafe FAT32 mount backend now binds validation to an exact volume
handle. It must fill the complete sector-zero scratch from that live volume;
the provider parses before publication and erases scratch after success or
failure. Backend errors and malformed filesystems publish no record and consume
no lifecycle generation. A concrete provider-side client now consumes the
generation-1 block-provider protocol only through an unsafe runtime-proven exact
volume/session binding. It requests one complete logical block at LBA zero,
requires exact completion, copies only the 512-byte boot-sector prefix, and
erases full-block scratch on every path. Numeric identity equality alone does not
establish this binding. The mounted provider now implements canonical
generation-2 mount transport: options must be empty, stale backing sessions
remain typed stale failures, and lifecycle/root identity is encoded only after
validated state publication. The focused Linux-host provider suite passes
forty-seven tests. A separate mount receive/reply loop now requires the exact
generation-2 payload size and zero transferred capabilities, dispatches only
through the provider's preinstalled binding, and erases local buffers after
success or failure. The concrete register adapter passes a null pointer with
zero capability capacity, rejects any kernel-reported transfer, and sends the
exact 24-byte response through the launch-bound reply endpoint/task. Together
the focused provider suite passes fifty-two tests.
Canonical unmount transport now exact-matches volume/generation, emits the
post-removal completion serial, and maps replay to typed stale while keeping the
root invalid. Unmount is connected to a dedicated receive/reply loop and
register adapter. They require
the exact 88-byte request with zero capabilities, reject malformed envelopes and
kernel over-counts before dispatch, erase local buffers, and send the exact
16-byte completion response. The focused provider suite passes fifty-seven
tests.

The FAT32 block client now supplies a bounded byte-range primitive above its
exact session binding. It composes unaligned ranges from canonical one-block
reads, requires exact completion per block, and clears partially assembled
output plus scratch after any failure. Checked adapters derive FAT-entry and
data-cluster offsets only from validated geometry. This is hosted protocol/unit
evidence, not physical-media evidence.

Mounted FAT32 root loading now exact-matches volume, lifecycle generation, and
root identity before block access. It validates a bounded mirrored FAT chain,
loads and parses directory clusters atomically until an end marker or chain end,
and erases cluster scratch on every result. Stale root substitution performs no
additional block call. Stable lookup-object identity and lookup syscall dispatch
are now separated: validated root lookup interns stable nonzero identities in a
bounded provider-local table keyed by the exact mount/root/entry tuple. Aliases
reuse identity, capacity and permanent exhaustion fail without reuse, volume
labels are excluded, and unmount invalidates all tied records. These identities
grant no capability. Canonical lookup transport preserves the borrowed UTF-8
range, performs strict bounded provider-local UTF-16 conversion before I/O,
loads only the exact mounted root, and returns either a stable nonzero identity
or a typed zero-object failure. The focused Linux-host suite passes seventy
tests. Isolated lookup dispatch now validates the exact payload plus one
structurally valid transferred leaf, copies and locally rebases only the bounded
name range, releases that validated leaf after every later outcome, and erases
transient buffers. Its register adapter rejects kernel over-counts before the
envelope exists.

Provider-side open state is now a bounded two-phase lifecycle. Reservation binds
the exact live volume, mount generation, root, and provider object but yields no
usable handle. Activation alone publishes a fresh opaque handle; cancellation,
close, and unmount advance the slot generation, stale replays fail, and maximum
generation permanently retires the slot. The lookup's non-authorizing object
number is never interchangeable with this handle. The focused Linux-host FAT32
suite passes eighty tests. Active-handle file reads now rebind the exact live
mount/root entry, validate the complete FAT chain, publish atomically, and erase
staging and cluster scratch. A stale handle causes no block I/O and leaves caller
output untouched; syscall exposure remains pending a preserved next interface
generation rather than modifying generation 2 in place.

Filesystem interface generation 3 now preserves every generation-2 operation
and numeric identity while adding canonical provider open as operation 11. The
request exact-binds volume, mount generation, directory, and non-authorizing
lookup object; success returns a distinct opaque handle, and errors require a
zero handle payload. The generated fingerprint is
`cdf4ff47c6f987d7cf392eb641973f81de2b90ee8aa053b955265887823ae2dc`.
Fourteen focused Linux-host codec tests pass; generations 1 and 2 remain checked
in unchanged.

FAT32 now implements canonical generation-3 open transport. One decoded request
exact-matches the live volume, mount generation, directory root, and lookup
object, then atomically reserves and activates a revocable provider handle.
Capacity and stale lifecycle failures return typed zero-handle responses; close
and unmount still invalidate generations. The focused FAT32 suite passes
eighty-five Linux-host tests. The isolated open loop accepts exactly one
112-byte request and zero capabilities, performs canonical provider dispatch,
and erases its request/response buffers. Its register adapter supplies no
capability array, rejects kernel-reported payload/capability over-counts, and
sends the exact 16-byte response only to the launch-bound caller.

Canonical FAT32 read transport now consumes generation-3 read requests through
an active provider handle. It bounds and isolates the borrowed output slice,
requires sufficient local staging, publishes only after complete FAT validation,
and erases staging plus cluster scratch on all paths. Stale handles perform no
block I/O and leave the whole caller buffer unchanged. The focused FAT32 suite
passes eighty-six Linux-host tests.

Isolated FAT32 read dispatch now validates the exact request and one structurally
valid transferred writable-buffer capability. It dispatches through local
scratch, copies to shared memory only on typed success, releases the received
leaf before reply, and erases all local buffers. Stale handles release and reply
without copying; malformed envelopes do neither. The register adapter bounds
kernel-returned counts and preserves receive/write/release/reply order. The
unified entry adapter now receives one maximum-sized bounded envelope,
preserves the kernel-returned payload and capability counts for canonical
dispatch, supports both shared-buffer directions, and bounds variable replies.
One router owns the mounted provider state across probe, mount, unmount, lookup,
open, and read calls; it rejects unsupported write-side operations and releases
a structurally valid transferred leaf even when later header validation fails.
The FAT32 provider now consumes the neutral filesystem/block dependency handoff
through an unsafe runtime-authenticated launch constructor. It exact-matches the
filesystem module and provider generation, requires the separately attenuated
block endpoint capability with exact `SIGNAL`, and only then constructs the
volume/session binding. Handoff object IDs remain non-authorizing data. The
MRML-native entry now consumes the fixed native register ABI, copies the exact
144-byte handoff through the projected read-only capability, validates its
filesystem module and provider generation, retains the distinct block endpoint
capability, erases the temporary bytes, and only then sends ready. The reusable
native task-construction transaction now supplies that ABI, but a concrete
placement backend does not yet invoke it and the entry's block-call routing is
not yet connected. The focused FAT32 suite passes
ninety-nine Linux-host tests.

The storage policy service now bridges non-authorizing filesystem lookup identity
to a child handle without conflating the two. An unsafe runtime binding
authenticates the exact provider/mount/parent/object mapping; `OPEN_CHILD` on the
same principal's exact parent remains required. The broker derives only requested
kind-valid rights, rejects substitution before allocation, and tracks handles
for mount-scoped transitive revocation. The broker now reserves its bounded slot
and an inactive derived authority together; only exact activation publishes the
child handle. Cancellation and mount cleanup invalidate pending authority and
release both capacities. Storage passes 157 focused Linux-host tests.

Patent review: `NOT_TRIGGERED` — parent-authorized child-handle derivation,
rights attenuation, exact identity binding, and transitive lifecycle revocation
are conventional capability-system mechanisms. See
`docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — checked filesystem offset derivation, exact
single-block reads, failure-atomic range assembly, and scratch erasure are
conventional storage-parser boundary mechanisms. See
`docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — exact-volume reads, validate-before-publish,
scratch erasure, and failure-atomic admission are conventional storage-parser and
resource-lifecycle mechanisms. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — canonical block reads, runtime-established
cross-service association, exact completion checks, bounded prefix copy, and
scratch erasure are conventional storage-service composition mechanisms. See
`docs/patents/REVIEW_LOG.md`.

The storage service now has a concrete interface-level sector-zero bridge for
filesystem admission. Construction binds one opaque filesystem volume identity
to one owner-authenticated block session and exact full-block scratch. Every read
rechecks the independent `READ` right through `BlockService`, copies only the
512-byte boot sector, and erases the full scratch on success or failure. Volume
substitution, denial, and backend error publish zero output bytes. The focused
Linux-host storage suite passes 157 tests.

Patent review: `NOT_TRIGGERED` — exact session authorization, block-zero reads,
bounded prefix copy, and scratch erasure are conventional storage-service boundary
mechanisms. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — bounded slots, monotonic generations, exact
identity matching, and atomic record removal are conventional resource-lifecycle
mechanisms. See `docs/patents/REVIEW_LOG.md`.

Canonical unmount framing closes the same exact lifecycle without accepting a
zero or stale-by-construction mount generation. It routes through the retained
provider endpoint and returns either one nonzero completion serial or a typed
zero-serial failure; cross-operation and status/data mixtures fail closed. The
focused Linux-host interface suite passes seven tests.

Canonical filesystem read framing binds the exact volume, mount, file, endpoint,
file offset, and nonempty writable range. Checked offset arithmetic fails before
invocation; completion cannot exceed the borrowed range or 1 MiB interface bound.
Zero-byte EOF is a valid success, while every typed failure carries zero bytes.
The focused Linux-host interface suite passes eight tests.

Canonical filesystem write framing keeps mutation independent from read. It
binds exact volume, mount, file, endpoint, checked file offset, and one nonempty
immutable range. Success requires nonzero progress within the range and 1 MiB
bound; `ReadOnly`, permission, capacity, and I/O failures remain distinct and
carry zero bytes. The focused Linux-host interface suite passes nine tests.

Patent review: `NOT_TRIGGERED` — bounded immutable inputs, checked offsets,
partial-progress validation, and typed write errors are conventional IPC and
file-I/O boundary mechanisms. See `docs/patents/REVIEW_LOG.md`.

Canonical filesystem create framing binds exact volume, mount, parent directory,
provider endpoint, and bounded nonempty name. Generation 1 leaves `kind` as
provider-defined `u32` data, so the codec preserves it without inventing an
unversioned enum. Reserved alignment bytes fail closed; success returns one
nonzero object identity and typed failures return zero. The focused Linux-host
interface suite passes ten tests.

Patent review: `NOT_TRIGGERED` — canonical parent/name framing, zero padding,
opaque provider-kind carriage, and typed identity responses are conventional IPC
and directory-operation mechanisms. See `docs/patents/REVIEW_LOG.md`.

Canonical filesystem flush framing binds the exact volume and nonzero mount
generation through the retained provider endpoint. Success carries one nonzero
durability serial; stale-object, permission, and I/O failures carry zero, so
status/serial mixtures fail closed. The serial is evidence, not authority. The
focused Linux-host interface suite passes eleven tests.

Patent review: `NOT_TRIGGERED` — exact-generation flush framing, typed statuses,
and nonzero durability-serial validation are conventional IPC and filesystem
lifecycle mechanisms. See `docs/patents/REVIEW_LOG.md`.

Canonical filesystem check framing binds the exact volume and nonzero mount
generation through the retained provider endpoint and one writable report of at
most 64 KiB. Zero-byte success is valid; successful byte counts cannot exceed
the report, and typed failures carry zero. The focused Linux-host interface suite
passes twelve tests.

Patent review: `NOT_TRIGGERED` — bounded writable reports, exact-generation
framing, completion-count validation, and typed errors are conventional IPC and
filesystem-check boundary mechanisms. See `docs/patents/REVIEW_LOG.md`.

Canonical filesystem format framing binds an exact volume and retained provider
endpoint while keeping bounded immutable options disjoint from a writable report
of at most 64 KiB. Successful byte counts remain report-bounded; typed failures
carry zero. `DestructiveAuthorityRequired` stays distinct, and request data cannot
replace the runtime-delivered, exact preview-bound capability. The focused
Linux-host interface suite passes thirteen tests.

Patent review: `NOT_TRIGGERED` — disjoint borrowed ranges, bounded completion
counts, typed destructive-authority failure, and canonical framing are
conventional IPC and filesystem-format boundary mechanisms. See
`docs/patents/REVIEW_LOG.md`.

The isolated FAT32 service loop now records cleanup ownership only after the
receive envelope declares exactly one capability and its token has a nonzero
generation. Absent or malformed transfer data cannot revoke an unrelated object;
after validation, every later failure still releases the exact received leaf and
erases transient buffers. The focused Linux-host provider suite remains thirty-five
tests.

Patent review: `NOT_TRIGGERED` — exact receive-count validation and conditional
cleanup of a transferred capability are conventional IPC lifecycle checks. See
`docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — bounded borrowed writes, checked offsets,
completion-count validation, and typed read errors are conventional IPC and file
I/O boundary mechanisms. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — exact lifecycle generations, typed completion
serials, canonical framing, and status/data exclusion are conventional IPC and
resource-lifecycle checks. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — fixed canonical framing, bounded borrowed
ranges, typed statuses, and reserved-byte validation are conventional IPC codec
mechanisms. See `docs/patents/REVIEW_LOG.md`.

Patent review: `NOT_TRIGGERED` — this reuses conventional exact bitset equality
at an existing capability check and introduces no new mechanism. See
`docs/patents/REVIEW_LOG.md`.

The kernel runtime regression now distinguishes subset authorization from the
exact service boundary directly: a combined `READ|WRITE` handle still satisfies
the general subset API, but the exact API rejects it while accepting a distinct
`READ` handle for the same object. This is a focused unit-test invariant and
does not add execution-environment evidence.
Dedicated `invalid_return_probe` kernel and service-image profiles now build
without warnings. The CPL3 receiver deliberately zeros its stack pointer before
`int 0x80`; the kernel profile requires typed peer-death cleanup marker `0x26`,
then enters a distinct peer whose only action is a canonical exit and requires
terminal state marker `0x27`. Runner mode and QEMU execution remain pending, so
these markers are an unexecuted acceptance contract, not hosted evidence.
The KVM runner now admits `invalid-return-probe` only with one verified signed
service artifact, prepares the same two isolated service roots, and requires
exact marker `0x26` followed by `0x27` before treating the run as terminal. Its
14 Linux unit tests pass. The marker validator rejects noncanonical expected
stages, reversed stages, and every nonmatching VM exit before execution can
advance. The probe has not yet been executed under KVM, and WHP runner parity
remains pending.
The bootloader now imports `GuestMappingRevoker` only for the block/component
profiles that instantiate its hosted cleanup adapter. Ordinary service,
restart-request, component-service, and block-service UEFI profiles all
cross-build without the former unused-import warning.

Patent review: **NOT_TRIGGERED**. This change retains an existing bounds check
as Rust typestate, adds ordinary complete-range and overlap validation, and
reuses the existing active-user-copy ticket on an existing syscall path; it
also adds ordinary result-capacity checks in existing userspace adapters and
wire alignment/canonical-shape checks in the existing service-image adapter; it
also reuses the existing capability-release syscall for routine leaf cleanup
and makes existing revocation/policy integrity failure paths fail-stop; it
also classifies existing query/restart errors without introducing a new IPC
algorithm or mechanism, and applies the same fail-stop distinction to existing
capability authorization plus a conventional scrubbed error completion for
malformed arguments and precommit send denial. See [the patent review
log](patents/REVIEW_LOG.md). Scratch erasure is ordinary data-lifetime hygiene
on that existing path, and shared-buffer denial classification is ordinary
error-boundary hardening. Post-mutation capability-release classification is
the same conventional integrity hardening; none triggers a separate patent
review. Buffered userspace-range denial follows that existing boundary and does
not introduce a new mechanism; the matching initial receive-range denial has
the same classification. Boot-recovery precommit denial classification likewise
uses the existing one-use delivery boundary, and typing its existing phases does
not trigger review. Shared-buffer copy-phase typing is the same conventional
boundary hardening and also does not trigger review. The typed protocol-
violation retirement is conventional process-lifecycle isolation rather than a
new algorithm. Patent review: **NOT_TRIGGERED**; see [the review
log](patents/REVIEW_LOG.md). Supervisor integration reuses that lifecycle and
does not trigger separate review; live dispatch wiring also adds no new
mechanism. The probe only exercises that existing path and does not trigger
separate review; KVM runner admission is test harness plumbing and likewise does
not trigger review. Exact marker validation is additional test-harness boundary
checking on that same path and does not trigger separate review. Peer-death
preflight is conventional transactional integrity validation on the existing
lifecycle and does not trigger separate review. Exact scheduler-identity
preflight is the same conventional integrity check.
Whole-retirement descendant preflight applies the existing capability graph and
revocation rules and does not introduce a new mechanism or trigger review.
Typing the existing return-validation result is ordinary error-boundary
hardening and does not trigger separate review. Preserving that result through
boot-recovery decoding is the same boundary hardening.
The generic typed decode envelope likewise preserves the existing mechanism and
does not trigger separate review. Carrying its closed cause through the existing
lifecycle record is ordinary diagnostic typing and does not trigger review.
The buffered-receive drift variant reuses that lifecycle without a new
algorithm and does not trigger separate review. Pre-dequeue live wiring is
conventional validation/cleanup ordering on that path and likewise does not
trigger review. The dedicated image only exercises that path and does not
trigger separate review. KVM admission is test-harness plumbing on that same
path and likewise does not trigger review.
Atomic capacity/dequeue validation is conventional bounded queue handling and
does not trigger separate review; the capability-retention test exercises that
existing rule and likewise does not trigger review.
Receiver scheduler preflight is conventional transactional integrity validation
on existing IPC delivery and does not trigger separate review.
Bounded ring-topology preflight is the same conventional transactional
validation and does not trigger review.
Applying it to control receive is the same integrity hardening.
Combined control-topology validation is also conventional bounded-state
hardening and does not trigger review. Sender scheduler preflight is the same
transactional integrity validation; control connection preflight has the same
classification. Moving the endpoint check into direct transfer is the same
integrity hardening. Delegation-graph preflight is conventional
exact-generation validation on the existing graph and does not trigger review.

Rust service code does not assume a fixed PE entry RVA. WHP and KVM publish the
entry derived from the verified signed executable in a hosted metadata page.
That page is supervisor-only identity mapped in the kernel and service roots;
its distinct CPL3 mapping remains subject to ordinary shared-page lifecycle
revocation. Page-table frames remain supervisor-only self-mapped for active
walking. This is a hosted launch contract, not authenticated evidence against
the host.

Fresh one-time Lamport-signed runs on 2026-08-23 completed schema admission,
commit, both responses, cleanup, restart, repeated admission and commit from the
replacement's fresh volatile state, derived-authority revocation, and the
restart-budget proof on both backends.
Nested KVM reported
`verify=18059us prepare=2407us execute=1044us total=22746us`; WHP reported
`verify=18086us prepare=4022us execute=780us total=26549us`. These are hosted
controlled probes, not physical-hardware, host-resistant isolation, persistent
configuration, or bare-metal evidence. Authorized restart messages have not yet
executed through this CPL3 path.

Syscall operation 9 now provides the narrow kernel mechanism for supervision
query. The register ABI accepts one opaque generational service token and one
exact task-local capability, requires every reserved register to be zero, and
calls `ServiceSupervisor::state_authorized`; names identify, while exact READ
authority authorizes. Success returns only Running, Exited, or Faulted, and
rejection returns no state or distinguishing detail. It accepts no executable,
entry point, stack, priority, time, restart policy, or host-reprovisioning input.
The canonical query path is now end to end. After configuration commit, the
CPL3 client encodes a fixed 48-byte query with a zero capability placeholder and
delegates exactly READ from a READ|DELEGATE source. Kernel IPC installs the
derived receiver-space capability; the service rejects missing, extra, or
payload-forged authority, invokes operation 9 through a narrow authorizer, and
returns a canonical 48-byte response with zero detail. Query-only userspace
dispatch rejects restart before invoking the kernel, because fresh execution
context must remain trusted. Both signed generations independently verify the
request identity, exact opaque service token, Running state, and zero detail.
Fresh runs reported KVM `verify=21698us prepare=2585us execute=1695us
total=46730us` and WHP `verify=18771us prepare=4102us execute=835us
total=27424us`. This proves the hosted canonical query envelope, not authorized
restart, live recovered-policy restoration, host-resistant isolation, or bare metal.

The next restart prerequisite removes the last request-controlled clock input.
Bytes 40--47 of every supervision request are now canonical zero, and the
in-process adapter receives observed time separately from trusted kernel code.
Syscall operation 10 accepts only a nonzero generational capability and service
token; RDX, R10, R8, and R9 must all be zero. Its result is either one opaque
replacement generation or a detail-free denial. The service-probe image denies
every operation-10 call until a matching trusted reprovision plan is available;
there is no fallback context. `ServiceSupervisor` now prepares a non-mutating,
one-use plan after exact CONTROL, cleanup, budget, backoff, and service checks.
Trusted code may cross the host reprovisioning boundary, after which commit
revalidates exact service generation, object, lifecycle state, cleanup, budget,
backoff, and plan identity before task creation. Replay sees the retired
generation and fails. This is the fail-closed restart substrate, not successful
CPL3 restart-message or host-reprovisioning evidence. Fresh signed regression
runs of the existing query/lifecycle path reported KVM `verify=21728us
prepare=2851us execute=1414us total=49244us` and WHP `verify=18696us
prepare=3778us execute=906us total=27136us`; operation 10 was not exercised.

The hosted isolation prerequisite for an independent restart client is present
on both backends. The fixed service registry holds three verified image,
root, and instance records, but shared-page and resource-page state remains a
separate two-slot family. Service-probe runners attach slot 2 at disjoint checked
image, stack, and page-table ranges and require its entry to match the verified
service artifact and its root to match the requested table arena. Fresh signed
runs completed with KVM `verify=20829us prepare=2351us execute=1257us
total=44966us` and WHP `verify=18795us prepare=4089us execute=832us
total=27297us`.

The focused `service-restart-request-probe` now enters a management task in that
third root. The task has only endpoint SIGNAL and independently provisioned
CONTROL|DELEGATE for the retired sender; it has no shared or resource mapping.
After typed peer-death cleanup, the receiver signals readiness. The manager
sends a canonical 48-byte Restart request with a zero capability placeholder
and transfers exactly CONTROL. Userspace rejects the wrong operation, malformed
payload, or any missing, extra, or payload-forged capability before operation
10. The kernel accepts no caller time or launch context: it constructs the
fixed signed sender context, prepares a one-use plan, emits a host re-arm
boundary, revalidates and commits, provisions the fresh sender generation, and
returns a canonical detail-free response. The manager verifies a distinct live
generation and Running state before its checked breakpoint. Isolated service
stacks are bounded at 32 KiB, and initial slot order ensures the already-blocked
manager observes the response before the unprovisioned replacement can run.
Fresh signed runs reported KVM `verify=21020us prepare=2547us execute=1489us
total=47762us` and WHP `verify=17615us prepare=4632us execute=850us
total=26729us`. These probes stop before replacement execution. Fresh ordinary
service-probe regressions separately proved replacement re-entry under KVM and
WHP; neither result is physical-hardware, crash, persistent-policy, bare-metal,
or host-resistant evidence.

For this supervision increment, the `DIGITAL-RIGHTS REVIEW` found no new collection,
retention, correlation, remote disclosure, DRM or publisher veto,
owner-attestation restriction, accessibility exclusion, AI authority, or
persistence. The local authorized result is deliberately coarse and neither a
service name nor its token conveys authority. The `HOSTILE SECURITY REVIEW`
treats request bytes, capability descriptors, counts, capability, service token,
generation, response fields, and every reserved register as hostile. Missing,
extra, payload-forged, stale, guessed, mismatched, attenuated, or malformed
authority fails without state or distinguishing detail. Query requires exact
READ and restart requires exact independently transferred CONTROL for the exact
live generation. Restart planning adds no user-selected
clock or execution context, persists nothing, and creates no publisher or remote
authority. Operation 10 rejects unstaged or mismatched requests, and plan commit treats
generation, object, cleanup, backoff, budget, context binding, runtime capacity,
and replay as hostile state. The third hosted slot adds only explicit endpoint
and target CONTROL authority, no observation, retained data, shared/resource
mapping, or ambient authority; its ranges, slot index,
artifact digest, image length, entry, and page-table root are hostile and must
exact-match, while shared/resource APIs continue to reject slot 2. Post-commit
provisioning failure is fail-stop, and the replacement does not execute before
the authorized response is observed. This agent review does not replace
the constitution's independent human dual review.

Fresh one-time Lamport-signed runs on 2026-08-24 additionally completed exact
read-capability zero checks, exact read/write-capability writes, readback,
receiver active-leaf/binding/final-handle retirement, host absent-leaf
observation, zero-before-re-arm, and the same checks in the replacement
generation. KVM reported `verify=20816us prepare=2469us execute=1449us
total=49915us`; WHP reported `verify=18522us prepare=3679us execute=799us
total=26838us`. These remain hosted controlled probes.

The next bounded supervision increment extends the canonical 48-byte request
with operation 3 (`ReplacePolicy`) and one nonzero setting ID. Payload authority
remains zero. The IPC envelope must contain exactly two capabilities in order:
the schema-bound setting's attenuated READ handle and a separately attenuated
CONTROL handle for the live service. Userspace re-reads the canonical persisted
policy through the first handle, rejects malformed or wrong-service data against
its trusted `ObjectId(0xa1)` registration, and invokes pointer-free syscall 11
through the second. The kernel again checks CONTROL against the live
generational service entry, preserves consumed budget and deadlines, advances
the bounded policy generation, and returns only success or rejection. Missing,
extra, reordered, stale, payload-forged, or wrong-object authority fails closed.
The controlled probe's per-task capability capacity is nine because the two new
derived handles coexist with three initial and four earlier message-derived
handles until task retirement; the increase adds storage capacity, not rights,
and domain retirement still revokes the complete derived lineage.

One newly generated one-use key signed the exact kernel image and a distinct
one-use key signed the exact service image; both private keys were consumed.
The identical signed bundles completed policy replacement followed by the
authorized restart under KVM (`verify=21451us prepare=2322us execute=1304us
total=50561us`) and WHP (`verify=19660us prepare=4107us execute=924us
total=28314us`). This is signed hosted controlled-probe evidence, not live
stable-storage restoration, reboot reconstruction, bare metal, physical-device,
power-loss, or host-resistant evidence.

For this increment, the `DIGITAL-RIGHTS REVIEW` found no collection, retention,
correlation, disclosure, DRM, publisher veto, owner-attestation restriction,
accessibility exclusion, AI authority, or persistence. Policy data remains data
and cannot create authority. The `HOSTILE SECURITY REVIEW` treats operation,
setting and service identities, generations, payload placeholders, capability
count/order/rights, policy bytes and bounds, reserved fields, runtime capacity,
and every response field as hostile. Exact setting READ and exact service
CONTROL are independently revalidated, and all denial remains detail-free.
This agent review does not replace independent human dual review.

Patent review: `NOT_TRIGGERED` — this composes conventional fixed-record IPC,
ordered capability attenuation, configuration re-read, and a bounded
capability-authorized syscall. It enters none of the recorded `TRIGGERED`
compatibility, host-share, accessibility-device, browser semantic,
JavaScript/WebAssembly, AI, or media scopes.

The next storage composition adds a reusable
`prepare_block_stable_configuration` boundary. It creates one bounded
`BlockFileSession` over the exact-block `BlockVolume` and invokes the existing
stable-checkpoint staging gate; it accepts no device name, session token, host
path, or authority from checkpoint bytes. A deterministic integration supplies
the volume through `ServicedBlockDevice`, whose live session is principal-bound
and independently reauthorized at every block operation. It stages the
canonical policy checkpoint, verifies and flushes its extent and publication
metadata, replaces only the inactive superblock, consumes one exact COW receipt,
recovers only the selected stable-file generation, and reloads the trusted-
object-bound restart policy. An attenuated read-only derived session is rejected
before its first backend write; revoking the parent retires both generations.

Windows and Arch Linux each passed 26 `mrml-config` and 107 `mrml-storage`
release tests. Strict no-dependency `mrml-config` clippy passed on both. This is
deterministic unit/simulation evidence, not signed CPL3 block-service execution,
live reboot restoration, authenticated monotonic rollback state, physical
power-loss, or device durability evidence.

The `DIGITAL-RIGHTS REVIEW` found no remote disclosure, collection, retention,
correlation, DRM, publisher veto, owner-attestation restriction, accessibility
exclusion, AI authority, ambient namespace, or persistence grant. The
`HOSTILE SECURITY REVIEW` treats configuration and file capabilities, block
session/principal/rights, device and object identities, generations, extents,
digests, metadata pointers, transaction participants, receipt, selected root,
and every I/O outcome as hostile. Independent exact checks precede mutation;
uncertainty remains an error. This agent review does not replace independent
human dual review.

Patent review: `NOT_TRIGGERED` — conventional composition of the existing MRML-
native block service, exact-block file session, COW receipt, and configuration
checkpoint. No compatibility, host-share, accessibility-device, browser,
JavaScript/WebAssembly, AI, or media mechanism is entered.

Focused verification after the live integration used:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel -p mrml-config -p mrml-whp --release --no-default-features
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel -p mrml-config -p mrml-whp -p mrml-whp-run --release --no-default-features --no-deps -- -D warnings
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel-image --release --target x86_64-unknown-uefi --features service-probe --no-deps -- -D warnings
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel-image --release --target x86_64-unknown-uefi --features service-restart-request-probe --no-deps -- -D warnings
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-service-image --release --target x86_64-unknown-uefi --no-deps -- -D warnings
cargo +nightly test -q -p mrml-kernel -p mrml-config -p mrml-kvm --release --no-default-features
cargo +nightly clippy -q -p mrml-kernel -p mrml-config -p mrml-kvm -p mrml-kvm-run --release --no-default-features --no-deps -- -D warnings
```

Windows passed 25 configuration, 442 kernel, and 22 WHP tests with one ignored;
Linux passed 25 configuration, 442 kernel, and 18 KVM tests with one ignored.
All listed strict clippy invocations passed.

Patent review: `NOT_TRIGGERED` — conventional fixed-record protocol parsing,
optimistic transactional revision checks, bounded audit rings, and capability
authorization.

### Capability-selected MRML-native block backend

The backend-neutral virtual-block runners now accept one separately provisioned
generational capability and exact backend object. A narrow wrapper reauthorizes
the live handle for `READ`, `WRITE`, or the newly explicit `FLUSH` right before
calling the corresponding unsafe backend method. Device and scalar-transport
identity, block number, length, queue data, and interrupt authority remain data
or separately authorized mechanisms and cannot redirect the backend object.
Capability denial is a clean rejection and reaches no backend; the existing
backend distinction between rejected and uncertain mutation is preserved, so
uncertainty still fails the device and poisons queue state. KVM and WHP runners
construct the same exact-object projection. Optional bounded block-region
authority is not implemented.

Focused tests cover read-only, write-only, and flush-only attenuation, exact
wrong-object rejection, revoked-handle rejection, unchanged output on denied
reads, and zero backend calls on every denied operation. Existing queue,
lifecycle, protected-completion, acknowledgement, restart, and runner tests
remain passing.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run -p mrml-whp -p mrml-whp-run --release --no-default-features
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel -p mrml-kvm -p mrml-kvm-run -p mrml-whp -p mrml-whp-run --release --no-default-features --no-deps -- -D warnings
CARGO_TARGET_DIR=target/block-capability-linux cargo +nightly test -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run --release --no-default-features
CARGO_TARGET_DIR=target/block-capability-linux cargo +nightly clippy -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run --release --no-default-features --no-deps -- -D warnings
```

Windows passed 420 kernel, 7 KVM, 4 KVM-runner, 21 WHP, and 5 WHP-runner tests;
the benchmark crate's 14 environment-specific tests and one WHP hardware test
were ignored. Arch Linux under WSL2 passed 420 kernel, 18 KVM, and 6 KVM-runner
tests; the benchmark crate's 13 environment-specific tests and one KVM hardware
test were ignored. Both strict Clippy gates passed. A fresh one-time Lamport-
signed matching block image then completed the 32-operation eight-cycle two-slot
controlled probe under WHP (`verify=17907us prepare=3509us execute=6599us
total=31752us`) and `/dev/kvm` (`verify=17392us prepare=2450us execute=79692us
total=124107us`). These are hosted VMM controlled probes against volatile memory,
not host-resistant, persistent-storage, physical-device, or durability evidence.
An older WHP artifact produced a protocol mismatch and a later stale artifact did
not complete; neither is evidence.

The `DIGITAL-RIGHTS REVIEW` found no collection, retention, correlation, remote
disclosure, attestation, DRM, publisher/vendor authority, first-party bypass,
accessibility restriction, AI authority, or persistent owner-state change. The
change reduces ambient host access by requiring owner-policy-selected exact
authority. The `HOSTILE SECURITY REVIEW` treats capability tokens and
generations, expected object, rights, operation, block arithmetic, queue and
transport state, interrupt authority, revocation, and backend results as hostile.
Authorization precedes backend access; denial performs no I/O; separate interrupt
authority is preserved; and uncertainty remains fail-stop. This agent review does
not replace the constitution's independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional operation-specific capability
authorization around the existing MRML-native block backend. No VirtIO,
host-share, accessibility-device, browser-semantic, JavaScript/Wasm, or media
mechanism from the recorded triggered scope is implemented.

### Capability-bound virtual-block backend regions

`VirtualBlockBackendAuthority` now binds the exact live capability/object pair
to a trusted-policy-selected nonempty `backend_first_block` and
`exposed_block_count`. Construction rejects zero length and end overflow. Guest
block zero translates to the selected backend start; complete byte length must
be a nonzero multiple of device block size, checked request end must remain
inside the exposed count, and translated arithmetic must not overflow. These
checks occur after capability authorization but before the unsafe backend call,
so malformed or cross-boundary requests disclose no backend data and perform no
I/O. Before any vCPU entry, both common runners additionally require exposed
count to equal the active device's advertised block count. Geometry mismatch
fails the VM without consuming its pending exit or touching queue, scratch, or
backend state.

Focused simulation tests cover empty and overflowing descriptors, nonzero
translation, first/last exposed blocks, a request beginning at the end, a
multi-block boundary crossing, non-block-aligned byte length, untouched blocks
outside the region, and pre-entry device-geometry mismatch. Hosted launchers use
the same common descriptor with the exact full two-block volatile backend.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run -p mrml-whp -p mrml-whp-run --release --no-default-features
cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run -p mrml-whp -p mrml-whp-run --all-targets --no-default-features --no-deps -- -D warnings
CARGO_TARGET_DIR=target/block-region-linux cargo +nightly test -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run --release --no-default-features
CARGO_TARGET_DIR=target/block-region-linux cargo +nightly clippy -q -p mrml-kernel -p mrml-kernel-bench -p mrml-kvm -p mrml-kvm-run --all-targets --no-default-features --no-deps -- -D warnings
```

Windows passed 423 kernel, 7 KVM, 4 KVM-runner, 21 WHP, and 5 WHP-runner tests;
14 benchmark tests and one WHP hardware test were ignored. Arch Linux under
WSL2 passed 423 kernel, 18 KVM, and 6 KVM-runner tests; 13 benchmark tests and
one KVM hardware test were ignored. Both strict all-target Clippy gates passed.
The matching signed 32-operation workload passed under WHP
(`verify=17577us prepare=3784us execute=4976us total=30246us`) and `/dev/kvm`
(`verify=17057us prepare=2140us execute=82143us total=121945us`). This is hosted
VMM evidence over an exact full volatile region. Nonzero translation remains
simulation evidence; no persistent, physical-device, durability, or
host-resistant claim is made.

The `DIGITAL-RIGHTS REVIEW` found no collection, retention, correlation,
disclosure, attestation, DRM, publisher/vendor authority, accessibility
restriction, AI authority, or persistent owner-state change. Exact region
projection further limits delegated storage authority. The `HOSTILE SECURITY
REVIEW` treats capability/object binding, region start/count, block size, guest
block/count, byte length, every arithmetic result, advertised geometry,
revocation, and backend outcome as hostile. Construction, authorization,
translation, and complete-range checks precede backend access; geometry mismatch
precedes vCPU entry; outside blocks remain untouched; and mutation uncertainty
retains the prior fail-stop semantics. This agent review does not replace the
constitution's independent human dual review.

Patent review: `NOT_TRIGGERED` — conventional checked subrange translation and
capability-bounded block dispatch. No triggered compatibility, host-share,
accessibility-device, browser, JavaScript/Wasm, or media mechanism is introduced.

### Exact MRML-native block/PCI lifecycle attachment

The common kernel now binds one exact routed PCI function generation to one
active MRML-native block generation, its canonical queue, interrupt vector, and
capability-selected backend region. It rejects non-block class data, stale PCI
or block generations, poisoned or substituted queue state, and backend geometry
mismatch before native resource access. PCI identity, BDF, BAR address, queue
data, and block numbers remain data and cannot select backend authority.

A block-specific unsafe BAR adapter records mapping state only after the external
backend confirms the exact assigned window. Rejection or uncertainty preserves
PCI command and attachment state; uncertainty still requires VM quarantine. The
reset/removal adapter supplies an exact cleanup record covering PCI generation/
window, block generation, queue, interrupt vector, backend object/range, and
confirmed mapping. External cleanup must retire every mapping, interrupt, DMA
binding, backend-capability descendant, cached decision, queue mapping, device
state, and handle before block and PCI lifecycle state advances.

Windows gnullvm evidence on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel --lib --no-default-features pci_block_
  PASS: 7 passed

cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel --lib --no-default-features --no-deps -- -D warnings
  PASS

cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel --lib --no-default-features
  PARTIAL: 429 passed; the pre-existing
  task_runtime::tests::delegation_capacity_is_preflighted_and_reusable_after_revocation
  overflowed the Windows test-process stack

wsl.exe -d archlinux -- bash -lc 'cd /mnt/c/Users/Mitch/Documents/mrml && CARGO_TARGET_DIR=target/pci-block-attachment-linux cargo test -q -p mrml-kernel --lib --no-default-features pci_block_ && CARGO_TARGET_DIR=target/pci-block-attachment-linux cargo clippy -q -p mrml-kernel --lib --no-default-features --no-deps -- -D warnings'
  PASS: 7 tests; strict Clippy passed

wsl.exe -d archlinux -- bash -lc 'cd /mnt/c/Users/Mitch/Documents/mrml && CARGO_TARGET_DIR=target/pci-block-attachment-linux cargo test -q -p mrml-kernel --lib --no-default-features'
  PASS: 430 passed
```

That lifecycle increment's evidence is `UNIT`/`SIMULATION` only; it did not by
itself establish guest-visible discovery. The following increment adds only the
narrow hosted discovery evidence and still does not establish MMIO block
transport, native KVM/WHP BAR or interrupt adapters, MSI/MSI-X, DMA, assigned
production PCI identity, QEMU compatibility, physical-device behavior, or host-
resistant isolation.

DIGITAL-RIGHTS REVIEW: no publisher/vendor/verifier authority, DRM, persistence,
telemetry, content inspection, AI privilege, accessibility restriction, or host
path is introduced. The backend remains selected only by exact owner-policy-
derived capabilities, and test identity is non-authorizing data.

HOSTILE SECURITY REVIEW: attachment/function/block generations, BDF, class, BAR
window, queue, vector, backend object/range, lifecycle, mapping result, and
cleanup result are hostile. Exact preflight occurs before external mutation;
clean failure preserves state; uncertain mutation requires quarantine; cleanup
precedes both device and PCI lifetime changes.

Patent review: `NOT_TRIGGERED` — conventional exact-generation virtual-device
lifecycle composition and map-before-enable/revoke-before-reset ordering. The
planned VirtIO, host-share, accessibility-device, browser, script/Wasm, and media
scopes remain `TRIGGERED`. Agent review does not replace independent human dual
review.

### Signed test-only attached block-class PCI discovery

The existing `pci-configuration-probe` now creates one exact test-only Type-0
function at BDF `00:04.0`, one active MRML-native block generation, one queue
layout and interrupt vector, and one capability-selected backend region. The
host constructs `VirtualBlockPciAttachment` from the router's exact function
generation before vCPU entry. The arbitrary test identity is vendor `0x1234`,
device `0x5678`, revision `1`, programming interface `0`, subclass `0x80`, and
class `0x01`; it is not an assigned or production MRML identity.

The signed guest issues four Configuration Mechanism #1 transactions through
the common runner: select/read offset 0 and select/read offset 8. Exact native
KVM and WHP scalar-input completion returns `0x5678_1234` and `0x0180_0001`.
Only after checking both values does the guest emit the vendor/device dword on
proof port `0x4d66`. The common VM budget is exactly four exits. No BAR is
assigned or mapped, memory decode remains disabled, no interrupt is routed, no
DMA authority exists, and no block request is issued.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel --lib --no-default-features pci_
  PASS: 8 passed

cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kvm-run -p mrml-whp-run --no-default-features
  PASS: KVM-run 4; WHP-run 5

cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kvm-run -p mrml-whp-run --all-targets --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
cargo +nightly-x86_64-pc-windows-msvc clippy -q -p mrml-kernel-image --target x86_64-unknown-uefi --no-default-features --features pci-configuration-probe -- -D warnings -A clippy::result_unit_err
  PASS; the explicit allowance is for the pre-existing mrml-crypto unit-error API

wsl.exe -d archlinux -- bash -lc 'cd /mnt/c/Users/Mitch/Documents/mrml && CARGO_TARGET_DIR=target/pci-attached-discovery-linux cargo test -q -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --no-default-features && CARGO_TARGET_DIR=target/pci-attached-discovery-linux cargo clippy -q -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --all-targets --no-default-features --no-deps -- -D warnings'
  PASS: kernel 430; KVM 18 passed/1 ignored; KVM-run 6; strict Clippy passed

target/pci-attached-discovery-linux/release/mrml-kvm-run target/pci-attached-discovery-evidence/kernel.signed target/pci-attached-discovery-evidence/release.public 1 pci-configuration-probe
  PASS: verify=17581us prepare=2649us execute=48598us total=98132us

target/pci-attached-discovery-evidence/release/mrml-whp-run.exe target/pci-attached-discovery-evidence/kernel.signed target/pci-attached-discovery-evidence/release.public 1 pci-configuration-probe
  PASS: verify=17814us prepare=3943us execute=2614us total=28355us
```

The live runs use one freshly built UEFI image and one fresh one-time Lamport
signature. They are hosted controlled-probe evidence for attached read-only PCI
identity/class discovery and continuation only. They are not evidence for BAR
mapping, MMIO block operations, interrupts, DMA, VirtIO, QEMU compatibility,
production identity allocation, native boot, bare metal, physical hardware, or
host-resistant isolation.

DIGITAL-RIGHTS REVIEW: the probe introduces no collection, retention,
correlation, disclosure, attestation, DRM, publisher/vendor preference,
first-party bypass, accessibility restriction, AI authority, persistent state,
or host path. The test identity and BDF identify only ephemeral probe state and
never authorize the exact backend object.

HOSTILE SECURITY REVIEW: signed image admission, exact four-exit budget, BDF,
selectors, register offsets, port/direction/width, vendor/device/class values,
function/block generations, queue/vector/backend binding, pending native input,
typed outcomes, and proof tuple are hostile. Construction and exact attachment
preflight precede vCPU entry; every transaction uses the deny-by-default common
runner; a mismatch or backend uncertainty fails the VM before proof acceptance;
and no mapping, interrupt, DMA, or block operation can be inferred from
discovery.

Patent review: `NOT_TRIGGERED` — conventional test-only PCI configuration
discovery over the existing common/native runner. The planned VirtIO,
host-share, accessibility-device, browser, JavaScript/Wasm, and media scopes
remain `TRIGGERED`. Agent review does not replace independent human dual review.

### MRML-native PCI-MMIO block notification

The canonical block transport now distinguishes the existing
`MrmlSpecificScalarIo` mechanics from `MrmlSpecificPciMmio`. The latter grants
no scalar-I/O ports and encodes two fixed 32-bit write-only offsets for the
doorbell and protected completion acknowledgement. It remains the MRML-native
queue protocol and makes no VirtIO compatibility claim. Configuration data,
BDF, BAR address, offsets, and written values remain routing data rather than
mapping, queue, interrupt, or backend authority.

The common MMIO runner revalidates the exact live PCI/block generations, queue,
vector, capability-selected backend region, and confirmed BAR window before any
queue access. It accepts only the exact mapped GPA, width, direction, and value.
Successful device processing precedes native write retirement; completion
failure fail-stops the VM. KVM retains and completely re-decodes the pending run
page tuple. WHP translates only the bounded `C7 00 imm32` write form used by the
signed probe, retains the exact GPA/width/value, and advances RIP by the decoded
six-byte instruction only after common acceptance. Both prevent vCPU re-entry
while a write remains pending.

Dedicated initial launch paths install one supervisor RW/NX first-level MMIO
leaf without a second-level RAM mapping. The signed guest reads the attached
test identity/class, assigns BAR0 at `0x00c00000`, enables memory decode through
the exact attachment mapper, and writes the idle doorbell. The common runner
observes an empty queue, retires precisely that write, and the guest continues
to its existing proof port. This proves hosted trapped-notification execution;
it does not prove a completed block request, MMIO completion acknowledgement,
native interrupt routing, MSI/MSI-X, DMA, VirtIO, QEMU interoperability,
production PCI identity, physical hardware, or host-resistant isolation.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel --lib --no-default-features pci_mmio_
  PASS: 2 passed
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kernel --lib --no-default-features mmio_
  PASS: 8 passed
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kvm --lib --no-default-features
  PASS: 7 passed
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-whp --lib --no-default-features
  PASS: 22 passed; 1 ignored unrelated manual performance test
cargo +nightly-x86_64-pc-windows-gnullvm test -q -p mrml-kvm-run -p mrml-whp-run --no-default-features
  PASS: KVM-run 4; WHP-run 5

wsl.exe -d archlinux -- bash -lc 'cd /mnt/c/Users/Mitch/Documents/mrml && CARGO_TARGET_DIR=target/mmio-linux cargo test -q -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --no-default-features && CARGO_TARGET_DIR=target/mmio-linux cargo clippy -q -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --all-targets --no-default-features --no-deps -- -D warnings'
  PASS: kernel 434; KVM 18 passed/1 ignored; KVM-run 6; strict Clippy passed

cargo +nightly-x86_64-pc-windows-gnullvm clippy -q -p mrml-kernel -p mrml-kvm -p mrml-whp -p mrml-kvm-run -p mrml-whp-run --all-targets --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
cargo +nightly-x86_64-pc-windows-msvc clippy -q -p mrml-kernel-image --target x86_64-unknown-uefi --no-default-features --features pci-configuration-probe -- -D warnings -A clippy::result_unit_err
  PASS; the explicit allowance is for the pre-existing mrml-crypto unit-error API

target/pci-mmio-kvm-linux/release/mrml-kvm-run target/pci-mmio-evidence/artifacts/kernel.signed target/pci-mmio-evidence/artifacts/release.public 1 pci-configuration-probe
  PASS: verify=16974us prepare=2499us execute=35872us total=77014us
target/pci-mmio-evidence/release/mrml-whp-run.exe target/pci-mmio-evidence/artifacts/kernel.signed target/pci-mmio-evidence/artifacts/release.public 1 pci-configuration-probe
  PASS: verify=17832us prepare=4143us execute=1265us total=27124us
```

The Windows full kernel test process separately reached 433/434 before the
pre-existing task-runtime capacity test overflowed its Windows process stack;
the complete 434-test kernel suite passed under Arch Linux. The live KVM and WHP
runs used the identical freshly built UEFI image and one-use Lamport signature;
the signer consumed the private key.

DIGITAL-RIGHTS REVIEW: the transport introduces no telemetry, host path,
attestation, DRM, publisher preference, accessibility restriction, AI-only
interface, persistence, secret export, or remote authority. Owner policy still
selects the exact backend only through a separately revocable capability, and
the test identity/BAR cannot authorize it.

HOSTILE SECURITY REVIEW: signed admission, exit budget, BDF, selectors, BAR,
command state, function/block generations, mapped window, queue/vector/backend
binding, GPA, width, direction, value, instruction bytes, pending completion,
and every backend result are hostile. Mapping is confirmed before decode
publishes; queue access follows exact revalidation; native re-entry follows only
accepted completion; mismatch or uncertainty fails closed. Reset/removal still
requires exact cleanup of mappings, interrupts, DMA state, queues, cached
decisions, descendants, and handles.

Patent review: `NOT_TRIGGERED` — conventional fixed write-only MMIO registers,
page-table trapping, exact-generation mapping validation, and completion-before-
reentry for the existing MRML-native device. The planned VirtIO, host-share,
accessibility-device, browser, JavaScript/Wasm, and media scopes remain
`TRIGGERED`. Agent review does not replace independent human dual review.

### Completed bounded PCI-MMIO block transactions

The reusable guest queue boundary now receives a typed notification descriptor
instead of assuming scalar ports. Each descriptor is exactly either a scalar
port/value or a PCI-MMIO offset/value derived from the canonical active-device
configuration. The x86_64 adapter is constructed for exactly one of those
transport classes. Its PCI constructor requires an exact aligned one-page BAR;
mixing a scalar descriptor with an MMIO binding, substituting an offset/value,
overflowing the BAR, or redirecting to ordinary RAM fail-stops the guest. The
native MMIO method retains the single fixed `C7 00 01 00 00 00` encoding admitted
by the bounded WHP decoder.

The signed PCI probe now discovers the test-only function, assigns BAR0, enables
memory decode, loads the canonical guest configuration page, and constructs the
ordinary allocation-free block driver for `MrmlSpecificPciMmio`. It fills two
separate 4 KiB payloads, publishes both write requests before retirement, drains
and acknowledges both protected completions through BAR offset `4`, clears both
payload pages, reuses the two slots for reads, drains and acknowledges those
completions, and compares every returned byte. The host admits exactly nine PCI
configuration exits plus eight MMIO writes. Each doorbell reauthorizes the exact
backend object and operation right, processes at most one request, publishes one
protected completion, retires the exact native write, and uses the existing
separate `SIGNAL` capability for legacy vector `48`. Each acknowledgement
revalidates the live attachment/window and advances exactly one protected
consumer before native retirement. If retirement becomes uncertain after either
queue mutation, the VM, device, and bridge now all fail-stop.

Fresh verification on 2026-08-24 used one release UEFI image and one newly
generated one-use Lamport signature. The signer consumed the private key. Both
native runners used the identical `kernel.signed` and `release.public` files:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel native_transport_ --lib
  PASS: 2
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel mmio_transaction_runner_ --lib
  PASS: 2
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-whp --lib
  PASS: 22; 1 unrelated manual performance test ignored
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-whp-run
  PASS: 6
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --lib --no-default-features
  PARTIAL: 435 passed; the pre-existing task-runtime capacity test overflowed
  the Windows test-process stack
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel -p mrml-kvm -p mrml-whp -p mrml-kvm-run -p mrml-whp-run --all-targets --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
  PASS
cargo +nightly-x86_64-pc-windows-gnullvm build -p mrml-kernel-image --target x86_64-unknown-uefi --no-default-features --features pci-configuration-probe
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel-image --target x86_64-unknown-uefi --no-default-features --features pci-configuration-probe -- -D warnings -A clippy::result_unit_err
  PASS

wsl.exe -d archlinux --cd /mnt/c/Users/Mitch/Documents/mrml -- bash -lc 'CARGO_TARGET_DIR=target/pci-mmio-block-linux cargo test -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --no-default-features && CARGO_TARGET_DIR=target/pci-mmio-block-linux cargo clippy -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --all-targets --no-default-features --no-deps -- -D warnings'
  PASS: kernel 436; KVM 18 passed/1 ignored; KVM-run 7; strict Clippy passed

target/pci-mmio-block-kvm/release/mrml-kvm-run target/pci-mmio-block-evidence/artifacts/kernel.signed target/pci-mmio-block-evidence/artifacts/release.public 1 pci-configuration-probe
  PASS: verify=17027us prepare=2571us execute=45313us total=90982us
target/pci-mmio-block-evidence/release/mrml-whp-run.exe target/pci-mmio-block-evidence/artifacts/kernel.signed target/pci-mmio-block-evidence/artifacts/release.public 1 pci-configuration-probe
  PASS: verify=17907us prepare=4473us execute=3157us total=29945us
```

This is `UNIT`/`SIMULATION` evidence for the typed guest transport and hostile
runner cases plus `VMM` hosted-controlled evidence for the exact bounded KVM and
WHP sequence. It is not production block I/O, persistence or durability,
PCI-transport restart recovery, a production BAR mapper/revoker, native PCI
interrupt routing, MSI/MSI-X, DMA/IOMMU isolation, VirtIO, QEMU differential
evidence, physical-device behavior, native boot, bare metal, or host-resistant
isolation.

DIGITAL-RIGHTS REVIEW: this increment adds no host path, filesystem namespace,
telemetry, retention, correlation, remote disclosure, secret access, attestation,
DRM, publisher/vendor preference, first-party bypass, AI-only interface,
accessibility restriction, or persistence. Owner policy still selects the exact
volatile backend through independently revocable object and operation
capabilities; PCI identity, BAR, queue records, and payloads never authorize it.

HOSTILE SECURITY REVIEW: signed admission, the exact seventeen-exit budget,
configuration selectors, BDF, identity/class, command and BAR state, transport
descriptor, BAR bounds, MMIO GPA/width/direction/value/instruction encoding,
function/block/queue generations, request counters/slots/IDs, payload ranges,
backend region and rights, protected completion order, interrupt authority,
pending native write, and every backend result are hostile. Exact preflight and
capability checks precede access; mutation uncertainty poisons the device/bridge;
native retirement uncertainty additionally fails the VM; no mismatch can resume
execution or reach the proof tuple.

Patent review: `NOT_TRIGGERED` — typed dispatch between conventional scalar and
fixed MMIO notification mechanics, plus bounded write/read verification over the
already reviewed MRML-native queue, does not enter the recorded planned
compatibility, host-share, accessibility-device, browser, JavaScript/Wasm, or
media scopes. Those planned scopes remain `TRIGGERED` in
[`patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md). Agent review does not replace
independent human dual review.

### Attachment-bound legacy PCI completion masking

The PCI-MMIO runner now reads the current backend-neutral configuration router
on every invocation and exact-matches attachment, BDF, function generation, BAR
window, and memory-decode state before legacy completion delivery. PCI command
state remains non-authorizing data; the existing exact `SIGNAL` capability and
vector allowlist remain mandatory.

With conventional interrupt-disable set, a completed request keeps its pending
notification and no injection occurs. Backend work is neither replayed nor
acknowledged. The signed guest starts masked, publishes its first write, then
explicitly unmasks the same selected function. The host proves the latch stayed
pending, processes that ninth configuration exit, and delivers the retained
vector before the next guest entry. The complete two-write/two-read protected-
acknowledgement sequence remains unchanged.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features virtual_pci
  PASS: 28
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features virtual_block
  PASS: 69
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kvm-run -p mrml-whp-run --release --no-default-features
  PASS: KVM-run 4; WHP-run 6
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel -p mrml-kvm -p mrml-whp -p mrml-kvm-run -p mrml-whp-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel-image --target x86_64-unknown-uefi --release --no-default-features --features pci-configuration-probe -- -D warnings -A clippy::result_unit_err
  PASS
wsl.exe -d archlinux --cd /mnt/c/Users/Mitch/Documents/mrml -- bash -lc 'CARGO_TARGET_DIR=target/pci-interrupt-linux cargo test -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --no-default-features && CARGO_TARGET_DIR=target/pci-interrupt-linux cargo clippy -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --all-targets --no-default-features --no-deps -- -D warnings'
  PASS: kernel 436; KVM 18 passed/1 ignored; KVM-run 7; strict Clippy passed
target/pci-interrupt-kvm/release/mrml-kvm-run target/pci-interrupt-evidence/artifacts/kernel.signed target/pci-interrupt-evidence/artifacts/release.public 1 pci-configuration-probe
  PASS: verify=17280us prepare=2128us execute=49138us total=90367us
target/pci-interrupt-evidence/release/mrml-whp-run.exe target/pci-interrupt-evidence/artifacts/kernel.signed target/pci-interrupt-evidence/artifacts/release.public 1 pci-configuration-probe
  PASS: verify=18051us prepare=3996us execute=2506us total=28437us
```

The two native runners used the identical fresh UEFI image and one-use Lamport
signature; the private key was consumed. This is unit/simulation and hosted
controlled KVM/WHP evidence, not production native interrupt routing, MSI/MSI-X,
DMA/IOMMU, durable storage, VirtIO, physical hardware, bare metal, or host-
resistant isolation.

DIGITAL-RIGHTS REVIEW: no telemetry, retention, remote disclosure, host path,
attestation, DRM, publisher/vendor authority, first-party bypass, secret export,
AI-only interface, accessibility restriction, or persistence is added. Owner
policy retains independently revocable backend and interrupt authority.

HOSTILE SECURITY REVIEW: command bits, attachment/function generations, BAR,
decode state, vector, pending latch, queue, backend rights, exit tuple, and
native completion are hostile. The runner obtains current router state rather
than accepting a caller snapshot. Masking cannot clear or replay completion;
stale/substituted state and uncertain mutation fail closed. Reset/removal cleanup
remains exact and generation-bound.

Patent review: `NOT_TRIGGERED` — conventional PCI command-register interrupt
masking applied to the already reviewed MRML-native legacy completion bridge.
The planned compatibility, host-share, accessibility-device, browser,
JavaScript/Wasm, and media scopes remain `TRIGGERED`. Agent review does not
replace independent human dual review.

### Negotiated PCI-MMIO block flush completion

The signed attached-block probe now advertises and negotiates the existing
MRML-native flush feature in both its guest-visible configuration page and the
host device. After the two writes and two reads have completed and their exact
protected acknowledgements have retired, the canonical guest driver publishes
one payload-free flush request. The common runner independently reauthorizes the
exact backend object's `FLUSH` right, the controlled backend records exactly one
flush, and the guest retires the zero-byte protected completion before emitting
proof. Scalar block probes continue to negotiate no flush feature. The exact VM
budget is nineteen exits: nine configuration transactions and ten MMIO
doorbell/acknowledgement transactions for five block operations.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features virtual_block
  PASS: 69
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features virtual_pci
  PASS: 28
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kvm-run -p mrml-whp-run --release --no-default-features
  PASS: KVM-run 4; WHP-run 6
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel -p mrml-kvm -p mrml-whp -p mrml-kvm-run -p mrml-whp-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel-image --target x86_64-unknown-uefi --release --no-default-features --features pci-configuration-probe -- -D warnings -A clippy::result_unit_err
  PASS
wsl.exe -d archlinux --cd /mnt/c/Users/Mitch/Documents/mrml -- bash -lc 'export CARGO_TARGET_DIR=/tmp/mrml-flush-target; cargo test -p mrml-kernel --release --no-default-features virtual_block && cargo test -p mrml-kernel --release --no-default-features virtual_pci && cargo test -p mrml-kvm-run --release --no-default-features && cargo clippy -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err'
  PASS: block 69; PCI 28; KVM-run 7; strict Clippy passed
target/pci-flush-kvm/release/mrml-kvm-run target/pci-flush-evidence/kernel.signed target/pci-flush-evidence/release.public 1 pci-configuration-probe
  PASS: verify=16758us prepare=2218us execute=39635us total=79755us
target/pci-flush-evidence/release/mrml-whp-run.exe target/pci-flush-evidence/kernel.signed target/pci-flush-evidence/release.public 1 pci-configuration-probe
  PASS: verify=18627us prepare=3892us execute=2769us total=29085us
```

The first KVM attempt failed closed at transaction nine because the host device
negotiated flush while the separately materialized guest configuration page did
not. No flush was submitted. Configuration construction was then bound to the
same transport-specific feature value, a regression assertion preserved zero
features for scalar transport, and both native probes passed with the identical
fresh UEFI artifact. One fresh Lamport key signed that artifact once and its
private key was consumed.

This is unit/simulation and hosted controlled KVM/WHP evidence for one volatile
backend flush call. It is not durable-storage, power-loss, production backend,
VirtIO, QEMU, physical-device, bare-metal, or host-resistant-isolation evidence.

DIGITAL-RIGHTS REVIEW: no host path, ambient storage, telemetry, retention,
remote disclosure, attestation, DRM, vendor/publisher authority, secret export,
AI-only interface, accessibility restriction, or persistence is added. The
owner retains exact independently revocable backend and operation authority.

HOSTILE SECURITY REVIEW: feature bits, configuration pages, requests, queue
counters, completion lengths, attachment generations, BAR state, backend
identity, and rights are hostile. Flush requires matching explicit negotiation,
the exact live attachment/queue path, and independent `FLUSH` reauthorization;
malformed, stale, attenuated, mismatched, or uncertain state fails closed.

Patent review: `NOT_TRIGGERED` — this conventionally exercises the already
implemented MRML-native flush operation through the existing queue and protected
completion. It adds no compatibility, host-share, accessibility-device,
browser, JavaScript/Wasm, or media mechanism. Those planned scopes remain
`TRIGGERED`; agent review does not replace independent human dual review.

### PCI-MMIO orderly VM replacement

The attached MRML-native PCI-MMIO probe now applies the existing canonical
block restart image and consuming lost-execution witness after all five requests
and protected acknowledgements are fully retired. The host suspends the exact
device and bridge, publishes and captures the canonical `5/5/5/5` idle queue
state with request-ID anchors at five, destroys the old native VM, and only then
converts the captured image into the one-use restoration witness. The retained
routed attachment, BAR mapping, interrupt policy, backend capability, and
volatile backend remain host-owned and are never reconstructed from guest data.

A fresh VM is prepared from the same verified executable and handoff with the
same first-level MMIO trap but fresh queue pages. Restoration accepts only the
exact transport-bound configuration, queue, and resume image. The replacement
guest rejects every state except all-zero fresh launch or exact `5/5/5/5`
recovery, reconstructs the nonzero canonical driver history, and emits proof
without replaying PCI configuration or block operations. The device resumes
only after complete restoration. A focused hostile test proves a PCI-MMIO image
cannot be restored against a scalar-transport device and that the substituted
queue remains untouched.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features virtual_block
  PASS: 70
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kernel --release --no-default-features virtual_pci
  PASS: 28
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kvm-run -p mrml-whp-run --release --no-default-features
  PASS: KVM-run 4; WHP-run 6
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel -p mrml-kvm -p mrml-whp -p mrml-kvm-run -p mrml-whp-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kernel-image --target x86_64-unknown-uefi --release --no-default-features --features pci-configuration-probe -- -D warnings -A clippy::result_unit_err
  PASS
wsl.exe -d archlinux --cd /mnt/c/Users/Mitch/Documents/mrml -- bash -lc 'CARGO_TARGET_DIR=target/pci-restart-kvm cargo test -p mrml-kernel --release --no-default-features virtual_block && CARGO_TARGET_DIR=target/pci-restart-kvm cargo test -p mrml-kernel --release --no-default-features virtual_pci && CARGO_TARGET_DIR=target/pci-restart-kvm cargo test -p mrml-kvm-run --release --no-default-features && CARGO_TARGET_DIR=target/pci-restart-kvm cargo clippy -p mrml-kernel -p mrml-kvm -p mrml-kvm-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err'
  PASS: block 70; PCI 28; KVM-run 7; strict Clippy passed
target/pci-restart-kvm/release/mrml-kvm-run target/pci-restart-evidence/kernel.signed target/pci-restart-evidence/release.public 1 pci-configuration-probe
  PASS: verify=17215us prepare=2618us execute=87337us total=128166us
target/pci-restart-evidence/release/mrml-whp-run.exe target/pci-restart-evidence/kernel.signed target/pci-restart-evidence/release.public 1 pci-configuration-probe
  PASS: verify=17477us prepare=4277us execute=5288us total=31039us
```

One fresh Lamport key signed the exact shared UEFI artifact once; the private
key was consumed. This is unit/simulation and hosted controlled KVM/WHP orderly
replacement evidence for that milestone. It did not cover asynchronous crash
capture, pending-I/O or uncertain-mutation recovery, reset/hotplug, durable storage, production BAR
revocation, VirtIO/QEMU, physical-device, bare-metal, or host-resistant evidence.

DIGITAL-RIGHTS REVIEW: replacement creates no ambient host path, telemetry,
retention, disclosure, attestation, DRM, vendor authority, secret export,
AI-only interface, accessibility restriction, or persistence. Current owner
capabilities remain the authority; canonical guest state carries none.

HOSTILE SECURITY REVIEW: queue counters, resume bytes, request history,
transport identity, attachment generation, BAR state, interrupt state, backend
identity, and lifecycle are hostile. Capture requires exact idle suspension;
old execution is irreversibly destroyed before restoration authority exists;
fresh memory, exact configuration, and transport are validated before writes;
failure leaves the retained device suspended and cannot resume old execution.

Patent review: `NOT_TRIGGERED` — this applies the existing canonical block
restart image and lost-execution witness to the existing MRML-native PCI-MMIO
transport at an idle cut. It adds no compatibility, host-share,
accessibility-device, browser, JavaScript/Wasm, or media mechanism. Those
planned scopes remain `TRIGGERED`; agent review does not replace independent
human dual review.

### Destroyed-VM PCI block cleanup

After the replacement guest emits proof, both controlled runners now destroy
that final native VM or WHP partition before invoking the existing common
revoke-before-reset composition. Native destruction retires the complete guest
address space, first-level trapped BAR leaf, second-level execution container,
pending native exit state, and interrupt-injection context. The cleanup adapter
then exact-matches attachment and function generation, active BAR window,
command state, block generation, queue, vector, backend object/range, and the
attachment's confirmed mapped window.

Before any revocation mutation, the adapter requires the exact live block
capability with `READ|WRITE|FLUSH` and the exact interrupt capability with
`SIGNAL`. It revokes both, then the common function revoker resets the block
device and attachment. Only after that succeeds does the PCI router advance the
function generation and clear command/BAR state. Duplicate or substituted
cleanup records fail before capability mutation; common hostile tests continue
to cover stale generations, preflight failure, cleanup rejection/uncertainty,
and configuration preservation.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kvm-run -p mrml-whp-run --release --no-default-features
  PASS: KVM-run 4; WHP-run 6
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kvm-run -p mrml-whp-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
  PASS
wsl.exe -d archlinux --cd /mnt/c/Users/Mitch/Documents/mrml -- bash -lc 'CARGO_TARGET_DIR=target/pci-cleanup-kvm cargo test -p mrml-kvm-run --release --no-default-features && CARGO_TARGET_DIR=target/pci-cleanup-kvm cargo clippy -p mrml-kvm-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err'
  PASS: KVM-run 7; strict Clippy passed
target/pci-cleanup-kvm/release/mrml-kvm-run target/pci-restart-evidence/kernel.signed target/pci-restart-evidence/release.public 1 pci-configuration-probe
  PASS: verify=16941us prepare=2571us execute=62091us total=102662us
target/pci-cleanup-evidence/release/mrml-whp-run.exe target/pci-restart-evidence/kernel.signed target/pci-restart-evidence/release.public 1 pci-configuration-probe
  PASS: verify=17582us prepare=3958us execute=5085us total=30811us
```

The native runners used the identical previously fresh one-time-signed UEFI
artifact; this increment changes only host cleanup after guest proof. Its
private key had already been consumed. This is hosted controlled destroyed-VM
cleanup evidence, not live dynamic BAR unmapping, TLB invalidation, detach/
hotplug, production interrupt routing, durable storage, VirtIO/QEMU, physical
hardware, bare metal, or host-resistant isolation.

DIGITAL-RIGHTS REVIEW: cleanup adds no ambient path, telemetry, retention,
disclosure, attestation, DRM, vendor authority, secret export, AI-only
interface, accessibility restriction, or persistence. It removes backend and
interrupt authority rather than manufacturing or retaining it.

HOSTILE SECURITY REVIEW: native execution state, cleanup record, generations,
BAR/command data, queue, vector, backend authority, and both capabilities are
hostile. Success requires irreversible native destruction plus exact complete
preflight; capability revocation precedes common device/attachment reset and
PCI mutation. Any mismatch or uncertainty fails closed without a runnable VM.

Patent review: `NOT_TRIGGERED` — this conventionally composes native VM
destruction, capability revocation, and the existing block/PCI reset boundary.
It adds no live-unmap technique, compatibility, host-share,
accessibility-device, browser, JavaScript/Wasm, or media mechanism. Those
planned scopes remain `TRIGGERED`; agent review does not replace independent
human dual review.

### Hosted pending-I/O block reset isolation

The same signed KVM/WHP PCI-block probe now deliberately leaves two distinct
ownership classes after its ordinary write/read/flush and orderly-replacement
proof: request 6 is completed and published into native guest queue memory but
never acknowledged, while request 7 is consumed and admitted into the device
but never issued to the backend. The host then destroys the complete native VM
or partition before invoking the existing exact cleanup adapter. Old backend
and interrupt capabilities are revoked before block, attachment, and PCI
generations advance.

After reset, completing request 7's retained ticket fails as stale and the
generation-1 request bytes copied from the destroyed guest fail admission. Only
after the device is explicitly renegotiated and activated does a fresh bridge,
fresh generational backend and interrupt capabilities, and a generation-2
attachment exist; a fresh generation-2 request is then admissible. The earlier
focused simulation continues to cover the stale BAR acknowledgement and latched
notification cases, which cannot be exercised after deliberate destruction
without inventing a second live native mapping path.

Recorded verification on 2026-08-24:

```text
cargo +nightly-x86_64-pc-windows-gnullvm test -p mrml-kvm-run -p mrml-whp-run --release --no-default-features
  PASS: KVM-run 5; WHP-run 7
cargo +nightly-x86_64-pc-windows-gnullvm clippy -p mrml-kvm-run -p mrml-whp-run --all-targets --release --no-default-features --no-deps -- -D warnings -A clippy::result_unit_err
  PASS
wsl.exe -e sh -lc 'cd /mnt/c/Users/Mitch/Documents/mrml && CARGO_TARGET_DIR=/tmp/mrml-pending-reset-target cargo test -p mrml-kvm-run -p mrml-whp-run --release --no-default-features'
  PASS: KVM-run 8; WHP-run 4
/tmp/mrml-pending-reset-kvm/release/mrml-kvm-run target/pci-restart-evidence/kernel.signed target/pci-restart-evidence/release.public 1 pci-configuration-probe
  PASS: verify=18392us prepare=2137us execute=87244us total=134985us
target/pending-reset-whp/release/mrml-whp-run.exe target/pci-restart-evidence/kernel.signed target/pci-restart-evidence/release.public 1 pci-configuration-probe
  PASS: verify=18223us prepare=3526us execute=5171us total=30957us
```

These are hosted controlled probes using an existing one-time-signed test
artifact, not live hotplug/unmapping, durable-backend, QEMU-differential,
physical-device, bare-metal, or host-resistant evidence.

DIGITAL-RIGHTS REVIEW: reset retains no old backend, interrupt, mapping, device,
or capability authority. The successor receives only newly issued exact
capabilities; device identity and queue bytes remain non-authorizing data. The
change adds no ambient path, telemetry, attestation, DRM, vendor authority,
accessibility restriction, secret export, or AI-only interface.

HOSTILE SECURITY REVIEW: the destroyed guest bytes, counters, completion,
ticket, generations, attachment, BAR state, cleanup record, and capability
handles are hostile. Native destruction and complete cleanup preflight precede
revocation and generation advance. Stale completion and request identities are
tested after reactivation so rejection cannot be explained merely by an
inactive device. Fresh capability and attachment generations are required
before successor admission; uncertainty remains fail closed.

Patent review: `NOT_TRIGGERED` — this extends the existing controlled
MRML-native reset probe with conventional pending-record staging, stale
generation checks, capability reissuance, and successor admission. It adds no
VirtIO compatibility, host-share protocol, accessibility device, browser
semantic interface, JavaScript/WebAssembly runtime, AI mechanism, or media
mechanism. Those planned scopes remain `TRIGGERED`; agent review does not
replace independent human dual review.

### Exact stopped-guest BAR-leaf retirement

Before the pending-I/O probe destroys its final native execution container,
KVM and WHP now open the exact existing kernel page-table arena and root, require
the configured page-aligned trapped-MMIO identity, exact-match the identity-
mapped `KERNEL_MMIO_READ_WRITE` leaf, remove it, and verify it is absent. A wrong
address and a duplicate retirement fail without changing the recorded state.
Successful retirement irreversibly marks that prepared guest non-runnable;
both the inherent WHP entry and common `VmBackend` entry reject all later vCPU
execution. This prevents an unflushed cached translation from becoming a
runnable fallback and deliberately avoids claiming resumable live unmapping.

Only after leaf retirement succeeds does the controlled mapper accept the
existing memory-decode disable, clear its exact attachment mapping record, and
permit subsequent VM destruction, capability revocation, block/attachment
reset, and PCI generation advance. The trap page never had a second-level RAM
mapping, so there is no native KVM slot or WHP GPA allocation to withdraw.

Recorded controlled-probe results on 2026-08-24 were 103,209 us total under
Arch Linux/WSL2 KVM (`verify=17177us`, `prepare=2140us`, `execute=62216us`) and
30,940 us total under Windows WHP (`verify=17756us`, `prepare=3858us`,
`execute=5547us`). These reuse the previously signed test artifact. They are
not resumable dynamic unmapping, a TLB shootdown protocol, hotplug, production
BAR management, durable-device, QEMU-differential, or physical evidence.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`NONE` for the hosted adapter, new parser `NO`, new authority model `NO`, new
persistent state `NO`, external dependency `NO`, failure isolated `YES`, and
existing-object reuse `YES`. The change reuses exact `Mapping`, existing-root
page-table access, `unmap_exact`, `verify_unmapped`, the PCI mapper contract,
and the existing fail-closed reset path.

DIGITAL-RIGHTS REVIEW: leaf retirement removes access and cannot create backend,
interrupt, device, path, publisher, vendor, verifier, DRM, AI, or accessibility
authority. The successor still requires fresh exact capabilities. It records no
user identity, activity, content, or remote evidence.

HOSTILE SECURITY REVIEW: the requested address, page-table arena/root, leaf
permissions/physical identity, mapper record, BAR/command state, execution
state, and replay attempts are hostile. Exact-match validation precedes the
leaf write; the no-reentry quarantine publishes before the first possible
page-table mutation; verified absence precedes mapper publication. Failure or
uncertainty cannot resume execution, clear authority, or permit reset.
Resumable operation remains unavailable until a separately reviewed TLB-
coherent protocol exists.

Patent review: `NOT_TRIGGERED` — conventional exact page-table leaf removal,
absence verification, linear no-reentry state, and existing PCI lifecycle
composition add no compatibility transport, host-share protocol, accessibility
device, browser semantic interface, JavaScript/WebAssembly runtime, AI
mechanism, or media mechanism. Planned scopes remain `TRIGGERED`; agent review
does not replace independent human dual review.

### Checked sole-vCPU BAR withdrawal

The controlled KVM and WHP PCI/block probes now extend stopped-guest leaf
retirement into a narrowly resumable withdrawal mechanism. Before editing the
page table, the prepared guest exact-matches the configured page-aligned BAR
leaf and publishes its no-reentry quarantine. It removes and verifies absence
of the exact identity-mapped `KERNEL_MMIO_READ_WRITE` leaf. MRML's leaf encoder
does not set the x86 global bit.

The native backend then accepts only one vCPU, no pending I/O-read or MMIO-write
emulation, the exact prepared aligned CR3, and CR4.PCIDE clear. It rewrites the
same CR3 through `KVM_SET_SREGS` or `WHvSetVirtualProcessorRegisters` and reads
CR3/CR4 back before the prepared guest clears quarantine and marks the exact
leaf absent. A wrong leaf and replay fail before mutation.
Any failure after quarantine publication leaves execution forbidden.

Fresh controlled-probe results on 2026-08-24 were 132,780 us total under Arch
Linux/WSL2 KVM (`verify=17277us`, `prepare=1989us`, `execute=90865us`) and
30,056 us total under Windows WHP (`verify=17940us`, `prepare=3401us`,
`execute=5318us`). One newly generated one-use Lamport key signed the exact
shared UEFI image once; the signer consumed the private key. After the existing
proof exit, the guest contains a second fixed 32-bit output on port `0x4d67`.
The host accepts it only after successful withdrawal and exact CR3 reload. Both
backends printed `PCI_WITHDRAW coherent=1` and `continued=1`, proving the same
guest resumed far enough to return the exact post-withdrawal port/width/value
before cleanup. This is not SMP/asynchronous shootdown, hotplug, production
mapping, QEMU-differential, physical-device, bare-metal, or host-resistant
evidence.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`NONE` for the hosted adapter, new parser `NO`, new authority model `NO`, new
persistent state `NO`, external dependency `NO`, failure isolated `YES`, and
existing-object reuse `YES`.

DIGITAL-RIGHTS REVIEW: withdrawal only removes a previously capability-selected
mapping. It creates no ambient backend/path authority, DRM, publisher or vendor
priority, attestation, telemetry, secret export, accessibility restriction, or
AI-only interface. Fresh device and capability generations remain necessary.

HOSTILE SECURITY REVIEW: the requested leaf, root, vCPU count, pending-emulation
state, CR4 mode, native register operation, read-back, continuation exit,
mapper record, and replay are hostile. Exact checks precede mutation;
quarantine precedes uncertainty; only verified leaf absence plus exact
non-PCID CR3 rewrite/read-back permits later entry. The runner exact-matches the
post-withdrawal port, width, direction, and value. Failure cannot clear mapping
state or advance device generations.

Patent review: `NOT_TRIGGERED` — this is conventional non-global page-table
withdrawal and native stopped-vCPU control-register synchronization. It adds no
VirtIO compatibility, host-share protocol, accessibility device, browser
semantics, JavaScript/WebAssembly runtime, AI mechanism, or media mechanism.
The planned scopes recorded as `TRIGGERED` in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Decode-coupled native BAR mapper

The PCI configuration runner now has a backend-aware mapper contract. It passes
the same stopped backend that produced the exact configuration exit to the
mapper after common exit-policy validation, without raw-pointer aliasing. The
router still constructs the exact attachment/function generation and BAR
window, and the block composition still derives its complete cleanup record
before native mutation. Simulation-only mappers retain the original
backend-independent contract; both paths use the same transactional command
state machine.

Controlled KVM/WHP PCI guests preallocate only the bounded intermediate-table
path while non-runnable, remove the leaf, reload CR3, and return with the leaf
verified absent. On memory-decode enable, the native block mapper exact-matches
the cleanup record, installs and verifies the identity-mapped non-global MMIO
leaf, and performs the checked sole-vCPU CR3 reload/read-back before the command
bit or attachment mapping record publishes. Wrong-address and duplicate install
attempts fail. Replacement reconstruction explicitly reinstalls the same exact
leaf before the recovered guest runs. Decode disable invokes coherent exact
withdrawal through the same router transaction before clearing command and
attachment state; withdrawal replay fails.

Controlled probes on 2026-08-24 reused the identical one-use-signed continuation
artifact. Arch Linux/WSL2 KVM completed in 135,641 us (`verify=17439us`,
`prepare=2229us`, `execute=91907us`); Windows WHP completed in 39,633 us
(`verify=17696us`, `prepare=12006us`, `execute=5479us`). Both exercised dynamic
install, five MRML-native block operations, replacement mapping reconstruction,
transactional withdrawal, and the exact post-withdrawal continuation marker.
This is controlled hosted sole-vCPU evidence, not SMP/asynchronous shootdown,
production hotplug, durable-device, QEMU-differential, physical-device,
bare-metal, or host-resistant evidence.

Engineering Constitution complexity score: complexity impact `MODERATE`, TCB
impact `NONE` for the hosted adapter, new parser `NO`, new authority model `NO`,
new persistent state `NO`, external dependency `NO`, failure isolated `YES`,
and existing-object reuse `YES`.

DIGITAL-RIGHTS REVIEW: the mapper receives no ambient host path, identity-based
privilege, publisher priority, DRM, attestation, telemetry, secret, AI, or
accessibility authority. It can only install or withdraw the exact window
already selected by capability-bound block/PCI policy. The MRML-native block
transport remains authoritative; no compatibility transport was added.

HOSTILE SECURITY REVIEW: the backend identity, stopped-vCPU state, attachment
and function generations, BAR geometry, cleanup record, page-table root/path/
leaf, mapping state, CR3/CR4, pending emulation, native API result, read-back,
replacement state, and replay attempts are hostile. Exact preflight precedes
mutation; quarantine precedes any page-table write; mapping publication follows
verified install and coherence; command clearing follows verified withdrawal.
Uncertainty cannot publish decode, clear mapping state, or resume the guest.

Patent review: `NOT_TRIGGERED` — this composes conventional bounded page-table
leaf installation/withdrawal, stopped-vCPU CR3 synchronization, and the existing
MRML-specific PCI/block lifecycle. It adds no VirtIO compatibility, host-share
protocol, accessibility device, browser semantics, JavaScript/WebAssembly
runtime, AI mechanism, or media mechanism. Planned scopes recorded as
`TRIGGERED` in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged;
agent review does not replace independent human dual review.

### Quantitative memory commitment core

The first Phase 2 memory-resource prerequisite is **PARTIALLY IMPLEMENTED**.
The no-allocation kernel policy table gives every pool and object a fixed-slot,
generational identity backed by a distinct capability object. Root pools carry
bounded page, mapping, and child budgets. Child creation atomically reserves a
non-amplifying subset of each parent budget and attenuates rights through the
existing capability machinery. Object creation commits an exact nonzero page
count; exact-limit allocation succeeds and one page over fails without changing
state. Object release advances its generation. Controlling-pool revocation
preflights every descendant generation and counter, then invalidates all
descendant pools and objects while returning only aggregate page/object counts.
Inspection is a separate right and exposes quantities, never memory content.

This milestone records commitments only. It does not allocate physical frames,
create mappings or shared views, pin pages, authorize DMA, resize or copy on
write, charge IPC/cache/page-table metadata, project guest pools through the
VMM, select userspace policy, or provide hosted or physical-hardware evidence.

Engineering Constitution complexity score: complexity impact `MODERATE`, TCB
impact `LOW`, new parser `NO`, new authority model `YES` (the documented
quantitative memory authority is now represented in code), new persistent state
`NO`, external dependency `NO`, failure isolated `YES`, and existing-object
reuse `YES` through the capability space.

DIGITAL-RIGHTS REVIEW: the mechanism authenticates owner-selected local
resource policy; it introduces no vendor, publisher, provider, verifier, DRM,
attestation, telemetry, AI-only, first-party, or accessibility authority.
Delegation can only reduce quantity and rights. Usage inspection is separately
authorized and data-minimized, and revocation remains under exact capability
control.

HOSTILE SECURITY REVIEW: namespace and table capacities, page and mapping
quantities, rights, slot/generation identities, parent ancestry, counters,
capabilities, exhaustion, and replay are hostile. Construction rejects zero,
overflowing, unknown-right, over-budget, and stale inputs before publication.
All recursive-revocation generations, sums, and parent counter updates are
preflighted before mutation. Generational reuse prevents stale identities from
recovering authority.

Patent review: `NOT_TRIGGERED` — fixed-capacity generational tables,
capability-attenuated quantitative reservations, checked counters, and
content-free usage accounting are conventional resource-accounting mechanisms.
No compatibility transport, host-share protocol, accessibility device, browser
semantic interface, JavaScript/WebAssembly runtime, AI mechanism, or media
mechanism is implemented. Planned scopes recorded as `TRIGGERED` in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Fixed IPC and task-metadata commitment

The first IPC-accounting foundation is **PARTIALLY IMPLEMENTED**. The task
runtime already owns fixed-capacity scheduler state, task/capability metadata,
a bounded delegation table, and two inline message slots per task; message
delivery does not allocate RAM. `AccountedTaskRuntime` therefore rounds its
complete concrete footprint to pages and commits that exact quantity as one
anonymous `MemoryObject` before the wrapper becomes available. It delegates
ordinary runtime operations without creating per-message double charges.

Invalid scheduler configuration fails before charging. Insufficient pool
authority fails without publishing a runtime or changing usage. Consuming
release returns the exact commitment. If control authority was revoked or
release otherwise fails, the API returns the complete still-accounted runtime
rather than dropping its ownership state. The existing unaccounted constructor
remains available to simulations and current boot composition, so production
integration, dynamic IPC storage, cache/page-table charges, and physical backing
are not implemented by this milestone.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through `MemoryPoolTable` and `CapabilitySpace`.

DIGITAL-RIGHTS REVIEW: one exact local pool pays for the fixed privileged
footprint; no sender, peer, publisher, vendor, provider, verifier, DRM,
attestation, AI, or accessibility identity gains authority. The charge records
only a page quantity and backing class, exposes no message or memory content,
and cannot draw from an unrelated pool after exhaustion.

HOSTILE SECURITY REVIEW: generic task/capability capacities, concrete layout
size, integer conversion, page rounding, pool/object generations, capability
slots, exhaustion, revocation, and release failure are hostile. Checked
calculation and pool allocation complete before publication. Allocation failure
leaves usage unchanged; release failure returns the live wrapper and preserves
the commitment. Static inbox capacity and delivery backpressure remain
independent from RAM authority.

Patent review: `NOT_TRIGGERED` — page-rounded accounting of a fixed-capacity
runtime allocation is conventional resource accounting. It implements no
compatibility transport, host-share protocol, accessibility device, browser
semantic interface, JavaScript/WebAssembly runtime, AI mechanism, or media
mechanism. Planned scopes recorded as `TRIGGERED` in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Preallocated page-table arena commitment

Quantitative page-table accounting is **PARTIALLY IMPLEMENTED** for the
existing bounded x86_64 arena. `AccountedPreallocatedPageTableStore` first
checks the original scalar arena geometry: nonzero capacity of at most 256
pages, aligned physical base, and a bounded 52-bit end. Its unsafe contract
retains the caller's exclusive identity-mapped supervisor-writable ownership
and no-concurrent-observation obligations. It then commits the exact full
capacity as one anonymous `MemoryObject` before publishing a usable
`PageTableStore`. Intermediate-table allocation consumes only this already
committed arena, so sparse mappings cannot exceed its recorded bound.

Construction failure publishes no store and leaves pool usage unchanged.
Returning the commitment consumes the wrapper and is unsafe: every CPU, task,
VM, recovery image, and cached root must have lost reachability, and required
TLB invalidation must already be complete. Release failure returns the complete
store and charge. Accounting release is not proof of content erasure. Current
kernel-image boot/service construction still opens the legacy unaccounted store,
so no live boot, hardware, or physical reclamation evidence is claimed.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through the page-table store, `MemoryPoolTable`, and `CapabilitySpace`.

DIGITAL-RIGHTS REVIEW: the pool charge authenticates only owner-selected local
resource policy. It introduces no content inspection, publisher/vendor/provider
priority, DRM, remote attestation, telemetry, AI-only interface, or accessibility
restriction. Exhaustion cannot consume another pool's authority.

HOSTILE SECURITY REVIEW: the physical base, capacity, multiplication/addition,
52-bit bound, pool/object generations, capability slots, allocation exhaustion,
active-root reachability, TLB state, cleanup, and replay are hostile. Complete
arena validation and exact commitment precede publication. Release is explicitly
unsafe and consuming; failure preserves both store and charge. The wrapper does
not conflate quantitative accounting with physical ownership or erasure.

Patent review: `NOT_TRIGGERED` — exact accounting of a conventional bounded
page-table arena adds no compatibility transport, host-share protocol,
accessibility device, browser semantic interface, JavaScript/WebAssembly
runtime, AI mechanism, or media mechanism. Planned scopes recorded as
`TRIGGERED` in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged;
agent review does not replace independent human dual review.

### Accounted volatile configuration state

The first userspace-policy memory integration is **PARTIALLY IMPLEMENTED**.
`AccountedConfigurationService` rounds its complete concrete wrapper—including
all fixed-capacity schema/value records and bounded audit history—to pages and
commits that exact quantity as one anonymous `MemoryObject`. Empty construction,
construction with validated schemas, and authenticated checkpoint recovery all
finish semantic validation before charging and finish charging before returning
publishable state. Configuration identifiers and contents never become memory
authority.

Invalid roots, schemas, checkpoint state, arithmetic, and insufficient pools
fail without changing usage. Consuming release returns the exact commitment;
failure returns the complete still-accounted service. This wrapper does not
charge caller-owned checkpoint/IPC scratch, provide physical backing, select
pool policy, reconstruct boot capabilities, or change configuration/restart
authority. The signed service image and reboot path still construct unaccounted
volatile state, so no live, reboot, hosted, or physical evidence is claimed.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through the configuration service, `MemoryPoolTable`, and
`CapabilitySpace`.

DIGITAL-RIGHTS REVIEW: the local owner-selected pool pays only for fixed service
state. Accounting reveals no setting, value, audit event, user identity, or
content and creates no vendor, publisher, provider, verifier, DRM, attestation,
AI-only, first-party, or accessibility authority. Exhaustion cannot draw from an
unrelated pool.

HOSTILE SECURITY REVIEW: generic capacities, concrete layout size, conversion
and rounding, roots, schemas, checkpoints, pool/object generations, capability
slots, exhaustion, release, and replay are hostile. Configuration validation or
recovery completes before charging; exact charging completes before publication;
failure leaves usage unchanged or returns the complete live owner. Accounting
does not replace existing per-operation capability checks.

Patent review: `NOT_TRIGGERED` — page-rounded accounting of conventional fixed-
capacity configuration state adds no compatibility transport, host-share
protocol, accessibility device, browser semantic interface,
JavaScript/WebAssembly runtime, AI mechanism, or media mechanism. Planned scopes
recorded as `TRIGGERED` in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain
unchanged; agent review does not replace independent human dual review.

### Accounted service-supervision state

The fixed lifecycle owner is **PARTIALLY IMPLEMENTED** with quantitative
accounting. `AccountedServiceSupervisor` rounds its complete concrete wrapper—
including every service/task binding, state and policy generation, restart
budget/backoff value, and cleanup-ticket slot—to pages and commits that exact
capacity as one anonymous `MemoryObject` before any service can register.
Registration, retirement, cleanup, policy replacement, and restart reuse this
fixed commitment rather than allocating hidden lifecycle state.

Pool exhaustion publishes no supervisor and leaves usage unchanged. Returning
the commitment consumes the wrapper and is unsafe because `ServiceSupervisor`
has no general unregister operation: the caller must prove that no running or
stopped task, cleanup ticket, prepared registration/restart, peer, recovery path,
or external policy state can depend on any slot or generation. Failure returns
the complete still-accounted supervisor. The live kernel image has not adopted
this wrapper, and no hosted, reboot, or physical evidence is claimed.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through `ServiceSupervisor`, `MemoryPoolTable`, and `CapabilitySpace`.

DIGITAL-RIGHTS REVIEW: the charge changes no lifecycle, restart, inspection, or
policy authority and reveals no service content, activity, or user identity. It
creates no vendor, publisher, provider, verifier, DRM, attestation, AI-only,
first-party, or accessibility privilege. Exhaustion cannot draw from another
pool.

HOSTILE SECURITY REVIEW: generic capacity, concrete layout size, conversion and
rounding, pool/object generations, capability slots, task/service generations,
restart budgets, policy generations, cleanup tickets, prepared plans, release,
and replay are hostile. Exact charging precedes publication. Release is unsafe,
consuming, and fail-closed; accounting never substitutes for lifecycle
capability checks or cleanup completion.

Patent review: `NOT_TRIGGERED` — page-rounded accounting of a conventional
fixed-capacity supervision table adds no compatibility transport, host-share
protocol, accessibility device, browser semantic interface,
JavaScript/WebAssembly runtime, AI mechanism, or media mechanism. Planned scopes
recorded as `TRIGGERED` in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain
unchanged; agent review does not replace independent human dual review.

### Atomic policy-service substrate commitment

The aggregate Phase 2 service foundation is **PARTIALLY IMPLEMENTED** as an
opt-in `AccountedPolicyServiceSubstrate`. It directly owns one fixed-capacity
`TaskRuntime`, `ServiceSupervisor`, and `ConfigurationService`, rounds that
concrete aggregate footprint to pages, and admits it with one anonymous
`MemoryObject`. This avoids partial sequential charges and double charging the
standalone accounted wrappers. Scheduler and configuration-schema inputs are
fully validated before the single allocation. Exact-limit construction
succeeds; a one-page shortage, invalid scheduler, or invalid schema publishes
no substrate and leaves committed usage unchanged. Runtime task creation and
service registration reuse the existing commitment.

Consuming release is unsafe and is demonstrated only for an empty substrate:
the caller must first prove that no task, service, cleanup ticket, prepared
registration/restart, peer, recovery path, or external policy state depends on
it. Failure returns the complete still-accounted substrate. Standalone wrappers
remain valid for components with separate owners or lifetimes. Live kernel and
service images have not adopted the aggregate, and page-table arenas,
transport/checkpoint scratch, shared buffers, mappings, physical backing, and
caches remain outside this charge. No hosted, reboot, or physical-hardware
evidence is claimed.

Engineering Constitution complexity score: complexity impact `MODERATE`, TCB
impact `LOW`, new parser `NO`, new authority model `NO`, new persistent state
`NO`, external dependency `NO`, failure isolated `YES`, and existing-object
reuse `YES` through `TaskRuntime`, `ServiceSupervisor`,
`ConfigurationService`, `MemoryPoolTable`, and `CapabilitySpace`.

DIGITAL-RIGHTS REVIEW: the single local charge changes no configuration, task,
supervision, AI, accessibility, vendor, publisher, provider, verifier, DRM, or
attestation authority. It records only a bounded page commitment, reveals no
service or configuration contents, and cannot draw from another pool.

HOSTILE SECURITY REVIEW: generic capacities, scheduler parameters, schemas,
concrete layout arithmetic, pool/object/capability generations, exhaustion,
lifecycle state, and release timing are hostile. Inner constructors validate
before the one charge; charging completes before publication; exact exhaustion
is fail-closed and atomic. Accounting never replaces capability, generation,
revocation, cleanup, or recovery checks, and unsafe release requires every
dependent authority and state transition to be retired first.

Patent review: `NOT_TRIGGERED` — atomic page-rounded composition of existing
fixed-capacity local objects is conventional resource accounting and adds no
compatibility transport, host-share protocol, accessibility device, browser
semantic interface, JavaScript/WebAssembly runtime, AI mechanism, or media
mechanism. Planned scopes recorded as `TRIGGERED` in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Capability-bound mapping reservations

The quantitative memory prerequisite is **PARTIALLY IMPLEMENTED** with a
fixed-capacity generational mapping-reservation table. Each reservation binds
one exact `MemoryObject` subrange to one target address-space authority and
virtual page range. The source capability must carry `MAP` plus every requested
READ/WRITE/EXECUTE right; a separate target capability supplies `MAP`, so a
caller-provided name cannot select an address space. Admission rejects zero or
overflowing ranges, object-range escape, writable-executable access, overlap in
the same target, table exhaustion, and use beyond the pool's mapping limit after
child reservations and active mappings are counted. Derived child mapping
budgets and direct parent reservations cannot amplify one another.

`MemoryMappingId` supplies bounded identity and lifetime but no authority.
Inspection separately requires target `INSPECT` and returns only the object ID,
page ranges, and access rights. Retirement requires target `CONTROL`, advances
the mapping generation, and returns one unit of mapping budget. It is unsafe:
the caller must first prove page-table/backend removal and every required CPU,
device, VMM, and translation-cache invalidation. Object release and recursive
pool revocation reject live reservations before mutating capabilities,
generations, or counters. This avoids claiming that accounting performed native
teardown. No frame allocator, page table, IOMMU, KVM, WHP, hosted probe, or
physical hardware is exercised by this increment. Because the fixed mapping
table is part of `MemoryPoolTable`'s concrete layout, existing aggregate
accounting wrappers automatically include its bounded default capacity.

Engineering Constitution complexity score: complexity impact `MODERATE`, TCB
impact `LOW`, new parser `NO`, new authority model `NO`, new persistent state
`NO`, external dependency `NO`, failure isolated `YES`, and existing-object
reuse `YES` through `MemoryPoolTable`, `MemoryObject`, `CapabilitySpace`, and
the established `Rights` model.

DIGITAL-RIGHTS REVIEW: reservations add no collection, retention, content
inspection, remote disclosure, stable user identity, DRM, attestation, vendor,
publisher, provider, verifier, AI-only, first-party, or accessibility authority.
They bind only owner-selected local quantitative and address-space authority;
inspection is separate and content-free. A target name or mapping ID cannot
authorize an operation.

HOSTILE SECURITY REVIEW: generic capacities, pool/object/mapping generations,
both capabilities, access rights, child reservations, active counts, page-range
arithmetic, W^X, overlap, slot reuse, exhaustion, release ordering, and
recursive revocation are hostile. Every check and counter successor is
preflighted before publication or retirement. Live mappings block object and
pool reclamation without partial mutation; stale IDs fail, and unsafe release
documents the external native-teardown proof that this policy table cannot
manufacture.

Patent review: `NOT_TRIGGERED` — fixed-capacity generational mapping accounting,
capability checks, checked ranges, W^X, overlap rejection, and fail-closed
teardown ordering are conventional local resource-management mechanisms. This
adds no compatibility transport, host-share protocol, accessibility device,
browser semantic interface, JavaScript/WebAssembly runtime, AI mechanism, or
media mechanism. Planned scopes recorded as `TRIGGERED` in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Transactional mapping backend publication

The mapping prerequisite is **PARTIALLY IMPLEMENTED** with a backend-neutral
publication/removal transaction. `install_mapping` completes every capability,
range, W^X, overlap, capacity, generation, and counter preflight before invoking
the privileged `MemoryMappingBackend`. A policy failure never calls the backend.
Backend success means the exact object subrange, target authority, virtual range,
and access are installed; only then does the table publish the generational
reservation and consume one mapping-budget unit. Backend failure is contractually
unchanged and publishes no reservation.

`remove_mapping` similarly preflights the exact live reservation, target CONTROL,
generation successor, object/pool identity, and counter decrement before calling
the backend. It retires the reservation only after the backend confirms exact
removal and every required CPU, device, VMM, and translation-cache invalidation.
Failure retains both the reservation and its mapping-budget charge for retry.
The backend trait is unsafe because an implementation must make those native
state guarantees; its request is capability-validated data, not authority.

Deterministic tests use a stateful protocol backend to prove preflight ordering,
exact request binding, install rollback, removal retry, and final generational
retirement. This increment does not resolve an abstract object to frames, edit
x86 page tables, drive KVM/WHP, invalidate real translations, or provide hosted
or physical evidence. Those adapters remain the next integration dependency.

Engineering Constitution complexity score: complexity impact `MODERATE`, TCB
impact `LOW`, new parser `NO`, new authority model `NO`, new persistent state
`NO`, external dependency `NO`, failure isolated `YES`, and existing-object
reuse `YES` through the mapping table and capability model.

DIGITAL-RIGHTS REVIEW: the transaction adds no identity, collection, content
inspection, retention, correlation, remote disclosure, DRM, attestation, vendor,
publisher, provider, verifier, AI-only, first-party, or accessibility authority.
It exercises only owner-selected local object, target, access, and quantitative
authority. Backend requests cannot authorize themselves.

HOSTILE SECURITY REVIEW: every capability, object/target identity, mapping and
pool generation, access bit, range, slot, capacity, counter successor, backend
result, retry, and teardown ordering is hostile. All fallible policy work occurs
before native mutation. Installation failure publishes nothing; removal failure
retains the exact live record; successful native transitions are followed only
by infallible bounded policy publication or retirement. An unsafe backend that
violates its unchanged/exact/invalidation contract is outside the safe API and
must receive independent implementation review.

Patent review: `NOT_TRIGGERED` — preflight/native-operation/commit sequencing
for conventional memory-map accounting is a standard transactional safety
pattern. This adds no deployment/package mechanism, compatibility transport,
host-share protocol, accessibility device, browser semantic interface,
JavaScript/WebAssembly runtime, AI mechanism, or media mechanism. All planned
`TRIGGERED` scopes in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain
unchanged; agent review does not replace independent human dual review.

### Capability-bound physical backing lifecycle

The physical-backing prerequisite is **PARTIALLY IMPLEMENTED** as a
backend-neutral lifecycle. `MemoryPhysicalBacking` describes one exact aligned,
nonempty, checked physical run whose page count must equal its committed
`MemoryObject`. Binding requires the exact object authority with both `CONTROL`
and `PIN`; physical ranges are checked against every live object before native
mutation. Only after the unsafe `MemoryObjectBackingBackend` confirms exclusive
reservation, complete zeroing, and absence of CPU/device/VMM aliases does the
policy table publish the backing. Backend failure leaves the object unbacked.

Physical identity is data, not authority. Exact-object `INSPECT` is a separate
right and returns only that object's optional run. Logical object release and
recursive pool revocation fail without mutation while backing remains live.
Backing release independently requires object `CONTROL`, rejects every live
mapping reservation before the backend call, and clears policy state only after
the backend confirms external mapping and DMA revocation, all required
invalidations, complete-run scrubbing, and safe reuse. Failure retains the exact
binding for retry. A later logical release must still revoke the object
capability and generation separately.

Deterministic tests cover wrong authority before backend invocation, claim
failure, exact request binding, cross-object physical alias rejection, mapping-
gated teardown, pool/object reclamation denial, scrub/release failure retention,
and successful final release. The backend is a stateful protocol double. This
does not implement a reusable frame allocator, direct memory zeroing, DMA or TLB
invalidation, mapping installation, KVM/WHP integration, hosted execution, or
physical-hardware evidence.

Engineering Constitution complexity score: complexity impact `MODERATE`, TCB
impact `LOW`, new parser `NO`, new authority model `NO`, new persistent state
`NO`, external dependency `NO`, failure isolated `YES`, and existing-object
reuse `YES` through `MemoryObject`, `MemoryPoolTable`, `CapabilitySpace`, and
the existing rights model.

DIGITAL-RIGHTS REVIEW: backing adds no user identity, content inspection,
collection, retention, correlation, remote disclosure, DRM, attestation,
publisher/vendor/provider/verifier, AI-only, first-party, or accessibility
authority. The owner-selected object capability controls local residency, and
separate inspection reveals only the exact physical run—not its contents.

HOSTILE SECURITY REVIEW: object/pool generations, capabilities, rights,
physical start/page arithmetic, object size, kind, aliasing, mappings, backend
results, zeroing, scrub completeness, DMA/CPU/VMM reachability, invalidation,
retry, and release ordering are hostile. Every policy check precedes backend
mutation. Claim failure publishes nothing; release failure retains ownership;
logical reclamation cannot race a live binding. Unsafe backend implementations
must independently prove exclusive zeroed claim and scrubbed safe release.

Patent review: `NOT_TRIGGERED` — exact capability-gated frame ownership,
zero-before-publication, overlap rejection, scrub-before-reuse, and transactional
publication are conventional memory-management safety mechanisms. This adds no
deployment/package mechanism, compatibility transport, host-share protocol,
accessibility device, browser semantic interface, JavaScript/WebAssembly
runtime, AI mechanism, or media mechanism. Planned `TRIGGERED` scopes in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Exact backed-mapping composition

The mapping/backing composition is **PARTIALLY IMPLEMENTED**.
`install_backed_mapping` first completes the same source-object, target, access,
range, W^X, overlap, capacity, slot, generation, and counter preflight as the
backend-neutral mapping transaction. It then requires a live physical binding
for the exact object. The validated object-page offset is checked, converted to
bytes, added to the backing start, and represented as an exact page-aligned
physical subrange of the same requested length. Missing backing or arithmetic
failure occurs before the mapping backend is called.

The privileged backend request now carries that derived physical subrange in
addition to the abstract object/range, target authority, virtual range, and
access. The committed mapping record retains the same subrange, so retryable
removal receives byte-for-byte identical data. Removal failure keeps the mapping
and prevents physical-backing release; successful confirmed teardown retires the
mapping before scrub/release can proceed. Public mapping inspection deliberately
continues to omit physical identity; separately authorized object `INSPECT` is
required for that information. The older unbacked install/reservation path
remains explicitly useful for policy simulations and cannot be mistaken for a
physical mapping by a backend that requires `physical() == Some(...)`.

Focused deterministic tests prove missing-backing denial before backend entry,
checked nonzero object-page offset translation, exact physical request reuse on
failed and successful removal, and backing-release exclusion throughout the live
mapping. This still uses protocol doubles and does not edit x86 page tables,
resolve firmware memory, drive KVM/WHP, invalidate real translations, or provide
hosted/physical evidence.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through the already reviewed mapping and backing transactions.

DIGITAL-RIGHTS REVIEW: composition introduces no identity, content inspection,
collection, retention, correlation, remote disclosure, DRM, attestation,
publisher/vendor/provider/verifier, AI-only, first-party, or accessibility
authority. Physical identity remains minimized to the privileged backend and
separately authorized exact-object inspection. Neither object names nor physical
addresses grant mapping authority.

HOSTILE SECURITY REVIEW: object/backing/mapping generations, both capabilities,
rights, object-page and byte offsets, physical/virtual bounds, W^X, overlap,
backend results, retained retry state, teardown, invalidation, and scrub ordering
are hostile. All arithmetic and authority checks precede backend mutation. The
installed exact physical request is retained unchanged until confirmed removal;
backing and logical reclamation remain impossible while it is live.

Patent review: `NOT_TRIGGERED` — checked derivation of a physical subrange and
its reuse across conventional transactional map/unmap operations is a standard
memory-management composition. This adds no deployment/package mechanism,
compatibility transport, host-share protocol, accessibility device, browser
semantic interface, JavaScript/WebAssembly runtime, AI mechanism, or media
mechanism. Planned `TRIGGERED` scopes in
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md) remain unchanged; agent review
does not replace independent human dual review.

### Inactive x86 backed-mapping adapter

The first concrete page-table composition is **PARTIALLY IMPLEMENTED** for an
exclusively owned inactive x86-64 hierarchy. The unsafe
`InactivePageTableMappingBackend` binds one `PageTableBuilder` to one exact
target object. Its ordinary path consumes only an already validated
backed-mapping request, requires physical backing, and converts only `READ`,
`READ|WRITE`, or `READ|EXECUTE` into user leaf permissions. Write-only and
execute-only requests fail because ordinary x86 leaves would silently grant
broader read access. A separate unsafe method installs or removes one exact
target-bound `USER_MMIO_READ_WRITE` range through the same transaction. That
device path is not exposed through the generic service or application mapping
planner.

Installation verifies the complete virtual range is absent before mutation.
If any later page-table allocation or write fails, every leaf the attempt could
have published—including a leaf whose store write mutated before returning an
error—is exact-matched and removed. Cleanup uncertainty permanently poisons the
adapter and prevents recovery of its builder. Removal first exact-matches every
physical leaf and permission, then clears them; a late clear error restores all
possibly removed leaves so the policy mapping remains retryable. Uncertain
restoration also poisons the hierarchy. The root must remain unreachable by all
CPUs, VMs, and resumable contexts while the adapter exists, so no TLB operation
is needed or claimed. Leaf rollback is not byte-identical hierarchy rollback:
new intermediate tables remain charged in the precommitted arena and parent
user-bit promotion can remain after a recoverable failure. Those residuals
grant no leaf and remain bounded by the arena, but a later activation owner must
revalidate the effective path; repeated failures can exhaust that arena.

Focused deterministic release tests compose the real memory-resource policy,
physical-backing lifecycle, and x86 page-table builder. They prove exact
ordinary and device two-page installation/removal, target substitution denial,
unsupported-access denial without accounting publication,
mutation-before-error rollback, retryable removal restoration, mapping-budget
retention, and poison quarantine when rollback also fails. The Linux kernel
suite passes 709 tests. This does not publish an active hierarchy, issue local
or remote TLB invalidation, perform an SMP shootdown, migrate boot construction,
drive KVM/WHP, or provide installed or physical evidence.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through the reviewed capability, backing, mapping, and page-table types.

DIGITAL-RIGHTS REVIEW: the adapter introduces no identity, content inspection,
collection, retention, correlation, remote disclosure, DRM, attestation,
publisher/vendor/provider/verifier authority, first-party privilege, AI-only
interface, or accessibility divergence. Target and physical identities remain
data, while the policy table's exact capabilities remain authority.

HOSTILE SECURITY REVIEW: target identity, backing presence, access shape,
virtual/physical arithmetic, canonicality, page-table capacity, pre-existing
leaves, partial or mutation-before-error writes, rollback, removal identity,
and cleanup results are hostile. Complete absence or exact-identity preflight
precedes mutation; retry preserves authority and accounting; uncertain cleanup
quarantines the complete inactive hierarchy rather than allowing activation.

Patent review: `NOT_TRIGGERED` — exact checked construction and removal of
conventional x86 page-table leaves is a standard memory-management mechanism.
It adds no compatibility transport, host-share protocol, accessibility device,
browser semantic interface, JavaScript/WebAssembly runtime, AI/media mechanism,
or deployment/package composition. Recorded planned `TRIGGERED` scopes remain
unchanged; agent review does not replace independent human dual review.

### Shared immutable component-code accounting

The first component-memory prerequisite is **PARTIALLY IMPLEMENTED**. The
kernel's `account_component_executable` helper allocates one exact nonzero page
commitment from an already authorized `MemoryPool` as a shared
`MemoryObject`. Its capability permits read, execute, mapping, sharing,
pinning, inspection, and lifecycle control but deliberately omits write.
`reserve_component_executable_mapping` projects the complete object as RX only
and independently requires the target address-space capability. Multiple
consumers therefore share one object-page charge while consuming separately
bounded mapping slots. Active mappings prevent logical object reclamation.

This increment is policy/accounting evidence only. It does not bind physical
backing, populate or seal executable bytes, install native page-table leaves,
perform relocation, resolve a provider, charge private component state, or run
on hosted or physical hardware. The existing unsafe reservation-release
contract remains responsible for proving native teardown before accounting is
retired.

Engineering Constitution complexity score: complexity impact `LOW`, TCB impact
`LOW`, new parser `NO`, new authority model `NO`, new persistent state `NO`,
external dependency `NO`, failure isolated `YES`, and existing-object reuse
`YES` through `MemoryPoolTable`, `MemoryObject`, mapping reservations, and the
capability space.

DIGITAL-RIGHTS REVIEW: package, interface, publisher, vendor, provider, and
first-party metadata grant no resource or mapping authority. The mechanism adds
no DRM, attestation, telemetry, content inspection, AI-only interface, or
accessibility restriction. Existing owner-selected pool and target
capabilities remain the only authority.

HOSTILE SECURITY REVIEW: page quantities, pool/object/mapping generations,
capabilities, rights, target identity, virtual arithmetic, mapping capacity,
W^X, reclamation timing, and stale handles are hostile. Allocation and mapping
reuse existing checked policy paths; the code capability cannot authorize a
write, metadata-only capability fails before charging, and live reservations
block release.

Patent review: `NOT_TRIGGERED` for this bounded adapter — it reuses conventional
explicit resource charging and RX shared-page reservations and implements no
content deduplication, harmonic/fractional sharing metric, page migration,
copy-on-write scanning, GPU code cache, or runtime provider resolver. The
broader independently serviced component subsystem remains `TRIGGERED`; see
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md). Agent review does not replace
independent human dual review.

### Signed independently serviced component probe

The exact-generation ZIM/Zstd hosted component probe is **IMPLEMENTED** as a
controlled probe on both KVM and WHP. This status covers only the focused
signed-artifact path: the common launch identity binds distinct consumer and
provider digests, interface ABI generation 3 and fingerprint, and provider
generation before either image is published. Total-mode admission then commits
one eligible microVM with zero native fallback. The consumer receives separate
shared-buffer use and delegation tokens, attenuates the delegated token to
exact `MAP|READ|WRITE`, and exchanges the fixed request and response over the
already-established IPC and `MemoryObject` data path. No payload field chooses
a provider, placement, endpoint, path, or capability.

The Windows kernel suite passed 492 tests, including the focused exact
read-only/read-write shared-buffer authorization test. Fresh one-time-signed
artifacts then completed under nested KVM with
`eligible=1|microvm=1|native_fallback=0` and under WHP with exact-generation
data-path and lifecycle-cleanup success. These are hosted controlled probes,
not bare-metal, physical-device, host-security-boundary, or complete Total-mode
evidence. Patent review remains `TRIGGERED` under the existing bounded
component-lifecycle review; see [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md).

The focused runners now also reserve, before construction, a separate
page-rounded anonymous `MemoryObject` for the exact MRML-owned
`PreparedKvmGuest<16>` or `PreparedWhpGuest` control structure. Its capability
cannot map, execute, pin, share, delegate, or authorize a device. Guest RAM is
released after backend teardown while this control charge remains observable;
the control object is then released and the pool must reach zero. Windows and
Linux kernel suites passed 502 tests, the WHP runner passed 7, and the KVM
runner passed 8. This does not account opaque host-kernel KVM/WHP allocations,
hypervisor internals, or device-model memory.

The same focused profile now accounts its concrete shared data page and
resource page independently: each is a one-page shared `MemoryObject` with one
exact read/write guest mapping reservation, established under separate source
and target capabilities before construction. A third reservation fails at the
two-slot mapping ceiling and rolls back its page charge. After backend teardown,
the runners verify two live projection mappings, retire both mappings, reclaim
both objects, then reclaim control memory and require zero remaining pages or
mappings. Windows and Linux kernel suites passed 503 tests, WHP passed 7, KVM
passed 8, and fresh signed hosted probes passed with KVM reporting one eligible
microVM and zero native fallback. This is not general VirtIO, VirtualGPU, DMA,
host-share, physical-device, or host-resistant evidence.

The focused profile now also reserves both verified component images through
the quantitative memory model before KVM/WHP construction. The verified PE
load plan supplies the geometry: read-only and executable regions become
distinct shared objects with exact R/RX reservations, writable regions become
private anonymous objects with RW reservations, and allocation gaps remain
private nonmapped charges. Separate consumer and provider target capabilities
allow identical virtual layouts in different address spaces without aliasing.
Backend teardown precedes mapping/object retirement and the pool again reaches
zero. Windows and Linux kernel suites passed 504 tests, WHP passed 7, KVM passed
8, and fresh signed hosted probes passed with KVM reporting one eligible
microVM and zero native fallback. This is not native physical backing,
resource-model page-table installation, general device projection, or physical
hardware evidence.

The focused component vCPU budget now starts one explicit runtime period and
precharges an exact maximum slice before every KVM/WHP vCPU entry. Parallel
reservations share the same allowance, and invalid time, boundary crossing,
exhaustion, stale identity, or missing execute authority rejects before entry.
The authorization also records the exact domain, in-range vCPU index,
affinity-allowed logical CPU, and bounded priority; hostile substitutions leave
the runtime counter unchanged. A reservation now has one fixed linear in-flight
slot per vCPU, bounded by the existing 64-vCPU affinity representation. Sibling
slices may be authorized concurrently but all precharge the same period
allowance. Exact per-vCPU reconciliation after backend return refunds only that
slice's verified unused precharge. Replay and substitutions of vCPU, logical
CPU, priority, start, or charge fail without mutation; release and period
rollover reject while any slot remains in flight; overrun retains its complete
charge and fails closed. Windows and Arch Linux kernel simulation suites pass
512 tests. The focused signed hosted component profile remains one vCPU.

The hosted SMP gate is now implemented for the existing signed two-vCPU kernel
probe. A backend-neutral `ScheduledSmpVmBackend` receives two exact logical-CPU,
priority, and maximum-runtime decisions and returns an outcome plus host-wall
elapsed time for each runner. The runner creates one two-vCPU budget, precharges
simultaneous 100-millisecond slices from one shared 200-millisecond period, and
does not enter either native vCPU before both charges exist. KVM binds and
bounds its BSP and AP `KvmVcpu` threads; WHP does the same for VP 0 and the
separately owned VP 1 runner. Intermediate debug and handshake exits consume
the remaining original deadline and never reset it. Both implementations wait
for cancellation-worker retirement, restore affinity and priority inside the
owning thread, reconcile both linear slices independently, release the
reservation, and retire the root before reporting success.

Fresh release-mode, freshly signed probes passed with the same semantic
two-vCPU proof: WHP reported bootstrap 6,519 microseconds and application 3,593
microseconds; nested KVM reported 4,601 and 4,229 microseconds. Windows and Arch
Linux kernel suites pass 512 tests, WHP passes 24 with one manual performance
test ignored, KVM passes 21 with one manual performance test ignored, and their
runner suites pass 7 and 8. These are hosted controlled measurements with
WHP/KVM parity, not trusted guest CPU time, exact physical-topology evidence,
bare-metal evidence, or a multi-vCPU adaptive component-service path.

Both runners now precharge the remaining bounded 100-millisecond controlled-
probe allowance and reconcile host-wall elapsed time around every component
backend entry. Teardown compares the cumulative reconciled runtime before
retiring the budget. A backend-neutral `DeadlineVmBackend` contract now requires
the cancellation mechanism to be armed before vCPU entry and its worker to be
fully retired before return or native teardown. WHP dynamically resolves and
uses `WHvCancelRunVirtualProcessor` for the exact VP. KVM first sets the exact
run page's `immediate_exit` byte, then sends a reserved no-op signal to the
runner thread so a concurrent `KVM_RUN` returns; the byte covers the documented
pre-entry signal race and is cleared only after both run and worker retire. A
conflicting process signal disposition fails before entry.

The 2026-08-28 lifecycle hardening makes the SMP ownership rule structural for
both hosted backends. Runtime threads now have joinable native handles whose
drop path also waits for retirement. KVM and WHP SMP paths retain that handle,
request cancellation on timeout or bootstrap failure, join the exact worker,
and only then restore a secondary vCPU, change trampoline permissions, return,
or permit native destruction. KVM cancellation combines the run page's
`immediate_exit` byte with `pthread_kill`; its dedicated signal is installed
through `sigaction`, conflicting dispositions are restored and rejected, and a
blocked signal rejects entry. WHP uses `WHvCancelRunVirtualProcessor` for the
exact VP. Cancellation or retirement uncertainty permanently poisons later
execution through the backend's existing fail-stop mapping state.

The common VM policy now has an inspectable irreversible poison reason and
tracks live workers, mappings, shared aliases, and pinned ranges. Start rejects
every poisoned generation. Destruction rejects running or resource-bearing VMs;
a poisoned VM additionally requires confirmed native destruction after every
tracked resource retires. Tool/GPU routing carries an exact mapping identity,
offset, length, and access instead of a host address, so revoke-and-replace
cannot silently rebind an outstanding request. Raw shared-alias construction is
crate-private. `SharedMemoryBindings::share_alias` preflights source generation,
controller and destination authority, attenuation, destination range, binding
capacity, and binding generation before publishing the alias and binding as one
transaction. Its existing resource-group identity keeps the host handle live
until the final authorized endpoint is revoked.

Windows evidence for this delta is 584 kernel tests, 44 runtime tests, and 27
WHP tests passing with one manual WHP performance test ignored. The available
live WHP tests exercised partition, reset-vector, trampoline, deadline, signed
guest, signed service, peer-page, and virtual-block paths. KVM compilation and
execution were not performed because this Windows environment cannot run the
repository's Linux-host build target; the new dedicated CI workflow supplies
the Linux kernel/KVM gate. This is unit, simulation, and hosted controlled-probe
evidence, not a production-security, guest-escape, bare-metal, or physical-
hardware claim.

Patent review: `NOT_TRIGGERED` — joinable worker ownership, conventional native
cancellation, generational state machines, range tokens, and transactional
capability binding reuse established operating-system mechanisms and introduce
no substantial new patent-sensitive algorithm. See
[`docs/patents/REVIEW_LOG.md`](patents/REVIEW_LOG.md).

Focused live signed infinite-loop guests expire on WHP and nested KVM. The
authorized logical-CPU value now crosses a separate backend-neutral contract
without another policy decision. WHP uses `SetThreadAffinityMask`; KVM uses
`pthread_getaffinity_np` and `pthread_setaffinity_np`. Both capture the complete
prior runner affinity, bind before vCPU entry, wait for run and deadline-worker
retirement, and restore that prior state before returning. An index outside the
current 64-CPU budget model, bind failure, or restoration uncertainty fails
closed. Focused live tests reject logical CPU 64 before entry and still expire
the infinite-loop guest on authorized logical CPU 0.

The ordinary signed component probes also complete through the same affinity
and deadline path: Windows and Arch Linux kernel suites pass 512 tests, WHP
passes 7, and KVM passes 8. Fresh optimized probes reported `logical_cpu=0`,
`affinity=host-enforced`, and `priority=host-normal`, with 1,466 microseconds
under WHP and 1,385 microseconds under KVM; KVM reported `eligible=1`,
`microvm=1`, and
`native_fallback=0`. This is hosted conservative accounting, cancellation, and
affinity/normal-priority evidence, not trusted guest CPU-time, exact deadline
latency, native
APIC enforcement, stronger host-priority classes, physical-hardware evidence,
or a security boundary against the host.

The next bounded scheduling increment implements exactly one portable
host-priority class rather than treating unrelated host numbers as equivalent.
The focused CPU budget now has ceiling 0 and issues slices at priority 0. A
shared `ScheduledDeadlineVmBackend` passes that already-authorized value without
another policy decision. WHP captures the current thread priority, applies and
verifies `THREAD_PRIORITY_NORMAL`, then restores and verifies the prior value.
KVM requires the runner to begin in `SCHED_OTHER` at scheduler priority 0,
applies and verifies that same state, then restores and verifies the complete
prior policy/parameter pair. Priority 1 fails before guest entry in focused live
tests; priority 0 still expires the infinite-loop guest and both tests compare
the post-run native state with the captured state. Stronger/different classes,
nice values, real-time policies, admission mapping, and general scheduler
integration remain planned.

### Hosted Zstd lifecycle regression

The direct Zstd lifecycle exists only for hosted regressions and does not
compile into the freestanding OS. The signed WHP/KVM microVM probe is separate. A
`ZstdNativeServiceBackend` requires a nonzero reply object and creates the
provider as a distinct-address-space `TaskRuntime` task through the existing
`ServiceSupervisor`, then returns an immutable endpoint
carrying its service, task, domain, interface, provider generation, and policy
generation. Only after isolation admission commits that endpoint does a
separate operation issue the provider's exact reply capability and project the
route into the unchanged request/reply data plane. The projection preserves all
admitted route fields and cannot select a provider or placement.

That separation now uses the same artifact-bound kernel transaction as the
focused microVM path. The control plane revalidates both authenticated
`ServiceImage` digests plus the exact interface fingerprint and generations
before invoking the selected backend. A mismatch invokes no backend and leaves
the complete route available for cancellation. After commit, the native
adapter projects only the exact reply capability into direct `TaskRuntime` IPC:
control planes establish authority; data planes should take the shortest safe
path. Data-plane bytes cannot repeat resolution, change placement, or widen the
route's authority.

Kernel isolation admission now has two independent generation gates. Its table
is created for one nonzero active `SystemGeneration` and one nonzero policy
generation; every request, prepared route, running record, unavailable record,
and committed service route retains both. A stale system generation and stale
policy generation fail with distinct typed errors before backend invocation.
The supervised Zstd endpoint and data-plane adapter recheck and retain the
system generation as well as the exact provider and policy generations. The
focused WHP and KVM runners stage transient local generation 1 through the
bounded capability-authorized `DeploymentService` two-phase activation path,
then create kernel admission from its immutable `ActivatedSystemGeneration`.
This does not prove authenticated persistent generation storage or recovery.
The kernel can now decode a canonical 344-byte component-service launch
handoff emitted from the build tool's resolved launch model. It validates the
complete record before reserving admission, or binds the identical decoded
record to an already CPU/RAM-reserved route without rebuilding that route.
Route domain, interface, provider, system/policy generations, placement, class,
the complete canonical `SystemGeneration` SHA3-512 digest, independent canonical
`MRMLIC1` interface-catalog SHA3-512 digest, fingerprint, and both artifact
digests must remain exact. A reused generation number with different generation
or catalog bytes fails before backend construction. The focused WHP/KVM runners
now use shared allocation-free `MRMLSG2` and `MRMLIC1` decoders and activated
resolver before this codec: both complete canonical records must match the
recovered `ActivatedSystemGeneration`, both packages must occur in that
generation, and exactly one catalog requirement/provider pair must match the
capability-selected interface object, ABI generation, fingerprint, and selected
microVM form. The resolver derives both
artifact digests and the immutable provider generation; the runners no longer
assemble those fields directly. They apply the resulting shared handoff before
attaching either verified image. The deployment service's
focused Windows/Linux test also binds activation publication to one exact stable
COW file-generation receipt and recovers only through the selected file
generation and verified extent. An independent authenticated-state-store
contract now pins the monotonic epoch, activation sequence, exact stable object
and file generation, generation/catalog/source identity, and checkpoint digest; an
older valid file is rejected when that state names a successor. This is hosted
codec and storage/monotonic-store simulation plus backend-parity evidence, not
a concrete TPM/NVRAM backend, physical durability, or physical isolation.
Complete catalog derivation from all Manifest V2 records and persistent
hardware-backed catalog delivery remain planned.

The focused test sends the generated 104-byte request and one attenuated shared-
buffer capability from the caller to the launched provider task, executes the
existing private-scratch service loop, verifies the exact reply and output, and
then retires the task. Address-space erasure must consume the supervisor's exact
cleanup ticket before the endpoint is forgotten. Erasure uncertainty retains
the endpoint and ticket for an exact retry. A strict Total-mode test proves the
native placement request is rejected by admission before any supervisor launch,
with zero native fallback.

Fresh current-source artifacts now executed through this signed-release path.
Both optimized runners independently verified the same kernel, ZIM consumer,
Zstd provider, and roots and emitted byte-identical 201-byte `MRMLSG2` and
207-byte `MRMLIC1` records. `mrml release system-create` consumed one fresh
development-only Lamport key and produced one 99,064-byte `.mrs`; explicit-root
verification passed and the private key no longer existed. Nested KVM consumed
that release, reported `eligible=1`, `microvm=1`, `native_fallback=0`, and reached
the expected halt (`verify=25663us`, `prepare=6690us`, `execute=1231us`,
`total=126826us`). WHP consumed the identical release and completed the exact-
generation ZIM/Zstd data path and lifecycle cleanup (`verify=20027us`,
`prepare=4869us`, `execute=3314us`, `total=51694us`). An initial retained-
artifact attempt was correctly excluded: KVM reported the obsolete guest stage
as `Halted`, while WHP produced no terminal record and was terminated. This is
hosted controlled-probe evidence, not manifest-driven workspace/Store delivery,
host resistance, bare metal, physical isolation, or complete required-system
Total readiness.

The canonical boot handoff now carries an optional ordinary application launch
as a distinct 160-byte typed descriptor and flag after any service descriptor.
Both share only the reviewed bounded PE user-layout validation: their artifact,
image, stack, and page-table backing must each be contained in reserved/kernel
memory and all service/application backing ranges must be mutually disjoint.
Length, flag, offset, trailing-byte, measurement, version, address, and overlap
errors fail before region publication. Windows and Arch Linux kernel suites
pass 530 tests, and the enlarged fixed handoff buffer cross-builds through the
UEFI bootloader on both hosts. The focused runners now populate the descriptor,
attach the exact separately signed `ApplicationImage`, and give the signed
kernel supervisor-only NX access to its immutable artifact and fresh page-table
arenas. The active kernel page-table arena is likewise supervisor-only RW/NX so
the kernel can clone its current upper-half mappings without an unmapped-CR3
fault; low supervisor mappings are not copied into the application root.

The x86-64 kernel mapping layer now has a separate
`ApplicationAddressSpace`. It accepts only a matching authenticated
`ApplicationImage` handoff identity, then reuses the existing final W^X PE,
lower guard, user stack, supervisor-only kernel-clone, and preallocated page-
table mechanism. A service artifact cannot satisfy the application check. The
Windows kernel suite passes 531 tests. Fresh identical application, kernel, and
package bytes then completed six ordered signed-kernel stages, private CR3/CPL3
entry, the pointer-free exit syscall, task retirement, Total-mode ownership, and
guest teardown under nested KVM (`verify=21678us`, `prepare=3017us`,
`execute=1237us`, `total=102106us`) and WHP (`verify=17477us`, `prepare=3885us`,
`execute=3746us`, `total=47237us`). Both backends rejected the same substituted
application public root before VM execution with `application signature or PE
policy rejected`; no native application path was invoked. WHP backend tests pass
24 with one manual performance test ignored and its runner passes 8; KVM passes
21 with one manual performance test ignored and its runner passes 9. This is
hosted controlled application evidence, not general application loading, GUI or
Semantic Scene Graph integration, required-system Total readiness, host
resistance, bare metal, physical isolation, or recovery evidence.

The application runners now also consume the kernel's linear quantitative and
capability projection plan around that real guest lifecycle. Route identity,
exact guest pages, one same-domain vCPU, and interface-transport authority are
admitted before WHP/KVM construction. Successful construction and application
attachment consume the plan into an immutable active data-plane state; guest
destruction precedes descriptor revocation and exact RAM/vCPU release. The
first fresh WHP attempt failed closed before VM construction because the new
CPU table used namespace `0x7a51`, outside the kernel's admitted `1..=0x3fff`
range. Both runners now use explicit namespace `0x3a51` and test its admission.
With that correction, the same freshly signed kernel package (SHA-256
`f6dc65b4bf20a9d7598009cc225bd2fc22c0dca26ff3368d4d60216267c39207`)
and application bundle (SHA-256
`21099faef2ecf2704a46922af01f8f3d9dee13b8c5a3c43e98b904f04e242336`)
completed the CPL3 Total-mode application and teardown on WHP
(`verify=17928us`, `prepare=3860us`, `execute=4319us`, `total=48267us`)
and nested KVM (`verify=21283us`, `prepare=2423us`, `execute=1246us`,
`total=102019us`). WHP passes 9 runner tests and KVM passes 10; both kernel
suites pass 545 tests. This is controlled hosted evidence only. It does not
prove host resistance, device-specific projection/revocation, physical
hardware, or complete Total readiness.

Patent review: `NOT_TRIGGERED` for the runner consumption and namespace fix.
They apply the already reviewed linear projection, capability, quantitative
resource, and backend lifecycle mechanisms without a new algorithm or wire
format. The broader adaptive-isolation, VMM, and device-projection reviews
remain `TRIGGERED` in [patents/REVIEW_LOG.md](patents/REVIEW_LOG.md).

Exact commands and outcomes:

```text
target/debug/mrml.exe test org.mrml.zstd --target windows --release
26 passed; 0 failed

target/debug/mrml.exe test org.mrml.system.kernel --target windows --release
508 passed; 0 failed

./target/debug/mrml test org.mrml.zstd --target linux --release
26 passed; 0 failed (Arch Linux under WSL)

./target/debug/mrml test org.mrml.system.kernel --target linux --release
508 passed; 0 failed (Arch Linux under WSL)

target/debug/mrml.exe test org.mrml.library.package-format
9 passed; 0 failed

./target/debug/mrml test org.mrml.library.package-format
9 passed; 0 failed (Arch Linux under WSL)

target/debug/mrml.exe test org.mrml.service.deployment
3 passed; 0 failed

./target/debug/mrml test org.mrml.service.deployment
3 passed; 0 failed (Arch Linux under WSL)

target/debug/mrml.exe test org.mrml.system.kernel
509 passed; 0 failed

./target/debug/mrml test org.mrml.system.kernel
509 passed; 0 failed (Arch Linux under WSL)

target/debug/mrml.exe test org.mrml.tool.vmm-whp-run
7 passed; 0 failed

./target/debug/mrml test org.mrml.tool.vmm-kvm-run
8 passed; 0 failed (Arch Linux under WSL; pre-existing CUDA PTX warnings)
```

Patent review: `NOT_TRIGGERED` after the existing exact typed provider-
resolution review — the runtime uses the same bounded exact-match-only scan and
adds canonical active-generation equality plus existing handoff construction.
The broader component/interface and Zstd reviews remain `TRIGGERED`; see
[patents/REVIEW_LOG.md](patents/REVIEW_LOG.md).

## Milestones

This historical list is retained for continuity. The current dependency-ordered
plan and status vocabulary are authoritative in [ROADMAP.md](ROADMAP.md).

1. Capability model, explicit directory grants, IPC wire format, and property
   tests. The fixed-size policy model and stable, versioned cross-VM control
   encoding are implemented. A fixed-capacity generational host-resource table
   binds an opaque nonzero host handle to one capability object and one or more
   live VM mappings. Initial binding rejects reuse of an existing host handle;
   only the explicit share operation can add another endpoint. Sharing requires
   exact `CONTROL` authority for the source object, independent destination
   `MAP` plus read/write authority, exact equality of the host physical extent,
   a live distinct VM mapping, NX native permissions, and access that preserves
   or reduces the source endpoint. Every resolution repeats object, `MAP`,
   read/write attenuation, VM identity, mapping identity, mapping-liveness,
   extent, and native-permission checks. Per-endpoint revocation requires exact
   `CONTROL` authority and reports whether the last endpoint was removed, so a
   caller cannot destroy the opaque resource while peers remain. Stale
   generations cannot resolve a replacement and the host token never enters
   guest memory. Windows gnullvm unit tests cover read/write attenuation,
   mismatched extents, executable or insufficient native permissions, stale
   bindings, and final-reference accounting. Native KVM/WHP mapping revocation
   is integrated with fail-closed execution poisoning; live backend evidence
   and opaque shared-handle adapter integration remain pending.
2. Original x86_64 UEFI loader, physical allocator, page tables, exceptions,
   timer, scheduler, and serial diagnostics under emulation.
3. User address spaces and synchronous IPC; isolated storage, network, tool,
   and inference services.
4. KVM VMM, then Hyper-V VMM, with identical measured launch manifests.
5. Shared-memory inference data plane and benchmark harness.
6. IOMMU-contained CUDA device VM, reset/recovery tests, and CPU fallback.
7. Bare-metal hardware matrix, formal specifications/proofs, external audit,
   then AArch64 and RISC-V64 ports.
A reusable exact verifier is now **PARTIALLY IMPLEMENTED** for the conservative
case where a native driver reconstructs the same opaque route and generations:
all identity scalars must match, and an already-native source cannot substitute
its transport. The verifier remains non-authorizing and runs only inside the
atomic registration control plane. Once a principal-bound session establishes
authority, the existing block data plane takes the shortest safe path without
re-running correlation policy. Storage passes 127 tests on Windows and Arch
Linux. Actual native enumeration remains **PLANNED**.

The firmware side and future native-driver side now have one **PARTIALLY
IMPLEMENTED** stable route digest contract. The storage interface owns the
bounded `canonical_uefi_block_stable_id` operation. That shared operation now
performs the structural single-instance device-path validation before hashing,
and UEFI consumes it. The result is identity data only;
it cannot open, map, register, or authorize a device. Storage passes 128 tests
and UEFI 37 tests on Windows and Arch Linux, with UEFI cross-builds on both.
Native reconstruction of those canonical bytes remains **PLANNED**.

The design now avoids native reconstruction of UEFI bytes. A **PARTIALLY
IMPLEMENTED** bounded extractor converts the supported ACPI/PCI/SATA/optional
partition path into typed route fields during the firmware-side phase, retains
the exact full-path stable digest, and offers equality against independently
enumerated native fields. Unknown ordering, excess PCI depth, invalid BDF,
reserved SATA port, inconsistent partition identity, and trailing nodes fail
closed. Storage passes 129 tests on Windows and Arch Linux. Canonical
`BootHandoff` carriage is described below; consuming real native enumeration
remains **PLANNED**.

The next boundary prerequisite is now **PARTIALLY IMPLEMENTED** as a
kernel-owned canonical 128-byte route record. It preserves the bounded typed
ACPI/PCI/SATA/optional-partition fields and exact stable ID, rejects malformed
or nonzero reserved state, and carries no firmware handle, local pointer, or
capability. UEFI produces that record only after rechecking the stable ID
against the recovered descriptor. Kernel passes 563 tests and UEFI 37 tests on
Windows and Arch Linux, with UEFI cross-builds on both. Canonical handoff
publication is described below; authorizing a matched native device remains
**PLANNED**.

Canonical handoff transport for that record is now **PARTIALLY IMPLEMENTED**.
One distinct flag places the fixed typed route after the installed identity and
before SMP/MADT bytes. Decode requires an adjacent UEFI installed identity and
exact stable-ID equality, so route-only input, substitution, malformed length,
or noncanonical route bytes fail before emitting any memory region. The real
loader carries the record it extracted before `ExitBootServices`. Kernel passes
563 tests and UEFI 37 tests on Windows and Arch Linux, UEFI cross-builds on both,
and WHP/KVM runners pass 11/12. This is codec, compile, and hosted parser parity,
not native enumeration, device authorization, OVMF, or physical evidence.

A transport-neutral **PARTIALLY IMPLEMENTED** native SATA verifier now consumes
the handed record without reconstructing firmware bytes. Its authority-free
native descriptor has bounded ACPI/PCI/SATA/optional-partition fields and no
stable ID. Before atomic registration, the trusted verifier exact-matches every
route/media field plus the boot stable ID, AHCI transport, controller/media
generations, and geometry. Storage passes 130 tests on Windows and Arch Linux.
No AHCI register discovery, DMA, interrupt, queue, block I/O, OVMF, or physical
hardware was implemented or exercised.

The next native-storage authority boundary is now **PARTIALLY IMPLEMENTED** as
a typed ABAR request and a concrete preactivation-only page-table adapter. The
request requires a live `MAP | READ | WRITE` capability for the exact device
object, nonzero configuration and mapping generations, and an aligned
non-wrapping lower-half virtual range. `KernelAhciAbarPreactivationOwner`
requires the exact live mapping and control capabilities plus a structurally
valid descriptor whose PCI location/vendor/device identity, configuration
generation, and ABAR geometry match canonical launch record V2, then accepts
only the launch-bound prepared task whose
generation remains construction-pending in the exact borrowed `TaskRuntime`,
whose saved CR3 root matches the exclusively owned inactive hierarchy, and whose
service-domain target matches that backend. Its immutable runtime borrow
prevents safe activation or context mutation while that narrower owner exists.
A separate non-copy `KernelAhciPreactivationMappingSetOwner` retains the same
runtime-bound task identity without borrowing the runtime and composes that
private backend
with the exact kernel memory-resource adapter and installs/verifies the
`USER_MMIO_READ_WRITE` ABAR plus all four launch-named ordinary user RW/NX
CPU mappings in the same inactive hierarchy, retaining reverse-removal progress
and resource records. Wrong runtime, root, target, ABAR generation/geometry,
descriptor identity, resource identity, or capability fails before publication. Mutation-before-error
rollback uncertainty retains the owner and poisons the hierarchy. The Linux
AHCI suite passes 146 tests and the Linux kernel suite passes 713. A retained
mapping-set owner can now consume mutable access to its exact runtime and apply
a one-way quarantine to the exact blocked construction generation. Wrong-runtime
substitution returns the unchanged owner, and the quarantined generation cannot
pass native-service activation validation.
Native-service validation and scheduler activation preparation also scan the
bounded live runtime domains and reject any second generation with the same
saved page-table root. The mapping-set verifier inherits that rejection. This
proves only a runtime-local snapshot immediately before activation; a later
active-root owner must retain exclusivity against subsequent context changes.

This is controlled Linux-host, in-memory page-table evidence only. The unsafe
caller must keep PAT index 3 UC on every CPU that may later execute the task,
exclude cacheable aliases for the complete installed lifetime, and establish
exclusive root ownership. Canonical launch record V2 retains the descriptor's
PCI location/vendor/device identity alongside the capability-bound device
object and both concrete owners exact-match it before mutation. The trusted
launcher remains responsible for establishing that initial correlation; record
data binds but does not authorize it. The bounded runtime scan
does not retain uniqueness beyond validation. These owners deliberately do not implement the public
generic mapping traits or create `MappedAhciNativeServiceTask`. Dropping them is
not an activation seal: no later owner yet consumes and revalidates the exact
root and effective leaves. Permanent construction quarantine excludes a
poisoned exact task generation but does not prove a hierarchy safe to activate.
There is no active-root lifetime/removal owner, local or SMP TLB withdrawal,
IOMMU binding, installed CPL3/INT80 entry, live KVM/WHP run, volatile AHCI
register access, or physical-device evidence. The mapping record itself remains
data, not task/root authority.

Patent review: `NOT_TRIGGERED` — exact task/root/target binding and
transactional installation/removal of conventional x86-64 user-device PTEs are
standard memory-management composition and add no storage algorithm or
interoperability protocol. See [the patent review log](patents/REVIEW_LOG.md).

Configuration now **PARTIALLY IMPLEMENTS** one transactional bridge from that
typed verifier to the existing installed recovery owner. Correlation,
registration, read-session reacquisition, block-zero validation, and selected-
root binding occur through one bounded call. Correlation failure publishes no
device/session and performs zero block reads; later validation failure revokes
the session and removes the new registration. Configuration passes 50 tests on
Windows and Arch Linux, with WHP/KVM regression runners at 11/12. Those runners
exercise shared configuration compatibility only, not native SATA execution.

A recovery-only encoder and decoded-handoff configuration entry point now
**PARTIALLY IMPLEMENT** the next ownership boundary. The identity and typed SATA
route must be adjacent fields of the same validated handoff; absence fails before
registration, session issuance, or block I/O, and callers cannot inject detached
boot data. Kernel passes 563 tests and configuration 51 tests on Windows and Arch
Linux. This remains canonical codec and controlled service evidence, not native
enumeration, installed Total execution, OVMF, or physical hardware.

The same control-plane chain now reaches the existing strict Total owner without
creating a parallel admission path. Recovered configuration revalidates the
installed selection's exact platform generations, geometry, volume, and root
against one decoded handoff before allowing authenticated release construction;
UEFI-installed recovery also requires its adjacent SATA route. The returned
`RecoveredInstalledTotalAdmission` owns both the live selection and the sole
release-derived admission table through final proof. Missing installed state
prevents the release builder from running. Configuration passes 51 tests on
Windows and Arch Linux; WHP/KVM pass 11/12 as hosted regression only.

Installed Total admission now has a **PARTIALLY IMPLEMENTED** one-way runtime
seal. Once every required release-classified domain has committed, consuming
`authorize_runtime` retains the installed device selection, recovered policy,
authenticated release, immutable completed admission view, and final proof in
one `RecoveredInstalledTotalRuntime`. Callers cannot prepare another route or
mutate admission through that owner. Incomplete classification yields no runtime
owner. The WHP and KVM component launch implementations keep this owner alive
through guest execution. The SMP launch handoff now also retains the exact
installed source identity beside recovered policy and the one-boot Total
override; absence of an accepted volume cannot produce the handoff. The hosted
component profiles reserve the existing 64-page SMP page-table arena, and both
VMM builders avoid remapping pages already covered by that supervisor-only
RW/NX arena. Configuration passes 51 tests on both hosts, kernel passes 563,
WHP passes 24 backend tests with one manual test ignored plus 12 runner tests,
and KVM passes 21 backend tests with one manual test ignored plus 13 runner
tests. A fresh one-use-signed SystemRelease with distinct ZIM/Zstd artifacts
completed the two-vCPU component data path on WHP and nested KVM on 2026-08-26;
both reported `eligible=1`, `microvm=1`, and `native_fallback=0`. This is hosted
controlled evidence, not native installed-media, host-resistant, or physical
hardware evidence.

The first kernel entry now **PARTIALLY IMPLEMENTS** the matching handoff
boundary. Immediately after canonical decode and region collection, every
kernel profile constructs `EarlyKernelContext` from that same `BootHandoff`; it
retains only the authority-free one-boot isolation request and exposes no
placement, capability, or fallback authority. Thus a component/SMP profile
cannot replace the loader request with detached scalars before later
configuration and release admission. Kernel suites pass 564 tests on Windows
and Arch Linux, and the standard plus WHP/KVM component-SMP UEFI images
cross-build on both hosts. This is decode/compile evidence, not persistent
configuration recovery, admitted-system proof, native installed-media, or
physical execution.

The native storage service now **PARTIALLY IMPLEMENTS IN SOURCE** the next AHCI
DMA ownership boundary. `prepare_ahci_port_dma` accepts only the exact
generation-bound quiescent SATA snapshot and explicit controller plus memory
capabilities. Command-list, received-FIS, and command-table runs retain separate
object/allocation identities, exact derived extents, checked alignment and
ends, and a fresh DMA generation; aliasing or overlap fails before the backend.
The backend contract publishes only a complete pinned, zero-verified mapping and
must leave no mapping on failure. A non-copyable installed owner now enforces
exact lifecycle teardown: confirmed removal consumes it, while uncertain
device/IOMMU invalidation returns it for retry and cannot masquerade as cleanup.
Storage passes 163 tests on Windows and Arch Linux. This is safe policy and
hostile host-model evidence, not an implemented IOMMU backend, AHCI register
programming, command execution, interrupt delivery, NCQ, OVMF, installed
recovery, or physical hardware evidence.

The storage driver now **PARTIALLY IMPLEMENTS IN SOURCE** exact AHCI port DMA-
base programming. The transaction consumes the installed DMA owner, rechecks
the mapping generations and quiescent port state, writes both halves of the
command-list and received-FIS addresses, and requires exact read-back without
enabling interrupts or engines. Pre-write failure returns the untouched owner;
post-write uncertainty is permanently distinguished as quarantined and cannot
flow into normal DMA revocation. Storage passes 166 tests on Windows and Arch
Linux. This is host-register-model evidence only, not IOMMU hardware, commands,
interrupts, OVMF, installed recovery, or physical execution evidence.

AHCI command memory is now **PARTIALLY IMPLEMENTED IN SOURCE** through an exact
bounded typestate transition. Every word of the command-list, received-FIS, and
advertised command-table regions must still be zero before mutation. Each
advertised header then receives its own checked 64-bit table base and every
written value is read-verified. Pre-write failure preserves the programmed
owner; post-write uncertainty quarantines it. Storage passes 169 tests on
Windows and Arch Linux.
No engine, PRDT/data buffer, ATA/ATAPI command, interrupt, NCQ, IOMMU hardware,
OVMF, installed recovery, or physical hardware was exercised.

AHCI port-engine activation is now **PARTIALLY IMPLEMENTED IN SOURCE**. The
linear transition exact-matches the retained ABAR/DMA generations, accepts only
an idle task file with interrupts and command state clear, starts FIS receive
before command processing, and read-verifies both writes. Pre-write failure
preserves the initialized owner; post-write uncertainty quarantines the layout.
Storage passes 172 tests on Windows and Arch Linux. No command issue, PRDT/data transfer,
interrupt, stop/removal, IOMMU hardware, OVMF, or physical hardware was
exercised.

AHCI engine stop is now **PARTIALLY IMPLEMENTED IN SOURCE**. Command processing
is disabled and boundedly quiesced before FIS receive is disabled and boundedly
quiesced. Writes are read-verified; timeout or uncertainty quarantines the DMA
layout. Storage passes 174 tests on Windows and Arch Linux. This is host register-model evidence,
not command, transfer, interrupt, IOMMU, OVMF, or physical-device evidence.

The extracted AHCI provider now **PARTIALLY IMPLEMENTS** capability-authorized
non-NCQ DMA EXT command construction. It exact-checks an idle slot, 48-bit LBA,
sector/byte relation, data-buffer direction rights and non-overlap, then writes
and verifies the fixed FIS, header, and one contiguous PRDT entry. Partial writes
quarantine the active DMA owner. AHCI passes 50 tests on Windows and Arch Linux.
Bounded polling execution now publishes exactly that slot through `PxCI`, rejects
unrelated issued state, checks task-file/SATA errors and exact transferred bytes,
and restores active ownership only after verified completion. Every post-issue
uncertainty quarantines the port and data extents. AHCI passes 58 tests on
Windows and Arch Linux. No interrupt delivery, IOMMU hardware, OVMF, installed
recovery, or physical device was exercised.

Stopped AHCI DMA reclamation is now **PARTIALLY IMPLEMENTED IN SOURCE**. The
kernel-facing service restores the backend-revocable owner only after exact
generation/quiescence checks, verified clearing of all port DMA bases, and
verified sanitization of each exact retained extent. All uncertainty remains a
quarantine. Storage passes 177 tests on Windows and Arch Linux; no native IOMMU or device was used.

The extracted AHCI provider's raw userspace adapter now **PARTIALLY IMPLEMENTS
IN SOURCE** enumeration, read/write, flush, and reset. It maps only the fixed
buffered IPC, shared-buffer, and capability-release syscall numbers; launch
state fixes the reply endpoint and task. Data requests retain exactly one
transferred capability through copy and release-before-reply, while control
requests accept none. Returned payload/capability counts are bounded by the
actual supplied buffers before any typed envelope is returned. AHCI passes 75
focused tests on Linux. This is syscall-
frame and hostile-model evidence, not installed service execution, supervisor
launch, or hardware evidence.

### Exact configuration authorization across placements

The configuration service now **IMPLEMENTS** the same exact-rights check in its
hosted `CapabilitySpace` adapter and service-image syscall adapter. A read,
write, or control operation accepts only the corresponding single-right handle;
an otherwise sufficient combined-right handle fails with `PermissionDenied`.
Hosted recovery and policy fixtures retain distinct operation-scoped handles,
so native-process simulation cannot silently exercise broader authority than
the service-image boundary. This is source and focused hosted-test evidence,
not installed-service, KVM, WHP, or physical-hardware execution evidence.

Patent review: `NOT_TRIGGERED` — exact bitset equality and operation-scoped
capability handles are conventional authorization tightening and introduce no
new algorithm, protocol, or compatibility mechanism. See
`docs/patents/REVIEW_LOG.md`.

Native component construction now **PARTIALLY IMPLEMENTS IN SOURCE** a
direction-scoped dependency read-transfer attachment. The source must hold two
distinct delegable capabilities for one exact generational shared object: local
`MAP|READ` authority and provider-bound `MAP|WRITE` authority. Construction
atomically attenuates the former while preserving only the latter's delegation
right, requires the exact generational provider task to remain live and distinct
from both construction domains, installs that receiver identity with both fresh
target-space handles and the exact shared generation/byte bound, and revokes
every projected descendant on entry failure. The Linux-host kernel suite passes
643 tests. This proves source, unit, and simulated capability-lifecycle behavior
only; it does not prove an installed FAT32 data plane, KVM, WHP, IOMMU, or
physical-device execution.

Patent review: `NOT_TRIGGERED` — separate read and delegated-write capability
handles are conventional least-authority shared-memory mediation and introduce
no new algorithm, protocol, or compatibility mechanism. See
`docs/patents/REVIEW_LOG.md`.

The FAT32 service library now **PARTIALLY IMPLEMENTS IN SOURCE** the matching
block-read syscall client. It sends one canonical bounded request through the
exact block endpoint to the launch-bound generational provider task, transfers
only an attenuated `MAP|WRITE` handle, accepts an exact capability-free response,
and copies only the completed borrowed range through its separate local
`MAP|READ` handle. Provider errors and malformed completions publish no shared
bytes. The installed MRML-native entry now consumes all of those launch fields
and runs the existing unified probe/mount/unmount/lookup/open/read dispatcher
over fixed 4 KiB block, cluster, staging, and client-transfer scratch bounds;
larger logical blocks or incompatible filesystem working sets fail closed. The
Linux-host FAT32 suite passes 101 tests, and both the FAT32 service and aggregate
service image pass release `MRML_NATIVE` builds. This is syscall-frame,
hostile-model, and ABI compilation evidence only; no installed invocation, KVM,
WHP, IOMMU, or physical storage device was exercised.

Patent review: `NOT_TRIGGERED` — this is conventional bounded IPC plus
direction-scoped shared-buffer transfer over the existing block protocol. See
`docs/patents/REVIEW_LOG.md`.

The storage launch coordinator now **PARTIALLY IMPLEMENTS IN SOURCE** the same
construction contract. A filesystem provider launch requires exact delegable
block-endpoint authority plus the separately validated local-read/provider-write
attachment for one shared object; its byte extent must cover the associated
logical block before the backend is called. The backend contract must project
all handles into one fresh domain and erase every partial result on failure.
Native filesystem construction now accepts only a scheduler-blocked construction
target, retains the exact filesystem provider object in the linear launch
receipt, and publishes that task through the service supervisor's atomic
register-and-activate transition. Supervisor-capacity failure returns the same
unpublished receipt for explicit retry; it cannot leave a runnable,
unsupervised provider. The active receipt now also composes with exact
supervisor retirement, fault handling, and protocol-violation handling: a
wrong-current attempt returns the live owner, while every successful stop
retains its scheduler termination across capability revocation, local mapping
withdrawal, backing scrub/release, memory-object release, and address-space
erasure. Faults retain the exact trap disposition and protocol violations retain
the exact typed violation alongside the launch receipt through the same resource
teardown. Both paths exercise an injected mapping-revocation failure that returns
the progressed owner for retry. Voluntary retirement, fault, and
protocol-violation resource release preserve the complete association receipt
alongside the respective supervisor owner through address-space cleanup and
successor dispatch. All three paths exercise an injected erasure failure that
returns the combined owner unchanged for retry; a wrong-runtime dispatch failure
likewise returns the cleaned association owner. An installed restart coordinator
therefore need not reconstruct association identity from names or task IDs. Only
complete resource and supervisor cleanup exposes successor dispatch. The
retirement, fault, and protocol-violation dispatch results can each split into the
one-use runtime dispatch and a separate typed stopped-generation restart owner
retaining the exact service generation, task, association receipt, and stop cause.
Fault cleanup preserves the exact user-fault disposition and violation cleanup
preserves the typed protocol violation; neither token reconstructs the other.
After that dispatch is consumed, the storage restart
join accepts only a fresh active launch
receipt with the same provider object, association generation, filesystem and
block provider generations, and system generation. It then invokes the kernel's
constructed restart transaction; any association or kernel rejection returns both
linear owners unchanged. The Linux-host storage suite passes 167 tests, including
every association-field substitution and an integrated restart simulation. That
test blocks the peer tasks, completes old-generation resource and supervisor
cleanup, consumes the resulting idle dispatch, constructs a second memory root,
physical backing, inactive page table, copy-task binding, task, and native launch
receipt, then atomically advances the supervised service generation and schedules
the replacement while retaining exactly one live backing object. It does not
execute the replacement provider entry or IPC loop. The kernel suite passes 718.
The
storage service passes
a release `MRML_NATIVE` build. Installed boot composition, hosted execution, and
physical-device execution remain unverified.

Patent review: `NOT_TRIGGERED` — this is conventional preflight validation,
least-authority construction plumbing, atomic supervisor publication, and
ordered teardown for the existing service launch path. See
`docs/patents/REVIEW_LOG.md`.

Kernel task construction now **PARTIALLY IMPLEMENTS IN SOURCE** tracked
same-domain attenuation for launch resources. One delegable memory root can be
split atomically into narrow local source handles without bypassing the runtime
delegation graph; later cross-domain projections remain descendants of that
root, so root revocation removes the local split and every target-space leaf.
The complete request and capability/delegation capacity are preflighted before
any handle is published. The Linux-host kernel suite passes 645 tests. This is
unit/simulation evidence only and does not allocate, map, or execute an
installed service shared page.

Patent review: `NOT_TRIGGERED` — tracked local capability attenuation and
transitive revocation are conventional capability-lifecycle mechanisms. See
`docs/patents/REVIEW_LOG.md`.

The isolation layer now **PARTIALLY IMPLEMENTS IN SOURCE** preparation of a
read-transfer attachment directly from one exact
`MAP|READ|WRITE|CONTROL|DELEGATE` shared-memory root. It requires a distinct live
provider task, validates the object generation and one-page byte bound before
splitting authority, and returns only the tracked local-read and provider-write
handles. Root revocation invalidates both. The Linux-host kernel suite passes
646 tests. Physical backing, mapping installation, and installed launch remain
separate unfinished gates.

Patent review: `NOT_TRIGGERED` — this is conventional exact-rights validation,
attenuation, and rollback composition over the existing capability mechanism.
See `docs/patents/REVIEW_LOG.md`.

Root-based read-transfer preparation now composes with native task construction
as one rollback-complete authority transaction. If entry validation or target
projection fails, the target leaves no capabilities or register payload and the
new source split is revoked, while the exact controlling memory root remains
live for explicit backing/mapping cleanup or retry. The Linux-host kernel suite
passes 647 tests. This still does not claim a physical mapping backend or
installed invocation.

Patent review: `NOT_TRIGGERED` — this only composes existing capability
attenuation, target construction, and transitive rollback paths. See
`docs/patents/REVIEW_LOG.md`.

Native device-service construction now **PARTIALLY IMPLEMENTS IN SOURCE** a
fixed-capacity multi-authority attachment without widening the component
dependency attachment. One read-only launch record and one to six exact
delegable source handles enter the existing atomic construction projector; the
fresh task receives only requested non-delegable rights, placed in the six
remaining native-entry registers beside the established service identity and
launch-data fields. The attachment rejects wrong objects, overbroad source
handles, duplicates, empty or delegated target rights, and counts outside the
architectural register budget. A non-pristine context or later entry failure
revokes every projected leaf and preserves the original context. Source-root
revocation remains independently transitive for every successful projection.
The Linux-host kernel suite passes 685 tests. Device-specific launch record
encoding, role binding, mapping/backing construction, teardown, and installed
execution remain separate gates.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — this is fixed-capacity use of the existing
capability attenuation, construction projection, register ABI, and transitive
revocation mechanisms. See `docs/patents/REVIEW_LOG.md`.

Native device-service tasks now expose a typed voluntary-retirement operation
**IMPLEMENTED IN SOURCE** for callers that have already completed their
device-specific quiescence protocol. Each prepared task retains its original
page-table root. Retirement requires the exact current generational task and
rechecks that root before removing its complete task-local revocation domain;
wrong-current and substituted-root attempts preserve the live task unchanged.
Success returns the scheduler termination and retired context for privileged
successor dispatch and later resource cleanup. The Linux-host kernel suite
passes 686 tests and the release build passes. No device-specific cleanup runs
in the kernel, and binding a concrete device-quiescence proof to retirement,
successor dispatch, active page-table withdrawal, and installed execution
remain unfinished.

Complexity impact: LOW
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — exact current-task/root validation followed by
ordinary task-domain retirement is conventional lifecycle enforcement. See
`docs/patents/REVIEW_LOG.md`.

Freeze-first AHCI stop handling is **PARTIALLY IMPLEMENTED IN SOURCE** through
one consuming manager/library boundary. A one-shot teardown lease carries the
exact `NativeDeviceServiceTask`—including its opaque runtime identity—and bound
launch beside the non-copy active-service owner. `begin_active_ahci_service_exit`
exact-matches both before asking the supervisor to freeze the current task.
Thus an operation-3 value, service/task token, launch bytes, or lease identity
accessor remains non-authorizing, and denial returns both untouched owners
without invoking controller reacquisition.

After a successful freeze the runtime has no current or selected successor,
while the supervisor deliberately remains `Running` until trusted quiescence
can retire the task. Only then may the unsafe one-shot lease hook transfer the
sole register, active-port, command-memory, and data-buffer teardown owners.
Clean reacquisition failure returns that same lease with the frozen lifecycle
for retry. Post-acquisition mapping/port/data substitution instead becomes an
inseparable quarantine: the task stays frozen, the supervisor stays `Running`,
and neither quiescence nor dispatch can proceed from the substituted state.

Successful quiescence stops or fails closed outstanding work, sanitizes data,
withdraws DMA, and destroys all borrowed register, command-memory, and
data-buffer views while their CPU mappings remain live. The resulting lifecycle
token contains no borrowed backend value, so task retirement and later CPU/ABAR
unmapping cannot invalidate a retained Rust reference. Dispatch remains withheld
through the existing exact supervisor cleanup.

The Linux AHCI suite passes all 138 tests. Focused coverage includes equal task
tokens from distinct runtimes, current-task and supervisor denial before lease
invocation, retry after clean lease failure, acquired-state quarantine,
frozen-runtime mutation denial, quiescence retry, and complete delayed cleanup.
This is controlled unit evidence for the generic boundary only. No production
controller-manager lease, installed operation-3 route, CPL3/`INT 0x80`, active
page-table/TLB/IOMMU operation, KVM/WHP run, or physical AHCI execution exists
in this increment.

Complexity impact: MEDIUM
TCB impact: LOW
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — binding an existing manager owner to an
existing runtime/supervisor freeze, retrying or quarantining the linear transfer,
and dropping borrowed views before existing retirement/unmapping are
conventional fail-closed lifecycle composition. The existing triggered review
for actual native AHCI controller/DMA execution remains unchanged. See
`docs/patents/REVIEW_LOG.md`.

Constructed native-service activation and AHCI retirement now have one
supervisor/runtime-bound lifecycle **IMPLEMENTED IN SOURCE**. `TaskRuntime`
retains the preflight/commit scheduler mechanism privately;
`ServiceSupervisor` validates the exact vacant slot, object/task/runtime
uniqueness, construction state, blocked scheduler state, and wake before any
mutation. It publishes the `Running` service record before infallibly clearing
construction state and committing the wake. Runtime-backed ordinary
registration rejects construction-pending tasks, while equal `TaskId` tokens
from distinct runtimes remain distinct bindings.

The consuming AHCI path freezes the exact current constructed task before
device quiescence. The runtime retains that task's domain and capabilities but
has no current task, does not select a successor, and rejects scheduler and
mutable-domain operations until the freeze is resolved. AHCI then stops the
engine, completes or fails closed outstanding work, sanitizes data, and
withdraws DMA. Every failure returns the non-copy owner for retry or fail-stop.
Only the exact supervisor/runtime/native-task binding can retire the frozen task
to `Exited`; the selected successor remains undispatched while non-copy CPU and
ABAR mapping owners are withdrawn and the exact supervisor cleanup erases the
retired address space. Mapping, erasure, and device backend success cross
documented unsafe trust boundaries. Constructed services cannot use generic
exit, cleanup, or restart paths, and delayed termination dispatch is bound to
the originating runtime.

The Linux kernel suite passes all 705 tests, AHCI passes all 137 tests, and the
configuration service passes all 55 tests. Linux and `MRML_NATIVE` release
builds pass for the kernel and AHCI library; the AHCI service-image profile
passes its `MRML_NATIVE` release build, and the bootloader passes its UEFI
release build. Focused tests cover publication rejection, equal task tokens in
distinct runtimes, mismatched service/native tasks, quiescence retry, frozen
mutation denial, collision-equivalent supervisors and cleanup tickets, mapping
retry, constructed restart denial, and cross-runtime dispatch with owner
retention. This is kernel/scheduler unit, controlled backend, and compile
evidence, not installed CPL3 or `INT 0x80`, active page-table/TLB/IOMMU,
KVM/WHP, or physical-AHCI evidence.

Complexity impact: MEDIUM
TCB impact: MEDIUM
New parser boundary: NO
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: PARTIAL
Existing-object reuse: HIGH

Patent review: `NOT_TRIGGERED` — composing existing task freeze, device
quiescence, supervisor retirement, mapping withdrawal, cleanup, and delayed
dispatch through linear typed owners is conventional fail-closed lifecycle
synchronization. See `docs/patents/REVIEW_LOG.md`.

Non-device constructed services now share narrower supervisor-bound retirement,
fault, and protocol-violation paths **IMPLEMENTED IN SOURCE**. The exact minted
`SupervisedServiceTask` must identify the current task in the originating
runtime before termination. Voluntary retirement records `Exited`; a user fault
records `Faulted` and retains the exact fault disposition; a protocol violation
also records `Faulted` while retaining its typed violation reason. All three
paths retain their scheduler owner without exposing a successor dispatch. Exact
supervisor, service generation, task, state, and cleanup-ticket matching precede
address-space erasure; backend uncertainty returns the unchanged owner for
retry. Only the corresponding cleaned linear owner can request the runtime-bound
successor dispatch. After exact cleanup, a constructed service can now restart
only through an unsafe typed-owner transition that exact-matches the retired
service object, a fresh construction-pending task, restart budget, backoff, and
the old service generation before atomically publishing the successor generation
and waking the task. Cleanup-required, wrong-object, stale-generation, and
restart-limit failures leave the fresh construction owner blocked and unchanged;
the ordinary context-creating restart path continues to reject constructed
services. The Linux-host kernel suite passes all 718 tests and the release
`MRML_NATIVE` build passes. This is scheduler, lifecycle, and controlled eraser
evidence; no installed FAT32 process, active
page-table/TLB withdrawal, KVM/WHP, or physical storage execution was exercised.

Patent review: `NOT_TRIGGERED` — supervisor-bound task retirement, fault and
protocol-violation containment, exact cleanup, delayed scheduler dispatch, and
generation-advancing restart reuse conventional lifecycle mechanisms. See
`docs/patents/REVIEW_LOG.md`.

Read-transfer construction now **PARTIALLY IMPLEMENTS IN SOURCE** a charged
memory-resource root. The kernel reserves exactly one `Shared` page from an
explicit pool into the source task, retains its typed table generation, and
issues only the exact `MAP|READ|WRITE|PIN|CONTROL|DELEGATE` construction
authority needed for later zeroed backing, directional mappings, attenuation,
and teardown. Reservation publishes no physical backing or mapping, and pool
accounting returns to zero when the still-unsplit object is released. The
Linux-host release kernel suite passes 648 tests. This is memory-ledger and
capability-policy evidence only; native backing and mapping installation,
installed service execution, KVM, WHP, IOMMU, and physical hardware remain
unverified by this increment.

Patent review: `NOT_TRIGGERED` — exact page charging and typed generational
capability binding are conventional resource-accounting mechanisms. See
`docs/patents/REVIEW_LOG.md`.

The charged read-transfer root now **PARTIALLY IMPLEMENTS IN SOURCE** exact
zeroed physical-backing acquisition through the backend-neutral memory-object
contract. Binding consumes the typed object and its `CONTROL|PIN` authority;
the backend must claim the complete one-page run exclusively and leave no claim
on failure. An injected claim failure leaves the object unbacked and retryable,
while successful release requires the backend to scrub the same recorded run
before accounting can return the object. The Linux-host release kernel suite
still passes all 648 tests and the release kernel build passes. This is a
controlled recording-backend simulation, not evidence of a production frame
allocator, installed service, IOMMU, KVM, WHP, or physical hardware.

Patent review: `NOT_TRIGGERED` — exclusive zeroed allocation, scrubbed release,
and retry-after-clean-failure are conventional memory-lifecycle mechanisms. See
`docs/patents/REVIEW_LOG.md`.

The memory-resource table now **PARTIALLY IMPLEMENTS IN SOURCE** transactional
installation of two exact one-page backed mappings. A first-side failure
publishes nothing; a second-side failure removes the already installed first
mapping before returning. If that removal is itself uncertain, the result
retains the exact first mapping generation and both backend errors so callers
must complete explicit cleanup rather than treating a half-published pair as
absent. Adversarial simulation covers both clean rollback and retained cleanup,
and the Linux-host release kernel suite passes 649 tests. This mechanism is the
mapping prerequisite for the service transfer page; it is not yet the
service-specific directional binding or physical page-table evidence.

Patent review: `NOT_TRIGGERED` — two-phase mapping publication with explicit
rollback retention is conventional transactional resource management. See
`docs/patents/REVIEW_LOG.md`.

The charged transfer page now **PARTIALLY IMPLEMENTS IN SOURCE** its exact
service-role mapping contract. Construction requires two distinct, exact
`MAP|CONTROL` target capabilities held by the source coordinator, installs one
non-executable read-only page into the local consumer target and the same
physical page non-executable write-only into the provider target, and returns
both generational mapping identities and virtual pages for ordered teardown.
Target aliasing fails before either backend is invoked. The Linux-host release
kernel suite passes 649 tests and the release kernel build passes. The test uses
recording backends; it does not prove active native page tables, installed
service launch, KVM, WHP, IOMMU, or physical execution.

Patent review: `NOT_TRIGGERED` — direction-specific shared-page mappings and
exact target preflight are conventional least-authority memory projection. See
`docs/patents/REVIEW_LOG.md`.

Directional transfer mappings now **PARTIALLY IMPLEMENT IN SOURCE** an explicit
task association. The coordinator binds the two already capability-authorized
mapping targets to live, distinct generational consumer and provider tasks;
task identities describe the selected peers while the separately validated
mapping capabilities remain the address-space authority. Aliased or stale task
identities fail before an association is returned, and the mapping identities
and virtual pages remain unchanged for later construction and teardown. The
Linux-host release kernel suite continues to pass 649 tests. This is typed
association evidence only; it does not yet prove construction consumes the
association or that installed tasks execute the mappings.

Patent review: `NOT_TRIGGERED` — binding resource records to live generational
task identities is conventional lifecycle bookkeeping. See
`docs/patents/REVIEW_LOG.md`.

Successful native read-transfer construction now **PARTIALLY IMPLEMENTS IN
SOURCE** retention of both source-side split handles alongside the projected
consumer handles. These source handles are the tracked ancestors needed to
revoke consumer/provider descendants without first destroying the controlling
memory root; they therefore preserve the required ordering for later task
retirement, mapping removal, scrubbed backing release, and final object release.
The Linux-host release kernel suite passes 649 tests. Complete composed teardown
is still unfinished and no installed or physical execution is claimed.

Patent review: `NOT_TRIGGERED` — retaining capability ancestry handles for
ordered revocation is conventional capability-lifecycle bookkeeping. See
`docs/patents/REVIEW_LOG.md`.

Task-runtime cleanup now **PARTIALLY IMPLEMENTS IN SOURCE** atomic revocation of
two distinct capability roots and their combined transitive descendant graph.
Both roots, every live task generation, every capability generation, and the
deduplicated revocation plan are validated before mutation. A stale second root
therefore leaves the first root and its target descendants live, while a valid
pair removes both trees and deliberately preserves their broader construction
root for memory teardown. The Linux-host release kernel suite passes 649 tests.
This is capability-graph simulation evidence and not yet the complete composed
service-transfer teardown transaction.

Patent review: `NOT_TRIGGERED` — atomic preflight and revocation of a bounded
capability set is conventional capability-lifecycle management. See
`docs/patents/REVIEW_LOG.md`.

Backed mapping teardown now **PARTIALLY IMPLEMENTS IN SOURCE** an exact retry
state for a two-sided mapping. Removal proceeds provider/second side first and
then consumer/first side. Any policy or backend uncertainty returns the
generational IDs of precisely the mappings still installed; retry skips a side
already removed and therefore cannot issue a duplicate backend removal. Tests
inject failures at both stages and finish from the returned state before
backing release. The Linux-host release kernel suite passes 649 tests. This is
recording-backend simulation, not active native page-table or hardware evidence.

Patent review: `NOT_TRIGGERED` — explicit progress state for retryable ordered
resource teardown is conventional lifecycle management. See
`docs/patents/REVIEW_LOG.md`.

The service transfer mapping record now **PARTIALLY IMPLEMENTS IN SOURCE**
retention of the exact local and provider target capability generations, not
only their descriptive object identities. This lets later teardown reauthorize
and remove each mapping through the same coordinator capability space without
reconstructing authority from a name, task ID, or virtual address. The
Linux-host release kernel suite passes 649 tests. Composed end-to-end teardown
remains the next gate.

Patent review: `NOT_TRIGGERED` — retaining opaque capability generations with
their resource record is conventional authority-preserving bookkeeping. See
`docs/patents/REVIEW_LOG.md`.

Native service construction now **PARTIALLY IMPLEMENTS IN SOURCE** consumption
of one coherent mapped-transfer record. Before splitting or projecting any
authority, it requires the task binding to name the requested local task and
requires the mapping record's typed memory-object generation and public object
identity to match the charged root. Successful construction returns the task,
memory root, mapping/task binding, projected handles, and source revocation
ancestors together. The focused lifecycle test constructs through this path,
atomically revokes both transfer trees, removes both mappings, scrubs the
backing, and returns the one-page charge. The Linux-host release kernel suite
passes 649 tests. Recording backends remain simulation rather than installed or
physical execution evidence.

Patent review: `NOT_TRIGGERED` — exact identity composition and ordered
capability/resource teardown are conventional lifecycle mechanisms. See
`docs/patents/REVIEW_LOG.md`.

Mapped native transfer teardown now **PARTIALLY IMPLEMENTS IN SOURCE** one
retryable composed operation. Its retained state advances only after atomic
revocation of both source ancestry trees, confirmed provider then consumer
mapping removal, scrubbed backing release, and final object/accounting release.
Injected provider-unmap, consumer-unmap, and backing-release failures each
return the exact completed-stage and remaining-mapping state; retries skip every
completed operation and ultimately return the single charged page. The
Linux-host release kernel suite passes 649 tests. This proves bounded policy and
recording-backend lifecycle behavior, not installed service or physical mapping
execution.

Patent review: `NOT_TRIGGERED` — a staged retry state over conventional
revocation, unmapping, scrubbing, and accounting operations introduces no new
algorithm or compatibility mechanism. See `docs/patents/REVIEW_LOG.md`.

Mapped native transfer teardown now also fails closed while its constructed
service task remains live. The liveness check precedes capability revocation,
backend unmapping, backing scrubbing, and accounting mutation, so supervision
must first retire the exact generational task and its complete task-local
authority domain. The lifecycle test proves the live-task attempt returns the
unchanged teardown state, explicitly schedules and terminates that task, and
then completes the existing injected-failure retry sequence. The Linux-host
release kernel suite passes 649 tests and the release build passes. This is
in-memory scheduler and recording-backend evidence, not installed or physical
execution.

Patent review: `NOT_TRIGGERED` — requiring task retirement before revocation and
unmapping is conventional safe resource-lifecycle ordering. See
`docs/patents/REVIEW_LOG.md`.

The coherent mapped-transfer task can now reconstruct and revalidate the exact
source-owned launch attachment needed by a service coordinator. Reconstruction
uses the retained source ancestry handles plus the bound provider task, shared
object generation, and byte count; it never substitutes the attenuated handles
installed in the target task. The lifecycle test exact-matches every field
before supervision and teardown. The Linux-host release kernel suite passes 649
tests and the release build passes. Installed storage placement remains
**PLANNED**.

Patent review: `NOT_TRIGGERED` — reconstructing a validated typed view from
already retained capability and identity records is conventional boundary
checking. See `docs/patents/REVIEW_LOG.md`.

Native mapped-transfer construction now also accepts the exact source
attachment already validated by a service coordinator. Before target mutation,
the kernel exact-matches its provider task, shared object, generation, and byte
count against the mapped memory and task binding; mismatch leaves the target
and attachment unchanged. Construction failure revokes both consumed source
attachment roots with the existing rollback error semantics. The convenience
root path preflights mapping coherence before splitting authority and delegates
to the same constructor. The Linux-host release kernel suite passes 649 tests
and the release build passes. This enables a storage placement backend to use
the coordinator-provided attachment, but does not yet constitute an installed
backend.

Patent review: `NOT_TRIGGERED` — exact typed-record matching and rollback of a
consumed capability pair are conventional authority-boundary composition. See
`docs/patents/REVIEW_LOG.md`.

Mapped-transfer teardown errors now expose the exact retained teardown state
through one variant-independent accessor. This lets a service lifecycle owner
persist task-retirement, authority, mapping, backing, and object-release
progress without re-decoding backend-specific error variants. The Linux-host
release kernel suite passes 649 tests and the release build passes.

Patent review: `NOT_TRIGGERED` — exposing already retained retry state through a
typed accessor is conventional lifecycle plumbing. See
`docs/patents/REVIEW_LOG.md`.

Shared resources now **PARTIALLY IMPLEMENT IN SOURCE** a distinct write-copy
projection for service tasks. The projection creates no provider virtual
mapping and requires exact `MAP | WRITE` authority, exact controller `CONTROL`
authority, the task and VM generation, and a still-live mapped source resource
on every resolution. This is the mechanism boundary needed where x86 page
tables cannot enforce write-only mappings without silently widening authority.
The Linux-host release kernel suite passes 650 tests. The projection is not yet
wired into the shared-buffer syscall or storage transfer lifecycle, and the
test uses in-memory mappings and an opaque recording handle rather than an
installed page table or physical device.

Engineering Constitution complexity score: TCB impact **MODERATE**; parser
complexity **NONE**; persistent-state impact **NONE**; external dependency
**NONE**; existing object reuse **YES**. Digital-rights review: the provider
receives narrower operation authority and no new observer or vendor authority.
Hostile-security review: exact rights, identity, generation, liveness, bounds,
capacity, duplicate, stale-source, and revocation checks fail closed.

Patent review: `NOT_TRIGGERED` — a capability-bound kernel copy projection over
an existing opaque shared resource is conventional access-control and bounded
copy plumbing. See `docs/patents/REVIEW_LOG.md`.

The shared-buffer write ABI now **PARTIALLY IMPLEMENTS IN SOURCE** execution
through that non-mapped projection. The executor accepts only
`WriteSharedBuffer`, revalidates the exact provider task, VM, capability,
projection generation, mapped source liveness, and byte range before copying
from validated ordinary user memory into the opaque resource. Every outcome
cancels the user-copy ticket and erases scratch storage; out-of-range requests
reach neither the user bulk copy nor resource backend. The existing mapped
read/read-write executor remains available while storage migrates. The
Linux-host release kernel suite passes 651 tests and the release build passes.
This is in-memory syscall-executor and recording-backend evidence, not an
installed syscall dispatch, active page table, or physical block provider.

Patent review: `NOT_TRIGGERED` — exact capability revalidation, checked range
arithmetic, scratch erasure, and a bounded kernel-mediated copy are conventional
syscall mechanisms. See `docs/patents/REVIEW_LOG.md`.

Received IPC messages can now write through one exact non-mapped shared-copy
projection. The helper requires exactly one transferred `MAP | WRITE`
capability, revalidates the projection's source mapping and task/VM binding,
checks the complete byte range, and exposes only the opaque resource handle to
the backend. The focused test performs the copy and then proves source unmapping
invalidates further resolution. The Linux-host release kernel suite remains at
651 passing tests and the release build passes. Storage transport composition
remains the next gate.

Patent review: `NOT_TRIGGERED` — composing existing exact IPC authorization,
projection resolution, range validation, and opaque backend I/O is conventional
mechanism reuse. See `docs/patents/REVIEW_LOG.md`.

Write-copy projection revocation now requires an exact `CONTROL` capability for
the projected shared object. A generational projection ID identifies the entry
but cannot remove it, and an overbroad otherwise-related capability is rejected
before table mutation. The Linux-host release kernel suite remains at 651
passing tests and the release build passes.

Patent review: `NOT_TRIGGERED` — capability-authorized generational table
revocation is conventional access-control lifecycle enforcement. See
`docs/patents/REVIEW_LOG.md`.

Component-service read transfers now **PARTIALLY IMPLEMENT IN SOURCE** a
single-mapping construction path for copy-mediated providers. It installs the
charged backing only as `READ` in the consumer target, records the exact local
and provider task generations, and never accepts a provider target address or
invokes a provider mapping backend. The focused lifecycle test proves the
installed request is exactly read-only, rejects task aliasing, and removes the
single mapping through the ordinary verified backend path. The Linux-host
release kernel suite remains at 651 passing tests. Native task construction and
teardown still use the older recording-only pair and remain the next migration
gate; no active page-table or physical execution is claimed.

Patent review: `NOT_TRIGGERED` — installing one conventional read-only mapping
and retaining typed task identities for a separately mediated copy path is
ordinary capability lifecycle composition. See `docs/patents/REVIEW_LOG.md`.

Native component construction and teardown now **PARTIALLY IMPLEMENT IN
SOURCE** the single-mapping transfer lifecycle. Construction exact-matches the
prepared directional attachment, charged memory root, read-only mapping, local
task, and provider task before populating the fresh service task. Retryable
teardown refuses a live consumer, revokes both source authority trees and all
tracked descendants, removes the sole read-only mapping, scrubs/releases the
backing, and returns the page charge. Injected mapping and backing failures
retain exact progress and retries skip completed stages. The Linux-host release
kernel suite passes 652 tests and the release build passes. Provider-side copy
binding cleanup and storage launch ownership are still separate pending gates;
this remains scheduler, in-memory policy, and recording-backend evidence.

Patent review: `NOT_TRIGGERED` — exact construction record matching and staged
revocation, unmapping, scrubbing, and accounting are conventional capability
and resource lifecycle mechanisms. See `docs/patents/REVIEW_LOG.md`.

The copy-mediated native task record now retains the exact page-table root and
the kernel constructor exact-matches it against the target task context before
any target capability projection. This moves address-space identity into the
kernel-owned lifecycle record needed by a future retirement ticket instead of
leaving it as storage-side convention. The Linux-host release kernel suite
passes 652 tests; storage's 162-test release suite exercises the matching root
and rejects substitution. Active-root retirement remains **PLANNED**.

Patent review: `NOT_TRIGGERED` — exact matching and retention of an existing
page-table identity is conventional lifecycle boundary validation. See
`docs/patents/REVIEW_LOG.md`.

Copy-mediated native service teardown now requires a typed voluntary-retirement
witness containing the exact removed task context. Retirement is accepted only
while that task is current and its context still exact-matches the retained
page-table root; ordinary task disappearance is no longer sufficient to begin
authority, mapping, backing, or object cleanup. The storage launch receipt
carries the witness through retryable teardown without discarding prior cleanup
progress. The Linux-host release kernel suite passes 652 tests, the storage
suite passes 162 tests, and both release builds pass. This is in-memory
scheduler and inactive-page-table evidence only: active-root mapping retirement
and TLB invalidation remain **PLANNED**.

Patent review: `NOT_TRIGGERED` — retaining and exact-matching a task's existing
context before conventional capability and memory cleanup is ordinary lifecycle
enforcement. See `docs/patents/REVIEW_LOG.md`.

The memory-resource table now exposes a revoke-only native mapping backend
contract, distinct from mapping installation. It capability-preflights the
exact generational mapping, invokes native withdrawal and required translation
invalidation first, and retires policy/accounting state only after backend
success; a backend failure leaves the mapping record live for fail-stop or
retry handling. The x86-64 active-service revoker implements this contract by
reconstructing and exact-matching the complete virtual, physical, length, and
permission tuple before active leaf removal. The Linux-host release kernel
suite passes 652 tests and the release build passes. Tests exercise policy
ordering and inactive in-memory page-table mechanics; no active CR3 or physical
CPU execution is claimed yet.

Patent review: `NOT_TRIGGERED` — revoke-before-policy-retirement ordering and
exact page-table tuple validation are conventional memory lifecycle mechanisms.
See `docs/patents/REVIEW_LOG.md`.

Copy-mediated native service teardown and the storage provider teardown backend
now require only the revoke-only mapping contract. Existing full mapping
backends inherit that contract from their already equivalent removal guarantee,
while an active service revoker can be supplied without acquiring installation
authority. Teardown still requires the exact typed task-retirement context
before invoking withdrawal, preserves the mapping record after backend failure,
and advances retry state only after policy-accounted revocation succeeds. The
Linux-host release kernel suite passes 652 tests and storage passes 162 tests.
The storage test continues to use an inactive hierarchy, so active-CR3 execution
and interrupt-exclusion integration remain **PLANNED**.

Patent review: `NOT_TRIGGERED` — narrowing teardown to a revoke-only backend and
retaining conventional fail-closed ordering is ordinary authority attenuation.
See `docs/patents/REVIEW_LOG.md`.

Native copy-transfer retirement now has one coupled operation that removes the
current task's complete runtime domain and immediately invokes exact mapping
withdrawal before returning control to code that may install the scheduler's
next hardware context. A withdrawal failure cannot revive the task: it returns
the termination outcome, retained context, and still-live mapping policy record
as retryable teardown state. Storage provider retirement uses this coupled path
and publishes only the resulting teardown state, with successful withdrawal
already marked complete. The Linux-host release kernel suite passes 652 tests,
storage passes 162 tests, and both release builds pass. Tests use the in-memory
scheduler and an inactive page-table hierarchy; active CR3 and interrupt-
exclusion behavior remain unverified on physical hardware.

Patent review: `NOT_TRIGGERED` — coupling task-domain retirement to immediate
mapping withdrawal is conventional fail-closed lifecycle ordering. See
`docs/patents/REVIEW_LOG.md`.

Opening the current x86-64 page-table hierarchy now snapshots RFLAGS and rejects
the operation when the interrupt-enable flag is set. This turns one part of the
active-mutation safety contract into a checked precondition while leaving CPU
ownership, identity mapping, and concurrent-mutation exclusion as explicit
unsafe caller obligations. The Linux-host release kernel suite passes 652 tests
and the release build passes; the flag predicate is unit-tested, but no
privileged active-CR3 execution is claimed.

Patent review: `NOT_TRIGGERED` — checking the architectural interrupt-enable
flag before privileged page-table mutation is a conventional critical-section
precondition. See `docs/patents/REVIEW_LOG.md`.

The memory-resource table now releases a complete native revocation descriptor
only after exact mapping generation and target `CONTROL` authorization pass the
same preflight used by retirement. The descriptor includes the physical backing
needed for leaf identity validation but remains non-authorizing data. The x86-64
active-service revoker can construct directly from this unmodified descriptor,
rebuilding the complete native mapping before any leaf mutation. The Linux-host
release kernel suite passes 652 tests and the release build passes; tests prove
authorization denial and exact descriptor recovery, not active hardware use.

Patent review: `NOT_TRIGGERED` — capability-gated disclosure of an exact mapping
withdrawal descriptor is conventional privileged resource introspection. See
`docs/patents/REVIEW_LOG.md`.

The kernel now exposes one unsafe x86-64 active retirement entry point for the
copy-mediated native service lifecycle. It rejects wrong current-task and
page-table-root state before privileged access, obtains the local mapping's
capability-authorized revocation descriptor, requires an IF-clear current CR3,
constructs the exact active revoker, and completes the coupled task/mapping
retirement before returning a scheduling outcome. CPU ownership, identity
mapping, and concurrent-mutation exclusion remain explicit unsafe caller
obligations. The Linux-host release kernel suite passes 652 tests and the
release build passes; only pre-privilege denial is exercised on the host, so
active CR3 execution remains **PARTIALLY IMPLEMENTED**, not hardware-verified.

Patent review: `NOT_TRIGGERED` — composing exact task, capability, CR3, and leaf
preconditions around conventional page-table withdrawal is ordinary privileged
lifecycle integration. See `docs/patents/REVIEW_LOG.md`.

The storage provider receipt now exposes a matching unsafe active-x86 retirement
operation. It accepts only an active instance or an untouched live-task teardown
retry, delegates all CR3 and mapping checks to the kernel entry point, and
replaces the receipt with exact teardown state whenever the task was retired
even if native withdrawal then failed. Pre-retirement denial leaves the active
receipt unchanged. The Linux-host release kernel suite passes 652 tests,
storage passes 162 tests, and both release builds pass. Tests exercise the
pre-privilege denial and receipt preservation paths; active hardware execution
is not claimed.

Patent review: `NOT_TRIGGERED` — propagating a typed fail-closed retirement
result through a service receipt is conventional lifecycle state management.
See `docs/patents/REVIEW_LOG.md`.

Voluntary task termination now has a typed dispatch proof that exact-matches the
returned scheduler outcome against current runtime state before exposing a
successor `UserContext`. A switch must name the retired task as its source and
the runtime's exact current task as its destination; `Continue`, source-less
switches, stale destinations, and `Idle` while a task remains current fail
closed. The Linux-host release kernel suite now passes 653 tests and the release
build passes. This proves in-memory scheduler/context binding only and does not
execute the privileged context-loading assembly.

Patent review: `NOT_TRIGGERED` — exact matching of scheduler outcomes to saved
contexts is conventional task-dispatch lifecycle validation. See
`docs/patents/REVIEW_LOG.md`.

Filesystem provider retirement now returns a typed result that binds the exact
task-termination record to its validated successor dispatch. The provider
receipt transitions to retained teardown state before dispatch validation, so
a post-retirement scheduler mismatch cannot leave an active provider receipt or
discard the retired context. The Linux-host release kernel suite passes 653
tests, storage passes 162 tests, and both release builds pass. This evidence
covers the in-memory scheduler and inactive page-table hierarchy only; it does
not execute privileged context loading or active-CR3 mutation.

Patent review: `NOT_TRIGGERED` — composing typed termination, retained teardown,
and successor dispatch records is conventional fail-closed lifecycle state
management. See `docs/patents/REVIEW_LOG.md`.

The validated task-termination dispatch is now opaque outside the runtime that
mints it. Safe downstream kernel and service code can inspect whether it names
idle or the exact successor task and context, but cannot construct a dispatch
proof from caller-selected identity or context data. The Linux-host release
kernel suite passes 653 tests, storage passes 162 tests, and both release builds
pass. This strengthens the software boundary before context installation; it
does not add or exercise privileged context loading.

Patent review: `NOT_TRIGGERED` — an opaque validated token with read-only
accessors is conventional type-safe boundary enforcement. See
`docs/patents/REVIEW_LOG.md`.

The opaque termination-dispatch token is also non-cloneable and non-copyable,
and provider retirement exposes it only by shared reference. This prevents safe
code from duplicating a validated dispatch before the later consuming context-
transition boundary. The Linux-host release kernel suite passes 653 tests,
storage passes 162 tests, and both release builds pass; privileged context
loading remains unexecuted.

Patent review: `NOT_TRIGGERED` — linear ownership of a validated lifecycle token
is conventional replay prevention. See `docs/patents/REVIEW_LOG.md`.

The termination-dispatch token now has one consuming x86-64 transition-stack
operation. Idle consumption returns only an opaque marker; a validated user
successor is passed directly to the existing non-returning context-entry
assembly without returning or re-exposing the token. Storage retirement can
transfer ownership of its retained token into this boundary. The Linux-host
release kernel suite passes 653 tests, storage passes 162 tests, and both release
builds pass. Host tests exercise only idle consumption; active CR3 switching,
TSS state, and `IRETQ` execution remain unverified on physical hardware.

Patent review: `NOT_TRIGGERED` — consuming a validated scheduler token at a
conventional architecture context-switch boundary is ordinary lifecycle
integration. See `docs/patents/REVIEW_LOG.md`.

Transition-stack context entry now requires an opaque `InstalledEntryStack`
obtained from the initialized current-CPU descriptor state; dispatch consumption
can no longer accept a caller-selected scalar stack address. The token proves
its descriptor-state origin only. Its unsafe contract still requires current-
CPU ownership, live mappings in both roots, valid TSS state, and interrupt
exclusion. The Linux-host release kernel suite passes 653 tests, the kernel
release build passes, and the standard UEFI bootloader cross-build passes with
one pre-existing unused-variable warning. No privileged transition or physical-
hardware execution is claimed.

Patent review: `NOT_TRIGGERED` — preserving initialized descriptor-state
provenance in a typed stack handle is conventional fail-closed API design. See
`docs/patents/REVIEW_LOG.md`.

Storage provider retirement now transfers its exact `TaskTermination` and
non-replayable dispatch token together through one consuming `into_parts`
operation. This prevents the service boundary from silently discarding the
termination audit record while taking ownership of the dispatch token. The
Linux-host storage release suite passes 163 tests and its release build passes;
the new test exact-matches the retired task, scheduler edge, successor task, and
successor context in memory. It does not exercise active page tables or hardware
context entry.

Patent review: `NOT_TRIGGERED` — retaining an audit record beside a linear
lifecycle token is conventional typed state transfer. See
`docs/patents/REVIEW_LOG.md`.

Copy-mediated native-service teardown now retains the exact scheduler
termination alongside the retired context when mapping withdrawal fails after
task removal. A bounded retry operation accepts only that progressed state,
retries only the still-live mapping withdrawal, and returns the unchanged
termination so the runtime can mint the successor dispatch proof after success;
it never retires or revives the task again. Storage provider retirement uses
this retry path and rejects malformed or later teardown states. The Linux-host
release kernel suite passes 653 tests, storage passes 163 tests, and both release
builds pass. The adversarial storage test injects one withdrawal failure and
then proves successful inactive-hierarchy retry and exact successor dispatch;
active-CR3 execution remains unverified.

Patent review: `NOT_TRIGGERED` — retaining exact scheduler evidence across a
retryable resource-withdrawal failure is conventional fail-closed lifecycle
recovery. See `docs/patents/REVIEW_LOG.md`.

The active x86-64 retirement path now accepts that same progressed retry state.
It validates the retained termination and context root, reauthorizes the exact
mapping descriptor, opens the still-active IF-clear CR3 hierarchy, reconstructs
the revoke-only backend, and retries withdrawal without consulting or mutating
the already-advanced scheduler task state. The storage receipt exposes this
retry through its existing active retirement operation. The Linux-host release
kernel suite passes 653 tests, storage passes 163 tests, and both release builds
pass. Host coverage proves malformed retry state is rejected before privileged
access; successful active-CR3 retry remains **PARTIALLY IMPLEMENTED** and is not
physical-hardware evidence.

Patent review: `NOT_TRIGGERED` — reconstructing an exact authorized page-table
revoker for retry is conventional privileged lifecycle recovery. See
`docs/patents/REVIEW_LOG.md`.

Provider teardown state now records whether its opaque successor dispatch has
been issued. After mapping withdrawal, failed dispatch validation leaves the
retained termination unissued and retryable; successful validation atomically
marks issuance before returning the non-copyable token. Both generic and active
provider entry points reject later replay. The Linux-host release kernel suite
passes 653 tests, storage passes 163 tests, and both release builds pass. The
storage test forces mapping failure, proves successful withdrawal and one
dispatch issuance on retry, and rejects a second attempt. This remains in-
memory scheduler and inactive-page-table evidence.

Patent review: `NOT_TRIGGERED` — one-use issuance tracking for a validated
dispatch token is conventional replay-resistant lifecycle state. See
`docs/patents/REVIEW_LOG.md`.

One-use dispatch authority is now enforced in `TaskRuntime`, not only in the
storage receipt. Voluntary termination records one exact pending scheduler
outcome; another voluntary retirement is rejected until it is resolved,
structurally plausible substituted records cannot consume it, validation
failure retains it, and successful dispatch atomically clears it. Reusing the
same termination then fails even if its successor remains current. The native
application and service-supervisor owners explicitly consume this transition,
and service retirement returns the resulting opaque token. The Linux-host
release kernel suite passes 653 tests, storage passes 163 tests, and both release
builds pass. This proves the in-memory runtime state machine, not privileged
context installation.

Patent review: `NOT_TRIGGERED` — runtime-owned single-pending transition state
and consume-on-success validation are conventional scheduler replay prevention.
See `docs/patents/REVIEW_LOG.md`.

While that exact voluntary termination remains pending, the runtime now rejects
timer scheduling, preemption/context capture, yielding, and every additional
current-task retirement. This freezes the selected successor until validation
consumes the transition instead of allowing ordinary scheduler activity to
manufacture a current-task mismatch. Capability cleanup and bounded mapping
retry may still progress without changing scheduler selection. The Linux-host
release kernel suite passes 653 tests, storage passes 163 tests, and both release
builds pass. Tests cover the in-memory freeze and successful storage retry; they
do not execute an interrupt return or active hardware context switch.

Patent review: `NOT_TRIGGERED` — freezing scheduler selection around a pending
context transition is conventional critical lifecycle sequencing. See
`docs/patents/REVIEW_LOG.md`.

Mutable access to the selected successor's saved `UserContext` is now frozen by
the same pending-termination gate. Read-only context inspection and the
capability checks needed for mapping cleanup remain available, but the page-
table root, instruction pointer, stack, flags, and registers cannot be replaced
between scheduler selection and dispatch validation. Mutation becomes available
again only after successful token issuance. The Linux-host release kernel suite
passes 653 tests, storage passes 163 tests, and both release builds pass; this is
in-memory state-machine evidence only.

Patent review: `NOT_TRIGGERED` — preventing saved-context mutation during a
pending dispatch is conventional scheduler integrity enforcement. See
`docs/patents/REVIEW_LOG.md`.

The UEFI service-exit loop now exact-matches every supervisor retirement outcome
against its runtime-minted opaque dispatch before processing peer death,
successor preparation, or idle completion. A switch must name the same task in
both records, and every idle branch requires an idle dispatch; mismatch halts.
The standard, component-service, block-service, and invalid-return UEFI release
profiles cross-build on Linux. The standard profile retains one pre-existing
unused-variable warning. These are build checks only: the loop still prepares
the successor context after validation and does not yet consume the token at
the final `IRETQ` boundary.

Patent review: `NOT_TRIGGERED` — exact matching of a scheduler outcome to an
opaque dispatch record is conventional control-flow integrity validation. See
`docs/patents/REVIEW_LOG.md`.

An issued dispatch can now refresh its saved context only from the same task
that remains current in the runtime. The UEFI service-exit switch path performs
pending-buffer successor preparation, refreshes and rechecks that opaque token,
obtains the typed installed entry stack, and consumes the token directly through
the non-returning context-entry boundary instead of re-fetching and entering a
detached raw context. The Linux-host kernel suite passes 653 tests and its
release build passes. Standard, component-service, block-service, invalid-
return, and buffer-drift UEFI release profiles cross-build; the standard profile
retains one pre-existing unused-variable warning. These builds cover all changed
conditional branches but do not constitute QEMU or physical `IRETQ` evidence.

Patent review: `NOT_TRIGGERED` — refreshing a selected context from the same
runtime identity immediately before conventional context entry is ordinary
control-flow integrity composition. See `docs/patents/REVIEW_LOG.md`.

Service retirement now exposes only the runtime-minted, non-copyable dispatch
token as its successor representation; the duplicate caller-readable
`ScheduleOutcome` has been removed. Every UEFI service-exit branch derives its
switch target or idle result from that token before consuming it at the context-
entry boundary. The Linux-host kernel suite passes 653 tests and the
configuration-service suite passes 53 tests; both Linux release builds pass.
Standard, component-service, block-service, invalid-return, and buffer-drift
UEFI release profiles cross-build, with the same pre-existing unused-variable
warning. These are in-memory and cross-build checks only, not QEMU or physical
context-switch evidence.

Patent review: `NOT_TRIGGERED` — removing a redundant copyable schedule record
in favor of one linear lifecycle token is conventional control-flow integrity
hardening. See `docs/patents/REVIEW_LOG.md`.

Recoverable user-fault retirement now records one exact pending fault transition
inside `TaskRuntime`. Until the runtime validates that exact retirement and
issues its non-copyable dispatch token, timer scheduling, yielding, preemption,
additional retirement, and mutable successor-context access fail closed.
Substituted fault evidence does not consume the pending state, and successful
issuance is one use. `ServiceFault` and composite `ServiceRecovery` carry the
opaque dispatch instead of exposing a raw recovery schedule outcome. Direct
UEFI user-fault and service-preemption paths validate through this runtime gate;
the latter consumes the token at its installed transition-stack boundary. The
Linux-host kernel suite passes 653 tests and its release build passes. User,
service-preemption, service, invalid-return, buffer-drift, and service-restart-
request UEFI release profiles cross-build with one pre-existing unused-variable
warning. This is in-memory and cross-build evidence; it is not QEMU or physical
fault/context-switch evidence. Direct user-probe entry still uses its existing
architecture entry path after token validation and remains a later consumption
integration step.

Patent review: `NOT_TRIGGERED` — retaining and exact-matching one pending fault
transition before successor dispatch is conventional fail-closed scheduler
lifecycle validation. See `docs/patents/REVIEW_LOG.md`.

Kernel-recognized userspace protocol violations now use the same one-pending,
one-use successor-dispatch state machine. The raw schedule outcome inside a
`TaskViolationRetirement` is private, `ServiceViolation` carries the opaque
dispatch token, and substituted violation evidence neither authorizes a target
nor consumes the pending transition. The UEFI violation handler derives the
successor only from that token, processes the typed peer-death event, and then
consumes the token through the final service context-entry boundary. The Linux-
host kernel suite passes 653 tests and its release build passes; the
configuration-service suite passes 53 tests. Service, invalid-return, and
buffer-drift UEFI release profiles cross-build with one pre-existing unused-
variable warning. This is in-memory and cross-build evidence only, not QEMU or
physical protocol-violation/context-switch evidence.

Patent review: `NOT_TRIGGERED` — one-use validation of a typed protocol-
violation retirement before successor entry is conventional scheduler control-
flow integrity. See `docs/patents/REVIEW_LOG.md`.

The direct UEFI user-fault probe now consumes its validated fault-dispatch token
through the typed CPU0 transition stack instead of looking up the successor and
calling the older raw-context entry wrapper. The `user-probe` UEFI release
profile cross-builds with one pre-existing unused-variable warning. This proves
the feature-selected architecture boundary compiles; the probe was not executed
under QEMU, WHP, KVM, or physical hardware in this increment.

Patent review: `NOT_TRIGGERED` — consuming an existing linear scheduler token
at an existing context-entry boundary is conventional control-flow integrity.
See `docs/patents/REVIEW_LOG.md`.

`TaskRuntime` now represents its mutually exclusive pending voluntary exit,
recoverable fault, or protocol violation as one private `PendingRetirement`
enum. Impossible simultaneous pending states are no longer representable, and
the fixed-capacity runtime reserves storage for only the largest active record
plus its discriminant rather than three independent optional records. Existing
exact-match, freeze, failed-validation retention, successful issuance, and
replay-denial behavior is unchanged. The Linux-host kernel suite passes 653
tests and its release build passes; the configuration-service suite passes 53
tests. User, invalid-return, and service-preemption UEFI release profiles cross-
build with one pre-existing unused-variable warning. This is in-memory and
cross-build evidence only.

Patent review: `NOT_TRIGGERED` — encoding mutually exclusive lifecycle states
as one tagged union is conventional bounded state-machine representation. See
`docs/patents/REVIEW_LOG.md`.

Voluntary `TaskTermination` records are now opaque outside their defining
runtime module. Kernel and service consumers can read the retired task and raw
scheduler outcome through audit-only accessors, but cannot construct a
caller-selected termination record for dispatch. Runtime-owned exact matching
and the non-copyable successor token remain the authorization boundary. The
Linux-host kernel suite passes 653 tests, storage passes 163 tests, and the
configuration service passes 53 tests; kernel and storage Linux release builds
pass. These checks exercise in-memory API and state-machine behavior only.

Patent review: `NOT_TRIGGERED` — separating readable lifecycle evidence from
runtime-only construction is conventional type-safe API hardening. See
`docs/patents/REVIEW_LOG.md`.

Validated dispatch tokens are now `must_use` and provide a safe consuming
`into_idle` operation. That operation returns a user-target token unchanged
rather than silently treating it as idle. The dedicated native application and
configuration-service teardown paths now require explicit idle consumption;
UEFI idle branches that continue lifecycle work or halt also consume the exact
token. The shared-runtime Zstd adapter intentionally remains outside this idle-
only conversion because its valid provider retirement selects the authenticated
caller; a later dispatch-handoff change must preserve that successor rather than
discard or misclassify it. The Linux-host kernel suite passes 653 tests, Zstd
passes 27 tests, and the configuration service passes 53 tests; all three Linux
release builds pass. Component-service, invalid-return, and user UEFI release
profiles cross-build with one pre-existing unused-variable warning. This is in-
memory and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — explicit consuming acknowledgement of an idle
scheduler result is conventional linear lifecycle handling. See
`docs/patents/REVIEW_LOG.md`.

The shared-runtime native Zstd backend now retains a provider-retirement
dispatch instead of discarding the valid successor selected for its
authenticated caller. The token is stored before address-space cleanup, remains
available across uncertain erasure and retry, and must be explicitly taken by
the owner. A replacement provider cannot launch while that dispatch handoff is
pending. The Linux-host Zstd suite passes 27 tests and its release build passes;
the configuration-service integration suite passes 53 tests and its release
build passes. Tests prove caller identity/context retention, cleanup-failure
retention, and relaunch denial in memory; they do not execute privileged context
entry.

Patent review: `NOT_TRIGGERED` — retaining a one-use scheduler result across
retryable service cleanup and blocking replacement until handoff is conventional
linear lifecycle state management. See `docs/patents/REVIEW_LOG.md`.

`TaskRuntime` now retains the exact source-and-successor identity of every
issued opaque termination dispatch until the owning runtime acknowledges an
idle result or consumes the token at the final transition-stack entry boundary.
Another runtime cannot consume the token, replay cannot mint a second dispatch,
and a second retirement fails closed while the first dispatch remains issued.
Trusted successor-context refresh also revalidates the issued identity. Native
application, configuration-service, and UEFI consumers acknowledge idle results
through their owning runtime rather than by inspecting the token alone. Ordinary
scheduling and successor-context mutation are not yet frozen after issuance;
closing that remaining preparation window is a later dependency gate.

The Linux-host kernel suite passes 653 tests, storage passes 163, Zstd passes 27,
and configuration passes 53; their affected Linux release builds pass. The
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build. The UEFI builds retain existing configuration-
specific unused-variable and unreachable-pattern warnings. This is in-memory
state-machine and cross-build evidence only, not QEMU, KVM, WHP, or physical-
hardware context-entry evidence.

Patent review: `NOT_TRIGGERED` — retaining and exact-matching a conventional
one-use lifecycle lease until its final acknowledgement does not introduce a
new technical mechanism. See `docs/patents/REVIEW_LOG.md`.

An issued termination dispatch now freezes timer scheduling, explicit yield,
and interrupted-context preemption until the owning runtime consumes that exact
token. Those scheduler paths return `RetirementDispatchPending` without
advancing ticks, changing the selected task, or installing an interrupted
context. Trusted successor-context preparation remains available while the
token is issued because buffered IPC completion currently updates the selected
service context before final entry; binding that preparation directly to the
dispatch is the next separate gate.

The Linux-host kernel suite passes 653 tests, storage passes 163, Zstd passes 27,
and configuration passes 53; their affected Linux release builds pass. The
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build with the existing configuration-specific warnings.
This is in-memory state-machine and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — pausing scheduler mutation while an existing
one-use transition lease is outstanding is conventional fail-closed lifecycle
serialization. See `docs/patents/REVIEW_LOG.md`.

Generic mutable access to a task context now freezes alongside scheduling while
a termination dispatch is issued. The opaque dispatch instead exposes a
successor-only preparation borrow that exact-matches the owning runtime, issued
source-and-target identity, and current selected task. The UEFI buffered-receive
completion path uses that borrow before refreshing the token's saved context and
entering through the transition stack; an unrelated task, runtime, or token
cannot authorize the mutation.

The Linux-host kernel suite passes 653 tests and its release build passes;
storage passes 163 tests, Zstd passes 27, and configuration passes 53. The
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build with the existing configuration-specific warnings.
These checks do not execute privileged entry or physical hardware.

Patent review: `NOT_TRIGGERED` — binding trusted successor-context preparation
to an existing one-use transition token is conventional capability-scoped state
mutation. See `docs/patents/REVIEW_LOG.md`.

Task-domain migration now freezes while a termination dispatch is outstanding.
Explicit detach, load-driven rebalance detach, and attachment of a detached
domain all reject before inspecting or mutating migration state, so the selected
successor cannot be displaced or supplemented through a concurrent migration.
Task creation remains a separate follow-up because service restart provisioning
currently creates a replacement before every caller has acknowledged the prior
dispatch. The Linux-host kernel suite passes 653 tests and its release build
passes; this is in-memory state-machine evidence only.

Patent review: `NOT_TRIGGERED` — serializing task migration against an existing
one-use scheduler transition is conventional lifecycle locking. See
`docs/patents/REVIEW_LOG.md`.

`TaskRuntime::start` now preserves an issued dispatch's selected state. When the
dispatch targets userspace, repeated start observation remains a non-mutating
`Continue` of that exact current task; when the dispatch is idle, start remains
idle even if trusted recovery has provisioned a replacement task in the ready
set. Only exact idle acknowledgement permits a later start to select that
replacement. This keeps stopped-service provisioning available without letting
it bypass the one-use retirement handoff.

The Linux-host kernel suite passes 653 tests, storage passes 163, Zstd passes 27,
and configuration passes 53; their affected Linux release builds pass. The
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build with the existing configuration-specific warnings.
This is in-memory and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — suppressing scheduler start selection until an
existing idle transition is acknowledged is conventional fail-closed lifecycle
serialization. See `docs/patents/REVIEW_LOG.md`.

The combined receive-or-block IPC and control paths now reject before consuming
an event or calling the scheduler whenever a retirement is pending or a
dispatch is issued. This prevents an outstanding successor handoff from being
replaced by an inbox-empty block transition while leaving the nonblocking,
dispatch-bound buffered-receive preparation path available to the selected
successor.

The Linux-host kernel suite passes 653 tests, storage passes 163, Zstd passes 27,
and configuration passes 53; their affected Linux release builds pass. The
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build with the existing configuration-specific warnings.
This is in-memory and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — rejecting a blocking receive while a one-use
scheduler transition is outstanding is conventional state-machine
serialization. See `docs/patents/REVIEW_LOG.md`.

Every `TaskRuntime` now receives a kernel-internal nonzero instance identity
from one bounded atomic allocator, and each issued dispatch binds that identity
in addition to its retired source and selected successor. Allocation returns the
typed `TaskRuntimeError::RuntimeIdentityExhausted` permanently at exhaustion
rather than wrapping or misclassifying it as corruption. Consequently, two
runtimes with
identical generational task IDs and identical retirement outcomes still cannot
consume or prepare state through each other's dispatch tokens. The runtime
identity is internal matching state, not caller-visible authority.

The Linux-host kernel suite passes 654 tests, including exact cross-runtime
collision and allocator-exhaustion cases. Storage passes 163 tests, Zstd passes
27, and configuration passes 53; their affected Linux release builds pass. The
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build with the existing configuration-specific warnings.
This is in-memory and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — assigning a non-wrapping instance generation
to exact-match a one-use token is conventional stale-handle prevention. See
`docs/patents/REVIEW_LOG.md`.

Each task domain now retains whether its current scheduler block waits for an
ordinary IPC message or for the broader typed control stream. Queued messages
wake either compatible receive mode and consume the exact wait state. Peer-death
publication wakes only a control waiter; for an IPC-only waiter it records the
typed death without spuriously making the task runnable. The wait kind travels
inside the complete domain during migration and is never supplied by message
data or a task name.

The Linux-host kernel suite passes 655 tests. New coverage proves a peer death
does not miswake an IPC waiter, that the death remains queued, and that a later
ordinary message consumes the compatible wait. Storage passes 163 tests, Zstd
passes 27, and configuration passes 53; their affected Linux release builds
pass. The default, service, component-service, invalid-return, and buffer-drift
UEFI release profiles cross-build with the existing configuration-specific
warnings. This is in-memory and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — recording a bounded wait discriminator and
waking only compatible waiters is conventional typed event-loop behavior. See
`docs/patents/REVIEW_LOG.md`.

Blocking IPC and control receives now return an opaque `BlockedReceive` token
that binds the runtime instance, exact generational task, nonzero monotonic wait
generation, wait kind, and resulting scheduler transition. Exact token
cancellation consumes the live wait and makes that task runnable. Cross-runtime
substitution, stale-task use, and replay return `ReceiveWaitMismatch` without
changing scheduler state; generation exhaustion rejects before blocking. Token
copies cannot amplify cancellation because only the one matching live runtime
record can be consumed.

The UEFI buffered-receive pending record retains this token alongside its
already validated task, page-table root, and output ranges, and rejects a
control-kind or wrong-task token. The direct inline receive path can observe the
opaque token but does not yet retain it under a cancellation owner; syscall
cancellation and deadline policy remain the next integration gate, and no
task-name cancellation fallback is exposed.

The Linux-host kernel suite passes 657 tests, including cross-runtime
substitution, replay, automatic wake invalidation, and generation-exhaustion
coverage. Storage passes 163 tests, Zstd passes 27, and configuration passes 53;
their affected Linux release builds pass. The default, service,
component-service, invalid-return, and buffer-drift UEFI release profiles
cross-build with the existing configuration-specific warnings. This is
in-memory and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — exact generational cancellation of a blocked
wait is conventional replay-safe scheduler lifecycle handling. See
`docs/patents/REVIEW_LOG.md`.

The UEFI service dispatcher now retains every inline blocked receive token in a
separate bounded owner table before handing execution to the selected task. A
successful inline receive resume consumes the exact task-bound owner record
before copying the queued message into the suspended syscall frame. Inline and
buffered receive ownership are mutually exclusive for a task, duplicate owner
records fail closed, and service protocol retirement or component accounting
release cannot proceed while either kind of receive owner remains live.

This establishes an explicit kernel-issued cancellation owner across the inline
syscall suspension boundary. It does not yet expose a cancellation syscall or
choose deadline and cancellation policy; those remain subsequent integration
work, and no task-name cancellation fallback is introduced.

The Linux-host kernel suite passes 657 tests. The default, service,
component-service, invalid-return, and buffer-drift UEFI release profiles
cross-build with the existing configuration-specific unused-variable and
unreachable-pattern warnings. This is in-memory and cross-build evidence only;
no QEMU or physical-hardware execution was performed for this increment.

Patent review: `NOT_TRIGGERED` — retaining and consuming a one-use cancellation
token across a suspended syscall is conventional lifecycle ownership. See
`docs/patents/REVIEW_LOG.md`.

IPC receive waits may now bind a nonzero absolute `ReceiveDeadline` inside the
same opaque runtime/task/generation token. Trusted expiry must present that
exact token and an observed monotonic tick at or after its bound deadline;
pre-deadline attempts and undelimited waits return distinct typed errors without
changing the wait or scheduler. Exact-deadline expiry uses the existing
generational cancellation path, so successful delivery, cancellation, expiry,
and replay still converge on one live wait record rather than parallel wake
authorities. Ordinary undelimited receive behavior remains unchanged.

This is the kernel mechanism gate only. The UEFI service dispatcher does not yet
accept user-selected receive deadlines, connect these waits to its timer path,
or define the suspended syscall's timeout result. No task-name cancellation or
ambient cross-task authority is exposed.

The Linux-host kernel suite passes 658 tests, including non-mutating early
expiry, exact-boundary expiry, replay rejection, and rejection of expiry for an
undelimited wait. The affected Linux kernel release build passes. The default,
service, component-service, invalid-return, and buffer-drift UEFI release
profiles cross-build with the existing configuration-specific warnings. This is
in-memory and cross-build evidence only; no QEMU or physical-hardware execution
was performed for this increment.

Patent review: `NOT_TRIGGERED` — binding an absolute monotonic deadline to an
exact generational wait token is conventional timeout state-machine handling.
See `docs/patents/REVIEW_LOG.md`.

Typed control-stream receives now accept the same optional absolute
`ReceiveDeadline` as ordinary IPC receives. Both paths mint the same opaque
runtime/task/generation/wait-kind/deadline identity and converge on the same
expiry operation. Expiring a control wait makes its task runnable but neither
fabricates nor consumes a control event; a later peer death or message remains a
separate typed publication.

The Linux-host kernel suite passes 659 tests. New coverage proves early control
expiry is non-mutating, exact-boundary expiry wakes the intended task, and the
control queue remains empty rather than receiving a synthetic timeout event.
The affected Linux kernel release build and service plus component-service UEFI
release profiles cross-build with the existing configuration-specific warnings.
This is in-memory and cross-build evidence only; no QEMU or physical-hardware
execution was performed for this increment.

Patent review: `NOT_TRIGGERED` — applying one existing exact deadline mechanism
to a second typed receive class is conventional event-loop parity. See
`docs/patents/REVIEW_LOG.md`.

The pointer-free syscall ABI now defines a typed completion-status namespace:
success is zero, generic denial or malformed-request failure is one, and timeout
is two. Both the live interrupt frame and a suspended `UserContext` can complete
a timeout while clearing every payload/count return register. This keeps expiry
distinct from protocol failure and prevents stale message bytes from being
observed when a deadline resumes a receive syscall.

No request operation exposes deadlines yet, and no timer path writes this status
in the service dispatcher. This increment defines and tests only the completion
contract required before that integration.

The Linux-host kernel suite passes 659 tests. Focused frame and suspended-context
coverage proves timeout has a distinct status and zeroes all auxiliary return
registers. The affected Linux kernel release build and service plus
component-service UEFI release profiles cross-build with the existing
configuration-specific warnings. This is in-memory and cross-build evidence
only; no QEMU or physical-hardware execution was performed for this increment.

Patent review: `NOT_TRIGGERED` — assigning a distinct bounded syscall completion
code to timeout is a conventional ABI result convention. See
`docs/patents/REVIEW_LOG.md`.

`TaskRuntime::expire_due_receives` now scans its fixed-capacity domains at the
runtime's already-accounted scheduler tick, prepares every due wake before any
mutation, then atomically clears and wakes the exact deadline-bound waits. It
returns a bounded array of opaque `ExpiredReceive` identities. A trusted owner
can exact-match each identity against its retained `BlockedReceive`, including
runtime, generational task, wait generation, wait kind, and deadline, without
recovering authority from a task name. Undelimited and future waits remain
untouched, and a second scan cannot replay an expiration.

This establishes the timer-facing kernel mechanism but does not itself advance
time, complete suspended syscall contexts, or expose a user deadline request.
Those integrations remain separate gates so an ABI cannot promise timeout
behavior before a periodic trusted caller exists.

The Linux-host kernel suite passes 660 tests. New coverage blocks distinct IPC
and control owners at consecutive deadlines, advances real scheduler ticks,
matches each bounded expiration only to its exact retained token, and proves a
later scan is empty. The affected Linux kernel release build and service plus
component-service UEFI release profiles cross-build with the existing
configuration-specific warnings. This is in-memory and cross-build evidence
only; no QEMU or physical-hardware execution was performed for this increment.

Patent review: `NOT_TRIGGERED` — bounded transactional scanning of due timers
and exact matching to retained wait identities is conventional scheduler and
event-loop lifecycle handling. See `docs/patents/REVIEW_LOG.md`.

`TaskRuntime::timer_tick_and_expire_receives` now composes hardware-tick
accounting, bounded deadline expiry, and the resulting scheduling decision in
one typed result. If the scheduler initially reports idle because every task was
blocked, but that same tick expires a wait, the runtime immediately selects the
newly runnable task with a `Switch { from: None, ... }` outcome. It therefore
does not leave an eligible deadline waiter asleep until a later interrupt. When
another task remains current, ordinary priority and quantum scheduling still
decide when the newly runnable task executes.

The Linux-host kernel suite passes 661 tests. New coverage places the only task
in a deadline-bound receive, observes the initial idle block transition, and
proves the exact deadline tick both returns its matching expiration and selects
that task from idle. The affected Linux kernel release build and service plus
component-service UEFI release profiles cross-build with the existing
configuration-specific warnings. This is in-memory and cross-build evidence
only; no live interrupt, QEMU, or physical-hardware execution was performed for
this increment.

Patent review: `NOT_TRIGGERED` — reconciling an idle scheduler result after a
timer makes a blocked task runnable is conventional scheduler wakeup handling.
See `docs/patents/REVIEW_LOG.md`.

Deadline-bearing IPC and control receive admission now returns the typed
`DeadlineReceive::{Ready, Blocked, TimedOut}` result. A deadline at or before
the runtime's already-accounted scheduler tick returns `TimedOut` before inbox
consumption, wait-generation allocation, or scheduler blocking. A future
deadline may still return an immediately ready event or mint the exact bounded
wait owner. Undelimited receive APIs retain their existing nested result and
behavior.

This admission rule closes the zero-progress case where an already elapsed
deadline could create a blocked task and then require another hardware tick to
notice the timeout. The typed result can map directly to the distinct syscall
timeout completion status once a timer-backed service dispatcher is composed.

The Linux-host kernel suite passes 662 tests. New coverage advances the runtime
to the exact requested deadline, proves admission returns `TimedOut` while the
task remains current, then proves a later undelimited receive can still create
the first wait. The affected Linux kernel release build and service plus
component-service UEFI release profiles cross-build with the existing
configuration-specific warnings. This is in-memory and cross-build evidence
only; no QEMU or physical-hardware execution was performed for this increment.

Patent review: `NOT_TRIGGERED` — rejecting an already elapsed timeout before
creating wait state is conventional deadline admission handling. See
`docs/patents/REVIEW_LOG.md`.

Callers can now express receive limits as a nonzero `ReceiveTimeout` duration
instead of naming the kernel's absolute scheduler epoch. IPC and control
`receive_*_for` entry points checked-add that duration to the runtime's current
tick and then use the same typed deadline admission and exact wait identity.
Zero durations are unrepresentable, arithmetic overflow returns the typed
`ReceiveDeadlineExhausted` error before inbox or scheduler mutation, and the
resulting opaque token retains only the checked absolute deadline needed by the
trusted timer path.

The Linux-host kernel suite passes 663 tests. New coverage rejects zero and
overflowing duration construction, binds a two-tick relative request to the
runtime epoch, proves the first tick leaves it blocked, and exact-matches its
expiration on the second tick. The affected Linux kernel release build and
service plus component-service UEFI release profiles cross-build with the
existing configuration-specific warnings. This is in-memory and cross-build
evidence only; no QEMU or physical-hardware execution was performed for this
increment.

Patent review: `NOT_TRIGGERED` — checked conversion from a relative timeout to
an internal absolute deadline is conventional bounded timer arithmetic. See
`docs/patents/REVIEW_LOG.md`.

The kernel now provides a fixed-capacity `DeadlineReceiveSyscallExecutor` for
the service-dispatch boundary. It reserves owner capacity before asking the
runtime to block, retains the exact opaque wait token, and exposes only typed
ready, timed-out, or scheduler-transition admission results. Message wakeup
exact-matches and consumes the retained owner before completing the suspended
context with bounded inline payload registers. Its timer entry uses the composed
runtime tick, prevalidates every returned expiration against one unique owner
and live context, then consumes those owners and writes the detail-free timeout
completion.

This host-tested executor is the canonical lifecycle path intended for the
dedicated UEFI deadline profile. It does not yet assign a public syscall
operation or establish live interrupt execution evidence. Owner mismatch is a
fail-closed dispatcher error; it never falls back to task-name cancellation.

The Linux-host kernel suite passes 665 tests. New tests prove an all-blocked
one-task timeout selects the exact task from idle and zeroes its suspended
completion registers, while a message arriving before a later deadline consumes
the owner and completes the original payload instead. The affected Linux kernel
release build and service plus component-service UEFI release profiles
cross-build with the existing configuration-specific warnings. This is
in-memory and cross-build evidence only; no QEMU or physical-hardware execution
was performed for this increment.

Patent review: `NOT_TRIGGERED` — a fixed-capacity pending-syscall owner table
that serializes message completion against timer completion is conventional
event-loop and syscall lifecycle handling. See `docs/patents/REVIEW_LOG.md`.

The pointer-free syscall decoder now assigns operation 13 to
`ReceiveFor { timeout }`. The timeout is a nonzero relative scheduler-tick
duration carried only in `rdi`; every other argument register must be zero.
Zero returns the typed `InvalidTimeout` decode error, reserved-register drift is
rejected, and payload inspection remains empty. Existing UEFI service and user
probe profiles explicitly return the detail-free generic error for this request
because they do not yet compose their syscall runtime with a periodic timer;
they never accept a deadline that those profiles cannot honor.

The dedicated timer-backed service profile remains the gate that will route
operation 13 through `DeadlineReceiveSyscallExecutor`. Defining the canonical
operation first prevents private profile-specific encodings while preserving
fail-closed behavior in every existing build.

The Linux-host kernel suite passes 666 tests, including successful decode and
zero/reserved-register rejection. The affected Linux kernel release build and
default, service, component-service, invalid-return, and buffer-drift UEFI
release profiles cross-build with the existing configuration-specific warnings.
This is ABI decode and cross-build evidence only; no timeout request ran under
QEMU or on physical hardware.

Patent review: `NOT_TRIGGERED` — decoding a bounded relative timeout from one
register and rejecting unsupported execution profiles is conventional syscall
ABI validation. See `docs/patents/REVIEW_LOG.md`.

The standalone service image now has a dedicated `deadline_receive_probe`
feature profile. Its receiver issues operation 13 with a one-tick relative
timeout, then accepts only the typed timeout status with all payload/count
registers cleared before emitting the bounded service proof marker. It does not
send a message, synthesize a wakeup, or accept generic error as timeout. The
normal configuration-service receiver is excluded from this profile so the
executable has one unambiguous entry implementation.

Both the default and deadline-receive MRML-native service-image release profiles
build through the canonical `mrml` frontend. The dedicated profile reports ten
expected dead-code warnings for configuration and supervision helpers that its
minimal receiver deliberately does not invoke. This is service-artifact
cross-build evidence only; the bootloader timer/executor profile and live QEMU
execution remain the next gate.

Patent review: `NOT_TRIGGERED` — a minimal service program that invokes and
checks a timeout syscall is conventional ABI integration testing. See
`docs/patents/REVIEW_LOG.md`.

The bootloader now exposes a dedicated `deadline_receive_probe` UEFI feature
profile that routes operation 13 through the shared
`DeadlineReceiveSyscallExecutor`. The profile installs and enables a local-APIC
periodic timer only after the service runtime and exact pending-receive owner
table exist. Its timer gate accepts only the configured vector from CPL3,
captures the interrupted task's exact address-space context, advances and
expires the same runtime, acknowledges the interrupt, and resumes only the
scheduler-selected context. The timeout completion therefore comes from the
retained generational wait owner rather than a task name or a profile-local
wakeup convention.

The probe's second service task deliberately spins instead of sending, so a
message cannot race the receiver's one-tick deadline. Existing service profiles
continue to reject operation 13 rather than accepting a timeout without this
timer composition.

The Linux-host kernel suite passes 666 tests. The default and dedicated
deadline service-image release profiles build through the canonical `mrml`
frontend; the deadline image reports 14 expected dead-code warnings because its
minimal receiver and inert sender do not invoke the configuration and
supervision helpers. The default, service, component-service, and dedicated
deadline UEFI bootloader release profiles also cross-build, with only their
existing configuration-specific warnings. This is unit-test and cross-build
evidence only: the new interrupt path has not run under QEMU, KVM, WHP, or
physical hardware, so live timeout proof remains the next gate.

Patent review: `NOT_TRIGGERED` — composing a conventional periodic timer
interrupt, retained pending-syscall owner, typed timeout completion, and
scheduler resume does not introduce a new substantial mechanism. See
`docs/patents/REVIEW_LOG.md`.

The hosted KVM and WHP runners now recognize a distinct
`deadline-receive-probe` mode. Both select an interrupt-capable kernel guest,
attach the independently signed service image with local-APIC access, retain
the existing Total-mode service admission path, and accept only the exact
32-bit service proof value `0x2a` on the service proof port. A halt, service-call
trace, wrong port, wrong width, read, or adjacent proof value is not timeout
evidence. The KVM validator has direct negative coverage for those substitutions.

The Linux-host KVM runner suite passes 16 tests and its release build passes
through the canonical `mrml` frontend with the existing CUDA-PTX warnings. The
WHP path was kept structurally symmetric and both edited sources parse under
Rust 2024 rustfmt, but the Windows build was not available because this host
lacks the repository's `cross_host_rust_target` component. `/dev/kvm` is also
absent on this host, so no guest executed and neither KVM nor WHP timeout proof
is claimed yet. The next evidence gate is to run these exact signed artifacts on
a host with the corresponding backend.

Patent review: `NOT_TRIGGERED` — selecting an existing hosted launch path and
exact-matching its bounded proof output is conventional test-harness routing.
See `docs/patents/REVIEW_LOG.md`.

The deadline-enabled UEFI service dispatcher now closes the message-versus-
timer race at the IPC publication boundary. After a successful inline or
buffered send wakes a receiver, the dispatcher checks the exact generational
deadline owner and, when present, consumes that owner and completes the saved
receiver context with the queued message before completing the sender. A timer
interrupt therefore cannot resume a newly runnable receiver with its original
syscall registers, and the later sender yield refuses any still-pending owner
instead of guessing a completion order.

This interrupt-capable profile also rejects the legacy indefinite receive
operation. That operation's older probe-only completion path defers context
completion until cooperative yield and is not safe to admit under timer
preemption. Other service profiles retain their existing behavior; the bounded
deadline operation remains the only blocking receive admitted by this profile.

The Linux-host kernel suite passes 666 tests, including the executor test that
publishes a message, consumes the exact retained owner, and verifies the saved
payload completion. The default service, component-service, and deadline UEFI
release profiles cross-build through `mrml` with only their existing
configuration-specific warnings. This is unit and cross-build evidence; no
hosted or physical interrupt/message race was exercised.

Patent review: `NOT_TRIGGERED` — completing a retained pending syscall before a
woken task becomes preemptible is conventional interrupt-safe event delivery.
See `docs/patents/REVIEW_LOG.md`.

A separate `deadline_receive_message_probe` profile now exercises the other
side of that arbitration contract. Its receiver enters operation 13 with a
bounded one-million-tick duration; its sender publishes the five-byte `ready`
message through the ordinary buffered-send ABI and cooperatively yields. The
receiver accepts only successful completion with length five, exact little-
endian payload bytes, and zero unused payload registers before emitting proof
`0x2b`. It cannot confuse the existing detail-free timeout proof `0x2a` with a
message completion.

KVM and WHP expose a matching `deadline-receive-message-probe` runner mode on
the same interrupt-capable, independently signed service path. Their expected
proof is selected by mode. The host-tested KVM validator accepts only `0x2a` or
`0x2b`, rejects noncanonical proof selection, and rejects either valid proof
when substituted for the other mode.

Both deadline service-image and UEFI bootloader release profiles cross-build
through `mrml`; the timeout and message service images report 14 and 13 expected
dead-code warnings respectively, and both boot profiles report the existing
unreachable-pattern warning. The Linux KVM runner suite passes 16 tests and its
release build passes with the existing CUDA-PTX warnings. The Windows target and
`/dev/kvm` remain unavailable on this host, so this is compile and host-unit
evidence only, not a claim that either hosted backend executed the arbitration
probe.

Patent review: `NOT_TRIGGERED` — a bounded message-before-timeout integration
probe and exact mode-specific proof matching are conventional race-regression
testing. See `docs/patents/REVIEW_LOG.md`.

Deadline arbitration now has an explicit late-delivery regression boundary.
After the timer expires an exact pending owner, a later IPC publication wakes
the receiver but cannot recreate or consume that retired owner. Attempting the
old ready-completion path returns `OwnerMismatch` before inbox access, leaves
the saved timeout status and zero detail registers unchanged, and preserves the
late message for the receiver's next explicit receive operation.

The Linux-host kernel suite passes 667 tests. The new test exercises a
two-task runtime from deadline admission through timer expiry, late authorized
delivery, stale completion rejection, unchanged saved context, and subsequent
message retrieval. The Linux kernel release build also passes through the
canonical `mrml` frontend. This is deterministic in-memory evidence, not hosted
interrupt or physical-hardware evidence.

Patent review: `NOT_TRIGGERED` — rejecting a stale completion before queue
consumption and retaining a late event is conventional one-winner event-loop
arbitration. See `docs/patents/REVIEW_LOG.md`.

The fixed-capacity executor now has staggered multi-owner coverage. Three tasks
are scheduled in one runtime; the first two retain distinct one-tick and
two-tick receive owners while the third remains runnable. The first timer tick
retires and completes only the first owner, leaving the second pending and its
context untouched. The second tick then retires only the second owner. Both
timeout completions clear every payload register, and the unrelated third task
never acquires pending receive state.

The Linux-host kernel suite passes 668 tests and the Linux kernel release build
passes through `mrml`. This proves bounded in-memory owner separation across
staggered deadlines; it does not establish hosted interrupt concurrency or
physical timer behavior.

Patent review: `NOT_TRIGGERED` — independently matching fixed-capacity timeout
owners across staggered timer ticks is conventional scheduler regression
testing. See `docs/patents/REVIEW_LOG.md`.

Deadline receive operation 13 now enforces the shape that its register-only
completion ABI can represent: at most 24 inline payload bytes and no transferred
capabilities. If an incompatible message is already queued when the operation
starts, admission reports `IncompatibleMessage` without consuming or truncating
the message and without retaining a deadline owner. The receiver can retrieve
the complete message through the ordinary buffered receive protocol.

While an operation-13 owner is pending, both inline and buffered send paths
validate the prospective delivery before capability derivation, message
publication, or receiver wakeup. An oversized payload or any capability transfer
is rejected with the sender's generic syscall error; buffered payload and
capability-request scratch storage are scrubbed on that path. Receivers without
a pending operation-13 owner retain the existing buffered IPC shapes and are not
restricted by this register-only ABI.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes 670
tests. The native kernel release build and the UEFI bootloader release builds for
`deadline_receive_probe`, `deadline_receive_message_probe`, and `service_probe`
all pass through `mrml`; the boot profiles report only their existing
unreachable-pattern warning. This is deterministic unit and cross-build
evidence. No KVM, WHP, or physical-hardware execution was performed for this
increment.

Patent review: `NOT_TRIGGERED` — bounded message-shape admission before
publication and non-consuming capacity rejection are conventional IPC boundary
validation. See `docs/patents/REVIEW_LOG.md`.

Deadline-aware delivery is now one kernel-owned executor transaction rather
than three dispatcher-managed steps. The executor determines whether the exact
receiver owns a pending operation 13, validates that delivery's complete shape,
publishes through the ordinary transactional IPC path, and consumes and
completes the exact retained owner before returning the endpoint sequence. The
UEFI deadline profiles use this composed entry point for both inline and
buffered sends; callers can no longer omit the shape gate or leave a published,
woken receiver awaiting a separate completion call.

The adversarial kernel test attempts a capability-bearing delivery to a pending
register-only receive and proves rejection preserves the owner, empty inbox,
empty receiver capability space, and endpoint sequence. A subsequent compatible
delivery receives sequence one, consumes the owner, and writes the exact saved
success context. `./target/debug/mrml test org.mrml.system.kernel --target
native` passes 671 tests. The native kernel release build and UEFI bootloader
release builds for `deadline_receive_probe`,
`deadline_receive_message_probe`, and `service_probe` pass through `mrml`; the
boot profiles retain only their existing unreachable-pattern warning. This is
unit and cross-build evidence, not KVM, WHP, or physical-hardware execution.

Patent review: `NOT_TRIGGERED` — composing validation, transactional IPC
publication, and retained-syscall completion behind one trusted entry point is
conventional state-machine encapsulation. See `docs/patents/REVIEW_LOG.md`.

Blocked operation-13 admission now returns an opaque
`DeadlineReceiveCancellation` alongside its scheduler transition while the
executor retains the same exact runtime/task/wait-generation owner. Trusted
cancellation must present that token; the executor exact-matches its retained
owner, invokes the runtime's existing one-use cancellation, consumes its owner,
and completes the suspended syscall with the generic error status and zero
detail registers. It never constructs cancellation authority from a task name.

Token substitution into another executor and replay after successful
cancellation both return `OwnerMismatch` without changing the live owner's
state. Cancellation fabricates no message and consumes no endpoint sequence: a
later ordinary delivery remains retrievable and receives sequence one. This is
a kernel mechanism for a future capability-authorized manager. No cancellation
syscall, ambient cross-task authority, or user-facing cancellation policy is
introduced by this increment.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes 672
tests. The native kernel release build and UEFI bootloader release builds for
`deadline_receive_probe`, `deadline_receive_message_probe`, and `service_probe`
pass through `mrml`; the boot profiles retain only their existing
unreachable-pattern warning. This is deterministic unit and cross-build
evidence, not KVM, WHP, or physical-hardware execution.

Patent review: `NOT_TRIGGERED` — exact one-use cancellation of a retained wait
owner and deterministic error completion are conventional asynchronous syscall
lifecycle handling. See `docs/patents/REVIEW_LOG.md`.

Cancellation arbitration now has explicit coverage for both competing winners.
A copied cancellation token presented after compatible message delivery returns
`OwnerMismatch` and cannot replace the saved successful payload completion.
The same token presented after exact timer expiry returns `OwnerMismatch` and
cannot replace the saved detail-free timeout completion. In both cases the
winner consumes the sole retained executor owner before the stale cancellation
is considered.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes 674
tests, and the native kernel release build passes through `mrml`. These are
deterministic in-memory race-order tests; they do not claim simultaneous hosted
interrupt execution or physical timer evidence.

Patent review: `NOT_TRIGGERED` — proving that one-use cancellation loses after
message or timeout completion is conventional event-race regression testing.
See `docs/patents/REVIEW_LOG.md`.

Timer expiration ownership is now checked before the runtime accounts the next
tick. `TaskRuntime` exposes a read-only preview of the exact bounded receive
identities due on that tick, using the same internal due-at predicate as commit.
The deadline executor first unique-matches every previewed identity to one
retained owner and a live saved context, then advances and expires the runtime,
and requires the committed expiration set to equal the preview before consuming
owners or writing timeout completions.

An adversarial test creates a deadline wait directly in the runtime without an
executor owner. The executor returns `OwnerMismatch` while the tick remains
zero, the task context remains byte-for-byte unchanged, and the original opaque
wait token can still cancel the live wait. Thus a composition error cannot wake
an unowned suspended syscall merely because its deadline became due.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes 675
tests. The native kernel release build and the UEFI bootloader release builds
for `deadline_receive_probe` and `deadline_receive_message_probe` pass through
`mrml`; the boot profiles retain only their existing unreachable-pattern
warning. This is deterministic unit and cross-build evidence, not KVM, WHP, or
physical timer execution.

Patent review: `NOT_TRIGGERED` — previewing a bounded due set before committing
the same timer transition is conventional transactional state-machine
validation. See `docs/patents/REVIEW_LOG.md`.

The composed runtime timer operation now prepares every due receive wake before
advancing the scheduler tick. It checks scheduler mutability, checked-adds the
next tick, computes the exact due set, and validates every wake identity first;
only then does a commit-only phase account the tick, clear the matching waits,
and make those tasks runnable. The standalone already-accounted expiry path
reuses the same due-set, wake-preparation, and commit helpers.

Existing retirement serialization coverage now also invokes both next-tick
preview and the composed tick/expiry operation while a retirement dispatch is
pending. Both return `RetirementDispatchPending`, and the scheduler tick remains
unchanged. Together with the unmatched-owner test, this closes ordinary
error-return paths after timer mutation; internal post-prevalidation
contradictions remain fail-stop invariants.

The Linux-host kernel suite remains at 675 passing tests. The native kernel
release build and the `deadline_receive_probe` UEFI bootloader release build
pass through `mrml`, with only the boot profile's existing unreachable-pattern
warning. This is deterministic unit and cross-build evidence only.

Patent review: `NOT_TRIGGERED` — preparing a bounded set of scheduler wakes
before a commit-only timer transition is conventional transactional scheduling.
See `docs/patents/REVIEW_LOG.md`.

The service supervisor now composes deadline cancellation with its existing
exact service-object `CONTROL` boundary. Cancellation succeeds only when the
supplied service generation is live and running, the capability has exactly
`CONTROL` rights for that service object, the opaque cancellation token names
that service's exact task generation, and the deadline executor still retains
the matching wait owner. The supervisor then delegates to the executor's
one-use cancellation transition; it never reconstructs a wait from the service
or task name.

Focused coverage proves a control capability for another object is rejected,
valid control for a different running service cannot substitute for the token's
task, exact control plus the exact token succeeds, and replay reaches the typed
deadline `OwnerMismatch`. Failed authorization and task substitution leave the
original owner pending. This is a kernel composition API for a trusted manager;
no user-facing cancellation syscall or implicit first-party privilege exists.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes 676
tests, and the native kernel release build passes. The service-image release
builds for `deadline_receive_probe` and
`deadline_receive_message_probe` pass with their expected 14 and 13 dead-code
warnings, and the deadline UEFI bootloader release build passes with its
existing unreachable-pattern warning. All successful builds used `--target
native` for the MRML-native service image; an initial `--target mrml-x86_64`
invocation was rejected as `UnsupportedTarget` before compilation and provides
no product evidence. No hosted or physical execution was performed.

Patent review: `NOT_TRIGGERED` — requiring both exact object capability
authorization and a one-use wait token for cancellation is conventional
capability-checked lifecycle composition. See `docs/patents/REVIEW_LOG.md`.

The deadline dispatcher now retains every issued cancellation token in a
separate fixed-capacity `DeadlineReceiveCancellationEscrow`. Retention rejects a
duplicate task owner and full capacity without replacing any token. Lookup
unique-matches the exact generational task, while retirement also exact-matches
the complete opaque wait token; substitution and replay return the existing
typed owner errors.

Operation-13 block admission escrows the token before switching tasks. The
deadline-aware send path prevalidates the matching escrow entry before IPC
publication and retires it only after message completion succeeds. The timer
path previews the exact next-tick expiration set and prevalidates all matching
escrow entries before the executor advances time, then retires exactly the
tokens corresponding to the committed expiration set. Any disagreement is a
fail-stop dispatcher invariant, never a task-name fallback.

The kernel escrow test covers duplicate retention, bounded capacity, wrong-task
lookup, exact retirement, replay, and capacity reuse after retirement. The
Linux-host kernel suite passes 677 tests and its release build passes. Both
deadline service-image release profiles pass with their expected 14 and 13
dead-code warnings, and both deadline UEFI bootloader release profiles pass
with their existing unreachable-pattern warning. This establishes bounded
dispatcher ownership and cross-builds only; no manager cancellation request or
hosted/physical execution is claimed yet.

Patent review: `NOT_TRIGGERED` — fixed-capacity escrow of opaque one-use
cancellation tokens with exact retirement is conventional lifecycle ownership.
See `docs/patents/REVIEW_LOG.md`.

The pointer-free syscall decoder now assigns operation 14 to
`CancelReceive { capability, service }`. Only the task-local service `CONTROL`
capability token in `rdi` and generational service ID in `rsi` are admitted;
both must be nonzero valid-shaped handles and every other argument register must
be zero. The opaque cancellation token remains kernel-internal and is never
serialized into the syscall ABI.

`ServiceSupervisor` now provides a requester-bound escrow composition. It
resolves the live service object, requires the requesting task's capability to
carry exactly `CONTROL` for that object, requires a running exact task, then
looks up and consumes the escrowed wait through the deadline executor. Escrow
retirement follows successful cancellation as a fail-stop invariant. An
overbroad `CONTROL|READ` handle is rejected before escrow mutation; exact
requester authority succeeds. Wrong authority and replay retain their typed
detail-free error paths.

The timer-backed deadline dispatcher routes operation 14 through this composed
path. Existing non-deadline service profiles decode the canonical operation but
return generic error because they have no deadline executor or escrow; they do
not reinterpret it. No service image invokes operation 14 yet, so live
cancellation proof remains the next separate integration gate.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes 679
tests, and the native kernel release build passes. The default service and both
deadline UEFI bootloader release profiles cross-build with only their existing
unreachable-pattern warning. This is decode, authorization, unit, and
cross-build evidence only.

Patent review: `NOT_TRIGGERED` — decoding two opaque handles and composing exact
task-local capability authorization with kernel-owned cancellation escrow is
conventional capability-based syscall dispatch. See
`docs/patents/REVIEW_LOG.md`.

A dedicated `deadline_receive_cancel_probe` service profile now exercises the
canonical cancellation request without reinterpreting yield or IPC. Its
receiver enters operation 13 with a bounded one-million-tick timeout and accepts
only generic-error completion with all detail registers zero. Its sender holds
an exact task-local `CONTROL` capability for the receiver's supervised object,
invokes operation 14 with that capability and exact service generation,
requires detail-free success, and yields so the cancelled receiver can resume.
The receiver then emits the distinct proof value `0x2c`; timeout remains `0x2a`
and message completion remains `0x2b`.

The corresponding UEFI profile provisions only that exact receiver-control
handle into the sender's capability space and passes the receiver service ID.
The cancellation request resolves the already-escrowed token, completes the
receiver with error, retires both owner records, and leaves the timer deadline
unable to win later. No cancellation token or task ID is accepted from the
service request.

The cancellation service-image release profile cross-builds with 13 expected
dead-code warnings, and its UEFI bootloader release profile cross-builds with
the existing unreachable-pattern warning. The timeout and message profiles also
continue to cross-build with their respective 14/13 service warnings and the
same boot warning. Whole-file rustfmt checking of the service source still
reports unrelated pre-existing block/deployment formatting drift, so no broad
mechanical rewrite was included. This is profile and cross-build evidence only;
`0x2c` has not yet been observed under a hosted backend or on physical hardware.

Patent review: `NOT_TRIGGERED` — a dedicated capability-authorized cancellation
integration probe with a distinct exact proof marker is conventional syscall
regression testing. See `docs/patents/REVIEW_LOG.md`.

The hosted KVM and WHP runners now route the dedicated
`deadline-receive-cancel-probe` through the same timer-capable, local-APIC,
three-service guest preparation used by the timeout and message-completion
profiles. Their proof selection remains mode-bound: timeout requires exactly
`0x2a`, message completion exactly `0x2b`, and supervised cancellation exactly
`0x2c`. The KVM validator rejects noncanonical expected values and proof-marker
substitution, including attempts to satisfy one deadline mode with another
mode's marker.

`./target/debug/mrml test org.mrml.tool.vmm-kvm-run --target linux` passes all
16 tests, and the Linux KVM runner release build passes with its existing 25
CUDA/PTX warnings. An initial native-target test request was correctly rejected
with `NoMatchingComponents { target: MRML_NATIVE }` and is not counted as test
evidence. The WHP runner contains the symmetric mode and proof routing, but its
Windows release build remains unavailable in this environment because the
`cross_host_rust_target` component is absent. Whole-file rustfmt checks continue
to report unrelated pre-existing formatting drift in both large runner sources,
so this increment does not apply a broad mechanical rewrite. `/dev/kvm` is not
available here, so no KVM guest execution, WHP execution, proof-port observation,
or physical-hardware verification is claimed.

Patent review: `NOT_TRIGGERED` — selecting an existing bounded guest profile and
exactly matching a mode-specific regression marker is conventional hosted test
runner routing. See `docs/patents/REVIEW_LOG.md`.

Deadline-receive completion now distinguishes all three terminal outcomes in
the pointer-free syscall ABI. Existing codes remain stable (`Success = 0`,
generic `Error = 1`, and `TimedOut = 2`), while an authorized cancellation wakes
the exact blocked receiver with the new `Cancelled = 3` status. Every result
register other than the status is cleared. The cancellation manager still
receives its separate detail-free success response; it cannot choose or forge
the blocked receiver's completion status.

Both syscall-frame representations expose the same detail-clearing completion,
and the deadline executor uses it only after exact token cancellation succeeds.
Focused tests require cancellation to differ from both generic failure and
timeout. The service cancellation probe now accepts only `Cancelled` before it
emits `0x2c`, so a regression to generic failure cannot satisfy the profile.

`./target/debug/mrml test org.mrml.system.kernel --target native` passes all 679
tests. Native kernel and cancellation service-image release builds pass; the
service image emits its existing 13 dead-code warnings. The matching
`uefi-x86_64` cancellation bootloader release profile passes with its existing
unreachable-pattern warning. Two noncanonical `uefi`/`UEFI` target requests
were rejected as `UnsupportedTarget` before compilation and are not evidence.
This is unit and cross-build evidence only; no hosted guest or physical machine
executed the updated completion.

Patent review: `NOT_TRIGGERED` — assigning a distinct bounded integer result to
an existing cancellation transition is conventional syscall result typing. See
`docs/patents/REVIEW_LOG.md`.

The adversarial `deadline_receive_cancel_denied_probe` profile now proves that
cancellation authority is not inferred from service identity or mere object
possession. The sender receives only a task-local `READ` handle for the exact
receiver service object, then submits the otherwise canonical operation-14
request. It requires a detail-free generic error from that request. The blocked
receiver must remain owned by its original deadline, complete only as
`TimedOut`, and emit the distinct proof marker `0x2d`. Thus denial followed by
an accidental cancellation, escrow loss, or indefinite suspension cannot
satisfy the profile.

The KVM and WHP runners select the same timer-capable three-service guest for
this mode and bind `0x2d` only to the denial profile. KVM's canonical proof
validator now admits exactly `0x2a` through `0x2d`; tests accept the exact denial
marker while rejecting cross-mode substitution and the noncanonical `0x2e`.

Both the denied and successful-cancellation service-image release profiles
cross-build with their existing 13 dead-code warnings, and both corresponding
`uefi-x86_64` bootloader profiles cross-build with the existing unreachable-
pattern warning. The Linux KVM runner's 16 tests and release build pass, the
latter with its existing 25 CUDA/PTX warnings. WHP source has symmetric routing,
but its Windows build remains unavailable because `cross_host_rust_target` is
absent. Whole-file rustfmt checking continues to expose unrelated pre-existing
drift in the large service, boot, and runner sources; only the newly changed
hunks were kept rustfmt-conformant. `/dev/kvm` is absent, so this is unit and
cross-build evidence, not a hosted proof-port observation or physical-hardware
result.

Patent review: `NOT_TRIGGERED` — exercising capability denial while requiring
the pre-existing timeout to remain authoritative is conventional adversarial
authorization testing. See `docs/patents/REVIEW_LOG.md`.

The `deadline_receive_cancel_replay_probe` now exercises the one-use property
through the canonical CPL3 interface rather than only inside kernel tests. A
sender holding exact task-local `CONTROL` submits the same operation-14 request
twice for one blocked receiver. The first request must return detail-free
success and complete that receiver as `Cancelled`; the immediate replay must
return detail-free generic error because the kernel-owned escrow entry has
already retired. Only after both results match does the sender yield. The
receiver accepts only its original `Cancelled` completion and emits the
replay-specific proof marker `0x2e`.

KVM and WHP select the same bounded timer-capable three-service guest for this
profile. KVM binds `0x2e` only to replay mode, accepts canonical deadline proof
markers exactly from `0x2a` through `0x2e`, and rejects both cross-mode marker
substitution and noncanonical `0x2f`.

The replay service-image release profile and matching `uefi-x86_64` bootloader
profile cross-build with the existing 13 dead-code warnings and one unreachable-
pattern warning respectively. Rebuilt ordinary-success and denied-cancellation
service profiles also pass. One concurrent pair of MRML-native service builds
collided in the shared target directory while creating a crypto archive; the
exact denied profile passed when rerun alone, so the collision is recorded as a
build-orchestration limitation rather than product evidence. The Linux KVM
runner's 16 tests and release build pass with the existing 25 CUDA/PTX warnings.
WHP remains unbuilt because `cross_host_rust_target` is absent, and `/dev/kvm`
remains unavailable. No hosted proof-port or physical-hardware result is
claimed.

Patent review: `NOT_TRIGGERED` — replaying an already-consumed cancellation
request and requiring fail-closed rejection is conventional one-use token
testing. See `docs/patents/REVIEW_LOG.md`.

The deadline executor can now validate that its retained blocked-receive owners
and the dispatcher's cancellation escrow form one exact bijection. Every live
executor owner must have the identical opaque cancellation value in escrow, and
every escrow entry must resolve to that exact executor owner. Missing, excess,
duplicate-task, and substituted state returns `OwnerMismatch`; names or task
slots are never sufficient to repair a disagreement.

The service-supervisor escrow cancellation compositions perform this validation
before authority resolution and again after successful retirement. The UEFI
deadline dispatcher also checks coherence before receive admission,
capability-authorized cancellation, timer expiry, and IPC delivery, and after
each paired mutation becomes externally observable. Any unexpected half-state
halts the controlled profile rather than continuing with reduced cancellation
coverage or leaked fixed capacity.

Lifecycle inspection confirmed that voluntary service exit and trap-fault
retirement operate only on the current task, while a deadline-blocked task is
not current; those paths therefore cannot directly retire a blocked owner. The
new invariant covers the actual cross-table risk at dispatcher boundaries
without inventing a task-name cleanup path. Adversarial tests construct both
executor-only and escrow-only intermediate states, require rejection without
losing the live wait, and prove coherence is restored only after the exact pair
is retained or retired. Supervisor composition also rejects a missing escrow
entry before consuming its executor owner.

The native kernel suite passes 680 tests and its release build passes. Timeout,
message-completion, and cancellation-replay service-image release profiles pass
with their existing 14/13/13 dead-code warnings, and all three matching
`uefi-x86_64` bootloader profiles pass with the existing unreachable-pattern
warning. This is unit and cross-build evidence; `/dev/kvm` is unavailable and
no WHP, hosted guest, proof-port, or physical-hardware execution is claimed.

Patent review: `NOT_TRIGGERED` — exact bidirectional consistency checking across
two fixed-capacity owner tables is conventional defensive state validation. See
`docs/patents/REVIEW_LOG.md`.

Version-1 supervision requests now assign operation 4 to `CancelReceive` rather
than leaving deadline cancellation as a probe-only wire exception. The existing
48-byte canonical request remains unchanged: request ID and generational service
identity are encoded, the payload capability field and target field must be
zero, and exactly one capability must arrive in the independent message
authority envelope. Missing, excess, inline-forged, or wrong-operation authority
is rejected before the cancellation authorizer is called.

The new `ServiceReceiveCancellationAuthorizer` exposes only the constrained
non-extractable operation. Its canonical envelope dispatcher returns a 48-byte
detail-free supervision response: success preserves `Running` because cancelling
a wait does not stop the service, while authorization or lifecycle denial is a
generic rejected response. The general in-kernel supervision-message dispatcher
still rejects this operation because it lacks the separately composed deadline
executor and escrow; it does not silently reinterpret or partially perform it.

The service image's kernel adapter translates this one operation to syscall 14,
requires every syscall detail register to remain zero, and maps only success or
generic denial into the protocol result. The successful, unauthorized, and
replay cancellation profiles now construct and decode the canonical supervision
request/response around that adapter. This exercises the codec and constrained
authorizer in the signed service binary, but it is not yet a separate manager-
process buffered-IPC forwarding path.

All 54 native configuration-service tests pass, including exact authority-
envelope success, denial, missing capability, and excess capability cases, and
the configuration-service release build passes. All three cancellation service-
image release profiles pass with 12 expected dead-code warnings, and their
matching `uefi-x86_64` bootloader profiles pass with the existing unreachable-
pattern warning. No hosted or physical execution is claimed.

Patent review: `NOT_TRIGGERED` — extending a fixed versioned request enum with a
canonical capability-envelope operation is conventional service-protocol work.
See `docs/patents/REVIEW_LOG.md`.

The cancellation profiles now route operation 4 through a distinct third CPL3
manager service rather than calling the envelope adapter in the requesting
service. After the deadline receiver blocks, the manager blocks on the existing
buffered control endpoint. The sender publishes the canonical 48-byte request
and derives only the requested service authority into the manager: exact
`CONTROL` for success/replay or exact `READ` for the denial profile. The
sender's source handle carries `DELEGATE`, but that bit is attenuated from the
received manager handle and therefore cannot broaden the kernel request.

The manager receives exactly one transferred capability, invokes the constrained
supervision adapter, releases the received handle, and returns a capability-free
canonical response over buffered IPC. Replay repeats that complete transfer and
release cycle, so its second denial is proven after a fresh authority envelope
rather than by reusing a manager-local handle. The manager then exits through a
dedicated supervised cleanup path that verifies its exact third service becomes
`Exited` with no pending cleanup. It has no preprovisioned receiver-control
handle and cannot manufacture one from the service ID.

For successful cancellation, the resumed receiver yields once before publishing
its proof marker so the sender must first consume and validate the manager's
response. Denial leaves the receiver blocked under its original timeout. Thus
the existing `0x2c`, `0x2d`, and `0x2e` markers now cover manager-process request,
attenuated capability transfer, kernel authorization, response validation,
received-handle release, and supervised manager exit in the signed image.

All three cancellation service-image release profiles cross-build with 10
expected dead-code warnings, and their matching `uefi-x86_64` bootloader
profiles cross-build with the existing unreachable-pattern warning. The
pre-existing service-restart-request boot profile also passes after sharing the
third-service construction. These are cross-builds only; `/dev/kvm` remains
absent, so no proof marker was observed under KVM/WHP or physical hardware.

Patent review: `NOT_TRIGGERED` — forwarding a fixed request through isolated
buffered IPC with attenuated capability transfer and explicit handle release is
conventional capability-oriented service composition. See
`docs/patents/REVIEW_LOG.md`.

A deterministic native simulation now composes the same manager-mediated path
across three real `TaskRuntime` domains. The receiver enters a deadline wait and
retains its opaque cancellation in escrow; the manager blocks; and the sender
delivers canonical requests plus attenuated task-local derivations through the
kernel-owned inbox. The sender blocks for each response, which schedules the
manager to consume the queued message and authorize cancellation solely with
the received task-local handle.

The simulation now first transfers only attenuated `READ`. The manager returns
and the sender consumes a canonical rejected response, releases that received
handle, and proves the exact executor/escrow pair remains live and coherent.
Only a second independently delivered request carrying exact `CONTROL` may then
cancel the same wait. This makes denial non-destructive and proves that a later
success cannot reuse or broaden the rejected authority.

After that success, the sender consumes the canonical successful response and
transfers a fresh exact `CONTROL` derivation for a replay request. The manager
receives valid authority but returns a canonical rejection because the executor
owner and escrow entry are already absent, releases the fresh handle, and leaves
the empty tables coherent. Thus a live service identity plus newly delegated
authority cannot recreate or replay a consumed cancellation transition.

The test requires cancellation to wake the receiver with the distinct
`Cancelled` completion, retire both executor and escrow state coherently, and
leave the sender's `CONTROL | DELEGATE` source handle authorized. It explicitly
revokes the manager's received derivation before sending a capability-free
canonical response, then retires and completes cleanup for the manager service.
Capability tokens remain opaque and task-local: equal numeric slot/generation
values in different task spaces are not treated as shared identity or authority.

All 55 native configuration-service tests pass, including the complete
three-domain scheduling, denial, fresh capability transfer, cancellation,
response consumption, replay rejection, release, and manager-cleanup
simulation. This is deterministic unit simulation evidence; it does not add
KVM, WHP, hosted guest, proof-port, or physical-hardware execution evidence.

Patent review: `NOT_TRIGGERED` — composing existing bounded scheduling,
capability transfer, cancellation, and supervised cleanup mechanisms in a
deterministic test is conventional verification work. See
`docs/patents/REVIEW_LOG.md`.
