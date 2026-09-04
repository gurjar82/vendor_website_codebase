// Central place for tender categories and the field templates that each category
// suggests when a company builds a tender, or a vendor fills their profile.
// A company can still add fully custom fields on top of these (see Tender.customFields).

export type FieldType =
  | "text" | "number" | "date" | "dropdown" | "multiselect"
  | "checkbox" | "textarea" | "file" | "table";

export interface FieldTemplate {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

export const CATEGORIES = [
  { value: "canteen", label: "Canteen / Catering" },
  { value: "water_supply", label: "Water Supply" },
  { value: "transport", label: "Transportation" },
  { value: "labour", label: "Labour / Manpower Supply" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "security", label: "Security Services" },
  { value: "construction", label: "Construction / Civil Work" },
  { value: "electrical", label: "Electrical / Maintenance" },
  { value: "facility_management", label: "Facility Management" },
  { value: "material_supply", label: "Material Supply" },
  { value: "other", label: "Other Services" }
];

// Suggested tender requirement fields per category - shown to the company when
// they pick a category in the tender builder. They can remove/edit/add to these.
export const CATEGORY_TENDER_FIELDS: Record<string, FieldTemplate[]> = {
  labour: [
    { id: "labour_category", label: "Labour category", type: "dropdown", options: ["Skilled", "Semi-skilled", "Unskilled", "Industrial", "Construction", "Housekeeping staff", "Security guards", "Drivers", "Helpers", "Other"], required: true },
    { id: "required_quantity", label: "Required quantity", type: "number", required: true },
    { id: "min_experience", label: "Minimum experience (years)", type: "number" },
    { id: "shift", label: "Shift", type: "dropdown", options: ["Day", "Night", "Rotational"] },
    { id: "working_hours", label: "Working hours", type: "text" },
    { id: "contract_duration", label: "Contract duration", type: "text" },
    { id: "accommodation_required", label: "Accommodation required", type: "checkbox" },
    { id: "transport_required", label: "Transportation required", type: "checkbox" },
    { id: "uniform_ppe", label: "Uniform / PPE required", type: "checkbox" },
    { id: "attendance_mgmt", label: "Attendance management needed", type: "checkbox" },
    { id: "overtime_terms", label: "Overtime requirements", type: "textarea" },
    { id: "wage_structure", label: "Wage / salary structure", type: "textarea" },
    { id: "statutory_compliance", label: "Statutory compliance requirements", type: "textarea" },
    { id: "replacement_policy", label: "Replacement policy", type: "textarea" }
  ],
  canteen: [
    { id: "meal_count", label: "Meal count per day", type: "number", required: true },
    { id: "menu_requirements", label: "Menu requirements", type: "textarea" },
    { id: "kitchen_requirements", label: "Kitchen requirements", type: "textarea" },
    { id: "staff_requirements", label: "Staff requirements", type: "text" },
    { id: "hygiene_requirements", label: "Hygiene requirements", type: "textarea" }
  ],
  water_supply: [
    { id: "water_quantity", label: "Water quantity (litres/day)", type: "number", required: true },
    { id: "delivery_frequency", label: "Delivery frequency", type: "text" },
    { id: "water_quality", label: "Water quality standard", type: "text" },
    { id: "tanker_requirement", label: "Tanker requirement", type: "text" },
    { id: "delivery_location", label: "Delivery location", type: "text" }
  ],
  transport: [
    { id: "vehicle_type", label: "Vehicle type", type: "dropdown", options: ["Bus", "Van", "Car", "Truck", "Other"], required: true },
    { id: "vehicle_count", label: "Number of vehicles", type: "number", required: true },
    { id: "drivers_required", label: "Drivers required", type: "number" },
    { id: "route_details", label: "Route details", type: "textarea" },
    { id: "vehicle_age", label: "Max vehicle age", type: "text" },
    { id: "permit_insurance", label: "Permit / insurance requirements", type: "textarea" }
  ],
  construction: [
    { id: "scope_of_work", label: "Scope of work", type: "textarea", required: true },
    { id: "boq", label: "Bill of quantities (BOQ)", type: "file" },
    { id: "material_requirements", label: "Material requirements", type: "textarea" },
    { id: "drawings", label: "Drawings", type: "file" },
    { id: "completion_timeline", label: "Completion timeline", type: "text" },
    { id: "equipment_requirements", label: "Equipment requirements", type: "textarea" }
  ],
  housekeeping: [
    { id: "area_sqft", label: "Area (sq. ft.)", type: "number" },
    { id: "staff_count", label: "Staff required", type: "number" },
    { id: "shift", label: "Shift", type: "text" }
  ],
  security: [
    { id: "guard_count", label: "Number of guards", type: "number", required: true },
    { id: "shift_pattern", label: "Shift pattern", type: "text" },
    { id: "armed_unarmed", label: "Armed / unarmed", type: "dropdown", options: ["Armed", "Unarmed", "Mixed"] }
  ],
  electrical: [
    { id: "work_type", label: "Type of work", type: "text" },
    { id: "equipment_involved", label: "Equipment involved", type: "textarea" }
  ],
  facility_management: [
    { id: "scope", label: "Scope of services", type: "textarea" }
  ],
  material_supply: [
    { id: "material_type", label: "Material type", type: "text", required: true },
    { id: "quantity", label: "Quantity", type: "text" },
    { id: "delivery_schedule", label: "Delivery schedule", type: "text" }
  ],
  other: []
};

// Labour-specific vendor profile fields (shown when vendor selects the labour category)
export const LABOUR_VENDOR_FIELDS: FieldTemplate[] = [
  { id: "labour_supply_types", label: "Labour supply type(s)", type: "multiselect", options: ["Skilled", "Semi-skilled", "Unskilled", "Industrial labour", "Construction labour", "Housekeeping staff", "Security guards", "Drivers", "Helpers", "Other"] },
  { id: "total_manpower", label: "Total available manpower", type: "number" },
  { id: "max_capacity", label: "Maximum manpower supply capacity", type: "number" },
  { id: "service_locations", label: "Service locations", type: "text" },
  { id: "accommodation", label: "Accommodation capability", type: "checkbox" },
  { id: "transportation", label: "Transportation capability", type: "checkbox" },
  { id: "payroll_capability", label: "Payroll / attendance management capability", type: "checkbox" }
];

export const DOCUMENT_CATEGORIES = [
  "Business Registration", "GST Certificate", "PAN / Tax Document", "MSME / Udyam",
  "Labour License / Registration", "FSSAI", "Insurance", "Previous Work Order",
  "Completion Certificate", "Experience Certificate", "Other"
];
