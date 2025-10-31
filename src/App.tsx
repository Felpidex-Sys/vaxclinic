import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { Funcionarios } from "@/pages/Funcionarios";
import { Clientes } from "@/pages/Clientes";
import { Vacinas } from "@/pages/Vacinas";
import { Agendamentos } from "@/pages/Agendamentos";
import { Relatorios } from "@/pages/Relatorios";
import { InitialSetup } from "@/pages/InitialSetup";
import { Login } from "@/pages/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/setup" element={<InitialSetup />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/funcionarios" element={
              <ProtectedRoute>
                <Layout>
                  <Funcionarios />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/vacinas" element={
              <ProtectedRoute>
                <Layout>
                  <Vacinas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/agendamentos" element={
              <ProtectedRoute>
                <Layout>
                  <Agendamentos />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Layout>
                  <Relatorios />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
