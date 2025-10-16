import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Percent,
  Home,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Info
} from 'lucide-react';

interface MortgageInputs {
  principal: number;
  downPayment: number;
  rate: number;
  years: number;
  propertyTax: number; // Annual property tax as percentage of home value
  homeInsurance: number; // Annual home insurance in dollars
  pmiRate: number; // PMI rate as percentage
  hoaFee: number; // Monthly HOA fee in dollars
  otherCosts: number; // Annual other costs in dollars
}

interface MortgageResults {
  homePrice: number;
  loanAmount: number;
  downPayment: number;
  monthlyPI: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  monthlyHOA: number;
  monthlyOther: number;
  totalMonthlyPayment: number;
  totalInterest: number;
  totalPayments: number;
  payoffDate: Date;
  error?: string;
}

interface AmortizationPayment {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  totalInterest: number;
  remainingBalance: number;
  date: string;
}

interface ChartDataPoint {
  year: number;
  balance: number;
  totalInterest: number;
  payment: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const MortgageCalculatorComponent = () => {
  const [inputs, setInputs] = useState<MortgageInputs>({
    principal: 400000,
    downPayment: 20,
    rate: 6.5,
    years: 30,
    propertyTax: 1.2, // 1.2% annual property tax
    homeInsurance: 1200, // $1200 annual insurance
    pmiRate: 0.5, // 0.5% PMI rate
    hoaFee: 0, // $0 monthly HOA
    otherCosts: 0 // $0 annual other costs
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [includeTaxesAndCosts, setIncludeTaxesAndCosts] = useState(true);
  const [downPaymentType, setDownPaymentType] = useState<'percentage' | 'amount'>('percentage');
  const [startDate, setStartDate] = useState(new Date());
  
  const [results, setResults] = useState<MortgageResults>({} as MortgageResults);
  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationPayment[]>([]);
  const [scheduleView, setScheduleView] = useState<'monthly' | 'annual'>('monthly');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Extra Payment States
  const [showBiweeklyResults, setShowBiweeklyResults] = useState(false);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
  const [extraYearlyPayment, setExtraYearlyPayment] = useState(0);
  const [extraOneTimePayment, setExtraOneTimePayment] = useState(0);
  const [oneTimePaymentMonth, setOneTimePaymentMonth] = useState('Oct');
  const [oneTimePaymentYear, setOneTimePaymentYear] = useState(2025);
  
  // Annual Increase States
  const [propertyTaxIncrease, setPropertyTaxIncrease] = useState(0);
  const [homeInsuranceIncrease, setHomeInsuranceIncrease] = useState(0);
  const [hoaFeeIncrease, setHoaFeeIncrease] = useState(0);
  const [otherCostsIncrease, setOtherCostsIncrease] = useState(0);
  
  // Additional One-Time Payments
  const [additionalOneTimePayments, setAdditionalOneTimePayments] = useState<Array<{amount: number, month: string, year: number}>>([]);

  // Enhanced mortgage calculation with extra payments and annual increases
  const calculateMortgageWithExtras = (inputs: MortgageInputs): MortgageResults => {
    // Input validation
    const {
      principal: homePrice,
      downPayment,
      rate,
      years,
      propertyTax,
      homeInsurance,
      pmiRate,
      hoaFee,
      otherCosts
    } = inputs;

    // Validation checks
    if (homePrice <= 0 || downPayment < 0 || rate < 0 || years <= 0) {
      throw new Error('Invalid input values');
    }

    const actualDownPayment = downPaymentType === 'percentage' 
      ? (homePrice * downPayment / 100) 
      : downPayment;
    const loanAmount = homePrice - actualDownPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    
    // Calculate base monthly payment (Principal & Interest) using standard amortization formula
    let baseMonthlyPI = 0;
    if (rate === 0) {
      baseMonthlyPI = loanAmount / numPayments;
    } else {
      baseMonthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    // Calculate CORRECT additional monthly costs
    let monthlyPropertyTax = (homePrice * propertyTax / 100) / 12; // Percentage of home value annually ÷ 12
    let monthlyInsurance = homeInsurance / 12; // Annual insurance ÷ 12
    const monthlyPMI = (actualDownPayment / homePrice < 0.2) ? (loanAmount * pmiRate / 100) / 12 : 0; // PMI if down payment < 20%
    let monthlyHOA = hoaFee; // Already monthly
    let monthlyOther = otherCosts / 12; // Annual other costs ÷ 12

    // Simulate payment schedule with extra payments and annual increases
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalPrincipalAndInterest = 0;
    let totalTaxesAndCosts = 0;
    let monthCount = 0;
    const currentYear = new Date().getFullYear();
    const maxPayments = numPayments * 2; // Safety limit
    
    // Helper function to convert month name to number
    function getMonthNumber(monthName: string): number {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(monthName);
    }
    
    while (remainingBalance > 0.01 && monthCount < maxPayments) {
      const currentMonth = monthCount % 12;
      const paymentYear = Math.floor(monthCount / 12);
      
      // Apply annual increases each January (month 0) after first year
      if (currentMonth === 0 && paymentYear > 0) {
        monthlyPropertyTax *= (1 + Math.min(propertyTaxIncrease, 20) / 100); // Cap at 20% increase
        monthlyInsurance *= (1 + Math.min(homeInsuranceIncrease, 20) / 100);
        monthlyHOA *= (1 + Math.min(hoaFeeIncrease, 20) / 100);
        monthlyOther *= (1 + Math.min(otherCostsIncrease, 20) / 100);
      }
      
      // Calculate interest for this month
      const interestPayment = remainingBalance * monthlyRate;
      
      // Calculate base principal payment
      let principalPayment = baseMonthlyPI - interestPayment;
      
      // Add extra payments
      let extraPaymentThisMonth = extraMonthlyPayment;
      
      // Add extra yearly payment (in January after first year)
      if (currentMonth === 0 && paymentYear > 0) {
        extraPaymentThisMonth += extraYearlyPayment;
      }
      
      // Add one-time payment if applicable
      const paymentDate = new Date(currentYear + paymentYear, currentMonth);
      const oneTimeDate = new Date(oneTimePaymentYear, getMonthNumber(oneTimePaymentMonth));
      if (paymentDate.getFullYear() === oneTimeDate.getFullYear() && 
          paymentDate.getMonth() === oneTimeDate.getMonth()) {
        extraPaymentThisMonth += extraOneTimePayment;
      }
      
      // Add additional one-time payments
      additionalOneTimePayments.forEach(payment => {
        const additionalDate = new Date(payment.year, getMonthNumber(payment.month));
        if (paymentDate.getFullYear() === additionalDate.getFullYear() && 
            paymentDate.getMonth() === additionalDate.getMonth()) {
          extraPaymentThisMonth += payment.amount;
        }
      });
      
      // Add extra payments to principal
      principalPayment += extraPaymentThisMonth;
      
      // Ensure we don't overpay
      if (principalPayment > remainingBalance) {
        principalPayment = remainingBalance;
      }
      
      if (principalPayment <= 0) break;
      
      // Update balances
      remainingBalance -= principalPayment;
      totalInterest += interestPayment;
      totalPrincipalAndInterest += (baseMonthlyPI + extraPaymentThisMonth);
      
      // PMI is removed when remaining balance is 80% or less of original home value
      const currentPMI = (remainingBalance / homePrice <= 0.8) ? 0 : monthlyPMI;
      
      totalTaxesAndCosts += (monthlyPropertyTax + monthlyInsurance + currentPMI + monthlyHOA + monthlyOther);
      monthCount++;
      
      if (remainingBalance <= 0.01) break;
    }

    // Calculate final values INCLUDING all extra payments and increases
    const finalMonthlyPI = baseMonthlyPI + extraMonthlyPayment;
    
    // Calculate CURRENT monthly costs with potential increases applied
    let currentMonthlyPropertyTax = (homePrice * propertyTax / 100) / 12;
    let currentMonthlyInsurance = homeInsurance / 12;
    let currentMonthlyOther = otherCosts / 12;
    let currentMonthlyHOA = monthlyHOA;
    
    // Apply annual increases to current year (if any increases are set)
    if (propertyTaxIncrease > 0) {
      currentMonthlyPropertyTax *= Math.pow(1 + propertyTaxIncrease / 100, 1); // Show first year increase
    }
    if (homeInsuranceIncrease > 0) {
      currentMonthlyInsurance *= Math.pow(1 + homeInsuranceIncrease / 100, 1);
    }
    if (hoaFeeIncrease > 0) {
      currentMonthlyHOA *= Math.pow(1 + hoaFeeIncrease / 100, 1);
    }
    if (otherCostsIncrease > 0) {
      currentMonthlyOther *= Math.pow(1 + otherCostsIncrease / 100, 1);
    }
    
    // Calculate total monthly payment INCLUDING all extras and increases
    const totalMonthlyWithExtras = finalMonthlyPI + currentMonthlyPropertyTax + currentMonthlyInsurance + monthlyPMI + currentMonthlyHOA + currentMonthlyOther;
    
    // Add estimated impact of yearly and one-time payments to total payments
    const estimatedYearlyPaymentImpact = extraYearlyPayment * Math.max(1, Math.floor(monthCount / 12));
    const estimatedOneTimePaymentImpact = extraOneTimePayment;
    const estimatedAdditionalOneTimeImpact = additionalOneTimePayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const adjustedTotalPayments = totalPrincipalAndInterest + totalTaxesAndCosts + estimatedYearlyPaymentImpact + estimatedOneTimePaymentImpact + estimatedAdditionalOneTimeImpact;
    
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + monthCount);

    // Precision rounding helper
    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      homePrice,
      loanAmount,
      downPayment: actualDownPayment,
      monthlyPI: round(finalMonthlyPI),
      monthlyPropertyTax: round(currentMonthlyPropertyTax),
      monthlyInsurance: round(currentMonthlyInsurance),
      monthlyPMI: round(monthlyPMI),
      monthlyHOA: round(currentMonthlyHOA),
      monthlyOther: round(currentMonthlyOther),
      totalMonthlyPayment: round(totalMonthlyWithExtras),
      totalInterest: round(totalInterest),
      totalPayments: round(adjustedTotalPayments),
      payoffDate
    };
  };

  // Standard mortgage calculation (fallback/comparison)
  const calculateMortgage = (inputs: MortgageInputs): MortgageResults => {
    const {
      principal: homePrice,
      downPayment,
      rate,
      years,
      propertyTax,
      homeInsurance,
      pmiRate,
      hoaFee,
      otherCosts
    } = inputs;

    // Input validation
    if (homePrice <= 0 || downPayment < 0 || rate < 0 || years <= 0) {
      throw new Error('Invalid input values');
    }

    const actualDownPayment = downPaymentType === 'percentage' 
      ? (homePrice * downPayment / 100) 
      : downPayment;
    const loanAmount = homePrice - actualDownPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    
    // Calculate monthly payment (Principal & Interest)
    let monthlyPI = 0;
    if (rate === 0) {
      monthlyPI = loanAmount / numPayments;
    } else {
      monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    // Calculate additional monthly costs - CORRECTED FORMULAS
    const monthlyPropertyTax = (homePrice * propertyTax / 100) / 12; // Percentage annually ÷ 12
    const monthlyInsurance = homeInsurance / 12; // Annual insurance ÷ 12
    const monthlyPMI = (actualDownPayment / homePrice < 0.2) ? (loanAmount * pmiRate / 100) / 12 : 0;
    const monthlyHOA = hoaFee; // Already monthly
    const monthlyOther = otherCosts / 12; // Annual other costs ÷ 12

    const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + 
                               monthlyPMI + monthlyHOA + monthlyOther;

    const totalInterest = (monthlyPI * numPayments) - loanAmount;
    const totalPayments = totalMonthlyPayment * numPayments;

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      homePrice,
      loanAmount,
      downPayment: actualDownPayment,
      monthlyPI: round(monthlyPI),
      monthlyPropertyTax: round(monthlyPropertyTax),
      monthlyInsurance: round(monthlyInsurance),
      monthlyPMI: round(monthlyPMI),
      monthlyHOA: round(monthlyHOA),
      monthlyOther: round(monthlyOther),
      totalMonthlyPayment: round(totalMonthlyPayment),
      totalInterest: round(totalInterest),
      totalPayments: round(totalPayments),
      payoffDate: new Date(Date.now() + (years * 365.25 * 24 * 60 * 60 * 1000))
    };
  };

  // Enhanced amortization schedule with extra payments
  const generateAmortizationSchedule = (inputs: MortgageInputs): AmortizationPayment[] => {
    const { principal: homePrice, downPayment, rate, years } = inputs;
    const loanAmount = homePrice - downPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    
    let baseMonthlyPI = 0;
    if (rate === 0) {
      baseMonthlyPI = loanAmount / numPayments;
    } else {
      baseMonthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const schedule: AmortizationPayment[] = [];
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let monthCount = 0;
    const currentYear = new Date().getFullYear();

    while (remainingBalance > 0.01 && monthCount < numPayments * 2) {
      const currentMonth = monthCount % 12;
      const paymentYear = Math.floor(monthCount / 12);
      
      // Calculate interest payment
      const interestPayment = remainingBalance * monthlyRate;
      
      // Calculate principal payment with extras
      let principalPayment = baseMonthlyPI - interestPayment;
      let extraPayment = 0;
      
      // Add extra monthly payment
      extraPayment += extraMonthlyPayment;
      
      // Add extra yearly payment (in January)
      if (currentMonth === 0 && paymentYear > 0) {
        extraPayment += extraYearlyPayment;
      }
      
      // Add one-time payment if applicable
      const paymentDate = new Date(currentYear + paymentYear, currentMonth);
      const oneTimeDate = new Date(oneTimePaymentYear, getMonthNumber(oneTimePaymentMonth));
      if (paymentDate.getFullYear() === oneTimeDate.getFullYear() && 
          paymentDate.getMonth() === oneTimeDate.getMonth()) {
        extraPayment += extraOneTimePayment;
      }
      
      // Add additional one-time payments
      additionalOneTimePayments.forEach(payment => {
        const additionalDate = new Date(payment.year, getMonthNumber(payment.month));
        if (paymentDate.getFullYear() === additionalDate.getFullYear() && 
            paymentDate.getMonth() === additionalDate.getMonth()) {
          extraPayment += payment.amount;
        }
      });
      
      principalPayment += extraPayment;
      
      // Ensure we don't overpay
      if (principalPayment > remainingBalance) {
        principalPayment = remainingBalance;
      }
      
      if (principalPayment <= 0) break;
      
      remainingBalance -= principalPayment;
      totalInterest += interestPayment;
      monthCount++;

      if (remainingBalance < 0.01) remainingBalance = 0;

      schedule.push({
        month: monthCount,
        year: Math.ceil(monthCount / 12),
        payment: baseMonthlyPI + extraPayment,
        principal: principalPayment,
        interest: interestPayment,
        totalInterest,
        remainingBalance,
        date: new Date(currentYear, monthCount - 1, 1).toLocaleDateString()
      });
      
      if (remainingBalance <= 0.01) break;
    }

    // Helper function to convert month name to number
    function getMonthNumber(monthName: string): number {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(monthName);
    }

    return schedule;
  };

  // Enhanced chart data generation with better responsiveness
  const generateChartData = (schedule: AmortizationPayment[]): ChartDataPoint[] => {
    if (schedule.length === 0) return [];
    
    // Get data points at key intervals for better chart visualization
    const dataPoints: ChartDataPoint[] = [];
    const totalPayments = schedule.length;
    const step = Math.max(1, Math.floor(totalPayments / 50)); // Maximum 50 data points
    
    for (let i = 0; i < totalPayments; i += step) {
      const payment = schedule[i];
      dataPoints.push({
        year: Math.round((i + 1) / 12 * 10) / 10, // More precise year display
        balance: Math.round(payment.remainingBalance),
        totalInterest: Math.round(payment.totalInterest),
        payment: Math.round(payment.payment)
      });
    }
    
    // Always include the last payment
    if (totalPayments > 0) {
      const lastPayment = schedule[totalPayments - 1];
      dataPoints.push({
        year: Math.round(totalPayments / 12 * 10) / 10,
        balance: Math.round(lastPayment.remainingBalance),
        totalInterest: Math.round(lastPayment.totalInterest),
        payment: Math.round(lastPayment.payment)
      });
    }
    
    return dataPoints;
  };

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2  // Show cents for accurate monthly breakdowns
    }).format(value || 0);
  };

