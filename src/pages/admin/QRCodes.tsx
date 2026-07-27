import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Download, Printer, Copy, Share2, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getTables } from '../../services/dbService';
import { ProjectTable } from '../../types';
import { useToast } from '../../context/ToastContext';

export const QRCodes: React.FC = () => {
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const data = await getTables();
        setTables(data);
        if (data.length > 0) {
          setSelectedTableId(data[0].id);
        }
      } catch (err: any) {
        showToast('error', 'Error loading tables', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const registrationUrl = selectedTable ? `${window.location.origin}/table/${selectedTable.id}` : '';

  const handleCopy = () => {
    if (!registrationUrl) return;
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    showToast('success', 'Copied Link', 'Registration link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Groupy_QR_${selectedTable?.title || 'Table'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        showToast('success', 'Downloaded QR Code', 'Saved PNG file to downloads.');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && registrationUrl) {
      try {
        await navigator.share({
          title: selectedTable?.title || 'Groupy Project Table',
          text: 'Scan or click this link to register your stack for group assignment:',
          url: registrationUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">QR Codes & Links</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Export high-resolution registration QR codes and share links for your students.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-12 rounded-2xl animate-pulse h-64 bg-slate-200/50 dark:bg-slate-800/50" />
      ) : tables.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Tables Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please create a project table first in Table Management to generate registration QR codes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table Selector sidebar */}
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 mb-2">
              Select Table
            </h3>
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                  selectedTableId === table.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="font-semibold text-sm leading-tight">{table.title}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{table.courseCode} • {table.semester}</p>
                </div>
                <QrCode className="w-4 h-4 shrink-0" />
              </button>
            ))}
          </div>

          {/* QR Display Card */}
          {selectedTable && (
            <div className="lg:col-span-2 glass-card p-8 rounded-2xl text-center space-y-6 flex flex-col items-center justify-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {selectedTable.courseCode} • {selectedTable.semester}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{selectedTable.title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Students scan this QR code to submit their preferred stack and get assigned to a group.
                </p>
              </div>

              {/* QR Container */}
              <div ref={qrRef} className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/80 inline-block">
                <QRCodeSVG value={registrationUrl} size={220} level="H" includeMargin />
              </div>

              {/* Link Box */}
              <div className="w-full max-w-md p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate pl-2">{registrationUrl}</span>
                <a
                  href={registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  title="Open Link in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md inline-flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>

                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} Copy Link
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-2 transition-all"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
