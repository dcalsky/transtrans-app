import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export interface TypewriterProps {
  // The text that needs to be animated
  textArray: string[]
  // Speed of the animation
  speed?: number
  // Should the animation be looped
  loop?: boolean
  // Delay before the next string shows up
  delay?: number
  // Override the default text style
  classname?: string
}

const DEFAULT_SPEED = 200;
const DEFAULT_DELAY = 1500;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
});


const TypeWriterText: React.FC<TypewriterProps> = ({
  textArray,
  speed = DEFAULT_SPEED,
  loop = false,
  delay = DEFAULT_DELAY,
  classname,
}) => {
  const [stringIndex, setStringIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  // Opacity value of the Cursor
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    borderOpacity.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(1, { duration: 0 })),
        withDelay(500, withTiming(0, { duration: 0 }))
      ),
      -1,
      true
    );
  }, []);


  const animatedStyles = useAnimatedStyle(() => {
    return {
      borderRightWidth: 8,
      borderRightColor: `rgba(0,0,0,${borderOpacity.value})`,
    };
  });

  useEffect(() => {
    setTimeout(() => {
      if (textIndex < textArray[stringIndex].length) {
        setTextIndex(textIndex + 1);
      } else {
        if (stringIndex < textArray.length - 1) {
          setTimeout(() => {
            setTextIndex(0);
            setStringIndex(stringIndex + 1);
          }, delay);
        } else {
          if (loop) {
            setTimeout(() => {
              setTextIndex(0);
              setStringIndex(0);
            }, delay);
          }
        }
      }
    }, speed);
  });

  return (
    <View style={styles.container}>
      <Animated.Text className={classname} style={animatedStyles}>
        {textArray[stringIndex].substring(0, textIndex)}
      </Animated.Text >
    </View>
  );
};

export default TypeWriterText;