import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Button, Card, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleInterestCalculator from './SimpleInterestCalculator';
import LoanEmiCalculator from './LoanEmiCalculator';

type CalculatorType = 'simple-interest' | 'loan-emi';

const FinanceCalculator = () => {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('simple-interest');

  const buttons = [
    {
      value: 'simple-interest',
      label: 'Simple Interest',
      icon: 'percent',
    },
    {
      value: 'loan-emi',
      label: 'Loan EMI',
      icon: 'calculator',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-blue-600 mb-4 text-center">
            PayPal Finance Buddy
          </Text>
          <Text className="text-lg text-gray-600 mb-8 text-center">
            Your trusted companion for financial calculations
          </Text>
          
          {/* Toggle Buttons */}
          <Card className="mb-8 p-4">
            <SegmentedButtons
              value={activeCalculator}
              onValueChange={(value) => setActiveCalculator(value as CalculatorType)}
              buttons={buttons}
            />
          </Card>
        </View>

        {/* Calculator Content */}
        <View className="mb-8">
          {activeCalculator === 'simple-interest' && <SimpleInterestCalculator />}
          {activeCalculator === 'loan-emi' && <LoanEmiCalculator />}
        </View>

        {/* Footer */}
        <View className="items-center mt-12 p-6">
          <Text className="text-sm text-gray-600 text-center mb-2">
            Built with ❤️ using React Native, TypeScript & NativeWind
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            All calculations are performed locally. No data is stored or transmitted.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinanceCalculator;