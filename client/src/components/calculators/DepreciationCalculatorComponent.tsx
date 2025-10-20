import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Info, 
  Calculator, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

type DepreciationMethod = 'straightLine' | 'decliningBalance' | 'sumOfYears';

interface DepreciationInputs {
  depreciationMethod: DepreciationMethod;
  assetCost: number;
  salvageValue: number;
  depreciationYears: number;
  depreciationFactor: number; // For declining balance (2 = double declining)
  roundToDollars: boolean;
  partialYear: boolean;
  monthsInFirstYear: number; // For partial year depreciation
}

interface YearlyDepreciation {
  year: number;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

const DepreciationCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<DepreciationInputs>({
    depreciationMethod: 'straightLine',
    assetCost: 11000,
    salvageValue: 1000,
    depreciationYears: 5,
    depreciationFactor: 2,
    roundToDollars: false,
    partialYear: false,
    monthsInFirstYear: 12
  });

  const [schedule, setSchedule] = useState<YearlyDepreciation[]>([]);

  useEffect(() => {
    calculateDepreciation();
  }, [
    inputs.depreciationMethod,
    inputs.assetCost,
    inputs.salvageValue,
    inputs.depreciationYears,
    inputs.depreciationFactor,
    inputs.roundToDollars,
    inputs.partialYear,
    inputs.monthsInFirstYear
  ]);

  const roundValue = (value: number): number => {
    return inputs.roundToDollars ? Math.round(value) : Math.round(value * 100) / 100;
  };

  const calculateStraightLine = (): YearlyDepreciation[] => {
    const depreciableAmount = inputs.assetCost - inputs.salvageValue;
    const annualDepreciation = depreciableAmount / inputs.depreciationYears;
    const schedule: YearlyDepreciation[] = [];

    let accumulatedDepreciation = 0;
    const totalYears = inputs.partialYear ? inputs.depreciationYears + 1 : inputs.depreciationYears;

    for (let year = 1; year <= totalYears; year++) {
      let depreciationExpense: number;
      
      if (inputs.partialYear) {
        if (year === 1) {
          // First partial year
          depreciationExpense = annualDepreciation * (inputs.monthsInFirstYear / 12);
        } else if (year === totalYears) {
          // Last partial year
          depreciationExpense = annualDepreciation * ((12 - inputs.monthsInFirstYear) / 12);
        } else {
          // Full years in between
          depreciationExpense = annualDepreciation;
        }
      } else {
        depreciationExpense = annualDepreciation;
      }

      const beginningBookValue = inputs.assetCost - accumulatedDepreciation;
      accumulatedDepreciation += depreciationExpense;
      const endingBookValue = inputs.assetCost - accumulatedDepreciation;

      schedule.push({
        year,
        beginningBookValue: roundValue(beginningBookValue),
        depreciationExpense: roundValue(depreciationExpense),
        accumulatedDepreciation: roundValue(accumulatedDepreciation),
        endingBookValue: roundValue(Math.max(endingBookValue, inputs.salvageValue))
      });
    }

    return schedule;
  };

  const calculateDecliningBalance = (): YearlyDepreciation[] => {
    const depreciationRate = inputs.depreciationFactor / inputs.depreciationYears;
    const schedule: YearlyDepreciation[] = [];

    let bookValue = inputs.assetCost;
    let accumulatedDepreciation = 0;
    const totalYears = inputs.partialYear ? inputs.depreciationYears + 1 : inputs.depreciationYears;

    for (let year = 1; year <= totalYears; year++) {
      const beginningBookValue = bookValue;
      let depreciationExpense: number;

      if (inputs.partialYear) {
        if (year === 1) {
          // First partial year
          depreciationExpense = bookValue * depreciationRate * (inputs.monthsInFirstYear / 12);
        } else if (year === totalYears) {
          // Last partial year - depreciate remaining down to salvage value
          depreciationExpense = Math.max(0, bookValue - inputs.salvageValue);
        } else {
          // Full years in between
          depreciationExpense = bookValue * depreciationRate;
        }
      } else {
        depreciationExpense = bookValue * depreciationRate;
      }

      // Don't depreciate below salvage value
      if (bookValue - depreciationExpense < inputs.salvageValue) {
        depreciationExpense = Math.max(0, bookValue - inputs.salvageValue);
      }

      accumulatedDepreciation += depreciationExpense;
      bookValue -= depreciationExpense;

      schedule.push({
        year,
        beginningBookValue: roundValue(beginningBookValue),
        depreciationExpense: roundValue(depreciationExpense),
        accumulatedDepreciation: roundValue(accumulatedDepreciation),
        endingBookValue: roundValue(bookValue)
      });

      // Stop if we've reached salvage value
      if (bookValue <= inputs.salvageValue) {
        break;
      }
    }

    return schedule;
  };

