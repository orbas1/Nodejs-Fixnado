import PropTypes from 'prop-types';
import { Card, Button, Spinner } from '../../../components/ui/index.js';
import EscrowRow from './EscrowRow.jsx';

export default function EscrowList({
  items,
  loading,
  selectedId,
  onSelect,
  pagination,
  onPageChange
}) {
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? 1;

  return (
    <Card className="space-y-4 border-slate-200 bg-white/90 p-4">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      ) : items?.length ? (
        <div className="space-y-3">
          {items.map((escrow) => (
            <EscrowRow key={escrow.id} escrow={escrow} isSelected={escrow.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          No escrow records matched your filters.
        </div>
      )}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

EscrowList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    totalPages: PropTypes.number
  }),
  onPageChange: PropTypes.func
};

EscrowList.defaultProps = {
  items: [],
  loading: false,
  selectedId: null,
  pagination: null,
  onPageChange: () => {}
};
