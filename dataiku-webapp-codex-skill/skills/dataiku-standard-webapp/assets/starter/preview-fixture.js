/* Local fixture only. Do not paste this file into DSS. */
(function () {
  const rows = Array.from({ length: 12 }, (_, i) => ({ category: ['North', 'South', 'West'][i % 3], value: (i + 1) * 100 }));
  window.PREVIEW_CALLS = [];
  window.STANDARD_PREVIEW = {
    config: { configured: true, title: 'Operating performance', displayCap: 5, evidenceCap: 3,
      categoryColumn: 'category', valueColumn: 'value', evidenceColumns: ['category', 'value'],
      agent: { enabled: true, name: 'Evidence assistant', starters: [
        { label: 'Summarize this view', prompt: 'Summarize the current filtered evidence and its limitations.' },
        { label: 'Explain the drivers', prompt: 'Explain which visible categories contribute most, using supplied evidence only.' },
        { label: 'Suggest a next step', prompt: 'Suggest one investigation grounded in this view; distinguish facts from hypotheses.' }
      ] } },
    async request(path, payload) {
      window.PREVIEW_CALLS.push({ path, payload: structuredClone(payload) });
      // Delay deliberately ignores AbortSignal to exercise stale-response guards.
      await new Promise(resolve => setTimeout(resolve, payload.filters?.category === 'North' ? 120 : 15));
      if (path === 'history' || path === 'history/clear') return { turns: [], history_mode: 'Session-only history' };
      if (path === 'agent') return { answer: `Fixture answer: ${payload.context.visible_evidence.total_rows} records are in scope. This is a local stub.`, history_mode: 'Session-only history', context_receipt: { validation: 'fixture_only', context: structuredClone(payload.context) } };
      if (window.PREVIEW_ERROR) throw new Error('Fixture backend unavailable. Try again.');
      const category = payload.filters.category;
      const filtered = rows.filter(row => !category || category === row.category);
      const categories = [...new Set(filtered.map(row => row.category))].map(category => ({ category, value: filtered.filter(row => row.category === category).reduce((sum, row) => sum + row.value, 0) }));
      return { records: filtered.slice(0, payload.limit), total_rows: filtered.length, shown_rows: Math.min(filtered.length, payload.limit),
        truncated: filtered.length > payload.limit, kpis: { count: filtered.length, value: filtered.reduce((sum, row) => sum + row.value, 0) },
        categories, chart_truncated: false, filter_options: ['North', 'South', 'West'], data_sources: ['synthetic_fixture'] };
    }
  };
})();
