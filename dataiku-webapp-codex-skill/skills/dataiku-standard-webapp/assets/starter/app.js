/* Paste raw contents into the DSS JS tab. No module loader or build step required. */
(function (root) {
  'use strict';
  const CONFIG = {
  configured: false, title: 'Operating performance', pageTitle: 'Overview', subtitle: '',
  filters: { enabled: true }, displayCap: 50, evidenceCap: 12,
  categoryColumn: 'category', valueColumn: 'value', evidenceColumns: ['category', 'value'],
  panels: { filterWidth: 248, agentWidth: 320, centerMin: 360, breakpoint: 1000, agentInitiallyOpen: true },
  agent: { enabled: false, name: 'Assistant', starterMode: 'draft', enterToSend: true, starters: [
    { label: 'Summarize this scope', prompt: 'Summarize the current filtered scope using its full-population KPIs and bounded evidence. Identify missing data and limitations.' },
    { label: 'Investigate this selection', prompt: 'Investigate the selected item in the current filter scope. If nothing is selected, ask which item to inspect. Separate evidence from hypotheses.' },
    { label: 'Suggest the next check', prompt: 'Suggest one practical next check grounded in this dashboard scope, with the evidence supporting it. Do not perform changes.' }
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
  function clampWidths(available,left,right,centerMin=360){
    const budget=Math.max(0,available-centerMin);
    let l=left ? Math.max(200,Math.min(400,left)):0;
    let r=right ? Math.max(280,Math.min(520,right)):0;
    if(l+r>budget){const extra=l+r-budget;const dl=Math.min(Math.max(0,l-200),extra);l-=dl;r=Math.max(right?280:0,r-(extra-dl));}
    return {left:l,right:r};
  }
  function mountPanels({config,onAgentChange}){
    const $=id=>document.getElementById(id), app=$('standard-app'), workspace=$('workspace');
    const opts={filterWidth:248,agentWidth:320,centerMin:360,breakpoint:1000,...config.panels};
    const widths={left:opts.filterWidth,right:opts.agentWidth};
    let filters=config.filters?.enabled!==false,agent=false,narrow=false,modal=null,drag=null;
    $('filter-toggle').hidden=config.filters?.enabled===false;
    const panel=which=>$(which==='left'?'filter-panel':'agent-drawer');
    const trigger=which=>$(which==='left'?'filter-toggle':'agent-toggle');
    function sync(){
      const visible=clampWidths(workspace.clientWidth,filters?widths.left:0,agent?widths.right:0,opts.centerMin);
      app.style.setProperty('--filter-track',visible.left+'px');app.style.setProperty('--agent-track',visible.right+'px');
      for(const [which,open] of [['left',filters],['right',agent]]){
        const el=panel(which);el.hidden=!open;el.inert=!open;trigger(which).setAttribute('aria-expanded',String(open));
        const handle=$(which==='left'?'filter-resizer':'agent-resizer');
        const value=which==='left'?visible.left:visible.right;
        handle.setAttribute('aria-valuenow',String(Math.round(value)));
        const other=which==='left'?visible.right:visible.left;
        handle.setAttribute('aria-valuemax',String(Math.max(which==='left'?200:280,Math.min(which==='left'?400:520,workspace.clientWidth-opts.centerMin-other))));
        el.removeAttribute('role');el.removeAttribute('aria-modal');
      }
      modal=narrow?(agent?'right':filters?'left':null):null;
      if(modal){panel(modal).setAttribute('role','dialog');panel(modal).setAttribute('aria-modal','true');}
      $('dashboard').inert=Boolean(modal);app.querySelector('.toolbar').inert=Boolean(modal);app.querySelector('.masthead').inert=Boolean(modal);$('panel-scrim').hidden=!modal;
      onAgentChange(agent);
    }
    function setPanel(which,open,focus=true){
      if(which==='left')filters=open&&config.filters?.enabled!==false;else agent=open&&config.agent.enabled;
      if(narrow&&open){if(which==='left')agent=false;else filters=false;}
      sync();
      if(focus)(open?$(which==='left'?'filter-close':'agent-close'):trigger(which)).focus();
    }
    function responsive(){
      if(!app.clientWidth)return;
      const next=app.clientWidth<Math.max(opts.breakpoint,opts.centerMin+200+280+16);
      if(next!==narrow){const focused=panel('left').contains(document.activeElement)?'left':panel('right').contains(document.activeElement)?'right':null;narrow=next;app.classList.toggle('narrow',narrow);if(narrow){finish();filters=false;agent=false;}sync();if(focused&&!modal)trigger(focused).focus();}
      else sync();
    }
    function finish(event){
      if(!drag)return;
      const {handle,id}=drag;drag=null;app.classList.remove('resizing');
      if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);
    }
    for(const which of ['left','right']){
      const handle=$(which==='left'?'filter-resizer':'agent-resizer');
      function resize(value){
        const other=which==='left'?(agent?widths.right:0):(filters?widths.left:0);
        const max=Math.max(which==='left'?200:280,Math.min(which==='left'?400:520,workspace.clientWidth-opts.centerMin-other));
        widths[which]=Math.max(which==='left'?200:280,Math.min(max,value));sync();
      }
      handle.onpointerdown=event=>{if(event.button!==0||narrow)return;event.preventDefault();drag={handle,id:event.pointerId,which,x:event.clientX,width:panel(which).getBoundingClientRect().width};handle.setPointerCapture(event.pointerId);app.classList.add('resizing');};
      handle.onpointermove=event=>{if(!drag||drag.handle!==handle||drag.id!==event.pointerId)return;resize(drag.width+(event.clientX-drag.x)*(which==='left'?1:-1));};
      handle.onpointerup=finish;handle.onpointercancel=finish;handle.onlostpointercapture=finish;
      handle.onkeydown=event=>{const step=event.shiftKey?40:10;const current=panel(which).getBoundingClientRect().width;let target;if(event.key==='ArrowLeft')target=current+(which==='left'?-step:step);if(event.key==='ArrowRight')target=current+(which==='left'?step:-step);if(event.key==='Home')target=which==='left'?200:280;if(event.key==='End')target=Number(handle.getAttribute('aria-valuemax'));if(target!==undefined){event.preventDefault();resize(target);}};
    }
    $('filter-toggle').onclick=()=>setPanel('left',!filters);$('filter-close').onclick=()=>setPanel('left',false);
    $('panel-scrim').onclick=()=>{if(modal)setPanel(modal,false);};
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&(modal||agent||filters)){event.preventDefault();setPanel(modal||(agent?'right':'left'),false);}
      if(event.key==='Tab'&&modal){const els=[...panel(modal).querySelectorAll('button:not([disabled]),select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.hidden&&el.getClientRects().length);if(!els.length)return;const first=els[0],last=els[els.length-1];if(event.shiftKey&&(document.activeElement===first||!panel(modal).contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!panel(modal).contains(document.activeElement))){event.preventDefault();first.focus();}}
    });
    app.querySelector('.skip-link').onclick=event=>{event.preventDefault();if(!modal)$('dashboard').focus();};
    const observer=new ResizeObserver(responsive);observer.observe(app);responsive();
    if(config.agent.enabled&&opts.agentInitiallyOpen&&!narrow)setPanel('right',true,false);
    return {setAgent:open=>setPanel('right',open),destroy:()=>{finish();observer.disconnect();}};
  }
  const core = { initialState, reduce, contextFor, latestOnly, clampWidths };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return; }
  root.StandardWebAppCore = core;
  root.StandardWebAppDefaults = CONFIG;

  function mount() {
    const $ = id => document.getElementById(id);
    if (!$('standard-app')) return;
    const config = root.STANDARD_PREVIEW ? root.STANDARD_PREVIEW.config : (root.STANDARD_APP_CONFIG || CONFIG);
    let state = initialState(), data = null, catalog = [], thread = [], agentBusy = false, drawerOpen = false;
    let panelLayout, draftStarter = null, historyLoaded = false;
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
    function syncReset() { $('scope-reset').hidden = config.filters?.enabled !== false || (!state.filters.category && !state.selected_item); }
    function render() {
      syncReset();
      $('category').value = state.filters.category;
      $('scope').textContent = state.filters.category || 'All categories';
      $('kpi-value').textContent = number.format(data.kpis.value);
      $('kpi-count').textContent = number.format(data.kpis.count);
      $('cap').textContent = data.truncated ? `Showing ${data.shown_rows} of ${data.total_rows} matching records · totals include all matches.` : `${data.total_rows} matching records.`;
      const source = $('source-summary');
      const sources = Array.isArray(data.data_sources) ? data.data_sources.filter(value => typeof value === 'string') : [];
      source.hidden = Boolean(root.STANDARD_PREVIEW) || !sources.length;
      source.textContent = sources.join(' · '); source.title = source.textContent;
      $('chart-guidance').hidden = !data.categories.length;
      $('chart-cap').textContent = data.chart_truncated ? 'Category display capped. Totals still include all filtered records.' : '';
      const low = Math.min(0, ...data.categories.map(item => item.value));
      const high = Math.max(0, ...data.categories.map(item => item.value));
      const span = high - low || 1;
      $('chart').classList.toggle('mixed-sign', low < 0); $('chart').style.setProperty('--zero', `${-low / span * 100}%`);
      $('chart').replaceChildren(...data.categories.map(item => {
        const el = button('', () => dispatch('chart', { filters: { category: item.category } })); el.className = 'chart-row';
        const label = document.createElement('span'); label.className = 'chart-label'; label.textContent = item.category;
        const value = document.createElement('span'); value.className = 'chart-value'; value.textContent = number.format(item.value);
        const track = document.createElement('span'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
        const bar = document.createElement('span'); bar.className = 'bar'; bar.style.setProperty('--bar-scale', String(Math.abs(item.value) / span)); bar.style.setProperty('--bar-offset', `${(Math.min(0, item.value) - low) / span * 100}%`); track.append(bar);
        el.append(label, value, track); return el;
      }));
      $('rows').replaceChildren(...data.records.map(row => {
        const tr = document.createElement('tr');
        for (const key of [config.categoryColumn, config.valueColumn]) { const td = document.createElement('td'); td.textContent = row[key]; tr.append(td); }
        const td = document.createElement('td'); td.append(button(`Focus ${row[config.categoryColumn]}`, () => dispatch('table', { selected_item: { type: 'row', label: row[config.categoryColumn], details: row } }))); tr.append(td); return tr;
      }));
      $('selection').textContent = state.selected_item ? `Selected: ${state.selected_item.label}` : '';
      $('status').textContent = data.total_rows ? `${data.total_rows} matching records.` : 'No matching records. Change or reset the filters.';
      $('results').hidden = false; updateContext(); loadHistory();
    }
    async function load() {
      syncReset();
      data = null; $('results').hidden = true; $('retry').hidden = true; $('status').textContent = 'Loading records…'; $('source-summary').hidden = true;
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
    function setDrawer(open) { panelLayout.setAgent(open); }
    function loadHistory() {
      if (!config.agent.enabled || !drawerOpen || !data || historyLoaded) return;
      historyLoaded = true; agentBusy = true;
      transport('history', {}, undefined).then(result => { thread = result.turns || []; renderThread(); $('history-mode').textContent = result.history_mode; })
        .catch(() => { $('history-mode').textContent = 'Session-only history'; }).finally(() => { agentBusy = false; });
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
            : result.context_receipt?.validation === 'fixture_only' ? 'Last submission · test transport; server verification unavailable' : 'Last submission · browser payload only; backend verification unavailable';
          $('context-receipt').textContent = JSON.stringify(result.context_receipt?.context || context, null, 2);
        }
      } catch (error) { thread = previousThread; renderThread(); if (!$('message').value) $('message').value = prompt; $('agent-status').textContent = error.message; if ($('context-receipt-label')) $('context-receipt-label').textContent = 'Last attempt failed · no backend context receipt received'; }
      finally { agentBusy = false; $('send').disabled = false; }
    }
    $('app-title').textContent = config.title;
    $('page-title').textContent = config.pageTitle || 'Overview';
    $('subtitle').textContent = config.subtitle || ''; $('subtitle').hidden = !config.subtitle;
    panelLayout = mountPanels({ config, onAgentChange: open => { drawerOpen = open; if (open) { updateContext(); loadHistory(); } } });
    $('category').onchange = event => dispatch('sidebar', { filters: { category: event.target.value } });
    $('reset').onclick = () => dispatch('reset'); $('scope-reset').onclick = () => dispatch('reset'); $('retry').onclick = load;
    if (config.agent.enabled) {
      if (config.agent.starters.length !== 3) { $('status').textContent = 'Configure exactly three agent starters.'; return; }
      $('agent-toggle').hidden = false; $('agent-toggle-label').textContent = `Ask ${config.agent.name}`; $('agent-title').textContent = config.agent.name;
      if ($('composer-agent-name')) $('composer-agent-name').textContent = config.agent.name;
      $('agent-toggle').onclick = () => setDrawer(!drawerOpen); $('agent-close').onclick = () => setDrawer(false);
      $('inspect-context').onclick = () => { const target = $('context-details') || $('context'); target.hidden = !target.hidden; $('inspect-context').setAttribute('aria-expanded', String(!target.hidden)); updateContext(); };
      $('starters').replaceChildren(...config.agent.starters.map(starter => button(starter.label, () => {
        $('message').value = starter.prompt; draftStarter = starter; $('message').focus();
        if (config.agent.starterMode === 'send') send(starter.prompt, starter.label);
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
    }
    if (config.configured) load();
    else $('status').textContent = 'Configure the published dataset in Python and set CONFIG.configured=true in JavaScript.';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})(typeof window === 'undefined' ? globalThis : window);
