import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ImageBackground, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// Create Animated LinearGradient
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '@/services/auth';
import { apiService } from '@/services/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const router = useRouter();

  // Animation for gradient movement
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendHealth();
    
    // Start gradient animation
    const startAnimation = () => {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        { resetBeforeIteration: true }
      ).start();
    };
    
    startAnimation();
  }, []);

  const checkBackendHealth = async () => {
    try {
      console.log('🔍 Checking backend health...');
      const isHealthy = await apiService.healthCheck();
      setBackendStatus(isHealthy ? 'online' : 'offline');
      console.log('🏥 Backend health status:', isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      setBackendStatus('offline');
    }
  };

  const sendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (backendStatus === 'offline') {
      Alert.alert('Server Offline', 'Unable to connect to server. Please check your internet connection and try again.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      console.log('📱 Sending OTP to:', fullPhone);
      
      const result = await AuthService.sendOTP(fullPhone);
      console.log('✅ OTP Send Result:', result);
      
      if (result && result.success !== false) {
        setOtpExpiresIn(result.expiresIn || 600);
        setShowOTP(true);
        Alert.alert('OTP Sent', result.message || `Verification code sent to ${fullPhone}`);
      } else {
        throw new Error(result?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
      
      // If error, check backend health again
      checkBackendHealth();
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verifying OTP:', otpCode);
      
      // For the new auth service, verificationId is not needed
      const authResult = await AuthService.verifyOTP('', otpCode);
      console.log('✅ OTP Verification Result:', authResult);
      
      // Navigate directly without Alert to avoid navigation issues
      console.log('🚀 Navigating to dashboard...');
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('❌ Verify OTP error:', error);
      Alert.alert('Invalid OTP', error.message || 'Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      console.log('🔄 Resending OTP to:', fullPhone);
      
      const result = await AuthService.resendOTP(fullPhone);
      console.log('✅ OTP Resend Result:', result);
      
      setOtpExpiresIn(result.expiresIn);
      setOtp(['', '', '', '']); // Clear current OTP
      Alert.alert('OTP Resent', result.message || 'New verification code sent');
    } catch (error: any) {
      console.error('❌ Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateOTP = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  // Animated gradient positions
  const animatedStartX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const animatedStartY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const animatedEndX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const animatedEndY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AnimatedLinearGradient 
        colors={['#9CA3AF', '#D1D5DB', '#F3F4F6', '#E5E7EB']} 
        start={{ x: animatedStartX, y: animatedStartY }}
        end={{ x: animatedEndX, y: animatedEndY }}
        style={styles.gradient}
      >
        <View style={styles.gradientOverlay}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <ImageBackground
                  source={require('@/assets/images/RRimg.png')}
                  style={styles.logoImageBackground}
                  resizeMode="cover"
                  imageStyle={styles.logoImageStyle}
                >
                  {/* Optional overlay for better visibility if needed */}
                  <View style={styles.logoOverlay} />
                </ImageBackground>
              </View>
              <Text style={styles.brandText}>RulerRide</Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* Backend Status Indicator */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { 
                backgroundColor: backendStatus === 'online' ? '#16A34A' : 
                                backendStatus === 'offline' ? '#DC2626' : '#F59E0B' 
              }]} />
              <Text style={[styles.statusText, {
                color: backendStatus === 'online' ? '#16A34A' : 
                       backendStatus === 'offline' ? '#DC2626' : '#F59E0B'
              }]}>
                {backendStatus === 'online' ? 'Server Online' : 
                 backendStatus === 'offline' ? 'Server Offline' : 'Connecting...'}
              </Text>
            </View>

            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login to continue your journey</Text>
            <Text style={styles.subtitleHindi}>अपनी यात्रा जारी रखने के लिए लॉगिन करें</Text>

            {!showOTP ? (
              <View style={styles.phoneContainer}>
                <Text style={styles.label}>Phone Number / फ़ोन नंबर</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.sendOTPButton, { opacity: loading ? 0.7 : 1 }]} 
                  onPress={sendOTP}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Sending...' : 'Send OTP / OTP भेजें'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.otpContainer}>
                <Text style={styles.label}>Enter OTP / OTP दर्ज करें</Text>
                <Text style={styles.otpText}>Sent to +91 {phone}</Text>
                
                <View style={styles.otpInputContainer}>
                  {otp.slice(0, 4).map((digit, index) => (
                    <TextInput
                      key={index}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(value) => updateOTP(value, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                    />
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.verifyButton, { opacity: loading ? 0.7 : 1 }]} 
                  onPress={verifyOTP}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <TouchableOpacity onPress={resendOTP} disabled={loading}>
                    <Text style={[styles.resendText, { opacity: loading ? 0.5 : 1 }]}>
                      Didn't receive OTP? Resend
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setShowOTP(false)}>
                  <Text style={styles.backText}>← Back to phone number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        </View>
      </AnimatedLinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very subtle white overlay for better readability
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  logoImageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImageStyle: {
    borderRadius: 35,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 35,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  brandText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleHindi: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  phoneContainer: {
    gap: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    height: 50,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  sendOTPButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 16,
  },
  otpContainer: {
    gap: 16,
  },
  otpText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginTop: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});