#!/usr/bin/env node
// Builds portfolio-2026-antonio-chinelato.pdf from index.html (one 16:9 page per section).
// No dependencies: uses the Chrome DevTools Protocol over Node's built-in WebSocket.
// Usage:  node tools/build-pdf.mjs            (run from the repo root, after any content change)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = resolve('portfolio-2026-antonio-chinelato.pdf');
const URL_ = pathToFileURL(resolve('index.html')).href;
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(`${tmpdir()}/pdf-`);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) {
    try { await fetch(`http://127.0.0.1:${port}/json/version`); ok = true; } catch { await sleep(150); }
  }
  if (!ok) throw new Error(`Chrome did not start (looked for it at ${CHROME}; set CHROME=/path/to/chrome).`);
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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { media: 'print', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: URL_ });
  for (let i = 0; i < 100 && (await run('document.readyState')) !== 'complete'; i++) await sleep(100);
  await run('document.fonts.ready.then(() => true)');
  await run(`(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    await Promise.all([...document.images].map((i) => i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; })));
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    return true;
  })()`);
  const broken = await run('[...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute("src"))');
  if (broken.length) throw new Error(`Images failed to load: ${broken.join(', ')}`);
  await sleep(300);

  const pdf = await send('Page.printToPDF', {
    printBackground: true, preferCSSPageSize: true,
    paperWidth: 13.333, paperHeight: 7.5,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    scale: 1, transferMode: 'ReturnAsBase64',
  });
  writeFileSync(OUT, Buffer.from(pdf.data, 'base64'));
  ws.close();
  console.log(`✓ ${OUT} (${(statSync(OUT).size / 1e6).toFixed(1)} MB)`);
} finally {
  chrome.kill('SIGKILL');
  rmSync(profile, { recursive: true, force: true });
}
