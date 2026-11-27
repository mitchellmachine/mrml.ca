# MRML linker

Status: **PARTIALLY IMPLEMENTED**.

Engineering Constitution record:

```text
Complexity impact: MEDIUM
TCB impact: NONE
New parser boundary: YES
New authority model: NO
New persistent state: NO
External dependency: NO
Failure isolated: YES
Existing-object reuse: HIGH
```

The linker adds adversarial object, archive, and executable-format parser
boundaries, but remains an isolated build tool with bounded allocation and no
runtime authority. It reuses the compiler's existing object contracts and the
public platform formats rather than adding a package or loading architecture.

The first MRML-owned linker increment is a dependency-free, bounded x86-64
static-link core in `packages/compiler/core/src/linker.rs`. It accepts already
decoded code and read-only-data fragments, resolves one defined symbol per
input plus up to 256 additional checked text-offset definitions, freezes a
deterministic 16-byte-aligned layout, copies disjoint ranges,
and applies checked signed 32-bit PC-relative relocations. Duplicate or missing
symbols, malformed names, invalid relocation fields, arithmetic overflow,
capacity exhaustion, and displacement overflow fail closed.

The core also decodes the exact bounded x86-64 COFF subset currently emitted by
`mrml-rustc`: one `.text`, an optional `.rdata`, short or string-table symbol
names, bounded external text definitions and undefined symbols, and
`IMAGE_REL_AMD64_REL32` relocations. Machine, section, symbol, string-table,
range, relocation-type, and truncation checks precede linking. This is compiler
object ingestion, not general COFF compatibility.

The extended COFF and ELF64 decoders retain multiple external/global text
definitions from one object with checked section-relative offsets. Relocations
to any definition in the originating text section use a separate typed local
target, so local and section symbols never enter the global namespace or
collide across objects. Archive selection considers every global definition;
entry lookup and cross-object relocations resolve to the definition's exact
text offset. The original single-definition decoder entry points remain as
fail-closed compatibility surfaces, while the driver uses the extended bounded
entry points. Weak definitions, COMDAT groups, symbol versions, and general
visibility/preemption semantics remain unsupported.

The bounded COFF decoder additionally accepts one nonempty long-name
`.text$...` code section, uses its actual section number for definitions and
internal relocations, and ignores only validated empty `.text`, `.data`, and
`.bss` placeholders plus conventional file/feature records. The archive driver
skips exactly `lib.rmeta` and `lib.rmeta-link` metadata members. In a controlled
Windows probe, exact `nightly-2026-08-24` gnullvm rustc with
`-C embed-bitcode=no` emitted a 2,452-byte no-std `.rlib` containing one such
COMDAT object. MRML linked its exact mangled entry to a 1,024-byte PE and Windows
returned 42. This establishes one simple hosted pinned-rustc `.rlib` shape only;
multiple COMDAT sections, COMDAT selection, writable/BSS data, unwind sections,
embedded bitcode sections, general metadata naming, and representative Rust
libraries remain unsupported.

The same format-neutral link core now decodes the exact bounded ELF64
relocatable subset emitted by `mrml-rustc`: x86-64 little-endian ET_REL,
`.text`, optional `.rodata`, `.rela.text`, `.symtab`, and their linked string
tables. It accepts the compiler's `R_X86_64_PC32` and `R_X86_64_PLT32` records,
retains explicit RELA addends, types local read-only targets separately, and
rejects unknown sections, machines, relocation types, malformed links,
truncation, and range or capacity violations. This is not general ELF input or
an ELF executable claim.

The linker serializes decoded inputs as a deterministic, fixed-address,
import-free x86-64 ELF ET_EXEC image. It emits a read-only header load, a
page-separated RX text load, and an optional page-separated R/NX read-only-data
load; section headers and dynamic metadata are absent. An Arch Linux WSL
controlled probe normalized an independently assembled syscall-only object to
the bounded five-section input subset, linked it through
`mrml-rustc-driver --link-elf`, and `readelf` observed entry `0x401000` plus
separate R and RX loads. Linux executed the 4,112-byte result and returned exit
code 42. This is hosted Arch WSL loader evidence, not the unavailable MRML Linux
test target, KVM, boot, or physical-hardware evidence.

Relocation targets are typed as either a named code symbol or a bounded offset
within the originating input's read-only data. COFF `.rdata` section-symbol
relocations therefore retain their exact local data identity without inventing
a public symbol or entering the global name-resolution path.

The linker can serialize those inputs as a deterministic, import-free x86-64
PE32+ executable. It links with page-separated code and data before applying
relocations, then emits a fixed-base image with zero timestamps, an RX `.text`,
an R/NX `.rdata`, bounded file/section alignment, and no data directories. A
Windows gnullvm-hosted test executes a generated six-byte entry function in a
child process and requires exit code 42. This is controlled hosted Windows
loader evidence, not Secure Boot, recovery, UEFI, or physical-hardware evidence.

`mrml-rustc-driver --emit pe` selects this path explicitly. The driver compiles
the requested function to MRML COFF in memory, decodes it, links it, and writes
the bounded PE image without spawning `rust-lld`. Existing `--emit coff` and
`--emit elf64` modes retain object-only behavior; an unknown emit kind fails
rather than falling back. A release-driver controlled probe compiled an
independent constant-return source through `--emit pe`, produced a 1,024-byte
single-section image, and the Windows host observed exit code 42. Empty
read-only data omits `.rdata` rather than emitting a loader-invalid zero-sized
section.

`mrml-rustc-driver --link-coff INPUT... --entry NAME -o OUTPUT` exposes the same
bounded path without compilation. It accepts one through 256 ordered inputs,
loads every bounded object before decoding, gives each input independent
relocation storage, and retains the input order through deterministic layout.
Object-data and relocation-storage lifetimes are distinct in the core API, so
the driver can safely retain all decoded inputs without self-references or raw
pointer assembly. A release-driver probe compiled two separately named objects,
linked both, produced a 1,024-byte PE, and Windows observed exit code 42. This
linker-only mode is the comparison surface for identical-input cold-process
measurements against the pinned gnullvm `rust-lld`; it does not accept arbitrary
COFF extensions outside the documented MRML subset.

The corresponding explicit Linux-family selections are
`--emit elf-executable` and `--link-elf INPUT... --entry NAME -o OUTPUT`. They use
ELF64 object emission/decoding and the MRML ELF serializer without silently
invoking a system linker.

The linker also has an allocation-free Unix archive container decoder bounded
to 256 object members. It validates the global magic, every fixed header,
decimal size arithmetic, member terminators, payload ranges, and even-byte
padding. Ordinary names, GNU `//` long-name tables and `/offset` references,
and BSD `#1/length` embedded names are decoded; conventional symbol-index
members are treated as metadata. The driver decodes candidate members in order
under the same total 256-input bound, always admits explicit objects, and admits
an archive member only when it defines the entry or a named relocation target
from an already selected input. A stable fixed point follows transitive archive
dependencies while the first selected definition suppresses later unused
duplicates. The result does not depend on trusting archive index metadata.
The driver assigns each archive a bounded identity and applies left-to-right
ordering: explicit objects are admitted when encountered, one archive rescans
only its own contiguous members to a fixed point, and it is not revisited for
undefined symbols introduced by later inputs. Index-accelerated extraction,
explicit start/end archive groups, other non-object metadata members, and
general `.rlib` admission remain incomplete, so this is not yet the ordinary
Rust static-library path. GNU thin archives admit validated ordinary and
long-table member paths. When all preceding inputs have an exact bounded symbol
inventory, the hosted driver uses the untrusted GNU index only to identify
candidate external members, opens each candidate under the existing 64 MiB
bound, independently verifies its definitions and references, and continues to
a stable unresolved-symbol fixed point. Unselected members become empty
metadata placeholders in the bounded materialized archive, preserving original
member identities without reading their external files. A missing index or a
preceding ordinary archive conservatively restores eager materialization. Every
opened path is resolved relative to the archive and rejects absolute paths,
parent traversal, and canonical/symlink escape from that directory. BSD
extended names in thin archives remain unsupported; BSD extended-name symbol
indexes in ordinary archives are skipped only after their embedded names are
validated.

The ordered selector also has an explicit bounded object-member identity. A
selected nonzero `(archive, member)` pair admits all of that object's fragments
atomically, while explicit inputs must retain member identity zero. This is the
selection foundation required for gnullvm COFF objects whose `.text$...`,
`.xdata$...`, and `.pdata$...` sections must remain distinct; the current COFF
decoder still rejects that multi-section shape until fragment-relative symbols,
relocations, and PE exception metadata are represented end to end.

The core now inventories up to 16 COFF sections and can decode a requested
nonempty `.text`/`.text$...` fragment by section order. Cross-fragment external
REL32 targets remain named symbols, while same-fragment targets remain checked
local offsets. The legacy one-input decoder explicitly rejects multiple text
fragments and any nonempty `.pdata$...` or `.xdata$...` section, preventing
metadata loss. A synthetic two-fragment object test resolves and links an entry
call to its sibling helper. The driver now expands each COFF object into its
bounded text-fragment count, allocates relocation and definition arenas to the
exact expanded count, and propagates the source `(archive, member)` identity to
every fragment before object-atomic selection. Objects with unwind sections
still reject before expansion, so ordinary unwind-bearing gnullvm objects are
not yet admitted.

The PE serializer now accepts up to 4,096 typed AMD64 runtime-function records,
matching the retained-fragment ceiling so an atomically selected COFF member
cannot retain code while losing its bounded exception metadata.
It resolves checked begin/end symbols and offsets, rejects empty unwind data or
non-increasing ranges, places unwind bytes in the read-only NX section, sorts
12-byte function-table records by begin RVA, and publishes the exact `.pdata`
range through data-directory entry 3. The existing PE API delegates with an
empty record set and remains byte-compatible. COFF `ADDR32NB` decoding and
driver transport are still required before gnullvm unwind sections are admitted.

The COFF core now decodes bounded `.pdata$...` records into that typed form.
Each 12-byte record must have exactly three `IMAGE_REL_AMD64_ADDR32NB`
relocations at offsets 0, 4, and 8. Begin/end targets resolve deterministically
to the first zero-offset external definition in a bounded text section;
additional names at that exact section and offset are aliases. The third target
must resolve at offset zero in a nonempty `.xdata$...` section. Section indices,
symbol records, addends, payloads, and record capacity are checked.

Projected COFF COMDAT read-only sections also retain exact source-object and
section identities when referenced by writable `ADDR64` fields or when their
own absolute relocation fields are patched. PE layout resolves those identities
once against retained fragment definitions and checks the fragment-relative
offset. Ordinary non-COMDAT read-only spans continue to use their bounded
owner-symbol path.

The PE driver now transports unwind records only from source objects whose
`(archive, member)` identity survived object-atomic selection. One reusable
bounded scratch arena decodes each selected object, copied typed records retain
only references to immutable object bytes, and payload-tier selection includes
unwind bytes plus aligned runtime-function entries. The exact pinned
`nightly-2026-08-24` gnullvm two-function no-std `.rlib` linked to a 1,536-byte
PE; Windows returned 42. Its exception directory identified one 12-byte record
covering RVA `0x1000..0x100f` with unwind data at RVA `0x2000`. This proves that
one exact unwind-bearing rlib shape works on the hosted Windows environment,
not general Rust library or exception-semantics coverage.

The COFF fragment decoder also accepts one nonempty `.rdata$...` COMDAT as the
input's typed read-only bytes. Existing same-object REL32 handling maps an
external definition at offset zero to `ReadonlyData`, so long-name rustc static
data does not become a global text symbol or executable content. Multiple
nonempty read-only sections remain rejected. The pinned volatile-static probe
also emitted a writable `.data$...` COMDAT with an `ADDR64` relocation; that
section still fails closed pending an explicit writable layout and fixed-base
relocation model, so the complete probe does not yet link.

The PE serializer now has an explicit bounded writable-data input. It emits a
separate page-aligned `.data` section with read/write and non-executable
characteristics, validates every eight-byte field, and resolves typed `ADDR64`
targets to absolute addresses in an owning input's checked read-only layout.
The later base-relocation milestone supersedes the original fixed-base output
for images containing absolute VA fields. COFF writable-section decoding and
driver transport remain separate gates at this historical checkpoint.

The COFF core now decodes one nonempty initialized RW/non-executable
`.data$...` section into typed writable bytes. Every relocation must be an
eight-byte AMD64 `ADDR64` field whose checked symbol and addend resolve inside
the object's single admitted read-only section. Text-fragment decoding
recognizes the section without folding it into code, while the legacy decoder
explicitly rejects it to prevent silent data loss. Multiple writable sections,
other target classes, and driver transport remain unsupported.

The PE driver now decodes writable data only for selected source-object
identities, retains each object's independent relocation arena, includes the
bytes in payload-tier selection, and passes the typed views to the fixed-base
serializer. The exact pinned volatile-static object linked to a 2,048-byte PE;
Windows returned 42. The image has three sections, `.data` is at RVA `0x3000`
with `0xc0000040` RW/NX characteristics, and its pointer field contains the
exact fixed address `0x140002000` of the read-only value.

The controlled 93-byte no-data benchmark measured MRML at 9.577 ms median and
9.759 ms mean versus pinned gnullvm rust-lld at 26.952 ms median and 27.186 ms
mean over 50 iterations after five warmups. Both 1,024-byte outputs returned
42. These hosted probes establish one static-data shape and narrow regression
evidence, not general writable-data, COMDAT, or performance coverage.

