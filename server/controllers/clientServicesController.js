import ClientService from '../models/ClientService.js';
import Client from '../models/Client.js';
import Service from '../models/Service.js';

export const listClientServices = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const query = { firmId: req.tenantFirmId };

    const [clientServices, total] = await Promise.all([
      ClientService.find(query)
        .populate('clientId', 'name email')
        .populate('serviceId', 'name code category')
        .sort(sortBy.startsWith('-') ? { [sortBy.slice(1)]: -1 } : { [sortBy]: 1 })
        .skip(skip)
        .limit(limit),
      ClientService.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        clientServices,
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

export const getClientService = async (req, res, next) => {
  try {
    const clientService = await ClientService.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    })
      .populate('clientId', 'name email')
      .populate('serviceId', 'name code category defaultPrice');

    if (!clientService) {
      return res.status(404).json({
        success: false,
        message: 'Client service not found'
      });
    }

    res.json({
      success: true,
      data: { clientService }
    });
  } catch (error) {
    next(error);
  }
};

export const createClientService = async (req, res, next) => {
  try {
    const { clientId, serviceId, customPrice, billingCycle, startDate, endDate, isActive } = req.validatedData;

    // Verify client and service exist and belong to this firm
    const [client, service] = await Promise.all([
      Client.findOne({ _id: clientId, firmId: req.tenantFirmId }),
      Service.findOne({ _id: serviceId, firmId: req.tenantFirmId })
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check for duplicate subscription
    const existing = await ClientService.findOne({
      clientId,
      serviceId,
      firmId: req.tenantFirmId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Client already subscribed to this service'
      });
    }

    const clientService = await ClientService.create({
      clientId,
      serviceId,
      customPrice: customPrice || service.defaultPrice,
      billingCycle: billingCycle || service.billingCycle,
      startDate,
      endDate: endDate || null,
      isActive: isActive !== false,
      firmId: req.tenantFirmId
    });

    await clientService.populate('clientId', 'name email');
    await clientService.populate('serviceId', 'name code category');

    res.status(201).json({
      success: true,
      message: 'Client service created successfully',
      data: { clientService }
    });
  } catch (error) {
    next(error);
  }
};

export const updateClientService = async (req, res, next) => {
  try {
    const clientService = await ClientService.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!clientService) {
      return res.status(404).json({
        success: false,
        message: 'Client service not found'
      });
    }

    const { customPrice, billingCycle, endDate, isActive } = req.validatedData;

    if (customPrice !== undefined) clientService.customPrice = customPrice;
    if (billingCycle !== undefined) clientService.billingCycle = billingCycle;
    if (endDate !== undefined) clientService.endDate = endDate;
    if (isActive !== undefined) clientService.isActive = isActive;

    await clientService.save();
    await clientService.populate('clientId', 'name email');
    await clientService.populate('serviceId', 'name code category');

    res.json({
      success: true,
      message: 'Client service updated successfully',
      data: { clientService }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClientService = async (req, res, next) => {
  try {
    const clientService = await ClientService.findOneAndDelete({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!clientService) {
      return res.status(404).json({
        success: false,
        message: 'Client service not found'
      });
    }

    res.json({
      success: true,
      message: 'Client service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getClientServices = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findOne({
      _id: clientId,
      firmId: req.tenantFirmId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const services = await ClientService.find({
      clientId,
      firmId: req.tenantFirmId
    }).populate('serviceId', 'name code category defaultPrice');

    res.json({
      success: true,
      data: {
        clientId,
        services
      }
    });
  } catch (error) {
    next(error);
  }
};
