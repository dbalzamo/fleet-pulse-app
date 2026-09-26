import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appClickOutside]',
    standalone: true,
})
export class ClickOutsideDirective {
    @Output() readonly appClickOutside = new EventEmitter<void>();

    constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

    @HostListener('document:click', ['$event.target'])
    onDocumentClick(target: EventTarget | null): void {
        if (target && !this.elementRef.nativeElement.contains(target as Node)) {
            this.appClickOutside.emit();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        this.appClickOutside.emit();
    }
}