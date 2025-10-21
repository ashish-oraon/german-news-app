import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId) && this.swUpdate.isEnabled) {
      this.checkForUpdates();
    }
  }

  private checkForUpdates(): void {
    // Check for new version every 6 hours
    setInterval(() => {
      this.swUpdate.checkForUpdate().then(() => {
        console.log('🔄 Checking for app updates...');
      });
    }, 6 * 60 * 60 * 1000);

    // Listen for new version available
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.showUpdateNotification();
      });

    // Check immediately on service start
    this.swUpdate.checkForUpdate();
  }

  private showUpdateNotification(): void {
    const snackBarRef = this.snackBar.open(
      '🚀 New version available! Click to update.',
      'Update Now',
      {
        duration: 0, // Keep open until action
        panelClass: ['snackbar-info'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.updateApp();
    });
  }

  private updateApp(): void {
    this.swUpdate.activateUpdate().then(() => {
      this.snackBar.open('✅ App updated successfully!', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });

      // Reload the page to apply updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }

  /**
   * Manually check for updates (called by user action)
   */
  public checkForUpdate(): void {
    if (isPlatformBrowser(this.platformId) && this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then((hasUpdate) => {
        if (hasUpdate) {
          this.showUpdateNotification();
        } else {
          this.snackBar.open('✅ You have the latest version!', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        }
      });
    }
  }

  /**
   * Check if PWA is running in standalone mode
   */
  public isStandalone(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
    return false;
  }

  /**
   * Check if app can be installed
   */
  public canInstall(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return 'beforeinstallprompt' in window;
    }
    return false;
  }
}
