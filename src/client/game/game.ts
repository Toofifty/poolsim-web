import Stats from 'stats.js';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Camera,
  Clock,
  Color,
  MOUSE,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import {
  EffectComposer,
  OrbitControls,
  OutlinePass,
  OutputPass,
  RenderPass,
  SSAOPass,
  SSRPass,
} from 'three/examples/jsm/Addons.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { subscribe } from 'valtio';
import type { ECS } from '../../common/ecs';
import { type Params } from '../../common/simulation/physics';
import { InputController } from './controller/input-controller';
import { _dlerpGame } from './dlerp';
import type { GameEvents } from './events';
import { BlackOutlinePass } from './rendering/black-outline-pass';
import { GraphicsDetail, settings } from './store/settings';
import { UpdateCounter } from './util/update-counter';

export class Game {
  // rendering
  public scene!: Scene;
  public overlay!: Scene;
  public renderer!: WebGLRenderer;
  public composer!: EffectComposer;

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
  public clock!: Clock;
  private accumulator = 0;
  private timestep: number;
  public lerps: Set<(dt: number) => void> = new Set();
  private input!: InputController;

  public static instance: Game;

  private mounted: boolean = false;

  public updateCounter = new UpdateCounter();
  public fixedUpdateCounter = new UpdateCounter();

  constructor(public ecs: ECS<GameEvents, Game>, public params: Params) {
    this.init();
    this.timestep = 1 / params.simulation.updatesPerSecond;
  }

  init() {
    this.mounted = true;
    Game.instance = this;
    _dlerpGame.instance = this;
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
        // todo: reflectives
        selects: [],
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

    this.setupInputController();
    window.addEventListener('resize', this.onResize);

    this.setupAmbientLight();

    this.clock = new Clock();

    this.renderer.setAnimationLoop(this.draw.bind(this));
  }

  public safeInit() {
    if (!this.mounted) this.init();
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

    this.input.onMouseMove((event) => {
      this.ecs.emit('input/mouse-move', {
        position: this.input.getRelativeMouse(event),
        original: event,
      });
    });

    this.input.onTouchStart((event) => {
      this.ecs.emit('input/touch-start', {
        position: this.input.getRelativeTouch(event),
        original: event,
      });
    });

    this.input.onTouchMove((event) => {
      this.ecs.emit('input/touch-move', {
        position: this.input.getRelativeTouch(event),
        original: event,
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

  private setupAmbientLight() {
    this.scene.add(new AmbientLight(0xffffff, 0.5));

    this.overlay.add(new AmbientLight(0xffffff, 5));
    this.darkOutlineScene.add(new AmbientLight(0xffffff, 5));
    this.lightOutlineScene.add(new AmbientLight(0xffffff, 5));
    this.redOutlineScene.add(new AmbientLight(0xffffff, 5));
  }

  public static resetCamera() {
    this.instance.controls.target.set(0, 0, 0);
    this.instance.camera.position.set(0, 0, 2);
    this.instance.controls.update();
  }

  public static focusCueBall() {
    throw new Error('Not implemented');
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

  public draw() {
    this.stats.begin();
    this.controls.update();

    const dt = this.clock.getDelta();
    if (dt < 1) {
      // when the tab is inactive we don't run simulations,
      // and the delta after coming back will be huge
      this.accumulator += dt * this.params.simulation.playbackSpeed;
    } else {
      console.warn(
        `skipping ${(dt / this.timestep).toFixed(
          0
        )} game updates over ${dt.toFixed(2)}s`
      );
    }

    // game step
    while (this.accumulator >= this.timestep) {
      this.ecs.fixedUpdate(this.timestep);
      this.fixedUpdateCounter.tick();
      this.accumulator -= this.timestep;
    }

    this.ecs.update(Math.max(dt, 1));
    this.updateCounter.tick();

    // run lerps
    this.lerps.forEach((lerp) => lerp(dt));

    this.composer.render();
    this.stats.end();
  }
}

(window as any).Game = Game;
