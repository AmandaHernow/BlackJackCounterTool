const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const web = fs.readFileSync(path.join(root, 'BJCounterTool.html'), 'utf8');
const androidRoot = path.join(root, 'app', 'src', 'main', 'assets');
const android = fs.readFileSync(path.join(androidRoot, 'index.html'), 'utf8');

function executableScript(page) {
  const match = page.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'page has an executable inline script');
  return match[1].trim();
}

test('Android counter JavaScript stays in exact parity with web v3.0', () => {
  assert.equal(executableScript(android), executableScript(web));
});

test('Android bundle has the v3.0 shoe options, half-deck display, and preserved Licence help', () => {
  const deckOptions = [...android.matchAll(/<option value="(\d+)">\1<\/option>/g)].map((match) => Number(match[1]));
  assert.deepEqual(deckOptions, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(android, /id="decksRemainingDisplay" class="stat-value">= 1<\/div>/);
  assert.match(android, /var halfDeckUnits = Math\.ceil\(cardsRem \/ 26\)/);
  assert.match(android, /var deckBoundarySign = cardsRem % 26 === 0 \? '=' : '<'/);
  assert.match(android, /var trueCount = count \/ safeDecksRemaining/);
  assert.match(android, /id="licenceTab"[^>]*data-help-tab="licencePanel"/);
  assert.match(android, /id="licencePanel" class="help-panel"/);
  assert.match(android, /Android Version 3\.0/);
});

test('Android About and Privacy pages and their images are bundled for offline navigation', () => {
  for (const name of ['index.html', 'about.html', 'privacy_policy.html']) {
    const file = path.join(androidRoot, name);
    assert.ok(fs.existsSync(file), `${name} is bundled`);
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /img-src 'self' data:/, `${name} CSP permits bundled images`);
    assert.doesNotMatch(source, /<script\b[^>]*\bsrc=['"]https?:/i, `${name} has no external script`);
    for (const [, src] of source.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      assert.ok(!/^https?:/i.test(src), `${name} has no hotlinked image`);
      if (src.startsWith('assets/')) assert.ok(fs.existsSync(path.join(androidRoot, src)), `image resolves: ${src}`);
    }
    for (const [, href] of source.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|data:|#)/i.test(href)) continue;
      const localPath = href.split('#')[0].split('?')[0];
      if (localPath) assert.ok(fs.existsSync(path.join(androidRoot, localPath)), `${name} link resolves: ${href}`);
    }
  }
  for (const asset of ['amanda.jpg', 'encryption-utility-icon.png', 'hernownet-icon.png', 'paypal-qr.png']) {
    assert.ok(fs.existsSync(path.join(androidRoot, 'assets', asset)), `local asset exists: ${asset}`);
  }
  assert.match(fs.readFileSync(path.join(androidRoot, 'privacy_policy.html'), 'utf8'), /Android app information/);
  assert.match(fs.readFileSync(path.join(androidRoot, 'privacy_policy.html'), 'utf8'), /bjcountertoolandroidsupport@hernow\.net/);
});

test('Android local routes are allowlisted and external links remain HTTPS or email', () => {
  const activity = fs.readFileSync(path.join(root, 'app/src/main/java/net/hernow/bjcountertool/MainActivity.kt'), 'utf8');
  const manifest = fs.readFileSync(path.join(root, 'app/src/main/AndroidManifest.xml'), 'utf8');
  assert.match(activity, /"\/android_asset\/index\.html"/);
  assert.match(activity, /"\/android_asset\/about\.html"/);
  assert.match(activity, /"\/android_asset\/privacy_policy\.html"/);
  assert.match(activity, /"https"\s*->/);
  assert.match(activity, /"mailto"\s*->/);
  assert.match(activity, /webView\.canGoBack\(\)/);
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
});
