# Gitd core adapter contract

The edge-local `GitdBackend` mirrors the core's typed query boundary. The thin
adapter must map repository identity/generation, limits, object IDs, paths,
trust and revocation generations, verification results, and Smart Git budgets
without weakening either side. It must stream Smart Git through `BoundedRead`
and `BoundedWrite`; buffering an entire pack is forbidden.

Each call independently authorizes the repository and exact generation. A
generation change maps to `StaleGeneration`; private and absent repositories are
indistinguishable publicly. Core errors must not leak storage paths or secrets.
Golden edge tests currently use an in-memory backend. The core READY record now
exists. The adapter implements edge-owned protocol-v2 discovery only after an
exact SHA-256 repository summary/generation check; upload-pack and receive-pack
remain delegated through the same bounded stream contract.

Gitd now composes every sorted authenticated catalog entry into one
`GitdRepositorySet`. Each entry owns its already-admitted filesystem view, and
binary-search selection uses only the exact typed `owner/repository` identity;
an absent identity is `NotFound` and no name becomes a path or fallback. All
queries and Smart Git streams then delegate through the existing SHA-256 core
adapter. Focused hosted evidence exact-matches an admitted generation and
rejects an absent repository. This set currently supports the filesystem view's
read/discovery/upload behavior; protected receive requires the separate
authority-bearing mutable backend before public listener composition.

Production remains blocked on independently validated certd identity material,
protected receive attachment to this repository set, and live listener/drain
composition.
