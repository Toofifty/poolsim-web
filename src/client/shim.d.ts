declare module 'quartic' {
  export default function quartic(
    coeffs: readonly [number, number, number, number, number]
  ): { re: number; im: number }[];
}

declare module 'troika-three-text' {
  import { Mesh } from 'three';

  export class Text extends Mesh {
    text: string;
    font: string;
    fontSize: number;
    color: string | number;
    anchorX: 'left' | 'center' | 'right' | number;
    anchorY:
      | 'top'
      | 'top-baseline'
      | 'middle'
      | 'bottom-baseline'
      | 'bottom'
      | number;
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    overflowWrap: 'normal' | 'break-word';
    whiteSpace: 'normal' | 'nowrap';
    material: any;

    sync(): void;
  }
}
