import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

const courseStatusTone = {
  draft: 'neutral',
  review: 'warning',
  live: 'success',
  archived: 'critical'
};

export default function InstructorCourseTable({ courses, onTogglePublish, isUpdating, filters }) {
  const { t, format } = useLocale();
  const [selectedCourse, setSelectedCourse] = useState(null);

  const availableStatuses = useMemo(() => filters?.statuses ?? ['draft', 'review', 'live', 'archived'], [filters?.statuses]);
  const deliveryModes = useMemo(() => filters?.deliveryModes ?? ['on-demand', 'live', 'hybrid'], [filters?.deliveryModes]);

  const handleToggle = async (event) => {
    event.preventDefault();
    if (!onTogglePublish || !selectedCourse) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const isPublished = form.get('isPublished') === 'on';
    const scheduledAtRaw = form.get('scheduledAt');
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null;

    await onTogglePublish(selectedCourse, { isPublished, scheduledAt });
    setSelectedCourse(null);
  };

  if (courses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
        {t('instructor.courses.empty')}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm" data-qa="instructor-course-table">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-[0.3em] text-slate-500">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnTitle')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnStatus')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnDelivery')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnPrice')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnEnrolled')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnSatisfaction')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.courses.columnUpdated')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((course) => {
            const isSelected = selectedCourse?.id === course.id;
            return (
              <tr
                key={course.id}
                className={clsx('transition hover:bg-primary/5', isSelected && 'bg-primary/10')}
                onClick={() => setSelectedCourse((current) => (current?.id === course.id ? null : course))}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-primary">{course.title}</div>
                  <p className="text-xs text-slate-500">{course.slug || t('instructor.courses.slugPending')}</p>
                </td>
                <td className="px-6 py-4">
                  <StatusPill tone={courseStatusTone[course.status] ?? 'neutral'}>
                    {t(`instructor.courses.status.${course.status}`)}
                  </StatusPill>
                </td>
                <td className="px-6 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">{t(`instructor.courses.delivery.${course.deliveryMode}`)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{format.currency(course.price)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{format.number(course.learnersEnrolled)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {course.satisfactionScore != null
                    ? t('instructor.courses.satisfactionScore', { value: format.number(course.satisfactionScore, { maximumFractionDigits: 1 }) })
                    : t('instructor.courses.satisfactionUnknown')}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {course.updatedAt ? format.dateTime(course.updatedAt) : t('instructor.courses.updatedUnknown')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedCourse ? (
        <form onSubmit={handleToggle} className="border-t border-slate-200 bg-slate-50/70 p-6" data-qa="instructor-course-publishing">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="isPublished"
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                defaultChecked={selectedCourse.isPublished}
                disabled={isUpdating}
              />
              <span className="font-semibold text-primary">{t('instructor.courses.publishToggle')}</span>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.courses.scheduleAt')}
              <input
                type="datetime-local"
                name="scheduledAt"
                className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                defaultValue={selectedCourse.scheduledAt ? selectedCourse.scheduledAt.slice(0, 16) : ''}
                disabled={isUpdating}
              />
              <span className="mt-2 text-[0.7rem] lowercase normal-case text-slate-500">
                {t('instructor.courses.scheduleHint')}
              </span>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <div>
                <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">{t('instructor.courses.statusLabel')}</span>
                <div>{availableStatuses.map((status) => t(`instructor.courses.status.${status}`)).join(' • ')}</div>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">{t('instructor.courses.deliveryLabel')}</span>
                <div>{deliveryModes.map((mode) => t(`instructor.courses.delivery.${mode}`)).join(' • ')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
                onClick={() => setSelectedCourse(null)}
                disabled={isUpdating}
              >
                {t('instructor.courses.cancelEdit')}
              </button>
              <button
                type="submit"
                className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
                disabled={isUpdating}
              >
                {isUpdating ? t('instructor.courses.saving') : t('instructor.courses.saveChanges')}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

InstructorCourseTable.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      slug: PropTypes.string,
      status: PropTypes.string.isRequired,
      deliveryMode: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      learnersEnrolled: PropTypes.number.isRequired,
      satisfactionScore: PropTypes.number,
      updatedAt: PropTypes.string,
      isPublished: PropTypes.bool,
      scheduledAt: PropTypes.string
    })
  ).isRequired,
  onTogglePublish: PropTypes.func,
  isUpdating: PropTypes.bool,
  filters: PropTypes.shape({
    statuses: PropTypes.arrayOf(PropTypes.string),
    deliveryModes: PropTypes.arrayOf(PropTypes.string)
  })
};

InstructorCourseTable.defaultProps = {
  onTogglePublish: undefined,
  isUpdating: false,
  filters: undefined
};
