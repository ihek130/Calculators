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
  TrendingDown,
  Info,
  AlertCircle,
  Building2,
  Banknote
} from 'lucide-react';

interface BasicBondInputs {
  faceValue: number;
  yield: number;
  timeToMaturity: number;
  annualCoupon: number;
  couponFrequency: string;
  price?: number; // Optional for solving
}

interface PricingBondInputs {
  faceValue: number;
  yield: number;
  annualCoupon: number;
  couponFrequency: string;
  maturityDate: string;
  settlementDate: string;
  dayCountConvention: string;
}

interface BondResults {
  price?: number;
  yield?: number;
  dirtyPrice?: number;
  cleanPrice?: number;
  accruedInterest?: number;
  interestAccruedDays?: number;
  totalReturn?: number;
  yieldToMaturity?: number;
  currentYield?: number;
  cashFlowSchedule?: Array<{
    period: number;
    date: string;
    couponPayment: number;
    principalPayment: number;
    totalPayment: number;
    presentValue: number;
  }>;
  error?: string;
}

const BondCalculatorComponent = () => {
  const [activeTab, setActiveTab] = useState('basic');
  
  // Basic Bond Calculator Inputs
  const [basicInputs, setBasicInputs] = useState<BasicBondInputs>({
    faceValue: 100,
    yield: 6,
    timeToMaturity: 3,
    annualCoupon: 5,
    couponFrequency: 'annually',
    price: undefined
  });

  // Pricing Bond Calculator Inputs
  const [pricingInputs, setPricingInputs] = useState<PricingBondInputs>({
    faceValue: 100,
    yield: 6,
    annualCoupon: 5,
    couponFrequency: 'annually',
    maturityDate: '2028-10-17',
    settlementDate: new Date().toISOString().split('T')[0],
    dayCountConvention: '30/360'
  });

  const [basicResults, setBasicResults] = useState<BondResults>({});
  const [pricingResults, setPricingResults] = useState<BondResults>({});

  // Get coupon frequency as number
  const getCouponFrequency = (frequency: string): number => {
    switch (frequency) {
      case 'annually': return 1;
      case 'semiannually': return 2;
      case 'quarterly': return 4;
      case 'monthly': return 12;
      default: return 1;
    }
  };

  // Calculate bond price from yield
  const calculateBondPrice = (inputs: BasicBondInputs): number => {
    const { faceValue, yield: yieldRate, timeToMaturity, annualCoupon, couponFrequency } = inputs;
    
    const frequencyNum = getCouponFrequency(couponFrequency);
    const periodsPerYear = frequencyNum;
    const totalPeriods = timeToMaturity * periodsPerYear;
    const couponPayment = (faceValue * (annualCoupon / 100)) / periodsPerYear;
    const discountRate = (yieldRate / 100) / periodsPerYear;

    if (totalPeriods === 0) return faceValue;

    // Present value of coupon payments
    let pvCoupons = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      pvCoupons += couponPayment / Math.pow(1 + discountRate, i);
    }

    // Present value of face value
    const pvFaceValue = faceValue / Math.pow(1 + discountRate, totalPeriods);

    return pvCoupons + pvFaceValue;
  };

  // Calculate yield from price (using Newton-Raphson method)
  const calculateYieldFromPrice = (inputs: BasicBondInputs, targetPrice: number): number => {
    const { faceValue, timeToMaturity, annualCoupon, couponFrequency } = inputs;
    
    const frequencyNum = getCouponFrequency(couponFrequency);
    const totalPeriods = timeToMaturity * frequencyNum;
    const couponPayment = (faceValue * (annualCoupon / 100)) / frequencyNum;

    // Initial guess (current yield approximation)
    let yieldGuess = (annualCoupon * faceValue / targetPrice) / 100;
    
    // Newton-Raphson iterations
    for (let iteration = 0; iteration < 100; iteration++) {
      const discountRate = yieldGuess / frequencyNum;
      
      let price = 0;
      let derivative = 0;
      
      for (let i = 1; i <= totalPeriods; i++) {
        const factor = Math.pow(1 + discountRate, i);
        price += couponPayment / factor;
        derivative -= (i * couponPayment) / (factor * (1 + discountRate));
      }
      
      const faceValueFactor = Math.pow(1 + discountRate, totalPeriods);
      price += faceValue / faceValueFactor;
      derivative -= (totalPeriods * faceValue) / (faceValueFactor * (1 + discountRate));
      
      const error = price - targetPrice;
      
      if (Math.abs(error) < 0.0001) {
        return yieldGuess * 100;
      }
      
      yieldGuess = yieldGuess - error / derivative;
    }
    
    return yieldGuess * 100;
  };

  // Calculate basic bond results
  const calculateBasicBond = (inputs: BasicBondInputs): BondResults => {
    const { faceValue, timeToMaturity, annualCoupon } = inputs;

    if (faceValue <= 0 || timeToMaturity <= 0 || annualCoupon < 0) {
      return { error: 'Please check your input values' };
    }

    try {
      let price: number | undefined;
      let yieldValue: number | undefined;
      
      // If price is provided, calculate yield
      if (inputs.price && inputs.price > 0) {
        price = inputs.price;
        yieldValue = calculateYieldFromPrice(inputs, price);
      } else {
        // Calculate price from yield
        price = calculateBondPrice(inputs);
        yieldValue = inputs.yield;
      }

      const frequencyNum = getCouponFrequency(inputs.couponFrequency);
      const totalPeriods = timeToMaturity * frequencyNum;
      const couponPayment = (faceValue * (annualCoupon / 100)) / frequencyNum;

      // Generate cash flow schedule
      const cashFlowSchedule = [];
      const today = new Date();
      
      for (let i = 1; i <= totalPeriods; i++) {
        const periodDate = new Date(today);
        periodDate.setMonth(today.getMonth() + (12 / frequencyNum) * i);
        
        const discountRate = (yieldValue / 100) / frequencyNum;
        const principalPayment = i === totalPeriods ? faceValue : 0;
        const totalPayment = couponPayment + principalPayment;
        const presentValue = totalPayment / Math.pow(1 + discountRate, i);

        cashFlowSchedule.push({
          period: i,
          date: periodDate.toLocaleDateString(),
          couponPayment: Math.round(couponPayment * 10000) / 10000,
          principalPayment: Math.round(principalPayment * 10000) / 10000,
          totalPayment: Math.round(totalPayment * 10000) / 10000,
          presentValue: Math.round(presentValue * 10000) / 10000
        });
      }

      const currentYield = (annualCoupon / 100) * (faceValue / price) * 100;

      return {
        price: Math.round(price * 10000) / 10000,
        yield: Math.round(yieldValue * 100) / 100,
        currentYield: Math.round(currentYield * 100) / 100,
        yieldToMaturity: Math.round(yieldValue * 100) / 100,
        cashFlowSchedule
      };
    } catch (error) {
      return { error: 'Calculation error. Please verify inputs.' };
    }
  };

  // Calculate days between two dates
  const daysBetween = (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate accrued interest
  const calculateAccruedInterest = (inputs: PricingBondInputs): BondResults => {
    const { faceValue, annualCoupon, couponFrequency, maturityDate, settlementDate, dayCountConvention } = inputs;

    try {
      const settlement = new Date(settlementDate);
      const maturity = new Date(maturityDate);
      
      if (settlement >= maturity) {
        return { error: 'Settlement date must be before maturity date' };
      }

      const frequencyNum = getCouponFrequency(couponFrequency);
      const couponPayment = (faceValue * (annualCoupon / 100)) / frequencyNum;
      
      // Calculate last coupon date (simplified - assumes even intervals)
      const daysBetweenCoupons = 365 / frequencyNum;
      const daysToMaturity = daysBetween(settlement, maturity);
      const periodsRemaining = Math.ceil(daysToMaturity / daysBetweenCoupons);
      
      // Find last coupon date
      const lastCouponDate = new Date(maturity);
      lastCouponDate.setDate(maturity.getDate() - (periodsRemaining * daysBetweenCoupons));
      
      // Calculate accrued interest based on day-count convention
      let daysSinceLastCoupon = daysBetween(lastCouponDate, settlement);
      let daysInPeriod = daysBetweenCoupons;
      
      if (dayCountConvention === '30/360') {
        daysInPeriod = 360 / frequencyNum;
        daysSinceLastCoupon = Math.min(daysSinceLastCoupon, daysInPeriod);
      } else if (dayCountConvention === 'Actual/360') {
        daysInPeriod = 360 / frequencyNum;
      } else if (dayCountConvention === 'Actual/365') {
        daysInPeriod = 365 / frequencyNum;
      }
      
      const accruedInterest = couponPayment * (daysSinceLastCoupon / daysInPeriod);
      
      // Calculate clean price (using basic bond pricing)
      const yearsToMaturity = daysToMaturity / 365;
      const basicCalc = calculateBondPrice({
        faceValue,
        yield: inputs.yield,
        timeToMaturity: yearsToMaturity,
        annualCoupon,
        couponFrequency
      });
      
      const cleanPrice = basicCalc;
      const dirtyPrice = cleanPrice + accruedInterest;

      return {
        dirtyPrice: Math.round(dirtyPrice * 10000) / 10000,
        cleanPrice: Math.round(cleanPrice * 10000) / 10000,
        accruedInterest: Math.round(accruedInterest * 10000) / 10000,
        interestAccruedDays: Math.round(daysSinceLastCoupon)
      };
    } catch (error) {
      return { error: 'Calculation error. Please verify dates.' };
    }
  };

  // Handle input changes
  const handleBasicInputChange = (field: keyof BasicBondInputs, value: string | number) => {
    // Handle string fields (like couponFrequency) separately
    if (field === 'couponFrequency') {
      setBasicInputs(prev => ({ ...prev, [field]: value as string }));
      return;
    }
    
    // Handle numeric fields
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setBasicInputs(prev => ({ ...prev, [field]: numValue === 0 && field === 'price' ? undefined : numValue }));
  };

  const handlePricingInputChange = (field: keyof PricingBondInputs, value: string | number) => {
    // Handle string fields (couponFrequency, dates, dayCountConvention)
    if (field === 'couponFrequency' || field === 'maturityDate' || field === 'settlementDate' || field === 'dayCountConvention') {
      setPricingInputs(prev => ({ ...prev, [field]: value as string }));
      return;
    }
    
    // Handle numeric fields
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setPricingInputs(prev => ({ ...prev, [field]: numValue }));
  };

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  // Calculate results on input changes
  useEffect(() => {
    if (activeTab === 'basic') {
      const results = calculateBasicBond(basicInputs);
      setBasicResults(results);
    } else {
      const results = calculateAccruedInterest(pricingInputs);
      setPricingResults(results);
    }
  }, [basicInputs, pricingInputs, activeTab]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Building2 className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Bond Calculator
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate bond prices, yields, and accrued interest for fixed-rate coupon bonds.
            Analyze bond investments with detailed cash flow projections.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bond Type Selector */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Basic Bond Calculator</span>
                <span className="sm:hidden">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs sm:text-sm">
                <Banknote className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bond Pricing Calculator</span>
                <span className="sm:hidden">Pricing</span>
              </TabsTrigger>
            </TabsList>

                {/* Basic Bond Calculator */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1">
                      <Card className="shadow-lg border-l-4 border-l-emerald-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Calculator className="h-5 w-5 text-emerald-600" />
                            Bond Parameters
                          </CardTitle>
                          <CardDescription>
                            Enter any four values to calculate the remaining
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {/* Price (Optional) */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Price (Optional - Leave blank to calculate)
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                step="0.01"
                                value={basicInputs.price || ''}
                                onChange={(e) => handleBasicInputChange('price', e.target.value)}
                                className="pl-10"
                                placeholder="Leave blank"
                              />
                            </div>
                          </div>

                          {/* Face Value */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Face Value
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                value={basicInputs.faceValue}
                                onChange={(e) => handleBasicInputChange('faceValue', e.target.value)}
                                className="pl-10"
                                placeholder="100"
                              />
                            </div>
                          </div>

                          {/* Yield */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Yield
                            </Label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                step="0.1"
                                value={basicInputs.yield}
                                onChange={(e) => handleBasicInputChange('yield', e.target.value)}
                                className="pl-10"
                                placeholder="6.0"
                              />
                            </div>
                          </div>

                          {/* Time to Maturity */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Time to Maturity (Years)
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                step="0.5"
                                value={basicInputs.timeToMaturity}
                                onChange={(e) => handleBasicInputChange('timeToMaturity', e.target.value)}
                                className="pl-10"
                                placeholder="3"
                              />
                            </div>
                          </div>

                          {/* Annual Coupon */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Annual Coupon Rate
                            </Label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                step="0.1"
                                value={basicInputs.annualCoupon}
                                onChange={(e) => handleBasicInputChange('annualCoupon', e.target.value)}
                                className="pl-10"
                                placeholder="5.0"
                              />
                            </div>
                          </div>

                          {/* Coupon Frequency */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Coupon Frequency
                            </Label>
                            <Select 
                              value={basicInputs.couponFrequency} 
                              onValueChange={(value) => handleBasicInputChange('couponFrequency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="annually">Annually</SelectItem>
                                <SelectItem value="semiannually">Semi-annually</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2 space-y-6">
                      {basicResults.error ? (
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-red-700">
                              <AlertCircle className="h-5 w-5" />
                              <p className="font-medium">{basicResults.error}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          {/* Key Results */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="shadow-md border-l-4 border-l-emerald-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Bond Price
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-emerald-600">
                                  {formatCurrency(basicResults.price)}
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-md border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Yield to Maturity
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-blue-600">
                                  {basicResults.yieldToMaturity?.toFixed(2)}%
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-md border-l-4 border-l-purple-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <Percent className="h-4 w-4" />
                                  Current Yield
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-purple-600">
                                  {basicResults.currentYield?.toFixed(2)}%
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-md border-l-4 border-l-orange-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Payment Periods
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-orange-600">
                                  {basicResults.cashFlowSchedule?.length || 0}
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Cash Flow Schedule */}
                          {basicResults.cashFlowSchedule && basicResults.cashFlowSchedule.length > 0 && (
                            <Card className="shadow-md">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                                  Cash Flow Schedule
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">Period</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Coupon</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Principal</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Total Payment</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">Present Value</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {basicResults.cashFlowSchedule.slice(0, 10).map((flow) => (
                                        <tr key={flow.period} className="hover:bg-gray-50">
                                          <td className="px-4 py-3">{flow.period}</td>
                                          <td className="px-4 py-3">{flow.date}</td>
                                          <td className="px-4 py-3 text-right">{formatCurrency(flow.couponPayment)}</td>
                                          <td className="px-4 py-3 text-right">{formatCurrency(flow.principalPayment)}</td>
                                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(flow.totalPayment)}</td>
                                          <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                            {formatCurrency(flow.presentValue)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {basicResults.cashFlowSchedule.length > 10 && (
                                    <p className="text-sm text-gray-500 mt-3 text-center">
                                      Showing first 10 of {basicResults.cashFlowSchedule.length} periods
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Pricing Bond Calculator */}
                <TabsContent value="pricing" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1">
                      <Card className="shadow-lg border-l-4 border-l-teal-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Banknote className="h-5 w-5 text-teal-600" />
                            Pricing Parameters
                          </CardTitle>
                          <CardDescription>
                            Calculate clean price, dirty price, and accrued interest
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {/* Face Value */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Face Value
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                value={pricingInputs.faceValue}
                                onChange={(e) => handlePricingInputChange('faceValue', e.target.value)}
                                className="pl-10"
                                placeholder="100"
                              />
                            </div>
                          </div>

                          {/* Yield */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Yield
                            </Label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                step="0.1"
                                value={pricingInputs.yield}
                                onChange={(e) => handlePricingInputChange('yield', e.target.value)}
                                className="pl-10"
                                placeholder="6.0"
                              />
                            </div>
                          </div>

                          {/* Annual Coupon */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Annual Coupon Rate
                            </Label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                type="number"
                                step="0.1"
                                value={pricingInputs.annualCoupon}
                                onChange={(e) => handlePricingInputChange('annualCoupon', e.target.value)}
                                className="pl-10"
                                placeholder="5.0"
                              />
                            </div>
                          </div>

                          {/* Coupon Frequency */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Coupon Frequency
                            </Label>
                            <Select 
                              value={pricingInputs.couponFrequency} 
                              onValueChange={(value) => handlePricingInputChange('couponFrequency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="annually">Annually</SelectItem>
                                <SelectItem value="semiannually">Semi-annually</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Maturity Date */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Maturity Date
                            </Label>
                            <Input
                              type="date"
                              value={pricingInputs.maturityDate}
                              onChange={(e) => handlePricingInputChange('maturityDate', e.target.value)}
                            />
                          </div>

                          {/* Settlement Date */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Settlement Date
                            </Label>
                            <Input
                              type="date"
                              value={pricingInputs.settlementDate}
                              onChange={(e) => handlePricingInputChange('settlementDate', e.target.value)}
                            />
                          </div>

                          {/* Day Count Convention */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              Day-Count Convention
                            </Label>
                            <Select 
                              value={pricingInputs.dayCountConvention} 
                              onValueChange={(value) => handlePricingInputChange('dayCountConvention', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select convention" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30/360">30/360 (Bond Basis)</SelectItem>
                                <SelectItem value="Actual/360">Actual/360</SelectItem>
                                <SelectItem value="Actual/365">Actual/365</SelectItem>
                                <SelectItem value="Actual/Actual">Actual/Actual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2 space-y-6">
                      {pricingResults.error ? (
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-red-700">
                              <AlertCircle className="h-5 w-5" />
                              <p className="font-medium">{pricingResults.error}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          {/* Key Results */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="shadow-md border-l-4 border-l-teal-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Dirty Price
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-teal-600">
                                  {formatCurrency(pricingResults.dirtyPrice)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Invoice price (includes accrued interest)</p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-md border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Clean Price
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-blue-600">
                                  {formatCurrency(pricingResults.cleanPrice)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Quoted market price</p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-md border-l-4 border-l-amber-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Accrued Interest
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-amber-600">
                                  {formatCurrency(pricingResults.accruedInterest)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Interest earned since last coupon</p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-md border-l-4 border-l-purple-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Interest Accrued Days
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-3xl font-bold text-purple-600">
                                  {pricingResults.interestAccruedDays}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Days since last coupon payment</p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Formula Explanation */}
                          <Card className="shadow-md bg-gradient-to-r from-blue-50 to-teal-50">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="space-y-2">
                                  <p className="font-medium text-gray-900">Pricing Relationship:</p>
                                  <p className="text-sm text-gray-700">
                                    <strong>Dirty Price = Clean Price + Accrued Interest</strong>
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {formatCurrency(pricingResults.dirtyPrice)} = {formatCurrency(pricingResults.cleanPrice)} + {formatCurrency(pricingResults.accruedInterest)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Charts Section - Show for Basic Calculator */}
          {activeTab === 'basic' && basicResults.cashFlowSchedule && basicResults.cashFlowSchedule.length > 0 && (
            <>
              {/* Cash Flow Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Cash Flow Projection
                  </CardTitle>
                  <CardDescription>
                    Coupon payments and present value over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={basicResults.cashFlowSchedule}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="period" 
                        label={{ value: 'Period', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Period ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="couponPayment" fill="#10b981" name="Coupon Payment" />
                      <Bar dataKey="principalPayment" fill="#3b82f6" name="Principal Payment" />
                      <Bar dataKey="presentValue" fill="#8b5cf6" name="Present Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Present Value Distribution */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Present Value Over Time
                  </CardTitle>
                  <CardDescription>
                    How the present value changes across payment periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={basicResults.cashFlowSchedule}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="period" 
                        label={{ value: 'Period', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Present Value ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Period ${label}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="presentValue" 
                        stroke="#8b5cf6" 
                        fill="#c4b5fd" 
                        name="Present Value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* Summary Card */}
          <Card className="shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-600" />
                Bond Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTab === 'basic' ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Bond Price:</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(basicResults.price)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Face Value:</span>
                    <span className="text-lg font-semibold">{formatCurrency(basicInputs.faceValue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Yield to Maturity:</span>
                    <span className="text-lg font-semibold text-blue-600">{basicResults.yieldToMaturity?.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Current Yield:</span>
                    <span className="text-lg font-semibold text-purple-600">{basicResults.currentYield?.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Time to Maturity:</span>
                    <span className="text-lg font-semibold">{basicInputs.timeToMaturity} years</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Dirty Price:</span>
                    <span className="text-lg font-bold text-teal-600">{formatCurrency(pricingResults.dirtyPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Clean Price:</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(pricingResults.cleanPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 font-medium">Accrued Interest:</span>
                    <span className="text-lg font-semibold text-amber-600">{formatCurrency(pricingResults.accruedInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Days Accrued:</span>
                    <span className="text-lg font-semibold">{pricingResults.interestAccruedDays} days</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

      {/* Educational Content Section */}
      <div className="space-y-8 mt-12">
        <Separator className="my-8" />

        {/* Introduction */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Understanding Bond Calculators
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <p className="text-gray-700 leading-relaxed">
              The first calculator above is designed to compute various parameters of a fixed-rate coupon bond issued or traded on the coupon date. The second calculator is used to determine the prices and accrued interest of fixed-rate bonds not traded on the coupon date using common day-count conventions.
            </p>
            <p className="text-gray-700 leading-relaxed">
              It is important to note that these calculators are specifically intended for use with fixed-rate coupon bonds, which represent the majority of bond types. Additionally, it should be mentioned that in pricing bonds, these calculators do not account for other factors that can influence bond prices, such as credit quality, supply and demand, and numerous other factors.
            </p>
          </CardContent>
        </Card>

        {/* What is a Bond */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-emerald-600" />
              What is a Bond?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A bond is a fixed-income instrument that represents a loan made by an investor to a borrower (typically a corporation or government entity). It serves as a means for organizations or governments to raise funds by borrowing from investors. A bond specifies the terms of the loan and the payments to be made to the bondholder.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Bonds come in various types to cater to the diverse needs of both investors and issuers. Each type comes with its own unique characteristics, risks, and benefits. The most common types include government bonds, municipal bonds, corporate bonds, and high-yield (junk) bonds, among others.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Relative to stocks, bonds are considered a lower-risk investment, making them a popular choice among investors seeking a stable income stream while preserving capital. However, the risk and return on bonds can vary widely, depending on the creditworthiness of the issuer and the bond's duration. For example, high-quality government bonds (such as U.S. Treasury bonds) are typically viewed as safe investments while high-yield corporate bonds (also known as junk bonds) carry higher risk.
            </p>
          </CardContent>
        </Card>

        {/* Bond Structure */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Info className="h-6 w-6 text-blue-600" />
              Bond Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <p className="text-gray-700 leading-relaxed">
              The structure of a bond refers to its various components and characteristics, which dictate how it functions as a financial instrument. Here's a breakdown of the key elements in the structure of a bond:
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-gray-900 mb-2">Face Value</h4>
                <p className="text-gray-700 text-sm">
                  The face value, or par value, is the amount the bond issuer agrees to repay the bondholder at the bond's maturity. This amount also serves as the basis for calculating interest/coupon payments.
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-gray-900 mb-2">Maturity Date</h4>
                <p className="text-gray-700 text-sm">
                  The maturity date is the point when the bond's principal is due for repayment to the bondholder. Bonds can have short, medium, or long-term maturities spanning from less than a year to over 30 years. The term "time to maturity" refers to the remaining period until the bond reaches its maturity date.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-bold text-gray-900 mb-2">Coupon Rate</h4>
                <p className="text-gray-700 text-sm">
                  The coupon rate is the interest rate the bond issuer commits to paying on the bond's face value. Interest is typically paid annually or semi-annually. Rates can be fixed, floating (adjustable), or zero (as in zero-coupon bonds). The calculators above are designed exclusively for bonds with fixed coupon rates.
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-bold text-gray-900 mb-2">Coupon Payment Frequency</h4>
                <p className="text-gray-700 text-sm">
                  This refers to how often interest payments are made to bondholders. Common frequencies for interest or dividend payments include annual, semi-annual, quarterly, and monthly schedules.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-gray-900 mb-2">Yield</h4>
                <p className="text-gray-700 text-sm">
                  The yield is a measure of the return an investor anticipates earning if the bond is held to maturity. Expressed as an annual percentage, the yield is affected by the bond's purchase price, face value, coupon rate, and the time until maturity. There are several types of yields that investors consider. The yield referred to in the above calculators is the current yield, which assesses the bond's coupon interest in relation to its current market price, rather than its face value. The current yield is calculated by dividing the annual coupon payment by the bond's current market price. This yield changes as the market price of the bond changes.
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-gray-900 mb-2">Price</h4>
                <p className="text-gray-700 text-sm">
                  The price of a bond is the amount it can be bought or sold for in the financial markets. In essence, a bond's price reflects the present value of its future coupon payments and the return of principal at maturity, adjusted for the bond's credit risk, duration, and the current interest rate environment.
                </p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-4">
              Beyond these core components, features such as the issuer, call and put options, credit rating, covenants, and marketability also play important roles in a bond's valuation.
            </p>
          </CardContent>
        </Card>

        {/* How to Calculate Bond Price */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calculator className="h-6 w-6 text-emerald-600" />
              How to Calculate the Bond Price?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Calculating the bond price involves discounting the future cash flows, which include interest payments and the principal repayment, to their present value using the required yield or discount rate. The bond price is the sum of the present values of all these cash flows. The basic formula for calculating the price of a bond is as follows:
            </p>

            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg border border-emerald-200 my-6">
              <div className="text-center space-y-3">
                <p className="font-mono text-lg font-semibold text-gray-900">
                  Bond Price = Σ [C / (1 + r)ⁿ] + F / (1 + r)ᴺ
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>C</strong> = the coupon payment per period</p>
                  <p><strong>N</strong> = number of periods until maturity</p>
                  <p><strong>r</strong> = the discount rate or yield per period</p>
                  <p><strong>F</strong> = the face value of the bond</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-bold text-gray-900 mb-3">Example:</h4>
              <p className="text-gray-700 text-sm mb-3">
                Let's say we have a bond with a face value of $1,000, a coupon rate of 5%, semi-annual payments, a maturity of 10 years, and we require a yield of 6%.
              </p>
              <ul className="text-gray-700 text-sm space-y-2 list-disc pl-5">
                <li>Coupon payment per period (C) = 5% of $1,000 / 2 = $25</li>
                <li>Number of periods (N) = 10 years × 2 = 20 periods</li>
                <li>Discount rate per period (r) = 6% / 2 = 3% or 0.03</li>
              </ul>
              <p className="text-gray-700 text-sm mt-3">
                The bond price is calculated by discounting each semi-annual payment and the face value at maturity back to their present value, using a 3% per period rate. For this case, the calculated bond price is <strong>$925.61</strong>. This process involves performing calculations for each payment and then summing them up, a task that can be complex without the aid of a financial calculator or software. Our calculators above are designed to facilitate this purpose.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clean Price and Dirty Price */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-teal-600" />
              Clean Price and Dirty Price
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <p className="text-gray-700 leading-relaxed">
              When calculating the price or present value of a bond, it is often assumed that the bond trades or is issued on the coupon date. However, in reality, bonds are mostly traded outside of the coupon dates. In the bond market, the terms 'clean price' and 'dirty price' are used to distinguish between two ways of quoting the price of a bond outside the coupon date. These concepts are crucial for understanding how bonds are traded and priced.
            </p>

            <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500 my-6">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Accrued Interest
              </h4>
              <p className="text-gray-700 text-sm mb-3">
                Accrued interest of a bond is the interest that has accumulated on the bond since the last interest payment date but has not yet been paid to the bondholder. The accrued interest can be calculated using the formula:
              </p>
              <div className="bg-white p-4 rounded border border-amber-200 text-center">
                <p className="font-mono text-sm font-semibold text-gray-900">
                  Accrued Interest = (Coupon Payment) × (Days Since Last Payment) / (Days in Period)
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-gray-900 mb-3">Clean Price</h4>
                <p className="text-gray-700 text-sm">
                  The clean price of a bond is the price that <strong>excludes any accrued interest</strong> since the last coupon payment. When bonds are quoted in financial markets and to the public, the clean price is typically used. This price reflects the market value of the bond itself, without considering any accrued interest. The clean price is useful because it provides a standard way to compare the prices of different bonds without the variability introduced by differing interest accrual periods.
                </p>
              </div>

              <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-gray-900 mb-3">Dirty Price (Invoice Price)</h4>
                <p className="text-gray-700 text-sm">
                  The dirty price of a bond, also known as the invoice price, is the price that <strong>includes the accrued interest</strong> on top of the clean price. The dirty price is the actual amount paid by a buyer to the seller of the bond. Since bondholders earn interest on a daily basis, if a bond is bought or sold between coupon payment dates, the buyer compensates the seller for the interest income earned from the last coupon date up to the purchase date. This makes the dirty price a more accurate reflection of the bond's total value at any given point in time between coupon payments.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-6 rounded-lg border border-blue-200 my-6">
              <p className="text-center text-lg font-semibold text-gray-900 mb-2">
                Pricing Relationship
              </p>
              <p className="text-center font-mono text-xl font-bold text-emerald-600">
                Dirty Price = Clean Price + Accrued Interest
              </p>
              <p className="text-center text-sm text-gray-600 mt-3">
                This formula highlights that the dirty price, which is the total price paid by the buyer, includes both the clean price of the bond (its market value excluding accrued interest) and the accrued interest earned on the bond from the last coupon payment date up to the purchase date.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Day-Count Conventions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-purple-600" />
              Day-Count Conventions
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <p className="text-gray-700 leading-relaxed">
              As seen in the accrued interest calculation formula above, the accrued interest is closely related to the methods of counting the number of days since the last coupon payment and the total days in a year. Day-count conventions in the bond market are rules that determine how days are counted for the calculation of interest that accrues over time on bonds. The main day-count conventions used in the bond market include:
            </p>

            <div className="space-y-4">
              <div className="bg-purple-50 p-5 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-bold text-gray-900 mb-2">30/360 (Bond Basis)</h4>
                <p className="text-gray-700 text-sm">
                  This convention assumes that each month has 30 days and a year has 360 days. It simplifies interest calculations by standardizing the lengths of months, making it easier to calculate accrued interest manually. This convention is often used for corporate, agency, and municipal bonds in the United States.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-gray-900 mb-2">Actual/360 (A/360)</h4>
                <p className="text-gray-700 text-sm">
                  Here, the actual number of days in the accrual period is used, but the year is assumed to have 360 days. This convention is commonly used in money market instruments, such as commercial paper and short-term bank certificates of deposit.
                </p>
              </div>

              <div className="bg-teal-50 p-5 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-gray-900 mb-2">Actual/365 (A/365)</h4>
                <p className="text-gray-700 text-sm">
                  This method uses the actual number of days in the accrual period but assumes a fixed year length of 365 days (although leap years, which have 366 days, are usually not accounted for). It is commonly used for some government bonds outside the United States and in some interest rate swaps.
                </p>
              </div>

              <div className="bg-emerald-50 p-5 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-gray-900 mb-2">Actual/Actual (A/A)</h4>
                <p className="text-gray-700 text-sm">
                  This convention is used primarily for government bonds, including U.S. Treasury securities. It takes into account the actual number of days in the accrual period and the actual number of days in the year, making it the most precise.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Important Note</h4>
                  <p className="text-gray-700 text-sm">
                    Different bonds may use different day-count conventions. The choice of day-count convention affects the calculation of accrued interest and, therefore, the price of the bond when it is traded between coupon dates. The second calculator above gives the option to select the day-count convention to use in the calculation. The accrued interest differences between different day-count conventions are normally very small. In extreme cases, it can have a difference of up to 6 days of accrued interest.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default BondCalculatorComponent;
