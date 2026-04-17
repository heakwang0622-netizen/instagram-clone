import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

/** 로그인하지 않았으면 로그인 페이지로 보내고 false. 로그인됐으면 true (선택적으로 콜백 실행). */
export function useRequireLogin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (onAuthed?: () => void): boolean => {
      if (isAuthenticated) {
        onAuthed?.();
        return true;
      }
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search}`,
        },
      });
      return false;
    },
    [isAuthenticated, navigate, location.pathname, location.search],
  );
}
