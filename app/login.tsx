import { Text, View, Button, Linking, ActivityIndicator } from 'react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createSession, sessionStore } from '@/store/session';
import { toastError, toastInfo, toastSuccess } from '@/helpers/toast';
import { Link, useRouter } from 'expo-router';
import TypeWriterText from '@/components/TypeWriter';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import TranslatedText from '@/components/TranslatedText';
import { AppleSignInRequest, LoginResponse } from '@/models/dto/login';
import { apiRequest } from '@/helpers/api';

const seqs = [
  "late",
  "cribe",
  "form"
]

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loginLoading, setLoginLoading] = useState(false);

  const handleSignInWithApple = async () => {
    try {
      setLoginLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        toastError({ text: t('login.loginFailed') });
        return;
      }

      const familyName = credential.fullName?.familyName || '';
      const givenName = credential.fullName?.givenName || '';
      const fullName = [givenName, familyName].filter(Boolean).join(' ');

      // Make API request to transtrans server
      const loginRequest: AppleSignInRequest = {
        IdentityToken: credential.identityToken,
        Email: credential.email || '',
        FullName: fullName,
      };

      const [loginResponse, loginError] = await apiRequest<AppleSignInRequest, LoginResponse>('/api/v1/AppleSignIn', {
        method: 'POST',
        body: loginRequest,
      });

      setLoginLoading(false);
      if (loginError) {
        throw loginError;
      }
      // Store session data with token
      createSession(loginResponse.Account, loginResponse.Token);
      toastSuccess({ text: t('login.loginSuccess'), duration: 1500 });
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        toastInfo({ text: t('login.loginCanceled') });
      } else {
        toastError({ text: t('login.loginFailed') });
        // handle other errors
        console.error(e);
      }
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className='px-4 flex-col gap-2 top-[150px]'>
        <View className='flex-2'>
          <View className='flex flex-row'>
            <Text className='font-bold text-[46px]'>Trans</Text>
            <View className='bg-violet-300 rounded'>
              <TypeWriterText classname='font-bold text-[46px] px-2' textArray={seqs} loop></TypeWriterText>
            </View>
          </View>
          <View className='mt-2'>
            <TranslatedText i18nKey="login.transYourThoughts" className='font-bold text-[46px]' />
          </View>
        </View>


        <View className='flex flex-col items-center gap-2 mt-[200px]'>
          {loginLoading ?
            <ActivityIndicator size="large" /> :
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={{ width: '100%', height: 40 }}
              onPress={handleSignInWithApple}
            />
          }
          <View className='flex flex-row'>
            <TranslatedText i18nKey="login.termsAgreement" className='text-sm' />
            <Link className='text-blue-500 underline text-sm' href="https://transtrans.app/privacy-policy">
              <TranslatedText i18nKey="login.privacyPolicy" />
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}



