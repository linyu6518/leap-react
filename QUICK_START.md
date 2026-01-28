# LEAP Angular - Quick Start Guide

## 📦 Package Contents

**File**: `leap-angular-v1.0.0.tar.gz` (208 KB)

This package contains the complete LEAP (Liquidity Explain & Analytics Platform) Angular application source code, ready for deployment.

---

## 🚀 Quick Installation (5 minutes)

### Prerequisites
- Node.js v18 or v20 (LTS): https://nodejs.org/
- npm v9+ (included with Node.js)

### Step 1: Extract Package
```bash
tar -xzf leap-angular-v1.0.0.tar.gz
cd leap-angular
```

### Step 2: Install Dependencies
```bash
npm install
```
⏱️ This takes ~2-3 minutes. It will download ~500MB of packages.

### Step 3: Start Application
```bash
npm start
```
✅ The app will open automatically at `http://localhost:4200/`

---

## 🔐 Login Credentials

Use these demo accounts to access the application:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| **maker1** | maker123 | Maker | Create & submit data |
| **checker1** | checker123 | Checker | Review & approve data |
| **admin1** | admin123 | Admin | Full system access |
| **finance1** | finance123 | Finance | View-only access |

💡 **Tip**: Use the "Quick Login" buttons on the login page for instant access!

---

## 📱 Key Features

✅ **11 functional pages** fully implemented
✅ **4 Reports**: FR2052a, STWF, Appendix VI, OSFI LCR
✅ **3 Templates**: Data Import, Product Mapping, Threshold Settings
✅ **Enterprise-scale data**: 200 rows, $500M-$50B amounts
✅ **TD Bank branding**: Logo and TD Green (#00843D)
✅ **Role-based access control**: Maker, Checker, Admin, Finance
✅ **NgRx state management** for data flow
✅ **AG Grid** tables with sorting, filtering
✅ **Responsive design** for desktop/tablet

---

## 🎉 You're Ready!

Follow the 3 steps above and you'll have LEAP running in **5 minutes**.

For detailed documentation, see `DEPLOYMENT_GUIDE.md` inside the package.

**Happy exploring!** 🚀
