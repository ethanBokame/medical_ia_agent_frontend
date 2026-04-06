import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../components/chat-message/chat-message';
import { PromptInput } from '../../components/prompt-input/prompt-input';
import { LiveMode } from '../../components/live-mode/live-mode';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, ChatMessage, PromptInput, LiveMode],
  templateUrl: './agent.html',
  styleUrls: ['./agent.css']
})
export default class Agent {
  messages: Message[] = [];
  isLiveMode = false;
  welcomeMessage = "Comment pouvons nous vous aider aujourd'hui ?";

  constructor() {
    this.messages.push({
      text: this.welcomeMessage,
      isUser: false,
      timestamp: new Date()
    });
  }

  onSendMessage(prompt: string) {
    if (!prompt.trim()) return;

    this.messages.push({
      text: prompt,
      isUser: true,
      timestamp: new Date()
    });

    setTimeout(() => {
      this.messages.push({
        text: this.getAIResponse(prompt),
        isUser: false,
        timestamp: new Date()
      });
    }, 1000);
  }

  onToggleLiveMode() { // Changé ici aussi pour correspondre
    this.isLiveMode = !this.isLiveMode;
  }

  private getAIResponse(userMessage: string): string {
    const responses = [
      "Je comprends votre préoccupation. Pouvez-vous me donner plus de détails sur vos symptômes ?",
      "D'après ce que vous décrivez, je vous recommande de consulter un médecin généraliste.",
      "Voici quelques conseils qui pourraient vous aider en attendant votre consultation médicale...",
      "Je ne suis pas un médecin, mais je peux vous orienter vers des ressources fiables."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}