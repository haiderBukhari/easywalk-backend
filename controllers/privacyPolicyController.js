import supabase from '../config/supabaseClient.js';

export const createPrivacyPolicy = async (req, res) => {
  try {
    const { content } = req.body;
    // Delete all existing records first
    const { error: deleteError } = await supabase
      .from('privacy_policy')
      .delete()
      .neq('id', ''); // delete all
    if (deleteError) throw deleteError;
    // Insert the new record
    const { data, error } = await supabase
      .from('privacy_policy')
      .insert([{ content }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPrivacyPolicies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('privacy_policy')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 