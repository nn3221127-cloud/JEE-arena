import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function testAdmin() {
  const configFile = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  if (!getApps().length) {
    initializeApp({
      projectId: config.projectId
    });
  }

  const db = getFirestore(config.firestoreDatabaseId);
  const docRef = db.collection('app_data').doc('state');
  const snap = await docRef.get();
  console.log('Admin SDK read exists:', snap.exists);
  if (snap.exists) {
    console.log('Keys:', Object.keys(snap.data() || {}));
  }
}

testAdmin().catch(err => {
  console.error('Admin error:', err);
});
