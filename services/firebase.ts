
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  runTransaction,
  writeBatch,
  deleteField
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDHUrWyI0J41N2Yb8yWNeDVII3oP_doIQ0",
  authDomain: "microjob-dce22.firebaseapp.com",
  projectId: "microjob-dce22",
  storageBucket: "microjob-dce22.firebasestorage.app",
  messagingSenderId: "836299369892",
  appId: "1:836299369892:web:be062a9908412f8daca531",
  measurementId: "G-DWD2SZ0VXM"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export const firestoreService = {
  // --- ADMIN SYSTEM ---
  async verifyAdmin(email, password) {
    try {
      const q = query(collection(db, 'admins'), where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (e) {
      return false;
    }
  },

  async initializeAdmin() {
    const q = query(collection(db, 'admins'), where('email', '==', 'admin@gmail.com'));
    const snap = await getDocs(q);
    if (snap.empty) {
      await addDoc(collection(db, 'admins'), { email: 'admin@gmail.com', password: 'admin', role: 'superadmin' });
      return true;
    }
    return false;
  },

  // --- USER MGMT ---
  async getAllUsers() {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  },

  async updateUserStatus(uid: string, status: string) {
    await updateDoc(doc(db, 'users', uid), { status });
  },

  async getUserProfile(uid: string) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  },

  async saveUserProfile(uid: string, data: any) {
    await setDoc(doc(db, 'users', uid), { 
      ...data, 
      savedJobIds: data.savedJobIds || [],
      status: data.status || 'approved'
    }, { merge: true });
  },

  // --- JOB MGMT ---
  async getJobs() {
    const querySnapshot = await getDocs(collection(db, 'jobs'));
    const jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return jobs.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return timeB - timeA;
    });
  },

  async getJobById(id: string) {
    const docSnap = await getDoc(doc(db, 'jobs', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async addJob(jobData: any) {
    return await addDoc(collection(db, 'jobs'), { 
      ...jobData, 
      amount: parseFloat(jobData.amount || 0),
      createdAt: serverTimestamp(), 
      applicants: 0 
    });
  },

  async updateJob(id: string, data: any) {
    await updateDoc(doc(db, 'jobs', id), {
      ...data,
      amount: parseFloat(data.amount || 0)
    });
  },

  async deleteJob(id: string) {
    await deleteDoc(doc(db, 'jobs', id));
  },

  async toggleSaveJob(uid: string, jobId: string, isCurrentlySaved: boolean) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      savedJobIds: isCurrentlySaved ? arrayRemove(jobId) : arrayUnion(jobId)
    });
  },

  // --- APPLICATION MGMT ---
  async checkIfApplied(jobId: string, userId: string) {
    const q = query(collection(db, 'applications'), where('jobId', '==', jobId), where('userId', '==', userId));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async submitApplication(jobId: string, userId: string, data: any) {
    const jobSnap = await getDoc(doc(db, 'jobs', jobId));
    if (!jobSnap.exists()) throw new Error("Job not found");
    const job = jobSnap.data();
    
    const jobPrice = typeof job.amount === 'number' ? job.amount : parseFloat(job.amount || 0);

    const docRef = await addDoc(collection(db, 'applications'), {
      jobId, 
      userId, 
      ...data, 
      status: 'pending', 
      appliedAt: serverTimestamp(),
      jobTitle: job?.title || 'Unknown Job', 
      company: job?.company || 'Unknown Company', 
      logo: job?.logo || '',
      jobAmount: jobPrice 
    });
    
    await updateDoc(doc(db, 'jobs', jobId), { applicants: increment(1) });
    return docRef.id;
  },

  async getApplicationById(id: string) {
    const docSnap = await getDoc(doc(db, 'applications', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async getAllApplications() {
    const querySnapshot = await getDocs(collection(db, 'applications'));
    const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return apps.sort((a: any, b: any) => {
      const timeA = a.appliedAt?.toMillis?.() || a.appliedAt?.seconds * 1000 || 0;
      const timeB = b.appliedAt?.toMillis?.() || b.appliedAt?.seconds * 1000 || 0;
      return timeB - timeA;
    });
  },

  subscribeToApplications(callback: (apps: any[]) => void) {
    const q = collection(db, 'applications');
    return onSnapshot(q, (snap) => {
      const apps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      apps.sort((a: any, b: any) => {
        const timeA = a.appliedAt?.toMillis?.() || a.appliedAt?.seconds * 1000 || 0;
        const timeB = b.appliedAt?.toMillis?.() || b.appliedAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });
      callback(apps);
    });
  },

  async getUserApplications(userId: string) {
    const q = query(collection(db, 'applications'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return apps.sort((a: any, b: any) => {
      const timeA = a.appliedAt?.toMillis?.() || a.appliedAt?.seconds * 1000 || 0;
      const timeB = b.appliedAt?.toMillis?.() || b.appliedAt?.seconds * 1000 || 0;
      return timeB - timeA;
    });
  },

  async updateApplicationStatus(id: string, status: string) {
    if (!id) throw new Error("Missing Application ID");
    try {
      const applicationRef = doc(db, 'applications', id);
      const updates: any = { 
        status: status,
        updatedAt: serverTimestamp()
      };

      if (status === 'completed') {
        updates.completedAt = serverTimestamp();
      } else {
        updates.completedAt = deleteField();
      }

      await updateDoc(applicationRef, updates);
      console.log(`[DATABASE SUCCESS] Status for ${id} updated to ${status}`);
      return true;
    } catch (err: any) {
      console.error(`[DATABASE ERROR] Failed to update ${id}:`, err);
      throw err;
    }
  },

  // --- CHAT SYSTEM ---
  async sendMessage(chatId: string, text: string, senderId: string, senderRole: string) {
    const messageRef = doc(collection(db, 'messages'));
    const batch = writeBatch(db);
    
    batch.set(messageRef, {
      chatId,
      text,
      senderId,
      senderRole,
      timestamp: serverTimestamp()
    });
    
    batch.set(doc(db, 'threads', chatId), {
      lastMessage: text,
      lastTimestamp: serverTimestamp(),
      id: chatId
    }, { merge: true });

    await batch.commit();
  },

  subscribeToMessages(chatId: string, callback: (msgs: any[]) => void) {
    const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
    
    return onSnapshot(q, (snap) => {
      const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      messages.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || Date.now();
        const timeB = b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || Date.now();
        return timeA - timeB;
      });
      
      callback(messages);
    });
  },

  subscribeToThreads(callback: (threads: any[]) => void) {
    const q = collection(db, 'threads');
    return onSnapshot(q, (snap) => {
      const threads = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      threads.sort((a: any, b: any) => {
        const timeA = a.lastTimestamp?.toMillis?.() || a.lastTimestamp?.seconds * 1000 || 0;
        const timeB = b.lastTimestamp?.toMillis?.() || b.lastTimestamp?.seconds * 1000 || 0;
        return timeB - timeA;
      });
      callback(threads);
    });
  },

  async getChatThreads() {
    const querySnapshot = await getDocs(collection(db, 'threads'));
    const threads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return threads.sort((a: any, b: any) => {
      const timeA = a.lastTimestamp?.toMillis?.() || a.lastTimestamp?.seconds * 1000 || 0;
      const timeB = b.lastTimestamp?.toMillis?.() || b.lastTimestamp?.seconds * 1000 || 0;
      return timeB - timeA;
    });
  },

  // --- WITHDRAWAL MGMT ---
  async getAllWithdrawals() {
    const querySnapshot = await getDocs(collection(db, 'withdrawals'));
    const withdrawals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return withdrawals.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return timeB - timeA;
    });
  },

  async addWithdrawal(userId: string, payload: any) {
    return await addDoc(collection(db, 'withdrawals'), {
      ...payload,
      userId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  },

  // --- SETTINGS ---
  async getSettings() {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    return snap.exists() ? snap.data() : { siteName: 'MicroJob', supportEmail: 'admin@microjob.com' };
  },

  async updateSettings(data: any) {
    await setDoc(doc(db, 'settings', 'main'), data, { merge: true });
  }
};
