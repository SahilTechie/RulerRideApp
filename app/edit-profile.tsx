import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '@/services/auth';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get phone number from AsyncStorage
      const storedPhone = await AsyncStorage.getItem('user_phone');
      if (storedPhone) {
        // Remove +91 prefix for display in input field
        const phoneWithoutPrefix = storedPhone.replace('+91', '');
        setPhone(phoneWithoutPrefix);
      }

      // Get user name from AsyncStorage
      const storedName = await AsyncStorage.getItem('user_name');
      if (storedName && storedName !== 'RulerRide User') {
        setName(storedName);
      }

      // Try to get user data from auth service
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        if (currentUser.name && currentUser.name !== 'New User') {
          setName(currentUser.name);
        }
        if (currentUser.phone) {
          const phoneWithoutPrefix = currentUser.phone.replace('+91', '');
          setPhone(phoneWithoutPrefix);
        }
        if (currentUser.email) {
          setEmail(currentUser.email);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      // Store names in AsyncStorage
      if (name.trim()) {
        await AsyncStorage.setItem('user_name', name.trim());
      }
      
      // Update user profile with new data
      const updates: Partial<{name: string, email: string, phone: string}> = {};
      
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (phone) updates.phone = `+91${phone}`;

      if (Object.keys(updates).length > 0) {
        await AuthService.updateRiderProfile(updates);
        
        // Update phone in AsyncStorage if changed
        if (updates.phone) {
          await AsyncStorage.setItem('user_phone', updates.phone);
        }
      }

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text style={styles.headerSubtitle}>प्रोफ़ाइल संपादित करें</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={48} color="white" />
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <Ionicons name="camera" size={20} color="#DC2626" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name / पूरा नाम</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number / फ़ोन नंबर</Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address / ईमेल पता</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address / पता</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact / आपातकालीन संपर्क</Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="Emergency contact number"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]} onPress={saveProfile} disabled={loading}>
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes / परिवर्तन सहेजें'}
          </Text>
          <Ionicons name={loading ? "time" : "checkmark"} size={24} color="white" />
        </TouchableOpacity>
        </>
        )}
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  changePhotoText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginVertical: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});