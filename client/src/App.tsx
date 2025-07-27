import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import DirectTransfer from './pages/DirectTransfer';
import PaymentAmount from './pages/PaymentAmount';
import PaymentSuccess from './pages/PaymentSuccess';
import TransactionHistory from './pages/TransactionHistory';
import Profile from './pages/Profile';
import QRScan from './pages/QRScan';
import BluetoothPayment from './pages/BluetoothPayment';
import NearbyUsers from './pages/NearbyUsers';
import Merchants from './pages/Merchants';
import Insights from './pages/Insights';
import NotFound from './pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/transfer" component={DirectTransfer} />
      <Route path="/amount" component={PaymentAmount} />
      <Route path="/success" component={PaymentSuccess} />
      <Route path="/history" component={TransactionHistory} />
      <Route path="/profile" component={Profile} />
      <Route path="/qr-scan" component={QRScan} />
      <Route path="/bluetooth" component={BluetoothPayment} />
      <Route path="/nearby" component={NearbyUsers} />
      <Route path="/merchants" component={Merchants} />
      <Route path="/insights" component={Insights} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;