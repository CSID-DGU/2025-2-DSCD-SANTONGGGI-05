import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AuthState, AuthContextValue, User, LoginCredentials, RegisterData, UserPreferences, AuthResponse } from '../types/auth';
import { authApi } from '../services/api/auth';
import { storageService } from '../services/storage/localStorage';

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authError: null,
};

// Action types
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: any } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; tokens: any } }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: any }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_AUTH_ERROR'; payload: string | null };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, isLoading: true, error: null, authError: null };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authError: null,
      };

    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        authError: action.payload,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: action.payload,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        authError: null,
      };

    case 'SET_AUTH_ERROR':
      return {
        ...state,
        authError: action.payload,
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state (simplified for demo)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // For demo purposes, just set loading to false and no user
        setTimeout(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        }, 100);
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Actions
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authApi.login(credentials);
      const { user, tokens } = response.data;

      // Store in localStorage if rememberMe is true
      if (credentials.rememberMe) {
        storageService.setUser(user);
        storageService.setTokens(tokens);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens }
      });
      return { success: true };
    } catch (error: any) {
      const message = error?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      dispatch({ type: 'SET_AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;

      storageService.setUser(user);
      storageService.setTokens(tokens);

      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user, tokens }
      });
      return { success: true };
    } catch (error: any) {
      const message = error?.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: message });
      dispatch({ type: 'SET_AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const logout = () => {
    storageService.clearAuth();
    dispatch({ type: 'LOGOUT' });
  };

  const initialize = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const clearAuthError = useCallback(() => {
    dispatch({ type: 'SET_AUTH_ERROR', payload: null });
  }, []);

  const contextValue: AuthContextValue = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    initialize,
    clearAuthError,
  }), [
    state.user,
    state.tokens,
    state.isAuthenticated,
    state.isLoading,
    state.error,
    state.authError,
    initialize,
    clearAuthError,
    // Intentionally excluding login, register, logout to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
