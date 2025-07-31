import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, RotateCcw } from 'lucide-react';
import GraphPlot from './GraphPlot';

interface FormData {
  principal: string;
  rate: string;
  time: string;
}

interface Errors {
  principal?: string;
  rate?: string;
  time?: string;
}

interface Results {
  simpleInterest: number;
  totalAmount: number;
  valid: boolean;
}

const SimpleInterestCalculator = () => {
  const [formData, setFormData] = useState<FormData>({
    principal: '',
    rate: '',
    time: ''
  });
  
  const [errors, setErrors] = useState<Errors>({});
  const [results, setResults] = useState<Results>({ simpleInterest: 0, totalAmount: 0, valid: false });
  const [showResults, setShowResults] = useState(false);

  const validateInputs = (data: FormData): Errors => {
    const newErrors: Errors = {};
    
    const principal = parseFloat(data.principal);
    const rate = parseFloat(data.rate);
    const time = parseFloat(data.time);

    if (!data.principal || principal <= 0) {
      newErrors.principal = 'Principal amount must be greater than 0';
    } else if (principal > 10000000) {
      newErrors.principal = 'Principal amount too large';
    }

    if (!data.rate || rate <= 0) {
      newErrors.rate = 'Interest rate must be greater than 0';
    } else if (rate > 100) {
      newErrors.rate = 'Interest rate seems too high';
    }

    if (!data.time || time <= 0) {
      newErrors.time = 'Time must be greater than 0';
    } else if (time > 100) {
      newErrors.time = 'Time period seems too long';
    }

    return newErrors;
  };

  const calculateSimpleInterest = () => {
    const newErrors = validateInputs(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const P = parseFloat(formData.principal);
      const R = parseFloat(formData.rate);
      const T = parseFloat(formData.time);

      const SI = (P * R * T) / 100;
      const totalAmount = P + SI;

      setResults({
        simpleInterest: SI,
        totalAmount: totalAmount,
        valid: true
      });
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const resetForm = () => {
    setFormData({ principal: '', rate: '', time: '' });
    setErrors({});
    setResults({ simpleInterest: 0, totalAmount: 0, valid: false });
    setShowResults(false);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear specific error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const isFormValid = () => {
    return formData.principal && formData.rate && formData.time && 
           Object.keys(errors).length === 0;
  };

  // Generate data for graph
  const generateGraphData = () => {
    if (!results.valid) return [];
    
    const P = parseFloat(formData.principal);
    const R = parseFloat(formData.rate);
    const T = parseFloat(formData.time);
    
    const data = [];
    for (let year = 0; year <= T; year++) {
      const interest = (P * R * year) / 100;
      const total = P + interest;
      data.push({
        year,
        amount: total,
        principal: P,
        interest: interest
      });
    }
    return data;
  };

  return (
    <div className="space-y-8">
      <div className="calculator-card animate-fade-in">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-3">Simple Interest Calculator</h2>
            <p className="text-lg text-muted-foreground">Calculate simple interest and total amount</p>
          </div>

          <div className="input-group">
            <div className="input-container">
              <div className="input-label">
                <Label htmlFor="principal">Principal Amount (₹)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="info-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The initial amount of money</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="principal"
                type="text"
                value={formData.principal}
                onChange={(e) => handleInputChange('principal', e.target.value)}
                placeholder="e.g., 100000"
                className={`input-field ${errors.principal ? 'border-destructive ring-destructive/20' : ''}`}
              />
              {errors.principal && (
                <p className="text-sm text-destructive animate-fade-in">{errors.principal}</p>
              )}
            </div>

            <div className="input-container">
              <div className="input-label">
                <Label htmlFor="rate">Interest Rate (% per year)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="info-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annual interest rate percentage</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="rate"
                type="text"
                value={formData.rate}
                onChange={(e) => handleInputChange('rate', e.target.value)}
                placeholder="e.g., 8.5"
                className={`input-field ${errors.rate ? 'border-destructive ring-destructive/20' : ''}`}
              />
              {errors.rate && (
                <p className="text-sm text-destructive animate-fade-in">{errors.rate}</p>
              )}
            </div>

            <div className="input-container">
              <div className="input-label">
                <Label htmlFor="time">Time Period (years)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="info-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duration of investment in years</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="time"
                type="text"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="e.g., 5"
                className={`input-field ${errors.time ? 'border-destructive ring-destructive/20' : ''}`}
              />
              {errors.time && (
                <p className="text-sm text-destructive animate-fade-in">{errors.time}</p>
              )}
            </div>
          </div>

          <div className="button-container">
            <Button
              onClick={calculateSimpleInterest}
              disabled={!isFormValid()}
              className="btn-primary"
            >
              Calculate Interest
            </Button>
            <Button
              onClick={resetForm}
              className="btn-secondary"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {showResults && results.valid && (
        <div className="calculator-card animate-bounce-in">
          <h3 className="text-2xl font-bold text-center mb-8 text-primary">Calculation Results</h3>
          
          <div className="results-grid">
            <div className="result-card">
              <p className="text-sm text-muted-foreground mb-2">Simple Interest</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(results.simpleInterest)}
              </p>
            </div>
            
            <div className="result-card">
              <p className="text-sm text-muted-foreground mb-2">Principal Amount</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(parseFloat(formData.principal))}
              </p>
            </div>
            
            <div className="result-card">
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(results.totalAmount)}
              </p>
            </div>

            <div className="result-card">
              <p className="text-sm text-muted-foreground mb-2">Growth</p>
              <p className="text-xl font-bold text-warning">
                {((results.totalAmount - parseFloat(formData.principal)) / parseFloat(formData.principal) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <GraphPlot
            data={generateGraphData()}
            type="line"
            title="Simple Interest Growth Over Time"
            xAxisKey="year"
            yAxisKey="amount"
            className="animate-slide-up"
          />
        </div>
      )}
    </div>
  );
};

export default SimpleInterestCalculator;