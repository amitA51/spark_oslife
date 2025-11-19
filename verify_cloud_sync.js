
import fs from 'fs';
import path from 'path';

const filesToCheck = [
    'services/googleAuthService.ts',
    'services/googleDriveService.ts',
    'services/googleCalendarService.ts',
    'screens/SettingsScreen.tsx',
    'components/icons.tsx',
    'types.ts'
];

const rootDir = 'c:/Users/עילאי/Desktop/life os/copy-of-spark-personal-os-1-test-more-clean12';

console.log('Verifying Cloud Sync implementation...');

let allPassed = true;

filesToCheck.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists.`);

        const content = fs.readFileSync(filePath, 'utf-8');

        if (file === 'screens/SettingsScreen.tsx') {
            if (content.includes('googleDriveService') && content.includes('handleSync') && content.includes('CloudIcon')) {
                console.log(`   ✅ SettingsScreen.tsx contains expected Cloud Sync logic.`);
            } else {
                console.error(`   ❌ SettingsScreen.tsx is missing expected Cloud Sync logic.`);
                allPassed = false;
            }
        }

        if (file === 'components/icons.tsx') {
            if (content.includes('CloudIcon')) {
                console.log(`   ✅ icons.tsx contains CloudIcon.`);
            } else {
                console.error(`   ❌ icons.tsx is missing CloudIcon.`);
                allPassed = false;
            }
        }

    } else {
        console.error(`❌ ${file} does not exist.`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('\nAll checks passed! Cloud Sync implementation verified.');
} else {
    console.error('\nSome checks failed. Please review the errors.');
    process.exit(1);
}
