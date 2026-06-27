import * as THREE from 'three';
import { createTrafficCar, createTrafficTruck, createVehicle } from './vehicles.js';

const LANE_X = 3.25;
const ROAD_LENGTH = 44;
const ROAD_COUNT = 12;

const mat = (color, roughness = .7, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

function shadow(object) {
  object.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; child.updateMatrix(); child.matrixAutoUpdate=false; } });
  return object;
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
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.05,8,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(1,.85,1);g.add(glow);
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

function createRoadSystem(){
  const group=new THREE.Group();const dummy=new THREE.Object3D();
  const asphalt=new THREE.InstancedMesh(new THREE.BoxGeometry(12,.14,ROAD_LENGTH),mat(0x24292a,.86,.03),ROAD_COUNT);
  const shoulders=new THREE.InstancedMesh(new THREE.BoxGeometry(.55,.1,ROAD_LENGTH),mat(0xb8b5aa,.82),ROAD_COUNT*2);
  const rails=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,.24,ROAD_LENGTH),mat(0x798080,.42,.5),ROAD_COUNT*2);
  const dashesPerSegment=12;const dashes=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.025,4.3),mat(0xe8e3cd,.6),ROAD_COUNT*dashesPerSegment);
  const edgeLines=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.025,ROAD_LENGTH),mat(0xf0ede0,.6),ROAD_COUNT*2);
  const trunks=new THREE.InstancedMesh(new THREE.BoxGeometry(.24,1.6,.24),mat(0x5c3c28,.9),ROAD_COUNT*2);
  const foliage=new THREE.InstancedMesh(new THREE.ConeGeometry(1.02,2.95,7),mat(0x31543a,.95),ROAD_COUNT*2);
  const place=(mesh,index,x,y,z,scale=1)=>{dummy.position.set(x,y,z);dummy.scale.setScalar(scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);};
  for(let segment=0;segment<ROAD_COUNT;segment++){
    const baseZ=20-segment*ROAD_LENGTH;place(asphalt,segment,0,-.08,baseZ);
    place(shoulders,segment*2,-6.35,-.03,baseZ);place(shoulders,segment*2+1,6.35,-.03,baseZ);
    place(rails,segment*2,-6.83,.62,baseZ);place(rails,segment*2+1,6.83,.62,baseZ);
    let dashIndex=segment*dashesPerSegment;for(const x of [-1.625,1.625])for(let z=-19;z<22;z+=8)place(dashes,dashIndex++,x,.02,baseZ+z);
    place(edgeLines,segment*2,-5.72,.02,baseZ);place(edgeLines,segment*2+1,5.72,.02,baseZ);
    place(trunks,segment*2,-9.3,.8,baseZ-3);place(trunks,segment*2+1,9.3,.8,baseZ+6);
    place(foliage,segment*2,-9.3,2.4,baseZ-3,.92);place(foliage,segment*2+1,9.3,2.4,baseZ+6,1.08);
  }
  for(const mesh of [asphalt,shoulders,rails,dashes,edgeLines,trunks,foliage]){mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingSphere();group.add(mesh);}
  return group;
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
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.shadowMapType=this.mobile?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;this.renderer.shadowMap.type=this.shadowMapType;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    this.entityObjects=new Map();this.entityPools=new Map();this.entityTemplates=new Map();this.menuTime=0;this.stageId='';this.stageSkyTarget=new THREE.Color(0xe8935e);this.stageFogTarget=new THREE.Color(0xcf8d66);this.targetX=0;this.truckX=0;this.displayMode='road';this.syncFrame=0;this.qualityLevel='high';this.quality={rainPoints:900,roadParticles:120,fogFar:255,dpr:this.mobile?1.35:1.7};
    this.build();
    addEventListener('resize',()=>this.resize());
    canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
  }

  build() {
    this.hemi=new THREE.HemisphereLight(0xffd8aa,0x2b3e37,2.25);this.scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight(0xffc58b,4.3);this.sun.position.set(-28,32,-42);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.camera.left=-20;this.sun.shadow.camera.right=20;this.sun.shadow.camera.top=25;this.sun.shadow.camera.bottom=-8;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=120;this.scene.add(this.sun);
    const sunDisc=new THREE.Mesh(new THREE.CircleGeometry(7,32),new THREE.MeshBasicMaterial({color:0xffd099,fog:false}));sunDisc.position.set(-65,34,-230);this.scene.add(sunDisc);
    this.roadSystem=createRoadSystem();this.scene.add(this.roadSystem);
    this.activeVehicle={id:'urbano',body:'urban',accent:'#c52035'};this.player=createVehicle(this.activeVehicle,{},true);this.player.position.set(0,.05,5);this.scene.add(this.player);
    this.sign=createSign();this.scene.add(this.sign);
    this.buildBackground();this.buildRain();this.buildGarage();this.buildRoadParticles();this.buildEntityPools();
  }

  buildBackground(){
    const dummy=new THREE.Object3D();this.city=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat(0x4a5553,.9),22);for(let i=0;i<22;i++){const h=4+(i*17%13);dummy.position.set(-48+i*4.5,h/2,-180-(i%3)*5);dummy.scale.set(3+(i%3),h,3);dummy.rotation.set(0,0,0);dummy.updateMatrix();this.city.setMatrixAt(i,dummy.matrix);this.city.setColorAt(i,new THREE.Color(i%4===0?0x37484a:0x4a5553));}this.city.instanceMatrix.setUsage(THREE.StaticDrawUsage);this.city.computeBoundingSphere();this.scene.add(this.city);
    this.mountains=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),mat(0x496f69,1),12);for(let i=0;i<12;i++){dummy.position.set(-135+i*25,12,-245-(i%2)*22);dummy.scale.set(24+(i%3)*8,32+(i%4)*7,24+(i%3)*8);dummy.rotation.set(0,i*.41,0);dummy.updateMatrix();this.mountains.setMatrixAt(i,dummy.matrix);this.mountains.setColorAt(i,new THREE.Color(i%2?0x365d5b:0x496f69));}this.mountains.instanceMatrix.setUsage(THREE.StaticDrawUsage);this.mountains.computeBoundingSphere();this.scene.add(this.mountains);
  }

  buildRain(){
    const positions=new Float32Array(900*3);for(let i=0;i<900;i++){positions[i*3]=(Math.random()-.5)*45;positions[i*3+1]=Math.random()*24;positions[i*3+2]=-Math.random()*95+15;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));this.rain=new THREE.Points(geo,new THREE.PointsMaterial({color:0xcbe2e7,size:.08,transparent:true,opacity:.52}));this.rain.visible=false;this.scene.add(this.rain);
  }

  buildRoadParticles(){
    const positions=new Float32Array(120*3);for(let i=0;i<120;i++){positions[i*3]=(Math.random()-.5)*4;positions[i*3+1]=Math.random()*.5;positions[i*3+2]=3+Math.random()*5;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));this.roadParticles=new THREE.Points(geo,new THREE.PointsMaterial({color:0xcbb694,size:.12,transparent:true,opacity:.18,depthWrite:false}));this.scene.add(this.roadParticles);
  }

  cloneTemplate(template){
    const userData=template.userData;template.userData={};const clone=template.clone(true);template.userData=userData;clone.userData.wheels=[];clone.traverse(child=>{if(child.name==='wheel')clone.userData.wheels.push(child);});return clone;
  }

  registerPool(key,template,count){
    this.entityTemplates.set(key,template);const pool=[];this.entityPools.set(key,pool);for(let i=0;i<count;i++){const object=this.cloneTemplate(template);object.visible=false;object.userData.poolKey=key;this.scene.add(object);pool.push(object);}
  }

  buildEntityPools(){
    const colors=[0x31586b,0x9b3038,0xddd7c7,0x314344];colors.forEach((color,index)=>this.registerPool(`obstacle:car:${index}`,createTrafficCar(color),2));
    this.registerPool('obstacle:truck',createTrafficTruck(),5);this.registerPool('obstacle:barrier',createBarrier(),3);
    ['box','fuel','turbo','shield','magnet'].forEach(type=>this.registerPool(`collectible:${type}`,createCollectible(type),3));
  }

  entityPoolKey(entity){return entity.kind==='obstacle'&&entity.type==='car'?`obstacle:car:${entity.id%4}`:`${entity.kind}:${entity.type}`;}
  acquireEntity(entity){const key=this.entityPoolKey(entity);const pool=this.entityPools.get(key);let object=pool?.pop();if(!object){object=this.cloneTemplate(this.entityTemplates.get(key));object.userData.poolKey=key;this.scene.add(object);}object.visible=this.displayMode==='road';return object;}
  releaseEntity(object){object.visible=false;object.position.set(0,-100,0);this.entityPools.get(object.userData.poolKey)?.push(object);}

  buildGarage(){
    this.garage=new THREE.Group();this.garage.visible=false;
    const floor=new THREE.Mesh(new THREE.CircleGeometry(11,48),new THREE.MeshStandardMaterial({color:0x101719,roughness:.28,metalness:.45}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;this.garage.add(floor);
    const ring=new THREE.Mesh(new THREE.RingGeometry(5.8,6.0,48),new THREE.MeshBasicMaterial({color:0x6e1722,transparent:true,opacity:.72,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.012;this.garage.add(ring);
    for(let i=0;i<7;i++){const panel=box(4.05,7,.12,mat(i%2?0x0c1214:0x131b1d,.92));panel.position.set(-12+i*4,3.5,9);this.garage.add(panel);}
    this.garageKey=new THREE.SpotLight(0xffd2a2,7,35,.48,.65,1.2);this.garageKey.position.set(-7,10,8);this.garageKey.target.position.set(0,1,0);this.garageKey.castShadow=true;this.garageKey.shadow.mapSize.set(1024,1024);this.garage.add(this.garageKey,this.garageKey.target);
    this.garageRim=new THREE.SpotLight(0xb81d34,10,28,.42,.72,1.4);this.garageRim.position.set(8,5,-5);this.garageRim.target.position.set(0,1,1);this.garage.add(this.garageRim,this.garageRim.target);this.scene.add(this.garage);
  }

  setPlayerVehicle(vehicle, custom){
    const signature=`${vehicle.id}|${custom.cabin||''}|${custom.wheels||''}|${custom.chassis||''}|${custom.stripe||''}|${custom.tint||''}|${custom.implement||''}`;if(signature===this.playerSignature)return;this.playerSignature=signature;
    const old=this.player;const position=old?.position.clone()||new THREE.Vector3(0,.05,5);const rotation=old?.rotation.clone();if(old)this.scene.remove(old);
    this.player=createVehicle(vehicle,custom,true);this.player.position.copy(position);if(rotation)this.player.rotation.copy(rotation);this.scene.add(this.player);this.activeVehicle=vehicle;this.activeCustom=custom;
  }

  setDisplayMode(mode){
    this.displayMode=mode;const garage=mode==='garage';this.garage.visible=garage;this.roadSystem.visible=!garage;this.sign.visible=!garage;this.city.visible=!garage;this.mountains.visible=!garage;this.rain.visible=false;this.roadParticles.visible=!garage;
    for(const object of this.entityObjects.values())object.visible=!garage;
    if(garage){this.player.position.set(0,0,0);this.player.rotation.set(0,.55,0);this.camera.position.set(this.mobile?7.8:8.3,this.mobile?5.2:4.6,this.mobile?-15:-11.5);this.camera.lookAt(0,1.55,.3);this.scene.background.set(0x071013);this.scene.fog.color.set(0x071013);this.scene.fog.near=35;this.scene.fog.far=85;this.hemi.intensity=1.05;this.sun.intensity=.35;this.renderer.toneMappingExposure=1.28;}
    else{this.player.position.set(0,.05,5);this.player.rotation.set(0,0,0);this.camera.position.set(0,this.mobile?7.8:6.7,this.mobile?24:18.5);}
  }

  reset(){for(const object of this.entityObjects.values())this.releaseEntity(object);this.entityObjects.clear();this.roadSystem.position.z=0;this.targetX=0;this.truckX=0;this.player.position.x=0;this.player.rotation.z=0;}

  sync(sim,dt){
    this.menuTime+=dt;this.syncFrame++;
    if(this.displayMode==='garage'){
      const longVehicle=['bitrem','rodotrem'].includes(this.activeVehicle?.body)||(this.activeCustom?.implement&&this.activeCustom.implement!=='none');const targetScale=longVehicle ? .7 : (this.mobile ? .86 : 1.1);this.player.scale.setScalar(targetScale);this.player.position.y=.04+Math.sin(this.menuTime*1.6)*.015;this.player.rotation.y+=dt*.16;this.player.userData.wheels?.forEach(w=>w.rotation.x-=dt*.16);
      this.camera.position.x=THREE.MathUtils.damp(this.camera.position.x,this.mobile?7.8:8.3,3,dt);this.camera.position.y=THREE.MathUtils.damp(this.camera.position.y,this.mobile?5.2:4.6,3,dt);this.camera.position.z=THREE.MathUtils.damp(this.camera.position.z,this.mobile?-15:-11.5,3,dt);this.camera.fov=THREE.MathUtils.damp(this.camera.fov,this.mobile?57:48,3,dt);this.camera.lookAt(0,1.55,longVehicle?2.4:.3);this.camera.updateProjectionMatrix();return;
    }
    this.player.scale.setScalar(1);const visualSpeed=sim.mode==='menu'?10:sim.mode==='playing'?sim.speed:0;
    this.roadSystem.position.z+=visualSpeed*dt;if(this.roadSystem.position.z>ROAD_LENGTH)this.roadSystem.position.z-=ROAD_LENGTH;
    this.sign.position.z+=visualSpeed*dt;if(this.sign.position.z>35)this.sign.position.z=-ROAD_LENGTH*7;
    this.targetX=sim.targetLane*LANE_X;this.truckX=THREE.MathUtils.damp(this.truckX,this.targetX,9,dt);this.player.position.x=this.truckX;
    const laneDelta=this.targetX-this.truckX;this.player.rotation.z=THREE.MathUtils.damp(this.player.rotation.z,-laneDelta*.055,8,dt);const engineVibe=Math.sin(this.menuTime*23)*.006;const suspension=Math.sin(this.menuTime*5.2)*.017+Math.sin(this.menuTime*9.7)*.006;this.player.position.y=.05+engineVibe+suspension+(Math.abs(laneDelta)*.018);
    this.player.userData.wheels.forEach(w=>w.rotation.x-=visualSpeed*dt*.9);
    for(let index=0;index<sim.entities.length;index++){const entity=sim.entities[index];let object=this.entityObjects.get(entity.id);if(!object){object=this.acquireEntity(entity);this.entityObjects.set(entity.id,object);}object.userData.seenFrame=this.syncFrame;object.visible=entity.z>=this.quality.entityReveal;object.position.x=entity.lane*LANE_X;object.position.z=entity.z;if(entity.kind==='collectible'){object.rotation.y=entity.spin;object.position.y=1.4+Math.sin(entity.spin*2)*.16;}else{object.position.y=.02;object.userData.wheels?.forEach(w=>w.rotation.x-=visualSpeed*dt*.8);}}
    for(const [id,object] of this.entityObjects){if(object.userData.seenFrame!==this.syncFrame){this.releaseEntity(object);this.entityObjects.delete(id);}}
    this.updateStage(sim.stage,dt);this.updateRain(dt,sim.stage.rain);this.updateRoadParticles(dt,sim.stage.rain,visualSpeed);this.player.userData.headlightMaterial.emissiveIntensity=sim.stage.night>0.5?2.4:0;
    const turbo=sim.turbo>0;const baseZ=this.mobile?24:18.5;const baseFov=this.mobile?59:53;this.camera.position.z=THREE.MathUtils.damp(this.camera.position.z,turbo?baseZ+1.8:baseZ,3,dt);this.camera.position.y=THREE.MathUtils.damp(this.camera.position.y,this.mobile?7.8:6.7,4,dt);this.camera.position.x=THREE.MathUtils.damp(this.camera.position.x,this.truckX*.72,5,dt);this.camera.fov=THREE.MathUtils.damp(this.camera.fov,turbo?baseFov+6:baseFov,3,dt);this.camera.lookAt(this.camera.position.x*.45,1.15,-24);this.camera.updateProjectionMatrix();
  }

  updateStage(stage,dt){
    if(stage.id!==this.stageId){this.stageId=stage.id;this.stageSkyTarget.setHex(stage.sky);this.stageFogTarget.setHex(stage.fog);}
    const k=1-Math.exp(-dt*.7);this.scene.background.lerp(this.stageSkyTarget,k);this.scene.fog.color.lerp(this.stageFogTarget,k);this.scene.fog.near=THREE.MathUtils.lerp(this.scene.fog.near,stage.id==='neblina'?22:48,k);this.scene.fog.far=THREE.MathUtils.lerp(this.scene.fog.far,Math.min(stage.id==='neblina'?115:255,this.quality.fogFar),k);
    this.hemi.intensity=THREE.MathUtils.lerp(this.hemi.intensity,2.25-stage.night*1.35,k);this.sun.intensity=THREE.MathUtils.lerp(this.sun.intensity,4.3-stage.night*3.2,k);this.renderer.toneMappingExposure=THREE.MathUtils.lerp(this.renderer.toneMappingExposure,1.12-stage.night*.28,k);
    this.city.visible=['cidade','industrial'].includes(stage.id);this.mountains.visible=!this.city.visible;
  }

  updateRain(dt,amount){this.rain.visible=amount>.05;this.rain.material.opacity=.18+amount*.5;if(!this.rain.visible)return;const p=this.rain.geometry.attributes.position.array;const end=this.quality.rainPoints*3;for(let i=1;i<end;i+=3){p[i]-=dt*(24+amount*35);p[i+2]+=dt*10;if(p[i]<0){p[i]=22;p[i+2]=-Math.random()*90;}}this.rain.geometry.attributes.position.needsUpdate=true;}
  updateRoadParticles(dt,rain,speed){const p=this.roadParticles.geometry.attributes.position.array;this.roadParticles.material.color.setHex(rain>.3?0xb9d3d8:0xcbb694);this.roadParticles.material.opacity=speed>15 ? .12+rain*.28 : 0;const end=this.quality.roadParticles*3;for(let i=0;i<end;i+=3){p[i]+=(Math.random()-.5)*dt*1.2;p[i+1]+=dt*(.35+rain*1.8);p[i+2]+=dt*(1.5+speed*.08);if(p[i+1]>1.4||p[i+2]>10){p[i]=(Math.random()-.5)*3.6;p[i+1]=.05;p[i+2]=3.8+Math.random()*2.5;}}this.roadParticles.geometry.attributes.position.needsUpdate=true;}
  setQuality(level){
    const mobile=this.mobile;const presets={high:{rainPoints:mobile?650:900,roadParticles:mobile?90:120,fogFar:255,dpr:mobile?1.35:1.7,shadow:mobile?768:1024,entityReveal:-165},balanced:{rainPoints:420,roadParticles:58,fogFar:215,dpr:mobile?1.12:1.4,shadow:512,entityReveal:-115},low:{rainPoints:240,roadParticles:32,fogFar:175,dpr:1,shadow:384,entityReveal:-78}};
    this.qualityLevel=level;this.quality=presets[level];this.rain.geometry.setDrawRange(0,this.quality.rainPoints);this.roadParticles.geometry.setDrawRange(0,this.quality.roadParticles);this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.quality.dpr));
    if(this.sun.shadow.mapSize.x!==this.quality.shadow){this.sun.shadow.mapSize.set(this.quality.shadow,this.quality.shadow);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;}
    this.renderer.shadowMap.type=this.shadowMapType;this.renderer.shadowMap.needsUpdate=true;
  }
  getDiagnostics(){return{quality:this.qualityLevel,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,activeEntities:this.entityObjects.size};}
  render(){this.renderer.render(this.scene,this.camera);}
  resize(){this.camera.aspect=innerWidth/innerHeight;this.mobile=this.camera.aspect<.66;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.setQuality(this.qualityLevel);}
}
