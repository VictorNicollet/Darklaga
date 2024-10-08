import * as GL from "./webgl"
import * as S from "./sprites"
import { key, mouse } from "./input"
import { opts } from "./options"
import * as Hud from "./hud"
import * as Shot from "./shot"
import * as Fury from "./fury"
import * as Snd from "./sound"

type Player = {

    x: number
    y: number
    
    // Requested speed, changes based on inputs
    r_x_speed: number;
    r_y_speed: number;

    // Actual speed, tends towards requested speed
    x_speed: number
    y_speed: number

    controllable: boolean
    cooldown: number
    shooting: number
    muzzle_flash: number
    timer: number
    laser_timer: number
    laser_fired: boolean
    anim: number
    modules1: number
    modules2: number
    
    // X-axis rotation level, [-20, 20]
    distance: number

    // Target opacity 
    target: number
}

function initial() : Player {
    return {
        x: 880,
        y: 1960,
        x_speed: 0,
        y_speed: 0,
        controllable: false,
        r_x_speed: 0,
        r_y_speed: 0,
        cooldown: 0,
        shooting: 0,
        muzzle_flash: 0,
        timer: 0,
        laser_timer: 0,
        laser_fired: false,
        anim: 0,
        modules1: 0,
        modules2: 0,
        distance: 0,
        target: 0
    }
}

let pl : Player = initial();

export function reset() {
    pl = initial(); 
}

export function setControllable(c: boolean) {
    pl.controllable = c;
}

function shoot(stuff: Hud.Stuff) {

    switch (stuff.weapon) {
    case Hud.ITEM_WNONE:
    {
        pl.muzzle_flash = 2;
        pl.cooldown = stuff.offense != Hud.ITEM_SPEED ? 6 : 
                      stuff.offense_overload ? 1 : 3;
        const w = S.blast[S.w] << 3, h = S.blast[S.h] << 3;
        
        Snd.blasterFire.play();

        Shot.add(Shot.SHOT_BLASTER, pl.x + 80, pl.y + 8, w, h);
        if (stuff.offense == Hud.ITEM_MULTI) {
            Shot.add(Shot.SHOT_BLASTER, pl.x +  48, pl.y + 32, w, h);
            Shot.add(Shot.SHOT_BLASTER, pl.x + 112, pl.y + 32, w, h);
            if (stuff.offense_overload) {
                Shot.add(Shot.SHOT_BLASTER, pl.x +  16, pl.y + 56, w, h);
                Shot.add(Shot.SHOT_BLASTER, pl.x + 144, pl.y + 56, w, h);
            }
        }
        break;
    }
    case Hud.ITEM_BLADES:
    {
        pl.muzzle_flash = 2;
        pl.cooldown = stuff.offense != Hud.ITEM_SPEED ? 20 : 
                      stuff.offense_overload ? 3 : 8;
        const x = pl.x + 24, y = pl.y + 64, 
              w = S.blade[S.w] << 3, h = S.blade[S.h] << 3;
        const s = stuff.weapon_overload ? Shot.SHOT_OBLADE_SPAWN   
                                        : Shot.SHOT_BLADE_SPAWN;

        Snd.bladeFire.play();

        Shot.add(s, x, y, w, h, 0);
        if (stuff.offense == Hud.ITEM_MULTI) {
            Shot.add(s, x, y, w, h,  1);
            Shot.add(s, x, y, w, h, -1);
            if (stuff.offense_overload) {
                Shot.add(s, x, y, w, h,  2);
                Shot.add(s, x, y, w, h, -2);  
                Shot.add(s, x, y, w, h,  3);
                Shot.add(s, x, y, w, h, -3);        
            }
        }
        break;
    }
    case Hud.ITEM_ROCKETS:
    {
        pl.cooldown = stuff.offense != Hud.ITEM_SPEED ? 9 : 
                      stuff.offense_overload ? 2 : 5;
        const x = pl.x + 64, y = pl.y + 8, 
              w = S.rocket[S.w] << 3, h = S.rocket[S.h] << 3;
        const s = stuff.weapon_overload ? Shot.SHOT_OROCKET_SPAWN   
                                        : Shot.SHOT_ROCKET_SPAWN;
        
        Snd.rocketFire.play();

        Shot.add(s, x, y, w, h,  1);
        Shot.add(s, x, y, w, h, -1);
        if (stuff.offense == Hud.ITEM_MULTI) {
            Shot.add(s, x, y, w, h,  2);
            Shot.add(s, x, y, w, h, -2);
            if (stuff.offense_overload) {  
                Shot.add(s, x, y, w, h,  3);
                Shot.add(s, x, y, w, h, -3);   
                Shot.add(s, x, y, w, h,  4);
                Shot.add(s, x, y, w, h, -4);      
            }
        }
        break;    
    }
    case Hud.ITEM_LASER: 
    {
        pl.laser_fired = true;
        pl.cooldown = 1;
        const x = pl.x, y = 0,
              w = 60, h = pl.y + 16;
        const s = stuff.weapon_overload ? Shot.SHOT_OLASER : Shot.SHOT_LASER;
        const sm = stuff.weapon_overload ? Shot.SHOT_OLASERM : Shot.SHOT_LASERM;
        const d = stuff.offense != Hud.ITEM_SPEED ? 45 : 
                  stuff.offense_overload ? 45 * 5 : 45 * 3;
        const sh = (pl.distance >> 1) << 1;
        Shot.add(s, x + 72, y, w, h, d, sh, pl.laser_timer);
        if (stuff.offense == Hud.ITEM_MULTI) {
            Shot.add(sm, x + 56 - 128, y, w, h, d, sh, pl.laser_timer);
            Shot.add(sm, x + 56 + 128, y, w, h, d, sh, pl.laser_timer);
            if (stuff.offense_overload) {  
                Shot.add(sm, x + 56 - 256, y, w, h, d, sh, pl.laser_timer);
                Shot.add(sm, x + 56 + 256, y, w, h, d, sh, pl.laser_timer);   
            }
        }

        pl.laser_timer += stuff.offense != Hud.ITEM_SPEED ? 1 : 
                          stuff.offense_overload ? 3 : 2;
    }
    }
}

