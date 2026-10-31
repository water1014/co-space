/**
 * Stable records for the local-first data layer.
 *
 * These types describe new stores only. Existing MemoryEntry, Echo, Imprint and
 * Zustand payloads remain unchanged until an explicit, backed-up migration.
 */
export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
}

export interface OwnerRecord extends BaseRecord {
  nickname: string;
  avatarAssetId?: string;
}

export interface CompanionRecord extends BaseRecord {
  name: string;
  avatarAssetId?: string;
  currentPersonaRevisionId: string;
}

export interface PersonaRevisionRecord extends BaseRecord {
  companionId: string;
  version: number;
  personality: string;
  speakingStyle: string;
  values: string[];
  boundaries: string[];
  sourceProjectIds: string[];
}

export interface RelationshipRecord extends BaseRecord {
  ownerId: string;
  companionId: string;
  startAt: number | null;
  status: "active" | "paused";
}

export interface RelationshipMilestoneRecord extends BaseRecord {
  relationshipId: string;
  title: string;
  description: string;
  happenedAt: number;
}

export interface ChatSessionRecord extends BaseRecord {
  title: string;
  archivedAt?: number;
}

export interface ChatMessageRecord extends BaseRecord {
  sessionId: string;
  role: "user" | "assistant" | "system" | "tool";
  parts: unknown[];
  status: "streaming" | "complete" | "cancelled";
  origin: "user" | "initiative" | "reply" | "tool";
}

export interface MemoryLinkRecord extends BaseRecord {
  memoryId: string;
  targetType: "conversation" | "journal" | "activity" | "media" | "milestone";
  targetId: string;
  relation: "source" | "related";
}

export interface JournalRecord extends BaseRecord {
  dateKey: string;
  title: string;
  content: string;
  mood: string;
}

export interface MediaAssetRecord extends BaseRecord {
  blob: Blob;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  caption: string;
}

export interface AlbumRecord extends BaseRecord {
  title: string;
  description: string;
  coverAssetId?: string;
}

export interface AlbumItemRecord extends BaseRecord {
  albumId: string;
  assetId: string;
  sortOrder: number;
}

export interface MigrationRecord extends BaseRecord {
  migrationId: string;
  status: "started" | "completed" | "failed";
  source: string;
  importedCount: number;
  error?: string;
}

export interface SettingRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}