The later bounded fragment milestone supersedes the earlier single-section
limits for the pinned COFF shape. Adjacent nonempty `.rdata$...` sections form
one zero-copy read-only span, and each `.data$...` section is decoded by index
with an independent checked relocation arena. Static functions in separate
`.text$...` sections use their section identity as a local relocation target;
those targets resolve after atomic object-member selection but do not make an
archive member eligible or expose the static Rust symbol as a global
definition. Duplicate section identities fail closed.

An exact ORACLE-0002 object containing two text fragments, two statics, entry
unwind metadata, two adjacent read-only fragments, and two writable pointer
fragments linked to a 2,048-byte PE and returned 42 on Windows. On the same
1,536-byte input, 50 iterations after five warmups measured MRML at 9.590 ms
median and 9.822 ms mean versus pinned gnullvm rust-lld at 27.162 ms median and
27.249 ms mean. Both outputs were 2,048 bytes and returned 42. This is narrow
hosted evidence for that object shape, not representative-library or general
performance superiority evidence.

Pinned gnullvm rlibs may also carry `.llvmbc` and `.llvmcmd` sections marked
`IMAGE_SCN_LNK_REMOVE`. The COFF decoder now admits only those exact names when
the remove bit is present and the section has no relocations; their bytes and
symbols never enter the linked image. Missing remove semantics or any metadata
relocation fails closed. An exact 7,946-byte rlib containing three text
fragments and three runtime-function records linked to a 1,536-byte PE and
returned 42. Over 50 iterations after five warmups, MRML measured 9.751 ms
median and 9.820 ms mean versus pinned rust-lld at 27.283 ms median and 27.384
ms mean. rust-lld's output was 1,024 bytes while MRML's was 1,536 bytes, so the
measurement establishes executable agreement and a narrow timing observation,
not byte identity or a general performance claim.

The COFF parser's explicit section bound is now 256 rather than the earlier
incidental 16. All per-section classification arrays use the same bound, while
text fragments, total link inputs, definitions, relocations, runtime functions,
and writable fragments retain their independent existing limits. A synthetic
control rejects section count 257 before reading section headers. An exact
ORACLE-0002 14,606-byte rlib with a 9,519-byte, 32-section object member, eight
static framed helpers, nine text fragments, and nine runtime-function records
linked to a 1,536-byte PE and returned 42. The same-input benchmark measured
MRML at 9.807 ms median and 10.055 ms mean versus pinned rust-lld at 27.483 ms
median and 27.500 ms mean over 50 iterations after five warmups. Output sizes
were 1,536 and 1,024 bytes respectively; this remains a small hosted scaling
probe, not representative-library or general superiority evidence.

After this integration, the controlled 93-byte no-unwind object benchmark ran
50 iterations after five warmups. MRML measured 10.081 ms median and 10.260 ms
mean versus pinned gnullvm rust-lld at 27.632 ms median and 27.791 ms mean. Both
1,024-byte outputs returned 42. This is narrow regression evidence, not a
general performance claim.

After driver fragment expansion, the controlled one-object procedure measured
MRML at 9.275 ms median and 9.361 ms mean versus pinned gnullvm rust-lld at
26.598 ms median and 26.981 ms mean across 50 iterations after five warmups.
Both 1,024-byte outputs returned 42. This confirms that exact-count arena
allocation preserved the narrow fast path; it is not multi-fragment,
archive-scale, or general superiority evidence.

On 2026-08-28, the controlled Windows cold-process probe linked the same
93-byte MRML COFF object 50 times after five interleaved warmups. MRML produced
a 1,024-byte PE with a 10.196 ms median and 10.323 ms mean; pinned
`nightly-2026-08-24` gnullvm `rust-lld` produced a 1,024-byte PE with a
26.870 ms median and 27.184 ms mean. Both executables returned 42. This is a
2.64x median speedup for one tiny import-free object on this host. It is not a
large-program, archive, debug-info, parallel-scaling, or general superiority
claim. `docs/compiler/linker/benchmark-windows.ps1` preserves the identical-
input procedure.

After the input ceiling rose to 256, using the maximum multi-megabyte output
arrays for every link regressed this same single-object median to 15.232 ms.
The driver now selects one of three compile-time-bounded output tiers from the
validated selected text/read-only payload plus conservative alignment
headroom. Repeating the exact 50-iteration procedure after that change measured
MRML at 9.465 ms median and 9.550 ms mean versus rust-lld at 26.888 ms median
and 27.065 ms mean. Both outputs remained 1,024 bytes and returned 42. This is a
2.84x median result for the same narrow workload and demonstrates removal of
the measured zero-initialization regression; it is not a general superiority
claim.

The same controlled procedure also measured eight distinct 93-byte MRML COFF
objects (744 input bytes total), 50 times after five interleaved warmups. MRML's
median was 10.677 ms and mean was 10.813 ms; the pinned gnullvm `rust-lld`
median was 27.524 ms and mean was 27.594 ms. Both 1,024-byte executables returned
42. This is a 2.58x median speedup for a still-small, import-free eight-object
workload. It broadens the input-count evidence but remains neither a
large-program nor general linker-superiority claim.

After multi-definition decoding and payload-sized tiers, a further controlled
probe compiled 32 distinct functions into 32 separate 93-byte COFF objects
(2,976 input bytes total). Across 50 iterations after five interleaved warmups,
MRML measured 10.514 ms median and 10.769 ms mean; pinned gnullvm rust-lld
measured 28.747 ms median and 29.012 ms mean. Both 1,024-byte executables
returned 42. This is a 2.73x median result for a small 32-object, import-free
workload, not archive, large-program, debug-information, or general superiority
evidence.

The pass structure is informed by mold's public design notes: establish output
layout early, run a small sequence of understandable passes, and keep per-input
validation, copying, and per-relocation work independent so a hosted driver can
later use data-parallel loops. MRML does not copy mold source or claim mold
compatibility or performance. The cited design note warns that its 2020 object
preloading proposal is outdated, so MRML does not adopt that proposal.

The bounded ELF decoder now also admits one nonempty pinned-rustc
`.text.<symbol>` section and its exact `.rela.text.<symbol>` table, an empty
base `.text`, local absolute file metadata symbols, non-allocating `.comment`,
an empty `.note.GNU-stack`, and excluded `.llvmbc`/`.llvmcmd` metadata. These
sections are validated but never copied into loadable output. With the explicit
static relocation and no-unwind profile, two independently compiled objects
linked through `R_X86_64_PLT32`; a naked process entry called the later helper,
issued Linux `exit`, and returned status 42 from the 4,118-byte ELF image under
the exact ORACLE-0002 Arch WSL environment. Windows and Linux each passed 707
core tests and four driver tests.

The default-PIC external call/jump subset now admits `R_X86_64_GOTPCREL` only
for the exact six-byte `ff /2` or `ff /4` RIP-relative indirect instruction and
only when static selection resolves the symbol inside the final fixed image.
The linker rewrites that checked shape to size-preserving `nop; call rel32` or
`nop; jmp rel32`; other GOT uses, opcodes, defined-section targets, and dynamic
interposition remain rejected. A focused test checks the exact bytes,
displacement, symbol-driven selection, and malformed-opcode rejection. The
pinned default-PIC Linux probe called a later-object helper and exited 42 from
a 4,134-byte image. Over 50 same-input iterations after five warmups, MRML
measured 5.467 ms median and 5.601 ms mean versus pinned rust-lld at 5.997 ms
median and 5.947 ms mean; rust-lld emitted 1,376 bytes. This small WSL process-
startup-heavy result is regression evidence only, not a general speed claim.
`.eh_frame` and relocated debug sections remain fail-closed at this point.

The next ELF milestone combines multiple split `.text.*` payloads from one
object into one zero-copy span when their file ranges are ordered and every
alignment gap is present and all-zero. Symbols and relocation fields receive
checked section-relative offsets into that span; every matching
`.rela.text.*` table is validated and appended under the existing 256-record
bound. A first local fragment uses its section name as internal ownership while
later external definitions remain selectable archive symbols. Nonzero gaps and
non-text relocation targets still fail closed.

An exact ORACLE-0002 13,586-byte rlib containing eight static helpers, nine
split text sections, and eight internal calls linked with a separate process-
entry object to a 4,349-byte ELF image and exited 42 under Arch WSL. Windows and
Linux each passed 708 core tests and four driver tests. Over 50 same-input
iterations after five warmups, MRML measured 5.460 ms median and 5.480 ms mean
versus pinned rust-lld at 6.079 ms median and 6.111 ms mean; rust-lld emitted
2,072 bytes. This is small hosted regression evidence, not general superiority.
`.eh_frame`, relocated debug sections, noncontiguous text payloads, and more
than 256 combined relocations remain fail-closed.

The bounded ELF decoder now also coalesces multiple ordered `.rodata.*`
payloads through the same present-and-zero alignment-gap rule. Defined
read-only symbols retain checked offsets within that combined view. For the
exact pinned-rustc `R_X86_64_GOTPCREL` load shape (`REX.W; mov r64,
[rip+disp32]`), a resolved local read-only target is relaxed in place to the
corresponding `lea`; the ModRM register field is preserved, and every other
opcode/addressing shape remains rejected. Both System V and GNU ELF OSABI tags
are admitted with ABI version zero because the pinned LLVM emitter uses GNU
OSABI when retained read-only sections are present. This still constructs no
GOT and provides no dynamic interposition semantics.

An exact ORACLE-0002 object with two retained static `u64` values produced two
`.rodata.*` sections and two such relocations. Linked with the existing
syscall-only process entry, MRML emitted an 8,208-byte ELF that exited 42 under
Arch WSL; pinned rust-lld emitted 1,624 bytes and also exited 42. Windows and
Linux each passed 709 compiler-core tests and four driver tests. Over 50
same-input iterations after five warmups, MRML measured 5.609 ms median and
5.607 ms mean versus pinned rust-lld at 5.954 ms median and 5.997 ms mean. This
single hosted, process-startup-heavy probe is regression evidence only, not a
general speed or compatibility claim.

The driver no longer requires default pinned-rustc ELF inputs to suppress
unwind-table emission. It separately decodes one conventional `.eh_frame` and
its `.rela.eh_frame` table per selected object, validates the x86-64 unwind
section type, allocation flags, alignment, RELA links, `R_X86_64_PC32` records,
field bounds, symbol indices, and split-text targets, and retains at most 256
combined unwind relocations. Selected inputs carry their exact source-object
indices, so multiple explicit objects cannot alias through the archive-origin
sentinel. The serializer copies each selected frame fragment into the R/NX
load and applies checked function-relative displacements after final layout.

An exact default ORACLE-0002 object with two retained statics linked and exited
42 from an 8,256-byte ELF. A default 9,180-byte rlib with nine functions, a
256-byte `.eh_frame`, and nine frame relocations linked to an 8,448-byte ELF
and exited 42 under Arch WSL. Windows and Linux each passed 710 compiler-core
tests and four driver tests. Over 50 same-input rlib iterations after five
warmups, MRML measured 4.787 ms median and 4.813 ms mean versus pinned rust-lld
at 5.149 ms median and 5.179 ms mean; rust-lld emitted 2,440 bytes. This remains
narrow hosted regression evidence. This first frame-data milestone did not yet
establish runtime discovery or language-level panic/unwind behavior.

The serializer now derives the bounded GNU frame search header directly from
the validated FDE relocation fields: version 1, PC-relative signed four-byte
frame pointer, unsigned four-byte count, and data-relative signed four-byte
sorted table entries. Before table generation the decoder verifies each
relocation addresses the initial-location field of a bounded 32-bit-length FDE,
resolves its backward CIE reference to a bounded zero-identity CIE, and requires
strictly increasing relocation fields. The R/NX load contains the generated
header and relocated frames, and a read-only `PT_GNU_EH_FRAME` program header
identifies the exact search-table range. This interprets record boundaries and
CIE identity only; it does not interpret CFI instructions.

On the same nine-function default rlib, `readelf -lW` recognized MRML's fourth
program header as `GNU_EH_FRAME`, covering the 84-byte generated table. The
8,536-byte executable exited 42. Over 50 identical-input iterations after five
warmups, MRML measured 4.432 ms median and 4.453 ms mean; pinned rust-lld with
the equivalent `--eh-frame-hdr` option measured 4.971 ms median and 5.000 ms
mean and emitted 2,656 bytes. Windows and Linux each passed 710 compiler-core
tests and four driver tests. Actual stack unwinding, panic propagation, and
backtrace behavior remain unverified and are not claimed.

The bounded ELF path now also separates selected writable storage from text,
read-only data, and frame data. A dedicated decoder admits ordered initialized
`.data.*` PROGBITS and `.bss.*` NOBITS sections with exact WA flags, bounded
power-of-two alignment, checked symbol values, and text-side
`R_X86_64_PC32` references. Initialized and zero-fill targets have distinct
typed identities. The serializer lays every selected initialized fragment
before all zero-fill memory, preserves each alignment, applies references only
after final layout, and emits a page-separated RW/NX load whose file size
excludes BSS while its memory size includes it. Writable records do not enter
the global symbol namespace or archive-selection authority path.

An independently authored volatile-static ORACLE-0002 object contained one
8-byte `.data.*`, one 8-byte `.bss.*`, three writable PC-relative references,
and one frame record. Linked with the syscall entry, MRML emitted a 12,296-byte
ELF with distinct R, RX, R/NX, and RW/NX loads; `readelf -lW` reported an
8-byte writable file payload and 24-byte writable memory extent, and execution
exited 42 under Arch WSL. Windows and Linux each passed 712 compiler-core tests
and four driver tests. Over 50 same-input iterations after five warmups, MRML
measured 5.004 ms median and 5.016 ms mean versus pinned rust-lld with
`--eh-frame-hdr` at 5.090 ms median and 5.137 ms mean; rust-lld emitted 2,040
bytes. This is narrow hosted evidence only. ELF TLS, copy/dynamic relocations,
and general writable Rust runtime state remain unsupported or unverified.

