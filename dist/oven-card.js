/*
 * Oven Card – dashboard cards and a badge for the Oven Control integration
 * (https://github.com/MichScha/oven-control).
 *
 * Elements:
 *   custom:oven-window-card  – stove window with flame, flap and phase bar (compact: tile)
 *   custom:oven-curve-card   – temperature curve of the current burn (compact: sparkline)
 *   custom:oven-status-card  – status row with the configured burn curve (compact: one row)
 *   custom:oven-badge        – badge for temperature, phase, flap, door or alarm
 *
 * All elements take a `device` (device id of the stove) and find the entities of the
 * integration on that device by their translation keys, so entity ids do not matter.
 * Plain web components, no dependencies, no build step.
 */

const VERSION = "0.1.0";
const DOMAIN = "oven_control";
const PHASE_ORDER = [1, 2, 3, 4, 5, 8];

const STRINGS = {
  en: {
    oven: "Stove", off: "Off", start: "Kindling", stage: "Stage", end: "End", phase: "Phase",
    flame: "Flame temperature", flap: "Air flap", duration: "Burn duration", door: "Door",
    open: "open", closed: "closed", relay: "Relay", on: "on", relay_off: "off",
    heating_error: "Heating error – start temperature TS not reached",
    flame_sensor_error: "Flame sensor error", boiler_overheat: "Boiler overheat",
    buffer_top_overheat: "Buffer overheat", alarm: "Alarm", no_alarm: "none",
    burn_curve: "Burn curve", until_ts: "until TS", from_ts: "from TS", hide: "Hide burn curve",
    show: "Show burn curve", temperature: "Temperature", cold: "Cold", no_device:
      "No stove found. Select the device of the Oven Control integration.",
    hours: "h", device: "Stove device", compact: "Compact", name: "Name", hours_to_show: "Hours to show",
    show_curve: "Show burn curve", badge_show: "Shows", hide_inactive: "Hide when inactive",
  },
  de: {
    oven: "Kaminofen", off: "Aus", start: "Anheizen", stage: "Stufe", end: "Ende", phase: "Phase",
    flame: "Flammentemperatur", flap: "Klappe", duration: "Brenndauer", door: "Tür",
    open: "offen", closed: "zu", relay: "Relais", on: "an", relay_off: "aus",
    heating_error: "Heizfehler – Starttemperatur TS wurde nicht erreicht",
    flame_sensor_error: "Flammenfühler gestört", boiler_overheat: "Kessel überhitzt",
    buffer_top_overheat: "Puffer überhitzt", alarm: "Alarm", no_alarm: "keiner",
    burn_curve: "Brennkurve", until_ts: "bis TS", from_ts: "ab TS", hide: "Brennkurve ausblenden",
    show: "Brennkurve anzeigen", temperature: "Temperatur", cold: "Kalt", no_device:
      "Kein Ofen gefunden. Bitte das Gerät der Oven-Control-Integration auswählen.",
    hours: "h", device: "Ofen-Gerät", compact: "Kompakt", name: "Name", hours_to_show: "Angezeigte Stunden",
    show_curve: "Brennkurve anzeigen", badge_show: "Zeigt", hide_inactive: "Ausblenden, wenn inaktiv",
  },
};

const ICONS = {
  flame: "M13.5 .67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z",
  door: "M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-4-6h-2v-2h2v2z",
  fan: "M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2m.5-9c4.5 0 4.6 3.57 2.25 4.75-.99.49-1.43 1.54-1.62 2.47.48.2.9.51 1.22.91 3.7-2 7.68-1.21 7.68 2.37 0 4.5-3.57 4.6-4.75 2.23-.5-.99-1.56-1.43-2.49-1.62-.2.48-.51.89-.91 1.23 1.99 3.69 1.2 7.66-2.37 7.66-4.5 0-4.59-3.58-2.24-4.76.98-.49 1.42-1.53 1.62-2.45-.49-.2-.92-.52-1.24-.92C5.96 15.85 2 15.07 2 11.5 2 7 5.56 6.89 6.74 9.26c.5.99 1.55 1.42 2.47 1.61.19-.48.51-.9.92-1.22C8.15 5.96 8.94 2 12.5 2Z",
  alert: "M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2 1 21Z",
  valve: "M4 22H2V2h2v20m18-11h-4.18A3 3 0 0 0 15 9a3 3 0 0 0-2.82 2H8V9H6v6h2v-2h4.18A3 3 0 0 0 15 15a3 3 0 0 0 2.82-2H22v-2Z",
};
const svgIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${ICONS[name]}"/></svg>`;

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

function lang(hass) {
  const l = (hass?.locale?.language || hass?.language || "en").slice(0, 2);
  return STRINGS[l] ? l : "en";
}
function tr(hass, key) {
  return STRINGS[lang(hass)][key] ?? STRINGS.en[key] ?? key;
}

/** Device ids that have entities of the integration. */
function ovenDevices(hass) {
  const ids = new Set();
  for (const e of Object.values(hass?.entities || {})) {
    if (e.platform === DOMAIN && e.device_id) ids.add(e.device_id);
  }
  return [...ids];
}

