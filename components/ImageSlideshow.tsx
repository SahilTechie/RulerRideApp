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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Start fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // 0.5 second fade out
        useNativeDriver: true,
      }).start(() => {
        // Change image after fade out completes
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % images.length;
          console.log(`Slideshow: transitioning from image ${prevIndex + 1} to image ${nextIndex + 1}`);
          return nextIndex;
        });
        
        // Start fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500, // 0.5 second fade in
          useNativeDriver: true,
        }).start();
      });
    }, 5000); // Change image every 5 seconds

    // Cleanup function to clear interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fadeAnim]);

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={images[currentImageIndex]}
        style={[
          styles.image,
          imageStyle,
          {
            opacity: fadeAnim,
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