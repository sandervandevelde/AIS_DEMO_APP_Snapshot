# Vibration Alert Triage

Vibration Alert Triage is a real-time operations application built for fast, reliable incident review of camera-based vibration events.

It combines live image monitoring, event context, and operator collaboration in one focused workflow so teams can detect anomalies, inspect evidence, and preserve findings without leaving the app.

## What This App Delivers

- Real-time live camera panels driven by Fabric semantic model data
- Per-camera freeze controls for focused analysis during active streams
- One-click details view from both the button and direct image click
- 24-hour event timeline with displacement dots and changing threshold trace
- Compact displacement analytics, including current vs threshold and a displacement count table
- Universal Namespace breakdown per camera: Company / Country / City / Building / Line / Sensor
- Snapshot note capture with persistent saved image records
- Proposal management board for product improvement ideas (create, filter, complete, reopen, delete)
- Built-in timezone selector (default CET) with correct UTC-based age calculations

## Why Teams Use It

Vibration Alert Triage is designed for operators who need speed, clarity, and confidence:

- Speed: Move from live signal to detailed evidence in one click.
- Clarity: See displacement behavior over time, not just single-frame values.
- Confidence: Preserve important moments with notes and complete metadata.
- Continuity: Track and prioritize future enhancements directly in the app.

## Core Experience

### Live Images

Monitor incoming snapshots in near real-time with configurable refresh intervals, shared detail visibility controls, and per-camera freeze behavior.

### Saved Image Notes

Review saved snapshots, author notes, and key metadata for historical comparison and reporting.

### App Proposals

Capture improvement ideas as structured proposal items with priority, status tracking, filtering, and cleanup actions.

## Built for Operations Reality

The app is intentionally optimized for real-world alert handling:

- Handles chunked event payload scenarios while preserving single-event timeline behavior
- Surfaces payload integrity mismatches to avoid acting on unreliable images
- Keeps time interpretation operator-friendly across regions with timezone conversion
- Maintains manual control while still handling live updates safely

## Technology Foundation

- React + TypeScript + Vite frontend
- Microsoft Fabric semantic model querying
- Rayfin-backed app data and proposal persistence
- Azure/Fabric deployment pipeline for hosted runtime delivery

## In Short

Vibration Alert Triage turns raw vibration event streams into actionable operational decisions, pairing live observability with structured evidence capture and continuous product feedback.