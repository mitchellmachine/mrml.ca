# GPU oracle and native-driver bring-up

**Status: PLANNED.** Native NVIDIA Blackwell is GPU priority 2 after the
VirtualGPU completion gate. AMD and Intel remain first-class later targets.

## Linux oracle

Linux with existing vendor drivers is a behavioral/reference environment, not
the native MRML driver and not production replay architecture. Controlled tools
may generate workloads, capture normalized events, compare backends, and store
machine-readable reproducible differences for adversarial review. Captures are
untrusted evidence, never authoritative packets to replay blindly.

Record workload, API calls, normalized resources/synchronization, model,
firmware/GSP, driver, tool/compiler versions, hashes, provenance, and results.
Never copy proprietary code, firmware, disassembly prose, or implementation
source. Do not claim clean-room status without a defined and followed process.
Conceptual `mrml-gpu-oracle`, `mrml-gpu-trace`, and `mrml-gpu-diff` tools are
development-only and not production runtime dependencies.

## Blackwell

Every Blackwell-driven portable-API expansion records the exact hardware need,
portable semantic case, alternatives, backend-private option, and measured
performance. Device descriptors, packets, firmware state, synchronization, and
layouts remain private unless genuinely cross-vendor.

Target exact GPU, PCI identity, firmware/GSP, and protocol generation; do not
generalize one observation to all NVIDIA hardware. Support multiple explicitly
recognized versions and fail closed on unknown incompatible generations. Vendor
firmware is an explicit TCB input, not proof of correctness.

Bring-up follows GPU-0 transfer, GPU-1 desktop, GPU-2 compute, GPU-3 matrix,
GPU-4 advanced graphics, GPU-5 media, GPU-6 fabric. Early CLI/conformance probes
cover enumerate, allocate, fill/copy, timeline, tiny compute/checksum, render
target, compositor rectangle, and presentation without waiting for a full GUI.

The initial physical gate admits the device; isolates domain memory through exact
GPU/IOMMU mappings; transfers; runs a memory-safe MRML compute kernel; synchronizes
timelines; renders a basic surface; detects/resets loss; invalidates generations;
proves cross-domain denial; and passes common conformance on real Blackwell.
This is more important than CUDA compatibility and does not require advanced
media/ray/fabric features.

Later milestones measure native matrix acceleration and compositor performance,
including throughput, latency, bandwidth, power where available, compile time,
and submission overhead. Blackwell then hosts the already-proven VirtualGPU
protocol; it does not gain a special guest ABI. Hardware-specific requirements
remain backend-private or `nvidia.*` unless genuinely portable.

AMD and Intel implement the same object/security/conformance model without
NVIDIA assumptions about subgroup, matrix, queues, memory, or synchronization.
Optimized cross-vendor libraries target stable MRML tensor/compute primitives;
Python/framework bindings are not the GPU ABI.

Patent review: `TRIGGERED`; see
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
