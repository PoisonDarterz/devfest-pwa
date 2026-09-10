/**
 * Generates a deterministic, unique identicon URL from DiceBear 10.x based on email or name.
 * 
 * @param seed Primary seed (e.g. email or name)
 * @param fallbackSeed Optional fallback seed if primary seed is empty
 * @returns The resolved DiceBear SVG avatar URL
 */
export const getAvatarUrl = (seed: string | null | undefined, fallbackSeed?: string | null): string => {
  const actualSeed =
    seed && seed.trim() !== ''
      ? seed
      : fallbackSeed && fallbackSeed.trim() !== ''
      ? fallbackSeed
      : 'attendee';
  return `https://api.dicebear.com/10.x/identicon/svg?seed=${encodeURIComponent(actualSeed)}`;
};
