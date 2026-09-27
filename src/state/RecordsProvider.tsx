import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { JumpRecord, sampleHistory } from '../core/readiness';

const KEY = 'airtime.records.v1';

type Ctx = {
  loaded: boolean;
  /** Wall-clock time of the last change; the "now" readiness is evaluated at. */
  asOf: number;
  records: JumpRecord[];
  add: (r: Omit<JumpRecord, 'id'>) => JumpRecord;
  loadSampleHistory: () => void;
  clear: () => void;
};

const RecordsContext = createContext<Ctx | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<JumpRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [asOf, setAsOf] = useState(() => Date.now());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setRecords(JSON.parse(raw) as JumpRecord[]);
      })
      .finally(() => {
        setAsOf(Date.now());
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(records));
  }, [records, loaded]);

  const add = useCallback((r: Omit<JumpRecord, 'id'>) => {
    const rec: JumpRecord = { ...r, id: `${r.at}-${Math.random().toString(36).slice(2, 8)}` };
    setRecords((prev) => [...prev, rec]);
    setAsOf(Date.now());
    return rec;
  }, []);

  const loadSampleHistory = useCallback(() => {
    const t = Date.now();
    setRecords((prev) => [...prev.filter((r) => r.source !== 'sample-data'), ...sampleHistory(t)]);
    setAsOf(t);
  }, []);

  const clear = useCallback(() => {
    setRecords([]);
    setAsOf(Date.now());
  }, []);

  const value = useMemo(() => ({ loaded, asOf, records, add, loadSampleHistory, clear }), [loaded, asOf, records, add, loadSampleHistory, clear]);
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): Ctx {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used inside RecordsProvider');
  return ctx;
}
