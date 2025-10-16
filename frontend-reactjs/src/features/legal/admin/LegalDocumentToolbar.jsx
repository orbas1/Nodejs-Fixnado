import PropTypes from 'prop-types';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button, SegmentedControl } from '../../../components/ui/index.js';

export default function LegalDocumentToolbar({
  selectedSlug,
  documentOptions,
  onDocumentChange,
  onCreate,
  onRefresh,
  disableCreate,
  disableRefresh,
  statusPills,
  children
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl
          name="Select legal document"
          value={selectedSlug}
          options={documentOptions}
          onChange={onDocumentChange}
          size="sm"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={PlusIcon}
          onClick={onCreate}
          disabled={disableCreate}
        >
          New policy
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          icon={ArrowPathIcon}
          disabled={disableRefresh}
        >
          Refresh status
        </Button>
      </div>
      {statusPills}
      {children}
    </div>
  );
}

LegalDocumentToolbar.propTypes = {
  selectedSlug: PropTypes.string,
  documentOptions: SegmentedControl.propTypes.options.isRequired,
  onDocumentChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  disableCreate: PropTypes.bool,
  disableRefresh: PropTypes.bool,
  statusPills: PropTypes.node,
  children: PropTypes.node
};

LegalDocumentToolbar.defaultProps = {
  selectedSlug: '',
  disableCreate: false,
  disableRefresh: false,
  statusPills: null,
  children: null
};
