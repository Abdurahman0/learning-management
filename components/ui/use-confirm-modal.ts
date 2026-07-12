"use client";

import {useCallback, useRef, useState} from "react";

/**
 * Promise-based state for <ConfirmModal>. `confirm()` opens the modal and
 * resolves true/false when the user picks an action, so async flows can
 * `await` a decision the way `window.confirm` allowed, but with the app's
 * own modal.
 */
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      // A previous unanswered request is treated as cancelled.
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => settle(true), [settle]);
  const handleCancel = useCallback(() => settle(false), [settle]);

  return {isOpen, confirm, handleConfirm, handleCancel};
}
