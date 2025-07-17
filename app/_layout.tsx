import * as Font from 'expo-font';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { loadStoredSession, } from '@/store/session';
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { loadSettings } from '@/store/settings';
import { initLanguageFromSettings } from '@/helpers/i18n';
import { KeyboardProvider } from "react-native-keyboard-controller";
import "@/helpers/i18n"
import 'react-native-reanimated';
import "./global.css"
import { SafeAreaProvider } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { vexo } from 'vexo-analytics';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { NotifierWrapper } from 'react-native-notifier';

Purchases.setLogLevel(LOG_LEVEL.INFO);

vexo(process.env.EXPO_PUBLIC_VEXO_API_KEY);

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

const DATABASE_NAME = 'transtrans-v1.db';

const queryClient = new QueryClient();
const expoDb = openDatabaseSync(DATABASE_NAME);
const db = drizzle(expoDb);
axios.defaults.validateStatus = (status) => {
  return true
}
axios.defaults.baseURL = process.env.EXPO_PUBLIC_API_BASE_URL

const isDev = process.env.NODE_ENV === 'development'

console.log(process.env.EXPO_PUBLIC_API_BASE_URL)

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: false,
  enabled: !isDev,
  tracesSampleRate: 1.0,
  integrations: [
    navigationIntegration,
  ],
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

function RootLayout() {
  useDrizzleStudio(db);
  const ref = useNavigationContainerRef();
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  useEffect(() => {
    const initApp = async () => {
      try {
        await Promise.all([
          loadStoredSession(),
          loadSettings(),
          Font.loadAsync({
            'Space Mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
          }),
          migrate(db, migrations)
        ]);
        initLanguageFromSettings();
      } catch (e) {
        console.error(e)
      } finally {
        setIsAppInitialized(true);
      }
    };
    initApp();
  }, []);
  useEffect(() => {
    if (isAppInitialized) {
      SplashScreen.hide();
    }
  }, [isAppInitialized]);

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  if (!isAppInitialized) {
    return null;
  }
  return (
    // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    <SQLiteProvider databaseName={DATABASE_NAME} options={{ enableChangeListener: true }}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <NotifierWrapper>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <SafeAreaProvider>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false, }} />
                    <Stack.Screen name="(setting_helper)/choice_page" options={{ headerShown: false, presentation: 'modal' }} />
                    <Stack.Screen name="posts" options={{ headerShown: false, }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </SafeAreaProvider>
              </BottomSheetModalProvider>
            </NotifierWrapper>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SQLiteProvider>
    // </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);