Initialized ELF writable storage can now also carry bounded `R_X86_64_64`
relocations to text or read-only data in the same selected input. The decoder
requires a conventional allocated RELA table linked to the exact symbol table,
an initialized `.data.*` target, a defined local text/read-only target, an
eight-byte in-bounds field, and no more than 256 combined absolute relocations.
The serializer writes the checked final virtual address only after RX, R/NX,
and RW/NX layout is fixed. Unsupported relocation kinds and targets continue
to fail closed; this is static absolute-address support, not dynamic relocation
or position-independent loading.

An independently authored optimized ORACLE-0002 object stored a `&[u8]` fat
pointer in `.data.*`, with one `R_X86_64_64` relocation to a local
`.rodata.*` string and two text-side references to the writable record. MRML
emitted a 12,304-byte ELF whose writable pointer resolved to `0x402000`; the
program exited 42 under Arch WSL and `readelf -lW` showed separate R, RX, R/NX,
and RW/NX loads. Linux passed 714 compiler-core tests and four driver tests.
Windows passed all four driver tests and 713 of 714 compiler-core tests; the
remaining failure is in concurrently modified MRML ABI codegen and reports
`UnsupportedRuntimeType`, outside the linker files. Over 50 identical-input
iterations after five warmups, MRML measured 4.768 ms median and 4.853 ms mean
versus pinned rust-lld with `--eh-frame-hdr` and the same entry at 5.003 ms
median and 4.972 ms mean; rust-lld emitted 1,984 bytes. This is narrow hosted,
process-startup-heavy regression evidence, not a general performance or
compatibility claim.

The same bounded initialized-data relocation path now accepts typed targets in
the selected input's initialized and zero-fill storage. Section-symbol values
are translated through the existing checked data/BSS layouts; the serializer
then patches absolute addresses from the exact per-input initialized or BSS
base. Target offsets are revalidated against their distinct storage extents,
so an initialized target cannot be confused with a zero-fill target.

An independently authored optimized ORACLE-0002 object contained two
initialized pointer records: one targeting an initialized `u64`, and one
targeting a zero-fill `u64`. Its two `R_X86_64_64` records and two text-side
references linked into a 12,312-byte MRML ELF and executed with exit 42 under
Arch WSL. Windows and Linux each passed 714 compiler-core tests and four driver
tests. Over 50 identical-input iterations after five warmups, MRML measured
4.859 ms median and 4.912 ms mean versus pinned rust-lld with
`--eh-frame-hdr` at 4.869 ms median and 4.909 ms mean; rust-lld emitted 2,200
bytes. The 0.010 ms median difference is within ordinary process-startup noise
and is retained only as narrow regression evidence, not a speed claim.

Initialized-data `R_X86_64_64` records may now target a named text definition
in another selected object. The primary ELF decoder records each undefined
absolute target as a typed non-text dependency: it participates in ordinary
left-to-right archive selection and missing/duplicate-symbol validation but
does not pretend to own a PC-relative text field. The writable decoder retains
the borrowed symbol identity, and final serialization resolves it through the
same frozen global text layout used by calls. Both dependency and patch records
remain under the existing 256-relocation bounds.

An independently authored ORACLE-0002 consumer stored an external `helper`
function in an initialized function-pointer static; the provider was placed in
a later ordinary archive. The absolute dependency selected that archive member,
the final pointer resolved to its checked text definition, and the 12,304-byte
MRML ELF exited 42 under Arch WSL. Windows and Linux each passed 715
compiler-core tests and four driver tests. Over 50 identical-input iterations
after five warmups, MRML measured 4.690 ms median and 4.717 ms mean versus
pinned rust-lld with `--eh-frame-hdr` and the same entry at 5.019 ms median and
5.054 ms mean; rust-lld emitted 2,008 bytes. This single tiny archive workload
is narrow process-startup-heavy regression evidence, not a general linker-speed
or Rust-library compatibility claim. Named absolute targets outside text,
symbol preemption, weak definitions, and dynamic relocations remain unsupported.
After the final symbol-table-link and global-binding validation was added, both
platform driver checks and the exact Linux execution probe passed again. A
later Windows full-core rerun could not compile because concurrent unrelated
`codegen/tests.rs` work lacked the `format!` macro; no linker failure was
reported, and those user changes were left untouched.

Global definitions are now typed as text or read-only-data locations rather
than assuming every public name begins at text offset zero. This admits an ELF
object with empty `.text` whose primary global definition resides in ordered
`.rodata.*`, validates both primary and additional targets against their own
extents, selects such data-only archive members through the existing non-text
dependency path, and resolves named PC-relative or absolute references through
the frozen text/read-only layout. Names continue to identify definitions only;
the build tool gains no runtime authority from a symbol.

An independently authored ORACLE-0002 consumer stored a pointer to external
`VALUE`, while the later archive provider contained only empty `.text` and an
8-byte global `.rodata.VALUE`. MRML selected the provider, emitted a 12,304-byte
ELF with the value in its R/NX load, and exited 42 under Arch WSL. Windows and
Linux each passed 716 compiler-core tests and four driver tests. Over 50
identical-input iterations after five warmups, MRML measured 4.681 ms median
and 4.720 ms mean versus pinned rust-lld with `--eh-frame-hdr` and the same
entry at 4.841 ms median and 4.857 ms mean; rust-lld emitted 2,080 bytes. This
tiny archive probe is narrow hosted regression evidence, not a general speed
or compatibility claim. Global writable/TLS definitions, weak/versioned
symbols, preemption, and dynamic relocations remain unsupported.

Allocated zero-sized `.rodata.*` sections are now retained as typed local
read-only identities even though they contribute no bytes. A zero-valued
reference is mapped to the owning input's read-only base only when the section
has conventional PROGBITS/A identity and power-of-two alignment no greater than
16; nonzero offsets or stronger unrepresented alignment fail closed. This
supports Rust zero-sized static identities without fabricating payload bytes or
trusting their original file offsets.

An independently authored optimized ORACLE-0002 trait-object probe emitted a
zero-byte `ANSWER` section, a 32-byte vtable in `.data.rel.ro.*`, an initialized
fat pointer, three absolute relocations, two writable text references, and two
frame records. MRML linked it into a 12,344-byte ELF with separate RX, R/NX,
and RW/NX loads, and virtual dispatch exited 42 under Arch WSL. Windows and
Linux each passed 717 compiler-core tests and four driver tests. Over 50
identical-input iterations after five warmups, MRML measured 5.092 ms median
and 5.097 ms mean versus pinned rust-lld with `--eh-frame-hdr` at 5.241 ms
median and 5.218 ms mean; rust-lld emitted 2,128 bytes. This is one hosted
trait-object regression probe, not general trait/vtable, speed, or ABI coverage.

The archive decoder now validates and exposes conventional GNU `/` and
`/SYM64/` symbol indexes under a separate 4,096-entry bound. Big-endian counts
and member offsets, offset-table extent, UTF-8 NUL-terminated nonempty names,
exact payload consumption, duplicate index members, and offset correspondence
to independently parsed ordinary member headers are checked. An index entry is
only a lookup hint: it neither defines a symbol nor makes its referenced member
eligible without subsequent object decoding and definition validation. BSD
indexes remain ignored metadata.

An exact ORACLE-0002 `.rlib` containing `lib.rmeta`, `lib.rmeta-link`, a GNU
index, and one data-only object linked with the external-data consumer to a
12,304-byte ELF and exited 42 under Arch WSL. Windows passed 718 compiler-core
tests and Linux passed 720; both passed four driver tests. Over 50
identical-input iterations after five warmups, MRML measured 4.745 ms median
and 4.746 ms mean versus pinned rust-lld with `--eh-frame-hdr` at 5.659 ms
median and 5.617 ms mean; rust-lld emitted 2,080 bytes. This tiny indexed-rlib
probe is narrow hosted evidence. The driver still eagerly expands candidate
members, so index-guided lazy extraction and archives exceeding 256 ordinary
members remain separate incomplete gates.

The hosted driver now uses a validated GNU index to compute a bounded
left-to-right unresolved-symbol closure before admitting archive members to the
full decode and layout pipeline. Explicit objects and each admitted member are
scanned for exact definitions and named relocations; a selected index mapping
must be confirmed by the referenced object definition. Members are emitted in
original archive order. An archive without a usable index disables later lazy
pruning for that command, preserving the established eager selection semantics
instead of inferring completeness from absent metadata. A focused test places
an invalid unindexed member beside the indexed entry object and proves that the
invalid member is never decoded.

The exact ORACLE-0002 indexed data-provider `.rlib` continued to link and exit
42 under Arch Linux WSL. Windows and Linux each passed 720 compiler-core tests
and five driver tests. Over 50 identical-input iterations after five warmups,
MRML measured 4.680 ms median and 4.720 ms mean versus pinned rust-lld with
`--eh-frame-hdr` at 4.887 ms median and 4.899 ms mean; outputs remained 12,304
and 2,080 bytes. This one-member archive does not demonstrate the intended
scaling benefit and is only correctness/regression evidence; representative
multi-member `.rlib` measurements remain required.

Indexed archive inventory is now separate from the 256 selected-link-input
limit: the decoder admits at most 1,024 independently framed ordinary members
while the final link still admits at most 256 selected objects/fragments. This
allows the index-guided path to skip large irrelevant tails without allocating
them as link inputs or weakening the existing output-work bound. A focused
301-member archive containing one valid indexed entry object and 300
unreferenced invalid payloads selected only the entry on both Windows and Linux;
both platforms retained 720 compiler-core passes and five driver passes. This
is bounded synthetic scaling evidence, not general `.rlib` compatibility.

A controlled 319,802-byte archive then combined one real provider object with
300 copies of a real unreferenced ELF object. MRML selected the provider,
emitted 12,304 bytes, and the result exited 42. Over 50 iterations after five
warmups, MRML measured 5.063 ms median and 5.100 ms mean versus pinned rust-lld
with `--eh-frame-hdr` at 5.302 ms median and 5.327 ms mean; rust-lld emitted
2,080 bytes. Repeating one unused object is useful scaling regression evidence
but is not representative Rust-library diversity or a general speed claim.

A separate pinned-rustc probe uses 32 independently exported functions spread
across 16 codegen units. Its genuine 85,332-byte `.rlib` contains `lib.rmeta`,
`lib.rmeta-link`, and 16 distinct rustc object members; the consumer references
two functions in different members. MRML selected the required members, emitted
8,432 bytes, and exited 42, matching rust-lld's 2,120-byte output behavior. Over
50 iterations after five warmups, MRML measured 4.306 ms median and 4.360 ms
mean versus pinned rust-lld with `--eh-frame-hdr` at 4.981 ms median and 5.028
ms mean. This is materially more diverse archive evidence than the repeated-
object probe, but it remains one small no-std hosted workload and does not prove
general rustc `.rlib` compatibility or speed superiority.

Index closure now consumes each newly discovered unresolved reference through a
bounded work-queue cursor instead of repeatedly rescanning every archive-index
entry against all accumulated references. Each name still performs an exact
validated index lookup; selecting a member appends its newly decoded named
relocations to the same queue, so transitive dependencies reach a fixed point
without changing archive ordering or treating index data as a definition.

The 16-codegen-unit probe was changed so the consumer references only
`diverse_31`, whose archive member calls `diverse_11` in a different member.
MRML selected both transitively, emitted 8,344 bytes, and exited 42 like
rust-lld's 1,880-byte result. Over 50 iterations after five warmups, the queued
MRML path measured 4.577 ms median and 4.678 ms mean versus pinned rust-lld at
4.700 ms median and 4.747 ms mean. On the 301-object controlled archive MRML
measured 4.902 ms median versus rust-lld at 4.886 ms in the same run, so that
case is a near tie and provides no superiority evidence. These are hosted
regression measurements, not broad performance claims.

Large ordinary linker inputs now have an explicit 64 MiB per-file read bound
instead of inheriting the earlier 1 MiB small-object aggregate. The shared
bounded reader uses validated file length to reject oversized inputs before
allocation, reserve exactly once, and fill the known prefix directly before
checking for concurrent growth. GNU index decoding also accepts LLVM's exact
single NUL needed to align an otherwise odd-length name area; the padding is
allowed only after every declared name, only when the consumed length is odd,
and arbitrary trailing bytes remain invalid.

Those changes admit the exact ORACLE-0002 `libcore` archive: 3,150,398 bytes,
551 indexed symbols, metadata members, and one 3,104,472-byte rustc object.
When appended to an independently authored entry that needs no core symbol,
MRML skipped the object, emitted 8,264 bytes, and exited 42; rust-lld emitted
1,664 bytes with the same behavior. A 50-iteration/five-warmup measurement
recorded MRML at 6.769 ms median and 6.742 ms mean versus pinned rust-lld at
5.634 ms median and 5.661 ms mean. MRML is slower on this metadata-dominated
case, so faster large-file ingestion remains an explicit optimization gate.
Windows passed 721 core unit tests, all integration suites, 44 runtime tests,
and five driver tests. Linux passed the 721 core unit tests, 44 runtime tests,
and five driver tests; one concurrently modified wide-integer semantic
integration probe failed with `RuntimeExpressionUnsupported`, outside linker
and runtime files, and was preserved untouched.

The hosted linker now keeps each bounded input in an owning read-only file
mapping rather than copying the entire file into a growing vector. The mapping
retains its file lifetime, validates the exact length against the 64 MiB bound
before mapping, represents empty files without an OS mapping, exposes only an
immutable byte slice, and unmaps exactly once on drop. Both existing Windows
and Linux native mapping backends are covered through one runtime abstraction;
ordinary non-linker bounded reads retain their prior behavior.

