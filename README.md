# ExamAssistant – Voice-Driven Exam System for Visually Impaired Users

A React Native (Expo) mobile application enabling visually impaired students to take exams independently using voice commands, offline support, and accessibility-first design.

📱 **Live APK (Android):**  
👉 https://expo.dev/artifacts/eas/fHx7RRmHDj7PfsFH9QppaF.apk

## Why This Project Matters

Traditional exam systems rely on visual interfaces, forcing visually impaired students to depend on human scribes or external tools.  
**ExamAssistant enables fully independent, voice-only exam taking.**

## Core Capabilities (Skimmable)

- 🎙 **Voice-driven navigation** (TTS + STT)
- 🔒 **Strict TTS/STT state locking** (no feedback loops)
- 📡 **Offline-first exam taking** with auto-sync
- 👥 **Role-based access** (Student / Examiner)
- 📊 **Research analytics & usability metrics**
- ♿ **Accessibility-first UX** (voice, haptics, no visual dependency)

## Technical Highlights (THIS IS GOLD)

- **React Native + Expo** (Android/iOS/Web)
- **Firebase Auth + Firestore**
- **Offline caching** with AsyncStorage
- **Explicit TTS/STT state machine**
- **Context-based command validation**
- **AI-assisted development** with full ownership

## Architecture Snapshot

The system enforces a **turn-based voice interaction model** where Text-to-Speech and Speech-to-Text are mutually exclusive, preventing feedback loops and ensuring reliable voice control.

### State Management Flow

```
IDLE → TTS Speaking (STT locked) → Process → STT Listening (TTS locked) → Process → IDLE
```

**Key Implementation**: Explicit state flags (`isSpeaking`, `isListening`) with enforced delays between transitions (500ms after STT stop, 800ms after TTS stop) ensure the microphone never captures TTS output.

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android
```

## 📚 Documentation

For comprehensive documentation, installation guides, technical details, and project structure, see:

👉 **[README-DETAILED.md](./README-DETAILED.md)** - Full project documentation

Additional documentation:
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration guide
- [NAVIGATION.md](./NAVIGATION.md) - Navigation structure documentation
- [FIRESTORE_INDEXES.md](./FIRESTORE_INDEXES.md) - Database indexing requirements

## 🤝 Contributing

This is a research project for accessibility evaluation. For contributions or questions, please contact the project maintainer.

## 📞 Contact

**Developer**: Powell Mweemba  
**Project**: ExamAssistant - Voice-Driven Exam System  
**Purpose**: Accessibility research for visually impaired students

---

**Built with ❤️ for accessibility and education**
