import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Category, Subcategory } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
  selector: 'app-categories',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    ReactiveFormsModule,
    ButtonModule, DialogModule, InputTextModule,
    SkeletonModule, ConfirmDialogModule, AccordionModule, TagModule,
    ColorPickerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Categorias</h1>
        <p-button label="Nova Categoria" icon="pi pi-plus" (onClick)="openCatDialog()" />
      </div>

      @if (loading()) {
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          @for (i of [1,2,3,4]; track i) { <p-skeleton height="60px" borderRadius="0.5rem" /> }
        </div>
      } @else if (categories().length === 0) {
        <div class="py-16 text-center">
          <i class="pi pi-tag text-4xl text-[var(--text-color-secondary)] mb-3 block"></i>
          <p class="text-[var(--text-color-secondary)]">Nenhuma categoria cadastrada</p>
        </div>
      } @else {
        <p-accordion [multiple]="true">
          @for (cat of categories(); track cat.id) {
            <p-accordion-panel [value]="cat.id">
              <p-accordion-header>
                <div class="flex items-center justify-between w-full pr-4">
                  <div class="flex items-center gap-3">
                    <span
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      [style.background]="cat.color"
                    ></span>
                    <span class="font-medium text-[var(--text-color)]">{{ cat.name }}</span>
                    @if (cat.subcategories?.length) {
                      <p-tag [value]="cat.subcategories!.length + ' subcategorias'" severity="secondary" />
                    }
                  </div>
                  <div class="flex gap-1" (click)="$event.stopPropagation()">
                    <p-button icon="pi pi-plus" [text]="true" size="small" title="Adicionar subcategoria" (onClick)="openSubDialog(cat)" />
                    <p-button icon="pi pi-pencil" [text]="true" size="small" (onClick)="openCatDialog(cat)" />
                    <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" (onClick)="confirmDeleteCat(cat)" />
                  </div>
                </div>
              </p-accordion-header>
              <p-accordion-content>
                @if (!cat.subcategories?.length) {
                  <p class="text-sm text-[var(--text-color-secondary)] italic">Nenhuma subcategoria</p>
                } @else {
                  <div class="flex flex-wrap gap-2">
                    @for (sub of cat.subcategories!; track sub.id) {
                      <div class="flex items-center gap-1 bg-[var(--surface-hover)] rounded-full px-3 py-1">
                        <span class="text-sm text-[var(--text-color)]">{{ sub.name }}</span>
                        <button
                          (click)="confirmDeleteSub(cat, sub)"
                          class="ml-1 text-[var(--text-color-secondary)] hover:text-red-500 transition-colors"
                        ><i class="pi pi-times text-xs"></i></button>
                      </div>
                    }
                  </div>
                }
              </p-accordion-content>
            </p-accordion-panel>
          }
        </p-accordion>
      }
    </div>

    <!-- Category Dialog -->
    <p-dialog
      [(visible)]="catDialogVisible"
      [header]="editCatId() ? 'Editar Categoria' : 'Nova Categoria'"
      [modal]="true"
      [style]="{width: '380px'}"
    >
      <form [formGroup]="catForm" (ngSubmit)="saveCat()" class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Nome</label>
          <input pInputText formControlName="name" placeholder="Ex: Alimentação" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Cor</label>
          <div class="flex items-center gap-3">
            <p-colorpicker formControlName="color" />
            <span class="text-sm text-[var(--text-color-secondary)]">{{ catForm.value.color }}</span>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancelar" [text]="true" (onClick)="catDialogVisible = false" />
          <p-button type="submit" label="Salvar" [loading]="saving()" [disabled]="catForm.invalid" />
        </div>
      </form>
    </p-dialog>

    <!-- Subcategory Dialog -->
    <p-dialog
      [(visible)]="subDialogVisible"
      header="Nova Subcategoria"
      [modal]="true"
      [style]="{width: '360px'}"
    >
      <form [formGroup]="subForm" (ngSubmit)="saveSub()" class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-[var(--text-color)]">Nome</label>
          <input pInputText formControlName="name" placeholder="Ex: Restaurante" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancelar" [text]="true" (onClick)="subDialogVisible = false" />
          <p-button type="submit" label="Adicionar" [loading]="saving()" [disabled]="subForm.invalid" />
        </div>
      </form>
    </p-dialog>

    <p-confirmDialog />
  `,
})
export class CategoriesComponent implements OnInit {
  private finance = inject(FinanceService);
  private fb      = inject(FormBuilder);
  private confirm = inject(ConfirmationService);

  loading         = signal(true);
  saving          = signal(false);
  categories      = signal<Category[]>([]);
  editCatId       = signal<string | null>(null);
  activeCatId     = signal<string | null>(null);
  catDialogVisible = false;
  subDialogVisible = false;

  catForm = this.fb.group({
    name:  ['', Validators.required],
    color: ['#635BFF'],
  });
  subForm = this.fb.group({ name: ['', Validators.required] });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.finance.getCategories().subscribe({
      next: c => { this.categories.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCatDialog(cat?: Category) {
    this.editCatId.set(cat?.id ?? null);
    this.catForm.patchValue({ name: cat?.name ?? '', color: cat?.color ?? '#635BFF' });
    this.catDialogVisible = true;
  }

  openSubDialog(cat: Category) {
    this.activeCatId.set(cat.id);
    this.subForm.reset();
    this.subDialogVisible = true;
  }

  saveCat() {
    if (this.catForm.invalid) return;
    this.saving.set(true);
    const v = this.catForm.value as Partial<Category>;
    const op = this.editCatId()
      ? this.finance.updateCategory(this.editCatId()!, v)
      : this.finance.createCategory(v);
    op.subscribe({
      next: () => { this.catDialogVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  saveSub() {
    if (this.subForm.invalid || !this.activeCatId()) return;
    this.saving.set(true);
    this.finance.createSubcategory(this.activeCatId()!, { name: this.subForm.value.name! }).subscribe({
      next: () => { this.subDialogVisible = false; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDeleteCat(cat: Category) {
    this.confirm.confirm({
      message: `Excluir categoria "${cat.name}"?`,
      header: 'Confirmar exclusão',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finance.deleteCategory(cat.id).subscribe(() => this.load()),
    });
  }

  confirmDeleteSub(cat: Category, sub: Subcategory) {
    this.confirm.confirm({
      message: `Excluir subcategoria "${sub.name}"?`,
      header: 'Confirmar',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.finance.deleteSubcategory(cat.id, sub.id).subscribe(() => this.load()),
    });
  }
}