export function pos() {
    return {x: pl.x + 88, y: pl.y + 88};
}

const minX = 32;
const maxX = 1696;
const minY = 192;
const maxY = 2176;
const mouseDeltaX = 88;
const mouseDeltaY = 320 + 88;

function adjustSpeed(realSpeed: number, requestedSpeed: number, friction: number, speed: number) {
    if (requestedSpeed >= 0 && realSpeed > requestedSpeed) 
        return Math.max(requestedSpeed, realSpeed - friction);
    if (requestedSpeed <= 0 && realSpeed < requestedSpeed)
        return Math.max(requestedSpeed, realSpeed + friction);
    if (requestedSpeed < 0 && realSpeed > requestedSpeed)
        return Math.max(requestedSpeed, realSpeed - speed);
    if (requestedSpeed > 0 && realSpeed < requestedSpeed)
        return Math.min(requestedSpeed, realSpeed + speed);
    return realSpeed;
}

export function step() {

    const friction = opts.ModPlayerFriction * opts.ModPlayerFriction * 4;
    const speed = 5 + opts.ModPlayerSpeed;
    
    const stuff = Hud.stuff();

    pl.timer++;

    // user input
    
    pl.r_x_speed = 0;
    pl.r_y_speed = 0;
    
    if (pl.controllable) {

        if (opts.WaitForInput) 
            opts.WaitForInput = 
                !(mouse.down || key.action || key.action2 ||
                key.up || key.left || key.right || key.down);

        if (mouse.down) {
            const tx = Math.max(minX, Math.min(maxX, (mouse.x << 3) - mouseDeltaX));
            const ty = Math.max(minY, Math.min(maxY, (mouse.y << 3) - mouseDeltaY));

            if (ty < pl.y) {
                pl.r_y_speed = Math.max(-3 * speed, ty - pl.y);
            } else {
                pl.r_y_speed = Math.min(3 * speed, ty - pl.y);
            }

            if (tx < pl.x) {
                pl.r_x_speed = Math.max(-3 * speed, tx - pl.x);
                pl.distance = Math.max(-20, pl.distance - 3);
            } else if (tx > pl.x) {
                pl.r_x_speed = Math.min(3 * speed, tx - pl.x)
                pl.distance = Math.min(20, pl.distance + 3);
            }

            if (pl.target < 4) pl.target = 24;
            else if (pl.target > 4) pl.target--; 
        }

        else {

            if (pl.target > 0) pl.target--;

            if (key.up) {
                pl.r_y_speed = -3*speed;
            } else if (key.down) {
                pl.r_y_speed = 3*speed;
            }

            if (key.left) {
                pl.r_x_speed = -3*speed;
                pl.distance = Math.max(-20, pl.distance - 3);
            } else if (key.right) {
                pl.r_x_speed = 3*speed;
                pl.distance = Math.min(20, pl.distance + 3);
            }
        }

        if (key.action || mouse.down) {
            pl.shooting = 5;
        }
    
        if ((key.action2 || mouse.click && mouse.x < 92 && mouse.y > 300) && 
            Hud.furyReady()) 
        {
            if (stuff.weapon == Hud.ITEM_ROCKETS) {
                Fury.startRocket();
            } else if (stuff.weapon == Hud.ITEM_BLADES) {
                Fury.startBlades();
            } else if (stuff.weapon == Hud.ITEM_LASER) {
                Fury.startLaser();
            } else if (stuff.finalBoss) {
                Fury.startUltimate();
            } else {
                Fury.startBlaster();
            }
        }
    }

    // controlled movement

    pl.x_speed = adjustSpeed(pl.x_speed, pl.r_x_speed, friction, speed);
    pl.y_speed = adjustSpeed(pl.y_speed, pl.r_y_speed, friction, speed);

    if (pl.distance > 0) --pl.distance;
    if (pl.distance < 0) ++pl.distance;
    
    pl.x += pl.x_speed;
    pl.y += pl.y_speed;

    // clipping

    const bounce = opts.ModWallsBounce ? -1 : 0;

    if (pl.x < minX) {
        pl.x = minX;
        pl.x_speed *= bounce;
    } else if (pl.x > maxX) {
        pl.x = maxX;
        pl.x_speed *= bounce;
    }

    if (pl.y < minY) {
        pl.y = minY;
        pl.y_speed *= bounce;
    } else if (pl.y > maxY) {
        pl.y = maxY;
        pl.y_speed *= bounce;
    }

    Hud.setPlayer(pl.x + 88, pl.y + 88);
    Fury.setPlayer(pl.x + 88, pl.y + 88);

    // Shots

    if (pl.cooldown) --pl.cooldown;
    if (pl.shooting) --pl.shooting;
    if (pl.muzzle_flash) --pl.muzzle_flash;

    const shooting = 
        opts.ModAutoFire == 2 || 
        opts.ModAutoFire == 1 && mouse.touch ||
        pl.shooting;

    pl.laser_fired = false;
    if (pl.controllable && !pl.cooldown && shooting && !Fury.isRunning())
        shoot(stuff)

    if (pl.laser_fired)
        Snd.laserFire.loop();
    else
        Snd.laserFire.stop();

    // Laser

    if (pl.modules1) pl.modules1--;
    if (pl.modules2) pl.modules2--;

    if (stuff.weapon == Hud.ITEM_LASER &&
        stuff.offense == Hud.ITEM_MULTI) {
        pl.modules1 = Math.min(128, 16 + pl.modules1);
        if (stuff.offense_overload) {
            pl.modules2 = Math.min(128, 16 + pl.modules2);
        }
    }

    // Shield sounds

    if (stuff.defense == Hud.ITEM_SHIELD)
        Snd.shield.loop();
    else
        Snd.shield.stop();
}

