import PropTypes from 'prop-types';
import { Card, TextInput, TextArea } from '../../../components/ui/index.js';

export default function LegalHeroCard({ form, onFieldChange, disabled }) {
  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Hero content</h2>
            <p className="text-sm text-slate-500">Update the lead copy shown at the top of the policy.</p>
          </div>
        </div>
        <TextInput
          label="Hero eyebrow"
          value={form.heroEyebrow}
          onChange={(event) => onFieldChange('heroEyebrow', event.target.value)}
          disabled={disabled}
        />
        <TextInput
          label="Hero title"
          value={form.heroTitle}
          onChange={(event) => onFieldChange('heroTitle', event.target.value)}
          disabled={disabled}
        />
        <TextArea
          label="Hero summary"
          rows={4}
          value={form.heroSummary}
          onChange={(event) => onFieldChange('heroSummary', event.target.value)}
          disabled={disabled}
        />
      </div>
    </Card>
  );
}

LegalHeroCard.propTypes = {
  form: PropTypes.shape({
    heroEyebrow: PropTypes.string,
    heroTitle: PropTypes.string,
    heroSummary: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

LegalHeroCard.defaultProps = {
  disabled: false
};
