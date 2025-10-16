import PropTypes from 'prop-types';
import { Card } from '../../../components/ui/index.js';
import CampaignForm from './CampaignForm.jsx';

export default function CampaignCreationPanel({ draft, saving, onChange, onSubmit, onCancel }) {
  return (
    <Card padding="lg" className="border border-dashed border-primary/30 bg-primary/5">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Create a new campaign</p>
        <h3 className="text-xl font-semibold text-primary">Spin up a Fixnado placement</h3>
        <p className="text-sm text-slate-600">
          Configure budget, pacing, and targeting before activating. Newly created campaigns appear in the list on the
          left and inherit Fixnado Serviceman access rules.
        </p>
      </header>
      <CampaignForm form={draft} mode="create" onChange={onChange} onSubmit={onSubmit} onCancel={onCancel} saving={saving} />
    </Card>
  );
}

CampaignCreationPanel.propTypes = {
  draft: PropTypes.object,
  saving: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

CampaignCreationPanel.defaultProps = {
  draft: null,
  saving: false
};
