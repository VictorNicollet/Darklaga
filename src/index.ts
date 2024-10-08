import * as Game from "./game"

// Rendering happens every time requestAnimationFrame() triggers.
// Simulation is based on a fixed-duration step.
const stepDurationMilliseconds = 16.666; 

export function run() {
    let nextFrame = +new Date();

    function frame() {
        const now = +new Date();
        
        if (now - nextFrame > 1000) 
            // The simulation is lagging more than 1 second,
            // give up on catching up: this was probably because
            // the tab was out-of-focus, or maybe a catastrophic 
            // GC pause.
            nextFrame = now;

        // Step based on actual time elapsed, rather than expecting
        // setInterval to be precise. 
        while (now > nextFrame) {
            Game.step();
            nextFrame += stepDurationMilliseconds;
        } 

        // Render once per wake-up
        Game.render();

        requestAnimationFrame(frame);
    }
    
    requestAnimationFrame(frame);
}
