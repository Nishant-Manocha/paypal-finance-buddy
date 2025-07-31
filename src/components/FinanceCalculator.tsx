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
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl font-bold text-primary mb-4">
          PayPal Finance Buddy
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your trusted companion for financial calculations
        </p>
        
        {/* Toggle Buttons */}
        <div className="inline-flex p-1 bg-card rounded-xl border border-border shadow-lg">
          <Button
            onClick={() => toggleCalculator('simple-interest')}
            className={`tab-button ${
              activeCalculator === 'simple-interest' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Percent className="h-5 w-5" />
            Simple Interest
          </Button>
          
          <Button
            onClick={() => toggleCalculator('loan-emi')}
            className={`tab-button ${
              activeCalculator === 'loan-emi' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Calculator className="h-5 w-5" />
            Loan EMI
          </Button>
        </div>
      </div>

      {/* Calculator Content */}
      <div className="animate-scale-in">
        {activeCalculator === 'simple-interest' && <SimpleInterestCalculator />}
        {activeCalculator === 'loan-emi' && <LoanEmiCalculator />}
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