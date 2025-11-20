
import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'ai-mentor',
  templateUrl: './ai-mentor.component.html',
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiMentorComponent {
  private geminiService = inject(GeminiService);
  
  messages = signal<Message[]>([
    { sender: 'ai', text: 'Olá! Eu sou o Benedito, o seu mentor de apostas. Como posso ajudar a fortalecer a sua disciplina e gestão de banca hoje?' }
  ]);
  userInput = signal('');
  isLoading = signal(false);

  chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  constructor() {
    afterNextRender(() => {
      this.scrollToBottom();
    });
  }

  async sendMessage() {
    const userMessage = this.userInput().trim();
    if (userMessage === '' || this.isLoading()) {
      return;
    }

    this.messages.update(m => [...m, { sender: 'user', text: userMessage }]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.scrollToBottom();
    
    const aiResponse = await this.geminiService.generateText(userMessage);
    
    this.messages.update(m => [...m, { sender: 'ai', text: aiResponse }]);
    this.isLoading.set(false);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const container = this.chatContainer()?.nativeElement;
      if (container) {
          setTimeout(() => container.scrollTop = container.scrollHeight, 0);
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
