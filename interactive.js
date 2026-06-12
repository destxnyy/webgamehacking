document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.prototype-builder').forEach(initBuilder);
  document.querySelectorAll('.copy-code').forEach(button => {
    button.addEventListener('click', copySnippet);
  });
  initSiteSearch();
});

function initSiteSearch() {
  const input = document.getElementById('site-search-input');
  const results = document.getElementById('site-search-results');
  if (!input || !results) return;

  let searchIndex = null;
  let searchTimer = null;

  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function buildIndex() {
    if (searchIndex) return searchIndex;

    const pages = [
      'index.html',
      'introduction.html',
      'injection.html',
      'stream-proof.html',
      'specific-hack-types.html',
      'case-studies.html',
      'anti-detection.html',
      'resources.html'
    ];

    searchIndex = await Promise.all(pages.map(async (page) => {
      const response = await fetch(page, { cache: 'force-cache' });
      if (!response.ok) return null;
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.textContent?.trim() || page;
      const heading = doc.querySelector('header h1')?.textContent?.trim() || title;
      const bodyText = doc.body?.innerText?.replace(/\s+/g, ' ').trim() || '';
      return { page, title, heading, text: bodyText };
    }));

    searchIndex = searchIndex.filter(Boolean);
    return searchIndex;
  }

  function scoreMatch(entry, query) {
    const haystack = `${entry.title} ${entry.heading} ${entry.text}`.toLowerCase();
    const normalized = query.toLowerCase();
    let score = 0;

    if (haystack.includes(normalized)) score += 25;
    const words = normalized.split(/\s+/).filter(Boolean);
    words.forEach((word) => {
      if (entry.title.toLowerCase().includes(word)) score += 8;
      if (entry.heading.toLowerCase().includes(word)) score += 6;
      if (entry.text.toLowerCase().includes(word)) score += 2;
    });

    return score;
  }

  function renderResults(matches) {
    if (!matches.length) {
      results.hidden = false;
      results.innerHTML = '<div class="search-empty">No matches found. Try a different keyword.</div>';
      return;
    }

    results.hidden = false;
    results.innerHTML = matches
      .map((entry) => `
        <a class="search-result" href="${entry.page}">
          <strong>${escapeHtml(entry.title)}</strong>
          <small>${escapeHtml(entry.heading)} · ${escapeHtml(entry.page)}</small>
        </a>
      `)
      .join('');
  }

  async function runSearch() {
    const query = input.value.trim();
    if (!query) {
      results.hidden = true;
      results.innerHTML = '';
      return;
    }

    const entries = await buildIndex();
    const matches = entries
      .map((entry) => ({ entry, score: scoreMatch(entry, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.entry);

    renderResults(matches);
  }

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-search')) {
      results.hidden = true;
    }
  });
}

function initBuilder(builder) {
  const select = builder.querySelector('.builder-select');
  if (!select) return;
  select.addEventListener('change', () => renderPrototype(builder));
  renderPrototype(builder);
}

function renderPrototype(builder) {
  const select = builder.querySelector('.builder-select');
  const code = builder.querySelector('.js-preview');
  if (!select || !code) return;
  const choice = select.value;
  const template = builder.querySelector(`template[data-choice="${choice}"]`);
  if (!template) return;
  code.textContent = template.content.textContent.trim();
}

async function copySnippet(event) {
  const button = event.currentTarget;
  const builder = button.closest('.prototype-builder');
  const code = builder?.querySelector('.js-preview');
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = 'Copied ✓';
    setTimeout(() => {
      button.textContent = 'Copy snippet';
    }, 1200);
  } catch (error) {
    button.textContent = 'Copy failed';
    setTimeout(() => {
      button.textContent = 'Copy snippet';
    }, 1200);
  }
}
