import type { ReactNode } from 'react';
import './ui-container.scss';

export const UIContainer = ({
  children,
  bottom,
}: {
  children: ReactNode;
  bottom: ReactNode;
}) => {
  return (
    <div className="ui-container">
      {children}
      <div className="ui-container__bottom">{bottom}</div>
    </div>
  );
};
