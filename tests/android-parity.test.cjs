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

test('Android counter and information pages use separate, allowlisted WebViews', () => {
  const activity = fs.readFileSync(path.join(root, 'app/src/main/java/net/hernow/bjcountertool/MainActivity.kt'), 'utf8');
  const infoActivity = fs.readFileSync(path.join(root, 'app/src/main/java/net/hernow/bjcountertool/InfoActivity.kt'), 'utf8');
  const manifest = fs.readFileSync(path.join(root, 'app/src/main/AndroidManifest.xml'), 'utf8');
  assert.match(activity, /"\/android_asset\/about\.html"/);
  assert.match(activity, /"\/android_asset\/privacy_policy\.html"/);
  assert.match(activity, /Intent\(this@MainActivity, InfoActivity::class\.java\)/);
  assert.match(activity, /backPressPending/);
  assert.match(infoActivity, /ABOUT_PATH, PRIVACY_PATH -> return false/);
  assert.match(infoActivity, /COUNTER_PATH ->\s*\{\s*finish\(\)/);
  assert.match(infoActivity, /javaScriptEnabled = false/);
  assert.match(infoActivity, /webView\.loadUrl\("file:\/\/\$page"\)/);
  assert.match(infoActivity, /"https"\s*->/);
  assert.match(infoActivity, /"mailto"\s*->/);
  assert.match(infoActivity, /ActivityNotFoundException/);
  assert.match(infoActivity, /allowFileAccess = true/);
  assert.match(activity, /"https"\s*->/);
  assert.match(activity, /"mailto"\s*->/);
  assert.match(infoActivity, /webView\.canGoBack\(\)/);
  assert.match(manifest, /android:name="\.InfoActivity"\s+android:exported="false"/);
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
});

test('Android Gradle version metadata remains unchanged for Play release management', () => {
  const gradle = fs.readFileSync(path.join(root, 'app/build.gradle.kts'), 'utf8');
  assert.match(gradle, /versionCode = 3/);
  assert.match(gradle, /versionName = "1\.1"/);
});

test('README documents both platforms, verified distribution, and planned language statuses', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /1–8 decks/);
  assert.match(readme, /app\/src\/main\/assets\/index\.html/);
  assert.match(readme, /counting JavaScript is shared with the web implementation/);
  assert.match(readme, /https:\/\/play\.google\.com\/store\/apps\/details\?id=net\.hernow\.bjcountertool/);
  for (const language of ['French', 'German', 'Spanish']) {
    assert.match(readme, new RegExp(`${language} — \\*\\*Planned — Not started\\*\\*`));
  }
  assert.equal((readme.match(/© 2026 Amanda Hernow — All rights reserved\./g) || []).length, 1);
});
