import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { toastError } from "./toast";



export async function presentPaywall(onSuccess: () => void, times = 0): Promise<void> {
    if (times >= 3) {
        return
    }
    const paywallRes = await RevenueCatUI.presentPaywall();
    if (paywallRes === PAYWALL_RESULT.NOT_PRESENTED) {
        presentPaywall(onSuccess, times + 1)
    } else if (paywallRes === PAYWALL_RESULT.PURCHASED || paywallRes === PAYWALL_RESULT.RESTORED) {
        onSuccess();
    } else if (paywallRes === PAYWALL_RESULT.ERROR) {
        toastError({ title: "Subscription Failed", text: "Please retry it again" });
    }
}