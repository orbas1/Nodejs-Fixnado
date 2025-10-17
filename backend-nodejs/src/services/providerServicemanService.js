import { Op } from 'sequelize';
import {
  sequelize,
  ProviderServiceman,
  ProviderServicemanAvailability,
  ProviderServicemanZone,
  ProviderServicemanMedia,
  ServiceZone
} from '../models/index.js';
import { resolveCompanyForActor } from './panelService.js';

const SERVICEMAN_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive' }
];

const AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available for assignments' },
  { value: 'on_assignment', label: 'On assignment' },
  { value: 'training', label: 'Training' },
  { value: 'unavailable', label: 'Unavailable' }
];

const MEDIA_TYPES = [
  { value: 'profile', label: 'Profile image' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'certificate', label: 'Certification' }
];

const DEFAULT_TIMEZONES = ['Europe/London', 'UTC', 'Europe/Paris'];
const DEFAULT_CURRENCIES = ['GBP', 'EUR', 'USD'];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

function coerceSkills(skills) {
  if (Array.isArray(skills)) {
    return skills
      .map((value) => (typeof value === 'string' ? value.trim() : null))
      .filter((value) => value && value.length > 0);
  }

  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  return [];
}

function sanitiseProfileInput(profile = {}) {
  const availabilityPercentage = Number.parseInt(profile.availabilityPercentage ?? profile.availability_percentage ?? 100, 10);
  const hourlyRate = profile.hourlyRate ?? profile.hourly_rate;
  const normalisedHourlyRate = hourlyRate == null ? null : Number.parseFloat(hourlyRate);

  return {
    name: profile.name?.trim() || 'Crew member',
    role: profile.role?.trim() || null,
    email: profile.email?.trim() || null,
    phone: profile.phone?.trim() || null,
    status: profile.status?.trim() || 'active',
    availabilityStatus: profile.availabilityStatus?.trim() || profile.availability_status?.trim() || 'available',
    availabilityPercentage: Number.isFinite(availabilityPercentage) ? Math.max(0, Math.min(100, availabilityPercentage)) : 100,
    hourlyRate: Number.isFinite(normalisedHourlyRate) ? Number(normalisedHourlyRate.toFixed(2)) : null,
    currency: profile.currency?.trim() || 'GBP',
    avatarUrl: profile.avatarUrl?.trim() || profile.avatar_url?.trim() || null,
    bio: profile.bio ?? null,
    notes: profile.notes ?? null,
    skills: coerceSkills(profile.skills),
    certifications: profile.certifications ?? null
  };
}

function sanitiseAvailabilityInput(entries = []) {
  return entries
    .filter((entry) => entry && (entry.dayOfWeek ?? entry.day_of_week) != null)
    .map((entry, index) => {
      const day = Number.parseInt(entry.dayOfWeek ?? entry.day_of_week ?? index, 10);
      const startTime = entry.startTime ?? entry.start_time ?? '08:00';
      const endTime = entry.endTime ?? entry.end_time ?? '17:00';
      return {
        id: entry.id ?? null,
        dayOfWeek: Number.isInteger(day) ? ((day % 7) + 7) % 7 : 0,
        startTime,
        endTime,
        timezone: entry.timezone || 'Europe/London',
        isActive: Boolean(entry.isActive ?? entry.is_active ?? true)
      };
    });
}

function sanitiseZoneInput(entries = []) {
  return entries
    .map((entry) => ({
      zoneId: entry.zoneId ?? entry.zone_id,
      isPrimary: Boolean(entry.isPrimary ?? entry.is_primary ?? false)
    }))
    .filter((entry) => Boolean(entry.zoneId));
}

function sanitiseMediaInput(entries = []) {
  return entries
    .map((entry, index) => ({
      id: entry.id ?? null,
      url: entry.url?.trim(),
      label: entry.label?.trim() || null,
      type: entry.type?.trim() || 'gallery',
      isPrimary: Boolean(entry.isPrimary ?? entry.is_primary ?? false),
      sortOrder: Number.isFinite(Number(entry.sortOrder ?? entry.sort_order))
        ? Number.parseInt(entry.sortOrder ?? entry.sort_order, 10)
        : index,
      notes: entry.notes?.trim() || null
    }))
    .filter((entry) => typeof entry.url === 'string' && entry.url.length > 0);
}

function serialiseAvailability(entry) {
  return {
    id: entry.id,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    timezone: entry.timezone,
    isActive: entry.isActive
  };
}

