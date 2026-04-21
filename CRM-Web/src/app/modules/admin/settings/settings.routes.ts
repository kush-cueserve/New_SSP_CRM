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
    }
] as Routes;
