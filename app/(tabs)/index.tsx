import { StyleSheet, Text, View, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { toastError, toastInfo, toastSuccess } from '@/helpers/toast';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScaledPressable } from '@/components/ScaledPressable';
import { usePostDb } from '@/hooks/usePost';
import { PostEntity } from '@/db/schema';
import { proxy } from 'valtio';
import { useProxy } from 'valtio/utils';
import { tryCatch } from '@/helpers/flow';
import { MasonryFlashList } from '@shopify/flash-list';
import { formatIsoToDatetime } from '@/helpers/time';
import { MenuView } from '@react-native-menu/menu';
import * as Clipboard from 'expo-clipboard';
import { UIManager } from 'react-native';
import SearchBar from '@/components/SearchBar';
import TranslatedText from '@/components/TranslatedText';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function FloatingActionButton() {
  const router = useRouter();
  return (
    <ScaledPressable style={styles.floatButton} className='shadow bg-violet-500' onPress={() => {
      router.push('/posts/create');
    }}>
      <Ionicons name='add' size={32} color='white' />
    </ScaledPressable>
  );
}


const postMenuActions = [
  {
    id: 'copy_test',
    title: 'Copy Text',
    image: Platform.select({
      ios: 'plus',
      android: 'ic_menu_add',
    }),
  },
  {
    id: 'delete',
    title: 'Delete',
    image: Platform.select({
      ios: 'trash',
      android: 'ic_menu_delete',
    }),
    attributes: {
      destructive: true,
    },
  },
]

interface HomeScreenProps {
  posts: PostEntity[]
  pageNum: number
  postsLoading: boolean
  searchText: string
}


const homeScreenStore = proxy<HomeScreenProps>({
  posts: [],
  pageNum: 1,
  postsLoading: true,
  searchText: ''
})

// Add EmptyState component
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
      <TranslatedText i18nKey='home.noPostsYet' className="text-xl text-gray-500 text-center mt-4 mb-2" />
      <TranslatedText i18nKey='home.createFirstNote' className="font-semibold text-gray-400 text-center px-8 mb-6" />
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const $store = useProxy(homeScreenStore, { sync: true });
  const { listPosts, deletePostById } = usePostDb()

  const router = useRouter();

  // Replace useEffect with useFocusEffect for screen focus handling
  useFocusEffect(
    useCallback(() => {
      refreshPosts();
    }, [])
  );

  // Update menu actions with translated text
  const translatedMenuActions = useMemo(() => {
    return [
      {
        ...postMenuActions[0],
        title: t('home.copyText')
      },
      {
        ...postMenuActions[1],
        title: t('common.delete')
      }
    ];
  }, [t]);

  const requestListPosts = async (pageNum: number) => {
    $store.postsLoading = true;
    const [posts, err] = await tryCatch(listPosts($store.searchText, $store.searchText, {
      PageSize: 20,
      PageNum: pageNum,
    }));
    if (err) {
      toastError({ text: err.message, title: t('home.fetchPostsFailed') });
      $store.postsLoading = false;
      return;
    }
    $store.pageNum = pageNum;
    $store.posts = pageNum === 1 ? posts : [...$store.posts, ...posts];
    $store.postsLoading = false;
  }

  const refreshPosts = async () => {
    $store.posts = [];
    await requestListPosts(1);
  }

  const handleSearch = () => {
    refreshPosts();
  };

  useEffect(() => {
    refreshPosts()
  }, [])

  const onClickPostMenuAction = async (eventId: string, post: PostEntity) => {
    if (eventId === 'copy_test') {
      await Clipboard.setStringAsync(post.textContent);
      toastInfo({ text: t('home.textCopied'), duration: 1000 })

    } else if (eventId === 'delete') {
      Alert.alert(t('home.deleteNote'), t('home.deleteNoteConfirm'), [
        {
          text: t('alerts.cancel'),
          style: 'cancel'
        },
        {
          text: t('alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            const [_, err] = await tryCatch(deletePostById(post.id));
            if (err) {
              toastError({ text: err.message, title: t('home.deleteFailed') });
              return;
            }
            toastSuccess({ text: t('home.deleteSuccess') });
            refreshPosts()
          }
        }
      ])
    }
  }

  const onPostListEndReached = () => {
    if ($store.postsLoading) {
      return
    }
    requestListPosts($store.pageNum + 1)
  }

  return (
    <SafeAreaView style={{ flex: 1, }} edges={['top']}  >
      <SearchBar
        placeholder={t('common.search')}
        containerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
        cancelTitle={t('common.cancel')}
        value={$store.searchText}
        onSubmitEditing={() => { handleSearch() }}
        onChangeText={(e) => {
          $store.searchText = e
        }}
        onClear={() => {
          $store.searchText = ''
          handleSearch()
        }}

      // theme={theme.textInput}
      />


      <MasonryFlashList
        onEndReached={onPostListEndReached}
        numColumns={2}
        refreshing={$store.postsLoading}
        showsVerticalScrollIndicator={false}
        data={$store.posts}
        estimatedItemSize={200}
        contentContainerClassName='pb-16'
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={!$store.postsLoading ? <EmptyState /> : null}
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => router.push(`/posts/detail?id=${item.id}`)}>
              <View className='px-2 py-4 rounded-xl ml-2 mr-1 my-2 bg-white'>
                <View className='flex flex-row items-center justify-between'>
                  <View className='mr-2 w-[80%]'>
                    <Text className='font-bold text-lg' ellipsizeMode='tail' numberOfLines={1}>{item.title}</Text>
                  </View>
                  <Pressable onPress={(e) => {
                    e.stopPropagation()
                  }}>
                    <MenuView
                      onPressAction={({ nativeEvent }) => {
                        onClickPostMenuAction(nativeEvent.event, item)
                      }}
                      actions={translatedMenuActions}
                      shouldOpenOnLongPress={false}
                    >
                      <Ionicons name='ellipsis-horizontal' color={"#616161"} size={20} />
                    </MenuView>
                  </Pressable>
                </View>
                <View className='mt-2'>
                  <Text className='text-gray-600' style={{ fontSize: 14, lineHeight: 18, color: "#666" }} ellipsizeMode='tail' numberOfLines={10}>
                    {item.textContent}
                  </Text>
                </View>
                <View className='flex flex-row justify-between mt-4'>
                  <Text className='text-gray-400 text-sm'>{formatIsoToDatetime(item.createdAt)}</Text>
                </View>
              </View>
            </Pressable>
          )
        }} />
      <FloatingActionButton />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  floatButton: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
