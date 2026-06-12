import { useAuthStore } from '../store/useAuthStore';

type WebSocketEventCallback = (payload: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 1000; // Allow 1000 retries
  private baseReconnectDelay = 1000; // 1s
  private maxReconnectDelay = 30000; // Cap delay at 30 seconds
  private isConnecting = false;
  private listeners: Map<string, Set<WebSocketEventCallback>> = new Map();
  private socketUrl = '';

  /**
   * Connect to the WebSocket Server.
   * Path depends on user role ('farmer' or 'admin').
   */
  public connect(url: string, token: string) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Reset attempts when explicitly connecting
    this.reconnectAttempts = 0;
    this.isConnecting = true;
    this.socketUrl = `${url}?token=${encodeURIComponent(token)}`;
    console.log(`[WebSocket] Connecting to: ${url}`);

    try {
      this.socket = new WebSocket(this.socketUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connection established successfully.');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;
          if (type) {
            this.emit(type, payload);
          }
        } catch (err) {
          console.warn('[WebSocket] Failed to parse message:', err);
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[WebSocket] Connection error:', error);
      };

      this.socket.onclose = (event) => {
        console.log(`[WebSocket] Connection closed (Code: ${event.code}, Reason: ${event.reason})`);
        this.socket = null;
        this.isConnecting = false;
        
        // Handle reconnection if not closed intentionally
        if (event.code !== 1000) {
          this.attemptReconnection();
        }
      };
    } catch (error) {
      console.warn('[WebSocket] Failed to create socket connection:', error);
      this.isConnecting = false;
      this.attemptReconnection();
    }
  }

  /**
   * Attempt connection retry using Exponential Backoff.
   */
  private attemptReconnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached. Please check connectivity.');
      return;
    }

    const delay = Math.min(this.maxReconnectDelay, this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts++;
    console.log(`[WebSocket] Attempting reconnect #${this.reconnectAttempts} in ${delay}ms... (Max Retries: ${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.socketUrl) {
        // Retrieve fresh token from store to support session refreshes
        const token = useAuthStore.getState().user ? `mock-token-${useAuthStore.getState().user?.role === 'admin' ? 'admin' : 'farmer-' + useAuthStore.getState().user?.uid}` : '';
        this.connect(this.socketUrl.split('?')[0], token);
      }
    }, delay);
  }

  /**
   * Disconnect socket cleanly.
   */
  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      console.log('[WebSocket] Explicitly closing socket connection.');
      this.socket.close(1000, 'User logged out');
      this.socket = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Send a message to the WebSocket server.
   */
  public send(type: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
      console.log(`[WebSocket] Sent: ${type}`);
    } else {
      console.warn('[WebSocket] Cannot send message, socket is not open.');
    }
  }

  /**
   * Register a callback listener for specific real-time events.
   */
  public addEventListener(event: string, callback: WebSocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.removeEventListener(event, callback);
  }

  /**
   * Remove a registered callback listener.
   */
  public removeEventListener(event: string, callback: WebSocketEventCallback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  /**
   * Dispatch events to registered listeners.
   */
  private emit(event: string, payload: any) {
    console.log(`[WebSocket] Dispatching event: ${event}`);
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.warn(`[WebSocket] Error in callback listener for ${event}:`, err);
        }
      });
    }
  }
}

export const webSocketService = new WebSocketService();
