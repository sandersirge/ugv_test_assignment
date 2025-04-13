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
}

export function useUGVMap(): UGVMap {
    let map: L.Map | null = null;
    let marker: (L.Marker & { setRotationAngle: (angle: number) => void }) | null = null;
    const heading = ref(0);

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
        marker.addTo(map).bindPopup('UGV Starting Point').openPopup();

        window.addEventListener('keydown', handleKeydown);
    };

    const destroy = () => {
        window.removeEventListener('keydown', handleKeydown);
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

    return {
        map: map,
        marker: marker,
        heading,
        initialize,
        destroy,
        moveUGV,
        handleKeydown
    };
}
