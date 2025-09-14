import type { ElementType, ReactNode } from 'react';
import './surface.scss';

export const Surface = ({
  as: Element = 'div',
  children,
  className,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) => <Element className={`surface ${className}`}>{children}</Element>;
