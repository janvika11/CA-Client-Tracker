import { ZodError } from 'zod';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
};

export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Query validation error',
          errors: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
};
