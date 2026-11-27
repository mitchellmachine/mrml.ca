# Markdown and repository content safety

The bounded renderer escapes raw HTML, rejects traversal and malformed percent
encoding, rejects unsafe URI schemes, and resolves relative links through exact
repository object context. Heading identifiers are deterministic and unique;
inline/fenced code is escaped, and fenced language classes use a fixed allowlist.
Repository content is data and cannot create policy, authority, scripts, active
HTML, or privileged fetches.

Repository-relative images are rewritten to an immutable exact-object URL on
`raw.mrml.ca`, carry no-referrer and lazy-loading policy, and pass bounded
repository-path validation. Remote HTTP(S) images render as explicit external
links rather than image loads. Unsafe schemes, absolute paths, traversal,
encoded paths, and local path syntax fail closed.

The bounded profile also renders emphasis, strong emphasis, strikethrough,
ordered and unordered lists, accessible disabled task controls, block quotes,
horizontal rules, and HTTP(S) autolinks. Fenced language labels cover Rust,
C/C++, assembly, TOML, JSON, YAML, Bash, PowerShell, Python, HTML, CSS,
JavaScript, diff, and plain text through a closed allowlist.

Pipe tables render as semantic `table`, `thead`, `tbody`, `th`, and `td`
elements inside a keyboard-focusable horizontal scroll region. Header and body
cells reuse the safe inline renderer. Tables are limited to 64 columns and an
overwide separator fails before row rendering.

The current renderer is deliberately bounded rather than full CommonMark.
Bounded token coloring, raw-origin response-header deployment, and
broader golden hostile-content fixtures remain **PLANNED**.
