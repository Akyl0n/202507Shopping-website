import { useUserStore } from './store';

export function useUser() {
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  return { user, token, setUser, clearUser };
}
