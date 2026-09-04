#!/usr/bin/env node
// Builds the site's PDFs from its HTML pages with headless Chrome (DevTools Protocol,
// Node's built-in WebSocket — no dependencies). Run from the repo root after any content change:
//
//   node tools/build-pdf.mjs              build everything
//   node tools/build-pdf.mjs curriculo    build one job by name (portfolio | curriculo)
//
// Each page's @media print rules decide the layout; this script only sets the paper size.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const JOBS = {
  portfolio: {
    page: 'index.html',
    out: 'pdf/portfolio-2026-antonio-chinelato.pdf',
    paper: { paperWidth: 13.333, paperHeight: 7.5 },     // 16:9 slides
    viewport: { width: 1280, height: 720 },
  },
  curriculo: {
    page: 'curriculo.html',
    out: 'pdf/curriculo-antonio-chinelato.pdf',
    paper: { paperWidth: 8.27, paperHeight: 11.69 },     // A4 portrait
    viewport: { width: 794, height: 1123 },
  },
};

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wanted = process.argv.slice(2);
for (const name of wanted) if (!JOBS[name]) { console.error(`Unknown job "${name}". Available: ${Object.keys(JOBS).join(', ')}`); process.exit(1); }
const jobs = wanted.length ? wanted : Object.keys(JOBS);

const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(`${tmpdir()}/pdf-`);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) {
    try { await fetch(`http://127.0.0.1:${port}/json/version`); ok = true; } catch { await sleep(150); }
  }
  if (!ok) throw new Error(`Chrome did not start (looked for it at ${CHROME}; set CHROME=/path/to/chrome).`);
}

async function openTab() {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let seq = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const run = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
  return { ws, send, run };
}

async function build(name) {
  const job = JOBS[name];
  const { ws, send, run } = await openTab();
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { ...job.viewport, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { media: 'print', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.navigate', { url: pathToFileURL(resolve(job.page)).href });
    for (let i = 0; i < 100 && (await run('document.readyState')) !== 'complete'; i++) await sleep(100);
    await run('document.fonts.ready.then(() => true)');
    await run(`(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      await Promise.all([...document.images].map((i) => i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; })));
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      return true;
    })()`);
    const broken = await run('[...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute("src"))');
    if (broken.length) throw new Error(`${job.page}: images failed to load: ${broken.join(', ')}`);
    await sleep(300);

    const pdf = await send('Page.printToPDF', {
      printBackground: true, preferCSSPageSize: true, ...job.paper,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      scale: 1, transferMode: 'ReturnAsBase64',
    });
    const out = resolve(job.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(pdf.data, 'base64'));
    const pages = (pdf.data.length && Buffer.from(pdf.data, 'base64').toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`✓ ${job.out}  ${(statSync(out).size / 1e6).toFixed(1)} MB, ${pages} page${pages === 1 ? '' : 's'}`);
  } finally {
    ws.close();
  }
}

try {
  await connect();
  for (const name of jobs) await build(name);
} finally {
  chrome.kill('SIGKILL');
  await new Promise((r) => (chrome.exitCode === null ? chrome.once('exit', r) : r()));
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
