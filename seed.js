import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// ─── Firebase Config (Copied from src/lib/firebase.js) ───
const firebaseConfig = {
  apiKey: "AIzaSyAmZ4SjxmCL8cmHJhGbIOXQxqJQRtRDnOs",
  authDomain: "scroll-d95c6.firebaseapp.com",
  projectId: "scroll-d95c6",
  storageBucket: "scroll-d95c6.firebasestorage.app",
  messagingSenderId: "357050314974",
  appId: "1:357050314974:web:848e46b67e7b335fb1124f",
  measurementId: "G-CQ9KKC19DL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  try {
    console.log("Reading courseData.json...");
    const rawData = fs.readFileSync(new URL('./courseData.json', import.meta.url));
    const data = JSON.parse(rawData);
    const courses = data.courses;

    console.log(`Found ${courses.length} courses to seed.`);

    let count = 0;
    for (const course of courses) {
      // Use course.code as the document ID for easy reference
      const courseRef = doc(db, 'courses', course.code);
      
      // Optionally add some server-side timestamps or metadata
      const courseData = {
        ...course,
        createdAt: new Date().toISOString(),
      };

      await setDoc(courseRef, courseData);
      count++;
      console.log(`[${count}/${courses.length}] Seeded ${course.code} - ${course.name}`);
    }

    console.log("Data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
