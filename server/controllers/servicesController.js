import Service from '../models/Service.js';

export const listServices = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, category, status } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const query = { firmId: req.tenantFirmId };

    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];
    }

    if (category) {
      query.category = category;
    }

    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort(sortBy.startsWith('-') ? { [sortBy.slice(1)]: -1 } : { [sortBy]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getService = async (req, res, next) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const data = req.validatedData;

    const existingCode = await Service.findOne({
      code: data.code,
      firmId: req.tenantFirmId
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Service code already exists'
      });
    }

    const service = await Service.create({
      ...data,
      firmId: req.tenantFirmId
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const data = req.validatedData;

    if (data.code && data.code !== service.code) {
      const duplicate = await Service.findOne({
        code: data.code,
        firmId: req.tenantFirmId,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Service code already exists'
        });
      }
    }

    Object.assign(service, data);
    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
