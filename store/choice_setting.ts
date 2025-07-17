import { proxy } from 'valtio'

export type ChoiceValue = string | number;

export type ChoiceOption<T extends ChoiceValue> = {
  value: T;
  name: string;
  desc?: string;
};

interface ChoiceSettingStoreProps<T extends ChoiceValue> {
  options: ChoiceOption<T>[];
  onSelect?: (value: T) => void;
  value?: T;
};

export const choiceSettingStore = proxy<ChoiceSettingStoreProps<ChoiceValue>>({
  options: [],
})

// export interface IBuildChoices<T extends ChoiceValue> {
//   options: ChoiceOption<T>[];
//   onSelect: (value: T) => void;
//   initValue?: T;
// }

export function setChoices<T extends ChoiceValue>(props: {
  options: ChoiceOption<T>[];
  onSelect: (value: T) => void;
  value?: T;
}) {
  choiceSettingStore.options = props.options;
  choiceSettingStore.onSelect = (value) => {
    props.onSelect(value as T);
  }
  choiceSettingStore.value = props.value;
}