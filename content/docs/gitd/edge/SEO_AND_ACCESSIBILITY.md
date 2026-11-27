# SEO and accessibility

Pages are server-rendered, usable without JavaScript, and include landmarks,
headings, canonical metadata, descriptions, security headers, `robots.txt`, and
a sitemap. Git protocol and API surfaces are noindex.

The static landing and privacy pages contain unique titles and descriptions,
canonical and Open Graph metadata, semantic `header`, `nav`, and `main`
landmarks, a keyboard skip link, visible focus treatment, and a reduced-motion
override. The landing page's initial HTML contains matching `Organization` and
`WebSite` JSON-LD. All styling and images are first-party local assets, and no
JavaScript is required; the only script elements are inert JSON-LD metadata.
`website/check_static.py` verifies these properties for both pages and fails if
legacy Gitea runtime customization files reappear.

The former `gitea-custom` templates and theme were removed after their visual
language was incorporated into the first-party static and server-rendered
presentation. Gitea is not a runtime, supported deployment, or authoritative
service.

Accessibility evidence is semantic hosted markup inspection only. Keyboard,
screen-reader, Braille, reduced-motion, high-contrast, and disabled-user testing
have not been executed. No hardware or physical accessibility claim is made.
