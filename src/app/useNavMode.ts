import { PHONE, useMedia } from '@/lib/useMedia';
import { usePref } from '@/stores/prefs';

/**
 * The nav layout in effect: the saved preference, except on a phone, where a 270px side rail
 * would leave no page — there it is always the one bar across the top. The preference itself
 * is kept, so a wider screen gets the split back.
 */
export function useNavMode(): 'bar' | 'split' {
  const saved = usePref('navMode');
  const phone = useMedia(PHONE);
  return phone ? 'bar' : saved;
}
