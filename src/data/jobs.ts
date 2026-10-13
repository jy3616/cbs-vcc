export type RoleType = "Full-time" | "Summer internship" | "In-semester internship" | "Fellowship";
export type FirmType = "VC" | "Growth equity" | "CVC" | "Studio" | "Accelerator";

export interface Job {
  firm: string;
  title: string;
  location: string;
  firmType: FirmType;
  focus: string; // blank if not stated
  sectors: string[];
  roleType: RoleType;
  datePosted: string; // YYYY-MM-DD (posted or first seen)
  deadline: string; // blank if not stated
  url: string;
  nyc: boolean;
  mentionsMba: boolean;
}

// Last refresh time (Eastern).
export const LAST_UPDATED = "2026-10-12T22:28:00-04:00";

export const JOBS: Job[] = [
  {
    firm: "645 Ventures",
    title: "Senior Associate – Investor",
    location: "New York, NY",
    firmType: "VC",
    focus: "Fintech & B2B AI",
    sectors: ["Fintech", "AI"],
    roleType: "Full-time",
    datePosted: "2026-10-06",
    deadline: "",
    url: "https://jobs.645ventures.com/companies/645-ventures/jobs/96041785-senior-associate-investor",
    nyc: true,
    mentionsMba: false,
  },
  {
    firm: "Courtside Ventures",
    title: "Venture Associate, Sports & Consumer Tech",
    location: "New York, NY",
    firmType: "VC",
    focus: "Sports & consumer tech",
    sectors: ["Consumer", "Sports"],
    roleType: "Full-time",
    datePosted: "2026-10-04",
    deadline: "",
    url: "https://www.mediabistro.com/jobs/3543058176-venture-associate-sports-consumer-tech",
    nyc: true,
    mentionsMba: false,
  },
  {
    firm: "Adams Street Partners",
    title: "Associate, Venture Growth",
    location: "Menlo Park, CA",
    firmType: "Growth equity",
    focus: "Venture growth",
    sectors: [],
    roleType: "Full-time",
    datePosted: "2026-10-10",
    deadline: "",
    url: "https://jobspring.pro/job/j12907621/associate-venture-growth-adams-street-partners/",
    nyc: false,
    mentionsMba: false,
  },
  {
    firm: "1752vc",
    title: "Venture Capital Fellow – Winter 2026",
    location: "",
    firmType: "VC",
    focus: "",
    sectors: [],
    roleType: "Fellowship",
    datePosted: "2026-10-09",
    deadline: "2026-11-09",
    url: "https://capd.mit.edu/jobs/1752vc-venture-capital-fellow-winter-2026/",
    nyc: false,
    mentionsMba: false,
  },
  {
    firm: "McKesson Ventures",
    title: "Associate",
    location: "San Francisco, CA",
    firmType: "CVC",
    focus: "Healthcare",
    sectors: ["Healthcare"],
    roleType: "Full-time",
    datePosted: "2026-09-29",
    deadline: "",
    url: "https://www.tealhq.com/job/mckesson-ventures-associate_7ea1aed7681d18686a8d10552800a33d7e350",
    nyc: false,
    mentionsMba: false,
  },
  {
    firm: "Plug and Play",
    title: "Ventures Associate",
    location: "Sunnyvale, CA (Hybrid)",
    firmType: "Accelerator",
    focus: "Early-stage",
    sectors: [],
    roleType: "Full-time",
    datePosted: "2026-09-16",
    deadline: "",
    url: "https://www.tealhq.com/job/ventures-associate_7ea1a5e0e1e511e74189ae69846f0f7275a10",
    nyc: false,
    mentionsMba: false,
  },
  {
    firm: "Robinhood Ventures",
    title: "Investment Analyst MBA Intern (Summer 2027)",
    location: "Menlo Park, CA",
    firmType: "CVC",
    focus: "",
    sectors: ["Fintech"],
    roleType: "Summer internship",
    datePosted: "2026-09-14",
    deadline: "",
    url: "https://bullandbyte.com/internships/robinhood-investment-analyst-mba-intern-robinhood-ventures-summer-2027-42bc40.html",
    nyc: false,
    mentionsMba: true,
  },
  {
    firm: "1752vc",
    title: "Venture Capital Fellow (AI)",
    location: "New York, NY",
    firmType: "VC",
    focus: "AI, enterprise software, fintech, frontier tech, healthcare, proptech",
    sectors: ["AI", "Fintech", "Healthcare", "Software", "PropTech"],
    roleType: "Fellowship",
    datePosted: "2026-10-12",
    deadline: "",
    url: "https://www.linkedin.com/jobs/view/venture-capital-fellow-ai-at-1752vc-4478553670",
    nyc: true,
    mentionsMba: false,
  },
  {
    firm: "L'Oréal (BOLD)",
    title: "Investment Analyst, BOLD North America",
    location: "New York, NY (Hudson Yards)",
    firmType: "CVC",
    focus: "Beauty & wellness, Seed–Series C",
    sectors: ["Consumer"],
    roleType: "Full-time",
    datePosted: "2026-10-12",
    deadline: "",
    url: "https://www.linkedin.com/jobs/view/investment-analyst-bold-north-america-at-l-or%C3%A9al-4477938171",
    nyc: true,
    mentionsMba: false,
  },
  {
    firm: "Macquarie Capital",
    title: "Growth and Private Equity Analyst (Growth & Technology)",
    location: "New York, NY",
    firmType: "Growth equity",
    focus: "Tech & tech-enabled, GOAL",
    sectors: ["Fintech"],
    roleType: "Full-time",
    datePosted: "2026-10-12",
    deadline: "",
    url: "https://www.linkedin.com/jobs/view/growth-and-private-equity-analyst-at-macquarie-group-4476063881",
    nyc: true,
    mentionsMba: false,
  },
  {
    firm: "Schrödinger Ventures",
    title: "Ventures Associate Director – Therapeutics",
    location: "New York, NY",
    firmType: "CVC",
    focus: "Therapeutics & drug discovery",
    sectors: ["Biotech", "Healthcare"],
    roleType: "Full-time",
    datePosted: "2026-10-10",
    deadline: "",
    url: "https://www.linkedin.com/jobs/view/ventures-associate-director-%E2%80%93-therapeutics-at-schr%C3%B6dinger-4450268147",
    nyc: true,
    mentionsMba: false,
  },
];

export function isNew(job: Job, now: Date) {
  const posted = new Date(job.datePosted + "T00:00:00-04:00").getTime();
  return now.getTime() - posted <= 24 * 3600 * 1000 * 1.5 && posted <= now.getTime();
}
