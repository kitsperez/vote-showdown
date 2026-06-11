import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho, echo } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

configureEcho({
    broadcaster: 'reverb',
});

// Forward Echo's socket id on Inertia/axios requests so broadcast(...)->toOthers()
// can exclude the acting user — otherwise voters double-apply their own vote (risk R3).
axios.interceptors.request.use((config) => {
    try {
        const id = echo().socketId();
        if (id) {
            config.headers['X-Socket-Id'] = id;
        }
    } catch {
        // Echo not yet connected — nothing to forward.
    }
    return config;
});

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
