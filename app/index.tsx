import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;
const isMediumScreen = screenHeight >= 700 && screenHeight < 900;

export default function SplashScreen() {
  const router = useRouter();
  const [showButton, setShowButton] = useState(true); // Show button immediately

  const handleGetStarted = () => {
    router.push('/onboarding');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/introimg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.logoContainer}>
            <Text style={styles.brandText}>RulerRide</Text>
            <Text style={styles.tagline}>Your Trusted Ride Partner</Text>
          </View>
          
          <View style={styles.bottomSection}>
            <Text style={styles.footerText}>Connecting Communities</Text>
            
            {showButton && (
              <View style={styles.buttonGlassContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.4)']}
                  style={styles.glassGradient}
                >
                  <TouchableOpacity 
                    style={styles.getStartedButton}
                    onPress={handleGetStarted}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.getStartedText}>Get Started</Text>
                    <Text style={styles.getStartedHindi}>शुरू करें</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 40 : 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallScreen ? -60 : isMediumScreen ? -70 : -80, // Responsive upward movement
  },
  logoCircle: {
    width: isSmallScreen ? 80 : 96, // Further responsive sizing
    height: isSmallScreen ? 80 : 96,
    borderRadius: isSmallScreen ? 40 : 48,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  logoImageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isSmallScreen ? 40 : 48,
  },
  logoImageStyle: {
    borderRadius: isSmallScreen ? 40 : 48,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Light overlay for text visibility
    borderRadius: isSmallScreen ? 40 : 48,
  },
  logoGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: isSmallScreen ? 40 : 48,
    opacity: 0.4,
  },
  logoPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: isSmallScreen ? 40 : 48,
  },
  patternDot: {
    position: 'absolute',
    width: isSmallScreen ? 3 : 4,
    height: isSmallScreen ? 3 : 4,
    borderRadius: isSmallScreen ? 1.5 : 2,
    backgroundColor: '#3B82F6',
    opacity: 0.25,
  },
  patternLine: {
    position: 'absolute',
    width: isSmallScreen ? 10 : 12,
    height: 1,
    backgroundColor: '#3B82F6',
    opacity: 0.15,
  },
  patternCurve: {
    position: 'absolute',
    width: isSmallScreen ? 8 : 10,
    height: isSmallScreen ? 8 : 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: isSmallScreen ? 4 : 5,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    opacity: 0.2,
  },
  logoText: {
    fontSize: isSmallScreen ? 30 : 38, // Responsive font size
    fontWeight: 'bold',
    color: '#DC2626',
    zIndex: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  brandText: {
    fontSize: isSmallScreen ? 26 : isMediumScreen ? 30 : 32,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: isSmallScreen ? 6 : 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: isSmallScreen ? 14 : 16,
    color: 'black',
    opacity: 0.9,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  footerText: {
    color: 'white',
    fontSize: isSmallScreen ? 14 : 16,
    opacity: 0.8,
    marginBottom: isSmallScreen ? 20 : 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  getStartedButton: {
    backgroundColor: 'transparent', // Remove background since gradient handles it
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    // Glass effect border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGlassContainer: {
    // Main shadow layer for depth and glow
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    borderRadius: 30,
    marginHorizontal: 40,
    marginBottom: 10,
  },
  glassGradient: {
    borderRadius: 30,
    // Additional shadow for depth
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  getStartedText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#DC2626',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  getStartedHindi: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#DC2626',
    opacity: 0.9,
    marginTop: 2,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});