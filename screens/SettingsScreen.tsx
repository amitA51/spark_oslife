
import React, { useState, useEffect, useContext, useRef } from 'react';
import type { AppSettings, Screen, ThemeSettings, CardStyle, AiPersonality, AddableType, AppFont, BorderRadius, SwipeAction } from '../types';
import { saveSettings } from '../services/settingsService';
import * as dataService from '../services/dataService';
import * as googleCalendarService from '../services/googleCalendarService';
import * as googleDriveService from '../services/googleDriveService';
import * as googleAuthService from '../services/googleAuthService';
import * as notifications from '../services/notificationsService';
import {
    DatabaseIcon, DownloadIcon, UploadIcon, WarningIcon,
    PaletteIcon, SparklesIcon, BrainCircuitIcon,
    SettingsIcon, CheckCircleIcon, LayoutDashboardIcon, TargetIcon,
    FeedIcon, AddIcon, EditIcon, UserIcon, DragHandleIcon, CloudIcon, RefreshIcon,
    ShieldCheckIcon, KeyIcon, ChevronLeftIcon, DumbbellIcon
} from '../components/icons';
import ExerciseLibraryManager from '../components/ExerciseLibraryManager';
import ToggleSwitch from '../components/ToggleSwitch';
import ManageSpacesModal from '../components/ManageSpacesModal';
import FileUploader from '../components/FileUploader';
import ImportWizard from '../components/ImportWizard';
import { AppContext } from '../state/AppContext';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import PasswordPromptModal from '../components/PasswordPromptModal';
import { defaultMentors } from '../services/mockData';

type Status = {
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => void;
} | null;

type SettingsSectionId = 'appearance' | 'ai' | 'integrations' | 'general' | 'data' | 'workout';

// --- Reusable Setting Components ---

const SettingsSection: React.FC<{ title: string, children: React.ReactNode, id: string }> = ({ title, children, id }) => (
    <div className="space-y-6 animate-screen-enter" id={id}>
        <h2 className="text-2xl font-bold themed-title pb-3 border-b border-[var(--border-primary)]">{title}</h2>
        <div className="space-y-6">{children}</div>
    </div>
);

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; danger?: boolean }> = ({ title, children, danger }) => (
    <div className={`themed-card p-5 sm:p-6 ${danger ? 'border-l-4 border-red-500/50 bg-red-900/10' : ''}`}>
        <h3 className={`text-lg font-bold mb-4 ${danger ? 'text-red-400' : 'text-[var(--dynamic-accent-highlight)] uppercase tracking-wider text-sm flex items-center gap-2'}`}>
            {title}
        </h3>
        <div className="space-y-5">
            {children}
        </div>
    </div>
);

const SettingsRow: React.FC<{ title: string; description: string; children: React.ReactNode; }> = ({ title, description, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--border-primary)] pt-4 first:border-t-0 first:pt-0">
        <div className="flex-1">
            <p className="font-bold text-[var(--text-primary)] text-base">{title}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed max-w-[90%]">{description}</p>
        </div>
        <div className="flex-shrink-0 flex items-center justify-end sm:ml-4">{children}</div>
    </div>
);

const SegmentedControl: React.FC<{
    options: { label: string, value: string, icon?: React.ReactNode }[];
    value: string | number;
    onChange: (value: any) => void;
}> = ({ options, value, onChange }) => (
    <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] w-full sm:w-auto overflow-x-auto">
        {options.map(opt => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-md flex items-center justify-center gap-1.5 font-bold transition-all whitespace-nowrap ${value.toString() === opt.value ? 'bg-[var(--dynamic-accent-start)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                    }`}
            >
                {opt.icon} {opt.label}
            </button>
        ))}
    </div>
);

const ThemePreviewCard: React.FC<{
    theme: ThemeSettings;
    isSelected: boolean;
    onClick: () => void;
}> = ({ theme, isSelected, onClick }) => {
    const cardStyleClass = `card-style-${theme.cardStyle}`;

    return (
        <button onClick={onClick} className="text-center group w-full">
            <div
                className={`relative w-full aspect-video rounded-xl transition-all duration-300 ring-2 ring-offset-2 ring-offset-[var(--bg-card)] overflow-hidden ${isSelected ? 'ring-[var(--dynamic-accent-start)] shadow-[0_0_15px_var(--dynamic-accent-glow)]' : 'ring-transparent'}`}
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <div className={`w-full h-full p-3 flex flex-col justify-end ${cardStyleClass}`}>
                    <div
                        className="themed-card w-full h-1/2 p-2"
                        style={{
                            '--dynamic-accent-start': theme.accentColor,
                            // @ts-ignore
                            '--bg-card': '#27272a'
                        } as React.CSSProperties}
                    >
                        <div className="w-3/4 h-2 rounded-full" style={{ background: theme.accentColor }}></div>
                    </div>
                </div>
            </div>
            <span className={`text-sm mt-2 font-bold transition-colors ${isSelected ? 'text-[var(--dynamic-accent-highlight)]' : 'text-[var(--text-secondary)] group-hover:text-white'}`}>{theme.name}</span>
        </button>
    );
};

