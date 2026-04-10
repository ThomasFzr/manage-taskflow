import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Text, View } from 'react-native';
import RootLayout from '@/app/_layout';
import NotFoundScreen from '@/app/+not-found';
import TabLayout from '@/app/(tabs)/_layout';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

const mockStatusBar = jest.fn((props: { style?: string }) => (
  <View testID="status-bar" accessibilityLabel={props.style} />
));
const mockStackScreen = jest.fn();
const mockTabsScreen = jest.fn();

jest.mock('@/hooks/useFrameworkReady');

jest.mock('expo-status-bar', () => ({
  StatusBar: (props: { style?: string }) => mockStatusBar(props),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const Stack = ({ children }: { children?: React.ReactNode }) => (
    <View testID="stack">{children}</View>
  );

  Stack.Screen = (props: Record<string, unknown>) => {
    mockStackScreen(props);
    return null;
  };

  const Tabs = ({ children }: { children?: React.ReactNode }) => {
    React.Children.forEach(children, (child: any) => {
      const icon = child?.props?.options?.tabBarIcon;
      if (typeof icon === 'function') {
        icon({ color: '#007AFF', size: 24, focused: true });
      }
    });

    return <View testID="tabs">{children}</View>;
  };

  Tabs.Screen = (props: Record<string, unknown>) => {
    mockTabsScreen(props);
    return null;
  };

  const Link = ({ children }: { children?: React.ReactNode }) => (
    <Text>{children}</Text>
  );

  return { Stack, Tabs, Link };
});

jest.mock('lucide-react-native', () => ({
  SquareCheck: ({ color }: { color?: string }) => (
    (() => {
      const { View } = require('react-native');
      return <View testID={`tasks-icon-${color ?? 'none'}`} />;
    })()
  ),
  Settings: ({ color }: { color?: string }) => (
    (() => {
      const { View } = require('react-native');
      return <View testID={`settings-icon-${color ?? 'none'}`} />;
    })()
  ),
}));

beforeEach(() => {
  mockStatusBar.mockClear();
  mockStackScreen.mockClear();
  mockTabsScreen.mockClear();
});

describe('App shell', () => {
  it('renderize le layout racine et active le framework', () => {
    render(<RootLayout />);

    expect(useFrameworkReady).toHaveBeenCalledTimes(1);
    expect(mockStackScreen).toHaveBeenCalledWith({ name: '+not-found' });
    expect(mockStatusBar).toHaveBeenCalledWith({ style: 'auto' });
  });

  it('renderize la page introuvable', () => {
    const { getByText } = render(<NotFoundScreen />);

    expect(getByText("This screen doesn't exist.")).toBeTruthy();
    expect(getByText('Go to home screen!')).toBeTruthy();
    expect(mockStackScreen).toHaveBeenCalledWith({
      options: { title: 'Oops!' },
    });
  });

  it('renderize les onglets et leurs icônes', () => {
    render(<TabLayout />);

    expect(mockTabsScreen).toHaveBeenCalledTimes(2);
    expect(mockTabsScreen).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'index' })
    );
    expect(mockTabsScreen).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: 'settings' })
    );
  });
});