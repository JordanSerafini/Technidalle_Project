import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then((value) => {
      setToken(value);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return <Redirect href={token ? '/(tabs)/dashboard' : '/LoginScreen'} />;
}
