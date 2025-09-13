import {
  ACESFilmicToneMapping,
  AmbientLight,
  AudioListener,
  AudioLoader,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  MOUSE,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PositionalAudio,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import Stats from 'stats.js';
import { Table } from './objects/table';
import { Ball } from './objects/ball';
import { Rack } from './rack';
import {
  EffectComposer,
  OrbitControls,
  OutputPass,
  RenderPass,
  SSAOPass,
} from 'three/examples/jsm/Addons.js';
import clackUrl from '../assets/clack.wav';

const DEBUG_LIGHTS = false;

type AudioBuffers = Partial<Record<'clack', AudioBuffer>>;

export class Game {
  // rendering
  public scene: Scene;
  public renderer: WebGLRenderer;
  public composer: EffectComposer;
  public camera: PerspectiveCamera;
  public controls: OrbitControls;
  public stats: Stats;
  public sun!: DirectionalLight;

  // game
  public mousePosition: Vector2;
  public mouseRaycaster: Raycaster;
  public table!: Table;

  private audioListener: AudioListener;
  private audioBuffers: AudioBuffers = {};

  public static instance: Game;

  constructor() {
    Game.instance = this;
    this.mousePosition = new Vector2(0, 0);
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      25,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 400;
    this.camera.up.set(0, 0, 1);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enablePan = false;
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: MOUSE.ROTATE,
      RIGHT: null,
    };

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const ssao = new SSAOPass(this.scene, this.camera);
    ssao.kernelRadius = 1;
    ssao.minDistance = 0.001;
    ssao.maxDistance = 1;

    // ssao.output = SSAOPass.OUTPUT.Blur;
    this.composer.addPass(ssao);
    this.composer.addPass(new OutputPass());

    this.audioListener = new AudioListener();
    this.camera.add(this.audioListener);

    new AudioLoader().load(clackUrl, (buffer) => {
      this.audioBuffers.clack = buffer;
    });

    this.mouseRaycaster = new Raycaster();

    this.setupListeners();
    this.setupLights();
    this.setupTable();

    this.renderer.setAnimationLoop(this.draw.bind(this));
  }

  get width() {
    return window.innerWidth;
  }

  get height() {
    return window.innerHeight;
  }

  private setupListeners() {
    const el = this.renderer.domElement;

    if (!el) {
      return;
    }

    el.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      this.mousePosition.x = (x / width) * 2 - 1;
      this.mousePosition.y = -(y / height) * 2 + 1;
    });

    el.addEventListener('mousedown', (e) => {
      this.table.mousedown(e);
    });
  }

  private setupLights() {
    const light = new AmbientLight(0xffffff);
    light.intensity = 2;
    this.scene.add(light);

    const r = 100;
    const loff = 200;
    const lheight = 400;
    const lightTL = new DirectionalLight(0xffffff, 0.5);
    lightTL.shadow.bias = -0.00005;
    lightTL.shadow.mapSize.set(4096, 4096);
    lightTL.castShadow = true;
    lightTL.shadow.camera.left = -r;
    lightTL.shadow.camera.top = r;
    lightTL.shadow.camera.bottom = -r;
    lightTL.shadow.camera.right = r;
    lightTL.shadow.camera.far = 400;
    lightTL.position.x = -loff;
    lightTL.position.y = loff;
    lightTL.position.z = lheight;
    this.scene.add(lightTL);

    const lightTR = new DirectionalLight(0xffffff, 1.1);
    lightTR.shadow.bias = -0.00005;
    lightTR.shadow.mapSize.set(4096, 4096);
    lightTR.castShadow = true;
    lightTR.shadow.camera.left = -r;
    lightTR.shadow.camera.top = r;
    lightTR.shadow.camera.bottom = -r;
    lightTR.shadow.camera.right = r;
    lightTR.shadow.camera.far = lheight * 2;
    lightTR.position.x = loff;
    lightTR.position.y = loff;
    lightTR.position.z = lheight;
    this.scene.add(lightTR);

    const lightBL = new DirectionalLight(0xffffff, 0.9);
    lightBL.shadow.bias = -0.00005;
    lightBL.shadow.mapSize.set(4096, 4096);
    lightBL.castShadow = true;
    lightBL.shadow.camera.left = -r;
    lightBL.shadow.camera.top = r;
    lightBL.shadow.camera.bottom = -r;
    lightBL.shadow.camera.right = r;
    lightBL.shadow.camera.far = lheight * 2;
    lightBL.position.x = -loff;
    lightBL.position.y = -loff;
    lightBL.position.z = lheight;
    this.scene.add(lightBL);

    const lightBR = new DirectionalLight(0xffffff, 1.4);
    lightBR.shadow.bias = -0.00005;
    lightBR.shadow.mapSize.set(4096, 4096);
    lightBR.castShadow = true;
    lightBR.shadow.camera.left = -r;
    lightBR.shadow.camera.top = r;
    lightBR.shadow.camera.bottom = -r;
    lightBR.shadow.camera.right = r;
    lightBR.shadow.camera.far = lheight * 2;
    lightBR.position.x = loff;
    lightBR.position.y = -loff;
    lightBR.position.z = lheight;
    this.scene.add(lightBR);

    if (DEBUG_LIGHTS) {
      this.scene.add(new DirectionalLightHelper(lightTL));
      this.scene.add(new DirectionalLightHelper(lightTR));
      this.scene.add(new DirectionalLightHelper(lightBL));
      this.scene.add(new DirectionalLightHelper(lightBR));
    }

    // this.sun = new DirectionalLight(0xffffff, 2.5);
    // this.sun.shadow.bias = -0.00005;
    // this.sun.shadow.mapSize.set(4096, 4096);
    // this.sun.castShadow = true;
    // const r = 100;
    // this.sun.shadow.camera.left = -r;
    // this.sun.shadow.camera.top = r;
    // this.sun.shadow.camera.bottom = -r;
    // this.sun.shadow.camera.right = r;
    // this.sun.shadow.camera.far = 200;
    // this.scene.add(this.sun);

    // const phi = MathUtils.degToRad(90 - sun.elevation);
    // const theta = MathUtils.degToRad(sun.azimuth);

    // this.sun.position.setFromSphericalCoords(100, phi, theta);
  }

  private setupTable() {
    this.table = new Table();
    const cueBall = new Ball(-40, 0, new Color('#FFF'));
    this.table.add(cueBall);
    const balls = Rack.generate8Ball(40, 0);
    balls.forEach((ball) => this.table.add(ball));
    this.scene.add(this.table.getObject());
  }

  public static getFirstMouseIntersection(object: Object3D) {
    const intersections = Game.instance
      .getMouseRaycaster()
      .intersectObject(object);
    if (intersections.length > 0) {
      return intersections[0].point;
    }
    return undefined;
  }

  public playAudio(
    audioName: keyof AudioBuffers,
    position: Vector3,
    volume: number = 0.5
  ) {
    const buffer = this.audioBuffers[audioName];
    if (!buffer) return;

    const audio = new PositionalAudio(this.audioListener);
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

  public static playAudio(
    audioName: keyof AudioBuffers,
    position: Vector3,
    volume: number = 0.5
  ) {
    return this.instance.playAudio(audioName, position, volume);
  }

  public getMouseRaycaster() {
    this.mouseRaycaster.setFromCamera(this.mousePosition, this.camera);
    return this.mouseRaycaster;
  }

  public mount(container: HTMLDivElement | null) {
    if (container) {
      container.insertBefore(this.renderer.domElement, container.firstChild);
    } else {
      this.renderer.domElement.remove();
    }
  }

  public draw() {
    this.stats.begin();
    this.controls.update();
    this.table.update();
    this.composer.render();
    this.stats.end();
  }
}
