# Vibration Alert Triage User Manual

## 1. Purpose

This app helps you monitor live camera snapshots, inspect vibration-related values over time, save important images with notes for later review, and log future app improvements.

## 2. Main Screen Overview

At the top of the app, you will find:

1. Vibration Alert Triage title and subtitle
2. Clickable title that returns to Live Images
3. View switch
4. Live Images
5. Saved Image Notes
6. App Proposals
7. Dark mode / Light mode toggle
8. Help button

## 3. View Modes

### Live Images

Use this mode for real-time monitoring.

You will see:

1. A live status panel
2. Last refresh time
3. Countdown to next refresh
4. Timezone selector
5. Refresh interval selector
6. Guidance about automatic refresh and freeze behavior
7. Camera cards for each available camera snapshot
8. Shared Show displacement / Hide displacement toggle
9. Displacement detail panels when details are shown
10. 24H device timeline when details are shown

### Saved Image Notes

Use this mode to review previously saved snapshots and annotations.

You will see:

1. Saved image cards
2. Capture metadata
3. Author and save time
4. Timezone selector
5. Download action
6. Prominent note text area
7. Search and camera filters
8. Read-only details dialog for saved log items

### App Proposals

Use this mode to log and manage feature ideas.

You will see:

1. Proposal entry form
2. Priority selector
3. Search field
4. Multi-priority filters
5. Hide completed toggle
6. Open and completed proposal cards
7. Mark completed, undo completed, and delete actions

## 4. Live Monitoring Features

### Automatic Refresh

The app refreshes live data continuously.

1. You can set refresh frequency with the Refresh every selector.
2. A countdown shows how many seconds remain until the next update.
3. Last refresh time is displayed in the selected timezone.

### Timezone Handling

All source timestamps are stored in UTC, but the app can display them in your preferred timezone.

1. The timezone selector defaults to CET.
2. Your last timezone choice is remembered.
3. Displayed times are converted to the selected timezone.
4. Age values remain correct because they are calculated from the original UTC timestamps.

### Image Age Stopwatch

Each camera card shows how old the current image is.

1. Format is mm:ss for under one hour.
2. Format changes to hh:mm:ss for one hour or more.

### Universal Namespace Panel

Each camera card includes a Universal Namespace sub-panel.

1. It is derived from the CONTROL value.
2. CONTROL is split by slash characters.
3. The resulting namespace parts are shown as Company, Country, City, Building, Line, and Sensor.

### Show / Hide Displacement Visuals

Each camera card has a shared details toggle in the header.

1. The default first-load state is Show displacement, which means the extra visuals start hidden.
2. The toggle applies to all camera cards.
3. Your last choice is remembered and reused.

### Displacement Mini Chart

Each card shows a compact vertical displacement chart.

1. The bar fill represents current displacement.
2. A marker line represents threshold.
3. The numeric readout shows current and threshold values.
4. Over-threshold conditions are highlighted.

### Displacement Histogram

Each card shows a compact displacement summary table.

1. The table has two columns: Displacement and Count.
2. Counts are grouped by rounded displacement value.
3. The table is compact and scrolls inside its panel when needed.

### 24H Device Timeline

Each live card includes an in-memory timeline of events from the last 24 hours.

1. Each event is shown once, even if the source event has multiple chunk rows.
2. Dot position across the width shows when the event arrived.
3. Dot height shows the displacement value.
4. A dashed line shows the threshold history, even when the threshold changes per event.

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
You can also open it by clicking the live camera image.

What you can do

1. View a larger version of the image
2. Download the selected image
3. Enter a note
4. Save to notes list

### Automatic Freeze on Open

When Details opens for a camera:

1. That camera is automatically frozen if it was not manually frozen already
2. This keeps the viewed image stable while inspecting details

### New Image During Details

If a new image arrives while Details is open:

1. You get a notice that a newer image is available
2. On closing Details, the main panel refreshes to the newest image automatically
3. If freeze was added automatically for the dialog, it is removed on close.

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
3. Read-only details dialog in Saved Image Notes mode

## 9. Saved Log Details (Read-only)

Saved Image Notes includes a read-only details dialog for saved log items.

1. Open by clicking a saved image or by selecting Details (read-only).
2. View a larger preview with full saved metadata.
3. Review the saved note in a non-editable field.
4. Download the selected saved image from the dialog.

## 10. Data Integrity and Warnings

If payload validation fails:

1. The app may show decode or truncation warnings
2. Unreliable images are not rendered as normal snapshots
3. Save action is blocked for known incomplete payloads

## 11. Recommended Workflow

1. Start in Live Images view
2. Freeze a camera when you spot an interesting event
3. Open Details for close inspection
4. Add note and save
5. Review displacement, the 24H timeline, and the displacement table for context
6. Switch to Saved Image Notes for comparison and reporting
7. Use App Proposals to log future improvements

## 12. Troubleshooting Tips

1. No live cards visible: Switch to Live Images view and wait one refresh cycle.
2. No saved items visible: Switch to Saved Image Notes and confirm at least one saved entry exists.
3. Times look wrong for your location: Change the timezone selector. Age values still stay correct because they are calculated from UTC.
4. Freeze is bold with update indicator: Unfreeze to apply the new image.
5. Image not shown: Check for payload mismatch/truncation warnings in the card or dialog.
6. Timeline or displacement table looks sparse: That can happen when many source rows are chunk variants of the same event or when few events exist in the 24-hour window.