import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarCheck, CalendarDays, Check, Clock, Info, Pencil, Send, ShieldCheck, Trash } from "lucide-react-native";
import { tap } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { ProSection } from "../pro/ProGate";
import { C, F } from "../theme";
import type { CoachDemoState, ConsultType, InquiryErrors, InquiryForm } from "./coachData";
import {
  COACHING_TYPES,
  COACH_COPY,
  CONSULT_TYPES,
  CONTACT_METHODS,
  EMPTY_INQUIRY,
  EXAMPLE_INQUIRY,
  EXPERIENCE_LEVELS,
  MESSAGE_MAX,
  SLOT_TIMES,
  bookingDays,
  bookingLabel,
  cancelBooking,
  consultTypeLabel,
  createBooking,
  isBlocked,
  leadFromInquiry,
  rescheduleBooking,
  slotAvailable,
  validateInquiry,
} from "./coachData";
import { Card, Chip, Field, FieldError, FieldLabel, GhostButton, GoldButton, cs } from "./coachUi";

type Change = (patch: Partial<CoachDemoState>) => void;

// ── Client inquiry experience ───────────────────────────────────────────────
export function InquirySection({ state, onChange, onLocked, onToast, onGoLeads }: { state: CoachDemoState; onChange: Change; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void; onGoLeads: () => void }) {
  const [form, setForm] = useState<InquiryForm>(EMPTY_INQUIRY);
  const [tried, setTried] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const errors: InquiryErrors = tried ? validateInquiry(form) : {};
  const set = (patch: Partial<InquiryForm>) => { setCreated(null); setForm((f) => ({ ...f, ...patch })); };
  const submit = () => {
    setTried(true);
    const lead = leadFromInquiry(form, `lead-${Date.now()}`);
    if (!lead) { onToast("Check the highlighted fields."); return; }
    onChange({ leads: [lead, ...state.leads] });
    setCreated(lead.name);
    setForm(EMPTY_INQUIRY);
    setTried(false);
    onToast(COACH_COPY.inquirySent);
  };
  return (
    <ProSection plan="coach" feature="client_inquiry_previews" title="Client inquiry experience" subtitle="How a potential client could contact you" onLocked={onLocked} teaserHeight={300}>
      <Card gold>
        <View style={cs.note}><ShieldCheck size={16} color={C.gold} /><Text style={cs.noteText}>{COACH_COPY.formSafety}</Text></View>
        <Field label="Name" required value={form.name} onChange={(v) => set({ name: v })} placeholder="Example: Example Client" error={errors.name} max={40} a11y="Inquiry name" />
        <Field label="Fitness goal" required value={form.goal} onChange={(v) => set({ goal: v })} placeholder="Example: Build strength for everyday life" error={errors.goal} max={80} a11y="Inquiry fitness goal" />
        <View style={{ marginTop: 12 }}>
          <FieldLabel required>Type of coaching</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Type of coaching">
            {COACHING_TYPES.map((t) => <Chip key={t.id} on={form.coachingType === t.id} label={t.label} onPress={() => set({ coachingType: t.id })} />)}
          </View>
          <FieldError message={errors.coachingType} />
        </View>
        <View style={{ marginTop: 12 }}>
          <FieldLabel required>Experience level</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Experience level">
            {EXPERIENCE_LEVELS.map((t) => <Chip key={t.id} on={form.experience === t.id} label={t.label} onPress={() => set({ experience: t.id })} />)}
          </View>
          <FieldError message={errors.experience} />
        </View>
        <View style={{ marginTop: 12 }}>
          <FieldLabel required>Preferred contact method</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Preferred contact method">
            {CONTACT_METHODS.map((t) => <Chip key={t.id} on={form.contact === t.id} label={t.label} onPress={() => set({ contact: t.id })} />)}
          </View>
          <Text style={[cs.muted, { marginTop: 4 }]}>Only the method is chosen. The demo never asks for an email address or phone number.</Text>
          <FieldError message={errors.contact} />
        </View>
        <Field label="Short message (optional)" multiline value={form.message} onChange={(v) => set({ message: v })} placeholder="What would you like help with?" error={errors.message} max={MESSAGE_MAX} a11y="Inquiry message" />
        <View style={[cs.row, { marginTop: 14 }]}>
          <View style={{ flex: 1 }}><GhostButton small label="Fill example" onPress={() => { setTried(false); set(EXAMPLE_INQUIRY); }} /></View>
          <View style={{ flex: 1 }}><GhostButton small label="Clear" onPress={() => { setTried(false); set(EMPTY_INQUIRY); }} /></View>
        </View>
        <View style={{ marginTop: 10 }}><GoldButton label="Create demo inquiry" icon={<Send size={16} color="#1c1407" />} onPress={submit} /></View>
        {created ? (
          <View style={[s.success, { marginTop: 12 }]} accessibilityLiveRegion="polite">
            <Check size={18} color="#7ED99A" />
            <View style={{ flex: 1 }}>
              <Text style={s.successTitle}>{COACH_COPY.inquirySent}</Text>
              <Text style={cs.muted}>“{created}” was added to Client Leads for this session only.</Text>
            </View>
          </View>
        ) : null}
        {created ? <View style={{ marginTop: 8 }}><GhostButton small label="View in Client Leads" onPress={onGoLeads} /></View> : null}
      </Card>
    </ProSection>
  );
}

