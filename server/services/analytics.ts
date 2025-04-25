import { Transaction, User, Merchant } from '../../shared/schema';

export interface TransactionSummary {
  totalSpent: number;
  totalReceived: number;
  netCashflow: number;
  offlineTransactionCount: number;
  offlineTransactionAmount: number;
  transactionsPerDay: number;
  averageTransactionAmount: number;
  largestTransaction: number;
  emergencyFundUsage: number;
  pendingTransactions: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MerchantAnalysis {
  merchantId: number;
  merchantName: string;
  totalSpent: number;
  transactionCount: number;
  frequency: string; // "daily", "weekly", "monthly", "occasional"
  averageAmount: number;
}

// Interface for AI-generated financial summaries
export interface AISummary {
  overview: string;
  strengths: string[];
  improvement_areas: string[];
  action_plan: string[];
  emergency_preparedness: string;
}

export interface FinancialInsights {
  summary: TransactionSummary;
  categoryBreakdowns: CategoryBreakdown[];
  topMerchants: MerchantAnalysis[];
  insights: string[];
  recommendations: string[];
  emergencyReadiness: number; // score from 0-100
  aiSummary: AISummary | null; // AI-generated summary
  lastUpdated: Date;
}

/**
 * Generate insights based on user's transactions and financial data
 */
export async function generateFinancialInsights(
  userId: number, 
  user: User, 
  transactions: Transaction[],
  merchants: Merchant[]
): Promise<FinancialInsights> {
  const timeframe = 30; // analyze last 30 days by default
  const now = new Date();
  const timeframeCutoff = new Date(now.getTime() - (timeframe * 24 * 60 * 60 * 1000));
  
  // Filter recent transactions
  const recentTransactions = transactions.filter(tx => 
    tx.timestamp && new Date(tx.timestamp) >= timeframeCutoff
  );

  // Calculate summary
  const summary = calculateTransactionSummary(userId, recentTransactions);
  
  // Calculate category breakdown
  const categoryBreakdowns = calculateCategoryBreakdowns(userId, recentTransactions, merchants);
  
  // Analyze merchant spending
  const merchantAnalysis = analyzeMerchantSpending(userId, recentTransactions, merchants);
  
  // Generate insights based on data
  const insights = generateDataInsights(userId, user, summary, categoryBreakdowns, merchantAnalysis);
  
  // Generate recommendations
  const recommendations = generateRecommendations(userId, user, summary, categoryBreakdowns, merchantAnalysis);
  
  // Calculate emergency readiness score
  const emergencyReadiness = calculateEmergencyReadiness(user, summary);
  
  // Generate AI summary
  const aiSummary = generateAISummary(user, summary, categoryBreakdowns, merchantAnalysis, emergencyReadiness);
  
  return {
    summary,
    categoryBreakdowns,
    topMerchants: merchantAnalysis.slice(0, 5), // Top 5 merchants
    insights,
    recommendations,
    emergencyReadiness,
    aiSummary,
    lastUpdated: new Date()
  };
}

/**
 * Calculate overall transaction summary
 */
function calculateTransactionSummary(userId: number, transactions: Transaction[]): TransactionSummary {
  let totalSpent = 0;
  let totalReceived = 0;
  let offlineTransactionCount = 0;
  let offlineTransactionAmount = 0;
  let pendingTransactions = 0;
  let largestTransaction = 0;
  
  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount);
    
    // Update largest transaction
    if (amount > largestTransaction) {
      largestTransaction = amount;
    }
    
    // Count pending transactions
    if (tx.status === 'pending') {
      pendingTransactions++;
    }
    
    // Track offline transactions
    if (tx.is_offline) {
      offlineTransactionCount++;
      offlineTransactionAmount += amount;
    }
    
