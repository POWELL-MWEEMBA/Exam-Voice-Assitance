/**
 * Screen Context Service
 * Manages screen context isolation for voice commands
 * Ensures commands from one screen don't work on another screen
 */

class ScreenContextService {
  constructor() {
    this.currentScreenContext = null; // "HOME" | "EXAM" | null
    this.listeners = [];
  }

  /**
   * Set the current screen context
   */
  setContext(context) {
    if (context !== 'HOME' && context !== 'EXAM' && context !== null) {
      console.warn('[ScreenContext] Invalid context:', context);
      return;
    }

    const previousContext = this.currentScreenContext;
    this.currentScreenContext = context;
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(context, previousContext);
      } catch (error) {
        console.error('[ScreenContext] Error in listener:', error);
      }
    });

    console.log('[ScreenContext] Context changed:', previousContext, '->', context);
  }

  /**
   * Get the current screen context
   */
  getContext() {
    return this.currentScreenContext;
  }

  /**
   * Check if a command is valid for the current context
   */
  isCommandValid(command, context) {
    if (this.currentScreenContext !== context) {
      return false;
    }
    return true;
  }

  /**
   * Subscribe to context changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Reset context
   */
  reset() {
    this.setContext(null);
  }
}

// Export singleton instance
export const screenContextService = new ScreenContextService();
export default screenContextService;

