import * as THREE from 'three';

const material = (color, roughness = .55, metalness = .12) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const cube = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

function add(group, mesh, x, y, z, name) {
  mesh.position.set(x, y, z); if (name) mesh.name = name; group.add(mesh); return mesh;
}

function cast(group) {
  group.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  return group;
}

function createWheel(radius, width, colors, detailed) {
  const wheel = new THREE.Group(); wheel.name = 'wheel';
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, detailed ? 20 : 12), material(0x0c0f10, .9));
  tire.rotation.z = Math.PI / 2; wheel.add(tire);
  const rimMat = material(colors.wheels, .24, .82);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * .48, radius * .48, width + .025, 12), rimMat);
  rim.rotation.z = Math.PI / 2; wheel.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .17, radius * .17, width + .045, 12), material(0x303638, .25, .8));
  hub.rotation.z = Math.PI / 2; wheel.add(hub);
  if (detailed) for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    const tread = cube(width + .035, .105, radius * .42, material(0x080a0b, .96));
    tread.position.set(0, Math.cos(angle) * radius, Math.sin(angle) * radius); tread.rotation.x = angle; wheel.add(tread);
  }
  return wheel;
}

function addAxle(group, z, colors, detailed) {
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.55, 10), material(colors.chassis, .5, .6));
  axle.rotation.z = Math.PI / 2; axle.position.set(0, .66, z); group.add(axle);
  [-1.38, 1.38].forEach(x => { const wheel = createWheel(.5, .34, colors, detailed); wheel.position.set(x, .66, z); group.add(wheel); });
}

function addFender(group, z, colors) {
  [-1.36, 1.36].forEach(x => {
    const fender = new THREE.Mesh(new THREE.TorusGeometry(.56, .075, 7, 14, Math.PI), material(colors.chassis, .5, .25));
    fender.rotation.y = Math.PI / 2; fender.rotation.z = Math.PI / 2; fender.position.set(x, .68, z); group.add(fender);
  });
}

function buildCab(group, colors, premium, detailed) {
  const cabinMat = new THREE.MeshPhysicalMaterial({ color: colors.cabin, roughness: premium ? .24 : .33, metalness: .24, clearcoat: premium ? .65 : .32, clearcoatRoughness: .28 });
  const dark = material(colors.chassis, .34, .52);
  const glass = new THREE.MeshPhysicalMaterial({ color: colors.tint, roughness: .08, metalness: .32, clearcoat: .8 });
  add(group, cube(2.82, 2.42, 2.22, cabinMat), 0, 1.92, -2.5, 'cabin');
  add(group, cube(2.72, .22, 1.75, cabinMat), 0, 3.22, -2.46, 'visor');
  add(group, cube(2.3, .74, .055, glass), 0, 2.4, -3.625, 'windshield');
  [-1,1].forEach(side=>{add(group,cube(.045,.72,1.02,glass),side*1.435,2.38,-2.62,'side-window');add(group,cube(.055,1.35,.035,dark),side*1.465,1.62,-2.28,'door-seam');add(group,cube(.06,.07,.32,material(0x687173,.3,.7)),side*1.47,1.92,-2.1,'door-handle');});
  add(group, cube(2.52, .6, .09, dark), 0, 1.38, -3.69, 'grille');
  for (let i = -2; i <= 2; i++) add(group, cube(.1, .42, .035, material(0x687173, .3, .7)), i * .42, 1.38, -3.75);
  add(group, cube(2.9, .3, .34, material(0x242c2e, .26, .72)), 0, .73, -3.61, 'bumper');
  const headMat = new THREE.MeshStandardMaterial({ color: 0xeef5e6, emissive: 0xffe9b0, emissiveIntensity: 0, roughness: .18 });
  [-.96, .96].forEach(x => add(group, cube(.54, .25, .08, headMat), x, 1.02, -3.76, 'headlight'));
  if (detailed) {
    [-1, 1].forEach(side => {
      add(group, cube(.1, .1, .75, dark), side * 1.52, 2.45, -3.12);
      const mirror = add(group, cube(.22, .43, .12, dark), side * 1.55, 2.46, -3.51); mirror.rotation.y = side * .12;
    });
    [-.55, .55].forEach((x, index) => { const wiper = add(group, cube(.035, .48, .035, dark), x, 2.28, -3.68); wiper.rotation.z = index ? -.72 : .72; });
    add(group, new THREE.Mesh(new THREE.CylinderGeometry(.11, .13, 2.1, 10), material(0x50595a, .35, .75)), 1.22, 1.65, -1.22, 'exhaust');
  }
  return { cabinMat, headMat };
}

