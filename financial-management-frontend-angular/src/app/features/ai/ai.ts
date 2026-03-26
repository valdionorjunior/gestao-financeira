import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Como está minha saúde financeira este mês?',
  'Onde posso economizar mais?',
  'Qual é minha maior despesa?',
  'Estou no caminho certo com minhas metas?',
];

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [NgClass, FormsModule, ButtonModule, InputTextModule, SkeletonModule],
  template: `
    <div class="page-container" style="display:flex; flex-direction:column; height:calc(100vh - var(--topbar-height) - 4rem); max-height:calc(100vh - var(--topbar-height) - 4rem);">

      <!-- Header -->
      <div style="margin-bottom:1.5rem; animation: slideDown var(--transition-base);">
        <h1 style="font-size:1.875rem; font-weight:700; background:var(--primary-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; letter-spacing:-0.5px;">Assistente IA</h1>
        <p style="font-size:0.875rem; color:var(--text-color-secondary); margin-top:0.25rem;">Pergunte sobre suas finanças e receba insights personalizados</p>
      </div>

      <!-- Chat area -->
      <div
        #chatBox
        class="card"
        style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; min-height:16rem; padding:1.25rem;"
      >
        @if (messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center gap-6 py-8">
            <div class="w-16 h-16 rounded-2xl bg-[var(--primary-color)]/10 flex items-center justify-center">
              <i class="pi pi-sparkles text-[var(--primary-color)] text-3xl"></i>
            </div>
            <div class="text-center">
              <p class="font-semibold text-[var(--text-color)]">Olá, {{ auth.user()?.firstName ?? 'usuário' }}!</p>
              <p class="text-sm text-[var(--text-color-secondary)] mt-1">Posso ajudar você a entender suas finanças. Experimente uma sugestão:</p>
            </div>
            <div class="flex flex-wrap gap-2 justify-center max-w-lg">
              @for (s of suggestions; track s) {
                <button
                  (click)="sendSuggestion(s)"
                  class="text-sm bg-[var(--surface-hover)] hover:bg-[var(--primary-color)]/10 hover:text-[var(--primary-color)] border border-[var(--surface-border)] rounded-full px-4 py-2 transition-colors text-[var(--text-color-secondary)]"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>
        } @else {
          @for (msg of messages(); track msg.timestamp) {
            <div class="flex" [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'">
              <div
                class="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                [ngClass]="{
                  'bg-[var(--primary-color)] text-white rounded-br-sm': msg.role === 'user',
                  'bg-[var(--surface-hover)] text-[var(--text-color)] rounded-bl-sm': msg.role === 'assistant'
                }"
              >
                @if (msg.role === 'assistant') {
                  <div class="flex items-center gap-1.5 mb-1 text-[var(--primary-color)]">
                    <i class="pi pi-sparkles text-xs"></i>
                    <span class="text-xs font-medium">FinanceAI</span>
                  </div>
                }
                {{ msg.content }}
              </div>
            </div>
          }
          @if (thinking()) {
            <div class="flex justify-start">
              <div class="bg-[var(--surface-hover)] rounded-2xl rounded-bl-sm px-4 py-3">
                <div class="flex gap-1.5 items-center">
                  <span class="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style="animation-delay:0ms"></span>
                  <span class="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style="animation-delay:150ms"></span>
                  <span class="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style="animation-delay:300ms"></span>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Input -->
      <div class="mt-3 flex gap-2">
        <input
          pInputText
          [(ngModel)]="userInput"
          (keyup.enter)="send()"
          placeholder="Digite sua pergunta..."
          [disabled]="thinking()"
          class="flex-1"
        />
        <p-button
          icon="pi pi-send"
          [loading]="thinking()"
          [disabled]="!userInput.trim()"
          (onClick)="send()"
        />
        @if (messages().length > 0) {
          <p-button
            icon="pi pi-trash"
            [text]="true"
            severity="secondary"
            title="Limpar conversa"
            (onClick)="clearChat()"
          />
        }
      </div>
    </div>
  `,
})
export class AiComponent {
  auth    = inject(AuthService);
  private finance = inject(FinanceService);

  @ViewChild('chatBox') chatBox!: ElementRef<HTMLDivElement>;

  messages  = signal<ChatMessage[]>([]);
  thinking  = signal(false);
  userInput = '';
  suggestions = SUGGESTIONS;

  send() {
    const text = this.userInput.trim();
    if (!text || this.thinking()) return;

    this.messages.update(m => [...m, { role: 'user', content: text, timestamp: new Date() }]);
    this.userInput = '';
    this.thinking.set(true);
    this.scrollToBottom();

    this.finance.askAi(text).subscribe({
      next: r => {
        this.messages.update(m => [...m, { role: 'assistant', content: r.response, timestamp: new Date() }]);
        this.thinking.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: 'Desculpe, não consegui processar sua solicitação. Tente novamente em instantes.',
          timestamp: new Date(),
        }]);
        this.thinking.set(false);
        this.scrollToBottom();
      },
    });
  }

  sendSuggestion(s: string) {
    this.userInput = s;
    this.send();
  }

  clearChat() { this.messages.set([]); }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatBox?.nativeElement) {
        this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
