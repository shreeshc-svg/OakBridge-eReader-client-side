import React from 'react';
import './Confirm_Modal.scss';

interface ConfirmModalProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirm: () => void;
     title: string;
     message: string;
     confirmText?: string;
     cancelText?: string;
     isProcessing?: boolean;
}

const Confirm_Modal: React.FC<ConfirmModalProps> = ({
     isOpen,
     onClose,
     onConfirm,
     title,
     message,
     confirmText = 'Confirm',
     cancelText = 'Cancel',
     isProcessing = false
}) => {
     if (!isOpen) return null;

     return (
          <>
               <div className="confirm_modal__overlay" onClick={onClose} />
               <div className="confirm_modal">
                    <div className="confirm_modal__content">
                         <div className="confirm_modal__header">
                              <h3>{title}</h3>
                              <button className="confirm_modal__close" onClick={onClose}>
                                   &times;
                              </button>
                         </div>
                         <div className="confirm_modal__body">
                              <p>{message}</p>
                         </div>
                         <div className="confirm_modal__footer">
                              <button
                                   className="confirm_modal__btn confirm_modal__btn--cancel"
                                   onClick={onClose}
                                   disabled={isProcessing}
                              >
                                   {cancelText}
                              </button>
                              <button
                                   className="confirm_modal__btn confirm_modal__btn--confirm"
                                   onClick={onConfirm}
                                   disabled={isProcessing}
                              >
                                   {isProcessing ? 'Processing...' : confirmText}
                              </button>
                         </div>
                    </div>
               </div>
          </>
     );
};

export default Confirm_Modal;
