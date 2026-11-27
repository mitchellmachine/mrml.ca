# ACME and certificate-service patent/IPR screen — 2026-09-01

This is a technical engineering risk screen, not legal advice or a freedom-to-
operate opinion. The review scope is Canada-first claim screening plus applicable
IETF disclosures. Engineering classification: **REVIEWED_NOT_BLOCKING**. Formal
legal FTO: **NOT_PERFORMED**. Production counsel may independently confirm the
current Canadian dockets and exact shipping implementation.

## Standards reviewed

- RFC 8555, Automatic Certificate Management Environment (ACME)
- RFC 7515, JSON Web Signature (JWS)
- RFC 7517, JSON Web Key (JWK)
- RFC 7518, JSON Web Algorithms (JWA)
- RFC 7638, JSON Web Key Thumbprint
- RFC 2986, PKCS #10
- RFC 5280, Internet X.509 PKI certificate and CRL profile
- RFC 7301, TLS Application-Layer Protocol Negotiation
- RFC 8737, ACME TLS-ALPN-01
- RFC 9773, ACME Renewal Information (ARI)

## Material IETF disclosures considered

- Certicom disclosures 1969 and 1966: US6704870 and US7215773 and identified
  foreign families.
- INEOVATION disclosures 2357 and 2359: EP1858224.
- Related X.509 disclosure: US6370629, US6393126, and identified foreign
  applications.

Foreign rights and publications are discovery context only; they do not replace
the required Canadian claim analysis.

## Canadian claim findings supplied for this screen

- CA2202566C: listed expired 2017-04-14.
- CA2540787C: listed expired 2017-04-14.
- CA2640992A1: listed abandoned.
- CA2305896C: listed expired 2018-10-14.
- CA2287596A1: listed abandoned.
- CA2398415A1: listed abandoned.

No currently enforceable Canadian claim was identified in this screen that
appears necessary to implement the scoped MRML ACME client, ordinary P-256 and
ES256, JWS/JWK, PKCS #10, X.509 issuance validation, HTTP-01, DNS-01,
TLS-ALPN-01, RFC 9773 ARI, durable certificate activation, or Gitd reload.

## Re-review triggers

A targeted patent/IPR review is required before introducing any of:

- smart-card precomputed signing-element machinery;
- MultiTLS multiplexing;
- route-selected multi-vantage CA validation;
- CMPv2-to-ACME or private-network challenge proxying;
- 5G network-function certificate brokerage; or
- operation of an MRML public certification authority.

The current implementation does not intentionally introduce those mechanisms.
Ordinary fixed-route authoritative-plus-resolver DNS observation is not
route-selected multi-vantage CA validation. MRML is an ACME client and
certificate lifecycle service here, not a public CA.
