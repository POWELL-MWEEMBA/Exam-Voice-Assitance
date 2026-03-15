# Quick Reference - Modular Architecture

## 🎯 Where Does My Code Go?

### Adding a New Screen/Feature
```
src/features/my-feature/
├── components/          # Components used ONLY in this feature
├── hooks/              # Business logic ONLY for this feature  
├── screens/            # Screen components
└── index.ts            # Export public API
```

### Adding a Reusable Component
```
src/shared/components/ui/MyComponent.tsx
```
Then export in `src/shared/components/ui/index.ts`

### Adding a Reusable Hook
```
src/shared/hooks/useMyHook.ts
```
Then export in `src/shared/hooks/index.ts`

### Adding an API Endpoint
```
src/api/resources/my-resource.api.ts
```
Then export in `src/api/index.ts`

### Adding a Utility Function
```
src/shared/utils/myUtil.ts
```
Then export in `src/shared/utils/index.ts`

### Adding a Constant
```
src/constants/app.constants.ts
```

## 📖 Import Cheat Sheet

```typescript
// API
import { signalsApi, authApi, contextsApi } from '../api';

// Features
import { FeedScreen } from '../features/feed';
import { SubscriptionsScreen } from '../features/subscriptions';

// Shared Components
import { ActionButton, Badge, VendorAvatar } from '../shared/components';

// Shared Hooks
import { useLocation, useFeed, useSavedSignals } from '../shared/hooks';

// Shared Utils
import { formatDistance, formatTimeAgo, getMediaUrl } from '../shared/utils';

// Constants
import { SCREEN_HEIGHT, MAX_IMAGE_SIZE, CACHE_KEYS } from '../constants';

// Theme
import { colors, spacing, borderRadius } from '../theme';

// Store
import { useAuthStore, useFeedStore } from '../store';

// Types
import { Signal, Context, User } from '../types';
```

## 🔍 Quick Decision Tree

**Is it used in multiple features?**
- ✅ Yes → `shared/`
- ❌ No → Keep in feature folder

**Is it a UI component?**
- ✅ Yes → `shared/components/ui/`
- ❌ No → If business logic → `shared/hooks/`

**Is it configuration/constant?**
- ✅ Yes → `constants/`

**Is it an API call?**
- ✅ Yes → `api/resources/`

**Is it a formatting/helper function?**
- ✅ Yes → `shared/utils/`

## 🏗️ File Templates

### Feature Screen Template
```typescript
// src/features/my-feature/screens/MyScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useMyData } from '../hooks/useMyData';
import { MyComponent } from '../components/MyComponent';

export const MyScreen = () => {
  const { data, loading } = useMyData();
  
  if (loading) return <LoadingState />;
  
  return (
    <View style={styles.container}>
      <MyComponent data={data} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

### Custom Hook Template
```typescript
// src/shared/hooks/useMyHook.ts
import { useState, useEffect } from 'react';
import { myApi } from '../../api';

export const useMyHook = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await myApi.getData();
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { data, loading, refetch: loadData };
};
```

### Shared Component Template
```typescript
// src/shared/components/ui/MyButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../../../theme';

interface MyButtonProps {
  label: string;
  onPress: () => void;
}

export const MyButton: React.FC<MyButtonProps> = ({ label, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  label: {
    color: colors.text.white,
    fontWeight: '600',
  },
});
```

### API Resource Template
```typescript
// src/api/resources/my-resource.api.ts
import { apiClient } from '../client';

export const myResourceApi = {
  getAll: () => apiClient.get('/my-resource'),
  
  getOne: (id: number) => apiClient.get(`/my-resource/${id}`),
  
  create: (data: any) => apiClient.post('/my-resource', data),
  
  update: (id: number, data: any) => 
    apiClient.put(`/my-resource/${id}`, data),
  
  delete: (id: number) => apiClient.delete(`/my-resource/${id}`),
};
```

## 🚀 Common Tasks

### Task: Add a new signal type filter
1. **API:** Update `api/resources/signals.api.ts`
2. **Hook:** Update `shared/hooks/useFeed.ts`
3. **UI:** Update `features/feed/components/FilterBar.tsx`
4. **Type:** Update `types/index.ts`

### Task: Add a chat feature
1. **Create:** `features/chat/` folder
2. **Add:** `screens/ChatScreen.tsx`
3. **Add:** `components/MessageBubble.tsx`
4. **Add:** `hooks/useChat.ts`
5. **Add:** `api/resources/chat.api.ts`
6. **Export:** From `features/chat/index.ts`
7. **Add:** Route in `navigation/AppNavigator.tsx`

### Task: Add a loading spinner component
1. **Create:** `shared/components/ui/Spinner.tsx`
2. **Export:** In `shared/components/ui/index.ts`
3. **Use:** Import anywhere with `import { Spinner } from '@/shared/components'`

## ✅ Checklist for New Code

- [ ] Is it in the right folder?
- [ ] Is it exported from the module's `index.ts`?
- [ ] Does it import from the right places?
- [ ] Is it following naming conventions?
- [ ] Is it documented if it's a public API?
- [ ] Does it have types if using TypeScript?

## 🎨 Naming Conventions

- **Components:** `PascalCase.tsx` (e.g., `ActionButton.tsx`)
- **Hooks:** `useCamelCase.ts` (e.g., `useLocation.ts`)
- **Utils:** `camelCase.ts` (e.g., `formatDistance.ts`)
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `MAX_IMAGE_SIZE`)
- **Folders:** `kebab-case` (e.g., `post-signal/`)

---

**Remember:** When in doubt, put it in `shared/` if it's reusable, or in a feature folder if it's specific! 🚀
