import type { IconName } from "@/components/marketing/ui";

export type Plan = {
  key: "basic" | "pro" | "advanced";
  name: string;
  price: number;
  summary: string;
  bestFor: string;
  highlights: string[];
  featured?: boolean;
};

export const plans: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    price: 30,
    summary: "The full CivicFlow platform with guided setup for your firm.",
    bestFor: "Solo practitioners and small teams",
    highlights: [
      "Matter and contact management",
      "Case notes and follow-ups",
      "Document checklists and private storage",
      "Client intake link",
      "Secure client portal",
      "Reporting and Excel export",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 80,
    summary: "The full platform with priority onboarding for growing teams.",
    bestFor: "Growing firms with shared staff",
    featured: true,
    highlights: [
      "Everything in Basic",
      "Priority onboarding support",
    ],
  },
  {
    key: "advanced",
    name: "Advanced",
    price: 100,
    summary: "The full platform with migration assistance and priority support.",
    bestFor: "Multi-attorney firms and complex practices",
    highlights: [
      "Everything in Pro",
      "Data export and migration assistance",
      "Priority support",
    ],
  },
];

/* Plan comparison: [feature, basic, pro, advanced]. Every software
   capability is available on every plan; plans differ only in services. */
export const comparison: { group: string; rows: [string, boolean, boolean, boolean][] }[] = [
  {
    group: "Matters and workflow",
    rows: [
      ["Matter and contact management", true, true, true],
      ["Case status, priority and staff assignment", true, true, true],
      ["Internal notes with follow-up dates", true, true, true],
      ["Automatic case activity timeline", true, true, true],
    ],
  },
  {
    group: "Documents and clients",
    rows: [
      ["Document checklists and status tracking", true, true, true],
      ["Private document storage", true, true, true],
      ["Client intake link for your firm", true, true, true],
      ["Secure client portal with controlled sharing", true, true, true],
    ],
  },
  {
    group: "Reporting and administration",
    rows: [
      ["Operations dashboard and reports", true, true, true],
      ["Staff workload and follow-up reporting", true, true, true],
      ["Excel report export", true, true, true],
      ["Firm settings, matter types and intake controls", true, true, true],
    ],
  },
  {
    group: "Onboarding and support",
    rows: [
      ["Guided setup for your firm", true, true, true],
      ["Priority onboarding support", false, true, true],
      ["Data export and migration assistance", false, false, true],
      ["Priority support", false, false, true],
    ],
  },
];

export type Control = {
  icon: IconName;
  title: string;
  short: string;
  text: string;
};

export const securityControls: Control[] = [
  {
    icon: "building",
    title: "Data isolated by firm",
    short: "Policies enforce firm boundaries on every record.",
    text: "Every case, note, document and activity record belongs to one firm. Database policies check firm membership on every read and write.",
  },
  {
    icon: "users",
    title: "Separate staff and client access",
    short: "Two portals, two sign-ins, no crossover.",
    text: "Attorneys and staff sign in to the firm workspace. Clients sign in to a separate portal and never see the staff interface.",
  },
  {
    icon: "eye",
    title: "Client visibility you control",
    short: "Nothing is shared until your team shares it.",
    text: "Documents and updates stay private until your team marks them as shared. Internal notes are never visible to clients.",
  },
  {
    icon: "lock",
    title: "Private document storage",
    short: "Signed, short-lived links for every download.",
    text: "Files are stored in a private bucket organized by firm. Downloads use short-lived signed links instead of public URLs.",
  },
  {
    icon: "key",
    title: "Single-use client invitations",
    short: "Hashed, expiring links tied to one email.",
    text: "Invitation links are random, stored only as a hash, expire after seven days and can be used once by the invited email.",
  },
  {
    icon: "recover",
    title: "Verified account recovery",
    short: "No login email is ever revealed automatically.",
    text: "CivicFlow never reveals login emails automatically. Recovery requests are reviewed before account details are shared or changed.",
  },
];
