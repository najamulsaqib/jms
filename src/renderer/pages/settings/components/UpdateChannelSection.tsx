import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useUpdater } from '@hooks/useUpdater';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

type UpdateChannel = 'latest' | 'beta';

const channelDetails: Record<
  UpdateChannel,
  {
    title: string;
    badge: string;
    badgeClassName: string;
    description: string;
    highlightClassName: string;
    iconClassName: string;
  }
> = {
  latest: {
    title: 'Stable channel',
    badge: 'Recommended',
    badgeClassName: 'bg-blue-50 text-blue-700 border-blue-200',
    description:
      'Production-ready updates with the least risk. Best for day-to-day work.',
    highlightClassName: 'border-blue-200 bg-blue-50/70 shadow-sm',
    iconClassName: 'text-blue-600',
  },
  beta: {
    title: 'Beta channel',
    badge: 'Preview',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
    description:
      'Early access to upcoming features and fixes before they land in stable.',
    highlightClassName: 'border-amber-200 bg-amber-50/60 shadow-amber-100/50',
    iconClassName: 'text-amber-600',
  },
};

export default function UpdateChannelSection() {
  const {
    currentChannel,
    appVersion,
    switchChannel,
    isSwitching,
    isLoading,
    checkForUpdates,
  } = useUpdater();

  const resolvedChannel: UpdateChannel = currentChannel ?? 'latest';
  const channelInfo = channelDetails[resolvedChannel];
  const displayVersion = appVersion ?? 'Loading version...';

  const handleChannelSwitch = (channel: UpdateChannel) => {
    if (channel === currentChannel) return;
    switchChannel(channel);
  };

  const channelCards: UpdateChannel[] = ['latest', 'beta'];

  return (
    <Card padding="lg" className="border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Update channel
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Select the release track and manually check for updates.
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${channelInfo.badgeClassName}`}
        >
          {channelInfo.badge}
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Current version
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {displayVersion}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Channel:{' '}
          <span className="font-medium text-slate-900">{resolvedChannel}</span>
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-slate-700">Choose a channel</p>
        <div className="grid gap-3">
          {channelCards.map((channel) => {
            const details = channelDetails[channel];
            const active = resolvedChannel === channel;

            return (
              <button
                key={channel}
                type="button"
                onClick={() => handleChannelSwitch(channel)}
                disabled={isSwitching || isLoading}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  active
                    ? `${details.highlightClassName} shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                } ${isSwitching || isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-xl border border-slate-200 bg-slate-50 p-2 ${details.iconClassName}`}
                  >
                    <ShieldCheckIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {details.title}
                      </h4>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${details.badgeClassName}`}
                      >
                        {details.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {details.description}
                    </p>
                  </div>

                  {active && (
                    <CheckCircleIcon
                      className={`h-5 w-5 ${details.iconClassName}`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {resolvedChannel === 'beta'
            ? 'You are using preview builds. Expect occasional rough edges.'
            : 'Stable channel selected. This is the recommended release stream.'}
        </p>

        <Button
          onClick={checkForUpdates}
          variant="secondary"
          busy={isLoading}
          size="sm"
          className="w-full sm:w-auto"
          icon={ArrowPathIcon}
        >
          Check for updates
        </Button>
      </div>
    </Card>
  );
}
