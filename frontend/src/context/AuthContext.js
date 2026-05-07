import React from 'react';

export const AuthContext = React.createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  unreadNotificationCount: 0,
  notificationPermission: 'default',
  enableNotifications: async () => 'default',
  login: () => {},
  logout: () => {}
});
