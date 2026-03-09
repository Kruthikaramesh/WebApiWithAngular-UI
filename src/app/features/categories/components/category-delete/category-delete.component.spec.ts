import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CategoryDeleteComponent } from './category-delete.component';
import { CategoryService } from '../../services/category.service';
import { CategoryReadModel } from '../../models/category-read.model';


/**
 * Unit tests for CategoryDeleteComponent.
 *
 * These tests verify:
 *  - Component initialization
 *  - API interaction for loading category data
 *  - Correct payload sent during deletion
 *  - Proper handling of concurrency conflicts
 *  - Proper handling of general API errors
 *
 * The CategoryService is mocked to isolate the component from real HTTP calls and infrastructure dependencies.
 */
describe('CategoryDeleteComponent', () => {

    let component: CategoryDeleteComponent;
    let fixture: ComponentFixture<CategoryDeleteComponent>;


    /**
     * Mock version of CategoryService.
     */
    let categoryServiceMock: {
        getById: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };


    /**
     * Mock ActivatedRoute used to simulate route parameter.
     * The component expects an "id" route parameter.
     */
    const activatedRouteMock = {
        snapshot: {
            paramMap: {
                get: () => '1'
            }
        }
    };

    /**
     * Reusable mock category returned by the API.
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
     * Configure the Angular testing module before each test.
     */
    beforeEach(async () => {

        categoryServiceMock = {
            getById: vi.fn(),
            delete: vi.fn()
        };

        await TestBed.configureTestingModule({

            // Standalone component import
            imports: [CategoryDeleteComponent],

            providers: [

                // Router provider is required because the component
                // uses router navigation.
                provideRouter([]),

                // Replace the real service with the mock
                { provide: CategoryService, useValue: categoryServiceMock },

                // Provide mocked route parameters
                { provide: ActivatedRoute, useValue: activatedRouteMock }

            ]

        }).compileComponents();

        fixture = TestBed.createComponent(CategoryDeleteComponent);
        component = fixture.componentInstance;

    });


    /**
     * Test #1
     * Basic sanity check to confirm the component initializes correctly.
     */
    it('should create the component', () => {

        expect(component).toBeTruthy();

    });


    /**
     * Test #2
     * Verify that the component loads category data on initialization.
     *
     * ngOnInit() should call the CategoryService.getById() method
     * using the ID obtained from the route.
     */
    it('should load category data on initialization', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        // Trigger Angular lifecycle
        fixture.detectChanges();

        expect(categoryServiceMock.getById).toHaveBeenCalledWith(1);

        // Ensure the component received the category data
        expect(component.category?.name).toBe('Electronics');

    });


    /**
     * Test #3
     * Verify that confirmDelete() calls the delete API with
     * the correct payload.
     *
     * The payload must include both:
     *  - categoryId
     *  - rowVersion (for optimistic concurrency)
     */
    it('should call delete API with correct payload when confirmDelete is triggered', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        categoryServiceMock.delete.mockReturnValue(of(undefined));

        fixture.detectChanges();

        component.confirmDelete();

        expect(categoryServiceMock.delete).toHaveBeenCalledWith({
            categoryId: 1,
            rowVersion: 'abc'
        });

    });


    /**
     * Test #4
     * Verify that concurrency conflicts are handled correctly.
     *
     * The interceptor normalizes concurrency conflicts using:
     *   status: 412
     *   isConcurrencyError: true
     */
    it('should set concurrencyError when API returns concurrency conflict', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        categoryServiceMock.delete.mockReturnValue(
            throwError(() => ({
                status: 412,
                isConcurrencyError: true,
                detail: 'The record was modified by another user.'
            }))
        );

        fixture.detectChanges();

        component.confirmDelete();

        expect(component.concurrencyError)
            .toBe('The record was modified by another user.');

    });


    /**
     * Test #5
     * Verify that general API errors are handled correctly.
     *
     * Example scenario:
     * - Business rule prevents deletion
     * - API returns a standard error response
     */
    it('should set apiError when API returns general error', () => {

        categoryServiceMock.getById.mockReturnValue(of(mockCategory));

        categoryServiceMock.delete.mockReturnValue(
            throwError(() => ({
                status: 409,
                detail: 'Category cannot be deleted.'
            }))
        );

        fixture.detectChanges();

        component.confirmDelete();

        expect(component.apiError)
            .toBe('Category cannot be deleted.');

    });

});
