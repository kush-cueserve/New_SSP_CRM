import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TodoManagerComponent } from 'app/modules/admin/dashboard/todo-manager/todo-manager.component';

@Component({
    selector: 'todo-header',
    template: `
        <button
            mat-icon-button
            [matMenuTriggerFor]="todoMenu"
            [matTooltip]="'Personal To-Dos'">
            <mat-icon [svgIcon]="'heroicons_outline:clipboard-document-check'"></mat-icon>
        </button>

        <mat-menu #todoMenu="matMenu" [overlapTrigger]="false" class="todo-header-menu">
            <div class="w-[280px] sm:w-[520px] p-0" (click)="$event.stopPropagation()">
                <div class="p-4 border-b bg-primary text-on-primary rounded-t-xl">
                    <div class="text-lg font-bold">Personal Tasks</div>
                    <div class="text-sm opacity-80 font-medium">Manage your daily reminders</div>
                </div>
                <todo-manager [mode]="'mini'"></todo-manager>
            </div>
        </mat-menu>
    `,
    styles: [
        `
            .todo-header-menu {
                max-width: none !important;
                padding: 0 !important;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        TodoManagerComponent
    ]
})
export class TodoHeaderComponent {
    constructor() {}
}
