import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: {email: string; password: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  saveToken(token: string): void {
    localStorage.setItem('user-auth', token);
  }

  getToken(): string | null {
    return localStorage.getItem('user-auth');
  }

  logout(): void {
    localStorage.removeItem('user.auth');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
