export function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
    return toIsoDate(new Date());
}

export function isIsoDateInThePast(isoDate: string): boolean {
    return isoDate < todayIsoDate();
}

export function formatIsoDate(isoDate: string): string {
    if (!isoDate) {
        return '—';
    }
    const date = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return isoDate;
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatKm(km: number): string {
    return km.toLocaleString('en-US');
}