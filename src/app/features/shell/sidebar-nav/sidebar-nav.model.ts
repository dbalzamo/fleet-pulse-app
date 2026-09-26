export interface SidebarNavItem {
    id: string;
    label: string;
    icon: string;
    route: string;
}

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', route: '/dashboard' },
    { id: 'fleet', label: 'Fleet', icon: 'directions_car', route: '/fleet' },
    { id: 'control-center', label: 'Control center', icon: 'radar', route: '/control-center' },
    { id: 'payments', label: 'Payments', icon: 'payments', route: '/payments' },
    { id: 'customers', label: 'Customers', icon: 'group', route: '/customers' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
];