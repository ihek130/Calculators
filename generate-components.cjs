const fs = require('fs');
const path = require('path');

// Read the calculators data
const calculatorsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'calculators.json'), 'utf8'));

// Generate React component for each calculator
function generateCalculatorComponent(calculator) {
  // Fix component names that start with numbers
  const componentName = calculator.id.split('-').map(word => {
    // If word starts with a number, prepend with underscore
    if (/^\d/.test(word)) {
      word = '_' + word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');
  
  return `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const ${componentName}Component = () => {
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState({});

  // Calculator function
  ${calculator.calculateFunction}

  // Handle input changes
  const handleInputChange = (id, value) => {
    const newInputs = { ...inputs, [id]: value };
    setInputs(newInputs);
    
    // Calculate results in real-time
    try {
      const calculationResults = calculate(newInputs);
      setResults(calculationResults);
    } catch (error) {
      console.error('Calculation error:', error);
      setResults({ error: 'Calculation error' });
    }
  };

  // Format output value
  const formatOutput = (value, output) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') {
      switch (output.format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
        case 'decimal':
          return value.toFixed(output.precision || 2);
        case 'number':
          return value.toString();
        default:
          return value.toString();
      }
    }
    return value?.toString() || '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>${calculator.title}</CardTitle>
          <CardDescription>${calculator.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Inputs</h3>
              ${calculator.inputs.map(input => {
                if (input.type === 'select') {
                  return `
              <div>
                <Label htmlFor="${input.id}">${input.name}</Label>
                <Select onValueChange={(value) => handleInputChange('${input.id}', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ${input.name}" />
                  </SelectTrigger>
                  <SelectContent>
                    ${input.options?.map(option => `
                    <SelectItem value="${option.value}">${option.label}</SelectItem>
                    `).join('') || ''}
                  </SelectContent>
                </Select>
              </div>`;
                } else {
                  return `
              <div>
                <Label htmlFor="${input.id}">${input.name} ${input.unit ? `(${input.unit})` : ''}</Label>
                <Input
                  id="${input.id}"
                  type="${input.type}"
                  placeholder="${input.placeholder || ''}"
                  onChange={(e) => handleInputChange('${input.id}', ${input.type === 'number' ? 'parseFloat(e.target.value) || 0' : 'e.target.value'})}
                  required={${input.required || false}}
                />
              </div>`;
                }
              }).join('')}
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Results</h3>
              ${calculator.outputs.map(output => `
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-600">${output.name}</Label>
                <div className="text-2xl font-bold text-gray-900">
                  {formatOutput(results['${output.id}'], ${JSON.stringify(output)})}
                </div>
              </div>
              `).join('')}
              
              {results.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{results.error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Formula */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">Formula</h4>
            <p className="text-blue-700 font-mono">${calculator.formula}</p>
            <p className="text-blue-600 text-sm mt-2">${calculator.formula_explanation}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ${componentName}Component;
`;
}

// Generate all calculator components
function generateAllComponents() {
  const componentsDir = path.join(__dirname, 'client', 'src', 'components', 'calculators');
  
  // Create calculators directory
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }

  let generatedCount = 0;
  
  calculatorsData.calculators.forEach(calculator => {
    // Fix component names that start with numbers
    const componentName = calculator.id.split('-').map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('') + 'Component';
    
    const componentCode = generateCalculatorComponent(calculator);
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(componentsDir, fileName);
    
    fs.writeFileSync(filePath, componentCode);
    generatedCount++;
  });

  console.log(`✅ Generated ${generatedCount} calculator components in client/src/components/calculators/`);
  
  // Generate index file for exports
  const indexContent = calculatorsData.calculators.map(calc => {
    const componentName = calc.id.split('-').map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('') + 'Component';
    return `export { default as ${componentName} } from './${componentName}';`;
  }).join('\n');
  
  fs.writeFileSync(path.join(componentsDir, 'index.ts'), indexContent);
  console.log(`✅ Generated index.ts with all ${calculatorsData.calculators.length} component exports`);
}

// Generate calculator pages
function generateCalculatorPages() {
  const pagesDir = path.join(__dirname, 'client', 'src', 'pages', 'calculators');
  
  // Create pages directory
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  let generatedCount = 0;
  
  calculatorsData.calculators.forEach(calculator => {
    // Fix component names that start with numbers
    const componentName = calculator.id.split('-').map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('') + 'Component';
    
    const pageName = calculator.id.split('-').map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('') + 'Page';
    
    const pageCode = `import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ${componentName} } from '@/components/calculators';

const ${pageName} = () => {
  return (
    <>
      <Helmet>
        <title>${calculator.title} - CalcVerse</title>
        <meta name="description" content="${calculator.meta_description}" />
        <meta name="keywords" content="${calculator.seo_keywords.join(', ')}" />
        <link rel="canonical" href="https://calcverse.com/calculators/${calculator.slug}" />
      </Helmet>
      
      <${componentName} />
    </>
  );
};

export default ${pageName};
`;
    
    const fileName = `${pageName}.tsx`;
    const filePath = path.join(pagesDir, fileName);
    
    fs.writeFileSync(filePath, pageCode);
    generatedCount++;
  });

  console.log(`✅ Generated ${generatedCount} calculator pages in client/src/pages/calculators/`);
}

// Main execution
function main() {
  console.log('🚀 Generating React components and pages for all calculators...');
  
  generateAllComponents();
  generateCalculatorPages();
  
  console.log('🎉 All calculator components and pages generated successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update App.tsx with routes for all calculators');
  console.log('2. Update HomePage to show all calculator categories');
  console.log('3. Create category pages');
  console.log('4. Test the calculators');
}

main();