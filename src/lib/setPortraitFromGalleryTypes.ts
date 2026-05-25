/** Options when applying a gallery still as the user-private profile portrait. */
export type SetPortraitFromGalleryOptions = {
  /** `generated_images.id` for the still row (matches profile_loop_video_jobs.context.sourceGenId). */
  generatedImageId?: string;
  /** Synthetic canonical card-art tile — may restore the card’s default loop MP4. */
  isCardArt?: boolean;
};

export type SetPortraitFromGalleryHandler = (
  imageUrl: string,
  options?: SetPortraitFromGalleryOptions,
) => Promise<void>;
