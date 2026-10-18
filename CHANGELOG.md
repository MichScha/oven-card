# Changelog

All notable changes. Versions follow [Semantic Versioning](https://semver.org/); each version
is published as a GitHub release, which HACS offers as an update.

## [0.1.0] - 2026-10-18

### Added

- `oven-window-card`: stove window with flame, air flap and phase bar; `compact` tile.
- `oven-curve-card`: temperature and flap of the current burn with stage markers; `compact`
  sparkline.
- `oven-status-card`: status row with the configured burn curve; `compact` single row.
- `oven-badge`: temperature, phase, flap, door or alarm.
- Visual editors; entities are found through the selected device.
- Phase mapping from a full live burn (kindling, heating up, S2–S5 = raw phases 3–6, end);
  reads the text phase sensor of Oven Control 0.3.0 as well as the older numeric one.
- Demo page (`make serve`) that replays that burn.
