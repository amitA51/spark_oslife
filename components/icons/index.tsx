/**
 * Icons Module Index
 * 
 * Re-exports all icons from categorized modules for convenient imports.
 * Import icons from this file for simplicity, or from specific modules for tree-shaking.
 */

// Types and utilities
export { stringToHash, getTagColor } from './types';
export type { IconProps } from './types';

// Navigation icons
export {
    FeedIcon,
    SearchIcon,
    SettingsIcon,
    HomeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    MenuIcon,
    MoreVerticalIcon,
    MoreHorizontalIcon,
} from './navigationIcons';

// Action icons
export {
    AddIcon,
    PlusIcon,
    MinusIcon,
    CloseIcon,
    XIcon,
    TrashIcon,
    EditIcon,
    CopyIcon,
    ShareIcon,
    SendIcon,
    RefreshIcon,
    DownloadIcon,
    UploadIcon,
} from './actionIcons';

// Content type icons
export {
    LightbulbIcon,
    ClipboardListIcon,
    BookOpenIcon,
    DumbbellIcon,
    LinkIcon,
    RoadmapIcon,
    BrainCircuitIcon,
    CalendarIcon,
    InboxIcon,
    TargetIcon,
    SparklesIcon,
} from './contentIcons';

// Status icons
export {
    CheckCircleIcon,
    CircleIcon,
    CheckCheckIcon,
    CheckSquareIcon,
    AlertOctagonIcon,
    StarIcon,
    FlameIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    BellIcon,
    LockIcon,
    WifiOffIcon,
} from './statusIcons';

// Media icons - all from one place
export {
    PlayIcon,
    PauseIcon,
    StopIcon,
    VolumeIcon,
    FileIcon,
    ImageIcon,
    VideoIcon,
    AudioFileIcon,
    PdfIcon,
    DocIcon,
    CameraIcon,
} from './mediaIcons';

// File icon utility - from separate file to avoid initialization issues
export { getFileIcon } from './fileIconUtil';
