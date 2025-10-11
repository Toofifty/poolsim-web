import type { Object3D } from 'three';
import { Component } from '../../../common/ecs';

export class OverlayRenderable extends Component {
  public readonly isRenderable = true;

  constructor(public mesh: Object3D, public outline = false) {
    super();
  }
}
