/**
 * Premium 2.5D Retro Pixel Art Renderer for The Haunted House
 * Features Y-sorting depth, Victorian gothic pixel interiors, tracking portraits,
 * 4-directional player animations, volumetric flashlight beams, and terrifying monster sprites.
 */
import { MonsterEntity, PlayerState, RoomDefinition, InteractiveProp } from '../types/game';

interface RenderableEntity {
  y: number;
  render: () => void;
}

export class PixelRenderer {
  private ctx: CanvasRenderingContext2D;
  private animFrame: number = 0;
  private lightningTimer: number = 0;
  private isLightningFlash: boolean = false;
  private dustParticles: { x: number; y: number; speed: number; alpha: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    // Generate ambient floating dust motes
    for (let i = 0; i < 35; i++) {
      this.dustParticles.push({
        x: Math.random() * 900,
        y: Math.random() * 320,
        speed: 0.2 + Math.random() * 0.4,
        alpha: 0.1 + Math.random() * 0.3,
      });
    }
  }

  public render(
    room: RoomDefinition,
    player: PlayerState,
    monsters: MonsterEntity[],
    saltLines: { roomId: string; x: number }[],
    currentTimeSec: number,
    nearbyPropName: string | null
  ) {
    this.animFrame++;
    const ctx = this.ctx;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Lightning flash logic
    if (Math.random() < 0.0025 && this.lightningTimer <= 0) {
      this.lightningTimer = 6;
    }
    if (this.lightningTimer > 0) {
      this.lightningTimer--;
      this.isLightningFlash = true;
    } else {
      this.isLightningFlash = false;
    }

    // Camera offset smoothly tracking player X
    const cameraX = Math.max(0, Math.min(room.width - width, player.x - width / 2));

    ctx.save();
    ctx.translate(-cameraX, 0);

    // 1. Draw Static Room Architecture (Walls, Wainscoting, Windows, Doors on back wall)
    this.drawRoomArchitecture(room, player, cameraX, width, height, currentTimeSec);

    // 2. Y-Sorting: Collect all floor entities (Furniture, Player, Monsters, Salt) and sort by foot Y
    const renderQueue: RenderableEntity[] = [];

    // Add Floor props
    for (const prop of room.props) {
      // Back wall doors/windows are already drawn on the wall; furniture sits on the floor
      if (prop.type === 'door' || prop.type === 'stairs' || prop.type === 'window') {
        continue; // Drawn with architecture
      }
      renderQueue.push({
        y: prop.y + prop.height,
        render: () => this.drawPropObject(prop, player, currentTimeSec),
      });
    }

    // Add Salt Lines
    for (const salt of saltLines) {
      if (salt.roomId === room.id) {
        renderQueue.push({
          y: 230,
          render: () => this.drawSaltLine(salt.x),
        });
      }
    }

    // Add Dropped Items on the floor
    if (room.droppedItems) {
      for (const d of room.droppedItems) {
        renderQueue.push({
          y: d.y,
          render: () => this.drawDroppedItem(d),
        });
      }
    }

    // Add Monsters
    for (const m of monsters) {
      if (m.roomId === room.id && m.active) {
        renderQueue.push({
          y: m.y,
          render: () => this.drawMonster(m),
        });
      }
    }

    // Add Player (if not hiding)
    if (!player.isHiding) {
      renderQueue.push({
        y: player.y,
        render: () => this.drawPlayerSprite(player),
      });
    }

    // Sort by Y position (Painter's algorithm: lowest Y drawn first, highest Y drawn in front)
    renderQueue.sort((a, b) => a.y - b.y);

    // Render sorted floor entities
    for (const item of renderQueue) {
      item.render();
    }

    // 3. Draw Dynamic Lighting Mask
    ctx.restore(); // Exit camera coordinates for lighting overlay
    this.drawLightingOverlay(room, player, cameraX, width, height, currentTimeSec);
  }

