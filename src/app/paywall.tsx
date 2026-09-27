import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePurchases } from '../purchases/PurchasesProvider';
import { PaywallPackage } from '../purchases/types';
import { Button, Tag } from '../ui/components';
import { C } from '../ui/theme';

const BENEFITS = [
  ['Daily call', 'Go / easy / rest from 3 jumps, every morning'],
  ['Your own noise', 'Thresholds scale to how consistent you are, so a normal wobble never counts as a drop'],
  ['Trend', 'Rolling 7-day baseline chart'],
];

const PERIOD_LABEL: Record<PaywallPackage['period'], string> = { annual: '/ year', monthly: '/ month', lifetime: 'once', other: '' };

export default function Paywall() {
  const { offering, offeringError, purchase, restore, mode, isPro, reloadOffering } = usePurchases();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pkg = offering?.packages.find((p) => p.identifier === selected) ?? offering?.packages[0] ?? null;

  const buy = async () => {
    if (!pkg) return;
    setBusy(true);
    const outcome = await purchase(pkg);
    setBusy(false);
    if (outcome.kind === 'purchased' && outcome.snapshot.isPro) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else if (outcome.kind === 'purchased') {
      Alert.alert('Purchase recorded', 'The “pro” entitlement is not attached to this product. Check the RevenueCat dashboard.');
    } else if (outcome.kind === 'error') {
      Alert.alert('Purchase failed', outcome.message);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const s = await restore();
      Alert.alert(s.isPro ? 'Pro restored' : 'Nothing to restore');
      if (s.isPro) router.back();
    } catch (e) {
      Alert.alert('Restore failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.top}>
          <Tag text={mode === 'demo' ? 'DEMO MODE · NO RC KEY' : 'REVENUECAT'} color={mode === 'demo' ? C.easy : C.pro} />
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={s.close}>✕</Text>
          </Pressable>
        </View>
        <Text style={s.headline}>{offering?.headline ?? 'Airtime Pro'}</Text>
        <Text style={s.subhead}>{offering?.subhead}</Text>

        <View style={s.benefits}>
          {BENEFITS.map(([t, d]) => (
            <View key={t} style={s.benefit}>
              <Text style={s.check}>●</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.bt}>{t}</Text>
                <Text style={s.bd}>{d}</Text>
              </View>
            </View>
          ))}
        </View>

        {!offering && !offeringError && <ActivityIndicator color={C.accent} />}
        {offeringError && (
          <View style={{ gap: 8 }}>
            <Text style={s.err}>Couldn’t load offerings: {offeringError}</Text>
            <Button kind="ghost" title="Retry" onPress={reloadOffering} />
          </View>
        )}
        {offering?.packages.map((p) => {
          const on = p.identifier === pkg?.identifier;
          return (
            <Pressable key={p.identifier} testID={`pkg-${p.identifier}`} onPress={() => setSelected(p.identifier)} style={[s.pkg, on && { borderColor: C.accent }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.pkgTitle}>{p.title}</Text>
                {p.period === 'annual' && <Text style={s.pkgNote}>Best value</Text>}
              </View>
              <Text style={s.price}>
                {p.priceString} <Text style={s.per}>{PERIOD_LABEL[p.period]}</Text>
              </Text>
            </Pressable>
          );
        })}

        <Button testID="btn-purchase" kind="pro" title={isPro ? 'You’re Pro' : busy ? 'Working…' : 'Start Pro'} onPress={buy} disabled={!pkg || busy || isPro} />
        <Pressable onPress={doRestore} disabled={busy}>
          <Text style={s.restore}>Restore purchases</Text>
        </Pressable>
        <Text style={s.fine}>
          Measuring jumps and Jump-Off stay free. Airtime is a training tool, not a medical device.{' '}
          {mode === 'demo' ? 'Demo mode: no RevenueCat key is configured, so nothing is charged.' : 'Prices and packages come from the current RevenueCat Offering.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 22, gap: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { color: C.dim, fontSize: 22 },
  headline: { color: C.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  subhead: { color: C.dim, fontSize: 16, lineHeight: 22 },
  benefits: { gap: 12, marginVertical: 6 },
  benefit: { flexDirection: 'row', gap: 12 },
  check: { color: C.accent, fontSize: 14, marginTop: 3 },
  bt: { color: C.text, fontSize: 16, fontWeight: '800' },
  bd: { color: C.dim, fontSize: 14, lineHeight: 19 },
  pkg: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 2, borderColor: C.border, padding: 16 },
  pkgTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  pkgNote: { color: C.accent, fontSize: 12, fontWeight: '800', marginTop: 2 },
  price: { color: C.text, fontSize: 18, fontWeight: '900' },
  per: { color: C.dim, fontSize: 13, fontWeight: '600' },
  restore: { color: C.dim, textAlign: 'center', textDecorationLine: 'underline', paddingVertical: 4 },
  err: { color: C.rest },
  fine: { color: C.dim, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
