import type { ReactNode } from 'react';
import './button.scss';
import './surface.scss';

export const Button = ({
  surface = false,
  circle = false,
  children,
  className,
  onClick,
  active = false,
}: {
  surface?: boolean;
  circle?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    className={`button${surface ? ' surface' : ''}${circle ? ' circle' : ''}${
      active ? ' active' : ''
    } ${className ?? ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);
