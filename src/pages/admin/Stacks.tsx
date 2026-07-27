import React, { useEffect, useState } from 'react';
import { Layers, Plus, Edit3, Trash2, Power, Check, Shield, Server, Layout, BarChart2, Figma, Cpu, HardDrive } from 'lucide-react';
import { getStacks, createStack, updateStack, deleteStack } from '../../services/dbService';
import { TechStack } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';

export const Stacks: React.FC = () => {
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<TechStack | null>(null);
  const [stackToDelete, setStackToDelete] = useState<TechStack | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('Layout');

  const { showToast } = useToast();

  const fetchStacks = async () => {
    try {
      setLoading(true);
      const data = await getStacks();
      setStacks(data);
    } catch (err: any) {
      showToast('error', 'Failed to load stacks', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingStack) {
        await updateStack(editingStack.id, { name, description, color, icon });
        showToast('success', 'Stack Updated', `Updated ${name}`);
      } else {
        await createStack({ name, description, color, icon, enabled: true });
        showToast('success', 'Stack Created', `Added ${name} tech stack`);
      }
      setIsModalOpen(false);
      setEditingStack(null);
      resetForm();
      fetchStacks();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor('indigo');
    setIcon('Layout');
  };

  const handleToggleEnable = async (stack: TechStack) => {
    try {
      await updateStack(stack.id, { enabled: !stack.enabled });
      showToast('info', 'Status Changed', `${stack.name} is now ${!stack.enabled ? 'enabled' : 'disabled'}`);
      fetchStacks();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const confirmDelete = async () => {
    if (!stackToDelete) return;
    try {
      await deleteStack(stackToDelete.id);
      showToast('success', 'Stack Deleted', `Removed stack "${stackToDelete.name}"`);
      setStackToDelete(null);
      fetchStacks();
    } catch (err: any) {
      showToast('error', 'Error deleting stack', err.message);
    }
  };

  const colorOptions = ['indigo', 'blue', 'rose', 'emerald', 'purple', 'amber', 'cyan', 'pink'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Technology Stacks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage tech stacks available for student selection during QR registration.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingStack(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Stack</span>
        </button>
      </div>

      {/* Stacks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl h-36 animate-pulse bg-slate-200/50 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stacks.map((stack) => (
            <div
              key={stack.id}
              className={`glass-card p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
                !stack.enabled ? 'opacity-50 grayscale' : 'border-slate-200/60 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{stack.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{stack.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleEnable(stack)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    stack.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  }`}
                  title={stack.enabled ? 'Disable Stack' : 'Enable Stack'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Status: {stack.enabled ? <strong className="text-emerald-600 dark:text-emerald-400">Active</strong> : <strong className="text-rose-500">Disabled</strong>}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingStack(stack);
                      setName(stack.name);
                      setDescription(stack.description || '');
                      setColor(stack.color || 'indigo');
                      setIcon(stack.icon || 'Layout');
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStackToDelete(stack)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                    title="Delete Stack"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStack(null);
        }}
        title={editingStack ? 'Edit Tech Stack' : 'New Tech Stack'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Stack Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Flutter, React Native, iOS & Android"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full bg-${c}-500 flex items-center justify-center border-2 ${
                    color === c ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/40 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
            >
              {editingStack ? 'Update Stack' : 'Create Stack'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!stackToDelete}
        onClose={() => setStackToDelete(null)}
        title="Confirm Stack Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete the tech stack{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{stackToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            ⚠️ Students will no longer be able to select this stack during QR code table registration.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/40 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStackToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
            >
              Delete Stack
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
