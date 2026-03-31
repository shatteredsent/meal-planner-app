import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { getAuth } from 'firebase/auth';

// The redirect URI must exactly match what's registered in the Amazon
// Security Profile AND the Alexa skill account linking config.
const REDIRECT_URI = 'https://family-meal-planner-b1421.web.app';

// Using "profile" scope gives us access to the user's Amazon profile
// (name, email, userId) which is required for Alexa account linking.
const ALEXA_AUTH_SCOPE = 'profile';

// Your Amazon Security Profile client ID.
// Retrieve from Firebase secrets or your Amazon Developer Console.
const AMAZON_CLIENT_ID = 'amzn1.application-oa2-client.baf5889493f94affa60edbe7d20b2d6c';

// Amazon's OAuth 2.0 authorization endpoint.
const AMAZON_AUTH_URL = 'https://www.amazon.com/ap/oa';

interface AlexaLinkState {
  isLinking: boolean;
  isLinked: boolean;
  errorMessage: string | null;
}

interface UseAlexaLinkReturn {
  isLinking: boolean;
  isLinked: boolean;
  errorMessage: string | null;
  startAlexaLink: () => Promise<void>;
  handleAlexaCallback: (code: string) => Promise<void>;
}

/**
 * Manages the full Alexa account linking OAuth flow:
 * opens the Amazon auth page, then exchanges the returned code for tokens
 * via the exchangeAlexaToken Cloud Function.
 */
export function useAlexaLink(): UseAlexaLinkReturn {
  const [linkState, setLinkState] = useState<AlexaLinkState>({
    isLinking: false,
    isLinked: false,
    errorMessage: null,
  });

  const buildAuthUrl = (): string => {
    // Generate a random state value to prevent CSRF attacks.
    // We store this in memory — good enough for now; persist to AsyncStorage
    // in a later sprint if you want to validate it on callback.
    const stateParam = Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
      client_id: AMAZON_CLIENT_ID,
      scope: ALEXA_AUTH_SCOPE,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      state: stateParam,
    });

    return `${AMAZON_AUTH_URL}?${params.toString()}`;
  };

  const startAlexaLink = useCallback(async (): Promise<void> => {
    setLinkState({ isLinking: true, isLinked: false, errorMessage: null });

    try {
      const authUrl = buildAuthUrl();

      // Open Amazon's login page in the system browser.
      // The user logs in, Amazon redirects to REDIRECT_URI with ?code=...
      // The Firebase Hosting redirect page then deep links back to the app.
      console.log('[Alexa] auth URL:', authUrl);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'familymealplanner://alexa-callback');
      console.log('[Alexa] broswer result:', JSON.stringify(result));

      if (result.type === 'success' && result.url) {
        // Extract the code directly from the returned URL
        const parsed = new URL(result.url);
        const code = parsed.searchParams.get('code');
        if (code) {
            await handleAlexaCallback(code);
        } else {
            setLinkState({ isLinking: false, isLinked: false, errorMessage: 'No code returned' });
        }
      } else {
        setLinkState({ isLinking: false, isLinked: false, errorMessage: null });
      }
      

      // The actual success path is handled by handleAlexaCallback,
      // which is called when the deep link fires in the app.
    } catch (error: any) {
      console.log('[Alexa] full error:', JSON.stringify(error));
      console.log('[Alexa] error code:', error?.code);
      console.log('[Alexa] error message:', error?.message);
      console.log('[Alexa] error details:', error?.details);  
      Alert.alert('Alexa Link Error', 'Could not open the Amazon login page. Please try again.');
      setLinkState({
        isLinking: false,
        isLinked: false,
        errorMessage: error.message ?? 'Unknown error',
      });
    }
  }, []);

  const handleAlexaCallback = useCallback(async (code: string): Promise<void> => {
    console.log('[Alexa] call received, code:', code);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    console.log('[Alexa] current user:', currentUser?.uid ?? 'null');

    if (!currentUser) {
      Alert.alert('Error', 'You must be signed in to link Alexa.');
      setLinkState({ isLinking: false, isLinked: false, errorMessage: 'Not authenticated' });
      return;
    }

    if (!code) {
      Alert.alert('Error', 'No authorization code received from Amazon.');
      setLinkState({ isLinking: false, isLinked: false, errorMessage: 'Missing auth code' });
      return;
    }

    setLinkState((prev) => ({ ...prev, isLinking: true }));

    try {
      console.log('[Alexa] calling exchangeAlexaToken...');
      const exchangeAlexaToken = httpsCallable(functions, 'exchangeAlexaToken');

      await exchangeAlexaToken({ code, redirectUri: REDIRECT_URI, userId: currentUser.uid });
      console.log('[Alexa] token exchange success'); 

      setLinkState({ isLinking: false, isLinked: true, errorMessage: null });
      Alert.alert('Success', 'Your Alexa account has been linked!');
    } catch (error: any) {
      console.log('[Alexa} token exchange error:', error.message);  
      Alert.alert(
        'Alexa Link Failed',
        'Could not complete Alexa linking. Please try again.'
      );
      setLinkState({
        isLinking: false,
        isLinked: false,
        errorMessage: error.message ?? 'Token exchange failed',
      });
    }
  }, []);

  return {
    isLinking: linkState.isLinking,
    isLinked: linkState.isLinked,
    errorMessage: linkState.errorMessage,
    startAlexaLink,
    handleAlexaCallback,
  };
}