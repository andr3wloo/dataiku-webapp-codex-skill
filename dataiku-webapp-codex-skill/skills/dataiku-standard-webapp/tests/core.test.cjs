const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initialState, reduce, contextFor, latestOnly } = require('../assets/starter/app.js');
test('filter validation, token deduplication, focus and reset', () => {
  const initial = initialState();
  const event = { source: 'chart', event_token: '1', filters: { category: 'North' } };
  const next = reduce(initial, event, ['North']);
  assert.equal(next.filters.category, 'North');
  assert.equal(reduce(next, event, ['North']), next);
  assert.equal(reduce(next, { ...event, event_token: '2', filters: { category: 'unknown' } }, ['North']), next);
  const focus = reduce(next, { source: 'table', event_token: '3', selected_item: { label: 'North' } }, ['North']);
  assert.ok(focus.selected_item);
  const reset = reduce(focus, { source: 'reset', event_token: '4' }, ['North']);
  assert.equal(reset.filters.category, ''); assert.equal(reset.selected_item, null);
});
test('context allowlist, evidence cap, total and explicit scope', () => {
  const state = initialState(); state.selected_item = { label: 'North', details: { category: 'North', secret: 'hidden' } };
  const ctx = contextFor(state, { total_rows: 100, records: [{ category: 'North', secret: 'hidden' }, { category: 'South' }] }, { evidenceCap: 1, evidenceColumns: ['category'] });
  assert.equal(ctx.visible_evidence.shown_rows, 1); assert.equal(ctx.visible_evidence.total_rows, 100);
  assert.equal(ctx.visible_evidence.truncated, true); assert.equal(ctx.allow_global_search, false);
  assert.equal(JSON.stringify(ctx).includes('hidden'), false);
});
test('late success and late failure cannot overwrite a newer response', async () => {
  const run = latestOnly(); let resolve, reject;
  const old = run(() => new Promise(r => { resolve = r; }));
  const recent = await run(async () => 'new'); resolve('old');
  assert.equal(recent.current, true); assert.equal((await old).current, false);
  const failure = run(() => new Promise((_, r) => { reject = r; }));
  await run(async () => 'latest'); reject(new Error('obsolete')); assert.equal((await failure).current, false);
});
