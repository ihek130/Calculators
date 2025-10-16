import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DollarSign, Home, TrendingUp, AlertCircle, Heart, Users, Calculator, FileText } from 'lucide-react';

const EstateTaxCalculatorComponent = () => {
  // Assets State
  const [realEstate, setRealEstate] = useState('0');
  const [investments, setInvestments] = useState('0');
  const [savings, setSavings] = useState('0');
  const [vehicles, setVehicles] = useState('0');
  const [retirement, setRetirement] = useState('0');
  const [lifeInsurance, setLifeInsurance] = useState('0');
  const [otherAssets, setOtherAssets] = useState('0');

  // Liabilities State
  const [debts, setDebts] = useState('0');
  const [expenses, setExpenses] = useState('0');
  const [charitable, setCharitable] = useState('0');
  const [stateTaxes, setStateTaxes] = useState('0');

  // Lifetime Gifted Amount
  const [lifetimeGifts, setLifetimeGifts] = useState('0');

  // 2025 Estate Tax Data
  const exemptionAmount2025 = 13990000; // $13.99 million
  const estateTaxRate = 0.40; // 40%
  const annualGiftExclusion2025 = 19000; // $19,000

  // Calculate Estate Tax
  const results = useMemo(() => {
    // Total Assets
    const totalAssets = 
      parseFloat(realEstate || '0') +
      parseFloat(investments || '0') +
      parseFloat(savings || '0') +
      parseFloat(vehicles || '0') +
      parseFloat(retirement || '0') +
      parseFloat(lifeInsurance || '0') +
      parseFloat(otherAssets || '0');

    // Total Liabilities
    const totalLiabilities = 
      parseFloat(debts || '0') +
      parseFloat(expenses || '0') +
      parseFloat(charitable || '0') +
      parseFloat(stateTaxes || '0');

    // Gross Estate
    const grossEstate = totalAssets;

    // Net Estate (after liabilities)
    const netEstate = grossEstate - totalLiabilities;

    // Lifetime Gifts
    const lifetimeGiftAmount = parseFloat(lifetimeGifts || '0');

    // Adjusted Taxable Estate
    const adjustedTaxableEstate = netEstate + lifetimeGiftAmount;

    // Available Exemption (reduced by lifetime gifts)
    const availableExemption = Math.max(0, exemptionAmount2025 - lifetimeGiftAmount);

    // Taxable Estate
    const taxableEstate = Math.max(0, adjustedTaxableEstate - exemptionAmount2025);

    // Federal Estate Tax
    const federalEstateTax = taxableEstate * estateTaxRate;

    // Net to Heirs
    const netToHeirs = netEstate - federalEstateTax;

    // Effective Tax Rate
    const effectiveTaxRate = grossEstate > 0 ? (federalEstateTax / grossEstate) * 100 : 0;

    return {
      totalAssets,
      totalLiabilities,
      grossEstate,
      netEstate,
      lifetimeGiftAmount,
      adjustedTaxableEstate,
      availableExemption,
      taxableEstate,
      federalEstateTax,
      netToHeirs,
      effectiveTaxRate,
      isSubjectToTax: taxableEstate > 0
    };
  }, [
    realEstate,
    investments,
    savings,
    vehicles,
    retirement,
    lifeInsurance,
    otherAssets,
    debts,
    expenses,
    charitable,
    stateTaxes,
    lifetimeGifts
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <FileText className="w-10 h-10 text-purple-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Estate Tax Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          The Estate Tax Calculator estimates federal estate tax due. Many states impose their own estate taxes, 
          but they tend to be less than the federal estate tax. This calculator is mainly intended for use by U.S. residents.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>2025 Federal Estate Tax:</strong> Lifetime exemption of ${(exemptionAmount2025 / 1000000).toFixed(2)} million, 
            40% tax rate on amounts above exemption. Annual gift exclusion: ${annualGiftExclusion2025.toLocaleString()}.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Card */}
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-green-900">
              <TrendingUp className="w-6 h-6" />
              Assets
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter the fair market value of all assets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="realEstate" className="text-xs sm:text-sm font-medium">
                Residence & Other Real Estate
              </Label>
              <Input
                id="realEstate"
                type="number"
                value={realEstate}
                onChange={(e) => setRealEstate(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investments" className="text-xs sm:text-sm font-medium">
                Stocks, Bonds, and Other Investments
              </Label>
              <Input
                id="investments"
                type="number"
                value={investments}
                onChange={(e) => setInvestments(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings" className="text-xs sm:text-sm font-medium">
                Savings, CDs, and Checking Account Balance
              </Label>
              <Input
                id="savings"
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicles" className="text-xs sm:text-sm font-medium">
                Vehicles, Boats, and Other Properties
              </Label>
              <Input
                id="vehicles"
                type="number"
                value={vehicles}
                onChange={(e) => setVehicles(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retirement" className="text-xs sm:text-sm font-medium">
                Retirement Plans (401k, IRA, etc.)
              </Label>
              <Input
                id="retirement"
                type="number"
                value={retirement}
                onChange={(e) => setRetirement(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifeInsurance" className="text-xs sm:text-sm font-medium">
                Life Insurance Benefit
              </Label>
              <Input
                id="lifeInsurance"
                type="number"
                value={lifeInsurance}
                onChange={(e) => setLifeInsurance(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherAssets" className="text-xs sm:text-sm font-medium">
                Other Assets
              </Label>
              <Input
                id="otherAssets"
                type="number"
                value={otherAssets}
                onChange={(e) => setOtherAssets(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-300 mt-4">
              <p className="text-xs sm:text-sm font-bold text-green-900">
                Total Assets: ${results.totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Deductions Card */}
        <Card className="shadow-xl border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-200">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-red-900">
              <AlertCircle className="w-6 h-6" />
              Liabilities, Costs, and Deductibles
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter all debts, expenses, and deductions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debts" className="text-xs sm:text-sm font-medium">
                Debts (mortgages, loans, credit cards, etc.)
              </Label>
              <Input
                id="debts"
                type="number"
                value={debts}
                onChange={(e) => setDebts(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenses" className="text-xs sm:text-sm font-medium">
                Funeral, Administration, and Claims Expenses
              </Label>
              <Input
                id="expenses"
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="charitable" className="text-xs sm:text-sm font-medium">
                Charitable Contributions
              </Label>
              <Input
                id="charitable"
                type="number"
                value={charitable}
                onChange={(e) => setCharitable(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stateTaxes" className="text-xs sm:text-sm font-medium">
                State Inheritance or Estate Taxes
              </Label>
              <Input
                id="stateTaxes"
                type="number"
                value={stateTaxes}
                onChange={(e) => setStateTaxes(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-300 mt-4">
              <p className="text-xs sm:text-sm font-bold text-red-900">
                Total Liabilities: ${results.totalLiabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="pt-4 border-t-2 space-y-2">
              <Label htmlFor="lifetimeGifts" className="text-xs sm:text-sm font-medium">
                Lifetime Gifted Amount
              </Label>
              <p className="text-xs text-gray-600">
                Total amount you've gifted tax-free in your lifetime
              </p>
              <Input
                id="lifetimeGifts"
                type="number"
                value={lifetimeGifts}
                onChange={(e) => setLifetimeGifts(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Annual gift exclusion: ${annualGiftExclusion2025.toLocaleString()} per person (2025)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Main Estate Tax Result */}
        <Card className={`border-2 shadow-xl ${results.isSubjectToTax ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {results.isSubjectToTax ? '⚠️ Estate Subject to Federal Tax' : '✅ Estate Below Tax Threshold'}
              </h3>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold">
                <span className={results.isSubjectToTax ? 'text-red-700' : 'text-green-700'}>
                  ${results.federalEstateTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-700">
                {results.isSubjectToTax 
                  ? 'Federal estate tax due on this estate' 
                  : 'No federal estate tax due - estate is below exemption threshold'}
              </p>
              {results.effectiveTaxRate > 0 && (
                <p className="text-xs sm:text-sm text-gray-600">
                  Effective tax rate: {results.effectiveTaxRate.toFixed(2)}% of total assets
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
            <CardTitle className="text-center text-gray-900 text-lg sm:text-xl">
              Estate Tax Calculation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Gross Estate (Total Assets)</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">
                    ${results.grossEstate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Less: Liabilities & Deductions</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-700">
                    -${results.totalLiabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Net Estate</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700">
                    ${results.netEstate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Plus: Lifetime Gifts</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-700">
                    +${results.lifetimeGiftAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Adjusted Taxable Estate</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700">
                    ${results.adjustedTaxableEstate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Less: Federal Exemption (2025)</p>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-700">
                    -${exemptionAmount2025.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Taxable Estate</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                    ${results.taxableEstate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-400">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Federal Estate Tax (40%)</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-700">
                    ${results.federalEstateTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 sm:p-6 rounded-lg border-2 border-green-400 mt-4">
                <p className="text-sm sm:text-base text-gray-600 mb-2">Net Amount to Heirs (after federal estate tax)</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-700">
                  ${results.netToHeirs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>

              {results.availableExemption < exemptionAmount2025 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 mt-4">
                  <p className="text-xs sm:text-sm text-yellow-900">
                    <strong>⚠️ Note:</strong> Your available exemption is reduced to ${results.availableExemption.toLocaleString()} 
                    due to ${results.lifetimeGiftAmount.toLocaleString()} in lifetime gifts.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <CardTitle className="text-blue-900 text-lg sm:text-xl">Quick Estate Planning Tips</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-1">💰 Use Your Wealth</p>
                <p className="text-xs text-gray-700">Spend or gift assets during your lifetime to reduce estate value.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-1">❤️ Charitable Donations</p>
                <p className="text-xs text-gray-700">Gifts to 501(c)3 charities avoid federal estate taxation entirely.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-1">💍 Spousal Transfer</p>
                <p className="text-xs text-gray-700">Assets passed to spouse are exempt from estate tax (unlimited marital deduction).</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-1">🎁 Annual Gifts</p>
                <p className="text-xs text-gray-700">Gift up to ${annualGiftExclusion2025.toLocaleString()} per person per year tax-free.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-1">📋 Create a Trust</p>
                <p className="text-xs text-gray-700">Trusts can protect assets and significantly reduce estate taxes.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-1">👨‍⚖️ Consult Professionals</p>
                <p className="text-xs text-gray-700">Estate planning is complex - work with attorneys and financial advisors.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational Content */}
      <div className="space-y-6">
        {/* Historical Estate Tax Exemption Table */}
        <Card className="shadow-xl border-2 border-gray-300">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2">
            <CardTitle className="text-gray-900 text-lg sm:text-xl">Historical Federal Estate Tax Exemption</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Estate tax exemption amounts and top tax rates from 2001 to 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left p-2 font-bold">Year</th>
                    <th className="text-right p-2 font-bold">Exemption Amount</th>
                    <th className="text-right p-2 font-bold">Top Tax Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50"><td className="p-2">2001</td><td className="text-right p-2">$675,000</td><td className="text-right p-2">55%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2002</td><td className="text-right p-2">$1,000,000</td><td className="text-right p-2">50%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2003</td><td className="text-right p-2">$1,000,000</td><td className="text-right p-2">49%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2004</td><td className="text-right p-2">$1,500,000</td><td className="text-right p-2">48%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2005</td><td className="text-right p-2">$1,500,000</td><td className="text-right p-2">47%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2006</td><td className="text-right p-2">$2,000,000</td><td className="text-right p-2">46%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2007</td><td className="text-right p-2">$2,000,000</td><td className="text-right p-2">45%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2008</td><td className="text-right p-2">$2,000,000</td><td className="text-right p-2">45%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2009</td><td className="text-right p-2">$3,500,000</td><td className="text-right p-2">45%</td></tr>
                  <tr className="hover:bg-gray-50 bg-yellow-50"><td className="p-2">2010</td><td className="text-right p-2 font-bold">$5,000,000*</td><td className="text-right p-2 font-bold">0%*</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2011</td><td className="text-right p-2">$5,000,000</td><td className="text-right p-2">35%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2012</td><td className="text-right p-2">$5,120,000</td><td className="text-right p-2">35%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2013</td><td className="text-right p-2">$5,250,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2014</td><td className="text-right p-2">$5,340,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2015</td><td className="text-right p-2">$5,430,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2016</td><td className="text-right p-2">$5,450,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2017</td><td className="text-right p-2">$5,490,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2018</td><td className="text-right p-2">$11,180,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2019</td><td className="text-right p-2">$11,400,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2020</td><td className="text-right p-2">$11,580,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2021</td><td className="text-right p-2">$11,700,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2022</td><td className="text-right p-2">$12,060,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2023</td><td className="text-right p-2">$12,920,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50"><td className="p-2">2024</td><td className="text-right p-2">$13,610,000</td><td className="text-right p-2">40%</td></tr>
                  <tr className="hover:bg-gray-50 bg-green-50"><td className="p-2 font-bold">2025</td><td className="text-right p-2 font-bold">$13,990,000</td><td className="text-right p-2 font-bold">40%</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              *In 2010, the estate tax was temporarily repealed, but estates could opt-in with a $5M exemption.
            </p>
          </CardContent>
        </Card>

        {/* What is Estate Tax? */}
        <Card className="shadow-lg border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg sm:text-xl">
              <FileText className="w-6 h-6" />
              What is Estate Tax?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              An <strong>estate tax</strong> is a federal or state levy on the net value of the property of a deceased person 
              before the assets are distributed to heirs. The estate tax is sometimes called the "death tax" since it is triggered 
              by the death of the property owner.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              In the U.S., only estates exceeding a certain value are subject to federal estate tax. For 2025, the federal 
              estate tax exemption is <strong>${(exemptionAmount2025 / 1000000).toFixed(2)} million</strong>. This means that 
              estates valued below this threshold are not subject to federal estate tax.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              The <strong>tax rate is 40%</strong> on the portion of the estate that exceeds the exemption amount. For example, 
              if an estate is worth $15 million, only $1.01 million would be subject to the 40% tax rate, resulting in 
              approximately $404,000 in federal estate tax.
            </p>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200 mt-4">
              <p className="text-xs sm:text-sm text-purple-900 font-medium">
                💡 <strong>Important:</strong> The current high exemption amount ($13.99M) is set to expire after 2025 
                unless Congress extends it. After 2025, the exemption may revert to approximately $7 million (adjusted for inflation).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estate Tax vs Inheritance Tax */}
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
              <Users className="w-6 h-6" />
              Estate Tax vs. Inheritance Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <h4 className="font-bold text-base sm:text-lg text-red-900 mb-2">Estate Tax</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>✓ Levied on the <strong>deceased person's estate</strong></li>
                  <li>✓ Paid <strong>before</strong> assets are distributed</li>
                  <li>✓ <strong>Federal</strong> and some state governments</li>
                  <li>✓ Based on <strong>total estate value</strong></li>
                  <li>✓ Applies if estate exceeds exemption</li>
                  <li>✓ Responsibility of the <strong>estate executor</strong></li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <h4 className="font-bold text-base sm:text-lg text-green-900 mb-2">Inheritance Tax</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>✓ Levied on the <strong>heir receiving assets</strong></li>
                  <li>✓ Paid <strong>after</strong> assets are distributed</li>
                  <li>✓ Only certain <strong>state governments</strong></li>
                  <li>✓ Based on <strong>inheritance amount received</strong></li>
                  <li>✓ May vary by heir's relationship</li>
                  <li>✓ Responsibility of the <strong>beneficiary</strong></li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mt-4">
              <p className="text-xs sm:text-sm text-blue-900">
                <strong>Note:</strong> There is <strong>no federal inheritance tax</strong> in the United States. Only six 
                states impose an inheritance tax: Iowa, Kentucky, Maryland, Nebraska, New Jersey, and Pennsylvania. 
                Some states have both estate and inheritance taxes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Determining Taxable Estate Value */}
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900 text-lg sm:text-xl">
              <Calculator className="w-6 h-6" />
              Determining Taxable Estate Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">1. Calculate Gross Estate</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  The gross estate includes the fair market value of all property and assets owned at death:
                </p>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Real estate (primary residence and investment properties)</li>
                  <li>• Stocks, bonds, mutual funds, and other investments</li>
                  <li>• Bank accounts, CDs, and money market accounts</li>
                  <li>• Retirement accounts (401k, IRA, pension plans)</li>
                  <li>• Life insurance death benefits (if deceased owned the policy)</li>
                  <li>• Business interests and partnerships</li>
                  <li>• Personal property (vehicles, jewelry, art, collectibles)</li>
                  <li>• Any other assets of value</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">2. Subtract Allowable Deductions</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  The following can be deducted from the gross estate:
                </p>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>Debts:</strong> Mortgages, loans, credit card balances</li>
                  <li>• <strong>Funeral expenses:</strong> Costs of burial or cremation</li>
                  <li>• <strong>Administrative expenses:</strong> Legal fees, executor fees, appraisal costs</li>
                  <li>• <strong>Charitable bequests:</strong> Donations to qualified 501(c)(3) organizations</li>
                  <li>• <strong>State estate/inheritance taxes:</strong> Taxes paid to state governments</li>
                  <li>• <strong>Marital deduction:</strong> Unlimited deduction for assets passing to surviving spouse</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">3. Add Back Lifetime Taxable Gifts</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Any gifts made during lifetime that exceeded the annual gift tax exclusion must be added back to 
                  calculate the <strong>adjusted taxable estate</strong>. This is because the estate and gift taxes 
                  are unified, and lifetime gifts reduce the available estate tax exemption.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">4. Apply Federal Exemption</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Subtract the federal estate tax exemption (${(exemptionAmount2025 / 1000000).toFixed(2)} million for 2025). 
                  If the result is positive, that amount is subject to the 40% federal estate tax rate.
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 mt-4">
              <p className="text-xs sm:text-sm text-green-900 font-medium">
                📊 <strong>Example:</strong> A $16 million gross estate with $1 million in debts = $15 million net estate. 
                After applying the $13.99 million exemption, $1.01 million is taxable. Federal estate tax due: 
                $1.01M × 40% = <strong>$404,000</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Strategies to Reduce Estate Tax */}
        <Card className="shadow-lg border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg sm:text-xl">
              <DollarSign className="w-6 h-6" />
              Strategies to Reduce Estate Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">💰 Strategic Gifting</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Gift assets during your lifetime to reduce estate value. Each person can gift up to 
                  ${annualGiftExclusion2025.toLocaleString()} per recipient per year (2025) without using 
                  their lifetime exemption. Married couples can gift $38,000 per recipient.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">❤️ Marital Transfers</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Assets transferred to a surviving U.S. citizen spouse are exempt from estate tax through the 
                  unlimited marital deduction. This allows couples to defer estate taxes until the second spouse's death.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">🏛️ Irrevocable Trusts</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Placing assets in an irrevocable trust removes them from your taxable estate. Common types include 
                  Irrevocable Life Insurance Trusts (ILITs), Grantor Retained Annuity Trusts (GRATs), and 
                  Qualified Personal Residence Trusts (QPRTs).
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">🎗️ Charitable Giving</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Donations to qualified 501(c)(3) charities are fully deductible from your estate. Consider 
                  Charitable Remainder Trusts (CRTs) or Charitable Lead Trusts (CLTs) for more sophisticated strategies.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">👨‍👩‍👧‍👦 Family Limited Partnerships</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  FLPs allow you to transfer business or investment assets to family members while retaining control. 
                  Transfers may qualify for valuation discounts, reducing the taxable estate value.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">🏠 Primary Residence Exclusion</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  While not an estate tax benefit, selling a primary residence during lifetime allows up to $250,000 
                  ($500,000 for couples) in capital gains exclusion, reducing overall estate value.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">📚 Education & Medical Gifts</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Payments made directly to educational institutions or medical providers on behalf of others are 
                  excluded from gift tax limits and don't count against your lifetime exemption.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">💼 Life Insurance Planning</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Life insurance proceeds can provide liquidity to pay estate taxes. Using an ILIT keeps the death 
                  benefit outside your taxable estate while still benefiting your heirs.
                </p>
              </div>
            </div>

            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-300 mt-4">
              <p className="text-xs sm:text-sm text-orange-900 font-medium">
                ⚠️ <strong>Important:</strong> Estate planning is complex and highly dependent on individual circumstances. 
                Always consult with qualified estate planning attorneys, CPAs, and financial advisors before implementing 
                any strategies.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Annual Gift Tax Exclusion */}
        <Card className="shadow-lg border-2 border-pink-200">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b-2 border-pink-200">
            <CardTitle className="flex items-center gap-2 text-pink-900 text-lg sm:text-xl">
              <Heart className="w-6 h-6" />
              Annual Gift Tax Exclusion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              The <strong>annual gift tax exclusion</strong> allows you to gift a certain amount to any number of 
              individuals each year without incurring gift tax or using your lifetime exemption. For 2025, the annual 
              exclusion is <strong>${annualGiftExclusion2025.toLocaleString()} per recipient</strong>.
            </p>

            <div className="bg-pink-50 p-3 sm:p-4 rounded-lg border border-pink-200">
              <h4 className="font-bold text-sm sm:text-base text-pink-900 mb-2">How It Works:</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• You can give ${annualGiftExclusion2025.toLocaleString()} to as many people as you want each year</li>
                <li>• Married couples can combine their exclusions for $38,000 per recipient</li>
                <li>• Gifts above the annual exclusion reduce your lifetime exemption</li>
                <li>• No gift tax return required if staying within the annual limit</li>
                <li>• The exclusion resets each calendar year</li>
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">💡 Example Strategy:</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                A married couple with 3 children and 8 grandchildren can gift:
              </p>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                <li>• $38,000 per child (3 children) = $114,000</li>
                <li>• $38,000 per grandchild (8 grandchildren) = $304,000</li>
                <li>• <strong>Total annual gifting: $418,000 tax-free</strong></li>
              </ul>
              <p className="text-xs sm:text-sm text-gray-700 mt-2">
                Over 10 years, this strategy removes <strong>$4.18 million</strong> from the taxable estate without 
                using any lifetime exemption.
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 italic">
              Note: Gifts to your spouse who is a U.S. citizen are unlimited and not subject to gift tax.
            </p>
          </CardContent>
        </Card>

        {/* Unified Credit System */}
        <Card className="shadow-lg border-2 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
            <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
              <FileText className="w-6 h-6" />
              Understanding the Unified Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              The U.S. uses a <strong>unified credit system</strong> that combines estate and gift taxes into a single 
              lifetime exemption. This means that any taxable gifts you make during your lifetime reduce the exemption 
              available for your estate at death.
            </p>

            <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg border border-cyan-200">
              <h4 className="font-bold text-sm sm:text-base text-cyan-900 mb-2">Key Points:</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• <strong>2025 lifetime exemption:</strong> ${(exemptionAmount2025 / 1000000).toFixed(2)} million 
                (combined for gifts and estate)</li>
                <li>• Gifts within the annual exclusion (${annualGiftExclusion2025.toLocaleString()}) don't count 
                against lifetime exemption</li>
                <li>• Taxable gifts above annual exclusion reduce available estate tax exemption</li>
                <li>• Gift tax rate and estate tax rate are both 40%</li>
                <li>• Portability allows unused exemption to transfer to surviving spouse</li>
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">📊 Example:</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                If you made $2 million in taxable gifts during your lifetime (above annual exclusions), your 
                available estate tax exemption would be reduced to:
              </p>
              <p className="text-sm font-bold text-gray-900 mt-2">
                ${(exemptionAmount2025 / 1000000).toFixed(2)}M - $2M = ${((exemptionAmount2025 - 2000000) / 1000000).toFixed(2)}M 
                available estate exemption
              </p>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300 mt-4">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>⏰ Important Deadline:</strong> The current high exemption amount is scheduled to sunset after 2025. 
                Unless Congress acts, the exemption will be cut approximately in half (to about $7M adjusted for inflation) 
                starting January 1, 2026. Consider using your exemption before it potentially decreases.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estate Planning Guide */}
        <Card className="shadow-lg border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
              <Home className="w-6 h-6" />
              Complete Estate Planning Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Estate planning is about more than just minimizing taxes—it's about ensuring your wishes are carried out 
              and your loved ones are protected. Here's a comprehensive checklist:
            </p>

            <div className="space-y-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">1. Essential Documents</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Last Will and Testament</li>
                  <li>✓ Revocable Living Trust (if applicable)</li>
                  <li>✓ Durable Power of Attorney</li>
                  <li>✓ Healthcare Power of Attorney</li>
                  <li>✓ Living Will / Advance Healthcare Directive</li>
                  <li>✓ HIPAA Authorization</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">2. Beneficiary Designations</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Review and update retirement account beneficiaries (401k, IRA)</li>
                  <li>✓ Review life insurance policy beneficiaries</li>
                  <li>✓ Check bank account transfer-on-death (TOD) designations</li>
                  <li>✓ Update investment account beneficiaries</li>
                  <li>✓ Ensure beneficiary forms match your current wishes</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">3. Asset Inventory</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Create a comprehensive list of all assets and liabilities</li>
                  <li>✓ Document location of important documents and passwords</li>
                  <li>✓ List all financial accounts and institutions</li>
                  <li>✓ Record digital assets (cryptocurrency, online accounts)</li>
                  <li>✓ Note location of safe deposit boxes and keys</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">4. Professional Team</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Estate planning attorney</li>
                  <li>✓ Certified Public Accountant (CPA)</li>
                  <li>✓ Financial advisor / wealth manager</li>
                  <li>✓ Insurance specialist</li>
                  <li>✓ Trust company or corporate trustee (if needed)</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">5. Special Considerations</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Plan for minor children (guardianship, trusts)</li>
                  <li>✓ Special needs planning for disabled beneficiaries</li>
                  <li>✓ Business succession planning for business owners</li>
                  <li>✓ Pet care provisions</li>
                  <li>✓ Funeral and burial preferences</li>
                  <li>✓ Digital legacy (social media, email accounts)</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">6. Regular Review Schedule</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Review estate plan every 3-5 years</li>
                  <li>✓ Update after major life events (marriage, divorce, birth, death)</li>
                  <li>✓ Review when tax laws change</li>
                  <li>✓ Update after significant asset changes</li>
                  <li>✓ Verify executors and trustees are still appropriate</li>
                </ul>
              </div>
            </div>

            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-300 mt-4">
              <p className="text-xs sm:text-sm text-indigo-900 font-medium">
                👨‍⚖️ <strong>Professional Advice Required:</strong> Estate planning involves complex legal and tax issues. 
                This calculator provides estimates only. Always work with qualified professionals to create a comprehensive 
                estate plan tailored to your specific situation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="shadow-lg border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
              <strong>Disclaimer:</strong> This Estate Tax Calculator is provided for informational and educational purposes only. 
              It should not be considered legal, tax, or financial advice. Estate tax laws are complex and subject to change. 
              State laws vary significantly. Actual tax liability may differ based on numerous factors not captured in this calculator. 
              Always consult with qualified estate planning attorneys, certified public accountants, and financial advisors before 
              making estate planning decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstateTaxCalculatorComponent;
