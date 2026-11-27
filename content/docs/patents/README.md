# MRML Canada patent-awareness policy

This directory records technical screening and triage. It is not a legal
opinion, freedom-to-operate search, validity analysis, or infringement
conclusion. No result proves MRML is patent-free; no listing proves
infringement.

Historical review entries retain their original scope and repository paths as
provenance. Resolve old `crates/...` references through the canonical
[source-path migration map](PATH_MIGRATION.md).

## Canadian scope

Patent rights are territorial. Canada is MRML's sole mandatory patent-review
jurisdiction. The project is developed and intentionally hosted, distributed,
released, manufactured, imported, sold, and operated only within Canada under
this policy.

For every serious mechanism, compare actual claim limitations and independently
verify each material Canadian application or patent in CIPO's authoritative
Canadian Patents Database. PCT and foreign publications can help identify a
Canadian family member or prior art, but are discovery context rather than
rights enforceable in Canada.

Foreign-family discovery is optional and does not block Canadian development or
release. Historical worldwide searches remain useful provenance but are no
longer normative gates. Intentional hosting, distribution, commercial release,
manufacture, import, sale, or operation outside Canada requires an explicit
policy amendment and jurisdiction-specific review before that expansion. An
incidental foreign clone or access does not establish review or authorization
for a supported non-Canadian distribution.

Canadian screening must disclose database, date, coverage, status, and service
limitations rather than imply every Canadian record was found or reviewed.

## Required method

Inventory implemented code, not roadmap aspirations. Prioritize codecs, GPU and
device virtualization, inference/training optimizations, quantization,
compression, cryptography, hardware security, storage/network protocols, and
novel compiler work. Search mechanisms, algorithms, data flows, state machines,
memory layouts, synchronization, and hardware interactions; use CPC/IPC and
synonyms where useful.

For every serious candidate:

1. identify relevant independent and material dependent claims;
2. decompose each claim into required limitations and compare every limitation
   with named MRML files/functions;
3. identify Canadian family/priority context without assuming identical claims;
4. verify grant, prosecution, re-examination, revocation, lapse, fees,
   ownership, term, adjustments/extensions, reinstatement exposure, and current
   status for each material Canadian right in CIPO's authoritative register;
5. record `ACTIVE`, `PENDING`, `EXPIRED`, `LAPSED`, `ABANDONED`, `CANCELLED`, or
   `UNKNOWN`, plus separate `SEARCH CONFIDENCE`, `TECHNICAL OVERLAP`, and
   `LEGAL STATUS CONFIDENCE` values;
6. record technically apparent alternatives without deleting code or copying
   implementation details from the patent.

Applications are not issued enforceable patents. Publication, grant, and
current enforceability are distinct. Family members may have different claims,
owners, terms, and outcomes.

## Patent-safe design preference

Future substantial code must prefer, in order:

1. ordinary, long-established mechanisms with no targeted review trigger;
2. a clearly non-overlapping design documented against relevant claim
   limitations;
3. mechanisms whose relevant Canadian rights are authoritatively verified
   expired, lapsed, abandoned beyond applicable restoration, or cancelled;
4. mechanisms covered for MRML's exact Canadian use and distribution by a
   verified royalty-free patent grant.

For a royalty-free option, preserve the license text/reference and verify
covered patents/claims, specification and version, Canadian territory,
beneficiaries, field of use, making/using/selling/importing/distribution rights,
sublicensing or downstream coverage, reciprocity, defensive suspension,
termination, attribution/notice, patent-pool interaction, and compatibility
with CC0 and MRML distribution. "Royalty-free" does not necessarily mean
unconditional, irrevocable, Canada-covering, transferable, or risk-free.

If none of those paths can be established, mark the mechanism for targeted
professional review or select a documented design-around. Do not silently add
it, invent a clearance result, automatically delete existing code, or degrade
MRML merely because of speculative similarity.

## Sources and standards

Use CIPO's Canadian Patents Database as the authoritative source for Canadian
applications and patents. WIPO PATENTSCOPE, the WIPO Patent Register Portal,
Espacenet/INPADOC, foreign registers, aggregators, and machine translations may
assist optional family discovery but do not replace CIPO verification and do
not create a foreign-jurisdiction review obligation under this policy.

For standards, check current IPR policies and declarations from relevant SDOs,
including IETF, IEEE, ETSI, ITU, ISO/IEC, and AOMedia. A declaration is not proof
of essentiality, validity, infringement, or license availability. Record the
exact license and conditions separately.

## Repository rules

- Use `PATENT-REVIEW: <mechanism>` sparingly; keep analysis here.
- AI generation, independent creation, open source, standards compliance, and
  CC0 do not establish patent clearance.
- Do not derive implementation code from patents or paste specification prose.
- Keep privileged advice, licensing negotiations, personal data, and
  confidential material outside this public repository.
- For substantial commits report `Patent review: NOT_TRIGGERED` or
  `Patent review: TRIGGERED`, its reason, and the review-log entry.
- Move rights between status indexes only after CIPO verification; retain
  history and dates.

Candidate records must include the Canadian application or patent number,
family/priority context where useful, owner, CIPO status/source/date, term, MRML
source, relevant claims, limitation comparison, alternatives, all three
confidence fields, reviewer/date, license conditions if any, and the technical-
screening disclaimer.
