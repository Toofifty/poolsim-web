import type { ReactNode } from 'react';
import './page-container.css';

export const PageContainer = ({ children }: { children: ReactNode }) => (
  <div className="page-container">{children}</div>
);
