import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Briefcase, CalendarDays, Dumbbell, Handshake, Info, MessageSquare, Pin, PinOff, Quote, ShieldAlert, ShieldCheck, Star, Trophy } from "lucide-react-native";
import { Avatar, Badge, tap } from "../components/ui";
import { ME } from "../data";
import type { PremiumFeature } from "../membership/entitlements";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { CompareSlider } from "../pro/CompareSlider";
import { ProSection } from "../pro/ProGate";
import { C, F } from "../theme";
import type { CoachDemoState, CoachProfileSettings, Partnership } from "./coachData";
import { COACH_BANNER, COACH_COPY, COACH_SPECIALTIES, PARTNERSHIPS, PROGRAMS, SERVICES, SHOWCASES, TESTIMONIALS, pinTestimonial } from "./coachData";
import { Card, Chip, CoachSheet, DemoTag, GhostButton, ToggleRow, cs } from "./coachUi";
import { serviceIcon } from "./CoachServices";

type Change = (patch: Partial<CoachDemoState>) => void;

// ── Client results showcase ─────────────────────────────────────────────────
export function ResultsSection({ state, onChange, onLocked, onToast }: { state: CoachDemoState; onChange: Change; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void }) {
  const [selected, setSelected] = useState<string>(state.pinnedTestimonialId ?? TESTIMONIALS[0].id);
  const [viewing, setViewing] = useState<string>(state.showcaseId);
  const sc = SHOWCASES.find((x) => x.id === viewing) ?? SHOWCASES[0];
  return (
    <>
      <ProSection plan="coach" feature="testimonials" title="Client results showcase" subtitle="Sample testimonials · tap to select, pin one for your profile" onLocked={onLocked} teaserHeight={300}>
        <View style={{ gap: 10 }}>
          {TESTIMONIALS.map((t) => {
            const pinned = state.pinnedTestimonialId === t.id;
            const on = selected === t.id;
            return (
              <View key={t.id} style={[cs.card, on && cs.cardGold]}>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`Select testimonial from ${t.alias}`} onPress={() => { tap(); setSelected(t.id); }}>
                  <View style={[cs.row, { justifyContent: "space-between" }]}>
                    <DemoTag label={COACH_COPY.testimonialTag} />
                    {pinned ? <View style={s.pinned}><Pin size={11} color="#1c1407" /><Text style={s.pinnedText}>Pinned</Text></View> : null}
                  </View>
                  <View style={[cs.row, { marginTop: 10, alignItems: "flex-start" }]}>
                    <Quote size={18} color={C.gold} />
                    <Text style={[cs.body, { flex: 1 }]} numberOfLines={on ? undefined : 2}>{t.text}</Text>
                  </View>
                  <Text style={[cs.muted, { marginTop: 6 }]}>{t.alias} · {t.training}</Text>
                </Pressable>
                {on ? (
                  <View style={{ marginTop: 10 }}>
                    <GhostButton small label={pinned ? "Unpin from profile" : "Pin to profile"} icon={pinned ? <PinOff size={14} color={C.white} /> : <Pin size={14} color={C.white} />} a11y={`${pinned ? "Unpin" : "Pin"} testimonial from ${t.alias}`} onPress={() => { onChange({ pinnedTestimonialId: pinTestimonial(state.pinnedTestimonialId, t.id) }); onToast(pinned ? "Testimonial unpinned." : "Sample testimonial pinned (demo)."); }} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <Text style={[cs.muted, { marginTop: 8 }]}>These are written examples, not real client endorsements. Real testimonials would need each client's consent.</Text>
      </ProSection>

      <ProSection plan="coach" feature="transformation_showcase" title="Transformation showcase" subtitle="Neutral illustrations · switch between examples" onLocked={onLocked} teaserHeight={320}>
        <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Showcase example">
          {SHOWCASES.map((x) => <Chip key={x.id} on={viewing === x.id} label={x.title} onPress={() => setViewing(x.id)} />)}
        </View>
        <View style={{ marginTop: 12, borderRadius: 18, overflow: "hidden" }}><CompareSlider height={260} /></View>
        <Card gold style={{ marginTop: 10 }}>
          <View style={[cs.row, { justifyContent: "space-between" }]}>
            <DemoTag label={COACH_COPY.showcaseTag} />
            {state.showcaseId === sc.id ? <View style={s.pinned}><Star size={11} color="#1c1407" fill="#1c1407" /><Text style={s.pinnedText}>Featured</Text></View> : null}
          </View>
          <Text style={[cs.sheetTitle, { marginTop: 8, fontSize: 22, lineHeight: 26 }]}>{sc.title}</Text>
          <Text style={cs.muted}>{sc.training} · {sc.weeks} weeks</Text>
          <View style={{ marginTop: 10, gap: 6 }}>
            {sc.milestones.map((m) => <View key={m} style={cs.row}><Trophy size={14} color={C.gold} /><Text style={[cs.body, { flex: 1 }]}>{m}</Text></View>)}
          </View>
          <View style={[cs.row, { marginTop: 10, gap: 10 }]}>
            {sc.consistency.map((c) => (
              <View key={c.label} style={s.stat}>
                <Text style={s.statValue}>{c.value}</Text>
                <Text style={s.statLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
          {state.showcaseId !== sc.id ? <View style={{ marginTop: 10 }}><GhostButton small label="Feature on profile" icon={<Star size={14} color={C.white} />} onPress={() => { onChange({ showcaseId: sc.id }); onToast("Featured transformation updated (demo)."); }} /></View> : null}
        </Card>
        <Text style={[cs.muted, { marginTop: 8 }]}>Fictional examples. Results vary from person to person and no physical outcome is guaranteed.</Text>
      </ProSection>
    </>
  );
}

// ── Partnerships ────────────────────────────────────────────────────────────
export function PartnershipsSection({ onLocked, onOpen }: { onLocked: (f: PremiumFeature) => void; onOpen: (p: Partnership) => void }) {
  return (
    <ProSection plan="coach" feature="coach_partnership_opportunities" title="Coach partnership opportunities" subtitle="Fictional examples of future collaborations" onLocked={onLocked} teaserHeight={300}>
      <View style={{ gap: 10 }}>
        {PARTNERSHIPS.map((p) => (
          <View key={p.id} style={cs.card}>
            <DemoTag label={COACH_COPY.partnershipTag} />
            <View style={[cs.row, { marginTop: 10 }]}><Handshake size={15} color={C.gold} /><Text style={s.org}>{p.orgLabel}</Text></View>
            <Text style={[cs.h3, { marginTop: 4, fontSize: 18 }]}>{p.title}</Text>
            <Text style={[cs.body, { marginTop: 4 }]}>{p.description}</Text>
            <View style={{ marginTop: 10 }}><GhostButton small label="Explore partnership" icon={<ArrowRight size={14} color={C.white} />} a11y={`Explore partnership: ${p.title}`} onPress={() => onOpen(p)} /></View>
          </View>
        ))}
      </View>
    </ProSection>
  );
}

export function PartnershipSheet({ partnership, onClose }: { partnership: Partnership | null; onClose: () => void }) {
  return (
    <CoachSheet visible={!!partnership} onClose={onClose} closeLabel="Close partnership preview" tag={COACH_COPY.partnershipTag} footer={<GhostButton label="Back to partnerships" onPress={onClose} />}>
      {partnership ? (
        <>
          <Text style={s.org}>{partnership.orgLabel}</Text>
          <Text style={[cs.sheetTitle, { marginTop: 4 }]}>{partnership.title}</Text>
          <View style={{ marginTop: 8 }}><ComingSoonPill label="COMING SOON" /></View>
          <Text style={[cs.kicker, { marginTop: 16, marginBottom: 4 }]}>Partnership type</Text>
          <Text style={cs.body}>{partnership.type}</Text>
          <Text style={[cs.kicker, { marginTop: 12, marginBottom: 4 }]}>Example eligibility</Text>
          <Text style={cs.body}>{partnership.eligibility}</Text>
          <Text style={[cs.kicker, { marginTop: 12, marginBottom: 4 }]}>Mock collaboration concept</Text>
          <Text style={cs.body}>{partnership.concept}</Text>
          <Text style={[cs.kicker, { marginTop: 12, marginBottom: 4 }]}>Potential activities</Text>
          {partnership.activities.map((a) => <Text key={a} style={[cs.body, { marginTop: 3 }]}>→  {a}</Text>)}
          <View style={[cs.note, { marginTop: 14 }]}><ShieldCheck size={16} color={C.gold} /><Text style={cs.noteText}>{COACH_COPY.partnershipDisclaimer}</Text></View>
        </>
      ) : null}
    </CoachSheet>
  );
}

// ── Coach profile tools ─────────────────────────────────────────────────────
export function CoachProfileSection({ state, onChange, onLocked, onToast }: { state: CoachDemoState; onChange: Change; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void }) {
  const p = state.profile;
  const set = (patch: Partial<CoachProfileSettings>) => onChange({ profile: { ...p, ...patch } });
  return (
    <ProSection plan="coach" feature="coach_profile_customization" title="Coach profile" subtitle="Preview a coach look for your profile" onLocked={onLocked} teaserHeight={340}>
      <CoachProfilePreview state={state} onToast={onToast} />
      <View style={[cs.note, { marginTop: 10 }]}><ShieldAlert size={16} color={C.gold} /><Text style={cs.noteText}>{COACH_COPY.verificationNote}</Text></View>

      <Text style={[cs.kicker, { marginTop: 16, marginBottom: 8 }]}>Coaching specialty</Text>
      <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Coaching specialty">
        {COACH_SPECIALTIES.map((x) => <Chip key={x} on={p.specialty === x} label={x} onPress={() => set({ specialty: x })} />)}
      </View>
      <Card style={{ marginTop: 12, paddingVertical: 4 }}>
        <ToggleRow label="Featured service" value={p.showService} onChange={(v) => set({ showService: v })} />
        <ToggleRow label="Inquiry button preview" value={p.showInquiryButton} onChange={(v) => set({ showInquiryButton: v })} />
        <ToggleRow label="Pinned testimonial" value={p.showTestimonial} onChange={(v) => set({ showTestimonial: v })} />
        <ToggleRow label="Coaching programs" value={p.showPrograms} onChange={(v) => set({ showPrograms: v })} />
        <ToggleRow label="Featured transformation" value={p.showTransformation} onChange={(v) => set({ showTransformation: v })} />
        <ToggleRow label="Verification concept chip" hint="Always reads “Verification preview — not verified”" value={p.showVerificationPreview} onChange={(v) => set({ showVerificationPreview: v })} />
      </Card>
      <Card gold style={{ marginTop: 12, paddingVertical: 4 }}>
        <ToggleRow label="Show coach look on my profile" hint="This session only. Doesn't change Profile Studio or Creator settings." value={p.applied} onChange={(v) => { set({ applied: v }); onToast(v ? "Coach look is on for this session." : "Coach look turned off."); }} />
      </Card>
    </ProSection>
  );
}

export function VerificationPreviewChip() {
  return (
    <View style={s.verify} accessibilityLabel={COACH_COPY.verificationPreview}>
      <ShieldAlert size={12} color={C.ash} />
      <Text style={s.verifyText}>{COACH_COPY.verificationPreview}</Text>
    </View>
  );
}

function CoachProfilePreview({ state, onToast }: { state: CoachDemoState; onToast: (m: string) => void }) {
  const p = state.profile;
  const featured = SERVICES.find((x) => x.id === state.services.featuredId && state.services.visible[x.id]);
  const testimonial = TESTIMONIALS.find((t) => t.id === state.pinnedTestimonialId);
  const showcase = SHOWCASES.find((x) => x.id === state.showcaseId);
  return (
    <View style={s.preview}>
      <LinearGradient colors={COACH_BANNER} locations={[0, 0.45, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.banner} />
      <View style={{ paddingHorizontal: 14, marginTop: -28 }}>
        <Avatar username={ME.username} name={ME.name} size={56} />
        <View style={[cs.row, { marginTop: 8, flexWrap: "wrap" }]}>
          <Text style={s.name}>{ME.name}</Text>
          <Badge tone="ash">{COACH_COPY.badgeCoachPro}</Badge>
        </View>
        <View style={[cs.row, { marginTop: 6, flexWrap: "wrap" }]}>
          <View style={s.specialty}><Briefcase size={11} color={C.gold} /><Text style={s.specialtyText}>{p.specialty}</Text></View>
          {p.showVerificationPreview ? <VerificationPreviewChip /> : null}
        </View>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        {p.showService && featured ? (
          <View style={s.line}>{serviceIcon(featured.icon, 15)}<Text style={s.lineText} numberOfLines={1}>Featured: {featured.name}</Text></View>
        ) : null}
        {p.showInquiryButton ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Inquiry button preview" onPress={() => { tap(); onToast("Preview only — inquiries can't be sent in this demo."); }} style={s.inquiry}>
            <MessageSquare size={15} color="#1c1407" />
            <Text style={s.inquiryText}>Send a coaching inquiry</Text>
          </Pressable>
        ) : null}
        {p.showTestimonial && testimonial ? (
          <View style={s.line}><Quote size={15} color={C.gold} /><Text style={[s.lineText, { fontWeight: "400" }]} numberOfLines={2}>“{testimonial.text}” — {testimonial.alias}</Text></View>
        ) : null}
        {p.showPrograms ? <View style={s.line}><Dumbbell size={15} color={C.gold} /><Text style={s.lineText}>{PROGRAMS.length} coaching programs</Text></View> : null}
        {p.showTransformation && showcase ? <View style={s.line}><CalendarDays size={15} color={C.gold} /><Text style={s.lineText} numberOfLines={1}>Featured transformation: {showcase.title}</Text></View> : null}
        <View style={cs.row}><Info size={12} color={C.ash} /><Text style={cs.muted}>Mock coach profile · fictional demo content</Text></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pinned: { flexDirection: "row", alignItems: "center", gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 7, backgroundColor: C.gold },
  pinnedText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: "#1c1407" },
  stat: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: "rgba(255,247,237,0.05)" },
  statValue: { fontFamily: F.display, fontSize: 20, color: C.white },
  statLabel: { fontFamily: F.label, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  org: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.1, textTransform: "uppercase", color: C.ash },
  preview: { borderRadius: 20, overflow: "hidden", backgroundColor: "#131210", borderWidth: 1, borderColor: "rgba(255,209,102,0.4)" },
  banner: { height: 84 },
  name: { fontFamily: F.display, fontSize: 24, textTransform: "uppercase", color: C.white },
  specialty: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 24, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "rgba(255,209,102,0.12)" },
  specialtyText: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.1, textTransform: "uppercase", color: C.gold },
  verify: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 24, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(163,163,163,0.6)" },
  verifyText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 0.9, color: C.ash },
  line: { flexDirection: "row", alignItems: "center", gap: 8 },
  lineText: { flex: 1, fontSize: 13.5, fontWeight: "600", color: C.white },
  inquiry: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 42, borderRadius: 12, backgroundColor: C.gold },
  inquiryText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "#1c1407" },
});
