import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { usePushNotifications } from "./hooks/usePushNotifications";
import PWAUpdater from "./components/PWAUpdater";

const queryClient = new QueryClient();

const App = () => {
  usePushNotifications();
  return (
    <QueryClientProvider client={queryClient}>
      <PWAUpdater />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </QueryClientProvider>
  );
};

export default App;
