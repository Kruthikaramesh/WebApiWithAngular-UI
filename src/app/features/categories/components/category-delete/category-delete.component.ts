import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { CategoryService } from '../../services/category.service';
import { CategoryReadModel } from '../../models/category-read.model';
import { CategoryDeleteModel } from '../../models/category-delete.model';

@Component({
    selector: 'app-category-delete',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './category-delete.component.html',
    styleUrl: './category-delete.component.css'
})
export class CategoryDeleteComponent implements OnInit {

    category: CategoryReadModel | null = null;

    apiError: string | null = null;
    concurrencyError: string | null = null;

    private categoryId!: number;

    constructor(
        private categoryService: CategoryService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {

        this.categoryId = Number(this.route.snapshot.paramMap.get('id'));

        this.loadCategory();
    }

    private loadCategory(): void {

        this.categoryService.getById(this.categoryId).subscribe({

            next: (category) => {
                this.category = category;
            },

            error: () => {
                this.apiError = 'Unable to load category.';
            }

        });

    }

    confirmDelete(): void {

        if (!this.category) return;

        const payload: CategoryDeleteModel = {
            categoryId: this.category.categoryId,
            rowVersion: this.category.rowVersion
        };

        this.categoryService.delete(payload).subscribe({

            next: () => {
                this.router.navigate(['/categories']);
            },

            error: (error) => {

                console.log('DELETE ERROR:', error);

                if (error.isConcurrencyError) {
                    this.concurrencyError = error.detail;
                    return;
                }

                this.apiError = error.detail;
            }

        });

    }

}