    // Track spent vs received
    if (tx.sender_id === userId) {
      totalSpent += amount;
    } else if (tx.receiver_id === userId) {
      totalReceived += amount;
    }
  });
  
  const netCashflow = totalReceived - totalSpent;
  const transactionsPerDay = transactions.length / 30; // Assuming 30 days
  const averageTransactionAmount = transactions.length > 0 ? 
    (totalSpent + totalReceived) / transactions.length : 0;
  
  // Calculate emergency fund usage (percentage of emergency balance used)
  const emergencyFundUsage = offlineTransactionAmount;
  
  return {
    totalSpent,
    totalReceived,
    netCashflow,
    offlineTransactionCount,
    offlineTransactionAmount,
    transactionsPerDay,
    averageTransactionAmount,
    largestTransaction,
    emergencyFundUsage,
    pendingTransactions
  };
}

/**
 * Calculate spending breakdown by category
 */
function calculateCategoryBreakdowns(
  userId: number, 
  transactions: Transaction[],
  merchants: Merchant[]
): CategoryBreakdown[] {
  const categories: { [key: string]: { amount: number, count: number } } = {};
  let totalSpent = 0;
  
  // Only count outgoing transactions
  const outgoingTransactions = transactions.filter(tx => tx.sender_id === userId);
  
  outgoingTransactions.forEach(tx => {
    const amount = parseFloat(tx.amount);
    totalSpent += amount;
    
    // Find the merchant for this transaction
    const merchant = merchants.find(m => m.user_id === tx.receiver_id);
    const category = merchant?.category || 'other';
    
    // Add to category totals
    if (!categories[category]) {
      categories[category] = { amount: 0, count: 0 };
    }
    
    categories[category].amount += amount;
    categories[category].count++;
  });
  
  // Convert to array with percentages
  return Object.entries(categories).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
    count: data.count
  })).sort((a, b) => b.amount - a.amount);
}

/**
 * Analyze spending patterns by merchant
 */
