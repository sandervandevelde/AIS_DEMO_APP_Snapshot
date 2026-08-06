# Vibration Alert Triage User Manual

## 1. Purpose

This app helps you monitor live camera snapshots, inspect vibration-related values, and save important images with notes for later review.

## 2. Main Screen Overview

At the top of the app, you will find:

1. Camera Live Panels
2. Vibration Alert Triage (subtitle)
3. View switch:
4. Live Images
5. Saved Image Notes
6. Dark mode / Light mode toggle

## 3. View Modes

### Live Images

Use this mode for real-time monitoring.

You will see:

1. A live status panel with:
2. Last refresh time
3. Countdown to next refresh
4. Refresh interval selector
5. Guidance about automatic refresh and freeze behavior
6. Camera cards for each available camera snapshot

### Saved Image Notes

Use this mode to review previously saved snapshots and annotations.

You will see:

1. Saved image cards
2. Capture metadata
3. Author and save time
4. Download action
5. Prominent note text area

## 4. Live Monitoring Features

### Automatic Refresh

The app refreshes live data continuously.

1. You can set refresh frequency with the Refresh every selector.
2. A countdown shows how many seconds remain until the next update.

### Image Age Stopwatch

Each camera card shows how old the current image is.

1. Format is mm:ss for under one hour.
2. Format changes to hh:mm:ss for one hour or more.

### Universal Namespace Panel

Each camera card includes a Universal Namespace sub-panel.

1. It is derived from the CONTROL value.
2. CONTROL is split by slash characters.
3. The resulting namespace parts are shown in a readable sequence.

### Displacement Mini Chart

Each card shows a compact vertical displacement chart.

1. The bar fill represents current displacement.
2. A marker line represents threshold.
3. The numeric readout shows current and threshold values.
4. Over-threshold conditions are highlighted.

## 5. Freeze Behavior

### Manual Freeze

Each camera card has a Freeze checkbox.

1. When enabled, that camera image stays fixed.
2. Other cameras continue updating normally.

### Update While Frozen

If a new image arrives while a panel is frozen:

1. Freeze text becomes bold.
2. An update indicator appears: Update ready, unfreeze to apply

### Unfreeze Behavior

When you unfreeze:

1. The newest available image is applied immediately.
2. You do not need to wait for another refresh cycle.

## 6. Details Dialog

Open by selecting Details on a camera card.

What you can do

1. View a larger version of the image
2. Download the selected image
3. Enter a note
4. Save to notes list

### Automatic Freeze on Open

When Details opens for a camera:

1. That camera is automatically frozen
2. This keeps the viewed image stable while inspecting details

### New Image During Details

If a new image arrives while Details is open:

1. You get a notice that a newer image is available
2. On closing Details, the main panel refreshes to the newest image automatically

### Added By Field

The author is read-only.

1. It uses your signed-in identity
2. There is no editable name textbox

## 7. Saving Notes

When saving from Details:

1. The image snapshot is stored
2. Your note is stored
3. Author and timestamp are stored
4. Saved entries appear in Saved Image Notes view

## 8. Downloading Images

You can download images from:

1. Details dialog in Live Images mode
2. Each card in Saved Image Notes mode

## 9. Data Integrity and Warnings

If payload validation fails:

1. The app may show decode or truncation warnings
2. Unreliable images are not rendered as normal snapshots
3. Save action is blocked for known incomplete payloads

## 10. Recommended Workflow

1. Start in Live Images view
2. Freeze a camera when you spot an interesting event
3. Open Details for close inspection
4. Add note and save
5. Switch to Saved Image Notes for comparison and reporting

## 11. Troubleshooting Tips

1. No live cards visible: Switch to Live Images view and wait one refresh cycle.
2. No saved items visible: Switch to Saved Image Notes and confirm at least one saved entry exists.
3. Freeze is bold with update indicator: Unfreeze to apply the new image.
4. Image not shown: Check for payload mismatch/truncation warnings in the card or dialog.