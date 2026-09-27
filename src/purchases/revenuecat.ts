import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  DEFAULT_HEADLINE,
  DEFAULT_SUBHEAD,
  EntitlementSnapshot,
  PaywallOffering,
  PaywallPackage,
  PRO_ENTITLEMENT,
  PurchaseOutcome,
  PurchasesAdapter,
} from './types';

export function snapshotFromCustomerInfo(info: CustomerInfo): EntitlementSnapshot {
  const ent = info.entitlements.active[PRO_ENTITLEMENT];
  return {
    isPro: Boolean(ent),
    expiresAt: ent?.expirationDate ?? null,
    isSandbox: ent?.isSandbox ?? false,
    appUserId: info.originalAppUserId,
  };
}

function periodOf(pkg: PurchasesPackage): PaywallPackage['period'] {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return 'annual';
    case PACKAGE_TYPE.MONTHLY:
      return 'monthly';
    case PACKAGE_TYPE.LIFETIME:
      return 'lifetime';
    default:
      return 'other';
  }
}

function metaString(meta: Record<string, unknown>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export class RevenueCatAdapter implements PurchasesAdapter {
  readonly mode = 'revenuecat' as const;

  constructor(private readonly apiKey: string, private readonly log: (label: string, detail?: string) => void) {}

  async configure(): Promise<void> {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: this.apiKey });
    this.log('Purchases.configure', `${Platform.OS} · key ${this.apiKey.slice(0, 5)}…`);
  }

  async getOffering(): Promise<PaywallOffering | null> {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    this.log('Purchases.getOfferings', current ? `current=${current.identifier} · ${current.availablePackages.length} packages` : 'no current offering');
    if (!current) return null;
    const meta = current.metadata ?? {};
    return {
      identifier: current.identifier,
      headline: metaString(meta, 'headline') ?? DEFAULT_HEADLINE,
      subhead: metaString(meta, 'subhead') ?? DEFAULT_SUBHEAD,
      packages: current.availablePackages.map((p) => ({
        identifier: p.identifier,
        title: p.product.title,
        priceString: p.product.priceString,
        period: periodOf(p),
        raw: p,
      })),
    };
  }

  async getSnapshot(): Promise<EntitlementSnapshot> {
    return snapshotFromCustomerInfo(await Purchases.getCustomerInfo());
  }

  async purchase(pkg: PaywallPackage): Promise<PurchaseOutcome> {
    this.log('Purchases.purchasePackage', pkg.identifier);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg.raw as PurchasesPackage);
      const snapshot = snapshotFromCustomerInfo(customerInfo);
      this.log('purchase → CustomerInfo', `entitlements.active.${PRO_ENTITLEMENT}=${snapshot.isPro}`);
      return { kind: 'purchased', snapshot };
    } catch (e) {
      const err = e as PurchasesError;
      if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        this.log('purchase cancelled');
        return { kind: 'cancelled' };
      }
      this.log('purchase error', `${err.code}: ${err.message}`);
      return { kind: 'error', message: err.message };
    }
  }

  async restore(): Promise<EntitlementSnapshot> {
    const s = snapshotFromCustomerInfo(await Purchases.restorePurchases());
    this.log('Purchases.restorePurchases', `pro=${s.isPro}`);
    return s;
  }

  onUpdate(listener: (s: EntitlementSnapshot) => void): () => void {
    const l = (info: CustomerInfo) => {
      const s = snapshotFromCustomerInfo(info);
      this.log('CustomerInfo listener', `pro=${s.isPro}`);
      listener(s);
    };
    Purchases.addCustomerInfoUpdateListener(l);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(l);
    };
  }
}
