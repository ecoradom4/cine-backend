const { Branch, Room, Showtime } = require('../models');

const getAllBranches = async (req, res, next) => {
  try {
    const branches = await Branch.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Room,
          as: 'rooms',
          attributes: ['id', 'name', 'type', 'capacity']
        }
      ]
    });

    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    next(error);
  }
};

const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id, {
      include: [
        {
          model: Room,
          as: 'rooms',
          include: [
            {
              model: Showtime,
              as: 'showtimes',
              include: ['movie']
            }
          ]
        }
      ]
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const branchData = req.body;
    const branch = await Branch.create(branchData);

    res.status(201).json({
      success: true,
      message: 'Sucursal creada exitosamente',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branchData = req.body;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    await branch.update(branchData);

    res.json({
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    await branch.update({ status: 'inactive' });

    res.json({
      success: true,
      message: 'Sucursal desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};