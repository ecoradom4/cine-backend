const { Promotion, Branch, Movie, Booking } = require('../models');
const { Op } = require('sequelize');

const getAllPromotions = async (req, res, next) => {
  try {
    const { isActive, branchId, movieId } = req.query;
    
    const where = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (branchId) {
      where.branchId = branchId;
    }
    
    if (movieId) {
      where.movieId = movieId;
    }

    // Solo mostrar promociones válidas (no expiradas)
    where[Op.or] = [
      {
        validUntil: { [Op.gte]: new Date() }
      },
      {
        validUntil: null
      }
    ];

    const promotions = await Promotion.findAll({
      where,
      include: [
        { model: Branch, as: 'branch' },
        { model: Movie, as: 'movie' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    next(error);
  }
};

const validatePromotion = async (req, res, next) => {
  try {
    const { code, showtimeId, totalAmount } = req.body;

    const promotion = await Promotion.findOne({
      where: { 
        code,
        isActive: true,
        validFrom: { [Op.lte]: new Date() },
        validUntil: { 
          [Op.or]: [
            { [Op.gte]: new Date() },
            { [Op.is]: null }
          ]
        },
        usageLimit: { 
          [Op.or]: [
            { [Op.gt]: { [Op.col]: 'usedCount' } },
            { [Op.is]: null }
          ]
        }
      },
      include: [
        { model: Branch, as: 'branch' },
        { model: Movie, as: 'movie' }
      ]
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no válida o expirada'
      });
    }

    // Verificar monto mínimo de compra
    if (promotion.minPurchase && totalAmount < promotion.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Monto mínimo de compra: $${promotion.minPurchase}`
      });
    }

    let discountAmount = 0;
    let finalAmount = totalAmount;

    if (promotion.type === 'percentage') {
      discountAmount = totalAmount * (promotion.value / 100);
      if (promotion.maxDiscount) {
        discountAmount = Math.min(discountAmount, promotion.maxDiscount);
      }
      finalAmount = totalAmount - discountAmount;
    } else if (promotion.type === 'fixed') {
      discountAmount = promotion.value;
      finalAmount = totalAmount - discountAmount;
    } else if (promotion.type === 'bogo') {
      // Buy One Get One - lógica específica
      discountAmount = totalAmount / 2; // Asumiendo 2 entradas
      finalAmount = totalAmount - discountAmount;
    }

    // Asegurar que el precio final no sea negativo
    finalAmount = Math.max(0, finalAmount);

    res.json({
      success: true,
      data: {
        promotion,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
        isValid: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const createPromotion = async (req, res, next) => {
  try {
    const promotionData = req.body;

    // Validar datos requeridos
    if (!promotionData.name || !promotionData.type || !promotionData.value) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, tipo y valor son requeridos'
      });
    }

    // Verificar que el código sea único si se proporciona
    if (promotionData.code) {
      const existingPromotion = await Promotion.findOne({
        where: { code: promotionData.code }
      });

      if (existingPromotion) {
        return res.status(400).json({
          success: false,
          message: 'El código de promoción ya existe'
        });
      }
    }

    const promotion = await Promotion.create(promotionData);

    const promotionWithDetails = await Promotion.findByPk(promotion.id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Movie, as: 'movie' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Promoción creada exitosamente',
      data: promotionWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promotionData = req.body;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    // Verificar unicidad del código si se está actualizando
    if (promotionData.code && promotionData.code !== promotion.code) {
      const existingPromotion = await Promotion.findOne({
        where: { code: promotionData.code }
      });

      if (existingPromotion) {
        return res.status(400).json({
          success: false,
          message: 'El código de promoción ya existe'
        });
      }
    }

    await promotion.update(promotionData);

    const updatedPromotion = await Promotion.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Movie, as: 'movie' }
      ]
    });

    res.json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: updatedPromotion
    });
  } catch (error) {
    next(error);
  }
};

const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: {
            status: { [Op.in]: ['confirmed', 'pending'] }
          },
          required: false
        }
      ]
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    // Verificar si hay reservas activas usando esta promoción
    if (promotion.bookings && promotion.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una promoción con reservas activas'
      });
    }

    await promotion.destroy();

    res.json({
      success: true,
      message: 'Promoción eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Movie, as: 'movie' },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: Showtime,
              as: 'showtime',
              include: ['movie', 'room']
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    res.json({
      success: true,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPromotions,
  validatePromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionById
};