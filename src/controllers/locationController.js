const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Đà Nẵng — danh sách duy nhất tỉnh/thành phố sau khi sáp nhập.
 */
const CITIES_DATA = [
  { id: 1, name_vi: 'Đà Nẵng', name_en: 'Da Nang', slug: 'da-nang', is_active: true },
];

/**
 * Danh sách chuẩn 94 phường/xã/đặc khu của Thành phố Đà Nẵng
 * (Theo Nghị quyết sắp xếp đơn vị hành chính cấp xã của TP Đà Nẵng).
 */
const DANANG_94_WARDS = [
  'Phường Hải Châu',
  'Phường Hòa Cường',
  'Phường Thanh Khê',
  'Phường An Khê',
  'Phường An Hải',
  'Phường Sơn Trà',
  'Phường Ngũ Hành Sơn',
  'Phường Hòa Khánh',
  'Phường Hải Vân',
  'Phường Liên Chiểu',
  'Phường Cẩm Lệ',
  'Phường Hòa Xuân',
  'Phường Tam Kỳ',
  'Phường Quảng Phú',
  'Phường Hương Trà',
  'Phường Bàn Thạch',
  'Phường Điện Bàn',
  'Phường Điện Bàn Đông',
  'Phường An Thắng',
  'Phường Điện Bàn Bắc',
  'Phường Hội An',
  'Phường Hội An Đông',
  'Phường Hội An Tây',
  'Xã Hòa Vang',
  'Xã Hòa Tiến',
  'Xã Bà Nà',
  'Xã Núi Thành',
  'Xã Tam Mỹ',
  'Xã Tam Anh',
  'Xã Đức Phú',
  'Xã Tam Xuân',
  'Xã Tây Hồ',
  'Xã Chiên Đàn',
  'Xã Phú Ninh',
  'Xã Lãnh Ngọc',
  'Xã Tiên Phước',
  'Xã Thạnh Bình',
  'Xã Sơn Cẩm Hà',
  'Xã Trà Liên',
  'Xã Trà Giáp',
  'Xã Trà Tân',
  'Xã Trà Đốc',
  'Xã Trà My',
  'Xã Nam Trà My',
  'Xã Trà Tập',
  'Xã Trà Vân',
  'Xã Trà Linh',
  'Xã Trà Leng',
  'Xã Thăng Bình',
  'Xã Thăng An',
  'Xã Thăng Trường',
  'Xã Thăng Điền',
  'Xã Thăng Phú',
  'Xã Đồng Dương',
  'Xã Quế Sơn Trung',
  'Xã Quế Sơn',
  'Xã Xuân Phú',
  'Xã Nông Sơn',
  'Xã Quế Phước',
  'Xã Duy Nghĩa',
  'Xã Nam Phước',
  'Xã Duy Xuyên',
  'Xã Thu Bồn',
  'Xã Điện Bàn Tây',
  'Xã Gò Nổi',
  'Xã Đại Lộc',
  'Xã Hà Nha',
  'Xã Thượng Đức',
  'Xã Vu Gia',
  'Xã Phú Thuận',
  'Xã Thạnh Mỹ',
  'Xã Bến Giằng',
  'Xã Nam Giang',
  'Xã Đắc Pring',
  'Xã La Dêê',
  'Xã La Êê',
  'Xã Sông Vàng',
  'Xã Sông Kôn',
  'Xã Đông Giang',
  'Xã Bến Hiên',
  'Xã Avương',
  'Xã Tây Giang',
  'Xã Hùng Sơn',
  'Xã Hiệp Đức',
  'Xã Việt An',
  'Xã Phước Trà',
  'Xã Khâm Đức',
  'Xã Phước Năng',
  'Xã Phước Chánh',
  'Xã Phước Thành',
  'Xã Phước Hiệp',
  'Đặc khu Hoàng Sa',
  'Xã Tam Hải',
  'Xã Tân Hiệp',
];

const DISTRICTS_DATA = {
  1: DANANG_94_WARDS.map((name, index) => {
    const num = index + 1;
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return {
      id: 100 + num,
      city_id: 1,
      name_vi: name,
      slug: `${baseSlug}-${100 + num}`,
      is_active: true,
    };
  }),
};

let hasSyncedDB = false;

/**
 * Tự động đồng bộ danh sách 94 xã phường vào bảng Database Supabase.
 */
const syncLocationsToDB = async () => {
  if (hasSyncedDB) return;
  const client = supabaseAdmin || supabase;

  try {
    // 1. Đồng bộ thành phố Đà Nẵng (ID = 1)
    await client.from('cities').upsert(
      [
        {
          id: 1,
          name_vi: 'Đà Nẵng',
          name_en: 'Da Nang',
          slug: 'da-nang',
          is_active: true,
        },
      ],
      { onConflict: 'id' }
    );

    // 2. Đồng bộ 94 phường xã vào bảng districts
    const districtsToSync = DISTRICTS_DATA[1].map((d) => ({
      id: d.id,
      city_id: 1,
      name_vi: d.name_vi,
      name_en: d.name_vi,
      slug: d.slug,
      is_active: true,
    }));

    const { error: syncErr } = await client.from('districts').upsert(districtsToSync, { onConflict: 'id' });
    if (!syncErr) {
      hasSyncedDB = true;
    }
  } catch (err) {
    console.error('Lỗi tự động đồng bộ địa điểm vào Supabase DB:', err.message);
  }
};

/**
 * Get all cities
 * @route GET /api/locations/cities
 */
const getCities = async (req, res, next) => {
  try {
    await syncLocationsToDB();

    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name_vi', { ascending: true });

    if (error || !data || data.length === 0) {
      return res.json(CITIES_DATA);
    }

    const result = data.filter((c) => c.name_vi.toLowerCase().includes('đà nẵng'));

    if (result.length === 0) {
      return res.json(CITIES_DATA);
    }

    res.json(result);
  } catch (error) {
    res.json(CITIES_DATA);
  }
};

/**
 * Get all districts for a specific city
 * @route GET /api/locations/cities/:cityId/districts
 */
const getDistrictsByCity = async (req, res, next) => {
  try {
    const { cityId } = req.params;

    await syncLocationsToDB();

    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('name_vi', { ascending: true });

    const fallbackList = DISTRICTS_DATA[1];

    if (error || !data || data.length === 0) {
      return res.json(fallbackList);
    }

    res.json(data);
  } catch (error) {
    res.json(DISTRICTS_DATA[1]);
  }
};

module.exports = {
  getCities,
  getDistrictsByCity,
  syncLocationsToDB,
  DISTRICTS_DATA,
};
