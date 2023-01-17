import * as GL from "./webgl"
import * as S from "./sprites"
import { key } from "./input"
import { opts } from "./options"
import * as Hud from "./hud"
import * as Shot from "./shot"

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
    mousedown: number
    anim: number
    modules1: number
    modules2: number
    
    // X-axis rotation level, [-20, 20]
    distance: number
}

const pl : Player = {
    x: 880,
    y: 1960,
    x_speed: 0,
    y_speed: 0,
    controllable: true,
    r_x_speed: 0,
    r_y_speed: 0,
    cooldown: 0,
    shooting: 0,
    muzzle_flash: 0,
    timer: 0,
    laser_timer: 0,
    mousedown: 0,
    anim: 0,
    modules1: 0,
    modules2: 0,
    distance: 0
}

function shoot(stuff: Hud.Stuff) {

    switch (stuff.weapon) {
    case Hud.ITEM_WNONE:
    {
        pl.muzzle_flash = 2;
        pl.cooldown = stuff.offense != Hud.ITEM_SPEED ? 6 : 
                      stuff.offense_overload ? 1 : 3;
        const w = S.blast.w << 3, h = S.blast.h << 3;
        
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
              w = S.blade.w << 3, h = S.blade.h;
        const s = stuff.weapon_overload ? Shot.SHOT_OBLADE_SPAWN   
                                        : Shot.SHOT_BLADE_SPAWN;

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
              w = S.rocket.w << 3, h = S.rocket.h;
        const s = stuff.weapon_overload ? Shot.SHOT_OROCKET_SPAWN   
                                        : Shot.SHOT_ROCKET_SPAWN;
        
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
        pl.cooldown = 1;
        const x = pl.x, y = 0,
              w = 60, h = pl.y + 16;
        const s = Shot.SHOT_LASER;
        const sm = Shot.SHOT_LASERM;
        const d = stuff.offense != Hud.ITEM_SPEED ? 33 : 
                  stuff.offense_overload ? 33 * 5 : 33 * 3;
        const sh = (pl.distance >> 1) << 1;
        Shot.add(s, x + 72, y, w, h, d, sh, pl.laser_timer);
        if (stuff.offense == Hud.ITEM_MULTI) {
            Shot.add(sm, x + 56 - 96, y, w, h, d, sh, pl.laser_timer);
            Shot.add(sm, x + 56 + 96, y, w, h, d, sh, pl.laser_timer);
            if (stuff.offense_overload) {  
                Shot.add(sm, x + 56 - 64*3, y, w, h, d, sh, pl.laser_timer);
                Shot.add(sm, x + 56 + 64*3, y, w, h, d, sh, pl.laser_timer);   
            }
        }

        pl.laser_timer += stuff.offense != Hud.ITEM_SPEED ? 1 : 
                          stuff.offense_overload ? 3 : 2;
    }
    }
}

export function pos() {
    return {x: pl.x, y: pl.y};
}

export function step() {

    const friction = opts.ModPlayerFriction * opts.ModPlayerFriction * 4;
    const speed = 5 + opts.ModPlayerSpeed;

    // user input
    
    pl.r_x_speed = 0;
    pl.r_y_speed = 0;

    if (pl.controllable) {

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

        if (key.action) {
            pl.shooting = 5;
        }
    }

    // controlled movement

    function adjustSpeed(realSpeed: number, requestedSpeed: number) {
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

    pl.x_speed = adjustSpeed(pl.x_speed, pl.r_x_speed);
    pl.y_speed = adjustSpeed(pl.y_speed, pl.r_y_speed);

    if (pl.distance > 0) --pl.distance;
    if (pl.distance < 0) ++pl.distance;
    
    pl.x += pl.x_speed;
    pl.y += pl.y_speed;

    // clipping

    const bounce = opts.ModWallsBounce ? -1 : 0;

    if (pl.x < 32) {
        pl.x = 32;
        pl.x_speed *= bounce;
    } else if (pl.x > 1696) {
        pl.x = 1696;
        pl.x_speed *= bounce;
    }

    if (pl.y < 192) {
        pl.y = 192;
        pl.y_speed *= bounce;
    } else if (pl.y > 2176) {
        pl.y = 2176;
        pl.y_speed *= bounce;
    }

    // Shots

    if (pl.cooldown) --pl.cooldown;
    if (pl.shooting) --pl.shooting;
    if (pl.muzzle_flash) --pl.muzzle_flash;

    const stuff = Hud.stuff();

    if (pl.controllable && !pl.cooldown && (opts.ModAutoFire || pl.shooting))
        shoot(stuff)

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


}

export function render() {
    
    const {x, y, distance, muzzle_flash, modules1, modules2} = pl;

    if (modules1) {
        GL.drawSprite(S.lasmod, (x + 56 - ((modules1*6)>>3))>>3, (y >> 3) + 8 - (modules1>>4));
        GL.drawSprite(S.lasmod, (x + 56 + ((modules1*6)>>3))>>3, (y >> 3) + 8 - (modules1>>4));
    }
        
    if (modules2) {
        GL.drawSprite(S.lasmod, (x + 56 - ((modules2*12)>>3))>>3, (y >> 3) + 10 - (modules2>>4));
        GL.drawSprite(S.lasmod, (x + 56 + ((modules2*12)>>3))>>3, (y >> 3) + 10 - (modules2>>4));
    }

    const frame = S.player[distance < -10 ? 0 :
                           distance < 0 ? 1 : 
                           distance == 0 ? 2 : 
                           distance <= 10 ? 3 : 4];

    GL.drawSprite(frame, x >> 3, y >> 3);

    if (muzzle_flash && opts.UseNewSchool)
        GL.drawSpriteAdditive(S.muzzle, (x >> 3) + 2, (y >> 3) - 22, 32);

}