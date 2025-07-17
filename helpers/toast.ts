import { Notifier, NotifierComponents } from 'react-native-notifier';

interface ToastParams {
  text: string;
  title?: string;
  duration?: number;
}

export const toastSuccess = ({ text, title, duration = 1500 }: ToastParams) => {
  Notifier.showNotification({
    title: title,
    description: text,
    duration: duration,
    showAnimationDuration: 300,
    hideOnPress: true,
    Component: NotifierComponents.Alert,
    componentProps: {
      alertType: 'success',
    },
  });
};

export const toastError = ({ text, title, duration = 3000 }: ToastParams) => {
  Notifier.showNotification({
    title: title,
    description: text,
    duration: duration,
    showAnimationDuration: 300,
    hideOnPress: true,
    Component: NotifierComponents.Alert,
    componentProps: {
      alertType: 'error',
    },
  });
};

export const toastInfo = ({ text, title, duration = 1500 }: ToastParams) => {
  Notifier.showNotification({
    title: title,
    description: text,
    duration: duration,
    showAnimationDuration: 300,
    hideOnPress: true,
    Component: NotifierComponents.Alert,
    componentProps: {
      alertType: 'info',
    },
  });
};

export const toastWarning = ({ text, title, duration = 2500 }: ToastParams) => {
  Notifier.showNotification({
    title: title,
    description: text,
    duration: duration,
    showAnimationDuration: 300,
    hideOnPress: true,
    Component: NotifierComponents.Alert,
    componentProps: {
      alertType: 'warn',
    },
  });
};