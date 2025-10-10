import Hero from '../components/Hero.jsx';
import LiveFeed from '../components/LiveFeed.jsx';
import Stats from '../components/Stats.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import Explorer from '../components/Explorer.jsx';
import MarketplaceShowcase from '../components/MarketplaceShowcase.jsx';
import ServiceZones from '../components/ServiceZones.jsx';
import EscrowSection from '../components/EscrowSection.jsx';

const services = [
  {
    id: 1,
    name: 'Home repairs on call',
    category: 'Certified tradespeople',
    description: 'Licensed electricians, plumbers, and carpenters available within 60 minutes for emergency fixes.',
    price: '$85/hr',
    icon: '🏠'
  },
  {
    id: 2,
    name: 'Event setup squads',
    category: 'Event professionals',
    description: 'From lighting to staging, coordinate pop-up events or conferences with curated crews.',
    price: '$240+',
    icon: '🎪'
  },
  {
    id: 3,
    name: 'Fractional product teams',
    category: 'Tech & digital',
    description: 'Hire vetted developers, designers, and product managers for sprints or long-term retainers.',
    price: '$120/hr',
    icon: '💡'
  }
];

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      <Hero />
      <section className="mx-auto max-w-6xl px-6">
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
