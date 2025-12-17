
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
  serverTimestamp 
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

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

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

  async updateUserBalance(uid: string, amount: number) {
    const userRef = doc(db, 'users', uid);
    // Use setDoc with merge to ensure the field exists before incrementing if it's a new user
    await setDoc(userRef, { walletBalance: increment(amount) }, { merge: true });
  },

  async deleteUserRecord(uid: string) {
    await deleteDoc(doc(db, 'users', uid));
  },

  async getUserProfile(uid: string) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  },

  async saveUserProfile(uid: string, data: any) {
    await setDoc(doc(db, 'users', uid), { ...data, walletBalance: data.walletBalance || 0 }, { merge: true });
  },

  // --- JOB MGMT ---
  async getJobs() {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  // --- APP MGMT ---
  async checkIfApplied(jobId: string, userId: string) {
    const q = query(collection(db, 'applications'), where('jobId', '==', jobId), where('userId', '==', userId));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async submitApplication(jobId: string, userId: string, data: any) {
    const job = await this.getJobById(jobId);
    const docRef = await addDoc(collection(db, 'applications'), {
      jobId, 
      userId, 
      ...data, 
      status: 'pending', 
      appliedAt: serverTimestamp(),
      jobTitle: job?.title || 'Unknown Job', 
      company: job?.company || 'Unknown Company', 
      logo: job?.logo || '',
      jobAmount: parseFloat(job?.amount || 0)
    });
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
      await updateDoc(jobRef, { applicants: (jobSnap.data().applicants || 0) + 1 });
    }
    return docRef.id;
  },

  async getApplicationById(id: string) {
    const docSnap = await getDoc(doc(db, 'applications', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async getAllApplications() {
    const q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getUserApplications(userId: string) {
    const q = query(collection(db, 'applications'), where('userId', '==', userId), orderBy('appliedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateApplicationStatus(id: string, status: string) {
    await updateDoc(doc(db, 'applications', id), { status });
  },

  async completeApplication(id: string) {
    const appRef = doc(db, 'applications', id);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) throw new Error("Application not found");
    
    const appData = appSnap.data();
    if (appData.status === 'completed') return;
    
    // Safety check for user ID
    if (!appData.userId) throw new Error("No user ID found on application");
    
    // 1. Mark application as completed
    await updateDoc(appRef, { 
      status: 'completed', 
      completedAt: serverTimestamp() 
    });
    
    // 2. Add funds to user wallet
    // Handle cases where jobAmount might be stored as string or number
    const amount = typeof appData.jobAmount === 'number' ? appData.jobAmount : parseFloat(appData.jobAmount || 0);
    
    if (amount > 0) {
      await this.updateUserBalance(appData.userId, amount);
    } else {
      console.warn("Application completed but reward amount was 0 or invalid", appData.jobAmount);
    }
  },

  // --- WITHDRAWALS ---
  async addWithdrawal(userId: string, data: any) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.exists() ? userSnap.data().walletBalance || 0 : 0;
    
    if (currentBalance < data.amount) {
      throw new Error("Insufficient balance");
    }

    await addDoc(collection(db, 'withdrawals'), { 
      userId, 
      ...data, 
      status: 'pending', 
      createdAt: serverTimestamp() 
    });
    
    // Deduct immediately as a pending withdrawal
    await updateDoc(userRef, { 
      walletBalance: increment(-data.amount)
    });
  },

  async getAllWithdrawals() {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateWithdrawalStatus(id: string, status: string) {
    const withdrawRef = doc(db, 'withdrawals', id);
    const snap = await getDoc(withdrawRef);
    
    if (snap.exists()) {
      const data = snap.data();
      if (status === 'rejected') {
        // Return funds to user if rejected
        await this.updateUserBalance(data.userId, data.amount);
      }
      await updateDoc(withdrawRef, { status });
    }
  },

  // --- CHAT SYSTEM ---
  subscribeToMessages(chatId: string, callback: (msgs: any[]) => void) {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  async sendMessage(chatId: string, text: string, senderId: string, senderRole: 'user' | 'admin') {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text, senderId, senderRole, timestamp: serverTimestamp()
    });
    await setDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastTimestamp: serverTimestamp(),
      userId: chatId, 
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  async getChatThreads() {
    const q = query(collection(db, 'chats'), orderBy('lastTimestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // --- SETTINGS ---
  async getSettings() {
    const docSnap = await getDoc(doc(db, 'config', 'general'));
    return docSnap.exists() ? docSnap.data() : { siteName: "Jobs Center", supportEmail: "support@jobcenter.com" };
  },

  async updateSettings(data: any) {
    await setDoc(doc(db, 'config', 'general'), data, { merge: true });
  }
};
