import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth Provider
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

// In-memory token store (highly secure, non-persistent across browser reloads)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state observer
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // If we have an active user session, we can check if we already have the token.
      // If the token is missing (e.g. page refreshed), the user will need to call googleSignIn() again
      // to obtain a fresh access token from signInWithPopup.
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Token was cleared from memory (e.g., page refresh)
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("Failed to extract Google access token from sign-in.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Firebase Sign In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get the active access token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Set token manually (e.g. if loaded during direct sign-in handler)
export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
};

// Sign out
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
