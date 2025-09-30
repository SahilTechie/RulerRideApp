import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ImageSlideshowProps {
  style?: any;
  imageStyle?: any;
  children?: React.ReactNode;
}

const images = [
  require('@/assets/images/autoimg1.png'),
  require('@/assets/images/autoimg2.png'),
  require('@/assets/images/autoimg3.png'),
  require('@/assets/images/autoimg4.png'),
  require('@/assets/images/autoimg5.png'),
];

export default function ImageSlideshow({ style, imageStyle, children }: ImageSlideshowProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  
  // Two animated values for crossfade effect
  const currentImageOpacity = useRef(new Animated.Value(1)).current;
  const nextImageOpacity = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Start crossfade animation
      Animated.parallel([
        Animated.timing(currentImageOpacity, {
          toValue: 0,
          duration: 800, // Smooth 0.8 second crossfade
          useNativeDriver: true,
        }),
        Animated.timing(nextImageOpacity, {
          toValue: 1,
          duration: 800, // Smooth 0.8 second crossfade
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Swap the images and reset opacity values
        setCurrentImageIndex(nextImageIndex);
        setNextImageIndex((nextImageIndex + 1) % images.length);
        
        // Reset opacity values for next transition
        currentImageOpacity.setValue(1);
        nextImageOpacity.setValue(0);
        
        console.log(`Slideshow: smooth transition to image ${nextImageIndex + 1}`);
      });
    }, 4000); // Change image every 4 seconds

    // Cleanup function to clear interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [nextImageIndex, currentImageOpacity, nextImageOpacity]);

  return (
    <View style={[styles.container, style]}>
      {/* Current Image */}
      <Animated.Image
        source={images[currentImageIndex]}
        style={[
          styles.image,
          imageStyle,
          {
            opacity: currentImageOpacity,
          },
        ]}
        resizeMode="stretch"
      />
      
      {/* Next Image (for crossfade) */}
      <Animated.Image
        source={images[nextImageIndex]}
        style={[
          styles.image,
          imageStyle,
          {
            opacity: nextImageOpacity,
          },
        ]}
        resizeMode="stretch"
      />
      
      {children && (
        <View style={styles.overlay}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});