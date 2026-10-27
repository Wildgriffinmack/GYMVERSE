/**
 * Coach Pro — DEMONSTRATION DATA (Phase 5).
 *
 * Fictional, deterministic data for a Coming Soon preview. No real users, leads, messages, bookings,
 * testimonials, brands or analytics. Nothing is sent anywhere. Every dashboard figure is derived from
 * the daily series below, so period totals, charts, funnel stages and conversion rates always agree.
 * Pure module (type-only imports) so it can be unit-tested with plain Node.
 */
import type { PremiumFeature } from "../membership/entitlements";

export const COACH_COPY = {
  title: "COACH COMMAND CENTER",
  subtitle: "Your coaching business. One powerful dashboard.",
  tagline: "Turn your content into clients.",
  supporting: "Build your coaching presence. Manage opportunities. Grow your business.",
  pill: "COACH PRO · COMING SOON",
  distinction: "Creator Pro helps you grow attention. Coach Pro helps you turn attention into clients.",
  noGuarantee: "Coach Pro doesn't guarantee leads, clients, bookings or income, and it doesn't verify coaching credentials.",
  demoNote: "Demo data — fictional people and numbers. No real GYMX users, messages or analytics are used.",
  inquirySent: "Demo inquiry created — no message was sent.",
  bookingCreated: "Demo booking created — no real appointment has been scheduled.",
  leadPrivacy: "Fictional leads only. Nothing here contacts anyone, and no lead data leaves this device.",
  testimonialTag: "SAMPLE TESTIMONIAL — FICTIONAL",
  showcaseTag: "FICTIONAL EXAMPLE · RESULTS VARY",
  partnershipTag: "DEMO OPPORTUNITY · NOT A LIVE PARTNERSHIP",
  partnershipDisclaimer:
    "Fictional example for demonstration. There is no real brand or gym, no application, contract or agreement, and GYMX has no partnership with any organisation shown.",
  badgeCoachPro: "COACH PRO",
  verificationPreview: "VERIFICATION PREVIEW — NOT VERIFIED",
  verificationNote:
    "Coach Pro is a membership, not a credential. Coach verification would be a separate, independent review of qualifications. This prototype never verifies anyone.",
  formSafety:
    "Example form only. Don't enter real contact details or health information — this demo never asks about diagnoses, medications or medical history.",
  programNote: "General example programming for illustration, not personalised or medical advice.",
} as const;

/** Fixed "today" so every demo date is deterministic (Friday, Oct 23 2026). */
export const DEMO_TODAY = Date.UTC(2026, 9, 23);
const DAY_MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dateLabel(daysFromToday: number): string {
  const d = new Date(DEMO_TODAY + daysFromToday * DAY_MS);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
export function weekdayLabel(daysFromToday: number): string {
  return WEEKDAYS[new Date(DEMO_TODAY + daysFromToday * DAY_MS).getUTCDay()];
}

// ── Periods & daily series ──────────────────────────────────────────────────
export type PeriodId = "7d" | "30d" | "90d";
export const PERIODS: { id: PeriodId; label: string; days: number }[] = [
  { id: "7d", label: "7 Days", days: 7 },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "90d", label: "90 Days", days: 90 },
];
const DAYS: Record<PeriodId, number> = { "7d": 7, "30d": 30, "90d": 90 };

/** Profile visits on a day (0 = today). */
export function visitsOn(d: number): number {
  if (d < 0 || d >= 90) return 0;
  const wave = [12, -6, 20, 4, -10, 8, -2][d % 7];
  const base = d < 30 ? 79 : d < 60 ? 58 : 44;
  return base + wave;
}
/** Client inquiries received on a day (0 = today). */
export function inquiriesOn(d: number): number {
  if (d < 0 || d >= 90) return 0;
  if (d === 0) return 3;
  if (d < 30) return d % 2 === 0 ? 2 : 1;
  if (d < 60) return d % 3 === 2 ? 0 : 1;
  return d % 2 === 0 ? 1 : 0;
}
function sumDays(fn: (d: number) => number, from: number, to: number): number {
  let n = 0;
  for (let d = from; d <= to; d++) n += fn(d);
  return n;
}

/** Stage rates used to derive the funnel. Each stage is a subset of the one before it. */
export const FUNNEL_RATES = { newLead: 0.7, qualified: 0.66, booking: 0.86, consultation: 0.67, conversation: 0.6, serviceView: 0.258, interest: 0.184 } as const;

export function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

export interface CoachTotals {
  profileVisits: number;
  servicesViewed: number;
  /** Visitors who opened the inquiry form after viewing a service ("potential client interest"). */
  potentialInterest: number;
  inquiries: number;
  newLeads: number;
  qualifiedLeads: number;
  bookingRequests: number;
  consultations: number;
  activeConversations: number;
  /** inquiries ÷ profile visits */
  profileToInquiryRate: number;
  /** qualified leads ÷ new leads */
  qualificationRate: number;
  /** consultations scheduled ÷ new leads */
  leadConversionRate: number;
  /** consultations scheduled ÷ inquiries */
  consultationRate: number;
}

