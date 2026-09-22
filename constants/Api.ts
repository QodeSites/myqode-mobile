export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://myqode.qodeinvest.com/api/mobile';

// Dev: 'https://njvbrnd9-2069.inc1.devtunnels.ms/api/mobile'

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  CHECK_IDENTIFIER: '/auth/check-identifier',
  FORGOT_PASSWORD: '/auth/forgot',
  SEND_SETUP_OTP: '/auth/send-setup-otp',
  VERIFY_SETUP_OTP: '/auth/verify-setup-otp',
  COMPLETE_SETUP_OTP: '/auth/complete-otp-setup',
  DEV_CLIENTS: '/dev/clients',

  // Portfolio
  PERFORMANCE: '/portfolio/performance',
  NAV: '/portfolio/nav',
  DRAWDOWN: '/portfolio/drawdown',
  QUARTERLY_PL: '/portfolio/quarterly-pl',
  MONTHLY_PL: '/portfolio/monthly-pl',
  CASHFLOW: '/portfolio/cashflow',
  SNAPSHOT: '/portfolio/snapshot',

  // Primary UCC (Nuvama WealthSpectrum login code)
  PRIMARY_UCC: '/primary-ucc',

  // Services
  TRANSACTIONS: '/services/transactions',
  ADD_FUNDS: '/services/add-funds',
  SWITCH_STRATEGY: '/services/switch',
  BANK_DETAILS: '/services/bank-details',
  SETUP_SIP: '/services/setup-sip',
  CANCEL_SIP: '/services/cancel-sip',
  PAUSE_RESUME_SIP: '/services/pause-resume-sip',
  WITHDRAWAL: '/services/withdrawal',
  STRATEGY_INQUIRY: '/services/strategy-inquiry',
  DISCUSSION: '/services/discussion',
  ACCOUNT_REQUEST: '/services/account-request',

  // Experience
  FAMILY: '/experience/family',

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
  PORTAL_GUIDE: '/engagement/portal-guide',

  // Portfolio — combined (owner scope, Level 2)
  COMBINED_PERFORMANCE: '/portfolio/combined-performance',
  COMBINED_NAV: '/portfolio/combined-nav',
  COMBINED_DRAWDOWN: '/portfolio/combined-drawdown',
  COMBINED_QUARTERLY_PL: '/portfolio/combined-quarterly-pl',
  COMBINED_MONTHLY_PL: '/portfolio/combined-monthly-pl',
  COMBINED_CASHFLOW: '/portfolio/combined-cashflow',

  // Admin
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_IMPERSONATE: '/admin/impersonate',
  ADMIN_ANALYTICS: '/admin/analytics',

  // Analytics (internal — called by Analytics utility, not directly in screens)
  ANALYTICS: '/engagement/analytics',

  // About
  TEAM: '/about/team',
  STRATEGIES: '/about/strategies',

  // Payments
  PAYMENTS_CREATE_ORDER: '/payments/create-order',
  PAYMENTS_INVESTMENT_STATUS: '/payments/investment-status',
  PAYMENTS_VERIFY: '/payments/verify',
  PAYMENTS_VERIFY_SIP: '/services/verify-sip',

  // Push notifications
  REGISTER_PUSH_TOKEN: '/services/register-push-token',

  // App version / force-update gate
  APP_VERSION: '/app-version',
} as const;
