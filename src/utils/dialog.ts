/**
 * Cross-platform notices and confirmations.
 *
 * react-native-web ships `Alert` as a stub — literally `static alert() {}` — so
 * every `Alert.alert` call is a silent no-op in a browser. Left unaddressed that
 * makes Clear, Delete recipe, Start the week over and Sign out appear broken on
 * web, and hides every error message.
 *
 * These two helpers are the only way the app should raise a notice or a confirm.
 */
import { Alert, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/** A one-way message: an error, or "nothing to copy". */
export function notify(title: string, message?: string): void {
  if (isWeb) {
    // window.alert has no title, so fold it into the body.
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

interface ConfirmOptions {
  title: string;
  message: string;
  /** Label for the affirmative action. Also used as the native button text. */
  confirmLabel: string;
  /** Renders the native button in red. No effect on web. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Asks before doing something irreversible, then runs `onConfirm` if accepted.
 *
 * The prototype cleared meals immediately; the shipped app confirms first, and
 * this keeps that behaviour on both platforms.
 */
export function confirm({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmOptions): void {
  if (isWeb) {
    // window.confirm is synchronous and blocking, which is fine here — these
    // are deliberate, low-frequency actions.
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
