import { Linking, Platform } from 'react-native'

export const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:')
  }
}