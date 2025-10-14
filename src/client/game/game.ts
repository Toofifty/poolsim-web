import Stats from 'stats.js';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Camera,
  Clock,
  Color,
  MathUtils,
  Mesh,
  MOUSE,
  Object3D,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Raycaster,
  RectAreaLight,
  Scene,
  SpotLight,
  SpotLightHelper,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  EffectComposer,
  OrbitControls,
  OutlinePass,
  OutputPass,
  RectAreaLightHelper,
  RectAreaLightUniformsLib,
  RenderPass,
  Sky,
  SSAOPass,
  SSRPass,
} from 'three/examples/jsm/Addons.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { subscribe } from 'valtio';
import type { ECS } from '../../common/ecs';
import type { Vec } from '../../common/math';
import { type Params } from '../../common/simulation/physics';
import { Profiler } from '../../common/util/profiler';
import { Audio } from './audio';
import type { GameController } from './controller/game-controller';
import { InputController } from './controller/input-controller';
import { OfflineGameController } from './controller/offline-game-controller';
import { OnlineGameController } from './controller/online-game-controller';
import { _dlerpGame } from './dlerp';
import { createECS } from './ecs';
import type { GameEvents } from './events';
import { createNeonLightStrips } from './models/table/create-neon-light-strips';
import type { NetworkAdapter } from './network/network-adapter';
import { Debug } from './objects/debug';
import { BlackOutlinePass } from './rendering/black-outline-pass';
import { GraphicsDetail, settings } from './store/settings';
import { makeTheme } from './store/theme';
import { toVector2 } from './util/three-interop';

const hdrTextureUrl = new URL('../assets/map.hdr', import.meta.url).toString();

export class Game {
  // rendering
  public scene!: Scene;
  public overlay!: Scene;
  public outlinedOverlays: Set<Object3D> = new Set();
  public renderer!: WebGLRenderer;
  public composer!: EffectComposer;
  public overlayComposer!: EffectComposer;

  public darkOutlineScene!: Scene;
  public lightOutlineScene!: Scene;
  public redOutlineScene!: Scene;
  public darkOutlinePass!: OutlinePass;
  public lightOutlinePass!: OutlinePass;
  public redOutlinePass!: OutlinePass;

  public camera!: Camera;
  public controls!: OrbitControls;
  public stats!: Stats;

  // game
  public mousePosition!: Vector2;
  public mouseRaycaster!: Raycaster;
  public controller!: GameController;
  public clock!: Clock;
  private accumulator = 0;
  private timestep: number;
  public lerps: Set<(dt: number) => void> = new Set();
  private input!: InputController;

  public audio!: Audio;

  public static instance: Game;
  public static debug: Debug;
  public static audio: Audio;
  public static profiler = new Profiler();

  public static reflectives: Mesh[] = [];

  public ecs!: ECS<GameEvents, Game>;

  private mounted: boolean = false;

  constructor(private adapter: NetworkAdapter, private params: Params) {
    this.init();
    this.timestep = 1 / params.simulation.updatesPerSecond;
  }

  init() {
    this.mounted = true;
    Game.instance = this;
    _dlerpGame.instance = this;
    this.mousePosition = new Vector2(0, 0);
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.top = 'unset';
    this.stats.dom.style.bottom = '0';
    document.body.appendChild(this.stats.dom);

    this.scene = new Scene();
    this.scene.background = new Color(0x151729);
    this.overlay = new Scene();
    this.darkOutlineScene = new Scene();
    this.lightOutlineScene = new Scene();
    this.redOutlineScene = new Scene();

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
      this.camera = new PerspectiveCamera(50, aspect, 0.01, 10);
    }

    this.camera.position.z = 2;
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;
    this.renderer.autoClear = false;

