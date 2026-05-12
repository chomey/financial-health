/**
 * Canadian flowchart steps builder — thin wrapper around buildCASteps.
 *
 * The heavy step authoring (titles, completion logic, detail text) lives in
 * `src/lib/flowchart-steps.ts`. This plugin exposes the CA builder through
 * the country registry so library consumers can dispatch via
 * `getCountry(country).flowchartSteps.build(state, isRetired)`.
 */

import type { FlowchartStepsBuilder } from "@/lib/countries/types";
import { buildCASteps, inferData } from "@/lib/flowchart-steps";

export const canadianFlowchartSteps: FlowchartStepsBuilder = {
  build(state, isRetired) {
    return buildCASteps(inferData(state, isRetired));
  },
};
