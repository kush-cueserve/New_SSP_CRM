import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CustomerService } from '../../customer.service';
import { CustomerServicePortfolio } from '../../customer.types';
import { JobService } from '../../../jobs/job.service';
import { Job } from '../../../jobs/job.types';

@Component({
    selector: 'customer-summary',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule],
    templateUrl: './summary.component.html'
})
export class SummaryComponent implements OnChanges {
    @Input() customer: any;
    @Input() customerId: number;

    private _customerService = inject(CustomerService);
    private _jobService = inject(JobService);

    services: CustomerServicePortfolio[] = [];
    jobs: Job[] = [];
    totalFees: number = 0;
    activeJobsCount: number = 0;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['customerId'] && this.customerId) {
            this.loadSummaryData();
        }
    }

    loadSummaryData(): void {
        // Load services to calculate fees
        this._customerService.getCustomerServices(this.customerId).subscribe(services => {
            this.services = services;
            this.calculateTotalFees();
        });

        // Load jobs
        this._jobService.getJobsByCustomerId(this.customerId).subscribe(jobs => {
            this.jobs = jobs;
            this.activeJobsCount = jobs.filter(j => j.currentStage !== 5).length; // Assuming 5 is 'Completed'
        });
    }

    calculateTotalFees(): void {
        this.totalFees = this.services.reduce((acc, curr) => {
            let amount = curr.amount || 0;
            // Normalize to yearly for the summary
            switch (curr.unit) {
                case 'm': amount *= 12; break;
                case 'q': amount *= 4; break;
                case 'w': amount *= 52; break;
                case 'd': amount *= 365; break;
            }
            return acc + amount;
        }, 0);
    }
}