export const RATE_FORMULAS = [
  { label: "Profile → inquiry", formula: "inquiries ÷ profile visits" },
  { label: "Lead qualification", formula: "qualified leads ÷ new leads" },
  { label: "Lead conversion", formula: "consultations scheduled ÷ new leads" },
  { label: "Consultation rate", formula: "consultations scheduled ÷ inquiries" },
] as const;

export function coachTotals(period: PeriodId): CoachTotals {
  const last = DAYS[period] - 1;
  const profileVisits = sumDays(visitsOn, 0, last);
  const inquiries = sumDays(inquiriesOn, 0, last);
  const servicesViewed = Math.round(profileVisits * FUNNEL_RATES.serviceView);
  const potentialInterest = Math.round(servicesViewed * FUNNEL_RATES.interest);
  const newLeads = Math.round(inquiries * FUNNEL_RATES.newLead);
  const qualifiedLeads = Math.round(newLeads * FUNNEL_RATES.qualified);
  const bookingRequests = Math.round(qualifiedLeads * FUNNEL_RATES.booking);
  const consultations = Math.round(bookingRequests * FUNNEL_RATES.consultation);
  const activeConversations = Math.round(qualifiedLeads * FUNNEL_RATES.conversation);
  return {
    profileVisits,
    servicesViewed,
    potentialInterest,
    inquiries,
    newLeads,
    qualifiedLeads,
    bookingRequests,
    consultations,
    activeConversations,
    profileToInquiryRate: pct(inquiries, profileVisits),
    qualificationRate: pct(qualifiedLeads, newLeads),
    leadConversionRate: pct(consultations, newLeads),
    consultationRate: pct(consultations, inquiries),
  };
}

/** Funnel stages in order; each value is ≤ the previous one. */
export function funnel(period: PeriodId): { label: string; value: number }[] {
  const t = coachTotals(period);
  return [
    { label: "Profile visits", value: t.profileVisits },
    { label: "Services viewed", value: t.servicesViewed },
    { label: "Inquiry form opened", value: t.potentialInterest },
    { label: "Inquiries", value: t.inquiries },
    { label: "New leads", value: t.newLeads },
    { label: "Qualified leads", value: t.qualifiedLeads },
    { label: "Booking requests", value: t.bookingRequests },
    { label: "Consultations", value: t.consultations },
  ];
}

/** Inquiries grouped by day received, oldest → newest. Bars sum to the period's inquiries. */
export function inquiriesChart(period: PeriodId): { label: string; value: number }[] {
  const { size, count } = period === "7d" ? { size: 1, count: 7 } : period === "30d" ? { size: 6, count: 5 } : { size: 15, count: 6 };
  const out: { label: string; value: number }[] = [];
  for (let b = count - 1; b >= 0; b--) {
    const from = b * size;
    const to = from + size - 1;
    out.push({ label: size === 1 ? weekdayLabel(-from) : dateLabel(-to), value: sumDays(inquiriesOn, from, to) });
  }
  return out;
}

// ── Inquiry sources & insights ──────────────────────────────────────────────
export type SourceId = "strength" | "transformation" | "tutorial" | "services" | "other";
export const SOURCES: { id: SourceId; label: string; share: number }[] = [
  { id: "strength", label: "Strength-training content", share: 0.35 },
  { id: "transformation", label: "Transformation showcases", share: 0.26 },
  { id: "tutorial", label: "Workout tutorials", share: 0.17 },
  { id: "services", label: "Coaching services section", share: 0.14 },
  { id: "other", label: "Other profile visits", share: 0.08 },
];
export function sourceLabel(id: SourceId | "inquiry_form"): string {
  return id === "inquiry_form" ? "Demo inquiry form" : SOURCES.find((s) => s.id === id)!.label;
}

/** Splits the period's inquiries across sources (largest remainder) so the parts always sum to the total. */
export function inquirySources(period: PeriodId): { id: SourceId; label: string; value: number }[] {
  const total = coachTotals(period).inquiries;
  const exact = SOURCES.map((s) => s.share * total);
  const base = exact.map((x) => Math.floor(x));
  let left = total - base.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, rem: x - base[i] })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const o of order) {
    if (left <= 0) break;
    base[o.i] += 1;
    left -= 1;
  }
  return SOURCES.map((s, i) => ({ id: s.id, label: s.label, value: base[i] }));
}