  private drawRoomArchitecture(
    room: RoomDefinition,
    player: PlayerState,
    camX: number,
    viewW: number,
    viewH: number,
    currentTimeSec: number
  ) {
    const ctx = this.ctx;
    const rW = room.width;
    const rH = room.height;
    const floorY = room.floorMinY - 10; // ~185

    // --- Upper Wall Background ---
    ctx.fillStyle = room.wallpaperColor;
    ctx.fillRect(0, 0, rW, floorY);

    // Victorian Wallpaper Damask Pattern (Dark sophisticated subtle pattern)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let x = 16; x < rW; x += 36) {
      for (let y = 30; y < floorY - 30; y += 36) {
        // Diamond ornament
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Crown Moulding (Ceiling border)
    ctx.fillStyle = '#110d14';
    ctx.fillRect(0, 0, rW, 16);
    ctx.fillStyle = '#221926';
    ctx.fillRect(0, 16, rW, 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 20, rW, 2);

    // Victorian Wainscoting (Wood paneling along lower third of wall)
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(0, floorY - 32, rW, 32);
    // Wainscoting wood rail
    ctx.fillStyle = '#2e201b';
    ctx.fillRect(0, floorY - 32, rW, 4);
    ctx.fillStyle = '#0f0a08';
    ctx.fillRect(0, floorY - 28, rW, 2);
    // Wood panel insets
    for (let x = 12; x < rW; x += 50) {
      ctx.fillStyle = '#261b16';
      ctx.fillRect(x, floorY - 24, 38, 20);
      ctx.fillStyle = '#140e0b';
      ctx.strokeRect(x, floorY - 24, 38, 20);
    }

    // Baseboard (where wall meets floor)
    ctx.fillStyle = '#0d0907';
    ctx.fillRect(0, floorY, rW, 6);

    // --- 2.5D Floor Architecture with Room-Specific Flooring ---
    ctx.fillStyle = room.floorColor;
    ctx.fillRect(0, floorY + 6, rW, rH - (floorY + 6));

    if (room.id === 'bathroom') {
      // Victorian Black & White Checkered Diamond Tile Floor
      const tileSize = 22;
      let row = 0;
      for (let y = floorY + 6; y < rH; y += tileSize * 0.6) {
        row++;
        const rowOffset = (row % 2) * (tileSize * 0.7);
        for (let x = -tileSize; x < rW + tileSize; x += tileSize * 1.4) {
          const isWhite = (Math.floor((x + rowOffset) / tileSize) + row) % 2 === 0;
          ctx.fillStyle = isWhite ? 'rgba(235, 240, 245, 0.85)' : 'rgba(15, 20, 25, 0.95)';
          
          ctx.beginPath();
          ctx.moveTo(x + rowOffset, y);
          ctx.lineTo(x + rowOffset + tileSize * 0.7, y + tileSize * 0.3);
          ctx.lineTo(x + rowOffset, y + tileSize * 0.6);
          ctx.lineTo(x + rowOffset - tileSize * 0.7, y + tileSize * 0.3);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    } else if (room.id === 'kitchen') {
      // Terracotta & Slate Kitchen Tile Slabs
      const slabW = 44;
      const slabH = 18;
      let sRow = 0;
      for (let y = floorY + 6; y < rH; y += slabH) {
        sRow++;
        const offX = (sRow % 2) * (slabW / 2);
        for (let x = -slabW; x < rW + slabW; x += slabW) {
          ctx.fillStyle = (sRow + Math.floor(x / slabW)) % 2 === 0 ? 'rgba(45, 38, 32, 0.7)' : 'rgba(32, 28, 24, 0.85)';
          ctx.fillRect(x + offX, y, slabW - 2, slabH - 2);
          ctx.strokeStyle = 'rgba(12, 10, 8, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + offX, y, slabW - 2, slabH - 2);
        }
      }
    } else if (room.id === 'foyer_f1') {
      // Grand Circular Rotunda Marble Floor with Concentric Mosaic Rings
      const centerX = rW / 2;
      const centerY = floorY + (rH - floorY) / 2 + 10;
      
      // Radiating marble planks
      const plankHeight = 16;
      let pIdx = 0;
      for (let y = floorY + 6; y < rH; y += plankHeight) {
        pIdx++;
        ctx.fillStyle = pIdx % 2 === 0 ? 'rgba(32, 24, 28, 0.85)' : 'rgba(24, 18, 22, 0.95)';
        ctx.fillRect(0, y, rW, plankHeight);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, y, rW, 1.5);
      }

      // Concentric circular rotunda medallion inlay
      const radii = [190, 140, 95, 55, 20];
      for (let i = 0; i < radii.length; i++) {
        const rad = radii[i];
        ctx.save();
        ctx.beginPath();
        // Slightly squashed ellipse for 2.5D perspective
        ctx.ellipse(centerX, centerY, rad * 1.5, rad * 0.7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(212, 175, 55, 0.25)' : 'rgba(180, 83, 9, 0.2)';
        ctx.lineWidth = i === 1 ? 3 : 1.5;
        ctx.stroke();

        if (i === 3) {
          ctx.fillStyle = 'rgba(180, 83, 9, 0.08)';
          ctx.fill();
        }
        ctx.restore();
      }
    } else {
      // Hardwood Planks with isometric depth shading for Bedrooms, Hallways & Living Room
      const plankHeight = 15;
      let pIdx = 0;
      for (let y = floorY + 6; y < rH; y += plankHeight) {
        pIdx++;
        ctx.fillStyle = pIdx % 2 === 0 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, y, rW, plankHeight);

        // Plank line shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, y, rW, 2);

        // Plank vertical joints
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        const xOffset = (pIdx * 65) % 120;
        for (let x = xOffset; x < rW; x += 120) {
          ctx.fillRect(x, y, 2, plankHeight);
        }
      }
    }

    // Draw Back Wall Props (Doors, Windows, Stairs, Wall Clock)
    for (const prop of room.props) {
      if (prop.type === 'door') {
        this.drawWallDoor(prop);
      } else if (prop.type === 'stairs') {
        this.drawWallStairs(prop);
      } else if (prop.type === 'window') {
        this.drawWallWindow(prop);
      } else if (prop.type === 'clock') {
        this.drawWallClock(prop, currentTimeSec);
      }
    }

    // Creepy Victorian Wall Portrait with tracking eyes!
    this.drawWallPortrait(room, player, floorY);

    // Subtle Room Title at top center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(room.name.toUpperCase(), camX + viewW / 2, 14);
  }

  private drawWallDoor(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height, isOpen, isLocked } = prop;

    // Elaborate Dark Wood Victorian Frame
    ctx.fillStyle = '#130c0a';
    ctx.fillRect(x - 5, y - 6, width + 10, height + 6);

    // Carved door pediment top
    ctx.fillStyle = '#271914';
    ctx.fillRect(x - 8, y - 10, width + 16, 6);
    ctx.fillStyle = '#3d2820';
    ctx.fillRect(x - 4, y - 12, width + 8, 3);

    if (isOpen) {
      // Open Doorway - Pitch black abyss
      ctx.fillStyle = '#040305';
      ctx.fillRect(x, y, width, height);

      // Open door leaf angled into room
      ctx.fillStyle = '#34221b';
      ctx.fillRect(x - 14, y + 2, 14, height - 2);
      ctx.fillStyle = '#1c120e';
      ctx.fillRect(x - 14, y + 2, 2, height - 2);
    } else {
      // Closed Mahogany Door
      ctx.fillStyle = '#452c22';
      ctx.fillRect(x, y, width, height);

      // Deep recessed wood panels
      const pW = width - 12;
      const pH = (height - 30) / 3;
      ctx.fillStyle = '#2e1c15';
      for (let i = 0; i < 3; i++) {
        const pY = y + 8 + i * (pH + 6);
        ctx.fillRect(x + 6, pY, pW, pH);
        ctx.strokeStyle = '#180e0a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 6, pY, pW, pH);
      }

      // Ornate Brass Doorknob & Keyhole
      ctx.fillStyle = isLocked ? '#eab308' : '#d4af37';
      ctx.beginPath();
      ctx.arc(x + width - 10, y + height / 2 + 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Keyhole
      ctx.fillStyle = '#0a0806';
      ctx.fillRect(x + width - 11, y + height / 2 + 13, 2, 5);

      // Heavy padlock / chained icon if locked
      if (isLocked) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + width / 2 - 5, y + height / 2 - 8, 10, 10);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(x + width / 2 - 3, y + height / 2 - 13, 6, 5);
      }

      // Crossed Wooden Barricade Planks (Destructible by Axe)
      if (prop.isBarricaded) {
        ctx.fillStyle = '#5c3a21';
        // Diagonal plank 1
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(-0.35);
        ctx.fillRect(-width / 2 - 6, -6, width + 12, 12);
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(-width / 2 - 4, -4, width + 8, 4);
        // Iron nails
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-width / 2 - 2, -2, 3, 3);
        ctx.fillRect(width / 2 - 2, -2, 3, 3);
        ctx.restore();

        // Diagonal plank 2
        ctx.fillStyle = '#4a2e1a';
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(0.35);
        ctx.fillRect(-width / 2 - 6, -6, width + 12, 12);
        ctx.fillStyle = '#7a4e25';
        ctx.fillRect(-width / 2 - 4, -4, width + 8, 4);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-width / 2 - 2, -2, 3, 3);
        ctx.fillRect(width / 2 - 2, -2, 3, 3);
        ctx.restore();
      }
    }
  }

  private drawWallStairs(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // Dark Staircase Archway
    ctx.fillStyle = '#070508';
    ctx.fillRect(x, y, width, height);

    // Victorian Banister & Steps receding
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const sY = y + height - (i + 1) * (height / steps);
      const sW = width - (steps - i) * 3;
      ctx.fillStyle = '#3b271d';
      ctx.fillRect(x + 2, sY, sW, 8);
      ctx.fillStyle = '#1a100b';
      ctx.fillRect(x + 2, sY + 8, sW, 4);
    }

    // Carved mahogany newel post
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(x + width - 10, y + 10, 8, height - 10);
    ctx.beginPath();
    ctx.arc(x + width - 6, y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWallWindow(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // Gothic Window Arch
    ctx.fillStyle = '#140e13';
    ctx.fillRect(x - 4, y - 4, width + 8, height + 8);

    // Glass interior: Lightning flashes bright blue/white, else dark stormy night
    ctx.fillStyle = this.isLightningFlash ? '#eff6ff' : '#080712';
    ctx.fillRect(x, y, width, height);

    // Rain Streaks trickling down glass
    if (!this.isLightningFlash) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      for (let i = 0; i < 6; i++) {
        const rx = x + 4 + ((this.animFrame * 2 + i * 18) % (width - 8));
        const ry = y + 4 + ((this.animFrame * 5 + i * 26) % (height - 8));
        ctx.fillRect(rx, ry, 1.5, 8);
      }
    }

    // Gothic Muntins (Cross Bars)
    ctx.fillStyle = '#1a1219';
    ctx.fillRect(x + width / 2 - 2, y, 4, height);
    ctx.fillRect(x, y + height / 2 - 2, width, 4);

    // Velvet Drapery on sides
    ctx.fillStyle = '#501725';
    ctx.fillRect(x - 8, y - 4, 10, height + 8);
    ctx.fillRect(x + width - 2, y - 4, 10, height + 8);
  }

  private drawWallClock(prop: InteractiveProp, currentTimeSec: number) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // Carved Clock Pediment & Body
    ctx.fillStyle = '#2e1c15';
    ctx.fillRect(x, y, width, height);

    // Decorative crown
    ctx.fillStyle = '#482e23';
    ctx.fillRect(x - 4, y - 6, width + 8, 8);
    ctx.fillStyle = '#d4af37'; // Gold finial
    ctx.fillRect(x + width / 2 - 3, y - 12, 6, 6);

    // Glass Door
    ctx.fillStyle = '#0a0709';
    ctx.fillRect(x + 8, y + 10, width - 16, height - 20);

    // Antique Dial Face (Parchment Cream)
    const dialX = x + width / 2;
    const dialY = y + 36;
    ctx.fillStyle = '#f5eedb';
    ctx.beginPath();
    ctx.arc(dialX, dialY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Gold Bezel Rim
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Minute & Hour Hands
    const minuteAngle = -Math.PI / 2 + (currentTimeSec % 60) * ((Math.PI * 2) / 60);
    ctx.strokeStyle = '#181216';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dialX, dialY);
    ctx.lineTo(dialX + Math.cos(minuteAngle) * 14, dialY + Math.sin(minuteAngle) * 14);
    ctx.stroke();

    // Pendulum Glass Chamber
    ctx.fillStyle = '#100b0e';
    ctx.fillRect(x + 14, y + 68, width - 28, height - 85);

    // Swinging Brass Pendulum
    const swing = Math.sin(this.animFrame * 0.08) * 9;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(dialX, y + 70);
    ctx.lineTo(dialX + swing, y + 125);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(dialX + swing, y + 125, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWallPortrait(room: RoomDefinition, player: PlayerState, floorY: number) {
    if (room.id !== 'hallway_f2' && room.id !== 'parents_bedroom') return;

    const ctx = this.ctx;
    const pX = room.id === 'hallway_f2' ? 440 : 280;
    const pY = 55;

    // Gilded Frame
    ctx.fillStyle = '#b48328';
    ctx.fillRect(pX - 3, pY - 3, 46, 56);
    ctx.fillStyle = '#24140b';
    ctx.fillRect(pX, pY, 40, 50);

    // Creepy Victorian Figure in painting
    ctx.fillStyle = '#3f312b';
    ctx.fillRect(pX + 10, pY + 22, 20, 24); // Suit
    ctx.fillStyle = '#f1d6b8';
    ctx.fillRect(pX + 13, pY + 10, 14, 13); // Face

    // Tracking Eyes: Look left/right depending on Tabby's position!
    const lookOffset = player.x < pX ? -1.5 : 1.5;
    ctx.fillStyle = '#b91c1c'; // Sinister red pupils
    ctx.fillRect(pX + 15 + lookOffset, pY + 14, 2, 2);
    ctx.fillRect(pX + 21 + lookOffset, pY + 14, 2, 2);
  }

  // --- Floor Entities (Props, Furniture) ---
  private drawPropObject(prop: InteractiveProp, player: PlayerState, currentTimeSec: number) {
    const ctx = this.ctx;
    const { x, y, width, height, subType, type, id, isOpen, isOn } = prop;
    const isPlayerInside = player.isHiding && player.hidingSpotId === id;

    // Soft Contact Drop Shadow on the floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height - 2, width / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (subType === 'bed') {
      // Four-Poster / Canopy Bed
      // Tall back posts
      ctx.fillStyle = '#2c1c14';
      ctx.fillRect(x + 2, y - 25, 8, height + 25);
      ctx.fillRect(x + width - 10, y - 25, 8, height + 25);

      // Bed Base & Mahogany Frame
      ctx.fillStyle = '#3a251b';
      ctx.fillRect(x + 6, y + height - 30, width - 12, 30);

      // Underbed Dark Void
      ctx.fillStyle = '#060408';
      ctx.fillRect(x + 12, y + height - 12, width - 24, 12);

      // If player is hiding under bed
      if (isPlayerInside) {
        ctx.fillStyle = '#38bdf8'; // Tabby's eyes peering out
        ctx.fillRect(x + 45, y + height - 9, 3, 3);
        ctx.fillRect(x + 55, y + height - 9, 3, 3);
      }

      // Mattress & Cream Pillows
      ctx.fillStyle = '#e8dec9';
      ctx.fillRect(x + 14, y + 10, 36, 26);
      ctx.fillStyle = '#c5b89e';
      ctx.fillRect(x + 16, y + 26, 32, 6);

      // Velvet Quilt (Dark Crimson or Royal Navy)
      ctx.fillStyle = '#5c1d2e';
      ctx.fillRect(x + 36, y + 18, width - 44, height - 35);
      // Folded Duvet Lip
      ctx.fillStyle = '#872a43';
      ctx.fillRect(x + 36, y + 18, 16, height - 35);
      // Quilt stitches
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let qX = x + 56; qX < x + width - 15; qX += 20) {
        ctx.fillRect(qX, y + 22, 1, height - 42);
      }
    } else if (subType === 'wardrobe') {
      // Massive Antique Armoire
      ctx.fillStyle = '#281a13';
      ctx.fillRect(x, y, width, height);

      // Carved Pediment Top
      ctx.fillStyle = '#3e281d';
      ctx.fillRect(x - 5, y - 6, width + 10, 8);
      ctx.fillStyle = '#170e0a';
      ctx.strokeRect(x, y, width, height);

      // Twin Paneled Doors
      const dW = (width - 12) / 2;
      ctx.fillStyle = '#422a1f';
      ctx.fillRect(x + 4, y + 8, dW, height - 18);
      ctx.fillRect(x + width / 2 + 2, y + 8, dW, height - 18);

      // Slats / Louvers on doors
      ctx.fillStyle = '#1e120c';
      for (let sY = y + 22; sY < y + 80; sY += 8) {
        ctx.fillRect(x + 8, sY, dW - 8, 3);
        ctx.fillRect(x + width / 2 + 6, sY, dW - 8, 3);
      }

      // Brass Keyholes & Drop Handles
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(x + width / 2 - 4, y + height / 2, 3, 10);
      ctx.fillRect(x + width / 2 + 2, y + height / 2, 3, 10);

      // If Tabby is hiding inside:
      if (isPlayerInside) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + width / 2 - 9, y + 38, 3, 3);
        ctx.fillRect(x + width / 2 + 6, y + 38, 3, 3);
      }
    } else if (subType === 'bathtub') {
      this.drawBathtub(prop, isPlayerInside);
    } else if (subType === 'sink') {
      this.drawBathroomSink(prop);
    } else if (subType === 'toilet') {
      this.drawToilet(prop);
    } else if (subType === 'kitchen_counter') {
      this.drawKitchenCounter(prop);
    } else if (subType === 'stove') {
      this.drawGasStove(prop);
    } else if (id === 'kitchen_table_drawer') {
      this.drawDiningTable(prop);
    } else if (id === 'fridge') {
      this.drawFridge(prop);
    } else if (subType === 'couch') {
      // Victorian Tufted Velvet Couch
      ctx.fillStyle = '#431722';
      ctx.fillRect(x, y + 10, width, height - 10);

      // Deep Curved Backrest
      ctx.fillStyle = '#5c1e2e';
      ctx.fillRect(x + 10, y, width - 20, 30);

      // Rolled Armrests
      ctx.fillStyle = '#321019';
      ctx.fillRect(x, y + 6, 20, height - 6);
      ctx.fillRect(x + width - 20, y + 6, 20, height - 6);

      // Cushion Seat
      ctx.fillStyle = '#73273a';
      ctx.fillRect(x + 24, y + 28, width - 48, 26);

      // Carved Wooden Feet
      ctx.fillStyle = '#221510';
      ctx.fillRect(x + 6, y + height - 8, 8, 8);
      ctx.fillRect(x + width - 14, y + height - 8, 8, 8);
    } else if (type === 'fireplace') {
      // Cobblestone Fireplace Hearth
      ctx.fillStyle = '#281f1b';
      ctx.fillRect(x, y, width, height);

      // Brick pattern
      ctx.fillStyle = '#1a1310';
      for (let bY = y + 6; bY < y + height - 20; bY += 14) {
        ctx.fillRect(x + 4, bY, width - 8, 2);
      }

      // Firebox opening
      ctx.fillStyle = '#080606';
      ctx.fillRect(x + 14, y + 28, width - 28, height - 28);

      if (isOn) {
        // Multi-layered Dancing Pixel Flames
        const flameOffset = Math.sin(this.animFrame * 0.28) * 8;
        const flameW = width - 44;

        // Red base
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(x + 22, y + height - 4);
        ctx.lineTo(x + width / 2 + flameOffset * 0.5, y + 40 - Math.abs(flameOffset));
        ctx.lineTo(x + width - 22, y + height - 4);
        ctx.fill();

        // Orange mid flame
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(x + 28, y + height - 4);
        ctx.lineTo(x + width / 2 - flameOffset * 0.7, y + 48);
        ctx.lineTo(x + width - 28, y + height - 4);
        ctx.fill();

        // Yellow core
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(x + 36, y + height - 4);
        ctx.lineTo(x + width / 2, y + 62);
        ctx.lineTo(x + width - 36, y + height - 4);
        ctx.fill();

        // Embers floating up
        ctx.fillStyle = '#facc15';
        for (let i = 0; i < 4; i++) {
          const eX = x + 30 + ((this.animFrame * 2 + i * 22) % flameW);
          const eY = y + 35 - ((this.animFrame * 2 + i * 18) % 35);
          ctx.fillRect(eX, eY, 2, 2);
        }
      }
    } else if (type === 'tv') {
      // Retro Tube CRT TV
      ctx.fillStyle = '#31231a';
      ctx.fillRect(x, y, width, height);

      // TV Speaker Grille & Knobs
      ctx.fillStyle = '#1c130d';
      ctx.fillRect(x + width - 16, y + 8, 10, height - 16);
      ctx.fillStyle = '#c59b27';
      ctx.beginPath();
      ctx.arc(x + width - 11, y + 18, 3, 0, Math.PI * 2);
      ctx.arc(x + width - 11, y + 32, 3, 0, Math.PI * 2);
      ctx.fill();

      // Screen
      if (isOn) {
        // Animated White/Gray CRT Static Noise
        const imgData = ctx.createImageData(width - 24, height - 20);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const v = Math.random() > 0.45 ? 220 : 35;
          imgData.data[i] = v;
          imgData.data[i + 1] = v;
          imgData.data[i + 2] = v;
          imgData.data[i + 3] = 255;
        }
        ctx.putImageData(imgData, x + 6, y + 10);
      } else {
        ctx.fillStyle = '#09080e';
        ctx.fillRect(x + 6, y + 10, width - 24, height - 20);
      }
    } else if (type === 'container') {
      // Wood Drawers / Trunk / Cabinet
      ctx.fillStyle = '#3a271d';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#22150f';
      ctx.strokeRect(x, y, width, height);

      // Top moulding
      ctx.fillStyle = '#4c3326';
      ctx.fillRect(x - 3, y - 4, width + 6, 6);

      // Drawers
      const dCount = 2;
      const rowH = (height - 12) / dCount;
      for (let i = 0; i < dCount; i++) {
        const dY = y + 6 + i * (rowH + 3);
        ctx.fillStyle = isOpen ? '#180e0a' : '#4a3325';
        ctx.fillRect(x + 5, dY, width - 10, rowH);

        // Brass handle
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x + width / 2 - 5, dY + rowH / 2 - 2, 10, 4);
      }
    } else if (type === 'fusebox') {
      // Industrial Breaker Box
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#1e293b';
      ctx.strokeRect(x, y, width, height);

      // Danger stripes
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 4, y + 4, width - 8, 4);

      // Indicator light
      ctx.fillStyle = isOn ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2 + 4, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'candle') {
      this.drawCandleObject(prop);
    }
  }

  private drawCandleObject(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height, isOn } = prop;

    const midX = x + width / 2;
    const baseY = y + height - 4;

    // 1. Ornate Victorian Brass Base & Stem
    ctx.fillStyle = '#b48328';
    ctx.beginPath();
    ctx.ellipse(midX, baseY, width / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stem column
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(midX - 2, baseY - 16, 4, 16);

    // Candle cup / drip dish
    ctx.fillStyle = '#b48328';
    ctx.beginPath();
    ctx.ellipse(midX, baseY - 16, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Wax Taper Candle Body (Ivory Cream with drips)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(midX - 3, baseY - 32, 6, 16);
    ctx.fillStyle = '#fef9c3';
    ctx.fillRect(midX - 2, baseY - 32, 4, 16);

    // Wax drips
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(midX - 4, baseY - 24, 2, 6);
    ctx.fillRect(midX + 2, baseY - 20, 2, 5);

    // Black cotton wick
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(midX - 0.5, baseY - 36, 1.5, 4);

    // 3. Flame / Smoke
    if (isOn) {
      // Animated flickering flame
      const flicker = Math.sin(this.animFrame * 0.35) * 1.5;
      const flameH = 9 + Math.cos(this.animFrame * 0.4) * 2;

      // Outer Golden Glow Halo
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.beginPath();
      ctx.arc(midX + flicker * 0.4, baseY - 38, 12, 0, Math.PI * 2);
      ctx.fill();

      // Orange outer teardrop flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(midX - 3, baseY - 35);
      ctx.quadraticCurveTo(midX - 4 + flicker, baseY - 38, midX + flicker, baseY - 36 - flameH);
      ctx.quadraticCurveTo(midX + 4 + flicker, baseY - 38, midX + 3, baseY - 35);
      ctx.closePath();
      ctx.fill();

      // Yellow core flame
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(midX - 1.5, baseY - 35);
      ctx.quadraticCurveTo(midX + flicker, baseY - 37, midX + flicker * 0.6, baseY - 35 - flameH * 0.7);
      ctx.quadraticCurveTo(midX + 2 + flicker, baseY - 37, midX + 1.5, baseY - 35);
      ctx.closePath();
      ctx.fill();

      // White hot center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(midX - 1 + flicker * 0.4, baseY - 37, 2, 3);
    } else {
      // Unlit thin grey smoke wisp
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      const sOffset = Math.sin(this.animFrame * 0.1) * 2;
      ctx.fillRect(midX - 0.5 + sOffset, baseY - 39, 1.5, 3);
      ctx.fillRect(midX + 0.5 - sOffset, baseY - 43, 1.5, 2.5);
    }
  }

  // --- Specialized Custom Victorian Bathroom Renderers ---

  private drawBathtub(prop: InteractiveProp, isPlayerInside: boolean) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // 1. Four Golden Claw Feet (Lion Paws)
    ctx.fillStyle = '#d4af37';
    // Back left and right feet
    ctx.fillRect(x + 16, y + height - 8, 9, 8);
    ctx.fillRect(x + width - 25, y + height - 8, 9, 8);
    // Front claw feet with claws
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 12, y + height - 5, 12, 5);
    ctx.fillRect(x + width - 24, y + height - 5, 12, 5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 14, y + height - 1, 2, 2);
    ctx.fillRect(x + 18, y + height - 1, 2, 2);
    ctx.fillRect(x + 22, y + height - 1, 2, 2);
    ctx.fillRect(x + width - 22, y + height - 1, 2, 2);
    ctx.fillRect(x + width - 18, y + height - 1, 2, 2);
    ctx.fillRect(x + width - 14, y + height - 1, 2, 2);

    // 2. White Enamel Porcelain Outer Tub Shell (Curved Roll-top)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height - 20, width / 2 - 4, 18, 0, 0, Math.PI);
    ctx.lineTo(x + 4, y + 16);
    ctx.lineTo(x + width - 4, y + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height - 22, width / 2 - 8, 15, 0, 0, Math.PI);
    ctx.lineTo(x + 8, y + 18);
    ctx.lineTo(x + width - 8, y + 18);
    ctx.closePath();
    ctx.fill();

    // 3. Inner Tub Basin (Deep Dark Water Void with eerie red tinge)
    ctx.fillStyle = '#1e1b24';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 20, width / 2 - 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sinister murky water surface
    ctx.fillStyle = '#3a1720';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 22, width / 2 - 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water ripple highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 35, y + 20, 25, 1);
    ctx.fillRect(x + width - 60, y + 23, 20, 1);

    // 4. Standing Brass Gooseneck Faucet & Pipes
    ctx.fillStyle = '#b48328';
    ctx.fillRect(x + 16, y - 18, 5, 38); // Faucet riser pipe
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(x + 14, y - 22, 16, 5); // Curved spout
    ctx.fillRect(x + 26, y - 17, 4, 5); // Spout tip
    // Twin Cross Handles
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 10, y - 10, 6, 3);
    ctx.fillRect(x + 22, y - 10, 6, 3);

    // Slow dripping red droplet from faucet
    const dripFrame = (this.animFrame % 75);
    if (dripFrame < 35) {
      const dripY = (y - 12) + dripFrame * 0.9;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + 27, dripY, 2, 3);
    } else if (dripFrame < 50) {
      // Ripple circle in water
      const ripR = (dripFrame - 35) * 0.8;
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x + 28, y + 22, ripR * 1.8, ripR * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Heavy Porcelain Rolled Rim Lip
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 16, width / 2 - 4, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 15, width / 2 - 5, 13, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 6. If Tabby is hiding inside the tub: Peeking head & eyes over porcelain rim
    if (isPlayerInside) {
      const peekX = x + width / 2;
      const peekY = y + 14;

      // Cyan Hair Ribbon
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(peekX - 11, peekY - 14, 5, 5);
      ctx.fillRect(peekX + 6, peekY - 14, 5, 5);

      // Tabby's dark hair
      ctx.fillStyle = '#1e1410';
      ctx.fillRect(peekX - 9, peekY - 12, 18, 9);

      // Pale Face
      ctx.fillStyle = '#fee2b3';
      ctx.fillRect(peekX - 8, peekY - 6, 16, 7);

      // Startled blue eyes peeking over edge!
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(peekX - 5, peekY - 4, 3, 3);
      ctx.fillRect(peekX + 2, peekY - 4, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(peekX - 5, peekY - 4, 1, 1);
      ctx.fillRect(peekX + 2, peekY - 4, 1, 1);
    }
  }

  private drawBathroomSink(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // 1. Classical Pedestal Column
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + width / 2 - 8, y + 32, 16, height - 32);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + width / 2 - 6, y + 32, 12, height - 32);
    // Fluted vertical grooves on pedestal
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + width / 2 - 3, y + 34, 2, height - 36);
    ctx.fillRect(x + width / 2 + 1, y + 34, 2, height - 36);
    // Pedestal base flair
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + width / 2 - 12, y + height - 8, 24, 8);

    // 2. White Porcelain Basin Washbowl
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 2, y + 16, width - 4, 18);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 18, width - 8, 14);

    // Inner Washbowl Cavity
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 22, width / 2 - 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + width / 2 - 2, y + 21, 4, 4); // Drain hole

    // 3. Brass Faucet & Dual Tap Knobs
    ctx.fillStyle = '#b48328';
    ctx.fillRect(x + width / 2 - 2, y + 8, 4, 10);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(x + width / 2 - 3, y + 6, 6, 4);
    // Left & Right Cross Knobs
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + width / 2 - 12, y + 13, 6, 3);
    ctx.fillRect(x + width / 2 + 6, y + 13, 6, 3);

    // Small bar of green soap in dish on the right
    ctx.fillStyle = '#86efac';
    ctx.fillRect(x + width - 14, y + 16, 8, 4);
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + width - 14, y + 16, 8, 4);

    // 4. Oval Victorian Wall Mirror above Sink
    const mX = x + width / 2;
    const mY = y - 36;
    // Gilded Frame
    ctx.fillStyle = '#b48328';
    ctx.beginPath();
    ctx.ellipse(mX, mY, 19, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dusty Dark Mirror Glass
    ctx.fillStyle = '#1e2530';
    ctx.beginPath();
    ctx.ellipse(mX, mY, 16, 23, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glass reflection diagonal glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.ellipse(mX - 4, mY - 4, 11, 17, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Spooky subtle phantom eyes in mirror that pulse slowly
    const ghostAlpha = 0.15 + 0.12 * Math.sin(this.animFrame * 0.05);
    ctx.fillStyle = `rgba(244, 63, 94, ${ghostAlpha})`;
    ctx.fillRect(mX - 4, mY - 3, 2, 2);
    ctx.fillRect(mX + 2, mY - 3, 2, 2);
  }

  private drawToilet(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // 1. Ceramic Porcelain Bowl & Base
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 8, y + 40, width - 16, height - 40);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 42, width / 2 - 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Walnut Wood Toilet Seat & Lid
    ctx.fillStyle = '#3e281d';
    ctx.fillRect(x + 4, y + 36, width - 8, 6);
    ctx.fillStyle = '#543627';
    ctx.fillRect(x + 6, y + 20, width - 12, 16); // Upright wooden lid

    // 2. Vertical Copper Flush Downpipe
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + width / 2 - 2, y - 30, 4, 66);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + width / 2 - 1, y - 30, 2, 66);

    // 3. Elevated High Walnut Cistern Tank mounted on wall
    ctx.fillStyle = '#2e1c14';
    ctx.fillRect(x - 2, y - 48, width + 4, 20);
    ctx.fillStyle = '#42281d';
    ctx.fillRect(x, y - 46, width, 16);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y - 46, width, 16);

    // 4. Hanging Brass Pull Chain with wooden drop teardrop
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width - 6, y - 30);
    ctx.lineTo(x + width - 6, y + 14);
    ctx.stroke();
    // Wooden Teardrop Handle
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(x + width - 6, y + 17, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Specialized Custom Victorian Kitchen Renderers ---

  private drawKitchenCounter(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // 1. Lower Shaker Wood Cabinets (Mahogany / Dark Oak)
    ctx.fillStyle = '#2c1b12';
    ctx.fillRect(x, y + 16, width, height - 16);
    ctx.strokeStyle = '#150d09';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + 16, width, height - 16);

    // 3 Inset Panel Cabinet Doors
    const doorW = (width - 16) / 3;
    for (let i = 0; i < 3; i++) {
      const cX = x + 4 + i * (doorW + 4);
      ctx.fillStyle = '#3d261a';
      ctx.fillRect(cX, y + 20, doorW, height - 24);
      ctx.fillStyle = '#27170f';
      ctx.strokeRect(cX + 3, y + 24, doorW - 6, height - 32);

      // Brass Knob Handles
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(cX + doorW - 5, y + 32, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Polished White Carrara Marble Countertop with Gray Veins
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x - 3, y + 4, width + 6, 14);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x - 3, y + 4, width + 6, 10);

    // Subtle dark gray marble veins
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.fillRect(x + 12, y + 6, 24, 1.5);
    ctx.fillRect(x + 22, y + 7.5, 14, 1.5);
    ctx.fillRect(x + 85, y + 5, 32, 1.5);
    ctx.fillRect(x + 102, y + 6.5, 18, 1.5);

    // Marble bevelled edge line
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 3, y + 16, width + 6, 2);

    // 3. Inset Double Stainless/Cast-Iron Sink Bowls
    const sX = x + 24;
    const sW = 55;
    ctx.fillStyle = '#334155';
    ctx.fillRect(sX, y + 6, sW, 8);
    // Left basin
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sX + 2, y + 7, sW / 2 - 3, 6);
    // Right basin
    ctx.fillRect(sX + sW / 2 + 1, y + 7, sW / 2 - 3, 6);

    // 4. High Arched Gooseneck Brass Faucet
    const fX = sX + sW / 2;
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(fX - 1.5, y - 10, 3, 16);
    ctx.fillRect(fX - 5, y - 13, 8, 3);
    ctx.fillRect(fX - 5, y - 10, 2.5, 4);
    // Dual lever knobs
    ctx.fillStyle = '#eab308';
    ctx.fillRect(fX - 6, y + 4, 3, 2);
    ctx.fillRect(fX + 3, y + 4, 3, 2);

    // 5. Kitchen Props on counter: Wooden Cutting Board & Vintage Kettle
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + width - 36, y + 6, 22, 6); // Board
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + width - 12, y - 2, 8, 8); // Ceramic jar / pot
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + width - 11, y - 4, 6, 2); // Lid
  }

  private drawGasStove(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // 1. Cast-Iron Black Stove Body
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x, y + 12, width, height - 12);
    ctx.fillStyle = '#27272a';
    ctx.strokeRect(x, y + 12, width, height - 12);

    // 2. Four Cooktop Round Burner Grates
    ctx.fillStyle = '#3f3f46';
    const b1X = x + 14;
    const b2X = x + width - 24;
    // Back burners
    ctx.fillRect(b1X - 6, y + 4, 12, 4);
    ctx.fillRect(b2X - 6, y + 4, 12, 4);
    // Front burners
    ctx.fillRect(b1X - 7, y + 9, 14, 4);
    ctx.fillRect(b2X - 7, y + 9, 14, 4);

    // Flickering Blue & Orange Pilot Flame on front burner!
    const fWiggle = Math.sin(this.animFrame * 0.35) * 1.5;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(b1X + fWiggle, y + 7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.fillRect(b1X + fWiggle - 1, y + 4, 2, 3);

    // 3. Control Panel with Brass Temperature Dials
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(x + 4, y + 15, width - 8, 12);
    for (let i = 0; i < 4; i++) {
      const dX = x + 12 + i * 14;
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(dX, y + 21, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(dX - 0.5, y + 19, 1, 2.5);
    }

    // 4. Oven Door with Dark Glass & Chrome Bar Handle
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x + 6, y + 30, width - 12, height - 36);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(x + 6, y + 30, width - 12, height - 36);

    // Warm faint orange glow from inside oven
    ctx.fillStyle = 'rgba(234, 88, 12, 0.35)';
    ctx.fillRect(x + 12, y + 36, width - 24, height - 48);

    // Oven Rack horizontal bars
    ctx.fillStyle = '#52525b';
    ctx.fillRect(x + 14, y + 46, width - 28, 1.5);
    ctx.fillRect(x + 14, y + 54, width - 28, 1.5);

    // Chrome Bar Handle
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 12, y + 32, width - 24, 3);
    ctx.fillStyle = '#71717a';
    ctx.fillRect(x + 10, y + 31, 3, 5);
    ctx.fillRect(x + width - 13, y + 31, 3, 5);
  }

  private drawDiningTable(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height, hasItem } = prop;

    // 1. Carved Pedestal Center Legs & Curved Feet
    ctx.fillStyle = '#2b180d';
    ctx.fillRect(x + width / 2 - 5, y + 30, 10, height - 32);
    // 3 Splayed Victorian Feet
    ctx.fillRect(x + 14, y + height - 8, 18, 6);
    ctx.fillRect(x + width - 32, y + height - 8, 18, 6);
    ctx.fillRect(x + width / 2 - 8, y + height - 6, 16, 6);

    // 2. Solid Dark Oak Oval Tabletop
    ctx.fillStyle = '#3a2215';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 26, width / 2, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4c2e1c';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 24, width / 2 - 3, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tabletop wood bevel edge
    ctx.strokeStyle = '#24140b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 24, width / 2 - 2, 16, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Delicate White Lace Table Runner
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 22, width / 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Polished Brass Serving Tray in the Center
    const tX = x + width / 2;
    const tY = y + 20;
    ctx.fillStyle = '#b48328';
    ctx.beginPath();
    ctx.ellipse(tX, tY, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.ellipse(tX, tY, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. If Key is still on the tray: Draw Shining Golden Brass Key!
    if (hasItem) {
      // Golden Key Sprite
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(tX - 6, tY - 1, 12, 2); // Key shaft
      // Key bow (head)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tX - 8, tY - 3, 4, 5);
      // Key bits
      ctx.fillStyle = '#eab308';
      ctx.fillRect(tX + 3, tY, 2, 3);
      ctx.fillRect(tX + 6, tY, 2, 2);

      // Sparkling pulse star
      const starPulse = (this.animFrame % 40) < 15;
      if (starPulse) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tX + 1, tY - 5, 2, 2);
        ctx.fillRect(tX, tY - 6, 4, 1);
        ctx.fillRect(tX + 1.5, tY - 7, 1, 3);
      }
    }
  }

  private drawFridge(prop: InteractiveProp) {
    const ctx = this.ctx;
    const { x, y, width, height } = prop;

    // 1. Vintage 1940s Rounded Icebox Body (Cream / Ivory)
    ctx.fillStyle = '#d6d3c9';
    ctx.fillRect(x, y + 4, width, height - 4);
    ctx.fillStyle = '#f5f4ef';
    ctx.fillRect(x + 2, y + 6, width - 4, height - 8);

    // Top freezer compartment division line
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 2, y + 38, width - 4, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 2, y + 41, width - 4, 1);

    // Chrome Emblem Badge on freezer
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(x + width / 2 - 8, y + 16, 16, 3);

    // 2. Heavy Chrome Latch Handle on right edge
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + width - 10, y + 48, 5, 24);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + width - 12, y + 54, 4, 12);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + width - 10, y + 48, 5, 24);

    // 3. Lower Horizontal Ventilation Cooling Slats
    ctx.fillStyle = '#78716c';
    for (let sY = y + height - 22; sY < y + height - 8; sY += 4) {
      ctx.fillRect(x + 8, sY, width - 16, 2);
    }
  }

  // --- Dropped Item Floor Sprite Renderer ---

  private drawDroppedItem(dropped: { id: string; item: any; x: number; y: number }) {
    const ctx = this.ctx;
    const { item, x, y } = dropped;
    const bob = Math.sin(this.animFrame * 0.12) * 2;
    const sprY = y + bob;

    // 1. Ground Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Item Specific Pixel Art Sprite
    if (item.type === 'teddy_bear') {
      // Cute Brown Teddy Bear
      // Body & Tummy
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x - 6, sprY - 10, 12, 10);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x - 4, sprY - 8, 8, 7);
      // Head
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(x, sprY - 14, 6, 0, Math.PI * 2);
      ctx.fill();
      // Round Ears
      ctx.beginPath();
      ctx.arc(x - 5, sprY - 18, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 5, sprY - 18, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Red Bowtie Ribbon
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 3, sprY - 11, 6, 2.5);
      // Black Button Eyes
      ctx.fillStyle = '#171412';
      ctx.fillRect(x - 3, sprY - 15, 1.5, 1.5);
      ctx.fillRect(x + 1.5, sprY - 15, 1.5, 1.5);
    } else if (item.type === 'flashlight') {
      // Brass Flashlight
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x - 8, sprY - 5, 16, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 4, sprY - 7, 5, 10); // Bezel
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 8, sprY - 6, 2, 8); // Lens
    } else if (item.type === 'brass_key' || item.type === 'cellar_key') {
      // Antique Skeleton Key
      const isGold = item.type === 'brass_key';
      ctx.fillStyle = isGold ? '#facc15' : '#94a3b8';
      ctx.fillRect(x - 6, sprY - 2, 13, 3);
      // Bow
      ctx.strokeStyle = isGold ? '#eab308' : '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 9, sprY - 4, 4, 6);
      // Teeth
      ctx.fillRect(x + 3, sprY + 1, 2, 3);
      ctx.fillRect(x + 6, sprY + 1, 2, 2);
    } else if (item.type === 'salt_pouch') {
      // Salt Pouch
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(x - 5, sprY - 8, 10, 8);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(x - 3, sprY - 10, 6, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, sprY - 4, 4, 3); // Salt
    } else if (item.type === 'matches') {
      // Matchbox
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 6, sprY - 6, 12, 7);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 4, sprY - 4, 8, 3);
    } else if (item.type === 'slingshot') {
      // Y Slingshot
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 2, sprY - 3, 4, 6);
      ctx.fillRect(x - 6, sprY - 9, 3, 6);
      ctx.fillRect(x + 3, sprY - 9, 3, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 3, sprY - 7, 6, 1.5);
    } else if (item.type === 'crowbar' || item.type === 'axe') {
      // Fire Axe / Crowbar
      ctx.fillStyle = '#854d0e'; // Wooden handle
      ctx.fillRect(x - 7, sprY - 3, 13, 3);
      // Red Axe head
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + 4, sprY - 9, 7, 10);
      // Steel curved cutting edge
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + 10, sprY - 9, 2, 10);
    } else if (item.type === 'torch') {
      // Flaming Hand Torch
      ctx.fillStyle = '#78350f'; // Dark wood shaft
      ctx.fillRect(x - 6, sprY - 3, 11, 3.5);
      // Wrapped rag head
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 3, sprY - 6, 5, 6);
      // Flickering fire top
      const tFlick = Math.sin(this.animFrame * 0.3) * 1.5;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x + 7 + tFlick, sprY - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x + 7 + tFlick * 0.5, sprY - 6, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Generic Item Sparkle Orb
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, sprY - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Glittering Sparkle Pulse Star
    const sparkleAlpha = 0.4 + 0.6 * Math.sin(this.animFrame * 0.18);
    ctx.fillStyle = `rgba(254, 240, 138, ${sparkleAlpha})`;
    ctx.fillRect(x + 6, sprY - 12, 2, 2);
    ctx.fillRect(x + 5, sprY - 13, 4, 1);
    ctx.fillRect(x + 6.5, sprY - 14, 1, 3);
  }

  private drawSaltLine(x: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#f8fafc';
    // Salt line across depth
    ctx.fillRect(x - 14, 210, 28, 4);
    // Scattered crystals
    ctx.fillRect(x - 18, 214, 5, 3);
    ctx.fillRect(x + 12, 206, 6, 3);
  }

  private drawPlayerSprite(player: PlayerState) {
    const ctx = this.ctx;
    const pX = player.x;
    const pY = player.y; // foot position on floor plane
    const isFacingLeft = player.facing === 'left';
    const isMoving = player.isMoving;

    // Oval Ambient Shadow on floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(pX, pY + 2, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Death state
    if (player.isDead) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(pX - 18, pY - 8, 36, 10);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(pX - 22, pY - 14, 12, 8);
      ctx.fillStyle = '#221510';
      ctx.fillRect(pX - 26, pY - 16, 14, 10);
      return;
    }

    // Walking animation cycle
    const cadence = player.isRunning ? 0.42 : 0.26;
    const walkCycle = isMoving ? Math.sin(this.animFrame * cadence) : 0;
    const bobY = isMoving ? Math.abs(walkCycle) * 3 : 0;

    // 1. Legs / Shoes
    ctx.fillStyle = '#ffffff'; // White socks
    ctx.fillRect(pX - 6, pY - 12 + bobY, 4, 10 + (isMoving ? walkCycle * 3 : 0));
    ctx.fillRect(pX + 2, pY - 12 + bobY, 4, 10 - (isMoving ? walkCycle * 3 : 0));

    ctx.fillStyle = '#171412'; // Black Mary Jane shoes
    ctx.fillRect(pX - 7 + (isFacingLeft ? -2 : 0), pY - 2 + bobY, 6, 4);
    ctx.fillRect(pX + 2 + (isFacingLeft ? 0 : 2), pY - 2 + bobY, 6, 4);

    // 2. Iconic Yellow Pinafore Dress (Tabby from House)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(pX - 5, pY - 26 + bobY);
    ctx.lineTo(pX + 5, pY - 26 + bobY);
    ctx.lineTo(pX + 12, pY - 11 + bobY);
    ctx.lineTo(pX - 12, pY - 11 + bobY);
    ctx.closePath();
    ctx.fill();

    // Ruffled white apron collar
    ctx.fillStyle = '#fef9c3';
    ctx.fillRect(pX - 4, pY - 26 + bobY, 8, 9);
    // Dark apron button
    ctx.fillStyle = '#713f12';
    ctx.fillRect(pX - 1, pY - 21 + bobY, 2, 2);

    // 3. Arms & Hands
    ctx.fillStyle = '#fed7aa';
    const handX = isFacingLeft ? pX - 9 : pX + 6;
    ctx.fillRect(handX, pY - 20 + bobY, 4, 7);

    // 4. Head & Face
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(pX - 7, pY - 38 + bobY, 14, 13);

    // Dark Brown Hair & Bangs
    ctx.fillStyle = '#271711';
    ctx.fillRect(pX - 9, pY - 42 + bobY, 18, 8);
    // Pigtail / Hair fall
    ctx.fillRect(isFacingLeft ? pX + 3 : pX - 9, pY - 36 + bobY, 7, 14);

    // Vibrant Cyan Hair Ribbon
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(pX + (isFacingLeft ? 5 : -7), pY - 43 + bobY, 5, 4);

    // Expressive Eyes
    ctx.fillStyle = '#1c1511';
    const eyeX = isFacingLeft ? pX - 5 : pX + 2;
    ctx.fillRect(eyeX, pY - 33 + bobY, 3, 3);
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(eyeX, pY - 33 + bobY, 1, 1);

    // 5. Held Active Item in hand
    const activeItem = player.inventory[player.selectedItemIndex];
    if (activeItem) {
      if (activeItem.type === 'flashlight') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(isFacingLeft ? pX - 14 : pX + 8, pY - 22 + bobY, 7, 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(isFacingLeft ? pX - 16 : pX + 15, pY - 23 + bobY, 2, 6);
      } else if (activeItem.type === 'teddy_bear') {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(isFacingLeft ? pX - 12 : pX + 7, pY - 25 + bobY, 8, 8);
      } else if (activeItem.type === 'salt_pouch') {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(isFacingLeft ? pX - 12 : pX + 7, pY - 22 + bobY, 6, 6);
      }
    }
  }

  private drawMonster(m: MonsterEntity) {
    const ctx = this.ctx;
    const mX = m.x;
    const mY = m.y;
    const isFacingLeft = m.facing === 'left';

    // Ominous Oval Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(mX, mY + 4, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (m.type === 'stalker') {
      // The Lankler / The Stalker from House
      // Shiver effect if blinded / stunned
      const jolt = m.stunTimer > 0 ? (Math.random() - 0.5) * 8 : 0;
      const walkStride = Math.sin(this.animFrame * 0.2) * 8;

      // Dark Smokey Tendrils / Aura
      ctx.fillStyle = 'rgba(15, 6, 12, 0.45)';
      for (let i = 0; i < 4; i++) {
        const puffX = mX + (Math.sin(this.animFrame * 0.1 + i) * 16);
        const puffY = mY - 45 - i * 16;
        ctx.beginPath();
        ctx.arc(puffX, puffY, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spindly Shadow Legs
      ctx.fillStyle = m.stunTimer > 0 ? '#450a0a' : '#070509';
      ctx.fillRect(mX - 7 + jolt, mY - 45, 5, 45 + walkStride);
      ctx.fillRect(mX + 3 + jolt, mY - 45, 5, 45 - walkStride);

      // Elongated Torso
      ctx.fillRect(mX - 9 + jolt, mY - 90, 18, 48);

      // Long Reaching Claw Arms
      const armSwing = Math.cos(this.animFrame * 0.15) * 10;
      const armX = isFacingLeft ? mX - 16 : mX + 9;
      ctx.fillRect(armX + jolt, mY - 85, 6, 55 + armSwing);
      // Sharp Claws
      ctx.fillRect(armX + jolt + (isFacingLeft ? -3 : 3), mY - 30 + armSwing, 4, 8);

      // Long Distorted Neck & Skull
      ctx.fillRect(mX - 8 + jolt, mY - 110, 16, 22);

      // Piercing Glowing Red Pinpoint Eyes
      ctx.fillStyle = '#ef4444';
      const eyeDir = isFacingLeft ? -4 : 4;
      ctx.fillRect(mX - 4 + eyeDir + jolt, mY - 104, 3, 3);
      ctx.fillRect(mX + 3 + eyeDir + jolt, mY - 104, 3, 3);

      // Red glare trail
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(mX + eyeDir + jolt, mY - 103, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.type === 'attic_ghoul') {
      // Floating Attic Specter
      const floatY = Math.sin(this.animFrame * 0.08) * 12;
      ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
      ctx.beginPath();
      ctx.arc(mX, mY - 60 + floatY, 24, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(mX - 6, mY - 62 + floatY, 3, 3);
      ctx.fillRect(mX + 3, mY - 62 + floatY, 3, 3);
    }
  }

  // --- Dynamic Lighting Mask Overlay ---
  private drawLightingOverlay(
    room: RoomDefinition,
    player: PlayerState,
    camX: number,
    viewW: number,
    viewH: number,
    currentTimeSec: number
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    // Lightning Flash illumination
    if (this.isLightningFlash) {
      ctx.fillStyle = 'rgba(235, 245, 255, 0.95)';
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
      return;
    }

    // Dynamic darkness escalation based on time
    let ambientDarkness = 1.0 - room.baseLightLevel;
    const timeRatio = Math.min(1.0, currentTimeSec / 300);
    ambientDarkness = Math.min(0.96, ambientDarkness + timeRatio * 0.28);

    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = viewW;
    lightCanvas.height = viewH;
    const lCtx = lightCanvas.getContext('2d')!;

    // Base Shadow fill
    lCtx.fillStyle = `rgba(6, 4, 10, ${ambientDarkness})`;
    lCtx.fillRect(0, 0, viewW, viewH);

    // Carve out light circles with 'destination-out'
    lCtx.globalCompositeOperation = 'destination-out';

    // 1. Ambient Fireplace / Lamp Lights
    for (const prop of room.props) {
      if (prop.type === 'fireplace' && prop.isOn) {
        const fX = prop.x + prop.width / 2 - camX;
        const fY = prop.y + prop.height / 2;
        const grad = lCtx.createRadialGradient(fX, fY, 15, fX, fY, 170);
        grad.addColorStop(0, 'rgba(0,0,0,0.95)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(fX, fY, 170, 0, Math.PI * 2);
        lCtx.fill();
      } else if (prop.type === 'candle' && prop.isOn) {
        const cX = prop.x + prop.width / 2 - camX;
        const cY = prop.y + prop.height / 2;
        const flickerR = 120 + Math.sin(this.animFrame * 0.3) * 6;
        const grad = lCtx.createRadialGradient(cX, cY, 8, cX, cY, flickerR);
        grad.addColorStop(0, 'rgba(0,0,0,0.95)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.7)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(cX, cY, flickerR, 0, Math.PI * 2);
        lCtx.fill();
      }
    }

    // Active Torch held by player casts a warm ambient light radius
    const activeItem = player.inventory[player.selectedItemIndex];
    if (activeItem && activeItem.type === 'torch' && !player.isHiding && !player.isDead) {
      const pX = player.x - camX;
      const pY = player.y - 20;
      const tFlick = Math.sin(this.animFrame * 0.25) * 5;
      const tRadius = 115 + tFlick;
      const grad = lCtx.createRadialGradient(pX, pY, 10, pX, pY, tRadius);
      grad.addColorStop(0, 'rgba(0,0,0,0.92)');
      grad.addColorStop(0.8, 'rgba(0,0,0,0.6)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.arc(pX, pY, tRadius, 0, Math.PI * 2);
      lCtx.fill();
    }

    // 2. Volumetric Flashlight Beam
    if (player.flashlightOn && !player.isHiding && !player.isDead) {
      const pX = player.x - camX;
      const pY = player.y - 24;
      const isLeft = player.facing === 'left';
      const beamLength = 260;
      const beamSpread = 85;

      const grad = lCtx.createRadialGradient(pX, pY, 15, pX + (isLeft ? -180 : 180), pY, beamLength);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.75, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.moveTo(pX, pY);
      lCtx.lineTo(pX + (isLeft ? -beamLength : beamLength), pY - beamSpread);
      lCtx.lineTo(pX + (isLeft ? -beamLength : beamLength), pY + beamSpread);
      lCtx.closePath();
      lCtx.fill();

      // Soft ambient aura around player holding flashlight
      const aura = lCtx.createRadialGradient(pX, pY, 5, pX, pY, 55);
      aura.addColorStop(0, 'rgba(0,0,0,0.8)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      lCtx.fillStyle = aura;
      lCtx.beginPath();
      lCtx.arc(pX, pY, 55, 0, Math.PI * 2);
      lCtx.fill();
    } else if (!player.isHiding) {
      // Subtle personal proximity glow so player is never invisible
      const pX = player.x - camX;
      const pY = player.y - 20;
      const aura = lCtx.createRadialGradient(pX, pY, 5, pX, pY, 40);
      aura.addColorStop(0, 'rgba(0,0,0,0.4)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      lCtx.fillStyle = aura;
      lCtx.beginPath();
      lCtx.arc(pX, pY, 40, 0, Math.PI * 2);
      lCtx.fill();
    }

    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();
  }

  // Draw Floating Interaction Tooltip - Positioned strictly at Top-Left per user request!
  private drawInteractionPrompt(text: string, _screenX: number, _screenY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '7.5px "Press Start 2P", monospace';
    const textWidth = ctx.measureText(text).width;
    const pad = 6;
    const bW = textWidth + pad * 2;
    const bH = 18;
    // Always render at the top-left of the canvas screen to ensure unobstructed gameplay vision
    const bX = 14;
    const bY = 56;

    // Box with refined thin gold border
    ctx.fillStyle = 'rgba(12, 10, 18, 0.92)';
    ctx.fillRect(bX, bY, bW, bH);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(bX, bY, bW, bH);

    // Glowing left indicator dot
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bX + 4, bY + 6, 3, 6);

    // Text in warm amber-yellow
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.fillText(text, bX + pad + 5, bY + 12);
    ctx.restore();
  }
}