/** Map "domain.translation_key" -> entity_id for the entities of one device. */
function entityMap(hass, deviceId) {
  const map = {};
  for (const e of Object.values(hass?.entities || {})) {
    if (e.platform !== DOMAIN || e.device_id !== deviceId || !e.translation_key) continue;
    map[`${e.entity_id.split(".")[0]}.${e.translation_key}`] = e.entity_id;
  }
  return map;
}

function num(hass, id) {
  const v = parseFloat(hass.states[id]?.state);
  return Number.isFinite(v) ? v : null;
}
const isOn = (hass, id) => hass.states[id]?.state === "on";

/** Read everything the cards need from the states of one device. */
function readOven(hass, map) {
  const id = (k) => map[k];
  const phase = num(hass, id("sensor.phase"));
  const errors = ["heating_error", "flame_sensor_error", "boiler_overheat", "buffer_top_overheat"]
    .filter((k) => id(`binary_sensor.${k}`) && isOn(hass, id(`binary_sensor.${k}`)));
  return {
    ids: {
      temp: id("sensor.flame_temperature"), flap: id("sensor.flap"), phase: id("sensor.phase"),
      duration: id("sensor.burn_duration"), door: id("binary_sensor.door"),
      relay: id("binary_sensor.relay"), latestAlarm: id("sensor.latest_alarm"),
    },
    available: !!id("sensor.flame_temperature") && hass.states[id("sensor.flame_temperature")]?.state !== "unavailable",
    temp: num(hass, id("sensor.flame_temperature")),
    flap: num(hass, id("sensor.flap")),
    phase,
    duration: num(hass, id("sensor.burn_duration")),
    door: isOn(hass, id("binary_sensor.door")),
    relay: isOn(hass, id("binary_sensor.relay")),
    errors,
    burning: phase !== null && phase >= 1 && phase <= 5,
    params: {
      ts: num(hass, id("number.start_temp")),
      flap2: num(hass, id("number.flap2")), flap3: num(hass, id("number.flap3")),
      flap4: num(hass, id("number.flap4")), flap5: num(hass, id("number.flap5")),
      temp3: num(hass, id("number.temp3")), temp4: num(hass, id("number.temp4")),
      temp5: num(hass, id("number.temp5")), szv: num(hass, id("number.close_timeout")),
    },
  };
}

function phaseLabel(hass, phase, short = false) {
  if (phase === null) return "–";
  if (phase === 0) return tr(hass, "off");
  if (phase === 1) return tr(hass, "start");
  if (phase >= 2 && phase <= 5) return short ? `S${phase}` : `${tr(hass, "stage")} ${phase}`;
  if (phase === 8) return tr(hass, "end");
  return `${tr(hass, "phase")} ${phase}`;
}
const fmtDuration = (min) => (min === null ? "–" : `${Math.floor(min / 60)}:${String(Math.round(min) % 60).padStart(2, "0")} h`);
const fmtTemp = (t) => (t === null ? "–" : `${Math.round(t)}`);
const tempColor = (t) => (t === null || t < 100 ? "var(--oven-cold, #90a4ae)" : t < 300 ? "#ffb300" : t < 650 ? "#f4511e" : "#c62828");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function flamePath(cx, base, w, h) {
  return `M ${cx} ${base - h} C ${cx + w * 0.25} ${base - h * 0.6}, ${cx + w * 0.6} ${base - h * 0.45}, ${cx + w * 0.5} ${base - h * 0.18}
    C ${cx + w * 0.45} ${base}, ${cx - w * 0.45} ${base}, ${cx - w * 0.5} ${base - h * 0.18}
    C ${cx - w * 0.55} ${base - h * 0.45}, ${cx - w * 0.1} ${base - h * 0.55}, ${cx} ${base - h} Z`;
}

