import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextProps, Text } from 'react-native';

export interface TranslatedTextProps extends Omit<TextProps, 'children'> {
  i18nKey: string;
  values?: Record<string, any>;
  children?: React.ReactNode;
}

export function TranslatedText({
  i18nKey,
  values,
  children,
  ...props
}: TranslatedTextProps) {
  const { t } = useTranslation();

  return (
    <Text {...props}>
      {t(i18nKey, values) || children}
    </Text>
  );
}

export default TranslatedText; 