
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthScreen from "./pages/AuthScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface User {
  id: number;
  username: string;
  display_name: string;
}

const ME_URL = 'https://functions.poehali.dev/46aec92f-f8af-4c54-813c-d0d3c4c68b01';

function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ct_token');
    if (!token) { setChecking(false); return; }

    fetch(ME_URL, { headers: { 'X-Auth-Token': token } })
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed.user) setUser(parsed.user);
        else localStorage.removeItem('ct_token');
      })
      .catch(() => localStorage.removeItem('ct_token'))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center animate-pulse">
            <span className="text-neon-green text-xl">⚡</span>
          </div>
          <span className="text-xs font-mono text-gray-600">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={(token, u) => { setUser(u); }} />;
  }

  return <Index user={user} onLogout={() => { localStorage.removeItem('ct_token'); localStorage.removeItem('ct_user'); setUser(null); }} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;