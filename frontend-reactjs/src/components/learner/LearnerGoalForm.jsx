import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';

export default function LearnerGoalForm({ preferences, onSubmit, loading, t }) {
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(preferences.weeklyTargetHours ?? 6);
  const [aiCoachEnabled, setAiCoachEnabled] = useState(Boolean(preferences.aiCoachEnabled));
  const [zoneLock, setZoneLock] = useState(Boolean(preferences.zoneLock));
  const [reminderDays, setReminderDays] = useState(preferences.reminderDays ?? ['monday']);
  const [notificationChannels, setNotificationChannels] = useState(preferences.notificationChannels ?? ['email']);

  useEffect(() => {
    setWeeklyTargetHours(preferences.weeklyTargetHours ?? 6);
    setAiCoachEnabled(Boolean(preferences.aiCoachEnabled));
    setZoneLock(Boolean(preferences.zoneLock));
    setReminderDays(preferences.reminderDays ?? ['monday']);
    setNotificationChannels(preferences.notificationChannels ?? ['email']);
  }, [preferences]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ weeklyTargetHours, aiCoachEnabled, zoneLock, reminderDays, notificationChannels });
  };

  const toggleReminderDay = (day) => {
    setReminderDays((current) => {
      if (current.includes(day)) {
        return current.filter((entry) => entry !== day);
      }
      return [...current, day];
    });
  };

  const toggleChannel = (channel) => {
    setNotificationChannels((current) => {
      if (current.includes(channel)) {
        return current.filter((entry) => entry !== channel);
      }
      return [...current, channel];
    });
  };

  const days = ['monday', 'wednesday', 'friday', 'saturday'];
  const channels = ['email', 'sms', 'push'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-qa="learner-goal-form">
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="weekly-target">
          {t('learner.settings.weeklyTargetLabel')}
        </label>
        <p className="mt-1 text-xs text-slate-500">{t('learner.settings.weeklyTargetDescription')}</p>
        <input
          id="weekly-target"
          name="weeklyTarget"
          type="number"
          min={1}
          max={60}
          step={1}
          value={weeklyTargetHours}
          onChange={(event) => setWeeklyTargetHours(Number(event.target.value))}
          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">{t('learner.settings.remindersLabel')}</p>
        <p className="mt-1 text-xs text-slate-500">{t('learner.settings.remindersDescription')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleReminderDay(day)}
              className={clsx(
                'rounded-full border px-4 py-1 text-xs font-semibold transition',
                reminderDays.includes(day)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
              )}
            >
              {t(`learner.settings.day.${day}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">{t('learner.settings.channelsLabel')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {channels.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => toggleChannel(channel)}
              className={clsx(
                'rounded-full border px-4 py-1 text-xs font-semibold transition',
                notificationChannels.includes(channel)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
              )}
            >
              {t(`learner.settings.channel.${channel}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Switch.Group>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4">
            <div>
              <Switch.Label className="text-sm font-semibold text-slate-700">
                {t('learner.settings.aiCoachLabel')}
              </Switch.Label>
              <Switch.Description className="text-xs text-slate-500">
                {t('learner.settings.aiCoachDescription')}
              </Switch.Description>
            </div>
            <Switch
              checked={aiCoachEnabled}
              onChange={setAiCoachEnabled}
              className={clsx(
                aiCoachEnabled ? 'bg-primary' : 'bg-slate-200',
                'relative inline-flex h-6 w-11 items-center rounded-full transition'
              )}
            >
              <span
                className={clsx(
                  aiCoachEnabled ? 'translate-x-6' : 'translate-x-1',
                  'inline-block h-4 w-4 transform rounded-full bg-white transition'
                )}
              />
            </Switch>
          </div>
        </Switch.Group>

        <Switch.Group>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4">
            <div>
              <Switch.Label className="text-sm font-semibold text-slate-700">
                {t('learner.settings.zoneLockLabel')}
              </Switch.Label>
              <Switch.Description className="text-xs text-slate-500">
                {t('learner.settings.zoneLockDescription')}
              </Switch.Description>
            </div>
            <Switch
              checked={zoneLock}
              onChange={setZoneLock}
              className={clsx(
                zoneLock ? 'bg-primary' : 'bg-slate-200',
                'relative inline-flex h-6 w-11 items-center rounded-full transition'
              )}
            >
              <span
                className={clsx(
                  zoneLock ? 'translate-x-6' : 'translate-x-1',
                  'inline-block h-4 w-4 transform rounded-full bg-white transition'
                )}
              />
            </Switch>
          </div>
        </Switch.Group>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? t('learner.settings.saving') : t('learner.settings.saveCta')}
        </button>
      </div>
    </form>
  );
}

LearnerGoalForm.propTypes = {
  preferences: PropTypes.shape({
    weeklyTargetHours: PropTypes.number,
    aiCoachEnabled: PropTypes.bool,
    zoneLock: PropTypes.bool,
    reminderDays: PropTypes.arrayOf(PropTypes.string),
    notificationChannels: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  t: PropTypes.func.isRequired
};

LearnerGoalForm.defaultProps = {
  loading: false
};
