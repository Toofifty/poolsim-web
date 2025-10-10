import { Resource } from '@common/ecs';
import {
  AudioListener,
  AudioLoader,
  Object3D,
  PositionalAudio,
  Vector3,
} from 'three';
import boop from '../../assets/boop.wav';
import clack_mid from '../../assets/clack_mid.wav';
import foul from '../../assets/foul.wav';
import hit_centre from '../../assets/hit_centre.wav';
import pocket_drop from '../../assets/pocket_drop.wav';
import sad_trumpet from '../../assets/sad_trumpet.wav';
import win from '../../assets/win.wav';

type AudioBuffers = Partial<
  Record<
    | 'clack_mid'
    | 'hit_centre'
    | 'pocket_drop'
    | 'boop'
    | 'foul'
    | 'win'
    | 'sad_trumpet',
    AudioBuffer
  >
>;

export class Audio extends Resource {
  public listener: AudioListener;
  private buffers: AudioBuffers;

  constructor(private scene: Object3D) {
    super();

    this.listener = new AudioListener();
    this.buffers = {};

    new AudioLoader().load(clack_mid, (b) => (this.buffers.clack_mid = b));
    new AudioLoader().load(hit_centre, (b) => (this.buffers.hit_centre = b));
    new AudioLoader().load(pocket_drop, (b) => (this.buffers.pocket_drop = b));
    new AudioLoader().load(boop, (b) => (this.buffers.boop = b));
    new AudioLoader().load(foul, (b) => (this.buffers.foul = b));
    new AudioLoader().load(win, (b) => (this.buffers.win = b));
    new AudioLoader().load(sad_trumpet, (b) => (this.buffers.sad_trumpet = b));
  }

  public play(
    audioName: keyof AudioBuffers,
    position?: Vector3,
    volume: number = 0.5
  ) {
    const buffer = this.buffers[audioName];
    if (!buffer) return;

    const audio = new PositionalAudio(this.listener);
    audio.setBuffer(buffer);
    audio.setRefDistance(20);
    if (position) audio.position.copy(position);
    audio.setVolume(volume);
    this.scene.add(audio);
    audio.play();

    audio.source!.onended = () => {
      this.scene.remove(audio);
      audio.disconnect();
    };
  }
}
