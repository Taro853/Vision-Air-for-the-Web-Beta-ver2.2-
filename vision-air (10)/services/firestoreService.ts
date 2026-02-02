
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, UserProfile, AppSettings, LicenseData, LicenseFeatures } from '../types';

// デバウンス用のタイマー管理
let saveProjectTimeout: any = null;
const DEBOUNCE_DELAY = 2000; // 2秒間隔で保存

// --- Local Storage Mock Helper for Licenses ---
// Firestoreのセキュリティルールが未設定の場合でも動作するように、ローカルストレージをフォールバックとして使用します。
const MOCK_LICENSE_KEY = 'vision_air_mock_licenses';

const getMockLicenses = (): LicenseData[] => {
    try {
        const data = localStorage.getItem(MOCK_LICENSE_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const saveMockLicenses = (licenses: LicenseData[]) => {
    localStorage.setItem(MOCK_LICENSE_KEY, JSON.stringify(licenses));
};

const handleMockFallback = (actionName: string, error: any) => {
    console.warn(`Firestore ${actionName} failed (${error.code || error.message}). Falling back to local mock storage.`);
};

// ユーザープロファイルの保存
export const saveUserProfileToCloud = async (uid: string, profile: UserProfile) => {
  try {
    const { licenseKey, ...profileToSave } = profile;
    await setDoc(doc(db, 'users', uid, 'data', 'profile'), profileToSave);
  } catch (e) {
    console.error("Error saving profile: ", e);
  }
};

// ユーザープロファイルの取得
export const getUserProfileFromCloud = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid, 'data', 'profile'));
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      const localLicenseKey = localStorage.getItem('vision_air_license_key');
      return { ...data, licenseKey: localLicenseKey || undefined };
    }
  } catch (e) {
    console.error("Error fetching profile: ", e);
  }
  return null;
};

// 単一プロジェクトの保存
export const saveSingleProjectToCloud = async (uid: string, project: Project) => {
    if (localStorage.getItem('vision_air_is_view_only') === 'true') {
        console.warn("Project saving blocked: View-only mode active.");
        return;
    }

    if (saveProjectTimeout) clearTimeout(saveProjectTimeout);
    
    saveProjectTimeout = setTimeout(async () => {
        try {
            await setDoc(doc(db, 'users', uid, 'projects', project.id), project);
        } catch (e: any) {
            if (e.code === 'invalid-argument' && e.message && e.message.includes('exceeds the maximum allowed size')) {
                console.warn(`Project ${project.id} is too large to sync to Firestore (limit 1MB).`);
            } else {
                console.error("Error saving project: ", e);
            }
        }
    }, DEBOUNCE_DELAY);
};

// プロジェクトの削除
export const deleteProjectFromCloud = async (uid: string, projectId: string) => {
    if (localStorage.getItem('vision_air_is_view_only') === 'true') {
        console.warn("Project deletion blocked: View-only mode active.");
        return;
    }
    try {
        await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
    } catch (e) {
        console.error("Error deleting project: ", e);
    }
};

// 全プロジェクトの取得
export const getProjectsFromCloud = async (uid: string): Promise<Project[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'projects'));
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push(doc.data() as Project);
    });
    return projects.sort((a, b) => b.lastModified - a.lastModified);
  } catch (e) {
    console.error("Error fetching projects: ", e);
    return [];
  }
};

// アプリ設定の保存
export const saveSettingsToCloud = async (uid: string, settings: AppSettings) => {
    try {
      await setDoc(doc(db, 'users', uid, 'data', 'settings'), settings);
    } catch (e) {
      console.error("Error saving settings: ", e);
    }
};

// アプリ設定の取得
export const getSettingsFromCloud = async (uid: string): Promise<AppSettings | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid, 'data', 'settings'));
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
    } catch (e) {
      console.error("Error fetching settings: ", e);
    }
    return null;
};

// --- Sharing Features ---

