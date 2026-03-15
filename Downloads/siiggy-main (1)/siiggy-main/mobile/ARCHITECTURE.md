# SIIGGY Mobile - Modular Architecture Guide

## 📁 Project Structure

```
src/
├── api/                    # API Layer - Organized by resources
│   ├── client.ts          # Axios instance with auth
│   ├── resources/         # API resource modules
│   │   ├── auth.api.ts
│   │   ├── signals.api.ts
│   │   ├── contexts.api.ts
│   │   └── subscriptions.api.ts
│   └── index.ts
│
├── features/              # Feature Modules - Domain-driven organization
│   ├── feed/             # Feed feature
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Feature-specific hooks
│   │   ├── screens/      # Feature screens
│   │   └── index.ts
│   ├── subscriptions/    # Subscriptions feature
│   ├── auth/             # Authentication feature
│   ├── post-signal/      # Post signal feature
│   └── profile/          # Profile feature
│
├── shared/               # Shared/Common Code
│   ├── components/       # Reusable UI components
│   │   └── ui/          # Base UI components
│   ├── hooks/           # Reusable custom hooks
│   └── utils/           # Utility functions
│
├── constants/            # App-wide constants
├── navigation/           # Navigation configuration
├── store/               # Global state management (Zustand)
├── theme/               # Theme configuration
└── types/               # TypeScript types

```

## 🎯 Design Principles

### 1. **Separation of Concerns**
- API calls in `/api` layer
- Business logic in custom hooks
- UI components are presentational
- Features are self-contained modules

### 2. **Feature-Based Organization**
Each feature folder contains everything related to that feature:
- Components used only in that feature
- Feature-specific hooks
- Feature screens

### 3. **Shared Resources**
Reusable code lives in `/shared`:
- UI components (buttons, badges, etc.)
- Custom hooks (useLocation, useFeed, etc.)
- Utility functions (formatDistance, etc.)

### 4. **Dependency Direction**
```
Features → Shared → API/Constants
         ↓
     Navigation
```

## 📦 Module Breakdown

### API Layer (`/api`)
Organized by backend resources:

```typescript
import { authApi, signalsApi } from '@/api';

// Clean, focused API calls
const response = await signalsApi.getFeed(lat, lng);
const user = await authApi.getUser();
```

**Benefits:**
- Easy to find API calls
- Type-safe request/response
- Centralized error handling
- Easy to mock for testing

###  Features (`/features`)

Feature modules are **self-contained** and follow this pattern:

```
feature/
├── components/     # Feature-specific UI
├── hooks/          # Feature business logic
├── screens/        # Feature screens
└── index.ts        # Public API
```

**Example - Feed Feature:**
```typescript
// In features/feed/index.ts
export { FeedScreen } from './screens/FeedScreen';
export { FullScreenSignalCard } from './components/FullScreenSignalCard';

// Usage in navigation
import { FeedScreen } from '@/features/feed';
```

### Shared (`/shared`)

**Components** (`/shared/components/ui`)
Reusable presentational components:
- `ActionButton` - Icon button with label
- `VendorAvatar` - Avatar with verification badge
- `Badge` - Context/price/status badges
- `LoadingState` - Loading indicator
- `EmptyState` - Empty list state

**Hooks** (`/shared/hooks`)
Reusable business logic:
- `useLocation()` - Location permissions & tracking
- `useFeed()` - Feed data management
- `useSavedSignals()` - Bookmark management
- `useSignalViewTracking()` - Analytics tracking

**Utils** (`/shared/utils`)
Pure utility functions:
- `network.ts` - API URL helpers, error handling
- `format.ts` - Distance, time, price formatting
- `haptics.ts` - Tactile feedback

### Constants (`/constants`)
Centralized configuration:

```typescript
import { SCREEN_HEIGHT, MAX_IMAGE_SIZE, CACHE_KEYS } from '@/constants';
```

## 🔧 How to Use This Architecture

### Adding a New Feature

1. **Create feature folder:**
```bash
mkdir -p src/features/my-feature/{components,hooks,screens}
```

2. **Create feature files:**
```typescript
// src/features/my-feature/screens/MyScreen.tsx
import { useMyData } from '../hooks/useMyData';
import { MyComponent } from '../components/MyComponent';

export const MyScreen = () => {
  const { data } = useMyData();
  return <MyComponent data={data} />;
};
```

3. **Export from feature:**
```typescript
// src/features/my-feature/index.ts
export { MyScreen } from './screens/MyScreen';
```

