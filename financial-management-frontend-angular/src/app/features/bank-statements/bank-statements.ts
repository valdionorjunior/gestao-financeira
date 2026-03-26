import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import type { Account } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-bank-statements',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    ButtonModule, TableModule, SelectModule,
    FileUploadModule, TagModule, SkeletonModule, ConfirmDialogModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Extratos Bancários</h1>
      </div>

      <!-- Upload -->
      <div class="card">
        <h3 class="font-semibold text-[var(--text-color)] mb-4">Importar Extrato</h3>
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-1 min-w-48">
            <label class="text-sm text-[var(--text-color-secondary)]">Conta</label>
            <p-select
              [options]="accounts()"
              optionLabel="name"
              optionValue="id"
              [(ngModel)]="uploadAccountId"
              placeholder="Selecione a conta"
              styleClass="w-full"
            />
          </div>
          <p-fileupload
            #fileUpload
            mode="basic"
            accept=".csv,.ofx,.qif"
            [auto]="false"
            chooseLabel="Selecionar arquivo"
            [disabled]="!uploadAccountId"
            (onSelect)="onFileSelected($event)"
            styleClass="p-button-outlined"
          />
          @if (selectedFile()) {
            <p-button
              label="Importar"
              icon="pi pi-upload"
              [loading]="uploading()"
              [disabled]="!uploadAccountId"
              (onClick)="upload()"
            />
          }
        </div>
        @if (selectedFile()) {
          <p class="text-sm text-[var(--text-color-secondary)] mt-2">
            <i class="pi pi-file mr-1"></i>{{ selectedFile()!.name }}
          </p>
        }
      </div>

      <!-- Filter -->
      <div class="flex items-center gap-3">
        <label class="text-sm text-[var(--text-color-secondary)]">Filtrar por conta:</label>
        <p-select
          [options]="accounts()"
          optionLabel="name"
          optionValue="id"
          [(ngModel)]="filterAccountId"
          (ngModelChange)="applyFilter()"
          [showClear]="true"
          placeholder="Todas"
          styleClass="min-w-48"
        />
      </div>

      <!-- Table -->
      <div class="card" style="padding:0; overflow:hidden;">
        <p-table [value]="statements()" [loading]="loading()" responsiveLayout="scroll" styleClass="p-datatable-sm">
          <ng-template #header>
            <tr>
              <th>Arquivo</th>
              <th>Conta</th>
              <th>Data de importação</th>
              <th>Status</th>
              <th>Transações</th>
              <th class="w-24"></th>
            </tr>
          </ng-template>
          <ng-template #body let-s>
            <tr>
              <td class="text-sm">{{ s.fileName ?? s.originalName ?? '—' }}</td>
              <td class="text-sm text-[var(--text-color-secondary)]">{{ accName(s.accountId) }}</td>
              <td class="text-sm text-[var(--text-color-secondary)]">{{ s.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <p-tag
                  [value]="statusLabel(s.status)"
                  [severity]="s.status === 'PROCESSED' ? 'success' : s.status === 'PROCESSING' ? 'info' : s.status === 'ERROR' ? 'danger' : 'secondary'"
                />
              </td>
              <td class="text-sm">{{ s.transactionCount ?? '—' }}</td>
              <td></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="6" class="py-10 text-center text-[var(--text-color-secondary)]">
              <i class="pi pi-file-import text-3xl mb-2 block"></i>
              Nenhum extrato importado
            </td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class BankStatementsComponent implements OnInit {
  private finance = inject(FinanceService);

  loading         = signal(true);
  uploading       = signal(false);
  allStatements   = signal<any[]>([]);
  statements      = signal<any[]>([]);
  accounts        = signal<Account[]>([]);
  uploadAccountId = '';
  filterAccountId = '';
  selectedFile    = signal<File | null>(null);

  ngOnInit() {
    this.finance.getAccounts().subscribe(a => this.accounts.set(a));
    this.loadStatements();
  }

  loadStatements() {
    this.loading.set(true);
    this.finance.getStatements().subscribe({
      next: s => {
        this.allStatements.set(s ?? []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter() {
    const all = this.allStatements();
    this.statements.set(
      this.filterAccountId ? all.filter(s => s.accountId === this.filterAccountId) : all
    );
  }

  onFileSelected(event: any) {
    const file: File = event.currentFiles?.[0] ?? event.files?.[0];
    if (file) this.selectedFile.set(file);
  }

  upload() {
    const file = this.selectedFile();
    if (!file || !this.uploadAccountId) return;
    this.uploading.set(true);
    this.finance.uploadStatement(this.uploadAccountId, file).subscribe({
      next: () => { this.uploading.set(false); this.selectedFile.set(null); this.loadStatements(); },
      error: () => this.uploading.set(false),
    });
  }

  accName(id: string) { return this.accounts().find(a => a.id === id)?.name ?? '—'; }

  statusLabel(s: string) {
    const map: Record<string, string> = {
      PENDING: 'Pendente', PROCESSING: 'Processando', PROCESSED: 'Processado', ERROR: 'Erro',
    };
    return map[s] ?? s;
  }
}
