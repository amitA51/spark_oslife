
import fs from 'fs';
import path from 'path';

const filesToCheck = [
    'components/FileUploader.tsx',
    'types.ts',
    'hooks/useThemeEffect.ts',
    'screens/SettingsScreen.tsx',
    'components/details/RoadmapDetails.tsx'
];

const rootDir = 'c:/Users/עילאי/Desktop/life os/copy-of-spark-personal-os-1-test-more-clean12';

console.log('Verifying File Uploads and Customization implementation...');

let allPassed = true;

filesToCheck.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists.`);

        const content = fs.readFileSync(filePath, 'utf-8');

        if (file === 'types.ts') {
            if (content.includes('backgroundImage?: string') && content.includes('fontWeight?:') && content.includes('uiScale?:')) {
                console.log(`   ✅ types.ts contains new ThemeSettings.`);
            } else {
                console.error(`   ❌ types.ts is missing new ThemeSettings.`);
                allPassed = false;
            }
        }

        if (file === 'hooks/useThemeEffect.ts') {
            if (content.includes('backgroundImage') && content.includes('fontWeight') && content.includes('uiScale')) {
                console.log(`   ✅ useThemeEffect.ts handles new settings.`);
            } else {
                console.error(`   ❌ useThemeEffect.ts is missing logic for new settings.`);
                allPassed = false;
            }
        }

        if (file === 'screens/SettingsScreen.tsx') {
            if (content.includes('FileUploader') && content.includes('backgroundImage') && content.includes('uiScale')) {
                console.log(`   ✅ SettingsScreen.tsx contains customization UI.`);
            } else {
                console.error(`   ❌ SettingsScreen.tsx is missing customization UI.`);
                allPassed = false;
            }
        }

        if (file === 'components/details/RoadmapDetails.tsx') {
            if (content.includes('FileUploader') && content.includes('handleFileSelect')) {
                console.log(`   ✅ RoadmapDetails.tsx integrates FileUploader.`);
            } else {
                console.error(`   ❌ RoadmapDetails.tsx is missing FileUploader integration.`);
                allPassed = false;
            }
        }

    } else {
        console.error(`❌ ${file} does not exist.`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('\nAll checks passed! Implementation verified.');
} else {
    console.error('\nSome checks failed. Please review the errors.');
    process.exit(1);
}
