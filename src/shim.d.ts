declare module 'quartic' {
  export default function quartic(
    coeffs: readonly [number, number, number, number, number]
  ): { re: number; im: number }[];
}
