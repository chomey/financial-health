/**
 * US flowchart steps builder — wraps buildUSSteps.
 */

import type { FlowchartStepsBuilder } from "@/lib/countries/types";
import { buildUSSteps, inferData } from "@/lib/flowchart-steps";

export const americanFlowchartSteps: FlowchartStepsBuilder = {
  build(state, isRetired) {
    return buildUSSteps(inferData(state, isRetired));
  },
};
