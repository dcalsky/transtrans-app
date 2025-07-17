import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio';
import { CellSelect } from './Cell';
import { changeLanguage, getAvailableLanguages } from '@/helpers/i18n';
import { settingsStore } from '@/store/settings';
import { Ionicons } from '@expo/vector-icons';
import { ChoiceOption } from '@/store/choice_setting';

const languageMap: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語'
};

export default function LanguageSelector() {
  const { t } = useTranslation();
  const settings = useSnapshot(settingsStore);
  const currentLanguage = settings.language

  const languageOptions: ChoiceOption<string>[] = useMemo(() => {
    return getAvailableLanguages().map(code => ({
      name: languageMap[code] || code,
      label: languageMap[code] || code,
      value: code,
    }));
  }, []);

  const handleLanguageChange = useCallback((value: string) => {
    changeLanguage(value);
  }, []);

  return (
    <View style={styles.container}>
      <CellSelect
        title={t('common.language')}
        leftIcon={<Ionicons name="language" size={20} />}
        options={languageOptions}
        value={currentLanguage}
        onSelect={handleLanguageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
}); 