const { PricingRule, RoomType, SeatType, Branch } = require('../models');

const getAllPricingRules = async (req, res, next) => {
  try {
    const pricingRules = await PricingRule.findAll({
      include: [
        { model: RoomType, as: 'roomType' },
        { model: SeatType, as: 'seatType' },
        { model: Branch, as: 'branch' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: pricingRules
    });
  } catch (error) {
    next(error);
  }
};

const createPricingRule = async (req, res, next) => {
  try {
    const pricingData = req.body;
    const pricingRule = await PricingRule.create(pricingData);

    const ruleWithDetails = await PricingRule.findByPk(pricingRule.id, {
      include: [
        { model: RoomType, as: 'roomType' },
        { model: SeatType, as: 'seatType' },
        { model: Branch, as: 'branch' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Regla de precio creada exitosamente',
      data: ruleWithDetails
    });
  } catch (error) {
    next(error);
  }
};

const calculatePrice = async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;
    
    const totalPrice = await calculateDynamicPrice(showtimeId, seats);
    
    res.json({
      success: true,
      data: { totalPrice }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPricingRules,
  createPricingRule,
  calculatePrice
};