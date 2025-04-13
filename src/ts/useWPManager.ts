import { ref } from 'vue';
export interface Waypoint {
  lat: number;
  lng: number;
}

export function useWaypointManager() {
  const currentWaypoint = ref<Waypoint | null>(null);
  const savedWaypoints = ref<Waypoint[]>([]);

  const addWaypoint = (lat: number, lng: number) => {
    currentWaypoint.value = { lat, lng };
  };

  const driveToWaypoint = () => currentWaypoint.value;

  const saveWaypoint = () => {
    if (currentWaypoint.value) {
      savedWaypoints.value.push(currentWaypoint.value);
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
    discardWaypoint
  };
}
