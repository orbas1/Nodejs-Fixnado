import PropTypes from 'prop-types';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '../../../components/ui/index.js';

function formatUpdatedAt(value) {
  if (!value) return 'Not yet saved';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not yet saved';
  }
  return date.toLocaleString();
}

function ReviewSection({ saving, updatedAt, onSave, onReload }) {
  return (
    <Card className="space-y-4" padding="lg">
      <div>
        <h2 className="text-xl font-semibold text-primary">Review &amp; publish changes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Persist updates across the admin control centre and refresh to pull the latest stored profile.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-500">Last updated: {formatUpdatedAt(updatedAt)}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" icon={ArrowPathIcon} onClick={onReload}>
            Reload profile
          </Button>
          <Button type="button" icon={CheckCircleIcon} loading={saving} disabled={saving} onClick={onSave}>
            Save changes
          </Button>
        </div>
      </div>
    </Card>
  );
}

ReviewSection.propTypes = {
  saving: PropTypes.bool,
  updatedAt: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired
};

ReviewSection.defaultProps = {
  saving: false,
  updatedAt: null
};

export default ReviewSection;