/** Fictional share of weekly profile visits by time window. */
export const VISIT_WINDOWS = [
  { label: "6–9 AM", level: 38 },
  { label: "9 AM–12 PM", level: 24 },
  { label: "12–3 PM", level: 31 },
  { label: "3–6 PM", level: 46 },
  { label: "6–9 PM", level: 88 },
  { label: "9 PM–12 AM", level: 52 },
];

// ── Leads ───────────────────────────────────────────────────────────────────
export type CoachingType = "in_person" | "online" | "strength" | "general" | "transformation";
export const COACHING_TYPES: { id: CoachingType; label: string }[] = [
  { id: "in_person", label: "In-person training" },
  { id: "online", label: "Online coaching" },
  { id: "strength", label: "Strength training" },
  { id: "general", label: "General fitness" },
  { id: "transformation", label: "Transformation coaching" },
];
export function coachingTypeLabel(id: CoachingType): string {
  return COACHING_TYPES.find((c) => c.id === id)!.label;
}

export type LeadStatus = "new" | "contacted" | "consultation" | "active" | "closed";
export const LEAD_STATUSES: { id: LeadStatus; label: string; next: string }[] = [
  { id: "new", label: "New Inquiry", next: "Reply to the inquiry" },
  { id: "contacted", label: "Contacted", next: "Offer a consultation time" },
  { id: "consultation", label: "Consultation Scheduled", next: "Prepare for the consultation" },
  { id: "active", label: "Active Client", next: "Check in on their progress" },
  { id: "closed", label: "Closed", next: "No action needed" },
];
export function statusLabel(id: LeadStatus): string {
  return LEAD_STATUSES.find((s) => s.id === id)!.label;
}
export function nextStep(id: LeadStatus): string {
  return LEAD_STATUSES.find((s) => s.id === id)!.next;
}

/** Allowed status changes. Closed leads can be reopened as new. */
export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ["contacted", "closed"],
  contacted: ["consultation", "closed"],
  consultation: ["active", "contacted", "closed"],
  active: ["closed"],
  closed: ["new"],
};

export interface FollowUp {
  id: string;
  text: string;
  done: boolean;
}
export interface Lead {
  id: string;
  /** Clearly fabricated demo identity. */
  name: string;
  interest: CoachingType;
  /** Days before DEMO_TODAY the inquiry arrived. */
  daysAgo: number;
  goal: string;
  status: LeadStatus;
  source: SourceId | "inquiry_form";
  message?: string;
  followUps: FollowUp[];
  /** Created from the demo inquiry form this session. */
  sessionOnly?: boolean;
}

export const DEMO_LEADS: Lead[] = [
  { id: "ld1", name: "Riley Sample", interest: "strength", daysAgo: 0, goal: "First 300 lb squat", status: "new", source: "strength", message: "Loved your squat cue video. Do you coach powerlifting beginners?", followUps: [] },
  { id: "ld2", name: "Jordan Demo", interest: "online", daysAgo: 1, goal: "Train consistently while travelling", status: "new", source: "transformation", message: "Your 6-month transformation post got me motivated. Do you offer online check-ins?", followUps: [] },
  { id: "ld3", name: "Casey Example", interest: "general", daysAgo: 3, goal: "Build a 3-day routine", status: "contacted", source: "tutorial", followUps: [{ id: "f1", text: "Sent a demo reply with available times", done: true }] },
  { id: "ld4", name: "Morgan Test", interest: "transformation", daysAgo: 5, goal: "Get back into training after a break", status: "consultation", source: "transformation", message: "Would like to talk about a 12-week plan.", followUps: [{ id: "f2", text: "Prepare intro questions", done: false }] },
  { id: "ld5", name: "Taylor Mock", interest: "in_person", daysAgo: 9, goal: "Learn the main barbell lifts", status: "active", source: "services", followUps: [] },
  { id: "ld6", name: "Avery Fictional", interest: "online", daysAgo: 12, goal: "Improve conditioning", status: "contacted", source: "transformation", followUps: [] },
  { id: "ld7", name: "Sam Placeholder", interest: "strength", daysAgo: 18, goal: "Bench 225", status: "closed", source: "strength", followUps: [] },
  { id: "ld8", name: "Drew Sample", interest: "general", daysAgo: 24, goal: "Stay active with a busy schedule", status: "new", source: "other", followUps: [] },
];

