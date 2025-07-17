import { Tabs } from 'expo-router';
import { Platform, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, violet } from '@/constants/Colors';

const tabBarStyle: ViewStyle = {
  backgroundColor: "white",
  borderRadius: 36,
  // bottom: 30,
  boxShadow: "-6px 8px 20px 4px rgba(0,0,0,0.14)",
  overflow: 'hidden',
};

const tabBarLabelStyle: TextStyle = {
  // fontSize: 14,
  marginTop: 2,
  fontWeight: "bold",
  margin: 0,
  padding: 0
}

export default function TabLayout() {
  const { t } = useTranslation();


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: violet,
        headerShown: false,
        // tabBarActiveTintColor,
        tabBarStyle: tabBarStyle,
        // headerBackButtonDisplayMode: 'default',
        // tabBarBackground: () => <View className='h-full w-full'></View>,
        tabBarLabelStyle: tabBarLabelStyle,
        // tabBarShowLabel: false
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),

        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