  const calculateSumOfYears = (): YearlyDepreciation[] => {
    const depreciableAmount = inputs.assetCost - inputs.salvageValue;
    const sumOfYears = (inputs.depreciationYears * (inputs.depreciationYears + 1)) / 2;
    const schedule: YearlyDepreciation[] = [];

    let accumulatedDepreciation = 0;
    const totalYears = inputs.partialYear ? inputs.depreciationYears + 1 : inputs.depreciationYears;

    for (let year = 1; year <= totalYears; year++) {
      let depreciationExpense: number;
      
      if (inputs.partialYear) {
        if (year === 1) {
          // First partial year
          const factor = inputs.depreciationYears / sumOfYears;
          depreciationExpense = depreciableAmount * factor * (inputs.monthsInFirstYear / 12);
        } else if (year === totalYears) {
          // Last partial year
          const factor = 1 / sumOfYears;
          depreciationExpense = depreciableAmount * factor * ((12 - inputs.monthsInFirstYear) / 12);
        } else {
          // Full years in between - adjust for partial first year
          const remainingFactor = (inputs.depreciationYears - year + 1) / sumOfYears;
          const previousFactor = (inputs.depreciationYears - year + 2) / sumOfYears;
          
          // Calculate the blended depreciation for this year
          const firstPartFactor = previousFactor * ((12 - inputs.monthsInFirstYear) / 12);
          const secondPartFactor = remainingFactor * (inputs.monthsInFirstYear / 12);
          depreciationExpense = depreciableAmount * (firstPartFactor + secondPartFactor);
        }
      } else {
        const factor = (inputs.depreciationYears - year + 1) / sumOfYears;
        depreciationExpense = depreciableAmount * factor;
      }

      const beginningBookValue = inputs.assetCost - accumulatedDepreciation;
      accumulatedDepreciation += depreciationExpense;
      const endingBookValue = inputs.assetCost - accumulatedDepreciation;

      schedule.push({
        year,
        beginningBookValue: roundValue(beginningBookValue),
        depreciationExpense: roundValue(depreciationExpense),
        accumulatedDepreciation: roundValue(accumulatedDepreciation),
        endingBookValue: roundValue(Math.max(endingBookValue, inputs.salvageValue))
      });
    }

    return schedule;
  };

  const calculateDepreciation = () => {
    if (inputs.assetCost <= 0 || inputs.depreciationYears <= 0) {
      setSchedule([]);
      return;
    }

    if (inputs.salvageValue >= inputs.assetCost) {
      setSchedule([]);
      return;
    }

    let newSchedule: YearlyDepreciation[] = [];

    switch (inputs.depreciationMethod) {
      case 'straightLine':
        newSchedule = calculateStraightLine();
        break;
      case 'decliningBalance':
        newSchedule = calculateDecliningBalance();
        break;
      case 'sumOfYears':
        newSchedule = calculateSumOfYears();
        break;
    }

    setSchedule(newSchedule);
  };

  const handleReset = () => {
    setInputs({
      depreciationMethod: 'straightLine',
      assetCost: 11000,
      salvageValue: 1000,
      depreciationYears: 5,
      depreciationFactor: 2,
      roundToDollars: false,
      partialYear: false,
      monthsInFirstYear: 12
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: inputs.roundToDollars ? 0 : 2,
      maximumFractionDigits: inputs.roundToDollars ? 0 : 2
    }).format(value);
  };

  const totalDepreciation = schedule.length > 0 
    ? schedule[schedule.length - 1].accumulatedDepreciation 
    : 0;

