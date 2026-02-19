import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'projectmanager://'],
  config: {
    screens: {
      // Structure: "pathName": "screenName"
      login: 'login',
      'reset-password': 'reset-password',
    },
  },
};