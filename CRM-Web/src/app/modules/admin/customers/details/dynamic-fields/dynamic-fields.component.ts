import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DynamicFieldService } from '../../dynamic-field.service';
import { DynamicFieldMaster, DynamicFieldValue, UpsertDynamicFieldValue } from '../../customer.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'dynamic-fields',
    templateUrl: './dynamic-fields.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatSelectModule
    ]
})
export class DynamicFieldsComponent implements OnInit {
    @Input() customerId: number;

    private _dynamicFieldService = inject(DynamicFieldService);
    private _formBuilder = inject(FormBuilder);

    dynamicForm: FormGroup;
    fields: DynamicFieldMaster[] = [];
    isLoading: boolean = true;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor() {
        this.dynamicForm = this._formBuilder.group({});
    }

    ngOnInit(): void {
        this.loadFieldsAndValues();
    }

    /**
     * Load field definitions and their values for the customer
     */
    loadFieldsAndValues(): void {
        this.isLoading = true;

        // 1. Get all master fields
        this._dynamicFieldService.getMasters().subscribe(masters => {
            this.fields = masters;

            // 2. Build form controls
            this.fields.forEach(field => {
                this.dynamicForm.addControl(
                    field.id.toString(),
                    this._formBuilder.control(field.defaultValue || '')
                );
            });

            // 3. If edit mode, load existing values
            if (this.customerId && this.customerId > 0) {
                this._dynamicFieldService.getValuesByCustomer(this.customerId).subscribe(values => {
                    const patchObj = {};
                    values.forEach(v => {
                        patchObj[v.fieldId.toString()] = v.fieldValue;
                    });
                    this.dynamicForm.patchValue(patchObj);
                    this.isLoading = false;
                });
            } else {
                this.isLoading = false;
            }
        });
    }

    /**
     * Parse JSON options string
     */
    parseOptions(options: string): string[] {
        try {
            return options ? JSON.parse(options) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Get values for saving
     */
    getFormValues(): UpsertDynamicFieldValue[] {
        const results: UpsertDynamicFieldValue[] = [];
        const formValue = this.dynamicForm.getRawValue();

        Object.keys(formValue).forEach(key => {
            const val = formValue[key];
            results.push({
                fieldId: parseInt(key),
                fieldValue: val !== null && val !== undefined ? val.toString() : null
            });
        });

        return results;
    }

    /**
     * Save values to the database
     */
    save(): void {
        if (!this.customerId) return;

        const values = this.getFormValues();
        this._dynamicFieldService.upsertValues(this.customerId, values).subscribe({
            next: () => {
                console.log('Dynamic fields saved successfully');
            },
            error: (err) => {
                console.error('Error saving dynamic fields', err);
            }
        });
    }
}
