/**
 * ⚡ LOADING SPINNER MODERNO v2026 — Feedback visual elegante
 * Sistema de loading unificado com múltiplas variações
 * 
 * Design: Animações CSS puras + gradientes vibrantes + tipos contextuais  
 * Performance: Zero JS animations, apenas CSS transforms
 */
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'skeleton';
export type LoadingContext = 'page' | 'card' | 'button' | 'inline';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
  <!-- 🎯 Container responsivo baseado no contexto -->
  <div [ngSwitch]="context()" class="flex items-center justify-center">
    
    <!-- 📄 Page-level loading (fullscreen overlay) -->
    <div *ngSwitchCase="'page'" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="text-center">
        <div [ngSwitch]="type()">
          <!-- 🌀 Spinner principal -->
          <div *ngSwitchDefault [class]="getSpinnerClasses()">
            <div class="loading-spinner-ring"></div>
          </div>
          
          <!-- 🔵 Dots loading -->
          <div *ngSwitchCase="'dots'" [class]="getDotsClasses()">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
          
          <!-- 💗 Pulse loading -->
          <div *ngSwitchCase="'pulse'" [class]="getPulseClasses()">
            <div class="loading-pulse-circle"></div>
          </div>
        </div>
        
        @if (message()) {
          <p class="mt-4 text-text-secondary font-medium">{{ message() }}</p>
        }
      </div>
    </div>
    
    <!-- 🃏 Card-level loading -->
    <div *ngSwitchCase="'card'" class="w-full py-8">
      <div [ngSwitch]="type()">
        <!-- 💀 Skeleton para cards -->
        <div *ngSwitchCase="'skeleton'" [class]="getSkeletonClasses()">
          <div class="skeleton-line h-6 w-3/4 mb-4"></div>
          <div class="skeleton-line h-4 w-full mb-2"></div>
          <div class="skeleton-line h-4 w-5/6"></div>
        </div>
        
        <!-- 🌀 Spinner para cards -->
        <div *ngSwitchDefault class="flex flex-col items-center">
          <div [class]="getSpinnerClasses()">
            <div class="loading-spinner-ring"></div>
          </div>
          @if (message()) {
            <p class="mt-3 text-sm text-text-secondary">{{ message() }}</p>
          }
        </div>
      </div>
    </div>
    
    <!-- 🔘 Button loading -->
    <div *ngSwitchCase="'button'" class="flex items-center gap-2">
      <div [class]="getSpinnerClasses()">
        <div class="loading-spinner-ring"></div>
      </div>
      @if (message()) {
        <span class="text-sm">{{ message() }}</span>
      }
    </div>
    
    <!-- ➡️ Inline loading -->
    <div *ngSwitchDefault class="flex items-center gap-2">
      <div [ngSwitch]="type()">
        <div *ngSwitchCase="'dots'" [class]="getDotsClasses()">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        
        <div *ngSwitchDefault [class]="getSpinnerClasses()">
          <div class="loading-spinner-ring"></div>
        </div>
      </div>
      
      @if (message()) {
        <span class="text-sm text-text-secondary">{{ message() }}</span>
      }
    </div>
  </div>
  `,
  styles: [`
    /* 🌀 SPINNER RING MODERNO */
    .loading-spinner-ring {
      border: 2px solid rgba(108, 92, 231, 0.1);
      border-top: 2px solid #6C5CE7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    /* Size variants */
    .spinner-sm .loading-spinner-ring { width: 16px; height: 16px; }
    .spinner-md .loading-spinner-ring { width: 24px; height: 24px; }
    .spinner-lg .loading-spinner-ring { width: 32px; height: 32px; }
    .spinner-xl .loading-spinner-ring { width: 48px; height: 48px; border-width: 3px; }
    
    /* 🔵 DOTS LOADING */
    .loading-dots {
      display: flex;
      gap: 4px;
    }
    
    .loading-dot {
      background: linear-gradient(135deg, #6C5CE7, #9A8CFF);
      border-radius: 50%;
      animation: bounce-dots 1.4s ease-in-out infinite both;
    }
    
    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }
    .loading-dot:nth-child(3) { animation-delay: 0s; }
    
    /* Dots size variants */
    .dots-sm .loading-dot { width: 6px; height: 6px; }
    .dots-md .loading-dot { width: 8px; height: 8px; }
    .dots-lg .loading-dot { width: 10px; height: 10px; }
    .dots-xl .loading-dot { width: 12px; height: 12px; }
    
    /* 💗 PULSE LOADING */
    .loading-pulse-circle {
      background: linear-gradient(135deg, #6C5CE7, #9A8CFF);
      border-radius: 50%;
      animation: pulse-scale 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    /* Pulse size variants */
    .pulse-sm .loading-pulse-circle { width: 16px; height: 16px; }
    .pulse-md .loading-pulse-circle { width: 24px; height: 24px; }
    .pulse-lg .loading-pulse-circle { width: 32px; height: 32px; }
    .pulse-xl .loading-pulse-circle { width: 48px; height: 48px; }
    
    /* 💀 SKELETON LOADING */
    .skeleton-line {
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
      border-radius: 8px;
    }
    
    /* ⚡ ANIMAÇÕES PERSONALIZADAS */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes bounce-dots {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes pulse-scale {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    /* 🎯 Estados contextuais */
    :host {
      display: block;
    }
  `]
})
export class LoadingSpinnerComponent {
  size = input<LoadingSize>('md');
  type = input<LoadingType>('spinner');
  context = input<LoadingContext>('inline');
  message = input<string>();
  
  getSpinnerClasses(): string {
    return `spinner-${this.size()}`;
  }
  
  getDotsClasses(): string {
    return `loading-dots dots-${this.size()}`;
  }
  
  getPulseClasses(): string {
    return `pulse-${this.size()}`;
  }
  
  getSkeletonClasses(): string {
    return 'space-y-3 animate-pulse';
  }
}