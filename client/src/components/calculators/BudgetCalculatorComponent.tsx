import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, PieChart, TrendingUp, DollarSign, Calendar, Percent, Home, Car, CreditCard, Heart, GraduationCap, Wallet, Gift, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BudgetInputs {
  // Income (Before Tax)
  salaryIncome: number;
  salaryPeriod: string;
  pensionIncome: number;
  pensionPeriod: string;
  investmentIncome: number;
  investmentPeriod: string;
  otherIncome: number;
  otherIncomePeriod: string;
  incomeTaxRate: number;
  
  // Housing & Utilities
  mortgage: number;
  mortgagePeriod: string;
  propertyTax: number;
  propertyTaxPeriod: string;
  rental: number;
  rentalPeriod: string;
  homeInsurance: number;
  homeInsurancePeriod: string;
  hoaFee: number;
  hoaFeePeriod: string;
  homeMaintenance: number;
  homeMaintenancePeriod: string;
  utilities: number;
  utilitiesPeriod: string;
  
  // Transportation
  autoLoan: number;
  autoLoanPeriod: string;
  autoInsurance: number;
  autoInsurancePeriod: string;
  gasoline: number;
  gasolinePeriod: string;
  autoMaintenance: number;
  autoMaintenancePeriod: string;
  parkingTolls: number;
  parkingTollsPeriod: string;
  otherTransportation: number;
  otherTransportationPeriod: string;
  
  // Other Debt & Loan Payments
  creditCard: number;
  creditCardPeriod: string;
  studentLoan: number;
  studentLoanPeriod: string;
  otherLoans: number;
  otherLoansPeriod: string;
  
  // Living Expenses
  food: number;
  foodPeriod: string;
  clothing: number;
  clothingPeriod: string;
  householdSupplies: number;
  householdSuppliesPeriod: string;
  mealsOut: number;
  mealsOutPeriod: string;
  otherLiving: number;
  otherLivingPeriod: string;
  
  // Healthcare
  medicalInsurance: number;
  medicalInsurancePeriod: string;
  medicalSpending: number;
  medicalSpendingPeriod: string;
  
  // Children & Education
  childCare: number;
  childCarePeriod: string;
  tuitionSupplies: number;
  tuitionSuppliesPeriod: string;
  childSupport: number;
  childSupportPeriod: string;
  otherEducation: number;
  otherEducationPeriod: string;
  
  // Savings & Investments
  retirement401k: number;
  retirement401kPeriod: string;
  collegeSaving: number;
  collegeSavingPeriod: string;
  investments: number;
  investmentsPeriod: string;
  emergencyFund: number;
  emergencyFundPeriod: string;
  
  // Miscellaneous Expenses
  pet: number;
  petPeriod: string;
  giftsDonations: number;
  giftsDonationsPeriod: string;
  hobbiesSports: number;
  hobbiesSportsPeriod: string;
  entertainment: number;
  entertainmentPeriod: string;
  travelVacation: number;
  travelVacationPeriod: string;
  otherMisc: number;
  otherMiscPeriod: string;
}

interface BudgetResults {
  // Income Summary
  totalGrossIncomeMonthly: number;
  totalGrossIncomeAnnual: number;
  totalNetIncomeMonthly: number;
  totalNetIncomeAnnual: number;
  
  // Expense Summary by Category
  housingUtilitiesMonthly: number;
  transportationMonthly: number;
  debtPaymentsMonthly: number;
  livingExpensesMonthly: number;
  healthcareMonthly: number;
  childrenEducationMonthly: number;
  savingsInvestmentsMonthly: number;
  miscellaneousMonthly: number;
  totalExpensesMonthly: number;
  totalExpensesAnnual: number;
  
  // Budget Analysis
  monthlyNetIncome: number;
  monthlySurplusDeficit: number;
  annualSurplusDeficit: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  housingCostRatio: number;
  transportationCostRatio: number;
  
  // Category Percentages
  categoryPercentages: {
    housing: number;
    transportation: number;
    debt: number;
    living: number;
    healthcare: number;
    childrenEducation: number;
    savings: number;
    miscellaneous: number;
  };
  
  // Recommendations (50/30/20 rule)
  recommendedNeeds: number;
  recommendedWants: number;
  recommendedSavings: number;
  actualNeeds: number;
  actualWants: number;
  actualSavings: number;
}

