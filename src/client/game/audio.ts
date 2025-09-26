import {
  AudioListener,
  AudioLoader,
  Object3D,
  PositionalAudio,
  Vector3,
} from 'three';
import clack_mid from '../assets/clack_mid.wav';
import hit_centre from '../assets/hit_centre.wav';
import pocket_drop from '../assets/pocket_drop.wav';

type AudioBuffers = Partial<
  Record<'clack_mid' | 'hit_centre' | 'pocket_drop', AudioBuffer>
>;

export class Audio {
  public listener: AudioListener;
  private buffers: AudioBuffers;

  constructor(private scene: Object3D) {
    this.listener = new AudioListener();
    this.buffers = {};

    new AudioLoader().load(clack_mid, (b) => (this.buffers.clack_mid = b));
    new AudioLoader().load(hit_centre, (b) => (this.buffers.hit_centre = b));
    new AudioLoader().load(pocket_drop, (b) => (this.buffers.pocket_drop = b));
  }

  public play(
    audioName: keyof AudioBuffers,
    position: Vector3,
    volume: number = 0.5
  ) {
    const buffer = this.buffers[audioName];
    if (!buffer) return;

    const audio = new PositionalAudio(this.listener);
    audio.setBuffer(buffer);
    audio.setRefDistance(20);
    audio.position.copy(position);
    audio.setVolume(volume);
    this.scene.add(audio);
    audio.play();

    audio.source!.onended = () => {
      this.scene.remove(audio);
      audio.disconnect();
    };
  }
}
