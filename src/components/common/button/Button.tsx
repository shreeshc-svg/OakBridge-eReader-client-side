import React from 'react';
import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'outline' | 'text';
     fullWidth?: boolean;
     children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
     variant = 'primary',
     fullWidth = false,
     className = '',
     children,
     ...props
}) => {
     return (
          <button
               className={`common_button ${variant} ${fullWidth ? 'full_width' : ''} ${className}`}
               {...props}
          >
               {children}
          </button>
     );
};

export default Button;