    if (settings.detail !== GraphicsDetail.Low) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.type = PCFSoftShadowMap;
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: MOUSE.PAN,
      RIGHT: MOUSE.ROTATE,
    };
    this.controls.enabled = settings.enableZoomPan;

    subscribe(settings, () => {
      this.controls.enabled = settings.enableZoomPan;
    });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // this.composer.addPass(new RenderPixelatedPass(5, this.scene, this.camera));

    if (settings.detail !== GraphicsDetail.Low) {
      const ssao = new SSAOPass(this.scene, this.camera);
      ssao.kernelRadius = 0.01;
      ssao.minDistance = 0.001;
      ssao.maxDistance = 0.01;
      this.composer.addPass(ssao);
    }

    if (settings.detail === GraphicsDetail.High) {
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

    const overlayRender = new RenderPass(this.overlay, this.camera);
    overlayRender.clear = false;
    this.composer.addPass(overlayRender);

    // apparently this is the pass resolution??
    const outlinePassSize = new Vector2(1, 1);

    const lightOutlineRender = new RenderPass(
      this.lightOutlineScene,
      this.camera
    );
    lightOutlineRender.clear = false;
    this.composer.addPass(lightOutlineRender);
    this.lightOutlinePass = new OutlinePass(
      outlinePassSize,
      this.lightOutlineScene,
      this.camera
    );
    this.lightOutlinePass.visibleEdgeColor = new Color(0xffffff);
    this.lightOutlinePass.hiddenEdgeColor = new Color(0xffffff);
    this.lightOutlinePass.edgeStrength = 1;
    this.lightOutlinePass.pulsePeriod = 2;
    this.lightOutlinePass.edgeGlow = 5;
    this.composer.addPass(this.lightOutlinePass);

    const redOutlineRender = new RenderPass(this.redOutlineScene, this.camera);
    redOutlineRender.clear = false;
    this.composer.addPass(redOutlineRender);
    this.redOutlinePass = new OutlinePass(
      outlinePassSize,
      this.redOutlineScene,
      this.camera
    );
    this.redOutlinePass.visibleEdgeColor = new Color(0xff0000);
    this.redOutlinePass.hiddenEdgeColor = new Color(0xff0000);
    this.redOutlinePass.edgeStrength = 5;
    this.redOutlinePass.pulsePeriod = 10;
    // this.redOutlinePass.edgeGlow = 0;
    this.composer.addPass(this.redOutlinePass);

    const darkOutlineRender = new RenderPass(
      this.darkOutlineScene,
      this.camera
    );
    darkOutlineRender.clear = false;
    this.composer.addPass(darkOutlineRender);
    this.darkOutlinePass = new BlackOutlinePass(
      outlinePassSize,
      this.darkOutlineScene,
      this.camera
    );
    this.darkOutlinePass.visibleEdgeColor = new Color(0x000000);
    this.darkOutlinePass.hiddenEdgeColor = new Color(0x000000);
    this.darkOutlinePass.edgeStrength = 2;
    this.darkOutlinePass.edgeGlow = 0;
    this.composer.addPass(this.darkOutlinePass);

    this.composer.addPass(new OutputPass());

    if (settings.detail !== GraphicsDetail.Low) {
      this.composer.addPass(new FXAAPass());
    }

    this.mouseRaycaster = new Raycaster();
    Game.debug = new Debug();
    this.scene.add(Game.debug);
    this.audio = new Audio(this.scene);
    Game.audio = this.audio;
    this.camera.add(this.audio.listener);

    this.setupInputController();
    window.addEventListener('resize', this.onResize);

    this.setupRectLights();
    this.setupAmbientLight();
    this.setupSky();

    this.controller = this.adapter.isMultiplayer
      ? new OnlineGameController(this.params, this.input, this.adapter)
      : new OfflineGameController(this.params, this.input);
    this.scene.add(this.controller.root);

    this.clock = new Clock();

    this.ecs = createECS(this);
    // this.ecs.emit('game/setup', {
    //   rack: Rack.generateSandboxGame(this.params, 'debug'),
    //   ruleset: RuleSet.Sandbox,
    // });
    this.renderer.setAnimationLoop(this.draw.bind(this));

    // HDR image
    // new HDRLoader().load(hdrTextureUrl, (texture) => {
    //   texture.mapping = EquirectangularReflectionMapping;

    //   const rotX90 = new Matrix3().set(1, 0, 0, 0, 0, 1, 0, -1, 0);
    //   texture.matrixAutoUpdate = false;
    //   texture.matrix = rotX90;

    //   this.scene.background = texture;
    //   this.scene.environment = texture;

    //   this.scene.backgroundRotation = new Euler(Math.PI / 2, 0, 0, 'XYZ');
    //   this.scene.environmentRotation = new Euler(Math.PI / 2, 0, 0, 'XYZ');
    // });
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

  private setupInputController() {
    this.input = new InputController(this.renderer.domElement);
    this.input.register();

    this.input.onKeyDown((e) => {
      switch (e.key) {
        case 'Shift':
          this.controls.enableZoom = false;
          return;
      }
    });

    this.input.onKeyUp((e) => {
      this.ecs.emit('input/key-pressed', {
        key: e.key,
        original: e,
      });

      switch (e.key) {
        case 'l':
          this.ecs.emit('input/lock-cue', {});
          return;
        case 'r':
          Game.resetCamera();
          return;
        case ' ':
          settings.pauseSimulation = !settings.pauseSimulation;
          return;
        case 'Shift':
          this.controls.enableZoom = true;
          return;
      }
    });

    this.input.onMouseMove((e) => {
      const { left, top, width, height } = (
        e.target as HTMLElement
      ).getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      this.ecs.emit('input/mouse-move', {
        x: (x / width) * 2 - 1,
        y: -(y / height) * 2 + 1,
        original: e,
      });
    });

    this.input.onTouchMove((e) => {
      const { left, top, width, height } = (
        e.target as HTMLElement
      ).getBoundingClientRect();
      const [touch] = e.touches;

      const x = touch.clientX - left;
      const y = touch.clientY - top;

      this.ecs.emit('input/mouse-move', {
        x: (x / width) * 2 - 1,
        y: -(y / height) * 2 + 1,
        original: e,
      });
    });

    this.input.onMouseDown((e) => {
      this.ecs.emit('input/mouse-pressed', { button: e.button, original: e });
    });
  }

  private onResize = () => {
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

    const createCeilingLight = (
      x: number,
      y: number,
      w: number,
      h: number,
      intensity: number
    ) => {
      const ral = new RectAreaLight(0xfff1e0, intensity, w, h);
      ral.position.set(x, y, 0);
      lightParent.add(ral);
      const ralh = new RectAreaLightHelper(ral);
      lightParent.add(ralh);
      const sl = new SpotLight(0xfff1e0, 1);
      sl.decay = 2;
      sl.castShadow = true;
      sl.shadow.bias = -0.00000000005;
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
    const spy = 0.8;

    const { lighting } = makeTheme();

    if (lighting.theme === 'neon') {
      console.log('neon');
      createCeilingLight(
        0,
        -spy,
        0.8,
        0.4,
        settings.detail === GraphicsDetail.High ? 2 : 4
      );
      createCeilingLight(
        0,
        spy,
        0.8,
        0.4,
        settings.detail === GraphicsDetail.High ? 2 : 4
      );

      const lights = createNeonLightStrips(this.params);
      this.scene.add(...lights);

      return;
    }

    createCeilingLight(0, 0, 1.6, 0.1, 120);
    // createCeilingLight(spy, 0, 0.8, 0.4, 40);
  }

  private setupAmbientLight() {
    this.scene.add(new AmbientLight(0xffffff, 0.5));

    this.overlay.add(new AmbientLight(0xffffff, 10));
    this.darkOutlineScene.add(new AmbientLight(0xffffff, 10));
    this.lightOutlineScene.add(new AmbientLight(0xffffff, 10));
    this.redOutlineScene.add(new AmbientLight(0xffffff, 10));
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

  public static getFirstMouseIntersection(object: Object3D, point?: Vec) {
    const intersections = Game.instance
      .getMouseRaycaster(point)
      .intersectObject(object);
    if (intersections.length > 0) {
      return intersections[0].point;
    }
    return undefined;
  }

  public add(obj: Object3D, { outline }: { outline?: boolean } = {}) {
    this.overlay.add(obj);
    if (outline) {
      this.outlinedOverlays.add(obj);
      this.darkOutlinePass.selectedObjects = [...this.outlinedOverlays];
    }
  }

  public static add(obj: Object3D, { outline }: { outline?: boolean } = {}) {
    this.instance.add(obj);
  }

  public remove(obj: Object3D) {
    this.overlay.remove(obj);
    if (this.outlinedOverlays.has(obj)) {
      this.outlinedOverlays.delete(obj);
      this.darkOutlinePass.selectedObjects = [...this.outlinedOverlays];
    }
  }

  public static remove(obj: Object3D) {
    this.instance.remove(obj);
  }

  public static resetCamera() {
    this.instance.controls.target.set(0, 0, 0);
    this.instance.camera.position.set(0, 0, 2);
    this.instance.controls.update();
  }

  public static focusCueBall() {
    const target = this.instance.controller.balls[0].position;
    this.instance.controls.target.copy(target);
    this.instance.controls.update();
  }

  public getMouseRaycaster(point?: Vec) {
    this.mouseRaycaster.setFromCamera(
      toVector2(point ?? this.input.mouse),
      this.camera
    );
    return this.mouseRaycaster;
  }

  public static dispose(...objs: any[]) {
    objs.forEach((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: any) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  public mount(container: HTMLDivElement | null) {
    if (container) {
      this.safeInit();
      container.insertBefore(this.renderer.domElement, container.firstChild);
    }

    return () => {
      // dispose
      this.renderer.setAnimationLoop(null);
      this.input.unregister();
      window.removeEventListener('resize', this.onResize);
      this.scene.traverse(Game.dispose);
      this.renderer.dispose();
      this.renderer.forceContextLoss();

      if (this.controller instanceof OnlineGameController) {
        this.controller.disconnect();
      }

      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement
        );
      }
      this.mounted = false;
    };
  }

  public draw() {
    this.stats.begin();
    this.controls.update();

    const dt = this.clock.getDelta() * this.params.simulation.playbackSpeed;
    if (dt < 1) {
      // when the tab is inactive we don't run simulations,
      // and the delta after coming back will be huge
      this.accumulator += dt;
    } else {
      console.warn(
        `skipping ${(dt / this.timestep).toFixed(
          0
        )} game updates over ${dt.toFixed(2)}s`
      );
    }

    // physics step
    while (this.accumulator >= this.timestep) {
      this.controller.update(this.timestep);
      this.ecs.update(this.timestep);
      this.accumulator -= this.timestep;
    }

    // run lerps
    this.lerps.forEach((lerp) => lerp(dt));

    this.composer.render();
    this.stats.end();
  }
}

(window as any).Game = Game;
