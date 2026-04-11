import DropZone from '@components/ui/DropZone';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

type UploadStepProps = {
  onFile: (file: File) => void;
  fileError: string;
};

export default function UploadStep({ onFile, fileError }: UploadStepProps) {
  return (
    <div className="max-w-xl">
      <DropZone
        onFile={onFile}
        accept=".csv"
        acceptLabel="Only .csv files supported"
        title="Drop your customs report CSV here, or"
        icon={DocumentTextIcon}
      />
      {fileError && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          {fileError}
        </p>
      )}
    </div>
  );
}
