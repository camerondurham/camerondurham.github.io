document.addEventListener('DOMContentLoaded', async () => {
    try {
      const pagefind = await import('/pagefind/pagefind.js');
      await pagefind.init();
      
      const input = document.getElementById('search-input');
      const results = document.getElementById('search-results');
      const container = document.getElementById('search');
      if (!input || !results || !container) {
        return;
      }
      const scopePrefix = (container?.dataset.scopePrefix || '').trim();
      const normalizedScope = scopePrefix
        ? (scopePrefix.endsWith('/') ? scopePrefix : scopePrefix + '/')
        : '';
      const resultLimit = Number(container?.dataset.resultLimit || 5);

      input.addEventListener('input', async (e) => {
        const query = e.target && 'value' in e.target ? e.target.value.trim() : '';
        if (!query) {
          results.replaceChildren();
          return;
        }

        const search = await pagefind.search(query);
        const data = await Promise.all(search.results.map(result => result.data()));
        const scopedData = normalizedScope
          ? data.filter((item) => item.url?.startsWith(normalizedScope))
          : data;
        const resultNodes = scopedData.slice(0, resultLimit).flatMap((item) => {
          if (!item.url) return [];

          const url = new URL(item.url, window.location.origin);
          if (url.origin !== window.location.origin) return [];

          const link = document.createElement('a');
          link.href = `${url.pathname}${url.search}${url.hash}`;
          link.className = 'search-result';

          const title = document.createElement('strong');
          title.textContent = item.meta?.title || item.url;
          const excerpt = document.createElement('p');
          excerpt.textContent = item.plain_excerpt || '';
          link.append(title, excerpt);
          return [link];
        });

        results.replaceChildren(...resultNodes);
      });
    } catch (e) {
      console.log('Pagefind not available in dev mode');
    }
  });
