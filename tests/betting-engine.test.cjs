const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'BJCounterTool.html'), 'utf8');

class FakeClassList {
  constructor(initial = '') { this.values = new Set(initial.split(/\s+/).filter(Boolean)); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
  toggle(value) { this.values.has(value) ? this.values.delete(value) : this.values.add(value); return this.values.has(value); }
}

class FakeElement {
  constructor(id = '', className = '', dataset = {}) {
    this.id = id;
    this.classList = new FakeClassList(className);
    this.dataset = dataset;
    this.style = {};
    this.value = '';
    this._textContent = '';
    this.disabled = false;
    this.handlers = {};
    this.children = [];
    this.attributes = {};
    this._innerHTML = '';
  }
  set textContent(value) { this._textContent = String(value); }
  get textContent() { return this._textContent; }
  addEventListener(type, callback) { (this.handlers[type] ||= []).push(callback); }
  dispatch(type, event = {}) { for (const callback of this.handlers[type] || []) callback({ target: this, ...event }); }
  click() { if (!this.disabled) this.dispatch('click'); }
  focus() { this.focused = true; }
  appendChild(child) { this.children.push(child); return child; }
  querySelectorAll(selector) { return selector === 'button' ? this.children.filter((child) => child.tagName === 'button') : []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] || null; }
  set innerHTML(value) { this._innerHTML = value; this.children = []; }
  get innerHTML() { return this._innerHTML; }
}

function createApp() {
  const elements = new Map();
  const documentHandlers = {};
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  };
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) get(id);
  const root = new FakeElement('documentElement');
  const systemTabs = [...html.matchAll(/<button class="[^"]*system-tab[^\"]*" data-system="([^"]+)"/g)]
    .map((match) => new FakeElement('', 'system-tab', { system: match[1] }));
  const helpTabs = [...html.matchAll(/<button\b[^>]*class="[^"]*\bhelp-tab\b[^"]*"[^>]*data-help-tab="([^"]+)"[^>]*>/g)]
    .map((match) => new FakeElement('', 'help-tab', { helpTab: match[1] }));
  const helpPanels = [...html.matchAll(/<div id="([^"]+)" class="help-panel[^\"]*"/g)]
    .map((match) => get(match[1]));
  get('deckCount').value = '1';
  get('systemSelect').value = 'hilo';

  const document = {
    documentElement: root,
    getElementById: get,
    querySelectorAll(selector) {
      if (selector === '.system-tab') return systemTabs;
      if (selector === '.help-tab') return helpTabs;
      if (selector === '.help-panel') return helpPanels;
      return [];
    },
    createElement(tagName) { const el = new FakeElement(); el.tagName = tagName; return el; },
    addEventListener(type, callback) { (documentHandlers[type] ||= []).push(callback); }
  };
  const sandbox = {
    document,
    window: { close() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    requestAnimationFrame(callback) { callback(); },
    confirm() { return true; },
    Date,
    console
  };
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  scripts.forEach((script) => vm.runInNewContext(script, sandbox, { timeout: 2000 }));
  return { get, elements, systemTabs, helpTabs, documentHandlers, sandbox };
}

function selectSystem(app, name) {
  const tab = app.systemTabs.find((item) => item.dataset.system === name);
  assert.ok(tab, `system tab exists: ${name}`);
  tab.click();
}

function setDecks(app, decks) {
  const select = app.get('deckCount');
  select.value = String(decks);
  select.dispatch('change');
}

function clickCount(app, label, count = 1) {
  const buttons = app.get('counterButtons').children;
  const button = buttons.find((item) => item.textContent === label);
  assert.ok(button, `count button exists: ${label}`);
  for (let i = 0; i < count; i++) button.click();
}

function clickSignedCount(app, delta) {
  if (delta === 0) return;
  const buttons = app.get('counterButtons').children.map((button) => button.textContent);
  if (delta > 0) {
    const label = buttons.includes('+1') ? '+1' : '+2';
    clickCount(app, label, delta / Number(label.slice(1)));
    return;
  }
  if (buttons.includes('-1')) {
    clickCount(app, '-1', -delta);
    return;
  }
  const pairs = Math.ceil(-delta / 2);
  clickCount(app, '-2', pairs);
  if (-delta % 2) clickCount(app, '+1');
}