function analyzeMerchantSpending(
  userId: number,
  transactions: Transaction[],
  merchants: Merchant[]
): MerchantAnalysis[] {
  const merchantSpending: { [key: number]: { 
    total: number, 
    count: number, 
    dates: Date[],
    name: string
  }} = {};
  
  // Only count outgoing transactions
  const outgoingTransactions = transactions.filter(tx => 
    tx.sender_id === userId && tx.status === 'completed'
  );
  
  outgoingTransactions.forEach(tx => {
    const receiverId = tx.receiver_id;
    const amount = parseFloat(tx.amount);
    const date = tx.timestamp ? new Date(tx.timestamp) : new Date();
    
    if (!merchantSpending[receiverId]) {
      const merchant = merchants.find(m => m.user_id === receiverId);
      merchantSpending[receiverId] = { 
        total: 0, 
        count: 0, 
        dates: [],
        name: merchant?.name || `Merchant ${receiverId}`
      };
    }
    
    merchantSpending[receiverId].total += amount;
    merchantSpending[receiverId].count++;
    merchantSpending[receiverId].dates.push(date);
  });
  
  // Calculate frequency of transactions
  return Object.entries(merchantSpending).map(([merchantId, data]) => {
    let frequency = 'occasional';
    
    if (data.count >= 15) {
      frequency = 'daily';
    } else if (data.count >= 4) {
      frequency = 'weekly';
    } else if (data.count >= 2) {
      frequency = 'monthly';
    }
    
    return {
      merchantId: parseInt(merchantId),
      merchantName: data.name,
      totalSpent: data.total,
      transactionCount: data.count,
      frequency,
      averageAmount: data.total / data.count
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Generate natural language insights based on the data analysis
 */
function generateDataInsights(
  userId: number,
  user: User,
  summary: TransactionSummary,
  categoryBreakdowns: CategoryBreakdown[],
  merchantAnalysis: MerchantAnalysis[]
): string[] {
  const insights: string[] = [];
  
  // Spending pattern insights
  if (summary.totalSpent > 0) {
    insights.push(`You've spent ₹${summary.totalSpent.toLocaleString('en-IN')} in the last 30 days.`);
  }
  
  if (summary.netCashflow < 0) {
    insights.push(`Your spending exceeded your income by ₹${Math.abs(summary.netCashflow).toLocaleString('en-IN')} this month.`);
  } else if (summary.netCashflow > 0) {
    insights.push(`Great job! You saved ₹${summary.netCashflow.toLocaleString('en-IN')} this month.`);
  }
  
  // Category insights
  if (categoryBreakdowns.length > 0) {
    const topCategory = categoryBreakdowns[0];
    insights.push(`Your highest spending category is ${topCategory.category} at ₹${topCategory.amount.toLocaleString('en-IN')} (${topCategory.percentage.toFixed(1)}% of total).`);
  }
  
  // Merchant insights
  if (merchantAnalysis.length > 0) {
    const topMerchant = merchantAnalysis[0];
    insights.push(`You transacted most frequently with ${topMerchant.merchantName} (${topMerchant.transactionCount} times, ₹${topMerchant.totalSpent.toLocaleString('en-IN')}).`);
  }
  
  // Emergency mode insights
  if (summary.offlineTransactionCount > 0) {
    insights.push(`You've made ${summary.offlineTransactionCount} emergency transactions totaling ₹${summary.offlineTransactionAmount.toLocaleString('en-IN')}.`);
  }
  
  // Balance insights
  const currentBalance = parseFloat(user.balance);
  const emergencyBalance = parseFloat(user.emergency_balance);
  
  if (currentBalance < summary.averageTransactionAmount * 5) {
    insights.push(`Your current balance is lower than 5x your average transaction amount.`);
  }
  
  if (emergencyBalance < 5000) {
    insights.push(`Your emergency balance is below the recommended minimum of ₹5,000.`);
  }
  
  // Pending transactions
  if (summary.pendingTransactions > 0) {
    insights.push(`You have ${summary.pendingTransactions} pending transactions that need reconciliation.`);
  }
  
  return insights;
}

/**
 * Generate personalized financial recommendations
 */
function generateRecommendations(
  userId: number,
  user: User,
  summary: TransactionSummary,
  categoryBreakdowns: CategoryBreakdown[],
  merchantAnalysis: MerchantAnalysis[]
): string[] {
  const recommendations: string[] = [];
  
  // Spending recommendations
  if (summary.netCashflow < 0) {
    recommendations.push(`Consider reducing spending to avoid a negative cash flow.`);
    
    // Identify top spending category for reduction
    if (categoryBreakdowns.length > 0) {
      recommendations.push(`Look at reducing expenses in your highest spending category: ${categoryBreakdowns[0].category}.`);
    }
  }
  
  // Emergency fund recommendations
  const emergencyBalance = parseFloat(user.emergency_balance);
  const recommendedEmergencyFund = 10000; // Recommended minimum emergency fund
  
  if (emergencyBalance < recommendedEmergencyFund) {
    recommendations.push(`Consider adding ₹${(recommendedEmergencyFund - emergencyBalance).toLocaleString('en-IN')} to your emergency balance to reach the recommended minimum.`);
  }
  
  // Transaction pattern recommendations
  if (summary.transactionsPerDay > 3) {
    recommendations.push(`You make an average of ${summary.transactionsPerDay.toFixed(1)} transactions per day, which may lead to impulsive spending.`);
  }
  
  // Frequent merchant recommendations
  const frequentSmallTransactions = merchantAnalysis.filter(m => 
    m.frequency === 'daily' && m.averageAmount < 100
  );
  
  if (frequentSmallTransactions.length > 0) {
    recommendations.push(`Consider bundling small frequent purchases at ${frequentSmallTransactions[0].merchantName} to save on transaction costs.`);
  }
  
  // Pending transaction recommendations
  if (summary.pendingTransactions > 0) {
    recommendations.push(`Reconcile your ${summary.pendingTransactions} pending offline transactions as soon as network connectivity is restored.`);
  }
  
  // General recommendations
  recommendations.push(`Regularly monitor your transaction history to identify any unauthorized charges.`);
  
  if (summary.netCashflow > 0) {
    recommendations.push(`Consider investing your monthly savings of ₹${summary.netCashflow.toLocaleString('en-IN')} for long-term growth.`);
  }
  
  return recommendations;
}

/**
 * Calculate emergency readiness score (0-100)
 */
function calculateEmergencyReadiness(user: User, summary: TransactionSummary): number {
  let score = 0;
  const emergencyBalance = parseFloat(user.emergency_balance);
  const recommendedMinimum = 10000;
  const idealAmount = 50000;
  
  // Score based on emergency balance (60 points max)
  if (emergencyBalance >= idealAmount) {
    score += 60;
  } else if (emergencyBalance >= recommendedMinimum) {
    score += 40 + ((emergencyBalance - recommendedMinimum) / (idealAmount - recommendedMinimum)) * 20;
  } else if (emergencyBalance > 0) {
    score += (emergencyBalance / recommendedMinimum) * 40;
  }
  
  // Score based on offline transaction history (20 points max)
  if (summary.offlineTransactionCount > 0) {
    // Has experience using emergency mode
    score += 20;
  } else {
    // No experience with emergency mode
    score += 10; // Still give some points
  }
  
  // Score based on cash flow (20 points max)
  if (summary.netCashflow > 0) {
    score += 20; // Positive cash flow is good for emergency readiness
  } else if (summary.netCashflow === 0) {
    score += 10; // Breaking even
  } else {
    score += Math.max(0, 10 + (summary.netCashflow / summary.totalSpent) * 10);
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Generate a natural language AI-like summary from financial insights
 * This doesn't use actual AI but mimics it with rules-based text generation
 */
function generateAISummary(
  user: User,
  summary: TransactionSummary,
  categoryBreakdowns: CategoryBreakdown[],
  merchantAnalysis: MerchantAnalysis[],
  emergencyReadiness: number
): AISummary {
  // Get user's first name
  const userName = user.name.split(' ')[0];

  // Generate overview
  const overview = generateOverview(userName, summary, emergencyReadiness);

  // Generate strengths
  const strengths = generateStrengths(summary, emergencyReadiness, categoryBreakdowns);

  // Generate improvement areas
  const improvementAreas = generateImprovementAreas(summary, emergencyReadiness, categoryBreakdowns);

  // Generate action plan
  const actionPlan = generateActionPlan(summary, emergencyReadiness, categoryBreakdowns, merchantAnalysis);

  // Generate emergency preparedness statement
  const emergencyPreparedness = generateEmergencyPreparednessStatement(emergencyReadiness, summary);

  return {
    overview,
    strengths,
    improvement_areas: improvementAreas,
    action_plan: actionPlan,
    emergency_preparedness: emergencyPreparedness
  };
}

/**
 * Generate a personalized overview of the user's financial health
 */
function generateOverview(
  userName: string,
  summary: TransactionSummary,
  emergencyReadiness: number
): string {
  const cashflowStatus = summary.netCashflow >= 0 
    ? `positive cash flow of ₹${summary.netCashflow.toLocaleString('en-IN')}` 
    : `negative cash flow of ₹${Math.abs(summary.netCashflow).toLocaleString('en-IN')}`;

  const readinessLevel = emergencyReadiness >= 80 
    ? 'excellent' 
    : emergencyReadiness >= 60 
      ? 'good' 
      : emergencyReadiness >= 40 
        ? 'moderate' 
        : 'concerning';

  return `${userName}, your financial analysis shows you have a ${cashflowStatus} over the past 30 days, with total spending of ₹${summary.totalSpent.toLocaleString('en-IN')}. Your emergency readiness score is ${emergencyReadiness}/100, which is ${readinessLevel}. ${
    summary.offlineTransactionCount > 0 
      ? `You've successfully used EmergencyPay for ${summary.offlineTransactionCount} offline transactions, demonstrating your adaptability during connectivity issues.` 
      : 'You haven\'t used EmergencyPay for offline transactions yet, which is an important capability to utilize during connectivity issues.'
  }`;
}

/**
 * Generate a list of financial strengths
 */
function generateStrengths(
  summary: TransactionSummary,
  emergencyReadiness: number,
  categories: CategoryBreakdown[]
): string[] {
  const strengths: string[] = [];

  // Positive cash flow
  if (summary.netCashflow > 0) {
    strengths.push(`Positive cash flow of ₹${summary.netCashflow.toLocaleString('en-IN')}, showing good income-to-spending ratio.`);
  }

  // Emergency readiness
  if (emergencyReadiness >= 70) {
    strengths.push(`Strong emergency readiness score of ${emergencyReadiness}/100, indicating good preparation for financial disruptions.`);
  }

  // Well-distributed spending
  const topCategory = categories[0];
  if (topCategory && topCategory.percentage < 40) {
    strengths.push(`Well-distributed spending across categories, with no single category exceeding 40% of your budget.`);
  }

  // Offline transaction experience
  if (summary.offlineTransactionCount > 0) {
    strengths.push(`Experience with offline transactions (${summary.offlineTransactionCount} completed), demonstrating your ability to manage payments during connectivity issues.`);
  }

  // Low pending transactions
  if (summary.pendingTransactions === 0) {
    strengths.push(`No pending transactions, showing good reconciliation habits.`);
  }

  // Default strength if none found
  if (strengths.length === 0) {
    strengths.push(`Actively tracking your finances, which is the first step to financial wellness.`);
  }

  return strengths;
}

/**
 * Generate a list of areas for financial improvement
 */
function generateImprovementAreas(
  summary: TransactionSummary,
  emergencyReadiness: number,
  categories: CategoryBreakdown[]
): string[] {
  const improvementAreas: string[] = [];

  // Negative cash flow
  if (summary.netCashflow < 0) {
    improvementAreas.push(`Negative cash flow of ₹${Math.abs(summary.netCashflow).toLocaleString('en-IN')}, indicating spending exceeds income.`);
  }

  // Low emergency readiness
  if (emergencyReadiness < 50) {
    improvementAreas.push(`Emergency readiness score of ${emergencyReadiness}/100 is below recommended levels, limiting your financial resilience.`);
  }

  // Category concentration
  const topCategory = categories[0];
  if (topCategory && topCategory.percentage > 50) {
    improvementAreas.push(`High concentration (${topCategory.percentage.toFixed(1)}%) of spending in ${topCategory.category}, which may indicate budget imbalance.`);
  }

  // Pending transactions
  if (summary.pendingTransactions > 0) {
    improvementAreas.push(`${summary.pendingTransactions} pending transactions need reconciliation to maintain accurate financial records.`);
  }

  // No offline experience
  if (summary.offlineTransactionCount === 0) {
    improvementAreas.push(`No offline transaction experience, which may leave you unprepared for connectivity disruptions.`);
  }

  // Default improvement area if none found
  if (improvementAreas.length === 0) {
    improvementAreas.push(`Consider diversifying your financial habits to build more resilience.`);
  }

  return improvementAreas;
}

/**
 * Generate a personalized action plan based on financial insights
 */
function generateActionPlan(
  summary: TransactionSummary,
  emergencyReadiness: number,
  categories: CategoryBreakdown[],
  merchants: MerchantAnalysis[]
): string[] {
  const actionPlan: string[] = [];

  // Budget balancing
  if (summary.netCashflow < 0) {
    actionPlan.push(`Reduce spending by ₹${Math.abs(summary.netCashflow / 30).toLocaleString('en-IN')} per day to achieve balanced cash flow.`);
  }

  // Emergency fund building
  if (emergencyReadiness < 60) {
    actionPlan.push(`Build your emergency fund by allocating ${summary.netCashflow > 0 ? '30% of your positive cash flow' : '10% of your income'} until you reach a minimum of ₹10,000.`);
  }

  // Category optimization
  const topCategory = categories[0];
  if (topCategory && topCategory.percentage > 40) {
    actionPlan.push(`Review your ${topCategory.category} expenses (₹${topCategory.amount.toLocaleString('en-IN')}) to identify potential savings opportunities.`);
  }

  // Merchant patterns
  if (merchants.length > 0) {
    const frequentMerchant = merchants.find(m => m.frequency === 'daily' || m.frequency === 'weekly');
    if (frequentMerchant) {
      actionPlan.push(`Consider negotiating a discount or loyalty benefits with ${frequentMerchant.merchantName} given your frequent transactions.`);
    }
  }

  // Emergency mode practice
  if (summary.offlineTransactionCount === 0) {
    actionPlan.push(`Practice using EmergencyPay's offline mode to familiarize yourself with the process before an actual emergency.`);
  }

  // Reconciliation
  if (summary.pendingTransactions > 0) {
    actionPlan.push(`Reconcile your ${summary.pendingTransactions} pending transactions to ensure all parties receive proper credit.`);
  }

  // Default action if none generated
  if (actionPlan.length === 0) {
    actionPlan.push(`Continue your current financial management approach while exploring opportunities to increase your savings rate.`);
  }

  return actionPlan;
}

/**
 * Generate a statement about emergency preparedness
 */
function generateEmergencyPreparednessStatement(
  emergencyReadiness: number,
  summary: TransactionSummary
): string {
  // Define emergency preparedness tiers
  const tiers = [
    { min: 80, description: "Excellent preparedness" },
    { min: 60, description: "Good preparedness" },
    { min: 40, description: "Moderate preparedness" },
    { min: 20, description: "Limited preparedness" },
    { min: 0, description: "Critical preparedness gap" }
  ];
  
  // Find the applicable tier
  const tier = tiers.find(t => emergencyReadiness >= t.min) || tiers[tiers.length - 1];
  
  // Calculate specifics for recommendation
  const hasOfflineExperience = summary.offlineTransactionCount > 0;
  const emergencyUsagePct = summary.emergencyFundUsage > 0 
    ? (summary.emergencyFundUsage / summary.totalSpent) * 100 
    : 0;
  
  // Generate appropriate message based on readiness
  if (tier.min >= 80) {
    return `Your emergency readiness score of ${emergencyReadiness}/100 shows excellent preparation for financial disruptions. You have a robust emergency fund and ${hasOfflineExperience ? 'experience with' : 'are familiar with'} offline transactions, putting you in the top tier of EmergencyPay users.`;
  } else if (tier.min >= 60) {
    return `Your emergency readiness score of ${emergencyReadiness}/100 indicates good preparation, but there's room for improvement. ${hasOfflineExperience ? 'Your experience with offline transactions is valuable' : 'Consider practicing offline transactions to build confidence'}, and consider increasing your emergency fund by 20-30% for optimal protection.`;
  } else if (tier.min >= 40) {
    return `With an emergency readiness score of ${emergencyReadiness}/100, you have moderate preparation for financial disruptions. Focus on building your emergency fund and ${hasOfflineExperience ? 'expanding your experience with' : 'learning to use'} EmergencyPay's offline capabilities.`;
  } else if (tier.min >= 20) {
    return `Your emergency readiness score of ${emergencyReadiness}/100 suggests limited preparation for financial emergencies. Prioritize building an emergency fund of at least ₹5,000 and practice using EmergencyPay's offline transaction features.`;
  } else {
    return `With an emergency readiness score of ${emergencyReadiness}/100, there's a critical gap in your emergency preparedness. We strongly recommend immediately setting aside funds for emergencies and familiarizing yourself with EmergencyPay's offline features.`;
  }
}