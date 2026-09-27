import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { JumpDetection } from '../core/detector';
import { JumpOffEntry, leaderboard } from '../core/jumpoff';
import { SensorSource } from '../hooks/useJumpSensor';
import { Card, Tag } from '../ui/components';
import { JumpMeasure } from '../ui/JumpMeasure';
import { C } from '../ui/theme';

type Entry = JumpOffEntry & { source: SensorSource };

export default function JumpOff() {
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const board = useMemo(() => leaderboard(entries), [entries]);

  const onResult = useCallback(
    (r: JumpDetection, source: SensorSource) => setEntries((prev) => [...prev, { name: name.trim() || `Jumper ${prev.length + 1}`, heightCm: r.heightCm, source }]),
    [name],
  );

  const simulatedNames = new Set(entries.filter((e) => e.source === 'simulated').map((e) => e.name));

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Text style={s.body}>Free forever. Type a name, pass the phone, jump. Best jump per person wins.</Text>
      <TextInput testID="jumpoff-name" value={name} onChangeText={setName} placeholder="Who’s jumping?" placeholderTextColor={C.dim} style={s.input} />
      <JumpMeasure onResult={onResult} />
      {board.length > 0 && (
        <Card>
          <Text style={s.h}>Leaderboard</Text>
          {board.map((row) => (
            <View key={row.name} style={s.row}>
              <Text style={[s.rank, row.rank === 1 && { color: C.accent }]}>{row.rank}</Text>
              <Text style={s.name}>{row.name}</Text>
              {simulatedNames.has(row.name) && <Tag text="SIM" color={C.easy} />}
              <Text style={s.cm}>{row.heightCm.toFixed(1)} cm</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, gap: 14 },
  body: { color: C.dim, fontSize: 14, lineHeight: 20 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, fontSize: 17 },
  h: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rank: { color: C.dim, fontSize: 20, fontWeight: '900', width: 26 },
  name: { color: C.text, fontSize: 17, flex: 1 },
  cm: { color: C.text, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