export function businessInsights(period: PeriodId): string[] {
  const sources = [...inquirySources(period)].sort((a, b) => b.value - a.value);
  const peak = [...VISIT_WINDOWS].sort((a, b) => b.level - a.level)[0];
  const transformationLeads = DEMO_LEADS.filter((l) => l.source === "transformation");
  const online = transformationLeads.filter((l) => l.interest === "online").length;
  return [
    `Most inquiries come from ${sources[0].label.toLowerCase()} (${sources[0].value} of ${coachTotals(period).inquiries} in this period).`,
    `Transformation showcases attract interest in online coaching (${online} of ${transformationLeads.length} sample leads from showcases).`,
    `Evening profile visits are relatively high — ${peak.label} is the busiest window in this demo week.`,
  ];
}

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}
/** Returns a new list; invalid transitions leave it unchanged. */
export function setLeadStatus(leads: Lead[], id: string, to: LeadStatus): Lead[] {
  const lead = leads.find((l) => l.id === id);
  if (!lead || !canTransition(lead.status, to)) return leads;
  return leads.map((l) => (l.id === id ? { ...l, status: to } : l));
}

export type LeadFilter = LeadStatus | "all";
export function filterLeads(leads: Lead[], status: LeadFilter, query: string): Lead[] {
  const q = query.trim().toLowerCase();
  return leads.filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    if (!q) return true;
    return [l.name, l.goal, coachingTypeLabel(l.interest), sourceLabel(l.source), l.message ?? ""].some((v) => v.toLowerCase().includes(q));
  });
}
export function statusCounts(leads: Lead[]): Record<LeadFilter, number> {
  const out: Record<LeadFilter, number> = { all: leads.length, new: 0, contacted: 0, consultation: 0, active: 0, closed: 0 };
  for (const l of leads) out[l.status] += 1;
  return out;
}

export const FOLLOW_UP_MAX = 120;
export function addFollowUp(leads: Lead[], leadId: string, text: string, id: string): Lead[] {
  const t = text.trim();
  if (!t || t.length > FOLLOW_UP_MAX || !leads.some((l) => l.id === leadId)) return leads;
  return leads.map((l) => (l.id === leadId ? { ...l, followUps: [...l.followUps, { id, text: t, done: false }] } : l));
}
export function toggleFollowUp(leads: Lead[], leadId: string, followUpId: string): Lead[] {
  return leads.map((l) => (l.id === leadId ? { ...l, followUps: l.followUps.map((f) => (f.id === followUpId ? { ...f, done: !f.done } : f)) } : l));
}

