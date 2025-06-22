import * as promoService from '../services/promoService.js';

export const createPromo = async (req, res) => {
  try {
    const promo = await promoService.createPromo(req.body);
    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPromos = async (req, res) => {
  try {
    const promos = await promoService.getAllPromos();
    res.json(promos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPromoById = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await promoService.getPromoById(id);
    res.json(promo);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updatePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await promoService.updatePromo(id, req.body);
    res.json(promo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await promoService.deletePromo(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 