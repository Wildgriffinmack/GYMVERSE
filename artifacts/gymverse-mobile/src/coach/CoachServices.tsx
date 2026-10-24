import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { CalendarDays, Dumbbell, Eye, Flag, Info, Monitor, Plus, Star, Trash, TrendingUp, Trophy, User, Users } from "lucide-react-native";
import { Avatar, tap } from "../components/ui";
import { ME } from "../data";
import type { PremiumFeature } from "../membership/entitlements";
import { ProSection } from "../pro/ProGate";
import { C, F } from "../theme";
import type { ChallengeDraft, CoachDemoState, CoachService, Program, ServiceIcon } from "./coachData";
import {
  CHALLENGE_DURATIONS,
  CHALLENGE_OBJECTIVES,
  COACH_COPY,
  MILESTONE_MAX,
  PROGRAMS,
  SERVICES,
  SPONSOR_CATEGORIES,
  milestoneDays,
  setFeaturedService,
  toggleServiceVisibility,
  validateChallenge,
  visibleServices,
} from "./coachData";
import { Card, Chip, CoachSheet, Field, FieldError, FieldLabel, GhostButton, cs } from "./coachUi";

type Change = (patch: Partial<CoachDemoState>) => void;

export function serviceIcon(icon: ServiceIcon, size = 18, color: string = C.gold): ReactNode {
  if (icon === "monitor") return <Monitor size={size} color={color} />;
  if (icon === "trending") return <TrendingUp size={size} color={color} />;
  if (icon === "users") return <Users size={size} color={color} />;
  return <User size={size} color={color} />;
}

