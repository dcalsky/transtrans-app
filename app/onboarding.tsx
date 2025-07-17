import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Feather } from '@expo/vector-icons';
import React, { RefObject } from 'react';
import { useRouter } from 'expo-router';
import { useSnapshot } from 'valtio';
import { sessionStore } from '@/store/session';
import { useTranslation } from 'react-i18next';
import { saveSettings, settingsStore } from '@/store/settings';
import TranslatedText from '@/components/TranslatedText';
import { SafeAreaView } from 'react-native-safe-area-context';

type Data = {
  id: number;
  image: any;
  titleKey: string;
  textKey: string;
};

const data: Data[] = [
  {
    id: 1,
    image: require('../assets/images/podcast-show.png'),
    titleKey: 'onboarding.welcome.title',
    textKey: 'onboarding.welcome.text',
  },
  {
    id: 2,
    image: require('../assets/images/woman-holding-a-heart.png'),
    titleKey: 'onboarding.features.title',
    textKey: 'onboarding.features.text',
  },
  {
    id: 3,
    image: require('../assets/images/meditation-boy.png'),
    titleKey: 'onboarding.start.title',
    textKey: 'onboarding.start.text',
  },
];

const theme = {
  colors: {
    backgroundColor: '#FFF7F3',
    backgroundHighlightColor: '#FB923C',
    textColor: '#313131',
    textHighlightColor: '#ffffff',
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonProps = {
  flatListRef: RefObject<FlatList>;
  flatListIndex: SharedValue<number>;
  dataLength: number;
};

function Button({
  dataLength,
  flatListIndex,
  flatListRef,
}: ButtonProps) {
  const router = useRouter();
  const { User, Token } = useSnapshot(sessionStore);
  const { t } = useTranslation();

  const buttonAnimationStyle = useAnimatedStyle(() => {
    const isLastScreen = flatListIndex.value === dataLength - 1;
    return {
      width: isLastScreen ? withSpring(140) : withSpring(60),
      height: 60,
    };
  });

  const arrowAnimationStyle = useAnimatedStyle(() => {
    const isLastScreen = flatListIndex.value === dataLength - 1;
    return {
      opacity: isLastScreen ? withTiming(0) : withTiming(1),
      transform: [
        { translateX: isLastScreen ? withTiming(100) : withTiming(0) },
      ],
    };
  });

  const textAnimationStyle = useAnimatedStyle(() => {
    const isLastScreen = flatListIndex.value === dataLength - 1;
    return {
      opacity: isLastScreen ? withTiming(1) : withTiming(0),
      transform: [
        { translateX: isLastScreen ? withTiming(0) : withTiming(-100) },
      ],
    };
  });

  const handleNextScreen = async () => {
    const isLastScreen = flatListIndex.value === dataLength - 1;
    if (!isLastScreen) {
      flatListRef.current?.scrollToIndex({ index: flatListIndex.value + 1 });
    } else {
      settingsStore.hasSeenOnboarding = true
      await saveSettings()
      router.replace('/(tabs)');
    }
  };

  return (
    <AnimatedPressable
      onPress={handleNextScreen}
      style={[styles.buttonContainer, buttonAnimationStyle]}
    >
      <Animated.Text style={[styles.text, textAnimationStyle]}>
        {t('onboarding.getStarted')}
      </Animated.Text>

      <Animated.View style={[styles.arrow, arrowAnimationStyle]}>
        <Feather
          name="arrow-right"
          size={30}
          color={theme.colors.textHighlightColor}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}


const RenderItem = ({
  item,
  index,
  x,
}: {
  item: Data;
  index: number;
  x: SharedValue<number>;
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { t } = useTranslation();

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const opacityAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateYAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [100, 0, 100],
      Extrapolation.CLAMP
    );

    return {
      width: SCREEN_WIDTH * 0.8,
      height: SCREEN_WIDTH * 0.8,
      opacity: opacityAnimation,
      transform: [{ translateY: translateYAnimation }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const opacityAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateYAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [100, 0, 100],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacityAnimation,
      transform: [{ translateY: translateYAnimation }],
    };
  });

  return (
    <SafeAreaView style={[styles.itemContainer, { width: SCREEN_WIDTH }]}>
      <Animated.Image source={item.image} style={[imageAnimatedStyle, { marginTop: 20 }]} />

      <Animated.View style={textAnimatedStyle} className='px-4 mt-6'>
        <TranslatedText i18nKey={item.titleKey} style={styles.itemTitle} />
        <TranslatedText i18nKey={item.textKey} style={styles.itemText} />
      </Animated.View>
    </SafeAreaView>
  );
};

export default function OnboardingPage() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const flatListRef = useAnimatedRef<FlatList>();

  const flatListIndex = useSharedValue(0);
  const x = useSharedValue(0);

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: Array<ViewToken>;
  }) => {
    flatListIndex.value = viewableItems[0].index ?? 0;
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef as any}
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <RenderItem index={index} item={item} x={x} />
        )}
        onScroll={onScroll}
        scrollEventThrottle={16}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
      />

      <View style={styles.footerContainer}>
        <Pagination data={data} screenWidth={SCREEN_WIDTH} x={x} />

        <Button
          flatListRef={flatListRef}
          flatListIndex={flatListIndex}
          dataLength={data.length}
        />
      </View>
    </View>
  );
}


type PaginationCompProps = {
  index: number;
  x: SharedValue<number>;
  screenWidth: number;
};

const PaginationComp = ({ index, x, screenWidth }: PaginationCompProps) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const widthAnimation = interpolate(
      x.value,
      [
        (index - 1) * screenWidth,
        index * screenWidth,
        (index + 1) * screenWidth,
      ],
      [10, 20, 10],
      Extrapolation.CLAMP
    );

    const opacityAnimation = interpolate(
      x.value,
      [
        (index - 1) * screenWidth,
        index * screenWidth,
        (index + 1) * screenWidth,
      ],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      width: widthAnimation,
      opacity: opacityAnimation,
    };
  });

  return <Animated.View style={[styles.dots, animatedDotStyle]} />;
};

type PaginationProps = {
  data: Data[];
  x: SharedValue<number>;
  screenWidth: number;
};



function Pagination({ data, screenWidth, x }: PaginationProps) {
  return (
    <View style={styles.paginationContainer}>
      {data.map((item, index) => (
        <PaginationComp
          key={item.id}
          index={index}
          x={x}
          screenWidth={screenWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: theme.colors.backgroundHighlightColor,
    padding: 10,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  arrow: {
    position: 'absolute',
  },
  text: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textHighlightColor,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
  },
  itemContainer: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
    alignItems: 'center',
    // justifyContent: 'space-around',
  },
  itemTitle: {
    color: theme.colors.textColor,
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'left',
    marginBottom: 20,
  },
  itemText: {
    color: theme.colors.textColor,
    textAlign: 'left',
    fontSize: 22,
    lineHeight: 32,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 20,
    marginBottom: 36
  },
  paginationContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.backgroundHighlightColor,
    marginHorizontal: 10,
  },
});