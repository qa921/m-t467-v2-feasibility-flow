/* M-T467-V2 feasibility — demo UI.
 * The tenant selector is a SIMULATED context switch (no login, not authentication).
 * All figures come from DEMO fixtures under PROVISIONAL assumptions.
 */
const $ = (sel) => document.querySelector(sel);

const state = {
  tenantId: null,
  tenants: [],
  project: null,
  scenarios: [],
  assumptionsVersion: null,
};

async function api(path) {
  const res = await fetch(path, { headers: { 'x-tenant-id': state.tenantId ?? '' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body;
}

/* Formatting mirrors the shared convention: money 0 decimals, rates 2 decimals. */
function fmtMoney(v, currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
}
function fmtPct(v) {
  return v === null || v === undefined ? '—' : v.toFixed(2) + '%';
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function demoBadge(demo) {
  return demo ? ' <span class="badge demo">DEMO</span>' : '';
}

/* One shared metadata bar — identical fields on every step of the flow. */
function projectMeta(p) {
  return {
    currency: p.currency,
    unit: p.unit,
    periodUnit: 'month',
    sourceAsOf: p.sourceAsOf,
    rounding: { moneyDecimals: 0, rateDecimals: 2 },
    assumptionsVersion: state.assumptionsVersion,
  };
}
function setMetaBar(meta) {
  const el = $('#metaBar');
  if (!meta) {
    el.textContent = '';
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML =
    `<span>Currency: <strong>${esc(meta.currency)}</strong></span>` +
    `<span>Unit: <strong>${esc(meta.unit)}</strong></span>` +
    `<span>Period: <strong>${esc(meta.periodUnit)}</strong></span>` +
    `<span>Source as of: <strong>${esc(meta.sourceAsOf)}</strong></span>` +
    `<span>Rounding: <strong>money ${meta.rounding.moneyDecimals} dec · rates ${meta.rounding.rateDecimals} dec</strong></span>` +
    `<span>Assumptions: <strong>${esc(meta.assumptionsVersion)} (PROVISIONAL)</strong></span>`;
}

function exceptionHtml(ev) {
  return `<div class="exception">
    <strong>Validation exception — no results computed.</strong>
    <ul>${ev.exceptions.map((e) => `<li><code>${esc(e.code)}</code>: ${esc(e.message)}</li>`).join('')}</ul>
  </div>`;
}

/* ---------- Step 1 · Project ---------- */
async function renderProject() {
  setMetaBar(null);
  const projects = await api('/api/projects');
  $('#view').innerHTML = `<h2>1 · Project ${demoBadge(true)}</h2>
    <p><button disabled title="Project creation needs the persistence adapter (dedicated Neon project), which is a pending decision. The demo repository is read-only.">+ New project (pending persistence)</button></p>
    <table class="grid">
      <tr><th></th><th>Project</th><th>Currency</th><th>Horizon</th><th>Cost inputs</th></tr>
      ${projects.map((p) => `<tr>
        <td><button data-id="${esc(p.id)}">Open</button></td>
        <td>${esc(p.name)}${demoBadge(p.demo)}</td>
        <td>${esc(p.currency)}</td>
        <td>${p.horizonPeriods} mo</td>
        <td>${p.costCompleteness === 'incomplete' ? '<span class="badge bad">INCOMPLETE</span>' : '<span class="badge ok">complete</span>'}</td>
      </tr>`).join('')}
    </table>`;
  document.querySelectorAll('#view button[data-id]').forEach((b) => (b.onclick = async () => {
    state.project = await api(`/api/projects/${b.dataset.id}`);
    state.scenarios = await api(`/api/projects/${state.project.id}/scenarios`);
    goto('inputs');
  }));
}

/* ---------- Step 2 · Inputs ---------- */
function renderInputs() {
  const p = state.project;
  if (!p) return renderProject();
  setMetaBar(projectMeta(p));
  const rows = [
    ['revenue', 'Revenue'],
    ['landCost', 'Land cost'],
    ['buildCost', 'Build cost'],
    ['softCost', 'Soft cost'],
    ['financingCost', 'Financing cost'],
  ].map(([f, label]) => {
    const v = p[f];
    const flagged = v === null || v === undefined || (p.missingFields ?? []).includes(f);
    return `<tr class="${flagged ? 'missing' : ''}"><td>${label}</td><td>${v === null || v === undefined ? '—' : fmtMoney(v, p.currency)}</td><td>${flagged ? 'missing / flagged' : ''}</td></tr>`;
  }).join('');
  const notice = p.costCompleteness === 'incomplete'
    ? `<div class="notice"><strong>Incomplete cost inputs.</strong> You can review Inputs, but Baseline, scenarios/sensitivity and Report will display the validation exception instead of results — nothing is fabricated or repaired.</div>`
    : '';
  $('#view').innerHTML = `<h2>2 · Inputs — ${esc(p.name)}${demoBadge(p.demo)}</h2>
    ${notice}
    <table class="kv">${rows}
      <tr><td>Horizon (months)</td><td>${p.horizonPeriods}</td><td></td></tr>
      <tr><td>Discount rate (annual)</td><td>${fmtPct(p.discountRatePct)}</td><td></td></tr>
      <tr><td>Margin target</td><td>${fmtPct(p.marginTargetPct)}</td><td>informational only — not an approved threshold</td></tr>
    </table>
    <p><button id="toBaseline">Continue to Baseline</button></p>`;
  $('#toBaseline').onclick = () => goto('baseline');
}

/* ---------- Step 3 · Baseline ---------- */
async function renderBaseline() {
  const p = state.project;
  if (!p) return renderProject();
  setMetaBar(projectMeta(p));
  const ev = await api(`/api/projects/${p.id}/baseline`);
  if (ev.status === 'validation-exception') {
    $('#view').innerHTML = `<h2>3 · Baseline — ${esc(p.name)}${demoBadge(p.demo)}</h2>${exceptionHtml(ev)}`;
    return;
  }
  const r = ev.results;
  $('#view').innerHTML = `<h2>3 · Baseline — ${esc(p.name)}${demoBadge(p.demo)}</h2>
    <table class="kv">
      <tr><td>Revenue</td><td>${fmtMoney(r.totalRevenue, p.currency)}</td></tr>
      <tr><td>Total cost</td><td>${fmtMoney(r.totalCost, p.currency)}</td></tr>
      <tr><td>Net cashflow</td><td>${fmtMoney(r.netCashflow, p.currency)}</td></tr>
      <tr><td>Margin</td><td>${fmtPct(r.marginPct)} <span class="fine">(target, informational: ${fmtPct(r.marginTargetPctInfo)})</span></td></tr>
      <tr><td>NPV</td><td>${fmtMoney(r.npv, p.currency)}</td></tr>
      <tr><td>IRR (annualised)</td><td>${fmtPct(r.irrAnnualPct)}</td></tr>
    </table>
    <details><summary>Monthly cashflow (provisional linear distribution)</summary>
      <table class="grid"><tr><th>Month</th><th>Revenue</th><th>Cost</th><th>Net</th></tr>
      ${r.monthlyCashflow.map((m) => `<tr><td>M${m.period}</td><td>${fmtMoney(m.revenue, p.currency)}</td><td>${fmtMoney(m.cost, p.currency)}</td><td>${fmtMoney(m.net, p.currency)}</td></tr>`).join('')}
      </table>
    </details>`;
}

/* ---------- Step 4 · Scenarios & sensitivity ---------- */
async function renderScenarios() {
  const p = state.project;
  if (!p) return renderProject();
  setMetaBar(projectMeta(p));
  const [items, sens, goal] = await Promise.all([
    Promise.all(state.scenarios.map(async (s) => ({ s, ev: await api(`/api/projects/${p.id}/scenarios/${s.id}/evaluation`) }))),
    api(`/api/projects/${p.id}/sensitivity`),
    api(`/api/projects/${p.id}/goal-seek`),
  ]);

  const cards = items.map(({ s, ev }) => {
    const changes = Object.entries(s.changes)
      .map(([k, v]) => `<li><code>${esc(k)}</code>: ${v > 0 ? '+' : ''}${v}</li>`)
      .join('');
    const body = ev.status === 'validation-exception'
      ? exceptionHtml(ev)
      : `<table class="kv">
          <tr><td>Margin</td><td>${fmtPct(ev.results.marginPct)}</td></tr>
          <tr><td>NPV</td><td>${fmtMoney(ev.results.npv, p.currency)}</td></tr>
          <tr><td>IRR (annualised)</td><td>${fmtPct(ev.results.irrAnnualPct)}</td></tr>
          <tr><td>Net cashflow</td><td>${fmtMoney(ev.results.netCashflow, p.currency)}</td></tr>
        </table>`;
    return `<div class="card"><h3>${esc(s.name)}</h3><ul class="changes">${changes}</ul>${body}</div>`;
  }).join('');

  const sensHtml = sens.status === 'validation-exception'
    ? exceptionHtml(sens)
    : `<table class="grid">
        <tr><th>Driver</th><th>Change</th><th>Margin</th><th>NPV</th></tr>
        ${sens.rows.map((r) => `<tr><td>${esc(r.driver)}</td><td>${r.change > 0 ? '+' : ''}${r.change}${r.driver === 'discountRatePct' ? ' pts' : '%'}</td><td>${fmtPct(r.marginPct)}</td><td>${fmtMoney(r.npv, p.currency)}</td></tr>`).join('')}
      </table>`;

  const goalHtml = goal.status === 'validation-exception'
    ? exceptionHtml(goal)
    : goal.feasible
      ? `<p>Current margin: <strong>${fmtPct(goal.currentMarginPct)}</strong> · target (informational): <strong>${fmtPct(goal.targetMarginPct)}</strong></p>
         <p>Revenue needed at current costs: <strong>${fmtMoney(goal.requiredRevenue, p.currency)}</strong> (${goal.requiredRevenueChangePct > 0 ? '+' : ''}${fmtPct(goal.requiredRevenueChangePct)})</p>
         <p class="fine">Provisional analysis — the target is not an approved threshold and this is not a recommendation.</p>`
      : `<p>Not solvable: ${esc(goal.reason)}</p>`;

  $('#view').innerHTML = `<h2>4 · Scenarios &amp; sensitivity — ${esc(p.name)}${demoBadge(p.demo)}</h2>
    <div class="cards">${cards}</div>
    <h3>Sensitivity (provisional, one-way)</h3>${sensHtml}
    <h3>Margin goal-seek (provisional, informational)</h3><div class="card">${goalHtml}</div>`;
}

/* ---------- Step 5 · Report ---------- */
async function renderReport() {
  const p = state.project;
  if (!p) return renderProject();
  setMetaBar(projectMeta(p));
  const rep = await api(`/api/projects/${p.id}/report`);
  const block = (label, ev) => ev.status === 'validation-exception'
    ? `<h3>${esc(label)}</h3>${exceptionHtml(ev)}`
    : `<h3>${esc(label)}</h3>
       <table class="kv">
         <tr><td>Margin</td><td>${fmtPct(ev.results.marginPct)}</td></tr>
         <tr><td>NPV</td><td>${fmtMoney(ev.results.npv, rep.currency)}</td></tr>
         <tr><td>IRR (annualised)</td><td>${fmtPct(ev.results.irrAnnualPct)}</td></tr>
         <tr><td>Net cashflow</td><td>${fmtMoney(ev.results.netCashflow, rep.currency)}</td></tr>
       </table>`;
  const goal = rep.goalSeek;
  const goalHtml = goal.status === 'validation-exception'
    ? exceptionHtml(goal)
    : goal.feasible
      ? `<p>Target margin (informational): <strong>${fmtPct(goal.targetMarginPct)}</strong> · required revenue at current costs: <strong>${fmtMoney(goal.requiredRevenue, rep.currency)}</strong> (${goal.requiredRevenueChangePct > 0 ? '+' : ''}${fmtPct(goal.requiredRevenueChangePct)})</p>`
      : `<p>Goal-seek not solvable: ${esc(goal.reason)}</p>`;
  $('#view').innerHTML = `<div class="report">
    <div class="watermark">DEMO · PROVISIONAL ASSUMPTIONS ${esc(rep.assumptions.version)}</div>
    <h2>5 · Report — ${esc(rep.project.name)}${demoBadge(rep.demo)}</h2>
    <p class="fine">Generated ${esc(rep.generatedAt)} · tenant ${esc(rep.project.tenantId)} · currency ${esc(rep.currency)} · unit ${esc(rep.unit)} · period ${esc(rep.periodUnit)} · source as of ${esc(rep.sourceAsOf)}</p>
    <p class="fine">Affordability: ${esc(rep.affordability.status)} (no approved formula — not computed). Margin target is informational only, not a rule.</p>
    ${block('Baseline', rep.baseline)}
    ${rep.scenarios.map(({ scenario, evaluation }) => block(`Scenario: ${scenario.name}`, evaluation)).join('')}
    <h3>Margin goal-seek (provisional, informational)</h3>${goalHtml}
    <details><summary>Assumption set ${esc(rep.assumptions.version)} (${esc(rep.assumptions.status)})</summary>
      <ul>${rep.assumptions.items.map((a) => `<li><strong>${esc(a.id)}</strong> [${esc(a.status)}] — ${esc(a.summary)}</li>`).join('')}</ul>
    </details>
  </div>`;
}

/* ---------- Navigation & init ---------- */
const renderers = {
  project: renderProject,
  inputs: renderInputs,
  baseline: renderBaseline,
  scenarios: renderScenarios,
  report: renderReport,
};

function goto(step) {
  document.querySelectorAll('#steps button').forEach((b) => b.classList.toggle('active', b.dataset.step === step));
  Promise.resolve(renderers[step]()).catch((err) => {
    $('#view').innerHTML = `<div class="exception">${esc(err.message)}</div>`;
  });
}

async function init() {
  state.tenants = await api('/api/tenants');
  const sel = $('#tenantSelect');
  sel.innerHTML = state.tenants.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  state.tenantId = state.tenants[0];
  sel.onchange = () => {
    state.tenantId = sel.value;
    state.project = null;
    state.scenarios = [];
    goto('project');
  };
  const a = await api('/api/assumptions');
  state.assumptionsVersion = a.version;
  $('#assumptionBanner').innerHTML = `Assumption set <code>${esc(a.version)}</code> — <strong>${esc(a.status)}</strong>.
    <details><summary>View provisional assumptions</summary>
      <ul>${a.assumptions.map((x) => `<li><strong>${esc(x.id)}</strong> — ${esc(x.summary)}</li>`).join('')}</ul>
    </details>`;
  document.querySelectorAll('#steps button').forEach((b) => (b.onclick = () => goto(b.dataset.step)));
  goto('project');
}

init().catch((err) => {
  $('#view').innerHTML = `<div class="exception">Failed to load: ${esc(err.message)}</div>`;
});
