import { Alert } from 'react-native';
import {
  DEFAULT_HEADLINE,
  DEFAULT_SUBHEAD,
  EntitlementSnapshot,
  PaywallOffering,
  PaywallPackage,
  PurchaseOutcome,
  PurchasesAdapter,
} from './types';

/**
 * Stand-in used only when no RevenueCat API key is configured. Mirrors the Test Store modal
 * (success / fail / cancel) and is clearly labelled DEMO everywhere it appears.
 */
export class DemoAdapter implements PurchasesAdapter {
  readonly mode = 'demo' as const;
  private snapshot: EntitlementSnapshot = { isPro: false, expiresAt: null, isSandbox: true, appUserId: 'demo-user' };
  private listeners = new Set<(s: EntitlementSnapshot) => void>();

  constructor(private readonly log: (label: string, detail?: string) => void) {}

  async configure(): Promise<void> {
    this.log('DEMO mode', 'no EXPO_PUBLIC_REVENUECAT_API_KEY set; purchases are simulated locally');
  }

  async getOffering(): Promise<PaywallOffering> {
    this.log('DEMO getOfferings', 'current=demo · 2 packages (local stand-in)');
    return {
      identifier: 'demo',
      headline: DEFAULT_HEADLINE,
      subhead: DEFAULT_SUBHEAD,
      packages: [
        { identifier: '$rc_annual', title: 'Airtime Pro · Annual', priceString: '$19.99', period: 'annual', raw: null },
        { identifier: '$rc_monthly', title: 'Airtime Pro · Monthly', priceString: '$2.99', period: 'monthly', raw: null },
      ],
    };
  }

  async getSnapshot(): Promise<EntitlementSnapshot> {
    return this.snapshot;
  }

  purchase(pkg: PaywallPackage): Promise<PurchaseOutcome> {
    this.log('DEMO purchasePackage', pkg.identifier);
    return new Promise((resolve) => {
      Alert.alert('DEMO purchase', `${pkg.title}\n${pkg.priceString}\n\nNo RevenueCat key configured: nothing is charged or recorded.`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve({ kind: 'cancelled' }) },
        { text: 'Fail', onPress: () => resolve({ kind: 'error', message: 'Simulated failure' }) },
        {
          text: 'Success',
          onPress: () => {
            this.set({ ...this.snapshot, isPro: true, expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString() });
            this.log('DEMO entitlement update', 'pro=true');
            resolve({ kind: 'purchased', snapshot: this.snapshot });
          },
        },
      ]);
    });
  }

  async restore(): Promise<EntitlementSnapshot> {
    this.log('DEMO restorePurchases', `pro=${this.snapshot.isPro}`);
    return this.snapshot;
  }

  onUpdate(listener: (s: EntitlementSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private set(s: EntitlementSnapshot) {
    this.snapshot = s;
    this.listeners.forEach((l) => l(s));
  }
}
