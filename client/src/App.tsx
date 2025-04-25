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
import FinancialInsights from "@/pages/FinancialInsights";
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
  const [location, navigate] = useLocation();
  const [currentRoute, setCurrentRoute] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // Simplified for now
  
  // Initialize user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching user data...');
        const res = await fetch('/api/user');
        
        if (res.status === 401) {
          console.log('User not authenticated, redirecting to login');
          setUser(null);
          if (location !== '/login') {
            navigate('/login');
          }
        } else if (res.ok) {
          const userData = await res.json();
          console.log('User authenticated:', userData);
          setUser(userData);
          
          // If we're on the login page but already authenticated, redirect to home
          if (location === '/login') {
            console.log('Already logged in, redirecting to home');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  // Update current route and handle authentication status on navigation
  useEffect(() => {
    setCurrentRoute(location);
    
    // Only attempt to refetch user if not on login page
    // and user state is currently null (prevents unnecessary fetches)
    if (location !== '/login' && !isLoading && !user) {
      const checkAuth = async () => {
        try {
          const res = await fetch('/api/user');
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else if (res.status === 401 && location !== '/login') {
            navigate('/login');
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      };
      
      checkAuth();
    }
  }, [location, user, isLoading]);
  
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
            <Route path="/">
              <Home />
            </Route>
            <Route path="/qr-scan">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4">QR Scanner</h2>
                  <p>QR scanning will be available in the next update.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </Route>
            <Route path="/bluetooth-payment">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4">Bluetooth Payment</h2>
                  <p>Bluetooth payments will be available in the next update.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </Route>
            <Route path="/payment-amount/:id">
              {(params) => <PaymentAmount id={params.id} />}
            </Route>
            <Route path="/payment-success/:id">
              {(params) => <PaymentSuccess id={params.id} />}
            </Route>
            <Route path="/transactions">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                  <p>Full transaction history will be available in the next update.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </Route>
            <Route path="/merchants">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4">Merchants</h2>
                  <p>Merchants directory will be available in the next update.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </Route>
            <Route path="/profile">
              <Profile />
            </Route>
            <Route path="/add-funds">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4">Add Funds</h2>
                  <p>Adding funds will be available in the next update.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </Route>
            <Route path="/financial-insights">
              <FinancialInsights />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </AnimatePresence>
      </div>
      
      {!isPaymentFlow && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200">
          <div className="grid grid-cols-5 py-2">
            <button 
              onClick={() => navigate('/')}
              className="flex flex-col items-center justify-center text-primary"
            >
              <i className="ri-home-4-line text-xl mb-1"></i>
              <span className="text-xs">Home</span>
            </button>
            <button 
              onClick={() => navigate('/qr-scan')}
              className="flex flex-col items-center justify-center text-gray-500"
            >
              <i className="ri-qr-scan-line text-xl mb-1"></i>
              <span className="text-xs">Scan</span>
            </button>
            <button 
              onClick={() => navigate('/bluetooth-payment')}
              className="flex flex-col items-center justify-center text-gray-500"
            >
              <i className="ri-bluetooth-line text-xl mb-1"></i>
              <span className="text-xs">Pay</span>
            </button>
            <button 
              onClick={() => navigate('/transactions')}
              className="flex flex-col items-center justify-center text-gray-500"
            >
              <i className="ri-history-line text-xl mb-1"></i>
              <span className="text-xs">History</span>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center justify-center text-gray-500"
            >
              <i className="ri-user-3-line text-xl mb-1"></i>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}

export default App;
