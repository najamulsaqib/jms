import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import JsonHighlight from '@components/ui/JsonHighlight';
import Modal from '@components/ui/Modal';
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/20/solid';
import { useAuditLog } from '@hooks/useAuditLog';
import { camelToTitleCase } from '@lib/caseTransform';
import { AUDIT_ACTIONS } from '@lib/enums';
import { AuditLog } from '@shared/auditLog.contracts';
import React, { useState } from 'react';

type AuditLogPanelProps = {
  module: string;
  recordId?: string | number | null;
  perPage?: number;
  title?: string;
};

type ActionStyle = { label: string; sentence: string; className: string; Icon: React.ElementType };

const ACTION_STYLES: Record<string, ActionStyle> = {
  // Current enum values
  [AUDIT_ACTIONS.CREATE]: {
    label: 'Created',
    sentence: 'created the record',
    className: 'bg-green-100 text-green-700',
    Icon: PlusIcon,
  },
  [AUDIT_ACTIONS.UPDATE]: {
    label: 'Updated',
    sentence: 'updated the record',
    className: 'bg-blue-100 text-blue-700',
    Icon: PencilIcon,
  },
  [AUDIT_ACTIONS.DELETE]: {
    label: 'Deleted',
    sentence: 'deleted the record',
    className: 'bg-red-100 text-red-700',
    Icon: TrashIcon,
  },
  [AUDIT_ACTIONS.BULK_CREATE]: {
    label: 'Bulk Created',
    sentence: 'bulk created records',
    className: 'bg-green-100 text-green-700',
    Icon: PlusIcon,
  },
  [AUDIT_ACTIONS.BULK_UPDATE]: {
    label: 'Bulk Updated',
    sentence: 'bulk updated records',
    className: 'bg-blue-100 text-blue-700',
    Icon: PencilIcon,
  },
  [AUDIT_ACTIONS.BULK_DELETE]: {
    label: 'Bulk Deleted',
    sentence: 'bulk deleted records',
    className: 'bg-red-100 text-red-700',
    Icon: TrashIcon,
  },
  [AUDIT_ACTIONS.EXPORT_PDF]: {
    label: 'PDF Export',
    sentence: 'exported a PDF',
    className: 'bg-amber-100 text-amber-700',
    Icon: ArrowDownTrayIcon,
  },
  [AUDIT_ACTIONS.EXPORT_CSV]: {
    label: 'CSV Export',
    sentence: 'exported a CSV',
    className: 'bg-amber-100 text-amber-700',
    Icon: ArrowDownTrayIcon,
  },
  // Legacy values for existing DB entries
  created: {
    label: 'Created',
    sentence: 'created the record',
    className: 'bg-green-100 text-green-700',
    Icon: PlusIcon,
  },
  updated: {
    label: 'Updated',
    sentence: 'updated the record',
    className: 'bg-blue-100 text-blue-700',
    Icon: PencilIcon,
  },
  deleted: {
    label: 'Deleted',
    sentence: 'deleted the record',
    className: 'bg-red-100 text-red-700',
    Icon: TrashIcon,
  },
  exported: {
    label: 'Exported',
    sentence: 'exported',
    className: 'bg-amber-100 text-amber-700',
    Icon: ArrowDownTrayIcon,
  },
};

const DEFAULT_ACTION_STYLE: ActionStyle = {
  label: 'Activity',
  sentence: 'performed an action',
  className: 'bg-slate-100 text-slate-500',
  Icon: ClockIcon,
};

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatAbsoluteTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (typeof value === 'boolean' || typeof value === 'number')
    return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function getStyle(action: string): ActionStyle {
  return ACTION_STYLES[action] ?? DEFAULT_ACTION_STYLE;
}

function getActionLabel(action: string): string {
  return getStyle(action).label;
}

function getActionSentence(log: AuditLog): string {
  return getStyle(log.action).sentence;
}

