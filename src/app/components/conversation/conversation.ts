import { Component, OnInit, HostListener, ElementRef, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ConversationService } from '../../services/conversation';
import { Conversation as ConversationModel } from '../../model/conversation';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './conversation.html',
  styleUrls: ['./conversation.css'],
  providers: [ConversationService]
})
export class Conversation implements OnInit {
  @Output() conversationSelected = new EventEmitter<number>();
  
  discussions: ConversationModel[] = [];
  isListVisible = false;
  loading = false;
  error = '';
  creating = false;

  constructor(
    private elementRef: ElementRef,
    private conversationService: ConversationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDiscussions();
  }

  loadDiscussions() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    this.conversationService.getConversations().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.discussions = response.data;
          console.log('Conversations chargées:', this.discussions.length);
        } else {
          this.error = response.message || 'Erreur lors du chargement';
          this.discussions = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des conversations:', err);
        this.error = err.error?.message || 'Impossible de charger les conversations';
        this.discussions = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createNewDiscussion() {
    this.creating = true;
    this.error = '';
    this.cdr.detectChanges();
    
    this.conversationService.createConversation().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('Conversation créée:', response.data);
          
          // Ajouter la nouvelle conversation à la liste
          const newConversation: ConversationModel = {
            id: response.data.id,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
            user_id: response.data.user_id
          };
          
          // Ajouter au début de la liste
          this.discussions = [newConversation, ...this.discussions];
          this.cdr.detectChanges();
          
          // Optionnel : sélectionner automatiquement la nouvelle conversation
          // this.selectConversation(response.data.id);
        } else {
          this.error = response.message || 'Erreur lors de la création';
        }
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la création de la conversation:', err);
        this.error = err.error?.message || 'Impossible de créer une nouvelle conversation';
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectConversation(conversationId: number) {
    console.log('Sélection de la conversation:', conversationId);
    this.conversationSelected.emit(conversationId);
    this.closeList();
  }

  toggleDiscussionList() {
    this.isListVisible = !this.isListVisible;
    if (this.isListVisible && this.discussions.length === 0) {
      this.loadDiscussions();
    }
    this.cdr.detectChanges();
  }

  closeList() {
    this.isListVisible = false;
    this.cdr.detectChanges();
  }

  refreshDiscussions() {
    this.loadDiscussions();
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isListVisible) {
      const clickedInside = this.elementRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closeList();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.isListVisible) {
      this.closeList();
    }
  }
}