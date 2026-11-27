# HTTP/3 route contract

`GitdHttp3Server<B>` implements `/`, `/projects`, repository overview, tree,
blob, commits, commit, branches, tags, releases, signatures, `/api/v1/`,
`robots.txt`, `sitemap.xml`, and `security.txt` against a generic backend.
Inputs are bounded validated identifiers, paths, and revisions.

Smart Git protocol-v2 discovery, upload-pack, and receive-pack now share the
transport-neutral `handle_smart_git` entry point. It exact-checks HTTPS, method,
query, `Git-Protocol`, and request media type; rejects duplicate security
headers; disables caching; binds the repository generation; and passes
caller-owned bounded input/output streams to `GitdBackend`. The ordinary
page-oriented handler uses the same path with a deliberately bounded buffer for
small integration callers, while live HTTP/2 and HTTP/3 listeners must use the
streaming entry point so pack DATA remains flow-controlled.

The core adapter owns protocol-v2 capability discovery and advertises only
`ls-refs=unborn`, `fetch=ofs-delta`, and `object-format=sha256` after rechecking
the repository summary and exact generation. SHA-1 repositories and missing or
unsupported backends remain fail closed. Deployment authentication, ACLs, the
production receive-authority composition, and live listener wiring remain
required before production use. API responses are currently minimal and
**PARTIALLY IMPLEMENTED**.
