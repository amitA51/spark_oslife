#### `App.tsx`
- **`AppLoading`**: Extracted the loading spinner into `components/AppLoading.tsx`.
- **`SmartCaptureFAB`**: (Already existed but ensured clean usage).
- **`BottomNavBar`**: Refactored to use extracted sub-components.

#### `HomeScreen.tsx`
- **`Section`**: Created a reusable `Section` component (`components/Section.tsx`) for the collapsible sections (Dashboard, Tasks, Habits, etc.). This reduces code duplication and separates layout logic from content.
- **`ViewSwitcher`**: Extracted the view mode toggle (Today/Tomorrow/Week) into `components/ViewSwitcher.tsx`.

#### `BottomNavBar.tsx`
#### `App.tsx`
- **`AppLoading`**: Extracted the loading spinner into `components/AppLoading.tsx`.
- **`SmartCaptureFAB`**: (Already existed but ensured clean usage).
- **`BottomNavBar`**: Refactored to use extracted sub-components.

#### `HomeScreen.tsx`
- **`Section`**: Created a reusable `Section` component (`components/Section.tsx`) for the collapsible sections (Dashboard, Tasks, Habits, etc.). This reduces code duplication and separates layout logic from content.
- **`ViewSwitcher`**: Extracted the view mode toggle (Today/Tomorrow/Week) into `components/ViewSwitcher.tsx`.

#### `BottomNavBar.tsx`
- **`NavItem`**: Extracted the navigation button logic and styling into `components/NavItem.tsx`.
- **`CenterButton`**: Extracted the main "Add" button into `components/CenterButton.tsx`.

### Cloud Sync (Google Drive)
- **Google Auth Service**: Centralized Google Sign-In logic (`services/googleAuthService.ts`).
- **Drive Service**: Implemented file search, upload, and download (`services/googleDriveService.ts`).
- **Settings Integration**: Added "Cloud Sync" card to `SettingsScreen` with Upload/Download buttons.
- **State Management**: Added `lastSyncTime` and `googleDriveBackupId` to `AppSettings`.

### PWA & Security Enhancements
- **Password Manager Screen**: Created a dedicated screen for managing passwords (`screens/PasswordManagerScreen.tsx`).
- **Encrypted Backups**:
  - Updated `cryptoService.ts` with key derivation and encryption helpers.
  - Updated `dataService.ts` to support encrypted JSON export/import.
  - Added `PasswordPromptModal` for secure backup handling in `SettingsScreen`.
- **PWA Features**:
  - Enhanced `sw.js` for better offline caching and push notification handling.
  - Implemented `share_target` logic in `ItemCreationForm.tsx` to pre-fill data from other apps.
  - Added `subscribeToPush` to `notificationsService.ts`.
- **Calendar**: Verified `FullCalendarView` implementation (pending `react-big-calendar` installation).

### 2. Custom Hooks Extraction
We moved complex logic from `App.tsx` into custom hooks to separate concerns and make the main component cleaner.

- **`useGoogleCalendar`**: Encapsulated Google Calendar initialization, authentication, and event fetching logic.
- **`useThemeEffect`**: Moved the dynamic CSS variable application logic (colors, fonts, density) into a dedicated hook.
- Continue breaking down `services/dataService.ts` if it grows too large.
- Consider implementing a more robust state management solution if `AppContext` becomes a bottleneck.
- Add unit tests for the newly created hooks and components.
