import { decodeState } from "../src/lib/url-state";
import { normalizeToMonthly } from "../src/components/IncomeEntry";
import { getEffectivePayment } from "../src/components/PropertyEntry";

const raw = "!I1,_;UKB60GOJNVU*0p&4GF*c-4FD7!r54E!)YS?u+J*7Z@A]ejB%DDrdF0:X?S<$O/`j]\\jFKDujUkpBo0g;RB]h^iF--'64PP@X4VXD)@7[ZfFku[mf/k.Cm@.<AA^eA2:m:$Rog?@8@m[7>;2SdUq3/5+r/Lg'P(;ne09i.(Od1\\FQ?N=\\VbegPU$22?J+FJin^2H/<p\"qj0'ISX?Z#O/;qAT$.G->#49D?e^<$mh81\"JStVmk:JMbLTR\"kopTYG3RnC[L%9lS6`Dp4!@VWRCB.F&<.2B6W1m9+Xgr0mn8`IT4eGAeU/H2K#JZ:Xj*2[S/L_[aI8E5kR?^`38TI$<aFDFk=JaBM!MtOmLU[^=oq?sIjWHGPJrJ?!S8R*>6NP)q9s)Vkqe/;k;nr'OPdnCsd<&hk3Wg8\"ZNpk9CKCk4ec%NmXaU%h]Y2\"C\\V)_o1*mlsYCFH1_#=";
const state = decodeState(raw);
if (state) {
  console.log("=== ASSETS ===");
  state.assets.forEach(a => console.log(" ", a.category, "$"+a.amount, a.monthlyContribution ? "contrib:$"+a.monthlyContribution+"/mo" : "", a.roi ? "roi:"+a.roi+"%" : ""));
  console.log("\n=== DEBTS ===");
  state.debts.forEach(d => console.log(" ", d.category, "$"+d.amount, d.interestRate ? "rate:"+d.interestRate+"%" : "", d.monthlyPayment ? "payment:$"+d.monthlyPayment+"/mo" : ""));
  console.log("\n=== INCOME ===");
  state.income.forEach(i => {
    const monthly = normalizeToMonthly(i.amount, i.frequency);
    console.log(" ", i.category, "$"+i.amount, i.frequency ?? "monthly", "→ $"+monthly.toFixed(0)+"/mo", i.incomeType ?? "employment");
  });
  console.log("\n=== EXPENSES ===");
  state.expenses.forEach(e => console.log(" ", e.category, "$"+e.amount+"/mo"));
  console.log("\n=== PROPERTIES ===");
  state.properties.forEach(p => {
    const payment = getEffectivePayment(p);
    console.log(" ", p.name, "value:$"+p.value, "mortgage:$"+p.mortgage, "effectivePayment:$"+payment+"/mo", "rate:"+(p.interestRate ?? "?")+"%");
  });
  console.log("\n=== STOCKS ===");
  state.stocks.forEach(s => console.log(" ", s.ticker, s.shares, "shares"));
  console.log("\nCountry:", state.country, "Jurisdiction:", state.jurisdiction, "Age:", state.age);

  // Now calculate what surplus SHOULD be
  const totalMonthlyIncome = state.income.reduce((sum, i) => sum + normalizeToMonthly(i.amount, i.frequency), 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDebtPayments = state.debts.reduce((sum, d) => sum + (d.monthlyPayment ?? 0), 0);
  const totalMortgagePayments = state.properties.reduce((sum, p) => sum + getEffectivePayment(p), 0);
  const totalContributions = state.assets.reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);

  console.log("\n=== MONTHLY SURPLUS COMPONENTS ===");
  console.log("Gross monthly income:", "$"+totalMonthlyIncome.toFixed(0));
  console.log("Monthly expenses:", "$"+totalExpenses.toFixed(0));
  console.log("Debt payments:", "$"+totalDebtPayments.toFixed(0));
  console.log("Mortgage payments:", "$"+totalMortgagePayments.toFixed(0));
  console.log("Investment contributions:", "$"+totalContributions.toFixed(0));
  console.log("---");
  console.log("Gross surplus (before tax):", "$"+(totalMonthlyIncome - totalExpenses - totalDebtPayments - totalMortgagePayments - totalContributions).toFixed(0));
} else {
  console.log("FAILED to decode");
}
