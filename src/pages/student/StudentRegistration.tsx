import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layers, User, CheckCircle2, AlertCircle, ArrowRight, TableProperties, ShieldCheck, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getTableById,
  getStacks,
  registerAndAssignStudent,
  getGroupMembers,
  getTableSettings,
  getStudentById,
} from '../../services/dbService';
import { ProjectTable, TechStack, Student, TableSettings } from '../../types';
import { GroupyLogo } from '../../components/common/GroupyLogo';

export const StudentRegistration: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();

  const [table, setTable] = useState<ProjectTable | null>(null);
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [settings, setSettings] = useState<TableSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedStackId, setSelectedStackId] = useState('');

  // Result state (when submitted in current session)
  const [submissionResult, setSubmissionResult] = useState<{
    student: Student;
    groupNumber: number;
    stackName: string;
    groupMembers: Student[];
  } | null>(null);

  useEffect(() => {
    if (!tableId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [tableData, stacksData, settingsData] = await Promise.all([
          getTableById(tableId),
          getStacks(),
          getTableSettings(),
        ]);

        if (!tableData) {
          setError('Invalid or deleted project table QR code.');
          return;
        }

        if (tableData.status === 'closed' || tableData.status === 'archived') {
          setError('This registration table is currently closed by the administrator.');
          return;
        }

        setTable(tableData);
        const activeStacks = stacksData.filter((s) => s.enabled);
        if (tableData.allowedStackIds && tableData.allowedStackIds.length > 0) {
          setStacks(activeStacks.filter((s) => tableData.allowedStackIds!.includes(s.id)));
        } else {
          setStacks(activeStacks);
        }
        setSettings(settingsData);

        // Check if student already submitted in this session for this table
        const cachedSubmission = localStorage.getItem(`groupy_submitted_${tableId}`);
        if (cachedSubmission) {
          const parsed = JSON.parse(cachedSubmission);
          if (parsed.student && parsed.student.id) {
            // Verify if student still exists in database
            const freshStudent = await getStudentById(parsed.student.id);
            if (!freshStudent) {
              // Student was deleted from group by admin! Clear cache so they can re-register
              localStorage.removeItem(`groupy_submitted_${tableId}`);
            } else if (freshStudent.groupId) {
              const members = await getGroupMembers(freshStudent.groupId);
              setSubmissionResult({
                student: freshStudent,
                groupNumber: freshStudent.groupNumber,
                stackName: freshStudent.stackName,
                groupMembers: members,
              });
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load registration details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tableId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!table || !tableId) return;
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!selectedStackId) {
      setError('Please select your preferred tech stack.');
      return;
    }

    const selectedStack = stacks.find((s) => s.id === selectedStackId);
    if (!selectedStack) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await registerAndAssignStudent({
        tableId,
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        stackId: selectedStack.id,
        stackName: selectedStack.name,
      });

      // Load group members
      const members = await getGroupMembers(result.student.groupId!);

      const finalResult = {
        student: result.student,
        groupNumber: result.groupNumber,
        stackName: selectedStack.name,
        groupMembers: members,
      };

      setSubmissionResult(finalResult);

      // Save to localStorage to prevent duplicate submissions
      localStorage.setItem(`groupy_submitted_${tableId}`, JSON.stringify(finalResult));

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Student Registration Portal...</p>
        </div>
      </div>
    );
  }

  if (error && !table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl text-center space-y-4 border border-rose-200 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Registration Unavailable</h2>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-indigo-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl bg-white/95 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80 relative z-10 backdrop-blur-xl my-6">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-lg pointer-events-none" />
            <div className="relative">
              <GroupyLogo size={56} />
            </div>
          </div>

          {(table?.courseCode || table?.semester) && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                {[table?.courseCode, table?.semester].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{table?.title}</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 max-w-md mx-auto leading-relaxed">
            {table?.description || 'Select your preferred technology stack to be automatically assigned to a balanced project group.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* IF SUBMITTED: SHOW ASSIGNED GROUP RESULTS */}
        {submissionResult ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50/50 border border-indigo-200 text-center space-y-3.5 shadow-md relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300">
                  Registration Complete
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  {submissionResult.stackName} • Group {submissionResult.groupNumber}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-900 font-semibold mt-1">
                  Welcome aboard, <span className="font-extrabold text-indigo-600">{submissionResult.student.fullName}</span>!
                </p>
              </div>
            </div>

            {/* Group Members Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Your Assigned Group Teammates ({submissionResult.groupMembers.length})
                </h3>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm custom-scrollbar">
                <table className="w-full min-w-[440px] text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Tech Stack</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissionResult.groupMembers.map((m, idx) => (
                      <tr key={m.id} className={m.id === submissionResult.student.id ? 'bg-indigo-50/70 font-bold text-indigo-950' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{m.fullName}</span>
                          {m.id === submissionResult.student.id && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold inline-block">
                            {m.stackName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Assigned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-medium">
                You're all set! Note down your stack and group number for your class representative.
              </p>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {settings?.enableStudentId && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1.5">
                  Student Matrix / ID Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-98421"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2">
                Choose Preferred Tech Stack <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {stacks.map((s) => {
                  const isSelected = selectedStackId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStackId(s.id)}
                      className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border-2 border-indigo-600 text-slate-900 shadow-md ring-2 ring-indigo-500/10'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-500'
                          }`}
                        >
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{s.name}</p>
                          {s.description && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{s.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit & Get Group Assignment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-200 text-center flex items-center justify-center gap-2 text-[11px] text-slate-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Groupy Automated Balancing Engine • Powered by Class Representative</span>
        </div>
      </div>
    </div>
  );
};