export const publishProject = async (project: Project): Promise<string> => {
    if (localStorage.getItem('vision_air_is_view_only') === 'true') {
        throw new Error("閲覧モードでは共有できません。");
    }
    try {
        const projectToShare = JSON.parse(JSON.stringify(project));
        // 画像データが大きすぎる場合の対策（簡易版）
        if (projectToShare.slides) {
            projectToShare.slides.forEach((slide: any) => {
                if (slide.elements) {
                    slide.elements.forEach((el: any) => {
                        if (el.type === 'image' && el.content && el.content.length > 5000) {
                            el.content = 'placeholder'; 
                            if (!el.style) el.style = {};
                            el.style.backgroundColor = '#f1f5f9';
                        }
                    });
                }
            });
        }
        const docRef = await addDoc(collection(db, 'shared_projects'), {
            ...projectToShare,
            sharedAt: Date.now()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error publishing project:", e);
        throw e;
    }
};

export const fetchSharedProject = async (shareId: string): Promise<Project | null> => {
    try {
        const docSnap = await getDoc(doc(db, 'shared_projects', shareId));
        if (docSnap.exists()) {
            return docSnap.data() as Project;
        }
        return null;
    } catch (e) {
        console.error("Error fetching shared project:", e);
        return null;
    }
};

// --- License Management (Hybrid: Firestore + Local Mock) ---

// ライセンスキーの検証
export const validateLicenseKey = async (key: string): Promise<{ valid: boolean, license?: LicenseData, message?: string }> => {
    // SPECIAL MASTER KEY
    if (key === '2212212212212') {
        return {
            valid: true,
            license: {
                key: '2212212212212',
                maxDevices: 99999,
                currentUsage: 0,
                boundAccounts: [],
                isActive: true,
                createdAt: Date.now(),
                plan: 'enterprise',
                ownerName: 'Special Access',
                features: {
                    aiGeneration: true,
                    exportPptx: true,
                    cloudSync: true,
                    advancedEditing: true
                }
            }
        };
    }

    const validateLogic = (license: LicenseData): { valid: boolean, license?: LicenseData, message?: string } => {
        if (!license.isActive) return { valid: false, message: 'このライセンスは無効化されています。' };
        if (license.expiryDate && Date.now() > license.expiryDate) {
            return { valid: false, message: `有効期限切れです (${new Date(license.expiryDate).toLocaleDateString()}まで)` };
        }
        return { valid: true, license };
    };

    try {
        const licenseRef = doc(db, 'licenses', key);
        const licenseSnap = await getDoc(licenseRef);

        if (!licenseSnap.exists()) {
            // Fallback: Check mock
            const mockLicenses = getMockLicenses();
            const mock = mockLicenses.find(l => l.key === key);
            if (mock) return validateLogic(mock);
            return { valid: false, message: '無効なライセンスキーです。' };
        }

        const license = licenseSnap.data() as LicenseData;
        return validateLogic(license);

    } catch (e: any) {
        // Fallback on permission error
        handleMockFallback('validateLicenseKey', e);
        const mockLicenses = getMockLicenses();
        const mock = mockLicenses.find(l => l.key === key);
        if (mock) return validateLogic(mock);
        return { valid: false, message: '検証中にエラーが発生しました。' };
    }
};

// ライセンスの紐付け
export const bindLicense = async (key: string, accountId: string) => {
    // Master key requires no binding updates
    if (key === '2212212212212') return;

    try {
        const licenseRef = doc(db, 'licenses', key);
        const licenseSnap = await getDoc(licenseRef);
        
        if (licenseSnap.exists()) {
            const data = licenseSnap.data() as LicenseData;
            if (data.expiryDate && Date.now() > data.expiryDate) throw new Error('ライセンスの有効期限が切れています。');
            if (data.boundAccounts.includes(accountId)) return;
            if (data.boundAccounts.length >= data.maxDevices) throw new Error('ライセンスの利用上限台数に達しています。');

            const newAccounts = [...data.boundAccounts, accountId];
            await updateDoc(licenseRef, { boundAccounts: newAccounts, currentUsage: newAccounts.length });
        } else {
            // Fallback Check
            throw new Error('Firestore doc not found, triggering catch for fallback');
        }
    } catch (e: any) {
        handleMockFallback('bindLicense', e);
        const licenses = getMockLicenses();
        const idx = licenses.findIndex(l => l.key === key);
        if (idx !== -1) {
            const lic = licenses[idx];
            if (lic.expiryDate && Date.now() > lic.expiryDate) throw new Error('ライセンスの有効期限が切れています。(Local)');
            if (lic.boundAccounts.includes(accountId)) return;
            if (lic.boundAccounts.length >= lic.maxDevices) throw new Error('ライセンスの利用上限台数に達しています。(Local)');
            
            lic.boundAccounts.push(accountId);
            lic.currentUsage = lic.boundAccounts.length;
            licenses[idx] = lic;
            saveMockLicenses(licenses);
            return;
        }
        throw new Error('ライセンスが見つかりません。');
    }
};

// アカウントに紐付いたライセンスを確認
export const checkAccountLicense = async (accountId: string): Promise<{ valid: boolean, plan?: LicenseData['plan'], features?: LicenseFeatures }> => {
    // If authenticated previously with special key
    if (localStorage.getItem('vision_air_license_key') === '2212212212212') {
        return {
            valid: true,
            plan: 'enterprise',
            features: { aiGeneration: true, exportPptx: true, cloudSync: true, advancedEditing: true }
        };
    }

    if (!accountId) return { valid: false };
    
    const checkValid = (l: LicenseData) => {
        if (!l.isActive) return false;
        if (l.expiryDate && Date.now() > l.expiryDate) return false;
        return true;
    };

    try {
        const q = query(collection(db, 'licenses'), where("boundAccounts", "array-contains", accountId));
        const querySnapshot = await getDocs(q);
        let foundLicense: LicenseData | null = null;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data() as LicenseData;
            if (checkValid(data)) foundLicense = data;
        });

        if (foundLicense) {
            const lic = foundLicense as LicenseData;
            return { valid: true, plan: lic.plan || 'express-pro', features: lic.features };
        } else {
             throw new Error('Not found in Firestore, try mock');
        }
    } catch (e) {
        // Fallback Logic
        const licenses = getMockLicenses();
        const found = licenses.find(l => l.boundAccounts.includes(accountId) && checkValid(l));
        if (found) {
            return { valid: true, plan: found.plan || 'express-pro', features: found.features };
        }
        return { valid: false };
    }
};

