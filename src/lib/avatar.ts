/**
 * Resolves an avatar URL. If a valid avatarUrl is provided, it returns it directly.
 * Otherwise, it generates a deterministic, unique identicon URL from DiceBear 10.x.
 * 
 * @param avatarUrl The existing avatar URL (if any)
 * @param seed The unique seed (e.g. email, ID, or name) to generate the identicon
 * @returns The resolved avatar URL
 */
export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string): string => {
  if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.includes('placeholder')) {
    return avatarUrl;
  }
  // DiceBear 10.x API uses https://api.dicebear.com/10.x/identicon/svg?seed=...
  return `https://api.dicebear.com/10.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
};