4. **Use in navigation:**
```typescript
import { MyScreen } from '@/features/my-feature';
```

### Adding a New API Resource

1. **Create resource file:**
```typescript
// src/api/resources/my-resource.api.ts
import { apiClient } from '../client';

export const myResourceApi = {
  getAll: () => apiClient.get('/my-resource'),
  getOne: (id: number) => apiClient.get(`/my-resource/${id}`),
};
```

2. **Export from API:**
```typescript
// src/api/index.ts
export { myResourceApi } from './resources/my-resource.api';
```

### Creating a Reusable Hook

1. **Create hook file:**
```typescript
// src/shared/hooks/useMyHook.ts
export const useMyHook = () => {
  // Business logic here
  return { data, loading, error };
};
```

2. **Export from shared:**
```typescript
// src/shared/hooks/index.ts
export { useMyHook } from './useMyHook';
```

3. **Use in any component:**
```typescript
import { useMyHook } from '@/shared/hooks';
```

### Creating a Reusable Component

1. **Create component:**
```typescript
// src/shared/components/ui/MyButton.tsx
export const MyButton = ({ onPress, label }) => {
  return <TouchableOpacity onPress={onPress}>...</TouchableOpacity>;
};
```

2. **Export from shared:**
```typescript
// src/shared/components/ui/index.ts
export { MyButton } from './MyButton';
```

3. **Use anywhere:**
```typescript
import { MyButton } from '@/shared/components';
```

## 📖 Import Patterns

### ✅ Good Imports
```typescript
// Feature imports from shared
import { useLocation, useFeed } from '@/shared/hooks';
import { ActionButton, Badge } from '@/shared/components';
import { formatDistance } from '@/shared/utils';

// Feature imports from API
import { signalsApi } from '@/api';

// Feature imports from constants
import { SCREEN_HEIGHT, MAX_IMAGE_SIZE } from '@/constants';
```

### ❌ Bad Imports
```typescript
// Don't import across features
import { FeedComponent } from '@/features/feed/components/FeedComponent';
// Instead, expose through feature index and import minimally

// Don't bypass module boundaries
import { apiClient } from '@/api/client';
// Instead, use the resource APIs
```

## 🧪 Testing Strategy

### Unit Tests
- **Hooks**: Test business logic in isolation
- **Utils**: Test pure functions
- **API**: Mock responses, test error handling

### Integration Tests
- **Features**: Test feature workflows
- **Components**: Test UI interactions

### E2E Tests
- **Flows**: Test complete user journeys

## 🔄 Migration Guide

### Old Structure → New Structure

| Old | New |
|-----|-----|
| `src/services/api.ts` | `src/api/resources/*.api.ts` |
| `src/screens/FeedScreen.tsx` | `src/features/feed/screens/FeedScreen.tsx` |
| `src/components/SignalCard.tsx` | `src/features/feed/components/SignalCard.tsx` |
| `src/services/networkHelper.ts` | `src/shared/utils/network.ts` |

### Updating Imports

```typescript
// Old
import { signalsApi } from '../services/api';
import { FullScreenSignalCard } from '../components';

// New
import { signalsApi } from '@/api';
import { FullScreenSignalCard } from '@/features/feed';
```

## 🎯 Benefits

### For Development
- **Easy to find code** - Clear organization
- **Less coupling** - Features are independent
- **Reusability** - Shared code is obvious
- **Scalability** - Easy to add new features

### For Maintenance
- **Clear boundaries** - Know where code belongs
- **Easy refactoring** - Change one thing at a time
- **Better testing** - Isolated modules
- **Team collaboration** - Multiple devs, no conflicts

### For New Developers
- **Clear structure** - Know where things are
- **Consistent patterns** - Follow examples
- **Self-documenting** - Folder names explain purpose
- **Quick onboarding** - Start contributing fast

## 📝 Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Constants: `SCREAMING_SNAKE_CASE.ts`
- Types: `PascalCase` or `camelCase`

### Exports
- Named exports for everything
- Barrel exports in `index.ts` files
- One component per file

### Comments
- Document **why**, not **what**
- Use JSDoc for public APIs
- Keep comments up-to-date

## 🚀 Next Steps

1. **Migrate remaining screens** to features
2. **Extract more hooks** from components
3. **Create more shared components** as patterns emerge
4. **Add tests** for critical paths
5. **Document patterns** as they stabilize

---

**Remember:** This architecture supports growth. Start simple, refactor as patterns emerge, and keep code organized and maintainable!
