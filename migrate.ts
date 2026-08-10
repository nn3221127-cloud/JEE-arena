import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const configFile = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configFile)) {
    console.error('firebase-applet-config.json not found!');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  const app = initializeApp(config);
  const firestoreDb = getFirestore(app, config.firestoreDatabaseId);
  const docRef = doc(firestoreDb, 'app_data', 'state');

  // Check if Firestore already has data
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log('Firestore document app_data/state already exists. Current keys:', Object.keys(snap.data() || {}));
      console.log('Migration check complete.');
      process.exit(0);
    }
  } catch (err) {
    console.log('Error checking Firestore doc:', err);
  }

  console.log('Firestore document app_data/state does NOT exist or could not be read. Reading local data...');

  const dbFile = path.join(process.cwd(), 'data', 'db.json');
  let dataToUpload: any = null;

  if (fs.existsSync(dbFile)) {
    try {
      const content = fs.readFileSync(dbFile, 'utf-8');
      dataToUpload = JSON.parse(content);
      console.log(`Loaded local data from ${dbFile}. Users: ${dataToUpload.users?.length}, Tests: ${dataToUpload.tests?.length}, Attempts: ${dataToUpload.attempts?.length}`);
    } catch (e) {
      console.error('Error reading local db.json:', e);
    }
  }

  if (!dataToUpload) {
    console.log('No valid db.json found, skipping migration.');
    process.exit(0);
  }

  await setDoc(docRef, dataToUpload);
  console.log('Successfully migrated local data into Firestore (app_data/state)!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
