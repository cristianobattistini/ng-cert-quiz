import { Component, Input } from '@angular/core';
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
  @Input() formGroup: Optional<FormGroup>;
  @Input() filterRegex: Optional<RegExp>;
  @Input() customValidators: Optional<ValidatorFn[]>;
  @Input() asyncValidators?: Optional<AsyncValidatorFn[]>;
  @Input() AtLeastOneCorrectOptionDigited: boolean = false;
  @Input() loadOptions: Optional<(filterValue: string) => Observable<AutoFilterBackdrownObject[] | string[]>>;


  filteredOptions: Optional<AutoFilterBackdrownObject[]> | Optional<string[]>;
  filteredOptions$!: Observable<string[]>;

  filterInputControl : FormControl = new FormControl();

  protected _onDestroy: Subject<void> = new Subject<void>();


  constructor() {}

  
  filterCategories() {
    const filterValue = this.filterInputControl.value.toLowerCase();

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
        /*.subscribe((filtered) => {
          this.filteredOptions = filtered;
        });*/
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
      /*.subscribe((filtered) => {
        this.filteredOptions = filtered;
      });*/
    }
  }
  

  applyFilters(value: string) : Observable<AutoFilterBackdrownObject[] | string[]> {
    const filterValue = value.toLowerCase();
    let filtered: AutoFilterBackdrownObject[] | string[];

    if (this.options && this.options.length > 0) {
      if (typeof this.options[0] === 'string') {
        // Array of strings
        const options = this.options as string[];
        filtered = options.filter((category: string) =>
          category.toLowerCase().includes(filterValue)
        );
      } else {
        const options = this.options as AutoFilterBackdrownObject[];
        // Array of objects with 'name' property
        filtered = options.filter((category: AutoFilterBackdrownObject) =>
          category.name.toLowerCase().includes(filterValue)
        );
      }
    } else {
      filtered = [];
    }
    return of(filtered);
  }

  highlightMatch(category: AutoFilterBackdrownObject | string): string {
    const filterValue = this.formGroup?.get('filterInput')?.value.toLowerCase();
    let categoryName: string;

    if (typeof category === 'string') {
      categoryName = category;
    } else {
      categoryName = category.name;
    }

    const index = categoryName.toLowerCase().indexOf(filterValue);

    if (index >= 0) {
      const prefix = categoryName.substring(0, index);
      const match = categoryName.substring(index, index + filterValue.length);
      const suffix = categoryName.substring(index + filterValue.length);
      return `${prefix}<strong>${match}</strong>${suffix}`;
    }

    return categoryName;
  }

  ngOnInit() {
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
      //implement ad hoc validator that check that at least one correct option is chosen
      this.filterInputControl.addValidators(this.inCategoriesValidator)
    }
    this.formGroup?.addControl('filterInput', this.filterInputControl);

    this.filterInputControl.valueChanges.pipe(
      takeUntil(this._onDestroy)
    ).subscribe((value: string) => {
      this.filterCategories();
    });
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
  }

  trackByFn(index: number, item: AutoFilterBackdrownObject | string) {
    if (typeof item === 'string') {
      return item;
    } else {
      return item.name;
    }
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
  }


}
