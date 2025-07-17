import { CellGroup, CellSelect } from "@/components/Cell";
import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, PanResponder, Alert, ActivityIndicator, Platform, TouchableWithoutFeedback, Keyboard, findNodeHandle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming, withDelay, interpolate } from "react-native-reanimated";
import { useAudioRecorder, AudioModule, RecordingPresets, } from 'expo-audio';
import { proxy } from "valtio";
import { useProxy } from "valtio/utils";
import * as Haptics from 'expo-haptics';
import { toastError, toastInfo, toastSuccess } from "@/helpers/toast";
import { useRouter, useLocalSearchParams } from "expo-router";
import { openAppSettings } from "@/helpers/launch";
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'
import { langs, LangValue } from "@/helpers/language";
import { ScrollView } from "react-native-gesture-handler";
import { useTranslation } from 'react-i18next';
import { TranscribeVoiceToTextResponse } from "@/models/dto/voice";
import { convertZh } from "@/helpers/zh";
import { FlashList } from "@shopify/flash-list";
import { formatDuration, formatIsoToDatetime } from "@/helpers/time";
import { Audio } from 'expo-av';
import { usePostDb } from "@/hooks/usePost";
import { tryCatch } from "@/helpers/flow";
import { SafeAreaView } from "react-native-safe-area-context";
import { AudioInPost } from "@/db/schema";
import { ApiError, apiFormRequest } from "@/helpers/api";
import { useSnapshot } from 'valtio';
import { settingsStore, updateTextMode, updateTranscribingMode, updateSpeakingLanguage } from '@/store/settings';
import LottieView from "lottie-react-native";
import Confetti from "@/components/Confetti";
import { sessionStore } from "@/store/session";
import { GoBackButton } from "@/components/GoBackButton";
import { MenuView } from "@react-native-menu/menu";
import TranslatedText from "@/components/TranslatedText";
import { KeyboardAwareScrollView, KeyboardStickyView, KeyboardToolbar, useKeyboardHandler } from "react-native-keyboard-controller";
import AsyncStorage from '@react-native-async-storage/async-storage';

type TextMode = 'append' | 'override'
type TranscribingMode = 'slight' | 'expand' | 'original'

const textModes = (t: any): { name: string, value: TextMode, desc: string }[] => [
  {
    name: t('posts.textModeOptions.append'),
    value: "append",
    desc: t('posts.textModeDescriptions.append')
  },
  {
    name: t('posts.textModeOptions.override'),
    value: "override",
    desc: t('posts.textModeDescriptions.override')
  },
]

const transcribingModes = (t: any): { name: string, value: TranscribingMode, desc: string }[] => [
  {
    name: t('posts.transcribingModeOptions.slight'),
    value: "slight",
    desc: t('posts.transcribingModeDescriptions.slight')
  },
  {
    name: t('posts.transcribingModeOptions.original'),
    value: "original",
    desc: t('posts.transcribingModeDescriptions.original')
  }
]

type TranscribeTaskStatus = 'pending' | 'processing' | 'done' | 'error'

interface TranscribeTask {
  id: string
  uri: string
  filename: string
  duration: number
  status: TranscribeTaskStatus
  errorMessage?: string
}

const DRAFT_STORAGE_KEY = 'post_draft';
const DRAFT_SAVE_INTERVAL = 3000; // Save draft every 3 seconds

interface ICreatePostStore {
  textMode: TextMode
  isRecording: boolean
  startRecordAt: number
  pressRecordAt?: number
  languageCode: LangValue
  transcribingMode: TranscribingMode
  textContent: string
  transcribeTasks: TranscribeTask[]
  forbidSave: boolean
  isTranscribing: boolean
  postTitle?: string
  recordingTimeLeft?: number
}


