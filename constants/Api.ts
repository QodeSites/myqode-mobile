export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://myqode.qodeinvest.com/api';

// Dev: 'https://f2lxldmp-2069.inc1.devtunnels.ms/api/mobile'

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // Portfolio
  PERFORMANCE: '/portfolio/performance',
  NAV: '/portfolio/nav',
  DRAWDOWN: '/portfolio/drawdown',
  QUARTERLY_PL: '/portfolio/quarterly-pl',
  MONTHLY_PL: '/portfolio/monthly-pl',
  CASHFLOW: '/portfolio/cashflow',
  SNAPSHOT: '/portfolio/snapshot',

  // Services
  TRANSACTIONS: '/services/transactions',
  ADD_FUNDS: '/services/add-funds',
  SWITCH_STRATEGY: '/services/switch',
  BANK_DETAILS: '/services/bank-details',

  // Documents
  DOCUMENTS_LIST: '/documents/list',
  DOCUMENTS_FILES: '/documents/files',
  DOCUMENTS_DOWNLOAD: '/documents/download',

  // Engagement
  NEWSLETTERS: '/engagement/newsletters',
  PERSPECTIVES: '/engagement/perspectives',
  REFERRAL: '/engagement/referral',
  FEEDBACK: '/engagement/feedback',
  EVENTS: '/engagement/events',

  // About
  TEAM: '/about/team',
  STRATEGIES: '/about/strategies',

  // Payments
  PAYMENTS_CREATE_ORDER: '/payments/create-order',
  PAYMENTS_INVESTMENT_STATUS: '/payments/investment-status',
  PAYMENTS_VERIFY: '/payments/verify',
} as const;
