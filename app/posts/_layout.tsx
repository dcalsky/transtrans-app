import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="detail" options={{
        headerShown: false
      }}
      />
    </Stack>
  );
}