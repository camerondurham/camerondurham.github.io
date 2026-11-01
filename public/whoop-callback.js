(() => {
  const target = new URL('http://127.0.0.1:4318/oauth/callback');
  target.search = window.location.search;

  const manualLink = document.getElementById('manual-link');
  const status = document.getElementById('status');

  if (manualLink) {
    manualLink.href = target.toString();
  }

  if (!status) return;
  if (window.location.search) {
    status.textContent = 'Forwarding complete. If the local app does not open, use the manual link below.';
    window.location.replace(target.toString());
  } else {
    status.textContent = 'No WHOOP authorization parameters were provided to this page.';
  }
})();
