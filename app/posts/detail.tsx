import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState, useCallback } from "react"
import { usePostDb } from "@/hooks/usePost"
import { PostEntity } from "@/db/schema"
import { SafeAreaView } from "react-native-safe-area-context"
import { formatIsoToDatetime } from "@/helpers/time"
import { toastError, toastInfo } from "@/helpers/toast"
import Ionicons from '@expo/vector-icons/Ionicons'
import { ScaledPressable } from "@/components/ScaledPressable"
import * as Clipboard from 'expo-clipboard'
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { useTranslation } from 'react-i18next'
import { useFocusEffect } from '@react-navigation/native'
import { Audio } from 'expo-av'
import { GoBackButton } from "@/components/GoBackButton"
import TranslatedText from "@/components/TranslatedText"

const PostDetailPage = () => {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [post, setPost] = useState<PostEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { getPostById, deletePostById } = usePostDb()
  const router = useRouter()

  const fetchPost = async () => {
    if (!id) {
      toastError({ text: "Note ID is required", title: "Error" })
      router.back()
      return
    }

    setLoading(true)
    try {
      const postData = await getPostById(Number(id))
      if (!postData) {
        router.back()
        return
      }
      setPost(postData)
    } catch (error) {
      console.error("Error fetching post:", error)
      toastError({ text: "Failed to load post", title: "Error" })
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchPost()
    }, [id])
  )

  const handleCopyText = async () => {
    if (post?.textContent) {
      await Clipboard.setStringAsync(post.textContent)
      toastInfo({ text: t('home.textCopied'), duration: 1500 })
    }
  }

  const handleDelete = () => {
    Alert.alert(
      t('posts.deletePost'),
      t('posts.deletePostConfirm'),
      [
        {
          text: t('alerts.cancel'),
          style: "cancel"
        },
        {
          text: t('alerts.delete'),
          style: "destructive",
          onPress: async () => {
            if (post?.id) {
              try {
                await deletePostById(post.id)
                toastInfo({ text: t('posts.deleteSuccess'), duration: 1500 })
                router.back()
              } catch (error) {
                console.error("Error deleting post:", error)
                toastInfo({ text: String(error), duration: 1500 })
              }
            }
          }
        }
      ]
    )
  }

  const handleEdit = () => {
    // Navigate to create page with post data
    // Since the create page doesn't have built-in edit functionality,
    // we'll need to implement a workaround by passing the post data
    // and updating the UI to show we're in edit mode
    if (post) {
      // For now, we'll just navigate to the create page
      // In a real implementation, you would pass the post data and handle editing
      router.push({
        pathname: '/posts/create',
        params: {
          editMode: 'true',
          postId: post.id.toString(),
        }
      });
    }
  }

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Request audio permissions when component mounts
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };

    setupAudio();
  }, []);

  const handlePlayAudio = async (audioUri: string, index: number) => {
    try {
      console.log("Attempting to play audio:", audioUri);

      // If there's already a sound playing, stop and unload it
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();

        // If we're clicking on the same audio that's already playing, just stop it
        if (playingAudioIndex === index && isPlaying) {
          setSound(null);
          setPlayingAudioIndex(null);
          setIsPlaying(false);
          return;
        }
      }

      // Ensure the URI is properly formatted
      // If it's a local file path, it needs to have the file:// prefix
      let formattedUri = audioUri;
      if (audioUri && !audioUri.startsWith('http') && !audioUri.startsWith('file://')) {
        formattedUri = `file://${audioUri}`;
      }

      // Load and play the new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: formattedUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAudioIndex(index);
      setIsPlaying(true);

      // Listen for playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      toastError({
        text: `${t('posts.audioPlaybackError')}: ${error || 'Unknown error'}`,
        title: "Error"
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    )
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('posts.postNotFound')}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex justify-between flex-row items-center px-4">
        <GoBackButton />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(200).delay(100)} style={styles.header}>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
            <Text style={styles.date}>{formatIsoToDatetime(post.createdAt)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(200).delay(200)} style={styles.content}>
          <Text style={styles.contentText}>{post.textContent}</Text>
        </Animated.View>

        {post.audios && post.audios.length > 0 && (
          <Animated.View entering={FadeInDown.duration(200).delay(300)} style={styles.audioSection}>
            <Text style={styles.sectionTitle}>{t('posts.audioAttachments')}</Text>
            {post.audios.map((audio, index) => (
              <TouchableOpacity
                key={index}
                style={styles.audioItem}
                onPress={() => handlePlayAudio(audio.uri, index)}
              >
                <View style={styles.audioIconContainer}>
                  <Ionicons name="musical-note" size={24} color="#6366f1" />
                </View>
                <View style={styles.audioDetails}>
                  <Text style={styles.audioName} numberOfLines={1} ellipsizeMode="tail">
                    {audio.filename}
                  </Text>
                  <Text style={styles.audioDuration}>
                    <Ionicons name="time-outline" size={14} color="#6b7280" /> {(audio.duration / 1000).toFixed(1)}{t('posts.seconds')}
                  </Text>
                </View>
                <View style={styles.audioPlayButton}>
                  <Ionicons
                    name={playingAudioIndex === index && isPlaying ? "pause" : "play"}
                    size={20}
                    color="#6366f1"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.actionBar}>
        <ScaledPressable onPress={handleCopyText} style={styles.actionButton}>
          <Ionicons name="copy-outline" size={22} color="#6366f1" />
          <TranslatedText style={styles.actionText} i18nKey="posts.copy" />
        </ScaledPressable>

        <ScaledPressable onPress={handleEdit} style={styles.actionButton}>
          <Ionicons name="create-outline" size={22} color="#6366f1" />
          <TranslatedText style={styles.actionText} i18nKey="common.edit" />
        </ScaledPressable>

        <ScaledPressable onPress={handleDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />

          <TranslatedText style={[styles.actionText, styles.deleteText]} i18nKey="common.delete" />
        </ScaledPressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  content: {
    marginBottom: 28,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  audioSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  audioIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioDetails: {
    flex: 1,
  },
  audioName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  audioDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  audioPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    minWidth: 100,
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#6366f1',
  },
  deleteText: {
    color: '#ef4444',
  },
  spacer: {
    height: 80,
  },
})

export default PostDetailPage