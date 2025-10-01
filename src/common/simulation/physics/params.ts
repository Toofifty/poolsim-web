import { proxy } from 'valtio';
import { defaultParams } from './default-params';

export const params = proxy(defaultParams);

if (typeof window !== 'undefined') (window as any).params = params;