function setRunningCount(app, target) {
  const display = app.get('counterDisplay');
  const current = Number(display.textContent);
  const delta = target - current;
  if (delta > 0) clickCount(app, '+1', delta);
  if (delta < 0) clickCount(app, '-1', -delta);
}

test('balanced systems use exact fractional decks and every documented ramp boundary', () => {
  const app = createApp();
  const cases = [
    [-2.25, 'Sit Out / Minimum'], [-2, 'Sit Out / Minimum'], [-1.75, 'Minimum'], [-0.25, 'Minimum'],
    [0, 'Standard'], [0.25, 'Standard'], [0.75, 'Standard'], [1, 'Slight Increase'], [1.25, 'Slight Increase'], [1.75, 'Slight Increase'],
    [2, 'Raise'], [2.25, 'Raise'], [2.75, 'Raise'], [3, 'High'], [3.25, 'High'], [3.75, 'High'], [4, 'Max'], [4.25, 'Max']
  ];
  for (const system of ['hilo', 'hiopt1', 'hiopt2', 'zen', 'omega2', 'wonghalves']) {
    setDecks(app, 8);
    selectSystem(app, system);
    for (const [tc, expected] of cases) {
      const countAtFourDecks = Math.round(tc * 4);
      const hasMinusOneButton = app.get('counterButtons').children.some((button) => button.textContent === '-1');
      const countClicks = countAtFourDecks < 0 && !hasMinusOneButton
        ? Math.ceil(Math.abs(countAtFourDecks) / 2) + (Math.abs(countAtFourDecks) % 2)
        : Math.abs(countAtFourDecks);
      const fill = 208 - countClicks;
      clickCount(app, '0', fill);
      clickSignedCount(app, countAtFourDecks);
      assert.equal(app.get('trueCountDisplay').textContent, (countAtFourDecks / 4).toFixed(2));
      assert.equal(app.get('bettingSuggestionDisplay').textContent, expected, `${system} TC ${tc}`);
      selectSystem(app, system);
    }
    setDecks(app, 1);
    selectSystem(app, system);
    clickCount(app, '0', 26);
    clickCount(app, '+1');
    assert.equal(app.get('decksRemainingDisplay').textContent, '< 0.5');
    assert.equal(app.get('trueCountDisplay').textContent, '2.00', `${system} uses the documented 0.5-deck minimum divisor`);
  }
});

test('KO IRC, published keys, pivot, and conservative odd-deck fallback work for 1–8 decks', () => {
  const app = createApp();
  const irc = {1:0, 2:-4, 3:-8, 4:-12, 5:-16, 6:-20, 7:-24, 8:-28};
  const key = {1:2, 2:1, 4:-1, 6:-4, 8:-6};
  for (let decks = 1; decks <= 8; decks++) {
    setDecks(app, decks);
    selectSystem(app, 'ko');
    assert.equal(Number(app.get('counterDisplay').textContent), irc[decks]);
    assert.equal(app.get('countMetricLabel').textContent, 'Key Count');
    if (key[decks] != null) {
      assert.equal(app.get('trueCountDisplay').textContent, (key[decks] > 0 ? '+' : '') + key[decks]);
      for (const [runningCount, expected] of [[key[decks] - 1, 'Minimum'], [key[decks], 'Raise'], [key[decks] + 1, 'Raise'], [3, 'Raise'], [4, 'Max'], [5, 'Max']]) {
        setRunningCount(app, runningCount);
        assert.equal(app.get('bettingSuggestionDisplay').textContent, expected, `${decks}d RC ${runningCount}`);
        selectSystem(app, 'ko');
      }
    } else {
      assert.equal(app.get('trueCountDisplay').textContent, 'Not published');
      assert.match(app.get('extraStatOneDisplay').textContent, /Pivot/);
      for (const [runningCount, expected] of [[-7, 'Minimum'], [3, 'Minimum'], [4, 'Max'], [5, 'Max']]) {
        setRunningCount(app, runningCount);
        assert.equal(app.get('bettingSuggestionDisplay').textContent, expected, `${decks}d fallback RC ${runningCount}`);
        selectSystem(app, 'ko');
      }
    }
    setRunningCount(app, 4);
    assert.equal(app.get('bettingSuggestionDisplay').textContent, 'Max');
  }
  setDecks(app, 8);
  selectSystem(app, 'ko');
  for (const rc of [-28, -7, -6, -5, 0, 4, 5]) {
    setRunningCount(app, rc);
    assert.ok(['Minimum', 'Raise', 'Max'].includes(app.get('bettingSuggestionDisplay').textContent));
  }
});

