import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { getAuthInstance } from '../config/firebase';

/**
 * Detect if running in standalone PWA mode or mobile
 */
const isPWAorMobile = (): boolean => {
  // Check if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return isStandalone || isMobile;
};

// --- Auth Actions ---

/**
 * הרשמה עם אימייל וסיסמה
 */
export const signUp = async (email: string, password: string) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error as AuthError));
  }
};

/**
 * התחברות עם אימייל וסיסמה
 */
export const signIn = async (email: string, password: string) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error as AuthError));
  }
};

/**
 * התחברות עם גוגל
 * 
 * IMPORTANT: Chrome M115+ (June 2024) blocks third-party storage access,
 * breaking signInWithRedirect in PWA/mobile contexts.
 * 
 * Solution: Use signInWithPopup for mobile/PWA (works around the issue),
 * and signInWithRedirect for desktop (more seamless UX).
 */
export const signInWithGoogle = async (additionalScopes: string[] = []): Promise<User | null> => {
  try {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();

    // Default scopes for Calendar and Drive integration
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.file',
      ...additionalScopes,
    ];

    scopes.forEach(scope => provider.addScope(scope));

    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    // Use popup for mobile/PWA (redirect doesn't work due to third-party storage blocking)
    if (isPWAorMobile()) {
      console.log('[Auth] Starting Google sign-in with POPUP (mobile/PWA mode)...');
      try {
        const result = await signInWithPopup(auth, provider);
        if (result?.user) {
          console.log('[Auth] Popup sign-in successful:', result.user.email);
          return handleGoogleAuthResult(result);
        }
        return null;
      } catch (popupError: any) {
        // If popup is blocked, fall back to redirect as last resort
        if (popupError?.code === 'auth/popup-blocked') {
          console.warn('[Auth] Popup blocked, falling back to redirect...');
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw popupError;
      }
    } else {
      // Desktop: use redirect for seamless experience
      console.log('[Auth] Starting Google sign-in with REDIRECT (desktop mode)...');

      // Store flag that we initiated auth
      try {
        sessionStorage.setItem('google_auth_pending', 'true');
      } catch { /* ignore storage errors */ }

      await signInWithRedirect(auth, provider);
      // This will redirect away, function won't return normally
      return null;
    }
  } catch (error) {
    console.error('[Auth] Google sign-in error:', error);
    throw new Error(getErrorMessage(error as AuthError));
  }
};

/**
 * Check for redirect result on page load (for mobile auth flow)
 * This should be called once on app init to handle the redirect flow completion
 */
export const checkGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const auth = getAuthInstance();
    const result = await getRedirectResult(auth);

    // Clean up pending flag if exists
    try {
      sessionStorage.removeItem('google_auth_pending');
    } catch { /* ignore */ }

    if (result && result.user) {
      console.log('Google redirect result found, user:', result.user.email);
      return handleGoogleAuthResult(result);
    }

    return null;
  } catch (error: any) {
    console.error('Google redirect result error:', error);
    try {
      sessionStorage.removeItem('google_auth_pending');
    } catch { /* ignore */ }

    // Don't throw for redirect errors - just return null
    // Common error: popup_closed_by_user when user cancels
    if (error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request') {
      return null;
    }

    return null;
  }
};

/**
 * Handle the Google auth result and store access token
 */
const handleGoogleAuthResult = (result: import('firebase/auth').UserCredential): User => {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (accessToken) {
    try {
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_access_token_expiry', String(Date.now() + 3600000));
    } catch (storageError) {
      console.warn('Could not store Google access token:', storageError);
    }
  }

  return result.user;
};

/**
 * Token retrieval result with reason for failure
 */
export interface GoogleTokenResult {
  token: string | null;
  reason?: 'expired' | 'not_found' | 'storage_error';
}

/**
 * Get the stored Google access token for API calls
 * Returns structured result with reason for better error handling
 */
export const getGoogleAccessToken = (): string | null => {
  try {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_access_token_expiry');

    // Check if token is expired
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }

    // Token expired or not found, clear it
    if (token) {
      clearGoogleAccessToken();
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Get detailed token status for better UX messaging
 */
export const getGoogleAccessTokenWithReason = (): GoogleTokenResult => {
  try {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_access_token_expiry');

    if (!token) {
      return { token: null, reason: 'not_found' };
    }

    if (!expiry || Date.now() >= parseInt(expiry, 10)) {
      clearGoogleAccessToken();
      return { token: null, reason: 'expired' };
    }

    return { token };
  } catch {
    return { token: null, reason: 'storage_error' };
  }
};


/**
 * Check if we have a valid Google access token
 */
export const hasGoogleApiAccess = (): boolean => {
  return !!getGoogleAccessToken();
};

/**
 * Clear Google access token (on logout)
 */
export const clearGoogleAccessToken = (): void => {
  try {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_access_token_expiry');
  } catch {
    // Ignore storage errors
  }
};

/**
 * התנתקות
 */
export const logout = async () => {
  try {
    const auth = getAuthInstance();
    clearGoogleAccessToken(); // Clear Google API token on logout
    await signOut(auth);
  } catch (error) {
    throw new Error(getErrorMessage(error as AuthError));
  }
};

/**
 * איפוס סיסמה
 */
export const resetPassword = async (email: string) => {
  try {
    const auth = getAuthInstance();
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getErrorMessage(error as AuthError));
  }
};

/**
 * עדכון פרופיל משתמש
 */
export const updateUserProfile = async (displayName: string, photoURL?: string) => {
  try {
    const auth = getAuthInstance();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });
    }
  } catch (error) {
    throw new Error(getErrorMessage(error as AuthError));
  }
};

/**
 * האזנה לשינויים במצב האימות
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, callback);
};

/**
 * קבלת המשתמש הנוכחי
 */
export const getCurrentUser = (): User | null => {
  const auth = getAuthInstance();
  return auth.currentUser;
};

// --- Error Handling ---

const getErrorMessage = (error: AuthError) => {
  // Log detailed error info for debugging
  console.error('Auth Error Details:', {
    code: error.code,
    message: error.message,
    fullError: error,
  });

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'כתובת האימייל הזו כבר בשימוש.';
    case 'auth/invalid-email':
      return 'כתובת האימייל אינה תקינה.';
    case 'auth/weak-password':
      return 'הסיסמה חלשה מדי. יש להשתמש ב-6 תווים לפחות.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'אימייל או סיסמה שגויים.';
    case 'auth/popup-closed-by-user':
      return 'ההתחברות בוטלה על ידי המשתמש.';
    case 'auth/too-many-requests':
      return 'יותר מדי ניסיונות התחברות נכשלים. נסה שוב מאוחר יותר.';
    case 'auth/unauthorized-domain':
      return 'הדומיין הזה אינו מאושר להתחברות. יש להוסיף אותו בהגדרות Firebase.';
    case 'auth/operation-not-allowed':
      return 'התחברות עם Google אינה מופעלת. יש להפעיל אותה ב-Firebase Console.';
    case 'auth/account-exists-with-different-credential':
      return 'קיים חשבון עם אימייל זהה. נסה להתחבר בדרך אחרת.';
    case 'auth/popup-blocked':
      return 'הדפדפן חסם את חלון ההתחברות. אנא אפשר חלונות קופצים ונסה שוב.';
    case 'auth/cancelled-popup-request':
      return 'בקשת ההתחברות בוטלה.';
    case 'auth/network-request-failed':
      return 'שגיאת רשת. בדוק את החיבור לאינטרנט.';
    default:
      return `אירעה שגיאה בהתחברות: ${error.code || 'לא ידוע'}`;
  }
};
