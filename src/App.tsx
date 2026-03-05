import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VisitFormPage from "./pages/VisitFormPage";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [appView, setAppView] = useState<"form" | "profile">("form");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-primary-foreground font-heading text-lg animate-pulse">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    if (authView === "signup") {
      return <SignupPage onGoToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onGoToSignup={() => setAuthView("signup")} />;
  }

  if (appView === "profile") {
    return <ProfilePage onBack={() => setAppView("form")} />;
  }

  return <VisitFormPage onGoToProfile={() => setAppView("profile")} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
