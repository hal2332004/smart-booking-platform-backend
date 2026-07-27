const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Get all apartments (Public - only published)
 * @route GET /api/apartments
 */
const getApartments = async (req, res, next) => {
  try {
    const { city_id, district_id, type, min_price, max_price, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('apartments')
      .select('*, cities(name_vi), districts(name_vi), apartment_media(*)', { count: 'exact' })
      .eq('published', true)
      .is('deleted_at', null);

    if (city_id) query = query.eq('city_id', city_id);
    if (district_id) query = query.eq('district_id', district_id);
    if (type) query = query.eq('apartment_type', type);
    if (min_price) query = query.gte('rent_price', min_price);
    if (max_price) query = query.lte('rent_price', max_price);

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      data,
      meta: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all apartments (Admin - includes unpublished/deleted)
 * @route GET /api/apartments/admin/all
 */
const getAdminApartments = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const client = supabaseAdmin || supabase;

    // Admins can see everything
    const { data, count, error } = await client
      .from('apartments')
      .select('*, cities(name_vi), districts(name_vi)', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      data: data || [],
      meta: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get apartment by slug (Public)
 * @route GET /api/apartments/:slug
 */
const getApartmentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const { data, error } = await supabase
      .from('apartments')
      .select(`
        *,
        cities(name_vi),
        districts(name_vi),
        apartment_media(*),
        apartment_amenities(
          amenities(name_vi, icon_name)
        )
      `)
      .eq('slug', slug)
      .eq('published', true)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Apartment not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new apartment (Admin)
 * @route POST /api/apartments
 */
const createApartment = async (req, res, next) => {
  try {
    // For admin tasks that might bypass standard RLS, use supabaseAdmin if configured.
    // However, if we pass the user token to the Supabase client, we don't strictly need supabaseAdmin.
    // Given we just have a general supabase client initialized, we can use that if the user's RLS is set up.
    // For simplicity, we'll use supabaseAdmin to ensure we can create it, or use standard if we don't have Admin Key.
    
    const client = supabaseAdmin || supabase;
    const apartmentData = req.body;

    // Set created_by if we have req.user from auth middleware
    if (req.user) {
      apartmentData.created_by = req.user.id;
    }

    const { data, error } = await client
      .from('apartments')
      .insert(apartmentData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an apartment (Admin)
 * @route PUT /api/apartments/:id
 */
const updateApartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const client = supabaseAdmin || supabase;

    if (req.user) {
      updateData.updated_by = req.user.id;
    }

    const { data, error } = await client
      .from('apartments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete (soft delete) an apartment (Admin)
 * @route DELETE /api/apartments/:id
 */
const deleteApartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = supabaseAdmin || supabase;

    const { error } = await client
      .from('apartments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApartments,
  getAdminApartments,
  getApartmentBySlug,
  createApartment,
  updateApartment,
  deleteApartment
};
