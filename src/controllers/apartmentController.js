const { supabase, supabaseAdmin } = require('../config/supabase');
const { DISTRICTS_DATA, syncLocationsToDB } = require('./locationController');

/**
 * Ensures that city_id and district_id exist in Supabase database tables
 * before creating or updating an apartment, to prevent FK constraint errors.
 */
const ensureValidLocation = async (client, data) => {
  // Sync locations to DB first if needed
  await syncLocationsToDB().catch(() => {});

  // 1. Validate city_id
  if (data.city_id) {
    try {
      const { data: cRow } = await client
        .from('cities')
        .select('id')
        .eq('id', data.city_id)
        .maybeSingle();

      if (!cRow) {
        const { error: insCityErr } = await client.from('cities').upsert(
          [
            {
              id: Number(data.city_id),
              name_vi: 'Đà Nẵng',
              name_en: 'Da Nang',
              slug: `da-nang-${data.city_id}`,
              is_active: true,
            },
          ],
          { onConflict: 'id' }
        );

        if (insCityErr) {
          const { data: c1Row } = await client.from('cities').select('id').eq('id', 1).maybeSingle();
          data.city_id = c1Row ? 1 : null;
        }
      }
    } catch (e) {
      data.city_id = null;
    }
  }

  // 2. Validate district_id
  if (data.district_id) {
    try {
      const { data: dRow } = await client
        .from('districts')
        .select('id')
        .eq('id', data.district_id)
        .maybeSingle();

      if (!dRow) {
        const foundDistrict = (DISTRICTS_DATA[1] || []).find((d) => d.id === Number(data.district_id));
        const targetCityId = data.city_id || 1;

        const { error: insDistErr } = await client.from('districts').upsert(
          [
            {
              id: Number(data.district_id),
              city_id: targetCityId,
              name_vi: foundDistrict ? foundDistrict.name_vi : `Phường/Xã ${data.district_id}`,
              name_en: foundDistrict ? foundDistrict.name_vi : `Ward ${data.district_id}`,
              slug: foundDistrict ? foundDistrict.slug : `district-${data.district_id}`,
              is_active: true,
            },
          ],
          { onConflict: 'id' }
        );

        if (insDistErr) {
          console.warn('Could not insert missing district into DB, setting district_id to null:', insDistErr.message);
          data.district_id = null;
        }
      }
    } catch (err) {
      console.error('ensureValidLocation district error:', err);
      data.district_id = null;
    }
  }
};

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

    // Admins see all active/published/draft apartments (exclude soft-deleted)
    const { data, count, error } = await client
      .from('apartments')
      .select('*, cities(name_vi), districts(name_vi), apartment_media(*)', { count: 'exact' })
      .is('deleted_at', null)
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
    const client = supabaseAdmin || supabase;
    const apartmentData = req.body;

    // Set created_by if we have req.user from auth middleware
    if (req.user) {
      apartmentData.created_by = req.user.id;
    }

    // Ensure city_id and district_id exist in database to prevent FK constraint error
    await ensureValidLocation(client, apartmentData);

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

    // Ensure city_id and district_id exist in database to prevent FK constraint error
    await ensureValidLocation(client, updateData);

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
 * Delete an apartment (Admin)
 * Deletes all files in storage bucket 'apartments/<id>/' and deletes related DB records.
 * Falls back to soft-delete if foreign key constraints prevent hard delete.
 * @route DELETE /api/apartments/:id
 */
const deleteApartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = supabaseAdmin || supabase;

    // 1. Delete all files in storage bucket under directory `id/`
    try {
      const { data: files, error: listErr } = await client
        .storage
        .from('apartments')
        .list(id);

      if (!listErr && files && files.length > 0) {
        const filesToRemove = files.map((file) => `${id}/${file.name}`);
        await client.storage.from('apartments').remove(filesToRemove);
      }
    } catch (storageErr) {
      console.error('Storage bucket cleanup warning:', storageErr);
    }

    // 2. Delete related database table rows (media, amenities, favorites, bookings)
    try {
      await Promise.allSettled([
        client.from('apartment_media').delete().eq('apartment_id', id),
        client.from('apartment_amenities').delete().eq('apartment_id', id),
        client.from('favorites').delete().eq('apartment_id', id),
        client.from('bookings').delete().eq('apartment_id', id),
      ]);
    } catch (relErr) {
      console.warn('Related tables deletion warning:', relErr);
    }

    // 3. Delete apartment record from database (hard delete)
    const { error: deleteErr } = await client
      .from('apartments')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      console.warn('Hard delete warning, attempting soft delete fallback:', deleteErr.message);
      // Soft-delete fallback if hard delete is restricted
      const { error: softErr } = await client
        .from('apartments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (softErr) throw softErr;
    }

    res.status(204).send();
  } catch (error) {
    console.error('deleteApartment failed:', error);
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
