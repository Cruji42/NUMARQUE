import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap, of } from 'rxjs';
import { environment } from 'src/environments/environment';

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLangSubject = new BehaviorSubject<string>('es');
  public currentLang$ = this.currentLangSubject.asObservable();
  
  private translationsSubject = new BehaviorSubject<TranslationObject>({});
  public translations$ = this.translationsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load initial language from localStorage or default to 'es'
    const savedLang = localStorage.getItem('lang') || 'es';
    this.currentLangSubject.next(savedLang);
    this.loadTranslations(savedLang);
  }

  get currentLang(): string {
    return this.currentLangSubject.value;
  }

  get translations(): TranslationObject {
    return this.translationsSubject.value;
  }

  switchLanguage(lang: 'en' | 'es'): void {
    if (lang !== this.currentLang) {
      localStorage.setItem('lang', lang);
      this.currentLangSubject.next(lang);
      this.loadTranslations(lang);
    }
  }

  private loadTranslations(lang: string): void {
    const filePath = `assets/i18n/${lang}.json`;
    this.http.get<TranslationObject>(filePath).pipe(
      tap(translations => {
        console.log(`Loaded translations for ${lang}:`, translations);
        this.translationsSubject.next(translations);
      })
    ).subscribe({
      error: (err) => {
        console.error(`Failed to load ${filePath}:`, err);
        this.translationsSubject.next({});
      }
    });
  }

  translate(key: string): Observable<string> {
    return this.translations$.pipe(
      switchMap(translations => {
        const value = this.getNestedValue(translations, key);
        return of(value || key); // Fallback to key if not found
      })
    );
  }

  // Support nested keys like 'WELCOME.HERO.TITLE'
  private getNestedValue(obj: TranslationObject, path: string): string {
    return path.split('.').reduce((current, key) => 
      current && typeof current === 'object' ? (current as any)[key] : undefined, 
      obj as any
    ) as string || '';
  }

  getTranslatedArray(key: string): Observable<any[]> {
    return this.translations$.pipe(
      switchMap(translations => {
        const array = this.getNestedValue(translations, key);
        return of(Array.isArray(array) ? array : []);
      })
    );
  }
}

