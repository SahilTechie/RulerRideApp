import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: 'wallet-outline',
    title: 'Affordable Rides',
    titleHindi: 'सस्ती सवारी',
    description: 'Best prices for bikes and autos in your area',
    descriptionHindi: 'आपके क्षेत्र में बाइक और ऑटो के लिए बेहतरीन कीमतें',
    color: '#EAB308',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safe Travel',
    titleHindi: 'सुरक्षित यात्रा',
    description: 'Verified drivers and secure rides every time',
    descriptionHindi: 'सत्यापित ड्राइवर और हर बार सुरक्षित सवारी',
    color: '#16A34A',
  },
  {
    icon: 'flash-outline',
    title: 'Instant Booking',
    titleHindi: 'तुरंत बुकिंग',
    description: 'Book your ride in seconds, anywhere, anytime',
    descriptionHindi: 'सेकंडों में अपनी सवारी बुक करें, कहीं भी, कभी भी',
    color: '#DC2626',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const nextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/login');
    }
  };

  const skipOnboarding = () => {
    router.replace('/login');
  };

  return (
    <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: onboardingData[currentIndex].color }]}>
          <Ionicons 
            name={onboardingData[currentIndex].icon as any} 
            size={80} 
            color="white" 
          />
        </View>

        <Text style={styles.title}>{onboardingData[currentIndex].title}</Text>
        <Text style={styles.titleHindi}>{onboardingData[currentIndex].titleHindi}</Text>
        
        <Text style={styles.description}>{onboardingData[currentIndex].description}</Text>
        <Text style={styles.descriptionHindi}>{onboardingData[currentIndex].descriptionHindi}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    marginTop: 50,
    padding: 10,
  },
  skipText: {
    color: '#64748b',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleHindi: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  descriptionHindi: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#DC2626',
    width: 24,
  },
  nextButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});