/** SVG of the stove; `uid` keeps gradient ids unique per card. */
function stoveSvg(d, uid) {
  const k = d.temp === null ? 0 : Math.max(0, Math.min(1, (d.temp - 40) / 680));
  const h = 12 + 80 * k, w = 26 + 40 * k, lit = d.temp !== null && d.temp >= 45;
  const flapW = Math.max(10, (74 * (d.flap ?? 0)) / 100);
  return `<svg class="stove" viewBox="0 0 150 190" role="img" aria-label="${esc(fmtTemp(d.temp))} °C">
    <defs>
      <radialGradient id="g${uid}" cx="50%" cy="80%" r="70%"><stop offset="0%" stop-color="#ff9a3c" stop-opacity=".9"/><stop offset="100%" stop-color="#ff6d1f" stop-opacity="0"/></radialGradient>
      <linearGradient id="o${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ff5a1a"/><stop offset="100%" stop-color="#ffb02e"/></linearGradient>
      <linearGradient id="i${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ffd23f"/><stop offset="100%" stop-color="#fff3b0"/></linearGradient>
      <clipPath id="c${uid}"><rect x="30" y="44" width="90" height="100" rx="10"/></clipPath>
    </defs>
    <rect x="62" y="0" width="26" height="30" rx="3" fill="#455a64"/>
    <rect x="14" y="24" width="122" height="150" rx="16" fill="#37474f"/>
    <rect x="24" y="170" width="18" height="18" rx="3" fill="#37474f"/>
    <rect x="108" y="170" width="18" height="18" rx="3" fill="#37474f"/>
    <g clip-path="url(#c${uid})">
      <rect x="30" y="44" width="90" height="100" fill="#1d2326"/>
      <ellipse cx="75" cy="140" rx="70" ry="60" fill="url(#g${uid})" opacity="${k}"/>
      ${lit ? `<g class="flame"><path d="${flamePath(75, 134, w, h)}" fill="url(#o${uid})"/><path d="${flamePath(74, 134, w * 0.55, h * 0.6)}" fill="url(#i${uid})"/></g>` : ""}
      <rect x="40" y="132" width="70" height="8" rx="3" fill="#6d3b1c"/>
      ${d.door ? `<rect x="30" y="44" width="90" height="100" fill="#fff" opacity=".25"/>` : ""}
    </g>
    <rect x="30" y="44" width="90" height="100" rx="10" fill="none" stroke="#90a4ae" stroke-width="3"/>
    <rect x="38" y="152" width="74" height="10" rx="5" fill="#263238"/>
    <rect x="38" y="152" width="${flapW}" height="10" rx="5" fill="#80cbc4"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Shared base
// ---------------------------------------------------------------------------

const BASE_CSS = `
  :host { display: block; }
  ha-card { padding: 16px; overflow: hidden; height: 100%; box-sizing: border-box; }
  .muted { color: var(--secondary-text-color); }
  .title { font-size: 16px; font-weight: 500; }
  .row { display: flex; align-items: center; gap: 8px; }
  .big { font-size: 44px; font-weight: 300; line-height: 1; letter-spacing: -1px; }
  .big small { font-size: 18px; color: var(--secondary-text-color); margin-left: 2px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px;
    background: var(--secondary-background-color); font-size: 12.5px; white-space: nowrap; }
  .chip.warn { background: color-mix(in srgb, var(--warning-color, #f9a825) 18%, transparent); color: var(--warning-color, #c17900); }
  .chip.err { background: color-mix(in srgb, var(--error-color) 15%, transparent); color: var(--error-color); font-weight: 600; }
  .alert { margin-top: 12px; padding: 8px 12px; border-radius: 8px; color: var(--error-color);
    background: color-mix(in srgb, var(--error-color) 12%, transparent); font-weight: 500; }
  .clickable { cursor: pointer; }
  .flame { transform-origin: 50% 100%; transform-box: fill-box; animation: flicker 1.6s ease-in-out infinite; }
  @keyframes flicker { 0%,100% { transform: scale(1,1) skewX(0); } 25% { transform: scale(.97,1.04) skewX(1.5deg); }
    50% { transform: scale(1.02,.97) skewX(-1deg); } 75% { transform: scale(.98,1.02) skewX(1deg); } }
  .icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; flex: none; }
  .icon svg { width: 26px; height: 26px; }
  .icon.burning { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--glow) 55%, transparent); }
    50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--glow) 0%, transparent); } }
  @media (prefers-reduced-motion: reduce) { .flame, .icon.burning { animation: none; } }
`;

let uidCounter = 0;

class OvenBaseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._uid = `oc${++uidCounter}`;
    this._signature = "";
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this._signature = "";
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  get _deviceId() {
    return this._config?.device || ovenDevices(this._hass)[0];
  }

  _update() {
    if (!this._config || !this._hass) return;
    const deviceId = this._deviceId;
    const map = deviceId ? entityMap(this._hass, deviceId) : {};
    // Only re-render when one of our entities changed.
    const signature = JSON.stringify([this._config, lang(this._hass), Object.values(map).map((id) => this._hass.states[id]?.state)]);
    if (signature === this._signature) return;
    this._signature = signature;
    if (!map["sensor.flame_temperature"]) {
      this._renderShell(`<div class="muted">${esc(tr(this._hass, "no_device"))}</div>`);
      return;
    }
    this._data = readOven(this._hass, map);
    this._map = map;
    this.render(this._data);
  }

  _renderShell(body, css = "") {
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}${css}</style><ha-card>${body}</ha-card>`;
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
  }

  _bindMoreInfo() {
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((el) =>
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._moreInfo(el.dataset.entity);
      }));
  }

  _errorBox(d) {
    return d.errors.map((k) => `<div class="alert">⚠ ${esc(tr(this._hass, k))}</div>`).join("");
  }

  _name(d) {
    return esc(this._config.name ?? tr(this._hass, "oven"));
  }

  getCardSize() {
    return this._config?.compact ? 2 : 5;
  }

  static getStubConfig(hass) {
    const device = ovenDevices(hass)[0];
    return device ? { device } : {};
  }

  static _baseSchema(extra = []) {
    return [
      { name: "device", selector: { device: { filter: { integration: DOMAIN } } } },
      { name: "name", selector: { text: {} } },
      { name: "compact", selector: { boolean: {} } },
      ...extra,
    ];
  }

  static getConfigForm() {
    return {
      schema: this._baseSchema(),
      computeLabel: (schema) => STRINGS[document.documentElement.lang?.slice(0, 2)]?.[schema.name] ?? STRINGS.en[schema.name],
    };
  }
}

// ---------------------------------------------------------------------------
// A: stove window
// ---------------------------------------------------------------------------