const THEMES: Record<string, ThemeSettings> = {
    nebula: { name: 'Nebula', accentColor: '#8B5CF6', font: 'inter', cardStyle: 'glass', backgroundEffect: true, borderRadius: 'lg' },
    emerald: { name: 'Emerald', accentColor: '#10B981', font: 'inter', cardStyle: 'glass', backgroundEffect: true, borderRadius: 'lg' },
    gold: { name: 'Gold', accentColor: '#F59E0B', font: 'lato', cardStyle: 'flat', backgroundEffect: false, borderRadius: 'md' },
    oceanic: { name: 'Oceanic', accentColor: '#0EA5E9', font: 'inter', cardStyle: 'flat', backgroundEffect: false, borderRadius: 'lg' },
    crimson: { name: 'Crimson', accentColor: '#F43F5E', font: 'rubik', cardStyle: 'bordered', backgroundEffect: false, borderRadius: 'md' },
    midnight: { name: 'Midnight', accentColor: '#6366f1', font: 'inter', cardStyle: 'glass', backgroundEffect: true, borderRadius: 'xl' }
};

const settingsSections: { id: SettingsSectionId, label: string, icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'מראה', icon: <PaletteIcon className="w-5 h-5" /> },
    { id: 'ai', label: 'בינה', icon: <BrainCircuitIcon className="w-5 h-5" /> },
    { id: 'general', label: 'כללי', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'integrations', label: 'שילובים', icon: <SparklesIcon className="w-5 h-5" /> },
    { id: 'data', label: 'מידע', icon: <DatabaseIcon className="w-5 h-5" /> },
];

const inputStyles = "glass-input w-full rounded-xl p-3 focus:outline-none text-[var(--text-primary)] placeholder-gray-500 text-sm";

// For Add Menu Config
const ADD_ITEMS: { id: AddableType; label: string }[] = [
    { id: 'task', label: 'משימה' },
    { id: 'note', label: 'פתק' },
    { id: 'idea', label: 'רעיון' },
    { id: 'habit', label: 'הרגל' },
    { id: 'spark', label: 'ספארק' },
    { id: 'link', label: 'קישור' },
    { id: 'book', label: 'ספר' },
    { id: 'workout', label: 'אימון' },
    { id: 'goal', label: 'פרויקט' },
    { id: 'roadmap', label: 'מפת דרכים' },
    { id: 'journal', label: 'יומן' },
    { id: 'learning', label: 'למידה' },
    { id: 'ticker', label: 'מניה/מטבע' },
];

// Swipe Action Options
const SWIPE_ACTIONS: { label: string, value: SwipeAction }[] = [
    { label: 'השלמה', value: 'complete' },
    { label: 'דחייה', value: 'postpone' },
    { label: 'מחיקה', value: 'delete' },
    { label: 'כלום', value: 'none' },
];


const SettingsScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({ setActiveScreen }) => {
    const { state, dispatch } = useContext(AppContext);
    const { settings } = state;

    const sections: { id: SettingsSectionId; label: string; icon: React.ReactNode }[] = [
        { id: 'appearance', label: 'מראה', icon: <PaletteIcon className="w-5 h-5" /> },
        { id: 'general', label: 'כללי', icon: <SettingsIcon className="w-5 h-5" /> },
        { id: 'ai', label: 'AI ומוח', icon: <BrainCircuitIcon className="w-5 h-5" /> },
        { id: 'integrations', label: 'שילובים', icon: <CloudIcon className="w-5 h-5" /> },
        { id: 'data', label: 'נתונים וגיבוי', icon: <DatabaseIcon className="w-5 h-5" /> },
        { id: 'workout', label: 'אימון', icon: <DumbbellIcon className="w-5 h-5" /> },
    ];

    const [activeSection, setActiveSection] = useState<SettingsSectionId>('appearance');
    const [isManageSpacesOpen, setIsManageSpacesOpen] = useState(false);
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [statusMessage, setStatusMessage] = useState<Status>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordModalConfig, setPasswordModalConfig] = useState<{
        mode: 'export' | 'import';
        data?: string;
    }>({ mode: 'export' });

    // Check for deep link on mount
    useEffect(() => {
        const deepLink = sessionStorage.getItem('settings_deep_link');
        if (deepLink === 'add-layout') {
            setActiveSection('general');
            sessionStorage.removeItem('settings_deep_link');
        }
    }, []);

    const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);
        dispatch({ type: 'SET_SETTINGS', payload: newSettings });
    };

    const handleNotificationToggle = async (enabled: boolean) => {
        handleSettingChange('notificationsEnabled', enabled);
        if (enabled && notificationPermission === 'default') setNotificationPermission(await notifications.requestPermission());
    };



    const handleConnectGoogle = async () => {
        try {
            googleAuthService.signIn();
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            setStatusMessage({ type: 'error', text: 'שגיאה בהתחברות ל-Google.', id: Date.now() });
        }
    };

    const handleDisconnectGoogle = async () => {
        try {
            await googleAuthService.signOut();
            setStatusMessage({ type: 'success', text: 'התנתקת מ-Google בהצלחה.', id: Date.now() });
        } catch (error) {
            console.error("Google Sign-Out Error:", error);
            setStatusMessage({ type: 'error', text: 'שגיאה בהתנתקות.', id: Date.now() });
        }
    };

    const handleSync = async (direction: 'upload' | 'download') => {
        if (state.googleAuthState !== 'signedIn') {
            setStatusMessage({ type: 'error', text: 'יש להתחבר ל-Google תחילה.', id: Date.now() });
            return;
        }

        setIsSyncing(true);
        try {
            let fileId = settings.googleDriveBackupId;

            if (!fileId) {
                const existingFileId = await googleDriveService.findBackupFile();
                if (existingFileId) {
                    fileId = existingFileId;
                    handleSettingChange('googleDriveBackupId', fileId);
                }
            }

            if (direction === 'upload') {
                const json = await dataService.exportAllData();
                const newFileId = await googleDriveService.uploadBackup(json, fileId);
                if (!fileId) handleSettingChange('googleDriveBackupId', newFileId);

                const now = new Date().toISOString();
                handleSettingChange('lastSyncTime', now);
                setStatusMessage({ type: 'success', text: 'הגיבוי הועלה בהצלחה ל-Drive.', id: Date.now() });
            } else {
                if (!fileId) {
                    setStatusMessage({ type: 'error', text: 'לא נמצא קובץ גיבוי ב-Drive.', id: Date.now() });
                    return;
                }
                const data = await googleDriveService.downloadBackup(fileId);
                const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

                await dataService.importAllData(jsonString);
                window.location.reload();
            }
        } catch (error) {
            console.error("Sync error:", error);
            setStatusMessage({ type: 'error', text: 'שגיאה בסנכרון הנתונים.', id: Date.now() });
        } finally {
            setIsSyncing(false);
        }
    };

    const downloadBackupFile = (json: string) => {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spark_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setStatusMessage({ type: 'success', text: 'הייצוא הושלם בהצלחה.', id: Date.now() });
    };

    const handleExport = async () => {
        if (confirm("האם ברצונך להצפין את קובץ הגיבוי עם סיסמה?")) {
            setPasswordModalConfig({ mode: 'export' });
            setIsPasswordModalOpen(true);
        } else {
            try {
                const json = await dataService.exportAllData();
                downloadBackupFile(json);
            } catch (e) {
                console.error(e);
                setStatusMessage({ type: 'error', text: 'שגיאה בייצוא הנתונים.', id: Date.now() });
            }
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const json = ev.target?.result as string;
            try {
                await dataService.importAllData(json);
                window.location.reload();
            } catch (error: any) {
                if (error.message === "PASSWORD_REQUIRED") {
                    setPasswordModalConfig({ mode: 'import', data: json });
                    setIsPasswordModalOpen(true);
                } else if (error.message === "INVALID_PASSWORD") {
                    setStatusMessage({ type: 'error', text: 'סיסמה שגויה.', id: Date.now() });
                } else {
                    console.error(error);
                    setStatusMessage({ type: 'error', text: 'קובץ לא תקין או שגיאה בייבוא.', id: Date.now() });
                }
            }
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handlePasswordSubmit = async (password: string) => {
        setIsPasswordModalOpen(false);
        if (passwordModalConfig.mode === 'export') {
            try {
                const json = await dataService.exportAllData(password);
                downloadBackupFile(json);
            } catch (e) {
                console.error(e);
                setStatusMessage({ type: 'error', text: 'שגיאה בהצפנת הנתונים.', id: Date.now() });
            }
        } else if (passwordModalConfig.mode === 'import' && passwordModalConfig.data) {
            try {
                await dataService.importAllData(passwordModalConfig.data, password);
                window.location.reload();
            } catch (e: any) {
                if (e.message === "INVALID_PASSWORD") {
                    setStatusMessage({ type: 'error', text: 'סיסמה שגויה.', id: Date.now() });
                } else {
                    setStatusMessage({ type: 'error', text: 'שגיאה בשחזור הנתונים.', id: Date.now() });
                }
            }
        }
    };

    const handleWipeData = async () => {
        if (confirm("האם אתה בטוח? פעולה זו תמחק את כל הנתונים וההגדרות לצמיתות.")) {
            await dataService.wipeAllData();
            window.location.reload();
        }
    };

    // Profile Component
    const ProfileCard = () => (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 mb-6 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--dynamic-accent-start)]/5"></div>
            <div className="relative z-10 w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl border-2 border-[var(--dynamic-accent-start)] shadow-lg">
                <input
                    type="text"
                    value={settings.userEmoji || '👋'}
                    onChange={e => handleSettingChange('userEmoji', e.target.value)}
                    className="bg-transparent w-full text-center focus:outline-none"
                    maxLength={2}
                />
            </div>
            <div className="relative z-10 flex-1">
                <label className="text-xs font-bold text-[var(--dynamic-accent-highlight)] uppercase tracking-wide">שם משתמש</label>
                <input
                    type="text"
                    value={settings.userName || ''}
                    onChange={e => handleSettingChange('userName', e.target.value)}
                    placeholder="איך לקרוא לך?"
                    className="bg-transparent text-xl font-bold text-[var(--text-primary)] placeholder-gray-500 focus:outline-none w-full border-b border-transparent focus:border-[var(--dynamic-accent-start)] transition-colors pb-1"
                />
            </div>
        </div>
    );


    return (
        <>
            <div className="pt-4 space-y-8 pb-24">
                <header className="px-4 md:px-0">
                    <h1 className="hero-title">{settings.screenLabels?.settings || 'הגדרות'}</h1>
                </header>

                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    {/* Sidebar Navigation (Desktop) */}
                    <aside className="hidden md:block md:w-1/4">
                        <nav className="flex flex-col gap-2 sticky top-24">
                            {sections.map(section => (
                                <button key={section.id} onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl w-full text-right transition-all shrink-0 font-medium ${activeSection === section.id ? 'bg-[var(--dynamic-accent-start)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    {section.icon} {section.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Horizontal Scroll Navigation (Mobile) */}
                    <div className="md:hidden sticky top-16 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-xl py-2 -mx-4 px-4 border-b border-[var(--border-primary)]">
                        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
                            {sections.map(section => (
                                <button key={section.id} onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium text-sm ${activeSection === section.id ? 'bg-[var(--dynamic-accent-start)] text-white shadow-md' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'}`}
                                >
                                    {section.icon} {section.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <main className="flex-1 min-w-0 space-y-6 px-4 md:px-0">
                        {/* Common Profile Card (Always show on top of General or Appearance for quick access) */}
                        {activeSection === 'general' && <ProfileCard />}

                        {activeSection === 'appearance' && (
                            <SettingsSection title="מראה ותצוגה" id="appearance">
                                <SettingsCard title="ערכות נושא">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {Object.entries(THEMES).map(([key, theme]) => <ThemePreviewCard key={key} theme={theme} isSelected={settings.themeSettings.name === theme.name && settings.themeSettings.name !== 'Custom'} onClick={() => handleSettingChange('themeSettings', theme)} />)}
                                        <div className="text-center group w-full">
                                            <button onClick={() => handleSettingChange('themeSettings', { ...settings.themeSettings, name: 'Custom' })} className={`relative w-full aspect-video rounded-xl flex items-center justify-center transition-all duration-300 ring-2 ring-offset-2 ring-offset-[var(--bg-card)] bg-[var(--bg-secondary)] ${settings.themeSettings.name === 'Custom' ? 'ring-[var(--dynamic-accent-start)] shadow-[0_0_15px_var(--dynamic-accent-glow)]' : 'ring-transparent'}`}>
                                                <PaletteIcon className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-white" />
                                            </button>
                                            <span className={`text-sm mt-2 font-bold transition-colors ${settings.themeSettings.name === 'Custom' ? 'text-[var(--dynamic-accent-highlight)]' : 'text-[var(--text-secondary)] group-hover:text-white'}`}>מותאם אישית</span>
                                        </div>
                                    </div>
                                </SettingsCard>

                                <SettingsCard title="ממשק ועיצוב">
                                    <SettingsRow title="עיצוב פינות (Radius)" description="בחר את סגנון הפינות של כרטיסים וכפתורים.">
                                        <SegmentedControl
                                            value={settings.themeSettings.borderRadius || 'lg'}
                                            onChange={v => handleSettingChange('themeSettings', { ...settings.themeSettings, borderRadius: v as BorderRadius })}
                                            options={[
                                                { label: 'חד', value: 'none' },
                                                { label: 'עדין', value: 'sm' },
                                                { label: 'רגיל', value: 'md' },
                                                { label: 'עגול', value: 'lg' },
                                                { label: 'בועה', value: 'xl' }
                                            ]}
                                        />
                                    </SettingsRow>
                                    <SettingsRow title="סגנון כרטיסים" description="שנה את מראה הרכיבים והכרטיסיות.">
                                        <SegmentedControl
                                            value={settings.themeSettings.cardStyle}
                                            onChange={v => handleSettingChange('themeSettings', { ...settings.themeSettings, cardStyle: v as CardStyle })}
                                            options={[{ label: 'זכוכית', value: 'glass' }, { label: 'שטוח', value: 'flat' }, { label: 'גבול', value: 'bordered' }]}
                                        />
                                    </SettingsRow>
                                    {settings.themeSettings.name === 'Custom' && (
                                        <SettingsRow title="צבע הדגשה" description="בחר את צבע המבטא הראשי.">
                                            <div className="relative w-10 h-10 rounded-full border-2 border-[var(--border-primary)] shadow-inner overflow-hidden">
                                                <div className="absolute inset-0" style={{ backgroundColor: settings.themeSettings.accentColor }}></div>
                                                <input type="color" value={settings.themeSettings.accentColor} onChange={e => handleSettingChange('themeSettings', { ...settings.themeSettings, accentColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </SettingsRow>
                                    )}
                                </SettingsCard>



                                <SettingsCard title="התאמה אישית מתקדמת">
                                    <SettingsRow title="תמונת רקע" description="העלה תמונה שתופיע ברקע האפליקציה.">
                                        <div className="w-full max-w-xs">
                                            <FileUploader
                                                onFileSelect={(file) => handleSettingChange('themeSettings', { ...settings.themeSettings, backgroundImage: file.url })}
                                                accept="image/*"
                                                label={settings.themeSettings.backgroundImage ? "החלף תמונה" : "העלה תמונה"}
                                            />
                                            {settings.themeSettings.backgroundImage && (
                                                <button
                                                    onClick={() => handleSettingChange('themeSettings', { ...settings.themeSettings, backgroundImage: undefined })}
                                                    className="text-red-400 text-xs mt-2 hover:underline w-full text-center"
                                                >
                                                    הסר תמונת רקע
                                                </button>
                                            )}
                                        </div>
                                    </SettingsRow>
                                    <SettingsRow title="משקל גופן" description="בחר את עובי הטקסט הראשי.">
                                        <SegmentedControl
                                            value={settings.themeSettings.fontWeight || 'normal'}
                                            onChange={v => handleSettingChange('themeSettings', { ...settings.themeSettings, fontWeight: v })}
                                            options={[
                                                { label: 'רגיל', value: 'normal' },
                                                { label: 'בינוני', value: 'medium' },
                                                { label: 'מודגש', value: 'bold' }
                                            ]}
                                        />
                                    </SettingsRow>
                                    <SettingsRow title="קנה מידה (Zoom)" description="הגדל או הקטן את כל ממשק המשתמש.">
                                        <div className="flex items-center gap-3 w-full max-w-[200px]">
                                            <span className="text-xs">80%</span>
                                            <input
                                                type="range"
                                                min="0.8"
                                                max="1.2"
                                                step="0.05"
                                                value={settings.themeSettings.uiScale || 1}
                                                onChange={e => handleSettingChange('themeSettings', { ...settings.themeSettings, uiScale: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--dynamic-accent-start)]"
                                            />
                                            <span className="text-xs">120%</span>
                                        </div>
                                    </SettingsRow>
                                </SettingsCard>

                                <SettingsCard title="טיפוגרפיה ורקע">
                                    <SettingsRow title="סוג גופן" description="בחר את הפונט הראשי של האפליקציה.">
                                        <select
                                            value={settings.themeSettings.font}
                                            onChange={(e) => handleSettingChange('themeSettings', { ...settings.themeSettings, font: e.target.value as AppFont })}
                                            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg p-2 focus:outline-none focus:border-[var(--dynamic-accent-start)]"
                                        >
                                            <option value="inter">Inter (נקי)</option>
                                            <option value="lato">Lato (עגול)</option>
                                            <option value="rubik">Rubik (מודרני)</option>
                                            <option value="heebo">Heebo (גיאומטרי)</option>
                                            <option value="alef">Alef (קלאסי)</option>
                                            <option value="poppins">Poppins (ידידותי)</option>
                                        </select>
                                    </SettingsRow>
                                    <SettingsRow title="גודל גופן" description="התאם את קנה המידה של כל הטקסט.">
                                        <div className="flex items-center gap-3 w-full max-w-[150px]">
                                            <span className="text-xs">A</span>
                                            <input type="range" min="0.85" max="1.2" step="0.05" value={settings.fontSizeScale} onChange={e => handleSettingChange('fontSizeScale', parseFloat(e.target.value))} className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--dynamic-accent-start)]" />
                                            <span className="text-lg">A</span>
                                        </div>
                                    </SettingsRow>
                                    <SettingsRow title="אפקט רקע דינמי" description="הצג אנימציית חלקיקים עדינה ברקע.">
                                        <ToggleSwitch
                                            checked={settings.themeSettings.backgroundEffect}
                                            onChange={v => handleSettingChange('themeSettings', { ...settings.themeSettings, backgroundEffect: v })}
                                        />
                                    </SettingsRow>
                                </SettingsCard>
                            </SettingsSection>
                        )}

                        {activeSection === 'ai' && (
                            <SettingsSection title="בינה מלאכותית" id="ai">
                                <SettingsCard title="מודל ואישיות">
                                    <SettingsRow title="מודל AI" description="בחר את המודל שישמש לסיכומים ויצירת תוכן.">
                                        <SegmentedControl
                                            value={settings.aiModel}
                                            onChange={v => handleSettingChange('aiModel', v)}
                                            options={[{ label: 'Flash (מהיר)', value: 'gemini-2.5-flash' }, { label: 'Pro (חכם)', value: 'gemini-2.5-pro' }]}
                                        />
                                    </SettingsRow>
                                    <SettingsRow title="אישיות העוזר" description="כיצד תרצה שה-AI ידבר אליך?">
                                        <SegmentedControl
                                            value={settings.aiPersonality}
                                            onChange={v => handleSettingChange('aiPersonality', v as AiPersonality)}
                                            options={[{ label: 'מעודד', value: 'encouraging' }, { label: 'תמציתי', value: 'concise' }, { label: 'רשמי', value: 'formal' }]}
                                        />
                                    </SettingsRow>
                                </SettingsCard>
                                <SettingsCard title="הגדרות פיד חכם">
                                    <SettingsRow title="ייצור תוכן אוטומטי" description="האם לאפשר ל-AI לייצר 'ספארקים' יומיים?">
                                        <ToggleSwitch checked={settings.aiFeedSettings.isEnabled} onChange={v => handleSettingChange('aiFeedSettings', { ...settings.aiFeedSettings, isEnabled: v })} />
                                    </SettingsRow>
                                    {settings.aiFeedSettings.isEnabled && (
                                        <>
                                            <div className="mt-4">
                                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">נושאי עניין (מופרדים בפסיקים)</label>
                                                <input
                                                    type="text"
                                                    value={settings.aiFeedSettings.topics.join(', ')}
                                                    onChange={e => handleSettingChange('aiFeedSettings', { ...settings.aiFeedSettings, topics: e.target.value.split(',').map(t => t.trim()) })}
                                                    className={inputStyles}
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">הנחיה מותאמת אישית (Prompt)</label>
                                                <textarea
                                                    value={settings.aiFeedSettings.customPrompt}
                                                    onChange={e => handleSettingChange('aiFeedSettings', { ...settings.aiFeedSettings, customPrompt: e.target.value })}
                                                    className={inputStyles}
                                                    rows={3}
                                                    placeholder="הנחיה מיוחדת ל-AI..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </SettingsCard>

                                <SettingsCard title="מנטורים פעילים">
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">בחר מאילו מנטורים לקבל ציטוטים בפיד היומי.</p>
                                    {defaultMentors.map(mentor => (
                                        <SettingsRow
                                            key={mentor.id}
                                            title={mentor.name}
                                            description={mentor.description}
                                        >
                                            <ToggleSwitch
                                                checked={settings.enabledMentorIds.includes(mentor.id)}
                                                onChange={(checked) => {
                                                    let newIds = [...settings.enabledMentorIds];
                                                    if (checked) {
                                                        if (!newIds.includes(mentor.id)) newIds.push(mentor.id);
                                                    } else {
                                                        newIds = newIds.filter(id => id !== mentor.id);
                                                    }
                                                    handleSettingChange('enabledMentorIds', newIds);
                                                }}
                                            />
                                        </SettingsRow>
                                    ))}
                                </SettingsCard>
                            </SettingsSection>
                        )}

                        {activeSection === 'general' && (
                            <SettingsSection title="כללי וטיימר" id="general">
                                <SettingsCard title="חווית משתמש">
                                    <SettingsRow title="אפקטים קוליים" description="הפעל צלילי משוב בעת לחיצות ואירועים.">
                                        <ToggleSwitch checked={settings.enableSounds} onChange={v => handleSettingChange('enableSounds', v)} />
                                    </SettingsRow>
                                    <SettingsRow title="משוב רטט (Haptics)" description="רטט עדין בפעולות ממשק.">
                                        <ToggleSwitch checked={settings.hapticFeedback} onChange={v => handleSettingChange('hapticFeedback', v)} />
                                    </SettingsRow>
                                    <SettingsRow title="צפיפות תצוגה" description="בחר את מרווח הרכיבים במסך.">
                                        <SegmentedControl value={settings.uiDensity} onChange={v => handleSettingChange('uiDensity', v)} options={[{ label: 'רגיל', value: 'comfortable' }, { label: 'דחוס', value: 'compact' }]} />
                                    </SettingsRow>
                                </SettingsCard>

                                <SettingsCard title="פעולות החלקה (Swipe)">
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">הגדר מה קורה כאשר אתה מחליק משימה ימינה או שמאלה.</p>
                                    <SettingsRow title="החלקה ימינה" description="פעולה לביצוע בהחלקה ימינה.">
                                        <select
                                            value={settings.swipeRightAction}
                                            onChange={(e) => handleSettingChange('swipeRightAction', e.target.value as SwipeAction)}
                                            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg p-2 focus:outline-none focus:border-[var(--dynamic-accent-start)]"
                                        >
                                            {SWIPE_ACTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </SettingsRow>
                                    <SettingsRow title="החלקה שמאלה" description="פעולה לביצוע בהחלקה שמאלה.">
                                        <select
                                            value={settings.swipeLeftAction}
                                            onChange={(e) => handleSettingChange('swipeLeftAction', e.target.value as SwipeAction)}
                                            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-lg p-2 focus:outline-none focus:border-[var(--dynamic-accent-start)]"
                                        >
                                            {SWIPE_ACTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </SettingsRow>
                                </SettingsCard>

                                <SettingsCard title="מסך הבית (היום)">
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">בחר אילו אזורים יוצגו במסך הבית.</p>
                                    {settings.homeScreenLayout.map(component => (
                                        <SettingsRow
                                            key={component.id}
                                            title={settings.sectionLabels[component.id] || component.id}
                                            description={component.isVisible ? 'מוצג' : 'מוסתר'}
                                        >
                                            <ToggleSwitch
                                                checked={component.isVisible}
                                                onChange={(checked) => {
                                                    const newLayout = settings.homeScreenLayout.map(c =>
                                                        c.id === component.id ? { ...c, isVisible: checked } : c
                                                    );
                                                    handleSettingChange('homeScreenLayout', newLayout);
                                                }}
                                            />
                                        </SettingsRow>
                                    ))}
                                </SettingsCard>

                                <SettingsCard title="תפריט הוספה">
                                    <p className="text-sm text-[var(--text-secondary)] mb-3">בחר אילו פריטים יופיעו במסך ההוספה.</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {ADD_ITEMS.map(item => {
                                            const isActive = settings.addScreenLayout.includes(item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        let newLayout = [...settings.addScreenLayout];
                                                        if (isActive) {
                                                            newLayout = newLayout.filter(t => t !== item.id);
                                                        } else {
                                                            newLayout.push(item.id);
                                                        }
                                                        handleSettingChange('addScreenLayout', newLayout);
                                                    }}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isActive ? 'bg-[var(--dynamic-accent-start)]/10 border-[var(--dynamic-accent-start)] text-white' : 'bg-[var(--bg-secondary)] border-transparent text-[var(--text-secondary)] hover:bg-white/5'}`}
                                                >
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                    {isActive && <CheckCircleIcon className="w-4 h-4 text-[var(--dynamic-accent-start)]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </SettingsCard>

                                <SettingsCard title="טיימר פוקוס">
                                    <SettingsRow title="זמן עבודה (דקות)" description="משך סשן עבודה רגיל.">
                                        <input type="number" value={settings.pomodoroSettings.workDuration} onChange={e => handleSettingChange('pomodoroSettings', { ...settings.pomodoroSettings, workDuration: parseInt(e.target.value) })} className="w-20 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-2 text-center text-white focus:border-[var(--dynamic-accent-start)] outline-none" />
                                    </SettingsRow>
                                    <SettingsRow title="הפסקה קצרה (דקות)" description="משך המנוחה בין סשנים.">
                                        <input type="number" value={settings.pomodoroSettings.shortBreak} onChange={e => handleSettingChange('pomodoroSettings', { ...settings.pomodoroSettings, shortBreak: parseInt(e.target.value) })} className="w-20 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-2 text-center text-white focus:border-[var(--dynamic-accent-start)] outline-none" />
                                    </SettingsRow>
                                    <SettingsRow title="הפעלה אוטומטית" description="התחל את הסשן הבא באופן אוטומטי.">
                                        <ToggleSwitch checked={settings.intervalTimerSettings.autoStartNext} onChange={v => handleSettingChange('intervalTimerSettings', { ...settings.intervalTimerSettings, autoStartNext: v })} />
                                    </SettingsRow>
                                </SettingsCard>
                            </SettingsSection>
                        )}

                        {activeSection === 'integrations' && (
                            <SettingsSection title="שילובים והתראות" id="integrations">
                                <SettingsCard title="שילובים">
                                    <SettingsRow title="חשבון Google" description={state.googleAuthState === 'signedIn' ? 'מחובר (Calendar & Drive)' : 'התחבר כדי לאפשר סנכרון ויומן'}>
                                        {state.googleAuthState === 'signedIn' ? (
                                            <button onClick={handleDisconnectGoogle} className="bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">התנתק</button>
                                        ) : (
                                            <button onClick={handleConnectGoogle} disabled={state.googleAuthState === 'loading'} className="bg-[var(--dynamic-accent-start)] text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:brightness-110 shadow-lg shadow-[var(--dynamic-accent-glow)] transition-all">
                                                {state.googleAuthState === 'loading' ? 'טוען...' : 'התחבר ל-Google'}
                                            </button>
                                        )}
                                    </SettingsRow>
                                </SettingsCard>

                                <SettingsCard title="סנכרון ענן (Google Drive)">
                                    <p className="text-sm text-[var(--text-secondary)] mb-4">סנכרן את הנתונים שלך ל-Google Drive כדי לגשת אליהם ממכשירים אחרים.</p>
                                    {state.googleAuthState === 'signedIn' ? (
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleSync('upload')}
                                                    disabled={isSyncing}
                                                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] text-[var(--text-primary)] font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSyncing ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <CloudIcon className="w-5 h-5" />}
                                                    גיבוי לענן
                                                </button>
                                                <button
                                                    onClick={() => handleSync('download')}
                                                    disabled={isSyncing}
                                                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] text-[var(--text-primary)] font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSyncing ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                                                    שחזור מענן
                                                </button>
                                            </div>
                                            {settings.lastSyncTime && (
                                                <p className="text-xs text-center text-[var(--text-secondary)]">
                                                    סנכרון אחרון: {new Date(settings.lastSyncTime).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] border-dashed">
                                            <p className="text-sm text-[var(--text-secondary)]">יש להתחבר לחשבון Google כדי להשתמש בסנכרון ענן.</p>
                                        </div>
                                    )}
                                </SettingsCard>
                                <SettingsCard title="התראות">
                                    <SettingsRow title="אפשר התראות באפליקציה" description="קבל התראות ועדכונים מהאפליקציה."><ToggleSwitch checked={settings.notificationsEnabled} onChange={handleNotificationToggle} /></SettingsRow>

                                    {settings.notificationsEnabled && (
                                        <div className="pl-4 border-r-2 border-[var(--border-primary)] space-y-4 mt-4">
                                            <div className="flex justify-between items-center bg-[var(--bg-secondary)] p-3 rounded-lg">
                                                <p className="text-sm text-[var(--text-secondary)]">סטטוס הרשאה מערכת:</p>
                                                <span className={`font-bold text-xs px-2 py-1 rounded border ${notificationPermission === 'granted' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-[var(--text-secondary)] border-[var(--border-primary)]'}`}>
                                                    {notificationPermission === 'granted' ? 'פעיל' : 'חסום/ברירת מחדל'}
                                                </span>
                                            </div>
                                            <SettingsRow title="תזכורות למשימות" description="קבל התראה לפני שעת היעד."><ToggleSwitch checked={settings.taskRemindersEnabled} onChange={(val) => handleSettingChange('taskRemindersEnabled', val)} /></SettingsRow>
                                            {settings.taskRemindersEnabled && <SettingsRow title="זמן לפני התראה" description="כמה זמן לפני לקבל את התזכורת."><SegmentedControl value={settings.taskReminderTime} onChange={(val) => handleSettingChange('taskReminderTime', val)} options={[{ label: '5 דק׳', value: '5' }, { label: '15 דק׳', value: '15' }, { label: '30 דק׳', value: '30' }, { label: 'שעה', value: '60' }]} /></SettingsRow>}
                                            <SettingsRow title="תזכורות להרגלים" description="קבל התראות על הרגלים שלא הושלמו."><ToggleSwitch checked={settings.enableHabitReminders} onChange={(val) => handleSettingChange('enableHabitReminders', val)} /></SettingsRow>
                                        </div>
                                    )}
                                </SettingsCard>
                            </SettingsSection>
                        )}

                        {activeSection === 'data' && (
                            <SettingsSection title="ניהול נתונים" id="data">
                                <SettingsCard title="ארגון">
                                    <SettingsRow title="ארגון מרחבים ופידים" description="נהל את מרחבי התוכן האישיים ומרחבי הפידים שלך."><button onClick={() => setIsManageSpacesOpen(true)} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] text-[var(--text-primary)] hover:text-[var(--dynamic-accent-highlight)] font-bold py-2 px-4 rounded-xl transition-colors text-sm">ניהול מרחבים</button></SettingsRow>
                                </SettingsCard>
                                <SettingsCard title="אבטחה ופרטיות">
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setActiveScreen('passwords')}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg)] transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                                    <KeyIcon className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[var(--text-primary)] font-medium block">מנהל סיסמאות</span>
                                                    <span className="text-xs text-[var(--text-secondary)]">נהל את הסיסמאות שלך בצורה מאובטחת</span>
                                                </div>
                                            </div>
                                            <ChevronLeftIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                                        </button>
                                    </div>
                                </SettingsCard>

                                <SettingsCard title="גיבוי וסנכרון">
                                    <SettingsRow title="ייצוא נתונים" description="שמור קובץ גיבוי של כל הנתונים.">
                                        <button onClick={handleExport} className="flex items-center gap-2 text-[var(--dynamic-accent-highlight)] hover:underline"><DownloadIcon className="w-4 h-4" /> ייצא לקובץ</button>
                                    </SettingsRow>
                                    <SettingsRow title="ייבוא נתונים" description="שחזר נתונים מקובץ גיבוי (יחליף את הנתונים הקיימים).">
                                        <label className="flex items-center gap-2 text-[var(--dynamic-accent-highlight)] hover:underline cursor-pointer">
                                            <UploadIcon className="w-4 h-4" /> ייבא מקובץ
                                            <input type="file" accept=".json" onChange={handleImport} className="hidden" ref={fileInputRef} />
                                        </label>
                                    </SettingsRow>
                                    <SettingsRow title="ייבוא מאפליקציות אחרות" description="ייבא משימות ופתקים מ-Notion, Obsidian, Todoist ועוד.">
                                        <button
                                            onClick={() => setIsImportWizardOpen(true)}
                                            className="flex items-center gap-2 text-[var(--dynamic-accent-highlight)] hover:underline"
                                        >
                                            <UploadIcon className="w-4 h-4" /> ייבוא מתקדם
                                        </button>
                                    </SettingsRow>
                                    <SettingsRow title="איפוס נתונים" description="מחק את כל הנתונים וההגדרות מהמכשיר הזה.">
                                        <button onClick={handleWipeData} className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"><WarningIcon className="w-4 h-4" /> מחק הכל</button>
                                    </SettingsRow>
                                </SettingsCard>
                            </SettingsSection>
                        )}

                        {activeSection === 'workout' && (
                            <SettingsSection title="הגדרות אימון" id="workout">
                                <SettingsCard title="ספריית תרגילים אישית">
                                    <ExerciseLibraryManager />
                                </SettingsCard>
                            </SettingsSection>
                        )}
                    </main>
                </div>
            </div >

            {isManageSpacesOpen && <ManageSpacesModal onClose={() => setIsManageSpacesOpen(false)} />
            }
            {isImportWizardOpen && (
                <ImportWizard
                    isOpen={isImportWizardOpen}
                    onClose={() => setIsImportWizardOpen(false)}
                    onImport={async (items) => {
                        for (const item of items) {
                            await dataService.addPersonalItem(item);
                        }
                        setStatusMessage({ type: 'success', text: `${items.length} פריטים יובאו בהצלחה!`, id: Date.now() });
                    }}
                />
            )}
            <PasswordPromptModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
                title={passwordModalConfig.mode === 'export' ? 'הצפנת גיבוי' : 'שחזור גיבוי מוצפן'}
                description={passwordModalConfig.mode === 'export' ? 'הזן סיסמה להצפנת קובץ הגיבוי. תצטרך סיסמה זו כדי לשחזר את הנתונים.' : 'קובץ זה מוצפן. הזן את הסיסמה כדי לשחזר את הנתונים.'}
                isConfirm={passwordModalConfig.mode === 'export'}
            />
            {statusMessage && <StatusMessage key={statusMessage.id} type={statusMessage.type} message={statusMessage.text} onDismiss={() => setStatusMessage(null)} onUndo={statusMessage.onUndo} />}
        </>
    );
};

export default SettingsScreen;