// ── Inquiry form ────────────────────────────────────────────────────────────
export type Experience = "beginner" | "intermediate" | "advanced";
export const EXPERIENCE_LEVELS: { id: Experience; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];
export type ContactMethod = "in_app" | "email" | "phone";
/** Only the preferred method is chosen — the demo never asks for an address or number. */
export const CONTACT_METHODS: { id: ContactMethod; label: string }[] = [
  { id: "in_app", label: "GYMX message" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone call" },
];
export interface InquiryForm {
  name: string;
  goal: string;
  coachingType: CoachingType | null;
  experience: Experience | null;
  contact: ContactMethod | null;
  message: string;
}
export const EMPTY_INQUIRY: InquiryForm = { name: "", goal: "", coachingType: null, experience: null, contact: null, message: "" };
export const EXAMPLE_INQUIRY: InquiryForm = { name: "Example Client", goal: "Build strength for everyday life", coachingType: "strength", experience: "beginner", contact: "in_app", message: "Hi! I'm new to lifting and would like help with a simple plan." };
export const MESSAGE_MAX = 280;

const CONTACT_DETAIL = /@[a-z0-9-]+\.[a-z]{2,}|(?:\+?\d[\s().-]?){7,}/i;

export type InquiryErrors = Partial<Record<keyof InquiryForm, string>>;
export function validateInquiry(f: InquiryForm): InquiryErrors {
  const e: InquiryErrors = {};
  const name = f.name.trim();
  if (name.length < 2) e.name = "Enter a name (at least 2 characters).";
  else if (name.length > 40) e.name = "Keep the name under 40 characters.";
  const goal = f.goal.trim();
  if (goal.length < 3) e.goal = "Describe a fitness goal.";
  else if (goal.length > 80) e.goal = "Keep the goal under 80 characters.";
  if (!f.coachingType) e.coachingType = "Choose a type of coaching.";
  if (!f.experience) e.experience = "Choose an experience level.";
  if (!f.contact) e.contact = "Choose a preferred contact method.";
  if (f.message.length > MESSAGE_MAX) e.message = `Keep the message under ${MESSAGE_MAX} characters.`;
  else if (CONTACT_DETAIL.test(f.message)) e.message = "Please don't include email addresses or phone numbers in this demo.";
  return e;
}

/** Turns a valid form into a session-only fictional lead. Returns null if the form is invalid. */
export function leadFromInquiry(f: InquiryForm, id: string): Lead | null {
  if (Object.keys(validateInquiry(f)).length) return null;
  return {
    id,
    name: f.name.trim(),
    interest: f.coachingType!,
    daysAgo: 0,
    goal: f.goal.trim(),
    status: "new",
    source: "inquiry_form",
    message: f.message.trim() || undefined,
    followUps: [],
    sessionOnly: true,
  };
}

// ── Booking preview ─────────────────────────────────────────────────────────
export const CONSULT_TYPES = [
  { id: "intro", label: "Introductory coaching consultation", minutes: 20 },
  { id: "assessment", label: "Training goal assessment", minutes: 45 },
  { id: "discovery", label: "Online coaching discovery call", minutes: 30 },
  { id: "strength", label: "Strength coaching consultation", minutes: 30 },
] as const;
export type ConsultType = (typeof CONSULT_TYPES)[number]["id"];
export const SLOT_TIMES = ["9:00 AM", "12:30 PM", "5:30 PM", "7:00 PM"];
export const BOOKING_WINDOW_DAYS = 7;

export interface Booking {
  id: string;
  type: ConsultType;
  /** Days after DEMO_TODAY (1–7). Today and past days are never bookable. */
  dayOffset: number;
  time: string;
  withName: string;
}

/** Slots the demo coach has already blocked out. */
export function isBlocked(dayOffset: number, time: string): boolean {
  return (dayOffset + SLOT_TIMES.indexOf(time)) % 5 === 0;
}
export function bookingDays(): { offset: number; label: string }[] {
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => ({ offset: i + 1, label: `${weekdayLabel(i + 1)}, ${dateLabel(i + 1)}` }));
}
export function slotAvailable(bookings: Booking[], dayOffset: number, time: string, ignoreId?: string): boolean {
  return (
    Number.isInteger(dayOffset) &&
    dayOffset >= 1 &&
    dayOffset <= BOOKING_WINDOW_DAYS &&
    SLOT_TIMES.includes(time) &&
    !isBlocked(dayOffset, time) &&
    !bookings.some((b) => b.id !== ignoreId && b.dayOffset === dayOffset && b.time === time)
  );
}
export function availableSlots(bookings: Booking[], dayOffset: number): string[] {
  return SLOT_TIMES.filter((t) => slotAvailable(bookings, dayOffset, t));
}
function sortBookings(list: Booking[]): Booking[] {
  return [...list].sort((a, b) => a.dayOffset - b.dayOffset || SLOT_TIMES.indexOf(a.time) - SLOT_TIMES.indexOf(b.time));
}
export function createBooking(list: Booking[], b: Booking): Booking[] {
  if (!CONSULT_TYPES.some((t) => t.id === b.type) || !slotAvailable(list, b.dayOffset, b.time)) return list;
  return sortBookings([...list, b]);
}
export function rescheduleBooking(list: Booking[], id: string, dayOffset: number, time: string): Booking[] {
  if (!list.some((b) => b.id === id) || !slotAvailable(list, dayOffset, time, id)) return list;
  return sortBookings(list.map((b) => (b.id === id ? { ...b, dayOffset, time } : b)));
}
export function cancelBooking(list: Booking[], id: string): Booking[] {
  return list.filter((b) => b.id !== id);
}
export function bookingLabel(b: Pick<Booking, "dayOffset" | "time">): string {
  return `${weekdayLabel(b.dayOffset)}, ${dateLabel(b.dayOffset)} · ${b.time}`;
}
export function consultTypeLabel(id: ConsultType): string {
  return CONSULT_TYPES.find((t) => t.id === id)!.label;
}

// ── Services ────────────────────────────────────────────────────────────────
export type ServiceIcon = "user" | "monitor" | "trending" | "users";
export interface CoachService {
  id: string;
  name: string;
  description: string;
  format: string;
  duration: string;
  icon: ServiceIcon;
  details: string[];
}
export const SERVICES: CoachService[] = [
  { id: "sv1", name: "1-on-1 Personal Training", description: "Personalized training support.", format: "In person", duration: "Example: 60-minute sessions", icon: "user", details: ["Technique coaching on the main lifts", "Sessions planned around your goal", "Progress reviewed together"] },
  { id: "sv2", name: "Online Strength Coaching", description: "Remote strength-focused programming.", format: "Online", duration: "Example: 12-week blocks", icon: "monitor", details: ["Weekly program updates", "Form feedback on uploaded clips", "Check-ins inside the app (future)"] },
  { id: "sv3", name: "Transformation Coaching", description: "Structured fitness accountability and progress support.", format: "Online or hybrid", duration: "Example: 16 weeks", icon: "trending", details: ["Habit and consistency tracking", "Regular progress check-ins", "No promised physical outcome"] },
  { id: "sv4", name: "Small Group Training", description: "Coaching for a small group of trainees.", format: "In person · up to 4", duration: "Example: 45-minute sessions", icon: "users", details: ["Shared sessions with friends", "Scaled exercises for each person", "Community-focused training"] },
];
export interface ServiceSettings {
  visible: Record<string, boolean>;
  featuredId: string | null;
}
export const DEFAULT_SERVICES: ServiceSettings = { visible: { sv1: true, sv2: true, sv3: true, sv4: false }, featuredId: "sv2" };

