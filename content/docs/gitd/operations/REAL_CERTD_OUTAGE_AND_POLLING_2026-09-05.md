# Real certd outage and unchanged-generation observation — 2026-09-05

Status: **TESTED** using real Gitd/certd and the native Git client in hardened
Docker Compose, clean source archive SHA-256
`183e65b330de65f785898087a4c29a887161638cdf8e3c9e1d42e321f4c49bbe`.
This completes the established-work observation missing from the earlier local
mock report. No fixture certificate daemon replaces the production service.

A fresh native clone of the random 256 MiB repository was already receiving
pack data: its client network namespace had received 24,699,007 bytes. Real
certd was then stopped cleanly. Gitd's actual TLS listener health probe rejected
a new handshake, while the established clone completed and all eight 32 MiB
file hashes matched. Certd was still stopped at clone completion. Gitd's
container identity, PID and start time remained unchanged.

Certd was started again in its existing runtime namespace. A bounded actual
TLS readiness check, followed by native fetch, passed without recreating Gitd
or editing generation/state records. This separates preserved established
traffic from admission of new handshakes. The consumer still revalidates the
current identity and signing operation before re-enabling admission; an
unchanged generation response alone does not authorize resumption.

A connect-only host trace then observed 42 successful connections to the certd
Unix channel over 15.038043179 seconds: approximately 2.79 client call attempts
per second. The source uses one connection for each RPC; this is connection
observation, not packet-level proof that every frame completed within the
interval. The exact mock test independently counted 12 RPCs for four attempts.
No RPC payloads, tokens or key material were traced, and no tracing permission
or additional capability was granted to a container.

At 100 clock ticks/second, Gitd used 10.62 CPU seconds during that observation
(user ticks 90424→91483; system ticks 1044→1047), about 0.71 of one CPU core.
This is a substantial measured idle revalidation cost; no low-CPU claim is made.
Descriptor counts were 37→38 during the interval. A single interval does not
prove zero growth; the separate exact mock regression reported zero retained
descriptor growth, and all real processes subsequently stopped cleanly.

The seven sequential clean stops, including certd and Gitd, completed in two
seconds, each with exit 0 and within the configured grace period. This is actual
hosted Docker evidence, not a claim about physical hardware, public issuance or
security against the Docker host.

Exact orchestration is `established-outage-host.sh` in the final acceptance
commands; its output is retained in `cold-backup.log` before the encrypted
backup begins. The trace remains in the disposable host's private measurement
directory; only the numeric summary is exported.
