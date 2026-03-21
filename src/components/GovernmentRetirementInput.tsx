"use client";

import { useState } from "react";
import type { GovernmentRetirementIncome } from "@/lib/financial-types";
import {
  CPP_MAX_MONTHLY,
  CPP_AVERAGE_MONTHLY,
  OAS_MAX_MONTHLY_65_74,
  type CppPreset,
  type OasPreset,
} from "@/lib/government-retirement";
import HelpTip from "@/components/HelpTip";

interface Props {
  country: "CA" | "US" | "AU";
  value: GovernmentRetirementIncome | undefined;
  onChange: (v: GovernmentRetirementIncome | undefined) => void;
}

function formatMo(n: number): string {
  return `$${Math.round(n).toLocaleString()}/mo`;
}

function CppOasInput({ value, onChange }: { value: GovernmentRetirementIncome | undefined; onChange: (v: GovernmentRetirementIncome | undefined) => void }) {
  const cppAmount = value?.cppMonthly ?? 0;
  const oasAmount = value?.oasMonthly ?? 0;

  const detectCppPreset = (): CppPreset => {
    if (cppAmount === 0) return "none";
    if (Math.abs(cppAmount - CPP_AVERAGE_MONTHLY) < 1) return "average";
    if (Math.abs(cppAmount - CPP_MAX_MONTHLY) < 1) return "max";
    return "custom";
  };

  const detectOasPreset = (): OasPreset => {
    if (oasAmount === 0) return "none";
    if (Math.abs(oasAmount - OAS_MAX_MONTHLY_65_74) < 1) return "full";
    return "custom";
  };

  const [cppPreset, setCppPreset] = useState<CppPreset>(detectCppPreset);
  const [oasPreset, setOasPreset] = useState<OasPreset>(detectOasPreset);

  const update = (cpp: number, oas: number) => {
    if (cpp === 0 && oas === 0) {
      onChange(undefined);
    } else {
      onChange({ ...value, cppMonthly: cpp || undefined, oasMonthly: oas || undefined });
    }
  };

  const handleCppPreset = (preset: CppPreset) => {
    setCppPreset(preset);
    let amount = 0;
    if (preset === "average") amount = CPP_AVERAGE_MONTHLY;
    else if (preset === "max") amount = CPP_MAX_MONTHLY;
    else if (preset === "custom") amount = cppAmount || CPP_AVERAGE_MONTHLY;
    update(amount, oasAmount);
  };

  const handleOasPreset = (preset: OasPreset) => {
    setOasPreset(preset);
    let amount = 0;
    if (preset === "full") amount = OAS_MAX_MONTHLY_65_74;
    else if (preset === "custom") amount = oasAmount || OAS_MAX_MONTHLY_65_74;
    update(cppAmount, amount);
  };

  return (
    <div className="space-y-4">
      {/* CPP */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-300">CPP (Canada Pension Plan)</label>
          <HelpTip text={`Expected monthly CPP benefit at 65. Average: ${formatMo(CPP_AVERAGE_MONTHLY)}, Maximum: ${formatMo(CPP_MAX_MONTHLY)}. You can check your estimate at My Service Canada Account.`} />
        </div>
        <div className="flex gap-1.5 mb-2">
          {(["none", "average", "max", "custom"] as CppPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleCppPreset(p)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                cppPreset === p
                  ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
              data-testid={`cpp-preset-${p}`}
            >
              {p === "none" ? "None" : p === "average" ? `Avg (${formatMo(CPP_AVERAGE_MONTHLY)})` : p === "max" ? `Max (${formatMo(CPP_MAX_MONTHLY)})` : "Custom"}
            </button>
          ))}
        </div>
        {cppPreset === "custom" && (
          <input
            type="number"
            min={0}
            max={3000}
            value={cppAmount || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0;
              update(v, oasAmount);
            }}
            placeholder="Monthly CPP amount"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="cpp-custom-input"
          />
        )}
      </div>

      {/* OAS */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-300">OAS (Old Age Security)</label>
          <HelpTip text={`Monthly OAS pension at 65. Full pension: ${formatMo(OAS_MAX_MONTHLY_65_74)} (ages 65-74). Available to most Canadians who have lived in Canada for 10+ years after age 18. Subject to clawback above ~$91K income.`} />
        </div>
        <div className="flex gap-1.5 mb-2">
          {(["none", "full", "custom"] as OasPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleOasPreset(p)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                oasPreset === p
                  ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
              data-testid={`oas-preset-${p}`}
            >
              {p === "none" ? "None" : p === "full" ? `Full (${formatMo(OAS_MAX_MONTHLY_65_74)})` : "Custom"}
            </button>
          ))}
        </div>
        {oasPreset === "custom" && (
          <input
            type="number"
            min={0}
            max={2000}
            value={oasAmount || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0;
              update(cppAmount, v);
            }}
            placeholder="Monthly OAS amount"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="oas-custom-input"
          />
        )}
      </div>

      {/* Summary */}
      {(cppAmount > 0 || oasAmount > 0) && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-300" data-testid="gov-income-summary">
          Expected government income in retirement: <strong>{formatMo(cppAmount + oasAmount)}</strong>
          {cppAmount > 0 && oasAmount > 0 && (
            <span className="text-emerald-400/70"> (CPP {formatMo(cppAmount)} + OAS {formatMo(oasAmount)})</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function GovernmentRetirementInput({ country, value, onChange }: Props) {
  if (country !== "CA") return null; // US and AU will be added in tasks 188/189

  return (
    <div data-testid="government-retirement-input">
      <div className="mb-2 flex items-center gap-1.5">
        <label className="block text-sm font-medium text-slate-300">Government Retirement Income</label>
        <HelpTip text="Estimated government benefits you'll receive in retirement. This reduces your FIRE number — you need less from your portfolio when government income covers part of your expenses." />
      </div>
      <CppOasInput value={value} onChange={onChange} />
    </div>
  );
}
