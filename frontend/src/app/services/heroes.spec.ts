import { TestBed } from '@angular/core/testing';
import { Heroes } from './heroes';

describe('Heroes', () => {
  let service: Heroes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Heroes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
