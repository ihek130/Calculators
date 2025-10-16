import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calculator, Clock, TrendingUp, BarChart3, BookOpen, Shield, Users, GraduationCap } from 'lucide-react';

interface SalaryInputs {
  amount: string;
  frequency: string;
  hoursPerWeek: string;
  daysPerWeek: string;
  holidaysPerYear: string;
  vacationDaysPerYear: string;
}

interface SalaryResults {
  unadjusted: {
    hourly: number;
    daily: number;
    weekly: number;
    biweekly: number;
    semimonthly: number;
    monthly: number;
    quarterly: number;
    annual: number;
  };
  adjusted: {
    hourly: number;
    daily: number;
    weekly: number;
    biweekly: number;
    semimonthly: number;
    monthly: number;
    quarterly: number;
    annual: number;
  };
  workingDays: {
    total: number;
    adjusted: number;
  };
}

const SalaryCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<SalaryInputs>({
    amount: '50',
    frequency: 'hour',
    hoursPerWeek: '40',
    daysPerWeek: '5',
    holidaysPerYear: '10',
    vacationDaysPerYear: '15'
  });

  const [results, setResults] = useState<SalaryResults | null>(null);

  const calculateSalary = () => {
    try {
      const amount = parseFloat(inputs.amount) || 0;
      const hoursPerWeek = parseFloat(inputs.hoursPerWeek) || 40;
      const daysPerWeek = parseFloat(inputs.daysPerWeek) || 5;
      const holidaysPerYear = parseFloat(inputs.holidaysPerYear) || 10;
      const vacationDaysPerYear = parseFloat(inputs.vacationDaysPerYear) || 15;

      if (amount <= 0) {
        setResults(null);
        return;
      }

      // Standard working assumptions
      const weeksPerYear = 52;
      const workingDaysPerYear = weeksPerYear * daysPerWeek; // 260 for 5 days/week
      const adjustedWorkingDays = workingDaysPerYear - holidaysPerYear - vacationDaysPerYear;
      const hoursPerDay = hoursPerWeek / daysPerWeek;

      let annualUnadjusted: number;
      let hourlyUnadjusted: number;

      // Convert input to annual salary (unadjusted)
      switch (inputs.frequency) {
        case 'hour':
          hourlyUnadjusted = amount;
          annualUnadjusted = amount * hoursPerWeek * weeksPerYear;
          break;
        case 'day':
          hourlyUnadjusted = amount / hoursPerDay;
          annualUnadjusted = amount * workingDaysPerYear;
          break;
        case 'week':
          hourlyUnadjusted = amount / hoursPerWeek;
          annualUnadjusted = amount * weeksPerYear;
          break;
        case 'biweek':
          hourlyUnadjusted = (amount * 26) / (hoursPerWeek * weeksPerYear);
          annualUnadjusted = amount * 26;
          break;
        case 'semimonth':
          hourlyUnadjusted = (amount * 24) / (hoursPerWeek * weeksPerYear);
          annualUnadjusted = amount * 24;
          break;
        case 'month':
          hourlyUnadjusted = (amount * 12) / (hoursPerWeek * weeksPerYear);
          annualUnadjusted = amount * 12;
          break;
        case 'quarter':
          hourlyUnadjusted = (amount * 4) / (hoursPerWeek * weeksPerYear);
          annualUnadjusted = amount * 4;
          break;
        case 'year':
          hourlyUnadjusted = amount / (hoursPerWeek * weeksPerYear);
          annualUnadjusted = amount;
          break;
        default:
          hourlyUnadjusted = amount;
          annualUnadjusted = amount * hoursPerWeek * weeksPerYear;
      }

      // Calculate unadjusted values
      const dailyUnadjusted = hourlyUnadjusted * hoursPerDay;
      const weeklyUnadjusted = hourlyUnadjusted * hoursPerWeek;
      const biweeklyUnadjusted = weeklyUnadjusted * 2;
      const semimonthlyUnadjusted = annualUnadjusted / 24;
      const monthlyUnadjusted = annualUnadjusted / 12;
      const quarterlyUnadjusted = annualUnadjusted / 4;

      // Calculate adjusted values (accounting for holidays and vacation)
      const adjustmentFactor = adjustedWorkingDays / workingDaysPerYear;
      const annualAdjusted = annualUnadjusted * adjustmentFactor;
      const hourlyAdjusted = hourlyUnadjusted * adjustmentFactor;
      const dailyAdjusted = dailyUnadjusted * adjustmentFactor;
      const weeklyAdjusted = weeklyUnadjusted * adjustmentFactor;
      const biweeklyAdjusted = biweeklyUnadjusted * adjustmentFactor;
      const semimonthlyAdjusted = annualAdjusted / 24;
      const monthlyAdjusted = annualAdjusted / 12;
      const quarterlyAdjusted = annualAdjusted / 4;

      const calculatedResults: SalaryResults = {
        unadjusted: {
          hourly: hourlyUnadjusted,
          daily: dailyUnadjusted,
          weekly: weeklyUnadjusted,
          biweekly: biweeklyUnadjusted,
          semimonthly: semimonthlyUnadjusted,
          monthly: monthlyUnadjusted,
          quarterly: quarterlyUnadjusted,
          annual: annualUnadjusted
        },
        adjusted: {
          hourly: hourlyAdjusted,
          daily: dailyAdjusted,
          weekly: weeklyAdjusted,
          biweekly: biweeklyAdjusted,
          semimonthly: semimonthlyAdjusted,
          monthly: monthlyAdjusted,
          quarterly: quarterlyAdjusted,
          annual: annualAdjusted
        },
        workingDays: {
          total: workingDaysPerYear,
          adjusted: adjustedWorkingDays
        }
      };

      setResults(calculatedResults);
    } catch (error) {
      console.error('Salary calculation error:', error);
      setResults(null);
    }
  };

  useEffect(() => {
    calculateSalary();
  }, [inputs]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const formatCurrencyDetailed = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          Salary Calculator
        </h1>
        <p className="text-gray-600 max-w-4xl mx-auto text-base sm:text-lg">
          Convert salary amounts between different payment frequencies. Calculate both unadjusted figures and 
          adjusted amounts that account for vacation days and holidays per year with real-time calculations.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* Salary Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Calculator className="h-5 w-5" />
                Salary Information
              </CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Enter your salary amount and payment frequency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm sm:text-base font-medium">
                    Salary Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={inputs.amount}
                    onChange={(e) => setInputs(prev => ({...prev, amount: e.target.value}))}
                    placeholder="Enter amount"
                    className="text-base sm:text-lg h-11 sm:h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-sm sm:text-base font-medium">
                    Payment Frequency
                  </Label>
                  <Select value={inputs.frequency} onValueChange={(value) => setInputs(prev => ({...prev, frequency: value}))}>
                    <SelectTrigger className="h-11 sm:h-12 text-base sm:text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Per Hour</SelectItem>
                      <SelectItem value="day">Per Day</SelectItem>
                      <SelectItem value="week">Per Week</SelectItem>
                      <SelectItem value="biweek">Bi-Weekly</SelectItem>
                      <SelectItem value="semimonth">Semi-Monthly</SelectItem>
                      <SelectItem value="month">Per Month</SelectItem>
                      <SelectItem value="quarter">Per Quarter</SelectItem>
                      <SelectItem value="year">Per Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Schedule Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Clock className="h-5 w-5" />
                Work Schedule
              </CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Define your working hours and schedule parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="hoursPerWeek" className="text-sm sm:text-base font-medium">
                    Hours per Week
                  </Label>
                  <Input
                    id="hoursPerWeek"
                    type="number"
                    step="0.5"
                    value={inputs.hoursPerWeek}
                    onChange={(e) => setInputs(prev => ({...prev, hoursPerWeek: e.target.value}))}
                    placeholder="40"
                    className="text-base sm:text-lg h-11 sm:h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daysPerWeek" className="text-sm sm:text-base font-medium">
                    Days per Week
                  </Label>
                  <Input
                    id="daysPerWeek"
                    type="number"
                    step="0.5"
                    value={inputs.daysPerWeek}
                    onChange={(e) => setInputs(prev => ({...prev, daysPerWeek: e.target.value}))}
                    placeholder="5"
                    className="text-base sm:text-lg h-11 sm:h-12"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="holidaysPerYear" className="text-sm sm:text-base font-medium">
                    Holidays per Year
                  </Label>
                  <Input
                    id="holidaysPerYear"
                    type="number"
                    value={inputs.holidaysPerYear}
                    onChange={(e) => setInputs(prev => ({...prev, holidaysPerYear: e.target.value}))}
                    placeholder="10"
                    className="text-base sm:text-lg h-11 sm:h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacationDaysPerYear" className="text-sm sm:text-base font-medium">
                    Vacation Days per Year
                  </Label>
                  <Input
                    id="vacationDaysPerYear"
                    type="number"
                    value={inputs.vacationDaysPerYear}
                    onChange={(e) => setInputs(prev => ({...prev, vacationDaysPerYear: e.target.value}))}
                    placeholder="15"
                    className="text-base sm:text-lg h-11 sm:h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4 sm:space-y-6">
          {results && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="text-center space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm text-green-600 font-medium">Annual Salary</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                        {formatCurrency(results.unadjusted.annual)}
                      </p>
                      <p className="text-xs sm:text-sm text-green-600">Unadjusted</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="text-center space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm text-blue-600 font-medium">Adjusted Annual</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">
                        {formatCurrency(results.adjusted.annual)}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600">With holidays & vacation</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <BarChart3 className="h-5 w-5" />
                    Salary Breakdown by Payment Frequency
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg">
                    Compare unadjusted vs. adjusted salary amounts across different payment periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-2 sm:p-3 text-sm sm:text-base font-semibold text-gray-700">
                            Frequency
                          </th>
                          <th className="text-right p-2 sm:p-3 text-sm sm:text-base font-semibold text-green-700">
                            Unadjusted
                          </th>
                          <th className="text-right p-2 sm:p-3 text-sm sm:text-base font-semibold text-blue-700">
                            Adjusted
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Hourly', key: 'hourly' },
                          { label: 'Daily', key: 'daily' },
                          { label: 'Weekly', key: 'weekly' },
                          { label: 'Bi-weekly', key: 'biweekly' },
                          { label: 'Semi-monthly', key: 'semimonthly' },
                          { label: 'Monthly', key: 'monthly' },
                          { label: 'Quarterly', key: 'quarterly' },
                          { label: 'Annual', key: 'annual' }
                        ].map((row, index) => (
                          <tr 
                            key={row.key} 
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}
                          >
                            <td className="p-2 sm:p-3 text-sm sm:text-base font-medium text-gray-900">
                              {row.label}
                            </td>
                            <td className="p-2 sm:p-3 text-sm sm:text-base font-semibold text-green-700 text-right">
                              {formatCurrencyDetailed(results.unadjusted[row.key as keyof typeof results.unadjusted])}
                            </td>
                            <td className="p-2 sm:p-3 text-sm sm:text-base font-semibold text-blue-700 text-right">
                              {formatCurrencyDetailed(results.adjusted[row.key as keyof typeof results.adjusted])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Working Days Summary */}
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm sm:text-base text-orange-600 font-medium">Total Working Days</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">{results.workingDays.total}</p>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-orange-600 font-medium">Non-Working Days</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">
                        {results.workingDays.total - results.workingDays.adjusted}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-orange-600 font-medium">Adjusted Working Days</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">{results.workingDays.adjusted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Power of Salary Comparison */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center space-y-2 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-purple-700">Impact of Holidays & Vacation</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm sm:text-base text-purple-600">Annual Difference</p>
                        <p className="text-lg sm:text-xl font-bold text-purple-700">
                          {formatCurrencyDetailed(results.unadjusted.annual - results.adjusted.annual)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base text-purple-600">Effective Hourly Reduction</p>
                        <p className="text-lg sm:text-xl font-bold text-purple-700">
                          {formatCurrencyDetailed(results.unadjusted.hourly - results.adjusted.hourly)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-purple-600">
                      Your effective earning power decreases when accounting for {parseInt(inputs.holidaysPerYear) + parseInt(inputs.vacationDaysPerYear)} non-working days per year
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Calculation Notes */}
      {results && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <TrendingUp className="h-5 w-5" />
              Calculation Methodology & Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Standard Assumptions</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• 52 working weeks per year</li>
                  <li>• {results.workingDays.total} weekdays per year ({inputs.daysPerWeek} days × 52 weeks)</li>
                  <li>• Hourly and daily inputs are unadjusted values</li>
                  <li>• Other frequency inputs are holiday/vacation adjusted</li>
                  <li>• Calculations exclude overtime considerations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Frequency Definitions</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Bi-weekly:</strong> Every two weeks (26 pays/year)</li>
                  <li>• <strong>Semi-monthly:</strong> Twice per month (24 pays/year)</li>
                  <li>• <strong>Adjusted:</strong> Accounts for {inputs.holidaysPerYear} holidays + {inputs.vacationDaysPerYear} vacation days</li>
                  <li>• <strong>Unadjusted:</strong> Based on full working year schedule</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Content Section */}
      <div className="space-y-4 sm:space-y-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            Complete Guide to Salary & Wage Management
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto text-base sm:text-lg">
            Master salary negotiations, understand payment structures, and learn strategic career advancement techniques. 
            Explore comprehensive insights into U.S. compensation standards, federal regulations, and proven methods for salary optimization.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Salary vs Wage Fundamentals Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                Salary vs. Wage Structures & Employment Classifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Salary Employment Characteristics</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Fixed Annual Compensation:</strong> Consistent yearly amount regardless of hours worked, typically divided into equal pay periods throughout the year</li>
                  <li><strong>Exempt Status Classification:</strong> Generally exempt from Fair Labor Standards Act (FLSA) overtime regulations, meaning no time-and-a-half pay for hours exceeding 40 per week</li>
                  <li><strong>Professional Responsibilities:</strong> Usually involves managerial, administrative, executive, or professional duties requiring independent judgment and decision-making</li>
                  <li><strong>Employment Contract Terms:</strong> Defined in annual employment agreements with specified compensation, benefits, and performance expectations</li>
                  <li><strong>Benefit Package Integration:</strong> Typically includes comprehensive benefits like health insurance, retirement plans, paid time off, and professional development opportunities</li>
                  <li><strong>Performance-Based Evaluation:</strong> Compensation reviews based on annual performance metrics rather than hourly productivity measures</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Wage Employment Framework</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Hourly Rate Structure:</strong> Compensation calculated by multiplying hours worked by predetermined hourly rate, providing direct correlation between time and pay</li>
                  <li><strong>Non-Exempt FLSA Status:</strong> Protected by federal overtime regulations requiring 1.5x regular rate for hours exceeding 40 per week, with some states having daily overtime requirements</li>
                  <li><strong>Time Tracking Requirements:</strong> Detailed hour recording through timesheets, punch cards, or digital systems to ensure accurate compensation and compliance</li>
                  <li><strong>Variable Income Potential:</strong> Earnings fluctuate based on hours worked, seasonal demand, and availability, offering flexibility but less predictability</li>
                  <li><strong>Limited Benefit Access:</strong> Often reduced benefit packages compared to salaried positions, though ACA requirements have improved healthcare access for qualifying employees</li>
                  <li><strong>Shift-Based Scheduling:</strong> Work schedules typically structured around specific shifts, with potential for premium pay during nights, weekends, or holidays</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Legal & Economic Implications</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>FLSA Minimum Salary Threshold:</strong> As of 2024, employees must earn at least $684 per week ($35,568 annually) to qualify for exempt salary status</li>
                  <li><strong>State Wage Law Variations:</strong> Individual states may have higher minimum wage requirements, overtime thresholds, and additional worker protections beyond federal standards</li>
                  <li><strong>Misclassification Consequences:</strong> Employers face significant penalties for incorrectly classifying employees, including back pay, damages, and legal fees</li>
                  <li><strong>Career Progression Patterns:</strong> Salaried positions often provide clearer advancement paths and professional development opportunities compared to hourly roles</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Frequency & Structures Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Clock className="h-5 w-5" />
                Payment Frequency Systems & Payroll Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Federal & State Pay Frequency Requirements</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Federal Mandate:</strong> No specific federal pay frequency law, but payments must be "routine and predictable" to ensure employee financial stability</li>
                  <li><strong>State-Level Regulations:</strong> Most states mandate minimum pay frequencies, with common requirements being bi-weekly or semi-monthly for different employee classifications</li>
                  <li><strong>Exception States:</strong> Alabama, Florida, and South Carolina have no minimum pay frequency requirements, allowing greater employer flexibility</li>
                  <li><strong>Industry-Specific Standards:</strong> Certain industries (construction, agriculture, domestic work) may have specialized pay frequency requirements under state or federal law</li>
                  <li><strong>Final Paycheck Timing:</strong> States regulate when final paychecks must be issued after termination, ranging from immediately to next regular pay period</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Payment Frequency Analysis & Cost Implications</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Daily Pay (365 times/year):</strong> Primarily for short-term contractors and gig workers. Highest administrative costs but maximum cash flow for employees</li>
                  <li><strong>Weekly Pay (52 times/year):</strong> Common in retail, hospitality, and manufacturing. Higher payroll costs but employee-friendly for budget management</li>
                  <li><strong>Bi-Weekly Pay (26 times/year):</strong> Most popular system in U.S., balancing administrative efficiency with employee cash flow needs. Creates two "extra" pay periods per year</li>
                  <li><strong>Semi-Monthly Pay (24 times/year):</strong> Preferred for salaried employees, aligning with monthly business cycles. Consistent pay dates but varying days between payments</li>
                  <li><strong>Monthly Pay (12 times/year):</strong> Most cost-effective for employers but challenging for employee cash flow management. Common in executive and international positions</li>
                  <li><strong>Quarterly/Annual (4-1 times/year):</strong> Limited to bonuses, commissions, and executive compensation. Requires careful tax planning and withholding management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Payroll Processing & Tax Considerations</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Payroll Tax Withholding:</strong> More frequent pay periods require more complex tax withholding calculations and may affect annual tax liability</li>
                  <li><strong>Administrative Overhead:</strong> Processing costs increase with frequency - weekly payroll can cost 3-4x more than monthly processing</li>
                  <li><strong>Cash Flow Management:</strong> Bi-weekly pay helps employees with monthly bills, while semi-monthly aligns better with business accounting cycles</li>
                  <li><strong>Leap Year Considerations:</strong> Bi-weekly systems occasionally have 27 pay periods, requiring careful annual salary division and budgeting</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* U.S. Salary Statistics & Market Data Card */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <BarChart3 className="h-5 w-5" />
                U.S. Salary Statistics & Compensation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">2024 National Salary Benchmarks & Demographics</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>National Average:</strong> $60,580 annually ($1,165 weekly) for full-time employees in Q3 2024, representing 3.2% year-over-year growth</li>
                  <li><strong>Median Household Income:</strong> $70,784 (2021 Census data), with significant regional variations ranging from $45,000 to $95,000 across different metropolitan areas</li>
                  <li><strong>Education Premium:</strong> Bachelor's degree holders earn $88,244 annually vs. $49,192 for high school graduates - a 79% education premium</li>
                  <li><strong>Age-Based Earnings Curve:</strong> Peak earning years 40-65, with men aged 55-64 earning $77,480 and women aged 45-54 earning $60,632 annually</li>
                  <li><strong>Experience Factor:</strong> Each year of relevant experience typically adds 2-4% to base salary, with diminishing returns after 15-20 years in most fields</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Demographic Pay Disparities & Market Analysis</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Gender Pay Gap:</strong> Men average $65,728 vs. women $54,808 (16.6% gap), with variations by industry, education level, and geographic region</li>
                  <li><strong>Racial Income Disparities:</strong> White men $67,184, Black men $51,324, Hispanic workers $47,008, Asian workers $81,536 - reflecting systemic and educational factors</li>
                  <li><strong>Regional Cost-of-Living Adjustments:</strong> San Francisco/NYC salaries average 40-60% higher than national median, but cost-of-living often exceeds salary premiums</li>
                  <li><strong>Industry Salary Ranges:</strong> Technology ($95K-$180K), Finance ($70K-$150K), Healthcare ($60K-$120K), Education ($45K-$75K) for equivalent experience levels</li>
                  <li><strong>Remote Work Impact:</strong> 15-25% salary adjustments for location-independent roles, with companies developing geographic pay scales</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Federal Minimum Wage & State Variations</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Federal Minimum:</strong> $7.25/hour since 2009, equivalent to $15,080 annually for full-time work - below federal poverty guidelines for families</li>
                  <li><strong>State Minimum Wage Leaders:</strong> Washington DC ($17.50), Washington State ($16.28), California ($16.00-$20.00 depending on location and employer size)</li>
                  <li><strong>Tipped Worker Minimums:</strong> Federal tipped minimum $2.13/hour with tip credit, though 8 states require full minimum wage plus tips</li>
                  <li><strong>Scheduled Increases:</strong> 23 states have automatic inflation adjustments or scheduled minimum wage increases through 2026</li>
                  <li><strong>Living Wage Analysis:</strong> MIT Living Wage Calculator estimates $17-25/hour needed for basic family expenses in most metropolitan areas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Economic Factors Influencing Compensation</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Inflation Impact:</strong> 2021-2024 inflation averaged 5.1%, requiring salary increases of 6-8% annually to maintain purchasing power</li>
                  <li><strong>Labor Market Dynamics:</strong> Unemployment rate below 4% creates competitive hiring environment, driving salary premiums of 10-20% for in-demand skills</li>
                  <li><strong>Skills Premium:</strong> Technology, data analysis, and digital marketing skills command 25-40% salary premiums across industries</li>
                  <li><strong>Hazard Pay Considerations:</strong> Essential workers, dangerous occupations, and challenging work environments may receive 10-25% hazard pay premiums</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Career Advancement & Salary Optimization Card */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <GraduationCap className="h-5 w-5" />
                Career Advancement & Salary Optimization Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Education & Skill Development Investment</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Formal Education ROI:</strong> Bachelor's degree typically pays for itself within 6-8 years through increased earning potential, master's degree ROI varies significantly by field</li>
                  <li><strong>Professional Certifications:</strong> Industry certifications (PMP, CPA, AWS, Cisco) can increase salaries 15-25% and accelerate career progression</li>
                  <li><strong>Continuous Learning Strategy:</strong> Allocate 5-10% of work time to skill development, focusing on emerging technologies and cross-functional competencies</li>
                  <li><strong>Employer Education Benefits:</strong> 85% of Fortune 500 companies offer tuition reimbursement averaging $5,250 annually, often with employment commitment requirements</li>
                  <li><strong>Online Learning Platforms:</strong> Coursera, edX, and LinkedIn Learning provide cost-effective access to university-level courses and professional development</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Strategic Career Progression & Performance Management</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Performance Review Optimization:</strong> Document achievements quarterly, quantify impact in revenue/cost savings terms, and prepare compelling promotion cases</li>
                  <li><strong>Career Ladder Navigation:</strong> Understand promotion criteria, timeline expectations, and required competencies 12-18 months in advance</li>
                  <li><strong>Cross-Functional Experience:</strong> Volunteer for projects outside your department to develop broader business understanding and expand network</li>
                  <li><strong>Mentorship & Sponsorship:</strong> Cultivate relationships with senior leaders who can advocate for your advancement and provide career guidance</li>
                  <li><strong>Leadership Development:</strong> Seek people management opportunities, lead projects, and develop communication skills essential for senior roles</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Negotiation Tactics & Market Positioning</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Market Research Methodology:</strong> Use Glassdoor, PayScale, Salary.com, and industry reports to establish salary ranges 3-6 months before negotiations</li>
                  <li><strong>Total Compensation Analysis:</strong> Consider base salary, bonuses, stock options, benefits, PTO, and professional development when evaluating offers</li>
                  <li><strong>Negotiation Timing:</strong> Best opportunities during annual reviews, after major achievements, job changes, or when taking on additional responsibilities</li>
                  <li><strong>Alternative Compensation:</strong> If salary increases aren't possible, negotiate flexible work arrangements, additional PTO, professional development budgets, or title changes</li>
                  <li><strong>Multiple Offer Strategy:</strong> Having competing offers increases negotiation leverage, but maintain professional relationships regardless of final decisions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Long-Term Wealth Building & Benefits Optimization</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Retirement Plan Maximization:</strong> Contribute enough to capture full employer 401(k) match (free money), then prioritize high-deductible health plans with HSA contributions</li>
                  <li><strong>Professional Network Development:</strong> Attend industry conferences, join professional associations, and maintain LinkedIn presence for future opportunities</li>
                  <li><strong>Job Change Strategy:</strong> External job changes typically yield 10-20% salary increases vs. 3-5% annual raises, but consider long-term career impact</li>
                  <li><strong>Entrepreneurial Opportunities:</strong> Develop side businesses or consulting practices to diversify income streams and build additional expertise</li>
                  <li><strong>Geographic Arbitrage:</strong> Consider remote work opportunities with high-cost-of-living salaries while living in lower-cost areas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Federal Holidays & PTO Analysis */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Users className="h-5 w-5" />
              Federal Holidays & Paid Time Off Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">11 Federal Holidays (2024)</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>January:</strong> New Year's Day, Martin Luther King Jr. Day</li>
                  <li>• <strong>February:</strong> Presidents' Day (Washington's Birthday)</li>
                  <li>• <strong>May:</strong> Memorial Day</li>
                  <li>• <strong>June:</strong> Juneteenth National Independence Day</li>
                  <li>• <strong>July:</strong> Independence Day</li>
                  <li>• <strong>September:</strong> Labor Day</li>
                  <li>• <strong>October:</strong> Columbus Day (Indigenous Peoples' Day)</li>
                  <li>• <strong>November:</strong> Veterans Day, Thanksgiving Day</li>
                  <li>• <strong>December:</strong> Christmas Day</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">PTO Standards & Best Practices</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>No Federal Requirement:</strong> FLSA doesn't mandate paid vacation time</li>
                  <li>• <strong>Industry Average:</strong> 10 days annually for new employees, 15-20 days after 5+ years</li>
                  <li>• <strong>PTO vs. Separate Banks:</strong> 73% of companies use combined PTO systems</li>
                  <li>• <strong>Accrual Rates:</strong> 0.83-1.67 days per month based on seniority</li>
                  <li>• <strong>Rollover Policies:</strong> 44% allow some vacation carryover to next year</li>
                  <li>• <strong>Unlimited PTO:</strong> 6% of companies offer unlimited policies, primarily in tech</li>
                  <li>• <strong>International Comparison:</strong> European Union mandates minimum 20 days annually</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Employer Holiday Policies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Private Sector:</strong> Typically observe 6-11 federal holidays</li>
                  <li>• <strong>Government Workers:</strong> Receive all 11 federal holidays plus state-specific days</li>
                  <li>• <strong>Holiday Pay Requirements:</strong> No federal mandate for holiday premium pay</li>
                  <li>• <strong>Floating Holidays:</strong> 40% of employers offer 1-2 personal choice days</li>
                  <li>• <strong>Religious Accommodations:</strong> Title VII requires reasonable religious holiday accommodations</li>
                  <li>• <strong>International Variations:</strong> Cambodia (28 days), Sri Lanka (25 days) lead global holiday allocation</li>
                  <li>• <strong>Shift Work Considerations:</strong> 24/7 operations often provide holiday differential pay</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Considerations Section */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Shield className="h-5 w-5" />
              Critical Employment Considerations & Legal Protections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Employment Law & Worker Protections</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>At-Will Employment:</strong> 49 states allow termination without cause, except Montana which requires "good cause" after probationary period</li>
                  <li>• <strong>Equal Pay Act:</strong> Prohibits sex-based wage discrimination for substantially equal work requiring equal skill, effort, and responsibility</li>
                  <li>• <strong>Family Medical Leave Act:</strong> Provides 12 weeks unpaid leave for qualifying family/medical reasons at companies with 50+ employees</li>
                  <li>• <strong>Workers' Compensation:</strong> State-mandated insurance coverage for work-related injuries and illnesses in all 50 states</li>
                  <li>• <strong>Unemployment Insurance:</strong> Federal-state program providing temporary income for qualifying unemployed workers, typically 26-39 weeks</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Financial Planning & Tax Considerations</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Tax Withholding:</strong> Federal income tax, Social Security (6.2%), Medicare (1.45%), plus state taxes vary by location and income level</li>
                  <li>• <strong>Retirement Savings:</strong> 401(k) contribution limits $23,000 (2024), with additional $7,500 catch-up for age 50+</li>
                  <li>• <strong>Health Savings Accounts:</strong> Triple tax advantage with $4,150 individual/$8,300 family contribution limits for high-deductible health plans</li>
                  <li>• <strong>Emergency Fund Strategy:</strong> Maintain 3-6 months expenses before aggressive investing, especially important for variable income workers</li>
                  <li>• <strong>Professional Development:</strong> Up to $5,250 employer education assistance excludable from taxable income annually</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-center text-sm sm:text-base text-gray-500 bg-gray-50 p-3 sm:p-4 rounded-lg">
          <p>
            <strong>Important Disclaimer:</strong> This salary calculator provides educational estimates based on standard working assumptions and should not be considered legal, financial, or tax advice. 
            Actual compensation varies significantly due to industry, location, experience, performance, and company policies. Employment laws, tax obligations, and benefit structures 
            differ by state and jurisdiction. Pay frequency requirements, overtime regulations, and worker classifications are subject to federal and state employment laws. 
            For personalized employment advice, compensation analysis, and legal guidance regarding workplace rights and obligations, consult with qualified employment attorneys, 
            certified public accountants, or human resources professionals who can analyze your specific situation and provide guidance tailored to your employment circumstances, 
            career goals, and local regulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculatorComponent;
