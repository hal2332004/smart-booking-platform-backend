const { supabase } = require('../config/supabase');

/**
 * Get all cities
 * @route GET /api/locations/cities
 */
const getCities = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name_vi', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json([
        { id: 1, name_vi: 'Hà Nội', name_en: 'Ha Noi', slug: 'ha-noi', is_active: true },
        { id: 2, name_vi: 'Hồ Chí Minh', name_en: 'Ho Chi Minh', slug: 'ho-chi-minh', is_active: true },
        { id: 3, name_vi: 'Đà Nẵng', name_en: 'Da Nang', slug: 'da-nang', is_active: true }
      ]);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all districts for a specific city
 * @route GET /api/locations/cities/:cityId/districts
 */
const getDistrictsByCity = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('name_vi', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      const fallbackDistricts = {
        1: [
          { id: 101, city_id: 1, name_vi: 'Ba Đình', name_en: 'Ba Dinh', slug: 'ba-dinh', is_active: true },
          { id: 102, city_id: 1, name_vi: 'Cầu Giấy', name_en: 'Cau Giay', slug: 'cau-giay', is_active: true }
        ],
        2: [
          { id: 201, city_id: 2, name_vi: 'Quận 1', name_en: 'District 1', slug: 'quan-1', is_active: true },
          { id: 202, city_id: 2, name_vi: 'Bình Thạnh', name_en: 'Binh Thanh', slug: 'binh-thanh', is_active: true }
        ],
        3: [
          { id: 301, city_id: 3, name_vi: 'Hải Châu', name_en: 'Hai Chau', slug: 'hai-chau', is_active: true }
        ]
      };

      return res.json(fallbackDistricts[cityId] || []);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCities,
  getDistrictsByCity
};
