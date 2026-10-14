# ResQ

Disaster-response hackathon MVP with React, Vite, Tailwind, Leaflet, FastAPI and SQLite.

## Open in VS Code

Open this entire folder: `C:\Users\HP\Documents\Codex\2026-09-20\mak\outputs\resq`.
Frontend code is in `frontend/src`; API code is in `backend`.

## Setup (PowerShell)

Requires Python 3.11+ and Node.js 20.19+.

From the project folder:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
npm install --prefix frontend
```

Start the app from the project root:

```powershell
npm run dev
```

This launches the FastAPI backend and the Vite frontend together, picks a free port if 8002 or 4175 are already occupied, and points the frontend at the API automatically.

To serve the production build instead:

```powershell
npm run build
npm run preview
```

Open http://127.0.0.1:4175. Offline shell caching requires the production build/preview.

Responder access: enter a name and code `resq-demo`. Set `RESPONDER_CODE` in a project-root `.env` to override it. This is shared-code MVP access, not individual password accounts or production authorization. Keep one backend worker: mutation serialization and capacity checks are designed for this single-process SQLite MVP.

SQLite data persists in `backend/data/resq.db`; new registration tables are created automatically without deleting existing reports. Back up the whole data folder before moving the app. `RESQ_DATA_DIR` can select an isolated demo/test folder.

## Reporting

Speak or use the manual text backup, choose the incident location, then click **Submit report**. A map pin selects the location; it does not send by itself. A receipt links signed-in responders directly to the submitted incident. **All incoming** shows reports newest first, including unknown and medical reports. Nearby compatible reports may share an incident; original messages remain available in its details. **Search priority** retains evidence-based rescue ranking.

## Registration and check-in

Environmental Monitoring has been replaced with **Registration & Check-In**. Old `/sensors` browser links redirect to the new page. Old environmental records are preserved but no longer affect scores or alerts.

1. Add a shelter or distribution point with capacity.
2. Register a person, status and optional current site.
3. Download their QR card. The QR contains only their unique opaque ID.
4. Scan a QR with a camera, upload its image, or paste the ID. Review the profile and confirm the status/site change.
5. Relocation moves the person between site counts. Repeated scans do not add another person. Missing status clears the site; In shelter requires a site.

Camera use requires localhost or HTTPS and browser permission. NFC hardware integration is not included; QR and typed/keyboard-scanner IDs are supported.

Counts refresh every eight seconds. SQLite stores people, sites and check-in history. Site headcounts are derived from current person assignments. Full sites reject new arrivals. Version checks prevent stale changes from silently overwriting newer edits.

## Offline behavior

After an online visit to the production build, the app shell and viewed map tiles are cached. Reports, registrations, sites and check-ins are saved in IndexedDB and retried while the app is open after connectivity returns. Offline headcounts are explicitly provisional. Conflicts stay in the pending list for review; discard a rejected saved change and reapply it against the latest profile. Pending responder changes sync only under the same responder name. Keep the same browser origin/port to retain access to that origin's offline queue. Signing out clears cached snapshots, but preserves pending mutations.

## AI and demo limitations

Without an `ANTHROPIC_API_KEY`, multilingual extraction uses clearly labeled limited rules. Original reports remain intact. Acoustic recordings are stored; unavailable models do not produce fabricated detections. Command Center's **Load demo** adds clearly labeled simulated incidents. Person registration starts empty so fictional people are not counted as actual occupants. No automatic rescue dispatch.

## Verification

```powershell
.venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend
npm test
npm run build
```

Tests cover report receipts/grouping, voice transcript lifecycle, QR encoding/decoding, offline projections, idempotent registration/check-in, capacity, relocation, audit history and stale-edit rejection. Real microphone and physical camera hardware need browser/device testing.
