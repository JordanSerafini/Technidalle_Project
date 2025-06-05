import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../_layout';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => <>{children}</>,
    SafeAreaView: ({ children }: any) => <>{children}</>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
  };
});

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Stack: ({ children }: any) => <>{children}</>,
  };
});

describe('RootLayout', () => {
  it.skip('renders without crashing', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });
});
