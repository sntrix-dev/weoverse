import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import type { PathItem } from './PathBar';

/** design: v3-screens.jsx hubPath — WeOverse › Community › …tail (every section's path starts at the hub). */
export function useHubPath(tail: PathItem[] = []) {
  const navigate = useNavigate();
  const hub = () => void navigate(routes.hub());
  return {
    onHub: hub,
    items: [{ label: 'WeOverse', onClick: hub }, { label: 'Community', onClick: hub }, ...tail] as PathItem[],
  };
}
