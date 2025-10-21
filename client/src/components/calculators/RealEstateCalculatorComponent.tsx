import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, DollarSign, Calculator, TrendingUp, Building, Ruler, Package, Thermometer, Layers } from "lucide-react";
import { Link } from "wouter";

interface CalculatorLink {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const RealEstateCalculatorComponent = () => {
  const financialCalculators: CalculatorLink[] = [
    {
      title: "Mortgage Calculator",
      description: "Plan real estate mortgage loans or compare them against other loans.",
      icon: <Home className="h-6 w-6" />,
      link: "/calculators/mortgage-calculator",
    },
    {
      title: "House Affordability Calculator",
      description: "Calculate residential real estate affordability based on household income-to-debt estimates or fixed monthly budgets.",
      icon: <Building className="h-6 w-6" />,
      link: "/calculators/house-affordability-calculator",
    },
    {
      title: "Mortgage Payoff Calculator",
      description: "Evaluate mortgage payoffs with additional or lump sum payments.",
      icon: <TrendingUp className="h-6 w-6" />,
      link: "/calculators/mortgage-payoff-calculator",
    },
    {
      title: "Refinance Calculator",
      description: "Plan and/or compare real estate loan refinancing options.",
      icon: <Calculator className="h-6 w-6" />,
      link: "/calculators/finance-calculator",
    },
    {
      title: "FHA Loan Calculator",
      description: "Estimate and evaluate the payments and options for FHA loans.",
      icon: <DollarSign className="h-6 w-6" />,
      link: "/calculators/loan-calculator",
    },
    {
      title: "VA Mortgage Calculator",
      description: "Estimate and evaluate the payments and options for VA loans.",
      icon: <DollarSign className="h-6 w-6" />,
      link: "/calculators/mortgage-calculator",
    },
    {
      title: "Down Payment Calculator",
      description: "Calculations centered around the down payment of a home purchase.",
      icon: <Calculator className="h-6 w-6" />,
      link: "/calculators/payment-calculator",
    },
    {
      title: "APR Calculator",
      description: "Help figure out the real APR of your loan with fees and points.",
      icon: <TrendingUp className="h-6 w-6" />,
      link: "/calculators/interest-rate-calculator",
    },
    {
      title: "Rental Property Calculator",
      description: "Calculate return percentages, capitalization rate, and cashflows of rental property investments.",
      icon: <Building className="h-6 w-6" />,
      link: "/calculators/investment-calculator",
    },
    {
      title: "Rent Calculator",
      description: "Estimate rental fee affordability based on income and debt levels.",
      icon: <Home className="h-6 w-6" />,
      link: "/calculators/rent-calculator",
    },
    {
      title: "Rent vs. Buy Calculator",
      description: "Evaluate the financial feasibility of a rent-or-buy decision.",
      icon: <TrendingUp className="h-6 w-6" />,
      link: "/calculators/savings-calculator",
    },
  ];

