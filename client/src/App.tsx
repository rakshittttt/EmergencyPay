import { Switch, Route, useLocation, Redirect } from "wouter";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import QRScan from "@/pages/QRScan";
import BluetoothPayment from "@/pages/BluetoothPayment";
import PaymentAmount from "@/pages/PaymentAmount";
import PaymentSuccess from "@/pages/PaymentSuccess";
import TransactionHistory from "@/pages/TransactionHistory";
import Merchants from "@/pages/Merchants";
import Profile from "@/pages/Profile";
import AddFunds from "@/pages/AddFunds";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/BottomNavigation";
import { useEffect, useState } from "react";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { initializeSocket } from "@/lib/socket";
import { Toaster } from "@/components/ui/toaster";

// This is just the app component itself
// The AppProvider is now in main.tsx

// This component handles the protected routes
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.FC, path: string }) => {
  const { currentUser, isLoading } = useAppContext();
  
  // If still loading, show a spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Redirect to="/login" />;
  }
  
  // Otherwise, render the component
  return <Component />;
};

function App() {
  const [location] = useLocation();
  const [currentRoute, setCurrentRoute] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // Simplified for now
  
  // Initialize user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/user');
        if (res.status === 401) {
          setUser(null);
        } else if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  useEffect(() => {
    setCurrentRoute(location);
  }, [location]);
  
  // Initialize real-time updates with Socket.IO
  useEffect(() => {
    initializeSocket();
  }, []);
  
  // Check if we're in a payment flow to determine whether to show bottom nav
  const isPaymentFlow = 
    location.includes("/qr-scan") || 
    location.includes("/bluetooth-payment") || 
    location.includes("/payment-amount") || 
    location.includes("/payment-success") ||
    location.includes("/add-funds");
  
  // If loading authentication state, show a loading spinner
  if (isLoading && location !== '/login') {
    return (
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col bg-gray-50 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  // Public route handling
  if (location === '/login') {
    return <Login />;
  }
  
  // Authentication check
  if (!user && location !== '/login') {
    return <Redirect to="/login" />;
  }
  
  return (
    <div className="relative max-w-md mx-auto min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col overflow-auto">
        <AnimatePresence mode="wait">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/qr-scan" component={QRScan} />
            <Route path="/bluetooth-payment" component={BluetoothPayment} />
            <Route path="/payment-amount/:id">
              {(params) => <PaymentAmount id={params.id} />}
            </Route>
            <Route path="/payment-success/:id">
              {(params) => <PaymentSuccess id={params.id} />}
            </Route>
            <Route path="/transactions" component={TransactionHistory} />
            <Route path="/merchants" component={Merchants} />
            <Route path="/profile" component={Profile} />
            <Route path="/add-funds" component={AddFunds} />
            <Route component={NotFound} />
          </Switch>
        </AnimatePresence>
      </div>
      
      {!isPaymentFlow && <BottomNavigation />}
      <Toaster />
    </div>
  );
}

export default App;
