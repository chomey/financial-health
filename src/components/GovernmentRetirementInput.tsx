"use client";

import { useState } from "react";
import type { GovernmentRetirementIncome } from "@/lib/financial-types";
import {
  CPP_MAX_MONTHLY,
  CPP_AVERAGE_MONTHLY,
  OAS_MAX_MONTHLY_65_74,
  SS_AVERAGE_MONTHLY,
  SS_MAX_AT_62,
  SS_MAX_AT_67,
  SS_MAX_AT_70,
  AU_PENSION_SINGLE_FORTNIGHTLY,
  AU_PENSION_COUPLE_EACH_FORTNIGHTLY,
  fortnightlyToMonthly,
  type CppPreset,
  type OasPreset,
  type SsPreset,
  type AuPensionPreset,
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

function SocialSecurityInput({ value, onChange }: { value: GovernmentRetirementIncome | undefined; onChange: (v: GovernmentRetirementIncome | undefined) => void }) {
  const ssAmount = value?.ssMonthly ?? 0;

  const detectPreset = (): SsPreset => {
    if (ssAmount === 0) return "none";
    if (Math.abs(ssAmount - SS_AVERAGE_MONTHLY) < 1) return "average";
    if (Math.abs(ssAmount - SS_MAX_AT_62) < 1) return "max-62";
    if (Math.abs(ssAmount - SS_MAX_AT_67) < 1) return "max-67";
    if (Math.abs(ssAmount - SS_MAX_AT_70) < 1) return "max-70";
    return "custom";
  };

  const [preset, setPreset] = useState<SsPreset>(detectPreset);

  const update = (amount: number) => {
    if (amount === 0) {
      onChange(undefined);
    } else {
      onChange({ ...value, ssMonthly: amount });
    }
  };

  const handlePreset = (p: SsPreset) => {
    setPreset(p);
    let amount = 0;
    if (p === "average") amount = SS_AVERAGE_MONTHLY;
    else if (p === "max-62") amount = SS_MAX_AT_62;
    else if (p === "max-67") amount = SS_MAX_AT_67;
    else if (p === "max-70") amount = SS_MAX_AT_70;
    else if (p === "custom") amount = ssAmount || SS_AVERAGE_MONTHLY;
    update(amount);
  };

  const presetButtons: { key: SsPreset; label: string }[] = [
    { key: "none", label: "None" },
    { key: "average", label: `Avg (${formatMo(SS_AVERAGE_MONTHLY)})` },
    { key: "max-62", label: `Age 62 (${formatMo(SS_MAX_AT_62)})` },
    { key: "max-67", label: `Age 67 (${formatMo(SS_MAX_AT_67)})` },
    { key: "max-70", label: `Age 70 (${formatMo(SS_MAX_AT_70)})` },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-300">Social Security</label>
          <HelpTip text={`Expected monthly Social Security benefit. Average: ${formatMo(SS_AVERAGE_MONTHLY)}. Maximum depends on claiming age: ${formatMo(SS_MAX_AT_62)} at 62, ${formatMo(SS_MAX_AT_67)} at 67 (full retirement age), ${formatMo(SS_MAX_AT_70)} at 70. Check your estimate at ssa.gov/myaccount.`} />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presetButtons.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                preset === p.key
                  ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
              data-testid={`ss-preset-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <input
            type="number"
            min={0}
            max={10000}
            value={ssAmount || ""}
            onChange={(e) => update(parseFloat(e.target.value) || 0)}
            placeholder="Monthly Social Security amount"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="ss-custom-input"
          />
        )}
      </div>

      {ssAmount > 0 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-300" data-testid="gov-income-summary">
          Expected government income in retirement: <strong>{formatMo(ssAmount)}</strong>
        </div>
      )}
    </div>
  );
}

function formatFn(n: number): string {
  return `$${Math.round(n).toLocaleString()}/fn`;
}

function AgePensionInput({ value, onChange }: { value: GovernmentRetirementIncome | undefined; onChange: (v: GovernmentRetirementIncome | undefined) => void }) {
  const apAmount = value?.agePensionFortnightly ?? 0;

  const detectPreset = (): AuPensionPreset => {
    if (apAmount === 0) return "none";
    if (Math.abs(apAmount - AU_PENSION_SINGLE_FORTNIGHTLY) < 1) return "full-single";
    if (Math.abs(apAmount - AU_PENSION_COUPLE_EACH_FORTNIGHTLY) < 1) return "full-couple";
    return "custom";
  };

  const [preset, setPreset] = useState<AuPensionPreset>(detectPreset);

  const update = (amount: number) => {
    if (amount === 0) {
      onChange(undefined);
    } else {
      onChange({ ...value, agePensionFortnightly: amount });
    }
  };

  const handlePreset = (p: AuPensionPreset) => {
    setPreset(p);
    let amount = 0;
    if (p === "full-single") amount = AU_PENSION_SINGLE_FORTNIGHTLY;
    else if (p === "full-couple") amount = AU_PENSION_COUPLE_EACH_FORTNIGHTLY;
    else if (p === "custom") amount = apAmount || AU_PENSION_SINGLE_FORTNIGHTLY;
    update(amount);
  };

  const presetButtons: { key: AuPensionPreset; label: string }[] = [
    { key: "none", label: "None" },
    { key: "full-single", label: `Single (${formatFn(AU_PENSION_SINGLE_FORTNIGHTLY)})` },
    { key: "full-couple", label: `Couple (${formatFn(AU_PENSION_COUPLE_EACH_FORTNIGHTLY)} ea)` },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-300">Age Pension</label>
          <HelpTip text={`Expected fortnightly Age Pension at age 67. Full pension: ${formatFn(AU_PENSION_SINGLE_FORTNIGHTLY)} (single), ${formatFn(AU_PENSION_COUPLE_EACH_FORTNIGHTLY)} each (couple). Subject to income and asset tests. Check your estimate at servicesaustralia.gov.au.`} />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presetButtons.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                preset === p.key
                  ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
              data-testid={`ap-preset-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <input
            type="number"
            min={0}
            max={3000}
            value={apAmount || ""}
            onChange={(e) => update(parseFloat(e.target.value) || 0)}
            placeholder="Fortnightly Age Pension amount"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="ap-custom-input"
          />
        )}
      </div>

      {apAmount > 0 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-300" data-testid="gov-income-summary">
          Expected government income in retirement: <strong>{formatMo(fortnightlyToMonthly(apAmount))}</strong>
          <span className="text-emerald-400/70"> ({formatFn(apAmount)} fortnightly)</span>
        </div>
      )}
    </div>
  );
}

export default function GovernmentRetirementInput({ country, value, onChange }: Props) {

  return (
    <div data-testid="government-retirement-input">
      <div className="mb-2 flex items-center gap-1.5">
        <label className="block text-sm font-medium text-slate-300">Government Retirement Income</label>
        <HelpTip text="Estimated government benefits you'll receive in retirement. This reduces your FIRE number — you need less from your portfolio when government income covers part of your expenses." />
      </div>
      {country === "CA" && <CppOasInput value={value} onChange={onChange} />}
      {country === "US" && <SocialSecurityInput value={value} onChange={onChange} />}
      {country === "AU" && <AgePensionInput value={value} onChange={onChange} />}
    </div>
  );
}
