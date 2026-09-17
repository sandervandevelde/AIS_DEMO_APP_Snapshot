# Vibration Alert Triage User Manual

## 1. Purpose

This app helps you monitor live camera snapshots, inspect vibration-related values over time, save important images with notes for later review, and log future app improvements.

The app is intended to run inside the Microsoft Fabric portal. You must be signed in through Fabric to access the live and saved data. Opening the app directly outside Fabric shows an access message instead of the monitoring workspace.

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

The Help button opens the in-app version of this manual. The app uses your selected light or dark theme throughout the interface.

## 3. View Modes

### Live Images

Use this mode for real-time monitoring.

You will see:

1. A live status panel with last refresh time
2. Countdown to the next refresh
3. Timezone selector
4. Refresh interval selector
5. Guidance about automatic refresh and freeze behavior
6. Camera cards for each available camera snapshot
7. Shared Show displacement / Hide displacement toggle
8. Camera metadata including source, control namespace, image size, and chunk count
9. Payload validation status, including Base64 length, decoded bytes, and match or mismatch
10. Displacement detail panels when visuals are shown
11. 24H device timeline when visuals are shown
12. Displacement histogram when visuals are shown
13. Per-camera hide controls and restore controls for hidden cameras

Camera labels use the Building, Line, and Sensor parts of the Universal Namespace, separated with `/` (for example, `Building-1/Line-2/Sensor-3`). If those UNS parts are unavailable, the numeric camera ID is shown as a fallback.

### Saved Image Notes

Use this mode to review previously saved snapshots and annotations.

You will see:

1. Saved image cards
2. Capture metadata
3. Author and save time
4. Saved displacement and threshold values
5. Full Universal Namespace value
6. Timezone selector
7. Download action on each card
8. Prominent note text area
9. Search across note content and saved metadata
10. Camera filter showing only cameras that are currently visible on the main page
11. Items per page controls with 5, 10, 15, 20, or All options
12. Previous and Next pagination controls with the current result range and total count
13. Read-only details dialog for saved log items

The selected page size is exclusive: exactly one option is active at a time. Changing the search text, camera filter, or page size returns the list to page 1.

The camera filter and saved cards use only cameras that are currently visible on the main page. Hiding a camera removes its saved records from this view until the camera is shown again.

### App Proposals

Use this mode to log and manage feature ideas.

You will see:

1. Proposal entry form
2. Priority selector
3. Search across proposal fields, identity, dates, and status
4. Multi-priority filters
5. Hide completed toggle
6. Total and visible item counts
7. Open and completed proposal cards
8. Mark completed, undo completed, and delete actions

## 4. Live Monitoring Features

### Automatic Refresh

The app refreshes live data continuously.

1. You can set refresh frequency to 10 seconds, 30 seconds, 60 seconds, 5 minutes, 15 minutes, or 30 minutes with the Refresh every selector.
2. A countdown shows how many seconds remain until the next update.
3. Last refresh time is displayed in the selected timezone.
4. The live view shows a loading state, empty state, or error message when the semantic-model query has not produced usable data.

### Timezone Handling

All source timestamps are stored in UTC, but the app can display them in your preferred timezone.

1. The timezone selector defaults to CET (`UTC+01:00`).
2. Your last timezone choice is remembered.
3. Displayed times are converted to the selected timezone.
4. Age values remain correct because they are calculated from the original UTC timestamps.
5. The selector provides 24 fixed UTC-offset choices from `UTC-12:00` through `UTC+11:00`, including `UTC+00:00 (UTC)`. Each option includes a conventional abbreviation, such as `UTC+01:00 (CET)`. The numeric offset is authoritative because abbreviations can vary by region.

### Image Age Stopwatch

Each camera card shows how old the current image is.

1. Format is mm:ss for under one hour.
2. Format changes to hh:mm:ss for one hour or more.

### Universal Namespace Panel

Each camera card includes a Universal Namespace sub-panel.

1. It is derived from the CONTROL value.
2. CONTROL is split by slash characters.
3. The resulting namespace parts are shown as Company, Country, City, Building, Line, and Sensor.
4. The camera's primary label is the combined `Building/Line/Sensor` value so the same physical camera is recognizable across views.

### Show / Hide Displacement Visuals

Each camera card has a shared details toggle in the header.

1. The default first-load state is Show displacement, which means the extra visuals start hidden.
2. The toggle applies to all camera cards.
3. Your last choice is remembered and reused after refresh or reopen.

### Displacement Mini Chart

Each card shows a compact vertical displacement chart.

1. The bar fill represents current displacement.
2. A marker line represents threshold.
3. The numeric readout shows current and threshold values.
4. Over-threshold conditions are highlighted.
5. Missing displacement values are shown as unavailable rather than treated as valid measurements.

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
5. The panel shows the number of events and reports when the timeline query is unavailable.

## 5. Freeze Behavior

### Manual Freeze

Each camera card has a Freeze control with a snowflake icon.

1. Select the snowflake control to freeze that camera image.
2. Other cameras continue updating normally.

### Update While Frozen