function serialiseZone(link) {
  return {
    id: link.id,
    zoneId: link.zoneId,
    isPrimary: Boolean(link.isPrimary),
    zone: link.zone
      ? {
          id: link.zone.id,
          name: link.zone.name,
          demandLevel: link.zone.demandLevel
        }
      : null
  };
}

function serialiseMedia(entry) {
  return {
    id: entry.id,
    url: entry.url,
    label: entry.label,
    type: entry.type,
    isPrimary: entry.isPrimary,
    sortOrder: entry.sortOrder,
    notes: entry.notes ?? null
  };
}

function serialiseServiceman(record) {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    role: record.role,
    email: record.email,
    phone: record.phone,
    status: record.status,
    availabilityStatus: record.availabilityStatus,
    availabilityPercentage: record.availabilityPercentage,
    hourlyRate: record.hourlyRate,
    currency: record.currency,
    avatarUrl: record.avatarUrl,
    bio: record.bio,
    notes: record.notes,
    skills: Array.isArray(record.skills) ? record.skills : [],
    certifications: record.certifications,
    availabilities: Array.isArray(record.availabilities)
      ? record.availabilities.map(serialiseAvailability)
      : [],
    zones: Array.isArray(record.zoneLinks) ? record.zoneLinks.map(serialiseZone) : [],
    media: Array.isArray(record.media) ? record.media.map(serialiseMedia) : [],
    meta: record.meta ?? {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function buildEnumPayload(zones = []) {
  return {
    statuses: SERVICEMAN_STATUSES,
    availabilityStatuses: AVAILABILITY_STATUSES,
    daysOfWeek: DAYS_OF_WEEK,
    timezones: DEFAULT_TIMEZONES,
    mediaTypes: MEDIA_TYPES,
    currencies: DEFAULT_CURRENCIES,
    zones: zones.map((zone) => ({ id: zone.id, name: zone.name }))
  };
}

async function fetchServiceman(companyId, servicemanId, transaction) {
  const record = await ProviderServiceman.findOne({
    where: { id: servicemanId, companyId },
    include: [
      {
        model: ProviderServicemanAvailability,
        as: 'availabilities',
        separate: true,
        order: [
          ['dayOfWeek', 'ASC'],
          ['startTime', 'ASC']
        ]
      },
      {
        model: ProviderServicemanZone,
        as: 'zoneLinks',
        separate: true,
        include: [
          {
            model: ServiceZone,
            as: 'zone',
            attributes: ['id', 'name', 'demandLevel']
          }
        ],
        order: [['isPrimary', 'DESC']]
      },
      {
        model: ProviderServicemanMedia,
        as: 'media',
        separate: true,
        order: [
          ['sortOrder', 'ASC'],
          ['createdAt', 'DESC']
        ]
      }
    ],
    transaction
  });

  return record ? serialiseServiceman(record) : null;
}

export async function listProviderServicemen({ actor, companyId }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const [records, zones] = await Promise.all([
    ProviderServiceman.findAll({
      where: { companyId: company.id },
      include: [
        {
          model: ProviderServicemanAvailability,
          as: 'availabilities',
          separate: true,
          order: [
            ['dayOfWeek', 'ASC'],
            ['startTime', 'ASC']
          ]
        },
        {
          model: ProviderServicemanZone,
          as: 'zoneLinks',
          separate: true,
          include: [
            { model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'demandLevel'] }
          ]
        },
        {
          model: ProviderServicemanMedia,
          as: 'media',
          separate: true,
          order: [
            ['sortOrder', 'ASC'],
            ['createdAt', 'DESC']
          ]
        }
      ],
      order: [
        ['status', 'ASC'],
        ['name', 'ASC']
      ]
    }),
    ServiceZone.findAll({
      where: { companyId: company.id },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    })
  ]);

  return {
    servicemen: records.map(serialiseServiceman),
    enums: buildEnumPayload(zones)
  };
}

export async function createProviderServiceman({ actor, companyId, payload }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const profile = sanitiseProfileInput(payload.profile ?? payload);
  const availabilityEntries = sanitiseAvailabilityInput(payload.availability ?? []);
  const zoneEntries = sanitiseZoneInput(payload.zones ?? []);
  const mediaEntries = sanitiseMediaInput(payload.media ?? []);

  return sequelize.transaction(async (transaction) => {
    const record = await ProviderServiceman.create(
      {
        ...profile,
        companyId: company.id,
        meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {}
      },
      { transaction }
    );

    if (availabilityEntries.length) {
      await ProviderServicemanAvailability.bulkCreate(
        availabilityEntries.map((entry) => ({
          ...entry,
          id: undefined,
          servicemanId: record.id
        })),
        { transaction }
      );
    }

    if (zoneEntries.length) {
      const validZones = zoneEntries.length
        ? await ServiceZone.findAll({
            where: {
              id: { [Op.in]: zoneEntries.map((entry) => entry.zoneId) },
              companyId: company.id
            },
            attributes: ['id'],
            transaction
          })
        : [];
      const validZoneIds = new Set(validZones.map((zone) => zone.id));
      const createPayload = zoneEntries
        .filter((entry) => validZoneIds.has(entry.zoneId))
        .map((entry) => ({
          servicemanId: record.id,
          zoneId: entry.zoneId,
          isPrimary: entry.isPrimary
        }));
      if (createPayload.length) {
        await ProviderServicemanZone.bulkCreate(createPayload, { transaction });
      }
    }

    if (mediaEntries.length) {
      await ProviderServicemanMedia.bulkCreate(
        mediaEntries.map((entry) => ({
          ...entry,
          id: undefined,
          servicemanId: record.id
        })),
        { transaction }
      );
    }

    return fetchServiceman(company.id, record.id, transaction);
  });
}

export async function updateProviderServiceman({ actor, companyId, servicemanId, payload }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    const record = await ProviderServiceman.findOne({
      where: { id: servicemanId, companyId: company.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!record) {
      const error = new Error('serviceman_not_found');
      error.statusCode = 404;
      throw error;
    }

    if (payload.profile) {
      const profile = sanitiseProfileInput(payload.profile);
      await record.update(profile, { transaction });
    }

    if (Array.isArray(payload.availability)) {
      const entries = sanitiseAvailabilityInput(payload.availability);
      await ProviderServicemanAvailability.destroy({ where: { servicemanId: record.id }, transaction });
      if (entries.length) {
        await ProviderServicemanAvailability.bulkCreate(
          entries.map((entry) => ({ ...entry, id: undefined, servicemanId: record.id })),
          { transaction }
        );
      }
    }

    if (Array.isArray(payload.zones)) {
      const entries = sanitiseZoneInput(payload.zones);
      await ProviderServicemanZone.destroy({ where: { servicemanId: record.id }, transaction });
      if (entries.length) {
        const validZones = await ServiceZone.findAll({
          where: {
            id: { [Op.in]: entries.map((entry) => entry.zoneId) },
            companyId: company.id
          },
          attributes: ['id'],
          transaction
        });
        const validZoneIds = new Set(validZones.map((zone) => zone.id));
        const createPayload = entries
          .filter((entry) => validZoneIds.has(entry.zoneId))
          .map((entry) => ({
            servicemanId: record.id,
            zoneId: entry.zoneId,
            isPrimary: entry.isPrimary
          }));
        if (createPayload.length) {
          await ProviderServicemanZone.bulkCreate(createPayload, { transaction });
        }
      }
    }

    if (Array.isArray(payload.media)) {
      const entries = sanitiseMediaInput(payload.media);
      await ProviderServicemanMedia.destroy({ where: { servicemanId: record.id }, transaction });
      if (entries.length) {
        await ProviderServicemanMedia.bulkCreate(
          entries.map((entry) => ({ ...entry, id: undefined, servicemanId: record.id })),
          { transaction }
        );
      }
    }

    if (payload.meta && typeof payload.meta === 'object') {
      await record.update({ meta: { ...(record.meta ?? {}), ...payload.meta } }, { transaction });
    }

    return fetchServiceman(company.id, record.id, transaction);
  });
}

export async function deleteProviderServiceman({ actor, companyId, servicemanId }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  return sequelize.transaction(async (transaction) => {
    const record = await ProviderServiceman.findOne({
      where: { id: servicemanId, companyId: company.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!record) {
      const error = new Error('serviceman_not_found');
      error.statusCode = 404;
      throw error;
    }

    await ProviderServicemanMedia.destroy({ where: { servicemanId: record.id }, transaction });
    await ProviderServicemanAvailability.destroy({ where: { servicemanId: record.id }, transaction });
    await ProviderServicemanZone.destroy({ where: { servicemanId: record.id }, transaction });
    await record.destroy({ transaction });
  });
}
