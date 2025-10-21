import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Info, 
  Calculator, 
  Percent,
  DollarSign,
  Tag,
  TrendingDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';

type DiscountType = 'percent' | 'fixed';

interface DiscountInputs {
  priceBeforeDiscount: number | null;
  discount: number | null;
  priceAfterDiscount: number | null;
}

interface DiscountResults {
  priceBeforeDiscount: number;
  discount: number;
  priceAfterDiscount: number;
  savedAmount: number;
  savedPercent: number;
}

const DiscountCalculatorComponent: React.FC = () => {
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [inputs, setInputs] = useState<DiscountInputs>({
    priceBeforeDiscount: 59.99,
    discount: 15,
    priceAfterDiscount: null
  });
  const [results, setResults] = useState<DiscountResults | null>(null);

  useEffect(() => {
    calculateDiscount();
  }, [inputs, discountType]);

  const calculateDiscount = () => {
    try {
      const { priceBeforeDiscount, discount, priceAfterDiscount } = inputs;
      const nonNullCount = [priceBeforeDiscount, discount, priceAfterDiscount].filter(v => v !== null).length;

      if (nonNullCount < 2) {
        setResults(null);
        return;
      }

      let calcPriceBefore = priceBeforeDiscount;
      let calcDiscount = discount;
      let calcPriceAfter = priceAfterDiscount;
      let calcSavedAmount = 0;
      let calcSavedPercent = 0;

      // Scenario 1: Price Before and Discount provided
      if (priceBeforeDiscount !== null && discount !== null && priceBeforeDiscount >= 0 && discount >= 0) {
        calcPriceBefore = priceBeforeDiscount;
        calcDiscount = discount;
        
        if (discountType === 'percent') {
          // Discount is a percentage
          if (calcDiscount > 100) calcDiscount = 100;
          calcSavedAmount = (calcDiscount / 100) * calcPriceBefore;
          calcPriceAfter = calcPriceBefore - calcSavedAmount;
          calcSavedPercent = calcDiscount;
        } else {
          // Discount is a fixed amount
          calcSavedAmount = calcDiscount;
          calcPriceAfter = calcPriceBefore - calcSavedAmount;
          if (calcPriceAfter < 0) calcPriceAfter = 0;
          calcSavedPercent = calcPriceBefore > 0 ? (calcSavedAmount / calcPriceBefore) * 100 : 0;
        }
      }
      // Scenario 2: Price Before and Price After provided
      else if (priceBeforeDiscount !== null && priceAfterDiscount !== null && priceBeforeDiscount >= 0 && priceAfterDiscount >= 0) {
        calcPriceBefore = priceBeforeDiscount;
        calcPriceAfter = priceAfterDiscount;
        calcSavedAmount = calcPriceBefore - calcPriceAfter;
        calcSavedPercent = calcPriceBefore > 0 ? (calcSavedAmount / calcPriceBefore) * 100 : 0;
        
        if (discountType === 'percent') {
          calcDiscount = calcSavedPercent;
        } else {
          calcDiscount = calcSavedAmount;
        }
      }
      // Scenario 3: Discount and Price After provided
      else if (discount !== null && priceAfterDiscount !== null && discount >= 0 && priceAfterDiscount >= 0) {
        calcDiscount = discount;
        calcPriceAfter = priceAfterDiscount;
        
        if (discountType === 'percent') {
          // discount% = (priceBefore - priceAfter) / priceBefore * 100
          // discount% * priceBefore = (priceBefore - priceAfter) * 100
          // discount% * priceBefore = 100 * priceBefore - 100 * priceAfter
          // priceBefore * (discount% - 100) = -100 * priceAfter
          // priceBefore = 100 * priceAfter / (100 - discount%)
          if (calcDiscount >= 100) {
            setResults(null);
            return;
          }
          calcPriceBefore = (100 * calcPriceAfter) / (100 - calcDiscount);
          calcSavedAmount = calcPriceBefore - calcPriceAfter;
          calcSavedPercent = calcDiscount;
        } else {
          // Fixed amount discount
          calcPriceBefore = calcPriceAfter + calcDiscount;
          calcSavedAmount = calcDiscount;
          calcSavedPercent = calcPriceBefore > 0 ? (calcSavedAmount / calcPriceBefore) * 100 : 0;
        }
      }
      else {
        setResults(null);
        return;
      }

      setResults({
        priceBeforeDiscount: calcPriceBefore,
        discount: calcDiscount,
        priceAfterDiscount: calcPriceAfter,
        savedAmount: calcSavedAmount,
        savedPercent: calcSavedPercent
      });
    } catch (error) {
      console.error('Error calculating discount:', error);
      setResults(null);
    }
  };

  const handleInputChange = (field: keyof DiscountInputs, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setInputs({ ...inputs, [field]: numValue });
  };

  const handleReset = () => {
    setInputs({
      priceBeforeDiscount: 59.99,
      discount: 15,
      priceAfterDiscount: null
    });
    setDiscountType('percent');
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
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Tag className="h-8 w-8 text-red-600" />
          Discount Calculator
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Calculate discounts, savings, and final prices with ease
        </p>
      </div>

      {/* Calculator Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Calculator className="h-6 w-6 text-red-600" />
            Calculate Discount
          </CardTitle>
          <CardDescription>
            Please provide any 2 values below to calculate the discount
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Discount Type Selector */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <Label className="text-sm font-semibold mb-3 block">Discount Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => setDiscountType('percent')}
                  variant={discountType === 'percent' ? 'default' : 'outline'}
                  className="w-full text-sm sm:text-base"
                >
                  <Percent className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Percentage Off</span>
                </Button>
                <Button
                  onClick={() => setDiscountType('fixed')}
                  variant={discountType === 'fixed' ? 'default' : 'outline'}
                  className="w-full text-sm sm:text-base"
                >
                  <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Fixed Amount Off</span>
                </Button>
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priceBefore" className="text-sm font-semibold">
                  Price Before Discount ($)
                </Label>
                <Input
                  id="priceBefore"
                  type="number"
                  value={inputs.priceBeforeDiscount ?? ''}
                  onChange={(e) => handleInputChange('priceBeforeDiscount', e.target.value)}
                  placeholder="Enter original price"
                  min="0"
                  step="0.01"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-semibold">
                  Discount ({discountType === 'percent' ? '%' : '$'})
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={inputs.discount ?? ''}
                  onChange={(e) => handleInputChange('discount', e.target.value)}
                  placeholder={`Enter discount ${discountType === 'percent' ? '%' : 'amount'}`}
                  min="0"
                  max={discountType === 'percent' ? '100' : undefined}
                  step={discountType === 'percent' ? '1' : '0.01'}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceAfter" className="text-sm font-semibold">
                  Price After Discount ($)
                </Label>
                <Input
                  id="priceAfter"
                  type="number"
                  value={inputs.priceAfterDiscount ?? ''}
                  onChange={(e) => handleInputChange('priceAfterDiscount', e.target.value)}
                  placeholder="Enter final price"
                  min="0"
                  step="0.01"
                  className="text-base"
                />
              </div>
            </div>

            <div className="flex gap-3">
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
          {/* Main Results Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Price Before</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {formatCurrency(results.priceBeforeDiscount)}
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
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Discount</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      {discountType === 'percent' ? formatPercent(results.discount) : formatCurrency(results.discount)}
                    </p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Price After</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {formatCurrency(results.priceAfterDiscount)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">You Saved</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                      {formatCurrency(results.savedAmount)}
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Summary */}
          <Card className="shadow-lg border-t-4 border-t-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg sm:text-xl">Savings Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Original Price:</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(results.priceBeforeDiscount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Discount Amount:</span>
                    <span className="text-base font-bold text-red-600">-{formatCurrency(results.savedAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-500">
                    <span className="text-sm font-semibold text-green-900">Final Price:</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(results.priceAfterDiscount)}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border-2 border-orange-300">
                  <Sparkles className="h-12 w-12 text-orange-500 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Total Savings</p>
                  <p className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">
                    {formatCurrency(results.savedAmount)}
                  </p>
                  <p className="text-lg font-semibold text-orange-700">
                    ({formatPercent(results.savedPercent)} off)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Breakdown */}
          <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-3 text-base sm:text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                How This Was Calculated:
              </h3>
              <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                {discountType === 'percent' ? (
                  <>
                    <p><strong>Discount Type:</strong> Percentage Off</p>
                    <p><strong>Formula:</strong> Final Price = Original Price × (1 - Discount% / 100)</p>
                    <p><strong>Calculation:</strong> {formatCurrency(results.priceBeforeDiscount)} × (1 - {results.discount.toFixed(2)}% / 100) = {formatCurrency(results.priceAfterDiscount)}</p>
                    <p><strong>Savings:</strong> {formatCurrency(results.priceBeforeDiscount)} × ({results.discount.toFixed(2)}% / 100) = {formatCurrency(results.savedAmount)}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Discount Type:</strong> Fixed Amount Off</p>
                    <p><strong>Formula:</strong> Final Price = Original Price - Discount Amount</p>
                    <p><strong>Calculation:</strong> {formatCurrency(results.priceBeforeDiscount)} - {formatCurrency(results.discount)} = {formatCurrency(results.priceAfterDiscount)}</p>
                    <p><strong>Percentage Saved:</strong> ({formatCurrency(results.savedAmount)} / {formatCurrency(results.priceBeforeDiscount)}) × 100 = {formatPercent(results.savedPercent)}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content - Step 2 */}
      <Card className="shadow-lg border-t-4 border-t-red-500">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Info className="h-6 w-6 text-red-600" />
            Understanding Discounts
          </CardTitle>
          <CardDescription>
            Comprehensive guide to discount calculations and savings strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* What is a Discount? */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-red-600" />
              What is a Discount?
            </h2>
            <div className="prose max-w-none">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                The term discount can be used to refer to many forms of reduction in the price of a good or service. 
                Understanding how discounts work is essential for both consumers looking to save money and businesses 
                managing pricing strategies. The two most common types of discounts are discounts in which you get a 
                percent off, or a fixed amount off.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-3">
                Discounts play a crucial role in retail, e-commerce, and business-to-business transactions. They serve 
                multiple purposes including clearing inventory, attracting customers, rewarding loyalty, and competing 
                with other businesses. Knowing how to calculate discounts accurately ensures you understand the true 
                value of savings and can make informed purchasing decisions.
              </p>
            </div>
          </section>

          {/* Percentage Discount */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-600" />
              Percentage Discount (Percent Off)
            </h2>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Key Concept</h3>
              <p className="text-xs sm:text-sm text-purple-800">
                A percent off of a price typically refers to getting some percent, say 10%, off of the original price 
                of the product or service. This is the most common type of discount you'll encounter in retail and online shopping.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Understanding the Formula</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-mono text-sm sm:text-base text-center text-gray-800 mb-2">
                  Discount Amount = Original Price × (Discount% / 100)
                </p>
                <p className="font-mono text-sm sm:text-base text-center text-gray-800">
                  Final Price = Original Price - Discount Amount
                </p>
                <p className="text-center text-xs text-gray-600 mt-3">Or equivalently:</p>
                <p className="font-mono text-sm sm:text-base text-center text-gray-800 mt-1">
                  Final Price = Original Price × (1 - Discount% / 100)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Step-by-Step Example</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Example: 10% off $45</h4>
                <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                  <p><strong>Step 1:</strong> Calculate the discount amount</p>
                  <p className="ml-4">10% of $45 = 0.10 × 45 = $4.50</p>
                  
                  <p className="mt-3"><strong>Step 2:</strong> Subtract from original price</p>
                  <p className="ml-4">$45 – $4.50 = $40.50</p>
                  
                  <p className="mt-3"><strong>Alternative Method:</strong> Calculate remaining percentage</p>
                  <p className="ml-4">100% - 10% = 90%</p>
                  <p className="ml-4">90% of $45 = 0.90 × 45 = $40.50</p>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                    <p className="font-semibold">Result: In this example, you are saving 10%, or $4.50</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Common Percentage Discounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-2 text-left">Discount %</th>
                      <th className="border border-gray-300 p-2 text-left">On $100</th>
                      <th className="border border-gray-300 p-2 text-left">You Pay</th>
                      <th className="border border-gray-300 p-2 text-left">You Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">10%</td>
                      <td className="border border-gray-300 p-2">$10.00 off</td>
                      <td className="border border-gray-300 p-2 text-green-700">$90.00</td>
                      <td className="border border-gray-300 p-2 text-orange-700">$10.00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">15%</td>
                      <td className="border border-gray-300 p-2">$15.00 off</td>
                      <td className="border border-gray-300 p-2 text-green-700">$85.00</td>
                      <td className="border border-gray-300 p-2 text-orange-700">$15.00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">20%</td>
                      <td className="border border-gray-300 p-2">$20.00 off</td>
                      <td className="border border-gray-300 p-2 text-green-700">$80.00</td>
                      <td className="border border-gray-300 p-2 text-orange-700">$20.00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">25%</td>
                      <td className="border border-gray-300 p-2">$25.00 off</td>
                      <td className="border border-gray-300 p-2 text-green-700">$75.00</td>
                      <td className="border border-gray-300 p-2 text-orange-700">$25.00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">50%</td>
                      <td className="border border-gray-300 p-2">$50.00 off</td>
                      <td className="border border-gray-300 p-2 text-green-700">$50.00</td>
                      <td className="border border-gray-300 p-2 text-orange-700">$50.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Fixed Amount Discount */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Fixed Amount Discount (Dollar Off)
            </h2>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Key Concept</h3>
              <p className="text-xs sm:text-sm text-green-800">
                A fixed amount off of a price refers to subtracting whatever the fixed amount is from the original price. 
                This type of discount is straightforward and doesn't require percentage calculations.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Understanding the Formula</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-mono text-sm sm:text-base text-center text-gray-800">
                  Final Price = Original Price - Fixed Discount Amount
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Step-by-Step Example</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Example: $20 off $95</h4>
                <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                  <p><strong>Given:</strong></p>
                  <p className="ml-4">• Original price: $95</p>
                  <p className="ml-4">• Discount coupon: $20 off</p>
                  
                  <p className="mt-3"><strong>Calculation:</strong></p>
                  <p className="ml-4">$95 - $20 = $75</p>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                    <p className="font-semibold">Result: In this example, you are saving the fixed amount of $20</p>
                    <p className="mt-2">Percentage saved: ($20 / $95) × 100 = 21.05%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">When to Use Fixed Discounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Advantages</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Simpler to understand and calculate</li>
                    <li>• Better for low-priced items (bigger % impact)</li>
                    <li>• Creates specific dollar-value perception</li>
                    <li>• Easier to budget exact savings</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Common Uses</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Coupons and vouchers</li>
                    <li>• Rebates and cashback offers</li>
                    <li>• Loyalty program rewards</li>
                    <li>• First-time buyer incentives</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Comparing Discount Types */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              Comparing Discount Types
            </h2>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Which Discount is Better?</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                The value of percentage versus fixed-amount discounts depends on the original price. Understanding this 
                relationship helps you identify the best deals when shopping.
              </p>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">Break-Even Point</h4>
                <p className="text-xs sm:text-sm text-yellow-800 mb-2">
                  For a given percentage discount and fixed dollar discount, there's a specific price where both discounts 
                  provide the same savings:
                </p>
                <p className="font-mono text-sm text-center text-yellow-900 bg-yellow-100 p-2 rounded">
                  Break-Even Price = Fixed Discount / (Percentage / 100)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Example Comparison</h4>
                <p className="text-xs sm:text-sm text-blue-800 mb-2">
                  <strong>Scenario:</strong> You have a 20% off coupon and a $15 off coupon for the same item.
                </p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full border-collapse border border-blue-300 text-xs">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="border border-blue-300 p-2">Original Price</th>
                        <th className="border border-blue-300 p-2">20% Off Saves</th>
                        <th className="border border-blue-300 p-2">$15 Off Saves</th>
                        <th className="border border-blue-300 p-2">Better Deal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-blue-300 p-2">$50</td>
                        <td className="border border-blue-300 p-2">$10.00</td>
                        <td className="border border-blue-300 p-2 font-bold">$15.00</td>
                        <td className="border border-blue-300 p-2 text-green-700">$15 off</td>
                      </tr>
                      <tr>
                        <td className="border border-blue-300 p-2">$75</td>
                        <td className="border border-blue-300 p-2">$15.00</td>
                        <td className="border border-blue-300 p-2">$15.00</td>
                        <td className="border border-blue-300 p-2 text-gray-700">Same</td>
                      </tr>
                      <tr>
                        <td className="border border-blue-300 p-2">$100</td>
                        <td className="border border-blue-300 p-2 font-bold">$20.00</td>
                        <td className="border border-blue-300 p-2">$15.00</td>
                        <td className="border border-blue-300 p-2 text-green-700">20% off</td>
                      </tr>
                      <tr>
                        <td className="border border-blue-300 p-2">$150</td>
                        <td className="border border-blue-300 p-2 font-bold">$30.00</td>
                        <td className="border border-blue-300 p-2">$15.00</td>
                        <td className="border border-blue-300 p-2 text-green-700">20% off</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs sm:text-sm text-blue-800 mt-3">
                  <strong>Key Insight:</strong> The $15 off coupon is better for items under $75, while the 20% off 
                  coupon is better for items over $75. At exactly $75, both provide the same $15 savings.
                </p>
              </div>
            </div>
          </section>

          {/* Advanced Discount Scenarios */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-600" />
              Advanced Discount Scenarios
            </h2>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Stackable Discounts</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Some retailers allow multiple discounts to be applied sequentially, known as stackable discounts. 
                Understanding how these work can help you maximize savings, but be careful—the order matters and the 
                total savings may not be what you expect.
              </p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">⚠️ Common Misconception</h4>
                <p className="text-xs sm:text-sm text-red-800">
                  Many people incorrectly believe that a 20% discount followed by a 15% discount equals a 35% total 
                  discount. This is NOT correct! Each subsequent discount applies to the already-reduced price, not 
                  the original price.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Example: Stacking 20% + 15% Discounts</h4>
                <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                  <p><strong>Original Price:</strong> $100</p>
                  
                  <p className="mt-2"><strong>Step 1:</strong> Apply 20% discount</p>
                  <p className="ml-4">$100 × 0.20 = $20 off</p>
                  <p className="ml-4">New price: $100 - $20 = $80</p>
                  
                  <p className="mt-2"><strong>Step 2:</strong> Apply 15% discount to the new price</p>
                  <p className="ml-4">$80 × 0.15 = $12 off</p>
                  <p className="ml-4">Final price: $80 - $12 = $68</p>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                    <p><strong>Total Saved:</strong> $100 - $68 = $32</p>
                    <p><strong>Effective Discount:</strong> 32% (NOT 35%!)</p>
                    <p className="mt-2 text-xs"><em>Formula: 1 - (0.80 × 0.85) = 1 - 0.68 = 0.32 = 32%</em></p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">General Formula for Stacked Discounts</h4>
                <p className="font-mono text-xs sm:text-sm text-center text-gray-800 mb-2">
                  Final Price = Original Price × (1 - D₁/100) × (1 - D₂/100) × ... × (1 - Dₙ/100)
                </p>
                <p className="text-xs text-center text-gray-600">
                  Where D₁, D₂, ..., Dₙ are the sequential discount percentages
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Minimum Purchase Requirements</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Many discounts come with conditions such as "Buy 2, Get 20% off" or "$10 off purchases over $50". 
                These can be great deals, but it's important to calculate whether buying extra items to qualify for 
                the discount actually saves you money overall.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-2 border-yellow-200 shadow-sm">
                  <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">Questions to Ask</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Do I need the extra items?</li>
                    <li>• Will unused items go to waste?</li>
                    <li>• What's the per-unit price with vs. without discount?</li>
                    <li>• Are there cheaper alternatives elsewhere?</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Smart Shopping Tips</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Split purchases with friends/family</li>
                    <li>• Stock up on non-perishables</li>
                    <li>• Calculate savings per additional dollar spent</li>
                    <li>• Don't buy just to reach the threshold</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Shopping Strategies */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-600" />
              Smart Shopping Strategies
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">1. Compare Multiple Stores</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  A 20% discount at a store with higher base prices might still be more expensive than regular prices 
                  elsewhere. Always compare final prices, not just discount percentages.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">2. Time Your Purchases</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Major sales events (Black Friday, end-of-season clearances) often offer the deepest discounts. 
                  Plan non-urgent purchases around these events for maximum savings.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">3. Use Price Tracking Tools</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Browser extensions and apps can track price history and alert you to genuine discounts vs. 
                  artificially inflated "original" prices.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">4. Stack Coupons & Cashback</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Combine store discounts with manufacturer coupons, credit card rewards, and cashback apps for 
                  maximum savings. Check store policies on coupon stacking.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">5. Beware of Fake Discounts</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Some retailers inflate "original" prices to make discounts appear larger. Research typical prices 
                  before assuming a discount is genuine.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">6. Calculate Per-Unit Cost</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Bulk discounts aren't always better deals. Divide the final price by quantity to compare per-unit 
                  costs across different package sizes and discounts.
                </p>
              </div>
            </div>
          </section>

          {/* Business Perspective */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-teal-600" />
              Discount Strategies for Businesses
            </h2>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
              <p className="text-xs sm:text-sm text-teal-800">
                For business owners, discounts are powerful tools for driving sales, clearing inventory, and building 
                customer loyalty. However, they must be used strategically to avoid eroding profit margins.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">When to Offer Discounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✓ Good Times for Discounts</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700 list-disc list-inside">
                    <li>Clearing seasonal or excess inventory</li>
                    <li>Launching new products (loss leader strategy)</li>
                    <li>Rewarding loyal customers</li>
                    <li>Competing during slow sales periods</li>
                    <li>Acquiring new customers with first-purchase offers</li>
                    <li>Celebrating business milestones</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">✗ Avoid Discounts When</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700 list-disc list-inside">
                    <li>Product already selling well at full price</li>
                    <li>Margins are already thin</li>
                    <li>Brand positioning emphasizes premium quality</li>
                    <li>During peak demand periods</li>
                    <li>Too frequently (trains customers to wait)</li>
                    <li>Without clear business objectives</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Psychological Pricing Strategies</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-2 text-left">Strategy</th>
                      <th className="border border-gray-300 p-2 text-left">Example</th>
                      <th className="border border-gray-300 p-2 text-left">Why It Works</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">Charm Pricing</td>
                      <td className="border border-gray-300 p-2">$19.99 instead of $20.00</td>
                      <td className="border border-gray-300 p-2">Perceived as significantly cheaper</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">Anchor Pricing</td>
                      <td className="border border-gray-300 p-2">Show original price: <s>$100</s> Now $75</td>
                      <td className="border border-gray-300 p-2">Creates reference point for value</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">Bundle Discounts</td>
                      <td className="border border-gray-300 p-2">Buy 3, save 20%</td>
                      <td className="border border-gray-300 p-2">Increases average order value</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">Time-Limited</td>
                      <td className="border border-gray-300 p-2">24-hour flash sale</td>
                      <td className="border border-gray-300 p-2">Creates urgency and FOMO</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Discount Math Tips and Tricks */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Quick Mental Math for Discounts
            </h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Mental Shortcuts</h3>
              <p className="text-xs sm:text-sm text-blue-800">
                Being able to quickly estimate discounts in your head helps you make faster shopping decisions and 
                spot good deals on the fly. Here are some practical mental math techniques for common discount percentages.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Easy Percentage Calculations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">10% Discount</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Simply move the decimal point one place to the left.
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    Example: 10% of $67.50 = $6.75<br/>
                    Final price: $67.50 - $6.75 = $60.75
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">20% Discount</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Calculate 10% and double it, or multiply the price by 0.8.
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    Example: 20% of $50 = $10 (double of $5)<br/>
                    Final price: $50 × 0.8 = $40
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">25% Discount</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Divide the price by 4, or multiply by 0.75.
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    Example: 25% of $80 = $20 ($80 ÷ 4)<br/>
                    Final price: $80 - $20 = $60
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                  <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">50% Discount</h4>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Simply divide the price by 2—the easiest calculation!
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    Example: 50% of $98 = $49<br/>
                    Final price: $49 (half the original)
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">Pro Tip: Reverse Calculation</h4>
                <p className="text-xs sm:text-sm text-yellow-800">
                  Instead of calculating the discount and subtracting, calculate what percentage you'll pay directly. 
                  For a 30% discount, you pay 70%. So multiply the original price by 0.70 in one step rather than 
                  calculating 30% and subtracting it. This is faster and less prone to errors.
                </p>
                <p className="text-xs text-yellow-800 mt-2">
                  <strong>Example:</strong> $85 with 30% off = $85 × 0.70 = $59.50 (one step instead of two!)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Compound Discount Tricks</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                When dealing with multiple sequential discounts, remember that order doesn't matter mathematically—20% 
                then 15% gives the same result as 15% then 20%. However, the combined effect is always less than simply 
                adding the percentages. A useful mental model is that with two discounts, you're applying the second 
                discount to an already reduced price, so you're getting a discount on a discount.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Quick Formula for Two Discounts:</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  To find the equivalent single discount when stacking two percentage discounts:
                </p>
                <p className="font-mono text-sm text-center text-gray-800 bg-white p-2 rounded border border-gray-300">
                  Equivalent Discount = D₁ + D₂ - (D₁ × D₂ / 100)
                </p>
                <p className="text-xs text-gray-600 mt-3">
                  <strong>Example:</strong> 20% + 15% discounts<br/>
                  Equivalent = 20 + 15 - (20 × 15 / 100) = 35 - 3 = 32% total discount
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Real-World Discount Scenarios</h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                  <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">Scenario 1: Sale + Coupon</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    You find a shirt on sale for 25% off its original $60 price. You also have a coupon for an 
                    additional 10% off the sale price. Some shoppers might think they're getting 35% off, but let's 
                    calculate the real savings: First, 25% off $60 = $45. Then 10% off $45 = $4.50 discount, bringing 
                    the final price to $40.50. Your actual total discount is $19.50 out of $60, which equals 32.5%, 
                    not 35%. Understanding this prevents disappointment at checkout.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm">
                  <h4 className="font-semibold text-teal-900 mb-2 text-sm sm:text-base">Scenario 2: Bulk Discounts</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    A store offers "Buy 2 items at regular price, get 50% off the third item." This sounds generous, 
                    but let's analyze: If each item costs $30, you'd pay $30 + $30 + $15 = $75 for three items. That's 
                    an average of $25 per item, which is only a 16.7% discount per item overall, not 50%. The "50% off" 
                    applies to only one of three items, so the psychological impact is bigger than the actual savings. 
                    Always calculate the per-unit price to compare these deals with other offers or competing stores.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border-2 border-red-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Key Takeaways</h2>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span><strong>Percentage discounts</strong> apply a percent reduction to the original price. Calculate 
                as: Final Price = Original × (1 - Discount%/100)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span><strong>Fixed-amount discounts</strong> subtract a specific dollar amount. Simpler to calculate 
                but value varies with original price.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span><strong>Stacked discounts</strong> don't simply add up—each subsequent discount applies to the 
                already-reduced price, not the original.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span>Use mental math shortcuts: 10% = move decimal, 25% = divide by 4, 50% = divide by 2. 
                Calculate what you'll pay (e.g., 0.70 for 30% off) instead of the discount amount.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span>Compare discounts by calculating the <strong>final price</strong>, not just the discount 
                percentage. A bigger % off isn't always better.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span>For businesses, strategic discounting can drive sales and clear inventory, but overuse can 
                train customers to wait for sales and erode profit margins.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span>Always verify that "original" prices are genuine—some retailers inflate pre-discount prices 
                to make sales appear more attractive.</span>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscountCalculatorComponent;
