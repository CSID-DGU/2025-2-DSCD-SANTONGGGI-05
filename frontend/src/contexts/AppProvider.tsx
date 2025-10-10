import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ChatProvider } from './ChatContext';
import { CartProvider } from './CartContext';
import { PanelProvider } from './PanelContext';
import { NavigationProvider } from './NavigationContext';
import { ModalProvider } from './ModalContext';
import { ProductDetailModal } from '../components/modals/ProductDetailModal';

// Main app provider that combines all context providers
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <NavigationProvider>
        <CartProvider>
          <PanelProvider>
            <ModalProvider>
              <ChatProvider>
                {children}
                {/* Product Detail Modal - Rendered globally */}
                <ProductDetailModal />
              </ChatProvider>
            </ModalProvider>
          </PanelProvider>
        </CartProvider>
      </NavigationProvider>
    </AuthProvider>
  );
};

// Export all context hooks for easy import
export { useAuth } from './AuthContext';
export { useChat } from './ChatContext';
export { useCart } from './CartContext';
export { usePanel } from './PanelContext';
export { useNavigation } from './NavigationContext';
export { useModal } from './ModalContext';