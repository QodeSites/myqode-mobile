# Google Play Store Listing — myQode
## Copy-paste everything below directly into Play Console

---

## APP NAME (max 50 chars)
myQode – Qode Invest Client Portal

---

## SHORT DESCRIPTION (max 80 chars)
Invest, track & manage your Qode Invest PMS portfolio — all in one place.

---

## FULL DESCRIPTION (max 4000 chars)
myQode is the official client portal for Qode Invest Portfolio Management Service (PMS) clients. Designed for serious investors who value clarity, control, and seamless access to their wealth — myQode puts your entire investment journey at your fingertips.

PORTFOLIO PERFORMANCE
View your live NAV chart, trailing returns, drawdown analysis, and quarterly P&L — all benchmarked against relevant indices (NIFTY 50, NIFTY MIDCAP 150, NIFTY MICROCAP 250 and more). Track performance across multiple strategies and time periods in one clean dashboard.

PORTFOLIO SNAPSHOT
See your complete portfolio at a glance — current value, amount invested, total returns (CAGR), inception date, and strategy breakdown. Supports multi-account and family portfolio aggregation.

INVEST & MANAGE
- Make one-time investments directly from the app via secure payment gateway
- Set up, pause, resume, and cancel SIP (Systematic Investment Plan) subscriptions
- Submit withdrawal requests with notes
- Initiate strategy switches and reallocations (QFH, QAW, QTF, QGF)
- Track your full investment lifecycle from payment to deployment

DOCUMENT VAULT
Securely access all your account documents — PMS agreements, account opening documents, CML, and compliance disclosures — powered by signed, time-limited AWS S3 links.

ACCOUNT SERVICES
Submit service requests, ask fund manager questions, initiate strategy discussions, and manage family account mapping — all without calling or emailing.

INVESTOR ENGAGEMENT
Stay connected with Qode Invest through:
- Qode Perspectives newsletters
- Market insights and research
- Event materials and recordings
- Investor portal video guides
- Referral programme

BUILT FOR SECURITY
- All data encrypted in transit via HTTPS/TLS
- Authentication tokens stored in your device's secure enclave (iOS Keychain / Android Keystore)
- JWT-based session management with 30-day expiry
- No sensitive financial data stored permanently on device
- Role-based access control — you can only view your own portfolio

EXCLUSIVE ACCESS
myQode is available exclusively to registered Qode Invest PMS clients. To open an account, visit qodeinvest.com.

---

## WHAT'S NEW (for first release)
Initial release of myQode — the official Qode Invest PMS client portal.
- Live portfolio performance with NAV & drawdown charts
- Portfolio snapshot with multi-account aggregation
- One-time investments and SIP management via Cashfree
- Strategy switch, withdrawal and service request workflows
- Secure document vault with time-limited access
- Qode Perspectives, newsletters, events and insights hub
- Investor referral programme

---

## APP CATEGORY
Finance

---

## TAGS (up to 5)
1. Investment
2. Portfolio Management
3. Wealth Management
4. PMS
5. SIP

---

## CONTACT DETAILS
- Email: support@qodeinvest.com
- Website: https://qodeinvest.com
- Privacy Policy URL: https://qodeinvest.com/privacy-policy

---

## CONTENT RATING QUESTIONNAIRE ANSWERS
Category: Finance
- Does your app contain user-generated content? → NO
- Does your app contain violence? → NO
- Does your app contain sexual content? → NO
- Does your app contain profanity? → NO
- Does your app contain controlled substances? → NO
- Does your app contain gambling? → NO
- Is your app a news app? → NO
Expected rating: Everyone

---

## TARGET AUDIENCE
- Primary age group: 18 and above
- Does your app appeal to children? → NO

---

## APP ACCESS
Select: "All or some functionality is restricted"

Instructions for reviewer:
"This app is a private PMS client portal for registered Qode Invest clients.
A dedicated reviewer account with full mock data has been set up:

  Email:    reviewer@qodeinvest.com
  Password: Review@123

After login, you will see a fully populated portfolio dashboard with:
- NAV performance charts and trailing returns
- Portfolio snapshot with mock account data
- Document vault with sample documents
- Investment and SIP management screens
- All service request workflows

Note: This reviewer account serves mock/demo data and is not connected to real funds."

---

## DATA SAFETY ANSWERS

### Does your app collect or share any user data? → YES

### Data Collected:
| Data Type              | Category        | Required | Shared | Encrypted | Deletable |
|------------------------|----------------|----------|--------|-----------|-----------|
| Name                   | Personal info   | Yes      | No     | Yes       | Yes       |
| Email address          | Personal info   | Yes      | No     | Yes       | Yes       |
| Phone number           | Personal info   | No       | No     | Yes       | Yes       |
| User IDs (clientCode)  | Personal info   | Yes      | No     | Yes       | Yes       |
| Financial info         | Financial       | Yes      | No     | Yes       | Yes       |
| Purchase history       | Financial       | Yes      | No     | Yes       | Yes       |
| PAN number             | Sensitive info  | No       | No     | Yes       | Yes       |
| App interactions       | App activity    | Yes      | No     | Yes       | No        |

### Key answers:
- Is all data encrypted in transit? → YES (HTTPS/TLS on all API calls)
- Do you offer data deletion? → YES (users can request via support@qodeinvest.com)
- Data shared with third parties? → NO
- Data used for tracking/advertising? → NO
- Is collection required for app to function? → YES

### Third-party payments:
The app integrates with Cashfree Payments for processing investments and SIPs.
Cashfree's privacy policy: https://www.cashfree.com/privacy-policy

---

## GOVERNMENT APPS
Is this a government app? → NO

---

## FINANCIAL FEATURES
Does your app display or facilitate access to financial accounts? → YES

Select ALL that apply:
- ✅ Displays financial account information (portfolio value, NAV, P&L)
- ✅ Facilitates the purchase of financial products (one-time investments, SIP)
- ✅ Transfers money (investments via Cashfree payment gateway)

---

## HEALTH
Does your app collect health or fitness data? → NO

---

## ADS
Does your app contain ads? → NO

---

## PAYMENTS DECLARATION
This app processes real financial transactions via Cashfree Payments (PCI-DSS compliant).
Payment processing is handled entirely by the Cashfree SDK — card/UPI/bank details
are never stored by myQode.
