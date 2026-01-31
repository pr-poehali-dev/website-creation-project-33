
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useSessionValidator } from '@/hooks/useSessionValidator';
import AuthPage from '@/components/auth/AuthPage';
import AdminPanel from '@/components/admin/AdminPanel';
import UserDashboard from "./pages/UserDashboard";
import TestCodecs from "./pages/TestCodecs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();
  
  // Автоматическая проверка сессии при кликах
  useSessionValidator();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-4 border-slate-200 overflow-hidden flex items-center justify-center p-3 shadow-2xl animate-pulse">
            <img 
              src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
              alt="IMPERIA PROMO"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3 text-slate-900">
            <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-base md:text-lg font-medium">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.is_admin) {
    return <AdminPanel />;
  }

  return <UserDashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/test-codecs" element={<TestCodecs />} />
          <Route path="*" element={
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;