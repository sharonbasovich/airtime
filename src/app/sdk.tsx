import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePurchases } from '../purchases/PurchasesProvider';
import { PRO_ENTITLEMENT } from '../purchases/types';
import { Button, Card, Tag } from '../ui/components';
import { C } from '../ui/theme';

/** Live view of what the RevenueCat SDK is reporting, used on camera in the demo. */
export default function SdkPanel() {
  const { mode, snapshot, offering, events, restore } = usePurchases();
  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={s.scroll}>
      <Card>
        <Tag text={mode === 'demo' ? 'DEMO ADAPTER' : 'react-native-purchases'} color={mode === 'demo' ? C.easy : C.pro} />
        <Row k="appUserID" v={snapshot?.appUserId ?? '…'} />
        <Row k={`entitlements.active.${PRO_ENTITLEMENT}`} v={snapshot?.isPro ? 'ACTIVE' : 'inactive'} hi={snapshot?.isPro} />
        <Row k="expirationDate" v={snapshot?.expiresAt ?? '—'} />
        <Row k="isSandbox" v={String(snapshot?.isSandbox ?? '—')} />
        <Row k="offerings.current" v={offering ? `${offering.identifier} (${offering.packages.map((p) => p.identifier).join(', ')})` : '—'} />
      </Card>
      <Button kind="ghost" title="Restore purchases" onPress={() => restore()} />
      <Card>
        <Text style={s.h}>SDK event log</Text>
        {events.map((e) => (
          <View key={`${e.at}-${e.label}`} style={s.ev}>
            <Text style={s.evT}>{new Date(e.at).toLocaleTimeString()}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.evL}>{e.label}</Text>
              {e.detail && <Text style={s.evD}>{e.detail}</Text>}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function Row({ k, v, hi }: { k: string; v: string; hi?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.k}>{k}</Text>
      <Text style={[s.v, hi && { color: C.go }]} selectable>
        {v}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, gap: 14 },
  h: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  row: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  k: { color: C.dim, fontSize: 12, fontFamily: 'monospace' },
  v: { color: C.text, fontSize: 14, fontFamily: 'monospace', marginTop: 2 },
  ev: { flexDirection: 'row', gap: 10, paddingVertical: 5 },
  evT: { color: C.dim, fontSize: 11, fontFamily: 'monospace', width: 70 },
  evL: { color: C.text, fontSize: 13, fontFamily: 'monospace' },
  evD: { color: C.dim, fontSize: 12, fontFamily: 'monospace' },
});
