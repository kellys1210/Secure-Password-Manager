import React, { useState, useEffect } from "react";
import "./ToastNotification.css";

/**
 * ToastNotification Component
 *
 * Displays temporary toast notifications for user feedback
 * Automatically dismisses after specified duration
 *
 * Props:
 * - message: The message to display
 * - type: 'success' | 'error' | 'info' | 'warning'
 * - duration: Auto-dismiss duration in ms (default: 3000)
 * - onDismiss: Callback when toast is dismissed
 */
export default function ToastNotification({
  message,
  type = "info",
  duration = 3000,
  onDismiss,
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 10);

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onDismiss) onDismiss();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`toast-notification toast-${type} ${isVisible ? "show" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="toast-icon">
        {type === "success" && "✓"}
        {type === "error" && "✗"}
        {type === "info" && "ℹ"}
        {type === "warning" && "⚠"}
      </div>
      <div className="toast-message">{message}</div>
    </div>
  );
}
