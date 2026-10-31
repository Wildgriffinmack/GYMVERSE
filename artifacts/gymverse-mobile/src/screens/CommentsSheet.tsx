import { useEffect, useRef, useState } from "react";
import { Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScrollViewInstance } from "react-native";
import { Heart, Send, X } from "lucide-react-native";
import type { Comment, Post } from "../data";
import { ME } from "../data";
import { Avatar, IconBtn, tap, thump } from "../components/ui";
import { formatCount } from "../utils";
import { C, DIAG, F, GRAD, RADIUS, SURFACE, TEXT } from "../theme";

/** `onAdd` resolves to false when Guardian blocked the comment, so the draft is kept for editing. */
export function CommentsSheet({ post, comments, onAdd, onClose }: { post: Post | null; comments: Comment[]; onAdd: (text: string) => Promise<boolean>; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const list = useRef<ScrollViewInstance>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const open = !!post;

  useEffect(() => {
    if (open) {
      slide.setValue(0);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 9, tension: 70 }).start();
    } else {
      setDraft("");
    }
  }, [open, slide]);

  const submit = async () => {
    if (!draft.trim() || busy) return;
    thump();
    setBusy(true);
    const added = await onAdd(draft.trim());
    setBusy(false);
    if (!added) return;
    setDraft("");
    Keyboard.dismiss();
    requestAnimationFrame(() => list.current?.scrollTo({ y: 0, animated: true }));
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close comments" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.wrap} pointerEvents="box-none">
        <Animated.View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }]}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>{post ? formatCount(post.comments) : ""} comments</Text>
            <IconBtn label="Close comments" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <ScrollView ref={list} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
            {comments.map((c) => {
              const on = liked.includes(c.id);
              return (
                <View key={c.id} style={s.comment}>
                  <Avatar username={c.user} name={c.user} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.meta}><Text style={{ color: C.white, fontWeight: "700" }}>@{c.user}</Text>   {c.time}</Text>
                    <Text style={s.body}>{c.text}</Text>
                    {c.pending ? <Text style={s.pending}>In review · only you can see this</Text> : null}
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={on ? "Unlike comment" : "Like comment"} hitSlop={10} onPress={() => { tap(); setLiked((l) => (l.includes(c.id) ? l.filter((x) => x !== c.id) : [...l, c.id])); }} style={{ alignItems: "center", gap: 3, paddingTop: 2 }}>
                    <Heart size={16} color={on ? C.hot : C.ash} fill={on ? C.hot : "transparent"} />
                    <Text style={{ fontSize: 11, color: on ? C.hot : C.ash }}>{formatCount(c.likes + (on ? 1 : 0))}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
          <View style={s.form}>
            <Avatar username={ME.username} name={ME.name} size={34} />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={post ? `Hype up @${post.username}…` : ""}
              placeholderTextColor="rgba(255,247,237,0.35)"
              style={s.input}
              returnKeyType="send"
              onSubmitEditing={submit}
              accessibilityLabel="Write a comment"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Post comment" disabled={!draft.trim() || busy} onPress={submit} style={({ pressed }) => ({ opacity: draft.trim() && !busy ? 1 : 0.35, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
              <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.send}><Send size={17} color="#fff" /></LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: SURFACE.scrim },
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: { height: "70%", borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, backgroundColor: SURFACE.sheet },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10, backgroundColor: "rgba(255,247,237,0.2)" },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 20, paddingRight: 16, paddingVertical: 10 },
  title: { fontFamily: F.labelHeavy, fontSize: 17, letterSpacing: 1.3, textTransform: "uppercase", color: C.white },
  comment: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  meta: { fontSize: 13, color: TEXT.tertiary },
  body: { marginTop: 3, fontSize: 14.5, lineHeight: 20, color: TEXT.secondary },
  pending: { marginTop: 4, fontFamily: F.label, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold },
  form: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  input: { flex: 1, height: 46, paddingHorizontal: 18, borderRadius: 23, fontSize: 14.5, color: C.white, backgroundColor: SURFACE.fill },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
});