If a new image arrives while a panel is frozen:

1. Freeze text becomes bold.
2. An update indicator appears: Update ready, unfreeze to apply

### Unfreeze Behavior

Select the active snowflake control again to unfreeze:

1. The newest available image is applied immediately.
2. You do not need to wait for another refresh cycle.

## 6. Camera Visibility

Camera visibility is controlled independently from Freeze.

1. Select Hide on a live camera card to remove that camera from the main card grid.
2. Hidden camera choices are remembered in this browser and remain hidden after refresh or reopening the app.
3. Hidden camera buttons appear in the live toolbar using the camera's `Building/Line/Sensor` identifier. Select a camera button to show that camera again.
4. Select Show all to restore every hidden camera at once.
5. Hiding a camera does not delete its data or change its Fabric queries.
6. The saved visibility choice and UNS label are retained for the hidden camera across refreshes and reopening the app.

## 7. Details Dialog

Open by selecting Details on a camera card.
You can also open it by clicking the live camera image.

What you can do

1. View a larger version of the image
2. Download the selected image
3. Enter a note
4. Save to notes list

If the payload is incomplete, the dialog shows a warning instead of a reliable preview and the save action is disabled. The separate Details button remains available even when the image area is replaced by a warning.

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

## 8. Saving Notes

When saving from Details:

1. The image snapshot is stored
2. Your note is stored
3. Author and timestamp are stored
4. Source topic, control topic, content type, camera, and capture timestamp are stored with the entry
5. The displacement and threshold values shown are captured from the live image at the time you save it.
6. The full Universal Namespace is stored as a separate property on the saved entry.
7. Large image payloads are stored as ordered chunks and reassembled when the saved list is loaded
8. Saved entries appear in Saved Image Notes view

Older saved entries without the dedicated Universal Namespace property fall back to their stored control topic when displaying the namespace.

## 9. Removing Saved Images

You can remove an image from Saved Image Notes when it is no longer needed.

1. Select Delete on a saved-image card, or select Delete Saved Image from its read-only details dialog.
2. Confirm the deletion when prompted.
3. The saved image and its stored payload chunks are removed from the list.
4. Deletion is limited to your own saved records.
5. Deletion cannot be undone, so download or review an image before removing it if you may need it later.

## 10. Downloading Images

You can download images from:

1. Details dialog in Live Images mode
2. Each card in Saved Image Notes mode
3. Read-only details dialog in Saved Image Notes mode

## 11. Saved Log Details (Read-only)

Saved Image Notes includes a read-only details dialog for saved log items.

1. Open by clicking a saved image or by selecting Details (read-only).
2. View a larger preview with full saved metadata.
3. Review the saved note in a non-editable field.
4. Review the saved displacement and threshold values captured when the image was saved.
5. Review the full saved Universal Namespace value.
6. Download the selected saved image from the dialog.
7. Delete the saved image after confirmation.

## 12. Data Integrity and Warnings

If payload validation fails:

1. The app may show decode or truncation warnings
2. Unreliable images are not rendered as normal snapshots
3. Save action is blocked for known incomplete payloads
4. Download reports an error when the Base64 payload cannot be decoded

## 13. App Proposals

The proposals tab is used to collect future feature ideas and track their status.

1. Create a proposal with a title, description, and low, medium, or high priority.
2. The signed-in identity and submission time are added automatically.
3. Filter the visible list by one or more priority levels.
4. Search title, description, priority, identity, dates, and open or completed status.
5. Hide completed proposals to focus on the active backlog.
6. Review total and currently visible proposal counts.
7. Mark open proposals completed, or undo completion to reopen them.
8. Delete proposals after confirmation.

## 14. Recommended Workflow

1. Start in Live Images view
2. Freeze a camera when you spot an interesting event
3. Open Details for close inspection
4. Add note and save
5. Review displacement, the 24H timeline, and the displacement histogram for context
6. Switch to Saved Image Notes for comparison and reporting
7. Use App Proposals to log future improvements

## 15. Troubleshooting Tips

1. No live cards visible: Switch to Live Images view and wait one refresh cycle.
2. No saved items visible: Switch to Saved Image Notes and confirm at least one saved entry exists.
3. Times look wrong for your location: Change the timezone selector. Age values still stay correct because they are calculated from UTC.
4. Freeze is bold with update indicator: Unfreeze to apply the new image.
5. Image not shown: Check for payload mismatch/truncation warnings in the card or dialog.
6. Timeline shows no events: Confirm the semantic model has recent rows for the selected camera.
7. Timeline or displacement histogram looks sparse: That can happen when events are filtered by the 24-hour window or when many chunks collapse to one event.
8. The app says it cannot open outside Fabric: Open the app from the Fabric portal while signed in.
9. A camera is missing from the main page: Check the Hidden cameras controls in the live toolbar and select the camera to restore it, or select Show all.
10. A saved image is no longer needed: Open Saved Image Notes and use Delete, then confirm the prompt.
11. A saved camera is missing: Check whether that camera is hidden on the main page; unhide it there to make its saved records available again.