import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, DollarSign, Clock, Target, BarChart3, BookOpen, Shield, Zap, History } from 'lucide-react';

interface CompoundInputs {
  principal: string;
  rate: string;
  time: string;
  timeUnit: string;
  compoundingFrequency: string;
  additionalContribution: string;
  contributionFrequency: string;
  contributionTiming: string;
}

interface CompoundResult {
  futureValue: number;
  totalInterest: number;
  totalContributions: number;
  totalPrincipal: number;
  effectiveAnnualRate: number;
  breakdown: {
    compoundInterest: number;
    simpleInterest: number;
    monthlyBreakdown: Array<{
      month: number;
      balance: number;
      interestEarned: number;
      contribution: number;
    }>;
  };
}

// Compounding frequency mappings
const COMPOUNDING_FREQUENCIES = {
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  semiannually: 2,
  annually: 1,
  continuous: 0
};

const CONTRIBUTION_FREQUENCIES = {
  none: 0,
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  semiannually: 2,
  annually: 1
};

const CompoundInterestCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<CompoundInputs>({
    principal: '10000',
    rate: '7',
    time: '10',
    timeUnit: 'years',
    compoundingFrequency: 'monthly',
    additionalContribution: '500',
    contributionFrequency: 'monthly',
    contributionTiming: 'endOfPeriod'
  });

  const [result, setResult] = useState<CompoundResult | null>(null);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatCurrencyFull = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateCompoundInterest = () => {
    try {
      const P = parseFloat(inputs.principal) || 0;
      const r = (parseFloat(inputs.rate) || 0) / 100;
      const timeValue = parseFloat(inputs.time) || 0;
      const t = inputs.timeUnit === 'months' ? timeValue / 12 : timeValue;
      const n = COMPOUNDING_FREQUENCIES[inputs.compoundingFrequency as keyof typeof COMPOUNDING_FREQUENCIES];
      const additionalContribution = parseFloat(inputs.additionalContribution) || 0;
      const contributionFreq = CONTRIBUTION_FREQUENCIES[inputs.contributionFrequency as keyof typeof CONTRIBUTION_FREQUENCIES];

      if (P <= 0 || t <= 0) {
        setResult(null);
        return;
      }

      let futureValue: number;
      let effectiveAnnualRate: number;

      // Calculate compound interest based on frequency
      if (inputs.compoundingFrequency === 'continuous') {
        // Continuous compounding: A = Pe^(rt)
        futureValue = P * Math.exp(r * t);
        effectiveAnnualRate = Math.exp(r) - 1;
      } else {
        // Standard compounding: A = P(1 + r/n)^(nt)
        futureValue = P * Math.pow(1 + r / n, n * t);
        effectiveAnnualRate = Math.pow(1 + r / n, n) - 1;
      }

      // Handle additional contributions
      let totalContributions = 0;
      let contributionFutureValue = 0;

      if (additionalContribution > 0 && contributionFreq > 0) {
        const contributionPeriods = contributionFreq * t;
        totalContributions = additionalContribution * contributionPeriods;

        if (inputs.compoundingFrequency === 'continuous') {
          // For continuous compounding with regular contributions
          contributionFutureValue = additionalContribution * contributionFreq * 
            (Math.exp(r * t) - 1) / r;
        } else {
          // Standard annuity formula for regular contributions
          const contributionRate = r / contributionFreq;
          if (contributionRate > 0) {
            contributionFutureValue = additionalContribution * 
              (Math.pow(1 + contributionRate, contributionPeriods) - 1) / contributionRate;
            
            // Adjust for contribution timing
            if (inputs.contributionTiming === 'beginningOfPeriod') {
              contributionFutureValue *= (1 + contributionRate);
            }
          } else {
            contributionFutureValue = totalContributions;
          }
        }
      }

      const totalFutureValue = futureValue + contributionFutureValue;
      const totalPrincipal = P + totalContributions;
      const totalInterest = totalFutureValue - totalPrincipal;

      // Calculate simple interest for comparison
      const simpleInterest = P * r * t;

      // Generate monthly breakdown
      const monthlyBreakdown = [];
      const totalMonths = t * 12;
      const monthlyRate = r / 12;
      const monthlyContribution = contributionFreq === 12 ? additionalContribution : 
                                 contributionFreq === 4 ? additionalContribution / 3 :
                                 contributionFreq === 2 ? additionalContribution / 6 :
                                 contributionFreq === 1 ? additionalContribution / 12 :
                                 contributionFreq === 26 ? additionalContribution * 2 / 12 :
                                 contributionFreq === 52 ? additionalContribution / 12 :
                                 contributionFreq === 365 ? additionalContribution * 365 / 12 : 0;

      let currentBalance = P;
      
      for (let month = 1; month <= Math.min(totalMonths, 120); month++) { // Limit to 10 years for display
        const interestEarned = currentBalance * monthlyRate;
        const contribution = month % (12 / (contributionFreq / 12 || 1)) === 0 ? monthlyContribution : 0;
        
        currentBalance += interestEarned + contribution;
        
        monthlyBreakdown.push({
          month,
          balance: currentBalance,
          interestEarned,
          contribution
        });
      }

      const compoundResult: CompoundResult = {
        futureValue: totalFutureValue,
        totalInterest,
        totalContributions,
        totalPrincipal,
        effectiveAnnualRate,
        breakdown: {
          compoundInterest: totalInterest,
          simpleInterest,
          monthlyBreakdown
        }
      };

      setResult(compoundResult);
    } catch (error) {
      console.error('Calculation error:', error);
      setResult(null);
    }
  };

  useEffect(() => {
    calculateCompoundInterest();
  }, [inputs]);

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          Compound Interest Calculator
        </h1>
        <p className="text-gray-600 max-w-3xl mx-auto text-base sm:text-lg">
          Calculate compound interest with customizable compounding frequencies and additional contributions. 
          See how your money grows exponentially over time with the power of compounding.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                Investment Details
              </CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Enter your initial investment and interest parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="principal" className="text-base sm:text-lg">Initial Investment (Principal)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={inputs.principal}
                    onChange={(e) => setInputs(prev => ({...prev, principal: e.target.value}))}
                    className="h-8 sm:h-10 text-base sm:text-lg"
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-base sm:text-lg">Annual Interest Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={inputs.rate}
                    onChange={(e) => setInputs(prev => ({...prev, rate: e.target.value}))}
                    className="h-8 sm:h-10 text-base sm:text-lg"
                    placeholder="7.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-base sm:text-lg">Investment Period</Label>
                  <div className="flex gap-2">
                    <Input
                      id="time"
                      type="number"
                      value={inputs.time}
                      onChange={(e) => setInputs(prev => ({...prev, time: e.target.value}))}
                      className="h-8 sm:h-10 text-base sm:text-lg flex-1"
                      placeholder="10"
                    />
                    <Select value={inputs.timeUnit} onValueChange={(value) => setInputs(prev => ({...prev, timeUnit: value}))}>
                      <SelectTrigger className="h-8 sm:h-10 text-base sm:text-lg w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compoundingFrequency" className="text-base sm:text-lg">Compounding Frequency</Label>
                  <Select value={inputs.compoundingFrequency} onValueChange={(value) => setInputs(prev => ({...prev, compoundingFrequency: value}))}>
                    <SelectTrigger className="h-8 sm:h-10 text-base sm:text-lg">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semiannually">Semi-annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="continuous">Continuous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                Additional Contributions
              </CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Optional regular contributions to boost your investment growth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="additionalContribution" className="text-base sm:text-lg">Contribution Amount</Label>
                  <Input
                    id="additionalContribution"
                    type="number"
                    value={inputs.additionalContribution}
                    onChange={(e) => setInputs(prev => ({...prev, additionalContribution: e.target.value}))}
                    className="h-8 sm:h-10 text-base sm:text-lg"
                    placeholder="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contributionFrequency" className="text-base sm:text-lg">Contribution Frequency</Label>
                  <Select value={inputs.contributionFrequency} onValueChange={(value) => setInputs(prev => ({...prev, contributionFrequency: value}))}>
                    <SelectTrigger className="h-8 sm:h-10 text-base sm:text-lg">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Additional Contributions</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semiannually">Semi-annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contributionTiming" className="text-base sm:text-lg">Contribution Timing</Label>
                  <Select value={inputs.contributionTiming} onValueChange={(value) => setInputs(prev => ({...prev, contributionTiming: value}))}>
                    <SelectTrigger className="h-8 sm:h-10 text-base sm:text-lg">
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="endOfPeriod">End of Period (Ordinary Annuity)</SelectItem>
                      <SelectItem value="beginningOfPeriod">Beginning of Period (Annuity Due)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Investment Growth Results
                </CardTitle>
                <CardDescription className="text-base sm:text-lg">
                  Your investment will grow to {formatCurrency(result.futureValue)} with {formatCurrency(result.totalInterest)} in compound interest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-base sm:text-lg text-green-600 font-medium">Future Value</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-700">
                      {formatCurrency(result.futureValue)}
                    </div>
                    <div className="text-base text-green-600">
                      Total account value
                    </div>
                  </div>

                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-base sm:text-lg text-blue-600 font-medium">Total Interest</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">
                      {formatCurrency(result.totalInterest)}
                    </div>
                    <div className="text-base text-blue-600">
                      Compound growth
                    </div>
                  </div>

                  <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-base sm:text-lg text-purple-600 font-medium">Effective Annual Rate</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-700">
                      {(result.effectiveAnnualRate * 100).toFixed(2)}%
                    </div>
                    <div className="text-base text-purple-600">
                      APY equivalent
                    </div>
                  </div>

                  <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-base sm:text-lg text-orange-600 font-medium">Total Invested</div>
                    <div className="text-xl sm:text-2xl font-bold text-orange-700">
                      {formatCurrency(result.totalPrincipal)}
                    </div>
                    <div className="text-base text-orange-600">
                      Principal + contributions
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <h4 className="text-base sm:text-lg font-medium mb-3">Investment Breakdown</h4>
                  <div className="space-y-2 text-base sm:text-lg">
                    <div className="flex justify-between">
                      <span>Initial Principal:</span>
                      <span className="font-semibold">{formatCurrencyFull(parseFloat(inputs.principal) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Contributions:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.totalContributions)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Invested:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.totalPrincipal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compound Interest Earned:</span>
                      <span className="font-semibold text-green-600">{formatCurrencyFull(result.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Simple Interest (for comparison):</span>
                      <span className="font-semibold text-gray-500">{formatCurrencyFull(result.breakdown.simpleInterest)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-green-700">
                      <span>Final Value:</span>
                      <span>{formatCurrencyFull(result.futureValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Compound vs Simple Interest Comparison */}
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                  <h4 className="text-base sm:text-lg font-medium mb-2 text-blue-700">Power of Compounding</h4>
                  <div className="text-base sm:text-lg text-blue-600">
                    <div className="flex justify-between">
                      <span>Extra earned vs Simple Interest:</span>
                      <span className="font-bold text-blue-700">
                        {formatCurrencyFull(result.totalInterest - result.breakdown.simpleInterest)}
                      </span>
                    </div>
                    <div className="text-base text-blue-600 mt-1">
                      That's {((result.totalInterest / result.breakdown.simpleInterest - 1) * 100).toFixed(1)}% more than simple interest!
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Growth Table */}
            {result.breakdown.monthlyBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Monthly Growth Progress
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg">
                    Track your investment growth month by month (showing first 5 years)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-base sm:text-lg">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2 font-medium">Year</th>
                          <th className="p-2 font-medium">Balance</th>
                          <th className="p-2 font-medium">Interest</th>
                          <th className="p-2 font-medium">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="text-base">
                        {result.breakdown.monthlyBreakdown
                          .filter((_, index) => (index + 1) % 12 === 0) // Show yearly data
                          .slice(0, 5) // Limit to 5 years
                          .map((data, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-semibold">{formatCurrency(data.balance)}</td>
                              <td className="p-2 text-green-600">{formatCurrency(data.interestEarned * 12)}</td>
                              <td className="p-2 text-blue-600">{formatCurrency(data.contribution * 12)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Educational Content Section */}
      <div className="space-y-4 sm:space-y-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Complete Guide to Compound Interest & Investment Growth
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto text-base sm:text-lg">
            Master the mathematical principles of compound interest, understand different compounding frequencies, and learn advanced investment strategies. 
            Discover how Einstein called compound interest "the eighth wonder of the world" and why time is your most powerful wealth-building ally.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Compound Interest Fundamentals Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="h-5 w-5" />
                Compound Interest Mathematics & Fundamentals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Core Mathematical Principles</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Basic Compound Interest Formula:</strong> A = P(1 + r/n)^(nt), where A is final amount, P is principal, r is annual interest rate, n is compounding frequency per year, and t is time in years</li>
                  <li><strong>Continuous Compounding:</strong> A = Pe^(rt) using Euler's constant (e ≈ 2.71828), representing the mathematical limit of compound interest with infinite compounding periods</li>
                  <li><strong>Effective Annual Rate (APY):</strong> EAR = (1 + r/n)^n - 1, converting nominal rates to actual annual yields for accurate comparison across different compounding frequencies</li>
                  <li><strong>Rule of 72:</strong> Approximate doubling time = 72 ÷ interest rate. For 8% return, investments double approximately every 9 years (72 ÷ 8 = 9)</li>
                  <li><strong>Time Value of Money:</strong> Present Value = Future Value ÷ (1 + r)^t, demonstrating that money today is worth more than the same amount in the future due to earning potential</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Compound vs. Simple Interest Mechanics</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Simple Interest:</strong> I = Prt, where interest is calculated only on principal amount. Linear growth pattern with constant annual additions</li>
                  <li><strong>Compound Interest Advantage:</strong> Interest earns interest, creating exponential growth. The difference becomes dramatic over extended periods</li>
                  <li><strong>Compounding Effect:</strong> With 10% annual rate over 20 years: $10,000 grows to $30,000 (simple) vs. $67,275 (compound annually) - over 124% more wealth</li>
                  <li><strong>Growth Acceleration:</strong> Compound growth starts slowly but accelerates dramatically. The later years produce disproportionately large gains</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Critical Success Factors</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Time Factor:</strong> Most powerful variable in compound interest. Starting 10 years earlier can result in 2-3x more wealth despite contributing the same total amount</li>
                  <li><strong>Rate Sensitivity:</strong> Small rate differences compound dramatically. 1% higher return over 30 years can increase final value by 25-35%</li>
                  <li><strong>Frequency Impact:</strong> Higher compounding frequency increases returns, but with diminishing returns. Daily vs. annual compounding typically adds 0.1-0.3% to effective rate</li>
                  <li><strong>Consistency Requirement:</strong> Regular contributions and avoiding early withdrawals are crucial for maximizing compound growth potential</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Compounding Frequencies Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Zap className="h-5 w-5" />
                Compounding Frequencies & Rate Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Frequency Impact Analysis</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Annual Compounding (n=1):</strong> Interest calculated once per year. Simplest form, typically used for certificates of deposit and some savings accounts</li>
                  <li><strong>Semi-Annual (n=2):</strong> Compounds twice yearly. Common for bonds and some investment products. Adds approximately 0.25% to effective annual rate</li>
                  <li><strong>Quarterly Compounding (n=4):</strong> Four times per year compounding. Typical for many savings accounts and investment funds</li>
                  <li><strong>Monthly Compounding (n=12):</strong> Most common frequency for mortgages, credit cards, and savings accounts. Significantly improves returns over annual compounding</li>
                  <li><strong>Daily Compounding (n=365):</strong> Maximum practical frequency. Online banks often offer daily compounding to maximize customer returns</li>
                  <li><strong>Continuous Compounding (n→∞):</strong> Theoretical maximum using e^(rt). Represents absolute upper limit of compound interest potential</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Rate Conversion Strategies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>APR vs. APY Understanding:</strong> APR (Annual Percentage Rate) is nominal rate; APY (Annual Percentage Yield) includes compounding effects</li>
                  <li><strong>Effective Rate Calculation:</strong> 6% compounded monthly = 6.17% APY, while 6% compounded daily = 6.18% APY</li>
                  <li><strong>Marketing Tactics:</strong> Lenders prefer showing lower APR for loans, while savers prefer higher APY for deposits. Always compare like-to-like rates</li>
                  <li><strong>Rate Shopping:</strong> Compare effective annual yields (APY) rather than nominal rates when evaluating different investment or savings options</li>
                  <li><strong>Compound Frequency Arbitrage:</strong> Choose investments with higher compounding frequencies when rates are equal, as this provides free additional return</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Advanced Compounding Concepts</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Bernoulli's Discovery:</strong> Jacob Bernoulli proved in 1683 that increasing compounding frequency approaches limit e, laying foundation for continuous compounding theory</li>
                  <li><strong>Euler's Constant Application:</strong> e ≈ 2.71828 represents natural logarithm base, crucial for continuous growth models in finance and economics</li>
                  <li><strong>Diminishing Returns:</strong> Beyond monthly compounding, additional frequency provides minimal benefit. Daily vs. continuous differs by less than 0.005%</li>
                  <li><strong>Practical Implementation:</strong> Most financial institutions use daily compounding for competitive advantage while keeping calculations manageable</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Investment Strategies Card */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Target className="h-5 w-5" />
                Advanced Investment & Wealth-Building Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Dollar-Cost Averaging & Regular Contributions</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Systematic Investment Strategy:</strong> Regular fixed-amount contributions regardless of market conditions. Reduces average cost per share over time through market volatility</li>
                  <li><strong>Annuity Due vs. Ordinary Annuity:</strong> Beginning-of-period contributions (annuity due) provide one additional compounding period, increasing returns by (1 + r/n)</li>
                  <li><strong>Contribution Timing Optimization:</strong> Monthly contributions often optimal balance between compounding benefit and transaction costs</li>
                  <li><strong>Auto-Investment Programs:</strong> Automated contributions ensure consistency and remove emotional decision-making from investment process</li>
                  <li><strong>Lump Sum vs. Periodic:</strong> Time in market generally beats timing the market. Immediate lump sum investment typically outperforms gradual investment when markets trend upward</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Tax-Advantaged Compounding Vehicles</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>401(k) and 403(b) Plans:</strong> Pre-tax contributions with tax-deferred compounding. No taxes on gains until withdrawal, maximizing compound growth</li>
                  <li><strong>Roth IRA Benefits:</strong> After-tax contributions with tax-free compounding and withdrawals. Particularly powerful for young investors in lower tax brackets</li>
                  <li><strong>Traditional IRA Strategy:</strong> Tax deduction now with tax-deferred growth. Best for higher current income expecting lower retirement tax rates</li>
                  <li><strong>HSA Triple Advantage:</strong> Tax-deductible contributions, tax-free growth, and tax-free qualified withdrawals. Most tax-efficient investment vehicle available</li>
                  <li><strong>529 Education Plans:</strong> State tax deductions with federal tax-free growth for education expenses. Compounds tax-free for decades when children are young</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Risk Management & Asset Allocation</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Diversification Imperative:</strong> Spread risk across asset classes, geographies, and time horizons. Don't put all compound growth at risk in single investment</li>
                  <li><strong>Rebalancing Strategy:</strong> Periodically return to target asset allocation. Forces "buy low, sell high" discipline while maintaining risk profile</li>
                  <li><strong>Emergency Fund Priority:</strong> Maintain 3-6 months expenses in liquid accounts before aggressive investing. Prevents forced early withdrawals that destroy compounding</li>
                  <li><strong>Debt vs. Investment Decision:</strong> Pay off high-interest debt (credit cards, personal loans) before investing, as guaranteed savings often exceed potential investment returns</li>
                  <li><strong>Sequence of Returns Risk:</strong> Poor returns early in retirement can devastate portfolios. Consider shifting to lower-risk assets as retirement approaches</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Advanced Wealth Maximization Techniques</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Laddering Strategies:</strong> CD or bond ladders provide regular reinvestment opportunities while maintaining liquidity and reducing interest rate risk</li>
                  <li><strong>Tax-Loss Harvesting:</strong> Realize losses to offset gains, improving after-tax compound returns. Particularly valuable in taxable investment accounts</li>
                  <li><strong>Roth Conversion Ladders:</strong> Systematically convert traditional IRA funds to Roth during low-income years to optimize long-term tax-free compounding</li>
                  <li><strong>Asset Location Optimization:</strong> Place tax-inefficient investments in tax-advantaged accounts and tax-efficient investments in taxable accounts</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Historical Context & Applications Card */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <History className="h-5 w-5" />
                Historical Context & Real-World Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Ancient Origins & Mathematical Evolution</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Babylonian & Sumerian Foundations:</strong> Compound interest documented 4,400 years ago in ancient Mesopotamia. Early civilizations used 20% rates until interest equaled principal</li>
                  <li><strong>Roman Law Restrictions:</strong> Romans condemned compound interest as usury, preferring simple interest. Christian and Islamic texts historically prohibited compound interest as exploitation</li>
                  <li><strong>Medieval Renaissance:</strong> Compound interest gained acceptance in medieval Europe with creation of compound interest tables in 1600s, facilitating complex commercial transactions</li>
                  <li><strong>Jacob Bernoulli's Breakthrough (1683):</strong> Mathematical proof that increasing compounding frequency approaches natural limit e, establishing theoretical foundation for continuous compounding</li>
                  <li><strong>Leonhard Euler's Contribution:</strong> Named constant e ≈ 2.71828 after discovering its universal applications in growth mathematics, not just compound interest</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Famous Examples & Case Studies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Manhattan Purchase Myth:</strong> $24 invested at 7% annual return since 1626 would equal $2.5 trillion today - more than Manhattan's current value</li>
                  <li><strong>Warren Buffett's Compounding:</strong> Started investing at age 11, built $100+ billion fortune primarily through compound returns averaging ~20% annually over 60+ years</li>
                  <li><strong>S&P 500 Historical Performance:</strong> $1,000 invested in 1950 grew to over $1.2 million by 2020 (7,000% nominal return) through reinvested dividends and compound growth</li>
                  <li><strong>Benjamin Franklin's Bequest:</strong> Left $1,000 each to Boston and Philadelphia in 1790, stipulating 200-year compound growth. Funds grew to millions, demonstrating extreme long-term compounding power</li>
                  <li><strong>Retirement Planning Reality:</strong> Starting retirement savings at 25 vs. 35 can result in 2-3x more wealth at retirement due to additional 10 years of compounding</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Modern Financial Applications</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Mortgage Amortization:</strong> Early payments primarily service compound interest, while later payments reduce principal. Understanding helps optimize prepayment strategies</li>
                  <li><strong>Credit Card Debt Danger:</strong> Minimum payments designed to maximize compound interest charges. $5,000 balance at 18% APR takes 47 years to pay with minimums, costing $21,000+ total</li>
                  <li><strong>Student Loan Capitalization:</strong> Unpaid interest compounds into principal during deferment/forbearance, dramatically increasing total repayment amount</li>
                  <li><strong>High-Yield Savings Evolution:</strong> Online banks offer 4-5% APY with daily compounding, providing significant advantages over traditional 0.01% savings accounts</li>
                  <li><strong>Certificate of Deposit Laddering:</strong> Systematic CD purchases provide regular reinvestment opportunities while capturing higher long-term rates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Behavioral Psychology & Common Pitfalls</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Delayed Gratification Challenge:</strong> Compound interest requires sacrificing immediate consumption for future wealth. Most people struggle with this fundamental trade-off</li>
                  <li><strong>Linear Thinking Bias:</strong> Humans naturally think linearly but compound growth is exponential. This leads to underestimating long-term growth potential</li>
                  <li><strong>Market Timing Temptation:</strong> Attempting to time markets often disrupts compounding. Missing 10 best market days over 30 years can reduce returns by 50%+</li>
                  <li><strong>Inflation Consideration:</strong> Nominal returns must exceed inflation for real wealth building. 3% inflation reduces purchasing power by 50% over 23 years</li>
                  <li><strong>Lifestyle Inflation Trap:</strong> Increasing spending with income growth prevents savings rate improvement, limiting compound interest potential despite higher earnings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Considerations Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Shield className="h-5 w-5" />
              Critical Investment Considerations & Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Risk Assessment & Management</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Systematic Risk:</strong> Market-wide risks affecting all investments. Cannot be diversified away but can be managed through asset allocation</li>
                  <li>• <strong>Unsystematic Risk:</strong> Company or sector-specific risks. Reduced through diversification across multiple investments and industries</li>
                  <li>• <strong>Interest Rate Risk:</strong> Rising rates reduce bond values and can affect stock valuations. Consider duration and rate sensitivity in portfolio construction</li>
                  <li>• <strong>Inflation Risk:</strong> Purchasing power erosion over time. Ensure investment returns exceed inflation rate for real wealth preservation</li>
                  <li>• <strong>Liquidity Risk:</strong> Inability to quickly convert investments to cash. Maintain appropriate emergency funds and consider investment liquidity needs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Regulatory & Tax Implications</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>FDIC Insurance Limits:</strong> Bank deposits insured up to $250,000 per depositor per institution. Spread large amounts across multiple banks</li>
                  <li>• <strong>Tax-Deferred vs. Tax-Free:</strong> Understand difference between traditional and Roth accounts. Consider current vs. future tax rates in decision-making</li>
                  <li>• <strong>Capital Gains Tax:</strong> Hold investments &gt;1 year for preferential long-term capital gains treatment. Short-term gains taxed as ordinary income</li>
                  <li>• <strong>Required Minimum Distributions:</strong> Traditional retirement accounts require withdrawals starting at age 73. Plan for tax implications and withdrawal strategies</li>
                  <li>• <strong>State Tax Considerations:</strong> Some states offer tax advantages for specific investment vehicles like 529 plans or municipal bonds</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Professional Guidance & Resources</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Fee-Only Financial Advisors:</strong> Seek fiduciary advisors who act in your best interest. Avoid commission-based sales representatives</li>
                  <li>• <strong>Robo-Advisors:</strong> Low-cost automated investment management with tax-loss harvesting and automatic rebalancing features</li>
                  <li>• <strong>Tax Professional Consultation:</strong> Complex situations benefit from CPA or tax attorney guidance, especially for high-net-worth individuals</li>
                  <li>• <strong>Estate Planning Integration:</strong> Coordinate investment strategy with estate planning to optimize wealth transfer and minimize tax burden</li>
                  <li>• <strong>Continuous Education:</strong> Stay informed about changing tax laws, investment products, and market conditions affecting long-term strategy</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-center text-sm sm:text-base text-gray-500 bg-gray-50 p-3 sm:p-4 rounded-lg">
          <p>
            <strong>Important Disclaimer:</strong> This compound interest calculator provides educational estimates and should not be considered financial advice. 
            Actual investment returns vary significantly due to market volatility, fees, taxes, and economic conditions. Past performance does not guarantee future results. 
            Interest rates and compounding frequencies can change, affecting actual returns. Investment products carry risk of loss, including potential loss of principal. 
            Tax implications vary by individual circumstances and jurisdiction. For personalized investment advice, portfolio management, and comprehensive financial planning, 
            consult with qualified financial advisors, certified financial planners (CFP), or fee-only investment advisors who can analyze your complete financial situation 
            and provide guidance tailored to your specific goals, risk tolerance, and time horizon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompoundInterestCalculatorComponent;
