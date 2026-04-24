# LEAP – Project Introduction

**Liquidity Explain & Analytics Platform**

---

## What is LEAP?

LEAP is a **liquidity risk and analytics platform** built for TD Bank–style workflows. It replaces spreadsheet-based processes with a web application that supports:

- **Liquidity metrics** – LCR, NSFR, NCCF, ILST views and calculations  
- **Maker–Checker workflow** – Digital review, commentary, and approval  
- **Regulatory reporting** – FR2052a, STWF, Appendix VI, OSFI LCR–style reports  
- **Product analysis** – Deposits, BuyBack, Loan Commitments with variance and threshold alerts  
- **Dashboard** – Charts and KPIs for management  

The frontend runs **standalone with mock data** (no backend required) and is suitable for demos, training, and evaluation.

---

## Who Is It For?

- **Risk & Treasury teams** – Liquidity reporting and monitoring  
- **Makers** – Data review, adjustments, commentary, submission  
- **Checkers** – Approval, rejection, escalation  
- **Admins** – User management, audit log, settings  
- **Finance** – View-only access to reports and data  

---

## Tech Stack (Frontend)

- **React 18** + **TypeScript 5**  
- **Vite 5** – dev server and build  
- **Redux Toolkit** – state management  
- **Ant Design 5** – UI (TD Green theme)  
- **AG Grid** – data tables  
- **ECharts** – charts  

---

## Quick Start

1. Extract the delivery package (e.g. `LEAP-Project-Delivery.zip`).  
2. Open a terminal in the **leap-react** folder.  
3. Run: `npm install` then `npm run dev`.  
4. Open **http://localhost:4201** in your browser.  
5. Use the Quick Login buttons or demo accounts (see **USER_GUIDE.md**).  

**Requirements:** Node.js >= 18.13, npm >= 9.

---

## What’s in the Package?

- **leap-react/** – Full React frontend source (run with `npm run dev`)  
- **PRD.md** – Product requirements  
- **DESIGN_SPEC.md** – Design specification  
- **BACKEND_DEPLOYMENT_PLAN.md** – Backend and deployment guidance  
- **USER_GUIDE.md** – How to run, login, features, FAQ (English)  
- **PROJECT_INTRODUCTION.md** – This file  
- **DELIVERY_SUMMARY.md** – Delivery checklist and document index (English)  
- **PROJECT_SUMMARY.md** – Implementation summary  
- **QUICK_START.md** – Short quick-start steps  

---

## Demo Accounts

| Role    | Username  | Password   |
|---------|-----------|------------|
| Maker   | maker1    | maker123   |
| Checker | checker1  | checker123 |
| Admin   | admin1    | admin123   |
| Finance | finance1  | finance123 |

---

## Support

For setup, login, and features: see **USER_GUIDE.md**.  
For delivery scope and file list: see **DELIVERY_SUMMARY.md**.  
For product and design details: see **PRD.md** and **DESIGN_SPEC.md**.

Thank you for your interest in LEAP.
