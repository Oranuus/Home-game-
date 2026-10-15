/**
 * Game Types & Interfaces for The Haunted House
 */

export type RoomId = 
  | 'tabby_bedroom'
  | 'hallway_f2'
  | 'parents_bedroom'
  | 'bathroom'
  | 'attic'
  | 'living_room'
  | 'kitchen'
  | 'foyer_f1'
  | 'basement';

export type Floor = 'f2' | 'f1' | 'attic' | 'basement';

export type ItemType = 
  | 'flashlight'
  | 'brass_key'
  | 'cellar_key'
  | 'salt_pouch'
  | 'matches'
  | 'slingshot'
  | 'crowbar'
  | 'axe'
  | 'torch'
  | 'teddy_bear';

export interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  uses?: number;
  maxUses?: number;
}

export type FacingDirection = 'left' | 'right';

export interface PlayerState {
  x: number; // in current room coordinates (0 to room.width)
  y: number; // floor depth (floorMinY to floorMaxY)
  roomId: RoomId;
  facing: FacingDirection;
  vx: number;
  vy: number;
  isMoving: boolean;
  isRunning: boolean;
  isSneaking: boolean;
  isHiding: boolean;
  hidingSpotId: string | null;
  flashlightOn: boolean;
  battery: number; // 0 - 100
  heartRate: number; // 60 - 180 (bpm)
  inventory: InventoryItem[];
  selectedItemIndex: number;
  isDead: boolean;
  deathReason: string | null;
  deathTimestamp?: number;
  loopCount: number;
}

export type MonsterType = 'stalker' | 'bed_grasper' | 'wardrobe_lurker' | 'attic_ghoul';

export interface MonsterEntity {
  id: string;
  type: MonsterType;
  name: string;
  roomId: RoomId;
  x: number;
  y: number;
  facing: FacingDirection;
  speed: number;
  state: 'idle' | 'patrol' | 'investigate' | 'chase' | 'flee' | 'dormant';
  targetX?: number;
  targetRoomId?: RoomId;
  detectionRadius: number;
  stunTimer: number; // if blinded by flashlight or blocked by salt
  active: boolean;
  hp?: number;
  maxHp?: number;
}

export type PropType = 
  | 'door'
  | 'stairs'
  | 'hiding_spot'
  | 'light_switch'
  | 'container'
  | 'item_pickup'
  | 'fireplace'
  | 'candle'
  | 'tv'
  | 'clock'
  | 'window'
  | 'fusebox'
  | 'salt_line';

export interface DroppedItem {
  id: string;
  item: InventoryItem;
  x: number;
  y: number;
}

export interface InteractiveProp {
  id: string;
  roomId: RoomId;
  type: PropType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetRoomId?: RoomId;
  targetX?: number;
  targetY?: number;
  isLocked?: boolean;
  requiredKey?: ItemType;
  isOpen?: boolean;
  isOn?: boolean;
  isBarricaded?: boolean;
  subType?: 'wardrobe' | 'bed' | 'couch' | 'bathtub' | 'sink' | 'kitchen_counter' | 'stove' | 'toilet' | 'table' | 'fridge';
  itemInside?: InventoryItem;
  hasItem?: boolean;
  message?: string;
  dangerLevel?: number; // e.g. wardrobe with lurker
}

export interface RoomDefinition {
  id: RoomId;
  name: string;
  nameAr: string;
  floor: Floor;
  width: number; // e.g. 640 or 800
  height: number; // 320
  floorMinY: number; // e.g. 195
  floorMaxY: number; // e.g. 295
  hasLight: boolean;
  lightFlickering?: boolean;
  wallpaperColor: string;
  floorColor: string;
  baseLightLevel: number; // 0.0 (pitch black) to 1.0 (bright)
  props: InteractiveProp[];
  droppedItems?: DroppedItem[];
}

export interface AnomalyEvent {
  timeInSeconds: number; // when it triggers
  title: string;
  description: string;
  action: (state: any) => void;
}