class OvenWindowCard extends OvenBaseCard {
  render(d) {
    const h = this._hass;
    const idx = PHASE_ORDER.indexOf(d.phase);
    if (this._config.compact) {
      const bar = PHASE_ORDER.map((p, i) => `<i class="${i === idx ? "now" : i < idx ? "done" : ""}"></i>`).join("");
      this._renderShell(`
        <div class="mini clickable" data-entity="${d.ids.temp}">
          ${stoveSvg(d, this._uid)}
          <div>
            <div class="t"><span style="color:${tempColor(d.temp)}">${fmtTemp(d.temp)}</span><small> °C</small></div>
            <div class="s">${esc(phaseLabel(h, d.phase))} · ${fmtTemp(d.flap)} %</div>
            <div class="bar">${bar}</div>
          </div>
          ${d.errors.length ? `<div class="err-dot" title="${esc(d.errors.map((k) => tr(h, k)).join(", "))}"></div>` : ""}
        </div>`, MINI_WINDOW_CSS);
    } else {
      const steps = PHASE_ORDER.map((p, i) => {
        const cls = i === idx ? (p === 8 ? "now stop" : "now") : i < idx ? "done" : "";
        return `<div class="step ${cls}"><i></i>${esc(p === 1 ? tr(h, "start") : p === 8 ? tr(h, "end") : `S${p}`)}</div>`;
      }).join("");
      this._renderShell(`
        <div class="row" style="justify-content: space-between">
          <div class="title">${this._name(d)}</div>
          <div class="row" style="gap: 6px">
            <span class="chip clickable ${d.door ? "warn" : ""}" data-entity="${d.ids.door ?? ""}">${esc(tr(h, "door"))} ${esc(tr(h, d.door ? "open" : "closed"))}</span>
            <span class="chip clickable" data-entity="${d.ids.relay ?? ""}">${esc(tr(h, "relay"))} ${esc(tr(h, d.relay ? "on" : "relay_off"))}</span>
          </div>
        </div>
        <div class="grid">
          ${stoveSvg(d, this._uid)}
          <div>
            <div class="big clickable" data-entity="${d.ids.temp}" style="color:${tempColor(d.temp)}">${fmtTemp(d.temp)}<small>°C</small></div>
            <div class="muted" style="margin-top: 4px">${esc(tr(h, "flame"))}</div>
            <div class="facts">
              <span class="muted">${esc(tr(h, "phase"))}</span><b class="clickable" data-entity="${d.ids.phase}">${esc(phaseLabel(h, d.phase))}</b>
              <span class="muted">${esc(tr(h, "flap"))}</span><span class="clickable" data-entity="${d.ids.flap}">${fmtTemp(d.flap)} %</span>
              <span class="muted">${esc(tr(h, "duration"))}</span><span class="clickable" data-entity="${d.ids.duration}">${fmtDuration(d.duration)}</span>
            </div>
          </div>
        </div>
        <div class="stepper">${steps}</div>
        ${this._errorBox(d)}`, WINDOW_CSS);
    }
    this._bindMoreInfo();
  }

  getGridOptions() {
    return this._config?.compact
      ? { columns: 4, rows: 3, min_columns: 3, min_rows: 3 }
      : { columns: 12, rows: "auto", min_columns: 6 };
  }
}

const WINDOW_CSS = `
  .grid { display: grid; grid-template-columns: 150px 1fr; gap: 16px; align-items: center; margin-top: 12px; }
  .stove { width: 150px; height: 190px; }
  .facts { margin-top: 14px; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; }
  .stepper { display: flex; gap: 4px; margin-top: 14px; }
  .step { flex: 1; text-align: center; font-size: 11px; color: var(--secondary-text-color); }
  .step i { display: block; height: 6px; border-radius: 3px; background: var(--divider-color); margin-bottom: 4px; }
  .step.done i { background: color-mix(in srgb, #ff6d1f 45%, var(--divider-color)); }
  .step.now i { background: #ff6d1f; box-shadow: 0 0 8px #ff6d1f; }
  .step.now { color: var(--primary-text-color); font-weight: 600; }
  .step.stop i { background: var(--state-icon-color, #546e7a); box-shadow: none; }
`;
const MINI_WINDOW_CSS = `
  ha-card { padding: 12px; }
  .mini { display: grid; grid-template-rows: 1fr auto; height: 100%; position: relative; }
  .stove { width: 74px; height: 92px; justify-self: center; }
  .t { font-size: 26px; line-height: 1.1; } .t small { font-size: 13px; color: var(--secondary-text-color); }
  .s { font-size: 12px; color: var(--secondary-text-color); }
  .bar { display: flex; gap: 2px; margin-top: 6px; }
  .bar i { flex: 1; height: 4px; border-radius: 2px; background: var(--divider-color); }
  .bar i.done { background: color-mix(in srgb, #ff6d1f 45%, var(--divider-color)); }
  .bar i.now { background: #ff6d1f; }
  .err-dot { position: absolute; top: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--error-color); }
`;

// ---------------------------------------------------------------------------
// B: burn curve
// ---------------------------------------------------------------------------

class OvenCurveCard extends OvenBaseCard {
  constructor() {
    super();
    this._history = null;
    this._historyFetched = 0;
    this._historyKey = "";
  }

