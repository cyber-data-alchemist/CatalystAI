<template>
    <v-app>
      <v-main>
        <fireworks ref="magicCanvas" />
  
        <v-container class="d-flex justify-center align-center" style="height: 100vh;">
           <v-btn
             color="amber-darken-2"
             size="x-large"
             rounded="pill"
             elevation="10"
             @click="triggerTheMagic"
             class="magic-trigger-button"
             variant="elevated"
             prepend-icon="mdi-flask-outline"
           >
             Transmute!
           </v-btn>
        </v-container>
  
      </v-main>
    </v-app>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  // Import the component
  
  // Create a ref to access the component instance
  const magicCanvas = ref(null);
  
  // Function to call the exposed method on the component
  function triggerTheMagic() {
    // Optional chaining ?. ensures no error if ref is not ready
    magicCanvas.value?.castMagic();
  }
  </script>
  
  <style scoped>
  .magic-trigger-button {
    position: fixed; /* Or relative to its container */
    left: 50%;
    bottom: 5%;
    transform: translateX(-50%);
    z-index: 10; /* Ensure button is above canvas */
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    box-shadow: 0 0 18px rgba(255, 193, 7, 0.5);
  }
  
  /* Optional: Ensure v-main allows fixed positioning overlap */
  .v-main {
    position: relative; /* Or ensure it doesn't create stacking context issues */
  }
  </style>