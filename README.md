# StroomMoment Workspace

StroomMoment is a Belgian energy-timing app that answers: "When should I use electricity?" It recommends windows for flexible loads while exposing the signals and scoring behind the recommendation.

## Start Here

- [Status](STATUS.md): dated operational and verification checkpoint; do not treat it as a live check.
- [Project memory](MEMORY.md): durable product and technical context.
- [Decisions](DECISIONS.md): accepted product and architecture decisions.
- [Roadmap](ROADMAP.md): directional phases, not a current completion report.
- [Ideas](IDEAS.md): active and parked product ideas.
- [App documentation](apps/stroommoment/README.md): app scope, implementation map, local commands, and detailed document index.
- [Agent instructions](AGENTS.md): repository-specific working rules.

## Future Ideas

- [House Futureproof Checker](future-ideas/house-futureproof-checker.md)
- [Home Assistant Belgium Hub](future-ideas/home-assistant-belgium-hub.md)
- [KBO/CBE Market Mapper](future-ideas/kbo-cbe-market-mapper.md)
- [Local Data Wall](future-ideas/local-data-wall.md)

## Repository Layout

- `apps/stroommoment/` contains the active FastAPI and Next.js app plus its documentation.
- `future-ideas/` contains parked Belgian open-data product ideas.
- Root tracking files preserve workspace-wide state, memory, decisions, and direction.

## Development

Run app commands from the workspace root using the relative paths documented in the [app README](apps/stroommoment/README.md). The source-of-truth remote is `https://github.com/nicolascools/StroomMoment`; public PoC procedures are in the [deployment runbook](apps/stroommoment/DEPLOYMENT.md).
