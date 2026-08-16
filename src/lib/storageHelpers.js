import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a PDF file to Firebase Storage under the 'pyqs' folder.
 * @param {File} file - The PDF file object
 * @param {string} courseCode - The course code
 * @param {string} year - The year of the PYQ
 * @param {string} examType - Exam type (e.g., 'CAT1', 'FAT')
 * @returns {Promise<string>} Download URL of the uploaded file
 */
export async function uploadPYQPDF(file, courseCode, year, examType) {
  const fileName = `${courseCode}_${year}_${examType}.pdf`;
  const storageRef = ref(storage, `pyqs/${courseCode}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Delete a PDF file from Firebase Storage.
 * @param {string} courseCode - The course code
 * @param {string} year - The year of the PYQ
 * @param {string} examType - Exam type
 */
export async function deletePYQPDF(courseCode, year, examType) {
  const fileName = `${courseCode}_${year}_${examType}.pdf`;
  const storageRef = ref(storage, `pyqs/${courseCode}/${fileName}`);
  
  await deleteObject(storageRef);
}
