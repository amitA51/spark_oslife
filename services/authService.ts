import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    User,
    AuthError
} from 'firebase/auth';
import { auth } from '../config/firebase';

// --- Auth Actions ---

/**
 * הרשמה עם אימייל וסיסמה
 */
export const signUp = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * התחברות עם אימייל וסיסמה
 */
export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * התחברות עם גוגל
 */
export const signInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * התנתקות
 */
export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * איפוס סיסמה
 */
export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * עדכון פרופיל משתמש
 */
export const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName,
                photoURL
            });
        }
    } catch (error: any) {
        throw new Error(getErrorMessage(error));
    }
};

/**
 * האזנה לשינויים במצב האימות
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * קבלת המשתמש הנוכחי
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

// --- Error Handling ---

const getErrorMessage = (error: AuthError) => {
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
        default:
            console.error('Auth Error:', error);
            return 'אירעה שגיאה בהתחברות. נסה שוב.';
    }
};
