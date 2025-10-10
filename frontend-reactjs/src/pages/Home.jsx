import Hero from '../components/Hero.jsx';
import LiveFeed from '../components/LiveFeed.jsx';
import Stats from '../components/Stats.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import Explorer from '../components/Explorer.jsx';
import MarketplaceShowcase from '../components/MarketplaceShowcase.jsx';
import ServiceZones from '../components/ServiceZones.jsx';
import EscrowSection from '../components/EscrowSection.jsx';
import EnterpriseHighlights from '../components/EnterpriseHighlights.jsx';
import ExecutiveShowcase from '../components/ExecutiveShowcase.jsx';
import OperationalBlueprint from '../components/OperationalBlueprint.jsx';
import EnterpriseStack from '../components/EnterpriseStack.jsx';
import ClientSpotlight from '../components/ClientSpotlight.jsx';

const services = [
  {
    id: 1,
    name: 'Critical facility response teams',
    category: 'Facilities & infrastructure',
    description:
      'Deploy multi-trade squads with compliance-ready checklists for hospitals, campuses, and mission-critical sites.',
    price: 'Custom SLAs',
    icon: '🏢'
  },
  {
    id: 2,
    name: 'Programmatic workforce pods',
    category: 'Tech & digital',
    description:
      'Pair vetted developers, product managers, and UX specialists for sprint-based digital rollouts and innovation labs.',
    price: '$120/hr',
    icon: '💻'
  },
  {
    id: 3,
    name: 'Experiential event command',
    category: 'Brand & events',
    description:
      'Coordinate nationwide launches with synchronized logistics, rental equipment, and brand-certified specialists.',
    price: '$240+',
    icon: '🎯'
  }
];

export default function Home() {
  return (
    <div className="space-y-20 pb-20">
      <Hero />
      <ExecutiveShowcase />
      <EnterpriseStack />
      <EnterpriseHighlights />
      <OperationalBlueprint />
      <ClientSpotlight />
      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-primary">Solutions curated for enterprise velocity.</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Activate turnkey service packages or tailor programs that blend your internal teams with Fixnado-certified experts.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Escrow backed • SLA aligned</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
      <Stats />
      <div className="mx-auto max-w-6xl px-6">
        <LiveFeed condensed />
      </div>
      <Explorer />
      <div className="mx-auto max-w-6xl px-6">
        <MarketplaceShowcase />
      </div>
      <ServiceZones />
      <EscrowSection />
    </div>
  );
}
