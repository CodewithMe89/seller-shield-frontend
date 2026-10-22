import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from './components/DashboardLayout';
import Products from "./pages/Products"
import Orders from "./pages/Orders"
import Returns from "./pages/Returns"
import Expenses from './pages/Expenses'
import Inventory from './pages/Inventory'
import Insights from './pages/Insights'

function App() {
  return (
    <BrowserRouter>
      < AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />}/>
              <Route path="/returns" element={<Returns />}/>
              <Route path="/expenses" element={<Expenses />}/>
              <Route path="/inventory" element={<Inventory />}/>
              <Route path="/insights" element={<Insights />}/>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>

    </BrowserRouter>
  )
}

export default App;