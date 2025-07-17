import { Animated, Pressable, ScrollView, View, ViewProps, Text } from 'react-native';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import Layout from '@/constants/Layout';

interface TabBarProp {
  tabs: {
    name: string;
  }[];
  selected: number;
  onClick?: (selected: number) => void;
  scroll?: boolean;
}

type TabItemProps = {
  text: string;
  selected?: boolean;
  width: number;
  onClick: () => void;
};



function TabItem({
  text,
  selected,
  width,
  onClick,
}: TabItemProps) {
  return (
    <Pressable onPress={onClick}>
      <View style={{ flex: 1, width: width, }}>
        <Text
          style={{
            textAlign: 'center',
            fontSize: selected ? 16 : 15,
            fontWeight: selected ? '600' : '400',
          }}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

export function TabBar({ tabs, onClick, selected, scroll = false }: TabBarProp) {
  const itemWidth = scroll ? 80 : Layout.window.width / tabs.length;
  const tabIndicatorOffsetX = useRef(new Animated.Value(0)).current;
  const ref = useRef<ScrollView | null>(null) as MutableRefObject<ScrollView>;

  useEffect(() => {
    const targetX = selected * itemWidth;
    Animated.timing(tabIndicatorOffsetX, {
      toValue: targetX,
      useNativeDriver: true,
      duration: 150,
    }).start();
    ref.current.scrollTo({ x: targetX / 2 - itemWidth / 2 });
  }, [selected]);

  return (
    <ScrollView horizontal={true} bounces={scroll} ref={ref}>
      <View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 8,
            paddingBottom: 6,
          }}
        >
          {tabs.map((tab, i) => {
            return (
              <TabItem
                key={tab.name}
                text={tab.name}
                width={itemWidth}
                selected={i === selected}
                onClick={() => {
                  if (onClick) {
                    onClick(i);
                  }
                }}
              />
            );
          })}
        </View>
        <Animated.View
          style={[
            {
              backgroundColor: '#ffab00',
              width: itemWidth,
              height: 6,
              borderRadius: 8,
            },
            {
              transform: [
                {
                  translateX: tabIndicatorOffsetX,
                },
              ],
            },
          ]}
        />
      </View>
    </ScrollView>
  );
}

interface TabBarViewProps {
  setTabSelected: (i: number) => void;
  selected: number;
}

export function TabBarView({ setTabSelected, children, selected }: TabBarViewProps & ViewProps) {
  const scrollViewRef = useRef<ScrollView | null>() as MutableRefObject<ScrollView | null>;
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, x: selected * Layout.window.width, animated: true });
  }, [selected]);

  return (
    <ScrollView
      horizontal={true}
      scrollEventThrottle={20}
      snapToInterval={Layout.window.width}
      decelerationRate="fast"
      ref={scrollViewRef}
      onScrollBeginDrag={() => setDragging(true)}
      onMomentumScrollEnd={() => setDragging(false)}
      onScroll={(e) => {
        if (!dragging) {
          return;
        }
        let x = e.nativeEvent.contentOffset.x;
        if (x < 0) {
          x = 0;
        }
        setTabSelected(Math.round(x / Layout.window.width));
      }}
      style={{
        backgroundColor: '#fff',
        paddingBottom: 40,
      }}
    >
      {children}
    </ScrollView>
  );
}

export function TabBarViewChild(props: ViewProps) {
  return (
    <View
      style={{
        width: Layout.window.width,
        overflow: 'hidden',
      }}
    >
      {props.children}
    </View>
  );
}