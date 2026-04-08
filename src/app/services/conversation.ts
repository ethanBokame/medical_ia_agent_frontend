// services/conversation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ApiResponse, 
  Conversation, 
  CreateConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
  ConversationDetailResponse
} from '../model/conversation';
import { Auth } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/conversations`;
  private createUrl = `${this.baseUrl}/conversation`;
  private messageUrl = `${this.baseUrl}/message`;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Récupère toutes les conversations
   */
  getConversations(): Observable<ApiResponse> {
    console.log('GET Conversations:', this.apiUrl);
    return this.http.get<ApiResponse>(this.apiUrl, { headers: this.getHeaders() });
  }

  /**
   * Crée une nouvelle conversation
   */
  createConversation(): Observable<CreateConversationResponse> {
    console.log('POST Create conversation:', this.createUrl);
    return this.http.post<CreateConversationResponse>(this.createUrl, {}, { headers: this.getHeaders() });
  }

  /**
   * Récupère une conversation par son ID avec ses messages
   */
  getConversationById(id: number): Observable<ConversationDetailResponse> {
    const url = `${this.apiUrl}/${id}`;
    console.log('GET Conversation by ID:', url);
    return this.http.get<ConversationDetailResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Envoie un message dans une conversation
   */
  sendMessage(conversationId: number, content: string): Observable<SendMessageResponse> {
    const request: SendMessageRequest = {
      content: content,
      conversation_id: conversationId
    };
    console.log('POST Send message:', this.messageUrl, request);
    return this.http.post<SendMessageResponse>(this.messageUrl, request, { headers: this.getHeaders() });
  }

  /**
   * Supprime une conversation
   */
  deleteConversation(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}