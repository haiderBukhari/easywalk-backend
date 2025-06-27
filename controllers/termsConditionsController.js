import supabase from '../config/supabaseClient.js';

export const createTermsConditions = async (req, res) => {
  try {
    const { content } = req.body;
    const { data, error } = await supabase
      .from('terms_conditions')
      .insert([{ content }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTermsConditions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('terms_conditions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 