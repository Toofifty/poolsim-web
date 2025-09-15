import {
  ACESFilmicToneMapping,
  AmbientLight,
  AudioListener,
  AudioLoader,
  Camera,
  Clock,
  DirectionalLight,
  DirectionalLightHelper,
  Line,
  MathUtils,
  Mesh,
  MOUSE,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PositionalAudio,
  Raycaster,
  RectAreaLight,
  Scene,
  SpotLight,
  SpotLightHelper,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import Stats from 'stats.js';
import {
  EffectComposer,
  OrbitControls,
  OutputPass,
  RectAreaLightHelper,
  RectAreaLightUniformsLib,
  RenderPass,
  Sky,
  SSAOPass,
} from 'three/examples/jsm/Addons.js';
import clackUrl from '../assets/clack.wav';
import breakUrl from '../assets/break.wav';
import { GameManager } from './game-manager';
import { Profiler } from './profiler';
import { settings } from './settings';
import { subscribe } from 'valtio';
import { properties } from './physics/properties';

type AudioBuffers = Partial<Record<'clack' | 'break', AudioBuffer>>;

export class Game {
  // rendering
  public scene: Scene;
  public renderer: WebGLRenderer;
  public composer: EffectComposer;
  public camera: Camera;
  public controls: OrbitControls;
  public stats: Stats;
  public sun!: DirectionalLight;

  // game
  public mousePosition: Vector2;
  public mouseRaycaster: Raycaster;
  public manager: GameManager;
  public clock: Clock;
  private accumulator = 0;
  private timestep = 1 / properties.updatesPerSecond;

  private audioListener: AudioListener;
  private audioBuffers: AudioBuffers = {};

  public static instance: Game;
  public static profiler = new Profiler();

  constructor() {
    Game.instance = this;
    this.mousePosition = new Vector2(0, 0);
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.scene = new Scene();

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(25, aspect, 0.1, 4000);

    // const frustumHeight = 200;
    // const frustumWidth = frustumHeight * aspect;
    // this.camera = new OrthographicCamera(
    //   -frustumWidth / 2,
    //   frustumWidth / 2,
    //   frustumHeight / 2,
    //   -frustumHeight / 2,
    //   0.1,
    //   2000
    // );

    this.camera.position.z = 400;
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

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
    ssao.maxDistance = 0.1;

    // ssao.output = SSAOPass.OUTPUT.Blur;
    this.composer.addPass(ssao);
    this.composer.addPass(new OutputPass());

    this.audioListener = new AudioListener();
    this.camera.add(this.audioListener);

    new AudioLoader().load(clackUrl, (buffer) => {
      this.audioBuffers.clack = buffer;
    });
    new AudioLoader().load(breakUrl, (buffer) => {
      this.audioBuffers.break = buffer;
    });

    this.mouseRaycaster = new Raycaster();

    this.setupRectLights();
    this.setupAmbientLight();
    this.setupSky();
    this.setupListeners();
    // this.setupLights();

    this.manager = new GameManager();
    this.scene.add(this.manager.table.object3D);
    this.clock = new Clock();

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
      this.manager.mousedown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.manager.keyup(e);
    });
  }

  private setupRectLights() {
    RectAreaLightUniformsLib.init();

    const lightParent = new Object3D();
    lightParent.position.set(0, 0, 100);
    this.scene.add(lightParent);

    const createRectAreaLight = (x: number, y: number) => {
      const ral = new RectAreaLight(0xffffff, 10, 60, 60);
      ral.position.set(x, y, 0);
      lightParent.add(ral);
      const ralh = new RectAreaLightHelper(ral);
      lightParent.add(ralh);
      const sl = new SpotLight(0xffffff, 1);
      sl.decay = 2;
      sl.castShadow = true;
      sl.shadow.bias = -0.00005;
      sl.shadow.mapSize.set(2048, 2048);
      sl.shadow.camera.near = 50;
      sl.shadow.camera.far = 300;
      sl.position.set(x, y, 10);
      sl.target.position.set(x, y, 0);
      sl.target.updateMatrixWorld();
      lightParent.add(sl);
      const slh = new SpotLightHelper(sl);
      lightParent.add(slh);

      ralh.visible = false;
      slh.visible = false;
      subscribe(settings, () => {
        ralh.visible = settings.debugLights;
        slh.visible = settings.debugLights;
      });

      return ral;
    };

    createRectAreaLight(-100, -50);
    createRectAreaLight(0, -50);
    createRectAreaLight(100, -50);

    createRectAreaLight(-100, 50);
    createRectAreaLight(0, 50);
    createRectAreaLight(100, 50);
  }

  private setupAmbientLight() {
    const light = new AmbientLight(0xffffff);
    light.intensity = 0.5;
    this.scene.add(light);
  }

  private setupSky() {
    const sky = new Sky();
    sky.scale.setScalar(45000);
    const phi = MathUtils.degToRad(190);
    const theta = MathUtils.degToRad(45);
    const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value = sunPosition;
    sky.material.uniforms.up.value = new Vector3(0, 0, 1);
    this.scene.add(sky);
  }

  private setupLights() {
    const intensities = [1.5, 1.1, 1.9, 1.8];

    const r = 100;
    const loff = 200;
    const lheight = 400;
    const lightTL = new DirectionalLight(0xffffff, intensities[0]);
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

    const lightTR = new DirectionalLight(0xffffff, intensities[1]);
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

    const lightBL = new DirectionalLight(0xffffff, intensities[2]);
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

    const lightBR = new DirectionalLight(0xffffff, intensities[3]);
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

    const helpers = [
      new DirectionalLightHelper(lightTL),
      new DirectionalLightHelper(lightTR),
      new DirectionalLightHelper(lightBL),
      new DirectionalLightHelper(lightBR),
    ];

    subscribe(settings, () => {
      if (settings.debugLights) {
        this.scene.add(...helpers);
      } else {
        this.scene.remove(...helpers);
      }
    });
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

  public static add(mesh: Mesh | Line) {
    this.instance.scene.add(mesh);
  }

  public static remove(mesh: Mesh | Line) {
    this.instance.scene.remove(mesh);
  }

  public static resetCamera() {
    this.instance.camera.position.set(0, 0, 400);
    this.instance.controls.update();
  }

  public static get manager() {
    return this.instance.manager;
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

  get table() {
    return this.manager.table;
  }

  public draw() {
    this.stats.begin();
    this.controls.update();

    const dt = this.clock.getDelta();
    this.accumulator += dt;

    // physics step
    while (this.accumulator >= this.timestep) {
      this.manager.update(this.timestep);
      this.accumulator -= this.timestep;
    }

    this.composer.render();
    this.stats.end();
  }
}