// ── Booking preview ─────────────────────────────────────────────────────────
export function BookingSection({ state, onChange, onLocked, onToast }: { state: CoachDemoState; onChange: Change; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void }) {
  const days = bookingDays();
  const [type, setType] = useState<ConsultType>("intro");
  const [day, setDay] = useState(1);
  const [time, setTime] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // De-duplicated: inquiries can create leads with the same name (e.g. "Example Client" twice), and names are the chip keys.
  const clients = [...new Set(["Demo client", ...state.leads.filter((l) => l.status !== "closed").slice(0, 3).map((l) => l.name)])];
  const [client, setClient] = useState(clients[0]);

  const pickDay = (d: number) => { setDay(d); setTime(null); setConfirmed(false); };
  const confirm = () => {
    if (!time) { onToast("Choose an available time."); return; }
    if (editing) {
      const next = rescheduleBooking(state.bookings, editing, day, time);
      if (next === state.bookings) { onToast("That slot isn't available."); return; }
      onChange({ bookings: next });
      setEditing(null);
      onToast("Demo booking moved. No real appointment was changed.");
    } else {
      const next = createBooking(state.bookings, { id: `bk-${Date.now()}`, type, dayOffset: day, time, withName: client });
      if (next === state.bookings) { onToast("That slot isn't available."); return; }
      onChange({ bookings: next });
      setConfirmed(true);
      onToast(COACH_COPY.bookingCreated);
    }
    setTime(null);
  };

  return (
    <ProSection plan="coach" feature="booking_form_preview" title="Booking preview" subtitle={`Consultation availability · next ${days.length} days`} onLocked={onLocked} teaserHeight={300}>
      <Card>
        {editing ? (
          <View style={[cs.note, { marginBottom: 10 }]}><Pencil size={15} color={C.gold} /><Text style={cs.noteText}>Moving {consultTypeLabel(state.bookings.find((b) => b.id === editing)!.type)}. Pick a new day and time.</Text></View>
        ) : (
          <>
            <FieldLabel>Consultation type</FieldLabel>
            <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Consultation type">
              {CONSULT_TYPES.map((t) => {
                const on = type === t.id;
                return (
                  <Pressable key={t.id} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={t.label} onPress={() => { tap(); setType(t.id); setConfirmed(false); }} style={[s.typeRow, on && s.typeOn]}>
                    <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
                    <Text style={[cs.body, { flex: 1 }, on && { color: C.white }]}>{t.label}</Text>
                    <Text style={s.mins}>{t.minutes} min</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: 12 }}>
              <FieldLabel>Fictional client</FieldLabel>
              <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Fictional client">
                {clients.map((c) => <Chip key={c} on={client === c} label={c} onPress={() => setClient(c)} />)}
              </View>
            </View>
          </>
        )}
        <View style={{ marginTop: 12 }}>
          <FieldLabel>Day</FieldLabel>
          <View style={cs.wrap} accessibilityRole="radiogroup" accessibilityLabel="Day">
            {days.map((d) => <Chip key={d.offset} on={day === d.offset} label={d.label} onPress={() => pickDay(d.offset)} />)}
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <FieldLabel>Time</FieldLabel>
          <View style={s.slots} accessibilityRole="radiogroup" accessibilityLabel="Time">
            {SLOT_TIMES.map((t) => {
              const ok = slotAvailable(state.bookings, day, t, editing ?? undefined);
              const on = time === t;
              const why = isBlocked(day, t) ? "Unavailable" : "Booked";
              return (
                <Pressable key={t} disabled={!ok} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: !ok }} aria-checked={on} aria-disabled={!ok} accessibilityLabel={ok ? t : `${t}, ${why.toLowerCase()}`} onPress={() => { tap(); setTime(t); setConfirmed(false); }} style={[s.slot, on && s.slotOn, !ok && s.slotOff]}>
                  <Clock size={13} color={on ? "#1c1407" : ok ? C.white : C.ash} />
                  <Text style={[s.slotText, on && { color: "#1c1407" }, !ok && { color: C.ash }]}>{t}</Text>
                  {!ok ? <Text style={s.slotWhy}>{why}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <Text style={[cs.muted, { marginTop: 6 }]}>Only future days are shown. Today and past slots are never bookable.</Text>
        </View>
        <View style={{ marginTop: 14, gap: 8 }}>
          <GoldButton label={editing ? "Update booking" : "Confirm demo booking"} icon={<CalendarCheck size={16} color="#1c1407" />} onPress={confirm} disabled={!time} />
          {editing ? <GhostButton small label="Cancel changes" onPress={() => { setEditing(null); setTime(null); }} /> : null}
        </View>
        {confirmed ? (
          <View style={[s.success, { marginTop: 12 }]} accessibilityLiveRegion="polite">
            <Check size={18} color="#7ED99A" />
            <Text style={[s.successTitle, { flex: 1 }]}>{COACH_COPY.bookingCreated}</Text>
          </View>
        ) : null}
      </Card>

      <Text style={[cs.kicker, { marginTop: 16, marginBottom: 8 }]}>Upcoming mock consultations · {state.bookings.length}</Text>
      <View style={{ gap: 8 }}>
        {state.bookings.map((b) => (
          <View key={b.id} style={[cs.card, cs.row, { gap: 12 }]}>
            <View style={cs.iconBox}><CalendarDays size={18} color={C.gold} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.bookTitle} numberOfLines={1}>{consultTypeLabel(b.type)}</Text>
              <Text style={cs.muted}>{bookingLabel(b)} · {b.withName}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Change ${consultTypeLabel(b.type)} on ${bookingLabel(b)}`} onPress={() => { tap(); setEditing(b.id); setDay(b.dayOffset); setTime(null); setConfirmed(false); }} style={s.iconBtn}><Pencil size={16} color={C.white} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${consultTypeLabel(b.type)} on ${bookingLabel(b)}`} onPress={() => { tap(); onChange({ bookings: cancelBooking(state.bookings, b.id) }); if (editing === b.id) setEditing(null); onToast("Demo booking cancelled. Nobody was notified."); }} style={s.iconBtn}><Trash size={16} color="#FF8A7A" /></Pressable>
          </View>
        ))}
        {state.bookings.length === 0 ? <Text style={cs.muted}>No mock consultations booked.</Text> : null}
      </View>
      <View style={[cs.note, { marginTop: 12 }]}><Info size={16} color={C.gold} /><Text style={cs.noteText}>Preview only. No calendar, email, booking service or notification is connected.</Text></View>
    </ProSection>
  );
}

const s = StyleSheet.create({
  success: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 14, backgroundColor: "rgba(110,214,140,0.1)", borderWidth: 1, borderColor: "rgba(110,214,140,0.4)" },
  successTitle: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 0.4, color: C.white },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46, paddingHorizontal: 12, borderRadius: 13, backgroundColor: "rgba(255,247,237,0.04)", borderWidth: 1, borderColor: "rgba(255,247,237,0.08)" },
  typeOn: { borderColor: C.gold, backgroundColor: "rgba(255,209,102,0.08)" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.ash, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: C.gold },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  mins: { fontFamily: F.labelHeavy, fontSize: 12, color: C.ash },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { width: "48%", flexGrow: 1, minHeight: 46, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,247,237,0.18)" },
  slotOn: { backgroundColor: C.gold, borderColor: C.gold },
  slotOff: { borderStyle: "dashed", borderColor: "rgba(163,163,163,0.3)", opacity: 0.7 },
  slotText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.6, color: C.white },
  slotWhy: { fontSize: 10.5, color: C.ash },
  bookTitle: { fontFamily: F.labelHeavy, fontSize: 15, color: C.white },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,247,237,0.06)" },
});
