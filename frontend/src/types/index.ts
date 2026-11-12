export type UserRole = "PATIENT" | "PROFESSIONAL" | "ADMIN";

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  language_preference: "en" | "ml";
  is_email_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  profile?: PatientProfile | ProfessionalProfile;
}

export interface PatientProfile {
  id: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface ProfessionalProfile {
  id: string;
  medical_license_number: string;
  specialization: string;
  qualifications: string;
  hospital_or_clinic: string;
  years_of_experience: number;
  is_verified: boolean;
  verification_notes?: string;
  is_available_for_reviews: boolean;
}

export interface MedicineIngredient {
  id: string;
  name: string;
  strength: string;
}

export interface MedicineBrand {
  id: string;
  brand_name: string;
  manufacturer: string;
}

export interface Medicine {
  id: string;
  name: string;
  brand_name: string;
  generic_name: string;
  medicine_category: string;
  dosage_form: string;
  strength: string;
  common_uses: string;
  common_uses_ml?: string;
  how_it_works: string;
  how_it_works_ml?: string;
  common_side_effects: string[];
  common_side_effects_ml?: string[];
  serious_warnings: string;
  serious_warnings_ml?: string;
  precautions: string;
  precautions_ml?: string;
  contraindications: string;
  contraindications_ml?: string;
  food_precautions: string;
  food_precautions_ml?: string;
  storage_info: string;
  missed_dose_info: string;
  missed_dose_info_ml?: string;
  verified_source: string;
  source_reference?: string;
  last_verified_date: string;
  ingredients: MedicineIngredient[];
  brands: MedicineBrand[];
}

export interface PrescriptionMedicine {
  id: string;
  prescription: string;
  matched_medicine?: string;
  matched_medicine_detail?: Medicine;
  medicine_name: string;
  brand_name: string;
  manufacturer?: string;
  generic_name: string;
  active_ingredient: string;
  strength: string;
  dosage_form: string;
  prescribed_dose: string;
  frequency: string;
  duration: string;
  route_of_administration: string;
  special_instructions: string;
  confidence_score: number;
  ocr_uncertainty: boolean;
  uncertainty_reason?: string;
  source_text?: string;
  user_confirmed: boolean;
  user_edited: boolean;
}

export interface GeneratedReport {
  id: string;
  prescription: string;
  language: string;
  summary_content: any;
  pdf_file?: string;
  disclaimer_text: string;
  generated_at: string;
}

export interface Prescription {
  id: string;
  title: string;
  scan_category?: "PRESCRIPTION" | "PRODUCT_PACK";
  doctor_name?: string;
  clinic_name?: string;
  prescription_date?: string;
  status: "UPLOADED" | "PROCESSING" | "EXTRACTED" | "CONFIRMED" | "REVIEWED";
  original_file: string;
  file_type?: string;
  raw_extracted_text?: string;
  has_unclear_handwriting: boolean;
  uncertainty_warning?: string;
  is_shared_with_doctor: boolean;
  reviewed_by?: string;
  reviewed_by_name?: string;
  doctor_review_notes?: string;
  reviewed_at?: string;
  patient_notes?: string;
  patient_name: string;
  patient_email: string;
  medicines: PrescriptionMedicine[];
  reports: GeneratedReport[];
  created_at: string;
}

export interface DrugInteractionResult {
  status: "NO_KNOWN_INTERACTION_IN_DATABASE" | "ATTENTION_REQUIRED" | "POTENTIALLY_SERIOUS";
  summary: string;
  medicines_checked: Medicine[];
  duplicate_alerts: {
    ingredient: string;
    medicines: string[];
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }[];
  interactions: {
    id: string;
    primary_ingredient: string;
    secondary_ingredient: string;
    severity: "MINOR" | "MODERATE" | "POTENTIALLY_SERIOUS";
    description: string;
    recommendation: string;
    evidence_source: string;
    confidence_score: number;
  }[];
  disclaimer: string;
}

export interface MedicationReminder {
  id?: string;
  reminder_time: string;
  label: string;
  days_of_week: string[];
  is_enabled: boolean;
}

export interface MedicationLog {
  id: string;
  scheduled_time: string;
  status: "TAKEN" | "SKIPPED" | "MISSED";
  logged_at: string;
  notes?: string;
}

export interface MedicationSchedule {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  reminders: MedicationReminder[];
  logs: MedicationLog[];
}

export interface AIMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  message: string;
  citations: string[];
  is_emergency_flagged: boolean;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  prescription?: string;
  language: string;
  created_at: string;
  updated_at: string;
  messages: AIMessage[];
}

export interface MedicalDocument {
  id: string;
  title: string;
  category: "PRESCRIPTION" | "LAB_REPORT" | "DISCHARGE_SUMMARY" | "IMAGING" | "OTHER";
  document_file: string;
  file_type?: string;
  file_size_bytes: number;
  description?: string;
  document_date?: string;
  tags: string[];
  is_confidential: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: "REMINDER" | "INTERACTION_ALERT" | "REVIEW_NOTE" | "SYSTEM";
  is_read: boolean;
  link?: string;
  created_at: string;
}