  // Prepare chart data
  const chartData = schedule.map(item => ({
    year: `Year ${item.year}`,
    'Book Value': item.endingBookValue,
    'Accumulated Depreciation': item.accumulatedDepreciation,
    'Depreciation Expense': item.depreciationExpense
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <TrendingDown className="h-8 w-8 text-blue-600" />
          Depreciation Calculator
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Calculate asset depreciation using Straight Line, Declining Balance, or Sum of Years' Digits methods
        </p>
      </div>

      {/* Input Section */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Calculator className="h-6 w-6 text-blue-600" />
            Depreciation Parameters
          </CardTitle>
          <CardDescription>
            Enter your asset details and select the depreciation method
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Depreciation Method */}
            <div className="space-y-2">
              <Label htmlFor="depreciationMethod" className="text-sm font-semibold">
                Depreciation Method
              </Label>
              <Select
                value={inputs.depreciationMethod}
                onValueChange={(value: DepreciationMethod) => 
                  setInputs({ ...inputs, depreciationMethod: value })
                }
              >
                <SelectTrigger id="depreciationMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straightLine">Straight Line</SelectItem>
                  <SelectItem value="decliningBalance">Declining Balance</SelectItem>
                  <SelectItem value="sumOfYears">Sum of Years' Digits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset Cost */}
            <div className="space-y-2">
              <Label htmlFor="assetCost" className="text-sm font-semibold">
                Asset Cost ($)
              </Label>
              <Input
                id="assetCost"
                type="number"
                value={inputs.assetCost}
                onChange={(e) => setInputs({ ...inputs, assetCost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="100"
                className="text-base"
              />
            </div>

            {/* Salvage Value */}
            <div className="space-y-2">
              <Label htmlFor="salvageValue" className="text-sm font-semibold">
                Salvage Value ($)
              </Label>
              <Input
                id="salvageValue"
                type="number"
                value={inputs.salvageValue}
                onChange={(e) => setInputs({ ...inputs, salvageValue: parseFloat(e.target.value) || 0 })}
                min="0"
                step="100"
                className="text-base"
              />
            </div>

            {/* Depreciation Years */}
            <div className="space-y-2">
              <Label htmlFor="depreciationYears" className="text-sm font-semibold">
                Useful Life (Years)
              </Label>
              <Input
                id="depreciationYears"
                type="number"
                value={inputs.depreciationYears}
                onChange={(e) => setInputs({ ...inputs, depreciationYears: parseFloat(e.target.value) || 0 })}
                min="1"
                max="50"
                step="1"
                className="text-base"
              />
            </div>

            {/* Depreciation Factor (only for declining balance) */}
            {inputs.depreciationMethod === 'decliningBalance' && (
              <div className="space-y-2">
                <Label htmlFor="depreciationFactor" className="text-sm font-semibold">
                  Depreciation Factor
                </Label>
                <Input
                  id="depreciationFactor"
                  type="number"
                  value={inputs.depreciationFactor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '-') {
                      setInputs({ ...inputs, depreciationFactor: 0 });
                    } else {
                      setInputs({ ...inputs, depreciationFactor: parseFloat(value) });
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 1) {
                      setInputs({ ...inputs, depreciationFactor: 1 });
                    } else if (value > 3) {
                      setInputs({ ...inputs, depreciationFactor: 3 });
                    }
                  }}
                  min="1"
                  max="3"
                  step="0.1"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">
                  Use 2 for Double Declining Balance (most common)
                </p>
              </div>
            )}

            {/* Months in First Year (only if partial year is enabled) */}
            {inputs.partialYear && (
              <div className="space-y-2">
                <Label htmlFor="monthsInFirstYear" className="text-sm font-semibold">
                  Months in First Year
                </Label>
                <Input
                  id="monthsInFirstYear"
                  type="number"
                  value={inputs.monthsInFirstYear}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '-') {
                      setInputs({ ...inputs, monthsInFirstYear: 0 });
                    } else {
                      setInputs({ ...inputs, monthsInFirstYear: parseFloat(value) });
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 1) {
                      setInputs({ ...inputs, monthsInFirstYear: 1 });
                    } else if (value > 12) {
                      setInputs({ ...inputs, monthsInFirstYear: 12 });
                    } else {
                      setInputs({ ...inputs, monthsInFirstYear: Math.round(value) });
                    }
                  }}
                  min="1"
                  max="12"
                  step="1"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">
                  Number of months the asset is in service during the first year
                </p>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="roundToDollars"
                checked={inputs.roundToDollars}
                onCheckedChange={(checked) => 
                  setInputs({ ...inputs, roundToDollars: checked as boolean })
                }
              />
              <label
                htmlFor="roundToDollars"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Round to dollars?
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="partialYear"
                checked={inputs.partialYear}
                onCheckedChange={(checked) => 
                  setInputs({ ...inputs, partialYear: checked as boolean })
                }
              />
              <label
                htmlFor="partialYear"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Partial year depreciation?
              </label>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-6">
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default Values
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {schedule.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Asset Cost</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(inputs.assetCost)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Salvage Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(inputs.salvageValue)}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Depreciation</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(totalDepreciation)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Final Book Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(schedule[schedule.length - 1].endingBookValue)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Depreciation Schedule Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Book Value Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <defs>
                    <linearGradient id="colorBookValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Book Value" 
                    stroke="#3b82f6" 
                    fill="url(#colorBookValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Annual Depreciation Expense Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Annual Depreciation Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="Depreciation Expense" 
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Depreciation Schedule Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Detailed Depreciation Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700">Year</th>
                      <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700">
                        <span className="hidden sm:inline">Beginning </span>Book Value
                      </th>
                      <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700">
                        Depreciation<span className="hidden sm:inline"> Expense</span>
                      </th>
                      <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700">
                        Accumulated<span className="hidden sm:inline"> Depreciation</span>
                      </th>
                      <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700">
                        <span className="hidden sm:inline">Ending </span>Book Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item, index) => (
                      <tr 
                        key={item.year}
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="py-3 px-2 sm:px-4 font-medium text-gray-900">
                          {item.year}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right text-gray-700">
                          {formatCurrency(item.beginningBookValue)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right text-red-600 font-medium">
                          {formatCurrency(item.depreciationExpense)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right text-gray-700">
                          {formatCurrency(item.accumulatedDepreciation)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right text-blue-600 font-medium">
                          {formatCurrency(item.endingBookValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Method Information */}
          <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    {inputs.depreciationMethod === 'straightLine' && 'Straight-Line Depreciation Method'}
                    {inputs.depreciationMethod === 'decliningBalance' && `${inputs.depreciationFactor === 2 ? 'Double ' : ''}Declining Balance Method`}
                    {inputs.depreciationMethod === 'sumOfYears' && "Sum of Years' Digits Method"}
                  </p>
                  <p>
                    {inputs.depreciationMethod === 'straightLine' && 
                      'Distributes depreciation evenly across the useful life of the asset. This is the simplest and most widely used method.'}
                    {inputs.depreciationMethod === 'decliningBalance' && 
                      'Accelerates depreciation by applying a constant rate to the declining book value. Results in higher expenses early in the asset\'s life.'}
                    {inputs.depreciationMethod === 'sumOfYears' && 
                      'Accelerates depreciation using fractional factors based on remaining life. Provides faster depreciation than straight-line but slower than double declining balance.'}
                  </p>
                  {inputs.partialYear && (
                    <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                      ⓘ Partial year depreciation is enabled. The first year includes only {inputs.monthsInFirstYear} months, 
                      and the final year includes the remaining {12 - inputs.monthsInFirstYear} months.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content */}
      <div className="mt-12 space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Understanding Depreciation in Accounting
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            A comprehensive guide to asset depreciation, calculation methods, tax implications, 
            and how to choose the right approach for your business.
          </p>
        </div>

        {/* What is Depreciation */}
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-blue-900">
              <TrendingDown className="h-6 w-6" />
              What is Depreciation?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                <strong>Depreciation</strong> is an accounting method of allocating the cost of a tangible asset 
                over its useful life. Conceptually, depreciation represents the reduction in value of an asset 
                over time due to wear and tear, age, or obsolescence. For instance, a delivery truck is said to 
                "depreciate" when it accumulates mileage and requires more frequent repairs, or a computer 
                depreciates as newer, faster models make it less valuable.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Why Depreciation Matters in Accounting
                </h4>
                <p className="text-sm">
                  When a company purchases a large asset—such as machinery, vehicles, or equipment—the entire 
                  cost shouldn't appear as an expense in a single year. This would create a misleading picture 
                  of the company's profitability. Instead, depreciation spreads the cost over the asset's 
                  useful life, matching the expense with the revenue the asset helps generate. This follows 
                  the accounting principle of <strong>matching</strong>, where expenses are recognized in 
                  the same period as the related revenues.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-green-900 mb-3">Example: Widget-Making Machine</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Scenario:</strong> Your company purchases a $100,000 machine that will produce 
                    widgets for 10 years. Without depreciation, your income statement would show:
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>Year 1:</strong> $100,000 expense → looks like a terrible year</li>
                    <li>• <strong>Years 2-10:</strong> $0 equipment expense → artificially inflated profits</li>
                  </ul>
                  <p className="mt-2">
                    <strong>With straight-line depreciation:</strong> Each year shows $10,000 depreciation 
                    expense, accurately reflecting the machine's contribution to production across its lifetime.
                  </p>
                </div>
              </div>

              <p>
                In the United States, <strong>depreciation expenses are tax-deductible</strong> for businesses. 
                This means that by depreciating assets, companies can reduce their taxable income, resulting in 
                lower tax bills. The IRS provides guidelines (MACRS - Modified Accelerated Cost Recovery System) 
                for how different types of assets must be depreciated for tax purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Depreciation Methods Comparison */}
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-purple-900">
              <Calculator className="h-6 w-6" />
              Methods of Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 text-sm sm:text-base text-gray-700">
              <p>
                There are several methods for calculating depreciation, each with different patterns of expense 
                recognition. <strong>Importantly, the total depreciation over an asset's life is identical 
                regardless of method</strong>—only the timing differs. The choice of method can significantly 
                impact reported profits in the near term and influence cash flow management.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Key Principle</h4>
                <p className="text-sm">
                  All depreciation methods will result in the same total depreciation over the asset's useful 
                  life. A $10,000 asset with a $1,000 salvage value will have $9,000 of total depreciation 
                  whether you use straight-line, declining balance, or sum of years' digits. The difference 
                  is <em>when</em> those expenses are recognized.
                </p>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-purple-100 border-b-2 border-purple-300">
                      <th className="text-left py-3 px-3 font-semibold text-purple-900">Method</th>
                      <th className="text-left py-3 px-3 font-semibold text-purple-900">Expense Pattern</th>
                      <th className="text-left py-3 px-3 font-semibold text-purple-900">Best For</th>
                      <th className="text-left py-3 px-3 font-semibold text-purple-900">Complexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-purple-100 bg-white">
                      <td className="py-3 px-3 font-medium">Straight-Line</td>
                      <td className="py-3 px-3">Equal every year</td>
                      <td className="py-3 px-3">Buildings, furniture, general equipment</td>
                      <td className="py-3 px-3">Simple</td>
                    </tr>
                    <tr className="border-b border-purple-100 bg-purple-50">
                      <td className="py-3 px-3 font-medium">Declining Balance</td>
                      <td className="py-3 px-3">High early, decreases</td>
                      <td className="py-3 px-3">Vehicles, computers, technology</td>
                      <td className="py-3 px-3">Moderate</td>
                    </tr>
                    <tr className="border-b border-purple-100 bg-white">
                      <td className="py-3 px-3 font-medium">Sum of Years' Digits</td>
                      <td className="py-3 px-3">High early, steady decline</td>
                      <td className="py-3 px-3">Specialized equipment, machinery</td>
                      <td className="py-3 px-3">Moderate</td>
                    </tr>
                    <tr className="bg-purple-50">
                      <td className="py-3 px-3 font-medium">Units of Production</td>
                      <td className="py-3 px-3">Based on usage</td>
                      <td className="py-3 px-3">Manufacturing equipment, mining assets</td>
                      <td className="py-3 px-3">Complex</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Straight-Line Method */}
        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-green-900">
              <BarChart3 className="h-6 w-6" />
              Straight-Line Depreciation Method
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                The <strong>straight-line method</strong> is the most widely used and simplest depreciation 
                method. It distributes the depreciable amount evenly across the asset's useful life, resulting 
                in the same depreciation expense every year.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">Formula:</h4>
                <div className="bg-white p-4 rounded border border-green-300 font-mono text-sm sm:text-base">
                  Annual Depreciation = (Asset Cost - Salvage Value) ÷ Useful Life
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Example Calculation:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Given:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Asset Cost: $11,000</li>
                    <li>• Salvage Value: $1,000</li>
                    <li>• Useful Life: 5 years</li>
                  </ul>
                  <p className="mt-3"><strong>Calculation:</strong></p>
                  <p className="ml-4">Annual Depreciation = ($11,000 - $1,000) ÷ 5 = <strong>$2,000 per year</strong></p>
                  <p className="mt-3"><strong>Depreciation Schedule:</strong></p>
                  <div className="ml-4 space-y-1 font-mono text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <span>Year 1: $2,000</span>
                      <span>Book Value: $9,000</span>
                      <span>Accumulated: $2,000</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span>Year 2: $2,000</span>
                      <span>Book Value: $7,000</span>
                      <span>Accumulated: $4,000</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span>Year 3: $2,000</span>
                      <span>Book Value: $5,000</span>
                      <span>Accumulated: $6,000</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span>Year 4: $2,000</span>
                      <span>Book Value: $3,000</span>
                      <span>Accumulated: $8,000</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span>Year 5: $2,000</span>
                      <span>Book Value: $1,000</span>
                      <span>Accumulated: $10,000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">When to Use Straight-Line</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Assets that provide consistent utility throughout their life (buildings, furniture)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>When simplicity and ease of calculation are priorities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Assets without rapid technological obsolescence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>When you want steady, predictable expenses for financial planning</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Declining Balance Method */}
        <Card className="border-l-4 border-l-orange-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-orange-900">
              <TrendingDown className="h-6 w-6" />
              Declining Balance Depreciation Method
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                The <strong>declining balance method</strong> is an accelerated depreciation method that results 
                in higher depreciation expenses in the early years of an asset's life and lower expenses in 
                later years. This reflects the reality that many assets, particularly technology and vehicles, 
                lose value more rapidly when new.
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-3">Formula:</h4>
                <div className="bg-white p-4 rounded border border-orange-300 space-y-2 font-mono text-sm">
                  <div>Depreciation Rate = Depreciation Factor ÷ Useful Life</div>
                  <div>Annual Depreciation = Book Value × Depreciation Rate</div>
                </div>
                <p className="text-xs text-orange-800 mt-2">
                  Note: Unlike straight-line, salvage value is NOT included in the calculation. However, 
                  depreciation stops once book value reaches salvage value.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Double Declining Balance (DDB)</h4>
                <p className="text-sm">
                  The most common form uses a depreciation factor of <strong>2</strong>, called 
                  "double declining balance" because it applies twice the straight-line rate. For a 5-year 
                  asset, the straight-line rate is 20% per year (100% ÷ 5), so DDB uses 40% (20% × 2).
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Example: Double Declining Balance</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Given:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Asset Cost: $11,000</li>
                    <li>• Salvage Value: $1,000</li>
                    <li>• Useful Life: 5 years</li>
                    <li>• Depreciation Factor: 2 (DDB)</li>
                  </ul>
                  <p className="mt-3"><strong>Calculation:</strong></p>
                  <p className="ml-4">Depreciation Rate = 2 ÷ 5 = 0.40 (40% per year)</p>
                  <p className="mt-3"><strong>Year-by-Year:</strong></p>
                  <div className="ml-4 space-y-1 font-mono text-xs">
                    <div>Year 1: $11,000 × 40% = <strong>$4,400</strong> (Book Value: $6,600)</div>
                    <div>Year 2: $6,600 × 40% = <strong>$2,640</strong> (Book Value: $3,960)</div>
                    <div>Year 3: $3,960 × 40% = <strong>$1,584</strong> (Book Value: $2,376)</div>
                    <div>Year 4: $2,376 × 40% = <strong>$950.40</strong> (Book Value: $1,425.60)</div>
                    <div>Year 5: Limited to $425.60 to reach salvage value of $1,000</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">When to Use Declining Balance</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Technology assets:</strong> Computers, smartphones, software that rapidly become obsolete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Vehicles:</strong> Cars and trucks that lose significant value immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Tax planning:</strong> When you want larger deductions in early years</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Matching expenses with revenue:</strong> When assets generate more revenue early in their life</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sum of Years' Digits Method */}
        <Card className="border-l-4 border-l-red-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-red-900">
              <Calculator className="h-6 w-6" />
              Sum of Years' Digits Method
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                The <strong>Sum of Years' Digits (SYD)</strong> method is another accelerated depreciation 
                approach that results in higher expenses early in an asset's life. It's generally more 
                accelerated than straight-line but less aggressive than double declining balance in the 
                first year.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-3">Formula:</h4>
                <div className="bg-white p-4 rounded border border-red-300 space-y-2 text-sm">
                  <div className="font-mono">Sum of Years = n × (n + 1) ÷ 2</div>
                  <div className="font-mono">Year Factor = (Remaining Life) ÷ (Sum of Years)</div>
                  <div className="font-mono">Annual Depreciation = (Cost - Salvage) × Year Factor</div>
                  <p className="text-xs text-red-800 mt-2">
                    Where <em>n</em> is the total useful life in years
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Example Calculation:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Given:</strong> 5-year useful life asset</p>
                  <p className="mt-2"><strong>Step 1:</strong> Calculate Sum of Years</p>
                  <p className="ml-4 font-mono">Sum = 5 × (5 + 1) ÷ 2 = 15</p>
                  <p className="ml-4 text-xs text-gray-600">Or simply: 1 + 2 + 3 + 4 + 5 = 15</p>
                  
                  <p className="mt-3"><strong>Step 2:</strong> Calculate depreciation factors</p>
                  <div className="ml-4 space-y-1 font-mono text-xs">
                    <div>Year 1 factor: 5/15 = 33.33%</div>
                    <div>Year 2 factor: 4/15 = 26.67%</div>
                    <div>Year 3 factor: 3/15 = 20.00%</div>
                    <div>Year 4 factor: 2/15 = 13.33%</div>
                    <div>Year 5 factor: 1/15 = 6.67%</div>
                  </div>

                  <p className="mt-3"><strong>Step 3:</strong> Apply factors to depreciable amount</p>
                  <p className="ml-4">Depreciable Amount = $11,000 - $1,000 = $10,000</p>
                  <div className="ml-4 space-y-1 font-mono text-xs mt-2">
                    <div>Year 1: $10,000 × 5/15 = <strong>$3,333.33</strong></div>
                    <div>Year 2: $10,000 × 4/15 = <strong>$2,666.67</strong></div>
                    <div>Year 3: $10,000 × 3/15 = <strong>$2,000.00</strong></div>
                    <div>Year 4: $10,000 × 2/15 = <strong>$1,333.33</strong></div>
                    <div>Year 5: $10,000 × 1/15 = <strong>$666.67</strong></div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">When to Use Sum of Years' Digits</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Specialized equipment:</strong> Machinery with greater productivity when new</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Balanced acceleration:</strong> Want faster depreciation than straight-line but smoother than DDB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Manufacturing assets:</strong> Equipment that produces more units early in its life</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partial Year Depreciation */}
        <Card className="border-l-4 border-l-indigo-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-indigo-900">
              <Calendar className="h-6 w-6" />
              Partial Year Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                Not all assets are conveniently purchased at the beginning of the accounting year. 
                <strong> Partial year depreciation</strong> allows you to calculate depreciation for assets 
                placed in service mid-year, ensuring accurate expense allocation based on actual usage.
              </p>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-3">How Partial Year Works:</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    If an asset is purchased on July 1st (middle of the year), it's only used for 6 months 
                    during that fiscal year. The depreciation for the first year is calculated proportionally:
                  </p>
                  <div className="bg-white p-3 rounded border border-indigo-300 mt-2">
                    <p className="font-mono text-xs">First Year Depreciation = Annual Depreciation × (Months Used ÷ 12)</p>
                  </div>
                  <p className="mt-2">
                    The remaining depreciation spills into an additional year at the end. For example, a 
                    5-year asset purchased mid-year will have depreciation spanning 6 fiscal years.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-3">Example: Asset Purchased October 1st</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Given:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Asset Cost: $12,000</li>
                    <li>• Salvage Value: $2,000</li>
                    <li>• Useful Life: 5 years</li>
                    <li>• Purchase Date: October 1st (3 months into service first year)</li>
                    <li>• Method: Straight-Line</li>
                  </ul>
                  <p className="mt-3"><strong>Calculation:</strong></p>
                  <p className="ml-4">Annual Depreciation = ($12,000 - $2,000) ÷ 5 = $2,000</p>
                  <div className="ml-4 space-y-1 font-mono text-xs mt-2">
                    <div>Fiscal Year 1: $2,000 × (3/12) = <strong>$500</strong></div>
                    <div>Fiscal Years 2-5: <strong>$2,000</strong> each</div>
                    <div>Fiscal Year 6: $2,000 × (9/12) = <strong>$1,500</strong></div>
                    <div className="text-green-700 mt-2">Total: $500 + ($2,000×4) + $1,500 = $10,000 ✓</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Important Considerations</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Fiscal year vs calendar year:</strong> Ensure you're calculating based on your company's fiscal year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Convention methods:</strong> Tax depreciation may use half-year, mid-quarter, or mid-month conventions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Consistency:</strong> Use the same method throughout the asset's life</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salvage Value */}
        <Card className="border-l-4 border-l-teal-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-teal-900">
              <DollarSign className="h-6 w-6" />
              Understanding Salvage Value
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                <strong>Salvage value</strong> (also called residual value or scrap value) is the estimated 
                value of an asset at the end of its useful life. This represents what you expect to receive 
                when you sell, scrap, or dispose of the asset after you're done using it.
              </p>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="font-semibold text-teal-900 mb-3">Determining Salvage Value:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold mt-0.5">1.</span>
                    <span>
                      <strong>Research similar assets:</strong> Check auction prices, used equipment dealers, 
                      or industry publications for comparable assets at end-of-life
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold mt-0.5">2.</span>
                    <span>
                      <strong>Consider condition:</strong> Well-maintained assets typically have higher salvage values
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold mt-0.5">3.</span>
                    <span>
                      <strong>Account for technological change:</strong> Technology assets may have near-zero salvage value
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold mt-0.5">4.</span>
                    <span>
                      <strong>Be conservative:</strong> It's better to underestimate salvage value than overestimate
                    </span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Example: Company Vehicle</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><strong>Purchase:</strong> $40,000 new truck</p>
                    <p><strong>Useful Life:</strong> 8 years</p>
                    <p><strong>Expected Mileage:</strong> 150,000 miles</p>
                    <p><strong>Estimated Salvage:</strong> $8,000</p>
                    <p className="text-xs text-green-800 mt-2">
                      Rationale: Similar trucks with 150k miles sell for $7,000-$9,000 at auction
                    </p>
                    <p className="font-mono text-xs mt-2 p-2 bg-white rounded">
                      Depreciable Amount = $40,000 - $8,000 = $32,000
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Example: Computer Equipment</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><strong>Purchase:</strong> $3,000 workstation</p>
                    <p><strong>Useful Life:</strong> 3 years</p>
                    <p><strong>Expected Condition:</strong> Outdated technology</p>
                    <p><strong>Estimated Salvage:</strong> $100 (parts value)</p>
                    <p className="text-xs text-red-800 mt-2">
                      Rationale: Technology becomes obsolete quickly; minimal resale value after 3 years
                    </p>
                    <p className="font-mono text-xs mt-2 p-2 bg-white rounded">
                      Depreciable Amount = $3,000 - $100 = $2,900
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-amber-900 mb-2">Zero Salvage Value</h4>
                <p className="text-sm">
                  Some assets have <strong>no salvage value</strong>—their cost is fully depreciated over 
                  their useful life. This is common for specialized equipment, software, or assets that will 
                  be obsolete or worthless when replaced. When salvage value is $0, the entire purchase 
                  price becomes the depreciable amount.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Implications and Best Practices */}
        <Card className="border-l-4 border-l-cyan-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-cyan-900">
              <Info className="h-6 w-6" />
              Tax Implications and Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-900 mb-3">Book vs. Tax Depreciation</h4>
                <p className="text-sm mb-3">
                  Companies often maintain <strong>two sets of depreciation calculations</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border border-cyan-300">
                    <h5 className="font-semibold text-cyan-900 mb-1">Book Depreciation</h5>
                    <p className="text-xs">
                      Used for financial statements. Companies choose methods that best represent economic 
                      reality (often straight-line for consistency).
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-cyan-300">
                    <h5 className="font-semibold text-cyan-900 mb-1">Tax Depreciation</h5>
                    <p className="text-xs">
                      Used for tax returns. Companies use IRS-mandated MACRS (Modified Accelerated Cost 
                      Recovery System) to maximize tax deductions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Section 179 and Bonus Depreciation</h4>
                <p className="text-sm">
                  U.S. tax law provides special provisions that allow businesses to deduct the full cost of 
                  certain assets in the year of purchase rather than depreciating them over time:
                </p>
                <ul className="space-y-2 text-sm mt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>
                      <strong>Section 179:</strong> Deduct up to $1.16 million (2023 limit) of equipment 
                      purchases immediately, subject to income limitations
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>
                      <strong>Bonus Depreciation:</strong> Deduct a percentage (varies by year) of qualifying 
                      property in the first year, with no dollar limit
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Best Practices</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Maintain detailed records:</strong> Keep purchase invoices, dates placed in 
                      service, and depreciation schedules for audit purposes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Review useful lives annually:</strong> If an asset's condition changes 
                      significantly, consider revising its useful life
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Consult a tax professional:</strong> Depreciation rules are complex and change 
                      frequently; expert guidance ensures compliance and optimization
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Use accounting software:</strong> Automated depreciation tracking reduces errors 
                      and saves time
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Match methods to asset types:</strong> Use straight-line for buildings, 
                      accelerated methods for technology and vehicles
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepreciationCalculatorComponent;
