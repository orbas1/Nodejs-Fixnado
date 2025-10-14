import { bbox as turfBbox, centroid as turfCentroid, area as turfArea, booleanValid, feature } from '@turf/turf';

function normaliseGeometry(raw) {
  if (!raw) {
    return null;
  }

  let geometry = raw;
  if (typeof geometry === 'string') {
    try {
      geometry = JSON.parse(geometry);
    } catch {
      return null;
    }
  }

  if (geometry.type === 'FeatureCollection') {
    const [first] = geometry.features || [];
    geometry = first?.geometry;
  }

  if (geometry.type === 'Feature') {
    geometry = geometry.geometry;
  }

  if (!geometry) {
    return null;
  }

  if (geometry.type === 'Polygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [geometry.coordinates]
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry;
  }

  return null;
}

function computeAttributes(multiPoly) {
  const multiFeature = feature(multiPoly);
  const centroidFeature = turfCentroid(multiFeature);
  const bbox = turfBbox(multiFeature);

  return {
    centroid: centroidFeature.geometry,
    boundingBox: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3]
    },
    areaSqMeters: turfArea(multiFeature)
  };
}

export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = dialect === 'postgres' ? Sequelize.JSONB : Sequelize.JSON;
    const geometryType = dialect === 'postgres' ? Sequelize.GEOMETRY('MULTIPOLYGON', 4326) : jsonType;
    const pointType = dialect === 'postgres' ? Sequelize.GEOMETRY('POINT', 4326) : jsonType;

    await queryInterface.addColumn(
      'ServiceZone',
      'boundary',
      {
        type: geometryType,
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'ServiceZone',
      'centroid',
      {
        type: pointType,
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'ServiceZone',
      'bounding_box',
      {
        type: jsonType,
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'ServiceZone',
      'metadata',
      {
        type: jsonType,
        allowNull: false,
        defaultValue: {}
      },
      { transaction }
    );

    const [rows] = await queryInterface.sequelize.query(
      'SELECT id, geo_json FROM "ServiceZone"',
      { transaction }
    );

    for (const row of rows) {
      const multi = normaliseGeometry(row.geo_json);
      if (!multi) {
        continue;
      }

      const multiFeature = feature(multi);
      if (!booleanValid(multiFeature)) {
        continue;
      }

      const attributes = computeAttributes(multi);

      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          `UPDATE "ServiceZone" SET
            boundary = ST_SetSRID(ST_GeomFromGeoJSON(:boundary), 4326),
            centroid = ST_SetSRID(ST_GeomFromGeoJSON(:centroid), 4326),
            bounding_box = CAST(:boundingBox AS JSONB)
          WHERE id = :id`,
          {
            transaction,
            replacements: {
              id: row.id,
              boundary: JSON.stringify(multi),
              centroid: JSON.stringify(attributes.centroid),
              boundingBox: JSON.stringify(attributes.boundingBox)
            }
          }
        );
      } else {
        await queryInterface.bulkUpdate(
          'ServiceZone',
          {
            boundary: multi,
            centroid: attributes.centroid,
            bounding_box: attributes.boundingBox
          },
          { id: row.id },
          { transaction }
        );
      }
    }

    await queryInterface.changeColumn(
      'ServiceZone',
      'boundary',
      {
        type: geometryType,
        allowNull: false
      },
      { transaction }
    );

    await queryInterface.changeColumn(
      'ServiceZone',
      'centroid',
      {
        type: pointType,
        allowNull: false
      },
      { transaction }
    );

    await queryInterface.changeColumn(
      'ServiceZone',
      'bounding_box',
      {
        type: jsonType,
        allowNull: false
      },
      { transaction }
    );

    await queryInterface.removeColumn('ServiceZone', 'geo_json', { transaction });

    await queryInterface.addConstraint('ServiceZone', {
      fields: ['company_id', 'name'],
      type: 'unique',
      name: 'service_zone_company_name_unique',
      transaction
    });

    await queryInterface.addIndex('ServiceZone', ['company_id'], {
      name: 'service_zone_company_idx',
      transaction
    });

    await queryInterface.addIndex('ServiceZone', ['demand_level'], {
      name: 'service_zone_demand_idx',
      transaction
    });

    await queryInterface.createTable(
      'ServiceZoneCoverage',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        zone_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ServiceZone',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        service_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Service',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        coverage_type: {
          type: Sequelize.ENUM('primary', 'secondary', 'supplementary'),
          allowNull: false,
          defaultValue: 'primary'
        },
        priority: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        effective_from: {
          type: Sequelize.DATE,
          allowNull: true
        },
        effective_to: {
          type: Sequelize.DATE,
          allowNull: true
        },
        metadata: {
          type: jsonType,
          allowNull: false,
          defaultValue: {}
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }
      },
      { transaction }
    );

    await queryInterface.addConstraint('ServiceZoneCoverage', {
      fields: ['zone_id', 'service_id'],
      type: 'unique',
      name: 'service_zone_coverage_unique',
      transaction
    });

    await queryInterface.addIndex('ServiceZoneCoverage', ['zone_id'], {
      name: 'service_zone_coverage_zone_idx',
      transaction
    });

    await queryInterface.addIndex('ServiceZoneCoverage', ['service_id'], {
      name: 'service_zone_coverage_service_idx',
      transaction
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = dialect === 'postgres' ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.dropTable('ServiceZoneCoverage', { transaction });

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ServiceZoneCoverage_coverage_type"', {
        transaction
      });
    }

    await queryInterface.removeIndex('ServiceZone', 'service_zone_demand_idx', { transaction });
    await queryInterface.removeIndex('ServiceZone', 'service_zone_company_idx', { transaction });
    await queryInterface.removeConstraint('ServiceZone', 'service_zone_company_name_unique', { transaction });

    await queryInterface.addColumn(
      'ServiceZone',
      'geo_json',
      {
        type: jsonType,
        allowNull: true
      },
      { transaction }
    );

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `UPDATE "ServiceZone" SET geo_json = ST_AsGeoJSON(boundary)::jsonb`,
        { transaction }
      );
    } else {
      const [rows] = await queryInterface.sequelize.query(
        'SELECT id, boundary FROM "ServiceZone"',
        { transaction }
      );

      for (const row of rows) {
        await queryInterface.bulkUpdate(
          'ServiceZone',
          { geo_json: row.boundary },
          { id: row.id },
          { transaction }
        );
      }
    }

    await queryInterface.removeColumn('ServiceZone', 'bounding_box', { transaction });
    await queryInterface.removeColumn('ServiceZone', 'centroid', { transaction });
    await queryInterface.removeColumn('ServiceZone', 'boundary', { transaction });
    await queryInterface.removeColumn('ServiceZone', 'metadata', { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
