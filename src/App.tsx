/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  FileSpreadsheet, 
  CheckSquare, 
  FolderCheck, 
  Users2, 
  FileText, 
  Building2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Coins, 
  ExternalLink,
  Sparkles,
  Info,
  Download,
  FileArchive,
  Check
} from 'lucide-react';
import { INITIAL_TENDERS } from './data/mockTenders';
import { BOQItem, ComplianceClause, Language, RequiredDocument, TenderProposal } from './types/tender';
import { Header } from './components/Header';
import { TenderTestModal } from './components/TenderTestModal';
import { BOQTable } from './components/BOQTable';
import { ComplianceMatrix } from './components/ComplianceMatrix';
import { DocumentChecklist } from './components/DocumentChecklist';
import { TeamMilestones } from './components/TeamMilestones';
import { ProposalPreview } from './components/ProposalPreview';
import { NewTenderModal } from './components/NewTenderModal';
import { calculateBOQSummary, runTenderAudit } from './utils/tenderAuditor';
import { downloadProjectZip } from './utils/zipDownloader';

type ActiveTab = 'test-lab' | 'boq' | 'compliance' | 'documents' | 'team' | 'preview';

export default function App() {
  const [tenders, setTenders] = useState<TenderProposal[]>(() => {
    const saved = localStorage.getItem('tb_tenders_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TENDERS;
      }
    }
    return INITIAL_TENDERS;
  });

  const [activeTenderId, setActiveTenderId] = useState<string>(() => {
    return tenders[0]?.id || 'tender-1';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('test-lab');
  const [lang, setLang] = useState<Language>('bn'); // Default to Bengali given the prompt "ei product ta test koro"
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isNewTenderOpen, setIsNewTenderOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipToast, setZipToast] = useState<string | null>(null);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    setZipToast(lang === 'bn' ? 'জিপ ফাইল প্রস্তুত ও ডাউনলোড হচ্ছে...' : 'Packaging and downloading tender-builder.zip...');
    try {
      await downloadProjectZip((msg) => setZipToast(msg));
      setTimeout(() => {
        setZipToast(lang === 'bn' ? 'ডাউনলোড সফল হয়েছে! (tender-builder.zip)' : 'Download ready! (tender-builder.zip)');
        setTimeout(() => setZipToast(null), 4000);
      }, 800);
    } catch (e) {
      setZipToast(lang === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed');
      setTimeout(() => setZipToast(null), 3000);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('tb_tenders_data', JSON.stringify(tenders));
  }, [tenders]);

  const activeTender = tenders.find((t) => t.id === activeTenderId) || tenders[0];

  const updateActiveTender = (updater: (prev: TenderProposal) => TenderProposal) => {
    setTenders((prev) =>
      prev.map((t) => (t.id === activeTender.id ? updater(t) : t))
    );
  };

  const handleUpdateBOQ = (newItems: BOQItem[]) => {
    updateActiveTender((t) => ({ ...t, boqItems: newItems }));
  };

  const handleUpdateClauses = (newClauses: ComplianceClause[]) => {
    updateActiveTender((t) => ({ ...t, complianceClauses: newClauses }));
  };

  const handleUpdateDocuments = (newDocs: RequiredDocument[]) => {
    updateActiveTender((t) => ({ ...t, documents: newDocs }));
  };

  const handleUpdatePersonnel = (newPersonnel: any[]) => {
    updateActiveTender((t) => ({ ...t, personnel: newPersonnel }));
  };

  const handleUpdateMilestones = (newMilestones: any[]) => {
    updateActiveTender((t) => ({ ...t, milestones: newMilestones }));
  };

  const handleResetDemoData = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি ডেমো ডেটা রিসেট করতে চান?' : 'Reset to initial sample tenders?')) {
      localStorage.removeItem('tb_tenders_data');
      setTenders(INITIAL_TENDERS);
      setActiveTenderId(INITIAL_TENDERS[0].id);
    }
  };

  const handleCreateTender = (newTender: TenderProposal) => {
    setTenders([newTender, ...tenders]);
    setActiveTenderId(newTender.id);
    setActiveTab('test-lab');
  };

  // Quick fix shortcuts from Test Lab
  const handleQuickFixDoc = (docId: string) => {
    setActiveTab('documents');
    updateActiveTender((t) => ({
      ...t,
      documents: t.documents.map((d) => (d.id === docId ? { ...d, status: 'verified' } : d)),
    }));
  };

  const handleQuickFixClause = (clauseId: string) => {
    setActiveTab('compliance');
    updateActiveTender((t) => ({
      ...t,
      complianceClauses: t.complianceClauses.map((c) =>
        c.id === clauseId ? { ...c, status: 'compliant', deviationNote: undefined } : c
      ),
    }));
  };

  const boqSummary = calculateBOQSummary(activeTender);
  const auditReport = runTenderAudit(activeTender);

  const deadlineDate = new Date(activeTender.submissionDeadline);
  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Navbar Header */}
      <Header
        tenders={tenders}
        activeTender={activeTender}
        onSelectTender={(id) => setActiveTenderId(id)}
        lang={lang}
        onToggleLang={() => setLang(lang === 'bn' ? 'en' : 'bn')}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenNewTender={() => setIsNewTenderOpen(true)}
        onResetDemoData={handleResetDemoData}
        onPrintProposal={() => setActiveTab('preview')}
        onDownloadZip={handleDownloadZip}
      />

      {/* Floating Download Toast */}
      {zipToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 border border-slate-700 shadow-xl flex items-center gap-3 text-xs animate-in fade-in duration-200">
          <Download className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{zipToast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tender Active Banner */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5">
                  REF: {activeTender.referenceNumber}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {activeTender.clientType} · {activeTender.clientName}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {lang === 'bn' ? 'দাখিল: ' : 'Deadline: '} {deadlineDate.toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft}d left` : 'Expired'})
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                {lang === 'bn' ? activeTender.titleBn || activeTender.title : activeTender.title}
              </h1>
            </div>

            {/* Quick Test / Evaluation Status Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  {lang === 'bn' ? 'হিসাবকৃত দর' : 'Calculated Bid'}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {activeTender.currency} {boqSummary.totalBidPrice.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 px-3 py-2 text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  {lang === 'bn' ? 'যোগ্যতা স্কোর' : 'Readiness'}
                </span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {auditReport.overallScore}/100
                </span>
              </div>

              <button
                onClick={() => setIsTestModalOpen(true)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm"
              >
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'bn' ? 'অডিট ও টেস্ট রানার' : 'Run Full Test Suite'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('test-lab')}
              className={`py-3 px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'test-lab'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <PlayCircle className={`w-4 h-4 ${activeTab === 'test-lab' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{lang === 'bn' ? '১. টেন্ডার টেস্ট ল্যাব' : '1. Test & Audit Lab'}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 ${
                auditReport.qualificationVerdict === 'QUALIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {auditReport.overallScore}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('boq')}
              className={`py-3 px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'boq'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              <span>{lang === 'bn' ? '২. বিওকিউ ও বাজেট' : '2. BOQ & Financials'}</span>
              <span className="text-[10px] font-mono bg-slate-100 px-1 text-slate-600">
                {activeTender.boqItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`py-3 px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'compliance'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>{lang === 'bn' ? '৩. শর্তাবলি কমপ্লায়েন্স' : '3. Compliance Matrix'}</span>
              <span className="text-[10px] font-mono bg-slate-100 px-1 text-slate-600">
                {activeTender.complianceClauses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'documents'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FolderCheck className="w-4 h-4 text-slate-400" />
              <span>{lang === 'bn' ? '৪. প্রয়োজনীয় নথিপত্র' : '4. Required Documents'}</span>
              <span className="text-[10px] font-mono bg-slate-100 px-1 text-slate-600">
                {activeTender.documents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`py-3 px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'team'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Users2 className="w-4 h-4 text-slate-400" />
              <span>{lang === 'bn' ? '৫. জনবল ও মাইলস্টোন' : '5. Team & Milestones'}</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-3 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'preview'
                  ? 'border-slate-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{lang === 'bn' ? '৬. প্রস্তাবনা ও প্রিন্ট' : '6. Proposal Preview'}</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="transition-all">
          {activeTab === 'test-lab' && (
            <div className="space-y-6">
              {/* Test Lab Intro Banner */}
              <div className="bg-slate-900 text-white p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                      BID EVALUATION ENGINE
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-xs text-slate-400 font-mono">PPR-2008 & FIDIC COMPLIANT</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {lang === 'bn' ? 'দরপত্র যোগ্যতা ও ঝুঁকি বিশ্লেষণ টেস্ট ল্যাব' : 'Tender Qualification & Risk Analysis Test Lab'}
                  </h2>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    {lang === 'bn' 
                      ? 'দরপত্র দাখিলের পূর্বে আইনি কাগজপত্র, ব্যাংক গ্যারান্টি, আরএফপি শর্তের সম্মতি, এবং বিওকিউ মুনাফার মার্জিন স্বয়ংক্রিয়ভাবে যাচাই করুন।'
                      : 'Audit mandatory documents, tender security earnest money, technical deviations, and margin thresholds before final procurement submission.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 px-5 transition-colors shadow-sm"
                >
                  <PlayCircle className="w-4 h-4 text-slate-950" />
                  <span>{lang === 'bn' ? 'সম্পূর্ণ টেস্ট রান করুন' : 'Launch Live Test Runner'}</span>
                </button>
              </div>

              {/* Dedicated Project Source Code ZIP Download Card */}
              <div className="bg-amber-50/70 border border-amber-300 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-amber-200/80 border border-amber-400 flex items-center justify-center shrink-0">
                    <FileArchive className="w-5 h-5 text-amber-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-950 text-sm">
                        {lang === 'bn' ? 'সম্পূর্ণ সোর্স কোড ZIP ফাইল (Download Project ZIP)' : 'Complete Source Code ZIP Package'}
                      </h3>
                      <span className="text-[10px] font-mono bg-amber-200/70 border border-amber-400 text-amber-950 px-1.5 py-0.2">
                        tender-builder.zip · ~85 KB
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {lang === 'bn' 
                        ? 'React 19, TypeScript, Tailwind CSS, BOQ ক্যালকুলেটর, কমপ্লায়েন্স ম্যাট্রিক্স এবং টেস্ট স্যুট সহ সম্পূর্ণ প্রজেক্টের জিপ ফাইল ডাউনলোড করুন।'
                        : 'Includes complete source code with React 19, TypeScript, Tailwind CSS, BOQ financial engine, and automated tender test suite.'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600">
                      <span className="bg-white/80 border border-slate-300 px-2 py-0.5">unzip tender-builder.zip</span>
                      <span>→</span>
                      <span className="bg-white/80 border border-slate-300 px-2 py-0.5">npm install</span>
                      <span>→</span>
                      <span className="bg-white/80 border border-slate-300 px-2 py-0.5">npm run dev</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 transition-colors shadow-sm shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>
                    {isDownloadingZip 
                      ? (lang === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Preparing ZIP...') 
                      : (lang === 'bn' ? 'জিপ ডাউনলোড করুন (.ZIP)' : 'Download ZIP Package')}
                  </span>
                </button>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Verdict */}
                <div className={`p-5 border flex flex-col justify-between ${
                  auditReport.qualificationVerdict === 'QUALIFIED'
                    ? 'bg-emerald-50 border-emerald-300'
                    : auditReport.qualificationVerdict === 'CONDITIONAL'
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-rose-50 border-rose-300'
                }`}>
                  <div>
                    <span className="text-[11px] font-mono text-slate-600 uppercase">
                      {lang === 'bn' ? 'মূল্যায়ন স্থিতি' : 'Verdict'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {auditReport.qualificationVerdict === 'QUALIFIED' && <ShieldCheck className="w-5 h-5 text-emerald-700" />}
                      {auditReport.qualificationVerdict === 'CONDITIONAL' && <AlertTriangle className="w-5 h-5 text-amber-700" />}
                      {auditReport.qualificationVerdict === 'DISQUALIFIED' && <XCircle className="w-5 h-5 text-rose-700" />}
                      <span className="font-bold text-base text-slate-950">
                        {auditReport.qualificationVerdict === 'QUALIFIED' && (lang === 'bn' ? 'যোগ্য (উত্তীর্ণ)' : 'QUALIFIED')}
                        {auditReport.qualificationVerdict === 'CONDITIONAL' && (lang === 'bn' ? 'শর্তসাপেক্ষ' : 'CONDITIONAL')}
                        {auditReport.qualificationVerdict === 'DISQUALIFIED' && (lang === 'bn' ? 'অযোগ্য' : 'DISQUALIFIED')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 mt-3 pt-2 border-t border-slate-300/60">
                    {auditReport.criticalIssuesCount} {lang === 'bn' ? 'টি গুরুতর ঘাটতি' : 'critical deficits'}
                  </span>
                </div>

                {/* 2. Overall Score */}
                <div className="bg-white p-5 border border-slate-200">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {lang === 'bn' ? 'সার্বিক যোগ্যতা স্কোর' : 'Readiness Index'}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-950">{auditReport.overallScore}</span>
                    <span className="text-xs text-slate-500 font-mono">/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 mt-2">
                    <div
                      className={`h-1.5 ${auditReport.overallScore >= 80 ? 'bg-emerald-600' : auditReport.overallScore >= 50 ? 'bg-amber-500' : 'bg-rose-600'}`}
                      style={{ width: `${auditReport.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* 3. Document Completeness */}
                <div className="bg-white p-5 border border-slate-200">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {lang === 'bn' ? 'নথিপত্রের প্রস্তুতি' : 'Document Check'}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-950">{auditReport.documentationScore}%</span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-2">
                    {activeTender.documents.filter(d => d.isMandatory && d.status === 'verified').length} / {activeTender.documents.filter(d => d.isMandatory).length} {lang === 'bn' ? 'নথি যাচাইকৃত' : 'verified'}
                  </span>
                </div>

                {/* 4. Margin & Budget Health */}
                <div className="bg-white p-5 border border-slate-200">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {lang === 'bn' ? 'মুনাফা ও বাজেট' : 'Margin Health'}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`text-2xl font-bold font-mono ${boqSummary.blendedMarginPercent < 8 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {boqSummary.blendedMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <span className={`text-xs block mt-2 ${boqSummary.isOverBudget ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                    {boqSummary.isOverBudget 
                      ? (lang === 'bn' ? 'বাজেট সীমা অতিক্রম করেছে!' : 'Over budget ceiling!') 
                      : (lang === 'bn' ? 'বাজেটের মধ্যে বিদ্যমান' : 'Within budget allocation')}
                  </span>
                </div>
              </div>

              {/* Interactive Audit Assertions Table */}
              <div className="bg-white border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-semibold text-slate-950 text-sm">
                      {lang === 'bn' ? 'অডিট মানদণ্ড ও টেস্ট ফলাফল' : 'Detailed Audit Assertions & Test Criteria'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'bn' ? 'যেকোনো অসঙ্গতি সংশোধন করতে ডানপাশের অপশনে ক্লিক করুন' : 'Click quick-action shortcuts to rectify compliance gaps immediately'}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsTestModalOpen(true)}
                    className="text-xs text-slate-700 hover:text-slate-950 font-medium border border-slate-300 py-1 px-2.5 bg-slate-50 hover:bg-slate-100"
                  >
                    {lang === 'bn' ? 'লাইভ কনসোল খুলুন' : 'Open Live Console'}
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {auditReport.checkItems.map((item) => (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {item.status === 'passed' && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                          {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                          {item.status === 'failed' && <XCircle className="w-5 h-5 text-rose-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {lang === 'bn' ? item.nameBn : item.nameEn}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 uppercase ${
                              item.status === 'passed' ? 'text-emerald-800 bg-emerald-50' : item.status === 'warning' ? 'text-amber-800 bg-amber-50' : 'text-rose-800 bg-rose-50'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {lang === 'bn' ? item.descriptionBn : item.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        {item.status !== 'passed' && (
                          <button
                            onClick={() => {
                              if (item.category === 'documentation' || item.category === 'security') setActiveTab('documents');
                              else if (item.category === 'compliance') setActiveTab('compliance');
                              else if (item.category === 'financial') setActiveTab('boq');
                              else if (item.category === 'personnel') setActiveTab('team');
                            }}
                            className="text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 transition-colors"
                          >
                            {lang === 'bn' ? 'সংশোধন ট্যাবে যান →' : 'Navigate to Tab →'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'boq' && (
            <BOQTable
              tender={activeTender}
              lang={lang}
              onUpdateBOQ={handleUpdateBOQ}
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceMatrix
              tender={activeTender}
              lang={lang}
              onUpdateClauses={handleUpdateClauses}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentChecklist
              tender={activeTender}
              lang={lang}
              onUpdateDocuments={handleUpdateDocuments}
            />
          )}

          {activeTab === 'team' && (
            <TeamMilestones
              tender={activeTender}
              lang={lang}
              onUpdatePersonnel={handleUpdatePersonnel}
              onUpdateMilestones={handleUpdateMilestones}
            />
          )}

          {activeTab === 'preview' && (
            <ProposalPreview
              tender={activeTender}
              lang={lang}
            />
          )}
        </div>
      </main>

      {/* Floating Modal for Live Tender Testing */}
      <TenderTestModal
        tender={activeTender}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        lang={lang}
        onQuickFixDoc={handleQuickFixDoc}
        onQuickFixClause={handleQuickFixClause}
      />

      {/* New Tender Proposal Modal */}
      <NewTenderModal
        isOpen={isNewTenderOpen}
        onClose={() => setIsNewTenderOpen(false)}
        lang={lang}
        onCreateTender={handleCreateTender}
      />
    </div>
  );
}
