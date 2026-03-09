import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CategoryEditComponent } from './category-edit.component';
import { CategoryService } from '../../services/category.service';
import { CategoryReadModel } from '../../models/category-read.model';


/**
 * Unit tests for CategoryEditComponent.
 *
 * These tests validate:
 *  - Component initialization
 *  - API call for loading category data
 *  - Form population from API response
 *  - Preventing submission when form is invalid
 *  - Calling update API on valid submission
 *  - Handling concurrency conflicts (412)
 *  - Handling business conflicts such as duplicate name (409)
 *
 * The CategoryService is mocked to isolate the component
 * from actual HTTP infrastructure.
 */
describe('CategoryEditComponent', () => {

    let component: CategoryEditComponent;
    let fixture: ComponentFixture<CategoryEditComponent>;

    /**
     * Mocked CategoryService.
     * Only the methods used by the component are implemented.
     */
    let categoryServiceMock: {
        getById: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
    };

    /**
     * Mock route parameter.
     * The component reads the category ID from ActivatedRoute.
     */
    const activatedRouteMock = {
        snapshot: {
            paramMap: {
                get: () => '1'
            }
        }
    };

    /**
     * Shared mock category used by multiple tests.
     */
    const mockCategory: CategoryReadModel = {
        categoryId: 1,
        name: 'Electronics',
        description: 'Devices',
        createdAtUtc: new Date().toISOString(),
        modifiedAtUtc: null,
        rowVersion: 'abc'
    };


    /**
     * Configure the Angular TestBed before each test.
     *
     * We import the standalone component and replace the real
     * CategoryService with a mocked implementation.
     */
    beforeEach(async () => {

        categoryServiceMock = {
            getById: vi.fn(),
            update: vi.fn()
        };

        await TestBed.configureTestingModule({

            // Standalone component under test
            imports: [CategoryEditComponent],

            providers: [

                // Router support (required for navigation)
                provideRouter([]),

                // Replace real service with mock
                { provide: CategoryService, useValue: categoryServiceMock },

                // Mock route parameters
                { provide: ActivatedRoute, useValue: activatedRouteMock }

            ]

        }).compileComponents();

        fixture = TestBed.createComponent(CategoryEditComponent);
        component = fixture.componentInstance;

    });


    /**
     * Test #1
     * Basic sanity check to confirm that the component initializes correctly.
     */
    it('should create the component', () => {

        expect(component).toBeTruthy();

    });


    /**
     * Test #2
     * Verify that the component loads category data when initialized.
     *
     * ngOnInit() should call the CategoryService.getById()
     * using the route parameter ID.
     */
    it('should load category data on initialization', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        // Trigger Angular lifecycle (ngOnInit)
        fixture.detectChanges();

        expect(categoryServiceMock.getById).toHaveBeenCalledWith(1);

    });


    /**
     * Test #3
     * Verify that the component prevents submission when the form is invalid.
     *
     * When the name field is empty, the update API should NOT be called.
     */
    it('should not call update API if form is invalid', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        fixture.detectChanges();

        // Make the form invalid
        component.categoryForm.controls.name.setValue('');

        component.onSubmit();

        expect(categoryServiceMock.update).not.toHaveBeenCalled();

    });


    /**
     * Test #4
     * Verify that form fields are populated after the category
     * data is loaded from the API.
     */
    it('should populate form after category loads', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        fixture.detectChanges();

        expect(component.categoryForm.controls.name.value)
            .toBe('Electronics');

    });


    /**
     * Test #5
     * Verify that submitting a valid form calls the update API.
     */
    it('should call update API when submitting form', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        categoryServiceMock.update.mockReturnValue(of(undefined));

        fixture.detectChanges();

        // Update form value
        component.categoryForm.controls.name.setValue('Updated Name');

        component.onSubmit();

        expect(categoryServiceMock.update).toHaveBeenCalled();

    });


    /**
     * Test #6
     * Verify that concurrency conflicts are handled correctly.
     *
     * The interceptor normalizes concurrency conflicts using:
     *   status: 412
     *   isConcurrencyError: true
     */
    it('should set concurrency error when API returns concurrency conflict', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        categoryServiceMock.update.mockReturnValue(
            throwError(() => ({
                status: 412,
                isConcurrencyError: true,
                detail: 'The record was modified by another user.'
            }))
        );

        fixture.detectChanges();

        component.categoryForm.controls.name.setValue('Updated Name');

        component.onSubmit();

        expect(component.concurrencyError)
            .toBe('The record was modified by another user.');

    });


    /**
     * Test #7
     * Verify that business rule conflicts are handled correctly.
     *
     * Example: Duplicate category name.
     */
    it('should set apiError when API returns duplicate name conflict', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        categoryServiceMock.update.mockReturnValue(
            throwError(() => ({
                status: 409,
                detail: 'Another category with name already exists.'
            }))
        );

        fixture.detectChanges();

        component.categoryForm.controls.name.setValue('Electronics');

        component.onSubmit();

        expect(component.apiError)
            .toBe('Another category with name already exists.');

    });

});
