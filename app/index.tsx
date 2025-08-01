import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-8 px-6">
        <Text className="text-white text-3xl font-bold mb-2">
          🛰️ Rural Loan
        </Text>
        <Text className="text-white text-3xl font-bold mb-4">
          Fraud Detector
        </Text>
        <Text className="text-blue-100 text-lg">
          AI-powered satellite verification for agricultural loans
        </Text>
      </View>

      {/* Main Content */}
      <View className="px-6 py-8">
        {/* How it Works */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-800 mb-6">
            How It Works
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full p-3 mr-4">
                <Text className="text-blue-600 font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">
                  Upload Documents
                </Text>
                <Text className="text-gray-600">
                  Submit your loan application documents with claimed land size
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full p-3 mr-4">
                <Text className="text-blue-600 font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">
                  Select Location
                </Text>
                <Text className="text-gray-600">
                  Mark your farmland location on the map for satellite analysis
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full p-3 mr-4">
                <Text className="text-blue-600 font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">
                  AI Analysis
                </Text>
                <Text className="text-gray-600">
                  Our AI compares satellite data with your claimed land size
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full p-3 mr-4">
                <Text className="text-blue-600 font-bold">4</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">
                  Get Results
                </Text>
                <Text className="text-gray-600">
                  Receive fraud risk assessment and verification status
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity
            className="bg-blue-600 py-4 px-6 rounded-lg"
            onPress={() => router.push('/submit-application')}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="document-text" size={24} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                Submit New Application
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-600 py-4 px-6 rounded-lg"
            onPress={() => router.push('/check-status')}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="search" size={24} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                Check Application Status
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-orange-600 py-4 px-6 rounded-lg"
            onPress={() => router.push('/dashboard')}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="stats-chart" size={24} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                View Dashboard
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="mt-8">
          <Text className="text-2xl font-bold text-gray-800 mb-6">
            Key Features
          </Text>
          
          <View className="bg-white rounded-lg p-6 shadow-sm">
            <View className="space-y-4">
              <View className="flex-row items-center">
                <Ionicons name="satellite" size={20} color="#059669" />
                <Text className="ml-3 text-gray-700">
                  Free satellite imagery analysis
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="document-text" size={20} color="#059669" />
                <Text className="ml-3 text-gray-700">
                  OCR document processing
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text className="ml-3 text-gray-700">
                  AI-powered fraud detection
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="speedometer" size={20} color="#059669" />
                <Text className="ml-3 text-gray-700">
                  Fast 2-5 minute processing
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={20} color="#059669" />
                <Text className="ml-3 text-gray-700">
                  Detailed fraud risk reports
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}