import React from "react";
import "./AdminToast.css";

export type AdminToastType = "success" | "error" | "info";

interface AdminToastProps {
  type: AdminToastType;
  message: string;
  onClose: () => void;
}

function AdminToast({ type, message, onClose }: AdminToastProps) {
  return (
    <div className="admin-toast-container">
      <div className={`admin-toast ${type}`} role="status" aria-live="polite">
        <span>{message}</span>
        <button
          type="button"
          className="admin-toast-close"
          onClick={onClose}
          aria-label="Закрыть уведомление"
        >
          x
        </button>
      </div>
    </div>
  );
}

export default AdminToast;
