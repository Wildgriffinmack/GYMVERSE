import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, Inbox, Plus, Search, ShieldCheck, Square, SquareCheck, StickyNote } from "lucide-react-native";
import { tap } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { ProSection } from "../pro/ProGate";
import { C, F } from "../theme";
import type { CoachDemoState, Lead, LeadFilter } from "./coachData";
import {
  COACH_COPY,
  FOLLOW_UP_MAX,
  LEAD_STATUSES,
  LEAD_TRANSITIONS,
  addFollowUp,
  coachingTypeLabel,
  dateLabel,
  filterLeads,
  nextStep,
  setLeadStatus,
  sourceLabel,
  statusCounts,
  statusLabel,
  toggleFollowUp,
} from "./coachData";
import { Card, Chip, CoachSheet, GhostButton, StatusBadge, cs } from "./coachUi";

type Change = (patch: Partial<CoachDemoState>) => void;

export function LeadsSection({ state, onLocked, onOpenLead }: { state: CoachDemoState; onLocked: (f: PremiumFeature) => void; onOpenLead: (id: string) => void }) {
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [query, setQuery] = useState("");
  const counts = statusCounts(state.leads);
  const shown = filterLeads(state.leads, filter, query);
  const filters: { id: LeadFilter; label: string }[] = [{ id: "all", label: "All" }, ...LEAD_STATUSES.map((s) => ({ id: s.id, label: s.label }))];
  return (
    <ProSection plan="coach" feature="lead_management_preview" title="Client leads" subtitle="Fictional potential clients · tap a lead for details" onLocked={onLocked} teaserHeight={300}>
      <View style={s.search}>
        <Search size={17} color={C.ash} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search name, goal, interest or source" placeholderTextColor="rgba(255,247,237,0.4)" style={s.searchInput} accessibilityLabel="Search leads" />
      </View>
      <View style={[cs.wrap, { marginTop: 10 }]} accessibilityRole="radiogroup" accessibilityLabel="Filter by status">
        {filters.map((f) => <Chip key={f.id} on={filter === f.id} label={f.label} count={counts[f.id]} onPress={() => setFilter(f.id)} />)}
      </View>
      <View style={{ gap: 10, marginTop: 12 }}>
        {shown.map((l) => <LeadCard key={l.id} lead={l} onPress={() => onOpenLead(l.id)} />)}
        {shown.length === 0 ? (
          <Card><View style={cs.row}><Inbox size={18} color={C.ash} /><Text style={cs.muted}>No fictional leads match this filter.</Text></View></Card>
        ) : null}
      </View>
      <View style={[cs.note, { marginTop: 12 }]}><ShieldCheck size={16} color={C.gold} /><Text style={cs.noteText}>{COACH_COPY.leadPrivacy}</Text></View>
    </ProSection>
  );
}

