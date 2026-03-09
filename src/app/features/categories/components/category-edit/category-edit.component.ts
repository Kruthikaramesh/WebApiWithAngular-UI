import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { CategoryEditForm } from './category-edit.form';
import { CategoryService } from '../../services/category.service';
import { CategoryUpdateModel } from '../../models/category-update.model';
import { CategoryReadModel } from '../../models/category-read.model';
import { ValidationProblemDetails } from '../../../../core/models/problem-details.model';


/**
 * Component responsible for editing an existing Category.
 */
@Component({
    selector: 'app-category-edit',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink
    ],
    templateUrl: './category-edit.component.html',
    styleUrl: './category-edit.component.css'
})
export class CategoryEditComponent implements OnInit {

    /** Typed Reactive Form */
    categoryForm: FormGroup<CategoryEditForm>;

    /** Server-side validation errors. */
    validationErrors: Record<string, string[]> = {};

    /** General API error. */
    apiError: string | null = null;

    concurrencyError: string | null = null;

    private categoryId!: number;

    private rowVersion!: string;


    constructor(
        private fb: FormBuilder,
        private categoryService: CategoryService,
        private router: Router,
        private route: ActivatedRoute
    ) {

        // attach the validators to the form controls.
        this.categoryForm = this.fb.group({

            name: this.fb.nonNullable.control('', {
                validators: [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(100)
                ]
            }),

            description: this.fb.control<string | null>(null, {
                validators: [
                    Validators.maxLength(4000)
                ]
            })

        });

    }


    /********************
     * NOTE:
     *      Constructor:
     *          - Used for dependency injection and initializing class members.
     *          - Putting API calls in the constructor can lead to issues,
     *            such as trying to access uninitialized properties or services.
     *      ngOnInit:
     *          - Is an Angular lifecycle hook called after the component is initialized, on the document.onready event.
     *          - Used for initialization logic, API calls, and accessing input data.
     *          - We cannot put the API call in the constructor, because the component may not be fully initialized,
     *            and input data (like route parameters) may not be available yet.
     *      window.onload event occurs after the entire page, including all components, has loaded.
     * *****************/

    /** Angular lifecycle event handler */
    ngOnInit(): void {

        // Get the Category ID from the route parameters.
        this.categoryId = Number(this.route.snapshot.paramMap.get('id'));

        // Load the Category details from the API and populate the form.
        this.loadCategory();

    }


    /** Loads the Category details from the API and populates the form. */
    private loadCategory(): void {

        // call the API to get the Category details, using the CategoryService.
        this.categoryService.getById(this.categoryId).subscribe({

            // if successful, populate the form with the Category details.
            next: (category: CategoryReadModel) => {

                // Store the RowVersion for concurrency control checks during update.
                this.rowVersion = category.rowVersion;

                // Populate the form with the Category details received from the API.
                this.categoryForm.patchValue({
                    name: category.name,
                    description: category.description
                });

            },

            // if an error occurs, display a user-friendly error message.
            error: () => {
                this.apiError = 'Unable to load category from the API.';
            }

        });

    }


    /**
     * Submit Handler for the form.
     */
    onSubmit(): void {

        this.validationErrors = {};
        this.apiError = null;
        this.concurrencyError = null;

        // If the form is invalid...
        if (this.categoryForm.invalid) {

            // ... mark all controls as touched to trigger validation messages in the UI,
            this.categoryForm.markAllAsTouched();

            // ... do not proceed to the API call.
            return;
        }

        // Map the form values to the API model, including the Category ID and RowVersion for concurrency control.
        const model: CategoryUpdateModel = {
            categoryId: this.categoryId,
            name: this.categoryForm.controls.name.value,
            description: this.categoryForm.controls.description.value,
            rowVersion: this.rowVersion
        };

        // Call the API to update the Category, using the CategoryService.
        this.categoryService.update(model).subscribe({

            next: () => {
                this.router.navigate(['/categories']);
            },

            error: (error) => {

                console.log('ERROR RECEIVED IN COMPONENT:', error);

                if (error.validationErrors) {
                    this.validationErrors = error.validationErrors;
                    return;
                }

                if (error.isConcurrencyError) {
                    this.concurrencyError = error.detail;
                    return;
                }

                this.apiError = error.detail;
            }

        });

    }

}
