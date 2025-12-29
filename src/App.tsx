import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import { usePushNotifications } from "./hooks/usePushNotifications";
import PWAUpdater from "./components/PWAUpdater";

const App = () => {
  usePushNotifications();
  return (
    <>
      <PWAUpdater />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
