import PropTypes from 'prop-types';
import { UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../ui/index.js';

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserGroupIcon className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="text-lg font-semibold text-primary">No users match these filters</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">Adjust your filters or invite a teammate to the Fixnado control tower.</p>
      {onCreate ? (
        <Button className="mt-6" icon={UserPlusIcon} onClick={onCreate}>
          Invite user
        </Button>
      ) : null}
    </div>
  );
}

EmptyState.propTypes = {
  onCreate: PropTypes.func
};

EmptyState.defaultProps = {
  onCreate: undefined
};

export default EmptyState;