  const otherCalculators: CalculatorLink[] = [
    {
      title: "Area Calculator",
      description: "Estimate the area of real estate property.",
      icon: <Ruler className="h-6 w-6" />,
      link: "/calculators/area-calculator",
    },
    {
      title: "Concrete Calculator",
      description: "Estimate the amount of concrete for a real estate project.",
      icon: <Package className="h-6 w-6" />,
      link: "/calculators/concrete-calculator",
    },
    {
      title: "BTU Calculator",
      description: "Estimate the number of BTUs (British Thermal Units) needed for heating or cooling of a particular property.",
      icon: <Thermometer className="h-6 w-6" />,
      link: "/calculators/btu-calculator",
    },
    {
      title: "Stair Calculator",
      description: "Calculates the stair parameters for a real estate project.",
      icon: <Layers className="h-6 w-6" />,
      link: "/calculators/stair-calculator",
    },
    {
      title: "Tile Calculator",
      description: "Estimate the number of tiles for floor, roof, or any other surface coverage needed for any real estate project.",
      icon: <Layers className="h-6 w-6" />,
      link: "/calculators/tile-calculator",
    },
    {
      title: "Square Footage Calculator",
      description: "Estimate the square footage of real estate.",
      icon: <Ruler className="h-6 w-6" />,
      link: "/calculators/square-footage-calculator",
    },
    {
      title: "Roofing Calculator",
      description: "Estimate the roof area and the materials needed for a real estate project.",
      icon: <Home className="h-6 w-6" />,
      link: "/calculators/roofing-calculator",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 flex-wrap">
          <Home className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          Real Estate Calculator
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Real Estate is a broad term with many different calculations associated with it. Included is a list to help 
          choose the right calculator to fit most real estate needs. If, after perusing this list, you find that the 
          calculator you need doesn't exist, please contact us with your concerns and we will determine if it is possible 
          to build one for public use.
        </p>
      </div>

      {/* Financial Calculators Section */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <DollarSign className="h-6 w-6 text-blue-600" />
            Financial Calculators
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Mortgage, loan, and investment calculations for real estate financing
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialCalculators.map((calc, index) => (
              <Link key={index} href={calc.link}>
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      {calc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                        {calc.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {calc.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Calculators Section */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Ruler className="h-6 w-6 text-green-600" />
            Other Real Estate Calculators
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Property measurements, materials, and construction calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCalculators.map((calc, index) => (
              <Link key={index} href={calc.link}>
                <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:border-green-400 hover:shadow-md cursor-pointer transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      {calc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                        {calc.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {calc.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-xl sm:text-2xl">Understanding Real Estate Calculators</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comprehensive guide to financial and property calculation tools
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-6 pt-6">
          
          {/* Financial Calculators Details */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Financial Calculator Descriptions
            </h2>

            <div className="space-y-4">
              {/* Mortgage Calculator */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Mortgage Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A mortgage calculator helps you estimate your monthly home loan payments by calculating principal and 
                  interest based on the loan amount, interest rate, and loan term. This essential tool allows homebuyers 
                  to compare different mortgage scenarios, understand how much house they can afford, and plan their budget 
                  accordingly. The calculator typically includes factors like property taxes, homeowner's insurance, and PMI 
                  (Private Mortgage Insurance) to give you a complete picture of your monthly housing costs. By adjusting 
                  variables such as down payment amount and interest rates, you can see how different loan structures impact 
                  your total payment and overall cost of homeownership over the life of the loan.
                </p>
              </div>

              {/* House Affordability Calculator */}
              <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  House Affordability Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  The house affordability calculator determines how much home you can realistically purchase based on your 
                  income, monthly debts, down payment savings, and current interest rates. Using the standard debt-to-income 
                  (DTI) ratios that lenders require—typically 28% for housing expenses (front-end ratio) and 36% for total 
                  debt (back-end ratio)—this calculator helps you understand your maximum home price range before you start 
                  house hunting. It considers your gross monthly income, existing debt obligations like car loans and credit 
                  cards, expected property taxes, and homeowner's insurance to calculate a realistic budget that won't 
                  overextend your finances or jeopardize loan approval.
                </p>
              </div>

              {/* Mortgage Payoff Calculator */}
              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h3 className="text-lg font-semibold text-teal-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Mortgage Payoff Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A mortgage payoff calculator shows you how making extra payments—whether one-time lump sums or recurring 
                  additional monthly amounts—can dramatically reduce your loan term and save thousands in interest charges. 
                  This powerful tool illustrates the long-term financial benefits of paying down your mortgage early, showing 
                  exactly how many years you can shave off your loan and how much total interest you'll save. Many homeowners 
                  are surprised to learn that adding just $100-$200 extra per month to their principal can reduce a 30-year 
                  mortgage to 22-25 years and save $50,000+ in interest, making this calculator invaluable for financial 
                  planning and wealth building through strategic mortgage management.
                </p>
              </div>

              {/* Refinance Calculator */}
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Refinance Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  The refinance calculator helps homeowners determine if refinancing their current mortgage makes financial 
                  sense by comparing closing costs, new interest rates, and monthly payment differences. This tool calculates 
                  your break-even point—how many months it will take for your monthly savings to offset refinancing costs—
                  helping you make an informed decision about whether to refinance. Consider refinancing when interest rates 
                  drop by 0.5-1% or more, when you want to switch from an adjustable-rate to a fixed-rate mortgage for 
                  stability, or when you need to access home equity through a cash-out refinance. The calculator accounts 
                  for origination fees, appraisal costs, title insurance, and other closing expenses to give you the complete 
                  financial picture.
                </p>
              </div>

              {/* FHA Loan Calculator */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  FHA Loan Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  An FHA (Federal Housing Administration) loan calculator estimates payments for government-backed mortgages 
                  designed for first-time homebuyers and those with lower credit scores or smaller down payments. FHA loans 
                  require as little as 3.5% down payment and accept credit scores as low as 580, making homeownership more 
                  accessible to a broader range of buyers. However, FHA loans require both upfront mortgage insurance premiums 
                  (UFMIP) of 1.75% and annual mortgage insurance premiums (MIP) that continue for the life of the loan if you 
                  put down less than 10%, which this calculator factors into your monthly payment. Understanding these additional 
                  costs helps you compare FHA loans against conventional mortgages to choose the best financing option for your 
                  situation.
                </p>
              </div>

              {/* VA Mortgage Calculator */}
              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h3 className="text-lg font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  VA Mortgage Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  VA (Veterans Affairs) mortgage calculators are specialized tools for military service members, veterans, 
                  and eligible surviving spouses to estimate payments on VA-backed home loans. These loans offer exceptional 
                  benefits including zero down payment requirements, no private mortgage insurance (PMI), competitive interest 
                  rates typically 0.25-0.5% lower than conventional loans, and more lenient credit requirements. The calculator 
                  includes the VA funding fee—a one-time upfront cost ranging from 1.4% to 3.6% depending on down payment and 
                  whether it's your first VA loan—which can be rolled into the loan amount. Understanding these unique benefits 
                  and costs helps eligible borrowers maximize their VA loan entitlement and achieve affordable homeownership 
                  while honoring their service to the country.
                </p>
              </div>

              {/* Down Payment Calculator */}
              <div className="bg-rose-50 p-4 rounded-lg border-l-4 border-rose-500">
                <h3 className="text-lg font-semibold text-rose-900 mb-2 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Down Payment Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A down payment calculator helps homebuyers determine how much money they need to save before purchasing a 
                  home, calculating the percentage required based on loan type and showing how different down payment amounts 
                  affect monthly payments and PMI requirements. While the traditional 20% down payment eliminates PMI and 
                  often secures better interest rates, many loan programs accept much less—conventional loans at 3%, FHA at 
                  3.5%, and VA/USDA at 0%. This calculator shows the trade-offs between larger down payments (lower monthly 
                  costs, no PMI, more equity) and smaller down payments (faster path to homeownership, preserved cash reserves). 
                  Understanding these dynamics helps you set realistic savings goals and make strategic decisions about when 
                  to buy and how much to put down.
                </p>
              </div>

              {/* APR Calculator */}
              <div className="bg-cyan-50 p-4 rounded-lg border-l-4 border-cyan-500">
                <h3 className="text-lg font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  APR Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  An APR (Annual Percentage Rate) calculator reveals the true cost of borrowing by including not just the 
                  interest rate, but also origination fees, points, broker fees, and other closing costs rolled into one 
                  comprehensive percentage. This makes it easier to compare loan offers from different lenders since a loan 
                  with a 6% interest rate and $5,000 in fees might actually cost more than a loan with a 6.25% rate and $1,000 
                  in fees. The APR provides an apples-to-apples comparison that helps you identify the most cost-effective 
                  financing option. When shopping for mortgages, always compare APRs rather than just interest rates, as the 
                  difference can cost or save you thousands over the life of your loan, especially on large purchases like homes.
                </p>
              </div>

              {/* Rental Property Calculator */}
              <div className="bg-lime-50 p-4 rounded-lg border-l-4 border-lime-500">
                <h3 className="text-lg font-semibold text-lime-900 mb-2 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Rental Property Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A rental property calculator is an essential tool for real estate investors to analyze potential investment 
                  properties by calculating cash flow, capitalization rate (cap rate), cash-on-cash return, and return on 
                  investment (ROI). This comprehensive calculator considers purchase price, down payment, mortgage terms, 
                  monthly rental income, operating expenses (property management, maintenance, insurance, taxes, HOA fees), 
                  vacancy rates, and capital expenditures to determine if a property will generate positive cash flow and meet 
                  your investment goals. Professional investors typically look for properties with cap rates above 8-10%, 
                  cash-on-cash returns exceeding 8-12%, and the 1% rule (monthly rent should equal or exceed 1% of purchase 
                  price) to ensure profitable rental property investments that build long-term wealth through appreciation 
                  and passive income.
                </p>
              </div>

              {/* Rent Calculator */}
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Rent Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A rent calculator helps renters determine how much they can afford to spend on monthly rent based on their 
                  income and existing debt obligations, using the standard guideline that housing costs shouldn't exceed 28-30% 
                  of gross monthly income. This tool factors in your salary, other income sources, current debts, and recommended 
                  debt-to-income ratios to calculate a safe rent budget that leaves room for other expenses, savings, and 
                  unexpected costs. For example, if you earn $5,000 per month, the calculator recommends rent between $1,400-
                  $1,500 maximum to maintain financial stability and avoid becoming "house poor." Understanding your affordable 
                  rent range prevents overspending on housing, reduces financial stress, and ensures you can build emergency 
                  savings while covering utilities, groceries, transportation, and other essential living expenses comfortably.
                </p>
              </div>

              {/* Rent vs. Buy Calculator */}
              <div className="bg-violet-50 p-4 rounded-lg border-l-4 border-violet-500">
                <h3 className="text-lg font-semibold text-violet-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rent vs. Buy Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  The rent vs. buy calculator compares the total costs of renting versus owning a home over time, helping you 
                  make one of life's biggest financial decisions based on your specific situation and market conditions. This 
                  sophisticated tool considers not just mortgage payments versus rent, but also property taxes, homeowner's 
                  insurance, maintenance costs (typically 1-2% of home value annually), opportunity cost of down payment funds, 
                  home appreciation rates, tax benefits of mortgage interest deductions, and rental inflation. While homeownership 
                  builds equity and offers stability, renting provides flexibility, no maintenance responsibilities, and 
                  liquidity of capital. The calculator shows your break-even point—typically 3-7 years depending on location—
                  helping you determine if buying makes financial sense given your timeline, local market conditions, and 
                  personal circumstances.
                </p>
              </div>
            </div>
          </section>

          {/* Other Calculators Details */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-green-600" />
              Property & Construction Calculator Descriptions
            </h2>

            <div className="space-y-4">
              {/* Area Calculator */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Area Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  An area calculator computes the square footage or area of real estate properties, rooms, lots, and land 
                  parcels in various shapes including rectangles, circles, triangles, and irregular polygons. Accurate area 
                  measurements are crucial for property valuations, pricing per square foot comparisons, material estimates 
                  for flooring or landscaping, zoning compliance, and real estate listings. The calculator supports multiple 
                  measurement units (square feet, square meters, acres, hectares) and can handle complex property shapes by 
                  breaking them into smaller geometric components. Whether you're an appraiser determining property value, a 
                  contractor estimating materials, or a homeowner planning renovations, understanding precise area calculations 
                  ensures accurate budgeting, fair pricing, and compliance with building codes and local regulations.
                </p>
              </div>

              {/* Concrete Calculator */}
              <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-500">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Concrete Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A concrete calculator estimates the volume of concrete needed for construction projects like driveways, 
                  patios, foundations, sidewalks, and slabs, converting measurements into cubic yards (the standard ordering 
                  unit) and estimating the number of bags needed for smaller projects. This essential tool prevents costly 
                  material shortages mid-project or expensive over-ordering by calculating exact quantities based on length, 
                  width, and thickness (depth) of your concrete pour. The calculator typically includes a 5-10% waste factor 
                  to account for spillage, uneven ground, and over-excavation. For example, a 20' × 10' × 4" driveway requires 
                  approximately 2.5 cubic yards of concrete. Understanding these quantities helps contractors provide accurate 
                  bids, homeowners budget appropriately, and project managers schedule deliveries efficiently for smooth 
                  construction execution.
                </p>
              </div>

              {/* BTU Calculator */}
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  BTU Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A BTU (British Thermal Unit) calculator determines the heating or cooling capacity needed for a space by 
                  calculating required BTUs based on room dimensions, insulation quality, ceiling height, climate zone, window 
                  exposure, and occupancy levels. Proper HVAC sizing is critical—undersized systems run constantly without 
                  reaching desired temperatures while oversized systems short-cycle, waste energy, and fail to dehumidify 
                  properly. As a baseline, most spaces need 20-30 BTUs per square foot for cooling and 30-60 BTUs per square 
                  foot for heating, with adjustments for factors like cathedral ceilings (+25%), poor insulation (+30%), or 
                  south-facing windows (+10%). This calculator helps homeowners choose appropriately sized air conditioners, 
                  furnaces, and heat pumps, ensuring optimal comfort, energy efficiency, and equipment longevity while avoiding 
                  the costly mistake of improperly sized HVAC systems.
                </p>
              </div>

              {/* Stair Calculator */}
              <div className="bg-sky-50 p-4 rounded-lg border-l-4 border-sky-500">
                <h3 className="text-lg font-semibold text-sky-900 mb-2 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Stair Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A stair calculator determines the precise measurements for staircase construction including number of steps, 
                  rise (vertical height of each step), run (horizontal depth of each tread), and stringer length, ensuring 
                  code compliance and comfortable, safe stairs. Building codes typically require rise heights between 7-7.75 
                  inches and tread depths (run) of at least 10 inches, with consistent measurements throughout to prevent 
                  tripping hazards. The calculator uses total rise (floor-to-floor height) to calculate optimal step 
                  configurations that meet these standards. For example, an 8-foot total rise might require 14 steps with 6.86" 
                  rise each. Proper stair design affects safety, building permit approval, and user comfort—stairs that are too 
                  steep feel dangerous while shallow stairs waste space, making this calculator essential for contractors, 
                  architects, and DIY builders planning any multi-level construction.
                </p>
              </div>

              {/* Tile Calculator */}
              <div className="bg-pink-50 p-4 rounded-lg border-l-4 border-pink-500">
                <h3 className="text-lg font-semibold text-pink-900 mb-2 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Tile Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A tile calculator estimates the number of tiles needed for flooring, walls, backsplashes, or roofing projects 
                  by calculating square footage and accounting for tile size, grout spacing, and waste from cuts and breakage. 
                  Professional installers typically add 10-15% extra for waste on simple rectangular layouts and 15-20% for 
                  diagonal patterns or complex designs with many cuts around fixtures. The calculator supports various tile 
                  dimensions (12"×12", 18"×18", 4"×16" subway tiles, etc.) and can estimate grout quantities, underlayment 
                  needs, and total project costs when you input tile prices. For example, a 10'×12' bathroom floor (120 sq ft) 
                  using 12"×12" tiles needs 120 base tiles plus 18 extra for waste (138 total tiles). Accurate calculations 
                  prevent mid-project shortages from discontinued tile lots and minimize waste, saving money and project delays.
                </p>
              </div>

              {/* Square Footage Calculator */}
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Square Footage Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A square footage calculator computes the total living space of a home or building by adding up individual 
                  room areas, crucial for property valuations, real estate listings, renovation planning, and pricing decisions. 
                  Different areas are measured differently—finished living space counts fully, basements may count at 50% value, 
                  and garages typically don't count toward total square footage for appraisal purposes. The calculator handles 
                  rooms with various shapes and can compute price per square foot, helping buyers compare properties fairly. 
                  For example, a house with 1,500 sq ft listed at $300,000 costs $200 per square foot—a key metric for 
                  determining if asking prices are reasonable in your market. Accurate square footage affects property taxes, 
                  insurance premiums, resale value, and HVAC sizing, making this calculation fundamental to real estate 
                  transactions and home improvement projects.
                </p>
              </div>

              {/* Roofing Calculator */}
              <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Roofing Calculator
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  A roofing calculator estimates roof area in squares (100 sq ft units), material quantities, and project costs 
                  for new roofing or replacement projects, accounting for roof pitch (slope), overhangs, valleys, and waste 
                  factors. Roof pitch significantly affects area—a steep 12/12 pitch roof has 41% more surface area than the 
                  building footprint, while a shallow 4/12 pitch adds only 8%. The calculator estimates shingles (sold in 
                  bundles covering 33 sq ft each), underlayment, ridge caps, starter strips, and fasteners needed. It typically 
                  adds 10-15% waste for standard roofs and 15-20% for complex roofs with many dormers, valleys, or hips. For 
                  example, a 2,000 sq ft home with 6/12 pitch needs approximately 23-25 squares of shingles. Accurate estimates 
                  prevent material shortages, help obtain contractor quotes, and enable homeowners to budget for one of their 
                  home's most expensive maintenance items with confidence.
                </p>
              </div>
            </div>
          </section>

          {/* Why Use Real Estate Calculators */}
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Why Use Real Estate Calculators?</h2>
            <div className="space-y-3 text-xs sm:text-sm text-gray-700">
              <p className="leading-relaxed">
                <strong className="text-blue-900">Make Informed Financial Decisions:</strong> Real estate represents one of 
                life's largest financial commitments. These calculators provide accurate, data-driven insights that help you 
                avoid costly mistakes, whether you're buying your first home, investing in rental properties, or planning 
                major renovations. Understanding the true costs and potential returns before committing prevents buyer's 
                remorse and financial overextension.
              </p>
              <p className="leading-relaxed">
                <strong className="text-purple-900">Save Time and Money:</strong> Rather than manually computing complex 
                financial formulas or hiring professionals for preliminary estimates, these free tools provide instant 
                calculations that would otherwise require spreadsheets, financial training, or paid consultations. They help 
                you prepare for meetings with lenders, contractors, and real estate agents with confidence and accurate numbers.
              </p>
              <p className="leading-relaxed">
                <strong className="text-indigo-900">Compare Options Objectively:</strong> When faced with multiple properties, 
                loan offers, or construction bids, calculators enable side-by-side comparisons using consistent methodologies. 
                This removes emotional bias and marketing hype, allowing you to evaluate options based on cold, hard numbers 
                like total cost, ROI, break-even points, and long-term financial impact.
              </p>
              <p className="leading-relaxed">
                <strong className="text-teal-900">Plan for Long-Term Success:</strong> Real estate calculators help you see 
                beyond monthly payments to understand total costs, equity building, tax implications, and investment returns 
                over 5, 10, or 30 years. This long-term perspective is crucial for building wealth through real estate while 
                avoiding short-sighted decisions that look good today but create financial stress tomorrow.
              </p>
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};

export default RealEstateCalculatorComponent;
