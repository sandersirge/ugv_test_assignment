/*
For this file I used AI mainly for dealing with the usage of leaflet library
and implementing the longpress and other keyboard events that manipulates with the UGV's location on the map.
*/

import type { Ref } from 'vue';
import { ref } from 'vue';
import L from 'leaflet';
import 'leaflet-rotatedmarker';

export interface UGVMap {
    map: L.Map | null;
    marker: (L.Marker & { setRotationAngle: (angle: number) => void }) | null;
    heading: Ref<number>;
    initialize: (container: HTMLDivElement, initialPosition: { lat: number; lng: number }) => void;
    destroy: () => void;
    moveUGV: (forward?: boolean) => void;
    handleKeydown: (event: KeyboardEvent) => void;
    driveTo: (destination: { lat: number; lng: number }) => void;
    addLongPressListener: (
        callback: (e: L.LeafletMouseEvent) => void,
        shouldHandle?: () => boolean
    ) => void;
    removeLongPressListener: () => void;
    setWaypointMarker: (lat: number, lng: number) => void;
    clearWaypointMarker: () => void;
}

export function useUGVMap(): UGVMap {
    let map: L.Map | null = null;
    let marker: (L.Marker & { setRotationAngle: (angle: number) => void }) | null = null;
    let waypointMarker: L.Marker | null = null;

    const heading = ref(0);

    let mapElement: HTMLElement | null = null;
    let longPressTimeout: number | null = null;

    function calculateOffsets(lat: number, meters: number, angleRad: number) {
        const latOffset = (meters / 111320) * Math.cos(angleRad);
        const lngOffset = (meters / (40075000 * Math.cos((lat * Math.PI) / 180) / 360)) * Math.sin(angleRad);
        return { latOffset, lngOffset };
    }

    const initialize = (container: HTMLDivElement, initialPosition: { lat: number; lng: number }) => {
        map = L.map(container, { keyboard: false }).setView([initialPosition.lat, initialPosition.lng], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const arrowIcon = L.icon({
            iconUrl: new URL('../assets/arrow.svg', import.meta.url).href,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        marker = L.marker([initialPosition.lat, initialPosition.lng], {
        rotationAngle: heading.value,
        rotationOrigin: 'center center',
        icon: arrowIcon
        }) as L.Marker & { setRotationAngle: (angle: number) => void };
        marker.addTo(map).bindPopup('UGV Marker').openPopup();
        waypointMarker = null;
    };

    const destroy = () => {
        map?.remove();
    };

    const moveUGV = (forward = true) => {
        if (!marker) return;
        const currentPos = marker.getLatLng();
        const lat = currentPos.lat;
        const lng = currentPos.lng;

        const meters = forward ? 5 : -5;
        const angleRad = (heading.value * Math.PI) / 180;
        const { latOffset, lngOffset } = calculateOffsets(lat, meters, angleRad);
        const newLat = lat + latOffset;
        const newLng = lng + lngOffset;
        marker.setLatLng([newLat, newLng]);
        map?.setView([newLat, newLng], map.getZoom(), { animate: true });
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (!map || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
        switch (event.key) {
            case "ArrowUp":
                moveUGV(true);
                break;
            case "ArrowDown":
                moveUGV(false);
                break;
            case "ArrowLeft":
                heading.value = (heading.value - 3 + 360) % 360;
                marker?.setRotationAngle(heading.value);
                break;
            case "ArrowRight":
                heading.value = (heading.value + 3) % 360;
                marker?.setRotationAngle(heading.value);
                break;
        }
    };

    const driveTo = (destination: { lat: number; lng: number }) => {
        if (marker && map) {
          marker.setLatLng([destination.lat, destination.lng]);
          map.setView([destination.lat, destination.lng], map.getZoom(), { animate: true });
        }
    };

    let onMouseDown: (e: MouseEvent) => void;
    let onMouseUp: () => void;
    let onTouchStart: (e: TouchEvent) => void;
    let onTouchEnd: () => void;

    const addLongPressListener = (callback: (e: L.LeafletMouseEvent) => void, shouldHandle: () => boolean = () => true) => {
        if (!map) return;
        mapElement = map.getContainer();

        const triggerLongPress = (clientX: number, clientY: number) => {
            if (!shouldHandle()) return;
            const point = L.point(clientX, clientY);
            const simulatedLatLng = map!.containerPointToLatLng(point);
            const leafletEvent = {
                latlng: simulatedLatLng,
                originalEvent: {} as MouseEvent
            } as L.LeafletMouseEvent;
            callback(leafletEvent);
        };

        onMouseDown = (e: MouseEvent) => {
            if (!shouldHandle() || (e.target as HTMLElement).closest('button, .ui, [data-ignore-longpress]')) return;

            longPressTimeout = window.setTimeout(() => {
                triggerLongPress(e.clientX, e.clientY);
            }, 1500);
        };

        onMouseUp = () => {
            if (longPressTimeout) {
                clearTimeout(longPressTimeout);
                longPressTimeout = null;
            }
        };

        onTouchStart = (e: TouchEvent) => {
            if (!shouldHandle() || (e.target as HTMLElement).closest('button, .ui, [data-ignore-longpress]')) return;

            const touch = e.touches[0];
            longPressTimeout = window.setTimeout(() => {
                triggerLongPress(touch.clientX, touch.clientY);
            }, 1500);
        };

        onTouchEnd = () => {
            if (longPressTimeout) {
                clearTimeout(longPressTimeout);
                longPressTimeout = null;
            }
        };

        mapElement.addEventListener("mousedown", onMouseDown);
        mapElement.addEventListener("mouseup", onMouseUp);
        mapElement.addEventListener("touchstart", onTouchStart);
        mapElement.addEventListener("touchend", onTouchEnd);
    };

    const removeLongPressListener = () => {
        if (!mapElement) return;
        mapElement.removeEventListener("mousedown", onMouseDown);
        mapElement.removeEventListener("mouseup", onMouseUp);
        mapElement.removeEventListener("touchstart", onTouchStart);
        mapElement.removeEventListener("touchend", onTouchEnd);
        mapElement = null;
    };

    return {
        map: map,
        marker: marker,
        heading,
        initialize,
        destroy,
        moveUGV,
        handleKeydown,
        driveTo,
        addLongPressListener,
        removeLongPressListener,
        setWaypointMarker: (lat: number, lng: number) => {
            if (!map) return;
        
            if (!waypointMarker) {
                waypointMarker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: new URL('../assets/waypoint.svg', import.meta.url).href,
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    }),
                }).addTo(map);
            } else {
                waypointMarker.setLatLng([lat, lng]);
            }
        },
        clearWaypointMarker: () => {
            if (waypointMarker) {
                map?.removeLayer(waypointMarker);
                waypointMarker = null;
            }
        },
        
    };
}
