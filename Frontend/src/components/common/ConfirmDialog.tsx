import React from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Tamam',
    cancelText = 'İptal',
    onConfirm,
    onCancel,
    variant = 'danger',
}) => {
    if (!isOpen) return null;

    const icons: Record<string, string> = {
        danger: '⚠️',
        warning: '⚡',
        info: 'ℹ️',
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div
                className={`confirm-dialog confirm-dialog-${variant}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="confirm-dialog-icon">{icons[variant]}</div>
                <h3 className="confirm-dialog-title">{title}</h3>
                <p className="confirm-dialog-message">{message}</p>
                <div className="confirm-dialog-actions">
                    <button className="confirm-dialog-btn confirm-dialog-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${variant}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
