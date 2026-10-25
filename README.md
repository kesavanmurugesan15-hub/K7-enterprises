# K7 ENTERPRISE
### Enterprise FMCG Distribution, Retail Ordering, Inventory and Accounting Management Platform
**Aachi Masala Authorized Distributor — Thoothukudi, Tamil Nadu, India**

---

## Overview

K7 Enterprise is a production-oriented, responsive web application purpose-built for FMCG spice distribution operations in Thoothukudi, Tamil Nadu. It provides three role-based application shells operating against a shared Firebase backend:

- **Panel A: Administrator**: Executive control, team management, catalogue pricing, business settings, and security audit logs.
- **Panel B: Distributor Operations**: Daily distribution workflows, purchase orders, goods receipt notes (GRN), auditable inventory ledger with FEFO batch tracking, 11-stage delivery tracker, and collections/expenses.
- **Panel C: Employee and Retailer Ordering**: Touch-friendly mobile ordering portal, real-time product availability, shopping cart with server-side price validation, and live Firestore delivery timeline updates.
- **Integrated Tally-Style Double-Entry Accounting**: Configurable Chart of Accounts (COA), 8 voucher types with balanced $\sum \text{Dr} = \sum \text{Cr}$ verification, Day Book, General Ledger, Trial Balance, Profit & Loss statement, and Balance Sheet.
- **Bank Reconciliation Workspace**: Electronic bank statement CSV import, automatic transaction matching, and reconciliation history.

---

## Visual Identity & Design System

- **Primary Brand Red**: `#B71C2C` (Aachi Masala distributor identity)
- **Dark Red Hover**: `#941827`
- **Main Background**: `#F5F6F8` (Neutral cool grey enterprise surface)
- **Content Surfaces**: `#FFFFFF` (Crisp cards, sheets, and data tables)
- **Primary Text**: `#20242B` (High-contrast charcoal typography)
- **Secondary Text**: `#667085` (Muted labels and metadata)
- **Borders & Dividers**: `#E3E6EA` (1px refined hairline borders)
- **Typography**: Inter sans-serif font scale with tabular numeric alignments

---

## 11-Stage Delivery Lifecycle

Every sales order moves through an audited 11-stage transition pipeline:
1. `ORDER_PLACED` $\rightarrow$
2. `PENDING_APPROVAL` (If credit limit exceeded) $\rightarrow$
3. `ACCEPTED` $\rightarrow$
4. `STOCK_ALLOCATED` $\rightarrow$
5. `PACKING_IN_PROGRESS` $\rightarrow$
6. `READY_FOR_DISPATCH` $\rightarrow$
7. `DISPATCHED` (Deducts stock on hand & logs movement) $\rightarrow$
8. `OUT_FOR_DELIVERY` $\rightarrow$
9. `DELIVERED` (Dropoff confirmation & recipient signature) $\rightarrow$
10. `FAILED_DELIVERY` (Delivery exception) $\rightarrow$
11. `CANCELLED` (Restores stock reservations)

---

## Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Run Automated Acceptance Test Suite
```bash
npm test
```
Executes all 30 end-to-end workflow validation tests (Product Catalogue, 11-stage Delivery, Inward GRN, Double-Entry Accounting, Bank Reconciliation, and Overselling Prevention).

### 4. Build for Production
```bash
npm run build
```

---

## Project Structure

```
├── firestore.rules          # Production Cloud Firestore Security Rules (RBAC)
├── storage.rules            # Firebase Storage Security Rules
├── DEPLOYMENT_AND_ADMIN_GUIDE.md # Production deployment, backup & recovery guide
├── src/
│   ├── types/               # TypeScript interfaces (auth, product, order, accounting, bank, credit)
│   ├── services/
│   │   ├── firebase.ts      # Firebase SDK client initialization
│   │   ├── dataService.ts   # Transaction-safe reactive data repository
│   │   └── seedData.ts      # Realistic Thoothukudi FMCG master dataset
│   ├── context/
│   │   ├── AuthContext.tsx  # Role-based identity & quick role switcher
│   │   └── BusinessContext.tsx # Live settings, notifications, shopping cart
│   ├── components/
│   │   ├── common/          # Badge, Button, Modal, StatCard, DeliveryStepper
│   │   ├── layout/          # Header, Sidebar, Notifications Drawer
│   │   ├── admin/           # Executive Dashboard, User Management, Product Catalogue, Settings, Audit
│   │   ├── operations/      # Purchases & GRN, Inventory Ledger & FEFO, 11-Stage Delivery Tracker, Collections
│   │   ├── ordering/        # Retailer Catalogue, Shopping Cart Checkout, Order History
│   │   ├── accounting/      # Chart of Accounts, Vouchers, Day Book, General Ledger, Trial Balance, P&L, Balance Sheet, Ageing
│   │   └── bank/            # Bank Statement Reconciliation
│   ├── tests/
│   │   └── acceptanceWorkflowTest.ts # 30-step end-to-end acceptance test suite
│   ├── App.tsx              # Main application shell and tab router
│   ├── main.tsx
│   └── index.css            # Tailwind base directives & print styling
```
