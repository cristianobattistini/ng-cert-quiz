import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, map, of, switchMap, takeUntil } from 'rxjs';
import { Optional } from 'src/app/data.models';

export interface AutoFilterBackdrownObject{
  name: string;
}

@Component({
  selector: 'app-auto-filter-dropdown',
  templateUrl: './auto-filter-dropdown.component.html',
  styleUrls: ['./auto-filter-dropdown.component.css']
})
export class AutoFilterDropdownComponent {
  
  @Input() options: Optional<AutoFilterBackdrownObject[]> | Optional<string[]>;
  @Input("baseFormGroup") formGroup: Optional<FormGroup>;
  @Input() filterRegex: Optional<RegExp>;
  @Input() customValidators: Optional<ValidatorFn[]>;
  @Input() asyncValidators?: Optional<AsyncValidatorFn[]>;
  @Input() AtLeastOneCorrectOptionDigited: boolean = false;
  @Input() required: boolean = false;
  @Input() placeholder: string = "Digit..."
  @Input() loadOptions: Optional<(filterValue: string) => Observable<AutoFilterBackdrownObject[] | string[]>>;
  @Input() controlName: string = "filterInput";
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
  
  filteredOptions: Optional<AutoFilterBackdrownObject[]> | Optional<string[]>;
  filteredOptions$!: Observable<string[]>;

  filterInputControl : FormControl = new FormControl();

  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  inputPosition = { top: 0, left: 0, width: 0 };

  protected _onDestroy: Subject<void> = new Subject<void>();

  mapToStringArray$ = map((options: string[] | AutoFilterBackdrownObject[]) => {
    if (typeof options[0] === 'string') {
      const optionsList = options as string[];
      return optionsList;
    } else {
      return options.map((option) => {
        const opt = option as AutoFilterBackdrownObject;
        return opt.name;
      });
    }
  })


  constructor() {}

  
  filterCategories() {
    const filterValue = this.filterInputControl?.value?.toLowerCase();

    if (this.loadOptions) {
      this.filteredOptions$ = this.loadOptions(filterValue)
        .pipe(
          takeUntil(this._onDestroy),
          debounceTime(300), // Optional debounce time to limit API requests
          distinctUntilChanged(), // Optional distinct until the filter value changes
          switchMap((options: AutoFilterBackdrownObject[] | string[]) =>{
            this.options = options;
            return this.applyFilters(filterValue)
          }),
          map((options) => {
            if (typeof options[0] === 'string') {
              const optionsList = options as string[];
              return optionsList;
            } else {
              return options.map((option) => {
                const opt = option as AutoFilterBackdrownObject;
                return opt.name;
              });
            }
          })
        )
    } else {
      // Fallback to local filtering if no loadOptions function is provided
      this.filteredOptions$ = this.applyFilters(filterValue).pipe(
        map((options) => {
          if (typeof options[0] === 'string') {
            const optionsList = options as string[];
            return optionsList;          
          } else {
            return options.map((option) => {
              const opt = option as AutoFilterBackdrownObject;
              return opt.name;
            });
          }
        })
      )
    }
  }
  

  applyFilters(value: string) : Observable<AutoFilterBackdrownObject[] | string[]> {
    const filterValue = value?.toLowerCase();
    let filtered: AutoFilterBackdrownObject[] | string[];

    if (this.options && this.options.length > 0) {
      if (typeof this.options[0] === 'string') {
        // Array of strings
        const options = this.options as string[];
        filtered = options.filter((option: string) =>
        option.toLowerCase().includes(filterValue)
        );
      } else {
        const options = this.options as AutoFilterBackdrownObject[];
        // Array of objects with 'name' property
        filtered = options.filter((option: AutoFilterBackdrownObject) =>
          option.name.toLowerCase().includes(filterValue)
        );
      }
    } else {
      filtered = [];
    }
    return of(filtered);
  }

  
  highlightMatch(option: AutoFilterBackdrownObject | string): string {
    const filterValue = this.filterInputControl?.value.toLowerCase();
    let optionName: string =  this.getValueForListElement(option)

    const index = optionName.toLowerCase().indexOf(filterValue);

    if (index >= 0) {
      const prefix = optionName.substring(0, index);
      const match = optionName.substring(index, index + filterValue.length);
      const suffix = optionName.substring(index + filterValue.length);
      return `${prefix}<strong>${match}</strong>${suffix}`;
    }

    return optionName;
  }

  ngOnInit() {
    this.setupFormControl();

    this.filterInputControl.valueChanges.pipe(
      takeUntil(this._onDestroy)
    ).subscribe((value: string) => {
      this.filterCategories();
      this.valueChange.emit(value);
    });
  }



  ngAfterViewInit() {
    const inputRect = this.inputElement.nativeElement.getBoundingClientRect();
    this.inputPosition = {
      top: inputRect.top + inputRect.height,
      left: inputRect.left,
      width: inputRect.width
    };
  }

  setupFormControl(){
    if(this.filterRegex){
      this.filterInputControl.addValidators(Validators.pattern(this.filterRegex));
    }
    if(this.customValidators){
      this.filterInputControl.addValidators(this.customValidators);
    }
    if(this.asyncValidators){
      this.filterInputControl.addAsyncValidators(this.asyncValidators);
    }
    if(this.AtLeastOneCorrectOptionDigited){
      this.filterInputControl.addValidators(this.inCategoriesValidator())
    }
    if(this.required){
      this.filterInputControl.addValidators(Validators.required)
    }
    this.formGroup?.addControl(this.controlName, this.filterInputControl);
    this.formGroup?.updateValueAndValidity();
  }

  inCategoriesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const inputValue = control.value;
      if(this.options && this.options instanceof Array){
        let atLeastOneOption = false;
        this.options.forEach((opt: string | AutoFilterBackdrownObject) => {
          if(typeof opt === 'string' && opt === inputValue){
            atLeastOneOption = true;
          }else{
            const option = opt as AutoFilterBackdrownObject;
            if(option.name === inputValue){
              atLeastOneOption = true;
            }
          }
        })
        if(atLeastOneOption){
          return null;
        }
      }
        return { inCategories: true }; // The input is not present in options, error
      };
  }

  selectOption(option: string) {
    this.filterInputControl.setValue(option);
    this.filteredOptions$ = of([]);
  }

  getValueForListElement(item: AutoFilterBackdrownObject | string){
    if (typeof item === 'string') {
      return item;
    } else {
      return item.name;
    }
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
    this.formGroup?.removeControl(this.controlName);
    this.formGroup?.updateValueAndValidity();
  }


}
