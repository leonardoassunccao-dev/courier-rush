export const FLEET = [
  { id: 'urbano', level: 1, name: 'Vértice U1', className: 'Baú Urbano', body: 'urban', accent: '#c52035', stats: [54, 72, 88, 76, 82, 48], note: 'Ágil, compacto e feito para a cidade.' },
  { id: 'sider', level: 5, name: 'Vértice S5', className: 'Sider', body: 'sider', accent: '#bb712f', stats: [60, 66, 74, 78, 76, 64], note: 'Versatilidade para rotas que mudam rápido.' },
  { id: 'longo', level: 10, name: 'Atlas L10', className: 'Baú Longo', body: 'long', accent: '#1f7792', stats: [66, 62, 60, 82, 72, 78], note: 'Autonomia e capacidade sem excessos.' },
  { id: 'frio', level: 15, name: 'Boreal F15', className: 'Frigorífico', body: 'reefer', accent: '#d7e6e6', stats: [64, 60, 58, 84, 78, 76], note: 'Precisão térmica para cargas especiais.' },
  { id: 'classe-a', level: 20, name: 'Arco A20', className: 'Cavalo Classe A', body: 'tractor-a', accent: '#c52035', stats: [72, 78, 72, 72, 76, 62], note: 'A porta de entrada para grandes implementos.' },
  { id: 'classe-b', level: 25, name: 'Arco B25', className: 'Cavalo Classe B', body: 'tractor-b', accent: '#b88b46', stats: [78, 80, 68, 78, 80, 70], note: 'Torque abundante, presença sem ostentação.' },
  { id: 'classe-c', level: 30, name: 'Arco C30', className: 'Cavalo Classe C', body: 'tractor-c', accent: '#426a70', stats: [84, 82, 66, 82, 84, 78], note: 'Engenharia de longa distância.' },
  { id: 'premium', level: 35, name: 'Aurum P35', className: 'Cavalo Premium', body: 'premium', accent: '#d19a46', stats: [90, 88, 76, 88, 90, 82], note: 'O orgulho de uma frota construída na estrada.' },
  { id: 'bitrem', level: 40, name: 'Colosso B40', className: 'Bitrem', body: 'bitrem', accent: '#9a3a3a', stats: [76, 68, 42, 92, 82, 94], note: 'Duas composições. Uma presença inconfundível.' },
  { id: 'rodotrem', level: 50, name: 'Colosso R50', className: 'Rodotrem', body: 'rodotrem', accent: '#d6b46d', stats: [80, 70, 36, 96, 86, 100], note: 'O destino final de uma grande transportadora.' }
];

const DEFAULT_CUSTOM = { cabin: '#edece6', wheels: '#a9ada9', chassis: '#161d1f', stripe: '#c52035', tint: '#182c33', plate: 'CR-2026', truckName: 'Pioneiro', implement: 'none' };

export function getPlayerLevel(best = 0, totalBoxes = 0) {
  return Math.max(1, Math.min(50, 1 + Math.floor((best + totalBoxes * 120) / 900)));
}

export function loadFleetProfile(best = 0, totalBoxes = 0) {
  const level = getPlayerLevel(best, totalBoxes);
  let custom = DEFAULT_CUSTOM;
  try { custom = { ...DEFAULT_CUSTOM, ...JSON.parse(localStorage.getItem('courierRushCustom') || '{}') }; } catch {}
  const requested = localStorage.getItem('courierRushVehicle') || FLEET[0].id;
  const selected = FLEET.find(vehicle => vehicle.id === requested && vehicle.level <= level) || FLEET[0];
  return { level, selected, custom };
}

export function saveVehicle(vehicleId) { localStorage.setItem('courierRushVehicle', vehicleId); }
export function saveCustomization(custom) { localStorage.setItem('courierRushCustom', JSON.stringify(custom)); }

export function getNewUnlock(level) {
  const known = Number(localStorage.getItem('courierRushKnownLevel') || 1);
  localStorage.setItem('courierRushKnownLevel', String(level));
  return [...FLEET].reverse().find(vehicle => vehicle.level > known && vehicle.level <= level) || null;
}

export const STAT_NAMES = ['Velocidade', 'Aceleração', 'Manobra', 'Estabilidade', 'Frenagem', 'Carga'];
