import { Redirect } from 'expo-router';
import { useSnapshot } from 'valtio';
import { sessionStore } from '@/store/session';
import { settingsStore } from '@/store/settings';

export default function IndexPage() {
  const { User, Token } = useSnapshot(sessionStore);
  const { hasSeenOnboarding } = useSnapshot(settingsStore);
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  // After onboarding, redirect based on login status
  return <Redirect href="/(tabs)" />
}