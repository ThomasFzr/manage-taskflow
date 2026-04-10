process.env.EXPO_PUBLIC_APP_NAME = 'Test App';
process.env.EXPO_PUBLIC_APP_VERSION = '1.0.0';
process.env.EXPO_PUBLIC_ENVIRONMENT = 'development';
process.env.EXPO_PUBLIC_API_URL = 'https://api.test.com';

jest.mock('axios', () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  return {
    create: jest.fn(() => instance),
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockDateTimePicker(props) {
    return React.createElement(View, {
      testID: 'mock-datetime-picker',
      ...props,
    });
  };
});