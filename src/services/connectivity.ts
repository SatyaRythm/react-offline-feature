import { processSyncQueue } from './db';

// Type for connectivity change subscribers
type ConnectivityChangeCallback = (isOnline: boolean) => void;

// Class to handle connectivity status and changes
class ConnectivityService {
  private isOnline: boolean = navigator.onLine;
  private subscribers: ConnectivityChangeCallback[] = [];
  private syncInProgress: boolean = false;
  private syncScheduled: boolean = false;

  constructor() {
    // Initialize and set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up window event listeners for online/offline events
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Handle the online event
   */
  private handleOnline = async (): Promise<void> => {
    console.log('App is online');
    this.isOnline = true;
    
    // Notify subscribers
    this.notifySubscribers();
    
    // Start sync process
    this.scheduleSyncQueue();
  };

  /**
   * Handle the offline event
   */
  private handleOffline = (): void => {
    console.log('App is offline');
    this.isOnline = false;
    
    // Notify subscribers
    this.notifySubscribers();
  };

  /**
   * Schedule a sync queue processing for after a short delay
   * This helps avoid multiple syncs when connectivity fluctuates
   */
  private scheduleSyncQueue(): void {
    if (this.syncScheduled || this.syncInProgress) {
      return;
    }
    
    this.syncScheduled = true;
    
    // Wait 2 seconds before syncing to make sure the connection is stable
    setTimeout(() => {
      this.processQueue();
      this.syncScheduled = false;
    }, 2000);
  }

  /**
   * Process the sync queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      console.log('Processing sync queue...');
      const result = await processSyncQueue((current, total) => {
        console.log(`Syncing ${current} of ${total} operations...`);
      });
      
      console.log(`Sync completed: ${result.success} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.syncInProgress = false;
      
      // If more items were added during sync, schedule another sync
      if (this.isOnline) {
        this.scheduleSyncQueue();
      }
    }
  }

  /**
   * Manually trigger a sync process
   */
  public async manualSync(): Promise<{ success: number; failed: number } | null> {
    if (!this.isOnline) {
      console.log('Cannot sync while offline');
      return null;
    }
    
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return null;
    }
    
    this.syncInProgress = true;
    
    try {
      console.log('Manual sync started...');
      return await processSyncQueue();
    } catch (error) {
      console.error('Error during manual sync:', error);
      return null;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Subscribe to connectivity changes
   */
  public subscribe(callback: ConnectivityChangeCallback): () => void {
    this.subscribers.push(callback);
    
    // Immediately notify with the current status
    callback(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of connectivity change
   */
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.isOnline);
    }
  }

  /**
   * Get current online status
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get whether a sync is currently in progress
   */
  public getIsSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Create a singleton instance
const connectivityService = new ConnectivityService();

export default connectivityService; 