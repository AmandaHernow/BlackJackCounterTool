![banner-readme](https://github.com/user-attachments/assets/cae0c7a2-0fc6-4384-8853-5e2ab4191b3d)
# Blackjack Counter Tool

> A self-contained offline blackjack card counting tool — single HTML file, no dependencies, no internet required.

---

## Use it instantly — no download needed

The web version is hosted live and works directly in your browser:

**[Open Blackjack Counter Tool](https://amandahernow.github.io/BlackJackCounterTool/BJCounterTool.html)**

No installation or account. The hosted page is delivered by GitHub Pages; a downloaded copy can be opened locally and used offline.

---

## Download

If you prefer to run it locally, download `BJCounterTool.html` from the [latest release](https://github.com/AmandaHernow/BlackJackCounterTool/releases/latest) and open it in any modern browser.

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
- Exact-card remaining shoe tracking and True Count for all six balanced systems
- System-specific KO key-count/pivot references and Red 7 pivot-based betting guide
- Ace side count with density information for Hi-Opt I, Hi-Opt II, and Omega II
- System-specific initial running counts (IRC) for unbalanced systems

**Interface**
- Dark and light mode with preference saved automatically
- Configurable shoe size from 1 to 8 decks, including common 8-deck shoes
- Cards Left and a half-deck Decks Left indicator that update automatically as cards are counted
- System-specific button layouts that change per counting method
- Betting suggestion panel using a documented system-specific rule
- Ace density note — rich, poor, or neutral — for ace side count systems; it does not change the recommendation
- Action log with 24-hour timestamps for every card counted
- Undo, New Shoe, and Clear controls
- Built-in Help covering usage, systems, betting logic, expert notes, About, optional Support, and disclaimer
- A focused main counter interface; project information and links are available from Help → About
- Standalone [About page](https://amandahernow.github.io/BlackJackCounterTool/about.html) with project background and related projects
- Redesigned [Privacy Policy](https://amandahernow.github.io/BlackJackCounterTool/privacy_policy.html) and sitemap entry for the About page
- Optional PayPal donations through a user-initiated external link; no features are locked behind payment

**Technical**
- Single `.html` file — open directly in any browser, no install needed
- Content Security Policy blocks app-initiated outbound connections and remote resources; external links navigate only when selected
- No external scripts, fonts, or stylesheets
- Counting sessions remain in the current page and are not uploaded; only the optional theme preference is saved in local browser storage

---

## Usage

1. Open the [live version](https://amandahernow.github.io/BlackJackCounterTool/BJCounterTool.html) in your browser, or download and open `BJCounterTool.html` locally
2. Select the number of decks in the shoe (1–8)
3. Click the counting system tab you want to use
4. Press the buttons as cards are dealt
5. Read Cards Left, Decks Left, the applicable count reference, and the betting suggestion. Decks Left shows half-deck intervals: `= 7.5` means exactly 7.5 decks remain; `< 7.5` means fewer than 7.5 but more than 7 decks remain. Balanced systems show True Count; KO and Red 7 use unbalanced running-count conventions.
6. Hit **New Shoe** when the shoe is shuffled and restarted
7. Use **Undo** to step back one card, shoe reset, or shoe-size change at a time. Changing the shoe size starts a fresh shoe; Undo can restore the previous shoe and its count history.

Cards and decks remaining update after each counted card, including zero-value and fractional-value buttons. **New Shoe** and **Clear** reset the selected shoe; **Undo** restores the previous card or shoe state. Counting buttons stop accepting cards when the selected shoe is empty.

The Decks Left display uses `=` at an exact whole- or half-deck boundary and `<` between boundaries (for example, `= 8`, `< 8`, and `= 7.5`). This is display formatting only: the app tracks exact remaining cards and uses precise fractional decks for balanced-system True Count calculations. Near an empty shoe, True Count uses a minimum divisor of 0.5 decks; the display still shows the actual remaining amount. Undo restores the previous shoe state; New Shoe and Clear start the selected shoe over.

The built-in Help panel covers each system's card values, betting ramp, expert notes, About, optional Support, and disclaimer — press **?** to open it. About includes links to the [project repository](https://github.com/AmandaHernow/BlackJackCounterTool), [latest release](https://github.com/AmandaHernow/BlackJackCounterTool/releases/latest), and [Privacy Policy](https://amandahernow.github.io/BlackJackCounterTool/privacy_policy.html).

## About, privacy and support

The [About page](https://amandahernow.github.io/BlackJackCounterTool/about.html) introduces the independently developed project, its privacy and accessibility goals, and related projects: the [Text Encryption and Decryption Utility Tool](https://amandahernow.github.io/EncryptionDecryptionUtilityTool/) and [HernowNet](https://hernow.net), which is under active development. It also links to the [GitHub repository](https://github.com/AmandaHernow/BlackJackCounterTool) and [latest release](https://github.com/AmandaHernow/BlackJackCounterTool/releases/latest).

Support is optional. Users can choose the PayPal link or a local QR code for the same PayPal destination; the app does not process payments, load PayPal automatically, or lock features behind donations. Visiting PayPal is subject to PayPal's own privacy practices. The [Privacy Policy](https://amandahernow.github.io/BlackJackCounterTool/privacy_policy.html) explains GitHub Pages delivery, local calculations and storage, offline use of a downloaded file, and user-initiated external links.

---

## System Reference

### Balanced systems
Balanced systems start at 0 and return to 0 after a full deck — the true count is calculated from the running count and precise fractional decks remaining, not the half-deck display. Near an empty shoe, the calculation uses a minimum divisor of 0.5 decks to avoid extreme values. The Decks Left indicator continues to show the actual remaining interval down to `= 0`.

| System | Card values |
|---|---|
| Hi-Lo | 2–6 +1; 7–9 0; 10–A −1 |
| Hi-Opt I | 3–6 +1; 2, 7–9 0; 10–K −1; A side count |
| Hi-Opt II | 4–5 +2; 2, 3, 6–7 +1; 8–9 0; 10–K −2; A side count |
| Zen Count | 4–6 +2; 2, 3, 7 +1; 8–9 0; A −1; 10–K −2 |
| Omega II | 4–6 +2; 2, 3, 7 +1; 8 0; 9 −1; 10–K −2; A side count |
| Wong Halves | 5 +1.5; 3, 4, 6 +1; 2, 7 +0.5; 8 0; 9 −0.5; 10–A −1 |

### Unbalanced systems
Unbalanced systems have a positive per-deck tag drift, so the IRC offsets the count at the start. They use system-specific running-count references rather than the balanced-system True Count conversion. An IRC, key count, and pivot have different meanings.

| System | IRC (6 decks) | Key count (6 decks) |
|---|---|---|
| KO | −20 | −4 |
| Red 7 | −12 | No KO-style key; pivot 0 |

---

KO's IRC is `4 − 4 × decks`; Red 7's IRC is `−2 × decks`. KO's published key counts used here are +2 (1 deck), +1 (2), −1 (4), −4 (6), and −6 (8). The app does not claim standard published KO key counts for 3, 5, or 7 decks; for those sizes it uses the conservative +4 pivot fallback described below. KO's pivot is +4 at every shoe size. Red 7's adjusted IRC makes its pivot 0; its published simple betting guide first raises at zero.

## How Betting Suggestions Are Calculated

| System | Betting assessment used by this app |
|---|---|
| Hi-Lo | Shared balanced True Count ramp below |
| KO | Minimum below the published key; Raise from key to pivot; Max at/above +4 pivot; conservative pivot fallback for 3/5/7 decks |
| Red 7 | Snyder 1-deck, 2-deck, or Shoe unit chart; zero pivot is first raise; exact guide units appear in the note |
| Hi-Opt I | Shared balanced True Count ramp below; ace density is informational only |
| Hi-Opt II | Shared balanced True Count ramp below; ace density is informational only |
| Zen Count | Shared balanced True Count ramp below |
| Omega II | Shared balanced True Count ramp below; ace density is informational only |
| Wong Halves | Shared balanced True Count ramp below |

### Balanced systems

Hi-Lo, Hi-Opt I, Hi-Opt II, Zen, Omega II, and Wong Halves all use the same application-specific training ramp. The app calculates `True Count = running count ÷ max(exact decks remaining, 0.5)` without rounding the half-deck display:

| True Count band | Suggestion |
|---|---|
| TC ≥ +4 | Max |
| +3 ≤ TC < +4 | High |
| +2 ≤ TC < +3 | Raise |
| +1 ≤ TC < +2 | Slight Increase |
| 0 ≤ TC < +1 | Standard |
| −2 < TC < 0 | Minimum |
| TC ≤ −2 | Sit Out / Minimum |

The same numeric ramp is not a claim that these six systems have identical betting correlation or that a given True Count represents the same edge. It is a simplified learning aid, not a strategy optimized for rules, penetration, bankroll, or risk.

### KO (Knock-Out)

The KO Rookie convention raises the bet at or above its key count. This app labels below key **Minimum**, from key up to (but not including) the +4 pivot **Raise**, and at/above +4 **Max**. Thus an eight-deck KO count of −6 is at key and says Raise, while +4 is the pivot and says Max. The KO book describes the key count as the start of the increase and suggests reaching the maximum bet at or near pivot; labels here summarize those bands and do not specify dollar amounts or a bankroll spread.

Published key counts used by this app: 1 deck +2, 2 decks +1, 4 decks −1, 6 decks −4, and 8 decks −6. This corrects earlier app values of 0, −2, and −5 for 2, 4, and 6 decks, which did not match the cited KO convention. No standard key count for 3, 5, or 7 decks was established from the references used for this implementation. At those sizes the conservative fallback is Minimum below the +4 pivot and Max at/above +4. The app explicitly shows that no published key is available rather than inventing one. It does not pass KO's raw running count into the balanced True Count ramp.

### Red 7

The app applies Arnold Snyder's published Red 7 unit guide: its 1-deck and 2-deck columns are used for those shoe sizes, and its “Shoe” column for 3–8 decks. The guide starts at one unit for negative running counts and first increases to two units at the zero pivot. For 3–8 decks, subsequent guide thresholds are +6 (3 units), +8 (4 units), +12 (6 units), and +16 (8 units). The 2-deck schedule is +4 (3 units), +6 (4), and +8 (6); the 1-deck schedule is +2 (4 units). Each threshold's unit recommendation carries forward until the next threshold. The displayed note includes the unit count, while the category is a short summary of that level. In this convention, zero is both the pivot and the first-raise point, but the pivot's meaning and the betting-table trigger are distinct ideas. Red 7 running counts do not use the balanced ramp.

### What the categories mean

**Minimum** is the baseline one-unit training level. **Standard**, **Slight Increase**, **Raise**, **High**, and **Max** are descriptive levels selected by the rules above; they are not fixed dollar values. **Sit Out / Minimum** is the lowest balanced-ramp band and leaves the choice to the user. The Red 7 note reports guide units explicitly. This application does not calculate casino-edge percentages, bet sizes, bankroll fractions, or risk of ruin.

Betting correlation measures how well a count tracks the remaining cards' effect for wagering; playing efficiency and insurance correlation describe different uses. Those measures vary across systems, and a common True Count ramp is a deliberate simplification. The suggestions also ignore table rules (including blackjack payout, soft-17 rule, doubling, splitting, surrender), penetration, bankroll, table limits, and camouflage. No displayed category guarantees a player edge or a win.

### Examples

- Balanced: running count +8 with 4 exact decks remaining gives TC +2.00 and **Raise**.
- KO: with 8 decks selected, RC −6 is at the published key and gives **Raise**; RC +4 is the pivot and gives **Max**.
- Red 7: with 6 decks selected, RC 0 is at pivot and gives **Slight Increase** with a 2-unit guide; RC +8 gives **High** with 4 units.

For Hi-Opt I, Hi-Opt II, and Omega II, ace density is shown as additional information and does not automatically change the betting recommendation.

### References

- Olaf Vancura and Ken Fuchs, [*Knock-Out Blackjack* sample](https://www.lasvegasadvisor.com/shop/wp-content/uploads/2017/06/KOBJ-Sample.pdf): IRC convention, KO Rookie key-count betting, pivot, and the principle of increasing toward pivot.
- Arnold Snyder, [“The Easy Red 7 Count”](https://www.lasvegasadvisor.com/blog/the-easy-red-7-count/): Red 7 tags, IRC/pivot convention, and one-, two-, and shoe-game unit guide.
- QFIT card-tag references: [Hi-Lo](https://www.qfit.com/cardcounting/Hi-Lo/), [KO](https://www.qfit.com/cardcounting/K-O/), [Hi-Opt I](https://www.qfit.com/cardcounting/Hi-Opt-I/), [Hi-Opt II](https://www.qfit.com/cardcounting/Hi-Opt-II/), [Zen](https://www.qfit.com/cardcounting/Zen-Count/), [Omega II](https://www.qfit.com/cardcounting/Omega-II/), and [Wong Halves](https://www.qfit.com/cardcounting/Wong-Halves/). QFIT documents strategy variants and indices by game rules and deck count; this app's common balanced ramp is a simplified training choice.

---

## Roadmap

| Version | Platform | Status |
|---|---|---|
| Web Version 1.0 | Browser | ✅ Released |
| Desktop Version 1.0 | Windows / macOS / Linux (Java) | 🔄 In progress |

---

## Tech

Built with plain HTML, CSS, and JavaScript. No frameworks, no build tools, no package manager.

```
BJCounterTool.html   ← the entire web application
```

---

## Disclaimer

Card counting is not illegal in most jurisdictions but casinos are private property and may restrict or remove players they suspect of counting. This tool is for personal practice and reference only. It does not guarantee any outcome and is not professional gambling advice.

---

© 2026 Amanda Hernow — All rights reserved.
Unauthorised copying, modification, or distribution of this software is prohibited.
© 2026 Amanda Hernow — All rights reserved.  
Unauthorised copying, modification, or distribution of this software is prohibited.
