const { supabase } = require('../config/supabase');

/**
 * Get all amenities
 * @route GET /api/amenities
 */
const getAmenities = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name_vi', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAmenities
};