With mapped inputs, the identical 3,150,398-byte pinned `libcore` probe measured
MRML at 4.835 ms median and 4.852 ms mean versus rust-lld at 5.251 ms median and
5.301 ms mean over 50 iterations after five warmups. The transitive 16-codegen-
unit `.rlib` measured 4.869 ms versus 5.205 ms, and the controlled 301-object
archive measured 4.921 ms versus 5.372 ms. Every MRML and rust-lld output kept
its expected exit-42 behavior. Windows and Linux each passed 45 runtime tests
and five driver tests. These three current hosted samples are positive
regression evidence, not proof that MRML is generally faster than rust-lld.

ELF and COFF section inventory limits are now distinct. COFF remains capped at
256 sections, while ELF64 relocatables admit at most 2,048 section headers in
the primary, unwind, and writable-data passes. This covers the exact pinned
`libcore` object's 1,702-section table without broadening the PE/COFF surface or
removing fixed-capacity validation. Archive-selection diagnostics now preserve
the exact bounded linker error instead of collapsing every member failure into
one generic driver message.

An independently authored consumer with a retained pointer to exact exported
core symbol `_RNvNtCs5erv4YX8a5g_4core3fmt17pointer_fmt_inner` causes the pinned
core object to be selected. It now passes archive, file-size, index, and section-
count gates before failing closed on the next unsupported ELF feature. Inspection
shows the object contains relocated read-only section families among its 1,702
sections; supporting it correctly requires section-level dependency/GC and
read-only relocation modeling, not blindly copying the entire 3.10 MiB member.
Windows and Linux each passed 722 core unit tests, all integration suites, and
five driver tests. Actual core-symbol extraction remains incomplete.

A typed ELF section-reachability pass now roots one or more exact defined
symbols and follows same-object `SHT_RELA` symbol edges to a bounded fixed
point. It independently validates the ELF header, at most 2,048 section
headers, one 24-byte-entry symbol table, its linked string table, relocation
entry size/link/target fields, symbol indexes, and ordinary section indexes.
Undefined and absolute symbols create no same-object edge; missing roots,
malformed references, and more than 256 reachable content sections fail
closed. The result is an ordered `ElfSectionSelection`, not layout authority.

Focused tests show an external call keeps only its root text section, a local
read-only relocation retains exactly the root text and referenced `.rodata`
sections, and a missing root is rejected. Windows and Linux each passed 723
core unit tests and every integration suite. This establishes the graph pass
needed for section GC; the existing decoder/layout path does not consume it
yet, so it does not claim smaller output or pinned-core symbol execution.

The driver now consumes that graph through typed selected content, definition,
and RELA views. Cross-object reachability starts at the exact entry, expands
local relocation edges, and resolves external definitions with conventional
strong-over-weak rules. The frozen layout groups selected text, read-only plus
unwind, initialized writable, and zero-fill sections under validated alignment
and page-separated permissions. The relocation pass supports the currently
admitted x86-64 absolute-64, PC-relative-32, PLT-relative-32, and
instruction-shape-validated GOTPCREL forms, after which a fixed-address
import-free ELF64 serializer emits only present load regions. A selected-section
executable produced by the core path and a three-object ELF produced through
the public driver both executed with exit code 42 under controlled Arch
Linux/WSL.

GNU archive inventory no longer invokes the legacy whole-object decoder. It
reads at most 4,096 global/weak definitions and actual relocation-referenced
undefined names from independently validated ELF symbol, string, and RELA
tables. This admitted the exact pinned `libcore` object's 1,702-section table.
The independently authored retained-pointer probe now reaches exported symbol
`_RNvNtCs5erv4YX8a5g_4core3fmt17pointer_fmt_inner`, follows its transitive
selected sections, emits an 8,674-byte ELF, and exits 42. Thus actual selected
core-symbol extraction is implemented for this exact probe; it is not broad
`libcore` or general `.rlib` conformance.

On that reachable-core workload, a Linux release driver and the exact pinned
gnullvm rust-lld each ran 50 measured links after five warmups. MRML measured
5.692 ms median and 5.775 ms mean; rust-lld with equivalent `--gc-sections`
measured 6.591 ms median and 6.604 ms mean. Both outputs exited 42. MRML emitted
8,674 bytes while rust-lld emitted 638,392 bytes, but MRML currently omits
unwind metadata retained by the conventional link, so output-size comparison
is not equivalent evidence. This is a narrow hosted process-level regression
measurement, not a general linker-speed or size-superiority claim.

The next optimization caches validated ELF symbol/string table views across
the reachability fixed point, reuses the selected-section decode for definition
and relocation views, and avoids allocating archive symbol queues for links
containing only explicit objects. The same 50-iteration/five-warmup release
method measured MRML versus exact pinned rust-lld at 5.384 versus 4.982 ms
median for the trait-object probe, 5.387 versus 4.972 ms for writable pointers,
5.011 versus 4.953 ms for one archive, and 5.670 versus 6.974 ms for the
reachable pinned-libcore probe. All outputs exited 42. This preserves the
workload-specific core advantage but does not make MRML faster on the tiny
explicit-object probes; no broad superiority claim follows.

Cross-object reachability now carries each fully validated ELF header-table,
symbol-table, and string-table view into every symbol work-queue iteration.
Previously the cached view was used for definition resolution, but the
per-symbol section-GC call reparsed the ELF header, rescanned every section to
rediscover `.symtab`, and sliced the same tables again. The public one-object
entry point still performs identical validation once. Current 50-iteration,
five-warmup samples measured MRML versus pinned rust-lld at 5.330 versus 4.847
ms for the trait-object probe, 5.220 versus 4.806 ms for one archive, 5.258
versus 5.138 ms for the transitive 16-codegen-unit archive, and 5.742 versus
6.234 ms for reachable pinned libcore. All executable checks exited 42. The
tiny samples remain slower or near parity; the libcore sample remains faster,
so these results are regression evidence rather than a general superiority
claim.

ELF selection also validates conventional `SHT_GROUP` records against the
object's exact symbol table: the entry width is four bytes, the signature is a
named global/weak symbol, the flag word is `GRP_COMDAT`, every member index is
in range, and every member carries `SHF_GROUP`. If any group member is
reachable, every allocatable member joins the same bounded fixed point;
non-allocatable relocation metadata remains metadata and is decoded through
its target section. A synthetic two-alloc-member group proves atomic closure,
and the exact pinned libcore object's real `DW.ref.rust_eh_personality` COMDAT
group passes the public driver path. The reachable-core comparison emitted the
same 8,674-byte exit-42 MRML executable and measured 6.072 ms median versus
7.323 ms for pinned rust-lld in that run.

Cross-object selection now inventories at most 4,096 validated COMDAT groups
in input order before symbol resolution. The first exact signature wins;
definitions and relocation edges in later groups are invisible to roots and
section GC, while sparse borrowed loser-group views avoid a 512 KiB bitmap on
ordinary links. Two independently compiled strong `helper` definitions return
42 and 7. MRML and pinned rust-lld both returned 42 in first/second order and 7
in second/first order, proving deterministic winner parity rather than merely
accepting duplicate weak definitions. A third losing group references an
intentionally absent symbol; both linkers discard its text and RELA members
before unresolved-symbol closure and still produce the first provider's
exit-42 result. Current 50-iteration/five-warmup samples
measured MRML versus rust-lld at 5.206 versus 4.640 ms for the group-free tiny
trait-object link and 5.617 versus 6.076 ms for reachable pinned libcore. The
tiny path remains slower; no broad speed-superiority claim follows.

The cross-object fixed point now reuses that same validated COMDAT inventory
instead of rediscovering every `SHT_GROUP` section for each newly resolved
symbol. The inventory retains both winner and loser views, is partitioned to
the exact object before section closure, and therefore keeps loser filtering
and atomic winner expansion on one prepared representation. The standalone
one-object API still validates and discovers its groups locally. Current
50-iteration/five-warmup samples measured MRML versus pinned rust-lld at 5.111
versus 5.109 ms for the tiny trait-object link, 5.076 versus 5.422 ms for the
transitive 16-codegen-unit archive, and 5.700 versus 7.097 ms for reachable
pinned libcore. All executable checks exited 42. This run shows parity on the
tiny sample and an advantage on the two archive samples; it is not a general
speed claim.

Selected ELF links retain canonical `SHT_PREINIT_ARRAY`, `SHT_INIT_ARRAY`, and
`SHT_FINI_ARRAY` sections even when ordinary relocation reachability does not
point to them. Initializer and finalizer numeric suffixes are bounded to `u16`
and stable-sorted ascending; unsuffixed entries follow priority entries.
Preinitializers intentionally admit only the unsuffixed ABI form, matching the
pinned rust-lld boundary behavior. The typed decoder requires writable/
allocatable flags with only optional `SHF_GNU_RETAIN`, eight-byte alignment and
total size, and `sh_entsize` zero or eight. Layout exposes conventional
`__preinit_array_*`, `__init_array_*`, and `__fini_array_*` linker-defined
boundaries, while an explicit user definition still wins. The independently
authored Rust 2024 probe resolves all six boundaries, invokes one preinitializer
and two initializers forward, invokes two finalizers backward, and checks the
exact state order before exiting. MRML and pinned gnullvm rust-lld both exited
42; their executables measured 8,232 and 3,072 bytes. This proves bounded
retention, priority layout, boundary relocation, and freestanding runtime
iteration, not automatic invocation by a production MRML startup runtime.

Conventional ELF `SHN_COMMON` tentative objects now participate in the same
bounded symbol and reachability passes. A regular global definition wins over
COMMON, COMMON wins over a regular weak definition, and repeated COMMON
declarations coalesce to one zero-filled allocation using the maximum declared
size and power-of-two alignment. Alignment is capped at one page, arithmetic
is checked, COMMON function symbols reject, and the resulting storage extends
only the RW segment's memory size. Relocations resolve through the coalesced
symbol rather than treating its alignment-valued `st_value` as a section
offset. Independently authored Rust 2024 objects declared 8-byte/alignment-8
and 24-byte/alignment-32 forms; MRML and pinned gnullvm rust-lld both observed
zero initialization, a writable value, and exit 42. A second link added an
initialized regular definition and both linkers observed its value instead.
MRML emitted 8,192-byte and 8,200-byte executables versus rust-lld's 1,480-byte
and 1,456-byte outputs. This proves bounded static COMMON resolution for these
objects, not dynamic TLS, dynamic preemption, or broad ELF compatibility.

The bounded static TLS path admits conventional allocated `.tdata.*` PROGBITS
and `.tbss.*` NOBITS sections with exact `SHF_WRITE|SHF_ALLOC|SHF_TLS` flags,
checked power-of-two alignment, and typed `STT_TLS` definitions. Local-exec
`R_X86_64_TPOFF32` relocations are computed from the end of the complete TLS
block with signed-32-bit overflow checks. Initialized TLS precedes zero-fill
TLS in one contiguous template, and the executable publishes its exact file
and memory extents in a read-only `PT_TLS` program header while the containing
RW load retains ordinary process mapping semantics. The independently authored
Rust 2024 probe explicitly installed a two-word test thread block with Linux
`arch_prctl`, observed initialized value 7 and zero value 0, wrote 20 and 22,
and exited 42 through both MRML and pinned gnullvm rust-lld. Their outputs were
8,216 and 1,960 bytes, and both reported an eight-byte TLS file template plus a
16-byte memory template aligned to eight. This is controlled hosted local-exec
TLS evidence; the test thread block is explicit and does not claim production
runtime TLS initialization. General-dynamic `R_X86_64_TLSGD`,
`__tls_get_addr`, initial-exec relocations, dynamic TLS modules, and production
thread lifecycle integration remain unsupported.

The selected relocation path also admits conventional unsigned absolute-32
`R_X86_64_32` records. It computes the ABI-defined `S + A` value only after
resolving the exact selected target and rejects any result outside `u32` rather
than truncating it. The exact pinned libcore archive contains 8,403 records of
this type. An independently authored pinned-rustc object carrying one such
reference linked through the public driver with the controlled process-entry
wrapper and exited 42 under Arch Linux WSL.

The signed companion `R_X86_64_32S` is now distinct in the decoded relocation
kind and applies the same ABI expression, `S + A`, with an exact `i32` range
check before writing. The durable `signed_absolute32.rs` probe is emitted by the
pinned Linux rustc and its relocation is confirmed by `readelf`; the accompanying
script links identical inputs with MRML and the pinned gnullvm rust-lld. Both
controlled outputs exited 42 under Arch Linux WSL. MRML emitted 8,193 bytes and
rust-lld emitted 1,504 bytes; this is compatibility evidence, not an equivalent
size or performance comparison. Dynamic and initial-exec TLS relocations remain
unsupported.

Cross-object selection has a detailed companion API that retains the exact
borrowed symbol when resolution fails; the compatibility entry point still
returns the original typed error. The driver uses the detailed form, so a
missing final-artifact dependency is reported as, for example, `undefined link
symbol: memset`, without heap allocation or relaxed resolution. The durable
five-export probe in `docs/compiler/probes/core_breadth_consumer.rs`, paired
with explicitly test-only providers in
`docs/compiler/probes/controlled_runtime_symbols.rs`, produced a 20,528-byte
selected ELF and exited 42 under Arch Linux WSL. Removing those providers
identified `memset`, `memcpy`, and the pinned panic endpoint in sequence. This
is broader libcore graph evidence, not production runtime completeness or
general libcore conformance; the linker does not synthesize runtime symbols.