// Prepare back-and-forth animation for shield
const shieldn = S.shieldn.slice();
const shieldo = S.shieldo.slice();
for (let i = shieldn.length - 2; i > 0; --i) {
    shieldn.push(S.shieldn[i]);
    shieldo.push(S.shieldo[i]);
}

export function render() {
    
    const {x, y, distance, muzzle_flash, modules1, modules2, timer} = pl;

    if (modules1) {
        GL.drawSprite(S.lasmod, (x + 56 - modules1)>>3, (y >> 3) + 8 - (modules1>>4));
        GL.drawSprite(S.lasmod, (x + 56 + modules1)>>3, (y >> 3) + 8 - (modules1>>4));
    }
        
    if (modules2) {
        GL.drawSprite(S.lasmod, (x + 56 - modules2*2)>>3, (y >> 3) + 10 - (modules2>>4));
        GL.drawSprite(S.lasmod, (x + 56 + modules2*2)>>3, (y >> 3) + 10 - (modules2>>4));
    }

    const stuff = Hud.stuff();
    if (stuff.defense == Hud.ITEM_SHIELD) {
        const sprites = stuff.defense_overload ? shieldo : shieldn;
        GL.drawSpriteAlpha(
            sprites[(timer >> 2) % sprites.length], 
            (x >> 3) - 9,
            (y >> 3) - 11,
            28);
    }

    const frame = S.player[distance < -10 ? 0 :
                           distance < 0 ? 1 : 
                           distance == 0 ? 2 : 
                           distance <= 10 ? 3 : 4];

    GL.drawSprite(frame, x >> 3, y >> 3);

    if (muzzle_flash && opts.UseNewSchool)
        GL.drawSpriteAdditive(S.muzzle, (x >> 3) + 2, (y >> 3) - 22, 32);

    if (mouse.down && pl.controllable) {
        const tx = Math.max(minX, Math.min(maxX, (mouse.x << 3) - mouseDeltaX));
        const ty = Math.max(minY, Math.min(maxY, (mouse.y << 3) - mouseDeltaY));

        GL.drawSpriteAlpha(S.player[2], tx >> 3, ty >> 3, pl.target);
    }    
}

// t is 0..63
export function prerender(t: number) {
    if (t > 26)
        GL.drawSprite(S.player[2], 110, 373 - (t << 1));
}