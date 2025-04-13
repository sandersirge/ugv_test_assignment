<!--
For this file I used AI mainly for defining some of the methods inside the script block, 
when implementing keyboard events and waypoint logic, using typescript and leaflet for the application and the errors that came up along the way.

I was not very familiar with typescript and leaflet usage, thus I used AI to overcome this gap.

Unfortunately, I didn't have enough time for refactoring of the code but I definitely could've made the code more modular by 
breaking it down into smaller chunks so that the main parts of the typescript logic are moved more into additional files and also
there is a possibility to improve by breaking down the application's structure into smaller and more modular components.
-->
<template>
    <div class="map-wrapper">
        <div id="map" ref="mapContainer" class="map-container"></div>
        
        <button class="engine-btn" @click="toggleEngine" data-ignore-longpress>
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

        <div class="saved-waypoints">
            <h3>Saved Waypoints</h3>
            <ul>
                <li v-for="(wp, index) in waypointManager.savedWaypoints.value.filter(w => typeof w.lat === 'number' && typeof w.lng === 'number')" :key="index" @click="openWaypointOptions(index)">
                    📍 {{ wp.name || `WP ${index + 1}` }} — ({{ wp.lat.toFixed(4) }}, {{ wp.lng.toFixed(4) }})
                </li>
            </ul>
            <button @click="waypointManager.clearStorage()">Clear All</button>
        </div>

        <div v-if="selectedWaypointIndex !== null" class="popup-overlay waypoint-popup">
            <div class="popup-content">
                <h4>{{ waypointManager.savedWaypoints.value[selectedWaypointIndex].name }}</h4>
                <button @click="onDriveToSaved">Drive</button>
                <button @click="startRename">Rename</button>
                <button @click="onDelete">Delete</button>
                <button @click="selectedWaypointIndex = null">Cancel</button>

                <div v-if="renaming">
                    <input v-model="renameText" placeholder="New name" />
                    <button @click="confirmRename">Confirm</button>
                </div>
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
        if (!wp || wp.lat === undefined || wp.lng === undefined) return null;
        return `Waypoint at (${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)})`;
    });

    const onMapLongPress = (e: L.LeafletMouseEvent) => {
        waypointManager.addWaypoint(e.latlng.lat, e.latlng.lng);
        ugvMap.setWaypointMarker(e.latlng.lat, e.latlng.lng);
    };

    const isControlKey = (event: KeyboardEvent) => {
        return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key);
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (!engineStarted.value && isControlKey(event)) {
            displayPopup();
            return;
        }
        if (engineStarted.value) ugvMap.handleKeydown(event);
    };

    const handleMouseDown = (event: MouseEvent) => {
        if (!engineStarted.value && !(event.target as HTMLElement)?.closest('[data-ignore-longpress]')) {
            displayPopup();
        }
    };

    const handleTouchStart = (event: TouchEvent) => {
        if (!engineStarted.value && !(event.target as HTMLElement)?.closest('[data-ignore-longpress]')) {
            displayPopup();
        }
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

    const selectedWaypointIndex = ref<number | null>(null);
    const renaming = ref(false);
    const renameText = ref("");

    const openWaypointOptions = (index: number) => {
        selectedWaypointIndex.value = index;
        renaming.value = false;
        renameText.value = waypointManager.savedWaypoints.value[index].name;
    };

    const onDriveToSaved = () => {
        const wp = waypointManager.savedWaypoints.value[selectedWaypointIndex.value!];
        ugvMap.driveTo(wp);
        selectedWaypointIndex.value = null;
    };

    const startRename = () => {
        renaming.value = true;
    };

    const confirmRename = () => {
        waypointManager.renameWaypoint(selectedWaypointIndex.value!, renameText.value);
        renaming.value = false;
    };

    const onDelete = () => {
        waypointManager.deleteWaypoint(selectedWaypointIndex.value!);
        selectedWaypointIndex.value = null;
    };

    onMounted(() => {  
        if (mapContainer.value) {
            ugvMap.initialize(mapContainer.value, initialPosition);
            ugvMap.addLongPressListener(onMapLongPress, () => engineStarted.value);
            window.addEventListener('keydown', handleKeydown);
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('touchstart', handleTouchStart);
        }
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('touchstart', handleTouchStart);
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

    .saved-waypoints {
        position: absolute;
        top: 100px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        color: white;
        border-radius: 8px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
    }

    .saved-waypoints ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .saved-waypoints li {
        margin: 5px 0;
        cursor: pointer;
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        transition: background 0.2s;
    }

    .saved-waypoints li:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
  