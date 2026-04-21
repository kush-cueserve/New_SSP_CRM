import { Routes } from '@angular/router';
import { EmailSettingsComponent } from 'app/modules/admin/settings/email/email.component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'email'
    },
    {
        path: 'email',
        component: EmailSettingsComponent
    },
    {
        path: 'dynamic-fields',
        loadComponent: () => import('./dynamic-fields/dynamic-fields.component').then(m => m.DynamicFieldsAdminComponent)
    }
] as Routes;
