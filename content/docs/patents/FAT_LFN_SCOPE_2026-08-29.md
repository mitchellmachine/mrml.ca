# FAT long-file-name technical patent screen — 2026-08-29

This is a technical risk screen, not legal advice or a claim of worldwide patent
clearance.

## MRML mechanism screened

The bounded read-only FAT32 provider decodes adjacent FAT long-file-name records,
checks their ordinal sequence, reserved fields, short-name checksum, termination,
255-code-unit bound, and UTF-16 structure, and attaches the result as a
non-authorizing display label to the already validated short directory record.
It does not create aliases, allocate or write directory records, generate short
names, or let either name grant access. Stable storage objects and capabilities
remain the authority boundary.

## Family and Canadian status

Automated family discovery identified the 1993-priority “common name space for
long and short filenames” family, including Canadian patent `CA 2,120,461`, US
members `US 5,579,517`, `US 5,758,352`, and `US 6,286,013`, European publication
`EP 0,618,540`, and related German and Japanese national members. The claims
screened center on storing/using associated long- and short-name directory
records in a shared namespace; that is close enough to trigger review even
though this MRML increment is read-only and names do not authorize.

The Canadian filing date recorded for `CA 2,120,461` is 1994-03-31. Section 44
of the current Canadian Patent Act fixes the ordinary term for an application
filed after 1989-10-01 at twenty years from filing. The new additional-term
regime is unavailable to filings before 2020-12-01. The ordinary Canadian term
therefore ended no later than 2014-03-31. CIPO's official historical patent index
also records issuance of `CA 2,120,461` on 2009-09-22.

The live Canadian Patents Database reported an ongoing service interruption on
2026-08-29, so its per-record administrative page could not be independently
captured. The statutory dates establish that this historical Canadian patent
cannot remain in its ordinary or additional term. Outside-Canada family status
is not promoted to an authoritative clearance claim by this screen and must be
rechecked before a materially relevant distribution territory is added.

Sources consulted:

- [Canadian Patent Act, section 44](https://laws-lois.justice.gc.ca/eng/acts/P-4/section-44.html)
- [Canadian Patent Act, additional-term eligibility](https://laws-lois.justice.gc.ca/eng/acts/P-4/FullText.html)
- [CIPO patent services and current database interruption](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/patents)
- [Official 2009 Canadian patent issue index](https://publications.gc.ca/collections/collection_2016/opic-cipo/RG42-1-137S.pdf)
- [Family discovery record for CA 2,120,461](https://patents.google.com/patent/CA2120461A1/en)

## Result

Patent review: **TRIGGERED** because the decoded on-disk association overlaps the
historical family's technical subject matter. The identified Canadian right is
expired by statutory term, so it does not block this Canadian implementation.
The implementation remains independently authored from the published FAT format
and tests, and no patent implementation prose was copied into source.
