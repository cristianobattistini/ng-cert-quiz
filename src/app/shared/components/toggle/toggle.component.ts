import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.css']
})
export class ToggleComponent {
  toggleValue = false;
  formControl: FormControl = new FormControl();

  @Input() text : string = "Enable";
  @Input() initialValue: boolean = false;
  @Output() toggleChange = new EventEmitter<boolean>();

  constructor() {

  }

  ngOnInit(){
    this.toggleValue = this.initialValue;
    this.formControl.setValue(this.initialValue);
    this.formControl.valueChanges.subscribe((value) => {
      this.toggleValue = value;
    });
  }

  toggle() {
    this.toggleValue = !this.toggleValue;
    this.toggleChange.emit(this.toggleValue);
  }  


}