import type { Object3D } from 'three';
import { Component } from '../../../common/ecs';

export class Object3DComponent extends Component {
  constructor(public mesh: Object3D) {
    super();
  }
}