The public build frontend exposes this path only through the explicit
`mrml compiler mrml-rustc-experimental link-elf` command. It first builds the
declared driver through the native component graph and then forwards the exact
ordered objects/archives, entry, and output. A three-object invocation produced
a 4,134-byte ELF that exited 42 under Arch Linux WSL. Requesting
`mrml-rustc-production` fails before building or writing output; ordinary
`mrml build` continues to use the pinned upstream production toolchain.

This increment does **not** emit PE imports/exports/base
relocations/debug data, emit ELF dynamic metadata/interpreter/PIE/sections,
read general `.rlib` contents, perform ICF, link dynamically,
run work in parallel, or use the MRML linker for ordinary production `mrml
build` actions. Explicit experimental frontend selection, section GC, and the
driver path are implemented for the bounded
ELF subset described above, not arbitrary inputs. Index-guided extraction remains bounded to 1,024
ordinary archive members, 4,096 index symbols, and 256 admitted link inputs and
has not yet been optimized against broad representative Rust libraries.
Those are separate milestones and the current upstream linker remains the
production linker for ordinary package builds as required by
`docs/build/BUILD_SYSTEM.md`.

The same explicit experimental mode now exposes `compile-elf`, which sends one
supported source function through `mrml-rustc` code generation and the
MRML-owned ELF serializer in a single canonical frontend operation. It never
invokes rust-lld and never falls back to upstream compilation. The frontend
sets the declared compiler driver's bounded 32 MiB Linux child stack before
execution. A durable source probe compiled a terminal `int3` entry, emitted a
4,097-byte ELF, and produced the expected hosted Linux `SIGTRAP` status 133.
This proves source-to-owned-linker frontend integration for one supported
function, not production compiler admission or general crate compilation.
The symmetric Windows operations expose explicit `link-pe` and `compile-pe`
routes to the existing bounded COFF/PE path. A durable custom-source probe ran
through the canonical frontend, emitted a 1,024-byte import-free PE32+ image,
and returned exit code 42 on the Windows gnullvm host. These operations do not
invoke rust-lld, silently fall back, or alter ordinary production builds.

A durable public-route `.rlib` probe now uses exact pinned Windows gnullvm rustc
to produce an 18,280-byte no-std archive containing `lib.rmeta`,
`lib.rmeta-link`, and eight distinct COFF codegen-unit members. Its external
entry reaches 32 non-inlined functions across eight source modules. Both
`mrml compiler mrml-rustc-experimental link-pe` and pinned rust-lld consume the
identical entry object and archive and return exit code 42; MRML emits 2,048
bytes and rust-lld emits 1,536 bytes. Over 50 direct-driver iterations after
five warmups, MRML measured 5.269 ms median and 5.562 ms mean versus rust-lld at
22.565 ms median and 22.645 ms mean. This is reproducible multi-member gnullvm
archive and public-routing evidence with a strong narrow process-level speed
advantage, not general `.rlib` compatibility or broad linker superiority.

The companion stateful `.rlib` probe distributes eight initialized statics and
eight zero-initialized 128-byte arrays across eight gnullvm codegen units. The
bounded COFF reader now admits exact object-local `.data$` and `.bss$`
definitions, retains their local symbol identities through archive selection,
and resolves AMD64 `REL32` references only after the final PE writable layout is
known. The serializer separates initialized file bytes from the uninitialized
virtual extent and reports 1,024 bytes in `SizeOfUninitializedData`; the probe
also requires `.data` virtual size to exceed its raw size, proving that the
executed image depends on loader-backed zero fill rather than alignment padding.
MRML and pinned rust-lld consume identical entry/archive inputs and both return
42; MRML emits 2,048 bytes and rust-lld emits 1,536 bytes. External writable
definitions, writable COMDAT selection, TLS, PE base relocations, and general
COFF data-section compatibility remain unsupported.

The next bounded PE increment admits externally visible storage-class-2
definitions in selected `.data$` and `.bss$` sections. The same eight-CGU probe
now reads one exported initialized global and one exported zero-fill global from
the defining codegen unit, alongside its object-local state. Exact unreferenced
gnullvm `.data$\u0001__imp_` forwarding slots are excluded. MRML
reports 1,028 zero-fill bytes, emits 2,560 bytes, and returns 42; pinned rust-lld
consumes the identical inputs, emits 2,048 bytes, and also returns 42. This is
external-definition compatibility evidence, not import-table or general global
data support.

Cross-object Rust global reads are now supported for the exact gnullvm
`.rdata$.refptr.*` shape. The bounded decoder requires one eight-byte zero
payload, one AMD64 `ADDR64` relocation, and one undefined external target per
record. Ordered gaps occupied by COFF relocation records remain part of the
non-executable readonly input extent, and the PE serializer patches each
pointer only after final writable layout. The entry object in the durable probe
writes both exported globals through two refptr records, and the archive's
defining codegen unit observes the shared updated state. MRML emits 2,560 bytes and
pinned rust-lld emits 3,584 bytes from identical inputs; both return 42 and the
MRML image still reports exactly 1,028 zero-fill bytes. This proves the bounded
static refptr form, not arbitrary COFF import pointers, DLL imports, writable
COMDAT selection, or general PE relocation support.

The exact gnullvm `.data$\u0001__imp_` forwarding slots are now retained as
writable NODUPLICATES COMDAT definitions instead of being discarded. A typed
writable relocation distinguishes their zero-addend AMD64 `ADDR64` reference
to another writable symbol from the existing writable-to-readonly form. Final
PE layout resolves both without treating the forwarding name or section name as
authority. The strengthened probe requires two distinct absolute pointers in
the emitted `.data` raw extent, each targeting its final writable virtual
range; cross-object stores and the defining codegen unit's reads still return
42. MRML remains 2,560 bytes versus rust-lld at 3,584 bytes. On the latest 50
measured direct-driver links after five warmups, MRML measured 9.564 ms median
and 9.850 ms mean versus rust-lld at 27.215 ms median and 27.585 ms mean. This
does not implement arbitrary COFF COMDAT winner selection, associative COMDAT,
DLL imports, or broad linker superiority.

Writable section-definition auxiliaries now carry a typed COMDAT policy. Plain
and NODUPLICATES definitions still reject duplicate symbols; two `SELECT_ANY`
definitions keep the deterministic leftmost payload and every relocation binds
to that winner. The parser accepts only selection bytes 0, 1, and 2 for this
bounded path and rejects associative and all other policies before layout.
Adversarial unit coverage mutates an independently built COFF fixture to ANY,
verifies that the first of two distinct eight-byte payloads is emitted, and
proves that changing either duplicate to NODUPLICATES fails. The exact stateful
gnullvm archive remains compatible: both linkers return 42, MRML emits 2,560
bytes with two valid forwarding pointers, and rust-lld emits 3,584 bytes. Fifty
measured direct-driver links after five warmups produced 9.047 ms median/9.239
ms mean for MRML versus 27.601 ms median/27.599 ms mean for rust-lld. Text and
readonly COMDAT winner selection, associative groups, SAME_SIZE, EXACT_MATCH,
LARGEST, and NEWEST remain unsupported.

Text section-definition auxiliaries now use the same bounded typed policy.
After ordinary archive-member selection and before generic layout, duplicate
primary text definitions are accepted only when every competing definition is
`SELECT_ANY`; the deterministic leftmost fragment wins as one unit, so its
code, local read-only bytes, definitions, and relocations stay coherent.
NODUPLICATES/plain mixtures and selection bytes other than 0, 1, and 2 fail
closed. Runtime-function records are retained only when their begin symbol
belongs to a text fragment retained from that exact source object. Synthetic
tests verify the auxiliary decoder, leftmost payload, strict duplicate failure,
and unsupported-policy failure. The unchanged exact stateful gnullvm archive
returns 42 with both linkers: MRML emits 2,560 bytes with two forwarding
pointers versus rust-lld's 3,584 bytes. Fifty direct-driver measurements after
five warmups produced 9.357 ms median/9.596 ms mean for MRML and 27.078 ms
median/27.167 ms mean for rust-lld. This is a narrow host/workload result, not
broad superiority. Associative text groups, LARGEST, NEWEST, and independent
read-only COMDAT selection remain unsupported at that checkpoint.

Text `SAME_SIZE` and `EXACT_MATCH` now extend that same pre-layout winner pass.
The decoder requires the COFF COMDAT characteristic and the specified leading
STATIC section-definition symbol with one auxiliary record; zero, associative,
largest, newest, malformed, and mismatched policies still fail closed.
`SAME_SIZE` keeps the leftmost definition only when every duplicate text
section has the same raw size. `EXACT_MATCH` compares raw text contents, matching
the documented PE/COFF section rule and current link.exe/lld behavior rather
than accidentally comparing unrelated read-only sections or symbol metadata.
Tests cover equal and unequal sizes, equal and unequal contents, selection
bytes 3 and 4, the required COMDAT metadata shape, and unsupported associative
selection. The exact stateful gnullvm probe remains unchanged: both linkers
return 42, MRML emits 2,560 bytes and rust-lld 3,584 bytes, with 1,028 bytes of
zero fill and two valid forwarding pointers. Fifty measured links after five
warmups produced 9.175 ms median/9.847 ms mean for MRML versus 26.384 ms
median/26.877 ms mean for rust-lld. This remains narrow evidence. Associative
text groups, LARGEST, NEWEST, and independent read-only COMDAT selection remain
unsupported at that checkpoint.

Text `LARGEST` selection now compares all selected duplicate definitions before
layout and retains the largest raw text section, with deterministic leftmost
tie-breaking. Replacing an earlier winner atomically replaces its input,
archive/member origin, and exact source-object identity, so discarded code and
unwind records cannot leak into the PE. Matching current lld behavior, mixed
`ANY`/`LARGEST` resolves as `LARGEST`; for the gnullvm lane, mixed
`ANY`/`SAME_SIZE` resolves as `SAME_SIZE` and still rejects unequal lengths.
This pre-layout replacement avoids lld's documented stale-section limitation
when a later largest definition prevails. Tests verify larger-later replacement,
larger-first retention, exact origin propagation, both `ANY`/`LARGEST` orders,
and selection byte 6. The exact stateful probe still returns 42 through both
linkers with the same 2,560/3,584-byte outputs, zero fill, and forwarding
pointers. Fifty links after five warmups measured MRML at 9.303 ms median/9.518
ms mean and rust-lld at 26.879 ms median/27.059 ms mean on this narrow workload.
Associative text groups, NEWEST, and independent read-only COMDAT selection
remain unsupported.

COFF COMDAT metadata is now inventoried once per admitted object before text
fragment selection. The bounded inventory requires the specified leading STATIC
section-definition symbol, recognizes selection values 1 through 6, validates
every associative section number, and rejects missing parents, non-COMDAT
parents, and cyclic association chains. PE unwind decoding then binds explicit
associative `.pdata$...` and `.xdata$...` sections to the root text section
named by their relocations. It also implements the conventional gnullvm/MinGW
compatibility form in which ordinary COMDAT `.pdata$X` and `.xdata$X` sections
are implicitly associated with `.text$X`. Runtime records remain eligible only
through an already-selected begin symbol from the exact source object. Reusing
the prepared inventory avoids rescanning the symbol table for every text
fragment. Synthetic tests cover valid roots, malformed section metadata,
out-of-range parents, cycles, detached unwind companions, and the existing
selection policies. The exact stateful gnullvm probe returns 42 through both
linkers: MRML emits 2,560 bytes with 1,028 bytes of zero fill and two forwarding
pointers, versus rust-lld's 3,584 bytes. Fifty measured links after five warmups
produced 9.569 ms median/11.661 ms mean for MRML and 27.049 ms median/28.860 ms
mean for rust-lld on this narrow workload. Independent selection and filtering
of associative read-only payloads remains incomplete, so this is not broad
linker compatibility or performance superiority.

Explicit associative read-only COMDATs now follow the exact text fragment that
owns their validated association root. The prepared object inventory is passed
into fragment decoding, so each `.rdata$...` section whose selection is
`ASSOCIATIVE` is retained only for its root text section; symbols in companions
belonging to other fragments are ignored, and a relocation from the retained
fragment into a discarded companion fails closed. Because the current
allocation-free `LinkInput` carries one borrowed read-only span, decoding also
rejects an object layout where excluded companion bytes would be embedded
inside that retained span rather than silently copying them. An independently
constructed four-section fixture proves that `.text$a` receives only byte `A`,
`.text$b` receives only byte `B`, and rebinding the second companion to the
first root leaves the second fragment with no read-only payload. Windows and
Arch Linux each pass 755 core tests and their full dependent package graphs.
The unchanged stateful gnullvm probe returns 42 through both linkers and emits
2,560 MRML bytes versus 3,584 rust-lld bytes. Fifty measured links after five
warmups produced 5.749 ms median/6.139 ms mean for MRML and 22.752 ms
median/22.926 ms mean for rust-lld on this host and workload. Non-associative
read-only COMDAT duplicate selection and arbitrary discontiguous read-only
section packing remain incomplete.

