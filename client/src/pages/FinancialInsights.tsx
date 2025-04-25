import React, { useState } from 'react';
import { ChevronLeft, PieChart, TrendingUp, Info, BarChart2, Zap, Lightbulb } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNavigation from '@/components/BottomNavigation';
import SimpleStatusBar from '@/components/SimpleStatusBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialInsightsProps {}

const FinancialInsights: React.FC<FinancialInsightsProps> = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  
  // Get the current user
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      return response.json();
    }
  });
  
  // Fetch financial insights
  const { data: insightsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/financial-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const response = await apiRequest('GET', `/api/financial-insights/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial insights');
      }
      const data = await response.json();
      return data.insights;
    },
    enabled: !!user?.id,
  });
  
  const generateInsights = async () => {
    setLoading(true);
    try {
      await refetch();
      toast({
        title: "Insights Generated",
        description: "Your financial insights have been updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to Generate Insights",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 overflow-auto pb-20">
      <SimpleStatusBar connectionStatus="online" />
      
      <div className="px-4 py-4 max-w-5xl mx-auto">
        <div className="flex items-center mb-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/')}
            className="mr-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Financial Insights</h1>
        </div>
        
        {/* Emergency Readiness Score */}
        <Card className="p-4 mb-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Emergency Readiness Score</h2>
            <Zap className="h-6 w-6" />
          </div>
          
          {isLoading ? (
            <Skeleton className="h-6 w-full bg-blue-300 mb-2" />
          ) : (
            <>
              <div className="flex justify-between items-center text-sm mb-1">
                <span>0</span>
                <span>100</span>
              </div>
              <Progress 
                value={insightsData?.emergencyReadiness || 0} 
                className="h-3 bg-blue-300"
              />
              <div className="mt-3 text-center">
                <span className="text-2xl font-bold">{insightsData?.emergencyReadiness || 0}</span>
                <span className="text-lg">/100</span>
              </div>
            </>
          )}
        </Card>
        
        {/* Generate Insights Button */}
        <Button 
          className="w-full py-6 text-lg mb-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all"
          onClick={generateInsights}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="mr-2">Generating Insights</span>
              <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-white rounded-full"></div>
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-5 w-5" />
              Generate New Insights
            </>
          )}
        </Button>
        
        {/* Insights Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="spending">Spending</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Tips</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                Transaction Summary
              </h3>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-lg font-semibold">₹{insightsData?.summary.totalSpent.toLocaleString('en-IN') || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Received</p>
                    <p className="text-lg font-semibold">₹{insightsData?.summary.totalReceived.toLocaleString('en-IN') || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Cashflow</p>
                    <p className={`text-lg font-semibold ${insightsData?.summary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{insightsData?.summary.netCashflow.toLocaleString('en-IN') || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emergency Transactions</p>
                    <p className="text-lg font-semibold">{insightsData?.summary.offlineTransactionCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Transaction</p>
                    <p className="text-lg font-semibold">₹{Math.round(insightsData?.summary.averageTransactionAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Transactions</p>
                    <p className="text-lg font-semibold">{insightsData?.summary.pendingTransactions || 0}</p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Spending Tab */}
          <TabsContent value="spending" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <PieChart className="mr-2 h-5 w-5 text-blue-500" />
                Spending by Category
              </h3>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                </>
              ) : (
                <div className="space-y-3">
                  {insightsData?.categoryBreakdowns.map((category: { category: string; amount: number; percentage: number; count: number }, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="capitalize">{category.category}</span>
                        <span className="text-sm font-semibold">₹{category.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{category.percentage.toFixed(1)}%</span>
                        <span>{category.count} transactions</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-blue-500" />
                Top Merchants
              </h3>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                </>
              ) : (
                <div className="space-y-4">
                  {insightsData?.topMerchants.map((merchant: { merchantId: number; merchantName: string; totalSpent: number; transactionCount: number; frequency: string; averageAmount: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{merchant.merchantName}</p>
                        <p className="text-sm text-gray-500">{merchant.frequency} • {merchant.transactionCount} transactions</p>
                      </div>
                      <p className="font-semibold">₹{merchant.totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                Key Insights
              </h3>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                </>
              ) : (
                <ul className="space-y-3">
                  {insightsData?.insights.map((insight: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p>{insight}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                Smart Recommendations
              </h3>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                </>
              ) : (
                <ul className="space-y-3">
                  {insightsData?.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-yellow-600 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p>{recommendation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default FinancialInsights;