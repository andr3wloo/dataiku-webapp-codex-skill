/* Review-only transport. Never include this file in DSS editor tabs. */
(function () {
  const params = new URLSearchParams(location.search);
  window.PREVIEW_ERROR = params.get('state') === 'error';
  window.PREVIEW_MISSING_COLUMN = params.get('state') === 'missing-column';
  window.PREVIEW_EMPTY = params.get('state') === 'empty';
  const rows = Array.from({ length: 12 }, (_, i) => ({ category: ['North', 'South', 'West'][i % 3], value: (i + 1) * 100 * (params.get('state') === 'signed' && i % 3 === 0 ? -1 : 1) }));
  window.PREVIEW_CALLS = [];
  window.STANDARD_PREVIEW = {
    overrides: { configured: true, displayCap: 5, evidenceCap: 3, filters: {enabled:params.get('filters') !== 'off'}, agent: { enabled: params.get('agent') !== 'off', starterMode: params.get('starters') === 'send' ? 'send' : 'draft' } },
    get config() {
      const defaults = window.STANDARD_APP_CONFIG || window.StandardWebAppDefaults;
      return {...defaults, ...this.overrides, agent:{...defaults.agent, ...this.overrides.agent},
        filters:{...defaults.filters, ...this.overrides.filters}};
    },
    async request(path, payload) {
      window.PREVIEW_CALLS.push({ path, payload: structuredClone(payload) });
      // Delay deliberately ignores AbortSignal to exercise stale-response guards.
      await new Promise(resolve => setTimeout(resolve, payload.filters?.category === 'North' ? 120 : 15));
      if (path === 'history' || path === 'history/clear') return { turns: [], history_mode: 'Session-only history' };
      if (path === 'agent') return { answer: `${payload.context.visible_evidence.total_rows} records are in scope. Totals include all matching records.`, history_mode: 'Session-only history', context_receipt: { validation: 'fixture_only', context: structuredClone(payload.context) } };
      if (window.PREVIEW_ERROR) throw new Error('Unable to load records. Try again.');
      if (window.PREVIEW_MISSING_COLUMN) throw new Error('Required column value is unavailable. Check the source schema.');
      const category = payload.filters.category;
      const filtered = window.PREVIEW_EMPTY ? [] : rows.filter(row => !category || category === row.category);
      const categories = [...new Set(filtered.map(row => row.category))].map(category => ({ category, value: filtered.filter(row => row.category === category).reduce((sum, row) => sum + row.value, 0) }));
      return { records: filtered.slice(0, payload.limit), total_rows: filtered.length, shown_rows: Math.min(filtered.length, payload.limit),
        truncated: filtered.length > payload.limit, kpis: { count: filtered.length, value: filtered.reduce((sum, row) => sum + row.value, 0) },
        categories, chart_truncated: false, filter_options: ['North', 'South', 'West'], data_sources: ['local_fixture'] };
    }
  };
})();
