import { Pressable, PressableProps, ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScaledPressable(props: PressableProps & ViewProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      {...props}
      style={[props.style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(1.1);
        props.onPressIn && props.onPressIn(e);
      }}
      onPressOut={(e) => {
        scale.value = withSequence(
          withTiming(0.96, { duration: 120 }),
          withTiming(1, { duration: 60 })
        );
        props.onPressOut && props.onPressOut(e);
      }}
      onPress={props.onPress}
    >
      {props.children}
    </AnimatedPressable>
  );
}
