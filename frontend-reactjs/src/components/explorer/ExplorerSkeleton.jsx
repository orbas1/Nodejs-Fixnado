import Skeleton from '../ui/Skeleton.jsx';
import './explorer.css';

export default function ExplorerSkeleton() {
  return (
    <div className="fx-explorer-skeleton" aria-hidden="true">
      <Skeleton className="fx-explorer-skeleton__card" />
      <Skeleton className="fx-explorer-skeleton__card" />
      <Skeleton className="fx-explorer-skeleton__card" />
    </div>
  );
}
