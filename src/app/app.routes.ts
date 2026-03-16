import { Routes } from '@angular/router';

import { CategoryCreateComponent }
    from './features/categories/components/category-create/category-create.component';
import { CategoryEditComponent }
    from './features/categories/components/category-edit/category-edit.component';
import { CategoryDeleteComponent }
    from './features/categories/components/category-delete/category-delete.component';

/****************************
 * NOTE:
 *    - loadComponent() Is the modern equivalent of lazy loading feature of the module.
 *    - pathMatch       Defines pattern matching for the route.
 *                      Has two values: 'full'    ensure that the complete path is matched, eg: '/categories'
 *                                      'prefix'  ensure that the path starts with, eg: '' == /<anything>   (DEFAULT)
 *                      ALWAYS place more specific routes before parameterized routes.
 ***********/


/**
 * Defines the Route Table
 */
export const routes: Routes = [
    {
        path: 'categories',
        pathMatch: 'prefix',              // match with '/categories', '/categories/edit/10', '/categories/create', etc.
        loadComponent: () =>
            import('./features/categories/components/category-list/category-list.component')
                .then(m => m.CategoryListComponent)
    },
    {
        path: 'categories/create',
        component: CategoryCreateComponent
    },
    {
        path: 'categories/edit/:id',
        component: CategoryEditComponent
    },
    {
        path: 'categories/delete/:id',
        component: CategoryDeleteComponent
    }
];
