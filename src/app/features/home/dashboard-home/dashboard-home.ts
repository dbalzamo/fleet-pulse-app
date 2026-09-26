import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DashboardService } from '../../../core/services/dashboard-service';
import { FleetTrackingService } from '../../../core/services/fleet-tracking-service';
import { DashboardSummary, NOTIFICATION_COLORS, NOTIFICATION_LABELS, RecentNotification } from '../../../shared/models/dashboard-model';
import { FleetMapComponent } from '../../control-center/fleet-map/fleet-map';

@Component({
    selector: 'app-dashboard-home',
    imports: [MatIconModule, RouterLink, FleetMapComponent],
    templateUrl: './dashboard-home.html',
    styleUrl: './dashboard-home.scss',
})
export class DashboardHomeComponent implements OnInit {
    private readonly dashboardService = inject(DashboardService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly tracking = inject(FleetTrackingService);

    protected readonly summary = signal<DashboardSummary | null>(null);
    protected readonly notifications = signal<RecentNotification[]>([]);

    protected readonly totalVehicles = computed(() => this.summary()?.totalVehicles ?? 0);
    protected readonly inServiceVehicles = computed(() => this.summary()?.inServiceVehicles ?? 0);
    protected readonly todayRevenue = computed(() => this.summary()?.todayRevenue ?? 0);
    protected readonly activeAlerts = computed(() => this.summary()?.activeAlerts ?? 0);
    protected readonly hasAlerts = computed(() => this.activeAlerts() > 0);
    protected readonly revenueLabel = computed(() => `€${this.todayRevenue().toLocaleString('en-US')}`);

    protected readonly notificationLabels = NOTIFICATION_LABELS;
    protected readonly notificationColors = NOTIFICATION_COLORS;

    ngOnInit(): void {
        // Start the tracking feed while this page (which embeds the map) is
        // alive and stop it on teardown to avoid background timers.
        this.tracking.start();
        this.destroyRef.onDestroy(() => this.tracking.stop());

        this.dashboardService
            .getSummary()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((summary) => this.summary.set(summary));

        this.dashboardService
            .getRecentNotifications(5)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((notifications) => this.notifications.set(notifications));
    }

    protected timeAgo(timestamp: string): string {
        const diffMs = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.max(1, Math.floor(diffMs / 60_000));
        if (minutes < 60) {
            return `${minutes} min ago`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} h ago`;
        }
        return `${Math.floor(hours / 24)} d ago`;
    }
}