/* Hằng số + helper thuần cho ví người dùng (WalletPage và các component con). */

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const fmtMoney = (n: number) => currency.format(n);

export const fmtTime = (s: string) =>
  new Date(s).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const TX_REASON_LABELS: Record<string, string> = {
  // Backend reason codes (from WalletTransaction model)
  payos_topup: 'Wallet Deposit (PayOS)',
  topup: 'Wallet Deposit',
  reservation_fee: 'Reservation Fee',
  parking_checkout: 'Parking Fee',
  parking_fee: 'Parking Fee',
  reservation_refund: 'Reservation Refund',
  refund: 'Refund',
  long_term_subscription: 'Long-term Subscription',
  wallet_payment: 'Wallet Payment',
  admin_credit: 'Admin Credit Adjustment',
};

export const TOP_UP_OPTIONS = [50_000, 100_000, 200_000, 500_000];

export type TxFilter = 'all' | 'credit' | 'debit';

export interface PendingTopUp {
  amount: number;
  checkoutUrl: string;
  orderCode: number;
  qrCode?: string;
}

export type CopyField = 'account' | 'amount' | 'desc' | 'order';

export const BANK_BIN_MAP: Record<string, string> = {
  '970422': 'MB Bank (Military Commercial Joint Stock Bank)',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970423': 'TPBank',
  '970432': 'VPBank',
  '970403': 'Sacombank',
};

/** Đọc bank BIN / số tài khoản / tên chủ TK từ chuỗi VietQR (EMVCo TLV). */
export function parseVietQR(qrString?: string) {
  if (!qrString) return null;
  try {
    const parseTags = (str: string) => {
      const result: Record<string, string> = {};
      let idx = 0;
      while (idx < str.length) {
        const id = str.substring(idx, idx + 2);
        const len = parseInt(str.substring(idx + 2, idx + 4), 10);
        if (Number.isNaN(len)) break;
        const val = str.substring(idx + 4, idx + 4 + len);
        result[id] = val;
        idx += 4 + len;
      }
      return result;
    };

    const rootTags = parseTags(qrString);
    const tag38 = rootTags['38'];
    if (!tag38) return null;

    const sub38 = parseTags(tag38);
    const tag01 = sub38['01'];
    if (!tag01) return null;

    const sub01 = parseTags(tag01);
    return {
      bankBin: sub01['00'],
      accountNumber: sub01['01'],
      accountName: rootTags['59'] || 'PHAM XUAN LOC',
    };
  } catch {
    return null;
  }
}