export function visibleServices(s: ServiceSettings): CoachService[] {
  return SERVICES.filter((x) => s.visible[x.id]);
}
/** Hiding the featured service moves the feature to the first visible service (or none). */
export function toggleServiceVisibility(s: ServiceSettings, id: string): ServiceSettings {
  if (!SERVICES.some((x) => x.id === id)) return s;
  const visible = { ...s.visible, [id]: !s.visible[id] };
  const featuredId = s.featuredId && visible[s.featuredId] ? s.featuredId : (SERVICES.find((x) => visible[x.id])?.id ?? null);
  return { visible, featuredId };
}
/** Only a visible service can be featured. */
export function setFeaturedService(s: ServiceSettings, id: string): ServiceSettings {
  return s.visible[id] ? { ...s, featuredId: id } : s;
}

// ── Client results ──────────────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  alias: string;
  training: string;
  text: string;
  fictional: true;
}
export const TESTIMONIALS: Testimonial[] = [
  { id: "t1", alias: "Client A (fictional)", training: "Online strength coaching", text: "Having a plan each week made it much easier to show up.", fictional: true },
  { id: "t2", alias: "Client B (fictional)", training: "1-on-1 personal training", text: "Learning the lifts properly gave me confidence in the gym.", fictional: true },
  { id: "t3", alias: "Client C (fictional)", training: "Transformation coaching", text: "The regular check-ins kept me consistent through a busy semester.", fictional: true },
  { id: "t4", alias: "Client D (fictional)", training: "Small group training", text: "Training with friends made sessions fun and kept us accountable.", fictional: true },
];
export function pinTestimonial(current: string | null, id: string): string | null {
  if (!TESTIMONIALS.some((t) => t.id === id)) return current;
  return current === id ? null : id;
}

export interface Showcase {
  id: string;
  title: string;
  training: string;
  weeks: number;
  milestones: string[];
  consistency: { label: string; value: string }[];
}
export const SHOWCASES: Showcase[] = [
  { id: "sc1", title: "Strength Foundation", training: "Online strength coaching", weeks: 12, milestones: ["Week 2 · Learned squat, bench and deadlift setup", "Week 6 · First full program block finished", "Week 12 · Trained 3× per week for the whole block"], consistency: [{ label: "Sessions logged", value: "34 of 36" }, { label: "Weeks trained", value: "12 of 12" }] },
  { id: "sc2", title: "Back to Training", training: "Transformation coaching", weeks: 16, milestones: ["Week 1 · Restarted with two short sessions", "Week 8 · Built up to four sessions a week", "Week 16 · Kept the routine through exam season"], consistency: [{ label: "Sessions logged", value: "52 of 58" }, { label: "Check-ins", value: "16 of 16" }] },
  { id: "sc3", title: "Busy Schedule Consistency", training: "Small group training", weeks: 8, milestones: ["Week 1 · Picked two fixed group slots", "Week 4 · Added one home session", "Week 8 · Never missed two weeks in a row"], consistency: [{ label: "Sessions logged", value: "22 of 24" }, { label: "Group sessions", value: "16 of 16" }] },
];