test('Red 7 IRC, pivot and published unit schedules work for 1–8 decks', () => {
  const app = createApp();
  const schedules = {
    1: [[-1, 1], [0, 2], [1, 2], [2, 4], [3, 4], [4, 4]],
    2: [[-1, 1], [0, 2], [3, 2], [4, 3], [5, 3], [6, 4], [7, 4], [8, 6], [9, 6], [16, 6]],
    3: [[-1, 1], [0, 2], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [11, 4], [12, 6], [13, 6], [15, 6], [16, 8], [17, 8]],
    4: [[-1, 1], [0, 2], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [11, 4], [12, 6], [13, 6], [15, 6], [16, 8], [17, 8]],
    5: [[-1, 1], [0, 2], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [11, 4], [12, 6], [13, 6], [15, 6], [16, 8], [17, 8]],
    6: [[-1, 1], [0, 2], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [11, 4], [12, 6], [13, 6], [15, 6], [16, 8], [17, 8]],
    7: [[-1, 1], [0, 2], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [11, 4], [12, 6], [13, 6], [15, 6], [16, 8], [17, 8]],
    8: [[-1, 1], [0, 2], [5, 2], [6, 3], [7, 3], [8, 4], [9, 4], [11, 4], [12, 6], [13, 6], [15, 6], [16, 8], [17, 8]]
  };
  for (let decks = 1; decks <= 8; decks++) {
    setDecks(app, decks);
    selectSystem(app, 'red7');
    assert.equal(Number(app.get('counterDisplay').textContent), -2 * decks);
    assert.equal(app.get('extraStatOneDisplay').textContent, 'RC 0');
    assert.equal(app.get('extraStatTwoDisplay').textContent, 'RC 0');
    for (const [runningCount, units] of schedules[decks]) {
      setRunningCount(app, runningCount);
      const maxUnits = decks === 1 ? 4 : decks === 2 ? 6 : 8;
      const expectedCategory = units === 1 ? 'Minimum' : units === maxUnits ? 'Max' : units === 2 ? 'Slight Increase' : units === 3 ? 'Raise' : 'High';
      assert.match(app.get('bettingNoteDisplay').textContent, new RegExp(`guide: ${units} units?;`), `${decks}d RC ${runningCount}`);
      assert.equal(app.get('bettingSuggestionDisplay').textContent, expectedCategory, `${decks}d RC ${runningCount}`);
    }
  }
});

