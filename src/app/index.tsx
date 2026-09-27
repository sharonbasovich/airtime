import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { computeReadiness, JUMPS_PER_DAY, localDayKey, Readiness, summarizeDays } from '../core/readiness';
import { usePurchases } from '../purchases/PurchasesProvider';
import { useRecords } from '../state/RecordsProvider';
import { Button, Card, Tag } from '../ui/components';
import { C, CALL_COPY } from '../ui/theme';

export default function Today() {
  const { records, asOf: now, loadSampleHistory, clear } = useRecords();
  const { isPro, mode } = usePurchases();
  const readiness = useMemo(() => computeReadiness(records, now), [records, now]);
  const days = useMemo(() => summarizeDays(records).slice(-8), [records]);
  const todayKey = localDayKey(now);
  const todays = records.filter((r) => localDayKey(r.at) === todayKey);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Airtime</Text>
            <Text style={s.tagline}>The 10-second daily readiness jump.</Text>
          </View>
          <Pressable onPress={() => router.push('/sdk')} testID="pro-badge">
            <Tag text={isPro ? 'PRO' : mode === 'demo' ? 'FREE · DEMO RC' : 'FREE'} color={isPro ? C.pro : C.dim} />
          </Pressable>
        </View>

        <ReadinessCard readiness={readiness} isPro={isPro} />

        <Button testID="btn-jump" title={`Today’s jump · ${Math.min(todays.length, JUMPS_PER_DAY)}/${JUMPS_PER_DAY}`} onPress={() => router.push('/jump')} />
        <Button testID="btn-jumpoff" kind="ghost" title="Jump-Off · pass the phone (free)" onPress={() => router.push('/jumpoff')} />

        {days.length > 0 && (
          <Card>
            <Text style={s.h}>Daily means</Text>
            <Bars days={days} todayKey={todayKey} baseline={readiness.status === 'need-baseline' ? null : readiness.baselineCm} locked={!isPro} />
          </Card>
        )}

        {todays.length > 0 && (
          <Card>
            <Text style={s.h}>Today</Text>
            {todays.map((r, i) => (
              <View key={r.id} style={s.jumpRow}>
                <Text style={s.jumpText}>
                  #{i + 1} {r.heightCm.toFixed(1)} cm{i >= JUMPS_PER_DAY ? '  (extra, not scored)' : ''}
                </Text>
                <Tag text={r.source.toUpperCase()} color={r.source === 'sensor' ? C.go : C.easy} />
              </View>
            ))}
          </Card>
        )}

        <View style={s.footer}>
          <Pressable onPress={loadSampleHistory} testID="btn-sample">
            <Text style={s.link}>Load 7 days of sample history</Text>
          </Pressable>
          <Pressable onPress={clear}>
            <Text style={s.link}>Reset</Text>
          </Pressable>
          <Link href="/sdk" style={s.link}>
            RevenueCat panel
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReadinessCard({ readiness, isPro }: { readiness: Readiness; isPro: boolean }) {
  if (readiness.status === 'need-baseline') {
    return (
      <Card>
        <Text style={s.h}>Building your baseline</Text>
        <Text style={s.body}>
          Day {readiness.daysLogged} of {readiness.daysNeeded}. Three jumps a day for {readiness.daysNeeded} days, then Airtime compares every
          morning to your own normal, not to anyone else’s.
        </Text>
        <View style={s.progress}>
          {Array.from({ length: readiness.daysNeeded }).map((_, i) => (
            <View key={i} style={[s.pip, i < readiness.daysLogged && { backgroundColor: C.accent }]} />
          ))}
        </View>
      </Card>
    );
  }
  if (!isPro) {
    return (
      <Card style={{ borderColor: C.pro }}>
        <Tag text="BASELINE READY" color={C.pro} />
        <Text style={[s.h, { marginTop: 10 }]}>Your {readiness.baselineDays}-day baseline: {readiness.baselineCm.toFixed(1)} cm</Text>
        <Text style={s.body}>
          {readiness.status === 'ready' ? 'Today’s call is ready.' : 'Jump today to get your call.'} Unlock Airtime Pro to see go / easy / rest
          every morning.
        </Text>
        <View style={{ height: 12 }} />
        <Button testID="btn-unlock" kind="pro" title="Unlock today’s call" onPress={() => router.push('/paywall')} />
      </Card>
    );
  }
  if (readiness.status === 'need-today') {
    return (
      <Card>
        <Tag text="PRO" color={C.pro} />
        <Text style={[s.h, { marginTop: 10 }]}>Baseline {readiness.baselineCm.toFixed(1)} cm</Text>
        <Text style={s.body}>Do today’s jumps to get your call.</Text>
      </Card>
    );
  }
  const copy = CALL_COPY[readiness.call];
  const sign = readiness.changePct >= 0 ? '+' : '−';
  return (
    <Card style={{ borderColor: copy.color }}>
      <View testID="readiness-call" style={s.callRow}>
        <Text style={[s.call, { color: copy.color }]}>{copy.label}</Text>
        <Text style={[s.delta, { color: copy.color }]}>
          {sign}
          {Math.abs(readiness.changePct).toFixed(1)}%
        </Text>
      </View>
      <Text style={s.body}>{copy.line}</Text>
      <Text style={s.fine}>
        Today {readiness.todayCm.toFixed(1)} cm ({readiness.todayJumps} jumps) vs {readiness.baselineDays}-day baseline {readiness.baselineCm.toFixed(1)} cm.
        Your day-to-day noise is ±{readiness.noisePct.toFixed(1)}%, so only changes beyond ±{readiness.thresholdPct.toFixed(1)}% count.
      </Text>
    </Card>
  );
}

function Bars({ days, todayKey, baseline, locked }: { days: { day: string; meanCm: number }[]; todayKey: string; baseline: number | null; locked: boolean }) {
  const max = Math.max(...days.map((d) => d.meanCm), baseline ?? 0) * 1.1;
  return (
    <View style={s.bars}>
      {days.map((d) => {
        const isToday = d.day === todayKey;
        return (
          <View key={d.day} style={s.barCol}>
            <View style={[s.bar, { height: `${(d.meanCm / max) * 100}%`, backgroundColor: isToday ? C.accent : C.cardHi }]} />
            <Text style={s.barLabel}>{locked && !isToday ? '·' : d.meanCm.toFixed(0)}</Text>
          </View>
        );
      })}
      {baseline !== null && !locked && <View style={[s.baseline, { bottom: `${(baseline / max) * 100}%` }]} />}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  brand: { color: C.accent, fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: C.dim, fontSize: 15 },
  h: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  body: { color: C.text, fontSize: 15, lineHeight: 21, opacity: 0.9 },
  fine: { color: C.dim, fontSize: 12, lineHeight: 17, marginTop: 10 },
  progress: { flexDirection: 'row', gap: 8, marginTop: 14 },
  pip: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.cardHi },
  callRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  call: { fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  delta: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  jumpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  jumpText: { color: C.text, fontSize: 15, fontVariant: ['tabular-nums'] },
  bars: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { color: C.dim, fontSize: 11, marginTop: 4 },
  baseline: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: C.pro },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'center', paddingVertical: 10 },
  link: { color: C.dim, fontSize: 13, textDecorationLine: 'underline' },
});