  get _hours() {
    return Number(this._config?.hours_to_show) || 4;
  }

  async _loadHistory(d) {
    const key = `${d.ids.temp}|${this._hours}`;
    const now = Date.now();
    if (this._loading || (key === this._historyKey && now - this._historyFetched < 60000)) return;
    this._loading = true;
    try {
      const start = new Date(now - this._hours * 3600000).toISOString();
      const ids = [d.ids.temp, d.ids.flap, d.ids.phase].filter(Boolean);
      const result = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start,
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      const series = (id) => (result[id] || [])
        .map((p) => ({ t: (p.lu ?? p.lc) * 1000, v: parseFloat(p.s) }))
        .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.t));
      this._history = { temp: series(d.ids.temp), flap: series(d.ids.flap), phase: series(d.ids.phase) };
      this._historyKey = key;
      this._historyFetched = now;
    } catch (err) {
      this._history = this._history || { temp: [], flap: [], phase: [] };
    } finally {
      this._loading = false;
    }
    this._signature = "";
    this._update();
  }

  /** Series with the current live value appended. */
  _series(d) {
    const h = this._history || { temp: [], flap: [], phase: [] };
    const now = Date.now();
    const add = (arr, v) => (v === null ? arr : [...arr, { t: now, v }]);
    return { temp: add(h.temp, d.temp), flap: add(h.flap, d.flap), phase: add(h.phase, d.phase), now };
  }

  render(d) {
    this._loadHistory(d);
    const h = this._hass;
    const s = this._series(d);
    const from = s.now - this._hours * 3600000;
    if (this._config.compact) {
      this._renderShell(`
        <div class="mini clickable" data-entity="${d.ids.temp}">
          <div>
            <div class="t">${fmtTemp(d.temp)}<small> °C</small></div>
            <div class="s">${esc(phaseLabel(h, d.phase))}${d.errors.length ? ` · <span style="color:var(--error-color)">${esc(tr(h, d.errors[0]).split(" –")[0])}</span>` : ""}<br>${fmtTemp(d.flap)} % · ${fmtDuration(d.duration)}</div>
          </div>
          ${this._chart(s, from, 180, 70, true)}
        </div>`, MINI_CURVE_CSS);
    } else {
      const chips = [
        `<span class="chip">🔥 ${esc(phaseLabel(h, d.phase))}</span>`,
        `<span class="chip">${esc(tr(h, "flap"))} ${fmtTemp(d.flap)} %</span>`,
        `<span class="chip">⏱ ${fmtDuration(d.duration)}</span>`,
        d.door ? `<span class="chip warn">${esc(tr(h, "door"))} ${esc(tr(h, "open"))}</span>` : "",
      ].join("");
      this._renderShell(`
        <div class="head">
          <div>
            <div class="title">${this._name(d)}</div>
            <div class="big clickable" data-entity="${d.ids.temp}" style="margin-top: 6px">${fmtTemp(d.temp)}<small>°C</small></div>
          </div>
          <div class="chips">${chips}</div>
        </div>
        ${this._chart(s, from, 360, 170, false)}
        <div class="legend muted"><span><span style="color:#ff6d1f">━</span> ${esc(tr(h, "temperature"))} &nbsp;<span style="color:#5c9fd6">┅</span> ${esc(tr(h, "flap"))}</span></div>
        ${this._errorBox(d)}`, CURVE_CSS);
    }
    this._bindMoreInfo();
  }

  _chart(s, from, W, H, mini) {
    const L = mini ? 2 : 34, R = mini ? 2 : 30, T = mini ? 4 : 22, B = mini ? 4 : 22;
    const maxT = Math.max(400, Math.ceil(Math.max(...s.temp.map((p) => p.v), 0) / 200) * 200);
    const span = s.now - from;
    const x = (t) => L + ((W - L - R) * (Math.max(t, from) - from)) / span;
    const y = (v) => T + (H - T - B) * (1 - v / maxT);
    const yf = (v) => T + (H - T - B) * (1 - v / 100);
    let out = "";
    if (!mini) {
      for (let v = 0; v <= maxT; v += 200) {
        out += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--divider-color)"/>
          <text x="${L - 6}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="var(--secondary-text-color)">${v}</text>`;
      }
      for (const f of [0, 50, 100]) {
        out += `<text x="${W - R + 4}" y="${yf(f) + 4}" font-size="10" fill="#5c9fd6">${f}%</text>`;
      }
      const hours = Math.round(span / 3600000);
      for (let i = 0; i <= hours; i++) {
        const t = from + i * 3600000;
        const label = new Date(t).toLocaleTimeString(this._hass.locale?.language || undefined, { hour: "2-digit", minute: "2-digit" });
        out += `<text x="${x(t)}" y="${H - 6}" font-size="10" text-anchor="middle" fill="var(--secondary-text-color)">${label}</text>`;
      }
    }
    // Step paths: values hold until the next change.
    const stepPath = (arr, fy) => {
      const pts = arr.filter((p) => p.t >= from - 6 * 3600000);
      if (!pts.length) return "";
      let p = "", prev = null;
      for (const pt of pts) {
        const px = x(pt.t), py = fy(pt.v);
        p += prev === null ? `M${px.toFixed(1)},${py.toFixed(1)}` : `L${px.toFixed(1)},${prev.toFixed(1)}L${px.toFixed(1)},${py.toFixed(1)}`;
        prev = py;
      }
      return p;
    };
    const tPath = (() => {
      const pts = s.temp.filter((p) => p.t >= from - 6 * 3600000);
      return pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
    })();
    if (tPath) {
      const lastX = x(s.now);
      out += `<path d="${tPath}L${lastX},${y(0)}L${x(s.temp.find((p) => p.t >= from)?.t ?? from)},${y(0)}Z" fill="#ff6d1f" opacity=".13"/>
        <path d="${tPath}" fill="none" stroke="#ff6d1f" stroke-width="2"/>`;
    }
    if (!mini) {
      const f = stepPath(s.flap, yf);
      if (f) out += `<path d="${f}" fill="none" stroke="#5c9fd6" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    }
    // Stage markers where the phase changes.
    let last = null;
    for (const p of s.phase) {
      if (last !== null && p.v !== last && p.t >= from && p.v >= 2) {
        const flapAt = [...s.flap].reverse().find((q) => q.t <= p.t + 30000)?.v;
        out += `<line x1="${x(p.t)}" x2="${x(p.t)}" y1="${mini ? 2 : T - 6}" y2="${H - B}" stroke="var(--${mini ? "divider" : "secondary-text"}-color)" ${mini ? "" : 'stroke-dasharray="2 3"'}/>`;
        if (!mini) {
          const label = p.v === 8 ? tr(this._hass, "end") : `S${p.v}${flapAt !== undefined ? ` ${Math.round(flapAt)}%` : ""}`;
          out += `<text x="${x(p.t) + 3}" y="${T - 9}" font-size="10" fill="var(--secondary-text-color)">${esc(label)}</text>`;
        }
      }
      last = p.v;
    }
    const cur = s.temp[s.temp.length - 1];
    if (cur) out += `<circle cx="${x(cur.t)}" cy="${y(cur.v)}" r="${mini ? 3 : 4}" fill="#ff6d1f" stroke="var(--card-background-color, #fff)" stroke-width="2"/>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" ${mini ? `height="${H}"` : ""}>${out}</svg>`;
  }

  getGridOptions() {
    return this._config?.compact
      ? { columns: 6, rows: 2, min_columns: 6, min_rows: 2 }
      : { columns: 12, rows: "auto", min_columns: 6 };
  }

  static getConfigForm() {
    const form = super.getConfigForm();
    form.schema = this._baseSchema([{ name: "hours_to_show", selector: { number: { min: 1, max: 24, mode: "box" } } }]);
    return form;
  }
}

