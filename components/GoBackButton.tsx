import { useCallback } from "react";
import Button from "./ui/Button";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function GoBackButton({ onClick }: { onClick?: () => void }) {
  const router = useRouter()
  const onClickCancel = () => {
    if (onClick) {
      onClick()
      return
    }
    if (!router.canGoBack) {
      return
    }
    router.back()
  }
  return (
    <Button onPress={onClickCancel} classname="rounded-full bg-white w-[52px] h-[52px] justify-center items-center">
      <Ionicons name="chevron-back" size={22} color="black" />
    </Button>
  )
}