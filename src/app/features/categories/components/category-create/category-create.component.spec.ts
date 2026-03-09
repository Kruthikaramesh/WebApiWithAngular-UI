import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CategoryCreateComponent } from './category-create.component';
import { CategoryService } from '../../services/category.service';


/**
 * Unit tests for CategoryCreateComponent.
 *
 * These tests verify:
 *  - Component initialization
 *  - Reactive form validation
 *  - API interaction when submitting the form
 *  - Navigation after successful creation
 *  - Handling of validation errors returned by the API
 *
 * The CategoryService is mocked so that the component
 * can be tested in isolation without performing real HTTP requests.
 */
describe('CategoryCreateComponent', () => {

    let component: CategoryCreateComponent;
    let fixture: ComponentFixture<CategoryCreateComponent>;

    /**
     * Angular Router instance used to verify navigation behavior.
     */
    let router: Router;

    /**
     * Mock implementation of CategoryService.
     *
     * Only the methods used by this component are mocked.
     */
    let categoryServiceMock: {
        create: ReturnType<typeof vi.fn>;
    };


    /**
     * Configure Angular TestBed before each test.
     *
     * - Import the standalone component
     * - Replace CategoryService with a mocked implementation
     * - Provide a Router instance for navigation testing
     */
    beforeEach(async () => {

        categoryServiceMock = {
            create: vi.fn()
        };

        await TestBed.configureTestingModule({

            // Standalone component under test
            imports: [CategoryCreateComponent],

            providers: [

                // Router is required because the component performs navigation
                provideRouter([]),

                // Replace real service with mock implementation
                {
                    provide: CategoryService,
                    useValue: categoryServiceMock
                }

            ]

        }).compileComponents();

        fixture = TestBed.createComponent(CategoryCreateComponent);
        component = fixture.componentInstance;

        // Retrieve Router instance from Angular dependency injection
        router = TestBed.inject(Router);

        // Trigger Angular lifecycle hooks
        fixture.detectChanges();
    });



    /**
     * Test #1
     * Basic sanity check that the component is created successfully.
     *
     * This verifies that Angular TestBed configuration is correct
     * and the component can be instantiated.
     */
    it('should create the component', () => {

        expect(component).toBeTruthy();

    });


    /**
     * Test #2
     * Verify that the category name is required.
     *
     * This confirms that the reactive form validation rules
     * are correctly applied to the name field.
     */
    it('should require category name', () => {

        component.categoryForm.controls.name.setValue('');

        expect(component.categoryForm.invalid).toBe(true);

    });


    /**
     * Test #3
     * Verify that the API is called and navigation occurs
     * after a successful category creation.
     *
     * This test checks:
     *  - Service method invocation
     *  - Router navigation behavior
     */
    it('should call API and navigate on successful submit', () => {

        // Spy on router navigation
        const navigateSpy = vi.spyOn(router, 'navigate');

        // Simulate successful API response
        categoryServiceMock.create.mockReturnValue(of(undefined));

        // Populate the form with valid values
        component.categoryForm.controls.name.setValue('Electronics');
        component.categoryForm.controls.description.setValue('Devices');

        // Trigger form submission
        component.onSubmit();

        // Verify service was called
        expect(categoryServiceMock.create).toHaveBeenCalled();

        // Verify navigation to category list page
        expect(navigateSpy).toHaveBeenCalledWith(['/categories']);

    });


    /**
     * Test #4
     * Verify that validation errors returned by the API
     * are correctly captured and exposed by the component.
     *
     * This simulates an API validation failure such as
     * attempting to create a category with a duplicate name.
     */
    it('should handle validation errors returned by API', () => {

        /**
         * Mock validation error response similar to
         * ASP.NET Core ValidationProblemDetails.
         */
        const validationError = {
            error: {
                errors: {
                    Name: ['Category name already exists']
                }
            }
        };

        // Simulate API returning validation error
        categoryServiceMock.create.mockReturnValue(
            throwError(() => validationError)
        );

        // Provide valid form input
        component.categoryForm.controls.name.setValue('Electronics');

        // Submit the form to trigger API call
        component.onSubmit();

        // Verify that the component captured the validation error
        expect(component.validationErrors['Name'][0])
            .toBe('Category name already exists');

    });

});
