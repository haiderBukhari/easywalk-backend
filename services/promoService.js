import supabase from "../config/supabaseClient.js";

export const createPromo = async (promoData) => {
  const { heading, sub_description, description, price } = promoData;
  const { data, error } = await supabase
    .from("promo")
    .insert([{ heading, sub_description, description, price }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getAllPromos = async () => {
  const { data, error } = await supabase
    .from("promo")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const getPromoById = async (id) => {
  const { data, error } = await supabase
    .from("promo")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Promo not found");
  return data;
};

export const updatePromo = async (id, updates) => {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("promo")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Promo not found");
  return data;
};

export const deletePromo = async (id) => {
  const { error } = await supabase
    .from("promo")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true, message: "Promo deleted successfully" };
}; 