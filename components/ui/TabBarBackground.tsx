import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
// This is a shim for web and Android where the tab bar is generally opaque.
export default <BlurView tint="light" intensity={100} style={StyleSheet.absoluteFill} />

export function useBottomTabOverflow() {
  return 0;
}
