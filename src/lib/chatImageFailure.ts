import {
  CHAT_IMAGE_FAILURE_LINE,
  friendlyChatImageFailure,
  shouldSendChatImage,
} from "../../supabase/functions/_shared/chatImageCopy";

export { CHAT_IMAGE_FAILURE_LINE, friendlyChatImageFailure, shouldSendChatImage };

/** Drop a spinning photo bubble after the picture fails. No locked placeholder, no worker text. */
export function clearedFailedImageBubble<T extends {
  pendingImage?: boolean;
  blurred?: boolean;
  imageUrl?: string | null;
  storageUrl?: string | null;
  content: string;
}>(bubble: T): T {
  return {
    ...bubble,
    pendingImage: false,
    blurred: false,
    imageUrl: null,
    storageUrl: null,
    content: CHAT_IMAGE_FAILURE_LINE,
  };
}
