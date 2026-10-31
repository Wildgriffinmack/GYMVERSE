import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Building2, Dumbbell, Megaphone, Shirt, Waves, X } from "lucide-react-native";
import { IconBtn } from "../components/ui";
import { C, F } from "../theme";
import type { BrandIcon, BrandTone, SponsorBrand } from "./sponsorData";
import { DEMO_BRAND_LABEL, SPONSOR_LABEL } from "./sponsorData";

export const BRAND_GRADIENTS: Record<BrandTone, [string, string, string]> = {
  ember: ["#FF5A1F", "#7A1A0C", "#120604"],
  crimson: ["#FF2E2E", "#5E0A10", "#100304"],
  iron: ["#6B7783", "#1F2429", "#0B0C0D"],
  gold: ["#FFD166", "#7A4B10", "#140D04"],
};

export function brandIcon(icon: BrandIcon, size: number, color: string): ReactNode {
  if (icon === "shirt") return <Shirt size={size} color={color} />;
  if (icon === "dumbbell") return <Dumbbell size={size} color={color} />;
  if (icon === "waves") return <Waves size={size} color={color} />;
  if (icon === "book") return <BookOpen size={size} color={color} />;
  return <Building2 size={size} color={color} />;
}

/** Square logo placeholder — deliberately not a round member avatar. */
export function BrandMark({ brand, size = 40 }: { brand: SponsorBrand; size?: number }) {
  const [a] = BRAND_GRADIENTS[brand.tone];
  return (
    <View style={[s.mark, { width: size, height: size, borderRadius: size * 0.28, borderColor: a }]} accessibilityLabel={`${brand.name} logo placeholder`}>
      {brandIcon(brand.icon, size * 0.42, a)}
      <Text style={[s.markText, { fontSize: size * 0.22 }]}>{brand.initials}</Text>
    </View>
  );
}

/** Mandatory, high-contrast disclosure. */
export function SponsoredLabel({ large }: { large?: boolean }) {
  return (
    <View style={[s.label, large && s.labelLarge]} accessibilityLabel="Sponsored">
      <Megaphone size={large ? 14 : 12} color="#111" />
      <Text style={[s.labelText, large && { fontSize: 14 }]}>{SPONSOR_LABEL}</Text>
    </View>
  );
}

export function DemoBrandTag({ text = DEMO_BRAND_LABEL }: { text?: string }) {
  return <View style={s.demo}><Text style={s.demoText}>{text}</Text></View>;
}

export function SponsorSheet({ visible, onClose, closeLabel, children, footer }: { visible: boolean; onClose: () => void; closeLabel: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel={closeLabel} />
      {visible ? (
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <SponsoredLabel />
            <IconBtn label={closeLabel} onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>{children}</ScrollView>
          {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>{footer}</View> : null}
        </View>
      ) : null}
    </Modal>
  );
}

export const ss = StyleSheet.create({
  title: { fontFamily: F.display, fontSize: 26, lineHeight: 30, textTransform: "uppercase", color: C.white },
  body: { fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.86)" },
  muted: { fontSize: 12, lineHeight: 17, color: C.ash },
  kicker: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase", color: C.flame },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 13, backgroundColor: "rgba(255,247,237,0.05)" },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.82)" },
  btn: { minHeight: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, backgroundColor: "rgba(255,247,237,0.07)" },
  btnText: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 1, textTransform: "uppercase", color: C.white },
  chip: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.06)" },
  chipOn: { backgroundColor: C.flame },
  chipText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 0.9, textTransform: "uppercase", color: "rgba(255,247,237,0.78)" },
  card: { padding: 14, borderRadius: 18, backgroundColor: "#141414" },
});

const s = StyleSheet.create({
  mark: { alignItems: "center", justifyContent: "center", backgroundColor: "#0d0d0d", borderWidth: 1.5 },
  markText: { position: "absolute", bottom: 2, right: 4, fontFamily: F.labelHeavy, color: "rgba(255,247,237,0.7)" },
  label: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", height: 26, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#FFF7ED" },
  labelLarge: { height: 30, paddingHorizontal: 12 },
  labelText: { fontFamily: F.labelHeavy, fontSize: 12.5, letterSpacing: 1.6, color: "#111" },
  demo: { alignSelf: "flex-start", minHeight: 26, paddingHorizontal: 9, justifyContent: "center", borderRadius: 8, backgroundColor: "rgba(9,9,9,0.55)", borderWidth: 1, borderColor: "rgba(255,247,237,0.35)" },
  demoText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, color: C.white },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.62)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "88%", paddingTop: 8, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#161616" },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,247,237,0.25)", marginBottom: 8 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
});
