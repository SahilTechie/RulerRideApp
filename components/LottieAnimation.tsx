import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
  source: any;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}

export default function LottieAnimation({
  source,
  size = 100,
  autoPlay = true,
  loop = true,
  style,
}: LottieAnimationProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
