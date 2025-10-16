import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Calendar, Percent, PiggyBank } from 'lucide-react';

interface FinanceResult {
  calculatedValue: number;
  totalPayments: number;
  totalInterest: number;
  schedule: ScheduleItem[];
  chartData: ChartData[];
}

interface ScheduleItem {
  period: number;
  pv: number;
  pmt: number;
  interest: number;
  fv: number;
}

interface ChartData {
  period: number;
  pv: number;
  fv: number;
  sumOfPmt: number;
  accumulatedInterest: number;
}

interface FinanceInputs {
  n: string;
  iy: string;
  pv: string;
  pmt: string;
  fv: string;
  paymentTiming: 'end' | 'beginning';
  compoundingFrequency: number;
}

const FinanceCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<FinanceInputs>({
    n: '10',
    iy: '6',
    pv: '20000',
    pmt: '-2000',
    fv: '',
    paymentTiming: 'end',
    compoundingFrequency: 1
  });

  const [calculateFor, setCalculateFor] = useState<'fv' | 'pmt' | 'iy' | 'n' | 'pv'>('fv');
  const [result, setResult] = useState<FinanceResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time calculation effect
  useEffect(() => {
    handleCalculate();
  }, [inputs, calculateFor]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check which field we're solving for and validate the others
    const requiredFields = ['n', 'iy', 'pv', 'pmt', 'fv'].filter(field => field !== calculateFor);
    
    // For real-time calculations, only validate if value is not empty and is invalid
    requiredFields.forEach(field => {
      const value = inputs[field as keyof FinanceInputs];
      if (value !== '' && isNaN(Number(value))) {
        newErrors[field] = `${field.toUpperCase()} must be a valid number`;
      }
    });

    // Check if we have enough values to calculate
    const validFields = requiredFields.filter(field => {
      const value = inputs[field as keyof FinanceInputs];
      return value !== '' && !isNaN(Number(value));
    });

    if (validFields.length < 4) {
      newErrors.general = 'Please provide at least 4 values to calculate';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Time Value of Money calculation functions
  const calculateFV = (pv: number, pmt: number, rate: number, n: number, type: number = 0): number => {
    if (rate === 0) {
      return -(pv + pmt * n);
    }
    
    const factor = Math.pow(1 + rate, n);
    return -(pv * factor + pmt * (factor - 1) / rate * (1 + rate * type));
  };

  const calculatePV = (fv: number, pmt: number, rate: number, n: number, type: number = 0): number => {
    if (rate === 0) {
      return -(fv + pmt * n);
    }
    
    const factor = Math.pow(1 + rate, n);
    return -(fv / factor + pmt * (factor - 1) / (rate * factor) * (1 + rate * type));
  };

  const calculatePMT = (pv: number, fv: number, rate: number, n: number, type: number = 0): number => {
    if (rate === 0) {
      return -(pv + fv) / n;
    }
    
    const factor = Math.pow(1 + rate, n);
    return -(pv * rate * factor + fv * rate) / ((factor - 1) * (1 + rate * type));
  };

  const calculateRate = (pv: number, fv: number, pmt: number, n: number, type: number = 0): number => {
    // Use Newton-Raphson method for iterative solution
    let rate = 0.1; // Initial guess
    const tolerance = 1e-6;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      const factor = Math.pow(1 + rate, n);
      const f = pv * factor + pmt * (factor - 1) / rate * (1 + rate * type) + fv;
      
      const dfdr = pv * n * Math.pow(1 + rate, n - 1) + 
                   pmt * (n * Math.pow(1 + rate, n - 1) * rate - (Math.pow(1 + rate, n) - 1)) / (rate * rate) * (1 + rate * type) +
                   pmt * (Math.pow(1 + rate, n) - 1) / rate * type;
      
      const newRate = rate - f / dfdr;
      
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }
      
      rate = newRate;
    }
    
    return rate;
  };

  const calculateN = (pv: number, fv: number, pmt: number, rate: number, type: number = 0): number => {
    if (rate === 0) {
      return -(pv + fv) / pmt;
    }
    
    if (pmt === 0) {
      return Math.log(-fv / pv) / Math.log(1 + rate);
    }
    
    const numerator = Math.log((pmt * (1 + rate * type) - fv * rate) / (pmt * (1 + rate * type) + pv * rate));
    const denominator = Math.log(1 + rate);
    
    return numerator / denominator;
  };

  const generateSchedule = (pv: number, pmt: number, rate: number, n: number, calculatedFV: number): ScheduleItem[] => {
    const schedule: ScheduleItem[] = [];
    let currentPV = pv;
    
    for (let period = 1; period <= n; period++) {
      const interest = currentPV * rate;
      const newFV = currentPV + interest + pmt;
      
      schedule.push({
        period,
        pv: currentPV,
        pmt,
        interest,
        fv: newFV
      });
      
      currentPV = newFV;
    }
    
    return schedule;
  };

  const generateChartData = (schedule: ScheduleItem[], initialPV: number): ChartData[] => {
    const chartData: ChartData[] = [];
    let sumOfPmt = 0;
    let accumulatedInterest = 0;
    
    // Add initial point
    chartData.push({
      period: 0,
      pv: initialPV,
      fv: initialPV,
      sumOfPmt: 0,
      accumulatedInterest: 0
    });
    
    schedule.forEach(item => {
      sumOfPmt += item.pmt;
      accumulatedInterest += item.interest;
      
      chartData.push({
        period: item.period,
        pv: initialPV,
        fv: item.fv,
        sumOfPmt,
        accumulatedInterest
      });
    });
    
    return chartData;
  };

  const handleCalculate = () => {
    // Clear previous results if validation fails
    if (!validateInputs()) {
      setResult(null);
      return;
    }

    const n = parseFloat(inputs.n) || 0;
    const iy = parseFloat(inputs.iy) / 100 / inputs.compoundingFrequency || 0;
    const pv = parseFloat(inputs.pv) || 0;
    const pmt = parseFloat(inputs.pmt) || 0;
    const fv = parseFloat(inputs.fv) || 0;
    const type = inputs.paymentTiming === 'beginning' ? 1 : 0;

    // Don't calculate if we don't have enough valid inputs
    const requiredFields = ['n', 'iy', 'pv', 'pmt', 'fv'].filter(field => field !== calculateFor);
    const validInputCount = requiredFields.filter(field => {
      const value = inputs[field as keyof FinanceInputs];
      return value !== '' && !isNaN(Number(value));
    }).length;

    if (validInputCount < 4) {
      setResult(null);
      return;
    }

    let calculatedValue: number;
    let actualFV = fv;
    let actualPV = pv;
    let actualPMT = pmt;
    let actualN = n;
    let actualRate = iy;

    try {
      switch (calculateFor) {
        case 'fv':
          calculatedValue = calculateFV(pv, pmt, iy, n, type);
          actualFV = calculatedValue;
          break;
        case 'pv':
          calculatedValue = calculatePV(fv, pmt, iy, n, type);
          actualPV = calculatedValue;
          break;
        case 'pmt':
          calculatedValue = calculatePMT(pv, fv, iy, n, type);
          actualPMT = calculatedValue;
          break;
        case 'iy':
          calculatedValue = calculateRate(pv, fv, pmt, n, type) * 100 * inputs.compoundingFrequency;
          actualRate = calculatedValue / 100 / inputs.compoundingFrequency;
          break;
        case 'n':
          calculatedValue = calculateN(pv, fv, pmt, iy, type);
          actualN = calculatedValue;
          break;
        default:
          calculatedValue = calculateFV(pv, pmt, iy, n, type);
          actualFV = calculatedValue;
      }

      const totalPayments = actualPMT * actualN;
      const schedule = generateSchedule(actualPV, actualPMT, actualRate, Math.floor(actualN), actualFV);
      const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
      const chartData = generateChartData(schedule, actualPV);

      setResult({
        calculatedValue,
        totalPayments,
        totalInterest,
        schedule,
        chartData
      });

    } catch (error) {
      console.error('Calculation error:', error);
      setErrors({ calculation: 'Unable to calculate. Please check your inputs.' });
    }
  };

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // Format for mobile display to prevent overflow
    if (absValue >= 1000000) {
      return `${value < 0 ? '-' : ''}$${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${value < 0 ? '-' : ''}$${(absValue / 1000).toFixed(0)}K`;
    }
    return formatter.format(value);
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-1 sm:p-4 space-y-3 sm:space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          Finance Calculator
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Calculate any of the five key time value of money variables: Future Value (FV), Present Value (PV), 
          Periodic Payment (PMT), Interest Rate (I/Y), and Number of Periods (N). Features real-time calculations 
          that update automatically as you type, just like professional financial calculators such as BA II Plus or HP 12CP.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Time Value of Money Calculator
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter four known values and calculate the fifth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="calculateFor" className="text-xs sm:text-sm">Calculate For:</Label>
                <Select value={calculateFor} onValueChange={(value: any) => setCalculateFor(value)}>
                  <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fv">Future Value (FV)</SelectItem>
                    <SelectItem value="pmt">Periodic Payment (PMT)</SelectItem>
                    <SelectItem value="iy">Interest Rate (I/Y)</SelectItem>
                    <SelectItem value="n">Number of Periods (N)</SelectItem>
                    <SelectItem value="pv">Present Value (PV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="n" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">N (# of periods)</span>
                  </Label>
                  <Input
                    id="n"
                    type="number"
                    value={calculateFor === 'n' ? '' : inputs.n}
                    onChange={(e) => setInputs(prev => ({ ...prev, n: e.target.value }))}
                    disabled={calculateFor === 'n'}
                    className={`h-8 sm:h-10 text-xs sm:text-sm ${calculateFor === 'n' ? 'bg-blue-50' : ''}`}
                    placeholder={calculateFor === 'n' ? 'Calculated' : 'Periods'}
                  />
                  {errors.n && <p className="text-xs text-red-600 break-words">{errors.n}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iy" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">I/Y (Interest %)</span>
                  </Label>
                  <Input
                    id="iy"
                    type="number"
                    value={calculateFor === 'iy' ? '' : inputs.iy}
                    onChange={(e) => setInputs(prev => ({ ...prev, iy: e.target.value }))}
                    disabled={calculateFor === 'iy'}
                    className={`h-8 sm:h-10 text-xs sm:text-sm ${calculateFor === 'iy' ? 'bg-blue-50' : ''}`}
                    placeholder={calculateFor === 'iy' ? 'Calculated' : 'Rate'}
                    step="0.01"
                  />
                  {errors.iy && <p className="text-xs text-red-600 break-words">{errors.iy}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pv" className="flex items-center gap-1 text-xs sm:text-sm">
                    <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">PV (Present Value)</span>
                  </Label>
                  <Input
                    id="pv"
                    type="number"
                    value={calculateFor === 'pv' ? '' : inputs.pv}
                    onChange={(e) => setInputs(prev => ({ ...prev, pv: e.target.value }))}
                    disabled={calculateFor === 'pv'}
                    className={`h-8 sm:h-10 text-xs sm:text-sm ${calculateFor === 'pv' ? 'bg-blue-50' : ''}`}
                    placeholder={calculateFor === 'pv' ? 'Calculated' : 'Present value'}
                  />
                  {errors.pv && <p className="text-xs text-red-600 break-words">{errors.pv}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pmt" className="flex items-center gap-1 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">PMT (Payment)</span>
                  </Label>
                  <Input
                    id="pmt"
                    type="number"
                    value={calculateFor === 'pmt' ? '' : inputs.pmt}
                    onChange={(e) => setInputs(prev => ({ ...prev, pmt: e.target.value }))}
                    disabled={calculateFor === 'pmt'}
                    className={`h-8 sm:h-10 text-xs sm:text-sm ${calculateFor === 'pmt' ? 'bg-blue-50' : ''}`}
                    placeholder={calculateFor === 'pmt' ? 'Calculated' : 'Payment'}
                  />
                  {errors.pmt && <p className="text-xs text-red-600 break-words">{errors.pmt}</p>}
                </div>

                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label htmlFor="fv" className="flex items-center gap-1 text-xs sm:text-sm">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">FV (Future Value)</span>
                  </Label>
                  <Input
                    id="fv"
                    type="number"
                    value={calculateFor === 'fv' ? '' : inputs.fv}
                    onChange={(e) => setInputs(prev => ({ ...prev, fv: e.target.value }))}
                    disabled={calculateFor === 'fv'}
                    className={`h-8 sm:h-10 text-xs sm:text-sm ${calculateFor === 'fv' ? 'bg-blue-50' : ''}`}
                    placeholder={calculateFor === 'fv' ? 'Calculated' : 'Future value'}
                  />
                  {errors.fv && <p className="text-xs text-red-600 break-words">{errors.fv}</p>}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTiming" className="text-xs sm:text-sm">Payment Timing</Label>
                    <Select value={inputs.paymentTiming} onValueChange={(value: any) => setInputs(prev => ({ ...prev, paymentTiming: value }))}>
                      <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="end">End of Period</SelectItem>
                        <SelectItem value="beginning">Beginning of Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compoundingFrequency" className="text-xs sm:text-sm">Compounding</Label>
                    <Select value={inputs.compoundingFrequency.toString()} onValueChange={(value) => setInputs(prev => ({ ...prev, compoundingFrequency: parseInt(value) }))}>
                      <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Annually</SelectItem>
                        <SelectItem value="2">Semi-annually</SelectItem>
                        <SelectItem value="4">Quarterly</SelectItem>
                        <SelectItem value="12">Monthly</SelectItem>
                        <SelectItem value="52">Weekly</SelectItem>
                        <SelectItem value="365">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {errors.general && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-blue-700 text-center break-words">{errors.general}</p>
                </div>
              )}

              {errors.calculation && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-red-600 text-center break-words">{errors.calculation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              Results
              {result && <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Live</span>}
            </CardTitle>
          </CardHeader>
          {result ? (
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="text-center space-y-2">
                <div className="text-base sm:text-2xl font-bold text-blue-600 break-words px-2">
                  {calculateFor.toUpperCase()} = {
                    calculateFor === 'iy' 
                      ? `${formatNumber(result.calculatedValue, 2)}%`
                      : calculateFor === 'n'
                        ? formatNumber(result.calculatedValue, 1)
                        : formatCurrency(result.calculatedValue)
                  }
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <p className="text-gray-600 break-words">Sum of all periodic payments</p>
                  <p className="font-medium break-words">{formatCurrency(result.totalPayments)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 break-words">Total Interest</p>
                  <p className="font-medium break-words">{formatCurrency(result.totalInterest)}</p>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Calculator className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base break-words">Enter at least 4 values to see results</p>
                <p className="text-xs sm:text-sm mt-1 break-words">Calculations update automatically as you type</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Charts and Schedule */}
      {result && (
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" className="flex items-center gap-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">Value Changes Over Time</span>
              <span className="sm:hidden">Chart</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full">Live</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">Payment Schedule</span>
              <span className="sm:hidden">Schedule</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full">Live</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <span className="hidden sm:inline">Value Changes Over Time</span>
                  <span className="sm:hidden">Chart</span>
                  <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded-full">Real-time</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1 sm:p-6">
                <div className="h-64 sm:h-80 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 8 }}
                        interval={"preserveStartEnd"}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 8 }}
                        width={30}
                        tickFormatter={(value) => {
                          const absValue = Math.abs(value);
                          if (absValue >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                          if (absValue >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return `${Math.round(value / 100)}H`;
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        labelFormatter={(label) => `Period ${label}`}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="pv" stackId="1" stroke="#8884d8" fill="#8884d8" name="PV" />
                      <Area type="monotone" dataKey="fv" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="FV" />
                      <Area type="monotone" dataKey="sumOfPmt" stackId="3" stroke="#ffc658" fill="#ffc658" name="Sum of PMT" />
                      <Area type="monotone" dataKey="accumulatedInterest" stackId="4" stroke="#ff7300" fill="#ff7300" name="Accumulated Interest" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  Payment Schedule
                  <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Real-time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-1 sm:p-2 min-w-[40px] text-xs sm:text-sm">Period</th>
                          <th className="text-right p-1 sm:p-2 min-w-[55px] text-xs sm:text-sm">PV</th>
                          <th className="text-right p-1 sm:p-2 min-w-[55px] text-xs sm:text-sm">PMT</th>
                          <th className="text-right p-1 sm:p-2 min-w-[60px] text-xs sm:text-sm">Interest</th>
                          <th className="text-right p-1 sm:p-2 min-w-[55px] text-xs sm:text-sm">FV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-1 sm:p-2 text-xs sm:text-sm">{item.period}</td>
                            <td className="text-right p-1 sm:p-2 break-words text-xs sm:text-sm">{formatCurrency(item.pv)}</td>
                            <td className="text-right p-1 sm:p-2 break-words text-xs sm:text-sm">{formatCurrency(item.pmt)}</td>
                            <td className="text-right p-1 sm:p-2 break-words text-xs sm:text-sm">{formatCurrency(item.interest)}</td>
                            <td className="text-right p-1 sm:p-2 break-words text-xs sm:text-sm">{formatCurrency(item.fv)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Educational Content */}
      <div className="space-y-4 sm:space-y-8 mt-6 sm:mt-12 px-1 sm:px-0">
        {/* What is the Finance Calculator */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="bg-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calculator className="h-6 w-6 text-blue-600" />
              What is a Finance Calculator?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none bg-blue-50">
            <p className="text-gray-700 leading-relaxed mb-4">
              A finance calculator is a sophisticated computational tool designed to solve complex time value of money (TVM) problems that form the foundation of financial analysis. Unlike basic arithmetic calculators, finance calculators are specifically engineered to handle the intricate relationships between present value, future value, interest rates, payment amounts, and time periods that are central to virtually every financial decision.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our comprehensive finance calculator replicates the functionality of professional financial calculators such as the Texas Instruments BA II Plus, HP 12CP, and Casio FC-200V, which are widely used by financial professionals, students, and analysts worldwide. These calculators are essential tools in corporate finance, investment analysis, loan structuring, retirement planning, and academic finance courses.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The calculator operates on the fundamental principle that money has different values at different points in time due to factors such as inflation, investment opportunities, and risk. This core concept, known as the time value of money, underlies all financial calculations and is essential for making informed financial decisions in both personal and professional contexts.
            </p>
          </CardContent>
        </Card>

        {/* Time Value of Money Fundamentals */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="bg-green-100">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-6 w-6 text-green-600" />
              The Time Value of Money: Foundation of Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-green-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Core Principle</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The time value of money (TVM) is perhaps the most fundamental concept in finance, stating that a dollar received today is worth more than a dollar received in the future. This principle drives virtually every financial decision, from individual savings choices to multi-billion dollar corporate investments.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Consider this scenario: Would you prefer to receive $1,000 today or $1,000 one year from now? Rational economic theory suggests you should choose the money today, not because of impatience, but because money available today can be invested to generate additional returns. If you can earn a 5% annual return, that $1,000 today becomes $1,050 in one year, making it objectively more valuable than receiving $1,000 a year from now.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">The Mathematics of Time Value</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The mathematical relationship governing time value calculations is elegantly simple yet powerful:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-mono text-center text-lg">FV = PV × (1 + r)ⁿ</p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Where: FV = Future Value, PV = Present Value, r = interest rate per period, n = number of periods
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                This fundamental formula can be rearranged to solve for any variable when the others are known, forming the basis for all time value calculations. When periodic payments are involved, the formula becomes more complex, incorporating annuity calculations that account for multiple cash flows over time.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Compounding: The Eighth Wonder of the World</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Albert Einstein allegedly called compound interest "the eighth wonder of the world," noting that "he who understands it, earns it; he who doesn't, pays it." Compounding occurs when interest is calculated not only on the initial principal but also on the accumulated interest from previous periods.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The power of compounding becomes increasingly dramatic over longer time periods. An investment of $1,000 at 8% annual interest grows to $1,080 after one year, $1,166.40 after two years, and $2,158.92 after ten years. The accelerating growth curve demonstrates why starting early is crucial for long-term financial goals like retirement planning.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* The Five Key Variables */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="bg-orange-100">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <DollarSign className="h-6 w-6 text-orange-600" />
              Understanding the Five Key Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-orange-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Present Value (PV): Today's Worth</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Present Value represents the current worth of a future sum of money or stream of cash flows, discounted at a specific interest rate. PV calculations answer the critical question: "What is a future amount worth in today's dollars?" This concept is essential for investment analysis, as it allows comparison of investment opportunities with different time horizons and cash flow patterns.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                In practical applications, PV calculations help determine how much you need to invest today to reach a specific financial goal, evaluate the current value of future pension payments, or assess whether a long-term investment opportunity offers adequate returns. The discount rate used in PV calculations should reflect the risk-free rate plus a risk premium appropriate for the investment's uncertainty level.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Future Value (FV): Tomorrow's Potential</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Future Value calculates what an investment made today will be worth at a specific point in the future, assuming a particular rate of return. FV calculations are fundamental to retirement planning, education funding, and any scenario where you need to project the growth of current investments over time.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Understanding FV helps investors set realistic expectations and make informed decisions about savings rates and investment strategies. It's particularly valuable for comparing different investment vehicles and understanding the long-term impact of seemingly small differences in interest rates or contribution amounts.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Payment (PMT): Cash Flow Streams</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Periodic Payment (PMT) represents regular, recurring cash flows that occur at consistent intervals throughout the investment or loan period. PMT calculations are crucial for loan amortization, annuity payments, regular savings contributions, and any financial arrangement involving periodic cash flows.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The timing of payments significantly affects calculations. Payments made at the beginning of each period (annuity due) accumulate more interest than payments made at the end (ordinary annuity), resulting in higher future values for the same payment amounts. This distinction is particularly important for retirement planning and lease analysis.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Interest Rate (I/Y): The Cost of Money</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The interest rate represents the cost of borrowing money or the return earned on investments. It's perhaps the most critical variable in financial calculations, as small changes in interest rates can have dramatic effects on long-term financial outcomes. Interest rates reflect factors including inflation expectations, risk premiums, liquidity preferences, and central bank monetary policy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Understanding how to calculate implied interest rates is essential for evaluating investment opportunities and loan terms. When you know the other TVM variables, you can determine the effective interest rate of any financial arrangement, helping you compare different options and identify the most favorable terms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Number of Periods (N): Time's Impact</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The number of periods (N) represents the time dimension in financial calculations. Time can be measured in any consistent unit (years, months, quarters, days), but the interest rate must be adjusted to match the same period frequency. The relationship between time and compounding creates exponential growth patterns that make long-term investing particularly powerful.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Calculating the required time period helps answer questions like "How long will it take to double my investment?" or "When will I reach my savings goal?" Understanding these time relationships is crucial for setting realistic financial goals and developing appropriate strategies to achieve them.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Financial Concepts */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="bg-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <PiggyBank className="h-6 w-6 text-purple-600" />
              Advanced Financial Concepts and Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-purple-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Annuities and Perpetuities</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Annuities represent a series of equal payments made at regular intervals. There are several types of annuities, each with distinct characteristics and applications. Ordinary annuities involve payments made at the end of each period, while annuities due involve payments at the beginning. The timing difference affects the present and future value calculations significantly.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Growing annuities incorporate increasing payment amounts over time, often used to model salary increases or inflation-adjusted payments. Perpetuities are annuities that continue indefinitely, such as preferred stock dividends or certain types of bonds. Understanding these variations is essential for analyzing complex financial instruments and retirement planning strategies.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Effective vs. Nominal Interest Rates</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The distinction between nominal and effective interest rates is crucial for accurate financial analysis. Nominal rates are stated annual rates that don't account for compounding frequency, while effective rates reflect the actual annual return when compounding is considered. As compounding frequency increases, the effective rate exceeds the nominal rate by an increasingly significant margin.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-mono text-center text-lg">EAR = (1 + r/n)ⁿ - 1</p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Where: EAR = Effective Annual Rate, r = nominal rate, n = compounding periods per year
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                For example, a 6% nominal rate compounded monthly yields an effective annual rate of 6.17%. This difference becomes more pronounced with higher nominal rates and more frequent compounding, making effective rate calculations essential for comparing financial products with different compounding schedules.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Net Present Value and Internal Rate of Return</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Net Present Value (NPV) extends basic TVM concepts to evaluate investment projects with multiple cash flows occurring at different times. NPV calculates the present value of all future cash flows minus the initial investment, providing a dollar measure of value creation. Projects with positive NPVs create value and should generally be accepted.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Internal Rate of Return (IRR) represents the discount rate that makes NPV equal to zero, effectively showing the project's breakeven return rate. IRR provides an intuitive percentage return measure that can be easily compared to required rates of return or alternative investment opportunities. However, IRR can be misleading for projects with non-conventional cash flows or when comparing mutually exclusive projects.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Risk and Return Relationships</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The fundamental principle of finance states that higher returns require accepting higher risks. This risk-return tradeoff is central to investment decision-making and portfolio construction. The required rate of return for any investment should reflect its risk level, typically measured as the risk-free rate plus a risk premium.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Risk premiums vary based on factors including business risk, financial risk, liquidity risk, and market risk. Understanding these relationships helps investors make informed decisions about appropriate discount rates for TVM calculations and evaluate whether potential returns adequately compensate for assumed risks.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Practical Applications */}
        <Card className="border-teal-200 bg-teal-50">
          <CardHeader className="bg-teal-100">
            <CardTitle className="flex items-center gap-2 text-teal-800">
              <Calendar className="h-6 w-6 text-teal-600" />
              Real-World Applications and Use Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-teal-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-teal-800">Personal Financial Planning</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Finance calculators are indispensable tools for personal financial planning across all life stages. For young professionals, they help determine appropriate savings rates to achieve long-term goals like homeownership or retirement. The calculations reveal how seemingly modest monthly contributions can grow into substantial sums through the power of compounding over long time periods.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mid-career individuals use TVM calculations to evaluate major financial decisions such as whether to pay off mortgages early, maximize retirement contributions, or fund children's education expenses. The ability to compare different scenarios helps optimize financial strategies and make trade-offs between competing priorities.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pre-retirees rely on these calculations to determine if their accumulated assets will provide adequate income throughout retirement. By modeling different withdrawal rates and investment returns, they can develop sustainable retirement income strategies that balance current needs with longevity concerns.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-teal-800">Business and Corporate Finance</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Corporate financial managers use TVM calculations for capital budgeting decisions, evaluating potential investments in equipment, facilities, research and development, and acquisitions. These calculations help determine which projects create the most value for shareholders and how to prioritize limited capital resources among competing opportunities.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Financing decisions also rely heavily on TVM analysis. Companies evaluate different funding sources by comparing the effective costs of debt versus equity financing, considering factors such as tax deductibility of interest payments, flotation costs, and the impact on financial leverage ratios.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Working capital management involves TVM considerations when evaluating credit terms, cash discount policies, and inventory investment levels. Understanding the time value of money helps optimize the timing of cash receipts and payments to improve overall profitability.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-teal-800">Investment Analysis and Portfolio Management</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Professional investors and portfolio managers use sophisticated TVM calculations to value securities, compare investment alternatives, and construct optimal portfolios. Bond valuation relies entirely on present value calculations to determine fair prices based on future coupon payments and principal repayment.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Stock valuation models such as the dividend discount model use TVM principles to estimate intrinsic values based on expected future dividend payments. Real estate investors apply these concepts to analyze rental property investments, considering factors such as cash flow patterns, appreciation expectations, and tax implications.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Alternative investments including private equity, hedge funds, and commodities require sophisticated TVM analysis to evaluate their complex cash flow patterns and risk characteristics. Understanding these calculations is essential for making informed investment decisions and managing portfolio risk.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-teal-800">Loan and Credit Analysis</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Lending institutions use TVM calculations extensively for loan pricing, risk assessment, and profitability analysis. Mortgage calculations determine monthly payment amounts, amortization schedules, and the impact of different down payment amounts and loan terms on total interest costs.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Credit card companies apply TVM principles to calculate minimum payments, interest charges, and payoff timeframes. Understanding these calculations helps consumers make informed decisions about credit usage and debt repayment strategies.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Commercial lending involves complex TVM calculations for lines of credit, term loans, and specialized financing arrangements. Lenders must evaluate cash flow patterns, collateral values, and borrower creditworthiness to price loans appropriately and manage risk exposure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Finance Education */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="bg-indigo-100">
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Percent className="h-6 w-6 text-indigo-600" />
              Professional Finance Education and Certification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-indigo-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Academic Foundation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Time value of money calculations form the cornerstone of finance education at both undergraduate and graduate levels. Business students typically encounter these concepts in introductory finance courses, where they learn to solve basic TVM problems using financial calculators or spreadsheet software.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Advanced finance courses build upon these fundamentals to explore sophisticated applications including derivative valuation, real options analysis, and international finance considerations. MBA programs emphasize practical applications through case studies that simulate real-world decision-making scenarios.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Professional Certifications</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Professional finance certifications such as the Chartered Financial Analyst (CFA), Financial Risk Manager (FRM), and Certified Financial Planner (CFP) require mastery of TVM calculations and their applications. These certifications validate expertise in financial analysis and are highly valued by employers in the finance industry.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The CFA curriculum devotes significant attention to quantitative methods and TVM applications across multiple levels, covering everything from basic calculations to complex derivative pricing models. Candidates must demonstrate proficiency with financial calculators and understand when to apply different calculation methods.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Industry Applications</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Finance professionals across various industries rely on TVM calculations daily. Investment bankers use these concepts for merger and acquisition analysis, leveraged buyout modeling, and initial public offering pricing. Commercial bankers apply TVM principles to loan structuring, credit analysis, and portfolio management.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Insurance professionals use TVM calculations to determine premium pricing, reserve requirements, and policyholder benefit values. Actuaries employ sophisticated models that incorporate TVM principles along with probability distributions to assess risk and price insurance products appropriately.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technology and Innovation */}
        <Card className="border-cyan-200 bg-cyan-50">
          <CardHeader className="bg-cyan-100">
            <CardTitle className="flex items-center gap-2 text-cyan-800">
              <Calculator className="h-6 w-6 text-cyan-600" />
              Technology, Innovation, and Future Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-cyan-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-800">Evolution of Financial Calculators</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Financial calculators have evolved from mechanical devices to sophisticated electronic instruments and now to powerful software applications. The HP-12C, introduced in 1981, revolutionized financial analysis by making complex calculations accessible to practitioners. Modern financial calculators incorporate advanced features such as cash flow analysis, statistical functions, and programming capabilities.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Web-based financial calculators represent the latest evolution, offering enhanced functionality, visual displays, and instant accessibility across devices. These tools democratize financial analysis by making professional-grade calculations available to anyone with internet access, supporting financial literacy and informed decision-making.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-800">Artificial Intelligence and Machine Learning</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Emerging technologies are beginning to enhance traditional TVM calculations with predictive analytics and machine learning capabilities. AI-powered financial planning tools can analyze spending patterns, market conditions, and personal circumstances to provide more accurate projections and personalized recommendations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Machine learning algorithms can identify optimal savings strategies, predict market volatility impacts on long-term goals, and automatically adjust financial plans based on changing circumstances. These innovations promise to make financial planning more dynamic and responsive to individual needs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-800">Integration with Financial Services</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Modern financial services increasingly integrate TVM calculations into their platforms, providing real-time analysis for investment decisions, loan applications, and retirement planning. Robo-advisors use these calculations to construct portfolios, rebalance investments, and project future outcomes based on individual risk profiles and goals.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mobile banking applications incorporate TVM functionality to help customers understand the long-term impact of spending and saving decisions. These tools encourage better financial behavior by making abstract concepts tangible and showing immediate feedback on financial choices.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-800">Global Considerations and Currency Effects</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                International finance adds complexity to TVM calculations through currency exchange rates, inflation differentials, and varying interest rate environments. Multinational corporations must consider these factors when evaluating cross-border investments and financing arrangements.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Individual investors with international exposure must understand how currency fluctuations affect the real value of their investments over time. Purchasing power parity theory suggests that exchange rates should adjust to equalize price levels across countries, but short-term deviations can significantly impact investment returns.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips and Best Practices */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="bg-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              Tips, Best Practices, and Common Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-emerald-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-emerald-800">Calculator Usage Best Practices</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Effective use of finance calculators requires understanding the underlying assumptions and limitations of TVM calculations. Always ensure that the interest rate and number of periods use consistent time units (annual rate with annual periods, monthly rate with monthly periods, etc.). Mismatched time units are among the most common sources of calculation errors.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pay careful attention to cash flow signs (positive vs. negative) as they represent different perspectives in the calculation. Money flowing out (investments, loan payments) should typically be entered as negative values, while money flowing in (returns, loan proceeds) should be positive. Incorrect signs will produce meaningless results.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                When dealing with irregular cash flows, break complex problems into simpler components that can be solved individually and then combined. This approach reduces errors and makes it easier to verify results through alternative calculation methods.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-emerald-800">Common Calculation Errors</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                One frequent mistake involves confusing nominal and effective interest rates, especially when compounding frequencies differ from annual periods. Always convert rates to match the payment frequency to ensure accurate calculations. For example, use monthly rates (annual rate ÷ 12) when calculating monthly payments.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Another common error occurs when mixing beginning-of-period and end-of-period payment assumptions. The timing of cash flows significantly affects results, particularly for annuity calculations. Clearly identify whether payments occur at the beginning or end of each period before performing calculations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Failing to account for taxes, inflation, or fees can lead to overly optimistic projections. Real-world financial outcomes typically differ from theoretical calculations due to these factors. Consider creating conservative and optimistic scenarios to bracket potential outcomes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-emerald-800">Verification and Sensitivity Analysis</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Always verify important calculations using alternative methods or different calculators. Spreadsheet functions, online calculators, and financial calculator apps should produce identical results when given the same inputs. Discrepancies indicate input errors or incorrect assumptions.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Perform sensitivity analysis by varying key assumptions such as interest rates, time periods, and payment amounts. Understanding how changes in these variables affect outcomes helps identify the most critical factors and develop contingency plans for different scenarios.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Document your assumptions and calculation methods, especially for complex analyses that may need to be updated or reviewed later. Clear documentation helps ensure consistency and allows others to understand and verify your work.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-emerald-800">Professional Development</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mastering financial calculator usage requires regular practice with diverse problem types. Work through textbook problems, case studies, and real-world scenarios to build proficiency and confidence. Focus on understanding the logic behind calculations rather than memorizing button sequences.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Stay current with evolving calculation methods and new features in financial software. Technology continues to enhance the power and accessibility of financial analysis tools, offering new capabilities for modeling complex scenarios and visualizing results.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Consider pursuing professional certifications that validate your financial analysis skills. These credentials demonstrate expertise to employers and clients while providing structured learning opportunities to deepen your understanding of advanced concepts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceCalculatorComponent;
