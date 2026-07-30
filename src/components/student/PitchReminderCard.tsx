import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Download,
  Copy,
  Check,
  Megaphone,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Student } from '../../types';

interface PitchReminderCardProps {
  groupNumber: number;
  stackName: string;
  topic?: string;
  groupMembers: Student[];
  tableTitle?: string;
}

export const PitchReminderCard: React.FC<PitchReminderCardProps> = ({
  groupNumber,
  stackName,
  topic,
  groupMembers,
  tableTitle = 'Class Pitch Day',
}) => {
  const { showToast } = useToast();
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = `groupy_pitch_reminder_group_${groupNumber}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'true') {
      setNotifyEnabled(true);
      const toastShown = sessionStorage.getItem(`groupy_pitch_toast_shown_${groupNumber}`);
      if (!toastShown) {
        showToast(
          'info',
          `Pitch Reminder • Group ${groupNumber}`,
          `Remember: Your pitch topic is "${topic || 'Pending Assignment'}" (${stackName}).`
        );
        sessionStorage.setItem(`groupy_pitch_toast_shown_${groupNumber}`, 'true');
      }
    }
  }, [storageKey, groupNumber, topic, stackName, showToast]);

  const handleToggleNotification = async () => {
    if (notifyEnabled) {
      localStorage.removeItem(storageKey);
      setNotifyEnabled(false);
      showToast('info', 'Reminder Disabled', 'Pitch day device notification reminder turned off.');
      return;
    }

    // Try native browser notification if supported
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(`Groupy Pitch Reminder • Group ${groupNumber}`, {
            body: `Topic: ${topic || 'Pending Assignment'}\nTeammates: ${groupMembers.length} members (${stackName})`,
            icon: '/favicon.png',
          });
        }
      } catch (e) {
        console.warn('Native notification permission not available:', e);
      }
    }

    localStorage.setItem(storageKey, 'true');
    setNotifyEnabled(true);
    showToast(
      'success',
      'Pitch Reminder Active!',
      `You will receive alerts and reminders for Group ${groupNumber}'s pitch presentation.`
    );
  };

  const handleDownloadCalendarInvite = () => {
    const now = new Date();
    // Default pitch reminder target date: 7 days from now at 10:00 AM
    const targetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    targetDate.setHours(10, 0, 0, 0);
    const endDate = new Date(targetDate.getTime() + 60 * 60 * 1000);

    const formatDateICS = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';
    };

    const teamList = groupMembers.map((m, i) => `${i + 1}. ${m.fullName} (${m.stackName})`).join('\\n');
    const topicText = topic ? topic.replace(/(\r\n|\n|\r)/gm, ' ') : 'Topic pending instructor assignment';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Groupy//Pitch Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:groupy-pitch-group-${groupNumber}-${Date.now()}@groupy.app`,
      `DTSTAMP:${formatDateICS(now)}`,
      `DTSTART:${formatDateICS(targetDate)}`,
      `DTEND:${formatDateICS(endDate)}`,
      `SUMMARY:🎯 Pitch Presentation - Group ${groupNumber} (${stackName})`,
      `DESCRIPTION:Project Topic: ${topicText}\\n\\nAssigned Tech Stack: ${stackName}\\nGroup Number: Group ${groupNumber}\\n\\nTeammates:\\n${teamList}\\n\\nReminder: Please arrive 15 minutes early with your slides and working demo ready!`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Pitch Presentation in 30 minutes for Group ${groupNumber}!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Group_${groupNumber}_Pitch_Reminder.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    showToast(
      'success',
      'Calendar Invite Downloaded!',
      'Open the .ics file to add the pitch presentation reminder to your Google, Apple, or Outlook Calendar.'
    );
  };

  const handleCopyNotice = async () => {
    const text = [
      `🚀 *Groupy Pitch Day Reminder - Group ${groupNumber} (${stackName})*`,
      `📌 *Topic:* ${topic || 'To Be Announced'}`,
      `👥 *Teammates (${groupMembers.length}):* ${groupMembers.map((m) => m.fullName).join(', ')}`,
      `⏰ Let's coordinate our slides & demo ahead of pitch day!`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('success', 'Copied to Clipboard!', 'Share this pitch notice in your team WhatsApp or Telegram group.');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('error', 'Copy Failed', 'Could not access clipboard.');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/90 border border-amber-200/90 shadow-sm relative overflow-hidden space-y-4 text-left">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            {notifyEnabled ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Pitch Day Reminder
              </span>
              {notifyEnabled && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Be Ready to Present Your Pitch!
            </h3>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-amber-200/70 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Prepare a 3–5 min demo & presentation with your teammates.</span>
        </div>
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Verify your assigned project topic and stack roles ahead of time.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleToggleNotification}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
            notifyEnabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
          }`}
        >
          {notifyEnabled ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Reminder Active</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>Notify Me</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadCalendarInvite}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-50/80 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-amber-700" />
          <span>Add to Calendar</span>
        </button>

        <button
          type="button"
          onClick={handleCopyNotice}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-50/80 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-amber-700" />
              <span>Copy Team Notice</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
