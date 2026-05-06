import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface TranslationHistoryItem {
  id: number; // timestamp
  videoName: string;
  youtubeUrl: string | null;
  enSrtContent: string;
  viSrtContent: string;
  dateStr: string;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private platformId = inject(PLATFORM_ID);
  
  private readonly DB_NAME = 'silaSub_history_db';
  private readonly STORE_NAME = 'translations';
  private readonly DB_VERSION = 1;
  private readonly MAX_ITEMS = 10;

  historyItems = signal<TranslationHistoryItem[]>([]);
  isHistoryModalOpen = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHistory();
    }
  }

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        return reject(new Error('Not a browser environment'));
      }
      
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async loadHistory() {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as TranslationHistoryItem[];
        // Sort descending by id
        items.sort((a, b) => b.id - a.id);
        this.historyItems.set(items);
      };
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }

  async saveTranslation(item: Omit<TranslationHistoryItem, 'id' | 'dateStr'>) {
    try {
      const db = await this.getDB();
      
      // Calculate date string
      const now = new Date();
      const dateStr = now.toLocaleDateString('vi-VN', { 
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
      });

      const fullItem: TranslationHistoryItem = {
        ...item,
        id: now.getTime(),
        dateStr
      };

      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      store.add(fullItem);

      transaction.oncomplete = async () => {
        // Enforce MAX limit after adding
        await this.enforceMaxLimit();
        this.loadHistory();
      };
    } catch (e) {
      console.error('Failed to save translation history', e);
    }
  }

  async deleteItem(id: number) {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      store.delete(id);

      transaction.oncomplete = () => {
        this.loadHistory();
      };
    } catch (e) {
      console.error('Failed to delete history item', e);
    }
  }

  async clearHistory() {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      store.clear();

      transaction.oncomplete = () => {
        this.loadHistory();
      };
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  }

  private async enforceMaxLimit() {
    const db = await this.getDB();
    const transaction = db.transaction(this.STORE_NAME, 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const items = request.result as TranslationHistoryItem[];
      if (items.length > this.MAX_ITEMS) {
        items.sort((a, b) => b.id - a.id); // Descending
        
        // Find items to delete
        const itemsToDelete = items.slice(this.MAX_ITEMS);
        
        if (itemsToDelete.length > 0) {
          const delTransaction = db.transaction(this.STORE_NAME, 'readwrite');
          const delStore = delTransaction.objectStore(this.STORE_NAME);
          itemsToDelete.forEach(item => delStore.delete(item.id));
        }
      }
    };
  }
}
