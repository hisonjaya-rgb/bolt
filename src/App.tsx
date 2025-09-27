import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { NavigationTracker } from "@/components/NavigationTracker";

// Pages
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Vendors from "./pages/Vendors";
import VendorDetails from "./pages/VendorDetails";
import Articles from "./pages/Articles";
import ArticleDetails from "./pages/ArticleDetails";
import Variations from "./pages/Variations";
import Theme from "./pages/Theme";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import AddDailyReport from "./pages/AddDailyReport";
import DailyReports from "./pages/DailyReports";
import DailyReportDetails from "./pages/DailyReportDetails";
import Shipping from "./pages/Shipping";
import AddShipping from "./pages/AddShipping";
import ShippingDetails from "./pages/ShippingDetails";
import AIAssistant from "./pages/AIAssistant";
import Collections from "./pages/Collections";
import CollectionDetails from "./pages/CollectionDetails";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout>{children}</Layout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavigationTracker />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/vendors" element={
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            } />
            <Route path="/vendors/:vendorId" element={
              <ProtectedRoute>
                <VendorDetails />
              </ProtectedRoute>
            } />
            <Route path="/articles" element={
              <ProtectedRoute>
                <Articles />
              </ProtectedRoute>
            } />
            <Route path="/articles/:id" element={
              <ProtectedRoute>
                <ArticleDetails />
              </ProtectedRoute>
            } />
            <Route path="/daily-reports" element={
              <ProtectedRoute>
                <DailyReports />
              </ProtectedRoute>
            } />
            <Route path="/add-daily-report" element={
              <ProtectedRoute>
                <AddDailyReport />
              </ProtectedRoute>
            } />
            <Route path="/daily-reports/:id" element={
              <ProtectedRoute>
                <DailyReportDetails />
              </ProtectedRoute>
            } />
            <Route path="/shipping" element={
              <ProtectedRoute>
                <Shipping />
              </ProtectedRoute>
            } />
            <Route path="/add-shipping" element={
              <ProtectedRoute>
                <AddShipping />
              </ProtectedRoute>
            } />
            <Route path="/shipping/:id" element={
              <ProtectedRoute>
                <ShippingDetails />
              </ProtectedRoute>
            } />
            <Route path="/ai-assistant" element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            } />
            <Route path="/collections" element={
              <ProtectedRoute>
                <Collections />
              </ProtectedRoute>
            } />
            <Route path="/collections/:collectionId" element={
              <ProtectedRoute>
                <CollectionDetails />
              </ProtectedRoute>
            } />
            <Route path="/theme" element={
              <ProtectedRoute>
                <Theme />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
