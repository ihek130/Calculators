import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';

type CompoundFrequency = 'monthly' | 'quarterly' | 'semiannually' | 'annually';
type PaybackFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually';

interface LoanInputs {
  loanAmount: number;
  interestRate: number;
  compound: CompoundFrequency;
  loanTermYears: number;
  loanTermMonths: number;
  payback: PaybackFrequency;
  originationFee: number; // percentage
  documentationFee: number; // flat amount
  otherFees: number; // flat amount
}

interface LoanResults {
  paymentAmount: number;
  numberOfPayments: number;
  totalPayments: number;
  totalInterest: number;
  totalFees: number;
  interestPlusFees: number;
  realAPR: number;
  principalPercent: number;
  interestPercent: number;
  feePercent: number;
  amortizationSchedule: AmortizationRow[];
}

interface AmortizationRow {
  payment: number;
  paymentAmount: number;
  principal: number;
  interest: number;
  balance: number;
}

const BusinessLoanCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<LoanInputs>({
    loanAmount: 10000,
    interestRate: 10,
    compound: 'monthly',
    loanTermYears: 5,
    loanTermMonths: 0,
    payback: 'monthly',
    originationFee: 5,
    documentationFee: 750,
    otherFees: 0
  });

  const [results, setResults] = useState<LoanResults | null>(null);
  const [showAmortization, setShowAmortization] = useState(false);

  useEffect(() => {
    calculateLoan();
  }, [inputs]);

  const getFrequencyMultiplier = (frequency: CompoundFrequency | PaybackFrequency): number => {
    const multipliers: { [key: string]: number } = {
      weekly: 52,
      biweekly: 26,
      monthly: 12,
      quarterly: 4,
      semiannually: 2,
      annually: 1
    };
    return multipliers[frequency] || 12;
  };

  const calculateLoan = () => {
    try {
      const {
        loanAmount,
        interestRate,
        compound,
        loanTermYears,
        loanTermMonths,
        payback,
        originationFee,
        documentationFee,
        otherFees
      } = inputs;

      if (loanAmount <= 0 || interestRate < 0 || (loanTermYears === 0 && loanTermMonths === 0)) {
        setResults(null);
        return;
      }

      // Calculate total loan term in years
      const totalTermYears = loanTermYears + loanTermMonths / 12;

      // Calculate fees
      const originationFeeAmount = (originationFee / 100) * loanAmount;
      const totalFeesAmount = originationFeeAmount + documentationFee + otherFees;

      // Principal amount (loan amount + origination fee rolled into loan)
      const principalWithFees = loanAmount + originationFeeAmount;

      // Get frequency multipliers
      const compoundFreq = getFrequencyMultiplier(compound);
      const paymentFreq = getFrequencyMultiplier(payback);

      // Calculate number of payments
      const numberOfPayments = Math.round(totalTermYears * paymentFreq);

      if (numberOfPayments <= 0) {
        setResults(null);
        return;
      }

      // Convert annual interest rate to rate per payment period
      const periodicRate = (interestRate / 100) / compoundFreq;
      const paymentsPerCompoundPeriod = paymentFreq / compoundFreq;

      // Calculate effective rate per payment period
      const effectiveRate = Math.pow(1 + periodicRate, 1 / paymentsPerCompoundPeriod) - 1;

      // Calculate payment amount using loan payment formula
      let paymentAmount: number;
      if (effectiveRate === 0) {
        paymentAmount = principalWithFees / numberOfPayments;
      } else {
        paymentAmount = principalWithFees * (effectiveRate * Math.pow(1 + effectiveRate, numberOfPayments)) / 
                       (Math.pow(1 + effectiveRate, numberOfPayments) - 1);
      }

      // Calculate total amount paid
      const totalPayments = paymentAmount * numberOfPayments;
      const totalInterest = totalPayments - principalWithFees;

      // Calculate amortization schedule
      const amortizationSchedule: AmortizationRow[] = [];
      let remainingBalance = principalWithFees;

      for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * effectiveRate;
        const principalPayment = paymentAmount - interestPayment;
        remainingBalance -= principalPayment;

        // Prevent negative balance due to floating point errors
        if (i === numberOfPayments) remainingBalance = 0;

        amortizationSchedule.push({
          payment: i,
          paymentAmount: paymentAmount,
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, remainingBalance)
        });
      }

      // Calculate real APR (including fees)
      // Using IRR approach: find rate where NPV of payments equals loan amount minus upfront fees
      const upfrontFees = documentationFee + otherFees; // Fees paid upfront (not rolled into loan)
      const netLoanAmount = loanAmount - upfrontFees;
      
      // Newton-Raphson method to find APR
      let apr = interestRate / 100;
      const maxIterations = 100;
      const tolerance = 0.0001;

      for (let iter = 0; iter < maxIterations; iter++) {
        const ratePerPeriod = apr / paymentFreq;
        let npv = -netLoanAmount;
        let npvDerivative = 0;

        for (let i = 1; i <= numberOfPayments; i++) {
          const discount = Math.pow(1 + ratePerPeriod, i);
          npv += paymentAmount / discount;
          npvDerivative -= (i * paymentAmount) / (paymentFreq * discount * (1 + ratePerPeriod));
        }

        if (Math.abs(npv) < tolerance) break;

        const newApr = apr - npv / npvDerivative;
        if (Math.abs(newApr - apr) < tolerance) break;
        
        apr = newApr;
        if (apr < 0) apr = 0;
        if (apr > 2) apr = 2; // Cap at 200%
      }

      const realAPR = apr * 100;

      // Calculate percentages for pie chart
      const totalCost = totalPayments + upfrontFees;
      const principalPercent = (loanAmount / totalCost) * 100;
      const interestPercent = (totalInterest / totalCost) * 100;
      const feePercent = (totalFeesAmount / totalCost) * 100;

      setResults({
        paymentAmount,
        numberOfPayments,
        totalPayments,
        totalInterest,
        totalFees: totalFeesAmount,
        interestPlusFees: totalInterest + totalFeesAmount,
        realAPR,
        principalPercent,
        interestPercent,
        feePercent,
        amortizationSchedule
      });
    } catch (error) {
      console.error('Error calculating business loan:', error);
      setResults(null);
    }
  };

  const handleInputChange = (field: keyof LoanInputs, value: string | number | CompoundFrequency | PaybackFrequency) => {
    // For compound and payback fields, don't parse as number
    if (field === 'compound' || field === 'payback') {
      setInputs({ ...inputs, [field]: value as any });
    } else {
      setInputs({ ...inputs, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value });
    }
  };

  const handleReset = () => {
    setInputs({
      loanAmount: 10000,
      interestRate: 10,
      compound: 'monthly',
      loanTermYears: 5,
      loanTermMonths: 0,
      payback: 'monthly',
      originationFee: 5,
      documentationFee: 750,
      otherFees: 0
    });
    setShowAmortization(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(3)}%`;
  };

  const getPaybackLabel = (frequency: PaybackFrequency): string => {
    const labels: { [key: string]: string } = {
      weekly: 'Week',
      biweekly: 'Two Weeks',
      monthly: 'Month',
      quarterly: 'Quarter',
      semiannually: 'Six Months',
      annually: 'Year'
    };
    return labels[frequency] || 'Month';
  };

  // Prepare chart data
  const chartData = results ? [
    { name: 'Principal', value: inputs.loanAmount, fill: '#3b82f6' },
    { name: 'Interest', value: results.totalInterest, fill: '#ef4444' },
    { name: 'Fee', value: results.totalFees, fill: '#f59e0b' }
  ] : [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          Business Loan Calculator
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
          Calculate payback amounts, total costs, and true APR for your business loan
        </p>
      </div>

      {/* Calculator Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Calculator className="h-6 w-6 text-blue-600" />
            Loan Details
          </CardTitle>
          <CardDescription>
            Modify the values and click calculate to see your business loan breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Basic Loan Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="loanAmount" className="text-sm font-semibold">
                  Loan Amount ($)
                </Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={inputs.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 0) {
                      setInputs({ ...inputs, loanAmount: 0 });
                    }
                  }}
                  min="0"
                  step="100"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-sm font-semibold">
                  Interest Rate (%)
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  value={inputs.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 0) {
                      setInputs({ ...inputs, interestRate: 0 });
                    }
                  }}
                  min="0"
                  step="0.1"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compound" className="text-sm font-semibold">
                  Compound Frequency
                </Label>
                <Select value={inputs.compound} onValueChange={(value) => handleInputChange('compound', value)}>
                  <SelectTrigger id="compound" className="text-base">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly (APR)</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannually">Semi-annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payback" className="text-sm font-semibold">
                  Pay Back Frequency
                </Label>
                <Select value={inputs.payback} onValueChange={(value) => handleInputChange('payback', value)}>
                  <SelectTrigger id="payback" className="text-base">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Every Week</SelectItem>
                    <SelectItem value="biweekly">Every Two Weeks</SelectItem>
                    <SelectItem value="monthly">Every Month</SelectItem>
                    <SelectItem value="quarterly">Every Quarter</SelectItem>
                    <SelectItem value="semiannually">Every Six Months</SelectItem>
                    <SelectItem value="annually">Every Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loan Term */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Loan Term</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanTermYears" className="text-xs text-gray-600">
                    Years
                  </Label>
                  <Input
                    id="loanTermYears"
                    type="number"
                    value={inputs.loanTermYears}
                    onChange={(e) => handleInputChange('loanTermYears', e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setInputs({ ...inputs, loanTermYears: 0 });
                      }
                    }}
                    min="0"
                    step="1"
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanTermMonths" className="text-xs text-gray-600">
                    Months
                  </Label>
                  <Input
                    id="loanTermMonths"
                    type="number"
                    value={inputs.loanTermMonths}
                    onChange={(e) => handleInputChange('loanTermMonths', e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setInputs({ ...inputs, loanTermMonths: 0 });
                      } else if (value > 11) {
                        setInputs({ ...inputs, loanTermMonths: 11 });
                      }
                    }}
                    min="0"
                    max="11"
                    step="1"
                    className="text-base"
                  />
                </div>
              </div>
            </div>

            {/* Fees */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-gray-900">Loan Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originationFee" className="text-sm font-semibold">
                    Origination Fee (%)
                  </Label>
                  <Input
                    id="originationFee"
                    type="number"
                    value={inputs.originationFee}
                    onChange={(e) => handleInputChange('originationFee', e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setInputs({ ...inputs, originationFee: 0 });
                      }
                    }}
                    min="0"
                    step="0.1"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentationFee" className="text-sm font-semibold">
                    Documentation Fee ($)
                  </Label>
                  <Input
                    id="documentationFee"
                    type="number"
                    value={inputs.documentationFee}
                    onChange={(e) => handleInputChange('documentationFee', e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setInputs({ ...inputs, documentationFee: 0 });
                      }
                    }}
                    min="0"
                    step="10"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherFees" className="text-sm font-semibold">
                    Other Fees ($)
                  </Label>
                  <Input
                    id="otherFees"
                    type="number"
                    value={inputs.otherFees}
                    onChange={(e) => handleInputChange('otherFees', e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setInputs({ ...inputs, otherFees: 0 });
                      }
                    }}
                    min="0"
                    step="10"
                    className="text-base"
                  />
                </div>
              </div>
            </div>

            <div>
              <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Main Result Card */}
          <Card className="shadow-lg border-t-4 border-t-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg sm:text-xl">Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Payback every {getPaybackLabel(inputs.payback)}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {formatCurrency(results.paymentAmount)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Total of {results.numberOfPayments} payments
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">
                          {formatCurrency(results.totalPayments)}
                        </p>
                      </div>
                      <Calculator className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Interest</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                          {formatCurrency(results.totalInterest)}
                        </p>
                      </div>
                      <Percent className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Interest + Fee</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">
                          {formatCurrency(results.interestPlusFees)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-green-500 sm:col-span-2 lg:col-span-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Real Rate (APR)</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">
                          {formatPercent(results.realAPR)}
                        </p>
                      </div>
                      <FileText className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Loan Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[350px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const isMobile = window.innerWidth < 640;
                        return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(1)}%`;
                      }}
                      outerRadius="60%"
                      innerRadius="0%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ 
                        paddingTop: '10px',
                        fontSize: '12px'
                      }}
                      iconSize={10}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-semibold text-blue-900">Principal:</span>
                  <span className="font-bold text-blue-700">{results.principalPercent.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="font-semibold text-red-900">Interest:</span>
                  <span className="font-bold text-red-700">{results.interestPercent.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="font-semibold text-orange-900">Fee:</span>
                  <span className="font-bold text-orange-700">{results.feePercent.toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amortization Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">Amortization Schedule</CardTitle>
                <Button 
                  onClick={() => setShowAmortization(!showAmortization)}
                  variant="outline"
                  size="sm"
                >
                  {showAmortization ? 'Hide' : 'View'} Table
                </Button>
              </div>
            </CardHeader>
            {showAmortization && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="border border-gray-300 p-2 text-left">Payment #</th>
                        <th className="border border-gray-300 p-2 text-right">Payment</th>
                        <th className="border border-gray-300 p-2 text-right">Principal</th>
                        <th className="border border-gray-300 p-2 text-right">Interest</th>
                        <th className="border border-gray-300 p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.amortizationSchedule.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 p-2">{row.payment}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(row.paymentAmount)}</td>
                          <td className="border border-gray-300 p-2 text-right text-blue-700">{formatCurrency(row.principal)}</td>
                          <td className="border border-gray-300 p-2 text-right text-red-700">{formatCurrency(row.interest)}</td>
                          <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}

      {/* Educational Content - Step 2 */}
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Info className="h-6 w-6 text-blue-600" />
            Understanding Business Loans
          </CardTitle>
          <CardDescription>
            Comprehensive guide to business loan types, fees, and financing strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              What Are Business Loans?
            </h2>
            <div className="prose max-w-none">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Business loans, like the name implies, are loans intended for business purposes. Like other loans, 
                the terms require the borrower to pay back both the principal and the interest. Most business loans 
                will require monthly repayments, though some may call for weekly, daily, or interest-only payments. 
                A select few can require repayment when the loans mature.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-3">
                Business loans serve as a critical financial tool for companies at various stages of growth. Whether 
                you're launching a startup, expanding operations, purchasing equipment, or managing cash flow, understanding 
                the different types of business loans available and their associated costs is essential for making informed 
                financial decisions that support your business goals.
              </p>
            </div>
          </section>

          {/* SBA Loans */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              SBA Loans (Small Business Administration)
            </h2>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Key Concept</h3>
              <p className="text-xs sm:text-sm text-green-800">
                Small Business Administration (SBA) loans are federally regulated loans designed to meet the financing 
                needs of many different business types. The SBA guarantees 75% to 90% of the loan amount, encouraging 
                lenders to approve loans by reducing their risk.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">How SBA Loans Work</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                The actual SBA loan funds are not provided by the government, but by banks, local community organizations, 
                or other financial institutions. The SBA's guarantee protects lenders in case of default, which makes them 
                more willing to approve loans for small businesses that might not qualify for conventional financing. However, 
                SBA loans require additional paperwork, extra fees, and approval may take longer than conventional loans.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Common Uses for SBA Loans:</h4>
                <ul className="space-y-1 text-xs sm:text-sm text-blue-800 list-disc list-inside">
                  <li>Business start-ups and acquisitions</li>
                  <li>Working capital to manage operations</li>
                  <li>Real estate purchases for business premises</li>
                  <li>Franchise financing opportunities</li>
                  <li>Debt refinancing to improve terms</li>
                  <li>Business improvements and renovations</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Types of SBA Loans</h3>
              
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">7(a) Loan - Primary SBA Loan</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    This is the primary small business loan offered by the SBA, making up more than 75% of all SBA loans. 
                    Borrowers utilize them for varied purposes including working capital, machinery, equipment, land, new 
                    buildings, and debt financing.
                  </p>
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Maximum Amount:</strong> $5 million<br/>
                      <strong>Terms:</strong> Up to 10 years for working capital, 25 years for fixed assets
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Microloan</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Intended for new or growing small businesses. Borrowers can utilize microloans for everything covered 
                    under 7(a) loans except paying off existing debt or purchasing real estate.
                  </p>
                  <div className="bg-purple-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-purple-800">
                      <strong>Maximum Amount:</strong> $50,000 (average is $15,000)<br/>
                      <strong>Maximum Term:</strong> 6 years
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Real Estate & Equipment Loan (CDC/504)</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Borrowers typically take out CDC/504 Loans for long-term fixed-rate financing of real estate or equipment 
                    and debt refinancing. Cannot be used for working capital or inventory.
                  </p>
                  <div className="bg-green-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-green-800">
                      <strong>Maximum Amount:</strong> $5.5 million<br/>
                      <strong>Terms:</strong> 10, 20, or 25 years
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-red-200 shadow-sm">
                  <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">Disaster Loan</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Business owners can use these loans to repair machinery, property, equipment, inventory, or business 
                    assets damaged or destroyed by a declared disaster including earthquakes, storms, flooding, fires, or 
                    civil unrest.
                  </p>
                  <div className="bg-red-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-red-800">
                      <strong>Maximum Amount:</strong> $2 million
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">SBA Loans: Pros and Cons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg">✓</span> Advantages
                  </h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-green-800">
                    <li>• Lower interest rates than conventional loans</li>
                    <li>• Longer repayment terms (up to 25 years)</li>
                    <li>• Government guarantee reduces lender risk</li>
                    <li>• Accessible to businesses with limited credit history</li>
                    <li>• Flexible use of funds for various purposes</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg">✗</span> Disadvantages
                  </h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-red-800">
                    <li>• Extensive paperwork and documentation required</li>
                    <li>• Longer approval process (weeks to months)</li>
                    <li>• Additional fees beyond interest</li>
                    <li>• Strict regulations limit flexibility</li>
                    <li>• Maximum loan limits may be insufficient</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Other Loan Types */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Other Business Loan Types
            </h2>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Conventional Loans</h3>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <p className="text-xs sm:text-sm text-orange-800">
                  Most conventional business loans come from banks or other financial institutions. Unlike SBA loans, 
                  conventional loans do not offer governmental insurance for lenders. They typically involve higher rates 
                  and shorter terms, but offer a quicker, less regulated process.
                </p>
              </div>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Borrowers with excellent credit may find conventional loans attractive due to potentially lower interest 
                rates and faster approval. Banks offer conventional loans in many different forms, including:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-semibold text-blue-900 text-xs sm:text-sm">Mezzanine Financing</h4>
                  <p className="text-xs text-gray-600 mt-1">Hybrid debt-equity financing for growth</p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-semibold text-green-900 text-xs sm:text-sm">Asset-Based Financing</h4>
                  <p className="text-xs text-gray-600 mt-1">Secured by company assets as collateral</p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-purple-500 shadow-sm">
                  <h4 className="font-semibold text-purple-900 text-xs sm:text-sm">Invoice Financing</h4>
                  <p className="text-xs text-gray-600 mt-1">Advance on outstanding invoices</p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-orange-500 shadow-sm">
                  <h4 className="font-semibold text-orange-900 text-xs sm:text-sm">Business Cash Advances</h4>
                  <p className="text-xs text-gray-600 mt-1">Quick funding based on future sales</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Personal Loans for Business</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Borrowers can sometimes use personal loans for small business purposes. New businesses without established 
                histories and reputations may turn to such loans to avoid the high interest rates on business loans. However, 
                this approach carries personal financial risk, as personal assets may be at stake if the business fails.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Interest-Only Loans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                An interest-only loan differs from standard loans in that borrowers pay only interest for the duration of 
                the loan. The entire principal balance comes due at the loan's maturity date. This structure allows for lower 
                payments during the loan term and might make sense when borrowers expect higher income in the future or plan 
                to refinance before maturity.
              </p>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Important Consideration</h4>
                <p className="text-xs sm:text-sm text-yellow-800">
                  Interest-only loans require careful financial planning. Borrowers must ensure they can repay the full 
                  principal amount when due, either through business profits, refinancing, or other means. Without a solid 
                  repayment strategy, these loans can create significant financial risk.
                </p>
              </div>
            </div>
          </section>

          {/* Business Loan Fees */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Percent className="h-5 w-5 text-red-600" />
              Understanding Business Loan Fees
            </h2>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">Critical Information</h3>
              <p className="text-xs sm:text-sm text-red-800">
                Like many other types of loans, business loans usually involve fees besides interest. These fees can 
                significantly impact the true cost of borrowing. Understanding all fees helps you calculate the real 
                annual percentage rate (APR) and compare loan offers accurately.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Common Loan Fees</h3>
              
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Origination Fee</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Banks charge this fee for the processing and approval of a loan application, which may include verification 
                    of a borrower's information, credit checks, and underwriting. This is one of the most common fees associated 
                    with business loans.
                  </p>
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Typical Range:</strong> 1% to 6% of loan amount<br/>
                      <strong>Payment:</strong> Usually rolled into the cost of the loan<br/>
                      <strong>Example:</strong> On a $100,000 loan with 3% origination fee = $3,000
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Documentation Fee</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    This common fee covers the cost of processing paperwork, preparing loan documents, and administrative 
                    tasks associated with the loan. Unlike the origination fee, this is typically a flat amount rather than 
                    a percentage.
                  </p>
                  <div className="bg-green-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-green-800">
                      <strong>Typical Range:</strong> $250 to $1,500 flat fee<br/>
                      <strong>Payment:</strong> Usually paid upfront or at closing
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Application Fee</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Some lenders charge an upfront application fee to review the loan application. This fee is typically 
                    non-refundable, even if the loan application is denied.
                  </p>
                  <div className="bg-purple-50 p-3 rounded mt-2">
                    <p className="text-xs sm:text-sm text-purple-800">
                      <strong>Typical Range:</strong> $75 to $500<br/>
                      <strong>Note:</strong> Not all lenders charge this fee
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Additional Fees to Watch For</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Besides the origination and documentation fees, some lenders may also charge other fees over the course 
                of the loan:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <h5 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">Monthly Administrative Fees</h5>
                  <p className="text-xs text-gray-600">Recurring charges for account maintenance</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <h5 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">Annual Fees</h5>
                  <p className="text-xs text-gray-600">Yearly charges to keep the loan active</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <h5 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">Service or Processing Fees</h5>
                  <p className="text-xs text-gray-600">Additional charges for loan servicing</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <h5 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">Prepayment Penalties</h5>
                  <p className="text-xs text-gray-600">Fees for paying off the loan early</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <h5 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">Late Payment Fees</h5>
                  <p className="text-xs text-gray-600">Charges for missing payment deadlines</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                  <h5 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">Wire Transfer Fees</h5>
                  <p className="text-xs text-gray-600">Costs for electronic fund transfers</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Important Note</h4>
                <p className="text-xs sm:text-sm text-blue-800">
                  Not all lenders charge these fees, and some expenses (like late payment fees or prepayment penalties) 
                  only apply in certain situations. Always request a complete fee schedule before committing to a loan and 
                  read the loan agreement carefully to understand all potential costs.
                </p>
              </div>
            </div>
          </section>

          {/* True Cost of Borrowing */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              Calculating the True Cost of Borrowing
            </h2>

            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">The Bottom Line</h3>
              <p className="text-xs sm:text-sm text-indigo-800">
                All these fees can make the actual cost or rate of loans higher than the interest rate given by lenders. 
                The calculator above accounts for these expenses and computes the loan's actual cost with fees included, 
                giving you the real Annual Percentage Rate (APR) that reflects the true cost of borrowing.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Understanding Real APR</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                The stated interest rate on a loan doesn't tell the full story. When fees are factored in, the real APR 
                (Annual Percentage Rate) is often significantly higher than the nominal interest rate. This real APR gives 
                borrowers a more accurate assessment of a loan's actual cost, allowing for better comparison between different 
                loan offers.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Example Comparison:</h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <p className="text-xs sm:text-sm text-gray-700">
                      <strong>Loan A:</strong> $10,000 at 8% interest, $500 origination fee, $200 documentation fee<br/>
                      <strong>Real APR:</strong> Approximately 9.5%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <p className="text-xs sm:text-sm text-gray-700">
                      <strong>Loan B:</strong> $10,000 at 9% interest, no fees<br/>
                      <strong>Real APR:</strong> 9.0%
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 italic">
                    Even though Loan A has a lower stated interest rate, Loan B is actually cheaper when fees are included!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Smart Borrowing Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">1. Compare Total Costs</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Don't just compare interest rates. Calculate the total amount you'll repay including all fees to 
                    understand the true cost of each loan option.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">2. Negotiate Fees</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Many fees are negotiable, especially if you have good credit or a strong business history. Don't 
                    hesitate to ask lenders to waive or reduce certain fees.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">3. Understand Payment Terms</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Weekly payments result in more payments per year than monthly, affecting the total interest paid. 
                    Choose a payment frequency that aligns with your cash flow.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                  <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">4. Consider Prepayment</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    If you can afford to pay extra toward the principal, you'll save on interest—but first check if 
                    there's a prepayment penalty.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                  <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">5. Read the Fine Print</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Carefully review all loan documents before signing. Look for hidden fees, variable rate clauses, 
                    and conditions that could increase your costs.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                  <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">6. Match Loan to Purpose</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Choose a loan term that matches the useful life of what you're financing. Don't take a 10-year 
                    loan for equipment that will be obsolete in 5 years.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Choosing the Right Business Loan */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Choosing the Right Business Loan for Your Needs
            </h2>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-teal-900 mb-2 text-sm sm:text-base">Strategic Decision Making</h3>
              <p className="text-xs sm:text-sm text-teal-800">
                Selecting the right business loan requires careful consideration of your company's current financial situation, 
                future growth plans, and specific funding needs. The cheapest loan isn't always the best choice—timing, 
                flexibility, and alignment with business goals are equally important factors.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Questions to Ask Before Borrowing</h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-semibold text-blue-900 text-xs sm:text-sm mb-1">How quickly do I need the funds?</h4>
                  <p className="text-xs text-gray-600">
                    If you need money urgently, conventional loans or online lenders may be better than SBA loans which 
                    can take weeks or months to approve. Emergency situations may require accepting higher rates for faster access.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-semibold text-green-900 text-xs sm:text-sm mb-1">What will I use the money for?</h4>
                  <p className="text-xs text-gray-600">
                    Equipment purchases, real estate, working capital, and inventory each have optimal loan types. Match 
                    the loan term to the useful life of what you're financing—don't take a 10-year loan for short-term 
                    working capital needs.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-purple-500 shadow-sm">
                  <h4 className="font-semibold text-purple-900 text-xs sm:text-sm mb-1">Can my business handle the payments?</h4>
                  <p className="text-xs text-gray-600">
                    Project your cash flow carefully before committing to any loan. Consider seasonal fluctuations, 
                    unexpected expenses, and potential revenue dips. A loan payment you can't make can damage your credit 
                    and business relationships.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-orange-500 shadow-sm">
                  <h4 className="font-semibold text-orange-900 text-xs sm:text-sm mb-1">What collateral can I offer?</h4>
                  <p className="text-xs text-gray-600">
                    Secured loans typically offer better rates than unsecured loans. Real estate, equipment, inventory, 
                    or accounts receivable can serve as collateral, but understand the risk—defaulting means losing these assets.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Red Flags to Avoid</h3>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <ul className="space-y-2 text-xs sm:text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-1">⚠</span>
                    <span><strong>Guaranteed approval:</strong> Legitimate lenders assess creditworthiness. "Guaranteed 
                    approval" often signals predatory lending practices or extremely high rates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-1">⚠</span>
                    <span><strong>Upfront fees before approval:</strong> While application fees exist, be wary of lenders 
                    demanding large upfront payments before loan approval. This is a common scam.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-1">⚠</span>
                    <span><strong>Vague terms:</strong> Any lender unwilling to provide clear, written documentation of 
                    all terms, fees, and conditions should be avoided. Read everything before signing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-1">⚠</span>
                    <span><strong>Pressure tactics:</strong> Legitimate lenders give you time to review offers and compare 
                    options. High-pressure sales tactics suggesting "act now or lose this rate" are warning signs.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Key Takeaways</h2>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>SBA loans</strong> offer lower rates and longer terms but require extensive paperwork and 
                longer approval times. They're ideal for established businesses that can wait for funding.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Conventional loans</strong> provide faster approval and more flexibility but typically have 
                higher interest rates and stricter qualification requirements.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Loan fees</strong> can significantly increase the true cost of borrowing. Always calculate 
                the real APR including all fees to compare loans accurately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>The <strong>origination fee</strong> (1-6% of loan amount) and <strong>documentation fee</strong> 
                ($250-$1,500) are the most common fees but watch for additional charges like prepayment penalties.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Payment frequency</strong> affects total interest paid. More frequent payments (weekly, 
                biweekly) result in less total interest than less frequent payments (monthly, quarterly).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Use this calculator to understand the full cost of any business loan offer, including the real APR 
                that accounts for all fees and the true cost of borrowing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Match your loan term to your business needs—shorter terms mean higher payments but less total interest, 
                while longer terms provide lower payments but cost more overall.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Before borrowing, carefully assess your funding timeline, purpose, cash flow capacity, and available 
                collateral to choose the most appropriate loan type for your situation.</span>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessLoanCalculatorComponent;