const CURVE_CSS = `
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
  .chart { display: block; margin-top: 8px; }
  .legend { font-size: 12.5px; margin-top: 4px; }
`;
const MINI_CURVE_CSS = `
  ha-card { padding: 10px 12px; }
  .mini { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; height: 100%; }
  .t { font-size: 26px; line-height: 1; } .t small { font-size: 13px; color: var(--secondary-text-color); }
  .s { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; white-space: nowrap; }
`;

// ---------------------------------------------------------------------------
// C: status row with burn curve
// ---------------------------------------------------------------------------

class OvenStatusCard extends OvenBaseCard {
  constructor() {
    super();
    this._open = null;
  }

  render(d) {
    const h = this._hass;
    const color = d.errors.length ? "var(--error-color)" : tempColor(d.temp);
    const icon = `<div class="icon ${d.burning ? "burning" : ""}" style="background: color-mix(in srgb, ${color} 18%, transparent); color: ${color}; --glow: ${color}">${svgIcon("flame")}</div>`;
    const sub = d.errors.length
      ? `<span style="color: var(--error-color)">${esc(tr(h, d.errors[0]).split(" –")[0])}</span>`
      : d.phase === 0 || d.phase === null ? esc(tr(h, "cold"))
        : `${esc(tr(h, "flap"))} ${fmtTemp(d.flap)} % · ${fmtDuration(d.duration)}`;
    if (this._config.compact) {
      this._renderShell(`
        <div class="crow clickable" data-entity="${d.ids.temp}">
          ${icon}
          <div><div class="l1">${fmtTemp(d.temp)} °C · ${esc(phaseLabel(h, d.phase))}</div><div class="l2">${sub}</div></div>
          <div class="side">
            <div class="dots"><i class="${d.door ? "door" : ""}"></i><i class="${d.relay ? "relay" : ""}"></i><i class="${d.errors.length ? "err" : ""}"></i></div>
            <div class="flapbar"><i style="width: ${d.flap ?? 0}%"></i></div>
          </div>
        </div>`, MINI_STATUS_CSS);
      this._bindMoreInfo();
      return;
    }
    const open = this._open ?? this._config.show_curve !== false;
    const p = d.params;
    const stages = [
      [1, 100, tr(h, "start"), tr(h, "until_ts")], [2, p.flap2, "S2", tr(h, "from_ts")],
      [3, p.flap3, "S3", `DS3 ${fmtTemp(p.temp3)}%`], [4, p.flap4, "S4", `DS4 ${fmtTemp(p.temp4)}%`],
      [5, p.flap5, "S5", `DS5 ${fmtTemp(p.temp5)}%`],
    ];
    const W = 320, H = 96, bw = W / stages.length;
    let bars = "";
    stages.forEach(([ph, flap, name], i) => {
      const active = d.phase === ph, fh = ((H - 30) * (flap ?? 0)) / 100;
      bars += `<rect x="${i * bw + 4}" y="${H - 18 - fh}" width="${bw - 8}" height="${fh}" rx="5"
          fill="${active ? "#ff6d1f" : "color-mix(in srgb, #5c9fd6 45%, var(--divider-color))"}"/>
        <text x="${i * bw + bw / 2}" y="${H - 22 - fh}" font-size="11" text-anchor="middle" fill="var(--primary-text-color)">${fmtTemp(flap)}%</text>
        <text x="${i * bw + bw / 2}" y="${H - 5}" font-size="10.5" text-anchor="middle" fill="var(--${active ? "primary" : "secondary"}-text-color)" font-weight="${active ? 600 : 400}">${esc(name)}</text>`;
    });
    const params = stages.map(([ph, , name, cond]) =>
      `<div class="param ${d.phase === ph ? "active" : ""}"><b>${esc(name)}</b>${esc(cond)}</div>`).join("");
    this._renderShell(`
      <div class="crow clickable" data-entity="${d.ids.temp}">
        ${icon}
        <div><div class="title">${fmtTemp(d.temp)} °C · ${esc(phaseLabel(h, d.phase))}</div><div class="l2">${sub}</div></div>
        <div class="icons">
          <span class="${d.door ? "on" : ""}" title="${esc(tr(h, "door"))}">${svgIcon("door")}</span>
          <span class="${d.relay ? "on" : ""}" title="${esc(tr(h, "relay"))}">${svgIcon("fan")}</span>
          <span class="${d.errors.length ? "err" : ""}" title="${esc(tr(h, "alarm"))}">${svgIcon("alert")}</span>
        </div>
      </div>
      <div class="details ${open ? "open" : ""}"><div>
        <div class="curve">
          <div class="row" style="justify-content: space-between"><b>${esc(tr(h, "burn_curve"))}</b>
            <span class="muted" style="font-size: 12px">TS <b>${fmtTemp(p.ts)} °C</b>${p.szv !== null ? ` · SZV ${fmtTemp(p.szv)} min` : ""}</span></div>
          <svg viewBox="0 0 ${W} ${H}" width="100%" style="display: block; margin-top: 6px">${bars}</svg>
          <div class="params">${params}</div>
        </div>
      </div></div>
      <div class="toggle">${esc(tr(h, open ? "hide" : "show"))}</div>
      ${this._errorBox(d)}`, STATUS_CSS);
    this._bindMoreInfo();
    this.shadowRoot.querySelector(".toggle").addEventListener("click", () => {
      this._open = !open;
      this._signature = "";
      this._update();
    });
  }

