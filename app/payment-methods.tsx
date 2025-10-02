import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PaymentOption {
  id: string;
  name: string;
  icon: string;
  color?: string;
  subtitle?: string;
  offer?: string;
  action?: string;
}

interface PaymentCategory {
  category: string;
  icon?: string;
  subtitle?: string;
  options: PaymentOption[];
}

const paymentOptions: PaymentCategory[] = [
  {
    category: 'UPI Apps',
    icon: 'phone-portrait',
    subtitle: 'Pay by any UPI app',
    options: [
      { id: 'paytm', name: 'Paytm', icon: 'wallet', color: '#00BAF2', offer: '₹10 - ₹100 Assured Cashback using Paytm UPI | Min. order value of ₹49 | 1st Aug\'25 - 31st Oct\'25' },
      { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait', color: '#5f259f' },
      { id: 'amazon', name: 'Amazon', icon: 'storefront', color: '#FF9900' },
      { id: 'groww', name: 'Groww', icon: 'trending-up', color: '#00D09C' },
    ]
  },
  {
    category: 'Pay Later',
    options: [
      { id: 'pay-at-drop', name: 'Pay at drop', icon: 'location', subtitle: 'Go cashless, after ride pay by scanning QR code' },
      { id: 'simpl', name: 'Simpl', icon: 'card', color: '#00D4AA', action: 'LINK' },
    ]
  },
  {
    category: 'Others',
    options: [
      { id: 'cash', name: 'Cash', icon: 'cash', color: '#4B5563' },
    ]
  }
];

export default function PaymentMethodsScreen() {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const router = useRouter();

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPayment(paymentId);
    Alert.alert('Payment Method Selected', `You selected ${paymentId}`);
  };

  const handleLinkPayment = (paymentId: string) => {
    Alert.alert('Link Payment Method', `Link ${paymentId} to your account?`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1F2937', '#374151']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {paymentOptions.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.categoryContainer}>
            {category.category === 'UPI Apps' && (
              <>
                <View style={styles.upiHeader}>
                  <Ionicons name="phone-portrait" size={24} color="#6B7280" />
                  <Text style={styles.upiTitle}>Pay by any UPI app</Text>
                </View>
              </>
            )}
            
            {category.category !== 'UPI Apps' && (
              <Text style={styles.categoryTitle}>{category.category}</Text>
            )}

            {category.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paymentOption,
                  selectedPayment === option.id && styles.selectedOption
                ]}
                onPress={() => handlePaymentSelect(option.id)}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: option.color || '#F3F4F6' }]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={option.color ? 'white' : '#6B7280'} 
                    />
                  </View>
                  
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{option.name}</Text>
                    {option.subtitle && (
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    )}
                    {option.offer && (
                      <View style={styles.offerContainer}>
                        <Ionicons name="pricetag" size={16} color="#DC2626" />
                        <Text style={styles.offerText}>{option.offer}</Text>
                      </View>
                    )}
                  </View>

                  {option.action && (
                    <TouchableOpacity 
                      style={styles.linkButton}
                      onPress={() => handleLinkPayment(option.name)}
                    >
                      <Text style={styles.linkButtonText}>{option.action}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.passbookButton}>
          <Text style={styles.passbookText}>Show Passbook</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginLeft: 16,
  },
  helpButton: {
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  helpText: {
    color: 'white',
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: '#111827',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  upiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  upiTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  paymentOption: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  offerText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  linkButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  linkButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  passbookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  passbookText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});