function ChangeDiff({
  changes,
  action,
}: {
  changes: AuditLog['changes'];
  action: string;
}) {
  if (!changes || Object.keys(changes).length === 0) return null;
  const showResultOnly = action === AUDIT_ACTIONS.EXPORT_PDF ||
    action === AUDIT_ACTIONS.EXPORT_CSV ||
    action === 'exported';

  return (
    <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 divide-y divide-slate-100">
      {Object.entries(changes).map(([field, { from, to }]) => {
        const label = camelToTitleCase(field);
        const fromStr = formatValue(from);
        const toStr = formatValue(to);
        const isPassword = field === 'password';
        return (
          <div key={field} className="px-3 py-1.5 text-xs">
            <span className="font-medium text-slate-600">{label}: </span>
            {showResultOnly ? (
              <span className="text-green-600">
                {isPassword ? '••••••••' : toStr}
              </span>
            ) : (
              <>
                <span className="text-red-500 line-through">
                  {isPassword ? '••••••••' : fromStr}
                </span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="text-green-600">
                  {isPassword ? '••••••••' : toStr}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AuditEntry({
  log,
  onOpen,
}: {
  log: AuditLog;
  onOpen: (log: AuditLog) => void;
}) {
  const style = getStyle(log.action);
  const { Icon } = style;
  const snapshotName =
    typeof log.snapshot?.name === 'string' ? log.snapshot.name : null;
  const snapshotCnic =
    typeof log.snapshot?.cnic === 'string' ? log.snapshot.cnic : null;
  const actionSentence = getActionSentence(log);
  const actorName = log.changedByName ?? snapshotName ?? 'Unknown user';

  return (
    <button
      type="button"
      onClick={() => onOpen(log)}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg p-2 ${style.className}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-slate-900">
              {actorName}
            </span>
            <span className="text-sm font-medium text-slate-700">
              {actionSentence}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{formatRelativeTime(log.createdAt)}</span>
            {snapshotName && (
              <>
                <span className="text-slate-300">•</span>
                <span>{snapshotName}</span>
              </>
            )}
            {snapshotCnic && (
              <>
                <span className="text-slate-300">•</span>
                <span>CNIC: {snapshotCnic}</span>
              </>
            )}
          </div>
        </div>

        <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </button>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 wrap-break-word text-sm font-medium text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col h-full overflow-auto">
      <div className="text-sm font-semibold text-slate-900 shrink-0">
        {title}
      </div>
      <div className="mt-3 flex-1 overflow-auto min-h-0">{children}</div>
    </div>
  );
}

export default function AuditLogPanel({
  module,
  recordId = null,
  perPage = 5,
  title = 'Activity Log',
}: AuditLogPanelProps) {
  const { logs, loading, page, totalPages, total, setPage } = useAuditLog(
    module,
    recordId,
    perPage,
  );
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const selectedTitle = selectedLog
    ? `${selectedLog.changedByName ?? 'Unknown user'} ${getActionSentence(selectedLog)}`
    : '';

  return (
    <>
      <Card>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
            <ClockIcon className="h-4 w-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {!loading && total > 0 && (
            <span className="ml-auto text-xs text-slate-400">
              {total} entries
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-violet-600" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No activity recorded yet.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log) => (
                <AuditEntry key={log.id} log={log} onOpen={setSelectedLog} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeftIcon}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={ChevronRightIcon}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title={selectedTitle}
        description={
          selectedLog ? formatAbsoluteTime(selectedLog.createdAt) : ''
        }
        size="xl"
        maxHeight="max-h-[85vh]"
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailCard
                label="User"
                value={selectedLog.changedByName ?? 'Unknown'}
              />
              <DetailCard
                label="Action"
                value={getActionLabel(selectedLog.action)}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2 h-150">
              {selectedLog.snapshot && (
                <SectionCard title="Snapshot">
                  <JsonHighlight value={selectedLog.snapshot} />
                </SectionCard>
              )}

              {selectedLog.changes && (
                <SectionCard title="Changes">
                  <ChangeDiff
                    changes={selectedLog.changes}
                    action={selectedLog.action}
                  />
                </SectionCard>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
