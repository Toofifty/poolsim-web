import { defaultParams } from './default-params';

// todo: proxy
export const params = defaultParams;

export type Params = typeof params;

if (typeof window !== 'undefined') (window as any).params = params;
