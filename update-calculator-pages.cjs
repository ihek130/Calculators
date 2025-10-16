const fs = require('fs');
const path = require('path');

// Load calculator data
const calculatorsData = JSON.parse(fs.readFileSync('./client/src/data/calculators.json', 'utf8'));

// Helper function to convert slug to component name
function slugToComponentName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'CalculatorCalculatorComponent';
}

// Helper function to convert slug to page name
function slugToPageName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'CalculatorCalculatorPage';
}

// Helper function to convert slug to file name
function slugToFileName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'CalculatorCalculatorPage.tsx';
}

// Get related calculators with proper titles
function getRelatedCalculators(relatedSlugs) {
  if (!relatedSlugs || relatedSlugs.length === 0) return [];
  
  return relatedSlugs.slice(0, 4).map(slug => {
    const calc = calculatorsData.calculators.find(c => c.slug === slug);
    return {
      title: calc ? calc.title : slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      slug: slug
    };
  });
}

// Generate new page content
function generatePageContent(calculator) {
  const componentName = slugToComponentName(calculator.slug);
  const pageName = slugToPageName(calculator.slug);
  const relatedCalculators = getRelatedCalculators(calculator.related);
  
  return `import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ${componentName} } from '@/components/calculators';
import CalculatorLayout from '@/components/CalculatorLayout';

const ${pageName} = () => {
  const relatedCalculators = ${JSON.stringify(relatedCalculators, null, 4)};

  return (
    <>
      <Helmet>
        <title>${calculator.title} - CalcVerse</title>
        <meta name="description" content="${calculator.meta_description}" />
        <meta name="keywords" content="${calculator.seo_keywords.join(', ')}" />
        <link rel="canonical" href="https://calcverse.com/calculators/${calculator.slug}" />
      </Helmet>
      
      <CalculatorLayout 
        title="${calculator.title}"
        relatedCalculators={relatedCalculators}
      >
        <${componentName} />
      </CalculatorLayout>
    </>
  );
};

export default ${pageName};
`;
}

// Update all calculator pages
function updateAllPages() {
  const pagesDir = './client/src/pages/calculators';
  let updated = 0;
  let errors = 0;

  calculatorsData.calculators.forEach(calculator => {
    try {
      const fileName = slugToFileName(calculator.slug);
      const filePath = path.join(pagesDir, fileName);
      
      // Generate new content
      const newContent = generatePageContent(calculator);
      
      // Write to file
      fs.writeFileSync(filePath, newContent);
      updated++;
      
      if (updated % 20 === 0) {
        console.log(`Updated ${updated} pages...`);
      }
    } catch (error) {
      console.error(`Error updating ${calculator.slug}:`, error.message);
      errors++;
    }
  });

  console.log(`\\n✅ Bulk update complete!`);
  console.log(`📄 Updated: ${updated} pages`);
  console.log(`❌ Errors: ${errors} pages`);
  console.log(`\\n🎉 All calculator pages now use the CalculatorLayout component!`);
}

// Run the update
updateAllPages();