/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const violet = '#8e51ff';
export const grayBlue = '#4F7182';
export const green = '#4FBC8E';
export const emptyBoxColor = 'rgb(223, 226, 242)';
export const backgroundYellow = '#f8f7f4';
export const backgroundPurple = '#DFE2F2';
export const boldGray = '#90a4ae';
export const blue = '#3FAAF7';
export const black = '#1B1B1B';
export const red = 'rgb(236, 130, 105)';

export const generateBoxShadowStyle = (xOffset: number, yOffset: number, shadowRadius: number, elevation: number) => {
  if (Platform.OS === 'android') {
    return {
      elevation,
      shadowColor: '#000000',
    };
  }
  return {
    shadowOffset: { width: xOffset, height: yOffset },
    shadowOpacity: 0.14,
    shadowColor: '#000000',
    shadowRadius,
  };
};

export const buttonShadowStyle = generateBoxShadowStyle(1, 1, 2, 1);