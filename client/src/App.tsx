import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import QRScan from "@/pages/QRScan";
import BluetoothPayment from "@/pages/BluetoothPayment";
import PaymentAmount from "@/pages/PaymentAmount";
import PaymentSuccess from "@/pages/PaymentSuccess";
import TransactionHistory from "@/pages/TransactionHistory";
import Merchants from "@/pages/Merchants";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/BottomNavigation";
import { useEffect, useState } from "react";
import { AppProvider } from "@/context/AppContext";

function App() {
  const [location] = useLocation();
  const [currentRoute, setCurrentRoute] = useState('/');
  
  useEffect(() => {
    setCurrentRoute(location);
  }, [location]);
  
  // Check if we're in a payment flow to determine whether to show bottom nav
  const isPaymentFlow = 
    location.includes("/qr-scan") || 
    location.includes("/bluetooth-payment") || 
    location.includes("/payment-amount") || 
    location.includes("/payment-success");
  
  return (
    <AppProvider>
      <div className="relative max-w-md mx-auto h-screen flex flex-col overflow-hidden bg-gray-50">
        <AnimatePresence mode="wait">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/qr-scan" component={QRScan} />
            <Route path="/bluetooth-payment" component={BluetoothPayment} />
            <Route path="/payment-amount/:id" component={PaymentAmount} />
            <Route path="/payment-success/:id" component={PaymentSuccess} />
            <Route path="/transactions" component={TransactionHistory} />
            <Route path="/merchants" component={Merchants} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </AnimatePresence>
        
        {!isPaymentFlow && <BottomNavigation />}
      </div>
    </AppProvider>
  );
}

export default App;
