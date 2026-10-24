import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowRight, Briefcase, Check, EyeOff, Flag, Handshake, Info, ShieldCheck, Tag } from "lucide-react-native";
import { tap } from "../components/ui";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C } from "../theme";
import type { SponsoredPlacement } from "./sponsorData";
import { REPORT_REASONS, SPONSOR_COPY, sponsorCategoryLabel, whyAmISeeingThis } from "./sponsorData";
import { BrandMark, DemoBrandTag, SponsorSheet, ss } from "./sponsorUi";

export type SponsorSheetMode = "detail" | "options" | "why" | "report";
export type SponsorSheetState = { mode: SponsorSheetMode; placement: SponsoredPlacement } | null;

type Props = {
  state: SponsorSheetState;
  onState: (s: SponsorSheetState) => void;
  isPremium: boolean;
  frequency: string;
  /** Entitlement results from the shared membership check. */
  canBrandCampaigns: boolean;
  canCoachPartnerships: boolean;
  canProDeals: boolean;
  onHide: (p: SponsoredPlacement) => void;
  onReport: (p: SponsoredPlacement, reason: string) => void;
  onOpenDeals: () => void;
  onOpenCreator: () => void;
  onOpenCoach: () => void;
};

export function SponsorSheets({ state, onState, isPremium, frequency, canBrandCampaigns, canCoachPartnerships, canProDeals, onHide, onReport, onOpenDeals, onOpenCreator, onOpenCoach }: Props) {
  const close = () => onState(null);
  const p = state?.placement;
  const [reason, setReason] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  useEffect(() => { setReason(null); setReported(false); }, [state?.mode, p?.id]);

  const Btn = ({ label, icon, onPress, a11y }: { label: string; icon?: ReactNode; onPress: () => void; a11y?: string }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y ?? label} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [ss.btn, { opacity: pressed ? 0.75 : 1 }]}>
      {icon}
      <Text style={ss.btnText}>{label}</Text>
    </Pressable>
  );

  if (!state || !p) return <SponsorSheet visible={false} onClose={close} closeLabel="Close">{null}</SponsorSheet>;

  if (state.mode === "options") {
    return (
      <SponsorSheet visible onClose={close} closeLabel="Close sponsored post options">
        <View style={ss.row}><BrandMark brand={p.brand} size={36} /><Text style={[ss.title, { fontSize: 20, flex: 1 }]} numberOfLines={1}>{p.brand.name}</Text></View>
        <View style={{ gap: 8, marginTop: 14 }}>
          <Btn label="Why am I seeing this?" icon={<Info size={16} color={C.white} />} onPress={() => onState({ mode: "why", placement: p })} />
          <Btn label="Hide this sponsored post" icon={<EyeOff size={16} color={C.white} />} onPress={() => onHide(p)} />
          <Btn label="Report sponsored content" icon={<Flag size={16} color="#FF8A7A" />} onPress={() => onState({ mode: "report", placement: p })} />
        </View>
      </SponsorSheet>
    );
  }

  if (state.mode === "why") {
    return (
      <SponsorSheet visible onClose={close} closeLabel="Close explanation" footer={<Btn label="Back to options" onPress={() => onState({ mode: "options", placement: p })} />}>
        <Text style={ss.title}>Why am I seeing this?</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {whyAmISeeingThis(isPremium).map((t) => <Text key={t} style={ss.body}>{t}</Text>)}
        </View>
        <View style={[ss.note, { marginTop: 14 }]}><Info size={16} color={C.gold} /><Text style={ss.noteText}>Your current demo frequency: {frequency}.</Text></View>
      </SponsorSheet>
    );
  }

  if (state.mode === "report") {
    return (
      <SponsorSheet
        visible
        onClose={close}
        closeLabel="Close report"
        footer={reported ? (
          <>
            <Btn label="Hide this sponsored post too" icon={<EyeOff size={16} color={C.white} />} onPress={() => onHide(p)} />
            <Btn label="Done" onPress={close} />
          </>
        ) : (
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !reason }} aria-disabled={!reason} disabled={!reason} onPress={() => { tap(); if (reason) { onReport(p, reason); setReported(true); } }} style={[ss.btn, { backgroundColor: reason ? C.flame : "transparent", borderColor: reason ? C.flame : "rgba(255,247,237,0.18)", opacity: reason ? 1 : 0.5 }]}>
            <Flag size={16} color="#fff" />
            <Text style={ss.btnText}>Save demo report</Text>
          </Pressable>
        )}
      >
        <Text style={ss.title}>Report sponsored content</Text>
        <Text style={[ss.muted, { marginTop: 4 }]}>Sponsored post · {p.brand.name} · {p.campaign.headline}</Text>
        {reported ? (
          <View style={[ss.note, { marginTop: 14, borderColor: "rgba(110,214,140,0.45)" }]} accessibilityLiveRegion="polite">
            <Check size={16} color="#7ED99A" />
            <Text style={ss.noteText}>{SPONSOR_COPY.reportSaved}</Text>
          </View>
        ) : (
          <View style={{ gap: 8, marginTop: 14 }} accessibilityRole="radiogroup" accessibilityLabel="Report reason">
            {REPORT_REASONS.map((r) => {
              const on = reason === r;
              return (
                <Pressable key={r} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} onPress={() => { tap(); setReason(r); }} style={[ss.card, ss.row, on && { borderColor: C.flame, backgroundColor: "rgba(255,90,31,0.1)" }]}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: on ? C.flame : C.ash, alignItems: "center", justifyContent: "center" }}>{on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.flame }} /> : null}</View>
                  <Text style={[ss.body, { flex: 1 }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={[ss.note, { marginTop: 12 }]}><ShieldCheck size={16} color={C.gold} /><Text style={ss.noteText}>{SPONSOR_COPY.reportNote} Reporting and blocking stay free on every plan.</Text></View>
      </SponsorSheet>
    );
  }

  // detail
  return (
    <SponsorSheet visible onClose={close} closeLabel="Close sponsored offer" footer={<Btn label="Back to feed" onPress={close} />}>
      <View style={ss.row}>
        <BrandMark brand={p.brand} size={48} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[ss.title, { fontSize: 22, lineHeight: 26 }]}>{p.brand.name}</Text>
          <DemoBrandTag />
        </View>
      </View>
      <Text style={[ss.title, { marginTop: 14 }]}>{p.campaign.headline}</Text>
      <View style={{ marginTop: 8 }}><ComingSoonPill label="OFFERS COMING SOON" /></View>
      <Text style={[ss.kicker, { marginTop: 16, marginBottom: 4 }]}>Campaign concept</Text>
      <Text style={ss.body}>{p.campaign.concept}</Text>
      <Text style={[ss.kicker, { marginTop: 12, marginBottom: 4 }]}>Fitness category</Text>
      <Text style={ss.body}>{sponsorCategoryLabel(p.campaign.category)}</Text>
      <Text style={[ss.kicker, { marginTop: 12, marginBottom: 4 }]}>Example offer</Text>
      <View style={ss.row}><Tag size={14} color={C.gold} /><Text style={[ss.body, { flex: 1 }]}>{p.campaign.exampleOffer}</Text></View>
      <View style={[ss.note, { marginTop: 14 }]}><ShieldCheck size={16} color={C.gold} /><Text style={ss.noteText}>{SPONSOR_COPY.disclaimer}</Text></View>

      <View style={{ gap: 8, marginTop: 14 }}>
        <Btn label={canProDeals ? "Browse Pro Deals" : "Preview Pro Deals"} icon={<ArrowRight size={16} color={C.white} />} onPress={onOpenDeals} />
        {canBrandCampaigns ? <Btn label="Brand campaigns in Creator Studio" icon={<Briefcase size={16} color={C.white} />} onPress={onOpenCreator} /> : null}
        {canCoachPartnerships ? <Btn label="Partnerships in Command Center" icon={<Handshake size={16} color={C.white} />} onPress={onOpenCoach} /> : null}
      </View>
      <Text style={[ss.muted, { marginTop: 10 }]}>{SPONSOR_COPY.seenIsNotEligible}</Text>
    </SponsorSheet>
  );
}
