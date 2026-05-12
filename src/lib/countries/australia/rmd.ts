/**
 * Australia has no forced-withdrawal mechanism equivalent to RMD or RRIF —
 * super in pension phase has minimum drawdown percentages, but they are not
 * surfaced in this app's RMD UI. The plugin returns zero for every account.
 */

import type { RmdRule } from "@/lib/countries/types";

export const australianRmd: RmdRule = {
  ruleName: "RMD",
  computeRmd() {
    return 0;
  },
};
