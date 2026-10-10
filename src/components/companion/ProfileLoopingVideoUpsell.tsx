type Props = {
  companionId: string;
  hasExistingLoopVideo?: boolean;
  className?: string;
  disabled?: boolean;
  tokensBalance?: number;
  isAdminUser?: boolean;
  onSuccess?: (result?: { publicUrl?: string | null }) => void | Promise<void>;
  onBalanceMaybeChanged?: () => void;
  onToggleGallery?: () => void;
  sourceGeneratedImageId?: string | null;
  onClearLoopSource?: () => void;
};

/** Looping portrait videos are retired. The still portrait stays. */
export function ProfileLoopingVideoUpsell(_props: Props) {
  return null;
}
