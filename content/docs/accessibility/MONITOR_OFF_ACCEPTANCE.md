# Monitor-off accessibility acceptance

**Status: DESIGNED. No workflow currently passes.** This is a progressively
stricter acceptance plan, not a claim of implemented monitor-independent MRML.

> **Core MRML operation should eventually be possible with the visual monitor
> disconnected.**

## Test meaning and setup

The human tester receives no visual framebuffer information, no sighted helper
reading the screen, and no screenshot-based workaround. A virtual or physical
display backend may still exist if implementation requires it; where possible,
also test with no active physical display.

Each run records build, backend, assistive interface, speech/Braille device or
simulation, physical display state, tester experience, exact workflow, expected
semantic output/actions, pass/fail, and unsupported steps. A sighted developer
using a simulator is useful engineering evidence but is not disabled-user or
physical-hardware validation.

## Progressive workflow

An experienced accessibility user should eventually complete without visual
assistance:

```text
boot or reach login; authenticate; reach desktop
inspect windows; launch an app; navigate settings; connect network
open file picker; open/save; answer capability request; inspect authority
use browser; navigate page; enter text; download file
open isolated/disposable app; read notifications
use terminal/developer environment; compile; inspect compiler error; run
recover from app/service failure; shut down or reboot
```

Every unsupported item remains explicit. Recovery scenarios include failed
application/service/network, boot error, rollback/recovery prompt, and failed
accelerated graphics. During an induced VGPU/native-GPU-to-GOP fallback,
semantic, Braille, and speech access should continue where their services live,
including a semantic notification that acceleration failed and recovery display
mode is active.

## Semantic parity regression

For selected core workflows:

1. run through the text-only AI semantic interface;
2. run through accessibility semantics;
3. compare task-relevant meaning.

If AI receives essential role, name, state, action, security purpose, duration,
or error information unavailable to accessibility, the result is `FAIL` unless
a documented technical or security reason explains the difference. Formatting,
internal IDs, and authority need not match. The reverse redaction check also
applies: plaintext withheld from accessibility cannot leak through the AI
semantic API.

## Pass criteria

A step passes only when the tester obtains its essential state and can invoke
its permitted actions without visual assistance, coordinate guessing, secret
exposure, unauthorized fallback, or AI-provider dependence. Trusted prompts
must convey requestor, authority, scope/duration, trust domain, and choices.

Failures record missing semantics, focus/action errors, latency, backend/service
failure, redaction mismatch, and workarounds attempted. Accessibility service
restart should reconnect incremental state and restore focus/context where
practical without reboot or authority expansion.

Before `CORE-ACCESSIBLE`, the complete supported core suite must pass with
honestly stated hardware and user evidence. The accessibility ABI cannot freeze
solely from developer assumptions: practical feedback must be sought from users
experienced with refreshable Braille, screen readers, keyboard-only and low-
vision workflows, motor accessibility, and Deaf/hard-of-hearing accessibility.
One participant does not represent all needs.
