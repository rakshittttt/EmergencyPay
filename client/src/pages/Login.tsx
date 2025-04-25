import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { useLocation } from 'wouter';

const Login: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [phone, setPhone] = useState('9876543210'); // Default for demo
  const [, navigate] = useLocation();

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      
      // Set the auth cookie by login via API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      setIsLoggingIn(false);
      if (error instanceof Error) {
        window.alert(`Login failed: ${error.message}`);
      } else {
        window.alert('Login failed. Please try again.');
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-primary text-white py-12 px-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold mb-2 text-center">EmergencyPay</h1>
        <p className="text-center text-white/80">Offline payments made simple</p>
      </div>
      
      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome Back</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your phone number"
            />
            <p className="text-xs text-gray-500 mt-1">For demo, use the default number</p>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn || !phone}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium transition-colors hover:bg-primary/90 disabled:bg-gray-300 flex items-center justify-center"
          >
            {isLoggingIn ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Emergency Mode</h3>
          <p className="text-gray-600 mb-4">
            EmergencyPay lets you make payments even when regular UPI services are down.
            Set aside funds that will be available during network outages.
          </p>
          
          <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
            <i className="ri-information-line text-amber-500 mr-3 text-xl"></i>
            <p className="text-sm text-amber-700">
              No real money is used in this demo
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;