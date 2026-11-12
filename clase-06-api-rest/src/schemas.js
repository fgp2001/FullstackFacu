import * as yup from "yup";
import { HttpError } from "./errors.js";


const fullUserShape = {
    name: yup.string().min(2).required(),
    email: yup.string().email().required(),
    password: yup.string().min(8).max(72).required(),
};

export const createUserSchema = yup.object(fullUserShape).noUnknown(true);
export const putUserSchema = yup.object(fullUserShape).noUnknown(true);

export const patchUserSchema = yup.object(
    {
        name: yup.string().min(2),
        email: yup.string().email(),
        password: yup.string().min(8).max(72),
    }).noUnknown(true).test(
        "at-least-one-field",
        "At least one field is required",
        (value) => Object.values(value ?? {}).some((field) => field !== undefined),
    );

export const validateBody = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body ?? {}, { strict: true, abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return next(new HttpError(400, "VALIDATION_ERROR", "Invalid request body", error.errors),
            );
        }

        next(error);
    }
};