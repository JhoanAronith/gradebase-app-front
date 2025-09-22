import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavBarGrades } from './nav-bar-grades';

describe('NavBarGrades', () => {
  let component: NavBarGrades;
  let fixture: ComponentFixture<NavBarGrades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBarGrades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavBarGrades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
