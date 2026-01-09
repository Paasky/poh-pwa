import { toast } from "vue-sonner";

/**
 * Centralized Error Service for handling both developer-facing logs
 * and user-facing notifications.
 */
export const errorService = {
  /**
   * Main entry point for handling errors.
   */
  handle(err: unknown, context?: Record<string, unknown>) {
    const message = err instanceof Error ? err.message : String(err);

    // 1. Developer Logging (Keep as-is for prototype stage)
    console.error(`[Global Error]`, { err, context });

    // 2. User Notification
    // We can expand this logic to censor sensitive errors or provide custom messages
    const userFriendlyMessage = this.isSystemError(err)
      ? `A technical error occurred: ${message}`
      : message;

    toast.error(userFriendlyMessage);
  },

  /**
   * Distinguishes between "User Errors" (Validation, intentional throws)
   * and "System Errors" (ReferenceError, TypeError, etc.)
   */
  isSystemError(err: unknown): boolean {
    return (
      err instanceof TypeError ||
      err instanceof ReferenceError ||
      err instanceof SyntaxError ||
      (err instanceof Error && err.message.includes("is not a function"))
    );
  },
};
