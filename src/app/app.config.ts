import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        { provide: MAT_DATE_LOCALE, useValue: navigator.language || 'en-US' },
        provideNativeDateAdapter(),
        provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    ],
};
