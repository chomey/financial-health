import { decodeState } from "../src/lib/url-state";
import { computeMetrics, computeTotals } from "../src/lib/financial-state";
import { getDefaultRoi } from "../src/components/AssetEntry";

const encoded = decodeURIComponent("%21I1%2C_%3BTisp0G%2B-sbNB%2F%21U%5E%3BSkd%21%29IH%29K%26OcX2G1.%3FmFDlN%3Dc-H2%2C4QXV%3BA%3BEg%22G%25%21%2B%22%3ERYa%2Cu%5B0645aY%5CMdu%25QE%24%2857LmVIKX%22J%3A%29%3Dn%3Aj%5C%26e*d0M%60REW3Q-a%29%3DR%255Z9pEkBjBI1%3BdUT*DD%28%25%3D%3Ca2_8brli_%3D4lf%28bWp%26%2FOsb.1V%40tjY%3AS%2F6%24K%27%3F%40AjeT%2BT%60MFjg%22gXWCY%2C4G%3F%2F%60%2CXGLn%24IOJPnFZEC%3E%22tI%27Bm%29%27LD%3F%24W%3CIB%29_t%60%24VKk6%40OJ%5C%23%60uA%2BRKbP*Tn*%2FHK%22%3Aj%5BR%40%40Rk%2C%21Q38%21%2Fi0A%5C3Z%3F-EMQC%28%29IcdPMkQfh2bV%5E%3D6oD%5B%3BF%22mIQWuC8IlS%3BF4andUu%3B%28l8o%3Fa%3B%5Dd*m%5B%2B7U.E%29%29AD3R%28i17mn%40E%2CWLtP1crL99*XE%3BG%5C*4%5B%5E%26iB%27l%22%3C%2C%2C2mE%608*rO%29tQ0%5DLkXZbqdB%3D%5C%27tZUctV7*fj-o%60%3DbM%3EX0%3F%24pj%40%5CMLF8tR%3CEB_%5DGY%3Fe%3BuS%26%27uuMq%228gIK%3F%2C9bl%40");

const state = decodeState(encoded);
if (!state) { console.log("FAILED"); process.exit(1); }

const totals = computeTotals(state);
const liquidTotal = totals.totalAssets + totals.totalStocks;
const monthlyObligations = totals.monthlyExpenses + totals.totalMortgagePayments + totals.totalDebtPayments;

console.log("=== BASE RUNWAY ===");
console.log(`$${liquidTotal} / $${monthlyObligations}/mo = ${(liquidTotal/monthlyObligations).toFixed(1)} months`);

// Manually simulate runway with growth to understand the 108 mo figure
console.log("\n=== GROWTH SIMULATION (month by month) ===");
type Bucket = { label: string; balance: number; monthlyRate: number };
const buckets: Bucket[] = [];
for (const a of state.assets.filter(a => !a.computed)) {
  if (a.amount > 0) {
    const roi = a.roi ?? getDefaultRoi(a.category) ?? 0;
    buckets.push({ label: a.category, balance: a.amount, monthlyRate: roi / 100 / 12 });
  }
}

console.log("Starting balances:");
for (const b of buckets) {
  console.log(`  ${b.label}: $${b.balance} @ ${(b.monthlyRate * 12 * 100).toFixed(1)}%/yr`);
}

// Monthly growth income at start
const monthlyGrowthIncome = buckets.reduce((s, b) => s + b.balance * b.monthlyRate, 0);
console.log(`\nMonthly growth income at start: $${monthlyGrowthIncome.toFixed(0)}`);
console.log(`Monthly withdrawal: $${monthlyObligations}`);
console.log(`Net monthly draw: $${(monthlyObligations - monthlyGrowthIncome).toFixed(0)}`);
console.log(`If growth were constant: ${(liquidTotal / (monthlyObligations - monthlyGrowthIncome)).toFixed(1)} months`);

// Run simulation printing every 12 months
let month = 0;
for (month = 0; month < 1200; month++) {
  let total = 0;
  for (const b of buckets) total += b.balance;
  if (total <= 0) break;

  if (month % 12 === 0 || month < 6) {
    const growth = buckets.reduce((s, b) => s + b.balance * b.monthlyRate, 0);
    console.log(`Month ${month}: total=$${total.toFixed(0)}, growth=$${growth.toFixed(0)}/mo, net draw=$${(monthlyObligations - growth).toFixed(0)}/mo`);
  }

  for (let i = 0; i < buckets.length; i++) {
    const share = buckets[i].balance / total;
    buckets[i].balance -= monthlyObligations * share;
    if (buckets[i].balance < 0) buckets[i].balance = 0;
    buckets[i].balance *= 1 + buckets[i].monthlyRate;
  }
}
console.log(`\nRunway with growth: ${month} months`);

const metrics = computeMetrics(state);
const runway = metrics.find(m => m.title === "Financial Runway");
console.log(`Metric shows: ${runway?.value.toFixed(1)} base, ${runway?.runwayWithGrowth} with growth, ${runway?.runwayAfterTax} after tax`);
