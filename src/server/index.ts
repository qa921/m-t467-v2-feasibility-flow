import { createApp } from './app.js';
import { ASSUMPTION_SET_VERSION } from '../engine/engine.js';

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`M-T467-V2 feasibility app (DEMO fixture data) on http://localhost:${port}`);
  console.log(`Assumption set ${ASSUMPTION_SET_VERSION}: PROVISIONAL, not approved rules.`);
});