// ── Programs ────────────────────────────────────────────────────────────────
export interface ProgramSession {
  day: string;
  exercises: [string, string][];
}
export interface Program {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "All levels";
  weeks: number;
  daysPerWeek: number;
  description: string;
  sessions: ProgramSession[];
}
export const PROGRAMS: Program[] = [
  {
    id: "pg1", title: "8-Week Strength Foundation", level: "Beginner", weeks: 8, daysPerWeek: 3,
    description: "Learn the main barbell lifts with simple, steady progression.",
    sessions: [
      { day: "Day 1 · Squat focus", exercises: [["Back squat", "3 × 5"], ["Romanian deadlift", "3 × 8"], ["Plank", "3 × 30 s"]] },
      { day: "Day 2 · Press focus", exercises: [["Bench press", "3 × 5"], ["Dumbbell row", "3 × 10"], ["Push-up", "2 × 10"]] },
      { day: "Day 3 · Pull focus", exercises: [["Deadlift", "3 × 5"], ["Overhead press", "3 × 6"], ["Lat pulldown", "3 × 10"]] },
    ],
  },
  {
    id: "pg2", title: "Beginner Training Fundamentals", level: "Beginner", weeks: 6, daysPerWeek: 2,
    description: "Two full-body sessions a week to build the habit.",
    sessions: [
      { day: "Day 1 · Full body A", exercises: [["Goblet squat", "3 × 10"], ["Incline push-up", "3 × 8"], ["Cable row", "3 × 12"]] },
      { day: "Day 2 · Full body B", exercises: [["Hip hinge drill", "3 × 10"], ["Dumbbell press", "3 × 10"], ["Farmer carry", "3 × 30 m"]] },
    ],
  },
  {
    id: "pg3", title: "Upper/Lower Hypertrophy Split", level: "Intermediate", weeks: 10, daysPerWeek: 4,
    description: "Upper and lower days twice a week with moderate volume.",
    sessions: [
      { day: "Day 1 · Upper", exercises: [["Bench press", "4 × 8"], ["Chest-supported row", "4 × 10"], ["Lateral raise", "3 × 15"]] },
      { day: "Day 2 · Lower", exercises: [["Back squat", "4 × 8"], ["Leg curl", "3 × 12"], ["Calf raise", "3 × 15"]] },
      { day: "Day 3 · Upper", exercises: [["Overhead press", "4 × 8"], ["Pull-up", "4 × 6"], ["Cable fly", "3 × 12"]] },
      { day: "Day 4 · Lower", exercises: [["Romanian deadlift", "4 × 8"], ["Split squat", "3 × 10"], ["Hanging knee raise", "3 × 12"]] },
    ],
  },
  {
    id: "pg4", title: "General Fitness Consistency Program", level: "All levels", weeks: 8, daysPerWeek: 3,
    description: "Strength, conditioning and mobility to stay consistent.",
    sessions: [
      { day: "Day 1 · Strength", exercises: [["Goblet squat", "3 × 10"], ["Dumbbell bench", "3 × 10"], ["Band pull-apart", "3 × 15"]] },
      { day: "Day 2 · Conditioning", exercises: [["Bike intervals", "8 × 30 s"], ["Kettlebell swing", "3 × 15"], ["Easy walk", "15 min"]] },
      { day: "Day 3 · Mobility + strength", exercises: [["Hip mobility flow", "10 min"], ["Step-up", "3 × 10"], ["Dumbbell row", "3 × 12"]] },
    ],
  },
];

// ── Coaching challenge preview ──────────────────────────────────────────────
export const CHALLENGE_DURATIONS = [14, 21, 30, 42];
export const CHALLENGE_OBJECTIVES = ["Train 3× per week", "Build a squat habit", "Daily 20-minute movement", "Learn the big three lifts"];
export const SPONSOR_CATEGORIES = ["None", "Fictional gym apparel brand", "Fictional local gym", "Fictional equipment brand"];
export interface ChallengeDraft {
  title: string;
  duration: number;
  objective: string;
  milestones: string[];
  sponsor: string;
}
export const DEFAULT_CHALLENGE: ChallengeDraft = { title: "30-Day Strength Kickstart", duration: 30, objective: CHALLENGE_OBJECTIVES[0], milestones: ["Finish week one", "Hit 10 sessions", "Complete the challenge"], sponsor: "None" };
export const MILESTONE_MAX = 4;

export type ChallengeErrors = Partial<Record<keyof ChallengeDraft, string>>;
export function validateChallenge(c: ChallengeDraft): ChallengeErrors {
  const e: ChallengeErrors = {};
  const t = c.title.trim();
  if (t.length < 3) e.title = "Title needs at least 3 characters.";
  else if (t.length > 40) e.title = "Keep the title under 40 characters.";
  if (!CHALLENGE_DURATIONS.includes(c.duration)) e.duration = "Choose a duration.";
  if (!CHALLENGE_OBJECTIVES.includes(c.objective)) e.objective = "Choose an objective.";
  const ms = c.milestones.map((m) => m.trim()).filter(Boolean);
  if (ms.length < 1) e.milestones = "Add at least one milestone.";
  else if (ms.length > MILESTONE_MAX) e.milestones = `Use up to ${MILESTONE_MAX} milestones.`;
  else if (ms.some((m) => m.length > 40)) e.milestones = "Keep each milestone under 40 characters.";
  if (!SPONSOR_CATEGORIES.includes(c.sponsor)) e.sponsor = "Choose a sponsor category.";
  return e;
}
/** Milestones spread evenly across the challenge; the last one lands on the final day. */
export function milestoneDays(c: ChallengeDraft): { day: number; text: string }[] {
  const ms = c.milestones.map((m) => m.trim()).filter(Boolean);
  return ms.map((text, i) => ({ day: Math.round((c.duration * (i + 1)) / ms.length), text }));
}

