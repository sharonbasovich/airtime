export const PRO_ENTITLEMENT = 'pro';

export type PaywallPackage = {
  identifier: string;
  title: string;
  priceString: string;
  period: 'annual' | 'monthly' | 'lifetime' | 'other';
  /** Opaque handle passed back to the adapter on purchase. */
  raw: unknown;
};

export type PaywallOffering = {
  identifier: string;
  headline: string;
  subhead: string;
  packages: PaywallPackage[];
};

export type EntitlementSnapshot = {
  isPro: boolean;
  expiresAt: string | null;
  isSandbox: boolean;
  appUserId: string;
};

export type PurchaseOutcome = { kind: 'purchased'; snapshot: EntitlementSnapshot } | { kind: 'cancelled' } | { kind: 'error'; message: string };

export type SdkEvent = { at: number; label: string; detail?: string };

export type PurchasesMode = 'revenuecat' | 'demo';

export interface PurchasesAdapter {
  readonly mode: PurchasesMode;
  configure(): Promise<void>;
  getOffering(): Promise<PaywallOffering | null>;
  getSnapshot(): Promise<EntitlementSnapshot>;
  purchase(pkg: PaywallPackage): Promise<PurchaseOutcome>;
  restore(): Promise<EntitlementSnapshot>;
  onUpdate(listener: (s: EntitlementSnapshot) => void): () => void;
}

export const DEFAULT_HEADLINE = 'Your baseline is ready';
export const DEFAULT_SUBHEAD = 'Measuring stays free forever. Pro turns your jumps into a daily call: go hard, go easy, or rest.';
