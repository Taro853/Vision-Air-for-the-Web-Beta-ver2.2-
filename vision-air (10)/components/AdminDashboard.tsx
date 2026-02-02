
import React, { useState, useEffect } from 'react';
import { LicenseData, LicenseFeatures } from '../types';
import { adminGetLicenses, adminAddLicense, adminToggleLicense, adminDeleteLicense, adminUpdateLicense } from '../services/firestoreService';
import { Trash2, Plus, RefreshCcw, Power, X, Shield, Crown, Zap, Building2, User, Calendar, Edit2, CheckCircle2, AlertCircle, Save, Undo2 } from 'lucide-react';

interface AdminDashboardProps {
    onClose: () => void;
}

const DEFAULT_FEATURES: LicenseFeatures = {
    aiGeneration: true,
    exportPptx: true,
    cloudSync: true,
    advancedEditing: true
};

const PLAN_TYPES: { id: LicenseData['plan'], label: string, icon: any, color: string }[] = [
    { id: 'express-suite', label: 'Express Suite (単体)', icon: Zap, color: 'text-orange-500' },
    { id: 'express-pro', label: 'Express Suite Pro', icon: Crown, color: 'text-indigo-600' },
    { id: 'academic', label: 'Academic (No AI)', icon: Building2, color: 'text-green-600' },
    { id: 'enterprise', label: 'Enterprise', icon: Shield, color: 'text-slate-800' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const [licenses, setLicenses] = useState<LicenseData[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null); // Key cannot be changed in edit mode
    
    const [inputKey, setInputKey] = useState('');
    const [maxDevices, setMaxDevices] = useState(5);
    const [planType, setPlanType] = useState<LicenseData['plan']>('express-pro');
    const [ownerName, setOwnerName] = useState('');
    const [features, setFeatures] = useState<LicenseFeatures>(DEFAULT_FEATURES);
    const [expiryDate, setExpiryDate] = useState<string>(''); // YYYY-MM-DD

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminGetLicenses();
            setLicenses(data);
        } catch (e: any) {
            console.error(e);
            alert(`ライセンス取得エラー: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // プラン変更時のデフォルト機能設定
    useEffect(() => {
        if (planType === 'express-suite') {
            setFeatures({ aiGeneration: false, exportPptx: false, cloudSync: false, advancedEditing: true });
        } else if (planType === 'express-pro') {
            setFeatures(DEFAULT_FEATURES);
        } else if (planType === 'academic') {
            setFeatures({ ...DEFAULT_FEATURES, aiGeneration: false });
        }
        // Enterpriseは現状維持（手動変更）
    }, [planType]);

    const resetForm = () => {
        setIsEditing(false);
        setEditingKey(null);
        setInputKey('');
        setOwnerName('');
        setMaxDevices(5);
        setPlanType('express-pro');
        setFeatures(DEFAULT_FEATURES);
        setExpiryDate('');
    };

    const handleEdit = (lic: LicenseData) => {
        setIsEditing(true);
        setEditingKey(lic.key);
        setInputKey(lic.key);
        setOwnerName(lic.ownerName || '');
        setMaxDevices(lic.maxDevices);
        setPlanType(lic.plan);
        setFeatures(lic.features || DEFAULT_FEATURES);
        setExpiryDate(lic.expiryDate ? new Date(lic.expiryDate).toISOString().split('T')[0] : '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async () => {
        if (!inputKey || inputKey.length !== 13) return alert('ライセンスキーは13桁必要です');
        setLoading(true);
        
        const expiryTimestamp = expiryDate ? new Date(expiryDate).getTime() : undefined;

        try {
            if (isEditing && editingKey) {
                // Update
                await adminUpdateLicense(editingKey, {
                    maxDevices,
                    plan: planType,
                    ownerName,
                    features,
                    expiryDate: expiryTimestamp
                });
                alert('更新しました');
            } else {
                // Add New
                await adminAddLicense(inputKey, maxDevices, planType, ownerName, features, expiryTimestamp);
                alert('発行しました');
            }
            resetForm();
            await load();
        } catch (e: any) {
            alert(`エラー: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: string, current: boolean) => {
        await adminToggleLicense(key, !current);
        load();
    };

    const handleDelete = async (key: string) => {
        if (confirm('本当に削除しますか？この操作は取り消せません。')) {
            await adminDeleteLicense(key);
            load();
        }
    };

    const isExpired = (ts?: number) => ts && Date.now() > ts;

    return (
        <div className="fixed inset-0 bg-white z-[10000] flex flex-col font-sans">
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                    <Shield className="text-brand-primary" />
                    <h2 className="font-bold text-slate-800">Admin Dashboard</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* Editor / Creator Panel */}
                    <div className={`bg-white p-6 rounded-2xl border shadow-sm transition-all ${isEditing ? 'border-brand-primary ring-2 ring-brand-primary/10' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-sm text-slate-500 uppercase flex items-center gap-2">
                                {isEditing ? <Edit2 size={16}/> : <Plus size={16}/>}
                                {isEditing ? `ライセンス編集: ${editingKey}` : '新規ライセンス発行'}
                            </h3>
                            {isEditing && (
                                <button onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-bold">
                                    <Undo2 size={14}/> 編集キャンセル
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">ライセンスキー (13桁)</label>
                                    <input 
                                        value={inputKey} 
                                        onChange={e => setInputKey(e.target.value.replace(/[^0-9]/g, '').slice(0,13))}
                                        placeholder="例: 2024..." 
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-brand-primary font-mono text-lg tracking-widest disabled:bg-slate-100 disabled:text-slate-400"
                                        disabled={isEditing}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">所有者名</label>
                                    <input 
                                        value={ownerName} 
                                        onChange={e => setOwnerName(e.target.value)}
                                        placeholder="例: 株式会社Vision" 
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-brand-primary"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 block mb-1">台数制限</label>
                                        <input 
                                            type="number" 
                                            value={maxDevices} 
                                            onChange={e => setMaxDevices(parseInt(e.target.value))} 
                                            className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold text-center"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 block mb-1">有効期限</label>
                                        <div className="relative">
                                            <input 
                                                type="date" 
                                                value={expiryDate} 
                                                onChange={e => setExpiryDate(e.target.value)} 
                                                className="w-full p-3 border border-slate-200 rounded-xl outline-none text-xs font-bold"
                                            />
                                            {!expiryDate && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">無期限</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-2">プラン選択</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PLAN_TYPES.map(pt => (
                                            <button 
                                                key={pt.id} 
                                                onClick={() => setPlanType(pt.id)}
                                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${planType === pt.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-brand-primary'}`}
                                            >
                                                <pt.icon size={20} className={planType === pt.id ? 'text-brand-primary' : pt.color}/>
                                                <span className="text-[10px] font-bold">{pt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border ${planType === 'enterprise' ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-80'}`}>
                                    <label className="text-xs font-bold text-slate-400 block mb-2 flex justify-between">
                                        <span>Enterprise 機能カスタマイズ (40機能)</span>
                                        {planType !== 'enterprise' && <span className="text-[10px] bg-slate-200 px-1.5 rounded">AUTO</span>}
                                    </label>
                                    <div className={`grid grid-cols-2 gap-2 ${planType !== 'enterprise' ? 'pointer-events-none' : ''}`}>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded">
                                            <input type="checkbox" checked={features.aiGeneration} onChange={() => setFeatures(f => ({...f, aiGeneration: !f.aiGeneration}))} className="accent-brand-primary"/> AI生成 (Visiot)
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded">
                                            <input type="checkbox" checked={features.exportPptx} onChange={() => setFeatures(f => ({...f, exportPptx: !f.exportPptx}))} className="accent-brand-primary"/> Export (PPTX/PDF)
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded">
                                            <input type="checkbox" checked={features.cloudSync} onChange={() => setFeatures(f => ({...f, cloudSync: !f.cloudSync}))} className="accent-brand-primary"/> Cloud Sync
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded">
                                            <input type="checkbox" checked={features.advancedEditing} onChange={() => setFeatures(f => ({...f, advancedEditing: !f.advancedEditing}))} className="accent-brand-primary"/> Advanced Edit
                                        </label>
                                        {/* Placeholder for "40 functions" visual representation */}
                                        <div className="col-span-2 text-[10px] text-slate-400 text-center py-1 italic">...他36機能 (省略)...</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button onClick={handleSave} disabled={loading || inputKey.length !== 13} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none ${isEditing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-brand-primary hover:bg-orange-600'}`}>
                                {loading ? <RefreshCcw className="animate-spin"/> : isEditing ? <Save size={18}/> : <Plus size={18}/>}
                                {isEditing ? '更新を保存' : 'ライセンス発行'}
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex justify-between p-4 border-b border-slate-100 bg-slate-50/50 items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> 発行済みリスト ({licenses.length})</h3>
                            <button onClick={load} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-brand-primary transition-colors"><RefreshCcw size={16}/></button>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4">Key / Owner</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Usage</th>
                                        <th className="p-4">Expiry</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {licenses.map(lic => {
                                        const planInfo = PLAN_TYPES.find(p => p.id === lic.plan) || PLAN_TYPES[0];
                                        const expired = isExpired(lic.expiryDate);
                                        return (
                                            <tr key={lic.key} className={`group transition-colors ${lic.isActive ? 'hover:bg-slate-50' : 'bg-slate-100 opacity-60'}`}>
                                                <td className="p-4">
                                                    <div className="font-mono font-bold text-slate-700">{lic.key}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1"><User size={10}/> {lic.ownerName || 'Unknown'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <planInfo.icon size={16} className={planInfo.color} />
                                                        <span className="text-xs font-bold text-slate-700">{planInfo.label}</span>
                                                    </div>
                                                    {/* Feature Flags Mini */}
                                                    <div className="flex gap-1 mt-1">
                                                        {!lic.features?.aiGeneration && <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="No AI"/>}
                                                        {!lic.features?.exportPptx && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="No Export"/>}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs font-bold">{lic.currentUsage} / {lic.maxDevices}</div>
                                                    <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                                        <div className="h-full bg-brand-primary" style={{width: `${Math.min(100, (lic.currentUsage/lic.maxDevices)*100)}%`}}></div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {lic.expiryDate ? (
                                                        <div className={`text-xs font-bold flex items-center gap-1 ${expired ? 'text-red-500' : 'text-slate-600'}`}>
                                                            {expired && <AlertCircle size={12}/>}
                                                            {new Date(lic.expiryDate).toLocaleDateString()}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> 無期限</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleEdit(lic)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-lg shadow-sm transition-all" title="編集">
                                                            <Edit2 size={14}/>
                                                        </button>
                                                        <button onClick={() => handleToggle(lic.key, lic.isActive)} className={`p-2 rounded-lg border shadow-sm transition-all ${lic.isActive ? 'bg-white border-slate-200 text-green-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'bg-slate-200 border-transparent text-slate-500 hover:bg-green-50 hover:text-green-600'}`} title={lic.isActive ? "無効化する" : "有効化する"}>
                                                            <Power size={14}/>
                                                        </button>
                                                        <button onClick={() => handleDelete(lic.key)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-lg shadow-sm transition-all" title="削除">
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {licenses.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">ライセンスが見つかりません</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
