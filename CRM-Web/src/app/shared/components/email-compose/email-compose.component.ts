import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
    selector: 'app-email-compose',
    templateUrl: './email-compose.component.html',
    styleUrls: ['./email-compose.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        QuillEditorComponent
    ],
    encapsulation: ViewEncapsulation.None
})
export class EmailComposeComponent {
    composeForm: FormGroup;
    
    // Editor modules for Quill
    modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'header': [1, 2, 3, false] }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ]
    };

    constructor(
        public dialogRef: MatDialogRef<EmailComposeComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _fb: FormBuilder
    ) {
        // Build the form with default values or passed data
        this.composeForm = this._fb.group({
            to: [{ value: data?.toEmail || '', disabled: true }],
            subject: [data?.subject || 'Document Attached', Validators.required],
            body: [data?.body || '<p>Hi,</p><p>Please find the attached document.</p><br/><p>Best regards,<br/>SSP CRM Team</p>', Validators.required]
        });
    }

    send(): void {
        if (this.composeForm.valid) {
            // getRawValue gets disabled fields too, ensuring 'to' is included
            this.dialogRef.close(this.composeForm.getRawValue());
        }
    }

    close(): void {
        this.dialogRef.close();
    }
}
