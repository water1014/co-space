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
