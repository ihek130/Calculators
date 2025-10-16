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
  Car,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Settings
} from 'lucide-react';

interface AutoLoanInputs {
  vehiclePrice: number;
  downPayment: number;
  downPaymentType: 'percentage' | 'amount';
  tradeInValue: number;
  rate: number;
  years: number;
  salesTax: number;
  fees: number;
  extendedWarranty: number;
  gapInsurance: number;
}

interface AutoLoanResults {
  vehiclePrice: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  totalVehicleCost: number;
  payoffDate: Date;
  vehicleValue: number;
  schedule?: any[];
  error?: string;
}

interface ChartDataPoint {
  month: number;
  balance: number;
  vehicleValue: number;
  totalInterest: number;
  payment: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const AutoLoanCalculatorComponent = () => {
  const [inputs, setInputs] = useState<AutoLoanInputs>({
    vehiclePrice: 30000,
    downPayment: 20,
    downPaymentType: 'percentage',
    tradeInValue: 0,
    rate: 6.5,
    years: 5,
    salesTax: 2400,
    fees: 500,
    extendedWarranty: 0,
    gapInsurance: 0
  });

  const [results, setResults] = useState<AutoLoanResults>({
    vehiclePrice: 0,
    loanAmount: 0,
    monthlyPayment: 0,
    totalPayments: 0,
    totalInterest: 0,
    totalVehicleCost: 0,
    payoffDate: new Date(),
    vehicleValue: 0
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [scheduleView, setScheduleView] = useState<'monthly' | 'annual'>('monthly');
  const [amortizationSchedule, setAmortizationSchedule] = useState<any[]>([]);

  // Advanced Auto Loan Calculation with Vehicle Depreciation
  const calculateAutoLoan = (inputs: AutoLoanInputs): AutoLoanResults => {
    const {
      vehiclePrice,
      downPayment,
      downPaymentType,
      tradeInValue,
      rate,
      years,
      salesTax,
      fees,
      extendedWarranty,
      gapInsurance
    } = inputs;

    // Input validation
    if (vehiclePrice <= 0 || rate < 0 || years <= 0) {
      throw new Error('Invalid input values');
    }

    // Calculate actual down payment
    const actualDownPayment = downPaymentType === 'percentage' 
      ? (vehiclePrice * downPayment / 100) 
      : downPayment;

    // Calculate total vehicle cost and loan amount
    const totalVehicleCost = vehiclePrice + salesTax + fees + extendedWarranty + gapInsurance;
    const loanAmount = totalVehicleCost - actualDownPayment - tradeInValue;

    // Monthly payment calculation
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    
    let monthlyPayment = 0;
    if (rate === 0) {
      monthlyPayment = loanAmount / numPayments;
    } else {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const totalPayments = monthlyPayment * numPayments;
    const totalInterest = totalPayments - loanAmount;

    // Vehicle depreciation calculation
    const depreciationYear1 = vehiclePrice * 0.22; // 22% first year
    const annualDepreciationRate = 0.15; // 15% annually after first year
    const currentVehicleValue = Math.max(
      vehiclePrice - depreciationYear1,
      vehiclePrice * 0.15
    );

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + numPayments);

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      vehiclePrice,
      loanAmount: round(loanAmount),
      monthlyPayment: round(monthlyPayment),
      totalPayments: round(totalPayments),
      totalInterest: round(totalInterest),
      totalVehicleCost: round(totalVehicleCost),
      payoffDate,
      vehicleValue: round(currentVehicleValue)
    };
  };

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Generate detailed amortization schedule
  const generateAmortizationSchedule = (inputs: AutoLoanInputs): any[] => {
    const { vehiclePrice, rate, years } = inputs;
    const actualDownPayment = inputs.downPaymentType === 'percentage' 
      ? (vehiclePrice * inputs.downPayment / 100) 
      : inputs.downPayment;
    const totalVehicleCost = vehiclePrice + inputs.salesTax + inputs.fees + inputs.extendedWarranty + inputs.gapInsurance;
    const loanAmount = totalVehicleCost - actualDownPayment - inputs.tradeInValue;
    
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    
    let monthlyPayment = 0;
    if (rate === 0) {
      monthlyPayment = loanAmount / numPayments;
    } else {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const schedule: any[] = [];
    let remainingBalance = loanAmount;
    let totalInterest = 0;

    for (let month = 1; month <= numPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      remainingBalance -= principalPayment;
      totalInterest += interestPayment;
      
      if (remainingBalance < 0) remainingBalance = 0;

      // Calculate vehicle value with depreciation
      const yearsElapsed = (month - 1) / 12;
      let vehicleValue;
      if (yearsElapsed <= 1) {
        vehicleValue = vehiclePrice * (1 - 0.22 * yearsElapsed);
      } else {
        vehicleValue = vehiclePrice * 0.78 * Math.pow(0.85, yearsElapsed - 1);
      }
      vehicleValue = Math.max(vehicleValue, vehiclePrice * 0.15);

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        totalInterest,
        remainingBalance,
        vehicleValue: Math.round(vehicleValue),
        equity: Math.max(0, vehicleValue - remainingBalance),
        date: new Date(Date.now() + (month - 1) * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
      
      if (remainingBalance <= 0.01) break;
    }

    return schedule;
  };

  // Generate annual summary from monthly schedule
  const generateAnnualSchedule = (monthlySchedule: any[]): any[] => {
    const annualData: any[] = [];
    const years = Math.ceil(monthlySchedule.length / 12);
    
    for (let year = 1; year <= years; year++) {
      const yearStart = (year - 1) * 12;
      const yearEnd = Math.min(year * 12, monthlySchedule.length);
      const yearPayments = monthlySchedule.slice(yearStart, yearEnd);
      
      if (yearPayments.length === 0) continue;
      
      const totalPayment = yearPayments.reduce((sum, payment) => sum + payment.payment, 0);
      const totalPrincipal = yearPayments.reduce((sum, payment) => sum + payment.principal, 0);
      const totalInterest = yearPayments.reduce((sum, payment) => sum + payment.interest, 0);
      const endingBalance = yearPayments[yearPayments.length - 1].remainingBalance;
      const endingVehicleValue = yearPayments[yearPayments.length - 1].vehicleValue;
      
      annualData.push({
        year,
        payment: totalPayment,
        principal: totalPrincipal,
        interest: totalInterest,
        remainingBalance: endingBalance,
        vehicleValue: endingVehicleValue,
        paymentsInYear: yearPayments.length
      });
    }
    
    return annualData;
  };

  // Handle input changes with real-time calculation
  const handleInputChange = (id: keyof AutoLoanInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newInputs = { ...inputs, [id]: numValue };
    setInputs(newInputs);
    
    // Real-time calculation
    setTimeout(() => {
      try {
        const calculationResults = calculateAutoLoan(newInputs);
        setResults(calculationResults);
        
        // Generate amortization schedule
        const schedule = generateAmortizationSchedule(newInputs);
        setAmortizationSchedule(schedule);
        
        // Generate basic chart data
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const chartData = months.map(month => ({
          month,
          balance: calculationResults.loanAmount * (1 - month / (newInputs.years * 12)),
          vehicleValue: calculationResults.vehicleValue * (1 - month * 0.01),
          totalInterest: calculationResults.totalInterest * (month / (newInputs.years * 12)),
          payment: calculationResults.monthlyPayment
        }));
        setChartData(chartData);
      } catch (error) {
        console.error('Calculation error:', error);
        setResults({ 
          ...results,
          error: 'Please check your inputs and try again.' 
        });
      }
    }, 100);
  };

  // Initialize calculations
  useEffect(() => {
    handleInputChange('vehiclePrice', inputs.vehiclePrice.toString());
  }, []);

  // Pie chart data for cost breakdown
  const pieData: PieDataPoint[] = [
    { name: 'Vehicle Price', value: inputs.vehiclePrice, color: '#3B82F6' },
    { name: 'Sales Tax', value: inputs.salesTax, color: '#EF4444' },
    { name: 'Fees & Documentation', value: inputs.fees, color: '#10B981' },
    { name: 'Extended Warranty', value: inputs.extendedWarranty, color: '#F59E0B' },
    { name: 'GAP Insurance', value: inputs.gapInsurance, color: '#8B5CF6' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Advanced Auto Loan Calculator
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate your auto loan payment with comprehensive analysis including trade-in value, 
            fees, taxes, and vehicle depreciation. Compare financing options and understand total cost of ownership.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Input Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Calculator className="h-6 w-6" />
                Auto Loan Calculator
              </h2>
              <p className="text-blue-100 text-sm mt-1">Calculate your monthly car payments</p>
            </div>
            
            <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Vehicle Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={inputs.vehiclePrice}
                    onChange={(e) => handleInputChange('vehiclePrice', e.target.value)}
                    className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400"
                    placeholder="30,000"
                  />
                </div>
              </div>

              {/* Down Payment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Down Payment</label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  <input
                    type="number"
                    value={inputs.downPayment}
                    onChange={(e) => handleInputChange('downPayment', e.target.value)}
                    className="flex-1 px-4 py-3.5 border-0 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400"
                    placeholder="20"
                  />
                  <select
                    value={inputs.downPaymentType}
                    onChange={(e) => setInputs({...inputs, downPaymentType: e.target.value as 'percentage' | 'amount'})}
                    className="px-4 py-3.5 bg-gray-50 border-0 text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">$</option>
                  </select>
                </div>
              </div>

              {/* Trade-in Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trade-in Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={inputs.tradeInValue}
                    onChange={(e) => handleInputChange('tradeInValue', e.target.value)}
                    className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.rate}
                    onChange={(e) => handleInputChange('rate', e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400"
                    placeholder="6.5"
                  />
                  <span className="absolute right-4 top-3.5 text-gray-500 font-medium">%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Term</label>
                <div className="relative">
                  <input
                    type="number"
                    value={inputs.years}
                    onChange={(e) => handleInputChange('years', e.target.value)}
                    className="w-full px-4 py-3.5 pr-16 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400"
                    placeholder="5"
                  />
                  <span className="absolute right-4 top-3.5 text-gray-500 font-medium">years</span>
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full text-center text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                >
                  {showAdvancedOptions ? '− Fewer Options' : '+ More Options (Taxes, Fees, Warranties)'}
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvancedOptions && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  {/* Sales Tax */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Tax</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={inputs.salesTax}
                        onChange={(e) => handleInputChange('salesTax', e.target.value)}
                        className="w-full pl-6 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="2,400"
                      />
                    </div>
                  </div>

                  {/* Fees & Documentation */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fees & Documentation</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={inputs.fees}
                        onChange={(e) => handleInputChange('fees', e.target.value)}
                        className="w-full pl-6 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="500"
                      />
                    </div>
                  </div>

                  {/* Extended Warranty */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Extended Warranty</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={inputs.extendedWarranty}
                        onChange={(e) => handleInputChange('extendedWarranty', e.target.value)}
                        className="w-full pl-6 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* GAP Insurance */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">GAP Insurance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={inputs.gapInsurance}
                        onChange={(e) => handleInputChange('gapInsurance', e.target.value)}
                        className="w-full pl-6 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                Auto Loan Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-600">Monthly Payment</div>
                    <div className="text-3xl font-bold text-blue-900">
                      {formatCurrency(results.monthlyPayment)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Loan Amount</span>
                      <span className="font-medium">{formatCurrency(results.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Total Vehicle Cost</span>
                      <span className="font-medium">{formatCurrency(results.totalVehicleCost)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Total Interest</span>
                      <span className="font-medium">{formatCurrency(results.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Total Payments</span>
                      <span className="font-medium">{formatCurrency(results.totalPayments)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Current Vehicle Value</span>
                      <span className="font-medium">{formatCurrency(results.vehicleValue)}</span>
                    </div>
                  </div>
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Charts */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-4 w-4" />
                <h3 className="text-xl font-bold text-gray-800">Vehicle Finance Analysis</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loan Balance Over Time */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-800">Loan Balance vs Vehicle Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} name="Loan Balance" />
                        <Line type="monotone" dataKey="vehicleValue" stroke="#10B981" strokeWidth={3} name="Vehicle Value" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-800">Total Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Principal', value: results.loanAmount, color: '#3B82F6' },
                        { name: 'Interest', value: results.totalInterest, color: '#EF4444' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Amortization Schedule */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Auto Loan Amortization Schedule
          </CardTitle>
          <CardDescription>
            Detailed payment breakdown showing principal, interest, and vehicle value over time
          </CardDescription>
          
          {/* Schedule View Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant={scheduleView === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScheduleView('monthly')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Monthly
            </Button>
            <Button
              variant={scheduleView === 'annual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScheduleView('annual')}
              className="text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Annual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile-Optimized Schedule Display */}
          <div className="space-y-4">
            {scheduleView === 'monthly' ? (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden space-y-3">
                  {amortizationSchedule.slice(0, 12).map((payment, index) => (
                    <Card key={index} className="p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-blue-600">Month {payment.month}</span>
                        <span className="text-sm text-gray-500">{payment.date}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Payment:</span>
                          <div className="font-medium">{formatCurrency(payment.payment)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Principal:</span>
                          <div className="font-medium text-green-600">{formatCurrency(payment.principal)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest:</span>
                          <div className="font-medium text-red-600">{formatCurrency(payment.interest)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Balance:</span>
                          <div className="font-medium">{formatCurrency(payment.remainingBalance)}</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span>Vehicle Value: {formatCurrency(payment.vehicleValue)}</span>
                          <span className={payment.equity > 0 ? 'text-green-600' : 'text-red-600'}>
                            Equity: {formatCurrency(payment.equity)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left">Month</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Payment</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Principal</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Interest</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Balance</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Vehicle Value</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Equity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amortizationSchedule.slice(0, 12).map((payment, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-200 px-3 py-2 font-medium">{payment.month}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatCurrency(payment.payment)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-green-600">{formatCurrency(payment.principal)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-red-600">{formatCurrency(payment.interest)}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatCurrency(payment.remainingBalance)}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatCurrency(payment.vehicleValue)}</td>
                          <td className={`border border-gray-200 px-3 py-2 ${payment.equity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(payment.equity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-2">Showing first 12 months of {inputs.years * 12} total payments</p>
              </>
            ) : (
              <>
                {/* Annual View - Mobile Cards */}
                <div className="block md:hidden space-y-3">
                  {generateAnnualSchedule(amortizationSchedule).map((year, index) => (
                    <Card key={index} className="p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-blue-600">Year {year.year}</span>
                        <span className="text-sm text-gray-500">{year.paymentsInYear} payments</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Total Payments:</span>
                          <div className="font-medium">{formatCurrency(year.payment)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Principal:</span>
                          <div className="font-medium text-green-600">{formatCurrency(year.principal)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest:</span>
                          <div className="font-medium text-red-600">{formatCurrency(year.interest)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Ending Balance:</span>
                          <div className="font-medium">{formatCurrency(year.remainingBalance)}</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs">
                          <span>Vehicle Value: {formatCurrency(year.vehicleValue)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Annual View - Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left">Year</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Total Payments</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Principal</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Interest</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Ending Balance</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Vehicle Value</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generateAnnualSchedule(amortizationSchedule).map((year, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-200 px-3 py-2 font-medium">{year.year}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatCurrency(year.payment)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-green-600">{formatCurrency(year.principal)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-red-600">{formatCurrency(year.interest)}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatCurrency(year.remainingBalance)}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatCurrency(year.vehicleValue)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{year.paymentsInYear}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-2">Annual summary of {inputs.years} year loan term</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Educational Content Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete Auto Loan Calculator Guide: Master Vehicle Financing Decisions in 2025</CardTitle>
          <CardDescription>
            This advanced auto loan calculator estimates monthly car payments with comprehensive analysis including trade-in value, 
            extended warranties, dealership vs bank financing options, and early payoff scenarios. Compare auto loan rates, 
            understand total cost of vehicle ownership, and make informed car buying decisions. Designed specifically for U.S. 
            auto financing scenarios with state-specific tax calculations and current market conditions.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Understanding Auto Loans: Complete Vehicle Financing Guide</h3>
              <p className="text-gray-700 mb-4 text-base leading-relaxed">
                Auto loans represent secured financing agreements where vehicles serve as collateral, enabling consumers 
                to purchase cars through borrowed capital with monthly payments over 36, 60, 72, or 84-month terms. Unlike 
                mortgages, auto loans feature shorter repayment periods and higher interest rates due to vehicles' rapid 
                depreciation characteristics. Most people turn to auto loans during vehicle purchases in the United States, 
                with each monthly payment comprising principal and interest obligations to auto loan lenders.
              </p>
              
              <p className="text-gray-700 mb-4 text-base leading-relaxed">
                Modern auto financing originated in 1919 when General Motors Acceptance Corporation (GMAC) introduced 
                installment buying plans, revolutionizing American transportation accessibility and enabling middle-class 
                families to purchase automobiles. The Great Depression temporarily devastated auto financing markets, 
                with unemployment reaching 25% by 1933, causing widespread loan defaults and vehicle repossessions. 
                However, federal recovery programs like the National Industrial Recovery Act of 1933 helped stabilize 
                credit markets and restore consumer confidence in automobile financing.
              </p>

              <h4 className="text-lg font-semibold mb-3 text-gray-800">Dealership Financing vs Direct Lending: Auto Loan Options Comparison</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="font-semibold text-blue-800 text-base">Direct Lending Advantages</p>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Direct lending through banks, credit unions, or financial institutions provides pre-approval leverage 
                    for car buyers, enabling better rate negotiations with dealers. Getting pre-approved doesn't tie buyers 
                    to specific dealerships and increases walking-away power during negotiations. Credit unions often offer 
                    competitive auto loan rates for members, while traditional banks provide established lending relationships 
                    with transparent terms and conditions.
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                  <p className="font-semibold text-green-800 text-base">Dealership Financing Benefits</p>
                  <p className="text-green-700 text-sm leading-relaxed">
                    Dealership financing offers convenience for buyers preferring one-stop shopping experiences, with 
                    paperwork initiated and completed through car dealers. Captive lenders associated with specific car 
                    manufacturers often provide promotional rates like 0%, 0.9%, 1.9%, or 2.9% APR to boost vehicle sales. 
                    Dealers may accept contracts initially but often sell loans to banks or assignees who ultimately 
                    service the debt obligations.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                  <p className="font-semibold text-purple-800 text-base">Manufacturer Incentive Programs</p>
                  <p className="text-purple-700 text-sm leading-relaxed">
                    Car manufacturers frequently offer attractive financing deals through authorized dealers to promote 
                    vehicle sales, especially during model year-end clearances or seasonal promotional periods. These 
                    manufacturer-sponsored rates often represent the most competitive financing available, though they 
                    may require excellent credit scores and specific vehicle selections to qualify for advertised terms.
                  </p>
                </div>
              </div>

              <h4 className="text-lg font-semibold mb-3 text-gray-800">Vehicle Rebates and Cash Back Options</h4>
              <p className="text-gray-700 mb-3 text-base leading-relaxed">
                Car manufacturers may offer vehicle rebates to incentivize purchases, though rebate taxation varies by state. 
                For example, purchasing a $50,000 vehicle with a $2,000 cash rebate may calculate sales tax on the original 
                $50,000 price rather than the reduced $48,000 amount in certain jurisdictions. States not taxing cash rebates 
                include Alaska, Arizona, Delaware, Iowa, Kansas, Kentucky, Louisiana, Massachusetts, Minnesota, Missouri, 
                Montana, Nebraska, New Hampshire, Oklahoma, Oregon, Pennsylvania, Rhode Island, Texas, Utah, Vermont, and Wyoming.
              </p>

              <h4 className="text-lg font-semibold mb-3 text-gray-800">Trade-In Value Strategy and Tax Benefits</h4>
              <p className="text-gray-700 mb-3 text-base leading-relaxed">
                Trade-in processes involve selling existing vehicles to dealerships for credit toward new car purchases, 
                though private sales typically yield higher values than dealer trade-ins. Most states collecting auto sales 
                tax calculate taxation based on the difference between new car price and trade-in value, providing significant 
                savings. For a $50,000 new car purchase with $10,000 trade-in value and 8% tax rate: ($50,000 - $10,000) × 8% = $3,200.
              </p>
              
              <p className="text-gray-700 mb-4 text-base leading-relaxed">
                However, California, District of Columbia, Hawaii, Kentucky, Maryland, Michigan, Montana, and Virginia don't 
                offer sales tax reductions for trade-ins. In these states, the same transaction would incur $50,000 × 8% = $4,000 
                in sales tax, creating an $800 difference that might justify private vehicle sales over dealer trade-ins.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Auto Loan Fees and Additional Costs Analysis</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">Common Auto Purchase Fees</h4>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    Car purchases involve numerous fees beyond the vehicle price, most of which can be financed through 
                    auto loans or paid upfront. Buyers with low credit scores might face requirements to pay certain fees 
                    upfront rather than financing them. Understanding these costs enables better budget planning and 
                    negotiation strategies with dealers and lenders.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-300 pl-4">
                      <p className="font-semibold text-gray-800 text-base">Sales Tax and State Regulations</p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Most U.S. states collect sales tax on auto purchases, with rates varying from 0% to over 10% depending 
                        on jurisdiction. Alaska, Delaware, Montana, New Hampshire, and Oregon don't charge auto sales tax. 
                        Many states allow sales tax financing with the vehicle price, while others require upfront payment. 
                        Local municipalities may impose additional taxes beyond state rates.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-300 pl-4">
                      <p className="font-semibold text-gray-800 text-base">Documentation and Processing Fees</p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Document fees cover dealer processing of title and registration paperwork, typically ranging from 
                        $100 to $800 depending on state regulations and dealer policies. Title and registration fees are 
                        collected by states for vehicle ownership documentation, varying significantly across jurisdictions. 
                        Some states cap dealer documentation fees while others allow unlimited charges.
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-300 pl-4">
                      <p className="font-semibold text-gray-800 text-base">Insurance and Protection Products</p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Auto insurance remains mandatory for legal driving on public roads and is usually required before 
                        dealers process financing paperwork. Full coverage insurance is often mandatory for financed vehicles, 
                        potentially costing over $1,000 annually. Extended warranties and GAP insurance offer additional 
                        protection but require careful cost-benefit analysis before purchase.
                      </p>
                    </div>

                    <div className="border-l-4 border-green-300 pl-4">
                      <p className="font-semibold text-gray-800 text-base">Delivery and Advertising Fees</p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Destination fees cover vehicle shipment from manufacturing plants to dealer locations, typically 
                        ranging from $900 to $1,500 for most vehicles. Advertising fees represent dealer contributions to 
                        manufacturer promotional campaigns in regional markets, usually amounting to several hundred dollars. 
                        These fees may be negotiable depending on dealer policies and market conditions.
                      </p>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-semibold mb-3 text-gray-800">Auto Loan Strategy and Optimization</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 rounded border-l-4 border-indigo-400">
                    <p className="font-semibold text-indigo-800 text-base">Preparation and Research</p>
                    <p className="text-indigo-700 text-sm leading-relaxed">
                      Successful auto loan negotiations require thorough preparation, including determining affordable payment 
                      ranges before visiting dealerships. Research typical market rates for desired vehicles enables effective 
                      negotiations with sales personnel. Obtaining quotes from multiple lenders and getting pre-approved 
                      through direct lending strengthens bargaining positions with dealers.
                    </p>
                  </div>

                  <div className="p-3 bg-teal-50 rounded border-l-4 border-teal-400">
                    <p className="font-semibold text-teal-800 text-base">Credit Score Impact and Improvement</p>
                    <p className="text-teal-700 text-sm leading-relaxed">
                      Credit scores primarily determine auto loan approval and interest rates, with excellent credit (750+) 
                      qualifying for lowest available rates. Income verification provides secondary approval criteria but 
                      credit history remains paramount. Borrowers can improve negotiation positions by addressing credit 
                      issues before applying for auto financing, potentially saving thousands in interest costs.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50 rounded border-l-4 border-rose-400">
                    <p className="font-semibold text-rose-800 text-base">Cash Back vs Low Interest Rate Decisions</p>
                    <p className="text-rose-700 text-sm leading-relaxed">
                      Auto manufacturers often offer choices between cash rebates and reduced interest rates, requiring 
                      careful analysis to determine optimal savings. Cash rebates immediately reduce purchase prices but 
                      may result in higher monthly payments if larger amounts are financed. Lower interest rates reduce 
                      total loan costs over time but may not provide immediate cash flow benefits.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded border-l-4 border-amber-400">
                    <p className="font-semibold text-amber-800 text-base">Early Payoff Considerations</p>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      Early auto loan payoff can result in significant interest savings and shortened loan terms, though 
                      some lenders impose prepayment penalties or restrictions. Carefully examine loan contracts for early 
                      payoff terms before signing agreements. Consider opportunity costs of early payoff versus alternative 
                      investments that might yield higher returns than loan interest rates.
                    </p>
                  </div>
                </div>

                <h4 className="text-lg font-semibold mb-3 text-gray-800">Alternative Vehicle Acquisition Options</h4>
                <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                  While new car purchases appeal to many buyers, pre-owned vehicles often provide substantial savings 
                  opportunities. New cars experience immediate depreciation upon leaving dealer lots, sometimes exceeding 
                  10% of their values in "off-the-lot depreciation." Auto leasing represents long-term rental arrangements 
                  that typically cost less upfront than purchases but don't build equity ownership.
                </p>

                <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                  Buying cars with cash eliminates monthly payments, interest charges, and financing restrictions while 
                  providing complete ownership flexibility. Cash purchases avoid underwater loan scenarios where loan 
                  balances exceed vehicle values. However, financing might make sense if very low interest rates are 
                  available and alternative investments could yield higher returns than loan costs.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-100 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold mb-2 text-blue-800">Auto Loan Payment Calculation Formula and Components</h4>
            <div className="font-mono text-center text-lg mb-3 text-blue-800 bg-white rounded p-2">
              M = P[r(1+r)^n] / [(1+r)^n-1]
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p><strong>M</strong> = Monthly payment amount</p>
                <p><strong>P</strong> = Principal loan amount (vehicle price - down payment - trade-in value)</p>
              </div>
              <div>
                <p><strong>r</strong> = Monthly interest rate (annual APR ÷ 12)</p>
                <p><strong>n</strong> = Total number of monthly payments (loan term in months)</p>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-3">
              This auto loan calculator uses industry-standard amortization formulas to compute accurate monthly payments, 
              total interest costs, and amortization schedules for informed vehicle financing decisions.
            </p>
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

export default AutoLoanCalculatorComponent;
