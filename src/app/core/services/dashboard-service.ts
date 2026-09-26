import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/envirornment-local';
import { DashboardSummary, RecentNotification } from '../../shared/models/dashboard-model';

const MOCK_SUMMARY: DashboardSummary = {
    totalVehicles: 8,
    inServiceVehicles: 3,
    todayRevenue: 1284,
    activeAlerts: 2,
};

function minutesAgo(minutes: number): string {
    return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const MOCK_NOTIFICATIONS: RecentNotification[] = [
    {
        id: 'notif-1',
        type: 'emergency',
        message: 'Vehicle veh-010 reported an emergency stop near Via Dante.',
        timestamp: minutesAgo(35),
    },
    {
        id: 'notif-2',
        type: 'battery_low',
        message: 'Vehicle veh-006 battery dropped below 20%.',
        timestamp: hoursAgo(2),
    },
    {
        id: 'notif-3',
        type: 'maintenance_completed',
        message: 'Scheduled maintenance completed for veh-004.',
        timestamp: hoursAgo(5),
    },
    {
        id: 'notif-4',
        type: 'new_customer',
        message: 'New customer registered: Marta Rossi.',
        timestamp: hoursAgo(9),
    },
    {
        id: 'notif-5',
        type: 'battery_low',
        message: 'Vehicle veh-008 charging session interrupted at 31%.',
        timestamp: hoursAgo(12),
    },
];

@Service()
export class DashboardService {
    private readonly http = inject(HttpClient);
    readonly summaryUrl = `${environment.apiPath}${environment.apiUrlDashboard}/summary`;
    readonly notificationsUrl = `${environment.apiPath}${environment.apiUrlNotifications}`;

    getSummary(): Observable<DashboardSummary> {
        if (environment.useMock) {
            return of({ ...MOCK_SUMMARY }).pipe(delay(300));
        }
        return this.http.get<DashboardSummary>(this.summaryUrl);
    }

    getRecentNotifications(limit = 5): Observable<RecentNotification[]> {
        if (environment.useMock) {
            return of(MOCK_NOTIFICATIONS.slice(0, limit).map((n) => ({ ...n }))).pipe(delay(250));
        }
        const params = new HttpParams().set('limit', String(limit));
        return this.http.get<RecentNotification[]>(this.notificationsUrl, { params });
    }
}