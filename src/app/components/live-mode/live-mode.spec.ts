import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMode } from './live-mode';

describe('LiveMode', () => {
  let component: LiveMode;
  let fixture: ComponentFixture<LiveMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveMode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