const createPostStore = proxy<ICreatePostStore>({
  textMode: 'append',
  isRecording: false,
  startRecordAt: 0,
  pressRecordAt: undefined,
  languageCode: 'en',
  transcribingMode: 'slight',
  textContent: '',
  transcribeTasks: [],
  recordingTimeLeft: undefined,
  get forbidSave(): boolean {
    return this.textContent.trim() === ''
  },
  get isTranscribing(): boolean {
    return this.transcribeTasks.some(task => task.status === 'processing')
  }
})

const resetStore = (resetContent = false) => {
  createPostStore.isRecording = false
  createPostStore.startRecordAt = 0
  createPostStore.pressRecordAt = undefined
  createPostStore.recordingTimeLeft = undefined
  if (resetContent) {
    createPostStore.textContent = ''
    createPostStore.transcribeTasks = []
    createPostStore.postTitle = undefined
  }
}


const updateTreanscribeTaskById = (id: string, props: Partial<TranscribeTask>) => {
  const idx = createPostStore.transcribeTasks.findIndex(task => task.id === id)
  if (idx === -1) {
    return
  }
  createPostStore.transcribeTasks[idx] = {
    ...createPostStore.transcribeTasks[idx],
    ...props
  }
}

const useGradualAnimation = () => {
  const height = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: event => {
        'worklet';
        height.value = Math.max(event.height, 0);
      },
    },
    []
  );
  return { height };
};

