import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  getHeadersWithToken(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('No token found in session storage');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  getHeadersWithoutToken(): HttpHeaders {
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  getHeadersWithTokenForApis(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('No token found in session storage');
    
    return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    });
}


getHeadersWithoutTokenForApis(): HttpHeaders {
  return new HttpHeaders({
      'Content-Type': 'application/json',
  });
}


  getHeadersWithTokenForBlob() {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    });

    
    const opciones = {
        headers: headers,
        responseType: 'blob' as 'json', 
        observe: 'response' as 'body'
    };

    return opciones;
  }

  
}
