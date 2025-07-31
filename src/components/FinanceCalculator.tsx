import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Percent } from 'lucide-react';
import SimpleInterestCalculator from './SimpleInterestCalculator';
import LoanEmiCalculator from './LoanEmiCalculator';

type CalculatorType = 'simple-interest' | 'loan-emi';

const FinanceCalculator = () => {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('simple-interest');

  const toggleCalculator = (type: CalculatorType) => {
    setActiveCalculator(type);
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold text-primary mb-4">
          PayPal Finance Buddy
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Your trusted companion for financial calculations
        </p>
        
        {/* Toggle Buttons */}
        <Card className="card-neumorphic p-2 inline-flex gap-2 mb-8">
          <Button
            onClick={() => toggleCalculator('simple-interest')}
            variant={activeCalculator === 'simple-interest' ? 'default' : 'ghost'}
            className={`
              px-6 py-3 font-medium transition-all duration-300 ease-in-out
              ${activeCalculator === 'simple-interest' 
                ? 'bg-primary text-primary-foreground shadow-lg transform scale-105' 
                : 'text-muted-foreground hover:text-primary'
              }
            `}
          >
            <Percent className="h-5 w-5 mr-2" />
            Simple Interest
          </Button>
          
          <Button
            onClick={() => toggleCalculator('loan-emi')}
            variant={activeCalculator === 'loan-emi' ? 'default' : 'ghost'}
            className={`
              px-6 py-3 font-medium transition-all duration-300 ease-in-out
              ${activeCalculator === 'loan-emi' 
                ? 'bg-primary text-primary-foreground shadow-lg transform scale-105' 
                : 'text-muted-foreground hover:text-primary'
              }
            `}
          >
            <Calculator className="h-5 w-5 mr-2" />
            Loan EMI
          </Button>
        </Card>
      </div>

      {/* Calculator Content */}
      <div className="relative overflow-hidden">
        <div 
          className={`transition-transform duration-500 ease-in-out ${
            activeCalculator === 'simple-interest' ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            display: activeCalculator === 'simple-interest' ? 'block' : 'none'
          }}
        >
          <SimpleInterestCalculator />
        </div>
        
        <div 
          className={`transition-transform duration-500 ease-in-out ${
            activeCalculator === 'loan-emi' ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            display: activeCalculator === 'loan-emi' ? 'block' : 'none'
          }}
        >
          <LoanEmiCalculator />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 p-6">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Built with ❤️ using React, TypeScript & Tailwind CSS</p>
          <p className="text-xs">
            All calculations are performed locally. No data is stored or transmitted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinanceCalculator;