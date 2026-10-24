import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Eye, Megaphone, RotateCcw } from "lucide-react-native";
import { Label, tap } from "../components/ui";
import { C, F } from "../theme";
import { SPONSOR_CAMPAIGNS, brandById, sponsorSlots } from "./sponsorData";

type Props = {
  frequency: string;
  gapAt: (slot: number) => number;
  organicCount: number;
  extendedFeed: boolean;
  onExtendedFeed: (on: boolean) => void;
  hiddenCampaignIds: string[];
  onResetHidden: () => void;
  reportCount: number;
  onPreviewCampaign: (campaignId: string) => void;
};

/** DEVELOPER TOOL — sponsor testing controls, shown inside the existing developer switcher only. */
export function SponsorDevPanel({ frequency, gapAt, organicCount, extendedFeed, onExtendedFeed, hiddenCampaignIds, onResetHidden, reportCount, onPreviewCampaign }: Props) {
  if (!__DEV__) return null;
  const plan = sponsorSlots(organicCount, gapAt);
  const shown = plan.filter((p) => !hiddenCampaignIds.includes(p.campaignId));
  return (
    <View style={s.box}>
      <View style={s.head}><Megaphone size={15} color={C.flame} /><Text style={s.title}>Sponsor testing</Text></View>
      <Text style={s.text}>Frequency for this demo tier: {frequency}. Switch tiers above to compare.</Text>

      <View style={s.toggle}>
        <View style={{ flex: 1 }}>
          <Text style={s.toggleLabel}>Extended demo feed</Text>
          <Text style={s.hint}>Adds labelled placeholder posts to Home so sponsor spacing is visible. Development only.</Text>
        </View>
        <Switch value={extendedFeed} onValueChange={(v) => { tap(); onExtendedFeed(v); }} trackColor={{ true: C.flame, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel="Extended demo feed" />
      </View>

      <Label style={{ marginTop: 10 }}>{`For You feed · ${organicCount} organic posts · ${shown.length} sponsored`}</Label>
      <Text style={s.mono}>
        {plan.length ? plan.map((p) => `#${p.afterOrganic}→${brandById(SPONSOR_CAMPAIGNS.find((c) => c.id === p.campaignId)!.brandId).initials}${hiddenCampaignIds.includes(p.campaignId) ? " (hidden)" : ""}`).join("  ·  ") : "Feed too short for a sponsored slot at this frequency."}
      </Text>

      <Label style={{ marginTop: 10 }}>Preview a campaign sheet</Label>
      <View style={s.wrap}>
        {SPONSOR_CAMPAIGNS.map((c) => (
          <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Preview ${brandById(c.brandId).name} sponsor sheet`} onPress={() => { tap(); onPreviewCampaign(c.id); }} style={s.chip}>
            <Eye size={12} color={C.white} /><Text style={s.chipText}>{brandById(c.brandId).initials}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[s.text, { marginTop: 10 }]}>Hidden this session: {hiddenCampaignIds.length ? hiddenCampaignIds.map((id) => brandById(SPONSOR_CAMPAIGNS.find((c) => c.id === id)!.brandId).name).join(", ") : "none"} · Local demo reports: {reportCount}</Text>
      <Pressable accessibilityRole="button" disabled={!hiddenCampaignIds.length} onPress={() => { tap(); onResetHidden(); }} style={[s.reset, !hiddenCampaignIds.length && { opacity: 0.45 }]}>
        <RotateCcw size={14} color={C.white} /><Text style={s.resetText}>Reset hidden sponsors</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: { marginTop: 6, padding: 14, borderRadius: 18, backgroundColor: "rgba(255,90,31,0.07)", borderWidth: 1, borderColor: "rgba(255,90,31,0.35)" },
  head: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontFamily: F.display, fontSize: 18, textTransform: "uppercase", color: C.white },
  text: { marginTop: 4, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.82)" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  toggleLabel: { fontSize: 14, color: C.white },
  hint: { fontSize: 11.5, color: C.ash },
  mono: { marginTop: 4, fontSize: 12, lineHeight: 18, color: C.white },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: "rgba(255,247,237,0.08)" },
  chipText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1, color: C.white },
  reset: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 42, borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,247,237,0.2)" },
  resetText: { fontFamily: F.label, fontSize: 14, letterSpacing: 1.3, textTransform: "uppercase", color: C.white },
});
