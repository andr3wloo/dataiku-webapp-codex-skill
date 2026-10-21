/* Optional helper. Include before app initialization in the raw DSS JS tab.
   Hash navigation stays in the WebApp document even when DSS sets <base href>.
   No page catalog or UI is imposed on apps that do not need navigation. */
(function (root) {
  'use strict';
  function parseFragment(fragment, pages, fallback) {
    const text = String(fragment || '').replace(/^#/, '');
    const parts = text.split('/');
    const page = Object.hasOwn(pages, parts[0]) ? parts[0] : fallback;
    const sections = Array.isArray(pages[page]) ? pages[page] : [];
    const section = parts[0] === page && parts.length === 2 && sections.includes(parts[1]) ? parts[1] : null;
    return { page, section };
  }
  function bind(options) {
    const doc = options.document || root.document;
    const win = doc.defaultView;
    const pages = options.pages;
    const fallback = options.defaultPage || Object.keys(pages)[0];
    if (!fallback || !Object.hasOwn(pages, fallback) || typeof options.onRoute !== 'function') {
      throw new Error('Provide a page catalog, default page, and onRoute callback.');
    }
    function route(reason) {
      return options.onRoute({ ...parseFragment(win.location.hash, pages, fallback), reason });
    }
    function click(event) {
      if (event.defaultPrevented || (event.button !== undefined && event.button !== 0)) return;
      const link = event.target.closest?.('a[href]');
      if (!link || !doc.contains(link)) return;
      const fragment = link.getAttribute('href');
      if (!fragment || !fragment.startsWith('#')) return;
      // Read the literal attribute, never link.href resolved against the host's base.
      // Preserve native in-page anchors such as a skip link that are outside this catalog.
      const requestedPage = fragment.slice(1).split('/')[0];
      if (!Object.hasOwn(pages, requestedPage)) {
        const local = doc.getElementById(fragment.slice(1));
        if (!local) return;
        event.preventDefault(); event.stopPropagation();
        local.focus({ preventScroll: true });
        local.scrollIntoView({ block: 'start', behavior: 'auto' });
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (win.location.hash === fragment) route('repeat');
      else win.location.hash = fragment;
    }
    const changed = () => route('history');
    doc.addEventListener('click', click, true);
    win.addEventListener('hashchange', changed);
    if (options.initial !== false) route('initial');
    return { refresh: () => route('refresh'), destroy() {
      doc.removeEventListener('click', click, true);
      win.removeEventListener('hashchange', changed);
    } };
  }
  const api = { parseFragment, bind };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StandardWebAppNavigation = api;
})(typeof window === 'undefined' ? globalThis : window);