// ── Partnerships ────────────────────────────────────────────────────────────
export interface Partnership {
  id: string;
  title: string;
  orgLabel: string;
  type: string;
  description: string;
  eligibility: string;
  concept: string;
  activities: string[];
  fictional: true;
}
export const PARTNERSHIPS: Partnership[] = [
  {
    id: "pt1", title: "Featured Coach Challenge Sponsor", orgLabel: "Fictional fitness brand", type: "Community challenge collaboration",
    description: "A mock fitness brand collaboration involving a community training challenge.",
    eligibility: "Example: coaches who run community challenges on GYMX.",
    concept: "A coach hosts a free 30-day community training challenge featuring a fictional brand.",
    activities: ["Design the challenge workouts", "Post weekly check-in videos", "Clear #ad disclosure would be required on anything real"], fictional: true,
  },
  {
    id: "pt2", title: "Local Gym Partnership Lead", orgLabel: "Fictional local gym", type: "Gym collaboration",
    description: "A fictional gym looking to collaborate with personal trainers.",
    eligibility: "Example: trainers based near the gym who coach in person.",
    concept: "Trainers run beginner workshops at a fictional gym.",
    activities: ["Beginner lifting workshops", "Gym etiquette walkthroughs", "Community open-gym sessions"], fictional: true,
  },
  {
    id: "pt3", title: "Nutrition Coaching Brand Collaboration", orgLabel: "Fictional nutrition education brand", type: "Educational content partnership",
    description: "A fictional brand exploring educational fitness content partnerships.",
    eligibility: "Example: coaches who share general, evidence-based education.",
    concept: "General education posts about building balanced habits around training — no product or supplement claims.",
    activities: ["General habit-building education", "No medical or supplement claims", "Clear #ad disclosure would be required on anything real"], fictional: true,
  },
];

// ── Coach profile (session only; separate from Profile Studio and the Creator look) ─
export const COACH_SPECIALTIES = ["Strength coaching", "Online coaching", "Transformation coaching", "Personal training"];
export interface CoachProfileSettings {
  specialty: string;
  showService: boolean;
  showInquiryButton: boolean;
  showTestimonial: boolean;
  showPrograms: boolean;
  showTransformation: boolean;
  /** Shows the clearly-labelled VERIFICATION PREVIEW — NOT VERIFIED concept chip. */
  showVerificationPreview: boolean;
  /** Only when true (and the demo tier allows it) does the coach look appear on the real profile, this session only. */
  applied: boolean;
}
export const COACH_BANNER: [string, string, string] = ["#FFF7ED", "#C9A24A", "#1C1407"];

export interface CoachDemoState {
  leads: Lead[];
  bookings: Booking[];
  services: ServiceSettings;
  pinnedTestimonialId: string | null;
  showcaseId: string;
  challenge: ChallengeDraft;
  profile: CoachProfileSettings;
}
export const DEFAULT_COACH_STATE: CoachDemoState = {
  leads: DEMO_LEADS,
  bookings: [{ id: "bk-demo", type: "intro", dayOffset: 2, time: "5:30 PM", withName: "Morgan Test" }],
  services: DEFAULT_SERVICES,
  pinnedTestimonialId: "t1",
  showcaseId: "sc1",
  challenge: DEFAULT_CHALLENGE,
  profile: { specialty: COACH_SPECIALTIES[0], showService: true, showInquiryButton: true, showTestimonial: true, showPrograms: true, showTransformation: true, showVerificationPreview: false, applied: false },
};

/** The prototype never grants verified-coach status, whatever the tier or settings. */
export function isVerifiedCoach(): false {
  return false;
}

// ── Locked explanations ─────────────────────────────────────────────────────
export const COACH_FEATURE_INFO: Partial<Record<PremiumFeature, { title: string; body: string }>> = {
  coach_business_dashboard: { title: "Coach Command Center", body: "Profile visits, inquiries, leads, booking requests and consultations for your coaching business across 7, 30 and 90 days." },
  lead_management_preview: { title: "Client leads", body: "Organise potential clients by status, search them and keep follow-up notes in one place." },
  client_inquiry_previews: { title: "Client inquiry form", body: "Let potential clients send a structured coaching inquiry from your profile." },
  booking_form_preview: { title: "Booking preview", body: "Offer consultation slots and manage upcoming consultations." },
  coaching_service_links: { title: "Coaching services", body: "Show your coaching services on your profile and choose which one to feature." },
  testimonials: { title: "Client testimonials", body: "Showcase client feedback (with their consent) and pin a favourite." },
  transformation_showcase: { title: "Transformation showcase", body: "Present client progress stories with milestones. Results always vary." },
  coaching_program_previews: { title: "Coaching programs", body: "Preview the training programs you offer, with sample sessions." },
  premium_coaching_challenge_previews: { title: "Coaching challenges", body: "Design a coaching-led community challenge and preview how it would look." },
  coach_partnership_opportunities: { title: "Coach partnerships", body: "Discover potential collaborations with gyms and fitness brands. Nothing is guaranteed." },
  coach_profile_customization: { title: "Coach profile tools", body: "A COACH PRO badge, gold profile banner, featured service, testimonial and programs on your profile." },
};
