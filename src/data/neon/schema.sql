-- DRAFT — NOT APPLIED ANYWHERE.
-- The persistence schema and tenancy enforcement are open decisions in the
-- (unapproved) stakeholder brief. This draft exists only to seed that
-- discussion; approve it before applying to a dedicated M-T467-V2 Neon project.

create table if not exists projects (
  tenant_id          text not null,
  id                 text not null,
  demo               boolean not null default false,
  name               text not null,
  currency           text not null,
  period_unit        text not null default 'month',
  unit               text not null,
  horizon_periods    integer not null,
  discount_rate_pct  numeric not null,
  margin_target_pct  numeric,           -- informational only; not a threshold
  revenue            numeric not null,
  land_cost          numeric,
  build_cost         numeric,
  soft_cost          numeric,
  financing_cost     numeric,
  cost_completeness  text not null check (cost_completeness in ('complete', 'incomplete')),
  missing_fields     jsonb,
  source_as_of       date not null,
  primary key (tenant_id, id)
);

create table if not exists scenario_changes (
  tenant_id   text not null,
  id          text not null,
  project_id  text not null,
  name        text not null,
  changes     jsonb not null,           -- input deltas only, never computed results
  primary key (tenant_id, id),
  foreign key (tenant_id, project_id) references projects (tenant_id, id)
);

-- Tenancy enforcement option (pending decision): row-level security with a
-- per-request tenant setting.
-- alter table projects enable row level security;
-- alter table scenario_changes enable row level security;
-- create policy tenant_isolation_projects on projects
--   using (tenant_id = current_setting('app.tenant_id', true));
-- create policy tenant_isolation_scenarios on scenario_changes
--   using (tenant_id = current_setting('app.tenant_id', true));
