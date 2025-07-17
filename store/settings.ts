import { proxy } from 'valtio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LangValue } from '@/helpers/language';

// Define the settings store state interface
interface SettingsStoreState {
  language?: string;
  textMode: 'append' | 'override';
  transcribingMode: 'slight' | 'expand' | 'original';
  speakingLanguage: LangValue;
  hasSeenOnboarding: boolean;
}

// Create the settings store with default values
export const settingsStore = proxy<SettingsStoreState>({
  textMode: 'append',
  transcribingMode: 'slight',
  speakingLanguage: 'en',
  hasSeenOnboarding: false,
});

// Storage keys
const SETTINGS_STORAGE_KEY = 'user_settings';

// Save settings to AsyncStorage
export const saveSettings = async () => {
  try {
    const settingsJson = JSON.stringify({
      language: settingsStore.language,
      textMode: settingsStore.textMode,
      transcribingMode: settingsStore.transcribingMode,
      speakingLanguage: settingsStore.speakingLanguage,
      hasSeenOnboarding: settingsStore.hasSeenOnboarding,
    });
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, settingsJson);
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// Load settings from AsyncStorage
export const loadSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);

      // Update the store with loaded settings
      if (settings.language) settingsStore.language = settings.language;
      if (settings.textMode) settingsStore.textMode = settings.textMode;
      if (settings.transcribingMode) settingsStore.transcribingMode = settings.transcribingMode;
      if (settings.speakingLanguage) {
        settingsStore.speakingLanguage = settings.speakingLanguage;
      } else if (settings.language) {
        settingsStore.speakingLanguage = settings.language;
      }
      if (typeof settings.hasSeenOnboarding === 'boolean') {
        settingsStore.hasSeenOnboarding = settings.hasSeenOnboarding;
      }

      

      console.log('Settings loaded successfully');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

// Update language setting and persist
export const updateLanguage = async (language: string) => {
  const previousLanguage = settingsStore.language;
  settingsStore.language = language;
  await saveSettings();
};

// Update text mode setting and persist
export const updateTextMode = async (textMode: 'append' | 'override') => {
  settingsStore.textMode = textMode;
  await saveSettings();
};

// Update transcribing mode setting and persist
export const updateTranscribingMode = async (transcribingMode: 'slight' | 'expand' | 'original') => {
  settingsStore.transcribingMode = transcribingMode;
  await saveSettings();
};

// Update speaking language setting and persist
export const updateSpeakingLanguage = async (speakingLanguage: LangValue) => {
  settingsStore.speakingLanguage = speakingLanguage;
  await saveSettings();
};

// Update onboarding status and persist
export const updateOnboardingStatus = async (hasSeenOnboarding: boolean) => {
  settingsStore.hasSeenOnboarding = hasSeenOnboarding;
  await saveSettings();
}; 