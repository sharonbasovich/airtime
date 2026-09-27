import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JumpDetection } from '../core/detector';
import { SensorSource, useJumpSensor } from '../hooks/useJumpSensor';
import { Button, Tag } from './components';
import { C } from './theme';

const PROMPT = {
  'waiting-still': 'Hold the phone flat to your chest.\nStand still…',
  ready: 'JUMP!',
  airborne: 'In the air…',
  done: '',
  rejected: '',
} as const;

export const SIM_PRESETS = [
  { label: 'Sim · fresh', cm: 38.5 },
  { label: 'Sim · tired', cm: 34 },
];

export function JumpMeasure({ onResult }: { onResult: (r: JumpDetection, source: SensorSource) => void }) {
  const js = useJumpSensor();
  const reported = useRef<JumpDetection | null>(null);

  useEffect(() => {
    const phase = js.state?.phase;
    if (phase === 'ready') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (phase === 'rejected') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (phase === 'done' && js.state?.result && js.source && reported.current !== js.state.result) {
      reported.current = js.state.result;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onResult(js.state.result, js.source);
    }
  }, [js.state, js.source, onResult]);

  const phase = js.state?.phase;
  const result = js.state?.result;

  return (
    <View style={s.wrap}>
      <View style={s.stage} testID="jump-stage">
        {js.source && <Tag text={js.source === 'simulated' ? 'SIMULATED TRACE' : 'LIVE ACCELEROMETER'} color={js.source === 'simulated' ? C.easy : C.go} />}
        {phase === 'done' && result ? (
          <>
            <Text style={s.big} testID="jump-height">
              {result.heightCm.toFixed(1)}
              <Text style={s.unit}> cm</Text>
            </Text>
            <Text style={s.sub}>{Math.round(result.flightMs)} ms flight time · h = g·t²/8</Text>
            <Text style={s.sub}>
              push {result.pushPeakG.toFixed(1)} g · flight {result.flightMeanG.toFixed(2)} g · {Math.round(result.sampleHz)} Hz
            </Text>
          </>
        ) : phase === 'rejected' ? (
          <>
            <Text style={[s.prompt, { color: C.rest }]}>Didn’t count</Text>
            <Text style={s.sub}>{js.state?.reason}</Text>
          </>
        ) : phase ? (
          <>
            <Text style={[s.prompt, phase === 'ready' && { color: C.accent, fontSize: 56 }]}>{PROMPT[phase]}</Text>
            <Text style={s.sub}>{js.liveG.toFixed(2)} g</Text>
          </>
        ) : (
          <Text style={s.prompt}>Ready when you are.</Text>
        )}
      </View>
      <Button testID="btn-sensor" title={phase && phase !== 'done' && phase !== 'rejected' && js.source === 'sensor' ? 'Listening…' : 'Measure with sensor'} onPress={js.armSensor} disabled={js.available === false} />
      <View style={s.row}>
        {SIM_PRESETS.map((p) => (
          <View key={p.label} style={{ flex: 1 }}>
            <Button testID={`btn-${p.label}`} kind="ghost" title={p.label} onPress={() => js.simulate(p.cm + (Math.random() - 0.5))} />
          </View>
        ))}
      </View>
      <Text style={s.fine}>
        Simulated buttons stream a synthetic accelerometer trace through the same detector, for emulators and demos. Simulated jumps are tagged and never mixed up with sensor jumps.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 12 },
  stage: { minHeight: 230, backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  big: { color: C.text, fontSize: 84, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 28, color: C.dim, fontWeight: '700' },
  prompt: { color: C.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { color: C.dim, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  fine: { color: C.dim, fontSize: 12, lineHeight: 17 },
});
