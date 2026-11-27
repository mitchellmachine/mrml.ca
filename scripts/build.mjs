import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { posix as path } from 'node:path';
import markdownit from '../vendor/markdown-it.cjs';

const repository = 'https://github.com/mitchellmachine/mrml';
const { revision, paths } = JSON.parse(readFileSync('content/snapshot.json', 'utf8'));
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Invalid MRML source revision');
const source = `${repository}/blob/${revision}/`;
const documentationSource = `${repository}/tree/${revision}/docs`;
const md = markdownit({ html: false });
const documents = new Map();
const pages = new Map();
const escape = md.utils.escapeHtml;
const slug = value => value.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-');
const url = (from, to) => path.relative(path.dirname(from), to);
const label = name => name.replace(/\.md$/i, '').replaceAll('_', ' ');

for (const file of paths.filter(file => file.endsWith('.md'))) {
  const env = {};
  const tokens = md.parse(readFileSync('content/' + file, 'utf8'), env);
  const output = 'reading/' + file.replace(/\.md$/i, '.html').toLowerCase();
  const headings = [];
  const ids = new Set();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type !== 'heading_open') continue;
    const title = tokens[index + 1].children
      .filter(child => child.type === 'text' || child.type === 'code_inline')
      .map(child => child.content).join('');
    const base = slug(title) || 'section';
    let id = base;
    for (let suffix = 1; ids.has(id); suffix++) id = base + '-' + suffix;
    ids.add(id);
    token.attrSet('id', id);
    headings.push({ title, id, level: Number(token.tag[1]) });
  }
  documents.set(file, { output, tokens, env, headings, ids, title: headings[0]?.title || label(path.basename(file)) });
}

let omittedFragments = 0;
function rewrite(file, doc, href) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return href;
  const [target, hash = ''] = href.split('#', 2);
  if (target.includes('?')) return new URL(href, source + file).href;
  const normalized = target ? path.resolve('/', path.dirname(file), decodeURIComponent(target)).slice(1) : file;
  const destination = documents.get(normalized);
  if (!destination) return source + normalized.split('/').map(encodeURIComponent).join('/') + (hash ? '#' + hash : '');
  const fragment = decodeURIComponent(hash);
  const id = destination.ids.has(fragment) ? fragment : slug(fragment);
  if (fragment && !destination.ids.has(id)) omittedFragments++;
  const anchor = destination.ids.has(id) ? '#' + encodeURIComponent(id) : '';
  return (file === normalized && anchor ? '' : url(doc.output, destination.output)) + anchor;
}

const link = (from, file, title) => {
  const target = documents.get(file);
  if (!target) throw new Error('Missing document ' + file);
  return `<a href="${url(from, target.output)}">${escape(title ?? target.title)}</a>`;
};
const groups = [
  ['Start here', 'docs/human/OVERVIEW.md', 'docs/human/GETTING_STARTED.md', 'docs/human/CONTRIBUTING.md', 'VALUES.md', 'docs/PROJECT_STATUS.md', 'docs/ROADMAP.md'],
  ['System architecture', 'docs/ARCHITECTURE.md', 'docs/gigakernel.md', 'docs/APPLICATION_PLATFORM.md', 'docs/SECURITY.md', 'docs/RECOVERY.md'],
  ['Accessibility and interaction', 'docs/ACCESSIBILITY.md', 'docs/accessibility/BRAILLE_INTERFACE.md', 'docs/accessibility/MONITOR_OFF_ACCEPTANCE.md', 'docs/BROWSER_SEMANTICS.md'],
  ['Compiler and build tools', 'docs/COMPILER.md', 'docs/compiler/LINKER.md', 'docs/build/BUILD_SYSTEM.md', 'docs/DEPLOYMENT.md'],
];
const category = file => {
  const group = groups.find(([, ...files]) => files.includes(file));
  if (group) return group[0];
  const directory = file.split('/')[1];
  const categories = {
    gitd: 'Git services and operational evidence', compiler: 'Compiler and build tools',
    build: 'Compiler and build tools', human: 'Start here', patents: 'Patent review',
    accessibility: 'Accessibility and interaction', gpu: 'Graphics and compute',
    network: 'Platform and devices', storage: 'Platform and devices', platform: 'Platform and devices',
    monitor: 'Platform and devices', memory: 'Platform and devices', packages: 'Compiler and build tools',
  };
  return categories[directory] ?? 'System architecture';
};

