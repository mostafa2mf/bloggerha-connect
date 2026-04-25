import { useState, useCallback } from 'react';

const ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_KEY = 'login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export const useRateLimit = () => {
  const [isLocked, setIsLocked] = useState(() => {
    const lockout = localStorage.getItem(LOCKOUT_KEY);
    if (lockout && Date.now() < parseInt(lockout)) return true;
    if (lockout && Date.now() >= parseInt(lockout)) {
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
      return false;
    }
    return false;
  });

  const [remainingTime, setRemainingTime] = useState(0);

  const checkLock = useCallback(() => {
    const lockout = localStorage.getItem(LOCKOUT_KEY);
    if (lockout) {
      const remaining = parseInt(lockout) - Date.now();
      if (remaining > 0) {
        setIsLocked(true);
        setRemainingTime(Math.ceil(remaining / 1000));
        return true;
      }
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
      setIsLocked(false);
    }
    return false;
  }, []);

  const recordAttempt = useCallback(() => {
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0') + 1;
    localStorage.setItem(ATTEMPTS_KEY, attempts.toString());
    if (attempts >= MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_MS;
      localStorage.setItem(LOCKOUT_KEY, lockoutTime.toString());
      setIsLocked(true);
      setRemainingTime(Math.ceil(LOCKOUT_MS / 1000));
      return true;
    }
    return false;
  }, []);

  const resetAttempts = useCallback(() => {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
    setIsLocked(false);
    setRemainingTime(0);
  }, []);

  const getAttemptsLeft = useCallback(() => {
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0');
    return MAX_ATTEMPTS - attempts;
  }, []);

  return { isLocked, remainingTime, checkLock, recordAttempt, resetAttempts, getAttemptsLeft };
};
