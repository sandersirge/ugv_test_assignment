import { ref } from 'vue';

export function useEngineControl() {
    const engineStarted = ref(false);
    const showPopup = ref(false);

    const toggleEngine = () => {
        engineStarted.value = !engineStarted.value;
    };

    const displayPopup = () => {
        showPopup.value = true;
        setTimeout(() => {
            showPopup.value = false;
        }, 2000);
    };

    return {
        engineStarted,
        showPopup,
        toggleEngine,
        displayPopup,
    };
}
