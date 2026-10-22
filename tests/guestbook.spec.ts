import { test, expect, type Page, type Route } from '@playwright/test';

const FORM_URL = 'https://formspree.io/f/testform123';
const EMPTY_URL = 'http://127.0.0.1:4323/guestbook/';
const SUCCESS = 'Received for review. Approved notes appear after a site update.';
const ERROR = 'We couldn’t confirm receipt.';

function form(page: Page) {
  return page.locator('form[data-guestbook-form]');
}

async function blockThirdPartyRequests(page: Page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
}

async function configureFormspree(
  page: Page,
  responder: (route: Route) => Promise<void>,
) {
  await page.route('https://formspree.io/**', responder);
}

test.beforeEach(async ({ page }) => {
  await blockThirdPartyRequests(page);
  // Every submission test installs an explicit responder. This guard makes an
  // accidental live Formspree submission fail locally instead of leaving the repo.
  await page.route('https://formspree.io/**', async (route) => {
    await route.abort('blockedbyclient');
  });
});

test('renders the configured archive, escaped text, and the public form contract', async ({ page }) => {
  const response = await page.goto('/guestbook/');
  expect(response?.status()).toBe(200);

  await expect(page.getByRole('heading', { name: 'Guestbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The public archive' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Leave a note' })).toBeVisible();
  await expect(page.getByLabel(/Name/)).toHaveAttribute('maxlength', '80');
  await expect(page.getByLabel(/Name/)).toHaveAttribute('required', '');
  await expect(page.getByLabel(/Model \/ agent/)).toHaveAttribute('maxlength', '80');
  await expect(page.getByLabel(/^Note/)).toHaveAttribute('maxlength', '2000');
  await expect(page.getByLabel(/^Note/)).toHaveAttribute('required', '');
  await expect(page.getByLabel(/What brought you here\?/)).toHaveAttribute('maxlength', '200');
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeVisible();
  await expect(form(page)).toHaveAttribute('action', FORM_URL);
  await expect(form(page)).toHaveAttribute('method', 'POST');

  const writeAction = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(writeAction ?? '')).toMatchObject({
    '@type': 'WriteAction',
    target: {
      urlTemplate: FORM_URL,
      httpMethod: 'POST',
      encodingType: 'application/x-www-form-urlencoded',
    },
  });

  const entries = page.locator('section.archive li[id]');
  await expect(entries).toHaveCount(4);
  await expect(entries.nth(0)).toHaveAttribute('id', 'newest-visitor');
  await expect(entries.nth(1)).toHaveAttribute('id', 'long-visitor');
  await expect(entries.nth(2)).toHaveAttribute('id', 'unsafe-text');
  await expect(entries.nth(3)).toHaveAttribute('id', 'earlier-visitor');

  const unsafe = page.locator('#unsafe-text');
  await expect(unsafe).toContainText('<script>alert("note")</script> & <img src=x onerror=alert(1)>');
  await expect(unsafe.locator('script, img')).toHaveCount(0);
  await expect(unsafe).toContainText('Model <b>shape</b>');
  await expect(unsafe).toContainText('Referrer <em>shape</em>');
  await expect(page.locator('section.archive [data-pagefind-ignore]')).toHaveCount(1);
  await expect(page.locator('section.archive [data-pagefind-ignore]')).toContainText('Newest Visitor');
});

test('keeps feed and HTML in the same sorted order with stable URLs', async ({ page, request }) => {
  await page.goto('/guestbook/');
  const feedResponse = await request.get(`${page.url().replace(/\/guestbook\/$/, '')}/guestbook.json`);
  expect(feedResponse.ok()).toBeTruthy();
  expect(feedResponse.headers()['content-type']).toMatch(/application\/(?:feed\+json|json)/);

  const feed = await feedResponse.json();
  expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
  expect(feed.home_page_url).toBe('https://u64.cam/guestbook/');
  expect(feed.feed_url).toBe('https://u64.cam/guestbook.json');
  expect(feed.items.map((item: { id: string }) => item.id)).toEqual([
    'https://u64.cam/guestbook/#newest-visitor',
    'https://u64.cam/guestbook/#long-visitor',
    'https://u64.cam/guestbook/#unsafe-text',
    'https://u64.cam/guestbook/#earlier-visitor',
  ]);
  expect(feed.items[0]).toMatchObject({
    content_text: 'A current note with a newline.\nIt stays plain text.',
    date_published: '2026-10-24T12:00:00Z',
    authors: [{ name: 'Newest Visitor' }],
    _model: 'Luna',
    _referrer: 'the test suite',
  });
  expect(feed.items[2].content_text).toContain('<script>alert("note")</script>');

  const htmlIds = await page.locator('section.archive li[id]').evaluateAll((items) => items.map((item) => item.id));
  expect(htmlIds).toEqual(feed.items.map((item: { id: string }) => item.id.split('#')[1]));
  for (const item of feed.items) {
    await expect(page.locator(`#${item.id.split('#')[1]} a`).first()).toHaveAttribute('href', `/guestbook/#${item.id.split('#')[1]}`);
  }
});

test('Pagefind does not expose contributor note text', async ({ page }) => {
  await page.goto('/guestbook/');
  const pagefindResults = await page.evaluate(async () => {
    const moduleUrl = '/pagefind/pagefind.js';
    const pagefind = await import(moduleUrl) as {
      search: (term: string) => Promise<{
        results: Array<{ data: () => Promise<{ url: string; raw_content: string }> }>;
      }>;
    };
    const search = await pagefind.search('A current note with a newline');
    return Promise.all(search.results.map((result) => result.data()));
  });
  expect(pagefindResults.some((result) => result.url === '/guestbook/' || result.raw_content.includes('A current note with a newline'))).toBe(false);
});

test('homepage shows no more than three latest approved visitors', async ({ page }) => {
  await page.goto('/');
  const visitorLinks = page.locator('p.recent-visitors a[href^="/guestbook/#"]');
  await expect(visitorLinks).toHaveCount(3);
  await expect(visitorLinks).toHaveText(['Newest Visitor', 'A Very Long Visitor Name That Is Deliberately Longer Than Typical Display Width', 'Unsafe <script>alert("name")</script>']);
  await expect(page.locator('p.recent-visitors [data-pagefind-ignore]')).toHaveCount(1);
});

test('success uses the documented encoding, shows receipt, resets the form, and does not publish', async ({ page }) => {
  let requests = 0;
  let submission = { method: '', body: '', accept: '', contentType: '' };
  await configureFormspree(page, async (route) => {
    requests += 1;
    const request = route.request();
    submission = {
      method: request.method(),
      body: request.postData() ?? '',
      accept: request.headers().accept ?? '',
      contentType: request.headers()['content-type'] ?? '',
    };
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto('/guestbook/');
  await page.getByLabel(/Name/).fill('Draft Visitor');
  await page.getByLabel(/^Note/).fill('This remains a private inbox submission.');
  await page.getByLabel(/Model \/ agent/).fill('Test Model');
  await page.getByLabel(/What brought you here\?/).fill('A test');
  await page.getByRole('button', { name: 'Send for review' }).click();

  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(page.locator('[data-guestbook-status]')).toContainText('Sending your note…');
  await expect(page.locator('[data-guestbook-status]')).toHaveText(SUCCESS);
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeEnabled();
  await expect(page.getByLabel(/Name/)).toHaveValue('');
  await expect(page.getByLabel(/^Note/)).toHaveValue('');
  await expect(page.getByLabel(/Model \/ agent/)).toHaveValue('');
  await expect(page.getByLabel(/What brought you here\?/)).toHaveValue('');
  expect(requests).toBe(1);
  expect(submission.method).toBe('POST');
  expect(submission.accept).toBe('application/json');
  expect(submission.contentType).toContain('application/x-www-form-urlencoded');
  const fields = new URLSearchParams(submission.body);
  expect(fields.get('name')).toBe('Draft Visitor');
  expect(fields.get('note')).toBe('This remains a private inbox submission.');
  expect(fields.get('model')).toBe('Test Model');
  expect(fields.get('referrer')).toBe('A test');
  await expect(page.locator('section.archive li[id]')).toHaveCount(4);
});

for (const { label, ...failure } of [
  { label: 'HTTP errors', status: 503, contentType: 'application/json', body: '{"ok":false}' },
  { label: 'HTML receipts', status: 200, contentType: 'text/html', body: '<html>received</html>' },
  { label: 'negative JSON receipts', status: 200, contentType: 'application/json', body: '{"ok":false}' },
]) {
  test(`${label} preserve the draft and permit retry`, async ({ page }) => {
    let requests = 0;
    await configureFormspree(page, async (route) => {
      requests += 1;
      await route.fulfill(requests === 1 ? failure : {
        status: 200, contentType: 'application/json', body: '{"ok":true}',
      });
    });
    await page.goto('/guestbook/');
    await page.getByLabel(/Name/).fill('Retry Visitor');
    await page.getByLabel(/^Note/).fill('Please retain this draft.');
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(page.locator('[data-guestbook-status]')).toContainText(ERROR);
    await expect(page.getByLabel(/Name/)).toHaveValue('Retry Visitor');
    await expect(page.getByLabel(/^Note/)).toHaveValue('Please retain this draft.');
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(page.locator('[data-guestbook-status]')).toHaveText(SUCCESS);
    await expect(page.getByLabel(/Name/)).toHaveValue('');
    await expect(page.getByLabel(/^Note/)).toHaveValue('');
    expect(requests).toBe(2);
  });
}

test('native no-JavaScript submission posts form data without a live request', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await blockThirdPartyRequests(page);
  let postData = '';
  await page.route('https://formspree.io/**', async (route) => {
    postData = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>received for review</p>' });
  });
  await page.goto('http://127.0.0.1:4322/guestbook/');
  await page.getByLabel(/Name/).fill('No JS Visitor');
  await page.getByLabel(/^Note/).fill('Native browser form post.');
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect.poll(() => postData).toContain('name=No+JS+Visitor');
  expect(postData).toContain('note=Native+browser+form+post.');
  await context.close();
});

test('removing the final entry leaves an empty archive and unconfigured intake stays closed', async ({ page }) => {
  const response = await page.goto(EMPTY_URL);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Guestbook' })).toBeVisible();
  await expect(page.locator('form[data-guestbook-form]')).toHaveCount(0);
  await expect(page.getByText('Submissions are temporarily unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByText('No published notes yet.', { exact: false })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  const feed = await page.request.get(`${EMPTY_URL}../guestbook.json`);
  expect((await feed.json()).items).toEqual([]);
  await page.goto('http://127.0.0.1:4323/');
  await expect(page.locator('p.recent-visitors a[href^="/guestbook/#"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Deleted Visitor');
});

test('keyboard labels and narrow dark/light layouts remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/guestbook/');
    await expect(page.getByLabel(/Name/)).toBeVisible();
    await page.getByLabel(/Name/).focus();
    await expect(page.getByLabel(/Name/)).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
});
