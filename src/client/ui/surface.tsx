import { Box, type BoxComponentProps } from '@mantine/core';
import cx from 'classnames';
import type { ReactNode } from 'react';
import './surface.scss';

export const Surface = ({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & BoxComponentProps) => (
  <Box {...props} className={cx('surface', className)}>
    {children}
  </Box>
);