const CreatePostPage: React.FC = () => {
  const { t } = useTranslation();
  const $store = useProxy(createPostStore, { sync: true })
  const sessionSnap = useSnapshot(sessionStore, { sync: true })
  const router = useRouter()
  const { editMode, postId } = useLocalSearchParams<{
    editMode: string,
    postId: string,
  }>()
  const cancelButtonRef = useRef<View>(null)
  const recordButtonRef = useRef<View>(null)
  const confettiRef = useRef<LottieView>(null)
  const cancelButtonScale = useSharedValue(1);
  const cancelButtonOpacity = useSharedValue(0.8);
  const recordButtonScale = useSharedValue(1);
  const [isOverCancel, setIsOverCancel] = useState(false)
  const [cancelButtonPos, setCancelButtonPos] = useState<[number, number][]>([])
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const textareaScrollRef = useRef<ScrollView>(null)
  const [playingTranscribeTaskId, setPlayingTranscribeTaskId] = useState<string | null>(null)
  const taskListRef = useRef<FlashList<TranscribeTask>>(null)
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null)
  const { createPost, updatePostById, getPostById } = usePostDb()
  const [isEditMode, setIsEditMode] = useState(false)
  const settingsSnap = useSnapshot(settingsStore);
  const MAX_RECORDING_DURATION = 60; // Maximum recording duration in seconds
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { height } = useGradualAnimation();
  const draftIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load draft content on component mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        // Skip loading draft if in edit mode
        if (editMode === 'true' && postId) {
          return;
        }
        
        const draftData = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (draftData) {
          const draft = JSON.parse(draftData);
          if (draft.textContent) {
            $store.textContent = draft.textContent;
          }
          if (draft.postTitle) {
            $store.postTitle = draft.postTitle;
          }
          // Don't restore transcribeTasks as they reference local files
          // that might not exist after app restart
          toastInfo({ text: t('posts.draftLoaded'), duration: 1000 });
        }
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    };
    
    loadDraft();
    
    // Set up interval to save draft
    draftIntervalRef.current = setInterval(saveDraft, DRAFT_SAVE_INTERVAL);
    
    // Clean up interval on unmount
    return () => {
      if (draftIntervalRef.current) {
        clearInterval(draftIntervalRef.current);
      }
    };
  }, []);
  
  // Function to save draft to AsyncStorage
  const saveDraft = async () => {
    try {
      // Only save if there's content and not in edit mode
      if (($store.textContent.trim() !== '' || $store.postTitle) && !(editMode === 'true' && postId)) {
        const draftData = {
          textContent: $store.textContent,
          postTitle: $store.postTitle,
          savedAt: new Date().toISOString()
        };
        await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      
      }
    } catch (e) {
      console.error("Error saving draft:", e);
    }
  };
  
  // Clear draft from AsyncStorage
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error("Error clearing draft:", e);
    }
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      bottom: Math.abs(height.value),
    };
  }, []);

  const transcribeTaskMenuActions = useMemo(() => [
    {
      id: 'play/pause',
      title: t('posts.playOrPauseTranscribeTaskMenuItem'),
      image: Platform.select({
        ios: 'play',
        android: 'ic_menu_play',
      }),
    },
    {
      id: 'delete',
      title: t('posts.deleteTranscribeTaskMenuItem'),
      image: Platform.select({
        ios: 'trash',
        android: 'ic_menu_delete',
      }),
      attributes: {
        destructive: true,
      },
    },
  ], [])

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cancelButtonScale.value }],
      opacity: cancelButtonOpacity.value,
    };
  });

  const recordButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: recordButtonScale.value }],
    };
  });

  useLayoutEffect(() => {
    cancelButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const renderSize: [number, number][] = [[pageX, pageY], [pageX + width, pageY], [pageX, pageY + height], [pageX + width, pageY + height]]
      setCancelButtonPos(renderSize)
    })
  }, [$store.isRecording])

  useEffect(() => {
    if (isOverCancel) {
      cancelButtonScale.value = withTiming(1.2);
      cancelButtonOpacity.value = withTiming(1.0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else {
      cancelButtonScale.value = withTiming(1.0);
      cancelButtonOpacity.value = withTiming(0.8);
    }
  }, [isOverCancel])

  useEffect(() => {
    if ($store.isRecording) {
      recordButtonScale.value = withSpring(1.2);
    } else {
      recordButtonScale.value = withSpring(1.0);
    }
  }, [$store.isRecording])

  useEffect(() => {
    grantMicrophonePermission()
  }, [])

  useEffect(() => {
    // Initialize with post data if in edit mode
    if (editMode === 'true' && postId) {
      setIsEditMode(true)
      fetchPostDetails(Number(postId));
    } else {
      // Reset store when entering create mode
      // resetStore();
    }
  }, [])

  useEffect(() => {
    // Initialize store values from settings when component mounts
    $store.textMode = settingsSnap.textMode;
    $store.transcribingMode = settingsSnap.transcribingMode;

    // Use user's language as first priority for speaking language
    // If speakingLanguage is not set or is the default, use the user's language setting
    if (settingsSnap.speakingLanguage) {
      $store.languageCode = settingsSnap.speakingLanguage;
    }
  }, []);

  const fetchPostDetails = useCallback(async (postId: number) => {
    try {
      const post = await getPostById(postId);
      if (post) {
        const tasks = post.audios.map((audio: AudioInPost) => ({
          id: Crypto.randomUUID(),
          uri: audio.uri,
          filename: audio.filename,
          duration: audio.duration,
          status: 'done' as TranscribeTaskStatus
        }));

        $store.transcribeTasks = tasks;
        $store.textContent = post.textContent
        $store.postTitle = post.title
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
    }
  }, []);

  const grantMicrophonePermission = async (): Promise<boolean> => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      Alert.alert(t('posts.microphonePermission'), t('posts.microphonePermissionMessage'), [
        {
          text: t('alerts.cancel'),
          style: 'cancel',
        },
        { text: t('posts.goToSettings'), onPress: () => openAppSettings() },
      ]);
      return false
    }
    return true
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: async (evt) => {
      startRecording()
    },
    onPanResponderMove: (evt) => {
      const isCancelArea = hasPositionWithinRange(cancelButtonPos, evt.nativeEvent.pageX, evt.nativeEvent.pageY)
      if (isOverCancel != isCancelArea) {
        if (isCancelArea) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        setIsOverCancel(isCancelArea)
      }
    },
    onPanResponderRelease: async () => {
      $store.pressRecordAt = undefined
      if (!$store.isRecording) {
        return
      }
      try {
        if (isOverCancel) {
          await cancelRecording()
        } else {
          await finishRecording()
        }
      } finally {
        setIsOverCancel(false)
        $store.isRecording = false
      }
    }
  })

  const startRecording = async () => {
    if (!sessionSnap.Token || !sessionSnap.User) {
      router.push("/login")
      return
    }
    const [hasPermission, err] = await tryCatch(grantMicrophonePermission());
    if (err) {
      return;
    }
    if (!hasPermission) {
      return;
    }

    $store.pressRecordAt = Date.now()

    setTimeout(async () => {
      if (!$store.pressRecordAt) {
        return
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      createPostStore.isRecording = true
      try {
        await audioRecorder.prepareToRecordAsync()
        audioRecorder.record()
        createPostStore.startRecordAt = Date.now()
        createPostStore.recordingTimeLeft = MAX_RECORDING_DURATION
        // Start countdown timer
        recordingTimerRef.current = setInterval(() => {
          if (createPostStore.recordingTimeLeft !== undefined) {
            createPostStore.recordingTimeLeft -= 1;

            // Trigger heavy vibration when 10 seconds left
            if (createPostStore.recordingTimeLeft === 10) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }

            // Auto-finish recording when time is up
            if (createPostStore.recordingTimeLeft <= 0) {
              finishRecording();
              if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
              }
            }
          }
        }, 1000);
      } catch (e) {
        console.error(e)
        toastError({ text: 'Start recording failed' })
        createPostStore.isRecording = false
        createPostStore.recordingTimeLeft = undefined
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      }
    }, 100)
  }

  const finishRecording = async () => {
    // Clear the timer if it's running
    setIsOverCancel(false)
    $store.isRecording = false
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (!audioRecorder) {
      toastInfo({ title: t('posts.recordingTooShort'), text: t('posts.recordingTooShortMessage') })
      return
    }
    let [, err] = await tryCatch(audioRecorder.stop())
    if (err != null) {
      console.error(err)
      toastError({ text: t('posts.saveAudioFileFailed') })
      return
    }
    const durationMilliSeconds = Date.now() - $store.startRecordAt
    if (durationMilliSeconds < 2000 || !audioRecorder.uri) {
      if (audioRecorder.uri) {
        FileSystem.deleteAsync(audioRecorder.uri)
      }
      toastInfo({ title: t('posts.recordingTooShort'), text: t('posts.recordingTooShortMessage') })
      return
    }
    const uriParts = audioRecorder.uri.split('/')
    if (uriParts.length === 0) {
      toastError({ text: t('posts.saveAudioFileFailed') })
      return
    }
    const uuidFilename = Crypto.randomUUID() + ".m4a"
    uriParts[uriParts.length - 1] = uuidFilename
    const newUri = uriParts.join("/")
    const [, moveErr] = await tryCatch(FileSystem.moveAsync({
      from: audioRecorder.uri,
      to: newUri,
    }))
    if (moveErr != null) {
      console.error(moveErr)
      toastError({ text: t('posts.saveAudioFileFailed') })
      return
    }
    startProcessRecordFile(newUri, uuidFilename, "audio/m4a", durationMilliSeconds)
  }

  const cancelRecording = async () => {
    setIsOverCancel(false)
    $store.isRecording = false
    // Clear the timer if it's running
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (!audioRecorder) {
      return
    }
    toastInfo({ text: t('posts.recordingCanceled'), duration: 1500 })
    await audioRecorder.stop()
    if (audioRecorder.uri) {
      await FileSystem.deleteAsync(audioRecorder.uri)
    }
  }

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const startProcessRecordFile = async (uri: string, filename: string, mimeType: string, duration: number) => {
    $store.transcribeTasks.push({
      id: filename,
      filename: filename,
      uri: uri,
      duration: duration,
      status: 'processing'
    })

    const formData = new FormData();
    const file = {
      uri: uri,
      type: mimeType,
      name: filename
    }
    // @ts-ignore
    formData.append("File", file);
    formData.append("Language", $store.languageCode);
    formData.append("TranscribeMode", $store.transcribingMode);
    const [resp, err] = await apiFormRequest<FormData, TranscribeVoiceToTextResponse>("/api/v1/TranscribeVoice", {
      body: formData
    })

    if (err) {
      updateTreanscribeTaskById(filename, {
        status: 'error',
        errorMessage: err.message
      })
      if (err instanceof ApiError) {
        if (err.code === "InsufficientCreditErr") {
          toastError({ text: err.message, title: err.code })
        } else {
          toastError({ text: err.message })
        }
      }
      return
    }
    let text = resp.Text
    updateTreanscribeTaskById(filename, {
      status: 'done',
    })
    text = convertZh(text, true)
    if ($store.textMode === 'override') {
      $store.textContent = text + "\n"
    } else {
      $store.textContent += text + "\n"
      if (textareaScrollRef.current) {
        textareaScrollRef.current.scrollToEnd({ animated: true })
      }
    }
  }

  const onClickGoBack = () => {
    // Check if there are any changes (text content or recordings)
    const hasChanges = $store.textContent.trim() !== '' || $store.transcribeTasks.length > 0;

    if (editMode) {
      Alert.alert(
        t('posts.quitTitle'),
        t('posts.quitMessage'),
        [
          {
            text: t('alerts.cancel'),
            style: 'cancel'
          },
          {
            text: t('alerts.quit'),
            style: 'destructive',
            onPress: () => {
              router.back();
              resetStore(true);
            }
          }
        ]
      );
    } else {
      router.back();
    }
  }

  const onClickFinish = async () => {
    let title = $store.postTitle || formatIsoToDatetime(new Date().toISOString())

    const textContent = $store.textContent.trim();
    if (isEditMode && postId) {
      // Update existing post
      const [_, err] = await tryCatch(updatePostById(Number(postId), {
        title: title,
        textContent: textContent,
        updatedAt: new Date().toISOString(),
        // Include any new audio recordings
        audios: $store.transcribeTasks.map(task => {
          return {
            uri: task.uri,
            filename: task.filename,
            duration: task.duration
          }
        })
      }))

      if (err) {
        console.error(err)
        toastError({ text: err.message, title: t('posts.updateFailed') })
        return
      }

      toastSuccess({ text: t('posts.updateOk') })
    } else {
      // Create new post
      const [_, err] = await tryCatch(createPost({
        title: title,
        textContent: textContent,
        audios: $store.transcribeTasks.map(task => {
          return {
            uri: task.uri,
            filename: task.filename,
            duration: task.duration
          }
        })
      }))

      if (err) {
        console.error(err)
        toastError({ text: err.message, title: t('posts.savePostFailed') })
        return
      }
      
      // Clear draft after successful save
      await clearDraft();
    }

    router.back()
    resetStore(true)
  }

  const onClickSave = async () => {
    // Save the content to the database and clear the draft
    await onClickFinish()
  }

  const onClickTranscribeTask = async (task: TranscribeTask) => {

    try {
      if (playingTranscribeTaskId === task.id) {
        if (playingSound) {
          await playingSound.stopAsync()
          setPlayingSound(null)
        }
        setPlayingTranscribeTaskId(null)
      } else {
        if (task.uri) {
          const audioFileInfo = await FileSystem.getInfoAsync(task.uri)
          if (!audioFileInfo.exists) {
            toastError({ text: t('posts.audioFileNotExists') })
            return
          }

          // Stop any currently playing sound
          if (playingSound) {
            await playingSound.stopAsync()
            await playingSound.unloadAsync()
          }

          // Create and load a new sound object
          const sound = new Audio.Sound()
          await sound.loadAsync({ uri: audioFileInfo.uri })

          // Set up status update handler
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingTranscribeTaskId(null)
              sound.unloadAsync()
              setPlayingSound(null)
            }
          })

          // Play the sound and update state
          await sound.playAsync()
          setPlayingSound(sound)
          setPlayingTranscribeTaskId(task.id)
        }
      }
    } catch (e) {
      setPlayingTranscribeTaskId(null)
      if (playingSound) {
        await playingSound.unloadAsync()
        setPlayingSound(null)
      }
      toastError({ text: t('posts.playAudioFailed') })
      console.error('error:', e)
    }
  }

  const onClickTranscribeMenuAction = (eventName: string, item: TranscribeTask) => {
    if (eventName === 'delete') {
      Alert.alert(t('posts.deleteTranscribeTask'), t('posts.deleteTranscribeTaskConfirm'), [
        {
          text: t('alerts.cancel'),
          style: 'cancel'
        },
        {
          text: t('alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            $store.transcribeTasks = $store.transcribeTasks.filter(t => {
              return t.id !== item.id
            })
          }
        }
      ])
    } else if (eventName === 'play/pause') {
      onClickTranscribeTask(item)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Confetti ref={confettiRef} />
      <View className="flex justify-between flex-row items-center px-4">
        <GoBackButton onClick={onClickGoBack} />

        {!$store.forbidSave && <Button onPress={onClickSave} classname="rounded-full bg-violet-500 px-4 py-2 justify-center items-center">
          <Text className="text-white text-lg font-bold">{t('posts.save')}</Text>
        </Button>}
      </View>

      <ScrollView contentContainerClassName="px-4" keyboardShouldPersistTaps='never'>
        {isEditMode && (
          <View className="mt-2 py-2 px-4 bg-blue-50 rounded-lg border border-blue-100">
            <TranslatedText className="text-blue-600 text-sm" i18nKey={"posts.editingMessage"} ></TranslatedText>
          </View>
        )}

        <TextInput className="mt-2 text-2xl font-bold" placeholder={t('posts.noteTitlePlaceholder')} value={$store.postTitle} onChangeText={e => {
          $store.postTitle = e
        }} />

        <TextInput style={{
          marginTop: 8,
          height: 260,
          fontSize: 16
        }}
          // scrollEnabled={false}
          multiline value={$store.textContent}
          placeholder={t('posts.textContentPlaceholder')}
          onChangeText={e => {
            $store.textContent = e
          }}
        />
        {/* {$store.isTranscribing && <View className="flex flex-row justify-start">
          <ActivityIndicator size={'small'} />
        </View>} */}

        <CellGroup className="px-3 mt-4">
          <CellSelect
            title={t('posts.textMode')}
            desc={t('posts.textModeDesc')}
            initValue='append'
            value={$store.textMode}
            options={textModes(t)}
            onSelect={(choice) => {
              createPostStore.textMode = choice;
              updateTextMode(choice);
            }}
          />

          <CellSelect
            title={t('posts.speakingLanguage')}
            desc={t('posts.speakingLanguageDesc')}
            value={$store.languageCode}
            options={langs}
            onSelect={(choice) => {
              createPostStore.languageCode = choice;
              updateSpeakingLanguage(choice);
            }}
          />

          <CellSelect
            title={t('posts.transcribingMode')}
            desc={t('posts.transcribingModeDesc')}
            initValue='slight'
            value={$store.transcribingMode}
            options={transcribingModes(t)}
            onSelect={(choice) => {
              createPostStore.transcribingMode = choice;
              updateTranscribingMode(choice);
            }}
          />
        </CellGroup>


        {$store.transcribeTasks.length > 0 && (
          <View className="mt-4">
            <FlashList
              ref={taskListRef}
              estimatedItemSize={100}
              horizontal
              data={$store.transcribeTasks.toReversed()}
              contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 10 }}
              keyExtractor={(item) => {
                return item.id
              }}
              ItemSeparatorComponent={() => {
                return <View className="w-4" style={{ backgroundColor: 'transparent' }} />
              }}
              renderItem={({ item }) => {
                return (
                  <MenuView
                    onPressAction={({ nativeEvent }) => {
                      onClickTranscribeMenuAction(nativeEvent.event, item)
                    }}
                    actions={transcribeTaskMenuActions}
                    shouldOpenOnLongPress={false}
                  >
                    <View
                      className="w-[90px] h-[90px] rounded shadow flex flex-col bg-black/80 justify-end relative">
                      <View className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-60%]" style={{ opacity: item.status === 'processing' ? 1.0 : 0.6 }}>
                        {
                          item.status === 'processing' ? <ActivityIndicator size={'large'} /> : item.status === 'error'
                            ? <Ionicons name='alert-circle' size={40} color="white" /> : <Ionicons name='checkmark-circle' size={40} color="white" />
                        }
                      </View>
                      <View className="flex flex-row justify-start items-center ml-1 mb-1">
                        <Ionicons name={playingTranscribeTaskId === item.id ? 'stop' : 'play'} size={16} color="white" />
                        <Text className="text-sm text-gray-300 ml-1">{formatDuration(item.duration)}</Text>
                      </View>
                    </View>
                  </MenuView>
                )
              }}
            />
          </View>
        )}

      </ScrollView>

      <KeyboardStickyView style={{ zIndex: 20 }} offset={{ closed: -32, opened: -12 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-col justify-center items-center space-x-8">
            <View>
              {$store.isRecording && (
                <Animated.View
                  ref={cancelButtonRef}
                  className="bg-red-500 w-[64px] h-[64px] rounded-full shadow-lg flex justify-center items-center z-20 mb-[32px]"
                  style={cancelButtonAnimatedStyle}
                >
                  <Ionicons name="close" size={36} color="white" />
                </Animated.View>
              )}
            </View>

            <Animated.View
              ref={recordButtonRef}
              {...panResponder.panHandlers}
              className="bg-violet-500 w-[72px] h-[72px] rounded-full shadow-lg flex justify-center items-center z-20"
              style={recordButtonAnimatedStyle}
            >
              <Ionicons name="mic" size={40} color="white" />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardStickyView>

      <KeyboardToolbar showArrows={false} />

      {
        $store.isRecording && (
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, backdropAnimatedStyle]}>
            {Array.from({ length: 8 }).map((_, index) => {
              return (
                <Ring key={index} delay={index * 500} />
              )
            })}
            <TranslatedText className="text-left text-white/70 font-bold text-3xl mb-4" i18nKey={isOverCancel ? 'posts.releaseToCancel' : 'posts.releaseToFinish'} />
            {$store.recordingTimeLeft !== undefined && $store.recordingTimeLeft <= 10 && (
              <View className="px-6 pt-4">
                <Text className="text-white font-bold text-2xl">
                  Recording will stop in {$store.recordingTimeLeft}"
                </Text>
              </View>
            )}
          </Animated.View>
        )
      }
    </SafeAreaView >
  );
}


function hasPositionWithinRange(
  renderSize: [number, number][],
  x: number,
  y: number,
  tolerance = 10
): boolean {
  if (!renderSize || renderSize.length !== 4) {
    return false
  }
  const minX = Math.min(renderSize[0][0], renderSize[1][0]);
  const maxX = Math.max(renderSize[0][0], renderSize[1][0]);
  const minY = Math.min(renderSize[0][1], renderSize[2][1]);
  const maxY = Math.max(renderSize[0][1], renderSize[2][1]);

  return x >= minX - tolerance
    && x <= maxX + tolerance
    && y >= minY - tolerance
    && y <= maxY + tolerance;
}

const Ring = ({ delay }: { delay: number }) => {
  const ring = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.4 - ring.value,
      transform: [
        {
          scale: interpolate(ring.value, [0, 1], [0, 4]),
        },
      ],
    };
  });
  useEffect(() => {
    ring.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 2500,
          easing: Easing.in(Easing.ease)
        }),
        -1,
        false
      )
    );
  }, []);
  return <Animated.View className="absolute rounded-full bg-violet-400 w-[300px] h-[300px]" style={[ringStyle]} />;
};

export default CreatePostPage;