function page(output, title, area, body, description = 'MRML project documentation and systems research.') {
  const local = target => url(output, target);
  const nav = (target, name) => `<a href="${local(target)}"${area === target ? ' aria-current="page"' : ''}>${name}</a>`;
  pages.set(output, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escape(description)}">
<title>${escape(title)} · MRML</title>
<link rel="stylesheet" href="${local('assets/style.css')}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap header-row">
<a href="${local('index.html')}" class="brand"><span class="brand-mark" aria-hidden="true">M</span> MRML</a>
<nav aria-label="Primary">${nav('docs.html', 'Documentation')}${nav('project.html', 'Project')}<a href="${repository}/releases">Releases</a><a href="${repository}">Source code</a></nav>
</div></header>
<main class="wrap" id="main" tabindex="-1">${body}</main>
<footer class="site-footer"><div class="wrap footer-row"><span>MRML · Experimental systems research</span><span>This website was generated from the <a href="${documentationSource}">MRML docs on GitHub</a>.</span><a href="${local('project.html')}">About this documentation</a></div></footer>
</body>
</html>`);
}

const home = 'index.html';
page(home, 'Systems research in Rust', home, `
<section class="hero">
<div>
<p class="kicker">Experimental systems research</p>
<h1>Systems research<br>in <em>Rust.</em></h1>
<p class="intro">MRML is a Rust research project spanning operating systems, compilers, and local machine learning. Gigakernel is the project name for this experimental kernel design. Inside MRML OS, ordinary applications and services are designed to run only in supervised microVMs, with no native fallback.</p><p>Whether that design constitutes a distinct class of kernel remains an open question.</p>
<div class="actions"><a class="button" href="docs.html">Explore documentation</a><a class="button secondary" href="${repository}/releases">View releases</a></div>
</div>
<div class="stack">
<p class="kicker">Architecture reading guide</p>
<div class="stack-row"><span>Interaction</span>${link(home, 'docs/ACCESSIBILITY.md', 'Accessible interfaces')}</div>
<div class="stack-row"><span>Application layer</span>${link(home, 'docs/APPLICATION_PLATFORM.md', 'Application platform')}</div>
<div class="stack-row"><span>Isolation</span>${link(home, 'docs/ISOLATION_PLACEMENT.md', 'Total MicroVM isolation')}</div>
<div class="stack-row"><span>Mechanisms</span>${link(home, 'docs/gigakernel.md', 'Gigakernel')}</div>
</div>
</section>
<section class="section">
<p class="kicker">Read the project</p>
<h2>From design to evidence</h2>
<div class="feature-grid">
<article><h3>${link(home, 'docs/ARCHITECTURE.md', 'Architecture')}</h3><p>Trace the boundaries between the kernel, isolated services, virtualization, and applications.</p></article>
<article><h3>${link(home, 'docs/COMPILER.md', 'Compiler and tooling')}</h3><p>Follow the Rust compiler effort, its conformance gates, and the native build tooling.</p></article>
<article><h3>${link(home, 'docs/PROJECT_STATUS.md', 'Project status')}</h3><p>See what has been verified, then use the ${link(home, 'docs/ROADMAP.md', 'roadmap')} to follow work in dependency order.</p></article>
</div>
</section>
<section class="section"><h2>Host software and platform plans</h2><p class="intro">MRML build tools, compiler, local ML, media libraries, and Git tools can run directly on Windows or Linux. x86-64 is the primary OS bring-up target; macOS and ARM64 support are planned.</p><p>${link(home, 'README.md', 'Read the software and contribution guide')}</p></section>
<section class="section callout"><div><h2>Start with the source</h2><p>Read the setup guide, check the trust model, or inspect the repository directly.</p></div>
<nav aria-label="Starting points">${link(home, 'docs/human/GETTING_STARTED.md', 'Getting started')}${link(home, 'docs/SECURITY.md', 'Security model')}<a href="${repository}">GitHub repository</a></nav></section>`);

const catalog = 'docs.html';
const sections = new Map();
for (const [file, doc] of documents) {
  const key = category(file);
  if (!sections.has(key)) sections.set(key, []);
  sections.get(key).push([file, doc]);
}
const order = [...groups.map(([title]) => title), ...[...sections.keys()].filter(key => !groups.some(([title]) => title === key)).sort()];
page(catalog, 'Documentation', catalog, `<section class="page-intro">
<p class="kicker">MRML documentation</p><h1>Documentation</h1>
<p class="intro">Browse getting-started guides, architectural contracts, test evidence, and subsystem references.</p>
</section>
<section aria-labelledby="recommended"><h2 id="recommended">Recommended starting points</h2>
<div class="feature-grid catalog-guide">${groups.slice(0, 3).map(([title, ...files]) => `<article><h3>${title}</h3><ul>${files.slice(0, 4).map(file => `<li>${link(catalog, file)}</li>`).join('')}</ul></article>`).join('')}</div></section>
<section class="section" aria-labelledby="all"><h2 id="all">All documents</h2>
<div id="filter-panel" hidden><label for="filter">Filter by title, topic, or path</label>
<input type="search" id="filter" aria-controls="directory" autocomplete="off">
<p id="filter-status" role="status"></p></div>
<nav class="topic-links" aria-label="Documentation topics">${order.map(key => `<a href="#${slug(key)}">${key}</a>`).join('')}</nav>
<div id="directory">${order.map(key => `<section id="${slug(key)}"><h3>${key}</h3><ul>${sections.get(key).sort((a, b) => a[1].title.localeCompare(b[1].title, 'en')).map(([file]) => `<li>${link(catalog, file)}<span class="doc-path">${escape(file)}</span></li>`).join('')}</ul></section>`).join('')}</div>
</section><script src="assets/filter.js" defer></script>`);

const project = 'project.html';
page(project, 'Project', project, `<section class="page-intro"><p class="kicker">About MRML</p><h1>Project and releases</h1>
<p class="intro">MRML is an experimental computing project. The source repository contains the implementation, tests, and release history.</p></section>
<div class="feature-grid"><article><h2>Releases</h2><p>Browse published builds, assets, and release notes on GitHub.</p><a href="${repository}/releases">GitHub releases</a></article>
<article><h2>Source code</h2><p>Browse the implementation and follow project changes.</p><a href="${repository}">MRML on GitHub</a></article>
<article><h2>Contributing</h2><p>Read the project’s contribution and verification requirements.</p>${link(project, 'docs/human/CONTRIBUTING.md', 'Contributor guide')}</article></div>
<section class="section prose"><h2>Documentation provenance</h2><p>The site renders ${documents.size} Markdown documents from MRML revision <code>${escape(revision)}</code>. The <a href="${documentationSource}">source documentation on GitHub</a> is pinned to that revision. Use the dates, test environments, and status labels in the documents to interpret implementation and hardware claims.</p>
<p>${link(project, 'docs/human/OVERVIEW.md', 'Project overview')} · ${link(project, 'VALUES.md', 'Project values')} · <a href="license.txt">MRML license</a></p></section>`);

for (const [file, doc] of documents) {
  for (const token of doc.tokens) {
    for (const child of token.children ?? []) {
      if (child.type === 'link_open') child.attrSet('href', rewrite(file, doc, child.attrGet('href')));
      if (child.type === 'image') {
        const image = child.attrGet('src');
        if (!/^(https?:)?\/\//i.test(image)) {
          child.attrSet('src', new URL(image, `${repository}/raw/${revision}/${file}`).href);
        }
      }
    }
  }
  const first = doc.tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h1');
  const titleId = first === -1 ? '' : doc.tokens[first].attrGet('id');
  if (first !== -1) doc.tokens.splice(first, 3);
  for (const token of doc.tokens) {
    if (token.tag === 'h1') token.tag = 'h2';
  }
  const toc = doc.headings.filter(heading => heading.id !== titleId && heading.level <= 3);
  const article = md.renderer.render(doc.tokens, md.options, doc.env);
  page(doc.output, doc.title, catalog, `
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url(doc.output, catalog)}">Documentation</a> / <span>${escape(category(file))}</span></nav>
<div class="article-layout"><article class="prose">
<header class="article-header"><h1${titleId ? ` id="${escape(titleId)}"` : ''}>${escape(doc.title)}</h1><p class="doc-path">${escape(file)} · <a href="${source + file}">Open in source tree</a></p></header>
${article}
</article>
${toc.length ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>${toc.map(({ title, id, level }) => `<li class="level-${level}"><a href="#${encodeURIComponent(id)}">${escape(title)}</a></li>`).join('')}</ul></nav>` : ''}
</div>`);
}

