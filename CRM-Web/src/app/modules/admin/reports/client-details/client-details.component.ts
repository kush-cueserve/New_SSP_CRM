import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith, finalize } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { ReportsService, ReportField, ClientDetailsReportFilter } from '../reports.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from 'app/app.config';

@Component({
    selector: 'report-client-details',
    templateUrl: './client-details.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule,
        MatTooltipModule,
        MatAutocompleteModule,
        RouterLink,
        FuseLoadingBarComponent,
        MatProgressSpinnerModule
    ]
})
export class ClientDetailsComponent implements OnInit {
    private _reportsService = inject(ReportsService);
    private _httpClient = inject(HttpClient);
    private _baseApiUrl = inject(API_BASE_URL);

    // Lookups
    contactTypes: any[] = [];
    customerTypes: any[] = [];
    staff: any[] = [];
    tradingStatuses: any[] = [];
    partners: string[] = [];
    allPartners: any[] = [];

    // Search/Autocomplete
    partnerControl = new FormControl('');
    staffControl = new FormControl('');
    filteredPartners: Observable<string[]>;
    filteredStaff: Observable<any[]>;

    // Fields
    availableFields: ReportField[] = [];
    selectedFields: ReportField[] = [];
    availableSearch: string = '';
    selectedSearch: string = '';

    // Filters
    filters: ClientDetailsReportFilter = {
        contactType: undefined,
        partner: undefined,
        manager: undefined,
        clientType: undefined,
        group: undefined,
        isActive: true,
        isArchived: false,
        isExcluded: false,
        staffInCharge: undefined,
        tradingStatus: undefined,
        orderBy: 'Name',
        orderDirection: 'ASC',
        selectedFieldKeys: [],
        exportFormat: 'csv'
    };

    isLoading: boolean = false;
    isGenerating: boolean = false;

    ngOnInit(): void {
        this.loadLookups();
        this.loadFields();

        // Setup Autocomplete Filtering
        this.filteredPartners = this.partnerControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterPartners(value || ''))
        );

        this.filteredStaff = this.staffControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterStaff(value || ''))
        );

        // Sync control values with filters (Simplified for manual entry/clearing)
        this.partnerControl.valueChanges.subscribe(val => {
            if (!val) {
                this.filters.partner = undefined;
                this.filters.partnerId = undefined;
            }
        });

        this.staffControl.valueChanges.subscribe(val => {
            if (!val) this.filters.staffInCharge = undefined;
        });
    }

    onPartnerSelected(event: any): void {
        const val = event.option.value;
        if (!val) {
            this.filters.partnerId = undefined;
            this.filters.partner = undefined;
            return;
        }
        const found = this.allPartners.find(p => p.name === val);
        this.filters.partnerId = found ? found.id : undefined;
        this.filters.partner = val;
    }

    onStaffSelected(event: any): void {
        const val = event.option.value;
        if (!val) {
            this.filters.staffInCharge = undefined;
            return;
        }
        const found = this.staff.find(s => `${s.firstName} ${s.lastName}` === val);
        this.filters.staffInCharge = found ? found.id : undefined;
    }

    private _filterPartners(value: string): string[] {
        const filterValue = value.toLowerCase();
        return this.partners.filter(p => p.toLowerCase().includes(filterValue));
    }

    private _filterStaff(value: string): any[] {
        const filterValue = value.toLowerCase();
        return this.staff.filter(s => 
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(filterValue)
        );
    }

    /**
     * Load lookup data for filters
     */
    loadLookups(): void {
        this._httpClient.get(`${this._baseApiUrl}/api/lookups`).subscribe((res: any) => {
            this.contactTypes = res.contactTypes;
            this.customerTypes = res.customerTypes;
            this.staff = res.staff;
            this.tradingStatuses = res.tradingStatuses;
            
            // Map partners from Customers (as per user: "partner are clients")
            this.allPartners = res.customers;
            this.partners = res.customers.map(c => c.name).sort();

            // Trigger initial filters
            this.partnerControl.setValue('');
            this.staffControl.setValue('');
        });
    }

    /**
     * Load available fields based on selected client type
     */
    loadFields(): void {
        this.isLoading = true;
        this._reportsService.getAvailableFields(this.filters.clientType)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe((fields) => {
                this.availableFields = fields;
                
                // Set defaults if first load
                if (this.selectedFields.length === 0) {
                    this.selectedFields = fields.filter(f => f.key === 'Name' || f.key === 'Code');
                    this.availableFields = fields.filter(f => f.key !== 'Name' && f.key !== 'Code');
                } else {
                    // Update available fields by removing those already selected
                    const selectedKeys = this.selectedFields.map(s => s.key);
                    this.availableFields = fields.filter(f => !selectedKeys.includes(f.key));
                }
            });
    }

    /**
     * Add field to selection
     */
    addField(field: ReportField): void {
        this.selectedFields.push(field);
        this.availableFields = this.availableFields.filter(f => f.key !== field.key);
    }

    /**
     * Remove field from selection
     */
    removeField(field: ReportField): void {
        this.availableFields.push(field);
        this.selectedFields = this.selectedFields.filter(s => s.key !== field.key);
        this.availableFields.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    /**
     * Move all visible available fields to selected
     */
    addAll(): void {
        const filtered = this.getFilteredAvailable();
        this.selectedFields = [...this.selectedFields, ...filtered];
        const addedKeys = filtered.map(f => f.key);
        this.availableFields = this.availableFields.filter(f => !addedKeys.includes(f.key));
    }

    /**
     * Remove all selected fields (except name/code maybe?)
     */
    removeAll(): void {
        this.availableFields = [...this.availableFields, ...this.selectedFields];
        this.selectedFields = [];
        this.availableFields.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    /**
     * Get filtered available fields based on search
     */
    getFilteredAvailable(): ReportField[] {
        if (!this.availableSearch) return this.availableFields;
        return this.availableFields.filter(f => 
            f.displayName.toLowerCase().includes(this.availableSearch.toLowerCase()) ||
            f.category.toLowerCase().includes(this.availableSearch.toLowerCase())
        );
    }

    /**
     * Get filtered selected fields based on search
     */
    getFilteredSelected(): ReportField[] {
        if (!this.selectedSearch) return this.selectedFields;
        return this.selectedFields.filter(f => 
            f.displayName.toLowerCase().includes(this.selectedSearch.toLowerCase()) ||
            f.category.toLowerCase().includes(this.selectedSearch.toLowerCase())
        );
    }

    /**
     * Reset all filters to their default values
     */
    resetFilters(): void {
        this.filters = {
            contactType: undefined,
            partner: undefined,
            partnerId: undefined,
            manager: undefined,
            clientType: undefined,
            isActive: true,
            isArchived: false,
            isExcluded: false,
            staffInCharge: undefined,
            tradingStatus: undefined,
            orderBy: 'Name',
            orderDirection: 'ASC',
            selectedFieldKeys: this.selectedFields.map(f => f.key),
            exportFormat: 'csv'
        };

        // Reset autocomplete controls
        this.partnerControl.setValue('');
        this.staffControl.setValue('');
        
        // Reload fields if clientType was cleared
        this.loadFields();
    }

    /**
     * Generate and download the report
     */
    generateReport(): void {
        if (this.selectedFields.length === 0) return;

        this.isGenerating = true;
        this.filters.selectedFieldKeys = this.selectedFields.map(f => f.key);

        this._reportsService.exportClientDetails(this.filters)
            .pipe(finalize(() => this.isGenerating = false))
            .subscribe((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Client_Details_${new Date().getTime()}.${this.filters.exportFormat}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            });
    }
}
