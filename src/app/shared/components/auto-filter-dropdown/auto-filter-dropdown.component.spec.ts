import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoFilterDropdownComponent } from './auto-filter-dropdown.component';

describe('AutoFilterDropdownComponent', () => {
  let component: AutoFilterDropdownComponent;
  let fixture: ComponentFixture<AutoFilterDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AutoFilterDropdownComponent]
    });
    fixture = TestBed.createComponent(AutoFilterDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
