import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  as?: 'button' | 'span';
}

const Button = ({ children, variant = 'primary', as = 'button', className: additionalClassName, ...props }: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm';

  const variantClasses = {
    primary: 'text-white bg-white/20 hover:bg-white/30 border-white/30 focus:ring-fuchsia-400',
    secondary: 'text-fuchsia-300 bg-white/10 hover:bg-white/20 border-white/20 focus:ring-fuchsia-500',
  };

  const className = `${baseClasses} ${variantClasses[variant]} ${additionalClassName || ''}`;
  
  if (as === 'span') {
      return <span className={className} style={{ cursor: 'pointer' }}>{children}</span>;
  }

  return (
    <button
      {...props}
      className={className}
    >
      {children}
    </button>
  );
};

export default Button;