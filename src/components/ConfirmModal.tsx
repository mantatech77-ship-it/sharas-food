import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Card, cn } from './ui';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  showCancel?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  showCancel = true,
  icon
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md z-[101]"
          >
            <Card className="p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    variant === 'danger' ? 'bg-red-50 text-red-500' : 
                    variant === 'warning' ? 'bg-amber-50 text-amber-500' : 
                    'bg-sharas-light text-sharas-primary'
                  }`}>
                    {icon || <AlertCircle size={28} />}
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 mt-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-gray-800 italic uppercase tracking-tight mb-3">
                  {title}
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              
              <div className="bg-stone-50 p-4 sm:p-6 flex gap-3">
                {showCancel && (
                  <Button 
                    variant="ghost" 
                    onClick={onClose}
                    className="flex-1 h-12 rounded-2xl bg-white shadow-sm border border-stone-200"
                  >
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs">
                      {cancelText}
                    </span>
                  </Button>
                )}
                <Button 
                  variant={variant === 'danger' ? 'danger' : 'primary'}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 h-12 rounded-2xl shadow-lg border-b-4",
                    variant === 'danger' ? 'border-red-700 shadow-red-200' : 'border-sharas-accent shadow-sharas-primary/10'
                  )}
                >
                  <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs">
                    {confirmText}
                  </span>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
