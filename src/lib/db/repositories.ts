import type { Table } from "dexie";
import type {
  AlbumItemRecord,
  AlbumRecord,
  BaseRecord,
  ChatMessageRecord,
  ChatSessionRecord,
  CompanionRecord,
  JournalRecord,
  MediaAssetRecord,
  MemoryLinkRecord,
  MigrationRecord,
  OwnerRecord,
  PersonaRevisionRecord,
  RelationshipMilestoneRecord,
  RelationshipRecord,
  SettingRecord,
} from "./records";
import { db } from "./schema";

/** Small storage contract shared by feature services and test doubles. */
export interface Repository<T extends BaseRecord> {
  get(id: string): Promise<T | undefined>;
  list(): Promise<T[]>;
  put(record: T): Promise<string>;
  remove(id: string): Promise<void>;
}

function repository<T extends BaseRecord>(table: Table<T, string>): Repository<T> {
  return {
    get: (id) => table.get(id),
    list: () => table.toArray(),
    put: (record) => table.put(record),
    remove: (id) => table.delete(id),
  };
}

export const repositories = {
  owners: repository<OwnerRecord>(db.owners),
  companions: repository<CompanionRecord>(db.companions),
  personaRevisions: repository<PersonaRevisionRecord>(db.personaRevisions),
  relationships: repository<RelationshipRecord>(db.relationships),
  relationshipMilestones: repository<RelationshipMilestoneRecord>(db.relationshipMilestones),
  chatSessions: repository<ChatSessionRecord>(db.chatSessions),
  chatMessages: repository<ChatMessageRecord>(db.chatMessages),
  memoryLinks: repository<MemoryLinkRecord>(db.memoryLinks),
  journals: repository<JournalRecord>(db.journals),
  mediaAssets: repository<MediaAssetRecord>(db.mediaAssets),
  albums: repository<AlbumRecord>(db.albums),
  albumItems: repository<AlbumItemRecord>(db.albumItems),
  migrations: repository<MigrationRecord>(db.migrations),
  settings: {
    get: (key: string) => db.settings.get(key),
    list: () => db.settings.toArray(),
    put: (record: SettingRecord) => db.settings.put(record),
    remove: (key: string) => db.settings.delete(key),
  },
};

/**
 * Initialize the one stable companion identity once.
 * Existing projects/personas are deliberately not merged automatically;
 * a later, user-confirmed migration will decide which text becomes the primary
 * persona. This initializer creates a neutral shell only when explicitly called.
 */
export async function ensurePrimaryIdentity(input: {
  ownerNickname?: string;
  companionName?: string;
} = {}): Promise<{ owner: OwnerRecord; companion: CompanionRecord; relationship: RelationshipRecord }> {
  const now = Date.now();
  const ownerId = "owner:primary";
  const companionId = "companion:primary";
  const relationshipId = "relationship:primary";
  const personaId = "persona:primary:v1";

  return db.transaction(
    "rw",
    db.owners,
    db.companions,
    db.personaRevisions,
    db.relationships,
    async () => {
      let owner = await db.owners.get(ownerId);
      if (!owner) {
        owner = {
          id: ownerId,
          nickname: input.ownerNickname ?? "",
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        };
        await db.owners.add(owner);
      }

      let persona = await db.personaRevisions.get(personaId);
      if (!persona) {
        persona = {
          id: personaId,
          companionId,
          version: 1,
          personality: "",
          speakingStyle: "",
          values: [],
          boundaries: [],
          sourceProjectIds: [],
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        };
        await db.personaRevisions.add(persona);
      }

      let companion = await db.companions.get(companionId);
      if (!companion) {
        companion = {
          id: companionId,
          name: input.companionName ?? "",
          currentPersonaRevisionId: personaId,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        };
        await db.companions.add(companion);
      }

      let relationship = await db.relationships.get(relationshipId);
      if (!relationship) {
        relationship = {
          id: relationshipId,
          ownerId,
          companionId,
          startAt: null,
          status: "active",
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        };
        await db.relationships.add(relationship);
      }

      return { owner, companion, relationship };
    },
  );
}


/** Append a persona revision without mutating the previous revision. */
export async function appendPersonaRevision(input: {
  companionId: string;
  personality: string;
  speakingStyle: string;
  values: string[];
  boundaries: string[];
}): Promise<PersonaRevisionRecord> {
  const now = Date.now();
  return db.transaction("rw", db.companions, db.personaRevisions, async () => {
    const companion = await db.companions.get(input.companionId);
    if (!companion) throw new Error("伴侣档案尚未初始化");
    const previous = await db.personaRevisions.get(companion.currentPersonaRevisionId);
    const version = (previous?.version ?? 0) + 1;
    const revision: PersonaRevisionRecord = {
      id: `persona:${input.companionId}:v${version}:${now}`,
      companionId: input.companionId,
      version,
      personality: input.personality.trim(),
      speakingStyle: input.speakingStyle.trim(),
      values: input.values.map((v) => v.trim()).filter(Boolean),
      boundaries: input.boundaries.map((v) => v.trim()).filter(Boolean),
      sourceProjectIds: [],
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    await db.personaRevisions.add(revision);
    await db.companions.update(input.companionId, {
      currentPersonaRevisionId: revision.id,
      updatedAt: now,
    });
    return revision;
  });
}

/** Save a selected avatar as a Blob asset; the previous asset is kept intact. */
export async function saveCompanionAvatar(input: {
  companionId: string;
  blob: Blob;
  mimeType: string;
}): Promise<string> {
  const now = Date.now();
  const assetId = `avatar:${input.companionId}:${now}`;
  await db.transaction("rw", db.mediaAssets, db.companions, async () => {
    const companion = await db.companions.get(input.companionId);
    if (!companion) throw new Error("伴侣档案尚未初始化");
    await db.mediaAssets.add({
      id: assetId, blob: input.blob, mimeType: input.mimeType,
      size: input.blob.size, caption: "伴侣头像", createdAt: now,
      updatedAt: now, schemaVersion: 1,
    });
    await db.companions.update(input.companionId, { avatarAssetId: assetId, updatedAt: now });
  });
  return assetId;
}
