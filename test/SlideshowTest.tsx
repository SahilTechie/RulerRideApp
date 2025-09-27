// Test script to verify the slideshow implementation
// This tests the basic functionality of the ImageSlideshow component

import React from 'react';
import { View, Text } from 'react-native';
import ImageSlideshow from '../components/ImageSlideshow';

export default function SlideshowTest() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Slideshow Test</Text>
      
      <ImageSlideshow style={{ height: 200, borderRadius: 10 }}>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
            Good Evening!
          </Text>
          <Text style={{ color: 'white', fontSize: 16 }}>
            शुभ संध्या!
          </Text>
        </View>
      </ImageSlideshow>
      
      <Text style={{ marginTop: 20, textAlign: 'center' }}>
        The slideshow should cycle through autoimg1-5 every 5 seconds
        with fade-in/fade-out transitions.
      </Text>
    </View>
  );
}