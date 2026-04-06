import { useRef, type ComponentType } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

type DropZoneProps = {
  onFile: (file: File) => void;
  accept?: string;
  acceptLabel?: string;
  title?: string;
  icon?: ComponentType<{ className?: string }>;
};

export default function DropZone({
  onFile,
  accept = '*',
  acceptLabel,
  title = 'Drop your file here, or',
  icon: Icon = DocumentTextIcon,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="File drop zone"
        className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
      >
        <Icon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">
          {title}{' '}
          <span className="text-blue-600">click to browse</span>
        </p>
        {acceptLabel && (
          <p className="text-xs text-slate-400 mt-1">{acceptLabel}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
