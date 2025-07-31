import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, RotateCcw } from 'lucide-react';
import GraphPlot from './GraphPlot';

interface FormData {
  loanAmount: string;
  interestRate: string;
  tenure: string;
}

interface Errors {
  loanAmount?: string;
  interestRate?: string;
  tenure?: string;
}

interface Results {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  valid: boolean;
}

const LoanEmiCalculator = () => {
  const [formData, setFormData] = useState<FormData>({
    loanAmount: '',
    interestRate: '',
    tenure: ''
  });
  
  const [errors, setErrors] = useState<Errors>({});
  const [results, setResults] = useState<Results>({ 
    emi: 0, 
    totalPayment: 0, 
    totalInterest: 0, 
    valid: false 
  });
  const [showResults, setShowResults] = useState(false);

  const validateInputs = (data: FormData): Errors => {
    const newErrors: Errors = {};
    
    const loanAmount = parseFloat(data.loanAmount);
    const interestRate = parseFloat(data.interestRate);
    const tenure = parseFloat(data.tenure);

    if (!data.loanAmount || loanAmount <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0';
    } else if (loanAmount > 100000000) {
      newErrors.loanAmount = 'Loan amount too large';
    }

    if (!data.interestRate || interestRate < 0) {
      newErrors.interestRate = 'Interest rate must be 0 or greater';
    } else if (interestRate > 50) {
      newErrors.interestRate = 'Interest rate seems too high';
    }

    if (!data.tenure || tenure <= 0) {
      newErrors.tenure = 'Tenure must be greater than 0';
    } else if (tenure > 600) {
      newErrors.tenure = 'Tenure seems too long';
    }

    return newErrors;
  };

  const calculateEMI = () => {
    const newErrors = validateInputs(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const P = parseFloat(formData.loanAmount);
      const R = parseFloat(formData.interestRate);
      const N = parseFloat(formData.tenure);

      let emi = 0;
      let totalPayment = 0;
      let totalInterest = 0;

      if (R === 0) {
        // Handle zero interest case
        emi = P / N;
        totalPayment = P;
        totalInterest = 0;
      } else {
        // Standard EMI calculation
        const monthlyRate = R / (12 * 100);
        const numerator = P * monthlyRate * Math.pow(1 + monthlyRate, N);
        const denominator = Math.pow(1 + monthlyRate, N) - 1;
        emi = numerator / denominator;
        totalPayment = emi * N;
        totalInterest = totalPayment - P;
      }

      setResults({
        emi: emi,
        totalPayment: totalPayment,
        totalInterest: totalInterest,
        valid: true
      });
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const resetForm = () => {
    setFormData({ loanAmount: '', interestRate: '', tenure: '' });
    setErrors({});
    setResults({ emi: 0, totalPayment: 0, totalInterest: 0, valid: false });
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isFormValid = () => {
    return formData.loanAmount && formData.interestRate !== undefined && 
           formData.tenure && Object.keys(errors).length === 0;
  };

  // Generate data for pie chart
  const generatePieData = () => {
    if (!results.valid) return [];
    
    return [
      {
        name: 'Principal',
        value: parseFloat(formData.loanAmount),
        fill: 'hsl(var(--success))'
      },
      {
        name: 'Interest',
        value: results.totalInterest,
        fill: 'hsl(var(--primary))'
      }
    ];
  };

  return (
    <div className="space-y-6">
      <Card className="card-neumorphic p-6 animate-fade-in">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Loan EMI Calculator</h2>
            <p className="text-muted-foreground">Calculate your monthly EMI and total interest</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="loanAmount" className="text-sm font-medium">
                  Loan Amount (₹)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total amount you want to borrow</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="loanAmount"
                type="text"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                placeholder="e.g., 1000000"
                className={`input-neumorphic ${errors.loanAmount ? 'border-destructive' : ''}`}
              />
              {errors.loanAmount && (
                <p className="text-sm text-destructive animate-fade-in">{errors.loanAmount}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="interestRate" className="text-sm font-medium">
                  Interest Rate (% per year)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annual interest rate charged by the lender</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="interestRate"
                type="text"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="e.g., 8.5"
                className={`input-neumorphic ${errors.interestRate ? 'border-destructive' : ''}`}
              />
              {errors.interestRate && (
                <p className="text-sm text-destructive animate-fade-in">{errors.interestRate}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tenure" className="text-sm font-medium">
                  Tenure (months)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Loan repayment period in months</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="tenure"
                type="text"
                value={formData.tenure}
                onChange={(e) => handleInputChange('tenure', e.target.value)}
                placeholder="e.g., 240"
                className={`input-neumorphic ${errors.tenure ? 'border-destructive' : ''}`}
              />
              {errors.tenure && (
                <p className="text-sm text-destructive animate-fade-in">{errors.tenure}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={calculateEMI}
              disabled={!isFormValid()}
              className="btn-neumorphic px-8 py-2 bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              Calculate EMI
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
          <h3 className="text-xl font-bold text-center mb-6 text-primary">EMI Calculation Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(results.emi)}
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-success/10">
              <p className="text-sm text-muted-foreground mb-1">Principal Amount</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(parseFloat(formData.loanAmount))}
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-warning/10">
              <p className="text-sm text-muted-foreground mb-1">Total Interest</p>
              <p className="text-2xl font-bold text-warning">
                {formatCurrency(results.totalInterest)}
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Total Payment</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(results.totalPayment)}
              </p>
            </div>
          </div>

          <GraphPlot
            data={generatePieData()}
            type="pie"
            title="Principal vs Interest Breakdown"
            className="animate-slide-up"
          />
        </Card>
      )}
    </div>
  );
};

export default LoanEmiCalculator;