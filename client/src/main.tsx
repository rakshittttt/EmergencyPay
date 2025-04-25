import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";
import { AppProvider } from "@/context/AppContext";

// Create a simple app with essential providers
const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Render the app
createRoot(document.getElementById("root")!).render(<Root />);
