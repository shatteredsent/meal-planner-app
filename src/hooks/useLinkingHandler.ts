import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// The deep link path the Firebase Hosting redirect page sends the user back to.
// Full URL looks like: familymealplanner://alexa-callback?code=AUTH_CODE_HERE
const ALEXA_CALLBACK_PATH = 'alexa-callback';

interface UseLinkingHandlerProps {
  onAlexaCode: (code: string) => Promise<void>;
}

/**
 * Listens for incoming deep links and routes the Alexa OAuth callback code
 * to the provided handler. Call this once in your root navigator or App.tsx.
 */
export function useLinkingHandler({ onAlexaCode }: UseLinkingHandlerProps): void {
  useEffect(() => {
    const handleIncomingUrl = async (url: string): Promise<void> => {
      const parsed = Linking.parse(url);

      // Only handle the alexa-callback path — ignore all other deep links.
      if (parsed.path !== ALEXA_CALLBACK_PATH) return;

      const code = parsed.queryParams?.code;

      if (typeof code !== 'string' || !code) {
        console.warn('[useLinkingHandler] Alexa callback received but no code param found.');
        return;
      }

      // Dismiss the browser before calling the handler so the UI is responsive.
      await WebBrowser.dismissBrowser();

      await onAlexaCode(code);
    };

    // Handle the case where the app was launched from a cold start via deep link.
    const handleInitialUrl = async (): Promise<void> => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleIncomingUrl(initialUrl);
      }
    };

    handleInitialUrl();

    // Handle deep links when the app is already open in the foreground/background.
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [onAlexaCode]);
}