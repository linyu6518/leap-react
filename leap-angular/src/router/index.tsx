import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import ProtectedRoute from '@components/auth/ProtectedRoute'
import RoleRoute from '@components/auth/RoleRoute'
import MainLayout from '@components/layout/MainLayout'
import UnderDevelopment from '@components/shared/UnderDevelopment'

// Lazy load components
const Login = lazy(() => import('@features/auth/Login'))
const Dashboard = lazy(() => import('@features/dashboard/Dashboard'))

// Product Analysis - Only Deposits is active
const Products = lazy(() => import('@features/product-analysis/Products'))
const Deposits = lazy(() => import('@features/product-analysis/Deposits'))
// Other product pages are under development
const BuyBack = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const LoanCommitments = lazy(() => Promise.resolve({ default: UnderDevelopment }))

// Regulatory Views - Only LCR is active
const LCRView = lazy(() => import('@features/regulatory-views/LCRView'))
const LCRDetail = lazy(() => import('@features/regulatory-views/LCRDetail'))
// Other regulatory views are under development
const NSFRView = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const NCCFView = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const ILSTView = lazy(() => Promise.resolve({ default: UnderDevelopment }))

// Reports - All under development
const FR2052a = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const STWF = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const AppendixVI = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const OSFILCR = lazy(() => Promise.resolve({ default: UnderDevelopment }))

// Templates - All under development
const DataImport = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const ProductMapping = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const ThresholdSettings = lazy(() => Promise.resolve({ default: UnderDevelopment }))

// Workspace - All under development
const MakerReview = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const CheckerApprove = lazy(() => Promise.resolve({ default: UnderDevelopment }))

// Admin - All under development
const UserManagement = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const SystemSettings = lazy(() => Promise.resolve({ default: UnderDevelopment }))
const AuditLog = lazy(() => Promise.resolve({ default: UnderDevelopment }))

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
)

function AppRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Product Analysis */}
          <Route path="product">
            <Route index element={<Products />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="buyback" element={<BuyBack />} />
            <Route path="loan-commitments" element={<LoanCommitments />} />
            <Route path="commitments" element={<UnderDevelopment />} />
            <Route path="loans" element={<UnderDevelopment />} />
            <Route path="derivatives" element={<UnderDevelopment />} />
            <Route path="unsecured" element={<UnderDevelopment />} />
            <Route path="interaffiliate-funding" element={<UnderDevelopment />} />
            <Route path="secured-funding" element={<UnderDevelopment />} />
            <Route path="other-risks" element={<UnderDevelopment />} />
            <Route path="prime-services" element={<UnderDevelopment />} />
            <Route path="hqla" element={<UnderDevelopment />} />
          </Route>

          {/* Regulatory Views */}
          <Route path="regulatory">
            <Route index element={<Navigate to="lcr" replace />} />
            <Route path="lcr" element={<LCRView />} />
            <Route path="lcr/detail" element={<LCRDetail />} />
            <Route path="nsfr" element={<NSFRView />} />
            <Route path="nccf" element={<NCCFView />} />
            <Route path="ilst" element={<ILSTView />} />
          </Route>

          {/* Reports */}
          <Route path="reports">
            <Route index element={<Navigate to="fr2052a" replace />} />
            <Route path="fr2052a" element={<FR2052a />} />
            <Route path="stwf" element={<STWF />} />
            <Route path="appendix-vi" element={<AppendixVI />} />
            <Route path="osfi-lcr" element={<OSFILCR />} />
          </Route>

          {/* Templates */}
          <Route path="templates">
            <Route index element={<Navigate to="import" replace />} />
            <Route path="import" element={<DataImport />} />
            <Route path="mapping" element={<ProductMapping />} />
            <Route path="thresholds" element={<ThresholdSettings />} />
          </Route>

          {/* Workspace */}
          <Route path="maker">
            <Route path="review" element={<RoleRoute allowedRoles={['maker']}><MakerReview /></RoleRoute>} />
          </Route>
          <Route path="checker">
            <Route path="approve" element={<RoleRoute allowedRoles={['checker']}><CheckerApprove /></RoleRoute>} />
          </Route>

          {/* Admin */}
          <Route path="admin">
            <Route path="users" element={<RoleRoute allowedRoles={['admin']}><UserManagement /></RoleRoute>} />
            <Route path="settings" element={<RoleRoute allowedRoles={['admin']}><SystemSettings /></RoleRoute>} />
            <Route path="audit-log" element={<RoleRoute allowedRoles={['admin']}><AuditLog /></RoleRoute>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AppRouter