const renamedPages = [
  ['reading/docs/microkernel.html', 'docs/gigakernel.md'],
  ['reading/docs/gitd/edge/microkernel_port.html', 'docs/gitd/edge/GIGAKERNEL_PORT.md'],
];
for (const [output, current] of renamedPages) {
  page(output, 'Documentation moved', catalog,
    `<section class="page-intro"><h1>Documentation moved</h1><p>Continue to ${link(output, current)}.</p></section>`);
}
const assets = new Map([['assets/style.css', 'assets/style.css'], ['assets/filter.js', 'assets/filter.js'], ['license.txt', 'content/LICENSE']]);
const allIds = new Map([...pages].map(([file, html]) => [file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]))]));
for (const [file, html] of pages) {
  for (const [, href] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
    const [target, hash] = href.split('#', 2);
    const destination = target ? path.normalize(path.join(path.dirname(file), target)) : file;
    if (!pages.has(destination) && !assets.has(destination) || hash && !allIds.get(destination)?.has(decodeURIComponent(hash))) {
      throw new Error(`Broken local link in ${file}: ${href}`);
    }
  }
}
rmSync('dist', { recursive: true, force: true });
for (const [file, html] of pages) {
  mkdirSync(path.dirname('dist/' + file), { recursive: true });
  writeFileSync('dist/' + file, html);
}
for (const [destination, input] of assets) {
  mkdirSync(path.dirname('dist/' + destination), { recursive: true });
  copyFileSync(input, 'dist/' + destination);
}
console.log(`Built ${pages.size} pages and verified local links and page anchors.`);
if (omittedFragments) console.log(`Linked ${omittedFragments} unmatched upstream anchors to their document tops.`);
