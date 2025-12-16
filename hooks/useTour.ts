import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getSettings, updateSetting } from '../services/settingsService';

export const useTour = () => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        driverObj.current = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: '#nav-dashboard',
                    popover: {
                        title: 'Dashboard',
                        description: 'Your central hub for recent activity and quick actions.'
                    }
                },
                {
                    element: '#nav-thinking',
                    popover: {
                        title: 'Thinking Canvas',
                        description: 'A space to brainstorm and organize your thoughts visually.'
                    }
                },
                {
                    element: '#nav-review',
                    popover: {
                        title: 'Review Mode',
                        description: 'Review documents and leave comments effectively.'
                    }
                },
                {
                    element: '#nav-add-doc',
                    popover: {
                        title: 'New Page',
                        description: 'Click here to create a new document quickly.'
                    }
                },
                {
                    element: '#nav-settings',
                    popover: {
                        title: 'Settings',
                        description: 'Customize your experience and manage preferences.'
                    }
                }
            ],
            onDestroyStarted: () => {
                if (!driverObj.current.hasNextStep() || confirm('Are you sure you want to exit the tour?')) {
                    driverObj.current.destroy();
                    completeTour();
                }
            },
        });
    }, []);

    const completeTour = async () => {
        try {
            await updateSetting('has_seen_onboarding', true);
        } catch (error) {
            console.error('Failed to update onboarding status', error);
        }
    };

    const startTour = () => {
        if (driverObj.current) {
            driverObj.current.drive();
        }
    };

    const checkAndStartTour = async () => {
        try {
            const settings = await getSettings();
            if (!settings.has_seen_onboarding) {
                // Small delay to ensure UI is ready
                setTimeout(() => {
                    startTour();
                }, 1000);
            }
        } catch (error) {
            console.error('Error checking tour status:', error);
        }
    };

    return { startTour, checkAndStartTour };
};
