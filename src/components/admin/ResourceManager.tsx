import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Calendar, 
  Headphones, 
  BookOpen, 
  PenTool, 
  ShieldCheck, 
  Database, 
  Server, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Trash2,
  Lock,
  Sparkles,
  Info,
  Archive
} from 'lucide-react';
import { 
  ExamResourcePackage, 
  ExamAnswerKeyPackage,
  validateExamPackage,
  PackageValidationReport 
} from '../../types/resources';
import { 
  getAllPackagesForAdmin, 
  getAnswerKeysForAdmin, 
  saveExamPackage, 
  assignPackageToSessionExclusively,
  unassignPackageFromSession,
  deleteExamPackage,
  checkStorageConfiguration,
  StorageReadinessReport,
  DEFAULT_EXAM_PACKAGE
} from '../../lib/resourceService';
import { DEFAULT_EXAM_KEYS } from '../../lib/adminExamKeys';

import { ResourcePreviewModal } from './ResourcePreviewModal';
import { ResourceImportWizard } from './ResourceImportWizard';

export const ResourceManager: React.FC = () => {
  const [packages, setPackages] = useState<ExamResourcePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<ExamResourcePackage | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<ExamAnswerKeyPackage | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validationReport, setValidationReport] = useState<{
    pkgId: string;
    report: PackageValidationReport;
  } | null>(null);

  // Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ExamResourcePackage | null>(null);
  const [showJsonImportModal, setShowJsonImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Storage Diagnostics
  const [storageInfo, setStorageInfo] = useState<StorageReadinessReport | null>(null);
  const [showStorageGuide, setShowStorageGuide] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedCors, setCopiedCors] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load packages and storage diagnostics
  const refreshCatalog = async () => {
    setLoading(true);
    try {
      const all = await getAllPackagesForAdmin();
      setPackages(all);
      const storageReport = checkStorageConfiguration();
      setStorageInfo(storageReport);
    } catch (err) {
      console.error('Failed to load packages catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  const handleOpenPreview = async (pkg: ExamResourcePackage) => {
    setSelectedPackage(pkg);
    const keys = await getAnswerKeysForAdmin(pkg.id);
    setSelectedKeys(keys);
    setPreviewOpen(true);
  };

  const handleValidate = async (pkg: ExamResourcePackage) => {
    const keys = await getAnswerKeysForAdmin(pkg.id);
    const report = validateExamPackage(pkg, keys);
    setValidationReport({ pkgId: pkg.id, report });
  };

  const handleTogglePublish = async (pkg: ExamResourcePackage) => {
    const nextStatus = pkg.status === 'published' ? 'draft' : 'published';
    const keys = await getAnswerKeysForAdmin(pkg.id);
    
    // Check validation if trying to publish
    if (nextStatus === 'published') {
      const report = validateExamPackage(pkg, keys);
      if (!report.canPublish) {
        setValidationReport({ pkgId: pkg.id, report });
        setActionNotice(`Cannot publish "${pkg.title}": ${report.errorCount} structural errors must be fixed first.`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const updated: ExamResourcePackage = { ...pkg, status: nextStatus };
      await saveExamPackage(updated, keys);
      setActionNotice(`Status updated: "${pkg.title}" is now ${nextStatus.toUpperCase()}.`);
      await refreshCatalog();
    } catch (err) {
      console.error('Failed to update status:', err);
      setActionNotice('Failed to update publication status. Check administrator permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignSession = async (pkgId: string, sessionDate: string) => {
    setIsProcessing(true);
    try {
      await assignPackageToSessionExclusively(pkgId, sessionDate);
      setActionNotice(`Session ${sessionDate} exclusively assigned to package ${pkgId}.`);
      await refreshCatalog();
    } catch (err) {
      console.error('Failed to assign session:', err);
      setActionNotice('Failed to assign session.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassignSession = async (pkgId: string, sessionDate: string) => {
    setIsProcessing(true);
    try {
      await unassignPackageFromSession(pkgId, sessionDate);
      setActionNotice(`Unassigned session ${sessionDate} from package ${pkgId}.`);
      await refreshCatalog();
    } catch (err) {
      console.error('Failed to unassign session:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePackage = async (pkg: ExamResourcePackage) => {
    if (pkg.id === DEFAULT_EXAM_PACKAGE.id) {
      setActionNotice('Cannot delete the default simulation pack.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete package "${pkg.title}" (${pkg.id})?`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await deleteExamPackage(pkg.id);
      setActionNotice(`Package "${pkg.title}" deleted.`);
      await refreshCatalog();
    } catch (err) {
      console.error('Delete failed:', err);
      setActionNotice('Failed to delete package.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchivePackage = async (pkg: ExamResourcePackage) => {
    if (pkg.id === DEFAULT_EXAM_PACKAGE.id) {
      setActionNotice('Cannot archive the default official simulation pack.');
      return;
    }
    setIsProcessing(true);
    try {
      const keys = await getAnswerKeysForAdmin(pkg.id);
      const updated: ExamResourcePackage = {
        ...pkg,
        status: 'archived',
        assignedSessions: [], // unassign from candidate exam sessions to prevent accidental access
        updatedAt: new Date().toISOString(),
      };
      await saveExamPackage(updated, keys);
      setActionNotice(`Package "${pkg.title}" has been safely archived. Active sessions unassigned.`);
      await refreshCatalog();
    } catch (err) {
      console.error('Archive failed:', err);
      setActionNotice('Failed to archive package.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePackage = async (pkg: ExamResourcePackage) => {
    setIsProcessing(true);
    try {
      const keys = await getAnswerKeysForAdmin(pkg.id);
      const updated: ExamResourcePackage = {
        ...pkg,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      await saveExamPackage(updated, keys);
      setActionNotice(`Package "${pkg.title}" restored as DRAFT.`);
      await refreshCatalog();
    } catch (err) {
      console.error('Restore failed:', err);
      setActionNotice('Failed to restore package.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJsonImportSubmit = async () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      const pkg = parsed.package || parsed;
      const keys = parsed.keys || null;

      if (!pkg.id || !pkg.title || !pkg.module || !pkg.listening || !pkg.reading || !pkg.writing) {
        throw new Error('Invalid schema: Missing required package properties (id, title, module, listening, reading, writing).');
      }

      // Strictly force draft status on import
      pkg.status = 'draft';

      await saveExamPackage(pkg, keys);
      setShowJsonImportModal(false);
      setImportJsonText('');
      setActionNotice(`Package "${pkg.title}" successfully imported as DRAFT!`);
      await refreshCatalog();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON content.');
    }
  };

  const handleLoadSampleTemplate = () => {
    setImportJsonText(JSON.stringify({
      package: {
        ...DEFAULT_EXAM_PACKAGE,
        id: `pkg_academic_${Date.now().toString().slice(-4)}`,
        title: 'IELTS Academic Mock Exam (Imported Template)',
        status: 'draft',
      },
      keys: DEFAULT_EXAM_KEYS,
    }, null, 2));
  };

  const handleCopyRules = () => {
    if (storageInfo) {
      navigator.clipboard.writeText(storageInfo.recommendedRules);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2500);
    }
  };

  const handleCopyCors = () => {
    if (storageInfo?.requiredSteps[2]?.command) {
      navigator.clipboard.writeText(storageInfo.requiredSteps[2].command);
      setCopiedCors(true);
      setTimeout(() => setCopiedCors(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1E0F36] border border-[#E5E1EB] dark:border-[#361F5B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
              IELTS Resource Management Console
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
              PHASE 2C-1 WORKFLOW
            </span>
          </div>
          <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-1 max-w-2xl leading-relaxed">
            Upload, validate, preview, and assign examination resources (Listening audio, Reading passages, Writing prompts, and isolated confidential answer keys) to exam sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowStorageGuide(!showStorageGuide)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] hover:bg-[#E5D8F6] dark:hover:bg-[#321752] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            Storage Diagnostic
          </button>

          <button
            onClick={() => setShowJsonImportModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F7F7FB] dark:hover:bg-[#130922] transition-colors cursor-pointer"
          >
            Raw JSON
          </button>

          <button
            onClick={() => {
              setEditingPackage(null);
              setShowWizardModal(true);
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Import / Create Resource Package
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#8E54DC]" />
            {actionNotice}
          </span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-purple-700 dark:text-purple-300 font-bold hover:underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Storage Readiness Diagnostic Card */}
      {showStorageGuide && storageInfo && (
        <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Firebase Storage Readiness Status: Pending Console Configuration
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                  Target Cloud Storage Bucket: <code className="font-mono font-bold text-[#35145A] dark:text-[#8E54DC] bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded">{storageInfo.bucketName}</code>.
                  Direct browser uploads to Cloud Storage require activating the Storage product in Firebase Console and configuring CORS.
                </p>
                <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400/90 bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                  <strong>Plan & Billing Prerequisite:</strong> The Firebase Spark (Free) plan includes 5 GB total storage and 1 GB/day download bandwidth. No billing account or Blaze plan upgrade is required for standard mock testing operations.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 uppercase whitespace-nowrap">
              Interim: Local Verified Assets Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {storageInfo.requiredSteps.map((step) => (
              <div
                key={step.step}
                className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1E0F36]/80 border border-amber-200/60 dark:border-amber-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[10px]">
                    {step.step}
                  </span>
                  <span className="font-bold text-[#211A2B] dark:text-[#F7F5FA]">{step.title}</span>
                </div>
                <p className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Actionable Rules & CORS Snippet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#130922] border border-amber-200/60 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Target storage.rules
                </span>
                <button
                  onClick={handleCopyRules}
                  className="px-2 py-1 text-[10px] font-semibold rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] hover:bg-[#E5D8F6] flex items-center gap-1 cursor-pointer"
                >
                  {copiedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedRules ? 'Copied' : 'Copy Rules'}
                </button>
              </div>
              <pre className="text-[10px] font-mono p-2.5 rounded-lg bg-[#F7F7FB] dark:bg-black/30 overflow-x-auto text-[#35145A] dark:text-[#8E54DC] max-h-28">
                {storageInfo.recommendedRules}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#130922] border border-amber-200/60 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Cloud Storage CORS Configuration
                </span>
                <button
                  onClick={handleCopyCors}
                  className="px-2 py-1 text-[10px] font-semibold rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] hover:bg-[#E5D8F6] flex items-center gap-1 cursor-pointer"
                >
                  {copiedCors ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedCors ? 'Copied' : 'Copy Command'}
                </button>
              </div>
              <pre className="text-[10px] font-mono p-2.5 rounded-lg bg-[#F7F7FB] dark:bg-black/30 overflow-x-auto text-[#716A7B] dark:text-[#ABA1BC]">
                {storageInfo.requiredSteps[2]?.command || 'gsutil cors set cors.json gs://ielts-zone-mock-platform.firebasestorage.app'}
              </pre>
              <p className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC]">
                Allows browser audio stream caching and byte-range seeking for the Listening module.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Flyout Report */}
      {validationReport && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E0F36] border border-[#E5E1EB] dark:border-[#361F5B] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                validationReport.report.isValid ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
              }`}>
                {validationReport.report.isValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Validation Inspection Report · Package: <code className="font-mono">{validationReport.pkgId}</code>
                </h3>
                <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                  {validationReport.report.errorCount} Error(s) · {validationReport.report.warningCount} Warning(s)
                </p>
              </div>
            </div>

            <button
              onClick={() => setValidationReport(null)}
              className="text-xs text-[#716A7B] dark:text-[#ABA1BC] hover:underline cursor-pointer"
            >
              Dismiss Report
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {validationReport.report.checks.map((chk) => (
              <div
                key={chk.id}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  chk.passed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                    : chk.severity === 'error'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300'
                }`}
              >
                {chk.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : chk.severity === 'error' ? (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{chk.label}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{chk.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
              Registered Exam Resource Packages ({packages.length})
            </h3>
          </div>
          <button
            onClick={refreshCatalog}
            className="p-1.5 rounded-lg text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="divide-y divide-[#E5E1EB] dark:divide-[#361F5B]">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F7F7FB] dark:hover:bg-[#130922]/50 transition-colors"
            >
              {/* Package Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                    {pkg.title}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    pkg.status === 'published'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    {pkg.status}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
                    {pkg.module}
                  </span>
                  <span className="text-[10px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                    v{pkg.version}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                  <span className="flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-[#35145A] dark:text-[#8E54DC]" />
                    {pkg.listening?.questions?.length || 0} Listening Qs ({pkg.listening?.durationSeconds || 0}s)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#35145A] dark:text-[#8E54DC]" />
                    {pkg.reading?.passages?.length || 0} Passage(s) · {pkg.reading?.questions?.length || 0} Reading Qs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#35145A] dark:text-[#8E54DC]" />
                    Task 1 & Task 2
                  </span>
                </div>

                {/* Assigned Sessions */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#716A7B] dark:text-[#ABA1BC] pt-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Assigned Mock Sessions:</span>
                  {pkg.assignedSessions && pkg.assignedSessions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.assignedSessions.map((date) => (
                        <span
                          key={date}
                          className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono text-[10px] flex items-center gap-1"
                        >
                          {date}
                          <button
                            type="button"
                            onClick={() => handleUnassignSession(pkg.id, date)}
                            className="hover:text-rose-600 ml-1 cursor-pointer"
                            title="Unassign session"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="italic text-[#716A7B]">None assigned yet</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => handleValidate(pkg)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] hover:bg-[#E5D8F6] transition-colors cursor-pointer"
                >
                  Inspect & Validate
                </button>

                <button
                  onClick={() => handleOpenPreview(pkg)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F7F7FB] dark:hover:bg-[#130922] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Examiner Preview
                </button>

                <button
                  onClick={() => {
                    setEditingPackage(pkg);
                    setShowWizardModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={() => handleTogglePublish(pkg)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                    pkg.status === 'published'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {pkg.status === 'published' ? 'Unpublish to Draft' : 'Publish for Exam'}
                </button>

                {/* Session Assignment Quick Selector */}
                <select
                  aria-label="Assign to Exam Session"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignSession(pkg.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-2 py-1.5 text-xs rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] cursor-pointer"
                >
                  <option value="" disabled>+ Assign Session</option>
                  <option value="2026-10-17">Sat Oct 17</option>
                  <option value="2026-10-18">Sun Oct 18</option>
                  <option value="2026-10-24">Sat Oct 24</option>
                  <option value="2026-10-25">Sun Oct 25</option>
                  <option value="2026-10-31">Sat Oct 31</option>
                </select>

                {pkg.status === 'archived' ? (
                  <button
                    onClick={() => handleRestorePackage(pkg)}
                    disabled={isProcessing}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="Restore to Draft"
                  >
                    Restore
                  </button>
                ) : (
                  pkg.id !== DEFAULT_EXAM_PACKAGE.id && (
                    <button
                      onClick={() => handleArchivePackage(pkg)}
                      disabled={isProcessing}
                      className="p-1.5 text-[#716A7B] hover:text-amber-700 dark:text-[#ABA1BC] dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Safely archive package"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )
                )}

                {pkg.id !== DEFAULT_EXAM_PACKAGE.id && (
                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Delete package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Import & Creation Wizard Modal */}
      <ResourceImportWizard
        isOpen={showWizardModal}
        editingPackage={editingPackage}
        onClose={() => {
          setShowWizardModal(false);
          setEditingPackage(null);
        }}
        onSuccess={() => {
          refreshCatalog();
        }}
        storageReady={Boolean(storageInfo?.status === 'active')}
        onOpenStorageGuide={() => setShowStorageGuide(true)}
      />

      {/* Raw JSON Import Modal */}
      {showJsonImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E1EB] dark:border-[#361F5B] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#211A2B] dark:text-[#F7F5FA]">
                  Import Exam Resource Package (JSON)
                </h3>
                <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                  Paste a structured package object or load our pre-validated Cambridge template.
                </p>
              </div>
              <button
                onClick={handleLoadSampleTemplate}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] hover:bg-[#E5D8F6] transition-colors cursor-pointer"
              >
                Load Official Template
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {importError}
              </div>
            )}

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste ExamResourcePackage JSON schema here..."
              rows={12}
              className="w-full p-3 font-mono text-xs bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#35145A]"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                Security Gate: Automatically isolates confidential answer keys to <code className="font-mono">/exam_answer_keys</code>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJsonImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#E5E1EB] dark:hover:bg-[#361F5B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJsonImportSubmit}
                  disabled={!importJsonText.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Import as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Examiner Preview Modal */}
      {selectedPackage && (
        <ResourcePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          pkg={selectedPackage}
          keys={selectedKeys}
        />
      )}
    </div>
  );
};
