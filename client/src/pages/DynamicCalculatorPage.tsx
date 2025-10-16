import React from 'react';
import { useParams } from 'wouter';
import { Helmet } from 'react-helmet-async';
import CalculatorLayout from '@/components/CalculatorLayout';
import NotFound from '@/pages/not-found';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import calculators data
import calculatorsData from '@/data/calculators.json';

// Import all calculator components using the barrel export
import * as CalculatorComponents from '@/components/calculators';

const DynamicCalculatorPage = () => {
  const { slug } = useParams();

  // Handle missing slug
  if (!slug) {
    return <NotFound />;
  }

  // Find calculator data by slug
  const calculator = calculatorsData.calculators.find(calc => calc.slug === slug);

  if (!calculator) {
    return <NotFound />;
  }

  // Generate component name from slug (matching new naming convention)
  const componentName = slug
    .split('-')
    .map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('')
    .replace('Calculator', '') + 'CalculatorComponent';

  console.log(`Slug: ${slug}, Generated component name: ${componentName}`);

  // Get the component from the barrel export
  const CalculatorComponent = CalculatorComponents[componentName as keyof typeof CalculatorComponents];

  if (!CalculatorComponent) {
    console.error(`Component not found: ${componentName}`);
    return <NotFound />;
  }

  // Get related calculators
  const relatedCalculators = calculatorsData.calculators
    .filter(calc => 
      calculator.related && 
      calculator.related.includes(calc.id) ||
      (calc.category === calculator.category && calc.id !== calculator.id)
    )
    .slice(0, 4)
    .map(calc => ({
      title: calc.title,
      slug: calc.slug
    }));

  return (
    <>
      <Header />
      <Helmet>
        <title>{calculator.title} - CalcVerse</title>
        <meta name="description" content={calculator.meta_description || calculator.description} />
        <meta name="keywords" content={calculator.seo_keywords?.join(', ') || ''} />
        <link rel="canonical" href={`https://calcverse.com/calculators/${calculator.slug}`} />
      </Helmet>
      
      <CalculatorLayout 
        title={calculator.title}
        description={calculator.description}
        relatedCalculators={relatedCalculators}
      >
        <CalculatorComponent />
      </CalculatorLayout>
      <Footer />
    </>
  );
};

export default DynamicCalculatorPage;