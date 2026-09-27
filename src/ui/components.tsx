import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C } from './theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  testID,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'pro';
  disabled?: boolean;
  testID?: string;
}) {
  const bg = kind === 'primary' ? C.accent : kind === 'pro' ? C.pro : 'transparent';
  const fg = kind === 'primary' ? '#0B0D12' : C.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, kind === 'ghost' && s.ghost]}
    >
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Tag({ text, color = C.dim }: { text: string; color?: string }) {
  return (
    <View style={[s.tag, { borderColor: color }]}>
      <Text style={[s.tagText, { color }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
  btn: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  ghost: { borderWidth: 1, borderColor: C.border },
  btnText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
