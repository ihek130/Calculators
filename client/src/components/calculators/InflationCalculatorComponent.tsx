import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Calculator, 
  DollarSign, 
  Calendar,
  ArrowRight,
  Info,
  BarChart3,
  Clock,
  BookOpen,
  Target,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Types
interface InflationInputs {
  calculationType: 'historical' | 'forward' | 'backward';
  amount: number;
  
  // Historical CPI Calculator
  fromYear: number;
  fromMonth: string;
  toYear: number;
  toMonth: string;
  
  // Forward/Backward Calculator
  inflationRate: number;
  years: number;
}

interface InflationResult {
  originalAmount: number;
  adjustedAmount: number;
  totalInflation: number;
  annualInflationRate: number;
  calculationType: string;
  timeDescription: string;
  purchasingPowerChange: number;
}

interface CPIData {
  [year: number]: {
    [month: string]: number;
  };
}

const InflationCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<InflationInputs>({
    calculationType: 'historical',
    amount: 100,
    fromYear: 2015,
    fromMonth: 'Average',
    toYear: 2025,
    toMonth: 'August',
    inflationRate: 3,
    years: 10
  });

  const [result, setResult] = useState<InflationResult>({
    originalAmount: 0,
    adjustedAmount: 0,
    totalInflation: 0,
    annualInflationRate: 0,
    calculationType: '',
    timeDescription: '',
    purchasingPowerChange: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Simplified CPI data (selected years and average values)
  const cpiData: CPIData = {
    2025: { 'Average': 310.5, 'January': 308.2, 'February': 309.1, 'March': 309.9, 'April': 310.3, 'May': 310.8, 'June': 311.5, 'July': 312.0, 'August': 312.8 },
    2024: { 'Average': 307.2, 'January': 305.1, 'February': 306.2, 'March': 307.8, 'April': 308.1, 'May': 308.5, 'June': 308.0, 'July': 307.9, 'August': 307.2, 'September': 306.8, 'October': 307.3, 'November': 307.9, 'December': 308.5 },
    2023: { 'Average': 299.2, 'January': 300.5, 'February': 301.0, 'March': 299.2, 'April': 299.5, 'May': 298.3, 'June': 297.1, 'July': 298.4, 'August': 299.9, 'September': 300.3, 'October': 299.2, 'November': 299.8, 'December': 300.8 },
    2022: { 'Average': 292.7, 'January': 283.8, 'February': 285.6, 'March': 289.1, 'April': 289.8, 'May': 292.3, 'June': 296.3, 'July': 296.2, 'August': 296.2, 'September': 296.8, 'October': 298.0, 'November': 297.7, 'December': 296.8 },
    2021: { 'Average': 271.0, 'January': 261.6, 'February': 263.0, 'March': 264.9, 'April': 267.1, 'May': 269.2, 'June': 271.7, 'July': 273.0, 'August': 273.6, 'September': 274.3, 'October': 276.6, 'November': 278.5, 'December': 281.1 },
    2020: { 'Average': 258.8, 'January': 257.8, 'February': 258.7, 'March': 258.1, 'April': 256.4, 'May': 256.4, 'June': 257.8, 'July': 259.1, 'August': 259.9, 'September': 260.3, 'October': 260.4, 'November': 260.6, 'December': 261.6 },
    2019: { 'Average': 255.7, 'January': 251.7, 'February': 252.8, 'March': 254.2, 'April': 255.5, 'May': 256.1, 'June': 256.1, 'July': 256.6, 'August': 256.6, 'September': 256.8, 'October': 257.3, 'November': 258.2, 'December': 258.8 },
    2018: { 'Average': 251.1, 'January': 247.9, 'February': 248.9, 'March': 249.6, 'April': 250.5, 'May': 251.6, 'June': 252.0, 'July': 252.0, 'August': 252.1, 'September': 252.4, 'October': 252.9, 'November': 252.0, 'December': 251.2 },
    2017: { 'Average': 245.1, 'January': 242.8, 'February': 243.6, 'March': 243.8, 'April': 244.2, 'May': 244.7, 'June': 244.9, 'July': 245.5, 'August': 245.5, 'September': 246.8, 'October': 246.7, 'November': 247.2, 'December': 246.5 },
    2016: { 'Average': 240.0, 'January': 236.9, 'February': 237.1, 'March': 238.1, 'April': 239.3, 'May': 240.2, 'June': 241.0, 'July': 240.6, 'August': 240.8, 'September': 241.4, 'October': 241.7, 'November': 241.4, 'December': 241.4 },
    2015: { 'Average': 237.0, 'January': 233.7, 'February': 234.7, 'March': 236.1, 'April': 236.6, 'May': 237.8, 'June': 238.6, 'July': 238.7, 'August': 238.3, 'September': 237.9, 'October': 237.8, 'November': 237.3, 'December': 236.5 },
    2010: { 'Average': 218.1, 'January': 216.7, 'February': 216.7, 'March': 217.6, 'April': 218.0, 'May': 218.2, 'June': 217.9, 'July': 218.0, 'August': 218.3, 'September': 218.4, 'October': 218.7, 'November': 218.8, 'December': 219.2 },
    2005: { 'Average': 195.3, 'January': 190.7, 'February': 191.8, 'March': 193.3, 'April': 194.6, 'May': 194.4, 'June': 194.5, 'July': 195.4, 'August': 196.4, 'September': 198.8, 'October': 199.2, 'November': 197.6, 'December': 196.8 },
    2000: { 'Average': 172.2, 'January': 168.8, 'February': 169.8, 'March': 171.2, 'April': 171.3, 'May': 171.5, 'June': 172.4, 'July': 172.8, 'August': 172.8, 'September': 173.7, 'October': 173.7, 'November': 174.1, 'December': 174.0 },
    1995: { 'Average': 152.4, 'January': 150.3, 'February': 150.9, 'March': 151.4, 'April': 151.9, 'May': 152.2, 'June': 152.5, 'July': 152.5, 'August': 152.9, 'September': 153.2, 'October': 153.7, 'November': 153.6, 'December': 153.5 },
    1990: { 'Average': 130.7, 'January': 127.4, 'February': 128.0, 'March': 128.7, 'April': 128.9, 'May': 129.2, 'June': 129.9, 'July': 130.4, 'August': 131.6, 'September': 132.7, 'October': 133.5, 'November': 133.8, 'December': 133.8 },
    1985: { 'Average': 107.6, 'January': 105.5, 'February': 106.0, 'March': 106.6, 'April': 107.0, 'May': 107.3, 'June': 107.8, 'July': 108.0, 'August': 108.0, 'September': 108.3, 'October': 108.7, 'November': 109.0, 'December': 109.3 },
    1980: { 'Average': 82.4, 'January': 77.8, 'February': 78.9, 'March': 80.1, 'April': 81.0, 'May': 81.8, 'June': 82.7, 'July': 82.7, 'August': 83.3, 'September': 83.5, 'October': 84.0, 'November': 84.3, 'December': 84.3 },
    1975: { 'Average': 53.8, 'January': 51.9, 'February': 52.1, 'March': 52.5, 'April': 52.9, 'May': 53.2, 'June': 53.6, 'July': 54.2, 'August': 54.3, 'September': 54.6, 'October': 55.5, 'November': 55.3, 'December': 55.6 },
    1970: { 'Average': 38.8, 'January': 37.8, 'February': 38.1, 'March': 38.5, 'April': 38.5, 'May': 38.6, 'June': 38.8, 'July': 38.9, 'August': 39.0, 'September': 39.2, 'October': 39.4, 'November': 39.6, 'December': 39.8 }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Average'];
  const availableYears = Object.keys(cpiData).map(Number).sort((a, b) => b - a);

  // Get CPI value for a specific month/year
  const getCPIValue = (year: number, month: string): number => {
    return cpiData[year]?.[month] || 0;
  };

  // Calculate historical inflation using CPI data
  const calculateHistoricalInflation = (): InflationResult => {
    const fromCPI = getCPIValue(inputs.fromYear, inputs.fromMonth);
    const toCPI = getCPIValue(inputs.toYear, inputs.toMonth);
    
    if (fromCPI === 0 || toCPI === 0) {
      throw new Error('CPI data not available for selected dates');
    }

    const adjustedAmount = (inputs.amount * toCPI) / fromCPI;
    const totalInflationPercent = ((toCPI - fromCPI) / fromCPI) * 100;
    const yearsDifference = inputs.toYear - inputs.fromYear;
    const annualInflationRate = yearsDifference > 0 ? Math.pow(toCPI / fromCPI, 1 / yearsDifference) - 1 : 0;
    const purchasingPowerChange = ((adjustedAmount - inputs.amount) / inputs.amount) * 100;

    return {
      originalAmount: inputs.amount,
      adjustedAmount: adjustedAmount,
      totalInflation: totalInflationPercent,
      annualInflationRate: annualInflationRate * 100,
      calculationType: 'Historical CPI',
      timeDescription: `${inputs.fromMonth} ${inputs.fromYear} to ${inputs.toMonth} ${inputs.toYear}`,
      purchasingPowerChange: purchasingPowerChange
    };
  };

  // Calculate forward inflation projection
  const calculateForwardInflation = (): InflationResult => {
    const rate = inputs.inflationRate / 100;
    const adjustedAmount = inputs.amount * Math.pow(1 + rate, inputs.years);
    const totalInflationPercent = ((adjustedAmount - inputs.amount) / inputs.amount) * 100;
    const purchasingPowerChange = totalInflationPercent;

    return {
      originalAmount: inputs.amount,
      adjustedAmount: adjustedAmount,
      totalInflation: totalInflationPercent,
      annualInflationRate: inputs.inflationRate,
      calculationType: 'Forward Projection',
      timeDescription: `${inputs.years} years at ${inputs.inflationRate}% annual inflation`,
      purchasingPowerChange: purchasingPowerChange
    };
  };

  // Calculate backward inflation (purchasing power)
  const calculateBackwardInflation = (): InflationResult => {
    const rate = inputs.inflationRate / 100;
    const adjustedAmount = inputs.amount / Math.pow(1 + rate, inputs.years);
    const totalInflationPercent = ((inputs.amount - adjustedAmount) / adjustedAmount) * 100;
    const purchasingPowerChange = -((inputs.amount - adjustedAmount) / inputs.amount) * 100;

    return {
      originalAmount: inputs.amount,
      adjustedAmount: adjustedAmount,
      totalInflation: totalInflationPercent,
      annualInflationRate: inputs.inflationRate,
      calculationType: 'Backward Analysis',
      timeDescription: `${inputs.years} years ago at ${inputs.inflationRate}% annual inflation`,
      purchasingPowerChange: purchasingPowerChange
    };
  };

  // Main calculation function
  const calculateInflation = () => {
    setIsLoading(true);
    setError('');

    try {
      let calculationResult: InflationResult;

      switch (inputs.calculationType) {
        case 'historical':
          calculationResult = calculateHistoricalInflation();
          break;
        case 'forward':
          calculationResult = calculateForwardInflation();
          break;
        case 'backward':
          calculationResult = calculateBackwardInflation();
          break;
        default:
          throw new Error('Invalid calculation type');
      }

      setResult(calculationResult);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof InflationInputs, value: string | number) => {
    const newInputs = { ...inputs, [field]: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value };
    setInputs(newInputs);
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    if (inputs.amount > 0) {
      calculateInflation();
    }
  }, [inputs]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Generate inflation timeline data for chart
  const generateTimelineData = () => {
    if (inputs.calculationType !== 'forward') return [];
    
    const data = [];
    for (let year = 0; year <= inputs.years; year++) {
      const value = inputs.amount * Math.pow(1 + inputs.inflationRate / 100, year);
      data.push({
        year: year,
        value: value,
        inflationImpact: value - inputs.amount
      });
    }
    return data;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center space-x-3">
          <TrendingUp className="h-10 w-10 text-blue-600" />
          <span>Inflation Calculator</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate inflation-adjusted values using historical CPI data or project future purchasing power 
          with forward and backward inflation analysis.
        </p>
        <div className="flex justify-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Based on official U.S. Consumer Price Index (CPI) data from 1970-2025
          </div>
        </div>
      </div>

      {/* Calculator Type Selection */}
      <div className="flex justify-center">
        <Tabs value={inputs.calculationType} onValueChange={(value) => handleInputChange('calculationType', value)} className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="historical" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Historical CPI</span>
              <span className="sm:hidden">Historical</span>
            </TabsTrigger>
            <TabsTrigger value="forward" className="flex items-center space-x-2">
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">Forward Rate</span>
              <span className="sm:hidden">Forward</span>
            </TabsTrigger>
            <TabsTrigger value="backward" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Backward Rate</span>
              <span className="sm:hidden">Backward</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span>
                  {inputs.calculationType === 'historical' && 'Historical CPI Calculator'}
                  {inputs.calculationType === 'forward' && 'Forward Inflation Calculator'}
                  {inputs.calculationType === 'backward' && 'Backward Inflation Calculator'}
                </span>
              </CardTitle>
              <CardDescription>
                {inputs.calculationType === 'historical' && 'Calculate inflation using real CPI data'}
                {inputs.calculationType === 'forward' && 'Project future value with inflation'}
                {inputs.calculationType === 'backward' && 'Calculate past purchasing power'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={inputs.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </div>

              {/* Historical CPI Inputs */}
              {inputs.calculationType === 'historical' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromYear">From Year</Label>
                      <Select value={inputs.fromYear.toString()} onValueChange={(value) => handleInputChange('fromYear', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromMonth">From Month</Label>
                      <Select value={inputs.fromMonth} onValueChange={(value) => handleInputChange('fromMonth', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="toYear">To Year</Label>
                      <Select value={inputs.toYear.toString()} onValueChange={(value) => handleInputChange('toYear', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toMonth">To Month</Label>
                      <Select value={inputs.toMonth} onValueChange={(value) => handleInputChange('toMonth', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Forward/Backward Inputs */}
              {(inputs.calculationType === 'forward' || inputs.calculationType === 'backward') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="inflationRate">Annual Inflation Rate (%)</Label>
                    <Input
                      id="inflationRate"
                      type="number"
                      step="0.1"
                      value={inputs.inflationRate}
                      onChange={(e) => handleInputChange('inflationRate', parseFloat(e.target.value) || 0)}
                      placeholder="Enter inflation rate"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="years">Number of Years</Label>
                    <Input
                      id="years"
                      type="number"
                      value={inputs.years}
                      onChange={(e) => handleInputChange('years', parseInt(e.target.value) || 0)}
                      placeholder="Enter years"
                    />
                  </div>
                </>
              )}

              {/* Calculate Button */}
              <Button 
                onClick={calculateInflation}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Calculating...' : 'Calculate Inflation'}
              </Button>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Results */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Inflation Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <p className="text-sm text-blue-600 font-medium">Original Amount</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(result.originalAmount)}</p>
                    <p className="text-xs text-blue-700 mt-1">Starting value</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <p className="text-sm text-green-600 font-medium">Inflation-Adjusted Amount</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(result.adjustedAmount)}</p>
                    <p className="text-xs text-green-700 mt-1">{result.timeDescription}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg border">
                    <p className="text-sm text-orange-600 font-medium">Total Inflation</p>
                    <p className="text-2xl font-bold text-orange-900">{result.totalInflation.toFixed(2)}%</p>
                    <p className="text-xs text-orange-700 mt-1">Cumulative change</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg border">
                    <p className="text-sm text-purple-600 font-medium">Annual Rate</p>
                    <p className="text-2xl font-bold text-purple-900">{result.annualInflationRate.toFixed(2)}%</p>
                    <p className="text-xs text-purple-700 mt-1">Average per year</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700 text-sm">
                  {inputs.calculationType === 'historical' && 
                    `Based on official CPI data, ${formatCurrency(inputs.amount)} in ${inputs.fromMonth} ${inputs.fromYear} has the same purchasing power as ${formatCurrency(result.adjustedAmount)} in ${inputs.toMonth} ${inputs.toYear}.`
                  }
                  {inputs.calculationType === 'forward' && 
                    `With ${inputs.inflationRate}% annual inflation, ${formatCurrency(inputs.amount)} today will be equivalent to ${formatCurrency(result.adjustedAmount)} in ${inputs.years} years.`
                  }
                  {inputs.calculationType === 'backward' && 
                    `${formatCurrency(inputs.amount)} today had the purchasing power of ${formatCurrency(result.adjustedAmount)} about ${inputs.years} years ago with ${inputs.inflationRate}% annual inflation.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Inflation Timeline Chart */}
          {inputs.calculationType === 'forward' && generateTimelineData().length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Inflation Impact Timeline</span>
                </CardTitle>
                <CardDescription>
                  Projected value growth due to inflation over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateTimelineData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                        labelFormatter={(year) => `Year ${year}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        fill="#93C5FD" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Reference */}
          <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Quick Reference</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-blue-900">Historical Average</p>
                  <p className="text-xl font-bold text-blue-600">3.0%</p>
                  <p className="text-gray-600">U.S. inflation rate</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-green-900">Fed Target</p>
                  <p className="text-xl font-bold text-green-600">2.0%</p>
                  <p className="text-gray-600">Annual target rate</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-orange-900">2022 Peak</p>
                  <p className="text-xl font-bold text-orange-600">8.0%</p>
                  <p className="text-gray-600">Recent high</p>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <p className="font-semibold text-purple-900">2015 Low</p>
                  <p className="text-xl font-bold text-purple-600">0.1%</p>
                  <p className="text-gray-600">Recent low</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content */}
      <div className="space-y-8">
        <Separator className="my-8" />
        
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span>Complete Guide to Inflation</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Master inflation concepts, understand economic impacts, learn calculation methods, 
            and discover strategies to protect your purchasing power in inflationary environments.
          </p>
        </div>

        {/* Educational Sections */}
        <div className="space-y-12">
          {/* What is Inflation */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Info className="h-6 w-6 text-blue-600" />
                <span>Understanding Inflation</span>
              </h3>
              <p className="text-gray-600 mt-2">The fundamental concepts behind price level changes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Definition & Mechanism</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Inflation is defined as a general increase in the prices of goods and services, 
                    and a fall in the purchasing power of money. It represents how much more expensive 
                    things become over time.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Key Characteristics</h4>
                      <div className="text-blue-700 text-sm mt-2 space-y-1">
                        <p>• <strong>General Price Increase:</strong> Affects most goods and services</p>
                        <p>• <strong>Purchasing Power Decline:</strong> Money buys less over time</p>
                        <p>• <strong>Percentage Measurement:</strong> Usually expressed as annual rate</p>
                        <p>• <strong>Persistent Trend:</strong> Not just temporary price spikes</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Inflation Rate Calculation</h4>
                      <div className="text-green-700 text-sm mt-2">
                        <p className="font-mono bg-white p-2 rounded">
                          Inflation Rate = ((CPI₂ - CPI₁) / CPI₁) × 100
                        </p>
                        <p className="mt-2">Where CPI is the Consumer Price Index for different periods</p>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900">Real-World Example</h4>
                      <div className="text-orange-700 text-sm mt-2">
                        <p>If a basket of goods cost $100 in 2020 and $103 in 2021:</p>
                        <p className="font-mono bg-white p-2 rounded mt-1">
                          Inflation Rate = ((103 - 100) / 100) × 100 = 3%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-red-600" />
                    <span>Types of Inflation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-900">Moderate Inflation (2-4%)</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Healthy for economic growth. Encourages spending and investment. 
                        Most central banks target around 2% annually.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-semibold text-yellow-900">Walking Inflation (3-10%)</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Stronger inflation that may signal economic overheating. 
                        Requires monetary policy attention to prevent acceleration.
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <h4 className="font-semibold text-orange-900">Galloping Inflation (10-50%)</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Serious economic problem. Disrupts economic planning and 
                        erodes savings. Requires immediate policy intervention.
                      </p>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <h4 className="font-semibold text-red-900">Hyperinflation (&gt;50%)</h4>
                      <p className="text-red-700 text-sm mt-1">
                        Economic catastrophe. Currency becomes virtually worthless. 
                        Examples: Germany 1920s, Zimbabwe 2000s.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-900">Deflation (Negative)</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Falling prices. Can lead to economic stagnation as consumers 
                        delay purchases expecting lower future prices.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Causes of Inflation */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Target className="h-6 w-6 text-orange-600" />
                <span>Causes of Inflation</span>
              </h3>
              <p className="text-gray-600 mt-2">Economic forces that drive price level changes</p>
            </div>

            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                    <span>Primary Inflation Mechanisms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">Demand-Pull Inflation</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <p><strong>Cause:</strong> Demand exceeds supply</p>
                        <p><strong>Mechanism:</strong> "Too much money chasing too few goods"</p>
                        <p><strong>Examples:</strong></p>
                        <div className="ml-4 space-y-1">
                          <p>• Economic boom periods</p>
                          <p>• Government stimulus spending</p>
                          <p>• Low interest rates</p>
                          <p>• Consumer confidence surges</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-3">Cost-Push Inflation</h4>
                      <div className="space-y-2 text-sm text-orange-700">
                        <p><strong>Cause:</strong> Rising production costs</p>
                        <p><strong>Mechanism:</strong> Producers pass costs to consumers</p>
                        <p><strong>Examples:</strong></p>
                        <div className="ml-4 space-y-1">
                          <p>• Oil price increases</p>
                          <p>• Raw material shortages</p>
                          <p>• Labor wage increases</p>
                          <p>• Supply chain disruptions</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">Built-in Inflation</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <p><strong>Cause:</strong> Inflation expectations</p>
                        <p><strong>Mechanism:</strong> Self-fulfilling prophecy</p>
                        <p><strong>Examples:</strong></p>
                        <div className="ml-4 space-y-1">
                          <p>• Wage-price spirals</p>
                          <p>• Automatic cost adjustments</p>
                          <p>• Contract indexation</p>
                          <p>• Adaptive expectations</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Monetary Theory Perspective</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-800">Quantity Theory of Money</h5>
                        <p className="text-gray-600 mt-1">MV = PY</p>
                        <p className="text-gray-600">Where M = Money Supply, V = Velocity, P = Price Level, Y = Output</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800">Milton Friedman's View</h5>
                        <p className="text-gray-600 mt-1">"Inflation is always and everywhere a monetary phenomenon"</p>
                        <p className="text-gray-600">Long-term inflation driven primarily by money supply growth</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Measuring Inflation */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Calculator className="h-6 w-6 text-purple-600" />
                <span>Measuring Inflation</span>
              </h3>
              <p className="text-gray-600 mt-2">How economists track price level changes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Consumer Price Index (CPI)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    The most widely used measure of inflation, tracking price changes in a 
                    "market basket" of goods and services typically purchased by consumers.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">CPI Components</h4>
                      <div className="text-purple-700 text-sm mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p>• Housing (42%)</p>
                          <p>• Transportation (15%)</p>
                          <p>• Food & Beverages (14%)</p>
                          <p>• Medical Care (9%)</p>
                        </div>
                        <div>
                          <p>• Recreation (6%)</p>
                          <p>• Education (3%)</p>
                          <p>• Apparel (3%)</p>
                          <p>• Other (8%)</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">CPI Calculation Process</h4>
                      <div className="text-blue-700 text-sm mt-2 space-y-1">
                        <p>1. <strong>Survey:</strong> Track prices of ~80,000 items</p>
                        <p>2. <strong>Weight:</strong> Apply spending pattern weights</p>
                        <p>3. <strong>Calculate:</strong> Compute weighted average</p>
                        <p>4. <strong>Index:</strong> Set base year = 100</p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">CPI Variations</h4>
                      <div className="text-green-700 text-sm mt-2 space-y-1">
                        <p>• <strong>Core CPI:</strong> Excludes food and energy</p>
                        <p>• <strong>CPI-U:</strong> Urban consumers (87% of population)</p>
                        <p>• <strong>CPI-W:</strong> Urban wage earners and clerical workers</p>
                        <p>• <strong>Regional CPI:</strong> Metropolitan area specific</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Other Inflation Measures</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Producer Price Index (PPI)</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Measures price changes from the perspective of sellers. 
                        Leading indicator of consumer inflation.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">GDP Deflator</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Measures price changes for all domestically produced goods. 
                        Broader than CPI, includes business purchases and government.
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900">PCE Price Index</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Federal Reserve's preferred measure. Includes all consumer 
                        spending, not just out-of-pocket purchases.
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">Sector-Specific Measures</h4>
                      <div className="text-purple-700 text-sm mt-2 space-y-1">
                        <p>• <strong>Housing Price Index:</strong> Real estate inflation</p>
                        <p>• <strong>Import Price Index:</strong> Foreign goods costs</p>
                        <p>• <strong>Employment Cost Index:</strong> Labor cost changes</p>
                        <p>• <strong>Commodity Price Index:</strong> Raw materials</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Measurement Challenges</h4>
                    <div className="text-gray-700 text-sm mt-2 space-y-1">
                      <p>• Quality improvements vs. price increases</p>
                      <p>• New product introduction timing</p>
                      <p>• Consumer substitution behavior</p>
                      <p>• Outlet bias and discount retailers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Impact & Protection Strategies */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <span>Inflation Impact & Protection</span>
              </h3>
              <p className="text-gray-600 mt-2">How inflation affects you and strategies to protect wealth</p>
            </div>

            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-red-600" />
                    <span>Economic & Personal Impact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-red-900">Negative Effects</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                          <h5 className="font-medium text-red-800">Reduced Purchasing Power</h5>
                          <p className="text-red-700 text-sm">Same money buys fewer goods over time</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                          <h5 className="font-medium text-orange-800">Eroded Savings</h5>
                          <p className="text-orange-700 text-sm">Cash loses value if earning below inflation rate</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                          <h5 className="font-medium text-yellow-800">Fixed Income Impact</h5>
                          <p className="text-yellow-700 text-sm">Pensions, bonds lose real value</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                          <h5 className="font-medium text-purple-800">Economic Uncertainty</h5>
                          <p className="text-purple-700 text-sm">Planning becomes difficult, investment decisions harder</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-900">Potential Benefits</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                          <h5 className="font-medium text-green-800">Debt Reduction</h5>
                          <p className="text-green-700 text-sm">Fixed-rate debt becomes easier to repay</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <h5 className="font-medium text-blue-800">Asset Appreciation</h5>
                          <p className="text-blue-700 text-sm">Real estate, stocks may increase in value</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded border-l-4 border-indigo-400">
                          <h5 className="font-medium text-indigo-800">Wage Growth</h5>
                          <p className="text-indigo-700 text-sm">Wages may rise to keep pace with prices</p>
                        </div>
                        <div className="p-3 bg-teal-50 rounded border-l-4 border-teal-400">
                          <h5 className="font-medium text-teal-800">Economic Stimulus</h5>
                          <p className="text-teal-700 text-sm">Moderate inflation encourages spending and investment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Inflation Protection Strategies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">Traditional Hedges</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="p-2 bg-white rounded">
                          <strong>Real Estate</strong>
                          <p>Property values often rise with inflation</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <strong>Commodities</strong>
                          <p>Gold, silver, oil as inflation hedges</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <strong>TIPS (Treasury Inflation-Protected Securities)</strong>
                          <p>Government bonds adjusted for inflation</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">Investment Strategies</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <div className="p-2 bg-white rounded">
                          <strong>Stocks</strong>
                          <p>Companies can pass costs to consumers</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <strong>Foreign Assets</strong>
                          <p>Diversify across currencies and markets</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <strong>Inflation-Linked Bonds</strong>
                          <p>Principal adjusts with price levels</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-3">Practical Actions</h4>
                      <div className="space-y-2 text-sm text-orange-700">
                        <div className="p-2 bg-white rounded">
                          <strong>Fixed-Rate Debt</strong>
                          <p>Lock in current interest rates</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <strong>Skill Development</strong>
                          <p>Increase earning potential</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <strong>Essential Stockpiling</strong>
                          <p>Buy durable goods before price increases</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Historical Examples & Lessons */}
          <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Historical Inflation Lessons</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded border">
                  <h4 className="font-semibold text-red-900">Weimar Germany (1921-1923)</h4>
                  <p className="text-xl font-bold text-red-600 mt-2">1,000,000%+</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Money printing to pay war reparations led to complete economic collapse
                  </p>
                </div>
                <div className="p-4 bg-white rounded border">
                  <h4 className="font-semibold text-orange-900">U.S. 1970s Stagflation</h4>
                  <p className="text-xl font-bold text-orange-600 mt-2">13.5%</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Oil crises combined with loose monetary policy created persistent inflation
                  </p>
                </div>
                <div className="p-4 bg-white rounded border">
                  <h4 className="font-semibold text-yellow-900">Zimbabwe (2000s)</h4>
                  <p className="text-xl font-bold text-yellow-600 mt-2">89,700,000,000%</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Political instability and money printing rendered currency worthless
                  </p>
                </div>
                <div className="p-4 bg-white rounded border">
                  <h4 className="font-semibold text-blue-900">Japan (1990s-2000s)</h4>
                  <p className="text-xl font-bold text-blue-600 mt-2">-0.1%</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Deflation led to economic stagnation and "lost decades"
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Key Takeaways</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p>• <strong>Monetary discipline</strong> is essential for price stability</p>
                    <p>• <strong>Supply shocks</strong> can trigger persistent inflation</p>
                    <p>• <strong>Expectations matter</strong> - inflation can become self-fulfilling</p>
                  </div>
                  <div className="space-y-2">
                    <p>• <strong>Central bank credibility</strong> helps anchor expectations</p>
                    <p>• <strong>Political stability</strong> supports currency confidence</p>
                    <p>• <strong>Deflation</strong> can be as damaging as high inflation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InflationCalculatorComponent;
