import Client from '../models/Client.js';

export const listClients = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, status, city } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const query = { firmId: req.tenantFirmId };

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[GET /api/clients] tenantFirmId used in query:', req.tenantFirmId, typeof req.tenantFirmId);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { pan: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (city) {
      query.city = city;
    }

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort(sortBy.startsWith('-') ? { [sortBy.slice(1)]: -1 } : { [sortBy]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(query)
    ]);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[GET /api/clients] clients returned:', clients.length, 'total matching firm:', total);
    }

    res.json({
      success: true,
      data: {
        clients,
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

export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const data = req.validatedData;

    const existingEmail = await Client.findOne({
      email: data.email,
      firmId: req.tenantFirmId
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    if (data.pan) {
      const existingPan = await Client.findOne({
        pan: data.pan,
        firmId: req.tenantFirmId
      });
      if (existingPan) {
        return res.status(400).json({
          success: false,
          message: 'Client with this PAN already exists'
        });
      }
    }

    const client = await Client.create({
      ...data,
      firmId: req.tenantFirmId
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const data = req.validatedData;

    // Check email uniqueness
    if (data.email && data.email !== client.email) {
      const duplicate = await Client.findOne({
        email: data.email,
        firmId: req.tenantFirmId,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Check PAN uniqueness
    if (data.pan && data.pan !== client.pan) {
      const duplicate = await Client.findOne({
        pan: data.pan,
        firmId: req.tenantFirmId,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'PAN already in use'
        });
      }
    }

    Object.assign(client, data);
    await client.save();

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