Non-associative read-only COMDATs are now independent named link inputs rather
than repeated object-wide payload attached to every text fragment. The bounded
decoder requires an external definition at offset zero, retains additional
bounded definitions, and converts text references to the section's external
symbol so duplicate selection can rebind every reference to the winner. The
same `ANY`, `SAME_SIZE`, `EXACT_MATCH`, and `LARGEST` policy pass used for text
now compares the appropriate read-only payload and replaces source-object,
archive, and member origin atomically. Selected `.rdata$.refptr...` relocations
are emitted only for the exact source object that supplied the surviving
read-only definition, with section-local offset zero. Prepared COMDAT
inventories are bound to the exact admitted slice address and length before any
fast-path reuse. Synthetic tests prove named text-to-read-only relocation and
final layout, leftmost `ANY`, size and content rejection, larger-later
replacement, winning-origin propagation, and inventory-substitution failure.
The exact stateful gnullvm probe still returns 42 through both linkers with
2,560 MRML bytes, 3,584 rust-lld bytes, 1,028 bytes of zero fill, and two
forwarding pointers. Fifty measured links after five warmups produced 6.778 ms
median/6.927 ms mean for MRML and 21.757 ms median/22.271 ms mean for rust-lld
on this host and workload. General read-only relocations originating inside
COMDAT payloads and non-COMDAT discontiguous packing remain incomplete.

The selected `.rdata$.refptr...` path now preserves the in-place signed addend
of each validated `IMAGE_REL_AMD64_ADDR64` record and resolves its named target
after final PE layout. Targets may be selected text, selected read-only data,
or selected writable data; checked address construction rejects underflow and
overflow. The serializer remains allocation-free and bounded by
`MAX_LINK_RELOCATIONS`. Windows and Arch Linux each passed 757 compiler-core
unit tests and eight compiler-driver tests; Arch Linux also passed all compiler
integration groups. The exact pinned gnullvm stateful archive returned 42
through both linkers with 2,560 MRML bytes, 3,584 rust-lld bytes, 1,028 bytes of
zero fill, and two forwarding pointers. Fifty measured links after five
warmups produced 9.620 ms median/9.896 ms mean for MRML versus 26.746 ms
median/26.899 ms mean for rust-lld on this exact Windows host and workload.
This does not yet admit arbitrary relocation kinds or discontiguous
non-COMDAT read-only packing, and it is not a claim of general superiority.

Read-only absolute relocation discovery is no longer restricted to
`.rdata$.refptr...` names or one record per section. One inventory-bound pass
per selected COFF object discovers the first external offset-zero owner for
each standalone read-only COMDAT and decodes every bounded AMD64 `ADDR64`
record with its section-relative field offset and signed in-place addend. The
driver retains only records belonging to the exact selected winner and enforces
the aggregate bound during retention, so relocation-heavy discarded COMDATs
cannot consume the winner budget. Synthetic coverage uses two records in one
ordinary `.rdata$a` section and rejects inventory substitution, an unsupported
kind, and an out-of-range field. Isolated Windows and Arch Linux runs each
passed 758 compiler-core tests, all four integration groups, and eight driver
tests. The pinned stateful archive again returned 42 through both linkers with
2,560 MRML bytes, 3,584 rust-lld bytes, 1,028 zero-fill bytes, and two
forwarding pointers. Fifty links after five warmups measured MRML at 9.993 ms
median/10.110 ms mean versus rust-lld at 27.872 ms median/28.298 ms mean on
this exact host and workload. Other read-only relocation kinds, associative
read-only relocation sources, and discontiguous non-COMDAT packing remain
incomplete.

Refptr admission no longer performs an all-object count pass, and decoding one
requested ordinal no longer recursively pre-counts the same object's records.
The driver allocates the fixed 4,096-record bound once, scans selected objects,
and rejects the exact aggregate before insertion. On 50 direct-driver iterations
after five warmups, this stateful eight-CGU workload measured MRML at 9.067 ms
median and 9.267 ms mean versus pinned rust-lld at 26.240 ms median and 26.410
ms mean. This is a strong narrow process-level advantage for this exact archive
and host state, not broad linker superiority or a controlled attribution of the
timing difference to one optimization.

The independently authored GNU thin-archive probe stores a helper, its
transitive leaf, and an unused function in three external objects. It deletes
the indexed but unreferenced object before the MRML link; MRML reaches the leaf
without opening the absent unused file and exits 42. The probe restores that
file for the exact pinned gnullvm rust-lld comparison, whose output also exits
42. MRML emitted 4,134 bytes and rust-lld emitted 1,416 bytes. This proves lazy
fixed-point extraction for this GNU thin shape, not arbitrary filesystem
authority, general `.rlib` compatibility, or broad performance superiority.
Selected external mappings now remain owned through ordered materialization, so
each chosen file is opened and mapped once rather than once for verification
and again for copying. The durable 50-iteration/five-warmup process benchmark
for this three-member archive measured MRML at 5.055 ms median and 5.109 ms mean
versus pinned rust-lld at 4.592 ms median and 4.614 ms mean. This tiny workload
shows that eliminating duplicate selected-member I/O did not overcome MRML's
remaining startup and parsing overhead; it is a regression baseline, not a
speed-superiority result.
The same harness can deterministically copy the unused object to exercise up to
the 1,024-member bound. With 1,000 unreferenced external members, the identical
50-iteration/five-warmup method measured MRML at 4.844 ms median and 4.902 ms
mean versus pinned rust-lld at 7.490 ms median and 7.509 ms mean. This is direct
evidence that lazy external-file admission wins on one metadata-heavy GNU thin
archive; it does not establish general linker superiority or representative
Rust-build performance.

Research source:

