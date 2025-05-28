import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Badge, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { WifiOff as OfflineIcon, Wifi as OnlineIcon, Sync as SyncIcon } from '@mui/icons-material';
import connectivityService from '../services/connectivity';

const ConnectivityStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState<boolean>(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((online) => {
      // Only show alerts when status changes, not on initial load
      if (isOnline !== online) {
        if (online) {
          setShowOnlineAlert(true);
        } else {
          setShowOfflineAlert(true);
        }
      }
      setIsOnline(online);
    });

    // Get sync status
    const checkSyncStatus = () => {
      setIsSyncing(connectivityService.getIsSyncing());
    };

    // Check periodically for sync status
    const syncInterval = setInterval(checkSyncStatus, 1000);

    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  // Check for pending sync items
  useEffect(() => {
    // This would ideally be connected to our DB, but for simplicity we'll use localStorage
    const checkPending = async () => {
      try {
        // In a real implementation, you would check the sync queue length
        // This is just a placeholder
        const pendingCount = Math.floor(Math.random() * 5); // Mock 0-4 pending items
        setPendingSyncCount(pendingCount);
      } catch (error) {
        console.error('Error checking pending sync items', error);
      }
    };

    // Check when online status changes or periodically
    checkPending();
    const interval = setInterval(checkPending, 10000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Trigger manual sync
  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      await connectivityService.manualSync();
      setPendingSyncCount(0);
    } catch (error) {
      console.error('Manual sync failed', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Offline Status Icon */}
      <Tooltip title={isOnline ? 'Online' : 'Offline - Changes will be saved locally'}>
        <Badge
          color={pendingSyncCount > 0 ? 'warning' : 'default'}
          overlap="circular"
          sx={{ mr: 1 }}
        >
          <IconButton size="small" color={isOnline ? 'primary' : 'error'}>
            {isOnline ? <OnlineIcon /> : <OfflineIcon />}
          </IconButton>
        </Badge>
      </Tooltip>

      {/* Sync Button */}
      {isOnline && pendingSyncCount > 0 && (
        <Tooltip title="Sync pending changes">
          <IconButton
            size="small"
            color="primary"
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SyncIcon />
            )}
          </IconButton>
        </Tooltip>
      )}

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={4000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setShowOfflineAlert(false)}
        >
          You're offline. Changes will be saved locally and synced when you're back online.
        </Alert>
      </Snackbar>

      {/* Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={4000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowOnlineAlert(false)}
        >
          You're back online. Syncing your changes...
        </Alert>
      </Snackbar>
    </>
  );
};

export default ConnectivityStatus; 