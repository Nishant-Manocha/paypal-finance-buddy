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
    <div className="space-y-6">
      <Card className="card-neumorphic p-6 animate-fade-in">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Simple Interest Calculator</h2>
            <p className="text-muted-foreground">Calculate simple interest and total amount</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="principal" className="text-sm font-medium">
                  Principal Amount (₹)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
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
                className={`input-neumorphic ${errors.principal ? 'border-destructive' : ''}`}
              />
              {errors.principal && (
                <p className="text-sm text-destructive animate-fade-in">{errors.principal}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="rate" className="text-sm font-medium">
                  Interest Rate (% per year)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
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
                className={`input-neumorphic ${errors.rate ? 'border-destructive' : ''}`}
              />
              {errors.rate && (
                <p className="text-sm text-destructive animate-fade-in">{errors.rate}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="time" className="text-sm font-medium">
                  Time Period (years)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
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
                className={`input-neumorphic ${errors.time ? 'border-destructive' : ''}`}
              />
              {errors.time && (
                <p className="text-sm text-destructive animate-fade-in">{errors.time}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={calculateSimpleInterest}
              disabled={!isFormValid()}
              className="btn-neumorphic px-8 py-2 bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              Calculate
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="btn-neumorphic px-8 py-2"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {showResults && results.valid && (
        <Card className="card-neumorphic p-6 animate-bounce-in">
          <h3 className="text-xl font-bold text-center mb-6 text-primary">Calculation Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 rounded-lg bg-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Simple Interest</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(results.simpleInterest)}
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-success/10">
              <p className="text-sm text-muted-foreground mb-1">Principal Amount</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(parseFloat(formData.principal))}
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(results.totalAmount)}
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
        </Card>
      )}
    </div>
  );
};

export default SimpleInterestCalculator;