import { Routes } from '@angular/router';
import { ClientDetailsComponent } from './client-details/client-details.component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'client-details'
    },
    {
        path: 'client-details',
        component: ClientDetailsComponent
    }
] as Routes;
