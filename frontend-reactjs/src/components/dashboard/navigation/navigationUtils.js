import {
  Squares2X2Icon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CubeIcon,
  InboxStackIcon,
  Cog8ToothIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ChartPieIcon,
  BoltIcon,
  MapIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const navIconMap = {
  profile: UserCircleIcon,
  calendar: CalendarDaysIcon,
  pipeline: ClipboardDocumentListIcon,
  availability: UsersIcon,
  assets: CubeIcon,
  support: InboxStackIcon,
  settings: Cog8ToothIcon,
  crew: WrenchScrewdriverIcon,
  compliance: ShieldCheckIcon,
  enterprise: BuildingOfficeIcon,
  finance: BanknotesIcon,
  analytics: ChartPieIcon,
  automation: BoltIcon,
  map: MapIcon,
  documents: ClipboardDocumentCheckIcon
};

export const getNavIcon = (item) => {
  if (!item?.icon) {
    return Squares2X2Icon;
  }

  return navIconMap[item.icon] ?? Squares2X2Icon;
};

export default getNavIcon;
