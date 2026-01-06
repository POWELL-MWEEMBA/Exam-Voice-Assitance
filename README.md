ExamAssistant – Voice-Driven Exam System for Visually Impaired Users

A React Native (Expo) mobile application enabling visually impaired students to take exams independently using voice commands, offline support, and accessibility-first design.

📱 Live APK (Android):
👉 https://expo.dev/artifacts/eas/fHx7RRmHDj7PfsFH9QppaF.apk


Why This Project Matters

Traditional exam systems rely on visual interfaces, forcing visually impaired students to depend on human scribes or external tools.
ExamAssistant enables fully independent, voice-only exam taking.

Core Capabilities 

🎙 Voice-driven navigation (TTS + STT)

🔒 Strict TTS/STT state locking (no feedback loops)

📡 Offline-first exam taking with auto-sync

👥 Role-based access (Student / Examiner)

📊 Research analytics & usability metrics

♿ Accessibility-first UX (voice, haptics, no visual dependency)


Technical Highlights 

React Native + Expo (Android)

Firebase Auth + Firestore

Offline caching with AsyncStorage

Explicit TTS/STT state machine

Context-based command validation

AI-assisted development with full ownership

Architecture Snapshot

The system enforces a turn-based voice interaction model where Text-to-Speech and Speech-to-Text are mutually exclusive, preventing feedback loops and ensuring reliable voice control.

Note: For more info read the #READ-DETAILED.md
