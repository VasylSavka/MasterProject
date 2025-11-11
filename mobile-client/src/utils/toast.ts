import Toast from "react-native-toast-message";

type ToastType = "success" | "error" | "info";

const showToast = (
  type: ToastType,
  text1: string,
  text2?: string,
  params?: Partial<Parameters<typeof Toast.show>[0]>
) => {
  Toast.show({
    type,
    text1,
    text2,
    position: "bottom",
    bottomOffset: 80,
    visibilityTime: 2500,
    ...params,
  });
};

export const showSuccessToast = (title: string, message?: string) =>
  showToast("success", title, message);

export const showErrorToast = (title: string, message?: string) =>
  showToast("error", title, message);

export const showInfoToast = (title: string, message?: string) =>
  showToast("info", title, message);