  getCardSize() {
    return this._config?.compact ? 1 : 4;
  }

  getGridOptions() {
    return this._config?.compact
      ? { columns: 6, rows: 1, min_columns: 4, min_rows: 1 }
      : { columns: 12, rows: "auto", min_columns: 6 };
  }

  static getConfigForm() {
    const form = super.getConfigForm();
    form.schema = this._baseSchema([{ name: "show_curve", selector: { boolean: {} } }]);
    return form;
  }
}

const STATUS_CSS = `
  .crow { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
  .l2 { color: var(--secondary-text-color); font-size: 13px; }
  .icons { display: flex; gap: 6px; }
  .icons span { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
    background: var(--secondary-background-color); color: var(--secondary-text-color); }
  .icons span.on { background: color-mix(in srgb, #ff6d1f 18%, transparent); color: #ff6d1f; }
  .icons span.err { background: color-mix(in srgb, var(--error-color) 18%, transparent); color: var(--error-color); }
  .icons svg { width: 18px; height: 18px; }
  .details { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .25s; }
  .details.open { grid-template-rows: 1fr; }
  .details > div { overflow: hidden; }
  .curve { margin-top: 14px; border-top: 1px solid var(--divider-color); padding-top: 12px; }
  .params { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 8px; }
  .param { background: var(--secondary-background-color); border-radius: 8px; padding: 6px; text-align: center; font-size: 12px; }
  .param b { display: block; font-size: 15px; font-weight: 500; }
  .param.active { box-shadow: inset 0 0 0 2px #ff6d1f; }
  .toggle { font-size: 12px; color: var(--secondary-text-color); text-align: center; margin-top: 8px; cursor: pointer; user-select: none; }
`;
const MINI_STATUS_CSS = `
  ha-card { padding: 0 12px; display: flex; align-items: center; min-height: 56px; }
  .crow { display: grid; grid-template-columns: 40px 1fr auto; gap: 10px; align-items: center; width: 100%; }
  .icon { width: 40px; height: 40px; } .icon svg { width: 22px; height: 22px; }
  .l1 { font-weight: 500; } .l2 { font-size: 12px; color: var(--secondary-text-color); }
  .side { display: grid; justify-items: end; gap: 4px; }
  .dots { display: flex; gap: 4px; }
  .dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--divider-color); }
  .dots i.door { background: #f9a825; } .dots i.relay { background: #ff6d1f; } .dots i.err { background: var(--error-color); }
  .flapbar { width: 46px; height: 6px; border-radius: 3px; background: var(--divider-color); overflow: hidden; }
  .flapbar i { display: block; height: 100%; background: #5c9fd6; }
`;

