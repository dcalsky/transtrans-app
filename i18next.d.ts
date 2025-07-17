import EN from '@/locales/en.json';
import "i18next";
declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: typeof EN
    };
  }
}