import { BrowserRouter as Router, Routes, Route } from "react-router";
import Layout from "@/react-app/components/Layout";
import Dashboard from "@/react-app/pages/Dashboard";
import Billing from "@/react-app/pages/Billing";
import Products from "@/react-app/pages/Products";
import Stock from "@/react-app/pages/Stock";
import Customers from "@/react-app/pages/Customers";
import CustomerBillList from "@/react-app/pages/CustomerBillList";
import InvoiceView from "@/react-app/pages/InvoiceView";
import Reports from "@/react-app/pages/Reports";
import Login from "@/react-app/pages/Login";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/stock" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Stock />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />
          <Route path="/customers/:customerId/bills" element={
            <ProtectedRoute>
              <CustomerBillList />
            </ProtectedRoute>
          } />
          <Route path="/customers/:customerId/bill/:billId" element={
            <ProtectedRoute>
              <InvoiceView />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}
