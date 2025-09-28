import type { ReactNode } from 'react';
import './button.scss';
import './surface.scss';

export const Button = ({
  surface = false,
  circle = false,
  disabled = false,
  children,
  className,
  onClick,
  active = false,
}: {
  surface?: boolean;
  circle?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    disabled={disabled}
    className={`button${surface ? ' surface' : ''}${
      disabled ? ' disabled' : ''
    }${circle ? ' circle' : ''}${active ? ' active' : ''} ${className ?? ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);
