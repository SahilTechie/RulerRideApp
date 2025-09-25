import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapPlaceholderProps {
  onEnableBilling?: () => void;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ onEnableBilling }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="card-outline" size={48} color="#DC2626" />
        <Text style={styles.title}>Google Maps Billing Required</Text>
        <Text style={styles.message}>
          Google Maps requires billing to be enabled to display maps, even for free usage.
        </Text>
        
        <View style={styles.steps}>
          <Text style={styles.stepTitle}>Quick Setup:</Text>
          <Text style={styles.step}>1. Go to Google Cloud Console</Text>
          <Text style={styles.step}>2. Navigate to Billing</Text>
          <Text style={styles.step}>3. Link a payment method</Text>
          <Text style={styles.step}>4. Refresh this page</Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => Linking.openURL('https://console.cloud.google.com/billing')}
        >
          <Text style={styles.buttonText}>Open Google Cloud Console</Text>
          <Ionicons name="open-outline" size={16} color="white" />
        </TouchableOpacity>

        <Text style={styles.note}>
          💰 Don't worry: Google provides $200 free credits monthly
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  steps: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  step: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#16A34A',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MapPlaceholder;