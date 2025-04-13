/*
For this file I used AI mainly for writing the localStorage code and implementing the methods which mainpulate with waypoints.
*/

import { ref } from 'vue';
export interface Waypoint {
    lat: number;
    lng: number;
    name: string;
}

export function useWaypointManager() {
    const STORAGE_KEY = 'ugv_saved_waypoints';

    function saveToStorage(waypoints: Waypoint[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(waypoints));
    }
    
    function loadFromStorage(): Waypoint[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function clearStorage() {
        savedWaypoints.value = [];
        localStorage.removeItem(STORAGE_KEY);
    }
  

    const currentWaypoint = ref<Waypoint | null>(null);
    const savedWaypoints = ref<Waypoint[]>(loadFromStorage());

    let waypointCount = 1;

    const addWaypoint = (lat: number, lng: number) => {
        currentWaypoint.value = {lat, lng, name: `Waypoint ${waypointCount++}`};
    };

    const deleteWaypoint = (index: number) => {
        savedWaypoints.value.splice(index, 1);
        saveToStorage(savedWaypoints.value);
    };
    
    const renameWaypoint = (index: number, newName: string) => {
        if (savedWaypoints.value[index]) {
            savedWaypoints.value[index].name = newName;
            saveToStorage(savedWaypoints.value);
        }
    };    

    const driveToWaypoint = () => currentWaypoint.value;

    const saveWaypoint = () => {
        if (currentWaypoint.value) {
            savedWaypoints.value.push({...currentWaypoint.value});
            saveToStorage(savedWaypoints.value);
            currentWaypoint.value = null;
        }
    };

    const discardWaypoint = () => {
        currentWaypoint.value = null;
    };

    return {
        currentWaypoint,
        savedWaypoints,
        addWaypoint,
        driveToWaypoint,
        saveWaypoint,
        discardWaypoint,
        deleteWaypoint,
        renameWaypoint,
        clearStorage
    };
}
