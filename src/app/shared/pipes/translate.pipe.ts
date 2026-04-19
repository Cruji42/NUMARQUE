import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string): Observable<string> {
    return this.translationService.translate(key);
  }
}