test('counting state, ace information, undo, resets, and system/deck changes remain coherent', () => {
  const app = createApp();
  setDecks(app, 8);
  selectSystem(app, 'hiopt1');
  assert.equal(app.get('trueCountDisplay').textContent, '0.00');
  assert.equal(app.get('acesRemainingDisplay').textContent, '32');
  clickCount(app, 'Ace');
  assert.equal(app.get('cardsPlayedDisplay').textContent, '1');
  assert.equal(app.get('cardsRemainingDisplay').textContent, '415');
  assert.equal(app.get('acesPlayedDisplay').textContent, '1');
  assert.equal(app.get('actionLogBody').children.length, 1);
  assert.match(app.get('bettingNoteDisplay').textContent, /ace density .*info only/);
  assert.equal(app.get('bettingSuggestionDisplay').textContent, 'Standard');
  app.get('btnUndo').click();
  assert.equal(app.get('cardsPlayedDisplay').textContent, '0');
  assert.equal(app.get('acesPlayedDisplay').textContent, '0');
  assert.equal(app.get('actionLogBody').children.length, 0);
  clickCount(app, '+1');
  assert.equal(app.get('decksRemainingDisplay').textContent, '< 8');
  app.get('btnNewShoe').click();
  assert.equal(app.get('counterDisplay').textContent, '0');
  assert.equal(app.get('cardsRemainingDisplay').textContent, '416');
  clickCount(app, '+1');
  app.get('btnClear').click();
  assert.equal(app.get('cardsPlayedDisplay').textContent, '0');
  selectSystem(app, 'ko');
  assert.equal(app.get('counterDisplay').textContent, '-28');
  setDecks(app, 3);
  assert.equal(app.get('counterDisplay').textContent, '-8');
  app.get('btnUndo').click();
  assert.equal(app.get('deckCount').value, '8');
  assert.equal(app.get('counterDisplay').textContent, '-28');
  selectSystem(app, 'red7');
  assert.equal(app.get('counterDisplay').textContent, '-16');
  assert.equal(app.get('actionLogBody').children.length, 0);
});

