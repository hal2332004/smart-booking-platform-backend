#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return {};

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  });

  return env;
}

async function main() {
  const env = loadEnv();
  const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Missing DATABASE_URL in environment variables.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const cities = [
      { name_vi: 'Hà Nội', name_en: 'Ha Noi', slug: 'ha-noi' },
      { name_vi: 'Hồ Chí Minh', name_en: 'Ho Chi Minh', slug: 'ho-chi-minh' },
      { name_vi: 'Đà Nẵng', name_en: 'Da Nang', slug: 'da-nang' },
      { name_vi: 'Hải Phòng', name_en: 'Hai Phong', slug: 'hai-phong' },
      { name_vi: 'Cần Thơ', name_en: 'Can Tho', slug: 'can-tho' }
    ];

    const districts = [
      { citySlug: 'ha-noi', items: [
        { name_vi: 'Ba Đình', name_en: 'Ba Dinh', slug: 'ba-dinh' },
        { name_vi: 'Cầu Giấy', name_en: 'Cau Giay', slug: 'cau-giay' },
        { name_vi: 'Hoàng Mai', name_en: 'Hoang Mai', slug: 'hoang-mai' },
        { name_vi: 'Hai Bà Trưng', name_en: 'Hai Ba Trung', slug: 'hai-ba-trung' }
      ] },
      { citySlug: 'ho-chi-minh', items: [
        { name_vi: 'Quận 1', name_en: 'District 1', slug: 'quan-1' },
        { name_vi: 'Quận 7', name_en: 'District 7', slug: 'quan-7' },
        { name_vi: 'Bình Thạnh', name_en: 'Binh Thanh', slug: 'binh-thanh' },
        { name_vi: 'Thủ Đức', name_en: 'Thu Duc', slug: 'thu-duc' }
      ] },
      { citySlug: 'da-nang', items: [
        { name_vi: 'Hải Châu', name_en: 'Hai Chau', slug: 'hai-chau' },
        { name_vi: 'Ngũ Hành Sơn', name_en: 'Ngu Hanh Son', slug: 'ngu-hanh-son' },
        { name_vi: 'Sơn Trà', name_en: 'Son Tra', slug: 'son-tra' }
      ] },
      { citySlug: 'hai-phong', items: [
        { name_vi: 'Hồng Bàng', name_en: 'Hong Bang', slug: 'hong-bang' },
        { name_vi: 'Lê Chân', name_en: 'Le Chan', slug: 'le-chan' }
      ] },
      { citySlug: 'can-tho', items: [
        { name_vi: 'Ninh Kiều', name_en: 'Ninh Kieu', slug: 'ninh-kieu' },
        { name_vi: 'Bình Thủy', name_en: 'Binh Thuy', slug: 'binh-thuy' }
      ] }
    ];

    for (const city of cities) {
      const result = await client.query(
        `INSERT INTO public.cities (name_vi, name_en, slug, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [city.name_vi, city.name_en, city.slug]
      );

      if (result.rows[0]?.id) {
        city.id = result.rows[0].id;
      } else {
        const existing = await client.query('SELECT id FROM public.cities WHERE slug = $1', [city.slug]);
        if (existing.rows[0]?.id) city.id = existing.rows[0].id;
      }
    }

    for (const group of districts) {
      const city = cities.find((c) => c.slug === group.citySlug);
      if (!city?.id) continue;

      for (const district of group.items) {
        await client.query(
          `INSERT INTO public.districts (city_id, name_vi, name_en, slug, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (city_id, slug) DO NOTHING`,
          [city.id, district.name_vi, district.name_en, district.slug]
        );
      }
    }

    console.log('✅ Seeded city and district data successfully.');
  } catch (error) {
    console.error('❌ Failed to seed location data:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
