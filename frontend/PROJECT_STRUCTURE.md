# Shopping Assistant React Architecture

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.module.css
│   │   │   └── index.ts
│   │   ├── LoadingSpinner/
│   │   ├── ErrorBoundary/
│   │   └── Modal/
│   ├── chat/
│   │   ├── ChatInterface/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatInterface.module.css
│   │   │   └── index.ts
│   │   ├── ChatHeader/
│   │   ├── ChatMessages/
│   │   │   ├── ChatMessages.tsx
│   │   │   ├── MessageBubble/
│   │   │   └── index.ts
│   │   ├── ChatInput/
│   │   └── TypingIndicator/
│   ├── cart/
│   │   ├── CartSidebar/
│   │   │   ├── CartSidebar.tsx
│   │   │   ├── CartSidebar.module.css
│   │   │   └── index.ts
│   │   ├── CartHeader/
│   │   ├── CartItems/
│   │   │   ├── CartItems.tsx
│   │   │   ├── CartItem/
│   │   │   └── index.ts
│   │   ├── CartSummary/
│   │   └── EmptyCart/
│   ├── panels/
│   │   ├── DynamicPanel/
│   │   │   ├── DynamicPanel.tsx
│   │   │   ├── DynamicPanel.module.css
│   │   │   └── index.ts
│   │   ├── PanelContainer/
│   │   ├── CoupangEmbedPanel/
│   │   ├── StatisticsPanel/
│   │   ├── ProductGridPanel/
│   │   └── PanelTransition/
│   ├── layout/
│   │   ├── MainLayout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── MainLayout.module.css
│   │   │   └── index.ts
│   │   ├── Header/
│   │   └── Navigation/
│   └── auth/
│       ├── LoginPage/
│       ├── LoginForm/
│       └── ProtectedRoute/
├── contexts/
│   ├── AuthContext.tsx
│   ├── ChatContext.tsx
│   ├── CartContext.tsx
│   ├── PanelContext.tsx
│   └── AppProvider.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useCart.ts
│   ├── usePanel.ts
│   ├── useApi.ts
│   ├── useLocalStorage.ts
│   └── useWindowSize.ts
├── types/
│   ├── auth.ts
│   ├── chat.ts
│   ├── cart.ts
│   ├── panel.ts
│   ├── api.ts
│   └── index.ts
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── cart.ts
│   │   └── panel.ts
│   └── storage/
│       ├── localStorage.ts
│       └── sessionStorage.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   ├── validators.ts
│   └── formatters.ts
├── styles/
│   ├── globals.css
│   ├── variables.css
│   ├── breakpoints.css
│   ├── animations.css
│   └── themes/
│       ├── light.css
│       └── dark.css
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── App.tsx
├── App.css
├── index.tsx
└── index.css
```

## Component Architecture Principles

### 1. Atomic Design Structure
- **Common**: Reusable atomic components (Button, Input, etc.)
- **Feature Components**: Domain-specific components organized by feature
- **Layout Components**: Structural components for page organization

### 2. Co-location Pattern
Each component folder contains:
- Component file (.tsx)
- Styles (.module.css)
- Index file for clean imports
- Sub-components when needed

### 3. Context-Driven State Management
- Separate contexts for different domains
- Custom hooks for context consumption
- Provider composition in AppProvider

### 4. Type Safety
- Comprehensive TypeScript interfaces
- Strict typing for props and state
- API response type definitions

### 5. Performance Optimization
- Component lazy loading where appropriate
- Memoization for expensive computations
- Efficient re-rendering patterns