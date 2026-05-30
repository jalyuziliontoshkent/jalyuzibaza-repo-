let telegramApp = null;
let mainButtonHandler = null;

export function initTelegram() {
  telegramApp = window.Telegram?.WebApp || null;

  if (!telegramApp) {
    return {
      available: false,
      user: null,
      initData: "",
    };
  }

  telegramApp.ready();
  telegramApp.expand();

  const themeParams = telegramApp.themeParams || {};
  if (themeParams.bg_color) {
    document.documentElement.style.setProperty("--background", themeParams.bg_color);
  }
  if (themeParams.secondary_bg_color) {
    document.documentElement.style.setProperty("--card", themeParams.secondary_bg_color);
  }
  if (themeParams.text_color) {
    document.documentElement.style.setProperty("--text-primary", themeParams.text_color);
  }
  if (themeParams.hint_color) {
    document.documentElement.style.setProperty("--text-secondary", themeParams.hint_color);
  }
  if (themeParams.button_color) {
    document.documentElement.style.setProperty("--primary", themeParams.button_color);
  }

  const tgUser = telegramApp.initDataUnsafe?.user;
  const name = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ");

  return {
    available: true,
    user: tgUser
      ? {
          id: tgUser.id,
          name: name || tgUser.username || "Telegram foydalanuvchi",
          username: tgUser.username || "",
        }
      : null,
    initData: telegramApp.initData || "",
  };
}

export function haptic(type = "light") {
  const feedback = telegramApp?.HapticFeedback;
  if (!feedback) {
    return;
  }

  if (type === "success" || type === "error" || type === "warning") {
    feedback.notificationOccurred(type);
    return;
  }

  feedback.impactOccurred(type);
}

export function configureMainButton(text, onClick, visible = true) {
  const button = telegramApp?.MainButton;
  if (!button) {
    return;
  }

  if (mainButtonHandler) {
    button.offClick(mainButtonHandler);
    mainButtonHandler = null;
  }

  if (!visible) {
    button.hide();
    return;
  }

  button.setText(text);
  button.show();
  mainButtonHandler = onClick;
  button.onClick(mainButtonHandler);
}

export function setMainButtonLoading(isLoading) {
  const button = telegramApp?.MainButton;
  if (!button) {
    return;
  }

  if (isLoading) {
    button.showProgress(false);
  } else {
    button.hideProgress();
  }
}

export function getInitData() {
  return telegramApp?.initData || "";
}

export function closeTelegram() {
  telegramApp?.close();
}