- Rui Ueyama, [Design and implementation of mold](https://github.com/rui314/mold/blob/main/docs/design.md).
- System V ABI, [AMD64 Architecture Processor Supplement](https://refspecs.linuxfoundation.org/elf/x86_64-SysV-psABI.pdf).

Associative read-only COFF companions rooted at selected text fragments now
contribute their bounded AMD64 `ADDR64` relocations to the exact owning text
input. A single inventory prepass records the first raw companion byte for each
validated text root; relocation offsets are then checked relative to that
root's complete read-only span, while companions rooted outside text remain
unsupported. A synthetic two-root object proves independent ownership, signed
addends in both directions, and the final relocated PE pointer values. Isolated
Windows and Arch Linux runs each passed 761 compiler-core tests, all four
integration groups, and eight driver tests. The exact pinned gnullvm stateful
archive returned 42 through both linkers: MRML emitted 2,560 bytes versus
rust-lld's 3,584, with 1,028 zero-fill bytes and two forwarding pointers. Fifty
links after five warmups measured 10.054 ms median/10.233 ms mean for MRML
versus 28.660 ms median/29.022 ms mean for rust-lld on this exact Windows host
and workload. This is a narrow reproducible advantage, not general linker
superiority. Other read-only relocation kinds and discontiguous non-COMDAT
read-only packing remain incomplete.

Read-only COFF relocation records now carry an explicit encoding kind. In
addition to fixed-image AMD64 `ADDR64`, the decoder admits `ADDR32NB`, validates
its four-byte field, preserves its signed in-place addend, and the PE serializer
writes the checked image-relative RVA without adding the image base. Mixed-kind
synthetic coverage proves decoding, field-width bounds, unsupported-kind
rejection, exact final RVA output, negative-addend handling, and overflow
failure. Windows and isolated Arch Linux runs each passed 763 compiler-core
tests, all four integration groups, and eight driver tests. The unchanged exact
pinned gnullvm stateful archive returned 42 through both linkers with 2,560 MRML
bytes, 3,584 rust-lld bytes, 1,028 zero-fill bytes, and two forwarding pointers.
Fifty links after five warmups measured MRML at 9.984 ms median/9.967 ms mean
versus rust-lld at 27.864 ms median/27.818 ms mean on this exact Windows host
and workload. This probe remains a narrow `ADDR64` regression and performance
comparison, not representative proof for `ADDR32NB` workloads or general
linker superiority. Other read-only relocation encodings and discontiguous
non-COMDAT read-only packing remain incomplete.

Read-only COFF relocation decoding now admits the complete AMD64 PC-relative
family `REL32` through `REL32_5`. One typed relocation kind retains the
zero-through-five trailing-byte bias; final PE serialization computes the
signed displacement from the end of the four-byte field plus that bias, after
all text and read-only RVAs are fixed. The existing bounded object scan and
final relocation pass are reused without allocation or another object pass.
Synthetic coverage independently decodes all six COFF numbers, preserves a
negative in-place addend, rejects relocation number 10, validates four-byte
fields, asserts the exact final negative displacement, rejects an impossible
typed bias, and checks signed overflow. Exact detached Windows and Arch Linux
runs each passed 771 compiler-core tests, all four integration groups, and eight
driver tests. The unchanged pinned gnullvm stateful archive returned 42 through
both linkers with 2,560 MRML bytes, 3,584 rust-lld bytes, 1,028 zero-fill bytes,
and two forwarding pointers. Fifty links after five warmups measured MRML at
10.766 ms median/12.022 ms mean versus rust-lld at 30.251 ms median/31.345 ms
mean on this exact Windows host and workload. The probe is an `ADDR64`
regression and narrow performance comparison, not representative REL32 evidence
or general linker superiority. Other read-only relocation encodings and
discontiguous non-COMDAT read-only packing remain incomplete.

Conventionally named COFF `.debug`, `.debug$...`, and `.debug_...` sections
may now be validated and discarded when they are explicitly discardable,
initialized-data sections and are neither writable nor executable. The bounded
validator checks the relocation-table extent, every target symbol index, the
known AMD64 relocation kind, and the complete relocation field width before
omission. Retained debug sections and malformed records continue to fail
closed; this does not emit or preserve debug information. Synthetic tests cover
the accepted `SECREL` shape and reject a missing discardable flag, an invalid
symbol index, an unknown kind, an out-of-range field, and a truncated field.
Exact detached Windows gnullvm and Arch Linux runs each passed 780 compiler-core
unit tests, both component probes, 10 conformance tests, 351 replacement tests,
85 semantic-execution tests, and eight driver tests. The durable pinned gnullvm
debug-rlib probe produced 1,024-byte executables through both MRML and rust-lld;
both returned 42. Fifty measured links after five warmups recorded MRML at
5.549 ms median/6.714 ms mean versus rust-lld at 22.794 ms median/24.226 ms mean
on this exact Windows host and tiny workload. This is a narrow startup-heavy
regression result, not representative-library or general linker superiority
evidence. Retained debug information, CodeView/PDB production, arbitrary COFF
sections, and broader Rust-library admission remain incomplete.

Archive fixed-point discovery now inventories ordinary AMD64 COFF external
definitions and references directly from the validated symbol and string
tables. The inventory is a zero-copy, fallible iterator: it neither decodes
section payloads nor allocates one relocation/definition workspace per
fragment. Structural metadata admission is separately bounded at 4,096 COFF
sections, while the existing content decoder remains bounded at 256 tracked
sections. A scan of the exact dated Windows gnullvm sysroot found a maximum of
3,834 sections in one `std` member; the selected `libcore` member exercised by
the durable probe has 1,934 sections and 5,034 symbols. The probe now crosses
archive symbol discovery and fails at the precise next unsupported gate,
`COFF content section tracking capacity exceeded`, rather than generically
failing while decoding every candidate fragment. This is metadata-scale and
recovery evidence, not full `libcore` or general `.rlib` link support.

Detached Windows and Arch Linux runs each passed the complete 786-test
compiler-core package gate and the eight driver tests. The unchanged durable
stateful gnullvm archive produced executable outputs returning 42 through both
linkers; MRML emitted 2,560 bytes versus rust-lld's 3,584, with 1,028 bytes of
loader-backed zero fill and two distinct writable forwarder pointers. Fifty
measured links after five warmups recorded MRML at 7.319 ms median/7.458 ms
mean versus pinned gnullvm rust-lld at 22.409 ms median/23.162 ms mean on this
exact Windows host and workload. This is a narrow reproducible advantage, not
general linker superiority. The next gate is bounded content representation
for large selected COFF objects without introducing per-object maximum-sized
stack arrays or weakening section identity and COMDAT semantics.

Large selected COFF objects now use a borrowed zero-copy COMDAT view and
compact 4,096-bit section-classification sets instead of fixed per-section
metadata and boolean arrays. Association chains remain bounded, cycle-checked,
and bound to the exact immutable object; writable, read-only, unwind, metadata,
debug, and discarded-section identities remain distinct. The exact pinned
`libcore` probe advances from the former content-tracking rejection to the next
existing gate, `expanded link fragment count exceeds 256`, in 627 ms on this
Windows run. The detached Windows package passed all 801 compiler-core unit
tests, its integration groups, and eight driver tests. Linux and comparative
performance were not rerun for this stop-point commit, and full `libcore`
support is not claimed.

Source-object admission and post-decode fragment admission now have distinct
bounds. At most 256 ordered objects or archive inputs may enter the driver, but
one or more validated objects may expand to at most 4,096 code and standalone
read-only fragments. Hosted vectors are allocated to the exact expanded count;
archive paths, source identities, and ordinary source-input workspaces do not
grow to the fragment maximum. The dependency-free link core uses a separate
bounded layout/selection workspace and preserves atomic `(archive, member)`
selection across more than 256 fragments. Synthetic coverage selects 257
fragments of one member.

The actual Linux driver release build passes. A Linux-hosted driver compiled a
Windows-target object with the exact ORACLE-0003 gnullvm rustc and consumed that
object plus the pinned gnullvm `libcore` archive. It advances past the former
256-fragment rejection and fails closed at the next exact content gate,
`COFF object 1 text fragment 0: unsupported COFF feature`. This is hosted
cross-format parser evidence, not native Windows execution, general `.rlib`
compatibility, or a production-linker claim. A complete compiler-core package
attempt reached `rust-lld` but its generated input objects were absent at final
link time, so no package-pass result is claimed for this increment.

Standalone read-only COFF COMDAT fragments may now derive their bounded link
identity from an object-local symbol with no auxiliary records. Text
relocations to that symbol retain the existing `LocalSymbol` target rather than
promoting it to an external definition. Duplicate names across objects still
fail closed during global symbol validation. Synthetic coverage converts the
existing named read-only COMDAT probe to an object-local symbol, resolves it
through a separate read-only fragment, and checks the final displacement.

The Linux release driver build passes. The exact ORACLE-0003 gnullvm `libcore`
probe advances from fragment 0 to fragment 3 and now fails with the typed next
gate, `unsupported discontiguous COFF read-only layout`. This confirms that the
first object-local read-only dependency is represented; it does not claim
general discontiguous packing or full `libcore` support. A compiler-core run
executed 809 unit tests and exposed four focused expectation/setup failures,
which were corrected. Its rerun lost generated rustc inputs before final
linking, so a complete package-pass result is not claimed.

The format-neutral link core now has a typed non-global COFF section identity:
one nonzero bounded source-object number plus one nonzero section number.
Internal definitions do not participate in archive eligibility, global symbol
lookup, or duplicate-name checks. Relocations resolve only the exact identity
and a checked offset within its read-only payload. Two source objects may
therefore retain identically named `.rdata` sections without inventing unique
strings or risking cross-object resolution. Synthetic coverage checks exact
resolution to the second same-named section, invalid zero identities, and
non-selection of an archive member that exposes only an internal section.

The actual Linux release driver build passes. The complete compiler-core gate
again failed at final `rust-lld` because its generated object inputs were
absent; it did not execute the unit binary, so no package-pass result is
claimed. COFF decoder and driver transport of the typed identity remain the
next milestone before associative read-only fragments can replace the current
single-slice representation.

Local COFF text and read-only COMDATs now carry distinct exact
`(source object, section)` definition targets. Read-only absolute relocations
may resolve a local section symbol into either the final text RVA or read-only
RVA without relying on a repeated section name. Independent bounded tables
cover object-wide read-only relocations and aggregate selected text
relocations. A 512 KiB linked-payload tier before the multi-megabyte fallback
allows the pinned `libcore` probe to serialize on the normal 8 MiB Linux stack.

The exact ORACLE-0003 gnullvm `libcore` probe plus independently assembled
Windows-ABI memory/panic shims produced a deterministic 464,896-byte PE on the
normal stack. Replacing arithmetic helper shims with the pinned
`compiler_builtins` archive produced a deterministic 465,920-byte PE. Its
non-loadable `.drectve` metadata is admitted only as a bounded
`LNK_INFO | LNK_REMOVE` exclusion list; library, executable, writable, or other
directives fail closed. `objdump` recognized three bounded PE sections, and
Wine loaded and returned from the image, but the temporary entry is not a
Windows process-entry ABI wrapper, so its process code is not semantic evidence.
Platform memory and panic shims remain external; full runtime closure and native
Windows execution are not claimed.

The next typed-runtime checkpoint retains exact COFF section identities in PE
runtime-function begin/end targets and resolves selected writable references
only after the global text/read-only definition set is fixed. An unresolved
ordinary symbol is reclassified as writable only when exactly one selected
writable definition owns it; a selected text definition keeps precedence.
This closes the pinned archive's object-local runtime and allocator-marker
references without exposing those identities through global archive selection.

The exact ORACLE-0003 `alloc` and `core` archives, pinned
`compiler_builtins`, and independently assembled temporary platform shims linked
to a deterministic 519,168-byte PE on the normal 8 MiB Linux stack. A separate
enlarged-stack run was byte-identical. The durable structural probe corrects
the allocator-marker shim to the pinned toolchain's callable text contract and
has SHA-256
`54c3457ccc6a56e150a445d041ed00b1d003af4f0d0a9ae0ae2928e4bcb69b33`.
`objdump` reported an RX `.text` of `0x294b4` bytes, an R/NX `.rdata` of
`0x551b4` bytes, and an RW/NX `.data` of `0xb8` bytes. The isolated canonical
compiler-core package gate passed 815 unit tests and 122 semantic-execution
tests. The platform shims are diagnostic inputs rather than production
authority, and this is link/structure evidence rather than allocator execution,
native Windows, or general Rust-library conformance.

A separate independently authored Rust 2024 execution probe exports `entry`,
installs a bounded 4,096-byte arena allocator, constructs a `Vec<u32>`, pushes
the values 0 through 63 across repeated capacity growth, and returns 42 only
after verifying their sum is 2,016. The corrected callable marker plus diagnostic
memory/unwind/error stubs linked that consumer with the exact ORACLE-0003
`alloc`, `core`, and `compiler_builtins` archives to a deterministic
520,704-byte PE with SHA-256
`52d2c50df2cf4dd0b58a70f60d49fc765e461dafc7dea5433b5ea4671460aa5e`.
Wine 11.16 executed the image and returned 42. This is hosted Wine execution of
one bounded allocator-backed `Vec` path, not native Windows, allocator
production readiness, broad `alloc` conformance, or physical-hardware evidence.
An isolated canonical compiler-core package gate at this exact checkpoint passed
815 unit tests and 123 semantic-execution tests with zero failures.

The first pinned ORACLE-0003 `std` boundary recognized the conventional AMD64
COFF short-import header during archive symbol inventory. At that checkpoint,
the bounded reader accepted only version-zero code imports named directly in
the payload, an exact NUL-terminated `.dll` library name, and no trailing bytes.
It exposed only the callable definition used by the selected std path;
data/constant imports, ordinal imports, decorated-name transformations, and
synthesized `__imp_` aliases remained unsupported. Archive-selection
diagnostics retain the exact group, member, and member name on inventory
failure.

An independently authored `std::thread::available_parallelism` consumer advances
from the former anonymous inventory rejection through selection of
`api-ms-win-core-synch-l1-2-0.dll` to the next explicit gate, `COFF object 3
COMDAT inventory: unsupported COFF feature`. Import objects are not yet decoded
as link inputs and no PE import table is emitted, so std execution is not
claimed.

Selected code short imports now decode to ordinary global text definitions
whose exact payload is a six-byte AMD64 indirect-jump thunk. The thunk carries
a typed `(library, symbol)` IAT relocation rather than a guessed ordinary link
symbol. Generic layout validates and retains that relocation but never patches
it; the PE driver fails explicitly with `selected PE import table emission is
unsupported` until descriptor, name, and writable IAT layout exist end to end.
This preserves ordinary call resolution without exposing the import-library
member name as authority or treating an IAT address as code.

With that representation, the pinned `std::thread::available_parallelism`
probe advances into the selected 10,065,474-byte std archive member and stops at
the next typed boundary: `COFF object 2 archive group 1 member 3 text fragment
0: unsupported COFF TLS section`. TLS content and lifecycle remain unimplemented;
no std link or execution claim is made.
An isolated canonical compiler-core gate at the typed-thunk checkpoint passed
817 unit tests and 126 semantic-execution tests with zero failures.

The durable `check_pinned_std_execution.sh` probe compiles an independently
authored Rust 2024 consumer with the exact ORACLE-0003 Windows gnullvm rustc.
The consumer calls `std::thread::available_parallelism` and returns 42 only
when the result is nonzero. Dedicated diagnostic stubs intentionally provide
no usable allocator, so an unexpected heap path fails closed instead of
silently broadening the fixture. On the normal 8 MiB Linux stack, MRML linked
the exact pinned `std` dependency closure and self-contained MinGW import
archives into a deterministic 2,393,088-byte PE with SHA-256
`66492a766c27125d824fd63dbcdc47c0804a37da1b79979b812a06a692a9abc6`.
The image has separate RX, R/NX, and RW/NX sections plus import, exception,
TLS, and IAT directories. Exact `.CRT$XLA` through `.CRT$XLZ` fragments retain
a typed suffix order, form one stable contiguous callback table in RW/NX data,
and publish the callback address after the null start sentinel. Interior slots
must contain one exact zero-offset `ADDR64` relocation to code in the referenced
text input; sentinels, malformed slots, one-past targets, and tables without TLS
fail closed. The adjacent `.CRT$XC*`, `.CRT$XD*`, and `.CRT$XI*` families also
retain typed family/suffix identities and form separate contiguous stable tables
in lexical family and suffix order. Each present family requires exactly one
null `A` and `Z` sentinel; every interior slot requires one exact zero-offset
`ADDR64` relocation to code in the referenced text input. Missing or duplicate
sentinels, malformed slots, non-code targets, and one-past targets fail closed.
Exact `.tls`, `.tls$...`, and `.tls$ZZZ` sections retain typed start, interior,
and end identities. The serializer stable-orders those categories so the start
sentinel precedes every selected interior and the end sentinel follows them,
independently of archive selection order. When either sentinel is present, both
must occur exactly once as relocation-free eight-byte zero fragments; missing,
duplicate, nonzero, relocated, or zero-length TLS fragments fail closed. Interior
relative references continue to resolve through exact section identity rather
than layout rank.
Wine 11.16 loaded the image containing the real pinned MinGW callback and CRT
initializer tables and returned 42. The probe enters the independently authored
`entry` symbol directly, so this proves deterministic loading rather than CRT
initializer invocation. This is one hosted Wine execution path through `std`,
not native Windows evidence, general `std` conformance, production runtime
closure, complete PE startup/TLS lifecycle beyond these exact table shapes, WHP
evidence, or physical-hardware evidence.

The separate durable `check_pinned_std_tls_execution.sh` probe compiles an
independently authored Rust 2024 `thread_local!` containing a const-initialized
`Cell<u32>`. The exact pinned Windows gnullvm object uses one `REL32` reference
to `_tls_index` and two `SECREL` references to its exact `.tls$$...VALUE`
section. MRML links the selected closure into a deterministic 3,584-byte PE with
SHA-256
`1406839fe494dac45307df1223b88b76a25e99f01f41f0ad4d1cf455fcc074b1`.
Wine 11.16 initialized the PE TLS template; the authored entry read 40 through
the thread-local access sequence, stored 42, read it back, and returned 42.
This is one hosted main-thread const TLS access, not destructor registration or
execution, secondary-thread initialization, dynamic TLS, native Windows,
general `std`, WHP, or physical-hardware evidence.

The same durable probe's `lazy` mode removes the const initializer, calls an
out-of-line initializer that increments an ordinary atomic counter, and accesses
the TLS value twice. Its exact object retains the `_tls_index` and `SECREL`
sequence plus one writable-counter reference and an unwind-described initializer
call. MRML emits a distinct deterministic 3,584-byte PE with SHA-256
`547a11546615a17e3320eae61de7cceca4dcbed0bca7e07990878c2121ffe82a`.
Wine 11.16 returned 42 only after the first access initialized 40, mutation
stored 42, the second access observed 42, and the counter proved exactly one
initializer call. This is bounded main-thread lazy initialization without a
destructor, not re-entrant or poisoned initialization, secondary-thread state,
TLS teardown, native Windows, general `std`, WHP, or physical-hardware evidence.

The probe's `thread` mode imports exact `CreateThread`, `WaitForSingleObject`,
`GetExitCodeThread`, and `CloseHandle` thunks from the pinned self-contained
kernel32 archive. Both the main and child routines use `_tls_index` plus exact
`SECREL` references to one const TLS cell. MRML emits a deterministic 3,584-byte
PE with SHA-256
`a679f964aaa6f871f734eb768067714eb4ec8e42e2429e18100d03912ebe2059`.
Wine 11.16 returned 42 only after the main thread changed its value from 40 to
41, the new thread independently observed 40 and changed it to 42, the child
exit code was 42, and the main thread still observed 41. This is bounded hosted
secondary-thread TLS template/isolation evidence, not concurrent stress,
destructor execution, thread-detach callback behavior, dynamic TLS, native
Windows, general `std`, WHP, or physical hardware.

The probe's `destructor` mode gives its const TLS cell a `Drop` implementation
that release-increments an ordinary atomic counter. The exact pinned object
selects `std`'s destructor-list registration path, retains the typed TLS access,
an unwind-described destroy shim, exact writable/read-only identities, and the
same bounded kernel32 child-thread imports. MRML emits a deterministic
2,393,600-byte PE with SHA-256
`84a86a69953250b284a3f514a2d08db4c2eef7f446d7bdebd66eb099e358bcd5`.
Wine 11.16 returned 42 only after the child accessed and mutated its TLS value,
thread detach ran the registered destructor, and the main thread acquired an
exact drop count of one. This is one hosted child-thread destructor path, not
multiple/re-entrant destructors, panic during teardown, process-detach ordering,
dynamic TLS, native Windows, broad `std` conformance, WHP, or physical hardware.

PE images with absolute VA fields now carry a bounded base-relocation
inventory. It includes every selected writable `ADDR64` field, every read-only
`ADDR64` field, and the four absolute TLS-directory fields. The serializer
sorts exact RVAs, rejects duplicate or header targets, groups
`IMAGE_REL_BASED_DIR64` entries by 4 KiB page, pads each block with the standard
absolute no-op entry, and publishes the resulting directory from the existing
R/NX section. The bound combines the aggregate selected-relocation frontier,
the object-wide read-only frontier, and four TLS fields. Only images with a
complete nonempty inventory clear `IMAGE_FILE_RELOCS_STRIPPED` and set
`DYNAMIC_BASE`; images containing no absolute addresses retain their previous
fixed-base bytes. Unit coverage checks deterministic ordering, page grouping,
duplicate rejection, capacity failure without partial output, and end-to-end
directory/header fields. The complete 838-unit compiler-core gate, its object
and conformance groups, 351 replacement tests, and 128 semantic tests pass.
The release driver and all five pinned std/TLS Wine probes above return 42.
Wine acceptance proves these exact relocation-bearing images remain loadable at
the observed address; forced nonpreferred-base rebasing, native Windows, WHP,
and physical-hardware relocation remain unverified.

Direct-name version-zero AMD64 COFF short imports now retain a typed code,
data, or constant kind. Code imports keep their six-byte indirect-jump thunk.
Data and constant imports instead require the archive index to associate the
exact `__imp_` alias with the payload symbol; they define only that
loader-populated IAT slot and carry a metadata-only typed `(library, symbol)`
record into PE import-table construction. The generic linker validates that
record but never treats it as a text patch field, and the PE serializer emits
one deduplicated import/IAT entry without fabricating callable code. Missing or
mismatched aliases, ordinal imports, decorated-name transformations, malformed
payloads, and trailing bytes continue to fail closed. Focused fixtures cover
both accepted kinds, exact alias association, contextualized IAT references,
and an end-to-end PE data import with empty synthetic text. The complete
839-unit compiler-core gate, its 2 object-evidence and 10 conformance tests,
351 replacement tests, and 128 semantic tests pass, and the release driver
build passes. No pinned ORACLE-0003 archive member selected by the current
probes uses this form, so this is bounded unit/driver structural evidence, not
new `std`, Wine, native Windows, WHP, or physical-hardware execution evidence.

Named short imports now preserve the complete 16-bit COFF hint instead of
requiring it to be zero. The typed code/data/constant import records carry that
hint through driver contextualization; PE hint/name serialization writes it
before the exact imported symbol, and duplicate `(library, symbol)` identities
must agree on the hint or fail closed. Unit coverage uses a nonzero header hint
and verifies the exact emitted PE hint field. The complete 839-unit
compiler-core gate, its 2 object-evidence and 10 conformance tests, 351
replacement tests, and 128 semantic tests pass, and the release driver build
passes. Subsequent checkpoints below add ordinal imports and bounded name
transformations. This is format/serialization evidence only; no new runtime or
physical-hardware claim is made.

Ordinal short imports now retain their exact 16-bit ordinal as a typed import
target and serialize the required high-bit ordinal thunk in both lookup and IAT
tables. Named `NOPREFIX` and `UNDECORATE` imports retain the decorated archive
alias separately from the transformed loader lookup name, with bounded
transformation and exact data-import coverage. The Linux canonical gate passes
840 unit tests and all existing object, conformance, replacement, and semantic
groups at both checkpoints; the release driver build passes.

Selected COFF text also admits the complete `IMAGE_REL_AMD64_REL32` through
`REL32_5` family. A checked zero-through-five trailing-byte bias remains part of
the typed PC-relative addend, and the adjacent unsupported kind still fails
closed. The Linux canonical gate passes 841 unit tests and all existing groups;
the release driver build passes.

## Typed selected-text PE addresses

Selected AMD64 COFF text now retains `IMAGE_REL_AMD64_ADDR32NB` as a typed
four-byte PE image-relative address. Its nested target preserves global,
object-local section, input-text, read-only, writable, TLS, or import identity
until the final PE RVAs are frozen. The serializer applies the signed in-place
addend only after that layout and rejects values outside `u32`; the generic
static linker validates but never guesses how to patch the PE-specific field.
`REL32` through `REL32_5` remain distinct PC-relative forms, and unsupported
relocation types continue to fail closed. The Linux release compiler-core gate
passes 842 unit tests, 2 object-evidence tests, 10 conformance tests, 351
replacement tests, and 128 semantic-execution tests; the release driver build
also passes.

Selected-text `IMAGE_REL_AMD64_ADDR64` now uses the same retained target
identity with an independently validated eight-byte field. Final PE emission
adds the image base and signed addend with checked arithmetic, writes the exact
64-bit virtual address, and records every such text field in the bounded
`IMAGE_REL_BASED_DIR64` inventory. This prevents an apparently relocatable PE
from omitting absolute addresses embedded in RX text. Focused coverage checks
the decoded negative addend, final VA, relocation-directory page/offset entry,
driver writable-target contextualization, and overflow rejection. The Linux
release compiler-core gate passes 843 unit tests, 2 object-evidence tests, 10
conformance tests, 351 replacement tests, and 128 semantic-execution tests; the
release driver build also passes.

A read-only `objdump -r` census of the exact ORACLE-0003 Windows gnullvm
`libcore`, `liballoc`, and `libstd` archives found 4,597 `ADDR32NB`, 78,281
`ADDR64`, 13,145 `REL32`, and 43,306 `SECREL` records, with no other AMD64
relocation family present. This is archive-wide format evidence, not proof that
every member is selected or that every debug relocation is runtime-relevant.
The large `ADDR64` and `SECREL` populations are predominantly discarded debug
metadata; runtime read-only `ADDR64`/`REL32` and TLS `SECREL` were already typed
by the preceding gates. No native Windows, WHP, or physical-hardware claim is
made.

After both selected-text address checkpoints, the five durable ORACLE-0003
Wine probes retained their exact deterministic outputs and exit 42: the std
probe produced 2,393,088 bytes with SHA-256
`66492a766c27125d824fd63dbcdc47c0804a37da1b79979b812a06a692a9abc6`;
const, lazy, and child-thread TLS each produced 3,584 bytes with their existing
recorded hashes; and the TLS-destructor probe produced 2,393,600 bytes with
SHA-256
`84a86a69953250b284a3f514a2d08db4c2eef7f446d7bdebd66eb099e358bcd5`.
This confirms the new relocation admission does not alter those selected
closures. It remains hosted Wine evidence under the limitations already stated
for each probe.

The durable std probe now has a second independently authored `time` mode. It
calls `SystemTime::now`, checks a conservative post-2023 Unix timestamp, and
therefore selects the pinned Windows wall-clock path rather than only the
parallelism path. MRML links the exact ORACLE-0003 closure into a deterministic
2,393,088-byte PE with SHA-256
`8dd3b4e85476af2be38b6ced952980f4e8d29f103d25d0efa0f9cda90b973d10`;
Wine 11.16 returned 42. The refactored original mode reproduced its existing
size, hash, and exit 42. This adds one hosted wall-clock linkage/execution path,
not clock-precision, monotonic-time, native Windows, WHP, or physical-hardware
evidence.

The `random` std-probe mode forces `RandomState::new` through `black_box`,
selecting the exact embedded `bcryptprimitives.dll` direct-name code import for
`ProcessPrng`. MRML emits a deterministic 2,393,088-byte PE with SHA-256
`c3716a3dbddcb453b1bcd02f93940d1ccd2ae3093c532d34b6c3ead9dc0c65be`;
Wine 11.16 returned 42. This verifies that pinned archive selection, the typed
short-import thunk/IAT identity, PE import serialization, and hosted loader
resolution agree for this path. It is not a statistical randomness,
cryptographic-quality, native Windows, or physical entropy-source claim.

The same script's `sleep` mode calls `std::thread::sleep` for one millisecond,
forcing the pinned Windows delay path into the selected archive closure. MRML
emits a deterministic 2,393,088-byte PE with SHA-256
`f044c1c51e5a85a169d1bb39bd88307943fe8be28bec2269f430c93e809644cf`;
Wine 11.16 returned 42 after the call completed. This verifies one bounded
link/load/execute path through the exact pinned sleep implementation. It is not
sleep-precision, scheduler, native Windows, WHP, or physical-timer evidence.

Identified writable COFF fragments now retain same-object writable `ADDR64`
targets as an exact `(object, section, offset)` instead of collapsing them to a
symbol name. The decoder checks the symbol value plus in-place addend against
the target section's initialized or zero-filled extent, and final PE emission
resolves the typed target only after writable layout is frozen. The legacy
identity-free decoder retains its narrower zero-offset named behavior. Focused
coverage checks the decoded identity, final virtual address, and one-past
rejection. The Linux release gate passes 843 unit tests, 2 object-evidence
tests, 10 conformance tests, 351 replacement tests, and 128 semantic-execution
tests; the release driver and all eight pinned std/TLS Wine modes pass with
their exact recorded hashes and exit 42. Patent review: NOT_TRIGGERED; this is
bounded validation and conventional PE/COFF relocation handling.

Identified read-only COMDAT relocations now retain an exact target section for
both static and global section-defined symbols whenever that section is present
in the validated projection inventory. A global symbol with section zero
remains a named external dependency, so cross-object archive resolution is not
misrepresented as same-object identity. Focused coverage checks global code and
read-only projected targets plus the section-zero boundary. The Linux release
gate passes 843 unit tests, 2 object-evidence tests, 10 conformance tests, 351
replacement tests, and 128 semantic-execution tests; the release driver and all
eight pinned std/TLS Wine modes pass with exact recorded hashes and exit 42.
Patent review: NOT_TRIGGERED; this is conventional bounded PE/COFF identity
retention.

The ordered archive fixed point now has explicit regression coverage for the
pinned MinGW TLS-support boundary. The selected TLS-support member's named
`__mingw_TLScallback` dependency resolves through the defining member's unique
typed text-section additional definition at a nonzero offset, and selecting
that definition retains every projected fragment of the same archive member.
Two same-named definitions with different section identities remain ambiguous
and are not guessed. Exact ORACLE-0003 inspection found three `REL32`
references in `tlssup.o` and the definition in `tlsthrd.o`; the test fixture is
independently authored and does not copy either object. Patent review:
NOT_TRIGGERED; this pins bounded conventional archive and COFF identity rules.
The Linux release gate passes 844 unit tests, 2 object-evidence tests, 10
conformance tests, 351 replacement tests, and 128 semantic-execution tests;
the release compiler-driver gate passes 16 tests.

The PE driver's post-selection pass now reaches a bounded fixed point over
dependencies originating only in selected writable, CRT-initializer, or TLS
callback fragments. A named code pointer retains the complete archive member
that provides the first conventional global definition or one unique typed
text-section definition; conflicting typed section identities remain
unselected and fail closed during final validation. Newly retained members are
rescanned for further writable-only dependencies, so correctness does not rely
on a duplicate relocation appearing in code. The release compiler-driver gate
passes 17/17. All eight pinned std/TLS Wine modes reproduce their exact recorded
PE sizes and SHA-256 hashes and return 42. Patent review: NOT_TRIGGERED; this is
bounded conventional archive reachability and COFF relocation handling.

Writable COFF decoding now admits a section-zero external `ADDR64` target only
when the containing slot is a typed CRT initializer or TLS callback. The symbol
must be an undefined global with value zero and the field addend must be zero;
it is retained as a code-only `TextSymbol` for archive selection and final PE
validation. Ordinary writable data, nonzero symbol values, nonzero addends, and
non-global externals remain unsupported rather than being guessed as code.
Focused coverage checks the admitted callback and both ordinary-data and
nonzero-addend rejection. The Linux release gate passes 844 unit tests, 2
object-evidence tests, 10 conformance tests, 351 replacement tests, and 128
semantic-execution tests; the release driver passes 17 tests. All eight pinned
std/TLS Wine modes reproduce their exact recorded PE sizes and SHA-256 hashes
and return 42. Patent review: NOT_TRIGGERED; this is bounded conventional
PE/COFF relocation handling.

Final PE validation and serialization now resolve a writable-only named code
pointer through the same unique typed `CoffTextSection` definition admitted by
archive retention. A conventional global text definition retains precedence;
when no such definition exists, conflicting typed identities, a non-code
definition, and a one-past text offset fail closed under the containing CRT or
TLS error class. The stable CRT initializer fixture exercises the typed named
path through its emitted image-base VA and rejects a second conflicting typed
identity. The Linux release gate passes 844 unit tests, 2 object-evidence
tests, 10 conformance tests, 351 replacement tests, and 128 semantic-execution
tests; the release driver passes 17 tests. All eight pinned std/TLS Wine modes
reproduce their exact recorded sizes and SHA-256 hashes and return 42. Patent
review: NOT_TRIGGERED; this completes bounded conventional PE/COFF symbol and
section resolution without introducing a new mechanism.

PE relocation contextualization now requires one exact typed section target
before replacing a section-zero named symbol with `CoffSection` identity. Two
same-named definitions with different object/section/offset tuples remain
unresolved and therefore fail later validation; they cannot fall through to an
unrelated writable symbol of the same name. A conventional global definition
also retains precedence over a typed projection. Focused driver coverage checks
ordinary and image-relative unique targets, conflicting typed identities in the
presence of a writable name, and global precedence. The adjacent Linux release
compiler-core gate passes 844/844 units, 2/2 object evidence, 10/10 conformance,
351/351 replacements, and 128/128 semantic tests; the changed release driver
passes 17/17. All eight pinned std/TLS Wine modes reproduce their exact recorded
sizes and SHA-256 hashes and return 42. Patent review: NOT_TRIGGERED; this is
bounded conventional PE/COFF symbol resolution.

Selected AMD64 COFF text relocations now follow the bounded weak-external alias
shape observed in the exact ORACLE-0003 profiler runtime: storage class 105,
one zero-reserved auxiliary record, `SEARCH_ALIAS` characteristic 3, and an
in-range tag index naming a same-object strong section definition. The decoder
resolves the relocation directly to that strong fallback before applying the
existing text/read-only/writable/TLS target classification. Other weak-search
policies, auxiliary targets, chained weak aliases, and non-strong or undefined
fallbacks fail closed. Exact archive inspection found two such aliases in
`libprofiler_builtins` (`__llvm_profile_counter_bias` and
`__llvm_profile_bitmap_bias`) and none in the pinned core, alloc, or std
archives. The independently authored fixture covers the accepted alias plus
unsupported-policy, auxiliary-index, and chained-alias rejection. The Linux
release gate passes 845/845 units, 2/2 object evidence, 10/10 conformance,
351/351 replacements, and 128/128 semantic tests; the release driver passes
17/17. All eight pinned std/TLS Wine modes reproduce exact recorded sizes and
SHA-256 hashes and return 42. Patent review: NOT_TRIGGERED; this is bounded
conventional PE/COFF symbol-table decoding.
