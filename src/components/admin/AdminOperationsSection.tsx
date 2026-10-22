import React, { useState, useEffect /*, useRef */ } from 'react';
// import { QRCodeSVG } from 'qrcode.react';
import type { /* Booth, */ FAQItem, AppNotification } from '../../lib/types';
import type { WhitelistItem } from '../../services/adminService';
import adminService from '../../services/adminService';
import { faqService } from '../../services/faqService';
import { notificationsService } from '../../services/notificationsService';
import { parseLumaCsv, type CsvParseResult } from '../../lib/csvParser';
// import GdgKlLogo from '../common/GdgKlLogo';

type OperationsTab = 'import_csv' | 'whitelist' | 'broadcast' | 'faqs';

export const AdminOperationsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OperationsTab>('import_csv');

  // --- LUMA CSV IMPORT STATE ---
  const [csvText, setCsvText] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [clearExistingBeforeImport, setClearExistingBeforeImport] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /* --- BOOTH QR GENERATOR STATE ---
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<string>('b1');
  const [customBoothName, setCustomBoothName] = useState('');
  const [customBoothCode, setCustomBoothCode] = useState('');
  const [customBoothLocation, setCustomBoothLocation] = useState('Hall A - Partner Booth');
  const [customBoothPoints, setCustomBoothPoints] = useState(15);
  const printableRef = useRef<HTMLDivElement>(null);
  */

  // --- WALK-IN WHITELIST STATE ---
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newTicketType, setNewTicketType] = useState('Walk-in Attendee');
  const [newNotes, setNewNotes] = useState('');
  const [whitelistSearch, setWhitelistSearch] = useState('');
  const [whitelistTypeFilter, setWhitelistTypeFilter] = useState('ALL');
  const [whitelistFeedback, setWhitelistFeedback] = useState<string | null>(null);
  const [isSubmittingWhitelist, setIsSubmittingWhitelist] = useState(false);

  // --- BROADCAST NOTIFICATIONS STATE ---
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'organizer_announcement' | 'session_alert' | 'lucky_draw'>('organizer_announcement');
  const [notifTrack, setNotifTrack] = useState('All');
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [broadcastList, setBroadcastList] = useState<AppNotification[]>([]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // --- FAQ MANAGEMENT STATE ---
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Venue & Access');
  const [faqFeedback, setFaqFeedback] = useState<string | null>(null);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      const [/* fetchedBooths, */ fetchedWhitelist] = await Promise.all([
        // adminService.getBooths(),
        adminService.getWhitelistedEmails(),
      ]);
      // setBooths(fetchedBooths);
      setWhitelist(fetchedWhitelist);
      // if (fetchedBooths.length > 0) setSelectedBoothId(fetchedBooths[0].id);

      // Fetch FAQs
      try {
        const f = await faqService.getFAQs();
        if (f && f.length > 0) setFaqs(f);
      } catch (err) {
        console.warn('FAQ load err:', err);
      }

      // Fetch initial notifications
      try {
        const notifs = await notificationsService.getNotifications();
        if (notifs.notifications) setBroadcastList(notifs.notifications);
      } catch (err) {
        console.warn('Notifications load err:', err);
      }
    }
    loadData();
  }, []);

  // --- LUMA CSV HANDLERS ---
  const handleProcessCsv = (raw: string, filename?: string) => {
    setCsvText(raw);
    if (filename) setCsvFileName(filename);
    setImportFeedback(null);
    if (!raw.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseLumaCsv(raw);
    setParseResult(result);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      handleProcessCsv(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleLumaCsv = () => {
    const sample = `guest_id,name,first_name,last_name,email,phone_number,created_at,approval_status,checked_in_at,utm_source,utm_medium,utm_campaign,utm_term,utm_content,google_click_id,meta_click_id,x_click_id,linkedin_click_id,tiktok_click_id,reddit_click_id,yandex_click_id,referrer,referred_by,qr_code_url,amount,amount_tax,amount_discount,currency,coupon_code,eth_address,solana_address,survey_response_rating,survey_response_feedback,ticket_type_id,ticket_name,Job Title,Company / Institution,T-Shirt Size (Standard Sizing)
gst-auuQTTSMZ4kELVH,Min Han Lai,Min Han,Lai,2004laiminhan@gmail.com,,2026-10-18T15:00:21.753Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=qgbP7Ial653qHmL,MYR 0.00,MYR 0.00,"MYR 99,999.00",myr,TEST123,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Jiayong slaves,UM,L
gst-wDzb1PMM9xEf4q2,AnnexHub Test XXL,,,nick+devfest-test-xxl@annexcs.com,,2026-10-18T04:05:24.786Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=Pjf1ILLngSoqvBI,$0.00,$0.00,$0.00,usd,,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Tester,AnnexHub,XXL
gst-rwm7DCuCkbrslue,Siti,Siti,,nick+devfest-test-single@annexcs.com,,2026-10-18T04:05:24.786Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=OKDi6WKqRmPxbfX,$0.00,$0.00,$0.00,usd,,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Developer,Google Developer Space,S
gst-qFK4DI0tM1IUl9w,AnnexHub Test M,,,nick+devfest-test-m@annexcs.com,,2026-10-18T04:05:24.772Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=En4d2k64CS4KnFX,$0.00,$0.00,$0.00,usd,,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Cloud Architect,AnnexHub,M
gst-QJ3TOhmQkCwNhZ9,AnnexHub Test L,,,nick+devfest-test-l@annexcs.com,,2026-10-18T04:05:24.772Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=ckHCKB9WlMLJLAr,$0.00,$0.00,$0.00,usd,,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Tech Lead,AnnexHub,L
gst-p4fe7w6uzpMG8jP,AnnexHub Test 3XL,,,nick+devfest-test-3xl@annexcs.com,,2026-10-18T04:05:24.772Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=ujH3sWGx29aLRMB,$0.00,$0.00,$0.00,usd,,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Full Stack,AnnexHub,3XL
gst-EML4PlfvWqls3Qb,AnnexHub Test XS,,,nick+devfest-test-xs@annexcs.com,,2026-10-18T04:05:24.774Z,approved,,,,,,,,,,,,,,,,https://luma.com/check-in/evt-Oe2V97Qj3BoILBV?pk=eVmNa3TNpKzpHI4,$0.00,$0.00,$0.00,usd,,,,,,ttype-QdJ2ECNwbVaPD39,Standard,Tester,AnnexHub,XS`;
    setInputMode('paste');
    handleProcessCsv(sample, 'luma_sample_export.csv');
  };

  const handleExecuteImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;
    setIsImporting(true);
    setImportProgress({ current: 0, total: parseResult.validRows.length });
    setImportFeedback(null);

    try {
      const res = await adminService.importWhitelistRows(parseResult.validRows, {
        clearExisting: clearExistingBeforeImport,
        onProgress: (current, total) => setImportProgress({ current, total }),
      });

      setIsImporting(false);
      setImportProgress(null);

      if (res.success) {
        setImportFeedback({ type: 'success', message: res.message });
        const updatedWl = await adminService.getWhitelistedEmails();
        setWhitelist(updatedWl);
      } else {
        setImportFeedback({ type: 'error', message: res.message || 'Import failed.' });
      }
    } catch (err: any) {
      setIsImporting(false);
      setImportProgress(null);
      setImportFeedback({ type: 'error', message: err?.message || 'Network error during import.' });
    }
  };

  const handleClearCsv = () => {
    setCsvText('');
    setCsvFileName(null);
    setParseResult(null);
    setImportFeedback(null);
  };

  // Handler: Add Walk-in
  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsSubmittingWhitelist(true);
    setWhitelistFeedback(null);

    const res = await adminService.addWalkInWhitelist(newEmail, newTicketType, newNotes);
    setIsSubmittingWhitelist(false);
    setWhitelistFeedback(res.message);

    if (res.success && res.item) {
      setWhitelist((prev) => [res.item!, ...prev]);
      setNewEmail('');
      setNewNotes('');
      setTimeout(() => setWhitelistFeedback(null), 5000);
    }
  };

  // Handler: Remove Walk-in
  const handleRemoveWalkin = async (id: string) => {
    const ok = await adminService.removeWhitelistedEmail(id);
    if (ok) {
      setWhitelist((prev) => prev.filter((w) => w.id !== id));
    }
  };

  // Handler: Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setIsSendingBroadcast(true);
    setBroadcastFeedback(null);

    const res = await adminService.broadcastNotification(notifTitle, notifMessage, notifType, notifTrack);
    setIsSendingBroadcast(false);
    setBroadcastFeedback(res.message);

    if (res.success && res.notification) {
      setBroadcastList((prev) => [res.notification!, ...prev]);
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setBroadcastFeedback(null), 5000);
    }
  };

  // Handler: Delete Broadcast
  const handleDeleteBroadcast = async (id: string) => {
    const ok = await adminService.deleteNotification(id);
    if (ok) {
      setBroadcastList((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Handler: Add FAQ
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;

    const res = await adminService.createFaq({
      question: faqQuestion,
      answer: faqAnswer,
      category: faqCategory,
    });
    setFaqFeedback(res.message);

    if (res.success && res.item) {
      setFaqs((prev) => [...prev, res.item!]);
      setFaqQuestion('');
      setFaqAnswer('');
      setTimeout(() => setFaqFeedback(null), 5000);
    }
  };

  // Handler: Edit FAQ
  const handleSaveEditFaq = async (id: string, category: string) => {
    const ok = await adminService.updateFaq(id, {
      question: editQuestion,
      answer: editAnswer,
      category,
    });
    if (ok) {
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, question: editQuestion, answer: editAnswer } : f))
      );
      setEditingFaqId(null);
    }
  };

  // Handler: Delete FAQ
  const handleDeleteFaq = async (id?: string) => {
    if (!id) return;
    const ok = await adminService.deleteFaq(id);
    if (ok) {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    }
  };

  /*
  // Current active booth for QR generation
  const rawActiveBooth = booths.find((b) => b.id === selectedBoothId);
  const activeBooth: Booth = rawActiveBooth
    ? {
        ...rawActiveBooth,
        boothCode:
          rawActiveBooth.boothCode ||
          (rawActiveBooth as any).booth_code ||
          'BOOTH-DEVFEST',
      }
    : {
        id: 'custom',
        name: customBoothName || 'DevFest Partner Booth',
        category: 'Sponsor & Partner',
        location: customBoothLocation,
        boothCode: customBoothCode || 'BOOTH-DEVFEST',
        points: customBoothPoints,
        description: 'Scan this QR code with the DevFest KL 2026 PWA to claim your booth stamp!',
      };

  const handlePrintPoster = () => {
    window.print();
  };
  */

  return (
    <div className="space-y-6">
      {/* Subnavigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'import_csv', label: '📥 Import Luma CSV', desc: 'Sync guests & QR codes' },
          { id: 'whitelist', label: '📝 Walk-in Whitelist', desc: 'Add attendee tickets' },
          { id: 'broadcast', label: '📢 Broadcast Notifications', desc: 'Live announcements' },
          { id: 'faqs', label: '❓ Update Event FAQs', desc: 'Attendee helper info' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OperationsTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. BOOTH QR GENERATOR SECTION (COMMENTED OFF) */}
      {/* ========================================================================= */}
      {/*
      (activeTab as any) === 'booth_qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          // Controls Form
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Booth QR Code & Stamp Poster Generator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates high-res vector QR codes encoded with booth tokens for attendees to scan and collect stamp rewards.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Select Registered Booth:
                </label>
                <select
                  value={selectedBoothId}
                  onChange={(e) => setSelectedBoothId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {booths.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.location}) • {b.category}
                    </option>
                  ))}
                  <option value="custom">+ Create Custom / New Booth</option>
                </select>
              </div>

              {selectedBoothId === 'custom' && (
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono">
                      Booth Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Android Developers Lounge"
                      value={customBoothName}
                      onChange={(e) => setCustomBoothName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono">
                      Booth Stamp Payload / Code:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BOOTH-ANDROID-DEV"
                      value={customBoothCode}
                      onChange={(e) => setCustomBoothCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono">
                        Location:
                      </label>
                      <input
                        type="text"
                        placeholder="Hall B - #08"
                        value={customBoothLocation}
                        onChange={(e) => setCustomBoothLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono">
                        Stamp Points:
                      </label>
                      <input
                        type="number"
                        value={customBoothPoints}
                        onChange={(e) => setCustomBoothPoints(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>QR Scan Payload:</span>
                  <span className="text-emerald-400 font-bold">{activeBooth.boothCode}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>Stamp Reward:</span>
                  <span className="text-amber-300 font-bold">+{activeBooth.points || 15} Points</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintPoster}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Official Booth Standee</span>
                </button>
              </div>
            </div>
          </div>

          // High-Resolution Printable Standee Card Preview
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={printableRef}
              className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 border-4 border-slate-900 shadow-2xl space-y-6 text-center"
            >
              // DevFest Header
              <div className="space-y-1">
                <div className="flex justify-center mb-1">
                  <GdgKlLogo />
                </div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded-full uppercase tracking-wider">
                  DevFest KL 2026 • Official Partner
                </span>
                <h2 className="text-2xl font-black text-slate-950 font-heading pt-1">
                  {activeBooth.name}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {activeBooth.location} • {activeBooth.category}
                </p>
              </div>

              // Vector QR Code
              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 inline-block mx-auto shadow-inner">
                <QRCodeSVG
                  value={activeBooth.boothCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="mx-auto"
                />
              </div>

              // Scan Callout
              <div className="space-y-2 bg-slate-100 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-center gap-1.5 font-extrabold text-sm text-slate-900">
                  <span>📱 Scan with DevFest App</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Open the <strong>DevFest KL PWA</strong> on your phone &gt; tap <strong>Scan QR</strong> to stamp your badge and unlock blind box rewards!
                </p>
                <div className="font-mono text-[11px] text-emerald-700 font-bold">
                  Code: {activeBooth.boothCode} • Earn {activeBooth.points || 15} Stamp Points
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      */}

      {/* ========================================================================= */}
      {/* 0. LUMA CSV IMPORT SECTION */}
      {/* ========================================================================= */}
      {activeTab === 'import_csv' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📥</span>
                <h3 className="text-base font-bold text-white font-heading">
                  Luma Attendee CSV Importer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  Auto-sync Whitelist & QR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Upload your guest export from Luma. The system automatically maps guest IDs, attendee names, company & job titles, ticket categories, and preserves their official Luma QR codes for networking and badge scanning.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLoadSampleLumaCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title="Populate form with sample test data matching Luma CSV layout"
              >
                <span>🧪</span>
                <span>Load Sample CSV</span>
              </button>
              {(csvText || parseResult) && (
                <button
                  type="button"
                  onClick={handleClearCsv}
                  className="px-3 py-2 bg-slate-950 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800/40 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Feedback Banner */}
          {importFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                importFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{importFeedback.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{importFeedback.message}</span>
              </div>
              {importFeedback.type === 'success' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('whitelist')}
                  className="px-3 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  View Whitelist ({whitelist.length}) →
                </button>
              )}
            </div>
          )}

          {/* Main Grid: Input Source on Left, Parsed Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Input Selection */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
              {/* Input Mode Selector */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📁 Upload .csv File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    inputMode === 'paste'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📋 Paste CSV Text
                </button>
              </div>

              {inputMode === 'upload' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    const input = document.getElementById('csv-file-picker') as HTMLInputElement;
                    input?.click();
                  }}
                >
                  <input
                    id="csv-file-picker"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-2xl mb-3 shadow-inner">
                    📄
                  </div>
                  <p className="text-xs font-bold text-white mb-1">
                    {csvFileName ? (
                      <span className="text-emerald-400 font-mono">{csvFileName}</span>
                    ) : (
                      'Click to select or drag & drop Luma CSV'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports exports with guest_id, email, qr_code_url, etc.
                  </p>
                  {csvFileName && (
                    <span className="mt-3 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                      ✓ File loaded
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300 font-mono">Paste CSV Raw Text:</label>
                    <span className="text-[10px] text-slate-500">First line must be header</span>
                  </div>
                  <textarea
                    rows={9}
                    placeholder="guest_id,name,email,qr_code_url,ticket_name,Job Title,Company / Institution..."
                    value={csvText}
                    onChange={(e) => handleProcessCsv(e.target.value, 'pasted_data.csv')}
                    className="w-full p-3 bg-slate-950 text-xs text-white font-mono rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 resize-y"
                  />
                </div>
              )}

              {/* Import Options & Action */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clearExistingBeforeImport}
                    onChange={(e) => setClearExistingBeforeImport(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-300">
                    Clear existing whitelist before importing (replace mode)
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!parseResult || parseResult.validRows.length === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>
                        Importing {importProgress ? `${importProgress.current} / ${importProgress.total}` : '...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>
                        {parseResult && parseResult.validRows.length > 0
                          ? `Import ${parseResult.validRows.length} Attendee(s) to Whitelist`
                          : 'Load CSV to Begin Import'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Detected Schema & Data Preview */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white font-heading">
                    Parsed Whitelist Preview
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {parseResult
                      ? `${parseResult.validRows.length} valid attendee(s) ready for upsert`
                      : 'No CSV parsed yet'}
                  </p>
                </div>

                {parseResult && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      {parseResult.validRows.length} Valid
                    </span>
                    {parseResult.invalidRows.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                        {parseResult.invalidRows.length} Skipped
                      </span>
                    )}
                  </div>
                )}
              </div>

              {parseResult ? (
                <div className="space-y-4">
                  {/* Column Detection Chips */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      Detected Columns Mapped:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(parseResult.detectedColumns).map(([key, colName]) => (
                        <span
                          key={key}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            colName
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {colName ? `✓ ${key} (${colName})` : `✗ ${key}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preview Table (First 5 rows) */}
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">Attendee</th>
                          <th className="py-2 px-2.5">Email</th>
                          <th className="py-2 px-2.5">Ticket</th>
                          <th className="py-2 px-2.5">Company / Role</th>
                          <th className="py-2 px-2.5">Luma QR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parseResult.validRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2 px-2.5 font-bold text-white">
                              {row.full_name || '—'}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-[11px] text-emerald-300">
                              {row.email}
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                                {row.ticket_type || 'Standard'}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-[11px] text-slate-400">
                              {[row.job_title, row.company].filter(Boolean).join(' • ') || '—'}
                            </td>
                            <td className="py-2 px-2.5">
                              {row.qr_payload ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono">
                                  Luma QR ✓
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parseResult.validRows.length > 5 && (
                    <p className="text-[11px] text-slate-500 font-mono text-center">
                      + {parseResult.validRows.length - 5} more attendee row(s) will be imported
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <div className="text-3xl">📥</div>
                  <p className="text-xs">
                    Select a CSV file or paste attendee CSV data to see the pre-import preview.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WALK-IN EMAIL WHITELIST SECTION */}
      {/* ========================================================================= */}
      {activeTab === 'whitelist' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add Walk-in Form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Walk-In Attendee Whitelister
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Instantly authorize walk-in attendees at the registration counter so they can register and log in on their mobile phones.
              </p>
            </div>

            <form onSubmit={handleAddWalkIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Attendee Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="attendee@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Ticket Category:
                </label>
                <select
                  value={newTicketType}
                  onChange={(e) => setNewTicketType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="Walk-in Attendee">Walk-in Attendee (On-site Counter)</option>
                  <option value="Standard Attendee">Standard Attendee (Peatix)</option>
                  <option value="VIP Attendee">VIP Attendee</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Core Team">Core Team (Admin Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Counter Notes / External Ref:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter 1 Walk-in • Cash paid"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {whitelistFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  {whitelistFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingWhitelist}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWhitelist ? 'Authorizing...' : '+ Authorize Walk-in Ticket'}
              </button>
            </form>
          </div>

          {/* Whitelisted Attendees Table */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Whitelisted Attendees ({whitelist.length})
                </h4>
                <p className="text-[11px] text-slate-400">Authorized for registration and login</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('import_csv')}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📥</span>
                  <span>Import Luma CSV</span>
                </button>
                <input
                  type="text"
                  placeholder="Search email, name, notes..."
                  value={whitelistSearch}
                  onChange={(e) => setWhitelistSearch(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 text-xs text-white rounded-lg border border-slate-800 max-w-[180px]"
                />
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'Walk-in Attendee', label: 'Walk-in' },
                { id: 'Standard Attendee', label: 'Standard' },
                { id: 'VIP Attendee', label: 'VIP' },
                { id: 'Core Team', label: 'Core Team' },
              ].map((tab) => {
                const count =
                  tab.id === 'ALL'
                    ? whitelist.length
                    : whitelist.filter((w) => w.ticket_type === tab.id).length;
                const isSelected = whitelistTypeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setWhitelistTypeFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Email & Attendee</th>
                    <th className="py-2.5 px-3">Ticket Type</th>
                    <th className="py-2.5 px-3">Ref / Notes</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {whitelist
                    .filter((w) => {
                      const matchesCategory =
                        whitelistTypeFilter === 'ALL' || w.ticket_type === whitelistTypeFilter;
                      const q = whitelistSearch.toLowerCase();
                      const matchesSearch =
                        !q ||
                        w.email.toLowerCase().includes(q) ||
                        w.ticket_type.toLowerCase().includes(q) ||
                        (w.full_name && w.full_name.toLowerCase().includes(q)) ||
                        (w.company && w.company.toLowerCase().includes(q)) ||
                        (w.notes && w.notes.toLowerCase().includes(q)) ||
                        (w.external_ref_id && w.external_ref_id.toLowerCase().includes(q));
                      return matchesCategory && matchesSearch;
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-medium text-white">{item.email}</div>
                          {(item.full_name || item.job_title || item.company) && (
                            <div className="text-[11px] text-slate-400">
                              {item.full_name}
                              {item.job_title ? ` • ${item.job_title}` : ''}
                              {item.company ? ` at ${item.company}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.ticket_type === 'Core Team'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : item.ticket_type === 'VIP Attendee'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : item.ticket_type === 'Speaker'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : item.ticket_type === 'Walk-in Attendee'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : item.ticket_type === 'Organizer'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : item.ticket_type === 'Sponsor'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {item.ticket_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          <div className="truncate max-w-[160px]">{item.notes || item.external_ref_id || '—'}</div>
                          {item.qr_payload && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono">
                              Luma QR ✓
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleRemoveWalkin(item.id)}
                            className="text-red-400 hover:text-red-300 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Revoke access"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BROADCAST NOTIFICATIONS SECTION */}
      {/* ========================================================================= */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Broadcast Composer */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Broadcast Conference Notification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dispatches urgent announcements, room changes, or lucky draw calls to all connected attendee devices.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Broadcast Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🎁 Lucky Draw Starting in Main Auditorium!"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Announcement Message *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Head over to the stage with your completed stamp card to participate..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                    Category:
                  </label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="organizer_announcement">Organizer Announcement</option>
                    <option value="session_alert">Session Alert</option>
                    <option value="lucky_draw">Lucky Draw / Rewards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                    Target Track:
                  </label>
                  <select
                    value={notifTrack}
                    onChange={(e) => setNotifTrack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All">All Attendees</option>
                    <option value="AI / ML">Track 1: AI / ML</option>
                    <option value="Cloud & DevOps">Track 2: Cloud</option>
                    <option value="Web & Mobile">Track 3: Web & Mobile</option>
                  </select>
                </div>
              </div>

              {broadcastFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  {broadcastFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingBroadcast}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>📡</span>
                <span>{isSendingBroadcast ? 'Dispatching...' : 'Dispatch Live Broadcast'}</span>
              </button>
            </form>
          </div>

          {/* Broadcast Feed History */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white font-heading">
                Broadcast History ({broadcastList.length})
              </h4>
              <p className="text-[11px] text-slate-400">Live announcements dispatched to attendee devices</p>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {broadcastList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No announcements sent yet.</p>
              ) : (
                broadcastList.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
                        {notif.type} • Track: {notif.targetTrack || 'All'}
                      </span>
                      <button
                        onClick={() => handleDeleteBroadcast(notif.id)}
                        className="text-slate-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-snug">{notif.title}</h5>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono block pt-1">
                      Sent {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. UPDATE FAQS SECTION */}
      {/* ========================================================================= */}
      {activeTab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add FAQ Form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Add / Update Conference FAQ
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Updates event questions, directions, and guidelines shown in the Attendee Help & Info module.
              </p>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Category:
                </label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Venue & Access">Venue & Access</option>
                  <option value="Peatix & Tickets">Peatix & Tickets</option>
                  <option value="WiFi & Apps">WiFi & Apps</option>
                  <option value="Booths & Prizes">Booths & Prizes</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Where are the prayer rooms located?"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                  Answer *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Level 3 near Grand Ballroom Hall A, signs are posted outside..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {faqFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  {faqFeedback}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                + Publish FAQ to Attendee App
              </button>
            </form>
          </div>

          {/* Current FAQs List & Inline Editor */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white font-heading">
                Published Event FAQs ({faqs.length})
              </h4>
              <p className="text-[11px] text-slate-400">Instantly synced with attendee mobile devices</p>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {faqs.map((f, idx) => {
                const isEditing = editingFaqId === (f.id || `f-${idx}`);

                return (
                  <div
                    key={f.id || idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {f.category}
                      </span>

                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => {
                              setEditingFaqId(f.id || `f-${idx}`);
                              setEditQuestion(f.question);
                              setEditAnswer(f.answer);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingFaqId(null)}
                            className="text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFaq(f.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {!isEditing ? (
                      <>
                        <h5 className="text-xs font-bold text-white">{f.question}</h5>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">{f.answer}</p>
                      </>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-700"
                        />
                        <textarea
                          rows={2}
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 resize-none"
                        />
                        <button
                          onClick={() => handleSaveEditFaq(f.id || `f-${idx}`, f.category)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOperationsSection;
