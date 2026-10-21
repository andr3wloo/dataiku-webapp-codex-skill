/* Paste raw contents into the DSS JS tab. No module loader or build step required. */
(function (root) {
  'use strict';
  const CONFIG = {
    configured: false, title: 'Published data', displayCap: 50, evidenceCap: 12,
    categoryColumn: 'category', valueColumn: 'value', evidenceColumns: ['category', 'value'],
    agent: { enabled: false, name: 'Data assistant', starters: [
      { label: 'Summarize this view', prompt: 'Summarize the current filtered evidence and its limitations.' },
      { label: 'Explain the drivers', prompt: 'Explain which visible categories contribute most, using the supplied evidence only.' },
      { label: 'Suggest a next step', prompt: 'Suggest one useful next investigation grounded in this view; distinguish facts from hypotheses.' }
    ] }
  };
  function initialState() { return { filters: { category: '' }, selected_item: null, date_range: { start: null, end: null }, active_page: 'Overview', tokens: [] }; }
  function reduce(state, event, catalog) {
    if (!event || !event.event_token || state.tokens.includes(event.event_token)) return state;
    const next = { ...state, tokens: [...state.tokens.slice(-99), event.event_token] };
    if (event.source === 'reset') return { ...initialState(), tokens: next.tokens };
    if (event.source === 'sidebar' || event.source === 'chart') {
      const category = event.filters?.category;
      if (category !== '' && !catalog.includes(category)) return state;
      next.filters = { category }; next.selected_item = null;
    } else if (event.source === 'table') next.selected_item = event.selected_item;
    return next;
  }
  function contextFor(state, data, config) {
    const records = (data?.records || []).slice(0, config.evidenceCap).map(row => Object.fromEntries(
      config.evidenceColumns.filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]])
    ));
    const selected = state.selected_item;
    return {
      context_schema_version: '1.0', active_page: state.active_page, sidebar_filters: { ...state.filters },
      date_range: { ...state.date_range }, selected_item: selected ? {
        type: 'row', label: String(selected.label).slice(0, 160), details: Object.fromEntries(
          config.evidenceColumns.filter(key => Object.hasOwn(selected.details, key)).map(key => [key, selected.details[key]])
        )
      } : null,
      visible_evidence: { total_rows: data?.total_rows || 0, shown_rows: records.length,
        truncated: (data?.total_rows || 0) > records.length, columns: config.evidenceColumns, records },
      model_context: data ? { kpis: data.kpis, chart_summary: data.categories, chart_truncated: Boolean(data.chart_truncated) } : {},
      data_sources: data?.data_sources || [], request_scope: 'filtered_dashboard', allow_global_search: false
    };
  }
  function latestOnly() {
    let revision = 0; let controller;
    return async task => {
      const current = ++revision;
      controller?.abort(); controller = new AbortController();
      try { const value = await task(controller.signal); return { current: current === revision, value }; }
      catch (error) { if (current !== revision || error.name === 'AbortError') return { current: false }; throw error; }
    };
  }
  const core = { initialState, reduce, contextFor, latestOnly };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return; }
  root.StandardWebAppCore = core;

  function mount() {
    const $ = id => document.getElementById(id);
    if (!$('standard-app')) return;
    const config = root.STANDARD_PREVIEW ? root.STANDARD_PREVIEW.config : (root.STANDARD_APP_CONFIG || CONFIG);
    let state = initialState(), data = null, catalog = [], thread = [], agentBusy = false, drawerOpen = false, closeTimer;
    let panelLayout, draftStarter = null;
    const latest = latestOnly();
    const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    async function transport(path, body, signal) {
      if (root.STANDARD_PREVIEW) return root.STANDARD_PREVIEW.request(path, body, signal);
      const helper = root.getWebAppBackendUrl || root.dataiku?.getWebAppBackendUrl;
      if (!helper) throw new Error('Enable the Dataiku JavaScript library and verify the backend URL helper.');
      const response = await fetch(helper.call(root.dataiku || root, path), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body), signal
      });
      let result;
      try { result = await response.json(); } catch (_) { throw new Error('The backend did not return JSON. Check its status and logs.'); }
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
      return result;
    }
    const button = (label, action) => { const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.onclick = action; return el; };
    function updateContext() { $('context').textContent = JSON.stringify(contextFor(state, data, config), null, 2); }
    function renderThread() {
      $('thread').replaceChildren(...thread.map(turn => {
        const el = document.createElement('p'); el.className = `message ${turn.role === 'user' ? 'user' : 'assistant'}`;
        const speaker = document.createElement('span'); speaker.className = 'speaker'; speaker.textContent = turn.role === 'user' ? 'You' : config.agent.name;
        el.append(speaker, document.createTextNode(turn.content)); return el;
      }));
      const scroller = $('thread').closest('.agent-scroll'); if (scroller) scroller.scrollTop = thread.length ? scroller.scrollHeight : 0;
    }
    function render() {
      $('category').value = state.filters.category;
      $('scope').textContent = state.filters.category || 'All categories';
      $('kpi-value').textContent = number.format(data.kpis.value);
      $('kpi-count').textContent = number.format(data.kpis.count);
      $('cap').textContent = `Showing ${data.shown_rows} of ${data.total_rows} filtered records${data.truncated ? ' · display capped' : ''}. KPIs use all filtered records.`;
      $('chart-cap').textContent = data.chart_truncated ? 'Category display capped. Totals still include all filtered records.' : '';
      const max = Math.max(1, ...data.categories.map(item => Math.abs(item.value)));
      $('chart').replaceChildren(...data.categories.map(item => {
        const el = button('', () => dispatch('chart', { filters: { category: item.category } })); el.className = 'chart-row';
        const label = document.createElement('span'); label.className = 'chart-label'; label.textContent = item.category;
        const value = document.createElement('span'); value.className = 'chart-value'; value.textContent = number.format(item.value);
        const track = document.createElement('span'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
        const bar = document.createElement('span'); bar.className = 'bar'; bar.style.setProperty('--bar-scale', String(Math.abs(item.value) / max)); track.append(bar);
        el.append(label, value, track); return el;
      }));
      $('rows').replaceChildren(...data.records.map(row => {
        const tr = document.createElement('tr');
        for (const key of [config.categoryColumn, config.valueColumn]) { const td = document.createElement('td'); td.textContent = row[key]; tr.append(td); }
        const td = document.createElement('td'); td.append(button(`Focus ${row[config.categoryColumn]}`, () => dispatch('table', { selected_item: { type: 'row', label: row[config.categoryColumn], details: row } }))); tr.append(td); return tr;
      }));
      $('selection').textContent = state.selected_item ? `Selected: ${state.selected_item.label}` : '';
      $('status').textContent = data.total_rows ? 'Results are current.' : 'No matching records. Change or reset the filters.';
      $('results').hidden = false; updateContext();
    }
    async function load() {
      data = null; $('results').hidden = true; $('retry').hidden = true; $('status').textContent = 'Loading published data…';
      $('category').value = state.filters.category; $('scope').textContent = state.filters.category || 'All categories'; updateContext();
      try {
        const result = await latest(signal => transport('data', { filters: state.filters, limit: config.displayCap }, signal));
        if (!result.current) return;
        data = result.value;
        for (const key of ['records', 'categories', 'filter_options']) if (!Array.isArray(data[key])) throw new Error(`Invalid backend contract: ${key}.`);
        catalog = data.filter_options;
        const all = document.createElement('option'); all.value = ''; all.textContent = 'All categories';
        $('category').replaceChildren(all, ...catalog.map(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; return option; }));
        render();
      } catch (error) { data = null; $('status').textContent = error.message; $('retry').hidden = false; updateContext(); }
    }
    function dispatch(source, extra = {}) {
      const next = reduce(state, { source, event_token: crypto.randomUUID(), ...extra }, catalog);
      if (next === state) return;
      state = next;
      if (source === 'table') { if (data) render(); } else load();
    }
    function setDrawer(open) {
      clearTimeout(closeTimer); drawerOpen = open;
      if (panelLayout) { panelLayout.setAgent(open); return; }
      $('agent-toggle').setAttribute('aria-expanded', String(open));
      $('agent-drawer').inert = !open;
      if (open) {
        $('agent-drawer').hidden = false; $('agent-drawer').classList.remove('closing'); $('workspace').classList.add('agent-open'); $('agent-close').focus(); updateContext();
      } else {
        $('agent-drawer').classList.add('closing'); $('agent-toggle').focus();
        closeTimer = setTimeout(() => { if (!drawerOpen) { $('agent-drawer').hidden = true; $('workspace').classList.remove('agent-open'); } }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 170);
      }
    }
    async function send(prompt, label) {
      if (agentBusy) return;
      if (!data) { $('agent-status').textContent = 'Wait for current results before asking a question.'; return; }
      agentBusy = true; $('send').disabled = true; $('agent-status').textContent = 'Preparing an answer…';
      const pending = { role: 'user', content: prompt, label: label || prompt };
      const context = contextFor(state, data, config);
      const previousThread = thread;
      thread = [...thread, pending]; renderThread(); $('message').value = '';
      if ($('context-receipt')) {
        $('context-receipt-label').textContent = 'Last submitted browser context · awaiting backend verification';
        $('context-receipt').textContent = JSON.stringify(context, null, 2);
      }
      try {
        const result = await transport('agent', { message: prompt, label: pending.label, filters: state.filters, context, history: previousThread }, undefined);
        thread = [...previousThread, pending, { role: 'assistant', content: result.answer }].slice(-40);
        renderThread(); $('history-mode').textContent = result.history_mode || 'Session-only history'; $('agent-status').textContent = '';
        if ($('context-receipt')) {
          $('context-receipt-label').textContent = result.context_receipt?.validation === 'server_recomputed'
            ? 'Last submission · context recomputed by the server and passed to the agent adapter'
            : result.context_receipt?.validation === 'fixture_only' ? 'Last submission · fixture transport only (not a live agent)' : 'Last submission · browser payload only; backend verification unavailable';
          $('context-receipt').textContent = JSON.stringify(result.context_receipt?.context || context, null, 2);
        }
      } catch (error) { thread = previousThread; renderThread(); if (!$('message').value) $('message').value = prompt; $('agent-status').textContent = error.message; if ($('context-receipt-label')) $('context-receipt-label').textContent = 'Last attempt failed · no backend context receipt received'; }
      finally { agentBusy = false; $('send').disabled = false; }
    }
    $('app-title').textContent = config.title;
    $('preview-badge').hidden = !root.STANDARD_PREVIEW;
    $('category').onchange = event => dispatch('sidebar', { filters: { category: event.target.value } });
    $('reset').onclick = () => dispatch('reset'); $('retry').onclick = load;
    if (config.agent.enabled) {
      if (config.agent.starters.length !== 3) { $('status').textContent = 'Configure exactly three agent starters.'; return; }
      $('agent-toggle').hidden = false; $('agent-toggle-label').textContent = `Ask ${config.agent.name}`; $('agent-title').textContent = config.agent.name;
      if ($('composer-agent-name')) $('composer-agent-name').textContent = config.agent.name;
      $('agent-toggle').onclick = () => setDrawer(!drawerOpen); $('agent-close').onclick = () => setDrawer(false);
      document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawerOpen) setDrawer(false); });
      $('inspect-context').onclick = () => { const target = $('context-details') || $('context'); target.hidden = !target.hidden; $('inspect-context').setAttribute('aria-expanded', String(!target.hidden)); updateContext(); };
      $('starters').replaceChildren(...config.agent.starters.map(starter => button(starter.label, () => {
        $('message').value = starter.prompt; draftStarter = starter; $('message').focus();
        if (config.agent.starterMode !== 'draft') send(starter.prompt, starter.label);
      })));
      $('composer').onsubmit = event => { event.preventDefault(); const prompt = $('message').value.trim(); if (prompt) send(prompt, draftStarter?.prompt === prompt ? draftStarter.label : undefined); };
      if (config.agent.enterToSend) $('message').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('composer').requestSubmit(); } });
      $('new-chat').onclick = async () => {
        if (agentBusy) return;
        agentBusy = true;
        try { const result = await transport('history/clear', {}, undefined); thread = []; renderThread(); $('history-mode').textContent = result.history_mode; $('agent-status').textContent = ''; if ($('context-receipt')) { $('context-receipt').textContent = ''; $('context-receipt-label').textContent = 'No question submitted yet.'; } }
        catch (error) { $('agent-status').textContent = error.message; }
        finally { agentBusy = false; }
      };
      agentBusy = true;
      transport('history', {}, undefined).then(result => { thread = result.turns || []; renderThread(); $('history-mode').textContent = result.history_mode; })
        .catch(() => { $('history-mode').textContent = 'Session-only history'; }).finally(() => { agentBusy = false; });
    }
    if (root.StandardPanelLayout) panelLayout = root.StandardPanelLayout.mount({ config, onAgentChange: open => { drawerOpen = open; if (open) updateContext(); } });
    if (config.configured) load();
    else $('status').textContent = 'Configure the published dataset in Python and set CONFIG.configured=true in JavaScript.';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})(typeof window === 'undefined' ? globalThis : window);
