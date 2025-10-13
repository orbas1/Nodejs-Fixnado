import PropTypes from 'prop-types';

const softenGradient = (accent) => {
  if (!accent) {
    return 'from-white via-slate-50 to-slate-100';
  }

  const tokens = accent.split(' ');
  const softened = tokens.map((token) => {
    if (!/^(from|via|to)-/.test(token)) {
      return token;
    }

    return token.replace(/-(\d{3})$/, (_, value) => {
      const numeric = Number(value);
      const target = Math.max(100, numeric - 300);
      return `-${target}`;
    });
  });

  if (!softened.some((token) => token.startsWith('via-'))) {
    softened.splice(1, 0, 'via-white');
  }

  return softened.join(' ');
};

const SectionHeader = ({ section }) => (
  <div className="mb-6 space-y-2">
    <h2 className="text-2xl font-semibold text-slate-900">{section.label}</h2>
    <p className="text-sm text-slate-600 max-w-2xl">{section.description}</p>
  </div>
);

SectionHeader.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired
};

const GridSection = ({ section }) => {
  const cards = section.data?.cards ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border border-accent/10 bg-gradient-to-br ${softenGradient(card.accent)} p-6 shadow-md`}
          >
            <h3 className="text-lg font-semibold text-primary">{card.title}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {(card.details ?? []).map((detail) => (
                <li key={detail} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent/70" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

GridSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      cards: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          details: PropTypes.arrayOf(PropTypes.string).isRequired,
          accent: PropTypes.string
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const BoardSection = ({ section }) => {
  const columns = section.data?.columns ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className="bg-white border border-accent/10 rounded-2xl p-4 space-y-4 shadow-md">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{column.title}</h3>
              <span className="text-xs text-slate-500">{column.items?.length ?? 0} items</span>
            </div>
            <div className="space-y-4">
              {(column.items ?? []).map((item) => (
                <div key={item.title} className="rounded-xl border border-accent/10 bg-secondary p-4 space-y-2">
                  <p className="font-medium text-primary">{item.title}</p>
                  {item.owner && <p className="text-sm text-slate-600">{item.owner}</p>}
                  {item.value && <p className="text-sm text-accent font-semibold">{item.value}</p>}
                  {item.eta && <p className="text-xs text-slate-500">{item.eta}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

BoardSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      columns: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              title: PropTypes.string.isRequired,
              owner: PropTypes.string,
              value: PropTypes.string,
              eta: PropTypes.string
            })
          ).isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const TableSection = ({ section }) => {
  const headers = section.data?.headers ?? [];
  const rows = section.data?.rows ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="overflow-hidden rounded-2xl border border-accent/10 bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-secondary text-primary">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-secondary/70">
                {row.map((value, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

TableSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      headers: PropTypes.arrayOf(PropTypes.string).isRequired,
      rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired
    }).isRequired
  }).isRequired
};

const ListSection = ({ section }) => {
  const items = section.data?.items ?? [];
  return (
    <div>
      <SectionHeader section={section} />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-accent/10 bg-white p-5 shadow-md">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-primary">{item.title}</p>
              <p className="text-sm text-slate-600">{item.description}</p>
              <span className="text-xs uppercase tracking-wide text-slate-500">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ListSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      items: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired,
          status: PropTypes.string.isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired
};

const DashboardSection = ({ section }) => {
  switch (section.type) {
    case 'grid':
      return <GridSection section={section} />;
    case 'board':
      return <BoardSection section={section} />;
    case 'table':
      return <TableSection section={section} />;
    case 'list':
      return <ListSection section={section} />;
    default:
      return null;
  }
};

DashboardSection.propTypes = {
  section: PropTypes.shape({
    type: PropTypes.string.isRequired
  }).isRequired
};

export default DashboardSection;