function LeadCard({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const open = lead.followUps.filter((f) => !f.done).length;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${lead.name}, ${statusLabel(lead.status)}. Open lead details`} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [cs.card, { opacity: pressed ? 0.85 : 1, gap: 6 }]}>
      <View style={[cs.row, { justifyContent: "space-between" }]}>
        <Text style={cs.h3} numberOfLines={1}>{lead.name}</Text>
        <StatusBadge status={lead.status} />
      </View>
      <Text style={s.meta}>{coachingTypeLabel(lead.interest)} · {lead.daysAgo === 0 ? "Today" : dateLabel(-lead.daysAgo)}{lead.sessionOnly ? " · Created this session" : ""}</Text>
      <Text style={cs.body} numberOfLines={1}>Goal: {lead.goal}</Text>
      <View style={[cs.row, { justifyContent: "space-between" }]}>
        <Text style={s.source} numberOfLines={1}>From: {sourceLabel(lead.source)}</Text>
        {open ? <Text style={s.open}>{open} open follow-up{open === 1 ? "" : "s"}</Text> : null}
      </View>
      <View style={s.next}><ArrowRight size={13} color={C.gold} /><Text style={s.nextText}>Next: {nextStep(lead.status)}</Text></View>
    </Pressable>
  );
}

export function LeadDetailSheet({ leadId, state, onChange, onClose, onToast }: { leadId: string | null; state: CoachDemoState; onChange: Change; onClose: () => void; onToast: (m: string) => void }) {
  const lead = state.leads.find((l) => l.id === leadId) ?? null;
  const [note, setNote] = useState("");
  const add = () => {
    if (!lead) return;
    const next = addFollowUp(state.leads, lead.id, note, `fu-${Date.now()}`);
    if (next === state.leads) { onToast(note.trim() ? `Keep notes under ${FOLLOW_UP_MAX} characters.` : "Write a follow-up note first."); return; }
    onChange({ leads: next });
    setNote("");
  };
  return (
    <CoachSheet visible={!!lead} onClose={() => { setNote(""); onClose(); }} closeLabel="Close lead details" tag="FICTIONAL LEAD · DEMO" footer={<GhostButton label="Back to leads" onPress={() => { setNote(""); onClose(); }} />}>
      {lead ? (
        <>
          <Text style={cs.sheetTitle}>{lead.name}</Text>
          <View style={{ marginTop: 6 }}><StatusBadge status={lead.status} /></View>
          <View style={s.grid}>
            <Info label="Coaching interest" value={coachingTypeLabel(lead.interest)} />
            <Info label="Inquiry date" value={lead.daysAgo === 0 ? "Today" : dateLabel(-lead.daysAgo)} />
            <Info label="Training goal" value={lead.goal} />
            <Info label="Lead origin" value={sourceLabel(lead.source)} />
          </View>
          {lead.message ? (
            <Card style={{ marginTop: 12 }}>
              <Text style={cs.kicker}>Mock message</Text>
              <Text style={[cs.body, { marginTop: 4 }]}>“{lead.message}”</Text>
            </Card>
          ) : null}
          <View style={[s.next, { marginTop: 12 }]}><ArrowRight size={13} color={C.gold} /><Text style={s.nextText}>Next step: {nextStep(lead.status)}</Text></View>

          <Text style={[cs.kicker, { marginTop: 16, marginBottom: 8 }]}>Change status</Text>
          <View style={cs.wrap}>
            {LEAD_TRANSITIONS[lead.status].map((to) => (
              <GhostButton key={to} small label={to === "new" ? "Reopen" : statusLabel(to)} a11y={`Move ${lead.name} to ${statusLabel(to)}`} onPress={() => { onChange({ leads: setLeadStatus(state.leads, lead.id, to) }); onToast(`Moved to ${statusLabel(to)}. Demo only — nobody was contacted.`); }} />
            ))}
          </View>

          <Text style={[cs.kicker, { marginTop: 16, marginBottom: 6 }]}>Follow-up notes</Text>
          {lead.followUps.length === 0 ? <Text style={cs.muted}>No follow-ups yet.</Text> : null}
          {lead.followUps.map((f) => (
            <Pressable key={f.id} accessibilityRole="checkbox" accessibilityState={{ checked: f.done }} aria-checked={f.done} accessibilityLabel={`Follow-up: ${f.text}`} onPress={() => { tap(); onChange({ leads: toggleFollowUp(state.leads, lead.id, f.id) }); }} style={s.follow}>
              {f.done ? <SquareCheck size={19} color={C.gold} /> : <Square size={19} color={C.ash} />}
              <Text style={[cs.body, { flex: 1 }, f.done && s.done]}>{f.text}</Text>
            </Pressable>
          ))}
          <View style={[cs.row, { marginTop: 8 }]}>
            <View style={[s.search, { flex: 1, marginTop: 0 }]}>
              <StickyNote size={16} color={C.ash} />
              <TextInput value={note} onChangeText={setNote} placeholder="Add a mock follow-up note" placeholderTextColor="rgba(255,247,237,0.4)" style={s.searchInput} accessibilityLabel="New follow-up note" onSubmitEditing={add} returnKeyType="done" />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Add follow-up note" onPress={() => { tap(); add(); }} style={s.addBtn}><Plus size={20} color="#1c1407" /></Pressable>
          </View>
          <Text style={[cs.muted, { marginTop: 10 }]}>{COACH_COPY.leadPrivacy}</Text>
        </>
      ) : null}
    </CoachSheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.info}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, height: 46, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.05)", borderWidth: 1, borderColor: "rgba(255,247,237,0.12)" },
  searchInput: { flex: 1, height: "100%", fontSize: 14.5, color: C.white },
  meta: { fontSize: 12.5, color: C.ash },
  source: { flex: 1, fontSize: 12.5, color: "rgba(255,247,237,0.7)" },
  open: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 0.8, textTransform: "uppercase", color: C.gold },
  next: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  nextText: { fontSize: 12.5, color: C.gold },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  info: { width: "48%", flexGrow: 1, padding: 10, borderRadius: 12, backgroundColor: "rgba(255,247,237,0.04)" },
  infoLabel: { fontFamily: F.label, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  infoValue: { marginTop: 3, fontSize: 13.5, color: C.white },
  follow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, paddingVertical: 6 },
  done: { color: C.ash, textDecorationLine: "line-through" },
  addBtn: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.gold },
});
