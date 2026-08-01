export const COPYRIGHT_EVIDENCE_TYPES = [
  "original_work_url",
  "supporting_url",
  "document",
  "screenshot",
  "correspondence",
  "publisher_reference",
  "other",
] as const;

export type CopyrightEvidenceType =
  (typeof COPYRIGHT_EVIDENCE_TYPES)[number];

export interface CopyrightEvidenceReferenceRecord {
  id: string;

  caseId: string;

  evidenceType:
    CopyrightEvidenceType;

  label: string;

  referenceValue: string;

  storageObjectKey:
    string |
    null;

  sha256Digest:
    string |
    null;

  submittedAt: Date;

  createdAt: Date;
}

export interface AppendCopyrightEvidenceReferenceInput {
  caseId: string;

  evidenceType:
    CopyrightEvidenceType;

  label: string;

  referenceValue: string;

  storageObjectKey?:
    string |
    null;

  sha256Digest?:
    string |
    null;

  submittedAt: Date;
}