function addBoxBody(group, colors, length, kind, startZ = .9) {
  const cargoMat = new THREE.MeshPhysicalMaterial({ color: kind === 'reefer' ? 0xe1e9e8 : colors.cabin, roughness: .42, metalness: .16, clearcoat: .18 });
  add(group, cube(3.02, 2.95, length, cargoMat), 0, 2.26, startZ, 'cargo');
  [-1,1].forEach(side=>{add(group,cube(.055,.12,length-.22,material(0x778081,.34,.62)),side*1.535,1.08,startZ,'side-reflector');for(let z=startZ-length/2+.45;z<startZ+length/2;z+=1.15)add(group,cube(.06,2.62,.075,material(0x8c9290,.42,.42)),side*1.54,2.28,z,'cargo-rib');});
  const rearZ = startZ + length / 2 + .035;
  add(group, cube(2.72, 2.55, .055, material(0xd8d6cf, .48, .22)), 0, 2.24, rearZ, 'rear-door');
  [-.77, .77].forEach(x => add(group, cube(.055, 2.42, .045, material(0x3e4748, .32, .76)), x, 2.24, rearZ + .04));
  if (kind === 'sider') for (let i = 0; i < 8; i++) add(group, cube(3.04, 2.68, .055, material(i % 2 ? 0x7f151f : 0xa51e2c, .66)), 0, 2.25, startZ - length / 2 + .4 + i * (length - .8) / 7);
  if (kind === 'reefer') {
    add(group, cube(2.25, .82, .25, material(0xbfc9c9, .38, .42)), 0, 2.72, startZ - length / 2 - .14, 'cooler');
    for (let i = -2; i <= 2; i++) add(group, cube(.16, .48, .025, material(0x5b6769, .4, .5)), i * .35, 2.71, startZ - length / 2 - .28);
  }
  if (kind === 'sider' || kind === 'long') for (let i = 0; i < 5; i++) add(group, cube(.045, 2.65, length - .08, material(0x818786, .4, .6)), -1.48 + i * .74, 2.25, startZ);
  return rearZ;
}

function addRearDetails(group, rearZ, colors) {
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x77050b, emissive: 0xff1025, emissiveIntensity: 2.3, toneMapped: false });
  [-.92, .92].forEach(x => add(group, cube(.48, .18, .075, tailMat), x, .98, rearZ + .08, 'taillight'));
  add(group, cube(2.86, .18, .08, material(colors.stripe, .38, .32)), 0, 1.18, rearZ + .07, 'reflective-stripe');
  add(group, cube(.82, .2, .045, material(0xe8e6de, .7)), 0, .76, rearZ + .12, 'plate');
}

function addTractorRear(group, colors, premium, detailed) {
  add(group, cube(2.38, .34, 3.9, material(colors.chassis, .32, .65)), 0, .71, -.05, 'chassis');
  add(group, new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, .2, 20), material(0x22292b, .6, .4)), 0, .98, .92, 'fifth-wheel').rotation.x = Math.PI / 2;
  addAxle(group, -2.15, colors, detailed); addAxle(group, .65, colors, detailed); addAxle(group, 1.8, colors, detailed);
  addFender(group, -2.15, colors); addFender(group, .65, colors); addFender(group, 1.8, colors);
  if (premium) add(group, cube(2.52, .18, 1.7, material(colors.stripe, .28, .55)), 0, 1.02, -1.55, 'premium-trim');
  addRearDetails(group, 2.1, colors);
}

