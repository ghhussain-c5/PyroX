# IGNIS — Combustion Research

A React dashboard for the NASA Space Apps Flame in Freefall challenge. Built with React, JavaScript, HTML/CSS and a Python FastAPI service.

## Publish on GitHub Pages

Follow [GITHUB_PAGES.md](GITHUB_PAGES.md). Automatic deployment and repository-compatible data paths are included.

## Run the dashboard

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL Vite prints. `npm run build` creates `dist/` for static hosting. The dashboard works without an AI key: scenario inputs, transparent ranking, research summaries, blind spots, graphs, saved scenarios, and exports run locally.

## Connect the agent

The included backend implements a bounded OpenAI Responses function-calling loop. Its two read-only tools retrieve report sections and experimental records. This is retrieval over your dataset; no model training is needed.

1. Create a Python 3.11+ virtual environment and install `backend/requirements.txt`.
2. Copy `.env.example` to `.env.local`. In that local file set `OPENAI_API_KEY`, a tool-capable `OPENAI_MODEL` available to your account, and `ALLOWED_ORIGINS` to your frontend origin. Keep the key out of Git and browser code.
3. Run the Python service:

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --env-file .env.local --port 8000
```

4. Set `VITE_API_URL=http://localhost:8000` in `.env.local`, then restart Vite. For production, deploy Python on a Python/container host, set its environment secrets, set `VITE_API_URL` to the resulting HTTPS backend URL, and rebuild the frontend. Docker build: `docker build -f backend/Dockerfile -t ignis-api .`.
5. `/api/health` reports whether the model settings exist; the assistant is enabled only when the configured backend responds with `ai_ready: true`. Settings present do not prove model credentials are valid; provider failures are handled visibly.

The published static Site does not host the Python process. It initially has no backend URL or API key. Before opening a paid model endpoint to a public audience, add your host's authentication, request quotas, and spending limits. CORS is not authentication. The backend currently limits concurrent calls and tool rounds, not per-user usage.

## Scientific boundaries

- 129 original BASS-II experimental records; one investigation, six report groups. The separate wax-candle test is retained in the source JSON but is outside those groups.
- 27 BASS-II SIBAL rows from Table 7.1. The default chart shows 17, excluding 8 reused-sample records and 2 records with uncertain oxygen readings.
- SIBAL points are final reported airflow endpoints. Selecting a point shows its starting flow and reported comment. Other groups use only single numeric air-display values; sequences are not averaged. CO plots show final sensor readings, not production rates.
- Unknown pressure stays unknown. The SIBAL pressure is a nominal section condition. Microgravity is never relabeled as lunar or Martian gravity.
- Relevance is a documented heuristic (material 35, geometry 5, gravity 20, oxygen 15, airflow 10, pressure 10, research focus 5), not a probability or safety score. Range overlap is not joint condition coverage.
- Summaries and the AI operate on curated sections/records. The full PDF is available to readers but is not fully indexed for retrieval.
- Raw qualifiers, questionable readings, and source values are preserved. Imported JSON is in `public/data/BASS_II_data.json`; report PDF is alongside it. Source: NASA/TM-20210011385 and PSI-25.

## Add more investigations

Add provenance-rich records and catalog sections, then extend the matching and plotting adapters in `src/engine.mjs` and backend tools. Keep each investigation's material, geometry, flow direction, gravity, units, pressure, measurements, limitations, source URL and page/table references. Do not combine incompatible measurements into a common numeric field without a documented conversion.

Useful next sources: BASS, Saffire, FLEX and SAME. They are not included or simulated in this version.

## Verification

```sh
npm test
python -m unittest discover -s tests -p 'test_*.py'
npm run build
```

Backend tests mock the model service. No live-model test is possible until credentials and a model are configured. Frontend science checks cover data counts, flagged/reused filters, unaltered plotted values, material/gravity gaps, scenario validation and CSV escaping.

Official API guide: https://developers.openai.com/api/docs/guides/function-calling

The bundled report is a compressed reading copy with the original 144-page pagination. Source hashes in the JSON refer to the original uploaded files, not this compressed PDF. Table 7.1 text was checked after compression.
