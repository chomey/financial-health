/**
 * Australian flowchart steps builder — wraps buildAUSteps.
 */

import type { FlowchartStepsBuilder } from "@/lib/countries/types";
import { buildAUSteps, inferData } from "@/lib/flowchart-steps";

export const australianFlowchartSteps: FlowchartStepsBuilder = {
  build(state, isRetired) {
    return buildAUSteps(inferData(state, isRetired));
  },
};
