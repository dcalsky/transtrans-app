import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { black, grayBlue } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { setChoices, ChoiceValue, ChoiceOption } from '@/store/choice_setting';
import { router } from 'expo-router';

interface CellItemProps {
  title?: string;
  titleStyle?: TextStyle,
  desc?: string
  leftIcon?: React.ReactNode;
  isLink?: boolean;
  value?: React.ReactNode | string;
  component?: React.ReactNode;
  onClick?: () => void;
}

interface CellSelectProps<T extends ChoiceValue> {
  title?: string;
  leftIcon?: React.ReactNode;
  initValue?: T;
  value?: T;
  options: ChoiceOption<T>[];
  onSelect: (value: T) => void;
}

interface CellGroupProps {
  children: React.ReactNode;
  style?: any;
  className?: string;
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    // borderBottomWidth: 0.5,
    // borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  value: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 18,
    display: 'flex',
    flexDirection: 'row',
  },
  title: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  cellGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  separator: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export function CellItem({
  title,
  titleStyle,
  desc,
  isLink = false,
  value,
  leftIcon,
  component,
  onClick,
}: CellItemProps) {
  let valueComponent: React.ReactNode = null;

  if (value) {
    if (typeof value === 'string') {
      valueComponent = (
        <Text className='text-black text-right text-lg'>
          {value}
        </Text>
      );
    } else {
      valueComponent = value;
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={onClick}
      style={styles.cell}
    >
      <View style={styles.title}>
        {leftIcon ? <View style={{ marginRight: 6 }}>{leftIcon}</View> : null}
        <View>
          <Text className='text-black text-lg' style={titleStyle}>{title}</Text>
          {desc && <Text className='text-gray-400 text-sm'>{desc}</Text>}
        </View>
      </View>

      <View style={styles.value} >
        {valueComponent}
        {isLink ? <Ionicons name="chevron-forward" size={18} /> : null}
      </View>
    </TouchableOpacity >
  );
}

export function CellGroup({ children, style, className }: CellGroupProps) {
  // Convert children to array to handle both single and multiple children
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.cellGroup, style]} className={className}>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {/* Add separator after each child except the last one */}
          {index < childrenArray.length - 1 && <View style={styles.separator} />}
        </React.Fragment>
      ))}
    </View>
  );
}

export function CellSelect<T extends ChoiceValue>(props: CellSelectProps<T> & CellItemProps) {
  const option = props.options.find((c) => c.value === (props.value || props.initValue));
  return (
    <CellItem
      {...props}
      isLink
      value={option?.name}
      onClick={() => {
        setChoices({
          options: props.options,
          onSelect: props.onSelect,
          value: option?.value,
        });
        router.push('/(setting_helper)/choice_page');
      }}
    />
  );
}