// ── Services ────────────────────────────────────────────────────────────────
export function ServicesSection({ state, onChange, onLocked, onOpenService }: { state: CoachDemoState; onChange: Change; onLocked: (f: PremiumFeature) => void; onOpenService: (s: CoachService) => void }) {
  const svc = state.services;
  const shown = visibleServices(svc);
  return (
    <ProSection plan="coach" feature="coaching_service_links" title="My coaching services" subtitle="Choose what appears on your coach profile" onLocked={onLocked} teaserHeight={300}>
      <View style={{ gap: 10 }}>
        {SERVICES.map((x) => {
          const visible = !!svc.visible[x.id];
          const featured = svc.featuredId === x.id;
          return (
            <View key={x.id} style={[cs.card, featured && cs.cardGold, !visible && { opacity: 0.6 }]}>
              <View style={[cs.row, { gap: 12, alignItems: "flex-start" }]}>
                <View style={cs.iconBox}>{serviceIcon(x.icon)}</View>
                <View style={{ flex: 1 }}>
                  <View style={[cs.row, { flexWrap: "wrap" }]}>
                    <Text style={cs.h3}>{x.name}</Text>
                    {featured ? <View style={s.featured}><Star size={11} color="#1c1407" fill="#1c1407" /><Text style={s.featuredText}>Featured</Text></View> : null}
                  </View>
                  <Text style={[cs.body, { marginTop: 2 }]}>{x.description}</Text>
                  <Text style={[cs.muted, { marginTop: 4 }]}>{x.format} · {x.duration}</Text>
                </View>
              </View>
              <View style={[cs.row, { marginTop: 10, justifyContent: "space-between" }]}>
                <GhostButton small label="Preview details" icon={<Eye size={14} color={C.white} />} a11y={`Preview details: ${x.name}`} onPress={() => onOpenService(x)} />
                <View style={cs.row}>
                  {visible && !featured ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Feature ${x.name}`} onPress={() => { tap(); onChange({ services: setFeaturedService(svc, x.id) }); }} style={s.starBtn}><Star size={16} color={C.gold} /></Pressable>
                  ) : null}
                  <Text style={cs.muted}>Show</Text>
                  <Switch value={visible} onValueChange={() => { tap(); onChange({ services: toggleServiceVisibility(svc, x.id) }); }} trackColor={{ true: C.gold, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel={`Show ${x.name} on profile`} />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={[cs.kicker, { marginTop: 16, marginBottom: 8 }]}>How it looks on a mock coach profile</Text>
      <Card gold>
        <View style={cs.row}>
          <Avatar username={ME.username} name={ME.name} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={cs.h3}>@{ME.username}</Text>
            <Text style={cs.muted}>Mock coach profile · demo</Text>
          </View>
        </View>
        <View style={{ gap: 6, marginTop: 10 }}>
          {shown.map((x) => (
            <View key={x.id} style={[s.profileSvc, svc.featuredId === x.id && s.profileSvcOn]}>
              {serviceIcon(x.icon, 15, svc.featuredId === x.id ? "#1c1407" : C.gold)}
              <Text style={[s.profileSvcText, svc.featuredId === x.id && { color: "#1c1407" }]} numberOfLines={1}>{x.name}</Text>
              {svc.featuredId === x.id ? <Star size={13} color="#1c1407" fill="#1c1407" /> : null}
            </View>
          ))}
          {shown.length === 0 ? <Text style={cs.muted}>No services are visible. Turn one on above.</Text> : null}
        </View>
      </Card>
      <Text style={[cs.muted, { marginTop: 8 }]}>No prices or payments. Services are shown for information only.</Text>
    </ProSection>
  );
}

export function ServiceSheet({ service, onClose }: { service: CoachService | null; onClose: () => void }) {
  return (
    <CoachSheet visible={!!service} onClose={onClose} closeLabel="Close service preview" tag="SERVICE PREVIEW · DEMO" footer={<GhostButton label="Back to services" onPress={onClose} />}>
      {service ? (
        <>
          <View style={[cs.row, { gap: 12 }]}>
            <View style={cs.iconBox}>{serviceIcon(service.icon, 20)}</View>
            <Text style={[cs.sheetTitle, { flex: 1 }]}>{service.name}</Text>
          </View>
          <Text style={[cs.body, { marginTop: 8 }]}>{service.description}</Text>
          <View style={[cs.wrap, { marginTop: 12 }]}>
            <View style={s.pill}><Text style={s.pillText}>{service.format}</Text></View>
            <View style={s.pill}><Text style={s.pillText}>{service.duration}</Text></View>
          </View>
          <Text style={[cs.kicker, { marginTop: 16, marginBottom: 6 }]}>What it could include</Text>
          {service.details.map((d) => <Text key={d} style={[cs.body, { marginTop: 4 }]}>→  {d}</Text>)}
          <View style={[cs.note, { marginTop: 14 }]}><Info size={16} color={C.gold} /><Text style={cs.noteText}>Example service for demonstration. No prices, sign-ups or transactions exist in this prototype.</Text></View>
        </>
      ) : null}
    </CoachSheet>
  );
}

// ── Programs ────────────────────────────────────────────────────────────────
export function ProgramsSection({ onLocked, onOpen }: { onLocked: (f: PremiumFeature) => void; onOpen: (p: Program) => void }) {
  return (
    <ProSection plan="coach" feature="coaching_program_previews" title="Coaching programs" subtitle="Example programs you could showcase" onLocked={onLocked} teaserHeight={280}>
      <View style={{ gap: 10 }}>
        {PROGRAMS.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.title}. Open program preview`} onPress={() => { tap(); onOpen(p); }} style={({ pressed }) => [cs.card, { opacity: pressed ? 0.85 : 1 }]}>
            <View style={[cs.row, { gap: 12 }]}>
              <View style={cs.iconBox}><Dumbbell size={18} color={C.gold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={cs.h3}>{p.title}</Text>
                <Text style={cs.muted}>{p.level} · {p.weeks} weeks · {p.daysPerWeek} days/week</Text>
              </View>
            </View>
            <Text style={[cs.body, { marginTop: 8 }]}>{p.description}</Text>
            <Text style={[s.openLink, { marginTop: 8 }]}>Open preview →</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[cs.muted, { marginTop: 8 }]}>{COACH_COPY.programNote}</Text>
    </ProSection>
  );
}

export function ProgramSheet({ program, onClose }: { program: Program | null; onClose: () => void }) {
  return (
    <CoachSheet visible={!!program} onClose={onClose} closeLabel="Close program preview" tag="PROGRAM PREVIEW · DEMO" footer={<GhostButton label="Back to programs" onPress={onClose} />}>
      {program ? (
        <>
          <Text style={cs.sheetTitle}>{program.title}</Text>
          <View style={[cs.wrap, { marginTop: 8 }]}>
            <View style={s.pill}><Text style={s.pillText}>{program.level}</Text></View>
            <View style={s.pill}><Text style={s.pillText}>{program.weeks} weeks</Text></View>
            <View style={s.pill}><Text style={s.pillText}>{program.daysPerWeek} days / week</Text></View>
          </View>
          <Text style={[cs.body, { marginTop: 10 }]}>{program.description}</Text>
          <Text style={[cs.kicker, { marginTop: 16, marginBottom: 8 }]}>Sample week</Text>
          <View style={{ gap: 8 }}>
            {program.sessions.map((sess) => (
              <Card key={sess.day}>
                <Text style={s.sessDay}>{sess.day}</Text>
                {sess.exercises.map(([name, sets]) => (
                  <View key={name} style={s.exRow}>
                    <Text style={[cs.body, { flex: 1 }]}>{name}</Text>
                    <Text style={s.sets}>{sets}</Text>
                  </View>
                ))}
              </Card>
            ))}
          </View>
          <View style={[cs.note, { marginTop: 12 }]}><Info size={16} color={C.gold} /><Text style={cs.noteText}>{COACH_COPY.programNote} Programs can't be assigned, sold or delivered in this prototype.</Text></View>
        </>
      ) : null}
    </CoachSheet>
  );
}

// ── Coaching challenge preview ──────────────────────────────────────────────
export function ChallengeSection({ state, onChange, onLocked }: { state: CoachDemoState; onChange: Change; onLocked: (f: PremiumFeature) => void }) {
  const c = state.challenge;
  const set = (patch: Partial<ChallengeDraft>) => onChange({ challenge: { ...c, ...patch } });
  const errors = validateChallenge(c);
  const valid = Object.keys(errors).length === 0;
  const timeline = milestoneDays(c);
  const [draftMs, setDraftMs] = useState("");
  const addMilestone = () => {
    const t = draftMs.trim();
    if (!t || c.milestones.length >= MILESTONE_MAX) return;
    set({ milestones: [...c.milestones, t] });
    setDraftMs("");
  };
  return (
    <ProSection plan="coach" feature="premium_coaching_challenge_previews" title="Coaching challenges" subtitle="Design a community challenge · preview only" onLocked={onLocked} teaserHeight={300}>
      <Card>
        <Field label="Challenge title" required value={c.title} onChange={(v) => set({ title: v })} error={errors.title} max={40} />
        <View style={{ marginTop: 12 }}>
          <FieldLabel required>Duration</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Duration">
            {CHALLENGE_DURATIONS.map((d) => <Chip key={d} on={c.duration === d} label={`${d} days`} onPress={() => set({ duration: d })} />)}
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <FieldLabel required>Training objective</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Training objective">
            {CHALLENGE_OBJECTIVES.map((o) => <Chip key={o} on={c.objective === o} label={o} onPress={() => set({ objective: o })} />)}
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <FieldLabel required>{`Milestones (up to ${MILESTONE_MAX})`}</FieldLabel>
          {c.milestones.map((m, i) => (
            <View key={i} style={[cs.row, { marginBottom: 6 }]}>
              <TextInput value={m} onChangeText={(v) => set({ milestones: c.milestones.map((x, j) => (j === i ? v : x)) })} style={[s.msInput, { flex: 1 }]} accessibilityLabel={`Milestone ${i + 1}`} placeholderTextColor="rgba(255,247,237,0.35)" />
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove milestone ${i + 1}`} onPress={() => { tap(); set({ milestones: c.milestones.filter((_, j) => j !== i) }); }} style={s.msBtn}><Trash size={15} color="#FF8A7A" /></Pressable>
            </View>
          ))}
          {c.milestones.length < MILESTONE_MAX ? (
            <View style={cs.row}>
              <TextInput value={draftMs} onChangeText={setDraftMs} placeholder="Add a milestone" placeholderTextColor="rgba(255,247,237,0.35)" style={[s.msInput, { flex: 1 }]} accessibilityLabel="New milestone" onSubmitEditing={addMilestone} />
              <Pressable accessibilityRole="button" accessibilityLabel="Add milestone" onPress={() => { tap(); addMilestone(); }} style={[s.msBtn, { backgroundColor: C.gold }]}><Plus size={17} color="#1c1407" /></Pressable>
            </View>
          ) : null}
          <FieldError message={errors.milestones} />
        </View>
        <View style={{ marginTop: 12 }}>
          <FieldLabel>Sponsor category (optional, fictional)</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Sponsor category">
            {SPONSOR_CATEGORIES.map((o) => <Chip key={o} on={c.sponsor === o} label={o} onPress={() => set({ sponsor: o })} />)}
          </View>
        </View>
      </Card>

      <Text style={[cs.kicker, { marginTop: 16, marginBottom: 8 }]}>Live preview</Text>
      <Card gold>
        <View style={[cs.row, { justifyContent: "space-between" }]}>
          <View style={cs.row}><Trophy size={16} color={C.gold} /><Text style={cs.kicker}>Coaching challenge · preview</Text></View>
          {!valid ? <Text style={s.invalid}>Fix the form</Text> : null}
        </View>
        <Text style={[cs.sheetTitle, { marginTop: 8 }]} numberOfLines={2}>{c.title.trim() || "Untitled challenge"}</Text>
        <View style={[cs.wrap, { marginTop: 8 }]}>
          <View style={s.pill}><CalendarDays size={12} color={C.white} /><Text style={s.pillText}>{c.duration} days</Text></View>
          <View style={s.pill}><Flag size={12} color={C.white} /><Text style={s.pillText}>{c.objective}</Text></View>
        </View>
        <View style={{ marginTop: 12, gap: 8 }}>
          {timeline.map((m, i) => (
            <View key={i} style={cs.row}>
              <View style={s.dayBadge}><Text style={s.dayBadgeText}>Day {m.day}</Text></View>
              <Text style={[cs.body, { flex: 1 }]} numberOfLines={2}>{m.text}</Text>
            </View>
          ))}
        </View>
        {c.sponsor !== "None" ? <Text style={[cs.muted, { marginTop: 10 }]}>Sponsor category: {c.sponsor} (fictional, not a real sponsor)</Text> : null}
      </Card>
      <Text style={[cs.muted, { marginTop: 8 }]}>Preview only. Nothing is published to the feed, and there are no participant payments or rewards.</Text>
    </ProSection>
  );
}

const s = StyleSheet.create({
  featured: { flexDirection: "row", alignItems: "center", gap: 3, height: 20, paddingHorizontal: 7, borderRadius: 6, backgroundColor: C.gold },
  featuredText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: "#1c1407" },
  starBtn: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,209,102,0.4)" },
  profileSvc: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 38, paddingHorizontal: 11, borderRadius: 11, backgroundColor: "rgba(255,247,237,0.05)" },
  profileSvcOn: { backgroundColor: C.gold },
  profileSvcText: { flex: 1, fontFamily: F.labelHeavy, fontSize: 13.5, letterSpacing: 0.4, color: C.white },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: "rgba(255,247,237,0.08)" },
  pillText: { fontSize: 12.5, color: C.white },
  openLink: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.gold },
  sessDay: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 0.6, color: C.gold, marginBottom: 6 },
  exRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  sets: { fontFamily: F.labelHeavy, fontSize: 14, color: C.white },
  msInput: { height: 42, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, color: C.white, backgroundColor: "rgba(255,247,237,0.05)", borderWidth: 1, borderColor: "rgba(255,247,237,0.12)" },
  msBtn: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,247,237,0.06)" },
  invalid: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: "#FF8A7A" },
  dayBadge: { minWidth: 62, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,209,102,0.15)" },
  dayBadgeText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 0.8, color: C.gold },
});
