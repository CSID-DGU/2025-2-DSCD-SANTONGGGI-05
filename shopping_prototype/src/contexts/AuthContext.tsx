import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextValue, User, LoginCredentials, RegisterData, UserPreferences } from '../types/auth';
import { authApi } from '../services/api/auth';
import { storageService } from '../services/storage/localStorage';

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
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
  | { type: 'CLEAR_ERROR' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, isLoading: true, error: null };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
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
  const login = async (credentials: LoginCredentials) => {
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
    } catch (error: any) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Login failed'
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
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
    } catch (error: any) {
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: error.message || 'Registration failed'
      });
      throw error;
    }
  };

  const logout = () => {
    storageService.clearAuth();
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    if (!state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const newTokens = await authApi.refreshToken(state.tokens.refreshToken);
      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: newTokens
      });
      storageService.setTokens(newTokens);
    } catch (error) {
      logout();
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    try {
      const response = await authApi.updateProfile(updates);
      const updatedUser = response.data;

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser
      });

      storageService.setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    try {
      const response = await authApi.updatePreferences(preferences);
      const updatedUser = response.data;

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser
      });

      storageService.setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.message || 'Preferences update failed');
    }
  };

  const initialize = () => {
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    updatePreferences,
    initialize,
  };

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