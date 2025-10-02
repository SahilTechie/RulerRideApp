import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NameEntryPopupProps {
  visible: boolean;
  onComplete: (name: string) => void;
  onSkip?: () => void;
}

export default function NameEntryPopup({ visible, onComplete, onSkip }: NameEntryPopupProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue');
      return;
    }

    setLoading(true);
    try {
      // Store user name in AsyncStorage
      await AsyncStorage.setItem('user_name', name.trim());
      
      // Mark that user has completed name setup
      await AsyncStorage.setItem('name_setup_completed', 'true');
      
      onComplete(name.trim());
    } catch (error) {
      console.error('Error saving user name:', error);
      Alert.alert('Error', 'Failed to save name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark as completed but with default name
      await AsyncStorage.setItem('name_setup_completed', 'true');
      await AsyncStorage.setItem('user_name', 'RulerRide User');
      
      if (onSkip) {
        onSkip();
      } else {
        onComplete('RulerRide User');
      }
    } catch (error) {
      console.error('Error during skip:', error);
      onComplete('RulerRide User');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent back button closing
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
            <Ionicons name="person-add" size={32} color="white" />
            <Text style={styles.headerTitle}>Welcome to RulerRide!</Text>
            <Text style={styles.headerSubtitle}>Let's get to know you</Text>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.description}>
              Please enter your name so we can personalize your ride experience.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name / आपका नाम *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoFocus={true}
                editable={!loading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]} 
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Continue / जारी रखें'}
                </Text>
                <Ionicons name={loading ? "time" : "arrow-forward"} size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Skip for now / अभी छोड़ें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#374151',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
