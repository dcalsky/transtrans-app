import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert, Share, Linking, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import LanguageSelector from '@/components/LanguageSelector';
import TranslatedText from '@/components/TranslatedText';
import { CellGroup, CellItem } from '@/components/Cell';
import { useSnapshot } from 'valtio';
import { clearCurrentSession, deleteAccount, refreshUserDetail, sessionStore } from '@/store/session';
import { router, useFocusEffect } from 'expo-router';
import { presentPaywall } from '@/helpers/paywall';
import Confetti from '@/components/Confetti';
import LottieView from 'lottie-react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext()
  const sessionSnap = useSnapshot(sessionStore);
  const confettiRef = useRef<LottieView>(null)

  useFocusEffect(
    useCallback(() => {
      refreshUserDetail()
    }, [])
  );

  const handleShare = async () => {
    try {
      await Share.share({
        title: t('settings.shareTitle'),
        message: t('settings.shareMessage'),
      }, {
        dialogTitle: t('settings.shareDialogTitle'),
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(
        t('common.error'),
        t('settings.shareError')
      );
    }
  };

  const handleRateApp = () => {
    Linking.openURL('https://itunes.apple.com/us/app/id6743046682?action=write-review');
  }

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://transtrans.app/privacy-policy');
  };

  const handleUserLicense = () => {
    Linking.openURL('https://transtrans.app/user-license');
  }

  const handleLogout = () => {
    Alert.alert(t('settings.logoutAlertContent'), "", [
      {
        text: t('alerts.cancel'),
        style: 'cancel',
      },
      { text: t('alerts.confirm'), onPress: () => clearCurrentSession() },
    ]);
  }

  const handleDeleteAccount = () => {
    Alert.alert(t('settings.deleteAccountAlertTitle'), t('settings.deleteAccountAlertContent'), [
      {
        text: t('alerts.cancel'),
        style: 'cancel',
      },
      { text: t('alerts.confirm'), onPress: () => deleteAccount(db) },
    ]);
  }

  const handleUnlockPro = async () => {
    await presentPaywall(async () => {
      await refreshUserDetail()
      if (sessionStore.User?.SubscriptionInfo.Subscribed && confettiRef && confettiRef.current) {
        confettiRef.current.play()
      }
    })
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Confetti ref={confettiRef} />
      <View style={styles.header}>
        <TranslatedText i18nKey="settings.title" className='text-3xl font-semibold' />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>


        <View style={styles.section} >
          <CellGroup className='px-2'>
            {!sessionSnap.User?.SubscriptionInfo.Subscribed && (
              <CellItem
                title={t('settings.unlockPro')}
                desc={t('settings.unlockProDesc')}
                leftIcon={<Ionicons name="diamond-outline" size={20} color="#1967d2" />}
                onClick={handleUnlockPro}
                isLink
              />
            )}
            {sessionSnap.User ?
              <CellItem
                title={t('settings.remainCredit')}
                leftIcon={<Ionicons name="card" size={20} />}
                desc={sessionSnap.User.SubscriptionInfo.Subscribed ? t('posts.unlimiteCreditText') : t('posts.creditRefreshText')}
                value={<Text className='font-semibold text-xl mr-2 text-amber-500'>{sessionSnap.User.SubscriptionInfo.Subscribed ? '∞' : sessionSnap.User?.Credit}</Text>}
              />
              :
              <CellItem
                title={t('settings.login')}
                titleStyle={{ fontWeight: 600 }}
                leftIcon={<Ionicons name="person-circle-outline" size={20} />}
                onClick={() => { router.push("/login") }}
              />
            }
          </CellGroup>
        </View>


        <View style={styles.section}>
          <CellGroup className='px-2'>
            <LanguageSelector />
          </CellGroup>
        </View>

        <View style={styles.section}>
          <CellGroup className='px-2'>
            <CellItem
              title={t('settings.rate')}
              leftIcon={<Ionicons name="star-outline" size={20} />}
              onClick={handleRateApp}
              isLink
            />
            <CellItem
              title={t('settings.share')}
              leftIcon={<Ionicons name="share-outline" size={20} />}
              onClick={handleShare}
              isLink
            />
          </CellGroup>
        </View>

        <View style={styles.section}>
          <CellGroup className='px-2'>
            <CellItem
              title={t('settings.privacyPolicy')}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={20} />}
              onClick={handlePrivacyPolicy}
              isLink
            />

            <CellItem
              title={t('settings.userLicense')}
              leftIcon={<Ionicons name="book-outline" size={20} />}
              onClick={handleUserLicense}
              isLink
            />
          </CellGroup>
        </View>

        {sessionSnap.User &&
          <View style={styles.section}>
            <CellGroup className='px-2'>
              <CellItem
                title={t('settings.deleteAccount')}
                titleStyle={{ color: "#EF5350" }}
                leftIcon={<Ionicons name="trash-outline" size={20} color={"#EF5350"} />}
                onClick={handleDeleteAccount}
              />
              <CellItem
                title={t('settings.logout')}
                leftIcon={<Ionicons name="log-out-outline" size={20} />}
                onClick={handleLogout}
              />
            </CellGroup>
          </View>
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
  },
  profileSection: {
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
}); 