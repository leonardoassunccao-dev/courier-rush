import * as THREE from 'three';

const LANE_X = 3.25;
const ROAD_LENGTH = 44;
const ROAD_COUNT = 12;

const mat = (color, roughness = .7, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

function shadow(object) {
  object.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  return object;
}

function createWheel(radius = .48, width = .3) {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), mat(0x111516, .85));
  tire.rotation.z = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .44, radius * .44, width + .02, 12), mat(0x9ca2a0, .32, .65));
  hub.rotation.z = Math.PI / 2;
  wheel.add(tire, hub);
  return wheel;
}

function createTruck(player = false) {
  const g = new THREE.Group();
  const white = mat(player ? 0xf0efeb : 0xcbd2d2, .38, .16);
  const dark = mat(0x111a1c, .28, .5);
  const cargo = box(player ? 3.05 : 2.75, player ? 2.9 : 2.65, player ? 5.2 : 4.8, white);
  cargo.position.set(0, 2.25, .9);
  const cabin = box(player ? 2.95 : 2.65, 2.25, 2.05, white);
  cabin.position.set(0, 1.85, -2.55);
  const windshield = box(2.35, .74, .05, new THREE.MeshPhysicalMaterial({ color: 0x24383d, roughness: .12, metalness: .15, transmission: .05 }));
  windshield.position.set(0, 2.34, -3.59);
  const bumper = box(2.8, .28, .25, dark); bumper.position.set(0, .72, -3.58);
  const under = box(2.3, .32, 6.5, dark); under.position.set(0, .67, .2);
  g.add(cargo, cabin, windshield, bumper, under);
  [[-1.35, -2.3], [1.35, -2.3], [-1.35, 2.15], [1.35, 2.15]].forEach(([x,z]) => { const w = createWheel(.52,.34); w.position.set(x,.65,z); g.add(w); });
  const red = new THREE.MeshStandardMaterial({ color: 0x7b050a, emissive: 0xff1020, emissiveIntensity: 2.8, toneMapped: false });
  [-.9,.9].forEach(x => { const light = box(.42,.16,.07,red); light.position.set(x,1.1,3.52); g.add(light); });
  if (player) {
    const stripe = box(3.08,.22,5.22,mat(0xb7162c,.4,.18)); stripe.position.set(0,1.18,.9); g.add(stripe);
    const logo = box(1.3,.35,.035,mat(0x99152a,.5)); logo.position.set(0,2.25,3.53); g.add(logo);
    const plate = box(.75,.18,.05,mat(0xe5e4dd,.7)); plate.position.set(0,.86,3.57); g.add(plate);
  }
  g.userData.wheels = g.children.filter(c => c.type === 'Group');
  return shadow(g);
}

function createCar(color = 0x31586b) {
  const g = new THREE.Group();
  const bodyMat = mat(color,.3,.35);
  const body = box(2.15,.72,4.1,bodyMat); body.position.y=.75;
  const roof = box(1.75,.68,2.1,bodyMat); roof.position.set(0,1.42,-.15);
  const glass = box(1.78,.42,.08,mat(0x16262c,.2,.5)); glass.position.set(0,1.53,-1.24);
  g.add(body,roof,glass);
  [[-1.03,-1.25],[1.03,-1.25],[-1.03,1.25],[1.03,1.25]].forEach(([x,z])=>{const w=createWheel(.34,.22);w.position.set(x,.48,z);g.add(w);});
  return shadow(g);
}

function createBarrier() {
  const g = new THREE.Group();
  const orange = mat(0xe46724,.58);
  for(let i=-1;i<=1;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.28,.9,10),orange);cone.position.set(i*.8,.45,0);g.add(cone);const band=box(.46,.09,.46,mat(0xf2eee3,.7));band.position.set(i*.8,.48,0);g.add(band);}
  const rail=box(2.7,.34,.18,mat(0xe9e6dd,.65));rail.position.y=.95;g.add(rail);return shadow(g);
}

