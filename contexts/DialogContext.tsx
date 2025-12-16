import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Dialog from '../components/Dialog';

interface DialogOptions {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string; // If undefined, might be single button (alert style)
    isDestructive?: boolean;
    onConfirm?: () => void;
}

interface DialogContextType {
    showDialog: (options: DialogOptions) => void;
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
    showAlert: (message: string) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<DialogOptions>({
        title: '',
        message: '',
    });

    const showDialog = useCallback((options: DialogOptions) => {
        setConfig(options);
        setIsOpen(true);
    }, []);

    const showError = useCallback((message: string) => {
        showDialog({
            title: 'Error',
            message: message,
            confirmLabel: 'OK',
            cancelLabel: undefined,
            isDestructive: true
        });
    }, [showDialog]);

    const showSuccess = useCallback((message: string) => {
        showDialog({
            title: 'Success',
            message: message,
            confirmLabel: 'OK',
            cancelLabel: undefined,
        });
    }, [showDialog]);

    const showAlert = useCallback((message: string) => {
        showDialog({
            title: 'Alert',
            message: message,
            confirmLabel: 'OK',
            cancelLabel: undefined,
        });
    }, [showDialog]);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <DialogContext.Provider value={{ showDialog, showError, showSuccess, showAlert }}>
            {children}
            {/* If cancelLabel is explicitly null/undefined, usually we might want to hide the cancel button in Dialog.tsx 
                But Dialog.tsx expects cancelLabel? Let's verify Dialog.tsx */}
            <Dialog
                isOpen={isOpen}
                onClose={handleClose}
                title={config.title}
                confirmLabel={config.confirmLabel || 'Confirm'}
                cancelLabel={config.cancelLabel} // If undefined, Dialog might show "Cancel" default?
                isDestructive={config.isDestructive}
                onConfirm={config.onConfirm}
            >
                {config.message}
            </Dialog>
        </DialogContext.Provider>
    );
};

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};
