import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Crown, Lock, Pin, RotateCcw, X } from "lucide-react-native";
import { PostArt } from "../components/PostArt";
import { Avatar, Badge, IconBtn, Label, tap } from "../components/ui";
import { ME } from "../data";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C, DIAG, F, GRAD_GOLD } from "../theme";
import type { ProfileCosmetics, ProfileStyleId } from "./proData";
import { DEFAULT_COSMETICS, MEMBER_NOTE, PROFILE_STYLES, PROFILE_STYLE_IDS, PRO_FEATURE_INFO } from "./proData";

export const PINNED_ART = {
  visual: "transformation" as const,
  headline: "6 Months",
  subline: "Pinned progress",
  lines: [
    { label: "Before", detail: "Day 01" },
    { label: "After", detail: "Month 06" },
  ],
};

/**
 * Premium profile customization preview. Cosmetics only affect how the profile is rendered in this
 * session; the underlying profile data (name, bio, PRs, posts) is never modified. Free users see a
 * locked explanation instead.
 */
export function ProfileStudio({ visible, value, onChange, onClose, onOpenPremium }: { visible: boolean; value: ProfileCosmetics; onChange: (v: ProfileCosmetics) => void; onClose: () => void; onOpenPremium: () => void }) {
  const insets = useSafeAreaInsets();
  const membership = useMembership();
  const unlocked = membership.can("premium_profile_customization");
  const style = PROFILE_STYLES[value.style];
  const set = (patch: Partial<ProfileCosmetics>) => onChange({ ...value, ...patch });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close Profile Studio" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={s.handle} />
        <View style={s.head}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Badge tone="gold">PRO</Badge>
            <ComingSoonPill />
          </View>
          <IconBtn label="Close Profile Studio" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Profile Studio</Text>
          <Text style={s.sub}>{unlocked ? `Previewing as ${membership.plan.displayName} (developer demo). Cosmetics are optional and only last for this session.` : PRO_FEATURE_INFO.premium_profile_customization!.body}</Text>

          {/* Live preview */}
          <View style={s.preview} pointerEvents="none">
            <LinearGradient colors={style.banner} locations={[0, 0.58, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.previewBanner} />
            <View style={s.previewBody}>
              <View style={[s.previewRing, value.glowRing ? null : { padding: 0 }]}>
                {value.glowRing ? <LinearGradient colors={style.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
                <View style={{ padding: 3, borderRadius: 40, backgroundColor: C.bg }}><Avatar username={ME.username} name={ME.name} size={64} /></View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                <Text style={s.previewName}>{ME.name}</Text>
                {value.showBadge && membership.badge.label ? <Badge tone={membership.badge.tone}>{membership.badge.label}</Badge> : null}
                {value.showBadge && !membership.badge.label ? <Badge tone="gold">PRO</Badge> : null}
              </View>
              <Text style={s.previewHandle}>@{ME.username}</Text>
            </View>
            {value.pinTransformation ? (
              <View style={s.previewPinned}>
                <View style={{ width: 70, height: 70, borderRadius: 12, overflow: "hidden" }}><PostArt art={PINNED_ART} variant="thumb" /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Pin size={12} color={C.gold} /><Text style={s.pinnedLabel}>Pinned transformation</Text></View>
                  <Text style={s.pinnedText}>6 months of consistency</Text>
                </View>
              </View>
            ) : null}
          </View>

          {unlocked ? (
            <>
              <Label style={{ marginTop: 18, marginBottom: 10 }}>Profile style</Label>
              <View style={s.styles}>
                {PROFILE_STYLE_IDS.map((id: ProfileStyleId) => {
                  const st = PROFILE_STYLES[id];
                  const on = value.style === id;
                  return (
                    <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`${st.name} style`} onPress={() => { tap(); set({ style: id }); }} style={[s.styleChip, on && s.styleChipOn]}>
                      <LinearGradient colors={st.banner} start={DIAG.start} end={DIAG.end} style={s.swatch}>{on ? <Check size={14} color="#fff" strokeWidth={3} /> : null}</LinearGradient>
                      <Text style={[s.styleName, on && { color: C.white }]}>{st.name}</Text>
                      {!st.premium ? <Text style={s.freeTag}>Free</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
              <Toggle label="Premium glow ring" value={value.glowRing} onChange={(v) => set({ glowRing: v })} />
              <Toggle label={`Show ${membership.badge.label ?? "PRO"} badge`} value={value.showBadge} onChange={(v) => set({ showBadge: v })} />
              <Toggle label="Pin a transformation" value={value.pinTransformation} onChange={(v) => set({ pinTransformation: v })} />
              <View style={s.applyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleLabel}>Show on my profile</Text>
                  <Text style={s.muted}>This session only. Turn off anytime.</Text>
                </View>
                <Switch value={value.applied} onValueChange={(v) => { tap(); set({ applied: v }); }} trackColor={{ true: C.gold, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel="Show on my profile" />
              </View>
              <Pressable accessibilityRole="button" onPress={() => { tap(); onChange(DEFAULT_COSMETICS); }} style={s.reset}>
                <RotateCcw size={14} color={C.ash} />
                <Text style={s.resetText}>Reset to defaults</Text>
              </Pressable>
              <Text style={[s.muted, { marginTop: 4 }]}>Your free profile, name, bio, records and posts are never changed. {MEMBER_NOTE.replace("Fictional example member. ", "Pinned image is an illustration. ")}</Text>
            </>
          ) : (
            <View style={s.locked}>
              <View style={s.lockedIcon}><Lock size={18} color="#1c0f00" /></View>
              <Text style={s.lockedText}>Premium styles, the glow ring, the PRO badge and pinned transformations are coming with GYMVERSE Pro. Your profile stays exactly as it is.</Text>
              <Pressable accessibilityRole="button" onPress={() => { tap(); onClose(); onOpenPremium(); }} style={({ pressed }) => [{ alignSelf: "stretch", transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <LinearGradient colors={GRAD_GOLD} start={DIAG.start} end={DIAG.end} style={s.cta}>
                  <Crown size={17} color="#1c0f00" />
                  <Text style={s.ctaText}>See GYMVERSE Premium</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.toggleRow}>
      <Text style={[s.toggleLabel, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: C.flame, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "92%", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#141414", borderTopWidth: 1.5, borderColor: "rgba(255,209,102,0.5)" },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, marginTop: 10, backgroundColor: "rgba(255,247,237,0.22)" },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontFamily: F.display, fontSize: 30, lineHeight: 34, textTransform: "uppercase", color: C.white },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18, color: C.ash },
  preview: { marginTop: 14, borderRadius: 22, overflow: "hidden", backgroundColor: "#0e0e0e", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.1)" },
  previewBanner: { height: 86 },
  previewBody: { alignItems: "center", marginTop: -38, paddingBottom: 14 },
  previewRing: { padding: 3, borderRadius: 44, overflow: "hidden" },
  previewName: { fontFamily: F.display, fontSize: 24, textTransform: "uppercase", color: C.white },
  previewHandle: { fontSize: 12.5, color: C.ash },
  previewPinned: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 12, marginBottom: 12, padding: 10, borderRadius: 16, backgroundColor: "rgba(255,209,102,0.07)", borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  pinnedLabel: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: C.gold },
  pinnedText: { marginTop: 2, fontSize: 14, color: C.white },
  styles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleChip: { width: "48%", flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.04)", borderWidth: 1.5, borderColor: "transparent" },
  styleChipOn: { borderColor: C.gold, backgroundColor: "rgba(255,209,102,0.08)" },
  swatch: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  styleName: { flex: 1, fontSize: 13.5, fontWeight: "600", color: "rgba(255,247,237,0.8)" },
  freeTag: { fontFamily: F.label, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  toggleLabel: { fontSize: 14.5, fontWeight: "600", color: C.white },
  applyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,209,102,0.08)", borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  muted: { fontSize: 12, lineHeight: 17, color: C.ash },
  reset: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 12 },
  resetText: { fontFamily: F.label, fontSize: 13, letterSpacing: 1.3, textTransform: "uppercase", color: C.ash },
  locked: { alignItems: "center", gap: 12, marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: "rgba(255,209,102,0.07)", borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  lockedIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: C.gold },
  lockedText: { textAlign: "center", fontSize: 13.5, lineHeight: 19, color: "rgba(255,247,237,0.86)" },
  cta: { height: 50, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { fontFamily: F.labelHeavy, fontSize: 15, letterSpacing: 1.3, textTransform: "uppercase", color: "#1c0f00" },
});
