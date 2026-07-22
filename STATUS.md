# Status

Last verified: 2026-07-06

Live deployment state was not re-verified during the 2026-07-22 documentation review. The checkpoint below is historical evidence, not a claim about current availability or deployed revisions.

## Recorded Checkpoint

- Public PoC URL: `https://poc.coolsnet.com`.
- Host recorded at that checkpoint: `stroommoment-01` at `192.168.1.47`, app root `/opt/stroommoment`.
- Deployed app commit recorded on 2026-07-06: `26701fbd84db5947953835041512bb6c818eabb7` (`Merge decision console UI redesign`).
- At that checkpoint, GitHub `origin/master` had a newer docs-only architecture cleanup commit after the deploy; current remote/deploy parity is unknown.
- The frontend verified at that checkpoint was the Decision Console UI: decision hero first, timeline, guided planner, alternatives/avoid windows, collapsible charts/nerd/data sections, compact attribution footer.
- Backend/API behavior was not changed for the Decision Console UI deploy.

## Last Verified

- Local frontend build passed with `npm run build`.
- Backend tests passed with `26 passed, 1 warning`.
- Public `/`, `/health`, `/api/signals?hours=24`, recommendation API, `/favicon.ico`, and `/robots.txt` smoke tests passed.
- Recommendation API includes `avoid_windows`; current dishwasher smoke returned `top_windows=5` and `avoid_windows=3`.
- Docker Compose on `stroommoment-01` reported backend, frontend, and router healthy after rebuild.
- Backend cache mount remained `/var/lib/stroommoment/cache -> /app/.cache`, read-write and writable from the container.

## Gaps Recorded On 2026-07-06

- Full browser-console and visual QA was not completed from the agent shell; headless Firefox screenshot capture was unreliable and no Playwright/Puppeteer tooling is configured.
- Docker frontend build still reports `2 moderate severity vulnerabilities` from `npm audit`.

## Next Recommended Action

- Re-verify the public URL, deployed commit, Compose health, and remote configuration before relying on this checkpoint, then run the pending desktop/mobile browser QA pass.
