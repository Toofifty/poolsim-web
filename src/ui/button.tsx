import type { ReactNode } from 'react';
import './surface.scss';
import './button.scss';

export const Button = ({
  surface = false,
  children,
  onClick,
  active = false,
}: {
  surface?: boolean;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    className={`button ${surface ? 'surface' : ''} ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);
