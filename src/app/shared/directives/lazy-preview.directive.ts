import {
    Directive, Input, Output, EventEmitter,
    ElementRef, OnInit, OnDestroy, NgZone
} from '@angular/core';

@Directive({
    selector: '[appLazyPreview]',
    standalone: false
})
export class LazyPreviewDirective implements OnInit, OnDestroy {
    @Input() appLazyPreview!: number;
    @Input() hasUrl = false;
    @Output() visible = new EventEmitter<number>();

    private observer!: IntersectionObserver;

    constructor(private el: ElementRef, private ngZone: NgZone) {}

    ngOnInit(): void {
        if (this.hasUrl) return;

        this.ngZone.runOutsideAngular(() => {
            this.observer = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];
                    if (entry.isIntersecting) {
                        this.ngZone.run(() => {
                            this.visible.emit(this.appLazyPreview);
                        });
                        this.observer.disconnect();
                    }
                },
                { rootMargin: '200px', threshold: 0 }
            );

            setTimeout(() => {
                if (this.el?.nativeElement) {
                    this.observer.observe(this.el.nativeElement);
                }
            }, 0);
        });
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }
}