document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.prototype-builder').forEach(initBuilder);
  document.querySelectorAll('.copy-code').forEach(button => {
    button.addEventListener('click', copySnippet);
  });
});

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
