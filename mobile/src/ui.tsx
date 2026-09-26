import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

export const colors = { ink: '#14231e', paper: '#faf9f3', white: '#ffffff', muted: '#4b5d55', line: '#9baa9f', primary: '#164a35', error: '#8e2020', highlight: '#ffdf75' };
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  header: { padding: 20, gap: 4, borderBottomWidth: 2, borderColor: colors.ink },
  brand: { fontSize: 24, fontWeight: '800', color: colors.ink },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: colors.ink },
  body: { fontSize: 19, lineHeight: 28, color: colors.ink },
  small: { fontSize: 16, lineHeight: 24, color: colors.muted },
  label: { fontSize: 18, fontWeight: '700', color: colors.ink },
  input: { minHeight: 64, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderRadius: 8, padding: 16, fontSize: 20, color: colors.ink, textAlignVertical: 'top' },
  button: { minHeight: 64, padding: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  secondary: { backgroundColor: colors.white },
  secondaryText: { color: colors.primary },
  disabled: { opacity: 0.45 },
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 12, paddingVertical: 20, borderBottomWidth: 1, borderColor: colors.line },
  notice: { backgroundColor: colors.highlight, padding: 16, gap: 8 },
  error: { color: colors.error, fontSize: 18, lineHeight: 26 },
  quote: { borderLeftWidth: 3, borderColor: colors.line, paddingLeft: 12, fontSize: 18, lineHeight: 26, color: colors.muted },
  tabs: { padding: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap', borderBottomWidth: 1, borderColor: colors.line },
});

export function Button({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && styles.disabled]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text></Pressable>;
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.stack}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} style={styles.input} {...props} /></View>;
}
