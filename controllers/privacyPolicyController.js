import supabase from '../config/supabaseClient.js';

export const createPrivacyPolicy = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required.' });
    }
    // Delete all existing records first
    const { error: deleteError } = await supabase
    .from('privacy_policy')
    .delete()
    .not('id', 'is', null); // This ensures deletion of all rows with a non-null id
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
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};

export const getAllPrivacyPolicies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('privacy_policy')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    res.json(data && data.length > 0 ? data[0] : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 