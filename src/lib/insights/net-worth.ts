export interface MilestoneDefinition {
  amount: number;
  message: string;
}

export const NET_WORTH_MILESTONES: MilestoneDefinition[] = [
  { amount: 10_000_000, message: "$10M+ — you've won the financial game." },
  { amount: 5_000_000, message: "$5M — generational wealth territory." },
  { amount: 2_000_000, message: "$2M — financial independence is likely within reach." },
  { amount: 1_000_000, message: "Millionaire! Your money now earns more than most people's salaries." },
  { amount: 500_000, message: "$500k — your portfolio generates ~$20k/year at 4%, a meaningful income stream." },
  { amount: 250_000, message: "$250k — your money is earning more than many people's side hustles." },
  { amount: 100_000, message: "$100k is the hardest milestone — Charlie Munger said the first $100k is a bitch. Compound growth really accelerates from here." },
  { amount: 50_000, message: "$50k — halfway to the big one." },
  { amount: 25_000, message: "$25k — a serious financial cushion." },
  { amount: 10_000, message: "$10k — you're ahead of most people your age." },
  { amount: 5_000, message: "$5k saved — a real emergency fund is forming." },
  { amount: 1_000, message: "Your first $1,000 — proof you can save." },
  { amount: 0, message: "You've crossed from negative to positive net worth — the hardest step is behind you!" },
];

/** Returns the highest milestone the user has reached, or null if below $0. */
export function getNetWorthMilestone(netWorth: number): MilestoneDefinition | null {
  if (netWorth < 0) return null;
  return NET_WORTH_MILESTONES.find((m) => netWorth >= m.amount) ?? null;
}

export interface AgeGroup {
  label: string;
  median: number;
}

// Federal Reserve SCF 2022 median net worth by age group
export const AGE_GROUPS: Array<{ minAge: number; maxAge: number | null } & AgeGroup> = [
  { minAge: 75, maxAge: null, label: "75+", median: 335_000 },
  { minAge: 65, maxAge: 74, label: "65–74", median: 410_000 },
  { minAge: 55, maxAge: 64, label: "55–64", median: 364_000 },
  { minAge: 45, maxAge: 54, label: "45–54", median: 247_000 },
  { minAge: 35, maxAge: 44, label: "35–44", median: 135_000 },
  { minAge: 0, maxAge: 34, label: "Under 35", median: 39_000 },
];

/** Returns the age group and SCF median net worth for a given age. */
export function getAgeGroup(age: number): AgeGroup | null {
  const group = AGE_GROUPS.find((g) => age >= g.minAge && (g.maxAge === null || age <= g.maxAge));
  return group ? { label: group.label, median: group.median } : null;
}
