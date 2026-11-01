(() => {
  let theme;
  try {
    theme = localStorage.getItem('theme');
  } catch {}

  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  document.documentElement.classList.add('theme-ready');

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    const icon = document.getElementById('theme-icon');
    const updateIcon = () => {
      if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? '☀' : '☾';
    };

    updateIcon();
    button?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch {}
      updateIcon();
    });
  });
})();
