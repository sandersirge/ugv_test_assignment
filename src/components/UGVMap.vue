<template>
    <div class="map-wrapper">
        <div id="map" ref="mapContainer" class="map-container"></div>
        
        <button class="engine-btn" @click="toggleEngine">
            <span class="icon">{{ engineStarted ? '🛑' : '✅' }}</span>
            {{ engineStarted ? 'Turn Off Engine' : 'Start Engine' }}
        </button>
        
        <div v-if="showPopup" class="popup-overlay">
            <div class="popup-content">
                <p>Please start the engine!</p>
            </div>
        </div>

        <div v-if="waypointManager.currentWaypoint.value" class="popup-overlay waypoint-popup">
            <div class="popup-content">
                <p v-if="formattedWaypoint">{{ formattedWaypoint }}</p>
                <button @click="onDrive">Drive</button>
                <button @click="onSave">Save</button>
                <button @click="onDiscard">Discard</button>
            </div>
        </div>
    </div>
</template>
  
<script lang="ts" setup>
    import { onMounted, ref, onBeforeUnmount } from 'vue';
    import { computed } from 'vue';
    import { useEngineControl } from '../ts/useEngineControl.ts';
    import { useUGVMap } from '../ts/useUGVMap.ts';
    import { useWaypointManager } from '../ts/useWPManager.ts';

    const mapContainer = ref<HTMLDivElement | null>(null);
    const currentPosition = ref<{ lat: number; lng: number } | null>(null);
    const { engineStarted, showPopup, toggleEngine, displayPopup } = useEngineControl();
    const initialPosition = { lat: 59.437, lng: 24.7536 };
    
    const ugvMap = useUGVMap();
    const waypointManager = useWaypointManager();

    const formattedWaypoint = computed(() => {
        const wp = waypointManager.currentWaypoint.value;
        if (!wp) return null;
        return `Waypoint at (${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)})`;
    });

    const onMapLongPress = (e: L.LeafletMouseEvent) => {
        waypointManager.addWaypoint(e.latlng.lat, e.latlng.lng);
        ugvMap.setWaypointMarker(e.latlng.lat, e.latlng.lng);
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (!engineStarted.value) {
            displayPopup();
            return;
        }
        ugvMap.handleKeydown(event);
    };

    const onDrive = () => {
        const destination = waypointManager.driveToWaypoint();
        if (destination) {
            ugvMap.driveTo(destination);
            ugvMap.clearWaypointMarker();
            waypointManager.discardWaypoint();
        }
    };

    const onSave = () => {
        ugvMap.clearWaypointMarker();
        waypointManager.saveWaypoint();
    };

    const onDiscard = () => {
        ugvMap.clearWaypointMarker();
        waypointManager.discardWaypoint();
    };

    onMounted(() => {  
        if (mapContainer.value) {
            ugvMap.initialize(mapContainer.value, initialPosition);
            ugvMap.addLongPressListener(onMapLongPress);
            window.addEventListener('keydown', handleKeydown);
        }
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeydown);
        ugvMap.removeLongPressListener();
        ugvMap.destroy();
    });
</script>
  
<style scoped>
    .map-wrapper {
        position: relative;
        width: 100vw;
        height: 100vh;
    }

    .map-container {
        width: 100%;
        height: 100%;
    }

    .engine-btn {
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: rgba(128, 128, 128, 0.8);
        border: 2px solid black;
        color: white;
        padding: 10px 15px;
        cursor: pointer;
        font-size: 16px;
        border-radius: 4px;
        z-index: 1000;
    }

    .engine-btn .icon {
        margin-right: 8px;  
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }

    .popup-content {
        background-color: #333;
        color: #fff;
        padding: 20px 30px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
</style>
  