# LEAP - Liquidity Explain & Analytics Platform
## Deployment Guide

### Project Overview
LEAP is a comprehensive liquidity management and regulatory reporting platform for TD Bank, built with Angular 17.3. It replaces Excel-based workflows with an enterprise-grade web application featuring:

- **Product Analysis**: Deposits, BuyBack, Loan Commitments
- **Regulatory Views**: LCR, NSFR, NCCF, ILST
- **Reports**: FR2052a, STWF, Appendix VI (HK), OSFI LCR (Canada)
- **Templates**: Data Import, Product Mapping, Threshold Settings
- **Maker-Checker Workflow**: Review and approval process
- **Administration**: User Management, Audit Log, System Settings

---

## System Requirements

### Development Environment
- **Node.js**: v18.x or v20.x (LTS recommended)
- **npm**: v9.x or higher
- **Angular CLI**: 17.3.x
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Browser Support
- Chrome 120+
- Firefox 115+
- Edge 120+
- Safari 16+

---

## Installation & Setup

### 1. Extract Project Files
```bash
tar -xzf leap-angular.tar.gz
cd leap-angular
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Angular 17.3.8
- Angular Material 17.3.8
- NgRx 17.2.0
- AG Grid 31.2.1
- ECharts 5.5.0

### 3. Start Development Server
```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200/`

### 4. Login Credentials

**Quick Login Accounts:**

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| maker1 | maker123 | Maker | Create and submit liquidity data |
| checker1 | checker123 | Checker | Review and approve submissions |
| admin1 | admin123 | Admin | Full system administration |
| finance1 | finance123 | Finance | View-only access to reports |

---

## Project Structure

```
leap-angular/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services & state management
│   │   │   ├── guards/              # Authentication & role guards
│   │   │   ├── services/            # AuthService, ExportService, etc.
│   │   │   └── state/               # NgRx store (Actions, Reducers, Effects)
│   │   ├── shared/                  # Shared components & modules
│   │   │   ├── components/          # Query Panel, Commentary Drawer
│   │   │   └── shared.module.ts     # Common imports
│   │   ├── layout/                  # Application layout
│   │   │   ├── header/              # Top navigation with logo
│   │   │   ├── sidebar/             # Left navigation tree
│   │   │   └── main-layout/         # Layout wrapper
│   │   ├── features/                # Feature modules (lazy-loaded)
│   │   │   ├── auth/                # Login page
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── product-analysis/    # Deposits, BuyBack, Loan Commitments
│   │   │   ├── regulatory-views/    # LCR, NSFR, NCCF, ILST
│   │   │   ├── reports/             # FR2052a, STWF, Appendix VI, OSFI LCR
│   │   │   ├── templates/           # Data Import, Mapping, Thresholds
│   │   │   ├── maker-workspace/     # Maker review interface
│   │   │   ├── checker-workspace/   # Checker approval interface
│   │   │   └── admin/               # User Management, Settings, Audit Log
│   │   ├── app.component.ts         # Root component
│   │   └── app-routing.module.ts    # Main routing configuration
│   ├── assets/                      # Static files (TD logo, images)
│   ├── styles.scss                  # Global styles
│   └── environments/                # Environment configurations
├── package.json                     # Dependencies & scripts
├── angular.json                     # Angular CLI configuration
├── tsconfig.json                    # TypeScript configuration
└── DEPLOYMENT_GUIDE.md              # This file
```

---

## Key Features & Pages

### 1. Product Analysis
- **Deposits** (`/product/deposits`): 200 rows, $500M-$50B scale data
- **BuyBack** (`/product/buyback`): Securities buyback analysis
- **Loan Commitments** (`/product/loan-commitments`): Commitment tracking

All pages feature:
- AG Grid tables with sorting, filtering
- Commentary drawer for notes
- Variance threshold highlighting
- Export to Excel/PDF

### 2. Regulatory Views
- **LCR** (`/regulatory/lcr`): Liquidity Coverage Ratio
- **NSFR** (`/regulatory/nsfr`): Net Stable Funding Ratio
- **NCCF** (`/regulatory/nccf`): Net Cash Capital Flow
- **ILST** (`/regulatory/ilst`): Intraday Liquidity Stress Testing

### 3. Reports
- **FR2052a** (`/reports/fr2052a`): US Federal Reserve LCR report
- **STWF** (`/reports/stwf`): Short-Term Wholesale Funding
- **Appendix VI** (`/reports/appendix-vi`): Hong Kong LMR report
- **OSFI LCR** (`/reports/osfi-lcr`): Canadian LCR report

Each report includes:
- Regulatory-compliant formatting
- Multiple data tables (HQLA, Outflows, Inflows)
- Calculated ratios and compliance status
- Export to Excel/PDF

### 4. Templates
- **Data Import** (`/templates/import`): File upload with history tracking
- **Product Mapping** (`/templates/mapping`): Regulatory treatment configuration
- **Threshold Settings** (`/templates/thresholds`): Monitoring thresholds by category

### 5. Workspace
- **Maker Review** (`/maker/review`): Submit data for approval
- **Checker Approval** (`/checker/approve`): Approve/reject submissions

### 6. Administration
- **User Management** (`/admin/users`): CRUD operations for users
- **Audit Log** (`/admin/audit-log`): System activity tracking
- **System Settings** (`/admin/settings`): 4-tab configuration
  - General: System name, timezone, date format
  - Security: Session timeout, MFA, password policy
  - Notifications: Email settings, alert triggers
  - Data Retention: Archive policies

---

## Build & Deployment

### Development Build
```bash
ng build
```
Output: `dist/leap-angular/`

### Production Build
```bash
ng build --configuration production
```

Optimizations applied:
- Ahead-of-Time (AOT) compilation
- Tree-shaking and dead code elimination
- Minification
- Lazy-loaded modules for optimal performance

### Production Deployment Options

#### Option 1: Static Web Server (Nginx)
```nginx
server {
    listen 80;
    server_name leap.tdbank.com;
    root /var/www/leap-angular;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Option 2: Docker Container
```dockerfile
FROM nginx:alpine
COPY dist/leap-angular /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Option 3: Azure Static Web Apps / AWS S3
Upload `dist/leap-angular/` contents to cloud hosting with SPA routing enabled.

---

## Configuration

### Environment Variables
Edit `src/environments/environment.ts` (development) and `environment.prod.ts` (production):

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://api.tdbank.com/leap',  // Backend API endpoint
  appVersion: '1.0.0'
};
```

### TD Branding
- Logo: `src/assets/td-logo.png` (replace with official logo)
- Primary color: `#00843D` (TD Green)
- Configured in: `src/styles.scss` and theme files

---

## Security Considerations

### Authentication
- Current implementation uses **mock authentication** for demo purposes
- **Replace with real authentication** before production:
  - Integrate with Active Directory / LDAP
  - Implement OAuth 2.0 / OIDC
  - Use JWT tokens with proper expiration
  - Enable MFA (Multi-Factor Authentication)

### Authorization
- Role-based access control (RBAC) implemented
- Roles: Maker, Checker, Admin, Finance
- Guards: `AuthGuard`, `RoleGuard`

### Production Security Checklist
- [ ] Replace mock authentication with real auth provider
- [ ] Enable HTTPS/TLS encryption
- [ ] Implement CORS policies
- [ ] Add rate limiting
- [ ] Enable audit logging
- [ ] Configure Content Security Policy (CSP)
- [ ] Remove console.log statements
- [ ] Secure API endpoints

---

## Testing

### Run Unit Tests
```bash
ng test
```

### Run End-to-End Tests
```bash
ng e2e
```

### Code Coverage
```bash
ng test --code-coverage
```

---

## Troubleshooting

### Issue: Blank page on load
**Solution**: Check browser console for errors. Ensure all routes are properly configured and authentication is working.

### Issue: AG Grid not displaying
**Solution**: Verify AG Grid CSS imports in `src/styles.scss`:
```scss
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-material.css';
```

### Issue: Login not working
**Solution**: Check that credentials match demo accounts and NgRx store is properly initialized.

### Issue: Module not found errors
**Solution**: Run `npm install` to ensure all dependencies are installed.

### Issue: Port 4200 already in use
**Solution**:
```bash
ng serve --port 4201
```

---

## Performance Optimization

### Lazy Loading
All feature modules are lazy-loaded for optimal initial load time:
- Dashboard: 15.3 kB
- Product Analysis: 24.0 kB
- Regulatory Views: 52.0 kB
- Reports: 78.0 kB
- Templates: 71.9 kB
- Admin: 72.4 kB

### Bundle Size
- Initial bundle: ~369 kB
- Lazy chunks: Loaded on-demand per route

### Optimization Tips
1. Enable production mode (`ng build --prod`)
2. Use CDN for static assets
3. Enable gzip compression on server
4. Implement service worker for caching
5. Use OnPush change detection strategy

---

## Maintenance & Updates

### Update Angular
```bash
ng update @angular/core @angular/cli
```

### Update Dependencies
```bash
npm update
```

### Update Material Design
```bash
ng update @angular/material
```

---

## Support & Contact

### Technical Documentation
- Angular: https://angular.io/docs
- Angular Material: https://material.angular.io
- AG Grid: https://www.ag-grid.com/angular-data-grid
- NgRx: https://ngrx.io/docs

### Project Information
- **Version**: 1.0.0
- **Build Date**: January 2025
- **Framework**: Angular 17.3.8
- **License**: Proprietary (TD Bank)

---

## Change Log

### Version 1.0.0 (January 2025)
- ✅ Initial release
- ✅ Complete authentication system with 4 roles
- ✅ All 11 functional pages implemented
- ✅ Reports module with 4 regulatory reports
- ✅ Templates module with 3 configuration pages
- ✅ Admin module with User Management and System Settings
- ✅ NgRx state management
- ✅ AG Grid integration with $500M-$50B scale data
- ✅ TD branding integration
- ✅ Responsive design
- ✅ Export functionality (Excel/PDF stubs)
- ✅ Commentary and audit trail features

---

## Next Steps for Production

1. **Backend Integration**
   - Connect to real APIs (currently using mock data)
   - Implement data persistence
   - Add WebSocket for real-time updates

2. **Security Hardening**
   - Replace mock auth with production auth system
   - Add API token management
   - Implement encryption for sensitive data

3. **Testing**
   - Write unit tests for all components
   - Add E2E tests for critical workflows
   - Perform security audit

4. **Monitoring**
   - Add application monitoring (e.g., Dynatrace, New Relic)
   - Implement error tracking (e.g., Sentry)
   - Set up performance monitoring

5. **Documentation**
   - Create user manuals
   - Document API interfaces
   - Write operational runbooks

---

**Thank you for using LEAP!** 🚀

For questions or support, contact the development team.