function createCollectible(type) {
  const g = new THREE.Group();
  let color = 0xc9853b;
  if(type==='fuel') color=0xb41d2c;if(type==='turbo')color=0xf0a51e;if(type==='shield')color=0x2389b6;if(type==='magnet')color=0xc42b3b;
  const glow = new THREE.PointLight(color, 2.4, 7, 2); glow.position.y=.3; g.add(glow);
  if(type==='box') {
    const cube=box(1.05,1.05,1.05,mat(color,.72)); cube.rotation.y=.2; g.add(cube);
    const tape=box(.2,1.07,1.07,mat(0xe3b16a,.7)); tape.rotation.y=.2;g.add(tape);
  } else if(type==='fuel') {
    const can=box(.82,1.25,.42,mat(color,.38,.22));g.add(can);const handle=new THREE.Mesh(new THREE.TorusGeometry(.22,.07,8,14,Math.PI),mat(0x1b2324));handle.position.set(0,.72,0);g.add(handle);
  } else if(type==='turbo') {
    const bolt=new THREE.Mesh(new THREE.OctahedronGeometry(.72,0),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.2,roughness:.25}));bolt.scale.set(.58,1.35,.35);g.add(bolt);
  } else if(type==='shield') {
    const shield=new THREE.Mesh(new THREE.CylinderGeometry(.68,.52,.24,6),new THREE.MeshPhysicalMaterial({color,emissive:0x0b5b7f,emissiveIntensity:.7,metalness:.5,roughness:.2,transparent:true,opacity:.9}));shield.rotation.x=Math.PI/2;g.add(shield);
  } else {
    const magnet=new THREE.Mesh(new THREE.TorusGeometry(.55,.2,10,18,Math.PI),mat(color,.32,.3));magnet.rotation.z=Math.PI;g.add(magnet);
  }
  g.position.y=1.35; return shadow(g);
}

function createTree(seed) {
  const g=new THREE.Group();const trunk=box(.24,1.6,.24,mat(0x5c3c28,.9));trunk.position.y=.8;g.add(trunk);
  const foliage=new THREE.Mesh(new THREE.ConeGeometry(.9+seed*.25,2.7+seed*.5,7),mat(seed>.5?0x294d39:0x365b3b,.95));foliage.position.y=2.4;g.add(foliage);return g;
}

function createRoadSegment(index) {
  const g = new THREE.Group();
  const asphalt=box(12,.14,ROAD_LENGTH,mat(0x24292a,.86,.03));asphalt.position.y=-.08;asphalt.receiveShadow=true;g.add(asphalt);
  [-6.35,6.35].forEach(x=>{const shoulder=box(.55,.1,ROAD_LENGTH,mat(0xb8b5aa,.82));shoulder.position.set(x,-.03,0);g.add(shoulder);const rail=box(.14,.24,ROAD_LENGTH,mat(0x798080,.42,.5));rail.position.set(x>0?x+.48:x-.48,.62,0);g.add(rail);});
  [-1.625,1.625].forEach(x=>{for(let z=-19;z<22;z+=8){const dash=box(.12,.025,4.3,mat(0xe8e3cd,.6));dash.position.set(x,.02,z);g.add(dash);}});
  [-5.72,5.72].forEach(x=>{const line=box(.13,.025,ROAD_LENGTH,mat(0xf0ede0,.6));line.position.set(x,.02,0);g.add(line);});
  for(let s=-1;s<=1;s+=2){const seed=((index*7+s*3)%11+11)%11/10;const tree=createTree(seed);tree.position.set(s*(8.5+seed*2),0,-10+seed*19);tree.scale.setScalar(.8+seed*.45);g.add(tree);}
  g.position.z = 20 - index*ROAD_LENGTH; return g;
}

