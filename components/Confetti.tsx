import { useRef, useEffect, forwardRef } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

const Confetti = forwardRef<LottieView>(function ConfettiInner(props, ref) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/confetti.json')}
        autoPlay={false}
        loop={false}
        style={styles.container}
        resizeMode='cover'
        speed={2}
        ref={ref}
      />
    </View>
  );
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
});

export default Confetti