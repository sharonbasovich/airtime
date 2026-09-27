import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DemoAdapter } from './demo';
import { RevenueCatAdapter } from './revenuecat';
import { EntitlementSnapshot, PaywallOffering, PaywallPackage, PurchaseOutcome, PurchasesAdapter, PurchasesMode, SdkEvent } from './types';

type Ctx = {
  mode: PurchasesMode;
  ready: boolean;
  isPro: boolean;
  snapshot: EntitlementSnapshot | null;
  offering: PaywallOffering | null;
  offeringError: string | null;
  events: SdkEvent[];
  purchase: (pkg: PaywallPackage) => Promise<PurchaseOutcome>;
  restore: () => Promise<EntitlementSnapshot>;
  reloadOffering: () => Promise<void>;
};

const PurchasesContext = createContext<Ctx | null>(null);

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<SdkEvent[]>([]);
  const log = useCallback((label: string, detail?: string) => {
    setEvents((prev) => [{ at: Date.now(), label, detail }, ...prev].slice(0, 40));
  }, []);
  const [adapter] = useState<PurchasesAdapter>(() => (API_KEY ? new RevenueCatAdapter(API_KEY, log) : new DemoAdapter(log)));

  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<EntitlementSnapshot | null>(null);
  const [offering, setOffering] = useState<PaywallOffering | null>(null);
  const [offeringError, setOfferingError] = useState<string | null>(null);

  const reloadOffering = useCallback(async () => {
    try {
      setOffering(await adapter.getOffering());
      setOfferingError(null);
    } catch (e) {
      setOfferingError((e as Error).message);
      log('getOfferings failed', (e as Error).message);
    }
  }, [adapter, log]);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await adapter.configure();
      unsub = adapter.onUpdate(setSnapshot);
      try {
        setSnapshot(await adapter.getSnapshot());
      } catch (e) {
        log('getCustomerInfo failed', (e as Error).message);
      }
      await reloadOffering();
      setReady(true);
    })();
    return () => unsub();
  }, [adapter, log, reloadOffering]);

  const purchase = useCallback(
    async (pkg: PaywallPackage) => {
      const outcome = await adapter.purchase(pkg);
      if (outcome.kind === 'purchased') setSnapshot(outcome.snapshot);
      return outcome;
    },
    [adapter],
  );

  const restore = useCallback(async () => {
    const s = await adapter.restore();
    setSnapshot(s);
    return s;
  }, [adapter]);

  const value = useMemo<Ctx>(
    () => ({
      mode: adapter.mode,
      ready,
      isPro: snapshot?.isPro ?? false,
      snapshot,
      offering,
      offeringError,
      events,
      purchase,
      restore,
      reloadOffering,
    }),
    [adapter.mode, ready, snapshot, offering, offeringError, events, purchase, restore, reloadOffering],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): Ctx {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used inside PurchasesProvider');
  return ctx;
}
