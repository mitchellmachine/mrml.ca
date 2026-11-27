# HTTP/3 route contract

This describes the route implementation and backend contract. The tested base
[Linux deployment](LINUX_DEPLOYMENT.md) is TLS 1.3/HTTP/2 over TCP only;
HTTP/3 route code does not mean UDP is enabled or accepted in that deployment.

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
unsupported backends remain fail closed. The transport-neutral route handler does not itself confer authorization.
See the [Linux deployment](LINUX_DEPLOYMENT.md) for authority wiring and the
difference between enabled H2 and optional H3. API responses remain minimal
and **PARTIALLY IMPLEMENTED**.