// ローカルIDを生成・取得
export const getLocalAccountId = (): string => {
    let localId = localStorage.getItem('vision_air_local_id');
    if (!localId) {
        localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('vision_air_local_id', localId);
    }
    return localId;
};

// --- Admin Functions (Hybrid) ---

export const adminAddLicense = async (
    key: string, 
    maxDevices: number, 
    plan: LicenseData['plan'],
    ownerName?: string,
    features?: LicenseFeatures,
    expiryDate?: number
) => {
    const data: LicenseData = {
        key,
        maxDevices,
        currentUsage: 0,
        boundAccounts: [],
        isActive: true,
        createdAt: Date.now(),
        plan,
        ownerName: ownerName || 'Unknown',
        features: features,
        expiryDate
    };

    try {
        await setDoc(doc(db, 'licenses', key), data);
    } catch (e: any) {
        handleMockFallback('adminAddLicense', e);
        const licenses = getMockLicenses();
        if (licenses.some(l => l.key === key)) throw new Error('Key already exists (Local)');
        licenses.push(data);
        saveMockLicenses(licenses);
    }
};

// UPDATE LICENSE
export const adminUpdateLicense = async (key: string, updates: Partial<LicenseData>) => {
    try {
        await updateDoc(doc(db, 'licenses', key), updates);
    } catch (e: any) {
        handleMockFallback('adminUpdateLicense', e);
        const licenses = getMockLicenses();
        const idx = licenses.findIndex(l => l.key === key);
        if (idx !== -1) {
            licenses[idx] = { ...licenses[idx], ...updates };
            saveMockLicenses(licenses);
        } else {
            throw new Error("License not found (Local)");
        }
    }
};

export const adminGetLicenses = async (): Promise<LicenseData[]> => {
    try {
        const snap = await getDocs(collection(db, 'licenses'));
        const list: LicenseData[] = [];
        snap.forEach(d => list.push(d.data() as LicenseData));
        
        const mock = getMockLicenses();
        const keys = new Set(list.map(l => l.key));
        mock.forEach(m => {
            if (!keys.has(m.key)) list.push(m);
        });

        return list.sort((a,b) => b.createdAt - a.createdAt);
    } catch (e: any) {
        handleMockFallback('adminGetLicenses', e);
        const mock = getMockLicenses();
        return mock.sort((a,b) => b.createdAt - a.createdAt);
    }
};

export const adminToggleLicense = async (key: string, isActive: boolean) => {
    try {
        await updateDoc(doc(db, 'licenses', key), { isActive });
    } catch (e: any) {
        handleMockFallback('adminToggleLicense', e);
        const licenses = getMockLicenses();
        const idx = licenses.findIndex(l => l.key === key);
        if (idx !== -1) {
            licenses[idx].isActive = isActive;
            saveMockLicenses(licenses);
        }
    }
};

export const adminDeleteLicense = async (key: string) => {
    try {
        await deleteDoc(doc(db, 'licenses', key));
    } catch (e: any) {
        handleMockFallback('adminDeleteLicense', e);
        const licenses = getMockLicenses();
        const newLicenses = licenses.filter(l => l.key !== key);
        saveMockLicenses(newLicenses);
    }
};
