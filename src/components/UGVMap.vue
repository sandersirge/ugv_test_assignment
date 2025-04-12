<template>
    <div id="map" ref="mapContainer" class="map-container"></div>
</template>
  
<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import L from 'leaflet';
  
  const mapContainer = ref<HTMLDivElement | null>(null);
  const initialPosition = { lat: 59.437, lng: 24.7536 }; // Tallinn example
  
  onMounted(() => {  
    if (!mapContainer.value) return;

    var map = L.map(mapContainer.value).setView([initialPosition.lat, initialPosition.lng], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([59.437, 24.7536])
        .addTo(map)
        .bindPopup('UGV Starting Point')
        .openPopup();
  });
</script>
  
<style scoped>
    .map-container {
        height: 100vh;
        width: 100vw;
    }
</style>
  