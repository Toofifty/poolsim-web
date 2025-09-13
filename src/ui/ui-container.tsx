import type { ReactNode } from 'react';
import './ui-container.scss';

export const UIContainer = ({ children }: { children: ReactNode }) => {
  return <div className="ui-container">{children}</div>;
};
