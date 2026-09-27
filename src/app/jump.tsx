import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { JumpDetection } from '../core/detector';
import { computeReadiness, JumpRecord } from '../core/readiness';
import { SensorSource } from '../hooks/useJumpSensor';
import { usePurchases } from '../purchases/PurchasesProvider';
import { useRecords } from '../state/RecordsProvider';
import { Button } from '../ui/components';
import { JumpMeasure } from '../ui/JumpMeasure';
import { C } from '../ui/theme';

export default function JumpScreen() {
  const { records, add } = useRecords();
  const { isPro } = usePurchases();
  const [saved, setSaved] = useState<JumpRecord | null>(null);

  const onResult = useCallback(
    (r: JumpDetection, source: SensorSource) => {
      const before = computeReadiness(records, Date.now()).status;
      const rec = add({ at: Date.now(), heightCm: r.heightCm, flightMs: r.flightMs, source });
      setSaved(rec);
      const after = computeReadiness([...records, rec], Date.now()).status;
      if (!isPro && before !== 'ready' && after === 'ready') router.push('/paywall');
    },
    [records, add, isPro],
  );

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={s.scroll}>
      <Text style={s.body}>Phone flat against your chest, arms crossed. Stand still, jump straight up, and land on the balls of your feet with your legs straight.</Text>
      <JumpMeasure onResult={onResult} />
      {saved && <Button kind="ghost" title="Done" onPress={() => router.back()} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, gap: 14 },
  body: { color: C.dim, fontSize: 14, lineHeight: 20 },
});
