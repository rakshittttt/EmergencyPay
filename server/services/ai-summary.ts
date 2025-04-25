import { FinancialInsights, TransactionSummary, CategoryBreakdown, MerchantAnalysis } from './analytics';
import { User } from '@shared/schema';

// Interface for AI-generated financial summaries
export interface AISummary {
  overview: string;
  strengths: string[];
  improvement_areas: string[];
  action_plan: string[];
  emergency_preparedness: string;
}

/**
 * Generate a natural language AI-like summary from financial insights
 * This doesn't use actual AI but mimics it with rules-based text generation
 */
export function generateAISummary(
  user: User,
  insights: FinancialInsights
): AISummary {
  // Extract needed data
  const { summary, categoryBreakdowns, topMerchants, emergencyReadiness } = insights;
  const userName = user.name.split(' ')[0];

  // Generate overview
  const overview = generateOverview(userName, summary, emergencyReadiness);

  // Generate strengths
  const strengths = generateStrengths(summary, emergencyReadiness, categoryBreakdowns);

  // Generate improvement areas
  const improvementAreas = generateImprovementAreas(summary, emergencyReadiness, categoryBreakdowns);

  // Generate action plan
  const actionPlan = generateActionPlan(summary, emergencyReadiness, categoryBreakdowns, topMerchants);

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
  const tier = tiers.find(t => emergencyReadiness >= t.min);
  
  // Calculate specifics for recommendation
  const hasOfflineExperience = summary.offlineTransactionCount > 0;
  const emergencyUsagePct = summary.emergencyFundUsage > 0 
    ? (summary.emergencyFundUsage / summary.totalSpent) * 100 
    : 0;
  
  // Generate appropriate message based on readiness
  if (tier?.min >= 80) {
    return `Your emergency readiness score of ${emergencyReadiness}/100 shows excellent preparation for financial disruptions. You have a robust emergency fund and ${hasOfflineExperience ? 'experience with' : 'are familiar with'} offline transactions, putting you in the top tier of EmergencyPay users.`;
  } else if (tier?.min >= 60) {
    return `Your emergency readiness score of ${emergencyReadiness}/100 indicates good preparation, but there's room for improvement. ${hasOfflineExperience ? 'Your experience with offline transactions is valuable' : 'Consider practicing offline transactions to build confidence'}, and consider increasing your emergency fund by 20-30% for optimal protection.`;
  } else if (tier?.min >= 40) {
    return `With an emergency readiness score of ${emergencyReadiness}/100, you have moderate preparation for financial disruptions. Focus on building your emergency fund and ${hasOfflineExperience ? 'expanding your experience with' : 'learning to use'} EmergencyPay's offline capabilities.`;
  } else if (tier?.min >= 20) {
    return `Your emergency readiness score of ${emergencyReadiness}/100 suggests limited preparation for financial emergencies. Prioritize building an emergency fund of at least ₹5,000 and practice using EmergencyPay's offline transaction features.`;
  } else {
    return `With an emergency readiness score of ${emergencyReadiness}/100, there's a critical gap in your emergency preparedness. We strongly recommend immediately setting aside funds for emergencies and familiarizing yourself with EmergencyPay's offline features.`;
  }
}