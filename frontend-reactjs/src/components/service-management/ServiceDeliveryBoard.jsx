import PropTypes from 'prop-types';

function ServiceDeliveryBoard({ columns }) {
  if (!columns.length) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((column) => (
        <div key={column.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">{column.title}</p>
              <p className="text-xs text-slate-500">{column.description}</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{column.items?.length ?? 0}</span>
          </div>
          <ul className="mt-3 space-y-3">
            {(column.items ?? []).map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-primary">{item.name}</p>
                <p className="text-xs text-slate-500">{item.client}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-wide text-slate-400">
                  {item.zone ? <span>{item.zone}</span> : null}
                  {item.risk ? <span>{item.risk}</span> : null}
                  {(item.services ?? []).map((service) => (
                    <span key={service} className="rounded-full bg-white px-2 py-0.5 text-slate-500">
                      {service}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

ServiceDeliveryBoard.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          client: PropTypes.string,
          zone: PropTypes.string,
          risk: PropTypes.string,
          services: PropTypes.arrayOf(PropTypes.string)
        })
      )
    })
  )
};

ServiceDeliveryBoard.defaultProps = {
  columns: []
};

export default ServiceDeliveryBoard;
