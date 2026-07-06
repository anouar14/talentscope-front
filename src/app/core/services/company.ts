import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from '../models/company';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = 'http://localhost:8080/api/companies';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/me`);
  }

  updateProfile(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/me`, company);
  }
}