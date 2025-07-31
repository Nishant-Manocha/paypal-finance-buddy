import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Card, Button, TextInput, IconButton, Chip } from 'react-native-paper';
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
    <ScrollView className="flex-1">
      <Card className="mx-4 mb-6">
        <Card.Content className="p-6">
          <Text className="text-2xl font-bold text-center mb-6 text-blue-600">
            Simple Interest Calculator
          </Text>
          
          <View className="space-y-4">
            {/* Principal Amount Input */}
            <View>
              <TextInput
                label="Principal Amount (₹)"
                value={formData.principal}
                onChangeText={(value) => handleInputChange('principal', value)}
                keyboardType="numeric"
                error={!!errors.principal}
                mode="outlined"
                left={<TextInput.Icon icon="currency-inr" />}
              />
              {errors.principal && (
                <Text className="text-red-500 text-sm mt-1">{errors.principal}</Text>
              )}
            </View>

            {/* Interest Rate Input */}
            <View>
              <TextInput
                label="Interest Rate (% per annum)"
                value={formData.rate}
                onChangeText={(value) => handleInputChange('rate', value)}
                keyboardType="numeric"
                error={!!errors.rate}
                mode="outlined"
                left={<TextInput.Icon icon="percent" />}
              />
              {errors.rate && (
                <Text className="text-red-500 text-sm mt-1">{errors.rate}</Text>
              )}
            </View>

            {/* Time Period Input */}
            <View>
              <TextInput
                label="Time Period (years)"
                value={formData.time}
                onChangeText={(value) => handleInputChange('time', value)}
                keyboardType="numeric"
                error={!!errors.time}
                mode="outlined"
                left={<TextInput.Icon icon="calendar" />}
              />
              {errors.time && (
                <Text className="text-red-500 text-sm mt-1">{errors.time}</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-between mt-6">
              <Button
                mode="outlined"
                onPress={resetForm}
                icon="refresh"
                className="flex-1 mr-2"
              >
                Reset
              </Button>
              <Button
                mode="contained"
                onPress={calculateSimpleInterest}
                disabled={!isFormValid()}
                icon="calculator"
                className="flex-1 ml-2"
              >
                Calculate
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Results */}
      {showResults && results.valid && (
        <Card className="mx-4 mb-6">
          <Card.Content className="p-6">
            <Text className="text-xl font-bold text-center mb-4 text-green-600">
              Calculation Results
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-gray-700 font-medium">Principal Amount:</Text>
                <Text className="text-lg font-bold">{formatCurrency(parseFloat(formData.principal))}</Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-gray-700 font-medium">Simple Interest:</Text>
                <Text className="text-lg font-bold text-blue-600">{formatCurrency(results.simpleInterest)}</Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-gray-700 font-medium">Total Amount:</Text>
                <Text className="text-xl font-bold text-green-600">{formatCurrency(results.totalAmount)}</Text>
              </View>
            </View>

            {/* Quick Info */}
            <View className="mt-6 p-4 bg-blue-50 rounded-lg">
              <Text className="text-sm text-blue-800 text-center">
                Formula: SI = (P × R × T) / 100
              </Text>
              <Text className="text-xs text-blue-600 text-center mt-1">
                Total Amount = Principal + Simple Interest
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Graph */}
      {showResults && results.valid && (
        <Card className="mx-4 mb-6">
          <Card.Content className="p-6">
            <Text className="text-xl font-bold text-center mb-4">
              Growth Visualization
            </Text>
            <GraphPlot
              data={generateGraphData()}
              title="Simple Interest Growth Over Time"
              xKey="year"
              yKeys={[
                { key: 'amount', label: 'Total Amount', color: '#10b981' },
                { key: 'principal', label: 'Principal', color: '#6366f1' },
                { key: 'interest', label: 'Interest', color: '#f59e0b' }
              ]}
            />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

export default SimpleInterestCalculator;