const BudgetCalculatorComponent = () => {
  const [inputs, setInputs] = useState<BudgetInputs>({
    // Income defaults
    salaryIncome: 80000,
    salaryPeriod: 'year',
    pensionIncome: 0,
    pensionPeriod: 'year',
    investmentIncome: 1000,
    investmentPeriod: 'year',
    otherIncome: 2000,
    otherIncomePeriod: 'year',
    incomeTaxRate: 28,
    
    // Housing & Utilities defaults
    mortgage: 0,
    mortgagePeriod: 'month',
    propertyTax: 0,
    propertyTaxPeriod: 'year',
    rental: 1400,
    rentalPeriod: 'month',
    homeInsurance: 200,
    homeInsurancePeriod: 'year',
    hoaFee: 0,
    hoaFeePeriod: 'year',
    homeMaintenance: 0,
    homeMaintenancePeriod: 'month',
    utilities: 250,
    utilitiesPeriod: 'month',
    
    // Transportation defaults
    autoLoan: 250,
    autoLoanPeriod: 'month',
    autoInsurance: 700,
    autoInsurancePeriod: 'year',
    gasoline: 100,
    gasolinePeriod: 'month',
    autoMaintenance: 600,
    autoMaintenancePeriod: 'year',
    parkingTolls: 20,
    parkingTollsPeriod: 'month',
    otherTransportation: 0,
    otherTransportationPeriod: 'month',
    
    // Other Debt defaults
    creditCard: 0,
    creditCardPeriod: 'month',
    studentLoan: 250,
    studentLoanPeriod: 'month',
    otherLoans: 0,
    otherLoansPeriod: 'month',
    
    // Living Expenses defaults
    food: 400,
    foodPeriod: 'month',
    clothing: 100,
    clothingPeriod: 'month',
    householdSupplies: 100,
    householdSuppliesPeriod: 'month',
    mealsOut: 200,
    mealsOutPeriod: 'month',
    otherLiving: 200,
    otherLivingPeriod: 'month',
    
    // Healthcare defaults
    medicalInsurance: 0,
    medicalInsurancePeriod: 'month',
    medicalSpending: 200,
    medicalSpendingPeriod: 'month',
    
    // Children & Education defaults
    childCare: 0,
    childCarePeriod: 'month',
    tuitionSupplies: 0,
    tuitionSuppliesPeriod: 'month',
    childSupport: 0,
    childSupportPeriod: 'month',
    otherEducation: 100,
    otherEducationPeriod: 'month',
    
    // Savings & Investments defaults
    retirement401k: 10000,
    retirement401kPeriod: 'year',
    collegeSaving: 0,
    collegeSavingPeriod: 'year',
    investments: 0,
    investmentsPeriod: 'year',
    emergencyFund: 0,
    emergencyFundPeriod: 'month',
    
    // Miscellaneous defaults
    pet: 200,
    petPeriod: 'month',
    giftsDonations: 300,
    giftsDonationsPeriod: 'year',
    hobbiesSports: 100,
    hobbiesSportsPeriod: 'month',
    entertainment: 100,
    entertainmentPeriod: 'month',
    travelVacation: 2000,
    travelVacationPeriod: 'year',
    otherMisc: 100,
    otherMiscPeriod: 'month'
  });

  const [results, setResults] = useState<BudgetResults>({
    totalGrossIncomeMonthly: 0,
    totalGrossIncomeAnnual: 0,
    totalNetIncomeMonthly: 0,
    totalNetIncomeAnnual: 0,
    housingUtilitiesMonthly: 0,
    transportationMonthly: 0,
    debtPaymentsMonthly: 0,
    livingExpensesMonthly: 0,
    healthcareMonthly: 0,
    childrenEducationMonthly: 0,
    savingsInvestmentsMonthly: 0,
    miscellaneousMonthly: 0,
    totalExpensesMonthly: 0,
    totalExpensesAnnual: 0,
    monthlyNetIncome: 0,
    monthlySurplusDeficit: 0,
    annualSurplusDeficit: 0,
    savingsRate: 0,
    debtToIncomeRatio: 0,
    housingCostRatio: 0,
    transportationCostRatio: 0,
    categoryPercentages: {
      housing: 0,
      transportation: 0,
      debt: 0,
      living: 0,
      healthcare: 0,
      childrenEducation: 0,
      savings: 0,
      miscellaneous: 0
    },
    recommendedNeeds: 0,
    recommendedWants: 0,
    recommendedSavings: 0,
    actualNeeds: 0,
    actualWants: 0,
    actualSavings: 0
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (rate: number): string => {
    return `${rate.toFixed(1)}%`;
  };

  const convertToMonthly = (amount: number | string, period: string): number => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    if (!numAmount || numAmount < 0) return 0;
    
    switch (period) {
      case 'month':
        return numAmount;
      case 'year':
        return numAmount / 12;
      case 'week':
        return numAmount * 52 / 12;
      case 'biweekly':
        return numAmount * 26 / 12;
      default:
        return numAmount;
    }
  };

  const calculateBudget = (): BudgetResults => {
    try {
      // Calculate gross income
      const salaryMonthly = convertToMonthly(inputs.salaryIncome, inputs.salaryPeriod);
      const pensionMonthly = convertToMonthly(inputs.pensionIncome, inputs.pensionPeriod);
      const investmentMonthly = convertToMonthly(inputs.investmentIncome, inputs.investmentPeriod);
      const otherIncomeMonthly = convertToMonthly(inputs.otherIncome, inputs.otherIncomePeriod);
      
      const totalGrossIncomeMonthly = salaryMonthly + pensionMonthly + investmentMonthly + otherIncomeMonthly;
      const totalGrossIncomeAnnual = totalGrossIncomeMonthly * 12;
      
      // Calculate net income (after taxes)
      const taxRate = Math.max(0, Math.min(100, inputs.incomeTaxRate)) / 100;
      const totalNetIncomeMonthly = totalGrossIncomeMonthly * (1 - taxRate);
      const totalNetIncomeAnnual = totalNetIncomeMonthly * 12;
      
      // Calculate expenses by category
      const housingUtilitiesMonthly = 
        convertToMonthly(inputs.mortgage, inputs.mortgagePeriod) +
        convertToMonthly(inputs.propertyTax, inputs.propertyTaxPeriod) +
        convertToMonthly(inputs.rental, inputs.rentalPeriod) +
        convertToMonthly(inputs.homeInsurance, inputs.homeInsurancePeriod) +
        convertToMonthly(inputs.hoaFee, inputs.hoaFeePeriod) +
        convertToMonthly(inputs.homeMaintenance, inputs.homeMaintenancePeriod) +
        convertToMonthly(inputs.utilities, inputs.utilitiesPeriod);
      
      const transportationMonthly = 
        convertToMonthly(inputs.autoLoan, inputs.autoLoanPeriod) +
        convertToMonthly(inputs.autoInsurance, inputs.autoInsurancePeriod) +
        convertToMonthly(inputs.gasoline, inputs.gasolinePeriod) +
        convertToMonthly(inputs.autoMaintenance, inputs.autoMaintenancePeriod) +
        convertToMonthly(inputs.parkingTolls, inputs.parkingTollsPeriod) +
        convertToMonthly(inputs.otherTransportation, inputs.otherTransportationPeriod);
      
      const debtPaymentsMonthly = 
        convertToMonthly(inputs.creditCard, inputs.creditCardPeriod) +
        convertToMonthly(inputs.studentLoan, inputs.studentLoanPeriod) +
        convertToMonthly(inputs.otherLoans, inputs.otherLoansPeriod);
      
      const livingExpensesMonthly = 
        convertToMonthly(inputs.food, inputs.foodPeriod) +
        convertToMonthly(inputs.clothing, inputs.clothingPeriod) +
        convertToMonthly(inputs.householdSupplies, inputs.householdSuppliesPeriod) +
        convertToMonthly(inputs.mealsOut, inputs.mealsOutPeriod) +
        convertToMonthly(inputs.otherLiving, inputs.otherLivingPeriod);
      
      const healthcareMonthly = 
        convertToMonthly(inputs.medicalInsurance, inputs.medicalInsurancePeriod) +
        convertToMonthly(inputs.medicalSpending, inputs.medicalSpendingPeriod);
      
      const childrenEducationMonthly = 
        convertToMonthly(inputs.childCare, inputs.childCarePeriod) +
        convertToMonthly(inputs.tuitionSupplies, inputs.tuitionSuppliesPeriod) +
        convertToMonthly(inputs.childSupport, inputs.childSupportPeriod) +
        convertToMonthly(inputs.otherEducation, inputs.otherEducationPeriod);
      
      const savingsInvestmentsMonthly = 
        convertToMonthly(inputs.retirement401k, inputs.retirement401kPeriod) +
        convertToMonthly(inputs.collegeSaving, inputs.collegeSavingPeriod) +
        convertToMonthly(inputs.investments, inputs.investmentsPeriod) +
        convertToMonthly(inputs.emergencyFund, inputs.emergencyFundPeriod);
      
      const miscellaneousMonthly = 
        convertToMonthly(inputs.pet, inputs.petPeriod) +
        convertToMonthly(inputs.giftsDonations, inputs.giftsDonationsPeriod) +
        convertToMonthly(inputs.hobbiesSports, inputs.hobbiesSportsPeriod) +
        convertToMonthly(inputs.entertainment, inputs.entertainmentPeriod) +
        convertToMonthly(inputs.travelVacation, inputs.travelVacationPeriod) +
        convertToMonthly(inputs.otherMisc, inputs.otherMiscPeriod);
      
      const totalExpensesMonthly = housingUtilitiesMonthly + transportationMonthly + debtPaymentsMonthly + 
        livingExpensesMonthly + healthcareMonthly + childrenEducationMonthly + 
        savingsInvestmentsMonthly + miscellaneousMonthly;
      
      const totalExpensesAnnual = totalExpensesMonthly * 12;
      
      // Calculate surplus/deficit
      const monthlySurplusDeficit = totalNetIncomeMonthly - totalExpensesMonthly;
      const annualSurplusDeficit = monthlySurplusDeficit * 12;
      
      // Calculate ratios and percentages
      const savingsRate = totalNetIncomeMonthly > 0 ? (savingsInvestmentsMonthly / totalNetIncomeMonthly) * 100 : 0;
      const debtToIncomeRatio = totalNetIncomeMonthly > 0 ? (debtPaymentsMonthly / totalNetIncomeMonthly) * 100 : 0;
      const housingCostRatio = totalNetIncomeMonthly > 0 ? (housingUtilitiesMonthly / totalNetIncomeMonthly) * 100 : 0;
      const transportationCostRatio = totalNetIncomeMonthly > 0 ? (transportationMonthly / totalNetIncomeMonthly) * 100 : 0;
      
      // Calculate category percentages
      const categoryPercentages = {
        housing: totalNetIncomeMonthly > 0 ? (housingUtilitiesMonthly / totalNetIncomeMonthly) * 100 : 0,
        transportation: totalNetIncomeMonthly > 0 ? (transportationMonthly / totalNetIncomeMonthly) * 100 : 0,
        debt: totalNetIncomeMonthly > 0 ? (debtPaymentsMonthly / totalNetIncomeMonthly) * 100 : 0,
        living: totalNetIncomeMonthly > 0 ? (livingExpensesMonthly / totalNetIncomeMonthly) * 100 : 0,
        healthcare: totalNetIncomeMonthly > 0 ? (healthcareMonthly / totalNetIncomeMonthly) * 100 : 0,
        childrenEducation: totalNetIncomeMonthly > 0 ? (childrenEducationMonthly / totalNetIncomeMonthly) * 100 : 0,
        savings: totalNetIncomeMonthly > 0 ? (savingsInvestmentsMonthly / totalNetIncomeMonthly) * 100 : 0,
        miscellaneous: totalNetIncomeMonthly > 0 ? (miscellaneousMonthly / totalNetIncomeMonthly) * 100 : 0
      };
      
      // 50/30/20 rule recommendations
      const recommendedNeeds = totalNetIncomeMonthly * 0.50; // Housing, utilities, minimum food, transportation
      const recommendedWants = totalNetIncomeMonthly * 0.30; // Entertainment, dining out, hobbies
      const recommendedSavings = totalNetIncomeMonthly * 0.20; // Savings, investments, extra debt payments
      
      // Calculate actual needs/wants/savings
      const actualNeeds = housingUtilitiesMonthly + (livingExpensesMonthly * 0.7) + (transportationMonthly * 0.8) + healthcareMonthly;
      const actualWants = miscellaneousMonthly + (livingExpensesMonthly * 0.3) + (transportationMonthly * 0.2) + childrenEducationMonthly;
      const actualSavings = savingsInvestmentsMonthly;

      return {
        totalGrossIncomeMonthly,
        totalGrossIncomeAnnual,
        totalNetIncomeMonthly,
        totalNetIncomeAnnual,
        housingUtilitiesMonthly,
        transportationMonthly,
        debtPaymentsMonthly,
        livingExpensesMonthly,
        healthcareMonthly,
        childrenEducationMonthly,
        savingsInvestmentsMonthly,
        miscellaneousMonthly,
        totalExpensesMonthly,
        totalExpensesAnnual,
        monthlyNetIncome: totalNetIncomeMonthly,
        monthlySurplusDeficit,
        annualSurplusDeficit,
        savingsRate,
        debtToIncomeRatio,
        housingCostRatio,
        transportationCostRatio,
        categoryPercentages,
        recommendedNeeds,
        recommendedWants,
        recommendedSavings,
        actualNeeds,
        actualWants,
        actualSavings
      };
    } catch (error) {
      console.error('Budget calculation error:', error);
      return {
        totalGrossIncomeMonthly: 0,
        totalGrossIncomeAnnual: 0,
        totalNetIncomeMonthly: 0,
        totalNetIncomeAnnual: 0,
        housingUtilitiesMonthly: 0,
        transportationMonthly: 0,
        debtPaymentsMonthly: 0,
        livingExpensesMonthly: 0,
        healthcareMonthly: 0,
        childrenEducationMonthly: 0,
        savingsInvestmentsMonthly: 0,
        miscellaneousMonthly: 0,
        totalExpensesMonthly: 0,
        totalExpensesAnnual: 0,
        monthlyNetIncome: 0,
        monthlySurplusDeficit: 0,
        annualSurplusDeficit: 0,
        savingsRate: 0,
        debtToIncomeRatio: 0,
        housingCostRatio: 0,
        transportationCostRatio: 0,
        categoryPercentages: {
          housing: 0,
          transportation: 0,
          debt: 0,
          living: 0,
          healthcare: 0,
          childrenEducation: 0,
          savings: 0,
          miscellaneous: 0
        },
        recommendedNeeds: 0,
        recommendedWants: 0,
        recommendedSavings: 0,
        actualNeeds: 0,
        actualWants: 0,
        actualSavings: 0
      };
    }
  };

  // Real-time calculation using useEffect
  useEffect(() => {
    const newResults = calculateBudget();
    setResults(newResults);
  }, [inputs]);

  const handleInputChange = (field: keyof BudgetInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (value === '' ? '' : parseFloat(value) || 0) : value
    }));
  };

  const handlePeriodChange = (field: keyof BudgetInputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderInputField = (
    label: string, 
    field: keyof BudgetInputs, 
    periodField?: keyof BudgetInputs, 
    tooltip?: string,
    hasSelect: boolean = true
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field}>{label}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                  <AlertTriangle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          id={field}
          type="number"
          value={inputs[field] === 0 ? '' : inputs[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="flex-1"
          min="0"
          step="0.01"
          placeholder="0"
        />
        {hasSelect && periodField && (
          <Select 
            value={inputs[periodField] as string} 
            onValueChange={(value) => handlePeriodChange(periodField, value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="biweekly">Biweekly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Budget Calculator</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Plan your personal finances with comprehensive income and expense tracking. 
          All income items are before tax values. Get real-time calculations and budget insights.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Income Section */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                Income (Before Tax)
              </CardTitle>
              <CardDescription>Enter all sources of income before taxes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField(
                "Salary & Earned Income", 
                "salaryIncome", 
                "salaryPeriod",
                "Regular wages, salary, freelance income, and bonuses"
              )}
              {renderInputField(
                "Pension & Social Security", 
                "pensionIncome", 
                "pensionPeriod",
                "Retirement benefits, pension payments, and social security"
              )}
              {renderInputField(
                "Investments & Savings", 
                "investmentIncome", 
                "investmentPeriod",
                "Interest, capital gains, dividends, and rental income"
              )}
              {renderInputField(
                "Other Income", 
                "otherIncome", 
                "otherIncomePeriod",
                "Gifts, alimony, child support, tax refunds, and other sources"
              )}
              <Separator />
              {renderInputField(
                "Income Tax Rate (%)", 
                "incomeTaxRate", 
                undefined,
                "Combined federal, state, and local tax rate",
                false
              )}
            </CardContent>
          </Card>

          {/* Housing & Utilities */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Home className="h-5 w-5" />
                Housing & Utilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField("Mortgage", "mortgage", "mortgagePeriod")}
              {renderInputField("Property Tax", "propertyTax", "propertyTaxPeriod")}
              {renderInputField("Rental", "rental", "rentalPeriod")}
              {renderInputField(
                "Insurance", 
                "homeInsurance", 
                "homeInsurancePeriod",
                "Homeowner's, renter's, home warranty, etc."
              )}
              {renderInputField("HOA/Co-Op Fee", "hoaFee", "hoaFeePeriod")}
              {renderInputField(
                "Home Maintenance", 
                "homeMaintenance", 
                "homeMaintenancePeriod",
                "Repairs, landscaping, cleaning, furniture, appliances"
              )}
              {renderInputField(
                "Utilities", 
                "utilities", 
                "utilitiesPeriod",
                "Electricity, gas, water, phone, cable, heating"
              )}
            </CardContent>
          </Card>

          {/* Transportation */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Car className="h-5 w-5" />
                Transportation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField("Auto Loan", "autoLoan", "autoLoanPeriod")}
              {renderInputField("Auto Insurance", "autoInsurance", "autoInsurancePeriod")}
              {renderInputField("Gasoline", "gasoline", "gasolinePeriod")}
              {renderInputField("Auto Maintenance", "autoMaintenance", "autoMaintenancePeriod")}
              {renderInputField("Parking/Tolls", "parkingTolls", "parkingTollsPeriod")}
              {renderInputField(
                "Other Transportation", 
                "otherTransportation", 
                "otherTransportationPeriod",
                "Public transit, taxi, registration fees, etc."
              )}
            </CardContent>
          </Card>

          {/* Other Debt & Loan Payments */}
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <CreditCard className="h-5 w-5" />
                Other Debt & Loan Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField(
                "Credit Card", 
                "creditCard", 
                "creditCardPeriod",
                "Recurring payments to pay down credit card balance"
              )}
              {renderInputField("Student Loan", "studentLoan", "studentLoanPeriod")}
              {renderInputField(
                "Other Loans", 
                "otherLoans", 
                "otherLoansPeriod",
                "Personal loans, store cards, etc."
              )}
            </CardContent>
          </Card>

          {/* Living Expenses */}
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Wallet className="h-5 w-5" />
                Living Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField("Food", "food", "foodPeriod")}
              {renderInputField("Clothing", "clothing", "clothingPeriod")}
              {renderInputField("Household Supplies", "householdSupplies", "householdSuppliesPeriod")}
              {renderInputField("Meals Out", "mealsOut", "mealsOutPeriod")}
              {renderInputField(
                "Other Living", 
                "otherLiving", 
                "otherLivingPeriod",
                "Laundry, barber, beauty, alcohol, tobacco, etc."
              )}
            </CardContent>
          </Card>

          {/* Healthcare */}
          <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <Heart className="h-5 w-5" />
                Healthcare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField("Medical Insurance", "medicalInsurance", "medicalInsurancePeriod")}
              {renderInputField(
                "Medical Spending", 
                "medicalSpending", 
                "medicalSpendingPeriod",
                "Copays, uncovered doctor visits, prescriptions, etc."
              )}
            </CardContent>
          </Card>

          {/* Children & Education */}
          <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <GraduationCap className="h-5 w-5" />
                Children & Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField("Child & Personal Care", "childCare", "childCarePeriod")}
              {renderInputField("Tuition & Supplies", "tuitionSupplies", "tuitionSuppliesPeriod")}
              {renderInputField("Child Support Payments", "childSupport", "childSupportPeriod")}
              {renderInputField(
                "Other Education", 
                "otherEducation", 
                "otherEducationPeriod",
                "Books, software, magazines, devices, etc."
              )}
            </CardContent>
          </Card>

          {/* Savings & Investments */}
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
                Savings & Investments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField(
                "401k & IRA", 
                "retirement401k", 
                "retirement401kPeriod",
                "Before-tax retirement contributions"
              )}
              {renderInputField(
                "College Saving", 
                "collegeSaving", 
                "collegeSavingPeriod",
                "529 plans and education savings"
              )}
              {renderInputField(
                "Investments", 
                "investments", 
                "investmentsPeriod",
                "Stocks, bonds, funds, real estate, etc."
              )}
              {renderInputField(
                "Emergency Fund & Other", 
                "emergencyFund", 
                "emergencyFundPeriod",
                "Savings accounts, CDs, house fund, major purchases"
              )}
            </CardContent>
          </Card>

          {/* Miscellaneous Expenses */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Gift className="h-5 w-5" />
                Miscellaneous Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField("Pet", "pet", "petPeriod")}
              {renderInputField("Gifts & Donations", "giftsDonations", "giftsDonationsPeriod")}
              {renderInputField(
                "Hobbies & Sports", 
                "hobbiesSports", 
                "hobbiesSportsPeriod",
                "Including tickets, gym membership, etc."
              )}
              {renderInputField("Entertainment & Tickets", "entertainment", "entertainmentPeriod")}
              {renderInputField("Travel & Vacation", "travelVacation", "travelVacationPeriod")}
              {renderInputField("Other Expenses", "otherMisc", "otherMiscPeriod")}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Income Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                Income Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gross Monthly:</span>
                <span className="font-semibold">{formatCurrency(results.totalGrossIncomeMonthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gross Annual:</span>
                <span className="font-semibold">{formatCurrency(results.totalGrossIncomeAnnual)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Monthly:</span>
                <span className="font-semibold text-green-600">{formatCurrency(results.totalNetIncomeMonthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Annual:</span>
                <span className="font-semibold text-green-600">{formatCurrency(results.totalNetIncomeAnnual)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Budget Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Calculator className="h-5 w-5" />
                Budget Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Income:</span>
                <span className="font-semibold text-green-600">{formatCurrency(results.totalNetIncomeMonthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(results.totalExpensesMonthly)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Balance:</span>
                <span className={`font-bold ${results.monthlySurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.monthlySurplusDeficit >= 0 ? '+' : ''}{formatCurrency(results.monthlySurplusDeficit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Annual Balance:</span>
                <span className={`font-bold ${results.annualSurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.annualSurplusDeficit >= 0 ? '+' : ''}{formatCurrency(results.annualSurplusDeficit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Key Ratios */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Percent className="h-5 w-5" />
                Key Financial Ratios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Savings Rate:</span>
                <span className={`font-semibold ${results.savingsRate >= 20 ? 'text-green-600' : results.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatPercent(results.savingsRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Housing Costs:</span>
                <span className={`font-semibold ${results.housingCostRatio <= 30 ? 'text-green-600' : results.housingCostRatio <= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatPercent(results.housingCostRatio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transportation:</span>
                <span className={`font-semibold ${results.transportationCostRatio <= 15 ? 'text-green-600' : results.transportationCostRatio <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatPercent(results.transportationCostRatio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Debt-to-Income:</span>
                <span className={`font-semibold ${results.debtToIncomeRatio <= 20 ? 'text-green-600' : results.debtToIncomeRatio <= 36 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatPercent(results.debtToIncomeRatio)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 50/30/20 Rule Analysis */}
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <PieChart className="h-5 w-5" />
                50/30/20 Rule Analysis
              </CardTitle>
              <CardDescription>Recommended vs Actual Spending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Needs (50%)</span>
                  <span>{formatCurrency(results.recommendedNeeds)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${results.actualNeeds <= results.recommendedNeeds ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (results.actualNeeds / results.recommendedNeeds) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  Actual: {formatCurrency(results.actualNeeds)} 
                  ({results.totalNetIncomeMonthly > 0 ? formatPercent((results.actualNeeds / results.totalNetIncomeMonthly) * 100) : '0%'})
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Wants (30%)</span>
                  <span>{formatCurrency(results.recommendedWants)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${results.actualWants <= results.recommendedWants ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (results.actualWants / results.recommendedWants) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  Actual: {formatCurrency(results.actualWants)} 
                  ({results.totalNetIncomeMonthly > 0 ? formatPercent((results.actualWants / results.totalNetIncomeMonthly) * 100) : '0%'})
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Savings (20%)</span>
                  <span>{formatCurrency(results.recommendedSavings)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${results.actualSavings >= results.recommendedSavings ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (results.actualSavings / results.recommendedSavings) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  Actual: {formatCurrency(results.actualSavings)} 
                  ({results.totalNetIncomeMonthly > 0 ? formatPercent((results.actualSavings / results.totalNetIncomeMonthly) * 100) : '0%'})
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Status Alert */}
          {results.totalNetIncomeMonthly > 0 && (
            <Card className={`${results.monthlySurplusDeficit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {results.monthlySurplusDeficit >= 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${results.monthlySurplusDeficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {results.monthlySurplusDeficit >= 0 ? 'Budget Surplus' : 'Budget Deficit'}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${results.monthlySurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.monthlySurplusDeficit >= 0 
                    ? `You have ${formatCurrency(results.monthlySurplusDeficit)} left over each month. Consider increasing savings or investments.`
                    : `You're overspending by ${formatCurrency(Math.abs(results.monthlySurplusDeficit))} each month. Review your expenses to balance your budget.`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Expense Breakdown Charts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PieChart className="h-6 w-6" />
          Expense Breakdown
        </h2>

        {/* Mobile Chart View */}
        <div className="block md:hidden space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-blue-700">Monthly Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Housing & Utilities', amount: results.housingUtilitiesMonthly, percentage: results.categoryPercentages.housing, color: 'bg-blue-500' },
                { label: 'Transportation', amount: results.transportationMonthly, percentage: results.categoryPercentages.transportation, color: 'bg-purple-500' },
                { label: 'Debt Payments', amount: results.debtPaymentsMonthly, percentage: results.categoryPercentages.debt, color: 'bg-red-500' },
                { label: 'Living Expenses', amount: results.livingExpensesMonthly, percentage: results.categoryPercentages.living, color: 'bg-yellow-500' },
                { label: 'Healthcare', amount: results.healthcareMonthly, percentage: results.categoryPercentages.healthcare, color: 'bg-pink-500' },
                { label: 'Children & Education', amount: results.childrenEducationMonthly, percentage: results.categoryPercentages.childrenEducation, color: 'bg-cyan-500' },
                { label: 'Savings & Investments', amount: results.savingsInvestmentsMonthly, percentage: results.categoryPercentages.savings, color: 'bg-green-500' },
                { label: 'Miscellaneous', amount: results.miscellaneousMonthly, percentage: results.categoryPercentages.miscellaneous, color: 'bg-gray-500' }
              ].filter(item => item.amount > 0).map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span>{formatCurrency(item.amount)} ({formatPercent(item.percentage)})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${Math.max(1, item.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Chart View */}
        <div className="hidden md:block">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-blue-700">Monthly Expenses Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <svg viewBox="0 0 800 400" className="w-full h-96">
                  {/* Pie Chart */}
                  {(() => {
                    const categories = [
                      { label: 'Housing', amount: results.housingUtilitiesMonthly, color: '#3B82F6' },
                      { label: 'Transportation', amount: results.transportationMonthly, color: '#8B5CF6' },
                      { label: 'Debt', amount: results.debtPaymentsMonthly, color: '#EF4444' },
                      { label: 'Living', amount: results.livingExpensesMonthly, color: '#EAB308' },
                      { label: 'Healthcare', amount: results.healthcareMonthly, color: '#EC4899' },
                      { label: 'Children/Education', amount: results.childrenEducationMonthly, color: '#06B6D4' },
                      { label: 'Savings', amount: results.savingsInvestmentsMonthly, color: '#10B981' },
                      { label: 'Miscellaneous', amount: results.miscellaneousMonthly, color: '#6B7280' }
                    ].filter(cat => cat.amount > 0);

                    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
                    if (total === 0) return null;

                    let currentAngle = 0;
                    const radius = 120;
                    const centerX = 200;
                    const centerY = 200;

                    return (
                      <g>
                        {categories.map((category, index) => {
                          const percentage = (category.amount / total) * 100;
                          const angle = (category.amount / total) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          
                          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
                          
                          const largeArcFlag = angle > 180 ? 1 : 0;
                          
                          const pathData = [
                            `M ${centerX} ${centerY}`,
                            `L ${x1} ${y1}`,
                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            'Z'
                          ].join(' ');

                          // Label position
                          const labelAngle = startAngle + angle / 2;
                          const labelRadius = radius + 30;
                          const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
                          const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);

                          currentAngle += angle;

                          return (
                            <g key={index}>
                              <path
                                d={pathData}
                                fill={category.color}
                                stroke="white"
                                strokeWidth="2"
                              />
                              {percentage > 5 && (
                                <text
                                  x={labelX}
                                  y={labelY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="text-xs font-medium fill-gray-700"
                                >
                                  {category.label}
                                </text>
                              )}
                            </g>
                          );
                        })}
                        
                        {/* Legend */}
                        {categories.map((category, index) => (
                          <g key={`legend-${index}`}>
                            <rect
                              x={450}
                              y={50 + index * 30}
                              width={15}
                              height={15}
                              fill={category.color}
                            />
                            <text
                              x={475}
                              y={62 + index * 30}
                              className="text-sm fill-gray-700"
                            >
                              {category.label}: {formatCurrency(category.amount)} ({formatPercent((category.amount / total) * 100)})
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete Budget Calculator Guide: Master Personal Financial Planning</CardTitle>
          <CardDescription>
            This comprehensive budget calculator helps you create detailed financial plans with income tracking, expense categorization, 
            and the popular 50/30/20 budgeting rule analysis. Plan your financial future with real-time calculations, savings rate tracking, 
            and debt-to-income ratio monitoring to achieve your financial goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">What is Personal Budgeting? Foundation of Financial Success</h3>
              <p className="text-gray-700 mb-4 text-base leading-relaxed">
                Personal budgeting represents the systematic planning and management of income and expenses over specific time periods, 
                typically monthly or annually. A budget serves as a financial roadmap, enabling individuals to allocate resources 
                effectively, achieve financial goals, and build long-term wealth. Successful budgeting involves tracking all income 
                sources, categorizing expenses, and maintaining spending discipline to live within one's means.
              </p>
              
              <p className="text-gray-700 mb-4 text-base leading-relaxed">
                Studies show that individuals who maintain detailed budgets accumulate 15-20% more wealth over time compared to 
                non-budgeters. The budgeting process reveals spending patterns, identifies cost-cutting opportunities, and creates 
                accountability for financial decisions. Modern budgeting extends beyond mere expense tracking to include investment 
                planning, emergency fund building, and retirement preparation.
              </p>

              <h4 className="text-lg font-semibold mb-3 text-gray-800">The Science Behind Effective Budgeting</h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                  <p className="font-semibold text-green-800 text-base">Income Classification & Tax Planning</p>
                  <p className="text-green-700 text-sm leading-relaxed">
                    Effective budgeting begins with comprehensive income documentation including salaries, freelance earnings, 
                    investment returns, rental income, and government benefits. Understanding gross versus net income helps 
                    create realistic spending plans. Tax-advantaged accounts like 401(k)s, IRAs, and HSAs reduce taxable income 
                    while building future wealth, making pre-tax contributions essential budgeting considerations.
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="font-semibold text-blue-800 text-base">Expense Categorization Strategy</p>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Successful budgets categorize expenses into fixed costs (rent, insurance, loan payments), variable necessities 
                    (groceries, utilities, transportation), and discretionary spending (entertainment, dining out, hobbies). 
                    This classification reveals spending flexibility and identifies areas for potential cost reduction during 
                    financial challenges or goal pursuit.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                  <p className="font-semibold text-purple-800 text-base">The 50/30/20 Rule Framework</p>
                  <p className="text-purple-700 text-sm leading-relaxed">
                    This evidence-based budgeting framework allocates 50% of after-tax income to needs (housing, utilities, 
                    minimum food, transportation), 30% to wants (entertainment, dining out, hobbies), and 20% to savings 
                    and debt repayment. Research indicates this ratio provides optimal balance between current lifestyle 
                    maintenance and future financial security.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Advanced Budgeting Strategies & Financial Metrics</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">Critical Financial Health Indicators</h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Beyond basic income and expenses, several key ratios determine financial health and guide budgeting decisions. 
                    These metrics provide objective measures of financial progress and help identify areas requiring attention 
                    or improvement.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border-l-4 border-amber-300 pl-4">
                      <p className="font-semibold text-amber-800 text-sm">Savings Rate: 15-20% Target</p>
                      <p className="text-amber-700 text-xs leading-relaxed">
                        Savings rate represents the percentage of income allocated to investments, retirement accounts, and 
                        emergency funds. Financial experts recommend minimum 15% savings rates, with 20%+ rates enabling 
                        accelerated wealth building and early retirement options.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-300 pl-4">
                      <p className="font-semibold text-red-800 text-sm">Debt-to-Income Ratio: Below 36%</p>
                      <p className="text-red-700 text-xs leading-relaxed">
                        Total monthly debt payments (excluding mortgage) should remain below 20% of gross income, with 
                        total debt including mortgage below 36%. Higher ratios indicate potential financial stress and 
                        reduced borrowing capacity for future needs.
                      </p>
                    </div>

                    <div className="border-l-4 border-indigo-300 pl-4">
                      <p className="font-semibold text-indigo-800 text-sm">Housing Costs: Maximum 30%</p>
                      <p className="text-indigo-700 text-xs leading-relaxed">
                        Housing expenses including rent/mortgage, utilities, insurance, and maintenance should not exceed 
                        30% of gross income. Lower ratios provide greater financial flexibility and emergency preparedness.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">Emergency Fund & Risk Management</h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Emergency funds represent 3-6 months of essential expenses in readily accessible accounts. This safety net 
                    prevents debt accumulation during income interruptions, medical emergencies, or unexpected major expenses. 
                    Calculate emergency fund requirements using your budget's housing, utilities, food, and minimum debt payments.
                  </p>
                  
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="font-semibold text-yellow-800 text-sm">Quick Emergency Fund Calculator</p>
                    <p className="text-yellow-700 text-xs leading-relaxed">
                      Essential monthly expenses × 3-6 months = Target emergency fund. Include housing, utilities, food, 
                      transportation, insurance, and minimum debt payments. Exclude discretionary spending like entertainment 
                      and dining out, as these can be eliminated during emergencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Budgeting Methods Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Proven Budgeting Methods & Implementation Strategies</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Zero-Based Budgeting
                </h4>
                <p className="text-blue-700 text-sm leading-relaxed mb-3">
                  Assign every dollar of income to specific categories, ensuring income minus expenses equals zero. 
                  This method maximizes financial awareness and eliminates "leftover" money that typically gets spent carelessly.
                </p>
                <div className="text-xs text-blue-600 space-y-1">
                  <p><strong>Best for:</strong> Detail-oriented individuals</p>
                  <p><strong>Time required:</strong> 2-3 hours monthly</p>
                  <p><strong>Success rate:</strong> 85% for consistent users</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Envelope Method (Digital)
                </h4>
                <p className="text-green-700 text-sm leading-relaxed mb-3">
                  Allocate monthly income into virtual "envelopes" for each expense category. When an envelope is empty, 
                  spending in that category stops until the next month, enforcing strict spending discipline.
                </p>
                <div className="text-xs text-green-600 space-y-1">
                  <p><strong>Best for:</strong> Overspenders and beginners</p>
                  <p><strong>Time required:</strong> 1 hour monthly</p>
                  <p><strong>Success rate:</strong> 90% for spending control</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pay Yourself First
                </h4>
                <p className="text-purple-700 text-sm leading-relaxed mb-3">
                  Automatically transfer savings and investments before paying any expenses. This method prioritizes 
                  long-term wealth building and ensures consistent progress toward financial goals regardless of spending habits.
                </p>
                <div className="text-xs text-purple-600 space-y-1">
                  <p><strong>Best for:</strong> Wealth builders and savers</p>
                  <p><strong>Time required:</strong> 30 minutes setup</p>
                  <p><strong>Success rate:</strong> 95% with automation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Category Deep Dive */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Expense Category Optimization Guide</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Housing & Utilities Strategy
                  </h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Housing typically represents 25-30% of total income, making it the largest expense category for most households. 
                    Strategic housing decisions significantly impact overall financial health and wealth-building capacity.
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Consider house hacking (renting rooms) to reduce costs</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Negotiate utility rates and use energy-efficient appliances</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Refinance mortgages when rates drop significantly</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Budget for maintenance: 1-3% of home value annually</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Car className="h-5 w-5 text-purple-600" />
                    Transportation Optimization
                  </h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Transportation costs including car payments, insurance, fuel, and maintenance should remain below 15-20% 
                    of income. Smart transportation choices can free up significant funds for savings and investments.
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Buy reliable used cars to avoid depreciation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Shop insurance annually for better rates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Consider public transport in urban areas</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Regular maintenance prevents expensive repairs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-yellow-600" />
                    Food & Living Expenses
                  </h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Food expenses offer significant optimization potential through meal planning, bulk purchasing, and 
                    cooking at home. The average American household spends $7,700+ annually on food, with substantial 
                    savings possible through strategic shopping and meal preparation.
                  </p>
                  
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="font-semibold text-yellow-800 text-sm">Cost-Cutting Strategies:</p>
                    <ul className="text-yellow-700 text-xs space-y-1 mt-2">
                      <li>• Meal planning saves 20-30% on groceries</li>
                      <li>• Cooking at home costs 60% less than dining out</li>
                      <li>• Generic brands offer 25-40% savings</li>
                      <li>• Bulk buying reduces per-unit costs by 15-20%</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Savings & Investment Priorities
                  </h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Building wealth requires systematic saving and investing across multiple account types. Prioritize 
                    tax-advantaged accounts and employer matching programs to maximize returns and minimize tax obligations.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-2 bg-green-50 rounded text-sm">
                      <p className="font-semibold text-green-800">Priority Order:</p>
                      <ol className="text-green-700 text-xs space-y-1 mt-1 ml-4">
                        <li>1. Emergency fund (3-6 months expenses)</li>
                        <li>2. Employer 401(k) match (free money)</li>
                        <li>3. High-interest debt elimination</li>
                        <li>4. IRA or Roth IRA (annual limits)</li>
                        <li>5. Additional 401(k) contributions</li>
                        <li>6. Taxable investment accounts</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Budgeting Mistakes & Solutions */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Common Budgeting Mistakes & Solutions</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-4 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Frequent Budget Pitfalls
                </h4>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="font-semibold text-red-800 text-sm">Underestimating Irregular Expenses</p>
                    <p className="text-red-700 text-xs leading-relaxed mt-1">
                      Car maintenance, annual insurance payments, and holiday gifts create budget shortfalls. 
                      Solution: Track annual irregular expenses and divide by 12 for monthly allocation.
                    </p>
                  </div>

                  <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="font-semibold text-red-800 text-sm">Perfectionism Paralysis</p>
                    <p className="text-red-700 text-xs leading-relaxed mt-1">
                      Waiting for perfect budget categories and amounts prevents starting. 
                      Solution: Begin with rough estimates and refine over 2-3 months of real spending data.
                    </p>
                  </div>

                  <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="font-semibold text-red-800 text-sm">Ignoring Small Expenses</p>
                    <p className="text-red-700 text-xs leading-relaxed mt-1">
                      Coffee purchases, app subscriptions, and convenience fees accumulate significantly. 
                      Solution: Track all expenses for one month to identify spending patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Budget Success Strategies
                </h4>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <p className="font-semibold text-green-800 text-sm">Automate Everything Possible</p>
                    <p className="text-green-700 text-xs leading-relaxed mt-1">
                      Set up automatic transfers for savings, investments, and bill payments. Automation removes 
                      willpower from financial decisions and ensures consistent progress toward goals.
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <p className="font-semibold text-green-800 text-sm">Review and Adjust Monthly</p>
                    <p className="text-green-700 text-xs leading-relaxed mt-1">
                      Schedule monthly budget reviews to compare actual spending against planned amounts. 
                      Adjust categories based on real spending patterns and changing life circumstances.
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <p className="font-semibold text-green-800 text-sm">Build in Fun Money</p>
                    <p className="text-green-700 text-xs leading-relaxed mt-1">
                      Allocate 5-10% of income for guilt-free spending on personal enjoyment. This prevents 
                      budget rebellion and maintains long-term adherence to financial plans.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Tips & Statistics */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Advanced Budget Optimization & Financial Statistics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-3">Income Optimization</h4>
                <div className="text-sm text-indigo-700 space-y-2">
                  <p>• Side hustles can increase income by 20-40%</p>
                  <p>• Skill development ROI: 10-25% salary increases</p>
                  <p>• Investment income compounds at 7-10% annually</p>
                  <p>• Tax optimization saves 15-30% on taxes</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-3">Wealth Building Statistics</h4>
                <div className="text-sm text-purple-700 space-y-2">
                  <p>• 20% savings rate enables retirement by age 65</p>
                  <p>• 50% savings rate enables retirement by age 50</p>
                  <p>• Emergency funds prevent 75% of debt accumulation</p>
                  <p>• Budgeters accumulate 15% more wealth annually</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-3">Behavior Psychology</h4>
                <div className="text-sm text-amber-700 space-y-2">
                  <p>• Automation increases success rates by 40%</p>
                  <p>• Written goals are achieved 60% more often</p>
                  <p>• Monthly reviews improve outcomes by 25%</p>
                  <p>• Social accountability doubles success rates</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Implementation Timeline for New Budgeters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-blue-800">Week 1</p>
                  <p className="text-gray-600 text-xs">Track all expenses, gather financial documents</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-green-800">Week 2</p>
                  <p className="text-gray-600 text-xs">Create budget categories, set up accounts</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-purple-800">Week 3</p>
                  <p className="text-gray-600 text-xs">Implement automation, start envelope method</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-amber-800">Week 4</p>
                  <p className="text-gray-600 text-xs">Review results, adjust categories, optimize</p>
                </div>
              </div>
            </div>

            {/* Financial Psychology & Long-term Wealth Building */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">Financial Psychology & Long-Term Wealth Building Strategies</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">The Psychology of Money Management</h4>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                    Successful budgeting extends beyond mathematical calculations to encompass behavioral psychology and emotional 
                    relationships with money. Research in behavioral economics reveals that humans consistently make predictable 
                    financial mistakes due to cognitive biases, emotional spending triggers, and social pressures. Understanding 
                    these psychological factors enables more effective budget design and long-term financial success.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50 rounded border-l-4 border-indigo-400">
                      <p className="font-semibold text-indigo-800 text-sm">Loss Aversion & Spending Habits</p>
                      <p className="text-indigo-700 text-xs leading-relaxed mt-1">
                        People feel losses twice as intensely as equivalent gains, leading to poor financial decisions. 
                        Combat this by framing savings as "paying yourself first" rather than "giving up" discretionary spending.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-rose-50 rounded border-l-4 border-rose-400">
                      <p className="font-semibold text-rose-800 text-sm">Present Bias & Future Planning</p>
                      <p className="text-rose-700 text-xs leading-relaxed mt-1">
                        Humans naturally prioritize immediate gratification over future benefits. Automate savings and 
                        investments to bypass this bias and ensure consistent progress toward long-term financial goals.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Advanced Wealth Building Techniques</h4>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                    Beyond basic budgeting lies advanced wealth building through strategic tax optimization, investment 
                    diversification, and compound interest maximization. These techniques can accelerate financial independence 
                    by decades when implemented consistently within a well-structured budget framework.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                      <p className="font-semibold text-emerald-800 text-sm">Tax-Advantaged Account Laddering</p>
                      <p className="text-emerald-700 text-xs leading-relaxed mt-1">
                        Strategically contribute to 401(k), IRA, HSA, and taxable accounts to optimize tax efficiency 
                        across different life phases. This approach can save $100,000+ in taxes over a career.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="font-semibold text-blue-800 text-sm">Geographic Arbitrage Opportunities</p>
                      <p className="text-blue-700 text-xs leading-relaxed mt-1">
                        Living in lower-cost areas while earning higher salaries can dramatically accelerate wealth building. 
                        Remote work enables this strategy, potentially reducing living costs by 30-50%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Industry-Specific Budgeting Considerations */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Industry-Specific Budgeting Considerations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-100 rounded-lg border border-cyan-200">
                    <h5 className="font-semibold text-cyan-800 mb-2">Freelancers & Gig Workers</h5>
                    <div className="text-cyan-700 text-xs space-y-1">
                      <p>• Set aside 25-30% for taxes quarterly</p>
                      <p>• Build 6-month emergency funds due to income volatility</p>
                      <p>• Track business expenses for tax deductions</p>
                      <p>• Consider seasonal income fluctuations</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border border-amber-200">
                    <h5 className="font-semibold text-amber-800 mb-2">High-Income Professionals</h5>
                    <div className="text-amber-700 text-xs space-y-1">
                      <p>• Maximize tax-advantaged contributions ($23,000 401k)</p>
                      <p>• Consider backdoor Roth IRA strategies</p>
                      <p>• Implement tax-loss harvesting</p>
                      <p>• Plan for alternative minimum tax implications</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-800 mb-2">Recent Graduates</h5>
                    <div className="text-purple-700 text-xs space-y-1">
                      <p>• Prioritize employer 401(k) match immediately</p>
                      <p>• Consider income-driven student loan repayment</p>
                      <p>• Start small with $25-50 monthly investments</p>
                      <p>• Build credit history with responsible usage</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technology Integration & Modern Tools */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-slate-100 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Technology Integration & Modern Budgeting Tools
                </h4>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  Modern budgeting leverages technology for enhanced accuracy, automation, and real-time insights. 
                  Artificial intelligence and machine learning algorithms can predict spending patterns, identify 
                  optimization opportunities, and provide personalized financial recommendations based on millions 
                  of anonymized data points from similar demographic and income profiles.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-800 text-sm">Essential Digital Tools</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Bank account aggregation for automatic categorization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Bill reminder systems preventing late fees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Investment portfolio rebalancing alerts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Credit score monitoring with improvement suggestions</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-800 text-sm">Advanced Analytics Benefits</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        <span>Predictive spending analysis prevents budget overruns</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        <span>Tax optimization suggestions throughout the year</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        <span>Retirement planning with multiple scenario modeling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        <span>Insurance needs analysis based on life changes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetCalculatorComponent;
