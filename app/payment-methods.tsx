import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const paymentMethods: any[] = []; // Empty array for new user

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState(paymentMethods);
  const router = useRouter();

  const setAsDefault = (id: string) => {
    setMethods(methods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
    Alert.alert('Success', 'Default payment method updated');
  };

  const removeMethod = (id: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => {
            setMethods(methods.filter(method => method.id !== id));
            Alert.alert('Success', 'Payment method removed');
          },
          style: 'destructive' 
        },
      ]
    );
  };

  const addPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This feature will be available soon');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <Text style={styles.headerSubtitle}>भुगतान के तरीके</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure Payments</Text>
            <Text style={styles.infoText}>
              All your payment information is encrypted and secure. We support UPI, cards, and digital wallets.
            </Text>
          </View>
        </View>

        {methods.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your Payment Methods / आपके भुगतान के तरीके</Text>
            <View style={styles.methodsContainer}>
              {methods.map((method) => (
                <View key={method.id} style={styles.methodCard}>
                  {/* Existing method card content */}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
            <Text style={styles.emptyStateTitleHindi}>कोई भुगतान तरीका नहीं</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add a payment method to book rides easily
            </Text>
            <Text style={styles.emptyStateSubtitleHindi}>
              आसानी से सवारी बुक करने के लिए भुगतान तरीका जोड़ें
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.addButton} onPress={addPaymentMethod}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New Payment Method</Text>
          <Text style={styles.addButtonSubtext}>नया भुगतान तरीका जोड़ें</Text>
        </TouchableOpacity>

        <View style={styles.supportedMethods}>
          <Text style={styles.supportedTitle}>Supported Payment Methods</Text>
          <View style={styles.supportedGrid}>
            <View style={styles.supportedItem}>
              <Ionicons name="phone-portrait" size={32} color="#7C3AED" />
              <Text style={styles.supportedText}>UPI</Text>
            </View>
            <View style={styles.supportedItem}>
              <Ionicons name="card" size={32} color="#059669" />
              <Text style={styles.supportedText}>Cards</Text>
            </View>
            <View style={styles.supportedItem}>
              <Ionicons name="wallet" size={32} color="#DC2626" />
              <Text style={styles.supportedText}>Wallets</Text>
            </View>
            <View style={styles.supportedItem}>
              <Ionicons name="cash" size={32} color="#EA580C" />
              <Text style={styles.supportedText}>Cash</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  methodDetails: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  methodType: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  removeButtonText: {
    color: '#DC2626',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  emptyStateTitleHindi: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
  },
  emptyStateSubtitleHindi: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 30,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  supportedMethods: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  supportedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  supportedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  supportedItem: {
    alignItems: 'center',
    gap: 8,
  },
  supportedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});