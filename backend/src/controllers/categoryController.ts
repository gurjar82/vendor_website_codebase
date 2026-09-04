import { Request, Response } from "express";
import { CATEGORIES, CATEGORY_TENDER_FIELDS, LABOUR_VENDOR_FIELDS, DOCUMENT_CATEGORIES } from "../config/categories";

// GET /api/categories  (public)
export function getCategories(_req: Request, res: Response) {
  res.json({
    categories: CATEGORIES,
    tenderFieldTemplates: CATEGORY_TENDER_FIELDS,
    labourVendorFields: LABOUR_VENDOR_FIELDS,
    documentCategories: DOCUMENT_CATEGORIES
  });
}
