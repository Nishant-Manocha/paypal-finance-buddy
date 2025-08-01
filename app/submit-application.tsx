import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface FormData {
  applicantName: string;
  applicantPhone: string;
  applicantAddress: string;
  loanAmount: string;
  loanPurpose: string;
  claimedLandSize: string;
  landLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

export default function SubmitApplicationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    applicantName: '',
    applicantPhone: '',
    applicantAddress: '',
    loanAmount: '',
    loanPurpose: 'agriculture',
    claimedLandSize: '',
    landLocation: null
  });

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for farm verification');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          name: `loan_document_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: result.assets[0].fileSize || 0
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const onMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData(prev => ({
      ...prev,
      landLocation: {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      }
    }));
  };

  const validateForm = () => {
    if (!formData.applicantName.trim()) {
      Alert.alert('Validation Error', 'Applicant name is required');
      return false;
    }
    if (!formData.applicantPhone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    if (!formData.applicantAddress.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return false;
    }
    if (!formData.loanAmount || parseFloat(formData.loanAmount) < 1000) {
      Alert.alert('Validation Error', 'Loan amount must be at least $1,000');
      return false;
    }
    if (!formData.claimedLandSize || parseFloat(formData.claimedLandSize) <= 0) {
      Alert.alert('Validation Error', 'Land size must be greater than 0');
      return false;
    }
    if (!formData.landLocation) {
      Alert.alert('Validation Error', 'Please select farm location on the map');
      return false;
    }
    if (!document) {
      Alert.alert('Validation Error', 'Please upload a loan document');
      return false;
    }
    return true;
  };

  const submitApplication = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('applicantName', formData.applicantName);
      formDataToSend.append('applicantPhone', formData.applicantPhone);
      formDataToSend.append('applicantAddress', formData.applicantAddress);
      formDataToSend.append('loanAmount', formData.loanAmount);
      formDataToSend.append('loanPurpose', formData.loanPurpose);
      formDataToSend.append('claimedLandSize', formData.claimedLandSize);
      formDataToSend.append('landLocation', JSON.stringify(formData.landLocation));
      
      // Add document
      formDataToSend.append('document', {
        uri: document.uri,
        type: document.mimeType || 'application/pdf',
        name: document.name || 'document.pdf',
      } as any);

      const response = await axios.post(
        `${API_BASE_URL}/fraud-detection/submit-application`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Application Submitted',
          `Your application has been submitted successfully. Application ID: ${response.data.applicationId}`,
          [
            {
              text: 'Check Status',
              onPress: () => router.push(`/status/${response.data.applicationId}`)
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message || 'Failed to submit application'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">
            Submit Loan Application
          </Text>
        </View>
      </View>

      <View className="px-6 py-6">
        {/* Personal Information */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Personal Information
          </Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter your full name"
                value={formData.applicantName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, applicantName: text }))}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter your phone number"
                value={formData.applicantPhone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, applicantPhone: text }))}
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Address *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter your complete address"
                value={formData.applicantAddress}
                onChangeText={(text) => setFormData(prev => ({ ...prev, applicantAddress: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Loan Information */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Loan Information
          </Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Loan Amount ($) *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter loan amount"
                value={formData.loanAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, loanAmount: text }))}
                keyboardType="numeric"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Claimed Land Size (hectares) *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter land size in hectares"
                value={formData.claimedLandSize}
                onChangeText={(text) => setFormData(prev => ({ ...prev, claimedLandSize: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Document Upload */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Upload Documents *
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-blue-100 py-3 px-4 rounded-lg"
                onPress={pickDocument}
              >
                <View className="items-center">
                  <Ionicons name="document" size={24} color="#2563eb" />
                  <Text className="text-blue-600 font-medium mt-1">
                    Pick Document
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-green-100 py-3 px-4 rounded-lg"
                onPress={takePhoto}
              >
                <View className="items-center">
                  <Ionicons name="camera" size={24} color="#059669" />
                  <Text className="text-green-600 font-medium mt-1">
                    Take Photo
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {document && (
              <View className="bg-gray-50 p-4 rounded-lg">
                <View className="flex-row items-center">
                  <Ionicons name="document-text" size={20} color="#059669" />
                  <Text className="ml-2 text-gray-700 flex-1">
                    {document.name}
                  </Text>
                  <TouchableOpacity onPress={() => setDocument(null)}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Farm Location */}
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Farm Location *
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Tap on the map to mark your farmland location
          </Text>

          <View className="h-64 rounded-lg overflow-hidden border border-gray-300">
            <MapView
              style={{ flex: 1 }}
              region={region}
              onRegionChange={setRegion}
              onPress={onMapPress}
            >
              {formData.landLocation && (
                <Marker
                  coordinate={{
                    latitude: formData.landLocation.latitude,
                    longitude: formData.landLocation.longitude,
                  }}
                  title="Farm Location"
                  description="Selected farmland area"
                />
              )}
            </MapView>
          </View>

          {formData.landLocation && (
            <View className="mt-4 bg-gray-50 p-3 rounded-lg">
              <Text className="text-sm text-gray-700">
                Selected Location: {formData.landLocation.address}
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`py-4 px-6 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
          onPress={submitApplication}
          disabled={loading}
        >
          <View className="flex-row items-center justify-center">
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="send" size={24} color="white" />
            )}
            <Text className="text-white text-lg font-semibold ml-2">
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}