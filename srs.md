# 📄 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## SIDHESWAR DRUGS HOUSE

### Pharmacy Management & eCommerce System

---

# 1. 📌 INTRODUCTION

## 1.1 Purpose

This SRS defines the complete requirements for building a **full-scale pharmacy management system** for **SIDHESWAR DRUGS HOUSE**, combining:

- 🏪 Offline POS Billing
- 🌐 Online eCommerce Medicine Ordering
- 📦 Inventory & Batch Management
- 💊 Prescription Handling
- 🧾 GST Billing & Compliance
- 🚨 Alerts (Low Stock + Expiry)

The goal is to **digitize and automate the entire pharmacy business**.

---

## 1.2 Scope

The system will:

- Enable **walk-in customer billing (POS)**
- Enable **online medicine ordering with payment**
- Maintain **real-time stock synchronization**
- Track **batch-wise expiry & pricing**
- Provide **alerts for stock & expiry**
- Generate **GST-compliant invoices**
- Send **WhatsApp invoices automatically**
- Allow **admin-level monitoring & control**

---

## 1.3 Definitions

| Term         | Meaning                                            |
| ------------ | -------------------------------------------------- |
| POS          | Point of Sale (offline billing system)             |
| Batch        | Medicine group with same expiry & purchase         |
| GST          | Tax applied on medicines                           |
| SKU          | Unique medicine identifier                         |
| Prescription | Doctor-issued document required for some medicines |

---

# 2. 🧠 SYSTEM OVERVIEW

## 2.1 System Architecture

The system consists of:

- Frontend (Customer + Admin + POS)
- Backend APIs
- Central Database
- Payment Gateway Integration (Razorpay)
- Messaging Integration (WhatsApp Business API)

---

## 2.2 User Roles

### 👤 Customer (Online)

- Register/Login (OTP)
- Browse medicines
- Upload prescription
- Place order & pay
- Track orders

---

### 🧑‍⚕️ Pharmacist (POS User)

- Create offline bills
- Scan/search medicines
- Apply discounts
- Generate invoice
- Send invoice via WhatsApp

---

### 🧑‍💼 Admin

- Manage medicines & stock
- Manage vendors & purchases
- Verify prescriptions
- Monitor sales & reports
- Configure system rules

---

# 3. ⚙️ FUNCTIONAL REQUIREMENTS

---

## 3.1 Medicine & Inventory Management

### Features:

- Add/Edit/Delete medicine
- Categorization (tablet, syrup, etc.)
- Manufacturer details

---

## 3.2 Batch Management (CORE MODULE)

Each medicine must support multiple batches:

**Batch Attributes:**

- Batch Number
- Expiry Date
- Purchase Price
- Selling Price (MRP)
- GST %
- Quantity

### Behavior:

- Stock tracked per batch
- Billing uses batch selection
- FIFO (First Expiry First Out) recommended

---

## 3.3 Purchase Management

- Add purchase entries from vendors
- Store:
  - Vendor name
  - Invoice number
  - Batch details

- Stock auto-increases

---

## 3.4 Offline Billing System (POS)

### Features:

- Search medicine OR scan barcode
- Select batch
- Auto-fill:
  - GST
  - Price

- Add quantity
- Apply:
  - Per item discount
  - Full bill discount

---

### Validation:

- Expired medicine → ❌ block
- Low stock → ⚠️ warning

---

### Output:

- GST invoice generation
- Print option
- WhatsApp invoice sending

---

## 3.5 Online Ordering System

### Features:

- Product listing
- Cart system
- Razorpay payment integration
- Order placement

---

### Rules:

- Prescription-required medicines must:
  - Require upload
  - Be admin-approved

---

## 3.6 Prescription Management

### Flow:

1. User uploads prescription
2. Admin reviews
3. Admin approves/rejects
4. Order continues

---

## 3.7 GST & Invoice Management

- Auto GST calculation
- CGST + SGST split
- Invoice includes:
  - Business details
  - Item breakdown
  - Tax details

---

## 3.8 Discount System

### Types:

- Per medicine discount
- Total bill discount

### Rules:

- Max discount limit
- Margin-aware restriction

---

## 3.9 Low Stock Alert System

### Logic:

- If stock ≤ threshold → alert

### Features:

- Dashboard alert
- POS warning
- Optional notification

---

## 3.10 Expiry Alert System (CRITICAL)

### Types:

- 🔴 Expired → Block sale
- 🟠 Near expiry (≤30 days) → Warning

### Behavior:

- Daily automated check
- Real-time validation during billing

---

## 3.11 Notification System

- WhatsApp invoice sending
- Alert notifications (future)
- Order updates

---

## 3.12 Reports & Analytics

- Daily sales
- Monthly sales
- Inventory valuation
- Expiry report
- Profit margins

---

# 4. 🔄 SYSTEM WORKFLOWS

---

## 4.1 Offline Billing Flow

1. Scan/Search medicine
2. Select batch
3. Add quantity
4. Apply discount
5. Generate invoice
6. Send via WhatsApp
7. Update stock

---

## 4.2 Online Order Flow

1. User selects medicine
2. Uploads prescription (if required)
3. Payment via Razorpay
4. Admin verification
5. Order processed
6. Delivery within 24 hours

---

## 4.3 Expiry Monitoring Flow

1. Daily scheduler runs
2. Checks all batches
3. Marks:
   - Expired
   - Near expiry

4. Updates dashboard

---

# 5. 🗄️ DATA MODEL (HIGH LEVEL)

---

## Entities:

### Medicine

- id, name, category, manufacturer

### Batch

- batch_id, medicine_id
- expiry_date
- purchase_price
- selling_price
- GST
- quantity

---

### Vendor

- id, name, contact

---

### Invoice

- invoice_id
- items
- total
- GST breakdown

---

### Order

- order_id
- user_id
- status
- payment status

---

### Prescription

- id
- user_id
- file
- status

---

# 6. ⚡ NON-FUNCTIONAL REQUIREMENTS

---

## 6.1 Performance

- Billing response < 2 sec
- Fast search & scan

---

## 6.2 Security

- OTP login
- Data encryption
- Secure prescription storage

---

## 6.3 Reliability

- Accurate stock sync
- No duplicate billing

---

## 6.4 Scalability

- Support multi-store (future)
- Handle large inventory

---

## 6.5 Usability

- Simple UI for pharmacist
- Fast POS operations

---

# 7. 🚀 FUTURE ENHANCEMENTS

- AI-based medicine detection (camera)
- Delivery tracking system
- Auto vendor ordering
- Dynamic pricing
- Mobile app

---

# 8. 🏷️ BRANDING REQUIREMENTS

- All invoices must include:
  - **SIDHESWAR DRUGS HOUSE**
  - Address, Phone, GSTIN

- WhatsApp message branding

- Admin dashboard branding

---

# 9. ✅ CONCLUSION

This system is a **complete pharmacy digital ecosystem** that includes:

- POS + Inventory
- eCommerce
- Compliance (GST + Prescription)
- Smart alerts (Stock + Expiry)

It will:

- Reduce manual errors
- Prevent stock loss
- Increase efficiency
- Enable business scalability

---

# 🔥 FINAL NOTE

This is a **production-level enterprise system**, not a small project.

### Recommended Development Phases:

1. Inventory + Batch + Expiry
2. POS Billing + GST
3. Online Ordering
4. Alerts + Automation
5. Advanced features

---

**Prepared for:** SIDHESWAR DRUGS HOUSE
**Type:** Full Stack Pharmacy System
**Status:** Ready for Development 🚀

---
