import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sao chép vào clipboard và bật cờ `copied` trong ít giây để nút đổi sang dấu tích.
 * Timer được dọn khi unmount — bản chép tay trước đây gọi setState sau khi modal
 * đã đóng.
 */
export function useCopyFeedback(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs]
  );

  return { copied, copy };
}