  // Format percentage
  const formatPercent = (value: number | undefined): string => {
    return `${(value || 0).toFixed(2)}%`;
  };

  // Enhanced pie chart data showing ALL payments including extras and increases
  const pieData: PieDataPoint[] = [
    { name: 'Principal & Interest (Base)', value: results.monthlyPI ? (results.monthlyPI - extraMonthlyPayment) : 0, color: '#3B82F6' },
    { name: 'Extra Monthly Payment', value: extraMonthlyPayment, color: '#1E40AF' },
    { name: 'Property Tax', value: results.monthlyPropertyTax || 0, color: '#10B981' },
    { name: 'Home Insurance', value: results.monthlyInsurance || 0, color: '#F59E0B' },
    { name: 'PMI', value: results.monthlyPMI || 0, color: '#EF4444' },
    { name: 'HOA Fees', value: results.monthlyHOA || 0, color: '#8B5CF6' },
    { name: 'Other Costs', value: results.monthlyOther || 0, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // Calculate summary values that include ALL extra payments
  const monthlyPaymentWithAllExtras = (results.monthlyPI || 0) + (results.monthlyPropertyTax || 0) + (results.monthlyInsurance || 0) + (results.monthlyPMI || 0) + (results.monthlyHOA || 0) + (results.monthlyOther || 0);
  
  // Estimated annual extra payments impact
  const annualExtraPaymentsImpact = (extraYearlyPayment || 0) + (additionalOneTimePayments.reduce((sum, payment) => sum + payment.amount, 0));
  
  // Add annual impact note for display
  const extraPaymentsSummary = {
    monthlyExtra: extraMonthlyPayment,
    yearlyExtra: extraYearlyPayment,
    oneTimeExtra: extraOneTimePayment,
    additionalOneTimeTotal: additionalOneTimePayments.reduce((sum, payment) => sum + payment.amount, 0),
    totalAnnualExtras: annualExtraPaymentsImpact
  };

  // Function to update additional one-time payment with immediate recalculation
  const updateAdditionalOneTimePayment = (index: number, field: string, value: any) => {
    const updatedPayments = [...additionalOneTimePayments];
    updatedPayments[index] = { ...updatedPayments[index], [field]: value };
    setAdditionalOneTimePayments(updatedPayments);
    // IMMEDIATE recalculation
    setTimeout(recalculateAll, 1);
  };

  // Function to remove additional one-time payment with immediate recalculation
  const removeAdditionalOneTimePayment = (index: number) => {
    const updatedPayments = additionalOneTimePayments.filter((_, i) => i !== index);
    setAdditionalOneTimePayments(updatedPayments);
    // IMMEDIATE recalculation
    setTimeout(recalculateAll, 1);
  };

  // Function to add additional one-time payment with immediate recalculation
  const addAdditionalOneTimePayment = () => {
    const newPayment = {
      amount: 0,
      month: 'Oct',
      year: new Date().getFullYear()
    };
    setAdditionalOneTimePayments([...additionalOneTimePayments, newPayment]);
    // IMMEDIATE recalculation
    setTimeout(recalculateAll, 1);
  };

  // Function to recalculate everything - CALLED IMMEDIATELY when any input changes
  const recalculateAll = () => {
    try {
      const calculationResults = calculateMortgageWithExtras(inputs);
      setResults(calculationResults);
      
      const schedule = generateAmortizationSchedule(inputs);
      setAmortizationSchedule(schedule);
      
      const chartData = generateChartData(schedule);
      setChartData(chartData);
    } catch (error) {
      console.error('Calculation error:', error);
      setResults({ 
        ...{} as MortgageResults,
        error: 'Please check your inputs and try again.' 
      });
    }
  };

  // Enhanced input validation and change handler
  const handleInputChange = (id: keyof MortgageInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    // Input validation with bounds
    const validatedValue = (() => {
      switch (id) {
        case 'principal':
          return Math.max(0, Math.min(numValue, 10000000)); // $0 to $10M
        case 'downPayment':
          return downPaymentType === 'percentage' 
            ? Math.max(0, Math.min(numValue, 100)) // 0% to 100%
            : Math.max(0, Math.min(numValue, inputs.principal)); // $0 to home price
        case 'rate':
          return Math.max(0, Math.min(numValue, 30)); // 0% to 30%
        case 'years':
          return Math.max(1, Math.min(numValue, 50)); // 1 to 50 years
        case 'propertyTax':
          return Math.max(0, Math.min(numValue, 10)); // 0% to 10%
        case 'homeInsurance':
          return Math.max(0, Math.min(numValue, 50000)); // $0 to $50K annually
        case 'pmiRate':
          return Math.max(0, Math.min(numValue, 3)); // 0% to 3%
        case 'hoaFee':
          return Math.max(0, Math.min(numValue, 2000)); // $0 to $2K monthly
        case 'otherCosts':
          return Math.max(0, Math.min(numValue, 20000)); // $0 to $20K annually
        default:
          return numValue;
      }
    })();
    
    const newInputs = { ...inputs, [id]: validatedValue };
    setInputs(newInputs);
    
    // IMMEDIATE recalculation
    setTimeout(() => {
      try {
        const calculationResults = calculateMortgageWithExtras(newInputs);
        setResults(calculationResults);
        
        const schedule = generateAmortizationSchedule(newInputs);
        setAmortizationSchedule(schedule);
        
        const chartData = generateChartData(schedule);
        setChartData(chartData);
      } catch (error) {
        console.error('Calculation error:', error);
        setResults({ 
          ...{} as MortgageResults,
          error: 'Please check your inputs and try again.' 
        });
      }
    }, 1);
  };

  // Handle extra payment changes with IMMEDIATE recalculation
  const handleExtraPaymentChange = (type: string, value: number) => {
    switch (type) {
      case 'monthly':
        setExtraMonthlyPayment(Math.max(0, Math.min(value, 10000)));
        break;
      case 'yearly':
        setExtraYearlyPayment(Math.max(0, Math.min(value, 100000)));
        break;
      case 'oneTime':
        setExtraOneTimePayment(Math.max(0, Math.min(value, 500000)));
        break;
    }
    // IMMEDIATE recalculation
    setTimeout(recalculateAll, 1);
  };

  // Handle annual increase changes with IMMEDIATE recalculation
  const handleAnnualIncreaseChange = (type: string, value: number) => {
    const validatedValue = Math.max(0, Math.min(value, 20)); // 0% to 20%
    switch (type) {
      case 'propertyTax':
        setPropertyTaxIncrease(validatedValue);
        break;
      case 'homeInsurance':
        setHomeInsuranceIncrease(validatedValue);
        break;
      case 'hoaFee':
        setHoaFeeIncrease(validatedValue);
        break;
      case 'otherCosts':
        setOtherCostsIncrease(validatedValue);
        break;
    }
    // IMMEDIATE recalculation
    setTimeout(recalculateAll, 1);
  };

  // Initialize calculations only
  useEffect(() => {
    recalculateAll();
  }, []);

  // Backup recalculation for state changes (with debouncing)
  useEffect(() => {
    const timer = setTimeout(recalculateAll, 100);
    return () => clearTimeout(timer);
  }, [
    inputs, 
    extraMonthlyPayment, 
    extraYearlyPayment, 
    extraOneTimePayment, 
    oneTimePaymentMonth, 
    oneTimePaymentYear,
    propertyTaxIncrease, 
    homeInsuranceIncrease, 
    hoaFeeIncrease, 
    otherCostsIncrease,
    additionalOneTimePayments
  ]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Advanced Mortgage Calculator
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate your mortgage payment with comprehensive analysis including taxes, insurance, PMI, and detailed amortization schedules. 
            Get real-time calculations and interactive visualizations to make informed decisions.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">{/* Reduced gap for mobile */}
        {/* Modern Calculator Input Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
                Mortgage Calculator
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">Calculate your monthly mortgage payments</p>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">{/* Ensure mobile scrolling works within card */}
              {/* Home Price */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Home Price</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-3 sm:top-3.5 text-gray-500 font-medium text-sm">$</span>
                  <input
                    type="number"
                    value={inputs.principal}
                    onChange={(e) => handleInputChange('principal', e.target.value)}
                    className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-3 sm:py-3.5 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400 text-sm sm:text-base"
                    placeholder="400,000"
                  />
                </div>
              </div>

              {/* Down Payment */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Down Payment</label>
                <div className="flex rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                  <input
                    type="number"
                    value={inputs.downPayment}
                    onChange={(e) => handleInputChange('downPayment', e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-3 sm:py-3.5 border-0 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400 text-sm sm:text-base"
                    placeholder="20"
                  />
                  <select
                    value={downPaymentType}
                    onChange={(e) => setDownPaymentType(e.target.value as 'percentage' | 'amount')}
                    className="px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border-0 text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">$</option>
                  </select>
                </div>
              </div>

              {/* Loan Term */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Loan Term</label>
                <div className="relative">
                  <input
                    type="number"
                    value={inputs.years}
                    onChange={(e) => handleInputChange('years', e.target.value)}
                    list="loan-terms"
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 pr-14 sm:pr-16 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400 text-sm sm:text-base"
                    placeholder="30"
                    min="1"
                    max="50"
                  />
                  <datalist id="loan-terms">
                    <option value="15" />
                    <option value="20" />
                    <option value="25" />
                    <option value="30" />
                  </datalist>
                  <span className="absolute right-3 sm:right-4 top-3 sm:top-3.5 text-gray-500 font-medium text-sm">years</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Interest Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.rate}
                    onChange={(e) => handleInputChange('rate', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 pr-10 sm:pr-12 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400 text-sm sm:text-base"
                    placeholder="6.5"
                  />
                  <span className="absolute right-3 sm:right-4 top-3 sm:top-3.5 text-gray-500 font-medium text-sm">%</span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Start Date</label>
                <div className="flex rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                  <select
                    value={startDate.getMonth()}
                    onChange={(e) => {
                      const newDate = new Date(startDate);
                      newDate.setMonth(parseInt(e.target.value));
                      setStartDate(newDate);
                    }}
                    className="flex-1 px-3 sm:px-4 py-3 sm:py-3.5 bg-white border-0 text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base"
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={startDate.getFullYear()}
                    onChange={(e) => {
                      const newDate = new Date(startDate);
                      newDate.setFullYear(parseInt(e.target.value));
                      setStartDate(newDate);
                    }}
                    className="flex-1 px-3 sm:px-4 py-3 sm:py-3.5 border-0 text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base"
                    min="2020"
                    max="2050"
                  />
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">Include Taxes & Costs Below</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTaxesAndCosts}
                      onChange={(e) => setIncludeTaxesAndCosts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {includeTaxesAndCosts && (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Annual Tax & Cost</h4>
                      <div className="space-y-3">
                        {/* Property Tax */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Property Taxes</label>
                          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={inputs.propertyTax}
                              onChange={(e) => handleInputChange('propertyTax', e.target.value)}
                              className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="1.2"
                            />
                            <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                              <option>%</option>
                            </select>
                          </div>
                        </div>

                        {/* Home Insurance */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Home Insurance</label>
                          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <input
                              type="number"
                              value={inputs.homeInsurance}
                              onChange={(e) => handleInputChange('homeInsurance', e.target.value)}
                              className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="1,500"
                            />
                            <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                              <option>$</option>
                            </select>
                          </div>
                        </div>

                        {/* PMI Insurance */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">PMI Insurance</label>
                          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <input
                              type="number"
                              value={inputs.pmiRate}
                              onChange={(e) => handleInputChange('pmiRate', e.target.value)}
                              className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                              <option>$</option>
                            </select>
                          </div>
                        </div>

                        {/* HOA Fee */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">HOA Fee</label>
                          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <input
                              type="number"
                              value={inputs.hoaFee}
                              onChange={(e) => handleInputChange('hoaFee', e.target.value)}
                              className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                              <option>$</option>
                            </select>
                          </div>
                        </div>

                        {/* Other Costs */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Other Costs</label>
                          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <input
                              type="number"
                              value={inputs.otherCosts}
                              onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                              className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="4,000"
                            />
                            <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                              <option>$</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* More/Fewer Options Toggle */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                      >
                        {showAdvancedOptions ? '− Fewer Options' : '+ More Options'}
                      </button>
                    </div>

                    {/* Advanced Options - Annual Increases & Extra Payments */}
                    {showAdvancedOptions && (
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        {/* Annual Tax & Cost Increase */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Annual Tax & Cost Increase</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Property Taxes Increase</label>
                              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="20"
                                  value={propertyTaxIncrease}
                                  onChange={(e) => handleAnnualIncreaseChange('propertyTax', parseFloat(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                                <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                                  <option>%</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Home Insurance Increase</label>
                              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="20"
                                  value={homeInsuranceIncrease}
                                  onChange={(e) => handleAnnualIncreaseChange('homeInsurance', parseFloat(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                                <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                                  <option>%</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">HOA Fee Increase</label>
                              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="20"
                                  value={hoaFeeIncrease}
                                  onChange={(e) => handleAnnualIncreaseChange('hoaFee', parseFloat(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                                <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                                  <option>%</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Other Costs Increase</label>
                              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="20"
                                  value={otherCostsIncrease}
                                  onChange={(e) => handleAnnualIncreaseChange('otherCosts', parseFloat(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                                <select className="px-3 py-2.5 bg-gray-50 border-0 text-gray-700 text-sm">
                                  <option>%</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Extra Payments */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Extra Payments</h4>
                          <div className="space-y-3">
                            {/* Extra Monthly Pay */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Extra Monthly Pay</label>
                              <div className="flex gap-2">
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-1">
                                  <span className="px-3 py-2.5 bg-gray-50 text-gray-600 text-sm border-r border-gray-200">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={extraMonthlyPayment}
                                    onChange={(e) => handleExtraPaymentChange('monthly', parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                                <span className="text-xs text-gray-500 self-center whitespace-nowrap">from</span>
                                <select className="px-2 py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm">
                                  <option>Oct</option>
                                  <option>Nov</option>
                                  <option>Dec</option>
                                </select>
                                <input
                                  type="number"
                                  defaultValue={2025}
                                  className="w-16 px-2 py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm"
                                />
                              </div>
                            </div>

                            {/* Extra Yearly Pay */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Extra Yearly Pay</label>
                              <div className="flex gap-2">
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-1">
                                  <span className="px-3 py-2.5 bg-gray-50 text-gray-600 text-sm border-r border-gray-200">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100000"
                                    value={extraYearlyPayment}
                                    onChange={(e) => handleExtraPaymentChange('yearly', parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                                <span className="text-xs text-gray-500 self-center whitespace-nowrap">from</span>
                                <select className="px-2 py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm">
                                  <option>Oct</option>
                                  <option>Nov</option>
                                  <option>Dec</option>
                                </select>
                                <input
                                  type="number"
                                  defaultValue={2025}
                                  className="w-16 px-2 py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm"
                                />
                              </div>
                            </div>

                            {/* Extra One-time Pay */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Extra One-time Pay</label>
                              <div className="flex gap-2">
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-1">
                                  <span className="px-3 py-2.5 bg-gray-50 text-gray-600 text-sm border-r border-gray-200">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="500000"
                                    value={extraOneTimePayment}
                                    onChange={(e) => handleExtraPaymentChange('oneTime', parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-3 py-2.5 border-0 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                                <span className="text-xs text-gray-500 self-center whitespace-nowrap">in</span>
                                <select className="px-2 py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm">
                                  <option>Oct</option>
                                  <option>Nov</option>
                                  <option>Dec</option>
                                </select>
                                <input
                                  type="number"
                                  defaultValue={2025}
                                  className="w-16 px-2 py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Additional One-Time Payments Link */}
                          <div className="text-center mt-3">
                            <button 
                              onClick={addAdditionalOneTimePayment}
                              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                            >
                              + Additional One-Time Payments
                            </button>
                          </div>
                          
                          {/* Display Additional One-Time Payments */}
                          {additionalOneTimePayments.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h5 className="text-xs font-semibold text-gray-600">Additional Payments:</h5>
                              {additionalOneTimePayments.map((payment, index) => (
                                <div key={index} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
                                  <div className="flex rounded border border-gray-200 overflow-hidden flex-1">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs">$</span>
                                    <input
                                      type="number"
                                      value={payment.amount}
                                      onChange={(e) => updateAdditionalOneTimePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                                      className="flex-1 px-2 py-1 border-0 text-gray-900 text-xs focus:ring-1 focus:ring-blue-500"
                                      placeholder="0"
                                    />
                                  </div>
                                  <select 
                                    value={payment.month}
                                    onChange={(e) => updateAdditionalOneTimePayment(index, 'month', e.target.value)}
                                    className="px-2 py-1 border border-gray-200 rounded text-gray-700 text-xs"
                                  >
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                                      <option key={month} value={month}>{month}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    value={payment.year}
                                    onChange={(e) => updateAdditionalOneTimePayment(index, 'year', parseInt(e.target.value) || 2025)}
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-gray-700 text-xs"
                                  />
                                  <button
                                    onClick={() => removeAdditionalOneTimePayment(index)}
                                    className="text-red-500 hover:text-red-700 text-xs px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Show Biweekly Payback Results */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="biweekly"
                            checked={showBiweeklyResults}
                            onChange={(e) => setShowBiweeklyResults(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="biweekly" className="text-sm font-medium text-gray-700">
                            ✓ Show Biweekly Payback Results
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Payment Summary */}
          <Card className="shadow-lg border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Monthly Payment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-600">Total Monthly Payment</div>
                    <div className="text-3xl font-bold text-blue-900">
                      {formatCurrency(results.totalMonthlyPayment)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Principal & Interest</span>
                      <span className="font-medium">{formatCurrency(results.monthlyPI)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Property Tax</span>
                      <span className="font-medium">{formatCurrency(results.monthlyPropertyTax)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Home Insurance</span>
                      <span className="font-medium">{formatCurrency(results.monthlyInsurance)}</span>
                    </div>
                    {results.monthlyPMI > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">PMI</span>
                        <span className="font-medium">{formatCurrency(results.monthlyPMI)}</span>
                      </div>
                    )}
                    {results.monthlyHOA > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">HOA Fee</span>
                        <span className="font-medium">{formatCurrency(results.monthlyHOA)}</span>
                      </div>
                    )}
                    {results.monthlyOther > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Other Costs</span>
                        <span className="font-medium">{formatCurrency(results.monthlyOther)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Extra Payments Section */}
                  {(extraMonthlyPayment > 0 || extraYearlyPayment > 0 || extraOneTimePayment > 0 || additionalOneTimePayments.length > 0) && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 mb-2">Extra Payments</h4>
                      {extraMonthlyPayment > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-green-600">Extra Monthly:</span>
                          <span className="text-xs font-medium text-green-800">{formatCurrency(extraMonthlyPayment)}</span>
                        </div>
                      )}
                      {extraYearlyPayment > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-green-600">Extra Yearly:</span>
                          <span className="text-xs font-medium text-green-800">{formatCurrency(extraYearlyPayment)}</span>
                        </div>
                      )}
                      {extraOneTimePayment > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-green-600">One-time Payment:</span>
                          <span className="text-xs font-medium text-green-800">{formatCurrency(extraOneTimePayment)}</span>
                        </div>
                      )}
                      {additionalOneTimePayments.length > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-green-600">Additional One-time:</span>
                          <span className="text-xs font-medium text-green-800">{formatCurrency(additionalOneTimePayments.reduce((sum, payment) => sum + payment.amount, 0))}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Annual Increases Section */}
                  {(propertyTaxIncrease > 0 || homeInsuranceIncrease > 0 || hoaFeeIncrease > 0 || otherCostsIncrease > 0) && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="text-sm font-semibold text-orange-800 mb-2">Annual Increases Applied</h4>
                      {propertyTaxIncrease > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-orange-600">Property Tax:</span>
                          <span className="text-xs font-medium text-orange-800">+{propertyTaxIncrease}% yearly</span>
                        </div>
                      )}
                      {homeInsuranceIncrease > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-orange-600">Home Insurance:</span>
                          <span className="text-xs font-medium text-orange-800">+{homeInsuranceIncrease}% yearly</span>
                        </div>
                      )}
                      {hoaFeeIncrease > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-orange-600">HOA Fee:</span>
                          <span className="text-xs font-medium text-orange-800">+{hoaFeeIncrease}% yearly</span>
                        </div>
                      )}
                      {otherCostsIncrease > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-orange-600">Other Costs:</span>
                          <span className="text-xs font-medium text-orange-800">+{otherCostsIncrease}% yearly</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontWeight: 'bold', fontSize: '12px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Color Legend for Mobile */}
                <div className="md:hidden grid grid-cols-2 gap-2 mt-4 text-xs">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-gray-700 font-medium">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Summary */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Loan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Loan Amount</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(results.loanAmount)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Interest</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(results.totalInterest)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Payments</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(results.totalPayments)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Payoff Date</div>
                  <div className="text-lg font-bold text-blue-600">
                    {results.payoffDate?.getFullYear()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Biweekly Payment Results */}
      {showBiweeklyResults && (
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Biweekly Payment Analysis
            </CardTitle>
            <CardDescription>
              Compare biweekly payments vs monthly payments to see potential savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 font-semibold">Biweekly Payment</div>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(results.monthlyPI / 2)}
                </div>
                <div className="text-xs text-green-600 mt-1">Every 2 weeks</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-semibold">Time Saved</div>
                <div className="text-2xl font-bold text-blue-800">
                  ~4 years
                </div>
                <div className="text-xs text-blue-600 mt-1">Estimated reduction</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 font-semibold">Interest Saved</div>
                <div className="text-2xl font-bold text-purple-800">
                  {formatCurrency(results.totalInterest * 0.25)}
                </div>
                <div className="text-xs text-purple-600 mt-1">Approximate savings</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                💡 <strong>How it works:</strong> By making 26 biweekly payments per year (equivalent to 13 monthly payments), 
                you automatically make one extra payment annually, significantly reducing principal and interest over time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional One-Time Payments Display */}
      {additionalOneTimePayments.length > 0 && (
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Additional One-Time Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {additionalOneTimePayments.map((payment, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex gap-2 flex-1">
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => {
                        const updated = [...additionalOneTimePayments];
                        updated[index].amount = parseFloat(e.target.value) || 0;
                        setAdditionalOneTimePayments(updated);
                      }}
                      className="w-24 px-2 py-1 border border-orange-300 rounded text-sm"
                      placeholder="Amount"
                    />
                    <select
                      value={payment.month}
                      onChange={(e) => {
                        const updated = [...additionalOneTimePayments];
                        updated[index].month = e.target.value;
                        setAdditionalOneTimePayments(updated);
                      }}
                      className="px-2 py-1 border border-orange-300 rounded text-sm"
                    >
                      <option>Jan</option><option>Feb</option><option>Mar</option><option>Apr</option>
                      <option>May</option><option>Jun</option><option>Jul</option><option>Aug</option>
                      <option>Sep</option><option>Oct</option><option>Nov</option><option>Dec</option>
                    </select>
                    <input
                      type="number"
                      value={payment.year}
                      onChange={(e) => {
                        const updated = [...additionalOneTimePayments];
                        updated[index].year = parseInt(e.target.value) || 2025;
                        setAdditionalOneTimePayments(updated);
                      }}
                      className="w-16 px-2 py-1 border border-orange-300 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const updated = additionalOneTimePayments.filter((_, i) => i !== index);
                      setAdditionalOneTimePayments(updated);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Charts */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-4 w-4" />
              <h3 className="text-xl font-bold text-gray-800">Interactive Charts</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Balance Over Time */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">Loan Balance Over Time</CardTitle>
                    {/* Color Legend */}
                    <div className="flex items-center gap-6 mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
                        <span className="text-sm font-semibold text-gray-700">Remaining Balance</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Track how your loan balance decreases over time
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }}
                          tickMargin={10}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }}
                          tickMargin={15}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), 'Remaining Balance']}
                          labelFormatter={(label) => `Year ${label}`}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                          cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3B82F6" 
                          fill="url(#balanceGradient)"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            stroke: '#3B82F6', 
                            strokeWidth: 3, 
                            fill: '#ffffff',
                            filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3))'
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Interest vs Principal */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">Interest vs Principal Breakdown</CardTitle>
                    {/* Color Legend */}
                    <div className="flex items-center gap-6 mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                        <span className="text-sm font-semibold text-gray-700">Total Interest Paid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                        <span className="text-sm font-semibold text-gray-700">Remaining Balance</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }}
                          tickMargin={10}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }}
                          tickMargin={15}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            formatCurrency(Number(value)), 
                            name === 'totalInterest' ? 'Total Interest Paid' : 'Remaining Balance'
                          ]}
                          labelFormatter={(label) => `Year ${label}`}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                          cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalInterest" 
                          stroke="#EF4444" 
                          strokeWidth={4}
                          dot={false}
                          activeDot={{ 
                            r: 7, 
                            stroke: '#EF4444', 
                            strokeWidth: 3, 
                            fill: '#ffffff',
                            filter: 'drop-shadow(0 4px 6px rgba(239, 68, 68, 0.3))'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#10B981" 
                          strokeWidth={4}
                          dot={false}
                          activeDot={{ 
                            r: 7, 
                            stroke: '#10B981', 
                            strokeWidth: 3, 
                            fill: '#ffffff',
                            filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.3))'
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Amortization Schedule - Separate Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div>
                <CardTitle className="text-lg sm:text-xl break-words">
                  {scheduleView === 'monthly' ? 'Monthly' : 'Annual'} Amortization Schedule
                </CardTitle>
                <CardDescription className="text-sm">
                  Detailed breakdown of each payment showing principal, interest, and remaining balance
                </CardDescription>
              </div>
            </div>
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setScheduleView('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scheduleView === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Monthly Schedule
              </button>
              <button
                onClick={() => setScheduleView('annual')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scheduleView === 'annual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Annual Schedule
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg bg-white">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-2 sm:px-3 text-left font-semibold text-gray-700 min-w-[60px]">
                    {scheduleView === 'monthly' ? 'Payment' : 'Year'}
                  </th>
                  <th className="py-3 px-2 sm:px-3 text-left font-semibold text-gray-700 min-w-[80px]">
                    Date
                  </th>
                  <th className="py-3 px-2 sm:px-3 text-right font-semibold text-gray-700 min-w-[80px]">
                    Principal
                  </th>
                  <th className="py-3 px-2 sm:px-3 text-right font-semibold text-gray-700 min-w-[80px]">
                    Interest
                  </th>
                  <th className="py-3 px-2 sm:px-3 text-right font-semibold text-gray-700 min-w-[100px]">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  if (scheduleView === 'monthly') {
                    return amortizationSchedule.slice(0, 36).map((payment, index) => {
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-2 sm:px-3 text-left font-medium text-gray-800">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-left text-gray-600">
                            {payment.date}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-medium text-gray-800">
                            {formatCurrency(payment.principal)}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-medium text-gray-800">
                            {formatCurrency(payment.interest)}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-medium text-gray-800">
                            {formatCurrency(payment.remainingBalance)}
                          </td>
                        </tr>
                      );
                    });
                  } else {
                    // Annual view - group by year
                    const yearlyData: any[] = [];
                    let currentYear = new Date(amortizationSchedule[0]?.date || '').getFullYear();
                    let yearlyPrincipal = 0;
                    let yearlyInterest = 0;
                    let yearEndBalance = 0;

                    amortizationSchedule.forEach((payment, index) => {
                      const paymentYear = new Date(payment.date).getFullYear();
                      
                      if (paymentYear === currentYear) {
                        yearlyPrincipal += payment.principal;
                        yearlyInterest += payment.interest;
                        yearEndBalance = payment.remainingBalance;
                      } else {
                        yearlyData.push({
                          year: currentYear,
                          principal: yearlyPrincipal,
                          interest: yearlyInterest,
                          balance: yearEndBalance
                        });
                        
                        currentYear = paymentYear;
                        yearlyPrincipal = payment.principal;
                        yearlyInterest = payment.interest;
                        yearEndBalance = payment.remainingBalance;
                      }
                      
                      // Add the last year
                      if (index === amortizationSchedule.length - 1) {
                        yearlyData.push({
                          year: currentYear,
                          principal: yearlyPrincipal,
                          interest: yearlyInterest,
                          balance: yearEndBalance
                        });
                      }
                    });

                    return yearlyData.map((yearData, index) => {
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-2 sm:px-3 text-left font-medium text-gray-800">
                            {yearData.year}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-left text-gray-600">
                            {`01/12/${yearData.year}`}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-medium text-gray-800">
                            {formatCurrency(yearData.principal)}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-medium text-gray-800">
                            {formatCurrency(yearData.interest)}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-medium text-gray-800">
                            {formatCurrency(yearData.balance)}
                          </td>
                        </tr>
                      );
                    });
                  }
                })()} 
              </tbody>
            </table>
            <div className="text-center py-4 text-gray-500 text-xs sm:text-sm border-t bg-gray-50">
              {scheduleView === 'monthly' 
                ? `Showing first 36 months of ${amortizationSchedule.length} total payments`
                : `Showing annual summary of ${Math.ceil(amortizationSchedule.length / 12)} years`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content Section */}
      <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Mortgage Calculator Guide: Master Home Financing Decisions</CardTitle>
            <CardDescription>
              This advanced mortgage calculator estimates monthly payments and comprehensive homeownership costs including taxes, insurance, PMI, and HOA fees. 
              Explore extra payment strategies, annual cost increases, and biweekly payment options to optimize your mortgage decisions. 
              Designed specifically for U.S. mortgage scenarios and regulations.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Understanding Mortgages: Foundation of Homeownership</h3>
                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                  A mortgage represents a secured loan utilizing real estate as collateral, enabling property purchases 
                  through borrowed capital. Lenders provide funds for home buyers who commit to repayment over extended 
                  periods, typically 15-30 years in the United States. Monthly payments encompass principal (original 
                  loan amount) and interest (borrowing cost), often including escrow accounts for property taxes and insurance.
                </p>
                
                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                  The conventional 30-year fixed-rate mortgage dominates American home financing, representing 70-90% of 
                  all mortgages. This financing mechanism provides predictable monthly payments throughout the loan term, 
                  enabling widespread homeownership by spreading purchase costs across manageable timeframes. Borrowers 
                  achieve full property ownership only upon completing all scheduled payments.
                </p>

                <h4 className="text-lg font-semibold mb-3 text-gray-800">Essential Mortgage Calculator Components</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="font-semibold text-blue-800 text-base">Loan Amount & Down Payment Strategy</p>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Loan amount equals purchase price minus down payment, typically correlating with household income 
                      and affordability guidelines. Down payments of 20% or more eliminate private mortgage insurance (PMI) 
                      requirements, while lower amounts necessitate PMI until achieving 80% loan-to-value ratio. Higher 
                      down payments generally secure better interest rates and improve loan approval prospects.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <p className="font-semibold text-green-800 text-base">Loan Terms & Interest Rate Types</p>
                    <p className="text-green-700 text-sm leading-relaxed">
                      Most mortgages feature 15, 20, or 30-year terms, with shorter periods typically offering lower 
                      interest rates. Fixed-rate mortgages (FRM) maintain constant rates throughout the loan term, 
                      providing payment predictability. Adjustable-rate mortgages (ARM) offer initial lower rates that 
                      adjust periodically based on market indices, transferring some risk to borrowers.
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                    <p className="font-semibold text-purple-800 text-base">Interest Rate Calculations</p>
                    <p className="text-purple-700 text-sm leading-relaxed">
                      Mortgage interest rates are expressed as Annual Percentage Rate (APR), representing the yearly 
                      cost of borrowing. For monthly calculations, the annual rate is divided by 12. For example, 
                      a 6% APR translates to 0.5% monthly interest, applied to the remaining loan balance each month.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Comprehensive Homeownership Cost Analysis</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Recurring Monthly Expenses</h4>
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      Monthly mortgage payments represent only the foundation of homeownership costs. Additional recurring 
                      expenses persist throughout and beyond the mortgage term, significantly impacting total financial obligations. 
                      These costs typically increase with inflation, requiring careful long-term planning.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-red-300 pl-4">
                        <p className="font-semibold text-gray-800 text-base">Property Taxes</p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          Annual property taxes imposed by municipal or county governments, averaging 1.1% of property 
                          value nationwide but varying dramatically by location. All 50 states impose property taxes 
                          at the local level, typically collected monthly through mortgage escrow accounts for 
                          convenient payment management.
                        </p>
                      </div>

                      <div className="border-l-4 border-yellow-300 pl-4">
                        <p className="font-semibold text-gray-800 text-base">Home Insurance Requirements</p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          Homeowners insurance protects against property damage, theft, and personal liability claims. 
                          Costs vary according to location, property condition, coverage amounts, and deductible levels. 
                          This mandatory coverage also includes personal liability protection for injuries occurring 
                          on and off the property.
                        </p>
                      </div>

                      <div className="border-l-4 border-orange-300 pl-4">
                        <p className="font-semibold text-gray-800 text-base">Private Mortgage Insurance (PMI)</p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          PMI protects mortgage lenders when borrowers make down payments below 20% of property value. 
                          Annual costs typically range from 0.3% to 1.9% of loan amount, varying by down payment size, 
                          loan amount, and borrower credit profile. PMI automatically cancels when loan-to-value ratio 
                          reaches 78% through payments or property appreciation.
                        </p>
                      </div>

                      <div className="border-l-4 border-blue-300 pl-4">
                        <p className="font-semibold text-gray-800 text-base">HOA Fees & Maintenance</p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          Homeowner association fees for condominiums, townhomes, and planned communities, typically 
                          amounting to less than 1% of property value annually. Additional maintenance costs commonly 
                          reach 1% or more of property value yearly, covering repairs, updates, and general upkeep 
                          essential for property value preservation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Non-Recurring Purchase Costs</h4>
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      One-time expenses associated with home purchases can substantially impact total acquisition costs, 
                      requiring careful budgeting beyond the down payment and monthly obligations.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-semibold text-gray-800 text-sm">Closing Costs</p>
                        <p className="text-gray-700 text-xs leading-relaxed">
                          Fees paid at real estate transaction closing, including attorney fees, title services, recording 
                          fees, survey costs, property transfer taxes, mortgage application fees, appraisal fees, 
                          inspection costs, and more. Typically total $10,000+ on $400,000 transactions.
                        </p>
                      </div>
                      
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-semibold text-gray-800 text-sm">Initial Renovations & Setup</p>
                        <p className="text-gray-700 text-xs leading-relaxed">
                          Optional renovation costs, new furniture, appliances, and moving expenses. These discretionary 
                          expenses can add thousands to initial homeownership costs but may be deferred based on budget constraints.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-100 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold mb-2 text-blue-800">Monthly Payment Calculation Formula</h4>
              <div className="font-mono text-center text-lg mb-3 text-blue-800 bg-white rounded p-2">
                M = P[r(1+r)^n] / [(1+r)^n-1]
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <p><strong>M</strong> = Monthly payment amount</p>
                  <p><strong>P</strong> = Principal loan amount</p>
                </div>
                <div>
                  <p><strong>r</strong> = Monthly interest rate (annual rate ÷ 12)</p>
                  <p><strong>n</strong> = Total number of monthly payments</p>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Early Repayment Strategies & Benefits</h3>
                
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  Many mortgage borrowers pursue early repayment strategies to reduce total interest costs and achieve 
                  debt freedom sooner. Understanding various approaches and their implications enables informed decisions 
                  about mortgage acceleration versus alternative financial strategies.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2 text-base">Extra Monthly Payments</h4>
                    <p className="text-green-700 text-sm leading-relaxed mb-2">
                      Additional principal payments significantly reduce total interest costs and accelerate loan payoff. 
                      During early loan years, most payments address interest rather than principal, making extra 
                      principal payments particularly effective for long-term savings.
                    </p>
                    <p className="text-green-700 text-sm leading-relaxed">
                      Even modest extra payments ($100-200 monthly) can save tens of thousands in interest and reduce 
                      30-year loans by 5-8 years, providing guaranteed returns equivalent to the mortgage interest rate.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 text-base">Biweekly Payment Strategy</h4>
                    <p className="text-blue-700 text-sm leading-relaxed mb-2">
                      Paying half the monthly amount every two weeks results in 26 payments annually, equivalent to 
                      13 monthly payments instead of 12. This natural acceleration method aligns perfectly with 
                      biweekly paychecks without straining monthly budgets.
                    </p>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Biweekly payments typically reduce 30-year mortgages to approximately 26 years while saving 
                      substantial interest costs through consistent extra principal reduction.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2 text-base">Refinancing to Shorter Terms</h4>
                    <p className="text-purple-700 text-sm leading-relaxed mb-2">
                      Replacing existing mortgages with 15 or 20-year loans typically reduces interest rates while 
                      increasing monthly payments. This strategy dramatically cuts total interest expenses over 
                      the loan lifetime.
                    </p>
                    <p className="text-purple-700 text-sm leading-relaxed">
                      Consider refinancing when interest rates drop significantly or when income increases allow 
                      higher monthly payments without compromising financial stability.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">Advantages of Early Repayment</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="text-sm"><strong>Massive Interest Savings:</strong> Potentially save $100,000+ in interest over loan lifetime</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="text-sm"><strong>Accelerated Equity Building:</strong> Faster transition from debt to ownership</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="text-sm"><strong>Financial Freedom:</strong> Eliminates largest monthly expense, enabling investment opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="text-sm"><strong>Guaranteed Returns:</strong> Risk-free return equivalent to mortgage interest rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="text-sm"><strong>Emotional Benefits:</strong> Peace of mind and reduced financial stress from debt elimination</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Strategic Considerations & U.S. Mortgage Evolution</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Important Considerations Before Early Repayment</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                        <p className="font-semibold text-red-800 text-sm">Opportunity Cost Analysis</p>
                        <p className="text-red-700 text-sm leading-relaxed">
                          Extra mortgage payments may yield lower returns than alternative investments. When mortgage 
                          rates remain below potential stock market returns (historically 8-10%), investing surplus 
                          funds might generate superior long-term wealth accumulation, though with increased risk.
                        </p>
                      </div>

                      <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <p className="font-semibold text-yellow-800 text-sm">Liquidity Constraints</p>
                        <p className="text-yellow-700 text-sm leading-relaxed">
                          Home equity cannot be easily accessed without refinancing, home equity loans, or selling. 
                          Emergency fund maintenance becomes crucial when allocating extra funds toward mortgage 
                          principal rather than liquid savings accounts.
                        </p>
                      </div>

                      <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                        <p className="font-semibold text-orange-800 text-sm">Tax Deduction Impact</p>
                        <p className="text-orange-700 text-sm leading-relaxed">
                          Reduced mortgage interest decreases available tax deductions for itemizing taxpayers. However, 
                          the 2017 Tax Cuts and Jobs Act significantly limited this benefit by raising standard deduction 
                          amounts, making early payoff more attractive for many homeowners.
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                        <p className="font-semibold text-purple-800 text-sm">Prepayment Penalties</p>
                        <p className="text-purple-700 text-sm leading-relaxed">
                          Some mortgages include prepayment penalties for early payoff, typically lasting 3-5 years. 
                          Review mortgage terms before implementing aggressive payoff strategies to avoid unexpected fees.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Historical Evolution of U.S. Mortgages</h4>
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      Early 20th-century home purchases required 50% down payments with 3-5 year terms and balloon 
                      payments, limiting homeownership to merely 40% of Americans. The Great Depression devastated 
                      homeowners, with one-fourth losing their properties due to financial constraints.
                    </p>
                    
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      Federal intervention during the 1930s created the Federal Housing Administration (FHA) and 
                      Fannie Mae, establishing modern 30-year mortgages with modest down payments and universal 
                      construction standards. These innovations brought liquidity, stability, and affordability 
                      to the mortgage market.
                    </p>
                    
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      Post-World War II programs enabled veteran home purchases through the GI Bill, triggering 
                      unprecedented suburban expansion and construction booms. The FHA continued supporting borrowers 
                      through economic challenges, including the 1970s inflation crisis and 1980s energy price volatility.
                    </p>

                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      Homeownership peaked at 68.1% by 2001, followed by the 2008 financial crisis that necessitated 
                      federal takeover of Fannie Mae and massive government intervention. The FHA and Federal Reserve 
                      support helped stabilize housing markets by 2013, with both entities continuing to insure 
                      millions of residential properties today.
                    </p>
                    
                    <p className="text-gray-700 text-sm leading-relaxed">
                      This historical context demonstrates how government support, regulatory evolution, and economic 
                      cycles have shaped modern mortgage accessibility while highlighting the importance of careful 
                      financial planning and risk assessment in homeownership decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {results.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-center">{results.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MortgageCalculatorComponent;
