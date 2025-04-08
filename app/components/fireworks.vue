<template>
    <canvas ref="magicCanvasRef" class="magic-canvas"></canvas>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick, defineExpose } from 'vue';
  
  // --- Component Configuration (Could be props later) ---
  const PARTICLES_PER_BURST = 70;
  const NUMBER_OF_BURSTS = 7;
  const GRAVITY = 0.04;
  const AIR_RESISTANCE = 0.985;
  const PARTICLE_LIFESPAN_MIN = 90;
  const PARTICLE_LIFESPAN_MAX = 180;
  const EXPLOSION_SPEED_MIN = 1.0;
  const EXPLOSION_SPEED_MAX = 4.5;
  const PARTICLE_BASE_SIZE = 2.0;
  const SWIRL_FACTOR = 0.05;
  
  const ALCHEMY_HUES = {
    GOLD: { base: 45, range: 20 },
    SILVER: { base: 210, range: 30 },
    LEAD_TO_GOLD: { start: 220, end: 45 },
    POTION: { base: 150, range: 40 },
    STONE: { base: 0, range: 15 },
  };
  const THEME_KEYS = Object.keys(ALCHEMY_HUES);
  // --- End Configuration ---
  
  // --- State ---
  const particles = ref([]);
  const isAnimating = ref(false); // Internal flag to manage animation loop state
  const magicCanvasRef = ref(null); // Ref for the canvas element in *this* component
  let ctx = null;                   // Canvas 2D context
  let animationFrameId = null;
  let nextParticleId = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  
  // --- Canvas & Context Setup ---
  function setupCanvas() {
    const canvas = magicCanvasRef.value;
     if (!canvas) {
      console.error("AlchemicalMagicCanvas: Canvas element not found during setup.");
      return false;
     }
  
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx = canvas.getContext('2d');
     if (!ctx) {
       console.error("AlchemicalMagicCanvas: Failed to get 2D context.");
       return false;
     }
    ctx.scale(dpr, dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    console.log(`AlchemicalMagicCanvas: Setup complete (${canvasWidth}x${canvasHeight})`);
    return true;
  }
  
  // --- Simple Lerp ---
  function lerp(start, end, amount) {
    return start * (1 - amount) + end * amount;
  }
  
  // --- Animation Loop ---
  function animationLoop() {
     if (!ctx) {
      console.error("AlchemicalMagicCanvas: Animation loop missing context.");
      isAnimating.value = false; // Ensure animation stops if context is lost
      animationFrameId = null;
      return;
     }
  
    // Clear canvas completely each frame
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
    const remainingParticles = [];
    // --- (Particle physics and drawing logic - same as before) ---
    for (const particle of particles.value) {
      particle.vx *= AIR_RESISTANCE;
      particle.vy *= AIR_RESISTANCE;
      particle.vy += GRAVITY;
      particle.vx += Math.sin(particle.age * 0.08 + particle.id) * SWIRL_FACTOR;
  
      particle.x += particle.vx;
      particle.y += particle.vy;
  
      particle.age++;
      const lifeProgress = Math.min(1, particle.age / particle.lifespan);
      particle.opacity = Math.max(0, (1 - lifeProgress) * 1.5);
      particle.currentSize = Math.max(0, particle.size * (1 - lifeProgress * 0.7));
  
      let currentHue = particle.hue;
      let currentSaturation = particle.saturation;
      if (particle.hueEnd !== null) {
          const hueDiff = particle.hueEnd - particle.hueStart;
          const wrappedDiff = (hueDiff + 180) % 360 - 180;
          currentHue = (particle.hueStart + wrappedDiff * lifeProgress + 360) % 360;
      }
      if(particle.theme === 'SILVER' || (particle.theme === 'LEAD_TO_GOLD' && lifeProgress < 0.5)) {
          currentSaturation = lerp(particle.saturation, 5, lifeProgress);
      } else if (particle.theme === 'LEAD_TO_GOLD' && lifeProgress >= 0.5) {
           currentSaturation = lerp(5, particle.saturation, (lifeProgress - 0.5) * 2);
      }
  
      if (particle.age < particle.lifespan && particle.opacity > 0 && particle.currentSize > 0.1) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${currentHue}, ${currentSaturation}%, ${particle.lightness}%, ${particle.opacity})`;
        ctx.fill();
        remainingParticles.push(particle);
      }
    }
    // --- End Particle Logic ---
  
    particles.value = remainingParticles;
  
    if (particles.value.length > 0) {
      animationFrameId = requestAnimationFrame(animationLoop);
    } else {
      isAnimating.value = false; // Update internal state
      animationFrameId = null;
      console.log("AlchemicalMagicCanvas: Animation finished.");
    }
  }
  
  // --- Exposed Trigger Method ---
  function castMagic() {
    if (!ctx) {
      console.warn("AlchemicalMagicCanvas: castMagic called, but context not ready. Attempting setup...");
      if (!setupCanvas()) {
        console.error("AlchemicalMagicCanvas: Canvas setup failed. Cannot cast magic.");
        return;
      }
    }
    // Add new particles to the existing array
    const currentParticles = particles.value;
     // --- (Particle generation logic - same as before) ---
    for (let burst = 0; burst < NUMBER_OF_BURSTS; burst++) {
        const explosionX = Math.random() * canvasWidth;
        const explosionY = Math.random() * (canvasHeight * 0.6) + (canvasHeight * 0.4);
        const themeKey = THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)];
        const theme = ALCHEMY_HUES[themeKey];
  
        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (EXPLOSION_SPEED_MAX - EXPLOSION_SPEED_MIN) + EXPLOSION_SPEED_MIN;
            const lifespan = Math.random() * (PARTICLE_LIFESPAN_MAX - PARTICLE_LIFESPAN_MIN) + PARTICLE_LIFESPAN_MIN;
            let hueStart, hueEnd = null, saturation = 90, lightness = 70;
  
            if (themeKey === 'LEAD_TO_GOLD') {
                hueStart = theme.start + Math.random() * 20 - 10;
                hueEnd = theme.end + Math.random() * 10 - 5;
                saturation = 80; lightness = 65;
            } else if (themeKey === 'SILVER') {
                hueStart = theme.base + Math.random() * theme.range - theme.range / 2;
                saturation = 20; lightness = 80;
            } else {
                hueStart = theme.base + Math.random() * theme.range - theme.range / 2;
            }
  
            currentParticles.push({
                id: nextParticleId++, x: explosionX, y: explosionY,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - EXPLOSION_SPEED_MAX * 0.4,
                lifespan: lifespan, age: 0, hue: hueStart, hueStart: hueStart, hueEnd: hueEnd,
                saturation: saturation, lightness: lightness, opacity: 1,
                size: PARTICLE_BASE_SIZE + Math.random() * 2.5, currentSize: 0, theme: themeKey
            });
        }
    }
    // --- End Particle Generation ---
  
    particles.value = currentParticles; // Ensure reactivity
  
    // Start animation loop ONLY if it's not already running
    if (!isAnimating.value) {
      isAnimating.value = true; // Set internal flag
      console.log("AlchemicalMagicCanvas: Starting animation...");
      // Use nextTick ensure component is mounted and canvas potentially ready
      nextTick(() => {
          if (!animationFrameId) { // Double check another call didn't start it
             animationFrameId = requestAnimationFrame(animationLoop);
          }
      });
    } else {
        console.log("AlchemicalMagicCanvas: Animation already running, adding particles.");
    }
  }
  
  // --- Window Resize Handler ---
  function handleResize() {
    console.log("AlchemicalMagicCanvas: Window resized.");
     if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // Decide if animation should restart automatically or wait for next castMagic call
        // isAnimating.value = false; // Reset if stopping animation on resize
     }
     // Attempt setup, if successful and was animating, restart loop
     if (setupCanvas() && isAnimating.value) {
         // If we stopped the loop above, restart it IF particles still exist
         // If we didn't stop it, resizing might cause visual jumps, but it continues
         // Let's keep it simple: just resize. Animation continues with new dimensions.
         // If the loop was stopped, it won't restart automatically here.
         // If particles exist and it wasn't animating (e.g. stopped on resize),
         // it would need another castMagic call to restart.
         // For robust restart: check particle count and isAnimating state.
         if (!animationFrameId && particles.value.length > 0){
              animationFrameId = requestAnimationFrame(animationLoop);
         }
     }
  }
  
  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Use nextTick to ensure the canvas element is rendered in the DOM
    nextTick(() => {
        setupCanvas();
        window.addEventListener('resize', handleResize);
    });
  });
  
  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      console.log("AlchemicalMagicCanvas: Animation cancelled on unmount.");
    }
    window.removeEventListener('resize', handleResize);
  });
  
  // --- Expose Method for Parent ---
  defineExpose({
    castMagic
  });
  
  </script>
  
  <style scoped>
  .magic-canvas {
    position: fixed; /* Or absolute if constrained by a parent */
    top: 0;
    left: 0;
    width: 100%; /* Will be overridden by JS style */
    height: 100%; /* Will be overridden by JS style */
    z-index: 0; /* Default z-index, parent can control */
    background-color: #1a1a1d; /* Default background */
    display: block;
    pointer-events: none; /* Canvas doesn't capture clicks */
  }
  </style>