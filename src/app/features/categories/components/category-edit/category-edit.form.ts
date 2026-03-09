import { FormControl } from '@angular/forms';


/**
 * This provides the Typed Reactive Form definition for editing the Category.
 * It is used by the Category-Edit component.
 * It gives compile-time type-safety for the form elements.
 * 
 * NOTE: RowVersion is not part of the form, because the user will not be editing it.
 */
export interface CategoryEditForm {

    /** Category Name */
    name: FormControl<string>;

    /** Category Description (optional) */
    description: FormControl<string | null>;

}
