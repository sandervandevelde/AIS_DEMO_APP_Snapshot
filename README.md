# Vibration Alert Triage

## From Blog Post to Production-Ready App

<img width="1060" height="866" alt="image" src="https://github.com/user-attachments/assets/d23bc21a-653e-4fae-92a3-9b29c8a7c4a8" />

This repository is the companion implementation of the blog post:

[Turning Microsoft Fabric into a factory operations control center: RTSP snapshots in Fabric Apps](https://sandervandevelde.wordpress.com/2026/08/07/turning-microsoft-fabric-into-a-factory-operations-control-center-rtsp-snapshots-in-fabric-apps/)

The post explains the full process of turning industrial camera streams and event telemetry into an operator-ready control center. In short, the journey follows this flow:

1. Capture operational snapshot and vibration context from factory-facing sources.
2. Shape and expose that data through a Fabric-friendly analytics model.
3. Build a Fabric App experience for live triage, per-device inspection, and historical note-taking.
4. Add operator workflow features such as freeze/unfreeze, event timelines, displacement context, and proposal tracking.
5. Persist user-driven records (notes and proposals) through Rayfin-backed entities.
6. Deploy and run the solution in Fabric so teams can monitor, investigate, and collaborate in one place.

If you want the narrative and architectural rationale, read the blog post first. If you want the working implementation, continue with this repository.

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

## Built with Rayfin + Fabric Apps

This solution is implemented as a Fabric App with Rayfin as the application data layer.

- Fabric Apps provides the hosted app runtime and the integration point with semantic model data used by the live monitoring experience.
- Rayfin provides structured persistence for operational entities such as saved snapshot notes and app proposals, including identity-aware access behavior.
- The frontend uses Fabric semantic model queries for live camera/event telemetry while using Rayfin services for user-authored records and workflow state.
- Deployment is handled through the Rayfin workflow, which packages static assets, applies data configuration, and publishes the application into the target Fabric workspace.

In practice, this pairing gives the app a strong split of responsibilities: Fabric for analytics and operational telemetry context, and Rayfin for secure transactional app data and lifecycle management.

## In Short

Vibration Alert Triage turns raw vibration event streams into actionable operational decisions, pairing live observability with structured evidence capture and continuous product feedback.
