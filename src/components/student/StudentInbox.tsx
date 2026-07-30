import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Announcement, AnnouncementType } from '../../types';
import { Bell, X, Check, Megaphone, Clock, Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface StudentInboxProps {
  tableId: string;
}

export const StudentInbox: React.FC<StudentInboxProps> = ({ tableId }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`groupy_seen_announcements_${tableId}`) || '[]');
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<Announcement | null>(null);

  // Firestore real-time listener
  useEffect(() => {
    if (!tableId) return;

    // Listen to all announcements, sorted by date
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Announcement)
      );

      // Filter on client side to ensure security rules are happy and filter matches either 'all' or specific 'tableId'
      const filtered = allList.filter(
        (ann) => ann.targetType === 'all' || ann.targetId === tableId
      );

      // Check if there is a brand-new notification that was just added
      if (filtered.length > 0) {
        setAnnouncements((prev) => {
          // If the previous list was loaded and we see a new ID that isn't in prev
          if (prev.length > 0) {
            const firstNew = filtered[0];
            const isBrandNew = !prev.some((p) => p.id === firstNew.id);
            const isNotSeen = !seenIds.includes(firstNew.id);

            if (isBrandNew && isNotSeen) {
              // Trigger persistent toast overlay for the student!
              setActiveToast(firstNew);
            }
          }
          return filtered;
        });
      } else {
        setAnnouncements([]);
      }
    }, (error) => {
      console.warn('Student announcements subscription error:', error);
    });

    return () => unsubscribe();
  }, [tableId, seenIds]);

  // Handle marking an announcement as read
  const markAsSeen = (id: string) => {
    setSeenIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(`groupy_seen_announcements_${tableId}`, JSON.stringify(next));
      return next;
    });
  };

  const markAllAsSeen = () => {
    const allIds = announcements.map((a) => a.id);
    setSeenIds(allIds);
    localStorage.setItem(`groupy_seen_announcements_${tableId}`, JSON.stringify(allIds));
  };

  const unreadCount = announcements.filter((a) => !seenIds.includes(a.id)).length;

  const getStyles = (annType: AnnouncementType) => {
    switch (annType) {
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-500',
          bg: 'bg-blue-50/90 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800/40',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bg: 'bg-amber-50/90 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-800/40',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50/90 dark:bg-emerald-950/20',
          border: 'border-emerald-200 dark:border-emerald-800/40',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        };
      case 'alert':
        return {
          icon: ShieldAlert,
          color: 'text-rose-500',
          bg: 'bg-rose-50/90 dark:bg-rose-950/20',
          border: 'border-rose-200 dark:border-rose-800/40',
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
        };
    }
  };

  return (
    <>
      {/* FLOATING ACTION BELL BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 border border-indigo-400/20 cursor-pointer focus:outline-none"
        >
          <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-[11px] font-black text-white border-2 border-white flex items-center justify-center shadow-md">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* NEW PUSH NOTIFICATION PERSISTENT TOAST OVERLAY */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed bottom-24 right-6 z-50 max-w-sm w-full"
          >
            {(() => {
              const styles = getStyles(activeToast.type);
              const IconComp = styles.icon;
              return (
                <div className={`p-4 rounded-2xl shadow-xl border-l-4 border-l-current backdrop-blur-md flex flex-col gap-3 text-left ${styles.bg} ${styles.border} ${styles.color}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <IconComp className="w-5 h-5 shrink-0" />
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${styles.badge}`}>
                        New Alert
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        markAsSeen(activeToast.id);
                        setActiveToast(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {activeToast.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {activeToast.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-white/5">
                    <span className="text-[9px] text-slate-500 font-bold">
                      Just now • {activeToast.createdBy}
                    </span>
                    <button
                      onClick={() => {
                        markAsSeen(activeToast.id);
                        setActiveToast(null);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-200/50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* IN-APP INBOX DRAWERS PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Slideout Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 max-w-md w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Pitch Reminders Inbox</h3>
                    <p className="text-[10px] text-slate-500 font-bold">Real-time Instructor Broadcasts</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsSeen}
                      className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 rounded-lg border border-indigo-100 dark:border-indigo-900/40 cursor-pointer"
                    >
                      Read All
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Announcements List Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {announcements.length === 0 ? (
                  <div className="py-20 text-center space-y-3 max-w-xs mx-auto">
                    <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Inbox is empty</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Instructors will publish important pitch announcements, timing alerts, and notifications here. Keep this tab open during pitches!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {announcements.map((ann) => {
                      const isRead = seenIds.includes(ann.id);
                      const styles = getStyles(ann.type);
                      const IconComp = styles.icon;
                      
                      return (
                        <div
                          key={ann.id}
                          onClick={() => markAsSeen(ann.id)}
                          className={`p-4 rounded-2xl border transition-all relative overflow-hidden text-left flex flex-col gap-2 cursor-pointer ${
                            isRead
                              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-white/5 opacity-75 hover:opacity-100'
                              : 'bg-white dark:bg-slate-800/50 border-indigo-100 dark:border-indigo-900/30 shadow-xs hover:shadow-sm'
                          }`}
                        >
                          {/* Left indicator bar for unread notifications */}
                          {!isRead && (
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <IconComp className={`w-4 h-4 shrink-0 ${styles.color}`} />
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${styles.badge}`}>
                                {ann.type}
                              </span>
                            </div>

                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <h4 className={`text-xs font-black ${isRead ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                              {ann.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                              {ann.message}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[9px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                            <span>{ann.createdBy}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Info bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-white/5 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Connected to Firestore Real-time Stream
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
