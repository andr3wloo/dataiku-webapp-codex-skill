/* Paste config.js, panels.js, then ../starter/app.js into the single DSS JS tab.
 * Set dataset/agent IDs only in the Python backend. Configure data before enabling it. */
window.STANDARD_APP_CONFIG = {
  configured: false, title: 'Operating performance', displayCap: 50, evidenceCap: 12,
  categoryColumn: 'category', valueColumn: 'value', evidenceColumns: ['category', 'value'],
  panels: { filterWidth: 248, agentWidth: 320, centerMin: 360, breakpoint: 1000, agentInitiallyOpen: true },
  agent: { enabled: false, name: 'Evidence assistant', starterMode: 'draft', enterToSend: true, starters: [
    { label: 'Summarize this scope', prompt: 'Summarize the current filtered scope using its full-population KPIs and bounded evidence. Identify missing data and limitations.' },
    { label: 'Investigate this selection', prompt: 'Investigate the selected item in the current filter scope. If nothing is selected, ask which item to inspect. Separate evidence from hypotheses.' },
    { label: 'Suggest the next check', prompt: 'Suggest one practical next check grounded in this dashboard scope, with the evidence supporting it. Do not perform changes.' }
  ] }
};
