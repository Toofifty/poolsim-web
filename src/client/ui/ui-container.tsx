import type { ReactNode } from 'react';
import './ui-container.scss';

export const UIContainer = ({
  top,
  left,
  bottom,
}: {
  top: ReactNode;
  left?: ReactNode;
  bottom: ReactNode;
}) => {
  return (
    <div className="ui-container">
      <div className="ui-container__top">{top}</div>
      <div className="ui-container__mid">
        <div className="ui-container__left">{left}</div>
        <div className="ui-container__centre"></div>
        <div className="ui-container__right"></div>
      </div>
      <div className="ui-container__bottom">{bottom}</div>
    </div>
  );
};