function createSign() {
  const g=new THREE.Group();const pole=box(.16,4.8,.16,mat(0x697474,.45,.5));pole.position.set(-5.4,2.4,0);g.add(pole);
  const arm=box(5.4,.14,.14,mat(0x697474,.45,.5));arm.position.set(-2.7,4.7,0);g.add(arm);
  const board=box(4.2,1.55,.12,mat(0x175a43,.56,.08));board.position.set(-1.9,4.35,.05);g.add(board);
  const line1=box(2.9,.08,.03,mat(0xe8eee7,.7));line1.position.set(-1.9,4.62,.12);g.add(line1);
  const line2=box(2.2,.07,.03,mat(0xe8eee7,.7));line2.position.set(-2.25,4.15,.12);g.add(line2);g.position.z=-120;return g;
}

export class GameWorld {
  constructor(canvas) {
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0xe8935e);this.scene.fog=new THREE.Fog(0xcf8d66,45,250);
    this.camera=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.1,600);this.camera.position.set(0,6.2,14);this.camera.lookAt(0,1,-24);this.mobile=innerWidth/innerHeight<.66;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    this.clock=new THREE.Clock();this.entityObjects=new Map();this.road=[];this.menuTime=0;this.stageId='';this.targetX=0;this.truckX=0;
    this.build();
    addEventListener('resize',()=>this.resize());
    canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
  }

  build() {
    this.hemi=new THREE.HemisphereLight(0xffd8aa,0x2b3e37,2.25);this.scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight(0xffc58b,4.3);this.sun.position.set(-28,32,-42);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.camera.left=-20;this.sun.shadow.camera.right=20;this.sun.shadow.camera.top=25;this.sun.shadow.camera.bottom=-8;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=120;this.scene.add(this.sun);
    const sunDisc=new THREE.Mesh(new THREE.CircleGeometry(7,32),new THREE.MeshBasicMaterial({color:0xffd099,fog:false}));sunDisc.position.set(-65,34,-230);this.scene.add(sunDisc);
    for(let i=0;i<ROAD_COUNT;i++){const segment=createRoadSegment(i);this.road.push(segment);this.scene.add(segment);}
    this.player=createTruck(true);this.player.position.set(0,.05,5);this.scene.add(this.player);
    this.sign=createSign();this.scene.add(this.sign);
    this.buildBackground();this.buildRain();
  }

  buildBackground(){
    this.city=new THREE.Group();for(let i=0;i<22;i++){const h=4+(i*17%13);const b=box(3+(i%3),h,3,mat(i%4===0?0x37484a:0x4a5553,.9));b.position.set(-48+i*4.5,h/2,-180-(i%3)*5);this.city.add(b);}this.scene.add(this.city);
    this.mountains=new THREE.Group();for(let i=0;i<12;i++){const mountain=new THREE.Mesh(new THREE.ConeGeometry(24+(i%3)*8,32+(i%4)*7,5),mat(i%2?0x365d5b:0x496f69,1));mountain.position.set(-135+i*25,12,-245-(i%2)*22);mountain.rotation.y=i*.41;this.mountains.add(mountain);}this.scene.add(this.mountains);
  }

  buildRain(){
    const positions=new Float32Array(900*3);for(let i=0;i<900;i++){positions[i*3]=(Math.random()-.5)*45;positions[i*3+1]=Math.random()*24;positions[i*3+2]=-Math.random()*95+15;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));this.rain=new THREE.Points(geo,new THREE.PointsMaterial({color:0xcbe2e7,size:.08,transparent:true,opacity:.52}));this.rain.visible=false;this.scene.add(this.rain);
  }

  reset(){for(const object of this.entityObjects.values())this.scene.remove(object);this.entityObjects.clear();this.targetX=0;this.truckX=0;this.player.position.x=0;this.player.rotation.z=0;}

  sync(sim,dt){
    const visualSpeed=sim.mode==='menu'?10:sim.mode==='playing'?sim.speed:0;
    this.menuTime+=dt;
    for(const segment of this.road){segment.position.z+=visualSpeed*dt;if(segment.position.z>44)segment.position.z-=ROAD_LENGTH*ROAD_COUNT;}
    this.sign.position.z+=visualSpeed*dt;if(this.sign.position.z>35)this.sign.position.z=-ROAD_LENGTH*7;
    this.targetX=sim.targetLane*LANE_X;this.truckX=THREE.MathUtils.damp(this.truckX,this.targetX,9,dt);this.player.position.x=this.truckX;
    const laneDelta=this.targetX-this.truckX;this.player.rotation.z=THREE.MathUtils.damp(this.player.rotation.z,-laneDelta*.055,8,dt);this.player.position.y=.05+Math.sin(this.menuTime*7)*.018+(Math.abs(laneDelta)*.018);
    this.player.userData.wheels.forEach(w=>w.rotation.x-=visualSpeed*dt*.9);
    const live=new Set();
    sim.entities.forEach(entity=>{live.add(entity.id);let object=this.entityObjects.get(entity.id);if(!object){object=entity.kind==='obstacle'?(entity.type==='car'?createCar([0x31586b,0x9b3038,0xddd7c7,0x314344][entity.id%4]):entity.type==='truck'?createTruck(false):createBarrier()):createCollectible(entity.type);this.entityObjects.set(entity.id,object);this.scene.add(object);}object.position.x=entity.lane*LANE_X;object.position.z=entity.z;if(entity.kind==='collectible'){object.rotation.y=entity.spin;object.position.y=1.4+Math.sin(entity.spin*2)*.16;}else{object.position.y=.02;object.userData.wheels?.forEach(w=>w.rotation.x-=visualSpeed*dt*.8);}});
    for(const [id,object] of this.entityObjects){if(!live.has(id)){this.scene.remove(object);this.entityObjects.delete(id);}}
    this.updateStage(sim.stage,dt);this.updateRain(dt,sim.stage.rain);
    const turbo=sim.turbo>0;const baseZ=this.mobile?24:18.5;const baseFov=this.mobile?59:53;this.camera.position.z=THREE.MathUtils.damp(this.camera.position.z,turbo?baseZ+1.8:baseZ,3,dt);this.camera.position.y=THREE.MathUtils.damp(this.camera.position.y,this.mobile?7.8:6.7,4,dt);this.camera.position.x=THREE.MathUtils.damp(this.camera.position.x,this.truckX*.72,5,dt);this.camera.fov=THREE.MathUtils.damp(this.camera.fov,turbo?baseFov+6:baseFov,3,dt);this.camera.lookAt(this.camera.position.x*.45,1.15,-24);this.camera.updateProjectionMatrix();
  }

  updateStage(stage,dt){
    const k=1-Math.exp(-dt*.7);this.scene.background.lerp(new THREE.Color(stage.sky),k);this.scene.fog.color.lerp(new THREE.Color(stage.fog),k);this.scene.fog.near=THREE.MathUtils.lerp(this.scene.fog.near,stage.id==='neblina'?22:48,k);this.scene.fog.far=THREE.MathUtils.lerp(this.scene.fog.far,stage.id==='neblina'?115:255,k);
    this.hemi.intensity=THREE.MathUtils.lerp(this.hemi.intensity,2.25-stage.night*1.35,k);this.sun.intensity=THREE.MathUtils.lerp(this.sun.intensity,4.3-stage.night*3.2,k);this.renderer.toneMappingExposure=THREE.MathUtils.lerp(this.renderer.toneMappingExposure,1.12-stage.night*.28,k);
    this.city.visible=['cidade','industrial'].includes(stage.id);this.mountains.visible=!this.city.visible;
  }

  updateRain(dt,amount){this.rain.visible=amount>.05;this.rain.material.opacity=.18+amount*.5;if(!this.rain.visible)return;const p=this.rain.geometry.attributes.position.array;for(let i=1;i<p.length;i+=3){p[i]-=dt*(24+amount*35);p[i+2]+=dt*10;if(p[i]<0){p[i]=22;p[i+2]=-Math.random()*90;}}this.rain.geometry.attributes.position.needsUpdate=true;}
  render(){this.renderer.render(this.scene,this.camera);}
  resize(){this.camera.aspect=innerWidth/innerHeight;this.mobile=this.camera.aspect<.66;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.35:1.7));}
}
