// Browser acceptance for the actual feedback component on an insecure HTTP origin.
// All HTTP responses are intercepted; no account, email or live feedback is created.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const esbuild = createRequire(require.resolve('tsx/package.json'))('esbuild');

test('HTTP feedback renders, retries with one key, and rotates the key after success', async () => {
  const root = path.resolve(__dirname, '..');
  const build = await esbuild.build({
    stdin: { contents: `import {createRoot} from 'react-dom/client';import {OrganizationProgramExperience} from './app/(chat)/mind/organization/organization-program-experience';createRoot(document.getElementById('root')).render(<OrganizationProgramExperience organizationName="QA" cards={[]} history={[]} schedule={[]} personalResults={[]} sessionCredits={{available:0,reserved:0,used:0}} chatGrantEndsAt={null} bookingHref="/book" appreciations={[]}/>);`, resolveDir: root, loader: 'tsx' },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic', tsconfig: path.join(root, 'tsconfig.json'),
    plugins: [{ name: 'router-boundary', setup(build) {
      const mocks = { 'next/navigation': 'export function useRouter(){return{refresh(){}};}', 'next/link': 'export default function Link(){return null;}' };
      build.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: 'mock', pluginData: mocks[args.path] } : undefined);
      build.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: args.pluginData }));
    } }],
  });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], submissions = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://feedback.qa.invalid/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/fixture.js') return route.fulfill({ contentType: 'application/javascript', body: build.outputFiles[0].text });
      if (url.pathname === '/api/mind/organization/feedback') {
        submissions.push(route.request().postDataJSON());
        return route.fulfill({ status: submissions.length === 1 ? 503 : 200, json: {} });
      }
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><div id="root"></div><script src="/fixture.js"></script>' });
    });
    await page.goto('http://feedback.qa.invalid/');
    assert.deepEqual(await page.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID })), { secure: false, uuid: 'undefined' });
    await page.getByRole('button', { name: 'Санал хүсэлт', exact: true }).click();
    await page.getByLabel('Хүлээн авагч').selectOption('ORGANIZATION');
    await page.getByLabel('Санал хүсэлт', { exact: true }).fill('QA HTTP feedback');
    await page.getByRole('button', { name: 'Илгээх', exact: true }).click();
    await page.getByText('Илгээж чадсангүй. Дахин оролдоно уу.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Илгээх', exact: true }).click();
    await page.getByText('Нэргүй санал илгээгдлээ ✓', { exact: true }).waitFor();
    assert.equal(submissions[0].idempotencyKey, submissions[1].idempotencyKey);
    await page.getByLabel('Санал хүсэлт', { exact: true }).fill('QA next feedback');
    await page.getByRole('button', { name: 'Илгээх', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('textarea').value === '');
    assert.notEqual(submissions[1].idempotencyKey, submissions[2].idempotencyKey);
    for (const submission of submissions) assert.match(submission.idempotencyKey, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