function addImplement(group, type, colors, detailed) {
  if (!type || type === 'none') return;
  let rearZ = 7.5;
  if (['box','sider','reefer','container'].includes(type)) {
    rearZ = addBoxBody(group, colors, 6, type === 'box' || type === 'container' ? 'long' : type, 4.5);
    if (type === 'container') for (let z = 2; z < 7.2; z += .55) add(group, cube(3.05, 2.65, .045, material(0x7e3030,.72)), 0, 2.25, z);
  } else if (type === 'tank') {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.38,1.38,6,18),new THREE.MeshPhysicalMaterial({color:0xc7cecd,roughness:.28,metalness:.62,clearcoat:.45}));tank.rotation.x=Math.PI/2;add(group,tank,0,2.05,4.5,'tank');
    [-1.45,1.45].forEach(z=>{const band=new THREE.Mesh(new THREE.TorusGeometry(1.4,.07,8,18),material(0x434b4d,.3,.72));band.position.set(0,2.05,4.5+z);group.add(band);});
  } else if (type === 'grain') {
    add(group,cube(3.05,.5,6,material(0xa8a39a,.5,.32)),0,.95,4.5);
    [-1,1].forEach(side=>{const wall=cube(.12,2.2,6,material(0xa8a39a,.5,.32));wall.position.set(side*1.47,2.0,4.5);wall.rotation.z=side*.1;group.add(wall);});
    for(let z=2;z<7.4;z+=.8)add(group,cube(3,.1,.1,material(0x555e60,.35,.65)),0,3.04,z);
  } else {
    const count=type==='rodotrem'?3:2;const length=3.15;
    for(let i=0;i<count;i++){const center=3.15+i*3.45;rearZ=addBoxBody(group,colors,length,i%2?'sider':'long',center);}
  }
  add(group,cube(2.45,.28,Math.max(5.8,rearZ-1.8),material(colors.chassis,.35,.62)),0,.64,(rearZ+1.8)/2,'implement-chassis');
  addAxle(group,rearZ-1.4,colors,detailed);addAxle(group,rearZ-.35,colors,detailed);addRearDetails(group,rearZ,colors);
}

export function createVehicle(vehicle = { body: 'urban' }, custom = {}, detailed = true) {
  const colors = { cabin: custom.cabin || '#edece6', wheels: custom.wheels || '#a9ada9', chassis: custom.chassis || '#161d1f', stripe: custom.stripe || vehicle.accent || '#c52035', tint: custom.tint || '#182c33' };
  const group = new THREE.Group(); group.name = `vehicle-${vehicle.id || 'traffic'}`;
  const premium = ['premium', 'bitrem', 'rodotrem'].includes(vehicle.body);
  const lights = buildCab(group, colors, premium, detailed);
  let rearZ = 3.55;
  if (vehicle.body.startsWith('tractor') || vehicle.body === 'premium') {
    addTractorRear(group, colors, premium, detailed);
    addImplement(group, custom.implement, colors, detailed);
  } else if (vehicle.body === 'bitrem' || vehicle.body === 'rodotrem') {
    addTractorRear(group, colors, premium, detailed);
    rearZ = addBoxBody(group, colors, 3.7, 'long', 3.9); addRearDetails(group, rearZ, colors);
    if (vehicle.body === 'rodotrem') { rearZ = addBoxBody(group, colors, 3.4, 'sider', 7.7); addRearDetails(group, rearZ, colors); }
  } else {
    const length = vehicle.body === 'urban' ? 5.0 : vehicle.body === 'long' || vehicle.body === 'reefer' ? 7.0 : 6.0;
    rearZ = addBoxBody(group, colors, length, vehicle.body, vehicle.body === 'urban' ? .6 : 1.6);
    add(group, cube(2.32, .34, length + 2.0, material(colors.chassis, .35, .62)), 0, .66, .25, 'chassis');
    addAxle(group, -2.35, colors, detailed); addAxle(group, rearZ - 1.15, colors, detailed);
    addFender(group, -2.35, colors); addFender(group, rearZ - 1.15, colors); addRearDetails(group, rearZ, colors);
  }
  group.userData.wheels = group.children.filter(child => child.name === 'wheel');
  group.userData.headlights = group.children.filter(child => child.name === 'headlight');
  group.userData.taillights = group.children.filter(child => child.name === 'taillight');
  group.userData.cabinMaterial = lights.cabinMat;
  group.userData.headlightMaterial = lights.headMat;
  group.userData.baseY = 0;
  return cast(group);
}

export function createTrafficTruck() {
  return createVehicle({ id: 'traffic', body: Math.random() > .5 ? 'urban' : 'sider', accent: '#6f7b7b' }, { cabin: Math.random() > .5 ? '#cbd2d2' : '#7f8a88', stripe: '#7e242c' }, false);
}

export function createTrafficCar(color = 0x31586b) {
  const group = new THREE.Group(); const bodyMat = material(color, .32, .35);
  add(group, cube(2.15, .72, 4.1, bodyMat), 0, .75, 0);
  add(group, cube(1.75, .68, 2.1, bodyMat), 0, 1.42, -.15);
  add(group, cube(1.78, .42, .08, material(0x16262c, .18, .5)), 0, 1.53, -1.24);
  [[-1.03,-1.25],[1.03,-1.25],[-1.03,1.25],[1.03,1.25]].forEach(([x,z]) => { const wheel=createWheel(.34,.22,{wheels:'#9ca2a0'},false); wheel.position.set(x,.48,z); group.add(wheel); });
  group.userData.wheels = group.children.filter(child => child.name === 'wheel'); return cast(group);
}