// ---------------------------------------------------------------------------
// D: badge
// ---------------------------------------------------------------------------

const BADGE_KINDS = ["temperature", "phase", "flap", "door", "alarm"];

class OvenBadge extends OvenBaseCard {
  render(d) {
    const h = this._hass;
    const kind = BADGE_KINDS.includes(this._config.show) ? this._config.show : "temperature";
    const hideInactive = this._config.hide_inactive !== false;
    let icon, color, label, value, entity;
    switch (kind) {
      case "phase":
        [icon, color, label, value, entity] = ["flame", "#ffb300", tr(h, "phase"), phaseLabel(h, d.phase), d.ids.phase];
        break;
      case "flap":
        [icon, color, label, value, entity] = ["valve", "#5c9fd6", tr(h, "flap"), `${fmtTemp(d.flap)} %`, d.ids.flap];
        break;
      case "door":
        [icon, color, label, value, entity] = ["door", "#f9a825", tr(h, "door"), tr(h, d.door ? "open" : "closed"), d.ids.door];
        if (!d.door && hideInactive) return this._hide();
        break;
      case "alarm":
        [icon, color, label, value, entity] = ["alert", "var(--error-color)", tr(h, "alarm"),
          d.errors.length ? tr(h, d.errors[0]).split(" –")[0] : tr(h, "no_alarm"), this._map["sensor.latest_alarm"]];
        if (!d.errors.length && hideInactive) return this._hide();
        break;
      default:
        [icon, color, label, value, entity] = ["flame", tempColor(d.temp), this._config.name ?? tr(h, "oven"), `${fmtTemp(d.temp)} °C`, d.ids.temp];
    }
    this.style.display = "";
    this.shadowRoot.innerHTML = `<style>${BADGE_CSS}</style>
      <div class="badge" data-entity="${entity ?? ""}">
        <span class="ic" style="background: color-mix(in srgb, ${color} 18%, transparent); color: ${color}">${svgIcon(icon)}</span>
        <span><div class="lbl">${esc(label)}</div><div class="val">${esc(value)}</div></span>
      </div>`;
    this._bindMoreInfo();
  }

  _hide() {
    this.shadowRoot.innerHTML = "";
    this.style.display = this.preview ? "" : "none";
  }

  _renderShell(body) {
    this.shadowRoot.innerHTML = `<style>${BADGE_CSS}</style><div class="badge"><span class="val">⚠</span></div>`;
  }

  static getConfigForm() {
    const form = super.getConfigForm();
    form.schema = [
      { name: "device", selector: { device: { filter: { integration: DOMAIN } } } },
      { name: "show", selector: { select: { mode: "dropdown", options: BADGE_KINDS } } },
      { name: "name", selector: { text: {} } },
      { name: "hide_inactive", selector: { boolean: {} } },
    ];
    const label = form.computeLabel;
    form.computeLabel = (schema) => (schema.name === "show" ? label({ name: "badge_show" }) : label(schema));
    return form;
  }

  static getStubConfig(hass) {
    return { ...super.getStubConfig(hass), show: "temperature" };
  }
}

const BADGE_CSS = `
  :host { display: inline-block; }
  .badge { display: inline-flex; align-items: center; gap: 8px; height: var(--ha-badge-size, 36px); padding: 0 14px 0 5px;
    border-radius: var(--ha-badge-border-radius, 18px); background: var(--ha-card-background, var(--card-background-color));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color));
    box-sizing: border-box; cursor: pointer; font-size: 13px; }
  .ic { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; }
  .ic svg { width: 16px; height: 16px; }
  .lbl { color: var(--secondary-text-color); font-size: 10px; line-height: 1; }
  .val { font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; }
`;

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const ELEMENTS = [
  ["oven-window-card", OvenWindowCard, "Oven: window", "Stove window with flame, air flap and phase bar. compact: square tile."],
  ["oven-curve-card", OvenCurveCard, "Oven: burn curve", "Temperature and flap of the current burn with stage markers. compact: sparkline."],
  ["oven-status-card", OvenStatusCard, "Oven: status", "Status row with the configured burn curve. compact: one row."],
];
for (const [tag, cls, name, description] of ELEMENTS) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: tag, name, description, preview: true, documentationURL: "https://github.com/MichScha/oven-card" });
}
if (!customElements.get("oven-badge")) customElements.define("oven-badge", OvenBadge);
window.customBadges = window.customBadges || [];
window.customBadges.push({
  type: "oven-badge", name: "Oven", description: "Temperature, phase, flap, door or alarm of the stove.",
  preview: true, documentationURL: "https://github.com/MichScha/oven-card",
});

console.info(`%c OVEN-CARD %c ${VERSION} `, "color: #fff; background: #ff6d1f; font-weight: 700", "color: #ff6d1f; background: #fff");
