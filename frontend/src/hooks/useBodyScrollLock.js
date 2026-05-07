import { useEffect } from 'react';

const LOCK_COUNT_KEY = 'scrollLockCount';

const getLockCount = () => Number(document.body.dataset[LOCK_COUNT_KEY] || 0);

const setLockCount = (count) => {
  document.body.dataset[LOCK_COUNT_KEY] = String(count);
};

const applyLockStyles = () => {
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';
  document.documentElement.style.overflow = 'hidden';
};

const clearLockStyles = () => {
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
  document.documentElement.style.overflow = '';
};

const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return undefined;

    const nextCount = getLockCount() + 1;
    setLockCount(nextCount);
    if (nextCount === 1) {
      applyLockStyles();
    }

    return () => {
      const decremented = Math.max(0, getLockCount() - 1);
      setLockCount(decremented);
      if (decremented === 0) {
        clearLockStyles();
      }
    };
  }, [locked]);
};

export default useBodyScrollLock;
