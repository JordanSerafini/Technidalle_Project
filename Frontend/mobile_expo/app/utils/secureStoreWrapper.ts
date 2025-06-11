import * as SecureStore from 'expo-secure-store';

export const secureStoreWrapper = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      // Essayer la méthode standard
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore getItemAsync failed, trying fallback:', error);
      try {
        // Fallback pour les versions incompatibles
        const store = SecureStore as any;
        if (store.default && store.default.getValueWithKeyAsync) {
          return await store.default.getValueWithKeyAsync(key);
        }
        return null;
      } catch (fallbackError) {
        console.error('SecureStore fallback also failed:', fallbackError);
        return null;
      }
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore setItemAsync failed:', error);
      const store = SecureStore as any;
      if (store.default && store.default.setValueWithKeyAsync) {
        return await store.default.setValueWithKeyAsync(value, key);
      }
      throw error;
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    try {
      return await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore deleteItemAsync failed:', error);
      const store = SecureStore as any;
      if (store.default && store.default.deleteValueWithKeyAsync) {
        return await store.default.deleteValueWithKeyAsync(key);
      }
      throw error;
    }
  }
}; 