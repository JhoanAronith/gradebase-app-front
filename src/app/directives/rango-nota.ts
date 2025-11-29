import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appRangoNota]',
  standalone: true
})
export class RangoNotaDirective {

   @HostListener('input', ['$event'])
  onInput(event: any) {
    let val = Number(event.target.value);

    if (val < 0) val = 0;
    if (val > 20) val = 20;

    event.target.value = val;
  }

}
