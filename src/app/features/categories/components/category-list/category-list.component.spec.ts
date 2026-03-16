import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

// Angular Router providers required for RouterLink usage in the template
import { provideRouter } from '@angular/router';

import { CategoryListComponent } from './category-list.component';
import { CategoryService } from '../../services/category.service';
import { CategoryReadModel } from '../../models/category-read.model';


/**
 * Unit tests for CategoryListComponent.
 *
 * These tests verify:
 *  - Component initialization
 *  - Loading category data from the API
 *  - Rendering category data in the UI
 *  - Handling API errors gracefully
 *
 * The CategoryService is mocked so that tests run without
 * performing real HTTP requests.
 */
describe('CategoryListComponent', () => {

    let component: CategoryListComponent;
    let fixture: ComponentFixture<CategoryListComponent>;

    /**
     * Mock implementation of CategoryService.
     * Only the methods used by the component are mocked.
     */
    let categoryServiceMock: {
        getAll: ReturnType<typeof vi.fn>;
    };


    /**
     * Configure Angular TestBed before each test.
     *
     * - Import the standalone component
     * - Replace the real CategoryService with a mock
     * - Provide router dependencies required by RouterLink in the template
     */
    beforeEach(async () => {

        categoryServiceMock = {
            getAll: vi.fn()
        };

        await TestBed.configureTestingModule({

            // Standalone component under test
            imports: [CategoryListComponent],

            providers: [

                // Required because the template uses routerLink
                provideRouter([]),

                // Replace real service with mocked implementation
                {
                    provide: CategoryService,
                    useValue: categoryServiceMock
                }

            ]

        }).compileComponents();

        fixture = TestBed.createComponent(CategoryListComponent);
        component = fixture.componentInstance;

    });


    /**
     * Test #1
     * Basic sanity check to ensure the component initializes correctly.
     */
    it('should create the component', () => {

        expect(component).toBeTruthy();

    });


    /**
     * Test #2
     * Verify that categories are loaded when the component initializes.
     *
     * The component should call CategoryService.getAll()
     * during the ngOnInit lifecycle hook.
     */
    it('should load categories on init', () => {

        const mockCategories: CategoryReadModel[] = [
            {
                categoryId: 1,
                name: 'Electronics',
                description: 'Devices',
                createdAtUtc: new Date().toISOString(),
                modifiedAtUtc: null,
                rowVersion: 'abc'
            }
        ];

        // Simulate successful API response
        categoryServiceMock.getAll.mockReturnValue(of(mockCategories));

        // Trigger Angular lifecycle (ngOnInit)
        fixture.detectChanges();

        // Verify categories were loaded
        expect(component.categories.length).toBe(1);

        // Verify service method was called
        expect(categoryServiceMock.getAll).toHaveBeenCalled();

    });


    /**
     * Test #3
     * Verify that category data is rendered correctly in the table.
     *
     * This test checks the actual DOM output produced by Angular.
     */
    it('should display categories in table', () => {

        const mockCategories: CategoryReadModel[] = [
            {
                categoryId: 1,
                name: 'Electronics',
                description: 'Devices',
                createdAtUtc: new Date().toISOString(),
                modifiedAtUtc: null,
                rowVersion: 'abc'
            }
        ];

        categoryServiceMock.getAll.mockReturnValue(of(mockCategories));

        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;

        // Ensure category name appears somewhere in the rendered HTML
        expect(compiled.textContent).toContain('Electronics');

        // Locate table rows in the table body
        const rows = compiled.querySelectorAll('tbody tr');

        // Verify exactly one row exists
        expect(rows.length).toBe(1);

        // Verify row contains the category name
        expect(rows[0].textContent).toContain('Electronics');

    });



    /**
     * Test #4
     * Verify that a message to indicate that no categories exist.
     */
    it('should show message when no categories exist', () => {

        categoryServiceMock.getAll.mockReturnValue(of([]));

        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;

        expect(compiled.textContent?.toLowerCase())
            .toContain('no categories');

    });


    /**
     * Test #5
     * Verify that API errors are displayed to the user.
     *
     * This simulates a backend failure and checks that
     * the error message is rendered in the UI.
     */
    it('should display error message when API fails', () => {

        // Simulate API failure
        categoryServiceMock.getAll.mockReturnValue(
            throwError(() => ({ detail: 'API error occurred' }))
        );

        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;

        // Verify error message is displayed in UI
        expect(compiled.textContent).toContain('API error occurred');

    });

});
