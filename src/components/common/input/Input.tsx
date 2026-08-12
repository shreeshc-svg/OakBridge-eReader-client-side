import React, { forwardRef } from 'react';
import './Input.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
     icon?: React.ReactNode;
     onIconClick?: () => void;
     error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
     ({ className = '', icon, onIconClick, error, ...props }, ref) => {
          return (
               <div className={`common_input_wrapper ${className}`}>
                    <div
                         className={`common_input_container ${error ? 'error' : ''}`}
                    >
                         <input ref={ref} className="common_input" {...props} />
                         {icon && (
                              <span
                                   className={`common_input_icon ${onIconClick ? 'clickable' : ''}`}
                                   onClick={onIconClick}
                              >
                                   {icon}
                              </span>
                         )}
                    </div>
                    {error && (
                         <span className="common_input_error_text">
                              {error}
                         </span>
                    )}
               </div>
          );
     }
);

Input.displayName = 'Input';

export default Input;
