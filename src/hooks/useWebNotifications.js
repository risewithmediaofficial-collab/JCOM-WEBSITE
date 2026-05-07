import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../config/api';
import { notificationAPI } from '../services/api';

const PROMPT_KEY = 'jcom-notifications-prompted';

const useWebNotifications = ({ isAuthenticated, user }) => {
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const serviceWorkerRef = useRef(null);
  const socketRef = useRef(null);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    localStorage.setItem(PROMPT_KEY, 'true');
    return nextPermission;
  };

  useEffect(() => {
    let active = true;

    const registerWorker = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.register('/notification-sw.js');
        if (active) {
          serviceWorkerRef.current = registration;
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerWorker();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setUnreadCount(0);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    let cancelled = false;

    const showBrowserNotification = async (payload) => {
      if (typeof window === 'undefined' || !payload || Notification.permission !== 'granted') {
        return;
      }

      try {
        if (serviceWorkerRef.current?.showNotification) {
          await serviceWorkerRef.current.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon,
            badge: payload.badge,
            tag: payload.tag,
            data: {
              url: payload.url || '/dashboard'
            }
          });
          return;
        }

        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          tag: payload.tag
        });

        notification.onclick = () => {
          window.focus();
          if (payload.url) {
            window.location.assign(payload.url);
          }
        };
      } catch (error) {
        console.error('Browser notification failed:', error);
      }
    };

    const bootstrapNotifications = async () => {
      try {
        const { data } = await notificationAPI.getUnreadCount();
        if (!cancelled) {
          setUnreadCount(data?.unreadCount || 0);
        }
      } catch (error) {
        console.error('Unread notification count failed:', error);
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
        if (Notification.permission === 'default' && !localStorage.getItem(PROMPT_KEY)) {
          await requestPermission();
        }
      }

      const socket = io(API_ORIGIN, {
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join', user._id);
      });

      socket.on('new_notification', async ({ web }) => {
        if (cancelled) return;
        setUnreadCount((count) => count + 1);
        await showBrowserNotification(web);
      });
    };

    bootstrapNotifications();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  return {
    unreadCount,
    permission,
    requestPermission
  };
};

export default useWebNotifications;
