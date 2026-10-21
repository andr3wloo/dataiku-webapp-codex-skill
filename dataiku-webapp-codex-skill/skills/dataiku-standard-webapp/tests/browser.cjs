/* NODE_PATH=/path/to/bundled/node_modules node tests/browser.cjs */
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../assets/starter');
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(file)] || 'text/plain'); response.end(data);
  });
});
(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.QA_BROWSER_CHANNEL || 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const checks = [];
    const screenshotDir = process.env.QA_SCREENSHOT_DIR;
    if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
    await page.goto(`http://127.0.0.1:${server.address().port}/preview.html`);
    await page.getByText('Results are current.', { exact: true }).waitFor();
    assert.equal(await page.locator('#kpi-value').innerText(), '7,800');
    assert.equal(await page.locator('#rows tr').count(), 5); assert.match(await page.locator('#cap').innerText(), /5 of 12/);
    checks.push('KPI denominator remains 12 under a five-row display cap');
    await page.locator('#category').selectOption('North');
    await page.waitForTimeout(10); await page.locator('#category').selectOption('South');
    await page.waitForTimeout(170);
    assert.equal(await page.locator('#category').inputValue(), 'South');
    assert.equal(await page.locator('#kpi-value').innerText(), '2,600'); checks.push('Late North response cannot replace South');
    await page.getByRole('button', { name: 'Focus South', exact: true }).first().click();
    assert.match(await page.locator('#selection').innerText(), /South/);
    await page.locator('#reset').click(); await page.getByText('Results are current.', { exact: true }).waitFor();
    assert.equal(await page.locator('#category').inputValue(), ''); assert.equal(await page.locator('#selection').innerText(), '');
    await page.locator('#chart button').filter({ hasText: 'West' }).click();
    await page.getByText('Results are current.', { exact: true }).waitFor(); assert.equal(await page.locator('#category').inputValue(), 'West');
    checks.push('Chart focus, row focus, and reset synchronize visible state');
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'active-filter.png'), fullPage: true });
    await page.locator('#reset').click(); await page.getByText('Results are current.', { exact: true }).waitFor();
    await page.evaluate(() => { window.PREVIEW_ERROR = true; }); await page.locator('#reset').click();
    await page.getByText('Fixture backend unavailable. Try again.', { exact: true }).waitFor(); assert.equal(await page.locator('#results').isVisible(), false);
    await page.evaluate(() => { window.PREVIEW_ERROR = false; }); await page.locator('#retry').click(); await page.getByText('Results are current.', { exact: true }).waitFor(); checks.push('Error hides stale results; retry recovers');
    await page.locator('#agent-toggle').click();
    await page.locator('#inspect-context').click(); const context = JSON.parse(await page.locator('#context').innerText());
    assert.equal(context.visible_evidence.shown_rows, 3); assert.equal(context.visible_evidence.total_rows, 12); assert.equal(context.allow_global_search, false);
    for (let i = 0; i < 3; i++) {
      await page.locator('#starters button').nth(i).click(); await page.waitForFunction(() => !document.getElementById('send').disabled);
    }
    const calls = await page.evaluate(() => window.PREVIEW_CALLS.filter(call => call.path === 'agent'));
    assert.equal(calls.length, 3); assert.notEqual(calls[0].payload.message, calls[0].payload.label);
    assert.match(calls[1].payload.message, /contribute most/); assert.match(calls[2].payload.message, /investigation/);
    checks.push('Three starters submit distinct prompts with bounded evidence');
    await page.locator('#new-chat').click(); await page.waitForFunction(() => document.querySelectorAll('#thread .message').length === 0);
    await page.keyboard.press('Escape'); await page.waitForTimeout(190);
    assert.equal(await page.locator('#agent-drawer').isVisible(), false);
    assert.equal(await page.locator('#agent-toggle').evaluate(el => el === document.activeElement), true);
    await page.locator('#agent-toggle').click(); await page.locator('#agent-close').click(); await page.locator('#agent-toggle').click(); await page.waitForTimeout(190);
    assert.equal(await page.locator('#agent-drawer').isVisible(), true); assert.equal(await page.locator('#agent-drawer').evaluate(el => el.inert), false);
    checks.push('Escape restores focus; rapid close/open reversal keeps drawer usable');
    if (screenshotDir) { await page.screenshot({ path: path.join(screenshotDir, 'desktop-agent.png'), fullPage: true }); }
    await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('#agent-drawer').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'narrow-agent.png'), fullPage: true });
    await page.locator('#agent-close').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(30);
    assert.equal(await page.locator('#agent-drawer').isVisible(), false);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.closest('#agent-drawer') === null), true);
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'narrow.png'), fullPage: true });
    checks.push('390px reflow, reduced motion, contrast, and hidden-panel keyboard exclusion');
    const noAgent = await browser.newPage();
    await noAgent.route('**/preview-fixture.js', async route => {
      const fixture = fs.readFileSync(path.join(root, 'preview-fixture.js'), 'utf8');
      await route.fulfill({ contentType: 'text/javascript', body: fixture + '\nwindow.STANDARD_PREVIEW.config.agent.enabled = false;' });
    });
    await noAgent.goto(`http://127.0.0.1:${server.address().port}/preview.html`);
    await noAgent.getByText('Results are current.', { exact: true }).waitFor();
    assert.equal(await noAgent.locator('#agent-toggle').isVisible(), false);
    assert.equal(await noAgent.evaluate(() => window.PREVIEW_CALLS.some(call => call.path !== 'data')), false);
    checks.push('Agent-disabled app makes no agent or history requests');
    await noAgent.close();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: checks, pageErrors: errors }, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
