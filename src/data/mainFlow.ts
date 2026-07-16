export interface LegacyModule {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  available: boolean;
}

export const mainFlowModules: LegacyModule[] = [
  {
    id: 'auth',
    title: 'Login / Register',
    description: 'Create an account or login to experience the full features of the system.',
    actionLabel: 'Login',
    available: true,
  },
  {
    id: 'profile',
    title: 'Personal Profile',
    description: 'Update personal details, link license plates, and manage your vehicles.',
    actionLabel: 'View Profile',
    available: true,
  },
  {
    id: 'wallet',
    title: 'E-Wallet',
    description: 'Deposit, view balance, and track your complete payment transaction history.',
    actionLabel: 'Open Wallet',
    available: true,
  },
  {
    id: 'buildings',
    title: 'Parking Lots',
    description: 'Browse operating parking lots, locations, hours, and real-time vacant slots.',
    actionLabel: 'Find Parking',
    available: true,
  },
  {
    id: 'packages',
    title: 'Long-term Subscriptions',
    description: 'Subscribe to monthly/yearly packages — one plate, one package, better rates than hourly parking.',
    actionLabel: 'View Packages',
    available: true,
  },
  {
    id: 'buy-package',
    title: 'Buy Package',
    description: 'Purchase a long-term parking package, optionally pick a fixed slot, and pay from your wallet.',
    actionLabel: 'Buy Package',
    available: true,
  },
  {
    id: 'sessions',
    title: 'Parking History',
    description: 'Review vehicle entries/exits, total parking duration, and payments.',
    actionLabel: 'Coming Soon',
    available: false,
  },
  {
    id: 'feedback',
    title: 'Service Reviews',
    description: 'Share your parking experience — your ratings and feedback help us improve.',
    actionLabel: 'Rate Now',
    available: true,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Receive system notifications regarding packages, subscriptions, and account updates.',
    actionLabel: 'Coming Soon',
    available: false,
  },
];

