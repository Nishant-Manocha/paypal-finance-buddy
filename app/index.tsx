import React from 'react';
import { View } from 'react-native';
import FinanceCalculator from '../src/components/FinanceCalculator';

export default function Index() {
  return (
    <View className="flex-1 bg-white">
      <FinanceCalculator />
    </View>
  );
}