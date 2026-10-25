# K7 ENTERPRISE — DEPLOYMENT, BACKUP & PRODUCTION GUIDE
**Aachi Masala Authorized Distributor — Thoothukudi, Tamil Nadu, India**

---

## 1. Executive Deployment Overview

K7 Enterprise is built with **React 19 + TypeScript + Vite + Tailwind CSS**, connected to **Firebase (Authentication, Cloud Firestore, Firebase Storage, and Hosting)**.

### Technology Stack
- **Frontend Framework**: React 19 with Strict TypeScript
- **Styling**: Tailwind CSS enterprise theme (`#B71C2C` deep-red brand token, Inter typography, 8px grid)
- **Primary Backend**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **Accounting Engine**: Tally-style double-entry bookkeeping engine with balanced debit/credit validation
- **Inventory Engine**: FEFO (First-Expiring, First-Out) batch tracking and immutable stock movement ledger

---

## 2. Environment Variables Configuration

Create a `.env.production` file in the root directory:

```env
# Production Firebase Project Configuration
VITE_FIREBASE_API_KEY=AIzaSyYourProductionApiKeyHere
VITE_FIREBASE_AUTH_DOMAIN=k7-enterprise-thoothukudi.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=k7-enterprise-thoothukudi
VITE_FIREBASE_STORAGE_BUCKET=k7-enterprise-thoothukudi.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1029384756
VITE_FIREBASE_APP_ID=1:1029384756:web:aachi9876543210
```

> **Note**: If environment variables are omitted or in offline staging mode, the application automatically functions with its built-in high-fidelity reactive data store, preserving full transactional integrity without breaking.

---

## 3. Firebase Deployment Steps

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase in Workspace
```bash
firebase init
```
Select:
- **Firestore**: Select existing project or create new (`k7-enterprise-thoothukudi`). Use `firestore.rules`.
- **Storage**: Use `storage.rules`.
- **Hosting**: Set public directory to `dist`, configure as single-page app (SPA: `Yes`).

### Step 4: Run Automated Acceptance Tests
```bash
npm test
```
All 30 automated workflow verification tests must pass (100%).

### Step 5: Build Production Distribution
```bash
npm run build
```

### Step 6: Deploy Security Rules & Hosting
```bash
firebase deploy --only firestore:rules,storage,hosting
```

---

## 4. Custom Domain & HTTPS Configuration

To connect a custom business domain (e.g., `distributor.k7enterprise.in` or `app.k7enterprise.com`):

1. In the **Firebase Console**, go to **Hosting** $\rightarrow$ **Custom Domains** $\rightarrow$ **Add Custom Domain**.
2. Enter your authorized domain name: `k7enterprise.in` or `orders.k7enterprise.in`.
3. Firebase will generate two `A` records or a `CNAME` record.
4. Add the records in your DNS provider (Cloudflare, GoDaddy, Namecheap):
   ```
   Type: A
   Host: @ or orders
   Value: 199.36.158.100
   Value: 199.36.158.100
   ```
5. Firebase automatically provisions and renews SSL/TLS certificates (Let's Encrypt) within 24 hours.

---

## 5. Security Rules Verification

The platform ships with production-grade Firestore Security Rules in [`firestore.rules`](./firestore.rules) and Storage rules in [`storage.rules`](./storage.rules):

1. **Role-Based Access Control**:
   - Only `admin` can modify user roles, grant permissions, and alter business master settings.
   - `distributor` (Operations Manager) can receive stock, dispatch orders, and post vouchers.
   - `sales_rep` and `retailer` can browse catalogue and place orders, but cannot modify prices or stock levels directly.
2. **Double-Entry Ledger Immutability**:
   - `journalEntries` and `inventoryMovements` collections are **append-only**. Deleting or overwriting existing financial or stock movements is strictly prohibited by security rules. Corrections must use reversing vouchers.
3. **Storage Rules**:
   - Product images and proof-of-delivery receipts are restricted to max 5MB and validated MIME types (`image/jpeg`, `image/png`, `image/webp`).

---

## 6. Backup and Disaster Recovery Procedure

### Cloud Firestore Daily Automated Backups
Run automated scheduled backups to a Google Cloud Storage bucket in the `asia-south1` (Mumbai) region:

```bash
gcloud firestore export gs://k7-enterprise-firestore-backups/daily/$(date +%Y-%m-%d)
```

### Emergency Restore Procedure
To restore a snapshot in the event of an operational disaster:
```bash
gcloud firestore import gs://k7-enterprise-firestore-backups/daily/YYYY-MM-DD
```

---

## 7. Business Master Details (K7 Enterprise)

- **Business Name**: K7 Enterprise
- **Authorized Dealership**: Aachi Masala Distributor
- **Registered Address**: 142/3 Palayamkottai Road, Near VVD Signal, Cruz Fernandez Puram, Thoothukudi - 628002, Tamil Nadu
- **GSTIN**: `33AAECK7890C1Z5`
- **FSSAI License**: `12423024000341`
- **Settlement Bank**: Tamilnad Mercantile Bank (TMB), Beach Road Branch, Thoothukudi
- **Current Account Number**: `00410005081920`
- **IFSC Code**: `TMBL0000004`
- **UPI ID**: `k7enterprise@tmb`
