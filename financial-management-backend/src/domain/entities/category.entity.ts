export enum CategoryType { INCOME = 'INCOME', EXPENSE = 'EXPENSE', TRANSFER = 'TRANSFER' }

export class Category {
  id: string;
  userId?: string;
  familyId?: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  subcategories?: Subcategory[];
  createdAt: Date;
  updatedAt: Date;

  isOwnedBy(userId: string): boolean {
    return !this.isSystem && this.userId === userId;
  }
}

export class Subcategory {
  id: string;
  categoryId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
