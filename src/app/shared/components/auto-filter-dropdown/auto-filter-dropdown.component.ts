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
  
  /**
   * these are the options that can be part of the filter: 
   * array of strings or array of objects with property name with type string are accepted
   */
  @Input() options: Optional<AutoFilterBackdrownObject[]> | Optional<string[]>;

  /**
   * AutoFilterDropdown component can be used inside a FormGroup as a FormControl
   * This behavior is allowed only when a FormGroup is passed as an input to the component
   */
  @Input("baseFormGroup") formGroup: Optional<FormGroup>;

  /**
   * If a regex is passed, the filter formControl will check the value of the string digited
   * with Validator.pattern method
   */
  @Input() filterRegex: Optional<RegExp>;

  /**
   * Custom not async validators can be passed as input and they will be evaluated thanks to FormControl Api
   */
  @Input() customValidators: Optional<ValidatorFn[]>;

  /**
   * Custom async validators can be passed as input and they will be evaluated thanks to FormControl Api
   */
  @Input() asyncValidators?: Optional<AsyncValidatorFn[]>;

  /**
   * if this property is true, the filter must accept only values inside the array of options
   */
  @Input() AtLeastOneCorrectOptionDigited: boolean = false;

  /**
   * if it is true, the input must contains a value
   */
  @Input() required: boolean = false;

  /**
   * It can be passed a custom placeholder for the input
   */
  @Input() placeholder: string = "Digit..."

  /**
   * This property accepts a kind of function that takes as an argument a string
   * and returns an observable of string[] or AutoFilterBackdrownObject[] (object with property name):
   * this function will be called to allow an async filter. 
   * The user will digit an input and the filtered options change due to the digits inserted by the user.
   */
  @Input() loadOptions: Optional<(filterValue: string) => Observable<AutoFilterBackdrownObject[] | string[]>>;
  
  /**
   * it can be passed a custom string to define the name of the formControl that will be added
   * to the FormGroup passed via Input
   */
  @Input() controlName: string = "filterInput";

  /**
   * The result inside the input will be emitted to the component that uses the filter component
   */
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
  
  /**
   * this is the Observable<array> that contains all the filtered objects
   */
  filteredOptions$!: Observable<string[]>;

  filterInputControl : FormControl = new FormControl();

  /**
   * with ViewChild decorator it can be observed the properties of the HTML input:
   * in particular its positions and its width
   */
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  inputPosition = { top: 0, left: 0, width: 0 };

  protected _onDestroy: Subject<void> = new Subject<void>();

  constructor() {}

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

  
  // This function is used to highlight a matched substring within a given option name or AutoFilterBackdrownObject.
  // It takes an 'option' parameter, which can be either an AutoFilterBackdrownObject or a string representing the option.
  highlightMatch(option: AutoFilterBackdrownObject | string): string {
    // Retrieve the lowercase value of the filter input control 
    // because the filter is not case-sensitive so the check will be made between lowercase strings
    const filterValue = this.filterInputControl?.value.toLowerCase();
    
    // Get the option name as a string using the 'getValueForListElement' function.
    // this check if the option is a string or AutoFilterDropdownObject
    let optionName: string = this.getValueForListElement(option);
    
    // Find the index of the filterValue within the lowercase optionName.
    const index = optionName.toLowerCase().indexOf(filterValue);
    
    // If there is a match (index >= 0), then construct a string with the matched substring enclosed in <strong> tags.
    if (index >= 0) {
      const prefix = optionName.substring(0, index); // Characters before the matched substring.
      const match = optionName.substring(index, index + filterValue.length); // The matched substring.
      const suffix = optionName.substring(index + filterValue.length); // Characters after the matched substring.
      
      // Combine the prefix, matched substring (enclosed in <strong> tags), and the suffix to create the highlighted result.
      return `${prefix}<strong>${match}</strong>${suffix}`;
    }
    
    // If there is no match, return the original optionName without any highlighting.
    return optionName;
  }

  /**
   * setupFormControl adds all the validators (sync or async) passed via input,
   * sets the validator for the regex if it is present,
   * sets the validator to check if at least one option is chosen
   * adds the new form control to the form group and update the validity of it, if it is present
   */
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

  /**
   * If one option is chosen, this option is set to the filterInputControl
   * and the filteredOptions will be reset
   * @param option 
   */
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
    //it is necessary because if the filter is removed from the DOM 
    // and not from the form group,
    // then the form group could remain invalid because of some validatos that are not respected.
    this.formGroup?.removeControl(this.controlName);
    this.formGroup?.updateValueAndValidity();
  }


}
