/**
 * Speech Service
 * Manages Text-to-Speech (TTS) and Speech-to-Text (STT) with strict turn-taking
 * Ensures TTS and STT never overlap
 */

import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';

class SpeechService {
  constructor() {
    this.isSpeaking = false;
    this.isListening = false;
    this.isInitialized = false;
    this.speechQueue = [];
    this.currentRecognition = null;
    this.currentRecognitionSubscriptions = null;
    this.onSpeechEndCallback = null;
    this.onRecognitionResultCallback = null;
    this.onRecognitionErrorCallback = null;
    this.silenceTimeout = null;
    this.silenceTimeoutDuration = 10000; // 10 seconds
    this.lastSpokenMessage = null;
  }

  /**
   * Initialize speech recognition
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permissions
      const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[SpeechService] Speech recognition permission not granted');
        return false;
      }
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[SpeechService] Error initializing:', error);
      return false;
    }
  }

  /**
   * Speak text using TTS
   * Automatically disables STT while speaking
   */
  async speak(text, options = {}) {
    if (!text || text.trim() === '') return;

    // If already speaking, queue the message
    if (this.isSpeaking) {
      this.speechQueue.push({ text, options });
      return;
    }

    // Stop listening before speaking and wait a bit to ensure it's fully stopped
    if (this.isListening) {
      await this.stopListening();
      // Wait longer to ensure recognition is fully stopped before TTS starts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isSpeaking = true;
    this.lastSpokenMessage = text;

    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        ...options,
        onDone: () => {
          this.isSpeaking = false;
          
          // Wait a bit before processing queue or re-enabling STT to prevent feedback
          setTimeout(() => {
            // Process next item in queue
            if (this.speechQueue.length > 0) {
              const next = this.speechQueue.shift();
              this.speak(next.text, next.options).then(resolve).catch(reject);
            } else {
              // Re-enable STT after speaking is done
              if (this.onSpeechEndCallback) {
                this.onSpeechEndCallback();
              }
              resolve();
            }
          }, 300);
        },
        onStopped: () => {
          this.isSpeaking = false;
          if (this.onSpeechEndCallback) {
            this.onSpeechEndCallback();
          }
          resolve();
        },
        onError: (error) => {
          this.isSpeaking = false;
          console.error('[SpeechService] TTS Error:', error);
          if (this.onSpeechEndCallback) {
            this.onSpeechEndCallback();
          }
          reject(error);
        },
      });
    });
  }

  /**
   * Stop TTS immediately
   */
  stopSpeaking() {
    if (this.isSpeaking) {
      Speech.stop();
      this.isSpeaking = false;
      this.speechQueue = [];
    }
  }

  /**
   * Start listening for voice commands
   * Automatically stops TTS if speaking
   */
  async startListening(options = {}) {
    // Don't start if already listening
    if (this.isListening) {
      console.log('[SpeechService] Already listening, skipping start');
      return;
    }

    // Stop speaking before listening and wait longer
    if (this.isSpeaking) {
      console.log('[SpeechService] TTS is speaking, stopping before listening');
      this.stopSpeaking();
      // Wait longer for TTS to fully stop and audio to clear
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      // Stop any existing recognition
      if (this.currentRecognition) {
        await this.stopListening();
      }

      this.isListening = true;

      // Clear previous silence timeout
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
      }

      // Set up silence timeout
      this.silenceTimeout = setTimeout(() => {
        if (this.isListening && this.onRecognitionErrorCallback) {
          this.onRecognitionErrorCallback({
            type: 'silence_timeout',
            message: 'No input detected. Please say a command.',
          });
        }
      }, this.silenceTimeoutDuration);

      // Start recognition using ExpoSpeechRecognitionModule
      try {
        // Remove ALL existing listeners first to avoid duplicates
        if (this.currentRecognitionSubscriptions) {
          Object.keys(this.currentRecognitionSubscriptions).forEach(key => {
            const subscription = this.currentRecognitionSubscriptions[key];
            if (subscription && typeof subscription.remove === 'function') {
              try {
                subscription.remove();
              } catch (e) {
                console.warn('[SpeechService] Error removing subscription:', key, e);
              }
            }
          });
          this.currentRecognitionSubscriptions = null;
        }
        
        // Also remove all listeners from the module to be safe
        // Note: This might not exist in all versions, so we handle it gracefully
        try {
          if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.removeAllListeners === 'function') {
            ExpoSpeechRecognitionModule.removeAllListeners('result');
            ExpoSpeechRecognitionModule.removeAllListeners('error');
          }
        } catch (e) {
          // Ignore if method doesn't exist or fails - this is expected in some versions
          // console.warn('[SpeechService] Could not remove all listeners:', e);
        }

        // Set up event listeners before starting
        const resultSubscription = ExpoSpeechRecognitionModule.addListener('result', (event) => {
          console.log('[SpeechService] Recognition result received:', JSON.stringify(event, null, 2));
          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
          }

          // Process results - check the event structure
          if (event) {
            // Check if results is an array
            const results = event.results || (Array.isArray(event) ? event : [event]);
            
            if (results && results.length > 0) {
              // Handle different result formats
              const firstResult = results[0];
              const transcript = firstResult.transcript || firstResult.text || firstResult;
              
              if (transcript && typeof transcript === 'string' && transcript.trim() && this.onRecognitionResultCallback) {
                const isFinal = event.isFinal !== undefined ? event.isFinal : (firstResult.isFinal !== undefined ? firstResult.isFinal : true);
                
                // Process final results immediately
                if (isFinal) {
                  this.isListening = false;
                  console.log('[SpeechService] Processing final transcript:', transcript);
                  console.log('[SpeechService] Callback exists:', !!this.onRecognitionResultCallback);
                  if (this.onRecognitionResultCallback) {
                    try {
                      // Use setTimeout to ensure callback runs asynchronously and doesn't block
                      const transcriptToProcess = transcript.trim();
                      setTimeout(() => {
                        try {
                          if (this.onRecognitionResultCallback) {
                            this.onRecognitionResultCallback(transcriptToProcess);
                          }
                        } catch (callbackError) {
                          console.error('[SpeechService] Error in recognition callback:', callbackError);
                        }
                      }, 0);
                    } catch (error) {
                      console.error('[SpeechService] Error scheduling recognition callback:', error);
                    }
                  } else {
                    console.error('[SpeechService] No callback registered!');
                  }
                } else {
                  // Log interim results for debugging but don't process them
                  console.log('[SpeechService] Interim result (ignored):', transcript);
                }
              } else {
                console.log('[SpeechService] No valid transcript found in result:', firstResult);
              }
            } else {
              console.log('[SpeechService] No results in event:', event);
            }
          } else {
            console.log('[SpeechService] Empty event received');
          }
        });

        const errorSubscription = ExpoSpeechRecognitionModule.addListener('error', (error) => {
          console.error('[SpeechService] Recognition error:', error);
          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
          }

          this.isListening = false;
          if (this.onRecognitionErrorCallback) {
            this.onRecognitionErrorCallback({
              type: error.error || 'unknown',
              message: error.message || 'Speech recognition error',
            });
          }
        });

        // Store subscriptions for cleanup
        this.currentRecognitionSubscriptions = {
          result: resultSubscription,
          error: errorSubscription,
        };

        // Start recognition
        console.log('[SpeechService] Starting recognition...');
        try {
          ExpoSpeechRecognitionModule.start({
            lang: 'en-US',
            continuous: false,
            interimResults: false, // Only get final results
            ...options,
          });

          this.currentRecognition = true; // Mark as active
          console.log('[SpeechService] Recognition started successfully, isListening:', this.isListening);
        } catch (startError) {
          console.error('[SpeechService] Error calling start():', startError);
          // Clean up subscriptions if start failed
          if (resultSubscription && typeof resultSubscription.remove === 'function') {
            resultSubscription.remove();
          }
          if (errorSubscription && typeof errorSubscription.remove === 'function') {
            errorSubscription.remove();
          }
          this.currentRecognitionSubscriptions = null;
          this.isListening = false;
          throw startError;
        }
      } catch (apiError) {
        console.error('[SpeechService] Error starting recognition:', apiError);
        this.isListening = false;
        if (this.onRecognitionErrorCallback) {
          this.onRecognitionErrorCallback({
            type: 'unknown',
            message: apiError.message || 'Failed to start recognition',
          });
        }
        throw apiError;
      }

    } catch (error) {
      this.isListening = false;
      console.error('[SpeechService] Error starting recognition:', error);
      if (this.onRecognitionErrorCallback) {
        this.onRecognitionErrorCallback(error);
      }
    }
  }

  /**
   * Stop listening for voice commands
   */
  async stopListening() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.currentRecognition) {
      try {
        // Stop recognition
        if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.stop === 'function') {
          ExpoSpeechRecognitionModule.stop();
        }

        // Remove subscriptions if they exist
        if (this.currentRecognitionSubscriptions) {
          try {
            if (this.currentRecognitionSubscriptions.result && typeof this.currentRecognitionSubscriptions.result.remove === 'function') {
              this.currentRecognitionSubscriptions.result.remove();
            }
          } catch (e) {
            console.warn('[SpeechService] Error removing result subscription:', e);
          }
          try {
            if (this.currentRecognitionSubscriptions.error && typeof this.currentRecognitionSubscriptions.error.remove === 'function') {
              this.currentRecognitionSubscriptions.error.remove();
            }
          } catch (e) {
            console.warn('[SpeechService] Error removing error subscription:', e);
          }
          this.currentRecognitionSubscriptions = null;
        }
      } catch (error) {
        console.error('[SpeechService] Error stopping recognition:', error);
      }
      this.currentRecognition = null;
    }

    this.isListening = false;
  }

  /**
   * Abort current recognition
   */
  async abortListening() {
    if (this.currentRecognition) {
      try {
        // Abort recognition
        if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.abort === 'function') {
          ExpoSpeechRecognitionModule.abort();
        }

        // Remove subscriptions if they exist
        if (this.currentRecognitionSubscriptions) {
          try {
            if (this.currentRecognitionSubscriptions.result && typeof this.currentRecognitionSubscriptions.result.remove === 'function') {
              this.currentRecognitionSubscriptions.result.remove();
            }
          } catch (e) {
            console.warn('[SpeechService] Error removing result subscription in abort:', e);
          }
          try {
            if (this.currentRecognitionSubscriptions.error && typeof this.currentRecognitionSubscriptions.error.remove === 'function') {
              this.currentRecognitionSubscriptions.error.remove();
            }
          } catch (e) {
            console.warn('[SpeechService] Error removing error subscription in abort:', e);
          }
          this.currentRecognitionSubscriptions = null;
        }
      } catch (error) {
        console.error('[SpeechService] Error aborting recognition:', error);
      }
      this.currentRecognition = null;
    }

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    this.isListening = false;
  }

  /**
   * Set callback for when speech ends
   */
  setOnSpeechEnd(callback) {
    this.onSpeechEndCallback = callback;
  }

  /**
   * Set callback for recognition results
   */
  setOnRecognitionResult(callback) {
    this.onRecognitionResultCallback = callback;
  }

  /**
   * Set callback for recognition errors
   */
  setOnRecognitionError(callback) {
    this.onRecognitionErrorCallback = callback;
  }

  /**
   * Get the last spoken message
   */
  getLastSpokenMessage() {
    return this.lastSpokenMessage;
  }

  /**
   * Clean up all resources
   */
  async cleanup() {
    this.stopSpeaking();
    await this.stopListening();
    this.onSpeechEndCallback = null;
    this.onRecognitionResultCallback = null;
    this.onRecognitionErrorCallback = null;
    this.lastSpokenMessage = null;
  }
}

// Export singleton instance
export const speechService = new SpeechService();
export default speechService;

