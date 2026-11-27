# MRML website

This repository builds the MRML documentation site for GitHub Pages. The project
source and releases are at https://github.com/mitchellmachine/mrml.

## Build locally

Run `node scripts/build.mjs` with Node.js 24. Open `dist/index.html` or serve
`dist/` with a static HTTP server. The build validates generated local links
and anchors.

## Refresh the documentation

Run `node scripts/snapshot.mjs ../mrml`, review the `content/` diff, and
rebuild. The snapshot reads committed Markdown, README, values, and license from
the source checkout's HEAD. Probe and machine-reference directories are omitted.
The source commit is recorded in `content/snapshot.json`. It may be newer than
the GitHub mirror. Repository links outside the site point to GitHub.

The build uses the vendored browser distribution of markdown-it 14.1.1 from npm.
Its license is under `vendor/`. CI needs no package installation or upstream
checkout.

## Publish

Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
The workflow builds pushes and pull requests, and deploys the default branch
through the `github-pages` environment. Configure the domain and DNS separately
if using a custom domain.

