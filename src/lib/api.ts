import { io } from 'socket.io-client';

const API_URL = window.location.origin;

export const socket = io(API_URL, {
  autoConnect: false
});

export const api = {
  async get(endpoint: string) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      let errorMessage = 'API hatası';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // JSON değilse body'yi metin olarak almayı deneyebiliriz veya varsayılan hata döneriz
      }
      throw new Error(errorMessage);
    }

    return res.json();
  },

  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      let errorMessage = 'İşlem başarısız';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // HTML hata sayfası gelirse buraya düşer
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }
};
