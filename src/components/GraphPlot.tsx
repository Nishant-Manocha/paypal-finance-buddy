import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';

interface GraphPlotProps {
  data: any[];
  title: string;
  xKey: string;
  yKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
}

const GraphPlot: React.FC<GraphPlotProps> = ({ data, title, xKey, yKeys }) => {
  const screenWidth = Dimensions.get('window').width;
  const graphWidth = screenWidth - 80;
  const graphHeight = 200;

  if (!data || data.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-center text-gray-500">No data to display</Text>
      </View>
    );
  }

  // Simple visualization - we'll show data points in a table format
  // In a real implementation, you'd use a charting library like react-native-chart-kit
  const maxValue = Math.max(...data.map(item => 
    Math.max(...yKeys.map(yKey => item[yKey.key] || 0))
  ));

  return (
    <View className="w-full">
      <Text className="text-lg font-bold text-center mb-4">{title}</Text>
      
      {/* Legend */}
      <View className="flex-row justify-center mb-4 flex-wrap">
        {yKeys.map((yKey, index) => (
          <View key={index} className="flex-row items-center mx-2 mb-2">
            <View 
              className="w-4 h-4 rounded mr-2"
              style={{ backgroundColor: yKey.color }}
            />
            <Text className="text-sm">{yKey.label}</Text>
          </View>
        ))}
      </View>

      {/* Simple table representation */}
      <Card className="p-4">
        <View className="border-b border-gray-200 pb-2 mb-2">
          <View className="flex-row">
            <Text className="flex-1 font-bold text-center">{xKey}</Text>
            {yKeys.map((yKey, index) => (
              <Text key={index} className="flex-1 font-bold text-center text-xs">
                {yKey.label}
              </Text>
            ))}
          </View>
        </View>
        
        {data.slice(0, 6).map((item, index) => (
          <View key={index} className="flex-row py-1 border-b border-gray-100">
            <Text className="flex-1 text-center">{item[xKey]}</Text>
            {yKeys.map((yKey, yIndex) => (
              <Text key={yIndex} className="flex-1 text-center text-xs">
                {typeof item[yKey.key] === 'number' 
                  ? item[yKey.key].toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    })
                  : item[yKey.key]
                }
              </Text>
            ))}
          </View>
        ))}
      </Card>

      <Text className="text-xs text-gray-500 text-center mt-2">
        * For the full chart visualization, consider using react-native-chart-kit
      </Text>
    </View>
  );
};

export default GraphPlot;