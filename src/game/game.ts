import {
  ACESFilmicToneMapping,
  AmbientLight,
  AudioListener,
  AudioLoader,
  Camera,
  Clock,
  MathUtils,
  Mesh,
  MOUSE,
  Object3D,
  OrthographicCamera,
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
  SSRPass,
} from 'three/examples/jsm/Addons.js';
import clackUrl from '../assets/clack.wav';
import breakUrl from '../assets/break.wav';
import { GameManager } from './game-manager';
import { Profiler } from './profiler';
import { settings } from './store/settings';
import { subscribe } from 'valtio';
import { properties } from './physics/properties';
import { makeTheme } from './store/theme';
import { createNeonLightStrips } from './models/table/create-neon-light-strips';
import { Debug } from './physics/debug';

type AudioBuffers = Partial<Record<'clack' | 'break', AudioBuffer>>;

export class Game {
  // rendering
  public scene!: Scene;
  public renderer!: WebGLRenderer;
  public composer!: EffectComposer;
  public camera!: Camera;
  public controls!: OrbitControls;
  public stats!: Stats;

  // game
  public mousePosition!: Vector2;
  public mouseRaycaster!: Raycaster;
  public manager!: GameManager;
  public clock!: Clock;
  private accumulator = 0;
  private timestep = 1 / properties.updatesPerSecond;
  public lerps: Set<(dt: number) => void> = new Set();

  private audioListener!: AudioListener;
  private audioBuffers: AudioBuffers = {};

  public static instance: Game;
  public static debug: Debug;
  public static profiler = new Profiler();

  public static reflectives: Mesh[] = [];

  private mounted: boolean = false;

  constructor() {
    this.init();
  }

  init() {
    this.mounted = true;
    Game.instance = this;
    this.mousePosition = new Vector2(0, 0);
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.top = 'unset';
    this.stats.dom.style.bottom = '0';
    document.body.appendChild(this.stats.dom);

    this.scene = new Scene();

    const aspect = window.innerWidth / window.innerHeight;

    if (settings.ortho) {
      const frustumHeight = 2;
      const frustumWidth = frustumHeight * aspect;
      this.camera = new OrthographicCamera(
        -frustumWidth / 2,
        frustumWidth / 2,
        frustumHeight / 2,
        -frustumHeight / 2
      );
    } else {
      this.camera = new PerspectiveCamera(50, aspect, 0.1, 400);
    }

    this.camera.position.z = 2;
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
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: MOUSE.ROTATE,
      RIGHT: MOUSE.PAN,
    };

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    if (settings.highDetail) {
      const ssao = new SSAOPass(this.scene, this.camera);
      ssao.kernelRadius = 1;
      ssao.minDistance = 0.001;
      ssao.maxDistance = 0.1;

      // ssao.output = SSAOPass.OUTPUT.Blur;
      this.composer.addPass(ssao);

      const ssr = new SSRPass({
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
        width: window.innerWidth,
        height: window.innerHeight,
        groundReflector: null,
        selects: Game.reflectives,
      });

      this.composer.addPass(ssr);
    }
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
    Game.debug = new Debug();
    this.scene.add(Game.debug);

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

  public safeInit() {
    if (!this.mounted) this.init();
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

    el.addEventListener('mousemove', this.onMouseMove);
    el.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
  }

  private teardownListeners() {
    const el = this.renderer.domElement;

    if (!el) {
      return;
    }

    el.removeEventListener('mousemove', this.onMouseMove);
    el.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
  }

  private onMouseMove = (e: MouseEvent) => {
    const { left, top, width, height } =
      this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    this.mousePosition.x = (x / width) * 2 - 1;
    this.mousePosition.y = -(y / height) * 2 + 1;
  };

  private onMouseDown = (e: MouseEvent) => {
    this.manager.mousedown(e);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Shift':
        this.controls.enableZoom = false;
        return;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'l':
        settings.lockCue = !settings.lockCue;
        return;
      case 'Shift':
        this.controls.enableZoom = true;
        return;
    }

    this.manager.keyup(e);
  };

  private onResize = () => {
    console.log('onresize');
    const container = this.renderer.domElement.parentElement;
    if (container) {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      this.renderer.setSize(w, h);
      if (this.camera instanceof PerspectiveCamera) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      }
    }
  };

  private setupRectLights() {
    RectAreaLightUniformsLib.init();

    const lightParent = new Object3D();
    lightParent.position.set(0, 0, 1);
    this.scene.add(lightParent);

    const createCeilingLight = (x: number, y: number, intensity: number) => {
      const ral = new RectAreaLight(0xffffff, intensity, 0.8, 0.4);
      ral.position.set(x, y, 0);
      lightParent.add(ral);
      const ralh = new RectAreaLightHelper(ral);
      lightParent.add(ralh);
      const sl = new SpotLight(0xffffff, 1);
      sl.decay = 2;
      sl.castShadow = true;
      sl.shadow.bias = -0.000005;
      sl.shadow.mapSize.set(2048, 2048);
      sl.shadow.camera.near = 0.1;
      sl.shadow.camera.far = 5;
      sl.position.set(x, y, 1);
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

    const sp = 0.4;
    const spy = 0.4;

    const { lighting } = makeTheme();

    if (lighting.theme === 'neon') {
      createCeilingLight(0, -spy, settings.highDetail ? 2 : 4);
      createCeilingLight(0, spy, settings.highDetail ? 2 : 4);

      const lights = createNeonLightStrips();
      this.scene.add(...lights);

      return;
    }

    createCeilingLight(0, -spy, settings.highDetail ? 10 : 20);
    createCeilingLight(0, spy, settings.highDetail ? 10 : 20);

    if (settings.highDetail) {
      createCeilingLight(-sp * 2, -spy, settings.highDetail ? 10 : 20);
      createCeilingLight(sp * 2, -spy, settings.highDetail ? 10 : 20);

      createCeilingLight(-sp * 2, spy, settings.highDetail ? 10 : 20);
      createCeilingLight(sp * 2, spy, settings.highDetail ? 10 : 20);
    }
  }

  private setupAmbientLight() {
    const light = new AmbientLight(0xffffff);
    light.intensity = settings.highDetail ? 0.5 : 1.5;
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

  public static getFirstMouseIntersection(object: Object3D) {
    const intersections = Game.instance
      .getMouseRaycaster()
      .intersectObject(object);
    if (intersections.length > 0) {
      return intersections[0].point;
    }
    return undefined;
  }

  public static add(obj: Object3D) {
    this.instance.scene.add(obj);
  }

  public static remove(obj: Object3D) {
    this.instance.scene.remove(obj);
  }

  public static resetCamera() {
    this.instance.controls.target.set(0, 0, 0);
    this.instance.camera.position.set(0, 0, 2);
    this.instance.controls.update();
  }

  public static focusCueBall() {
    const target = this.instance.table.balls[0].position;
    this.instance.controls.target.copy(target);
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

  public static dispose(obj: any) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }

  public mount(container: HTMLDivElement | null) {
    if (container) {
      this.safeInit();
      container.insertBefore(this.renderer.domElement, container.firstChild);
    }

    return () => {
      // dispose
      this.renderer.setAnimationLoop(null);
      this.teardownListeners();
      this.scene.traverse((obj: any) => {
        Game.dispose(obj);
      });
      this.renderer.dispose();
      this.renderer.forceContextLoss();

      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement
        );
      }
      this.mounted = false;
    };
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

    // run lerps
    this.lerps.forEach((lerp) => lerp(dt));

    this.composer.render();
    this.stats.end();
  }
}
