import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Send, 
  History, 
  QrCode, 
  Bluetooth, 
  Users, 
  Store,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { User, Transaction } from '@shared/schema';

export default function Home() {
  const { user, setUser, connectionStatus, isEmergencyMode } = useApp();
  
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !user,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', userData?.id],
    enabled: !!userData?.id,
  });

  useEffect(() => {
    if (userData && !user) {
      setUser(userData);
    }
  }, [userData, user, setUser]);

  const recentTransactions = transactions.slice(0, 3);
  const currentBalance = user?.balance ? parseFloat(user.balance) : 0;
  const emergencyBalance = user?.emergencyBalance ? parseFloat(user.emergencyBalance) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">EmergencyPay</h1>
          <div className="flex items-center justify-center gap-2">
            {connectionStatus.isOnline ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {isEmergencyMode && (
              <Badge variant="destructive" className="emergency-pulse">
                Emergency Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Main Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">₹{currentBalance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Emergency Fund</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold">₹{emergencyBalance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/transfer">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Send className="w-6 h-6" />
                  <span>Send Money</span>
                </Button>
              </Link>

              <Link href="/qr-scan">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <QrCode className="w-6 h-6" />
                  <span>QR Pay</span>
                </Button>
              </Link>

              <Link href="/bluetooth">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Bluetooth className="w-6 h-6" />
                  <span>Bluetooth Pay</span>
                </Button>
              </Link>

              <Link href="/merchants">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Store className="w-6 h-6" />
                  <span>Merchants</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.description || 'Payment'}</p>
                      <p className="text-sm text-gray-600">{transaction.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{parseFloat(transaction.amount).toFixed(2)}</p>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 
                                transaction.status === 'pending' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No recent transactions</p>
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="max-w-md mx-auto flex justify-around">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex-col gap-1">
                <Wallet className="w-4 h-4" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            
            <Link href="/history">
              <Button variant="ghost" size="sm" className="flex-col gap-1">
                <History className="w-4 h-4" />
                <span className="text-xs">History</span>
              </Button>
            </Link>
            
            <Link href="/nearby">
              <Button variant="ghost" size="sm" className="flex-col gap-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Nearby</span>
              </Button>
            </Link>
            
            <Link href="/insights">
              <Button variant="ghost" size="sm" className="flex-col gap-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Insights</span>
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}