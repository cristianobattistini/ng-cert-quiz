import { Component, Input } from '@angular/core';
import { AsyncValidatorFn, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
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
  
  @Input() categories: Optional<AutoFilterBackdrownObject[]> | Optional<string[]>;
  @Input() formGroup: Optional<FormGroup>;
  @Input() filterRegex: Optional<RegExp>;
  @Input() customValidators: Optional<ValidatorFn[]>;
  @Input() asyncValidators?: Optional<AsyncValidatorFn[]>;
  @Input() AtLeastOneCorrectOptionDigited: boolean = false;
  @Input() loadOptions: Optional<(filterValue: string) => Observable<AutoFilterBackdrownObject[] | string[]>>;


  filteredCategories:Optional<AutoFilterBackdrownObject[]> | Optional<string[]>;

  filterInputControl : FormControl = new FormControl();

  constructor() {}

  /*
  filterCategories() {
    const filterValue = this.formGroup.get('filterInput').value.toLowerCase();

    if (this.loadOptions) {
      this.loadOptions(filterValue)
        .pipe(
          debounceTime(300), // Optional debounce time to limit API requests
          distinctUntilChanged(), // Optional distinct until the filter value changes
          switchMap((categories: AutoFilterBackdrownObject[] | string[]) =>
            this.applyFilters(categories, filterValue)
          )
        )
        .subscribe((filtered) => {
          this.filteredCategories = filtered;
        });
    } else {
      // Fallback to local filtering if no loadOptions function is provided
      const categories = this.formGroup.get('categories').value;
      this.applyFilters(categories, filterValue).subscribe((filtered) => {
        this.filteredCategories = filtered;
      });
    }
  }
  */

  filterCategories(value: string) {
    const filterValue = value.toLowerCase();
    let filtered: AutoFilterBackdrownObject[] | string[];

    if (this.categories && this.categories.length > 0) {
      if (typeof this.categories[0] === 'string') {
        // Array of strings
        const categories = this.categories as string[];
        filtered = categories.filter((category: string) =>
          category.toLowerCase().includes(filterValue)
        );
      } else {
        const categories = this.categories as AutoFilterBackdrownObject[];
        // Array of objects with 'name' property
        filtered = categories.filter((category: AutoFilterBackdrownObject) =>
          category.name.toLowerCase().includes(filterValue)
        );
      }
    } else {
      filtered = [];
    }

    this.filteredCategories = filtered;
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
    }
    this.formGroup?.addControl('filterInput', this.filterInputControl);

    this.filterInputControl.valueChanges.pipe(

    ).subscribe((value: string) => {
      this.filterCategories(value);
    });
  }
}
