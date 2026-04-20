# Claude in Chrome Prompt — Google Play Console Setup
## Paste this entire prompt into Claude in Chrome with Play Console open

---

You are helping me complete the full Google Play Store setup for my app myQode. I am already logged into Google Play Console at https://play.google.com/console and the app has been created with package com.qodeinvest.myqode. Work through every section below one by one. Save after each section before moving to the next.

---

## SECTION 1 — Privacy Policy
Navigate to: Policy → App content → Privacy policy
Set URL to: https://qodeinvest.com/privacy-policy
Save.

---

## SECTION 2 — App Access
Navigate to: Policy → App content → App access
Select: "All or some functionality is restricted"
Click "Add new instructions" and fill in:
- Name: Reviewer Login
- Username: reviewer@qodeinvest.com
- Password: Review@123
- Other instructions: "This is a private PMS client portal. Use the credentials above to log in. After login you will see a fully populated portfolio dashboard with NAV charts, portfolio snapshot, documents, and investment screens. All data shown is mock/demo data."
Save.

---

## SECTION 3 — Ads
Navigate to: Policy → App content → Ads
Select: No, my app does not contain ads
Save.

---

## SECTION 4 — Content Rating
Navigate to: Policy → App content → Content rating
Click "Start questionnaire"
- Select category: Finance
- Answer NO to every single question presented
- Click Continue through all pages
- Click Submit
Apply the rating.

---

## SECTION 5 — Target Audience
Navigate to: Policy → App content → Target audience
- Select age group: 18 and above
- Does your app appeal to children? → No
Save.

---

## SECTION 6 — Data Safety
Navigate to: Policy → App content → Data safety
Answer as follows:

Does your app collect or share any of the required user data types? → Yes

Under "Data collected", add the following:

1. Personal info → Name
   - Required for app to function: Yes
   - Shared with third parties: No
   - Encrypted in transit: Yes
   - User can request deletion: Yes

2. Personal info → Email address
   - Required: Yes, Shared: No, Encrypted: Yes, Deletable: Yes

3. Personal info → User IDs
   - Required: Yes, Shared: No, Encrypted: Yes, Deletable: Yes

4. Personal info → Phone number
   - Required: No, Shared: No, Encrypted: Yes, Deletable: Yes

5. Financial info → Financial info (general)
   - Required: Yes, Shared: No, Encrypted: Yes, Deletable: Yes

6. Financial info → Purchase history
   - Required: Yes, Shared: No, Encrypted: Yes, Deletable: Yes

7. App activity → App interactions
   - Required: Yes, Shared: No, Encrypted: Yes, Deletable: No

Security practices:
- Is all data encrypted in transit? → Yes
- Do you offer a way for users to request data deletion? → Yes

Data sharing:
- Do you share data with third parties? → No
- Is data used for tracking or advertising? → No

Save and submit data safety form.

---

## SECTION 7 — Government Apps
Navigate to: Policy → App content → Government apps
Select: No
Save.

---

## SECTION 8 — Financial Features
Navigate to: Policy → App content → Financial features
Select: Yes — this app displays or facilitates financial accounts
Check ALL of the following:
- Displays financial account information
- Facilitates the purchase of financial products or services
- Transfers money or facilitates financial transactions
Save.

---

## SECTION 9 — Health Apps
Navigate to: Policy → App content → Health
Select: No
Save.

---

## SECTION 10 — App Category & Contact Details
Navigate to: Store presence → Main store listing → App category
- App type: Application
- Category: Finance
- Add tags: Investment, Portfolio Management, Wealth Management, PMS, SIP
Contact details:
- Email: support@qodeinvest.com
- Website: https://qodeinvest.com
- Phone: (leave blank)
Save.

---

## SECTION 11 — Main Store Listing
Navigate to: Store presence → Main store listing

App name:
myQode – Qode Invest Client Portal

Short description (80 chars):
Invest, track & manage your Qode Invest PMS portfolio — all in one place.

Full description (paste exactly):
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
Securely access all your account documents — PMS agreements, account opening documents, CML, and compliance disclosures — powered by signed, time-limited secure links.

ACCOUNT SERVICES
Submit service requests, ask fund manager questions, initiate strategy discussions, and manage family account mapping — all without calling or emailing.

INVESTOR ENGAGEMENT
Stay connected with Qode Invest through Qode Perspectives newsletters, market insights, event materials, portal video guides, and the investor referral programme.

BUILT FOR SECURITY
- All data encrypted in transit via HTTPS/TLS
- Authentication tokens stored in your device's secure enclave
- JWT-based session management with 30-day expiry
- No sensitive financial data stored permanently on device
- Role-based access — you can only view your own portfolio

Exclusive Access: myQode is available exclusively to registered Qode Invest PMS clients. To open an account, visit qodeinvest.com.

For graphics and screenshots: SKIP these fields for now and notify me which upload fields still need manual attention.

Save store listing.

---

## AFTER COMPLETING ALL SECTIONS

Tell me:
1. Which sections show a green checkmark ✅ in Play Console
2. Which sections still show warnings or are incomplete
3. Which fields require manual file uploads (screenshots, feature graphic, icon)
4. Whether the app is ready to proceed to internal testing track
