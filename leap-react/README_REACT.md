# LEAP React - Liquidity Explain & Analytics Platform

This is the React version of the LEAP application, converted from Angular 17 to React 18.

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **UI Library**: Ant Design
- **Routing**: React Router v6
- **Tables**: AG Grid React
- **Charts**: ECharts (echarts-for-react)
- **Styling**: SCSS with TD Green Theme (#00843D)

## Project Structure

```
src/
├── components/          # Shared components
│   ├── layout/         # Layout components (MainLayout, Header, Sidebar, NavigationTree)
│   ├── shared/         # Shared components (QueryPanel, StatusBadge, CommentaryDrawer)
│   └── auth/           # Auth components (ProtectedRoute, RoleRoute)
├── features/           # Feature modules
│   ├── dashboard/
│   ├── product-analysis/
│   ├── regulatory-views/
│   ├── reports/
│   ├── templates/
│   ├── maker-workspace/
│   ├── checker-workspace/
│   ├── admin/
│   └── auth/
├── store/              # Redux store
│   ├── slices/         # Redux slices (authSlice, productSlice, workflowSlice)
│   ├── hooks.ts        # Typed hooks
│   └── index.ts        # Store configuration
├── services/           # Service layer
│   ├── authService.ts
│   ├── mockDataService.ts
│   └── exportService.ts
├── router/             # Route configuration
├── styles/             # Global styles and theme
├── config/             # Configuration files
└── App.tsx            # Root component
```

## Getting Started

### Prerequisites

- Node.js >= 18.13.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:4201`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

### Completed

- ✅ Project initialization with Vite + React 18
- ✅ Redux Toolkit store configuration
- ✅ React Router v6 with lazy loading and route guards
- ✅ Ant Design TD Green theme configuration
- ✅ Layout components (MainLayout, Header, Sidebar, NavigationTree)
- ✅ Core services (authService, mockDataService, exportService)
- ✅ Shared components (QueryPanel, StatusBadge, CommentaryDrawer)
- ✅ Dashboard module with ECharts integration
- ✅ Auth module (Login) with route guards
- ✅ Basic structure for all feature modules

### In Progress / TODO

- 🔄 Complete implementation of Product Analysis modules
- 🔄 Complete implementation of Regulatory Views modules
- 🔄 Complete implementation of Reports modules
- 🔄 Complete implementation of Templates modules
- 🔄 Complete implementation of Workspace modules
- 🔄 Complete implementation of Admin modules
- 🔄 Full integration with AG Grid for data tables
- 🔄 Complete ECharts integration for all charts
- 🔄 Testing and verification

## Mock Users

The application includes mock authentication with the following users:

- **Maker**: `maker1` / `password`
- **Checker**: `checker1` / `password`
- **Admin**: `admin` / `admin`
- **Finance**: `finance1` / `password`

## Key Differences from Angular Version

1. **State Management**: NgRx → Redux Toolkit
2. **UI Components**: Angular Material → Ant Design
3. **Routing**: Angular Router → React Router v6
4. **Services**: RxJS Observables → Promises/async-await
5. **Forms**: Angular Reactive Forms → Ant Design Form
6. **Styling**: Angular Material Theme → Ant Design Theme + SCSS

## Notes

- The application uses mock data services for development
- All routes are protected by authentication guards
- Role-based access control is implemented for admin and workspace routes
- TD Green theme (#00843D) is applied throughout the application

## License

Proprietary - TD Bank Internal Use Only