test('action log toggle opens and closes without changing the counting session', () => {
  const app = createApp();
  clickCount(app, '+1');
  clickCount(app, '+1');
  const before = {
    count: app.get('counterDisplay').textContent,
    cards: app.get('cardsRemainingDisplay').textContent,
    entries: app.get('actionLogBody').children.map((entry) => entry._innerHTML)
  };
  const clickListenerCount = app.get('btnLog').handlers.click.length;
  app.get('btnLog').click();
  assert.equal(app.get('sidePanel').classList.contains('log-open'), true);
  assert.equal(app.get('btnLog').getAttribute('aria-expanded'), 'true');
  assert.equal(app.get('sidePanel').getAttribute('aria-hidden'), 'false');
  app.get('btnLog').click();
  assert.equal(app.get('sidePanel').classList.contains('log-open'), false);
  assert.equal(app.get('btnLog').getAttribute('aria-expanded'), 'false');
  assert.equal(app.get('sidePanel').getAttribute('aria-hidden'), 'true');
  app.get('btnLog').click();
  assert.deepEqual(app.get('actionLogBody').children.map((entry) => entry._innerHTML), before.entries);
  assert.equal(app.get('counterDisplay').textContent, before.count);
  assert.equal(app.get('cardsRemainingDisplay').textContent, before.cards);
  assert.equal(app.get('actionLogBody').children.length, 2);
  assert.equal(app.get('btnLog').handlers.click.length, clickListenerCount, 'opening and reopening do not add event listeners');
  let prevented = false;
  for (const handler of app.documentHandlers.keydown || []) handler({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(app.get('sidePanel').classList.contains('log-open'), false);
  assert.equal(app.get('btnLog').focused, true);
  assert.equal(prevented, false);
});

test('web action log remains visible and uses an in-flow drawer at requested narrow widths', () => {
  const mobileRules = html.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(mobileRules, 'narrow viewport drawer rules exist');
  assert.match(mobileRules, /\.side-panel\s*\{[\s\S]*?position:\s*relative;[\s\S]*?width:\s*100%;[\s\S]*?overflow:\s*hidden/);
  assert.match(mobileRules, /\.side-panel\.log-open\s*\{[^}]*pointer-events:\s*auto/);
  assert.match(html, /\.action-log-body\s*\{[^}]*overflow-y:\s*auto/);
  assert.doesNotMatch(html, /#btnLog\s*\{[^}]*display:\s*none/i);
  for (const id of ['btnLog', 'btnTheme', 'btnHelp', 'btnClose']) {
    assert.match(html, new RegExp(`<button id="${id}"`), `${id} is present in the title bar`);
  }
  assert.match(html, /id="btnLog"[^>]*aria-controls="sidePanel" aria-expanded="false"/);
  assert.match(html, /id="sidePanel"[^>]*aria-label="Action log" aria-hidden="true"/);
  assert.match(html, /id="actionLogBody"[^>]*tabindex="0" aria-label="Recent counting actions"/);
  for (const width of [320, 375, 390, 430, 640, 768]) assert.ok(width <= 900, `${width}px uses the responsive drawer`);
  assert.ok(1024 > 900, 'desktop widths retain the fixed right-side panel');
});

test('card tags, exact fractional True Count, half-deck display, and shoe limits work', () => {
  const app = createApp();
  const sampleTags = {
    hilo: ['+1', 1], ko: ['+1', 1], red7: ['7 Red', 1], hiopt1: ['+1', 1],
    hiopt2: ['+2', 2], zen: ['+2', 2], omega2: ['+2', 2], wonghalves: ['+1.5', 1.5]
  };
  for (const [system, [button, delta]] of Object.entries(sampleTags)) {
    setDecks(app, 8);
    selectSystem(app, system);
    clickCount(app, button);
    const expectedCount = delta + (system === 'ko' ? -28 : system === 'red7' ? -16 : 0);
    assert.equal(Number(app.get('counterDisplay').textContent), expectedCount, `${system} card tag`);
    assert.equal(app.get('cardsPlayedDisplay').textContent, '1');
    if (system === 'red7') {
      clickCount(app, '7 Black');
      assert.equal(Number(app.get('counterDisplay').textContent), expectedCount);
    }
    if (['hiopt1', 'hiopt2', 'omega2'].includes(system)) {
      clickCount(app, 'Ace');
      assert.equal(Number(app.get('counterDisplay').textContent), expectedCount);
      assert.equal(app.get('acesPlayedDisplay').textContent, '1');
    }
  }

  setDecks(app, 8);
  selectSystem(app, 'hilo');
  clickCount(app, '+1', 13);
  assert.equal(app.get('decksRemainingDisplay').textContent, '< 8');
  assert.equal(app.get('trueCountDisplay').textContent, '1.68');

  setDecks(app, 1);
  selectSystem(app, 'hilo');
  assert.equal(app.get('decksRemainingDisplay').textContent, '= 1');
  clickCount(app, '0', 1);
  assert.equal(app.get('decksRemainingDisplay').textContent, '< 1');
  clickCount(app, '0', 25);
  assert.equal(app.get('decksRemainingDisplay').textContent, '= 0.5');
  clickCount(app, '0', 1);
  assert.equal(app.get('decksRemainingDisplay').textContent, '< 0.5');
  clickCount(app, '0', 25);
  assert.equal(app.get('decksRemainingDisplay').textContent, '= 0');
  assert.equal(app.get('counterButtons').children.every((button) => button.disabled), true);
});

test('README and built-in help document all systems, thresholds, limitations, and ace behavior', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  for (const system of ['Hi-Lo', 'KO', 'Red 7', 'Hi-Opt I', 'Hi-Opt II', 'Zen Count', 'Omega II', 'Wong Halves']) {
    assert.ok(readme.includes(system), `README names ${system}`);
  }
  assert.match(readme, /TC ≥ \+4[\s\S]*\+3 ≤ TC < \+4[\s\S]*\+2 ≤ TC < \+3/);
  assert.match(readme, /3–8 decks[\s\S]*\+6 \(3 units\)[\s\S]*\+8 \(4 units\)[\s\S]*\+12 \(6 units\)[\s\S]*\+16 \(8 units\)/);
  assert.match(readme, /\+2 \(1 deck\), \+1 \(2\), −1 \(4\), −4 \(6\), and −6 \(8\)/);
  assert.match(readme, /corrects earlier app values of 0, −2, and −5 for 2, 4, and 6 decks/);
  assert.match(html, /Ace density is shown as additional information and does not automatically change the betting recommendation/);
  assert.ok(html.includes('Standard published key counts were not established here for 3, 5, and 7 decks'));
});

test('Help has seven working accessible tabs and the counter intro is removed', () => {
  const app = createApp();
  const expected = ['usagePanel', 'systemsPanel', 'bettingPanel', 'expertPanel', 'aboutPanel', 'supportPanel', 'disclaimerPanel'];
  assert.deepEqual(app.systemTabs.map((tab) => tab.dataset.system), ['hilo', 'ko', 'red7', 'hiopt1', 'hiopt2', 'zen', 'omega2', 'wonghalves']);
  assert.deepEqual(app.helpTabs.map((tab) => tab.dataset.helpTab), expected);
  for (const tab of app.helpTabs) {
    tab.click();
    assert.equal(app.get(tab.dataset.helpTab).classList.contains('active'), true, `${tab.dataset.helpTab} opens`);
    assert.equal(tab.getAttribute('aria-selected'), 'true');
    assert.equal(app.helpTabs.filter((candidate) => candidate.getAttribute('aria-selected') === 'true').length, 1);
  }
  const usageTab = app.helpTabs[0];
  usageTab.dispatch('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.equal(app.helpTabs[1].focused, true);
  assert.equal(app.get('systemsPanel').classList.contains('active'), true);
  app.helpTabs[1].dispatch('keydown', { key: 'End', preventDefault() {} });
  assert.equal(app.get('disclaimerPanel').classList.contains('active'), true);
  app.get('btnHelp').click();
  assert.equal(app.get('helpModal').style.display, 'flex');
  assert.equal(app.get('helpModal').getAttribute('aria-hidden'), 'false');
  app.documentHandlers.keydown[0]({ key: 'Escape' });
  assert.equal(app.get('helpModal').style.display, 'none');
  assert.equal(app.get('helpModal').getAttribute('aria-hidden'), 'true');
  assert.equal(app.get('btnHelp').focused, true);
  assert.doesNotMatch(html, /class="seo-intro"|class="seo-links"/);
  assert.match(html, /<h1 class="sr-only">Blackjack Card Counting Tool<\/h1>/);
  assert.match(html, /img-src 'self' data:/);
});

test('About, Support, privacy, and sitemap links use the intended local pages and PayPal destination', () => {
  const root = path.join(__dirname, '..');
  const about = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  const privacy = fs.readFileSync(path.join(root, 'privacy_policy.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.match(about, /rel="canonical" href="https:\/\/amandahernow\.github\.io\/BlackJackCounterTool\/about\.html"/);
  assert.match(about, /href="https:\/\/www\.paypal\.me\/AmandaHernow" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="https:\/\/www\.paypal\.me\/AmandaHernow" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /src="assets\/paypal-qr\.png"/);
  assert.match(about, /under active development/i);
  assert.match(privacy, /bjcountertoolandroidsupport@hernow\.net/);
  assert.match(privacy, /GitHub Pages/);
  assert.match(privacy, /Android application is a separate implementation/);
  assert.match(sitemap, /<loc>https:\/\/amandahernow\.github\.io\/BlackJackCounterTool\/about\.html<\/loc>/);
  assert.match(html, /href="about\.html"/);
});

test('developer and related-project artwork is local, accessible, and linked to the right destinations', () => {
  const root = path.join(__dirname, '..');
  const about = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  for (const asset of ['amanda.jpg', 'encryption-utility-icon.png', 'hernownet-icon.png', 'paypal-qr.png']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', asset)), `local asset exists: ${asset}`);
  }
  assert.match(about, /class="hero-photo" src="assets\/amanda\.jpg" alt="Amanda Hernow, independent developer of Blackjack Counter Tool"/);
  assert.match(html, /class="developer-help-photo" src="assets\/amanda\.jpg" alt="Amanda Hernow, developer of Blackjack Counter Tool"/);
  assert.match(about, /class="project-icon-link" href="https:\/\/amandahernow\.github\.io\/EncryptionDecryptionUtilityTool\/"[^>]*><img[^>]*src="assets\/encryption-utility-icon\.png"[^>]*alt="Text Encryption and Decryption Utility Tool icon"/);
  assert.match(about, /class="project-icon-link" href="https:\/\/hernow\.net"[^>]*><img[^>]*src="assets\/hernownet-icon\.png"[^>]*alt="HernowNet application icon"/);
  assert.match(html, /class="help-project-icon-link" href="https:\/\/amandahernow\.github\.io\/EncryptionDecryptionUtilityTool\/[^>]*><img[^>]*src="assets\/encryption-utility-icon\.png"/);
  assert.match(html, /class="help-project-icon-link" href="https:\/\/hernow\.net"[^>]*><img[^>]*src="assets\/hernownet-icon\.png"/);
  assert.match(about, /href="https:\/\/github\.com\/AmandaHernow\/EncryptionDecryptionUtilityTool"/);
  assert.match(about, /href="https:\/\/hernow\.net\/about"/);
  assert.match(about, /encrypts and decrypts text locally/);
  for (const page of [html, about]) {
    for (const [, attrs] of page.matchAll(/<img\b([^>]*)>/g)) assert.match(attrs, /\balt="[^"]+"/, 'every image has nonempty alt text');
    assert.doesNotMatch(page, /<img\b[^>]*\bsrc="https?:/i, 'images are not hotlinked');
    assert.doesNotMatch(page, /<script\b[^>]*\bsrc="https?:/i, 'no external scripts are loaded');
  }
  assert.match(html, /href="mailto:bjcountertoolandroidsupport@hernow\.net"/);
  assert.match(about, /href="mailto:bjcountertoolandroidsupport@hernow\.net"/);
});

test('developer portraits use the intended reference-inspired, non-distorting treatments', () => {
  const root = path.join(__dirname, '..');
  const about = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  const frameRule = about.match(/\.hero-photo-frame\s*\{([^}]+)\}/)?.[1] || '';
  const portraitRule = about.match(/\.hero-photo\s*\{([^}]+)\}/)?.[1] || '';
  const helpPhotoRule = html.match(/\.developer-help-photo\s*\{([^}]+)\}/)?.[1] || '';

  assert.match(frameRule, /border-radius:\s*50%/);
  assert.doesNotMatch(frameRule, /transform\s*:/, 'standalone portrait is not tilted');
  assert.match(portraitRule, /object-fit:\s*cover/);
  assert.match(portraitRule, /object-position:\s*center/);
  assert.match(helpPhotoRule, /width:\s*104px/);
  assert.match(helpPhotoRule, /height:\s*104px/);
  assert.match(helpPhotoRule, /object-fit:\s*contain/);
  assert.doesNotMatch(helpPhotoRule, /border-radius:\s*50%/, 'Help portrait is not a tiny circular avatar');
  assert.match(html, /function openHelp\(\)\s*\{\s*helpModal\.style\.display\s*=\s*'flex'/);
  assert.match(html, /\.help-header-top/);
  assert.match(html, /\.step-item\s*\{[^}]*border-radius:\s*12px/s);
  assert.match(html, /\.support-panel\s*\{[^}]*border-radius:\s*16px/s);
});

test('practice-only messaging is present throughout the app, About page, metadata, and README', () => {
  const root = path.join(__dirname, '..');
  const about = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  for (const panel of ['usagePanel', 'bettingPanel', 'aboutPanel', 'disclaimerPanel']) {
    const start = html.indexOf(`id="${panel}"`);
    const end = html.indexOf('<div id="', start + 10);
    const content = html.slice(start, end < 0 ? undefined : end);
    assert.match(content, /practice|educational/i, `${panel} explains educational use`);
  }
  assert.match(html, /Practice and educational use only — not intended for live casino or real-money play/);
  assert.match(html, /not designed for use inside casinos, during live blackjack games, or while gambling with real money/);
  assert.match(about, /Designed for practice, not live gambling/);
  assert.match(about, /not intended for casino tables, live blackjack games, or real-money play/i);
  assert.match(readme, /not intended for use at casino tables, during live blackjack games, or while gambling with real money/i);
  assert.match(readme, /not instructions for real-money wagering/);
  assert.match(html, /Free educational blackjack card-counting practice tool/);
  assert.match(about, /educational browser practice tool for learning, practising, and understanding eight blackjack card-counting systems/);
  assert.match(about, /not intended for use during casino play or real-money gambling/);
});
