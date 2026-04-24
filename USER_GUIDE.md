# LEAP Project - User Guide

**File:** LEAP-Project-Delivery.zip  
**Package Date:** February 2025

---

## Quick Start

### 1. Extract the Package
- **Mac/Linux:** `unzip LEAP-Project-Delivery.zip` then `cd LEAP-Project-Delivery/leap-react`
- **Windows:** Right-click the zip file → Extract All, then open a terminal in `LEAP-Project-Delivery\leap-react`

### 2. Install Dependencies (Required on First Run)
```bash
npm install
```
Note: This may take 5–10 minutes and will download approximately 500MB of dependencies.

### 3. Start the Application
```bash
npm run dev
```
The app will be available at **http://localhost:4201**

---

## System Requirements

- Node.js >= 18.13.0  
- npm >= 9.0.0  

Check versions:
```bash
node -v
npm -v
```
If Node.js is not installed, download the LTS version from https://nodejs.org/

---

## Login Credentials

Use Quick Login buttons on the login page, or enter manually:

| Role    | Username  | Password   |
|---------|-----------|------------|
| Maker   | maker1    | maker123   |
| Checker | checker1  | checker123 |
| Admin   | admin1    | admin123   |
| Finance | finance1  | finance123 |

---

## Key Features & Pages

- **Dashboard** – Data overview and KPIs  
- **Product Analysis** – Deposits, BuyBack, Loan Commitments  
- **Regulatory Views** – LCR, NSFR, NCCF, ILST  
- **Maker Workspace** – Create, adjust, add commentary, submit  
- **Checker Workspace** – Review and approve/reject  
- **Admin** – Audit log (Admin only)

---

## Main Capabilities

- **Query Panel** – Filter by Region, Segment, and Date  
- **Variance Highlighting** – Rows exceeding threshold highlighted  
- **Commentary** – Add notes via the comment icon  
- **Export** – Excel/CSV (demo/stub in current build)  
- **Toast Notifications** – Success and error messages  
- **Navigation Tree** – Left sidebar with 3-level collapsible menu  

---

## FAQ

**Q: npm install fails?**  
A: Delete the `node_modules` folder and run `npm install` again. You can also try a mirror:  
`npm config set registry https://registry.npmmirror.com`

**Q: Port 4201 is in use?**  
A: Edit `vite.config.ts` and change the `port` value (e.g. to 4202), or run:  
`npm run dev -- --port 4202`

**Q: Blank page in browser?**  
A: Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows).

**Q: How do I stop the server?**  
A: In the terminal, press Ctrl+C.

---

## Project Documentation

The package includes:

- **README.md** – Project overview  
- **DEVELOPMENT.md** – Development guide (if present)  
- **PROJECT_SUMMARY.md** – Implementation summary  
- **PRD.md** – Product requirements  
- **DESIGN_SPEC.md** – Design specification  
- **USER_GUIDE.md** – This file  
- **DELIVERY_SUMMARY.md** – Delivery summary  
- **PROJECT_INTRODUCTION.md** – High-level introduction  

---

## Tech Stack

- React 18  
- TypeScript 5  
- Vite 5  
- Redux Toolkit (state)  
- Ant Design 5  
- AG Grid 31  
- ECharts 5  

---

## Support

For technical details, see the docs above or:

- React: https://react.dev/  
- Vite: https://vitejs.dev/  
- AG Grid: https://www.ag-grid.com/  

Thank you for using LEAP.
