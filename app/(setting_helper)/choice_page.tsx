import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { choiceSettingStore } from '@/store/choice_setting';
import { useSnapshot } from 'valtio';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChoicesModalScreen() {
  const choiceSettingSnap = useSnapshot(choiceSettingStore);
  const router = useRouter()
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ paddingVertical: 8 }} >
        <FlashList
          contentContainerStyle={{ paddingBottom: 56 }}
          data={choiceSettingSnap.options}
          estimatedItemSize={100}
          renderItem={({ item: choice }) => {
            return <TouchableOpacity activeOpacity={0.7} key={choice.value} style={styles.choiceItem}
              onPress={() => {
                if (choiceSettingStore.onSelect) {
                  choiceSettingStore.onSelect(choice.value)
                  router.back()
                }
              }}>
              <View>
                <Text style={styles.choiceItemTitle}>
                  {choice.name}
                </Text>
                {choice.desc && <Text style={styles.choiceItemDesc}>{choice.desc}</Text>}
              </View>

              <View>
                {choiceSettingSnap.value === choice.value && <Ionicons name='chevron-forward' size={22} />}
              </View>
            </TouchableOpacity>
          }}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  choiceItemTitle: {
    fontSize: 16,
    fontWeight: 600
  },
  choiceItemDesc: {
    marginTop: 5,
    fontSize: 13,
    color: "#9ca3af"
  },
  choiceItem: {
    display: 'flex', // flex
    flexDirection: 'row', // flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
    paddingHorizontal: 16, // px-4
    paddingVertical: 16, // py-4
    borderBottomWidth: 1, // border-b
    borderBottomColor: 'rgba(209, 213, 219, 0.5)', // border-b-gray-300/50
    backgroundColor: '#ffffff', // bg-white
  },
});
