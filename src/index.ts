import * as GL from "./webgl"
import * as Player from "./player"
import * as Shot from "./shot"
import * as Background from "./background"
import * as Enemy from "./enemy"
import * as Dan from "./dan"
import * as Pickup from "./pickup"
import * as Hud from "./hud"
import * as Float from "./float"
import * as Level from "./level"

// Rendering happens every time requestAnimationFrame() triggers.
function render() {
    GL.startRender();
    Background.render();
    Enemy.render();
    Shot.render();
    Pickup.render();
    Player.render();
    Dan.render();
    Hud.render();
    Float.render();
    GL.endRender();
}

// Simulation is based on a fixed-duration step
const stepDurationMilliseconds = 16.666; 
function step() {
    Background.step();
    Enemy.step();
    Hud.step();
    Shot.step();
    Player.step();
    Pickup.step();
    Dan.step();
    Float.step();
    Level.step();

    // if (Enemy.count() == 0) {        
    //     for (var i = 0; i < 1; ++i) {
    //         Enemy.add(new Sweep4(256 + 256*i, 256, "n"));
    //         Enemy.add(new Sweep4(256 + 256*i, 512, "n"));
    //         Enemy.add(new Sweep4(256 + 256*i, 768, "d"));
    //         Enemy.add(new Sweep4(256 + 256*i, 1024, "v"));
    //     }
    // }
}

export function run() {
    let nextFrame = +new Date();

    function frame() {
        const now = +new Date();
        
        if (now - nextFrame > 10000) 
            // The simulation is lagging more than 10 seconds,
            // give up on catching up: this was probably because
            // the tab was out-of-focus. 
            nextFrame = now;

        // Step based on actual time elapsed, rather than expecting
        // setInterval to be precise. 
        while (now > nextFrame) {
            step();
            nextFrame += stepDurationMilliseconds;
        } 

        // Render once per wake-up
        render();

        requestAnimationFrame(frame);
    }
    
    requestAnimationFrame(frame);

}
