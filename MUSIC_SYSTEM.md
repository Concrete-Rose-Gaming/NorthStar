# Music System Documentation

## Overview
The game now includes a background music system that enhances the player experience with appropriate audio for different game states.

## Features

### 1. Intro Music
- **File**: `intro.mp3`
- **When it plays**: Automatically plays when you're on the lobby/start screen
- **Behavior**: Loops continuously until game starts

### 2. Gameplay Music
- **Files**: 
  - `cooking-159122.mp3`
  - `cooking-food-music-312872.mp3`
  - `on-fight-18441.mp3`
  - `that-jazz-260655.mp3`
  - `the-show-intro-162872.mp3`
- **When it plays**: Automatically plays when a game begins
- **Behavior**: 
  - Randomly selects one track from the gameplay music collection
  - Loops continuously during gameplay
  - Different song may play each time you start a new game

### 3. Mute Button
- **Location**: Fixed button in the top-right corner of the screen
- **Appearance**: 
  - 🔊 when music is playing
  - 🔇 when music is muted
- **Behavior**: 
  - Click to toggle mute on/off
  - Mute state is saved to localStorage and persists across sessions
  - Available on all screens (lobby, deck builder, gameplay)

## Technical Details

### Components
- **MusicService** (`src/services/MusicService.ts`): Singleton service managing all audio playback
- **MuteButton** (`src/components/MuteButton/MuteButton.tsx`): UI component for mute control
- **Integration**: App.tsx automatically manages music based on game state

### Music Files Location
Music files are stored in `public/music/` and are accessible via `/music/` URLs.

### Volume
- Default volume: 30% (0.3)
- Can be adjusted in MusicService if needed

### Browser Compatibility
Modern browsers may require user interaction before playing audio. The music will start playing after the first user interaction with the page.
