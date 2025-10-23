import { vec, type Vec } from '../../../common/math';

export class InputController {
  private mousePosition: Vec = vec.new();

  private onMouseDownListeners: ((e: MouseEvent) => void)[] = [];
  private onMouseMoveListeners: ((e: MouseEvent) => void)[] = [];
  private onTouchStartListeners: ((e: TouchEvent) => void)[] = [];
  private onTouchMoveListeners: ((e: TouchEvent) => void)[] = [];

  private onKeyDownListeners: ((e: KeyboardEvent) => void)[] = [];
  private onKeyUpListeners: ((e: KeyboardEvent) => void)[] = [];

  constructor(private element: HTMLElement) {
    this.onMouseMove((e) => {
      const { left, top, width, height } = (
        e.target as HTMLElement
      ).getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      this.mousePosition[0] = (x / width) * 2 - 1;
      this.mousePosition[1] = -(y / height) * 2 + 1;
    });

    this.onTouchMove((e) => {
      const { left, top, width, height } = (
        e.target as HTMLElement
      ).getBoundingClientRect();
      const [touch] = e.touches;

      const x = touch.clientX - left;
      const y = touch.clientY - top;
      this.mousePosition[0] = (x / width) * 2 - 1;
      this.mousePosition[1] = -(y / height) * 2 + 1;
    });
  }

  public getRelativeMouse(event: MouseEvent) {
    const { left, top, width, height } = (
      event.target as HTMLElement
    ).getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    return vec.new((x / width) * 2 - 1, -(y / height) * 2 + 1);
  }

  public getRelativeTouch(event: TouchEvent) {
    const { left, top, width, height } = (
      event.target as HTMLElement
    ).getBoundingClientRect();
    const [touch] = event.touches;

    const x = touch.clientX - left;
    const y = touch.clientY - top;
    return vec.new((x / width) * 2 - 1, -(y / height) * 2 + 1);
  }

  public register() {
    this.element.addEventListener('mousedown', this.executeOnMouseDown);
    this.element.addEventListener('mousemove', this.executeOnMouseMove);
    this.element.addEventListener('touchstart', this.executeOnTouchStart);
    this.element.addEventListener('touchmove', this.executeOnTouchMove);

    document.addEventListener('keydown', this.executeOnKeyDown);
    document.addEventListener('keyup', this.executeOnKeyUp);
  }

  public unregister() {
    this.element.removeEventListener('mousedown', this.executeOnMouseDown);
    this.element.removeEventListener('mousemove', this.executeOnMouseMove);
    this.element.removeEventListener('touchstart', this.executeOnTouchStart);
    this.element.removeEventListener('touchmove', this.executeOnTouchMove);

    document.removeEventListener('keydown', this.executeOnKeyDown);
    document.removeEventListener('keyup', this.executeOnKeyUp);

    this.onMouseDownListeners = [];
    this.onMouseMoveListeners = [];
    this.onTouchMoveListeners = [];
    this.onKeyDownListeners = [];
    this.onKeyUpListeners = [];
  }

  private executeOnMouseDown = (event: MouseEvent) =>
    this.onMouseDownListeners.forEach((l) => l(event));

  private executeOnMouseMove = (event: MouseEvent) =>
    this.onMouseMoveListeners.forEach((l) => l(event));

  private executeOnTouchStart = (event: TouchEvent) =>
    this.onTouchStartListeners.forEach((l) => l(event));

  private executeOnTouchMove = (event: TouchEvent) =>
    this.onTouchMoveListeners.forEach((l) => l(event));

  private executeOnKeyDown = (event: KeyboardEvent) =>
    this.onKeyDownListeners.forEach((l) => l(event));

  private executeOnKeyUp = (event: KeyboardEvent) =>
    this.onKeyUpListeners.forEach((l) => l(event));

  private addListener<T>(fn: T, listeners: T[]) {
    listeners.push(fn);
    return () => {
      const index = listeners.indexOf(fn);
      delete listeners[index];
    };
  }

  public onMouseDown(fn: (e: MouseEvent) => void) {
    return this.addListener(fn, this.onMouseDownListeners);
  }

  public onMouseMove(fn: (e: MouseEvent) => void) {
    return this.addListener(fn, this.onMouseMoveListeners);
  }

  public onTouchStart(fn: (e: TouchEvent) => void) {
    return this.addListener(fn, this.onTouchStartListeners);
  }

  public onTouchMove(fn: (e: TouchEvent) => void) {
    return this.addListener(fn, this.onTouchMoveListeners);
  }

  public onKeyDown(fn: (e: KeyboardEvent) => void) {
    return this.addListener(fn, this.onKeyDownListeners);
  }

  public onKeyUp(fn: (e: KeyboardEvent) => void) {
    return this.addListener(fn, this.onKeyUpListeners);
  }

  /** Current screen position of mouse */
  public get mouse() {
    return this.mousePosition;
  }
}
