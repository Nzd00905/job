
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
// Use standard getFirestore for maximum compatibility
export const db = getFirestore(app);

export const firestoreService = {
  // --- ADMIN SYSTEM ---
  async verifyAdmin(email, password) {
    try {
      const q = query(collection(db, 'admins'), where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (e) {
      console.error("[VERIFY_ADMIN_ERROR]", e);
      return false;
    }
  },

  async initializeAdmin() {
    try {
      const q = query(collection(db, 'admins'), where('email', '==', 'admin@gmail.com'));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, 'admins'), { 
          email: 'admin@gmail.com', 
          password: 'admin', 
          role: 'superadmin',
          createdAt: serverTimestamp() 
        });
        return true;
      }
    } catch (e) {
      console.error("[INITIALIZE_ADMIN_ERROR]", e);
    }
    return false;
  },

  // --- USER MGMT ---
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("[GET_USERS_ERROR]", e);
      return [];
    }
  },

  async updateUserStatus(uid: string, status: string) {
    try {
      await updateDoc(doc(db, 'users', uid), { status, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error("[UPDATE_USER_STATUS_ERROR]", e);
      throw e;
    }
  },

  async getUserProfile(uid: string) {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
      console.error("[GET_USER_PROFILE_ERROR]", e);
      return null;
    }
  },

  async saveUserProfile(uid: string, data: any) {
    try {
      await setDoc(doc(db, 'users', uid), { 
        ...data, 
        savedJobIds: data.savedJobIds || [],
        status: data.status || 'approved',
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("[SAVE_USER_PROFILE_ERROR]", e);
      throw e;
    }
  },

  // --- JOB MGMT ---
  async getJobs() {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return jobs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("[GET_JOBS_ERROR]", e);
      return [];
    }
  },

  async getJobById(id: string) {
    try {
      const docSnap = await getDoc(doc(db, 'jobs', id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (e) {
      console.error("[GET_JOB_BY_ID_ERROR]", e);
      return null;
    }
  },

  async addJob(jobData: any) {
    try {
      return await addDoc(collection(db, 'jobs'), { 
        ...jobData, 
        amount: parseFloat(jobData.amount || 0),
        createdAt: serverTimestamp(), 
        applicants: 0 
      });
    } catch (e) {
      console.error("[ADD_JOB_ERROR]", e);
      throw e;
    }
  },

  async updateJob(id: string, data: any) {
    try {
      await updateDoc(doc(db, 'jobs', id), {
        ...data,
        amount: parseFloat(data.amount || 0),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("[UPDATE_JOB_ERROR]", e);
      throw e;
    }
  },

  async deleteJob(id: string) {
    try {
      await deleteDoc(doc(db, 'jobs', id));
    } catch (e) {
      console.error("[DELETE_JOB_ERROR]", e);
      throw e;
    }
  },

  async toggleSaveJob(uid: string, jobId: string, isCurrentlySaved: boolean) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        savedJobIds: isCurrentlySaved ? arrayRemove(jobId) : arrayUnion(jobId)
      });
    } catch (e) {
      console.error("[TOGGLE_SAVE_JOB_ERROR]", e);
      throw e;
    }
  },

  // --- APPLICATION MGMT ---
  async checkIfApplied(jobId: string, userId: string) {
    try {
      const q = query(collection(db, 'applications'), where('jobId', '==', jobId), where('userId', '==', userId));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      console.error("[CHECK_IF_APPLIED_ERROR]", e);
      return false;
    }
  },

  async submitApplication(jobId: string, userId: string, data: any) {
    try {
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
    } catch (e) {
      console.error("[SUBMIT_APPLICATION_ERROR]", e);
      throw e;
    }
  },

  async getApplicationById(id: string) {
    try {
      const docSnap = await getDoc(doc(db, 'applications', id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (e) {
      console.error("[GET_APPLICATION_BY_ID_ERROR]", e);
      return null;
    }
  },

  async getAllApplications() {
    try {
      const querySnapshot = await getDocs(collection(db, 'applications'));
      const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return apps.sort((a: any, b: any) => {
        const timeA = a.appliedAt?.toMillis?.() || a.appliedAt?.seconds * 1000 || 0;
        const timeB = b.appliedAt?.toMillis?.() || b.appliedAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("[GET_ALL_APPLICATIONS_ERROR]", e);
      return [];
    }
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
    }, (error) => {
      console.error("[SUBSCRIBE_APPLICATIONS_ERROR]", error);
    });
  },

  async getUserApplications(userId: string) {
    try {
      const q = query(collection(db, 'applications'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return apps.sort((a: any, b: any) => {
        const timeA = a.appliedAt?.toMillis?.() || a.appliedAt?.seconds * 1000 || 0;
        const timeB = b.appliedAt?.toMillis?.() || b.appliedAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("[GET_USER_APPLICATIONS_ERROR]", e);
      return [];
    }
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
    if (!chatId) return;
    try {
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
        id: chatId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
    } catch (e) {
      console.error("[SEND_MESSAGE_ERROR]", e);
      throw e;
    }
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
    }, (error) => {
      console.error("[SUBSCRIBE_MESSAGES_ERROR]", error);
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
    }, (error) => {
      console.error("[SUBSCRIBE_THREADS_ERROR]", error);
    });
  },

  async getChatThreads() {
    try {
      const querySnapshot = await getDocs(collection(db, 'threads'));
      const threads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return threads.sort((a: any, b: any) => {
        const timeA = a.lastTimestamp?.toMillis?.() || a.lastTimestamp?.seconds * 1000 || 0;
        const timeB = b.lastTimestamp?.toMillis?.() || b.lastTimestamp?.seconds * 1000 || 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("[GET_THREADS_ERROR]", e);
      return [];
    }
  },

  // --- WITHDRAWAL MGMT ---
  async getAllWithdrawals() {
    try {
      const querySnapshot = await getDocs(collection(db, 'withdrawals'));
      const withdrawals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return withdrawals.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("[GET_WITHDRAWALS_ERROR]", e);
      return [];
    }
  },

  async addWithdrawal(userId: string, payload: any) {
    try {
      return await addDoc(collection(db, 'withdrawals'), {
        ...payload,
        userId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("[ADD_WITHDRAWAL_ERROR]", e);
      throw e;
    }
  },

  // --- SETTINGS ---
  async getSettings() {
    try {
      const snap = await getDoc(doc(db, 'settings', 'main'));
      return snap.exists() ? snap.data() : { siteName: 'MicroJob', supportEmail: 'admin@microjob.com' };
    } catch (e) {
      console.error("[GET_SETTINGS_ERROR]", e);
      return { siteName: 'MicroJob', supportEmail: 'admin@microjob.com' };
    }
  },

  async updateSettings(data: any) {
    try {
      await setDoc(doc(db, 'settings', 'main'), data, { merge: true });
    } catch (e) {
      console.error("[UPDATE_SETTINGS_ERROR]", e);
      throw e;
    }
  }
};
