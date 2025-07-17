import React from "react";
import { Pressable, View, Text, TouchableHighlight, TouchableOpacity, StyleSheet } from "react-native";

type ButtonProps = {
  // title: string;
  classname?: string;
  disabled?: boolean;
  ghost?: boolean;
  icon?: React.ReactNode
  shape?: 'circle' | 'round' | 'default';
  size?: 'small' | 'middle' | 'large';
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  onPress?: () => void;
  children: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = (props) => {
  const shape = props.shape || 'default';
  // props.shape = props.shape || 'default';
  // props.size = props.size || 'middle';
  // props.type = props.type || 'default';
  const buttonTextStyles = [styles.buttonTextBase];
  return (
    <TouchableOpacity activeOpacity={0.6} disabled={props.disabled} onPress={props.onPress}>
      <View className={props.classname}>
        {props.children}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonTextBase: {
    fontSize: 16,
    color: 'violet',
  }
});

export default Button;
