import { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Users as UsersIcon,
  Save,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import type { User, UserRole } from '../types';
import { getUsers, addUser, updateUser, updateUserPassword, deleteUser, getCurrentUser, formatDate } from '../store';

const emptyForm = {
  username: '',
  password: '',
  name: '',
  role: 'kasir' as UserRole,
  active: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setShowPassword(false);
    setChangePassword(false);
    setNewPassword('');
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditId(user.id);
    setForm({
      username: user.username,
      password: '', // Don't show hashed password
      name: user.name,
      role: user.role,
      active: user.active,
    });
    setError('');
    setShowPassword(false);
    setChangePassword(false);
    setNewPassword('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');

    if (!form.name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!form.username.trim()) {
      setError('Username wajib diisi');
      return;
    }

    setSaving(true);

    try {
      if (editId) {
        // Update user info (without password)
        updateUser(editId, {
          username: form.username.trim(),
          name: form.name.trim(),
          role: form.role,
          active: form.active,
        });

        // Change password if requested
        if (changePassword && newPassword.trim()) {
          if (newPassword.length < 6) {
            setError('Password minimal 6 karakter');
            setSaving(false);
            return;
          }
          await updateUserPassword(editId, newPassword);
        }
      } else {
        // Add new user
        if (!form.password.trim()) {
          setError('Password wajib diisi');
          setSaving(false);
          return;
        }
        if (form.password.length < 6) {
          setError('Password minimal 6 karakter');
          setSaving(false);
          return;
        }
        await addUser({
          username: form.username.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim(),
          role: form.role,
          active: form.active,
        });
      }

      setUsers(getUsers());
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengguna');
    }

    setSaving(false);
  };

  const handleDelete = (id: string) => {
    // Prevent deleting yourself
    if (currentUser && currentUser.id === id) {
      setDeleteConfirm(null);
      return;
    }
    deleteUser(id);
    setUsers(getUsers());
    setDeleteConfirm(null);
  };

  const toggleActive = (id: string, active: boolean) => {
    // Prevent deactivating yourself
    if (currentUser && currentUser.id === id) return;
    updateUser(id, { active: !active });
    setUsers(getUsers());
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const kasirCount = users.filter(u => u.role === 'kasir').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-500 mt-1">Kelola akun admin dan kasir</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Tambah Pengguna
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-primary-100 p-3 rounded-xl"><UsersIcon size={20} className="text-primary-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-xs text-gray-500">Total Pengguna</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-gold-100 p-3 rounded-xl"><ShieldCheck size={20} className="text-gold-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl"><Shield size={20} className="text-blue-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{kasirCount}</p>
            <p className="text-xs text-gray-500">Kasir</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-4 rounded-tl-2xl">Pengguna</th>
                <th className="px-5 py-4">Username</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Dibuat</th>
                <th className="px-5 py-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => {
                const isSelf = currentUser?.id === user.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          user.role === 'admin' 
                            ? 'bg-gradient-to-br from-gold-400 to-gold-600' 
                            : 'bg-gradient-to-br from-primary-400 to-primary-600'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          {isSelf && <span className="text-xs text-primary-600 font-medium">(Anda)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-gray-600">{user.username}</td>
                    <td className="px-5 py-4">
                      <span className={`badge flex items-center gap-1 w-fit ${
                        user.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? <><ShieldCheck size={12} /> Admin</> : <><Shield size={12} /> Kasir</>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(user.id, user.active)}
                        disabled={isSelf}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          user.active ? 'bg-emerald-500' : 'bg-gray-300'
                        } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          user.active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          disabled={isSelf}
                          title={isSelf ? 'Tidak bisa hapus akun sendiri' : 'Hapus'}
                        >
                          <Trash2 size={16} className={isSelf ? 'opacity-30' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UsersIcon size={22} /> {editId ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username *</label>
                <input
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className="input-field"
                  placeholder="Username untuk login"
                  maxLength={20}
                />
              </div>

              {/* Password for new user */}
              {!editId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input-field pr-10"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Change password for existing user */}
              {editId && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setChangePassword(!changePassword); setNewPassword(''); }}
                      className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Key size={12} /> {changePassword ? 'Batal ganti' : 'Ganti password'}
                    </button>
                  </div>
                  {!changePassword ? (
                    <p className="text-xs text-gray-400">Password terenkripsi. Klik "Ganti password" untuk mengubah.</p>
                  ) : (
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="Password baru (min 6 karakter)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                  className="input-field"
                >
                  <option value="admin">Admin</option>
                  <option value="kasir">Kasir</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Status Aktif:</label>
                <button
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.active ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    form.active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-500">{form.active ? 'Aktif' : 'Nonaktif'}</span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900">Hapus Pengguna?</h3>
            <p className="text-sm text-gray-500 mt-2">Pengguna yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
