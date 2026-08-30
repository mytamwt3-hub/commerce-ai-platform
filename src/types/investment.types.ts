export interface Investment {
  id: string;
  merchantId: string;
  investorId: string;
  projectName: string;
  description: string;
  totalCost: number;
  investedAmount: number;
  profitPercentage: number;
  status: 'active' | 'completed' | 'cancelled';
  investmentDate: Date;
  expectedReturn: number;
  actualReturn: number;
  items: InvestmentItem[];
}

export interface InvestmentItem {
  productName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  sold: number;
  remaining: number;
}

export interface InvestmentPortfolio {
  investorId: string;
  totalInvested: number;
  totalEarnings: number;
  activeInvestments: number;
  completedInvestments: number;
  investments: Investment[];
}

export interface ProfitDistribution {
  id: string;
  investmentId: string;
  saleAmount: number;
  investorShare: number;
  merchantShare: number;
  platformFee: number;
  distributedAt: Date;
}
