const form = document.querySelector('[data-guestbook-form]');
  const button = form?.querySelector('button[type="submit"]');
  const statusElement = form?.querySelector('[data-guestbook-status]');

  if (form && button && statusElement) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = 'Sending…';
      statusElement.textContent = 'Sending your note…';
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      try {
        const body = new URLSearchParams();
        for (const [name, value] of new FormData(form)) {
          if (typeof value === 'string') body.append(name, value);
        }
        const response = await fetch(form.action, {
          method: 'POST',
          body,
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Submission was not accepted');
        const result = await response.json();
        if (result.ok !== true) throw new Error('Receipt was not confirmed');
        form.reset();
        statusElement.textContent = 'Received for review. Approved notes appear after a site update.';
      } catch {
        statusElement.textContent = 'We couldn’t confirm receipt. Your draft is still here. Check before retrying to avoid duplicates.';
      } finally {
        window.clearTimeout(timeout);
        button.disabled = false;
        button.textContent = 'Send note';
      }
    });
  }
