![banner-readme](https://github.com/user-attachments/assets/075d09a0-6b01-4593-87f3-d24b8686f6ef)
# Black Jack Counter Tool

> A self-contained offline blackjack card counting tool — single HTML file, no dependencies, no internet required.

---

## Supported Systems

| System | Type | Level | Ace Side Count |
|---|---|---|---|
| Hi-Lo | Balanced | Level 1 | No |
| KO (Knock-Out) | Unbalanced | Level 1 | No |
| Red 7 | Unbalanced | Level 1 | No |
| Hi-Opt I | Balanced | Level 1 | Yes |
| Hi-Opt II | Balanced | Level 2 | Yes |
| Zen Count | Balanced | Level 2 | No |
| Omega II | Balanced | Level 2 | Yes |
| Wong Halves | Balanced | Fractional | No |

---

## Features

**Counting**
- Running count displayed prominently at all times
- True count (running ÷ decks remaining) for all balanced systems
- Key count tracking and threshold comparison for unbalanced systems (KO, Red 7)
- Ace side count with density tracking for Hi-Opt I, Hi-Opt II, and Omega II
- Correct IRC (initial running count) for unbalanced systems based on shoe size

**Interface**
- Configurable shoe size from 1 to 7 decks
- System-specific button layouts that change per counting method
- Betting suggestion panel with visual ramp tied to true count or running count
- Ace density indicator — rich, poor, or neutral — for ace side count systems
- Action log with 24-hour timestamps for every card counted
- Undo, New Shoe, and Clear controls
- Built-in help modal covering usage, all systems, betting logic, expert notes, and disclaimer

**Technical**
- Single `.html` file — open directly in any browser, no install needed
- Strict CSP header blocking all outbound connections
- No external scripts, fonts, or stylesheets
- No data stored, no network requests made

---

## Usage

1. Open `BJCounterTool.html` in any modern browser
2. Select the number of decks in the shoe
3. Click the counting system tab you want to use
4. Press the buttons as cards are dealt
5. Read the true count or key count status and the betting suggestion
6. Hit **New Shoe** when the shoe is shuffled and restarted
7. Use **Undo** to step back one action at a time

The full built-in help panel (accessible via the `?` button) covers each system's card values, the betting ramp, expert-level notes on index plays and deck estimation, and a disclaimer.

---

## System Reference

### Balanced systems
Balanced systems start at 0 and return to 0 after a full deck — the true count is calculated as running count ÷ decks remaining.

| System | Values used |
|---|---|
| Hi-Lo | +1 / 0 / −1 |
| Hi-Opt I | +1 / 0 / −1 + ace side count |
| Hi-Opt II | +2 / +1 / 0 / −2 + ace side count |
| Zen Count | +2 / +1 / 0 / −1 / −2 |
| Omega II | +2 / +1 / 0 / −1 / −2 + ace side count |
| Wong Halves | +1.5 / +1 / +0.5 / 0 / −0.5 / −1 |

### Unbalanced systems
Unbalanced systems do not return to 0 — they start at a negative IRC and use a key count threshold instead of true count conversion.

| System | IRC (6 decks) | Key count (6 decks) |
|---|---|---|
| KO | −20 | −5 |
| Red 7 | −12 | 0 |

---

## Betting Suggestion Ramp

| True Count | Suggestion |
|---|---|
| +4 and above | Max |
| +3 | High |
| +2 | Raise |
| +1 | Slight Increase |
| 0 | Standard |
| −1 | Minimum |
| −2 or worse | Sit Out / Minimum |

> For KO and Red 7, the ramp is based on running count vs the key count threshold rather than true count.

---

## Tech

Built with plain HTML, CSS, and JavaScript. No frameworks, no build tools, no package manager.

```
BJCounterTool.html   ← the entire application
```

---

## Status

Private repository. May be published at a later date.

---

## Disclaimer

Card counting is not illegal in most jurisdictions but casinos are private property and may restrict or remove players they suspect of counting. This tool is for personal practice and reference only. It does not guarantee any outcome and is not professional gambling advice.

---

© 2026 Amanda Hernow — All rights reserved.  
Unauthorised copying, modification, or distribution of this software is prohibited.
